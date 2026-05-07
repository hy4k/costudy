const FOOT_COLS = [
  { title: "Systems", links: ["Study Rooms", "Command Deck", "AI Mastermind", "Mock Engine"] },
  { title: "Exams", links: ["CMA US", "IELTS", "TOEFL", "GRE"] },
  { title: "Connect", links: ["Twitter / X", "Instagram", "LinkedIn", "fets.in"] },
];

export function Footer() {
  return (
    <footer className="px-5 md:px-10 pt-14 pb-8 md:pt-16 md:pb-10 border-t border-line-soft grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-8 md:gap-10 gap-y-10 safe-bottom">
      <div className="col-span-2 md:col-span-1">
        <div className="font-display text-4xl md:text-5xl text-ink tracking-[0.02em] leading-[0.9]">
          CO<span className="text-signal">·</span>STUDY
        </div>
        <div className="font-mono text-[10px] md:text-[11px] tracking-signal uppercase text-ink-dim mt-3">
          Mission Control for Aspirants · A FETS Project
        </div>
      </div>

      {FOOT_COLS.map((col) => (
        <div key={col.title}>
          <h5 className="font-mono text-[10px] tracking-wide2 uppercase text-signal mb-4 md:mb-[18px]">
            {col.title}
          </h5>
          {col.links.map((l) => (
            <a
              key={l}
              data-hover
              className="block text-ink-dim text-[13px] py-1.5 transition-colors hover:text-signal cursor-pointer"
            >
              {l}
            </a>
          ))}
        </div>
      ))}

      <div className="col-span-2 md:col-span-4 border-t border-line-soft pt-5 md:pt-6 mt-6 md:mt-10 flex flex-col md:flex-row gap-2 justify-between font-mono text-[9px] md:text-[10px] tracking-signal uppercase text-ink-faint">
        <span>© 2026 COSTUDY · A FORUN EDUCATIONAL &amp; TESTING SERVICES PROJECT</span>
        <span>
          BUILT IN <b className="text-signal font-normal">CALICUT, KERALA</b> · SIGNAL ONLINE
        </span>
      </div>
    </footer>
  );
}
