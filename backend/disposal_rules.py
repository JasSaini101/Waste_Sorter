"""How to dispose of each class the model can detect.

The model (garbage-classification-3/2) only knows these 7 material classes:
PLASTIC, GLASS, METAL, PAPER, CARDBOARD, BIODEGRADABLE, CLOTH.
It has no "trash" or "hazardous" class, so items like chip bags or batteries
will be forced into one of these or not detected at all.

These are general US curbside guidelines. Recycling rules vary by
city, so check them against your local program before the demo.
"""

from dataclasses import asdict, dataclass

# Bins the app can show. Colors are for the result card.
BINS = {
    "recycle": {"label": "Recycle", "color": "#2E7DD7"},
    "compost": {"label": "Compost", "color": "#3A9D4F"},
    "donate": {"label": "Donate / Textile", "color": "#8E5BD0"},
    "trash": {"label": "Trash", "color": "#6B7280"},
    "unknown": {"label": "Not sure", "color": "#D9A21B"},
}


@dataclass
class Rule:
    item: str  # Display name
    bin: str  # Key into BINS
    tip: str  # Main instruction
    exceptions: list[str]  # Common things in this category that DON'T go in this bin


RULES: dict[str, Rule] = {
    "PLASTIC": Rule(
        item="Plastic",
        bin="recycle",
        tip="Empty and rinse it. Bottles, jugs and tubs are usually accepted.",
        exceptions=[
            "Plastic bags and film: take to a store drop-off, not curbside.",
            "Styrofoam and utensils: trash in most areas.",
        ],
    ),
    "GLASS": Rule(
        item="Glass",
        bin="recycle",
        tip="Bottles and jars only. Empty and rinse, labels can stay on.",
        exceptions=[
            "Window glass, mirrors, drinking glasses and ceramics: trash.",
            "Some areas don't take glass curbside. Check local rules.",
        ],
    ),
    "METAL": Rule(
        item="Metal",
        bin="recycle",
        tip="Cans and clean foil. Empty and rinse.",
        exceptions=[
            "Aerosol cans: only if completely empty.",
            "Batteries and electronics: never in the bin. Use a drop-off point.",
        ],
    ),
    "PAPER": Rule(
        item="Paper",
        bin="recycle",
        tip="Keep it clean and dry. Mail, printer paper, magazines are fine.",
        exceptions=[
            "Napkins, paper towels, tissues: compost or trash.",
            "Paper cups and coated paper: usually trash.",
        ],
    ),
    "CARDBOARD": Rule(
        item="Cardboard",
        bin="recycle",
        tip="Flatten boxes and keep them dry.",
        exceptions=["Greasy pizza boxes: tear off the clean part, compost or trash the rest."],
    ),
    "BIODEGRADABLE": Rule(
        item="Food & organic waste",
        bin="compost",
        tip="Food scraps, peels, coffee grounds and yard waste.",
        exceptions=["No compost program? Put it in the trash."],
    ),
    "CLOTH": Rule(
        item="Clothing & fabric",
        bin="donate",
        tip="Donate if it's wearable, otherwise use a textile recycling drop-off.",
        exceptions=["Don't put textiles in the curbside recycling bin."],
    ),
    "TRASH": Rule(
        item="Trash",
        bin="trash",
        tip="If it doesn't fit in the other categories, throw it away.",
        exceptions=["Hazardous waste, batteries, electronics: use a drop-off point."],
    ),
}

UNKNOWN = Rule(
    item="Unknown item",
    bin="unknown",
    tip="We couldn't identify this. Try another angle or better lighting, or look it up manually.",
    exceptions=["When in doubt, throw it out: wrong items contaminate a whole recycling load."],
)


def rule_for(label: str | None) -> Rule:
    if not label:
        return UNKNOWN
    return RULES.get(label.upper(), UNKNOWN)


def rule_to_dict(key: str | None, rule: Rule) -> dict:
    """Rule plus its bin's display label and color, ready for JSON."""
    return {"key": key, **asdict(rule), "bin_label": BINS[rule.bin]["label"], "color": BINS[rule.bin]["color"]}
