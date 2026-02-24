# Page Speed Optimization Recommendations - Indigo Palm Collective

## Executive Summary

This document outlines performance optimization opportunities for the Indigo Palm Collective website. Based on analysis of index.html and property pages (cozy-cactus.html, terra-luz.html, ps-retreat.html, the-well.html), the primary bottlenecks are large unoptimized images, render-blocking resources, and missing lazy loading implementation.

**Priority Level Key:**
- 🔴 High Priority (Immediate impact)
- 🟡 Medium Priority (Moderate impact)
- 🟢 Low Priority (Nice to have)

---

## 1. Image Optimization 🔴 HIGH PRIORITY

### Current Issues:
- Gallery images range from 300KB to 841KB each
- Many pages load 40-80+ images simultaneously
- Images are loaded in full resolution even when displayed at smaller sizes
- No responsive image strategy (srcset)
- OG image (og-image.jpg) is 721KB

### Recommendations:

#### A. Compress All Images
**Action:** Use image compression tools to reduce file sizes by 60-80% without visible quality loss.

**Tools to use:**
- TinyPNG/TinyJPG for batch compression
- ImageOptim (Mac) or Squoosh (web-based)
- Cloudflare Images or Imgix for automatic optimization

**Target sizes:**
- Hero images: < 200KB
- Gallery thumbnails: < 100KB
- OG/social images: < 150KB
- Icons: < 20KB

**Files needing compression:**
```
Priority files:
- og-image.jpg (721KB → target 150KB)
- Screenshot files (2.3MB, 313KB, 252KB, etc.) - consider removing if unused
- All Cozy Cactus gallery images (300-841KB each)
- Terra Luz gallery images
- PS Retreat gallery images
- The Well gallery images
```

#### B. Implement Next-Gen Image Formats
**Action:** Convert images to WebP format with JPG fallbacks.

**Implementation:**
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description">
</picture>
```

**Benefits:**
- WebP images are 25-35% smaller than JPG
- Supported by 95%+ of browsers
- Automatic fallback for older browsers

#### C. Implement Responsive Images
**Action:** Create multiple image sizes for different viewport widths.

**Implementation:**
```html
<img
  src="image-800w.jpg"
  srcset="image-400w.jpg 400w,
          image-800w.jpg 800w,
          image-1200w.jpg 1200w"
  sizes="(max-width: 600px) 400px,
         (max-width: 1000px) 800px,
         1200px"
  alt="Description">
```

**Recommended image widths:**
- Mobile: 400px, 600px
- Tablet: 800px, 1000px
- Desktop: 1200px, 1600px

---

## 2. Lazy Loading Implementation 🔴 HIGH PRIORITY

### Current Issues:
- All gallery images load on page load
- Cozy Cactus page loads 100+ images immediately
- Below-the-fold images block initial render

### Recommendations:

#### A. Native Lazy Loading
**Action:** Add `loading="lazy"` attribute to all below-the-fold images.

**Implementation:**
```html
<!-- Hero image - load immediately -->
<img src="hero.jpg" alt="Hero" loading="eager">

<!-- Gallery images - load when visible -->
<img src="gallery-1.jpg" alt="Gallery" loading="lazy">
```

**Apply to:**
- All gallery section images
- Footer images
- Any images below the first viewport

#### B. Lazy Load Background Images
**Action:** Use Intersection Observer API for CSS background images.

**Current issue:** Gallery items use CSS background-images that load immediately.

**Recommended approach:**
```javascript
// Add to existing script
const galleryObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.style.backgroundImage = `url('${img.dataset.src}')`;
      galleryObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('.gallery-item').forEach(item => {
  galleryObserver.observe(item);
});
```

**HTML changes:**
```html
<!-- Old -->
<div class="gallery-item" style="background-image: url('large-image.jpg');"></div>

<!-- New -->
<div class="gallery-item" data-src="large-image.jpg"></div>
```

---

## 3. Render-Blocking Resources 🟡 MEDIUM PRIORITY

### Current Issues:
- Google Fonts CSS blocks rendering
- Multiple synchronous script tags
- Large inline CSS in `<style>` tags

### Recommendations:

#### A. Optimize Google Fonts Loading
**Current implementation:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

**Recommended implementation:**
```html
<!-- Option 1: Preload + async -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Work+Sans:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Work+Sans:wght@300;400;500;600&display=swap" media="print" onload="this.media='all'">

<!-- Option 2: Self-host fonts (best performance) -->
<!-- Download font files and serve from /fonts/ directory -->
```

**Font display strategy:**
```css
@font-face {
  font-family: 'Cormorant Garamond';
  font-display: swap; /* Already set via display=swap in URL */
}
```

#### B. Extract Critical CSS
**Action:** Inline critical above-the-fold CSS, defer the rest.

**Implementation approach:**
1. Identify critical CSS (styles for hero, nav, first viewport)
2. Inline in `<style>` tag in `<head>`
3. Move non-critical CSS to external file
4. Load external CSS asynchronously

**Example structure:**
```html
<head>
  <!-- Critical CSS inline -->
  <style>
    /* Nav, hero, first viewport only */
    nav { ... }
    .hero { ... }
  </style>

  <!-- Non-critical CSS deferred -->
  <link rel="preload" as="style" href="styles.css">
  <link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">
</head>
```

#### C. Defer Non-Critical JavaScript
**Action:** Add `defer` or `async` attributes to scripts that don't affect initial render.

**Current:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-LCY4M0HEQB"></script>
```
✅ Already using `async` - good!

**For any future scripts:**
- Use `defer` for scripts that need to run in order
- Use `async` for independent scripts (analytics, etc.)

---

## 4. Asset Delivery Optimization 🟡 MEDIUM PRIORITY

### Recommendations:

#### A. Implement Content Delivery Network (CDN)
**Action:** Serve images through a CDN for faster global delivery.

**Options:**
- **Cloudflare CDN** (free tier available)
  - Automatic image optimization
  - Global edge caching
  - Easy setup with existing domain

- **Cloudinary** (free tier: 25GB storage, 25GB bandwidth)
  - Image transformations on-the-fly
  - Automatic format conversion
  - Responsive image URLs

- **Imgix** (paid, but powerful)
  - Real-time image processing
  - Automatic optimization
  - Advanced CDN features

**Implementation example (Cloudflare):**
```
Original: https://indigopalm.co/Cozy%20Cactus/image.jpg
CDN: https://indigopalm.co/cdn-cgi/image/width=800,quality=80/Cozy%20Cactus/image.jpg
```

#### B. Enable Browser Caching
**Action:** Set cache headers for static assets.

**Add to server config or .htaccess:**
```apache
# Cache images for 1 year
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Cache CSS/JS for 1 week
<FilesMatch "\.(css|js)$">
  Header set Cache-Control "max-age=604800, public"
</FilesMatch>

# Cache fonts for 1 year
<FilesMatch "\.(woff|woff2|ttf|eot)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

**For Firebase Hosting (firebase.json):**
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

#### C. Enable Compression
**Action:** Ensure GZIP/Brotli compression is enabled for text assets.

**Check if enabled:** Already enabled on most modern hosting (Firebase, Netlify, Cloudflare)

**To verify:** Check response headers for `Content-Encoding: gzip` or `Content-Encoding: br`

---

## 5. HTML Optimization 🟢 LOW PRIORITY

### Recommendations:

#### A. Minimize DOM Size
**Current status:** Gallery pages have 100+ DOM elements from images.

**Action:** Implement virtual scrolling or pagination for galleries with 40+ images.

**Options:**
1. **Pagination:** Show 12-20 images per page with "Load More" button
2. **Virtual scrolling:** Only render visible images
3. **Lightbox approach:** Show thumbnails, load full images on click

#### B. Preload Critical Assets
**Action:** Add resource hints for critical assets.

**Implementation:**
```html
<head>
  <!-- Preload hero image -->
  <link rel="preload" as="image" href="hero-image.jpg">

  <!-- Preload critical font -->
  <link rel="preload" as="font" href="fonts/font.woff2" type="font/woff2" crossorigin>

  <!-- DNS prefetch for external domains -->
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
</head>
```

#### C. Optimize Schema.org JSON-LD
**Current status:** Schema markup recently added (good!)

**Action:** Minify JSON-LD to reduce HTML size (minor impact).

**Example:**
```html
<!-- Current: formatted with spaces and newlines -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Hotel"
}
</script>

<!-- Optimized: minified -->
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Hotel"}</script>
```

---

## 6. Performance Monitoring 🟡 MEDIUM PRIORITY

### Recommendations:

#### A. Set Up Performance Monitoring
**Tools to implement:**

1. **Google PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - Test all pages monthly
   - Target: Score 90+ (mobile and desktop)

2. **GTmetrix**
   - URL: https://gtmetrix.com/
   - Detailed waterfall analysis
   - Historical tracking

3. **WebPageTest**
   - URL: https://www.webpagetest.org/
   - Advanced testing options
   - Multiple locations/devices

#### B. Core Web Vitals Targets
**Track these metrics:**
- **LCP (Largest Contentful Paint):** < 2.5s (hero image)
- **FID (First Input Delay):** < 100ms (interactivity)
- **CLS (Cumulative Layout Shift):** < 0.1 (visual stability)

**Current risks:**
- LCP: Likely slow due to large hero images
- CLS: Gallery images without dimensions can cause layout shifts

**Fixes:**
```html
<!-- Add width/height to prevent CLS -->
<img src="image.jpg" width="800" height="600" alt="Description">

<!-- Or use aspect-ratio CSS -->
<style>
.gallery-item {
  aspect-ratio: 3 / 2;
}
</style>
```

---

## 7. Implementation Priority Roadmap

### Phase 1: Quick Wins (1-2 days)
1. ✅ Add `loading="lazy"` to all gallery images
2. ✅ Compress og-image.jpg and other large images in root
3. ✅ Add width/height attributes to images to prevent CLS
4. ✅ Remove unused screenshot files

### Phase 2: Image Optimization (1 week)
1. Batch compress all Cozy Cactus images
2. Batch compress Terra Luz, PS Retreat, The Well images
3. Convert hero images to WebP with JPG fallback
4. Implement responsive image sizes (srcset)

### Phase 3: Advanced Optimization (2-3 weeks)
1. Set up CDN (Cloudflare recommended)
2. Implement lazy loading for background images
3. Self-host Google Fonts
4. Extract and inline critical CSS
5. Implement image pagination or "Load More" for galleries

### Phase 4: Ongoing Monitoring
1. Set up monthly PageSpeed Insights testing
2. Monitor Core Web Vitals in Google Search Console
3. Track performance regressions
4. Optimize new images before upload

---

## 8. Tools & Resources

### Image Compression Tools:
- **TinyPNG:** https://tinypng.com/ (batch compression)
- **Squoosh:** https://squoosh.app/ (advanced options)
- **ImageOptim:** https://imageoptim.com/ (Mac app)
- **Sharp:** https://sharp.pixelplumbing.com/ (Node.js automation)

### CDN Services:
- **Cloudflare:** https://www.cloudflare.com/
- **Cloudinary:** https://cloudinary.com/
- **Imgix:** https://imgix.com/

### Testing Tools:
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **GTmetrix:** https://gtmetrix.com/
- **WebPageTest:** https://www.webpagetest.org/
- **Chrome DevTools Lighthouse:** Built into Chrome

### Learning Resources:
- Google Web.dev Performance Guide: https://web.dev/performance/
- MDN Web Performance: https://developer.mozilla.org/en-US/docs/Web/Performance
- Lazy Loading Images: https://web.dev/lazy-loading-images/

---

## 9. Expected Performance Improvements

### Before Optimization (Estimated):
- **Page Load Time:** 5-8 seconds (mobile)
- **Total Page Size:** 15-30 MB (gallery pages)
- **Number of Requests:** 100+ (gallery pages)
- **LCP:** 4-6 seconds
- **PageSpeed Score:** 40-60 (mobile), 70-80 (desktop)

### After Full Optimization (Target):
- **Page Load Time:** 1.5-3 seconds (mobile)
- **Total Page Size:** 2-5 MB (gallery pages)
- **Number of Requests:** 30-50 (with lazy loading)
- **LCP:** 1.5-2.5 seconds
- **PageSpeed Score:** 85-95 (mobile), 95-100 (desktop)

**Estimated improvements:**
- 60-70% reduction in page size
- 50-60% faster load time
- 40-50 point increase in PageSpeed score
- Better SEO rankings (Google uses page speed as ranking factor)
- Improved mobile user experience
- Reduced bounce rate

---

## 10. Specific File Recommendations

### Files to Compress Immediately:
```
Priority 1 (Root directory):
- og-image.jpg: 721KB → 150KB (79% reduction)

Priority 2 (Cozy Cactus):
- 13TW_4W6A8478 V2web.jpg: 841KB → 200KB
- 12TW_4W6A8617web.jpg: 671KB → 180KB
- 16TW_4W6A8430 V2web.jpg: 616KB → 170KB
- 1TW_DZ5A8774web.jpg: 564KB → 150KB
- 15TW_DZ5A8612web.jpg: 567KB → 150KB

Priority 3 (Terra Luz, PS Retreat, The Well):
- Compress all gallery images to < 200KB each
```

### Files to Remove (if unused):
```
- Screenshot 2026-01-10 at 10.25.51 PM.png: 2.3MB (unused)
- redirectURI.png: 313KB (development file?)
- Screenshot files: 252KB, 188KB, 102KB (development files?)
- PNG image.png: 119KB (unclear purpose)
```

---

## 11. Code Snippets for Implementation

### A. Lazy Loading Script (Add to all property pages)
```html
<script>
// Lazy load gallery background images
document.addEventListener('DOMContentLoaded', function() {
  const galleryItems = document.querySelectorAll('.gallery-item[data-bg]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.style.backgroundImage = `url('${img.dataset.bg}')`;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px' // Start loading 50px before visible
    });

    galleryItems.forEach(item => imageObserver.observe(item));
  } else {
    // Fallback for older browsers
    galleryItems.forEach(item => {
      item.style.backgroundImage = `url('${item.dataset.bg}')`;
    });
  }
});
</script>
```

### B. WebP Detection and Fallback
```html
<script>
// Detect WebP support
function supportsWebP() {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

// Add class to html element
if (supportsWebP()) {
  document.documentElement.classList.add('webp');
} else {
  document.documentElement.classList.add('no-webp');
}
</script>

<style>
/* Use WebP when supported */
.webp .gallery-item[data-bg-webp] {
  background-image: url(attr(data-bg-webp));
}

/* Fallback to JPG */
.no-webp .gallery-item[data-bg-jpg] {
  background-image: url(attr(data-bg-jpg));
}
</style>
```

---

## Next Steps

1. **Review this document** with development team
2. **Prioritize Phase 1** quick wins for immediate impact
3. **Test one page fully** before rolling out to all pages
4. **Measure before/after** using PageSpeed Insights
5. **Document results** and adjust approach as needed
6. **Implement monitoring** to maintain performance over time

---

**Document prepared:** February 16, 2026
**Website:** https://indigopalm.co
**For questions:** Contact development team
