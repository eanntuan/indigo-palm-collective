#!/usr/bin/env node
// Fails the build if sitemap.xml lists a blog post whose frontmatter is
// a redirectTo stub. This recurred 3 times (2026-07-27, 08-23, 09-16) after
// merge conflicts silently re-added these entries.
const fs = require("fs");
const path = require("path");

const blogDir = path.join(__dirname, "..", "content", "blog");
const sitemapPath = path.join(__dirname, "..", "sitemap.xml");

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const redirectSlugs = [];

for (const file of fs.readdirSync(blogDir)) {
  if (!file.endsWith(".md")) continue;
  const content = fs.readFileSync(path.join(blogDir, file), "utf8");
  if (/^redirectTo:/m.test(content)) {
    redirectSlugs.push(file.replace(/\.md$/, ""));
  }
}

const offenders = redirectSlugs.filter((slug) =>
  sitemap.includes(`/blog/${slug}/`)
);

if (offenders.length > 0) {
  console.error(
    "sitemap.xml contains redirect-stub pages (layout: redirect.njk):"
  );
  for (const slug of offenders) console.error(`  - /blog/${slug}/`);
  console.error(
    "Remove these <url> entries from sitemap.xml before deploying — they trigger a recurring GSC 'Page with redirect' coverage alert."
  );
  process.exit(1);
}

console.log(`sitemap check passed (${redirectSlugs.length} redirect stub(s) correctly excluded)`);
