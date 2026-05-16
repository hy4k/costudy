import { useNavigate } from "react-router-dom";
import { Reveal } from "./Reveal";

/**
 * Final CTA. Renders large + cinematic on desktop;
 * compact + thumb-reachable on mobile.
 */
export function CTA() {
  const nav = useNavigate();
  return (
    <section className="px-5 md:px-10 pb-16 md:pb-28">
      <Reveal
        className="relative overflow-hidden border border-line text-center px-6 md:px-10 py-20 md:py-24 lg:py-[100px]
          before:content-[''] before:absolute before:top-0 before:-left-1/2 before:w-[200%] before:h-px before:bg-gradient-to-r before:from-transparent before:via-signal before:to-transparent
          after:content-[''] after:absolute after:bottom-0 after:-right-1/2 after:w-[200%] after:h-px after:bg-gradient-to-r after:from-transparent after:via-signal after:to-transparent"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,214,51,.08), transparent)",
          }}
        />
        <h2 className="relative font-display text-[clamp(48px,11vw,140px)] leading-[0.88] tracking-tight">
          Stop studying
          <br />
          at your <em className="text-signal italic">laptop.</em>
          <br />
          Start studying
          <br />
          at the <em className="text-signal italic">deck.</em>
        </h2>
        <p className="relative mx-auto mt-6 mb-8 md:mt-7 md:mb-10 max-w-xl text-base md:text-[17px] text-ink-dim leading-relaxed">
          CoStudy Beta is open to the first 5,000 aspirants. Free for the first cohort, ad-free forever, signal-first by design.
        </p>
        <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            data-hover
            onClick={() => nav("/signup")}
            className="font-mono text-[11px] md:text-xs uppercase tracking-wide2 font-bold bg-signal text-black px-7 py-4 md:py-[18px] inline-flex items-center justify-center gap-2.5 transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,214,51,0.3)]"
          >
            Claim Your Beta Seat <span>→</span>
          </button>
          <button
            data-hover
            className="font-mono text-[11px] md:text-xs uppercase tracking-wide2 font-bold bg-transparent text-ink border border-line px-7 py-4 md:py-[18px] inline-flex items-center justify-center gap-2.5 transition-all hover:border-signal hover:text-signal"
          >
            Read the Manifesto <span>↗</span>
          </button>
        </div>
      </Reveal>
    </section>
  );
}
