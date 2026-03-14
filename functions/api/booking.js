// Cloudflare Pages Function: Booking Request Handler
// Receives booking form, emails Eann + guest confirmation via Resend
// Deployed automatically at /api/booking
// Requires env var: RESEND_API_KEY (set in Cloudflare Pages > Settings > Environment variables)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const OWNER_EMAIL = 'indigopalmco@gmail.com';

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { property, checkIn, checkOut, guests, name, email, phone, specialRequests, pricing } = data;

    // Validate required fields
    if (!property || !checkIn || !checkOut || !guests || !name || !email || !phone) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400, headers: CORS_HEADERS
      });
    }

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

    // Send email to Eann
    await sendOwnerEmail({ property, checkIn, checkOut, guests, name, email, phone, specialRequests, pricing, timestamp }, env);

    // Send confirmation to guest (non-blocking)
    sendGuestConfirmation({ property, checkIn, checkOut, name, email, pricing }, env)
      .catch(err => console.error('Guest confirmation failed:', err));

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('Booking request error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Submission failed. Please try again.' }), {
      status: 500, headers: CORS_HEADERS
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

async function sendOwnerEmail(d, env) {
  const pricingHtml = d.pricing ? `
    <table style="width:100%; border-collapse:collapse; margin-top:8px;">
      <tr><td style="padding:4px 0; color:#555;">${d.pricing.nights} night${d.pricing.nights !== 1 ? 's' : ''}</td><td style="text-align:right;">$${d.pricing.subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0; color:#555;">Cleaning fee</td><td style="text-align:right;">$${d.pricing.cleaningFee.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0; color:#555;">Taxes</td><td style="text-align:right;">$${d.pricing.taxAmount.toFixed(2)}</td></tr>
      <tr style="font-weight:600; font-size:1.1em; border-top:2px solid #eee;">
        <td style="padding:8px 0;">TOTAL</td><td style="text-align:right;">$${d.pricing.total.toFixed(2)}</td>
      </tr>
    </table>` : '<p>No pricing calculated</p>';

  const html = `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:24px; background:#f9f9f9;">
      <div style="background:#738561; color:white; padding:20px 24px; border-radius:8px 8px 0 0;">
        <h1 style="margin:0; font-size:1.4em;">New Booking Request</h1>
        <p style="margin:4px 0 0; opacity:0.85; font-size:0.9em;">${d.timestamp} PT</p>
      </div>
      <div style="background:white; padding:24px; border-radius:0 0 8px 8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <h2 style="color:#738561; margin-top:0;">${d.property}</h2>

        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <tr><td style="padding:6px 0; color:#888; width:40%;">Check-in</td><td style="font-weight:500;">${formatDate(d.checkIn)}</td></tr>
          <tr><td style="padding:6px 0; color:#888;">Check-out</td><td style="font-weight:500;">${formatDate(d.checkOut)}</td></tr>
          <tr><td style="padding:6px 0; color:#888;">Guests</td><td style="font-weight:500;">${d.guests}</td></tr>
        </table>

        <hr style="border:none; border-top:1px solid #eee; margin:16px 0;">

        <h3 style="margin:0 0 12px; color:#333;">Guest</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <tr><td style="padding:6px 0; color:#888; width:40%;">Name</td><td style="font-weight:500;">${d.name}</td></tr>
          <tr><td style="padding:6px 0; color:#888;">Email</td><td><a href="mailto:${d.email}" style="color:#B67550;">${d.email}</a></td></tr>
          <tr><td style="padding:6px 0; color:#888;">Phone</td><td><a href="tel:${d.phone}" style="color:#B67550;">${d.phone}</a></td></tr>
          ${d.specialRequests ? `<tr><td style="padding:6px 0; color:#888;">Notes</td><td>${d.specialRequests}</td></tr>` : ''}
        </table>

        <hr style="border:none; border-top:1px solid #eee; margin:16px 0;">

        <h3 style="margin:0 0 12px; color:#333;">Price Estimate</h3>
        ${pricingHtml}

        <div style="background:#FFF8F0; border-left:4px solid #B67550; padding:16px; margin-top:24px; border-radius:0 8px 8px 0;">
          <p style="margin:0; font-weight:600; color:#B67550;">Next step: Send ${d.name} a Squarespace payment link for $${d.pricing ? d.pricing.total.toFixed(2) : '—'}</p>
          <p style="margin:8px 0 0; color:#555; font-size:0.9em;">Reply to: <a href="mailto:${d.email}">${d.email}</a></p>
        </div>
      </div>
    </div>`;

  await resendSend({
    from: 'Indigo Palm Collective <hello@indigopalm.co>',
    to: [OWNER_EMAIL],
    subject: `Booking Request: ${d.property} | ${formatDate(d.checkIn)} - ${formatDate(d.checkOut)} | ${d.name}`,
    html,
  }, env);
}

async function sendGuestConfirmation(d, env) {
  const html = `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:24px; background:#f9f9f9;">
      <div style="background:linear-gradient(135deg, #738561, #adbab7); color:white; padding:32px 24px; border-radius:8px 8px 0 0; text-align:center;">
        <h1 style="margin:0; font-weight:300; letter-spacing:2px; font-size:1.3em;">INDIGO PALM COLLECTIVE</h1>
      </div>
      <div style="background:white; padding:32px 24px; border-radius:0 0 8px 8px;">
        <h2 style="color:#738561; margin-top:0;">Request received, ${d.name.split(' ')[0]}.</h2>
        <p style="color:#555; line-height:1.6;">We got your booking request for <strong>${d.property}</strong> (${formatDate(d.checkIn)} to ${formatDate(d.checkOut)}) and we're reviewing it now.</p>
        <p style="color:#555; line-height:1.6;">We'll send you a payment link within 24 hours. Once payment is confirmed, your dates are locked in.</p>
        ${d.pricing ? `<div style="background:#f5f3ee; padding:16px; border-radius:8px; margin:20px 0;">
          <p style="margin:0; color:#888; font-size:0.85em; text-transform:uppercase; letter-spacing:1px;">Your estimate</p>
          <p style="margin:8px 0 0; font-size:1.4em; font-weight:600; color:#738561;">$${d.pricing.total.toFixed(2)}</p>
        </div>` : ''}
        <p style="color:#555; line-height:1.6;">Questions? Reply to this email or reach us at <a href="mailto:${OWNER_EMAIL}" style="color:#B67550;">${OWNER_EMAIL}</a>.</p>
        <p style="color:#555; margin-top:32px;">See you in the desert,<br><strong>Eann / Indigo Palm Collective</strong></p>
      </div>
    </div>`;

  await resendSend({
    from: 'Eann at Indigo Palm Collective <hello@indigopalm.co>',
    to: [d.email],
    subject: `Booking request received: ${d.property} | ${formatDate(d.checkIn)}`,
    html,
  }, env);
}

async function resendSend(payload, env) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}
