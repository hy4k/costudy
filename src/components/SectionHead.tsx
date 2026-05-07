import type { ReactNode } from "react";

interface Props {
  tag: string;       // e.g. "01 — Why CoStudy Exists"
  title: ReactNode;  // can include <em> for accent
  desc: ReactNode;
}

/**
 * Two-column section header on desktop, stacked on mobile.
 * The orange/yellow accent in the title is supplied by the caller
 * via <em> tags styled in `[&_em]:text-signal [&_em]:not-italic` etc.
 */
export function SectionHead({ tag, title, desc }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 md:gap-12 lg:gap-16 mb-14 md:mb-20 items-end">
      <div>
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-wide2 text-signal flex items-center gap-3 mb-4 md:mb-5">
          <span className="w-6 md:w-8 h-px bg-signal" />
          {tag}
        </div>
        <h2 className="font-display text-[clamp(40px,9vw,96px)] leading-[0.9] tracking-tight [&_em]:text-signal [&_em]:italic">
          {title}
        </h2>
      </div>
      <p className="text-base md:text-[17px] leading-relaxed text-ink-dim max-w-xl [&_b]:text-ink">
        {desc}
      </p>
    </div>
  );
}
