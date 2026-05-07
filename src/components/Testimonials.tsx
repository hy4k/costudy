import { TESTIMONIALS } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

export function Testimonials() {
  return (
    <section
      id="voices"
      className="relative px-5 md:px-10 py-20 md:py-28 lg:py-32"
    >
      <Reveal>
        <SectionHead
          tag="04 — Aspirants Speak"
          title={
            <>
              Voices from the <em>deck.</em>
            </>
          }
          desc={
            <>
              Real aspirants. Real rooms. Real numbers. CoStudy is in active beta with cohorts across Calicut, Cochin, Bengaluru, and Delhi — and the signal is loud.
            </>
          }
        />
      </Reveal>

      <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line-soft border border-line-soft">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-bg p-8 md:p-9 flex flex-col gap-5">
            <div className="text-base md:text-base leading-relaxed text-ink font-medium">
              <span className="text-signal text-2xl font-bold mr-1">❝</span>
              {t.quote}
            </div>
            <div className="flex items-center gap-3 mt-auto pt-5 border-t border-line-soft">
              <div className="w-9 h-9 grid place-items-center font-display text-base tracking-[0.05em] text-black bg-gradient-to-br from-signal to-signal-alt">
                {t.initials}
              </div>
              <div className="text-sm font-semibold">
                {t.name}
                <small className="block text-[10px] font-normal font-mono tracking-signal uppercase text-ink-dim mt-0.5">
                  {t.meta}
                </small>
              </div>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
