import 'dotenv/config';
import fetch from 'node-fetch';
import ical from 'node-ical';

const PROPERTIES = {
  'casa-moto': {
    name: 'Casa Moto (Casa Moto)',
    hostawayId: 123633,
    icalUrl: 'https://www.airbnb.com/calendar/ical/716871660845992276.ics?t=74de1981b38c40fbb8800fb4550371d6'
  },
  'cozy-cactus': {
    name: 'The Cozy Cactus',
    hostawayId: 123646,
    icalUrl: 'https://www.airbnb.com/calendar/ical/610023395582313286.ics?t=e3b2c94c1a67433bb8d523906b3e5df1'
  },
  'ps-retreat': {
    name: 'PS Retreat',
    icalUrl: 'https://www.airbnb.com/calendar/ical/1171049679026732503.ics?t=2e21a1a79aee49afaf440d1093afc318'
  },
  'the-well': {
    name: 'The Well',
    icalUrl: 'https://www.airbnb.com/calendar/ical/868862893900280104.ics?t=d0aa2a8c829445d695c19e79c80aa1f1'
  }
};

async function analyzeOccupancy() {
  console.log('📊 Analyzing Occupancy Rates for Indigo Palm Collective\n');
  console.log('='.repeat(60));

  const today = new Date();
  const next30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  const next60Days = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000));

  for (const [id, property] of Object.entries(PROPERTIES)) {
    console.log(`\n${property.name}`);
    console.log('-'.repeat(60));

    if (!property.icalUrl) {
      console.log('⚠️  No iCal URL available (Hostaway property)');
      console.log('   Need to fetch via Hostaway API or add Airbnb iCal URL');
      continue;
    }

    try {
      const response = await fetch(property.icalUrl);
      const icalData = await response.text();
      const events = ical.sync.parseICS(icalData);

      // Count booked nights in different periods
      let bookedNext30 = 0;
      let bookedNext60 = 0;
      let totalNext30 = 30;
      let totalNext60 = 60;

      // Get blocked dates
      const blockedDates = new Set();

      for (const event of Object.values(events)) {
        if (event.type !== 'VEVENT') continue;

        const start = new Date(event.start);
        const end = new Date(event.end);

        // Count nights in next 30 days
        if (start < next30Days && end > today) {
          const overlapStart = start > today ? start : today;
          const overlapEnd = end < next30Days ? end : next30Days;
          const nights = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
          bookedNext30 += nights;

          // Track each blocked date
          for (let d = new Date(overlapStart); d < overlapEnd; d.setDate(d.getDate() + 1)) {
            blockedDates.add(d.toISOString().split('T')[0]);
          }
        }

        // Count nights in next 60 days
        if (start < next60Days && end > today) {
          const overlapStart = start > today ? start : today;
          const overlapEnd = end < next60Days ? end : next60Days;
          const nights = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
          bookedNext60 += nights;
        }
      }

      const occupancy30 = ((bookedNext30 / totalNext30) * 100).toFixed(1);
      const occupancy60 = ((bookedNext60 / totalNext60) * 100).toFixed(1);
      const available30 = totalNext30 - bookedNext30;
      const available60 = totalNext60 - bookedNext60;

      console.log(`\n📅 Next 30 Days (${today.toLocaleDateString()} - ${next30Days.toLocaleDateString()})`);
      console.log(`   Occupancy: ${occupancy30}% (${bookedNext30}/${totalNext30} nights booked)`);
      console.log(`   Available: ${available30} nights`);

      console.log(`\n📅 Next 60 Days`);
      console.log(`   Occupancy: ${occupancy60}% (${bookedNext60}/${totalNext60} nights booked)`);
      console.log(`   Available: ${available60} nights`);

      // Check if vacant recently
      const past14Days = new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000));
      let recentBookings = 0;
      for (const event of Object.values(events)) {
        if (event.type !== 'VEVENT') continue;
        const end = new Date(event.end);
        if (end > past14Days && end < today) {
          recentBookings++;
        }
      }

      if (recentBookings === 0) {
        console.log(`\n⚠️  WARNING: No bookings in past 14 days!`);
      }

      // Show next upcoming booking
      let nextBooking = null;
      let nextStart = null;
      for (const event of Object.values(events)) {
        if (event.type !== 'VEVENT') continue;
        const start = new Date(event.start);
        if (start > today && (!nextStart || start < nextStart)) {
          nextStart = start;
          nextBooking = event;
        }
      }

      if (nextBooking) {
        const daysUntil = Math.ceil((nextStart - today) / (1000 * 60 * 60 * 24));
        console.log(`\n📌 Next Booking: ${nextStart.toLocaleDateString()} (${daysUntil} days away)`);
      } else {
        console.log(`\n❌ No upcoming bookings found!`);
      }

    } catch (error) {
      console.error(`\n❌ Error analyzing ${property.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Recommendations:');
  console.log('   • Properties with <50% occupancy need immediate attention');
  console.log('   • Properties vacant >14 days should consider price drops');
  console.log('   • Check if Casa Moto is showing on Airbnb/VRBO correctly');
  console.log('\n');
}

analyzeOccupancy();
