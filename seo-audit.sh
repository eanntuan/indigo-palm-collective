#!/usr/bin/env bash
# Indigo Palm SEO Daily Audit
# Runs checks on all blog posts and property pages, fixes what it can, commits + pushes.
# Logs to ~/airbnb/indigopalm/seo-audit.log

set -euo pipefail

REPO="$HOME/airbnb/indigopalm"
LOG="$REPO/seo-audit.log"
TODAY=$(date +%Y-%m-%d)
FIXES=0

log() {
  echo "[$TODAY] $1" | tee -a "$LOG"
}

cd "$REPO"

# Pull latest before making any changes
git stash 2>/dev/null || true
git pull --rebase 2>/dev/null || true
git stash pop 2>/dev/null || true

log "--- SEO audit start ---"

# ─────────────────────────────────────────────
# 1. SITEMAP: add any missing blog posts
# ─────────────────────────────────────────────
SITEMAP="$REPO/sitemap.xml"
BLOG_DIR="$REPO/content/blog"

for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  url="https://indigopalm.co/blog/${slug}/"
  if ! grep -q "$url" "$SITEMAP"; then
    log "SITEMAP: adding missing entry — $slug"
    sed -i '' "s|</urlset>|  <url>\n    <loc>${url}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>|" "$SITEMAP"
    FIXES=$((FIXES + 1))
  fi
done

# ─────────────────────────────────────────────
# 2. META DESCRIPTIONS: flag out-of-range (120–155 chars)
# ─────────────────────────────────────────────
for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  desc=$(grep "^metaDescription:" "$md" | sed 's/^metaDescription: *"//' | sed 's/"$//' | sed "s/^metaDescription: *'//; s/'$//")
  if [ -n "$desc" ]; then
    len=${#desc}
    if [ "$len" -lt 120 ]; then
      log "META TOO SHORT ($len chars): $slug"
    elif [ "$len" -gt 155 ]; then
      log "META TOO LONG ($len chars): $slug"
    fi
  else
    log "META MISSING: $slug"
  fi
done

# ─────────────────────────────────────────────
# 3. TITLE TAGS: flag blog post titles over 60 chars
# (blog-post.njk appends " | Indigo Palm" = +14 chars, so raw title max = 46)
# ─────────────────────────────────────────────
for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  raw_title=$(grep "^title:" "$md" | head -1 | sed 's/^title: *//' | sed 's/^"//; s/"$//' | sed "s/^'//; s/'$//")
  if [ -n "$raw_title" ]; then
    # Full rendered title = raw + " | Indigo Palm" (14 chars)
    full_len=$(( ${#raw_title} + 14 ))
    if [ "$full_len" -gt 70 ]; then
      log "TITLE TOO LONG (${full_len} chars rendered): $slug — \"$raw_title\""
    fi
  fi
done

# ─────────────────────────────────────────────
# 4. PROPERTY LINKS: flag posts with no link to any property page
# ─────────────────────────────────────────────
PROPERTY_PATTERN="/cozy-cactus/\|/terra-luz/\|/the-sundune/\|/the-well/"
for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  if ! grep -q "$PROPERTY_PATTERN" "$md"; then
    log "NO PROPERTY LINK: $slug"
  fi
done

# ─────────────────────────────────────────────
# 5. IMAGES MISSING ALT TEXT in blog posts
# ─────────────────────────────────────────────
for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  if grep -q '<img ' "$md" 2>/dev/null; then
    count=$(grep -c '<img [^>]*>' "$md" 2>/dev/null || echo 0)
    missing=$(grep '<img [^>]*>' "$md" | grep -v 'alt=' | wc -l | tr -d ' ')
    if [ "$missing" -gt 0 ]; then
      log "MISSING ALT ($missing of $count imgs): $slug"
    fi
  fi
done

# ─────────────────────────────────────────────
# 6. dateModified: update on any .md modified today
# ─────────────────────────────────────────────
for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  # Check if file was modified today (git diff vs last commit)
  if git diff --name-only HEAD -- "content/blog/$(basename $md)" 2>/dev/null | grep -q "$(basename $md)"; then
    if grep -q "^dateModified:" "$md"; then
      current_date=$(grep "^dateModified:" "$md" | sed 's/dateModified: *//')
      if [ "$current_date" != "$TODAY" ]; then
        log "UPDATING dateModified: $slug ($current_date → $TODAY)"
        sed -i '' "s/^dateModified:.*/dateModified: $TODAY/" "$md"
        FIXES=$((FIXES + 1))
      fi
    fi
  fi
done

# ─────────────────────────────────────────────
# 7. JSON-LD dateModified: keep in sync with frontmatter
# ─────────────────────────────────────────────
for md in "$BLOG_DIR"/*.md; do
  slug=$(basename "$md" .md)
  fm_date=$(grep "^dateModified:" "$md" 2>/dev/null | sed 's/dateModified: *//' || true)
  if [ -n "$fm_date" ]; then
    jsonld_date=$(grep '"dateModified"' "$md" 2>/dev/null | sed 's/.*"dateModified": *"//; s/".*//' || true)
    if [ -n "$jsonld_date" ] && [ "$jsonld_date" != "$fm_date" ]; then
      log "JSON-LD dateModified mismatch ($jsonld_date vs $fm_date): $slug — fixing"
      sed -i '' "s/\"dateModified\": \"${jsonld_date}\"/\"dateModified\": \"${fm_date}\"/" "$md"
      FIXES=$((FIXES + 1))
    fi
  fi
done

# ─────────────────────────────────────────────
# Commit and push if anything was auto-fixed
# ─────────────────────────────────────────────
if [ "$FIXES" -gt 0 ]; then
  git add -A
  git commit -m "chore: daily SEO audit auto-fixes ($TODAY, $FIXES changes)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  git push
  log "Committed and pushed $FIXES fix(es)"
else
  log "No auto-fixes needed"
fi

log "--- SEO audit complete ---"
