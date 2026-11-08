"""Nearest drop-off spots (e-waste, battery recycling, clothing donation) via Google Places.

Uses the Places API (New) Text Search:
https://developers.google.com/maps/documentation/places/web-service/text-search

The key comes from the GOOGLE_MAPS_API_KEY environment variable and is sent in the
X-Goog-Api-Key header, never in a URL. Without a key, or without the user's location,
the app still gets a Google Maps search link and a note explaining why there's no list.
"""

import logging
import math
import os
import time
import urllib.parse

import httpx
from dotenv import load_dotenv

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
# Only ask for the fields we show, which also keeps each request in a cheaper billing tier.
FIELD_MASK = "places.displayName,places.formattedAddress,places.location,places.googleMapsUri"
SEARCH_RADIUS_M = 25_000  # Prefer results within about 15 miles
MAX_RESULTS = 3
CACHE_SECONDS = 60 * 60

NOTE_NO_LOCATION = "Enable location permission if you want to see the closest locations near you for this."
NOTE_NO_KEY = "Nearby drop-off spots aren't set up on this server yet. Use the map search instead."
NOTE_FAILED = "Couldn't load nearby drop-off spots right now. Use the map search instead."
NOTE_NONE_FOUND = "No drop-off spots found nearby. Try the map search instead."

log = logging.getLogger(__name__)

# (query, rounded lat, rounded lon) -> (time fetched, places)
_cache: dict[tuple[str, float, float], tuple[float, list[dict]]] = {}


def nearby(query: str, lat: float | None, lon: float | None) -> dict:
    """Closest places matching `query` (e.g. "battery recycling") to the user.

    Always returns a map search link. `note` says why `places` is empty, if it is.
    """
    result = {
        "query": query,
        "places": [],
        "search_url": "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote_plus(query),
        "needs_location": False,
        "note": None,
    }
    if lat is None or lon is None:
        result["needs_location"] = True
        result["note"] = NOTE_NO_LOCATION
        return result

    api_key = _api_key()
    if not api_key:
        result["note"] = NOTE_NO_KEY
        return result

    try:
        result["places"] = _search(api_key, query, lat, lon)
    except Exception:
        # Never log the coordinates; they're the user's location.
        log.exception("Google Places search failed for %r", query)
        result["note"] = NOTE_FAILED
        return result

    if not result["places"]:
        result["note"] = NOTE_NONE_FOUND
    return result


def _api_key() -> str:
    load_dotenv()
    # Strip stray spaces or quotes from pasting it into a dashboard.
    return os.environ.get("GOOGLE_MAPS_API_KEY", "").strip().strip('"').strip("'")


def is_configured() -> bool:
    """Whether a Google key is set (not whether it works). Shown on /health."""
    return bool(_api_key())


def _search(api_key: str, query: str, lat: float, lon: float) -> list[dict]:
    # About 1 km of rounding: nearby users share cache entries and Google never
    # gets a more precise location than it needs.
    lat, lon = round(lat, 2), round(lon, 2)
    cache_key = (query, lat, lon)
    cached = _cache.get(cache_key)
    if cached and time.time() - cached[0] < CACHE_SECONDS:
        return cached[1]

    response = httpx.post(
        SEARCH_URL,
        headers={"X-Goog-Api-Key": api_key, "X-Goog-FieldMask": FIELD_MASK},
        json={
            "textQuery": query,
            "maxResultCount": 10,
            "locationBias": {
                "circle": {"center": {"latitude": lat, "longitude": lon}, "radius": SEARCH_RADIUS_M}
            },
        },
        timeout=8,
    )
    response.raise_for_status()

    places = []
    for p in response.json().get("places", []):
        loc = p.get("location") or {}
        if "latitude" not in loc or "longitude" not in loc:
            continue
        miles = _distance_miles(lat, lon, loc["latitude"], loc["longitude"])
        places.append({
            "name": (p.get("displayName") or {}).get("text", "Drop-off spot"),
            "address": p.get("formattedAddress", ""),
            "distance_miles": round(miles, 1),
            "maps_url": p.get("googleMapsUri"),
        })
    # Google ranks by relevance; show the closest of the relevant ones.
    places.sort(key=lambda p: p["distance_miles"])
    places = places[:MAX_RESULTS]

    _cache[cache_key] = (time.time(), places)
    return places


def _distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Straight-line (haversine) distance."""
    r = 3958.8  # Earth's radius in miles
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
