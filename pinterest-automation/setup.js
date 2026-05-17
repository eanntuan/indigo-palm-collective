#!/usr/bin/env node
/**
 * Pinterest API v5 — OAuth 2.0 Setup
 * Usage: node setup.js
 *
 * What it does:
 *   1. Opens the Pinterest authorization URL in your browser
 *   2. Catches the redirect on localhost:8888
 *   3. Exchanges the code for access + refresh tokens
 *   4. Saves to ~/.claude/pinterest_credentials.json
 *   5. Lists your boards to confirm everything works
 *
 * You need: app_id and app_secret from https://developers.pinterest.com/apps/
 * Pass them as env vars:
 *   PINTEREST_APP_ID=your_id PINTEREST_APP_SECRET=your_secret node setup.js
 */

import http from 'http';
import { exec } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PINTEREST_API = 'https://api.pinterest.com/v5';
const REDIRECT_URI  = 'http://localhost:8888/callback';
const SCOPES        = 'pins:read,pins:write,boards:read,boards:write';
const CREDS_PATH    = path.join(os.homedir(), '.claude', 'pinterest_credentials.json');

// ── Check for required env vars ───────────────────────────────────────────────
const APP_ID     = process.env.PINTEREST_APP_ID;
const APP_SECRET = process.env.PINTEREST_APP_SECRET;

if (!APP_ID || !APP_SECRET) {
  console.error('\nMissing credentials. Run as:\n');
  console.error('  PINTEREST_APP_ID=your_app_id PINTEREST_APP_SECRET=your_secret node setup.js\n');
  console.error('Get your app_id and secret at:\n  https://developers.pinterest.com/apps/\n');
  console.error('Make sure your app has these redirect URIs configured:\n  http://localhost:8888/callback\n');
  process.exit(1);
}

// ── Build authorization URL ───────────────────────────────────────────────────
const state   = crypto.randomBytes(16).toString('hex');
const authUrl = `https://www.pinterest.com/oauth/?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES}&state=${state}`;

console.log('\nOpening Pinterest authorization in your browser...');
console.log('If the browser does not open, paste this URL manually:\n');
console.log(authUrl + '\n');

exec(`open "${authUrl}"`);

// ── Local callback server ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8888');
  if (url.pathname !== '/callback') return;

  const code          = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (returnedState !== state) {
    res.writeHead(400);
    res.end('State mismatch — possible CSRF. Please try again.');
    server.close();
    return;
  }

  if (!code) {
    const error = url.searchParams.get('error');
    res.writeHead(400);
    res.end(`Authorization failed: ${error || 'unknown'}`);
    server.close();
    console.error(`\nAuthorization failed: ${error || 'unknown'}\n`);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h2 style="font-family:sans-serif;padding:2rem">Authorized. Check your terminal to finish setup.</h2>');
  server.close();

  // ── Exchange authorization code for tokens ──────────────────────────────────
  console.log('\nExchanging authorization code for access token...');

  const params = new URLSearchParams({
    grant_type:   'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  const tokenRes = await fetch(`${PINTEREST_API}/oauth/token`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64')}`,
    },
    body: params.toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error('\nToken exchange failed:');
    console.error(JSON.stringify(tokenData, null, 2));
    process.exit(1);
  }

  // ── Save credentials ────────────────────────────────────────────────────────
  const creds = {
    app_id:        APP_ID,
    access_token:  tokenData.access_token,
    refresh_token: tokenData.refresh_token || null,
    token_type:    tokenData.token_type,
    expires_in:    tokenData.expires_in || null,
    scope:         tokenData.scope || SCOPES,
    saved_at:      new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(CREDS_PATH), { recursive: true });
  fs.writeFileSync(CREDS_PATH, JSON.stringify(creds, null, 2));
  fs.chmodSync(CREDS_PATH, 0o600);

  console.log(`\nCredentials saved to: ${CREDS_PATH}`);
  console.log(`Token expires in: ${creds.expires_in ? `${creds.expires_in}s` : 'unknown (check Pinterest docs)'}`);

  // ── Test: list boards ───────────────────────────────────────────────────────
  console.log('\nFetching your Pinterest boards to verify connection...\n');

  const boardsRes = await fetch(`${PINTEREST_API}/boards?page_size=50`, {
    headers: { Authorization: `Bearer ${creds.access_token}` },
  });

  if (!boardsRes.ok) {
    const err = await boardsRes.text();
    console.error(`Board fetch failed (${boardsRes.status}): ${err}`);
    process.exit(1);
  }

  const { items: boards } = await boardsRes.json();

  if (!boards || boards.length === 0) {
    console.log('No boards found. Create at least one board in Pinterest first.');
  } else {
    console.log('Your Pinterest boards:\n');
    const boardMap = {};
    boards.forEach(b => {
      boardMap[b.name] = b.id;
      console.log(`  ${b.id}  ${b.name}`);
    });

    // Save board map
    const boardsPath = new URL('./boards.json', import.meta.url);
    fs.writeFileSync(boardsPath, JSON.stringify(boardMap, null, 2));
    console.log(`\nBoard map saved to: pinterest-automation/boards.json`);
  }

  console.log('\nSetup complete. You can now run:\n');
  console.log('  node create-pin.js --title "Your Title" --description "..." --image-url "https://..." --link "https://..." --board "Board Name"');
  console.log('  node batch-from-csv.js path/to/pins.csv\n');
});

server.listen(8888, () => {
  console.log('Waiting for Pinterest redirect on http://localhost:8888/callback ...\n');
});
