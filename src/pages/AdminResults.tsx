import { useEffect, useState, useMemo, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "https://api.costudy.in";

/* ── Design tokens — Vibrant Neumorphism ─────────── */
const C = {
  bg: "#e8eef5",
  bgDark: "#dce4ed",
  bgLight: "#f4f8fc",
  green: "#8dc63f",       // Prometric green
  greenDark: "#6ba832",
  greenLight: "#a8d968",
  yellow: "#f5a623",      // FETS yellow
  yellowDark: "#d4900e",
  yellowLight: "#ffc857",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  blue: "#3b82f6",
  blueLight: "#60a5fa",
  red: "#ef4444",
  teal: "#14b8a6",
  pink: "#ec4899",
  text: "#1e293b",
  textSec: "#475569",
  textMuted: "#94a3b8",
  // Neumorphic shadows
  shadowOuter: "6px 6px 14px rgba(163,177,198,0.6), -6px -6px 14px rgba(255,255,255,0.9)",
  shadowInner: "inset 4px 4px 8px rgba(163,177,198,0.4), inset -4px -4px 8px rgba(255,255,255,0.8)",
  shadowOuterSm: "3px 3px 8px rgba(163,177,198,0.5), -3px -3px 8px rgba(255,255,255,0.85)",
  shadowPressed: "inset 2px 2px 5px rgba(163,177,198,0.5), inset -2px -2px 5px rgba(255,255,255,0.7)",
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

/* ── Neumorphic Score Ring ───────────────────────── */
function ScoreRing({ score, size = 64, pass = 72 }: { score: number; size?: number; pass?: number }) {
  const passed = score >= pass;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = passed ? C.green : C.red;
  const bgColor = passed ? "#e8f5e0" : "#fde8e8";
  return (
    <div className="relative flex items-center justify-center shrink-0"
      style={{ width: size + 12, height: size + 12, borderRadius: "50%", background: C.bg, boxShadow: C.shadowOuter }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill={bgColor} stroke="rgba(0,0,0,0.04)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={size * 0.22} fontWeight="800" fill={color}>
          {Math.round(score)}%
        </text>
      </svg>
    </div>
  );
}

/* ── Neumorphic Card ─────────────────────────────── */
function NeuCard({ children, className = "", onClick, hover = false, pressed = false }: {
  children: React.ReactNode; className?: string; onClick?: () => void; hover?: boolean; pressed?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-200 ${hover ? "cursor-pointer hover:translate-y-[-2px] active:translate-y-0" : ""} ${className}`}
      style={{
        background: pressed ? C.bgDark : C.bg,
        boxShadow: pressed ? C.shadowPressed : C.shadowOuter,
      }}
    >
      {children}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────── */
function StatCard({ value, label, icon, gradient }: { value: string | number; label: string; icon: string; gradient: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: C.bg, boxShadow: C.shadowOuter }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 -translate-y-4 translate-x-4"
        style={{ background: gradient }} />
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-extrabold" style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>{label}</div>
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
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ background: C.bg, boxShadow: open ? C.shadowPressed : C.shadowOuterSm, color: C.text }}
      >
        <span className="truncate max-w-[180px]">{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 min-w-[240px] rounded-xl shadow-2xl z-50 py-2 max-h-64 overflow-y-auto"
          style={{ background: "#fff", border: `1px solid ${C.bgDark}` }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${o.value === value ? "font-bold" : "hover:bg-slate-50"}`}
              style={{ color: o.value === value ? C.green : C.text }}>
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

  /* ── Filtered attempts for list view ── */
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
        <NeuCard className="p-10 text-center">
          <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: `${C.green} transparent ${C.yellow} ${C.green}` }} />
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Loading Results...</span>
        </NeuCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: C.bg }}>
        <NeuCard className="max-w-md mx-4 p-10 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: C.text }}>Access Error</h1>
          <p className="text-sm" style={{ color: C.textSec }}>{error}</p>
        </NeuCard>
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
        <div className="sticky top-0 z-10" style={{ background: C.bg, boxShadow: "0 2px 10px rgba(163,177,198,0.3)" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <button onClick={() => { setView("day"); setDetail(null); }}
              className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: C.textSec }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="flex-1 ml-4">
              <span className="text-sm font-bold" style={{ color: C.text }}>{detail.attempt.guest_name || "Unknown"}</span>
              {detail.attempt.guest_email && <span className="text-xs ml-3" style={{ color: C.textMuted }}>{detail.attempt.guest_email}</span>}
            </div>
            <a href={`/exam/${token}/results/${detail.attempt.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})` }}>
              Share Result ↗
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {/* Score Hero */}
          <NeuCard className="p-8 mb-6">
            <div className="flex items-center gap-8">
              <ScoreRing score={pct} size={90} />
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: C.text }}>{detail.attempt.guest_name || "Unknown"}</h2>
                <p className="text-sm mb-3" style={{ color: C.textMuted }}>
                  {detail.attempt.guest_email || "No email"}
                  {detail.attempt.metadata?.phone && ` · ${detail.attempt.metadata.phone}`}
                  {detail.attempt.metadata?.institute && ` · ${detail.attempt.metadata.institute}`}
                </p>
                <div className="flex gap-6">
                  {[
                    { label: "MCQ", value: `${s.correct}/${s.total}`, color: C.blue },
                    { label: "Answered", value: String(s.answered), color: C.purple },
                    ...(essayAvg !== null ? [{ label: "Essay Avg", value: `${Math.round(essayAvg)}%`, color: C.teal }] : []),
                    { label: "Result", value: passed ? "PASS" : "FAIL", color: passed ? C.green : C.red },
                  ].map(d => (
                    <div key={d.label}>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>{d.label}</div>
                      <div className="text-lg font-extrabold" style={{ color: d.color }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs" style={{ color: C.textMuted }}>
                <div>Started: {formatDate(detail.attempt.started_at)} {formatTime(detail.attempt.started_at)}</div>
                {detail.attempt.submitted_at && <div>Submitted: {formatTime(detail.attempt.submitted_at)}</div>}
              </div>
            </div>
          </NeuCard>

          {/* Section Performance */}
          <NeuCard className="p-6 mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.textMuted }}>Section Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(topicGroups).map(([topic, g]) => {
                const topicPct = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0;
                const barColor = topicPct >= 72 ? `linear-gradient(90deg, ${C.green}, ${C.greenLight})` : `linear-gradient(90deg, ${C.red}, #f87171)`;
                return (
                  <div key={topic} className="rounded-xl p-4" style={{ background: C.bgLight, boxShadow: C.shadowOuterSm }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold truncate mr-2" style={{ color: C.textSec }}>{topic}</span>
                      <span className="text-sm font-extrabold" style={{ color: topicPct >= 72 ? C.green : C.red }}>{topicPct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: C.bgDark, boxShadow: C.shadowPressed }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${topicPct}%`, background: barColor }} />
                    </div>
                    <div className="text-[10px] mt-1.5 font-medium" style={{ color: C.textMuted }}>{g.correct}/{g.total} correct</div>
                  </div>
                );
              })}
            </div>
          </NeuCard>

          {/* Question Details */}
          <NeuCard className="p-6 mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.textMuted }}>Question Details</h3>
            <div className="space-y-2">
              {detail.questions.map((q) => (
                <div key={q.position} className={`rounded-xl p-3 flex items-start gap-3 ${
                  q.selected_key === null ? "" : q.is_correct ? "" : ""
                }`} style={{
                  background: q.selected_key === null ? C.bgLight
                    : q.is_correct ? "rgba(141,198,63,0.08)" : "rgba(239,68,68,0.06)",
                  border: q.selected_key === null ? `1px solid ${C.bgDark}`
                    : q.is_correct ? `1px solid rgba(141,198,63,0.25)` : `1px solid rgba(239,68,68,0.2)`,
                }}>
                  <span className="text-xs font-bold w-8 shrink-0 mt-0.5" style={{ color: C.textMuted }}>Q{q.position}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-1" style={{ color: C.textSec }}>{q.stem.length > 150 ? q.stem.slice(0, 150) + "..." : q.stem}</p>
                    <div className="flex gap-4 text-xs">
                      <span style={{ color: C.textMuted }}>{q.topic}</span>
                      <span className="font-semibold" style={{ color: q.is_correct ? C.green : C.red }}>
                        {q.selected_key || "—"} → {q.correct_key}
                      </span>
                    </div>
                  </div>
                  <span className="text-base mt-0.5">{q.selected_key === null ? "⬜" : q.is_correct ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>
          </NeuCard>

          {/* Essays */}
          {detail.essays.length > 0 && (
            <NeuCard className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Essay Submissions</h3>
                {detail.essays.some((e) => e.grading_state !== "graded") && (
                  <button onClick={() => gradeEssays(detail.attempt.id)} disabled={grading}
                    className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 text-white rounded-xl transition-all hover:brightness-110"
                    style={{ background: grading ? "#94a3b8" : `linear-gradient(135deg, ${C.purple}, ${C.purpleLight})` }}>
                    {grading ? "⏳ Grading..." : "🤖 Grade with AI"}
                  </button>
                )}
              </div>
              {detail.essays.map((e, i) => (
                <div key={i} className="rounded-xl p-5 mb-4" style={{ background: C.bgLight, boxShadow: C.shadowOuterSm }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold" style={{ color: C.text }}>Essay {i + 1}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg ${
                      e.grading_state === "graded" ? "text-green-700 bg-green-100" :
                      e.grading_state === "grading" ? "text-amber-700 bg-amber-100" :
                      "text-slate-600 bg-slate-200"
                    }`}>
                      {e.grading_state} {e.total_score != null ? `· ${Math.round(e.total_score)}%` : ""}
                      {e.performance_band ? ` · ${e.performance_band}` : ""}
                    </span>
                  </div>
                  <div className="rounded-lg p-4 mb-4 max-h-48 overflow-y-auto" style={{ background: "#fff", boxShadow: C.shadowPressed }}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textSec }}>{e.content}</p>
                  </div>
                  {e.grading_state === "graded" && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: "Concepts", score: e.concept_score ?? 0, color: C.blue },
                          { label: "Calculations", score: e.calc_score ?? 0, color: C.purple },
                          { label: "Communication", score: e.comm_score ?? 0, color: C.teal },
                        ].map((d) => (
                          <div key={d.label} className="text-center rounded-xl p-3" style={{ background: C.bg, boxShadow: C.shadowOuterSm }}>
                            <div className="text-xl font-extrabold" style={{ color: d.score >= 70 ? d.color : C.red }}>{d.score}%</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: C.textMuted }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                      {e.pass4_aggregate && (
                        <div className="rounded-xl p-4" style={{ background: C.bgLight, boxShadow: C.shadowPressed }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.textMuted }}>AI Feedback</div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textSec }}>{e.pass4_aggregate}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </NeuCard>
          )}

          {/* Shareable Link */}
          <NeuCard className="p-5 text-center">
            <span className="text-xs font-medium" style={{ color: C.textMuted }}>Candidate result link: </span>
            <a href={`/exam/${token}/results/${detail.attempt.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold underline" style={{ color: C.green }}>
              {window.location.origin}/exam/{token}/results/{detail.attempt.id}
            </a>
          </NeuCard>
        </div>

        {/* Footer */}
        <div className="text-center py-8 mt-4">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>CoStudy · Admin Dashboard</span>
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
        <div className="sticky top-0 z-10" style={{ background: C.bg, boxShadow: "0 2px 10px rgba(163,177,198,0.3)" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => { setView("dashboard"); setSelectedDate(null); setSelectedInstitute(null); setSelectedForDelete(new Set()); }}
              className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: C.textSec }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: C.text }}>{listTitle}</span>
              <span className="text-xs ml-3" style={{ color: C.textMuted }}>{listAttempts.length} candidate{listAttempts.length !== 1 ? "s" : ""}</span>
            </div>
            {hasSelections && (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all text-white"
                style={{ background: `linear-gradient(135deg, ${C.red}, #dc2626)` }}>
                Delete ({selectedForDelete.size})
              </button>
            )}
            <button onClick={selectAllList}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              style={{ background: C.bg, boxShadow: C.shadowOuterSm, color: C.textSec }}>
              {listAttempts.every((a) => selectedForDelete.has(a.id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        {/* Sub-header with gradient */}
        <div className="h-12 flex items-center px-6 text-white text-sm font-bold"
          style={{ background: `linear-gradient(135deg, ${C.green}, ${C.yellow})` }}>
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <span>{label ? `${label} — ` : ""}{examTitle}</span>
            <div className="flex gap-5 text-xs font-medium opacity-90">
              <span>✅ {completed.length} completed</span>
              <span>⏳ {inProg.length} in progress</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="space-y-4">
            {listAttempts.map((a) => {
              const pct = a.mcq_score ?? 0;
              const passed = pct >= 72;
              const isSelected = selectedForDelete.has(a.id);
              return (
                <NeuCard key={a.id} className={`p-5 flex items-center gap-5 ${isSelected ? "ring-2 ring-red-300" : ""}`} hover>
                  <button onClick={(ev) => { ev.stopPropagation(); toggleSelect(a.id); }}
                    className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? "text-white" : ""
                    }`} style={{
                      background: isSelected ? C.red : C.bg,
                      boxShadow: isSelected ? "none" : C.shadowOuterSm,
                    }}>
                    {isSelected && <span className="text-xs font-bold">✓</span>}
                  </button>

                  {a.state === "completed" ? (
                    <ScoreRing score={pct} size={50} />
                  ) : (
                    <div className="w-[62px] h-[62px] rounded-full flex items-center justify-center shrink-0"
                      style={{ background: C.bg, boxShadow: C.shadowOuter }}>
                      <span className="text-xl">⏳</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0" onClick={() => a.state === "completed" && viewDetail(a.id)} style={{ cursor: a.state === "completed" ? "pointer" : "default" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold truncate" style={{ color: C.text }}>{a.guest_name || "Unknown"}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-lg ${
                        a.state === "completed" ? (passed ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100") : "text-amber-700 bg-amber-100"
                      }`}>
                        {a.state === "completed" ? (passed ? "PASS" : "FAIL") : "IN PROGRESS"}
                      </span>
                      {a.metadata?.institute && (
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-lg text-purple-700 bg-purple-100">
                          {a.metadata.institute}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                      {a.guest_email || "No email"}{a.metadata?.phone ? ` · ${a.metadata.phone}` : ""}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>Started: {formatTime(a.started_at)}</p>
                  </div>

                  {a.state === "completed" && (
                    <div className="flex items-center gap-3 shrink-0">
                      <a href={`/exam/${token}/results/${a.id}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs transition-colors" style={{ color: C.textMuted }} title="Share result">🔗</a>
                      <button onClick={() => viewDetail(a.id)} disabled={detailLoading}
                        className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
                        style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})` }}>
                        View →
                      </button>
                    </div>
                  )}
                </NeuCard>
              );
            })}
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
            <NeuCard className="p-8 max-w-md w-full mx-4">
              <div className="text-4xl text-center mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-center mb-2" style={{ color: C.text }}>
                Delete {selectedForDelete.size} Attempt{selectedForDelete.size !== 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-center mb-6" style={{ color: C.textSec }}>
                This will permanently delete all MCQ responses, essay submissions, and grading data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: C.bg, boxShadow: C.shadowOuterSm, color: C.textSec }}>Cancel</button>
                <button onClick={deleteSelected} disabled={deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${C.red}, #dc2626)` }}>
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </NeuCard>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>CoStudy · Admin Dashboard</span>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     DASHBOARD VIEW
     ══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ── Vibrant Header ── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDark}, ${C.yellow})` }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                  style={{ background: "rgba(255,255,255,0.2)", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                  C
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">CoStudy Admin</div>
                  <h1 className="text-xl font-extrabold text-white">{examTitle}</h1>
                </div>
              </div>
              {label && <p className="text-sm text-white/80 ml-[60px]">{label}</p>}
            </div>
            {/* Stats toggle */}
            <button onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.2)", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
              📊 {showStats ? "Hide Stats" : "Show Stats"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Collapsible Stats */}
        {showStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-6 mb-8 relative z-20">
            <StatCard value={attempts.length} label="Total Attempts" icon="👥" gradient={`linear-gradient(135deg, ${C.blue}, ${C.blueLight})`} />
            <StatCard value={totalCompleted} label="Completed" icon="✅" gradient={`linear-gradient(135deg, ${C.green}, ${C.greenLight})`} />
            <StatCard value={`${Math.round(overallAvg)}%`} label="Avg Score" icon="📈" gradient={`linear-gradient(135deg, ${C.yellow}, ${C.yellowLight})`} />
            <StatCard value={`${passRate}%`} label="Pass Rate" icon="🎯" gradient={passRate >= 50 ? `linear-gradient(135deg, ${C.green}, ${C.teal})` : `linear-gradient(135deg, ${C.red}, ${C.pink})`} />
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div className={`flex flex-wrap items-center gap-4 mb-6 ${showStats ? "" : "mt-6"}`}>
          {/* Mode Toggle - Neumorphic */}
          <div className="flex rounded-2xl p-1.5" style={{ background: C.bg, boxShadow: C.shadowPressed }}>
            {(["day", "institute"] as FilterMode[]).map(mode => (
              <button key={mode} onClick={() => setFilterMode(mode)}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                style={{
                  background: filterMode === mode ? `linear-gradient(135deg, ${C.green}, ${C.greenDark})` : "transparent",
                  color: filterMode === mode ? "white" : C.textMuted,
                  boxShadow: filterMode === mode ? "0 4px 12px rgba(141,198,63,0.3)" : "none",
                }}>
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

          <div className="ml-auto">
            <span className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: C.bgLight, boxShadow: C.shadowOuterSm, color: C.textSec }}>
              {attempts.length} total · {totalCompleted} completed
            </span>
          </div>
        </div>

        {/* ── Group Cards ── */}
        {(filteredGroups as any[]).length === 0 ? (
          <NeuCard className="p-14 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-base font-semibold" style={{ color: C.textSec }}>No attempts yet.</p>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>Share the exam link to get started.</p>
          </NeuCard>
        ) : (
          <div className="space-y-4">
            {filterMode === "day" ? (
              (filteredGroups as DayGroup[]).map((group) => (
                <NeuCard key={group.date} hover
                  onClick={() => { setSelectedDate(group.date); setView("day"); }}
                  className="p-6 flex items-center gap-5">
                  {/* Date block - Neumorphic */}
                  <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: C.bgLight, boxShadow: C.shadowOuterSm }}>
                    <span className="text-xl font-extrabold" style={{ color: C.green }}>
                      {new Date(group.date + "T00:00:00").getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase" style={{ color: C.textMuted }}>
                      {new Date(group.date + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>{group.label}</h3>
                    <div className="flex gap-4 text-xs font-medium" style={{ color: C.textMuted }}>
                      <span>👥 {group.attempts.length} candidate{group.attempts.length !== 1 ? "s" : ""}</span>
                      <span>✅ {group.completed} completed</span>
                      {group.inProgress > 0 && <span>⏳ {group.inProgress} in progress</span>}
                    </div>
                  </div>

                  {group.completed > 0 && (
                    <div className="text-right shrink-0 px-4 py-2 rounded-xl" style={{ background: group.avgScore >= 72 ? "rgba(141,198,63,0.1)" : "rgba(239,68,68,0.08)" }}>
                      <div className="text-lg font-extrabold" style={{ color: group.avgScore >= 72 ? C.green : C.red }}>
                        {Math.round(group.avgScore)}%
                      </div>
                      <div className="text-[9px] font-bold uppercase" style={{ color: C.textMuted }}>Avg</div>
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: C.bg, boxShadow: C.shadowOuterSm }}>
                    <svg className="w-4 h-4" style={{ color: C.green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </NeuCard>
              ))
            ) : (
              (filteredGroups as InstituteGroup[]).map((group) => (
                <NeuCard key={group.name} hover
                  onClick={() => { setSelectedInstitute(group.name); setView("day"); }}
                  className="p-6 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "rgba(124,58,237,0.08)", boxShadow: C.shadowOuterSm }}>
                    🏛
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>{group.name}</h3>
                    <div className="flex gap-4 text-xs font-medium" style={{ color: C.textMuted }}>
                      <span>👥 {group.attempts.length} candidate{group.attempts.length !== 1 ? "s" : ""}</span>
                      <span>✅ {group.completed} completed</span>
                    </div>
                  </div>

                  {group.completed > 0 && (
                    <div className="text-right shrink-0 px-4 py-2 rounded-xl" style={{ background: group.avgScore >= 72 ? "rgba(141,198,63,0.1)" : "rgba(239,68,68,0.08)" }}>
                      <div className="text-lg font-extrabold" style={{ color: group.avgScore >= 72 ? C.green : C.red }}>
                        {Math.round(group.avgScore)}%
                      </div>
                      <div className="text-[9px] font-bold uppercase" style={{ color: C.textMuted }}>Avg</div>
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: C.bg, boxShadow: C.shadowOuterSm }}>
                    <svg className="w-4 h-4" style={{ color: C.purple }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </NeuCard>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-10 mt-8">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl" style={{ background: C.bg, boxShadow: C.shadowOuterSm }}>
          <span className="text-lg font-black" style={{ color: C.green }}>C</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>
            Powered by CoStudy
          </span>
        </div>
      </div>
    </div>
  );
}
