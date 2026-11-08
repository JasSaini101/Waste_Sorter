// Client for the Waste Sorter backend. Response shapes match backend/app.py.

import { Platform } from "react-native";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type BinKey = "recycle" | "compost" | "donate" | "ewaste" | "trash" | "unknown";

export type Rule = {
  key: string | null;
  item: string;
  bin: BinKey;
  bin_label: string;
  color: string;
  tip: string;
  exceptions: string[];
  dropoff: string | null; // Set for items that need a drop-off spot (e-waste, batteries, clothes)
};

export type Place = {
  name: string;
  address: string;
  distance_miles: number;
  maps_url: string | null;
};

export type Nearby = {
  query: string;
  places: Place[]; // Closest first
  search_url: string; // Google Maps search, always available
  needs_location: boolean; // true = no location was sent
  note: string | null; // Why `places` is empty, if it is
};

export type Coords = { lat: number; lon: number };

export type Box = [number, number, number, number]; // center x, center y, width, height

export type ScanResult = {
  found: boolean;
  confidence: number | null;
  confident: boolean;
  box: Box | null;
  image_size: { width: number; height: number };
  rule: Rule;
  nearby: Nearby | null; // null when the item goes in a home bin
  // label is the rule key (e.g. "BATTERY"); name is what the model saw (e.g. "AA Battery").
  detections: { label: string; name: string | null; confidence: number; box: Box | null }[];
};

// Render's free tier sleeps after 15 idle minutes and takes up to a minute to wake.
const TIMEOUT_MS = 70000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = `Server error (${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

/** Upload a photo (file, blob or data URI) and get disposal advice. */
export async function scan(photoUri: string, coords: Coords | null = null): Promise<ScanResult> {
  const form = new FormData();
  if (coords) {
    form.append("lat", String(coords.lat));
    form.append("lon", String(coords.lon));
  }
  if (Platform.OS === "web") {
    // Browsers need the actual image data; photoUri is a blob: or data: URL there.
    const blob = await (await fetch(photoUri)).blob();
    form.append("image", blob, "scan.jpg");
  } else {
    // React Native's FormData accepts a {uri, name, type} object for files.
    form.append("image", { uri: photoUri, name: "scan.jpg", type: "image/jpeg" } as any);
  }
  return request<ScanResult>("/scan", { method: "POST", body: form });
}

/** Drop-off spots for a rule. Without coords, the server returns a note asking for location. */
export function getNearby(key: string, coords: Coords | null): Promise<Nearby | null> {
  return request<Nearby | null>("/nearby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, lat: coords?.lat ?? null, lon: coords?.lon ?? null }),
  });
}

export function getRules(): Promise<Rule[]> {
  return request<Rule[]>("/rules");
}

/** Wake a sleeping server while the user is still lining up their first photo. */
export function warmUp(): void {
  request("/health").catch(() => {});
}
