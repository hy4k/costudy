import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  type AttemptStartResponse,
  type EssayPrompt,
  type MCQQuestion,
} from "@/lib/api";

type Phase = "loading" | "mcq" | "essay" | "submitting" | "done";

interface Props {
  slug: string;
  onComplete: (attemptId: string) => void;
}

/**
 * Live exam UI. Manages the timer, MCQ navigator, essay editor,
 * and the finalize handshake with the backend.
 *
 * Design notes:
 *   - One MCQ visible at a time with a navigator strip below.
 *   - Each MCQ answer is auto-saved on selection (PUT /api/attempts/:id/mcq).
 *   - On time-up or user-clicks-Finish, we move to essays.
 *   - On essay submit, the backend kicks off async grading (multi-pass Claude).
 *   - On Finalize, we POST /finalize and route to results.
 */
export function MockAttempt({ slug, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<AttemptStartResponse | null>(null);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [essayIndex, setEssayIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>({});
  const [submittedEssays, setSubmittedEssays] = useState<Record<string, true>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);

  // ─── Boot ────────────────────────────────────────────
  useEffect(() => {
    api.startMock(slug)
      .then((r) => {
        setData(r);
        setSecondsLeft(r.exam.total_minutes * 60);
        setPhase("mcq");
      })
      .catch(() => setPhase("done")); // crude — show real error UI in prod
  }, [slug]);

  // ─── Timer ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "mcq" && phase !== "essay") return;
    const t = window.setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000
    );
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (secondsLeft === 0 && (phase === "mcq" || phase === "essay")) handleFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  // ─── MCQ answer handler (auto-save) ─────────────────
  const onSelectMcq = useCallback(
    async (q: MCQQuestion, key: string) => {
      if (!data) return;
      setAnswers((a) => ({ ...a, [q.id]: key }));
      try {
        await api.saveMcqAnswer(data.attempt_id, {
          question_id: q.id,
          selected_key: key,
          flagged: flagged[q.id] ?? false,
        });
      } catch (e) {
        console.warn("auto-save failed", e);
      }
    },
    [data, flagged]
  );

  // ─── Essay submit ────────────────────────────────────
  const onSubmitEssay = useCallback(
    async (prompt: EssayPrompt) => {
      if (!data) return;
      const content = essayDrafts[prompt.id]?.trim();
      if (!content || content.length < 50) {
        alert("Essay too short — write at least a few sentences.");
        return;
      }
      await api.submitEssay(data.attempt_id, { prompt_id: prompt.id, content });
      setSubmittedEssays((s) => ({ ...s, [prompt.id]: true }));
    },
    [data, essayDrafts]
  );

  const handleFinalize = useCallback(async () => {
    if (!data) return;
    setPhase("submitting");
    try {
      await api.finalize(data.attempt_id);
    } catch (e) {
      console.error(e);
    }
    setPhase("done");
    onComplete(data.attempt_id);
  }, [data, onComplete]);

  if (phase === "loading" || !data)
    return (
      <div className="grid place-items-center h-screen text-ink-dim font-mono text-sm tracking-[0.25em]">
        <span className="signal-blink mr-3" /> ASSEMBLING MOCK…
      </div>
    );

  if (phase === "submitting" || phase === "done")
    return (
      <div className="grid place-items-center h-screen text-ink-dim font-mono text-sm tracking-[0.25em]">
        <span className="signal-blink mr-3" /> FINALIZING ATTEMPT…
      </div>
    );

  const mcq = data.mcqs[mcqIndex];
  const essay = data.essays[essayIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <ExamHeader
        title={`MOCK · ${slug.toUpperCase()}`}
        secondsLeft={secondsLeft}
        phase={phase}
      />

      {phase === "mcq" && mcq && (
        <McqStage
          q={mcq}
          index={mcqIndex}
          total={data.mcqs.length}
          selected={answers[mcq.id] ?? null}
          flagged={flagged[mcq.id] ?? false}
          onSelect={(key) => onSelectMcq(mcq, key)}
          onFlag={() => setFlagged((f) => ({ ...f, [mcq.id]: !f[mcq.id] }))}
          onPrev={() => setMcqIndex((i) => Math.max(0, i - 1))}
          onNext={() => setMcqIndex((i) => Math.min(data.mcqs.length - 1, i + 1))}
          onProceedToEssays={() => setPhase("essay")}
          answers={answers}
          flaggedMap={flagged}
          questions={data.mcqs}
          onJump={setMcqIndex}
        />
      )}

      {phase === "essay" && essay && (
        <EssayStage
          prompt={essay}
          index={essayIndex}
          total={data.essays.length}
          draft={essayDrafts[essay.id] ?? ""}
          submitted={Boolean(submittedEssays[essay.id])}
          onChange={(v) => setEssayDrafts((d) => ({ ...d, [essay.id]: v }))}
          onSubmit={() => onSubmitEssay(essay)}
          onPrev={() => setEssayIndex((i) => Math.max(0, i - 1))}
          onNext={() => setEssayIndex((i) => Math.min(data.essays.length - 1, i + 1))}
          onFinalize={handleFinalize}
          isLast={essayIndex === data.essays.length - 1}
          allSubmitted={data.essays.every((e) => submittedEssays[e.id])}
        />
      )}
    </div>
  );
}

// ─── Header with timer ─────────────────────────────────────────
function ExamHeader({ title, secondsLeft, phase }: { title: string; secondsLeft: number; phase: Phase }) {
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const danger = secondsLeft < 300; // < 5 min
  return (
    <header className="px-5 md:px-10 py-3.5 border-b border-line-soft flex items-center justify-between bg-bg/80 backdrop-blur sticky top-0 z-50">
      <div className="font-mono text-[10px] md:text-[11px] tracking-[0.25em] text-ink-dim">
        {title} <span className="text-signal mx-2">●</span> {phase.toUpperCase()}
      </div>
      <div
        className={`font-display text-2xl md:text-3xl tracking-[0.05em] ${danger ? "text-red-400 animate-pulse" : "text-signal"}`}
      >
        {mm}:{ss}
      </div>
    </header>
  );
}

// ─── MCQ stage ─────────────────────────────────────────────────
interface McqStageProps {
  q: MCQQuestion;
  index: number;
  total: number;
  selected: string | null;
  flagged: boolean;
  onSelect: (key: string) => void;
  onFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
  onProceedToEssays: () => void;
  answers: Record<string, string | null>;
  flaggedMap: Record<string, boolean>;
  questions: MCQQuestion[];
  onJump: (i: number) => void;
}
function McqStage(p: McqStageProps) {
  const answered = useMemo(
    () => Object.values(p.answers).filter(Boolean).length,
    [p.answers]
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 px-5 md:px-10 py-8 flex-1">
      <main>
        <div className="font-mono text-[10px] tracking-[0.25em] text-signal mb-3">
          Q{p.index + 1} / {p.total} · {p.q.section_id.toUpperCase()}
        </div>
        <h2 className="text-lg md:text-xl leading-relaxed text-ink mb-7 max-w-3xl">
          {p.q.stem}
        </h2>
        <div className="flex flex-col gap-2 max-w-3xl">
          {p.q.choices.map((c) => {
            const isSelected = p.selected === c.key;
            return (
              <button
                key={c.key}
                onClick={() => p.onSelect(c.key)}
                className={`p-3.5 border text-left text-sm flex items-start gap-3 transition-colors ${
                  isSelected
                    ? "border-signal bg-signal/10 text-ink"
                    : "border-line-soft text-ink-dim hover:border-signal/50 hover:text-ink"
                }`}
              >
                <span className="w-6 h-6 border border-current grid place-items-center font-mono text-[10px] font-bold shrink-0">
                  {c.key}
                </span>
                <span className="flex-1">{c.text}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center max-w-3xl mt-8">
          <button
            onClick={p.onPrev}
            disabled={p.index === 0}
            className="font-mono text-xs tracking-[0.25em] uppercase text-ink-dim hover:text-signal disabled:opacity-30"
          >
            ← Prev
          </button>
          <button
            onClick={p.onFlag}
            className={`font-mono text-xs tracking-[0.25em] uppercase ${
              p.flagged ? "text-signal" : "text-ink-dim hover:text-signal"
            }`}
          >
            {p.flagged ? "⚑ Flagged" : "⚐ Flag for review"}
          </button>
          {p.index < p.total - 1 ? (
            <button
              onClick={p.onNext}
              className="font-mono text-xs tracking-[0.25em] uppercase font-bold bg-signal text-black px-5 py-3 hover:bg-white"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={p.onProceedToEssays}
              className="font-mono text-xs tracking-[0.25em] uppercase font-bold bg-signal text-black px-5 py-3 hover:bg-white"
            >
              Essays →
            </button>
          )}
        </div>
      </main>

      <aside className="border border-line-soft p-4 self-start sticky top-24">
        <div className="font-mono text-[10px] tracking-[0.25em] text-signal mb-3">
          NAVIGATOR · {answered}/{p.total}
        </div>
        <div className="grid grid-cols-10 lg:grid-cols-5 gap-1.5">
          {p.questions.map((qq, i) => {
            const ans = Boolean(p.answers[qq.id]);
            const fl = Boolean(p.flaggedMap[qq.id]);
            const cur = i === p.index;
            return (
              <button
                key={qq.id}
                onClick={() => p.onJump(i)}
                className={`aspect-square text-[10px] font-mono border ${
                  cur
                    ? "border-signal bg-signal text-black"
                    : ans
                    ? "border-signal/50 bg-signal/10 text-signal"
                    : "border-line-soft text-ink-dim"
                } ${fl ? "ring-1 ring-orange-400" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

// ─── Essay stage ───────────────────────────────────────────────
interface EssayStageProps {
  prompt: EssayPrompt;
  index: number;
  total: number;
  draft: string;
  submitted: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinalize: () => void;
  isLast: boolean;
  allSubmitted: boolean;
}
function EssayStage(p: EssayStageProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = useMemo(
    () => (p.draft.trim() ? p.draft.trim().split(/\s+/).length : 0),
    [p.draft]
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 px-5 md:px-10 py-8 flex-1">
      <section className="border border-line-soft p-6 lg:p-8 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto">
        <div className="font-mono text-[10px] tracking-[0.25em] text-signal mb-3">
          ESSAY {p.index + 1} / {p.total} · {p.prompt.section_id.toUpperCase()}
        </div>
        <h2 className="font-display text-2xl md:text-3xl leading-[1.05] mb-5 tracking-tight">
          Scenario
        </h2>
        <p className="text-sm leading-relaxed text-ink whitespace-pre-line">
          {p.prompt.scenario}
        </p>
        <h3 className="font-display text-xl mt-6 mb-3 tracking-tight">Question</h3>
        <p className="text-sm leading-relaxed text-ink whitespace-pre-line">
          {p.prompt.question}
        </p>
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim mt-6 pt-4 border-t border-line-soft">
          Recommended time: {p.prompt.recommended_minutes} min
        </div>
      </section>

      <section className="flex flex-col mt-6 lg:mt-0">
        <textarea
          ref={taRef}
          value={p.draft}
          onChange={(e) => p.onChange(e.target.value)}
          disabled={p.submitted}
          placeholder="Type your response here. Show your work — calculations, reasoning, and clearly labeled answers."
          className="flex-1 min-h-[420px] lg:min-h-[calc(100vh-260px)] resize-none p-5 border border-line-soft bg-black/30 text-ink text-sm leading-relaxed font-body placeholder:text-ink-faint focus:outline-none focus:border-signal disabled:opacity-60"
        />
        <div className="flex justify-between items-center mt-3 font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim">
          <span>{wordCount} words</span>
          {p.submitted && <span className="text-signal">● Submitted — grading in progress</span>}
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={p.onPrev}
            disabled={p.index === 0}
            className="flex-1 font-mono text-xs tracking-[0.25em] uppercase border border-line-soft py-3 disabled:opacity-30 hover:border-signal hover:text-signal"
          >
            ← Prev
          </button>
          {!p.submitted && (
            <button
              onClick={p.onSubmit}
              className="flex-[2] font-mono text-xs tracking-[0.25em] uppercase font-bold bg-signal text-black py-3 hover:bg-white"
            >
              Submit Essay {p.index + 1}
            </button>
          )}
          {!p.isLast ? (
            <button
              onClick={p.onNext}
              className="flex-1 font-mono text-xs tracking-[0.25em] uppercase border border-line-soft py-3 hover:border-signal hover:text-signal"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={p.onFinalize}
              disabled={!p.allSubmitted}
              className="flex-1 font-mono text-xs tracking-[0.25em] uppercase font-bold bg-signal text-black py-3 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Finalize ✓
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
