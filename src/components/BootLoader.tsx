import { useEffect, useState } from "react";

export function BootLoader() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGone(true), 1700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-bg transition-[opacity,visibility] duration-700 ${
        gone ? "opacity-0 invisible pointer-events-none" : ""
      }`}
    >
      <div className="font-display text-signal text-[clamp(40px,8vw,90px)] leading-none tracking-[0.04em]">
        CO·STUDY
      </div>
      <div className="mt-6 h-px w-60 bg-signal/15 relative overflow-hidden">
        <div className="boot-bar-fill absolute top-0 left-0 h-full" />
      </div>
      <div className="mt-3 font-mono text-[11px] uppercase tracking-wide2 text-ink-dim">
        Initializing mission deck <span className="text-signal">...</span>
      </div>
    </div>
  );
}
