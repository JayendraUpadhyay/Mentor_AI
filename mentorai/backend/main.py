"""
MentorAI Backend — FastAPI + Gemini API
Endpoints:
  POST /api/roadmap        -> generate a structured learning roadmap (text gen + reasoning)
  POST /api/doubt          -> Hinglish-capable doubt-solving chat (text gen)
  POST /api/notes-quiz     -> upload handwritten/PDF notes photo -> extract + generate MCQ quiz (vision)
  GET  /api/progress/{uid} -> fetch progress/streak data
  POST /api/progress/{uid} -> update progress (mark topic done, bump streak)
"""

import os
import json
import sqlite3
import base64
import hashlib
import secrets
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[WARN] GEMINI_API_KEY not set. Set it in .env before running for real.")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Gemini 2.0 Flash was retired. Gemini 3.5 Flash is the current stable,
# multimodal Flash model and works for text, chat, and note-image inputs.
TEXT_MODEL = os.environ.get("GEMINI_TEXT_MODEL", "gemini-3.5-flash")
VISION_MODEL = os.environ.get("GEMINI_VISION_MODEL", "gemini-3.5-flash")

app = FastAPI(title="MentorAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your deployed frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "mentorai.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS progress (
            user_id TEXT PRIMARY KEY,
            completed_topics TEXT DEFAULT '[]',
            streak INTEGER DEFAULT 0,
            last_active TEXT,
            total_quizzes INTEGER DEFAULT 0,
            total_correct INTEGER DEFAULT 0
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS roadmaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            goal TEXT NOT NULL,
            level TEXT,
            roadmap_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


init_db()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class RoadmapRequest(BaseModel):
    goal: str
    level: Optional[str] = "beginner"  # beginner | intermediate | advanced
    duration_weeks: Optional[int] = 4
    user_id: Optional[str] = None  # if provided, roadmap is saved to history


class ChatMessage(BaseModel):
    role: str  # "user" | "model"
    content: str


class DoubtRequest(BaseModel):
    message: str
    history: Optional[list[ChatMessage]] = []
    hinglish: Optional[bool] = True


class ProgressUpdate(BaseModel):
    topic_id: str
    completed: bool = True


class QuizResult(BaseModel):
    total: int
    correct: int


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def extract_json(text: str) -> dict:
    """Gemini sometimes wraps JSON in ```json fences — strip them before parsing."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()
    # Models occasionally leave a trailing comma despite JSON mode. Clean that
    # harmless formatting error before using the stricter recovery retry below.
    cleaned = cleaned.replace(",\n}", "\n}").replace(",\n]", "\n]")
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Model returned invalid JSON: {e}")


def raise_gemini_error(error: Exception) -> None:
    """Turn provider errors into useful, safe API responses for the UI."""
    message = str(error)
    if "429" in message or "RESOURCE_EXHAUSTED" in message or "quota" in message.lower():
        raise HTTPException(
            status_code=429,
            detail="MentorAI's Gemini quota is currently unavailable. Add billing or use an API key with available quota, then try again.",
        )
    raise HTTPException(status_code=502, detail="MentorAI could not reach Gemini. Please try again in a moment.")


def hash_password(password: str) -> str:
    """PBKDF2-SHA256 with a random salt — stdlib only, no extra dependency."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100_000)
    return f"{salt}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest_hex = stored.split(":")
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100_000)
    return digest.hex() == digest_hex


# ---------------------------------------------------------------------------
# 0. Auth (simple email/password — no sessions/JWT, minimal by design)
# ---------------------------------------------------------------------------


@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    name = req.name.strip()
    email = req.email.strip().lower()
    if not name or not email or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Name, a valid email, and a password (4+ chars) are required")

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = "user_" + secrets.token_hex(6)
    conn.execute(
        "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, name, email, hash_password(req.password), datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"success": True, "user_id": user_id, "name": name, "email": email}


@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"success": True, "user_id": row["id"], "name": row["name"], "email": row["email"]}


# ---------------------------------------------------------------------------
# 1. Roadmap Generator
# ---------------------------------------------------------------------------

ROADMAP_SYSTEM_PROMPT = """You are MentorAI, an expert curriculum designer and learning strategist.
Given a learning goal, level, and duration, produce a structured learning roadmap PLUS an upfront
overview that helps the learner understand what they're getting into before they start.
Respond with ONLY valid JSON (no markdown fences, no preamble) matching this exact schema:

{
  "goal": "string",
  "level": "string",
  "total_weeks": number,
  "overview": {
    "difficulty": "Easy" | "Medium" | "Hard",
    "difficulty_note": "string (2-3 sentences on why it's this difficulty for someone at this level)",
    "daily_hours": number (realistic hours/day needed to hit the given duration),
    "approach": "string (3-4 sentences: the recommended strategy/order of attack for this goal)",
    "prerequisites": ["string", "string"]  (things the learner should already know or set up before starting; empty array if none)
  },
  "topics": [
    {
      "id": "string (slug)",
      "title": "string",
      "order": number,
      "time_estimate_days": number,
      "subtopics": ["string", "string"],
      "resources_hint": "string (one short suggestion of what to search/study)"
    }
  ]
}

Make 5-10 topics, ordered logically from fundamentals to advanced, tailored to the given level and duration.
Be honest and specific in the overview — don't hedge, give real numbers and real guidance.
"""


@app.post("/api/roadmap")
def generate_roadmap(req: RoadmapRequest):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    prompt = (
        f"Goal: {req.goal}\n"
        f"Level: {req.level}\n"
        f"Duration: {req.duration_weeks} weeks\n"
        "Generate the roadmap JSON now."
    )
    try:
        response = client.models.generate_content(
            model=TEXT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=ROADMAP_SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        try:
            roadmap = extract_json(response.text)
        except HTTPException:
            recovery = client.models.generate_content(
                model=TEXT_MODEL,
                contents=(
                    prompt
                    + "\nReturn the complete roadmap again. Output only one valid JSON object. "
                    + "Use double-quoted keys and strings, put commas between every array/object item, "
                    + "and do not use markdown fences."
                ),
                config=types.GenerateContentConfig(
                    system_instruction=ROADMAP_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                ),
            )
            roadmap = extract_json(recovery.text)

        roadmap_id = None
        if req.user_id:
            conn = get_db()
            cur = conn.execute(
                "INSERT INTO roadmaps (user_id, goal, level, roadmap_json, created_at) VALUES (?, ?, ?, ?, ?)",
                (req.user_id, req.goal, req.level, json.dumps(roadmap), datetime.now().isoformat()),
            )
            roadmap_id = cur.lastrowid
            conn.commit()
            conn.close()
            roadmap["id"] = roadmap_id

        return {"success": True, "roadmap": roadmap}
    except HTTPException:
        raise
    except Exception as e:
        raise_gemini_error(e)


@app.get("/api/roadmap/history/{user_id}")
def get_roadmap_history(user_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, goal, level, created_at FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return {
        "success": True,
        "history": [
            {"id": r["id"], "goal": r["goal"], "level": r["level"], "created_at": r["created_at"]} for r in rows
        ],
    }


@app.get("/api/roadmap/detail/{roadmap_id}")
def get_roadmap_detail(roadmap_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM roadmaps WHERE id = ?", (roadmap_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    roadmap = json.loads(row["roadmap_json"])
    roadmap["id"] = row["id"]
    return {"success": True, "roadmap": roadmap}


@app.delete("/api/roadmap/{roadmap_id}")
def delete_roadmap(roadmap_id: int):
    conn = get_db()
    conn.execute("DELETE FROM roadmaps WHERE id = ?", (roadmap_id,))
    conn.commit()
    conn.close()
    return {"success": True}


# ---------------------------------------------------------------------------
# 2. Doubt Solver Chat (Hinglish-aware)
# ---------------------------------------------------------------------------

DOUBT_SYSTEM_PROMPT = """You are MentorAI, a friendly, patient tutor who explains concepts step-by-step.
If the user writes in Hinglish (Hindi-English mix), reply in the same natural Hinglish style —
casual, clear, and encouraging, like a senior explaining to a junior. If they write in plain English,
reply in plain English. Always break down explanations into clear steps, use small examples,
and check understanding briefly at the end. Keep answers focused — no unnecessary fluff.
"""


@app.post("/api/doubt")
def solve_doubt(req: DoubtRequest):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    history_turns = req.history or []
    while history_turns and history_turns[0].role != "user":
        history_turns = history_turns[1:]

    gemini_history = [
        types.Content(role=turn.role, parts=[types.Part.from_text(text=turn.content)])
        for turn in history_turns
    ]

    try:
        chat = client.chats.create(
            model=TEXT_MODEL,
            history=gemini_history,
            config=types.GenerateContentConfig(system_instruction=DOUBT_SYSTEM_PROMPT),
        )
        response = chat.send_message(req.message)
        return {"success": True, "response": response.text}
    except Exception as e:
        raise_gemini_error(e)


# ---------------------------------------------------------------------------
# 3. Notes-to-Quiz (Vision)
# ---------------------------------------------------------------------------

QUIZ_SYSTEM_PROMPT = """You are MentorAI's multimodal notes module. You will be given a photo or PDF of handwritten or
printed study notes. First read and understand the content, then generate a quiz to test the reader's
understanding of exactly what's in the notes (do not invent unrelated topics).

Respond with ONLY valid JSON (no markdown fences) matching this schema:

{
  "extracted_topic": "string (short label for what the notes are about)",
  "extracted_summary": "string (2-3 sentence summary of the notes content)",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": number (0-3),
      "explanation": "string (why this answer is correct, 1-2 sentences)"
    }
  ]
}

Generate exactly the number of questions requested in the user's message, covering the key points
in the notes, ordered from easy to harder. If the notes don't have enough distinct content to support
that many non-repetitive questions, generate as many good, non-redundant questions as the content
genuinely supports instead of padding with filler.
"""


@app.post("/api/notes-quiz")
async def notes_to_quiz(file: UploadFile = File(...), num_questions: int = Form(6)):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type {file.content_type}. Upload a JPEG, PNG, WEBP, or PDF file."
        )

    num_questions = max(3, min(int(num_questions), 15))

    image_bytes = await file.read()

    try:
        response = client.models.generate_content(
            model=VISION_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
                f"Read these notes and generate a quiz with exactly {num_questions} questions now.",
            ],
            config=types.GenerateContentConfig(
                system_instruction=QUIZ_SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        quiz = extract_json(response.text)
        return {"success": True, "quiz": quiz}
    except HTTPException:
        raise
    except Exception as e:
        raise_gemini_error(e)


# ---------------------------------------------------------------------------
# 4. Progress Tracker
# ---------------------------------------------------------------------------


@app.get("/api/progress/{user_id}")
def get_progress(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        conn.execute("INSERT INTO progress (user_id, last_active) VALUES (?, ?)", (user_id, str(date.today())))
        conn.commit()
        row = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return {
        "user_id": row["user_id"],
        "completed_topics": json.loads(row["completed_topics"]),
        "streak": row["streak"],
        "last_active": row["last_active"],
        "total_quizzes": row["total_quizzes"],
        "total_correct": row["total_correct"],
    }


@app.post("/api/progress/{user_id}")
def update_progress(user_id: str, update: ProgressUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()
    today = date.today()

    if not row:
        conn.execute(
            "INSERT INTO progress (user_id, completed_topics, streak, last_active) VALUES (?, ?, ?, ?)",
            (user_id, "[]", 0, str(today)),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()

    completed = json.loads(row["completed_topics"])
    if update.completed and update.topic_id not in completed:
        completed.append(update.topic_id)
    elif not update.completed and update.topic_id in completed:
        completed.remove(update.topic_id)

    last_active = datetime.strptime(row["last_active"], "%Y-%m-%d").date()
    streak = row["streak"]
    if last_active == today:
        pass
    elif last_active == today - timedelta(days=1):
        streak += 1
    else:
        streak = 1

    conn.execute(
        "UPDATE progress SET completed_topics = ?, streak = ?, last_active = ? WHERE user_id = ?",
        (json.dumps(completed), streak, str(today), user_id),
    )
    conn.commit()
    conn.close()

    return {"success": True, "completed_topics": completed, "streak": streak}


@app.post("/api/quiz-result/{user_id}")
def record_quiz_result(user_id: str, result: QuizResult):
    """Persist quiz performance so the dashboard can adapt its next study recommendation."""
    if result.total <= 0 or result.correct < 0 or result.correct > result.total:
        raise HTTPException(status_code=400, detail="Quiz score is invalid")

    conn = get_db()
    row = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        conn.execute("INSERT INTO progress (user_id, last_active) VALUES (?, ?)", (user_id, str(date.today())))
        conn.commit()
        row = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchone()

    total_quizzes = row["total_quizzes"] + result.total
    total_correct = row["total_correct"] + result.correct
    conn.execute(
        "UPDATE progress SET total_quizzes = ?, total_correct = ? WHERE user_id = ?",
        (total_quizzes, total_correct, user_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "total_quizzes": total_quizzes, "total_correct": total_correct}


@app.get("/")
def root():
    return {
        "status": "MentorAI backend is running",
        "endpoints": [
            "/api/auth/signup",
            "/api/auth/login",
            "/api/roadmap",
            "/api/roadmap/history/{user_id}",
            "/api/roadmap/detail/{roadmap_id}",
            "/api/doubt",
            "/api/notes-quiz",
            "/api/progress/{user_id}",
            "/api/quiz-result/{user_id}",
        ],
    }