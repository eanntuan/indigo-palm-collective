#!/usr/bin/env python3
"""
Audit <img> alt-text and SEO attribute coverage across indigopalm.co:
every canonical page in sitemap.xml (property/static pages + every blog post).

Checks per <img>: alt present & non-empty, alt isn't a filename, width+height
present, loading="lazy" present (skipped for the first 2 images on a page and
for hero/banner images, which can reasonably skip lazy-loading). Decorative
icons (small dimensions, icon-ish filename, role="presentation") are excluded
from alt/lazy checks so they don't get flagged for a deliberately empty alt.

Read-only: fetches live pages over HTTP, never touches the repo.

Usage:
    python3 check_alt_text.py [--pages terra-luz,blog] [--output /path/report.md]

--pages takes comma-separated substrings to filter the sitemap URL list
(e.g. "terra-luz,blog/best-" scans terra-luz/ plus matching blog posts).
Omit it to scan the full sitemap.
"""

import argparse
import re
import sys
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

BASE = "https://indigopalm.co"
SITEMAP_URL = f"{BASE}/sitemap.xml"
UA = "IndigoPalmAltTextAudit/1.0 (+https://indigopalm.co)"
TIMEOUT = 15

ICON_HINTS = re.compile(
    r"(icon|sprite|favicon|chevron|arrow-?(up|down|left|right)|bullet|divider|"
    r"spacer|badge|star-?rating|social-|logo-mark|avatar|payment-|card-brand)",
    re.I,
)
FILENAME_ALT_RE = re.compile(
    r"^(img|dsc|dscn|image|photo|screenshot|screen shot)[\s_-]?\d+|"
    r"\.(jpe?g|png|webp|gif|avif)$|^\d{3,}$",
    re.I,
)
HERO_HINT = re.compile(r"(hero|banner|cover)", re.I)


def fetch(url):
    r = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def get_page_urls(page_filter=None):
    urls = re.findall(r"<loc>\s*(.*?)\s*</loc>", fetch(SITEMAP_URL))
    if page_filter:
        needles = [p.strip().lower() for p in page_filter.split(",") if p.strip()]
        urls = [u for u in urls if any(n in u.lower() for n in needles)]
    return urls


def basename_and_stem(src):
    name = src.rsplit("/", 1)[-1].split("?")[0]
    return name, re.sub(r"\.[a-zA-Z0-9]+$", "", name)


def normalize(s):
    return re.sub(r"[\s_-]+", "", s).lower()


def is_decorative(img, src, alt):
    if ICON_HINTS.search(src) or ICON_HINTS.search(alt):
        return True
    if (img.get("role") or "").lower() == "presentation" or img.get("aria-hidden") == "true":
        return True
    try:
        w, h = int(img.get("width") or 0), int(img.get("height") or 0)
        if 0 < w <= 32 and 0 < h <= 32:
            return True
    except ValueError:
        pass
    return False


def is_filename_alt(alt, src):
    a = alt.strip()
    name, stem = basename_and_stem(src)
    return bool(FILENAME_ALT_RE.search(a)) or normalize(a) in (normalize(stem), normalize(name))


def audit_page(url, html):
    imgs = BeautifulSoup(html, "html.parser").find_all("img")
    findings = []
    for i, img in enumerate(imgs):
        if img.get("src") == "":
            continue  # JS-populated placeholder (e.g. lightbox target), not a rendered image
        src = img.get("src") or img.get("data-src") or "(missing src attribute)"
        alt = img.get("alt")
        decorative = is_decorative(img, src, alt or "")

        if not decorative:
            if alt is None:
                findings.append((src, "missing alt attribute", "HIGH"))
            elif alt.strip() == "":
                findings.append((src, "empty alt on content image", "HIGH"))
            elif is_filename_alt(alt, src):
                findings.append((src, f'alt is filename-like ("{alt.strip()}")', "MEDIUM"))

        has_w, has_h = bool(img.get("width")), bool(img.get("height"))
        if not (has_w and has_h):
            missing = "/".join(a for a, ok in [("width", has_w), ("height", has_h)] if not ok)
            findings.append((src, f"missing {missing}", "MEDIUM"))

        is_hero = HERO_HINT.search(src) or HERO_HINT.search(" ".join(img.get("class") or []))
        if not decorative and i >= 2 and not is_hero and (img.get("loading") or "").lower() != "lazy":
            findings.append((src, 'missing loading="lazy"', "LOW"))

    return findings, len(imgs)


def build_report(page_filter=None):
    urls = get_page_urls(page_filter)
    session = requests.Session()
    session.headers["User-Agent"] = UA

    by_page = {}
    total_imgs = 0
    severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    errors = []

    for url in urls:
        try:
            r = session.get(url, timeout=TIMEOUT)
            r.raise_for_status()
        except requests.RequestException as e:
            errors.append((url, str(e)))
            continue
        findings, n_imgs = audit_page(url, r.text)
        total_imgs += n_imgs
        if findings:
            by_page[url] = findings
            for _, _, sev in findings:
                severity_counts[sev] += 1

    lines = []
    A = lines.append
    A("# Alt-Text & Image SEO Audit — indigopalm.co")
    A(f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    A(f"Pages scanned: {len(urls)} | Images scanned: {total_imgs} | Pages with findings: {len(by_page)}\n")

    for url, findings in by_page.items():
        A(f"## {url}")
        A("| Image src | Issue | Severity |")
        A("|---|---|---|")
        for src, issue, sev in findings:
            A(f"| `{src}` | {issue} | {sev} |")
        A("")

    if errors:
        A("## Fetch errors")
        for url, err in errors:
            A(f"- `{url}`: {err}")
        A("")

    A("## Summary")
    A(f"- Pages scanned: {len(urls)}")
    A(f"- Pages with findings: {len(by_page)} ({len(urls) - len(by_page) - len(errors)} clean)")
    A(f"- Images scanned: {total_imgs}")
    A(f"- HIGH: {severity_counts['HIGH']}")
    A(f"- MEDIUM: {severity_counts['MEDIUM']}")
    A(f"- LOW: {severity_counts['LOW']}")
    if errors:
        A(f"- Fetch errors: {len(errors)}")

    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages", type=str, default=None, help="comma-separated URL substrings to limit scope")
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    report = build_report(page_filter=args.pages)
    if args.output:
        with open(args.output, "w") as f:
            f.write(report)
        print(f"Report written to {args.output}", file=sys.stderr)
    else:
        print(report)
