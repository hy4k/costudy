import { useEffect, useState, useMemo } from "react";

const API = import.meta.env.VITE_API_URL || "https://api.costudy.in";
const GREEN = "#8dc63f";
const DARK = "#1a1a2e";

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

interface DayGroup {
  date: string;
  label: string;
  attempts: Attempt[];
  completed: number;
  inProgress: number;
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
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function ScoreCircle({ score, size = 56, pass = 72 }: { score: number; size?: number; pass?: number }) {
  const passed = score >= pass;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={passed ? GREEN : "#ef4444"} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fontSize={size * 0.26} fontWeight="bold" fill={passed ? GREEN : "#ef4444"}>
        {Math.round(score)}%
      </text>
    </svg>
  );
}

/* ── Component ────────────────────────────────────── */
export function AdminResults({ token }: Props) {
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [label, setLabel] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  /* Day groups */
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
          ? completed.reduce((s, a) => s + (a.mcq_score ?? 0), 0) / completed.length
          : 0;
        return { date: key, label: dayLabel(key), attempts: atts, completed: completed.length, inProgress: inProg.length, avgScore };
      });
  }, [attempts]);

  const selectedDay = dayGroups.find((g) => g.date === selectedDate);

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
      .then((d) => {
        setGrading(false);
        if (d.ok) viewDetail(attemptId);
      })
      .catch(() => setGrading(false));
  }

  function deleteSelected() {
    if (selectedForDelete.size === 0) return;
    setDeleting(true);
    fetch(`${API}/api/admin/exam/${token}/delete-attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempt_ids: Array.from(selectedForDelete) }),
    })
      .then((r) => r.json())
      .then((d) => {
        setDeleting(false);
        setShowDeleteConfirm(false);
        if (d.ok) {
          setAttempts((prev) => prev.filter((a) => !selectedForDelete.has(a.id)));
          setSelectedForDelete(new Set());
          // If day view is now empty, go back to dashboard
          if (selectedDay && selectedDay.attempts.filter((a) => !selectedForDelete.has(a.id)).length === 0) {
            setView("dashboard");
            setSelectedDate(null);
          }
        }
      })
      .catch(() => { setDeleting(false); setShowDeleteConfirm(false); });
  }

  function toggleSelect(id: string) {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllDay(dayAttempts: Attempt[]) {
    setSelectedForDelete((prev) => {
      const next = new Set(prev);
      const allSelected = dayAttempts.every((a) => next.has(a.id));
      dayAttempts.forEach((a) => allSelected ? next.delete(a.id) : next.add(a.id));
      return next;
    });
  }

  /* ── Loading / Error ─── */
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: DARK }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#8dc63f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Loading Results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: DARK }}>
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Access Error</h1>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen" style={{ background: "#0f0f1a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Top Bar */}
        <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(15,15,26,0.9)" }}>
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
            <button onClick={() => { setView("day"); setDetail(null); }} className="text-slate-400 hover:text-white transition mr-4 text-sm">
              ← Back
            </button>
            <div className="flex-1">
              <span className="text-white font-bold text-sm">{detail.attempt.guest_name || "Unknown Candidate"}</span>
              <span className="text-slate-500 text-xs ml-3">{detail.attempt.guest_email}</span>
            </div>
            <a href={`/exam/${token}/results/${detail.attempt.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition">
              Share Result ↗
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {/* Score Hero */}
          <div className="rounded-2xl p-8 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: passed ? GREEN : "#ef4444", filter: "blur(80px)" }} />
            <div className="flex items-center gap-8 relative z-10">
              <ScoreCircle score={pct} size={100} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{detail.attempt.guest_name || "Unknown"}</h2>
                <p className="text-slate-400 text-sm mb-3">{detail.attempt.guest_email || "No email"}</p>
                <div className="flex gap-6">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">MCQ</div>
                    <div className="text-lg font-bold text-white">{s.correct}/{s.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Answered</div>
                    <div className="text-lg font-bold text-white">{s.answered}</div>
                  </div>
                  {essayAvg !== null && (
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">Essay Avg</div>
                      <div className="text-lg font-bold text-white">{Math.round(essayAvg)}%</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Result</div>
                    <div className={`text-lg font-bold ${passed ? "text-green-400" : "text-red-400"}`}>{passed ? "PASS" : "FAIL"}</div>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Started: {formatDate(detail.attempt.started_at)} {formatTime(detail.attempt.started_at)}</div>
                {detail.attempt.submitted_at && <div>Submitted: {formatTime(detail.attempt.submitted_at)}</div>}
              </div>
            </div>
          </div>

          {/* Topic Breakdown */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: "#1e1e2f" }}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Section Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(topicGroups).map(([topic, g]) => {
                const topicPct = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0;
                return (
                  <div key={topic} className="rounded-xl p-4" style={{ background: "#16162a" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300 truncate mr-2">{topic}</span>
                      <span className={`text-sm font-bold ${topicPct >= 72 ? "text-green-400" : "text-red-400"}`}>{topicPct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${topicPct}%`, background: topicPct >= 72 ? GREEN : "#ef4444" }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{g.correct}/{g.total} correct</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Questions */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: "#1e1e2f" }}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Question Details</h3>
            <div className="space-y-2">
              {detail.questions.map((q) => (
                <div key={q.position} className={`rounded-lg p-3 flex items-start gap-3 ${
                  q.selected_key === null ? "bg-white/5" : q.is_correct ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <span className="text-xs font-bold text-slate-500 mt-0.5 w-8 shrink-0">Q{q.position}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 mb-1">{q.stem.length > 150 ? q.stem.slice(0, 150) + "..." : q.stem}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="text-slate-500">{q.topic}</span>
                      <span className={q.is_correct ? "text-green-400" : "text-red-400"}>
                        {q.selected_key || "—"} → {q.correct_key}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg mt-1">{q.selected_key === null ? "⬜" : q.is_correct ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Essays */}
          {detail.essays.length > 0 && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#1e1e2f" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Essay Submissions</h3>
                {detail.essays.some((e) => e.grading_state !== "graded") && (
                  <button onClick={() => gradeEssays(detail.attempt.id)} disabled={grading}
                    className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 text-white rounded-lg transition-all"
                    style={{ background: grading ? "#475569" : GREEN }}>
                    {grading ? "⏳ Grading..." : "🤖 Grade with AI"}
                  </button>
                )}
              </div>
              {detail.essays.map((e, i) => (
                <div key={i} className="rounded-xl p-5 mb-4" style={{ background: "#16162a" }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-300">Essay {i + 1}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      e.grading_state === "graded" ? "bg-green-500/20 text-green-400" :
                      e.grading_state === "grading" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>
                      {e.grading_state} {e.total_score != null ? `· ${Math.round(e.total_score)}%` : ""}
                      {e.performance_band ? ` · ${e.performance_band}` : ""}
                    </span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                    <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">{e.content}</p>
                  </div>
                  {e.grading_state === "graded" && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: "Concepts", score: e.concept_score ?? 0 },
                          { label: "Calculations", score: e.calc_score ?? 0 },
                          { label: "Communication", score: e.comm_score ?? 0 },
                        ].map((d) => (
                          <div key={d.label} className="text-center rounded-lg p-3" style={{ background: "#0f0f1a" }}>
                            <div className="text-xl font-bold" style={{ color: d.score >= 70 ? GREEN : "#ef4444" }}>{d.score}%</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{d.label}</div>
                          </div>
                        ))}
                      </div>
                      {e.pass4_aggregate && (
                        <div className="rounded-lg p-4 border border-white/5" style={{ background: "#0f0f1a" }}>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI Feedback</div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{e.pass4_aggregate}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Shareable Link */}
          <div className="rounded-2xl p-4 text-center" style={{ background: "#1e1e2f" }}>
            <span className="text-xs text-slate-500">Candidate result link: </span>
            <a href={`/exam/${token}/results/${detail.attempt.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold underline" style={{ color: GREEN }}>
              {window.location.origin}/exam/{token}/results/{detail.attempt.id}
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     DAY VIEW — candidates for selected day
     ══════════════════════════════════════════════════════ */
  if (view === "day" && selectedDay) {
    const dayAtts = selectedDay.attempts.filter((a) => attempts.some((at) => at.id === a.id));
    const completed = dayAtts.filter((a) => a.state === "completed");
    const inProg = dayAtts.filter((a) => a.state === "in_progress");
    const hasSelections = dayAtts.some((a) => selectedForDelete.has(a.id));

    return (
      <div className="min-h-screen" style={{ background: "#0f0f1a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Top Bar */}
        <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(15,15,26,0.9)" }}>
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
            <button onClick={() => { setView("dashboard"); setSelectedDate(null); setSelectedForDelete(new Set()); }}
              className="text-slate-400 hover:text-white transition mr-4 text-sm">← Back</button>
            <div className="flex-1">
              <span className="text-white font-bold text-sm">{selectedDay.label}</span>
              <span className="text-slate-500 text-xs ml-3">{dayAtts.length} candidate{dayAtts.length !== 1 ? "s" : ""}</span>
            </div>
            {hasSelections && (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition mr-3">
                🗑 Delete ({selectedForDelete.size})
              </button>
            )}
            <button onClick={() => selectAllDay(dayAtts)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition">
              {dayAtts.every((a) => selectedForDelete.has(a.id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        {/* Green sub-header */}
        <div className="h-10 flex items-center px-6 text-white text-sm font-bold" style={{ background: GREEN }}>
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <span>{label ? `${label} — ` : ""}{examTitle}</span>
            <div className="flex gap-6 text-xs">
              <span>✅ {completed.length} completed</span>
              <span>⏳ {inProg.length} in progress</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="space-y-3">
            {dayAtts.map((a) => {
              const pct = a.mcq_score ?? 0;
              const passed = pct >= 72;
              const isSelected = selectedForDelete.has(a.id);
              return (
                <div key={a.id} className={`rounded-xl p-5 flex items-center gap-5 transition-all cursor-pointer group ${
                  isSelected ? "ring-2 ring-red-500/50 bg-red-500/5" : "hover:bg-white/5"
                }`} style={{ background: isSelected ? "rgba(239,68,68,0.05)" : "#1e1e2f" }}>
                  {/* Checkbox */}
                  <button onClick={(ev) => { ev.stopPropagation(); toggleSelect(a.id); }}
                    className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition ${
                      isSelected ? "bg-red-500 border-red-500 text-white" : "border-slate-600 hover:border-slate-400"
                    }`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>

                  {/* Score */}
                  {a.state === "completed" ? (
                    <ScoreCircle score={pct} size={48} />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/10 shrink-0">
                      <span className="text-amber-400 text-lg">⏳</span>
                    </div>
                  )}

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0" onClick={() => a.state === "completed" && viewDetail(a.id)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{a.guest_name || "Unknown"}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        a.state === "completed" ? (passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400") : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {a.state === "completed" ? (passed ? "PASS" : "FAIL") : "IN PROGRESS"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{a.guest_email || "No email"}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Started: {formatTime(a.started_at)}</p>
                  </div>

                  {/* Actions */}
                  {a.state === "completed" && (
                    <div className="flex items-center gap-3 shrink-0">
                      <a href={`/exam/${token}/results/${a.id}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-300 transition" title="Share result">
                        🔗
                      </a>
                      <button onClick={() => viewDetail(a.id)} disabled={detailLoading}
                        className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg text-white transition"
                        style={{ background: GREEN }}>
                        View →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div className="rounded-2xl p-8 max-w-md w-full mx-4" style={{ background: "#1e1e2f" }}>
              <div className="text-3xl text-center mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-white text-center mb-2">Delete {selectedForDelete.size} Attempt{selectedForDelete.size !== 1 ? "s" : ""}?</h3>
              <p className="text-sm text-slate-400 text-center mb-6">
                This will permanently delete all MCQ responses, essay submissions, and grading data for the selected candidates. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition">
                  Cancel
                </button>
                <button onClick={deleteSelected} disabled={deleting}
                  className="flex-1 py-3 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     DASHBOARD VIEW — day-wise overview
     ══════════════════════════════════════════════════════ */
  const totalCompleted = attempts.filter((a) => a.state === "completed").length;
  const totalInProg = attempts.filter((a) => a.state === "in_progress").length;
  const overallAvg = totalCompleted > 0
    ? attempts.filter((a) => a.state === "completed").reduce((s, a) => s + (a.mcq_score ?? 0), 0) / totalCompleted
    : 0;
  const passRate = totalCompleted > 0
    ? Math.round((attempts.filter((a) => a.state === "completed" && (a.mcq_score ?? 0) >= 72).length / totalCompleted) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0f0f1a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/10" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: GREEN }}>📊</div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{examTitle}</h1>
          {label && <p className="text-sm text-slate-400">{label}</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { value: attempts.length, label: "Total Attempts", icon: "👥", color: "#3b82f6" },
            { value: totalCompleted, label: "Completed", icon: "✅", color: GREEN },
            { value: `${Math.round(overallAvg)}%`, label: "Avg Score", icon: "📈", color: "#f59e0b" },
            { value: `${passRate}%`, label: "Pass Rate", icon: "🎯", color: passRate >= 50 ? GREEN : "#ef4444" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-5" style={{ background: "#1e1e2f" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Day-wise Cards */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Exam Sessions by Day</h2>
          {dayGroups.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ background: "#1e1e2f" }}>
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 text-sm">No attempts yet. Share the exam link to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayGroups.map((group) => (
                <button key={group.date} onClick={() => { setSelectedDate(group.date); setView("day"); }}
                  className="w-full rounded-xl p-5 flex items-center gap-5 text-left group transition-all hover:scale-[1.01]"
                  style={{ background: "#1e1e2f" }}>
                  {/* Date */}
                  <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: "#16162a" }}>
                    <span className="text-xl font-bold text-white">{new Date(group.date + "T00:00:00").getDate()}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {new Date(group.date + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-green-400 transition">{group.label}</h3>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>👥 {group.attempts.length} candidate{group.attempts.length !== 1 ? "s" : ""}</span>
                      <span>✅ {group.completed} completed</span>
                      {group.inProgress > 0 && <span>⏳ {group.inProgress} in progress</span>}
                    </div>
                  </div>

                  {/* Avg Score */}
                  {group.completed > 0 && (
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold ${group.avgScore >= 72 ? "text-green-400" : "text-red-400"}`}>
                        {Math.round(group.avgScore)}%
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">avg score</div>
                    </div>
                  )}

                  <span className="text-slate-600 group-hover:text-slate-400 transition text-lg">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-600">
            Submissions stored permanently in database · Token: <span className="font-mono text-slate-500">{token}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
