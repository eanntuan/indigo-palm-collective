/**
 * QuickBooks OAuth Callback Handler
 * Receives the authorization code and exchanges it for tokens
 */

import OAuthClient from 'intuit-oauth';
import admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

const oauthClient = new OAuthClient({
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  environment: 'production',
  redirectUri: process.env.QB_REDIRECT_URI || 'https://indigopalmcollective.netlify.app/.netlify/functions/quickbooks-callback'
});

export const handler = async (event, context) => {
  const { code, state, realmId } = event.queryStringParameters || {};

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No authorization code provided' })
    };
  }

  try {
    // Exchange authorization code for tokens
    const authResponse = await oauthClient.createToken(event.queryStringParameters.url);
    const tokens = authResponse.getJson();

    // Store tokens and company ID in Firebase
    await db.collection('settings').doc('quickbooks').set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      realmId: realmId, // QuickBooks Company ID
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSync: null
    });

    // Redirect to dashboard with success message
    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard.html?qb_connected=true'
      }
    };

  } catch (error) {
    console.error('QuickBooks OAuth error:', error);

    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard.html?qb_error=' + encodeURIComponent(error.message)
      }
    };
  }
};
