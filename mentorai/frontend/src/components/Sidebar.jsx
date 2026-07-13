const NAV_ITEMS = [
  { id: "dashboard", label: "Command Center", icon: "◇", hint: "Overview" },
  { id: "roadmap", label: "Learning Map", icon: "✦", hint: "Plan" },
  { id: "doubt", label: "AI Mentor", icon: "◉", hint: "Chat" },
  { id: "quiz", label: "Quiz Studio", icon: "▣", hint: "Practise" },
];

export default function Sidebar({ active, onChange, streak, user, onLogout }) {
  return (
    <aside className="app-rail fixed left-0 top-0 z-20 hidden h-screen w-[290px] flex-col p-5 lg:flex">
      <div className="rail-aurora" />
      <div className="relative z-10">
        <button onClick={() => onChange("dashboard")} className="brand-mark" aria-label="Go to MentorAI dashboard">
          <span className="brand-cube">M</span>
          <span><strong>Mentor<span>AI</span></strong><small>your learning orbit</small></span>
        </button>
        <p className="rail-label">Navigator</p>
        <nav className="rail-nav">
          {NAV_ITEMS.map((item, index) => <button key={item.id} onClick={() => onChange(item.id)} className={`rail-link ${active === item.id ? "is-active" : ""}`}>
            <span className="rail-index">0{index + 1}</span><span className="rail-icon">{item.icon}</span><span className="rail-copy"><strong>{item.label}</strong><small>{item.hint}</small></span><span className="rail-arrow">↗</span>
          </button>)}
        </nav>
      </div>
      <div className="relative z-10 mt-auto">
        {user && (
          <div className="rail-status mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow to-violet-glow font-mono text-xs font-bold text-void">
                {user.name?.[0]?.toUpperCase() || "?"}
              </span>
              <span className="truncate text-xs text-ink-100">{user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink-400 hover:text-magenta-glow"
            >
              logout
            </button>
          </div>
        )}
        <div className="rail-status"><span className="status-pulse" /><span>Systems ready</span></div>
        <div className="streak-crystal"><div><small>Current focus streak</small><strong>{streak}<span>days</span></strong></div><span className="crystal-flame">✦</span><div className="streak-line"><i style={{ width: `${Math.min(streak * 12, 100)}%` }} /></div></div>
      </div>
    </aside>
  );
}