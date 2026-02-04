
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { ManagedStudent, Broadcast, User, StudyRoom, BountyDetails } from '../../types';
import { costudyService } from '../../services/costudyService';
import { TeachersDeck } from './TeachersDeck';
import { supabase } from '../../services/supabaseClient';
import { getUserProfile } from '../../services/fetsService';

interface MentorDashboardProps {
    defaultTab?: 'IMPACT' | 'BROADCAST' | 'CLASSROOMS' | 'REVENUE' | 'BOUNTIES' | 'TEACHERS_DECK';
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ defaultTab = 'IMPACT' }) => {
    const [students, setStudents] = useState<ManagedStudent[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [myRooms, setMyRooms] = useState<StudyRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'IMPACT' | 'BROADCAST' | 'CLASSROOMS' | 'REVENUE' | 'BOUNTIES' | 'TEACHERS_DECK'>(defaultTab);
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);

    // Detail View State
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Broadcast Form
    const [bTitle, setBTitle] = useState('');
    const [bContent, setBContent] = useState('');
    const [bType, setBType] = useState<'GENERAL' | 'URGENT' | 'RESOURCE'>('GENERAL');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Bounty Form State
    const [bountyTask, setBountyTask] = useState('');
    const [bountyReward, setBountyReward] = useState(500);
    const [bountyType, setBountyType] = useState<'CREDITS' | 'BADGE'>('CREDITS');
    const [bounties, setBounties] = useState<any[]>([]); // Mock list

    // "Subdomain" Simulation State
    const [isRedirecting, setIsRedirecting] = useState(true);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);

                // Fetch full profile to get slug
                const profile = await getUserProfile(session.user.id);
                setUserProfile(profile);

                const [studentData, broadcastData, roomData] = await Promise.all([
                    costudyService.getManagedStudents(session.user.id),
                    costudyService.getBroadcasts(session.user.id),
                    costudyService.getRooms() // Ideally filtered by teacher_id in real app
                ]);
                setStudents(studentData);
                setBroadcasts(broadcastData);
                setMyRooms(roomData); // For demo, using all rooms as managed rooms
            }

            // Artificial delay to simulate subdomain redirect
            setTimeout(() => {
                setIsRedirecting(false);
                setLoading(false);
            }, 3000);
        };
        init();
    }, []);

    const handleStudentClick = async (studentId: string) => {
        setIsLoadingDetail(true);
        const detail = await costudyService.getStudentDeepDive(studentId);
        if (detail) {
            setSelectedStudent(detail);
        } else {
            // Fallback mock if data missing
            setSelectedStudent({
                id: studentId,
                name: 'Student Details',
                handle: 'student_view',
                avatar: 'https://i.pravatar.cc/150',
                role: 'STUDENT',
                level: 'LEARNER',
                performance: [],
                reputation: { studyScore: { total: 0 } } as any,
                costudyStatus: { subscription: 'Basic' } as any,
                learningWith: 0,
                learningFrom: 0,
                learningStyle: 'Visual',
                timezone: 'UTC',
                availableHours: 'Evening'
            } as User);
        }
        setIsLoadingDetail(false);
    };

    const handleBroadcast = async () => {
        if (!bTitle || !bContent || !user) return;
        setIsBroadcasting(true);
        try {
            const newB = await costudyService.createBroadcast(user.id, bTitle, bContent, bType);
            setBroadcasts(prev => [newB, ...prev]);
            setBTitle('');
            setBContent('');
            setActiveTab('IMPACT');
            alert("Announcement posted.");
        } catch (e) {
            console.error("Broadcast failed", e);
            alert("Posting failed. Please check connection.");
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleCreateBounty = () => {
        if (!bountyTask) return;
        const newBounty = {
            id: `b-${Date.now()}`,
            task: bountyTask,
            reward: bountyReward,
            type: bountyType,
            status: 'OPEN',
            created_at: new Date().toISOString()
        };
        setBounties(prev => [newBounty, ...prev]);
        setBountyTask('');
        alert("Bounty Posted to Student Wall.");
    };

    // --- SUBDOMAIN REDIRECT SIMULATION ---
    if (isRedirecting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-8 bg-slate-950 text-emerald-500 z-30 fixed inset-0">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse"></div>
                    <Icons.CheckBadge className="w-24 h-24 animate-bounce relative z-10" />
                </div>
                <div className="text-center space-y-4 relative z-10">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Verification Passed</h2>
                    <div className="flex flex-col items-center gap-2">
                        <span className="font-mono text-xs text-emerald-500">Establishing Secure Channel...</span>
                        {userProfile?.specialistSlug ? (
                            <span className="font-mono text-sm text-white font-bold bg-white/10 px-4 py-2 rounded-lg animate-in slide-in-from-bottom-4">
                                Redirecting to: <span className="text-emerald-400">https://{userProfile.specialistSlug}.costudy.cloud</span>
                            </span>
                        ) : (
                            <span className="font-mono text-xs text-slate-500">Redirecting to Dashboard...</span>
                        )}
                    </div>
                    <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-emerald-500 animate-[progress_3s_ease-in-out_infinite]"></div>
                    </div>
                </div>
                <style>{`
                    @keyframes progress { 0% { width: 0%; transform: translateX(-100%); } 100% { width: 100%; transform: translateX(100%); } }
                `}</style>
            </div>
        );
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen gap-8 opacity-40">
            <Icons.Sparkles className="w-16 h-16 animate-spin text-brand" />
            <span className="font-black uppercase tracking-[0.4em] text-sm text-slate-900">Loading Dashboard...</span>
        </div>
    );

    // --- RENDER STUDENT DETAIL VIEW ---
    if (selectedStudent) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 animate-in fade-in zoom-in-95 duration-500 specialist-mode">
                <button
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center gap-3 text-slate-400 hover:text-brand font-black uppercase tracking-widest text-xs mb-10 transition-colors"
                >
                    <Icons.Plus className="w-4 h-4 rotate-45" /> Back to Student List
                </button>

                <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden relative">
                    {/* Header */}
                    <div className="bg-slate-50/50 p-12 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-8">
                        <img src={selectedStudent.avatar} className="w-32 h-32 rounded-[2.5rem] shadow-xl ring-4 ring-white object-cover" />
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{selectedStudent.name}</h2>
                                <span className="bg-brand/5 text-brand px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand/10">Enrolled Student</span>
                            </div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">@{selectedStudent.handle} • {selectedStudent.examFocus} Track</div>
                            <div className="flex gap-4">
                                <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-lg flex items-center gap-2">
                                    <Icons.MessageCircle className="w-4 h-4" /> Message
                                </button>
                                <button className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all shadow-sm">
                                    Assign Task
                                </button>
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Learning Style</div>
                            <div className="text-3xl font-black text-brand">{selectedStudent.learningStyle}</div>
                        </div>
                    </div>

                    <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Performance Stats */}
                        <div className="lg:col-span-2 space-y-12">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Performance</h3>
                                {selectedStudent.performance && selectedStudent.performance.length > 0 ? (
                                    <div className="space-y-6">
                                        {selectedStudent.performance.map((p, i) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{p.topic}</span>
                                                    <span className="text-xs font-black text-brand">{p.score}%</span>
                                                </div>
                                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand rounded-full" style={{ width: `${p.score}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No diagnostic data available yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Streak</div>
                                    <div className="text-2xl font-black text-slate-900">{selectedStudent.reputation?.consistencyScore?.streak || 0} Days</div>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Goal</div>
                                    <div className="text-sm font-bold text-slate-900 leading-tight">"{selectedStudent.strategicMilestone || 'Not Set'}"</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Notes */}
                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Icons.ClipboardList className="w-32 h-32 text-brand" /></div>
                            <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-8 relative z-10">Notes</h3>

                            <div className="space-y-6 relative z-10">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">2 Hours Ago</div>
                                    <p className="text-sm font-medium leading-snug">Completed "Internal Controls" Mock Test. Score: 72%.</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Yesterday</div>
                                    <p className="text-sm font-medium leading-snug">Joined "Part 1 Strategy" Group.</p>
                                </div>
                            </div>

                            <button className="w-full mt-8 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all relative z-10">
                                Add Note
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 animate-in fade-in duration-700 specialist-mode">
            <header className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-brand/5 text-brand rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand/10">
                                {userProfile?.specialistSlug ? `https://${userProfile.specialistSlug}.costudy.cloud` : 'Teacher Dashboard'}
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Online</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8] mb-2">
                            DASHBOARD
                        </h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.4em] italic">Manage Students & Revenue</p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setActiveTab('REVENUE')} className="px-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-slate-900 font-black text-[10px] uppercase tracking-widest hover:border-brand transition-all flex items-center gap-3 shadow-sm">
                            <Icons.DollarSign className="w-4 h-4 text-brand" /> ₹{user?.user_metadata?.wallet || '12,400'}
                        </button>
                        <button onClick={() => setActiveTab('BROADCAST')} className="px-8 py-5 bg-brand text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/30 active:scale-95 transition-all flex items-center gap-3">
                            <Icons.Sparkles className="w-4 h-4" /> Create Announcement
                        </button>
                        <button onClick={() => setActiveTab('TEACHERS_DECK')} className="px-8 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3">
                            <Icons.Sparkles className="w-4 h-4 text-emerald-300" /> Launch Teachers Deck
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex gap-10 border-b border-slate-100 mb-12 overflow-x-auto no-scrollbar">
                {(['IMPACT', 'BROADCAST', 'CLASSROOMS', 'BOUNTIES', 'REVENUE', 'TEACHERS_DECK'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-5 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-brand' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab === 'TEACHERS_DECK' ? 'TEACHERS DECK' : tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-full"></div>}
                    </button>
                ))}
            </div>

            {activeTab === 'IMPACT' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* High-Level Stats */}
                    {[
                        { label: 'Active Students', value: students.length, color: 'text-brand' },
                        { label: 'Group Avg', value: '78%', color: 'text-emerald-500' },
                        { label: 'Interventions', value: '3', color: 'text-rose-500' },
                        { label: 'Rating', value: '4.9', color: 'text-amber-500' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</div>
                            <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
                        </div>
                    ))}

                    {/* Impact Registry Table */}
                    <div className="lg:col-span-4 bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden mt-4">
                        <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Student List</h3>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Synchronized with AI Data</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50/20">
                                        <th className="px-10 py-6">STUDENT</th>
                                        <th className="px-10 py-6">FOCUS</th>
                                        <th className="px-10 py-6">STATUS</th>
                                        <th className="px-10 py-6">MASTERY</th>
                                        <th className="px-10 py-6">DETAILS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {students.map(s => (
                                        <tr
                                            key={s.id}
                                            onClick={() => !isLoadingDetail && handleStudentClick(s.id)}
                                            className="group hover:bg-brand/5 transition-all cursor-pointer"
                                        >
                                            <td className="px-10 py-6 flex items-center gap-4">
                                                <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">@{s.handle}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{s.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-[11px] font-black text-slate-500 uppercase tracking-tight">{s.focus}</td>
                                            <td className="px-10 py-6">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${s.status === 'Struggling' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{s.status}</span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3 w-32">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${s.performanceScore > 75 ? 'bg-brand' : 'bg-amber-400'}`} style={{ width: `${s.performanceScore}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black">{s.performanceScore}%</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                {isLoadingDetail && selectedStudent?.id === s.id ? (
                                                    <Icons.CloudSync className="w-5 h-5 animate-spin text-brand" />
                                                ) : (
                                                    <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-brand transition-all active:scale-90 shadow-sm group-hover:shadow-lg">
                                                        <Icons.Search className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-12 text-center text-slate-400 text-sm font-medium italic">
                                                No students currently enrolled.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BROADCAST' && (
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100">
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">New Announcement</h3>
                        <p className="text-slate-500 font-medium italic text-lg mb-10">Post an update to your students.</p>

                        <div className="space-y-8">
                            <input
                                value={bTitle}
                                onChange={(e) => setBTitle(e.target.value)}
                                placeholder="Announcement Title"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-xl font-black outline-none focus:border-brand transition-all"
                            />
                            <textarea
                                value={bContent}
                                onChange={(e) => setBContent(e.target.value)}
                                placeholder="Content..."
                                className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-lg font-medium outline-none focus:border-brand transition-all resize-none"
                            />
                            <div className="flex gap-4">
                                {(['GENERAL', 'URGENT', 'RESOURCE'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setBType(type)}
                                        className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${bType === type ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-200'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleBroadcast}
                                disabled={isBroadcasting || !bTitle || !bContent}
                                className="w-full py-8 bg-brand text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {isBroadcasting ? 'POSTING...' : 'POST ANNOUNCEMENT'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl">
                        <h4 className="text-[10px] font-black text-brand uppercase tracking-[0.5em] mb-8">ANNOUNCEMENT HISTORY</h4>
                        <div className="space-y-6">
                            {broadcasts.map(b => (
                                <div key={b.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="px-3 py-1 bg-brand rounded-lg text-[8px] font-black uppercase text-white">{b.type}</span>
                                        <span className="text-[8px] font-black text-slate-500 uppercase">{new Date(b.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h5 className="text-lg font-black uppercase tracking-tight mb-2">{b.title}</h5>
                                    <p className="text-sm text-slate-400 line-clamp-2 italic">"{b.content}"</p>
                                </div>
                            ))}
                            {broadcasts.length === 0 && (
                                <div className="text-center text-slate-600 italic">No recent announcements.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BOUNTY BOARD MANAGEMENT */}
            {activeTab === 'BOUNTIES' && (
                <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Create Bounty */}
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6">Post New Bounty</h3>
                            <div className="space-y-6">
                                <textarea
                                    value={bountyTask}
                                    onChange={(e) => setBountyTask(e.target.value)}
                                    placeholder="Describe the task (e.g. 'Summarize new IMA Ethics Update')"
                                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-brand/5 resize-none"
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Reward Amount</label>
                                        <input
                                            type="number"
                                            value={bountyReward}
                                            onChange={(e) => setBountyReward(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-900 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Reward Type</label>
                                        <select
                                            value={bountyType}
                                            onChange={(e) => setBountyType(e.target.value as any)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none"
                                        >
                                            <option value="CREDITS">Credits</option>
                                            <option value="BADGE">Badge</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCreateBounty}
                                    disabled={!bountyTask}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-brand transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    Deploy Bounty
                                </button>
                            </div>
                        </div>

                        {/* Active Bounties List */}
                        <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10"><Icons.Award className="w-40 h-40 text-brand" /></div>
                            <h3 className="text-xl font-black uppercase tracking-widest mb-8 relative z-10">Active Gigs</h3>
                            <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {bounties.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <p className="text-xs font-bold uppercase tracking-widest">No active bounties</p>
                                    </div>
                                ) : (
                                    bounties.map(b => (
                                        <div key={b.id} className="p-5 bg-white/10 rounded-2xl border border-white/5 hover:bg-white/20 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="px-2 py-1 bg-brand text-white text-[8px] font-black uppercase rounded">{b.type}</span>
                                                <span className="text-[10px] font-black text-brand">{b.reward} PTS</span>
                                            </div>
                                            <p className="text-xs font-medium leading-snug mb-3">"{b.task}"</p>
                                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                                <span>Status: {b.status}</span>
                                                <span>{new Date(b.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'CLASSROOMS' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Managed Clusters</h3>
                        <button className="px-8 py-4 bg-brand text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2">
                            <Icons.Plus className="w-4 h-4" /> Initialize Room
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myRooms.length > 0 ? myRooms.map(room => (
                            <div key={room.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-lg hover:shadow-2xl hover:border-emerald-200 transition-all group cursor-pointer flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">{room.category}</span>
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                        <Icons.Users className="w-5 h-5" />
                                    </div>
                                </div>

                                <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none group-hover:text-emerald-600 transition-colors">{room.name}</h4>
                                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed line-clamp-2 flex-1">"{room.description}"</p>

                                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Enrollment</span>
                                        <span className="text-lg font-black text-slate-900">{room.members}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Active</span>
                                        <span className="text-lg font-black text-emerald-500">{room.activeOnline}</span>
                                    </div>
                                    <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md">
                                        <Icons.Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-200 rounded-[4rem] opacity-50 flex flex-col items-center gap-6">
                                <Icons.Users className="w-20 h-20 text-slate-300" />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">No active classrooms initialized</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'REVENUE' && (
                <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
                    <div className="bg-white p-16 rounded-[5rem] shadow-2xl border border-slate-100 text-center">
                        <div className="w-24 h-24 bg-brand/5 text-brand rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl border border-brand/10">
                            <Icons.DollarSign className="w-12 h-12" />
                        </div>
                        <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Earnings</h3>
                        <p className="text-slate-500 font-medium italic mb-16">Track your earnings and withdrawals.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl">
                                <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-4 block">Available Balance</span>
                                <div className="text-6xl font-black">₹12,400</div>
                            </div>
                            <div className="p-10 bg-brand/5 border border-brand/10 rounded-[3rem]">
                                <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-4 block">Lifetime Earnings</span>
                                <div className="text-6xl font-black text-slate-900">₹84,200</div>
                            </div>
                        </div>

                        <button className="px-16 py-8 bg-brand text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95">
                            Withdraw Funds
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'TEACHERS_DECK' && (
                <div className="h-[calc(100vh-350px)] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                    <TeachersDeck />
                </div>
            )}
        </div>
    );
};
