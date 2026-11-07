"""Waste Sorter CLI: classify an image of waste.

Usage:
    python main.py path/to/image.jpg
    python main.py https://example.com/image.jpg
    python main.py path/to/image.jpg --json
"""

import argparse
import json
import sys

from classifier import classify


def main() -> int:
    parser = argparse.ArgumentParser(description="Classify waste in an image.")
    parser.add_argument("image", help="Local image path or image URL")
    parser.add_argument("--json", action="store_true", help="Print raw JSON response")
    args = parser.parse_args()

    result = classify(args.image)

    if args.json:
        print(json.dumps(result.raw, indent=2))
        return 0

    if result.top is None:
        print("No waste detected in image.")
        return 0

    print(f"Top: {result.top.label} ({result.top.confidence:.1%})")
    for p in result.predictions:
        box = ""
        if p.box:
            x, y, w, h = p.box
            box = f"  at ({x:.0f}, {y:.0f}) size {w:.0f}x{h:.0f}"
        print(f"  {p.label:<20} {p.confidence:.1%}{box}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
