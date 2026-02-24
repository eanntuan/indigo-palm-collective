// Fetch PriceLabs pricing from Hostaway/Hospitable APIs
// Prices are synced from PriceLabs → PMS → This function

const HOSTAWAY_API = 'https://api.hostaway.com/v1';
const HOSPITABLE_API = 'https://api.hospitable.com/v1';

// Cache pricing for 2 hours to reduce API calls
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms
let pricingCache = {};

// Property mapping
const PROPERTIES = {
  'cozy-cactus': {
    platform: 'hostaway',
    listingId: 123646,
    fallbackPrice: 250
  },
  'casa-moto': {
    platform: 'hostaway',
    listingId: 123633,
    fallbackPrice: 225
  },
  'ps-retreat': {
    platform: 'hospitable',
    propertyId: 1470484,
    fallbackPrice: 180
  },
  'the-well': {
    platform: 'manual', // No API available
    fallbackPrice: 300
  }
};

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
    const { propertyId, startDate, endDate } = event.queryStringParameters;

    if (!propertyId || !PROPERTIES[propertyId]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid property ID' })
      };
    }

    const property = PROPERTIES[propertyId];

    // Check cache
    const cacheKey = `${propertyId}_${startDate}_${endDate}`;
    if (pricingCache[cacheKey] && (Date.now() - pricingCache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log('Returning cached pricing');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...pricingCache[cacheKey].data,
          cached: true
        })
      };
    }

    // Fetch pricing based on platform
    let pricing;

    if (property.platform === 'hostaway') {
      pricing = await fetchHostawayPricing(property.listingId, startDate, endDate);
    } else if (property.platform === 'hospitable') {
      pricing = await fetchHospitablePricing(property.propertyId, startDate, endDate);
    } else {
      // Manual/fallback pricing
      pricing = generateFallbackPricing(propertyId, startDate, endDate);
    }

    // Cache the result
    pricingCache[cacheKey] = {
      timestamp: Date.now(),
      data: pricing
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(pricing)
    };

  } catch (error) {
    console.error('Error fetching pricing:', error);

    // Return fallback pricing on error
    const { propertyId, startDate, endDate } = event.queryStringParameters;
    const fallbackPricing = generateFallbackPricing(propertyId, startDate, endDate);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...fallbackPricing,
        warning: 'Using fallback pricing due to API error',
        error: error.message
      })
    };
  }
};

// Fetch from Hostaway API
async function fetchHostawayPricing(listingId, startDate, endDate) {
  const token = process.env.HOSTAWAY_API_TOKEN;

  if (!token) {
    throw new Error('Hostaway API token not configured');
  }

  const url = `${HOSTAWAY_API}/listings/${listingId}/calendar/days?arrivalStartDate=${startDate}&arrivalEndDate=${endDate}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Hostaway API error: ${response.status}`);
  }

  const data = await response.json();

  // Parse Hostaway response
  const dailyPricing = {};
  const nights = [];

  if (data.result && Array.isArray(data.result)) {
    data.result.forEach(day => {
      const date = day.date;
      dailyPricing[date] = {
        price: parseFloat(day.price) || 0,
        available: day.status === 'available',
        minStay: day.minimumStay || 1
      };

      if (day.status === 'available') {
        nights.push({
          date,
          price: parseFloat(day.price),
          isAvailable: true
        });
      }
    });
  }

  return {
    source: 'hostaway',
    dailyPricing,
    nights,
    totalNights: nights.length,
    totalPrice: nights.reduce((sum, night) => sum + night.price, 0),
    averagePrice: nights.length > 0 ? nights.reduce((sum, night) => sum + night.price, 0) / nights.length : 0
  };
}

// Fetch from Hospitable API
async function fetchHospitablePricing(propertyId, startDate, endDate) {
  const apiKey = process.env.HOSPITABLE_API_KEY;

  if (!apiKey) {
    throw new Error('Hospitable API key not configured');
  }

  const url = `${HOSPITABLE_API}/properties/${propertyId}/pricing?start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Hospitable API error: ${response.status}`);
  }

  const data = await response.json();

  // Parse Hospitable response (adjust based on actual API structure)
  const dailyPricing = {};
  const nights = [];

  // Note: Hospitable API structure may differ - adjust as needed
  if (data.pricing) {
    Object.entries(data.pricing).forEach(([date, priceData]) => {
      dailyPricing[date] = {
        price: parseFloat(priceData.price) || 0,
        available: priceData.available !== false
      };

      if (priceData.available !== false) {
        nights.push({
          date,
          price: parseFloat(priceData.price),
          isAvailable: true
        });
      }
    });
  }

  return {
    source: 'hospitable',
    dailyPricing,
    nights,
    totalNights: nights.length,
    totalPrice: nights.reduce((sum, night) => sum + night.price, 0),
    averagePrice: nights.length > 0 ? nights.reduce((sum, night) => sum + night.price, 0) / nights.length : 0
  };
}

// Generate fallback pricing (when API unavailable)
function generateFallbackPricing(propertyId, startDate, endDate) {
  const property = PROPERTIES[propertyId];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const nights = [];
  const currentDate = new Date(start);

  while (currentDate < end) {
    nights.push({
      date: currentDate.toISOString().split('T')[0],
      price: property.fallbackPrice,
      isAvailable: true,
      isFallback: true
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    source: 'fallback',
    warning: 'Using estimated pricing - actual rates may vary',
    nights,
    totalNights: nights.length,
    totalPrice: nights.length * property.fallbackPrice,
    averagePrice: property.fallbackPrice
  };
}
