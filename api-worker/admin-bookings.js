// Admin-only booking ledger: GET /api/admin/bookings (list) and POST /api/admin/record-payment.
// Neither route emails a guest. Both need ?key=ADMIN_DEBUG_KEY.

import { balanceDueDate, fullAmounts } from './autopay-core.js';

const r2 = (n) => Math.round(n * 100) / 100;

export async function handleAdminBookings(env, deps) {
  const { keys } = await env.BOOKINGS.list({ prefix: 'booking:', limit: 1000 });
  const rows = (await Promise.all(keys.map(k => env.BOOKINGS.get(k.name, { type: 'json' }))))
    .filter(Boolean)
    .map(({ token, payToken, ...b }) => ({
      id: b.id, status: b.status, property: b.property, name: b.name, email: b.email, phone: b.phone,
      checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, finalTotal: b.finalTotal,
      totalPaid: b.totalPaid ?? 0, balanceDue: b.balanceDue ?? null, balanceDueDate: b.balanceDueDate ?? null,
      payments: b.payments || [],
    }))
    .sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || ''));
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
