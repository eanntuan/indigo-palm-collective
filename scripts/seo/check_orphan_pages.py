#!/usr/bin/env python3
"""Orphan-page detector for indigopalm.co.

Cross-references sitemap.xml against the internal link graph built from every
page's rendered HTML (blog posts are pre-built by Eleventy, so their shared
nav/footer/CTA layout is already baked into blog/[slug]/index.html -- no need
to parse _layouts/blog-post.njk separately). Flags sitemap pages with zero
inbound internal links (HIGH) or exactly one (LOW, weakly linked).

Read-only. Usage: python3 check_orphan_pages.py [--root PATH] [--output FILE]
"""
import argparse
import os
import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

SITE = "https://indigopalm.co"
DEFAULT_ROOT = os.environ.get("SITE_ROOT") or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKIP_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".pdf", ".ico",
            ".xml", ".json", ".css", ".js", ".txt"}


def url_to_path(url):
    """Sitemap <loc> -> normalized path, e.g. https://indigopalm.co/terra-luz/ -> /terra-luz/"""
    path = urlparse(url).path or "/"
    if not path.endswith("/") and not os.path.splitext(path)[1]:
        path += "/"
    return path


def path_to_file(root, path):
    rel = path.strip("/")
    return os.path.join(root, rel, "index.html") if rel else os.path.join(root, "index.html")


def normalize_href(href, current_path):
    """Resolve an <a href> (absolute, relative, or fully-qualified) to a sitemap-style path, or None."""
    href = href.strip()
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    if href.startswith("http") and not href.startswith(SITE):
        return None  # external domain
    if href.startswith(SITE):
        href = href[len(SITE):] or "/"
    if not href.startswith("/"):
        href = urljoin(current_path, href)
    href = href.split("#", 1)[0].split("?", 1)[0]
    if not href:
        return None
    if os.path.splitext(href)[1].lower() in SKIP_EXT:
        return None
    if href.endswith("/index.html"):
        href = href[: -len("index.html")]
    if not href.startswith("/"):
        href = "/" + href
    if href != "/" and not href.endswith("/") and not os.path.splitext(href)[1]:
        href += "/"
    return href


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=DEFAULT_ROOT, help="site repo root (default: this repo)")
    ap.add_argument("--output", help="write markdown report to file instead of stdout")
    args = ap.parse_args()

    with open(os.path.join(args.root, "sitemap.xml"), encoding="utf-8") as f:
        sitemap_urls = re.findall(r"<loc>([^<]+)</loc>", f.read())
    sitemap_paths = [url_to_path(u) for u in sitemap_urls]

    inbound = {p: 0 for p in sitemap_paths}
    unreadable = []

    for path in sitemap_paths:
        fpath = path_to_file(args.root, path)
        if not os.path.isfile(fpath):
            unreadable.append(path)
            continue
        with open(fpath, encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
        for a in soup.find_all("a", href=True):
            target = normalize_href(a["href"], path)
            if target and target != path and target in inbound:
                inbound[target] += 1

    orphaned = sorted(p for p, c in inbound.items() if c == 0)
    weak = sorted(p for p, c in inbound.items() if c == 1)

    lines = [
        "# Orphan Page Report — indigopalm.co", "",
        f"## HIGH — Orphaned pages, zero inbound internal links ({len(orphaned)})", "",
    ]
    lines += [f"- {SITE}{p}" for p in orphaned] or ["None found."]
    lines += ["", f"## LOW — Weakly linked pages, exactly 1 inbound link ({len(weak)})", ""]
    lines += [f"- {SITE}{p}" for p in weak] or ["None found."]
    if unreadable:
        lines += ["", f"## Note: {len(unreadable)} sitemap URL(s) had no matching local file, skipped:"]
        lines += [f"- {SITE}{p}" for p in unreadable]
    lines += ["", f"**Summary:** {len(sitemap_paths)} total sitemap pages checked, "
                   f"{len(orphaned)} orphaned, {len(weak)} weakly linked."]

    report = "\n".join(lines)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"Report written to {args.output}")
    else:
        print(report)


if __name__ == "__main__":
    main()
