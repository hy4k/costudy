import { useState } from "react";
import type { FeatureKey } from "@/types";
import { FEATURES } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";
import { StudyRooms } from "./features/StudyRooms";
import { CommandDeck } from "./features/CommandDeck";
import { AIMastermind } from "./features/AIMastermind";
import { VouchSystem } from "./features/VouchSystem";
import { MockTestEngine } from "./features/MockTestEngine";
import { AlignmentNetwork } from "./features/AlignmentNetwork";

const VISUALS: Record<FeatureKey, () => JSX.Element> = {
  rooms: StudyRooms,
  deck: CommandDeck,
  mastermind: AIMastermind,
  vouch: VouchSystem,
  mock: MockTestEngine,
  network: AlignmentNetwork,
};

const TAB_META: Record<FeatureKey, { roomId: string; status: string }> = {
  rooms: { roomId: "ROOM_ID / CMA-P1-SECA-09", status: "● LIVE · 7 in" },
  deck: { roomId: "DECK / PERSONAL", status: "SYNC OK" },
  mastermind: { roomId: "MASTERMIND / SESSION 0814", status: "● ONLINE" },
  vouch: { roomId: "VOUCH FEED / TOP THIS WEEK", status: "VERIFIED" },
  mock: { roomId: "MOCK / CMA P1 · Q14 of 100", status: "02:14:08" },
  network: { roomId: "ALIGNMENT GRAPH / LIVE", status: "2,847 NODES" },
};

/**
 * FeatureShowcase orchestrates:
 *  - Tab strip (horizontally scrollable on mobile, inline on desktop)
 *  - Feature stage that swaps a text panel + visual panel based on active tab
 *
 * Uses controlled `activeKey` state — could be lifted into URL params
 * if you want shareable deep-links to a specific feature.
 */
export function FeatureShowcase() {
  const [activeKey, setActiveKey] = useState<FeatureKey>("rooms");
  const active = FEATURES.find((f) => f.key === activeKey)!;
  const Visual = VISUALS[active.key];
  const meta = TAB_META[active.key];

  // Build the title with the accent segment swapped to <em>
  const renderTitle = () => {
    const parts = active.title.split(active.titleAccent);
    return (
      <>
        {parts[0]}
        <em>{active.titleAccent}</em>
        {parts[1]}
      </>
    );
  };

  return (
    <section
      id="features"
      className="relative px-5 md:px-10 py-20 md:py-28 lg:py-32"
    >
      <Reveal>
        <SectionHead
          tag="02 — Six Systems, One Deck"
          title={
            <>
              Engineered for <em>focus,</em>
              <br className="hidden md:block" /> not engagement.
            </>
          }
          desc={
            <>
              Every module on CoStudy exists for one reason: to move you closer to a pass. Tap through the deck below to see how each system runs.
            </>
          }
        />
      </Reveal>

      {/* Tabs — horizontally scrollable on mobile, inline on md+ */}
      <Reveal>
        <div className="flex border-b border-line-soft mb-8 md:mb-10 overflow-x-auto no-scrollbar -mx-5 md:mx-0 px-5 md:px-0">
          {FEATURES.map((f) => (
            <button
              key={f.key}
              data-hover
              onClick={() => setActiveKey(f.key)}
              className={`shrink-0 px-4 md:px-6 py-3.5 md:py-[18px] bg-transparent font-mono text-[10px] md:text-[11px] uppercase tracking-signal border-b-2 -mb-px transition-colors flex items-center gap-2.5 ${
                activeKey === f.key
                  ? "text-signal border-signal"
                  : "text-ink-dim border-transparent hover:text-ink"
              }`}
            >
              <span className={`text-[9px] md:text-[10px] ${activeKey === f.key ? "text-signal" : "text-ink-faint"}`}>
                {f.index}
              </span>
              {f.tabLabel}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Stage — stacks on mobile, splits on desktop */}
      <div
        key={active.key /* re-mount on tab change so animations replay */}
        className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 md:gap-12 lg:gap-16 min-h-[420px] md:min-h-[520px]"
      >
        <div>
          <h3 className="font-display text-[clamp(36px,7vw,72px)] leading-[0.92] tracking-tight mb-5 md:mb-6 [&_em]:text-signal [&_em]:italic">
            {renderTitle()}
          </h3>
          <p className="text-base leading-relaxed text-ink-dim mb-6">{active.body}</p>
          <ul className="flex flex-col gap-3.5 list-none">
            {active.bullets.map((b) => (
              <li key={b} className="font-mono text-xs tracking-[0.08em] pl-6 relative text-ink">
                <span className="absolute left-0 -top-px text-signal font-bold">+</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border border-line p-5 md:p-6 bg-gradient-to-b from-signal/[0.02] to-transparent overflow-hidden min-h-[420px] md:min-h-[520px] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-signal before:to-transparent">
          <span className="hud-corner tl" />
          <span className="hud-corner tr" />
          <span className="hud-corner bl" />
          <span className="hud-corner br" />
          <div className="font-mono text-[10px] uppercase tracking-signal text-ink-faint mb-5 flex justify-between gap-3">
            <span className="truncate">{meta.roomId}</span>
            <span className={active.key === "mock" ? "text-signal shrink-0" : "shrink-0"}>
              <b className={active.key === "mock" ? "" : "text-signal font-normal"}>{meta.status}</b>
            </span>
          </div>
          <Visual />
        </div>
      </div>
    </section>
  );
}
