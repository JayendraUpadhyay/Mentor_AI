import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import RoadmapGenerator from "./components/RoadmapGenerator.jsx";
import DoubtChat from "./components/DoubtChat.jsx";
import NotesToQuiz from "./components/NotesToQuiz.jsx";
import Login from "./components/Login.jsx";
import { getProgress, updateProgress, recordQuizResult } from "./lib/api.js";

const MOBILE_NAV = [
  { id: "dashboard", label: "Home", icon: "◈" },
  { id: "roadmap", label: "Roadmap", icon: "✦" },
  { id: "doubt", label: "Doubt", icon: "◎" },
  { id: "quiz", label: "Quiz", icon: "▣" },
];

function getStoredAuth() {
  const raw = localStorage.getItem("mentorai_auth");
  return raw ? JSON.parse(raw) : null;
}

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth);
  const [view, setView] = useState("dashboard");
  const [progress, setProgress] = useState(null);
  const [roadmap, setRoadmapState] = useState(null);

  const userId = auth?.userId || null;

  useEffect(() => {
    if (!userId) return;

    const savedRoadmap = localStorage.getItem(`mentorai_roadmap_${userId}`);
    setRoadmapState(savedRoadmap ? JSON.parse(savedRoadmap) : null);

    getProgress(userId)
      .then(setProgress)
      .catch(() => setProgress({ completed_topics: [], streak: 0, total_quizzes: 0, total_correct: 0 }));
  }, [userId]);

  function handleAuthed({ userId: newUserId, name, email }) {
    const authData = { userId: newUserId, name, email };
    localStorage.setItem("mentorai_auth", JSON.stringify(authData));
    setAuth(authData);
    setView("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("mentorai_auth");
    setAuth(null);
    setProgress(null);
    setRoadmapState(null);
    setView("dashboard");
  }

  function setRoadmap(r) {
    setRoadmapState(r);
    if (userId) localStorage.setItem(`mentorai_roadmap_${userId}`, JSON.stringify(r));
  }

  async function handleToggleTopic(topicId, completed) {
    try {
      const data = await updateProgress(userId, topicId, completed);
      setProgress((prev) => ({ ...prev, completed_topics: data.completed_topics, streak: data.streak }));
    } catch (err) {
      console.error("progress update failed", err);
    }
  }

  async function handleQuizComplete(total, correct) {
    try {
      const data = await recordQuizResult(userId, total, correct);
      setProgress((prev) => ({ ...prev, total_quizzes: data.total_quizzes, total_correct: data.total_correct }));
    } catch (err) {
      console.error("quiz result save failed", err);
      setProgress((prev) => ({
        ...prev,
        total_quizzes: (prev?.total_quizzes || 0) + total,
        total_correct: (prev?.total_correct || 0) + correct,
      }));
    }
  }

  return (
    <div className="relative min-h-screen font-body">
      <style>{`
        @keyframes cosmic-drift-a {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 40px); }
        }
        @keyframes cosmic-drift-b {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-70px, -30px); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          backgroundColor: "#05060f",
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px, rgba(231,233,245,0.6), transparent), radial-gradient(1px 1px at 140px 90px, rgba(231,233,245,0.4), transparent), radial-gradient(1.5px 1.5px at 260px 50px, rgba(62,233,255,0.5), transparent), radial-gradient(1px 1px at 320px 160px, rgba(231,233,245,0.4), transparent), radial-gradient(1.5px 1.5px at 400px 220px, rgba(155,92,255,0.5), transparent), radial-gradient(1px 1px at 480px 40px, rgba(231,233,245,0.5), transparent)",
          backgroundRepeat: "repeat",
          backgroundSize: "500px 500px",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          background:
            "radial-gradient(600px circle at 15% 20%, rgba(155,92,255,0.08), transparent 60%), radial-gradient(500px circle at 85% 75%, rgba(62,233,255,0.07), transparent 60%)",
        }}
      />
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "5%",
            width: 480,
            height: 480,
            borderRadius: "999px",
            filter: "blur(70px)",
            opacity: 0.6,
            background: "radial-gradient(circle, rgba(155,92,255,0.75), transparent 70%)",
            animation: "cosmic-drift-a 22s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "0%",
            width: 560,
            height: 560,
            borderRadius: "999px",
            filter: "blur(70px)",
            opacity: 0.6,
            background: "radial-gradient(circle, rgba(62,233,255,0.65), transparent 70%)",
            animation: "cosmic-drift-b 26s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "55%",
            width: 380,
            height: 380,
            borderRadius: "999px",
            filter: "blur(70px)",
            opacity: 0.6,
            background: "radial-gradient(circle, rgba(255,62,165,0.55), transparent 70%)",
            animation: "cosmic-drift-a 30s ease-in-out infinite reverse",
          }}
        />
      </div>

      {!auth ? (
        <Login onAuthed={handleAuthed} />
      ) : (
        <>
          <Sidebar active={view} onChange={setView} streak={progress?.streak || 0} user={auth} onLogout={handleLogout} />

          <main className="app-main mx-auto max-w-[1440px] px-4 pb-24 pt-5 md:px-8 lg:ml-[290px] lg:px-12 lg:pb-12 lg:pt-9">
            {view === "dashboard" && (
              <Dashboard progress={progress} roadmap={roadmap} onNavigate={setView} />
            )}
            {view === "roadmap" && (
              <RoadmapGenerator
                roadmap={roadmap}
                setRoadmap={setRoadmap}
                progress={progress}
                onToggleTopic={handleToggleTopic}
                userId={userId}
              />
            )}
            {view === "doubt" && <DoubtChat />}
            {view === "quiz" && <NotesToQuiz onQuizComplete={handleQuizComplete} />}
          </main>

          {/* Mobile bottom nav */}
          <nav className="glass-bright fixed bottom-0 left-0 right-0 z-20 flex justify-around p-2 md:hidden">
            {MOBILE_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-2 text-xs ${
                  view === item.id ? "text-cyan-glow" : "text-ink-400"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}