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
