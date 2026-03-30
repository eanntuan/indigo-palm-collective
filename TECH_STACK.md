# Indigo Palm Collective — Tech Stack & Infrastructure

Last updated: March 20, 2026

---

## Hosting & Deployment

| Layer | Service | Notes |
|---|---|---|
| Frontend | **GitHub Pages** | Auto-deploys on push to `main` |
| API / Backend | **Cloudflare Workers** | Intercepts `indigopalm.co/api/*` before Pages |
| DNS | **Cloudflare** | Orange-cloud proxying enabled on indigopalm.co |
| Domain | indigopalm.co | Registered, pointed to Cloudflare |

**Deploy command:**
```bash
# Frontend — just push to GitHub
git push origin main

# Worker — from api-worker/
CLOUDFLARE_API_TOKEN=<token> wrangler deploy
```

**Git remote:** `https://github.com/eanntuan/desert-edit-properties.git`
*(switched from SSH to HTTPS on March 20, 2026)*

---

## Cloudflare Worker

**Name:** `indigo-palm-api`
**File:** `api-worker/index.js`
**Config:** `api-worker/wrangler.toml`
**Route:** `indigopalm.co/api/*`

### API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/availability` | Fetches blocked dates from Airbnb iCal feed |
| GET | `/api/pricing` | Calculates nightly price via PriceLabs + peak multipliers |
| POST | `/api/booking` | Stores booking in KV, sends host + guest emails |
| GET | `/api/booking` | Fetches a booking by id + token (for admin page) |
| POST | `/api/approve` | Host approval: generates Square link, emails guest |
| GET | `/api/discount` | Validates a promo code against KV |

### KV Namespaces

| Binding | ID | Purpose |
|---|---|---|
| `DISCOUNT_CODES` | `150397b0fcfc4772b72ec92b282872e2` | Single-use promo codes |
| `BOOKINGS` | `adf84125eb4b4a528e74f70fe721c057` | Pending/approved booking records |

### Secrets (set via `wrangler secret put`)
- `RESEND_API_KEY` — transactional email
- `PRICELABS_API_KEY` — dynamic pricing
- `SQUARE_ACCESS_TOKEN` — payment links (production)

---

## Key Frontend Files

| File | Purpose |
|---|---|
| `index.html` | Homepage (FAQ accordion, Google share link, schema markup) |
| `cozy-cactus.html` | Property page — The Cozy Cactus |
| `terra-luz.html` | Property page — Terra Luz (formerly Casa Moto) |
| `ps-retreat.html` | Property page — PS Retreat |
| `the-well.html` | Property page — The Well |
| `festivalguide.html` | Coachella/Stagecoach festival guide (indigopalm.co/festivalguide) |
| `404.html` | Custom branded 404 error page |
| `booking-flow.html` | Booking request form |
| `booking-flow.js` | Booking form logic (property select, calendar, pricing, pool heat, promo) |
| `booking-config.js` | Property config (names, IDs, bedrooms, bathrooms, maxGuests, pricing) |
| `admin-approve.html` | Host-only approval page (accessed via link in host email) |
| `sitemap.xml` | XML sitemap — all pages with clean URLs (no .html) |
| `robots.txt` | Allows all crawlers, references sitemap |
| `TECH_STACK.md` | This file |
| `CHANGELOG.md` | Dated log of all site changes |
| `CLAUDE.md` | Instructions for Claude |
| `blog/` | Blog posts — each post in its own folder as index.html (clean URLs) |
| `email-images/` | Property hero photos used in booking form cards |

---

## Third-Party Integrations

### Resend (Email)
- From: `Bookings @ Indigo Palm Co <bookings@indigopalm.co>`
- Sends: guest confirmation, host new-booking alert, guest payment link
- Docs: resend.com

### Square (Payments)
- Order API with itemized line items
- Line items: accommodation, cleaning fee, taxes, pool heat, 3% CC fee
- Discounts applied as order-level discounts
- Location ID: `LNN3GFNQ81ZQC`
- Dashboard: developer.squareup.com

### PriceLabs (Dynamic Pricing)
- Fetches per-night prices for each property
- Fallback: base price + peak date multipliers hardcoded in worker
- Listings mapped by Hostaway/Airbnb listing ID

### Airbnb iCal (Availability)
- Each property has an iCal feed URL in `ICAL_URLS` in the worker
- Parsed server-side; blocked dates returned to frontend calendar

### Hostaway (PMS)
- Current use: iCal feed source for availability
- TODO: Use Hostaway API to create reservations and block calendar on booking confirmation

---

## Booking Flow (as of March 2026)

```
Guest fills form
  → Selects property, dates, guests
  → Optional: pool heat (Casa Moto only, $75/night or $400/week)
  → Optional: promo code
  → Submits

POST /api/booking
  → Validates discount code (does NOT consume yet)
  → Stores booking in BOOKINGS KV with unique id + token
  → Emails host: booking details + "Review & Approve" link
  → Emails guest: "The desert's holding your spot." (no payment link yet)

Host opens admin-approve.html?id=...&token=...
  → Reviews booking
  → Can override total or add flat discount
  → Hits "Send Payment Link"

POST /api/approve
  → Consumes discount code in KV
  → Calculates final total (Zelle amount)
  → Generates Square payment link (total + 3% CC fee as line item)
  → Emails guest: "Your dates are approved." with Square link + Zelle info
  → Marks booking as approved in KV

Guest pays:
  → Via Square (card, 3% fee)
  → Via Zelle to 214-606-1340 (MPT Industries), no fee

TODO: After payment confirmed → send "You're Booked" email + create Hostaway reservation
```

---

## Marketing & Social Media

### Pinterest (Active — March 2026)
**VA:** Sabbir Ahmed (Upwork: `upwork.com/freelancers/~01fa0f08c353e1c795`)
**Rate:** $9/hr, 15 hrs/week (~$540/month), manual time logging enabled
**Contact:** sabbirahmed31dec@gmail.com (Drive/general) | alennsabbir@gmail.com (Canva)

**Access shared:**
- Pinterest: login credentials shared via Upwork
- Canva: invited as team admin at alennsabbir@gmail.com
- Google Drive: photos folder shared at sabbirahmed31dec@gmail.com (organized by property/room)

**Strategy:**
- Phase 1 (weeks 1–2): 4 pins/day, front-load to build healthy profile (all metrics green)
- Discovery pins: multiple room/angle variations per property
- Conversion pins: CTA-focused, booking-intent copy
- Links: use **Airbnb listing links** until 25–30K monthly views, then switch to `indigopalm.co`
- Low season = Pinterest machine learning phase; position for high season wins
- Weekly Canva drafts shared on Upwork for review before publishing
- 15-day analytics spreadsheet delivered by Sabbir

**Property priority:**
1. Cozy Cactus — families/kids angle, amenities (bunk beds, changing table, hot tub, family kit)
2. Terra Luz — private pool + spa, Latin cultural vibe
3. PS Retreat / The Sundune — pending photo shoot (May/June 2026), lower priority now
4. The Well — lowest priority (currently on 9-month MTR)

**Seasonal event pins to front-load:**
- BNP Paribas Open (March)
- Coachella + Stagecoach (April)
- Lacrosse tournament (January)

**Behind-the-scenes photos:** Work on Pinterest — Sabbir can AI-enhance rough/work-in-progress shots

---

### Instagram (Planned)
- One account for all properties (not per-property)
- Sabbir can manage alongside Pinterest
- Strategy: reels > static posts (algorithm favors video)
- Needs Eann on camera for face-to-camera content (Sabbir will script reel ideas)
- Pinterest > Meta for paid campaigns (less ad saturation in STR niche)
- Not yet started — pending Pinterest foundation

---

## Property IDs

| ID | Name | Location | Beds/Baths | Max Guests |
|---|---|---|---|---|
| `cozy-cactus` | The Cozy Cactus | Indio, CA | 3 bed / 2 bath | 8 |
| `terra-luz` | Terra Luz (formerly Casa Moto) | Indio, CA | 3 bed / 2 bath | 8 |
| `ps-retreat` | PS Retreat | Palm Springs, CA | 2 bed / 2 bath | 4 |
| `the-well` | The Well | Palm Springs, CA | 1 bed / 1 bath | 8 |
