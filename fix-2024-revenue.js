// Fix 2024 Revenue - Remove all and re-import from accurate PDF data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

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

// Accurate 2024 data from PDF
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

async function fix2024Revenue() {
  console.log('🔧 Fixing 2024 Revenue Data');
  console.log('==========================\n');

  try {
    // Step 1: Delete all 2024 Airbnb records
    console.log('🗑️  Deleting all existing 2024 Airbnb records...');
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const toDelete = [];

    revenueSnap.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.date && data.date.toDate ? data.date.toDate() : data.date;
      const year = date.getFullYear();
      const source = data.source || 'Unknown';

      if (year === 2024 && source === 'Airbnb') {
        toDelete.push({
          id: docSnap.id,
          date: date,
          amount: data.amount || data.netIncome || 0
        });
      }
    });

    console.log(`   Found ${toDelete.length} records to delete\n`);

    for (const record of toDelete) {
      await deleteDoc(doc(db, 'revenue', record.id));
    }

    console.log(`✅ Deleted ${toDelete.length} old 2024 Airbnb records\n`);

    // Step 2: Import accurate 2024 data from PDF
    console.log('📥 Importing accurate 2024 data from PDF...\n');

    const revenueRecords = monthlyRevenue2024.map(month => ({
      date: new Date(2024, month.month, 15),
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

    const totalNet = revenueRecords.reduce((sum, r) => sum + r.netIncome, 0);

    console.log('📊 2024 Revenue from PDF:');
    console.log(`   Gross: $55,375.10`);
    console.log(`   Net: $${totalNet.toFixed(2)}`);
    console.log(`   Months: 12\n`);

    let uploadCount = 0;
    for (const record of revenueRecords) {
      await addDoc(collection(db, 'revenue'), record);
      uploadCount++;
      process.stdout.write(`\r   📊 Uploading: ${uploadCount}/12 months`);
    }

    console.log('\n\n✅ Successfully imported accurate 2024 data!');
    console.log(`\n🎉 2024 Fixed!`);
    console.log(`   Airbnb: $${totalNet.toFixed(2)}`);
    console.log(`   Direct: $10,340`);
    console.log(`   Total: $${(totalNet + 10340).toFixed(2)}`);
    console.log(`\n💡 Refresh your dashboard! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fix2024Revenue();
