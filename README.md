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

Test the model from the command line:

```bash
python backend/main.py path/to/photo.jpg
```

## Mobile app

See [mobile/README.md](mobile/README.md) for setup and the API contract.
