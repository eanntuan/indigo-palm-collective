// Import 2024 Cozy Cactus Airbnb Revenue from PDF earnings report
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.GOOGLE_API_KEY,
  authDomain: "the-desert-edit.firebaseapp.com",
  projectId: "the-desert-edit",
  storageBucket: "the-desert-edit.appspot.com",
  messagingSenderId: "908153205708",
  appId: "1:908153205708:web:a02fc89fb3f361e7c4e369"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2024 monthly revenue data from Airbnb earnings report
const monthlyRevenue2024 = [
  { month: 0, name: 'January', grossEarnings: 2418.30, netIncome: 2345.75 },
  { month: 1, name: 'February', grossEarnings: 7855.80, netIncome: 7621.63 },
  { month: 2, name: 'March', grossEarnings: 4695.00, netIncome: 4554.15 },
  { month: 3, name: 'April', grossEarnings: 15266.00, netIncome: 14815.52 },
  { month: 4, name: 'May', grossEarnings: 2555.00, netIncome: 2478.35 },
  { month: 5, name: 'June', grossEarnings: 2392.20, netIncome: 2320.43 },
  { month: 6, name: 'July', grossEarnings: 2188.60, netIncome: 2122.94 },
  { month: 7, name: 'August', grossEarnings: 1822.20, netIncome: 1767.53 },
  { month: 8, name: 'September', grossEarnings: 1392.00, netIncome: 1353.99 },
  { month: 9, name: 'October', grossEarnings: 2184.00, netIncome: 2120.88 },
  { month: 10, name: 'November', grossEarnings: 5374.00, netIncome: 5212.78 },
  { month: 11, name: 'December', grossEarnings: 7232.00, netIncome: 7040.96 }
];

async function import2024Revenue() {
  console.log('🌵 Importing 2024 Cozy Cactus Airbnb Revenue');
  console.log('============================================\n');

  try {
    // Create monthly revenue records
    console.log('📅 Creating 2024 monthly revenue records...\n');

    const revenueRecords = monthlyRevenue2024.map(month => ({
      date: new Date(2024, month.month, 15), // Mid-month date
      amount: month.netIncome,
      grossAmount: month.grossEarnings,
      netIncome: month.netIncome,
      serviceFees: month.grossEarnings - month.netIncome,
      source: 'Airbnb',
      propertyId: 'cochran',
      description: `Airbnb revenue - ${month.name} 2024`,
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
    monthlyRevenue2024.forEach(month => {
      console.log(`   ${month.name.padEnd(10)}: $${month.netIncome.toFixed(2).padStart(10)} (gross: $${month.grossEarnings.toFixed(2)})`);
    });
    console.log('');

    // Find best and worst months
    const bestMonth = monthlyRevenue2024.reduce((max, month) =>
      month.netIncome > max.netIncome ? month : max
    );
    const worstMonth = monthlyRevenue2024.reduce((min, month) =>
      month.netIncome < min.netIncome ? month : min
    );

    console.log('🏆 Performance highlights:');
    console.log(`   Best month: ${bestMonth.name} ($${bestMonth.netIncome.toFixed(2)})`);
    console.log(`   Slowest month: ${worstMonth.name} ($${worstMonth.netIncome.toFixed(2)})`);
    console.log('');

    // Upload to Firebase
    console.log('📤 Uploading to Firebase...\n');

    let uploadCount = 0;
    for (const record of revenueRecords) {
      await addDoc(collection(db, 'revenue'), record);
      uploadCount++;
      process.stdout.write(`\r   📊 Progress: ${uploadCount}/${revenueRecords.length} months`);
    }

    console.log('\n\n✅ Successfully uploaded all 2024 revenue records!');
    console.log(`\n🎉 Import complete!`);
    console.log(`   - Property: Cozy Cactus (Cochran)`);
    console.log(`   - Year: 2024`);
    console.log(`   - Total net income: $${totalNet.toFixed(2)}`);
    console.log(`\n💡 Your dashboard now has both 2024 AND 2025 data! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run import
import2024Revenue();
