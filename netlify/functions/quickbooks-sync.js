/**
 * QuickBooks Data Sync Function
 * Syncs all expenses, revenue, and balances from QuickBooks to Firebase
 */

import OAuthClient from 'intuit-oauth';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

const oauthClient = new OAuthClient({
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  environment: 'production',
  redirectUri: process.env.QB_REDIRECT_URI
});

/**
 * Refresh access token if expired
 */
async function getValidAccessToken() {
  const qbDoc = await db.collection('settings').doc('quickbooks').get();

  if (!qbDoc.exists) {
    throw new Error('QuickBooks not connected. Please authenticate first.');
  }

  const qbData = qbDoc.data();
  const now = Date.now();

  // Check if token is expired or about to expire (within 5 minutes)
  if (qbData.expiresAt < now + (5 * 60 * 1000)) {
    console.log('Token expired, refreshing...');

    oauthClient.setToken({
      access_token: qbData.accessToken,
      refresh_token: qbData.refreshToken,
      expires_in: 3600,
      token_type: 'bearer'
    });

    const authResponse = await oauthClient.refresh();
    const newTokens = authResponse.getJson();

    // Update tokens in Firebase
    await db.collection('settings').doc('quickbooks').update({
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt: Date.now() + (newTokens.expires_in * 1000)
    });

    return {
      accessToken: newTokens.access_token,
      realmId: qbData.realmId
    };
  }

  return {
    accessToken: qbData.accessToken,
    realmId: qbData.realmId
  };
}

/**
 * Query QuickBooks API
 */
async function queryQB(query, { accessToken, realmId }) {
  const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error: ${error}`);
  }

  return await response.json();
}

/**
 * Map QuickBooks account/category to property
 */
function mapToProperty(qbData) {
  const name = (qbData.Name || '').toLowerCase();
  const description = (qbData.Description || '').toLowerCase();
  const memo = (qbData.PrivateNote || qbData.Memo || '').toLowerCase();

  const combined = `${name} ${description} ${memo}`;

  // Map based on keywords in transaction details
  if (combined.includes('cochran') || combined.includes('cozy cactus')) {
    return 'cochran';
  }
  if (combined.includes('terra luz') || combined.includes('casa moto') || combined.includes('villa')) {
    return 'terra-luz';
  }
  if (combined.includes('ps retreat') || combined.includes('palm springs retreat')) {
    return 'ps-retreat';
  }
  if (combined.includes('the well')) {
    return 'the-well';
  }

  // If no property match found, check Class field (if you use Classes)
  if (qbData.Class) {
    const className = qbData.Class.Name.toLowerCase();
    if (className.includes('cochran')) return 'cochran';
    if (className.includes('casa')) return 'terra-luz';
    if (className.includes('retreat')) return 'ps-retreat';
    if (className.includes('well')) return 'the-well';
  }

  return 'unknown';
}

/**
 * Categorize expense
 */
function categorizeExpense(qbExpense) {
  const category = (qbExpense.AccountRef?.name || '').toLowerCase();
  const vendor = (qbExpense.EntityRef?.name || '').toLowerCase();
  const description = (qbExpense.PrivateNote || '').toLowerCase();

  const combined = `${category} ${vendor} ${description}`;

  if (combined.includes('mortgage') || combined.includes('loan')) return 'Mortgage';
  if (combined.includes('electric') || combined.includes('sce') || combined.includes('power')) return 'Utilities - Electric';
  if (combined.includes('water') || combined.includes('sewer')) return 'Utilities - Water';
  if (combined.includes('gas') && !combined.includes('gasoline')) return 'Utilities - Gas';
  if (combined.includes('solar')) return 'Utilities - Solar';
  if (combined.includes('internet') || combined.includes('spectrum') || combined.includes('wifi')) return 'Internet';
  if (combined.includes('hoa') || combined.includes('association')) return 'HOA';
  if (combined.includes('insurance')) return 'Insurance';
  if (combined.includes('property tax') || combined.includes('tax')) return 'Property Tax';
  if (combined.includes('cleaning') || combined.includes('cleaner')) return 'Cleaning';
  if (combined.includes('supplies') || combined.includes('stock')) return 'Supplies';
  if (combined.includes('repair') || combined.includes('maintenance')) return 'Repairs';
  if (combined.includes('landscap') || combined.includes('yard')) return 'Landscaping';
  if (combined.includes('pool') || combined.includes('spa')) return 'Pool/Spa';
  if (combined.includes('pest') || combined.includes('termite')) return 'Pest Control';
  if (combined.includes('airbnb') || combined.includes('hostaway') || combined.includes('hospitable')) return 'Property Management';

  // Default to account category from QuickBooks
  return qbExpense.AccountRef?.name || 'Other';
}

/**
 * Sync Expenses from QuickBooks
 */
async function syncExpenses(auth) {
  console.log('Syncing expenses...');

  // Query all expenses from the last 2 years
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const dateStr = startDate.toISOString().split('T')[0];

  const query = `SELECT * FROM Purchase WHERE TxnDate >= '${dateStr}' MAXRESULTS 1000`;
  const result = await queryQB(query, auth);

  const purchases = result.QueryResponse?.Purchase || [];
  console.log(`Found ${purchases.length} expense transactions`);

  const batch = db.batch();
  let count = 0;

  for (const purchase of purchases) {
    const propertyId = mapToProperty(purchase);
    const category = categorizeExpense(purchase);

    const expenseData = {
      propertyId,
      category,
      subcategory: purchase.AccountRef?.name || '',
      amount: Math.abs(purchase.TotalAmt || 0),
      vendor: purchase.EntityRef?.name || 'Unknown',
      description: purchase.PrivateNote || purchase.Memo || '',
      date: admin.firestore.Timestamp.fromDate(new Date(purchase.TxnDate)),
      qbId: purchase.Id,
      qbSyncedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use QB ID as document ID to avoid duplicates
    const docRef = db.collection('expenses').doc(`qb_${purchase.Id}`);
    batch.set(docRef, expenseData, { merge: true });

    count++;

    // Firestore batch limit is 500, commit and start new batch if needed
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${count} expenses...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✓ Synced ${count} expenses`);
  return count;
}

/**
 * Sync Revenue from QuickBooks
 */
async function syncRevenue(auth) {
  console.log('Syncing revenue...');

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const dateStr = startDate.toISOString().split('T')[0];

  // Query deposits (Airbnb payouts, direct bookings, etc.)
  const query = `SELECT * FROM Deposit WHERE TxnDate >= '${dateStr}' MAXRESULTS 1000`;
  const result = await queryQB(query, auth);

  const deposits = result.QueryResponse?.Deposit || [];
  console.log(`Found ${deposits.length} revenue transactions`);

  const batch = db.batch();
  let count = 0;

  for (const deposit of deposits) {
    const propertyId = mapToProperty(deposit);

    // Determine source
    let source = 'Other';
    const description = (deposit.PrivateNote || '').toLowerCase();
    if (description.includes('airbnb')) source = 'Airbnb';
    else if (description.includes('direct') || description.includes('booking')) source = 'Direct';
    else if (description.includes('vrbo')) source = 'VRBO';

    const revenueData = {
      propertyId,
      source,
      grossAmount: Math.abs(deposit.TotalAmt || 0),
      netIncome: Math.abs(deposit.TotalAmt || 0), // Adjust if you track fees separately
      description: deposit.PrivateNote || '',
      date: admin.firestore.Timestamp.fromDate(new Date(deposit.TxnDate)),
      qbId: deposit.Id,
      qbSyncedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection('revenue').doc(`qb_${deposit.Id}`);
    batch.set(docRef, revenueData, { merge: true });

    count++;

    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${count} revenue transactions...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✓ Synced ${count} revenue transactions`);
  return count;
}

/**
 * Sync Bank Account Balances
 */
async function syncBankBalances(auth) {
  console.log('Syncing bank account balances...');

  const query = `SELECT * FROM Account WHERE AccountType IN ('Bank', 'Checking', 'Savings')`;
  const result = await queryQB(query, auth);

  const accounts = result.QueryResponse?.Account || [];
  console.log(`Found ${accounts.length} bank accounts`);

  const batch = db.batch();

  for (const account of accounts) {
    const accountData = {
      name: account.Name,
      type: account.AccountSubType?.toLowerCase() || 'checking',
      balance: account.CurrentBalance || 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      qbId: account.Id,
      active: account.Active
    };

    const docRef = db.collection('bankAccounts').doc(`qb_${account.Id}`);
    batch.set(docRef, accountData, { merge: true });
  }

  await batch.commit();
  console.log(`✓ Synced ${accounts.length} bank accounts`);
  return accounts.length;
}

/**
 * Main sync handler
 */
export const handler = async (event, context) => {
  try {
    console.log('Starting QuickBooks sync...');

    // Get valid access token
    const auth = await getValidAccessToken();

    // Sync all data types
    const results = {
      expenses: await syncExpenses(auth),
      revenue: await syncRevenue(auth),
      bankAccounts: await syncBankBalances(auth),
      timestamp: new Date().toISOString()
    };

    // Update last sync time
    await db.collection('settings').doc('quickbooks').update({
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResults: results
    });

    console.log('✓ QuickBooks sync complete', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'QuickBooks sync complete',
        results
      })
    };

  } catch (error) {
    console.error('QuickBooks sync error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
