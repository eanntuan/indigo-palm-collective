// Airbnb Data Parser
// Parses Airbnb data export JSON files into structured data for Firebase

/**
 * Parse Airbnb payment_processing.json to extract payout data
 * @param {Array} jsonData - Array from payment_processing.json
 * @returns {Array} - Parsed revenue records
 */
export function parseAirbnbPayments(jsonData) {
  const payments = [];

  if (!Array.isArray(jsonData)) {
    console.error('payment_processing.json should be an array');
    return payments;
  }

  jsonData.forEach(record => {
    if (record.transactionDetails && Array.isArray(record.transactionDetails)) {
      record.transactionDetails.forEach(transaction => {
        // Only process USD transactions with valid amounts
        if (transaction.amountMicros && transaction.currency === 'USD') {
          const amount = transaction.amountMicros / 1000000; // Convert micros to dollars

          // Parse date from effectiveEntryDate (YYMMDD format like "220808")
          let date = new Date();
          if (transaction.additionalAttributes?.effectiveEntryDate) {
            date = parseAirbnbDate(transaction.additionalAttributes.effectiveEntryDate);
          }

          // Only add positive amounts (payouts to host)
          if (amount > 0) {
            payments.push({
              date: date,
              amount: amount,
              confirmationCode: transaction.additionalAttributes?.companyEntryDescription || '',
              source: 'Airbnb',
              grossAmount: amount,
              netIncome: amount,
              description: `Airbnb payout - ${transaction.additionalAttributes?.companyEntryDescription || 'N/A'}`
            });
          }
        }
      });
    }
  });

  console.log(`Parsed ${payments.length} Airbnb payments`);
  return payments;
}

/**
 * Parse Airbnb date format (YYMMDD) to JavaScript Date
 * @param {string} dateStr - Date string like "220808" (Aug 8, 2022)
 * @returns {Date}
 */
function parseAirbnbDate(dateStr) {
  if (!dateStr || dateStr.length !== 6) {
    return new Date();
  }

  const year = parseInt('20' + dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4)) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(4, 6));

  return new Date(year, month, day);
}

/**
 * Parse reservations.json to extract guest information
 * @param {Array} jsonData - Array with bookingSessions
 * @returns {Array} - Parsed guest records
 */
export function parseAirbnbGuests(jsonData) {
  const guests = new Map(); // Use Map to dedupe by email

  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return [];
  }

  // The data structure is: array with one object containing bookingSessions array
  const bookingSessions = jsonData[0]?.bookingSessions || [];

  bookingSessions.forEach(session => {
    if (session.homeInquiries && Array.isArray(session.homeInquiries)) {
      session.homeInquiries.forEach(inquiry => {
        // Extract guest profile URL to use as identifier
        const guestUrl = inquiry.userProfileUrl || session.primaryGuestProfileUrl;

        if (guestUrl) {
          const guestId = guestUrl.split('/').pop(); // Get ID from URL

          if (!guests.has(guestId)) {
            guests.set(guestId, {
              guestId: guestId,
              profileUrl: guestUrl,
              checkInDate: inquiry.startDate || null,
              checkOutDate: inquiry.endDate || null,
              numberOfGuests: inquiry.numberOfGuests || 0,
              numberOfAdults: inquiry.numberOfAdults || 0,
              numberOfChildren: inquiry.numberOfChildren || 0,
              numberOfPets: inquiry.numberOfPets || 0,
              listingUrl: inquiry.hostingUrl || '',
              status: inquiry.homeInquiryStatus || 'UNKNOWN'
            });
          }
        }
      });
    }
  });

  console.log(`Parsed ${guests.size} unique guests`);
  return Array.from(guests.values());
}

/**
 * Parse listings.json to extract property information
 * @param {Array} jsonData - Array with listings
 * @returns {Array} - Parsed property records
 */
export function parseAirbnbListings(jsonData) {
  const properties = [];

  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return properties;
  }

  const listings = jsonData[0]?.listings || [];

  listings.forEach(listing => {
    properties.push({
      listingId: listing.id || '',
      name: listing.name || 'Unnamed Property',
      city: listing.city || '',
      state: listing.state || '',
      country: listing.country || '',
      bedrooms: listing.bedrooms || 0,
      bathrooms: listing.bathrooms || 0,
      propertyType: listing.property_type || '',
      roomType: listing.room_type || '',
      accommodates: listing.accommodates || 0,
      amenities: listing.amenities || []
    });
  });

  console.log(`Parsed ${properties.length} listings`);
  return properties;
}

/**
 * Map listing URL to property ID
 * @param {string} listingUrl - Airbnb listing URL
 * @returns {string} - Property ID (cochran, casa-moto, ps-retreat, the-well)
 */
export function mapListingToProperty(listingUrl) {
  if (!listingUrl) return 'unknown';

  // Extract listing ID from URL
  const listingId = listingUrl.split('/').pop();

  // Map known listing IDs to properties
  // TODO: Update these with actual listing IDs
  const listingMap = {
    '610023395582313286': 'cochran', // Cozy Cactus
    '862396322984158928': 'the-well', // The Well
    '123633': 'casa-moto', // Casa Moto (from earlier context)
    '123646': 'cochran' // Also Cozy Cactus
  };

  return listingMap[listingId] || 'unknown';
}

/**
 * Aggregate payments by property and month
 * @param {Array} payments - Parsed payment records
 * @returns {Object} - Aggregated data by property and month
 */
export function aggregatePaymentsByPropertyMonth(payments) {
  const aggregated = {};

  payments.forEach(payment => {
    const year = payment.date.getFullYear();
    const month = payment.date.getMonth();
    const key = `${year}-${month}`;

    if (!aggregated[key]) {
      aggregated[key] = {
        year,
        month,
        monthName: payment.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalRevenue: 0,
        count: 0,
        payments: []
      };
    }

    aggregated[key].totalRevenue += payment.amount;
    aggregated[key].count++;
    aggregated[key].payments.push(payment);
  });

  return aggregated;
}
