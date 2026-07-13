import ProgressRing from "./ProgressRing.jsx";
import TiltCard from "./TiltCard.jsx";
import { lazy, Suspense } from "react";

const MentorOrbit = lazy(() => import("./MentorOrbit.jsx"));

export default function Dashboard({ progress, roadmap, onNavigate }) {
  const totalTopics = roadmap?.topics?.length || 0;
  const completedCount = progress?.completed_topics?.length || 0;
  const completionPercent = totalTopics ? Math.round((completedCount / totalTopics) * 100) : 0;
  const quizAccuracy = progress?.total_quizzes > 0 ? Math.round((progress.total_correct / progress.total_quizzes) * 100) : 0;
  const nextTopic = roadmap?.topics?.find((topic) => !progress?.completed_topics?.includes(topic.id));
  const learningSignal = getLearningSignal(progress, nextTopic);

  return (
    <div className="flex flex-col gap-6 pb-4">
      <section className="cockpit-hero overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="cockpit-grid" />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-glow/25 bg-cyan-glow/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.18em] text-cyan-glow">
              <span className="live-dot" /> Learning command center
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-400">Welcome back, explorer</p>
            <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold leading-tight text-ink-100 md:text-5xl">
              Build skills that <span className="text-gradient">move your world.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-ink-400 md:text-base">
              Your personal AI study space is ready. Pick a mission, stay consistent, and let small wins compound.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => onNavigate("roadmap")} className="button-3d button-primary">
                {roadmap ? "Continue roadmap" : "Create my roadmap"} <span aria-hidden="true">→</span>
              </button>
              <button onClick={() => onNavigate("doubt")} className="button-3d button-secondary">
                Ask MentorAI
              </button>
            </div>
          </div>

          <Suspense fallback={<div className="mentor-orbit mentor-orbit-loading" aria-label="Loading 3D learning orbit" />}>
            <MentorOrbit percent={completionPercent} />
          </Suspense>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Roadmap" value={`${completedCount}/${totalTopics || "—"}`} detail="topics completed" color="cyan" percent={completionPercent} />
        <MetricCard label="Quiz accuracy" value={`${quizAccuracy}%`} detail={`${progress?.total_quizzes || 0} questions answered`} color="magenta" percent={quizAccuracy} />
        <MetricCard label="Focus streak" value={`${progress?.streak || 0}`} detail="days of learning" color="violet" percent={Math.min((progress?.streak || 0) * 10, 100)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <TiltCard glow="cyan" maxTilt={4} className="glass rounded-2xl p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-glow">Your next mission</p>
              <h2 className="mt-2 font-display text-xl text-ink-100">{nextTopic?.title || (roadmap ? "You have cleared every topic!" : "Start your first learning path")}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-400">
                {nextTopic ? `Estimated focus time: ${nextTopic.time_estimate_days || 1} day${nextTopic.time_estimate_days === 1 ? "" : "s"}. Keep the momentum alive.` : roadmap ? "Great work—review your path or begin a new challenge." : "Tell us what you want to learn and we will turn it into a clear, achievable plan."}
              </p>
            </div>
            <div className="hidden sm:block"><ProgressRing percent={completionPercent} color="#3ee9ff" label="progress" /></div>
          </div>
          <button onClick={() => onNavigate("roadmap")} className="mt-5 font-mono text-xs uppercase tracking-widest text-cyan-glow transition hover:text-ink-100">
            Open roadmap →
          </button>
        </TiltCard>

        <div className="glass rounded-2xl p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-ink-400">Adaptive learning signal</p>
          <div className={`signal-card signal-${learningSignal.tone}`}><span>{learningSignal.icon}</span><div><strong>{learningSignal.title}</strong><p>{learningSignal.message}</p></div></div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-ink-400">Quick launch</p>
          <div className="mt-4 grid gap-2">
            <LaunchButton icon="✦" title="New roadmap" onClick={() => onNavigate("roadmap")} />
            <LaunchButton icon="◌" title="Solve a doubt" onClick={() => onNavigate("doubt")} />
            <LaunchButton icon="▣" title="Notes to quiz" onClick={() => onNavigate("quiz")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getLearningSignal(progress, nextTopic) {
  const total = progress?.total_quizzes || 0;
  const accuracy = total ? Math.round(((progress?.total_correct || 0) / total) * 100) : null;
  if (accuracy === null) return { tone: "cyan", icon: "✦", title: "Baseline needed", message: "Turn your notes into a short quiz so MentorAI can tune your next mission." };
  if (accuracy < 60) return { tone: "pink", icon: "◌", title: "Reinforce the basics", message: `Your ${accuracy}% quiz score suggests a quick review before ${nextTopic?.title || "the next topic"}.` };
  if (accuracy < 80) return { tone: "violet", icon: "↗", title: "Ready to level up", message: `Solid ${accuracy}% accuracy. Finish one focused practice session, then move forward.` };
  return { tone: "cyan", icon: "⚡", title: "Momentum is strong", message: `${accuracy}% accuracy—take on ${nextTopic?.title || "a more challenging roadmap"} next.` };
}

function MetricCard({ label, value, detail, color, percent }) {
  const colors = { cyan: "metric-cyan", violet: "metric-violet", magenta: "metric-magenta" };
  return <TiltCard glow={color} maxTilt={5} className={`metric-card ${colors[color]} rounded-2xl p-5`}>
    <p className="font-mono text-[10px] uppercase tracking-[.16em] text-ink-400">{label}</p>
    <div className="mt-3 flex items-end justify-between gap-3"><strong className="font-display text-3xl text-ink-100">{value}</strong><span className="text-xs text-ink-400">{detail}</span></div>
    <div className="metric-track mt-4"><span style={{ width: `${percent}%` }} /></div>
  </TiltCard>;
}

function LaunchButton({ icon, title, onClick }) {
  return <button onClick={onClick} className="launch-button group"><span className="launch-icon">{icon}</span><span>{title}</span><span className="ml-auto text-ink-600 transition group-hover:translate-x-1 group-hover:text-cyan-glow">→</span></button>;
}
