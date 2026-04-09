/**
 * TestCenterAdmin — Prometric-style proctor dashboard.
 * Aesthetic: "Mission Control" — dense, precise, authoritative.
 * Features: session CRUD, candidate roster + search, check-in, live monitor + timer, results + score bars.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icons } from '../Icons';
import {
    EXAM_CONFIGS,
    createTestCenterSession,
    getTestCenterSessions,
    getTestCenterStations,
    updateTestCenterStatus,
    subscribeToStations,
    broadcastToStations,
    getSessionCandidates,
    addCandidate,
    bulkImportCandidates,
    checkInCandidate,
    assignCandidateToStation,
    updateCandidateStatus,
    deleteCandidate,
    subscribeToCandidates,
    updateTestCenterSession,
    deleteTestCenterSession,
    getTestCenterExamResults,
    TestCenterSession,
    TestCenterStation,
    TestCenterCandidate,
} from '../../services/examService';

/** Local 1s tick — keeps clocks off the main dashboard state to avoid full-tree re-renders (reduces flicker with heavy shadows). */
const LiveClock = ({ className, withSeconds }: { className?: string; withSeconds?: boolean }) => {
    const [t, setT] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <span className={className}>
            {t.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                ...(withSeconds ? { second: '2-digit' as const } : {}),
            })}
        </span>
    );
};

const SessionElapsedBadge = ({ actualStart }: { actualStart?: string | null }) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!actualStart) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [actualStart]);
    if (!actualStart) return null;
    const diff = Math.floor((now - new Date(actualStart).getTime()) / 1000);
    if (diff < 0) return null;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const str = `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return <span className="f-mono text-[11px] text-[#8dc63f]/70 tracking-wider">{str}</span>;
};

interface TestCenterAdminProps {
    userId: string;
    onLogout?: () => void;
}

type View = 'LIST' | 'CREATE' | 'EDIT' | 'MANAGE';
type ManageTab = 'CANDIDATES' | 'CHECK_IN' | 'MONITOR' | 'RESULTS';

/* ─── Reusable style fragments (light neumorphic — matches ExamApp PORTAL_CSS) ─── */
const S = {
    input: 'f-body w-full rounded-xl ep-neu-inset border-0 px-4 py-3 text-slate-800 placeholder:text-slate-500 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#8dc63f]/35',
    inputSm: 'f-body w-full rounded-lg ep-neu-inset border-0 px-3.5 py-2.5 text-slate-800 placeholder:text-slate-500 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#8dc63f]/35',
    btnPrimary: 'ep-shimmer rounded-xl bg-gradient-to-r from-[#8dc63f] via-[#7db536] to-[#6ba52e] text-white font-semibold text-sm transition-all duration-200 shadow-[0_4px_16px_rgba(141,198,63,0.15)] hover:shadow-[0_6px_24px_rgba(141,198,63,0.25)] hover:-translate-y-px active:translate-y-px disabled:opacity-35 disabled:hover:translate-y-0',
    btnGhost: 'rounded-lg ep-neu-raised-sm bg-[#f6faf3]/90 border border-[#8dc63f]/18 text-slate-600 font-semibold text-sm transition-all duration-200 hover:bg-[#eef5ea] hover:border-[#8dc63f]/28 hover:text-slate-800 active:translate-y-px',
    btnDanger: 'rounded-lg bg-red-500/[0.08] border border-red-500/22 text-red-700 font-semibold text-sm transition-all duration-200 hover:bg-red-500/[0.14] hover:border-red-500/30 active:translate-y-px',
    card: 'ep-neu-panel rounded-2xl',
    cardInteractive: 'ep-neu-panel rounded-2xl transition-all duration-200 hover:shadow-[0_14px_36px_rgba(95,115,88,0.2)]',
    table: 'rounded-2xl ep-neu-panel overflow-hidden',
    badge: (color: 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'cyan') => {
        const m: Record<string, string> = {
            green: 'bg-[#8dc63f]/[0.12] text-[#3d6220] border-[#8dc63f]/25',
            blue: 'bg-blue-400/[0.12] text-blue-800 border-blue-400/25',
            amber: 'bg-amber-400/[0.12] text-amber-900 border-amber-400/25',
            red: 'bg-red-400/[0.12] text-red-800 border-red-400/25',
            slate: 'bg-slate-400/[0.12] text-slate-700 border-slate-400/22',
            cyan: 'bg-cyan-400/[0.12] text-cyan-900 border-cyan-400/25',
        };
        return `f-mono inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] tracking-[0.05em] font-medium uppercase border ${m[color] || m.slate}`;
    },
};

// CSV parser
function parseCSV(text: string): { full_name: string; email?: string; phone?: string; candidate_id?: string }[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const nameIdx = header.findIndex(h => /^(full_?name|name|candidate_?name|student_?name)$/.test(h));
    const emailIdx = header.findIndex(h => /^(email|e-?mail)$/.test(h));
    const phoneIdx = header.findIndex(h => /^(phone|mobile|contact)$/.test(h));
    const idIdx = header.findIndex(h => /^(id|candidate_?id|roll_?no|reg_?no|registration)$/.test(h));
    if (nameIdx === -1) return [];
    return lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return { full_name: cols[nameIdx] || '', email: emailIdx >= 0 ? cols[emailIdx] : undefined, phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined, candidate_id: idIdx >= 0 ? cols[idIdx] : undefined };
    }).filter(c => c.full_name.length > 0);
}

/* ─── Mini Score Bar ─── */
const ScoreBar = ({ pct, color }: { pct: number; color: string }) => (
    <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-[5px] rounded-full bg-slate-300/50 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, animation: 'bar-fill .8s ease-out' }} />
        </div>
        <span className={`f-mono text-[11px] font-medium ${pct >= 72 ? 'text-[#8dc63f]' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {pct}%
        </span>
    </div>
);

export const TestCenterAdmin: React.FC<TestCenterAdminProps> = ({ userId, onLogout }) => {
    const [view, setView] = useState<View>('LIST');
    const [sessions, setSessions] = useState<TestCenterSession[]>([]);
    const [activeSession, setActiveSession] = useState<TestCenterSession | null>(null);
    const [stations, setStations] = useState<TestCenterStation[]>([]);
    const [candidates, setCandidates] = useState<TestCenterCandidate[]>([]);
    const [examResults, setExamResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [manageTab, setManageTab] = useState<ManageTab>('CANDIDATES');

    // Create/Edit form
    const [formName, setFormName] = useState('');
    const [formConfig, setFormConfig] = useState('full-standard');
    const [formStations, setFormStations] = useState(30);
    const [creating, setCreating] = useState(false);

    // Candidate add
    const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', candidate_id: '' });
    const [addingCandidate, setAddingCandidate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<string | null>(null);

    // Check-in
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [assignStation, setAssignStation] = useState<number | ''>('');

    // ─── NEW: Search ───
    const [searchQuery, setSearchQuery] = useState('');

    // ─── NEW: Copy URL feedback ───
    const [copied, setCopied] = useState(false);
    const copyUrl = useCallback((url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    // Load sessions
    useEffect(() => {
        getTestCenterSessions(userId).then(data => { setSessions(data); setLoading(false); });
    }, [userId]);

    // Subscriptions when managing
    useEffect(() => {
        if (view !== 'MANAGE' || !activeSession) return;
        getTestCenterStations(activeSession.id).then(setStations);
        getSessionCandidates(activeSession.id).then(setCandidates);
        const u1 = subscribeToStations(activeSession.id, setStations);
        const u2 = subscribeToCandidates(activeSession.id, setCandidates);
        return () => { u1(); u2(); };
    }, [view, activeSession]);

    // Load results
    useEffect(() => {
        if (manageTab !== 'RESULTS' || !activeSession) return;
        getTestCenterExamResults(activeSession.id).then(setExamResults);
    }, [manageTab, activeSession]);

    // ==========================================
    // SESSION HANDLERS
    // ==========================================
    const handleCreate = async () => {
        if (!formName.trim()) return;
        setCreating(true);
        const session = await createTestCenterSession(userId, formName.trim(), formConfig, formStations, { lockBrowser: true, allowCalculator: true });
        if (session) {
            setSessions(prev => [session, ...prev]);
            setActiveSession(session);
            setView('MANAGE');
            setManageTab('CANDIDATES');
        }
        setCreating(false);
    };

    const handleSaveEdit = async () => {
        if (!activeSession || !formName.trim()) return;
        setCreating(true);
        const ok = await updateTestCenterSession(activeSession.id, { name: formName.trim(), exam_config_key: formConfig });
        if (ok) {
            const updated = { ...activeSession, name: formName.trim(), exam_config_key: formConfig };
            setActiveSession(updated);
            setSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s));
            setView('MANAGE');
        }
        setCreating(false);
    };

    const handleDeleteSession = async (session: TestCenterSession) => {
        if (!confirm(`Delete "${session.name}"? This will remove all stations, candidates, and data.`)) return;
        const ok = await deleteTestCenterSession(session.id);
        if (ok) {
            setSessions(prev => prev.filter(s => s.id !== session.id));
            if (activeSession?.id === session.id) { setActiveSession(null); setView('LIST'); }
        }
    };

    const handleOpenSession = (session: TestCenterSession) => {
        setActiveSession(session);
        setView('MANAGE');
        setManageTab(session.status === 'LIVE' ? 'MONITOR' : 'CANDIDATES');
    };

    const handleEditSession = (session: TestCenterSession) => {
        setActiveSession(session);
        setFormName(session.name);
        setFormConfig(session.exam_config_key);
        setFormStations(session.station_count);
        setView('EDIT');
    };

    // ==========================================
    // CANDIDATE HANDLERS
    // ==========================================
    const handleAddCandidate = async () => {
        if (!addForm.full_name.trim() || !activeSession) return;
        setAddingCandidate(true);
        const c = await addCandidate(activeSession.id, { full_name: addForm.full_name.trim(), email: addForm.email.trim() || undefined, phone: addForm.phone.trim() || undefined, candidate_id: addForm.candidate_id.trim() || undefined });
        if (c) { setCandidates(prev => [...prev, c]); setAddForm({ full_name: '', email: '', phone: '', candidate_id: '' }); }
        setAddingCandidate(false);
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSession) return;
        setImporting(true); setImportResult(null);
        try {
            const text = await file.text();
            const parsed = parseCSV(text);
            if (parsed.length === 0) { setImportResult('No valid rows found.'); }
            else { const count = await bulkImportCandidates(activeSession.id, parsed); setImportResult(`${count}/${parsed.length} imported`); getSessionCandidates(activeSession.id).then(setCandidates); }
        } catch { setImportResult('Failed to read file.'); }
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCheckIn = async (id: string) => {
        await checkInCandidate(id, userId);
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'CHECKED_IN' as const, checked_in_at: new Date().toISOString() } : c));
    };

    const handleAssignStation = async () => {
        if (!selectedCandidate || !assignStation || !activeSession) return;
        const ok = await assignCandidateToStation(selectedCandidate, Number(assignStation));
        if (ok) {
            setCandidates(prev => prev.map(c => c.id === selectedCandidate ? { ...c, status: 'ASSIGNED' as const, assigned_station: Number(assignStation), assigned_at: new Date().toISOString() } : c));
            setSelectedCandidate(null); setAssignStation('');
        }
    };

    const handleMarkNoShow = async (id: string) => {
        await updateCandidateStatus(id, 'NO_SHOW');
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'NO_SHOW' as const } : c));
    };

    const handleDeleteCandidate = async (id: string) => {
        await deleteCandidate(id);
        setCandidates(prev => prev.filter(c => c.id !== id));
    };

    const handleBroadcast = async (command: 'START' | 'PAUSE' | 'RESUME' | 'ADD_TIME' | 'FORCE_SUBMIT') => {
        if (!activeSession) return;
        if (command === 'START') { await updateTestCenterStatus(activeSession.id, 'LIVE', { actual_start: new Date().toISOString() }); setActiveSession({ ...activeSession, status: 'LIVE' }); }
        else if (command === 'FORCE_SUBMIT') { await updateTestCenterStatus(activeSession.id, 'COMPLETED', { completed_at: new Date().toISOString() }); setActiveSession({ ...activeSession, status: 'COMPLETED' }); }
        await broadcastToStations(activeSession.id, command, { addMinutes: command === 'ADD_TIME' ? 15 : undefined });
    };

    // ==========================================
    // HELPERS
    // ==========================================
    const statusColor = (status: string): 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'cyan' => {
        const m: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'cyan'> = {
            SETUP: 'amber', READY: 'blue', LIVE: 'green', COMPLETED: 'slate', CANCELLED: 'red',
            REGISTERED: 'slate', CHECKED_IN: 'blue', ASSIGNED: 'amber', IN_EXAM: 'green', NO_SHOW: 'red', IN_PROGRESS: 'green',
        };
        return m[status] || 'slate';
    };

    const stationTileClass = (s: TestCenterStation) => {
        const hb = s.last_heartbeat ? new Date(s.last_heartbeat) : null;
        const stale = hb && (Date.now() - hb.getTime() > 90000);
        if (stale) return 'border-red-400/35 bg-red-50/90 text-red-800';
        switch (s.status) {
            case 'ACTIVE': return 'border-[#8dc63f]/35 bg-[#f0f7ec] text-[#3d6220]';
            case 'READY': return 'border-blue-400/35 bg-blue-50/90 text-blue-800';
            case 'SUBMITTED': return 'border-slate-300/50 bg-slate-100/80 text-slate-600';
            case 'ASSIGNED': return 'border-amber-400/35 bg-amber-50/90 text-amber-900';
            default: return 'border-slate-200/80 bg-white/70 text-slate-700';
        }
    };

    const getCandidateForStation = (num: number) => candidates.find(c => c.assigned_station === num);

    const stats = {
        ready: stations.filter(s => s.status === 'READY').length,
        active: stations.filter(s => s.status === 'ACTIVE').length,
        submitted: stations.filter(s => s.status === 'SUBMITTED').length,
        disconnected: stations.filter(s => { const hb = s.last_heartbeat ? new Date(s.last_heartbeat) : null; return hb && (Date.now() - hb.getTime() > 90000); }).length,
        flags: stations.reduce((sum, s) => sum + (s.proctoring_events?.length || 0), 0),
    };
    const cStats = {
        total: candidates.length,
        registered: candidates.filter(c => c.status === 'REGISTERED').length,
        checkedIn: candidates.filter(c => c.status === 'CHECKED_IN').length,
        assigned: candidates.filter(c => c.status === 'ASSIGNED').length,
        noShow: candidates.filter(c => c.status === 'NO_SHOW').length,
    };

    // ─── Search filter ───
    const filteredCandidates = searchQuery.trim()
        ? candidates.filter(c => {
            const q = searchQuery.toLowerCase();
            return c.full_name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.candidate_id?.toLowerCase().includes(q);
        })
        : candidates;

    // ==========================================
    // SHARED SHELLS
    // ==========================================
    const Shell = ({ children }: { children: React.ReactNode }) => (
        <div className="min-h-screen text-slate-800 f-body relative">
            <div className="relative z-10">{children}</div>
        </div>
    );

    const Header = ({ title, subtitle, showBack, backTo, right }: { title: string; subtitle?: string; showBack?: boolean; backTo?: () => void; right?: React.ReactNode }) => (
        <header className="ep-neu-topbar backdrop-blur-sm border-b border-white/50 px-6 py-4 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button onClick={backTo} className="w-8 h-8 rounded-lg ep-neu-raised-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all">
                            <Icons.ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div className="ep-neu-raised-sm w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#f4faf2] to-[#dce8d8] shrink-0">
                        <Icons.Shield className="w-[18px] h-[18px] text-[#4a7a1c]" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-wide text-slate-800">{title}</h1>
                        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <LiveClock className="f-mono text-[11px] text-slate-600 tracking-wider hidden md:block" />
                    {right}
                    {onLogout && (
                        <button onClick={onLogout} className={`${S.btnGhost} px-3.5 py-2 text-xs`}>Sign Out</button>
                    )}
                </div>
            </div>
        </header>
    );

    // ==========================================
    // VIEW: SESSION LIST
    // ==========================================
    if (view === 'LIST') {
        return (
            <Shell>
                <Header title="Test Center" subtitle="Session management & exam administration" />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-8 ep-up">
                        <div>
                            <h2 className="f-display text-2xl font-semibold tracking-tight">Exam Sessions</h2>
                            <p className="text-slate-600 text-xs mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''} total</p>
                        </div>
                        <button onClick={() => { setFormName(''); setFormConfig('full-standard'); setFormStations(30); setView('CREATE'); }}
                            className={`${S.btnPrimary} px-5 py-2.5 flex items-center gap-2`}>
                            <Icons.Plus className="w-4 h-4" /> New Session
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24">
                            <div className="ep-neu-raised w-14 h-14 rounded-[18px] flex items-center justify-center bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
                                <Icons.CloudSync className="w-6 h-6 animate-spin text-[#4a7a1c]" />
                            </div>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-28 ep-up">
                            <div className="w-20 h-20 rounded-[26px] ep-neu-raised flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
                                <Icons.Shield className="w-9 h-9 text-[#4a7a1c]" />
                            </div>
                            <h3 className="f-display text-xl font-semibold text-slate-500 mb-2">No Sessions Yet</h3>
                            <p className="text-slate-600 text-sm mb-8 max-w-xs mx-auto">Create your first exam session to begin managing candidates and workstations.</p>
                            <button onClick={() => setView('CREATE')} className={`${S.btnPrimary} px-7 py-3`}>Create Session</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session, i) => {
                                const config = EXAM_CONFIGS[session.exam_config_key];
                                return (
                                    <div key={session.id}
                                        className={`${S.cardInteractive} p-5 cursor-pointer group ep-up`}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                        onClick={() => handleOpenSession(session)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h3 className="font-bold text-slate-800 text-[15px] truncate">{session.name}</h3>
                                                    <span className={S.badge(statusColor(session.status))}>
                                                        {session.status === 'LIVE' && <span className="w-[5px] h-[5px] rounded-full bg-current mr-1.5 ep-pulse-dot inline-block" />}
                                                        {session.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-5 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5"><Icons.FileText className="w-3 h-3 text-slate-600" />{config?.title || session.exam_config_key}</span>
                                                    <span className="flex items-center gap-1.5"><Icons.Grid className="w-3 h-3 text-slate-600" />{session.station_count} stations</span>
                                                    <span className="f-mono text-slate-600">{new Date(session.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                {session.status !== 'LIVE' && (
                                                    <button onClick={() => handleEditSession(session)} className={`${S.btnGhost} px-3 py-1.5 text-[11px]`}>Edit</button>
                                                )}
                                                {['SETUP', 'COMPLETED', 'CANCELLED'].includes(session.status) && (
                                                    <button onClick={() => handleDeleteSession(session)} className={`${S.btnDanger} px-3 py-1.5 text-[11px]`}>Delete</button>
                                                )}
                                                <Icons.ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Shell>
        );
    }

    // ==========================================
    // VIEW: CREATE / EDIT
    // ==========================================
    if (view === 'CREATE' || view === 'EDIT') {
        const isEdit = view === 'EDIT';
        return (
            <Shell>
                <Header title={isEdit ? 'Edit Session' : 'New Exam Session'} showBack backTo={() => setView(isEdit ? 'MANAGE' : 'LIST')} />
                <div className="max-w-lg mx-auto px-6 py-8">
                    <div className={`${S.card} p-8 space-y-6 ep-up`}>
                        <div className="space-y-2">
                            <label className="f-mono text-[9px] text-slate-500 tracking-[0.2em] uppercase pl-1">Session Name</label>
                            <input type="text" placeholder="e.g., April 2026 Part 1 Batch" value={formName} onChange={e => setFormName(e.target.value)} className={S.input} />
                        </div>
                        <div className="space-y-2">
                            <label className="f-mono text-[9px] text-slate-500 tracking-[0.2em] uppercase pl-1">Exam Configuration</label>
                            <select value={formConfig} onChange={e => setFormConfig(e.target.value)}
                                className={`${S.input} cursor-pointer`}>
                                {Object.entries(EXAM_CONFIGS).map(([key, config]) => (
                                    <option key={key} value={key} className="bg-[#eef2ec] text-slate-800">{config.title} ({config.mcqCount} MCQ + {config.essayCount} Essay)</option>
                                ))}
                            </select>
                        </div>
                        {!isEdit && (
                            <div className="space-y-2">
                                <label className="f-mono text-[9px] text-slate-500 tracking-[0.2em] uppercase pl-1">Workstations</label>
                                <input type="number" min={1} max={100} value={formStations} onChange={e => setFormStations(Number(e.target.value))} className={S.input} />
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setView(isEdit ? 'MANAGE' : 'LIST')} className={`flex-1 ${S.btnGhost} py-3.5`}>Cancel</button>
                            <button onClick={isEdit ? handleSaveEdit : handleCreate} disabled={!formName.trim() || creating}
                                className={`flex-1 ${S.btnPrimary} py-3.5`}>
                                {creating ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Session'}
                            </button>
                        </div>
                    </div>
                </div>
            </Shell>
        );
    }

    // ==========================================
    // VIEW: MANAGE SESSION
    // ==========================================
    if (view === 'MANAGE' && activeSession) {
        const config = EXAM_CONFIGS[activeSession.exam_config_key];
        const cols = Math.min(6, Math.ceil(Math.sqrt(activeSession.station_count)));

        return (
            <Shell>
                {/* ─── Session Header ─── */}
                <header className="ep-neu-topbar backdrop-blur-sm border-b border-white/50 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => { setView('LIST'); setActiveSession(null); }}
                                className="w-8 h-8 rounded-lg ep-neu-raised-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all">
                                <Icons.ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="ep-neu-raised-sm w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#f4faf2] to-[#dce8d8] shrink-0">
                                <Icons.Shield className="w-[18px] h-[18px] text-[#4a7a1c]" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-sm font-bold truncate text-slate-800">{activeSession.name}</h1>
                                    <span className={S.badge(statusColor(activeSession.status))}>
                                        {activeSession.status === 'LIVE' && <span className="w-[5px] h-[5px] rounded-full bg-current mr-1.5 ep-pulse-dot inline-block" />}
                                        {activeSession.status}
                                    </span>
                                    <SessionElapsedBadge actualStart={activeSession.settings?.actual_start} />
                                </div>
                                <span className="text-[11px] text-slate-500">{config?.title || activeSession.exam_config_key}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex items-center gap-2 f-mono text-[10px]">
                                <span className="px-2.5 py-1 rounded-lg bg-white/70 border border-[#8dc63f]/15 text-slate-600">{cStats.total} cand.</span>
                                {cStats.checkedIn > 0 && <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800">{cStats.checkedIn} in</span>}
                                {cStats.assigned > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900">{cStats.assigned} asgn</span>}
                            </div>
                            <LiveClock withSeconds className="f-mono text-[11px] text-slate-600 hidden md:block" />
                            {onLogout && <button onClick={onLogout} className={`${S.btnGhost} px-3.5 py-2 text-xs`}>Sign Out</button>}
                        </div>
                    </div>

                    {/* ─── Tab bar + controls ─── */}
                    <div className="max-w-7xl mx-auto px-6 pb-3 flex items-center gap-3">
                        <nav className="flex items-center gap-0.5 rounded-xl ep-neu-toggle-pit p-1 border border-[#8dc63f]/12">
                            {(['CANDIDATES', 'CHECK_IN', 'MONITOR', 'RESULTS'] as ManageTab[]).map(tab => (
                                <button key={tab} onClick={() => setManageTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                                        manageTab === tab
                                            ? 'ep-neu-toggle-active shadow-[0_2px_10px_rgba(141,198,63,0.2)]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                    }`}>
                                    {tab === 'CANDIDATES' ? 'Candidates' : tab === 'CHECK_IN' ? 'Check-In' : tab === 'MONITOR' ? 'Monitor' : 'Results'}
                                </button>
                            ))}
                        </nav>

                        {/* Broadcast controls */}
                        {manageTab === 'MONITOR' && activeSession.status === 'LIVE' && (
                            <div className="ml-auto flex items-center gap-2">
                                <button onClick={() => handleBroadcast('PAUSE')} className={`${S.btnGhost} px-3.5 py-2 text-[11px] flex items-center gap-1.5 !text-amber-400 !border-amber-400/15 !bg-amber-400/[0.06]`}>
                                    <Icons.Clock className="w-3.5 h-3.5" /> Pause
                                </button>
                                <button onClick={() => handleBroadcast('RESUME')} className={`${S.btnGhost} px-3.5 py-2 text-[11px] flex items-center gap-1.5 !text-blue-400 !border-blue-400/15 !bg-blue-400/[0.06]`}>
                                    <Icons.Zap className="w-3.5 h-3.5" /> Resume
                                </button>
                                <button onClick={() => handleBroadcast('ADD_TIME')} className={`${S.btnGhost} px-3.5 py-2 text-[11px] flex items-center gap-1.5`}>
                                    <Icons.Clock className="w-3.5 h-3.5" /> +15 min
                                </button>
                                <button onClick={() => { if (confirm('Force submit ALL exams?')) handleBroadcast('FORCE_SUBMIT'); }}
                                    className={`${S.btnDanger} px-3.5 py-2 text-[11px] flex items-center gap-1.5`}>
                                    <Icons.Lock className="w-3.5 h-3.5" /> Force Submit
                                </button>
                            </div>
                        )}
                        {manageTab === 'MONITOR' && ['SETUP', 'READY'].includes(activeSession.status) && (
                            <div className="ml-auto">
                                <button onClick={() => handleBroadcast('START')} disabled={stats.ready === 0}
                                    className={`${S.btnPrimary} px-5 py-2.5 text-[11px] flex items-center gap-2`}>
                                    <Icons.Zap className="w-3.5 h-3.5" /> Start All ({stats.ready} ready)
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* =============== CANDIDATES TAB =============== */}
                {manageTab === 'CANDIDATES' && (
                    <div className="max-w-5xl mx-auto px-6 py-6">
                        {/* Add form */}
                        <div className={`${S.card} p-5 mb-6 ep-up`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="f-mono text-[10px] text-slate-500 tracking-[0.15em] uppercase flex items-center gap-2">
                                    <Icons.Plus className="w-3.5 h-3.5" /> Add Candidates
                                </h3>
                                <div className="flex items-center gap-2">
                                    <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                                        className={`${S.btnGhost} px-3 py-1.5 text-[11px] flex items-center gap-1.5`}>
                                        <Icons.Upload className="w-3.5 h-3.5" /> {importing ? 'Importing...' : 'CSV'}
                                    </button>
                                    {importResult && <span className="text-[#8dc63f] f-mono text-[11px]">{importResult}</span>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Full Name *" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} className={`flex-[2] ${S.inputSm}`} />
                                <input type="email" placeholder="Email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className={`flex-[2] ${S.inputSm}`} />
                                <input type="text" placeholder="Phone" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} className={`flex-1 ${S.inputSm}`} />
                                <input type="text" placeholder="ID" value={addForm.candidate_id} onChange={e => setAddForm(f => ({ ...f, candidate_id: e.target.value }))} className={`flex-1 ${S.inputSm}`} />
                                <button onClick={handleAddCandidate} disabled={!addForm.full_name.trim() || addingCandidate}
                                    className={`${S.btnPrimary} px-5 py-2.5 text-xs`}>{addingCandidate ? '...' : 'Add'}</button>
                            </div>
                        </div>

                        {/* Search + table */}
                        {candidates.length > 0 && (
                            <div className="mb-4 ep-up ep-up-1">
                                <div className="relative max-w-xs">
                                    <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input type="text" placeholder="Search candidates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        className={`${S.inputSm} !pl-10`} />
                                </div>
                            </div>
                        )}

                        {candidates.length === 0 ? (
                            <div className="text-center py-20 ep-up ep-up-1">
                                <Icons.User className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No candidates added yet.</p>
                            </div>
                        ) : (
                            <div className={`${S.table} ep-up ep-up-2`}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#eef5ea]/70 f-mono text-slate-600 text-[9px] tracking-[0.12em] uppercase border-b border-slate-200/60">
                                            <th className="text-left px-4 py-3 font-medium">#</th>
                                            <th className="text-left px-4 py-3 font-medium">Name</th>
                                            <th className="text-left px-4 py-3 font-medium">Email</th>
                                            <th className="text-left px-4 py-3 font-medium">Phone</th>
                                            <th className="text-left px-4 py-3 font-medium">ID</th>
                                            <th className="text-left px-4 py-3 font-medium">Status</th>
                                            <th className="text-left px-4 py-3 font-medium">Stn</th>
                                            <th className="text-right px-4 py-3 font-medium" />
                                        </tr>
                                    </thead>
                                    <tbody>{filteredCandidates.map((c, i) => (
                                        <tr key={c.id} className="border-t border-slate-200/70 hover:bg-white/55 transition-colors">
                                            <td className="px-4 py-3 f-mono text-slate-600 text-xs">{i + 1}</td>
                                            <td className="px-4 py-3 text-slate-800 font-semibold">{c.full_name}</td>
                                            <td className="px-4 py-3 text-slate-400 text-xs">{c.email || '—'}</td>
                                            <td className="px-4 py-3 text-slate-400 f-mono text-xs">{c.phone || '—'}</td>
                                            <td className="px-4 py-3 text-slate-400 f-mono text-xs">{c.candidate_id || '—'}</td>
                                            <td className="px-4 py-3"><span className={S.badge(statusColor(c.status))}>{c.status}</span></td>
                                            <td className="px-4 py-3 f-mono text-slate-400 text-xs">{c.assigned_station ? c.assigned_station : '—'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {c.status === 'REGISTERED' && <button onClick={() => handleDeleteCandidate(c.id)} className="text-red-400/50 hover:text-red-400 f-mono text-[10px] transition-colors">Remove</button>}
                                            </td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                                {searchQuery && filteredCandidates.length === 0 && (
                                    <div className="py-8 text-center text-slate-600 text-sm">No candidates match "{searchQuery}"</div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* =============== CHECK-IN TAB =============== */}
                {manageTab === 'CHECK_IN' && (
                    <div className="max-w-6xl mx-auto px-6 py-6">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Queue */}
                            <div>
                                <h3 className="f-mono text-[10px] text-slate-500 tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
                                    <Icons.Users className="w-3.5 h-3.5" /> Queue
                                    <span className="text-slate-600">({cStats.registered} waiting, {cStats.checkedIn} verified)</span>
                                </h3>
                                <div className="space-y-2.5 max-h-[70vh] overflow-y-auto ep-scroll pr-1">
                                    {candidates.filter(c => c.status === 'REGISTERED' || c.status === 'CHECKED_IN').length === 0 && (
                                        <div className={`${S.card} p-8 text-center`}>
                                            <p className="text-slate-600 text-sm">{candidates.length === 0 ? 'Add candidates first.' : 'All assigned or marked.'}</p>
                                        </div>
                                    )}
                                    {candidates.filter(c => c.status === 'REGISTERED' || c.status === 'CHECKED_IN').map(c => (
                                        <div key={c.id}
                                            className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                                                selectedCandidate === c.id
                                                    ? 'border-[#8dc63f]/35 bg-[#f0f7ec] shadow-[0_0_0_1px_rgba(141,198,63,0.15)]'
                                                    : 'border-slate-200/80 bg-white/75 hover:border-[#8dc63f]/25 ep-neu-raised-sm'
                                            }`}
                                            onClick={() => setSelectedCandidate(c.id)}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-slate-800 font-semibold text-sm truncate">{c.full_name}</div>
                                                    <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                                                        {c.candidate_id && <span className="mr-3">ID: {c.candidate_id}</span>}
                                                        {c.email && <span>{c.email}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={S.badge(statusColor(c.status))}>{c.status === 'CHECKED_IN' ? 'VERIFIED' : 'WAITING'}</span>
                                                    {c.status === 'REGISTERED' && (
                                                        <button onClick={e => { e.stopPropagation(); handleCheckIn(c.id); }}
                                                            className={`${S.btnGhost} px-2.5 py-1 text-[10px] !text-blue-400 !border-blue-400/15 !bg-blue-400/[0.06]`}>
                                                            Verify
                                                        </button>
                                                    )}
                                                    <button onClick={e => { e.stopPropagation(); handleMarkNoShow(c.id); }}
                                                        className="text-red-400/40 hover:text-red-400 text-[10px] font-medium transition-colors">No-Show</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {candidates.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_EXAM').length > 0 && (
                                        <>
                                            <p className="f-mono text-[9px] text-slate-600 tracking-[0.15em] uppercase mt-5 mb-1 pl-1">Assigned</p>
                                            {candidates.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_EXAM').map(c => (
                                                <div key={c.id} className="rounded-xl border border-slate-200/60 bg-slate-100/50 p-3 opacity-70">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400 text-sm font-medium">{c.full_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="f-mono text-[#8dc63f] text-[10px]">STN {c.assigned_station}</span>
                                                            <span className={S.badge(statusColor(c.status))}>{c.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Assign panel */}
                            <div>
                                <h3 className="f-mono text-[10px] text-slate-500 tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
                                    <Icons.Grid className="w-3.5 h-3.5" /> Station Assignment
                                </h3>
                                {selectedCandidate ? (() => {
                                    const c = candidates.find(x => x.id === selectedCandidate);
                                    if (!c) return null;
                                    return (
                                        <div className={`${S.card} p-6`}>
                                            <div className="mb-5">
                                                <div className="text-slate-800 font-bold text-lg">{c.full_name}</div>
                                                <div className="text-slate-500 text-xs mt-1">
                                                    {c.candidate_id && <span className="mr-4 f-mono">ID: {c.candidate_id}</span>}
                                                    {c.email && <span className="mr-4">{c.email}</span>}
                                                    {c.phone && <span className="f-mono">{c.phone}</span>}
                                                </div>
                                                {c.status === 'REGISTERED' && (
                                                    <div className="mt-3 rounded-lg bg-amber-400/[0.06] border border-amber-400/15 p-3 text-amber-400 text-[11px] font-medium">
                                                        Verify ID before assigning.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mb-5">
                                                <label className="f-mono text-[9px] text-slate-500 tracking-[0.15em] uppercase mb-3 block pl-0.5">Select Station</label>
                                                <div className="grid grid-cols-6 gap-1.5">
                                                    {Array.from({ length: activeSession.station_count }, (_, i) => i + 1).map(stn => {
                                                        const occ = candidates.find(x => x.assigned_station === stn && x.id !== selectedCandidate);
                                                        const sel = assignStation === stn;
                                                        return (
                                                            <button key={stn} disabled={!!occ} onClick={() => setAssignStation(stn)}
                                                                className={`py-2 rounded-lg f-mono text-xs font-medium transition-all duration-200 ${
                                                                    sel
                                                                        ? 'bg-[#8dc63f] text-white shadow-[0_4px_12px_rgba(141,198,63,0.25)] scale-105'
                                                                        : occ
                                                                            ? 'bg-slate-200/80 text-slate-600 cursor-not-allowed border border-slate-300/60'
                                                                            : 'ep-neu-inset border-0 text-slate-700 hover:ring-2 hover:ring-[#8dc63f]/30'
                                                                }`}>
                                                                {stn}
                                                                {occ && <div className="text-[7px] font-normal truncate px-0.5 opacity-60">{occ.full_name.split(' ')[0]}</div>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <button onClick={handleAssignStation} disabled={!assignStation || c.status === 'REGISTERED'}
                                                className={`w-full ${S.btnPrimary} py-3.5`}>
                                                {c.status === 'REGISTERED' ? 'Verify ID First' : assignStation ? `Assign ${c.full_name.split(' ')[0]} to Station ${assignStation}` : 'Select a Station'}
                                            </button>
                                        </div>
                                    );
                                })() : (
                                    <div className={`${S.card} p-12 text-center`}>
                                        <Icons.User className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">Select a candidate from the queue</p>
                                    </div>
                                )}

                                {/* URL card */}
                                <div className="mt-4 rounded-xl bg-[#8dc63f]/[0.04] border border-[#8dc63f]/10 p-4">
                                    <p className="text-[#8dc63f] text-xs font-semibold mb-2 flex items-center gap-1.5">
                                        <Icons.Link className="w-3.5 h-3.5" /> Workstation URL
                                    </p>
                                    <code className="f-mono text-[10px] text-slate-500 break-all block mb-3">{window.location.origin}/exam?center={activeSession.id}&station=N</code>
                                    <button onClick={() => copyUrl(`${window.location.origin}/exam?center=${activeSession.id}&station=`)}
                                        className={`${S.btnGhost} px-3 py-1.5 text-[10px] flex items-center gap-1.5`}>
                                        <Icons.Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy Base URL'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =============== MONITOR TAB =============== */}
                {manageTab === 'MONITOR' && (
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        {/* Stats bar */}
                        <div className="flex items-center gap-3 mb-5">
                            {[
                                { n: stats.active, label: 'Active', color: 'green' as const },
                                { n: stats.ready, label: 'Ready', color: 'blue' as const },
                                { n: stats.submitted, label: 'Done', color: 'slate' as const },
                                ...(stats.disconnected > 0 ? [{ n: stats.disconnected, label: 'Disconnected', color: 'red' as const }] : []),
                                ...(stats.flags > 0 ? [{ n: stats.flags, label: 'Flags', color: 'amber' as const }] : []),
                            ].map(s => (
                                <div key={s.label} className={`${S.card} px-4 py-2.5 flex items-center gap-3`}>
                                    <span className={`f-display text-2xl font-semibold ${
                                        s.color === 'green' ? 'text-[#8dc63f]' : s.color === 'blue' ? 'text-blue-400' : s.color === 'amber' ? 'text-amber-400' : s.color === 'red' ? 'text-red-400' : 'text-slate-400'
                                    }`}>{s.n}</span>
                                    <span className="f-mono text-[9px] text-slate-500 tracking-[0.1em] uppercase">{s.label}</span>
                                </div>
                            ))}
                            <div className="flex-1" />
                            <button onClick={() => copyUrl(`${window.location.origin}/exam?center=${activeSession.id}&station=`)}
                                className={`${S.btnGhost} px-3 py-1.5 text-[10px] flex items-center gap-1.5`}>
                                <Icons.Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'URL'}
                            </button>
                        </div>

                        {/* Station grid */}
                        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                            {stations.map(station => {
                                const cand = getCandidateForStation(station.station_number);
                                const flags = station.proctoring_events?.length || 0;
                                const isActive = station.status === 'ACTIVE';
                                return (
                                    <div key={station.id}
                                        className={`rounded-xl border p-3.5 transition-all duration-300 ${stationTileClass(station)} ${isActive ? 'ep-ring' : ''}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="f-mono text-xs font-semibold tracking-wider">
                                                {station.station_number < 10 ? '0' : ''}{station.station_number}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {flags > 0 && (
                                                    <span className="bg-amber-400/[0.15] text-amber-400 f-mono text-[8px] font-medium px-1.5 py-0.5 rounded border border-amber-400/15">
                                                        {flags}
                                                    </span>
                                                )}
                                                {isActive && <div className="w-[6px] h-[6px] rounded-full bg-[#8dc63f] ep-pulse-dot" />}
                                            </div>
                                        </div>
                                        {cand ? <div className="text-[10px] truncate font-semibold opacity-90 mb-1">{cand.full_name}</div>
                                            : station.candidate_name ? <div className="text-[10px] truncate opacity-50 mb-1">{station.candidate_name}</div>
                                            : <div className="text-[10px] opacity-20 mb-1">Empty</div>}
                                        <div className="f-mono text-[8px] opacity-35 uppercase tracking-wider">{station.status}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 text-[10px]">
                            {[
                                { cls: 'bg-[#8dc63f]/15 border-[#8dc63f]/30', label: 'Active' },
                                { cls: 'bg-blue-400/15 border-blue-400/30', label: 'Ready' },
                                { cls: 'bg-amber-400/15 border-amber-400/30', label: 'Assigned' },
                                { cls: 'bg-slate-400/15 border-slate-400/30', label: 'Submitted' },
                                { cls: 'bg-red-400/15 border-red-400/30', label: 'Disconnected' },
                                { cls: 'bg-slate-100/90 border-slate-300/60', label: 'Empty' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded border ${l.cls}`} />
                                    <span className="text-slate-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* =============== RESULTS TAB =============== */}
                {manageTab === 'RESULTS' && (
                    <div className="max-w-6xl mx-auto px-6 py-6">
                        <div className="flex items-center justify-between mb-5 ep-up">
                            <div>
                                <h3 className="font-bold text-sm">Exam Results</h3>
                                <p className="text-slate-500 text-[11px] mt-0.5">{examResults.length} submission{examResults.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={() => getTestCenterExamResults(activeSession.id).then(setExamResults)}
                                className={`${S.btnGhost} px-3.5 py-2 text-xs flex items-center gap-2`}>
                                <Icons.CloudSync className="w-3.5 h-3.5" /> Refresh
                            </button>
                        </div>

                        {examResults.length === 0 ? (
                            <div className="text-center py-20 ep-up ep-up-1">
                                <Icons.Target className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No submissions yet.</p>
                                <p className="text-slate-600 text-xs mt-1">Results appear after candidates complete their exams.</p>
                            </div>
                        ) : (
                            <div className={`${S.table} ep-up ep-up-1`}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#eef5ea]/70 f-mono text-slate-600 text-[9px] tracking-[0.12em] uppercase border-b border-slate-200/60">
                                            <th className="text-left px-4 py-3 font-medium">#</th>
                                            <th className="text-left px-4 py-3 font-medium">Candidate</th>
                                            <th className="text-left px-4 py-3 font-medium">Stn</th>
                                            <th className="text-left px-4 py-3 font-medium">Status</th>
                                            <th className="text-left px-4 py-3 font-medium">MCQ Score</th>
                                            <th className="text-left px-4 py-3 font-medium">Essay</th>
                                            <th className="text-left px-4 py-3 font-medium">Submitted</th>
                                            <th className="text-left px-4 py-3 font-medium">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>{examResults.map((r, i) => {
                                        const cand = r.test_center_candidate_id ? candidates.find(c => c.id === r.test_center_candidate_id) : null;
                                        const snap = r.submitted_snapshot;
                                        const candName = snap?.candidateInfo?.name || cand?.full_name || r.user_id?.substring(0, 8) || '—';
                                        const stn = snap?.candidateInfo?.station;
                                        const mcqPct = r.mcq_total ? Math.round((r.mcq_correct / r.mcq_total) * 100) : null;
                                        const essayStatus = r.essay_scores ? 'Graded' : 'Pending';
                                        const totalMin = snap?.timing?.totalDurationMinutes || 0;
                                        const remainSec = snap?.timing?.timeRemainingSeconds ?? r.time_remaining_seconds ?? 0;
                                        const usedMin = totalMin > 0 ? Math.round(totalMin - remainSec / 60) : null;
                                        const submittedAt = snap?.timing?.submittedAt || r.last_activity_at;

                                        return (
                                            <tr key={r.id} className="border-t border-slate-200/70 hover:bg-white/55 transition-colors">
                                                <td className="px-4 py-3 f-mono text-slate-600 text-xs">{i + 1}</td>
                                                <td className="px-4 py-3 text-slate-800 font-semibold">{candName}</td>
                                                <td className="px-4 py-3 f-mono text-slate-400 text-xs">{stn || '—'}</td>
                                                <td className="px-4 py-3"><span className={S.badge(statusColor(r.status))}>{r.status}</span></td>
                                                <td className="px-4 py-3">
                                                    {mcqPct !== null ? (
                                                        <div>
                                                            <div className="f-mono text-xs text-slate-400 mb-1">{r.mcq_correct}/{r.mcq_total}</div>
                                                            <ScoreBar pct={mcqPct} color={mcqPct >= 72 ? 'bg-[#8dc63f]' : mcqPct >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
                                                        </div>
                                                    ) : <span className="text-slate-700">—</span>}
                                                </td>
                                                <td className="px-4 py-3"><span className={S.badge(essayStatus === 'Graded' ? 'green' : 'amber')}>{essayStatus}</span></td>
                                                <td className="px-4 py-3 text-slate-400 f-mono text-[11px]">{submittedAt ? new Date(submittedAt).toLocaleString() : '—'}</td>
                                                <td className="px-4 py-3 text-slate-400 f-mono text-[11px]">{usedMin !== null ? `${usedMin}m` : '—'}</td>
                                            </tr>
                                        );
                                    })}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Shell>
        );
    }

    return null;
};
