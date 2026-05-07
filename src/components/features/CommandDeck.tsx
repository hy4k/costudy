import { MOCK_TRAJECTORY } from "@/data/content";

const HEATMAP = [0.9, 0.7, 0.85, 0.4, 0.95, 0.55, 0.3, 0.8, 0.6, 0.9, 0.25, 0.7, 0.5, 0.85, 0.95, 0.6];

export function CommandDeck() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-3.5">
      <div className="bg-white/[0.02] border border-line-soft p-4 md:p-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-dim mb-2.5">
          Pass Probability
        </div>
        <div className="font-display text-4xl md:text-[42px] leading-none text-signal">
          81<small className="text-sm text-ink-dim font-body ml-1.5">%</small>
        </div>
        <div className="mt-3.5 h-1 bg-signal/10 relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-signal" style={{ width: "81%" }} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-line-soft p-4 md:p-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-dim mb-2.5">
          Days to Window
        </div>
        <div className="font-display text-4xl md:text-[42px] leading-none text-signal">
          42<small className="text-sm text-ink-dim font-body ml-1.5">d</small>
        </div>
        <div className="mt-3.5 h-1 bg-signal/10 relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-signal" style={{ width: "60%" }} />
        </div>
      </div>

      <div className="col-span-2 bg-white/[0.02] border border-line-soft p-4 md:p-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-dim mb-2.5">
          Topic Mastery — CMA Part 1
        </div>
        <div className="grid grid-cols-8 gap-1 mt-3.5">
          {HEATMAP.map((v, i) => (
            <div
              key={i}
              className="aspect-square"
              style={{ background: `rgba(255,214,51,${v})` }}
            />
          ))}
        </div>
      </div>

      <div className="col-span-2 bg-white/[0.02] border border-line-soft p-4 md:p-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-dim mb-2.5">
          Mock Score Trajectory · Last 12 Attempts
        </div>
        <div className="flex items-end gap-1.5 h-16 md:h-20 mt-3.5">
          {MOCK_TRAJECTORY.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-signal opacity-70"
              style={{
                height: `${h}%`,
                animation: `bar-rise 0.8s ease-out ${i * 40}ms backwards`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
