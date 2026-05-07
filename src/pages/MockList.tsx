import { useEffect, useState } from "react";
import { api, type MockSummary, ApiError } from "@/lib/api";

/**
 * Mock list page — shown to authenticated users.
 * Slot this into the cinematic frontend as a route or ViewState.
 */
export function MockList({ onStart }: { onStart: (slug: string) => void }) {
  const [mocks, setMocks] = useState<MockSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listMocks()
      .then((r) => setMocks(r.mocks))
      .catch((e: ApiError) => setError(e.code === "not_authenticated" ? "Please sign in to access mock exams." : e.message));
  }, []);

  if (error) return <ErrorPanel message={error} />;
  if (!mocks) return <LoadingPanel />;

  return (
    <section className="px-5 md:px-10 py-20 md:py-28 max-w-7xl mx-auto">
      <header className="mb-10 md:mb-14">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-signal flex items-center gap-3 mb-5">
          <span className="w-6 h-px bg-signal" />
          MOCK ENGINE / EXAM BANK
        </div>
        <h1 className="font-display text-[clamp(40px,9vw,96px)] leading-[0.9] tracking-tight">
          Pick a mock. <em className="text-signal italic">Run it like the real thing.</em>
        </h1>
      </header>

      {mocks.length === 0 && (
        <div className="border border-line-soft p-10 text-center text-ink-dim font-mono text-sm">
          No published mocks yet. Check back soon.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-soft border border-line-soft">
        {mocks.map((m) => (
          <article key={m.id} className="bg-bg p-7 md:p-8 flex flex-col gap-4 min-h-[260px]">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-signal">
                  {m.exam.replace("_", " ").toUpperCase()} · {m.difficulty.toUpperCase()}
                </div>
                <h3 className="font-display text-3xl md:text-4xl leading-[0.95] tracking-tight mt-3">
                  {m.title}
                </h3>
              </div>
              {m.is_paid && (
                <span className="font-mono text-[9px] tracking-[0.25em] bg-signal text-black px-2 py-1">
                  PRO
                </span>
              )}
            </div>
            <p className="text-sm text-ink-dim leading-relaxed flex-1">{m.description}</p>
            <dl className="grid grid-cols-3 gap-3 mt-2 pt-4 border-t border-line-soft">
              <Stat label="MCQ" value={String(m.mcq_count)} />
              <Stat label="Essay" value={String(m.essay_count)} />
              <Stat label="Time" value={`${Math.round(m.total_minutes / 60)}h`} />
            </dl>
            <button
              onClick={() => onStart(m.slug)}
              className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] font-bold bg-signal text-black px-5 py-3.5 hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              Begin Mock <span>→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-signal leading-none">{value}</div>
      <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-dim mt-1.5">
        {label}
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="px-5 md:px-10 py-32 grid place-items-center text-ink-dim font-mono text-sm uppercase tracking-[0.25em]">
      <span className="signal-blink mr-3" /> Loading mock bank…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="px-5 md:px-10 py-32 grid place-items-center">
      <div className="border border-line-soft p-8 max-w-md text-center">
        <div className="font-mono text-[10px] tracking-[0.25em] text-signal mb-3">ERROR</div>
        <p className="text-ink">{message}</p>
      </div>
    </div>
  );
}
