# Waste_Sorter
GullHacks 2026 Project

Point your phone camera at something you're about to throw away, and the app tells you how to dispose of it: recycle, compost, donate or trash.

## How it works

```
Phone app (mobile/)  --photo-->  Backend API (backend/)  --image-->  Roboflow model
                     <--JSON---  picks the answer,   <--boxes--  3 models, in parallel
                                 maps it -> bin
```

The backend runs three Roboflow models on every photo, at the same time:

| Model | Detects |
|---|---|
| `garbage-classification-3/2` | 7 materials: plastic, glass, metal, paper, cardboard, biodegradable, cloth |
| `yolov8n-640` (stock COCO) | Electronics: phones, laptops, keyboards, mice, remotes, TVs, small appliances |
| [`battery-detection-and-counts/1`](https://universe.roboflow.com/mrkhai/battery-detection-and-counts) | AA, AAA, 9V, coin and 18650 batteries |

The material model alone would call a phone "metal" and a battery "paper" and say "Recycle", which is dangerous: batteries start fires in recycling trucks. So electronics and batteries override the material result and go to **E-waste drop-off**. The battery model also mistakes cans and boxes for batteries, so a battery only wins when it's more confident than the material model. The thresholds are at the top of `backend/classifier.py`.

`backend/disposal_rules.py` turns the answer into a bin plus instructions.

The phone never talks to Roboflow directly, so the API key stays on the server.

## Backend setup

```bash
python -m venv .venv
.venv/Scripts/activate          # Windows; use source .venv/bin/activate on macOS/Linux
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # then put your Roboflow key in it
```

Run the API (from `backend/`):

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

- Interactive docs: http://localhost:8000/docs
- From a phone on the same Wi-Fi: `http://<your-laptop-ip>:8000`

Test the model from the command line:

```bash
python backend/main.py path/to/photo.jpg
```

### AI second opinion (optional Gemini key)

The Roboflow models are often wrong, for example calling a plastic tub "glass" or a mug a "battery". So `backend/referee.py` also asks Google's Gemini vision model, at the same time as Roboflow, and its answer wins.

On the 67-photo test set (`backend/eval`):

| Mode | Right item | Right bin |
|---|---|---|
| Roboflow only | 58% | 72% |
| Gemini on unclear scans | 94% | 99% |
| Gemini on every scan (default) | 99% | 99% |

Gemini also adds categories the models don't have: **Trash** (mugs, chip bags, styrofoam), plus a specific item name the app shows ("Looks like: AA battery"). Scans take about 2–3 seconds.

To turn it on:
1. Get a free key at https://aistudio.google.com → **Get API key**. No billing is needed.
2. Put it in `backend/.env` as `GEMINI_API_KEY=...`, and add it to Render (`waste-sorter-api` → **Environment**).
3. Check `/health` shows `"second_opinion_configured": true`.

Notes:
- The free tier allows about 10 requests a minute, and Google may use free-tier images to improve its models.
- If Gemini is unavailable or rate-limited, the Roboflow answer is used.
- `SECOND_OPINION=unclear` asks only when Roboflow is unsure (fewer calls); `off` disables it.

### Measuring accuracy

```bash
python backend/eval/fetch_test_set.py   # ~70 labeled photos from Wikimedia Commons (not committed)
python backend/eval/evaluate.py         # right item / right bin, per class, every mistake
```

The models' answers are saved, so re-scoring after a change to `classifier.decide()` takes a second. With a Gemini key, the report compares Roboflow only, Gemini on unclear scans, and Gemini on every scan.

### Nearest drop-off spots (optional Google key)

For electronics, batteries and clothes, the result screen asks for the user's location and lists the 3 closest drop-off spots, using the Google Places API.
- If the user says no, the server sends back a note asking them to enable location.
- Without a key, the app shows a Google Maps search link instead of the list.

To turn the list on:
1. In the [Google Cloud console](https://console.cloud.google.com/), create a project and turn on billing. A hackathon's usage stays within Google's free monthly allowance.
2. Enable **Places API (New)**, then create an API key under **APIs & Services → Credentials**.
3. Restrict the key to Places API (New).
4. Put it in `backend/.env` as `GOOGLE_MAPS_API_KEY=...`, and add the same variable in Render (`waste-sorter-api` → **Environment**).
5. Check it: `/health` shows `"nearby_configured": true` once the server can see the key (for Render, after the redeploy finishes).

The key stays on the server and is sent to Google in a header. The user's location is rounded to about 1 km before it's sent to Google, and it isn't stored or logged.

## Deploy (Render, free)

`render.yaml` deploys two services from `main`:

| Service | What it is | URL |
|---|---|---|
| `waste-sorter-api` | The backend API | https://waste-sorter-api.onrender.com |
| `waste-sorter-web` | The web version of the app: open it in any phone browser, no Expo Go or sign-in needed | `https://waste-sorter-web.onrender.com` (check the Render dashboard for the exact URL) |

Both work from any network (campus Wi-Fi, mobile data, the hackathon venue) and don't need a laptop running.

First-time setup:
1. Sign in at https://render.com with GitHub.
2. **New → Blueprint**, pick this repo and the `main` branch. If the Blueprint already exists, Render picks up new services from `render.yaml` on its next sync.
3. When asked for `ROBOFLOW_API_KEY`, paste your Roboflow key. It's stored in Render, never in git.
4. Check `https://waste-sorter-api.onrender.com/health` shows `{"ok":true}`, then open the web app's URL on your phone.

Every merge to `main` redeploys both.

The website has the API's URL built in, through `EXPO_PUBLIC_API_URL` in `render.yaml`. If the API's URL ever changes, update it there.

The free API sleeps after 15 minutes without requests, and the next request takes up to a minute while it wakes. The app pings it on open to hide most of that. **Before a demo, open `/health` in a browser to wake it.**

## App

Two ways to use it:
- **Web (easiest, for teammates and judges):** open the `waste-sorter-web` URL on a phone and allow the camera. Turn the URL into a QR code for your slides.
- **Expo Go (for development):** see [mobile/README.md](mobile/README.md). Each teammate signs in with their own Expo account.

See [mobile/README.md](mobile/README.md) for code layout and the API contract.
