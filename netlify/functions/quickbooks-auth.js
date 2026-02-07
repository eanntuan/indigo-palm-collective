/**
 * QuickBooks OAuth Authentication Handler
 * Handles the OAuth flow to connect QuickBooks Online
 */

import OAuthClient from 'intuit-oauth';

const oauthClient = new OAuthClient({
  clientId: process.env.QB_CLIENT_ID,
  clientSecret: process.env.QB_CLIENT_SECRET,
  environment: 'production', // or 'sandbox' for testing
  redirectUri: process.env.QB_REDIRECT_URI || 'https://indigopalmcollective.netlify.app/.netlify/functions/quickbooks-callback'
});

export const handler = async (event, context) => {
  const { httpMethod, queryStringParameters } = event;

  // Step 1: Initiate OAuth (user clicks "Connect to QuickBooks")
  if (httpMethod === 'GET' && !queryStringParameters?.code) {
    try {
      // Generate authorization URL
      const authUri = oauthClient.authorizeUri({
        scope: [
          OAuthClient.scopes.Accounting,
          OAuthClient.scopes.OpenId,
        ],
        state: 'secureRandomState' // Should be random in production
      });

      return {
        statusCode: 302,
        headers: {
          Location: authUri
        }
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid request' })
  };
};
