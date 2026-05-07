import { useState } from "react";
import { MOCK_QUESTION } from "@/data/content";

type State = "idle" | "selected";

export function MockTestEngine() {
  const [picked, setPicked] = useState<string | null>(null);
  const state: State = picked ? "selected" : "idle";

  const getOptionClass = (key: string, correct: boolean) => {
    const base =
      "mock-opt p-3 md:p-3.5 border border-line-soft text-sm flex items-center gap-3 cursor-pointer";
    if (state === "idle") return `${base} text-ink-dim`;
    // After selection: highlight chosen + always show correct answer
    if (correct) return `${base} correct`;
    if (key === picked) return `${base} wrong`;
    return `${base} text-ink-faint opacity-60`;
  };

  return (
    <div className="bg-white/[0.02] border border-line-soft p-5 md:p-6">
      <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-signal text-ink-dim mb-4 md:mb-[18px] pb-3 md:pb-3.5 border-b border-line-soft">
        <span className="truncate pr-2">{MOCK_QUESTION.section}</span>
        <span className="shrink-0">{MOCK_QUESTION.points}</span>
      </div>
      <div className="text-[15px] leading-relaxed text-ink mb-5">{MOCK_QUESTION.text}</div>
      <div className="flex flex-col gap-2">
        {MOCK_QUESTION.options.map((opt) => (
          <button
            key={opt.key}
            data-hover
            onClick={() => setPicked(opt.key)}
            disabled={state === "selected"}
            className={getOptionClass(opt.key, opt.correct)}
          >
            <span className="w-6 h-6 border border-current grid place-items-center font-mono text-[10px] font-bold shrink-0">
              {opt.key}
            </span>
            <span className="text-left">{opt.text}</span>
          </button>
        ))}
      </div>
      {state === "selected" && (
        <div className="mt-4 font-mono text-[10px] uppercase tracking-signal text-ink-dim">
          {MOCK_QUESTION.options.find((o) => o.key === picked)?.correct ? (
            <span className="text-[#4ade80]">● Correct — added to mastery streak</span>
          ) : (
            <span className="text-[#ef4444]">● Wrong — queued for AI Mastermind drill</span>
          )}
        </div>
      )}
    </div>
  );
}
