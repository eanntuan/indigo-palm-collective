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

  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

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
    batchCount++;

    if (batchCount >= 500) {
      await batch.commit();
      console.log(`Committed ${count} expenses...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
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

  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

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
    batchCount++;

    if (batchCount >= 500) {
      await batch.commit();
      console.log(`Committed ${count} revenue transactions...`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
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

  const query = `SELECT * FROM Account WHERE AccountType = 'Bank'`;
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

/**
 * Email Signup Handler
 * Saves email addresses to Firestore
 */
exports.emailSignup = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { email, firstName, lastName, source } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid email required' });
      return;
    }

    const emailData = {
      email: email.toLowerCase().trim(),
      firstName: firstName || '',
      lastName: lastName || '',
      source: source || 'website',
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    };

    // Use email as document ID to prevent duplicates
    const emailId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    await db.collection('emailSubscribers').doc(emailId).set(emailData, { merge: true });

    console.log(`✓ New email subscriber: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed!'
    });

  } catch (error) {
    console.error('Email signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe. Please try again.'
    });
  }
});

/**
 * Hostaway Integration
 */

const hostawayApiKey = defineString('HOSTAWAY_API_KEY');
const hostawayAccountId = defineString('HOSTAWAY_ACCOUNT_ID');

async function callHostawayAPI(endpoint, method = 'GET', body = null) {
  const url = `https://api.hostaway.com/v1${endpoint}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${hostawayApiKey.value()}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hostaway API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Map Hostaway listing ID to property ID
 */
function mapHostawayListing(listingName) {
  const name = (listingName || '').toLowerCase();

  if (name.includes('cochran') || name.includes('cozy cactus')) return 'cochran';
  if (name.includes('casa moto') || name.includes('villa')) return 'casa-moto';
  if (name.includes('ps retreat') || name.includes('palm springs')) return 'ps-retreat';
  if (name.includes('the well')) return 'the-well';

  return 'unknown';
}

/**
 * Sync Hostaway reservations
 */
async function syncHostawayReservations() {
  console.log('Syncing Hostaway reservations...');

  // Get reservations from last 2 years
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const dateStr = startDate.toISOString().split('T')[0];

  try {
    const response = await callHostawayAPI(`/reservations?arrivalStartDate=${dateStr}&limit=1000`);
    const reservations = response.result || [];

    console.log(`Found ${reservations.length} reservations`);

    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    for (const reservation of reservations) {
      const listingName = reservation.listingMapName || '';
      const propertyId = mapHostawayListing(listingName);

      const revenueData = {
        propertyId,
        source: reservation.channelName || 'Hostaway',
        grossAmount: parseFloat(reservation.totalPrice || 0),
        cleaningFee: parseFloat(reservation.cleaningFee || 0),
        pmFee: parseFloat(reservation.hostServiceFee || 0),
        netIncome: parseFloat(reservation.hostPayout || reservation.totalPrice || 0),
        guestName: reservation.guestName || '',
        confirmationCode: reservation.channelId || reservation.id,
        checkIn: admin.firestore.Timestamp.fromDate(new Date(reservation.arrivalDate)),
        checkOut: admin.firestore.Timestamp.fromDate(new Date(reservation.departureDate)),
        nights: parseInt(reservation.nights || 0),
        date: admin.firestore.Timestamp.fromDate(new Date(reservation.arrivalDate)),
        hostawayId: reservation.id,
        hostawaySyncedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = db.collection('revenue').doc(`hostaway_${reservation.id}`);
      batch.set(docRef, revenueData, { merge: true });

      // Store guest info separately
      if (reservation.guestName && reservation.guestEmail) {
        const guestData = {
          email: reservation.guestEmail,
          name: reservation.guestName,
          phone: reservation.guestPhone || '',
          lastStay: admin.firestore.Timestamp.fromDate(new Date(reservation.arrivalDate)),
          propertyId,
          hostawayId: reservation.id
        };

        const guestDocRef = db.collection('guests').doc(`hostaway_${reservation.guestEmail.replace(/[^a-z0-9]/gi, '_')}`);
        batch.set(guestDocRef, guestData, { merge: true });
      }

      count++;
      batchCount++;

      if (batchCount >= 250) {
        await batch.commit();
        console.log(`Committed ${count} reservations...`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✓ Synced ${count} reservations`);
    return count;

  } catch (error) {
    console.error('Hostaway sync error:', error);
    throw error;
  }
}

/**
 * Hostaway Sync Function
 */
exports.hostawaySync = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    console.log('Starting Hostaway sync...');

    const results = {
      reservations: await syncHostawayReservations(),
      timestamp: new Date().toISOString()
    };

    await db.collection('settings').doc('hostaway').set({
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncResults: results
    }, { merge: true });

    console.log('✓ Hostaway sync complete');

    res.status(200).json({
      success: true,
      message: 'Hostaway sync complete',
      results
    });

  } catch (error) {
    console.error('Hostaway sync error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Dynamic Pricing from Hostaway/Hospitable
 * Endpoint: /get-pricing
 * Method: POST
 * Body: { propertyId, checkIn, checkOut, guests }
 */
exports.getPricing = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { propertyId, checkIn, checkOut, guests } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: propertyId, checkIn, checkOut'
      });
      return;
    }

    // Property configuration
    const PROPERTY_CONFIG = {
      'cozy-cactus': {
        hostawayListingId: 123646,
        source: 'hostaway',
        cleaningFee: 150,
        taxRate: 0.12,
        basePrice: 250 // fallback
      },
      'casa-moto': {
        hostawayListingId: 123633,
        source: 'hostaway',
        cleaningFee: 150,
        taxRate: 0.12,
        basePrice: 225 // fallback
      },
      'ps-retreat': {
        source: 'hospitable', // Managed via Hospitable
        cleaningFee: 125,
        taxRate: 0.135,
        basePrice: 180 // fallback
      },
      'the-well': {
        source: 'airbnb', // Direct Airbnb listing
        cleaningFee: 200,
        taxRate: 0.135,
        basePrice: 300 // fallback
      }
    };

    const property = PROPERTY_CONFIG[propertyId];
    if (!property) {
      res.status(404).json({
        success: false,
        error: 'Property not found'
      });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    let nightly = [];
    let totalNightlyRate = 0;

    // Fetch pricing from Hostaway
    if (property.source === 'hostaway' && property.hostawayListingId) {
      try {
        // Hostaway calendar endpoint with pricing
        const startDate = checkInDate.toISOString().split('T')[0];
        const endDate = checkOutDate.toISOString().split('T')[0];

        const calendarData = await callHostawayAPI(
          `/listings/${property.hostawayListingId}/calendar?startDate=${startDate}&endDate=${endDate}`
        );

        // Parse nightly rates from calendar
        if (calendarData.result && Array.isArray(calendarData.result)) {
          for (const day of calendarData.result) {
            if (day.date >= startDate && day.date < endDate) {
              const price = parseFloat(day.price || property.basePrice);
              nightly.push({
                date: day.date,
                price: price,
                available: day.status === 'available'
              });
              totalNightlyRate += price;
            }
          }
        }

        // If no pricing data, use base price
        if (nightly.length === 0) {
          totalNightlyRate = property.basePrice * nights;
          for (let i = 0; i < nights; i++) {
            const date = new Date(checkInDate);
            date.setDate(date.getDate() + i);
            nightly.push({
              date: date.toISOString().split('T')[0],
              price: property.basePrice,
              available: true
            });
          }
        }

      } catch (error) {
        console.error('Error fetching Hostaway pricing:', error);
        // Fallback to base price
        totalNightlyRate = property.basePrice * nights;
        for (let i = 0; i < nights; i++) {
          const date = new Date(checkInDate);
          date.setDate(date.getDate() + i);
          nightly.push({
            date: date.toISOString().split('T')[0],
            price: property.basePrice,
            available: true
          });
        }
      }
    } else {
      // Hospitable/Airbnb properties - use base price for now
      // TODO: Add dynamic pricing integration when API available
      totalNightlyRate = property.basePrice * nights;
      for (let i = 0; i < nights; i++) {
        const date = new Date(checkInDate);
        date.setDate(date.getDate() + i);
        nightly.push({
          date: date.toISOString().split('T')[0],
          price: property.basePrice,
          available: true
        });
      }
    }

    // Calculate totals
    const cleaningFee = property.cleaningFee;
    const subtotal = totalNightlyRate;
    const taxAmount = (subtotal + cleaningFee) * property.taxRate;
    const total = subtotal + cleaningFee + taxAmount;

    // Check availability
    const unavailableDates = nightly.filter(n => !n.available).map(n => n.date);
    const isAvailable = unavailableDates.length === 0;

    res.status(200).json({
      success: true,
      pricing: {
        nights,
        nightly,
        subtotal: parseFloat(subtotal.toFixed(2)),
        cleaningFee: parseFloat(cleaningFee.toFixed(2)),
        taxRate: property.taxRate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        currency: 'USD',
        isAvailable,
        unavailableDates
      }
    });

  } catch (error) {
    console.error('Error in getPricing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
