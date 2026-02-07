// Fix 2025 Revenue - Remove all and re-import from accurate PDF data
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

// Accurate 2025 data from PDF
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

async function fix2025Revenue() {
  console.log('🔧 Fixing 2025 Revenue Data');
  console.log('==========================\n');

  try {
    // Step 1: Delete all 2025 Airbnb records
    console.log('🗑️  Deleting all existing 2025 Airbnb records...');
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const toDelete = [];

    revenueSnap.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.date && data.date.toDate ? data.date.toDate() : data.date;
      const year = date.getFullYear();
      const source = data.source || 'Unknown';

      if (year === 2025 && source === 'Airbnb') {
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

    console.log(`✅ Deleted ${toDelete.length} old 2025 Airbnb records\n`);

    // Step 2: Import accurate 2025 data from PDF
    console.log('📥 Importing accurate 2025 data from PDF...\n');

    const revenueRecords = monthlyRevenue2025.map(month => ({
      date: new Date(2025, month.month, 15),
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

    const totalNet = revenueRecords.reduce((sum, r) => sum + r.netIncome, 0);

    console.log('📊 2025 Revenue from PDF:');
    console.log(`   Gross: $51,978.77`);
    console.log(`   Net: $${totalNet.toFixed(2)}`);
    console.log(`   Months: 12\n`);

    let uploadCount = 0;
    for (const record of revenueRecords) {
      await addDoc(collection(db, 'revenue'), record);
      uploadCount++;
      process.stdout.write(`\r   📊 Uploading: ${uploadCount}/12 months`);
    }

    console.log('\n\n✅ Successfully imported accurate 2025 data!');
    console.log(`\n🎉 2025 Fixed!`);
    console.log(`   Airbnb: $${totalNet.toFixed(2)}`);
    console.log(`   Direct: $14,300`);
    console.log(`   Total: $${(totalNet + 14300).toFixed(2)}`);
    console.log(`\n💡 Refresh your dashboard! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fix2025Revenue();
