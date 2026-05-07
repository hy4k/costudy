import { useEffect, useState } from "react";
import { api, type AttemptDetail, type EssaySubmissionStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Props { attemptId: string }

/**
 * Results page. Polls the attempt and subscribes to Supabase Realtime
 * on essay_submissions so the user sees grading transition live.
 *
 * Why realtime + polling: realtime catches state changes instantly,
 * polling is the fallback if the websocket drops on flaky connections.
 */
export function MockResults({ attemptId }: Props) {
  const [data, setData] = useState<AttemptDetail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initial + manual refreshes
  useEffect(() => {
    api.getAttempt(attemptId).then(setData).catch(console.error);
  }, [attemptId, refreshKey]);

  // Polling fallback every 5s while any essay still grading
  useEffect(() => {
    if (!data) return;
    const stillGrading = data.essays.some(
      (e) => e.grading_state === "pending" || e.grading_state === "grading"
    );
    if (!stillGrading) return;
    const t = window.setInterval(() => setRefreshKey((k) => k + 1), 5000);
    return () => window.clearInterval(t);
  }, [data]);

  // Realtime — refresh whenever any essay row for this attempt changes
  useEffect(() => {
    const channel = supabase
      .channel(`essay-grading-${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "essay_submissions",
          filter: `attempt_id=eq.${attemptId}`,
        },
        () => setRefreshKey((k) => k + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId]);

  if (!data) return <Loading />;

  const passed =
    data.attempt.total_score != null &&
    data.attempt.total_score >= data.attempt.pass_threshold / 5; // 360/500 → 72%

  return (
    <section className="px-5 md:px-10 py-16 md:py-24 max-w-6xl mx-auto">
      <div className="font-mono text-[10px] tracking-[0.25em] text-signal flex items-center gap-3 mb-5">
        <span className="w-6 h-px bg-signal" />
        DEBRIEF / {data.attempt.mock_exams.title.toUpperCase()}
      </div>
      <h1 className="font-display text-[clamp(48px,11vw,140px)] leading-[0.88] tracking-tight">
        {data.attempt.state === "completed" ? (
          passed ? (
            <>You <em className="text-signal italic">passed.</em></>
          ) : (
            <>Run it <em className="text-signal italic">back.</em></>
          )
        ) : (
          <>Grading in <em className="text-signal italic">flight.</em></>
        )}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 mt-12 border-y border-line-soft">
        <ScoreCell label="Total" value={data.attempt.total_score} />
        <ScoreCell label="MCQ" value={data.attempt.mcq_score} />
        <ScoreCell label="Essay" value={data.attempt.essay_score} />
        <ScoreCell
          label="Threshold"
          value={data.attempt.pass_threshold / 5}
          highlight={false}
        />
      </div>

      <h2 className="font-display text-3xl md:text-4xl mt-16 mb-6 tracking-tight">
        Essay Feedback
      </h2>
      <div className="flex flex-col gap-6">
        {data.essays.map((e, i) => (
          <EssayResultCard key={e.id} sub={e} index={i + 1} />
        ))}
      </div>
    </section>
  );
}

function ScoreCell({
  label,
  value,
  highlight = true,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <div className="py-6 px-5 first:pl-0 border-r border-line-soft last:border-r-0">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim mb-2">
        {label}
      </div>
      <div
        className={`font-display text-4xl md:text-5xl leading-none ${
          highlight ? "text-signal" : "text-ink-dim"
        }`}
      >
        {value == null ? "—" : Number(value).toFixed(0)}
        <small className="text-base text-ink-dim ml-1.5">{value == null ? "" : "/100"}</small>
      </div>
    </div>
  );
}

function EssayResultCard({ sub, index }: { sub: EssaySubmissionStatus; index: number }) {
  const isGrading = sub.grading_state === "pending" || sub.grading_state === "grading";
  const aggregate = sub.pass4_aggregate as
    | {
        key_strengths?: string[];
        key_improvements?: { area: string; detail: string; example_from_essay?: string }[];
        drill_recommendations?: { topic_tag: string; priority: string; reason: string }[];
        encouragement?: string;
        performance_band?: string;
      }
    | null;

  return (
    <article className="border border-line-soft p-6 md:p-8">
      <header className="flex justify-between items-start mb-5">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-signal">
            ESSAY {index}
          </div>
          <h3 className="font-display text-2xl tracking-tight mt-1">
            {sub.performance_band ?? (isGrading ? "Grading…" : "Pending")}
          </h3>
        </div>
        {sub.total_score != null && (
          <div className="text-right">
            <div className="font-display text-4xl text-signal leading-none">
              {Number(sub.total_score).toFixed(0)}
            </div>
            <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-dim mt-1">
              / 100
            </div>
          </div>
        )}
      </header>

      {isGrading && (
        <div className="font-mono text-xs text-ink-dim flex items-center gap-3 py-6">
          <span className="signal-blink" />
          Multi-pass grading in progress — concept extraction → calculation verification → communication review → final aggregation.
        </div>
      )}

      {sub.grading_state === "graded" && aggregate && (
        <>
          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Mini label="Concepts" v={sub.concept_score} />
            <Mini label="Calcs" v={sub.calc_score} />
            <Mini label="Comms" v={sub.comm_score} />
          </div>

          {aggregate.key_strengths && (
            <Block title="Strengths" tone="signal">
              <ul className="list-none flex flex-col gap-2">
                {aggregate.key_strengths.map((s, i) => (
                  <li key={i} className="text-sm text-ink leading-relaxed pl-5 relative">
                    <span className="absolute left-0 text-signal">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {aggregate.key_improvements && (
            <Block title="Where to Sharpen">
              <ul className="list-none flex flex-col gap-3">
                {aggregate.key_improvements.map((imp, i) => (
                  <li key={i} className="border-l-2 border-line-soft pl-4">
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal">
                      {imp.area}
                    </div>
                    <p className="text-sm text-ink leading-relaxed mt-1">{imp.detail}</p>
                    {imp.example_from_essay && (
                      <p className="text-xs text-ink-dim italic mt-1.5">
                        From your essay: "{imp.example_from_essay}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {aggregate.drill_recommendations && aggregate.drill_recommendations.length > 0 && (
            <Block title="Drill Queue">
              <div className="flex flex-wrap gap-2">
                {aggregate.drill_recommendations.map((d, i) => (
                  <span
                    key={i}
                    className={`font-mono text-[10px] tracking-[0.25em] uppercase px-2.5 py-1 border ${
                      d.priority === "HIGH"
                        ? "bg-signal text-black border-signal"
                        : "border-signal text-signal"
                    }`}
                  >
                    {d.topic_tag.replace(/_/g, " ")} · {d.priority}
                  </span>
                ))}
              </div>
            </Block>
          )}

          {aggregate.encouragement && (
            <p className="text-sm text-ink-dim italic mt-6 pt-5 border-t border-line-soft">
              {aggregate.encouragement}
            </p>
          )}
        </>
      )}

      {sub.grading_state === "failed" && (
        <div className="text-sm text-red-400 font-mono">
          Grading failed. Our team has been notified.
        </div>
      )}
    </article>
  );
}

function Block({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "signal" }) {
  return (
    <section className="mt-5">
      <h4 className={`font-mono text-[10px] tracking-[0.25em] uppercase mb-3 ${tone === "signal" ? "text-signal" : "text-ink-dim"}`}>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Mini({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="border border-line-soft p-3">
      <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-dim">{label}</div>
      <div className="font-display text-2xl text-signal leading-none mt-1">
        {v == null ? "—" : Number(v).toFixed(0)}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="px-5 py-32 grid place-items-center text-ink-dim font-mono text-sm tracking-[0.25em]">
      <span className="signal-blink mr-3" /> LOADING DEBRIEF…
    </div>
  );
}
