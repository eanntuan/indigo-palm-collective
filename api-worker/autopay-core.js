// Pure logic for the "split payment by card" flow (no network, no env).
// Imported by api-worker/index.js and by tests/.
//
// Flow: guest pays 50% of the approved total by card now, the card is saved
// with their consent, and the remaining 50% is charged automatically
// BALANCE_DAYS before check-in. Each charge carries its own 3% card fee.
//
// Bookings made inside BALANCE_DAYS of check-in are not eligible: they pay in
// full at booking and no card is saved.

import { calcCardFee, roundCents } from './pricing-core.js';

export const BALANCE_DAYS = 60;          // balance charged this many days before check-in
export const GRACE_DAYS = 3;             // time to fix a failed balance charge
export const CONSENT_VERSION = '2026-11-09';

const DAY_MS = 24 * 60 * 60 * 1000;

// 'YYYY-MM-DD' +/- days, pure UTC date math (no timezone drift).
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

export function balanceDueDate(checkIn) {
  return addDays(checkIn, -BALANCE_DAYS);
}

// Eligible only if the balance date is still in the future (strictly after
// today), so the daily job never has to charge "right now".
export function isAutopayEligible(checkIn, today) {
  return balanceDueDate(checkIn) > today;
}

// Split the approved total into two halves that sum exactly to the total.
// Any odd cent goes on the first (upfront) payment. Each half then gets the
// standard 3% card fee on its own.
export function splitAmounts(finalTotal, deposit = 0) {
  const cents = Math.round(finalTotal * 100);
  const firstCents = Math.ceil(cents / 2);
  const first = firstCents / 100;
  const balance = (cents - firstCents) / 100;
  const firstFee = calcCardFee(first);
  const balanceFee = calcCardFee(balance);
  return {
    total: roundCents(finalTotal),
    first, balance,
    firstFee, balanceFee,
    deposit: roundCents(deposit),
    firstCharge: roundCents(first + firstFee + deposit),
    balanceCharge: roundCents(balance + balanceFee),
  };
}

// Pay-in-full by card: the whole total plus one 3% fee (same as the full-payment link).
export function fullAmounts(finalTotal, deposit = 0) {
  const total = roundCents(finalTotal);
  const fee = calcCardFee(total);
  return { total, fee, deposit: roundCents(deposit), charge: roundCents(total + fee + deposit) };
}

export const toCents = (dollars) => Math.round(dollars * 100);

// Square idempotency keys (max 45 chars). The attempt number only changes after
// a definitive decline, so a network retry of an unknown outcome reuses the key
// and can never double-charge.
export function idempotencyKey(kind, bookingId, attempt = 0) {
  return `ap-${kind}-${bookingId}-${attempt}`.slice(0, 45);
}

export function consentText({ firstCharge, balanceCharge, dueDate, fmtDate, deposit = 0 }) {
  const usd = (n) => `$${n.toFixed(2)}`;
  const when = fmtDate ? fmtDate(dueDate) : dueDate;
  return (
    `I authorize Indigo Palm Collective (MPT Industries) to charge the card I enter ` +
    `${usd(firstCharge)} today (50% of my total plus a 3% card processing fee` +
    (deposit > 0 ? `, plus the ${usd(deposit)} refundable security deposit, which has no card fee` : '') + `), and to save this card ` +
    `and automatically charge it ${usd(balanceCharge)} on ${when} (the remaining 50% plus a 3% card ` +
    `processing fee), which is ${BALANCE_DAYS} days before check-in. I can ask to stop the automatic ` +
    `charge by emailing indigopalmco@gmail.com before that date. Cancellations made ${BALANCE_DAYS} or more ` +
    `days before check-in receive a full refund of payments received, except the 3% card processing fee, which is not refundable.`
  );
}

// What should the daily job do with this autopay record?
//   'charge'  - balance is due and has not been attempted
//   'retry'   - a previous attempt was declined and the grace period is still open
//   'expire'  - declined and the grace period has ended (alert the host)
//   'skip'    - nothing to do (paid, cancelled, not yet due, needs_attention)
export function autopayAction(rec, today, nowMs) {
  if (!rec) return 'skip';
  if (rec.status === 'scheduled') return rec.dueDate <= today ? 'charge' : 'skip';
  if (rec.status === 'failed') {
    return nowMs < (rec.graceDeadlineMs || 0) ? 'retry' : 'expire';
  }
  return 'skip';
}

export function graceDeadlineMs(nowMs) {
  return nowMs + GRACE_DAYS * DAY_MS;
}

// A Square error is a *definitive* decline (safe to move on to a new
// idempotency key) when it is a 4xx card/payment error. Network errors and
// 5xx responses are unknown outcomes and must be retried with the SAME key.
export function isDefinitiveDecline(httpStatus, errors = []) {
  if (httpStatus >= 500 || httpStatus === 0) return false;
  if (httpStatus === 429) return false;
  if (httpStatus >= 400) {
    return errors.some(e => ['PAYMENT_METHOD_ERROR', 'CARD_ERROR', 'INVALID_CARD'].includes(e.category) ||
      /CARD|CVV|DECLINED|EXPIRED|INSUFFICIENT/i.test(e.code || ''));
  }
  return false;
}
