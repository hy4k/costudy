import { useEffect, useState } from "react";

interface Pos {
  x: number;
  y: number;
}

/**
 * Manages custom-cursor state.
 * - Returns `null` on touch devices (so caller renders nothing).
 * - Otherwise tracks pointer position + hover state on `[data-hover]` elements.
 */
export function useCustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState<Pos>({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
    document.body.classList.add("has-custom-cursor");

    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-hover], a, button")) setHovering(true);
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-hover], a, button")) setHovering(false);
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return { enabled, pos, hovering };
}
