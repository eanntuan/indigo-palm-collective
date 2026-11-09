// Split payment by card: save the card (with consent), charge 50% now, charge
// the remaining 50% automatically BALANCE_DAYS before check-in.
//
// Endpoints (wired up in index.js):
//   GET  /api/autopay/config?id=&t=[&mode=update]   guest pay page config
//   POST /api/autopay/enroll                        save card + charge first 50%
//   POST /api/autopay/update-card                   replace the saved card (and retry a failed charge)
//   GET  /api/autopay/cancel?key=&id=               host: confirmation page
//   POST /api/autopay/cancel?key=                   host: stop the automatic charge
//   GET  /api/autopay/status?key=&id=               host: view the record
//
// Scheduled: processAutopayCharges() runs from the daily cron.
//
// Everything that touches the outside world comes in through `deps`
// (finalizeBookingConfirmation, sendEmail, emailWrapper, detailRow, fmtDate,
// isAdminAuthorized, CORS_HEADERS) so tests can run it with stubs.
//
// Required Worker secrets/vars: SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID,
// optional SQUARE_LOCATION_ID (defaults to the first Square location),
// SQUARE_SANDBOX ('true' to use Square's sandbox).

import {
  BALANCE_DAYS, CONSENT_VERSION, balanceDueDate, isAutopayEligible, splitAmounts, fullAmounts,
  toCents, idempotencyKey, consentText, autopayAction, graceDeadlineMs, isDefinitiveDecline,
  addDays,
} from './autopay-core.js';
import { pushAlert } from './alerts.js';

const SQUARE_VERSION = '2024-01-18';
const HOST_EMAIL = 'indigopalmco@gmail.com';
const FROM = 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>';
const SITE = 'https://indigopalm.co';

export const todayUtc = (nowMs = Date.now()) => new Date(nowMs).toISOString().slice(0, 10);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (n) => `$${Number(n).toFixed(2)}`;

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || !a) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// 128-bit random token for the guest pay link (the existing booking `token` is host-only).
export function newPayToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function payLink(bookingId, payToken, mode) {
  return `${SITE}/pay/?id=${encodeURIComponent(bookingId)}&t=${encodeURIComponent(payToken)}${mode ? `&mode=${mode}` : ''}`;
}

// ── Square helpers ────────────────────────────────────────────────────────────

const squareBase = (env) => env.SQUARE_SANDBOX === 'true' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';

async function square(env, method, path, body) {
  try {
    const res = await fetch(`${squareBase(env)}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': SQUARE_VERSION,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = {};
    try { json = await res.json(); } catch { /* non-JSON body */ }
    return { status: res.status, ok: res.ok, json, errors: json.errors || [] };
  } catch (e) {
    return { status: 0, ok: false, json: {}, errors: [{ category: 'NETWORK', code: String(e.message || e) }] };
  }
}

async function getLocationId(env) {
  if (env.SQUARE_LOCATION_ID) return env.SQUARE_LOCATION_ID;
  const r = await square(env, 'GET', '/v2/locations');
  return r.json.locations?.[0]?.id || null;
}

const errText = (errors) => (errors || []).map(e => e.code || e.category).filter(Boolean).join(', ') || 'unknown';

// ── Responses ─────────────────────────────────────────────────────────────────

const respond = (deps, obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: deps.CORS_HEADERS });

// ── Booking access ────────────────────────────────────────────────────────────

async function loadBooking(env, id) {
  if (!id) return null;
  const raw = await env.BOOKINGS.get(`booking:${id}`);
  return raw ? JSON.parse(raw) : null;
}

const loadRecord = async (env, id) => {
  const raw = await env.BOOKINGS.get(`autopay:${id}`);
  return raw ? JSON.parse(raw) : null;
};
const saveRecord = (env, rec) => env.BOOKINGS.put(`autopay:${rec.bookingId}`, JSON.stringify(rec));

function guestPayError(booking, t) {
  if (!booking || !safeEqual(booking.payToken || '', t || '')) return { status: 404, error: 'This payment link is not valid.' };
  return null;
}

// ── Routing ───────────────────────────────────────────────────────────────────

export async function handleAutopayRoute(request, env, url, deps) {
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { headers: deps.CORS_HEADERS });

  if (path === '/api/autopay/config' && method === 'GET') return handleConfig(url, env, deps);
  if (path === '/api/autopay/enroll' && method === 'POST') return handleEnroll(request, env, deps);
  if (path === '/api/autopay/update-card' && method === 'POST') return handleUpdateCard(request, env, deps);

  if (path === '/api/autopay/cancel' || path === '/api/autopay/status') {
    if (!deps.isAdminAuthorized(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    if (path === '/api/autopay/status' && method === 'GET') return handleStatus(url, env, deps);
    if (path === '/api/autopay/cancel' && method === 'GET') return handleCancelPage(url, env);
    if (path === '/api/autopay/cancel' && method === 'POST') return handleCancel(request, env, deps);
  }
  return null;
}

// ── Guest: config ─────────────────────────────────────────────────────────────

async function handleConfig(url, env, deps) {
  const id = url.searchParams.get('id');
  const t = url.searchParams.get('t');
  const mode = url.searchParams.get('mode') === 'update' ? 'update' : 'enroll';
  const booking = await loadBooking(env, id);
  const bad = guestPayError(booking, t);
  if (bad) return respond(deps, { success: false, error: bad.error }, bad.status);
  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_APPLICATION_ID) {
    return respond(deps, { success: false, error: 'Card payments are not available right now. Please pay by Zelle or email us.' }, 503);
  }

  const rec = await loadRecord(env, id);
  const base = {
    success: true, mode,
    appId: env.SQUARE_APPLICATION_ID,
    locationId: await getLocationId(env),
    sandbox: env.SQUARE_SANDBOX === 'true',
    property: booking.property, checkIn: booking.checkIn, checkOut: booking.checkOut,
  };

  if (mode === 'update') {
    if (!rec || !['scheduled', 'failed'].includes(rec.status)) {
      return respond(deps, { success: false, error: 'There is no automatic payment to update for this booking.' }, 409);
    }
    return respond(deps, {
      ...base, dueDate: rec.dueDate, last4: rec.last4,
      amounts: { balanceCharge: rec.balance.charge },
      owesNow: rec.status === 'failed',
    });
  }

  if (rec && rec.status !== 'cancelled') return respond(deps, { success: false, error: 'This booking already has a split payment set up.' }, 409);
  if (booking.status !== 'approved') return respond(deps, { success: false, error: 'This booking is not awaiting payment.' }, 409);

  const deposit = booking.securityDeposit || 0;
  const full = fullAmounts(booking.finalTotal, deposit);
  if (!(booking.finalTotal > 0)) return respond(deps, { success: false, error: 'This booking is not awaiting payment.' }, 409);
  const splitAvailable = isAutopayEligible(booking.checkIn, todayUtc());
  if (!splitAvailable) return respond(deps, { ...base, splitAvailable: false, full });
  const amounts = splitAmounts(booking.finalTotal, deposit);
  const dueDate = balanceDueDate(booking.checkIn);
  return respond(deps, {
    ...base, splitAvailable: true, full, dueDate, amounts,
    consentText: consentText({ firstCharge: amounts.firstCharge, balanceCharge: amounts.balanceCharge, dueDate, fmtDate: deps.fmtDate, deposit }),
  });
}

// ── Guest: enroll (save card + charge first 50%) ──────────────────────────────

async function handleEnroll(request, env, deps) {
  let body;
  try { body = await request.json(); } catch { return respond(deps, { success: false, error: 'Invalid request' }, 400); }
  const { id, t, sourceId, consent, plan } = body;

  const booking = await loadBooking(env, id);
  const bad = guestPayError(booking, t);
  if (bad) return respond(deps, { success: false, error: bad.error }, bad.status);
  if (plan === 'full') return handlePayInFull(request, env, deps, booking, sourceId);
  if (consent !== true) return respond(deps, { success: false, error: 'Please agree to the automatic payment authorization.' }, 400);
  if (!sourceId) return respond(deps, { success: false, error: 'Card details are missing. Please try again.' }, 400);
  if (!env.SQUARE_ACCESS_TOKEN) return respond(deps, { success: false, error: 'Card payments are not available right now.' }, 503);

  const existing = await loadRecord(env, id);
  if (existing && existing.status !== 'cancelled') return respond(deps, { success: false, error: 'This booking already has a split payment set up.' }, 409);
  if (booking.status !== 'approved' || !(booking.finalTotal > 0)) return respond(deps, { success: false, error: 'This booking is not awaiting payment.' }, 409);
  if (!isAutopayEligible(booking.checkIn, todayUtc())) {
    return respond(deps, { success: false, error: `Check-in is less than ${BALANCE_DAYS} days away, so the full amount is due now.` }, 409);
  }

  const amounts = splitAmounts(booking.finalTotal, booking.securityDeposit || 0);
  const dueDate = balanceDueDate(booking.checkIn);
  const text = consentText({ firstCharge: amounts.firstCharge, balanceCharge: amounts.balanceCharge, dueDate, fmtDate: deps.fmtDate, deposit: amounts.deposit });
  const locationId = await getLocationId(env);
  if (!locationId) return respond(deps, { success: false, error: 'Payment setup failed. Please email us.' }, 502);

  // 1. Square customer (stable idempotency key per booking)
  const cust = await square(env, 'POST', '/v2/customers', {
    idempotency_key: `ap-cust-${id}`.slice(0, 45),
    given_name: String(booking.name || '').split(' ')[0] || undefined,
    family_name: String(booking.name || '').split(' ').slice(1).join(' ') || undefined,
    email_address: booking.email,
    reference_id: id,
  });
  const customerId = cust.json.customer?.id;
  if (!cust.ok || !customerId) {
    console.error('Autopay: customer create failed', cust.status, errText(cust.errors));
    return respond(deps, { success: false, error: 'Payment setup failed. Please try again or email us.' }, 502);
  }

  // 2. Save the card on file
  const card = await square(env, 'POST', '/v2/cards', {
    idempotency_key: `ap-card-${id}-0`.slice(0, 45),
    source_id: sourceId,
    card: { customer_id: customerId, cardholder_name: booking.name, reference_id: id },
  });
  const cardObj = card.json.card;
  if (!card.ok || !cardObj?.id) {
    console.error('Autopay: card save failed', card.status, errText(card.errors));
    return respond(deps, { success: false, error: 'We could not save that card. Please check the details or try another card.' }, 402);
  }

  // 3. Charge the first 50% (+3%) now
  const pay = await square(env, 'POST', '/v2/payments', {
    idempotency_key: idempotencyKey('first', id, 0),
    source_id: cardObj.id,
    customer_id: customerId,
    location_id: locationId,
    amount_money: { amount: toCents(amounts.firstCharge), currency: 'USD' },
    autocomplete: true,
    reference_id: id,
    note: `${booking.property} ${booking.checkIn} to ${booking.checkOut}: 50% now (incl. 3% card fee${amounts.deposit ? ' + $' + amounts.deposit.toFixed(2) + ' refundable security deposit' : ''})`,
  });
  const payment = pay.json.payment;
  if (!pay.ok || !payment?.id) {
    console.error('Autopay: first charge failed', pay.status, errText(pay.errors));
    await square(env, 'POST', `/v2/cards/${cardObj.id}/disable`); // don't leave an unused saved card
    return respond(deps, { success: false, error: 'Your card was declined. Please try another card.' }, 402);
  }

  // 4. Persist the schedule BEFORE anything else can fail
  const rec = {
    bookingId: id, status: 'scheduled', dueDate, attempt: 0,
    customerId, cardId: cardObj.id, last4: cardObj.last_4 || null, brand: cardObj.card_brand || null, cardVersion: 0,
    first: { amount: amounts.first, fee: amounts.firstFee, deposit: amounts.deposit, charge: amounts.firstCharge, paymentId: payment.id, paidAt: new Date().toISOString() },
    balance: { amount: amounts.balance, fee: amounts.balanceFee, charge: amounts.balanceCharge, paymentId: null, paidAt: null },
    consent: {
      version: CONSENT_VERSION, text, acceptedAt: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || null,
      userAgent: request.headers.get('User-Agent') || null,
    },
    createdAt: new Date().toISOString(),
  };
  await saveRecord(env, rec);

  // 5. Confirm the booking exactly like a normal paid booking (email, Hostaway, calendar)
  let confirmError = null;
  try {
    const r = await deps.finalizeBookingConfirmation({
      bookingId: id, orderId: payment.order_id || null, totalPaid: amounts.firstCharge,
      paymentMethod: 'square', note: `Paid 50% by card${amounts.deposit ? ` plus the ${usd(amounts.deposit)} refundable security deposit` : ''}. The remaining ${usd(amounts.balanceCharge)} charges automatically on ${deps.fmtDate(dueDate)}.`, env,
    });
    if (r?.error) confirmError = r.error;
  } catch (e) { confirmError = String(e.message || e); console.error('Autopay: finalize failed', e); }

  // 6. Emails (non-fatal)
  try {
    await deps.sendEmail(env.RESEND_API_KEY, {
      from: FROM, to: booking.email, cc: HOST_EMAIL,
      subject: `Your payment schedule for ${booking.property}`,
      html: deps.emailWrapper(`
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#2C2C2C;">Thank you, ${esc(String(booking.name).split(' ')[0])}.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">Your first payment went through. Here is your schedule:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          ${deps.detailRow('Paid today', `${usd(amounts.firstCharge)} (50% + 3% card fee${amounts.deposit ? ' + refundable security deposit' : ''})`)}
          ${deps.detailRow('Charged on', `${esc(deps.fmtDate(dueDate))}`)}
          ${deps.detailRow('Amount', `${usd(amounts.balanceCharge)} (remaining 50% + 3% card fee)`)}
          ${deps.detailRow('Card', `${esc(rec.brand || 'Card')} ending ${esc(rec.last4 || '----')}`)}
        </table>
        <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">We will charge this card automatically on that date, ${BALANCE_DAYS} days before check-in. Cancel ${BALANCE_DAYS} or more days before check-in for a full refund of payments received. Questions or need to change the card? Email <a href="mailto:${HOST_EMAIL}" style="color:#B67550;">${HOST_EMAIL}</a>.</p>
      `),
    });
  } catch (e) { console.error('Autopay: guest schedule email failed', e); }

  if (confirmError) {
    try {
      await deps.sendEmail(env.RESEND_API_KEY, {
        from: FROM, to: HOST_EMAIL, subject: `ACTION: split payment taken but booking confirmation failed (${booking.name})`,
        html: deps.emailWrapper(`<p>The first 50% (${usd(amounts.firstCharge)}) was charged for booking ${esc(id)}, but confirming the booking failed: ${esc(confirmError)}. Please confirm it manually.</p>`),
      });
    } catch (e) { console.error(e); }
    await pushAlert(env, deps, 'Payment taken, booking NOT confirmed', `${booking.name}: first 50% charged but confirmation failed. Confirm it manually.`);
  }

  return respond(deps, { success: true, firstCharge: amounts.firstCharge, balanceCharge: amounts.balanceCharge, dueDate, last4: rec.last4 });
}

// ── Guest: pay the whole amount by card (no saved card, no schedule) ─────────

async function handlePayInFull(request, env, deps, booking, sourceId) {
  const id = booking.id;
  if (!sourceId) return respond(deps, { success: false, error: 'Card details are missing. Please try again.' }, 400);
  if (!env.SQUARE_ACCESS_TOKEN) return respond(deps, { success: false, error: 'Card payments are not available right now.' }, 503);
  const existing = await loadRecord(env, id);
  if (existing && existing.status !== 'cancelled') return respond(deps, { success: false, error: 'This booking already has a payment set up.' }, 409);
  if (booking.status !== 'approved' || !(booking.finalTotal > 0)) return respond(deps, { success: false, error: 'This booking is not awaiting payment.' }, 409);

  const amounts = fullAmounts(booking.finalTotal, booking.securityDeposit || 0);
  const locationId = await getLocationId(env);
  if (!locationId) return respond(deps, { success: false, error: 'Payment setup failed. Please email us.' }, 502);

  const pay = await square(env, 'POST', '/v2/payments', {
    idempotency_key: idempotencyKey('full', id, 0),
    source_id: sourceId,
    location_id: locationId,
    amount_money: { amount: toCents(amounts.charge), currency: 'USD' },
    autocomplete: true,
    reference_id: id,
    buyer_email_address: booking.email,
    note: `${booking.property} ${booking.checkIn} to ${booking.checkOut}: paid in full (incl. 3% card fee${amounts.deposit ? ' + $' + amounts.deposit.toFixed(2) + ' refundable security deposit' : ''})`,
  });
  const payment = pay.json.payment;
  if (!pay.ok || !payment?.id) {
    console.error('Autopay: full payment failed', pay.status, errText(pay.errors));
    return respond(deps, { success: false, error: 'Your card was declined. Please try another card.' }, 402);
  }

  // Record it first so the same booking can never be paid twice, then confirm.
  await saveRecord(env, {
    bookingId: id, status: 'paid_full',
    full: { amount: amounts.total, fee: amounts.fee, deposit: amounts.deposit, charge: amounts.charge, paymentId: payment.id, paidAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
  });

  let confirmError = null;
  try {
    const r = await deps.finalizeBookingConfirmation({
      bookingId: id, orderId: payment.order_id || null, totalPaid: amounts.charge,
      paymentMethod: 'square', note: amounts.deposit ? `Paid in full by card, including the ${usd(amounts.deposit)} refundable security deposit.` : 'Paid in full by card.', env,
    });
    if (r?.error) confirmError = r.error;
  } catch (e) { confirmError = String(e.message || e); console.error('Autopay: finalize failed', e); }

  if (confirmError) {
    try {
      await deps.sendEmail(env.RESEND_API_KEY, {
        from: FROM, to: HOST_EMAIL, subject: `ACTION: full payment taken but booking confirmation failed (${booking.name})`,
        html: deps.emailWrapper(`<p>${usd(amounts.charge)} was charged for booking ${esc(id)}, but confirming the booking failed: ${esc(confirmError)}. Please confirm it manually.</p>`),
      });
    } catch (e) { console.error(e); }
    await pushAlert(env, deps, 'Payment taken, booking NOT confirmed', `${booking.name}: full payment charged but confirmation failed. Confirm it manually.`);
  }
  return respond(deps, { success: true, plan: 'full', charge: amounts.charge });
}

// ── Charging the balance ──────────────────────────────────────────────────────

async function chargeBalance(env, deps, rec, nowMs) {
  const booking = await loadBooking(env, rec.bookingId);
  if (!booking || booking.status !== 'confirmed') {
    rec.status = 'needs_attention';
    rec.lastError = `booking is ${booking ? booking.status : 'missing'}, not confirmed; not charging`;
    await saveRecord(env, rec);
    await notifyHost(env, deps, booking, rec, 'Automatic charge skipped', `Booking ${esc(rec.bookingId)} is not in a confirmed state, so the automatic charge was NOT made. Review it and cancel or fix the schedule.`);
    return rec;
  }
  const locationId = await getLocationId(env);
  const key = idempotencyKey('balance', rec.bookingId, rec.attempt || 0);
  const body = {
    idempotency_key: key,
    source_id: rec.cardId,
    customer_id: rec.customerId,
    location_id: locationId,
    amount_money: { amount: toCents(rec.balance.charge), currency: 'USD' },
    autocomplete: true,
    reference_id: rec.bookingId,
    note: `${booking.property} ${booking.checkIn} to ${booking.checkOut}: remaining 50% (incl. 3% card fee)`,
  };

  // Unknown outcomes (network/5xx) are retried immediately with the SAME key, a
  // couple of times. Square only honours an idempotency key for ~24 hours, so we
  // never leave an unknown outcome to a later run: that could double-charge.
  let res;
  for (let i = 0; i < 3; i++) {
    res = await square(env, 'POST', '/v2/payments', body);
    if (res.ok || isDefinitiveDecline(res.status, res.errors)) break;
    if (res.status >= 400 && res.status < 500 && res.status !== 429) break; // non-card client error
  }

  if (res.ok && res.json.payment?.id) {
    rec.status = 'paid';
    rec.balance.paymentId = res.json.payment.id;
    rec.balance.paidAt = new Date(nowMs).toISOString();
    rec.lastError = null;
    await saveRecord(env, rec);
    await emailBalancePaid(env, deps, booking, rec);
    return rec;
  }

  if (isDefinitiveDecline(res.status, res.errors)) {
    const firstFailure = rec.status !== 'failed';
    rec.attempt = (rec.attempt || 0) + 1;
    rec.status = 'failed';
    rec.lastError = errText(res.errors);
    if (firstFailure) { rec.failedAt = new Date(nowMs).toISOString(); rec.graceDeadlineMs = graceDeadlineMs(nowMs); }
    await saveRecord(env, rec);
    if (firstFailure) await emailBalanceFailed(env, deps, booking, rec);
    return rec;
  }

  // Unknown outcome or a non-card error: stop and ask a human to check Square.
  rec.status = 'needs_attention';
  rec.lastError = `unclear result (${res.status}): ${errText(res.errors)}`;
  await saveRecord(env, rec);
  await notifyHost(env, deps, booking, rec, 'Automatic charge needs a manual check',
    `The balance charge for booking ${esc(rec.bookingId)} returned an unclear result (${esc(rec.lastError)}). It was NOT retried automatically, to avoid charging the guest twice. Check Square for a payment with reference ${esc(rec.bookingId)} before doing anything.`);
  return rec;
}

async function notifyHost(env, deps, booking, rec, subject, htmlBody, { push = true } = {}) {
  if (push) await pushAlert(env, deps, subject, `${booking ? booking.name : rec.bookingId}: see your email for details.`);
  try {
    await deps.sendEmail(env.RESEND_API_KEY, {
      from: FROM, to: HOST_EMAIL,
      subject: `${subject}: ${booking ? booking.name : rec.bookingId}`,
      html: deps.emailWrapper(`<p style="font-size:15px;color:#2C2C2C;line-height:1.7;">${htmlBody}</p>
        <p style="font-size:13px;color:#888;">Amount: ${usd(rec.balance.charge)} · Due ${esc(rec.dueDate)} · Card ending ${esc(rec.last4 || '----')}</p>`),
    });
  } catch (e) { console.error('Autopay host email failed', e); }
}

async function emailBalancePaid(env, deps, booking, rec) {
  try {
    await deps.sendEmail(env.RESEND_API_KEY, {
      from: FROM, to: booking.email, cc: HOST_EMAIL,
      subject: `Payment received for ${booking.property}`,
      html: deps.emailWrapper(`
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#2C2C2C;">Your balance is paid.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">We charged your ${esc(rec.brand || 'card')} ending ${esc(rec.last4 || '----')} ${usd(rec.balance.charge)} (the remaining 50% plus a 3% card fee) for ${esc(booking.property)}, ${esc(deps.fmtDate(booking.checkIn))} to ${esc(deps.fmtDate(booking.checkOut))}. You are all set.</p>
      `),
    });
  } catch (e) { console.error('Autopay paid email failed', e); }
}

async function emailBalanceFailed(env, deps, booking, rec) {
  const link = payLink(rec.bookingId, booking.payToken, 'update');
  try {
    await deps.sendEmail(env.RESEND_API_KEY, {
      from: FROM, to: booking.email, cc: HOST_EMAIL,
      subject: `Action needed: your payment for ${booking.property} did not go through`,
      html: deps.emailWrapper(`
        <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#2C2C2C;">We could not charge your card.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">The remaining ${usd(rec.balance.charge)} for ${esc(booking.property)} was due today and your card on file (${esc(rec.brand || 'card')} ending ${esc(rec.last4 || '----')}) was declined. Please update your card within 3 days to keep your booking.</p>
        <p style="margin:0 0 24px;text-align:center;"><a href="${link}" style="display:inline-block;padding:14px 32px;background:#607c67;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">Update card and pay &rarr;</a></p>
        <p style="margin:0;font-size:14px;color:#888;">Prefer Zelle? Reply to this email and we will help.</p>
      `),
    });
  } catch (e) { console.error('Autopay failed email failed', e); }
  await notifyHost(env, deps, booking, rec, 'Automatic charge DECLINED',
    `The balance charge for booking ${esc(rec.bookingId)} was declined (${esc(rec.lastError)}). The guest has been emailed an update-card link and has 3 days; the charge is retried daily until then.`);
}

// ── Guest: update card ────────────────────────────────────────────────────────

async function handleUpdateCard(request, env, deps) {
  let body;
  try { body = await request.json(); } catch { return respond(deps, { success: false, error: 'Invalid request' }, 400); }
  const { id, t, sourceId, consent } = body;
  const booking = await loadBooking(env, id);
  const bad = guestPayError(booking, t);
  if (bad) return respond(deps, { success: false, error: bad.error }, bad.status);
  if (consent !== true) return respond(deps, { success: false, error: 'Please agree to the automatic payment authorization.' }, 400);
  if (!sourceId) return respond(deps, { success: false, error: 'Card details are missing. Please try again.' }, 400);

  const rec = await loadRecord(env, id);
  if (!rec || !['scheduled', 'failed'].includes(rec.status)) {
    return respond(deps, { success: false, error: 'There is no automatic payment to update for this booking.' }, 409);
  }

  const version = (rec.cardVersion || 0) + 1;
  const card = await square(env, 'POST', '/v2/cards', {
    idempotency_key: `ap-card-${id}-${version}`.slice(0, 45),
    source_id: sourceId,
    card: { customer_id: rec.customerId, cardholder_name: booking.name, reference_id: id },
  });
  const cardObj = card.json.card;
  if (!card.ok || !cardObj?.id) {
    return respond(deps, { success: false, error: 'We could not save that card. Please check the details or try another card.' }, 402);
  }

  const oldCardId = rec.cardId;
  rec.cardId = cardObj.id; rec.last4 = cardObj.last_4 || null; rec.brand = cardObj.card_brand || null; rec.cardVersion = version;
  rec.consent = { ...rec.consent, updatedAt: new Date().toISOString(), updatedConsentVersion: CONSENT_VERSION };
  await saveRecord(env, rec);
  if (oldCardId && oldCardId !== cardObj.id) await square(env, 'POST', `/v2/cards/${oldCardId}/disable`);

  if (rec.status === 'failed') {
    const out = await chargeBalance(env, deps, rec, Date.now());
    if (out.status === 'paid') return respond(deps, { success: true, charged: true, last4: rec.last4 });
    return respond(deps, { success: false, error: 'That card was declined too. Please try a different card or email us.' }, 402);
  }
  return respond(deps, { success: true, charged: false, last4: rec.last4, dueDate: rec.dueDate });
}

// ── Host: status / cancel ─────────────────────────────────────────────────────

async function handleStatus(url, env, deps) {
  const rec = await loadRecord(env, url.searchParams.get('id'));
  if (!rec) return respond(deps, { success: false, error: 'No split payment record' }, 404);
  const { consent, ...rest } = rec;
  return respond(deps, { success: true, record: rest, consentAcceptedAt: consent?.acceptedAt, consentVersion: consent?.version });
}

function handleCancelPage(url, env) {
  const id = esc(url.searchParams.get('id') || '');
  const key = esc(url.searchParams.get('key') || '');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Stop automatic charge</title>
<style>body{font-family:-apple-system,sans-serif;background:#f5f3ee;padding:60px 20px;text-align:center}form{background:#fff;border-radius:14px;padding:28px 24px;max-width:360px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,.08)}button{width:100%;padding:12px;background:#b3412e;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600}</style></head>
<body><form id="f"><p style="margin-bottom:14px;color:#555">Stop the automatic balance charge for booking <strong>${id}</strong>? The saved card will be disabled. Refunds are not issued here.</p><button type="submit">Stop automatic charge</button><p id="m" style="color:#555;font-size:14px"></p></form>
<script>document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();const r=await fetch('/api/autopay/cancel?key='+encodeURIComponent(${JSON.stringify(url.searchParams.get('key') || '')}),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:${JSON.stringify(url.searchParams.get('id') || '')}})});const j=await r.json();document.getElementById('m').textContent=j.success?'Done. The automatic charge is stopped.':(j.error||'Failed');});</script></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' } });
}

async function handleCancel(request, env, deps) {
  let body;
  try { body = await request.json(); } catch { return respond(deps, { success: false, error: 'Invalid request' }, 400); }
  const rec = await loadRecord(env, body.id);
  if (!rec) return respond(deps, { success: false, error: 'No split payment record' }, 404);
  if (rec.status === 'paid') return respond(deps, { success: false, error: 'The balance has already been charged.' }, 409);
  rec.status = 'cancelled';
  rec.cancelledAt = new Date().toISOString();
  await saveRecord(env, rec);
  if (rec.cardId) await square(env, 'POST', `/v2/cards/${rec.cardId}/disable`);
  return respond(deps, { success: true });
}

// ── Daily job ─────────────────────────────────────────────────────────────────

export async function processAutopayCharges(env, deps, nowMs = Date.now()) {
  if (!env.BOOKINGS || !env.SQUARE_ACCESS_TOKEN) return { processed: 0 };
  const today = todayUtc(nowMs);
  let cursor; let processed = 0;
  do {
    const page = await env.BOOKINGS.list({ prefix: 'autopay:', cursor });
    for (const k of page.keys) {
      const raw = await env.BOOKINGS.get(k.name);
      if (!raw) continue;
      const rec = JSON.parse(raw);
      const action = autopayAction(rec, today, nowMs);
      try {
        if (action === 'charge' || action === 'retry') { await chargeBalance(env, deps, rec, nowMs); processed++; }
        else if (action === 'expire') {
          rec.status = 'needs_attention';
          await saveRecord(env, rec);
          const booking = await loadBooking(env, rec.bookingId);
          await notifyHost(env, deps, booking, rec, 'Automatic charge still unpaid',
            `The 3-day grace period for booking ${esc(rec.bookingId)} has ended and the balance is still unpaid. Contact the guest or release the dates.`);
          processed++;
        } else if (rec.status === 'scheduled' && !rec.reminderSent && addDays(rec.dueDate, -3) <= today) {
          const booking = await loadBooking(env, rec.bookingId);
          rec.reminderSent = true;
          await saveRecord(env, rec);
          const stop = `${SITE}/api/autopay/cancel?key=${encodeURIComponent(env.ADMIN_DEBUG_KEY || '')}&id=${encodeURIComponent(rec.bookingId)}`;
          await notifyHost(env, deps, booking, rec, 'Automatic charge in 3 days',
            `${esc(booking ? booking.name : rec.bookingId)}'s card will be charged automatically on ${esc(rec.dueDate)}. If this booking was cancelled or changed, <a href="${stop}">stop the automatic charge</a> before then.`, { push: false });
        }
      } catch (e) { console.error(`Autopay job failed for ${k.name}`, e); }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { processed };
}
