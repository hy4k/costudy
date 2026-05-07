import { HERO_STATS } from "@/data/content";
import { useCountUp } from "@/hooks/useCountUp";

function StatValue({ stat, idx }: { stat: (typeof HERO_STATS)[number]; idx: number }) {
  const target = typeof stat.value === "number" ? stat.value : 0;
  const animated = useCountUp(target, {
    enabled: stat.animate,
    delay: 200 + idx * 100,
  });

  if (!stat.animate) {
    // Static values (e.g. "73%", "24/7") — render with appropriate styling
    const str = String(stat.value);
    if (str.includes("%")) {
      return (
        <>
          {str.replace("%", "")}
          <sup className="text-lg md:text-xl text-ink align-super">%</sup>
        </>
      );
    }
    if (str.includes("/")) {
      const [a, b] = str.split("/");
      return (
        <>
          {a}
          <small className="text-sm text-ink-dim font-body ml-1">/{b}</small>
        </>
      );
    }
    return <>{str}</>;
  }

  return <>{animated.toLocaleString()}</>;
}

/**
 * Hero — the cinematic anchor of the page.
 *
 * Mobile-first behavior:
 * - Single column, fluid type (clamp 48px → 220px scales naturally)
 * - Stat grid is 2×2 on mobile, 4-up on desktop
 * - Side ticker only renders ≥ md (no room on phones)
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-5 md:px-10 pt-28 md:pt-32 pb-16 md:pb-24">
      {/* Side ticker — desktop only */}
      <div
        aria-hidden
        className="hidden lg:block absolute right-10 top-1/2 origin-top-right -translate-y-1/2 rotate-90 font-mono text-[10px] tracking-[0.4em] uppercase text-ink-faint whitespace-nowrap"
      >
        SIGNAL <span className="text-signal">●</span> COSTUDY.IN <span className="text-signal">●</span> KERALA · INDIA <span className="text-signal">●</span> EST 2025
      </div>

      <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-wide2 text-signal flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <span className="w-5 md:w-6 h-px bg-signal" />
        <span className="signal-blink" />
        SYSTEM ONLINE / FOR THE 70% WHO REFUSE TO FAIL
      </div>

      <h1 className="font-display text-[clamp(56px,16vw,220px)] leading-[0.85] tracking-tight">
        Studying
        <br />
        <span className="line-through decoration-signal decoration-[4px] md:decoration-[6px]">
          alone
        </span>{" "}
        <span className="signal-strike-underline text-signal italic">together.</span>
      </h1>

      <p className="mt-8 md:mt-10 max-w-xl text-base md:text-lg leading-relaxed text-ink-dim">
        CoStudy is the <b className="text-ink font-semibold">mission control deck</b> for serious aspirants of CMA US, IELTS, TOEFL, and GRE — a collaborative AI-powered platform where rooms run on focus, vouches build trust, and your weakest topic gets engineered into your sharpest.
      </p>

      <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          data-hover
          className="font-mono text-[11px] md:text-xs uppercase tracking-wide2 font-bold bg-signal text-black px-7 py-4 md:py-[18px] inline-flex items-center justify-center gap-2.5 transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,214,51,0.3)]"
        >
          Launch a Study Room <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <button
          data-hover
          className="font-mono text-[11px] md:text-xs uppercase tracking-wide2 font-bold bg-transparent text-ink border border-line px-7 py-4 md:py-[18px] inline-flex items-center justify-center gap-2.5 transition-all hover:border-signal hover:text-signal"
        >
          Watch the Deck Demo <span>↗</span>
        </button>
      </div>

      <div className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 border-y border-line-soft">
        {HERO_STATS.map((s, i) => {
          // Mobile (2-col): right border on left column, bottom border on top row
          const mobileR = i % 2 === 0;
          const mobileB = i < 2;
          // Desktop (4-col): right border on every cell except the last
          const desktopR = i < 3;
          return (
            <div
              key={s.label}
              className={[
                "py-5 md:py-6 pr-5 md:pr-7 border-line-soft",
                mobileR ? "border-r" : "",
                mobileB ? "border-b md:border-b-0" : "",
                desktopR ? "md:border-r" : "",
              ].join(" ")}
            >
              <div className="font-display text-4xl md:text-5xl leading-none text-signal tracking-[0.02em]">
                <StatValue stat={s} idx={i} />
              </div>
              <div className="mt-2 font-mono text-[9px] md:text-[10px] tracking-wide2 uppercase text-ink-dim">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
