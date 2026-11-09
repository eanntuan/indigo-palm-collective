// Payment & cancellation wording consistency. Run: npm test   (node:test)
//
// Guards the guest-facing policy: card (+3% fee) or 50% Zelle upfront, balance
// due 60 days before check-in, $300 refundable security deposit, and a
// 60-day full-refund cancellation window.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

test('FAQ page: payment and cancellation answers (visible text and JSON-LD)', () => {
  const html = read('book-direct/index.html');

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const ld = blocks.find(b => b['@type'] === 'FAQPage');
  assert.ok(ld, 'FAQPage JSON-LD present and valid JSON');
  const answers = Object.fromEntries(ld.mainEntity.map(q => [q.name, q.acceptedAnswer.text]));

  const pay = answers['How does payment work?'];
  const cancel = answers["What's the cancellation policy?"];
  assert.ok(pay && cancel, 'both FAQ entries exist in JSON-LD');

  for (const t of [pay]) {
    assert.match(t, /3% card processing fee/);
    assert.match(t, /50% of the total by Zelle/);
    assert.match(t, /60 days before check-in/);
    assert.match(t, /\$300 refundable security deposit/);
  }
  assert.match(cancel, /60 or more days before check-in for a full refund/);
  assert.match(cancel, /non-refundable/);
  assert.match(cancel, /\$300 security deposit/);

  // The visible FAQ answers match the structured data word for word.
  assert.ok(html.includes(`<p>${pay}</p>`), 'visible payment answer matches JSON-LD');
  assert.ok(html.includes(`<p>${cancel}</p>`), 'visible cancellation answer matches JSON-LD');
});

test('lease page, booking flow and lease emails carry the same terms', () => {
  const pages = {
    'lease.html': read('lease.html'),
    'booking-flow.html': read('booking-flow.html'),
    'booking-flow.js': read('booking-flow.js'),
    'api-worker/index.js': read('api-worker/index.js'),
  };
  for (const [name, src] of Object.entries(pages)) {
    assert.match(src, /60 days before check-in/, `${name}: balance due 60 days before check-in`);
    assert.match(src, /3%/, `${name}: 3% card fee`);
    assert.match(src, /50%/, `${name}: 50% Zelle upfront`);
    assert.doesNotMatch(src, /No refund after, except/i, `${name}: old cancellation wording removed`);
  }
  assert.match(pages['lease.html'], /\$300 refundable security deposit/);
  assert.match(pages['booking-flow.html'], /\$300 refundable security deposit/);
});

test('new-lease defaults use the $300 security deposit', () => {
  assert.match(read('admin-lease.html'), /id="deposit"[^>]*value="300"/);
  assert.match(read('api-worker/index.js'), /deposit: parseFloat\(deposit\) \|\| 300,/);
});
