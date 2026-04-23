# Contributor Guide — Indigo Palm Collective Website

Welcome. This guide covers everything you need to edit content, add blog posts, and understand how the site works.

---

## Who This Is For

Anyone with Write access to `eanntuan/desert-edit-properties`. Primarily Sabbir Ahmed (Pinterest + Instagram VA) — but applies to any future contributor.

---

## The Short Version

- **Edit blog posts** via the CMS at indigopalm.co/admin (preferred) or by editing `.md` files in `content/blog/`
- **Never edit** files inside the `blog/` folder — those are auto-generated and will be overwritten
- **Push to main** = site goes live within ~2 minutes
- **Brand voice rules** apply to everything you write — see below

---

## Site Overview

| What | Where |
|---|---|
| Live site | indigopalm.co |
| Repo | github.com/eanntuan/desert-edit-properties |
| CMS | indigopalm.co/admin |
| Blog source files | `content/blog/*.md` |
| Blog images | `content/blog/images/` and `blog/images/` |
| Property pages | Root-level HTML files (`cozy-cactus.html`, etc.) |
| Sitemap | `sitemap.xml` |
| Blog index | `blog.html` |

**How it builds:** Eleventy (a static site generator) reads the `.md` files in `content/blog/` and compiles them into `blog/[slug]/index.html`. GitHub Pages serves the output. Push to `main` triggers a deploy automatically via GitHub Actions.

---

## The Four Properties

| Property | Slug | Location |
|---|---|---|
| The Cozy Cactus | `cozy-cactus` | 82381 Cochran Dr, Indio CA |
| Terra Luz | `terra-luz` | 49768 Pacino St, Indio CA |
| The Sundune | `the-sundune` | 5301 E Waverly Dr #184, Palm Springs CA |
| The Well | `the-well` | 510 N Villa Ct #106, Palm Springs CA (long-term rental) |

---

## How to Edit Blog Posts

### Option 1: CMS (easiest, recommended)

1. Go to indigopalm.co/admin
2. Log in with your GitHub account (use `sabbirahmed31dec-ops`)
3. Click **Blog Posts**
4. Find the post, click to edit
5. Make changes, click **Publish**

Changes commit directly to `main` and deploy automatically.

### Option 2: GitHub (for more control)

1. Open the repo at github.com/eanntuan/desert-edit-properties
2. Navigate to `content/blog/[post-slug].md`
3. Click the pencil icon to edit
4. Make changes
5. At the bottom, click **Commit changes** directly to `main`

**Important:** Only edit files in `content/blog/`. Never edit anything inside the `blog/` folder directly — Eleventy regenerates those on every deploy and your changes will be lost.

---

## Blog Post Frontmatter

Every `.md` file starts with a frontmatter block. Here's what each field means:

```yaml
---
title: "Your Post Title Here"           # 50-60 characters, keyword-first
date: 2026-04-23                        # publish date
dateModified: 2026-04-23               # update when you edit
metaDescription: "..."                  # 140-155 characters, for Google
ogImage: /blog/images/your-image.webp   # social share image
heroImage: /blog/images/your-image.webp # top-of-post image
heroAlt: "Descriptive alt text"        # required for accessibility/SEO
keywords:                               # 3-6 target keywords
  - keyword one
  - keyword two
articleSection: "Local Guide"          # category label
property: cozy-cactus                  # which property this relates to (optional)
readTime: "5 min read"
excerpt: "One-sentence summary."       # shown on blog index cards
layout: blog-post.njk                  # always this value, do not change
---
```

Below the `---` closing line is the post body in Markdown.

---

## Writing Rules

These apply to everything on the site.

### Voice
- First-person, specific, honest
- Short paragraphs: 2-4 sentences max
- No hollow adjectives: say what makes something good, not just "great"
- Specific and visual: "hot tub under desert stars" not "relaxing amenities"
- No buzzwords: no "luxury," "curated experience," "world-class"

### No em dashes — ever
Replace with a period, comma, or colon. This is a hard rule.

### Images
- Every image needs `alt` text describing what is in the photo
- Use `loading="lazy"` on all images below the fold
- Include `width` and `height` attributes
- Place images throughout the post, not just at the top

### SEO
- Title: 50-60 characters, lead with the keyword
- Meta description: 140-155 characters
- At least 2 internal links per post (link to other posts or property pages)

---

## Adding Images

Upload images to `content/blog/images/` via GitHub (drag and drop into the folder). Reference them in your post as `/blog/images/your-filename.webp`.

Keep filenames lowercase with hyphens. No spaces.

---

## What NOT to Touch

Unless explicitly asked by Eann:

| Do not edit | Why |
|---|---|
| `blog/` folder contents | Auto-generated, overwritten on every deploy |
| `sitemap.xml` | Maintained separately |
| `blog.html` card list | Updated manually by Eann |
| `admin/config.yml` | CMS configuration |
| `api-worker/` | Backend API, Cloudflare Worker |
| `.github/workflows/` | CI/CD pipeline |
| Any root-level HTML (except blog posts) | Property pages, managed by Eann |

---

## Deploy Process

1. Commit to `main` (via CMS or GitHub)
2. GitHub Actions picks it up automatically
3. Eleventy builds the site
4. GitHub Pages deploys it
5. Live at indigopalm.co in ~2 minutes

You can check deploy status at: github.com/eanntuan/desert-edit-properties/actions

---

## Contact

Questions about the site, content direction, or access: reach Eann directly.
