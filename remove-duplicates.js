// Remove monthly aggregate duplicate records
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function removeDuplicates() {
  console.log('🧹 Removing Duplicate Monthly Aggregate Records');
  console.log('===============================================\n');

  try {
    const revenueSnap = await getDocs(collection(db, 'revenue'));
    const duplicates = [];

    revenueSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.monthlyAggregate === true) {
        duplicates.push({
          id: docSnap.id,
          data: data
        });
      }
    });

    console.log(`Found ${duplicates.length} monthly aggregate records to remove\n`);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      process.exit(0);
    }

    console.log('📋 Records to be deleted:');
    duplicates.forEach(dup => {
      const date = dup.data.date.toDate ? dup.data.date.toDate() : dup.data.date;
      console.log(`  - ${date.toLocaleDateString()}: ${dup.data.source} $${dup.data.amount}`);
    });

    console.log('\n🗑️  Deleting...\n');

    let deleteCount = 0;
    for (const dup of duplicates) {
      await deleteDoc(doc(db, 'revenue', dup.id));
      deleteCount++;
      process.stdout.write(`\r   Deleted: ${deleteCount}/${duplicates.length}`);
    }

    console.log('\n\n✅ Successfully removed all duplicate records!');
    console.log('\n💡 Refresh your dashboard to see accurate totals! 🌵✨\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
