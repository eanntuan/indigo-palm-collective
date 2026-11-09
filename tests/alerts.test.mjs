// Push alerts, daily-cron heartbeat, /api/health and /api/ping.
// Same fake KV / Square / Resend approach as autopay-flow.test.mjs, plus a fake push service.
// Run: npm test   (node:test)

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import worker from '../api-worker/index.js';
import { pushAlert } from '../api-worker/alerts.js';

const realFetch = globalThis.fetch;
const realNow = Date.now;
const at = (iso) => { Date.now = () => Date.parse(iso); };
const b64u = (u8) => Buffer.from(u8).toString('base64url');

function makeKV() {
  const m = new Map();
  return {
    m,
    async get(k, opts) { if (!m.has(k)) return null; const v = m.get(k); return opts && opts.type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
    },
  };
}

let kv, env, calls, emails, pushes, paymentResponder, pushResponder, subscription;

async function makeSubscription() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  return { endpoint: 'https://push.example.test/send/abc', keys: { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) } };
}

beforeEach(async () => {
  kv = makeKV(); calls = []; emails = []; pushes = [];
  paymentResponder = () => ({ status: 200, json: { payment: { id: 'PAY1', order_id: 'ORD1', status: 'COMPLETED' } } });
  pushResponder = () => new Response('', { status: 201 });
  subscription = await makeSubscription();
  env = {
    BOOKINGS: kv, DISCOUNT_CODES: makeKV(),
    SQUARE_ACCESS_TOKEN: 'sq-test', SQUARE_APPLICATION_ID: 'app-test', SQUARE_LOCATION_ID: 'LOC1', SQUARE_SANDBOX: 'true',
    RESEND_API_KEY: 'rk', ADMIN_DEBUG_KEY: 'adminkey',
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    let body = null; try { body = init.body ? JSON.parse(init.body) : null; } catch { body = null; }
    if (url.hostname === 'push.example.test') { pushes.push({ url: url.href, headers: init.headers }); return pushResponder(); }
    if (url.hostname === 'api.resend.com') { emails.push({ to: body.to, subject: body.subject }); return new Response('{"id":"e"}', { status: 200 }); }
    if (url.hostname === 'oauth2.googleapis.com') return new Response(JSON.stringify({ access_token: 'gtok', expires_in: 3600 }), { status: 200 });
    if (url.hostname === 'gmail.googleapis.com') return new Response('{"id":"m1"}', { status: 200 });
    if (url.hostname.includes('squareup')) {
      calls.push({ path: url.pathname, body });
      const json = (o, status = 200) => new Response(JSON.stringify(o), { status });
      const p = url.pathname;
      if (p === '/v2/customers') return json({ customer: { id: 'CUST1' } });
      if (p === '/v2/cards') return json({ card: { id: 'CARD1', last_4: '4242', card_brand: 'VISA' } });
      if (p === '/v2/online-checkout/payment-links') return json({ payment_link: { url: 'https://square.link/u/test' } });
      if (p === '/v2/locations') return json({ locations: [{ id: 'LOC1' }] });
      if (p === '/v2/payments') { const r = paymentResponder(body); return json(r.json, r.status); }
      return json({}, 404);
    }
    return new Response('{}', { status: 500 });
  };
  at('2026-11-09T18:00:00Z');
});
afterEach(() => { globalThis.fetch = realFetch; Date.now = realNow; });

const call = async (method, path, body) => {
  const res = await worker.fetch(new Request(`https://indigopalm.co${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  }), env, { waitUntil() {} });
  let json = null; try { json = await res.clone().json(); } catch { /* html */ }
  return { status: res.status, json, res };
};
const runDaily = (iso) => { at(iso); return worker.scheduled({ cron: '0 9 * * *' }, env); };
const getRec = async () => JSON.parse(await kv.get('autopay:bk1'));

async function enrolled() {
  const booking = {
    id: 'bk1', token: 'hosttoken', status: 'pending', name: 'Jennifer Guest', email: 'jennifer@example.com',
    property: 'The Sundune', propertyId: 'ps-retreat', checkIn: '2027-02-28', checkOut: '2027-03-07', guests: 2,
    pricing: { nights: 7, subtotal: 2100, cleaningFee: 200, taxRate: 0.18, taxAmount: 414, total: 2714 },
  };
  await kv.put('booking:bk1', JSON.stringify(booking));
  await call('POST', '/api/approve', { id: 'bk1', token: 'hosttoken', waiveDeposit: true });
  const { payToken } = JSON.parse(await kv.get('booking:bk1'));
  const r = await call('POST', '/api/autopay/enroll', { id: 'bk1', t: payToken, sourceId: 'cnon:card-nonce', consent: true });
  assert.equal(r.status, 200, JSON.stringify(r.json));
}

const decline = () => { paymentResponder = () => ({ status: 402, json: { errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'GENERIC_DECLINE' }] } }); };

describe('push alerts on autopay problems', () => {
  test('a declined balance charge sends a push to the saved subscription (and still emails)', async () => {
    await enrolled();
    await kv.put('push_subscription', JSON.stringify(subscription));
    decline();
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal((await getRec()).status, 'failed');
    assert.equal(pushes.length, 1);
    assert.equal(pushes[0].url, subscription.endpoint);
    assert.match(pushes[0].headers.Authorization, /^vapid t=/);
    assert.ok(emails.some(e => /DECLINED/.test(e.subject)));
  });

  test('grace period expiry and needs_attention also push; the 3-day reminder does not', async () => {
    await enrolled();
    await kv.put('push_subscription', JSON.stringify(subscription));
    await runDaily('2026-12-27T09:00:00Z'); // reminder day
    assert.ok(emails.some(e => /in 3 days/.test(e.subject)));
    assert.equal(pushes.length, 0, 'reminder is not a problem');

    decline();
    await runDaily('2026-12-30T09:00:00Z');           // declined -> 1 push
    await runDaily('2027-01-03T10:00:00Z');           // grace expired -> needs_attention -> 1 push
    assert.equal((await getRec()).status, 'needs_attention');
    assert.equal(pushes.length, 2);
  });

  test('push service error (500) does not break the charge flow', async () => {
    await enrolled();
    await kv.put('push_subscription', JSON.stringify(subscription));
    pushResponder = () => new Response('boom', { status: 500 });
    decline();
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal(pushes.length, 1);
    assert.equal((await getRec()).status, 'failed');
    assert.ok(emails.some(e => /DECLINED/.test(e.subject)), 'host email still sent');
    assert.ok(emails.some(e => /did not go through/.test(e.subject)), 'guest email still sent');
  });

  test('push that throws (network error) does not break the charge flow', async () => {
    await enrolled();
    await kv.put('push_subscription', JSON.stringify(subscription));
    pushResponder = () => { throw new Error('network down'); };
    decline();
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal((await getRec()).status, 'failed');
    assert.ok(emails.some(e => /DECLINED/.test(e.subject)));
  });

  test('no subscription saved: no push attempt, flow unchanged', async () => {
    await enrolled();
    decline();
    await runDaily('2026-12-30T09:00:00Z');
    assert.equal(pushes.length, 0);
    assert.equal((await getRec()).status, 'failed');
  });

  test('pushAlert swallows a throwing helper and tolerates missing deps', async () => {
    assert.equal(await pushAlert(env, { sendWebPush: async () => { throw new Error('x'); } }, 't', 'b'), false);
    assert.equal(await pushAlert(env, {}, 't', 'b'), false);
    assert.equal(await pushAlert(env, { sendWebPush: async () => true }, 't', 'b'), true);
  });
});

describe('/api/ping', () => {
  test('is public and returns only {ok:true}', async () => {
    const r = await call('GET', '/api/ping');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { ok: true });
  });
});

describe('/api/health', () => {
  test('requires the admin key', async () => {
    assert.equal((await call('GET', '/api/health')).status, 401);
    assert.equal((await call('GET', '/api/health?key=wrong')).status, 401);
    assert.equal((await call('GET', '/api/health?key=adminkey')).status, 200);
  });

  test('is closed when no admin key is configured', async () => {
    delete env.ADMIN_DEBUG_KEY;
    assert.equal((await call('GET', '/api/health?key=')).status, 401);
  });

  test('daily cron writes the heartbeat; the 10-minute cron does not; counts are reported', async () => {
    let h = await call('GET', '/api/health?key=adminkey');
    assert.equal(h.json.dailyJob.lastRun, null);
    assert.deepEqual(h.json.autopay, { scheduled: 0, failed: 0, needs_attention: 0 });

    await enrolled();
    at('2026-11-09T18:10:00Z');
    await worker.scheduled({ cron: '*/10 * * * *' }, env);
    assert.equal(kv.m.has('heartbeat:daily'), false);

    await runDaily('2026-11-10T09:00:00Z');
    h = await call('GET', '/api/health?key=adminkey');
    assert.equal(h.json.dailyJob.lastRun, '2026-11-10T09:00:00.000Z');
    assert.deepEqual(h.json.autopay, { scheduled: 1, failed: 0, needs_attention: 0 });

    decline();
    await runDaily('2026-12-30T09:00:00Z');
    h = await call('GET', '/api/health?key=adminkey');
    assert.deepEqual(h.json.autopay, { scheduled: 0, failed: 1, needs_attention: 0 });
    await runDaily('2027-01-03T10:00:00Z');
    h = await call('GET', '/api/health?key=adminkey');
    assert.deepEqual(h.json.autopay, { scheduled: 0, failed: 0, needs_attention: 1 });
  });

  test('exposes no PII or secrets', async () => {
    await enrolled();
    const text = JSON.stringify((await call('GET', '/api/health?key=adminkey')).json);
    for (const bad of ['Jennifer', 'jennifer@', 'bk1', '4242', 'hosttoken', 'sq-test', 'adminkey']) {
      assert.ok(!text.includes(bad), `leaked ${bad}`);
    }
  });
});
