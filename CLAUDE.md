# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build blog (Eleventy: content/blog/*.md → blog/[slug]/index.html)
npm run build

# Deploy Cloudflare Worker
cd api-worker && wrangler deploy

# Set Worker secrets (one-time)
wrangler secret put PRICELABS_API_KEY
wrangler secret put RESEND_API_KEY

# Convert image to WebP (required for all blog images)
cwebp -q 85 input.jpg -o blog/images/output.webp

# Get image dimensions for width/height attributes
python3 -c "from PIL import Image; img=Image.open('file.webp'); print(img.size)"
```

**Deploy:** Push to `main` → GitHub Actions runs `npm ci && npm run build` → GitHub Pages. Live in ~2 minutes.

Always `git pull --rebase` before editing — Sabbir also commits via the CMS.

---

## Architecture

### Two separate systems in one repo

**1. Static HTML pages** (`index.html`, `terra-luz.html`, `cozy-cactus.html`, `ps-retreat.html`, `the-well.html`, `blog.html`, etc.)
Plain HTML. Not Eleventy-generated. Edit directly. Dynamic content for property pages is loaded at runtime from `_content/*.json` (one file per property) via inline JavaScript.

**2. Blog pipeline** (`content/blog/*.md` → Eleventy → `blog/[slug]/index.html`)
- `content/blog/[slug].md` is the source of truth. **Never edit the generated HTML in `blog/` directly** — it gets overwritten on every build.
- Layout `_layouts/blog-post.njk` injects all `<head>` content (canonical, OG tags, JSON-LD BlogPosting + BreadcrumbList, GA, Pinterest tag, Clarity), full nav, footer, CTA box, and newsletter form. Do not duplicate any of this in `.md` files.
- Images: `.md` files reference `/blog/images/filename.webp`. Eleventy copies `content/blog/images/` → `blog/images/` via passthrough. Add new images to `content/blog/images/`.
- Eleventy config (`.eleventy.js`): layouts from `_layouts/`, includes from `_includes/`, data from `_data/`.

The `blog-post.njk` layout generates all schema and meta automatically from these frontmatter fields: `title`, `metaDescription`, `ogImage`, `heroImage`, `heroAlt`, `date`, `dateModified`, `keywords`, `articleSection`, `property`, `readTime`, `excerpt`.

### Cloudflare Worker (`api-worker/index.js`)
Handles `indigopalm.co/api/*`: availability (from Airbnb iCal feeds), pricing (from PriceLabs), booking confirmation emails (via Resend), and CMS OAuth. Property slugs → iCal URLs and PriceLabs IDs are hardcoded in `ICAL_URLS` and `PRICELABS_LISTINGS` at the top of the file. `terra-luz` and `casa-moto` are aliases pointing to the same listing. Secrets are Cloudflare Worker secrets, not `.env`.

### go/ redirects
`/go/[name]/` are static meta-refresh redirect pages (not Eleventy). Use the `redirect.njk` layout with a `redirectTo` frontmatter field. These are the short URLs in guest messages (e.g. `indigopalm.co/go/ps-local-guide`).

### CMS
Decap CMS at `/admin` (config: `admin/config.yml`) writes to `content/blog/*.md` via GitHub API. The `property` field maps to the slugs below.

---

## Property Slugs

Used in blog frontmatter (`property:`), Worker routes, CMS config, and booking-flow URLs. Must match exactly.

| Property | Slug | Notes |
|---|---|---|
| The Cozy Cactus | `cozy-cactus` | |
| Terra Luz | `terra-luz` | `casa-moto` is a legacy Worker alias |
| The Sundune | `ps-retreat` | Legacy slug; brand name is "The Sundune" |
| The Well | `the-well` | Long-term rental only |

---

## Factual Accuracy — Do Not Get These Wrong

These are confirmed facts that have been corrected from prior AI errors. Apply them in every piece of copy, JSON-LD, FAQ, and blog post.

### Airbnb service fee
**Correct:** Airbnb charges guests a **20% service fee** on the booking subtotal (nightly rate + cleaning fee, before taxes).
**Wrong:** "8–14%", "14–16%", "14.5%", or any other range. These are outdated or simply incorrect.
- Use in copy: "Airbnb's 20% guest service fee" or "skips the 20% Airbnb service fee"
- Math example for a $1,250 subtotal: $250 service fee (20%), total $1,500 before taxes

### Indian Palms Country Club → Empire Polo Club
**Correct:** Indian Palms Country Club (where Terra Luz and Cozy Cactus are located in Indio) is **walking distance** to the Empire Polo Club / Coachella and Stagecoach festival grounds.
**Wrong:** "2.5 miles," "2.5-mile drive," "7–10 minutes by car," or any phrasing that implies guests must drive.
- Use in copy: "walking distance to the Empire Polo Club" or "walking distance to the festival grounds"

---

## After Writing a Blog Post

1. Add card to `blog/index.html` (the live card list; `blog.html` at the repo root is a dead `noindex` redirect stub, not the real list)
2. Add URL to `sitemap.xml`
3. Commit: `git add content/blog/[slug].md content/blog/images/ blog/index.html sitemap.xml && git commit -m "Add [slug] post" && git push`
4. Remind user to run `/pinterest-pins [slug]`

---

## Image Sizing Rule (all pages, all properties)

Reference: https://indigopalm.co/blog/dsrt-surf-palm-desert/ is the look Eann wants.

- **In-copy photos:** full width of the text column (blog column is 800px max, about 736px of image), `height: auto`, natural aspect ratio, never cropped (no `object-fit: cover` on in-copy images). Landscape 3:2 to 16:9 only, so a photo lands about 410-490px tall. Rounded corners (16px), soft shadow, 2rem vertical margin, italic centered caption under it.
- **Portrait photos:** never full column width (a 2:3 photo at 736px is over 1100px tall). Cap at `max-height: 560px`, `width: auto`, centered. Prefer a landscape alternative when one exists.
- **Heroes:** full-bleed band about 480px tall on desktop (property room pages: `aspect-ratio: 16 / 8`, `min-height: 420px`, `max-height: 78vh`, `width: 100%`), cover-cropped from a wide landscape photo (1600px+ wide) showing the whole room or scene, never a detail close-up. Phones: about 55vh with `min-height`, not a fixed height.
- **Always** set `width` and `height` attributes to the real pixel dimensions and `loading="lazy"` below the fold; WebP only.
- **Never** shrink photos to a fraction of the column (earlier "1/3 size" attempts were rejected); the goal is that no single photo takes more than about half a screen of vertical space.
