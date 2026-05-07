import { MANIFESTO } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

export function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative px-5 md:px-10 py-20 md:py-28 lg:py-32 border-y border-line-soft"
    >
      <Reveal>
        <SectionHead
          tag="01 — Why CoStudy Exists"
          title={
            <>
              A study app shouldn't feel like <em>homework.</em>
            </>
          }
          desc={
            <>
              Roughly <b>70% of Indian aspirants fail CMA US on first attempt.</b> Not from lack of effort — from lack of structure, accountability, and signal. CoStudy is engineered to fix that. Three principles run the deck.
            </>
          }
        />
      </Reveal>

      <Reveal className="grid grid-cols-1 md:grid-cols-3">
        {MANIFESTO.map((c, i) => (
          <div
            key={c.num}
            className={`p-8 md:p-10 transition-colors hover:bg-signal/[0.03] ${
              i < MANIFESTO.length - 1 ? "border-b md:border-b-0 md:border-r border-line-soft" : ""
            }`}
          >
            <div className="font-mono text-[11px] tracking-wide2 text-signal mb-4 md:mb-5">
              {c.num}
            </div>
            <h3 className="font-display text-2xl md:text-3xl leading-none mb-3.5">
              {c.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink-dim">{c.body}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
