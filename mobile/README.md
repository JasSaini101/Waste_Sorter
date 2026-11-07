# Mobile app (Expo / React Native)

## Run it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. Start the backend (see the main README) with `--host 0.0.0.0`.
3. Set the backend address. Copy `.env.example` to `.env` and put your laptop's Wi-Fi IP in it (`ipconfig` on Windows):
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
   ```
4. Install and start:
   ```bash
   npm install
   npx expo start
   ```
5. Scan the QR code with your phone camera (iPhone) or Expo Go (Android). Phone and laptop must be on the same Wi-Fi.

If the app says it can't reach the server, open `http://<laptop-ip>:8000/health` in the phone's browser. If that fails too, allow Python through Windows Firewall on private networks.

Restart `npx expo start` after changing `.env`.

## Code layout

- `App.tsx`: switches between the three screens (a simple state machine, no navigation library).
- `api.ts`: `scan(photoUri)` and `getRules()`, plus types matching the backend's JSON.
- `screens/ScanScreen.tsx`: camera and shutter button. Shrinks each photo to 640px wide before uploading; the model works at 416x416, so bigger images only slow the upload.
- `screens/ResultScreen.tsx`: full-screen card coloured by bin, with the tip and exceptions. Shows "Probably X?" when confidence is low.
- `screens/LookupScreen.tsx`: searchable list from `GET /rules`, for when the camera can't identify something.

Photo upload uses React Native's `FormData` file format, so scanning works on phones only. The web build (`npm run web`) is useful for checking layout and the lookup screen.

## API contract

Base URL: your laptop's Wi-Fi IP during development (`http://192.168.x.x:8000`), or the deployed URL.

### `POST /scan`

Multipart form with one field, `image` (JPEG or PNG).

```ts
const form = new FormData();
form.append("image", { uri: photo.uri, name: "scan.jpg", type: "image/jpeg" } as any);
const res = await fetch(`${API_URL}/scan`, { method: "POST", body: form });
const data = await res.json();
```

Response:

```json
{
  "found": true,
  "confidence": 0.71,
  "confident": true,
  "box": [137, 91, 120, 150],
  "image_size": { "width": 640, "height": 480 },
  "rule": {
    "key": "METAL",
    "item": "Metal",
    "bin": "recycle",
    "bin_label": "Recycle",
    "color": "#2E7DD7",
    "tip": "Cans and clean foil. Empty and rinse.",
    "exceptions": ["Aerosol cans: only if completely empty.", "..."]
  },
  "detections": [{ "label": "METAL", "confidence": 0.71, "box": [137, 91, 120, 150] }]
}
```

- `found: false`: nothing detected; `rule.bin` is `"unknown"`. Offer a retry and the manual lookup.
- `confident: false`: confidence under 50%; show "Probably {item}?" and let the user confirm.
- `box` is `[center_x, center_y, width, height]` in pixels of `image_size`.
- `bin` is one of `recycle`, `compost`, `donate`, `trash`, `unknown`.

### `GET /rules`

List of every `rule` object above, for the manual lookup screen.
