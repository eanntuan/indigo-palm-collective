// Cloudflare Pages Function: Dynamic Pricing
// Fetches real per-night prices from PriceLabs Customer API
// POST /v1/listing_prices returns actual dynamic price per date
// GET /api/pricing?property=cozy-cactus&checkIn=2026-04-10&checkOut=2026-04-15
// Requires env var: PRICELABS_API_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// PriceLabs listing IDs and PMS names
const PRICELABS_LISTINGS = {
  'cozy-cactus': { id: '123646',             pms: 'hostaway'  },
  'casa-moto':   { id: '123633',             pms: 'hostaway'  },
  'ps-retreat':  { id: '1470484',            pms: 'smartbnb'  },
  'the-well':    { id: '868862893900280104', pms: 'airbnb'    },
};

// Static fallback config (used when PriceLabs sync is off or API fails)
const PROPERTY_CONFIG = {
  'cozy-cactus': { basePrice: 250, cleaningFee: 150, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  'casa-moto':   { basePrice: 275, cleaningFee: 150, taxRate: 0.12,  maxGuests: 6, minNights: 2 },
  'ps-retreat':  { basePrice: 225, cleaningFee: 150, taxRate: 0.135, maxGuests: 4, minNights: 2 },
  'the-well':    { basePrice: 300, cleaningFee: 200, taxRate: 0.135, maxGuests: 8, minNights: 2 },
};

// Fallback peak multipliers — only used when PriceLabs is unavailable
const PEAK_DATES = [
  { start: '2026-04-10', end: '2026-04-20', multiplier: 1.5, label: 'Coachella W1' },
  { start: '2026-04-17', end: '2026-04-27', multiplier: 1.5, label: 'Coachella W2' },
  { start: '2026-04-24', end: '2026-05-04', multiplier: 1.3, label: 'Stagecoach'   },
  { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
  { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday'      },
];

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const propertyId = url.searchParams.get('property');
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');

  if (!propertyId || !PRICELABS_LISTINGS[propertyId] || !checkIn || !checkOut) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required params' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const config = PROPERTY_CONFIG[propertyId];
  const start = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
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

  // Try to get real per-night prices from PriceLabs
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
        listings: [{
          id: pl.id,
          pms: pl.pms,
          dateFrom: checkIn,
          dateTo: checkOut,
        }],
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
    let rate;
    let peakLabel = null;
    let source = 'pricelabs';

    if (plPriceMap && plPriceMap[dateStr] != null) {
      rate = plPriceMap[dateStr];
    } else {
      // Fallback: base price + peak multipliers
      source = 'fallback';
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
    nightly.push({ date: dateStr, rate, peakLabel, source });
    cur.setDate(cur.getDate() + 1);
  }

  const cleaningFee = config.cleaningFee;
  const taxAmount = (subtotal + cleaningFee) * config.taxRate;
  const total = subtotal + cleaningFee + taxAmount;

  return new Response(JSON.stringify({
    success: true,
    pricing: {
      nights,
      nightly,
      subtotal,
      cleaningFee,
      taxRate: config.taxRate,
      taxAmount,
      total,
      source: plPriceMap ? 'pricelabs' : 'fallback',
    },
  }), { status: 200, headers: CORS_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
