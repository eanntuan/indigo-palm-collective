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
  'X-Robots-Tag': 'noindex, nofollow',
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

function getPropertyByName(name) {
  return Object.values(PROPERTY_INFO).find(p =>
    p.name.toLowerCase() === name.toLowerCase()
  ) || null;
}

function extractStreetName(address) {
  const m = address.match(/\d+\s+(?:[NSEW]\s+)?(\w+)\s+(?:Dr|St|Ave|Blvd|Rd|Way|Ln|Ct|Pl)\b/i);
  return m ? m[1] : null;
}

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

// Property-specific story beats — used in automated emails to paint a picture
// of what's waiting. Confirmed = after payment. Welcome = 2 days before.
const PROPERTY_STORY_BEATS = {
  'cozy-cactus': {
    confirmed: 'Three bedrooms, a fully private backyard, and a hot tub that gets better after 9pm. 146 stays worth of reviews confirm what the first one said: this one is hard to leave.',
    welcome:   'The hot tub is best after 9pm. The patio string lights come on at dusk. The backyard is completely private.',
  },
  'terra-luz': {
    confirmed: 'Saltwater pool, heated year-round. A kitchen built for people who actually cook. The design took two years and a brand strategist who cared about every decision.',
    welcome:   'The saltwater pool is heated and ready. The tortilla press is in the lower cabinet, next to the cast iron. The neighborhood is quiet.',
  },
  'casa-moto': {
    confirmed: 'Saltwater pool, heated year-round. A kitchen built for people who actually cook. The design took two years and a brand strategist who cared about every decision.',
    welcome:   'The saltwater pool is heated and ready. The tortilla press is in the lower cabinet, next to the cast iron. The neighborhood is quiet.',
  },
  'ps-retreat': {
    confirmed: 'Ten minutes to downtown Palm Springs. Coffee, record shops, bookstores, a proper breakfast. The kind of location where you go out for one thing and end up gone for three hours.',
    welcome:   'Downtown Palm Springs is a ten-minute drive. Coffee, breakfast, record shops. The pool is available 7am to 10pm.',
  },
  'the-well': {
    confirmed: 'A quiet Palm Springs corner with a pool and a palm tree. The kind of calm that surprises people who expected to spend the whole trip out.',
    welcome:   'The pool deck catches the best light in the late afternoon. The Saturday farmers market is on Andreas Road, five minutes on foot.',
  },
};

// Property-specific check-in logistics — included in welcome email (2 days before arrival)
const PROPERTY_CHECKIN_INFO = {
  'cozy-cactus': {
    doorCode: '4898',
    garageCode: '1340',
    notes: 'Outdoor curfew is 10pm (per city regulations). We\'d love if you could turn off the patio lights to not disturb the neighbors. Luis, our hot tub tech, comes Tuesday and Friday mornings via the side back gate.',
  },
  'terra-luz': {
    doorCode: '5544 (enter code, wait, then open)',
    garageCode: '1340',
    notes: 'Outdoor curfew is 10pm (per city regulations). We\'d love if you could turn off the patio lights to not disturb the neighbors. Pool is serviced Mondays and Thursdays. Gardeners come Wednesday mornings.',
  },
  'casa-moto': {
    doorCode: '5544 (enter code, wait, then open)',
    garageCode: '1340',
    notes: 'Outdoor curfew is 10pm (per city regulations). Pool is serviced Mondays and Thursdays. Gardeners come Wednesday mornings.',
  },
};

// Short go links for tracking — /go/{slug} → full URL with UTM params
const GO_LINKS = {
  'cc':                  'https://indigopalm.co/cozy-cactus/?utm_source=reddit&utm_medium=social&utm_campaign=community',
  'tl':                  'https://indigopalm.co/terra-luz/?utm_source=reddit&utm_medium=social&utm_campaign=community',
  'sd':                  'https://indigopalm.co/the-sundune/?utm_source=reddit&utm_medium=social&utm_campaign=community',
  'welcome-terra-luz':   'https://indigopalm.co/welcome-guide-terra-luz/',
  'farewell-indio':      'https://indigopalm.co/farewell-guide-indio/?utm_source=checkout-message&utm_medium=hostaway&utm_campaign=farewell',
  'farewell-cozy-cactus': 'https://indigopalm.co/farewell-guide-cozy-cactus/?utm_source=checkout-message&utm_medium=hostaway&utm_campaign=farewell',
  'farewell-terra-luz':  'https://indigopalm.co/farewell-guide-terra-luz/?utm_source=checkout-message&utm_medium=hostaway&utm_campaign=farewell',
};

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

// ── Welcome Email Cron ────────────────────────────────────────────────────────

async function sendDueWelcomeEmails(env) {
  const today = new Date().toISOString().slice(0, 10);
  const { keys } = await env.BOOKINGS.list({ prefix: 'welcome:' });

  for (const key of keys) {
    const raw = await env.BOOKINGS.get(key.name, { type: 'json' });
    if (!raw || raw.sent || raw.sendDate > today) continue;

    const { bookingId, propertyId, name, email, checkIn, checkOut, nights, guests } = raw;
    const info = PROPERTY_INFO[propertyId];
    if (!info?.welcomeGuide) continue;

    const firstName = name.split(' ')[0];
    const html = emailWrapper(`
      ${info.photo ? `<img src="${info.photo}" alt="${info.name}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" />` : ''}
      <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${info.name} &middot; ${fmtDate(checkIn)} &ndash; ${fmtDate(checkOut)}</p>
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">You're almost here, ${firstName}.</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">Check-in is in 2 days. Everything you need is in your welcome guide: parking, entry, house rules, Wi-Fi, and local tips.</p>
      <div style="padding:24px;background:#F5F3EE;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.08em;">Before you arrive</p>
        <a href="${info.welcomeGuide}" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Welcome Guide &rarr;</a>
        <p style="margin:0 0 16px;font-size:13px;color:#888;">Check-in, parking, house rules, community amenities. It's all in here.</p>
        <a href="${info.mapsUrl}" style="display:block;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Get Directions &rarr;</a>
        <p style="margin:0;font-size:13px;color:#888;">${info.address}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${detailRow('Check-in', fmtDate(checkIn))}
        ${detailRow('Check-out', fmtDate(checkOut))}
        ${detailRow('Nights', `${nights} night${nights !== 1 ? 's' : ''}`)}
        ${detailRow('Guests', `${guests} guest${guests !== 1 ? 's' : ''}`)}
      </table>
      ${PROPERTY_CHECKIN_INFO[propertyId] ? `
      <div style="padding:24px;background:#F5F3EE;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.08em;">Getting in</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          ${PROPERTY_CHECKIN_INFO[propertyId].doorCode ? detailRow('Front door', PROPERTY_CHECKIN_INFO[propertyId].doorCode) : ''}
          ${PROPERTY_CHECKIN_INFO[propertyId].garageCode ? detailRow('Garage', PROPERTY_CHECKIN_INFO[propertyId].garageCode) : ''}
        </table>
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2C2C2C;">WiFi</p>
        <p style="margin:0 0 14px;font-size:13px;color:#555;line-height:1.6;">Connect to &ldquo;Indigo Palm Collective&rdquo; and a browser window will pop up asking for your email. Enter it and you&rsquo;re all set. (Indigo Palm is our little collection of four desert homes across the Coachella Valley.)</p>
        ${PROPERTY_CHECKIN_INFO[propertyId].notes ? `<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${PROPERTY_CHECKIN_INFO[propertyId].notes}</p>` : ''}
      </div>
      ` : ''}
      <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.7;">See you in the desert.</p>
      ${PROPERTY_STORY_BEATS[propertyId]?.welcome ? `<p style="margin:0 0 20px;font-size:14px;color:#777;line-height:1.7;">P.S. ${PROPERTY_STORY_BEATS[propertyId].welcome}</p>` : ''}
      <p style="margin:0;font-size:14px;color:#888;">Questions? Reply here or reach us at <a href="mailto:indigopalmco@gmail.com" style="color:#B67550;">indigopalmco@gmail.com</a></p>
    `);

    try {
      await sendEmail(env.RESEND_API_KEY, {
        from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
        to: email,
        cc: 'indigopalmco@gmail.com',
        subject: `Your welcome guide: ${info.name} (check-in ${fmtDate(checkIn)})`,
        html,
      });
      await env.BOOKINGS.put(key.name, JSON.stringify({ ...raw, sent: true, sentAt: new Date().toISOString() }));
      console.log(`Welcome email sent: ${bookingId}`);
    } catch (err) {
      console.error(`Welcome email failed for ${bookingId}:`, err);
    }
  }
}

// ── Pinterest Campaign Monitoring ─────────────────────────────────────────────

const PINTEREST_AD_ACCOUNT_ID = '549770218152';

async function fetchPinterestAnalytics(token, startDate, endDate) {
  // Get all campaigns first
  const campaignsRes = await fetch(
    `https://api.pinterest.com/v5/ad_accounts/${PINTEREST_AD_ACCOUNT_ID}/campaigns?page_size=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!campaignsRes.ok) return null;
  const campaignsData = await campaignsRes.json();
  const campaigns = campaignsData.items || [];
  if (!campaigns.length) return { campaigns: [], analytics: [] };

  const campaignIds = campaigns.map(c => c.id).join(',');
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    campaign_ids: campaignIds,
    columns: 'SPEND_IN_DOLLAR,IMPRESSION_1,OUTBOUND_CLICK_1,TOTAL_CLICKTHROUGH,CPM_IN_DOLLAR,CTR_2,TOTAL_ENGAGEMENT',
    granularity: 'TOTAL',
  });

  const analyticsRes = await fetch(
    `https://api.pinterest.com/v5/ad_accounts/${PINTEREST_AD_ACCOUNT_ID}/campaigns/analytics?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!analyticsRes.ok) return null;
  const analytics = await analyticsRes.json();

  return { campaigns, analytics: analytics || [] };
}

async function sendPinterestDailyReport(env) {
  if (!env.PINTEREST_ACCESS_TOKEN || !env.RESEND_API_KEY) return;

  const token = env.PINTEREST_ACCESS_TOKEN;

  // Yesterday (single day)
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yday = yesterday.toISOString().slice(0, 10);

  // Last 7 days for context
  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const weekStart = weekAgo.toISOString().slice(0, 10);

  const [daily, weekly] = await Promise.all([
    fetchPinterestAnalytics(token, yday, yday),
    fetchPinterestAnalytics(token, weekStart, yday),
  ]);

  // If token isn't approved yet, skip silently
  if (!daily || !weekly) return;

  const fmt = (n, dec = 0) => n == null ? '—' : Number(n).toFixed(dec);
  const fmtMoney = n => n == null ? '—' : `$${Number(n).toFixed(2)}`;
  const fmtPct = n => n == null ? '—' : `${(Number(n) * 100).toFixed(2)}%`;

  // Build campaign rows
  const campaignMap = Object.fromEntries((daily.campaigns || []).map(c => [c.id, c.name]));

  const dailyRows = (daily.analytics || []).map(row => {
    const m = row.metrics || {};
    return `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;">${campaignMap[row.campaign_id] || row.campaign_id}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(m.SPEND_IN_DOLLAR)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmt(m.IMPRESSION_1)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmt(m.OUTBOUND_CLICK_1)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(m.CPM_IN_DOLLAR)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmtPct(m.CTR_2)}</td>
      </tr>`;
  }).join('');

  const weeklyRows = (weekly.analytics || []).map(row => {
    const m = row.metrics || {};
    return `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;">${campaignMap[row.campaign_id] || row.campaign_id}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(m.SPEND_IN_DOLLAR)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmt(m.IMPRESSION_1)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmt(m.OUTBOUND_CLICK_1)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmtMoney(m.CPM_IN_DOLLAR)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#333;border-bottom:1px solid #eee;text-align:right;">${fmtPct(m.CTR_2)}</td>
      </tr>`;
  }).join('');

  const tableHeader = `
    <tr style="background:#F5F3EE;">
      <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;text-align:left;border-bottom:2px solid #ddd;">Campaign</th>
      <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;text-align:right;border-bottom:2px solid #ddd;">Spend</th>
      <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;text-align:right;border-bottom:2px solid #ddd;">Impressions</th>
      <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;text-align:right;border-bottom:2px solid #ddd;">Clicks</th>
      <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;text-align:right;border-bottom:2px solid #ddd;">CPM</th>
      <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;text-align:right;border-bottom:2px solid #ddd;">CTR</th>
    </tr>`;

  await sendEmail(env.RESEND_API_KEY, {
    from: 'Indigo Palm Bot <bookings@indigopalm.co>',
    to:   'indigopalmco@gmail.com',
    subject: `Pinterest daily: ${yday}`,
    html: emailWrapper(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Pinterest Ads</p>
      <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#2C2C2C;">Daily report: ${yday}</h2>

      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Yesterday</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
        ${tableHeader}${dailyRows || '<tr><td colspan="6" style="padding:12px;font-size:13px;color:#888;">No campaign activity yesterday.</td></tr>'}
      </table>

      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Last 7 days (${weekStart} to ${yday})</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
        ${tableHeader}${weeklyRows || '<tr><td colspan="6" style="padding:12px;font-size:13px;color:#888;">No campaign activity this week.</td></tr>'}
      </table>

      <p style="font-size:13px;color:#888;margin:0;">
        <a href="https://ads.pinterest.com/advertiser/${PINTEREST_AD_ACCOUNT_ID}/" style="color:#607c67;">Open Pinterest Ads Manager</a>
      </p>
    `),
  });
}

export default {
  async scheduled(event, env) {
    await sendDueWelcomeEmails(env);
    await processPendingAirbnbReplies(env);
    await sendPinterestDailyReport(env);
  },

  async email(message, env, ctx) {
    ctx.waitUntil(handleAirbnbEmail(message, env));
  },

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

    // 301 redirect blog .html URLs to clean trailing-slash URLs
    if (path.startsWith('/blog/') && path.endsWith('.html')) {
      const clean = path.slice(0, -5) + '/';
      return Response.redirect('https://' + url.hostname + clean, 301);
    }

    // 301 redirect blog category URLs to main blog index
    if (path.startsWith('/blog/category/') || path.startsWith('/blog/tag/')) {
      return Response.redirect('https://' + url.hostname + '/blog/', 301);
    }

    // 301 redirect blog slugs missing trailing slash
    if (path.startsWith('/blog/') && !path.endsWith('/') && !path.includes('.')) {
      return Response.redirect('https://' + url.hostname + path + '/', 301);
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

    // /go/{slug} short links with UTM tracking
    const goMatch = path.match(/^\/go\/([\w-]+)\/?$/);
    if (goMatch && GO_LINKS[goMatch[1]]) {
      return Response.redirect(GO_LINKS[goMatch[1]], 302);
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

    // PWA: inbox dashboard, manifest, service worker, push endpoints
    if (path === '/inbox') return handleInboxPage(env);
    if (path === '/manifest.json') return handleManifest();
    if (path === '/sw.js') return handleServiceWorker();
    if (path === '/api/vapid-public-key') return handleVapidPublicKey(env);
    if (path === '/api/push-subscribe' && request.method === 'POST') return handlePushSubscribe(request, env);
    if (path === '/api/test-push') return handleTestPush(env);
    if (path === '/api/test-guest-message') return handleTestGuestMessage(env);

    // Approval page: GET /api/approve-reply?id=XXX
    if (path === '/api/approve-reply' && request.method === 'GET') {
      return handleApprovalPage(request, env);
    }

    // Approval submit: POST /api/approve-reply
    if (path === '/api/approve-reply' && request.method === 'POST') {
      return handleApprovalSubmit(request, env);
    }

    // Discard reply: GET /api/discard-reply?id=XXX
    if (path === '/api/discard-reply') {
      return handleDiscardReply(request, env);
    }

    if (path === '/api/webhook/hostaway' && request.method === 'POST') {
      return handleHostawayWebhook(request, env);
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
          <td style="background:#F5F3EE;padding:24px 36px;border-radius:12px 12px 0 0;text-align:center;border-bottom:1px solid #e8ddd0;">
            <img src="https://indigopalm.co/images/logo-icon-transparent.png" alt="Indigo Palm Collective" width="60" height="60" style="display:inline-block;width:60px;height:60px;margin-bottom:10px;" /><br>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:400;color:#333333;letter-spacing:0.08em;">Indigo Palm Collective</p>
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
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">We built Indigo Palm to create the kind of desert house people come back to on purpose. Not just a place with a pool, but a place that actually feels like somewhere. That starts the moment you decide to come.</p>
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
        cc:   'indigopalmco@gmail.com',
        subject: `Booking Request Received: ${property}`,
        html:  guestEmailHtml,
      }),
    ]);

    return new Response(JSON.stringify({ success: true, bookingId, token }), {
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
  const approvalBeat = PROPERTY_STORY_BEATS[booking.propertyId]?.confirmed || '';
  const approvalFirstName = booking.name.split(' ')[0];
  const guestPaymentHtml = emailWrapper(`
    ${approveHeroUrl ? `<img src="${approveHeroUrl}" alt="${booking.property}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" />` : ''}
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">Payment Request</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">Your dates are approved, ${approvalFirstName}.</h1>
    <p style="margin:0 0 ${approvalBeat ? '14px' : '28px'};font-size:15px;color:#555;line-height:1.7;">We reviewed your request for <strong>${booking.property}</strong> and we're glad to have you. Complete your payment below to lock it in.</p>
    ${approvalBeat ? `<p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">${approvalBeat}</p>` : ''}
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
  const html = buildConfirmationEmail({ info, propertyId, name, checkIn, checkOut, nights, guests, totalPaid, notes, heroUrl: confirmHeroUrl });

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
      to: email,
      cc: 'indigopalmco@gmail.com',
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
  const html = buildConfirmationEmail({ info, propertyId, name, checkIn, checkOut, nights, guests, totalPaid, notes: null, heroUrl });

  await sendEmail(env.RESEND_API_KEY, {
    from: 'Bookings @ Indigo Palm Co <bookings@indigopalm.co>',
    to: email,
    cc: 'indigopalmco@gmail.com',
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

  // Schedule welcome guide email for 2 days before check-in
  if (info.welcomeGuide) {
    const sendDate = new Date(checkIn + 'T00:00:00Z');
    sendDate.setUTCDate(sendDate.getUTCDate() - 2);
    await env.BOOKINGS.put(`welcome:${bookingId}`, JSON.stringify({
      bookingId, propertyId, name, email, checkIn, checkOut, nights, guests,
      sendDate: sendDate.toISOString().slice(0, 10),
      sent: false,
    }));
  }

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
      client_id: env.HOSTAWAY_CLIENT_ID,
      client_secret: env.HOSTAWAY_CLIENT_SECRET,
      scope: 'general',
    }),
  });
  if (!res.ok) throw new Error(`Hostaway auth failed: ${res.status}`);
  const data = await res.json();
  const token = data.access_token;
  const expiresIn = data.expires_in ? data.expires_in * 1000 - 60000 : 3600000;
  await env.BOOKINGS.put('__hostaway_token__', JSON.stringify({
    token,
    expires: Date.now() + expiresIn,
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

function buildConfirmationEmail({ info, propertyId, name, checkIn, checkOut, nights, guests, totalPaid, notes, heroUrl }) {
  const firstName = name.split(' ')[0];
  const confirmedBeat = PROPERTY_STORY_BEATS[propertyId]?.confirmed || '';

  const linksSection = [
    `<a href="https://indigopalm.co" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">indigopalm.co &rarr;</a><p style="margin:0 0 16px;font-size:13px;color:#888;">Explore the other properties and the blog.</p>`,
    info.airbnb
      ? `<a href="${info.airbnb}" style="display:block;margin-bottom:10px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Airbnb Listing &rarr;</a><p style="margin:0;font-size:13px;color:#888;">More photos, reviews, and details.</p>`
      : '',
  ].filter(Boolean).join('');

  return emailWrapper(`
    ${(heroUrl || info.photo) ? `<a href="${info.mapsUrl}" target="_blank"><img src="${heroUrl || info.photo}" alt="${info.name}" width="560" style="display:block;width:100%;max-width:560px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:28px;" /></a>` : ''}

    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.1em;">${info.name} &middot; ${fmtDate(checkIn)} &ndash; ${fmtDate(checkOut)}</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#2C2C2C;">The desert is yours, ${firstName}.</h1>
    <p style="margin:0 0 14px;font-size:15px;color:#555;line-height:1.7;">Payment received. Your ${nights} night${nights !== 1 ? 's' : ''} at <strong>${info.name}</strong> are locked in.</p>
    ${confirmedBeat ? `<p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">${confirmedBeat}</p>` : `<p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">See you out there.</p>`}

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

    <div style="margin-bottom:24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#2C2C2C;text-transform:uppercase;letter-spacing:0.08em;">Worth reading before you go</p>
      <a href="https://indigopalm.co/blog/desert-vacation-prep/" style="display:block;margin-bottom:4px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">Desert Vacation Prep: What to Know Before You Go &rarr;</a>
      <p style="margin:0 0 14px;font-size:13px;color:#888;">What to pack, how to use the heat to your advantage, and why the pool matters more than you think.</p>
      ${['ps-retreat','the-well'].includes(propertyId) ? `
      <a href="https://indigopalm.co/blog/palm-springs-local-guide-sundune/" style="display:block;margin-bottom:4px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">The Local's Guide to Palm Springs &rarr;</a>
      <p style="margin:0 0 14px;font-size:13px;color:#888;">Where to eat, drink, and spend your mornings before the heat shows up.</p>
      <a href="https://indigopalm.co/blog/palm-springs-coffee-guide/" style="display:block;margin-bottom:4px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">The Palm Springs Coffee Guide &rarr;</a>
      <p style="margin:0;font-size:13px;color:#888;">Where to go before the heat shows up.</p>
      ` : `
      <a href="https://indigopalm.co/blog/indio-local-gems/" style="display:block;margin-bottom:4px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">10 Indio Gems Only Locals Know &rarr;</a>
      <p style="margin:0 0 14px;font-size:13px;color:#888;">Date shakes, birria, a vinyl bar, and a few spots that don't show up on Google Maps.</p>
      <a href="https://indigopalm.co/blog/palm-springs-coffee-guide/" style="display:block;margin-bottom:4px;color:#607c67;font-weight:600;font-size:14px;text-decoration:none;">The Palm Springs Coffee Guide &rarr;</a>
      <p style="margin:0;font-size:13px;color:#888;">Where to go before the heat shows up.</p>
      `}
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
      cc: 'indigopalmco@gmail.com',
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
        cc: 'indigopalmco@gmail.com',
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

  const nights = pricing.nights || Math.round(
    (new Date(checkOut + 'T00:00:00') - new Date(checkIn + 'T00:00:00')) / (1000 * 60 * 60 * 24)
  );
  const money = (dollars) => ({ amount: Math.round(dollars * 100), currency: 'USD' });
  const nightlyRate = nights > 0 ? Math.round(pricing.subtotal / nights) : 0;
  const rateLabel = nightlyRate > 0 ? `$${nightlyRate}/night x ${nights} nights` : `${nights} night${nights !== 1 ? 's' : ''}`;

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

async function sendEmail(apiKey, { from, to, subject, html, reply_to, cc }) {
  const payload = { from, to, subject, html };
  if (reply_to) payload.reply_to = reply_to;
  if (cc) payload.cc = cc;

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

// ── Guest Messaging Auto-Responder ────────────────────────────────────────────
// Receives Hostaway webhooks on POST /api/webhook/hostaway
// Generates Claude replies in Eann's voice, auto-sends or escalates to email.
//
// Required Cloudflare secrets (run once per secret):
//   wrangler secret put ANTHROPIC_API_KEY      --name indigo-palm-api
//   wrangler secret put HOSTAWAY_CLIENT_ID     --name indigo-palm-api
//   wrangler secret put HOSTAWAY_CLIENT_SECRET --name indigo-palm-api
//
// In Hostaway: Settings > Webhooks > Add webhook
//   URL: https://indigopalm.co/api/webhook/hostaway
//   Events: conversation.message.received (or "New message")

const PROPERTY_CONTEXT = {
  cozy_cactus: `
PROPERTY: The Cozy Cactus
ADDRESS: 82381 Cochran Dr, Indio, CA 92201
COMMUNITY: Indian Palms Country Club (gated)

CHECK-IN / CHECK-OUT
- Check-in: 4pm. Check-out: 10am.
- Front door code: 4898
- Garage code: 1340
- Self check-in, no need to meet anyone.

GATE ACCESS
- GPS "Indian Palms Country Club" takes you to the Monroe St entrance.
- License plate readers at Ave 48, Ave 50, and Jackson St gates. Pull up close, wait 10 seconds.
- If the plate reader misses you, head to the Monroe St guard booth and give your name + address: 82381 Cochran Dr.

WIFI
- Network: "Indigo Palm Collective"
- A browser window pops up asking for your email. Enter it and you're in.

POOL + HOT TUB
- Community pool: shared with the neighborhood. Key in the welcome guide.
- Hot tub: private, in the backyard. Luis services it Tuesday and Friday mornings via the side back gate.
- No pool heat needed — the hot tub is separate and private.

APPLIANCES + LOCATIONS
- Dishwasher: under the sink, left side. Pods in cabinet above.
- Washer/dryer: hallway closet near the guest bathroom.
- Coffee: Keurig on the counter left of the sink. K-cups in the cabinet above.
- Pack-n-play: family amenities closet, already assembled.
- High chair: same closet, labeled "Stokke."
- Extra towels + linens: hallway linen closet.
- Trash bins: outside along the side of the house.

HOUSE RULES
- Outdoor curfew: 10pm (city regulation). Please turn off patio lights by then.
- Smoke-free. Pet-free. Max occupancy: 8 guests.

EARLY CHECK-IN / LATE CHECKOUT
- Early check-in: officially 4pm, but message us day-of and we'll let you know if it's ready earlier. Cleaning crew starts around 10am and usually wraps by 1-2pm. No guarantee but we try.
- Late checkout: 10am is firm because cleaning crew is scheduled right after. Sometimes 11am works for $50, depends on the next booking.

ADDING GUESTS
- Happy to add anyone within the 8-guest max. Just send first and last name and we'll update the reservation.

DELIVERY
- Uber Eats and DoorDash both deliver here. Address: 82381 Cochran Dr, Indio, CA 92201.
- Grocery delivery (Instacart, etc.) also works.

NEARBY GROCERY
- Stater Bros: Monroe St, 5 minutes. Open late.
- Target: Monroe St, 8 minutes.
- Ralphs: Jefferson St, 8 minutes.
- Trader Joe's: Washington St, 15 minutes.

WHERE TO EAT (Indio / Coachella Valley)
- Shields Date Garden: Highway 111, 10 min. Breakfast, date shakes, a total Coachella Valley classic. Worth it.
- Las Casuelas Nuevas: Rancho Mirage, 20 min. Classic Cal-Mex, good for a big group, been around forever.
- Pinocchio in the Desert: La Quinta, 15 min. Solid Italian, nice patio.
- Old Town La Quinta: 15 min. Good walkable strip with a few restaurants and bars.
- Hog's Breath Saloon: Coachella, 10 min. Casual, outdoor, reliable for burgers and beers.
- The Date Shed: Indio, 10 min. Local spot, good breakfast/brunch.
- For coffee: Koffi on Hwy 111, 10 min.

THINGS TO DO
- Empire Polo Club (Coachella grounds): 5 min. Worth driving by even off-festival.
- Outlet malls (Desert Premium Outlets): 10 min. Two malls next to each other.
- Palm Springs: 25 min. Coffee, record shops, bookstores, a proper morning.
- Joshua Tree National Park: 45 min. Go early, bring snacks.
- Salton Sea: 30 min. Strange and beautiful if you're into that.
- Coachella Valley Preserve: 25 min. Free, great morning hike.

WELCOME GUIDE
Full details at: indigopalm.co/go/welcome-cozy-cactus

VOICE / STORY BEAT
Built for families who travel with young kids. The labeled drawers, Stokke chair, and sound machines in every room aren't amenities — they're the whole point. Parents arrive and exhale.
`.trim(),

  terra_luz: `
PROPERTY: Terra Luz
ADDRESS: 49768 Pacino St, Indio, CA 92201
COMMUNITY: Indian Palms Country Club (gated)

CHECK-IN / CHECK-OUT
- Check-in: 4pm. Check-out: 10am.
- Front door code: 5544 (enter code, wait a moment, then open)
- To lock: close the door fully and press and hold the lock icon.
- Garage code: 1340
- Self check-in, no need to meet anyone.

GATE ACCESS
- GPS "Indian Palms Country Club" takes you to the Monroe St entrance.
- License plate readers at Ave 48, Ave 50, and Jackson St gates. Pull up close, wait 5-10 seconds.
- If the reader misses you, head to Monroe St and give your name + address: 49768 Pacino St.

WIFI
- Network: "Indigo Palm Collective"
- Browser window pops up asking for your email. Enter it and you're in.

POOL + HOT TUB
- Saltwater pool, heated on request.
- Pool heat: $75/day (2-day minimum) or $400/week. Recommended Nov through May. Need at least 24 hours notice before arrival to set it up.
- Hot tub: no extra charge. Spa button on the wall next to the jacuzzi turns on heat and jets. Plan about an hour to reach 102°F.
- Pool serviced Mondays and Thursdays. Gardeners Wednesday mornings.

APPLIANCES + LOCATIONS
- Dishwasher: under the kitchen sink, left side. Pods in cabinet above.
- Washer/dryer: laundry room off the kitchen.
- Coffee: on the kitchen counter. Supplies in the cabinet above.
- Tortilla press + cast iron skillet: lower cabinet next to the stove.
- Extra towels + linens: hallway linen closet.
- Trash bins: outside along the side of the house.

COMMUNITY AMENITIES
- Up to 4 guests can use community pool, gym, etc. Just let us know and we'll notify the front desk.

HOUSE RULES
- Outdoor curfew: 10pm (city regulation). Turn off patio lights by then.
- Smoke-free. Dog-friendly with prior approval only. Always confirm before assuming. Max occupancy: 8 guests.

EARLY CHECK-IN / LATE CHECKOUT
- Early check-in: officially 4pm, but message us day-of and we'll check if it's ready. Cleaning usually wraps by 1-2pm. No guarantee but we try.
- Late checkout: 10am is firm because cleaning crew is scheduled right after. Sometimes 11am works for $50, depends on the next booking.

ADDING GUESTS
- Happy to add anyone within the 8-guest max. Send first and last name and we'll update the reservation.
- Dogs: prior approval required. One dog max. Confirm before assuming.

POOL HEAT REQUESTS
- If they ask about pool heat: $75/day (2-day min) or $400/week. Need 24hr notice before arrival. Let us know and we'll set it up.

DELIVERY
- Uber Eats and DoorDash both deliver here. Address: 49768 Pacino St, Indio, CA 92201.

NEARBY GROCERY
- Stater Bros: Monroe St, 5 minutes. Open late.
- Target: Monroe St, 8 minutes.
- Ralphs: Jefferson St, 8 minutes.

WHERE TO EAT (Indio / Coachella Valley)
- Shields Date Garden: Highway 111, 10 min. Breakfast, date shakes, iconic.
- Las Casuelas Nuevas: Rancho Mirage, 20 min. Classic Cal-Mex, good for groups.
- Pinocchio in the Desert: La Quinta, 15 min. Italian, good patio.
- Old Town La Quinta: 15 min. Walkable strip with a few solid spots.
- Hog's Breath Saloon: Coachella, 10 min. Casual burgers, outdoor.
- For coffee: Koffi on Hwy 111, 10 min.

THINGS TO DO
- Palm Springs: 25 min. Full morning: coffee at Koffi, breakfast at Cheeky's, walk the strip.
- Joshua Tree: 45 min. Go early.
- Outlet malls: 10 min. Two side by side.
- Coachella Valley Preserve: 25 min. Free, good hike.

WELCOME GUIDE
Full details at: indigopalm.co/go/welcome-terra-luz

VOICE / STORY BEAT
Latin/Cuban warmth of Old Havana. The Kahlo-blue pool, terracotta walls, and Cuban coffee beans aren't decor. They're a philosophy. Every material passed a brand filter. Dawn Asher designed it.
`.trim(),

  sundune: `
PROPERTY: The Sundune at Palm Springs (also listed as "PS Retreat")
ADDRESS: 5301 E Waverly Dr, Unit #184, Palm Springs, CA 92264
COMMUNITY: Palm Canyon Villas (condo complex, not gated — open access)

CHECK-IN / CHECK-OUT
- Check-in: 4pm. Check-out: 11am.
- Self check-in via Schlage blue keypad on the front door. Type code directly — no checkmark needed after.
- If keypad is dark, press bottom left corner to light it up. Do NOT tap anywhere before entering your code (Schlage registers any touch as a keystroke).
- Code is unique per reservation, sent before arrival.
- Unit #184 is upstairs (second floor).

PARKING + DIRECTIONS
- Parking lot #5. Designated carport spot: #555. Guest spots: G572-578. Street parking on Waverly Dr always available as backup.
- From parking lot #5: take the left-most path into the community (dumpster marks the start). Follow until you see the sign for unit #184, turn right, go up the stairs. Unit is on the left, black screen door (unlocked), then blue keypad door.
- Walk from parking: about 3-5 minutes.

WIFI
- Network: "The PS Retreat"
- Password: palmsprings

POOL + SPA
- Three community pools, all shared. Two keys available (on the green cactus key ring holder by the front door, black lanyard).
- Pools heated Nov through April. Spa heated year-round.
- No glass allowed in pool area. Do not slam the pool gate — permanent residents live next door.
- Lost or stolen pool key: $300 replacement fee. Please make sure it's back on the cactus holder before checkout.
- Pool chairs on the patio and in the laundry room (two lay-flat, four regular).

HOUSE RULES
- No smoking anywhere on property or common areas.
- 9pm outdoor city noise curfew. Music off and everyone inside by then.
- No shoes inside — helps reduce noise to downstairs neighbor.
- No parties, no glass by pool, max occupancy: 4 guests.
- Dogs welcome with prior approval. One dog max. Always confirm before assuming.
- Do not pick fruit from the trees in the common areas — they belong to neighbors.

EARLY CHECK-IN / LATE CHECKOUT
- Early check-in: officially 4pm, but message day-of and we'll check if the place is ready. Sometimes possible from noon. No guarantee but we try.
- Late checkout: 11am is firm because cleaners come right after. Message to ask, depends on next booking.

ADDING GUESTS
- Happy to add within the 4-guest max. Send first and last name.

APPLIANCES + LOCATIONS
- Coffee: K-cups in cabinet above the coffee maker.
- Extra blankets + pillows: closets in each bedroom.
- Trash: right cabinet of the dishwasher. Dumpsters in every parking lot — closest are in lots #4 or #5.
- AC/heat: Nest device on the hallway wall. Press ring toward wall to switch modes (Heat/Cool/Off). Turn ring up for warmer, down for cooler.
- Games: inside the ottoman in the living room.

DELIVERY
- Uber Eats and DoorDash both deliver here. Address: 5301 E Waverly Dr, Unit 184, Palm Springs, CA 92264.

NEARBY GROCERY
- Ralphs: Sunrise Way, 8 minutes.
- Stater Bros: Vista Chino, 10 minutes.
- Trader Joe's: Sunrise Way, 8 minutes.
- Whole Foods: N Palm Canyon Dr, 12 minutes.

WHERE TO EAT (Palm Springs)
Breakfast:
- Cheeky's: 622 N Palm Canyon Dr. Best breakfast in PS, worth the wait. Order the bacon flight.
- The Farm: 6 miles south, Worth Ave. Outdoor, peaceful, good eggs.
- Ernest Coffee: N Palm Canyon. Great coffee, good vibes.

Lunch / casual:
- Lulu California Bistro: S Palm Canyon, outdoor patio, good for groups.
- Tyler's Burgers: cash only, no frills, Palm Springs institution.
- Tac/Quila: solid tacos on N Indian Canyon.

Dinner:
- Birba: N Indian Canyon Dr. Wood-fired pizza and natural wine. Lively, a scene on weekends.
- Workshop Kitchen + Bar: E Tahquitz Canyon Way. More special occasion, great cocktails, beautiful room.
- Copley's: N Palm Canyon. Romantic, garden setting, upscale Cal cuisine.
- Eight4Nine: N Indian Canyon. Good for a group dinner, decent everything.
- Sandfish: Sushi, N Palm Canyon. Best sushi in PS, small menu, worth it.

Coffee:
- Koffi: multiple locations, Palm Canyon and N Indian Canyon. The local spot.
- Ernest Coffee: N Palm Canyon. Good beans, good aesthetic.

THINGS TO DO
- Downtown Palm Springs: 10 min. Coffee, record shops (Framed Music + Records), independent bookstores, boutiques.
- Palm Springs Aerial Tramway: 15 min. Takes you up to 8500 ft in the San Jacinto mountains. Stunning. Book in advance on weekends.
- Coachella Valley Preserve: 20 min. Free, good hike, fan palms.
- Desert Hot Springs: 20 min. Numerous natural hot spring spa resorts (Miracle Springs, El Morocco Inn).
- Joshua Tree National Park: 40 min.
- Moorten Botanical Garden: 5 min downtown. Small, weird, great.
- The Living Desert Zoo: 25 min in Palm Desert.

WELCOME GUIDE
Full details at: indigopalm.co/the-sundune

VOICE / STORY BEAT
Palm Springs the way people imagined it: a private retreat with a pool, a courtyard, and quiet that makes three days feel like a week. Ten minutes to downtown when you want it. Completely calm when you don't.
`.trim(),
};

const ESCALATION_KEYWORDS = [
  'cancel', 'refund', 'emergency', 'flood', 'fire', 'broke', 'broken',
  'hurt', 'injury', 'damage', 'mold', 'mould', 'pest', 'bug', 'cockroach',
  'mouse', 'rat', 'leak', 'plumbing', 'electrical', 'dispute', 'complaint',
  'unhappy', 'unacceptable', 'disgusting', 'lawsuit', 'attorney', 'police',
];

const HOSTAWAY_LISTING_MAP = {
  '123646': { key: 'cozy_cactus', name: 'The Cozy Cactus' },
  '123633': { key: 'terra_luz',   name: 'Terra Luz' },
};


async function getConversationHistory(token, conversationId) {
  const res = await fetch(`https://api.hostaway.com/v1/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.result || []).slice(-12);
}

async function sendHostawayReply(token, conversationId, message) {
  const res = await fetch(`https://api.hostaway.com/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: message }),
  });
  return res.ok;
}

async function callClaude(env, propertyKey, propertyName, guestName, currentMessage, history) {
  const context = PROPERTY_CONTEXT[propertyKey] || '';

  const historyLines = history
    .filter(m => m.body && m.authorType)
    .map(m => `${m.authorType === 'host' ? 'Eann' : guestName}: ${m.body}`)
    .join('\n');

  const userContent = historyLines
    ? `Conversation so far:\n${historyLines}\n\nNew message from ${guestName}: ${currentMessage}`
    : `${guestName} says: ${currentMessage}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are Eann, the host of ${propertyName}, part of Indigo Palm Collective: a small collection of four desert homes in the Coachella Valley.

PROPERTY CONTEXT:
${context}

YOUR VOICE (critical — read carefully):
- Warm, direct, specific. Never corporate or scripted.
- Short paragraphs: 2-3 sentences max. White space is good.
- NEVER use em dashes (—). This is a hard rule. Use a period, comma, or colon instead. Scan your reply before finishing and remove every em dash.
- No hollow adjectives (great, amazing, wonderful). Be specific instead.
- Parenthetical asides are fine and natural: "(lucky you!)", "(brand new)", "(it's the best)"
- First-person throughout.
- Sign off as: Eann — no title, no company name.
- If you don't know something, say so honestly and offer to find out. Never make up details.
- Only include info directly relevant to the question. Don't pad.
- Don't add unnecessary pleasantries. Get to the answer fast.
- No "Of course!", "Absolutely!", "Great question!" openers. Just answer.

SAMPLE RESPONSES IN YOUR VOICE:

Early check-in request:
"Hey [Name]! Check-in is officially 4pm but message me day-of and I'll let you know if the house is ready earlier. Cleaning crew usually wraps by 1-2pm, so it really just depends on timing. No guarantee but we try."

Adding a guest:
"Of course! Just send me [name]'s first and last name and I'll add them. You're still within the guest limit so no issue at all."

Where to eat:
"Depends what you're in the mood for — [give 2-3 specific recs with one-line descriptions from the property context, not a generic list]"

Can UberEats deliver:
"Yes, both Uber Eats and DoorDash deliver here. Just use [address] and they'll find it fine."

Pool heat (Terra Luz):
"Pool heat is $75/day (2-day min) or $400/week. If you want it warm for arrival, let me know at least 24 hours ahead and I'll get it set up. Hot tub is always free — just hit the Spa button on the wall."

Adding a dog (Terra Luz or Sundune):
"Yes, dogs are welcome with prior approval. [One dog max / etc.] Can you tell me a bit about them? Size, breed, and we should be good to go."

Late checkout:
"10am is firm on my end because the cleaning crew comes right after. If you want a little more time in the morning, I can sometimes do 11am for $50 — just depends on the next booking. Want me to check?"

Noise/neighbors question:
"Outdoor curfew is 10pm per city regulations — music off and everyone inside by then. The neighbors have always been great and we want to keep it that way. Inside the house after 10 is totally fine."

Sundune — early check-in offer:
"Hi [Name]! Just wanted to offer you early check in today at 12pm since the place will be available!"

Sundune — check-in logistics question:
"Hello! There is one set of stairs to the second floor. From lot #5, take the path by the dumpster, follow it until you see the #184 sign, turn right and go up. Unit is on the left with a black screen door."

Sundune — proactive mid-stay check-in:
"Hi [Name]\n\nHope you had a great night. Wanted to reach out to see how everything went and if you had any questions! Otherwise have a great stay 😊\n\nEann"

Sundune — something went wrong (water outage etc.):
"I totally understand! I will [look into it] and try to get a better idea. Honestly, I would proceed as usual for now — [context on what to expect]. So sorry for the inconvenience!"

Sundune — good news / enthusiasm:
"Yay so exciting!" or "Safe travels!! ENJOY" — match the guest's energy. Short, genuine, no corporate warmth.

WHERE TO FOCUS:
- If the guest asks a factual question (door code, WiFi, check-in time), answer it directly from the context.
- If they ask for a recommendation, give 2-3 specific ones with brief descriptions. Not a wall of text.
- If they're asking about something you're not sure about, say "let me check on that and get back to you."
- Match the energy of their message. Short message = short reply. Excited = warm. Practical = practical.`,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    console.error('Claude API error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || null;
}

function messageNeedsEscalation(message, reply) {
  const lower = message.toLowerCase();
  if (ESCALATION_KEYWORDS.some(kw => lower.includes(kw))) return true;
  if (!reply) return true;
  const uncertain = ["i'm not sure", "i don't know", "i can't find", "i'm unsure", "not certain", "you may want to contact"];
  if (uncertain.some(p => reply.toLowerCase().includes(p))) return true;
  return false;
}

async function sendEscalationEmail(env, guestName, propertyName, message, draft) {
  const propInfo = getPropertyByName(propertyName);
  const streetName = propInfo ? extractStreetName(propInfo.address) : null;
  const displayName = streetName ? `${streetName} (${propertyName})` : propertyName;

  const photoBlock = propInfo?.photo
    ? `<img src="${propInfo.photo}" alt="${propertyName}" width="560" style="display:block;width:100%;max-width:560px;height:200px;object-fit:cover;border-radius:8px;margin-bottom:20px;" />`
    : '';

  const draftBlock = draft
    ? `<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Suggested reply (not sent):</p>
       <blockquote style="margin:0 0 20px;padding:12px 16px;background:#EEF2FF;border-left:3px solid #325CD9;font-size:14px;color:#333;line-height:1.6;">${draft.replace(/\n/g, '<br>')}</blockquote>
       <p style="font-size:13px;color:#666;">Log into Hostaway to send, edit, or ignore this reply.</p>`
    : `<p style="font-size:13px;color:#888;">Claude could not generate a reply. Check the message manually.</p>`;

  await sendEmail(env.RESEND_API_KEY, {
    from: 'Indigo Palm Bot <bookings@indigopalm.co>',
    to:   'indigopalmco@gmail.com',
    subject: `Guest needs a reply: ${guestName} at ${displayName}`,
    html: emailWrapper(`
      ${photoBlock}
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Guest message</p>
      <h2 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#2C2C2C;">${guestName} at ${displayName}</h2>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Their message:</p>
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#F5F3EE;border-left:3px solid #B67550;font-size:14px;color:#333;line-height:1.6;">${message.replace(/\n/g, '<br>')}</blockquote>
      ${draftBlock}
    `),
  });
}

async function handleHostawayWebhook(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Hostaway sends: { accountId, type, object: { ... } }
  // Fall back to root-level fields if object isn't nested.
  const obj = payload.object || payload.data || payload;
  const eventType = (payload.type || payload.event || '').toLowerCase();

  // Only handle incoming guest messages
  if (eventType && !eventType.includes('message') && !eventType.includes('conversation')) {
    return new Response('OK', { status: 200 });
  }

  const conversationId = obj.conversationId || obj.id;
  const listingId      = String(obj.listingId || '');
  const authorType     = (obj.authorType || obj.type || '').toLowerCase();
  const message        = (obj.body || obj.message || '').trim();
  const guestName      = (obj.guestName || obj.guest || 'Guest').split(' ')[0];

  // Ignore host/system messages and empty payloads
  if (!message || !conversationId || authorType === 'host' || authorType === 'system') {
    return new Response('OK', { status: 200 });
  }

  const property = HOSTAWAY_LISTING_MAP[listingId];
  if (!property) {
    console.log(`Unknown listing ID: ${listingId}`);
    return new Response('OK', { status: 200 });
  }

  try {
    const token   = await getHostawayToken(env);
    const history = await getConversationHistory(token, conversationId);
    const reply   = await callClaude(env, property.key, property.name, guestName, message, history);
    const escalate = messageNeedsEscalation(message, reply);

    if (escalate || !reply) {
      await sendEscalationEmail(env, guestName, property.name, message, reply);
    } else {
      const sent = await sendHostawayReply(token, conversationId, reply);
      if (!sent) {
        await sendEscalationEmail(env, guestName, property.name, message, reply);
      }
    }
  } catch (err) {
    console.error('Hostaway webhook error:', err);
    try {
      await sendEscalationEmail(env, guestName, property.name, message, null);
    } catch {}
  }

  return new Response('OK', { status: 200 });
}

// ── Airbnb Email Auto-Responder ───────────────────────────────────────────────
// Cloudflare Email Routing delivers Airbnb notification emails directly to this
// Worker via the `email` event. We parse the guest message, generate a Claude
// reply in Eann's voice, then send it back to Airbnb via the reply+token address.
//
// Setup:
//   1. Cloudflare Dashboard > Email Routing > enable for indigopalm.co
//   2. Create rule: airbnb@indigopalm.co → route to Worker "indigo-palm-api"
//   3. In Airbnb account settings, change notification email to airbnb@indigopalm.co
//
// Required secrets (already set): ANTHROPIC_API_KEY, RESEND_API_KEY

const AIRBNB_PROPERTY_PATTERNS = [
  { patterns: ['cozy cactus', 'cochran', '82381'],              key: 'cozy_cactus', name: 'The Cozy Cactus' },
  { patterns: ['terra luz', 'casa moto', 'pacino', '49768'],    key: 'terra_luz',   name: 'Terra Luz'       },
  { patterns: ['sundune', 'waverly', '5301', 'ps retreat', 'palm springs retreat'], key: 'sundune', name: 'The Sundune at Palm Springs' },
];

async function streamToText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseEmailParts(rawEmail) {
  const sep = rawEmail.indexOf('\r\n\r\n') !== -1 ? '\r\n\r\n' : '\n\n';
  const sepIdx = rawEmail.indexOf(sep);
  if (sepIdx === -1) return { plain: rawEmail, html: '' };

  const headerSection = rawEmail.slice(0, sepIdx);
  const body = rawEmail.slice(sepIdx + sep.length);

  const ctMatch = headerSection.match(/^Content-Type:\s*([^\r\n;]+)/im);
  const ct = ctMatch ? ctMatch[1].trim().toLowerCase() : 'text/plain';

  if (!ct.includes('multipart')) {
    const encMatch = headerSection.match(/^Content-Transfer-Encoding:\s*(\S+)/im);
    const enc = encMatch ? encMatch[1].toLowerCase() : '';
    let decoded = body;
    if (enc === 'quoted-printable') decoded = decodeQuotedPrintable(body);
    else if (enc === 'base64') { try { const b64 = body.replace(/\s/g, ''); decoded = new TextDecoder('utf-8').decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))); } catch {} }
    return ct.includes('html') ? { plain: '', html: decoded } : { plain: decoded, html: '' };
  }

  const boundaryMatch = headerSection.match(/boundary="?([^"\r\n;]+)"?/i);
  if (!boundaryMatch) return { plain: body, html: '' };

  const boundary = boundaryMatch[1].trim();
  const parts = body.split(new RegExp('--' + boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:--)?'));

  let plain = '', html = '';
  for (const part of parts) {
    const ps = part.indexOf('\r\n\r\n') !== -1 ? '\r\n\r\n' : '\n\n';
    const pi = part.indexOf(ps);
    if (pi === -1) continue;
    const ph = part.slice(0, pi);
    let pb = part.slice(pi + ps.length).replace(/\s+$/, '');

    const penc = (ph.match(/Content-Transfer-Encoding:\s*(\S+)/i) || [])[1]?.toLowerCase() || '';
    if (penc === 'quoted-printable') pb = decodeQuotedPrintable(pb);
    else if (penc === 'base64') { try { const b64 = pb.replace(/\s/g, ''); pb = new TextDecoder('utf-8').decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))); } catch {} }

    if (/content-type:\s*text\/plain/i.test(ph)) plain = pb;
    else if (/content-type:\s*text\/html/i.test(ph)) html = pb;
  }
  return { plain, html };
}

function extractGuestName(subject) {
  let m = subject.match(/new message from ([^<\n]+?)(?:\s*[-|]|\s*$)/i);
  if (m) return m[1].trim().split(' ')[0];
  m = subject.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+sent\s+/);
  if (m) return m[1].trim().split(' ')[0];
  m = subject.match(/message from ([A-Z][a-z]+)/i);
  if (m) return m[1];
  return null;
}

function detectProperty(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  for (const prop of AIRBNB_PROPERTY_PATTERNS) {
    if (prop.patterns.some(p => text.includes(p))) return prop;
  }
  return null;
}

async function extractGuestMessageWithClaude(env, emailText, subject) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: "Extract the guest's message from an Airbnb notification email. Return ONLY the guest's actual message text, no intro or commentary. If there is no guest message, return the string NO_MESSAGE.",
      messages: [{ role: 'user', content: `Subject: ${subject}\n\nBody:\n${emailText.slice(0, 3000)}` }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.content?.[0]?.text?.trim();
  return (text && text !== 'NO_MESSAGE') ? text : null;
}

async function sendAirbnbReply(env, replyToAddress, propertyName, replyText) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'Eann at Indigo Palm <bookings@indigopalm.co>',
      to:      [replyToAddress],
      subject: `Re: Your message about ${propertyName}`,
      text:    replyText,
    }),
  });
  if (!res.ok) {
    console.error('Resend Airbnb reply error:', res.status, await res.text());
    return false;
  }
  return true;
}

async function sendAirbnbEscalationEmail(env, guestName, propertyName, guestMessage, draft) {
  const propInfo = getPropertyByName(propertyName);
  const streetName = propInfo ? extractStreetName(propInfo.address) : null;
  const displayName = streetName ? `${streetName} (${propertyName})` : propertyName;

  const photoBlock = propInfo?.photo
    ? `<img src="${propInfo.photo}" alt="${propertyName}" width="560" style="display:block;width:100%;max-width:560px;height:200px;object-fit:cover;border-radius:8px;margin-bottom:20px;" />`
    : '';

  const draftBlock = draft
    ? `<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Suggested reply (not sent):</p>
       <blockquote style="margin:0 0 20px;padding:12px 16px;background:#EEF2FF;border-left:3px solid #325CD9;font-size:14px;color:#333;line-height:1.6;">${draft.replace(/\n/g, '<br>')}</blockquote>
       <p style="font-size:13px;color:#666;">Log into Airbnb to send, edit, or ignore this reply.</p>`
    : `<p style="font-size:13px;color:#888;">Claude could not generate a reply. Respond directly in Airbnb.</p>`;

  await sendEmail(env.RESEND_API_KEY, {
    from:    'Indigo Palm Bot <bookings@indigopalm.co>',
    to:      'indigopalmco@gmail.com',
    subject: `Guest needs a reply: ${guestName} at ${displayName}`,
    html: emailWrapper(`
      ${photoBlock}
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Airbnb guest message</p>
      <h2 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#2C2C2C;">${guestName} at ${displayName}</h2>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Their message:</p>
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#F5F3EE;border-left:3px solid #B67550;font-size:14px;color:#333;line-height:1.6;">${guestMessage.replace(/\n/g, '<br>')}</blockquote>
      ${draftBlock}
    `),
  });
}

// ── Web Push (RFC 8291 + RFC 8292) ────────────────────────────────────────────

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

function concatU8(...arrs) {
  const total = arrs.reduce((n, a) => n + a.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) {
    const u = a instanceof Uint8Array ? a : new Uint8Array(a instanceof ArrayBuffer ? a : a.buffer);
    out.set(u, off); off += u.byteLength;
  }
  return out;
}

async function hmacSha256(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

async function hkdfExtract(salt, ikm) {
  return hmacSha256(salt, ikm);
}

async function hkdfExpand(prk, info, length) {
  const t = await hmacSha256(prk, concatU8(info, new Uint8Array([1])));
  return t.slice(0, length);
}

async function encryptWebPush(p256dhB64, authB64, plaintext) {
  const ua_pub   = fromB64url(p256dhB64);
  const auth_sec = fromB64url(authB64);
  const msg      = new TextEncoder().encode(plaintext);

  // Application server keypair
  const asKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const as_pub_raw = new Uint8Array(await crypto.subtle.exportKey('raw', asKP.publicKey));

  // ECDH shared secret
  const ua_pubKey = await crypto.subtle.importKey('raw', ua_pub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: ua_pubKey }, asKP.privateKey, 256));

  // RFC 8291 key derivation
  const prk_key = await hkdfExtract(auth_sec, ecdh);
  const key_info = concatU8(new TextEncoder().encode('WebPush: info\x00'), ua_pub, as_pub_raw);
  const ikm = await hkdfExpand(prk_key, key_info, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, ikm);
  const cek   = await hkdfExpand(prk, new TextEncoder().encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode('Content-Encoding: nonce\x00'), 12);

  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, concatU8(msg, new Uint8Array([2]))));

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  return concatU8(salt, rs, new Uint8Array([as_pub_raw.byteLength]), as_pub_raw, ct);
}

async function vapidJwt(privateKeyJwk, audience, subject) {
  const hdr = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const pld = b64url(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 43200, sub: subject })));
  const msg = `${hdr}.${pld}`;
  const key = await crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(msg));
  return `${msg}.${b64url(sig)}`;
}

async function getVapidKeys(env) {
  let stored = await env.BOOKINGS.get('vapid_keys', { type: 'json' });
  if (stored) return stored;
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  stored = { publicKey: b64url(pubRaw), privateKeyJwk: privJwk };
  await env.BOOKINGS.put('vapid_keys', JSON.stringify(stored));
  return stored;
}

async function sendWebPush(env, notification) {
  const sub = await env.BOOKINGS.get('push_subscription', { type: 'json' });
  if (!sub) return false;
  const { publicKey, privateKeyJwk } = await getVapidKeys(env);
  const audience = new URL(sub.endpoint).origin;
  const jwt = await vapidJwt(privateKeyJwk, audience, 'mailto:indigopalmco@gmail.com');
  const body = await encryptWebPush(sub.keys.p256dh, sub.keys.auth, JSON.stringify(notification));
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt},k=${publicKey}`,
      'Content-Type':  'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body,
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Web Push failed:', res.status, body);
    if (res.status === 404 || res.status === 410) {
      await env.BOOKINGS.delete('push_subscription');
      console.log('Deleted stale push_subscription from KV');
    }
  }
  return res.ok;
}

// ── PWA: Inbox, Manifest, Service Worker, Push Subscribe ─────────────────────

async function handleInboxPage(env) {
  const list = await env.BOOKINGS.list({ prefix: 'airbnb_pending:' });
  const pending = [];
  for (const key of list.keys) {
    const item = await env.BOOKINGS.get(key.name, { type: 'json' });
    if (item && !item.sent) {
      const id = key.name.replace('airbnb_pending:', '');
      const ageMs = Date.now() - item.createdAt;
      const minsLeft = Math.max(0, Math.round((10 * 60 * 1000 - ageMs) / 60000));
      pending.push({ id, ...item, minsLeft });
    }
  }
  pending.sort((a, b) => a.minsLeft - b.minsLeft);

  const cards = pending.length === 0
    ? `<div class="empty"><div class="empty-icon">✓</div><p>No pending replies</p></div>`
    : pending.map(p => `
      <div class="card">
        <div class="card-header">
          <span class="guest">${escapeHtml(p.guestName)}</span>
          <span class="prop">${escapeHtml(p.propertyName)}</span>
        </div>
        <div class="msg">${escapeHtml(p.guestMessage.slice(0, 120))}${p.guestMessage.length > 120 ? '…' : ''}</div>
        <div class="card-footer">
          <span class="timer ${p.minsLeft <= 2 ? 'urgent' : ''}">${p.minsLeft > 0 ? `Auto-sends in ${p.minsLeft} min` : 'Sending soon…'}</span>
          <a class="btn-review" href="/api/approve-reply?id=${p.id}">Review &amp; Send</a>
        </div>
      </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Inbox — Indigo Palm</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#B67550">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="IP Inbox">
  <link rel="apple-touch-icon" href="/images/logo-icon-transparent.png">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F5F3EE;min-height:100vh}
    .topbar{background:#fff;border-bottom:1px solid #e8ddd0;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
    .topbar h1{font-family:Georgia,serif;font-size:18px;font-weight:400;color:#2C2C2C}
    .badge{background:#B67550;color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;margin-left:8px}
    .refresh{font-size:13px;color:#325CD9;text-decoration:none;padding:6px 0}
    .list{padding:16px;max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
    .card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,.07)}
    .card-header{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
    .guest{font-size:15px;font-weight:700;color:#2C2C2C}
    .prop{font-size:12px;color:#B67550;font-weight:600}
    .msg{font-size:14px;color:#555;line-height:1.5;margin-bottom:12px}
    .card-footer{display:flex;align-items:center;justify-content:space-between}
    .timer{font-size:12px;color:#999}
    .timer.urgent{color:#E05C2A;font-weight:600}
    .btn-review{background:#325CD9;color:#fff;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600}
    .empty{text-align:center;padding:60px 20px;color:#aaa}
    .empty-icon{font-size:48px;margin-bottom:12px;color:#B67550}
    .empty p{font-size:15px}
    .notify-bar{background:#EEF2FF;border-radius:12px;padding:14px 16px;margin:0 16px 0;max-width:600px;margin-left:auto;margin-right:auto;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .notify-bar p{font-size:13px;color:#325CD9;flex:1}
    .btn-notify{background:#325CD9;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
    .btn-notify:disabled{background:#aaa}
    #notify-status{font-size:12px;color:#888;text-align:center;padding:8px 20px;max-width:600px;margin:0 auto}
  </style>
</head>
<body>
  <div class="topbar">
    <h1>Inbox<span class="badge" id="count">${pending.length}</span></h1>
    <a class="refresh" href="/inbox">Refresh</a>
  </div>
  <div id="notify-wrap" style="padding:16px 16px 0;max-width:600px;margin:0 auto;display:none">
    <div class="notify-bar">
      <p>Get push notifications when guests message you.</p>
      <button class="btn-notify" id="notify-btn" onclick="subscribePush()">Enable</button>
    </div>
  </div>
  <div id="notify-status"></div>
  <div class="list">${cards}</div>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    async function subscribePush() {
      const btn = document.getElementById('notify-btn');
      btn.disabled = true; btn.textContent = 'Enabling…';
      try {
        const reg = await navigator.serviceWorker.ready;
        // Unsubscribe any existing subscription first so only one is ever active
        const existing = await reg.pushManager.getSubscription();
        if (existing) await existing.unsubscribe();
        const keyRes = await fetch('/api/vapid-public-key');
        const { publicKey } = await keyRes.json();
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8(publicKey),
        });
        await fetch('/api/push-subscribe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(sub) });
        document.getElementById('notify-wrap').style.display = 'none';
        document.getElementById('notify-status').textContent = '✓ Notifications enabled on this device.';
      } catch(e) {
        btn.disabled = false; btn.textContent = 'Enable';
        document.getElementById('notify-status').textContent = 'Could not enable: ' + e.message;
      }
    }
    function urlB64ToUint8(b64) {
      const pad = '='.repeat((4 - b64.length % 4) % 4);
      const raw = atob(b64.replace(/-/g,'+').replace(/_/g,'/') + pad);
      return Uint8Array.from(raw, c => c.charCodeAt(0));
    }
    async function checkNotifyState() {
      const wrap = document.getElementById('notify-wrap');
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = window.navigator.standalone === true;

      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        // Not supported — likely iOS Safari in browser tab
        if (isIOS && !isStandalone) {
          wrap.style.display = 'block';
          wrap.innerHTML = '<div class="notify-bar"><p style="font-size:13px;margin:0">To get push notifications on iPhone: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>, then open from there.</p></div>';
        }
        return;
      }
      const perm = Notification.permission;
      if (perm === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) return; // already subscribed
      }
      if (perm !== 'denied') {
        wrap.style.display = 'block';
      }
    }
    checkNotifyState();
    setTimeout(() => location.reload(), 60000); // auto-refresh every 60s
  </script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

function handleManifest() {
  const manifest = {
    name: 'Indigo Palm Inbox',
    short_name: 'IP Inbox',
    start_url: '/inbox',
    display: 'standalone',
    background_color: '#F5F3EE',
    theme_color: '#B67550',
    icons: [
      { src: '/images/logo-icon-transparent.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/logo-icon-transparent.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json' } });
}

function handleServiceWorker() {
  const sw = `
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Guest message', {
      body: data.body || '',
      icon: '/images/logo-icon-transparent.png',
      badge: '/images/logo-icon-transparent.png',
      tag: data.id || 'guest-msg',
      renotify: true,
      data: { url: data.url || '/inbox' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/inbox';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url === url && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
`;
  return new Response(sw, { headers: { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/' } });
}

async function handleVapidPublicKey(env) {
  const keys = await getVapidKeys(env);
  return new Response(JSON.stringify({ publicKey: keys.publicKey }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function handlePushSubscribe(request, env) {
  let sub;
  try { sub = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }
  await env.BOOKINGS.put('push_subscription', JSON.stringify(sub));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleTestPush(env) {
  const sub = await env.BOOKINGS.get('push_subscription', { type: 'json' });
  if (!sub) {
    return new Response(JSON.stringify({ error: 'No push subscription saved yet. Open /inbox and tap Enable first.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    await sendWebPush(env, {
      title: 'Indigo Palm — Test',
      body: 'Push notifications are working! You\'ll get notified when guests message.',
      url: '/inbox',
    });
    return new Response(JSON.stringify({ ok: true, message: 'Test notification sent.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleTestGuestMessage(env) {
  const fakeGuest = 'Sarah';
  const fakeProperty = { key: 'cozy_cactus', name: 'The Cozy Cactus' };
  const fakeMessage = "Hi! So excited for our stay this weekend. Quick question — any chance we could do an early check-in around noon? We're driving in from LA and would love to drop bags and head to the pool. Also, does UberEats deliver to the house?";
  const fakeReplyTo = 'reply+test-token-do-not-send@reply.airbnb.com';

  let draft = '';
  try {
    draft = await callClaude(env, fakeGuest, fakeProperty.name, fakeProperty.key, fakeMessage);
  } catch (e) {
    draft = "Hey Sarah! So excited to have you. Early check-in at noon is usually tight since we need the full morning to get the house ready after any previous guests, but I'll check and let you know. And yes — UberEats delivers great to the house! Address is 82381 Cochran Dr, Indio 92201. See you soon!";
  }

  const id = crypto.randomUUID();
  await env.BOOKINGS.put(`airbnb_pending:${id}`, JSON.stringify({
    airbnbReplyAddress: fakeReplyTo,
    propertyKey:  fakeProperty.key,
    propertyName: fakeProperty.name,
    guestName:    fakeGuest,
    guestMessage: fakeMessage,
    draft,
    createdAt: Date.now(),
    sent: false,
    isTest: true,
  }), { expirationTtl: 3600 });

  const approveUrl = `https://indigopalm.co/api/approve-reply?id=${id}`;

  await sendEmail(env.RESEND_API_KEY, {
    from:    'Indigo Palm Bot <bookings@indigopalm.co>',
    to:      'indigopalmco@gmail.com',
    subject: `[TEST] Reply needed: ${fakeGuest} at ${fakeProperty.name}`,
    html: emailWrapper(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Test guest message</p>
      <h2 style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#2C2C2C;">${fakeGuest} — ${fakeProperty.name}</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#888;">Auto-sends in 10 minutes if you don't act. (This is a test — the reply address is fake and won't send to a real guest.)</p>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Their message:</p>
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#F5F3EE;border-left:3px solid #B67550;font-size:14px;color:#333;line-height:1.6;">${fakeMessage.replace(/\n/g, '<br>')}</blockquote>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Draft reply:</p>
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#EEF2FF;border-left:3px solid #325CD9;font-size:14px;color:#333;line-height:1.6;">${draft.replace(/\n/g, '<br>')}</blockquote>
      <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;background:#325CD9;color:white;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">Review &amp; Send</a>
      <p style="margin:16px 0 0;font-size:12px;color:#aaa;">Tap "Review &amp; Send" to edit and send the reply. If you do nothing, it auto-sends in 10 minutes. (This test reply goes to a fake address — no real guest will receive it.)</p>
    `),
  });

  try {
    await sendWebPush(env, {
      title: `${fakeGuest} — ${fakeProperty.name}`,
      body:  fakeMessage.slice(0, 100) + '…',
      url:   approveUrl,
      id,
    });
  } catch (e) {
    console.error('Test push failed:', e);
  }

  return new Response(JSON.stringify({ ok: true, id, approveUrl, draft }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── HTML escape helper ────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function handleApprovalPage(request, env) {
  const url = new URL(request.url);
  const id  = url.searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });

  const pending = await env.BOOKINGS.get(`airbnb_pending:${id}`, { type: 'json' });
  if (!pending) {
    return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Expired</title></head><body style="font-family:-apple-system,sans-serif;padding:40px 20px;text-align:center;background:#f5f3ee"><h2 style="color:#2C2C2C">This reply has already been sent or expired.</h2><p style="color:#888;margin-top:8px">Check Airbnb for the conversation.</p></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }
  if (pending.sent) {
    return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Already sent</title></head><body style="font-family:-apple-system,sans-serif;padding:40px 20px;text-align:center;background:#f5f3ee"><h2 style="color:#2C2C2C">Reply already sent.</h2></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }

  const minutesLeft = Math.max(0, Math.round((10 * 60 * 1000 - (Date.now() - pending.createdAt)) / 60000));
  const autoSendNote = minutesLeft > 0
    ? `Auto-sends in ${minutesLeft} min if you don't act.`
    : 'Auto-send pending — act quickly.';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reply to ${escapeHtml(pending.guestName)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3ee;padding:16px;min-height:100vh}
    .card{background:#fff;border-radius:14px;padding:20px;max-width:560px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,.08)}
    .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#aaa;margin-bottom:6px}
    .prop{font-size:13px;font-weight:600;color:#B67550;margin-bottom:18px}
    .bubble{background:#f5f3ee;border-left:3px solid #B67550;padding:12px 14px;border-radius:0 8px 8px 0;font-size:14px;line-height:1.65;color:#333;margin-bottom:22px;white-space:pre-wrap}
    .timer{font-size:12px;color:#999;margin-bottom:10px}
    textarea{width:100%;border:1.5px solid #ddd;border-radius:10px;padding:12px;font-size:15px;line-height:1.6;resize:vertical;min-height:180px;font-family:inherit;color:#222;transition:border .15s}
    textarea:focus{border-color:#325CD9;outline:none}
    .btn-send{display:block;width:100%;margin-top:14px;padding:15px;background:#325CD9;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;letter-spacing:.01em}
    .btn-send:active{background:#2449b8}
    .discard{display:block;text-align:center;margin-top:14px;color:#bbb;font-size:13px;text-decoration:none}
    .discard:hover{color:#888}
  </style>
</head>
<body>
  <div class="card">
    <div class="label">Guest message</div>
    <div class="prop">${escapeHtml(pending.guestName)} — ${escapeHtml(pending.propertyName)}</div>
    <div class="label">They said:</div>
    <div class="bubble">${escapeHtml(pending.guestMessage)}</div>
    <form method="POST" action="/api/approve-reply">
      <input type="hidden" name="id" value="${escapeHtml(id)}">
      <div class="label">Your reply (edit if needed):</div>
      <div class="timer">${autoSendNote}</div>
      <textarea name="reply">${escapeHtml(pending.draft)}</textarea>
      <button type="submit" class="btn-send">Send Reply</button>
    </form>
    <a href="/api/discard-reply?id=${escapeHtml(id)}" class="discard">Don't send — I'll reply manually in Airbnb</a>
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

async function handleApprovalSubmit(request, env) {
  let formData;
  try { formData = await request.formData(); } catch { return new Response('Bad request', { status: 400 }); }

  const id    = formData.get('id');
  const reply = (formData.get('reply') || '').trim();
  if (!id || !reply) return new Response('Missing fields', { status: 400 });

  const pending = await env.BOOKINGS.get(`airbnb_pending:${id}`, { type: 'json' });
  if (!pending) {
    return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system,sans-serif;padding:40px 20px;text-align:center;background:#f5f3ee"><h2>Already sent or expired.</h2></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }
  if (pending.sent) {
    return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system,sans-serif;padding:40px 20px;text-align:center;background:#f5f3ee"><h2>Reply already sent.</h2></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }

  if (!pending.isTest) {
    const sent = await sendAirbnbReply(env, pending.airbnbReplyAddress, pending.propertyName, reply);
    if (!sent) {
      await sendAirbnbEscalationEmail(env, pending.guestName, pending.propertyName, pending.guestMessage, reply);
    }
  }
  await env.BOOKINGS.delete(`airbnb_pending:${id}`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sent</title>
  <style>body{font-family:-apple-system,sans-serif;background:#f5f3ee;padding:40px 20px;text-align:center}.card{background:#fff;border-radius:14px;padding:32px 24px;max-width:400px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,.08)}.check{font-size:48px;margin-bottom:16px}h2{color:#2C2C2C;font-weight:600;margin-bottom:8px}p{color:#888;font-size:14px}</style>
</head>
<body>
  <div class="card">
    <div class="check">✓</div>
    <h2>${pending.isTest ? '[Test] Reply approved' : `Reply sent to ${escapeHtml(pending.guestName)}`}</h2>
    <p>${pending.isTest ? 'This was a test — no message was sent to a real guest.' : 'Message delivered through Airbnb.'}</p>
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

async function handleDiscardReply(request, env) {
  const url = new URL(request.url);
  const id  = url.searchParams.get('id');
  if (id) {
    try { await env.BOOKINGS.delete(`airbnb_pending:${id}`); } catch {}
  }
  return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system,sans-serif;padding:40px 20px;text-align:center;background:#f5f3ee"><div style="background:#fff;border-radius:14px;padding:32px 24px;max-width:400px;margin:0 auto"><h2 style="color:#2C2C2C;margin-bottom:8px">Draft discarded.</h2><p style="color:#888;font-size:14px">Reply manually in Airbnb when you're ready.</p></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

async function handleAirbnbEmail(message, env) {
  const from = (message.from || '').toLowerCase();
  if (!from.includes('airbnb.com')) {
    console.log('Email not from Airbnb, skipping:', from);
    return;
  }

  const subject = message.headers.get('subject') || '';
  const replyTo = message.headers.get('reply-to') || '';

  const airbnbReplyMatch = replyTo.match(/reply\+[^@\s]+@reply\.airbnb\.com/i);
  if (!airbnbReplyMatch) {
    console.log('No Airbnb reply-to token, forwarding to Gmail. Subject:', subject);
    try {
      const rawEmail = await streamToText(message.raw);
      const { plain, html } = parseEmailParts(rawEmail);
      const rawBodyText = plain || stripHtml(html) || '(no body)';
      const bodyText = rawBodyText
        .replace(/%opentrack%/gi, '')
        .replace(/https?:\/\/\S{80,}/g, '[link]')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      await sendEmail(env.RESEND_API_KEY, {
        from:    'Indigo Palm Bot <bookings@indigopalm.co>',
        to:      'indigopalmco@gmail.com',
        subject: `[Airbnb] ${subject}`,
        html:    emailWrapper(`
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Forwarded from Airbnb</p>
          <h2 style="margin:0 0 20px;font-family:Georgia,serif;font-size:20px;font-weight:400;color:#2C2C2C;">${subject}</h2>
          <pre style="font-family:inherit;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#333;">${bodyText.slice(0, 4000)}</pre>
        `),
      });
    } catch (e) {
      console.error('Failed to forward Airbnb non-message email:', e);
    }
    return;
  }
  const airbnbReplyAddress = airbnbReplyMatch[0];

  const rawEmail = await streamToText(message.raw);
  const { plain, html } = parseEmailParts(rawEmail);
  const bodyText = plain || stripHtml(html) || '';

  const guestName    = extractGuestName(subject) || 'Guest';
  const property     = detectProperty(subject, bodyText);
  const guestMessage = await extractGuestMessageWithClaude(env, bodyText, subject);

  if (!guestMessage) {
    console.log('Could not extract guest message. Subject:', subject);
    await sendAirbnbEscalationEmail(env, guestName, property?.name || 'Unknown property', bodyText.slice(0, 500) || '(empty body)', null);
    return;
  }

  if (!property) {
    await sendAirbnbEscalationEmail(env, guestName, 'Unknown property (check Airbnb)', guestMessage, null);
    return;
  }

  let draft = null;
  try {
    draft = await callClaude(env, property.key, property.name, guestName, guestMessage, []);
  } catch (err) {
    console.error('Claude error in email handler:', err);
  }

  // Save pending reply to KV for approval / auto-send
  const id = crypto.randomUUID();
  const pendingData = {
    airbnbReplyAddress,
    propertyKey:  property.key,
    propertyName: property.name,
    guestName,
    guestMessage,
    draft:        draft || '',
    createdAt:    Date.now(),
    sent:         false,
  };

  try {
    await env.BOOKINGS.put(
      `airbnb_pending:${id}`,
      JSON.stringify(pendingData),
      { expirationTtl: 14400 } // 4 hours
    );
  } catch (err) {
    console.error('KV write error:', err);
    await sendAirbnbEscalationEmail(env, guestName, property.name, guestMessage, draft);
    return;
  }

  // Send approval email to Eann
  const approveUrl = `https://indigopalm.co/api/approve-reply?id=${id}`;
  const escalateFlag = draft ? messageNeedsEscalation(guestMessage, draft) : true;
  const flagNote = escalateFlag
    ? `<p style="margin:0 0 16px;padding:10px 14px;background:#FFF3CD;border-left:3px solid #F0A500;font-size:13px;color:#555;border-radius:0 6px 6px 0;">Heads up: this message may need your personal attention (escalation keyword or uncertain reply).</p>`
    : '';

  await sendEmail(env.RESEND_API_KEY, {
    from:    'Indigo Palm Bot <bookings@indigopalm.co>',
    to:      'indigopalmco@gmail.com',
    subject: `Reply needed: ${guestName} at ${property.name}`,
    html: emailWrapper(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;">New guest message</p>
      <h2 style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#2C2C2C;">${guestName} — ${property.name}</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#888;">Auto-sends in 10 minutes if you don't act.</p>
      ${flagNote}
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Their message:</p>
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#F5F3EE;border-left:3px solid #B67550;font-size:14px;color:#333;line-height:1.6;">${guestMessage.replace(/\n/g, '<br>')}</blockquote>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Draft reply:</p>
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#EEF2FF;border-left:3px solid #325CD9;font-size:14px;color:#333;line-height:1.6;">${(draft || '(no draft generated)').replace(/\n/g, '<br>')}</blockquote>
      <a href="${approveUrl}" style="display:inline-block;padding:12px 28px;background:#325CD9;color:white;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">Review &amp; Send</a>
      <p style="margin:16px 0 0;font-size:12px;color:#aaa;">Clicking "Review &amp; Send" opens a page where you can edit the reply before sending. If you do nothing, the draft auto-sends in 10 minutes.</p>
    `),
  });

  // Send push notification to phone
  try {
    await sendWebPush(env, {
      title: `${guestName} — ${property.name}`,
      body:  guestMessage.slice(0, 100) + (guestMessage.length > 100 ? '…' : ''),
      url:   `https://indigopalm.co/api/approve-reply?id=${id}`,
      id,
    });
  } catch (e) {
    console.error('Push notification failed:', e);
  }

  console.log(`Draft saved for ${guestName} at ${property.name}, id=${id}`);
}

async function processPendingAirbnbReplies(env) {
  const TEN_MINUTES = 10 * 60 * 1000;
  let list;
  try {
    list = await env.BOOKINGS.list({ prefix: 'airbnb_pending:' });
  } catch (err) {
    console.error('KV list error in processPendingAirbnbReplies:', err);
    return;
  }

  for (const key of list.keys) {
    let pending;
    try {
      pending = await env.BOOKINGS.get(key.name, { type: 'json' });
    } catch { continue; }
    if (!pending || pending.sent) continue;

    const age = Date.now() - pending.createdAt;
    if (age < TEN_MINUTES) continue;

    // 10 minutes elapsed — auto-send
    console.log(`Auto-sending reply for ${pending.guestName} at ${pending.propertyName}`);
    try {
      if (!pending.isTest) {
        if (pending.draft) {
          const sent = await sendAirbnbReply(env, pending.airbnbReplyAddress, pending.propertyName, pending.draft);
          if (!sent) {
            await sendAirbnbEscalationEmail(env, pending.guestName, pending.propertyName, pending.guestMessage, pending.draft);
          }
        } else {
          await sendAirbnbEscalationEmail(env, pending.guestName, pending.propertyName, pending.guestMessage, null);
        }
      }
    } catch (err) {
      console.error('Auto-send error:', err);
    }

    try { await env.BOOKINGS.delete(key.name); } catch {}
  }
}
