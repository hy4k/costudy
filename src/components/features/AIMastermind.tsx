/**
 * Static chat preview that simulates a Mastermind conversation.
 * Messages animate in via CSS staggered delays.
 *
 * To wire to real Gemini / Claude later: replace the static <div>s with
 * a stream from your existing AI service and a controlled `<input>` for
 * the bottom CLI bar.
 */
export function AIMastermind() {
  return (
    <div className="flex flex-col gap-3.5 h-full">
      <div className="flex flex-col gap-3 flex-1">
        <Msg variant="user" delay={300}>
          Why does variable costing show different operating income than absorption costing?
        </Msg>
        <Msg variant="ai" delay={900} meta="MASTERMIND · CMA P1 · COST ACCOUNTING">
          The gap comes from how each method treats <b className="text-ink">fixed manufacturing overhead</b>. Absorption costing pushes that overhead into inventory — so when units sit unsold, the cost sits on the balance sheet. Variable costing expenses it immediately. Result: when production &gt; sales, absorption income is higher.
        </Msg>
        <Msg variant="ai" delay={1400} meta="MASTERMIND · QUEUED DRILL">
          I've queued 4 problems on this for you — 2 reconciliation, 2 income-stmt build. Want to run them now or after your next room?
          <div className="typing-dot mt-2.5">
            <span /> <span /> <span />
          </div>
        </Msg>
      </div>
      <div className="mt-auto p-3 border border-line bg-black/40 flex items-center gap-2.5 font-mono text-xs text-ink-dim">
        <span className="text-signal">{">"}</span>
        Ask the Mastermind
        <span className="cli-caret" />
      </div>
    </div>
  );
}

interface MsgProps {
  variant: "user" | "ai";
  delay: number;
  meta?: string;
  children: React.ReactNode;
}

function Msg({ variant, delay, meta, children }: MsgProps) {
  const base = "p-3 px-4 max-w-[85%] text-sm leading-relaxed border opacity-0";
  const variantClass =
    variant === "user"
      ? "self-end bg-signal/[0.08] border-line text-ink"
      : "self-start bg-white/[0.02] border-line-soft text-ink border-l-2 border-l-signal";
  return (
    <div
      className={`${base} ${variantClass}`}
      style={{ animation: `fade-up 0.5s ease-out ${delay}ms forwards` }}
    >
      {meta && (
        <div className="font-mono text-[9px] uppercase tracking-wide2 text-ink-faint mb-1.5">
          <b className="text-signal font-normal">{meta.split("·")[0].trim()}</b>
          {meta.includes("·") ? ` · ${meta.split("·").slice(1).join("·").trim()}` : ""}
        </div>
      )}
      {children}
    </div>
  );
}
