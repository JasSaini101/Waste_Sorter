"""Measure how often the classifier picks the right item and bin on the test set.

Usage (from the repo root, after fetch_test_set.py):
    python backend/eval/evaluate.py            # uses saved model responses where possible
    python backend/eval/evaluate.py --refresh  # calls Roboflow again for every photo

With GEMINI_API_KEY set, Gemini's answer for every photo is saved too (paced to stay under
the free tier's per-minute limit), and the report compares three modes: Roboflow only,
Gemini on unclear scans (the default), and Gemini on every scan.

Model responses are saved in backend/eval/cache.json (gitignored), so changing the
decision logic in classifier.decide() can be re-scored in a second without new API calls.
"""

import argparse
import json
import sys
import time
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))

from PIL import Image  # noqa: E402

from app import MAX_SIDE  # noqa: E402
import classifier  # noqa: E402
import referee  # noqa: E402
from classifier import decide, infer_all, needs_second_opinion, with_second_opinion  # noqa: E402
from disposal_rules import rule_for  # noqa: E402

IMAGES = HERE / "images"
CACHE = HERE / "cache.json"
EWASTE = {"ELECTRONICS", "BATTERY"}
GEMINI_PAUSE_S = 6  # About 10 requests a minute


def load_like_api(path: Path) -> Image.Image:
    """Same preprocessing as POST /scan, so scores match the app."""
    img = Image.open(path).convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    return img


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Ignore saved model responses")
    args = parser.parse_args()

    cache = {} if args.refresh or not CACHE.exists() else json.loads(CACHE.read_text())
    files = sorted(IMAGES.glob("*/*.jpg"))
    if not files:
        print("No test photos. Run backend/eval/fetch_test_set.py first.")
        return 1

    for path in files:
        name = f"{path.parent.name}/{path.name}"
        if name not in cache:
            cache[name] = infer_all(load_like_api(path))
            CACHE.write_text(json.dumps(cache))
        if referee.is_configured() and cache[name].get("gemini") is None:
            cache[name]["gemini"] = referee.ask(load_like_api(path))
            CACHE.write_text(json.dumps(cache))
            time.sleep(GEMINI_PAUSE_S)

    modes = ["off"]
    if any(r.get("gemini") for r in cache.values()):
        modes += ["unclear", "always"]
    for mode in modes:
        report(mode, files, cache)
    return 0


def report(mode: str, files: list[Path], cache: dict) -> None:
    classifier.SECOND_OPINION = mode
    rows = []
    asked = 0
    for path in files:
        name = f"{path.parent.name}/{path.name}"
        raw = {k: v for k, v in cache[name].items() if k != "gemini"}
        result = decide(raw)
        if needs_second_opinion(result):
            asked += 1
            result = with_second_opinion(result, cache[name].get("gemini"))
        top = result.top
        rows.append((path.parent.name, name, top.label if top else None, top.name if top else None))

    item_ok = bin_ok = 0
    false_ewaste = missed_ewaste = 0
    per_class = Counter()
    totals = Counter()
    mistakes = []
    for expected, name, got, seen in rows:
        totals[expected] += 1
        if expected == "NOT_EWASTE":
            ok_item = ok_bin = got not in EWASTE
        else:
            ok_item = got == expected
            ok_bin = rule_for(got).bin == rule_for(expected).bin
        item_ok += ok_item
        bin_ok += ok_bin
        per_class[expected] += ok_item
        if got in EWASTE and expected not in EWASTE:
            false_ewaste += 1
        if expected in EWASTE and got not in EWASTE:
            missed_ewaste += 1
        if not ok_item:
            mistakes.append(f"  {name:55s} got {got} ({seen})")

    n = len(rows)
    label = {"off": "Roboflow only", "unclear": "Gemini on unclear scans", "always": "Gemini on every scan"}[mode]
    print()
    print(f"=== {label} (Gemini asked for {asked}/{n}) ===")
    print(f"Right item: {item_ok}/{n} ({item_ok / n:.0%})")
    print(f"Right bin:  {bin_ok}/{n} ({bin_ok / n:.0%})")
    print(f"Wrongly sent to e-waste: {false_ewaste}   E-waste missed: {missed_ewaste}")
    print("Per class: " + ", ".join(f"{k} {per_class[k]}/{totals[k]}" for k in sorted(totals)))
    print("Mistakes:")
    for line in mistakes or ["  none"]:
        print(line)


if __name__ == "__main__":
    sys.exit(main())
