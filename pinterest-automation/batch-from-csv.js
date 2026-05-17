#!/usr/bin/env node
/**
 * Pinterest API v5 — Batch pin creation from CSV
 *
 * Usage:
 *   node batch-from-csv.js path/to/pins.csv [--dry-run] [--delay 3000]
 *
 * CSV format (matches pinterest_master_upload.csv):
 *   title, description, link, board, media_url
 *
 * Options:
 *   --dry-run    Print what would be posted without hitting the API
 *   --delay      Milliseconds between posts (default: 3000 — avoids rate limiting)
 *   --board      Override board for all rows (useful for testing a single board)
 *
 * Credentials: ~/.claude/pinterest_credentials.json (from setup.js)
 *              or PINTEREST_ACCESS_TOKEN env var
 *
 * Results are saved to pinterest-automation/output/batch-results-[timestamp].json
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const PINTEREST_API = 'https://api.pinterest.com/v5';
const CREDS_PATH    = path.join(os.homedir(), '.claude', 'pinterest_credentials.json');

// ── Parse CLI args ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    } else {
      args.positional.push(argv[i]);
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const csvPath  = args.positional[0];
const dryRun   = !!args.dryRun;
const delayMs  = parseInt(args.delay || '3000', 10);
const boardOverride = args.board || null;

if (!csvPath) {
  console.error('\nUsage: node batch-from-csv.js path/to/pins.csv [--dry-run] [--delay 3000]\n');
  process.exit(1);
}

// ── Token ─────────────────────────────────────────────────────────────────────
function getToken() {
  if (process.env.PINTEREST_ACCESS_TOKEN) return process.env.PINTEREST_ACCESS_TOKEN;
  if (fs.existsSync(CREDS_PATH)) {
    try {
      const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
      if (creds.access_token) return creds.access_token;
    } catch { /* fall through */ }
  }
  return null;
}

// ── Board map ─────────────────────────────────────────────────────────────────
function getBoardMap() {
  try {
    const boardsPath = path.join(__dirname, 'boards.json');
    return JSON.parse(fs.readFileSync(boardsPath, 'utf8'));
  } catch {
    return {};
  }
}

function resolveBoardId(boardName, boardMap) {
  if (/^\d+$/.test(boardName)) return boardName;
  return boardMap[boardName] || null;
}

// ── CSV parser (no external deps) ────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').replace(/^"|"$/g, '');
    });
    return row;
  }).filter(row => row.title || row.description); // skip blank rows
}

// ── Post a single pin ─────────────────────────────────────────────────────────
async function postPin(token, { title, description, link, boardId, mediaUrl }) {
  const body = {
    title:        title.slice(0, 100),
    description:  description.slice(0, 500),
    link,
    board_id:     boardId,
    media_source: {
      source_type: 'image_url',
      url:         mediaUrl,
    },
  };

  const res = await fetch(`${PINTEREST_API}/pins`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Read and parse CSV
  const resolved = path.resolve(csvPath);
  if (!fs.existsSync(resolved)) {
    console.error(`\nCSV file not found: ${resolved}\n`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(resolved, 'utf8'));
  console.log(`\nLoaded ${rows.length} pins from ${resolved}`);

  const token    = getToken();
  const boardMap = getBoardMap();

  if (!dryRun && !token) {
    console.error('\nNo access token found. Run setup.js first or set PINTEREST_ACCESS_TOKEN.\n');
    process.exit(1);
  }

  if (dryRun) console.log('\nDRY RUN — no pins will be posted.\n');

  const results = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const boardName = boardOverride || row.board;
    const boardId   = resolveBoardId(boardName, boardMap);
    const mediaUrl  = row.media_url || row.image_url;

    console.log(`\n[${i + 1}/${rows.length}] "${row.title}"`);
    console.log(`  Board:     ${boardName}${boardId ? ` (${boardId})` : ' — NOT FOUND'}`);
    console.log(`  Image URL: ${mediaUrl || 'MISSING'}`);
    console.log(`  Link:      ${row.link}`);

    if (dryRun) {
      results.push({ status: 'dry-run', title: row.title, board: boardName });
      continue;
    }

    if (!boardId) {
      console.warn(`  SKIPPED — board not in boards.json. Run setup.js to refresh.`);
      results.push({ status: 'skipped', reason: 'board not found', title: row.title, board: boardName });
      continue;
    }

    if (!mediaUrl) {
      console.warn(`  SKIPPED — no media_url in CSV row.`);
      results.push({ status: 'skipped', reason: 'no media_url', title: row.title });
      continue;
    }

    try {
      const pin = await postPin(token, {
        title:       row.title,
        description: row.description,
        link:        row.link,
        boardId,
        mediaUrl,
      });
      console.log(`  Posted: ${pin.id} — https://www.pinterest.com/pin/${pin.id}/`);
      results.push({ status: 'posted', pinId: pin.id, title: row.title, board: boardName });
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ status: 'failed', error: err.message, title: row.title, board: boardName });
    }

    if (i < rows.length - 1) await sleep(delayMs);
  }

  // Save results
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `batch-results-${ts}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  const posted  = results.filter(r => r.status === 'posted').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed  = results.filter(r => r.status === 'failed').length;

  console.log(`\nDone.`);
  console.log(`  Posted:  ${posted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Results: ${outPath}\n`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
