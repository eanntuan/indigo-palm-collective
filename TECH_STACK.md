# Indigo Palm Collective — Tech Stack & Infrastructure

Last updated: July 11, 2026

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

**Git remote:** `https://github.com/eanntuan/indigo-palm-collective.git`
*(repo renamed from `desert-edit-properties`; switched from SSH to HTTPS on March 20, 2026)*

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
| POST | `/api/confirm` | Confirms booking after payment |
| GET | `/api/discount` | Validates a promo code against KV |
| GET | `/api/calendar/[slug].ics` | Direct-booking iCal feed for a property (subscribe in Airbnb/Hospitable) |
| POST | `/api/lease` | Creates a lease (The Well long-term rental) |
| GET | `/api/lease` | Fetches a lease by id |
| POST | `/api/lease/sign` | Records tenant e-signature on a lease |
| GET | `/api/auth` | GitHub OAuth start — Decap/Sveltia CMS login |
| GET | `/api/callback` | GitHub OAuth callback — CMS login |
| POST | `/api/webhook/square` | Square payment webhook |
| POST | `/api/webhook/hostaway` | Hostaway webhook (guest messages → inbox) |
| GET | `/inbox` | PWA guest-message inbox dashboard |
| GET | `/manifest.json`, `/sw.js` | PWA manifest + service worker |
| GET/POST | `/api/vapid-public-key`, `/api/push-subscribe` | Web push notification setup |
| GET | `/api/approve-reply` / POST | Approve/send a drafted guest reply from the inbox |
| GET | `/api/discard-reply` | Discard a drafted guest reply |
| GET | `/qb-callback` | QuickBooks OAuth callback (manual token exchange) |
| — | `/api/test-push`, `/api/test-email`, `/api/test-guest-message`, `/api/email-log`, `/api/push-sub-status`, `/api/simulate-inbound` | Debug/test utilities, not guest-facing |

All other paths pass through to GitHub Pages.

### KV Namespaces

| Binding | ID | Purpose |
|---|---|---|
| `DISCOUNT_CODES` | `150397b0fcfc4772b72ec92b282872e2` | Single-use promo codes |
| `BOOKINGS` | `adf84125eb4b4a528e74f70fe721c057` | Pending/approved booking records |

Cron triggers: `0 9 * * *` (daily) and `*/10 * * * *` (every 10 min) — see `[triggers]` in `wrangler.toml`.

### Secrets (set via `wrangler secret put`, scoped to `indigo-palm-api`)
- `ANTHROPIC_API_KEY` — AI-drafted guest replies in the inbox
- `HOSTAWAY_CLIENT_ID` / `HOSTAWAY_CLIENT_SECRET` — PMS API + webhook auth
- `PINTEREST_ACCESS_TOKEN` — Pinterest ad account API (app id 1566200, ad account 549770218152)
- `RESEND_API_KEY` — transactional email
- `PRICELABS_API_KEY` — dynamic pricing
- `SQUARE_ACCESS_TOKEN` — payment links (production)
- `GITHUB_CLIENT_ID`/secret — CMS OAuth (client id has a code fallback, not solely secret-based)

---

## Key Frontend Files

| File | Purpose |
|---|---|
| `index.html` | Homepage (FAQ accordion, Google share link, schema markup) |
| `cozy-cactus/index.html`, `terra-luz/index.html`, `ps-retreat/index.html`, `the-well/index.html` | Real property pages, served at clean URLs (e.g. `/cozy-cactus/`) |
| `cozy-cactus.html`, `terra-luz.html`, `ps-retreat.html`, `the-well.html`, `casa-moto.html` | Root-level **redirect stubs** to the clean-URL property pages above — not the actual page content |
| `cozy-cactus/farewell.html`, `cozy-cactus/welcome-guide.html`, `cozy-cactus/welcome-book.pdf` | Post-booking guest content per property |
| `festivalguide.html` | Coachella/Stagecoach festival guide (indigopalm.co/festivalguide) |
| `404.html` | Custom branded 404 error page |
| `booking-flow.html` / `.js`, `book.html`, `booking-widget.html`, `book-casa-moto.html` | Booking request form + widget variants |
| `booking-config.js` | Property config (names, IDs, bedrooms, bathrooms, maxGuests, pricing) — source of truth for property facts |
| `checkout.html` | Guest checkout/payment page |
| `admin-approve.html` | Host-only approval page for booking requests (link in host email) |
| `admin-send.html` | Host tool: send booking confirmation |
| `admin-lease.html`, `lease.html` | Send/view long-term rental agreement (The Well) |
| `dashboard.html` / `dashboard-script.js` | Per-property revenue/analytics dashboard (e.g. Cozy Cactus) |
| `eula.html` | EULA for the internal dashboard |
| `indigo-palm-collective.html`, `casa-collective.html`, `oasis-collective.html`, `palm-house.html`, `desert-house.html` | Alternate all-properties landing pages under different working brand names (SEO/GEO experiments, not the primary homepage) |
| `*.js` at repo root (`import-*`, `migrate-*`, `analyze-*`, `fix-*`, `check-*`) | One-off financial data import/migration/analysis scripts, not part of the live site |
| `quickbooks-functions.js` | Helper functions for QuickBooks integration |
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

### Anthropic / Claude (Guest Message Drafting)
- Worker calls Claude to draft replies to incoming Hostaway guest messages
- Drafts route to auto-send or host-email escalation depending on `messageNeedsEscalation`

### Web Push (PWA Inbox Notifications)
- VAPID-based push; subscribe via `/api/push-subscribe`, key via `/api/vapid-public-key`
- Notifies host of new guest messages needing review at `/inbox`

### QuickBooks (Accounting — OAuth only, no automated sync yet)
- `/qb-callback` currently just displays the OAuth code/realmId for manual token exchange

### Airbnb iCal (Availability)
- Cozy Cactus and Terra Luz use Hostaway as `availabilitySource` (see `booking-config.js`)
- The Sundune and The Well pull availability directly from an iCal URL (`icalUrl` in `booking-config.js`)
- Parsed server-side; blocked dates returned to frontend calendar
- Direct-booking iCal feed also served outbound at `/api/calendar/[slug].ics` for subscribing in Airbnb/Hospitable

### Hostaway (PMS)
- Availability source for Cozy Cactus and Terra Luz
- Webhook (`/api/webhook/hostaway`) receives incoming guest messages, drafts an AI reply via Claude (Anthropic API), and either auto-sends or escalates to email for host review
- Replies/approvals surfaced in the `/inbox` PWA dashboard
- `/api/confirm` creates a Hostaway reservation on direct-booking confirmation to block the calendar (Cozy Cactus + Terra Luz only; The Sundune + The Well use the iCal store instead)

---

## Booking Flow

```
Guest fills form
  → Selects property, dates, guests
  → Optional: pool heat (Terra Luz only, $75 per day, 2 night minimum, flat $400 for 7+ nights)
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

POST /api/confirm (called once payment is confirmed)
  → Sends "You're booked" email to guest + confirmation notice to host
  → Blocks the calendar: creates a Hostaway reservation (Cozy Cactus + Terra Luz) or adds to the iCal store (The Sundune + The Well)
```

---

## Marketing & Social Media

### Pinterest (Active — as of June 2026, Eann-owned)
**Owner:** Eann (transitioned off Sabbir; posting Pinterest herself)
**Sabbir's scope now:** Quora + GEO/AI-search seeding + Goodreads only (no longer Pinterest)
**Sabbir rate:** $9/hr, hours unlimited as of June 3, 2026 (previously capped at 15 hrs/week)
**Contact:** sabbirahmed31dec@gmail.com

**Strategy:**
- Links: use **Airbnb listing links** until 25–30K monthly views, then switch to `indigopalm.co`
- Target pace: 4–5 pins/day (Eann)
- See `sabbir_persona` memory for full Pinterest/GEO/Quora playbook

**Property priority:**
1. Cozy Cactus — families/kids angle, amenities (bunk beds, changing table, hot tub, family kit)
2. Terra Luz — private pool + spa, Latin cultural vibe
3. The Sundune (`ps-retreat`) — photo shoot complete, active
4. The Well — lowest priority (long-term rental, not short-term marketed)

**Seasonal event pins to front-load:**
- BNP Paribas Open (March)
- Coachella + Stagecoach (April)
- Lacrosse tournament (January)

---

### Instagram (Planned)
- One account for all properties (not per-property)
- Strategy: reels > static posts (algorithm favors video)
- Needs Eann on camera for face-to-camera content
- Pinterest > Meta for paid campaigns (less ad saturation in STR niche)
- Not yet started — pending Pinterest foundation

---

## Property IDs

| ID | Name | Location | Beds/Baths | Max Guests |
|---|---|---|---|---|
| `cozy-cactus` | The Cozy Cactus | Indio, CA | 3 bed / 2 bath | 8 |
| `terra-luz` | Terra Luz (formerly Casa Moto) | Indio, CA | 3 bed / 2 bath | 8 |
| `ps-retreat` | The Sundune (slug is legacy `ps-retreat`) | Palm Springs, CA | 2 bed / 2 bath | 4 |
| `the-well` | The Well | Palm Springs, CA | 1 bed / 1 bath | 2 |

Source of truth: `booking-config.js` → `PROPERTIES`.
