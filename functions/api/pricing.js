// Cloudflare Pages Function: Dynamic Pricing
// Fetches live base price from PriceLabs and applies peak date multipliers
// GET /api/pricing?property=cozy-cactus&checkIn=2026-04-10&checkOut=2026-04-15
// Requires env var: PRICELABS_API_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// PriceLabs listing IDs (push_enabled listings get live pricing)
const PRICELABS_IDS = {
  'cozy-cactus': '123646',
  'casa-moto':   '123633',
  'ps-retreat':  '1470484',
  'the-well':    '868862893900280104',
};

// Fallback base prices if PriceLabs is unavailable
const FALLBACK_BASE = {
  'cozy-cactus': 250,
  'casa-moto':   275,
  'ps-retreat':  225,
  'the-well':    300,
};

const PROPERTY_CONFIG = {
  'cozy-cactus': {
    cleaningFee: 150,
    taxRate: 0.12,
    maxGuests: 8,
    minNights: 2,
    peakDates: [
      { start: '2026-04-10', end: '2026-04-20', multiplier: 1.5, label: 'Coachella W1' },
      { start: '2026-04-17', end: '2026-04-27', multiplier: 1.5, label: 'Coachella W2' },
      { start: '2026-04-24', end: '2026-05-04', multiplier: 1.3, label: 'Stagecoach' },
      { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
      { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday season' },
    ],
  },
  'casa-moto': {
    cleaningFee: 150,
    taxRate: 0.12,
    maxGuests: 6,
    minNights: 2,
    peakDates: [
      { start: '2026-04-10', end: '2026-04-20', multiplier: 1.5, label: 'Coachella W1' },
      { start: '2026-04-17', end: '2026-04-27', multiplier: 1.5, label: 'Coachella W2' },
      { start: '2026-04-24', end: '2026-05-04', multiplier: 1.3, label: 'Stagecoach' },
      { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
      { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday season' },
    ],
  },
  'ps-retreat': {
    cleaningFee: 150,
    taxRate: 0.135,
    maxGuests: 4,
    minNights: 2,
    peakDates: [
      { start: '2026-04-10', end: '2026-04-20', multiplier: 1.4, label: 'Coachella W1' },
      { start: '2026-04-17', end: '2026-04-27', multiplier: 1.4, label: 'Coachella W2' },
      { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
      { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday season' },
    ],
  },
  'the-well': {
    cleaningFee: 200,
    taxRate: 0.135,
    maxGuests: 8,
    minNights: 2,
    peakDates: [
      { start: '2026-04-10', end: '2026-04-20', multiplier: 1.4, label: 'Coachella W1' },
      { start: '2026-04-17', end: '2026-04-27', multiplier: 1.4, label: 'Coachella W2' },
      { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
      { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday season' },
    ],
  },
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const propertyId = url.searchParams.get('property');
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');

  if (!propertyId || !PRICELABS_IDS[propertyId] || !checkIn || !checkOut) {
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

  // Fetch live base price from PriceLabs
  let basePrice = FALLBACK_BASE[propertyId];
  try {
    const plRes = await fetch(
      `https://api.pricelabs.co/v1/listings?listing_id=${PRICELABS_IDS[propertyId]}`,
      { headers: { 'X-API-Key': env.PRICELABS_API_KEY } }
    );
    if (plRes.ok) {
      const plData = await plRes.json();
      const listing = plData.listings?.[0];
      if (listing) {
        // Use recommended_base_price if it's a number, otherwise use base
        const rec = listing.recommended_base_price;
        basePrice = (typeof rec === 'number' && rec > 0) ? rec : (listing.base || basePrice);
      }
    }
  } catch (e) {
    console.error('PriceLabs fetch failed, using fallback:', e);
  }

  // Calculate per-night pricing with peak multipliers
  const nightly = [];
  let subtotal = 0;
  const cur = new Date(start);

  for (let i = 0; i < nights; i++) {
    const dateStr = cur.toISOString().split('T')[0];
    let multiplier = 1;
    let peakLabel = null;

    for (const peak of config.peakDates) {
      if (dateStr >= peak.start && dateStr < peak.end && peak.multiplier > multiplier) {
        multiplier = peak.multiplier;
        peakLabel = peak.label;
      }
    }

    const rate = Math.round(basePrice * multiplier);
    subtotal += rate;
    nightly.push({ date: dateStr, rate, peakLabel });
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
      basePrice,
      source: 'pricelabs',
    },
  }), { status: 200, headers: CORS_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
