import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handleSendPayLink } from '../api-worker/paylink.js';

function makeKV() { const m = new Map(); return { m, async get(k) { return m.has(k) ? m.get(k) : null; }, async put(k, v) { m.set(k, v); } }; }
let kv, env, sent, deps;
beforeEach(() => {
  kv = makeKV(); sent = [];
  env = { BOOKINGS: kv, RESEND_API_KEY: 'rk', SQUARE_ACCESS_TOKEN: 'sq', SQUARE_APPLICATION_ID: 'app' };
  deps = { CORS_HEADERS: {}, sendEmail: async (_k, m) => { sent.push(m); }, emailWrapper: h => h, detailRow: (a, b) => `<tr>${a}:${b}</tr>`, fmtDate: d => d };
});
// Approved before the pay page existed: no payToken, no securityDeposit field (deposit was waived).
const booking = (o = {}) => ({ id: 'j1', token: 'tok', status: 'approved', name: 'Jennifer Mitchell', email: 'jen@example.com',
  property: 'The Sundune', checkIn: '2099-02-28', checkOut: '2099-03-07', finalTotal: 2451.6, ...o });
const req = (b) => new Request('https://x/api/send-pay-link', { method: 'POST', body: JSON.stringify(b) });

describe('send-pay-link', () => {
  test('creates the pay token, returns split and full amounts, sends nothing by default', async () => {
    await kv.put('booking:j1', JSON.stringify(booking()));
    const r = await handleSendPayLink(req({ id: 'j1', token: 'tok' }), env, deps);
    const j = await r.json();
    assert.equal(r.status, 200);
    const saved = JSON.parse(await kv.get('booking:j1'));
    assert.ok(saved.payToken && saved.payToken.length >= 32);
    assert.equal(j.link, `https://indigopalm.co/pay/?id=j1&t=${saved.payToken}&plan=split`);
    assert.equal(j.splitAvailable, true);
    assert.equal(j.amounts.first, 1262.57);   // 1225.80 + 3% fee, no deposit
    assert.equal(j.amounts.balance, 1262.57);
    assert.equal(j.amounts.full, 2525.15);
    assert.equal(sent.length, 0);
  });
  test('keeps the existing token and can email the guest (host copied)', async () => {
    await kv.put('booking:j1', JSON.stringify(booking({ payToken: 'p'.repeat(32) })));
    const j = await (await handleSendPayLink(req({ id: 'j1', token: 'tok', email: true }), env, deps)).json();
    assert.ok(j.link.includes('t=' + 'p'.repeat(32)));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'jen@example.com');
    assert.equal(sent[0].cc, 'indigopalmco@gmail.com');
    assert.match(sent[0].html, /1262\.57/);
    assert.match(sent[0].html, /save your card/);
    assert.match(sent[0].html, /plan=split/);
    assert.doesNotMatch(sent[0].html, /Pay in full today/);
    assert.match(sent[0].html, /Card fee \(3%\):\$73\.55/);
    assert.match(sent[0].html, /border-radius:999px/);
  });
  test('inside 60 days only pay-in-full is offered', async () => {
    const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    await kv.put('booking:j1', JSON.stringify(booking({ checkIn: soon })));
    const j = await (await handleSendPayLink(req({ id: 'j1', token: 'tok' }), env, deps)).json();
    assert.equal(j.splitAvailable, false);
    assert.equal(j.amounts.first, null);
  });
  test('includes a deposit when the booking has one', async () => {
    await kv.put('booking:j1', JSON.stringify(booking({ securityDeposit: 300 })));
    const j = await (await handleSendPayLink(req({ id: 'j1', token: 'tok' }), env, deps)).json();
    assert.equal(j.amounts.full, 2825.15);
    assert.equal(j.amounts.first, 1562.57);
  });
  test('refuses wrong token, unknown, pending or confirmed bookings, and missing Square config', async () => {
    await kv.put('booking:j1', JSON.stringify(booking()));
    await kv.put('booking:c1', JSON.stringify(booking({ id: 'c1', status: 'confirmed' })));
    assert.equal((await handleSendPayLink(req({ id: 'j1', token: 'bad' }), env, deps)).status, 403);
    assert.equal((await handleSendPayLink(req({ id: 'nope', token: 'tok' }), env, deps)).status, 404);
    assert.equal((await handleSendPayLink(req({ id: 'c1', token: 'tok' }), env, deps)).status, 400);
    assert.equal((await handleSendPayLink(req({ id: 'j1', token: 'tok' }), { ...env, SQUARE_ACCESS_TOKEN: undefined }, deps)).status, 500);
  });
});
test('the route needs the admin key', async () => {
  const { default: worker } = await import('../api-worker/index.js');
  const r = await worker.fetch(new Request('https://indigopalm.co/api/send-pay-link', { method: 'POST', body: '{}' }),
    { BOOKINGS: makeKV(), ADMIN_DEBUG_KEY: 'k' }, { waitUntil() {} });
  assert.equal(r.status, 401);
});
