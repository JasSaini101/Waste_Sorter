# Mobile app (Expo / React Native)

Not built yet. To start:

```bash
npx create-expo-app@latest . --template blank
npx expo install expo-camera expo-image-manipulator
npx expo start   # scan the QR code with the Expo Go app
```

## Screens

1. **Scan**: full-screen camera with a shutter button.
2. **Result**: card colored by `rule.color`, showing `rule.item`, `rule.bin_label`, `rule.tip` and `rule.exceptions`.
3. **Manual lookup**: list from `GET /rules`, for when the camera can't identify something.

Resize photos to about 640px wide (`expo-image-manipulator`) before uploading. The model works at 416x416, so bigger images only slow the upload.

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
