// Import 2023 Cozy Cactus Airbnb Revenue from PDF earnings report
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

// 2023 monthly revenue data from Airbnb earnings report
const monthlyRevenue2023 = [
  { month: 0, name: 'January', grossEarnings: 7892.18, netIncome: 7656.05 },
  { month: 1, name: 'February', grossEarnings: 8144.48, netIncome: 7750.14 },
  { month: 2, name: 'March', grossEarnings: 12000.84, netIncome: 11640.81 },
  { month: 3, name: 'April', grossEarnings: 16489.92, netIncome: 15995.22 },
  { month: 4, name: 'May', grossEarnings: 4101.30, netIncome: 3982.40 },
  { month: 5, name: 'June', grossEarnings: 3746.00, netIncome: 3636.02 },
  { month: 6, name: 'July', grossEarnings: 2619.00, netIncome: 2540.43 },
  { month: 7, name: 'August', grossEarnings: 1565.00, netIncome: 1520.60 },
  { month: 8, name: 'September', grossEarnings: 3386.05, netIncome: 3306.07 },
  { month: 9, name: 'October', grossEarnings: 2263.00, netIncome: 2195.11 },
  { month: 10, name: 'November', grossEarnings: 6043.00, netIncome: 5861.71 },
  { month: 11, name: 'December', grossEarnings: 5086.00, netIncome: 4933.42 }
];

async function import2023Revenue() {
  console.log('🌵 Importing 2023 Cozy Cactus Airbnb Revenue');
  console.log('============================================\n');

  try {
    // Create monthly revenue records
    console.log('📅 Creating 2023 monthly revenue records...\n');

    const revenueRecords = monthlyRevenue2023.map(month => ({
      date: new Date(2023, month.month, 15), // Mid-month date
      amount: month.netIncome,
      grossAmount: month.grossEarnings,
      netIncome: month.netIncome,
      serviceFees: month.grossEarnings - month.netIncome,
      source: 'Airbnb',
      propertyId: 'cochran',
      description: `Airbnb revenue - ${month.name} 2023`,
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
    console.log(`   Net income: $${totalNet.toFixed(2)} 🏆 BEST YEAR!`);
    console.log(`   Months: ${revenueRecords.length}`);
    console.log('');

    console.log('📊 Monthly breakdown:');
    monthlyRevenue2023.forEach(month => {
      console.log(`   ${month.name.padEnd(10)}: $${month.netIncome.toFixed(2).padStart(10)} (gross: $${month.grossEarnings.toFixed(2)})`);
    });
    console.log('');

    // Find best and worst months
    const bestMonth = monthlyRevenue2023.reduce((max, month) =>
      month.netIncome > max.netIncome ? month : max
    );
    const worstMonth = monthlyRevenue2023.reduce((min, month) =>
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

    console.log('\n\n✅ Successfully uploaded all 2023 revenue records!');
    console.log(`\n🎉 Import complete!`);
    console.log(`   - Property: Cozy Cactus (Cochran)`);
    console.log(`   - Year: 2023`);
    console.log(`   - Total net income: $${totalNet.toFixed(2)}`);
    console.log(`\n💡 Your dashboard now has 2023, 2024, AND 2025 data! 🌵✨`);
    console.log('\n📈 Year-over-year comparison:');
    console.log(`   2023: $71,018 🏆`);
    console.log(`   2024: $53,755`);
    console.log(`   2025: $48,492`);
    console.log(`\n   Note: Revenue declined 24% from 2023 to 2024, then another 10% to 2025\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run import
import2023Revenue();
