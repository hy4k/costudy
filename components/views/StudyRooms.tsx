import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icons } from '../Icons';
import { supabase } from '../../services/supabaseClient';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface StudyRoom {
  id: string;
  name: string;
  category: string;
  topic: string;
  description: string;
  target_topics: string[];
  color_theme: string;
  is_live: boolean;
  members_count: number;
  active_count: number;
}

interface ChatMsg {
  id: string;
  author_id: string;
  is_ai: boolean;
  content: string;
  created_at: string;
  author?: { display_name: string; avatar_url: string | null };
}

interface Battle {
  id: string;
  topic: string;
  question_count: number;
  status: string;
  created_at: string;
  created_by: string;
  participants?: { user_id: string; score: number; questions_answered: number }[];
}

interface LeaderEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  questions_solved: number;
  streak_days: number;
  total_score: number;
}

interface MCQ {
  id: string;
  stem: string;
  choices: Record<string, string>;  // {A: '...', B: '...', ...}
  correct_key: string;
  explanation: string;
  topic: string;
}

interface PresenceMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

// ─────────────────────────────────────────────
// CMA SYLLABUS CONFIG
// ─────────────────────────────────────────────

const ROOM_META: Record<string, { emoji: string; weight: string; part: string; color: string }> = {
  'External Financial Reporting Decisions': { emoji: '📑', weight: '15%', part: 'Part 1', color: '#0ea5e9' },
  'Planning, Budgeting and Forecasting':    { emoji: '📊', weight: '20%', part: 'Part 1', color: '#8b5cf6' },
  'Performance Management':                  { emoji: '🎯', weight: '20%', part: 'Part 1', color: '#ec4899' },
  'Cost Management':                         { emoji: '🧮', weight: '15%', part: 'Part 1', color: '#f59e0b' },
  'Internal Controls':                       { emoji: '🔒', weight: '15%', part: 'Part 1', color: '#14b8a6' },
  'Technology and Analytics':                { emoji: '⚡', weight: '15%', part: 'Part 1', color: '#6366f1' },
  'Financial Statement Analysis':            { emoji: '🔬', weight: '20%', part: 'Part 2', color: '#f43f5e' },
  'Corporate Finance':                       { emoji: '🏦', weight: '25%', part: 'Part 2', color: '#22c55e' },
  'Decision Analysis':                       { emoji: '⚖️', weight: '25%', part: 'Part 2', color: '#f97316' },
  'Risk Management':                         { emoji: '🛡️', weight: '10%', part: 'Part 2', color: '#ef4444' },
  'Investment Decisions':                    { emoji: '💹', weight: '10%', part: 'Part 2', color: '#3b82f6' },
  'Professional Ethics':                     { emoji: '⚖️', weight: '10%', part: 'Part 2', color: '#10b981' },
  'General':                                 { emoji: '🌐', weight: '',    part: 'General', color: '#a855f7' },
};

function getRoomMeta(topic: string) {
  return ROOM_META[topic] || { emoji: '📚', weight: '', part: '', color: '#e15549' };
}

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

// ─────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────

const Avatar: React.FC<{ name: string; url?: string | null; size?: number }> = ({ name, url, size = 32 }) => {
  const letter = (name || 'U').charAt(0).toUpperCase();
  return url ? (
    <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
  ) : (
    <span style={{
      width: size, height: size, borderRadius: '50%', flex: 'none',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--accent-soft)', color: 'var(--accent-deep)',
      fontWeight: 800, fontSize: Math.round(size * 0.38),
    }}>{letter}</span>
  );
};

const Spinner: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

interface Props { userId?: string; userProfile?: { display_name: string; avatar_url: string | null } | null }

export const StudyRooms: React.FC<Props> = ({ userId, userProfile }) => {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudyRoom | null>(null);
  const [tab, setTab] = useState<'arena' | 'battles' | 'chat' | 'board'>('arena');

  // Arena
  const [dailyQ, setDailyQ] = useState<MCQ | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Battles
  const [battles, setBattles] = useState<Battle[]>([]);
  const [activeBattle, setActiveBattle] = useState<{
    sessionId: string; questions: MCQ[]; idx: number; score: number;
    picked: string | null; timeLeft: number; done: boolean;
  } | null>(null);
  const battleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Leaderboard
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);

  // Presence
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineAvatars, setOnlineAvatars] = useState<PresenceMember[]>([]);

  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const msgChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const battleChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load rooms ──
  useEffect(() => {
    supabase.from('study_rooms')
      .select('id,name,category,topic,description,target_topics,color_theme,is_live,members_count,active_count')
      .order('category').order('name')
      .then(({ data }) => { setRooms(data || []); setLoading(false); });
  }, []);

  // ── Enter/leave room ──
  const enterRoom = useCallback(async (room: StudyRoom) => {
    setSelected(room);
    setTab('arena');
    setMessages([]);
    setBattles([]);
    setLeaders([]);
    setDailyQ(null);
    setPickedKey(null);
    setRevealed(false);
    setActiveBattle(null);
    loadRoomData(room);
  }, [userId, userProfile]);

  const leaveRoom = useCallback(() => {
    // Cleanup presence & realtime
    presenceChannelRef.current?.untrack();
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current);
    if (battleChannelRef.current) supabase.removeChannel(battleChannelRef.current);
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    setSelected(null);
    setActiveBattle(null);
  }, []);

  const loadRoomData = async (room: StudyRoom) => {
    // Parallel loads
    await Promise.all([
      loadDailyQ(room.topic),
      loadMessages(room.id),
      loadBattles(room.id),
      loadLeaderboard(room.id),
      setupPresence(room.id),
      setupRealtimeChat(room.id),
      setupRealtimeBattles(room.id),
    ]);
  };

  // ── Daily challenge question ──
  const loadDailyQ = async (topic: string) => {
    const { data: count } = await supabase
      .from('mcq_questions')
      .select('id', { count: 'exact', head: true })
      .eq('topic', topic);
    const total = (count as any)?.count || 0;
    if (!total) return;
    const offset = dayOfYear() % total;
    const { data } = await supabase
      .from('mcq_questions')
      .select('id,stem,choices,correct_key,explanation,topic')
      .eq('topic', topic)
      .range(offset, offset);
    if (data?.[0]) setDailyQ(data[0]);
  };

  // ── Chat ──
  const loadMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('room_messages')
      .select('id,author_id,is_ai,content,created_at,author:user_profiles(display_name,avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(40);
    setMessages((data || []).reverse() as ChatMsg[]);
  };

  const setupRealtimeChat = (roomId: string) => {
    if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current);
    msgChannelRef.current = supabase.channel(`room-chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        const msg = payload.new as ChatMsg;
        // Fetch author name
        const { data: profile } = await supabase
          .from('user_profiles').select('display_name,avatar_url').eq('id', msg.author_id).single();
        setMessages(prev => [...prev, { ...msg, author: profile || undefined }]);
      })
      .subscribe();
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !selected || !userId) return;
    setSendingMsg(true);
    const text = chatInput.trim();
    setChatInput('');
    await supabase.from('room_messages').insert({
      room_id: selected.id, author_id: userId, content: text, is_ai: false
    });
    setSendingMsg(false);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Battles ──
  const loadBattles = async (roomId: string) => {
    const { data } = await supabase
      .from('mcq_war_sessions')
      .select('id,topic,question_count,status,created_at,created_by,participants:mcq_war_participants(user_id,score,questions_answered)')
      .eq('room_id', roomId)
      .in('status', ['active', 'waiting'])
      .order('created_at', { ascending: false })
      .limit(10);
    setBattles(data || []);
  };

  const setupRealtimeBattles = (roomId: string) => {
    if (battleChannelRef.current) supabase.removeChannel(battleChannelRef.current);
    battleChannelRef.current = supabase.channel(`room-battles-${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'mcq_war_sessions',
        filter: `room_id=eq.${roomId}`
      }, () => loadBattles(roomId))
      .subscribe();
  };

  const startBattle = async () => {
    if (!selected || !userId) return;
    const topic = selected.topic;
    // Create session
    const { data: session } = await supabase
      .from('mcq_war_sessions')
      .insert({ room_id: selected.id, topic, question_count: 10, time_limit_seconds: 30, status: 'active', created_by: userId })
      .select().single();
    if (!session) return;
    // Join as participant
    await supabase.from('mcq_war_participants').insert({ session_id: session.id, user_id: userId, score: 0, questions_answered: 0 });
    // Fetch random questions
    const { data: qs } = await supabase
      .from('mcq_questions')
      .select('id,stem,choices,correct_key,explanation,topic')
      .eq('topic', topic)
      .limit(100);
    if (!qs?.length) return;
    const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, 10);
    setActiveBattle({ sessionId: session.id, questions: shuffled, idx: 0, score: 0, picked: null, timeLeft: 30, done: false });
    startBattleTimer(session.id, shuffled, 0, 30);
  };

  const startBattleTimer = (sessionId: string, questions: MCQ[], idx: number, timeLeft: number) => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    battleTimerRef.current = setInterval(() => {
      setActiveBattle(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          // Time's up — auto-advance
          clearInterval(battleTimerRef.current!);
          const nextIdx = prev.idx + 1;
          if (nextIdx >= prev.questions.length) {
            endBattle(sessionId, prev.score);
            return { ...prev, timeLeft: 0, done: true };
          }
          setTimeout(() => startBattleTimer(sessionId, prev.questions, nextIdx, 30), 500);
          return { ...prev, idx: nextIdx, picked: null, timeLeft: 30 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const answerBattle = (key: string) => {
    if (!activeBattle || activeBattle.picked) return;
    clearInterval(battleTimerRef.current!);
    const correct = activeBattle.questions[activeBattle.idx].correct_key === key;
    const newScore = activeBattle.score + (correct ? 1 : 0);
    const nextIdx = activeBattle.idx + 1;
    setActiveBattle(prev => prev ? { ...prev, picked: key, score: newScore } : null);
    setTimeout(() => {
      if (nextIdx >= activeBattle.questions.length) {
        endBattle(activeBattle.sessionId, newScore);
        setActiveBattle(prev => prev ? { ...prev, done: true } : null);
      } else {
        setActiveBattle(prev => prev ? { ...prev, idx: nextIdx, picked: null, timeLeft: 30 } : null);
        startBattleTimer(activeBattle.sessionId, activeBattle.questions, nextIdx, 30);
      }
    }, 1200);
  };

  const endBattle = async (sessionId: string, score: number) => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    await Promise.all([
      supabase.from('mcq_war_sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', sessionId),
      userId && supabase.from('mcq_war_participants').update({ score, questions_answered: activeBattle?.questions.length || 10, accuracy: score / (activeBattle?.questions.length || 10) }).eq('session_id', sessionId).eq('user_id', userId),
      // Update weekly leaderboard
      selected && userId && upsertLeaderboard(selected.id, userId, score),
    ]);
  };

  const upsertLeaderboard = async (roomId: string, uid: string, score: number) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('room_leaderboard')
      .select('id,questions_solved,total_score')
      .eq('room_id', roomId).eq('user_id', uid).eq('week_start', weekStr).single();
    if (existing) {
      await supabase.from('room_leaderboard').update({
        questions_solved: (existing.questions_solved || 0) + score,
        total_score: (existing.total_score || 0) + score * 10,
      }).eq('id', existing.id);
    } else {
      await supabase.from('room_leaderboard').insert({
        room_id: roomId, user_id: uid, week_start: weekStr,
        questions_solved: score, total_score: score * 10, streak_days: 1,
        display_name: userProfile?.display_name || 'Anonymous',
        avatar_url: userProfile?.avatar_url || null,
      });
    }
    loadLeaderboard(roomId);
  };

  // ── Leaderboard ──
  const loadLeaderboard = async (roomId: string) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split('T')[0];
    const { data } = await supabase
      .from('room_leaderboard')
      .select('user_id,display_name,avatar_url,questions_solved,streak_days,total_score')
      .eq('room_id', roomId).eq('week_start', weekStr)
      .order('total_score', { ascending: false })
      .limit(20);
    setLeaders(data || []);
  };

  // ── Presence ──
  const setupPresence = async (roomId: string) => {
    // Clean up old
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    // Upsert into room_presence
    if (userId) {
      await supabase.from('room_presence').upsert({
        room_id: roomId, user_id: userId,
        display_name: userProfile?.display_name || 'Anonymous',
        avatar_url: userProfile?.avatar_url || null,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'room_id,user_id' });
    }
    // Fetch current online (last 5 min)
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('room_presence')
      .select('user_id,display_name,avatar_url')
      .eq('room_id', roomId)
      .gte('last_seen', cutoff);
    setOnlineCount(data?.length || 0);
    setOnlineAvatars((data || []).slice(0, 6) as PresenceMember[]);

    // Supabase presence channel for live tracking
    presenceChannelRef.current = supabase.channel(`presence-${roomId}`, {
      config: { presence: { key: userId || 'anon' } }
    });
    presenceChannelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current!.presenceState();
        const members = Object.values(state).flat() as PresenceMember[];
        setOnlineCount(members.length);
        setOnlineAvatars(members.slice(0, 6));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userId) {
          await presenceChannelRef.current!.track({
            user_id: userId,
            display_name: userProfile?.display_name || 'Anonymous',
            avatar_url: userProfile?.avatar_url || null,
          });
        }
      });
  };

  // Heartbeat to keep presence fresh
  useEffect(() => {
    if (!selected || !userId) return;
    const iv = setInterval(async () => {
      await supabase.from('room_presence').upsert({
        room_id: selected.id, user_id: userId, last_seen: new Date().toISOString()
      }, { onConflict: 'room_id,user_id' });
    }, 60000);
    return () => clearInterval(iv);
  }, [selected?.id, userId]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current);
    if (battleChannelRef.current) supabase.removeChannel(battleChannelRef.current);
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    if (selected && userId) {
      supabase.from('room_presence').delete().eq('room_id', selected.id).eq('user_id', userId);
    }
  }, []);

  // ─────────────────────────────────────────
  // ROOM LIST VIEW
  // ─────────────────────────────────────────

  if (!selected) {
    const part1 = rooms.filter(r => r.category === 'CMA US Part 1');
    const part2 = rooms.filter(r => r.category === 'CMA US Part 2');
    const general = rooms.filter(r => !['CMA US Part 1', 'CMA US Part 2'].includes(r.category));

    return (
      <div className="proto wall-embedded">
        <div className="wall" data-page="rooms">
          <main className="shell-solo shell-rooms">

            {/* Header */}
            <div className="feed-hello rooms-hello">
              <div>
                <h1 className="font-display" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', marginBottom: 4 }}>
                  Study Arenas
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Choose your CMA topic — questions, battles & live chat inside.
                </p>
              </div>
            </div>

            {loading ? <Spinner /> : (
              <>
                <RoomSection title="Part 1 · Financial Planning, Performance & Analytics" rooms={part1} onEnter={enterRoom} />
                <RoomSection title="Part 2 · Strategic Financial Management" rooms={part2} onEnter={enterRoom} />
                {general.length > 0 && <RoomSection title="Open Lounge" rooms={general} onEnter={enterRoom} />}
              </>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // ROOM DETAIL VIEW
  // ─────────────────────────────────────────

  const meta = getRoomMeta(selected.topic);

  // Battle in progress overlay
  if (activeBattle && !activeBattle.done) {
    return <BattleOverlay battle={activeBattle} onAnswer={answerBattle} />;
  }

  // Battle results
  if (activeBattle?.done) {
    const pct = Math.round((activeBattle.score / activeBattle.questions.length) * 100);
    return (
      <div className="proto wall-embedded">
        <div className="wall" data-page="rooms">
          <main className="shell-solo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="post" style={{ textAlign: 'center', maxWidth: 420, padding: '40px 32px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>
                {pct >= 80 ? '🏆' : pct >= 60 ? '⚡' : '📚'}
              </div>
              <h2 className="font-display" style={{ fontSize: '1.8rem', marginBottom: 6 }}>
                {activeBattle.score}/{activeBattle.questions.length} Correct
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
                {pct >= 80 ? 'Excellent! You\'re crushing this topic.' : pct >= 60 ? 'Solid — review the ones you missed.' : 'Keep practising. Every attempt builds mastery.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="clay-cta" style={{ width: 'auto', padding: '12px 24px' }}
                  onClick={() => { setActiveBattle(null); startBattle(); }}>
                  Rematch ⚔️
                </button>
                <button className="clay-option" style={{ padding: '12px 24px' }}
                  onClick={() => setActiveBattle(null)}>
                  Back to room
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="proto wall-embedded">
      <div className="wall" data-page="rooms">
        <main className="shell-solo shell-rooms">

          {/* Room header */}
          <div className="room-head" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <button type="button" className="room-back" onClick={leaveRoom} aria-label="Back">
              <Icons.ChevronLeft className="w-[18px] h-[18px]" />
            </button>
            <span style={{ fontSize: 28 }}>{meta.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="font-display" style={{ fontSize: '1.2rem', margin: 0 }}>{selected.name}</h1>
                {meta.weight && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: meta.color + '22', color: meta.color, letterSpacing: '0.08em' }}>
                    {meta.part} · {meta.weight}
                  </span>
                )}
                <span className="live-chip">
                  <span className="room-dot on" />
                  {onlineCount} here now
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0, marginTop: 2 }}>{selected.description}</p>
            </div>
            {/* Online avatars */}
            <div style={{ display: 'flex', gap: -8, flexShrink: 0 }}>
              {onlineAvatars.slice(0, 4).map((m, i) => (
                <span key={m.user_id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i, position: 'relative' }}>
                  <Avatar name={m.display_name} url={m.avatar_url} size={28} />
                </span>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div className="feed-cats" role="tablist" style={{ marginBottom: 20 }}>
            {(['arena', 'battles', 'chat', 'board'] as const).map(t => (
              <button key={t} type="button" role="tab"
                className={`cat ${tab === t ? 'on' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'arena' ? '🔥 Arena' : t === 'battles' ? '⚔️ Battles' : t === 'chat' ? '💬 Chat' : '🏆 Board'}
              </button>
            ))}
          </div>

          {/* ── ARENA TAB ── */}
          {tab === 'arena' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Daily Challenge */}
              <div className="post" style={{ padding: '24px 24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                      Today's Challenge
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                      {selected.topic} · Refreshes daily
                    </p>
                  </div>
                </div>

                {!dailyQ ? (
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    No challenge question for this topic yet — check back soon.
                  </p>
                ) : (
                  <>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.55, marginBottom: 16 }}>
                      {dailyQ.stem}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(dailyQ.choices).map(([key, text]) => {
                        const isCorrect = key === dailyQ.correct_key;
                        const isPicked = key === pickedKey;
                        let bg = 'var(--card)';
                        let border = 'var(--line)';
                        let color = 'var(--ink)';
                        if (revealed) {
                          if (isCorrect) { bg = '#ecfdf5'; border = '#22c55e'; color = '#15803d'; }
                          else if (isPicked && !isCorrect) { bg = '#fff1f1'; border = '#ef4444'; color = '#b91c1c'; }
                        } else if (isPicked) {
                          bg = 'var(--accent-soft)'; border = 'var(--accent)'; color = 'var(--accent-deep)';
                        }
                        return (
                          <button key={key} type="button"
                            disabled={revealed}
                            onClick={() => { setPickedKey(key); setRevealed(true); }}
                            style={{ textAlign: 'left', padding: '11px 15px', borderRadius: 14, border: `1.5px solid ${border}`, background: bg, color, fontSize: '0.86rem', fontWeight: 600, transition: 'all 0.2s', cursor: revealed ? 'default' : 'pointer' }}>
                            <span style={{ fontWeight: 800, marginRight: 10 }}>{key}.</span>{text}
                          </button>
                        );
                      })}
                    </div>
                    {revealed && dailyQ.explanation && (
                      <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', margin: '0 0 4px' }}>📖 Explanation</p>
                        <p style={{ fontSize: '0.84rem', color: '#15803d', margin: 0, lineHeight: 1.55 }}>{dailyQ.explanation}</p>
                      </div>
                    )}
                    {!revealed && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
                        Pick an answer to reveal the explanation
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Quick chat preview */}
              <div className="post" style={{ padding: '20px 20px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
                    Room Chat
                  </p>
                  <button style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-deep)' }} onClick={() => setTab('chat')}>
                    See all →
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>No messages yet — start the conversation!</p>
                  ) : messages.slice(-3).map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Avatar name={m.author?.display_name || '?'} url={m.author?.avatar_url} size={24} />
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)' }}>{m.author?.display_name || 'Anonymous'} </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>{m.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Quick chat input */}
                <div className="comment-input" style={{ marginTop: 12 }}>
                  <input type="text" placeholder={userId ? 'Say something…' : 'Log in to chat…'}
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    disabled={!userId}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button type="button" className="comment-send" onClick={sendMessage} disabled={!userId || sendingMsg}>
                    <Icons.Send className="w-[15px] h-[15px]" />
                  </button>
                </div>
              </div>

              {/* Topic targets */}
              <div className="post" style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                  Key Areas in this Room
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.target_topics?.map(t => (
                    <span key={t} className="tag" style={{ background: meta.color + '18', color: meta.color, fontWeight: 700 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BATTLES TAB ── */}
          {tab === 'battles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Start battle CTA */}
              <div className="post" style={{ padding: '28px 24px', textAlign: 'center', background: `linear-gradient(145deg, ${meta.color}12, var(--card))` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚔️</div>
                <h2 className="font-display" style={{ fontSize: '1.3rem', marginBottom: 6 }}>Start a Battle</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginBottom: 20, maxWidth: 300, margin: '0 auto 20px' }}>
                  10 MCQs from {selected.topic}. 30 seconds per question. How fast can you go?
                </p>
                {userId ? (
                  <button className="clay-cta" style={{ width: 'auto', padding: '14px 32px', fontSize: '0.95rem' }} onClick={startBattle}>
                    Enter the Arena
                  </button>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Log in to start a battle</p>
                )}
              </div>

              {/* Active battles */}
              {battles.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                    Recent Battles
                  </p>
                  {battles.map(b => (
                    <div key={b.id} className="post" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, padding: '16px 20px' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.color + '20', fontSize: 20 }}>
                        ⚔️
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>{b.topic}</strong>
                        <p style={{ color: 'var(--muted)', fontSize: '0.76rem', margin: '2px 0 0' }}>
                          {b.question_count} questions · {b.participants?.length || 0} fighter{(b.participants?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999,
                        background: b.status === 'active' ? '#fef3c7' : '#f3f4f6',
                        color: b.status === 'active' ? '#b45309' : 'var(--muted)',
                        letterSpacing: '0.06em', textTransform: 'uppercase'
                      }}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {battles.length === 0 && (
                <div className="post" style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>No battles yet today. Start the first one!</p>
                </div>
              )}
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {tab === 'chat' && (
            <div className="post" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="room-dot on" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>
                    {onlineCount} online in this room
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ fontSize: '2rem', marginBottom: 8 }}>👋</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No messages yet. Be the first to say hello!</p>
                  </div>
                ) : messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Avatar name={m.author?.display_name || '?'} url={m.author?.avatar_url} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>{m.author?.display_name || 'Anonymous'}</strong>
                        <span style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ borderTop: '1px solid var(--line)', padding: '12px 16px' }}>
                {userId ? (
                  <div className="comment-input">
                    <input type="text" placeholder="Message the room…"
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
                    <button type="button" className="comment-send" onClick={sendMessage} disabled={sendingMsg}>
                      <Icons.Send className="w-[15px] h-[15px]" />
                    </button>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
                    Log in to join the conversation
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── BOARD TAB ── */}
          {tab === 'board' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="post" style={{ padding: '20px 20px 16px' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
                  This Week's Leaderboard
                </p>
                {leaders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ fontSize: '1.8rem', marginBottom: 8 }}>🏆</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>
                      No scores yet this week. Start a battle to get on the board!
                    </p>
                  </div>
                ) : leaders.map((l, i) => (
                  <div key={l.user_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < leaders.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.8rem', flex: 'none',
                      background: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : i === 2 ? '#fef9ec' : 'transparent',
                      color: i === 0 ? '#b45309' : i === 1 ? '#6b7280' : i === 2 ? '#a16207' : 'var(--muted)'
                    }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <Avatar name={l.display_name} url={l.avatar_url} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)', display: 'block' }}>{l.display_name}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{l.questions_solved} questions · {l.streak_days}d streak</span>
                    </div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--accent-deep)' }}>{l.total_score}</strong>
                  </div>
                ))}
              </div>
              <div className="post" style={{ padding: '16px 20px', background: `linear-gradient(145deg, ${meta.color}10, var(--card))` }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
                  Points reset every Monday. Complete battles and daily challenges to climb the board.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ROOM SECTION (list grouping)
// ─────────────────────────────────────────────

const RoomSection: React.FC<{ title: string; rooms: StudyRoom[]; onEnter: (r: StudyRoom) => void }> = ({ title, rooms, onEnter }) => {
  if (!rooms.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
        {title}
      </p>
      <div className="rooms-grid">
        {rooms.map(room => <RoomCard key={room.id} room={room} onEnter={onEnter} />)}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ROOM CARD
// ─────────────────────────────────────────────

const RoomCard: React.FC<{ room: StudyRoom; onEnter: (r: StudyRoom) => void }> = ({ room, onEnter }) => {
  const meta = getRoomMeta(room.topic);
  return (
    <button type="button" className="post room-card" onClick={() => onEnter(room)}
      style={{ textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: meta.color, borderRadius: '16px 16px 0 0' }} />

      <div className="room-card-top" style={{ marginTop: 8 }}>
        <span style={{ fontSize: 26 }}>{meta.emoji}</span>
        <div className="room-card-name">
          <strong>{room.name}</strong>
          {meta.weight && <span style={{ color: meta.color, fontWeight: 700 }}>{meta.part} · {meta.weight}</span>}
        </div>
        {room.is_live && (
          <span className="live-chip" style={{ flexShrink: 0 }}>
            <span className="room-dot on" />Live
          </span>
        )}
      </div>

      <p className="room-card-desc" style={{ margin: '10px 0 12px', lineHeight: 1.5 }}>{room.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {room.target_topics?.slice(0, 3).map(t => (
          <span key={t} style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: meta.color + '15', color: meta.color }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
          Enter Arena →
        </span>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────
// BATTLE OVERLAY
// ─────────────────────────────────────────────

const BattleOverlay: React.FC<{
  battle: { questions: MCQ[]; idx: number; score: number; picked: string | null; timeLeft: number };
  onAnswer: (key: string) => void;
}> = ({ battle, onAnswer }) => {
  const q = battle.questions[battle.idx];
  const progress = ((battle.idx) / battle.questions.length) * 100;
  const timeWarn = battle.timeLeft <= 10;

  return (
    <div className="proto wall-embedded">
      <div className="wall" data-page="rooms">
        <main className="shell-solo" style={{ maxWidth: 600, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--line)' }}>
              <div style={{ height: '100%', borderRadius: 999, background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {battle.idx + 1}/{battle.questions.length}
            </span>
            <span style={{
              fontWeight: 800, fontSize: '1.1rem', minWidth: 38, textAlign: 'center',
              color: timeWarn ? '#ef4444' : 'var(--ink)',
            }}>
              {battle.timeLeft}s
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-deep)', padding: '4px 12px', borderRadius: 999, background: 'var(--accent-soft)' }}>
              ⚡ {battle.score} pts
            </span>
          </div>

          <div className="post" style={{ marginBottom: 16, padding: '24px 22px' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
              Question {battle.idx + 1}
            </p>
            <p style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
              {q.stem}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(q.choices).map(([key, text]) => {
              const isCorrect = key === q.correct_key;
              const isPicked = key === battle.picked;
              let bg = 'var(--card)';
              let border = 'var(--line)';
              let color = 'var(--ink)';
              if (battle.picked) {
                if (isCorrect) { bg = '#ecfdf5'; border = '#22c55e'; color = '#15803d'; }
                else if (isPicked) { bg = '#fff1f1'; border = '#ef4444'; color = '#b91c1c'; }
              }
              return (
                <button key={key} type="button"
                  disabled={!!battle.picked}
                  onClick={() => onAnswer(key)}
                  style={{
                    textAlign: 'left', padding: '14px 18px', borderRadius: 16,
                    border: `2px solid ${border}`, background: bg, color,
                    fontSize: '0.88rem', fontWeight: 600,
                    transition: 'all 0.18s', cursor: battle.picked ? 'default' : 'pointer',
                  }}>
                  <span style={{ fontWeight: 800, marginRight: 12 }}>{key}.</span>{text}
                </button>
              );
            })}
          </div>

          {battle.picked && q.explanation && (
            <div style={{ marginTop: 14, padding: '14px 18px', borderRadius: 16, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>📖 Explanation</p>
              <p style={{ fontSize: '0.84rem', color: '#15803d', margin: 0, lineHeight: 1.55 }}>{q.explanation}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
