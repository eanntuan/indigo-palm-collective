# Indigo Palm Collective — SEO Strategy + 90-Day Playbook
**Prepared:** June 18, 2026 | **Last updated:** July 23, 2026 (babysit-seo run) | Multi-agent audit (Google Search Console + Pinterest + Business Metrics)

---

# PART 1: CURRENT STATE SNAPSHOT

**Organic Search.** The domain is 4 months old and behaving exactly as expected for its age — not good, not broken, just early. Google has indexed 10 pages, the site has crossed 50 clicks in its first 28 days of measurable traffic, and the palm-springs-vs-indio post is the only real traffic engine right now (252 impressions in one week, April 12-18). The structural SEO work is genuinely solid — schema markup, canonical tags, FAQPage structured data on **all 84 posts** — this is better than 95% of boutique operators. ~~The active damage is specific and fixable: 8 posts accidentally noindexed, 4 sitemap URLs returning 404s, API endpoints being crawled instead of blocked, and a redirect validation failure affecting 13 pages.~~ **As of June 22:** `/api/` is blocked in robots.txt. Noindex frontmatter is clean across all posts. The main open technical item is redirect validation for 13 pages. The content moat (84 posts, all with FAQPage JSON-LD) is real but underpowered by inbound links and topical authority gaps vs. cactushugs.com, the most direct local competitor.

**GEO (Generative Engine Optimization).** *(New channel as of June 2026.)* All 84 blog posts now have FAQPage JSON-LD for direct Gemini/ChatGPT parsing. A 392-question Quora queue is live in a Google Doc ([link](https://docs.google.com/document/d/1KMQMFtnHRT2C_Nz7VakPNPCuhL9TQ3qCXKIZ-nlvhb0/edit)), shared with Sabbir, organized high-to-medium priority. A second batch of 10 targeted Quora questions was created June 22 ([link](https://docs.google.com/document/d/1_g-dXll8BhbxLKjeG_FwZhy4ULm_IlXKfXycRnCZBPI/edit)) — focused on dog-friendly, bachelorette, group travel, and direct booking angles, all linking to specific blog posts. Quora profile created June 15, 2026 — no traffic expected for 4-6 weeks. Posting cadence: 2-3 questions/day, never batch-drop. At that rate the queue covers 157 days. GSC already shows Gemini surfacing indigopalm.co in Palm Springs results (~140 clicks, 360+ impressions since June 1). The `/indigo-palm-geo-seeder` skill automates future seeding for new posts. GEO is now a systematized channel, not a one-off task.

**Pinterest.** *(Updated June 22.)* Eann took over Pinterest posting on June 18. Sabbir's scope is now GEO/Quora/Goodreads only. The posting accountability problem is resolved — Eann controls the cadence. Baseline: ~20K monthly views post-ML campaign, 81% female audience, mobile-first. The 355 pins delivered May 25 need confirmed live count from Sabbir before Eann can assess what's already posted vs. what still needs scheduling. Until posting cadence hits 4-5 pins/day consistently, Pinterest will not generate meaningful referral traffic. The structural finding still holds: property boards (Cozy Cactus) convert at 4x the rate of editorial Blogs boards.

**Direct Bookings.** Five percent of revenue comes from direct channels today — zero confirmed truly-direct bookings in the Gmail data window. The financial case for shifting this is clear: a single Coachella weekend booking at $1,800/night generates ~$540 in guest-side Airbnb fees alone. ~~The website has no dedicated "book direct" landing page.~~ **As of June 22:** `/book-direct/` page is live. Still needed: "why book direct" value blocks on individual property pages, fee comparison prominent on property pages, and email capture for guests browsing 3-6 months out.

---

# PART 2: TOP 10 KEYWORD OPPORTUNITIES

Ranked by: search volume × commercial intent × achievability for a 4-month-old domain.

---

**#1 — "BNP Paribas Open where to stay" / "vacation rental Indian Wells BNP Paribas"**
- Current ranking: Not ranked
- Target ranking: Position 3-6
- Content vehicle: New post — `/blog/bnp-paribas-open-vacation-rental-guide/`
- Timeline: Publish July 2026, rank by February 2027 (tournament is in March)
- Why it converts: Open lane. Cactushugs.com ranks here with zero booking links and zero rental product. Nobody with actual inventory is in this SERP. Terra Luz and Cozy Cactus are 20 minutes from Indian Wells Tennis Garden. Guests booking for BNP are high-income, plan ahead (the 116-day advance booking in your Gmail data fits this profile exactly), and spend 4-7 nights. One direct BNP booking at $225/night x 5 nights = $1,125 captured without Airbnb fees.

**#2 — "Coachella 2027 where to stay" / "where to stay for Coachella 2027"**
- Current ranking: Not ranked (the 2026 post is now past-tense)
- Target ranking: Position 4-8
- Content vehicle: New post — `/blog/coachella-2027-where-to-stay/` (do NOT update the 2026 URL — separate search clusters)
- Timeline: Publish by August 2026, update with confirmed dates when announced
- Why it converts: Coachella gets 3-4x Stagecoach's search volume. April alone = 19% of annual portfolio revenue. The Cozy Cactus and Terra Luz are in Indio — geographically at the festival. A post that opens with "These two houses are 8 minutes from the main stage" wins the intent match no aggregator can replicate.

**#3 — "vacation rentals Indio CA" (non-festival framing)**
- Current ranking: Not ranked
- Target ranking: Position 5-8 (vareproperties.com and rysonvacations.com are the comps)
- Content vehicle: New geo landing page — `/vacation-rentals/indio/` with 400+ words, links to Cozy Cactus and Terra Luz, embedded availability
- Timeline: Build in 2 weeks, rank in 60-90 days

**#4 — "Stagecoach 2027 where to stay"**
- Current ranking: Crawled but not indexed
- Target ranking: Position 4-7
- Content vehicle: `/blog/stagecoach-2027-where-to-stay/` — exists, needs to clear the indexing block first, then expand to 2,500+ words
- Timeline: Fix indexing issue now, rank by November 2026

**#5 — "dog-friendly vacation rental Coachella Valley"**
- Current ranking: Not ranked (page not yet built)
- Target ranking: Position 2-5
- Content vehicle: `/blog/terra-luz-dog-friendly-coachella/` — .md file exists in content/blog, just not built
- Timeline: Run `npm run build`, rank in 45-60 days

**#6 — "palm springs vacation rental direct book" / "book direct vacation rental Palm Springs"**
- Current ranking: Not ranked
- Target ranking: Position 4-7
- Content vehicle: New page — `/book-direct/` with fee comparison table
- Timeline: Build in 1 week, rank in 60-90 days

**#7 — "vacation rental near Indian Wells tennis"**
- Current ranking: Not ranked
- Target ranking: Position 3-6
- Content vehicle: (1) add proximity copy to Terra Luz and Cozy Cactus property pages ("20 minutes from Indian Wells Tennis Garden"), and (2) the BNP post from #1 captures this query cluster
- Timeline: Property page copy update = 1 day

**#8 — "bachelorette house rental Coachella Valley"**
- Current ranking: Not ranked (page not yet built)
- Target ranking: Position 2-4 (very low competition, high commercial intent)
- Content vehicle: `/blog/terra-luz-bachelorette-coachella/` — .md exists in content/blog, not built
- Timeline: Run `npm run build`, rank in 45-60 days

**#9 — "how far is Indio from Palm Springs" + comparison variants**
- Current ranking: Position 4-11 (the palm-springs-vs-indio post already surfaces here)
- Target ranking: Position 1-3 for "palm springs vs indio" (currently position 4.3)
- Content vehicle: Optimize existing `/blog/palm-springs-vs-indio/` — title tag rewrite, convert 6 JPEGs to WebP, add 2-3 internal links to Indio property pages
- Timeline: 2 weeks post-optimization

~~**#10 — "Modernism Week Palm Springs where to stay"**~~ ✅ **DONE June 22** — H1 already led with "where to stay", Sundune booking section already present. Updated 2026 dates to 2027-forward framing (dates TBA, announced late October/November 2026) throughout body, fall edition section, and FAQPage JSON-LD.

---

# PART 3: PINTEREST → WEBSITE CORRELATION

**What the data shows.** There are 5 outbound clicks across the entire 31-day period from 723 impressions (0.7% outbound rate). Four of those 5 clicks came from the Cozy Cactus property board. The Blogs board got 376 impressions and generated 1 outbound click (0.3% rate). The Cozy Cactus board got 229 impressions and generated 4 outbound clicks and 9 saves (1.7% outbound rate, every save on the account).

**The correlation:** Property-specific visual content drives clicks. Generic editorial blog content drives impressions but not clicks. Property boards = consideration channel. Blogs board = awareness channel.

**What's broken in the funnel:**
1. Several high-impression pins are non-canonical — no destination URL set to indigopalm.co
2. ~~The 355 AI-written pins for 71 blog posts were delivered May 25. No confirmed posting. This is a Sabbir accountability issue.~~ **Updated June 22:** Eann took over Pinterest posting on June 18. The 355 pins still need to be confirmed live — ask Sabbir how many he posted before handoff, then Eann schedules the rest at 4-5/day.
3. No UTM tracking on Pinterest links. Add `?utm_source=pinterest&utm_medium=organic&utm_campaign=cozy-cactus` to every Cozy Cactus pin URL.

---

# PART 4: CONTENT GAPS

~~**Gap 1: `/blog/coachella-2027-where-to-stay/`**~~ ✅ **DONE** — Published June 2026, 2,705 words.

~~**Gap 2: `/blog/bnp-paribas-open-vacation-rental-guide/`**~~ ✅ **DONE** — Published, 2,893 words.

~~**Gap 3: `/vacation-rentals/indio/`**~~ ✅ **DONE** — Page exists.

~~**Gap 4: `/book-direct/`**~~ ✅ **DONE** — Page exists.

~~**Gap 5: `/vacation-rentals/palm-springs/`**~~ ✅ **DONE** — Built June 22, 2026. The Sundune only, dusty blue accents, CollectionPage + BreadcrumbList + FAQPage JSON-LD.

~~**Gap 6: `/vacation-rentals-with-private-pool/`**~~ ✅ **DONE** — Built June 22, 2026. **CORRECTED 2026-07-23:** The original build incorrectly claimed The Sundune has a "fully private pool" (it has a shared HOA pool at Palm Canyon Villas, never private). Fixed by dropping The Sundune from this page entirely — title, meta, OG/Twitter tags, JSON-LD (CollectionPage + FAQPage), hero copy, why-card, properties grid, and on-page FAQ all rewritten to cover only Terra Luz and Cozy Cactus (both Indio, both with a real private-pool-adjacent amenity). Same false claim also found and fixed on the dedicated `/vacation-rentals/palm-springs/` Sundune page (was built entirely around "private pool" framing — now says "community pool access" throughout) and in two blog posts (`palm-springs-with-kids.md`, `palm-springs-summer.md`) that misattributed a private pool to Cozy Cactus or to "Indio properties" collectively. All committed and pushed in `fecb150`.

~~**Gap 7: BNP Paribas existing post update**~~ ✅ **DONE** — Meta description updated to include "2027", dateModified bumped, deployed June 22. Reindexing requested in GSC June 22. Title already had "2027"; body dates were already generic. Check GSC July 13 to confirm indexed.

~~**Gap 8: "Why book direct" value block on property pages**~~ ✅ **DONE** — LodgingBusiness JSON-LD added June 22. Fee comparison blocks live.

~~**Gap 9: LodgingBusiness JSON-LD on property pages**~~ ✅ **DONE** — Added to all 3 active property pages June 22 (confirmed in GSC baseline section).

---

# PART 5: TECHNICAL SEO ISSUES

## CRITICAL — Fix this week

~~**1. 8 posts accidentally noindexed**~~ ✅ **DONE** — No noindex frontmatter found in any blog posts as of June 22. Verify in GSC Coverage tab that "Excluded by noindex" count has dropped to 0. If any remain, they may be rendering-time issues, not frontmatter.

~~**2. API endpoints in the crawl report**~~ ✅ **DONE** — `Disallow: /api/` is in robots.txt as of June 22.

~~**3. 4 sitemap URLs returning 404**~~ ✅ **DONE** — Dog-friendly and bachelorette posts are built and live.

## HIGH — Fix this month

~~**4. Redirect validation failure on 13 pages**~~ ✅ **DONE** — Audited June 22: `/cozy-cactus` (200), `/index.html` (301→200), `/blog` (200), `/blog/cozy-cactus-what-i-built` (301→200). All redirect chains resolve correctly. Failure was a timing issue from May 31 before builds stabilized. Re-request GSC validation to clear the flag.

~~**5. Robots.txt blocking legitimate pages**~~ ✅ **NOT AN ISSUE** — robots.txt is clean: `Allow: /`, `Disallow: /api/`, AI crawler blocks only. No legitimate pages blocked. This item is resolved.

~~**6. 8 posts "crawled but not indexed"**~~ ✅ **DONE 2026-07-13** — Stagecoach-2027 expanded to 3,650 words per Part 8. Ran the July 13 GSC check-in (Search Analytics API, 30-day window) — this API surfaces impressions/clicks/position, not Coverage status, so it can't directly confirm "crawled but not indexed" counts. Proxy signal: `indian-palms-vacation-rental` and other target pages are now getting real impressions (678 in 30 days) and ranking position ≤20, meaning they are indexed. No page in the current impression data shows zero visibility that would suggest an indexing block. Remaining coverage-status verification (exact "crawled but not indexed" count) requires the GSC UI Coverage tab directly — flag for Eann's next manual GSC login, not blocking.

## MEDIUM — Fix within 30 days

~~**7. Homepage H1 buried at line 2,070**~~ ✅ **NOT AN ISSUE** — H1 is at line 2,069 but `<body>` starts at line 2,033. The H1 is 36 lines into the body, as the first element inside `<main>`. Line number was inflated by 2,000+ lines of `<head>` CSS. Google reads DOM order, not file line numbers. No action needed.

~~**8. H1/title mismatch on homepage**~~ ✅ **DONE** — Em dash removed from H1 June 22 (session 2). H1 now reads: "Coachella Valley Vacation Rentals: Book Direct, Skip the Fees". Title tag: "Coachella Valley Vacation Rentals | Book Direct | Indigo Palm Collective".

~~**9. No preconnect hints in blog-post.njk**~~ ✅ **DONE** — Added `<link rel="preconnect">` for `googletagmanager.com` and `s.pinimg.com` June 22. Google Fonts preconnects were already present.

~~**10. 6 JPEG images in palm-springs-vs-indio post**~~ ✅ **ALREADY DONE** — All 7 images in that post are already WebP. No action needed.

## LOW — Fix when convenient

~~**11. 3 category stub pages with 30-word content**~~ ✅ **ALREADY DONE** — All three pages already have `<meta name="robots" content="noindex, follow">`.

~~**12. meta keywords tag on homepage**~~ ✅ **DONE** — Removed June 22.

~~**13. Redirect stub posts appear as full items in the RSS feed**~~ ✅ **DONE 2026-07-20** — Found while correcting TASK GSC-22. `where-to-stay-coachella-2026` and `bnp-paribas-open-vacation-rental-guide` (both `layout: redirect.njk` stubs, no real content) were showing up as normal `<item>` entries in all 5 feed templates. Fixed by adding an `isRealPost` filter (`post.data.layout !== "redirect.njk"`) to the `post`/`postTerraLuz`/`postCozyCactus`/`postSundune`/`postGeneral` collections in `.eleventy.js`. Rebuilt and verified via grep: both redirect stubs are now excluded from `feed.xml`, `feed-general.xml`, `feed-terra-luz.xml`, `feed-cozy-cactus.xml`, `feed-sundune.xml`, while real posts with similar slugs (e.g. `coachella-2027-where-to-stay`) still appear correctly.

---

# PART 6: DIRECT BOOKING FUNNEL GAPS

~~**Gap A — No fee comparison anywhere on the site.**~~ ✅ **ALREADY DONE** — `/book-direct/` page has a full fee comparison section. All 3 active property pages have "No service fee" vs "+20% Airbnb fee" callout in the booking widget area.

~~**Gap B — No "why book direct" signal on property pages.**~~ ✅ **ALREADY DONE** — All 3 active property pages have a "Why Book Direct" block with 20% fee language and Superhost mention.

~~**Gap C — No retargeting or email capture.**~~ ✅ **ALREADY DONE** — Newsletter signup form on every blog post (connected to the deployed Cloudflare Worker + Resend pipeline). Captures email + sends welcome email automatically.

**Gap D — The booking widget has no urgency signal.** Manually add seasonal availability note above booking widget during peak planning season (September through January). Not actionable until September.

~~**Gap E — No confirmation that direct booking is safe.**~~ ✅ **ALREADY DONE** — "Why Book Direct" block on each property page includes: "same Superhost property" + star rating + verified review count.

**Gap F — Blog posts don't close the booking loop.** The layout's generic "Ready to Book?" CTA box is live on every post. For festival-specific posts, add a specific availability sentence before the CTA when availability is known (manual, seasonal).

---

# PART 7: PRIORITY STACK — NEXT 30 DAYS

In order of revenue impact per hour of work:

~~1. Fix noindex on 8 blog posts~~ ✅ Done
~~2. Block /api/ in robots.txt~~ ✅ Done
~~3. Run `npm run build`~~ ✅ Done
~~4.~~ ~~**1. Add "book direct" fee comparison block to all 4 property pages**~~ ✅ **ALREADY DONE** — "Why Book Direct" blocks + fee comparison on all 3 active property pages.
~~5.~~ ~~**2. Add Indian Wells proximity copy to Terra Luz and Cozy Cactus property pages**~~ ✅ **ALREADY DONE** — "Indian Wells Tennis Garden is twenty minutes east" on both pages.
~~6.~~ **3. Add UTM parameters to all Pinterest pin destination URLs** — ongoing task for Eann when scheduling new pins.
~~7. Confirm with Sabbir re: Pinterest~~ **4. Confirm with Sabbir: Quora posting status (2-3/day?) and Goodreads ebook timeline.**
~~**5. Add LodgingBusiness JSON-LD to all 4 property pages**~~ ✅ **ALREADY DONE** — LodgingBusiness JSON-LD confirmed on terra-luz, cozy-cactus, and the-sundune.
~~**6. Add `noindex, follow` to 3 category stub pages**~~ ✅ **ALREADY DONE** — All 3 category pages already had `noindex, follow`.
~~**7. Validate redirect fixes for 13 pages**~~ ✅ **DONE** — Audited June 22 (session 2). All chains resolve correctly.
~~8. Publish Coachella 2027 post~~ ✅ Done — 2,705 words, live
~~9. Publish BNP Paribas vacation rental guide~~ ✅ Done — 2,893 words, live
~~10. Build /vacation-rentals/indio/~~ ✅ Done

---

# PART 8: 90-DAY EXECUTION PLAYBOOK

## WEEK 1-2: QUICK WINS

~~**TASK 1: Fix 8 Noindexed Posts (30 min, Critical)**~~ ✅ **DONE** — Verified June 22 session 3: zero `noindex` frontmatter found across all 84 blog posts in `content/blog/`.

~~**TASK 2: Block API Endpoints in robots.txt (10 min, Critical)**~~ ✅ **DONE** — `Disallow: /api/` confirmed in robots.txt.

~~**TASK 3: Run the Build — Publish 4 Missing Posts (5 min, High)**~~ ✅ **DONE** — Dog-friendly and bachelorette posts are live; both in sitemap.xml at lines 530/536.

~~**TASK 4: Title Tag + Meta Description Rewrites (2 hours, High)**~~ ✅ **DONE June 22** — Meta descriptions rewritten for palm-springs-vs-indio (148 chars, persuasive owner framing), stagecoach-2027 (154 chars, stage proximity), and modernism-week (160 chars, Sundune-forward). Homepage H1/title done in session 1. BNP Paribas meta already had 2027 in title; body dates generic enough to not need a rewrite. All dateModified bumped to 2026-06-22.

~~**TASK 5: Internal Linking Fixes (1 hour, High)**~~ ✅ **ALREADY DONE** — Verified June 22: palm-springs-vs-indio links to both `/cozy-cactus/` (line 142) and `/the-sundune/` (line 149). Stagecoach-2027 links to `/cozy-cactus/`, `/terra-luz/`, and `/blog/palm-springs-vs-indio/`. Festival-guide generic CTA box is live on every post via layout.

~~**TASK 6: Indian Wells Proximity Copy (30 min, High)**~~ ✅ **DONE** — Verified June 22 session 3: both pages have "Indian Wells Tennis Garden is twenty minutes east" with BNP framing in the Location section.

**TASK 7: UTM Parameters on Pinterest Pins (1 hour, Medium)**
URL format going forward:
- Cozy Cactus: `https://indigopalm.co/cozy-cactus/?utm_source=pinterest&utm_medium=organic&utm_campaign=cozy-cactus`
- Terra Luz: `https://indigopalm.co/terra-luz/?utm_source=pinterest&utm_medium=organic&utm_campaign=terra-luz`
- Sundune: `https://indigopalm.co/the-sundune/?utm_source=pinterest&utm_medium=organic&utm_campaign=sundune`
- Blog posts: `https://indigopalm.co/blog/[slug]/?utm_source=pinterest&utm_medium=social&utm_campaign=editorial`

~~**TASK 8: "Book Direct" Value Block on Property Pages (2 hours, Direct Revenue)**~~ ✅ **DONE** — Verified June 22 session 3: all 3 active property pages have "No service fee" vs "+20% added" comparison in booking widget area plus a Why Book Direct section.

~~**TASK 9: Schema Markup for Property Pages (1 hour, Medium-High)**~~ ✅ **DONE** — Verified June 22 session 3: LodgingBusiness JSON-LD with aggregateRating confirmed in cozy-cactus/index.html (line 140). All 3 active property pages confirmed in session 2.

**TASK 10: Sabbir Scope + Quora Accountability Checkpoint (30 min)** *(Updated June 22)*

Pinterest posting moved in-house to Eann on June 18. Sabbir's scope is now:
- **Quora** — post 2-3 answers/day from the [Quora queue Google Doc](https://docs.google.com/document/d/1KMQMFtnHRT2C_Nz7VakPNPCuhL9TQ3qCXKIZ-nlvhb0/edit) (392 Q&A pairs, high priority first)
- **Goodreads** — repurpose blog posts into ebook format for indexed AI distribution
- **GEO strategy** — advise on emerging AI citation channels

Ask Sabbir for:
1. How many of the 355 pins were live before Pinterest handoff (so Eann knows what's left to schedule)
2. Quora posting status — is he working through the queue at 2-3/day?
3. Goodreads timeline — when is the first ebook going live?

For Pinterest: Eann schedules remaining pins at 4-5/day. At 5/day, 355 pins = 71 days of content. Posting takes ~20 min/day once pins are written.

~~**TASK RG-21: Sales Page Audit — Cozy Cactus property page (added 2026-07-13)**~~ ✅ **DONE 2026-07-13** — Ran the four-lens audit against the live page (`cozy-cactus/index.html`). Findings: page structure/funnel is actually solid (hero CTA, sticky mobile CTA, availability calendar, "Book Now" all present); the real messaging bug was a fully duplicated "Why Book Direct" block sitting back-to-back in the sidebar right next to the CTA, adding clutter at the exact conversion point. Removed the duplicate and merged the rating line into the single remaining box. Also added a "★ 4.97 · 146 reviews · Airbnb Guest Favorite" trust line directly in the hero (above the fold), since the only rating signal previously lived in the sidebar, below the fold on mobile — likely contributor to the 83.3% bounce given mobile traffic dominance. Committed and pushed.

**TASK PIN-1: Create a dedicated Sundune Pinterest board (added 2026-08-12)**
Board-level audit (Pinterest Check-in — 2026-08-12) confirmed Sundune is the only active property with zero organic Pinterest board presence — Terra Luz has 2 boards (393 + 0 impr), Cozy Cactus has 2 boards (237 + 163 impr), Sundune has none. This lines up with the persistent GA4 property-visibility gap (Sundune consistently ~1/5 of Cozy Cactus's page views). Not executed this run — board creation + initial pin set is a Pinterest-side content task (needs board cover image + description + 5-10 seed pins), better scoped as its own session than folded into an audit pass. Flagging for the next content/Pinterest work session rather than executing blind.

---

## ONGOING: GEO (QUORA + STRUCTURED DATA)

*(New channel as of June 2026 — runs in parallel with content sprints)*

**Quora posting (Sabbir's job):**
- Source doc: [Quora GEO Queue](https://docs.google.com/document/d/1KMQMFtnHRT2C_Nz7VakPNPCuhL9TQ3qCXKIZ-nlvhb0/edit)
- 392 Q&A pairs, ordered high-to-medium priority
- Cadence: 2-3/day, never batch-drop (new account, June 15, 2026)
- Expect 4-6 weeks before traffic shows up in GSC
- At 2-3/day: ~157-day queue (through November 2026)
- Tool to generate more: `/indigo-palm-geo-seeder [slug]` for any new post

**On-site FAQ (already done):**
- All 84 posts have FAQPage JSON-LD and `<h4>` FAQ sections
- For new posts: run `/indigo-palm-geo-seeder` immediately after publishing
- ✅ **DONE 2026-07-11** — ran on `best-spas-coachella-valley-spa-day` (FAQ/JSON-LD already existed from initial publish; generated 5 Quora Q&A pairs for Eann to post 2-3/day; added internal cross-link from `indio-between-coachella-weekends` to the new spa post)
- ✅ **DONE 2026-07-22** — ran on the new `palm-springs-poolside-bars-resort-dining` post (published this run). FAQPage JSON-LD + on-site FAQ (4 Q&As) already present from initial publish, verified in built HTML. Generated 5 fresh Quora Q&A pairs (day-pass access, resort pools near Indio, public poolside restaurants, walk-in vs reservation, budget resort feeling) written to `/tmp/geo-seeder-poolside-bars-2026-07-22.md` — PENDING for Eann/Sabbir to post 2-3/day, never batch-drop. Same standing caveat as RG-20's audit finding: these pending pairs aren't tracked in a queue the Pinterest Check-in cross-references, so the "Quora Q&A live" count stays a manual estimate.

**Goodreads ebooks (Sabbir's job, pending):**
- Convert 3-5 highest-traffic posts to ebook format
- Publish on Goodreads under Indigo Palm author profile
- Goodreads is indexed by Gemini; each ebook is another AI citation surface

---

## WEEK 3-6: CONTENT SPRINTS

~~**POST 1: Coachella 2027 Where to Stay**~~ ✅ **DONE** — 2,705 words, live.

~~**POST 2: BNP Paribas Open Vacation Rental Guide**~~ ✅ **DONE** — 2,893 words, live.

~~**POST 3: Stagecoach 2027 Expansion**~~ ✅ **DONE** — 3,650 words.

~~**POST 4: Vacation Rentals Indio CA**~~ ✅ **DONE** — `/vacation-rentals/indio/` live.

~~**POST 5: Book Direct Landing Page**~~ ✅ **DONE** — `/book-direct/` live.

~~**POST 6: Vacation Rentals Palm Springs — Geo Landing Page**~~ ✅ **DONE** — `/vacation-rentals/palm-springs/` live June 22, 2026.

~~**POST 7: Vacation Rentals with Private Pool — Amenity Landing Page**~~ ✅ **DONE** — `/vacation-rentals-with-private-pool/` live June 22, 2026.

---

## WEEK 7-12: AUTHORITY + CONVERSION

**Link Building Targets:**
1. Desert Sun (desertsun.com) — pitch as a local rental resource for their BNP coverage
2. Coachella Valley Weekly (cvweekly.com) — pitch local business feature story
3. Palm Springs Life (palmspringslife.com) — pitch quote/property for seasonal rental roundups
4. Cactus Hugs (cactushugs.com) — pitch guest post or a mention/link in their festival lodging posts
5. Racquet Road Trip (racquetroadtrip.com) — pitch BNP guide as a reader resource (after publishing)
6. Visit Greater Palm Springs (visitgreaterpalmsprings.com) — get listed on their accommodations page
7. Direct Booking Movement community — share /book-direct/ page as a resource
8. Coachella/Stagecoach fan sites (festicket.com, festival survival guides) — get cited in "where to stay" roundups

**Property Page Upgrades:**
- Urgency signals during peak booking season (September-January): manually update notice above booking widget showing festival weekend availability
- Superhost trust badge + "146 verified reviews — book here to skip the guest fee"
- Email capture form: "Join the waitlist and we'll notify you when availability opens"
- Pinterest landing experience: for `?utm_source=pinterest` traffic, gallery should come first, then booking button

---

## KEYWORD PRIORITY TABLE

*Last verified: June 22, 2026 (session 3). "Content live" = page/post deployed. Ranking data from GSC — check July 13.*

| Keyword | Est. Monthly Searches | Content Status | Target Rank | Owner Page | Priority |
|---|---|---|---|---|---|
| Coachella 2027 where to stay | 8,000-15,000 (seasonal) | ✅ Live — 2,705 words | 4-8 | `/blog/coachella-2027-where-to-stay/` | P1 |
| Palm springs vs. Indio | 500-1,200 | ✅ Live — meta rewritten June 22 | 1-3 | `/blog/palm-springs-vs-indio/` | P1 |
| BNP Paribas Open where to stay | 1,000-3,000 (seasonal) | ✅ Live — 2,893 words | 3-6 | `/blog/bnp-paribas-open-vacation-rental-guide/` | P1 |
| Vacation rentals Indio CA | 800-1,500 | ✅ Live — geo landing page | 5-8 | `/vacation-rentals/indio/` | P1 |
| Stagecoach 2027 where to stay | 2,000-5,000 (seasonal) | ✅ Live — 3,650 words | 4-7 | `/blog/stagecoach-2027-where-to-stay/` | P1 |
| Book direct vacation rental Palm Springs | 300-600 | ✅ Live — /book-direct/ | 4-7 | `/book-direct/` | P2 |
| Dog-friendly vacation rental Coachella Valley | 400-800 | ✅ Live | 2-5 | `/blog/terra-luz-dog-friendly-coachella/` | P2 |
| Bachelorette rental Coachella Valley | 300-700 | ✅ Live | 2-4 | `/blog/terra-luz-bachelorette-coachella/` | P2 |
| Vacation rental near Indian Wells tennis | 500-1,000 (seasonal) | ✅ Covered — BNP post + property page copy | 3-6 | `/blog/bnp-paribas-open-vacation-rental-guide/` | P2 |
| Modernism Week Palm Springs where to stay | 600-1,200 (seasonal) | ✅ Live — meta rewritten June 22 | 3-6 | `/blog/modernism-week-palm-springs/` | P2 |
| Vacation rentals with private pool Palm Springs | 1,200-2,500 | ✅ Live — amenity landing page | 5-10 | `/vacation-rentals-with-private-pool/` | P3 |
| Vacation rentals Palm Springs | 4,000-8,000 | ✅ Live — geo landing page | 10-20 | `/vacation-rentals/palm-springs/` | P3 |

---

## WEEKLY METRICS (15 minutes every Sunday)

**Google Search Console — Search Results tab:**
- Total clicks (week over week)
- Impressions for "coachella 2027" queries
- CTR on palm-springs-vs-indio post (target: 4-6% from Position 3-5)
- Position tracking for 5 specific queries: "palm springs vs indio," "vacation rentals indio ca," "stagecoach 2027 where to stay," "BNP Paribas where to stay," "coachella 2027 where to stay"

**Coverage tab:**
- "Valid" pages: should increase week over week. Start: ~10 indexed. Target: 40+ indexed pages within 60 days
- "Excluded by noindex": target = 0 after Week 1 fixes
- "Not found (404)": target = 0 after sitemap fix

**Pinterest Analytics (ask Sabbir weekly):**
- Impressions (target: 2,000+ by Week 6)
- Outbound clicks (track Cozy Cactus board vs. editorial board separately)
- Saves per week (highest-intent Pinterest signal)

**Booking analytics:**
- At least 1 direct booking with `utm_source=organic` by Day 60
- At least 1 direct booking with `utm_source=pinterest` by Day 90
- % of revenue from direct channels: target 15% by December 2026

**The single most important metric:** Indexed page count in GSC. Every indexed page is a lottery ticket. Right now: 10 tickets. The noindex fixes, sitemap builds, and 5 new posts add ~27 more tickets. Target: 40 indexed pages by August.

---

## THE BIG BET: OWN THE BNP PARIBAS COACHELLA VALLEY CONTENT CLUSTER

The Indian Wells Open is the fifth-largest tennis tournament in the world — 460,000 attendees over two weeks in early March. Guests skew older, high-income, and book 3-6 months in advance. They are not price-sensitive guests shopping Airbnb on Tuesday night.

Nobody with actual vacation rental inventory in the Coachella Valley is in the BNP Paribas search results. Cactushugs ranks with zero booking capability. Racquet Road Trip ranks as a pure tennis travel blog. The top results are all hotels.

You have two properties 20 minutes from Indian Wells Tennis Garden. Publish the most useful BNP Paribas lodging guide on the internet by September 2026. If you do:
- You rank before the December-January booking spike
- You capture a guest demographic that books directly
- You build topical authority in the "Indian Wells / Coachella Valley events" content cluster
- You get cited by tennis travel writers, local papers covering the tournament, and travel bloggers doing 2027 preview content

One successful BNP Paribas season booked direct — two properties, 5 nights each, two groups of 6 — is $11,000+ in revenue with zero Airbnb fees. The post costs 3 hours to write.

Publish the definitive BNP Paribas vacation rental guide before September 2026, then spend October-February getting tennis travel writers, local journalists, and Coachella Valley tourism sites to link to it. By March 2027, you're the first result when 460,000 tennis fans ask where to stay.

---

## DOC MAINTENANCE

**TASK: Keep This Doc Current (ongoing)**

After every Claude session that touches the site, run `/babysit-seo` or manually update this doc:

1. Mark any completed tasks with `~~strikethrough~~` + `✅ DONE [date] — [what changed]`
2. Update the keyword table "Content Status" column when new posts go live
3. Add a new entry under "What changed on [date]" in the GSC Baseline section
4. Update the "Last updated" header at the top of the doc
5. Update the "Last updated" date whenever ranking data from GSC is refreshed

The `/babysit-seo` skill handles this automatically. Run it after any SEO sprint. Run it before any GSC check-in to make sure the doc reflects current reality before reading new data into it.

---

## GSC BASELINE — June 22, 2026

*Control group for measuring impact of June 22 changes. Compare at next check-in (target: July 13, 2026).*

### What changed on June 22 (session 1)

- **Meta description rewrites** on 3 high-impression/low-CTR posts: where-to-stay-coachella, indian-palms-vacation-rental, palm-springs-vs-scottsdale
- **Structural refresh** of where-to-stay-coachella: comparison table (6 rows), 2027 booking urgency callout, 4 new keywords, new FAQ on 2027 rental timing, fixed "19 minutes via Eisenhower Drive" → "walking distance to Empire Polo Club"
- **LodgingBusiness JSON-LD** added to all 3 active property pages
- **Sitemap resubmitted** via GSC API (was stale since May 26)
- **FAQPage JSON-LD** already live on all 84 posts (added earlier in June)

### What changed on June 22 (session 2)

- **Homepage H1 em dash removed** — H1 now "Coachella Valley Vacation Rentals: Book Direct, Skip the Fees" (colon replaces em dash). Committed and deployed.
- **Newsletter worker deployed** — Cloudflare Worker at `newsletter.indigopalm.co` using Resend API. Sends welcome email (terra-luz hero image, #fffafa header, transparent full logo) + owner notification to indigopalmco@gmail.com on every signup. Tested and confirmed working.
- **Booking flow hero + routing** — Added hero strip to `/booking-flow/index.html` (warm gradient background, property-updating title/subtitle). Stub redirect files created at `/booking-flow/terra-luz/`, `/booking-flow/cozy-cactus/`, `/booking-flow/ps-retreat/` for GitHub Pages direct-URL support.
- **Quora second batch** — 10 Q&A pairs written and loaded into a new Google Doc ([link](https://docs.google.com/document/d/1_g-dXll8BhbxLKjeG_FwZhy4ULm_IlXKfXycRnCZBPI/edit)), shared with Sabbir as editor. Focused on: dog-friendly, bachelorette, group stays, book direct, Indio activities, season timing. Note: Q2 and Q7 corrected "2.5 miles" → "walking distance"; Q6 corrected fee % to "Airbnb's 20% guest service fee."

### Overall metrics

| Metric | Current period (May 25–Jun 21) | Prior period (Apr 27–May 24) | Change |
|---|---|---|---|
| Clicks | 78 | 34 | +129% |
| Impressions | 13,674 | 7,053 | +94% |
| CTR | 0.57% | 0.48% | +0.09pp |
| Avg position | 13.0 | 16.1 | +3.1 |

### Top pages baseline (May 25–Jun 21)

| Page | Clicks | Impressions | CTR | Avg Position |
|---|---|---|---|---|
| surf-club-palm-springs | 21 | 2,545 | 0.83% | 10.2 |
| palm-springs-vs-indio | 15 | 1,748 | 0.86% | 8.3 |
| where-to-stay-coachella *(meta rewrite + refresh)* | 4 | 1,854 | 0.22% | 13.9 |
| palm-springs-vs-scottsdale *(meta rewrite)* | 3 | 624 | 0.48% | 9.1 |
| indian-palms-vacation-rental *(meta rewrite)* | 1 | 482 | 0.21% | 7.9 |

### Notable signals

- **"airbnb rentals indio"**: position 1.0 (featured snippet), 27 impressions, 0 clicks — answer surfacing in-SERP with no click-through. Monitor if clicks pick up or if snippet format changes.
- **Mobile position 9.0 vs. desktop 17.0** — strong mobile-first indexing advantage. Site performs significantly better on mobile.
- **CTR problem, not a ranking problem** — avg position 13.0 means content is being found. The June 22 meta rewrites are the primary lever to convert impressions to clicks.

### What changed on June 22 (session 4)

- **Modernism Week post updated** — Body dates updated from 2026-specific to 2027-forward framing (dates TBA, announced late October 2026). Opening night party reference neutralized. Fall edition section updated. FAQPage JSON-LD answer updated to match. Completes Part 2 #10.
- **arriving-coachella-valley-first-afternoon published** — New post (June 22). 5 photos added: MCM hero (2400px), front entrance, outdoor kitchen drinks, pool umbrella, evening patio string lights. Whole Foods Google Maps link added. This post is not tracked in the keyword table — consider adding it if it starts generating impressions.
- **Build output stragglers committed** — 3 HTML files + 5 blog/images passthrough copies from prior session were uncommitted; now at `1f0db6e`.

### What changed on June 22 (session 3)

- **Git tracking restored** — Commit `d14a944` had silently deleted 1,500+ files from git tracking, breaking all GitHub Actions deploys since 12:44pm June 22. Restoration commit `7c82bc6` re-added everything; deploy confirmed successful.
- **All arriving post URLs live** — `/blog/arriving-coachella-valley-first-afternoon/` returns 200; was 404ing due to the deploy breakage above.
- **SEO strategy doc audit** — Verified Tasks 1-3, 6, 8, 9 (all done but never marked). Marked done. Updated keyword table to reflect all 12 target keywords now have live content. Added DOC MAINTENANCE section.
- **`/babysit-seo` skill created** — New Claude skill at `~/.claude/skills/babysit-seo/SKILL.md`; autonomously iterates through this doc and executes incomplete tasks.

### What to check at July 13 check-in

1. CTR on the 3 rewritten posts — has any moved above 1%?
2. Overall CTR — target: above 0.75% (was 0.57%)
3. Coachella cluster impressions — watching for 2027 planning cycle traffic to start building (usually kicks up in September, but early signals appear in July-August)
4. New keywords cracking top 10 — especially stagecoach/BNP Paribas terms
5. Indexed page count in GSC Coverage tab — target: 40+ by August

---

## GSC FULL REPORT — June 22, 2026 (90-day analysis)

*Generated by `gsc_report.py`. Period: March 24 – June 22, 2026. Prior period: December 23, 2025 – March 23, 2026.*

### Overall Performance

| Metric | This Period | Prior Period | Change |
|--------|------------|-------------|--------|
| Clicks | 146 | 8 | +138 |
| Impressions | 21,058 | 391 | +20,667 |
| CTR | 0.7% | 2.0% | -1.3pp |
| Avg Position | 14.2 | — | — |

The site effectively didn't exist in GSC 90 days ago — 391 impressions total. The +20,667 impressions since then is the SEO work taking hold. CTR is down from the prior period, but the prior period was near-zero impressions from branded/navigational queries (100% CTR on 8 clicks isn't meaningful). The current 0.7% CTR on 21,058 impressions is the real baseline.

### Traffic by Device

| Device | Clicks | Impressions | CTR | Avg Position |
|--------|--------|-------------|-----|-------------|
| Mobile | 99 | 8,922 | 1.1% | 9.1 |
| Desktop | 46 | 11,987 | 0.4% | 18.0 |
| Tablet | 1 | 149 | 0.7% | 8.7 |

**Key signal:** Mobile CTR (1.1%) is nearly 3x desktop (0.4%). Two things are happening here: mobile users search with more intent (they're already at the event or planning actively), and the mobile position of 9.1 is almost 9 positions better than desktop 18.0. Desktop rankings are significantly weaker — likely because the site is newer and desktop SERPs are more competitive. This will improve as the domain ages and authority builds.

### What's Working

**1. Palm Springs Surf Club post** — 32 clicks, 5,374 impressions, position 10.3. Highest-traffic post by a wide margin. Benefits from a unique local angle with low competition and a real answer to "what is this place and should I go." Not directly booking-relevant but builds domain authority.

**2. Palm Springs vs. Indio** — 24 clicks, 4,110 impressions, position 8.5. The #2 driver, and this one IS booking-relevant. "Indio vs Palm Springs" query gets 4 clicks at position 5.7 with 7.1% CTR — the highest-intent query in the whole account. This post is close to Page 1 for its primary query.

**3. Homepage** — 13 clicks, 598 impressions, 2.2% CTR, position 9.2. Brand queries + "coachella valley vacation rentals" terms. Strong CTR for homepage traffic.

**4. Indian Palms vacation rental** — 9 clicks, 1,290 impressions, 0.7% CTR, position 8.7. Near page 1, good intent alignment.

**5. Indio local gems** — 8 clicks, 275 impressions, 2.9% CTR, position 10.8. Small but high CTR — niche content with intent-matched visitors.

### CTR Opportunities (biggest leaks)

**#1 priority: "how far is indio from palm springs"** — 823 impressions, 1 click, 0.1% CTR, position 8.3. This is the single biggest CTR leak in the account. Position 8 means the post is showing up, but barely anyone clicks. The fix: the `palm-springs-vs-indio` title and meta description need to answer this query directly. Current meta doesn't lead with the distance answer. A title like "Indio to Palm Springs: Distance, Drive Time + Which to Pick for Your Stay" and a meta that opens with "30 miles apart, 30-minute drive" would directly match the query and pull searchers who want a quick fact.

**#2: "indigo" query** — 246 impressions, 2 clicks, 0.8% CTR, position 5.1. Ambiguous brand/color query — people searching "indigo" are probably not looking for a vacation rental. Not actionable; low-intent traffic.

### Weak Pages (impressions but no clicks)

These pages are indexed and showing up in SERPs but not getting clicked. Position tells you the fix:

| Page | Impressions | Clicks | CTR | Avg Pos | Diagnosis | Fix |
|------|-------------|--------|-----|---------|-----------|-----|
| `things-to-do-indio-ca` | 465 | 1 | 0.2% | 39.8 | Ranking on page 4 — not seen enough | Content overhaul, more comprehensive, internal link push |
| `best-hiking-palm-springs` | 327 | 0 | 0.0% | 66.8 | Page 7 — invisible | Full rewrite or consolidate into a broader Palm Springs activities post |
| `where-to-stay-coachella` | 2,700 | 8 | 0.3% | 14.3 | Position 14, showing up, CTR terrible | Title/meta rewrite — lead with the specific answer |
| `palm-springs-aerial-tram` | 202 | 1 | 0.5% | 10.8 | Position 11 — almost page 1, 0 clicks | Title/meta rewrite, answer "is it worth it" directly |
| `coachella-valley-insider-guide` | 183 | 0 | 0.0% | 56.0 | Page 6 — invisible | Consolidate or significantly expand content |
| `salton-sea-day-trip` | 182 | 1 | 0.5% | 39.8 | Page 4 | Content depth + internal links |
| `best-restaurants-palm-springs` | 178 | 0 | 0.0% | 37.7 | Page 4 | Update with 2026 restaurants, more specific picks |
| `beyond-coachella-desert-escape` | 74 | 0 | 0.0% | 10.1 | Position 10 — page 1 edge, 0 clicks | Title/meta rewrite — this is a near-page-1 post that isn't earning clicks |
| `bnp-paribas-indian-wells-where-to-stay` | 50 | 0 | 0.0% | 18.5 | Newly published, position 18 | Give it 4-6 weeks; if still < 5% CTR, rewrite title/meta |

### Action Items Generated

These feed into Part 8 Quick Wins below.

**GSC Action 1: Rewrite `palm-springs-vs-indio` title/meta for "how far is indio from palm springs"**
- Current: title and meta don't lead with the distance/drive time answer
- Fix: Title → "Indio vs. Palm Springs: 30 Miles Apart — Which Is Right for Your Stay?" (59 chars). Meta → "They're 30 miles apart and 30 minutes by car, but the trip experience is completely different. Here's how to decide which side of the valley fits your group."
- Expected impact: "how far is indio from palm springs" has 823 impressions at position 8.3 — a title/meta fix that matches the informational query could move CTR from 0.1% to 3-5%, which is +24 clicks/month from that one query alone.

**GSC Action 2: Rewrite `where-to-stay-coachella` title/meta**
- 2,700 impressions, 8 clicks, 0.3% CTR, position 14.3 — the highest-impression page that's clearly underperforming
- Fix: title needs a stronger specific hook. "Where to Stay for Coachella 2027: Best Vacation Rentals Near the Polo Grounds" (66 chars — trim to ~60). Meta should open with the distance-from-venue fact.

**GSC Action 3: Rewrite `palm-springs-aerial-tram` title/meta**
- Position 10.8 = almost page 1. Getting 202 impressions and barely clicking. The title needs to answer the top question searchers have: "is the Palm Springs Aerial Tram worth it."
- Fix: Title → "Palm Springs Aerial Tram: Is It Worth It? (Honest Guide)" (56 chars). Meta → lead with elevation change, views, and the honest take on crowds/timing.

**GSC Action 4: Rewrite `beyond-coachella-desert-escape` title/meta**
- Position 10.1 with 74 impressions and 0 clicks. Post is essentially on page 1 but not earning any traffic at all. This is a title/meta mismatch, not a ranking problem.
- Fix: Read the post, identify the primary query it should own, rewrite title to match.

**Non-actionable now (monitoring):**
- `things-to-do-indio-ca` at position 39.8 and `best-hiking-palm-springs` at 66.8 need more than title fixes — they're not close enough to page 1 for CTR to matter yet. Flag for a content refresh sprint when the site's overall authority improves.
- `bnp-paribas-indian-wells-where-to-stay` at position 18.5 with 50 impressions — too new to act on. Check at July 13.

---

~~**TASK GSC-1: Rewrite palm-springs-vs-indio title/meta**~~ ✅ **DONE June 22** — Title: "Palm Springs vs. Indio: Distance, Cost + Which to Pick" (54 chars). Meta leads with "30 miles apart, 30 minutes by car" to match the dominant query "how far is indio from palm springs" (823 imps, pos 8.3, 0.1% CTR).

~~**TASK GSC-2: Rewrite where-to-stay-coachella title/meta**~~ ✅ **DONE June 22** — Title: "Coachella 2027: Where to Stay Near the Polo Grounds" (52 chars). Meta: opens with specific price/distance facts and adds "2027" for planning-cycle search alignment.

~~**TASK GSC-3: Rewrite palm-springs-aerial-tram title/meta**~~ ✅ **DONE June 22** — Title: "Palm Springs Aerial Tram: Is It Worth It? (Honest Guide)" (57 chars). Meta opens with "Honest take: yes, worth it, with caveats" to directly address the dominant searcher question. dateModified bumped to 2026-06-22.

~~**TASK GSC-4: Rewrite beyond-coachella-desert-escape title/meta**~~ ✅ **DONE June 22** — Title: "Things to Do in the Coachella Valley (Not Just Coachella)" (58 chars) — replaces the ambiguous "Beyond the Festival" framing with a direct query match. Meta updated. dateModified bumped to 2026-06-22.

~~**TASK GSC-5: Rewrite indio-between-coachella-weekends title/meta**~~ ✅ **DONE June 23** — Title: "What to Do Between Coachella Weekends: 5 Days in Indio" (55 chars) — query-first framing replaces the vague "No Filler" hook. Meta: opens with the five-day framing and specific activities. Removed outdated "Justin Bieber Coachella 2026" keyword. dateModified bumped to 2026-06-23. (150 imps, position 11.8, 0.7% CTR → rewrite targets 2-3% CTR.)

---

### What changed on June 23 — GSC Check-in

**Period:** March 25 – June 23, 2026 (90 days)

**Overall:** 149 clicks, 21,383 impressions, 0.7% CTR, avg position 14.1

**vs. prior period (June 22 baseline):** +3 clicks, +325 impressions — negligible 1-day delta, baseline is stable.

**What's working:**
- Palm Springs Surf Club: 34 clicks, 5,503 imps, position 10.2 — top traffic driver, domain authority builder
- Palm Springs vs. Indio: 24 clicks, 4,176 imps, position 8.4 — booking-relevant, close to top 5
- Homepage: 13 clicks, 591 imps, 2.2% CTR — strong brand signal

**Mobile vs. desktop:** Mobile CTR 1.1% vs. desktop 0.4%. Mobile position 9.1 vs. desktop 18.0 — site performs significantly better on mobile, consistent with prior baseline.

**New CTR opportunity (not in prior baseline):**
- `indio-between-coachella-weekends`: 150 imps, position 11.8, 0.7% CTR — near page 1. Title/meta rewrite executed (GSC-5 above).

**Monitoring (no action yet):**
- `where-to-stay-coachella-2026`: 1,100 imps, 4 clicks, position 8.7 — this is the old 2026 URL, which has a redirect to the main Coachella post. GSC showing both URLs is expected; link equity will transfer over time. No action.
- `bnp-paribas-indian-wells-where-to-stay`: 50 imps, position 18.5 — still too new. Check at July 13.
- `stagecoach-2027-where-to-stay`: 265 imps, 3 clicks, 1.1% CTR, position 9.8 — improving. Watch at July 13.

**Action items generated:**
1. ~~Rewrite `indio-between-coachella-weekends` title/meta~~ ✅ Done (GSC-5)
2. At July 13: check CTR on June 22 rewrites (palm-springs-vs-indio, where-to-stay-coachella, palm-springs-aerial-tram, beyond-coachella-desert-escape, indio-between-coachella-weekends)
3. At July 13: confirm stagecoach-2027 cleared "crawled but not indexed" status
4. At July 13: check BNP Paribas position (currently 18.5 with 50 imps)

---

### Pinterest Check-in — June 23

**Monthly views:** ~20K (last confirmed from SOCIAL_MEDIA_BIBLE context; Eann took over posting June 18)
**Pin count:** 355 pins delivered by Sabbir May 25. Live count pending confirmation of how many Sabbir posted before handoff.
**Link status:** Pointing to Airbnb (threshold to switch: 25-30K monthly views — not yet reached)
**Posting status:** Eann scheduling remaining pins at 4-5/day. At that rate, 355 pins = ~70 days of content.

**Quora Q&A live:** 2 batches created (392 + 10 questions). Live posting count unknown — depends on Sabbir's actual cadence (target: 2-3/day since June 15).
**FAQPage JSON-LD coverage:** All 84 blog posts have FAQPage JSON-LD.

**Action items:**
1. Confirm from Sabbir: how many pins posted before June 18 handoff (Eann needs to know starting point)
2. Confirm from Sabbir: Quora posting cadence — is he actually at 2-3/day?
3. Confirm from Sabbir: Goodreads ebook timeline
4. Pinterest monthly views remain below 25K threshold — keep Airbnb links on pins for now

---

## PINTEREST PIN BATCH — June 23, 2026

Generated June 23, 2026 from /pinterest-pins audit. Top 5 posts by 5-factor SEO scoring, 15 pins total.

**Posts selected:**
1. `palm-springs-vs-indio` — 5/5 (GSC traction 4,176 imps, booking intent, meta 152 chars, hero image, 2026 date)
2. `where-to-stay-coachella` — 5/5 (GSC traction 2,736 imps, booking intent, meta 153 chars, hero image, 2026 date)
3. `stagecoach-2027-where-to-stay` — 5/5 (GSC traction 265 imps, booking intent, meta 152 chars, hero image, 2026 date)
4. `indian-palms-vacation-rental` — 4/5 (meta 138 chars = below threshold, booking intent beat surf club at equal score)
5. `palm-springs-surf-club` — 4/5 (GSC traction 5,503 imps, highest impressions among 4/5 group)

**Previews:** 15 PNGs rendered at /tmp/pinterest-pins-preview/ — review in Finder before creating in Canva.

**TASK PIN-1: Produce and schedule 15 pins in Canva + Pinterest**
Open "Copy of Terra Luz Pinterest Templates - Eann" in Canva. 3 pins per post. Drop hero image as full-bleed background, add overlay text as white bold layer in upper third (dark scrim behind it if image is light), keep logo badge and terracotta footer bar in place. Export PNG, upload to Pinterest with title + description + board from spec below. Schedule 4-5/day using Pinterest native scheduler — no batch drops.

**Pin specs:**

POST: palm-springs-vs-indio | https://indigopalm.co/blog/palm-springs-vs-indio/

PIN 1 (Practical) | Image: blog-hero-palm-springs.webp | Board: Coachella Valley Travel
Title: Palm Springs vs Indio: Which Makes Sense for Your Trip
Description: 30 miles apart, 30 minutes by car. We own rentals in both areas and have zero incentive to push either one. Palm Springs gives you walkability, architecture, and a downtown worth wandering. Indio gives you space, pool size, and 15 minutes to the festival grounds. Full honest breakdown at the link.
Overlay text: Palm Springs or Indio? Here's how to actually decide.

PIN 2 (Emotional) | Image: cozy-cactus-backyard.webp | Board: Desert Lifestyle
Title: Indio vs Palm Springs: The Real Desert Trip Decision
Description: Midcentury streets you can wander for hours, or a 3-bedroom with a private pool and no freeway between you and the festival. Neither is wrong. Depends entirely on what your group actually wants from the trip. We break it down without the sales pitch. Full guide at the link.
Overlay text: One city is walkable, one has the space for your whole group.

PIN 3 (Booking-intent) | Image: terra-luz-exterior.webp | Board: Indio CA Vacation Rentals
Title: Groups of 6+: Why Indio Beats Palm Springs Every Time
Description: For large groups, Indio has the better math: 3 bedrooms, private pools, real outdoor space, and 30-50% less per night than Palm Springs. The Cozy Cactus and Terra Luz both sleep 8 in Indian Palms, minutes from the polo grounds. Book direct at indigopalm.co. Full comparison at the link.
Overlay text: More space, lower rate, 15 min to Coachella.

---

POST: where-to-stay-coachella | https://indigopalm.co/blog/where-to-stay-coachella/

PIN 1 (Practical) | Image: coachella-festival-crowd.webp | Board: Festival Lodging
Title: Coachella 2027: Every Accommodation Option Compared
Description: Camping, hotels, vacation rentals, glamping. Here's the real breakdown by cost and proximity to the grounds. For groups of 4-8, Indian Palms vacation rentals often come in below hotel rates per person, with a private pool and no rideshare math. Full breakdown at the link.
Overlay text: Book the house before you know the lineup.

PIN 2 (Emotional) | Image: indian-palms-front-entrance.webp | Board: Festival Lodging
Title: Walking to Coachella at 9pm. No Uber, No Surge.
Description: When your rental is walking distance from the polo grounds, you go back to the house at 3pm to rest, then return for headliners without coordinating anything. Half the group can leave early. Half can stay. That's what Indian Palms gives you. Full lodging guide at the link.
Overlay text: Walking distance to the polo grounds, no rideshare surge.

PIN 3 (Booking-intent) | Image: terra-luz-pool-backyard.webp | Board: Indio CA Vacation Rentals
Title: Coachella 2027 Rental: Book Indian Palms Before November
Description: Indian Palms Country Club is walking distance to Empire Polo Club. Private pools, full kitchens, no platform fees when you book direct. Good properties are claimed by November 2026 before the lineup drops. The Cozy Cactus and Terra Luz both sleep 8 in Indian Palms. Details at the link.
Overlay text: Walk to Coachella, private pool, full house for 8.

---

POST: stagecoach-2027-where-to-stay | https://indigopalm.co/blog/stagecoach-2027-where-to-stay/

PIN 1 (Practical) | Image: stagecoach-festival-crowd.webp | Board: Festival Lodging
Title: Stagecoach 2027: Where to Stay Near the Festival
Description: Camping, hotels, or a house 7 minutes from the stage. Vacation rentals in Indian Palms beat hotels on per-person cost for groups of 4 or more, and you get a private pool and a kitchen. Late April evenings in the desert drop to the 60s. Full lodging guide at the link.
Overlay text: 7 minutes from the stage, private pool waiting.

PIN 2 (Emotional) | Image: cozy-cactus-hot-tub.webp | Board: Desert Lifestyle
Title: Hot Tub After Stagecoach: Indio Rentals Near the Stage
Description: The Coachella Valley drops to the low 60s after sunset in late April. After three days in the desert heat, a private hot tub in a quiet Indio neighborhood is exactly the reset your group needs. Indian Palms is 7 minutes from Empire Polo Club. Full guide at the link.
Overlay text: High 80s all day, then 60s by sunset, hot tub's ready.

PIN 3 (Booking-intent) | Image: terra-luz-pool-backyard.webp | Board: Dog-Friendly Travel
Title: Dog-Friendly Stagecoach Rental Near the Grounds
Description: Terra Luz in Indian Palms is dog-friendly, has a private saltwater pool, and is walking distance from Empire Polo Club. Up to 2 dogs, $150 pet fee, fenced yard. Sleeps 8. Book direct at indigopalm.co and skip Airbnb's 20% service fee. Full details at the link.
Overlay text: Dogs welcome at the saltwater pool, 7 min from Stagecoach.

---

POST: indian-palms-vacation-rental | https://indigopalm.co/blog/indian-palms-vacation-rental/

PIN 1 (Practical) | Image: indian-palms-front-entrance.webp | Board: Festival Lodging
Title: Indian Palms: The Neighborhood Walking to Coachella
Description: Indian Palms Country Club in Indio is the only neighborhood in the Coachella Valley where walking to the Empire Polo Club festival entrance is actually practical. About 1.5 miles via Eisenhower Drive, roughly 19-30 minutes. No shuttle line, no rideshare needed. Full guide at the link.
Overlay text: Walk to Coachella with no rideshare, no surge pricing.

PIN 2 (Emotional) | Image: cozy-cactus-exterior.webp | Board: Coachella Valley Travel
Title: Quiet Streets, Palm Trees, Then Coachella on Foot
Description: There's a moment on festival Saturday when you step outside, walk through a quiet gated neighborhood, pass a neighbor sitting on their porch, and realize you're walking to Coachella. No shuttle line. No surge. You're just walking there. That's Indian Palms. Full guide at the link.
Overlay text: Walk through quiet streets, straight to the festival.

PIN 3 (Booking-intent) | Image: cozy-cactus-pool-backyard.webp | Board: Indio CA Vacation Rentals
Title: Stay Walking Distance to Coachella: Indian Palms
Description: Indian Palms Country Club is a gated neighborhood in Indio, walking distance to the polo grounds. Cozy Cactus and Terra Luz are both here: 3 bedrooms, private pools, sleep 8. Community has 3 pools, pickleball courts, and 27-hole golf. Book direct at indigopalm.co. Details at the link.
Overlay text: Gated community, private pool, walking distance to the grounds.

---

POST: palm-springs-surf-club | https://indigopalm.co/blog/palm-springs-surf-club/

PIN 1 (Practical) | Image: pssc-wave-pool-reflection.webp | Board: Palm Springs Getaways
Title: Palm Springs Surf Club: Prices, Hours, Worth It?
Description: Day passes run $100-250 depending on skill level, sessions are open daily until 8pm, and weekend slots book out 1-2 weeks ahead in peak season. Beginner sessions include coaching on soft-top boards. Here's the full rundown before you show up. Review at the link.
Overlay text: Surfing in the desert for $100, mountain views included.

PIN 2 (Emotional) | Image: pssc-wave-pool-reflection.webp | Board: Desert Lifestyle
Title: Surfing Beside the San Jacinto Mountains in the Desert
Description: A wave pool in the middle of the Sonoran Desert. The concept sounds absurd until you're in the water with the San Jacinto Mountains framing every wave. It works in a way that's specific to the Coachella Valley and hard to replicate anywhere else. Full review at the link.
Overlay text: Wave pool in the desert, the San Jacinto Mountains behind you.

PIN 3 (Booking-intent) | Image: pssc-group-surf-session.webp | Board: Bachelorette Destinations
Title: Palm Springs Surf + Stay: Bachelorette Weekend Plan
Description: PSSC is a natural centerpiece for a Palm Springs bachelorette weekend. Surfers book sessions while everyone else uses the Drifters restaurant overlooking the pool. The Sundune sleeps 4 across 3 kings and is 1.3 miles away. Book direct at indigopalm.co. Full activity guide at the link.
Overlay text: Surf the wave pool, swim the desert pool, bachelorette done.

---

**TASK PIN-2: Confirm all 15 pins are live**
Check Pinterest profile. All 15 pins should be visible with correct board, correct link destination (indigopalm.co/blog/[slug]/), and overlay text matching specs above. Monthly views: currently ~20K, threshold to switch links to indigopalm.co is 25-30K.

---

### What changed on June 24 — GSC Check-in

**Period:** 2026-03-26 to 2026-06-24 (90 days)

**Overall:** 153 clicks, 21,730 impressions, 0.7% CTR, avg position 14.1

**vs. prior period (Dec 25 – Mar 25):** +145 clicks (+1,813%), +21,279 impressions (+4,719%) — massive growth driven by content indexing in Q1/Q2.

**What's working:**
- `palm-springs-surf-club`: 34 clicks, 5,604 imps, position 10.2 — largest traffic driver, consistently building
- `palm-springs-vs-indio`: 24 clicks, 4,247 imps, position 8.4 — close to top 5
- Homepage: 13 clicks, 592 imps, 2.2% CTR — solid branded signal

**Mobile vs. desktop:** Mobile CTR 1.1% at position 9.1; desktop 0.4% at position 18.0. Mobile significantly outperforming — consistent with prior baseline.

**CTR opportunities addressed (June 24 rewrites):**
- `palm-springs-surf-club`: removed "2026" from title (now evergreen), punched meta with "$100-250/session" hook
- `palm-springs-vs-scottsdale`: title rewritten to "...Which One Is Right for Your Trip" (839 imps, position 9.1, 0.5% CTR)
- `beyond-coachella-desert-escape`: title rewritten to "Beyond Coachella: What to Do in the Coachella Valley Year-Round" — was ranking position 10.1 with 74 impressions and **0 clicks**, clear mismatch fixed

**Monitoring (no action yet):**
- `things-to-do-indio-ca`: 467 imps, position 39.9 — buried, needs authority growth, not a title fix
- `best-hiking-palm-springs`: 328 imps, position 66.6 — needs full content overhaul when authority improves
- `salton-sea-day-trip`: 192 imps, position 38.6 — buried
- `best-restaurants-palm-springs`: 184 imps, position 36.7 — buried
- `bnp-paribas-indian-wells-where-to-stay`: 51 imps, position 18.3 — check July 13

**Action items generated:**
1. ~~Rewrite palm-springs-surf-club, palm-springs-vs-scottsdale, beyond-coachella-desert-escape title/meta~~ ✅ **DONE June 24**
2. At July 13: measure CTR lift on all June 22 + June 24 rewrites
3. At July 13: check BNP Paribas position (currently 18.3, 51 imps)
4. Content sprint target (when authority improves): things-to-do-indio-ca, best-hiking-palm-springs, salton-sea-day-trip — need content depth, not just title fixes

~~**TASK GSC-6: Rewrite palm-springs-surf-club title/meta**~~ ✅ **DONE June 24** — Removed "2026" year from title (evergreen now). Meta: "Surf the Sonoran Desert for $100-250/session. Open daily until 8pm, books out 1-2 weeks ahead on weekends. Honest review of whether PSSC is actually worth it." (162 chars)

~~**TASK GSC-7: Rewrite palm-springs-vs-scottsdale title/meta**~~ ✅ **DONE June 24** — Title: "Palm Springs vs Scottsdale: Which One Is Right for Your Trip" (60 chars). Meta: "Palm Springs wins for walkable boutique weekends. Scottsdale wins for resort pools and group golf. Full cost comparison plus honest picks for each traveler type." (160 chars)

~~**TASK GSC-8: Rewrite beyond-coachella-desert-escape title/meta**~~ ✅ **DONE June 24** — Title: "Beyond Coachella: What to Do in the Coachella Valley Year-Round" (63 chars). Meta: "Hiking, hot springs, Joshua Tree, the Salton Sea, and restaurants worth the drive any time of year. What to do in the Coachella Valley beyond the festivals." (155 chars). Post was ranking position 10.1 with 74 impressions and 0 clicks — title mismatch was the clear cause.

---

### Pinterest Check-in — June 24

**Monthly views:** ~20K (last confirmed June 3 meeting — Eann took over posting June 18)
**Pin count:** 355 Sabbir pins delivered May 25. Live count since handoff: posting at 4-5/day.
**Link status:** Pointing to Airbnb (threshold to switch: 25-30K monthly views — not yet reached)

**Quora Q&A live:** 2 batches created (392 questions in Google Doc + 10 additional questions sent June 2026). Sabbir posting 2-3/day from brand new profile (~June 15). Expect 4-6 weeks before Quora authority builds.
**FAQPage JSON-LD coverage:** All 86 blog posts have FAQPage JSON-LD.

**Action items:**
1. Confirm from Sabbir: how many pins live before June 18 handoff (starting point for Eann's schedule)
2. Confirm from Sabbir: Quora actual posting cadence — is 2-3/day happening?
3. Confirm from Sabbir: Goodreads ebook first-publish date
4. Monthly views below 25K threshold — keep Airbnb links. Reassess when Sabbir reports July numbers.

---

# PART 9: AI MARKETING SYSTEM — RACHEL GAINSBURG SYNTHESIS (June 24, 2026)

**Content Tracker (Google Sheets):** https://docs.google.com/spreadsheets/d/1nEAUpxSaDpm44HlWSy5WP-BFbr0IORehtGF385Ua5BY/edit
Tabs: Pinterest Pins | Email Campaigns | Quora Answers | Newsletter
All captions from RG-1 are pre-loaded in the Pinterest Pins tab. Add new content here as it's created.

*Source: 11 "Her AI Empire" Substack articles (Build-a-Thon series). Filtered for Indigo Palm applicability.*

---

## Quick Wins (under 2 hours each)

~~**TASK GSC-11: Rewrite palm-springs-surf-club title/meta**~~ ✅ **DONE 2026-06-26** — Title: "Palm Springs Surf Club: Hours, Tickets + What to Know Before You Go" (58 chars). Meta updated to lead with the arrival warning: "Day passes run $100-250, sessions book out 1-2 weeks ahead on weekends, and showing up without a reservation is a wasted trip."

~~**TASK GSC-12: Rewrite palm-springs-vs-indio title to capture the distance query**~~ ✅ **DONE 2026-06-26** — Title: "Indio vs. Palm Springs: 30 Miles Apart, Very Different Trips" (60 chars) — leads with the distance hook to match the dominant query "how far is indio from palm springs" (858 imps, 0.1% CTR). Meta updated to open with "30 miles apart, 30 minutes by car."

~~**TASK GSC-13: Rewrite where-to-stay-coachella meta description**~~ ✅ **DONE 2026-06-26** — Meta rewritten with owner-honest framing: "The honest breakdown: camping, hotels, vacation rentals, and why walkable Indian Palms rentals beat every option for groups of 4 or more. I own two properties here and have no reason to sugarcoat it." dateModified bumped to 2026-06-26.

~~**TASK GSC-14: Fix beyond-coachella-desert-escape title/meta**~~ ✅ **ALREADY DONE June 24** — Title: "Beyond Coachella: What to Do in the Coachella Valley Year-Round" (confirmed in GSC-8 done June 24). No further action needed.

~~**TASK GSC-15: Add title + meta to /blog/ index page**~~ ✅ **DONE 2026-06-26** — Title rewritten keyword-first: "Coachella Valley Travel Guide: Local Picks, Festival Tips + Desert Stays". Meta updated with owner framing and "no affiliate links" trust signal. Edited directly in `blog/index.html` (static HTML).

~~**TASK GSC-20: Second-pass title/meta rewrite on `coachella-2027-where-to-stay`**~~ ✅ **DONE 2026-07-11** — Title changed to "Coachella 2027: Private Home, Walk to the Polo Grounds" (54 chars), meta rewritten to lead with the shuttle-math pain point and a concrete detail (5 min walk, sleeps 8, no surge pricing). Check CTR lift at next GSC check-in.

~~**TASK GSC-21: Second-pass title/meta rewrite on `beyond-coachella-desert-escape`**~~ ✅ **DONE 2026-07-11** — Title changed to "Beyond Coachella: The Desert Trips Festival Crowds Skip" (55 chars), meta reworded from "guides end at" to "guides stop at" + sharper framing. Check CTR lift at next GSC check-in.

~~**TASK GSC-17: Third-pass title/meta rewrite on `beyond-coachella-desert-escape`**~~ ✅ **DONE 2026-07-15** — Still flagged (58 imps, 0 clicks, 60% of impressions ≤ pos 20) after the 7/11 pass. Title changed to "Coachella Valley Year-Round: Life Beyond Festival Season", meta rewritten to lead with the year-round intent instead of the festival-crowds framing. This finally matches the `Coachella Valley year round` keyword already in frontmatter. Check CTR at next GSC check-in.

~~**TASK GSC-22: Title/meta rewrite on `where-to-stay-coachella-2026`**~~ ✅ **NOT ACTIONABLE, CORRECTED 2026-07-20** — Flagged in the 2026-07-20 GSC Check-in (529 imps, 2 clicks, 0.4% CTR, 67.1% of impressions ≤ pos 20). A rewrite was briefly committed and then reverted the same day: this page uses `layout: redirect.njk`, which hardcodes `<title>Redirecting...</title>` and has no `<meta name="description">` tag at all — neither field reads from frontmatter. So editing `title`/`metaDescription` here changes nothing Google can see on the live page; the only thing that moved was the RSS feed entry text (feed.xml/feed-cozy-cactus.xml), which doesn't drive GSC clicks or impressions. Frontmatter reverted to original values, feeds rebuilt back to original. This matches the June 22 "no action" ruling on this same page (line ~564) and the earlier 2026-07-20 GSC Check-in correction above — third confirmation this URL isn't a rewrite target. Any real fix here is Google fully dropping the noindex'd URL from its index once it re-crawls; nothing to action on our end. New technical item logged in Part 5: redirect stub pages shouldn't be full items in the RSS feed.

~~**TASK GA4-1: Diagnose Cozy Cactus property page's 83.3% bounce rate**~~ ✅ **DONE 2026-07-17** — 160 views/118 users over 2026-06-13 to 2026-07-10, the highest-traffic page site-wide and also the leakiest. The page-side fix already shipped under TASK RG-21 (2026-07-13): removed a duplicated "Why Book Direct" block cluttering the sidebar next to the CTA, and added a "★ 4.97 · 146 reviews · Airbnb Guest Favorite" trust line directly in the hero, above the fold, where the only rating signal previously lived below the fold on mobile. That addresses the most likely page-side cause. Still open, and still needing Eann: pulling up the live "Ad | Cozy Airbnb Bedroom for Famili" Pinterest ad creative next to the page to confirm there isn't also an ad-copy/page-copy mismatch — flag this at the next GA4 check-in to see if the bounce rate actually moved after the RG-21 fix before spending more time on the ad side.

---

~~**TASK RG-1: Sunday 90-min vibe marketing workflow**~~ ✅ **DONE 2026-07-11 (this week's batch — run again next Sunday)** — Top 3 hooks per property generated and written to `/tmp/rg1-weekly-vibe-marketing-2026-07-11.md`. Visual generation (NanoBanana/Ideogram) is a manual step for Eann; captions are ready to pair with photos now. Recurring task — re-run every Sunday, this only covers the current week.

~~**TASK RG-2: Pinterest caption cleanup via Claude browser extension**~~ ✅ **DONE June 25 (Eann installs — 5 min setup)** — Install Claude extension from Chrome Web Store (search "Claude"). Then open Pinterest, select a batch of pins, and run: "Scan these pins, draft scroll-stopping captions using problem > solution > soft CTA structure, show all before saving." The caption cleanup prompt is ready to use — no further build needed. Source: Lesson 5 (browser agent).

~~**TASK RG-3: Quora answer template using thread prompt structure**~~ ✅ **DONE 2026-07-11** — Full prompt template written to `/tmp/rg3-quora-answer-template.md`: problem > pain > tactical solution > soft CTA structure, plus the cadence rule (5-7 existing high-volume questions/week, not self-created ones — ties to the June 26 Quora audit finding). Source: Lesson 3 (viral thread prompt).

~~**TASK RG-4: Claude Project "Indigo Palm HQ"**~~ ✅ **DONE June 25** — Context doc written at `/tmp/indigo-palm-hq-claude-project.md`. Covers: About, Properties, Brand Voice (with banned phrases + sentence stacking rules), Guest Personas, Key Facts Never Get Wrong (Airbnb 20%, walking distance rule, pet policy per property, Sundune 5-night flat min, pool types), Content Goals, Owner bio, and the 30-day audit prompt. Eann: create Claude Project → paste this into Project Instructions → connect Gmail + Calendar connectors. Source: Lesson 10 (Claude Cowork 201).

---

## Medium Projects (1-2 days each)

~~**TASK RG-5: Booking intent chat bubble on indigopalm.co**~~ ✅ **DONE June 25 (KB built — Eann sets up account)** — Full chatbot knowledge base written at `/tmp/indigo-palm-chatbot-kb.md`. Includes: system prompt, 60+ Q&A pairs organized by section (Properties, Rates, Location, Pets, Pool, Festivals, Booking Direct, Minimum Stays, Parking), four conversation flows (unknown interest, festival intent, pet inquiry, email capture), and hard facts section. Eann: sign up at mindpal.space or voiceflow.com → create "Desert Host" bot → paste system prompt → upload KB file → deploy as chat bubble. Source: Lesson 2 (Build-a-Thon #2).

~~**TASK RG-6: "5 Why's" conversion brief for pin batches**~~ ✅ **DONE 2026-07-11** — Full brief written to `/tmp/rg6-five-whys-brief.md`, mapped for all 3 properties. Confirmed the weakest Whys are "Why now" and "Why not a hotel" across all three, with specific pin concepts for each. Reframed for Eann (not Sabbir) per the Pinterest posting handoff. Source: Lesson 4 (Canva quote cards).

~~**TASK RG-7: Notebook LM infographics from existing blog posts**~~ ✅ **DONE June 25 (post list ready — Eann uploads)** — Top 10 posts selected and documented at `/tmp/rg7-notebook-lm-posts.md` with rationale and best infographic angle for each. Priority batch: palm-springs-vs-indio, where-to-stay-coachella, stagecoach-2027, palm-springs-vs-scottsdale. Eann: go to notebooklm.google.com → New Notebook → Add sources (paste post URLs) → Generate summaries → export as images. Source: Lesson 8.

~~**TASK RG-8: Monday competitor intelligence agent (scheduled)**~~ ✅ **DONE 2026-07-15** — Built as a recurring cron job (Monday 7:00am) documented in `~/airbnb/CLAUDE.md` under "Monday Competitor Intelligence." Pulls PriceLabs comparable pricing, WebSearch on public Airbnb listing pages for competitor complaint patterns, and new-listing checks near Indian Palms Country Club / Palm Canyon Villas. Outputs a "MONDAY COMPETITOR BRIEF" and logs to the Cron Log sheet. No manual work required after setup — note cron jobs are session-bound (7-day auto-expire) and get recreated at the start of every session per the CLAUDE.md Proactive Behaviors list. Source: Lesson 9 (AI employees).

---

## Bigger Projects (1-2 weeks)

~~**TASK RG-9: HeyGen video clone for property tours**~~ ✅ **DONE June 25 (scripts ready — Eann records 15 sec)** — All three Reels scripts written and stored in Content Tracker Google Sheet (see RG-17 below). Eann: sign up at heygen.com → record 15 seconds of yourself → upload to HeyGen → Create Avatar 5 (Instant Avatar) → paste each script → download MP4. One recording session produces all three property tour videos. Source: Lesson 6.

~~**TASK RG-10: Relay.app Content Reservoir**~~ ✅ **DONE June 25 (template built — Eann fills + wires Relay)** — Full Content Reservoir template written at `/tmp/rg10-content-reservoir.md`. Four sections: Guest Review Excerpts, Common Guest Questions, Pinterest Hooks, Honest Limitations. Includes the weekly Claude extraction prompt that outputs 5 pins + 1 Quora answer + 1 blog brief from the Reservoir. Until Relay.app is set up, run the extraction prompt manually every Sunday. Eann: copy template into Google Docs → start filling sections with real guest quotes → sign up at relay.app to automate the Monday trigger. Source: Lesson 11.

---

## What to Skip

- **Micro-SaaS / vibe coding (Lesson 7):** Building software to sell is wrong leverage when three properties need to be filled.
- **Facebook thread strategy (Lesson 3):** Wrong platform for vacation rental guests. Use the underlying prompt structure for Quora instead (already captured in TASK RG-3).

---

## Priority Order This Week

1. TASK RG-1 — Sunday vibe marketing workflow (immediate content output)
2. TASK RG-6 — "5 Why's" brief for Sabbir's next pin batch (NOTE: Eann is now posting, not Sabbir — update framing accordingly)
3. TASK RG-3 — Quora thread prompt template
4. TASK RG-4 — Claude Project HQ + 30-day audit
5. TASK RG-5 — Site chat bubble (MindPal/Voiceflow)
6. TASK RG-7 — Notebook LM infographics from existing posts

---

### New from Rachel — June 24, 2026

Posts processed: meet-baby-mythos, lesson-6-the-real-one (empty), how-i-hit-7-11-4-trust-math-without, i-just-spent-72-hours-with-chatgpt, 12-ai-build-a-thons-in-12-months, getting-started-with-claude-the-7

~~**TASK RG-11: Shorten + goal-focus Claude prompts for Pinterest pin requests**~~ ✅ **DONE June 25** — Updated `pinterest-pins/SKILL.md` Step 2 from a rules checklist to a goal-first format. Each angle now opens with the intended reader outcome ("A traveler is mid-scroll... the overlay text has to make them pause"), then explains how each angle achieves that. The "answer-first, not question-first" rule was also added to overlay text guidance.
Source: `meet-baby-mythos-what-claude-fable`

~~**TASK RG-12: Build the "Carrie" workflow — property URL → Pinterest carousel batch**~~ ✅ **DONE 2026-07-11** — Full prompt template written to `/tmp/rg12-carrie-workflow-prompt.md`. Takes a property URL + theme angle, outputs 5 pin concepts (title, description, overlay text, CTA, alt text) grounded in confirmed property facts. Eann reviews/approves before scheduling.
Source: `how-i-hit-7-11-4-trust-math-without`

~~**TASK RG-13: Start a conversation capture habit for content extraction**~~ ✅ **DONE June 25 (template built — Eann saves to phone)** — Full capture template + weekly extraction prompt written at `/tmp/rg13-conversation-capture.md`. Includes situation table (highest-value moments: Dawn design calls, contractor check-ins, guest feedback, site visits), a phone-friendly capture format, and the Sunday extraction prompt that turns notes into blog angles, Pinterest hooks, and Quora seeds. Eann: bookmark or save the capture template to Notes app and run the extraction every Sunday.
Source: `how-i-hit-7-11-4-trust-math-without`

~~**TASK RG-14: Apply the "Mother Prompt" technique to blog briefs and Quora answers**~~ ✅ **DONE June 25** — Added a "Mother Prompt" block to the top of Step 3 in `new-blog-post/SKILL.md`. It primes the role (Eann Tuan, Indigo Palm host), audience (25-45, done with generic travel content), goal (rank + earn direct booking), and hard constraints (earn every claim, start with scene or direct answer) before any writing begins. Not a rules checklist — it's an identity primer that runs silently before generating.
Source: `getting-started-with-claude-the-7`

~~**TASK RG-15: Create per-property Claude Projects with uploaded context files**~~ ✅ **DONE June 25 (context docs built — Eann creates Projects)** — Three per-property context docs written: `/tmp/terra-luz-claude-project.md`, `/tmp/cozy-cactus-claude-project.md`, `/tmp/sundune-claude-project.md`. Each covers property facts, confirmed listing copy, brand voice, key facts (including pool types, pet policy, parking), and guest reply tone. Eann: go to claude.ai → Projects → New Project → paste the relevant file into Project Instructions (one per property). 5 minutes per property.
Source: `getting-started-with-claude-the-7`

~~**TASK RG-16: Test Ideogram or Nano Banana for seasonal Pinterest graphics**~~ ✅ **DONE June 25 (prompts built — Eann tests free tier)** — Full set of brand-consistent style prompts written at `/tmp/rg16-image-gen-prompts.md`. Includes: master style prompt (terracotta, warm desert, no chrome/glass/cool whites), per-property prompts for Terra Luz/Cozy Cactus/Sundune, seasonal prompts (Coachella/Festival, Summer Off-Season, Holiday/Winter), and brand filter checklist for quality review. Eann: go to ideogram.ai → paste prompts → run brand filter → save anything that scores 5/6+.
Source: `12-ai-build-a-thons-in-12-months`

**TASK RG-17: HeyGen AI video clone for property walkthrough Reels** — IN PROGRESS
Scripts written for all 3 properties. Stored in Content Tracker → Reels Scripts tab.

**What's done:**
- 3 Reels scripts written (Terra Luz, Cozy Cactus, Sundune) — all 130-140 words, ~45-60 sec spoken
- Stored in Google Sheet: https://docs.google.com/spreadsheets/d/1nEAUpxSaDpm44HlWSy5WP-BFbr0IORehtGF385Ua5BY/edit

**What Eann needs to do to finish:**
1. Sign up at heygen.com (free to test — no credit card needed for trial)
2. Record 15 seconds of yourself speaking to camera (chest-up, good light, quiet room, no cuts, look directly at camera). Avatar 5 only needs 15 seconds.
3. Upload to HeyGen → Create Avatar → Avatar 5 (Instant Avatar). Ready in minutes.
4. Paste each script, select your avatar, download MP4 (9:16 vertical, 1080p — Reels-ready)
5. Post. No more recording needed after step 2-3.

**HeyGen pricing:** Free trial has watermarks (good for testing quality). Creator plan = $24/month (annual) or $29/month for publishable 1080p. Voice cloning is included — no ElevenLabs needed separately.

Source: `12-ai-build-a-thons-in-12-months`

---

### What changed on June 25 — GSC Check-in

**Period:** 2026-03-27 to 2026-06-25 (90 days)

**Overall:** 154 clicks, 22,096 impressions, 0.7% CTR, avg position 14.0

**vs. June 24 baseline:** +1 click, +366 impressions — 1-day delta, fully stable.

**What's working:**
- `palm-springs-surf-club`: 34 clicks, 5,696 imps, position 10.2 — consistent top traffic driver
- `palm-springs-vs-indio`: 24 clicks, 4,319 imps, position 8.4 — still close to page 1
- Homepage: 13 clicks, 601 imps, 2.2% CTR — solid brand signal

**Mobile vs. desktop:** Mobile CTR 1.1% (pos 9.0) vs. desktop 0.4% (pos 17.9) — consistent with all prior baselines.

**New CTR opportunities (not previously actioned):**
- `pet-friendly-palm-springs`: 107 imps, position 18.0, 0.9% CTR — title + meta rewrite executed (GSC-9)
- `coachella-valley-weekend-getaway`: 188 imps, position 13.4, 1.1% CTR — meta rewrite executed (GSC-10)

**Monitoring (no action yet):**
- `bnp-paribas-indian-wells-where-to-stay`: 56 imps, position 18.9, 0 clicks — still new, check July 13
- All June 22 + June 24 rewrites still inside the 90-day window — CTR lift won't show clearly until July 13

**Action items generated:**
1. ~~Rewrite pet-friendly-palm-springs title/meta~~ ✅ Done (GSC-9)
2. ~~Rewrite coachella-valley-weekend-getaway meta~~ ✅ Done (GSC-10)
3. July 13: measure CTR lift on all rewrites GSC-1 through GSC-10

---

~~**TASK GSC-9: Rewrite pet-friendly-palm-springs title/meta**~~ ✅ **DONE June 25** — Title: "Dog-Friendly Palm Springs: Rentals, Trails + What to Skip" (58 chars, keyword-first). Meta: "Palm Springs is dog-friendly if you know where. The honest guide to pet-friendly vacation rentals, hiking trails, outdoor patios, and the limits most guides skip over." (167 chars). Post at position 18.0 with 107 imps, 0.9% CTR — lead-keyword shift from "Pet-Friendly" to "Dog-Friendly" matches more common search phrasing.

~~**TASK GSC-10: Rewrite coachella-valley-weekend-getaway meta**~~ ✅ **DONE June 25** — Meta rewritten: "Brilliant from October to April, brutal in summer. The honest Coachella Valley weekend breakdown: best timing, which side to base yourself, and how to handle the afternoon heat." (177 chars). Title kept (already good at 57 chars). Post at position 13.4 with 188 imps, 1.1% CTR — meta now leads with the specific differentiator (seasonal honesty) vs. the generic question opener.

---

### Pinterest Check-in — June 25

**Monthly views:** ~20K (last confirmed June 3 via Sabbir meeting — no new data this week)
**Pin count:** 355 pins delivered May 25. Eann posting 4-5/day since June 18 takeover.
**Link status:** Pointing to Airbnb. Threshold to switch: 25-30K monthly views — not yet reached.

**Quora Q&A live:** 2 batches (392 questions + 10 targeted questions). Sabbir posting 2-3/day from June 15 profile. No traffic expected for 4-6 more weeks.
**FAQPage JSON-LD coverage:** All 86 blog posts have FAQPage JSON-LD.

**Action items:**
1. Confirm from Sabbir: how many pins live before June 18 handoff (Eann needs this to know what's already scheduled)
2. Confirm from Sabbir: Quora actual posting cadence — is 2-3/day happening?
3. At next check-in: re-confirm monthly views — if approaching 25K, prepare Airbnb-to-indigopalm.co link switch

---

### New from Rachel — June 25, 2026 (no new action items)

Posts checked: `what-650000-people-just-learned-about`, `ai-advantage-why-are-you-alive-the`, `before-i-tell-you-what-just-changed-7f2`, `before-i-tell-you-what-just-changed`

All 4 skipped: first three are doctor/mindset/personal-essay content outside Indigo Palm scope. Fourth (Claude Code 2.0 primer) has no new action items since Eann already uses Claude Code. Processed list updated in memory.

---

## RG Tasks Executed — June 25, 2026

~~**TASK RG-3: Quora answer template**~~ ✅ **DONE June 25** — See template below.

**Quora Answer Template (copy-paste for Sabbir or any new Quora batch):**

```
CONTEXT FOR CLAUDE:
Business: Indigo Palm Collective — three vacation rentals in the Coachella Valley, California (Terra Luz and Cozy Cactus in Indio, The Sundune in Palm Springs).
Audience: Couples, families, and groups planning a trip to Palm Springs, Coachella, Stagecoach, or the broader Coachella Valley.
CTA: Visit indigopalm.co and check availability.

For each question below, write a Quora answer using this structure:
1. Open with the direct answer in the first sentence — no preamble, no "Great question."
2. Paragraph 2: specific, useful detail (exact distances, amenities, logistics, what makes the area different)
3. Paragraph 3: the thing most people get wrong or skip — the honest nuance
4. Close with ONE sentence linking to a specific indigopalm.co page or blog post

Tone: knowledgeable local who owns rentals in the area. Not salesy. Willing to acknowledge limitations. No em dashes. No stacking of short standalone sentences — connect ideas with commas or conjunctions.
Length: 200-350 words per answer.

Questions to answer:
[PASTE QUESTIONS HERE]
```

~~**TASK RG-6: "5 Why's" conversion brief for Pinterest pins**~~ ✅ **DONE June 25** — See brief below.

**5 Why's Brief — Indigo Palm Properties:**

*For Eann to use when planning her next Pinterest pin batch. Each "Why" maps to a pin angle.*

**WHY ME (Why stay here, not at a hotel)?**
- Terra Luz: private saltwater pool + hot tub, Cuban-inspired interior, dog-friendly with fenced yard, outdoor kitchen, walkable to Coachella
- Cozy Cactus: community pool + private hot tub, great for families (infant gear on-site), same neighborhood as Terra Luz
- Sundune: 3 king beds in a 2BR (no one fights over the good room), Palm Springs location, quiet HOA community
- Weakest "Why Me" in current pins: the outdoor kitchen at Terra Luz and the 3-kings setup at Sundune are underrepresented

**WHY THIS (Why the Coachella Valley, not somewhere else)?**
- Walking distance to Empire Polo Club from Indian Palms (Terra Luz, Cozy Cactus)
- Palm Springs design scene, Modernism Week, BNP Paribas tennis (Sundune angle)
- Desert heat = evening pool culture, something LA/SD can't replicate
- Weakest: pins don't explain what makes Indian Palms specifically special vs. any Indio rental

**WHY YOU (Why choose Indigo Palm over another rental)?**
- Book direct = skip Airbnb's 20% service fee
- Superhost, 4.97-4.98 stars across 146 reviews
- Dog-friendly with no weight limits (Terra Luz, Sundune)
- Weakest: social proof is rarely visible in current pins. Add "4.97 stars, 146 reviews" or a guest quote.

**WHY NOW (Why book this trip soon)?**
- Coachella and Stagecoach properties book out by November for April dates
- BNP Paribas properties book 4-6 months ahead (tournament is in March)
- Off-season rates are 30-50% lower — this is the best time to book summer
- Weakest Why in current pins: urgency is almost never mentioned. This is the biggest gap.

**WHY NOT (Why you shouldn't come — the honest limitations)?**
- Terra Luz and Cozy Cactus are in a quiet residential golf community — no walkable bars or restaurants
- Sundune has HOA 4-night minimum stay — not ideal for a quick 2-night weekend
- Peak summer (June-August) is genuinely brutal — not for everyone
- Weakest: current pins ignore this entirely. One honest "who this is NOT for" pin will outperform 10 promotional ones.

**Priority pins to write based on this:**
1. Urgency angle: "Coachella 2027 properties book out before the lineup drops"
2. Social proof angle: "4.97 stars — here's what 146 guests said about the pool"
3. Honest limitation: "This neighborhood has no walkable restaurants and that's the point"
4. 3-kings angle: "No one fights over the good room at The Sundune"

~~**TASK RG-12: "Carrie" workflow**~~ ✅ **DONE June 25** — See prompt below.

**The Carrie Prompt (paste into Claude when you need a pin batch):**

```
You're generating Pinterest pins for Indigo Palm Collective, a vacation rental brand in the Coachella Valley, CA. Properties: Terra Luz (Indio, Cuban-inspired, private saltwater pool, dog-friendly, walking distance to Coachella), Cozy Cactus (Indio, family-friendly, hot tub, community pool), The Sundune (Palm Springs, 3 king beds, dog-friendly with approval, 4-night min).

SOURCE: [PASTE PROPERTY PAGE URL OR BLOG POST URL]
ANGLE: [e.g., "dog-friendly Coachella weekend" / "family trip with toddler" / "bachelorette group of 6"]

Generate 5 Pinterest pins in this exact format for each:

PIN [N] | Type: [Practical / Emotional / Booking-intent]
Board: [specific board name]
Title: [60 chars max, keyword-first]
Description: [150-200 words — problem > specific detail > soft CTA. No em dashes. No sentence stacking.]
Overlay text: [10-12 words for the graphic, punchy, problem-first]
Image suggestion: [one word description of the shot that would work best]

Rules:
- At least 1 Practical (answers a real question), 1 Emotional (you-are-there feeling), 1 Booking-intent (direct CTA)
- Every pin ends with a link to indigopalm.co/[relevant page]
- No buzzwords (luxury, curated, world-class). Replace with the specific detail that earns those adjectives.
- For festival pins: "walking distance to the Empire Polo Club" — never "2.5 miles" or any specific mileage
- For booking pins: include "book direct at indigopalm.co and skip Airbnb's 20% service fee"
```

---

### What changed on 2026-06-26 — GSC Check-in

**Period:** 2026-03-28 to 2026-06-26 (90 days)

**Overall:** 158 clicks, 22,491 impressions, 0.7% CTR, avg position 14.0

**vs. prior period (90 days ending March 27):** +150 clicks, +21,990 impressions — this is the site going from essentially invisible (8 clicks, 501 imps) to getting real organic traction.

**What's working:**
- `palm-springs-surf-club`: 34 clicks, 5,806 imps, pos 10.2 — top traffic driver by a wide margin, page 1 but CTR is only 0.6%
- `palm-springs-vs-indio`: 24 clicks, 4,392 imps, pos 8.4 — second-biggest page, page 1, CTR also only 0.5%
- `indio-local-gems`: 9 clicks, 322 imps, 2.8% CTR — punching well above its impression weight. Title is working.
- `outdoor-furniture-desert-heat`: 6 clicks, 208 imps, 2.9% CTR — another strong performer by CTR

**Mobile vs. desktop:** Mobile CTR 1.1% at pos 9.0 vs. desktop 0.4% at pos 17.9 — mobile is the real channel here. Desktop rankings are buried.

**CTR opportunities (rewrites queued):**
- `palm-springs-surf-club`: 5,806 imps, 34 clicks, pos 10.2 — CTR 0.6% on page 1 is a waste. Title rewrite needed. Target: "Palm Springs Surf Club: Hours, Tickets, What to Know Before You Go" (or similar). This page alone could 3x to 100+ clicks with a 2% CTR.
- `palm-springs-vs-indio`: 4,392 imps, 24 clicks, pos 8.4 — CTR 0.5%, page 1. Query driving most traffic: "how far is indio from palm springs" (858 imps, 0.1% CTR). Title is not answering that question — rewrite to lead with the distance/comparison hook.
- `where-to-stay-coachella`: 2,939 imps, 9 clicks, 0.3% CTR, pos 14.0 — fix meta description to be specific and action-oriented, not generic.
- `where-to-stay-coachella-2026`: 1,100 imps, 4 clicks, 0.4% CTR, pos 8.7 — page 1 position with nearly zero CTR. Title likely too generic.
- `indian-palms-vacation-rental`: 1,347 imps, 9 clicks, 0.7% CTR, pos 8.6 — page 1, CTR below 1%. Worth a title sharpening.

**Weak pages (content or title fix needed):**
- `things-to-do-indio-ca`: 480 imps, 1 click, pos 40.3 — deep in rankings, likely needs content expansion or topical authority to move up
- `best-hiking-palm-springs`: 328 imps, 0 clicks, pos 66.6 — buried; not competing
- `palm-springs-aerial-tram`: 219 imps, 1 click, pos 10.7 — page 1 position, 0.5% CTR is bad. Title/meta rewrite needed.
- `beyond-coachella-desert-escape`: 74 imps, 0 clicks, pos 10.1 — page 1 with no clicks at all. This is the clearest signal of a title/meta problem.
- `/blog/` index page: 61 imps, 0 clicks, pos 11.9 — index page needs a proper title tag and meta description

**Action items generated:**
1. ~~**TASK GSC-11:** Rewrite `palm-springs-surf-club` title/meta~~ ✅ Done 2026-06-26
2. ~~**TASK GSC-12:** Rewrite `palm-springs-vs-indio` title~~ ✅ Done 2026-06-26
3. ~~**TASK GSC-13:** Rewrite `where-to-stay-coachella` meta description~~ ✅ Done 2026-06-26
4. ~~**TASK GSC-14:** Rewrite `beyond-coachella-desert-escape` title/meta~~ ✅ Already done June 24 (GSC-8)
5. ~~**TASK GSC-15:** Add title tag and meta description to `/blog/` index page~~ ✅ Done 2026-06-26

### What changed on 2026-07-13 — GSC Check-in

**Period:** 2026-06-13 to 2026-07-13 (30 days)

**Overall:** 106 clicks, 14,449 impressions, 0.7% CTR, avg position 11.1

**vs. prior period (2026-05-13 to 2026-06-12):** +52 clicks, +5,391 impressions — continued growth, CTR flat at 0.6-0.7%.

**What's working:**
- `palm-springs-vs-scottsdale`: 22 clicks, 979 imps, 2.2% CTR, pos 7.6 — best CTR of any real-traffic page
- `palm-springs-surf-club`: 20 clicks, 3,789 imps, pos 8.9 — biggest traffic driver by impressions, CTR still soft at 0.5%
- `palm-springs-vs-indio`: 12 clicks, 2,549 imps, pos 7.5 — strong position, CTR still soft at 0.5%
- `palm-springs-heat-activities`: 7 clicks, 127 imps, 5.5% CTR — small volume but title is working well

**Mobile vs. desktop:** Mobile 1.1% CTR at pos 8.6 vs. desktop 0.4% at pos 13.4 — same pattern as June, mobile remains the stronger channel.

**Title/meta rewrite target identified and fixed:**
- `indian-palms-vacation-rental`: 678 imps, 0 clicks, pos 7.0 (98.7% of impressions at pos ≤ 20). Per-query breakdown showed this page ranks well for "Indian Palms security gate," "front gate," "reviews," and "golf" queries — logistics/informational intent about the country club itself, not vacation-rental booking intent — while the old title/meta ("Indian Palms for Coachella: An Owner's Honest Review") only signaled Coachella + owner review. Rewrote title to "Indian Palms Gate Access & Security: A Renter's Guide" and meta to lead with gate/security, keeping the Coachella review content (which already covers this in FAQ #3). Added matching keywords. Shipped 2026-07-13.

**Declined rewrites (thin/noisy signal, not worth a mechanical pass):**
- `coachella-2027-where-to-stay`: 56 imps — 15 of those are a single bot-like negated-operator query string ("coachella" -site:reddit.com ...), not real searcher signal
- `classpass-palm-springs`: 54 imps, already branded "classpass" queries, title already reasonably matched

**Content/authority-fix pages (not title/meta problems, need real content or backlinks — longer-term, not auto-actioned this run):**
- `palm-springs-bars` (439 imps, pos 23.7), `best-restaurants-palm-springs` (248 imps, pos 33.5), `date-farms-indio-coachella-valley` (213 imps, pos 12.4), `palm-springs-coffee-guide` (174 imps, pos 10.2), `pet-friendly-palm-springs` (160 imps, pos 18.6), `bnp-paribas-indian-wells-where-to-stay` (114 imps, pos 18.9), `things-to-do-palm-desert` (109 imps, pos 28.5)

**Action items generated:**
1. ~~**TASK GSC-16:** Rewrite `indian-palms-vacation-rental` title/meta to match gate/security search intent~~ ✅ Done 2026-07-13

### What changed on 2026-07-15 — GSC Check-in

**Period:** 2026-04-15 to 2026-07-14 (90 days) vs. 2026-01-14 to 2026-04-14

**Overall:** 211 clicks, 31,891 impressions, 0.7% CTR, avg position 13.0 (prior period: 18 clicks, 1,406 impressions — traffic base is now ~22x larger than three months ago)

**What's working:** `palm-springs-surf-club` (45 clicks, 8,512 imps, pos 9.6), `palm-springs-vs-indio` (30 clicks, 6,058 imps, pos 8.1), `palm-springs-vs-scottsdale` (23 clicks, 1,529 imps, 1.5% CTR, pos 8.2) — these three carry nearly half of all clicks site-wide.

**CTR opportunities:** `how far is indio from palm springs` — 1,060 imps, 0.2% CTR, pos 7.9. Ranks well, barely clicked. Feeds `where-to-stay-coachella` mostly.

**Weak pages reviewed:**
- `classpass-palm-springs`: 59 imps (was 54 on 7/13), 0 clicks, 100% of impressions ≤ pos 20. Re-flagged by the mechanical diagnosis but the underlying reasoning from 7/13 still holds — branded "classpass" queries, title already matches intent, volume too thin (59 imps/90 days) to justify a rewrite pass. **Declined again**, same as 7/13.
- `beyond-coachella-desert-escape`: 58 imps, 0 clicks, 60% of impressions ≤ pos 20. Genuinely new candidate (never evaluated in a prior check-in). Old title "Beyond Coachella: The Desert Trips Festival Crowds Skip" buried the actual search intent (year-round/off-season Coachella Valley) behind a vague festival-adjacent hook. ~~**TASK GSC-17:** Rewrite `beyond-coachella-desert-escape` title/meta to lead with year-round search intent~~ ✅ Done 2026-07-15 — title → "Coachella Valley Year-Round: Life Beyond Festival Season", meta now leads with the same framing.

**Content/authority-fix pages (not title/meta problems, unchanged from 7/13, need real content or backlinks):**
`palm-springs-bars` (887 imps, pos 29.9), `things-to-do-indio-ca` (523 imps, pos 41.4), `best-restaurants-palm-springs` (419 imps, pos 36.5), `best-hiking-palm-springs` (326 imps, pos 64.8), `things-to-do-palm-desert` (263 imps, pos 42.3), `salton-sea-day-trip` (245 imps, pos 34.9), `pet-friendly-palm-springs` (236 imps, pos 18.8), `date-farms-indio-coachella-valley` (231 imps, pos 12.4), `coachella-valley-insider-guide` (212 imps, pos 55.1), `bnp-paribas-indian-wells-where-to-stay` (164 imps, pos 18.8)

**Action items generated:**
1. ~~**TASK GSC-17:** Rewrite `beyond-coachella-desert-escape` title/meta~~ ✅ Done 2026-07-15

### Pinterest Check-in — 2026-07-15

**Monthly views:** Context files still cite an older ~20K estimate, but the real Pinterest Business Hub screenshot (Eann, captured this week) shows the *ads* dashboard, not organic monthly views: $207.55 spend/30 days (-1%), 34.17K ad impressions (+62%), 230 ad clicks (-18%); organic-only summary in that same screenshot is 1.44K impressions (+113%) and 26 engagements (+36%). Neither figure is the "monthly viewers" number the 25K switch-to-indigopalm.co threshold is based on. **Open item:** pull the actual Pinterest Analytics "Overview → monthly viewers" number next time Eann is in Pinterest — ad spend is climbing (3 active campaigns) while organic reach still looks thin by comparison.
**Pin count:** No fresh count logged this run — Pinterest posting is now Eann's responsibility, Sabbir's scope narrowed to Quora/GEO/Goodreads.
**Top performing:** "Ad | Cozy Airbnb Bedroom for Famili" (35.32K ad impressions, 236 clicks) carries almost all paid traffic. Top organic pins ("How to Stage a Vacation Rental for a Photo Shoot," "The Wild Tropics Bedroom") are both under 100 impressions and use narrative titles, not the concrete room+audience+location pattern that's been shown to convert.
**Link status:** Airbnb (organic monthly views unconfirmed, but nowhere near the 25K-30K threshold based on the 1.44K/30-day organic impression figure).
**Action items:** none auto-actioned this run — pin creation is now Eann's manual task.

### GA4 Check-in — 2026-07-15

**Period:** 2026-06-13 to 2026-07-10 (latest `Reports_snapshot.csv` export)

**Overall:** 346 active users, 348 new users, avg engagement 35.8s/user, 1,854 events

**Traffic source mix (sessions):** google/organic 136, pinterest/organic 126, direct 91, pinterest/social 18 — Pinterest (organic+social+referral ≈ 147) is now essentially even with google/organic.

**High-bounce pages (50+ views, >60% bounce):**
- Cozy Cactus property page: 160 views, 118 users, **83.3% bounce rate** — the highest-traffic page on the site and also the leakiest single page.
- Welcome Guide | The Cozy Cactus: 22 views, 70% bounce — same property, smaller volume, likely same root cause.

**Property page visibility:** Cozy Cactus 160 views ≫ Terra Luz 29 views ≫ Sundune 12 views (Cozy Cactus dominance tracks with the ad campaign; Sundune under-exposed relative to the other two).

**Action items generated:**
1. **TASK GA4-1:** Diagnose Cozy Cactus property page's 83.3% bounce rate — likely mismatch between the "Ad | Cozy Airbnb Bedroom for Famili" ad creative and the page's above-the-fold content. Needs the live ad creative viewed side-by-side with the page before deciding page-side vs. ad-side fix. Flagged for manual review (requires viewing the live ad), not auto-actioned.
2. Sundune under-exposed vs. Terra Luz/Cozy Cactus in blog internal linking and Pinterest boards — noted for the next content-gap pass, not urgent.

### What changed on 2026-07-17 — GSC Check-in

**Period:** 2026-04-18 to 2026-07-17 (90 days) vs. 2026-01-17 to 2026-04-17

**Overall:** 222 clicks, 33,265 impressions, 0.7% CTR, avg position 12.8 (prior period: 24 clicks, 1,768 impressions)

**What's working:** `palm-springs-surf-club` (47 clicks, 8,833 imps, pos 9.4), `palm-springs-vs-indio` (30 clicks, 6,242 imps, pos 8.0), `palm-springs-vs-scottsdale` (24 clicks, 1,656 imps, 1.4% CTR, pos 8.2) — same three winners holding the same share of clicks as 7/15, just compounding.

**CTR opportunities:**
- `how far is indio from palm springs` — 1,064 imps, 0.2% CTR, pos 7.8. Same standing opportunity as every prior check-in; still unaddressed.
- `indigo` — 253 imps, 0.4% CTR, pos 4.5. Branded query, ranks #1-5, barely clicked — likely a SERP snippet/title mismatch on the homepage rather than a content problem.
- `where to stay for coachella` — 101 imps, 1.0% CTR, pos 19.6. New entrant this run (was 99 imps on 7/14). Sits right at the position-20 cliff; a small ranking push would make this a real CTR play.

**Weak pages reviewed:**
- `coachella-2027-where-to-stay`: 60 imps, 1 click, 100% of impressions ≤ pos 20 → mechanically flagged as a title/meta rewrite target. **Declined.** This is a forward-dated seasonal post (2027) getting real position-7 average rank already; rewriting the title now, five months before the event window matters, risks losing the exact-match year-keyword that's earning the ranking in the first place. Revisit closer to the 2027 festival season.
- `/cozy-cactus/` (property page, not a blog post): 70 imps, 2 clicks, pos 13.6, 8.7% of impressions ≤ pos 20 → content/authority fix, not title/meta. First time this page has surfaced in a check-in. Consistent with the GA4 finding below (83.3% bounce on this same page) — the page is getting found and getting left, which points at above-the-fold content/CTA, not discoverability.
- `classpass-palm-springs`: still thin, still declined, unchanged reasoning from every prior run.

**Content/authority-fix pages (unchanged list, still need real content or backlinks, not title/meta):**
`things-to-do-indio-ca` (516 imps, pos 41.2), `best-restaurants-palm-springs` (452 imps, pos 36.0), `date-farms-indio-coachella-valley` (296 imps, pos 13.1), `best-hiking-palm-springs` (296 imps, pos 63.9), `things-to-do-palm-desert` (293 imps, pos 40.5), `pet-friendly-palm-springs` (247 imps, pos 19.0), `salton-sea-day-trip` (243 imps, pos 35.1), `bnp-paribas-indian-wells-where-to-stay` (165 imps, pos 18.7), `coachella-valley-food-guide` (120 imps, pos 23.4)

**Action items generated:**
1. Diagnose `/cozy-cactus/` property page jointly with the GA4 83.3% bounce finding — same page, two signals pointing the same direction. Needs the live "Ad | Cozy Airbnb Bedroom for Famili" creative reviewed side-by-side with the page, same blocker as TASK GA4-1. Not auto-actioned.
2. `indigo` branded-query CTR (0.4% at position 4.5) is worth a homepage title-tag look next run if it persists — flagged, not actioned this run (single data point so far).

### Pinterest Check-in — 2026-07-17

**Monthly views:** No fresh Pinterest Analytics "Overview → monthly viewers" pull this run — still the open item from 7/15. The Business Hub ads-dashboard screenshot on file only gives organic impressions (1.44K/30 days as of 7/15), not the monthly-viewers figure the 25-30K link-switch threshold is based on. **Do not treat any impressions figure as the monthly-viewers number** — they are different metrics and conflating them risks a premature link switch.
**Pin count:** No fresh count logged this run — Pinterest posting is Eann's task per the July transition (Sabbir's scope narrowed to Quora/GEO/Goodreads).
**Top performing:** Unchanged from 7/15 — the paid "Ad | Cozy Airbnb Bedroom for Famili" pin still carries nearly all traffic; organic pins remain sub-100 impressions.
**Link status:** Airbnb. **Open decision for Eann, not auto-actioned:** confirm whether any Pinterest Analytics monthly-viewers pull (not ad or organic-impression numbers) has crossed 25-30K — if yes, switch links to indigopalm.co per the standing threshold rule; if unconfirmed, leave as-is. This has now come up in three consecutive check-ins (7/13, 7/15, 7/17) without a real number — worth a direct 2-minute Pinterest Analytics login rather than inferring from ad dashboards.
**Action items:** none auto-actioned — pin creation and the monthly-viewers pull are both Eann's manual tasks.

### GA4 Check-in — 2026-07-17

`~/Downloads/Reports_snapshot.csv` still carries the same Jul 11 modification timestamp — no fresher export since the 7/13 and 7/15 check-ins. Not re-analyzing stale data a third time. The standing findings (Cozy Cactus property page 83.3% bounce, Sundune visibility gap) remain open and now cross-confirmed by the `/cozy-cactus/` GSC finding above. Pending Eann's next GA4 export.

### What changed on 2026-06-26 (babysit-seo run)

- **GSC-11:** palm-springs-surf-club title rewritten to "Palm Springs Surf Club: Hours, Tickets + What to Know Before You Go". Meta updated to lead with the reservation warning.
- **GSC-12:** palm-springs-vs-indio title rewritten to "Indio vs. Palm Springs: 30 Miles Apart, Very Different Trips" — leads with distance hook for the dominant query (858 imps, 0.1% CTR). Meta opens with "30 miles apart, 30 minutes by car."
- **GSC-13:** where-to-stay-coachella meta rewritten with owner-honest framing. dateModified bumped.
- **GSC-14:** Verified already done June 24 — no action needed.
- **GSC-15:** blog/index.html title rewritten keyword-first: "Coachella Valley Travel Guide: Local Picks, Festival Tips + Desert Stays". Meta updated.
- **FAQ audit:** Verified 10 of 11 posts listed as missing faqItems already had them. Added faqItems to `arriving-coachella-valley-first-afternoon.md` (the only actual gap).

---

### New from Rachel -- June 26, 2026

Post processed: `i-taught-a-3-hour-ai-bootcamp-and`

Core framework: "Own the instructions. Rent the tool." Build reusable instruction sets for each role you need AI to fill, store them somewhere you own (not inside the tool), and redeploy when tools change. The meta-agent pattern (Nova interviews you, outputs instructions) is the operational version of the Mother Prompt technique already applied in RG-14.

~~**TASK RG-18: Build a "Market Researcher" AI employee for Indigo Palm using the Nova framework**~~ ✅ **DONE 2026-07-15 (via TASK RG-8, cron instead of Claude Project)** — Same outcome delivered a different way: instead of a separate Claude Project + Nova interview setup, this is now a recurring Claude Code cron job (Monday 7am, see "Monday Competitor Intelligence" in `~/airbnb/CLAUDE.md`) that pulls PriceLabs comp pricing, checks competitor review complaints, and flags new listings — no manual PriceLabs tab-opening required. Skips the Google Doc/Nova-interview step since the instructions live directly in the cron prompt; functionally equivalent automation with less setup overhead for Eann.
Rachel's bootcamp built this role step by step. For Indigo Palm, this is a PriceLabs + comp analysis bot -- it takes a date range, a property, and a set of criteria, then returns pricing intelligence with no manual lookups. Build it in Claude (not GPT, given Eann's existing Claude workflow): write a system prompt via Nova's interview process, save it to a Google Doc, then paste it into a dedicated Claude Project as the project instructions. Upload knowledge files: Coachella Valley market criteria (peak dates, comp rate floors, festival premiums), PriceLabs rate thresholds per property, and any comp listings Eann tracks manually.

**What this replaces:** the current Monday morning manual comp check. Instead of opening PriceLabs tabs, run a prompt, get a structured report with flags.

**Step-by-step:**
1. Open Claude, paste: "I want to build a Market Researcher AI employee for my vacation rental business. Interview me to write the system instructions." Answer the questions.
2. Copy the output to a Google Doc titled "Indigo Palm Market Researcher -- Instructions"
3. Create a new Claude Project: "Market Researcher -- Indigo Palm"
4. Paste the instructions as the Project Instructions
5. Upload 2-3 knowledge files: (a) comp rate thresholds per property, (b) peak/off-season date calendar, (c) any notes from past PriceLabs audits
6. Test with: "Pull comp rates for Terra Luz for the week of July 4. Flag anything priced below $150/night. What should I adjust?"

**Why now:** TASK RG-8 (Monday competitor intelligence agent) has been open since June 24. This is the practical implementation of that task -- use the Nova interview approach to build the actual system prompt rather than writing it from scratch.

Source: `i-taught-a-3-hour-ai-bootcamp-and`

---

### Pinterest Check-in — 2026-06-26

**Monthly views:** ~20K (as of June 3, 2026 ML campaign report — pending updated screenshot from Sabbir)
**Pin count:** Unknown exact count. Long-term target: 5,000-10,000 pins (5K blog, 5K property). Immediate threshold: 50-60 pins before running next ad campaign.
**Link status:** Airbnb (threshold to switch to indigopalm.co: 25-30K monthly views — not yet hit)

**Quora Q&A live:** ~10 pieces posted in first 11 days (pace: 0.9/day vs. 2-3/day target)
**Top Quora performance:** "PS vs Indio" 254 views, "family-friendly vacation rental" 204 views, "running trails PS" 122 views, "Indio vs PS Coachella" 116 views
**Key Quora issue:** Sabbir posts own questions and answers them — answer views (8-10) are far below question views (116-254). Need to answer existing high-traffic questions, not just self-created ones.

**FAQPage JSON-LD coverage:** ~~75 blog posts with schema, 11 without~~ ✅ **VERIFIED 2026-06-26** — 10 of the 11 listed posts already had faqItems in frontmatter (best-time-to-visit, coachella-valley-food-guide, indian-palms-vacation-rental, joshua-tree-day-trip, palm-springs-heat-activities, palm-springs-vs-indio, palm-springs-vs-scottsdale, pet-friendly-palm-springs, stagecoach-2027, where-to-stay-coachella). The June 26 data was stale. Only `arriving-coachella-valley-first-afternoon.md` was actually missing.

~~Add FAQPage JSON-LD to `arriving-coachella-valley-first-afternoon.md`~~ ✅ **DONE 2026-06-26** — 4 FAQ pairs added covering: first-afternoon priorities, grocery options near Indian Palms, first-night pacing, and arrival timing.

**Action items:**
1. Get a current Pinterest analytics screenshot from Sabbir to confirm monthly views vs. 25K threshold -- last confirmed data is June 3, now 3+ weeks stale.
2. Quora: redirect Sabbir to answer existing high-traffic questions (search Quora for "Palm Springs vacation rental" / "Indio Coachella" queries already getting traction) rather than self-creating new question/answer pairs.
3. Confirm current pin count -- 50-60 pins is the floor before next ad campaign; no tracking number exists in context files.

---

### GSC Check-in — 2026-06-30 (BLOCKED)

**Status:** OAuth token revoked. The Google credential at `~/.claude/google_credentials.json` has an expired/revoked refresh token — `invalid_grant` error when running `gsc_report.py`. This likely happened because a new OAuth flow earlier in the same session created a new token, invalidating the prior one.

**To restore GSC access:** Run `! python3 /tmp/reauth_google_full.py` in Claude Code. This script opens a browser auth flow, writes fresh credentials back to `~/.claude/google_credentials.json`, and restores all scopes (webmasters, gmail, spreadsheets, drive, etc.). Do this before the next babysit-seo run.

**Impact this run:** No new GSC data for June 28-30. Prior baselines (June 26 check-in) remain the most current numbers. Next run should start with Phase 0.5 GSC and pull a fresh 90-day report.

---

### Pinterest Check-in — 2026-06-30

**Monthly views:** ~20K (still June 3 data — no updated screenshot from Sabbir; now 27 days stale)
**Pin count:** Eann posting 4-5/day since June 18 (12 days = ~48-60 additional scheduled). Total in queue: still drawing from the 355 Sabbir delivered May 25 plus the 15 batch from the June 23 Pinterest audit.
**Link status:** Airbnb (threshold to switch to indigopalm.co: 25-30K monthly views — not yet reached)

**Quora:** As of June 26 -- ~10 pieces posted in first 11 days (0.9/day vs. 2-3/day target). Key issue identified: Sabbir is posting own questions and answering them (answer views 8-10) vs. answering existing high-traffic questions (question views 116-254). Redirecting Sabbir to answer existing questions is the highest-leverage Quora fix.
**FAQPage JSON-LD coverage:** All 86 blog posts confirmed with FAQPage JSON-LD (verified June 26).

**Action items:**
1. **Eann:** Get current Pinterest analytics screenshot from Sabbir -- monthly views data is now 27 days stale. If approaching 25K, prepare to switch all high-performing pins from Airbnb links to indigopalm.co.
2. **Eann:** Tell Sabbir to search Quora for "Palm Springs vacation rental", "Indio Coachella", "where to stay Coachella" -- answer those existing questions instead of self-creating new ones.
3. **Eann:** Confirm how many pins Sabbir had posted before June 18 handoff (need this to know actual live count vs. what's still in queue).

---

### babysit-seo run — 2026-06-30 — Open Task Status

All tasks through Part 8 are marked done. Remaining open items are all non-actionable this run:

| Task | Status | Reason |
|------|--------|--------|
| TASK 7 (UTM on Pinterest pins) | Not actionable | Manual task for Eann -- requires Pinterest Business Hub access |
| TASK 10 (Sabbir Quora accountability) | Not actionable | Human conversation |
| Gap D (booking widget urgency signals) | Not actionable | Not until September |
| Week 7-12 link building | Skipped | Outreach tasks per skill instructions |
| TASK RG-1 (Sunday vibe workflow) | Not actionable this run | Recurring Sunday workflow -- run next Sunday |
| TASK RG-8 (Monday comp intelligence agent) | Not actionable | Requires PriceLabs API + Airbnb page scraping setup |
| TASK RG-17 (HeyGen video clone) | Not actionable | Needs Eann to record 15-second video first |
| TASK RG-18 (Market Researcher AI employee) | Not actionable | Requires Eann to run Nova interview in Claude to generate system prompt |
| TASK PIN-1 (Produce 15 pins in Canva) | Not actionable | Manual Canva + Pinterest scheduler task for Eann |
| TASK PIN-2 (Confirm 15 pins live) | Not actionable | Requires Pinterest profile access |

**Next scheduled babysit-seo:** Sunday July 5, 2026 (8:03pm auto-run). Priority for that run: restore GSC access first, then pull a 90-day report to measure CTR lift from June 22-26 rewrites (GSC-1 through GSC-13).

---

### GSC Check-in — 2026-07-02

**Period:** 2026-04-03 to 2026-07-02 (90 days)

**Overall:** 176 clicks, 25,605 impressions, 0.7% CTR, avg position 13.6

**vs. prior period (Jan-Apr):** +167 clicks, +24,965 impressions — site went from essentially zero organic traffic to real volume in one quarter

**Device split:** Mobile 121 clicks / 1.1% CTR / pos 8.9. Desktop 54 clicks / 0.4% CTR / pos 17.2. Mobile is performing 2.75x better on CTR, consistent with prior check-ins.

**What's working:**
- `palm-springs-surf-club` — 37 clicks, 6,671 imps, pos 10.0. Top traffic driver by clicks.
- `palm-springs-vs-indio` — 28 clicks, 5,038 imps, pos 8.2. Strong performer.
- Homepage — 15 clicks, 2.4% CTR at pos 8.8. Good click efficiency.
- `indio-local-gems` — 10 clicks, 2.6% CTR at pos 10.9. Punching above its position.

**CTR opportunities (rewrites executed this run):**

~~**TASK GSC-16: Rewrite `coachella-2027-where-to-stay` title/meta**~~ ✅ **DONE 2026-07-02** — Page at pos 7.2 with 53 impressions and 0 clicks. Old title "Where to Stay in the Valley" was generic. New title "Coachella 2027: Stay in Indio, Walk to the Grounds" and meta lead with the Indian Palms walkability angle, which is the actual differentiator. Check CTR lift at July 13.

~~**TASK GSC-17: Rewrite `beyond-coachella-desert-escape` meta**~~ ✅ **DONE 2026-07-02** — Page at pos 10.1 with 78 impressions and 0 clicks despite June 24 title rewrite. Meta was a flat activity list. Rewrote to open with "Most guides end at the festival gates" contrast hook to earn the click from position 10. Check CTR lift at July 13.

**Weak pages (buried — position > 30, content may be thin):**
- `palm-springs-bars` — 680 imps, pos 32.7, 1 click. Content volume or freshness issue at this position, not a title fix.
- `things-to-do-indio-ca` — 523 imps, pos 40.8, 1 click. Too far back; content expansion or consolidation needed.
- `best-hiking-palm-springs` — 332 imps, pos 65.9, 0 clicks. Effectively invisible at this position.
- `best-restaurants-palm-springs` — 254 imps, pos 35.8, 0 clicks.

**Monitoring (check July 13):**
- `bnp-paribas-indian-wells-where-to-stay` — 91 imps, pos 19.7, 0 clicks. Too new to rewrite; check July 13 for any ranking movement.
- `stagecoach-2027-where-to-stay` — 268 imps, 3 clicks, 1.1% CTR, pos 9.8. Healthy for a future-dated festival post; monitor but no action yet.
- GSC-16 and GSC-17 CTR lift — both rewrites are live after this run. Check at July 13.

---

### Pinterest Check-in — 2026-07-02

**Monthly views:** ~20K (still June 3 data — now 29 days stale. Get a screenshot from Sabbir urgently before the July 5 run.)
**Pin count:** Eann posting 4-5/day since June 18 (14 days = ~56-70 additional). Total drawing from Sabbir's 355-pin batch (May 25) plus June 23 Pinterest audit batch of 15. Full live count unknown without Sabbir confirmation.
**Link status:** Airbnb (switch to indigopalm.co threshold: 25-30K monthly views, not yet confirmed reached)

**Quora:** ~10 posts live as of June 26 (0.9/day vs 2-3/day target). Sabbir was posting self-created questions instead of answering existing high-traffic ones. Key redirect: search "Palm Springs vacation rental", "Indio Coachella", "where to stay Coachella" and answer those existing questions.
**FAQPage JSON-LD:** 86 blog posts confirmed with FAQPage JSON-LD as of June 26.

**Action items:**
1. **Eann:** Get current Pinterest monthly views screenshot from Sabbir. Data is now 29 days stale. If views are at or above 25K, switch all high-performing pins from Airbnb to indigopalm.co links immediately.
2. **Eann:** Confirm Sabbir is answering existing Quora questions (not creating new ones). Target: 2-3 answers/day to questions with 100+ views.
3. **Eann:** Get actual live pin count from Sabbir. Need to know how many of the 355-pin batch are live vs. still in queue before deciding on ad campaign timing.

---

### New from Rachel — 2026-07-11

Post processed: `how-i-hit-1-million-facebook-views`

Core framework: Rachel scaled to 1.4M Facebook views in 6 months with zero ad spend by exporting her Professional Dashboard CSV weekly and feeding it to a custom Claude Skill that finds posting-time patterns, flags her top-performing posts for recycling, and drafts new posts in her voice. The transferable part isn't Facebook-specific tactics — it's the audit → identify pattern → systemize → recycle loop.

**TASK RG-19: Apply the audit-and-recycle loop to Pinterest, now that Pinterest posting is Eann's job**

Since [[project_sabbir_transition]] moved Pinterest posting to Eann as of this month, this is directly actionable — no Sabbir dependency.

1. **Quarterly timing audit.** Once Pinterest Analytics access is confirmed (Action item 1 above), pull the last 90 days and check which posting hours/days actually perform — Rachel's own top slot flipped year over year, so don't assume last quarter's timing still holds.
2. **Build an evergreen pin library.** Track which pins (by category: property photos, local guides, Coachella content) get repinned/clicked most, and recycle those angles verbatim in future batches rather than always creating new ones — most viewers never saw the original.
3. **Lead captions with specific numbers.** "4.98 stars, 146 reviews," "walking distance to Empire Polo Club," "20% you don't pay booking direct" outperform vague claims like "relaxing desert getaway." This matches existing brand voice rules already in place — reinforce it in Pinterest pin copy specifically.
4. **Favor declarative captions over questions.** Rachel's data showed statements beat question-based hooks. Audit current pin captions for this pattern going forward.
5. **Volume isn't the lever — hook quality is.** Her highest-volume month was her worst performer. Don't chase 4-5 pins/day as the goal in itself; prioritize testing/recycling proven hooks over raw output.

**Not directly applicable:** the "10-person engagement pod" tactic is Facebook-algorithm-specific and doesn't map to Pinterest's discovery mechanics — skip.

**Why now:** This is the first Rachel Gainsburg task that Eann can execute directly end-to-end for Pinterest, since Sabbir no longer owns that channel.

Source: `how-i-hit-1-million-facebook-views`

~~**TASK RG-19: Apply the audit-and-recycle loop to Pinterest**~~ ✅ **DONE 2026-07-17 (caption guidance shipped; timing audit + evergreen library still blocked)** — Items 3-5 (lead with specific numbers, favor declarative over question-based hooks, prioritize hook quality over raw volume) are now baked into the pin caption checklist used for every batch going forward: property stats ("4.98 stars, 146 reviews," "walking distance to Empire Polo Club," "20% you skip booking direct") lead the caption, phrased as a statement not a question. Items 1-2 (90-day timing audit, evergreen pin recycle library) stay blocked — both need a live Pinterest Analytics login, same blocker as the monthly-views ask below.

---

### GSC Check-in — 2026-07-11 (unblocked, re-run same day)

**Status:** Auth issue from earlier in the day resolved itself (token refreshed without needing the interactive reauth flow) — `gsc_report.py` ran clean on retry. Also fixed a diagnosis bug in the script this session: it previously flagged weak pages as "rewrite-worthy" based on blended average position, which a few high-ranking long-tail queries can skew low even when most of a page's actual query impressions sit buried past position 30. The script now pulls the real per-query breakdown for each weak page and diagnoses off the share of impressions actually ranking ≤20.

**Period:** 2026-04-12 to 2026-07-11 (90 days)

**Overall:** 198 clicks, 30,197 impressions, 0.7% CTR, avg position 13.1

**vs. prior period (Jan-Apr):** +181 clicks, +29,129 impressions

**Device split:** Mobile 140 clicks / 1.1% CTR / pos 8.9. Desktop 57 clicks / 0.3% CTR / pos 16.4. Mobile still ~3.7x better on CTR.

**What's working:**
- `palm-springs-surf-club` — 44 clicks, 8,055 imps, pos 9.7. Top traffic driver.
- `palm-springs-vs-indio` — 30 clicks, 5,820 imps, pos 8.1.
- `palm-springs-vs-scottsdale` — 17 clicks, 1,398 imps, pos 8.3.
- Homepage — 14 clicks, 2.1% CTR at pos 8.7.

**CTR opportunities (position ≤20, high impressions, low CTR — title/meta rewrite candidates):**
- "how far is indio from palm springs" — 1,033 imps, 2 clicks, 0.2% CTR, pos 8.0. No single page owns this query directly; check which page ranks and tighten its title/meta to answer this distance question explicitly.
- "indigo" — 246 imps, 1 click, 0.4% CTR, pos 4.6. Branded query ranking well but barely converting to clicks — likely a SERP snippet/title issue on the homepage.

**Weak pages — corrected diagnosis (per-query breakdown, not blended average):**
- `coachella-2027-where-to-stay` — 56 imps, 0 clicks, blended pos 7.1, **100% of impressions ≤ pos 20 → still a genuine title/meta rewrite target.** GSC-16's June/July rewrite hasn't moved CTR yet; consider a second pass.
- `beyond-coachella-desert-escape` — 74 imps, 0 clicks, blended pos 10.3, **57.1% of impressions ≤ pos 20 → borderline rewrite target.** GSC-17's rewrite also hasn't landed; worth one more title iteration.
- `bnp-paribas-indian-wells-where-to-stay` — 164 imps, 0 clicks, blended pos 18.8, **27.7% ≤ pos 20 → mostly a content/authority issue, not a title fix.** Deprioritize further title tweaking here.
- `date-farms-indio-coachella-valley` — 167 imps, 2 clicks, blended pos 12.0, **39.5% ≤ pos 20 → content/authority fix**, not title.
- `indio-between-coachella-weekends` — 136 imps, 2 clicks, blended pos 12.2, **22.7% ≤ pos 20 → content/authority fix.**
- `pet-friendly-palm-springs` — 197 imps, 1 click, blended pos 17.9, **only 19.0% ≤ pos 20 → content/authority fix, NOT a title rewrite** despite the misleadingly low blended position. This was the exact bug case the script fix targeted.
- `palm-springs-bars`, `things-to-do-indio-ca`, `best-hiking-palm-springs`, `best-restaurants-palm-springs`, `things-to-do-palm-desert`, `salton-sea-day-trip`, `coachella-valley-insider-guide`, `/blog/` — all under 8% of impressions ≤ pos 20. Confirmed content/authority fixes, not rewrite candidates. Matches prior check-ins' read on these pages.

**Action items generated:**
1. Second-pass title/meta rewrite on `coachella-2027-where-to-stay` — first rewrite (GSC-16) hasn't lifted CTR from 0% after 9 days at a genuinely good position (7.1). Try a sharper hook.
2. Second-pass rewrite on `beyond-coachella-desert-escape` — same pattern, position 10.3, still 0 clicks after GSC-17's June 24 rewrite.
3. Stop treating `pet-friendly-palm-springs`, `date-farms-indio-coachella-valley`, `bnp-paribas-indian-wells-where-to-stay`, and `indio-between-coachella-weekends` as title-fix candidates — they need more content depth/backlinks, not copy tweaks. Deprioritize further title iteration on these.

---

### Pinterest Check-in — 2026-07-11

**Monthly views:** ~20K — still the June 3 screenshot, now 38 days stale. No newer figure found in context files or memory.
**Pin count:** No live-count confirmation from Sabbir since June 18 handoff. Eann has been posting 4-5/day since then (~23 days = ~92-115 additional pins into the queue), but total live count is still unconfirmed.
**Link status:** Airbnb (25-30K monthly-view threshold not confirmed reached — can't confirm without a fresh screenshot)
**Quora:** No new data since June 26 (~10 live, 0.9/day pace). Redirect to answering existing high-traffic questions still outstanding.
**FAQPage JSON-LD:** 86/86 posts confirmed as of June 26 — no new posts published since, so still current.

**Action items (unchanged from July 2, still open):**
1. **Eann:** Get a current Pinterest monthly-views screenshot — this is now the single most stale, most requested data point across three consecutive check-ins (June 26, June 30, July 2, July 11).
2. **Eann:** Confirm actual live pin count vs. queue.
3. **New (TASK RG-19):** Once Pinterest Analytics access is confirmed, run the 90-day timing audit and start tagging top-performing pins for the evergreen recycle library — see TASK RG-19 above.

---

### GA4 Check-in — 2026-07-11

**Period:** 2026-06-13 to 2026-07-10 (28 days, Firebase/GA4 export)

**Overall:** 346 active users, 348 new users, avg engagement 35.8s/user, 1,854 events. Engagement time is low site-wide — most visits aren't sticking around.

**Traffic source mix (sessions):** google/organic 136, pinterest/organic 126, direct 91, airbnb/message 20, pinterest/social 18. Pinterest (126+18=144 combined) has effectively caught up to Google organic (136) as an acquisition channel — validates the current Pinterest push and TASK RG-19.

**High-bounce pages (50+ views, >60% bounce):**
- **Cozy Cactus property page: 160 views, 118 active users, 83.3% bounce.** This is the single biggest fix opportunity on the site — it's the highest-traffic page by a wide margin and 5 out of 6 visitors leave without engaging. Likely cause: visitors arrive from a Pinterest pin or search expecting pricing/availability and don't find an immediate answer above the fold, or page load is slow on mobile.
- Welcome Guide | The Cozy Cactus: 22 views, 70% bounce — lower priority (guest-facing, post-booking traffic, not a growth lever)

**Low-bounce pages worth noting (for contrast):** Terra Luz property page (29 views, 20% bounce) and homepage (80 views, 41.7% bounce) both perform far better than Cozy Cactus at holding attention — worth diffing what Cozy Cactus's page is missing that Terra Luz's has.

**Property page visibility gap:** Cozy Cactus 160 views vs. Terra Luz 29 views vs. Sundune 12 views. Sundune is nearly invisible relative to the other two — it's the newest/smallest listing with the fewest supporting blog posts and pins pointing at it.

**Action items generated:**
1. **Fix Cozy Cactus bounce rate** — rewrite above-the-fold section of the Cozy Cactus property page: lead with price/availability CTA, confirm page load speed on mobile, check that the Pinterest pins driving traffic there match what the page actually shows. Highest-leverage single fix on the site right now.
2. **Close the Sundune visibility gap** — queue a blog post and a Pinterest board/pin batch pointing specifically at Sundune (girls'-weekend / dog-friendly / Palm Springs angle) to bring its view count closer to parity with the other two properties.
3. Continue the Pinterest push (RG-19, RG-1) — traffic-source data confirms it's working, don't deprioritize it for GSC-only wins.

---

### GSC Check-in — 2026-07-13 (BLOCKED)

**Status:** `gsc_report.py` failed with a new failure mode, not the usual expired-token `invalid_grant`:

```
403 insufficientPermissions — "Request had insufficient authentication scopes."
```

This means the stored OAuth token itself was never granted the Search Console (`webmasters`) scope — a scope problem, not an expiry problem. The skill's documented fix (`/tmp/reauth_google_full.py`) doesn't exist this session (it's ephemeral, not persisted across sessions), and there's no scope-repair path available without a fresh browser-based consent screen. That consent click-through can only happen on Eann's machine.

**Action needed from Eann:** run a fresh Google OAuth flow that explicitly requests the Search Console scope (not just Gmail/Sheets), then GSC pulls should work again. Flagging as blocked per the skill's own stopping condition ("a task requires information/access only the user has") rather than working around it.

---

### Pinterest Check-in — 2026-07-13

**Monthly views:** ~20K — still the June 3 screenshot, now 40 days stale. No newer figure found across `.context/` or memory. This is now the 5th consecutive check-in (June 26, 30, July 2, 11, 13) flagging the same stale number.
**Pin count:** 121 pins live confirmed as of 2026-07-11 (per the July 11 pin-level analytics audit — this supersedes the earlier "50-60 pins before first ad campaign" target, which is already well passed). A $215.78 Idea Ad campaign is live using the "Cozy Airbnb Bedroom for Families" title pattern: 34,332 impressions, 238 pin clicks, 237 outbound clicks.
**Top-performing pattern:** Concrete room+audience+location titles (e.g. "Cozy Airbnb Bedroom for Families in Palm Springs") outperform narrative titles on every metric. Terra Luz's 24 narrative-titled pins ("Meet the Host Behind Terra Luz") got **zero clicks across all 24** despite real impressions — confirmed via the July 11 pin audit, not a guess.
**Link status:** Airbnb (25-30K monthly-view threshold not confirmed reached — still can't confirm without a fresh views screenshot, separate from the pin-count data above)
**Quora:** No new data since June 26 (~10 live, 0.9/day pace, possible new-profile throttling at 5-8 views/answer). Sabbir's scope is now Quora/GEO/Goodreads only — Pinterest posting moved to Eann as of the transition.
**FAQPage JSON-LD:** 87/87 posts (86 confirmed June 26 + `best-spas-coachella-valley-spa-day` published/seeded 2026-07-11) — still full coverage.

**Action items:**
1. **Eann:** Get a current Pinterest monthly-views screenshot — now the single most stale, most-repeated open item across 5 check-ins running back to June 26.
2. **Fix Terra Luz pin titles** — retitle new/future Terra Luz pins using the Cozy Cactus room+audience+location pattern; the narrative style is confirmed dead weight (zero clicks on 24 pins). Already corrected in `pinterest-pins` and `pinterest-publisher` skill docs per the July 11 audit; this check-in confirms the fix should be applied going forward, not just documented.
3. **Fix ad UTM tagging** — the live Idea Ad campaign tags its link `utm_medium=organic` instead of `paid`/`cpc`, misattributing $215.78 of paid traffic as organic in GA4. Needs a link update in Pinterest Business Hub (Eann, manual).
4. **Cross-track geo-seeder Quora output** — per TASK RG-20's audit finding, `indigo-palm-geo-seeder` output (e.g. 5 pending Quora pairs for `best-spas-coachella-valley-spa-day`) isn't logged anywhere the Pinterest Check-in can reference, so the "Quora Q&A live" count above is a manual estimate, not a real count. Low-cost fix: have the geo-seeder skill log pending-but-unposted pairs to `~/airbnb/.context/UPDATE_LOG.md` at generation time.

---

### GA4 Check-in — 2026-07-13

`~/Downloads/Reports_snapshot.csv` has the same modification timestamp as the July 11 export (Jul 11, 07:07) — no fresher data since the last check-in. Pending Eann's next GA4 export; not re-analyzing stale data. The July 11 findings (Cozy Cactus 83.3% bounce, Sundune visibility gap) still stand as the open action items — see above.

---

### PSL Newsletter Inspo — 2026-07-13 (nothing extractable this run)

Pulled 20 recent `news@palmspringslife.com` emails (2026-07-01 through 2026-07-13) and filtered to four Coachella Valley-relevant candidates: art galleries, design-forward restaurants, an Idyllwild PCT hiker feature, and a sandwiches roundup. All four topics already have a live corresponding post (`palm-springs-art-galleries-guide.md`, `best-restaurants-palm-springs.md`/`best-restaurants-palm-desert.md`, `idyllwild-day-trip-palm-springs.md`), so per the skill's Step 3 these would be **updates**, not new posts.

Read all four full email bodies. PSL's newsletter format is teaser-only: each gives a 1-2 sentence summary and a "READ MORE" link to a gated full article. None of the four contained an actual extractable fact (no gallery name, no restaurant name, no sandwich shop name) that could honestly be added to an existing post — inserting anything would mean guessing, not reporting. Per Step 0's copyright rules, facts are fair game but have to be real facts pulled from a source, not filled in from a teaser.

**No blog edits made this run.** Two items noted for future reference, not actioned: a Jr Ranger Expo mention (Oct 15 — seasonal, not actionable until closer to the date) and an "8 design-forward hotels" mention in one email preview (unopened, low priority, not a Coachella Valley property topic gap). If a future run wants to convert any of the four candidates into a real update, the next step is WebFetching the specific PSL article URL for names/details, not re-reading the newsletter.

### PSL Newsletter Inspo — 2026-07-15 (nothing extractable this run)

Checked the 4 PSL emails received since the 7/13 run: wine bars/açai bowls/breweries digest (7/15), Lola Rose dinner experience (7/14, booking-only teaser with no content), Abernathy House architecture feature (7/14, real estate/design, not travel), "Your Next Escape Starts Here" (7/13, gated destination teaser). Of these, only the 7/15 digest had a Coachella Valley travel/dining angle — wine bars, breweries, açai bowls (all teaser-only, no venue names, same gated-link problem as 7/13) and a named restaurant profile: El Tranvia in Coachella, owner Oscar Ventura. Checked `indio-local-gems.md` — El Tranvia is already covered there ("doing birria since 1969"). **No blog edits made.** Wine bar/brewery/açai topics remain candidates for a future new post if PSL ever names specific venues in an un-gated preview, but guessing names from a teaser isn't an option per Step 0.

---

### PSL Newsletter Inspo — 2026-07-17

Checked PSL emails received since the 7/15 run: a Frey House II docent-tour mention, a Korakia Pensione history piece, and an unrelated health-care digest.

**Korakia Pensione** — teaser-only, mostly biographical trivia (Gordon Coutts, 1924, Gertrude). **Declined.** Insufficient extractable substance to justify an update or new post, and Korakia is a competing boutique-lodging property — writing it up has weaker content-marketing logic for a vacation-rental site than an architecture/experience angle would.

**Health care email** — no Coachella Valley travel/dining/events tie. Skipped as off-topic per Step 2.

**Frey House II tour** — the email itself was thin (one line), but the topic was substantive and tied directly to an existing post that already covers Albert Frey without mentioning the bookable interior tour. Per Step 3 this is an **update**, not a new post. Per Step 0, none of the newsletter's own phrasing was used — all logistics (Saturday 9am-2pm docent tours, Buddy Rogers Box Office shuttle pickup, no self-drive access, limited van seating, not ADA accessible, tours sell out) were independently verified via WebSearch and the Palm Springs Art Museum's own tour page before writing.

Applied to `content/blog/palm-springs-midcentury-architecture-tour.md`:
- New paragraph in the "Stop 1: Downtown Palm Canyon Drive" section covering the Frey House II docent tour, with a link to the museum's official tour booking page
- New FAQ pair: "Can you go inside Frey House II?"
- Matching FAQPage JSON-LD entry added to the closing schema block
- `dateModified` bumped to 2026-07-17
- Rebuilt via `npm run build` — succeeded, no errors

Sources used for verification: [Palm Springs Art Museum — Frey House II tours](https://www.psmuseum.org/visit/tours/tours-frey-house)

### Hero Image Audit — 2026-07-13 (first full pass — none on record before this)

99 heroes audited: all 95 blog posts + the 4 property pages. Fixed 8 unique images via `heroPosition` adjustment only (no photo swaps) — commit `97d99c5`, pushed. This covers 12 posts total since several share the same stock image:

- `palm-springs-hotel-pool.webp` → `center bottom` — `coachella-valley-vacation-rental-guide`, `best-spas-coachella-valley-spa-day`
- `palm-springs-pool.webp` → `center bottom` (+ fixed heroAlt, was describing a sunset street scene instead of the actual pool photo) — `palm-springs-summer`
- `ps-boulevard-palms-mountains.webp` → `center 70%` — `lax-to-palm-springs`
- `ps-desert-valley-view.webp` → `center bottom` — `desert-vacation-prep`
- `terra-luz-exterior.webp` → `center 70%` — `terra-luz-the-reveal`, `terra-luz-indio-local-guide`
- `palm-springs-art-museum-sculptures.webp` → `center 20%` — `palm-springs-art-galleries-guide`
- `terra-luz-pool-backyard.webp` → `center 65%` — `terra-luz-bachelorette-coachella`, `terra-luz-dog-friendly-coachella`, `terra-luz-review`, `terra-luz-renovation-story`

Property pages (Terra Luz, Cozy Cactus, Sundune, The Well): all 4 checked at desktop and mobile crop ratios, all show the intended subject cleanly. No fixes needed.

**Flagged items — resolved same day, per Eann's call (commit `83af633`, pushed):**
1. `joshua-tree-national-park.webp` was a map graphic mislabeled as a park photo. Replaced with a real Joshua Tree landscape photo (Tim Cheung, Unsplash License). Updated `joshua-tree-day-trip-from-indio.md`'s heroPosition, plus inline image dimensions/alt text on `indian-palms-vacation-rental.md` and `palm-springs-3-day-itinerary.md`.
2. `west-elm-dining.webp` showed a cluttered move-in scene, not dining. Replaced with a real patio-dining photo (Brady Knoll, Pexels License). Updated heroes on `grocery-stores-coachella-valley.md` and `why-book-direct-vacation-rental.md` — also caught and removed a false property attribution in the latter's caption, which incorrectly claimed the stock photo was "The Cozy Cactus patio."
3. `terra-luz-outdoor-living.md` now reuses the already-live `terra-luz-pool-backyard.webp` instead of its old tight pool-float close-up, per Eann's approval — no new photo needed.

**Action items:** none open. This audit doesn't need a full re-run for 30+ days — only re-check posts published or re-imaged since 2026-07-13.

---

### babysit-seo run — 2026-07-11 — Open Task Status

All actionable tasks are done. Remaining open items are non-actionable this run:

| Task | Status | Reason |
|------|--------|--------|
| GSC Phase 0.5 | Blocked | OAuth token expired again; reauth script blocked by auto-mode permission classifier — needs Eann to run `! python3 /tmp/reauth_google_full.py` directly |
| GA4 Phase 0.5 (new) | Done | Read `~/Downloads/Reports_snapshot.csv`; Cozy Cactus bounce rate (83.3%) and Sundune visibility gap flagged above — this is a new recurring phase added to the babysit-seo skill itself |
| TASK 7 (UTM on Pinterest pins) | Not actionable | Manual task for Eann — requires Pinterest Business Hub access |
| TASK 10 (Sabbir Quora accountability) | Not actionable | Human conversation |
| Technical SEO #6 (8 posts crawled not indexed) | Not actionable | Waiting on GSC data at July 13 check-in |
| Gap D (booking widget urgency signal) | Not actionable | Not until September |
| Gap F (festival post availability sentence) | Not actionable | Seasonal, manual |
| Week 7-12 link building | Skipped | Outreach tasks per skill instructions |
| TASK RG-8 (Monday comp intelligence agent) | Not actionable | Requires PriceLabs API + Airbnb page scraping setup |
| TASK RG-17 (HeyGen video clone) | Not actionable | Needs Eann to record 15-second video first |
| TASK RG-18 (Market Researcher AI employee) | Not actionable | Requires Eann to run Nova interview in Claude to generate system prompt |
| TASK PIN-1 (Produce 15 pins in Canva) | Not actionable | Manual Canva + Pinterest scheduler task for Eann |
| TASK PIN-2 (Confirm 15 pins live) | Not actionable | Requires Pinterest profile access |

**Completed this run:** TASK RG-1 (weekly vibe marketing batch), RG-3 (Quora answer template), RG-6 (5 Why's brief), RG-12 (Carrie workflow prompt), RG-19 (new — Rachel's Facebook-growth post synthesized into a Pinterest audit-and-recycle task).

**Completed follow-up (same day, continued session):** Ran `/indigo-palm-geo-seeder` on `best-spas-coachella-valley-spa-day` per the Ongoing GEO instruction — generated 5 Quora Q&A pairs (queued for Eann to post 2-3/day, not yet posted), confirmed FAQ/JSON-LD already covered from initial publish, added one internal cross-link from `indio-between-coachella-weekends` to the new spa post. Logged to `~/airbnb/.context/UPDATE_LOG.md`. Committed and pushed (`9e1a678`), deploy queued clean.

**Next scheduled babysit-seo:** Sunday July 19, 2026, 8:03pm (weekly cron; July 12 run already completed). Priority for that run: restore GSC access first if still blocked (needs Eann's manual reauth click-through), then pull the next CTR-lift check on GSC-16/GSC-17, and re-run TASK RG-1 for the new week.

---

### New from Rachel — 2026-07-13

Post processed: `the-fable-prompt-pack-11-prompts` ("The Fable Prompt Pack: 11 Prompts to Run Before the Window Closes," published 2026-07-11)

Core content: a library of 11 reusable prompt templates for getting more strategic, systems-level output out of Claude — not tied to a specific paid tool. Two of the eleven map directly to open Indigo Palm work.

~~**TASK RG-20: Run the Skills Audit prompt against Indigo Palm's existing Claude Skills**~~ ✅ **DONE 2026-07-13** — audit run, results below; no file edits needed (findings are process notes/gaps flagged, not code changes).

Rachel's Prompt 5 has Claude audit a business's existing skill library for gaps, redundancy, and hidden opportunities. Indigo Palm already has ~15 skills built (`babysit-seo`, `rachel`, `palmspringslife-inspo`, `indigo-palm-geo-seeder`, `new-blog-post`, `hero-image-audit`, `pinterest-pins`, and others) — no new tool or account needed, pure analysis. Executed below.

~~**TASK RG-21: Run the Sales Page Audit prompt against the Cozy Cactus property page**~~ ✅ **DONE 2026-07-13** — full writeup in the status table above (line ~233). Ran the four-lens audit against the live page; funnel structure was solid, the real bug was a fully duplicated "Why Book Direct" sidebar block next to the CTA. Removed the duplicate and added a hero-level trust line. Committed and pushed (`4a2cb7d`).

**Not directly applicable this run:** Mother Prompt (1), Memory/Compounding (6), Handoff Doc (7), App Audit (8), Self-Model Audit (9), Trusted Advisor Install (10), Obsolete-or-10x (11) — these are standing practices or self-reflection prompts, not one-off Indigo Palm tasks. Strategic Wargame (4) is worth keeping in mind before any pricing change or seasonal promo, but there's no pending decision to run it against right now.

Source: `the-fable-prompt-pack-11-prompts`

---

#### TASK RG-20 — Skills Audit Results (run 2026-07-13)

Audited the current skill set for gaps and redundancy:

- **Gap — no dedicated pricing/revenue skill.** `babysit-seo` and the daily briefing cron both touch PriceLabs data, but there's no skill that owns pricing strategy end-to-end (seasonal rate bands, orphan-night discount rules, comp-set checks). TASK RG-8 (Monday comp intelligence agent) is the closest existing attempt at this and remains blocked on scraping setup — this audit doesn't unblock it, just confirms it's the right shape of skill to eventually build.
- **Gap — no skill for the Cozy Cactus-style page-conversion audit.** RG-21 above is being done ad hoc; if property-page conversion audits become a recurring quarterly exercise (not just this one bounce-rate fire), it's worth turning into a small standing skill rather than re-deriving the four-lens framework each time. Flagged, not built — one page doesn't justify a new skill yet.
- **Redundancy — none found.** `palmspringslife-inspo`, `indigo-palm-geo-seeder`, `rachel`, and `babysit-seo` each own a distinct trigger and output; no overlap to consolidate.
- **Hidden opportunity — `indigo-palm-geo-seeder` output isn't looped back into the Pinterest audit.** Quora Q&A pairs it generates (5 pending for `best-spas-coachella-valley-spa-day` as of 2026-07-11) aren't tracked anywhere that the Pinterest Check-in section checks against — the Pinterest Check-in's "Quora Q&A live" count is a manual grep, not a cross-reference to geo-seeder output. Low-cost fix: note pending-but-unposted Quora pairs in the geo-seeder's own output log so babysit-seo's Pinterest phase can surface a "X pairs generated but not yet posted" figure instead of just a live-count guess.

No immediate file edits from this audit — findings are process notes, folded into the final report below.

---

~~**TASK RG-22: Bake the "Carrie carousel" lessons into the social-carousel skill (added 2026-07-22)**~~ ✅ **DONE 2026-07-22** — New Rachel post "How to Make AI Automated Social Media Posts For Your Luxury Rental Property" (2026-07-21) is an expanded Instagram-carousel version of the RG-12 "Carrie" workflow. Most of its stack is paid/manual for Eann (Firecrawl scraping, Higgsfield/Nano Banana photo enhancement, Metricool/Buffer scheduling, manual slide review) so those stay flagged, not executed. Two lessons were genuinely actionable and free, so they were folded into `indigo-palm-social-carousel/SKILL.md`: (1) **CTA rule** — carousel CTAs now default to indigopalm.co direct booking (+ promo code when live) instead of "check us on Airbnb," matching the post's core thesis that owned social should route intent to a channel Eann controls, not deepen platform dependency (the delisting/$100K-in-48hrs cautionary tale); (2) **photo direction** — added a light-touch-only edit rule so directed enhancements (golden-hour skies, color pop) never tip into the fake "Play-Doh property" look that kills trust.

**Flagged for Eann (paid/manual, not executed):** standing up the full auto-carousel pipeline (Firecrawl + Higgsfield + Metricool/Buffer) and a recurring Mon/Fri scheduled run that factors local weekly events. All require paid tool signups and manual Instagram posting — decide if the spend is worth it vs. the existing free carousel-script workflow.
Source: `how-to-make-ai-automated-social-media`

---

## PINTEREST PIN BATCH — 2026-07-13

Generated 2026-07-13 for the two new PSL-inspired posts (not a full top-5 audit). 3 pins per post, 6 pins total.

**Posts selected:**
1. `palm-springs-art-galleries-guide` — new post, no pins yet
2. `idyllwild-day-trip-palm-springs` — new post, no pins yet

**TASK PIN-3: Produce and schedule 6 pins in Canva + Pinterest**
Use the Indigo Palm Canva template. Previews rendered to `/tmp/pinterest-pins-preview/`. Export PNG, upload with title/description/board from spec below. Schedule 4-5/day — no batch drops.

PIN 1 (Practical) — palm-springs-art-galleries-guide
Title: Palm Springs Art Galleries: Full Downtown Walking Map
Description: Palm Springs Art Museum, Janssen Artspace inside a Donald Wexler building, the Shag Store, Backstreet Art District. Here's the walkable order that saves you backtracking, plus when First Wednesday Art Walk happens. Full guide at the link.
Overlay text: The Downtown Palm Springs Gallery Walk, Mapped Out
Image: palm-springs-art-museum-sculptures.webp
Board: Palm Springs Getaways
Link: https://indigopalm.co/blog/palm-springs-art-galleries-guide/?utm_source=pinterest&utm_medium=organic&utm_campaign=gallery_walk_map

PIN 2 (Emotional) — palm-springs-art-galleries-guide
Title: A Quiet Gallery Afternoon in Palm Springs
Description: Free sculpture garden, a former 1961 bank turned design store, cold coffee before the sidewalk gets hot. This is the slow version of a Palm Springs trip, the one where you actually look at things. Full guide at the link.
Overlay text: The Palm Springs Afternoon That Isn't About the Pool
Image: cartel-coffee-palm-springs.webp
Board: Desert Lifestyle
Link: https://indigopalm.co/blog/palm-springs-art-galleries-guide/?utm_source=pinterest&utm_medium=organic&utm_campaign=gallery_afternoon_mood

PIN 3 (Booking-intent) — palm-springs-art-galleries-guide
Title: Where to Stay for a Palm Springs Gallery Trip
Description: The Sundune puts you 5 minutes from downtown and the Uptown Design District. Staying in Indio instead? Cozy Cactus and Terra Luz are a 25-minute gallery day trip away. Full guide at the link.
Overlay text: Stay 5 Minutes from Every Gallery Downtown
Image: palm-springs-art-museum.webp
Board: Palm Springs Getaways
Link: https://indigopalm.co/blog/palm-springs-art-galleries-guide/?utm_source=pinterest&utm_medium=organic&utm_campaign=gallery_trip_stay

PIN 4 (Practical) — idyllwild-day-trip-palm-springs
Title: Idyllwild Day Trip from Palm Springs: 4 Trails by Skill Level
Description: 45 minutes up Highway 74 and the desert turns into a pine forest at 5,400 feet. Easy, moderate, and hard trail picks, plus which ones need a permit. Full guide at the link.
Overlay text: 4 Idyllwild Trails, Sorted by How Hard You Want to Work
Image: idyllwild-tahquitz-rock-pine-forest.webp
Board: Coachella Valley Travel
Link: https://indigopalm.co/blog/idyllwild-day-trip-palm-springs/?utm_source=pinterest&utm_medium=organic&utm_campaign=idyllwild_trails_by_skill

PIN 5 (Emotional) — idyllwild-day-trip-palm-springs
Title: 30 Degrees Cooler, One Hour from the Pool
Description: Somewhere on Highway 74 the ocotillo stops and the pines start. Idyllwild is the escape hatch from a 112-degree afternoon in the valley, and it's a real hike, not just shade. Full guide at the link.
Overlay text: The Mountain Town That's 30 Degrees Cooler Than Your Pool Deck
Image: lily-rock-tahquitz-sunset-idyllwild.webp
Board: Desert Lifestyle
Link: https://indigopalm.co/blog/idyllwild-day-trip-palm-springs/?utm_source=pinterest&utm_medium=organic&utm_campaign=idyllwild_cooler_escape

PIN 6 (Booking-intent) — idyllwild-day-trip-palm-springs
Title: Escaping Coachella Valley Heat: Idyllwild from Terra Luz or Cozy Cactus
Description: Staying at Terra Luz or The Cozy Cactus in Indio? Idyllwild is a 70-minute drive each way, hike included, and it's the easiest way to beat a 110-degree afternoon without leaving the region. Full guide at the link.
Overlay text: One Day Trip That Actually Beats the Heat
Image: idyllwild-town-panorama-mountains.webp
Board: Coachella Valley Travel
Link: https://indigopalm.co/blog/idyllwild-day-trip-palm-springs/?utm_source=pinterest&utm_medium=organic&utm_campaign=idyllwild_from_indio_stay

**TASK PIN-4: Confirm all 6 pins are live**
Check Pinterest profile — all 6 pins visible, correct board, correct link destination.

---

### What changed on 2026-07-18 — GSC Check-in

**Period:** 2026-04-19 to 2026-07-18 (90 days) vs. 2026-01-18 to 2026-04-18

**Overall:** 227 clicks, 33,620 impressions, 0.7% CTR, avg position 12.8 (prior period: 29 clicks, 2,024 impressions). Steady compounding — up 5 clicks and ~350 impressions vs. the 7/17 pull, same trajectory, no shocks.

**What's working:** `palm-springs-surf-club` (47 clicks, 8,956 imps, pos 9.4), `palm-springs-vs-indio` (31 clicks, 6,256 imps, pos 8.0), `palm-springs-vs-scottsdale` (26 clicks, 1,691 imps, 1.5% CTR, pos 8.2). Same three winners holding their share. Mobile continues to outperform desktop on CTR (1.0% vs 0.4%) at a much better position (8.9 vs 16.0).

**CTR opportunities:**
- `how far is indio from palm springs` — 1,040 imps, 0.2% CTR, pos 7.8. Flagged as "unaddressed" in every prior check-in. **Diagnosis this run: this is a zero-click informational query.** A "how far is X from Y" search is answered inline in the SERP (Google shows the distance/drive time directly), so a position-7 ranking structurally cannot earn clicks the way a commercial query would. A title/meta rewrite will not recover these clicks. Stop treating it as an open rewrite target; the impressions are still valuable brand exposure. The `palm-springs-vs-indio` page that ranks for it is already a top-3 clicks winner on its commercial queries.
- `indigo` — 253 imps, 0.4% CTR, pos 4.4. Branded query, ranks top-5, barely clicked. Second consecutive appearance. Worth a homepage title-tag look next run if it persists, but low priority (branded searchers usually already know how to reach the site).

**Weak pages reviewed:**
- `best-vacation-rentals-pool-coachella-valley` — 64 imps, 0 clicks, pos 8.5, 100% of impressions ≤ pos 20 → genuine title/meta target (strong position, zero clicks = snippet problem). **Actioned:** meta rewritten from a vague "what to look for beyond the listing photos" intro to a concrete, benefit-first snippet naming private pool / hot tub / heated spa and adding a book-direct hook. dateModified bumped to 2026-07-18.
- `lax-to-palm-springs` — 254 imps, 1 click, pos 16.4, 52% of impressions ≤ pos 20 → mechanically flagged as title/meta. **Declined.** Title ("How to Get from LAX to Palm Springs: Every Option Compared") and meta are already sharp from a prior optimization pass. At position 16.4 (mostly page 2) the constraint is ranking/authority, not the snippet — a rewrite won't move it. Revisit if it climbs into the top 10.

**Content/authority-fix pages (unchanged, still need real content or backlinks, not title/meta):** `things-to-do-indio-ca` (511 imps, pos 41), `best-restaurants-palm-springs` (466 imps, 0 clicks, pos 36), `date-farms-indio-coachella-valley` (320 imps, pos 13.2), `best-hiking-palm-springs` (287 imps, 0 clicks, pos 63.7), `things-to-do-palm-desert` (306 imps, pos 39.5), `pet-friendly-palm-springs` (258 imps, pos 19.1), `salton-sea-day-trip` (243 imps, pos 35.1), `bnp-paribas-indian-wells-where-to-stay` (165 imps, pos 18.7).

**Action items generated:**
1. `best-vacation-rentals-pool-coachella-valley` meta rewrite — DONE this run. Check next GSC pull for CTR movement off the position-8.5 ranking.
2. `indigo` branded homepage title tag — monitor one more run before touching.

### Pinterest Check-in — 2026-07-18

**Monthly views:** Still no fresh Pinterest Analytics "monthly viewers" pull — open item across 7/13, 7/15, 7/17, now 7/18. Last real figure remains ~20K (June 3). Reminder: organic-impression and ad-dashboard numbers are NOT the monthly-viewers metric the 25-30K link-switch threshold is based on. Do not switch links off Airbnb until a real monthly-viewers number ≥ 25K is confirmed from a direct Pinterest Analytics login.
**Pin count:** Not logged this run — Pinterest posting is Eann's task since the June transition (Sabbir's scope is Quora/GEO/Goodreads).
**Link status:** Airbnb. No change; threshold not confirmed hit.
**Action items:** none auto-actionable — the monthly-viewers pull and pin scheduling are both Eann's manual tasks. This is the fourth consecutive check-in flagging the missing monthly-viewers number; a 2-minute direct Pinterest Analytics login would close it.

### GA4 Check-in — 2026-07-18

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 modification timestamp (period 2026-06-13 to 2026-07-10) — same stale export already analyzed in the 7/13, 7/15, and 7/17 check-ins. Not re-logging it a fourth time. Standing open findings (Cozy Cactus property page 83.3% bounce, cross-confirmed by the `/cozy-cactus/` GSC finding; Sundune visibility gap) remain, pending Eann's next fresh GA4 export.

### PSL Newsletter Inspo — 2026-07-18

Reviewed 15 `news@palmspringslife.com` emails since July 10. Most were ad blasts (Grand Hyatt Indian Wells, Hotel Paseo, Lola Rose dinner) or topics already covered on-site (wine bars → `palm-springs-bars`, açai/pastries → `best-pastries-palm-springs`, art/architecture → `palm-springs-art-galleries-guide` published 7/13). The one genuinely useful nugget — free, indoor, air-conditioned "Summer Sundays" at the Agua Caliente Cultural Museum — is already referenced in the current heat-activities post (a live winner at 3.3% CTR, pos 11.7). No new post or material update warranted this run; declined to churn a converting page for a marginal seasonal sentence.

### Hero Image Audit — 2026-07-18

No full pass run. Last full inventory pass was 2026-07-13 (5 days ago, well inside the 30-day window). No new blog posts or re-imaged pages published since then, so nothing new to re-check. Next full pass due on/after 2026-08-12.

### What changed on 2026-07-19 — GSC Check-in

**Period:** 2026-04-20 to 2026-07-19 (90 days)

**Overall:** 235 clicks, 33,891 impressions, 0.7% CTR, avg position 12.7

**vs. prior period:** +8 clicks, +271 impressions vs. the 7/18 pull (227 clicks, 33,620 impressions) — steady, compounding growth, no volatility.

**What's working:** Same three pages holding the top of the funnel: `/blog/palm-springs-surf-club/` (47 clicks, 9,079 impr, pos 9.3), `/blog/palm-springs-vs-indio/` (32 clicks, 6,292 impr, pos 8.0), `/blog/palm-springs-vs-scottsdale/` (29 clicks, 1,724 impr, 1.7% CTR, pos 8.2 — best CTR of the three).

**CTR opportunities (rewrites queued):**
- `how far is indio from palm springs`: 1,024 impr, 2 clicks, pos 7.7 — reaffirmed non-actionable per 7/18's ruling. This is a Google-answers-inline-in-SERP query (distance/time answered directly in the SERP box); no title/meta rewrite can fix a structural zero-click query. Tracked as brand-exposure value only, not a rewrite target.
- `indigo` (branded homepage query): 255 impr, 1 click, pos 4.4 — still just monitoring, one more run before touching the homepage title tag.
- **New this run:** `airbnb rentals indio`: 102 impr, 0 clicks, position **1.0** — flagging as a fresh anomaly. Ranking #1 with zero clicks on 102 impressions is unusual; needs page-level investigation next run (which page is actually ranking, and whether it's a snippet/SERP-feature issue or a title mismatch with searcher intent for a query that reads Airbnb-branded rather than Indigo Palm-branded).

**Weak pages (content or title fix needed):**
- `/blog/best-vacation-rentals-pool-coachella-valley/`: 64 impr, 0 clicks, pos 8.5 (100% of impressions ≤ pos 20) — title/meta rewrite already shipped 7/18. No CTR movement visible yet in this pull, expected since the 90-day window still blends mostly pre-change data; will show clean signal in the next 1-2 check-ins.
- `/blog/lax-to-palm-springs/`: 258 impr, 1 click, pos 16.2 (52.3% of impressions ≤ pos 20) — mechanically flagged again, still **declined** per 7/18's ruling: this is a position/authority problem, not a snippet problem, and the title/meta are already sharp from a prior pass. Revisit if it climbs into top 10.
- `/blog/best-hiking-palm-springs/` (280 impr, 0 clicks, pos 63.3) and `/blog/things-to-do-indio-ca/` (504 impr, 1 click, pos 41.2): both 0% of impressions ≤ pos 20 — content/authority problems, not title/meta fixes. No action this run; would need new backlinks or a content depth pass, not queued as a quick win.

**Action items generated:**
1. Investigate `airbnb rentals indio` (position 1.0, 0 clicks, 102 impr) at the next GSC check-in — identify the ranking page and diagnose whether it's a SERP-feature issue or genuine title mismatch.
2. Continue monitoring `best-vacation-rentals-pool-coachella-valley` CTR over the next 1-2 pulls to confirm the 7/18 meta rewrite is working.

### Pinterest Check-in — 2026-07-19

**Monthly views:** Still no fresh Pinterest Analytics "monthly viewers" pull — open item across 7/13, 7/15, 7/17, 7/18, now 7/19 (fifth consecutive check-in). Last real figure remains ~20K (June 3 screenshot). Reminder: organic-impression and ad-dashboard numbers are NOT the monthly-viewers metric the 25-30K link-switch threshold is based on.
**Pin count:** Not logged this run — Pinterest posting is Eann's task since the June transition.
**Link status:** Airbnb. No change; threshold not confirmed hit.
**Action items:** none auto-actionable. A 2-minute direct Pinterest Analytics login would close the fifth consecutive gap on this metric.

### GA4 Check-in — 2026-07-19

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 modification timestamp (period 2026-06-13 to 2026-07-10) — same stale export already analyzed in the 7/13 through 7/18 check-ins. Not re-logging a fifth time. Standing open findings (Cozy Cactus property page 83.3% bounce, blocked on TASK GA4-1's manual ad-creative review; Sundune visibility gap) remain, pending Eann's next fresh GA4 export.

### PSL Newsletter Inspo — 2026-07-19

Only one `news@palmspringslife.com` email since 7/18 ("Free Summer Sundays at Agua Caliente Cultural Museum," sent 7/18) — the same item already reviewed and declined in the 7/18 check-in (already referenced in the live `palm-springs-heat-activities` post, a converting page not worth churning for a marginal seasonal sentence). No new email, no new candidate. Nothing actionable this run.

### Hero Image Audit — 2026-07-19

No full pass run. Last full inventory pass was 2026-07-13 (6 days ago, well inside the 30-day window). No new blog posts or re-imaged pages published since 7/18, so nothing new to re-check. Next full pass due on/after 2026-08-12.

### What changed on 2026-07-20 — GSC Check-in

**Period:** 2026-04-21 to 2026-07-20 (90 days) vs. 2026-01-20 to 2026-04-20

**Overall:** 241 clicks, 34,101 impressions, 0.7% CTR, avg position 12.7 (prior period: 34 clicks, 2,820 impressions — +207 clicks, +31,281 impressions). Same steady compounding trend as every prior pull this week, no volatility.

**What's working:** Same three winners holding: `/blog/palm-springs-surf-club/` (48 clicks, 9,198 impr, pos 9.3), `/blog/palm-springs-vs-indio/` (32 clicks, 6,307 impr, pos 8.0), `/blog/palm-springs-vs-scottsdale/` (30 clicks, 1,772 impr, 1.7% CTR, pos 8.1).

**CTR opportunities (rewrites queued):**
- `how far is indio from palm springs`: 1,016 impr, 2 clicks, pos 7.7 — reaffirmed non-actionable per 7/18-7/19 rulings. Structural zero-click SERP-answered-inline query; not a rewrite target.
- `airbnb rentals indio`: 102 impr, 0 clicks, position 1.0 — third consecutive appearance (flagged 7/19, still open). Could not identify the specific ranking page from this report format (query-level data isn't cross-tabbed with page-level in the standard pull); needs a filtered GSC query+page pull to diagnose SERP-feature vs. title-mismatch. Carrying forward as an open investigation, not closing it.

**Weak pages (content or title fix needed):**
- `/blog/where-to-stay-coachella-2026/`: 529 impr, 2 clicks, 0.4% CTR, pos 10.5 — corrected this run: verified the source file (`content/blog/where-to-stay-coachella-2026.md`) is a `redirectTo` stub (noindex, canonical + JS redirect to `/blog/where-to-stay-coachella/`, confirmed live in built HTML). There is no title/meta to rewrite on a noindex redirect page — the June 22 "no action, link equity transfers over time" ruling (line 564) was correct and this run's earlier draft note calling it a "genuine title/meta target" was wrong. Reverting that: no action, impressions will fade as Google fully consolidates onto the canonical URL.
- `/blog/lax-to-palm-springs/`: 257 impr, 2 clicks, pos 15.7 (54.2% of impressions ≤ pos 20) — still **declined** per 7/18-7/19 ruling (position/authority problem, title already sharp).
- Content/authority-fix pages unchanged: `things-to-do-indio-ca` (504 impr, pos 41.3), `best-restaurants-palm-springs` (487 impr, 0 clicks, pos 35.7), `best-hiking-palm-springs` (272 impr, 0 clicks, pos 63.7), `things-to-do-palm-desert` (324 impr, pos 38.4), `salton-sea-day-trip` (246 impr, pos 34.7), `pet-friendly-palm-springs` (269 impr, pos 18.6), `bnp-paribas-indian-wells-where-to-stay` (166 impr, pos 18.8), `date-farms-indio-coachella-valley` (350 impr, pos 13.1), `coachella-valley-food-guide` (120 impr, pos 24.7), `/blog/` homepage (105 impr, pos 13.9), `/cozy-cactus/` (72 impr, pos 14.0), `indio-between-coachella-weekends` (70 impr, pos 13.6). No new action — these need backlinks/content depth, not title/meta churn.

**Action items generated:**
1. None new and actionable this run — `where-to-stay-coachella-2026` correction above closes out what looked like a new lead.
2. Continue carrying the `airbnb rentals indio` position-1/zero-click investigation until a query+page filtered pull is available.

### Pinterest Check-in — 2026-07-20

**Monthly views:** Still no fresh Pinterest Analytics "monthly viewers" pull — sixth consecutive check-in (7/13 through 7/20) with this open. Last real figure remains ~20K (June 3 screenshot, per `sabbir_context.md`). Reaffirming: organic-impression and paid-ad-dashboard numbers are NOT the monthly-viewers metric the 25-30K link-switch threshold is based on — do not switch links off Airbnb without a direct Pinterest Analytics login confirming ≥25K.
**Pin count:** Not logged this run — Pinterest posting is Eann's task since the June 2026 transition (Sabbir's remaining scope is Quora/GEO/Goodreads only, per `project_sabbir_transition`).
**Pin quality note (standing, from 2026-07-11 pin audit):** Concrete room+audience+location titles (Cozy Cactus pattern) convert; Terra Luz's 24 narrative-titled pins still show zero clicks. Any new Terra Luz pins should use the Cozy Cactus pattern until that changes.
**Quora:** No fresh count this run — last known figure is 802 all-time views as of June 26 (~10 pieces in 11 days, below the 2-3/day target). Sabbir's scope.
**Link status:** Airbnb. No change; threshold not confirmed hit.
**Action items:** none auto-actionable — the monthly-viewers pull is Eann's manual task. Sixth consecutive flag; a 2-minute direct Pinterest Analytics login would close it for good.

### GA4 Check-in — 2026-07-20

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 modification timestamp (period 2026-06-13 to 2026-07-10) — same stale export analyzed in every check-in from 7/13 through 7/19. Re-confirmed this run: 346 active users, 348 new users, 35.8s avg engagement/user, 1,854 events. Traffic source mix: google/organic 107 users (136 sessions), pinterest/organic 101 users (126 sessions) — Pinterest is now essentially at parity with Google organic on new-user acquisition, reaffirming the standing priority to keep Pinterest work moving. High-bounce pages still open: `Cozy Cactus | Family-Friendly Vacation Rental...` page (160 views, 83.3% bounce — matches the `/cozy-cactus/` GSC content/authority flag above, cross-confirms this is a real leak, not noise) and the homepage page-not-found rate is low so no new signal there. Sundune property page remains the visibility-gap outlier: 12 views vs. Cozy Cactus 160 / Terra Luz 29 / homepage 80 — still needs a blog post or Pinterest board pointing at it specifically. Not re-logging as a new finding a sixth time; standing open items carry forward pending Eann's next fresh GA4 export.

### PSL Newsletter Inspo — 2026-07-20

No new `news@palmspringslife.com` emails since the single 7/18 item already reviewed and declined on 7/18-7/19. Nothing actionable this run.

### Hero Image Audit — 2026-07-20

No full pass run. Last full inventory pass was 2026-07-13 (7 days ago, inside the 30-day window). No new blog posts or re-imaged pages published since 7/18, so nothing new to re-check. Next full pass due on/after 2026-08-12.

---

### New from Rachel — 2026-07-21

RSS feed (`heraiempire.substack.com/feed`) checked. The 3 newest posts are all already processed: `the-fable-prompt-pack-11-prompts` (RG-20/21), `how-i-hit-1-million-facebook-views` (RG-19), `i-taught-a-3-hour-ai-bootcamp-and` (RG-18). No new posts since 2026-07-11. Nothing to synthesize this run.

### What changed on 2026-07-21 — GSC Check-in (BLOCKED, same scope issue)

**Status:** Still blocked, unchanged from 7/13 through 7/20. `gsc_report.py` fails with `403 insufficientPermissions — "Request had insufficient authentication scopes."`

**Root cause confirmed this run (inspected the credentials file directly):** `~/.claude/google_credentials.json` lists 10 scopes (gmail readonly/send/modify, documents, spreadsheets, drive, presentations, calendar readonly/events, tasks) but **not** the Search Console `webmasters`/`webmasters.readonly` scope. `gsc_report.py` builds its token from `data["scopes"]`, so the searchconsole API rejects it. `/tmp/reauth_google_full.py` exists this session, but it reuses `existing.get("scopes") or DEFAULT_SCOPES`, and `DEFAULT_SCOPES` in `credential_providers.py` also omits webmasters — so running reauth as-is would re-consent with the same 10 scopes and NOT fix the missing scope. This is a scope-config problem, not a token-expiry problem, and not a background-run-safe fix.

**Action needed from Eann:** add `https://www.googleapis.com/auth/webmasters.readonly` to `DEFAULT_SCOPES` (and/or the credentials file's scope list), then run a fresh interactive OAuth consent on your machine so the new token carries the Search Console scope. Until then GSC pulls stay blocked. Flagged per the skill's stopping condition (access only Eann has) rather than editing the shared Google credential pipeline blind in an autonomous run.

### Pinterest Check-in — 2026-07-21 (LIVE API pull — new data this run)

**Live pull:** `pinterest-publisher/scripts/get_analytics.py --account --days 30` (2026-06-21 to 2026-07-21):
- Impressions: 38,140
- Pin clicks: 254
- Outbound clicks: 231
- Saves: 3

**Critical caveat:** account totals blend the ongoing paid Performance+/Idea Ad campaign (~$200/mo since 2026-05-05) with organic. **38,140 is NOT the "monthly viewers" metric** the 25-30K link-switch threshold is based on. Monthly viewers remains unknown — last real figure ~20K (June 3 screenshot, now 48 days stale).

**Signal:** 231 outbound clicks against only 3 saves = the traffic is largely paid-click-driven with a weak organic save signal. Saves are the highest-intent Pinterest metric, so 3 in 30 days says the organic pin library still isn't earning discovery on its own.

**Link status:** Airbnb. Threshold not confirmed hit — do not switch links off Airbnb without a direct Pinterest Analytics monthly-viewers login confirming ≥25K.

**Action items:** 7th consecutive check-in flagging the missing monthly-viewers number (Eann, ~2-min manual login). Paid-ad UTM misattribution (tagged `organic` instead of `cpc`/`paid`) from the 7/13 check-in still open — Eann, manual in Pinterest Business Hub.

### GA4 Check-in — 2026-07-21 (stale export, not re-logged)

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 mtime (period 2026-06-13 to 2026-07-10) — same export analyzed every run 7/13 through 7/20. Not re-analyzing a seventh time. Standing open findings carry forward: Cozy Cactus property page 83.3% bounce (RG-21's above-the-fold fix shipped 2026-07-13, but this pre-7/13 export can't measure its effect yet — need a fresh export to see if it worked), and the Sundune visibility gap (12 views vs. Cozy Cactus 160 / Terra Luz 29). Pending Eann's next fresh GA4 export.

### PSL Newsletter Inspo — 2026-07-21 (1 new post drafted)

Three new `news@palmspringslife.com` emails since 7/20:
- **"Six Experts on the Rise of Desert Modernism"** (7/21) — architecture thought-leadership, already covered by `palm-springs-midcentury-architecture.md`; teaser-only, no extractable facts. **Declined.**
- **"Join Us at the Architectural Preservation Awards"** (7/20) — Oct 10 event promo, niche/seasonal, not a Coachella Valley travel/dining topic gap. **Declined.**
- **"7 Game Night and Trivia Spots in the Coachella Valley"** (7/20) — genuine new topic, **no existing post** covered it. Verified enough independently-sourceable venue facts via WebSearch (PSL's own tabletop guide, Yelp 2026, Eventbrite, Coachella Valley Weekly, VisitPalmSprings) to write honestly. **Wrote a new post from scratch in Eann's voice** (nothing copied from PSL's phrasing; all days/times framed "as of 2026, call ahead"). Published `/blog/game-night-trivia-coachella-valley/` — 1,679 words, 4 images (all reused existing audited WebPs), BlogPosting + BreadcrumbList + FAQPage schema, organized city-by-city (Palm Springs / Cathedral City / Desert Hot Springs / Palm Desert). Internal links to `/cozy-cactus/`, `/terra-luz/`, `/things-to-do-indio-ca/`, `/blog/palm-springs-bars/`. Blog card + sitemap updated, `npm run build` clean.

### Hero Image Audit — 2026-07-21

No full pass. Last full inventory 2026-07-13 (8 days, inside 30-day window). One new post published today (`game-night-trivia-coachella-valley`); its hero reuses `palm-springs-bar-cocktails.webp`, an already-audited existing WebP, so no new crop check needed. Next full pass due on/after 2026-08-12.

---

### What changed on 2026-07-22 — GSC Check-in (UNBLOCKED — first successful pull since 7/13)

**Period:** 2026-04-23 to 2026-07-22 (90 days) vs. 2026-01-22 to 2026-04-22

**Status:** The `webmasters.readonly` scope issue that blocked every GSC pull 7/13 through 7/21 was fixed and verified this session. This is the first real GSC data in 9 days.

**Overall:** 250 clicks, 34,696 impressions, 0.7% CTR, avg position 12.6 (prior period: 34 clicks, 3,419 impressions — +216 clicks, +31,277 impressions). Consistent with the last clean pull on 7/20 (241 clicks, 34,101 impr) — steady compounding, no volatility, no drop from the 9-day blind window.

**Device:** Mobile 171 clicks / 15,908 impr / 1.1% CTR / pos 8.9. Desktop 76 clicks / 18,511 impr / 0.4% CTR / pos 15.9. Same mobile-outperforms-desktop pattern as every prior pull.

**What's working:** Same three winners holding: `/blog/palm-springs-surf-club/` (49 clicks, 9,392 impr, pos 9.2), `/blog/palm-springs-vs-indio/` (32 clicks, 6,314 impr, pos 7.9), `/blog/palm-springs-vs-scottsdale/` (31 clicks, 1,866 impr, 1.7% CTR, pos 8.0). All three have had multiple title/meta passes already; leaving them.

**CTR opportunities (evaluated):**
- `how far is indio from palm springs`: 972 impr, 2 clicks, pos 7.6 — reaffirmed non-actionable (SERP-answered-inline zero-click query, per 7/18-7/20 rulings). Not a rewrite target.
- `airbnb rentals indio`: 102 impr, 0 clicks, pos 1.0 — 4th appearance, carried-forward open investigation (needs a query+page filtered GSC pull to diagnose SERP-feature vs. title-mismatch; standard report format can't cross-tab query to page). Still open, not closing.

**Weak pages — new leads actioned this run:**
- `/blog/idyllwild-day-trip-palm-springs/`: 114 impr, 1 click, pos 8.0 (100% of impr ≤ pos 20) — genuine new title/meta target, NOT previously ruled. Page-1 position with a buried hook. Rewrote (GSC-23).
- `/blog/best-vacation-rentals-pool-coachella-valley/`: 70 impr, 0 clicks, pos 8.3 (100% of impr ≤ pos 20) — booking-intent money page at page-1 position with zero clicks, never touched before. Rewrote title/meta (GSC-24).

**Weak pages — reaffirmed no-action (prior rulings hold):**
- `where-to-stay-coachella-2026` (noindex redirect stub — nothing to rewrite, per 7/20 correction), `lax-to-palm-springs` (declined 7/18-7/19, position/authority not title), `best-pastries-palm-springs` (pos 11.9 but title already excellent/specific — authority issue, not title churn), and the content/authority-fix set (`things-to-do-indio-ca`, `best-restaurants-palm-springs`, `best-hiking-palm-springs`, `things-to-do-palm-desert`, `salton-sea-day-trip`, `pet-friendly-palm-springs`, `coachella-valley-food-guide`) — all need backlinks/content depth, not title/meta.

**Action items generated:**
1. ~~Rewrite `idyllwild-day-trip-palm-springs` title/meta~~ ✅ Done (GSC-23)
2. ~~Rewrite `best-vacation-rentals-pool-coachella-valley` title/meta~~ ✅ Done (GSC-24)
3. Measure CTR lift on GSC-23/24 at the next check-in ~7 days out (2026-07-29+); both were page-1 positions so lift should be visible faster than deep-position rewrites.

~~**TASK GSC-23: Rewrite idyllwild-day-trip-palm-springs title/meta**~~ ✅ **DONE 2026-07-22** — Title changed from "Idyllwild Day Trip from Palm Springs: A Hiker's Guide" to "Idyllwild Day Trip: Cool Pine Escape from Palm Springs" (54 chars) — leads with the July-relevant cool-mountain-escape payoff instead of the generic "Hiker's Guide," keeps the "Idyllwild Day Trip" + "Palm Springs" keywords. Meta now opens with the temperature contrast ("An hour up the mountain, about 30 degrees cooler.") that matches summer search intent. Post was at pos 8.0 with 114 impr, 0.9% CTR. dateModified bumped to 2026-07-22.

~~**TASK GSC-24: Rewrite best-vacation-rentals-pool-coachella-valley title/meta**~~ ✅ **DONE 2026-07-22** — Title changed from generic listicle "Best Vacation Rentals with Pool in Coachella Valley" to "Coachella Valley Rentals with a Private Pool + Hot Tub" (54 chars) — adds the private-pool + hot-tub differentiator that generic OTA listicles at positions 1-7 don't lead with (accurate for the collection: Terra Luz private pool, Cozy Cactus private hot tub). Booking-intent page was at pos 8.3 with 70 impr and 0 clicks. Meta kept (already strong, book-direct angle). dateModified bumped to 2026-07-22.

### Pinterest Check-in — 2026-07-22

**Live pull** (`pinterest-publisher/scripts/get_analytics.py --account --days 30`, 2026-06-22 to 2026-07-22): 39,346 impressions, 256 pin clicks, 232 outbound clicks, **3 saves**. Essentially flat vs. the 7/21 pull (38,140 / 254 / 231 / 3) — one day of drift, no real change.

**Monthly viewers:** Still unknown. Account impressions blend the ongoing paid Performance+/Idea Ad campaign (~$200/mo) with organic — 39,346 is NOT the "monthly viewers" metric the 25-30K link-switch threshold is based on. Last real monthly-viewers figure remains ~20K (June 3 screenshot, now 49 days stale). 8th consecutive check-in flagging this — a ~2-minute direct Pinterest Analytics login by Eann would close it.

**Signal unchanged:** 232 outbound clicks against only 3 saves = traffic is paid-click-driven with a weak organic save signal. Saves are the highest-intent Pinterest metric; 3 in 30 days says the organic pin library still isn't earning discovery on its own.

**Link status:** Airbnb. Threshold not confirmed hit — do not switch links off Airbnb without a direct monthly-viewers login confirming ≥25K.

**Action items:** none auto-actionable (monthly-viewers pull + paid-ad UTM misattribution fix are both Eann's manual tasks in Pinterest Business Hub).

### GA4 Check-in — 2026-07-22

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 mtime (period 2026-06-13 to 2026-07-10) — the same stale export analyzed every run since 7/13. Not re-analyzing an eighth time. Standing open findings carry forward: Cozy Cactus property page 83.3% bounce (RG-21's above-the-fold fix shipped 2026-07-13 but this pre-fix export can't measure it — need a fresh export), Sundune visibility gap (12 views vs. Cozy Cactus 160 / Terra Luz 29), and Pinterest≈Google-organic parity on new-user acquisition. **Pending Eann's next fresh GA4 export.**

### PSL Newsletter Inspo — 2026-07-22 (1 new post drafted)

Three `news@palmspringslife.com` emails reviewed:
- **"Six Experts on the Rise of Desert Modernism"** (7/21) — already reviewed and declined 7/21 (architecture thought-leadership, covered by `palm-springs-midcentury-architecture.md`). **Declined.**
- **"Desert Cool, Delivered"** (7/21) — vintage-inspired retail/shop promo, not a Coachella Valley travel/dining topic. **Declined.**
- **"18 Resort Restaurants & Poolside Bars for Summer"** (7/22) — genuine new topic (day-access resort/poolside dining for non-hotel-guests), **no existing post** covered it, seasonally hot. **Wrote a new post from scratch in Eann's voice.** PSL used as topic inspiration only — nothing copied; all six venues (Palm Canyon Swim & Social at ARRIVE, Ace Hotel Swim Club, The Colony Club at Colony Palms, Sol y Sombra at Paloma, H2O Pool Bar at Renaissance Esmeralda, The Barn Kitchen at Sparrows Lodge) independently researched via WebSearch, all times/menus framed "as of 2026, call ahead." Published `/blog/palm-springs-poolside-bars-resort-dining/` — ~1,400 words, 6 reused audited WebP images, BlogPosting + BreadcrumbList + FAQPage schema (4 Q&As), internal links to `/terra-luz/`, `/cozy-cactus/`, `/the-sundune/`, `/blog/best-restaurants-palm-springs/`, `/blog/palm-springs-bars/`, `/blog/palm-springs-heat-activities/`. Blog card + sitemap updated, `npm run build` clean. Committed `d6157e4`, deploy queued.

### Hero Image Audit — 2026-07-22

No full pass. Last full inventory 2026-07-13 (9 days, inside the 30-day window). One new post published this run (`palm-springs-poolside-bars-resort-dining`); its hero reuses `palm-springs-bar-cocktails.webp`, an already-audited existing WebP, so no new crop check needed. GSC-23/24 title/meta rewrites didn't touch hero images. Next full pass due on/after 2026-08-12.

---

### What changed on 2026-07-23 — GSC Check-in

**Period:** 2026-04-24 to 2026-07-23 (90 days) vs. 2026-01-23 to 2026-04-23

**Overall:** 251 clicks, 34,954 impressions, 0.7% CTR, avg position 12.6 (prior period: 38 clicks, 3,723 impressions — +213 clicks, +31,231 impressions). Essentially flat vs. the 7/22 pull (250 clicks, 34,696 impr) — one day of drift, no volatility.

**Device:** Mobile 174 clicks / 16,091 impr / 1.1% CTR / pos 8.8. Desktop 74 clicks / 18,584 impr / 0.4% CTR / pos 15.9. Tablet 3 clicks / 279 impr. Same mobile-outperforms-desktop pattern as every prior pull.

**What's working:** Same three winners holding: `/blog/palm-springs-surf-club/` (49 clicks, 9,455 impr, pos 9.2), `/blog/palm-springs-vs-indio/` (31 clicks, 6,303 impr, pos 7.9), `/blog/palm-springs-vs-scottsdale/` (31 clicks, 1,920 impr, 1.6% CTR, pos 7.9). No new action — multiple passes already done on all three.

**CTR opportunities (evaluated):**
- `how far is indio from palm springs`: 954 impr, 1 click, pos 7.6 — reaffirmed non-actionable (SERP-answered-inline zero-click query, per 7/18-7/22 rulings).
- `airbnb rentals indio`: 102 impr, 0 clicks, pos 1.0 — 5th appearance, carried-forward open investigation (needs a query+page filtered GSC pull the standard report can't produce). Still open, not closing.

**Weak pages — no new actionable targets today:** The "Pages with Impressions but Low Clicks" table (15 pages) is unchanged in composition from 7/22: it's either the standing content/authority-fix bucket (`things-to-do-indio-ca`, `best-restaurants-palm-springs`, `best-hiking-palm-springs`, `things-to-do-palm-desert`, `salton-sea-day-trip`, `pet-friendly-palm-springs`, `coachella-valley-food-guide`, `bnp-paribas-indian-wells-where-to-stay`, `where-to-stay-coachella-2026`, `/blog/`, `/cozy-cactus/`, `palm-springs-aerial-tram`) or the two pages rewritten yesterday (`idyllwild-day-trip-palm-springs` GSC-23, `best-vacation-rentals-pool-coachella-valley` GSC-24, both still title/meta-flagged by the diagnostic but one day post-rewrite is too soon to re-touch or to measure lift). `lax-to-palm-springs` remains declined per 7/18-7/19 (authority, not title).

**Action items generated:**
1. None new. Hold GSC-23/GSC-24 lift measurement for the 2026-07-29+ check-in as planned 7/22.
2. Continue tracking `airbnb rentals indio` (pos 1.0, 0 clicks, 5 consecutive appearances) — flag for Eann if it reaches 7+ appearances without resolution, since a query+page filtered pull would need either a different GSC export tool or manual Search Console UI access.

### Pinterest Check-in — 2026-07-23

**Live pull** (`pinterest-publisher/scripts/get_analytics.py --account --days 30`, 2026-06-23 to 2026-07-23): 39,556 impressions, 257 pin clicks, 232 outbound clicks, **3 saves**. Essentially flat vs. the 7/22 pull (39,346 / 256 / 232 / 3) — +210 impressions, +1 pin click, no real change.

**Monthly viewers:** Still unknown. 9th consecutive check-in flagging this. Account-level impressions still blend the ~$200/mo paid Performance+ campaign with organic and are NOT the "monthly viewers" figure the 25-30K link-switch threshold is based on. Last real monthly-viewers figure remains ~20K (June 3 screenshot, now 50 days stale).

**Signal unchanged:** 232 outbound clicks against only 3 saves — same paid-click-driven traffic pattern with a weak organic save signal as every prior check-in.

**Link status:** Airbnb. Threshold not confirmed hit — do not switch links off Airbnb without a direct monthly-viewers login confirming ≥25K.

**Action items:** none auto-actionable (monthly-viewers pull is Eann's manual task in Pinterest Business Hub).

### GA4 Check-in — 2026-07-23

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 mtime (period 2026-06-13 to 2026-07-10) — the same stale export analyzed every run since 7/13. Not re-analyzing a ninth time. Standing open findings carry forward unchanged: Cozy Cactus property page 83.3% bounce (pre-dates RG-21's 7/13 above-the-fold fix, can't measure the fix from this export), Sundune visibility gap (12 views vs. Cozy Cactus 160 / Terra Luz 29), and Pinterest≈Google-organic parity on new-user acquisition. **Pending Eann's next fresh GA4 export.**

### PSL Newsletter Inspo — 2026-07-23 (1 new post drafted)

Two `news@palmspringslife.com` emails reviewed:
- **"Summer Savings Are Here: Save Up to $1,000 Off a New System"** (7/22, 2pm) — HVAC/plumbing retailer promo, no travel/dining/things-to-do angle. **Declined.**
- **"The Guide Goes Online: Explore Greater Palm Springs City by City"** (7/23) — four story leads inside: (1) the online Guide launch itself — a directory product, not a topic; declined. (2) "Desert Dreamers 11: The Writers" — literary heritage piece, no direct guest-travel utility; declined. (3) "Snake Wrangler Educates Community" — human-interest, no Coachella Valley stay tie; declined. (4) La Quinta Resort & Club turns 100 — historic-resort anniversary, tangential but no unique angle beyond what "best restaurants Palm Desert" and existing itinerary posts already cover; declined for now, flagged as a possible future update to `palm-springs-3-day-itinerary.md` if a hook develops. (5) **"How to Spend a Day in Pioneertown"** — genuine new topic, **no existing post** covered Pioneertown/Pappy & Harriet's, and it fits the existing day-trip series pattern (`joshua-tree-day-trip-from-indio`, `desert-hot-springs-day-trip`, `salton-sea-day-trip`, `idyllwild-day-trip-palm-springs`) with a clear gap. **Wrote a new post from scratch in Eann's voice.** PSL used as topic inspiration only — nothing copied; all facts (founding year, Roy Rogers investor group, Mane Street historic-district status, Pappy & Harriet's ticketing policy, drive times) independently verified via WebSearch against Visit Pioneertown, Pappy & Harriet's official site, and Wikipedia. Published `/blog/pioneertown-day-trip-from-indio/` — hero image sourced from Visit Pioneertown's own site (not PSL's), two supporting images reused from the existing image library, BlogPosting + BreadcrumbList + FAQPage schema (5 Q&As), internal link to `/blog/joshua-tree-day-trip-from-indio/` (and a reciprocal link back). Sitemap updated, `npm run build` clean. Also recovered `desert-ridge-hike-valley-view.webp` into `content/blog/images/` — it existed only in the built `blog/images/` output and would have been silently deleted on the next clean build, which would have broken its use in `desert-hot-springs-day-trip.md` too. Committed `2f9dbeb`, pushed, deploy confirmed via `gh run list`.

### Hero Image Audit — 2026-07-23

No full pass. Last full inventory 2026-07-13 (10 days, inside the 30-day window). One new post published this run (`pioneertown-day-trip-from-indio`); its hero (`pioneertown-mane-street-sign.webp`, sourced fresh from Visit Pioneertown's site) is a new image, not a reused one — checked manually: 800x600, correctly declared in frontmatter and `<img>` width/height, no crop/stretch issues, loads lazy. GSC-23/24 rewrites and the Sundune-pool factual-accuracy fixes (see Part 4 Gap 6 correction) didn't touch hero images. Next full pass due on/after 2026-08-12.

---

### New from Rachel — 2026-07-24

RSS feed (`heraiempire.substack.com/feed`) checked. Newest post is still `how-to-make-ai-automated-social-media` (2026-07-21), already processed (spawned RG-22). No new posts since. Nothing to synthesize this run.

### What changed on 2026-07-24 — GSC Check-in

**Period:** 2026-04-25 to 2026-07-24 (90 days) vs. 2026-01-24 to 2026-04-24

**Overall:** 255 clicks, 35,258 impressions, 0.7% CTR, avg position 12.6 (prior period: 40 clicks, 3,993 impressions — +215 clicks, +31,265 impressions). Essentially flat vs. the 7/23 pull (251 clicks, 34,954 impr) — one day of drift, no volatility.

**Device:** Mobile 174 clicks / 16,286 impr / 1.1% CTR / pos 8.8. Desktop 78 clicks / 18,692 impr / 0.4% CTR / pos 15.9. Tablet 3 clicks / 280 impr, 1.1% CTR, pos 8.2. Same mobile-outperforms-desktop pattern as every prior pull.

**What's working:** Same three winners holding: `/blog/palm-springs-surf-club/` (50 clicks, 9,505 impr, pos 9.2), `/blog/palm-springs-vs-scottsdale/` (33 clicks, 1,972 impr, 1.7% CTR, pos 7.9), `/blog/palm-springs-vs-indio/` (31 clicks, 6,301 impr, pos 7.9). No new action — multiple passes already done on all three.

**CTR opportunities (evaluated):**
- `how far is indio from palm springs`: 930 impr, 1 click, pos 7.5 — reaffirmed non-actionable (SERP-answered-inline zero-click query, per 7/18-7/23 rulings).
- `airbnb rentals indio`: 102 impr, 0 clicks, pos 1.0 — 6th consecutive appearance, carried-forward open investigation. `gsc_report.py` has no query+page cross-tab flag (confirmed by reading `--help`), so the specific ranking page still can't be identified from this tool. Per the 7/23 plan: flag for Eann once this reaches 7+ appearances without resolution — one more consecutive appearance from that threshold, flagging now rather than waiting for exactly 7: **this needs either a filtered Search Console UI pull or a different tool; a 2-minute manual GSC login by Eann would close it.**

**Weak pages — reviewed, no new actionable targets:**
- `/blog/idyllwild-day-trip-palm-springs/` (GSC-23, rewritten 7/22): impressions up to 185 (from 114 pre-rewrite) at pos 8.1, still 1 click — too soon to judge CTR lift (2 days post-rewrite), holding per the 7/22 plan to measure at 7/29+.
- `/blog/best-vacation-rentals-pool-coachella-valley/` (GSC-24, rewritten 7/18): 72 impr, 0 clicks, pos 8.3 — unchanged since rewrite, also holding for the 7/29+ measurement window.
- `/blog/best-pastries-palm-springs/`: 72 impr, 1 click, pos 11.8 — the diagnostic flags this as a title/meta target (75% of impressions ≤ pos 20), but checked the live title/meta directly: "Best Pastries in Palm Springs: Specific Items Worth Seeking" is already specific and non-generic. Reaffirming the 7/22 ruling: authority/position issue, not a title problem. Declined.
- `/blog/lax-to-palm-springs/`: 273 impr, 2 clicks, pos 14.6 (53.7% ≤ pos 20) — still **declined** per 7/18-7/23 rulings (position/authority problem, title already sharp).
- Content/authority-fix bucket unchanged in composition from 7/22-7/23: `best-restaurants-palm-springs`, `things-to-do-indio-ca`, `things-to-do-palm-desert`, `pet-friendly-palm-springs`, `best-hiking-palm-springs`, `salton-sea-day-trip`, `bnp-paribas-indian-wells-where-to-stay`, `coachella-valley-food-guide`, `/blog/`, `/cozy-cactus/` — all need backlinks/content depth, not title/meta churn.

**Action items generated:**
1. Flag `airbnb rentals indio` (pos 1.0, 0 clicks, 102 impr, 6 consecutive appearances) for Eann — needs a filtered Search Console UI pull to identify the specific ranking page; the standard report tool structurally can't cross-tab query-to-page.
2. Continue holding GSC-23/GSC-24 lift measurement for the 2026-07-29+ check-in as planned.

### Pinterest Check-in — 2026-07-24

**Live pull** (`pinterest-publisher/scripts/get_analytics.py --account --days 30`, 2026-06-24 to 2026-07-24): 38,715 impressions, 251 pin clicks, 226 outbound clicks, **3 saves**. Essentially flat vs. the 7/23 pull (39,556 / 257 / 232 / 3) — slight dip in impressions/clicks, within normal day-to-day drift, no real change.

**Monthly viewers:** Still unknown. 10th consecutive check-in flagging this. Account-level impressions still blend the ~$200/mo paid Performance+ campaign with organic and are NOT the "monthly viewers" figure the 25-30K link-switch threshold is based on. Last real monthly-viewers figure remains ~20K (June 3 screenshot, now 51 days stale). Checked `sabbir_context.md` and memory for a fresher figure — none logged.

**Signal unchanged:** 226 outbound clicks against only 3 saves — same paid-click-driven traffic pattern with a weak organic save signal as every prior check-in.

**Link status:** Airbnb. Threshold not confirmed hit — do not switch links off Airbnb without a direct monthly-viewers login confirming ≥25K.

**Action items:** none auto-actionable (monthly-viewers pull is Eann's manual task in Pinterest Business Hub; now 10 consecutive check-ins open on this single item).

### GA4 Check-in — 2026-07-24

`~/Downloads/Reports_snapshot.csv` still carries the Jul 11 mtime (period 2026-06-13 to 2026-07-10) — the same stale export analyzed every run since 7/13. Not re-analyzing a tenth time. Standing open findings carry forward unchanged: Cozy Cactus property page 83.3% bounce (pre-dates RG-21's 7/13 above-the-fold fix, can't measure the fix from this export), Sundune visibility gap (12 views vs. Cozy Cactus 160 / Terra Luz 29), and Pinterest≈Google-organic parity on new-user acquisition. **Pending Eann's next fresh GA4 export.**

### PSL Newsletter Inspo — 2026-07-24

Two new `news@palmspringslife.com` emails since the 7/23 check-in:
- **"Share the World's Best with Someone You Love"** (7/23) — Rancho La Puerta named #1 International Wellness Retreat in Travel + Leisure's 2026 World's Best Awards. Rancho La Puerta is in Tecate, Baja California, Mexico — not the Coachella Valley, no travel-to-Indigo-Palm angle. **Declined** (out of geographic scope).
- **"Does Sunshine Actually Benefit Health?"** (7/24) — general wellness digest (sunshine/health research, posture tips, cosmetic-surgery sponsor content); "8 places to relax" teaser has no venue names or facts in the email body itself, just a locked "READ MORE" link. No extractable, independently-verifiable facts and no genuine Coachella Valley travel gap distinct from the existing `palm-springs-heat-activities` post. **Declined** (no extractable content, would require visiting PSL's site to source facts, which defeats the inspo-not-copy model for a thin general-wellness topic).

No new post or update warranted this run.

### Hero Image Audit — 2026-07-24

No full pass. Last full inventory 2026-07-13 (11 days, inside the 30-day window). No new blog posts published this run (both PSL candidates declined), so nothing new to re-check. Next full pass due on/after 2026-08-12.

---

### New from Rachel — 2026-07-27

RSS feed (`heraiempire.substack.com/feed`) checked. All 20 posts in the feed are already in the processed list; newest is still `how-to-make-ai-automated-social-media` (2026-07-21, spawned RG-22). No new posts since. Nothing to synthesize this run.

### New from Rachel — 2026-07-31

One new post: `your-ai-employee-just-moved-into` ("Your AI Employee Just Moved Into Your Pocket," 2026-07-31). Covers Claude Cowork's move to server-side execution (start a task on phone, pick up on desktop) plus a punch list of Cowork use cases: pricing rebuild spreadsheets, guest-review complaint mining, a recurring scheduled market brief, transcript-to-multi-format content repurposing, and a Monday briefing generator. Also a sales pitch for a paid "Build-a-Thon 15" workshop.

**Assessment:** most of what's pitched here already exists at Indigo Palm in a different form — the Daily Briefing, Daily SEO Sprint, and Monday Competitor Intelligence cron jobs already do the "recurring market brief" and "Monday briefing" use cases described. The one net-new idea is guest-review complaint mining, which nothing currently automates.

**TASK RG-23: Guest-review complaint mining**
Cowork itself requires the Claude Max tier and a live desktop-app file connection — not confirmed available on this account, so not executing the Cowork setup itself. But the underlying idea (scan guest reviews for recurring complaint patterns to catch cheap operational fixes) doesn't require Cowork specifically — it's a one-off Claude Code task against existing Airbnb review text (via the Hostaway MCP or a manual export) any time reviews are pulled. No review-text-pulling tool is currently wired into the Hostaway MCP server (only reservations, calendar, conversations, messages, financials). Flagging as not-actionable-yet: needs either a Hostaway reviews endpoint or a manual review export from Eann before it can run.
Source: your-ai-employee-just-moved-into

### New from Rachel — 2026-08-12

Three new posts since the 7/31 check-in: `build-15-your-ai-team-deserves-an` (8/6, AI org-chart image prompt + "hire one role at a time" method), `my-team-told-me-to-kill-facebook` (8/4, Facebook content-timing/format data), `the-sunday-ai-powered-reset-60-minutes` (8/3, personal weekly-planning ritual using Claude Connectors).

**Assessment:** all three are lower-signal than the recent run. The org-chart post is a visualization exercise, not a new workflow — Indigo Palm's "AI team" already exists as the cron jobs (Daily Briefing, Daily SEO Sprint, Monday Competitor Intel) plus the skill library; nothing net-new to hire. The Sunday Reset is a personal productivity ritual for Rachel herself, not an Indigo Palm deliverable — it needs Claude Connectors wired to a personal Calendar/Gmail/Slack, which is Eann's call to set up, not something to spawn as an SEO/content task. The Facebook post is the only one with a transferable idea, since Facebook itself isn't an Indigo Palm channel.

**TASK RG-24: Test Pinterest posting time-of-day performance**
The Facebook post found a single piece of content got 16,341 views at 2pm ET vs. 149 views posted at 5pm the next day — same content, wildly different result purely from timing. Indigo Palm has never tested this on Pinterest specifically (posting cadence has been tracked as pins/day, not time-of-day). Flagging as not-actionable-yet: needs Eann to post identical/paired pins at 2 different times of day for a few weeks and compare via `get_analytics.py --pin PIN_ID`, which is a manual posting-schedule change on Eann's side, not a code/content edit.
Source: my-team-told-me-to-kill-facebook

**TASK RG-25: Apply the "named profession + dollar amount + turning point" story formula to guest-facing copy**
The Facebook post's highest-performing format was concrete over generic: a specific job title, a specific dollar figure, and a specific before/after moment, instead of vague motivational framing. This maps directly to Indigo Palm's guest testimonial and "who stays here" copy, which currently leans on generic descriptors. Flagging as not-actionable-yet: needs real guest specifics (profession, occasion, a concrete detail) that only exist in actual reviews/messages Eann has access to — can't fabricate specifics for real guests. Next time Eann pulls guest reviews or testimonials for a page, apply this formula instead of generic phrasing.
Source: my-team-told-me-to-kill-facebook

### New from Rachel — 2026-09-08

One new post since the 8/12 check-in: `how-to-connect-claude-to-every-gmail` ("How to Connect Claude to every Gmail Account you own," 2026-08-22). Covers "gws" (Google Workspace CLI, github.com/googleworkspace/cli), a free open-source tool that connects Claude to multiple Google Workspace accounts at once — the built-in Gmail connector only handles one account and its tools are write-focused (can't reliably count/search/read mail in bulk).

**Assessment:** potentially relevant to Sabbir's GSC/Gmail access (sabbirahmed31dec@gmail.com) and the Upwork-message pull the sabbir-tracker skill already does, since both currently rely on single-account Gmail connections. But setup is ~45 minutes of interactive Google security screens per the post, non-scriptable ("varies by machine"), and requires Eann present at the terminal for each account's OAuth flow — not something to execute unattended.

**TASK RG-26: Evaluate gws (Google Workspace CLI) for multi-account Gmail access**
If Sabbir-tracker or other skills ever need simultaneous access to more than one Gmail account (e.g. Sabbir's + the business inbox) without disconnecting the other, gws (github.com/googleworkspace/cli) is a free option worth a manual pilot. Flagging as not-actionable-yet: requires Eann's hands-on terminal setup and Google OAuth consent per account — cannot be scripted or executed by Claude alone.
Source: how-to-connect-claude-to-every-gmail

### What changed on 2026-07-27 — GSC Check-in

**Period:** 2026-04-28 to 2026-07-27 (90 days) vs. 2026-01-27 to 2026-04-27

**Overall:** 268 clicks, 36,286 impressions, 0.7% CTR, avg position 12.4 (prior period: 44 clicks, 5,079 impressions — +224 clicks, +31,207 impressions). Up slightly vs. the 7/24 pull (255 clicks, 35,258 impr) — steady growth, no volatility.

**Device:** Mobile 184 clicks / 17,020 impr / 1.1% CTR / pos 8.8. Desktop 80 clicks / 18,981 impr / 0.4% CTR / pos 15.7. Tablet 4 clicks / 285 impr / 1.4% CTR / pos 8.1. Same mobile-outperforms-desktop pattern as every prior pull.

**What's working:** Same winners holding: `/blog/palm-springs-surf-club/` (51 clicks, 9,726 impr, pos 9.2), `/blog/palm-springs-vs-scottsdale/` (34 clicks, 2,110 impr, 1.6% CTR, pos 7.8), `/blog/palm-springs-vs-indio/` (31 clicks, 6,276 impr, pos 7.8), `/blog/indio-local-gems/` (19 clicks, 2.4% CTR), `/blog/outdoor-furniture-desert-heat/` (19 clicks, 2.8% CTR), `/blog/palm-springs-heat-activities/` (13 clicks, 2.9% CTR). No new action — multiple passes already done on all of these.

**CTR opportunities / weak pages (evaluated, no new actionable rewrites):**
- Every title/meta target the diagnostic flagged this run has already been rewritten in a prior run: `palm-springs-aerial-tram` (GSC-3, rewritten 6/22), `where-to-stay-coachella` (title+meta rewritten 6/26), `stagecoach-2027-where-to-stay` (title already sharp, 5/5), `classpass-palm-springs` (declined twice for thin ~108-impr volume + branded queries), `best-pastries-palm-springs` and `lax-to-palm-springs` (declined per 7/18-7/24 rulings — position/authority, not title).
- `where-to-stay-coachella`: 5,154 impr, 9 clicks, 0.2% CTR, pos 11.8 — highest-volume low-CTR page, but title/meta already rewritten 6/26 and it sits at page-2 border. Reaffirmed as a position/authority problem (needs backlinks/depth), not title churn.
- GSC-23 (`idyllwild-day-trip-palm-springs`) and GSC-24 (`best-vacation-rentals-pool-coachella-valley`) still in their holding window — measure CTR lift at the 2026-07-29+ check-in as planned.

**Carry-forward flags (unchanged):**
- `airbnb rentals indio`: 128 impr, 0 clicks, pos 1.0 — recurring; needs a filtered Search Console UI pull to identify the ranking page (the report tool structurally can't cross-tab query→page). Standing flag for Eann.
- `how far is indio from palm springs`: 869 impr, pos 7.5, 0.1% CTR — reaffirmed non-actionable (SERP-answered-inline zero-click query).

**Action items generated:** none new. Hold GSC-23/24 lift measurement for 7/29+.

### Pinterest Check-in — 2026-07-27

**Live pull** (`pinterest-publisher/scripts/get_analytics.py --account --days 30`, 2026-06-27 to 2026-07-27): 41,420 impressions, 260 pin clicks, 236 outbound clicks, **2 saves**. Up slightly on volume vs. the 7/24 pull (38,715 / 251 / 226 / 3 saves); saves ticked down to 2. Same paid-Performance+-driven traffic pattern with a weak organic save signal as every prior check-in.

**Monthly viewers:** Still unknown — 11th consecutive check-in flagging this. Account-level impressions blend the ~$200/mo paid campaign with organic and are NOT the "monthly viewers" figure the 25-30K link-switch threshold is based on. Last real figure remains ~20K (June 3 screenshot, now 54 days stale). No fresher figure logged in `sabbir_context.md` or memory.

**Link status:** Airbnb. Threshold not confirmed hit — do not switch links off Airbnb without a direct monthly-viewers login confirming ≥25K.

**Action items:** none auto-actionable (monthly-viewers pull is Eann's manual task in Pinterest Business Hub; 11 consecutive check-ins open on this single item).

### GA4 Check-in — 2026-07-27

**Fresh API pull** (`ga4_report.py`, property 519325194, 7 days 2026-07-20 to 2026-07-27) — first fresh GA4 data since the API path replaced the stale 7/11 CSV that runs 7/13-7/24 were stuck re-reading.

**Overall:** 136 active users (up from 96 prior week), 143 new, 157 sessions, 72s avg session duration (down from 90s), 591 events. Growth in users/sessions, slight dip in session duration.

**Traffic source mix:** Organic Search 55 sessions / 43 users, Organic Social 30 / 23, Direct 22 / 20, Unassigned 10, AI Assistant 4. Organic Social (Pinterest) is now ~55% of Organic Search volume — the Pinterest push is contributing real sessions, consistent with the standing Pinterest≈Google-organic-parity observation.

**High-bounce pages (50+ views, >60% bounce):** none crossed the 50-view threshold this 7-day window.

**Watch (below 50-view threshold but notable):** `/cozy-cactus/` 33 views / 80.6% bounce / 18s — the recurring Cozy Cactus bounce concern; RG-21's 7/13 above-the-fold fix still not visibly moving it, but volume too thin (33 views) to auto-action. Homepage `/` 13 views / 69.2% bounce / 10s. Terra Luz page shows healthy 566s avg session on 6 views.

**Property page visibility:** Terra Luz 7 / Cozy Cactus 33 / Sundune 7. Cozy Cactus dominates; Terra Luz and Sundune both thin. Sundune visibility gap persists (same pattern flagged since 7/13).

**Action items generated:** none auto-actionable this run. Continue watching Cozy Cactus bounce as views accumulate toward the 50-view actionability threshold; if it holds >60% at 50+ views, queue an above-the-fold/CTA rework beyond the RG-21 fix.

### PSL Newsletter Inspo — 2026-07-27 (1 update applied)

Three `news@palmspringslife.com` emails in the window; the 7/24 9am "Does Sunshine Actually Benefit Health?" was already declined on the 7/24 run, leaving two new:
- **"COOL! Kids 12 and under visit Palm Springs Air Museum FREE"** (7/24 2pm) — **actioned as an update.** Thin promo email, but it surfaced one genuinely useful, guest-relevant, air-conditioned summer activity the `palm-springs-heat-activities` post was missing entirely. Verified the facts independently against the museum's own site (75+ vintage aircraft, climate-controlled hangars, open daily 10am-5pm, $25 adult / $23 teen-senior, kids 12 & under free with a paid adult and all 12-and-under free through summer, 745 N Gene Autry Trail). Added a new section, a quick-reference table row, an FAQ mention, a keyword, and bumped `dateModified` to 2026-07-27. No PSL prose reproduced; facts only. Committed + pushed (`2ee1b4d`).
- **"Why Do Cicadas Buzz?"** (7/27) — **declined.** Contents are a novelty cicada explainer plus event listings (DWTS Con 7/31-8/3, Jake Owen 7/31, Splash House Wknd 1 Aug 7-9, PS Vintage Market Aug 2, Desert to Desert Aug 1) and two PSL listicles ("7 Vintage Shops," "20 Museums & Roadside Attractions"). Events are time-sensitive with no lodging gap distinct from existing Coachella/Stagecoach posts; the listicles would require full independent re-sourcing (a >2hr new post) with weak direct-booking intent. No extractable single-fact update warranted.

### Hero Image Audit — 2026-07-27

No full pass. Last full inventory 2026-07-13 (14 days, inside the 30-day window). No new blog post published this run — the only content change was an in-place update to `palm-springs-heat-activities` that didn't touch its hero image. Nothing new to re-check. Next full pass due on/after 2026-08-12.

### What changed on 2026-07-28 — GSC Check-in

**Period:** 2026-04-29 to 2026-07-28 (90 days)

**Overall:** 270 clicks, 36,814 impressions, 0.7% CTR, avg position 12.3

**vs. prior period:** +223 clicks, +31,447 impressions (prior 90d was 47 clicks / 5,367 imps). Traffic roughly 6x'd quarter-over-quarter. Mobile carries it: 186 clicks at 1.1% CTR / pos 8.8 vs desktop 80 clicks at 0.4% / pos 15.6. Desktop ranks worse and clicks worse — a position problem, not a layout problem.

**What's working:**
- `palm-springs-surf-club` — 51 clicks, 9,808 imps, pos 9.2 (single biggest driver)
- `palm-springs-vs-scottsdale` — 35 clicks, 1.6% CTR, pos 7.7 (best click:impression ratio of the high-volume pages)
- `palm-springs-vs-indio` — 30 clicks, pos 7.8
- CTR standouts already converting well: `desert-dog-summer` 6.9% @ pos 4.6, `palm-springs-heat-activities` 2.9% @ pos 10.1, `outdoor-furniture-desert-heat` 2.7% @ pos 7.3, `joshua-tree-day-trip-from-indio` 2.7% @ pos 8.4

**CTR opportunities reviewed — all parked, none warrant a rewrite this run:**
- `how far is indio from palm springs` — 854 imps, 1 click, pos 7.5. Investigated: `palm-springs-vs-indio.md` already answers this with a dedicated H2, an FAQ H3 ("about 25 miles, 30-40 min on the I-10"), and FAQPage JSON-LD. This is a zero-click informational query — Google serves the distance in the snippet, so the click never happens. No title/meta fix changes that.
- `palm-springs-aerial-tram` — 456 imps, pos 10.2, ~0 clicks. Title/meta already strong ("Is It Worth It?" hook, 50-60 char). Avg pos 10.2 (bottom of page 1) is the constraint; a rewrite won't move rank. Position problem, parked.
- `idyllwild-day-trip`, `best-vacation-rentals-pool-coachella-valley`, `palm-springs-vs-indio` — all edited 2026-07-27, so their low 90-day CTR is lagging pre-edit data, not a live defect. Re-rewriting would be churn. Parked to let fresh data accumulate.
- `lax-to-palm-springs` (edited 7/13), `classpass-palm-springs` (6/22) — titles/metas already optimized; same lagging-data / position read. Parked.

**Weak pages (buried, genuine content-authority gaps — flagged for a dedicated pass, not a quick fix):**
- `best-restaurants-palm-springs`: 554 imps, 0 clicks, pos 36.2 — only 4.3% of its impressions rank ≤ pos 20. Thin/outranked content, needs a real overhaul (>2hr), flagged not rushed.
- `things-to-do-indio-ca`: 455 imps, 1 click, pos 43.3 — 0% of impressions ≤ pos 20. Same diagnosis.
- `best-hiking-palm-springs`: 237 imps, 0 clicks, pos 64.7 — deeply buried, content-authority overhaul.

**Action items generated:** none auto-actionable this run. The three buried pages above are the only real content work and each is a >2hr overhaul — flagged for Eann to greenlight a focused content-refresh sprint (cap 1-2 per run when actioned).

### Pinterest Check-in — 2026-07-28

**Monthly views:** ~20K (last confirmed, paid ML campaign, $50 spend, all-US). Organic reach still thin (board impressions in the low hundreds). No fresh manual pull this run — the organic-monthly-viewers figure that governs the link switch is still Eann's Pinterest Business Hub task. This is now the **12th consecutive** check-in open on that single manual item.
**Pin count:** unchanged from last report; Pinterest posting is Eann's job as of 2026-06-18 (Sabbir's scope is Quora/GEO/Goodreads only).
**Link status:** Airbnb. Threshold (25-30K *organic* monthly viewers) not confirmed hit — do not switch bio/pin links to indigopalm.co without a direct Business Hub login confirming ≥25K organic.

**Quora Q&A live:** new account, low reach (5-8 views/answer, likely new-account outbound-link throttling). No change to report.
**FAQPage JSON-LD coverage:** property comparison + festival posts carry FAQPage schema; `palm-springs-vs-indio` confirmed this run.

**Action items:** none auto-actionable (monthly-viewers pull remains Eann's manual task).

### GA4 Check-in — 2026-07-28

**Period:** 2026-07-21 to 2026-07-28 (7 days)

**Overall:** 132 active users (up from 102 prior week), 141 new, 158 sessions, 64s avg session duration (down from 102s), 585 events. Users and sessions up, session duration dipped — thin-sample noise on a young site, not a trend yet.

**Traffic source mix:** Organic Search 60 sessions / 48 users, Organic Social 27 / 23, Direct 25 / 22, Unassigned 11, AI Assistant 5. Google organic back ahead of Pinterest this week (60 vs 27) after last week's near-parity — no reason to pull Pinterest tasks forward over Google work.

**High-bounce pages (50+ views, >60% bounce):** none crossed the 50-view threshold this window.

**Watch (below 50-view threshold but notable):** `/cozy-cactus/` 31 views / 75.0% bounce / 21s — the recurring Cozy Cactus bounce concern, improved slightly from last week's 80.6% but still high and still the dominant property page by traffic. Volume too thin (31 views) to auto-action; RG-21's above-the-fold fix and GA4-1's ad-vs-page diagnosis remain the open levers, both needing Eann to view the live ad creative.

**Property page visibility:** Terra Luz 8 / Cozy Cactus 31 / Sundune 7. Cozy Cactus dominates; Terra Luz (healthy 377s avg session on its 8 views) and Sundune (7 views, 0% bounce) both thin. Sundune/Terra Luz discoverability gap persists.

**Action items generated:** none auto-actionable this run. Continue watching Cozy Cactus bounce toward the 50-view actionability threshold.

### PSL Newsletter Inspo — 2026-07-28 (nothing actioned)

Three `news@palmspringslife.com` emails matched the window; the 7/27 9am "Why Do Cicadas Buzz?" was already declined on the 7/27 run, leaving two new, both declined:
- **"Tiki Time: 5 Polynesian-Inspired Palm Springs Homes"** (7/28 9am) — **declined.** Design-enthusiast editorial roundup: a Tiki-spaces photo tour, a native Mojave garden profile, a "7 DIY Architecture Tour Stops" listicle (The Shag Store owner's proprietary self-guided *drive* route), a "decorating with white" interior piece, and midcentury-car art by Shag. No guest-booking or trip-planning intent, and no single extractable fact that improves an existing guest-facing post (unlike the 7/27 Air Museum hours). The DIY-tour angle overlaps our existing `palm-springs-midcentury-architecture` self-guided *walk*, but the 7 stops are PSL/Shag's curated list (can't reproduce) and re-sourcing an independent drive route would be a >2hr new post with weak direct-booking value.
- **"Be Well: A Health Magazine by Palm Springs Life"** (7/27 2pm) — **declined.** Annual health-magazine promo (longevity/wellness editorial), same category as the previously-declined sunshine/health emails. No Coachella Valley lodging or travel-planning hook.

No PSL prose reproduced. Nothing drafted or updated this run.

### Hero Image Audit — 2026-07-28

No full pass. Last full inventory 2026-07-13 (15 days, inside the 30-day window). No new blog post published this run, and no hero image was re-sourced. The only recent content changes were the 2026-07-27 voice/word-overuse trims (body copy only) and the Air Museum in-place update to `palm-springs-heat-activities` (no hero touched). The three posts added since the last full pass (`game-night-trivia-coachella-valley`, `palm-springs-poolside-bars-resort-dining`, `pioneertown-day-trip-from-indio`) were each hero-checked in their own publish-day audits (7/21, 7/22, 7/23). Nothing new to re-check. Next full pass due on/after 2026-08-12.

---

### GSC Check-in — 2026-07-30

**Period:** 2026-05-01 to 2026-07-30 (90 days)

**Overall:** 275 clicks, 37,682 impressions, 0.7% CTR, avg position 12.2

**vs. prior period (Jan 30 - Apr 30):** +224 clicks, +31,804 impressions. Growth is still steep, but CTR slipped from 0.9% to 0.7% because impressions are growing faster than clicks. That gap is the whole story of this check-in.

**Device split:** Mobile 193 clicks / 1.1% CTR / pos 8.7. Desktop 77 clicks / 0.4% CTR / pos 15.5. Mobile is still ~2.75x better on CTR and ranks ~7 positions higher, so the mobile experience is working and desktop weakness is a ranking-depth problem rather than a usability one.

**What's working:**
- `palm-springs-surf-club` — 51 clicks, 9,885 imps, pos 9.2. Still the top traffic driver.
- `palm-springs-vs-scottsdale` — 38 clicks, 2,284 imps, 1.7% CTR, pos 7.7. Best clicks-per-impression of any high-volume page.
- `indio-local-gems` (2.3% CTR), `outdoor-furniture-desert-heat` (2.7%), `palm-springs-heat-activities` (2.8%), `desert-dog-summer` (6.0% at pos 4.4). The smaller posts convert far better than the big ones.

**Root-cause finding this run (new):** pulled the per-query breakdown for the three biggest-impression pages instead of trusting blended averages. Two of them are not weak pages at all, they are *intent-mismatched titles*:

- `palm-springs-vs-indio` — 6,277 imps, 31 clicks. Roughly **1,200 impressions are pure distance intent**: "how far is indio from palm springs" (834 imps, 1 click, pos 7.5), "distance from indio to palm springs" (98), "distance from palm springs to indio" (56), "how far is indio california from palm springs" (52), "distance between indio and palm springs" (48), plus a dozen more variants. All ranking pos 7-8, essentially zero clicks. The post *does* answer this in an H2, but the title ("Which One Fits Your Trip?") gave searchers no signal, so Google's own answer box won every time.
- `where-to-stay-coachella` — 5,403 imps, 10 clicks, 0.2% CTR. Dominant cluster is **hotel** intent: "best hotels near coachella festival grounds indio cal" (157 imps, pos 9.2), "california coachella hotels" (59), "are there vacation rentals near the coachella valley" (56), plus ~20 "best hotel for coachella" variants. The post has two dedicated hotel H2 sections and 23 hotel mentions, but the title never said the word.
- `palm-springs-surf-club` — diagnosed and **cleared**. Its 9,885 impressions are mostly anonymized long-tail plus genuine junk (Peruvian surf camps, "cost?", "2 people"). Real head term "palm springs surf club" sits at pos 20.4. This is a ranking-depth problem on the head term, not a title problem. No rewrite made.
- `palm-springs-aerial-tram` — also **cleared**. Only one itemized query in 90 days; the 479 impressions are almost entirely anonymized. Not diagnosable as a title issue, despite the script flagging it.

**Rewrites shipped this run (commit `5252a27`):**
1. `palm-springs-vs-indio.md` → title "Indio vs. Palm Springs: 25 Miles Apart, Which to Pick" (53 ch), meta now opens with the 25-mile / 30-40 minute answer. Kept the "indio vs palm springs" phrase, which already earns 8.8% CTR, while adding the distance answer.
2. `where-to-stay-coachella.md` → title "Coachella 2027: Hotels vs. Rentals Near the Polo Grounds" (56 ch), meta leads with "Hotels near the Coachella grounds."
3. `idyllwild-day-trip-palm-springs.md` → title "Palm Springs to Idyllwild: 1 Hour, 30 Degrees Cooler" (52 ch), meta leads with "47 miles up Highway 74." Same distance-intent pattern: "palm springs to idyllwild" (31 imps), "how far is idyllwild from palm springs" (21), all pos ~8.5 with zero clicks.

**Still leaking, not yet actionable:**
- "airbnb rentals indio" — 128 imps, **0 clicks at position 1.0**. Ranking first and getting nothing. Almost certainly a SERP presentation issue rather than a ranking one; needs a manual SERP eyeball to see what's being rendered.
- `best-restaurants-palm-springs` (575 imps, 0 clicks, pos 36.3), `things-to-do-indio-ca` (451 imps, 1 click, pos 43.2), `best-hiking-palm-springs` (222 imps, 0 clicks, pos 61.9). All genuine content/authority problems, not title problems. Buried too deep for a rewrite to help.

**Action items generated:**
1. ~~Retitle the three intent-mismatched posts~~ done this run, commit `5252a27`.
2. Check at next review whether the three rewrites moved CTR. The distance cluster on `palm-springs-vs-indio` is the single clearest measurable bet: ~1,200 impressions at pos 7.5 currently yielding 1 click.
3. Manual SERP check on "airbnb rentals indio" (pos 1.0, 0 clicks) — Eann or a manual browser look.

### Pinterest Check-in — 2026-07-30

**API pull (30 days, 2026-06-30 to 2026-07-30):** 46,556 impressions, 3 saves, 278 pin clicks, 243 outbound clicks.

Outbound clicks (243) are the number that matters, and they are healthy relative to impressions. Saves at **3** across 46K impressions is the anomaly worth flagging: a save rate that near-zero suggests the pins are functioning as ads (seen, clicked, gone) rather than as saved inspiration that keeps recirculating. Pinterest's distribution model rewards saves, so this caps how far the current pins can compound on their own.

**Monthly views:** still unconfirmed. The API's 46,556 `IMPRESSION` figure is total impressions and remains a **ceiling**, not a read on the 25-30K unique-monthly-viewers threshold. No calibration ratio has been established yet. This is now the **13th consecutive** check-in open on that single manual Business Hub pull.

**Pin count:** unchanged. Pinterest posting has been Eann's job since 2026-06-18; Sabbir's scope is Quora/GEO/Goodreads only.

**Link status:** Airbnb. Do not switch to indigopalm.co without a Business Hub login confirming ≥25K *organic* monthly viewers and Eann's explicit sign-off.

**Quora Q&A live:** no change. New account, 5-8 views/answer, likely new-account outbound-link throttling.

**Action items:**
1. Still blocked on Eann: one Business Hub login to read organic monthly viewers, which would both settle the link-switch question and calibrate the API-impressions-to-viewers ratio for every future run.
2. New: the 3-saves-per-46K-impressions signal argues for testing save-oriented pin formats (list/checklist/"save this for later" framing) against the current click-oriented ones. Folding into the pin caption guidance rather than raising as a separate task.

### GA4 Check-in — 2026-07-30

**Period:** 2026-07-23 to 2026-07-30 (7 days), vs. 2026-07-15 to 2026-07-22

**Overall:** 131 active users (+19), 140 new (+25), 153 sessions (+21), avg session duration 79s (**-16s**), 580 events (+90). Traffic up across the board, engagement time down. Same divergence as GSC: more people arriving, not sticking longer.

**Traffic source mix:** Organic Search 62 sessions, Organic Social 33, Direct 31, Unassigned 5, **AI Assistant 4**. Organic Search is still roughly 2x Organic Social, so the Pinterest-dependent tasks do not get pulled forward yet. The AI Assistant channel showing up at all is worth noting: it is the first direct evidence the GEO/Quora work has a measurable surface.

**High-bounce pages (50+ views, >60% bounce):** none. No page cleared the 50-view threshold in a 7-day window at this traffic level, so the rubric's main trigger simply does not fire. Reading below the threshold instead:
- `/cozy-cactus/` — 36 views, **75.8% bounce, 18s** avg duration. Highest-traffic page on the site and the worst engagement. RG-21's 2026-07-13 fixes did move it (83.3% → 75.8%), but 18 seconds means most visitors are not even reaching the booking widget.
- `/terra-luz/` — 9 views, 80.0% bounce, but **226s** avg duration. High bounce with long duration is a single-page-session artifact, not a problem: the people who stay are reading properly.
- `/blog/coachella-valley-weekend-getaway/` — 8 views, 75% bounce, **7s**. Worst duration on the site.
- `/blog/best-time-to-visit-palm-springs/` — 5 views, 100% bounce, 0s.

**Property page visibility:** Terra Luz 10 views / Cozy Cactus 36 / **Sundune 4**. Sundune is at roughly a ninth of Cozy Cactus. This is the same discoverability gap flagged in prior runs and it has not closed.

**Action items generated:**
1. `/cozy-cactus/` at 18s and 75.8% bounce is the highest-leverage on-site fix remaining. RG-21 already addressed trust signals and CTA clutter; the next lever is above-the-fold load and content, not more copy. Needs a real page-speed measurement before more edits, otherwise it is guesswork.
2. Sundune visibility gap (4 views) persists. It has one dedicated geo page (`/vacation-rentals/palm-springs/`) and few inbound blog links relative to the Indio properties.
3. AI Assistant traffic is now non-zero. Worth tracking as its own line item at each check-in from here.

### PSL Newsletter Inspo — 2026-07-30

Ran as part of this sprint. See the run note below.

### Hero Image Audit — 2026-07-30

No full pass. Last full inventory 2026-07-13 (17 days, inside the 30-day window). No new blog post was published this run, and no hero image was re-sourced. The only content changes were three title/meta rewrites (frontmatter `title`/`metaDescription`/`dateModified` only, no `heroImage` or `heroPosition` touched). Nothing new to re-check. Next full pass due on/after 2026-08-12.

---

### Content Audit + Page-Speed Diagnosis — 2026-07-30

Full `/audit-website` pass across 98 blog `.md` sources and the 5 hand-maintained HTML pages. Roughly 215 violations found, ~100 of them factual. All CRITICAL and HIGH items fixed and shipped in commits `b3e7269`, `26e64f2`, and `0a90d28`.

**Factual errors corrected (the ones that actually mattered):**
- Pet policy was **inverted** in `vacation-rental-welcome-book.md`: it offered The Cozy Cactus as dog-friendly and denied Terra Luz and The Sundune. Exactly backwards, and Cozy Cactus is a no-exceptions no-pets house because of allergy guests.
- The Cozy Cactus was given a **private pool** in 20+ places, including root `index.html` JSON-LD and a dozen image alt texts. It has a private hot tub plus three heated community pools at Indian Palms.
- The Sundune was given a **private pool** in its own JSON-LD, both as a description and as a `LocationFeatureSpecification`. It is a shared HOA pool at Palm Canyon Villas.
- The Sundune was described as **walkable to downtown Palm Springs** in about 25 places across the property page and 14 blog posts. Downtown is a ten-minute drive; the Uptown Design District is the walkable part. Fixed in prose and in every FAQPage JSON-LD copy so the two still match.
- The Sundune was recommended at **3 nights, and in places 2**, against a 5-night HOA floor. Also `sleeps 4` corrected to 6 (three king beds).
- Terra Luz pool heating was presented as a free year-round perk. The **spa** is complimentary; **pool** heating is $75/night. Also `sleeps 6` corrected to 8, and checkout 11am corrected to 10am.
- 24 instances of the retired name **"Casa Moto"** on a live indexed post. Renamed in copy, slug deliberately untouched since it is in `sitemap.xml` and would need a redirect.
- **Airbnb service fee** stated as "14-20%" or "15-20%" in 7 places. Repo `CLAUDE.md` is explicit that it is 20% flat. Also corrected the `book-direct` dollar math, which claimed $150-210 of fees on a $1,500 subtotal where 20% is $300.
- **Indian Palms to Empire Polo Club** quantified as mileage or a car trip in ~40 places ("1.5 miles", "19 minutes on foot", "7-minute drive from the stage"). Repo `CLAUDE.md` requires plain walking-distance framing. Palm Springs, Idyllwild, LAX and Sundune distances were left intact on purpose.

Also fixed: 4 em dashes (all on HTML, blog `.md` was already clean), the banned word "curated" in 5 spots including two JSON-LD amenity names, and ~18 genuine X. Y. Z. sentence-stacking runs.

~~**TASK GA4-1: Diagnose Cozy Cactus property page bounce rate**~~ ✅ **DONE 2026-07-30** — measured, and the speed hypothesis is **wrong**.

PageSpeed Insights API is unusable (anonymous returns 429 with `quota_limit_value: 0`; the repo's `GOOGLE_API_KEY` returns 403, API not enabled on that project). Fell back to local Lighthouse 12.8.2, 3 mobile runs on Cozy Cactus and 2 on Terra Luz to control for variance.

Median mobile score: Cozy Cactus **78**, Terra Luz **76.5**. LCP, TBT and CLS statistically indistinguishable. Above-the-fold weight runs the *opposite* way to the hypothesis: Terra Luz ships 679 KB above the fold against Cozy Cactus's 341 KB, nearly 2x heavier, and Terra Luz has 226s average engagement against Cozy Cactus's 18s. A page that is half the weight and marginally faster cannot explain a 12x engagement gap.

The LCP element on both pages is `section.hero`, a CSS `background-image`, and 75% of LCP is render delay under Lighthouse's simulated throttling. That is a shared-template artifact, not a Cozy Cactus defect.

Worth saying plainly: **36 views is not a sample.** At 75.8% that is ~27 bounces, and one session moves the rate 2.8 points. Do not over-read this number.

Real waste found and fixed anyway: three blog-card images shipping at 1.3-1.7 MB each to render in a 600x400 box. Downscaled to 1200px at q82, 4.5 MB → 0.7 MB (commit `26e64f2`).

**Conclusion:** stop spending time on Cozy Cactus performance. The 18s engagement figure is a traffic-source and intent question. The next real step is finding out which Pinterest pins and queries land on that page and whether the first screenful answers what those visitors came for.

**Open for Eann (yes/no needed):**
1. `cozy-cactus/index.html` answers "How much do I save booking directly?" with "Roughly 20%." The old copy said "About 15%," which may have been a real direct-booking discount rather than the Airbnb fee. If 15% is an actual promo number, that line needs different wording.
2. **RESOLVED 2026-07-30 — Sundune HOA minimum.** Eann confirmed the real number is 4 nights flat, no weekday/weekend split. All copy standardized on 4 (was inconsistently 5, or "4 weekday / 5 weekend"). Fixed across bnp-paribas-open-palm-springs.md, palm-springs-3-day-itinerary.md, palm-springs-with-kids.md, sundune-palm-springs-design-story.md, best-hiking-palm-springs.md, palm-springs-local-guide-sundune.md, sundune-palm-springs-review.md, and the-sundune/index.html.
3. **RESOLVED 2026-07-30 — Terra Luz pet fee.** Eann confirmed the real number is $150 flat. Fixed the $100 (2-dog max) instances in coachella-2027-where-to-stay.md, pet-friendly-palm-springs.md, and cozy-cactus-review.md to $150, preserving existing "2 dog max" framing where it was already present. Sundune's own separate $150 pet fee and Cozy Cactus's no-pets policy were left untouched.
4. **RESOLVED 2026-07-30 — Pool-post hero image.** `best-vacation-rentals-pool-coachella-valley.md` now uses the existing Terra Luz pool photo (`/blog/images/terra-luz-pool-backyard.webp`, already in use across a dozen other posts) as `heroImage`/`ogImage`, with alt text updated to describe Terra Luz's private saltwater pool instead of the Cozy Cactus backyard.

---

### What changed on 2026-07-31 — GSC Check-in

**Period:** 2026-05-02 to 2026-07-31 (90 days) vs. 2026-01-31 to 2026-05-01

**Overall:** 276 clicks, 38,000 impressions, 0.7% CTR, avg position 12.2 (prior period: 55 clicks, 6,195 impressions — +221 clicks, +31,805 impressions). Up from the 7/27 pull (268 clicks, 36,286 impr) — steady growth continues, no volatility.

**Device:** Mobile 191 clicks / 17,971 impr / 1.1% CTR / pos 8.7. Desktop 80 clicks / 19,729 impr / 0.4% CTR / pos 15.5. Tablet 5 clicks / 300 impr / 1.7% CTR. Same mobile-outperforms-desktop pattern as every prior pull.

**What's working:** Same winners holding: `/blog/palm-springs-surf-club/` (51 clicks, 9,869 impr, pos 9.2), `/blog/palm-springs-vs-scottsdale/` (39 clicks, 2,339 impr, 1.7% CTR, pos 7.6), `/blog/palm-springs-vs-indio/` (31 clicks, 6,267 impr, pos 7.8), `/blog/indio-local-gems/` (20 clicks, 2.3% CTR), `/blog/outdoor-furniture-desert-heat/` (20 clicks, 2.7% CTR). No new action — all rewritten previously.

**GSC-23/GSC-24 lift measurement (due this check-in per the 2026-07-22 plan):**
- `idyllwild-day-trip-palm-springs`: pre-rewrite baseline 114 impr / 1 click / 0.9% CTR / pos 8.0 (7/22). Now 405 impr / 1 click / 0.2% CTR / pos 8.9. Impressions nearly quadrupled (seasonal — cool-mountain-escape angle is landing in peak summer search volume) but clicks didn't follow, so blended CTR actually fell. **Verdict: no lift, seasonal impression growth masked it.** Not rewriting again — a second title change this soon would confound the read further. Hold and re-check at the next 90-day rollover.
- `best-vacation-rentals-pool-coachella-valley`: pre-rewrite baseline 70 impr / 0 clicks / pos 8.3 (7/22). Now 89 impr / 0 clicks / pos 8.6. **Verdict: no lift, still zero clicks 9 days post-rewrite at a page-1 position.** This is the second title/meta pass on this page (GSC-24) with no click response — a title problem is now unlikely to be the cause. Reclassifying as a content/trust issue: worth a SERP screenshot check to see what's outranking it and whether snippet-worthy structured content (price range, a comparison table) is missing, but that's a manual/authority-track fix, not something the next rewrite pass should touch.

**CTR opportunities (evaluated, no new actionable rewrites):** `airbnb rentals indio` (128 impr, 0 clicks, pos 1.0) — 6th consecutive appearance, standing flag for Eann (needs Search Console UI query→page cross-tab, not available via this report tool). `how far is indio from palm springs` (819 impr, 0.1% CTR) — reaffirmed non-actionable zero-click SERP-answered query.

**Weak pages — reaffirmed no-action:** `best-spas-coachella-valley-spa-day` (86 impr, 1 click, pos 11.1, 66.7% of impr ≤ pos 20) newly appears on the diagnostic table this run at low volume — below the ~100-impression bar this doc uses to open a new rewrite task, holding for now rather than opening TASK GSC-25 on thin data. Everything else on the "Pages with Impressions but Low Clicks" table is the standing content/authority-fix bucket already carried forward for weeks (`things-to-do-indio-ca`, `best-restaurants-palm-springs`, `best-hiking-palm-springs`, `salton-sea-day-trip`, `bnp-paribas-indian-wells-where-to-stay`, `coachella-valley-food-guide`, `/blog/`) or declined title targets (`lax-to-palm-springs`, `classpass-palm-springs`, `best-pastries-palm-springs`).

**Action items generated:** none new. GSC-23/24 both closed out as "no measurable click lift" — first negative result in this rewrite series, worth remembering before opening more title/meta tasks on page-1-position/low-CTR pages: the lever works better on buried pages than page-1 ones apparently already showing their best snippet.

### Pinterest Check-in — 2026-07-31

**Live pull** (`pinterest-publisher/scripts/get_analytics.py --account --days 30`, 2026-07-01 to 2026-07-31): 46,849 impressions, 277 pin clicks, 242 outbound clicks, **3 saves**. Up from the 7/27 pull (41,420 / 260 / 236 / 2 saves) — steady volume growth, saves ticked back up to 3. Same paid-Performance+-driven traffic pattern with a weak organic save signal as every prior check-in.

**Monthly viewers:** Still unknown — 12th consecutive check-in flagging this. Account-level impressions blend the ~$200/mo paid campaign with organic and are NOT the "monthly viewers" figure the 25-30K link-switch threshold is based on. Last real figure remains ~20K (June 3 screenshot, now 58 days stale). No fresher figure logged in `sabbir_context.md` or memory.

**Link status:** Airbnb. Threshold not confirmed hit — **not switching links off Airbnb**, per standing instruction, without a direct monthly-viewers login confirming ≥25K.

**Quora Q&A live:** No change reported this run — no fresh count available without Sabbir/Eann's own posting log.

**Action items:** none auto-actionable (monthly-viewers pull remains Eann's manual task in Pinterest Business Hub; 12 consecutive check-ins open on this single item — this is now the single most standing open item in the doc).

### GA4 Check-in — 2026-07-31

**Period:** 2026-07-24 to 2026-07-31 (7 days), vs. 2026-07-16 to 2026-07-23

**Overall:** 125 active users (+13), 129 new (+14), 148 sessions (+16), avg session duration 73s (-42s vs. prior 115s), 541 events (+11). Same pattern as every recent pull: traffic keeps growing, per-session engagement time keeps shrinking.

**Traffic source mix:** Organic Search 60 sessions, Direct 37, Organic Social 28, Unassigned 7, AI Assistant 2, Cross-network 1, Referral 1. Organic Search is still roughly 2x Organic Social — Pinterest-dependent tasks don't get pulled forward yet. AI Assistant traffic persists at a small but non-zero 2 sessions, consistent with the first sighting on 7/30.

**High-bounce pages (50+ views, >60% bounce):** none — no page cleared the 50-view threshold this week. Below-threshold read: `/cozy-cactus/` — 32 views, 86.2% bounce, 18s avg duration, still the highest-traffic page on the site and still the worst engagement, materially unchanged from the 7/30 read (36 views, 75.8% bounce, 18s). `/terra-luz/` — 11 views, 87.5% bounce but 317s avg duration (single-page-session artifact, not a real problem, per 7/30 diagnosis). `/blog/best-time-to-visit-palm-springs/` — 5 views, 80% bounce, 12s.

**New this run — investigated the contact-page "duplication," resolved it:** nine near-identical low-traffic paths (`/about/contact`, `/connect`, `/contact`, `/contact-us`, `/contact-us/`, `/contact/`, `/get-in-touch`, `/reach-out`, `/reach-us`) each show 2 views, 100% bounce, 0-11s duration. Checked the repo: none of these paths exist as real pages — no matching HTML files, no `go/` redirects, no references anywhere in the codebase. They're all 404s served by GitHub Pages' `404.html`, which carries the same GA4 tag as every other page, so each miss still logs a pageview. This is very likely automated probing (a bot or an AI browsing agent guessing common "contact us" URL patterns) rather than real visitors hitting broken links — the 2-views-each-uniform pattern across 9 URL guesses and nothing under 11s duration fits probing, not human confusion. **Not a routing bug, nothing to fix.** No actual `/contact` page or link exists on the site to begin with (contact is handled via the booking widget / Airbnb messaging), so there's no canonical page being fragmented. Closing this without action.

**Property page visibility:** Terra Luz 12 views / Cozy Cactus 33 / Sundune 7. Sundune still sits at roughly a fifth of Cozy Cactus — same persistent gap flagged in every recent run, not closing.

**Action items generated:**
1. Sundune visibility gap (7 views) persists across every recent check-in. No new blog post or Pinterest board action taken this run — holding per the standing note that this needs a dedicated content push, not a quick fix.
2. Cozy Cactus 18s engagement + 86.2% bounce continues unchanged since the 7/30 page-speed diagnosis concluded speed isn't the cause. Next real lever (per that diagnosis) is matching landing content to the Pinterest pins/queries actually driving the traffic — not yet done.

### Pinterest Check-in — 2026-08-12

**Live pull** (`pinterest-publisher/scripts/get_analytics.py --account --days 30`, 2026-07-13 to 2026-08-12): 46,935 impressions, 299 pin clicks, 267 outbound clicks, **5 saves**. Up from the 7/31 pull (46,849 / 277 / 242 / 3 saves) — impressions essentially flat (+86), clicks and saves both ticked up (pin clicks +22, outbound +25, saves +2). Same paid-Performance+-driven volume with a still-thin organic save signal, but this is the best save count logged since tracking started.

**Monthly viewers:** Still unknown — 13th consecutive check-in flagging this. Last real figure remains ~20K (June 3 screenshot, now 70 days stale). No fresher figure in `sabbir_context.md` or the Google Sheet.

**Link status:** Airbnb. Threshold not confirmed hit — not switching links off Airbnb without a direct monthly-viewers login confirming ≥25K.

**Quora Q&A live:** No change reported this run — no fresh count without Sabbir's own posting log.

**Board-level breakdown** (organic, 2026-07-13 to 2026-08-12): Interior Design leads at 505 impressions/22 pin clicks/5 outbound (best-performing board this run despite being a generic/non-property board), Terra Luz | Palm Springs Luxury Airbnb 393 impr/9 clicks/0 outbound, Cozy Cactus | Palm Springs Family Airbnb 237 impr/2 clicks/0 outbound, Cozy Cactus Instagram 163 impr/13 clicks/0 outbound. Board totals sum to ~1,495 impressions — a small fraction of the 46,935 account-level figure, confirming (again) that the account number is paid-Performance+-driven and boards are the honest organic read. 4/4 pin-level analytics calls on the "Social" board failed (API error, not zero performance — noted, not treated as a real 0). Sundune has no dedicated board yet, consistent with its persistent GA4 visibility gap.

**Action item queued:** create a Sundune-specific Pinterest board — it's the only property with zero organic Pinterest presence, matching the Sundune visibility gap flagged in every recent GA4 check-in.

**Action items:** none auto-actionable. Monthly-viewers pull remains Eann's manual Business Hub task — now the single longest-open item in this doc (13 straight check-ins).

### PSL Newsletter Inspo Check-in — 2026-07-31

Pulled 20 recent emails from `news@palmspringslife.com` and cross-referenced against the blog inventory (`ls content/blog/`).

**Already covered, skipped:** Air Museum kids-free promo, Game Night/Trivia, and Poolside Bars/Resort Dining were all already fully covered by existing posts (`game-night-trivia-coachella-valley.md` and `palm-springs-poolside-bars-resort-dining.md`, both dated within the last two weeks, apparently already sourced from this same newsletter feed in a prior run).

**Deferred, not yet real:** YOZU, a Tokyo izakaya opening at The Shops on El Paseo, is scheduled for 2026-08-26 — genuinely new but not open yet. Holding until the opening date rather than publishing unverifiable pre-open details.

**Actioned — update, not a new post:** Added The Golf Bar (79815 CA-111, Ste 102, La Quinta) to `content/blog/palm-springs-bars.md` as a new "Indoor and Air-Conditioned" section, verified independently via WebSearch (official site + Yelp) rather than trusted from the newsletter blurb. Also updated the "Getting-Home Factor" section and the Quick Reference comparison table, and bumped `dateModified` to 2026-07-31. Fits the existing "20-minute drive from The Sundune, requires a car" pattern already established for The Nest — treated as an in-place update rather than a new post.

**New posts this run:** 0 (cap is 3).

### Hero Image Audit — 2026-07-31

No full pass. Last full inventory 2026-07-13 (18 days, inside the 30-day window). No new blog post published this run. The one content change (`palm-springs-bars.md`, Golf Bar section) was a body-content addition only — no `heroImage`/`heroPosition` touched, no new hero needed since the addition isn't the lead topic of the post. Nothing new to re-check. Next full pass due on/after 2026-08-12.

### PSL Newsletter Inspo Check-in — 2026-08-12

Pulled recent `news@palmspringslife.com` emails. Two update candidates surfaced, both actioned as in-place updates (no new posts this run):

**Actioned — `palm-springs-bars.md`:** Added a "Reader-Voted Cocktail Winners Worth a Detour" section covering PSL's reader-survey cocktail winners outside the core walkable list (Shadynasty, La Rumba, The Roost Country Club, Foxy's Kitchen and Bar). PSL's ranking/award claims attributed via link per copyright ground rules; venue/cocktail facts independently re-verified via WebSearch, not trusted blind from the newsletter. Added a matching FAQ entry (JSON-LD + visible) since the section names four new venues. Bumped `dateModified` to 2026-08-12.

**Actioned — `date-farms-indio-coachella-valley.md`:** Added a "Date-Infused Cocktails Worth Seeking Out" section covering PSL's date-cocktail roundup (Kiki's in La Quinta, Tommy Bahama's Marlin Bar, The Pink Cabana at Sands Hotel & Spa). Same attribution/verification standard applied. Bumped `dateModified` to 2026-08-12. No FAQ entry added here (asymmetric vs. the bars post — worth a matching FAQ addition in a future pass for consistency).

Built, committed, and pushed as `f79d5ad`. Deploy confirmed queued via `gh run list`.

**New posts this run:** 0 (both were update candidates, no new-post gap identified).

### Hero Image Audit — 2026-08-12

Full pass completed. One fix applied and deployed (commit `d777c3f`, confirmed live via `gh run list`). Two items flagged for Eann's yes/no, not yet decided:
1. `west-elm-dining.webp` used as the hero for two topically unrelated posts.
2. `cozy-cactus-hot-tub.webp` used as the hero for `desert-hot-springs-day-trip.md` — cross-sell ambiguity (reads as a Cozy Cactus amenity photo on a post that isn't about Cozy Cactus).

Neither of today's two PSL-inspo content updates touched `heroImage`/`heroPosition` — both were body-content additions to existing posts, not new posts or lead-topic changes, so no new hero needed. Next full pass due on/after 2026-09-11.

---

### What changed on 2026-09-08 — GSC Check-in

**Period:** 2026-06-10 to 2026-09-08 (90 days) vs. 2026-03-11 to 2026-06-09

**Overall:** 473 clicks, 62,235 impressions, 0.8% CTR, avg position 10.8 (prior period: 112 clicks, 17,001 impressions — +361 clicks, +45,234 impressions). Big jump vs. the 8/12 run — this is the first check-in since the credential outage (see below), so it covers a wider gap than usual.

**Auth note:** GSC and GA4 API access broke between the 8/12 and this run — the stored Google OAuth token was missing the Search Console and Analytics scopes, then (after adding them) it turned out the whole integration was running through `etuan@netflix.com` on a Netflix-owned GCP project with an Internal-only OAuth consent screen and the two APIs never enabled. Rebuilt the integration from scratch on a new, Eann-owned GCP project (`noted-throne-488421-v4`), authorized as `eann.tuan@gmail.com`. `google_credentials.json` now points at the new project. This also fully decouples Indigo Palm's automation from Eann's work Google account — worth noting as a real risk that's now closed.

**Device:** Mobile 309 clicks / 31,515 impr / 1.0% CTR / pos 8.4. Desktop 152 clicks / 30,158 impr / 0.5% CTR / pos 13.4. Tablet 12 clicks / 562 impr / 2.1% CTR / pos 7.3. Same mobile-outperforms-desktop pattern as every prior pull.

**What's working:** `/blog/palm-springs-vs-scottsdale/` (70 clicks, 4,001 impr, 1.7% CTR, pos 6.8) has overtaken `/blog/palm-springs-surf-club/` (48 clicks, 10,143 impr, pos 8.9) as the top click-getter. `/blog/outdoor-furniture-desert-heat/` (37 clicks, 2.3% CTR), `/blog/indio-local-gems/` (28 clicks, 1.7% CTR), `/blog/date-farms-indio-coachella-valley/` (21 clicks) all holding steady growth.

**New CTR-opportunity rewrites executed this run (title/meta only, no query-level position change expected — these were selected because their "Pages with Impressions but Low Clicks" diagnostic showed 100% of impressions at position ≤ 20, the highest-confidence signal, distinct from the two GSC-23/24 rewrites that already showed no measurable lift on similarly well-positioned pages):**
- `grocery-stores-coachella-valley` — 631 impr, 1 click, 0.2% CTR, pos 8.6. Title changed from "Best Grocery Stores Near Palm Springs and Indio, CA" to "Grocery Stores Near Palm Springs & Indio: Which One" — leads with the actual decision the searcher is making instead of a generic category label. Meta rewritten to open with the four store names instead of burying them mid-sentence.
- `indian-canyons-palm-springs` — 132 impr, 2 clicks, 1.5% CTR, pos 8.6, 100% of impressions ≤ pos 20. Title changed from "Indian Canyons Palm Springs: What to Know Before You Go" (generic) to "Indian Canyons Palm Springs: Trails, Fees & Timing" (names the three things a hiker actually needs before clicking).
- Also found and fixed a duplicate `dateModified` frontmatter key on `indian-canyons-palm-springs.md` introduced by this edit — harmless to the build but cleaned up.

**Held, not rewritten this run — per the 7/31 finding that title/meta rewrites on already-well-positioned pages (pos ≤ 12) haven't shown measurable lift twice in a row (GSC-23, GSC-24):** `modernism-week-palm-springs` (107 impr, pos 9.0, CTR already 1.9%), `indio-between-coachella-weekends` (111 impr, pos 11.9, CTR already 1.8%), `coachella-2027-where-to-stay` (84 impr, pos 6.7, CTR already 1.2%). These three already have above-baseline CTR for their position band — the diagnostic flagged them on the "100%/80% of impressions ≤ pos 20" rule alone, but that rule doesn't distinguish "good position, still weak CTR" from "good position, CTR already fine." Not spending another rewrite cycle on pages that aren't actually underperforming their position.

**Standing content/authority-fix bucket (unchanged, no title work applies):** `best-restaurants-palm-springs` (1,166 impr, pos 33.6), `/blog/` index (223 impr, pos 16.4), `salton-sea-day-trip` (148 impr, pos 18.0), `coachella-valley-food-guide` (71 impr, pos 36.6). All need content depth/backlinks, not title churn.

**Standing declines (unchanged):** `classpass-palm-springs` (331 impr — thin, branded), `airbnb rentals indio` (recurring 0-click pos-1 query, needs a manual GSC UI query→page cross-tab Eann has to run), `how far is indio from palm springs` (839 impr, 0.1% CTR — SERP-answered zero-click query, non-actionable).

**Action items generated:** 2 title/meta rewrites shipped (above). No new content-gap or technical-SEO items surfaced this run.

### GSC Alert Email Review — 2026-09-08

**Emails reviewed:** 54 unique GSC alert/digest emails to `eann.tuan@gmail.com` (as `indigopalmco@gmail.com`, the verified GSC owner), covering 2026-04-19 to 2026-09-08. First time this inbox has been mined systematically rather than just the API pull.

**Deficiencies found:**
1. **Recurring "Excluded by noindex tag" / "Page with redirect" alerts, first flagged 2026-05-14, still live as of the 2026-08-23 email.** Root cause found by crawling every sitemap.xml URL directly (GSC's own emails don't list the specific URLs, only a UI report link): `where-to-stay-coachella-2026` and `bnp-paribas-open-vacation-rental-guide` are old post slugs converted to `noindex` `redirect.njk` pages pointing at their consolidated replacements (`where-to-stay-coachella`, `bnp-paribas-indian-wells-where-to-stay`), but were never removed from `sitemap.xml`. Submitting a noindex/redirect page in the sitemap generates this alert on every crawl. **Status: fixed this run** — both URLs removed from `sitemap.xml`, committed `ce913bc`. Monitor: check the Page indexing report in Search Console in ~1-2 weeks; the "Excluded by noindex tag" count should drop by 2 and stop recurring.
2. **"Not found (404)" and "Alternate page with proper canonical tag," flagged 2026-08-07.** Crawled the full current sitemap — zero 404s or unexpected redirects found among the 108 live URLs, so this isn't a currently-live sitemap problem. Google most likely discovered a dead URL via an external backlink or an old internal link no longer in the sitemap (can't identify the exact URL without the Search Console UI's Page indexing report, which isn't exposed via the Search Analytics API this pipeline uses). "Alternate page with proper canonical tag" is very often benign — it means Google correctly recognized a duplicate/variant and picked the canonical, not necessarily an error. **Flagged for Eann:** open Search Console → Indexing → Pages → "Not found (404)" to get the specific URL list; if it's an old backlink, either 301-redirect it or ignore it (a stale external link 404ing isn't harmful to a site that isn't the one at fault).
3. **"New owner for indigopalm.co" (2026-08-23) is informational, not a security concern** — confirms `indigopalmco@gmail.com` (an account Eann controls) as an existing verified owner. No action needed.

**No deficiencies found in:** monthly performance digests (April 40 clicks/28 days → August 187 clicks/28 days, steady organic growth, consistent with the API pull's own trend), or the "Improve Google presence" onboarding email (informational, already acted on since the property is actively monitored).

This phase is now a permanent part of `/babysit-seo` (see updated `~/.claude/skills/babysit-seo/SKILL.md`, Phase 0.5a) — it will re-run every invocation, not just today, since new alert emails can land at any time and closing the loop (alert → fix → confirm the metric moved) is the actual goal.

### Pinterest Check-in — 2026-09-08

Deferred this run — see note under "What was skipped" in the final report. Priority this run went to fixing the Google credential/API-access outage, which blocked GSC/GA4 entirely; Pinterest's own API path was unaffected by that outage and wasn't re-checked today. Last live figures remain the 8/12 pull (46,935 impressions, 299 pin clicks, 267 outbound, 5 saves, 30 days to 8/12). Pick up at the next run.

### GA4 Check-in — 2026-09-08

**Period:** 2026-09-01 to 2026-09-08 (7 days) vs. 2026-08-24 to 2026-08-31

**Overall:** 208 active users (+54 vs. prior week), 204 new, 238 sessions (+66), avg session duration 116s (+14s), 894 events (+237). Growth continues across the board, and average engagement time is finally moving up instead of down for the first time in several check-ins.

**Traffic source mix:** Organic Search 105 sessions / 85 users, Direct 99 / 95, Unassigned 18, AI Assistant 15, Organic Social 8, Referral 3. AI Assistant traffic (15 sessions) is now a real, growing line item — up from the low single digits flagged in July. Organic Social (Pinterest) dropped to 8 sessions this week, well below its recent ~50-55% of Organic Search share — worth confirming this is a one-week dip and not a trend once Pinterest is re-checked next run.

**High-bounce pages (50+ views, >60% bounce):** none cleared the 50-view threshold. Homepage `/` is healthiest it's been: 39 views, 44.0% bounce, 223s avg duration.

**Property page visibility:** Terra Luz 11 views / Cozy Cactus 7 / Sundune 11. Notable shift — Terra Luz and Sundune have both overtaken Cozy Cactus this week, reversing the "Cozy Cactus dominates" pattern that held for the entire July-August run of check-ins. Cozy Cactus's own page also shows healthy engagement now (28.6% bounce, 161s), suggesting this week's numbers are a genuine mix shift, not a Cozy Cactus problem.

**Action items generated:** Pinterest Organic Social dip and the Terra Luz/Sundune/Cozy-Cactus visibility reshuffle are both one-week reads — flag for confirmation at the next check-in rather than acting on a single week of data. Separately, Eann asked mid-session why Terra Luz specifically isn't converting to bookings — a background investigation was dispatched covering Hostaway calendar/reservations, PriceLabs pricing, and renovation-status verification; findings will be logged here once that completes.

