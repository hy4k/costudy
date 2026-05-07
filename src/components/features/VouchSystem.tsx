import { useState } from "react";
import { VOUCHES } from "@/data/content";

export function VouchSystem() {
  // Track which vouches have been given by the visitor + count delta
  const [given, setGiven] = useState<Record<number, boolean>>({});

  return (
    <div className="flex flex-col gap-3">
      {VOUCHES.map((v, i) => {
        const isGiven = given[i] ?? false;
        return (
          <div
            key={v.name}
            className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[48px_1fr_auto] gap-3 md:gap-3.5 items-center p-3 md:p-3.5 border border-line-soft bg-white/[0.02] transition-all hover:border-signal hover:bg-signal/[0.03]"
          >
            <div className="w-11 h-11 md:w-12 md:h-12 grid place-items-center font-display text-xl md:text-[22px] tracking-[0.05em] text-black bg-gradient-to-br from-signal to-signal-alt">
              {v.initials}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="text-sm font-semibold flex items-center flex-wrap gap-2">
                {v.name}
                {v.isMentor && (
                  <span className="font-mono text-[8px] tracking-wide2 bg-signal text-black px-1.5 py-0.5">
                    MENTOR
                  </span>
                )}
              </div>
              <div className="text-xs text-ink-dim truncate">{v.blurb}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="font-display text-2xl md:text-[28px] leading-none text-signal">
                {v.count + (isGiven ? 1 : 0)}
                <small className="block font-mono text-[9px] tracking-wide2 text-ink-faint mt-1">
                  VOUCHES
                </small>
              </div>
              <button
                data-hover
                onClick={() => setGiven((g) => ({ ...g, [i]: true }))}
                className={`px-3 md:px-3.5 py-2 font-mono text-[10px] uppercase tracking-wide2 border transition-all ${
                  isGiven
                    ? "bg-signal text-black border-signal"
                    : "bg-transparent text-ink border-line hover:border-signal hover:text-signal hover:bg-signal/[0.04]"
                }`}
              >
                {isGiven ? "✓ Vouched" : "+ Vouch"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
