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

  const { property, checkIn, checkOut, guests, name, email, phone, specialRequests, pricing } = body;

  if (!property || !checkIn || !checkOut || !name || !email || !phone) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const priceTotal = pricing?.total ? `$${pricing.total.toFixed(2)}` : 'TBD';

  const hostEmailHtml = `
    <h2>New Booking Request — Indigo Palm Collective</h2>
    <table>
      <tr><td><strong>Property</strong></td><td>${property}</td></tr>
      <tr><td><strong>Check-in</strong></td><td>${checkIn}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${checkOut}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${guests}</td></tr>
      <tr><td><strong>Total</strong></td><td>${priceTotal}</td></tr>
    </table>
    <hr>
    <table>
      <tr><td><strong>Guest Name</strong></td><td>${name}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
      ${specialRequests ? `<tr><td><strong>Special Requests</strong></td><td>${specialRequests}</td></tr>` : ''}
    </table>
  `;

  const guestEmailHtml = `
    <h2>We got your booking request!</h2>
    <p>Hi ${name},</p>
    <p>Thanks for your interest in <strong>${property}</strong>. We'll review your request and send a payment link within 24 hours.</p>
    <table>
      <tr><td><strong>Check-in</strong></td><td>${checkIn}</td></tr>
      <tr><td><strong>Check-out</strong></td><td>${checkOut}</td></tr>
      <tr><td><strong>Guests</strong></td><td>${guests}</td></tr>
      <tr><td><strong>Estimated Total</strong></td><td>${priceTotal}</td></tr>
    </table>
    <p style="margin-top:1.5rem;">Questions? Email us at <a href="mailto:indigopalmco@gmail.com">indigopalmco@gmail.com</a></p>
  `;

  try {
    await Promise.all([
      sendEmail(env.RESEND_API_KEY, {
        from: 'bookings@indigopalm.co',
        to:   'indigopalmco@gmail.com',
        subject: `New Booking Request: ${property} (${checkIn} to ${checkOut})`,
        html:  hostEmailHtml,
        reply_to: email,
      }),
      sendEmail(env.RESEND_API_KEY, {
        from: 'bookings@indigopalm.co',
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
