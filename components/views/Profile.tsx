import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { User, UserRole, ActiveAlignment, AlignmentRequest, AlignmentDuration, TrackingRecord, ObserverRecord, SignalLevel, SignalConfig } from '../../types';
import { getUserProfile, updateUserProfile } from '../../services/fetsService';
import { alignmentService } from '../../services/alignmentService';
import { InviteCard } from '../InviteCard';

interface ProfileProps {
  onLogout?: () => void;
  userId?: string;
  onProfileUpdate?: () => void;
}

const eyebrow: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
};

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

    // Alignments State (fetched from backend)
    const [alignments, setAlignments] = useState<ActiveAlignment[]>([]);
    const [pendingRequests, setPendingRequests] = useState<AlignmentRequest[]>([]);
    const [trackingList, setTrackingList] = useState<TrackingRecord[]>([]);
    const [observerList, setObserverList] = useState<ObserverRecord[]>([]);
    const [networkLoading, setNetworkLoading] = useState(false);

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

                    // Load CAN Network data
                    loadNetworkData(userId);
                }
            } catch (err) {
                console.error("Profile Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    // Load CAN Network data (alignments, requests, tracking)
    const loadNetworkData = async (uid: string) => {
        setNetworkLoading(true);
        try {
            const [alignmentsData, requestsData, trackingData, observersData] = await Promise.all([
                alignmentService.getMyAlignments(uid),
                alignmentService.getPendingRequests(uid),
                alignmentService.getTracking(uid),
                alignmentService.getObservers(uid)
            ]);

            setAlignments(alignmentsData);
            setPendingRequests(requestsData);
            setTrackingList(trackingData);
            setObserverList(observersData);
        } catch (err) {
            console.error("Network Data Load Error", err);
        } finally {
            setNetworkLoading(false);
        }
    };

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
                setSaveStatus('ERROR');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAcceptRequest = async (req: AlignmentRequest) => {
        const newAlignmentId = await alignmentService.acceptRequest(req.id);
        if (newAlignmentId && userId) {
            const [alignmentsData, requestsData] = await Promise.all([
                alignmentService.getMyAlignments(userId),
                alignmentService.getPendingRequests(userId)
            ]);
            setAlignments(alignmentsData);
            setPendingRequests(requestsData);
        }
    };

    const handleRejectRequest = async (id: string) => {
        const success = await alignmentService.declineRequest(id);
        if (success) {
            setPendingRequests(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleRenewAlignment = async (id: string) => {
        const success = await alignmentService.renewAlignment(id);
        if (success) {
            setAlignments(prev => prev.map(a =>
                a.id === id ? { ...a, status: 'ACTIVE', startDate: new Date().toISOString(), streak: 0 } : a
            ));
        }
    };

    // Boundary Actions
    const handleBoundaryAction = async (action: 'PAUSE' | 'RESTRICT' | 'END', payload?: any) => {
        if (!boundaryTarget) return;

        let success = false;
        if (action === 'PAUSE') {
            const pausedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            success = await alignmentService.updateAlignmentStatus(boundaryTarget.id, 'PAUSED', pausedUntil);
        } else if (action === 'END') {
            success = await alignmentService.updateAlignmentStatus(boundaryTarget.id, 'ARCHIVED');
        } else if (action === 'RESTRICT') {
            success = await alignmentService.updateRestrictions(boundaryTarget.id, payload);
        }

        if (success) {
            setAlignments(prev => prev.map(a => {
                if (a.id === boundaryTarget.id) {
                    if (action === 'PAUSE') return { ...a, status: 'PAUSED', pausedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
                    if (action === 'END') return { ...a, status: 'ARCHIVED' };
                    if (action === 'RESTRICT') return { ...a, restrictions: payload };
                }
                return a;
            }));
        }

        setBoundaryTarget(null);
    };

    const durationDaysOf = (duration: AlignmentDuration) => {
        if (duration === '7 Days') return 7;
        if (duration === '14 Days') return 14;
        if (duration === '30 Days') return 30;
        if (duration === 'Until Exam') return 90;
        return 30;
    };

    const getDaysRemaining = (startDate: string, duration: AlignmentDuration) => {
        const durationDays = durationDaysOf(duration);
        const elapsed = (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(durationDays - elapsed));
    };

    const getProgress = (startDate: string, duration: AlignmentDuration) => {
        const durationDays = durationDaysOf(duration);
        const elapsed = (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
        return Math.min(100, Math.max(0, (elapsed / durationDays) * 100));
    };

    // ---------- Loading / not-found states ----------
    if (loading) {
        return (
            <div className="proto wall-embedded">
                <div className="wall" data-page="profile">
                    <main className="shell-solo">
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!me) {
        return (
            <div className="proto wall-embedded">
                <div className="wall" data-page="profile">
                    <main className="shell-solo">
                        <div className="post dm-empty prof-empty" style={{ textAlign: 'center', padding: '48px 28px' }}>
                            <Icons.HelpCircle className="w-8 h-8" style={{ color: 'var(--muted)', margin: '0 auto 10px' }} />
                            <p className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Profile not found</p>
                            <span style={{ color: 'var(--muted)', fontSize: '0.84rem', display: 'block', margin: '6px 0 18px' }}>
                                We couldn't retrieve your profile. Please try signing in again.
                            </span>
                            {onLogout && (
                                <button type="button" className="clay-cta" style={{ maxWidth: 200, margin: '0 auto' }} onClick={onLogout}>
                                    Sign out
                                </button>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const isTeacher = me.role === UserRole.TEACHER;

    // Filter alignments
    const activeAlignments = alignments.filter(a => a.status === 'ACTIVE' || a.status === 'PAUSED');
    const archivedAlignments = alignments.filter(a => a.status === 'EXPIRED' || a.status === 'ARCHIVED');

    const currentSignal = SignalConfig[me.signalLevel] || SignalConfig['ACTIVE_SOLVER'];
    const vouchCount = me.reputation?.vouchesReceived || 0;
    const isExpert = vouchCount > 50;

    const stats = isTeacher
        ? [
            { n: String(me.yearsExperience || 0), l: 'Years exp.' },
            { n: `₹${me.hourlyRate || 0}`, l: 'Per hour' },
            { n: String(vouchCount), l: 'Vouches' },
            { n: String(me.reputation?.professionalSkepticism || 0), l: 'Skepticism' },
          ]
        : [
            { n: String(vouchCount), l: 'Vouches earned' },
            { n: String(me.reputation?.professionalSkepticism || 0), l: 'Skepticism pts' },
            { n: String(activeAlignments.length), l: 'Active contracts' },
            { n: String(trackingList.length), l: 'Tracking' },
          ];

    return (
        <div className="proto wall-embedded" data-theme={isTeacher ? 'faculty' : undefined}>
            <div className="wall" data-page="profile">
                <main className="shell-solo">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    {/* Masthead */}
                    <div className="feed-hello">
                        <h1 className="font-display">{isTeacher ? 'Faculty Profile' : 'My Study'}</h1>
                        <p>{isTeacher ? 'Your identity, verification, and mentoring settings.' : 'Your identity, alignments, and reputation on CoStudy.'}</p>
                    </div>

                    {/* Identity card */}
                    <div className="post prof-card">
                        <div className="prof-id">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                style={{ position: 'relative', flex: 'none', cursor: isEditing ? 'pointer' : 'default' }}
                                aria-label={isEditing ? 'Change photo' : undefined}
                            >
                                {(isEditing ? editForm.avatar : me.avatar) ? (
                                    <img
                                        src={isEditing ? editForm.avatar : me.avatar}
                                        alt="Profile"
                                        style={{ width: 68, height: 68, borderRadius: 22, objectFit: 'cover', boxShadow: 'var(--nm-xs)', filter: isEditing ? 'brightness(0.7)' : undefined }}
                                    />
                                ) : (
                                    <span style={{ width: 68, height: 68, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 24, boxShadow: 'var(--nm-xs)' }}>
                                        {(me.name || 'U').charAt(0)}
                                    </span>
                                )}
                                {isEditing && (
                                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <Icons.Plus className="w-5 h-5" />
                                    </span>
                                )}
                            </button>
                            <div className="prof-id-tx">
                                <strong className="font-display">{me.name}</strong>
                                <div className="prof-chips">
                                    {isTeacher ? (
                                        <>
                                            <span className="role-chip role-mentor"><Icons.CheckBadge className="w-[11px] h-[11px]" /> Verified mentor</span>
                                            {me.specialties && me.specialties.length > 0 && (
                                                <span className="role-chip role-student">{me.specialties.slice(0, 2).join(', ')}</span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className="role-chip role-student">@{me.handle} · {me.examFocus || 'CMA candidate'}</span>
                                            <span className="role-chip role-mentor">{currentSignal.label}</span>
                                            {isExpert && <span className="tag tag-gold"><Icons.CheckBadge className="w-[11px] h-[11px]" /> Peer expert</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="prof-btns">
                                {!isEditing && (
                                    <button type="button" className="rooms-create" onClick={() => setIsEditing(true)}>Edit profile</button>
                                )}
                                <button type="button" className="prof-logout" onClick={onLogout}>Sign out</button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="prof-stats">
                            {stats.map((s) => (
                                <div key={s.l} className="prof-stat">
                                    <strong className="font-display">{s.n}</strong>
                                    <span>{s.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ---------- Edit form ---------- */}
                    {isEditing && (
                        <div className="post" style={{ marginTop: 16 }}>
                            <p style={eyebrow}>Signal level (visibility)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
                                {(Object.keys(SignalConfig) as SignalLevel[]).map(level => {
                                    const cfg = SignalConfig[level];
                                    return (
                                        <button
                                            key={level}
                                            type="button"
                                            className={`clay-option ${editForm.signalLevel === level ? 'on' : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, signalLevel: level }))}
                                        >
                                            {cfg.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <p style={eyebrow}>Full name</p>
                                    <input
                                        className="clay-textarea"
                                        style={{ height: 'auto', resize: 'none' }}
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <p style={eyebrow}>Handle</p>
                                    <input
                                        className="clay-textarea"
                                        style={{ height: 'auto', resize: 'none' }}
                                        value={editForm.handle}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                                        placeholder="@handle"
                                    />
                                </div>
                            </div>

                            <p style={eyebrow}>{isTeacher ? 'Professional bio' : 'Personal bio'}</p>
                            <textarea
                                className="clay-textarea"
                                style={{ height: 100, marginBottom: 14 }}
                                value={editForm.bio}
                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="Briefly describe your profile…"
                            />

                            {isTeacher && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                                    <div>
                                        <p style={eyebrow}>Specialties (comma-separated)</p>
                                        <input
                                            className="clay-textarea"
                                            style={{ height: 'auto' }}
                                            value={editForm.specialties}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, specialties: e.target.value }))}
                                            placeholder="Costing, US GAAP, Part 1"
                                        />
                                    </div>
                                    <div>
                                        <p style={eyebrow}>Years experience</p>
                                        <input
                                            className="clay-textarea"
                                            style={{ height: 'auto' }}
                                            type="number"
                                            value={editForm.yearsExperience}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, yearsExperience: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <p style={eyebrow}>Hourly rate (₹)</p>
                                        <input
                                            className="clay-textarea"
                                            style={{ height: 'auto' }}
                                            type="number"
                                            value={editForm.hourlyRate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {saveStatus === 'ERROR' && (
                                <p style={{ color: 'var(--accent-deep)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>
                                    Save failed — check your connection and try again. (Images must be under 2MB.)
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" className="clay-cta" disabled={isSaving} onClick={handleSave} style={{ flex: 1 }}>
                                    {isSaving ? 'Saving…' : saveStatus === 'SUCCESS' ? 'Saved ✓' : 'Confirm updates'}
                                </button>
                                <button type="button" className="clay-option" style={{ width: 'auto', padding: '13px 22px' }} onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Invite Card — students only */}
                    {!isTeacher && !isEditing && (
                        <div style={{ marginTop: 18 }}>
                            <InviteCard />
                        </div>
                    )}

                    {/* ---------- Faculty extras ---------- */}
                    {isTeacher && !isEditing && (
                        <>
                            <h2 className="mock-h2">Specialties</h2>
                            <div className="post">
                                <div className="post-tags" style={{ marginTop: 0 }}>
                                    {(me.specialties || []).map((s) => <span key={s} className="tag">{s}</span>)}
                                    <button type="button" className="tag tag-pick" onClick={() => setIsEditing(true)}>+ Add</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ---------- Student network section ---------- */}
                    {!isTeacher && !isEditing && (
                        <>
                            <div className="prof-sec-head">
                                <h2 className="mock-h2">CAN network</h2>
                                <div className="focus-presets">
                                    <button type="button" className={`seg ${networkTab === 'CONTRACTS' ? 'seg-on' : ''}`} onClick={() => setNetworkTab('CONTRACTS')}>Contracts</button>
                                    <button type="button" className={`seg ${networkTab === 'RADAR' ? 'seg-on' : ''}`} onClick={() => setNetworkTab('RADAR')}>Radar</button>
                                </div>
                            </div>

                            {networkLoading && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                                </div>
                            )}

                            {!networkLoading && networkTab === 'CONTRACTS' && (
                                <>
                                    {/* Pending requests */}
                                    {pendingRequests.length > 0 && (
                                        <div className="missions" style={{ marginBottom: 18 }}>
                                            <p style={eyebrow}>Incoming requests · {pendingRequests.length}</p>
                                            {pendingRequests.map(req => (
                                                <div key={req.id} className="post mission-card">
                                                    <div className="mission-card-top">
                                                        <div className="prof-can-peer">
                                                            {req.senderAvatar ? (
                                                                <img src={req.senderAvatar} alt="" style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover' }} />
                                                            ) : (
                                                                <span style={{ width: 36, height: 36, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800 }}>
                                                                    {(req.senderName || 'P').charAt(0)}
                                                                </span>
                                                            )}
                                                            <div>
                                                                <h3>{req.senderName}</h3>
                                                                <p>{req.purpose} · {req.duration}</p>
                                                            </div>
                                                        </div>
                                                        <span className="status-chip">New</span>
                                                    </div>
                                                    {req.note && (
                                                        <p style={{ fontSize: '0.84rem', color: 'var(--muted)', fontStyle: 'italic', margin: '4px 0 10px' }}>
                                                            “{req.note}”
                                                        </p>
                                                    )}
                                                    <div style={{ display: 'flex', gap: 10 }}>
                                                        <button type="button" className="clay-cta" style={{ flex: 1, padding: '11px' }} onClick={() => handleAcceptRequest(req)}>
                                                            Sign contract
                                                        </button>
                                                        <button type="button" className="clay-option" style={{ width: 'auto', padding: '11px 18px' }} onClick={() => handleRejectRequest(req.id)}>
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Active / archived toggle */}
                                    <div className="prof-sec-head" style={{ margin: '14px 0 12px' }}>
                                        <p style={{ ...eyebrow, marginBottom: 0 }}>Study contracts</p>
                                        <div className="focus-presets">
                                            <button type="button" className={`seg ${activeAlignTab === 'ACTIVE' ? 'seg-on' : ''}`} onClick={() => setActiveAlignTab('ACTIVE')}>Active</button>
                                            <button type="button" className={`seg ${activeAlignTab === 'ARCHIVED' ? 'seg-on' : ''}`} onClick={() => setActiveAlignTab('ARCHIVED')}>Archived</button>
                                        </div>
                                    </div>

                                    {activeAlignTab === 'ACTIVE' ? (
                                        activeAlignments.length > 0 ? (
                                            <div className="missions">
                                                {activeAlignments.map(align => {
                                                    const daysLeft = getDaysRemaining(align.startDate, align.duration);
                                                    const progress = Math.round(getProgress(align.startDate, align.duration));
                                                    const isPaused = align.status === 'PAUSED';
                                                    return (
                                                        <div key={align.id} className="post mission-card" style={isPaused ? { opacity: 0.7 } : undefined}>
                                                            <div className="mission-card-top">
                                                                <div className="prof-can-peer">
                                                                    {align.peerAvatar ? (
                                                                        <img src={align.peerAvatar} alt="" style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <span style={{ width: 36, height: 36, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800 }}>
                                                                            {(align.peerName || 'P').charAt(0)}
                                                                        </span>
                                                                    )}
                                                                    <div>
                                                                        <h3>{align.peerName}</h3>
                                                                        <p>{align.purpose}</p>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span className={`status-chip ${isPaused ? 'status-bad' : ''}`}>{isPaused ? 'Paused' : 'Active'}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBoundaryTarget(align)}
                                                                        aria-label="Manage boundary"
                                                                        style={{ color: 'var(--muted)', padding: 4 }}
                                                                    >
                                                                        <Icons.MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {!isPaused && align.goal && (
                                                                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic', margin: '2px 0 8px' }}>
                                                                    “{align.goal}”
                                                                </p>
                                                            )}
                                                            <div className="mission-row">
                                                                <span>{daysLeft} days left{align.streak > 0 ? ` · ${align.streak}d streak` : ''}</span>
                                                                <strong>{progress}%</strong>
                                                            </div>
                                                            <div className="mission-bar"><i style={{ width: `${progress}%` }}></i></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="post dm-empty prof-empty">
                                                <Icons.Link className="w-[30px] h-[30px]" />
                                                <p>No active contracts</p>
                                                <span>Request alignment from the Study Wall to find a study partner.</span>
                                            </div>
                                        )
                                    ) : (
                                        archivedAlignments.length > 0 ? (
                                            <div className="missions">
                                                {archivedAlignments.map(align => (
                                                    <div key={align.id} className="post mission-card" style={{ opacity: 0.75 }}>
                                                        <div className="mission-card-top">
                                                            <div className="prof-can-peer">
                                                                {align.peerAvatar ? (
                                                                    <img src={align.peerAvatar} alt="" style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover' }} />
                                                                ) : (
                                                                    <span style={{ width: 36, height: 36, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800 }}>
                                                                        {(align.peerName || 'P').charAt(0)}
                                                                    </span>
                                                                )}
                                                                <div>
                                                                    <h3>{align.peerName}</h3>
                                                                    <p>Ended · {align.duration}</p>
                                                                </div>
                                                            </div>
                                                            <span className="status-chip status-bad">Expired</span>
                                                        </div>
                                                        <button type="button" className="clay-option" style={{ marginTop: 8 }} onClick={() => handleRenewAlignment(align.id)}>
                                                            Renegotiate contract
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="post dm-empty prof-empty">
                                                <Icons.Clock className="w-[30px] h-[30px]" />
                                                <p>No archived contracts</p>
                                                <span>Completed and ended alignments will appear here.</span>
                                            </div>
                                        )
                                    )}
                                </>
                            )}

                            {!networkLoading && networkTab === 'RADAR' && (
                                <>
                                    <p style={eyebrow}>You track · {trackingList.length}</p>
                                    {trackingList.length > 0 ? (
                                        <div className="missions" style={{ marginBottom: 18 }}>
                                            {trackingList.map(track => (
                                                <div key={track.id} className="post mission-card">
                                                    <div className="mission-card-top">
                                                        <div className="prof-can-peer">
                                                            {track.targetAvatar ? (
                                                                <img src={track.targetAvatar} alt="" style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover' }} />
                                                            ) : (
                                                                <span style={{ width: 36, height: 36, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800 }}>
                                                                    {(track.targetName || 'T').charAt(0)}
                                                                </span>
                                                            )}
                                                            <div>
                                                                <h3>{track.targetName}</h3>
                                                                <p>Tracked since {new Date(track.trackedSince).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="prof-stats" style={{ marginTop: 12 }}>
                                                        <div className="prof-stat">
                                                            <strong className="font-display">{track.stats.consistencyStreak}d</strong>
                                                            <span>Consistency</span>
                                                        </div>
                                                        <div className="prof-stat">
                                                            <strong className="font-display">{track.stats.lastMockScore ?? '—'}%</strong>
                                                            <span>Last mock</span>
                                                        </div>
                                                        <div className="prof-stat">
                                                            <strong className="font-display">{track.stats.essaysSubmitted}</strong>
                                                            <span>Essays</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="post dm-empty prof-empty" style={{ marginBottom: 18 }}>
                                            <Icons.Search className="w-[30px] h-[30px]" />
                                            <p>Radar empty</p>
                                            <span>Find people to track on the Study Wall.</span>
                                        </div>
                                    )}

                                    <p style={eyebrow}>Observers · watching your progress</p>
                                    <div className="post">
                                        {observerList.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {observerList.map(obs => (
                                                    <div key={obs.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        {obs.observerAvatar ? (
                                                            <img src={obs.observerAvatar} alt="" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', opacity: 0.8 }} />
                                                        ) : (
                                                            <span style={{ width: 32, height: 32, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 13 }}>
                                                                {(obs.observerName || 'O').charAt(0)}
                                                            </span>
                                                        )}
                                                        <div>
                                                            <strong style={{ fontSize: '0.86rem', color: 'var(--ink)' }}>{obs.observerName}</strong>
                                                            <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Silent observer</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>No observers yet.</p>
                                        )}
                                        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                                            Observers receive updates on your public activity (mocks, doubts). They cannot DM you unless aligned.
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </main>

                {/* ---------- Boundary modal ---------- */}
                {boundaryTarget && (
                    <div className="modal-veil" onClick={(e) => { if (e.target === e.currentTarget) setBoundaryTarget(null); }}>
                        <div className="clay-modal" style={{ maxWidth: 480 }} role="dialog" aria-modal="true" aria-label="Contract boundary">
                            <header className="composer-head" style={{ marginBottom: 14 }}>
                                <h3>Contract boundary</h3>
                                <button type="button" className="composer-x" onClick={() => setBoundaryTarget(null)} aria-label="Close">
                                    <Icons.Plus className="w-[18px] h-[18px] rotate-45" />
                                </button>
                            </header>
                            <p style={{ ...eyebrow, marginBottom: 16 }}>Managing · {boundaryTarget.peerName}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button type="button" className="clay-option" onClick={() => handleBoundaryAction('PAUSE')}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <Icons.Clock className="w-4 h-4" /> Pause contract (7 days)
                                    </span>
                                    <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>Suspend expectations — streak frozen.</span>
                                </button>
                                <button type="button" className="clay-option" onClick={() => handleBoundaryAction('RESTRICT', ['NO_ESSAYS'])}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <Icons.Lock className="w-4 h-4" /> Restrict scope
                                    </span>
                                    <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>Limit interactions to MCQs only — no essays.</span>
                                </button>
                                <button type="button" className="clay-option" onClick={() => handleBoundaryAction('END')}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <Icons.Trash2 className="w-4 h-4" /> Conclude contract
                                    </span>
                                    <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>Archive this connection cleanly. No notification sent.</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
