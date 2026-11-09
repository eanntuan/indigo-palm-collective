// End-to-end test against SQUARE'S SANDBOX (fake money, test cards).
// Runs the real Worker code in-process with an in-memory KV, so nothing is
// deployed and no real card is ever charged. Resend, Gmail and Hostaway are
// stubbed; only Square calls go out for real.
//
//   SQUARE_SANDBOX_ACCESS_TOKEN=...  npm run test:sandbox
//
// Optional: SQUARE_SANDBOX_LOCATION_ID (otherwise the first location is used).
// Skips itself (and says so) when the token is not set.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../api-worker/index.js';

const TOKEN = process.env.SQUARE_SANDBOX_ACCESS_TOKEN;
const skip = TOKEN ? false : 'SQUARE_SANDBOX_ACCESS_TOKEN not set';
const SQ = 'https://connect.squareupsandbox.com';

const realFetch = globalThis.fetch;
const realNow = Date.now;
const emails = [];

function makeKV() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
    },
  };
}

const kv = makeKV();
const env = {
  BOOKINGS: kv, DISCOUNT_CODES: makeKV(),
  SQUARE_ACCESS_TOKEN: TOKEN, SQUARE_APPLICATION_ID: 'sandbox-app', SQUARE_SANDBOX: 'true',
  SQUARE_LOCATION_ID: process.env.SQUARE_SANDBOX_LOCATION_ID || undefined,
  RESEND_API_KEY: 'stub', ADMIN_DEBUG_KEY: 'adminkey',
};

before(() => {
  Date.now = () => Date.parse('2026-11-09T18:00:00Z');
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.hostname === 'api.resend.com') {
      const b = JSON.parse(init.body); emails.push({ to: b.to, subject: b.subject, html: b.html });
      return new Response('{"id":"stub"}', { status: 200 });
    }
    if (url.hostname === 'connect.squareupsandbox.com') return realFetch(input, init); // the real thing
    return new Response('{}', { status: 500 }); // Hostaway, Google, etc.: non-fatal
  };
});
after(() => { globalThis.fetch = realFetch; Date.now = realNow; });

const run = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let n = 0;
async function seed(over = {}) {
  const id = `e2e${run}${++n}`;
  const booking = {
    id, token: 'hosttoken', status: 'pending', name: 'Sandbox Tester', email: 'sandbox@example.com',
    property: 'The Sundune', propertyId: 'ps-retreat', checkIn: '2027-02-28', checkOut: '2027-03-07', guests: 2,
    pricing: { nights: 7, subtotal: 2100, cleaningFee: 200, taxRate: 0.18, taxAmount: 414, total: 2714 },
    ...over,
  };
  await kv.put(`booking:${id}`, JSON.stringify(booking));
  return id;
}
const call = async (method, path, body) => {
  const res = await worker.fetch(new Request(`https://indigopalm.co${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  }), env, { waitUntil() {} });
  let json = null; try { json = await res.clone().json(); } catch { /* html */ }
  return { status: res.status, json };
};
const getBooking = async (id) => JSON.parse(await kv.get(`booking:${id}`));
const getRec = async (id) => JSON.parse(await kv.get(`autopay:${id}`));
async function sqGet(path) {
  const r = await realFetch(SQ + path, { headers: { Authorization: `Bearer ${TOKEN}`, 'Square-Version': '2024-01-18' } });
  return r.json();
}
const approve = (id, extra = {}) => call('POST', '/api/approve', { id, token: 'hosttoken', ...extra });

describe('Square sandbox', { skip }, () => {
  test('approval creates a real Square payment link that includes the deposit', async () => {
    const id = await seed();
    const r = await approve(id);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.match(r.json.paymentLink || '', /^https:\/\/.*square.*\//i, 'Square accepted our payment-link request');
    assert.equal((await getBooking(id)).securityDeposit, 300);
  });

  test('pay in full with the test card charges stay + 3% + deposit', async () => {
    const id = await seed();
    await approve(id);
    const { payToken } = await getBooking(id);
    const cfg = await call('GET', `/api/autopay/config?id=${id}&t=${payToken}`);
    assert.equal(cfg.json.full.charge, 3095.42);
    const r = await call('POST', '/api/autopay/enroll', { id, t: payToken, sourceId: 'cnon:card-nonce-ok', plan: 'full' });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const rec = await getRec(id);
    assert.equal(rec.status, 'paid_full');
    const pay = await sqGet(`/v2/payments/${rec.full.paymentId}`);
    assert.equal(pay.payment.status, 'COMPLETED');
    assert.equal(pay.payment.amount_money.amount, 309542);
    assert.equal((await getBooking(id)).status, 'confirmed');
  });

  test('split: saves the card, charges the first half + deposit, then the daily job charges the balance', async () => {
    const id = await seed();
    await approve(id);
    const { payToken } = await getBooking(id);
    const r = await call('POST', '/api/autopay/enroll', { id, t: payToken, sourceId: 'cnon:card-nonce-ok', consent: true });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    let rec = await getRec(id);
    assert.equal(rec.status, 'scheduled');
    const first = await sqGet(`/v2/payments/${rec.first.paymentId}`);
    assert.equal(first.payment.status, 'COMPLETED');
    assert.equal(first.payment.amount_money.amount, 169771);

    // jump to the balance due date and run the daily job against the saved card
    Date.now = () => Date.parse(`${rec.dueDate}T17:00:00Z`);
    await worker.scheduled({ cron: '0 9 * * *' }, env);
    rec = await getRec(id);
    assert.equal(rec.status, 'paid', JSON.stringify(rec));
    const bal = await sqGet(`/v2/payments/${rec.balance.paymentId}`);
    assert.equal(bal.payment.status, 'COMPLETED');
    assert.equal(bal.payment.amount_money.amount, 139771);
    Date.now = () => Date.parse('2026-11-09T18:00:00Z');
  });

  test('a declined test card is refused and nothing is scheduled', async () => {
    const id = await seed();
    await approve(id);
    const { payToken } = await getBooking(id);
    const r = await call('POST', '/api/autopay/enroll', { id, t: payToken, sourceId: 'cnon:card-nonce-declined', consent: true });
    assert.equal(r.status, 402, JSON.stringify(r.json));
    assert.equal(await kv.get(`autopay:${id}`), null);
    assert.equal((await getBooking(id)).status, 'approved');
  });

  test('waived deposit: link and charge carry no deposit', async () => {
    const id = await seed();
    await approve(id, { waiveDeposit: true });
    const { payToken } = await getBooking(id);
    const r = await call('POST', '/api/autopay/enroll', { id, t: payToken, sourceId: 'cnon:card-nonce-ok', plan: 'full' });
    assert.equal(r.json.charge, 2795.42);
  });
});
