# Mobile app (Expo / React Native)

**Just want to use the app?** Open the deployed website (`waste-sorter-web` on Render, see the main README) on your phone. No Expo Go or sign-in needed. The steps below are for developing the app.

## Run it on your phone with Expo Go (works on any network)

Use this on campus Wi-Fi, eduroam or at the hackathon venue, where devices usually can't reach each other directly.

**Sign-in:** Expo Go only opens a dev server run by the same Expo account. Each teammate signs in with **their own** Expo account, on their own laptop (`npx expo login`) and in Expo Go on their phone, and runs their own copy. On Windows, browser sign-in can crash; use `npx expo login --username <you>` instead.

1. Install **Expo Go** from the App Store or Google Play.
2. Copy `.env.example` to `.env` and set the backend address:
   ```
   EXPO_PUBLIC_API_URL=https://waste-sorter-api.onrender.com
   ```
3. Install and start with a tunnel:
   ```bash
   npm install
   npm run tunnel
   ```
4. Scan the QR code with your phone camera (iPhone) or Expo Go (Android). Your phone can be on any network, even mobile data.

The tunnel sends the app's code through Expo's tunnel service, so loading is slower than on local Wi-Fi. Restart after changing `.env`.

## Run it on home Wi-Fi (faster, no deploy needed)

Only works on a network that lets devices talk to each other, and with any VPN on the laptop turned off.

1. Start the backend locally (see the main README) with `--host 0.0.0.0`.
2. In `.env`, use your laptop's Wi-Fi IP (`ipconfig` on Windows): `EXPO_PUBLIC_API_URL=http://192.168.x.x:8000`.
3. Run `npx expo start` and scan the QR code. Phone and laptop must be on the same Wi-Fi.

If you get timeouts, open `http://<laptop-ip>:8000/health` in the phone's browser. If that doesn't load, the network or a VPN is blocking it; use the tunnel setup above.

## Code layout

- `App.tsx`: switches between the three screens (a simple state machine, no navigation library).
- `api.ts`: `scan(photoUri, coords)`, `getNearby()`, `getRules()` and `warmUp()` (wakes a sleeping Render server when the app opens), plus types matching the backend's JSON.
- `screens/ScanScreen.tsx`: camera and shutter button. Shrinks each photo to 640px wide before uploading; the model works at 416x416, so bigger images only slow the upload.
- `screens/ResultScreen.tsx`: full-screen card coloured by bin, with the tip and exceptions. Shows "Probably X?" when confidence is low.
- `components/NearbySpots.tsx`: "Nearest drop-off spots" card on the result screen for e-waste, batteries and clothes. Asks for location the first time it's needed.
- `location.ts`: `currentCoords(ask)` wraps `expo-location`; works on web through the browser's location prompt.
- `screens/LookupScreen.tsx`: searchable list from `GET /rules`, for when the camera can't identify something.

The same code runs as a website: `scan()` in `api.ts` uploads the photo as a browser `Blob` on web and as a React Native file on phones. Try the web version locally with `npm run web`. Browsers only allow the camera on `https://` pages or `localhost`.

Build the website the way Render does:
```bash
npx expo export --platform web   # output in dist/
```

## API contract

Base URL: the deployed Render URL, or your laptop's Wi-Fi IP during development (`http://192.168.x.x:8000`).

### `POST /scan`

Multipart form with the field `image` (JPEG or PNG), plus optional `lat` and `lon`. Send them only if the user already allowed location access.

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
    "exceptions": ["Aerosol cans: only if completely empty.", "..."],
    "dropoff": null
  },
  "nearby": null,
  "detections": [{ "label": "METAL", "name": "METAL", "confidence": 0.71, "box": [137, 91, 120, 150] }]
}
```

- `found: false`: nothing detected; `rule.bin` is `"unknown"`. Offer a retry and the manual lookup.
- `confident: false`: confidence under 50%; show "Probably {item}?" and let the user confirm.
- `box` is `[center_x, center_y, width, height]` in pixels of `image_size`.
- `bin` is one of `recycle`, `compost`, `donate`, `ewaste`, `trash`, `unknown`.
- `detections[].label` is the rule key (`METAL`, `ELECTRONICS`, `BATTERY`...); `name` is what the model saw (`cell phone`, `AA Battery`...).

- `rule.dropoff` is a Google Maps search phrase (e.g. `"battery recycling"`) for items that need a drop-off spot (`ELECTRONICS`, `BATTERY`, `CLOTH`), otherwise `null`.
- `nearby` is `null` unless `rule.dropoff` is set. Then it's:

```json
{
  "query": "battery recycling",
  "places": [{ "name": "Battery Drop-off", "address": "123 Main St", "distance_miles": 1.2, "maps_url": "https://maps.google.com/?cid=..." }],
  "search_url": "https://www.google.com/maps/search/?api=1&query=battery+recycling",
  "needs_location": false,
  "note": null
}
```

  When `places` is empty, `note` says why. With no `lat`/`lon`, `needs_location` is `true` and `note` is "Enable location permission if you want to see the closest locations near you for this."

### `POST /nearby`

JSON `{ "key": "BATTERY", "lat": 38.37, "lon": -75.6 }` (lat/lon may be `null`). Returns the `nearby` object above, or `null` for items that go in a home bin. Used after the user allows location, and for items picked on the lookup screen. It's a POST so the location stays out of URLs and server logs.

### `GET /rules`

List of every `rule` object above, for the manual lookup screen.
