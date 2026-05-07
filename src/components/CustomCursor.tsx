import { useCustomCursor } from "@/hooks/useCustomCursor";

export function CustomCursor() {
  const { enabled, pos, hovering } = useCustomCursor();
  if (!enabled) return null;
  return (
    <>
      <div
        className={`cc ${hovering ? "hover" : ""}`}
        style={{ left: pos.x, top: pos.y }}
      />
      <div className="cc-dot" style={{ left: pos.x, top: pos.y }} />
    </>
  );
}
