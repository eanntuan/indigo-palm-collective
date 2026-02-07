// Delete duplicate direct booking records since they're included in YoY gross
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function deleteDirectBookings() {
  console.log('🗑️  Deleting Direct Booking Records');
  console.log('=====================================\n');

  try {
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const toDelete = [];

    revenueSnap.forEach(docSnap => {
      const data = docSnap.data();
      const source = data.source || 'Unknown';

      if (source === 'Direct') {
        toDelete.push({
          id: docSnap.id,
          date: data.date.toDate(),
          amount: data.amount || data.netIncome,
          description: data.description
        });
      }
    });

    console.log(`Found ${toDelete.length} Direct booking records to delete:\n`);

    toDelete.forEach(record => {
      console.log(`   ${record.date.toLocaleDateString()}: $${record.amount.toFixed(2)} - ${record.description}`);
    });

    console.log('\n🔄 Deleting...\n');

    for (const record of toDelete) {
      await deleteDoc(doc(db, 'revenue', record.id));
    }

    console.log(`✅ Successfully deleted ${toDelete.length} direct booking records!`);
    console.log('\n💡 YoY gross data already includes all revenue sources (Airbnb + VRBO + Direct)');
    console.log('   Refresh your dashboard to see accurate totals! 🌵✨\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteDirectBookings();
