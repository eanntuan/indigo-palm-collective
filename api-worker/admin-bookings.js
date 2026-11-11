// Admin-only booking ledger: GET /api/admin/bookings (list) and POST /api/admin/record-payment.
// Neither route emails a guest. Both need ?key=ADMIN_DEBUG_KEY.

import { balanceDueDate, fullAmounts, addDays } from './autopay-core.js';
import { balanceInfo, reminderStage } from './zelle-balance.js';
import { guideOpensAtMs } from './guest.js';

const r2 = (n) => Math.round(n * 100) / 100;

// Guest emails the Worker still has queued for a direct booking. Airbnb and manual
// bookings get none from us. Dates are YYYY-MM-DD, `at` is when the cron fires.
async function upcomingMessages(env, b, today) {
  if (b.status !== 'confirmed' || ['airbnb', 'manual'].includes(b.source) || !b.email) return [];
  const out = [];
  const ap = await env.BOOKINGS.get(`autopay:${b.id}`, { type: 'json' });
  if (ap?.status === 'scheduled') out.push({ date: ap.dueDate, what: 'Balance charged to saved card, receipt emailed' });
  else if (!ap) {
    const info = balanceInfo(b);
    const done = b.balanceReminders || {};
    if (info) for (const [stage, days, what] of [['d14', -14, 'Balance reminder (2 weeks out)'], ['d3', -3, 'Balance reminder (3 days out)']]) {
      if (!done[stage] && addDays(info.dueDate, days) >= today) out.push({ date: addDays(info.dueDate, days), what });
    }
  }
  const w = await env.BOOKINGS.get(`welcome:${b.id}`, { type: 'json' });
  const rec = typeof w === 'string' ? JSON.parse(w) : w;
  if (rec && !rec.sent) out.push({ date: new Date(guideOpensAtMs(b.checkIn)).toISOString().slice(0, 10), what: 'Check-in details and welcome guide (48h before check-in)' });
  return out.filter(m => m.date >= today).sort((a, c) => a.date.localeCompare(c.date));
}

export async function handleAdminBookings(env, deps) {
  const { keys } = await env.BOOKINGS.list({ prefix: 'booking:', limit: 1000 });
  const today = new Date().toISOString().slice(0, 10);
  const full = (await Promise.all(keys.map(k => env.BOOKINGS.get(k.name, { type: 'json' })))).filter(Boolean);
  const rows = await Promise.all(full.map(async ({ token, payToken, ...b }) => ({
    id: b.id, status: b.status, property: b.property, name: b.name, email: b.email, phone: b.phone,
    checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, finalTotal: b.finalTotal,
    totalPaid: b.totalPaid ?? 0, balanceDue: b.balanceDue ?? null, balanceDueDate: b.balanceDueDate ?? null,
    payments: b.payments || [], source: b.source || null, confirmationCode: b.confirmationCode || null,
    upcoming: await upcomingMessages(env, { ...b, payToken }, today).catch(() => []),
  })));
  rows.sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || ''));
  return new Response(JSON.stringify({ success: true, bookings: rows }), { headers: deps.CORS_HEADERS });
}

// Body: { id, amount, method, date?, note?, ref? }. Adds a payment, recomputes the balance,
// confirms the booking, blocks the dates and schedules the welcome email. No guest email.
export async function handleRecordPayment(request, env, deps) {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: deps.CORS_HEADERS });
  let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
  const { id, amount, method, date, note, ref } = body;
  if (!id || !(Number(amount) > 0) || !method) return json({ success: false, error: 'Need id, amount, method' }, 400);

  const booking = await env.BOOKINGS.get(`booking:${id}`, { type: 'json' });
  if (!booking) return json({ success: false, error: 'Booking not found' }, 404);

  const payments = [...(booking.payments || []), {
    date: date || new Date().toISOString().slice(0, 10), amount: r2(Number(amount)), method, note: note || null, ref: ref || null,
  }];
  const totalPaid = r2(payments.reduce((s, p) => s + p.amount, 0));
  const grand = fullAmounts(booking.finalTotal, booking.securityDeposit || 0).charge;
  const balanceDue = Math.max(0, r2(grand - totalPaid));

  const { propertyId, name, email, checkIn, checkOut, guests } = booking;
  const info = deps.PROPERTY_INFO[propertyId];
  const firstConfirm = booking.status !== 'confirmed';

  if (firstConfirm) {
    if (['ps-retreat', 'the-well'].includes(propertyId)) {
      await deps.addIcalBooking(env, { propertyId, uid: id, checkIn, checkOut, guestName: name });
    }
    if (info?.welcomeGuide) {
      const send = new Date(checkIn + 'T00:00:00Z'); send.setUTCDate(send.getUTCDate() - 2);
      await env.BOOKINGS.put(`welcome:${id}`, JSON.stringify({
        bookingId: id, propertyId, name, email, checkIn, checkOut, guests,
        nights: Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5),
        sendDate: send.toISOString().slice(0, 10), sent: false,
      }));
    }
  }

  await env.BOOKINGS.put(`booking:${id}`, JSON.stringify({
    ...booking, status: 'confirmed', payments, totalPaid, paymentMethod: method, balanceDue,
    balanceDueDate: balanceDue > 0 ? balanceDueDate(checkIn) : null,
    confirmedAt: booking.confirmedAt || new Date().toISOString(),
  }));
  return json({ success: true, firstConfirm, totalPaid, grand, balanceDue, balanceDueDate: balanceDue > 0 ? balanceDueDate(checkIn) : null });
}

// Body: { propertyId, name, email?, phone?, checkIn, checkOut, guests, finalTotal, source?, paid? }.
// Adds a confirmed booking made outside the site (Airbnb, phone). No TTL, no guest email.
export async function handleAddBooking(request, env, deps) {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: deps.CORS_HEADERS });
  let b; try { b = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
  const info = deps.PROPERTY_INFO[b.propertyId];
  if (!info || !b.name || !b.checkIn || !b.checkOut || !(b.checkOut > b.checkIn)) return json({ success: false, error: 'Need valid propertyId, name, checkIn, checkOut' }, 400);

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const finalTotal = r2(Number(b.finalTotal) || 0);
  const payments = Number(b.paid) > 0 ? [{ date: new Date().toISOString().slice(0, 10), amount: r2(Number(b.paid)), method: b.source || 'manual', note: null, ref: null }] : [];
  const totalPaid = r2(payments.reduce((s, p) => s + p.amount, 0));
  const balanceDue = Math.max(0, r2(finalTotal - totalPaid));
  await env.BOOKINGS.put(`booking:${id}`, JSON.stringify({
    id, status: 'confirmed', property: info.name, propertyId: b.propertyId, name: b.name, email: b.email || '', phone: b.phone || '',
    checkIn: b.checkIn, checkOut: b.checkOut, guests: Number(b.guests) || null, finalTotal,
    source: b.source || 'manual', payments, totalPaid, balanceDue,
    balanceDueDate: balanceDue > 0 ? balanceDueDate(b.checkIn) : null, confirmedAt: new Date().toISOString(),
  }));
  if (['ps-retreat', 'the-well'].includes(b.propertyId)) {
    await deps.addIcalBooking(env, { propertyId: b.propertyId, uid: id, checkIn: b.checkIn, checkOut: b.checkOut, guestName: b.name });
  }
  return json({ success: true, id });
}
