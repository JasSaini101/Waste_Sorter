# Waste_Sorter
GullHacks 2026 Project

Point your phone camera at something you're about to throw away, and the app tells you how to dispose of it: recycle, compost, donate or trash.

## How it works

```
Phone app (mobile/)  --photo-->  Backend API (backend/)  --image-->  Roboflow model
                     <--JSON---  maps material -> bin    <--boxes--  garbage-classification-3/2
```

The model detects 7 materials: plastic, glass, metal, paper, cardboard, biodegradable and cloth. `backend/disposal_rules.py` turns each one into a bin plus instructions.

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

## Deploy the backend (Render, free)

A hosted backend works from any network (campus Wi-Fi, mobile data, the hackathon venue) and doesn't need your laptop running. `render.yaml` holds the settings.

1. Sign in at https://render.com with GitHub.
2. **New → Blueprint**, pick this repo and the branch that has `render.yaml` (`main` once the PR is merged).
3. When asked for `ROBOFLOW_API_KEY`, paste your Roboflow key. It's stored in Render, never in git.
4. Wait for the deploy, then open `https://<your-service>.onrender.com/health`. It should show `{"ok":true}`.
5. Put that URL in `mobile/.env` as `EXPO_PUBLIC_API_URL` (see [mobile/README.md](mobile/README.md)).

The free tier sleeps after 15 minutes without requests, and the next request takes up to a minute while it wakes. The app pings the server when it opens to hide most of that. Before a demo, open `/health` in a browser to wake it.

Test the model from the command line:

```bash
python backend/main.py path/to/photo.jpg
```

## Mobile app

See [mobile/README.md](mobile/README.md) for setup and the API contract.
