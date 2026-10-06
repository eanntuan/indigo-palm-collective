// Publishes the oldest due post from content/backlog/ (frontmatter date <= today): moves it to content/blog/, adds the index card and sitemap entry.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const dir = path.join(root, "content/backlog");
const today = process.env.TODAY || new Date().toISOString().slice(0, 10);
const fm = (src, k) => {
  const m = src.match(new RegExp("^" + k + ":\\s*(.+)$", "m"));
  return m ? m[1].trim().replace(/^"(.*)"$/s, "$1").replace(/\\"/g, '"') : "";
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const lint = (src) => {
  const body = src.replace(/^---[\s\S]*?---/, "");
  const bad = [];
  const t = fm(src, "title").length, m = fm(src, "metaDescription").length;
  if (t < 50 || t > 60) bad.push("title " + t + " chars");
  if (m < 140 || m > 155) bad.push("meta " + m + " chars");
  if (src.includes("\u2014")) bad.push("em dash");
  if (/\bactually\b/i.test(src)) bad.push("'actually'");
  if (/EANN|TODO|\[\[|placeholder/i.test(src)) bad.push("placeholder text");
  const imgs = body.match(/<img /g) || [];
  if (imgs.length < 5) bad.push(imgs.length + " images (need 5)");
  (src.match(/src="(\/blog\/images\/[^"]+)"/g) || []).forEach((x) => {
    const f = x.slice(5, -1);
    if (!fs.existsSync(path.join(root, "blog/images", path.basename(f)))) bad.push("missing image " + f);
  });
  if ((body.match(/\]\(\/(blog|terra-luz|cozy-cactus|the-sundune)\/|href="\/(blog|terra-luz|cozy-cactus|the-sundune)\//g) || []).length < 2) bad.push("under 2 internal links");
  if (!/<h3>[^<]*\?/.test(body) && !/^### .*\?/m.test(body)) bad.push("no FAQ questions");
  return bad;
};
const all = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
if (process.argv.includes("--check")) {
  all.forEach((f) => { const b = lint(fs.readFileSync(path.join(dir, f), "utf8")); console.log((b.length ? "FAIL " : "ok   ") + f + (b.length ? ": " + b.join("; ") : "")); });
  process.exit(0);
}
const due = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => ({ f, src: fs.readFileSync(path.join(dir, f), "utf8") }))
      .filter((p) => fm(p.src, "date") <= today).sort((a, b) => fm(a.src, "date").localeCompare(fm(b.src, "date")))
  : [];
const post = due.find((p) => !p.src.includes("—"));
if (!post) { console.log(due.length ? "Due posts contain em dashes, skipped" : "Nothing due"); process.exit(0); }

const slug = post.f.replace(/\.md$/, "");
const date = fm(post.src, "date");
const pretty = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const card = `                <!-- ${esc(fm(post.src, "title"))} -->
                <article class="blog-card">
                    <div class="blog-card-image"><img src="${fm(post.src, "heroImage")}" alt="${fm(post.src, "heroAlt").replace(/"/g, "&quot;")}" width="600" height="400" loading="lazy"></div>
                    <div class="blog-card-content">
                        <span class="post-category">${fm(post.src, "articleSection")}</span>
                        <h3>${esc(fm(post.src, "title"))}</h3>
                        <div class="post-meta">${pretty} · ${fm(post.src, "readTime")}</div>
                        <p class="post-excerpt">${esc(fm(post.src, "excerpt"))}</p>
                        <a href="/blog/${slug}/" class="read-more">Read More</a>
                    </div>
                </article>
`;
const idxPath = path.join(root, "blog/index.html");
let idx = fs.readFileSync(idxPath, "utf8");
let at = idx.lastIndexOf("\n", idx.indexOf('<article class="blog-card">')) + 1;
const prev = idx.lastIndexOf("\n", at - 2) + 1;
if (idx.slice(prev, at).trim().startsWith("<!--")) at = prev;
fs.writeFileSync(idxPath, idx.slice(0, at) + card + idx.slice(at));

const smPath = path.join(root, "sitemap.xml");
fs.writeFileSync(smPath, fs.readFileSync(smPath, "utf8").replace("</urlset>",
  `  <url>\n    <loc>https://indigopalm.co/blog/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`));
fs.renameSync(path.join(dir, post.f), path.join(root, "content/blog", post.f));
console.log("Published " + slug);
