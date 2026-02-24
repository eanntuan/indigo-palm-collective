// Netlify Function to fetch availability from iCal feeds
// Avoids CORS issues and keeps URLs private

const ical = require('node-ical');

// Property iCal URLs (replace with your actual URLs)
const PROPERTY_ICALS = {
  'cozy-cactus': process.env.COZY_CACTUS_ICAL_URL || 'https://calendar.google.com/calendar/ical/hostaway_123646.ics',
  'casa-moto': process.env.CASA_MOTO_ICAL_URL || 'https://calendar.google.com/calendar/ical/hostaway_123633.ics',
  'ps-retreat': process.env.PS_RETREAT_ICAL_URL || 'https://api.hospitable.com/v1/properties/reservations.ics?key=1470484&token=d9035907-ba8e-4705-adf7-24e5ae53afe1',
  'the-well': process.env.THE_WELL_ICAL_URL || 'https://www.airbnb.com/calendar/ical/868862893900280104.ics?t=d0aa2a8c829445d695c19e79c80aa1f1'
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { propertyId } = event.queryStringParameters;

    if (!propertyId || !PROPERTY_ICALS[propertyId]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid property ID' })
      };
    }

    // Fetch and parse iCal
    const icalUrl = PROPERTY_ICALS[propertyId];
    const events = await ical.async.fromURL(icalUrl);

    // Extract blocked dates
    const blockedDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let event of Object.values(events)) {
      if (event.type === 'VEVENT') {
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Only include future bookings
        if (end >= today) {
          // Generate array of all dates in this booking
          const currentDate = new Date(start);
          while (currentDate < end) {
            blockedDates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        propertyId,
        blockedDates: [...new Set(blockedDates)], // Remove duplicates
        lastUpdated: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error fetching availability:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch availability',
        message: error.message
      })
    };
  }
};
