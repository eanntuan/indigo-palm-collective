# Sabbir's CMS + Content Request Guide
### Indigo Palm Collective — Last updated April 2026

This guide covers how to use the website CMS and how to communicate blog and keyword requests to Eann (who runs them through Claude). Should take under 10 minutes to read.

---

## 1. Logging Into the CMS

**URL:** https://indigopalm.co/admin

Login via **GitHub OAuth**. Use your GitHub account: `sabbirahmed31dec-ops`.

First time: click "Login with GitHub," authorize the app, and you're in. After that it remembers you.

What you'll see when you land:
- A list of all published blog posts
- A "New Blog Post" button
- Each post is clickable and opens in an editor

That's it. No code, no FTP, no terminal. The editor handles everything.

---

## 2. How Blog Posts Actually Work

Each blog post is a file with two parts: **frontmatter** (structured fields at the top) and **body content** (the article itself).

The frontmatter has fields like title, date, meta description, keywords, and hero image. These power the SEO and how the post appears on the blog index page. The CMS shows these as form fields, so you don't see the raw code — just fill in the boxes.

A few rules:

- **Do not edit HTML files directly.** Eann runs a build process that overwrites the HTML every time code is deployed. The CMS (markdown source) is the only safe place to make changes.
- **Drafts are safe.** Posts in "Draft" status don't go live. You can save a draft, close the browser, come back later, and nothing breaks.
- **Publishing is instant-ish.** Once you hit Publish, GitHub auto-deploys. Changes are live within about 2 minutes.
- **Images must be .webp format, max 1800px wide.** Don't upload JPGs or PNGs through the CMS. If you have images, send them to Eann and he'll process and upload them.

---

## 3. Adding Keywords to an Existing Post

This is the most common thing you'll do in the CMS.

1. Open the CMS at https://indigopalm.co/admin
2. Find the post in the list (use browser search if the list is long)
3. Click to open it
4. Look for the **Keywords** field in the frontmatter panel (left side or top)
5. Add your new keyword(s), one per line
6. Click **Publish**

Done. Changes are live in about 2 minutes. You can verify by checking the post URL and viewing source if you want, but usually just trust it.

---

## 4. Creating a New Blog Post

**Wait for Eann to give you the content first.** Your job here is to paste in finished copy, not draft from scratch.

When Eann hands you a post to publish:

1. Click **New Blog Post**
2. Fill in every required field. Nothing is optional:

| Field | Notes |
|---|---|
| **Title** | 50-60 characters. Eann provides this. |
| **Date** | Today's date in YYYY-MM-DD format. |
| **Meta Description** | 140-155 characters. Eann provides this. |
| **Keywords** | One per line. Eann provides the list. |
| **Hero Image** | Filename only (e.g. `coachella-rental-pool.webp`). Eann provides this after uploading. |
| **Excerpt** | 1-2 sentence teaser for the blog index card. Eann provides this. |
| **Article Section** | Category (e.g. "Travel Tips", "Local Guides"). Eann specifies. |
| **Layout** | Always: `blog-post.njk` — never change this. |

3. Paste the body content into the **Body** field. You can use the rich text editor or switch to Markdown mode (button in the editor toolbar).
4. **Save as Draft, not Publish.** Eann reviews the formatted output before it goes live.
5. Message Eann on Upwork: "Post [title] is in draft, ready for your review."

---

## 5. How to Request a New Blog Post From Eann/Claude

Message Eann on Upwork with these four things:

1. **Topic** — what the post is about
2. **Target keywords** — your primary keyword and 1-2 secondary keywords from Google Trends or Pinterest Trends
3. **Google Trends data** — screenshot or notes if relevant
4. **Angle** — 2-3 bullet points on who this is for and what they'll get from it

**Example message:**

> Blog post idea: Stagecoach 2027 first-timer guide. Keywords: stagecoach 2027 where to stay, stagecoach festival tips. Angle: for people who've never done a country festival, specifically the new Post Malone crowd. What to know about the vibe, what to pack, and why staying in Indio beats Palm Springs.

Claude will write the post. Eann will review, upload images, and tell you when it's in draft and ready for you to publish. Once it's live, you can start pinning.

You do not need to write the post yourself. Your job is to bring the keyword angle and audience insight. Claude handles the copy.

---

## 6. How to Request Keyword Updates

If you spot a trending keyword on Google Trends, Pinterest Trends, or in your Search Console data that fits an existing post, send Eann a quick message:

> "This post [URL] should have this keyword added: [keyword]. Saw it trending on Pinterest Trends / ranking opportunity in Search Console."

**That's all.** Claude will open the markdown file and add it directly. No need for you to log into the CMS for this one unless Eann asks you to.

---

## 7. Property Brand Colors (for Canva / Gemini Pins)

Use these as starting points, but always check Google Drive (Brand folder) for the official swatches and hex codes.

**The Cozy Cactus** — warm desert palette: terracotta, sand, burnt orange, dusty sage. Feels like a family road trip with good taste.

**Terra Luz** — Latin/Cuban palette: deep terracotta, warm whites, rattan textures, bold color moments (cobalt, ochre). Think Old Havana meets Coachella Valley. Not generic boho.

**The Sundune** — Check Google Drive: Brand > Sundune. (Palette being finalized as of April 2026.)

**The Well** — Long-term rental, minimal social presence. Skip for now.

**Quick shortcut:** When in doubt, pull the dominant colors directly from the property's page at indigopalm.co. What's on the website is on-brand.

---

## 8. Pinterest Pin Format Reference

| Pin Type | Dimensions | Ratio |
|---|---|---|
| Standard pin (blog posts, property photos) | 1000 x 1500px | 2:3 |
| Idea pins / video | 1080 x 1920px | 9:16 |

**Always link blog post pins to the indigopalm.co blog URL, not Airbnb.** Once the account hits 25-30K monthly views, all links go through the website. For now, Airbnb links are fine on property pins, but blog posts always point to the site.

When writing pin descriptions: write for search, not for brand announcements. "Where to stay during Stagecoach 2027" lands better than "Check out our amazing rental."

No hashtags. No em dashes.

---

## 9. Image Resources

Images on the website live in two folders:

- **Blog images:** `https://indigopalm.co/blog/images/[filename].webp`
- **Property photos:** `https://indigopalm.co/images/[filename].webp`

You can use these URLs directly in Canva, Pinterest, or anywhere you need a web-hosted image.

To get a full list of available images: message Eann. He can pull the directory and share it. Do not try to browse the site for filenames — the folder isn't publicly indexed.

---

## Quick Reference

| Task | Who does it |
|---|---|
| Add keywords to existing post | You (in CMS) |
| Request a new blog post | You (message Eann on Upwork with topic + keyword + angle) |
| Write the blog post | Claude |
| Upload and process images | Eann |
| Publish the final draft | You (after Eann says it's ready) |
| Start pinning after publish | You |
| Request keyword updates to existing posts | You (message Eann with URL + keyword) |
| Make those keyword edits | Claude |

---

Questions? Message Eann on Upwork. For anything urgent, he's also reachable by text.
