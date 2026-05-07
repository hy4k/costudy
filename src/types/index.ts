export type FeatureKey =
  | "rooms"
  | "deck"
  | "mastermind"
  | "vouch"
  | "mock"
  | "network";

export interface Feature {
  key: FeatureKey;
  index: string;          // "/01"
  tabLabel: string;       // "Study Rooms"
  title: string;          // "Live Study Rooms. Not chatrooms."
  titleAccent: string;    // segment that should render in signal color
  body: string;
  bullets: string[];
}

export interface ManifestoCell {
  num: string;
  title: string;
  body: string;
}

export interface ExamCard {
  code: string;     // "/01 · FINANCE"
  name: string;     // "CMA US"
  blurb: string;
}

export interface Testimonial {
  quote: string;
  initials: string;
  name: string;
  meta: string;     // "CMA US · Bengaluru"
}

export interface Vouch {
  initials: string;
  name: string;
  isMentor: boolean;
  blurb: string;
  count: number;
}

export interface MockOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  correct: boolean;
}

export interface NavLink {
  href: string;
  label: string;
}
