import type {
  ExamCard,
  Feature,
  ManifestoCell,
  MockOption,
  NavLink,
  Testimonial,
  Vouch,
} from "@/types";

export const NAV_LINKS: NavLink[] = [
  { href: "#manifesto", label: "Manifesto" },
  { href: "#features", label: "Systems" },
  { href: "#exams", label: "Exams" },
  { href: "#voices", label: "Voices" },
];

export const HERO_STATS = [
  { value: 2847, label: "Active Aspirants", animate: true },
  { value: 312, label: "Live Study Rooms", animate: true },
  { value: "73%", label: "Avg. CMA Pass Lift", animate: false },
  { value: "24/7", label: "AI Mastermind", animate: false },
] as const;

export const MANIFESTO: ManifestoCell[] = [
  {
    num: "/01",
    title: "Together by Default",
    body: "Solo study has a ceiling. CoStudy rooms put you next to peers chasing the same exam, the same window, the same energy. Focus is contagious — we just made it easier to catch.",
  },
  {
    num: "/02",
    title: "AI as Co-Pilot",
    body: "Your AI Mastermind doesn't replace teachers. It diagnoses gaps, drills weak topics, and builds a study plan that actually adapts. Less guesswork. More forward motion.",
  },
  {
    num: "/03",
    title: "Signal Over Noise",
    body: "The Vouch System rewards aspirants who genuinely help others. No followers, no clout chasing — just verified credibility from the people studying right next to you.",
  },
];

export const FEATURES: Feature[] = [
  {
    key: "rooms",
    index: "/01",
    tabLabel: "Study Rooms",
    title: "Live Study Rooms. Not chatrooms.",
    titleAccent: "Study Rooms.",
    body: "Drop into a room, set a Pomodoro, and study alongside aspirants who are exactly where you are. Cameras optional, focus mandatory. Background noise stays off. Distraction stays out.",
    bullets: [
      "Synced focus timers across the room",
      "Topic-locked rooms (e.g. CMA Part 1 · Section A)",
      "Silent-by-default with raise-hand for doubts",
      "Streak tracking + daily focus league",
    ],
  },
  {
    key: "deck",
    index: "/02",
    tabLabel: "Command Deck",
    title: "Your personal Command Deck.",
    titleAccent: "Command Deck.",
    body: "Every metric that matters — pass probability, weakest topic, hours-to-target, mock score trajectory — surfaced in one cinematic dashboard. No vanity stats. Only signal.",
    bullets: [
      "Real-time pass probability index",
      "Topic-by-topic mastery heatmap",
      "Time-to-exam runway calculator",
      "Weak-topic auto-recommendation",
    ],
  },
  {
    key: "mastermind",
    index: "/03",
    tabLabel: "AI Mastermind",
    title: "The AI Mastermind that knows your gaps.",
    titleAccent: "Mastermind",
    body: "Trained on the actual CMA, IELTS, TOEFL, and GRE syllabi — not the open internet. Ask anything. Get explanations, drill plans, and worked solutions calibrated to your current mastery level.",
    bullets: [
      "Adaptive drilling based on your weakest topic",
      "Step-by-step worked solutions, not answer dumps",
      "Spaced-repetition schedule built in",
      "Voice-mode for revision walks",
    ],
  },
  {
    key: "vouch",
    index: "/04",
    tabLabel: "Vouch System",
    title: "Trust, vouched. Not followed.",
    titleAccent: "vouched.",
    body: "Vouches are the only social currency on CoStudy. You earn them by genuinely helping aspirants — answering doubts, sharing notes, mentoring rooms. No gaming. No buying. Real signal of who's worth listening to.",
    bullets: [
      "One vouch per aspirant per peer",
      "Decay if inactive — keeps the signal fresh",
      "Verified Mentor badge at 100+ vouches",
      "Top voucher rooms surfaced in discovery",
    ],
  },
  {
    key: "mock",
    index: "/05",
    tabLabel: "Mock Test Engine",
    title: "Mock tests that punch like the real thing.",
    titleAccent: "punch",
    body: "Built on the same CBT engine FETS deploys for live exam centers. Realistic timing, realistic interface, realistic pressure. Every wrong answer feeds your AI Mastermind drill queue.",
    bullets: [
      "Section-timed, exam-replica interface",
      "Auto-explanation on every question",
      "Performance percentile vs. peer cohort",
      "Failed questions → adaptive drill loop",
    ],
  },
  {
    key: "network",
    index: "/06",
    tabLabel: "Alignment Network",
    title: "The CMA Alignment Network.",
    titleAccent: "Alignment",
    body: "A live graph of every aspirant, mentor, and topic on CoStudy. The network finds you the right study partner, the right room, the right mentor — based on where you are and where you need to go.",
    bullets: [
      "Auto-match peers at your mastery tier",
      "Mentor proximity by topic strength",
      "Cohort discovery by exam window",
      "Live signal density visualization",
    ],
  },
];

export const VOUCHES: Vouch[] = [
  {
    initials: "AN",
    name: "Anjana K.",
    isMentor: true,
    blurb: "Walked me through 12 ratio analysis problems. CMA P2.",
    count: 247,
  },
  {
    initials: "RH",
    name: "Rahul H.",
    isMentor: false,
    blurb: "Best IELTS speaking partner I've had. Honest feedback.",
    count: 183,
  },
  {
    initials: "SF",
    name: "Sufiya M.",
    isMentor: true,
    blurb: "Her GRE quant breakdowns are next-level clean.",
    count: 156,
  },
  {
    initials: "DV",
    name: "Devika P.",
    isMentor: false,
    blurb: "Made me actually understand TOEFL writing rubric.",
    count: 94,
  },
];

export const MOCK_QUESTION = {
  section: "SECTION A — EXTERNAL FINANCIAL REPORTING",
  points: "2 PTS",
  text: "A company uses absorption costing. If production exceeds sales in a given period, operating income under absorption costing will be:",
  options: [
    { key: "A", text: "Lower than under variable costing", correct: false },
    { key: "B", text: "Higher than under variable costing", correct: true },
    { key: "C", text: "Equal to variable costing income", correct: false },
    { key: "D", text: "Indeterminate without more data", correct: false },
  ] satisfies MockOption[],
};

export const EXAMS: ExamCard[] = [
  { code: "/01 · FINANCE", name: "CMA US", blurb: "Part 1 & Part 2, mapped to IMA's official LOS. Drill loops calibrated for Indian aspirants." },
  { code: "/02 · ENGLISH", name: "IELTS", blurb: "Academic & General — speaking partners on tap, AI band predictor, BC-style scoring rubric." },
  { code: "/03 · ENGLISH", name: "TOEFL iBT", blurb: "Integrated tasks practice, ETS-style scoring, structured writing & speaking templates." },
  { code: "/04 · GRADUATE", name: "GRE", blurb: "Quant + Verbal mocks at full-test length, percentile cohorts, AWA essay critique." },
  { code: "/05 · ENGLISH", name: "CELPIP", blurb: "Coming soon. Canadian PR pathway prep with Paragon-aligned mock structure." },
  { code: "/06 · FINANCE", name: "ACCA", blurb: "Foundations to Strategic Professional, paper-by-paper room library." },
  { code: "/07 · MEDICAL", name: "MRCS / MRCP", blurb: "Clinical reasoning rooms, case-based drills, peer mock vivas." },
  { code: "/08 · CLOUD", name: "AWS / MS", blurb: "Cert prep with peer labs, hands-on rooms, scenario-based drilling." },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I was averaging 58% on CMA P1 mocks. Six weeks of CoStudy rooms and Mastermind drills, I cleared at 412. My weakest topic became my second strongest.",
    initials: "RJ",
    name: "Rohan J.",
    meta: "CMA US · Bengaluru",
  },
  {
    quote: "The Vouch System changed everything. I stopped scrolling for \"best teacher\" videos and just studied with the people my room actually trusted. 8.0 overall.",
    initials: "FN",
    name: "Fathima N.",
    meta: "IELTS · Calicut",
  },
  {
    quote: "Mock test engine is brutal — in the best way. By the time I sat the actual GRE, I'd already failed at it 11 times in a controlled environment. Test day felt easy.",
    initials: "AP",
    name: "Arjun P.",
    meta: "GRE · Cochin",
  },
];

// Pre-baked timeline heights so they're stable between renders
export const ROOM_TIMELINE = [20, 35, 50, 30, 65, 80, 55, 40, 75, 90, 60, 45, 70, 85, 50, 30, 55, 75, 68, 80, 45, 60, 72, 88];
export const MOCK_TRAJECTORY = [40, 55, 48, 62, 58, 70, 65, 72, 78, 75, 82, 88];
