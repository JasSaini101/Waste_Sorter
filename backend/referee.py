"""Second opinion from Google's Gemini vision model, which is far more accurate than the Roboflow models.

Uses the Gemini API's free tier (key from https://aistudio.google.com, no billing needed).
The key comes from GEMINI_API_KEY and is sent in the x-goog-api-key header, never in a URL.
Without a key, or if Gemini fails or is rate-limited, the Roboflow answer is used as is.
"""

import base64
import io
import json
import logging
import os

import httpx
from dotenv import load_dotenv
from PIL import Image

# "-latest" follows Google's current Flash model, so this doesn't break when versions retire.
MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT_S = 15

# Every answer Gemini may give. Must match keys in disposal_rules.RULES, plus UNKNOWN.
CATEGORIES = [
    "PLASTIC", "GLASS", "METAL", "PAPER", "CARDBOARD", "BIODEGRADABLE", "CLOTH",
    "ELECTRONICS", "BATTERY", "TRASH", "UNKNOWN",
]
# Gemini's own certainty, turned into a number for the app's "% sure" and "Probably X?".
CERTAINTY = {"high": 0.9, "medium": 0.7, "low": 0.4}

PROMPT = """You sort household waste. Look at the main object in the photo, the one someone \
is about to throw away, and pick its disposal category:

PLASTIC: plastic bottles, jugs, tubs, clamshells, food containers
GLASS: glass bottles and jars
METAL: drink cans, food tins, foil, metal lids
PAPER: paper, newspaper, mail, magazines, paperback books
CARDBOARD: cardboard boxes, corrugated cardboard, cereal boxes
BIODEGRADABLE: food scraps, fruit and vegetable peels, coffee grounds, yard waste
CLOTH: clothing, shoes, fabric, towels
ELECTRONICS: anything with a circuit board or power cord: phones, laptops, keyboards, mice, \
chargers, cables, remotes, small appliances
BATTERY: loose batteries of any kind (AA, AAA, 9V, coin cells, lithium-ion cells, power banks)
TRASH: things that can't be recycled or composted: ceramics and mugs, chip bags, styrofoam, \
dirty wrappers, diapers, wallets, toys
UNKNOWN: no clear single object, or you can't tell what it is

Only say ELECTRONICS or BATTERY if you clearly see one; a cylinder or a box is not a battery \
by itself. Also give a short name for the object, like "AA battery" or "clear plastic food container"."""

SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "category": {"type": "STRING", "enum": CATEGORIES},
        "item": {"type": "STRING"},
        "certainty": {"type": "STRING", "enum": list(CERTAINTY)},
    },
    "required": ["category", "item", "certainty"],
}

log = logging.getLogger(__name__)


def _api_key() -> str:
    load_dotenv()
    return os.environ.get("GEMINI_API_KEY", "").strip().strip('"').strip("'")


def is_configured() -> bool:
    return bool(_api_key())


def ask(image: Image.Image) -> dict | None:
    """Gemini's verdict: {"category", "item", "certainty", "confidence"}, or None if unavailable."""
    key = _api_key()
    if not key:
        return None

    buf = io.BytesIO()
    small = image.copy()
    small.thumbnail((768, 768))  # Plenty for recognizing one object; keeps uploads quick
    small.save(buf, format="JPEG", quality=85)

    try:
        response = httpx.post(
            URL.format(model=MODEL),
            headers={"x-goog-api-key": key},
            json={
                "contents": [{"parts": [
                    {"text": PROMPT},
                    {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(buf.getvalue()).decode()}},
                ]}],
                "generationConfig": {
                    "temperature": 0,
                    "responseMimeType": "application/json",
                    "responseSchema": SCHEMA,
                },
            },
            timeout=TIMEOUT_S,
        )
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        verdict = json.loads(text)
    except Exception as e:
        # 429 means the free tier's per-minute limit was hit; the Roboflow answer still stands.
        status = getattr(getattr(e, "response", None), "status_code", None)
        log.warning("Gemini second opinion unavailable (%s %s)", type(e).__name__, status or "")
        return None

    if verdict.get("category") not in CATEGORIES:
        return None
    verdict["confidence"] = CERTAINTY.get(verdict.get("certainty"), 0.4)
    return verdict
