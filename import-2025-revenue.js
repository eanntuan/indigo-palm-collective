// Import 2025 Cozy Cactus Airbnb Revenue from PDF earnings report
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Firebase config
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

// 2025 monthly revenue data from Airbnb earnings report
const monthlyRevenue2025 = [
  { month: 0, name: 'January', grossEarnings: 4440.00, netIncome: 4156.80 },
  { month: 1, name: 'February', grossEarnings: 7282.40, netIncome: 7063.93 },
  { month: 2, name: 'March', grossEarnings: 9293.00, netIncome: 8204.21 },
  { month: 3, name: 'April', grossEarnings: 6131.00, netIncome: 5413.07 },
  { month: 4, name: 'May', grossEarnings: 1913.00, netIncome: 1855.61 },
  { month: 5, name: 'June', grossEarnings: 937.00, netIncome: 908.89 },
  { month: 6, name: 'July', grossEarnings: 2833.20, netIncome: 2748.20 },
  { month: 7, name: 'August', grossEarnings: 2709.00, netIncome: 2627.73 },
  { month: 8, name: 'September', grossEarnings: 3532.00, netIncome: 3426.04 },
  { month: 9, name: 'October', grossEarnings: 1737.57, netIncome: 1685.91 },
  { month: 10, name: 'November', grossEarnings: 5477.00, netIncome: 5212.56 },
  { month: 11, name: 'December', grossEarnings: 5693.60, netIncome: 5189.41 }
];

async function import2025Revenue() {
  console.log('🌵 Importing 2025 Cozy Cactus Airbnb Revenue');
  console.log('============================================\n');

  try {
    // Check for existing 2025 revenue for Cozy Cactus
    console.log('🔍 Checking for existing 2025 Cozy Cactus revenue...');
    const revenueRef = collection(db, 'revenue');
    const cochranQuery = query(
      revenueRef,
      where('propertyId', '==', 'cochran')
    );

    const existingRevenue = await getDocs(cochranQuery);

    const revenue2025 = [];
    existingRevenue.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.toDate) {
        const year = data.date.toDate().getFullYear();
        if (year === 2025) revenue2025.push(data);
      }
    });

    console.log(`   Found ${revenue2025.length} existing 2025 Cozy Cactus revenue records`);

    if (revenue2025.length > 0) {
      console.log('   ⚠️  Some 2025 revenue already exists. This will add monthly summary records.\n');
    }

    // Create monthly revenue records
    console.log('📅 Creating 2025 monthly revenue records...\n');

    const revenueRecords = monthlyRevenue2025.map(month => ({
      date: new Date(2025, month.month, 15), // Mid-month date
      amount: month.netIncome,
      grossAmount: month.grossEarnings,
      netIncome: month.netIncome,
      serviceFees: month.grossEarnings - month.netIncome,
      source: 'Airbnb',
      propertyId: 'cochran',
      description: `Airbnb revenue - ${month.name} 2025`,
      monthlyAggregate: true,
      importDate: new Date()
    }));

    // Calculate totals
    const totalGross = revenueRecords.reduce((sum, r) => sum + r.grossAmount, 0);
    const totalNet = revenueRecords.reduce((sum, r) => sum + r.netIncome, 0);
    const totalFees = revenueRecords.reduce((sum, r) => sum + r.serviceFees, 0);

    console.log('📊 Revenue Summary:');
    console.log(`   Gross earnings: $${totalGross.toFixed(2)}`);
    console.log(`   Service fees: -$${totalFees.toFixed(2)}`);
    console.log(`   Net income: $${totalNet.toFixed(2)}`);
    console.log(`   Months: ${revenueRecords.length}`);
    console.log('');

    console.log('📊 Monthly breakdown:');
    monthlyRevenue2025.forEach(month => {
      console.log(`   ${month.name.padEnd(10)}: $${month.netIncome.toFixed(2).padStart(10)} (gross: $${month.grossEarnings.toFixed(2)})`);
    });
    console.log('');

    // Upload to Firebase
    console.log('📤 Uploading to Firebase...\n');

    let uploadCount = 0;
    for (const record of revenueRecords) {
      await addDoc(collection(db, 'revenue'), record);
      uploadCount++;
      process.stdout.write(`\r   📊 Progress: ${uploadCount}/${revenueRecords.length} months`);
    }

    console.log('\n\n✅ Successfully uploaded all 2025 revenue records!');
    console.log(`\n🎉 Import complete!`);
    console.log(`   - Property: Cozy Cactus (Cochran)`);
    console.log(`   - Year: 2025`);
    console.log(`   - Total net income: $${totalNet.toFixed(2)}`);
    console.log(`   - 171 nights booked`);
    console.log(`   - 3.8 average night stay`);
    console.log(`\n💡 Refresh your dashboard to see complete 2025 data! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run import
import2025Revenue();
