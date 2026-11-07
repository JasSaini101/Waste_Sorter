"""Waste classification via the Roboflow "garbage-classification-3/2" model."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv
from inference_sdk import InferenceConfiguration, InferenceHTTPClient

MODEL_ID = "garbage-classification-3/2"
API_URL = "https://serverless.roboflow.com"


@dataclass
class Prediction:
    label: str
    confidence: float
    # Bounding box (center x/y, width, height in pixels) for object-detection output
    box: tuple[float, float, float, float] | None = None


@dataclass
class ClassificationResult:
    top: Prediction | None
    predictions: list[Prediction]
    raw: dict


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


def classify(image: str) -> ClassificationResult:
    """Classify an image given a local file path or an image URL."""
    global _client
    if _client is None:
        _client = _get_client()

    raw = _client.infer(image, model_id=MODEL_ID)
    return _parse(raw)


def _parse(raw: dict) -> ClassificationResult:
    preds_raw = raw.get("predictions", [])

    # Object detection (this model) or single-label classification:
    # list of {"class", "confidence"[, "x", "y", "width", "height"]}
    if isinstance(preds_raw, list):
        preds = [
            Prediction(
                p.get("class", "?"),
                float(p.get("confidence", 0.0)),
                (p["x"], p["y"], p["width"], p["height"]) if "x" in p else None,
            )
            for p in preds_raw
        ]
    # Multi-label classification: {"label": {"confidence": x}}
    elif isinstance(preds_raw, dict):
        preds = [
            Prediction(label, float(v.get("confidence", 0.0)))
            for label, v in preds_raw.items()
        ]
    else:
        preds = []

    preds.sort(key=lambda p: p.confidence, reverse=True)

    top = None
    if "top" in raw:
        top = Prediction(raw["top"], float(raw.get("confidence", 0.0)))
    elif preds:
        top = preds[0]

    return ClassificationResult(top=top, predictions=preds, raw=raw)
