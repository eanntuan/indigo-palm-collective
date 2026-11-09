// Zelle/check/cash balance reminders and the "record balance payment" endpoint.
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { balanceInfo, reminderStage, processZelleReminders, handleBalanceReceived } from '../api-worker/zelle-balance.js';

function makeKV() {
  const m = new Map();
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, v); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; },
  };
}

let kv, env, sent, deps;
beforeEach(() => {
  kv = makeKV(); sent = [];
  env = { BOOKINGS: kv, RESEND_API_KEY: 'rk', ADMIN_DEBUG_KEY: 'adminkey' };
  deps = {
    CORS_HEADERS: { 'Content-Type': 'application/json' },
    sendEmail: async (_k, m) => { sent.push(m); },
    emailWrapper: (h) => h,
    detailRow: (a, b) => `<tr>${a}:${b}</tr>`,
    fmtDate: (d) => d,
  };
});

// Sundune stay Feb 28 2027: balance due 2026-12-30.
const booking = (over = {}) => ({
  id: 'z1', token: 'tok', status: 'confirmed', name: 'Jennifer Guest', email: 'jen@example.com',
  property: 'The Sundune', propertyId: 'ps-retreat', checkIn: '2027-02-28', checkOut: '2027-03-07',
  finalTotal: 2000, securityDeposit: 300, totalPaid: 1150, paymentMethod: 'zelle', approvedAt: '2026-11-10T00:00:00Z',
  ...over,
});
const ms = (iso) => Date.parse(iso + 'T09:00:00Z');

describe('balanceInfo', () => {
  test('owed = stay + deposit minus what was paid', () => {
    const i = balanceInfo(booking());
    assert.equal(i.remaining, 1150);
    assert.equal(i.dueDate, '2026-12-30');
  });
  test('nothing to chase when paid in full, paid by card, unconfirmed, or approved before the cutoff', () => {
    assert.equal(balanceInfo(booking({ totalPaid: 2300 })), null);
    assert.equal(balanceInfo(booking({ paymentMethod: 'square' })), null);
    assert.equal(balanceInfo(booking({ status: 'approved' })), null);
    assert.equal(balanceInfo(booking({ approvedAt: '2026-10-01T00:00:00Z' })), null);
    assert.equal(balanceInfo(booking({ finalTotal: undefined })), null);
  });
});

describe('reminderStage', () => {
  const info = balanceInfo(booking());
  test('d14 from 14 days out, d3 from 3 days out, overdue the day after', () => {
    assert.equal(reminderStage(info, '2026-12-15'), null);
    assert.equal(reminderStage(info, '2026-12-16'), 'd14');
    assert.equal(reminderStage(info, '2026-12-26'), 'd14');
    assert.equal(reminderStage(info, '2026-12-27'), 'd3');
    assert.equal(reminderStage(info, '2026-12-30'), 'd3');
    assert.equal(reminderStage(info, '2026-12-31'), 'overdue');
  });
});

describe('daily reminder job', () => {
  test('emails the guest (cc host) once per stage, then the host when overdue', async () => {
    await kv.put('booking:z1', JSON.stringify(booking()));
    await processZelleReminders(env, deps, ms('2026-12-16'));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'jen@example.com');
    assert.equal(sent[0].cc, 'indigopalmco@gmail.com');
    assert.match(sent[0].html, /1150\.00/);
    assert.match(sent[0].html, /214-606-1340/);
    await processZelleReminders(env, deps, ms('2026-12-17')); // same stage: no repeat
    assert.equal(sent.length, 1);
    await processZelleReminders(env, deps, ms('2026-12-27'));
    assert.equal(sent.length, 2);
    await processZelleReminders(env, deps, ms('2026-12-31'));
    assert.equal(sent.length, 3);
    assert.equal(sent[2].to, 'indigopalmco@gmail.com');
    assert.match(sent[2].subject, /Balance overdue/);
    assert.match(sent[2].html, /key=adminkey/);
    await processZelleReminders(env, deps, ms('2027-01-02'));
    assert.equal(sent.length, 3);
  });

  test('booking confirmed late gets only the current stage, never the missed ones', async () => {
    await kv.put('booking:z1', JSON.stringify(booking()));
    await processZelleReminders(env, deps, ms('2026-12-28'));
    await processZelleReminders(env, deps, ms('2026-12-29'));
    assert.equal(sent.length, 1);
    assert.match(sent[0].subject, /due soon/);
  });

  test('skips paid-in-full, card/autopay bookings and bookings with an active autopay record', async () => {
    await kv.put('booking:a', JSON.stringify(booking({ id: 'a', totalPaid: 2300 })));
    await kv.put('booking:b', JSON.stringify(booking({ id: 'b', paymentMethod: 'square' })));
    await kv.put('booking:c', JSON.stringify(booking({ id: 'c' })));
    await kv.put('autopay:c', JSON.stringify({ status: 'scheduled' }));
    await processZelleReminders(env, deps, ms('2026-12-27'));
    assert.equal(sent.length, 0);
  });

  test('one bad record does not stop the others', async () => {
    await kv.put('booking:bad', '{not json');
    await kv.put('booking:z1', JSON.stringify(booking()));
    await processZelleReminders(env, deps, ms('2026-12-27'));
    assert.equal(sent.length, 1);
  });
});

describe('/api/balance-received', () => {
  const req = (body) => new Request('https://indigopalm.co/api/balance-received', { method: 'POST', body: JSON.stringify(body) });
  test('records the payment, emails a receipt, and stops the reminders', async () => {
    await kv.put('booking:z1', JSON.stringify(booking()));
    const r = await handleBalanceReceived(req({ id: 'z1', token: 'tok', amount: 1150, method: 'zelle' }), env, deps);
    const j = await r.json();
    assert.equal(r.status, 200);
    assert.equal(j.totalPaid, 2300);
    assert.equal(j.remaining, 0);
    assert.match(sent[0].subject, /paid in full/);
    await processZelleReminders(env, deps, ms('2026-12-31'));
    assert.equal(sent.length, 1, 'no overdue alert after payment');
    assert.equal(JSON.parse(await kv.get('booking:z1')).balancePayments.length, 1);
  });
  test('partial payment keeps the remainder open', async () => {
    await kv.put('booking:z1', JSON.stringify(booking()));
    const j = await (await handleBalanceReceived(req({ id: 'z1', token: 'tok', amount: 500 }), env, deps)).json();
    assert.equal(j.remaining, 650);
  });
  test('rejects a wrong token, bad amount, unknown booking, or unconfirmed booking', async () => {
    await kv.put('booking:z1', JSON.stringify(booking()));
    await kv.put('booking:p', JSON.stringify(booking({ id: 'p', status: 'approved' })));
    assert.equal((await handleBalanceReceived(req({ id: 'z1', token: 'nope', amount: 10 }), env, deps)).status, 403);
    assert.equal((await handleBalanceReceived(req({ id: 'z1', token: 'tok', amount: -5 }), env, deps)).status, 400);
    assert.equal((await handleBalanceReceived(req({ id: 'zz', token: 'tok', amount: 10 }), env, deps)).status, 404);
    assert.equal((await handleBalanceReceived(req({ id: 'p', token: 'tok', amount: 10 }), env, deps)).status, 400);
    assert.equal(JSON.parse(await kv.get('booking:z1')).totalPaid, 1150);
  });
});

test('the route refuses calls without the admin key', async () => {
  const { default: worker } = await import('../api-worker/index.js');
  const r = await worker.fetch(new Request('https://indigopalm.co/api/balance-received', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'z1', token: 'tok', amount: 10 }),
  }), { BOOKINGS: makeKV(), ADMIN_DEBUG_KEY: 'adminkey' }, { waitUntil() {} });
  assert.equal(r.status, 401);
});
