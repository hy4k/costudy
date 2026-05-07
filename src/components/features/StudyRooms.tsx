import { ROOM_TIMELINE } from "@/data/content";

interface DeckBarProps {
  width: number; // 0–100
  delay?: number;
}

function DeckBar({ width, delay = 0 }: DeckBarProps) {
  return (
    <div className="mt-3.5 h-1 bg-signal/10 relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full bg-signal"
        style={
          {
            width: 0,
            animation: `bar-fill 2s cubic-bezier(0.4,0,0.2,1) ${delay}ms forwards`,
            ["--w" as string]: `${width}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

interface CardProps {
  label: string;
  big: React.ReactNode;
  width: number;
  delay?: number;
  wide?: boolean;
}

function DeckCard({ label, big, width, delay = 0, wide = false }: CardProps) {
  return (
    <div
      className={`bg-white/[0.02] border border-line-soft p-4 md:p-[18px] relative ${
        wide ? "col-span-2" : ""
      }`}
    >
      <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-dim mb-2.5">
        {label}
      </div>
      <div className="font-display text-4xl md:text-[42px] leading-none text-signal">{big}</div>
      <DeckBar width={width} delay={delay} />
    </div>
  );
}

export function StudyRooms() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-3.5">
      <DeckCard
        label="Focus Timer"
        big={
          <>
            23<small className="text-sm text-ink-dim font-body ml-1.5">:14</small>
          </>
        }
        width={78}
        delay={200}
      />
      <DeckCard
        label="Room Streak"
        big={
          <>
            11<small className="text-sm text-ink-dim font-body ml-1.5">days</small>
          </>
        }
        width={62}
        delay={400}
      />
      <DeckCard
        label="In Session"
        big={
          <>
            07<small className="text-sm text-ink-dim font-body ml-1.5">aspirants</small>
          </>
        }
        width={91}
        delay={600}
      />
      <DeckCard
        label="Topic Lock"
        big={
          <span className="text-base md:text-lg leading-tight text-ink block">
            Cost &amp; Managerial Accounting
          </span>
        }
        width={45}
        delay={800}
      />
      <div className="col-span-2 bg-white/[0.02] border border-line-soft p-4 md:p-[18px]">
        <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-dim mb-2.5">
          Last 24h Activity · Combined Focus Minutes
        </div>
        <div className="flex items-end gap-1 md:gap-1.5 h-16 md:h-20 mt-3.5">
          {ROOM_TIMELINE.map((h, i) => (
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
