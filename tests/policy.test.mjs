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
    'booking-flow/index.html': read('booking-flow/index.html'), // the live /booking-flow/ page
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
  assert.match(pages['booking-flow/index.html'], /\$300 refundable security deposit/);
  assert.doesNotMatch(pages['booking-flow/index.html'], /No refund after that, except/);
});

test('booking price box: nightly rate x nights, refundable security deposit, total', () => {
  const js = read('booking-flow.js');
  const render = js.slice(js.indexOf('function renderPriceSummary'));

  assert.match(render, /const SECURITY_DEPOSIT = 300;/);
  assert.match(render, /night\$\{nights !== 1 \? 's' : ''\} &times; \$\$\{allInNightly\}\/night/);
  assert.match(render, /Refundable security deposit/);
  // total = stay (rate x nights, + optional pool heat, - discount) + deposit
  assert.match(render, /const finalTotal = stayTotal \+ SECURITY_DEPOSIT;/);
  // order on screen: nightly line, deposit line, total line
  const iRate = render.indexOf('${allInNightly}/night');
  const iDep = render.indexOf('Refundable security deposit');
  const iTot = render.indexOf('<strong>Total</strong>');
  assert.ok(iRate < iDep && iDep < iTot, 'rate, then deposit, then total');

  // The deposit is display-only: the booking request still sends the stay pricing.
  const submit = js.slice(js.indexOf("fetch('/api/booking'"), js.indexOf("fetch('/api/booking'") + 900);
  assert.doesNotMatch(submit, /SECURITY_DEPOSIT/);
  assert.match(submit, /pricing: pricingPayload/);
});

test('live booking page loads the updated script', () => {
  assert.match(read('booking-flow/index.html'), /booking-flow\.js\?v=14/);
});

test('new-lease defaults use the $300 security deposit', () => {
  assert.match(read('admin-lease.html'), /id="deposit"[^>]*value="300"/);
  assert.match(read('api-worker/index.js'), /deposit: parseFloat\(deposit\) \|\| 300,/);
});

test('guest emails do not use a vertical accent bar on the host note', () => {
  const src = readFileSync(new URL('../api-worker/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\$\{notesToGuest \? `<div[^`]*border-left/);
  assert.doesNotMatch(src, /\$\{notes \? `<div[^`]*border-left/);
});

test('guest-facing buttons are pill shaped like the site buttons', () => {
  const src = readFileSync(new URL('../api-worker/index.js', import.meta.url), 'utf8');
  for (const label of ['Pay by Card', 'Split payment by card', 'Review and Sign Agreement']) {
    const m = src.match(new RegExp(`<a [^>]*style="[^"]*"[^>]*>${label}`));
    assert.ok(m, label);
    assert.match(m[0], /border-radius:999px/, label);
  }
  const pay = readFileSync(new URL('../pay/index.html', import.meta.url), 'utf8');
  assert.match(pay, /button \{[^}]*border-radius:999px/);
});
