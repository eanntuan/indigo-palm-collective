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

const PROPERTY_INFO = {
  'cozy-cactus': {
    name: 'The Cozy Cactus',
    address: '82381 Cochran Dr, Indio, CA 92201',
    mapsUrl: 'https://maps.google.com/?q=82381+Cochran+Dr,+Indio,+CA+92201',
    photo: 'https://indigopalm.co/email-images/cozy-cactus.jpg',
    welcomeGuide: 'https://indigopalm.co/cozy-cactus/welcome-guide.html',
    airbnb: 'https://www.airbnb.com/rooms/610023395582313286',
  },
  'casa-moto': {
    name: 'Casa Moto',
    address: '49768 Pacino St, Indio, CA 92201',
    mapsUrl: 'https://maps.google.com/?q=49768+Pacino+St,+Indio,+CA+92201',
    photo: 'https://indigopalm.co/email-images/casa-moto.jpg',
    welcomeGuide: 'https://indigopalm.co/terra-luz/welcome-guide.html',
    airbnb: 'https://www.airbnb.com/rooms/716871660845992276',
  },
  'ps-retreat': {
    name: 'PS Retreat',
    address: '5301 E Waverly Dr #184, Palm Springs, CA 92264',
    mapsUrl: 'https://maps.google.com/?q=5301+E+Waverly+Dr+%23184,+Palm+Springs,+CA+92264',
    photo: 'https://indigopalm.co/email-images/ps-retreat.jpg',
    welcomeGuide: 'https://indigopalm.co/ps-retreat/welcome-guide.html',
    airbnb: 'https://www.airbnb.com/rooms/1171049679026732503',
  },
  'the-well': {
    name: 'The Well',
    address: '510 N Villa Ct #106, Palm Springs, CA 92262',
    mapsUrl: 'https://maps.google.com/?q=510+N+Villa+Ct+%23106,+Palm+Springs,+CA+92262',
    photo: 'https://indigopalm.co/email-images/the-well.jpg',
    welcomeGuide: null,
    airbnb: null,
  },
};

// Hostaway listing IDs — only properties managed on Hostaway
// ps-retreat is on Hospitable; the-well is Airbnb-only
const HOSTAWAY_LISTING_IDS = {
  'cozy-cactus': 123646,
  'casa-moto':   123633,
};

const PROPERTY_CONFIG = {
  'cozy-cactus': { basePrice: 250, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  'casa-moto':   { basePrice: 275, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
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

    if (path === '/api/booking' && request.method === 'GET') {
      return handleGetBooking(url, env);
    }

    if (path === '/api/approve' && request.method === 'POST') {
      return handleApprove(request, env);
    }

    if (path === '/api/confirm' && request.method === 'POST') {
      return handleConfirm(request, env);
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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtDate(d) {
  if (!d) return d;
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:#607c67;padding:24px 36px;border-radius:12px 12px 0 0;text-align:center;">
            <img src="https://indigopalm.co/images/logo-icon.png" alt="Indigo Palm Collective" width="52" height="52" style="display:inline-block;width:52px;height:52px;border-radius:50%;margin-bottom:10px;" /><br>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#ffffff;letter-spacing:0.08em;">Indigo Palm Collective</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:36px;border-radius:0 0 12px 12px;">
            ${content}
          </td>
        </tr>
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
}

function detailRow(label, value) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;color:#888;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;color:#2C2C2C;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

async function handleBooking(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const { property, propertyId, checkIn, checkOut, guests, name, email, phone,
          specialRequests, pricing, discountCode, poolHeat, poolHeatNights, poolHeatCost } = body;

  if (!property || !checkIn || !checkOut || !name || !email || !phone) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  // Validate discount code (but don't consume yet — consume on approve)
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
      }
    }
  }

  const baseTotal = (pricing?.total || 0) + (poolHeat ? (poolHeatCost || 0) : 0);
  const estimatedTotal = Math.max(0, baseTotal - discountAmount);
  const priceTotal = estimatedTotal > 0 ? `$${estimatedTotal.toFixed(2)}` : 'TBD';

  // Store booking in KV
  const bookingId = generateId();
  const token = generateId() + generateId();
  const bookingData = {
    id: bookingId,
    token,
    status: 'pending',
    property,
    propertyId: propertyId || '',
    checkIn,
    checkOut,
    guests,
    name,
    email,
    phone,
    specialRequests: specialRequests || '',
    pricing: pricing || null,
    discountCode: discountCode?.trim().toUpperCase() || null,
    discountAmount,
    discountLabel,
    poolHeat: poolHeat || false,
    poolHeatNights: poolHeat ? (poolHeatNights || 0) : 0,
    poolHeatCost: poolHeat ? (poolHeatCost || 0) : 0,
    estimatedTotal,
    submittedAt: new Date().toISOString(),
  };

  if (env.BOOKINGS) {
    await env.BOOKINGS.put(`booking:${bookingId}`, JSON.stringify(bookingData), {
      expirationTtl: 60 * 60 * 24 * 60, // 60 days
    });
  }

  const adminUrl = `https://indigopalm.co/admin-approve.html?id=${bookingId}&token=${token}`;

  // Host email
  const hostEmailHtml = emailWrapper(`
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">New Booking Request</p>
    <h1 style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">${property}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Check-in', fmtDate(checkIn))}
      ${detailRow('Check-out', fmtDate(checkOut))}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      ${poolHeat ? detailRow('Pool Heat', `${poolHeatNights} night${poolHeatNights !== 1 ? 's' : ''} &mdash; $${(poolHeatCost || 0).toFixed(2)}`) : ''}
      ${discountLabel ? detailRow('Discount', `<span style="color:#607c67;">-${discountLabel}</span>`) : ''}
      ${detailRow('Est. Total', priceTotal)}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="padding:20px;background:#F5F3EE;border-radius:8px;text-align:center;">
        <a href="${adminUrl}" style="display:inline-block;padding:14px 32px;background:#607c67;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;letter-spacing:0.02em;">Review &amp; Approve &rarr;</a>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;">Guest Details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('Name', name)}
      ${detailRow('Email', `<a href="mailto:${email}" style="color:#B67550;">${email}</a>`)}
      ${detailRow('Phone', phone)}
      ${specialRequests ? detailRow('Notes', specialRequests) : ''}
    </table>
  `);

  // Guest email (no payment link — sent after approval)
  const guestEmailHtml = emailWrapper(`
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">Booking Request</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">The desert's holding your spot.</h1>
    <p style="margin:0 0 14px;font-size:15px;color:#555;line-height:1.7;">Hi ${name.split(' ')[0]}, we got your request for <strong>${property}</strong>, ${fmtDate(checkIn)} to ${fmtDate(checkOut)}. We'll follow up within 24 hours with a payment link to make it official.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">The hot tub is ready. The stars are already out there doing their thing. We'll be in touch soon.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Property', property)}
      ${detailRow('Check-in', fmtDate(checkIn))}
      ${detailRow('Check-out', fmtDate(checkOut))}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      ${poolHeat ? detailRow('Pool Heat', `$${(poolHeatCost || 0).toFixed(2)}`) : ''}
      ${detailRow('Est. Total', priceTotal)}
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#888;">Questions? Reply here or email us at <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);

  try {
    await Promise.all([
      sendEmail(env.RESEND_API_KEY, {
        from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
        to:   'indigopalmco@gmail.com',
        subject: `New Booking Request: ${property} (${fmtDate(checkIn)} – ${fmtDate(checkOut)})`,
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

// ── Get Booking (for admin page) ──────────────────────────────────────────────

async function handleGetBooking(url, env) {
  const id    = url.searchParams.get('id');
  const token = url.searchParams.get('token');

  if (!id || !token) {
    return new Response(JSON.stringify({ success: false, error: 'Missing id or token' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  if (!env.BOOKINGS) {
    return new Response(JSON.stringify({ success: false, error: 'Storage unavailable' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }

  const raw = await env.BOOKINGS.get(`booking:${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ success: false, error: 'Booking not found' }), {
      status: 404, headers: CORS_HEADERS,
    });
  }

  const booking = JSON.parse(raw);
  if (booking.token !== token) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
      status: 403, headers: CORS_HEADERS,
    });
  }

  // Return booking without the token
  const { token: _t, ...safeBooking } = booking;
  return new Response(JSON.stringify({ success: true, booking: safeBooking }), {
    status: 200, headers: CORS_HEADERS,
  });
}

// ── Approve Booking ───────────────────────────────────────────────────────────

async function handleApprove(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const { id, token, overrideTotal, flatDiscount, notesToGuest } = body;

  if (!id || !token) {
    return new Response(JSON.stringify({ success: false, error: 'Missing id or token' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const raw = await env.BOOKINGS.get(`booking:${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ success: false, error: 'Booking not found' }), {
      status: 404, headers: CORS_HEADERS,
    });
  }

  const booking = JSON.parse(raw);
  if (booking.token !== token) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
      status: 403, headers: CORS_HEADERS,
    });
  }

  if (booking.status === 'approved') {
    return new Response(JSON.stringify({ success: false, error: 'Already approved' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  // Calculate final total
  const baseTotal = (booking.pricing?.total || 0) + (booking.poolHeatCost || 0);
  let finalTotal;
  if (overrideTotal != null && overrideTotal > 0) {
    finalTotal = parseFloat(overrideTotal);
  } else {
    const discount = (parseFloat(flatDiscount) || 0) + (booking.discountAmount || 0);
    finalTotal = Math.max(0, baseTotal - discount);
  }

  // Consume discount code now
  if (booking.discountCode && env.DISCOUNT_CODES) {
    const raw = await env.DISCOUNT_CODES.get(booking.discountCode);
    if (raw) {
      const codeData = JSON.parse(raw);
      if (!codeData.used) {
        await env.DISCOUNT_CODES.put(booking.discountCode, JSON.stringify({
          ...codeData, used: true, usedBy: booking.email, usedAt: new Date().toISOString(),
        }));
      }
    }
  }

  // Build pricing object for Square
  const approvedPricing = booking.pricing
    ? { ...booking.pricing, total: finalTotal }
    : { total: finalTotal, nights: 0, subtotal: finalTotal, cleaningFee: 0, taxRate: 0, taxAmount: 0 };

  // Generate Square payment link (includes 3% CC fee as line item)
  const ccFee = Math.round(finalTotal * 0.03 * 100) / 100;
  const ccTotal = finalTotal + ccFee;

  let paymentLink = null;
  if (env.SQUARE_ACCESS_TOKEN) {
    try {
      paymentLink = await createSquarePaymentLink(env.SQUARE_ACCESS_TOKEN, {
        property: booking.property,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        pricing: approvedPricing,
        poolHeat: booking.poolHeat,
        poolHeatCost: booking.poolHeatCost || 0,
        discountAmount: (parseFloat(flatDiscount) || 0) + (booking.discountAmount || 0),
        discountCode: booking.discountCode,
        ccFee,
        fmtDate,
      });
    } catch (e) {
      console.error('Square payment link failed:', e);
    }
  }

  const zelleTotal = `$${finalTotal.toFixed(2)}`;
  const cardTotal  = `$${ccTotal.toFixed(2)}`;

  // Send payment email to guest
  const guestPaymentHtml = emailWrapper(`
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">Payment Request</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">Your dates are approved.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">Hi ${booking.name.split(' ')[0]}, we've approved your request for <strong>${booking.property}</strong>. Complete your payment to lock in your dates.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Property', booking.property)}
      ${detailRow('Check-in', fmtDate(booking.checkIn))}
      ${detailRow('Check-out', fmtDate(booking.checkOut))}
      ${detailRow('Guests', `${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`)}
      ${booking.poolHeat ? detailRow('Pool Heat', `$${(booking.poolHeatCost || 0).toFixed(2)}`) : ''}
      ${detailRow('Total', `<strong>${zelleTotal}</strong>`)}
    </table>
    <div style="padding:20px;background:#F5F3EE;border-radius:8px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Zelle (no fee) — ${zelleTotal}</p>
      <p style="margin:0;font-size:14px;color:#555;">Send to <strong>214-606-1340</strong> (MPT Industries) and reply to this email to confirm.</p>
    </div>
    ${paymentLink ? `
    <div style="padding:20px;background:#F5F3EE;border-radius:8px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#2C2C2C;">Credit Card via Square — ${cardTotal} (includes 3% fee)</p>
      <a href="${paymentLink}" style="display:inline-block;padding:14px 32px;background:#607c67;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;letter-spacing:0.02em;">Pay by Card &rarr;</a>
    </div>` : ''}
    ${notesToGuest ? `<div style="padding:16px 20px;background:#fff8f0;border-left:3px solid #B67550;border-radius:4px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${notesToGuest}</p></div>` : ''}
    <p style="margin:0;font-size:14px;color:#888;">Questions? Reply here or email <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to:   booking.email,
      subject: `Your dates are approved — payment link inside`,
      html:  guestPaymentHtml,
    });

    // Mark as approved
    await env.BOOKINGS.put(`booking:${id}`, JSON.stringify({
      ...booking, status: 'approved', finalTotal, approvedAt: new Date().toISOString(), paymentLink,
    }));

    return new Response(JSON.stringify({ success: true, paymentLink, finalTotal }), {
      status: 200, headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error('Approve email failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send payment email' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
}

// ── Booking Confirmed ─────────────────────────────────────────────────────────

async function handleConfirm(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const { propertyId, name, email, checkIn, checkOut, guests, totalPaid, notes } = body;

  if (!propertyId || !name || !email || !checkIn || !checkOut) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const info = PROPERTY_INFO[propertyId];
  if (!info) {
    return new Response(JSON.stringify({ success: false, error: 'Unknown property' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00') - new Date(checkIn + 'T00:00:00')) / (1000 * 60 * 60 * 24)
  );

  const html = buildConfirmationEmail({ info, name, checkIn, checkOut, nights, guests, totalPaid, notes });

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to: email,
      subject: `You're booked — ${info.name}`,
      html,
    });

    // Also notify host
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to: 'indigopalmco@gmail.com',
      subject: `Booking confirmed: ${info.name} (${fmtDate(checkIn)} – ${fmtDate(checkOut)})`,
      html: emailWrapper(`
        <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;margin:0 0 20px;">Confirmation sent to ${name}</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Property', info.name)}
          ${detailRow('Guest', name)}
          ${detailRow('Email', email)}
          ${detailRow('Check-in', fmtDate(checkIn))}
          ${detailRow('Check-out', fmtDate(checkOut))}
          ${detailRow('Nights', String(nights))}
          ${detailRow('Guests', String(guests))}
          ${totalPaid ? detailRow('Total Paid', `$${parseFloat(totalPaid).toFixed(2)}`) : ''}
          ${notes ? detailRow('Notes', notes) : ''}
        </table>
      `),
    });

    // Block calendar on Hostaway (Cozy Cactus + Casa Moto only)
    let hostawayReservationId = null;
    try {
      hostawayReservationId = await createHostawayReservation(env, { propertyId, name, email, checkIn, checkOut, guests });
    } catch (err) {
      console.error('Hostaway block failed (non-fatal):', err);
    }

    return new Response(JSON.stringify({ success: true, hostawayReservationId }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Confirm email failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send email' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
}

// ── Hostaway ───────────────────────────────────────────────────────────────────

async function getHostawayToken(env) {
  const cached = await env.BOOKINGS.get('__hostaway_token__', { type: 'json' });
  if (cached && cached.expires > Date.now()) return cached.token;

  const res = await fetch('https://api.hostaway.com/v1/accessTokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.HOSTAWAY_ACCOUNT_ID,
      client_secret: env.HOSTAWAY_SECRET_KEY,
      scope: 'general',
    }),
  });
  if (!res.ok) throw new Error(`Hostaway auth failed: ${res.status}`);
  const data = await res.json();
  const token = data.access_token;
  // Cache for 23 months (tokens valid 24 months)
  await env.BOOKINGS.put('__hostaway_token__', JSON.stringify({
    token,
    expires: Date.now() + (23 * 30 * 24 * 60 * 60 * 1000),
  }));
  return token;
}

async function createHostawayReservation(env, { propertyId, name, email, checkIn, checkOut, guests }) {
  const listingMapId = HOSTAWAY_LISTING_IDS[propertyId];
  if (!listingMapId) return null; // Not on Hostaway (ps-retreat, the-well)

  const token = await getHostawayToken(env);
  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ') || 'Guest';

  const res = await fetch('https://api.hostaway.com/v1/reservations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelId: 2000,
      listingMapId,
      arrivalDate: checkIn,
      departureDate: checkOut,
      numberOfGuests: guests,
      guestFirstName: firstName,
      guestLastName: lastName,
      guestEmail: email,
      status: 'accepted',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hostaway reservation failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.result?.id ?? null;
}

function buildConfirmationEmail({ info, name, checkIn, checkOut, nights, guests, totalPaid, notes }) {
  const firstName = name.split(' ')[0];

  const linksSection = [
    info.welcomeGuide
      ? `<a href="${info.welcomeGuide}" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Welcome Guide &rarr;</a><p style="margin:0 0 16px;font-size:13px;color:#888;">Check-in, parking, house rules, community amenities — it's all in here.</p>`
      : '',
    `<a href="https://indigopalm.co" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">indigopalm.co &rarr;</a><p style="margin:0 0 16px;font-size:13px;color:#888;">Explore the other properties and the blog.</p>`,
    info.airbnb
      ? `<a href="${info.airbnb}" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Airbnb Listing &rarr;</a><p style="margin:0;font-size:13px;color:#888;">More photos, reviews, and details.</p>`
      : '',
  ].filter(Boolean).join('');

  return emailWrapper(`
    ${info.photo ? `<a href="${info.mapsUrl}" target="_blank"><img src="${info.photo}" alt="${info.name}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" /></a>` : ''}

    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${info.name} &middot; ${fmtDate(checkIn)} &ndash; ${fmtDate(checkOut)}</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">The desert is yours, ${firstName}.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">Payment received. Your ${nights} night${nights !== 1 ? 's' : ''} at <strong>${info.name}</strong> are locked in. See you out there.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Address', `<a href="${info.mapsUrl}" style="color:#607c67;text-decoration:none;">${info.address} &rarr;</a>`)}
      ${detailRow('Check-in', fmtDate(checkIn))}
      ${detailRow('Check-out', fmtDate(checkOut))}
      ${detailRow('Nights', `${nights} night${nights !== 1 ? 's' : ''}`)}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      ${detailRow('Total Paid', totalPaid ? `$${parseFloat(totalPaid).toFixed(2)}` : '—')}
    </table>

    <div style="padding:24px;background:#F5F3EE;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.08em;">Before you arrive</p>
      ${linksSection}
    </div>

    ${notes ? `<div style="padding:16px 20px;background:#fff8f0;border-left:3px solid #B67550;border-radius:4px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${notes}</p></div>` : ''}

    <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.7;">Check-in details are coming closer to the date. We'll make sure you're taken care of.</p>
    <p style="margin:0;font-size:14px;color:#888;">Questions? Reply here or reach us at <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);
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

async function createSquarePaymentLink(accessToken, { property, checkIn, checkOut, pricing, poolHeat, poolHeatCost, discountAmount, discountCode, ccFee, fmtDate }) {
  // Fetch first location
  const locRes = await fetch('https://connect.squareup.com/v2/locations', {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Square-Version': '2024-01-18' },
  });
  if (!locRes.ok) throw new Error(`Square locations fetch failed: ${locRes.status}`);
  const locData = await locRes.json();
  const locationId = locData.locations?.[0]?.id;
  if (!locationId) throw new Error('No Square location found');

  const nights = pricing.nights;
  const money = (dollars) => ({ amount: Math.round(dollars * 100), currency: 'USD' });

  const lineItems = [
    {
      name: `${property} — ${nights} night${nights !== 1 ? 's' : ''}`,
      quantity: '1',
      base_price_money: money(pricing.subtotal),
      note: `${fmtDate(checkIn)} to ${fmtDate(checkOut)}`,
    },
    {
      name: 'Cleaning fee',
      quantity: '1',
      base_price_money: money(pricing.cleaningFee),
    },
    {
      name: `Taxes (${(pricing.taxRate * 100).toFixed(1)}%)`,
      quantity: '1',
      base_price_money: money(pricing.taxAmount),
    },
  ];

  if (poolHeat && poolHeatCost > 0) {
    lineItems.push({
      name: 'Pool heating',
      quantity: '1',
      base_price_money: money(poolHeatCost),
    });
  }

  if (ccFee > 0) {
    lineItems.push({
      name: 'Credit card processing fee (3%)',
      quantity: '1',
      base_price_money: money(ccFee),
    });
  }

  const orderBody = { location_id: locationId, line_items: lineItems };

  if (discountAmount > 0 && discountCode) {
    orderBody.discounts = [{
      name: `Promo: ${discountCode}`,
      amount_money: money(discountAmount),
      scope: 'ORDER',
    }];
  }

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
      order: orderBody,
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
