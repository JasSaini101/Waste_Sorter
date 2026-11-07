// Client for the Waste Sorter backend. Response shapes match backend/app.py.

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type BinKey = "recycle" | "compost" | "donate" | "trash" | "unknown";

export type Rule = {
  key: string | null;
  item: string;
  bin: BinKey;
  bin_label: string;
  color: string;
  tip: string;
  exceptions: string[];
};

export type Box = [number, number, number, number]; // center x, center y, width, height

export type ScanResult = {
  found: boolean;
  confidence: number | null;
  confident: boolean;
  box: Box | null;
  image_size: { width: number; height: number };
  rule: Rule;
  detections: { label: string; confidence: number; box: Box | null }[];
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

/** Upload a local photo (file URI) and get disposal advice. */
export function scan(photoUri: string): Promise<ScanResult> {
  const form = new FormData();
  // React Native's FormData accepts a {uri, name, type} object for files.
  form.append("image", { uri: photoUri, name: "scan.jpg", type: "image/jpeg" } as any);
  return request<ScanResult>("/scan", { method: "POST", body: form });
}

export function getRules(): Promise<Rule[]> {
  return request<Rule[]>("/rules");
}

/** Wake a sleeping server while the user is still lining up their first photo. */
export function warmUp(): void {
  request("/health").catch(() => {});
}
