# MentorAI — Your Personal AI Learning Co-Pilot

Built for **Dev Connect** (MLH, Gemini-powered) — deadline July 13, 2026.

A student types any goal ("DSA seekhna hai") or uploads a photo of handwritten notes, and Gemini builds
a complete personalized learning journey: roadmap → doubt-solving chat → auto-generated quiz — all in
one dark, glassmorphic, deep-space dashboard.

## What it uses Gemini for

| Feature | Gemini capability |
|---|---|
| Roadmap Generator | text generation + structured reasoning → JSON curriculum |
| Doubt Solver Chat | text generation, Hinglish-aware, multi-turn |
| Notes → Quiz | vision (reads handwritten/printed notes) + generation → MCQs |

## Project structure

```
mentorai/
  backend/    FastAPI + Gemini API (google-genai SDK), SQLite progress tracking
  frontend/   React + Vite + Tailwind, dark cyberpunk/glassmorphism UI
```

See `backend/README.md` and `frontend/README.md` for setup and deploy steps for each half.

## Quickstart (both halves, local)

```bash
# Terminal 1 — backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your Gemini API key (https://aistudio.google.com/apikey)
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173.

## Deploy (matches your existing stack — same pattern as Cure AI)

- **Backend** → Hugging Face Spaces (Docker, `backend/Dockerfile` included) or Render.
- **Frontend** → Vercel, root directory `frontend/`, env var `VITE_API_BASE_URL` pointed at the deployed backend.

## 3-day build status

- [x] Day 1 — Backend + Gemini integration (roadmap gen, doubt solver, notes-to-quiz, progress API) — **done, tested**
- [x] Day 2 — Frontend dashboard (glassmorphism UI, all 3 features wired to backend) — **done, builds clean**
- [ ] Day 3 — Deploy both halves, record demo video, submit on Devpost

## Notes for the demo video

Good flow to record: type a goal on Roadmap → show the glowing constellation path generate → mark a
topic done (streak updates on Dashboard) → ask a Hinglish doubt in chat → upload a notes photo and take
the auto-generated quiz. That covers all 3 Gemini capabilities in under 2 minutes.
