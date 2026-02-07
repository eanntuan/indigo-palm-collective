// Check July revenue data for all years
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkJulyData() {
  console.log('🔍 Checking July Revenue Data');
  console.log('=============================\n');

  try {
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const julyData = {};

    revenueSnap.forEach(doc => {
      const data = doc.data();
      const date = data.date && data.date.toDate ? data.date.toDate() : data.date;
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11

      // July is month 6
      if (month === 6 && [2023, 2024, 2025].includes(year)) {
        if (!julyData[year]) {
          julyData[year] = [];
        }
        julyData[year].push({
          date: date,
          amount: data.amount || data.netIncome || 0,
          source: data.source || 'Unknown',
          description: data.description || '',
          id: doc.id
        });
      }
    });

    // Display results
    [2023, 2024, 2025].forEach(year => {
      console.log(`\n📊 July ${year}:`);

      if (!julyData[year] || julyData[year].length === 0) {
        console.log('   No records found');
        return;
      }

      const records = julyData[year];
      console.log(`   Total records: ${records.length}\n`);

      // Sort by date
      records.sort((a, b) => a.date - b.date);

      // Show each record
      records.forEach(record => {
        console.log(`   ${record.date.toLocaleDateString()}: ${record.source} - $${record.amount.toFixed(2)}`);
        if (record.description) {
          console.log(`      Description: ${record.description}`);
        }
      });

      // Calculate total
      const total = records.reduce((sum, r) => sum + r.amount, 0);
      console.log(`\n   TOTAL: $${total.toFixed(2)}`);

      // Check for duplicates
      const airbnbRecords = records.filter(r => r.source === 'Airbnb');
      if (airbnbRecords.length > 1) {
        console.log(`\n   ⚠️  WARNING: ${airbnbRecords.length} Airbnb records found - might be duplicates!`);
      }
    });

    console.log('\n\n📋 Expected from PDFs:');
    console.log('   July 2023: $2,540.43 (net)');
    console.log('   July 2024: $2,122.94 (net)');
    console.log('   July 2025: $2,748.20 (net)');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkJulyData();
