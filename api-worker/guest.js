// Guest "Your booking" page API, the welcome-guide gate, and the pre-arrival email.
//
//   GET /api/guest/booking?id=&t=      read-only, guest-safe view of one booking
//   guideGate(request, env, url)       holds the welcome guide until 48 hours before check-in
//   sendDuePreArrivalEmails(env, deps) cron: emails check-in details + guide link once it opens
//
// The private link reuses the booking's payToken (the same 128-bit token as the
// /pay/ link). The host token and ADMIN_DEBUG_KEY never leave the Worker.
// Everything that lives in index.js (emails, property data) comes in through `deps`
// so tests can run this with stubs.

import { newPayToken, payLink, bookingLink } from './autopay.js';
import { BALANCE_DAYS } from './autopay-core.js';

const SITE = 'https://indigopalm.co';
export const CONTACT_EMAIL = 'indigopalmco@gmail.com';
const FROM = 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>';
const TZ = 'America/Los_Angeles';

export const CHECK_IN_HOUR = 16;                 // 4:00 PM Pacific at every property
export const GUIDE_OPENS_HOURS_BEFORE = 48;
const HOUR_MS = 60 * 60 * 1000;
const checkOutTime = (propertyId) => ['ps-retreat', 'the-well'].includes(propertyId) ? '11:00 AM' : '10:00 AM';

// ── Policy wording (same wording as the site, see tests/policy.test.mjs) ──────

export const CANCELLATION_POLICY =
  `Cancel ${BALANCE_DAYS} or more days before check-in for a full refund of payments received, except the 3% card processing fee, which is not refundable. ` +
  `If you cancel less than ${BALANCE_DAYS} days before check-in, payments are non-refundable.`;
export const depositPolicy = (amount) =>
  `The $${Number(amount).toFixed(0)} security deposit is refundable, has no card fee, and is returned within 72 hours of checkout if the house is left in good condition.`;

// ── Small helpers ─────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Constant-time compare that does not leak the expected length.
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const n = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const jsonRes = (deps, obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...deps.CORS_HEADERS, ...NO_STORE } });

async function loadBooking(env, id) {
  if (!id || typeof id !== 'string' || id.length > 80) return null;
  const raw = await env.BOOKINGS.get(`booking:${id}`);
  return raw ? JSON.parse(raw) : null;
}
async function loadAutopay(env, id) {
  const raw = await env.BOOKINGS.get(`autopay:${id}`);
  return raw ? JSON.parse(raw) : null;
}

export function validGuestToken(booking, t) {
  return !!booking && safeEqual(booking.payToken || '', t || '');
}

// Bookings approved before this feature always have a payToken (handleApprove sets
// it); this is a safety net for any record that does not.
export function ensurePayToken(booking) {
  if (!booking.payToken) booking.payToken = newPayToken();
  return booking.payToken;
}

// Failed-attempt limiter: a legitimate guest reloading the page is never counted.
const MAX_BAD_ATTEMPTS_PER_HOUR = 30;
const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'unknown';
const rlKey = (request, nowMs) => `rl:guest:${clientIp(request)}:${Math.floor(nowMs / HOUR_MS)}`;
async function isRateLimited(env, request, nowMs) {
  try { return Number(await env.BOOKINGS.get(rlKey(request, nowMs))) >= MAX_BAD_ATTEMPTS_PER_HOUR; } catch { return false; }
}
async function noteBadAttempt(env, request, nowMs) {
  try {
    const k = rlKey(request, nowMs);
    const n = Number(await env.BOOKINGS.get(k)) || 0;
    await env.BOOKINGS.put(k, String(n + 1), { expirationTtl: 3700 });
  } catch { /* best effort */ }
}

// ── Time: when the welcome guide opens ────────────────────────────────────────

// The UTC instant when the wall clock in Pacific time reads dateStr hour:00.
export function pacificInstantMs(dateStr, hour) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' });
  for (const off of [7, 8]) { // PDT, then PST
    const t = Date.UTC(y, m - 1, d, hour + off);
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map(x => [x.type, x.value]));
    if (Number(p.year) === y && Number(p.month) === m && Number(p.day) === d && Number(p.hour) === hour) return t;
  }
  return Date.UTC(y, m - 1, d, hour + 8);
}

export const checkInMs = (checkIn) => pacificInstantMs(checkIn, CHECK_IN_HOUR);
export const guideOpensAtMs = (checkIn) => checkInMs(checkIn) - GUIDE_OPENS_HOURS_BEFORE * HOUR_MS;
export const guideIsOpen = (checkIn, nowMs = Date.now()) => nowMs >= guideOpensAtMs(checkIn);
export function fmtOpensAt(checkIn) {
  const d = new Date(guideOpensAtMs(checkIn));
  const day = d.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return `${day} at ${time} Pacific`;
}

// ── GET /api/guest/booking ────────────────────────────────────────────────────

const STATUS_LABELS = {
  requested: 'Request received. We are reviewing your dates.',
  awaiting_payment: 'Dates approved. Payment is needed to confirm.',
  confirmed: 'Confirmed',
  other: 'Please contact us about this booking.',
};
const statusOf = (b) => ({ pending: 'requested', approved: 'awaiting_payment', confirmed: 'confirmed' }[b.status] || 'other');
const isoDay = (iso) => (iso ? String(iso).slice(0, 10) : null);
const nightsBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

export function buildGuestView(booking, rec, nowMs, deps) {
  const info = (deps.PROPERTY_INFO || {})[booking.propertyId] || {};
  const status = statusOf(booking);
  const deposit = Number(booking.securityDeposit) || 0;
  const paid = [];
  let balance = null;
  let plan = 'none';

  if (rec && rec.status === 'paid_full') {
    plan = 'full';
    paid.push({ label: 'Paid in full by card', amount: rec.full.charge, paidOn: isoDay(rec.full.paidAt) });
  } else if (rec && ['scheduled', 'failed', 'paid', 'needs_attention'].includes(rec.status)) {
    plan = 'split';
    paid.push({ label: 'First payment (50% plus 3% card fee)', amount: rec.first.charge, paidOn: isoDay(rec.first.paidAt) });
    if (rec.status === 'paid') paid.push({ label: 'Remaining balance (50% plus 3% card fee)', amount: rec.balance.charge, paidOn: isoDay(rec.balance.paidAt) });
    balance = {
      amount: rec.balance.charge,
      dueDate: rec.dueDate,
      status: rec.status === 'paid' ? 'paid' : rec.status === 'scheduled' ? 'scheduled' : rec.status === 'failed' ? 'failed' : 'needs_attention',
      last4: rec.last4 || null,
      brand: rec.brand || null,
      automatic: true,
    };
  } else if (status === 'confirmed' && booking.totalPaid > 0) {
    plan = 'single';
    paid.push({ label: 'Payment received', amount: booking.totalPaid, paidOn: isoDay(booking.confirmedAt) });
  }

  const canUpdateCard = !!rec && ['scheduled', 'failed'].includes(rec.status);
  const confirmed = status === 'confirmed';
  const guideUrl = confirmed && info.welcomeGuide
    ? `${info.welcomeGuide}${info.welcomeGuide.includes('?') ? '&' : '?'}b=${encodeURIComponent(booking.id)}&t=${encodeURIComponent(booking.payToken)}`
    : null;

  return {
    success: true,
    booking: {
      guestFirstName: String(booking.name || '').split(' ')[0] || null,
      property: booking.property,
      status,
      statusLabel: STATUS_LABELS[status],
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: nightsBetween(booking.checkIn, booking.checkOut),
      guests: booking.guests,
      checkInTime: '4:00 PM',
      checkOutTime: checkOutTime(booking.propertyId),
      // The address is only shown once the booking is confirmed (the confirmation email carries it too).
      address: confirmed ? info.address || null : null,
      mapsUrl: confirmed ? info.mapsUrl || null : null,
    },
    payment: {
      plan,
      stayTotal: booking.finalTotal > 0 ? booking.finalTotal : null,
      deposit: deposit > 0 ? { amount: deposit, refundable: true, note: depositPolicy(deposit) } : null,
      paid,
      totalPaid: paid.reduce((s, p) => s + p.amount, 0),
      balance,
    },
    policy: { cancellation: CANCELLATION_POLICY },
    links: {
      updateCard: canUpdateCard ? payLink(booking.id, booking.payToken, 'update') : null,
      welcomeGuide: guideUrl
        ? { url: guideUrl, opensAt: new Date(guideOpensAtMs(booking.checkIn)).toISOString(), opensAtLabel: fmtOpensAt(booking.checkIn), available: guideIsOpen(booking.checkIn, nowMs) }
        : null,
      contactEmail: CONTACT_EMAIL,
    },
  };
}

export async function handleGuestRoute(request, env, url, deps, nowMs = Date.now()) {
  if (url.pathname !== '/api/guest/booking') return null;
  if (request.method !== 'GET') return jsonRes(deps, { success: false, error: 'Method not allowed' }, 405);

  if (await isRateLimited(env, request, nowMs)) {
    return jsonRes(deps, { success: false, error: 'Too many attempts. Please try again in a little while.' }, 429);
  }
  const id = url.searchParams.get('id');
  const t = url.searchParams.get('t');
  const booking = await loadBooking(env, id);
  if (!validGuestToken(booking, t)) {
    await noteBadAttempt(env, request, nowMs);
    return jsonRes(deps, { success: false, error: 'This booking link is not valid.' }, 404);
  }
  const rec = await loadAutopay(env, id);
  return jsonRes(deps, buildGuestView(booking, rec, nowMs, deps));
}

// ── Welcome guide gate ────────────────────────────────────────────────────────
// The guide pages are static files on GitHub Pages; the Worker sits in front of
// every request on indigopalm.co, so it decides whether to pass one through.

const GUIDE_PROPERTIES = {
  'cozy-cactus': ['cozy-cactus'],
  'terra-luz': ['terra-luz', 'casa-moto'],
  'ps-retreat': ['ps-retreat'],
  'the-sundune': ['ps-retreat'],
  'the-well': ['the-well'],
};

export function matchGuidePath(pathname) {
  let m = pathname.match(/^\/(cozy-cactus|terra-luz|ps-retreat|the-well)\/welcome-(?:guide(?:\.html)?|book\.pdf)\/?$/);
  if (m) return { slug: m[1], propertyIds: GUIDE_PROPERTIES[m[1]] };
  m = pathname.match(/^\/(the-sundune)\/welcome-guide(?:\/.*)?$/);
  if (m) return { slug: m[1], propertyIds: GUIDE_PROPERTIES[m[1]] };
  return null;
}

const COOKIE = 'ip_guide';
const cookieValue = (request) => {
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
};
const setCookie = (value) => `${COOKIE}=${value}; Path=/; Max-Age=${21 * 86400}; HttpOnly; Secure; SameSite=Lax`;

function lockPage({ title, body, button, status = 200 }) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(title)} | Indigo Palm Collective</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#F6F1E8;color:#2C2C2C;font-family:'Work Sans',-apple-system,sans-serif;line-height:1.6;padding:56px 16px}.card{max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:36px 28px;box-shadow:0 2px 10px rgba(0,0,0,.05);text-align:center}.brand{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#4f6554;margin:0 0 18px}h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;margin:0 0 12px}p{margin:0 0 16px;color:#555;font-size:15px}a.btn{display:inline-block;padding:14px 30px;border-radius:999px;background:#647C69;color:#fff;text-decoration:none;font-weight:500;font-size:15px}a.t{color:#BB7D49}</style></head>
<body><div class="card"><p class="brand">Indigo Palm Collective</p><h1>${esc(title)}</h1>${body}${button ? `<p style="margin-top:22px"><a class="btn" href="${esc(button.href)}">${esc(button.label)}</a></p>` : ''}</div></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html;charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', ...NO_STORE } });
}

// Returns a Response when the request is for a welcome-guide path (the guide, or
// the lock page), or null for every other request.
export async function guideGate(request, env, url, nowMs = Date.now()) {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const g = matchGuidePath(url.pathname);
  if (!g) return null;

  const pass = async (cookie) => {
    const res = await fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    if (cookie) out.headers.append('Set-Cookie', cookie);
    return out;
  };

  // Legacy Airbnb/Hostaway guest messages link here with these UTM tags (via /go/welcome-*).
  // Those platforms time their own messages and those guests have no booking in our system.
  const legacy = url.searchParams.get('utm_source') === 'airbnb' && url.searchParams.get('utm_medium') === 'message';
  if (cookieValue(request) === 'legacy') return pass(null);
  if (legacy) return pass(setCookie('legacy'));

  let id = url.searchParams.get('b');
  let t = url.searchParams.get('t');
  const fromQuery = !!(id && t);
  if (!fromQuery) {
    const c = cookieValue(request);
    const i = c ? c.lastIndexOf(':') : -1;
    if (i > 0) { try { id = decodeURIComponent(c.slice(0, i)); } catch { id = null; } t = c.slice(i + 1); }
  }

  const invalid = () => lockPage({
    title: 'We could not open this guide', status: 404,
    body: `<p>Please open your welcome guide from the link in your pre-arrival email, or from your booking page. If you cannot find it, email us at <a class="t" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> and we will send it again.</p>`,
  });

  if (!id || !t) return invalid();
  if (await isRateLimited(env, request, nowMs)) return lockPage({ title: 'Please try again later', status: 429, body: '<p>Too many attempts. Please try again in a little while.</p>' });
  const booking = await loadBooking(env, id);
  if (!validGuestToken(booking, t) || booking.status !== 'confirmed' || !g.propertyIds.includes(booking.propertyId)) {
    await noteBadAttempt(env, request, nowMs);
    return invalid();
  }

  if (!guideIsOpen(booking.checkIn, nowMs)) {
    return lockPage({
      title: 'Your welcome guide is almost ready',
      body: `<p>Your welcome guide opens 48 hours before check-in, on <strong>${esc(fmtOpensAt(booking.checkIn))}</strong>. We will email you the link then, and you can also open it from your booking page.</p>`,
      button: { label: 'View your booking', href: bookingLink(id, t) },
    });
  }
  return pass(fromQuery ? setCookie(`${encodeURIComponent(id)}:${t}`) : null);
}

// ── Pre-arrival email ─────────────────────────────────────────────────────────

const pill = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;padding:14px 32px;background:#647C69;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:999px;letter-spacing:0.02em;">${label}</a>`;

export function buildPreArrivalEmail({ deps, booking, info }) {
  const { emailWrapper, detailRow, fmtDate } = deps;
  const checkin = (deps.PROPERTY_CHECKIN_INFO || {})[booking.propertyId];
  const beat = (deps.PROPERTY_STORY_BEATS || {})[booking.propertyId]?.welcome;
  const firstName = esc(String(booking.name).split(' ')[0]);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const guideLink = `${info.welcomeGuide}${info.welcomeGuide.includes('?') ? '&' : '?'}b=${encodeURIComponent(booking.id)}&t=${encodeURIComponent(booking.payToken)}`;
  const guests = booking.guests;

  return emailWrapper(`
    ${info.photo ? `<img src="${info.photo}" alt="${esc(info.name)}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" />` : ''}
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${esc(info.name)} &middot; ${fmtDate(booking.checkIn)} &ndash; ${fmtDate(booking.checkOut)}</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">You're almost here, ${firstName}.</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">Check-in is in 2 days, at 4:00 PM. Your welcome guide is open now, with parking, entry, house rules, Wi-Fi and local tips.</p>
    <p style="margin:0 0 28px;text-align:center;">${pill(guideLink, 'Open your welcome guide &rarr;')}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Address', `<a href="${info.mapsUrl}" style="color:#647C69;text-decoration:none;">${esc(info.address)} &rarr;</a>`)}
      ${detailRow('Check-in', `${fmtDate(booking.checkIn)}, 4:00 PM`)}
      ${detailRow('Check-out', `${fmtDate(booking.checkOut)}, ${checkOutTime(booking.propertyId)}`)}
      ${detailRow('Nights', `${nights} night${nights !== 1 ? 's' : ''}`)}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
    </table>
    ${checkin ? `
    <div style="padding:24px;background:#F6F1E8;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.08em;">Getting in</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        ${checkin.doorCode ? detailRow('Front door', checkin.doorCode) : ''}
        ${checkin.garageCode ? detailRow('Garage', checkin.garageCode) : ''}
      </table>
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2C2C2C;">WiFi</p>
      <p style="margin:0 0 14px;font-size:13px;color:#555;line-height:1.6;">Connect to &ldquo;Indigo Palm Collective&rdquo; and a browser window will pop up asking for your email. Enter it and you&rsquo;re all set.</p>
      ${checkin.notes ? `<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${checkin.notes}</p>` : ''}
    </div>` : `
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Your entry instructions and codes are in the welcome guide above.</p>`}
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;">Need your payment details, cancellation policy or the guide again? They are all on <a href="${esc(bookingLink(booking.id, booking.payToken))}" style="color:#BB7D49;">your booking page</a>. Please keep that link private.</p>
    <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.7;">See you in the desert.</p>
    ${beat ? `<p style="margin:0 0 20px;font-size:14px;color:#777;line-height:1.7;">P.S. ${beat}</p>` : ''}
    <p style="margin:0;font-size:14px;color:#888;">Questions? Reply here or reach us at <a href="mailto:${CONTACT_EMAIL}" style="color:#BB7D49;">${CONTACT_EMAIL}</a></p>
  `);
}

// Runs from the 10-minute cron. Sends each pre-arrival email at the same instant the
// guide opens (48 hours before the 4:00 PM Pacific check-in), never earlier.
// The `sendDate` stored on welcome:<id> records is no longer used for timing.
export async function sendDuePreArrivalEmails(env, deps, nowMs = Date.now()) {
  const { keys } = await env.BOOKINGS.list({ prefix: 'welcome:' });
  let sent = 0;
  for (const key of keys) {
    const raw = await env.BOOKINGS.get(key.name, { type: 'json' });
    const rec = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!rec || rec.sent || !guideIsOpen(rec.checkIn, nowMs)) continue;
    if (nowMs > checkInMs(rec.checkOut)) continue; // stay is over

    const info = deps.PROPERTY_INFO[rec.propertyId];
    if (!info?.welcomeGuide) continue;
    const booking = await loadBooking(env, rec.bookingId);
    if (!booking || booking.status !== 'confirmed') continue; // cancelled or unknown: no email
    if (!booking.payToken) { ensurePayToken(booking); await env.BOOKINGS.put(`booking:${booking.id}`, JSON.stringify(booking)); }

    try {
      await deps.sendEmail(env.RESEND_API_KEY, {
        from: FROM, to: booking.email, cc: CONTACT_EMAIL,
        subject: `Your welcome guide: ${info.name} (check-in ${deps.fmtDate(booking.checkIn)})`,
        html: buildPreArrivalEmail({ deps, booking, info }),
      });
      await env.BOOKINGS.put(key.name, JSON.stringify({ ...rec, sent: true, sentAt: new Date(nowMs).toISOString() }));
      sent++;
    } catch (err) {
      console.error(`Pre-arrival email failed for ${rec.bookingId}:`, err);
    }
  }
  return { sent };
}

// Section for the confirmation and payment-schedule emails.
export function bookingPageBlock(booking) {
  if (!booking?.id || !booking.payToken) return '';
  return `<div style="padding:20px;background:#F6F1E8;border-radius:8px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#2C2C2C;">Your booking page</p>
      <p style="margin:0 0 14px;font-size:13px;color:#555;line-height:1.6;">Your dates, payment schedule, cancellation policy and welcome guide (opens 48 hours before check-in) are all in one place. Please keep this link private.</p>
      <a href="${esc(bookingLink(booking.id, booking.payToken))}" style="display:inline-block;padding:14px 32px;background:#647C69;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:999px;letter-spacing:0.02em;">View your booking &rarr;</a>
    </div>`;
}
