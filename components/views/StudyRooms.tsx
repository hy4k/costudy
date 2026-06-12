import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { StudyRoom, User } from '../../types';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';

// ============================================
// TYPES
// ============================================

type RoomTab = 'Missions' | 'Focus' | 'Resources' | 'Discussion' | 'Quiz' | 'Calendar' | 'Mentors';

interface Mission {
    id: string;
    title: string;
    description: string;
    deadline: string;
    progress: number;
    assignees: string[];
    status: 'active' | 'completed' | 'overdue';
}

interface FocusSession {
    id: string;
    type: 'pomodoro' | 'custom';
    duration: number; // minutes
    break_duration: number;
    started_by: string;
    participants: string[];
    started_at: string;
    status: 'active' | 'break' | 'completed';
}

interface Discussion {
    id: string;
    topic: string;
    author: string;
    author_name: string;
    content: string;
    replies: DiscussionReply[];
    created_at: string;
    pinned: boolean;
}

interface DiscussionReply {
    id: string;
    author: string;
    author_name: string;
    content: string;
    created_at: string;
}

interface Resource {
    id: string;
    title: string;
    type: 'note' | 'link' | 'file' | 'flashcard';
    content: string;
    url?: string;
    uploaded_by: string;
    created_at: string;
    tags: string[];
}

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    event_type: 'study' | 'review' | 'mock_test' | 'mentor_session' | 'deadline';
    created_by: string;
    attendees: string[];
    color: string;
}

interface Mentor {
    id: string;
    name: string;
    avatar: string;
    specialties: string[];
    hourly_rate: number;
    rating: number;
    sessions_completed: number;
    available_slots: string[];
    bio: string;
}

interface StudyRoomsProps {
    userId?: string;
}

// ============================================
// HELPERS
// ============================================

/** Deterministic pastel tile from the room name (redesign RoomTile) */
const TILE_PAIRS: [string, string][] = [
    ['#fff1f1', '#b91c1c'], ['#fff7ed', '#9a3412'], ['#ecfdf5', '#047857'],
    ['#eef2ff', '#4338ca'], ['#fdf2f8', '#be185d'], ['#f0f9ff', '#0369a1'],
];

const RoomTile: React.FC<{ name: string; size?: number; round?: boolean }> = ({ name, size = 46, round }) => {
    const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const pair = TILE_PAIRS[h % TILE_PAIRS.length];
    const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return (
        <span
            className="room-tile"
            style={{
                width: size, height: size, background: pair[0], color: pair[1],
                borderRadius: round ? '50%' : Math.round(size * 0.3), fontSize: Math.round(size * 0.33),
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, flex: 'none',
            }}
        >
            {initials}
        </span>
    );
};

const eyebrow: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
};

// ============================================
// MAIN COMPONENT
// ============================================

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userId }) => {
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
    const [activeTab, setActiveTab] = useState<RoomTab>('Missions');

    // Online presence
    const [onlineMembers, setOnlineMembers] = useState<string[]>([]);

    // Feature states
    const [missions, setMissions] = useState<Mission[]>([]);
    const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);

    // Timer state
    const [timerSeconds, setTimerSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [roomData, userData] = await Promise.all([
                costudyService.getRooms(),
                userId ? getUserProfile(userId) : Promise.resolve(null)
            ]);
            setRooms(roomData);
            setCurrentUser(userData);
            setLoading(false);
        };
        load();
    }, [userId]);

    // Load room data when selected
    useEffect(() => {
        if (selectedRoom) {
            loadRoomData(selectedRoom.id);
        }
    }, [selectedRoom]);

    // Timer effect
    useEffect(() => {
        if (focusSession?.status === 'active') {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [focusSession?.status]);

    const loadRoomData = async (roomId: string) => {
        setMissions([]);
        setDiscussions([]);
        setResources([]);
        setCalendarEvents([]);
        setMentors([]);
        setOnlineMembers([]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startFocusSession = (duration: number) => {
        setFocusSession({
            id: Date.now().toString(),
            type: 'pomodoro',
            duration: duration,
            break_duration: 5,
            started_by: userId || 'anon',
            participants: [userId || 'anon'],
            started_at: new Date().toISOString(),
            status: 'active'
        });
        setTimerSeconds(0);
    };

    const endFocusSession = () => {
        setFocusSession(null);
        setTimerSeconds(0);
    };

    // Focus ring geometry (redesign FocusTimer)
    const RING_DASH = 327;
    const focusTotal = (focusSession?.duration || 25) * 60;
    const focusRemaining = Math.max(0, focusTotal - timerSeconds);
    const focusFrac = focusSession ? focusRemaining / focusTotal : 1;

    const emptyState = (icon: React.ReactNode, title: string, hint: string) => (
        <div className="post" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ margin: '0 auto 12px', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', boxShadow: 'var(--nm-xs)' }}>
                {icon}
            </div>
            <strong className="font-display" style={{ display: 'block', color: 'var(--ink)', fontSize: '1.05rem' }}>{title}</strong>
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', marginTop: 6 }}>{hint}</p>
        </div>
    );

    // ============================================
    // ROOM LIST VIEW (browse grid)
    // ============================================

    if (!selectedRoom) {
        return (
            <div className="proto wall-embedded">
                <div className="wall" data-page="rooms">
                    <main className="shell-solo shell-rooms">
                        <div className="feed-hello rooms-hello">
                            <div>
                                <h1 className="font-display">Study Rooms</h1>
                                <p>Join a room across timezones — missions, synced focus, shared resources.</p>
                            </div>
                            <button type="button" className="rooms-create">
                                <Icons.Plus className="w-[15px] h-[15px]" /> Create room
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        ) : rooms.length === 0 ? (
                            emptyState(<Icons.Users className="w-5 h-5" />, 'No rooms yet', 'Create the first study room and invite your cohort.')
                        ) : (
                            <div className="rooms-grid">
                                {rooms.map(room => (
                                    <button key={room.id} type="button" className="post room-card" onClick={() => setSelectedRoom(room)}>
                                        <div className="room-card-top">
                                            <RoomTile name={room.name} size={46} />
                                            <div className="room-card-name">
                                                <strong>{room.name}</strong>
                                                <span>{(room as any).timezone || 'Open to all timezones'}</span>
                                            </div>
                                            {(room.memberCount || 0) > 0 && (
                                                <span className="live-chip"><span className="room-dot on"></span>{room.memberCount} in</span>
                                            )}
                                        </div>
                                        <p className="room-card-desc">{room.description || 'A focused study group for CMA aspirants.'}</p>
                                        <div className="room-card-foot">
                                            <span className={`room-focus ${room.activeSession ? 'on' : ''}`}>
                                                {room.activeSession || 'No active session'}
                                            </span>
                                            <span className="room-card-people">
                                                <span className="room-members">{room.memberCount || 0}</span>
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    // ============================================
    // ROOM DETAIL VIEW
    // ============================================

    const tabs: RoomTab[] = ['Missions', 'Focus', 'Resources', 'Discussion', 'Quiz', 'Calendar', 'Mentors'];

    return (
        <div className="proto wall-embedded">
            <div className="wall" data-page="rooms">
                <main className="shell-solo shell-rooms">
                    {/* Room header */}
                    <div className="room-head">
                        <button type="button" className="room-back" onClick={() => setSelectedRoom(null)} aria-label="Back to rooms">
                            <Icons.ChevronLeft className="w-[18px] h-[18px]" />
                        </button>
                        <RoomTile name={selectedRoom.name} size={48} />
                        <div className="room-head-info">
                            <div className="room-head-row">
                                <h1 className="font-display">{selectedRoom.name}</h1>
                                {(selectedRoom.memberCount || 0) > 0 && (
                                    <span className="live-chip"><span className="room-dot on"></span>Live</span>
                                )}
                            </div>
                            <p>{(selectedRoom as any).timezone || 'Open room'} · {selectedRoom.memberCount || onlineMembers.length || 0} members</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="feed-cats" role="tablist">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === t}
                                className={`cat ${activeTab === t ? 'on' : ''}`}
                                onClick={() => setActiveTab(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* MISSIONS */}
                    {activeTab === 'Missions' && (
                        <div className="missions">
                            {missions.length === 0
                                ? emptyState(<Icons.Target className="w-5 h-5" />, 'No missions yet', 'Create a mission to track group goals together.')
                                : missions.map(mission => (
                                    <div key={mission.id} className="post mission-card">
                                        <div className="mission-card-top">
                                            <div>
                                                <h3>{mission.title}</h3>
                                                <p>{mission.description}</p>
                                            </div>
                                            <span className={`status-chip ${mission.status === 'overdue' ? 'status-bad' : ''}`}>
                                                {mission.status === 'overdue' ? 'Overdue' : mission.status === 'completed' ? 'Done' : 'On track'}
                                            </span>
                                        </div>
                                        <div className="mission-row">
                                            <span>Progress</span>
                                            <strong>{mission.progress}%</strong>
                                        </div>
                                        <div className="mission-bar"><i style={{ width: `${mission.progress}%` }}></i></div>
                                        <div className="mission-card-foot">
                                            <span className="mission-due">
                                                <Icons.Clock className="w-[13px] h-[13px]" /> Due {new Date(mission.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            <button type="button" className="feed-prompt mission-new">
                                <span className="feed-prompt-ic"><Icons.Plus className="w-4 h-4" /></span>
                                <span>New mission for the room…</span>
                            </button>
                        </div>
                    )}

                    {/* FOCUS */}
                    {activeTab === 'Focus' && (
                        <div className="post focus-card">
                            <div className="focus-wrap">
                                <p className="focus-tag">Study together in sync — when one focuses, all focus.</p>
                                <div className="focus-ring-wrap">
                                    <svg className="focus-ring" viewBox="0 0 120 120">
                                        <circle className="focus-ring-bg" cx="60" cy="60" r="52"></circle>
                                        <circle
                                            className="focus-ring-fg" cx="60" cy="60" r="52"
                                            style={{ strokeDasharray: RING_DASH, strokeDashoffset: RING_DASH * (1 - focusFrac) }}
                                        ></circle>
                                    </svg>
                                    <div className="focus-ring-label">
                                        <strong className="font-display">{formatTime(focusSession ? focusRemaining : focusTotal)}</strong>
                                        <span>{focusSession ? 'focus' : 'ready'}</span>
                                    </div>
                                </div>

                                {!focusSession ? (
                                    <>
                                        <div className="focus-presets">
                                            {[25, 45, 60].map((m) => (
                                                <button key={m} type="button" className="seg" onClick={() => startFocusSession(m)}>
                                                    {m} min
                                                </button>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 10 }}>
                                            Starting a session notifies all online members
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="focus-people">
                                            <span>{focusSession.participants.length} in this session</span>
                                        </div>
                                        <button type="button" className="focus-end" onClick={endFocusSession}>End session</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RESOURCES */}
                    {activeTab === 'Resources' && (
                        <div className="missions">
                            {resources.length === 0
                                ? emptyState(<Icons.BookOpen className="w-5 h-5" />, 'No resources yet', 'Add the first resource to share with your room.')
                                : resources.map(resource => (
                                    <div key={resource.id} className="post res-row">
                                        <span className="res-ic">
                                            {resource.type === 'note' ? <Icons.FileText className="w-[19px] h-[19px]" /> :
                                             resource.type === 'link' ? <Icons.Link className="w-[19px] h-[19px]" /> :
                                             <Icons.BookOpen className="w-[19px] h-[19px]" />}
                                        </span>
                                        <div className="res-info">
                                            <strong>{resource.title}</strong>
                                            <span>shared by {resource.uploaded_by}</span>
                                        </div>
                                        {resource.tags.length > 0 && <span className="res-meta">{resource.tags[0]}</span>}
                                    </div>
                                ))}
                            <button type="button" className="feed-prompt mission-new">
                                <span className="feed-prompt-ic"><Icons.Plus className="w-4 h-4" /></span>
                                <span>Add a resource…</span>
                            </button>
                        </div>
                    )}

                    {/* DISCUSSION */}
                    {activeTab === 'Discussion' && (
                        <div className="post">
                            <div className="discuss room-discuss">
                                {discussions.length === 0 && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '6px 0' }}>
                                        No messages yet — say hello to the room.
                                    </p>
                                )}
                                {discussions.map((d) => (
                                    <div key={d.id} className="comment">
                                        <div style={{ width: 30, height: 30, borderRadius: 10, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 12 }}>
                                            {(d.author_name || 'A').charAt(0)}
                                        </div>
                                        <div className="comment-body">
                                            <div className="comment-head">
                                                <strong>{d.author_name}</strong>
                                                <span className="comment-time">{new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p>{d.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="comment-input">
                                    <input type="text" placeholder="Message the room…" />
                                    <button type="button" className="comment-send" aria-label="Send">
                                        <Icons.Send className="w-[15px] h-[15px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QUIZ ARENA */}
                    {activeTab === 'Quiz' && (
                        <div className="missions">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                                <div className="post mission-card">
                                    <h3 className="font-display" style={{ color: 'var(--ink)' }}>⚔️ Quick Duel</h3>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: '6px 0 14px' }}>10 MCQs, 1v1 battle, fastest wins.</p>
                                    <button type="button" className="clay-cta">Start duel</button>
                                </div>
                                <div className="post mission-card">
                                    <h3 className="font-display" style={{ color: 'var(--ink)' }}>🏆 Room Battle</h3>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: '6px 0 14px' }}>25 MCQs, all members compete.</p>
                                    <button type="button" className="clay-cta">Start battle</button>
                                </div>
                            </div>
                            <div className="post" style={{ marginTop: 16 }}>
                                <p style={eyebrow}>Room leaderboard</p>
                                <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>No scores yet — start a quiz to see rankings.</p>
                            </div>
                        </div>
                    )}

                    {/* CALENDAR */}
                    {activeTab === 'Calendar' && (
                        <div className="missions">
                            <div className="post">
                                <p style={eyebrow}>
                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Upcoming events
                                </p>
                                {calendarEvents.length === 0 ? (
                                    <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
                                        No events scheduled — add one to coordinate with your room.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {calendarEvents.map(event => (
                                            <div key={event.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--inset-bg)', boxShadow: 'var(--nm-inset-sm)' }}>
                                                <div style={{ width: 4, borderRadius: 4, background: event.color || 'var(--accent)' }} />
                                                <div style={{ flex: 1 }}>
                                                    <strong style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>{event.title}</strong>
                                                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{event.description}</p>
                                                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: 4 }}>
                                                        {new Date(event.start_time).toLocaleDateString()} · {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <span className="status-chip">{event.event_type.replace('_', ' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" className="feed-prompt mission-new">
                                <span className="feed-prompt-ic"><Icons.Plus className="w-4 h-4" /></span>
                                <span>Add an event…</span>
                            </button>
                        </div>
                    )}

                    {/* MENTORS */}
                    {activeTab === 'Mentors' && (
                        <div className="missions">
                            {mentors.length === 0
                                ? emptyState(<Icons.GraduationCap className="w-5 h-5" />, 'No mentors available', 'Mentors will appear here once assigned to this room.')
                                : mentors.map(mentor => (
                                    <div key={mentor.id} className="post mentor-card" style={{ display: 'flex', gap: 16 }}>
                                        <img src={mentor.avatar} alt={mentor.name} style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', boxShadow: 'var(--nm-xs)' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                                <div>
                                                    <strong className="font-display" style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{mentor.name}</strong>
                                                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>★ {mentor.rating} · {mentor.sessions_completed} sessions</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <strong style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>${mentor.hourly_rate}</strong>
                                                    <p style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>per hour</p>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: '8px 0' }}>{mentor.bio}</p>
                                            <div className="post-tags" style={{ marginBottom: 10 }}>
                                                {mentor.specialties.map(spec => <span key={spec} className="tag">{spec}</span>)}
                                            </div>
                                            <button type="button" className="clay-cta" style={{ width: 'auto', padding: '10px 22px' }}>
                                                Book session
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
