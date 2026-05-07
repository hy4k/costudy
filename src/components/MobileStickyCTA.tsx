import { useEffect, useState } from "react";
import { useViewport } from "@/hooks/useViewport";

/**
 * Mobile-only sticky CTA pinned to the bottom of the viewport.
 * Appears after the user scrolls past the hero (~80vh) so it doesn't
 * obscure the cinematic intro, then stays put.
 *
 * Hidden entirely on desktop where the standard CTA section is enough.
 */
export function MobileStickyCTA() {
  const { isMobile } = useViewport();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[90] px-4 pt-3 pb-3 safe-bottom bg-bg/85 backdrop-blur-md border-t border-line-soft transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <button className="w-full font-mono text-xs uppercase tracking-wide2 font-bold bg-signal text-black px-5 py-3.5 flex items-center justify-center gap-2">
        Claim Your Beta Seat <span>→</span>
      </button>
    </div>
  );
}
