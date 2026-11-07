"""Waste detection: a cascade of three models on Roboflow's serverless API.

1. MATERIAL_MODEL sorts waste into 7 materials (plastic, glass, metal...).
2. ELECTRONICS_MODEL is a stock COCO detector; we only keep its electronics classes.
3. BATTERY_MODEL is a public Roboflow Universe battery detector.

The material model has no electronics or battery class, so on its own it calls
a phone "METAL" and a battery "PAPER", and the app would say "Recycle". Models 2
and 3 catch those cases and override it with an e-waste result.

All three run in parallel, so a scan takes about as long as a single call.
"""

import logging
import os
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

from dotenv import load_dotenv
from inference_sdk import InferenceConfiguration, InferenceHTTPClient
from PIL import Image

API_URL = "https://serverless.roboflow.com"

MATERIAL_MODEL = "garbage-classification-3/2"
# Roboflow-hosted YOLOv8n trained on COCO (80 everyday objects). No local PyTorch needed.
ELECTRONICS_MODEL = "yolov8n-640"
# https://universe.roboflow.com/mrkhai/battery-detection-and-counts (CC BY 4.0)
BATTERY_MODEL = "battery-detection-and-counts/1"

# COCO classes that are e-waste. Everything else COCO sees (person, cup, bottle...) is ignored.
ELECTRONICS_CLASSES = {
    "cell phone", "laptop", "keyboard", "mouse", "remote", "tv",
    "microwave", "toaster", "hair drier",
}
# COCO electronics detections at or above this override the material model.
ELECTRONICS_THRESHOLD = 0.45
# The battery model also fires on cans and boxes (cylinders and rectangles), so a battery
# only wins if it clears this AND beats the material model's best score.
BATTERY_THRESHOLD = 0.55

log = logging.getLogger(__name__)


@dataclass
class Prediction:
    label: str  # Rule key: a material like "METAL", or "ELECTRONICS" / "BATTERY"
    confidence: float
    # Bounding box (center x/y, width, height in pixels) for object-detection output
    box: tuple[float, float, float, float] | None = None
    # What the model itself called it, e.g. "cell phone" or "AA Battery"
    name: str | None = None


@dataclass
class ClassificationResult:
    top: Prediction | None
    predictions: list[Prediction]
    raw: dict  # Raw response from each model, keyed by model ID


def _get_client() -> InferenceHTTPClient:
    load_dotenv()
    api_key = os.environ.get("ROBOFLOW_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ROBOFLOW_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return InferenceHTTPClient(api_url=API_URL, api_key=api_key).configure(
        # Send the key as an Authorization: Bearer header, never in the query string.
        InferenceConfiguration(api_key_transport="header")
    )


_client: InferenceHTTPClient | None = None
_pool = ThreadPoolExecutor(max_workers=6, thread_name_prefix="roboflow")


def classify(image: "str | Image.Image") -> ClassificationResult:
    """Detect waste in an image: a local file path, an image URL, or a PIL image.

    Raises if the material model fails. If an e-waste model fails, its result is
    skipped and the material result is used.
    """
    global _client
    if _client is None:
        _client = _get_client()

    def run(model_id: str) -> dict:
        # Each thread gets its own copy so the SDK never encodes one PIL image twice at once.
        img = image.copy() if isinstance(image, Image.Image) else image
        return _client.infer(img, model_id=model_id)

    jobs = {m: _pool.submit(run, m) for m in (MATERIAL_MODEL, ELECTRONICS_MODEL, BATTERY_MODEL)}

    raw = {MATERIAL_MODEL: jobs[MATERIAL_MODEL].result()}
    for model_id in (ELECTRONICS_MODEL, BATTERY_MODEL):
        try:
            raw[model_id] = jobs[model_id].result()
        except Exception:
            log.exception("E-waste model %s failed; using the material result only", model_id)

    materials = [
        Prediction(p.name.upper(), p.confidence, p.box, p.name)
        for p in _parse(raw[MATERIAL_MODEL])
    ]
    electronics = [
        Prediction("ELECTRONICS", p.confidence, p.box, p.name)
        for p in _parse(raw.get(ELECTRONICS_MODEL, {}))
        if p.name in ELECTRONICS_CLASSES
    ]
    batteries = [
        Prediction("BATTERY", p.confidence, p.box, p.name)
        for p in _parse(raw.get(BATTERY_MODEL, {}))
    ]
    return _merge(materials, electronics, batteries, raw)


def _merge(
    materials: list[Prediction],
    electronics: list[Prediction],
    batteries: list[Prediction],
    raw: dict,
) -> ClassificationResult:
    """Pick the answer. E-waste beats materials, because recycling a battery can start a fire."""
    best_material = max((p.confidence for p in materials), default=0.0)
    batteries = [
        p for p in batteries if p.confidence >= BATTERY_THRESHOLD and p.confidence > best_material
    ]
    ewaste = [p for p in electronics if p.confidence >= ELECTRONICS_THRESHOLD] + batteries

    top = (
        max(ewaste, key=lambda p: p.confidence) if ewaste
        else materials[0] if materials
        else None
    )
    # Everything worth showing in the app's detections list. Rejected battery hits are
    # left out because they're usually cans or boxes.
    predictions = sorted(materials + electronics + batteries, key=lambda p: p.confidence, reverse=True)
    return ClassificationResult(top=top, predictions=predictions, raw=raw)


@dataclass
class _RawPrediction:
    name: str
    confidence: float
    box: tuple[float, float, float, float] | None


def _parse(raw: dict) -> list[_RawPrediction]:
    """Predictions from one model's response, most confident first."""
    preds_raw = raw.get("predictions", [])

    # Object detection (all three models) or single-label classification:
    # list of {"class", "confidence"[, "x", "y", "width", "height"]}
    if isinstance(preds_raw, list):
        preds = [
            _RawPrediction(
                p.get("class", "?"),
                float(p.get("confidence", 0.0)),
                (p["x"], p["y"], p["width"], p["height"]) if "x" in p else None,
            )
            for p in preds_raw
        ]
    # Multi-label classification: {"label": {"confidence": x}}
    elif isinstance(preds_raw, dict):
        preds = [
            _RawPrediction(label, float(v.get("confidence", 0.0)), None)
            for label, v in preds_raw.items()
        ]
    else:
        preds = []

    preds.sort(key=lambda p: p.confidence, reverse=True)
    return preds
