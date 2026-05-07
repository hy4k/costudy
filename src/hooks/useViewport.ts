import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768; // matches Tailwind `md`

interface Viewport {
  isMobile: boolean;
  isTouch: boolean;
  width: number;
}

/**
 * Adaptive viewport hook.
 * - `isMobile` → screen narrower than md breakpoint
 * - `isTouch`  → device has no fine pointer (touchscreen)
 *
 * Used to decide between mobile/desktop component variants
 * (e.g. MobileNav vs Navigation, drawer vs inline tabs).
 */
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(() => {
    if (typeof window === "undefined") {
      return { isMobile: false, isTouch: false, width: 1280 };
    }
    return {
      isMobile: window.innerWidth < MOBILE_BREAKPOINT,
      isTouch: !window.matchMedia("(hover: hover) and (pointer: fine)").matches,
      width: window.innerWidth,
    };
  });

  useEffect(() => {
    const onResize = () => {
      setVp({
        isMobile: window.innerWidth < MOBILE_BREAKPOINT,
        isTouch: !window.matchMedia("(hover: hover) and (pointer: fine)").matches,
        width: window.innerWidth,
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vp;
}
