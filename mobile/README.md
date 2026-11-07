# Mobile app (Expo / React Native)

## Run it on your phone (works on any network)

Use this on campus Wi-Fi, eduroam or at the hackathon venue, where devices usually can't reach each other directly.

1. Install **Expo Go** from the App Store or Google Play.
2. Deploy the backend to Render (see the main README) and check `https://<your-service>.onrender.com/health` works.
3. Copy `.env.example` to `.env` and set the backend address:
   ```
   EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com
   ```
4. Install and start with a tunnel:
   ```bash
   npm install
   npm run tunnel
   ```
5. Scan the QR code with your phone camera (iPhone) or Expo Go (Android). Your phone can be on any network, even mobile data.

The tunnel sends the app's code through Expo's tunnel service, so loading is slower than on local Wi-Fi. Restart after changing `.env`.

## Run it on home Wi-Fi (faster, no deploy needed)

Only works on a network that lets devices talk to each other, and with any VPN on the laptop turned off.

1. Start the backend locally (see the main README) with `--host 0.0.0.0`.
2. In `.env`, use your laptop's Wi-Fi IP (`ipconfig` on Windows): `EXPO_PUBLIC_API_URL=http://192.168.x.x:8000`.
3. Run `npx expo start` and scan the QR code. Phone and laptop must be on the same Wi-Fi.

If you get timeouts, open `http://<laptop-ip>:8000/health` in the phone's browser. If that doesn't load, the network or a VPN is blocking it; use the tunnel setup above.

## Code layout

- `App.tsx`: switches between the three screens (a simple state machine, no navigation library).
- `api.ts`: `scan(photoUri)`, `getRules()` and `warmUp()` (wakes a sleeping Render server when the app opens), plus types matching the backend's JSON.
- `screens/ScanScreen.tsx`: camera and shutter button. Shrinks each photo to 640px wide before uploading; the model works at 416x416, so bigger images only slow the upload.
- `screens/ResultScreen.tsx`: full-screen card coloured by bin, with the tip and exceptions. Shows "Probably X?" when confidence is low.
- `screens/LookupScreen.tsx`: searchable list from `GET /rules`, for when the camera can't identify something.

Photo upload uses React Native's `FormData` file format, so scanning works on phones only. The web build (`npm run web`) is useful for checking layout and the lookup screen.

## API contract

Base URL: the deployed Render URL, or your laptop's Wi-Fi IP during development (`http://192.168.x.x:8000`).

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
