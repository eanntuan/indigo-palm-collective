// End-to-end tests for the split-payment flow with a fake Square, fake Resend and
// an in-memory KV. Run: npm test   (node:test)
//
// The clock is pinned (Date.now) so eligibility and due dates never drift.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import worker from '../api-worker/index.js';

const realFetch = globalThis.fetch;
const realNow = Date.now;
const at = (iso) => { Date.now = () => Date.parse(iso); };

// ── fakes ────────────────────────────────────────────────────────────────────

function makeKV() {
  const m = new Map();
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
    },
  };
}

let kv, env, calls, emails, paymentResponder, cardSeq;

beforeEach(() => {
  kv = makeKV();
  calls = [];
  emails = [];
  cardSeq = 0;
  paymentResponder = () => ({ status: 200, json: { payment: { id: 'PAY' + calls.filter(c => c.path === '/v2/payments').length, order_id: 'ORD1', status: 'COMPLETED' } } });
  env = {
    BOOKINGS: kv, DISCOUNT_CODES: makeKV(),
    SQUARE_ACCESS_TOKEN: 'sq-test', SQUARE_APPLICATION_ID: 'app-test', SQUARE_LOCATION_ID: 'LOC1', SQUARE_SANDBOX: 'true',
    RESEND_API_KEY: 'rk', ADMIN_DEBUG_KEY: 'adminkey',
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const body = init.body ? JSON.parse(init.body) : null;
    if (url.hostname === 'api.resend.com') {
      emails.push({ to: body.to, cc: body.cc, bcc: body.bcc, subject: body.subject, html: body.html });
      return new Response('{"id":"e"}', { status: 200 });
    }
    if (url.hostname.includes('squareup')) {
      calls.push({ method: init.method || 'GET', path: url.pathname, body });
      const p = url.pathname;
      const json = (o, status = 200) => new Response(JSON.stringify(o), { status });
      if (p === '/v2/customers') return json({ customer: { id: 'CUST1' } });
      if (p === '/v2/cards') return json({ card: { id: 'CARD' + (++cardSeq), last_4: '4242', card_brand: 'VISA' } });
      if (/^\/v2\/cards\/.+\/disable$/.test(p)) return json({ card: {} });
      if (p === '/v2/locations') return json({ locations: [{ id: 'LOC1' }] });
      if (p === '/v2/online-checkout/payment-links') return json({ payment_link: { url: 'https://square.link/u/test' } });
      if (p === '/v2/payments') { const r = paymentResponder(body); return json(r.json, r.status); }
      return json({}, 404);
    }
    return new Response('{}', { status: 500 }); // Hostaway etc.: non-fatal in finalize
  };
  at('2026-11-09T18:00:00Z');
});
afterEach(() => { globalThis.fetch = realFetch; Date.now = realNow; });

const sq = (path) => calls.filter(c => c.path === path);
const emailTo = (needle) => emails.filter(e => String(e.to).includes(needle));

async function seedBooking(over = {}) {
  const booking = {
    id: 'bk1', token: 'hosttoken', status: 'pending', name: 'Jennifer Guest', email: 'jennifer@example.com',
    property: 'The Sundune', propertyId: 'ps-retreat', checkIn: '2027-02-28', checkOut: '2027-03-07', guests: 2,
    pricing: { nights: 7, subtotal: 2100, cleaningFee: 200, taxRate: 0.18, taxAmount: 414, total: 2714 },
    ...over,
  };
  await kv.put(`booking:${booking.id}`, JSON.stringify(booking));
  return booking;
}

const call = async (method, path, body) => {
  const res = await worker.fetch(new Request(`https://indigopalm.co${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  }), env, { waitUntil() {} });
  let json = null; try { json = await res.clone().json(); } catch { /* html */ }
  return { status: res.status, json, res };
};
const approve = (id = 'bk1', extra = {}) => call('POST', '/api/approve', { id, token: 'hosttoken', ...extra });
const runDaily = (iso) => { at(iso); return worker.scheduled({ cron: '0 9 * * *' }, env); };
const getRec = async () => JSON.parse(await kv.get('autopay:bk1'));
const getBooking = async () => JSON.parse(await kv.get('booking:bk1'));

async function enrolled() {
  await seedBooking();
  await approve();
  const { payToken } = await getBooking();
  const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:card-nonce', consent: true });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return payToken;
}

// ── approval email offers the split only when appropriate ────────────────────

describe('approval email', () => {
  test('offers the card split with exact amounts, due date, and a private pay link', async () => {
    await seedBooking();
    const r = await approve();
    assert.equal(r.status, 200);
    const b = await getBooking();
    assert.equal(b.status, 'approved');
    assert.match(b.payToken, /^[0-9a-f]{32}$/);
    assert.notEqual(b.payToken, b.token, 'guest link must not reuse the host token');

    const html = emailTo('jennifer@')[0].html;
    assert.match(html, /Split payment by card/);
    assert.match(html, /\$1397\.71, includes 3% fee/);
    assert.match(html, /December 30, 2026/);
    assert.ok(html.includes(`/pay/?id=bk1&t=${b.payToken}`));
    assert.ok(!html.includes('hosttoken'), 'host token never appears in the guest email');
    // the existing full-payment options are untouched
    assert.match(html, /Zelle \(no fee\): \$2714\.00/);
    assert.match(html, /\$2795\.42 \(includes 3% fee\)/);
  });

  test('not offered inside 60 days of check-in', async () => {
    await seedBooking({ checkIn: '2026-12-28', checkOut: '2027-01-04' });
    await approve();
    assert.doesNotMatch(emailTo('jennifer@')[0].html, /Split payment by card/);
  });

  test('not offered when the host overrides the total (already a custom amount)', async () => {
    await seedBooking();
    await approve('bk1', { overrideTotal: 1357 });
    assert.doesNotMatch(emailTo('jennifer@')[0].html, /Split payment by card/);
  });

  test('not offered when the Square application id is not configured', async () => {
    delete env.SQUARE_APPLICATION_ID;
    await seedBooking();
    await approve();
    assert.doesNotMatch(emailTo('jennifer@')[0].html, /Split payment by card/);
  });
});

// ── guest page config + enroll ───────────────────────────────────────────────

describe('enroll', () => {
  test('config requires the private pay token', async () => {
    await seedBooking(); await approve();
    const { payToken } = await getBooking();
    assert.equal((await call('GET', '/api/autopay/config?id=bk1&t=wrong')).status, 404);
    assert.equal((await call('GET', '/api/autopay/config?id=bk1&t=hosttoken')).status, 404);
    const ok = await call('GET', `/api/autopay/config?id=bk1&t=${payToken}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.appId, 'app-test');
    assert.equal(ok.json.amounts.firstCharge, 1397.71);
    assert.equal(ok.json.dueDate, '2026-12-30');
    assert.match(ok.json.consentText, /automatically charge it \$1397\.71 on December 30, 2026/);
  });

  test('saves the card, charges 50% + 3% once, schedules the balance, confirms the booking', async () => {
    await enrolled();

    assert.equal(sq('/v2/customers').length, 1);
    assert.equal(sq('/v2/cards')[0].body.source_id, 'cnon:card-nonce');
    const pay = sq('/v2/payments');
    assert.equal(pay.length, 1);
    assert.equal(pay[0].body.amount_money.amount, 139771);
    assert.equal(pay[0].body.source_id, 'CARD1');
    assert.equal(pay[0].body.customer_id, 'CUST1');
    assert.equal(pay[0].body.idempotency_key, 'ap-first-bk1-0');

    const rec = await getRec();
    assert.equal(rec.status, 'scheduled');
    assert.equal(rec.dueDate, '2026-12-30');
    assert.equal(rec.balance.charge, 1397.71);
    assert.equal(rec.last4, '4242');
    assert.match(rec.consent.text, /automatically charge it/);
    assert.ok(rec.consent.acceptedAt);

    assert.equal((await getBooking()).status, 'confirmed');
    assert.ok(emails.some(e => /You're booked/.test(e.subject)), 'normal booking confirmation sent');
    assert.ok(emails.some(e => /payment schedule/i.test(e.subject)), 'schedule email sent');
  });

  test('requires consent, a card token and a valid pay token; no charge otherwise', async () => {
    await seedBooking(); await approve();
    const { payToken } = await getBooking();
    const base = { id: 'bk1', t: payToken, sourceId: 'cnon:x', consent: true };
    assert.equal((await call('POST', '/api/autopay/enroll', { ...base, consent: false })).status, 400);
    assert.equal((await call('POST', '/api/autopay/enroll', { ...base, sourceId: '' })).status, 400);
    assert.equal((await call('POST', '/api/autopay/enroll', { ...base, t: 'nope' })).status, 404);
    assert.equal(sq('/v2/payments').length, 0);
    assert.equal(sq('/v2/cards').length, 0);
  });

  test('enrolling twice does not charge twice', async () => {
    const payToken = await enrolled();
    const again = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:y', consent: true });
    assert.equal(again.status, 409);
    assert.equal(sq('/v2/payments').length, 1);
  });

  test('declined first charge: nothing scheduled, saved card disabled, booking stays approved', async () => {
    paymentResponder = () => ({ status: 402, json: { errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'GENERIC_DECLINE' }] } });
    await seedBooking(); await approve();
    const { payToken } = await getBooking();
    const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:x', consent: true });
    assert.equal(r.status, 402);
    assert.equal(await kv.get('autopay:bk1'), null);
    assert.equal(sq('/v2/cards/CARD1/disable').length, 1);
    assert.equal((await getBooking()).status, 'approved');
  });

  test('inside 60 days: refused, full payment due', async () => {
    await seedBooking({ checkIn: '2026-12-28', checkOut: '2027-01-04' }); await approve();
    const { payToken } = await getBooking();
    const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:x', consent: true });
    assert.equal(r.status, 409);
    assert.equal(sq('/v2/payments').length, 0);
  });
});

// ── host copy of guest emails ────────────────────────────────────────────────

describe('host copy', () => {
  test('guest emails are BCC\'d to the host; emails to the host are not duplicated', async () => {
    await seedBooking();
    await approve();
    const guest = emailTo('jennifer@')[0];
    assert.equal(guest.bcc, 'indigopalmco@gmail.com');
    for (const e of emails.filter(x => String(x.to).includes('indigopalmco@gmail.com'))) {
      assert.equal(e.bcc, undefined, e.subject);
    }
  });
});

// ── pay in full by card (no saved card, no schedule) ─────────────────────────

describe('pay in full', () => {
  test('config offers both plans when far out; full only inside 60 days', async () => {
    await seedBooking(); await approve();
    let b = await getBooking();
    let r = await call('GET', `/api/autopay/config?id=bk1&t=${b.payToken}`);
    assert.equal(r.json.splitAvailable, true);
    assert.equal(r.json.full.charge, 2795.42);
    assert.equal(r.json.amounts.firstCharge, 1397.71);

    await kv.delete('booking:bk1'); await kv.delete('autopay:bk1');
    await seedBooking({ checkIn: '2026-12-28', checkOut: '2027-01-04' }); await approve();
    b = await getBooking();
    r = await call('GET', `/api/autopay/config?id=bk1&t=${b.payToken}`);
    assert.equal(r.status, 200);
    assert.equal(r.json.splitAvailable, false);
    assert.ok(r.json.full.charge > 0);
  });

  test('charges the full total + 3% once, saves no card, and confirms the booking', async () => {
    await seedBooking(); await approve();
    const { payToken } = await getBooking();
    const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:x', plan: 'full' });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.charge, 2795.42);
    const pay = sq('/v2/payments');
    assert.equal(pay.length, 1);
    assert.equal(pay[0].body.amount_money.amount, 279542);
    assert.equal(pay[0].body.source_id, 'cnon:x');
    assert.equal(sq('/v2/cards').length, 0);
    assert.equal(sq('/v2/customers').length, 0);
    assert.equal((await getRec()).status, 'paid_full');

    const again = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:y', plan: 'full' });
    assert.equal(again.status, 409);
    assert.equal(sq('/v2/payments').length, 1);
    // and the daily job never touches it
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal(sq('/v2/payments').length, 1);
  });

  test('works inside 60 days of check-in', async () => {
    await seedBooking({ checkIn: '2026-12-28', checkOut: '2027-01-04' }); await approve();
    const { payToken } = await getBooking();
    const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:x', plan: 'full' });
    assert.equal(r.status, 200);
    assert.equal(sq('/v2/payments').length, 1);
  });

  test('declined card: nothing recorded, booking stays approved, wrong token refused', async () => {
    paymentResponder = () => ({ status: 402, json: { errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'GENERIC_DECLINE' }] } });
    await seedBooking(); await approve();
    const { payToken } = await getBooking();
    assert.equal((await call('POST', '/api/autopay/enroll', { id: 'bk1', t: 'nope', sourceId: 'c', plan: 'full' })).status, 404);
    const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:x', plan: 'full' });
    assert.equal(r.status, 402);
    assert.equal(await kv.get('autopay:bk1'), null);
    assert.equal((await getBooking()).status, 'approved');
  });
});

// ── the daily job ────────────────────────────────────────────────────────────

describe('daily balance charge', () => {
  test('charges the balance exactly once on the due date and emails a receipt', async () => {
    await enrolled();
    await runDaily('2026-12-30T09:00:00Z');
    const pay = sq('/v2/payments');
    assert.equal(pay.length, 2);
    assert.equal(pay[1].body.amount_money.amount, 139771);
    assert.equal(pay[1].body.idempotency_key, 'ap-balance-bk1-0');
    assert.equal((await getRec()).status, 'paid');
    assert.ok(emails.some(e => /Payment received/.test(e.subject)));

    await runDaily('2026-12-31T09:00:00Z'); // next day: nothing more
    assert.equal(sq('/v2/payments').length, 2);
  });

  test('does not charge before the due date; reminds the host once, 3 days ahead, with a stop link', async () => {
    await enrolled();
    await runDaily('2026-12-26T09:00:00Z');
    assert.equal(sq('/v2/payments').length, 1);
    assert.equal(emails.filter(e => /in 3 days/.test(e.subject)).length, 0);

    await runDaily('2026-12-27T09:00:00Z');
    await runDaily('2026-12-28T09:00:00Z');
    const reminders = emails.filter(e => /in 3 days/.test(e.subject));
    assert.equal(reminders.length, 1);
    assert.match(reminders[0].html, /\/api\/autopay\/cancel\?key=adminkey&id=bk1/);
    assert.equal(sq('/v2/payments').length, 1);
  });

  test('declined: marks failed, emails guest (update link) and host, retries daily during the 3-day grace, then escalates', async () => {
    await enrolled();
    paymentResponder = () => ({ status: 402, json: { errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'GENERIC_DECLINE' }] } });

    await runDaily('2026-12-30T09:00:00Z');
    let rec = await getRec();
    assert.equal(rec.status, 'failed');
    assert.equal(rec.attempt, 1);
    const { payToken } = await getBooking();
    const guestMail = emails.find(e => /did not go through/.test(e.subject));
    assert.ok(guestMail.html.includes(`/pay/?id=bk1&t=${payToken}&mode=update`));
    assert.ok(emails.some(e => /DECLINED/.test(e.subject) && String(e.to).includes('indigopalmco@')));

    await runDaily('2026-12-31T09:00:00Z');   // retry 1 (new idempotency key)
    await runDaily('2027-01-01T09:00:00Z');   // retry 2
    const keys = sq('/v2/payments').slice(1).map(c => c.body.idempotency_key);
    assert.deepEqual(keys, ['ap-balance-bk1-0', 'ap-balance-bk1-1', 'ap-balance-bk1-2']);
    assert.equal(emails.filter(e => /did not go through/.test(e.subject)).length, 1, 'guest emailed once');

    await runDaily('2027-01-03T10:00:00Z');   // grace over (3 days after failure)
    rec = await getRec();
    assert.equal(rec.status, 'needs_attention');
    assert.ok(emails.some(e => /still unpaid/.test(e.subject)));
    const n = sq('/v2/payments').length;
    await runDaily('2027-01-04T09:00:00Z');
    assert.equal(sq('/v2/payments').length, n, 'no more attempts once escalated');
  });

  test('unclear result (503): same idempotency key, then STOP and alert the host. Never retried later.', async () => {
    await enrolled();
    paymentResponder = () => ({ status: 503, json: {} });
    await runDaily('2026-12-30T09:00:00Z');
    const bal = sq('/v2/payments').slice(1);
    assert.equal(bal.length, 3);
    assert.equal(new Set(bal.map(c => c.body.idempotency_key)).size, 1, 'same key on every retry');
    assert.equal((await getRec()).status, 'needs_attention');
    assert.ok(emails.some(e => /manual check/.test(e.subject)));

    paymentResponder = () => ({ status: 200, json: { payment: { id: 'LATE' } } });
    await runDaily('2026-12-31T09:00:00Z');
    assert.equal(sq('/v2/payments').length, 1 + 3, 'no blind retry the next day');
  });

  test('an unconfirmed booking is never charged', async () => {
    await enrolled();
    const b = await getBooking();
    await kv.put('booking:bk1', JSON.stringify({ ...b, status: 'approved' }));
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal(sq('/v2/payments').length, 1);
    assert.equal((await getRec()).status, 'needs_attention');
  });

  test('runs only on the daily cron, not the 10-minute one', async () => {
    await enrolled();
    at('2026-12-30T09:10:00Z');
    await worker.scheduled({ cron: '*/10 * * * *' }, env);
    assert.equal(sq('/v2/payments').length, 1);
  });
});

// ── update card + host cancel ────────────────────────────────────────────────

describe('update card', () => {
  test('replaces the card, disables the old one, and charges immediately when a charge had failed', async () => {
    const payToken = await enrolled();
    paymentResponder = () => ({ status: 402, json: { errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'GENERIC_DECLINE' }] } });
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal((await getRec()).status, 'failed');

    paymentResponder = () => ({ status: 200, json: { payment: { id: 'PAYOK' } } });
    const r = await call('POST', '/api/autopay/update-card', { id: 'bk1', t: payToken, sourceId: 'cnon:new', consent: true });
    assert.equal(r.status, 200);
    assert.equal(r.json.charged, true);
    const rec = await getRec();
    assert.equal(rec.status, 'paid');
    assert.equal(rec.cardId, 'CARD2');
    assert.equal(sq('/v2/cards/CARD1/disable').length, 1);
  });

  test('requires the pay token and consent', async () => {
    await enrolled();
    assert.equal((await call('POST', '/api/autopay/update-card', { id: 'bk1', t: 'bad', sourceId: 'x', consent: true })).status, 404);
    const { payToken } = await getBooking();
    assert.equal((await call('POST', '/api/autopay/update-card', { id: 'bk1', t: payToken, sourceId: 'x', consent: false })).status, 400);
  });
});

describe('host controls', () => {
  test('cancel needs the admin key, disables the card, and stops all future charges', async () => {
    await enrolled();
    assert.equal((await call('POST', '/api/autopay/cancel', { id: 'bk1' })).status, 401);
    assert.equal((await call('POST', '/api/autopay/cancel?key=wrong', { id: 'bk1' })).status, 401);
    const ok = await call('POST', '/api/autopay/cancel?key=adminkey', { id: 'bk1' });
    assert.equal(ok.status, 200);
    assert.equal((await getRec()).status, 'cancelled');
    assert.equal(sq('/v2/cards/CARD1/disable').length, 1);
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal(sq('/v2/payments').length, 1);
  });

  test('cancel link opens a confirmation page (a mail scanner prefetching it cancels nothing)', async () => {
    await enrolled();
    const page = await call('GET', '/api/autopay/cancel?key=adminkey&id=bk1');
    assert.equal(page.status, 200);
    assert.match(await page.res.text(), /Stop automatic charge/);
    assert.equal((await getRec()).status, 'scheduled');
  });

  test('cannot cancel after the balance was charged; status requires the admin key', async () => {
    await enrolled();
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal((await call('POST', '/api/autopay/cancel?key=adminkey', { id: 'bk1' })).status, 409);
    assert.equal((await call('GET', '/api/autopay/status?id=bk1')).status, 401);
    const s = await call('GET', '/api/autopay/status?key=adminkey&id=bk1');
    assert.equal(s.json.record.status, 'paid');
    assert.equal(s.json.record.consent, undefined, 'consent evidence is not returned by the status endpoint');
  });
});
