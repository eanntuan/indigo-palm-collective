/**
 * Desert Edit - Firebase Cloud Functions
 * QuickBooks Integration
 */

const functions = require('firebase-functions');
const {defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');
const OAuthClient = require('intuit-oauth');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Define environment parameters
const qbClientId = defineString('QB_CLIENT_ID');
const qbClientSecret = defineString('QB_CLIENT_SECRET');
const qbRedirectUri = defineString('QB_REDIRECT_URI');

// QuickBooks OAuth Configuration
function getOAuthClient() {
  return new OAuthClient({
    clientId: qbClientId.value(),
    clientSecret: qbClientSecret.value(),
    environment: 'production',
    redirectUri: qbRedirectUri.value()
  });
}

/**
 * QuickBooks OAuth Authentication Handler
 * Initiates the OAuth flow
 */
exports.quickbooksAuth = functions.https.onRequest(async (req, res) => {
  const oauthClient = getOAuthClient();

  try {
    // Generate authorization URL
    const authUri = oauthClient.authorizeUri({
      scope: [
        OAuthClient.scopes.Accounting,
        OAuthClient.scopes.OpenId,
      ],
      state: 'secureRandomState'
    });

    res.redirect(authUri);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * QuickBooks OAuth Callback Handler
 * Exchanges authorization code for tokens
 */
exports.quickbooksCallback = functions.https.onRequest(async (req, res) => {
  const { code, state, realmId } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  const oauthClient = getOAuthClient();

  try {
    // Exchange authorization code for tokens
    const authResponse = await oauthClient.createToken(req.url);
    const tokens = authResponse.getJson();

    // Store tokens in Firestore
    await db.collection('settings').doc('quickbooks').set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      realmId: realmId,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSync: null
    });

    // Redirect to dashboard
    res.redirect('/dashboard.html?qb_connected=true');
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect('/dashboard.html?qb_error=' + encodeURIComponent(error.message));
  }
});

/**
 * Get valid access token, refreshing if needed
 */
async function getValidAccessToken() {
  const qbDoc = await db.collection('settings').doc('quickbooks').get();

  if (!qbDoc.exists) {
    throw new Error('QuickBooks not connected. Please authenticate first.');
  }

  const qbData = qbDoc.data();
  const now = Date.now();
  const oauthClient = getOAuthClient();

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
 * Map QuickBooks data to property
 */
function mapToProperty(qbData) {
  const name = (qbData.Name || '').toLowerCase();
  const description = (qbData.Description || '').toLowerCase();
  const memo = (qbData.PrivateNote || qbData.Memo || '').toLowerCase();
  const combined = `${name} ${description} ${memo}`;

  if (combined.includes('cochran') || combined.includes('cozy cactus')) return 'cochran';
  if (combined.includes('casa moto') || combined.includes('villa')) return 'casa-moto';
  if (combined.includes('ps retreat') || combined.includes('palm springs retreat')) return 'ps-retreat';
  if (combined.includes('the well')) return 'the-well';

  if (qbData.Class) {
    const className = qbData.Class.Name.toLowerCase();
    if (className.includes('cochran')) return 'cochran';
    if (className.includes('casa')) return 'casa-moto';
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

  return qbExpense.AccountRef?.name || 'Other';
}

/**
 * Sync expenses from QuickBooks
 */
async function syncExpenses(auth) {
  console.log('Syncing expenses...');

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

    const docRef = db.collection('expenses').doc(`qb_${purchase.Id}`);
    batch.set(docRef, expenseData, { merge: true });

    count++;

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
 * Sync revenue from QuickBooks
 */
async function syncRevenue(auth) {
  console.log('Syncing revenue...');

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const dateStr = startDate.toISOString().split('T')[0];

  const query = `SELECT * FROM Deposit WHERE TxnDate >= '${dateStr}' MAXRESULTS 1000`;
  const result = await queryQB(query, auth);

  const deposits = result.QueryResponse?.Deposit || [];
  console.log(`Found ${deposits.length} revenue transactions`);

  const batch = db.batch();
  let count = 0;

  for (const deposit of deposits) {
    const propertyId = mapToProperty(deposit);

    let source = 'Other';
    const description = (deposit.PrivateNote || '').toLowerCase();
    if (description.includes('airbnb')) source = 'Airbnb';
    else if (description.includes('direct') || description.includes('booking')) source = 'Direct';
    else if (description.includes('vrbo')) source = 'VRBO';

    const revenueData = {
      propertyId,
      source,
      grossAmount: Math.abs(deposit.TotalAmt || 0),
      netIncome: Math.abs(deposit.TotalAmt || 0),
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
 * Sync bank account balances
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
 * QuickBooks Data Sync Function
 * Main sync handler - callable from dashboard
 */
exports.quickbooksSync = functions.https.onRequest(async (req, res) => {
  try {
    console.log('Starting QuickBooks sync...');

    const auth = await getValidAccessToken();

    const results = {
      expenses: await syncExpenses(auth),
      revenue: await syncRevenue(auth),
      bankAccounts: await syncBankBalances(auth),
      timestamp: new Date().toISOString()
    };

    await db.collection('settings').doc('quickbooks').update({
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResults: results
    });

    console.log('✓ QuickBooks sync complete', results);

    res.json({
      success: true,
      message: 'QuickBooks sync complete',
      results
    });

  } catch (error) {
    console.error('QuickBooks sync error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
