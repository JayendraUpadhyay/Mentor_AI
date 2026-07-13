import { useState, useRef } from "react";
import { login, signup } from "../lib/api.js";

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = mode === "login" ? await login({ email, password }) : await signup({ name, email, password });
      onAuthed({ userId: data.user_id, name: data.name, email: data.email });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 8 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    duration: 8 + Math.random() * 10,
    delay: Math.random() * 8,
  }));

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflow: "hidden",
        backgroundColor: "#05060f",
      }}
    >
      <style>{`
        @keyframes driftA { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(70px, 40px); } }
        @keyframes driftB { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-80px, -35px); } }
        @keyframes driftC { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(50px, -60px); } }
        @keyframes gridScroll { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-18px); opacity: 0.9; }
        }
      `}</style>

      {/* base gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: "radial-gradient(ellipse at 50% 20%, #12142b 0%, #05060f 70%)",
        }}
      />

      {/* drifting glow orbs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", top: "-8%", left: "8%", width: 420, height: 420,
            borderRadius: "50%", filter: "blur(80px)", opacity: 0.55,
            background: "radial-gradient(circle, rgba(155,92,255,0.8), transparent 70%)",
            animation: "driftA 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: "-12%", right: "0%", width: 500, height: 500,
            borderRadius: "50%", filter: "blur(80px)", opacity: 0.5,
            background: "radial-gradient(circle, rgba(62,233,255,0.7), transparent 70%)",
            animation: "driftB 25s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute", top: "40%", left: "60%", width: 340, height: 340,
            borderRadius: "50%", filter: "blur(80px)", opacity: 0.45,
            background: "radial-gradient(circle, rgba(255,62,165,0.6), transparent 70%)",
            animation: "driftC 28s ease-in-out infinite",
          }}
        />
      </div>

      {/* 3D perspective grid floor */}
      <div
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          height: "55%",
          zIndex: 0,
          perspective: "500px",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotateX(75deg)",
            transformOrigin: "bottom",
            backgroundImage:
              "linear-gradient(rgba(62,233,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(62,233,255,0.35) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            animation: "gridScroll 3s linear infinite",
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
      </div>

      {/* floating particles */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(231,233,245,0.7)",
              animation: `floatUp ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* login card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.15s ease-out",
          zIndex: 1,
        }}
        className="glass-bright w-full max-w-md rounded-[26px] p-8 md:p-10"
      >
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-glow to-violet-glow shadow-glow-cyan">
            <span className="font-display text-lg font-bold text-void">M</span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none text-ink-100">
              Mentor<span className="text-cyan-glow">AI</span>
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">your learning orbit</p>
          </div>
        </div>

        <h1 className="mb-1 font-display text-2xl font-semibold text-ink-100">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 text-sm text-ink-400">
          {mode === "login" ? "Log in to pick up where you left off." : "Set up your MentorAI profile in a few seconds."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-lg border border-white/10 bg-void/60 px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-cyan-glow/50 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-white/10 bg-void/60 px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-cyan-glow/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={4}
              className="w-full rounded-lg border border-white/10 bg-void/60 px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-cyan-glow/50 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-magenta-glow/30 bg-magenta-glow/5 p-3 text-sm text-magenta-glow">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="shimmer mt-2 rounded-lg bg-gradient-to-r from-cyan-glow to-violet-glow px-6 py-3 font-display text-sm font-semibold text-void shadow-glow-cyan transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          {mode === "login" ? "New to MentorAI?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="font-semibold text-cyan-glow hover:underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}