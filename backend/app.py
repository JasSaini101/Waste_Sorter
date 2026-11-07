"""Waste Sorter API.

Run locally (from the backend/ folder):
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload

Then from a phone on the same Wi-Fi, use http://<your-laptop-ip>:8000
Interactive docs: http://localhost:8000/docs
"""

import io

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from classifier import classify
from disposal_rules import RULES, rule_for, rule_to_dict

# Below this, the app should say "Probably X" and let the user confirm.
CONFIDENT_THRESHOLD = 0.5
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
# The model works at 416x416, so larger uploads only cost time.
MAX_SIDE = 1024

app = FastAPI(title="Waste Sorter API")

# Lets the Expo web build and local tools call the API. Native apps don't need this.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/rules")
def rules() -> list[dict]:
    """All disposal rules, for the app's manual lookup screen."""
    return [rule_to_dict(key, rule) for key, rule in RULES.items()]


@app.post("/scan")
def scan(image: UploadFile = File(...)) -> dict:
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
        # Everything detected, most confident first, for drawing boxes or a "Did you mean" list.
        "detections": [
            {"label": p.label, "name": p.name, "confidence": p.confidence, "box": p.box}
            for p in result.predictions
        ],
    }
