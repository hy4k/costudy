import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* ── Design tokens (shared with StudyWall) ──────── */
const S = {
  bg: "#070707",
  bgAlt: "#0d0d0d",
  bgCard: "#0f0f12",
  bgElevated: "#141419",
  signal: "#FFD633",
  signalAlt: "#ffb800",
  signalDim: "rgba(255,214,51,0.08)",
  ink: "#f5f5f0",
  inkDim: "#9a9a92",
  inkFaint: "#4a4a44",
  green: "#4ade80",
  red: "#ef4444",
  blue: "#60a5fa",
  purple: "#a78bfa",
  teal: "#2dd4bf",
  orange: "#fb923c",
  pink: "#f472b6",
  border: "rgba(255,255,255,0.06)",
  borderSignal: "rgba(255,214,51,0.2)",
};

/* ── Nav items (synced with StudyWall) ───────────── */
const NAV_ITEMS = [
  { id: "wall", label: "Study Wall", icon: "W", route: "/app", active: true },
  { id: "mocks", label: "Mock Engine", icon: "M", route: "/mocks", active: true },
  { id: "rooms", label: "Study Rooms", icon: "R", route: "/rooms", active: true },
  { id: "ai", label: "AI Mastermind", icon: "AI", route: null, active: false },
  { id: "mentors", label: "Mentors", icon: "Mt", route: null, active: false },
];

/* ── CMA US Topics ─────────────────────────────────── */
const CMA_TOPICS = [
  { id: "general", label: "General", emoji: "\u{1F4AC}", color: S.inkDim },
  { id: "p1-efr", label: "External Financial Reporting", emoji: "\u{1F4CA}", color: S.blue },
  { id: "p1-planning", label: "Planning & Budgeting", emoji: "\u{1F4CB}", color: S.green },
  { id: "p1-performance", label: "Performance Mgmt", emoji: "\u{1F4C8}", color: S.teal },
  { id: "p1-cost", label: "Cost Management", emoji: "\u{1F4B0}", color: S.orange },
  { id: "p1-ic", label: "Internal Controls", emoji: "\u{1F512}", color: S.purple },
  { id: "p1-tech", label: "Technology & Analytics", emoji: "\u{1F4BB}", color: S.pink },
  { id: "p2-financial", label: "Financial Analysis", emoji: "\u{1F50D}", color: S.blue },
  { id: "p2-corporate", label: "Corporate Finance", emoji: "\u{1F3E2}", color: S.green },
  { id: "p2-decision", label: "Decision Analysis", emoji: "\u{1F3AF}", color: S.signal },
  { id: "p2-risk", label: "Risk Management", emoji: "⚡", color: S.red },
  { id: "p2-investment", label: "Investment Decisions", emoji: "\u{1F4C9}", color: S.teal },
  { id: "p2-ethics", label: "Professional Ethics", emoji: "⚖️", color: S.purple },
];

/* ── Exam Windows ────────────────────────────────── */
const EXAM_WINDOWS = [
  { id: "may-jun-2026", label: "May — Jun 2026", deadline: "2026-06-30", status: "active" as const },
  { id: "sep-oct-2026", label: "Sep — Oct 2026", deadline: "2026-10-31", status: "open" as const },
  { id: "jan-feb-2027", label: "Jan — Feb 2027", deadline: "2027-02-28", status: "upcoming" as const },
];

/* ── Types ───────────────────────────────────────── */
interface RoomMember {
  name: string;
  initials: string;
  isMentor: boolean;
  vouches: number;
  progress: number; // 0–100 syllabus coverage
  streak: number;
  isOnline: boolean;
}

interface ContentItem {
  id: string;
  type: "note" | "pdf" | "link" | "flashcard-deck" | "formula-sheet" | "mind-map";
  title: string;
  author: string;
  aiEnhanced: boolean;
  votes: number;
  createdAt: string;
}

interface StudyPlanDay {
  date: string;
  topic: string;
  topicId: string;
  completed: boolean;
  hours: number;
  mcqs: number;
}

interface StudyRoom {
  id: string;
  name: string;
  description: string;
  topic: string;
  examWindow: string;
  endDate: string;
  createdBy: string;
  members: RoomMember[];
  maxMembers: number;
  contentCount: number;
  contents: ContentItem[];
  studyPlan: StudyPlanDay[];
  isLive: boolean;
  focusMinutesToday: number;
  totalFocusHours: number;
  tags: string[];
  createdAt: string;
}

/* ── Seed Data ───────────────────────────────────── */
function generateStudyPlan(startDate: string, weeks: number, topicIds: string[]): StudyPlanDay[] {
  const days: StudyPlanDay[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const topicIdx = i % topicIds.length;
    const topic = CMA_TOPICS.find(t => t.id === topicIds[topicIdx]);
    const isPast = d < new Date();
    days.push({
      date: d.toISOString().split("T")[0],
      topic: topic?.label || "General",
      topicId: topicIds[topicIdx],
      completed: isPast ? Math.random() > 0.2 : false,
      hours: isPast ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 3) + 2,
      mcqs: isPast ? Math.floor(Math.random() * 50) + 10 : 0,
    });
  }
  return days;
}

const SEED_ROOMS: StudyRoom[] = [
  {
    id: "r1",
    name: "CMA Part 1 — June Crushers",
    description: "Intensive Part 1 prep targeting June window. Daily 3-hour focused sessions, shared Gleim notes, weekly mock reviews. Dumping all our best notes here — AI turns them into flashcards and formula sheets.",
    topic: "p1-cost",
    examWindow: "may-jun-2026",
    endDate: "2026-06-28",
    createdBy: "Anjana K.",
    members: [
      { name: "Anjana K.", initials: "AK", isMentor: true, vouches: 247, progress: 82, streak: 34, isOnline: true },
      { name: "Rahul H.", initials: "RH", isMentor: false, vouches: 183, progress: 68, streak: 21, isOnline: true },
      { name: "Devika P.", initials: "DP", isMentor: false, vouches: 94, progress: 55, streak: 15, isOnline: false },
      { name: "Arjun P.", initials: "AP", isMentor: false, vouches: 67, progress: 73, streak: 28, isOnline: true },
      { name: "Fathima N.", initials: "FN", isMentor: false, vouches: 45, progress: 61, streak: 12, isOnline: false },
      { name: "Midhun R.", initials: "MR", isMentor: false, vouches: 32, progress: 44, streak: 7, isOnline: true },
    ],
    maxMembers: 12,
    contentCount: 47,
    contents: [
      { id: "c1", type: "formula-sheet", title: "Cost Allocation Methods — Complete Formula Sheet", author: "Anjana K.", aiEnhanced: true, votes: 23, createdAt: "2026-05-15" },
      { id: "c2", type: "flashcard-deck", title: "100 MCQ Flashcards — Budgeting & Variance", author: "Rahul H.", aiEnhanced: true, votes: 19, createdAt: "2026-05-14" },
      { id: "c3", type: "note", title: "ABC vs Traditional Costing — When to Use Which", author: "Devika P.", aiEnhanced: false, votes: 15, createdAt: "2026-05-13" },
      { id: "c4", type: "mind-map", title: "Part 1 Section A Mind Map — All Topics", author: "AI Assistant", aiEnhanced: true, votes: 31, createdAt: "2026-05-12" },
      { id: "c5", type: "link", title: "IMA Practice Questions — Free PDF", author: "Arjun P.", aiEnhanced: false, votes: 12, createdAt: "2026-05-11" },
    ],
    studyPlan: generateStudyPlan("2026-04-01", 12, ["p1-efr", "p1-planning", "p1-performance", "p1-cost", "p1-ic", "p1-tech"]),
    isLive: true,
    focusMinutesToday: 187,
    totalFocusHours: 1240,
    tags: ["Part 1", "June Window", "Daily Sessions", "AI Notes"],
    createdAt: "2026-04-01",
  },
  {
    id: "r2",
    name: "Part 2 Deep Dive — Financial Analysis",
    description: "All Part 2 Section A, all day. CVP analysis, ratio analysis, financial statement analysis. Dumping Becker and Wiley notes for AI to merge into the ultimate study guide.",
    topic: "p2-financial",
    examWindow: "sep-oct-2026",
    endDate: "2026-10-25",
    createdBy: "Sufiya M.",
    members: [
      { name: "Sufiya M.", initials: "SM", isMentor: true, vouches: 156, progress: 45, streak: 18, isOnline: true },
      { name: "Priya L.", initials: "PL", isMentor: false, vouches: 89, progress: 38, streak: 11, isOnline: false },
      { name: "Karthik S.", initials: "KS", isMentor: false, vouches: 54, progress: 29, streak: 9, isOnline: true },
      { name: "Nisha R.", initials: "NR", isMentor: false, vouches: 41, progress: 52, streak: 22, isOnline: true },
    ],
    maxMembers: 8,
    contentCount: 31,
    contents: [
      { id: "c6", type: "formula-sheet", title: "Ratio Analysis Complete Cheat Sheet", author: "Sufiya M.", aiEnhanced: true, votes: 28, createdAt: "2026-05-10" },
      { id: "c7", type: "flashcard-deck", title: "CVP Analysis — 50 MCQ Drill Cards", author: "AI Assistant", aiEnhanced: true, votes: 22, createdAt: "2026-05-09" },
      { id: "c8", type: "note", title: "Financial Statement Analysis Shortcuts", author: "Priya L.", aiEnhanced: false, votes: 17, createdAt: "2026-05-08" },
    ],
    studyPlan: generateStudyPlan("2026-05-01", 22, ["p2-financial", "p2-corporate", "p2-decision", "p2-risk", "p2-investment", "p2-ethics"]),
    isLive: true,
    focusMinutesToday: 124,
    totalFocusHours: 680,
    tags: ["Part 2", "Oct Window", "Financial Analysis"],
    createdAt: "2026-05-01",
  },
  {
    id: "r3",
    name: "Ethics & Essay Prep Squad",
    description: "Focused on the essay portion and ethics questions. We practice writing CMA essays together, peer-review each other's work, and use AI to get instant scoring feedback.",
    topic: "p2-ethics",
    examWindow: "may-jun-2026",
    endDate: "2026-06-25",
    createdBy: "Rahul H.",
    members: [
      { name: "Rahul H.", initials: "RH", isMentor: false, vouches: 183, progress: 71, streak: 19, isOnline: false },
      { name: "Anjana K.", initials: "AK", isMentor: true, vouches: 247, progress: 88, streak: 34, isOnline: true },
      { name: "Vishnu T.", initials: "VT", isMentor: false, vouches: 23, progress: 35, streak: 5, isOnline: false },
    ],
    maxMembers: 6,
    contentCount: 22,
    contents: [
      { id: "c9", type: "note", title: "IMA Ethics Standards — Complete Summary", author: "Anjana K.", aiEnhanced: true, votes: 19, createdAt: "2026-05-16" },
      { id: "c10", type: "flashcard-deck", title: "Essay Writing Templates for CMA", author: "AI Assistant", aiEnhanced: true, votes: 24, createdAt: "2026-05-15" },
    ],
    studyPlan: generateStudyPlan("2026-04-15", 10, ["p2-ethics", "p2-decision", "p2-risk"]),
    isLive: false,
    focusMinutesToday: 0,
    totalFocusHours: 340,
    tags: ["Essays", "Ethics", "Peer Review"],
    createdAt: "2026-04-15",
  },
  {
    id: "r4",
    name: "Weekend Warriors — Full Syllabus",
    description: "For working professionals. Saturday and Sunday intensive sessions. Cover both parts over 6 months. AI generates weekly topic summaries from everyone's notes.",
    topic: "general",
    examWindow: "jan-feb-2027",
    endDate: "2027-02-15",
    createdBy: "Karthik S.",
    members: [
      { name: "Karthik S.", initials: "KS", isMentor: false, vouches: 54, progress: 18, streak: 4, isOnline: false },
      { name: "Meera G.", initials: "MG", isMentor: false, vouches: 12, progress: 22, streak: 6, isOnline: false },
      { name: "Arun V.", initials: "AV", isMentor: false, vouches: 8, progress: 15, streak: 3, isOnline: false },
      { name: "Deepa J.", initials: "DJ", isMentor: false, vouches: 19, progress: 20, streak: 8, isOnline: false },
      { name: "Rohan J.", initials: "RJ", isMentor: false, vouches: 31, progress: 25, streak: 10, isOnline: false },
    ],
    maxMembers: 10,
    contentCount: 15,
    contents: [
      { id: "c11", type: "mind-map", title: "CMA Part 1 + Part 2 Master Roadmap", author: "AI Assistant", aiEnhanced: true, votes: 14, createdAt: "2026-05-12" },
    ],
    studyPlan: generateStudyPlan("2026-07-01", 32, ["p1-efr", "p1-planning", "p1-cost", "p2-financial", "p2-corporate", "p2-ethics"]),
    isLive: false,
    focusMinutesToday: 0,
    totalFocusHours: 89,
    tags: ["Weekend Only", "Working Pros", "Both Parts"],
    createdAt: "2026-05-10",
  },
];

/* ── Helpers ──────────────────────────────────────── */
function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function formatHours(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getTopicInfo(id: string) {
  return CMA_TOPICS.find(t => t.id === id) || CMA_TOPICS[0];
}

function getWindowInfo(id: string) {
  return EXAM_WINDOWS.find(w => w.id === id) || EXAM_WINDOWS[0];
}

const CONTENT_ICONS: Record<string, string> = {
  "note": "\u{1F4DD}",
  "pdf": "\u{1F4C4}",
  "link": "\u{1F517}",
  "flashcard-deck": "\u{1F0CF}",
  "formula-sheet": "\u{1F9EE}",
  "mind-map": "\u{1F9E0}",
};

/* ── CountdownRing ───────────────────────────────── */
function CountdownRing({ days, total, size = 64 }: { days: number; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, (total - days) / total);
  const offset = circ * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={days < 30 ? S.red : days < 60 ? S.orange : S.signal}
          strokeWidth="3" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg leading-none" style={{ color: days < 30 ? S.red : days < 60 ? S.orange : S.signal }}>{days}</span>
        <span className="font-mono text-[7px] uppercase tracking-wider" style={{ color: S.inkFaint }}>days</span>
      </div>
    </div>
  );
}

/* ── MemberAvatarStack ───────────────────────────── */
function MemberStack({ members, max = 5 }: { members: RoomMember[]; max?: number }) {
  const shown = members.slice(0, max);
  const overflow = members.length - max;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div key={i} className="relative -ml-2 first:ml-0" style={{ zIndex: max - i }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[9px] font-bold border-2"
            style={{
              background: m.isMentor ? "rgba(255,214,51,0.15)" : S.bgElevated,
              color: m.isMentor ? S.signal : S.inkDim,
              borderColor: S.bg,
            }}>
            {m.initials}
          </div>
          {m.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: S.green, borderColor: S.bg }} />
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="-ml-2 w-8 h-8 rounded-full flex items-center justify-center font-mono text-[9px] font-bold border-2"
          style={{ background: S.bgAlt, color: S.inkFaint, borderColor: S.bg }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

/* ── ProgressBar ────────────────────────────────── */
function ProgressBar({ value, color = S.signal, height = 3 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,0.04)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

/* ── ContentTypeIcon ────────────────────────────── */
function ContentBadge({ type, aiEnhanced }: { type: string; aiEnhanced: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{CONTENT_ICONS[type] || "\u{1F4C4}"}</span>
      {aiEnhanced && (
        <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: "rgba(160,128,255,0.12)", color: S.purple, border: `1px solid rgba(160,128,255,0.2)` }}>
          AI
        </span>
      )}
    </div>
  );
}

/* ── Calendar View ──────────────────────────────── */
function CalendarStudyPlan({ plan, compact = false }: { plan: StudyPlanDay[]; compact?: boolean }) {
  const today = new Date().toISOString().split("T")[0];
  const weeks: StudyPlanDay[][] = [];
  for (let i = 0; i < plan.length; i += 7) {
    weeks.push(plan.slice(i, i + 7));
  }

  // Only show 4 weeks around today in compact mode
  const todayIdx = plan.findIndex(d => d.date >= today);
  const startWeek = compact ? Math.max(0, Math.floor((todayIdx - 7) / 7)) : 0;
  const endWeek = compact ? Math.min(weeks.length, startWeek + 4) : weeks.length;
  const visibleWeeks = weeks.slice(startWeek, endWeek);

  const completedDays = plan.filter(d => d.completed).length;
  const totalDays = plan.length;
  const pct = Math.round((completedDays / totalDays) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: S.inkFaint }}>
            {"\u{1F4C5}"} Study Calendar
          </span>
          <span className="font-mono text-[10px] font-bold" style={{ color: S.signal }}>{pct}%</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: S.green }} />
            <span className="font-mono text-[8px] uppercase" style={{ color: S.inkFaint }}>Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: S.signal }} />
            <span className="font-mono text-[8px] uppercase" style={{ color: S.inkFaint }}>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="font-mono text-[8px] uppercase" style={{ color: S.inkFaint }}>Planned</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-5 pr-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="h-[18px] flex items-center font-mono text-[8px]" style={{ color: S.inkFaint }}>{d}</div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-1">
            {visibleWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                <div className="font-mono text-[7px] text-center h-4 flex items-center justify-center" style={{ color: S.inkFaint }}>
                  {new Date(week[0]?.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </div>
                {week.map((day, di) => {
                  const isToday = day.date === today;
                  const isPast = day.date < today;
                  const topic = getTopicInfo(day.topicId);
                  return (
                    <div key={di} className="w-[18px] h-[18px] rounded-sm flex items-center justify-center cursor-pointer group relative"
                      title={`${day.date}: ${day.topic} ${day.completed ? "✓" : ""} ${day.hours}h planned`}
                      style={{
                        background: isToday ? S.signal
                          : day.completed ? S.green
                          : isPast ? S.red + "40"
                          : "rgba(255,255,255,0.04)",
                        border: isToday ? `2px solid ${S.signal}` : "none",
                        boxShadow: isToday ? `0 0 8px rgba(255,214,51,0.4)` : "none",
                      }}>
                      {day.completed && <span className="text-[8px]">{"✓"}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar value={pct} color={S.green} />
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[9px]" style={{ color: S.inkFaint }}>{completedDays} of {totalDays} days completed</span>
          <span className="font-mono text-[9px]" style={{ color: S.inkDim }}>{totalDays - completedDays} days remaining</span>
        </div>
      </div>
    </div>
  );
}

/* ── Room Card ──────────────────────────────────── */
function RoomCard({ room, onOpen }: { room: StudyRoom; onOpen: (id: string) => void }) {
  const topic = getTopicInfo(room.topic);
  const window = getWindowInfo(room.examWindow);
  const days = daysUntil(room.endDate);
  const totalDays = Math.ceil((new Date(room.endDate).getTime() - new Date(room.createdAt).getTime()) / 86400000);
  const onlineCount = room.members.filter(m => m.isOnline).length;
  const avgProgress = Math.round(room.members.reduce((a, m) => a + m.progress, 0) / room.members.length);

  return (
    <div className="rounded-xl border overflow-hidden transition-all hover:border-signal/20 group cursor-pointer"
      style={{ background: S.bgCard, borderColor: S.border }}
      onClick={() => onOpen(room.id)}>

      {/* Header gradient band */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${topic.color}, ${S.signal})` }} />

      <div className="p-5">
        {/* Top row: title + countdown */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs">{topic.emoji}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: topic.color }}>{topic.label}</span>
              {room.isLive && (
                <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider font-bold"
                  style={{ color: S.green }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: S.green }} />
                  Live
                </span>
              )}
            </div>
            <h3 className="font-display text-xl md:text-2xl tracking-tight leading-tight" style={{ color: S.ink }}>
              {room.name}
            </h3>
            <p className="text-xs leading-relaxed mt-2 line-clamp-2" style={{ color: S.inkDim }}>
              {room.description}
            </p>
          </div>
          <CountdownRing days={days} total={totalDays} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.tags.map(tag => (
            <span key={tag} className="font-mono text-[8px] uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)", color: S.inkFaint, border: `1px solid ${S.border}` }}>
              {tag}
            </span>
          ))}
          <span className="font-mono text-[8px] uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: "rgba(255,214,51,0.06)", color: S.signalAlt, border: `1px solid ${S.borderSignal}` }}>
            {window.label}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mb-4 py-3 border-y" style={{ borderColor: S.border }}>
          <div>
            <div className="font-display text-lg leading-none" style={{ color: S.signal }}>{room.members.length}<span className="text-xs font-mono" style={{ color: S.inkFaint }}>/{room.maxMembers}</span></div>
            <div className="font-mono text-[8px] uppercase tracking-wider mt-0.5" style={{ color: S.inkFaint }}>Members</div>
          </div>
          <div>
            <div className="font-display text-lg leading-none" style={{ color: onlineCount > 0 ? S.green : S.inkFaint }}>{onlineCount}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider mt-0.5" style={{ color: S.inkFaint }}>Online</div>
          </div>
          <div>
            <div className="font-display text-lg leading-none" style={{ color: S.purple }}>{room.contentCount}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider mt-0.5" style={{ color: S.inkFaint }}>Resources</div>
          </div>
          <div>
            <div className="font-display text-lg leading-none" style={{ color: S.teal }}>{avgProgress}%</div>
            <div className="font-mono text-[8px] uppercase tracking-wider mt-0.5" style={{ color: S.inkFaint }}>Avg Progress</div>
          </div>
        </div>

        {/* Members + focus time */}
        <div className="flex items-center justify-between">
          <MemberStack members={room.members} />
          <div className="flex items-center gap-3">
            {room.focusMinutesToday > 0 && (
              <span className="font-mono text-[9px] flex items-center gap-1" style={{ color: S.green }}>
                {"⏱"} {formatHours(room.focusMinutesToday)} today
              </span>
            )}
            <span className="font-mono text-[9px]" style={{ color: S.inkFaint }}>
              {room.totalFocusHours}h total
            </span>
          </div>
        </div>

        {/* Mini calendar preview */}
        {room.studyPlan.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
            <CalendarStudyPlan plan={room.studyPlan} compact />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Room Interior View ─────────────────────────── */
function RoomInterior({ room, onBack }: { room: StudyRoom; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"vault" | "plan" | "members" | "chat">("vault");
  const [dumpText, setDumpText] = useState("");
  const [localContents, setLocalContents] = useState(room.contents);
  const [chatMessages, setChatMessages] = useState<Array<{ author: string; text: string; time: string }>>([
    { author: "Anjana K.", text: "Starting today's session — focusing on cost allocation. Who's in?", time: "10:32 AM" },
    { author: "Arjun P.", text: "Present! Just finished reviewing chapter 6 notes", time: "10:35 AM" },
    { author: "Rahul H.", text: "I dumped my Wiley notes on joint & by-product costing. Can the AI turn them into flashcards?", time: "10:38 AM" },
    { author: "AI Assistant", text: "✨ Done! Created 24 flashcards from Rahul's notes. Topics: joint cost allocation methods (physical units, sales value, NRV), by-product accounting. Available in the Content Vault.", time: "10:39 AM" },
  ]);
  const [newMsg, setNewMsg] = useState("");
  const topic = getTopicInfo(room.topic);
  const days = daysUntil(room.endDate);

  const handleDump = useCallback(() => {
    if (!dumpText.trim()) return;
    const newItem: ContentItem = {
      id: `c-${Date.now()}`,
      type: "note",
      title: dumpText.trim().slice(0, 60) + (dumpText.length > 60 ? "..." : ""),
      author: "You",
      aiEnhanced: false,
      votes: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setLocalContents(prev => [newItem, ...prev]);
    setDumpText("");
  }, [dumpText]);

  const tabs = [
    { id: "vault" as const, label: "Content Vault", icon: "\u{1F4E6}", count: localContents.length },
    { id: "plan" as const, label: "Study Plan", icon: "\u{1F4C5}", count: null },
    { id: "members" as const, label: "Squad", icon: "\u{1F465}", count: room.members.length },
    { id: "chat" as const, label: "Chat", icon: "\u{1F4AC}", count: chatMessages.length },
  ];

  return (
    <div>
      {/* Room Header */}
      <div className="border-b" style={{ borderColor: S.border }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">
          <button onClick={onBack} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider mb-4 transition-colors hover:text-signal"
            style={{ color: S.inkDim }}>
            {"←"} All Rooms
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm">{topic.emoji}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: topic.color }}>{topic.label}</span>
                {room.isLive && (
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: S.green }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: S.green }} /> Live Now
                  </span>
                )}
              </div>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight" style={{ color: S.ink }}>{room.name}</h2>
              <p className="text-sm mt-2 max-w-xl leading-relaxed" style={{ color: S.inkDim }}>{room.description}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: S.inkFaint }}>Created by {room.createdBy}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: S.signalAlt }}>{getWindowInfo(room.examWindow).label}</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <CountdownRing days={days} total={180} size={80} />
              <button className="font-mono text-[10px] uppercase tracking-wider font-bold px-5 py-2.5 rounded-lg transition-all hover:brightness-110"
                style={{ background: S.signal, color: "#000" }}>
                Join Room
              </button>
            </div>
          </div>

          {/* Room stats bar */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t flex-wrap" style={{ borderColor: S.border }}>
            <MemberStack members={room.members} max={8} />
            <div className="flex items-center gap-5 font-mono text-[10px]">
              <span style={{ color: S.green }}>{room.members.filter(m => m.isOnline).length} online</span>
              <span style={{ color: S.purple }}>{room.contentCount} resources</span>
              <span style={{ color: S.teal }}>{room.totalFocusHours}h focused</span>
              <span style={{ color: S.orange }}>{room.members.reduce((a, m) => a + m.streak, 0)} streak days total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b sticky top-14 z-30" style={{ borderColor: S.border, background: "rgba(7,7,7,0.95)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.15em] font-bold transition-all border-b-2 ${
                  activeTab === tab.id ? "border-signal" : "border-transparent hover:border-white/10"
                }`}
                style={{ color: activeTab === tab.id ? S.signal : S.inkDim }}>
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
                {tab.count !== null && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full" style={{
                    background: activeTab === tab.id ? "rgba(255,214,51,0.12)" : "rgba(255,255,255,0.04)",
                    color: activeTab === tab.id ? S.signal : S.inkFaint
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {activeTab === "vault" && (
          <div>
            {/* AI Content Dump Zone */}
            <div className="rounded-xl border p-5 mb-6" style={{ background: S.bgCard, borderColor: S.borderSignal }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{"\u{1F4E5}"}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: S.signal }}>Content Dump Zone</span>
                <span className="font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(160,128,255,0.1)", color: S.purple }}>AI-Powered</span>
              </div>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: S.inkDim }}>
                Paste your raw notes, formulas, links, or study material. AI will organize, format, and turn them into flashcards, formula sheets, or mind maps.
              </p>
              <textarea value={dumpText} onChange={e => setDumpText(e.target.value)}
                placeholder="Paste your notes, formulas, or any study content here... AI will do the rest."
                rows={3} className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none rounded-lg p-3 border"
                style={{ color: S.ink, borderColor: S.border, background: "rgba(255,255,255,0.02)" }} />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {["Note", "Formula Sheet", "Flashcards", "Mind Map"].map(type => (
                    <button key={type} className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all hover:border-signal/30 hover:text-signal"
                      style={{ color: S.inkFaint, borderColor: S.border }}>
                      {type}
                    </button>
                  ))}
                </div>
                <button onClick={handleDump} disabled={!dumpText.trim()}
                  className="font-mono text-[10px] uppercase tracking-wider font-bold px-5 py-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-30"
                  style={{ background: S.signal, color: "#000" }}>
                  {"✨"} Dump & Enhance
                </button>
              </div>
            </div>

            {/* Content list */}
            <div className="space-y-2">
              {localContents.map(item => (
                <div key={item.id} className="rounded-lg border p-4 flex items-center gap-4 transition-all hover:border-white/10 group"
                  style={{ background: S.bgCard, borderColor: S.border }}>
                  <ContentBadge type={item.type} aiEnhanced={item.aiEnhanced} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: S.ink }}>{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[9px]" style={{ color: S.inkFaint }}>by {item.author}</span>
                      <span className="font-mono text-[9px]" style={{ color: S.inkFaint }}>{"·"} {item.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px]" style={{ color: S.inkDim }}>
                    {"⬆"} {item.votes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div>
            <div className="rounded-xl border p-5" style={{ background: S.bgCard, borderColor: S.border }}>
              <CalendarStudyPlan plan={room.studyPlan} />
            </div>

            {/* Today's Plan */}
            <div className="rounded-xl border p-5 mt-4" style={{ background: S.bgCard, borderColor: S.border }}>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-4" style={{ color: S.inkFaint }}>
                {"\u{1F3AF}"} Today's Focus
              </div>
              {(() => {
                const today = new Date().toISOString().split("T")[0];
                const todayPlan = room.studyPlan.find(d => d.date === today);
                if (!todayPlan) return <p className="text-sm" style={{ color: S.inkDim }}>No plan for today</p>;
                const topicInfo = getTopicInfo(todayPlan.topicId);
                return (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{topicInfo.emoji}</span>
                      <span className="text-sm font-bold" style={{ color: S.ink }}>{todayPlan.topic}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span style={{ color: S.signal }}>{todayPlan.hours}h planned</span>
                      <span style={{ color: S.teal }}>{todayPlan.mcqs || "TBD"} MCQs</span>
                      <span className={todayPlan.completed ? "" : ""} style={{ color: todayPlan.completed ? S.green : S.orange }}>
                        {todayPlan.completed ? "✓ Completed" : "⏳ In Progress"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Upcoming week */}
            <div className="rounded-xl border p-5 mt-4" style={{ background: S.bgCard, borderColor: S.border }}>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-4" style={{ color: S.inkFaint }}>
                {"\u{1F5D3}"} Next 7 Days
              </div>
              <div className="space-y-2">
                {room.studyPlan
                  .filter(d => {
                    const diff = new Date(d.date).getTime() - Date.now();
                    return diff > 0 && diff < 7 * 86400000;
                  })
                  .slice(0, 7)
                  .map((day, i) => {
                    const topicInfo = getTopicInfo(day.topicId);
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: S.border }}>
                        <span className="font-mono text-[10px] w-20 shrink-0" style={{ color: S.inkFaint }}>
                          {new Date(day.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="text-xs">{topicInfo.emoji}</span>
                        <span className="text-sm flex-1" style={{ color: S.ink }}>{day.topic}</span>
                        <span className="font-mono text-[10px]" style={{ color: S.signal }}>{day.hours}h</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {room.members.map((m, i) => {
              const progressColor = m.progress >= 75 ? S.green : m.progress >= 50 ? S.signal : m.progress >= 25 ? S.orange : S.red;
              return (
                <div key={i} className="rounded-xl border p-4 flex items-start gap-4" style={{ background: S.bgCard, borderColor: S.border }}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-sm font-bold"
                      style={{ background: m.isMentor ? "rgba(255,214,51,0.12)" : "rgba(255,255,255,0.06)", color: m.isMentor ? S.signal : S.inkDim }}>
                      {m.initials}
                    </div>
                    {m.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: S.green, borderColor: S.bgCard }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: S.ink }}>{m.name}</span>
                      {m.isMentor && <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: "rgba(255,214,51,0.1)", color: S.signal }}>Mentor</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 font-mono text-[9px]">
                      <span style={{ color: S.inkFaint }}>{m.vouches} vouches</span>
                      <span style={{ color: S.orange }}>{"\u{1F525}"} {m.streak}d streak</span>
                      <span style={{ color: m.isOnline ? S.green : S.inkFaint }}>{m.isOnline ? "Online" : "Offline"}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[8px] uppercase tracking-wider" style={{ color: S.inkFaint }}>Syllabus Progress</span>
                        <span className="font-mono text-[10px] font-bold" style={{ color: progressColor }}>{m.progress}%</span>
                      </div>
                      <ProgressBar value={m.progress} color={progressColor} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="rounded-xl border overflow-hidden" style={{ background: S.bgCard, borderColor: S.border }}>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {chatMessages.map((msg, i) => {
                const isAI = msg.author === "AI Assistant";
                return (
                  <div key={i} className={`flex gap-3 ${isAI ? "pl-0" : ""}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0"
                      style={{ background: isAI ? "rgba(160,128,255,0.12)" : "rgba(255,255,255,0.06)", color: isAI ? S.purple : S.inkDim }}>
                      {isAI ? "AI" : msg.author.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: isAI ? S.purple : S.ink }}>{msg.author}</span>
                        <span className="font-mono text-[9px]" style={{ color: S.inkFaint }}>{msg.time}</span>
                      </div>
                      <p className="text-sm mt-1 leading-relaxed" style={{ color: isAI ? S.purple : S.inkDim }}>{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t flex gap-2" style={{ borderColor: S.border }}>
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-lg border"
                style={{ color: S.ink, borderColor: S.border }}
                onKeyDown={e => {
                  if (e.key === "Enter" && newMsg.trim()) {
                    setChatMessages(prev => [...prev, { author: "You", text: newMsg.trim(), time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) }]);
                    setNewMsg("");
                  }
                }} />
              <button className="font-mono text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-lg"
                style={{ background: S.signal, color: "#000" }}
                onClick={() => {
                  if (newMsg.trim()) {
                    setChatMessages(prev => [...prev, { author: "You", text: newMsg.trim(), time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) }]);
                    setNewMsg("");
                  }
                }}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Create Room Modal ──────────────────────────── */
function CreateRoomModal({ onClose, onCreate }: { onClose: () => void; onCreate: (room: StudyRoom) => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [topic, setTopic] = useState("general");
  const [examWindow, setExamWindow] = useState("sep-oct-2026");
  const [endDate, setEndDate] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);

  const handleCreate = () => {
    if (!name.trim()) return;
    const window = getWindowInfo(examWindow);
    const room: StudyRoom = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      description: desc.trim() || "A study room for CMA aspirants",
      topic,
      examWindow,
      endDate: endDate || window.deadline,
      createdBy: profile?.display_name || "You",
      members: [{
        name: profile?.display_name || "You",
        initials: (profile?.display_name || "YO").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
        isMentor: profile?.role === "mentor",
        vouches: 0,
        progress: 0,
        streak: 0,
        isOnline: true,
      }],
      maxMembers,
      contentCount: 0,
      contents: [],
      studyPlan: [],
      isLive: true,
      focusMinutesToday: 0,
      totalFocusHours: 0,
      tags: [getTopicInfo(topic).label, window.label],
      createdAt: new Date().toISOString().split("T")[0],
    };
    onCreate(room);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border overflow-hidden" style={{ background: S.bgElevated, borderColor: S.borderSignal }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${S.signal}, ${S.purple}, ${S.teal})` }} />
        <div className="p-6">
          <h2 className="font-display text-2xl tracking-tight mb-1" style={{ color: S.ink }}>Create a Study Room</h2>
          <p className="text-xs mb-5" style={{ color: S.inkDim }}>Build your squad. Set a target date. Dump content. Let AI do the rest.</p>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: S.inkFaint }}>Room Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., CMA Part 1 June Warriors"
                className="w-full bg-transparent text-sm outline-none px-3 py-2.5 rounded-lg border" style={{ color: S.ink, borderColor: S.border }} />
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: S.inkFaint }}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this room about? Study strategy, focus areas..."
                rows={2} className="w-full bg-transparent text-sm outline-none px-3 py-2.5 rounded-lg border resize-none" style={{ color: S.ink, borderColor: S.border }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: S.inkFaint }}>Focus Topic</label>
                <select value={topic} onChange={e => setTopic(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none px-3 py-2.5 rounded-lg border" style={{ color: S.ink, borderColor: S.border }}>
                  {CMA_TOPICS.map(t => <option key={t.id} value={t.id} style={{ background: S.bgAlt }}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: S.inkFaint }}>Exam Window</label>
                <select value={examWindow} onChange={e => setExamWindow(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none px-3 py-2.5 rounded-lg border" style={{ color: S.ink, borderColor: S.border }}>
                  {EXAM_WINDOWS.map(w => <option key={w.id} value={w.id} style={{ background: S.bgAlt }}>{w.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: S.inkFaint }}>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none px-3 py-2.5 rounded-lg border" style={{ color: S.ink, borderColor: S.border }} />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5" style={{ color: S.inkFaint }}>Max Members</label>
                <select value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))}
                  className="w-full bg-transparent text-sm outline-none px-3 py-2.5 rounded-lg border" style={{ color: S.ink, borderColor: S.border }}>
                  {[4, 6, 8, 10, 12, 15, 20].map(n => <option key={n} value={n} style={{ background: S.bgAlt }}>{n} members</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: S.border }}>
            <button onClick={onClose} className="flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 rounded-lg border transition-all hover:border-white/10"
              style={{ color: S.inkDim, borderColor: S.border }}>Cancel</button>
            <button onClick={handleCreate} disabled={!name.trim()}
              className="flex-1 font-mono text-[10px] uppercase tracking-wider font-bold py-2.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-30"
              style={{ background: S.signal, color: "#000" }}>
              Create Room {"→"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STUDY ROOMS — Main Page
   ══════════════════════════════════════════════════════ */
export function StudyRooms() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname === "/app" ? "wall" : location.pathname === "/rooms" ? "rooms" : location.pathname.startsWith("/mock") ? "mocks" : "";
  const [rooms, setRooms] = useState<StudyRoom[]>(SEED_ROOMS);
  const [activeFilter, setActiveFilter] = useState<"all" | "live" | "my">("all");
  const [openRoom, setOpenRoom] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filteredRooms = useMemo(() => {
    if (activeFilter === "live") return rooms.filter(r => r.isLive);
    return rooms;
  }, [rooms, activeFilter]);

  const openRoomData = openRoom ? rooms.find(r => r.id === openRoom) : null;

  const handleCreate = useCallback((room: StudyRoom) => {
    setRooms(prev => [room, ...prev]);
    setShowCreate(false);
    setOpenRoom(room.id);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: S.bg, color: S.ink, fontFamily: "'Syne', sans-serif" }}>

      {/* ════ Top bar ════ */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(7,7,7,0.85)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: `1px solid ${S.border}` }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          {/* Brand */}
          <button onClick={() => nav("/app")} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${S.signal}, ${S.signalAlt})` }}>
              <span className="font-mono text-[11px] font-black text-black">C</span>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold transition-colors group-hover:text-signal" style={{ color: S.ink }}>
              CoStudy
            </span>
          </button>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl px-1.5 py-1"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}` }}>
            {NAV_ITEMS.map(item => {
              const isCurrent = item.id === currentPage;
              return (
                <button key={item.id}
                  onClick={() => item.route ? nav(item.route) : undefined}
                  disabled={!item.active}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
                    !item.active ? "cursor-not-allowed opacity-30" : "hover:bg-white/[0.04]"
                  }`}
                  style={{
                    background: isCurrent ? "rgba(255,214,51,0.1)" : undefined,
                    color: isCurrent ? S.signal : item.active ? S.inkDim : S.inkFaint,
                  }}>
                  {isCurrent && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: S.signal }} />
                  )}
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
                    style={{
                      background: isCurrent ? "rgba(255,214,51,0.15)" : "rgba(255,255,255,0.04)",
                      color: isCurrent ? S.signal : S.inkFaint,
                      border: `1px solid ${isCurrent ? "rgba(255,214,51,0.2)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {!item.active && <span className="text-[7px] tracking-[0.2em] opacity-60 ml-0.5">SOON</span>}
                </button>
              );
            })}
          </nav>

          {/* Mobile nav */}
          <nav className="flex md:hidden items-center gap-1">
            {NAV_ITEMS.filter(i => i.active).map(item => {
              const isCurrent = item.id === currentPage;
              return (
                <button key={item.id} onClick={() => item.route ? nav(item.route) : undefined}
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[10px] font-black transition-all"
                  style={{
                    background: isCurrent ? "rgba(255,214,51,0.12)" : "rgba(255,255,255,0.03)",
                    color: isCurrent ? S.signal : S.inkFaint,
                    border: `1px solid ${isCurrent ? "rgba(255,214,51,0.2)" : "transparent"}`,
                  }}>
                  {item.icon}
                </button>
              );
            })}
          </nav>

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/[0.03]"
              style={{ border: `1px solid ${S.border}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold"
                style={{ background: `linear-gradient(135deg, rgba(255,214,51,0.2), rgba(255,184,0,0.1))`, color: S.signal }}>
                {(profile?.display_name || "U")[0]}
              </div>
              <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider" style={{ color: S.inkDim }}>
                {profile?.display_name || "User"}
              </span>
            </div>
            <button onClick={signOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] transition-all hover:bg-white/[0.04] hover:border-signal/30"
              style={{ color: S.inkFaint, border: `1px solid ${S.border}` }}
              title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      {openRoomData ? (
        <RoomInterior room={openRoomData} onBack={() => setOpenRoom(null)} />
      ) : (
        <>
          {/* Filter bar — simple, clean */}
          <div className="border-b" style={{ borderColor: S.border }}>
            <div className="max-w-[1200px] mx-auto px-4 md:px-8">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {([["all", "All Rooms"], ["live", "Live"], ["my", "My Rooms"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveFilter(key)}
                      className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all border ${
                        activeFilter === key ? "font-bold border-signal/40" : "border-transparent hover:border-white/10"
                      }`}
                      style={activeFilter === key ? { background: "rgba(255,214,51,0.12)", color: S.signal } : { color: S.inkDim }}>
                      {key === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ background: S.green }} />}
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowCreate(true)}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wider font-bold px-5 py-2 rounded-lg transition-all hover:brightness-110"
                  style={{ background: S.signal, color: "#000" }}>
                  + Create Room
                </button>
              </div>
            </div>
          </div>

          {/* Room List — single column, clean */}
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="font-display text-xl mb-2" style={{ color: S.ink }}>No rooms found</h3>
                <p className="text-sm mb-6" style={{ color: S.inkDim }}>Try a different filter or create your own room</p>
                <button onClick={() => setShowCreate(true)}
                  className="font-mono text-[10px] uppercase tracking-wider font-bold px-6 py-3 rounded-lg"
                  style={{ background: S.signal, color: "#000" }}>
                  + Create a Room
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRooms.map(room => (
                  <RoomCard key={room.id} room={room} onOpen={setOpenRoom} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
