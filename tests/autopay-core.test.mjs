// Split-payment (autopay) core logic. Run: npm test   (node:test)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  BALANCE_DAYS, GRACE_DAYS, addDays, balanceDueDate, isAutopayEligible, splitAmounts,
  fullAmounts, toCents, idempotencyKey, consentText, autopayAction, graceDeadlineMs, isDefinitiveDecline,
} from '../api-worker/autopay-core.js';
import { roundCents } from '../api-worker/pricing-core.js';

describe('dates', () => {
  test('balance is due 60 days before check-in', () => {
    assert.equal(BALANCE_DAYS, 60);
    assert.equal(balanceDueDate('2027-02-26'), '2026-12-28');
    assert.equal(balanceDueDate('2027-02-28'), '2026-12-30');
    assert.equal(balanceDueDate('2026-12-28'), '2026-10-29'); // already past on 2026-11-08
  });

  test('addDays crosses month, year and leap-day boundaries', () => {
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2028-03-01', -1), '2028-02-29');
    assert.equal(addDays('2027-03-01', -1), '2027-02-28');
    assert.equal(addDays('2027-03-01', 0), '2027-03-01');
  });
});

describe('eligibility: bookings inside 60 days pay in full, no saved card', () => {
  const today = '2026-11-08';
  test('far-out stay is eligible', () => assert.equal(isAutopayEligible('2027-02-28', today), true));
  test('check-in 2026-12-28 is inside 60 days, not eligible', () => assert.equal(isAutopayEligible('2026-12-28', today), false));
  test('balance date exactly today is NOT eligible (would be charged immediately)', () => {
    assert.equal(isAutopayEligible(addDays(today, BALANCE_DAYS), today), false);
  });
  test('balance date tomorrow is eligible', () => {
    assert.equal(isAutopayEligible(addDays(today, BALANCE_DAYS + 1), today), true);
  });
});

describe('amounts', () => {
  test('Sundune acceptance total $2,714 splits evenly; card charges add up to $2,795.42', () => {
    const a = splitAmounts(2714);
    assert.equal(a.first, 1357);
    assert.equal(a.balance, 1357);
    assert.equal(a.firstFee, 40.71);
    assert.equal(a.balanceFee, 40.71);
    assert.equal(a.firstCharge, 1397.71);
    assert.equal(a.balanceCharge, 1397.71);
    assert.equal(roundCents(a.firstCharge + a.balanceCharge), 2795.42);
  });

  test('halves always sum exactly to the total; odd cent goes on the first payment', () => {
    const a = splitAmounts(2714.01);
    assert.equal(a.first, 1357.01);
    assert.equal(a.balance, 1357);
    for (const total of [1, 99.99, 1540, 2006, 2714.01, 8400.33, 3333.33]) {
      const s = splitAmounts(total);
      assert.equal(toCents(s.first) + toCents(s.balance), toCents(total), `total ${total}`);
      assert.ok(s.first >= s.balance);
    }
  });

  test('each charge carries its own 3% fee', () => {
    const s = splitAmounts(1540);
    assert.equal(s.first, 770);
    assert.equal(s.firstFee, 23.1);
    assert.equal(s.firstCharge, 793.1);
  });
});

describe('pay in full', () => {
  test('whole total plus one 3% fee', () => {
    const f = fullAmounts(2714);
    assert.deepEqual(f, { total: 2714, fee: 81.42, deposit: 0, charge: 2795.42 });
    assert.deepEqual(fullAmounts(2451.6), { total: 2451.6, fee: 73.55, deposit: 0, charge: 2525.15 });
  });
});

describe('security deposit rides with the first card payment', () => {
  test('full: deposit added after the fee, no fee on the deposit', () => {
    assert.deepEqual(fullAmounts(2451.6, 300), { total: 2451.6, fee: 73.55, deposit: 300, charge: 2825.15 });
  });
  test('split: deposit goes entirely in the first charge, balance unchanged', () => {
    const a = splitAmounts(2000, 300);
    assert.equal(a.firstCharge, 1330);   // 1000 + 30 fee + 300 deposit
    assert.equal(a.balanceCharge, 1030); // 1000 + 30 fee
    assert.equal(a.deposit, 300);
    assert.equal(splitAmounts(2000).firstCharge, 1030);
  });
});

describe('idempotency keys', () => {
  test('stay within Square 45-char limit and change with attempt', () => {
    const k0 = idempotencyKey('balance', 'mw7zapx87fcg3c', 0);
    const k1 = idempotencyKey('balance', 'mw7zapx87fcg3c', 1);
    assert.ok(k0.length <= 45 && k1.length <= 45);
    assert.notEqual(k0, k1);
    assert.notEqual(idempotencyKey('first', 'abc', 0), idempotencyKey('balance', 'abc', 0));
    assert.equal(idempotencyKey('balance', 'x'.repeat(80), 0).length, 45);
  });
});

describe('consent text', () => {
  test('states both amounts, the date, the 60-day timing and how to stop', () => {
    const a = splitAmounts(2714);
    const t = consentText({ firstCharge: a.firstCharge, balanceCharge: a.balanceCharge, dueDate: '2026-12-30' });
    assert.match(t, /\$1397\.71 today/);
    assert.match(t, /automatically charge it \$1397\.71 on 2026-12-30/);
    assert.match(t, /60 days before check-in/);
    assert.match(t, /3% card processing fee/);
    assert.match(t, /indigopalmco@gmail\.com/);
  });
});

describe('daily job decisions', () => {
  const now = Date.UTC(2026, 11, 30, 9, 0, 0);
  const today = '2026-12-30';

  test('scheduled: charge on or after the due date, skip before', () => {
    assert.equal(autopayAction({ status: 'scheduled', dueDate: '2026-12-30' }, today, now), 'charge');
    assert.equal(autopayAction({ status: 'scheduled', dueDate: '2026-12-29' }, today, now), 'charge'); // missed day catches up
    assert.equal(autopayAction({ status: 'scheduled', dueDate: '2026-12-31' }, today, now), 'skip');
  });

  test('failed: retry during the 3-day grace period, expire after', () => {
    const dl = graceDeadlineMs(now);
    assert.equal(GRACE_DAYS, 3);
    assert.equal(dl - now, 3 * 24 * 60 * 60 * 1000);
    assert.equal(autopayAction({ status: 'failed', graceDeadlineMs: dl }, today, now + 1000), 'retry');
    assert.equal(autopayAction({ status: 'failed', graceDeadlineMs: dl }, today, dl + 1), 'expire');
  });

  test('paid, cancelled, needs_attention and missing records are never charged', () => {
    for (const status of ['paid', 'cancelled', 'needs_attention']) {
      assert.equal(autopayAction({ status, dueDate: '2020-01-01' }, today, now), 'skip', status);
    }
    assert.equal(autopayAction(null, today, now), 'skip');
  });
});

describe('decline vs unknown outcome', () => {
  test('card errors are definitive declines', () => {
    assert.equal(isDefinitiveDecline(402, [{ category: 'PAYMENT_METHOD_ERROR', code: 'GENERIC_DECLINE' }]), true);
    assert.equal(isDefinitiveDecline(400, [{ category: 'INVALID_REQUEST_ERROR', code: 'CARD_EXPIRED' }]), true);
  });
  test('network/5xx/429 are unknown outcomes: reuse the same idempotency key', () => {
    assert.equal(isDefinitiveDecline(0, []), false);
    assert.equal(isDefinitiveDecline(503, []), false);
    assert.equal(isDefinitiveDecline(429, []), false);
    assert.equal(isDefinitiveDecline(400, [{ category: 'INVALID_REQUEST_ERROR', code: 'BAD_REQUEST' }]), false);
  });
});
