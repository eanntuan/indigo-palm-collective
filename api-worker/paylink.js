// POST /api/send-pay-link (admin key required)
// Gets (and optionally emails) the branded card payment page link for an already-approved
// booking, for example one approved before the split-payment page existed, or when a guest
// later asks to pay by card in two halves. Body: { id, token, email?: boolean }

import { ensurePayToken } from './guest.js';
import { payLink, todayUtc } from './autopay.js';
import { splitAmounts, fullAmounts, balanceDueDate, isAutopayEligible } from './autopay-core.js';

const HOST_EMAIL = 'indigopalmco@gmail.com';
const FROM = 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>';
const usd = (n) => `$${Number(n).toFixed(2)}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function handleSendPayLink(request, env, deps) {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: deps.CORS_HEADERS });
  let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
  const { id, token } = body;
  if (!id || !token) return json({ success: false, error: 'Missing id or token' }, 400);

  const raw = await env.BOOKINGS.get(`booking:${id}`);
  if (!raw) return json({ success: false, error: 'Booking not found' }, 404);
  const booking = JSON.parse(raw);
  if (booking.token !== token) return json({ success: false, error: 'Invalid token' }, 403);
  if (booking.status !== 'approved') return json({ success: false, error: 'Only an approved, unpaid booking can get a card payment link' }, 400);
  if (!(Number(booking.finalTotal) > 0)) return json({ success: false, error: 'Booking has no approved total' }, 400);
  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_APPLICATION_ID) return json({ success: false, error: 'Card payments are not configured' }, 500);

  const hadToken = !!booking.payToken;
  const payToken = ensurePayToken(booking);
  if (!hadToken) await env.BOOKINGS.put(`booking:${id}`, JSON.stringify(booking));

  const deposit = booking.securityDeposit || 0;
  // With 50/50 available, the link opens straight to that plan (no pay-in-full chooser).
  const link = payLink(id, payToken) + (isAutopayEligible(booking.checkIn, todayUtc()) ? '&plan=split' : '');
  const splitAvailable = isAutopayEligible(booking.checkIn, todayUtc());
  const full = fullAmounts(booking.finalTotal, deposit);
  const split = splitAvailable ? splitAmounts(booking.finalTotal, deposit) : null;
  const dueDate = splitAvailable ? balanceDueDate(booking.checkIn) : null;

  let emailed = false;
  if (body.email === true) {
    const first = esc(String(booking.name || 'there').split(' ')[0]);
    const rows = [
      deps.detailRow('Property', esc(booking.property)),
      deps.detailRow('Dates', `${esc(deps.fmtDate(booking.checkIn))} to ${esc(deps.fmtDate(booking.checkOut))}`),
      deps.detailRow('Stay total', usd(booking.finalTotal)),
      deps.detailRow('Card fee (3%)', usd(full.charge - booking.finalTotal - deposit)),
      deposit > 0 ? deps.detailRow('Security deposit', `${usd(deposit)} (refundable, no fee)`) : '',
      split ? deps.detailRow('Pay today (50%)', `<strong>${usd(split.firstCharge)}</strong> (fee included)`) : '',
      split ? deps.detailRow(`Charged automatically ${esc(deps.fmtDate(dueDate))}`, `${usd(split.balanceCharge)} (the other 50%, fee included)`) : '',
      !split ? deps.detailRow('Pay in full today', `<strong>${usd(full.charge)}</strong>`) : '',
    ].join('');
    const intro = split
      ? `As requested, here is your link to pay 50% by card. When you pay, you will be asked to authorize us to <strong>save your card</strong> and <strong>automatically charge the remaining 50% on ${esc(deps.fmtDate(dueDate))}</strong>, which is 60 days before check-in. Amounts include the 3% card processing fee${deposit > 0 ? ' on the stay, plus your refundable security deposit' : ''}.`
      : `Pay the full amount by card. Amounts include the 3% card processing fee${deposit > 0 ? ' on the stay, plus your refundable security deposit' : ''}.`;
    await deps.sendEmail(env.RESEND_API_KEY, {
      from: FROM, to: booking.email, cc: HOST_EMAIL,
      subject: split ? `Your 50% card payment for ${booking.property}` : `Pay by card for ${booking.property}`,
      html: deps.emailWrapper(`
        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#2C2C2C;">Here's your card payment link, ${first}.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">${intro}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${rows}</table>
        <p style="margin:0 0 28px;"><a href="${esc(link)}" style="display:inline-block;padding:14px 32px;background:#647C69;color:#ffffff;text-decoration:none;border-radius:999px;font-size:15px;font-weight:600;">${split ? `Pay ${usd(split.firstCharge)} now` : 'Pay by card'}</a></p>
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">You can ask us to stop the automatic charge by emailing indigopalmco@gmail.com before ${split ? esc(deps.fmtDate(dueDate)) : 'the due date'}. Prefer Zelle? Reply to this email and we'll send those details.</p>
      `),
    });
    emailed = true;
  }

  return json({ success: true, link, emailed, splitAvailable, dueDate,
    amounts: { total: booking.finalTotal, deposit, first: split ? split.firstCharge : null, balance: split ? split.balanceCharge : null, full: full.charge } });
}
