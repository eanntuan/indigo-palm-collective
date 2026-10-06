#!/usr/bin/env python3
"""Refresh _content/reviews.json from Hostaway (public guest reviews only, never private feedback)."""
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/.claude/mcp-servers/hostaway"))
import server

LISTINGS = {123633: "terra-luz", 123646: "cozy-cactus"}
OUT = os.path.join(os.path.dirname(__file__), "..", "_content", "reviews.json")
SUMMARY = {"terra-luz": {"rating": "4.98", "count": 146}, "cozy-cactus": {"rating": "4.97", "count": 146},
           "the-sundune": {"rating": "4.93", "count": 40}}

old = json.load(open(OUT)) if os.path.exists(OUT) else {}
rows, off = [], 0
while True:
    r = server.api_get("/reviews", {"limit": 200, "offset": off}).get("result", [])
    rows += r
    if len(r) < 200:
        break
    off += 200

out = {slug: {"summary": old.get(slug, {}).get("summary", SUMMARY[slug]), "reviews": old.get(slug, {}).get("reviews", [])} for slug in SUMMARY}
for lid, slug in LISTINGS.items():
    keep = sorted((x for x in rows if x["listingMapId"] == lid and x["type"] == "guest-to-host"
                   and x["status"] == "published" and x["rating"] == 10 and len(x.get("publicReview") or "") >= 60),
                  key=lambda x: x["submittedAt"], reverse=True)
    seen, uniq = set(), []
    for x in keep:
        n = (x.get("reviewerName") or x.get("guestName") or "Guest").split()[0]
        if n not in seen:
            seen.add(n); uniq.append(x)
    keep = uniq[:12]
    out[slug]["reviews"] = [{"name": (x.get("reviewerName") or x.get("guestName") or "Guest").split()[0],
                             "date": x["submittedAt"][:10], "text": x["publicReview"].strip()} for x in keep]
json.dump(out, open(OUT, "w"), indent=1, ensure_ascii=False)
print({k: len(v["reviews"]) for k, v in out.items()})
