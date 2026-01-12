const admin = require('firebase-admin');
const serviceAccount = require('../the-desert-edit-firebase-adminsdk-fbsvc-7711625750.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteQBTokens() {
  try {
    await db.collection('settings').doc('quickbooks').delete();
    console.log('✅ Successfully deleted old QuickBooks tokens from Firestore');
    console.log('📝 Now you can reconnect QuickBooks with fresh tokens');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteQBTokens();
