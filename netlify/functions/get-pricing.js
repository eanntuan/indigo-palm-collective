// Netlify Function to fetch dynamic pricing
// Tries API first, falls back to static pricing

// Static pricing as fallback
const STATIC_PRICING = {
  'cozy-cactus': {
    name: 'Cozy Cactus',
    basePrice: 250,
    cleaningFee: 150,
    taxRate: 0.12,
    weekendRate: 275, // 10% premium on weekends
    peakSeasonRate: 300, // Coachella, holidays
    minNights: 2
  },
  'casa-moto': {
    name: 'Casa Moto',
    basePrice: 225,
    cleaningFee: 150,
    taxRate: 0.12,
    weekendRate: 250,
    peakSeasonRate: 350, // High demand during festivals
    minNights: 2
  },
  'ps-retreat': {
    name: 'PS Retreat',
    basePrice: 180,
    cleaningFee: 125,
    taxRate: 0.135, // Palm Springs has higher tax
    weekendRate: 200,
    peakSeasonRate: 250,
    minNights: 2
  },
  'the-well': {
    name: 'The Well',
    basePrice: 300,
    cleaningFee: 200,
    taxRate: 0.135,
    weekendRate: 325,
    peakSeasonRate: 400,
    minNights: 2
  }
};

// Peak season dates (Coachella, Stagecoach, holidays)
const PEAK_DATES = [
  { start: '2026-04-10', end: '2026-04-19' }, // Coachella Weekend 1 & 2
  { start: '2026-04-24', end: '2026-04-26' }, // Stagecoach
  { start: '2026-12-20', end: '2026-12-31' }, // Holidays
  { start: '2027-01-01', end: '2027-01-05' }  // New Year
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { propertyId, checkIn, checkOut } = event.queryStringParameters;

    if (!propertyId || !STATIC_PRICING[propertyId]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid property ID' })
      };
    }

    const property = STATIC_PRICING[propertyId];

    // If dates provided, calculate detailed pricing
    if (checkIn && checkOut) {
      const pricing = calculateDetailedPricing(property, checkIn, checkOut);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(pricing)
      };
    }

    // Otherwise return base pricing
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        propertyId,
        name: property.name,
        basePrice: property.basePrice,
        cleaningFee: property.cleaningFee,
        taxRate: property.taxRate,
        minNights: property.minNights
      })
    };

  } catch (error) {
    console.error('Error fetching pricing:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch pricing' })
    };
  }
};

// Calculate pricing with weekend/peak premiums
function calculateDetailedPricing(property, checkInStr, checkOutStr) {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  let totalNightlyRate = 0;
  const nightlyBreakdown = [];

  // Calculate each night
  const currentDate = new Date(checkIn);
  for (let i = 0; i < nights; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    let nightRate = property.basePrice;

    // Check if weekend (Friday or Saturday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      nightRate = property.weekendRate;
    }

    // Check if peak season
    if (isPeakDate(dateStr)) {
      nightRate = property.peakSeasonRate;
    }

    totalNightlyRate += nightRate;
    nightlyBreakdown.push({
      date: dateStr,
      rate: nightRate,
      isPeak: isPeakDate(dateStr),
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const cleaningFee = property.cleaningFee;
  const subtotal = totalNightlyRate + cleaningFee;
  const taxes = subtotal * property.taxRate;
  const total = subtotal + taxes;

  return {
    propertyId: property.name,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    nights,
    nightlyBreakdown,
    pricing: {
      totalNightlyRate,
      averageNightlyRate: Math.round(totalNightlyRate / nights),
      cleaningFee,
      subtotal,
      taxes,
      taxRate: property.taxRate,
      total
    },
    breakdown: {
      nightlyRate: `$${Math.round(totalNightlyRate / nights)} avg × ${nights} night${nights > 1 ? 's' : ''}`,
      rental: `$${totalNightlyRate.toFixed(2)}`,
      cleaning: `$${cleaningFee.toFixed(2)}`,
      taxes: `$${taxes.toFixed(2)} (${(property.taxRate * 100).toFixed(1)}%)`,
      total: `$${total.toFixed(2)}`
    }
  };
}

function isPeakDate(dateStr) {
  const date = new Date(dateStr);
  return PEAK_DATES.some(period => {
    const start = new Date(period.start);
    const end = new Date(period.end);
    return date >= start && date <= end;
  });
}
