// Pricing tests. Run: npm test   (node:test, no extra dependencies)
//
// Covers The Sundune (ps-retreat) flat pricing across every pricing entry
// point, plus regression checks that the other properties are unchanged.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  PROPERTY_CONFIG, buildQuote, calcCardFee, roundCents, isFlatPricing,
} from '../api-worker/pricing-core.js';
import worker from '../api-worker/index.js';
import { onRequestGet as pagesPricing } from '../functions/api/pricing.js';
import { PROPERTIES, calculateBookingPrice } from '../booking-config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── fetch stub: records outbound calls, answers PriceLabs with fixed prices ──

let fetchCalls;
let priceLabsResponder;
const realFetch = globalThis.fetch;

function eachDate(checkIn, checkOut) {
  const out = [];
  const cur = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  while (cur < end) { out.push(cur.toISOString().slice(0, 10)); cur.setUTCDate(cur.getUTCDate() + 1); }
  return out;
}

beforeEach(() => {
  fetchCalls = [];
  priceLabsResponder = null; // null → PriceLabs returns HTTP 500 (forces fallback)
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    fetchCalls.push({ url, body: init.body ? JSON.parse(init.body) : null });
    if (url.includes('pricelabs') && priceLabsResponder) {
      const { listings: [l] } = JSON.parse(init.body);
      return new Response(JSON.stringify([priceLabsResponder(l)]), { status: 200 });
    }
    return new Response('{}', { status: 500 });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const priceLabsCalls = () => fetchCalls.filter(c => c.url.includes('pricelabs'));

// PriceLabs/"screenshot" style override: $512 every night, 7-night minimum.
const overridePrices = (l) => ({
  id: l.id,
  data: eachDate(l.dateFrom, l.dateTo).map(date => ({ date, price: 512, min_stay: 7 })),
});

const ENV = { PRICELABS_API_KEY: 'test-key' };

async function workerPricing(property, checkIn, checkOut) {
  const req = new Request(`https://indigopalm.co/api/pricing?property=${property}&checkIn=${checkIn}&checkOut=${checkOut}`);
  const res = await worker.fetch(req, ENV, { waitUntil() {} });
  return { status: res.status, body: await res.json() };
}

async function pagesFnPricing(property, checkIn, checkOut) {
  const request = new Request(`https://indigopalm.co/api/pricing?property=${property}&checkIn=${checkIn}&checkOut=${checkOut}`);
  const res = await pagesPricing({ request, env: ENV });
  return { status: res.status, body: await res.json() };
}

// Extract `const properties = { ... };` from a static HTML page and evaluate it.
function htmlProperties(file) {
  const html = readFileSync(path.join(ROOT, file), 'utf8');
  const m = html.match(/const properties = (\{[\s\S]*?\n {8}\});/);
  assert.ok(m, `properties object not found in ${file}`);
  return new Function(`return ${m[1]};`)();
}

// Pre-existing (unrounded) formula used for every non-Sundune property.
const oldTotal = (sub, clean, rate) => sub + clean + (sub + clean) * rate;

function assertSunduneFlat(pricing, nights) {
  assert.equal(pricing.nights, nights);
  assert.equal(pricing.nightly.length, nights);
  for (const n of pricing.nightly) {
    assert.equal(n.rate, 300, `night ${n.date} should be $300`);
    assert.equal(n.peakLabel, null, `night ${n.date} should have no peak label`);
  }
  const subtotal = 300 * nights;
  const tax = roundCents((subtotal + 200) * 0.18);
  assert.equal(pricing.subtotal, subtotal);
  assert.equal(pricing.cleaningFee, 200);
  assert.equal(pricing.taxRate, 0.18);
  assert.equal(pricing.taxAmount, tax);
  assert.equal(pricing.total, roundCents(subtotal + 200 + tax));
}

// ── Acceptance example ───────────────────────────────────────────────────────

describe('Sundune acceptance example: 2027-02-28 → 2027-03-07', () => {
  test('pricing core', () => {
    const q = buildQuote('ps-retreat', '2027-02-28', '2027-03-07');
    assert.equal(q.nights, 7);
    assert.equal(q.subtotal, 2100);
    assert.equal(q.cleaningFee, 200);
    assert.equal(q.taxAmount, 414);
    assert.equal(q.total, 2714);           // Zelle total
    assert.equal(calcCardFee(q.total), 81.42);
    assert.equal(roundCents(q.total + calcCardFee(q.total)), 2795.42); // card total incl. 3%
  });

  test('worker /api/pricing returns $2,714 and never calls PriceLabs', async () => {
    priceLabsResponder = overridePrices; // would be $512/night if consulted
    const { status, body } = await workerPricing('ps-retreat', '2027-02-28', '2027-03-07');
    assert.equal(status, 200);
    assertSunduneFlat(body.pricing, 7);
    assert.equal(body.pricing.total, 2714);
    assert.equal(priceLabsCalls().length, 0);
  });

  test('Pages Function /api/pricing returns $2,714 and never calls PriceLabs', async () => {
    priceLabsResponder = overridePrices;
    const { status, body } = await pagesFnPricing('ps-retreat', '2027-02-28', '2027-03-07');
    assert.equal(status, 200);
    assertSunduneFlat(body.pricing, 7);
    assert.equal(body.pricing.total, 2714);
    assert.equal(body.pricing.source, 'flat');
    assert.equal(priceLabsCalls().length, 0);
  });

  test('booking-config.js calculateBookingPrice', () => {
    const q = calculateBookingPrice('ps-retreat', new Date('2027-02-28T00:00:00'), new Date('2027-03-07T00:00:00'));
    assert.equal(q.subtotal, 2100);
    assert.equal(q.cleaningFee, 200);
    assert.equal(q.taxAmount, 414);
    assert.equal(q.total, 2714);
  });
});

// ── Flat pricing across ordinary, former override and peak dates ─────────────

const SUNDUNE_STAYS = [
  ['ordinary dates',                         '2027-06-07', '2027-06-11', 4],
  ['former PriceLabs/screenshot-priced dates','2027-02-28', '2027-03-07', 7],
  ['Coachella W1/W2 overlap',                '2026-04-10', '2026-04-20', 10],
  ['Stagecoach',                             '2026-04-24', '2026-05-04', 10],
  ['Thanksgiving',                           '2026-11-25', '2026-11-30', 5],
  ['Holiday season across New Year',         '2026-12-20', '2027-01-04', 15],
];

describe('Sundune is flat $300/night on every date', () => {
  for (const [label, ci, co, nights] of SUNDUNE_STAYS) {
    test(`${label} (${ci} → ${co})`, async () => {
      assertSunduneFlat(buildQuote('ps-retreat', ci, co, overridePricesMap(ci, co)), nights);

      priceLabsResponder = overridePrices;
      const w = await workerPricing('ps-retreat', ci, co);
      assert.equal(w.status, 200);
      assertSunduneFlat(w.body.pricing, nights);

      const p = await pagesFnPricing('ps-retreat', ci, co);
      assert.equal(p.status, 200);
      assertSunduneFlat(p.body.pricing, nights);

      assert.equal(priceLabsCalls().length, 0, 'no PriceLabs request for Sundune');
    });
  }
});

function overridePricesMap(ci, co) {
  return Object.fromEntries(eachDate(ci, co).map(d => [d, 512]));
}

// ── Minimum stay ─────────────────────────────────────────────────────────────

describe('Sundune 4-night minimum is preserved', () => {
  test('3 nights rejected by worker pricing, pages function, and booking request', async () => {
    const w = await workerPricing('ps-retreat', '2027-02-28', '2027-03-03');
    assert.equal(w.status, 400);
    assert.match(w.body.error, /Minimum stay is 4 nights/);

    const p = await pagesFnPricing('ps-retreat', '2027-02-28', '2027-03-03');
    assert.equal(p.status, 400);
    assert.match(p.body.error, /Minimum stay is 4 nights/);

    const req = new Request('https://indigopalm.co/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property: 'The Sundune', propertyId: 'ps-retreat',
        checkIn: '2027-02-28', checkOut: '2027-03-03',
        name: 'Test Guest', email: 'guest@example.com', phone: '555-0100',
      }),
    });
    const res = await worker.fetch(req, ENV, { waitUntil() {} });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /Minimum stay is 4 nights/);

    assert.equal(priceLabsCalls().length, 0);
  });

  test('exactly 4 nights allowed even if PriceLabs would report a 7-night minimum', async () => {
    priceLabsResponder = overridePrices;
    const w = await workerPricing('ps-retreat', '2027-03-01', '2027-03-05');
    assert.equal(w.status, 200);
    assertSunduneFlat(w.body.pricing, 4);
    assert.equal(w.body.pricing.total, 1652); // 4 × $300 + $200 + 18% of $1,400
    assert.equal(w.body.pricing.taxAmount, 252);
    assert.equal(priceLabsCalls().length, 0);
  });

  test('minNights is 4 in every config', () => {
    assert.equal(PROPERTY_CONFIG['ps-retreat'].minNights, 4);
    assert.equal(PROPERTIES['ps-retreat'].minNights, 4);
    const json = JSON.parse(readFileSync(path.join(ROOT, 'pricing.json'), 'utf8'));
    assert.equal(json['ps-retreat'].minNights, 4);
    assert.equal(htmlProperties('booking-widget.html')['ps-retreat'].minNights, 4);
  });
});

// ── Tax and cleaning ─────────────────────────────────────────────────────────

describe('Sundune tax and cleaning', () => {
  test('cleaning is charged once per stay, not per night', () => {
    for (const nights of [4, 5, 10, 30]) {
      const co = new Date(Date.UTC(2027, 5, 1 + nights)).toISOString().slice(0, 10);
      const q = buildQuote('ps-retreat', '2027-06-01', co);
      assert.equal(q.cleaningFee, 200);
      assert.equal(q.subtotal, 300 * nights);
    }
  });

  test('18% applied once to (accommodation + cleaning), rounded to cents', () => {
    const q = buildQuote('ps-retreat', '2027-06-01', '2027-06-06'); // 5 nights
    assert.equal(q.taxAmount, 306);                 // (1500 + 200) × 0.18
    assert.equal(q.total, 2006);
    assert.equal(q.total, q.subtotal + q.cleaningFee + q.taxAmount);
    assert.notEqual(q.total, roundCents((1500 + 200) * 1.18 * 1.18)); // not double-taxed
  });

  test('every config uses $300 / $200 / 18% for Sundune', () => {
    const json = JSON.parse(readFileSync(path.join(ROOT, 'pricing.json'), 'utf8'))['ps-retreat'];
    const sources = {
      'worker':              PROPERTY_CONFIG['ps-retreat'],
      'booking-config.js':   PROPERTIES['ps-retreat'],
      'pricing.json':        json,
      'booking-widget.html': htmlProperties('booking-widget.html')['ps-retreat'],
      'checkout.html':       htmlProperties('checkout.html')['ps-retreat'],
    };
    for (const [name, c] of Object.entries(sources)) {
      assert.equal(c.basePrice, 300, `${name} basePrice`);
      assert.equal(c.cleaningFee, 200, `${name} cleaningFee`);
      assert.equal(c.taxRate, 0.18, `${name} taxRate`);
    }
    assert.deepEqual(json.peakDates, []);
    assert.ok(isFlatPricing('ps-retreat'));
  });

  test('Pages Function has no PriceLabs listing for Sundune', () => {
    const src = readFileSync(path.join(ROOT, 'functions/api/pricing.js'), 'utf8');
    assert.doesNotMatch(src, /'ps-retreat':\s*\{\s*id:/);
    const wsrc = readFileSync(path.join(ROOT, 'api-worker/index.js'), 'utf8');
    assert.doesNotMatch(wsrc, /'ps-retreat':\s*\{\s*id:/);
  });
});

// ── Card fee ─────────────────────────────────────────────────────────────────

test('3% card fee formula unchanged', () => {
  assert.equal(calcCardFee(2714), 81.42);
  assert.equal(calcCardFee(1000), 30);
  assert.equal(calcCardFee(1540), 46.2);
  for (const t of [0, 99.99, 2436, 2610.5, 3333.33]) {
    assert.equal(calcCardFee(t), Math.round(t * 0.03 * 100) / 100);
  }
});

// ── Other properties unchanged ───────────────────────────────────────────────

describe('other properties keep their existing pricing', () => {
  test('Terra Luz and Cozy Cactus cleaning fee is $250 everywhere', () => {
    const json = JSON.parse(readFileSync(path.join(ROOT, 'pricing.json'), 'utf8'));
    const widget = htmlProperties('booking-widget.html');
    const checkout = htmlProperties('checkout.html');
    for (const id of ['cozy-cactus', 'terra-luz', 'casa-moto']) {
      assert.equal(PROPERTY_CONFIG[id].cleaningFee, 250, `worker ${id}`);
    }
    for (const id of ['cozy-cactus', 'terra-luz']) {
      assert.equal(PROPERTIES[id].cleaningFee, 250, `booking-config ${id}`);
    }
    for (const id of ['cozy-cactus', 'casa-moto']) {
      assert.equal(json[id].cleaningFee, 250, `pricing.json ${id}`);
      assert.equal(widget[id].cleaningFee, 250, `booking-widget ${id}`);
      assert.equal(checkout[id].cleaningFee, 250, `checkout ${id}`);
    }
  });

  test('nightly base prices unchanged in every config', () => {
    assert.deepEqual(
      Object.fromEntries(Object.entries(PROPERTY_CONFIG).map(([k, v]) => [k, v.basePrice])),
      { 'cozy-cactus': 250, 'terra-luz': 275, 'casa-moto': 275, 'ps-retreat': 300, 'the-well': 300 },
    );
    assert.equal(PROPERTIES['cozy-cactus'].basePrice, 250);
    assert.equal(PROPERTIES['terra-luz'].basePrice, 225);
    assert.equal(PROPERTIES['the-well'].basePrice, 300);
    const json = JSON.parse(readFileSync(path.join(ROOT, 'pricing.json'), 'utf8'));
    assert.equal(json['cozy-cactus'].basePrice, 250);
    assert.equal(json['casa-moto'].basePrice, 225);
    assert.equal(json['the-well'].basePrice, 300);
    assert.equal(json['cozy-cactus'].peakDates.length, 5);
    for (const f of ['booking-widget.html', 'checkout.html']) {
      const p = htmlProperties(f);
      assert.equal(p['cozy-cactus'].basePrice, 250);
      assert.equal(p['casa-moto'].basePrice, 225);
      assert.equal(p['the-well'].basePrice, 300);
      assert.equal(p['the-well'].cleaningFee, 200);
      assert.equal(p['the-well'].taxRate, 0.135);
    }
  });

  test('worker fallback still applies peak multipliers (Cozy Cactus, Coachella W1)', async () => {
    const { status, body } = await workerPricing('cozy-cactus', '2026-04-10', '2026-04-13');
    assert.equal(status, 200);
    assert.deepEqual(body.pricing.nightly.map(n => n.rate), [375, 375, 375]);
    assert.equal(body.pricing.nightly[0].peakLabel, 'Coachella W1');
    assert.equal(body.pricing.subtotal, 1125);
    assert.equal(body.pricing.cleaningFee, 250);
    assert.equal(body.pricing.total, 1540);
    assert.equal(body.pricing.pricingMode, undefined);
    assert.equal(priceLabsCalls().length, 1, 'non-Sundune properties still query PriceLabs');
  });

  test('worker uses PriceLabs prices and min_stay for Terra Luz', async () => {
    priceLabsResponder = (l) => ({
      id: l.id,
      data: eachDate(l.dateFrom, l.dateTo).map(date => ({ date, price: 333, min_stay: 3 })),
    });
    const ok = await workerPricing('terra-luz', '2027-02-28', '2027-03-03');
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body.pricing.nightly.map(n => n.rate), [333, 333, 333]);
    assert.equal(ok.body.pricing.cleaningFee, 250);
    assert.equal(ok.body.pricing.total, oldTotal(999, 250, 0.12));
    assert.equal(priceLabsCalls()[0].body.listings[0].id, '123633');

    const short = await workerPricing('terra-luz', '2027-02-28', '2027-03-02');
    assert.equal(short.status, 400);
    assert.match(short.body.error, /Minimum stay is 3 nights/);
  });

  test('worker fallback for Terra Luz and The Well on ordinary dates', async () => {
    const tl = await workerPricing('terra-luz', '2027-02-28', '2027-03-07');
    assert.equal(tl.body.pricing.subtotal, 1925);
    assert.equal(tl.body.pricing.total, oldTotal(1925, 250, 0.12));

    const tw = await workerPricing('the-well', '2027-02-28', '2027-03-07');
    assert.equal(tw.body.pricing.subtotal, 2100);
    assert.equal(tw.body.pricing.cleaningFee, 200);
    assert.equal(tw.body.pricing.total, oldTotal(2100, 200, 0.135));
  });

  test('Pages Function still applies PriceLabs/peaks for Cozy Cactus', async () => {
    const fb = await pagesFnPricing('cozy-cactus', '2026-04-10', '2026-04-13');
    assert.equal(fb.body.pricing.source, 'fallback');
    assert.deepEqual(fb.body.pricing.nightly.map(n => n.rate), [375, 375, 375]);
    assert.equal(fb.body.pricing.cleaningFee, 250);

    priceLabsResponder = (l) => ({ id: l.id, data: eachDate(l.dateFrom, l.dateTo).map(date => ({ date, price: 410 })) });
    const pl = await pagesFnPricing('cozy-cactus', '2026-04-10', '2026-04-13');
    assert.equal(pl.body.pricing.source, 'pricelabs');
    assert.deepEqual(pl.body.pricing.nightly.map(n => n.rate), [410, 410, 410]);
  });

  test('booking-config.js calculateBookingPrice unchanged for Cozy Cactus', () => {
    const q = calculateBookingPrice('cozy-cactus', new Date('2027-02-28T00:00:00'), new Date('2027-03-03T00:00:00'));
    assert.equal(q.subtotal, 750);
    assert.equal(q.cleaningFee, 250);
    assert.equal(q.total, oldTotal(750, 250, 0.12));
  });
});
