# MentorAI Backend

FastAPI backend powering MentorAI's 3 Gemini-based features.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/roadmap` | Generate structured JSON learning roadmap from a goal |
| POST | `/api/doubt` | Hinglish-aware doubt-solving chat |
| POST | `/api/notes-quiz` | Upload a notes photo → extract content + generate MCQ quiz |
| GET | `/api/progress/{user_id}` | Fetch streak + completed topics |
| POST | `/api/progress/{user_id}` | Mark a topic complete, bump streak |

## Local setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # then paste your Gemini API key into .env
uvicorn main:app --reload --port 8000
```

Get a free Gemini API key at https://aistudio.google.com/apikey

## Test it

```bash
curl -X POST http://localhost:8000/api/roadmap \
  -H "Content-Type: application/json" \
  -d '{"goal": "DSA seekhna hai", "level": "beginner", "duration_weeks": 6}'
```

## Deploy (Hugging Face Spaces — Docker)

1. Create a new Space → SDK: **Docker**.
2. Push this `backend/` folder's contents to the Space repo root.
3. In Space Settings → **Repository secrets**, add `GEMINI_API_KEY`.
4. Space builds automatically from the included `Dockerfile` and serves on port 7860.

## Deploy (Render)

1. New Web Service → connect repo → root directory `backend/`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable `GEMINI_API_KEY`.

Once deployed, copy the live URL into the frontend's `.env` as `VITE_API_BASE_URL`.
