# Blog Directory Structure

## Purpose
This directory contains all blog post HTML files and supporting assets for the Indigo Palm Collective blog.

## Structure

```
blog/
├── README.md (this file)
├── COZY_CACTUS_STORY_BRIEF.md (brief for first blog post)
├── images/ (blog post images)
│   ├── cozy-cactus-story-hero.jpg
│   ├── indio-local-gems.jpg
│   └── coachella-house-vs-camping.jpg
├── cozy-cactus-story.html (First blog post - IN PROGRESS)
├── indio-local-gems.html (Coming Week 2)
└── coachella-house-rental.html (Coming Week 3)
```

## Blog Post File Naming Convention

- Use lowercase-hyphen format: `post-title-here.html`
- Match the slug in BLOG_STRATEGY.md
- Keep URLs short and keyword-focused

## Image Requirements

- **Hero images:** 1200x600px minimum (2:1 ratio)
- **Blog card thumbnails:** 800x500px minimum
- **In-post images:** 1000px wide minimum
- **Format:** JPG (optimized for web, <200KB per image)
- **Alt text:** Always include descriptive alt text with target keyword

## Blog Post Template

Use `/indigopalm/blog-post-template.html` as the starting point for all new posts.

## Publishing Checklist

Before publishing a new blog post:

- [ ] SEO meta tags complete (title, description, keywords)
- [ ] Hero image added and optimized
- [ ] Internal links to property pages (2-3 minimum)
- [ ] External links to authoritative sources (1-2)
- [ ] Alt text on all images
- [ ] CTA box with relevant property link
- [ ] Related posts section (3 suggestions)
- [ ] Add new post card to `/blog.html` grid
- [ ] Update featured post on `/blog.html` if newest
- [ ] Test mobile responsiveness
- [ ] Run through SEO checklist (BLOG_STRATEGY.md)

## Content-Writer Notes

When writing blog posts:
1. Read the brief in this directory first
2. Follow voice guidelines from BLOG_STRATEGY.md
3. Use blog-post-template.html for structure
4. Deliver as markdown first for review
5. Convert to HTML after approval
6. Add to blog.html grid

---

**Blog Launch:** March 2026
**Editorial Calendar:** See `/indigopalm/BLOG_STRATEGY.md`
