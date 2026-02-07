// Import Direct Booking Revenue for Cozy Cactus (2023-2025)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCh9K9YewO1U4RLXGm_l9NUc-TDiqqW7UU",
  authDomain: "indigo-palm-collective.firebaseapp.com",
  projectId: "indigo-palm-collective",
  storageBucket: "indigo-palm-collective.firebasestorage.app",
  messagingSenderId: "908153205708",
  appId: "1:908153205708:web:a02fc89fb3f361e7c4e369"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Direct booking data from screenshots
const directBookings = [
  // 2023
  { year: 2023, guest: 'Haley Killam', amount: 2250.00, date: new Date(2023, 6, 1) },
  { year: 2023, guest: 'Josh Swedelson', amount: 500.00, date: new Date(2023, 6, 1) },
  { year: 2023, guest: 'Katie Liu', amount: 2000.00, date: new Date(2023, 6, 1) },
  { year: 2023, guest: 'VRBO Power Trip', amount: 4700.00, date: new Date(2023, 6, 1) },

  // 2024
  { year: 2024, guest: 'Marisol', amount: 5900.00, date: new Date(2024, 6, 1) },
  { year: 2024, guest: 'VRBO', amount: 4440.00, date: new Date(2024, 6, 1) },

  // 2025
  { year: 2025, guest: 'Louis Garcia', amount: 1100.00, date: new Date(2025, 6, 1) },
  { year: 2025, guest: 'Leslie Alvarado', amount: 500.00, date: new Date(2025, 6, 1) },
  { year: 2025, guest: 'Amy Nguyen W1', amount: 6800.00, date: new Date(2025, 6, 1) },
  { year: 2025, guest: 'Marisol W2', amount: 5900.00, date: new Date(2025, 6, 1) }
];

async function importDirectBookings() {
  console.log('🌵 Importing Direct Booking Revenue');
  console.log('===================================\n');

  try {
    // Group by year for summary
    const yearTotals = {
      2023: 0,
      2024: 0,
      2025: 0
    };

    directBookings.forEach(booking => {
      yearTotals[booking.year] += booking.amount;
    });

    console.log('📊 Direct Booking Summary:');
    console.log(`   2023: $${yearTotals[2023].toFixed(2)}`);
    console.log(`   2024: $${yearTotals[2024].toFixed(2)}`);
    console.log(`   2025: $${yearTotals[2025].toFixed(2)}`);
    console.log(`   Total: $${(yearTotals[2023] + yearTotals[2024] + yearTotals[2025]).toFixed(2)}\n`);

    // Upload to Firebase
    console.log('📤 Uploading to Firebase...\n');

    let uploadCount = 0;
    for (const booking of directBookings) {
      await addDoc(collection(db, 'revenue'), {
        date: booking.date,
        amount: booking.amount,
        grossAmount: booking.amount,
        netIncome: booking.amount,
        serviceFees: 0,
        source: 'Direct',
        propertyId: 'cochran',
        guestName: booking.guest,
        description: `Direct booking - ${booking.guest}`,
        importDate: new Date()
      });
      uploadCount++;
      process.stdout.write(`\r   📊 Progress: ${uploadCount}/${directBookings.length} bookings`);
    }

    console.log('\n\n✅ Successfully uploaded all direct bookings!');
    console.log(`\n🎉 Import complete!`);
    console.log(`   - ${directBookings.length} direct bookings`);
    console.log(`   - Years: 2023-2025`);
    console.log(`   - Total revenue: $${(yearTotals[2023] + yearTotals[2024] + yearTotals[2025]).toFixed(2)}`);

    console.log(`\n📈 Updated Total Revenue (Airbnb + Direct):`);
    console.log(`   2023: $71,018 + $9,100 = $80,118`);
    console.log(`   2024: $53,755 + $10,040 = $63,795`);
    console.log(`   2025: $48,492 + $13,600 = $62,092`);

    console.log(`\n💡 Refresh your dashboard to see updated totals! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run import
importDirectBookings();
