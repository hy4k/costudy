import { useViewport } from "@/hooks/useViewport";
import { NAV_LINKS } from "@/data/content";
import { MobileNav } from "./MobileNav";

/**
 * Renders the desktop top nav OR delegates to MobileNav on small screens.
 * Single source of truth for nav links lives in `data/content.ts`.
 */
export function Navigation() {
  const { isMobile } = useViewport();
  if (isMobile) return <MobileNav />;

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] px-6 lg:px-10 py-4 lg:py-5 flex items-center justify-between bg-bg/60 backdrop-blur-md border-b border-line-soft">
      <div className="flex items-center gap-3 font-display text-2xl tracking-[0.06em]">
        <div className="w-7 h-7 border-[1.5px] border-signal grid place-items-center brand-mark-pulse" />
        <span>
          Co<span className="text-signal">·</span>Study
        </span>
      </div>
      <div className="hidden md:flex gap-8 font-mono text-[11px] uppercase tracking-signal" style={{ counterReset: "navc" }}>
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            data-hover
            className="text-ink-dim transition-colors hover:text-signal py-1 before:content-[counter(navc,decimal-leading-zero)_'_/'] before:text-ink-faint before:mr-1.5"
            style={{ counterIncrement: "navc" }}
          >
            {l.label}
          </a>
        ))}
      </div>
      <button
        data-hover
        className="font-mono text-[11px] uppercase tracking-wide2 font-bold bg-signal text-black px-4 lg:px-5 py-2.5 hover:bg-white hover:tracking-[0.25em] transition-all"
      >
        Enter Deck →
      </button>
    </nav>
  );
}
