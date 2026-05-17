#!/usr/bin/env node
/**
 * Pinterest API v5 — Create a single pin
 *
 * Usage (with credentials file):
 *   node create-pin.js \
 *     --title "Palm Springs Fall Travel Guide" \
 *     --description "Everything you need to know about visiting..." \
 *     --image-url "https://indigopalm.co/blog/images/palm-springs-fall.jpg" \
 *     --link "https://indigopalm.co/blog/palm-springs-fall/" \
 *     --board "Palm Springs Travel Guide"
 *
 * Usage (with env var token override):
 *   PINTEREST_ACCESS_TOKEN=xxx node create-pin.js --title ...
 *
 * Credentials are read from ~/.claude/pinterest_credentials.json (created by setup.js)
 * or from PINTEREST_ACCESS_TOKEN env var.
 *
 * Image: can be a public URL (image_url) or a local file path (image_base64).
 * Pass --image-url for URL-hosted images (easiest) or --image-path for local files.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const PINTEREST_API = 'https://api.pinterest.com/v5';
const CREDS_PATH    = path.join(os.homedir(), '.claude', 'pinterest_credentials.json');

// ── Parse CLI args ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return args;
}

const args = parseArgs(process.argv);

// ── Resolve token ─────────────────────────────────────────────────────────────
function getToken() {
  if (process.env.PINTEREST_ACCESS_TOKEN) return process.env.PINTEREST_ACCESS_TOKEN;
  if (fs.existsSync(CREDS_PATH)) {
    try {
      const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
      if (creds.access_token) return creds.access_token;
    } catch {
      // fall through
    }
  }
  return null;
}

// ── Resolve board ID ──────────────────────────────────────────────────────────
function getBoardId(boardName) {
  // If it looks like a numeric ID already, use it directly
  if (/^\d+$/.test(boardName)) return boardName;

  try {
    const boardsPath = new URL('./boards.json', import.meta.url);
    const map = JSON.parse(fs.readFileSync(boardsPath, 'utf8'));
    if (map[boardName]) return map[boardName];
  } catch {
    // boards.json not found
  }
  return null;
}

// ── Build media_source ────────────────────────────────────────────────────────
function buildMediaSource(imageUrl, imagePath) {
  if (imageUrl) {
    return { source_type: 'image_url', url: imageUrl };
  }
  if (imagePath) {
    const resolved = path.resolve(imagePath);
    if (!fs.existsSync(resolved)) throw new Error(`Image file not found: ${resolved}`);
    const ext = path.extname(resolved).slice(1).toLowerCase();
    const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
    const data = fs.readFileSync(resolved).toString('base64');
    return { source_type: 'image_base64', content_type: mime, data };
  }
  throw new Error('Provide --image-url or --image-path');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { title, description, imageUrl, imagePath, link, board } = args;

  // Validate required fields
  const missing = [];
  if (!title)                      missing.push('--title');
  if (!description)                missing.push('--description');
  if (!imageUrl && !imagePath)     missing.push('--image-url or --image-path');
  if (!link)                       missing.push('--link');
  if (!board)                      missing.push('--board');

  if (missing.length) {
    console.error('\nMissing required arguments:', missing.join(', '));
    console.error('\nUsage:');
    console.error('  node create-pin.js \\');
    console.error('    --title "Your Title" \\');
    console.error('    --description "Your description..." \\');
    console.error('    --image-url "https://..." \\');
    console.error('    --link "https://indigopalm.co/blog/your-post/" \\');
    console.error('    --board "Palm Springs Travel Guide"\n');
    process.exit(1);
  }

  // Token
  const token = getToken();
  if (!token) {
    console.error('\nNo access token found.');
    console.error('Run setup.js first, or set PINTEREST_ACCESS_TOKEN env var.\n');
    process.exit(1);
  }

  // Board ID
  const boardId = getBoardId(board);
  if (!boardId) {
    console.error(`\nBoard not found: "${board}"`);
    console.error('Run setup.js or get-boards.js to refresh boards.json, or pass the numeric board ID directly with --board.\n');
    process.exit(1);
  }

  // Media source
  let mediaSource;
  try {
    mediaSource = buildMediaSource(imageUrl, imagePath);
  } catch (err) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }

  const body = {
    title:        title.slice(0, 100),       // Pinterest limit: 100 chars
    description:  description.slice(0, 500), // Pinterest limit: 500 chars
    link,
    board_id:     boardId,
    media_source: mediaSource,
  };

  console.log(`\nPosting pin to board "${board}" (${boardId})...`);

  const res = await fetch(`${PINTEREST_API}/pins`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`\nPinterest API error (${res.status}):`);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`\nPin created successfully.`);
  console.log(`  Pin ID:  ${data.id}`);
  console.log(`  Board:   ${board}`);
  console.log(`  Title:   ${data.title || title}`);
  console.log(`  Link:    ${data.link || link}`);
  console.log(`  View at: https://www.pinterest.com/pin/${data.id}/\n`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
