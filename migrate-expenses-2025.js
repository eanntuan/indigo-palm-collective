// Migration script to import 2025 expenses from Indio.xlsx for Cozy Cactus
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import ExcelJS from 'exceljs';

// Firebase config
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

// Categorize contractor payments
function categorizeContractor(paymentName) {
  const name = paymentName.toLowerCase();

  if (name.includes('cleaner') || name.includes('cleaning') || name.includes('crystal')) return 'Cleaning';
  if (name.includes('salgado')) return 'Property Management';
  if (name.includes('goforth') || name.includes('handyman')) return 'Maintenance';
  if (name.includes('gardener') || name.includes('raul') || name.includes('hailu')) return 'Landscaping';
  if (name.includes('spa') || name.includes('pool') || name.includes('luis')) return 'Pool/Spa';
  if (name.includes('inspector') || name.includes('joey')) return 'Inspection';
  if (name.includes('ac') || name.includes('borrego')) return 'HVAC';
  if (name.includes('videographer') || name.includes('nicole') || name.includes('bianca')) return 'Marketing';
  if (name.includes('bartender') || name.includes('tacos') || name.includes('messina')) return 'Event Expenses';

  return 'Contractor';
}

async function migrate2025Expenses() {
  console.log('🌵 Importing 2025 Cozy Cactus Expenses');
  console.log('======================================\n');

  try {
    // Check existing expenses
    console.log('🔍 Checking for existing 2025 expenses...');
    const expensesRef = collection(db, 'expenses');
    const existingExpenses = await getDocs(expensesRef);

    const expenses2025 = [];
    existingExpenses.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.toDate) {
        const year = data.date.toDate().getFullYear();
        if (year === 2025) expenses2025.push(data);
      }
    });

    console.log(`   Found ${expenses2025.length} existing 2025 expense records\n`);

    // Read Excel file
    console.log('📖 Reading Indio.xlsx...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/Users/etuan/Desktop/Airbnb/Dashboard/Indio.xlsx');

    // Parse Zelle 25 sheet (contractor payments)
    console.log('⚙️  Parsing Zelle 25 sheet (contractor payments)...');
    const zelle25 = workbook.getWorksheet('Zelle 25');
    const contractorPayments = [];

    zelle25.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const dateCell = row.getCell(1).value;
      const paymentCell = row.getCell(4).value;
      const amountCell = row.getCell(6).value;

      if (dateCell && paymentCell && amountCell) {
        try {
          // Parse date
          let date;
          if (dateCell instanceof Date) {
            date = dateCell;
          } else if (typeof dateCell === 'number') {
            // Excel serial date
            date = new Date((dateCell - 25569) * 86400 * 1000);
          } else {
            date = new Date(dateCell);
          }

          const amount = parseFloat(amountCell);

          if (!isNaN(amount) && amount > 0) {
            const vendor = String(paymentCell).trim();
            contractorPayments.push({
              date: date,
              amount: amount,
              vendor: vendor,
              category: categorizeContractor(vendor),
              description: `Zelle payment to ${vendor}`,
              propertyId: 'cochran',
              source: 'Zelle'
            });
          }
        } catch (error) {
          console.log(`   ⚠️  Skipping row ${rowNumber}: ${error.message}`);
        }
      }
    });

    console.log(`✅ Parsed ${contractorPayments.length} contractor payments\n`);

    // Parse Monthly 24 for recurring expenses structure
    console.log('⚙️  Parsing Monthly 24 sheet for recurring expense structure...');
    const monthly24 = workbook.getWorksheet('Monthly 24');
    const recurringExpenses = [];

    // Get the expense categories and amounts from first month (January 2024)
    monthly24.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return; // Skip header row

      const expenseItem = row.getCell(1).value;
      const januaryAmount = row.getCell(2).value;

      if (expenseItem && expenseItem !== 'Expense Item' && expenseItem !== 'TOTAL') {
        const amount = parseFloat(januaryAmount);

        if (!isNaN(amount) && amount > 0) {
          // Map expense categories
          let category = 'Other';
          const item = String(expenseItem).toLowerCase();

          if (item.includes('mortgage')) category = 'Mortgage';
          else if (item.includes('electric') || item.includes('solar')) category = 'Electric';
          else if (item.includes('water')) category = 'Water';
          else if (item.includes('gas')) category = 'Gas';
          else if (item.includes('spa')) category = 'Pool/Spa';
          else if (item.includes('pest')) category = 'Pest Control';
          else if (item.includes('tax')) category = 'Property Tax';
          else if (item.includes('insurance')) category = 'Insurance';
          else if (item.includes('spectrum')) category = 'Internet';
          else if (item.includes('hoa')) category = 'HOA';
          else if (item.includes('permit')) category = 'Permits';
          else if (item.includes('llc')) category = 'Business';
          else if (item.includes('pricelabs')) category = 'Software';

          recurringExpenses.push({
            item: String(expenseItem),
            amount: amount,
            category: category
          });
        }
      }
    });

    console.log(`✅ Found ${recurringExpenses.length} recurring expense categories\n`);

    // Create monthly recurring expenses for 2025 (Jan - current month)
    console.log('📅 Creating 2025 monthly recurring expenses...');
    const currentMonth = new Date().getMonth(); // 0-11
    const monthlyExpenseRecords = [];

    for (let month = 0; month <= currentMonth; month++) {
      for (const expense of recurringExpenses) {
        monthlyExpenseRecords.push({
          date: new Date(2025, month, 1),
          category: expense.category,
          amount: expense.amount,
          description: `${expense.item} - ${new Date(2025, month).toLocaleString('en-US', { month: 'long' })} 2025`,
          vendor: expense.item,
          propertyId: 'cochran',
          recurring: true,
          source: 'Monthly Fixed'
        });
      }
    }

    console.log(`✅ Created ${monthlyExpenseRecords.length} monthly expense records\n`);

    // Combine all expenses
    const allExpenses = [...contractorPayments, ...monthlyExpenseRecords];
    console.log(`📊 Total expenses to upload: ${allExpenses.length}\n`);

    // Upload to Firebase
    console.log('📤 Uploading to Firebase...');
    console.log('   This may take a few minutes...\n');

    let uploadCount = 0;
    const batchSize = 10;

    for (let i = 0; i < allExpenses.length; i += batchSize) {
      const batch = allExpenses.slice(i, i + batchSize);

      await Promise.all(
        batch.map(expense =>
          addDoc(collection(db, 'expenses'), {
            ...expense,
            importDate: new Date()
          })
        )
      );

      uploadCount += batch.length;
      const percent = Math.round((uploadCount / allExpenses.length) * 100);
      process.stdout.write(`\r   📊 Progress: ${uploadCount}/${allExpenses.length} (${percent}%)`);
    }

    console.log('\n\n✅ Successfully uploaded all 2025 expense records!');
    console.log(`\n🎉 Import complete!`);
    console.log(`   - ${contractorPayments.length} contractor payments (Zelle)`);
    console.log(`   - ${monthlyExpenseRecords.length} monthly recurring expenses`);
    console.log(`   - Total: ${allExpenses.length} expense records for Cozy Cactus\n`);
    console.log('💡 Refresh your dashboard to see the updated data! 🌵✨\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run migration
migrate2025Expenses();
