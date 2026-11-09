// Static checks for the guest pay page (pay/index.html). Run: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(ROOT, 'pay/index.html'), 'utf8');

test('pay page is private, uses Square-hosted card fields, and never handles raw card data', () => {
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /web\.squarecdn\.com\/v1\/square\.js/);
  assert.match(html, /sandbox\.web\.squarecdn\.com/);
  assert.match(html, /card\.tokenize\(\)/);
  // no hand-rolled card inputs (card entry is Square's hosted iframe)
  assert.doesNotMatch(html, /<input[^>]*(cc-number|cardnumber|card-number|cvv|cvc)/i);
  assert.doesNotMatch(html, /localStorage|sessionStorage/);
});

test('the charge button stays disabled until the guest ticks the consent box', () => {
  assert.match(html, /<input type="checkbox" id="consent">/);
  assert.match(html, /<button id="pay" disabled>/);
  assert.match(html, /pay\.disabled = !consent\.checked/);
  // consent is sent to the server, which rejects requests without it
  assert.match(html, /consent: needsConsent\(\)/);
  assert.match(html, /needsConsent = \(\) => mode === 'update' \|\| plan === 'split'/);
});

test('guest can choose to pay in full instead of splitting', () => {
  assert.match(html, /Pay in full today/);
  assert.match(html, /plan: mode === 'enroll' \? plan : undefined/);
});

test('guest-visible values are written with textContent (no HTML injection)', () => {
  assert.match(html, /textContent/);
  assert.doesNotMatch(html, /innerHTML\s*=\s*[^'"\s]/); // only the harmless innerHTML = '' reset
});

test('worker cron: the autopay job is tied to the existing 09:00 UTC daily trigger', () => {
  const toml = readFileSync(path.join(ROOT, 'api-worker/wrangler.toml'), 'utf8');
  assert.match(toml, /crons = \[[^\]]*"0 9 \* \* \*"/);
});
