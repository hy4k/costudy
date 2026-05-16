import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://api.costudy.in";
const GREEN = "#8dc63f";

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
  candidate_name: string | null;
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

export function CandidateResults({ token, attemptId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResultData | null>(null);

  useEffect(() => {
    document.title = "Exam Results";
    fetch(`${API}/api/exam/${token}/results/${attemptId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Failed to load results");
        setLoading(false);
      });
  }, [token, attemptId]);

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

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Results Unavailable</h1>
          <p className="text-sm text-slate-600">{error || "Could not load results."}</p>
        </div>
      </div>
    );
  }

  const mcqPct = data.mcq_score ?? 0;
  const passed = mcqPct >= 72;
  const hasEssays = data.essays.length > 0;
  const allGraded = data.essays.every((e) => e.grading_state === "graded");

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="h-14 flex items-center px-6 text-white shrink-0" style={{ background: "#333" }}>
        <span className="font-bold text-sm tracking-wide">Exam Results</span>
      </div>
      <div className="h-8 flex items-center px-6 text-white text-sm font-bold shrink-0" style={{ background: GREEN }}>
        {data.exam_title}
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {/* Score Hero */}
        <div className="bg-white border border-slate-200 p-8 mb-6 text-center">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
            style={{ background: passed ? GREEN : "#ef4444" }}
          >
            {Math.round(mcqPct)}%
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {data.candidate_name || "Candidate"}
          </h1>
          <p className="text-lg font-bold mb-2" style={{ color: passed ? GREEN : "#ef4444" }}>
            {passed ? "PASSED" : "NOT PASSED"}
          </p>
          <p className="text-sm text-slate-500">
            MCQ: {data.mcq_summary.correct}/{data.mcq_summary.total} correct
            {hasEssays && data.essay_score != null && ` · Essay: ${Math.round(data.essay_score)}%`}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {data.submitted_at ? `Submitted: ${new Date(data.submitted_at).toLocaleString()}` : ""}
          </p>
        </div>

        {/* MCQ Topic Breakdown */}
        <div className="bg-white border border-slate-200 p-6 mb-6">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">
            MCQ Performance by Section
          </h2>
          <div className="space-y-4">
            {Object.entries(data.topic_breakdown).map(([topic, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              const topicPass = pct >= 72;
              return (
                <div key={topic}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-700">{topic}</span>
                    <span className={`text-sm font-bold ${topicPass ? "text-green-600" : "text-red-500"}`}>
                      {stats.correct}/{stats.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: topicPass ? GREEN : "#ef4444" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Essay Results */}
        {hasEssays && (
          <div className="bg-white border border-slate-200 p-6 mb-6">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">
              Essay Results
            </h2>
            {!allGraded && (
              <div className="bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-800">
                Some essays are still being graded. Check back later for full results.
              </div>
            )}
            {data.essays
              .sort((a, b) => a.position - b.position)
              .map((essay) => (
                <div key={essay.position} className="border border-slate-200 p-5 mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Essay {essay.position}</h3>
                    {essay.grading_state === "graded" ? (
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-full text-white"
                        style={{
                          background:
                            essay.performance_band === "distinction"
                              ? GREEN
                              : essay.performance_band === "pass"
                              ? "#3b82f6"
                              : essay.performance_band === "borderline"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      >
                        {essay.total_score != null ? `${Math.round(essay.total_score)}%` : ""}{" "}
                        {essay.performance_band?.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                        {essay.grading_state === "pending" ? "Awaiting Grading" : essay.grading_state}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-3">{essay.scenario_preview}</p>

                  {essay.grading_state === "graded" && (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <ScoreBox label="Concepts" score={essay.concept_score} />
                        <ScoreBox label="Calculations" score={essay.calc_score} />
                        <ScoreBox label="Communication" score={essay.comm_score} />
                      </div>
                      {essay.feedback && (
                        <div className="bg-slate-50 border border-slate-200 p-4">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Feedback
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
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

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          Powered by CoStudy · CMA Exam Preparation Platform
        </div>
      </div>
    </div>
  );
}

function ScoreBox({ label, score }: { label: string; score: number | null }) {
  const val = score != null ? Math.round(score) : 0;
  const color = val >= 70 ? GREEN : val >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="text-center border border-slate-200 p-3">
      <div className="text-2xl font-bold" style={{ color }}>
        {val}%
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}
