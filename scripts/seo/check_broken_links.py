#!/usr/bin/env python3
"""Read-only broken link/image checker for indigopalm.co.

Scope: every canonical page in sitemap.xml, plus every blog/[slug]/index.html
found on disk (covers posts not yet added to the sitemap). Internal targets
are resolved against the local filesystem; external targets get an HTTP
HEAD/GET check. No writes anywhere.
"""

import argparse
import os
import time
from urllib.parse import unquote, urljoin, urlparse
from xml.etree import ElementTree as ET

import requests
from bs4 import BeautifulSoup

SITE_ROOT = os.environ.get("SITE_ROOT") or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE_URL = "https://indigopalm.co"
INTERNAL_HOSTS = {"indigopalm.co", "www.indigopalm.co"}
SKIP_BLOG_DIRS = {"images", "blog", "category"}  # non-post dirs under blog/
SKIP_SCHEMES = ("mailto:", "tel:", "javascript:", "data:")
UA = "Mozilla/5.0 (compatible; IndigoPalmLinkChecker/1.0; +https://indigopalm.co)"
TIMEOUT = 7
HOST_DELAY = 0.5  # seconds between requests to the same external host

_last_request = {}


def discover_pages():
    """(url, local_path) for every canonical page: sitemap.xml + every blog post dir on disk."""
    pages = {}

    tree = ET.parse(os.path.join(SITE_ROOT, "sitemap.xml"))
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    for loc in tree.getroot().findall(".//s:loc", ns):
        url = loc.text.strip()
        pages[url] = url_path_to_local(urlparse(url).path)

    blog_dir = os.path.join(SITE_ROOT, "blog")
    for name in sorted(os.listdir(blog_dir)):
        full = os.path.join(blog_dir, name)
        if name in SKIP_BLOG_DIRS or not os.path.isdir(full):
            continue
        index = os.path.join(full, "index.html")
        if os.path.isfile(index):
            pages[f"{BASE_URL}/blog/{name}/"] = index

    return sorted(pages.items())


def url_path_to_local(path):
    path = unquote(path)
    if path in ("", "/"):
        return os.path.join(SITE_ROOT, "index.html")
    rel = path.lstrip("/")
    if rel.endswith("/"):
        rel += "index.html"
    return os.path.join(SITE_ROOT, rel)


def classify(page_url, href):
    """Resolve href against page_url. Returns ('external', absolute_url) or ('internal', local_path)."""
    absolute = urljoin(page_url, href)
    parsed = urlparse(absolute)
    if parsed.netloc.lower() not in INTERNAL_HOSTS:
        return "external", absolute
    return "internal", url_path_to_local(parsed.path)


def should_skip(href):
    h = (href or "").strip()
    return not h or h == "#" or h.lower().startswith(SKIP_SCHEMES)


def extract_targets(html):
    """[(kind, href), ...] for every <a href>, <img src>, canonical link, og:image on the page."""
    soup = BeautifulSoup(html, "html.parser")
    targets = [("link", a["href"]) for a in soup.find_all("a", href=True)]
    targets += [("image", img["src"]) for img in soup.find_all("img", src=True)]
    canonical = soup.find("link", attrs={"rel": "canonical"})
    if canonical and canonical.get("href"):
        targets.append(("canonical", canonical["href"]))
    og_image = soup.find("meta", attrs={"property": "og:image"})
    if og_image and og_image.get("content"):
        targets.append(("og:image", og_image["content"]))
    return targets


def check_external(url):
    """HEAD (falling back to GET on 405). Returns (ok, detail)."""
    host = urlparse(url).netloc
    wait = HOST_DELAY - (time.monotonic() - _last_request.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    headers = {"User-Agent": UA}
    try:
        resp = requests.head(url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code == 405:
            resp = requests.get(url, headers=headers, timeout=TIMEOUT, allow_redirects=True, stream=True)
        _last_request[host] = time.monotonic()
        # Only flag the statuses the spec calls broken; other 4xx (401/403/429...) are
        # usually bot-blocking noise, not a dead link, so leave those as OK.
        if resp.status_code in (404, 410) or resp.status_code >= 500:
            return False, f"HTTP {resp.status_code}"
        return True, str(resp.status_code)
    except requests.exceptions.Timeout:
        _last_request[host] = time.monotonic()
        return False, "timeout"
    except requests.exceptions.RequestException as e:
        _last_request[host] = time.monotonic()
        return False, f"{type(e).__name__}: {e}"


def scan(pages, skip_external):
    report = {}
    external_cache = {}
    stats = {"pages": 0, "internal_checked": 0, "external_checked": 0, "external_unique": 0, "broken": 0}

    for page_url, local_path in pages:
        stats["pages"] += 1
        if not os.path.isfile(local_path):
            report.setdefault(page_url, []).append(
                {"kind": "page", "href": local_path, "detail": "source file not found on disk", "severity": "HIGH"}
            )
            stats["broken"] += 1
            continue

        with open(local_path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()

        for kind, href in extract_targets(html):
            if should_skip(href):
                continue
            scope, target = classify(page_url, href)

            if scope == "external":
                if skip_external:
                    continue
                if target not in external_cache:
                    external_cache[target] = check_external(target)
                    stats["external_unique"] += 1
                stats["external_checked"] += 1
                ok, detail = external_cache[target]
                if not ok:
                    report.setdefault(page_url, []).append(
                        {"kind": kind, "href": href, "detail": detail, "severity": "MEDIUM"}
                    )
                    stats["broken"] += 1
            else:
                stats["internal_checked"] += 1
                # A directory-style href without a trailing slash (e.g. /the-sundune)
                # resolves to a bare directory here; the site 301s it to the slash
                # form, so check for its index.html before calling it broken.
                resolved = os.path.join(target, "index.html") if os.path.isdir(target) else target
                if not os.path.isfile(resolved):
                    report.setdefault(page_url, []).append(
                        {"kind": kind, "href": href, "detail": f"not found: {target}", "severity": "HIGH"}
                    )
                    stats["broken"] += 1

    return report, stats


def render_report(report, stats, elapsed, skip_external):
    lines = [
        "# Broken Link Report — indigopalm.co",
        "",
        f"Pages scanned: {stats['pages']} | Internal targets checked: {stats['internal_checked']} | "
        f"External unique URLs checked: {stats['external_unique']} | Broken found: {stats['broken']}",
        f"External checks skipped: {skip_external} | Runtime: {elapsed:.1f}s",
        "",
    ]
    if not report:
        lines.append("No broken links or images found.")
        return "\n".join(lines)

    for page_url in sorted(report):
        lines.append(f"## {page_url}")
        for issue in report[page_url]:
            lines.append(f"- **[{issue['severity']}]** {issue['kind']}: `{issue['href']}` — {issue['detail']}")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Find broken internal/external links across indigopalm.co")
    parser.add_argument("--pages", help="comma-separated substrings to limit scope (matched against page URL)")
    parser.add_argument("--skip-external", action="store_true", help="skip external HTTP checks")
    parser.add_argument("--output", help="markdown report output path (default: stdout)")
    args = parser.parse_args()

    pages = discover_pages()
    if args.pages:
        filters = [f.strip() for f in args.pages.split(",") if f.strip()]
        pages = [(u, p) for u, p in pages if any(f in u for f in filters)]

    start = time.time()
    report, stats = scan(pages, args.skip_external)
    elapsed = time.time() - start

    md = render_report(report, stats, elapsed, args.skip_external)
    if args.output:
        with open(args.output, "w") as f:
            f.write(md)
        print(f"Report written to {args.output}")
    else:
        print(md)


if __name__ == "__main__":
    main()
