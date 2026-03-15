// Cloudflare Worker: Indigo Palm API
// Handles /api/availability, /api/pricing, /api/booking
// Routes: indigopalm.co/api/*
//
// Deploy:
//   cd api-worker
//   wrangler deploy
//
// Set secrets (one-time, run these before deploying):
//   wrangler secret put PRICELABS_API_KEY
//   wrangler secret put RESEND_API_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const ICAL_URLS = {
  'cozy-cactus': 'https://www.airbnb.com/calendar/ical/610023395582313286.ics?t=e3b2c94c1a67433bb8d523906b3e5df1',
  'casa-moto':   'https://www.airbnb.com/calendar/ical/716871660845992276.ics?t=74de1981b38c40fbb8800fb4550371d6',
  'ps-retreat':  'https://www.airbnb.com/calendar/ical/1171049679026732503.ics?t=2e21a1a79aee49afaf440d1093afc318',
  'the-well':    'https://www.airbnb.com/calendar/ical/868862893900280104.ics?t=d0aa2a8c829445d695c19e79c80aa1f1',
};

const PRICELABS_LISTINGS = {
  'cozy-cactus': { id: '123646',             pms: 'hostaway' },
  'casa-moto':   { id: '123633',             pms: 'hostaway' },
  'ps-retreat':  { id: '1470484',            pms: 'smartbnb' },
  'the-well':    { id: '868862893900280104', pms: 'airbnb'   },
};

const PROPERTY_CONFIG = {
  'cozy-cactus': { basePrice: 250, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  'casa-moto':   { basePrice: 275, cleaningFee: 250, taxRate: 0.12,  maxGuests: 6, minNights: 2 },
  'ps-retreat':  { basePrice: 280, cleaningFee: 200, taxRate: 0.135, maxGuests: 4, minNights: 2 },
  'the-well':    { basePrice: 300, cleaningFee: 200, taxRate: 0.135, maxGuests: 8, minNights: 2 },
};

const PEAK_DATES = [
  { start: '2026-04-10', end: '2026-04-20', multiplier: 1.5, label: 'Coachella W1' },
  { start: '2026-04-17', end: '2026-04-27', multiplier: 1.5, label: 'Coachella W2' },
  { start: '2026-04-24', end: '2026-05-04', multiplier: 1.3, label: 'Stagecoach'   },
  { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
  { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday'      },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (path === '/api/availability' && request.method === 'GET') {
      return handleAvailability(url);
    }

    if (path === '/api/pricing' && request.method === 'GET') {
      return handlePricing(url, env);
    }

    if (path === '/api/booking' && request.method === 'POST') {
      return handleBooking(request, env);
    }

    if (path === '/api/discount' && request.method === 'GET') {
      return handleDiscount(url, env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: CORS_HEADERS,
    });
  },
};

// ── Availability ──────────────────────────────────────────────────────────────

async function handleAvailability(url) {
  const propertyId = url.searchParams.get('property');

  if (!propertyId || !ICAL_URLS[propertyId]) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid property' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  try {
    const icalResponse = await fetch(ICAL_URLS[propertyId], {
      headers: { 'User-Agent': 'IndigoPalmCollective/1.0' },
    });

    if (!icalResponse.ok) throw new Error(`iCal fetch failed: ${icalResponse.status}`);

    const icalText = await icalResponse.text();
    const blockedDates = parseIcal(icalText);

    return new Response(JSON.stringify({ success: true, blockedDates }), {
      status: 200, headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('Availability error:', error);
    return new Response(JSON.stringify({ success: true, blockedDates: [] }), {
      status: 200, headers: CORS_HEADERS,
    });
  }
}

function parseIcal(icalText) {
  const blockedDates = new Set();
  const events = icalText.split('BEGIN:VEVENT');

  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    const startMatch = event.match(/DTSTART(?:[^:]*):(\d{8})/);
    const endMatch   = event.match(/DTEND(?:[^:]*):(\d{8})/);

    if (!startMatch || !endMatch) continue;

    const start = parseYYYYMMDD(startMatch[1]);
    const end   = parseYYYYMMDD(endMatch[1]);
    if (!start || !end) continue;

    const current = new Date(start);
    while (current < end) {
      blockedDates.add(toDateString(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return Array.from(blockedDates).sort();
}

function parseYYYYMMDD(str) {
  const y = parseInt(str.substring(0, 4));
  const m = parseInt(str.substring(4, 6)) - 1;
  const d = parseInt(str.substring(6, 8));
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(Date.UTC(y, m, d));
}

function toDateString(date) {
  return date.toISOString().split('T')[0];
}

// ── Pricing ───────────────────────────────────────────────────────────────────

async function handlePricing(url, env) {
  const propertyId = url.searchParams.get('property');
  const checkIn    = url.searchParams.get('checkIn');
  const checkOut   = url.searchParams.get('checkOut');

  if (!propertyId || !PROPERTY_CONFIG[propertyId] || !checkIn || !checkOut) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required params' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const config = PROPERTY_CONFIG[propertyId];
  const start  = new Date(checkIn  + 'T00:00:00');
  const end    = new Date(checkOut + 'T00:00:00');
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));

  if (nights < 1) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid date range' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  if (nights < config.minNights) {
    return new Response(JSON.stringify({ success: false, error: `Minimum stay is ${config.minNights} nights` }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  // Try PriceLabs for real per-night prices
  const pl = PRICELABS_LISTINGS[propertyId];
  let plPriceMap = null;

  try {
    const plRes = await fetch('https://api.pricelabs.co/v1/listing_prices', {
      method: 'POST',
      headers: {
        'X-API-Key': env.PRICELABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        listings: [{ id: pl.id, pms: pl.pms, dateFrom: checkIn, dateTo: checkOut }],
      }),
    });

    if (plRes.ok) {
      const plData = await plRes.json();
      const listing = Array.isArray(plData) ? plData[0] : null;
      if (listing && !listing.error_status && listing.data?.length > 0) {
        plPriceMap = {};
        for (const day of listing.data) {
          plPriceMap[day.date] = day.price;
        }
      }
    }
  } catch (e) {
    console.error('PriceLabs API error, using fallback:', e);
  }

  // Build per-night breakdown
  const nightly = [];
  let subtotal = 0;
  const cur = new Date(start);

  for (let i = 0; i < nights; i++) {
    const dateStr = cur.toISOString().split('T')[0];
    let rate, peakLabel = null;

    if (plPriceMap && plPriceMap[dateStr] != null) {
      rate = plPriceMap[dateStr];
    } else {
      let multiplier = 1;
      for (const peak of PEAK_DATES) {
        if (dateStr >= peak.start && dateStr < peak.end && peak.multiplier > multiplier) {
          multiplier = peak.multiplier;
          peakLabel = peak.label;
        }
      }
      rate = Math.round(config.basePrice * multiplier);
    }

    subtotal += rate;
    nightly.push({ date: dateStr, rate, peakLabel });
    cur.setDate(cur.getDate() + 1);
  }

  const cleaningFee = config.cleaningFee;
  const taxAmount   = (subtotal + cleaningFee) * config.taxRate;
  const total       = subtotal + cleaningFee + taxAmount;

  return new Response(JSON.stringify({
    success: true,
    pricing: { nights, nightly, subtotal, cleaningFee, taxRate: config.taxRate, taxAmount, total },
  }), { status: 200, headers: CORS_HEADERS });
}

// ── Booking ───────────────────────────────────────────────────────────────────

async function handleBooking(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const { property, checkIn, checkOut, guests, name, email, phone, specialRequests, pricing, discountCode } = body;

  if (!property || !checkIn || !checkOut || !name || !email || !phone) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  // Validate + consume discount code
  let discountAmount = 0;
  let discountLabel = null;
  if (discountCode && env.DISCOUNT_CODES) {
    const key = discountCode.trim().toUpperCase();
    const raw = await env.DISCOUNT_CODES.get(key);
    if (raw) {
      const codeData = JSON.parse(raw);
      if (!codeData.used && pricing?.total) {
        discountAmount = codeData.type === 'percent'
          ? pricing.total * (codeData.amount / 100)
          : codeData.amount;
        discountAmount = Math.min(discountAmount, pricing.total);
        discountLabel = codeData.type === 'percent'
          ? `${codeData.amount}% off (${key})`
          : `$${codeData.amount} off (${key})`;
        // Mark as used
        await env.DISCOUNT_CODES.put(key, JSON.stringify({ ...codeData, used: true, usedBy: email, usedAt: new Date().toISOString() }));
      }
    }
  }

  const finalTotal = pricing?.total ? Math.max(0, pricing.total - discountAmount) : null;
  const priceTotal = finalTotal != null ? `$${finalTotal.toFixed(2)}` : 'TBD';
  const priceCents = finalTotal != null ? Math.round(finalTotal * 100) : null;

  // Format dates nicely: 2026-05-22 -> May 22, 2026
  function fmtDate(d) {
    if (!d) return d;
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Generate Square payment link
  let paymentLink = null;
  if (priceCents && env.SQUARE_ACCESS_TOKEN) {
    try {
      paymentLink = await createSquarePaymentLink(env.SQUARE_ACCESS_TOKEN, {
        name: `${property} — ${fmtDate(checkIn)} to ${fmtDate(checkOut)}`,
        amountCents: priceCents,
        note: `Guest: ${name} | ${guests} guest${guests !== 1 ? 's' : ''} | ${checkIn} to ${checkOut}`,
      });
    } catch (e) {
      console.error('Square payment link failed:', e);
    }
  }

  const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#969A7F;padding:28px 36px;border-radius:12px 12px 0 0;text-align:center;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:0.05em;">Indigo Palm Collective</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;border-radius:0 0 12px 12px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999;">indigopalm.co &nbsp;&middot;&nbsp; indigopalmco@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const detailRow = (label, value) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;color:#888;font-size:13px;width:120px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;color:#2C2C2C;font-size:14px;font-weight:500;">${value}</td>
    </tr>`;

  const hostEmailHtml = emailWrapper(`
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#969A7F;text-transform:uppercase;letter-spacing:0.1em;">New Booking Request</p>
    <h1 style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">${property}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Check-in', fmtDate(checkIn))}
      ${detailRow('Check-out', fmtDate(checkOut))}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      ${discountLabel ? detailRow('Discount', `<span style="color:#B67550;">-${discountLabel}</span>`) : ''}
      ${detailRow('Total', priceTotal)}
    </table>
    ${paymentLink ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="padding:20px;background:#F5F3EE;border-radius:8px;text-align:center;">
        <a href="${paymentLink}" style="display:inline-block;padding:14px 32px;background:#969A7F;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;letter-spacing:0.02em;">Collect Payment ${priceTotal} &rarr;</a>
      </td></tr>
    </table>` : ''}
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;">Guest Details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('Name', name)}
      ${detailRow('Email', `<a href="mailto:${email}" style="color:#B67550;">${email}</a>`)}
      ${detailRow('Phone', phone)}
      ${specialRequests ? detailRow('Notes', specialRequests) : ''}
    </table>
  `);

  const guestEmailHtml = emailWrapper(`
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#969A7F;text-transform:uppercase;letter-spacing:0.1em;">Booking Request</p>
    <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">Your dates are on our radar.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">Hi ${name.split(' ')[0]}, thanks for reaching out about <strong>${property}</strong>. We'll be in touch within 24 hours with a payment link to lock it in.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Property', property)}
      ${detailRow('Check-in', fmtDate(checkIn))}
      ${detailRow('Check-out', fmtDate(checkOut))}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      ${detailRow('Est. Total', priceTotal)}
    </table>
    <div style="margin-top:28px;padding:20px;background:#F5F3EE;border-radius:8px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#2C2C2C;">Payment Options</p>
      <p style="margin:0 0 8px;font-size:14px;color:#555;">
        <strong style="color:#2C2C2C;">Zelle (no fee):</strong> Send to <strong>214-606-1340</strong> (MPT Industries)
      </p>
      <p style="margin:0;font-size:14px;color:#555;">
        <strong style="color:#2C2C2C;">Credit card (3% fee):</strong> We'll send a Square payment link.
      </p>
    </div>
    <p style="margin:20px 0 0;font-size:14px;color:#888;">Questions? Reply to this email or reach us at <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);

  try {
    await Promise.all([
      sendEmail(env.RESEND_API_KEY, {
        from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
        to:   'indigopalmco@gmail.com',
        subject: `New Booking Request: ${property} (${fmtDate(checkIn)} to ${fmtDate(checkOut)})`,
        html:  hostEmailHtml,
        reply_to: email,
      }),
      sendEmail(env.RESEND_API_KEY, {
        from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
        to:   email,
        subject: `Booking Request Received — ${property}`,
        html:  guestEmailHtml,
      }),
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error('Email send failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send confirmation email' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
}

// ── Discount Codes ────────────────────────────────────────────────────────────

async function handleDiscount(url, env) {
  const code = url.searchParams.get('code')?.trim().toUpperCase();
  const total = parseFloat(url.searchParams.get('total'));

  if (!code) {
    return new Response(JSON.stringify({ success: false, error: 'No code provided' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  if (!env.DISCOUNT_CODES) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid code' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const raw = await env.DISCOUNT_CODES.get(code);
  if (!raw) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid code' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const codeData = JSON.parse(raw);
  if (codeData.used) {
    return new Response(JSON.stringify({ success: false, error: 'This code has already been used' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const discountAmount = codeData.type === 'percent'
    ? (total * (codeData.amount / 100))
    : codeData.amount;

  return new Response(JSON.stringify({
    success: true,
    type: codeData.type,
    amount: codeData.amount,
    discountAmount: Math.min(discountAmount, total),
    label: codeData.type === 'percent' ? `${codeData.amount}% off` : `$${codeData.amount} off`,
  }), { status: 200, headers: CORS_HEADERS });
}

async function createSquarePaymentLink(accessToken, { name, amountCents, note }) {
  // Fetch first location
  const locRes = await fetch('https://connect.squareup.com/v2/locations', {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Square-Version': '2024-01-18' },
  });
  if (!locRes.ok) throw new Error(`Square locations fetch failed: ${locRes.status}`);
  const locData = await locRes.json();
  const locationId = locData.locations?.[0]?.id;
  if (!locationId) throw new Error('No Square location found');

  const idempotencyKey = `indigo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const res = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      quick_pay: {
        name,
        price_money: { amount: amountCents, currency: 'USD' },
        location_id: locationId,
      },
      payment_note: note,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Square payment link failed: ${err}`);
  }

  const data = await res.json();
  return data.payment_link?.url;
}

async function sendEmail(apiKey, { from, to, subject, html, reply_to }) {
  const payload = { from, to, subject, html };
  if (reply_to) payload.reply_to = reply_to;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}
