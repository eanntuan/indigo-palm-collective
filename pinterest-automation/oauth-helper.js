// One-time OAuth helper to get a Pinterest write token.
// Usage: node oauth-helper.js
// Requires: CLIENT_SECRET env var (from Pinterest developer portal)

import http from 'http';
import { exec } from 'child_process';
import crypto from 'crypto';

const CLIENT_ID = '1566200';
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8888/callback';
const SCOPES = 'pins:read,pins:write,boards:read,boards:write';

if (!CLIENT_SECRET) {
  console.error('\nError: Set CLIENT_SECRET env var first.');
  console.error('Usage: CLIENT_SECRET=your_secret node oauth-helper.js\n');
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');
const authUrl = `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES}&state=${state}`;

console.log('\nOpening Pinterest authorization...');
console.log('If browser does not open, paste this URL:\n');
console.log(authUrl + '\n');

exec(`open "${authUrl}"`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8888');
  if (url.pathname !== '/callback') return;

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (returnedState !== state) {
    res.writeHead(400); res.end('State mismatch. Try again.');
    server.close();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h2 style="font-family:sans-serif;padding:2rem">Authorized! Check your terminal.</h2>');
  server.close();

  // Exchange code for token
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: params.toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error('\nToken exchange failed:', JSON.stringify(tokenData, null, 2));
    return;
  }

  const token = tokenData.access_token;
  console.log('\n✓ Access token obtained!\n');
  console.log('Now run:\n');
  console.log(`gh secret set PINTEREST_ACCESS_TOKEN --body "${token}"\n`);
  console.log('Then run get-boards.js to map your board names:\n');
  console.log(`PINTEREST_ACCESS_TOKEN="${token}" node get-boards.js\n`);
});

server.listen(8888, () => {
  console.log('Listening on http://localhost:8888/callback ...\n');
});
