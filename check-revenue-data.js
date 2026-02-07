// Check actual revenue data in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function checkRevenueData() {
  console.log('🔍 Checking Revenue Data in Firebase');
  console.log('====================================\n');

  try {
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const allRevenue = [];

    revenueSnap.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.toDate) {
        data.date = data.date.toDate();
      }
      allRevenue.push(data);
    });

    console.log(`Total revenue records: ${allRevenue.length}\n`);

    // Group by year and source
    const yearData = {};

    allRevenue.forEach(record => {
      const year = record.date.getFullYear();
      const source = record.source || 'Unknown';
      const amount = record.amount || record.netIncome || 0;

      if (!yearData[year]) {
        yearData[year] = {
          Airbnb: 0,
          Direct: 0,
          Unknown: 0,
          count: { Airbnb: 0, Direct: 0, Unknown: 0 }
        };
      }

      yearData[year][source] += amount;
      yearData[year].count[source]++;
    });

    // Display by year
    const years = Object.keys(yearData).sort();

    console.log('📊 Revenue by Year and Source:\n');

    years.forEach(year => {
      const data = yearData[year];
      const total = data.Airbnb + data.Direct + data.Unknown;

      console.log(`${year}:`);
      console.log(`  Airbnb:  $${data.Airbnb.toFixed(2).padStart(12)} (${data.count.Airbnb} records)`);
      console.log(`  Direct:  $${data.Direct.toFixed(2).padStart(12)} (${data.count.Direct} records)`);
      if (data.Unknown > 0) {
        console.log(`  Unknown: $${data.Unknown.toFixed(2).padStart(12)} (${data.count.Unknown} records)`);
      }
      console.log(`  TOTAL:   $${total.toFixed(2).padStart(12)}`);
      console.log('');
    });

    // Check for duplicates or monthly aggregates
    console.log('📋 Checking for monthly aggregate records:\n');
    const monthlyAggregates = allRevenue.filter(r => r.monthlyAggregate === true);
    console.log(`Found ${monthlyAggregates.length} monthly aggregate records`);

    if (monthlyAggregates.length > 0) {
      console.log('\n⚠️  Monthly aggregates detected! This might cause double-counting.');
      console.log('   The original payment_processing.json has detailed transactions.');
      console.log('   The PDF imports added monthly summaries.');
      console.log('   We should remove the monthly aggregates to avoid duplication.\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRevenueData();
