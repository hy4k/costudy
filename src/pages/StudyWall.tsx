import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* ── Design tokens ───────────────────────────────── */
const S = {
  bg: "#070707",
  bgAlt: "#0d0d0d",
  bgCard: "#0f0f12",
  bgElevated: "#141419",
  bgInput: "#111115",
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
  borderSignal: "rgba(255,214,51,0.14)",
};

/* ── Nav items ─────────────────────────────────────── */
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
  { id: "p1-efr", label: "Ext. Financial Reporting", emoji: "\u{1F4CA}", color: S.blue },
  { id: "p1-planning", label: "Planning & Budgeting", emoji: "\u{1F4CB}", color: S.green },
  { id: "p1-performance", label: "Performance Mgmt", emoji: "\u{1F4C8}", color: S.teal },
  { id: "p1-cost", label: "Cost Management", emoji: "\u{1F4B0}", color: S.orange },
  { id: "p1-ic", label: "Internal Controls", emoji: "\u{1F512}", color: S.purple },
  { id: "p1-tech", label: "Technology", emoji: "\u{1F4BB}", color: S.pink },
  { id: "p2-financial", label: "Financial Analysis", emoji: "\u{1F50D}", color: S.blue },
  { id: "p2-corporate", label: "Corporate Finance", emoji: "\u{1F3E2}", color: S.green },
  { id: "p2-decision", label: "Decision Analysis", emoji: "\u{1F3AF}", color: S.signal },
  { id: "p2-risk", label: "Risk Management", emoji: "⚡", color: S.red },
  { id: "p2-investment", label: "Investment Decisions", emoji: "\u{1F4C9}", color: S.teal },
  { id: "p2-ethics", label: "Professional Ethics", emoji: "⚖️", color: S.purple },
  { id: "study-tips", label: "Study Tips", emoji: "\u{1F9E0}", color: S.teal },
  { id: "resources", label: "Resources & Notes", emoji: "\u{1F4DA}", color: S.blue },
  { id: "motivation", label: "Motivation", emoji: "\u{1F525}", color: S.orange },
  { id: "exam-experience", label: "Exam Experience", emoji: "\u{1F393}", color: S.signal },
];

/* ── Exam Windows ────────────────────────────────── */
const EXAM_WINDOWS = [
  { label: "May — Jun 2026", deadline: "2026-06-30", status: "active" as const },
  { label: "Sep — Oct 2026", deadline: "2026-10-31", status: "open" as const },
  { label: "Jan — Feb 2027", deadline: "2027-02-28", status: "upcoming" as const },
];

/* ── Trending Topics ─────────────────────────────── */
const TRENDING = [
  { label: "Activity-Based Costing", count: 47, hot: true },
  { label: "Variance Analysis", count: 38, hot: true },
  { label: "CVP Analysis", count: 31, hot: false },
  { label: "Transfer Pricing", count: 24, hot: false },
  { label: "Capital Budgeting NPV", count: 19, hot: false },
];

/* ── Active Rooms (sidebar widget) ───────────────── */
const ACTIVE_ROOMS = [
  { name: "CMA Part 1 — June Crushers", members: 6, online: 4, color: S.orange },
  { name: "Part 2 Deep Dive", members: 4, online: 3, color: S.blue },
  { name: "Ethics & Essay Prep", members: 5, online: 2, color: S.purple },
];

/* ── Mock data ───────────────────────────────────── */
interface PostAuthor { name: string; initials: string; isMentor: boolean; vouches: number }
interface WallPost { id: string; author: PostAuthor; topic: string; content: string; vouches: number; vouchedByMe: boolean; replies: number; createdAt: string }

const SEED_POSTS: WallPost[] = [
  { id: "p1", author: { name: "Anjana K.", initials: "AK", isMentor: true, vouches: 247 }, topic: "p1-cost",
    content: "Just finished a deep dive into Activity-Based Costing vs Traditional Costing. The key insight: ABC allocates overhead based on multiple cost drivers, not just one. For CMA Part 1, remember — ABC gives more accurate product costs when overhead is a large % of total costs and products differ significantly in their use of resources. Who else is struggling with cost allocation methods?",
    vouches: 34, vouchedByMe: false, replies: 8, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "p2", author: { name: "Rahul H.", initials: "RH", isMentor: false, vouches: 183 }, topic: "study-tips",
    content: "Study hack that worked for me: Instead of reading Gleim cover-to-cover, I started with MCQ practice first, then went back to read only the topics I got wrong. Saved me 40+ hours on Part 1 prep. Your brain retains better when it has context for WHY something matters.",
    vouches: 56, vouchedByMe: false, replies: 15, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "p3", author: { name: "Sufiya M.", initials: "SM", isMentor: true, vouches: 156 }, topic: "p2-financial",
    content: "Quick ratio analysis tip for Part 2:\n\nCurrent Ratio = Current Assets / Current Liabilities\nQuick Ratio = (CA - Inventory - Prepaid) / CL\n\nThe trick IMA loves: they'll give you data where inventory is 60%+ of current assets. A company can have a healthy current ratio (2.0) but a terrible quick ratio (0.6). Always calculate both!",
    vouches: 42, vouchedByMe: false, replies: 11, createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "p4", author: { name: "Devika P.", initials: "DP", isMentor: false, vouches: 94 }, topic: "exam-experience",
    content: "Cleared Part 1 yesterday with a 380! \u{1F389} Was scoring 55-60% on mocks two months ago. What changed: focused study rooms on CoStudy (3 hours daily with accountability partners), AI drills on my weakest topics (budgeting and variance analysis), and doing 100 MCQs every single day for the last 3 weeks. Don't give up if your mock scores are low — they WILL climb.",
    vouches: 89, vouchedByMe: false, replies: 23, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "p5", author: { name: "Arjun P.", initials: "AP", isMentor: false, vouches: 67 }, topic: "p1-planning",
    content: "Can someone explain the difference between a static budget and a flexible budget variance? I keep mixing up the formulas. When the question says 'budget variance' without specifying, which one do they mean?",
    vouches: 12, vouchedByMe: false, replies: 6, createdAt: new Date(Date.now() - 18 * 3600000).toISOString() },
  { id: "p6", author: { name: "Fathima N.", initials: "FN", isMentor: false, vouches: 45 }, topic: "motivation",
    content: "Day 127 of CMA prep. Some days the material feels impossible, but then I remember: 70% fail rate means most people quit before they're ready. We're not most people. Keep grinding. \u{1F4AA}\n\nWho's targeting the July window? Let's form an accountability group.",
    vouches: 71, vouchedByMe: false, replies: 19, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
];

/* ── Helpers ──────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getTopicInfo(id: string) {
  return CMA_TOPICS.find(t => t.id === id) || CMA_TOPICS[0];
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

/* ── VouchButton ─────────────────────────────────── */
function VouchButton({ count, vouched, onClick }: { count: number; vouched: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all"
      style={{
        background: vouched ? "rgba(255,214,51,0.12)" : "rgba(255,255,255,0.03)",
        color: vouched ? S.signal : S.inkFaint,
        border: `1px solid ${vouched ? "rgba(255,214,51,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={vouched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
        className="transition-transform group-hover:scale-110">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span className="font-bold">{count}</span>
    </button>
  );
}

/* ── PostCard ────────────────────────────────────── */
function PostCard({ post, onVouch }: { post: WallPost; onVouch: (id: string) => void }) {
  const topic = getTopicInfo(post.topic);
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 280;

  return (
    <div className="group relative py-5 first:pt-0 last:pb-0">
      {/* Subtle left accent for mentors */}
      {post.author.isMentor && (
        <div className="absolute left-0 top-5 bottom-0 w-0.5 rounded-full" style={{ background: `linear-gradient(to bottom, ${S.signal}, transparent)` }} />
      )}
      <div className={`${post.author.isMentor ? "pl-4" : ""}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold relative"
            style={{
              background: post.author.isMentor
                ? `linear-gradient(135deg, rgba(255,214,51,0.2), rgba(255,184,0,0.1))`
                : "rgba(255,255,255,0.06)",
              color: post.author.isMentor ? S.signal : S.inkDim,
              border: `1.5px solid ${post.author.isMentor ? "rgba(255,214,51,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}>
            {post.author.initials}
            {post.author.isMentor && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px]"
                style={{ background: S.signal, color: "#000" }}>
                {"✓"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: S.ink }}>{post.author.name}</span>
              {post.author.isMentor && (
                <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm"
                  style={{ background: "linear-gradient(135deg, rgba(255,214,51,0.15), rgba(255,184,0,0.08))", color: S.signal, border: "1px solid rgba(255,214,51,0.2)" }}>
                  Mentor
                </span>
              )}
              <span className="text-[10px] font-mono" style={{ color: S.inkFaint }}>
                {post.author.vouches} vouches {"·"} {timeAgo(post.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs">{topic.emoji}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: topic.color || S.signalAlt }}>{topic.label}</span>
            </div>
          </div>
        </div>
        <div className="ml-[52px]">
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(245,245,240,0.88)" }}>
            {isLong && !expanded ? post.content.slice(0, 280) + "..." : post.content}
          </div>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-mono uppercase tracking-wider mt-1.5 transition-colors hover:brightness-125"
              style={{ color: S.signalAlt }}>
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          <div className="flex items-center gap-2.5 mt-4">
            <VouchButton count={post.vouches} vouched={post.vouchedByMe} onClick={() => onVouch(post.id)} />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all hover:bg-white/[0.05] hover:border-white/10"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: S.inkFaint }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span className="font-bold">{post.replies}</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all hover:bg-white/[0.05] hover:border-white/10"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: S.inkFaint }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            </button>
          </div>
        </div>
      </div>
      {/* Separator */}
      <div className="mt-5 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.04), transparent)" }} />
    </div>
  );
}

/* ── Sidebar Card wrapper ────────────────────────── */
function SideCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: S.bgCard, border: `1px solid ${S.border}` }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${S.border}` }}>
        {accent && <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />}
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: S.inkDim }}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STUDY WALL ── Main Component
   ══════════════════════════════════════════════════════ */
export function StudyWall() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<WallPost[]>(SEED_POSTS);
  const [activeTopic, setActiveTopic] = useState("all");
  const [composing, setComposing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTopic, setNewTopic] = useState("general");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (composing && textareaRef.current) textareaRef.current.focus(); }, [composing]);

  const filteredPosts = useMemo(() => activeTopic === "all" ? posts : posts.filter(p => p.topic === activeTopic), [posts, activeTopic]);

  const handleVouch = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id !== id ? p : { ...p, vouchedByMe: !p.vouchedByMe, vouches: p.vouchedByMe ? p.vouches - 1 : p.vouches + 1 }));
  }, []);

  const handlePost = useCallback(() => {
    if (!newContent.trim()) return;
    setPosts(prev => [{
      id: `p-${Date.now()}`,
      author: { name: profile?.display_name || "Anonymous", initials: (profile?.display_name || "AN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(), isMentor: profile?.role === "mentor", vouches: 0 },
      topic: newTopic, content: newContent.trim(), vouches: 0, vouchedByMe: false, replies: 0, createdAt: new Date().toISOString(),
    }, ...prev]);
    setNewContent(""); setComposing(false);
  }, [newContent, newTopic, profile]);

  const topicCounts = useMemo(() => {
    const c: Record<string, number> = {};
    posts.forEach(p => { c[p.topic] = (c[p.topic] || 0) + 1; });
    return c;
  }, [posts]);

  const currentPage = location.pathname === "/app" ? "wall" : location.pathname === "/rooms" ? "rooms" : location.pathname.startsWith("/mock") ? "mocks" : "";

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

      {/* ════ Topic filter ════ */}
      <div style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(13,13,13,0.4)" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTopic("all")}
              className="shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all"
              style={activeTopic === "all"
                ? { background: "rgba(255,214,51,0.12)", color: S.signal, border: "1px solid rgba(255,214,51,0.25)", fontWeight: 700 }
                : { color: S.inkDim, border: "1px solid transparent" }
              }>
              All {"·"} {posts.length}
            </button>
            {CMA_TOPICS.map(t => {
              const count = topicCounts[t.id] || 0;
              const active = activeTopic === t.id;
              if (count === 0 && !active) return null;
              return (
                <button key={t.id} onClick={() => setActiveTopic(t.id)}
                  className="shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5"
                  style={active
                    ? { background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}40`, fontWeight: 700 }
                    : { color: S.inkDim, border: "1px solid transparent" }
                  }>
                  <span className="text-xs">{t.emoji}</span>
                  {t.label}
                  {count > 0 && <span style={{ opacity: 0.5 }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════ Main layout: Feed + Sidebar ════ */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-6">

          {/* ── Feed column ── */}
          <main className="flex-1 min-w-0 max-w-[680px]">
            {/* Compose */}
            <div className="rounded-xl mb-6 overflow-hidden transition-all"
              style={{
                background: composing ? S.bgCard : S.bgCard,
                border: composing ? `1px solid rgba(255,214,51,0.15)` : `1px solid ${S.border}`,
                boxShadow: composing ? "0 0 30px rgba(255,214,51,0.03)" : undefined,
              }}>
              {!composing ? (
                <button onClick={() => setComposing(true)}
                  className="w-full text-left px-5 py-4 flex items-center gap-3 transition-all hover:bg-white/[0.02] group">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold transition-all group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, rgba(255,214,51,0.15), rgba(255,184,0,0.08))`, color: S.signal, border: "1px solid rgba(255,214,51,0.2)" }}>
                    {(profile?.display_name || "U")[0]}
                  </div>
                  <span className="text-sm transition-colors group-hover:text-ink-dim" style={{ color: S.inkFaint }}>Share a concept, question, or study tip...</span>
                </button>
              ) : (
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: S.inkFaint }}>Topic:</span>
                    <select value={newTopic} onChange={e => setNewTopic(e.target.value)}
                      className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-lg bg-transparent outline-none cursor-pointer"
                      style={{ border: `1px solid ${S.border}`, color: S.signalAlt }}>
                      {CMA_TOPICS.map(t => (
                        <option key={t.id} value={t.id} style={{ background: S.bgAlt }}>{t.emoji} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea ref={textareaRef} value={newContent} onChange={e => setNewContent(e.target.value)}
                    placeholder="Share your CMA insight, question, or study breakthrough..."
                    rows={4} className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none placeholder:opacity-30" style={{ color: S.ink }} />
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
                    <span className="font-mono text-[10px]" style={{ color: S.inkFaint }}>{newContent.length} chars</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setComposing(false); setNewContent(""); }}
                        className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors hover:bg-white/[0.04]" style={{ color: S.inkDim }}>
                        Cancel
                      </button>
                      <button onClick={handlePost} disabled={!newContent.trim()}
                        className="px-5 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:brightness-110 disabled:opacity-30"
                        style={{ background: `linear-gradient(135deg, ${S.signal}, ${S.signalAlt})`, color: "#000" }}>
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Feed */}
            <div className="rounded-xl overflow-hidden" style={{ background: S.bgCard, border: `1px solid ${S.border}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${S.border}` }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: S.inkFaint }}>
                  {activeTopic === "all" ? "All Posts" : getTopicInfo(activeTopic).label} {"·"} {filteredPosts.length}
                </span>
                <div className="font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: S.inkFaint }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: S.green }} />
                  Live
                </div>
              </div>
              <div className="px-5 py-4">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3 opacity-40">{"\u{1F4ED}"}</div>
                    <p className="text-sm" style={{ color: S.inkDim }}>No posts in this topic yet. Be the first!</p>
                  </div>
                ) : (
                  filteredPosts.map(post => <PostCard key={post.id} post={post} onVouch={handleVouch} />)
                )}
              </div>
            </div>
          </main>

          {/* ── Right sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-[300px] shrink-0">

            {/* Your Stats */}
            <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${S.bgCard}, rgba(255,214,51,0.02))`, border: `1px solid ${S.borderSignal}` }}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, rgba(255,214,51,0.2), rgba(255,184,0,0.1))`, color: S.signal, border: "1.5px solid rgba(255,214,51,0.3)" }}>
                    {(profile?.display_name || "U")[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: S.ink }}>{profile?.display_name || "User"}</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: S.inkFaint }}>CMA Aspirant</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Vouches", value: "32", color: S.signal },
                    { label: "Streak", value: "7d", color: S.green },
                    { label: "MCQs", value: "142", color: S.blue },
                  ].map(s => (
                    <div key={s.label} className="text-center py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="font-mono text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="font-mono text-[8px] uppercase tracking-wider mt-0.5" style={{ color: S.inkFaint }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Exam Windows Countdown */}
            <SideCard title="Exam Windows" accent={S.signal}>
              <div className="space-y-3">
                {EXAM_WINDOWS.map(w => {
                  const days = daysUntil(w.deadline);
                  const isActive = w.status === "active";
                  return (
                    <div key={w.label} className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold" style={{ color: isActive ? S.ink : S.inkDim }}>{w.label}</div>
                        <div className="font-mono text-[9px] uppercase tracking-wider mt-0.5" style={{ color: S.inkFaint }}>
                          {isActive ? "Registration open" : w.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold" style={{ color: isActive && days < 60 ? S.orange : S.inkDim }}>
                          {days}d
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SideCard>

            {/* Trending Topics */}
            <SideCard title="Trending Topics" accent={S.orange}>
              <div className="space-y-2.5">
                {TRENDING.map((t, i) => (
                  <button key={t.label}
                    className="w-full flex items-center gap-3 text-left group transition-colors hover:bg-white/[0.02] rounded-lg px-2 py-1.5 -mx-2"
                    onClick={() => {}}>
                    <span className="font-mono text-[10px] font-bold w-4 text-right" style={{ color: S.inkFaint }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate group-hover:text-signal transition-colors" style={{ color: S.ink }}>
                        {t.label}
                      </div>
                      <div className="font-mono text-[9px]" style={{ color: S.inkFaint }}>
                        {t.count} posts {t.hot && "·"} {t.hot && <span style={{ color: S.orange }}>trending</span>}
                      </div>
                    </div>
                    {t.hot && (
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: S.orange }} />
                    )}
                  </button>
                ))}
              </div>
            </SideCard>

            {/* Active Rooms */}
            <SideCard title="Active Rooms" accent={S.green}>
              <div className="space-y-3">
                {ACTIVE_ROOMS.map(r => (
                  <button key={r.name}
                    onClick={() => nav("/rooms")}
                    className="w-full flex items-start gap-3 text-left group transition-colors hover:bg-white/[0.02] rounded-lg px-2 py-1.5 -mx-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-[9px] font-black"
                      style={{ background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}30` }}>
                      {r.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate group-hover:text-signal transition-colors" style={{ color: S.ink }}>{r.name}</div>
                      <div className="font-mono text-[9px] flex items-center gap-2 mt-0.5" style={{ color: S.inkFaint }}>
                        <span>{r.members} members</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full" style={{ background: S.green }} />
                          {r.online} online
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                <button onClick={() => nav("/rooms")}
                  className="w-full font-mono text-[10px] uppercase tracking-wider py-2 text-center rounded-lg transition-all hover:bg-white/[0.03]"
                  style={{ color: S.signalAlt, border: `1px dashed ${S.border}` }}>
                  Browse all rooms
                </button>
              </div>
            </SideCard>

          </aside>
        </div>
      </div>
    </div>
  );
}
