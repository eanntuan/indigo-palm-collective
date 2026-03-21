# Indigo Palm Collective — Changelog

---

## 2026-03-20 — SEO Overhaul

### Added
- `festivalguide.html` — Full Coachella/Stagecoach festival guide page at `indigopalm.co/festivalguide`
  - Walking route (Yellow Path, 1.5 miles, 19 min)
  - Golf cart rides, driving gates (Monroe ✓, Ave 50 ✗), road closures
  - Indian Palms amenities (pools, pickleball, tennis)
- `404.html` — Branded "Lost in the Desert" error page with property links
- FAQ accordion section on `index.html` — 9 questions (5 general + 4 festival-specific)
- Google share link added to homepage JSON-LD `sameAs` array
- Breadcrumb `BreadcrumbList` schema on `ps-retreat.html` and `the-well.html`
- `festivalguide` added to `sitemap.xml`

### Changed
- **Blog URL structure** — all 11 posts moved from `blog/post.html` to `blog/post/index.html` for clean URLs (no `.html` extension)
- **Gallery images** — all 4 property pages converted from CSS `background-image` divs to proper `<img>` tags with `alt` text, `loading="lazy"`, and `decoding="async"`
- **Terra Luz gallery** — added `role="img"` and `aria-label` to all 18 gallery items
- **blog.html** — fixed all internal links to use clean URLs; added 5 previously orphaned posts (cozy-cactus-story, beyond-coachella-desert-escape, coachella-valley-insider-guide, palm-springs-coffee-guide, terra-luz-origin-story)
- **sitemap.xml** — updated all blog URLs to clean format, fixed stale `lastmod` dates, removed duplicate `terra-luz` entry, removed stale `casa-moto` entry
- **casa-moto.html** — canonical updated from `/casa-moto` to `/terra-luz` (rebrand consolidation)
- **cozy-cactus.html** — meta description trimmed from 180 to 153 characters
- **Git remote** — switched from SSH to HTTPS (`https://github.com/eanntuan/desert-edit-properties.git`)

### Fixed
- Placeholder phone number removed from `index.html` JSON-LD schema
- Duplicate `terra-luz` entry removed from sitemap
- Blog links in `blog.html` were pointing to `.html` URLs — now use clean URLs

---

## 2026-03-15 — Terra Luz Rebrand & Content Push

### Added
- `terra-luz.html` — new property page for Terra Luz (formerly Casa Moto)
- Blog posts: cozy-cactus-origin-story, indio-local-gems, cozy-cactus-what-i-built, where-to-stay-coachella-2026, indio-between-coachella-weekends, palm-springs-local-guide-sundune, beyond-coachella-desert-escape, coachella-valley-insider-guide, palm-springs-coffee-guide, terra-luz-origin-story
- `sitemap.xml` — initial version with all property + blog URLs

### Changed
- Property renamed: Casa Moto → Terra Luz
- `booking-config.js` — updated property IDs and names

---

## 2026-03-14 — Infrastructure & Brand Setup

### Added
- GitHub Actions workflow (`deploy.yml`) — auto-deploy to GitHub Pages on push to `main`
- Scheduled blog publishing workflow (`scheduled-publish.yml`)
- Cloudflare Worker (`api-worker/`) — handles `/api/*` routes
- `TECH_STACK.md` — infrastructure documentation
- `CLAUDE.md` — Claude Code instructions

### Changed
- Hosting migrated from Netlify → GitHub Pages
- DNS managed via Cloudflare (orange-cloud proxy)

---

## 2026-02-25 — Initial Launch

### Added
- `index.html` — homepage with property grid, hero video, brand story
- `cozy-cactus.html` — property page
- `ps-retreat.html` — property page
- `the-well.html` — property page
- `blog.html` — blog index page
- `booking-flow.html` + `booking-flow.js` — direct booking system
- `admin-approve.html` — host approval flow
- Resend email integration (guest + host notifications)
- Square payment link generation
- PriceLabs dynamic pricing integration
- Airbnb iCal feed for availability blocking
- `robots.txt`, favicons, OG image
