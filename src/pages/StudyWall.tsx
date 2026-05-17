import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type UserProfile } from "@/context/AuthContext";

/* ── Design tokens — same dark cinematic theme ───── */
const S = {
  bg: "#070707",
  bgAlt: "#0d0d0d",
  bgCard: "#0f0f12",
  bgInput: "#111115",
  signal: "#FFD633",
  signalAlt: "#ffb800",
  ink: "#f5f5f0",
  inkDim: "#9a9a92",
  inkFaint: "#4a4a44",
  green: "#4ade80",
  red: "#ef4444",
  blue: "#60a5fa",
  purple: "#a78bfa",
  teal: "#2dd4bf",
  border: "rgba(255,255,255,0.06)",
  borderSignal: "rgba(255,214,51,0.14)",
};

/* ── CMA US Topics ─────────────────────────────────── */
const CMA_TOPICS = [
  { id: "general", label: "General", emoji: "💬" },
  { id: "p1-efr", label: "P1 · Ext. Financial Reporting", emoji: "📊" },
  { id: "p1-planning", label: "P1 · Planning & Budgeting", emoji: "📋" },
  { id: "p1-performance", label: "P1 · Performance Mgmt", emoji: "📈" },
  { id: "p1-cost", label: "P1 · Cost Management", emoji: "💰" },
  { id: "p1-ic", label: "P1 · Internal Controls", emoji: "🔒" },
  { id: "p1-tech", label: "P1 · Technology", emoji: "💻" },
  { id: "p2-financial", label: "P2 · Financial Analysis", emoji: "🔍" },
  { id: "p2-corporate", label: "P2 · Corporate Finance", emoji: "🏢" },
  { id: "p2-decision", label: "P2 · Decision Analysis", emoji: "🎯" },
  { id: "p2-risk", label: "P2 · Risk Management", emoji: "⚡" },
  { id: "p2-investment", label: "P2 · Investment Decisions", emoji: "📉" },
  { id: "p2-ethics", label: "P2 · Professional Ethics", emoji: "⚖️" },
  { id: "study-tips", label: "Study Tips", emoji: "🧠" },
  { id: "resources", label: "Resources & Notes", emoji: "📚" },
  { id: "motivation", label: "Motivation", emoji: "🔥" },
  { id: "exam-experience", label: "Exam Experience", emoji: "🎓" },
];

/* ── Mock data for initial posts ─────────────────── */
const SEED_POSTS: WallPost[] = [
  {
    id: "p1",
    author: { name: "Anjana K.", initials: "AK", isMentor: true, vouches: 247 },
    topic: "p1-cost",
    content: "Just finished a deep dive into Activity-Based Costing vs Traditional Costing. The key insight: ABC allocates overhead based on multiple cost drivers, not just one. For CMA Part 1, remember — ABC gives more accurate product costs when overhead is a large % of total costs and products differ significantly in their use of resources. Who else is struggling with cost allocation methods?",
    vouches: 34,
    vouchedByMe: false,
    replies: 8,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p2",
    author: { name: "Rahul H.", initials: "RH", isMentor: false, vouches: 183 },
    topic: "study-tips",
    content: "Study hack that worked for me: Instead of reading Gleim cover-to-cover, I started with MCQ practice first, then went back to read only the topics I got wrong. Saved me 40+ hours on Part 1 prep. Your brain retains better when it has context for WHY something matters.",
    vouches: 56,
    vouchedByMe: false,
    replies: 15,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p3",
    author: { name: "Sufiya M.", initials: "SM", isMentor: true, vouches: 156 },
    topic: "p2-financial",
    content: "Quick ratio analysis tip for Part 2:\n\nCurrent Ratio = Current Assets / Current Liabilities\nQuick Ratio = (CA - Inventory - Prepaid) / CL\n\nThe trick IMA loves: they'll give you data where inventory is 60%+ of current assets. A company can have a healthy current ratio (2.0) but a terrible quick ratio (0.6). Always calculate both!",
    vouches: 42,
    vouchedByMe: false,
    replies: 11,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p4",
    author: { name: "Devika P.", initials: "DP", isMentor: false, vouches: 94 },
    topic: "exam-experience",
    content: "Cleared Part 1 yesterday with a 380! 🎉 Was scoring 55-60% on mocks two months ago. What changed: focused study rooms on CoStudy (3 hours daily with accountability partners), AI drills on my weakest topics (budgeting and variance analysis), and doing 100 MCQs every single day for the last 3 weeks. Don't give up if your mock scores are low — they WILL climb.",
    vouches: 89,
    vouchedByMe: false,
    replies: 23,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p5",
    author: { name: "Arjun P.", initials: "AP", isMentor: false, vouches: 67 },
    topic: "p1-planning",
    content: "Can someone explain the difference between a static budget and a flexible budget variance? I keep mixing up the formulas. When the question says 'budget variance' without specifying, which one do they mean?",
    vouches: 12,
    vouchedByMe: false,
    replies: 6,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p6",
    author: { name: "Fathima N.", initials: "FN", isMentor: false, vouches: 45 },
    topic: "motivation",
    content: "Day 127 of CMA prep. Some days the material feels impossible, but then I remember: 70% fail rate means most people quit before they're ready. We're not most people. Keep grinding. 💪\n\nWho's targeting the July window? Let's form an accountability group.",
    vouches: 71,
    vouchedByMe: false,
    replies: 19,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

/* ── Types ────────────────────────────────────────── */
interface PostAuthor {
  name: string;
  initials: string;
  isMentor: boolean;
  vouches: number;
}

interface WallPost {
  id: string;
  author: PostAuthor;
  topic: string;
  content: string;
  vouches: number;
  vouchedByMe: boolean;
  replies: number;
  createdAt: string;
}

/* ── Helpers ──────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getTopicInfo(id: string) {
  return CMA_TOPICS.find(t => t.id === id) || CMA_TOPICS[0];
}

/* ── VouchButton ─────────────────────────────────── */
function VouchButton({ count, vouched, onClick }: { count: number; vouched: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
        vouched
          ? "bg-signal/15 text-signal border border-signal/30"
          : "bg-white/[0.03] text-ink-faint border border-white/[0.06] hover:border-signal/30 hover:text-signal"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={vouched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span className="font-bold">{count}</span>
      <span className="hidden sm:inline">vouch{count !== 1 ? "es" : ""}</span>
    </button>
  );
}

/* ── PostCard ────────────────────────────────────── */
function PostCard({ post, onVouch }: { post: WallPost; onVouch: (id: string) => void }) {
  const topic = getTopicInfo(post.topic);
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 280;

  return (
    <div className="border-b border-white/[0.04] py-6 first:pt-0 last:border-b-0">
      {/* Author Row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold"
          style={{ background: post.author.isMentor ? "rgba(255,214,51,0.12)" : "rgba(255,255,255,0.06)", color: post.author.isMentor ? S.signal : S.inkDim, border: `1px solid ${post.author.isMentor ? "rgba(255,214,51,0.25)" : "rgba(255,255,255,0.08)"}` }}>
          {post.author.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: S.ink }}>{post.author.name}</span>
            {post.author.isMentor && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: "rgba(255,214,51,0.1)", color: S.signal, border: "1px solid rgba(255,214,51,0.2)" }}>
                Mentor
              </span>
            )}
            <span className="text-[10px] font-mono" style={{ color: S.inkFaint }}>{post.author.vouches} vouches</span>
            <span className="text-[10px] font-mono" style={{ color: S.inkFaint }}>·</span>
            <span className="text-[10px] font-mono" style={{ color: S.inkFaint }}>{timeAgo(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs">{topic.emoji}</span>
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: S.signalAlt }}>{topic.label}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="ml-[52px]">
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: S.ink }}>
          {isLong && !expanded ? post.content.slice(0, 280) + "..." : post.content}
        </div>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} className="text-[11px] font-mono uppercase tracking-wider mt-1.5 transition-colors hover:text-signal" style={{ color: S.signalAlt }}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4">
          <VouchButton count={post.vouches} vouched={post.vouchedByMe} onClick={() => onVouch(post.id)} />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all bg-white/[0.03] text-ink-faint border border-white/[0.06] hover:border-white/10 hover:text-ink-dim">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="font-bold">{post.replies}</span>
            <span className="hidden sm:inline">replies</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all bg-white/[0.03] text-ink-faint border border-white/[0.06] hover:border-white/10 hover:text-ink-dim">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span className="hidden sm:inline">share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STUDY WALL — Main Component
   ══════════════════════════════════════════════════════ */
export function StudyWall() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts] = useState<WallPost[]>(SEED_POSTS);
  const [activeTopic, setActiveTopic] = useState("all");
  const [composing, setComposing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTopic, setNewTopic] = useState("general");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (composing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [composing]);

  const filteredPosts = useMemo(() => {
    if (activeTopic === "all") return posts;
    return posts.filter(p => p.topic === activeTopic);
  }, [posts, activeTopic]);

  const handleVouch = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        vouchedByMe: !p.vouchedByMe,
        vouches: p.vouchedByMe ? p.vouches - 1 : p.vouches + 1,
      };
    }));
  }, []);

  const handlePost = useCallback(() => {
    if (!newContent.trim()) return;
    const post: WallPost = {
      id: `p-${Date.now()}`,
      author: {
        name: profile?.display_name || "Anonymous",
        initials: (profile?.display_name || "AN").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
        isMentor: profile?.role === "mentor",
        vouches: 0,
      },
      topic: newTopic,
      content: newContent.trim(),
      vouches: 0,
      vouchedByMe: false,
      replies: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [post, ...prev]);
    setNewContent("");
    setComposing(false);
  }, [newContent, newTopic, profile]);

  // Topic stats
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => { counts[p.topic] = (counts[p.topic] || 0) + 1; });
    return counts;
  }, [posts]);

  return (
    <div className="min-h-screen" style={{ background: S.bg, color: S.ink, fontFamily: "'Syne', sans-serif" }}>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 border-b px-4 md:px-6 lg:px-8" style={{ background: "rgba(7,7,7,0.85)", borderColor: S.border, backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-[1.5px] grid place-items-center brand-mark-pulse" style={{ borderColor: S.signal }} />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: S.signal }}>CMA US · Study Wall</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => nav("/mocks")}
              className="font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-signal" style={{ color: S.inkDim }}>
              Mock Engine
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: "rgba(255,214,51,0.1)", color: S.signal }}>
                {(profile?.display_name || "U")[0]}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: S.inkDim }}>
                {profile?.display_name || "User"}
              </span>
            </div>
            <button onClick={signOut}
              className="font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-signal" style={{ color: S.inkFaint }}>
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 grid place-items-center">
            <span className="relative w-5 h-3 block">
              <span className={`absolute left-0 top-0 w-full h-px transition-transform ${mobileMenuOpen ? "translate-y-[5px] rotate-45" : ""}`} style={{ background: S.ink }} />
              <span className={`absolute left-0 bottom-0 w-full h-px transition-transform ${mobileMenuOpen ? "-translate-y-[5px] -rotate-45" : ""}`} style={{ background: S.ink }} />
            </span>
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t flex flex-col gap-3" style={{ borderColor: S.border }}>
            <button onClick={() => { nav("/mocks"); setMobileMenuOpen(false); }}
              className="font-mono text-xs uppercase tracking-wider text-left py-2" style={{ color: S.inkDim }}>Mock Engine</button>
            <button onClick={() => { signOut(); setMobileMenuOpen(false); }}
              className="font-mono text-xs uppercase tracking-wider text-left py-2" style={{ color: S.inkFaint }}>Sign Out</button>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-8 px-4 md:px-6 lg:px-8">
        {/* ══════════════════════════════════════════
           LEFT SIDEBAR — Topic Filters (desktop)
           ══════════════════════════════════════════ */}
        <aside className="hidden lg:block w-64 shrink-0 py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          {/* User Card */}
          <div className="rounded-xl p-4 mb-6 border" style={{ background: S.bgCard, borderColor: S.border }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold" style={{ background: "rgba(255,214,51,0.12)", color: S.signal }}>
                {(profile?.display_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold">{profile?.display_name || "Aspirant"}</div>
                <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: S.inkFaint }}>
                  {profile?.primary_exam?.replace("_", " ") || "CMA US"} · {profile?.streak_days || 0}d streak
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: S.border }}>
              {[
                { label: "Mocks", value: profile?.total_mocks || 0 },
                { label: "Essays", value: profile?.total_essays || 0 },
                { label: "Vouches", value: 0 },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-sm font-bold" style={{ color: S.signal }}>{s.value}</div>
                  <div className="font-mono text-[8px] uppercase tracking-wider" style={{ color: S.inkFaint }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Filters */}
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-3 px-2" style={{ color: S.inkFaint }}>
            Topics
          </div>
          <button
            onClick={() => setActiveTopic("all")}
            className={`w-full text-left px-3 py-2 rounded-lg font-mono text-[11px] uppercase tracking-wider mb-0.5 transition-all ${
              activeTopic === "all" ? "text-black font-bold" : "hover:bg-white/[0.03]"
            }`}
            style={activeTopic === "all" ? { background: S.signal, color: "#000" } : { color: S.inkDim }}
          >
            All Posts · {posts.length}
          </button>
          <div className="space-y-0.5 max-h-[calc(100vh-400px)] overflow-y-auto">
            {CMA_TOPICS.map(t => {
              const count = topicCounts[t.id] || 0;
              const active = activeTopic === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTopic(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all flex items-center gap-2 ${
                    active ? "font-bold" : "hover:bg-white/[0.03]"
                  }`}
                  style={active ? { background: "rgba(255,214,51,0.1)", color: S.signal } : { color: count > 0 ? S.inkDim : S.inkFaint }}>
                  <span className="text-xs">{t.emoji}</span>
                  <span className="truncate flex-1">{t.label}</span>
                  {count > 0 && <span className="font-mono text-[9px]" style={{ color: S.inkFaint }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ══════════════════════════════════════════
           MAIN FEED
           ══════════════════════════════════════════ */}
        <main className="flex-1 min-w-0 py-6 max-w-2xl">
          {/* Mobile topic filter bar */}
          <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 pb-2">
              <button onClick={() => setActiveTopic("all")}
                className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider border transition-all ${
                  activeTopic === "all" ? "font-bold border-signal/30" : "border-white/[0.06] hover:border-white/10"
                }`}
                style={activeTopic === "all" ? { background: "rgba(255,214,51,0.1)", color: S.signal } : { color: S.inkDim }}>
                All
              </button>
              {CMA_TOPICS.filter(t => (topicCounts[t.id] || 0) > 0).map(t => (
                <button key={t.id} onClick={() => setActiveTopic(t.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider border transition-all ${
                    activeTopic === t.id ? "font-bold border-signal/30" : "border-white/[0.06] hover:border-white/10"
                  }`}
                  style={activeTopic === t.id ? { background: "rgba(255,214,51,0.1)", color: S.signal } : { color: S.inkDim }}>
                  {t.emoji} {t.label.split(" · ").pop()}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="rounded-xl border mb-6 overflow-hidden" style={{ background: S.bgCard, borderColor: S.border }}>
            {!composing ? (
              <button onClick={() => setComposing(true)}
                className="w-full text-left px-5 py-4 flex items-center gap-3 transition-colors hover:bg-white/[0.02]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold" style={{ background: "rgba(255,214,51,0.1)", color: S.signal }}>
                  {(profile?.display_name || "U")[0]}
                </div>
                <span className="text-sm" style={{ color: S.inkFaint }}>Share a concept, question, or study tip with the CMA community...</span>
              </button>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: S.inkFaint }}>Topic:</span>
                  <select value={newTopic} onChange={e => setNewTopic(e.target.value)}
                    className="font-mono text-[11px] uppercase tracking-wider px-2 py-1 rounded border bg-transparent outline-none"
                    style={{ borderColor: S.border, color: S.signalAlt }}>
                    {CMA_TOPICS.map(t => (
                      <option key={t.id} value={t.id} style={{ background: S.bgAlt }}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={textareaRef}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Share your CMA insight, question, or study breakthrough..."
                  rows={4}
                  className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none placeholder:text-ink-faint"
                  style={{ color: S.ink }}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                  <span className="font-mono text-[10px]" style={{ color: S.inkFaint }}>
                    {newContent.length} chars
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => { setComposing(false); setNewContent(""); }}
                      className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-colors hover:bg-white/[0.03]" style={{ color: S.inkDim }}>
                      Cancel
                    </button>
                    <button onClick={handlePost} disabled={!newContent.trim()}
                      className="px-5 py-2 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:brightness-110 disabled:opacity-30"
                      style={{ background: S.signal, color: "#000" }}>
                      Post →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feed */}
          <div className="rounded-xl border overflow-hidden" style={{ background: S.bgCard, borderColor: S.border }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: S.inkFaint }}>
                {activeTopic === "all" ? "All Posts" : getTopicInfo(activeTopic).label} · {filteredPosts.length}
              </span>
              <div className="font-mono text-[9px] uppercase tracking-wider flex items-center gap-1" style={{ color: S.inkFaint }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: S.green }} />
                Live
              </div>
            </div>
            <div className="px-5 py-4">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">📭</div>
                  <p className="text-sm" style={{ color: S.inkDim }}>No posts in this topic yet. Be the first!</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} onVouch={handleVouch} />
                ))
              )}
            </div>
          </div>
        </main>

        {/* ══════════════════════════════════════════
           RIGHT SIDEBAR — Trending & Quick Links
           ══════════════════════════════════════════ */}
        <aside className="hidden xl:block w-72 shrink-0 py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          {/* Trending Topics */}
          <div className="rounded-xl border p-4 mb-6" style={{ background: S.bgCard, borderColor: S.border }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-4" style={{ color: S.inkFaint }}>
              🔥 Trending This Week
            </div>
            {[
              { topic: "Variance Analysis — Budget vs Actual", hot: true },
              { topic: "ABC vs Traditional Costing", hot: true },
              { topic: "CVP Analysis Shortcuts", hot: false },
              { topic: "Transfer Pricing Methods", hot: false },
              { topic: "Essay Writing Strategies", hot: false },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                <span className="font-mono text-[10px] font-bold w-5 shrink-0" style={{ color: S.inkFaint }}>#{i + 1}</span>
                <div>
                  <span className="text-xs" style={{ color: t.hot ? S.signal : S.inkDim }}>{t.topic}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border p-4 mb-6" style={{ background: S.bgCard, borderColor: S.border }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-4" style={{ color: S.inkFaint }}>
              Quick Actions
            </div>
            <div className="space-y-2">
              <button onClick={() => nav("/mocks")}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-2 hover:border-signal/30"
                style={{ borderColor: S.border, color: S.inkDim }}>
                <span>📝</span> Start a Mock Exam
              </button>
              <button className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-2 hover:border-signal/30"
                style={{ borderColor: S.border, color: S.inkFaint }}>
                <span>🤖</span> AI Mastermind (soon)
              </button>
              <button className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-2 hover:border-signal/30"
                style={{ borderColor: S.border, color: S.inkFaint }}>
                <span>📖</span> Study Rooms (soon)
              </button>
            </div>
          </div>

          {/* CMA Exam Windows */}
          <div className="rounded-xl border p-4" style={{ background: S.bgCard, borderColor: S.border }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-4" style={{ color: S.inkFaint }}>
              📅 CMA Exam Windows
            </div>
            {[
              { window: "May — Jun 2026", status: "Active", color: S.green },
              { window: "Sep — Oct 2026", status: "Registration Open", color: S.signal },
              { window: "Jan — Feb 2027", status: "Upcoming", color: S.blue },
            ].map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                <span className="text-xs" style={{ color: S.inkDim }}>{w.window}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider font-bold" style={{ color: w.color }}>{w.status}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
