// Booking Configuration
// Property pricing and details

export const PROPERTIES = {
  'cozy-cactus': {
    id: 'cozy-cactus',
    name: 'The Cozy Cactus',
    location: 'Indio, CA',
    bedrooms: 3,
    maxGuests: 8,
    basePrice: 250, // per night
    cleaningFee: 150,
    taxRate: 0.12, // 12% (adjust based on actual Indio tax rate)
    hostawayListingId: 123646,
    availabilitySource: 'hostaway'
  },
  'casa-moto': {
    id: 'casa-moto',
    name: 'Casa Moto',
    location: 'Palm Desert, CA',
    bedrooms: 3,
    maxGuests: 6,
    basePrice: 225, // per night
    cleaningFee: 150,
    taxRate: 0.12,
    hostawayListingId: 123633,
    availabilitySource: 'hostaway'
  },
  'ps-retreat': {
    id: 'ps-retreat',
    name: 'PS Retreat',
    location: 'Palm Springs, CA',
    bedrooms: 2,
    maxGuests: 4,
    basePrice: 180, // per night
    cleaningFee: 125,
    taxRate: 0.135, // Palm Springs is 13.5%
    icalUrl: 'https://api.hospitable.com/v1/properties/reservations.ics?key=1470484&token=d9035907-ba8e-4705-adf7-24e5ae53afe1&noCache',
    availabilitySource: 'ical'
  },
  'the-well': {
    id: 'the-well',
    name: 'The Well',
    location: 'Palm Springs, CA',
    bedrooms: 4,
    maxGuests: 8,
    basePrice: 300, // per night
    cleaningFee: 200,
    taxRate: 0.135,
    icalUrl: 'https://www.airbnb.com/calendar/ical/868862893900280104.ics?t=d0aa2a8c829445d695c19e79c80aa1f1',
    availabilitySource: 'ical'
  }
};

// Calculate total price for a booking
export function calculateBookingPrice(propertyId, checkIn, checkOut, guests) {
  const property = PROPERTIES[propertyId];
  if (!property) return null;

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  if (nights < 1) return null;

  const subtotal = property.basePrice * nights;
  const cleaningFee = property.cleaningFee;
  const taxAmount = (subtotal + cleaningFee) * property.taxRate;
  const total = subtotal + cleaningFee + taxAmount;

  return {
    nights,
    basePrice: property.basePrice,
    subtotal,
    cleaningFee,
    taxRate: property.taxRate,
    taxAmount,
    total,
    breakdown: {
      nightlyRate: `$${property.basePrice} × ${nights} night${nights > 1 ? 's' : ''}`,
      cleaning: `$${cleaningFee}`,
      taxes: `$${taxAmount.toFixed(2)} (${(property.taxRate * 100).toFixed(1)}%)`
    }
  };
}
