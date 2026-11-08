"""
How to dispose of each class the models can detect.

The material model (garbage-classification-3/2) knows 7 classes:
PLASTIC, GLASS, METAL, PAPER, CARDBOARD, BIODEGRADABLE, CLOTH.
classifier.py adds ELECTRONICS and BATTERY from two extra models.
TRASH only comes from the Gemini second opinion (referee.py); the Roboflow
models have no trash class.

These are general US curbside guidelines, but recycling rules vary by city.
"""

from dataclasses import asdict, dataclass

# Bins the app can show. Colors are for the result card.
BINS = {
    "recycle": {"label": "Recycle", "color": "#2E7DD7"},
    "compost": {"label": "Compost", "color": "#3A9D4F"},
    "donate": {"label": "Donate / Textile", "color": "#8E5BD0"},
    "ewaste": {"label": "E-waste drop-off", "color": "#F5BE25"},
    "trash": {"label": "Trash", "color": "#6B7280"},
    "unknown": {"label": "Not sure", "color": "#F02D2D"},
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
        tip="Empty and rinse it beforehand. Bottles, jugs, and tubs are usually accepted.",
        exceptions=[
            "Plastic bags, wraps, and film: must be taken to a store drop-off, should not go in the bin.",
            "Styrofoam, containers, and cups: check with your local program first. Some areas accept them, but most don't.",
            "Utensils: goes in the trash, not the bin.",
        ],
    ),
    "GLASS": Rule(
        item="Glass",
        bin="recycle",
        tip="Typically all glass items. Empty and rinse first, labels can stay on.",
        exceptions=[
            "Broken glass: too dangerous, goes in the trash.",
            "Glass bottles: take bottle caps off and recycle separately.",
            "Some areas don't take glass in bins, check local program.",
        ],
    ),
    "METAL": Rule(
        item="Metal",
        bin="recycle",
        tip="Cans and clean foil. Empty and rinse.",
        exceptions=[
            "Don't crush cans, harder to sort at the recycling facility.",
            "Aerosol cans: only if completely empty.",
            "Check with your local program for other metal items."
        ],
    ),
    "PAPER": Rule(
        item="Paper",
        bin="recycle",
        tip="Keep it clean and dry. Mail, printer paper, newspapers, and magazines are accepted.",
        exceptions=[
            "Napkins, paper towels, tissues: compost or trash.",
            "Paper cups and coated paper: usually trash.",
            "Paperback books: donate if possible, otherwise recycle.",
            "Waxed or laminated paper: too shiny to recycle, throw away.",
        ],
    ),
    "CARDBOARD": Rule(
        item="Cardboard",
        bin="recycle",
        tip="Flatten boxes before recycling.",
        exceptions=[
            "Greasy pizza boxes: remove all food scraps from box first.",
            "Too contaminated or wet cardboard: can't be recycled, put in the trash.",
        ],
    ),
    "BIODEGRADABLE": Rule(
        item="Food & organic waste",
        bin="compost",
        tip="Food scraps, peels, coffee grounds and yard waste.",
        exceptions=[
            "Buy what you can eat and eat leftovers to reduce waste.",
            "Find your local composting program, or start home-composting.",
        ],
    ),
    "CLOTH": Rule(
        item="Clothing & fabric",
        bin="donate",
        tip="Donate if it's wearable, otherwise use a textile recycling drop-off.",
        exceptions=["Don't put textiles in the curbside recycling bin."],
        # Thrift stores take donations; plain "clothing donation" also finds food banks.
        dropoff="donate clothes thrift store",
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
        # Plain "electronics recycling" also finds phone shops.
        dropoff="e-waste recycling center",
    ),
    "BATTERY": Rule(
        item="Battery",
        bin="ewaste",
        tip="Never in the trash or recycling: they require special handling. "
        "Take them to a battery drop-off (many hardware and electronics stores have one).",
        exceptions=[
            "Swollen or damaged lithium batteries: store in a cool place and drop off soon.",
            "Car batteries: return to an auto parts store.",
            "Lead-acid batteries: take to a hazardous waste drop-off or battery retailer.",
        ],
        dropoff="household battery recycling",
    ),
    "TRASH": Rule(
        item="Trash",
        bin="trash",
        tip="If it doesn't fit in the other categories, throw it away.",
        exceptions=[
            "Hazardous waste: use a drop-off point.",
            "Large items: check with your local program for bulk pickup or drop-off.",
        ],
    ),
}

RULES["TRASH"] = Rule(
    item="Trash",
    bin="trash",
    tip="This can't be recycled or composted. Put it in the regular trash.",
    exceptions=[
        "Still usable? Donate it instead.",
        "Chip bags and plastic film: some stores collect them with plastic bags.",
    ],
)

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
