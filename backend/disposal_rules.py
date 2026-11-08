"""How to dispose of each class the models can detect.

The material model (garbage-classification-3/2) knows 7 classes:
PLASTIC, GLASS, METAL, PAPER, CARDBOARD, BIODEGRADABLE, CLOTH.
classifier.py adds ELECTRONICS and BATTERY from two extra models.
There is still no "trash" class, so items like chip bags get forced into
one of these or aren't detected at all.

These are general US curbside guidelines. Recycling rules vary by
city, so check them against your local program before the demo.
"""

from dataclasses import asdict, dataclass

# Bins the app can show. Colors are for the result card.
BINS = {
    "recycle": {"label": "Recycle", "color": "#2E7DD7"},
    "compost": {"label": "Compost", "color": "#3A9D4F"},
    "donate": {"label": "Donate / Textile drop-off", "color": "#8E5BD0"},
    "ewaste": {"label": "E-waste drop-off", "color": "#E8772E"},
    "trash": {"label": "Trash", "color": "#6B7280"},
    "unknown": {"label": "Not sure", "color": "#D9A21B"},
}


@dataclass
class Rule:
    item: str  # Display name
    bin: str  # Key into BINS
    tip: str  # Main instruction
    exceptions: list[str]  # Common things in this category that DON'T go in this bin
    # Google Maps search for the nearest drop-off spot, for items that don't go in a home bin
    dropoff: str | None = None


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
            "Batteries and electronics: never in the bin. Use an e-waste drop-off.",
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
        dropoff="clothing donation",
    ),
    "ELECTRONICS": Rule(
        item="Electronics",
        bin="ewaste",
        tip="Never put it in the trash or recycling. Take it to an e-waste drop-off "
        "or a store take-back program, and wipe your personal data first.",
        exceptions=[
            "Still works? Donate it or sell it.",
            "Remove loose batteries and drop them off separately.",
        ],
        dropoff="electronics recycling",
    ),
    "BATTERY": Rule(
        item="Battery",
        bin="ewaste",
        tip="Never in the trash or recycling: batteries can start fires in garbage trucks. "
        "Tape the ends and take them to a battery drop-off (many hardware and electronics stores have one).",
        exceptions=[
            "Swollen or damaged lithium batteries: store in a cool place and drop off soon.",
            "Car batteries: return to an auto parts store.",
        ],
        dropoff="battery recycling",
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
