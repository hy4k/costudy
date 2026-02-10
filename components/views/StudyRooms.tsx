import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { StudyRoom, User } from '../../types';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { supabase } from '../../services/supabaseClient';

// ============================================
// TYPES
// ============================================

type RoomTab = 'Mission' | 'Focus' | 'Resources' | 'Discussion' | 'Quiz' | 'Calendar' | 'Mentors';

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
// MAIN COMPONENT
// ============================================

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userId }) => {
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
    const [activeTab, setActiveTab] = useState<RoomTab>('Mission');
    
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
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        // Load mock data for now - would be Supabase queries
        setMissions([
            {
                id: '1',
                title: 'Complete Part 1 Chapter 3',
                description: 'Finish all readings and practice MCQs for Cost Management chapter',
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                progress: 65,
                assignees: ['all'],
                status: 'active'
            },
            {
                id: '2',
                title: 'Weekly Mock Test',
                description: '50 MCQ timed practice test',
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                progress: 0,
                assignees: ['all'],
                status: 'active'
            }
        ]);

        setDiscussions([
            {
                id: '1',
                topic: 'Variance Analysis confusion',
                author: 'user1',
                author_name: 'Alex',
                content: 'Can someone explain the difference between price and efficiency variance? I keep mixing them up.',
                replies: [
                    { id: 'r1', author: 'user2', author_name: 'Sarah', content: 'Price variance = (Actual Price - Standard Price) × Actual Qty. Efficiency = (Actual Qty - Standard Qty) × Standard Price', created_at: new Date().toISOString() }
                ],
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                pinned: true
            }
        ]);

        setResources([
            { id: '1', title: 'Cost Management Cheat Sheet', type: 'note', content: 'Key formulas...', uploaded_by: 'user1', created_at: new Date().toISOString(), tags: ['formulas', 'cost'] },
            { id: '2', title: 'Variance Analysis Video', type: 'link', content: '', url: 'https://youtube.com/...', uploaded_by: 'user2', created_at: new Date().toISOString(), tags: ['video', 'variance'] }
        ]);

        setCalendarEvents([
            {
                id: '1',
                title: 'Group Study Session',
                description: 'Review Chapter 3 together',
                start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                end_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
                event_type: 'study',
                created_by: 'user1',
                attendees: ['all'],
                color: '#8dc63f'
            },
            {
                id: '2',
                title: 'Mock Test #4',
                description: '50 MCQs - Timed',
                start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
                event_type: 'mock_test',
                created_by: 'user1',
                attendees: ['all'],
                color: '#e74c3c'
            }
        ]);

        setMentors([
            {
                id: 'm1',
                name: 'Dr. Sarah Mitchell',
                avatar: 'https://i.pravatar.cc/150?u=mentor1',
                specialties: ['Cost Management', 'Variance Analysis'],
                hourly_rate: 45,
                rating: 4.9,
                sessions_completed: 127,
                available_slots: ['Mon 6PM', 'Wed 7PM', 'Sat 10AM'],
                bio: 'CMA certified with 10+ years teaching experience. Specialized in cost accounting and management.'
            },
            {
                id: 'm2',
                name: 'Prof. James Chen',
                avatar: 'https://i.pravatar.cc/150?u=mentor2',
                specialties: ['Financial Reporting', 'IFRS', 'US GAAP'],
                hourly_rate: 55,
                rating: 4.8,
                sessions_completed: 89,
                available_slots: ['Tue 5PM', 'Thu 6PM', 'Sun 11AM'],
                bio: 'Former Big 4 auditor, now full-time CMA instructor.'
            }
        ]);

        setOnlineMembers(['user1', 'user2', 'user3']);
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

    // ============================================
    // ROOM LIST VIEW
    // ============================================
    
    if (!selectedRoom) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500 rounded-xl">
                                <Icons.Users className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                CoStudy Cluster Hub
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                            Study Rooms
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl">
                            Join a study cluster. Set missions, sync focus sessions, share resources, and ace the CMA together.
                        </p>
                    </div>

                    {/* Room Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Icons.CloudSync className="w-12 h-12 text-slate-300 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rooms.map(room => (
                                <div 
                                    key={room.id}
                                    onClick={() => setSelectedRoom(room)}
                                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                                            {room.name.charAt(0)}
                                        </div>
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                            {room.memberCount || 0} online
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                                        {room.name}
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                        {room.description || 'A focused study group for CMA aspirants'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Icons.Target className="w-4 h-4" />
                                        <span>{room.activeSession || 'No active session'}</span>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Create Room Card */}
                            <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer min-h-[200px]">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mb-4">
                                    <Icons.Plus className="w-6 h-6 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">Create Room</h3>
                                <p className="text-sm text-slate-500">Start a new study cluster</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============================================
    // ROOM DETAIL VIEW
    // ============================================

    const tabs: { key: RoomTab; label: string; icon: React.ReactNode }[] = [
        { key: 'Mission', label: 'Missions', icon: <Icons.Target className="w-5 h-5" /> },
        { key: 'Focus', label: 'Focus Timer', icon: <Icons.Clock className="w-5 h-5" /> },
        { key: 'Resources', label: 'Resources', icon: <Icons.BookOpen className="w-5 h-5" /> },
        { key: 'Discussion', label: 'Discussion', icon: <Icons.MessageCircle className="w-5 h-5" /> },
        { key: 'Quiz', label: 'Quiz Arena', icon: <Icons.Zap className="w-5 h-5" /> },
        { key: 'Calendar', label: 'Calendar', icon: <Icons.Calendar className="w-5 h-5" /> },
        { key: 'Mentors', label: 'Hire Mentor', icon: <Icons.GraduationCap className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
                {/* Room Header */}
                <div className="p-6 border-b border-slate-200">
                    <button 
                        onClick={() => setSelectedRoom(null)}
                        className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" /> Back to Rooms
                    </button>
                    <h2 className="text-xl font-black text-slate-900">{selectedRoom.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">{onlineMembers.length} members online</p>
                </div>

                {/* Tab Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                                activeTab === tab.key 
                                    ? 'bg-purple-100 text-purple-700 font-bold' 
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Online Members */}
                <div className="p-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Online Now</p>
                    <div className="flex -space-x-2">
                        {onlineMembers.slice(0, 5).map((_, i) => (
                            <div 
                                key={i}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            >
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                        {onlineMembers.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-slate-600 text-xs font-bold">
                                +{onlineMembers.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {/* MISSIONS TAB */}
                {activeTab === 'Mission' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">Mission Board</h1>
                                <p className="text-slate-500">Track group goals and deadlines</p>
                            </div>
                            <button className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 flex items-center gap-2">
                                <Icons.Plus className="w-5 h-5" /> New Mission
                            </button>
                        </div>
                        
                        <div className="grid gap-6">
                            {missions.map(mission => (
                                <div key={mission.id} className="bg-white rounded-2xl p-6 border border-slate-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{mission.title}</h3>
                                            <p className="text-slate-500 mt-1">{mission.description}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            mission.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            mission.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {mission.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-500">Progress</span>
                                            <span className="font-bold text-slate-700">{mission.progress}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                                                style={{ width: `${mission.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Icons.Calendar className="w-4 h-4" />
                                            Due: {new Date(mission.deadline).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.Users className="w-4 h-4" />
                                            All members
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FOCUS TIMER TAB */}
                {activeTab === 'Focus' && (
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Focus Timer</h1>
                        <p className="text-slate-500 mb-12">Study together in sync. When one focuses, all focus.</p>
                        
                        {focusSession ? (
                            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl">
                                <div className="text-8xl font-mono font-black text-slate-900 mb-4">
                                    {formatTime(timerSeconds)}
                                </div>
                                <p className="text-slate-500 mb-8">
                                    {focusSession.status === 'active' ? '🔥 Focus Mode Active' : '☕ Break Time'}
                                </p>
                                <div className="flex justify-center gap-4 mb-8">
                                    {focusSession.participants.slice(0, 5).map((_, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-emerald-500 border-3 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                                            ✓
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={endFocusSession}
                                    className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600"
                                >
                                    End Session
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-12 border border-slate-200">
                                <p className="text-slate-500 mb-8">Choose a focus duration</p>
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {[25, 45, 60].map(mins => (
                                        <button
                                            key={mins}
                                            onClick={() => startFocusSession(mins)}
                                            className="p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 hover:border-purple-300 border-2 border-transparent transition-all"
                                        >
                                            <div className="text-4xl font-black text-slate-900">{mins}</div>
                                            <div className="text-sm text-slate-500">minutes</div>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-400">
                                    Starting a session notifies all online members
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* RESOURCES TAB */}
                {activeTab === 'Resources' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">Resource Vault</h1>
                                <p className="text-slate-500">Shared notes, links, and study materials</p>
                            </div>
                            <button className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 flex items-center gap-2">
                                <Icons.Plus className="w-5 h-5" /> Add Resource
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resources.map(resource => (
                                <div key={resource.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            resource.type === 'note' ? 'bg-blue-100 text-blue-600' :
                                            resource.type === 'link' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-purple-100 text-purple-600'
                                        }`}>
                                            {resource.type === 'note' ? <Icons.FileText className="w-5 h-5" /> :
                                             resource.type === 'link' ? <Icons.Link className="w-5 h-5" /> :
                                             <Icons.BookOpen className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900">{resource.title}</h3>
                                            <div className="flex gap-2 mt-2">
                                                {resource.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DISCUSSION TAB */}
                {activeTab === 'Discussion' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">Discussion</h1>
                                <p className="text-slate-500">Ask questions, share insights</p>
                            </div>
                            <button className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 flex items-center gap-2">
                                <Icons.Plus className="w-5 h-5" /> New Topic
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {discussions.map(discussion => (
                                <div key={discussion.id} className="bg-white rounded-xl p-6 border border-slate-200">
                                    {discussion.pinned && (
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2 inline-block">
                                            📌 Pinned
                                        </span>
                                    )}
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{discussion.topic}</h3>
                                    <p className="text-slate-600 mb-4">{discussion.content}</p>
                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                        <span>by {discussion.author_name}</span>
                                        <span>•</span>
                                        <span>{new Date(discussion.created_at).toLocaleString()}</span>
                                    </div>
                                    
                                    {discussion.replies.length > 0 && (
                                        <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                                            {discussion.replies.map(reply => (
                                                <div key={reply.id} className="bg-slate-50 rounded-lg p-4">
                                                    <p className="text-slate-700">{reply.content}</p>
                                                    <p className="text-xs text-slate-400 mt-2">— {reply.author_name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="mt-4 flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Write a reply..."
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                                        />
                                        <button className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold text-sm hover:bg-purple-600">
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* QUIZ ARENA TAB */}
                {activeTab === 'Quiz' && (
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Quiz Arena</h1>
                        <p className="text-slate-500 mb-12">Challenge your roommates to MCQ battles</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 text-white text-left">
                                <div className="text-4xl mb-4">⚔️</div>
                                <h3 className="text-xl font-bold mb-2">Quick Duel</h3>
                                <p className="text-purple-100 mb-6">10 MCQs, 1v1 battle, fastest wins</p>
                                <button className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50">
                                    Start Duel
                                </button>
                            </div>
                            
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white text-left">
                                <div className="text-4xl mb-4">🏆</div>
                                <h3 className="text-xl font-bold mb-2">Room Battle</h3>
                                <p className="text-amber-100 mb-6">25 MCQs, all members compete</p>
                                <button className="w-full py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-amber-50">
                                    Start Battle
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4">🏅 Room Leaderboard</h3>
                            <div className="space-y-3">
                                {['Alex', 'Sarah', 'Mike'].map((name, i) => (
                                    <div key={name} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                        <span className="text-2xl font-black text-slate-300">#{i + 1}</span>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                            {name.charAt(0)}
                                        </div>
                                        <span className="flex-1 text-left font-bold text-slate-700">{name}</span>
                                        <span className="font-mono font-bold text-slate-900">{1250 - i * 50} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CALENDAR TAB */}
                {activeTab === 'Calendar' && (
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">Group Calendar</h1>
                                <p className="text-slate-500">Schedule study sessions and deadlines</p>
                            </div>
                            <button className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 flex items-center gap-2">
                                <Icons.Plus className="w-5 h-5" /> Add Event
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {/* Calendar Header */}
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                <button className="p-2 hover:bg-slate-200 rounded-lg">
                                    <Icons.ChevronLeft className="w-5 h-5" />
                                </button>
                                <h3 className="font-bold text-slate-900">February 2026</h3>
                                <button className="p-2 hover:bg-slate-200 rounded-lg">
                                    <Icons.ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {/* Upcoming Events */}
                            <div className="p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Upcoming Events</h4>
                                <div className="space-y-4">
                                    {calendarEvents.map(event => (
                                        <div key={event.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                                            <div 
                                                className="w-1 rounded-full"
                                                style={{ backgroundColor: event.color }}
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900">{event.title}</h4>
                                                <p className="text-sm text-slate-500">{event.description}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Calendar className="w-3 h-3" />
                                                        {new Date(event.start_time).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Clock className="w-3 h-3" />
                                                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 h-fit rounded-full text-xs font-bold ${
                                                event.event_type === 'study' ? 'bg-emerald-100 text-emerald-700' :
                                                event.event_type === 'mock_test' ? 'bg-red-100 text-red-700' :
                                                event.event_type === 'mentor_session' ? 'bg-purple-100 text-purple-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {event.event_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MENTORS TAB */}
                {activeTab === 'Mentors' && (
                    <div>
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-slate-900">Hire a Mentor</h1>
                            <p className="text-slate-500">Book expert CMA instructors for your group</p>
                        </div>
                        
                        <div className="grid gap-6">
                            {mentors.map(mentor => (
                                <div key={mentor.id} className="bg-white rounded-2xl p-6 border border-slate-200 flex gap-6">
                                    <img 
                                        src={mentor.avatar} 
                                        alt={mentor.name}
                                        className="w-24 h-24 rounded-2xl object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">{mentor.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-amber-500">★</span>
                                                    <span className="font-bold text-slate-700">{mentor.rating}</span>
                                                    <span className="text-slate-400">• {mentor.sessions_completed} sessions</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-slate-900">${mentor.hourly_rate}</div>
                                                <div className="text-xs text-slate-400">per hour</div>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 mt-3">{mentor.bio}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {mentor.specialties.map(spec => (
                                                <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                            <div className="text-sm text-slate-500">
                                                <span className="font-bold">Available:</span> {mentor.available_slots.join(', ')}
                                            </div>
                                            <button className="px-6 py-2 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600">
                                                Book Session
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
