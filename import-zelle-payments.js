// Import Zelle 2025 contractor payments
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

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

// Categorize contractor payments
function categorizeContractor(vendor) {
  const name = vendor.toLowerCase();

  if (name.includes('cleaner') || name.includes('cleaning') || name.includes('crystal') || name.includes('angelica')) return 'Cleaning';
  if (name.includes('salgado')) return 'Property Management';
  if (name.includes('goforth') || name.includes('handyman')) return 'Maintenance';
  if (name.includes('gardener') || name.includes('raul') || name.includes('hailu') || name.includes('eyob')) return 'Landscaping';
  if (name.includes('spa') || name.includes('pool') || name.includes('luis')) return 'Pool/Spa';
  if (name.includes('inspector') || name.includes('joey')) return 'Inspection';
  if (name.includes('ac') || name.includes('borrego')) return 'HVAC';
  if (name.includes('videographer') || name.includes('nicole') || name.includes('bianca') || name.includes('trejo')) return 'Marketing';
  if (name.includes('bartender') || name.includes('tacos') || name.includes('messina') || name.includes('pacos')) return 'Event Expenses';
  if (name.includes('mom') || name.includes('tuan')) return 'Owner Draw';

  return 'Contractor';
}

async function importZellePayments() {
  console.log('🌵 Importing Zelle 2025 Contractor Payments');
  console.log('==========================================\n');

  try {
    // Read the parsed payments
    console.log('📖 Reading parsed Zelle payments...');
    const paymentsJson = readFileSync('/tmp/zelle_2025_payments.json', 'utf-8');
    const payments = JSON.parse(paymentsJson);

    console.log(`✅ Found ${payments.length} contractor payments\n`);

    // Convert and categorize
    console.log('⚙️  Categorizing payments...');
    const expenses = payments.map(payment => ({
      date: new Date(payment.date),
      amount: payment.amount,
      vendor: payment.vendor,
      category: categorizeContractor(payment.vendor),
      description: `Zelle payment to ${payment.vendor}`,
      propertyId: 'cochran',
      source: 'Zelle',
      importDate: new Date()
    }));

    // Show category breakdown
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    console.log('\n📊 Category breakdown:');
    Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, total]) => {
        console.log(`   ${category}: $${total.toFixed(2)}`);
      });
    console.log('');

    // Upload to Firebase
    console.log('📤 Uploading to Firebase...\n');

    let uploadCount = 0;
    const batchSize = 10;

    for (let i = 0; i < expenses.length; i += batchSize) {
      const batch = expenses.slice(i, i + batchSize);

      await Promise.all(
        batch.map(expense =>
          addDoc(collection(db, 'expenses'), expense)
        )
      );

      uploadCount += batch.length;
      const percent = Math.round((uploadCount / expenses.length) * 100);
      process.stdout.write(`\r   📊 Progress: ${uploadCount}/${expenses.length} (${percent}%)`);
    }

    console.log('\n\n✅ Successfully uploaded all Zelle payments!');

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`\n🎉 Import complete!`);
    console.log(`   - ${expenses.length} contractor/vendor payments`);
    console.log(`   - Total amount: $${totalAmount.toFixed(2)}`);
    console.log(`   - Property: Cozy Cactus (Cochran)`);
    console.log(`\n💡 Refresh your dashboard to see all 2025 expenses! 🌵✨\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run import
importZellePayments();
