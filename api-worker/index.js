// Cloudflare Worker: Indigo Palm API
// Handles /api/availability, /api/pricing, /api/booking
// Routes: indigopalm.co/api/*, indigopalm.co/*.html
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
  'terra-luz':   'https://www.airbnb.com/calendar/ical/716871660845992276.ics?t=74de1981b38c40fbb8800fb4550371d6',
  'casa-moto':   'https://www.airbnb.com/calendar/ical/716871660845992276.ics?t=74de1981b38c40fbb8800fb4550371d6',
  'ps-retreat':  'https://www.airbnb.com/calendar/ical/1171049679026732503.ics?t=2e21a1a79aee49afaf440d1093afc318',
  'the-well':    'https://www.airbnb.com/calendar/ical/868862893900280104.ics?t=d0aa2a8c829445d695c19e79c80aa1f1',
};

const PRICELABS_LISTINGS = {
  'cozy-cactus': { id: '123646',             pms: 'hostaway' },
  'terra-luz':   { id: '123633',             pms: 'hostaway' },
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
  'terra-luz':   123633,
  'casa-moto':   123633,
};

const PROPERTY_URL_SLUGS = {
  'cozy-cactus': 'cozy-cactus',
  'casa-moto':   'terra-luz',
  'ps-retreat':  'ps-retreat',
  'the-well':    'the-well',
};

const PROPERTY_CONFIG = {
  'cozy-cactus': { basePrice: 250, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  'terra-luz':   { basePrice: 275, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
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

// Pages that should 301 redirect from .html to clean URL
// casa-moto.html → /terra-luz (rebrand)
const HTML_REDIRECTS = {
  '/cozy-cactus.html':   '/cozy-cactus',
  '/terra-luz.html':     '/terra-luz',
  '/casa-moto.html':     '/terra-luz',
  '/ps-retreat.html':    '/ps-retreat',
  '/the-well.html':      '/the-well',
  '/festivalguide.html': '/festivalguide',
  '/blog.html':          '/blog',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Force HTTPS
    if (url.protocol === 'http:') {
      return Response.redirect('https://' + url.hostname + url.pathname + url.search, 301);
    }

    // Redirect /index.html to /
    if (path === '/index.html') {
      return Response.redirect('https://' + url.hostname + '/', 301);
    }

    // 301 redirect .html property/content pages to clean URLs
    if (HTML_REDIRECTS[path]) {
      return Response.redirect('https://' + url.hostname + HTML_REDIRECTS[path], 301);
    }

    // 301 redirects for renamed/moved blog posts
    const BLOG_REDIRECTS = {
      '/blog/casa-moto-origin-story':   '/blog/terra-luz-origin-story/',
      '/blog/casa-moto-origin-story/':  '/blog/terra-luz-origin-story/',
      '/blog/cozy-cactus-lessons':      '/blog/cozy-cactus-story/',
      '/blog/cozy-cactus-lessons/':     '/blog/cozy-cactus-story/',
      '/blog/palm-springs-local-guide': '/blog/palm-springs-local-guide-sundune/',
      '/blog/palm-springs-local-guide/':'/blog/palm-springs-local-guide-sundune/',
    };
    if (BLOG_REDIRECTS[path]) {
      return Response.redirect('https://' + url.hostname + BLOG_REDIRECTS[path], 301);
    }

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

    // iCal feed for direct bookings — subscribe in Airbnb/Hospitable
    // e.g. GET /api/calendar/ps-retreat.ics
    const icalMatch = path.match(/^\/api\/calendar\/([\w-]+)\.ics$/);
    if (icalMatch && request.method === 'GET') {
      return handleIcalFeed(icalMatch[1], env);
    }

    if (path === '/api/lease' && request.method === 'POST') {
      return handleCreateLease(request, env);
    }

    if (path === '/api/lease' && request.method === 'GET') {
      return handleGetLease(url, env);
    }

    if (path === '/api/lease/sign' && request.method === 'POST') {
      return handleSignLease(request, env);
    }

    // GitHub OAuth proxy for Decap/Sveltia CMS
    if (path === '/api/auth' && request.method === 'GET') {
      return handleCmsAuth(url, env);
    }

    if (path === '/api/callback' && request.method === 'GET') {
      return handleCmsCallback(url, env);
    }

    if (path === '/api/webhook/square' && request.method === 'POST') {
      return handleSquareWebhook(request, env);
    }

    // Pass all non-API requests through to GitHub Pages
    return fetch(request);
  },
};

// ── CMS OAuth Proxy ───────────────────────────────────────────────────────────

function handleCmsAuth(url, env) {
  const clientId = env.GITHUB_CLIENT_ID || 'Ov23lii0Ltw19uHY42md';
  const redirectUri = 'https://indigopalm.co/api/callback';
  const state = crypto.randomUUID();
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo&state=${state}`;
  return Response.redirect(authUrl, 302);
}

async function handleCmsCallback(url, env) {
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  if (errorParam || !code) {
    return cmsPostMessage('error', { message: errorParam || 'No code returned from GitHub' });
  }

  const clientId = env.GITHUB_CLIENT_ID || 'Ov23lii0Ltw19uHY42md';
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    return cmsPostMessage('error', { message: tokenData.error_description || 'Token exchange failed' });
  }

  return cmsPostMessage('success', { token: tokenData.access_token, provider: 'github' });
}

function cmsPostMessage(status, data) {
  const msg = `authorization:github:${status}:${JSON.stringify(data)}`;
  const html = `<!DOCTYPE html><html><body><script>
    (function() {
      function send() {
        window.opener.postMessage(${JSON.stringify(msg)}, 'https://indigopalm.co');
        window.close();
      }
      if (window.opener) { send(); } else { document.body.innerText = 'Auth complete. You may close this window.'; }
    })();
  </scr` + `ipt></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

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
      ${poolHeat ? detailRow('Pool Heat', `${poolHeatNights} night${poolHeatNights !== 1 ? 's' : ''}: $${(poolHeatCost || 0).toFixed(2)}`) : ''}
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

  // Guest email (no payment link, sent after approval)
  const guestHeroUrl = await getPropertyHeroImageUrl(propertyId, env);
  const guestEmailHtml = emailWrapper(`
    ${guestHeroUrl ? `<img src="${guestHeroUrl}" alt="${property}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" />` : ''}
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
        subject: `Booking Request Received: ${property}`,
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
      const squareBaseUrl = env.SQUARE_SANDBOX === 'true'
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com';
      paymentLink = await createSquarePaymentLink(env.SQUARE_ACCESS_TOKEN, {
        bookingId: id,
        property: booking.property,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        pricing: approvedPricing,
        poolHeat: booking.poolHeat,
        poolHeatNights: booking.poolHeatNights || 0,
        poolHeatCost: booking.poolHeatCost || 0,
        discountAmount: (parseFloat(flatDiscount) || 0) + (booking.discountAmount || 0),
        discountCode: booking.discountCode,
        ccFee,
        fmtDate,
        squareBaseUrl,
      });
    } catch (e) {
      console.error('Square payment link failed:', e);
    }
  }

  const zelleTotal = `$${finalTotal.toFixed(2)}`;
  const cardTotal  = `$${ccTotal.toFixed(2)}`;

  // Send payment email to guest
  const approveHeroUrl = await getPropertyHeroImageUrl(booking.propertyId, env);
  const guestPaymentHtml = emailWrapper(`
    ${approveHeroUrl ? `<img src="${approveHeroUrl}" alt="${booking.property}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" />` : ''}
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
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Zelle (no fee): ${zelleTotal}</p>
      <p style="margin:0;font-size:14px;color:#555;">Send to <strong>214-606-1340</strong> (MPT Industries) and reply to this email to confirm.</p>
    </div>
    ${paymentLink ? `
    <div style="padding:20px;background:#F5F3EE;border-radius:8px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#2C2C2C;">Credit Card via Square: ${cardTotal} (includes 3% fee)</p>
      <a href="${paymentLink}" style="display:inline-block;padding:14px 32px;background:#607c67;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;letter-spacing:0.02em;">Pay by Card &rarr;</a>
    </div>` : ''}
    ${notesToGuest ? `<div style="padding:16px 20px;background:#fff8f0;border-left:3px solid #B67550;border-radius:4px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${notesToGuest}</p></div>` : ''}
    <p style="margin:0;font-size:14px;color:#888;">Questions? Reply here or email <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to:   booking.email,
      subject: `Your dates are approved: payment link inside`,
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

  const confirmHeroUrl = await getPropertyHeroImageUrl(propertyId, env);
  const html = buildConfirmationEmail({ info, name, checkIn, checkOut, nights, guests, totalPaid, notes, heroUrl: confirmHeroUrl });

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to: email,
      subject: `You're booked at ${info.name}`,
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

    // Block calendar via iCal feed (PS Retreat + The Well)
    const ICAL_PROPERTIES = ['ps-retreat', 'the-well'];
    if (ICAL_PROPERTIES.includes(propertyId)) {
      try {
        await addIcalBooking(env, {
          propertyId,
          uid: generateId(),
          checkIn,
          checkOut,
          guestName: name,
        });
      } catch (err) {
        console.error('iCal booking store failed (non-fatal):', err);
      }
    }

    return new Response(JSON.stringify({ success: true, hostawayReservationId }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Confirm email failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send email' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
}

// ── Square Webhook ────────────────────────────────────────────────────────────

async function handleSquareWebhook(request, env) {
  const body = await request.text();

  // Verify Square HMAC signature
  const sigHeader = request.headers.get('x-square-hmacsha256-signature');
  if (env.SQUARE_WEBHOOK_SIGNATURE_KEY && sigHeader) {
    const url = 'https://indigopalm.co/api/webhook/square';
    const encoder = new TextEncoder();
    const keyData = encoder.encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY);
    const msgData = encoder.encode(url + body);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    if (sigHeader !== expected) {
      console.error('Square webhook signature mismatch');
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let event;
  try { event = JSON.parse(body); } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Only act on completed payments
  const eventType = event.type;
  const paymentStatus = event.data?.object?.payment?.status;
  if (eventType !== 'payment.updated' || paymentStatus !== 'COMPLETED') {
    return new Response('OK', { status: 200 });
  }

  const orderId = event.data?.object?.payment?.order_id;
  if (!orderId) return new Response('OK', { status: 200 });

  // Fetch the Square order to get our reference_id (= bookingId)
  const squareBaseUrl = env.SQUARE_SANDBOX === 'true'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  const orderRes = await fetch(`${squareBaseUrl}/v2/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`, 'Square-Version': '2024-01-18' },
  });
  if (!orderRes.ok) {
    console.error('Failed to fetch Square order:', orderId);
    return new Response('OK', { status: 200 });
  }
  const orderData = await orderRes.json();
  const bookingId = orderData.order?.reference_id;
  const totalPaid = (orderData.order?.total_money?.amount || 0) / 100;

  if (!bookingId) {
    console.error('No reference_id on Square order:', orderId);
    return new Response('OK', { status: 200 });
  }

  // Look up booking in KV
  const raw = await env.BOOKINGS.get(`booking:${bookingId}`);
  if (!raw) {
    console.error('Booking not found for id:', bookingId);
    return new Response('OK', { status: 200 });
  }
  const booking = JSON.parse(raw);

  // Avoid double-processing
  if (booking.status === 'confirmed') {
    return new Response('OK', { status: 200 });
  }

  const { propertyId, name, email, checkIn, checkOut, guests } = booking;
  const info = PROPERTY_INFO[propertyId];
  if (!info) return new Response('OK', { status: 200 });

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00') - new Date(checkIn + 'T00:00:00')) / (1000 * 60 * 60 * 24)
  );

  // Send confirmation email to guest
  const heroUrl = await getPropertyHeroImageUrl(propertyId, env);
  const html = buildConfirmationEmail({ info, name, checkIn, checkOut, nights, guests, totalPaid, notes: null, heroUrl });

  await sendEmail(env.RESEND_API_KEY, {
    from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
    to: email,
    subject: `You're booked at ${info.name}`,
    html,
  });

  // Notify host
  await sendEmail(env.RESEND_API_KEY, {
    from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
    to: 'indigopalmco@gmail.com',
    subject: `Payment received + booking confirmed: ${info.name} (${fmtDate(checkIn)} – ${fmtDate(checkOut)})`,
    html: emailWrapper(`
      <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;margin:0 0 20px;">Payment received via Square</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow('Property', info.name)}
        ${detailRow('Guest', name)}
        ${detailRow('Email', email)}
        ${detailRow('Check-in', fmtDate(checkIn))}
        ${detailRow('Check-out', fmtDate(checkOut))}
        ${detailRow('Nights', String(nights))}
        ${detailRow('Guests', String(guests))}
        ${detailRow('Total Paid', `$${totalPaid.toFixed(2)}`)}
        ${detailRow('Square Order', orderId)}
      </table>
    `),
  });

  // Create Hostaway reservation
  let hostawayReservationId = null;
  try {
    hostawayReservationId = await createHostawayReservation(env, { propertyId, name, email, checkIn, checkOut, guests });
  } catch (err) {
    console.error('Hostaway reservation failed (non-fatal):', err);
  }

  // Block iCal calendar (ps-retreat, the-well)
  if (['ps-retreat', 'the-well'].includes(propertyId)) {
    try {
      await addIcalBooking(env, { propertyId, uid: generateId(), checkIn, checkOut, guestName: name });
    } catch (err) {
      console.error('iCal booking failed (non-fatal):', err);
    }
  }

  // Mark booking as confirmed in KV
  await env.BOOKINGS.put(`booking:${bookingId}`, JSON.stringify({
    ...booking,
    status: 'confirmed',
    totalPaid,
    squareOrderId: orderId,
    hostawayReservationId,
    confirmedAt: new Date().toISOString(),
  }));

  console.log(`Booking confirmed: ${bookingId}, Hostaway: ${hostawayReservationId}`);
  return new Response('OK', { status: 200 });
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

function buildConfirmationEmail({ info, name, checkIn, checkOut, nights, guests, totalPaid, notes, heroUrl }) {
  const firstName = name.split(' ')[0];

  const linksSection = [
    info.welcomeGuide
      ? `<a href="${info.welcomeGuide}" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Welcome Guide &rarr;</a><p style="margin:0 0 16px;font-size:13px;color:#888;">Check-in, parking, house rules, community amenities. It's all in here.</p>`
      : '',
    `<a href="https://indigopalm.co" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">indigopalm.co &rarr;</a><p style="margin:0 0 16px;font-size:13px;color:#888;">Explore the other properties and the blog.</p>`,
    info.airbnb
      ? `<a href="${info.airbnb}" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Airbnb Listing &rarr;</a><p style="margin:0;font-size:13px;color:#888;">More photos, reviews, and details.</p>`
      : '',
  ].filter(Boolean).join('');

  return emailWrapper(`
    ${(heroUrl || info.photo) ? `<a href="${info.mapsUrl}" target="_blank"><img src="${heroUrl || info.photo}" alt="${info.name}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" /></a>` : ''}

    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${info.name} &middot; ${fmtDate(checkIn)} &ndash; ${fmtDate(checkOut)}</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">The desert is yours, ${firstName}.</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">Payment received. Your ${nights} night${nights !== 1 ? 's' : ''} at <strong>${info.name}</strong> are locked in. See you out there.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${detailRow('Address', `<a href="${info.mapsUrl}" style="color:#607c67;text-decoration:none;">${info.address} &rarr;</a>`)}
      ${detailRow('Check-in', fmtDate(checkIn))}
      ${detailRow('Check-out', fmtDate(checkOut))}
      ${detailRow('Nights', `${nights} night${nights !== 1 ? 's' : ''}`)}
      ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      ${detailRow('Total Paid', totalPaid ? `$${parseFloat(totalPaid).toFixed(2)}` : 'N/A')}
    </table>

    <div style="padding:24px;background:#F5F3EE;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.08em;">Before you arrive</p>
      ${linksSection}
    </div>

    ${notes ? `<div style="padding:16px 20px;background:#fff8f0;border-left:3px solid #B67550;border-radius:4px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${notes}</p></div>` : ''}

    <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.7;">Check-in details are coming closer to the date. We'll make sure you're taken care of.</p>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">See you in the desert.</p>
    <p style="margin:0;font-size:14px;color:#888;">Questions? Reply here or reach us at <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);
}

// ── Lease Agreements ──────────────────────────────────────────────────────────

async function handleCreateLease(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }

  const { propertyId, name, email, phone, guests, checkIn, checkOut, total, deposit, cancellation } = body;
  if (!propertyId || !name || !email || !checkIn || !checkOut || !total) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers: CORS_HEADERS });
  }

  const info = PROPERTY_INFO[propertyId];
  if (!info) {
    return new Response(JSON.stringify({ success: false, error: 'Unknown property' }), { status: 400, headers: CORS_HEADERS });
  }

  const id = generateId();
  const lease = {
    id, propertyId, name, email,
    phone: phone || '',
    guests: guests || 1,
    checkIn, checkOut,
    total: parseFloat(total),
    deposit: parseFloat(deposit) || 200,
    cancellation: cancellation || '14 day cancellation for full refund. No refund after.',
    address: info.address,
    signed: false,
    signatureName: null,
    signedAt: null,
    createdAt: new Date().toISOString(),
  };

  await env.BOOKINGS.put(`lease:${id}`, JSON.stringify(lease));

  const leaseUrl = `https://indigopalm.co/lease.html?id=${id}`;
  const nights = Math.round((new Date(checkOut + 'T00:00:00') - new Date(checkIn + 'T00:00:00')) / (1000 * 60 * 60 * 24));
  const firstName = name.split(' ')[0];
  const grandTotal = (lease.total + lease.deposit).toFixed(2);

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to: email,
      subject: `Rental Agreement: ${info.name}`,
      html: emailWrapper(`
        <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${info.name} &middot; ${fmtDate(checkIn)} &ndash; ${fmtDate(checkOut)}</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#2C2C2C;">One thing before you're in.</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">Hi ${firstName}, your ${nights} night${nights !== 1 ? 's' : ''} at <strong>${info.name}</strong> look great. Before we lock it in, please review and sign the rental agreement.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          ${detailRow('Address', info.address)}
          ${detailRow('Check-in', fmtDate(checkIn))}
          ${detailRow('Check-out', fmtDate(checkOut))}
          ${detailRow('Booking Total', `$${lease.total.toFixed(2)}`)}
          ${detailRow('Security Deposit', `$${lease.deposit.toFixed(2)}`)}
          ${detailRow('Total Due', `$${grandTotal}`)}
        </table>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${leaseUrl}" style="display:inline-block;padding:14px 32px;background:#607c67;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Review and Sign Agreement &rarr;</a>
        </div>
        <p style="margin:0;font-size:13px;color:#aaa;text-align:center;">Questions? Reply here or email <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
      `),
    });

    return new Response(JSON.stringify({ success: true, leaseUrl }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Lease email failed:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send email' }), { status: 500, headers: CORS_HEADERS });
  }
}

async function handleGetLease(url, env) {
  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ success: false, error: 'Missing id' }), { status: 400, headers: CORS_HEADERS });

  const raw = await env.BOOKINGS.get(`lease:${id}`);
  if (!raw) return new Response(JSON.stringify({ success: false, error: 'Agreement not found' }), { status: 404, headers: CORS_HEADERS });

  return new Response(JSON.stringify({ success: true, lease: JSON.parse(raw) }), { status: 200, headers: CORS_HEADERS });
}

async function handleSignLease(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }

  const { id, signature } = body;
  if (!id || !signature) return new Response(JSON.stringify({ success: false, error: 'Missing id or signature' }), { status: 400, headers: CORS_HEADERS });

  const raw = await env.BOOKINGS.get(`lease:${id}`);
  if (!raw) return new Response(JSON.stringify({ success: false, error: 'Agreement not found' }), { status: 404, headers: CORS_HEADERS });

  const lease = JSON.parse(raw);
  if (lease.signed) return new Response(JSON.stringify({ success: false, error: 'Already signed' }), { status: 400, headers: CORS_HEADERS });

  lease.signed = true;
  lease.signatureName = signature;
  lease.signedAt = new Date().toISOString();
  await env.BOOKINGS.put(`lease:${id}`, JSON.stringify(lease));

  const info = PROPERTY_INFO[lease.propertyId];
  const nights = Math.round((new Date(lease.checkOut + 'T00:00:00') - new Date(lease.checkIn + 'T00:00:00')) / (1000 * 60 * 60 * 24));
  const signedDate = new Date(lease.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const grandTotal = (lease.total + lease.deposit).toFixed(2);

  const signedHtml = emailWrapper(`
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${info.name} &middot; ${fmtDate(lease.checkIn)} &ndash; ${fmtDate(lease.checkOut)}</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#2C2C2C;">Agreement signed.</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">Signed by <strong>${signature}</strong> on ${signedDate}. Here's a copy for your records.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Property', info.name)}
      ${detailRow('Address', info.address)}
      ${detailRow('Check-in', fmtDate(lease.checkIn))}
      ${detailRow('Check-out', fmtDate(lease.checkOut))}
      ${detailRow('Nights', `${nights} night${nights !== 1 ? 's' : ''}`)}
      ${detailRow('Booking Total', `$${lease.total.toFixed(2)}`)}
      ${detailRow('Security Deposit', `$${lease.deposit.toFixed(2)}`)}
      ${detailRow('Total Due', `$${grandTotal}`)}
      ${detailRow('Cancellation', lease.cancellation)}
    </table>
    <div style="padding:20px;background:#F5F3EE;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">What you agreed to</p>
      <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">No parties, no events, no subletting. No unauthorized pets. Outdoor noise curfew at 10pm. No smoking. Pool and amenities at your own risk. Security deposit returnable within 2 days of checkout if no issues. 14-day cancellation for full refund. Governed by California law, Riverside County.</p>
    </div>
    <p style="margin:0;font-size:13px;color:#aaa;">Questions? <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
  `);

  try {
    await Promise.all([
      sendEmail(env.RESEND_API_KEY, {
        from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
        to: lease.email,
        subject: `Your signed rental agreement: ${info.name}`,
        html: signedHtml,
      }),
      sendEmail(env.RESEND_API_KEY, {
        from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
        to: 'indigopalmco@gmail.com',
        subject: `Lease signed: ${lease.name}, ${info.name} (${fmtDate(lease.checkIn)})`,
        html: signedHtml,
      }),
    ]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error('Lease sign email failed:', err);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS_HEADERS }); // signed even if email fails
  }
}

// ── iCal Feed (PS Retreat + The Well direct booking blocks) ───────────────────

// Store a booking in the iCal KV list for a property
async function addIcalBooking(env, { propertyId, uid, checkIn, checkOut, guestName }) {
  const key = `ical:${propertyId}`;
  const existing = await env.BOOKINGS.get(key, { type: 'json' }) || [];
  existing.push({ uid, checkIn, checkOut, guestName, createdAt: new Date().toISOString() });
  await env.BOOKINGS.put(key, JSON.stringify(existing));
}

// Serve an iCal feed for a property from stored bookings
async function handleIcalFeed(propertyId, env) {
  const info = PROPERTY_INFO[propertyId];
  if (!info) {
    return new Response('Unknown property', { status: 404 });
  }

  const bookings = await env.BOOKINGS.get(`ical:${propertyId}`, { type: 'json' }) || [];

  const toIcalDate = (d) => d.replace(/-/g, ''); // YYYYMMDD

  const events = bookings.map(b => [
    'BEGIN:VEVENT',
    `UID:${b.uid}@indigopalm.co`,
    `DTSTART;VALUE=DATE:${toIcalDate(b.checkIn)}`,
    `DTEND;VALUE=DATE:${toIcalDate(b.checkOut)}`,
    `SUMMARY:Direct Booking - ${b.guestName}`,
    `DESCRIPTION:Direct booking via indigopalm.co`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
  ].join('\r\n')).join('\r\n');

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Indigo Palm Collective//Direct Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${info.name} Direct Bookings`,
    `X-WR-CALDESC:Direct bookings for ${info.name}`,
    events,
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(ical, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${propertyId}.ics"`,
      'Cache-Control': 'no-cache',
    },
  });
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

async function createSquarePaymentLink(accessToken, { bookingId, property, checkIn, checkOut, pricing, poolHeat, poolHeatNights, poolHeatCost, discountAmount, discountCode, ccFee, fmtDate, squareBaseUrl = 'https://connect.squareup.com' }) {
  // Fetch first location
  const locRes = await fetch(`${squareBaseUrl}/v2/locations`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Square-Version': '2024-01-18' },
  });
  if (!locRes.ok) throw new Error(`Square locations fetch failed: ${locRes.status}`);
  const locData = await locRes.json();
  const locationId = locData.locations?.[0]?.id;
  if (!locationId) throw new Error('No Square location found');

  const nights = pricing.nights;
  const money = (dollars) => ({ amount: Math.round(dollars * 100), currency: 'USD' });
  const nightlyRate = nights > 0 ? Math.round(pricing.subtotal / nights) : 0;
  const rateLabel = nightlyRate > 0 ? `$${nightlyRate}/night x ${nights}` : `${nights} night${nights !== 1 ? 's' : ''}`;

  const lineItems = [
    {
      name: `${property}: ${rateLabel}`,
      quantity: '1',
      base_price_money: money(pricing.total),
      note: `${fmtDate(checkIn)} to ${fmtDate(checkOut)}`,
    },
  ];

  if (poolHeat && poolHeatCost > 0) {
    const poolHeatLabel = poolHeatNights >= 7
      ? 'Pool heating (7+ nights flat rate)'
      : `Pool heating (${poolHeatNights} x $75)`;
    lineItems.push({
      name: poolHeatLabel,
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

  const orderBody = { location_id: locationId, line_items: lineItems, reference_id: bookingId || undefined };

  if (discountAmount > 0 && discountCode) {
    orderBody.discounts = [{
      name: `Promo: ${discountCode}`,
      amount_money: money(discountAmount),
      scope: 'ORDER',
    }];
  }

  const idempotencyKey = `indigo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const res = await fetch(`${squareBaseUrl}/v2/online-checkout/payment-links`, {
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

async function getPropertyHeroImageUrl(propertyId, env) {
  const cacheKey = `hero-img:${propertyId}`;
  if (env.BOOKINGS) {
    const cached = await env.BOOKINGS.get(cacheKey);
    if (cached) return cached;
  }
  const slug = PROPERTY_URL_SLUGS[propertyId] || propertyId;
  try {
    const res = await fetch(`https://indigopalm.co/${slug}/`);
    const html = await res.text();
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
                  || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (match?.[1]) {
      if (env.BOOKINGS) await env.BOOKINGS.put(cacheKey, match[1], { expirationTtl: 86400 });
      return match[1];
    }
  } catch (e) {
    console.error('Hero image fetch failed:', e);
  }
  return PROPERTY_INFO[propertyId]?.photo || null;
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
