/**
 * TestCenterAdmin — Prometric-style proctor dashboard with Claymorphism design.
 * Full admin portal: session management, candidate roster, check-in, live monitor, results.
 */
import React, { useState, useEffect, useRef } from 'react';
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

interface TestCenterAdminProps {
    userId: string;
    onLogout?: () => void;
}

type View = 'LIST' | 'CREATE' | 'EDIT' | 'MANAGE';
type ManageTab = 'CANDIDATES' | 'CHECK_IN' | 'MONITOR' | 'RESULTS';

/* ─── Claymorphism Utility Classes ─── */
const clay = {
    card: 'rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] shadow-[8px_8px_24px_rgba(0,0,0,0.35),-4px_-4px_12px_rgba(255,255,255,0.025),inset_1px_1px_1px_rgba(255,255,255,0.07)]',
    cardHover: 'rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] shadow-[8px_8px_24px_rgba(0,0,0,0.35),-4px_-4px_12px_rgba(255,255,255,0.025),inset_1px_1px_1px_rgba(255,255,255,0.07)] hover:border-white/[0.18] hover:shadow-[10px_10px_30px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.03),inset_1px_1px_1px_rgba(255,255,255,0.1)] transition-all duration-300',
    input: 'w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-5 py-3.5 text-white placeholder:text-slate-500/70 text-sm outline-none transition-all duration-300 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.25),inset_-1px_-1px_3px_rgba(255,255,255,0.04)] focus:border-[#8dc63f]/40 focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.25),inset_-1px_-1px_3px_rgba(255,255,255,0.04),0_0_16px_rgba(141,198,63,0.08)]',
    inputSm: 'w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-white placeholder:text-slate-500/70 text-sm outline-none transition-all duration-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.03)] focus:border-[#8dc63f]/40 focus:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),0_0_12px_rgba(141,198,63,0.08)]',
    select: 'w-full rounded-2xl bg-white/[0.06] border border-white/[0.08] px-5 py-3.5 text-white text-sm outline-none transition-all duration-300 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.25)] focus:border-[#8dc63f]/40 appearance-none cursor-pointer',
    btnPrimary: 'rounded-2xl bg-gradient-to-br from-[#8dc63f] to-[#6ba52e] text-white font-bold text-sm transition-all duration-300 shadow-[4px_4px_12px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(141,198,63,0.12),inset_1px_1px_2px_rgba(255,255,255,0.2)] hover:shadow-[6px_6px_18px_rgba(0,0,0,0.4),-3px_-3px_12px_rgba(141,198,63,0.18),inset_1px_1px_2px_rgba(255,255,255,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[2px_2px_6px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(0,0,0,0.1)] disabled:opacity-40 disabled:hover:translate-y-0',
    btnGhost: 'rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 font-bold text-sm transition-all duration-300 shadow-[3px_3px_8px_rgba(0,0,0,0.25),-1px_-1px_4px_rgba(255,255,255,0.02),inset_1px_1px_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.08] hover:border-white/[0.15] hover:translate-y-[-1px] active:translate-y-[1px]',
    btnDanger: 'rounded-xl bg-red-500/[0.1] border border-red-500/20 text-red-400 font-bold text-sm transition-all duration-300 shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_1px_1px_1px_rgba(255,100,100,0.05)] hover:bg-red-500/[0.18] hover:border-red-500/30 hover:translate-y-[-1px] active:translate-y-[1px]',
    pill: (active: boolean) => `px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${active
        ? 'bg-gradient-to-br from-[#8dc63f] to-[#6ba52e] text-white shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(141,198,63,0.1),inset_1px_1px_2px_rgba(255,255,255,0.2)]'
        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'}`,
    badge: (color: string) => {
        const colors: Record<string, string> = {
            green: 'bg-[#8dc63f]/[0.12] text-[#8dc63f] border-[#8dc63f]/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(141,198,63,0.08)]',
            blue: 'bg-blue-400/[0.12] text-blue-400 border-blue-400/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(96,165,250,0.08)]',
            amber: 'bg-amber-400/[0.12] text-amber-400 border-amber-400/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(251,191,36,0.08)]',
            red: 'bg-red-400/[0.12] text-red-400 border-red-400/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15),0_0_8px_rgba(248,113,113,0.08)]',
            slate: 'bg-slate-400/[0.12] text-slate-400 border-slate-400/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]',
        };
        return `px-3 py-1 rounded-xl text-[10px] font-bold uppercase border ${colors[color] || colors.slate}`;
    },
    table: 'rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden shadow-[6px_6px_20px_rgba(0,0,0,0.3),-3px_-3px_10px_rgba(255,255,255,0.02)]',
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

    // Load results when switching to RESULTS tab
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
        const ok = await updateTestCenterSession(activeSession.id, {
            name: formName.trim(),
            exam_config_key: formConfig,
        });
        if (ok) {
            const updated = { ...activeSession, name: formName.trim(), exam_config_key: formConfig };
            setActiveSession(updated);
            setSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s));
            setView('MANAGE');
        }
        setCreating(false);
    };

    const handleDeleteSession = async (session: TestCenterSession) => {
        if (!confirm(`Delete "${session.name}"? This will remove all stations, candidates, and data. This cannot be undone.`)) return;
        const ok = await deleteTestCenterSession(session.id);
        if (ok) {
            setSessions(prev => prev.filter(s => s.id !== session.id));
            if (activeSession?.id === session.id) {
                setActiveSession(null);
                setView('LIST');
            }
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
            if (parsed.length === 0) { setImportResult('No valid rows. CSV needs a "name" or "full_name" column.'); }
            else { const count = await bulkImportCandidates(activeSession.id, parsed); setImportResult(`Imported ${count} of ${parsed.length} candidates.`); getSessionCandidates(activeSession.id).then(setCandidates); }
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
    const getStationStyle = (s: TestCenterStation) => {
        const hb = s.last_heartbeat ? new Date(s.last_heartbeat) : null;
        const stale = hb && (Date.now() - hb.getTime() > 90000);
        if (stale) return 'bg-red-500/[0.08] border-red-500/30 text-red-300 shadow-[inset_1px_1px_4px_rgba(220,38,38,0.1),4px_4px_12px_rgba(0,0,0,0.25)]';
        switch (s.status) {
            case 'ACTIVE': return 'bg-[#8dc63f]/[0.08] border-[#8dc63f]/30 text-[#8dc63f] shadow-[inset_1px_1px_4px_rgba(141,198,63,0.1),4px_4px_12px_rgba(0,0,0,0.25),0_0_12px_rgba(141,198,63,0.06)]';
            case 'READY': return 'bg-blue-400/[0.08] border-blue-400/30 text-blue-300 shadow-[inset_1px_1px_4px_rgba(96,165,250,0.1),4px_4px_12px_rgba(0,0,0,0.25)]';
            case 'SUBMITTED': return 'bg-slate-400/[0.08] border-slate-400/25 text-slate-400 shadow-[inset_1px_1px_4px_rgba(100,116,139,0.1),4px_4px_12px_rgba(0,0,0,0.25)]';
            case 'ASSIGNED': return 'bg-amber-400/[0.08] border-amber-400/30 text-amber-300 shadow-[inset_1px_1px_4px_rgba(251,191,36,0.1),4px_4px_12px_rgba(0,0,0,0.25)]';
            default: return 'bg-white/[0.03] border-white/[0.08] text-slate-600 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15),3px_3px_8px_rgba(0,0,0,0.2)]';
        }
    };

    const getCandidateForStation = (num: number) => candidates.find(c => c.assigned_station === num);

    const statusBadgeColor = (status: string): string => {
        const map: Record<string, string> = {
            'SETUP': 'amber', 'READY': 'blue', 'LIVE': 'green', 'COMPLETED': 'slate', 'CANCELLED': 'red',
            'REGISTERED': 'slate', 'CHECKED_IN': 'blue', 'ASSIGNED': 'amber', 'IN_EXAM': 'green', 'NO_SHOW': 'red', 'IN_PROGRESS': 'green',
        };
        return map[status] || 'slate';
    };

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

    // ==========================================
    // SHARED: Page Shell + Top Bar
    // ==========================================
    const PageShell = ({ children }: { children: React.ReactNode }) => (
        <div className="min-h-screen bg-[#0a0e1a] text-white font-sans relative overflow-hidden">
            {/* Background orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#8dc63f]/[0.025] rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-600/[0.02] rounded-full blur-[120px]" />
                <div className="absolute top-[50%] left-[60%] w-[300px] h-[300px] bg-cyan-500/[0.015] rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );

    const TopBar = ({ title, subtitle, showBack, backTo, rightContent }: { title: string; subtitle?: string; showBack?: boolean; backTo?: () => void; rightContent?: React.ReactNode }) => (
        <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button onClick={backTo} className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all duration-300 shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_1px_1px_1px_rgba(255,255,255,0.05)]">
                            <Icons.ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#8dc63f]/20 to-[#8dc63f]/5 border border-[#8dc63f]/20 flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(141,198,63,0.15)]">
                        <Icons.Shield className="w-5 h-5 text-[#8dc63f] drop-shadow-[0_0_6px_rgba(141,198,63,0.4)]" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-wide">{title}</h1>
                        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {rightContent}
                    {onLogout && (
                        <button onClick={onLogout} className={`${clay.btnGhost} px-4 py-2 text-xs text-slate-400 hover:text-white`}>
                            Sign Out
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // ==========================================
    // VIEW: SESSION LIST
    // ==========================================
    if (view === 'LIST') {
        return (
            <PageShell>
                <TopBar title="Test Center Administration" subtitle="Manage exam sessions, candidates, and results" />
                <div className="max-w-4xl mx-auto p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Exam Sessions</h2>
                            <p className="text-slate-500 text-xs mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => { setFormName(''); setFormConfig('full-standard'); setFormStations(30); setView('CREATE'); }}
                            className={`${clay.btnPrimary} px-6 py-3 flex items-center gap-2.5`}>
                            <Icons.Plus className="w-4 h-4" /> New Session
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-16 h-16 rounded-[22px] bg-white/[0.06] border border-white/[0.1] shadow-[6px_6px_20px_rgba(0,0,0,0.4),inset_1px_1px_2px_rgba(255,255,255,0.08)] flex items-center justify-center">
                                <Icons.CloudSync className="w-7 h-7 animate-spin text-[#8dc63f]" />
                            </div>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 rounded-[28px] bg-white/[0.04] border border-white/[0.08] shadow-[8px_8px_24px_rgba(0,0,0,0.35),inset_1px_1px_2px_rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-6">
                                <Icons.Shield className="w-10 h-10 text-slate-700" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-400 mb-2">No Exam Sessions</h2>
                            <p className="text-slate-600 text-sm mb-8">Create your first session to get started</p>
                            <button onClick={() => setView('CREATE')} className={`${clay.btnPrimary} px-8 py-3`}>Create Session</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map(session => {
                                const config = EXAM_CONFIGS[session.exam_config_key];
                                return (
                                    <div key={session.id} className={`${clay.cardHover} p-5 cursor-pointer group`} onClick={() => handleOpenSession(session)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-white text-[15px]">{session.name}</h3>
                                                    <span className={clay.badge(statusBadgeColor(session.status))}>{session.status === 'LIVE' ? '● LIVE' : session.status}</span>
                                                </div>
                                                <div className="flex gap-5 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5"><Icons.FileText className="w-3 h-3" />{config?.title || session.exam_config_key}</span>
                                                    <span className="flex items-center gap-1.5"><Icons.Grid className="w-3 h-3" />{session.station_count} stations</span>
                                                    <span className="flex items-center gap-1.5"><Icons.Calendar className="w-3 h-3" />{new Date(session.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                {session.status !== 'LIVE' && (
                                                    <button onClick={() => handleEditSession(session)}
                                                        className={`${clay.btnGhost} px-3 py-1.5 text-[11px]`}>Edit</button>
                                                )}
                                                {(session.status === 'SETUP' || session.status === 'COMPLETED' || session.status === 'CANCELLED') && (
                                                    <button onClick={() => handleDeleteSession(session)}
                                                        className={`${clay.btnDanger} px-3 py-1.5 text-[11px]`}>Delete</button>
                                                )}
                                                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-600 group-hover:text-white group-hover:bg-white/[0.08] transition-all duration-300">
                                                    <Icons.ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PageShell>
        );
    }

    // ==========================================
    // VIEW: CREATE / EDIT SESSION
    // ==========================================
    if (view === 'CREATE' || view === 'EDIT') {
        const isEdit = view === 'EDIT';
        return (
            <PageShell>
                <TopBar title={isEdit ? 'Edit Session' : 'Create Exam Session'} showBack backTo={() => setView(isEdit ? 'MANAGE' : 'LIST')} />
                <div className="max-w-lg mx-auto p-8">
                    <div className={`${clay.card} p-8 space-y-6`}>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Session Name</label>
                            <input type="text" placeholder="e.g., April 2026 Part 1 Batch" value={formName} onChange={(e) => setFormName(e.target.value)}
                                className={clay.input} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Exam Configuration</label>
                            <select value={formConfig} onChange={(e) => setFormConfig(e.target.value)}
                                className={clay.select}>
                                {Object.entries(EXAM_CONFIGS).map(([key, config]) => (
                                    <option key={key} value={key} className="bg-[#0a0e1a]">{config.title} ({config.mcqCount} MCQ + {config.essayCount} Essay)</option>
                                ))}
                            </select>
                        </div>
                        {!isEdit && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Number of Workstations</label>
                                <input type="number" min={1} max={100} value={formStations} onChange={(e) => setFormStations(Number(e.target.value))}
                                    className={clay.input} />
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setView(isEdit ? 'MANAGE' : 'LIST')} className={`flex-1 ${clay.btnGhost} py-3.5`}>Cancel</button>
                            <button onClick={isEdit ? handleSaveEdit : handleCreate} disabled={!formName.trim() || creating}
                                className={`flex-1 ${clay.btnPrimary} py-3.5`}>
                                {creating ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Session'}
                            </button>
                        </div>
                    </div>
                </div>
            </PageShell>
        );
    }

    // ==========================================
    // VIEW: MANAGE SESSION
    // ==========================================
    if (view === 'MANAGE' && activeSession) {
        const config = EXAM_CONFIGS[activeSession.exam_config_key];
        const cols = Math.min(6, Math.ceil(Math.sqrt(activeSession.station_count)));

        return (
            <PageShell>
                {/* Header with session info */}
                <div className="bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => { setView('LIST'); setActiveSession(null); }}
                                className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all duration-300 shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_1px_1px_1px_rgba(255,255,255,0.05)]">
                                <Icons.ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#8dc63f]/20 to-[#8dc63f]/5 border border-[#8dc63f]/20 flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(141,198,63,0.15)]">
                                <Icons.Shield className="w-5 h-5 text-[#8dc63f] drop-shadow-[0_0_6px_rgba(141,198,63,0.4)]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-sm font-bold">{activeSession.name}</h1>
                                    <span className={clay.badge(statusBadgeColor(activeSession.status))}>
                                        {activeSession.status === 'LIVE' ? '● LIVE' : activeSession.status}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-500">{config?.title || activeSession.exam_config_key}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Stat pills */}
                            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold">
                                <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400">{cStats.total} candidates</span>
                                {cStats.checkedIn > 0 && <span className="px-3 py-1.5 rounded-xl bg-blue-400/[0.08] border border-blue-400/15 text-blue-400">{cStats.checkedIn} checked in</span>}
                                {cStats.assigned > 0 && <span className="px-3 py-1.5 rounded-xl bg-amber-400/[0.08] border border-amber-400/15 text-amber-400">{cStats.assigned} assigned</span>}
                                {cStats.noShow > 0 && <span className="px-3 py-1.5 rounded-xl bg-red-400/[0.08] border border-red-400/15 text-red-400">{cStats.noShow} no-show</span>}
                            </div>
                            {onLogout && <button onClick={onLogout} className={`${clay.btnGhost} px-4 py-2 text-xs text-slate-400`}>Sign Out</button>}
                        </div>
                    </div>

                    {/* Tab Navigation — pill style */}
                    <div className="max-w-7xl mx-auto px-6 pb-3 flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-1 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)]">
                            {(['CANDIDATES', 'CHECK_IN', 'MONITOR', 'RESULTS'] as ManageTab[]).map(tab => (
                                <button key={tab} onClick={() => setManageTab(tab)} className={clay.pill(manageTab === tab)}>
                                    {tab === 'CANDIDATES' ? 'Candidates' : tab === 'CHECK_IN' ? 'Check-In' : tab === 'MONITOR' ? 'Monitor' : 'Results'}
                                </button>
                            ))}
                        </div>

                        {/* Admin broadcast controls */}
                        {manageTab === 'MONITOR' && activeSession.status === 'LIVE' && (
                            <div className="ml-auto flex items-center gap-2">
                                <button onClick={() => handleBroadcast('PAUSE')}
                                    className="rounded-xl bg-amber-400/[0.1] border border-amber-400/20 text-amber-400 px-4 py-2 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-300 hover:bg-amber-400/[0.18] shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_1px_1px_1px_rgba(251,191,36,0.08)]">
                                    <Icons.Clock className="w-3.5 h-3.5" /> Pause
                                </button>
                                <button onClick={() => handleBroadcast('RESUME')}
                                    className="rounded-xl bg-blue-400/[0.1] border border-blue-400/20 text-blue-400 px-4 py-2 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-300 hover:bg-blue-400/[0.18] shadow-[3px_3px_8px_rgba(0,0,0,0.25),inset_1px_1px_1px_rgba(96,165,250,0.08)]">
                                    <Icons.Zap className="w-3.5 h-3.5" /> Resume
                                </button>
                                <button onClick={() => handleBroadcast('ADD_TIME')}
                                    className={`${clay.btnGhost} px-4 py-2 text-[11px] flex items-center gap-1.5`}>
                                    <Icons.Clock className="w-3.5 h-3.5" /> +15 min
                                </button>
                                <button onClick={() => { if (confirm('Force submit ALL exams?')) handleBroadcast('FORCE_SUBMIT'); }}
                                    className={`${clay.btnDanger} px-4 py-2 text-[11px] flex items-center gap-1.5`}>
                                    <Icons.Lock className="w-3.5 h-3.5" /> Force Submit
                                </button>
                            </div>
                        )}
                        {manageTab === 'MONITOR' && (activeSession.status === 'SETUP' || activeSession.status === 'READY') && (
                            <div className="ml-auto">
                                <button onClick={() => handleBroadcast('START')} disabled={stats.ready === 0}
                                    className={`${clay.btnPrimary} px-6 py-2.5 text-[11px] flex items-center gap-2`}>
                                    <Icons.Zap className="w-3.5 h-3.5" /> Start All ({stats.ready} ready)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ====== TAB: CANDIDATES ====== */}
                {manageTab === 'CANDIDATES' && (
                    <div className="max-w-5xl mx-auto p-8">
                        {/* Add candidates card */}
                        <div className={`${clay.card} p-6 mb-8`}>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Icons.Plus className="w-3.5 h-3.5" /> Add Candidates
                            </h3>
                            <div className="flex gap-2.5 mb-4">
                                <input type="text" placeholder="Full Name *" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                                    className={`flex-[2] ${clay.inputSm}`} />
                                <input type="email" placeholder="Email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                                    className={`flex-[2] ${clay.inputSm}`} />
                                <input type="text" placeholder="Phone" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                                    className={`flex-1 ${clay.inputSm}`} />
                                <input type="text" placeholder="ID / Roll No" value={addForm.candidate_id} onChange={e => setAddForm(f => ({ ...f, candidate_id: e.target.value }))}
                                    className={`flex-1 ${clay.inputSm}`} />
                                <button onClick={handleAddCandidate} disabled={!addForm.full_name.trim() || addingCandidate}
                                    className={`${clay.btnPrimary} px-5 py-2.5 text-xs`}>{addingCandidate ? '...' : 'Add'}</button>
                            </div>
                            <div className="flex items-center gap-3">
                                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                                    className={`${clay.btnGhost} px-4 py-2 text-xs flex items-center gap-2`}>
                                    <Icons.Upload className="w-3.5 h-3.5" /> {importing ? 'Importing...' : 'Upload CSV'}
                                </button>
                                <span className="text-slate-600 text-[10px]">CSV: name, email, phone, candidate_id (header row required)</span>
                                {importResult && <span className="text-[#8dc63f] text-xs font-bold ml-auto">{importResult}</span>}
                            </div>
                        </div>

                        {candidates.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 rounded-[22px] bg-white/[0.04] border border-white/[0.06] shadow-[6px_6px_18px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-4">
                                    <Icons.User className="w-8 h-8 text-slate-700" />
                                </div>
                                <p className="text-slate-500 text-sm">No candidates added yet.</p>
                            </div>
                        ) : (
                            <div className={clay.table}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white/[0.03] text-slate-400 text-[10px] uppercase tracking-wider">
                                            <th className="text-left px-5 py-3.5 font-bold">#</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Name</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Email</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Phone</th>
                                            <th className="text-left px-5 py-3.5 font-bold">ID</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Status</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Station</th>
                                            <th className="text-right px-5 py-3.5 font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>{candidates.map((c, i) => (
                                        <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors duration-200">
                                            <td className="px-5 py-3.5 text-slate-600">{i + 1}</td>
                                            <td className="px-5 py-3.5 text-white font-bold">{c.full_name}</td>
                                            <td className="px-5 py-3.5 text-slate-400">{c.email || '—'}</td>
                                            <td className="px-5 py-3.5 text-slate-400">{c.phone || '—'}</td>
                                            <td className="px-5 py-3.5 text-slate-400">{c.candidate_id || '—'}</td>
                                            <td className="px-5 py-3.5"><span className={clay.badge(statusBadgeColor(c.status))}>{c.status}</span></td>
                                            <td className="px-5 py-3.5 text-slate-400">{c.assigned_station ? `STN ${c.assigned_station}` : '—'}</td>
                                            <td className="px-5 py-3.5 text-right">{c.status === 'REGISTERED' && <button onClick={() => handleDeleteCandidate(c.id)} className={`${clay.btnDanger} px-2.5 py-1 text-[10px]`}>Remove</button>}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ====== TAB: CHECK-IN & ASSIGN ====== */}
                {manageTab === 'CHECK_IN' && (
                    <div className="max-w-6xl mx-auto p-8">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Left: Queue */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Icons.Users className="w-3.5 h-3.5" />
                                    Candidate Queue
                                    <span className="text-slate-600 font-normal ml-1">({cStats.registered} waiting, {cStats.checkedIn} verified)</span>
                                </h3>
                                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {candidates.filter(c => c.status === 'REGISTERED' || c.status === 'CHECKED_IN').length === 0 && (
                                        <div className={`${clay.card} p-10 text-center`}>
                                            <p className="text-slate-600 text-sm">{candidates.length === 0 ? 'Add candidates first.' : 'All candidates assigned or marked.'}</p>
                                        </div>
                                    )}
                                    {candidates.filter(c => c.status === 'REGISTERED' || c.status === 'CHECKED_IN').map(c => (
                                        <div key={c.id}
                                            className={`rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${
                                                selectedCandidate === c.id
                                                    ? 'bg-[#8dc63f]/[0.06] border-[#8dc63f]/30 shadow-[4px_4px_14px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(141,198,63,0.06),inset_1px_1px_2px_rgba(141,198,63,0.08)]'
                                                    : 'bg-white/[0.04] border-white/[0.08] shadow-[4px_4px_12px_rgba(0,0,0,0.25),inset_1px_1px_1px_rgba(255,255,255,0.05)] hover:border-white/[0.15]'
                                            }`}
                                            onClick={() => setSelectedCandidate(c.id)}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-white font-bold text-sm">{c.full_name}</div>
                                                    <div className="text-slate-500 text-[11px] mt-0.5">
                                                        {c.candidate_id && <span className="mr-3">ID: {c.candidate_id}</span>}
                                                        {c.email && <span className="mr-3">{c.email}</span>}
                                                        {c.phone && <span>{c.phone}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={clay.badge(statusBadgeColor(c.status))}>{c.status === 'CHECKED_IN' ? 'VERIFIED' : 'WAITING'}</span>
                                                    {c.status === 'REGISTERED' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleCheckIn(c.id); }}
                                                            className="rounded-xl bg-blue-400/[0.1] border border-blue-400/20 text-blue-400 px-3 py-1.5 text-[10px] font-bold transition-all hover:bg-blue-400/[0.2] shadow-[2px_2px_6px_rgba(0,0,0,0.2)]">
                                                            Verify ID
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); handleMarkNoShow(c.id); }}
                                                        className="text-red-400/50 hover:text-red-400 text-[10px] font-bold transition-colors">No-Show</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {candidates.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_EXAM').length > 0 && (
                                        <>
                                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-5 mb-2 pl-1">Assigned</h4>
                                            {candidates.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_EXAM').map(c => (
                                                <div key={c.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-3.5 opacity-50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400 text-sm font-bold">{c.full_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#8dc63f] text-[10px] font-bold">STN {c.assigned_station}</span>
                                                            <span className={clay.badge(statusBadgeColor(c.status))}>{c.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right: Assign */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Icons.Grid className="w-3.5 h-3.5" /> Assign to Station
                                </h3>
                                {selectedCandidate ? (() => {
                                    const c = candidates.find(x => x.id === selectedCandidate);
                                    if (!c) return null;
                                    return (
                                        <div className={`${clay.card} p-6`}>
                                            <div className="mb-5">
                                                <div className="text-white font-bold text-lg">{c.full_name}</div>
                                                <div className="text-slate-500 text-xs mt-1">
                                                    {c.candidate_id && <span className="mr-4">ID: {c.candidate_id}</span>}
                                                    {c.email && <span className="mr-4">{c.email}</span>}
                                                    {c.phone && <span>{c.phone}</span>}
                                                </div>
                                                {c.status === 'REGISTERED' && (
                                                    <div className="mt-3 rounded-xl bg-amber-400/[0.08] border border-amber-400/20 p-3 text-amber-400 text-[11px] font-bold shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]">
                                                        Verify ID before assigning.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mb-5">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Select Station</label>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {Array.from({ length: activeSession.station_count }, (_, i) => i + 1).map(stn => {
                                                        const occ = candidates.find(x => x.assigned_station === stn && x.id !== selectedCandidate);
                                                        const sel = assignStation === stn;
                                                        return (
                                                            <button key={stn} disabled={!!occ} onClick={() => setAssignStation(stn)}
                                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                                                                    sel
                                                                        ? 'bg-gradient-to-br from-[#8dc63f] to-[#6ba52e] text-white shadow-[3px_3px_10px_rgba(0,0,0,0.3),-1px_-1px_4px_rgba(141,198,63,0.15),inset_1px_1px_2px_rgba(255,255,255,0.2)] scale-105'
                                                                        : occ
                                                                            ? 'bg-white/[0.02] text-slate-700 cursor-not-allowed'
                                                                            : 'bg-white/[0.04] border border-white/[0.08] text-slate-300 shadow-[2px_2px_6px_rgba(0,0,0,0.2),inset_1px_1px_1px_rgba(255,255,255,0.04)] hover:border-[#8dc63f]/30 hover:shadow-[3px_3px_8px_rgba(0,0,0,0.25),0_0_8px_rgba(141,198,63,0.06)]'
                                                                }`}>
                                                                {stn}
                                                                {occ && <div className="text-[8px] font-normal truncate px-1 opacity-70">{occ.full_name.split(' ')[0]}</div>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <button onClick={handleAssignStation} disabled={!assignStation || c.status === 'REGISTERED'}
                                                className={`w-full ${clay.btnPrimary} py-3.5`}>
                                                {c.status === 'REGISTERED' ? 'Verify ID First' : assignStation ? `Assign ${c.full_name.split(' ')[0]} → Station ${assignStation}` : 'Select a Station'}
                                            </button>
                                        </div>
                                    );
                                })() : (
                                    <div className={`${clay.card} p-12 text-center`}>
                                        <div className="w-14 h-14 rounded-[18px] bg-white/[0.04] border border-white/[0.06] shadow-[4px_4px_12px_rgba(0,0,0,0.25),inset_1px_1px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-4">
                                            <Icons.User className="w-7 h-7 text-slate-700" />
                                        </div>
                                        <p className="text-slate-500 text-sm">Select a candidate to assign</p>
                                    </div>
                                )}

                                {/* Workstation URL card */}
                                <div className="mt-5 rounded-2xl bg-[#8dc63f]/[0.05] border border-[#8dc63f]/15 p-4 shadow-[4px_4px_12px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(141,198,63,0.05)]">
                                    <p className="text-[#8dc63f] text-xs font-bold mb-2 flex items-center gap-1.5">
                                        <Icons.Link className="w-3.5 h-3.5" /> Workstation URL
                                    </p>
                                    <code className="text-[10px] text-slate-400 break-all block mb-3">{window.location.origin}/exam?center={activeSession.id}&station=N</code>
                                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/exam?center=${activeSession.id}&station=`)}
                                        className={`${clay.btnGhost} px-3.5 py-1.5 text-[10px] flex items-center gap-1.5`}>
                                        <Icons.Copy className="w-3 h-3" /> Copy Base URL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== TAB: LIVE MONITOR ====== */}
                {manageTab === 'MONITOR' && (
                    <div className="max-w-7xl mx-auto p-8">
                        {/* Status summary bar */}
                        <div className="flex items-center gap-3 mb-6">
                            {[
                                { value: stats.active, label: 'Active', color: 'green' },
                                { value: stats.ready, label: 'Ready', color: 'blue' },
                                { value: stats.submitted, label: 'Submitted', color: 'slate' },
                                ...(stats.disconnected > 0 ? [{ value: stats.disconnected, label: 'Disconnected', color: 'red' }] : []),
                                ...(stats.flags > 0 ? [{ value: stats.flags, label: 'Flags', color: 'amber' }] : []),
                            ].map(s => (
                                <span key={s.label} className={clay.badge(s.color)}>{s.value} {s.label}</span>
                            ))}
                            <div className="flex-1" />
                            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/exam?center=${activeSession.id}&station=`)}
                                className={`${clay.btnGhost} px-3.5 py-1.5 text-[10px] flex items-center gap-1.5`}>
                                <Icons.Copy className="w-3 h-3" /> Copy URL
                            </button>
                        </div>

                        {/* Station grid */}
                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                            {stations.map(station => {
                                const cand = getCandidateForStation(station.station_number);
                                const flags = station.proctoring_events?.length || 0;
                                return (
                                    <div key={station.id} className={`rounded-2xl border p-4 transition-all duration-300 ${getStationStyle(station)}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold tracking-wide">STN {station.station_number}</span>
                                            {flags > 0 && (
                                                <span className="bg-amber-400/[0.2] text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-amber-400/20 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]">
                                                    {flags}
                                                </span>
                                            )}
                                        </div>
                                        {cand ? <div className="text-[10px] truncate font-bold opacity-90 mb-1.5">{cand.full_name}</div>
                                            : station.candidate_name ? <div className="text-[10px] truncate opacity-60 mb-1.5">{station.candidate_name}</div>
                                            : <div className="text-[10px] opacity-25 mb-1.5">Empty</div>}
                                        <div className="text-[9px] opacity-40 uppercase font-bold tracking-wider">{station.status}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-8 flex flex-wrap gap-4 text-[10px]">
                            {[
                                { color: 'bg-[#8dc63f]/20 border-[#8dc63f]/40', label: 'Active' },
                                { color: 'bg-blue-400/20 border-blue-400/40', label: 'Ready' },
                                { color: 'bg-amber-400/20 border-amber-400/40', label: 'Assigned' },
                                { color: 'bg-slate-400/20 border-slate-400/40', label: 'Submitted' },
                                { color: 'bg-red-400/20 border-red-400/40', label: 'Disconnected' },
                                { color: 'bg-white/[0.04] border-white/[0.1]', label: 'Empty' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2">
                                    <div className={`w-3.5 h-3.5 rounded-lg border ${l.color} shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]`} />
                                    <span className="text-slate-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ====== TAB: RESULTS ====== */}
                {manageTab === 'RESULTS' && (
                    <div className="max-w-6xl mx-auto p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-bold">Exam Results</h3>
                                <p className="text-slate-500 text-[11px] mt-0.5">{examResults.length} submission{examResults.length !== 1 ? 's' : ''} for this session</p>
                            </div>
                            <button onClick={() => getTestCenterExamResults(activeSession.id).then(setExamResults)}
                                className={`${clay.btnGhost} px-4 py-2 text-xs flex items-center gap-2`}>
                                <Icons.CloudSync className="w-3.5 h-3.5" /> Refresh
                            </button>
                        </div>

                        {examResults.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 rounded-[22px] bg-white/[0.04] border border-white/[0.06] shadow-[6px_6px_18px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-4">
                                    <Icons.Target className="w-8 h-8 text-slate-700" />
                                </div>
                                <p className="text-slate-500 text-sm">No submissions yet. Results will appear here after candidates complete their exams.</p>
                            </div>
                        ) : (
                            <div className={clay.table}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white/[0.03] text-slate-400 text-[10px] uppercase tracking-wider">
                                            <th className="text-left px-5 py-3.5 font-bold">#</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Candidate</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Station</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Status</th>
                                            <th className="text-left px-5 py-3.5 font-bold">MCQ Score</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Essay</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Submitted</th>
                                            <th className="text-left px-5 py-3.5 font-bold">Time Used</th>
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
                                            <tr key={r.id} className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors duration-200">
                                                <td className="px-5 py-3.5 text-slate-600">{i + 1}</td>
                                                <td className="px-5 py-3.5 text-white font-bold">{candName}</td>
                                                <td className="px-5 py-3.5 text-slate-400">{stn ? `STN ${stn}` : '—'}</td>
                                                <td className="px-5 py-3.5"><span className={clay.badge(statusBadgeColor(r.status))}>{r.status}</span></td>
                                                <td className="px-5 py-3.5">
                                                    {mcqPct !== null ? (
                                                        <span className={`font-bold ${mcqPct >= 72 ? 'text-[#8dc63f]' : mcqPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                                            {r.mcq_correct}/{r.mcq_total} ({mcqPct}%)
                                                        </span>
                                                    ) : <span className="text-slate-600">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={clay.badge(essayStatus === 'Graded' ? 'green' : 'amber')}>{essayStatus}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-400 text-xs">{submittedAt ? new Date(submittedAt).toLocaleString() : '—'}</td>
                                                <td className="px-5 py-3.5 text-slate-400 text-xs">{usedMin !== null ? `${usedMin} min` : '—'}</td>
                                            </tr>
                                        );
                                    })}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </PageShell>
        );
    }

    return null;
};
