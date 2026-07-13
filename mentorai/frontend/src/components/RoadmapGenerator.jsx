import { useEffect, useState } from "react";
import { generateRoadmap, getRoadmapHistory, getRoadmapDetail, deleteRoadmap } from "../lib/api.js";
import TiltCard from "./TiltCard.jsx";

const DIFFICULTY_STYLES = {
  Easy: { text: "text-cyan-glow", bg: "bg-cyan-glow/10", border: "border-cyan-glow/30", glow: "cyan" },
  Medium: { text: "text-violet-glow", bg: "bg-violet-glow/10", border: "border-violet-glow/30", glow: "violet" },
  Hard: { text: "text-magenta-glow", bg: "bg-magenta-glow/10", border: "border-magenta-glow/30", glow: "magenta" },
};

export default function RoadmapGenerator({ roadmap, setRoadmap, progress, onToggleTopic, userId }) {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (userId) refreshHistory();
  }, [userId]);

  async function refreshHistory() {
    try {
      const data = await getRoadmapHistory(userId);
      setHistory(data.history || []);
    } catch {
      /* history is a nice-to-have, fail silently */
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateRoadmap({ goal, level, duration_weeks: Number(weeks), user_id: userId });
      setRoadmap(data.roadmap);
      refreshHistory();
      setShowHistory(false);
    } catch (err) {
      setError(err.message || "Something went wrong. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadHistoryItem(id) {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoadmapDetail(id);
      setRoadmap(data.roadmap);
      setShowHistory(false);
    } catch (err) {
      setError(err.message || "Could not load that roadmap.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteHistoryItem(e, id) {
    e.stopPropagation();
    try {
      await deleteRoadmap(id);
      refreshHistory();
    } catch {
      /* ignore */
    }
  }

  const overview = roadmap?.overview;
  const plannedDays = roadmap?.topics?.reduce((sum, topic) => sum + Number(topic.time_estimate_days || 1), 0) || 0;
  const availableDays = Number(roadmap?.total_weeks || weeks) * 7;
  const inferredDifficulty = plannedDays > availableDays ? "Hard" : plannedDays > availableDays * 0.75 ? "Medium" : "Easy";
  const topicsPerWeek = Math.max(1, Math.ceil((roadmap?.topics?.length || 1) / Math.max(1, Number(roadmap?.total_weeks || weeks))));
  const activeOverview = overview || {
    difficulty: inferredDifficulty,
    difficulty_note: plannedDays > availableDays
      ? "This plan is ambitious for the selected duration. Protect focused study time every day and reduce extra topics if you fall behind."
      : "This is a realistic pace if you study consistently and practise each concept before moving ahead.",
    daily_hours: plannedDays > availableDays ? 2 : 1,
    approach: "Start from the first topic, learn the core idea, then practise it the same day. Use the final part of each week to revise and build one small proof-of-work project.",
    prerequisites: ["A distraction-free study slot", "A place to keep short revision notes"],
  };
  const diffStyle = DIFFICULTY_STYLES[activeOverview.difficulty] || DIFFICULTY_STYLES.Medium;

  return (
    <div className="roadmap-page flex flex-col gap-6">
      <div className="roadmap-top flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-glow">roadmap generator</p>
          <h1 className="font-display text-3xl font-semibold text-ink-100">Build your learning path</h1>
        </div>
        {userId && (
          <button
            onClick={() => setShowHistory((s) => !s)}
            className={`glass shrink-0 rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              showHistory ? "text-cyan-glow shadow-glow-cyan" : "text-ink-400 hover:text-ink-100"
            }`}
          >
            History {history.length > 0 && `(${history.length})`}
          </button>
        )}
      </div>

      {showHistory && (
        <div className="glass rounded-2xl p-5">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-400">past roadmaps</p>
          {history.length === 0 ? (
            <p className="text-sm text-ink-400">No saved roadmaps yet — generate one below and it'll show up here.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleLoadHistoryItem(h.id)}
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-cyan-glow/30 hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm text-ink-100">{h.goal}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                      {h.level} · {new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    onClick={(e) => handleDeleteHistoryItem(e, h.id)}
                    className="rounded-lg px-2 py-1 text-xs text-ink-600 opacity-0 transition-opacity hover:text-magenta-glow group-hover:opacity-100"
                  >
                    remove
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleGenerate} className="roadmap-launch glass flex flex-col gap-4 rounded-[22px] p-5 md:flex-row md:items-end md:p-6">
        <div className="flex-1">
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-400">
            Goal / Topic
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Learn DSA, React advanced concepts..."
            className="w-full rounded-lg border border-white/10 bg-void/60 px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-cyan-glow/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-400">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-white/10 bg-void/60 px-3 py-2.5 text-sm text-ink-100 focus:border-cyan-glow/50 focus:outline-none"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-widest text-ink-400">Weeks</label>
          <input
            type="number"
            min={1}
            max={24}
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            className="w-20 rounded-lg border border-white/10 bg-void/60 px-3 py-2.5 text-sm text-ink-100 focus:border-cyan-glow/50 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shimmer rounded-lg bg-gradient-to-r from-cyan-glow to-violet-glow px-6 py-2.5 font-display text-sm font-semibold text-void shadow-glow-cyan transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && (
        <div className="glass rounded-xl border border-magenta-glow/30 p-4 text-sm text-magenta-glow">{error}</div>
      )}

      {roadmap?.topics?.length > 0 && (
        <>
          {/* Overview: difficulty, daily hours, approach, prerequisites */}
          {activeOverview && (
            <div className="roadmap-brief glass-bright rounded-[24px] p-6 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest ${diffStyle.text} ${diffStyle.bg} ${diffStyle.border}`}
                >
                  {activeOverview.difficulty || "Medium"} difficulty
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-ink-100">
                  ~{activeOverview.daily_hours ?? "1-2"} hrs/day
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-ink-100">
                  {roadmap.total_weeks} weeks total
                </span>
              </div>

              {activeOverview.difficulty_note && (
                <p className="mb-4 text-sm leading-relaxed text-ink-400">{activeOverview.difficulty_note}</p>
              )}

              {activeOverview.approach && (
                <div className="mb-4">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-glow">
                    how to approach this
                  </p>
                  <p className="text-sm leading-relaxed text-ink-100">{activeOverview.approach}</p>
                </div>
              )}

              {activeOverview.prerequisites?.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-cyan-glow">
                    before you start
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeOverview.prerequisites.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-400"
                      >
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="roadmap-timeline glass rounded-[24px] p-6 md:p-8">
            <div className="mb-8 flex items-baseline justify-between">
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-cyan-glow">Your learning route</p>
                <p className="font-display text-xl text-ink-100">{roadmap.goal}</p>
                <p className="text-sm text-ink-400">
                  {roadmap.level} · {roadmap.total_weeks} weeks · {roadmap.topics.length} topics
                </p>
              </div>
            </div>

            {/* Learning path — vertical constellation timeline */}
            <div className="relative flex flex-col gap-8 pl-4">
              <div className="absolute bottom-4 left-[27px] top-4 w-px bg-gradient-to-b from-cyan-glow/60 via-violet-glow/50 to-magenta-glow/40" />
              {roadmap.topics.map((topic, idx) => {
                const done = progress?.completed_topics?.includes(topic.id);
                const week = Math.min(Number(roadmap.total_weeks || 1), Math.floor(idx / topicsPerWeek) + 1);
                return (
                  <div key={topic.id || idx} className="relative flex gap-5">
                    <div
                      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                        done ? "bg-cyan-glow text-void shadow-glow-cyan" : "glass-bright text-ink-100"
                      }`}
                    >
                      {done ? "✓" : idx + 1}
                    </div>
                    <TiltCard
                      glow={done ? "cyan" : "violet"}
                      maxTilt={4}
                      className="glass flex-1 rounded-xl border border-white/5 p-4 pb-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div><span className="mb-1 inline-block rounded-md bg-violet-glow/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-violet-glow">Phase {week}</span><p className="font-display text-lg text-ink-100">{topic.title}</p></div>
                        <span className="rounded-full border border-white/10 bg-white/[.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">~{topic.time_estimate_days} day{topic.time_estimate_days === 1 ? "" : "s"}</span>
                      </div>
                      {topic.subtopics?.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {topic.subtopics.map((s, i) => (
                            <li
                              key={i}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-400"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                      {topic.resources_hint && (
                        <p className="mt-2 text-xs italic text-ink-600">💡 {topic.resources_hint}</p>
                      )}
                      <button
                        onClick={() => onToggleTopic(topic.id, !done)}
                        className={`mt-3 mb-3 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                          done
                            ? "bg-white/5 text-ink-400 hover:text-ink-100"
                            : "bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20"
                        }`}
                      >
                        {done ? "Mark as not done" : "Mark as done"}
                      </button>
                    </TiltCard>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!roadmap && !loading && (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <span className="animate-float text-4xl">✦</span>
          <p className="text-ink-400">Enter a goal above — your personalized star-path will appear here.</p>
        </div>
      )}
    </div>
  );
}
