// Fix 2023 Revenue - Remove all and re-import from accurate PDF data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

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

// Accurate 2023 data from PDF
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

async function fix2023Revenue() {
  console.log('🔧 Fixing 2023 Revenue Data');
  console.log('==========================\n');

  try {
    // Step 1: Delete all 2023 Airbnb records
    console.log('🗑️  Deleting all existing 2023 Airbnb records...');
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const toDelete = [];

    revenueSnap.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.date && data.date.toDate ? data.date.toDate() : data.date;
      const year = date.getFullYear();
      const source = data.source || 'Unknown';

      if (year === 2023 && source === 'Airbnb') {
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

    console.log(`✅ Deleted ${toDelete.length} old 2023 Airbnb records\n`);

    // Step 2: Import accurate 2023 data from PDF
    console.log('📥 Importing accurate 2023 data from PDF...\n');

    const revenueRecords = monthlyRevenue2023.map(month => ({
      date: new Date(2023, month.month, 15),
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

    const totalNet = revenueRecords.reduce((sum, r) => sum + r.netIncome, 0);

    console.log('📊 2023 Revenue from PDF:');
    console.log(`   Gross: $73,336.77`);
    console.log(`   Net: $${totalNet.toFixed(2)}`);
    console.log(`   Months: 12\n`);

    let uploadCount = 0;
    for (const record of revenueRecords) {
      await addDoc(collection(db, 'revenue'), record);
      uploadCount++;
      process.stdout.write(`\r   📊 Uploading: ${uploadCount}/12 months`);
    }

    console.log('\n\n✅ Successfully imported accurate 2023 data!');
    console.log(`\n🎉 2023 Fixed!`);
    console.log(`   Airbnb: $${totalNet.toFixed(2)}`);
    console.log(`   Direct: $9,450`);
    console.log(`   Total: $${(totalNet + 9450).toFixed(2)}`);
    console.log(`\n💡 Refresh your dashboard! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fix2023Revenue();
