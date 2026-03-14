# Indigo Palm Collective — Claude Instructions

## Working Style
- **Never ask for permission before taking action.** Just do it. Assume yes on deploys, file edits, commits, and pushes.
- If something is ambiguous, make a reasonable decision and report what you did.

## Site Context
- **Host**: Eann Tuan
- **Brand**: Indigo Palm Collective (indigopalm.co)
- **Properties**: The Cozy Cactus (family-focused, sleeps 8, Indio CA, near Coachella), Casa Moto (pet-friendly, bohemian, Latin/Cuban-inspired, Indio CA), The Sundune at Palm Springs (coastal desert, coming soon)
- **Git remote**: git@github.com:eanntuan/desert-edit-properties.git
- **Deploy**: Cloudflare Pages — push to main to deploy

## Writing Rules (apply to ALL copy — blog posts, newsletters, page copy, captions, alt text, everything)

### No em dashes
Never use em dashes (—) in any writing. Replace with a period, comma, colon, or rewrite the sentence. Before finalizing any file, scan for — and remove every one.

### Brand Voice
- First-person, specific, honest, a little self-deprecating
- Reads like a smart friend sharing what actually happened
- No hollow adjectives. Replace "great" with the specific detail that makes it great.
- Short paragraphs: 2-4 sentences max. White space is good.
- No buzzwords: "luxury," "curated experience," "world-class" — unless used ironically.
- Specific and visual: "hot tub under desert stars" not "relaxing amenities"

## Blog Post Rules (apply every time a blog post is written or edited)

### Images — required in every post
- Minimum 3-5 images placed throughout the body, not just at the top.
- Place images after the section they illustrate.
- Check `blog/images/` for existing photos first.
- If no matching image exists, add: `<!-- IMAGE NEEDED: [specific description of what photo works here] -->`
- Every `<img>` tag must have:
  - `alt` text: descriptive, specific, includes location. No em dashes in alt text — use commas instead.
  - `loading="lazy"`
  - `width` and `height` attributes
- Add `<p class="image-caption">` after each image. One sentence, specific, matches the voice. No em dashes.
- Set `og:image` to the hero/first image of the post.

### SEO — required on every post
- **Title tag**: 50-60 characters. Lead with primary keyword.
- **Meta description**: 140-155 characters. Primary keyword + secondary keyword + soft CTA. No em dashes.
- **URL slug**: lowercase, hyphenated, keyword-first (e.g. `things-to-do-indio-coachella.html`)
- **H1**: One per page, matches title tag keyword intent.
- **H2/H3**: Use keyword variants naturally. Every major section gets a heading.
- **Internal links**: Every post links to at least 2 other posts or property pages. Descriptive anchor text, not "click here."
- **JSON-LD BlogPosting schema**: Required. Fill: headline, description, datePublished, dateModified, author, publisher, image, url, keywords.
- **BreadcrumbList schema**: Required. Format: Home > Blog > [Post Title]
- **Canonical URL**: Must match the exact published URL.
- **og:image**: Must be set to the hero image.
- **Primary keyword**: In H1, first paragraph, at least one H2, and meta description.
- **Word count**: 800-1500 words for most posts. Local guides can go longer.

### Blog Post Pipeline
1. Confirm topic/angle and target keyword
2. Write copy (no em dashes, short paragraphs, specific details)
3. Build HTML from `blog-post-template.html` with all meta tags, schemas, images
4. Update `blog.html` with new post card
5. Update `sitemap.xml` with new URL entry (lastmod = today)
6. Generate Pinterest pins (output after the HTML, before deploying):
   - **3-5 pins per post**, each targeting a different angle or section of the post
   - Format for each pin:
     ```
     PIN [n]: [suggested image description or filename]
     Title: [40-60 chars, lead with keyword, headline case]
     Description: [150-300 chars, keywords woven naturally, soft CTA, ends with full post URL]
     Link: [full URL]
     ```
   - Pinterest is a search engine. Write for how people search, not how brands talk.
   - Speak to the desire/problem ("where to stay near Coachella" not "check out our rental")
   - No em dashes. No hashtags.
7. Deploy: `git add [files] && git commit -m "Add blog post: [title]" && git push origin main`

## SEO Standards (apply to all pages, not just blog posts)
- Every page needs a unique title (50-60 chars) and meta description (140-155 chars)
- No em dashes in any meta tags
- All `<img>` tags need `alt`, `loading="lazy"`, `width`, `height`
- Canonical URLs must be consistent (match sitemap format)
- `og:image` must be set on every page

## Key URLs
- Cozy Cactus: https://indigopalm.co/cozy-cactus
- Casa Moto: https://indigopalm.co/casa-moto
- Blog: https://indigopalm.co/blog
- Sitemap: https://indigopalm.co/sitemap.xml

## Keywords to weave in naturally
- Coachella vacation rental / Coachella Valley rental
- Indio Airbnb / vacation rental Indio CA
- Family vacation rental / pet-friendly vacation rental
- Near Coachella festival / Coachella 2026
- Desert vacation home
