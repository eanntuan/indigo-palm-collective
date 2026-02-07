// Import YoY Gross monthly data from screenshot
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.GOOGLE_API_KEY,
  authDomain: "indigo-palm-collective.firebaseapp.com",
  projectId: "indigo-palm-collective",
  storageBucket: "indigo-palm-collective.firebasestorage.app",
  messagingSenderId: "908153205708",
  appId: "1:908153205708:web:a02fc89fb3f361e7c4e369"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Accurate monthly data from YoY gross screenshot
const monthlyData = {
  2022: {
    0: 0,    // January
    1: 0,    // February
    2: 0,    // March
    3: 0,    // April
    4: 0,    // May
    5: 0,    // June
    6: 0,    // July
    7: 2867.98,  // August
    8: 1988.16,  // September
    9: 1785.41,  // October
    10: 4811.72, // November
    11: 4225.91  // December
  },
  2023: {
    0: 6091.05,   // January
    1: 6310.14,   // February
    2: 10310.81,  // March
    3: 21534.77,  // April
    4: 3032.40,   // May
    5: 2876.02,   // June
    6: 1590.43,   // July
    7: 950.60,    // August
    8: 1812.07,   // September
    9: 6135.11,   // October
    10: 4691.71,  // November
    11: 4349.42   // December
  },
  2024: {
    0: 3433.46,   // January
    1: 8156.89,   // February
    2: 6311.29,   // March
    3: 19840.52,  // April
    4: 1778.35,   // May
    5: 1795.43,   // June
    6: 1597.94,   // July
    7: 1242.53,   // August
    8: 1053.99,   // September
    9: 1690.88,   // October
    10: 5212.78,  // November
    11: 6340.96   // December
  },
  2025: {
    0: 4481.80,   // January
    1: 6538.93,   // February
    2: 7504.21,   // March
    3: 17413.07,  // April
    4: 1755.61,   // May
    5: 558.89,    // June
    6: 1873.20,   // July
    7: 1547.73,   // August
    8: 2401.04,   // September
    9: 1585.91,   // October
    10: 2432.13,  // November
    11: 4314.41   // December
  }
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];

async function importYoYGrossData() {
  console.log('🔧 Importing YoY Gross Monthly Data');
  console.log('===================================\n');

  try {
    // Step 1: Delete all existing Airbnb revenue records (keeping Direct bookings)
    console.log('🗑️  Deleting all existing Airbnb revenue records...');
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const toDelete = [];

    revenueSnap.forEach(docSnap => {
      const data = docSnap.data();
      const source = data.source || 'Unknown';

      if (source === 'Airbnb') {
        toDelete.push(docSnap.id);
      }
    });

    console.log(`   Found ${toDelete.length} Airbnb records to delete\n`);

    for (const id of toDelete) {
      await deleteDoc(doc(db, 'revenue', id));
    }

    console.log(`✅ Deleted ${toDelete.length} old Airbnb records\n`);

    // Step 2: Import accurate YoY gross data
    console.log('📥 Importing YoY gross data...\n');

    let totalRecords = 0;
    const yearTotals = {};

    for (const [year, months] of Object.entries(monthlyData)) {
      console.log(`Importing ${year}...`);
      yearTotals[year] = 0;

      for (let month = 0; month < 12; month++) {
        const amount = months[month];

        if (amount > 0) {
          await addDoc(collection(db, 'revenue'), {
            date: new Date(parseInt(year), month, 15),
            amount: amount,
            grossAmount: amount,
            netIncome: amount,
            serviceFees: 0, // Gross data
            source: 'Airbnb',
            propertyId: 'cochran',
            description: `Airbnb revenue - ${monthNames[month]} ${year}`,
            monthlyAggregate: true,
            importDate: new Date()
          });

          yearTotals[year] += amount;
          totalRecords++;
        }
      }

      console.log(`   ${year}: $${yearTotals[year].toFixed(2)}`);
    }

    console.log(`\n✅ Successfully imported ${totalRecords} monthly records!\n`);

    console.log('📊 Year Totals (Airbnb only):');
    console.log(`   2022: $${yearTotals['2022'].toFixed(2)} (partial year, Aug-Dec)`);
    console.log(`   2023: $${yearTotals['2023'].toFixed(2)}`);
    console.log(`   2024: $${yearTotals['2024'].toFixed(2)}`);
    console.log(`   2025: $${yearTotals['2025'].toFixed(2)}`);

    console.log('\n💡 Direct bookings preserved separately.');
    console.log('   Refresh your dashboard to see accurate monthly data! 🌵✨\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importYoYGrossData();
