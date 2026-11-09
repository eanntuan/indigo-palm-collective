// Balance reminders for guests who pay by Zelle (or check/cash) instead of card autopay.
//
// Card guests are handled by autopay.js. For everyone else the host confirms the
// first payment by hand (/api/confirm-payment), and the rest is due 60 days before
// check-in. This module reminds the guest 14 and 3 days before that date and tells
// the host the day after if it is still unpaid. Recording the balance payment
// (/api/balance-received) stops the reminders.
//
// Pure helpers are exported for tests; the daily runner takes injected helpers the
// same way autopay.js does, so it can live outside index.js.

import { balanceDueDate, addDays } from './autopay-core.js';

const HOST_EMAIL = 'indigopalmco@gmail.com';
const FROM = 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>';
const SITE = 'https://indigopalm.co';
const OFF_PLATFORM = ['zelle', 'check', 'cash'];
// Only bookings approved on or after this date are chased automatically, so guests who
// were already booked under the old process do not suddenly get reminder emails.
export const REMINDERS_FROM = '2026-11-09';

const usd = (n) => `$${Number(n).toFixed(2)}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayUtc = (nowMs) => new Date(nowMs).toISOString().slice(0, 10);

// What does this booking still owe? Returns null when there is nothing to chase.
export function balanceInfo(booking) {
  if (!booking || booking.status !== 'confirmed') return null;
  if (!OFF_PLATFORM.includes(booking.paymentMethod || 'zelle')) return null;
  const finalTotal = Number(booking.finalTotal);
  if (!(finalTotal > 0)) return null; // old bookings without an approved total: never guess
  if (!booking.approvedAt || booking.approvedAt.slice(0, 10) < REMINDERS_FROM) return null;
  const owed = Math.round((finalTotal + (Number(booking.securityDeposit) || 0)) * 100);
  const paid = Math.round((Number(booking.totalPaid) || 0) * 100);
  const remaining = owed - paid;
  if (remaining <= 1) return null; // paid in full (1 cent of rounding slack)
  return { owed: owed / 100, paid: paid / 100, remaining: remaining / 100, dueDate: balanceDueDate(booking.checkIn) };
}

// Which reminder is due today? 'd14' | 'd3' | 'overdue' | null. Only the current stage is
// returned, so a booking confirmed late never gets two emails at once.
export function reminderStage(info, today) {
  if (!info) return null;
  if (today >= addDays(info.dueDate, 1)) return 'overdue';
  if (today >= addDays(info.dueDate, -3)) return 'd3';
  if (today >= addDays(info.dueDate, -14)) return 'd14';
  return null;
}

const STAGE_ORDER = ['d14', 'd3', 'overdue'];

export async function processZelleReminders(env, deps, nowMs = Date.now()) {
  if (!env.BOOKINGS || !env.RESEND_API_KEY) return { sent: 0 };
  const today = todayUtc(nowMs);
  let cursor; let sent = 0;
  do {
    const page = await env.BOOKINGS.list({ prefix: 'booking:', cursor });
    for (const k of page.keys) {
      try {
        const raw = await env.BOOKINGS.get(k.name);
        if (!raw) continue;
        const booking = JSON.parse(raw);
        const info = balanceInfo(booking);
        const stage = reminderStage(info, today);
        if (!stage) continue;
        // Skip when a card autopay record owns this booking's balance.
        const ap = await env.BOOKINGS.get(`autopay:${booking.id}`);
        if (ap && !['cancelled'].includes(JSON.parse(ap).status)) continue;
        const done = booking.balanceReminders || {};
        if (done[stage]) continue;

        if (stage === 'overdue') await sendHostOverdue(env, deps, booking, info);
        else await sendGuestReminder(env, deps, booking, info, stage);

        // Mark this stage and any earlier ones, so we never send the missed ones later.
        const marks = { ...done };
        for (const s of STAGE_ORDER) { marks[s] = marks[s] || new Date(nowMs).toISOString(); if (s === stage) break; }
        booking.balanceReminders = marks;
        await env.BOOKINGS.put(k.name, JSON.stringify(booking));
        sent++;
      } catch (e) { console.error(`Zelle reminder failed for ${k.name}`, e); }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { sent };
}

async function sendGuestReminder(env, deps, booking, info, stage) {
  const first = esc(String(booking.name || 'there').split(' ')[0]);
  const when = deps.fmtDate(info.dueDate);
  const soon = stage === 'd3' ? 'is due in 3 days' : 'is due in two weeks';
  await deps.sendEmail(env.RESEND_API_KEY, {
    from: FROM, to: booking.email, cc: HOST_EMAIL,
    subject: `Your remaining balance for ${booking.property} ${stage === 'd3' ? 'is due soon' : `is due ${when}`}`,
    html: deps.emailWrapper(`
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#2C2C2C;">A quick reminder, ${first}.</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">Your remaining balance for <strong>${esc(booking.property)}</strong> ${soon}, on <strong>${esc(when)}</strong> (60 days before check-in).</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${deps.detailRow('Check-in', esc(deps.fmtDate(booking.checkIn)))}
        ${deps.detailRow('Check-out', esc(deps.fmtDate(booking.checkOut)))}
        ${deps.detailRow('Paid so far', usd(info.paid))}
        ${deps.detailRow('Balance due', `<strong>${usd(info.remaining)}</strong>`)}
      </table>
      <div style="padding:20px;background:#F5F3EE;border-radius:8px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Zelle (no fee): ${usd(info.remaining)}</p>
        <p style="margin:0;font-size:14px;color:#555;">Send to <strong>214-606-1340</strong> (MPT Industries) and reply to this email to confirm.</p>
      </div>
      <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">Already sent it? Thank you, and please ignore this note. Questions? Reply here or email <a href="mailto:${HOST_EMAIL}" style="color:#B67550;">${HOST_EMAIL}</a>.</p>
    `),
  });
}

async function sendHostOverdue(env, deps, booking, info) {
  const link = `${SITE}/admin-approve.html?id=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(booking.token)}&key=${encodeURIComponent(env.ADMIN_DEBUG_KEY || '')}`;
  await deps.sendEmail(env.RESEND_API_KEY, {
    from: FROM, to: HOST_EMAIL,
    subject: `Balance overdue: ${booking.name}, ${usd(info.remaining)} was due ${info.dueDate}`,
    html: deps.emailWrapper(`
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#2C2C2C;">Balance not received</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">${esc(booking.name)} (${esc(booking.property)}, ${esc(deps.fmtDate(booking.checkIn))} to ${esc(deps.fmtDate(booking.checkOut))}) still owes <strong>${usd(info.remaining)}</strong>. It was due ${esc(deps.fmtDate(info.dueDate))}.</p>
      <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">If you have been paid, <a href="${link}" style="color:#B67550;">record the payment</a> so reminders stop. Otherwise contact the guest or release the dates.</p>
    `),
  });
}

// ── POST /api/balance-received (admin key required) ───────────────────────────
// Body: { id, token, amount, method, note }
export async function handleBalanceReceived(request, env, deps) {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: deps.CORS_HEADERS });
  let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
  const { id, token, method, note } = body;
  const amount = Math.round(parseFloat(body.amount) * 100) / 100;
  if (!id || !token || !(amount > 0)) return json({ success: false, error: 'Missing id, token or amount' }, 400);

  const raw = await env.BOOKINGS.get(`booking:${id}`);
  if (!raw) return json({ success: false, error: 'Booking not found' }, 404);
  const booking = JSON.parse(raw);
  if (booking.token !== token) return json({ success: false, error: 'Invalid token' }, 403);
  if (booking.status !== 'confirmed') return json({ success: false, error: 'Only a confirmed booking can take a balance payment' }, 400);

  const before = balanceInfo(booking);
  const payments = [...(booking.balancePayments || []), {
    amount, method: ['zelle', 'check', 'cash'].includes(method) ? method : 'zelle',
    note: note ? String(note).slice(0, 300) : null, at: new Date().toISOString(),
  }];
  const updated = { ...booking, totalPaid: Math.round(((Number(booking.totalPaid) || 0) + amount) * 100) / 100, balancePayments: payments };
  await env.BOOKINGS.put(`booking:${id}`, JSON.stringify(updated));
  const after = balanceInfo(updated);

  try {
    await deps.sendEmail(env.RESEND_API_KEY, {
      from: FROM, to: booking.email, cc: HOST_EMAIL,
      subject: after ? `Payment received for ${booking.property}` : `Your ${booking.property} booking is paid in full`,
      html: deps.emailWrapper(`
        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#2C2C2C;">Thank you, ${esc(String(booking.name).split(' ')[0])}.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">We received ${usd(amount)}. ${after ? `Your remaining balance is ${usd(after.remaining)}, due ${esc(deps.fmtDate(after.dueDate))}.` : 'Your booking is now paid in full.'}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          ${deps.detailRow('Total paid', usd(updated.totalPaid))}
        </table>
      `),
    });
  } catch (e) { console.error('Balance receipt email failed', e); }

  return json({ success: true, totalPaid: updated.totalPaid, remaining: after ? after.remaining : 0, wasOwed: before ? before.remaining : 0 });
}
