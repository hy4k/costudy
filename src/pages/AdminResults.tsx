import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://api.costudy.in";
const GREEN = "#8dc63f";

interface Attempt {
  id: string;
  state: string;
  guest_name: string | null;
  guest_email: string | null;
  mcq_score: number | null;
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

type View = "list" | "detail";

interface Props {
  token: string;
}

export function AdminResults({ token }: Props) {
  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [label, setLabel] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    document.title = "Exam Results — Admin";
    fetch(`${API}/api/admin/exam/${token}/attempts`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setExamTitle(d.exam?.title || "Exam");
        setLabel(d.label || "");
        setAttempts(d.attempts || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load");
        setLoading(false);
      });
  }, [token]);

  const viewDetail = (attemptId: string) => {
    setDetailLoading(true);
    fetch(`${API}/api/admin/exam/${token}/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setDetail(d);
        setView("detail");
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#8dc63f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Loading Results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Error</h1>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (view === "detail" && detail) {
    const s = detail.summary;
    const pct = s.mcq_score ?? 0;
    const passed = pct >= 72;
    const topicGroups: Record<string, { correct: number; total: number }> = {};
    detail.questions.forEach((q) => {
      if (!topicGroups[q.topic]) topicGroups[q.topic] = { correct: 0, total: 0 };
      topicGroups[q.topic].total++;
      if (q.is_correct) topicGroups[q.topic].correct++;
    });

    return (
      <div className="min-h-screen bg-slate-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div className="h-14 flex items-center px-6 text-white shrink-0" style={{ background: "#333" }}>
          <button onClick={() => setView("list")} className="mr-4 hover:text-green-400 transition-colors">&larr; Back</button>
          <span className="font-bold text-sm tracking-wide">Result Detail — {detail.attempt.guest_name || "Unknown"}</span>
        </div>
        <div className="h-8 flex items-center px-6 text-white text-sm font-bold shrink-0" style={{ background: GREEN }}>
          {examTitle}
        </div>

        <div className="max-w-5xl mx-auto p-6">
          {/* Score Summary */}
          <div className="bg-white border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-6 mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ background: passed ? GREEN : "#ef4444" }}
              >
                {Math.round(pct)}%
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{detail.attempt.guest_name || "Unknown Candidate"}</h2>
                <p className="text-sm text-slate-500">{detail.attempt.guest_email || "No email"}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {s.correct} / {s.total} correct · {s.answered} answered · {passed ? "PASS" : "FAIL"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Started: {new Date(detail.attempt.started_at).toLocaleString()} ·
                  Submitted: {detail.attempt.submitted_at ? new Date(detail.attempt.submitted_at).toLocaleString() : "—"}
                </p>
              </div>
            </div>

            {/* Topic Breakdown */}
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Section Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {Object.entries(topicGroups).map(([topic, g]) => {
                const topicPct = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0;
                return (
                  <div key={topic} className="border border-slate-200 p-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{topic}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-900">{g.correct}/{g.total}</span>
                      <span className={`text-sm font-bold ${topicPct >= 72 ? "text-green-600" : "text-red-500"}`}>{topicPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 mt-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${topicPct}%`, background: topicPct >= 72 ? GREEN : "#ef4444" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question-by-Question */}
          <div className="bg-white border border-slate-200 p-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">Question Details</h3>
            <div className="space-y-4">
              {detail.questions.map((q) => (
                <div
                  key={q.position}
                  className={`border-l-4 p-4 ${
                    q.selected_key === null ? "border-slate-300 bg-slate-50" : q.is_correct ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-slate-400 mt-0.5 shrink-0">Q{q.position}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 mb-2">{q.stem}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="text-slate-500">Topic: {q.topic}</span>
                        <span className={q.is_correct ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                          Selected: {q.selected_key || "—"} · Correct: {q.correct_key}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Essay Submissions */}
          {detail.essays.length > 0 && (
            <div className="bg-white border border-slate-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Essay Submissions</h3>
                {detail.essays.some((e) => e.grading_state !== "graded") && (
                  <button
                    onClick={() => {
                      setGrading(true);
                      fetch(`${API}/api/admin/exam/${token}/attempts/${detail.attempt.id}/grade-essays`, { method: "POST" })
                        .then((r) => r.json())
                        .then((d) => {
                          setGrading(false);
                          if (d.ok) viewDetail(detail.attempt.id);
                        })
                        .catch(() => setGrading(false));
                    }}
                    disabled={grading}
                    className="text-xs font-bold uppercase tracking-widest px-4 py-2 text-white rounded"
                    style={{ background: grading ? "#94a3b8" : GREEN }}
                  >
                    {grading ? "Grading..." : "Grade Essays with AI"}
                  </button>
                )}
              </div>
              {detail.essays.map((e, i) => (
                <div key={i} className="border border-slate-200 p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">Essay {i + 1}</span>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: e.grading_state === "graded" ? GREEN : "#f59e0b" }}>
                      {e.grading_state} {e.total_score != null ? `— ${Math.round(e.total_score)}%` : ""} {e.performance_band ? `(${e.performance_band})` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{e.content}</p>
                  {e.grading_state === "graded" && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center border border-slate-200 p-2">
                          <div className="text-lg font-bold" style={{ color: (e.concept_score ?? 0) >= 70 ? GREEN : "#ef4444" }}>{e.concept_score ?? 0}%</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">Concepts</div>
                        </div>
                        <div className="text-center border border-slate-200 p-2">
                          <div className="text-lg font-bold" style={{ color: (e.calc_score ?? 0) >= 70 ? GREEN : "#ef4444" }}>{e.calc_score ?? 0}%</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">Calculations</div>
                        </div>
                        <div className="text-center border border-slate-200 p-2">
                          <div className="text-lg font-bold" style={{ color: (e.comm_score ?? 0) >= 70 ? GREEN : "#ef4444" }}>{e.comm_score ?? 0}%</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">Communication</div>
                        </div>
                      </div>
                      {e.pass4_aggregate && (
                        <div className="bg-slate-50 border border-slate-200 p-3">
                          <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">AI Feedback</div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{e.pass4_aggregate}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Candidate Result Link */}
          <div className="bg-white border border-slate-200 p-4 mt-6 text-center">
            <span className="text-xs text-slate-500">Candidate result link: </span>
            <a
              href={`/exam/${token}/results/${detail.attempt.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold underline"
              style={{ color: GREEN }}
            >
              {window.location.origin}/exam/{token}/results/{detail.attempt.id}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────
  const completed = attempts.filter((a) => a.state === "completed");
  const inProgress = attempts.filter((a) => a.state === "in_progress");

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="h-14 flex items-center px-6 text-white shrink-0" style={{ background: "#333" }}>
        <span className="font-bold text-sm tracking-wide">Exam Results — Admin Panel</span>
      </div>
      <div className="h-8 flex items-center px-6 text-white text-sm font-bold shrink-0" style={{ background: GREEN }}>
        {label ? `${label} — ` : ""}{examTitle}
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">{attempts.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Attempts</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">{completed.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Completed</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">{inProgress.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">In Progress</div>
          </div>
        </div>

        {/* Attempt List */}
        <div className="bg-white border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">All Attempts</h2>
          </div>
          {attempts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No attempts yet. Share the exam link to get started.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Candidate</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const pct = a.mcq_score ?? 0;
                  const passed = pct >= 72;
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">{a.guest_name || "—"}</td>
                      <td className="px-6 py-3 text-slate-500">{a.guest_email || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                          a.state === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {a.state}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {a.state === "completed" ? (
                          <span className={`font-bold ${passed ? "text-green-600" : "text-red-500"}`}>{Math.round(pct)}%</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 text-xs">{new Date(a.started_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        {a.state === "completed" && (
                          <button
                            onClick={() => viewDetail(a.id)}
                            disabled={detailLoading}
                            className="text-[10px] font-bold uppercase tracking-widest hover:underline"
                            style={{ color: GREEN }}
                          >
                            View →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
