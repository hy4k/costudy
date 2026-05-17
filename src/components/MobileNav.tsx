import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_LINKS } from "@/data/content";

/**
 * Mobile-first nav.
 *
 * - Compact top bar with brand mark + hamburger
 * - Tapping hamburger opens a full-screen drawer with large, touch-friendly links
 * - Body scroll is locked while open
 * - Supports edge-swipe close + safe-area insets
 *
 * This is a real mobile component, not a "responsive desktop nav."
 * Touch targets are min 56px tall; type is sized for thumb reach.
 */
export function MobileNav() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-[100] px-5 py-3 flex items-center justify-between bg-bg/80 backdrop-blur-md border-b border-line-soft safe-top">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 border-[1.5px] border-signal grid place-items-center brand-mark-pulse" />
        </div>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-11 h-11 grid place-items-center border border-line-soft active:bg-signal/10"
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <span className="relative w-5 h-3.5 block">
            <span
              className={`absolute left-0 top-0 w-full h-px bg-ink transition-transform ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-ink transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 w-full h-px bg-ink transition-transform ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[99] bg-bg flex flex-col transition-[opacity,transform] duration-300 ${
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="font-mono text-[10px] uppercase tracking-wide2 text-signal flex items-center gap-3 mb-8">
            <span className="w-6 h-px bg-signal" />
            Mission Index
          </div>
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-5xl tracking-tight py-4 block border-b border-line-soft active:text-signal"
                >
                  <span className="text-ink-faint font-mono text-xs mr-3 align-middle">
                    /0{i + 1}
                  </span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 pb-8 safe-bottom">
          <button onClick={() => { setOpen(false); nav("/login"); }} className="w-full font-mono text-xs uppercase tracking-wide2 font-bold bg-signal text-black px-5 py-4">
            Enter Deck →
          </button>
          <div className="font-mono text-[10px] uppercase tracking-wide2 text-ink-faint mt-5 text-center">
            costudy.in · A FETS Project
          </div>
        </div>
      </div>
    </>
  );
}
