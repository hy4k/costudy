
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { User, UserRole, AlignmentPurpose, ActiveAlignment, AlignmentRequest, AlignmentDuration, TrackingRecord, ObserverRecord, SignalLevel, SignalConfig } from '../../types';
import { getUserProfile, updateUserProfile } from '../../services/fetsService';

interface ProfileProps {
  onLogout?: () => void;
  userId?: string;
  onProfileUpdate?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onLogout, userId, onProfileUpdate }) => {
    const [me, setMe] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Tab State for Network Section
    const [networkTab, setNetworkTab] = useState<'CONTRACTS' | 'RADAR'>('CONTRACTS');
    const [activeAlignTab, setActiveAlignTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
    
    // Form state for editing
    const [editForm, setEditForm] = useState({
        name: '',
        handle: '',
        bio: '',
        strategicMilestone: '',
        examFocus: 'CMA Part 1' as 'CMA Part 1' | 'CMA Part 2' | 'Both',
        avatar: '',
        signalLevel: 'ACTIVE_SOLVER' as SignalLevel,
        // Mentor Fields
        specialties: '' as string,
        yearsExperience: '' as number | string,
        hourlyRate: '' as number | string
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // MOCK DATA FOR ALIGNMENTS
    const [alignments, setAlignments] = useState<ActiveAlignment[]>([
        { 
            id: 'a1', 
            peerId: 'p1', 
            peerName: 'Priya K.', 
            peerAvatar: 'https://i.pravatar.cc/150?u=p1', 
            purpose: AlignmentPurpose.MCQ_DRILL, 
            streak: 4, 
            startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), 
            duration: '7 Days',
            status: 'ACTIVE',
            goal: "Complete 100 MCQs daily for Part 1 Section A."
        },
        { 
            id: 'a2', 
            peerId: 'p2', 
            peerName: 'David Chen', 
            peerAvatar: 'https://i.pravatar.cc/150?u=p2', 
            purpose: AlignmentPurpose.ACCOUNTABILITY, 
            streak: 15, 
            startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), 
            duration: '30 Days',
            status: 'ACTIVE',
            goal: "Check in at 6 AM EST every morning."
        }
    ]);

    const [pendingRequests, setPendingRequests] = useState<AlignmentRequest[]>([
        { id: 'r1', senderId: 's1', senderName: 'Rahul V.', senderAvatar: 'https://i.pravatar.cc/150?u=s1', purpose: AlignmentPurpose.REVISION_SPRINT, duration: '7 Days', note: "Need someone to grind Part 2 formulas with every morning at 6am.", timestamp: new Date().toISOString(), status: 'PENDING' }
    ]);

    // MOCK DATA FOR TRACKING (RADAR)
    const [trackingList, setTrackingList] = useState<TrackingRecord[]>([
        {
            id: 't1', targetId: 'u-101', targetName: 'Ananya S.', targetAvatar: 'https://i.pravatar.cc/150?u=101',
            stats: { consistencyStreak: 45, lastMockScore: 82, essaysSubmitted: 12, doubtsSolved: 5 },
            trackedSince: '2023-10-01'
        },
        {
            id: 't2', targetId: 'u-102', targetName: 'Marcus L.', targetAvatar: 'https://i.pravatar.cc/150?u=102',
            stats: { consistencyStreak: 3, lastMockScore: 65, essaysSubmitted: 2, doubtsSolved: 0 },
            trackedSince: '2023-10-10'
        }
    ]);

    const [observerList, setObserverList] = useState<ObserverRecord[]>([
        { id: 'o1', observerId: 'u-201', observerName: 'StudyBot_99', observerAvatar: 'https://i.pravatar.cc/150?u=201', observedSince: '2023-09-15' },
        { id: 'o2', observerId: 'u-202', observerName: 'CMA_Ninja', observerAvatar: 'https://i.pravatar.cc/150?u=202', observedSince: '2023-09-20' }
    ]);

    // Boundary Modal State
    const [boundaryTarget, setBoundaryTarget] = useState<ActiveAlignment | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!userId) {
              setLoading(false);
              return;
            }
            setLoading(true);
            try {
                const data = await getUserProfile(userId);
                if (data) {
                    setMe(data);
                    setEditForm({
                        name: data.name || '',
                        handle: data.handle || '',
                        bio: data.bio || '',
                        strategicMilestone: data.strategicMilestone || '',
                        examFocus: data.examFocus || 'CMA Part 1',
                        avatar: data.avatar || '',
                        signalLevel: data.signalLevel || 'ACTIVE_SOLVER',
                        specialties: data.specialties?.join(', ') || '',
                        yearsExperience: data.yearsExperience || '',
                        hourlyRate: data.hourlyRate || ''
                    });
                }
            } catch (err) {
                console.error("Profile Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const handleSave = async () => {
        if (!userId || !me) return;
        setIsSaving(true);
        setSaveStatus('IDLE');
        try {
            await updateUserProfile(userId, {
                name: editForm.name,
                handle: editForm.handle,
                bio: editForm.bio,
                strategicMilestone: editForm.strategicMilestone,
                examFocus: editForm.examFocus,
                avatar: editForm.avatar,
                signalLevel: editForm.signalLevel,
                specialties: editForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
                yearsExperience: Number(editForm.yearsExperience) || 0,
                hourlyRate: Number(editForm.hourlyRate) || 0
            });
            const updated = await getUserProfile(userId);
            if (updated) {
                setMe(updated);
                if (onProfileUpdate) onProfileUpdate();
                setSaveStatus('SUCCESS');
                setTimeout(() => {
                    setIsEditing(false);
                    setSaveStatus('IDLE');
                }, 1000);
            }
        } catch (e: any) {
            console.error("Save failed", e);
            setSaveStatus('ERROR');
            alert(`Synchronization Failed: ${e.message || 'Check your database connection'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Visual Identity too large. Please select an image under 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAcceptRequest = (req: AlignmentRequest) => {
        setAlignments(prev => [...prev, {
            id: `a-${Date.now()}`,
            peerId: req.senderId,
            peerName: req.senderName,
            peerAvatar: req.senderAvatar,
            purpose: req.purpose,
            streak: 0,
            startDate: new Date().toISOString(),
            duration: req.duration,
            status: 'ACTIVE',
            goal: req.note
        }]);
        setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    };

    const handleRejectRequest = (id: string) => {
        setPendingRequests(prev => prev.filter(r => r.id !== id));
    };

    const handleRenewAlignment = (id: string) => {
        setAlignments(prev => prev.map(a => 
            a.id === id ? { ...a, status: 'ACTIVE', startDate: new Date().toISOString(), streak: 0 } : a
        ));
        alert("Renewal request sent to peer. Protocol reactivated provisionally.");
    };

    // Boundary Actions
    const handleBoundaryAction = (action: 'PAUSE' | 'RESTRICT' | 'END', payload?: any) => {
        if (!boundaryTarget) return;
        
        setAlignments(prev => prev.map(a => {
            if (a.id === boundaryTarget.id) {
                if (action === 'PAUSE') return { ...a, status: 'PAUSED', pausedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
                if (action === 'END') return { ...a, status: 'ARCHIVED' };
                if (action === 'RESTRICT') return { ...a, restrictions: payload };
            }
            return a;
        }));
        
        setBoundaryTarget(null);
    };

    const getDaysRemaining = (startDate: string, duration: AlignmentDuration) => {
        let durationDays = 30; 
        if (duration === '7 Days') durationDays = 7;
        if (duration === '14 Days') durationDays = 14;
        if (duration === '30 Days') durationDays = 30;
        if (duration === 'Until Exam') durationDays = 90;

        const start = new Date(startDate).getTime();
        const now = new Date().getTime();
        const elapsed = (now - start) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(durationDays - elapsed));
    };

    const getProgress = (startDate: string, duration: AlignmentDuration) => {
        let durationDays = 30;
        if (duration === '7 Days') durationDays = 7;
        if (duration === '14 Days') durationDays = 14;
        if (duration === '30 Days') durationDays = 30;
        if (duration === 'Until Exam') durationDays = 90;

        const start = new Date(startDate).getTime();
        const now = new Date().getTime();
        const elapsed = (now - start) / (1000 * 60 * 60 * 24);
        return Math.min(100, Math.max(0, (elapsed / durationDays) * 100));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 opacity-40">
                <Icons.CloudSync className="w-16 h-16 animate-spin text-brand" />
                <span className="font-black uppercase tracking-[0.4em] text-sm animate-pulse text-slate-900">Establishing Identity Link...</span>
            </div>
        );
    }

    if (!me) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 py-40 text-center">
           <div className="p-8 bg-brand/5 rounded-full border border-brand/10">
              <Icons.HelpCircle className="w-20 h-20 text-brand/20" />
           </div>
           <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Identity Not Found</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto">
                 We couldn't retrieve your professional profile. Please ensure your Supabase 'user_profiles' table is active.
              </p>
           </div>
           {onLogout && (
             <button onClick={onLogout} className="px-12 py-5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-brand transition-all">
               Sign Out Universe
             </button>
           )}
        </div>
      );
    }

    const isTeacher = me.role === UserRole.TEACHER;
    const themeBrand = isTeacher ? 'text-emerald-600' : 'text-brand';
    const themeBg = isTeacher ? 'bg-emerald-600' : 'bg-brand';
    const themeBgLight = isTeacher ? 'bg-emerald-50' : 'bg-brand/5';

    // Filter alignments
    const activeAlignments = alignments.filter(a => a.status === 'ACTIVE' || a.status === 'PAUSED');
    const archivedAlignments = alignments.filter(a => a.status === 'EXPIRED' || a.status === 'ARCHIVED');

    const currentSignal = SignalConfig[me.signalLevel] || SignalConfig['ACTIVE_SOLVER'];
    const vouchCount = me.reputation.vouchesReceived || 0;
    const isExpert = vouchCount > 50;

    return (
        <div className="mx-auto px-6 py-12 flex flex-col gap-12 animate-in fade-in duration-700 pb-40 w-full max-w-[95%]">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                accept="image/*" 
                onChange={handleFileChange} 
            />

            {/* BOUNDARY SETTINGS MODAL */}
            {boundaryTarget && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl w-full max-w-lg p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setBoundaryTarget(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 px-4 py-2 transition-all"><Icons.Plus className="w-6 h-6 rotate-45" /></button>
                        
                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Protocol Boundary</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Managing: {boundaryTarget.peerName}</p>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={() => handleBoundaryAction('PAUSE')}
                                className="w-full p-5 rounded-lg bg-amber-50 border border-amber-100 text-left hover:border-amber-300 transition-all group px-4 py-2"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pause Protocol (7 Days)</span>
                                    <Icons.Clock className="w-4 h-4 text-amber-400" />
                                </div>
                                <p className="text-xs font-medium text-amber-800/70">Suspend expectations. Streak frozen.</p>
                            </button>

                            <button 
                                onClick={() => handleBoundaryAction('RESTRICT', ['NO_ESSAYS'])}
                                className="w-full p-5 rounded-lg bg-blue-50 border border-blue-100 text-left hover:border-blue-300 transition-all group px-4 py-2"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Restrict Scope</span>
                                    <Icons.Lock className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-xs font-medium text-blue-800/70">Limit interactions to MCQs only. No Essays.</p>
                            </button>

                            <button 
                                onClick={() => handleBoundaryAction('END')}
                                className="w-full p-5 rounded-lg bg-slate-50 border border-slate-200 text-left hover:border-rose-300 hover:bg-rose-50 transition-all group px-4 py-2"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-500 group-hover:text-rose-600 uppercase tracking-widest">Conclude Contract</span>
                                    <Icons.Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                                </div>
                                <p className="text-xs font-medium text-slate-400 group-hover:text-rose-800/70">Archive this connection cleanly. No notification sent.</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Identity Header */}
            <div className="relative bg-white/70 backdrop-blur-3xl border border-white p-12 sm:p-20 rounded-xl sm:rounded-[6.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden min-h-[60vh] flex flex-col justify-center">
                <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${isTeacher ? 'bg-emerald-500/5' : 'bg-brand/5'} blur-[150px] rounded-full -mr-60 -mt-60 pointer-events-none`}></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col xl:flex-row items-center gap-16 sm:gap-24">
                    {/* Avatar Logic */}
                    <div className="relative group shrink-0">
                        <div 
                          className={`w-64 h-64 sm:w-96 sm:h-96 ${isTeacher ? 'rounded-xl' : 'rounded-[4.5rem] sm:rounded-[6rem]'} overflow-hidden ring-[1.5rem] sm:ring-[2rem] ring-white shadow-2xl transition-all duration-700 relative ${isEditing ? 'cursor-pointer hover:ring-brand/10 active:scale-95' : ''}`}
                          onClick={handleAvatarClick}
                        >
                            <img 
                                src={isEditing ? editForm.avatar : me.avatar} 
                                className={`w-full h-full object-cover transition-all duration-700 ${isEditing ? 'brightness-50 grayscale-[0.5]' : 'group-hover:scale-110'}`} 
                                alt="Profile" 
                            />
                            {isEditing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center pointer-events-none bg-black/20 backdrop-blur-sm">
                                    <Icons.Plus className="w-16 h-16 mb-4 animate-bounce" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em] leading-tight">Update<br/>Photo</span>
                                </div>
                            )}
                        </div>
                        {isTeacher ? (
                             <div className="absolute -bottom-6 -right-6 bg-emerald-600 text-white p-6 sm:p-8 rounded-xl shadow-2xl border-[6px] sm:border-[8px] border-white flex items-center gap-2">
                                <Icons.CheckBadge className="w-10 h-10 sm:w-12 sm:h-12" />
                             </div>
                        ) : isExpert ? (
                            <div className="absolute -bottom-6 -right-6 bg-amber-400 text-white p-6 sm:p-8 rounded-xl sm:rounded-xl shadow-2xl border-[6px] sm:border-[8px] border-white animate-pulse">
                               <Icons.Stamp className="w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                        ) : (
                            <div className="absolute -bottom-6 -right-6 bg-slate-900 text-brand p-6 sm:p-8 rounded-xl sm:rounded-xl shadow-2xl border-[6px] sm:border-[8px] border-white animate-pulse">
                               <Icons.Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 w-full flex flex-col items-center xl:items-start text-center xl:text-left">
                        {isEditing ? (
                            <div className="space-y-8 w-full max-w-2xl animate-in slide-in-from-bottom-6 duration-500">
                                {/* SIGNAL LEVEL SELECTOR */}
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 block ml-2">Signal Level (Visibility)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {(Object.keys(SignalConfig) as SignalLevel[]).map(level => {
                                            const cfg = SignalConfig[level];
                                            const isSelected = editForm.signalLevel === level;
                                            return (
                                                <button
                                                    key={level}
                                                    onClick={() => setEditForm(prev => ({ ...prev, signalLevel: level }))}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-brand bg-white shadow-lg scale-[1.02]' : 'border-transparent bg-white/50 hover:bg-white text-slate-400'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full mb-2 ${cfg.color}`}></div>
                                                    <div className={`text-[9px] font-black uppercase tracking-widest leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{cfg.label}</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 py-2 transition-all">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Full Name</label>
                                        <input 
                                            className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-8 py-5 text-lg font-black text-slate-900 outline-none /30 transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter Legal Name"
                                        />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Handle</label>
                                        <input 
                                            className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-8 py-5 text-lg font-black text-slate-900 outline-none /30 transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={editForm.handle}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                                            placeholder="@handle"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">{isTeacher ? 'Professional Bio' : 'Personal Bio'}</label>
                                    <textarea 
                                        className="w-full h-32 bg-slate-50 border-2 border-slate-300 rounded-lg p-8 text-slate-700 font-medium text-base outline-none /30 transition-all leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Briefly describe your profile..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className={`flex-1 py-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${saveStatus === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}
                                    >
                                        {isSaving ? 'Saving...' : saveStatus === 'SUCCESS' ? 'Saved' : 'Confirm Updates'}
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="px-8 py-5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full animate-in fade-in duration-500">
                                <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4 mb-6">
                                    {isExpert && (
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-lg bg-amber-400 text-white">
                                            <Icons.Stamp className="w-4 h-4" />
                                            Certified Peer Expert
                                        </div>
                                    )}
                                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-lg ${isTeacher ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-brand'}`}>
                                        <Icons.Award className="w-4 h-4" />
                                        {isTeacher ? 'Accredited Faculty' : 'Master Tier Scholar'}
                                    </div>
                                    {/* Signal Level Badge */}
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-white ${currentSignal.color.replace('bg-', 'text-')} border-slate-100`}>
                                        <div className={`w-2 h-2 rounded-full ${currentSignal.color}`}></div>
                                        {currentSignal.label}
                                    </div>
                                </div>

                                <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-6 uppercase md:whitespace-nowrap overflow-hidden text-ellipsis">
                                    {me.name}
                                    {isTeacher && <span className={`text-3xl sm:text-5xl align-top ml-4 ${themeBrand} tracking-normal inline-block`}>CMA, CPA</span>}
                                </h1>
                                
                                <div className="flex flex-wrap items-center justify-center xl:justify-start gap-x-6 gap-y-4 mb-12">
                                    <p className="text-2xl sm:text-3xl text-slate-400 font-black uppercase tracking-widest">@{me.handle}</p>
                                    <div className="hidden sm:block w-2 h-2 rounded-full bg-slate-300"></div>
                                    <div className="flex gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credibility</span>
                                            <div className="text-xl font-black text-brand flex items-center gap-2"><Icons.Stamp className="w-4 h-4" /> {vouchCount} Vouches</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skepticism</span>
                                            <div className="text-xl font-black text-slate-900 flex items-center gap-2"><Icons.Scale className="w-4 h-4" /> {me.reputation?.professionalSkepticism || 0} Points</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 justify-center xl:justify-start">
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className={`px-10 py-5 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 hover:scale-105 ${themeBg} shadow-brand/20`}
                                    >
                                        Edit Identity
                                    </button>
                                    <button 
                                        onClick={onLogout}
                                        className="px-10 py-5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ... (Rest of Network Section - Unchanged) ... */}
            {!isTeacher && (
                <div className="animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-center mb-12">
                        <div className="flex gap-4 p-2 bg-white rounded-xl border border-slate-200 shadow-xl">
                            <button 
                                onClick={() => setNetworkTab('CONTRACTS')} 
                                className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${networkTab === 'CONTRACTS' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                CAN Contracts
                            </button>
                            <button 
                                onClick={() => setNetworkTab('RADAR')} 
                                className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${networkTab === 'RADAR' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                <Icons.Search className="w-3 h-3 px-4 py-2 transition-all" /> Academic Radar
                            </button>
                        </div>
                    </div>

                    {networkTab === 'CONTRACTS' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Active Alignments */}
                            <div className="bg-white border border-slate-200 rounded-xl p-10 lg:p-14 shadow-xl flex flex-col relative overflow-hidden min-h-[600px]">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><Icons.Link className="w-48 h-48" /></div>
                                
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-violet-100 rounded-xl text-violet-600"><Icons.Link className="w-6 h-6" /></div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Alignment Hub</h3>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Management</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                        <button onClick={() => setActiveAlignTab('ACTIVE')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeAlignTab === 'ACTIVE' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}>Active</button>
                                        <button onClick={() => setActiveAlignTab('ARCHIVED')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeAlignTab === 'ARCHIVED' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}>Past</button>
                                    </div>
                                </div>

                                {activeAlignTab === 'ACTIVE' ? (
                                    activeAlignments.length > 0 ? (
                                        <div className="space-y-6 relative z-10 flex-1 overflow-y-auto no-scrollbar pr-2 px-4 py-2 transition-all">
                                            {activeAlignments.map(align => {
                                                const daysLeft = getDaysRemaining(align.startDate, align.duration);
                                                const progress = getProgress(align.startDate, align.duration);
                                                const isUrgent = daysLeft <= 3;
                                                const isPaused = align.status === 'PAUSED';

                                                return (
                                                    <div key={align.id} className={`p-6 border rounded-xl flex flex-col gap-4 group transition-all relative overflow-hidden ${isPaused ? 'bg-slate-100 border-slate-200 grayscale opacity-80' : isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100 hover:border-violet-200'}`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <img src={align.peerAvatar} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-md" />
                                                                <div>
                                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{align.peerName}</h4>
                                                                    <div className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">{align.purpose}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Manage Boundary Button (Gear) */}
                                                            <button 
                                                                onClick={() => setBoundaryTarget(align)}
                                                                className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900 px-4 py-2"
                                                            >
                                                                <Icons.Plus className="w-4 h-4 rotate-0" /> {/* Gear substitute */}
                                                            </button>
                                                        </div>
                                                        
                                                        {isPaused ? (
                                                            <div className="bg-white/50 p-4 rounded-xl border border-black/5 text-center">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Paused</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="bg-white/50 p-4 rounded-xl border border-black/5">
                                                                    <p className="text-[11px] font-medium text-slate-600 italic">"{align.goal}"</p>
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-2">
                                                                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${isUrgent ? 'bg-orange-500' : 'bg-violet-500'}`} style={{ width: `${progress}%` }}></div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                                                        <Icons.TrendingUp className="w-3 h-3" /> Streak: {align.streak}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10 relative z-10">
                                            <Icons.Link className="w-12 h-12 text-slate-300 mb-4" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs">No active protocols. Request alignment from the Social Wall.</p>
                                        </div>
                                    )
                                ) : (
                                    archivedAlignments.length > 0 ? (
                                        <div className="space-y-6 relative z-10 flex-1 overflow-y-auto no-scrollbar pr-2">
                                            {archivedAlignments.map(align => (
                                                <div key={align.id} className="p-6 bg-slate-100 border border-slate-200 rounded-xl flex flex-col gap-4 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <img src={align.peerAvatar} className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-200" />
                                                            <div>
                                                                <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">{align.peerName}</h4>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ended: {align.duration}</div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-200 px-3 py-1 rounded-lg">Expired</span>
                                                    </div>
                                                    <button onClick={() => handleRenewAlignment(align.id)} className="w-full py-3 bg-white border border-slate-300 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-violet-500 hover:text-violet-600 transition-all shadow-sm px-4">
                                                        Renegotiate Contract
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10 relative z-10">
                                            <Icons.Clock className="w-12 h-12 text-slate-300 mb-4" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs">No history found.</p>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Pending Treaties */}
                            <div className="bg-slate-900 text-white rounded-xl p-10 lg:p-14 shadow-2xl flex flex-col relative overflow-hidden h-fit">
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">Incoming Treaties</h3>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Review Contracts</div>
                                    </div>
                                    {pendingRequests.length > 0 && (
                                        <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full">{pendingRequests.length}</div>
                                    )}
                                </div>
                                {pendingRequests.length > 0 ? (
                                    <div className="space-y-6 relative z-10">
                                        {pendingRequests.map(req => (
                                            <div key={req.id} className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <img src={req.senderAvatar} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/20" />
                                                    <div>
                                                        <div className="text-sm font-black uppercase tracking-tight">{req.senderName}</div>
                                                        <div className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">{req.purpose} • {req.duration}</div>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-black/20 rounded-xl mb-6">
                                                    <p className="text-xs font-medium italic text-slate-300 leading-relaxed">"{req.note}"</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={() => handleAcceptRequest(req)} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg px-4">Sign Contract</button>
                                                    <button onClick={() => handleRejectRequest(req.id)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Decline</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 relative z-10">
                                        <Icons.CheckBadge className="w-16 h-16 text-slate-500 mb-4" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">All protocols synced.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // --- RADAR VIEW (TRACKING) ---
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* YOU TRACK (DASHBOARD) */}
                            <div className="lg:col-span-2 bg-slate-900 text-white rounded-xl p-10 lg:p-14 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10"><Icons.Search className="w-64 h-64 text-brand" /></div>
                                
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="p-4 bg-brand rounded-xl text-white"><Icons.Search className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">Your Scope</h3>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subjects Tracked: {trackingList.length}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 relative z-10">
                                    {trackingList.map(track => (
                                        <div key={track.id} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <img src={track.targetAvatar} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10" />
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase tracking-tight">{track.targetName}</h4>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tracked Since {new Date(track.trackedSince).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Icons.CloudSync className="w-5 h-5 animate-spin" />
                                                </div>
                                            </div>
                                            
                                            {/* Metrics Grid - The "Data" aspect */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-black/30 p-3 rounded-xl text-center border border-white/5">
                                                    <div className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Consistency</div>
                                                    <div className="text-lg font-black text-white flex items-center justify-center gap-1">
                                                        <Icons.TrendingUp className="w-3 h-3 text-orange-500" /> {track.stats.consistencyStreak}d
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 p-3 rounded-xl text-center border border-white/5">
                                                    <div className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Last Mock</div>
                                                    <div className="text-lg font-black text-emerald-400">{track.stats.lastMockScore || 'N/A'}%</div>
                                                </div>
                                                <div className="bg-black/30 p-3 rounded-xl text-center border border-white/5">
                                                    <div className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Essays</div>
                                                    <div className="text-lg font-black text-blue-400">{track.stats.essaysSubmitted}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {trackingList.length === 0 && (
                                        <div className="text-center py-20 opacity-30">
                                            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Radar Empty. Find subjects on the Social Wall.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TRACKED BY (AUDIENCE) */}
                            <div className="bg-white border border-slate-200 rounded-xl p-10 shadow-xl relative overflow-hidden">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-slate-100 rounded-xl text-slate-500"><Icons.Users className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Observers</h3>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Watching Your Progress</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {observerList.map(obs => (
                                        <div key={obs.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                                            <img src={obs.observerAvatar} className="w-10 h-10 rounded-xl object-cover grayscale opacity-70" />
                                            <div>
                                                <div className="text-xs font-black text-slate-700 uppercase tracking-wide">{obs.observerName}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Silent Observer</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        These users receive data updates on your public activity (Mocks, Doubts). They cannot DM you unless aligned.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Authenticated Footer */}
            <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-xl ${themeBgLight} ${themeBrand}`}><Icons.Fingerprint className="w-8 h-8" /></div>
                    <div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] block mb-1">Session Active</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                           {isTeacher ? "Faculty Credentials Verified" : "Student Neural Link Stable"}
                        </span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                    ID: {userId?.split('-')[0] || 'Unknown'}
                </div>
            </div>
        </div>
    );
};
