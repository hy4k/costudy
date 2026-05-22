import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* ── Design tokens ───────────────────────────────── */
const S = {
  bg: "#070707",
  bgAlt: "#0d0d0d",
  bgCard: "#0f0f12",
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
};

/* ── Nav items ─────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "wall", label: "Study Wall", icon: "📡", route: "/app", active: true },
  { id: "mocks", label: "Mock Engine", icon: "📝", route: "/mocks", active: true },
  { id: "rooms", label: "Study Rooms", icon: "🎧", route: "/rooms", active: true },
  { id: "ai", label: "AI Mastermind", icon: "🤖", route: null, active: false },
  { id: "mentors", label: "Mentors", icon: "🧑‍🏫", route: null, active: false },
];

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
    content: "Cleared Part 1 yesterday with a 380! 🎉 Was scoring 55-60% on mocks two months ago. What changed: focused study rooms on CoStudy (3 hours daily with accountability partners), AI drills on my weakest topics (budgeting and variance analysis), and doing 100 MCQs every single day for the last 3 weeks. Don't give up if your mock scores are low — they WILL climb.",
    vouches: 89, vouchedByMe: false, replies: 23, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "p5", author: { name: "Arjun P.", initials: "AP", isMentor: false, vouches: 67 }, topic: "p1-planning",
    content: "Can someone explain the difference between a static budget and a flexible budget variance? I keep mixing up the formulas. When the question says 'budget variance' without specifying, which one do they mean?",
    vouches: 12, vouchedByMe: false, replies: 6, createdAt: new Date(Date.now() - 18 * 3600000).toISOString() },
  { id: "p6", author: { name: "Fathima N.", initials: "FN", isMentor: false, vouches: 45 }, topic: "motivation",
    content: "Day 127 of CMA prep. Some days the material feels impossible, but then I remember: 70% fail rate means most people quit before they're ready. We're not most people. Keep grinding. 💪\n\nWho's targeting the July window? Let's form an accountability group.",
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

/* ── VouchButton ─────────────────────────────────── */
function VouchButton({ count, vouched, onClick }: { count: number; vouched: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
        vouched ? "bg-signal/15 text-signal border border-signal/30" : "bg-white/[0.03] border border-white/[0.06] hover:border-signal/30 hover:text-signal"
      }`} style={{ color: vouched ? undefined : S.inkFaint }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={vouched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
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
    <div className="border-b border-white/[0.04] py-6 first:pt-0 last:border-b-0">
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
            <span className="text-[10px] font-mono" style={{ color: S.inkFaint }}>{post.author.vouches} vouches · {timeAgo(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs">{topic.emoji}</span>
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: S.signalAlt }}>{topic.label}</span>
          </div>
        </div>
      </div>
      <div className="ml-[52px]">
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: S.ink }}>
          {isLong && !expanded ? post.content.slice(0, 280) + "..." : post.content}
        </div>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} className="text-[11px] font-mono uppercase tracking-wider mt-1.5 transition-colors hover:text-signal" style={{ color: S.signalAlt }}>
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        <div className="flex items-center gap-3 mt-4">
          <VouchButton count={post.vouches} vouched={post.vouchedByMe} onClick={() => onVouch(post.id)} />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-ink-dim" style={{ color: S.inkFaint }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span className="font-bold">{post.replies}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-ink-dim" style={{ color: S.inkFaint }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
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

  return (
    <div className="min-h-screen" style={{ background: S.bg, color: S.ink, fontFamily: "'Syne', sans-serif" }}>

      {/* ════════════════════════════════════════════════
         TOP BAR — Brand + User
         ════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(7,7,7,0.92)", borderColor: S.border, backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-[1.5px] grid place-items-center brand-mark-pulse" style={{ borderColor: S.signal }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold" style={{ color: S.signal }}>CoStudy</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: "rgba(255,214,51,0.1)", color: S.signal }}>
              {(profile?.display_name || "U")[0]}
            </div>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider" style={{ color: S.inkDim }}>
              {profile?.display_name || "User"}
            </span>
            <button onClick={signOut}
              className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded border transition-all hover:border-signal/40 hover:text-signal"
              style={{ color: S.inkFaint, borderColor: S.border }}>
              ↗ Out
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
         COMMAND BAR — Navigation as proper buttons
         ════════════════════════════════════════════════ */}
      <div className="border-b" style={{ borderColor: S.border, background: "rgba(13,13,13,0.6)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map(item => {
              const isCurrent = item.id === "wall";
              return (
                <button key={item.id}
                  onClick={() => item.route ? nav(item.route) : undefined}
                  disabled={!item.active}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-[0.15em] font-bold transition-all border ${
                    isCurrent
                      ? "text-black border-transparent shadow-[0_0_20px_rgba(255,214,51,0.15)]"
                      : item.active
                        ? "border-white/10 hover:border-signal/40 hover:text-signal hover:shadow-[0_0_12px_rgba(255,214,51,0.08)]"
                        : "border-white/[0.04] cursor-not-allowed opacity-40"
                  }`}
                  style={isCurrent
                    ? { background: S.signal, color: "#000" }
                    : { color: item.active ? S.inkDim : S.inkFaint }
                  }>
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                  {!item.active && <span className="text-[8px] tracking-widest opacity-60">SOON</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
         TOPIC FILTER BAR — horizontal pills
         ════════════════════════════════════════════════ */}
      <div className="border-b" style={{ borderColor: S.border }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTopic("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all border ${
                activeTopic === "all" ? "font-bold border-signal/40" : "border-transparent hover:border-white/10"
              }`}
              style={activeTopic === "all" ? { background: "rgba(255,214,51,0.12)", color: S.signal } : { color: S.inkDim }}>
              All · {posts.length}
            </button>
            {CMA_TOPICS.map(t => {
              const count = topicCounts[t.id] || 0;
              const active = activeTopic === t.id;
              if (count === 0 && !active) return null;
              return (
                <button key={t.id} onClick={() => setActiveTopic(t.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                    active ? "font-bold border-signal/40" : "border-transparent hover:border-white/10"
                  }`}
                  style={active ? { background: "rgba(255,214,51,0.12)", color: S.signal } : { color: S.inkDim }}>
                  <span className="text-xs">{t.emoji}</span>
                  {t.label.split(" · ").pop()}
                  {count > 0 && <span className="opacity-50">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
         MAIN CONTENT — clean centered feed
         ════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto px-4 md:px-6">

        <main className="w-full py-6">
          {/* Compose */}
          <div className="rounded-xl border mb-6 overflow-hidden" style={{ background: S.bgCard, borderColor: S.border }}>
            {!composing ? (
              <button onClick={() => setComposing(true)}
                className="w-full text-left px-5 py-4 flex items-center gap-3 transition-colors hover:bg-white/[0.02]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold" style={{ background: "rgba(255,214,51,0.1)", color: S.signal }}>
                  {(profile?.display_name || "U")[0]}
                </div>
                <span className="text-sm" style={{ color: S.inkFaint }}>Share a concept, question, or study tip...</span>
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
                <textarea ref={textareaRef} value={newContent} onChange={e => setNewContent(e.target.value)}
                  placeholder="Share your CMA insight, question, or study breakthrough..."
                  rows={4} className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none placeholder:text-ink-faint" style={{ color: S.ink }} />
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                  <span className="font-mono text-[10px]" style={{ color: S.inkFaint }}>{newContent.length} chars</span>
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
                filteredPosts.map(post => <PostCard key={post.id} post={post} onVouch={handleVouch} />)
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
