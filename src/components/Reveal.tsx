import type { ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  threshold?: number;
}

/**
 * Wrapper that fades + slides children into view when scrolled
 * past the configured threshold. Honors prefers-reduced-motion.
 */
export function Reveal({ children, className = "", as = "div", threshold }: Props) {
  const ref = useReveal<HTMLDivElement>(threshold);

  if (as === "section") {
    return (
      <section
        // section accepts a div ref because we only call HTMLElement methods on it
        ref={ref as unknown as React.RefObject<HTMLElement>}
        className={`reveal ${className}`}
      >
        {children}
      </section>
    );
  }
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

