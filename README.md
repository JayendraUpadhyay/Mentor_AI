# MentorAI — Your Learning Orbit

> Your personal AI learning companion for roadmaps, doubts, notes, and progress.

MentorAI helps students turn confusion into clarity. Enter what you want to learn, get a personalized roadmap, ask doubts in English or Hinglish, convert notes into quizzes, and track your learning progress—all in one beautiful dashboard.

Built for **Dev Connect (MLH)** using the **Google Gemini API**.

## ✨ Features

| Feature | Description |
| --- | --- |
| 🪐 Personalized Roadmaps | Generate topic-wise learning paths based on your goal, level, and available time. |
| 💬 AI Doubt Solver | Ask doubts naturally in English or Hinglish and get clear step-by-step explanations. |
| 📝 Notes to Quiz | Upload handwritten or printed notes and instantly create MCQ quizzes. |
| 📈 Progress Tracking | Track completed topics, learning streaks, quizzes, and accuracy. |
| 🔐 User Authentication | Simple signup and login to keep learning data organized. |

## 🧠 Powered by Gemini

| MentorAI Feature | Gemini Capability |
| --- | --- |
| Roadmap Generator | Structured text generation for personalized study plans |
| Doubt Solver | Multi-turn conversational AI with Hinglish support |
| Notes to Quiz | Vision-based note understanding and MCQ generation |

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Three.js
- **Backend:** FastAPI, Uvicorn, Pydantic
- **AI:** Google Gemini API (`google-genai`)
- **Database:** SQLite

## 📁 Project Structure

```text
mentorai/
├── frontend/                 # React + Vite dashboard
│   ├── src/components/       # Dashboard, Roadmap, Chat, Quiz
│   └── src/lib/api.js        # API integration
├── backend/                  # FastAPI + Gemini backend
│   ├── main.py               # API routes and AI logic
│   ├── requirements.txt
│   └── Dockerfile
└── README.md
```

## 🚀 Run Locally

### Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source venv/bin/activate

# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
cp .env.example .env
```

Add your Gemini API key in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set this in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔌 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create a new account |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/roadmap` | Generate a personalized roadmap |
| `GET` | `/api/roadmap/history/{user_id}` | View saved roadmap history |
| `POST` | `/api/doubt` | Ask a doubt in English or Hinglish |
| `POST` | `/api/notes-quiz` | Upload notes and generate a quiz |
| `GET` / `POST` | `/api/progress/{user_id}` | View or update progress |
| `POST` | `/api/quiz-result/{user_id}` | Save quiz performance |

## 🌐 Deployment

- **Backend:** Deployed on **Render**.
- **Frontend:** Deployed on **Netlify**.
- Set `VITE_API_BASE_URL` in Netlify environment variables to your deployed Render backend URL.
- Add `GEMINI_API_KEY` as a secure environment variable in Render.

## 🧭 How It Works

1. Sign up and enter a learning goal.
2. Generate a roadmap based on your level and timeline.
3. Complete topics to maintain progress and streaks.
4. Ask doubts whenever you feel stuck.
5. Upload notes and test yourself with AI-generated quizzes.

## 🤝 Contributing

Contributions and ideas are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

This project is currently intended for educational and hackathon use.

## 🌐 Live Demo

🚀 **Try MentorAI live:** [https://mentorai-jayendra.netlify.app/](https://mentorai-jayendra.netlify.app/)

## 👨‍💻 Creator

Built with ❤️ by **Jayendra Upadhyay**
