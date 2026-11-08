"""Download a labeled test set of waste photos from Wikimedia Commons.

Usage (from the repo root):
    python backend/eval/fetch_test_set.py

Photos go to backend/eval/images/<EXPECTED_KEY>/, which is gitignored (each photo has
its own license on Commons). Review them once and delete any that don't show the item.
"""

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).parent / "images"
PER_QUERY = 4
UA = {"User-Agent": "WasteSorterEval/0.1 (hackathon test set)"}

# Expected rule key -> Commons searches. NOT_EWASTE holds lookalikes that the e-waste
# models tend to grab (anything but ELECTRONICS/BATTERY counts as correct for them).
QUERIES = {
    "PLASTIC": ["plastic bottle", "plastic food container"],
    "GLASS": ["glass bottle", "glass jar"],
    "METAL": ["aluminium drink can", "tin can food"],
    "PAPER": ["newspaper folded", "crumpled paper"],
    "CARDBOARD": ["cardboard box", "corrugated cardboard"],
    "BIODEGRADABLE": ["banana peel", "apple core", "vegetable scraps"],
    "CLOTH": ["t-shirt", "pile of clothes"],
    "ELECTRONICS": ["smartphone", "laptop computer", "computer mouse"],
    "BATTERY": ["AA battery", "9-volt battery", "lithium-ion battery cell"],
    "NOT_EWASTE": ["paperback book", "leather wallet", "coffee mug", "milk carton"],
}


def search(query: str, limit: int) -> list[dict]:
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}", "gsrnamespace": 6, "gsrlimit": limit,
        "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 640,
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    for attempt in range(5):
        try:
            data = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
            break
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            print(f"  rate limited, waiting before searching {query!r}")
            time.sleep(15 * (attempt + 1))
    else:
        return []
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    return [p for p in pages if p.get("imageinfo")]


def main() -> int:
    for key, queries in QUERIES.items():
        folder = OUT / key
        folder.mkdir(parents=True, exist_ok=True)
        for query in queries:
            for i, page in enumerate(search(query, PER_QUERY)):
                path = folder / f"{query.replace(' ', '-')}_{i}.jpg"
                if path.exists():
                    continue
                thumb = page["imageinfo"][0]["thumburl"]
                for attempt in range(3):
                    try:
                        data = urllib.request.urlopen(urllib.request.Request(thumb, headers=UA), timeout=30).read()
                        break
                    except urllib.error.HTTPError as e:  # 429: Commons asks us to slow down
                        print(f"  retrying {path.name} after HTTP {e.code}")
                        time.sleep(5 * (attempt + 1))
                else:
                    continue
                path.write_bytes(data)
                print(f"{key:14s} {path.name:40s} {page['title']}")
                time.sleep(1)  # Be polite to Wikimedia
    return 0


if __name__ == "__main__":
    sys.exit(main())
