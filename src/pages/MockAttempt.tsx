import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  type AttemptStartResponse,
  type ExamApi,
  type EssayPrompt,
  type MCQQuestion,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Phase = "loading" | "intro" | "mcq" | "essay" | "submitting" | "done";

interface Props {
  slug?: string;
  examApi?: ExamApi;
  candidateName?: string;
  onComplete: (attemptId: string, result?: unknown) => void;
}

const INTRO_PAGES = 16;
const GREEN = "#8dc63f";
const GREEN_DARK = "#7db536";
const HEADER_BG = "#333333";
const SUB_BG = GREEN;

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function MockAttempt({ slug, examApi, candidateName, onComplete }: Props) {
  const { profile } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<AttemptStartResponse | null>(null);

  // MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Essay state
  const [essayIndex, setEssayIndex] = useState(0);
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>({});
  const [submittedEssays, setSubmittedEssays] = useState<Record<string, true>>({});
  const [essayTab, setEssayTab] = useState<"scenario" | "question">("scenario");

  // Timer
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [introSeconds, setIntroSeconds] = useState(15 * 60);
  const [introPage, setIntroPage] = useState(1);

  // UI
  const [showReview, setShowReview] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [reviewFilter, setReviewFilter] = useState<"all" | "unattempted" | "attempted" | "flagged">("all");

  const essayRef = useRef<HTMLTextAreaElement | null>(null);

  const candidateDisplay = useMemo(() => {
    const name = candidateName || profile?.display_name || "Candidate";
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return `${parts[parts.length - 1].toUpperCase()}, ${parts.slice(0, -1).join(" ")}`;
    return name.toUpperCase();
  }, [candidateName, profile]);

  // Boot
  useEffect(() => {
    const startFn = examApi ? examApi.start() : api.startMock(slug!);
    startFn
      .then((r) => {
        setData(r);
        const mcqSec = (r.exam.mcq_minutes || r.exam.total_minutes) * 60;
        setSecondsLeft(mcqSec);
        setPhase("intro");
      })
      .catch(() => setPhase("done"));
  }, [slug, examApi]);

  // Main timer
  useEffect(() => {
    if (phase !== "mcq" && phase !== "essay") return;
    const t = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  // Intro timer
  useEffect(() => {
    if (phase !== "intro") return;
    const t = window.setInterval(() => setIntroSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  // Auto-submit on time up
  useEffect(() => {
    if (secondsLeft !== 0 || (phase !== "mcq" && phase !== "essay")) return;
    if (phase === "mcq" && data && data.essays.length > 0) {
      setPhase("essay");
      setEssayIndex(0);
      setEssayTab("scenario");
      setSecondsLeft((data.exam.essay_minutes || 60) * 60);
    } else {
      handleFinalize();
    }
  }, [secondsLeft, phase]);

  // MCQ answer handler
  const onSelectMcq = useCallback(
    async (q: MCQQuestion, key: string) => {
      if (!data) return;
      setAnswers((a) => ({ ...a, [q.id]: key }));
      const saveFn = examApi
        ? examApi.saveMcqAnswer(data.attempt_id, { question_id: q.id, selected_key: key, flagged: flagged[q.id] ?? false })
        : api.saveMcqAnswer(data.attempt_id, { question_id: q.id, selected_key: key, flagged: flagged[q.id] ?? false });
      try { await saveFn; }
      catch (e) { console.warn("auto-save failed", e); }
    },
    [data, flagged, examApi]
  );

  // Essay submit
  const onSubmitEssay = useCallback(
    async (prompt: EssayPrompt) => {
      if (!data) return;
      const content = essayDrafts[prompt.id]?.trim();
      if (!content || content.length < 50) { alert("Essay too short — write at least a few sentences."); return; }
      const submitFn = examApi
        ? examApi.submitEssay(data.attempt_id, { prompt_id: prompt.id, content })
        : api.submitEssay(data.attempt_id, { prompt_id: prompt.id, content });
      await submitFn;
      setSubmittedEssays((s) => ({ ...s, [prompt.id]: true }));
    },
    [data, essayDrafts, examApi]
  );

  const handleFinalize = useCallback(async () => {
    if (!data) return;
    setPhase("submitting");
    let finalResult: unknown;
    try {
      const finalizeFn = examApi ? examApi.finalize(data.attempt_id) : api.finalize(data.attempt_id);
      finalResult = await finalizeFn;
    } catch (e) { console.error(e); }
    setPhase("done");
    onComplete(data.attempt_id, finalResult);
  }, [data, onComplete, examApi]);

  // ─── LOADING ───────────────────────────────────────────
  if (phase === "loading" || !data) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#8dc63f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Assembling Exam...</span>
        </div>
      </div>
    );
  }

  if (phase === "submitting" || phase === "done") {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#8dc63f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Finalizing Submission...</span>
        </div>
      </div>
    );
  }

  const examTitle = `CMA Exam Simulation`;
  const totalQs = data.mcqs.length + data.essays.length;

  // ─── INTRODUCTION ──────────────────────────────────────
  if (phase === "intro") {
    const introProgress = Math.round((introPage / INTRO_PAGES) * 100);
    return (
      <div className="flex flex-col h-screen bg-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Top Header */}
        <div className="text-white px-4 py-2 flex justify-between items-center h-14 shrink-0" style={{ background: HEADER_BG }}>
          <div className="text-sm font-bold leading-tight">
            Page: {introPage}<br />
            <span className="font-normal text-slate-300 text-xs">Section: Introduction</span>
          </div>
          <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <ClockIcon />
            <div className="text-left">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">
                Introduction Time Rem...
              </div>
              <div className="font-mono text-lg leading-none font-bold">{formatTime(introSeconds)}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-right hidden sm:block">
              <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                <div className="bg-white h-full transition-all duration-300" style={{ width: `${introProgress}%` }} />
              </div>
              Progress {introProgress}%
            </div>
            <button className="bg-[#e6e6e6] text-[#333] px-5 py-2 font-bold text-sm border border-slate-400">
              Finish Test
            </button>
          </div>
        </div>

        {/* Green sub-header */}
        <div className="text-white px-4 py-1.5 flex justify-between items-center h-8 shrink-0 border-b" style={{ background: SUB_BG, borderColor: GREEN_DARK }}>
          <span className="font-bold text-sm">Test: {examTitle}</span>
          <span className="font-bold text-sm">Candidate: {candidateDisplay}</span>
        </div>

        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Question number sidebar */}
          <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0">
            {Array.from({ length: INTRO_PAGES }, (_, i) => (
              <button
                key={i}
                onClick={() => setIntroPage(i + 1)}
                className="h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer mb-0.5 border border-l-0 relative"
                style={{
                  background: i + 1 === introPage ? GREEN : "#9cc65a",
                  color: "white",
                  borderColor: i + 1 === introPage ? GREEN_DARK : GREEN,
                  marginLeft: i + 1 === introPage ? 4 : 0,
                  opacity: i + 1 === introPage ? 1 : 0.8,
                }}
              >
                {i + 1}
                {i + 1 === introPage && (
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `5px solid ${GREEN}` }} />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-12 overflow-y-auto">
            <div className="max-w-4xl">
              <IntroContent
                page={introPage}
                mcqCount={data.mcqs.length}
                essayCount={data.essays.length}
                totalMinutes={data.exam.total_minutes}
              />
            </div>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="px-4 py-3 flex justify-between items-center border-t shrink-0" style={{ background: "#4d4d4d", borderColor: "#666" }}>
          <div className="flex gap-1">
            <button className="p-2 text-white hover:bg-white/10 rounded">
              <GearIcon />
            </button>
            <button className="p-2 text-white hover:bg-white/10 rounded">
              <GridIcon />
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIntroPage(Math.max(1, introPage - 1))}
              disabled={introPage === 1}
              className="text-white px-5 py-2 font-bold flex items-center gap-1 text-sm disabled:opacity-50"
              style={{ background: GREEN }}
            >
              ‹ Previous
            </button>
            <button
              onClick={() => setIntroPage(Math.min(INTRO_PAGES, introPage + 1))}
              disabled={introPage === INTRO_PAGES}
              className="text-white px-5 py-2 font-bold flex items-center gap-1 text-sm disabled:opacity-50"
              style={{ background: GREEN }}
            >
              Next ›
            </button>
            <button
              className="text-white px-5 py-2 font-bold flex items-center gap-1 text-sm ml-4"
              style={{ background: GREEN }}
              onClick={() => setPhase("mcq")}
            >
              {introPage === INTRO_PAGES ? "Start the Test ›" : "Continue the Test ›"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN EXAM: MCQ + ESSAY ────────────────────────────

  const isMcqPhase = phase === "mcq";
  const currentMcq = isMcqPhase ? data.mcqs[mcqIndex] : null;
  const currentEssay = !isMcqPhase ? data.essays[essayIndex] : null;

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progressPercent = Math.round((answeredCount / data.mcqs.length) * 100);

  const allQuestionsForNav = [
    ...data.mcqs.map((q) => ({ id: q.id, type: "mcq" as const, pos: q.position })),
    ...data.essays.map((e, i) => ({ id: e.id, type: "essay" as const, pos: data.mcqs.length + i + 1 })),
  ];

  const currentNavIndex = isMcqPhase ? mcqIndex : data.mcqs.length + essayIndex;

  const navigateTo = (idx: number) => {
    if (idx < data.mcqs.length) {
      setMcqIndex(idx);
      if (phase !== "mcq") setPhase("mcq");
    } else {
      setEssayIndex(idx - data.mcqs.length);
      if (phase !== "essay") setPhase("essay");
      setEssayTab("scenario");
    }
  };

  const goNext = () => {
    if (isMcqPhase) {
      if (mcqIndex < data.mcqs.length - 1) setMcqIndex(mcqIndex + 1);
      else if (data.essays.length > 0) {
        setPhase("essay");
        setEssayIndex(0);
        setEssayTab("scenario");
        setSecondsLeft((data.exam.essay_minutes || 60) * 60);
      }
    } else {
      if (essayIndex < data.essays.length - 1) { setEssayIndex(essayIndex + 1); setEssayTab("scenario"); }
    }
  };

  const goPrev = () => {
    if (isMcqPhase) {
      if (mcqIndex > 0) setMcqIndex(mcqIndex - 1);
    } else {
      if (essayIndex > 0) { setEssayIndex(essayIndex - 1); setEssayTab("scenario"); }
      else { setPhase("mcq"); setMcqIndex(data.mcqs.length - 1); }
    }
  };

  const isLastQuestion = data.essays.length > 0
    ? (!isMcqPhase && essayIndex === data.essays.length - 1)
    : (isMcqPhase && mcqIndex === data.mcqs.length - 1);
  const isFirstQuestion = isMcqPhase && mcqIndex === 0;
  const timerDanger = secondsLeft < 300;
  const timerWarning = secondsLeft < 600;

  // Filtered questions for review panel
  const filteredReviewQs = allQuestionsForNav.filter((q) => {
    if (reviewFilter === "all") return true;
    const ans = answers[q.id];
    const flag = flagged[q.id];
    if (reviewFilter === "unattempted") return !ans;
    if (reviewFilter === "attempted") return !!ans;
    if (reviewFilter === "flagged") return !!flag;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Header */}
      <div className="text-white px-3 sm:px-4 py-2 flex justify-between items-center h-14 shrink-0 z-20 relative" style={{ background: HEADER_BG }}>
        <div className="text-sm font-bold leading-tight min-w-0">
          <span className="text-white">Page: {currentNavIndex + 1}</span><br />
          <span className="font-normal text-slate-300 text-xs">Section: {isMcqPhase ? "Multiple Choice" : "Essay"}</span>
        </div>

        <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          <ClockIcon />
          <div className="text-left">
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">
              Section Time Remaining:
            </div>
            <div className={`font-mono text-lg leading-none font-bold ${timerDanger ? "text-red-400 animate-pulse" : timerWarning ? "text-amber-400" : "text-white"}`}>
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden md:block">
            <div className="bg-slate-600 h-2.5 w-28 rounded-full overflow-hidden mb-1 border border-slate-500">
              <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%`, background: GREEN }} />
            </div>
            <span className="text-slate-400">Progress {progressPercent}%</span>
          </div>
          <button
            onClick={() => {
              if (phase === "mcq" && data.essays.length > 0) {
                if (window.confirm("Are you sure you want to finish the MCQ section? You will move to the Essay section.")) {
                  setPhase("essay");
                  setEssayIndex(0);
                  setEssayTab("scenario");
                  setSecondsLeft((data.exam.essay_minutes || 60) * 60);
                }
              } else {
                if (window.confirm("Are you sure you want to finish the test? All unanswered questions will be marked as incorrect.")) handleFinalize();
              }
            }}
            className="bg-[#e6e6e6] hover:bg-white text-[#333] px-4 py-2 font-bold text-sm border border-slate-400 transition-colors"
          >
            Finish Section
          </button>
        </div>
      </div>

      {/* Green sub-header */}
      <div className="text-white px-4 py-1.5 flex justify-between items-center h-8 shrink-0 border-b shadow-md z-10" style={{ background: SUB_BG, borderColor: GREEN_DARK }}>
        <span className="font-bold text-sm">Test: {examTitle}</span>
        <span className="font-bold text-sm">Candidate: {candidateDisplay}</span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative bg-white">
        {/* Question sidebar */}
        <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-0.5 p-1 pt-3 overflow-y-auto shrink-0">
          {allQuestionsForNav.map((q, i) => {
            const isCurrent = i === currentNavIndex;
            const isAnswered = q.type === "mcq" ? !!answers[q.id] : !!submittedEssays[q.id];
            const isFlagged = !!flagged[q.id];
            const isEssayItem = q.type === "essay";

            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                className="h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer border border-l-0 relative mb-0.5 transition-all"
                style={{
                  background: isCurrent ? GREEN : isAnswered ? "#666" : isEssayItem ? "#4d4d4d" : "#9cc65a",
                  color: "white",
                  borderColor: isCurrent ? GREEN_DARK : isAnswered ? "#4d4d4d" : isEssayItem ? "#333" : GREEN,
                  marginLeft: isCurrent ? 4 : 0,
                  opacity: isCurrent ? 1 : isAnswered ? 1 : 0.8,
                }}
              >
                {isEssayItem && <span className="text-[8px] mr-0.5">E</span>}
                {i + 1}
                {isCurrent && (
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `5px solid ${GREEN}` }} />
                )}
                {isFlagged && (
                  <div className="absolute top-0 right-0.5 text-[8px]">⚑</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Calculator overlay */}
        {showCalc && (
          <div className="absolute top-16 right-16 w-60 bg-[#e0e0e0] border-2 border-slate-400 shadow-xl z-50 select-none">
            <div className="bg-slate-700 text-white px-2 py-1 text-xs flex justify-between">
              <span>Calculator</span>
              <button onClick={() => setShowCalc(false)} className="hover:text-red-300">✕</button>
            </div>
            <div className="p-2">
              <div className="bg-white border border-slate-400 h-10 mb-2 text-right p-2 font-mono text-lg">{calcDisplay}</div>
              <div className="grid grid-cols-4 gap-1">
                {["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="].map((k) => (
                  <button
                    key={k}
                    className={`bg-slate-200 border border-slate-300 p-2 text-xs font-bold hover:bg-slate-300 ${k === "0" ? "col-span-1" : ""}`}
                    onClick={() => {
                      if (k === "C") setCalcDisplay("0");
                      else if (k === "=") { try { setCalcDisplay(String(eval(calcDisplay.replace("×", "*").replace("÷", "/").replace("−", "-")))); } catch { setCalcDisplay("Error"); } }
                      else setCalcDisplay(calcDisplay === "0" ? k : calcDisplay + k);
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section review popup */}
        {showReview && (
          <div className="absolute bottom-0 left-14 w-72 z-40 bg-[#f0f0f0] border-t border-r border-slate-400 shadow-lg flex flex-col" style={{ height: 420 }}>
            <div className="bg-[#4d4d4d] text-white px-3 py-2 font-bold text-xs flex justify-between items-center border-b border-[#666]">
              <span>Section Review</span>
              <div className="flex gap-2">
                <button onClick={() => setShowReview(false)} className="hover:text-red-300">✕</button>
              </div>
            </div>
            <div className="p-3 bg-[#e6e6e6] flex-1 overflow-y-auto">
              <div className="flex flex-col gap-1.5 mb-3 bg-[#ccc] p-3 text-xs font-bold text-slate-700">
                <span>Filter by:</span>
                {(["all", "unattempted", "attempted", "flagged"] as const).map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="reviewFilter" checked={reviewFilter === f} onChange={() => setReviewFilter(f)} />
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </label>
                ))}
                <button onClick={() => setReviewFilter("all")} className="self-end text-white px-3 py-1 text-[10px] mt-1 border" style={{ background: GREEN, borderColor: GREEN_DARK }}>
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {filteredReviewQs.map((q) => {
                  const origIdx = allQuestionsForNav.findIndex((n) => n.id === q.id);
                  const isAns = q.type === "mcq" ? !!answers[q.id] : !!submittedEssays[q.id];
                  const isFl = !!flagged[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => { navigateTo(origIdx); setShowReview(false); }}
                      className="h-8 border relative font-bold text-xs flex items-center justify-center transition-all"
                      style={{
                        background: isAns ? GREEN : "white",
                        color: isAns ? "white" : "#333",
                        borderColor: isAns ? GREEN_DARK : "#ccc",
                      }}
                    >
                      {origIdx + 1}
                      {isFl && <div className="absolute top-0 right-0.5 text-[7px]">⚑</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {isMcqPhase && currentMcq ? (
            <McqContent
              q={currentMcq}
              index={mcqIndex}
              total={data.mcqs.length}
              selected={answers[currentMcq.id] ?? null}
              isFlagged={flagged[currentMcq.id] ?? false}
              onSelect={(key) => onSelectMcq(currentMcq, key)}
              showCalc={showCalc}
              onToggleCalc={() => setShowCalc(!showCalc)}
            />
          ) : currentEssay ? (
            <EssayContent
              prompt={currentEssay}
              index={essayIndex}
              total={data.essays.length}
              draft={essayDrafts[currentEssay.id] ?? ""}
              submitted={!!submittedEssays[currentEssay.id]}
              onChange={(v) => setEssayDrafts((d) => ({ ...d, [currentEssay.id]: v }))}
              onSubmit={() => onSubmitEssay(currentEssay)}
              tab={essayTab}
              onTabChange={setEssayTab}
              essayRef={essayRef}
            />
          ) : null}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="px-4 py-2.5 flex justify-between items-center border-t shrink-0" style={{ background: "#4d4d4d", borderColor: "#666" }}>
        <div className="flex gap-1">
          <button className="p-2 text-white hover:bg-white/10 rounded" title="Settings">
            <GearIcon />
          </button>
          <button className="p-2 text-white hover:bg-white/10 rounded" onClick={() => setShowReview(!showReview)} title="Section Review">
            <GridIcon />
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={goPrev}
            disabled={isFirstQuestion}
            className="text-white px-5 py-2 font-bold flex items-center gap-1 text-sm disabled:opacity-50"
            style={{ background: GREEN }}
          >
            ‹ Previous
          </button>
          {!isLastQuestion ? (
            <button onClick={goNext} className="text-white px-5 py-2 font-bold flex items-center gap-1 text-sm" style={{ background: GREEN }}>
              Next ›
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm("Submit your exam? This cannot be undone.")) handleFinalize();
              }}
              className="text-white px-5 py-2 font-bold flex items-center gap-1 text-sm"
              style={{ background: GREEN }}
            >
              Finish Exam ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MCQ Content ──────────────────────────────────────────────────

function McqContent({
  q, index, total, selected, isFlagged, onSelect, showCalc, onToggleCalc,
}: {
  q: MCQQuestion; index: number; total: number; selected: string | null; isFlagged: boolean;
  onSelect: (key: string) => void; showCalc: boolean; onToggleCalc: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8 sm:p-10 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 border-b border-slate-200 pb-2 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Question {index + 1} of {total}
            </span>
            <span className="text-xs text-slate-400 ml-3">
              {q.section_id.replace(/_/g, " ").toUpperCase()} · {q.topic?.replace(/_/g, " ") ?? ""}
            </span>
          </div>
          <button
            onClick={onToggleCalc}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            🖩 Calculator
          </button>
        </div>

        <div className="text-base text-slate-900 leading-relaxed mb-8 whitespace-pre-wrap">
          {q.stem}
        </div>

        <div className="flex flex-col gap-2">
          {q.choices.map((c) => {
            const isSelected = selected === c.key;
            return (
              <button
                key={c.key}
                onClick={() => onSelect(c.key)}
                className={`p-3.5 border text-left text-sm flex items-start gap-3 transition-all ${
                  isSelected
                    ? "border-[#8dc63f] bg-[#f5f9e8] text-slate-900 ring-1 ring-[#8dc63f]"
                    : "border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <span
                  className="w-7 h-7 border-2 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                  style={{
                    borderColor: isSelected ? GREEN : "#ccc",
                    background: isSelected ? GREEN : "white",
                    color: isSelected ? "white" : "#666",
                  }}
                >
                  {c.key}
                </span>
                <span className="flex-1 leading-relaxed">{c.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Essay Content ────────────────────────────────────────────────

function EssayContent({
  prompt, index, total, draft, submitted, onChange, onSubmit, tab, onTabChange, essayRef,
}: {
  prompt: EssayPrompt; index: number; total: number; draft: string; submitted: boolean;
  onChange: (v: string) => void; onSubmit: () => void;
  tab: "scenario" | "question"; onTabChange: (t: "scenario" | "question") => void;
  essayRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const wordCount = useMemo(() => (draft.trim() ? draft.trim().split(/\s+/).length : 0), [draft]);

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 border-t border-slate-200">
      {/* Left panel: Scenario / Requirements */}
      <div className="flex-1 flex flex-col border-r border-slate-300 min-w-0">
        <div className="flex bg-[#e6e6e6] border-b border-slate-300 shrink-0">
          <button
            onClick={() => onTabChange("scenario")}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors relative ${
              tab === "scenario"
                ? "bg-white text-[#333] border-x border-slate-300 -mb-px z-10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            style={tab === "scenario" ? { borderTop: `2px solid ${GREEN}` } : {}}
          >
            📄 Scenario
          </button>
          <button
            onClick={() => onTabChange("question")}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors relative ${
              tab === "question"
                ? "bg-white text-[#333] border-x border-slate-300 -mb-px z-10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            style={tab === "question" ? { borderTop: `2px solid ${GREEN}` } : {}}
          >
            📋 Requirements
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-6">
          {tab === "scenario" ? (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-[#333] uppercase tracking-wide">
                  Essay {index + 1} of {total} — Business Scenario
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Read the scenario carefully before responding</p>
              </div>
              <div className="text-sm text-slate-900 leading-[1.8] whitespace-pre-wrap">
                {prompt.scenario}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-[#333] uppercase tracking-wide">Required Tasks</h3>
                <p className="text-[10px] text-slate-500 mt-1">Address each requirement in your response</p>
              </div>
              <div className="text-sm text-slate-900 leading-[1.8] whitespace-pre-wrap">
                {prompt.question}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Recommended time: {prompt.recommended_minutes} minutes
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Response editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-[#4d4d4d] text-white px-4 py-2.5 text-xs font-bold flex justify-between items-center shrink-0 border-b border-[#666]">
          <span className="uppercase tracking-wide">Response Editor</span>
          <span className="text-slate-300 font-mono">Words: {wordCount}</span>
        </div>
        <textarea
          ref={essayRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          disabled={submitted}
          placeholder="Type your response here. Show your work — calculations, reasoning, and clearly labeled answers."
          className="flex-1 resize-none p-5 bg-white text-slate-900 text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none disabled:opacity-60 disabled:bg-slate-50 border-none"
          style={{ minHeight: 300 }}
        />
        {submitted && (
          <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-center" style={{ background: GREEN, color: "white" }}>
            ✓ Submitted — Grading in progress
          </div>
        )}
        {!submitted && (
          <div className="px-4 py-2 border-t border-slate-200 flex justify-end">
            <button
              onClick={onSubmit}
              className="text-white px-6 py-2 font-bold text-xs uppercase tracking-wide"
              style={{ background: GREEN }}
            >
              Submit Essay {index + 1}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Introduction pages content ───────────────────────────────────

function IntroContent({ page, mcqCount, essayCount, totalMinutes }: {
  page: number; mcqCount: number; essayCount: number; totalMinutes: number;
}) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeStr = mins > 0 ? `${hours} hours and ${mins} minutes` : `${hours} hours`;

  const heading = (text: string) => <h2 className="text-lg font-bold text-[#333] mb-4">{text}</h2>;
  const greenNote = (text: string) => <p className="font-bold mt-6" style={{ color: GREEN }}>{text}</p>;

  switch (page) {
    case 1: return (<div>
      <h1 className="text-xl font-bold text-[#333] mb-6">CMA Exam Simulation</h1>
      {heading("Exam Structure")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>This CMA Exam Simulation exam has two (2) content sections and you will have {timeStr} to complete both sections of the exam.</p>
        <p><strong>Content Section 1:</strong> The first (1) content section is multiple-choice and you have {mcqCount} questions to complete this section.</p>
        <p><strong>Content Section 2:</strong> The second (2) content section contains {essayCount} essays and related questions.</p>
        <p className="italic text-slate-600">Please note that the purpose of this Exam Simulation is to give you a sense of the experience of the exam as it will be in the test center.</p>
        <p>Before you begin, it is strongly recommended that you take a few minutes to review the tutorial before attempting any exam questions.</p>
        <p>Please note, clicking on the "Finish Test" button and selecting "Finish Exam" at any point during the examination will end the entire exam. Any questions that are incomplete will be marked as incorrect.</p>
      </div>
      {greenNote("To begin the tutorial, click on the \"Next\" button at the bottom of the screen.")}
    </div>);

    case 2: return (<div>{heading("Welcome to the Tutorial")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>This tutorial provides a series of screens that orient you to the computer testing environment. You will be instructed on how to use the mouse and the different parts of the screen.</p>
        <p>Notice the timer at the top of the screen. A similar display will appear during the actual exam. To the left of the screen is a numbered list that shows you where you are in the series of examination questions.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 3: return (<div>{heading("Using the Mouse")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>During the exam, you will use the mouse to navigate and select answers. Click on answer choices to select them. Click on buttons to navigate between questions.</p>
        <p>You can also use keyboard shortcuts: press A, B, C, or D to quickly select an answer choice.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 4: return (<div>{heading("Screen Layout")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>The exam screen is divided into several areas:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Top bar:</strong> Shows the current page, section name, timer, progress bar, and Finish Test button.</li>
          <li><strong>Green bar:</strong> Shows the test name and candidate name.</li>
          <li><strong>Left sidebar:</strong> Numbered buttons for each question — click to jump directly.</li>
          <li><strong>Main area:</strong> Displays the current question or essay.</li>
          <li><strong>Bottom bar:</strong> Navigation buttons (Previous, Next) and tools (Settings, Section Review).</li>
        </ul>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 5: return (<div>{heading("Navigating Questions")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>You can navigate through questions using:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Previous / Next buttons:</strong> Move between questions sequentially.</li>
          <li><strong>Question sidebar:</strong> Click any numbered tab on the left to jump directly to that question.</li>
          <li><strong>Section Review:</strong> Click the grid icon at the bottom-left to see all questions at a glance.</li>
        </ul>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 6: return (<div>{heading("Scrolling")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>Some questions may contain more text than can be displayed on a single screen. When this occurs, a scrollbar will appear on the right side of the content area.</p>
        <p>Use the mouse wheel or click and drag the scrollbar to view all content. Make sure you read the entire question before selecting your answer.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 7: return (<div>{heading("Time Display")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>The countdown timer is displayed at the top center of the screen in HH:MM:SS format.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>When less than 10 minutes remain, the timer turns amber as a warning.</li>
          <li>When less than 5 minutes remain, the timer turns red and pulses.</li>
          <li>When time expires, the exam auto-submits with your current answers.</li>
        </ul>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 8: return (<div>{heading("Flagging Questions")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>You can flag questions for later review. Flagged questions display a small flag icon (⚑) on their sidebar tab.</p>
        <p>Use the Section Review panel to filter and find flagged questions. Flagging does not affect your score — it is a personal study aid.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 9: return (<div>{heading("Answering Multiple-Choice Questions")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>For multiple-choice questions:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Click on the answer option (A, B, C, or D) to select it.</li>
          <li>Your selected answer will be highlighted with a green border.</li>
          <li>You can change your answer at any time by clicking a different option.</li>
          <li>Answered questions appear as dark tabs in the sidebar.</li>
        </ul>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 10: return (<div>{heading("Changing Your Answer")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>You may change your answer to any question at any time during the exam, as long as time remains.</p>
        <p>Simply navigate back to the question and click a different answer choice. Your new selection will replace the previous one.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 11: return (<div>{heading("Essay Responses")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>Essay questions appear after all MCQ questions. The screen is split into two panels:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Left panel:</strong> Business scenario and requirements (switchable via tabs).</li>
          <li><strong>Right panel:</strong> Response editor where you type your answer.</li>
        </ul>
        <p>Word count is tracked automatically in the editor header. Address all requirements listed in the Requirements tab.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 12: return (<div>{heading("Word Processor Features")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>The response editor is a plain text editor. Type your response directly. Use clear formatting:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Label each part of your answer (a), (b), (c) to match requirements.</li>
          <li>Show all calculations with formulas and steps.</li>
          <li>Use line breaks to separate sections for readability.</li>
        </ul>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 13: return (<div>{heading("Highlighting Text")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>You can select and highlight text in the scenario panel for reference. This is a personal aid and does not affect grading.</p>
        <p>To highlight: select text with your mouse. The selection will be visually marked.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 14: return (<div>{heading("Section Review")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>During the examination, you can review the status of all questions in a current exam section using the grid icon located in the bottom-left corner of the exam screen.</p>
        <p>To navigate directly to a question, click the corresponding numbered icon. You may also filter your view by unattempted, attempted, and flagged questions.</p>
        <div className="bg-slate-100 border border-slate-200 p-4 mt-4">
          <div className="font-bold text-xs mb-2">Section Review</div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="h-7 border border-slate-300 flex items-center justify-center text-[10px] font-bold" style={{ background: i < 4 ? GREEN : i === 6 ? "#999" : "white", color: i < 4 ? "white" : "#333" }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 15: return (<div>{heading("Ending the Examination")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>After completing and reviewing all of the questions, you can end the exam by clicking the <strong>"Finish Test"</strong> button in the top-right corner of the screen.</p>
        <p>Once clicked, a pop-up window will appear confirming that you want to finish the test. Click on the "Finish" button to submit your answers.</p>
        <p><strong>Selecting "Finish Test" button during any part of the exam will terminate the exam.</strong> Once you leave the content section, you may not return. Any questions that are left incomplete will be marked as incorrect.</p>
      </div>{greenNote("Click the 'Next' button to continue.")}</div>);

    case 16: return (<div>{heading("Tutorial Conclusion")}
      <div className="space-y-4 text-sm text-[#333] leading-relaxed">
        <p>This concludes the tutorial. You can review the tutorial by clicking on the "Back" button to back up one screen at a time, or by using the numbered buttons displayed on the left side of the screen.</p>
        <p className="font-bold">Good luck with the examination.</p>
      </div>{greenNote("Click the 'Start the Test' button to exit the tutorial and begin the examination.")}</div>);

    default: return <div>Page {page}</div>;
  }
}

// ─── Icons ────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
