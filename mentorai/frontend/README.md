# MentorAI Frontend

React + Tailwind dashboard — dark cyberpunk/glassmorphism theme, deep-space aesthetic.

## Local setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your backend URL (default: http://localhost:8000)
npm run dev
```

Opens at http://localhost:5173 — make sure the backend is running first.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## Deploy (Vercel)

1. Import the repo → set **root directory** to `frontend/`.
2. Framework preset: Vite.
3. Add environment variable `VITE_API_BASE_URL` = your deployed backend URL (e.g. Hugging Face Space or Render URL).
4. Deploy.

## Structure

```
src/
  components/
    Sidebar.jsx          desktop nav + streak widget
    Dashboard.jsx         overview, progress rings, quick actions
    RoadmapGenerator.jsx  goal → Gemini roadmap, constellation-style path view
    DoubtChat.jsx          Hinglish doubt-solving chat
    NotesToQuiz.jsx       image upload → Gemini vision → interactive MCQ quiz
    ProgressRing.jsx      reusable glowing SVG progress ring
  lib/api.js             all backend API calls
  App.jsx                 layout, view routing, shared state
  index.css               starfield background, glass utilities
```
