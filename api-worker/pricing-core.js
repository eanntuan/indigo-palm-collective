// Pure pricing logic for the Cloudflare Worker (no network, no env).
// Imported by api-worker/index.js (wrangler bundles it) and by tests/.
//
// Pricing modes:
//   'dynamic' (default) — PriceLabs per-night price when available, otherwise
//                         basePrice × the highest matching PEAK_DATES multiplier.
//   'flat'              — basePrice every night. No PriceLabs request, no
//                         per-date overrides, no seasonal/peak multipliers.
//                         Minimum stay is the static minNights.

export const PROPERTY_CONFIG = {
  'cozy-cactus': { basePrice: 250, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  'terra-luz':   { basePrice: 275, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  'casa-moto':   { basePrice: 275, cleaningFee: 250, taxRate: 0.12,  maxGuests: 8, minNights: 2 },
  // The Sundune (legacy slug ps-retreat): flat $300/night, $200 cleaning,
  // 18% applied once to accommodation + cleaning. 18% is the owner-configured
  // rate, not a verified statutory rate.
  'ps-retreat':  { basePrice: 300, cleaningFee: 200, taxRate: 0.18,  maxGuests: 4, minNights: 4, pricingMode: 'flat' },
  // The Well: long-term only. 28 nights is a hard floor that PriceLabs cannot lower.
  'the-well':    { basePrice: 300, cleaningFee: 200, taxRate: 0.135, maxGuests: 2, minNights: 28, strictMinNights: true },
};

export const PEAK_DATES = [
  { start: '2026-04-10', end: '2026-04-20', multiplier: 1.5, label: 'Coachella W1' },
  { start: '2026-04-17', end: '2026-04-27', multiplier: 1.5, label: 'Coachella W2' },
  { start: '2026-04-24', end: '2026-05-04', multiplier: 1.3, label: 'Stagecoach'   },
  { start: '2026-11-25', end: '2026-11-30', multiplier: 1.2, label: 'Thanksgiving' },
  { start: '2026-12-20', end: '2027-01-04', multiplier: 1.3, label: 'Holiday'      },
];

export const CARD_FEE_RATE = 0.03;

export function isFlatPricing(propertyId) {
  return PROPERTY_CONFIG[propertyId]?.pricingMode === 'flat';
}

export function roundCents(n) {
  return Math.round(n * 100) / 100;
}

// 3% card processing fee, rounded to the cent (same formula the approval
// handler has always used).
export function calcCardFee(total) {
  return Math.round(total * CARD_FEE_RATE * 100) / 100;
}

export function countNights(checkIn, checkOut) {
  const start = new Date(checkIn  + 'T00:00:00');
  const end   = new Date(checkOut + 'T00:00:00');
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// Build the per-night breakdown and totals for a stay.
// plPriceMap: { 'YYYY-MM-DD': price } from PriceLabs; ignored for flat properties.
export function buildQuote(propertyId, checkIn, checkOut, plPriceMap = null) {
  const config = PROPERTY_CONFIG[propertyId];
  if (!config) return null;

  const flat   = config.pricingMode === 'flat';
  const nights = countNights(checkIn, checkOut);
  const nightly = [];
  let subtotal = 0;
  const cur = new Date(checkIn + 'T00:00:00');

  for (let i = 0; i < nights; i++) {
    const dateStr = cur.toISOString().split('T')[0];
    let rate, peakLabel = null;

    if (flat) {
      rate = config.basePrice;
    } else if (plPriceMap && plPriceMap[dateStr] != null) {
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

  if (flat) {
    // Tax applied once to (accommodation + cleaning), rounded to the cent.
    const taxAmount = roundCents((subtotal + cleaningFee) * config.taxRate);
    const total     = roundCents(subtotal + cleaningFee + taxAmount);
    return { nights, nightly, subtotal, cleaningFee, taxRate: config.taxRate, taxAmount, total, pricingMode: 'flat' };
  }

  // Unchanged formula for dynamically priced properties.
  const taxAmount = (subtotal + cleaningFee) * config.taxRate;
  const total     = subtotal + cleaningFee + taxAmount;
  return { nights, nightly, subtotal, cleaningFee, taxRate: config.taxRate, taxAmount, total };
}
