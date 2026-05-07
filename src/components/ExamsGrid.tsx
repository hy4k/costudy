import { EXAMS } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

export function ExamsGrid() {
  return (
    <section
      id="exams"
      className="relative px-5 md:px-10 py-20 md:py-28 lg:py-32 border-t border-line-soft"
    >
      <Reveal>
        <SectionHead
          tag="03 — Coverage"
          title={
            <>
              Built for the exams that <em>change lives.</em>
            </>
          }
          desc={
            <>
              Powered by Forun Educational &amp; Testing Services — one of India's only authorized centers running Prometric, Pearson VUE, ETS, PSI, IELTS, and ACCA under one roof.
            </>
          }
        />
      </Reveal>

      <Reveal className="grid grid-cols-2 md:grid-cols-4">
        {EXAMS.map((e, i) => {
          // Mobile 2-col: right border on left col, bottom border except last row (i<6)
          const mobileR = (i + 1) % 2 === 1;          // i = 0,2,4,6
          const mobileB = i < 6;
          // Desktop 4-col: right border on cols 1-3, bottom border only on first row
          const desktopR = (i + 1) % 4 !== 0;          // i = 0,1,2,4,5,6
          const desktopB = i < 4;

          return (
            <div
              key={e.name}
              data-hover
              className={[
                "group p-7 md:p-8 relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 border-line-soft",
                mobileR ? "border-r" : "",
                mobileB ? "border-b" : "",
                desktopR ? "md:border-r" : "md:border-r-0",
                mobileB && !desktopB ? "md:border-b-0" : "",
              ].join(" ")}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at 50% 100%, rgba(255,214,51,.15), transparent 70%)",
                }}
              />
              <div className="font-mono text-[10px] tracking-wide2 text-signal mb-3.5 relative">
                {e.code}
              </div>
              <h4 className="font-display text-3xl md:text-4xl leading-none tracking-[0.01em] mb-2 relative">
                {e.name}
              </h4>
              <p className="text-xs text-ink-dim relative leading-relaxed">{e.blurb}</p>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
