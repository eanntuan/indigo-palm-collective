// Guest "Your booking" page API, welcome-guide gate (48 hours before check-in) and the
// pre-arrival email, with a fake Square, fake Resend and an in-memory KV.
// Run: npm test   (node:test)

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import worker from '../api-worker/index.js';
import { pacificInstantMs, guideOpensAtMs, safeEqual, matchGuidePath, CANCELLATION_POLICY } from '../api-worker/guest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const realFetch = globalThis.fetch;
const realNow = Date.now;
const at = (iso) => { Date.now = () => Date.parse(iso); };

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

let kv, env, emails, origin;
beforeEach(() => {
  kv = makeKV();
  emails = [];
  origin = [];
  env = {
    BOOKINGS: kv, DISCOUNT_CODES: makeKV(),
    SQUARE_ACCESS_TOKEN: 'sq-test', SQUARE_APPLICATION_ID: 'app-test', SQUARE_LOCATION_ID: 'LOC1', SQUARE_SANDBOX: 'true',
    RESEND_API_KEY: 'rk', ADMIN_DEBUG_KEY: 'adminkey',
  };
  let cardSeq = 0, payN = 0;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    let body = null; try { body = init.body ? JSON.parse(init.body) : null; } catch { body = null; }
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status });
    if (url.hostname === 'api.resend.com') { emails.push({ to: body.to, subject: body.subject, html: body.html }); return json({ id: 'e' }); }
    if (url.hostname === 'indigopalm.co') { origin.push(url.pathname); return new Response('<html>GUIDE PAGE</html>', { status: 200 }); }
    if (url.hostname.includes('squareup')) {
      const p = url.pathname;
      if (p === '/v2/customers') return json({ customer: { id: 'CUSTSECRET' } });
      if (p === '/v2/cards') return json({ card: { id: 'CARDSECRET' + (++cardSeq), last_4: '4242', card_brand: 'VISA' } });
      if (/^\/v2\/cards\/.+\/disable$/.test(p)) return json({ card: {} });
      if (p === '/v2/locations') return json({ locations: [{ id: 'LOC1' }] });
      if (p === '/v2/online-checkout/payment-links') return json({ payment_link: { url: 'https://square.link/u/test' } });
      if (p === '/v2/payments') return json({ payment: { id: 'PAYSECRET' + (++payN), order_id: 'ORD1', status: 'COMPLETED' } });
      return json({}, 404);
    }
    return new Response('{}', { status: 500 });
  };
  at('2026-11-09T18:00:00Z');
});
afterEach(() => { globalThis.fetch = realFetch; Date.now = realNow; });

const emailTo = (needle) => emails.filter(e => String(e.to).includes(needle));
const TOKEN = 'a'.repeat(32);

async function seedBooking(over = {}) {
  const booking = {
    id: 'bk1', token: 'hosttoken', payToken: TOKEN, status: 'pending', name: 'Jennifer Guest', email: 'jennifer@example.com', phone: '555-0100',
    property: 'The Sundune', propertyId: 'ps-retreat', checkIn: '2027-02-28', checkOut: '2027-03-07', guests: 2,
    pricing: { nights: 7, subtotal: 2100, cleaningFee: 200, taxRate: 0.18, taxAmount: 414, total: 2714 },
    ...over,
  };
  await kv.put(`booking:${booking.id}`, JSON.stringify(booking));
  return booking;
}
const seedConfirmed = (over = {}) => seedBooking({ status: 'confirmed', finalTotal: 2714, securityDeposit: 300, totalPaid: 3014, paymentMethod: 'zelle', confirmedAt: '2026-11-09T10:00:00.000Z', ...over });

const call = async (method, p, { body, headers } = {}) => {
  const res = await worker.fetch(new Request(`https://indigopalm.co${p}`, {
    method, headers: { 'Content-Type': 'application/json', ...(headers || {}) }, body: body ? JSON.stringify(body) : undefined,
  }), env, { waitUntil() {} });
  let json = null; try { json = await res.clone().json(); } catch { /* html */ }
  return { status: res.status, json, res };
};
const view = (id = 'bk1', t = TOKEN, headers) => call('GET', `/api/guest/booking?id=${id}&t=${t}`, { headers });
const cron = (iso) => { at(iso); return worker.scheduled({ cron: '*/10 * * * *' }, env); };

// Guide opens 48 hours before the 4:00 PM Pacific check-in: Feb 26 2027 16:00 PST = Feb 27 00:00 UTC.
const OPENS = '2027-02-27T00:00:00Z';
const BEFORE = '2027-02-26T23:50:00Z';
const AFTER = '2027-02-27T00:10:00Z';

// ── time helpers ─────────────────────────────────────────────────────────────

describe('welcome guide opening time', () => {
  test('48 hours before 4:00 PM Pacific check-in, across daylight saving', () => {
    assert.equal(new Date(guideOpensAtMs('2027-02-28')).toISOString(), '2027-02-27T00:00:00.000Z'); // PST
    assert.equal(new Date(guideOpensAtMs('2027-04-10')).toISOString(), '2027-04-08T23:00:00.000Z'); // PDT
    assert.equal(new Date(pacificInstantMs('2027-03-14', 16)).toISOString(), '2027-03-14T23:00:00.000Z'); // DST starts that morning
  });
  test('constant-time compare and guide path matching', () => {
    assert.equal(safeEqual('abc', 'abc'), true);
    assert.equal(safeEqual('abc', 'abd'), false);
    assert.equal(safeEqual('abc', 'abcd'), false);
    assert.equal(safeEqual('', ''), false);
    assert.ok(matchGuidePath('/terra-luz/welcome-guide.html'));
    assert.ok(matchGuidePath('/the-sundune/welcome-guide/arrival/'));
    assert.ok(matchGuidePath('/the-sundune/welcome-guide/door-1-screen-door.webp'));
    assert.equal(matchGuidePath('/terra-luz/'), null);
    assert.equal(matchGuidePath('/terra-luz/farewell.html'), null);
  });
});

// ── GET /api/guest/booking ───────────────────────────────────────────────────

describe('GET /api/guest/booking', () => {
  test('confirmed Zelle booking: guest-safe fields only', async () => {
    await seedConfirmed();
    const r = await view();
    assert.equal(r.status, 200);
    const j = r.json;
    assert.equal(j.success, true);
    assert.equal(j.booking.property, 'The Sundune');
    assert.equal(j.booking.status, 'confirmed');
    assert.equal(j.booking.checkIn, '2027-02-28');
    assert.equal(j.booking.nights, 7);
    assert.equal(j.booking.guests, 2);
    assert.equal(j.booking.guestFirstName, 'Jennifer');
    assert.equal(j.booking.checkOutTime, '11:00 AM');
    assert.match(j.booking.address, /Palm Springs/);
    assert.deepEqual(j.payment.deposit, { amount: 300, refundable: true, note: j.payment.deposit.note });
    assert.match(j.payment.deposit.note, /refundable/);
    assert.equal(j.payment.paid[0].amount, 3014);
    assert.equal(j.payment.balance, null);
    assert.equal(j.links.updateCard, null);
    assert.equal(j.links.contactEmail, 'indigopalmco@gmail.com');
    assert.equal(j.policy.cancellation, CANCELLATION_POLICY);
    assert.match(j.policy.cancellation, /60 or more days before check-in for a full refund/);
    assert.match(j.policy.cancellation, /3% card processing fee, which is not refundable/);
    assert.equal(r.res.headers.get('Cache-Control'), 'private, no-store');

    const raw = JSON.stringify(j);
    for (const secret of ['hosttoken', 'adminkey', 'jennifer@example.com', '555-0100', 'token"', 'ADMIN']) {
      assert.ok(!raw.includes(secret), `response must not contain ${secret}`);
    }
  });

  test('split booking: schedule, card last4, update-card link; no Square ids or consent data', async () => {
    await seedBooking();
    const a = await call('POST', '/api/approve', { body: { id: 'bk1', token: 'hosttoken', waiveDeposit: false } });
    assert.equal(a.status, 200);
    const b = JSON.parse(await kv.get('booking:bk1'));
    const e = await call('POST', '/api/autopay/enroll', { body: { id: 'bk1', t: b.payToken, sourceId: 'cnon:x', consent: true } });
    assert.equal(e.status, 200, JSON.stringify(e.json));

    const r = await view('bk1', b.payToken, { 'CF-Connecting-IP': '1.2.3.4' });
    assert.equal(r.status, 200);
    const j = r.json;
    assert.equal(j.booking.status, 'confirmed');
    assert.equal(j.payment.plan, 'split');
    assert.equal(j.payment.deposit.amount, 300);
    assert.equal(j.payment.paid.length, 1);
    assert.equal(j.payment.balance.status, 'scheduled');
    assert.equal(j.payment.balance.dueDate, '2026-12-30');
    assert.equal(j.payment.balance.last4, '4242');
    assert.ok(j.payment.balance.amount > 1300 && j.payment.balance.amount < 1500);
    assert.equal(j.links.updateCard, `https://indigopalm.co/pay/?id=bk1&t=${b.payToken}&mode=update`);

    const raw = JSON.stringify(j);
    for (const secret of ['CUSTSECRET', 'CARDSECRET', 'PAYSECRET', 'hosttoken', 'adminkey', '1.2.3.4', 'userAgent', 'consent']) {
      assert.ok(!raw.includes(secret), `response must not contain ${secret}`);
    }
  });

  test('invalid, missing, wrong and host tokens all get the same 404', async () => {
    await seedConfirmed();
    const bad = [view('bk1', 'b'.repeat(32)), view('bk1', 'hosttoken'), view('nope', TOKEN), call('GET', '/api/guest/booking'), view('bk1', '')];
    for (const p of bad) {
      const r = await p;
      assert.equal(r.status, 404);
      assert.deepEqual(r.json, { success: false, error: 'This booking link is not valid.' });
    }
  });

  test('a booking with no payToken cannot be opened with an empty token', async () => {
    await seedConfirmed({ payToken: undefined });
    assert.equal((await view('bk1', '')).status, 404);
  });

  test('repeated bad guesses from one address are rate limited; good requests are never counted', async () => {
    await seedConfirmed();
    const h = { 'CF-Connecting-IP': '9.9.9.9' };
    for (let i = 0; i < 40; i++) await view('bk1', 'c'.repeat(32), h);
    assert.equal((await view('bk1', TOKEN, h)).status, 429);
    assert.equal((await view('bk1', TOKEN, { 'CF-Connecting-IP': '8.8.8.8' })).status, 200);
    for (let i = 0; i < 40; i++) assert.equal((await view('bk1', TOKEN, { 'CF-Connecting-IP': '7.7.7.7' })).status, 200);
  });

  test('POST is not allowed', async () => {
    await seedConfirmed();
    assert.equal((await call('POST', '/api/guest/booking?id=bk1&t=' + TOKEN)).status, 405);
  });

  test('welcome guide link in the response reports whether it is open yet', async () => {
    await seedConfirmed();
    at(BEFORE);
    let g = (await view()).json.links.welcomeGuide;
    assert.equal(g.available, false);
    assert.equal(g.opensAtLabel, 'Friday, February 26 at 4:00 PM Pacific');
    assert.ok(g.url.includes(`b=bk1&t=${TOKEN}`));
    at(AFTER);
    g = (await view()).json.links.welcomeGuide;
    assert.equal(g.available, true);
  });
});

// ── welcome guide gate ───────────────────────────────────────────────────────

describe('welcome guide gate', () => {
  const guide = (p, headers) => call('GET', p, { headers });

  test('before 48 hours: friendly page, nothing fetched from the site', async () => {
    await seedConfirmed();
    at(BEFORE);
    const r = await guide(`/ps-retreat/welcome-guide.html?b=bk1&t=${TOKEN}`);
    const html = await r.res.text();
    assert.equal(r.status, 200);
    assert.match(html, /opens 48 hours before check-in, on <strong>Friday, February 26 at 4:00 PM Pacific/);
    assert.ok(html.includes(`/booking/?id=bk1&amp;t=${TOKEN}`));
    assert.doesNotMatch(html, /GUIDE PAGE/);
    assert.deepEqual(origin, []);
    assert.ok(!r.res.headers.get('Set-Cookie'));
    assert.match(r.res.headers.get('Cache-Control'), /no-store/);
  });

  test('from 48 hours before check-in it is served, and a cookie unlocks the rest of the guide', async () => {
    await seedConfirmed();
    at(AFTER);
    const r = await guide(`/ps-retreat/welcome-guide.html?b=bk1&t=${TOKEN}`);
    assert.equal(await r.res.text(), '<html>GUIDE PAGE</html>');
    const cookie = r.res.headers.get('Set-Cookie');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    const c = cookie.split(';')[0];
    const sub = await guide('/the-sundune/welcome-guide/arrival/', { Cookie: c });
    assert.equal(await sub.res.text(), '<html>GUIDE PAGE</html>');
    // the same cookie is held back again if the clock were earlier (it only carries credentials)
    at(BEFORE);
    const early = await guide('/the-sundune/welcome-guide/arrival/', { Cookie: c });
    assert.doesNotMatch(await early.res.text(), /GUIDE PAGE/);
  });

  test('no credentials, wrong token, wrong property, unconfirmed booking: not served', async () => {
    await seedConfirmed();
    await seedBooking({ id: 'bk2', payToken: 'd'.repeat(32), status: 'approved' });
    at(AFTER);
    const cases = [
      '/ps-retreat/welcome-guide.html',
      `/ps-retreat/welcome-guide.html?b=bk1&t=${'e'.repeat(32)}`,
      `/terra-luz/welcome-guide.html?b=bk1&t=${TOKEN}`,
      `/the-well/welcome-book.pdf?b=bk1&t=${TOKEN}`,
      `/ps-retreat/welcome-guide.html?b=bk2&t=${'d'.repeat(32)}`,
    ];
    for (const p of cases) {
      const r = await guide(p);
      assert.equal(r.status, 404, p);
      assert.doesNotMatch(await r.res.text(), /GUIDE PAGE/);
    }
    assert.deepEqual(origin, []);
  });

  test('Airbnb message links (/go/welcome-*) keep working', async () => {
    at(BEFORE);
    const r = await guide('/terra-luz/welcome-guide.html?utm_source=airbnb&utm_medium=message&utm_campaign=guest-comms');
    assert.equal(await r.res.text(), '<html>GUIDE PAGE</html>');
  });

  test('other pages are untouched', async () => {
    const r = await guide('/terra-luz/farewell.html');
    assert.equal(await r.res.text(), '<html>GUIDE PAGE</html>');
    assert.ok(!r.res.headers.get('Set-Cookie'));
  });
});

// ── pre-arrival email ────────────────────────────────────────────────────────

describe('pre-arrival email', () => {
  async function confirmed(over) {
    await seedConfirmed(over);
    await kv.put('welcome:bk1', JSON.stringify({ bookingId: 'bk1', propertyId: over?.propertyId || 'ps-retreat', name: 'Jennifer Guest', email: 'jennifer@example.com', checkIn: over?.checkIn || '2027-02-28', checkOut: over?.checkOut || '2027-03-07', nights: 7, guests: 2, sendDate: '2027-02-26', sent: false }));
  }

  test('not sent before the guide opens, sent once after, with guide and booking links', async () => {
    await confirmed();
    await cron('2027-02-26T12:00:00Z'); // the old UTC "sendDate" has arrived but the guide is not open yet
    assert.equal(emailTo('jennifer@').length, 0);
    await cron(BEFORE);
    assert.equal(emailTo('jennifer@').length, 0);

    await cron(AFTER);
    const mail = emailTo('jennifer@');
    assert.equal(mail.length, 1);
    assert.match(mail[0].subject, /Your welcome guide: PS Retreat/);
    assert.ok(mail[0].html.includes(`/ps-retreat/welcome-guide.html?b=bk1&amp;t=${TOKEN}`));
    assert.ok(mail[0].html.includes(`https://indigopalm.co/booking/?id=bk1&amp;t=${TOKEN}`));
    assert.match(mail[0].html, /4:00 PM/);
    assert.match(mail[0].html, /border-radius:999px/);
    assert.ok(!mail[0].html.includes('hosttoken'));

    await cron('2027-02-27T06:00:00Z');
    assert.equal(emailTo('jennifer@').length, 1, 'only once');
    assert.equal(JSON.parse(await kv.get('welcome:bk1')).sent, true);
  });

  test('Terra Luz email includes the door codes and a working guide link', async () => {
    await confirmed({ propertyId: 'terra-luz', property: 'Terra Luz', checkIn: '2027-04-10', checkOut: '2027-04-13' });
    await cron('2027-04-08T22:50:00Z');
    assert.equal(emailTo('jennifer@').length, 0);
    await cron('2027-04-08T23:10:00Z'); // PDT: opens 23:00 UTC
    const mail = emailTo('jennifer@')[0];
    assert.ok(mail, 'sent after the PDT opening time');
    assert.match(mail.html, /Front door/);
    assert.ok(mail.html.includes(`/terra-luz/welcome-guide.html?b=bk1&amp;t=${TOKEN}`));
  });

  test('cancelled bookings get no email', async () => {
    await confirmed({ status: 'cancelled' });
    await cron(AFTER);
    assert.equal(emailTo('jennifer@').length, 0);
  });

  test('the link in the email opens the guide at that moment, the same instant the email is sent', async () => {
    await confirmed();
    await cron(AFTER);
    const link = emailTo('jennifer@')[0].html.match(/href="(https:\/\/indigopalm\.co\/ps-retreat\/welcome-guide\.html\?[^"]+)"/)[1];
    const u = new URL(link.replace(/&amp;/g, '&'));
    const r = await call('GET', u.pathname + u.search);
    assert.equal(await r.res.text(), '<html>GUIDE PAGE</html>');
  });
});

// ── links in the other guest emails ──────────────────────────────────────────

describe('booking page link in guest emails', () => {
  test('booking confirmation (Zelle path) and autopay schedule email both link to /booking/', async () => {
    await seedBooking();
    await call('POST', '/api/approve', { body: { id: 'bk1', token: 'hosttoken', waiveDeposit: true } });
    const b = JSON.parse(await kv.get('booking:bk1'));
    emails.length = 0;

    const e = await call('POST', '/api/autopay/enroll', { body: { id: 'bk1', t: b.payToken, sourceId: 'cnon:x', consent: true } });
    assert.equal(e.status, 200);
    const link = `https://indigopalm.co/booking/?id=bk1&amp;t=${b.payToken}`;
    const schedule = emails.find(m => /payment schedule/.test(m.subject));
    const confirm = emails.find(m => /You're booked/.test(m.subject) && String(m.to).includes('jennifer@'));
    assert.ok(schedule.html.includes(link), 'autopay schedule email');
    assert.ok(confirm.html.includes(link), 'booking confirmation email');
    assert.match(confirm.html, /View your booking/);
    assert.ok(!schedule.html.includes('hosttoken') && !confirm.html.includes('hosttoken'));
  });

  test('manual (Zelle) confirmation creates a payToken if the record had none and links to it', async () => {
    await seedBooking({ payToken: undefined, status: 'approved', finalTotal: 2714, securityDeposit: 0 });
    const r = await call('POST', '/api/confirm-payment?key=adminkey', { body: { id: 'bk1', token: 'hosttoken', totalPaid: 2714, method: 'zelle' } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const b = JSON.parse(await kv.get('booking:bk1'));
    assert.match(b.payToken, /^[0-9a-f]{32}$/);
    assert.ok(emailTo('jennifer@')[0].html.includes(`/booking/?id=bk1&amp;t=${b.payToken}`));
  });
});

// ── the static page ──────────────────────────────────────────────────────────

describe('booking/index.html', () => {
  const html = readFileSync(path.join(ROOT, 'booking/index.html'), 'utf8');
  test('private, branded, pill buttons, no accent bars, text set with textContent', () => {
    assert.match(html, /noindex, nofollow/);
    assert.match(html, /\/api\/guest\/booking\?id=/);
    assert.match(html, /\.btn \{[^}]*border-radius:999px/);
    assert.match(html, /Cormorant Garamond/);
    assert.match(html, /#647C69/);
    assert.doesNotMatch(html, /border-(left|top):\s*\d+px solid/);
    assert.doesNotMatch(html, /innerHTML/);
  });
});
