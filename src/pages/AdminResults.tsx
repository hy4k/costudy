import { useEffect, useState, useMemo, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "https://api.costudy.in";

/* ── Design tokens ───────────────────────────────── */
const C = {
  bg: "#0a0a12",
  card: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  accent: "#8dc63f",
  accentGlow: "rgba(141,198,63,0.15)",
  gold: "#d4a853",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  red: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
};

/* ── Types ────────────────────────────────────────── */
interface Attempt {
  id: string;
  state: string;
  guest_name: string | null;
  guest_email: string | null;
  mcq_score: number | null;
  essay_score: number | null;
  total_score: number | null;
  started_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  metadata?: { phone?: string; institute?: string; source?: string };
}

interface QuestionDetail {
  position: number;
  topic: string;
  stem: string;
  choices: Record<string, string>;
  correct_key: string;
  selected_key: string | null;
  is_correct: boolean | null;
  flagged: boolean;
}

interface EssayDetail {
  prompt_id: string;
  content: string;
  grading_state: string;
  score: number | null;
  total_score: number | null;
  concept_score: number | null;
  calc_score: number | null;
  comm_score: number | null;
  performance_band: string | null;
  pass4_aggregate: string | null;
}

interface AttemptDetail {
  attempt: Attempt;
  summary: { correct: number; answered: number; total: number; mcq_score: number | null };
  questions: QuestionDetail[];
  essays: EssayDetail[];
}

type View = "dashboard" | "day" | "candidate";
type FilterMode = "day" | "institute";

interface DayGroup {
  date: string;
  label: string;
  attempts: Attempt[];
  completed: number;
  inProgress: number;
  avgScore: number;
}

interface InstituteGroup {
  name: string;
  attempts: Attempt[];
  completed: number;
  avgScore: number;
}

interface Props {
  token: string;
}

/* ── Helpers ──────────────────────────────────────── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function dateKey(iso: string): string {
  return new Date(iso).toISOString().split("T")[0];
}

function dayLabel(key: string): string {
  const d = new Date(key + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey(today.toISOString()) === key) return "Today";
  if (dateKey(yesterday.toISOString()) === key) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/* ── Score Ring SVG ───────────────────────────────── */
function ScoreRing({ score, size = 56, pass = 72 }: { score: number; size?: number; pass?: number }) {
  const passed = score >= pass;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = passed ? C.accent : C.red;
  return (
    <svg width={size} height={size} className="shrink-0">
      <defs>
        <filter id={`glow-${size}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} filter={`url(#glow-${size})`} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={size * 0.24} fontWeight="700" fill={color}>
        {Math.round(score)}%
      </text>
    </svg>
  );
}

/* ── Glassmorphism Card ──────────────────────────── */
function GlassCard({ children, className = "", onClick, hover = false }: {
  children: React.ReactNode; className?: string; onClick?: () => void; hover?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border transition-all duration-300 ${hover ? "cursor-pointer hover:scale-[1.01] hover:border-white/20 hover:shadow-lg hover:shadow-white/5" : ""} ${className}`}
      style={{ background: C.glass, borderColor: C.glassBorder }}
    >
      {children}
    </div>
  );
}

/* ── Stat Pill ───────────────────────────────────── */
function StatPill({ value, label, icon, color }: { value: string | number; label: string; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-lg font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Dropdown ────────────────────────────────────── */
function Dropdown({ value, options, onChange, placeholder }: {
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border"
        style={{ background: C.glass, borderColor: open ? "rgba(141,198,63,0.4)" : C.glassBorder, color: C.textPrimary }}
      >
        <span className="truncate max-w-[160px]">{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 min-w-[220px] rounded-xl border shadow-2xl z-50 py-1 max-h-64 overflow-y-auto"
          style={{ background: "#1a1a2e", borderColor: C.glassBorder }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${o.value === value ? "text-[#8dc63f] font-semibold" : "text-slate-300 hover:text-white hover:bg-white/5"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export function AdminResults({ token }: Props) {
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [label, setLabel] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("day");
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [dayFilter, setDayFilter] = useState("__all__");
  const [instFilter, setInstFilter] = useState("__all__");

  useEffect(() => {
    document.title = "Exam Results — Admin";
    loadAttempts();
  }, [token]);

  function loadAttempts() {
    setLoading(true);
    fetch(`${API}/api/admin/exam/${token}/attempts`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setExamTitle(d.exam?.title || "Exam");
        setLabel(d.label || "");
        setAttempts(d.attempts || []);
        setLoading(false);
      })
      .catch((e) => { setError(e.message || "Failed to load"); setLoading(false); });
  }

  /* ── Day groups ── */
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: Record<string, Attempt[]> = {};
    attempts.forEach((a) => {
      const k = dateKey(a.started_at);
      if (!groups[k]) groups[k] = [];
      groups[k].push(a);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, atts]) => {
        const completed = atts.filter((a) => a.state === "completed");
        const inProg = atts.filter((a) => a.state === "in_progress");
        const avgScore = completed.length > 0
          ? completed.reduce((s, a) => s + (a.mcq_score ?? 0), 0) / completed.length : 0;
        return { date: key, label: dayLabel(key), attempts: atts, completed: completed.length, inProgress: inProg.length, avgScore };
      });
  }, [attempts]);

  /* ── Institute groups ── */
  const instituteGroups = useMemo<InstituteGroup[]>(() => {
    const groups: Record<string, Attempt[]> = {};
    attempts.forEach((a) => {
      const inst = a.metadata?.institute || "Independent / Self-study";
      if (!groups[inst]) groups[inst] = [];
      groups[inst].push(a);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, atts]) => {
        const completed = atts.filter((a) => a.state === "completed");
        const avgScore = completed.length > 0
          ? completed.reduce((s, a) => s + (a.mcq_score ?? 0), 0) / completed.length : 0;
        return { name, attempts: atts, completed: completed.length, avgScore };
      });
  }, [attempts]);

  const selectedDay = dayGroups.find((g) => g.date === selectedDate);
  const selectedInst = instituteGroups.find((g) => g.name === selectedInstitute);

  const filteredGroups = useMemo(() => {
    if (filterMode === "day") {
      if (dayFilter === "__all__") return dayGroups;
      return dayGroups.filter(g => g.date === dayFilter);
    }
    if (instFilter === "__all__") return instituteGroups;
    return instituteGroups.filter(g => g.name === instFilter);
  }, [filterMode, dayFilter, instFilter, dayGroups, instituteGroups]);

  const dayOptions = useMemo(() => [{ value: "__all__", label: "All Days" }, ...dayGroups.map(g => ({ value: g.date, label: `${g.label} (${g.attempts.length})` }))], [dayGroups]);
  const instOptions = useMemo(() => [{ value: "__all__", label: "All Institutes" }, ...instituteGroups.map(g => ({ value: g.name, label: `${g.name} (${g.attempts.length})` }))], [instituteGroups]);

  /* ── Filtered attempts for the list view ── */
  const listAttempts = useMemo(() => {
    if (view === "day" && selectedDay) return selectedDay.attempts.filter((a) => attempts.some((at) => at.id === a.id));
    if (view === "day" && selectedInst) return selectedInst.attempts.filter((a) => attempts.some((at) => at.id === a.id));
    return [];
  }, [view, selectedDay, selectedInst, attempts]);

  const listTitle = selectedDay?.label || selectedInst?.name || "";

  /* ── Actions ── */
  function viewDetail(attemptId: string) {
    setDetailLoading(true);
    fetch(`${API}/api/admin/exam/${token}/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setDetail(d);
        setView("candidate");
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  }

  function gradeEssays(attemptId: string) {
    setGrading(true);
    fetch(`${API}/api/admin/exam/${token}/attempts/${attemptId}/grade-essays`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setGrading(false); if (d.ok) viewDetail(attemptId); })
      .catch(() => setGrading(false));
  }

  function deleteSelected() {
    if (selectedForDelete.size === 0) return;
    setDeleting(true);
    fetch(`${API}/api/admin/exam/${token}/delete-attempts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_ids: Array.from(selectedForDelete) }),
    })
      .then((r) => r.json())
      .then((d) => {
        setDeleting(false); setShowDeleteConfirm(false);
        if (d.ok) {
          setAttempts((prev) => prev.filter((a) => !selectedForDelete.has(a.id)));
          setSelectedForDelete(new Set());
          if (listAttempts.filter((a) => !selectedForDelete.has(a.id)).length === 0) {
            setView("dashboard"); setSelectedDate(null); setSelectedInstitute(null);
          }
        }
      })
      .catch(() => { setDeleting(false); setShowDeleteConfirm(false); });
  }

  function toggleSelect(id: string) {
    setSelectedForDelete((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function selectAllList() {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      const allSelected = listAttempts.every((a) => next.has(a.id));
      listAttempts.forEach((a) => allSelected ? next.delete(a.id) : next.add(a.id));
      return next;
    });
  }

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: `${C.accent} transparent ${C.accent} ${C.accent}` }} />
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>Loading Results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: C.bg }}>
        <GlassCard className="max-w-md mx-4 p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: C.textPrimary }}>Access Error</h1>
          <p className="text-sm" style={{ color: C.textSecondary }}>{error}</p>
        </GlassCard>
      </div>
    );
  }

  /* ── Stats data ── */
  const totalCompleted = attempts.filter((a) => a.state === "completed").length;
  const overallAvg = totalCompleted > 0
    ? attempts.filter((a) => a.state === "completed").reduce((s, a) => s + (a.mcq_score ?? 0), 0) / totalCompleted : 0;
  const passRate = totalCompleted > 0
    ? Math.round((attempts.filter((a) => a.state === "completed" && (a.mcq_score ?? 0) >= 72).length / totalCompleted) * 100) : 0;

  /* ══════════════════════════════════════════════════════
     CANDIDATE DETAIL VIEW
     ══════════════════════════════════════════════════════ */
  if (view === "candidate" && detail) {
    const s = detail.summary;
    const pct = s.mcq_score ?? 0;
    const passed = pct >= 72;
    const topicGroups: Record<string, { correct: number; total: number }> = {};
    detail.questions.forEach((q) => {
      if (!topicGroups[q.topic]) topicGroups[q.topic] = { correct: 0, total: 0 };
      topicGroups[q.topic].total++;
      if (q.is_correct) topicGroups[q.topic].correct++;
    });
    const essayAvg = detail.essays.filter((e) => e.total_score != null).length > 0
      ? detail.essays.filter((e) => e.total_score != null).reduce((s, e) => s + (e.total_score ?? 0), 0) / detail.essays.filter((e) => e.total_score != null).length
      : null;

    return (
      <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {/* Top Nav */}
        <div className="sticky top-0 z-10 border-b " style={{ background: "rgba(10,10,18,0.97)", borderColor: C.glassBorder }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <button onClick={() => { setView("day"); setDetail(null); }}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: C.textSecondary }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="flex-1 ml-4">
              <span className="text-sm font-bold" style={{ color: C.textPrimary }}>{detail.attempt.guest_name || "Unknown"}</span>
              {detail.attempt.guest_email && <span className="text-xs ml-3" style={{ color: C.textMuted }}>{detail.attempt.guest_email}</span>}
            </div>
            <a href={`/exam/${token}/results/${detail.attempt.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-xl border transition-all hover:bg-white/5"
              style={{ borderColor: C.glassBorder, color: C.textSecondary }}>
              Share Result ↗
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {/* Score Hero */}
          <GlassCard className="p-8 mb-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: passed ? C.accent : C.red }} />
            <div className="flex items-center gap-8 relative z-10">
              <ScoreRing score={pct} size={100} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1" style={{ color: C.textPrimary }}>{detail.attempt.guest_name || "Unknown"}</h2>
                <p className="text-sm mb-3" style={{ color: C.textMuted }}>
                  {detail.attempt.guest_email || "No email"}
                  {detail.attempt.metadata?.phone && ` · ${detail.attempt.metadata.phone}`}
                  {detail.attempt.metadata?.institute && ` · ${detail.attempt.metadata.institute}`}
                </p>
                <div className="flex gap-6">
                  {[
                    { label: "MCQ", value: `${s.correct}/${s.total}` },
                    { label: "Answered", value: String(s.answered) },
                    ...(essayAvg !== null ? [{ label: "Essay Avg", value: `${Math.round(essayAvg)}%` }] : []),
                    { label: "Result", value: passed ? "PASS" : "FAIL" },
                  ].map(d => (
                    <div key={d.label}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{d.label}</div>
                      <div className={`text-lg font-bold ${d.label === "Result" ? (passed ? "text-green-400" : "text-red-400") : ""}`}
                        style={d.label !== "Result" ? { color: C.textPrimary } : undefined}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs" style={{ color: C.textMuted }}>
                <div>Started: {formatDate(detail.attempt.started_at)} {formatTime(detail.attempt.started_at)}</div>
                {detail.attempt.submitted_at && <div>Submitted: {formatTime(detail.attempt.submitted_at)}</div>}
              </div>
            </div>
          </GlassCard>

          {/* Section Performance */}
          <GlassCard className="p-6 mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.textMuted }}>Section Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(topicGroups).map(([topic, g]) => {
                const topicPct = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0;
                return (
                  <div key={topic} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold truncate mr-2" style={{ color: C.textSecondary }}>{topic}</span>
                      <span className="text-sm font-bold" style={{ color: topicPct >= 72 ? C.accent : C.red }}>{topicPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${topicPct}%`, background: topicPct >= 72 ? C.accent : C.red }} />
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>{g.correct}/{g.total} correct</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Question Details */}
          <GlassCard className="p-6 mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.textMuted }}>Question Details</h3>
            <div className="space-y-2">
              {detail.questions.map((q) => (
                <div key={q.position} className={`rounded-xl p-3 flex items-start gap-3 border ${
                  q.selected_key === null ? "border-white/5 bg-white/[0.02]"
                    : q.is_correct ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}>
                  <span className="text-xs font-bold w-8 shrink-0 mt-0.5" style={{ color: C.textMuted }}>Q{q.position}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-1" style={{ color: C.textSecondary }}>{q.stem.length > 150 ? q.stem.slice(0, 150) + "..." : q.stem}</p>
                    <div className="flex gap-4 text-xs">
                      <span style={{ color: C.textMuted }}>{q.topic}</span>
                      <span style={{ color: q.is_correct ? C.accent : C.red }}>
                        {q.selected_key || "—"} → {q.correct_key}
                      </span>
                    </div>
                  </div>
                  <span className="text-base mt-0.5">{q.selected_key === null ? "⬜" : q.is_correct ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Essays */}
          {detail.essays.length > 0 && (
            <GlassCard className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Essay Submissions</h3>
                {detail.essays.some((e) => e.grading_state !== "graded") && (
                  <button onClick={() => gradeEssays(detail.attempt.id)} disabled={grading}
                    className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 text-white rounded-xl transition-all hover:brightness-110"
                    style={{ background: grading ? "#475569" : C.accent }}>
                    {grading ? "⏳ Grading..." : "🤖 Grade with AI"}
                  </button>
                )}
              </div>
              {detail.essays.map((e, i) => (
                <div key={i} className="rounded-xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold" style={{ color: C.textSecondary }}>Essay {i + 1}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                      e.grading_state === "graded" ? "bg-green-500/15 text-green-400" :
                      e.grading_state === "grading" ? "bg-amber-500/15 text-amber-400" :
                      "bg-slate-500/15 text-slate-400"
                    }`}>
                      {e.grading_state} {e.total_score != null ? `· ${Math.round(e.total_score)}%` : ""}
                      {e.performance_band ? ` · ${e.performance_band}` : ""}
                    </span>
                  </div>
                  <div className="rounded-lg p-4 mb-4 max-h-48 overflow-y-auto" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textMuted }}>{e.content}</p>
                  </div>
                  {e.grading_state === "graded" && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: "Concepts", score: e.concept_score ?? 0 },
                          { label: "Calculations", score: e.calc_score ?? 0 },
                          { label: "Communication", score: e.comm_score ?? 0 },
                        ].map((d) => (
                          <div key={d.label} className="text-center rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="text-xl font-bold" style={{ color: d.score >= 70 ? C.accent : C.red }}>{d.score}%</div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: C.textMuted }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                      {e.pass4_aggregate && (
                        <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: C.glassBorder }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.textMuted }}>AI Feedback</div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textSecondary }}>{e.pass4_aggregate}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </GlassCard>
          )}

          {/* Shareable Link */}
          <GlassCard className="p-4 text-center">
            <span className="text-xs" style={{ color: C.textMuted }}>Candidate result link: </span>
            <a href={`/exam/${token}/results/${detail.attempt.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold underline" style={{ color: C.accent }}>
              {window.location.origin}/exam/{token}/results/{detail.attempt.id}
            </a>
          </GlassCard>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t" style={{ borderColor: C.glassBorder }}>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>CoStudy · Admin Dashboard</span>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     LIST VIEW — candidates for selected day or institute
     ══════════════════════════════════════════════════════ */
  if (view === "day" && (selectedDay || selectedInst)) {
    const completed = listAttempts.filter((a) => a.state === "completed");
    const inProg = listAttempts.filter((a) => a.state === "in_progress");
    const hasSelections = listAttempts.some((a) => selectedForDelete.has(a.id));

    return (
      <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {/* Top Nav */}
        <div className="sticky top-0 z-10 border-b " style={{ background: "rgba(10,10,18,0.97)", borderColor: C.glassBorder }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => { setView("dashboard"); setSelectedDate(null); setSelectedInstitute(null); setSelectedForDelete(new Set()); }}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: C.textSecondary }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: C.textPrimary }}>{listTitle}</span>
              <span className="text-xs ml-3" style={{ color: C.textMuted }}>{listAttempts.length} candidate{listAttempts.length !== 1 ? "s" : ""}</span>
            </div>
            {hasSelections && (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                Delete ({selectedForDelete.size})
              </button>
            )}
            <button onClick={selectAllList}
              className="text-xs font-semibold px-4 py-2 rounded-xl border transition-all hover:bg-white/5"
              style={{ borderColor: C.glassBorder, color: C.textSecondary }}>
              {listAttempts.every((a) => selectedForDelete.has(a.id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        {/* Sub-header */}
        <div className="h-11 flex items-center px-6 text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${C.accent}, #6ba832)` }}>
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <span>{label ? `${label} — ` : ""}{examTitle}</span>
            <div className="flex gap-5 text-xs font-medium opacity-90">
              <span>✅ {completed.length} completed</span>
              <span>⏳ {inProg.length} in progress</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="space-y-3">
            {listAttempts.map((a) => {
              const pct = a.mcq_score ?? 0;
              const passed = pct >= 72;
              const isSelected = selectedForDelete.has(a.id);
              return (
                <GlassCard key={a.id} className={`p-5 flex items-center gap-5 transition-all ${isSelected ? "!border-red-500/30 !bg-red-500/5" : ""}`} hover>
                  <button onClick={(ev) => { ev.stopPropagation(); toggleSelect(a.id); }}
                    className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition ${
                      isSelected ? "bg-red-500 border-red-500 text-white" : "border-slate-600 hover:border-slate-400"
                    }`}>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </button>

                  {a.state === "completed" ? (
                    <ScoreRing score={pct} size={48} />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
                      <span className="text-amber-400 text-lg">⏳</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0" onClick={() => a.state === "completed" && viewDetail(a.id)} style={{ cursor: a.state === "completed" ? "pointer" : "default" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold truncate" style={{ color: C.textPrimary }}>{a.guest_name || "Unknown"}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        a.state === "completed" ? (passed ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400") : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {a.state === "completed" ? (passed ? "PASS" : "FAIL") : "IN PROGRESS"}
                      </span>
                      {a.metadata?.institute && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "rgba(167,139,250,0.1)", color: C.purple }}>
                          {a.metadata.institute}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                      {a.guest_email || "No email"}{a.metadata?.phone ? ` · ${a.metadata.phone}` : ""}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>Started: {formatTime(a.started_at)}</p>
                  </div>

                  {a.state === "completed" && (
                    <div className="flex items-center gap-3 shrink-0">
                      <a href={`/exam/${token}/results/${a.id}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs transition-colors hover:text-slate-300" style={{ color: C.textMuted }} title="Share result">🔗</a>
                      <button onClick={() => viewDetail(a.id)} disabled={detailLoading}
                        className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl text-white transition-all hover:brightness-110"
                        style={{ background: C.accent }}>
                        View →
                      </button>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
            <GlassCard className="p-8 max-w-md w-full mx-4">
              <div className="text-3xl text-center mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-center mb-2" style={{ color: C.textPrimary }}>
                Delete {selectedForDelete.size} Attempt{selectedForDelete.size !== 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-center mb-6" style={{ color: C.textSecondary }}>
                This will permanently delete all MCQ responses, essay submissions, and grading data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
                  style={{ borderColor: C.glassBorder, color: C.textSecondary }}>Cancel</button>
                <button onClick={deleteSelected} disabled={deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t" style={{ borderColor: C.glassBorder }}>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>CoStudy · Admin Dashboard</span>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     DASHBOARD VIEW
     ══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ── Premium Header ── */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: C.glassBorder }}>
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at 30% 50%, ${C.accentGlow}, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(167,139,250,0.08), transparent 60%)` }} />
        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: `linear-gradient(135deg, ${C.accent}, #6ba832)` }}>
                  C
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.accent }}>Admin Dashboard</span>
              </div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: C.textPrimary }}>{examTitle}</h1>
              {label && <p className="text-sm" style={{ color: C.textSecondary }}>{label}</p>}
            </div>
            {/* Stats toggle */}
            <button onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest border transition-all hover:bg-white/5"
              style={{ borderColor: C.glassBorder, color: C.textSecondary }}>
              📊 {showStats ? "Hide Stats" : "Show Stats"}
            </button>
          </div>

          {/* Collapsible Stats */}
          {showStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 animate-in fade-in">
              <StatPill value={attempts.length} label="Total Attempts" icon="👥" color="#3b82f6" />
              <StatPill value={totalCompleted} label="Completed" icon="✅" color={C.accent} />
              <StatPill value={`${Math.round(overallAvg)}%`} label="Avg Score" icon="📈" color={C.gold} />
              <StatPill value={`${passRate}%`} label="Pass Rate" icon="🎯" color={passRate >= 50 ? C.accent : C.red} />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* ── Filter Bar ── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Mode Toggle */}
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: C.glassBorder }}>
            {(["day", "institute"] as FilterMode[]).map(mode => (
              <button key={mode} onClick={() => setFilterMode(mode)}
                className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all ${filterMode === mode ? "text-white" : ""}`}
                style={{ background: filterMode === mode ? C.accent : "transparent", color: filterMode === mode ? "white" : C.textMuted }}>
                {mode === "day" ? "📅 By Day" : "🏛 By Institute"}
              </button>
            ))}
          </div>

          {filterMode === "day" && (
            <Dropdown value={dayFilter} options={dayOptions} onChange={setDayFilter} placeholder="Select Day" />
          )}
          {filterMode === "institute" && (
            <Dropdown value={instFilter} options={instOptions} onChange={setInstFilter} placeholder="Select Institute" />
          )}

          <div className="ml-auto text-xs font-medium" style={{ color: C.textMuted }}>
            {attempts.length} total · {totalCompleted} completed
          </div>
        </div>

        {/* ── Group Cards ── */}
        {(filteredGroups as any[]).length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm" style={{ color: C.textSecondary }}>No attempts yet. Share the exam link to get started.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filterMode === "day" ? (
              (filteredGroups as DayGroup[]).map((group) => (
                <GlassCard key={group.date} hover
                  onClick={() => { setSelectedDate(group.date); setView("day"); }}
                  className="p-5 flex items-center gap-5">
                  {/* Date block */}
                  <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.glassBorder}` }}>
                    <span className="text-xl font-bold" style={{ color: C.textPrimary }}>
                      {new Date(group.date + "T00:00:00").getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase" style={{ color: C.textMuted }}>
                      {new Date(group.date + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold mb-1" style={{ color: C.textPrimary }}>{group.label}</h3>
                    <div className="flex gap-4 text-xs" style={{ color: C.textMuted }}>
                      <span>👥 {group.attempts.length} candidate{group.attempts.length !== 1 ? "s" : ""}</span>
                      <span>✅ {group.completed} completed</span>
                      {group.inProgress > 0 && <span>⏳ {group.inProgress} in progress</span>}
                    </div>
                  </div>

                  {group.completed > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color: group.avgScore >= 72 ? C.accent : C.red }}>
                        {Math.round(group.avgScore)}%
                      </div>
                      <div className="text-[10px] font-semibold uppercase" style={{ color: C.textMuted }}>Avg Score</div>
                    </div>
                  )}

                  <svg className="w-5 h-5 shrink-0" style={{ color: C.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </GlassCard>
              ))
            ) : (
              (filteredGroups as InstituteGroup[]).map((group) => (
                <GlassCard key={group.name} hover
                  onClick={() => { setSelectedInstitute(group.name); setView("day"); }}
                  className="p-5 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "rgba(167,139,250,0.08)", border: `1px solid rgba(167,139,250,0.15)` }}>
                    🏛
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold mb-1" style={{ color: C.textPrimary }}>{group.name}</h3>
                    <div className="flex gap-4 text-xs" style={{ color: C.textMuted }}>
                      <span>👥 {group.attempts.length} candidate{group.attempts.length !== 1 ? "s" : ""}</span>
                      <span>✅ {group.completed} completed</span>
                    </div>
                  </div>

                  {group.completed > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color: group.avgScore >= 72 ? C.accent : C.red }}>
                        {Math.round(group.avgScore)}%
                      </div>
                      <div className="text-[10px] font-semibold uppercase" style={{ color: C.textMuted }}>Avg Score</div>
                    </div>
                  )}

                  <svg className="w-5 h-5 shrink-0" style={{ color: C.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t mt-8" style={{ borderColor: C.glassBorder }}>
        <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
          Powered by CoStudy · CMA Exam Preparation Platform
        </div>
      </div>
    </div>
  );
}
