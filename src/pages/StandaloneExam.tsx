import { useCallback, useEffect, useMemo, useState } from "react";
import { createTokenApi, validateToken } from "@/lib/api";
import { MockAttempt } from "./MockAttempt";

const GREEN = "#8dc63f";

interface Props {
  token: string;
}

type Stage = "loading" | "register" | "exam" | "results" | "error";

interface ExamInfo {
  title: string;
  mcq_count: number;
  essay_count: number;
  total_minutes: number;
}

interface ResultData {
  mcq_score: number;
  correct: number;
  total: number;
}

export function StandaloneExam({ token }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Examination Portal";
    validateToken(token)
      .then((res) => {
        setExamInfo(res.exam);
        setLabel(res.label);
        document.title = res.exam?.title || "Examination Portal";
        setStage("register");
      })
      .catch(() => {
        setErrorMsg("This exam link is invalid or has expired.");
        setStage("error");
      });
  }, [token]);

  const examApi = useMemo(() => {
    if (!name.trim()) return null;
    return createTokenApi(token, name.trim(), email.trim() || undefined);
  }, [token, name, email]);

  const handleStart = useCallback(() => {
    if (!name.trim()) return;
    setStage("exam");
  }, [name]);

  const handleComplete = useCallback((id: string, finalResult?: unknown) => {
    setAttemptId(id);
    if (finalResult && typeof finalResult === "object") {
      const r = finalResult as Record<string, number>;
      setResult({ mcq_score: r.mcq_score ?? 0, correct: r.correct ?? 0, total: r.total ?? 0 });
    }
    setStage("results");
  }, []);

  if (stage === "loading") {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#8dc63f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Verifying Access...</span>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-600">{errorMsg}</p>
          <p className="text-xs text-slate-400 mt-4">Contact your institute administrator for a valid exam link.</p>
        </div>
      </div>
    );
  }

  if (stage === "results") {
    const pct = result ? result.mcq_score : 0;
    const passed = pct >= 72;
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center max-w-lg px-6">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: passed ? GREEN : "#ef4444" }}
          >
            {Math.round(pct)}%
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Examination Complete</h1>
          <p className="text-sm text-slate-600 mb-6">
            {result ? `${result.correct} of ${result.total} questions answered correctly` : "Your responses have been recorded."}
          </p>
          <div className="inline-block px-6 py-3 border border-slate-200 text-sm text-slate-700">
            {passed ? "Performance: PASS" : "Performance: BELOW PASSING THRESHOLD"}
          </div>
          {attemptId && (
            <a
              href={`/exam/${token}/results/${attemptId}`}
              className="inline-block mt-6 px-6 py-3 text-white font-bold text-sm uppercase tracking-widest"
              style={{ background: GREEN }}
            >
              View Detailed Results
            </a>
          )}
          <p className="text-xs text-slate-400 mt-8">You may close this window. Your results have been saved.</p>
        </div>
      </div>
    );
  }

  if (stage === "exam" && examApi) {
    return (
      <MockAttempt
        examApi={examApi}
        candidateName={name.trim()}
        onComplete={handleComplete}
      />
    );
  }

  // Registration / landing
  const hours = examInfo ? Math.floor(examInfo.total_minutes / 60) : 0;
  const mins = examInfo ? examInfo.total_minutes % 60 : 0;
  const timeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;

  return (
    <div className="fixed inset-0 bg-white flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header bar */}
      <div className="h-14 flex items-center px-6 text-white shrink-0" style={{ background: "#333" }}>
        <span className="font-bold text-sm tracking-wide">Examination Portal</span>
      </div>
      <div className="h-8 flex items-center px-6 text-white text-sm font-bold shrink-0" style={{ background: GREEN }}>
        {label || "Practice Examination"}
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{examInfo?.title || "Examination"}</h1>
          <p className="text-sm text-slate-500 mb-8">{label ? `Provided by ${label}` : "Practice Examination"}</p>

          <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-slate-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{examInfo?.mcq_count || 0}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{timeStr}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time Limit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{examInfo?.essay_count || 0}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Essays</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#8dc63f] focus:ring-1 focus:ring-[#8dc63f]"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                Email <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#8dc63f] focus:ring-1 focus:ring-[#8dc63f]"
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full py-3.5 text-white font-bold text-sm uppercase tracking-widest transition-opacity disabled:opacity-40"
            style={{ background: GREEN }}
          >
            Begin Examination
          </button>

          <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed">
            Once you begin, a timer will start. You cannot pause or restart the examination.
            <br />
            Ensure you have a stable internet connection before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
}
