import { useEffect, useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "https://api.costudy.in";

/* ── Design tokens ───────────────────────────────── */
const C = {
  bg: "#fafbfc",
  card: "#ffffff",
  accent: "#8dc63f",
  accentDark: "#6ba832",
  gold: "#d4a853",
  purple: "#7c3aed",
  red: "#ef4444",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
};

interface TopicBreakdown {
  [topic: string]: { correct: number; total: number };
}

interface EssayResult {
  position: number;
  scenario_preview: string;
  grading_state: string;
  total_score: number | null;
  performance_band: string | null;
  concept_score: number | null;
  calc_score: number | null;
  comm_score: number | null;
  feedback: string | null;
}

interface ResultData {
  exam_title: string;
  exam_slug: string;
  label: string | null;
  candidate_name: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
  candidate_institute: string | null;
  state: string;
  mcq_score: number | null;
  essay_score: number | null;
  total_score: number | null;
  pass_threshold: number;
  mcq_summary: { correct: number; total: number; percentage: number | null };
  topic_breakdown: TopicBreakdown;
  essays: EssayResult[];
  started_at: string;
  submitted_at: string | null;
}

interface Props {
  token: string;
  attemptId: string;
}

/* ── Score Ring ───────────────────────────────────── */
function ScoreRing({ score, size = 120, pass = 72 }: { score: number; size?: number; pass?: number }) {
  const passed = score >= pass;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = passed ? C.accent : C.red;
  return (
    <svg width={size} height={size}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={passed ? "#a3e635" : "#f87171"} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <filter id="ring-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={color} floodOpacity="0.3" />
        </filter>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-grad)" strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} filter="url(#ring-shadow)" />
      <text x="50%" y="46%" textAnchor="middle" dy="0.35em" fontSize={size * 0.28} fontWeight="800" fill={C.textPrimary}>
        {Math.round(score)}%
      </text>
      <text x="50%" y="68%" textAnchor="middle" fontSize={size * 0.09} fontWeight="600" fill={color}>
        {passed ? "PASSED" : "NOT PASSED"}
      </text>
    </svg>
  );
}

/* ── Score Box ───────────────────────────────────── */
function ScoreBox({ label, score }: { label: string; score: number | null }) {
  const val = score != null ? Math.round(score) : 0;
  const color = val >= 70 ? C.accent : val >= 55 ? C.gold : C.red;
  return (
    <div className="text-center rounded-2xl p-4 border" style={{ borderColor: C.border, background: `${color}08` }}>
      <div className="text-2xl font-bold" style={{ color }}>{val}%</div>
      <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>{label}</div>
    </div>
  );
}

export function CandidateResults({ token, attemptId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResultData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Exam Results";
    fetch(`${API}/api/exam/${token}/results/${attemptId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setData(d);
        document.title = `Results — ${d.candidate_name || "Candidate"}`;
        setLoading(false);
      })
      .catch((e) => { setError(e.message || "Failed to load results"); setLoading(false); });
  }, [token, attemptId]);

  useEffect(() => {
    function close(e: MouseEvent) { if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `Hey! Check out my exam results: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function printResults() {
    window.print();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: `${C.accent} transparent ${C.accent} ${C.accent}` }} />
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Loading Results...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: C.textPrimary }}>Results Unavailable</h1>
          <p className="text-sm" style={{ color: C.textSecondary }}>{error || "Could not load results."}</p>
        </div>
      </div>
    );
  }

  const mcqPct = data.mcq_score ?? 0;
  const passed = mcqPct >= 72;
  const hasEssays = data.essays.length > 0;
  const allGraded = data.essays.every((e) => e.grading_state === "graded");
  const examDate = data.submitted_at ? new Date(data.submitted_at) : new Date(data.started_at);
  const examPart = data.exam_slug?.includes("p1") ? "Part 1" : data.exam_slug?.includes("p2") ? "Part 2" : "";

  return (
    <div className="min-h-screen print:bg-white" style={{ background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ── Header ── */}
      <div className="relative overflow-hidden print:shadow-none" style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm font-bold">C</div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">CoStudy Exam Results</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {data.exam_title}{examPart ? ` — ${examPart}` : ""}
              </h1>
              {data.label && <p className="text-sm text-white/80 mb-1">{data.label}</p>}
              <p className="text-xs text-white/60">
                {examDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {/* Share button */}
            <div ref={shareRef} className="relative print:hidden">
              <button onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 text-white text-xs font-semibold transition-all hover:bg-white/30 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              {showShareMenu && (
                <div className="absolute top-full mt-2 right-0 w-48 rounded-xl bg-white shadow-2xl border py-2 z-50" style={{ borderColor: C.border }}>
                  <button onClick={() => { copyLink(); setShowShareMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                    style={{ color: C.textSecondary }}>
                    {copied ? "✅ Copied!" : "📋 Copy Link"}
                  </button>
                  <button onClick={() => { shareWhatsApp(); setShowShareMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                    style={{ color: C.textSecondary }}>
                    💬 Share on WhatsApp
                  </button>
                  <button onClick={() => { printResults(); setShowShareMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                    style={{ color: C.textSecondary }}>
                    🖨️ Print / Save PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-6 relative z-10">
        {/* ── Welcome Card with Score ── */}
        <div className="rounded-2xl shadow-lg border p-8 mb-6" style={{ background: C.card, borderColor: C.border }}>
          <div className="text-center mb-6">
            <p className="text-sm mb-1" style={{ color: C.textMuted }}>
              {passed ? "Congratulations!" : "Keep going!"}
            </p>
            <h2 className="text-2xl font-bold mb-1" style={{ color: C.textPrimary }}>
              {data.candidate_name || "Candidate"}
            </h2>
            <p className="text-sm" style={{ color: C.textSecondary }}>
              Your examination results are ready
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <ScoreRing score={mcqPct} size={140} />
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: C.textPrimary }}>{data.mcq_summary.correct}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Correct</div>
            </div>
            <div className="text-center border-x" style={{ borderColor: C.border }}>
              <div className="text-xl font-bold" style={{ color: C.textPrimary }}>{data.mcq_summary.total}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: passed ? C.accent : C.red }}>
                {passed ? "PASS" : "FAIL"}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Result</div>
            </div>
          </div>

          {data.submitted_at && (
            <p className="text-center text-xs mt-4" style={{ color: C.textMuted }}>
              Submitted on {new Date(data.submitted_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {data.candidate_institute && ` · ${data.candidate_institute}`}
            </p>
          )}
        </div>

        {/* ── Section Performance ── */}
        <div className="rounded-2xl shadow-sm border p-6 mb-6" style={{ background: C.card, borderColor: C.border }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: C.textMuted }}>
            MCQ Performance by Section
          </h2>
          <div className="space-y-4">
            {Object.entries(data.topic_breakdown).map(([topic, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              const topicPass = pct >= 72;
              return (
                <div key={topic}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: C.textPrimary }}>{topic}</span>
                    <span className="text-sm font-bold" style={{ color: topicPass ? C.accent : C.red }}>
                      {stats.correct}/{stats.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${pct}%`,
                      background: topicPass ? `linear-gradient(90deg, ${C.accent}, #a3e635)` : `linear-gradient(90deg, ${C.red}, #f87171)`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Essay Results ── */}
        {hasEssays && (
          <div className="rounded-2xl shadow-sm border p-6 mb-6" style={{ background: C.card, borderColor: C.border }}>
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: C.textMuted }}>
              Essay Results
            </h2>
            {!allGraded && (
              <div className="rounded-xl p-4 mb-5 border flex items-start gap-3" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
                <span className="text-lg">⏳</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#92400e" }}>Grading in Progress</p>
                  <p className="text-xs mt-0.5" style={{ color: "#a16207" }}>Some essays are still being graded. Check back later for complete results.</p>
                </div>
              </div>
            )}
            {data.essays
              .sort((a, b) => a.position - b.position)
              .map((essay) => (
                <div key={essay.position} className="rounded-xl border p-5 mb-4 last:mb-0" style={{ borderColor: C.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold" style={{ color: C.textPrimary }}>Essay {essay.position}</h3>
                    {essay.grading_state === "graded" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{
                        background: essay.performance_band === "distinction" ? C.accent
                          : essay.performance_band === "pass" ? "#3b82f6"
                          : essay.performance_band === "borderline" ? C.gold : C.red,
                      }}>
                        {essay.total_score != null ? `${Math.round(essay.total_score)}%` : ""} {essay.performance_band?.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>
                        {essay.grading_state === "pending" ? "Awaiting Grading" : essay.grading_state}
                      </span>
                    )}
                  </div>

                  <p className="text-xs mb-3" style={{ color: C.textMuted }}>{essay.scenario_preview}</p>

                  {essay.grading_state === "graded" && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <ScoreBox label="Concepts" score={essay.concept_score} />
                        <ScoreBox label="Calculations" score={essay.calc_score} />
                        <ScoreBox label="Communication" score={essay.comm_score} />
                      </div>
                      {essay.feedback && (
                        <div className="rounded-xl p-4 border" style={{ background: "#f8fafc", borderColor: C.border }}>
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>
                            AI Feedback
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.textSecondary }}>
                            {essay.feedback}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* ── Share Actions (bottom) ── */}
        <div className="rounded-2xl shadow-sm border p-6 mb-6 print:hidden" style={{ background: C.card, borderColor: C.border }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.textMuted }}>Share Your Results</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={copyLink}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:shadow-md"
              style={{ borderColor: C.border, color: C.textSecondary }}>
              {copied ? "✅ Copied!" : "📋 Copy Link"}
            </button>
            <button onClick={shareWhatsApp}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ background: "#25D366" }}>
              💬 WhatsApp
            </button>
            <button onClick={printResults}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ background: C.purple }}>
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center py-8 border-t" style={{ borderColor: C.border }}>
        <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
          Powered by CoStudy · CMA Exam Preparation Platform
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
