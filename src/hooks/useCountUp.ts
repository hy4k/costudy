import { useEffect, useState } from "react";

interface Options {
  duration?: number;
  delay?: number;
  enabled?: boolean;
}

/**
 * Animates a numeric value from 0 → target over `duration` ms
 * using ease-out cubic. Returns the current value to render.
 */
export function useCountUp(target: number, opts: Options = {}): number {
  const { duration = 1800, delay = 0, enabled = true } = opts;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    const t = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay, enabled]);

  return value;
}
