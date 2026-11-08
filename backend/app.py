"""Waste Sorter API.

Run locally (from the backend/ folder):
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload

Then from a phone on the same Wi-Fi, use http://<your-laptop-ip>:8000
Interactive docs: http://localhost:8000/docs
"""

import html
import io
import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

from classifier import classify
from disposal_rules import RULES, Rule, rule_for, rule_to_dict
from places import nearby

# Below this, the app should say "Probably X" and let the user confirm.
CONFIDENT_THRESHOLD = 0.5
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
# The model works at 416x416, so larger uploads only cost time.
MAX_SIDE = 1024

app = FastAPI(title="Waste Sorter API")

# Lets the Expo web build and local tools call the API. Native apps don't need this.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# Where the web version of the app lives, linked from this API's home page.
WEB_APP_URL = os.environ.get("WEB_APP_URL", "https://waste-sorter-web.onrender.com")


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def home() -> str:
    """Friendly page for people who open the API's address in a browser."""
    url = html.escape(WEB_APP_URL)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Waste Sorter API</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem;
         line-height: 1.5; color: #1f2933; background: #fff; }}
  a.button {{ display: inline-block; background: #2E7DD7; color: #fff; padding: .8rem 1.4rem;
              border-radius: .6rem; text-decoration: none; font-weight: 600; }}
  code {{ background: #f1f2f4; padding: .1rem .3rem; border-radius: .25rem; }}
  .ok {{ color: #3A9D4F; font-weight: 600; }}
</style></head>
<body>
  <h1>♻️ Waste Sorter API</h1>
  <p class="ok">The server is running.</p>
  <p>This is the backend. To scan waste, open the app:</p>
  <p><a class="button" href="{url}">Open Waste Sorter</a></p>
  <p>For developers: <a href="/docs">API docs</a> · <code>POST /scan</code> · <code>GET /rules</code> · <code>GET /health</code></p>
</body></html>"""


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/rules")
def rules() -> list[dict]:
    """All disposal rules, for the app's manual lookup screen."""
    return [rule_to_dict(key, rule) for key, rule in RULES.items()]


def _nearby_for(rule: Rule, lat: float | None, lon: float | None) -> dict | None:
    """Nearest drop-off spots, only for items that need one (e-waste, batteries, clothes)."""
    return nearby(rule.dropoff, lat, lon) if rule.dropoff else None


@app.post("/scan")
def scan(
    image: UploadFile = File(...),
    # The user's location, only sent if they allowed it. Used to find drop-off spots, never stored.
    lat: float | None = Form(None, ge=-90, le=90),
    lon: float | None = Form(None, ge=-180, le=180),
) -> dict:
    """Detect the waste in a photo and say how to dispose of it.

    Defined with `def` (not `async def`) so the blocking Roboflow call
    runs in a worker thread instead of stalling other requests.
    """
    data = image.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image is larger than 10 MB.")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except UnidentifiedImageError:
        raise HTTPException(400, "Upload is not a readable image.")

    img = img.convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))

    try:
        result = classify(img)
    except Exception as e:  # Network or Roboflow error
        raise HTTPException(502, f"Detection service failed: {e}")

    top = result.top
    rule = rule_for(top.label if top else None)
    return {
        "found": top is not None,
        "confidence": top.confidence if top else None,
        "confident": bool(top and top.confidence >= CONFIDENT_THRESHOLD),
        "box": top.box if top else None,
        "image_size": {"width": img.width, "height": img.height},
        "rule": rule_to_dict(top.label.upper() if top else None, rule),
        # Closest drop-off spots, or a note asking for location. null if the item goes in a home bin.
        "nearby": _nearby_for(rule, lat, lon),
        # Everything detected, most confident first, for drawing boxes or a "Did you mean" list.
        "detections": [
            {"label": p.label, "name": p.name, "confidence": p.confidence, "box": p.box}
            for p in result.predictions
        ],
    }


class NearbyRequest(BaseModel):
    key: str  # Rule key, e.g. "BATTERY"
    lat: float | None = Field(None, ge=-90, le=90)
    lon: float | None = Field(None, ge=-180, le=180)


@app.post("/nearby")
def nearby_spots(req: NearbyRequest) -> dict | None:
    """Drop-off spots for a rule, e.g. after picking it on the lookup screen.

    POST so the location goes in the body, not in URLs that end up in server logs.
    """
    if req.key.upper() not in RULES:
        raise HTTPException(404, f"Unknown item: {req.key}")
    return _nearby_for(RULES[req.key.upper()], req.lat, req.lon)
