/**
 * TestCenterAdmin — Prometric-style admin dashboard for physical test centers.
 * Views: LIST → CREATE → MANAGE (candidates, check-in, station grid, controls)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    TestCenterSession,
    TestCenterStation,
    TestCenterCandidate,
} from '../../services/examService';

interface TestCenterAdminProps {
    userId: string;
    onBack?: () => void;
}

type View = 'LIST' | 'CREATE' | 'MANAGE';
type ManageTab = 'CANDIDATES' | 'CHECK_IN' | 'MONITOR';

// ============================================
// CSV PARSER — handles Excel CSV exports
// ============================================
function parseCSV(text: string): { full_name: string; email?: string; phone?: string; candidate_id?: string }[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    // Parse header to find column indexes
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const nameIdx = header.findIndex(h => /^(full_?name|name|candidate_?name|student_?name)$/.test(h));
    const emailIdx = header.findIndex(h => /^(email|e-?mail)$/.test(h));
    const phoneIdx = header.findIndex(h => /^(phone|mobile|contact)$/.test(h));
    const idIdx = header.findIndex(h => /^(id|candidate_?id|roll_?no|reg_?no|registration)$/.test(h));

    if (nameIdx === -1) return []; // Name column is required

    return lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
            full_name: cols[nameIdx] || '',
            email: emailIdx >= 0 ? cols[emailIdx] : undefined,
            phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
            candidate_id: idIdx >= 0 ? cols[idIdx] : undefined,
        };
    }).filter(c => c.full_name.length > 0);
}

export const TestCenterAdmin: React.FC<TestCenterAdminProps> = ({ userId, onBack }) => {
    const [view, setView] = useState<View>('LIST');
    const [sessions, setSessions] = useState<TestCenterSession[]>([]);
    const [activeSession, setActiveSession] = useState<TestCenterSession | null>(null);
    const [stations, setStations] = useState<TestCenterStation[]>([]);
    const [candidates, setCandidates] = useState<TestCenterCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [manageTab, setManageTab] = useState<ManageTab>('CANDIDATES');

    // Create form
    const [formName, setFormName] = useState('');
    const [formConfig, setFormConfig] = useState('full-standard');
    const [formStations, setFormStations] = useState(30);
    const [creating, setCreating] = useState(false);

    // Candidate add form
    const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', candidate_id: '' });
    const [addingCandidate, setAddingCandidate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<string | null>(null);

    // Check-in state
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [assignStation, setAssignStation] = useState<number | ''>('');

    // Load sessions on mount
    useEffect(() => {
        const load = async () => {
            const data = await getTestCenterSessions(userId);
            setSessions(data);
            setLoading(false);
        };
        load();
    }, [userId]);

    // Subscribe to stations + candidates when managing a session
    useEffect(() => {
        if (view !== 'MANAGE' || !activeSession) return;

        // Initial fetch
        getTestCenterStations(activeSession.id).then(setStations);
        getSessionCandidates(activeSession.id).then(setCandidates);

        // Realtime
        const unsubStations = subscribeToStations(activeSession.id, setStations);
        const unsubCandidates = subscribeToCandidates(activeSession.id, setCandidates);

        return () => { unsubStations(); unsubCandidates(); };
    }, [view, activeSession]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleCreate = async () => {
        if (!formName.trim()) return;
        setCreating(true);
        const session = await createTestCenterSession(
            userId, formName.trim(), formConfig, formStations,
            { lockBrowser: true, allowCalculator: true }
        );
        if (session) {
            setSessions(prev => [session, ...prev]);
            setActiveSession(session);
            setView('MANAGE');
            setManageTab('CANDIDATES');
        }
        setCreating(false);
    };

    const handleOpenSession = (session: TestCenterSession) => {
        setActiveSession(session);
        setView('MANAGE');
        setManageTab(session.status === 'LIVE' ? 'MONITOR' : 'CANDIDATES');
    };

    const handleAddCandidate = async () => {
        if (!addForm.full_name.trim() || !activeSession) return;
        setAddingCandidate(true);
        const c = await addCandidate(activeSession.id, {
            full_name: addForm.full_name.trim(),
            email: addForm.email.trim() || undefined,
            phone: addForm.phone.trim() || undefined,
            candidate_id: addForm.candidate_id.trim() || undefined,
        });
        if (c) {
            setCandidates(prev => [...prev, c]);
            setAddForm({ full_name: '', email: '', phone: '', candidate_id: '' });
        }
        setAddingCandidate(false);
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSession) return;
        setImporting(true);
        setImportResult(null);
        try {
            const text = await file.text();
            const parsed = parseCSV(text);
            if (parsed.length === 0) {
                setImportResult('No valid rows found. Ensure CSV has a "name" or "full_name" column header.');
            } else {
                const count = await bulkImportCandidates(activeSession.id, parsed);
                setImportResult(`Imported ${count} of ${parsed.length} candidates.`);
                getSessionCandidates(activeSession.id).then(setCandidates);
            }
        } catch {
            setImportResult('Failed to read file.');
        }
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCheckIn = async (candidateId: string) => {
        await checkInCandidate(candidateId, userId);
        setCandidates(prev => prev.map(c =>
            c.id === candidateId ? { ...c, status: 'CHECKED_IN' as const, checked_in_at: new Date().toISOString() } : c
        ));
    };

    const handleAssignStation = async () => {
        if (!selectedCandidate || !assignStation || !activeSession) return;
        const success = await assignCandidateToStation(selectedCandidate, Number(assignStation));
        if (success) {
            setCandidates(prev => prev.map(c =>
                c.id === selectedCandidate
                    ? { ...c, status: 'ASSIGNED' as const, assigned_station: Number(assignStation), assigned_at: new Date().toISOString() }
                    : c
            ));
            setSelectedCandidate(null);
            setAssignStation('');
        }
    };

    const handleMarkNoShow = async (candidateId: string) => {
        await updateCandidateStatus(candidateId, 'NO_SHOW');
        setCandidates(prev => prev.map(c =>
            c.id === candidateId ? { ...c, status: 'NO_SHOW' as const } : c
        ));
    };

    const handleDeleteCandidate = async (candidateId: string) => {
        await deleteCandidate(candidateId);
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
    };

    const handleBroadcast = async (command: 'START' | 'PAUSE' | 'RESUME' | 'ADD_TIME' | 'FORCE_SUBMIT') => {
        if (!activeSession) return;
        if (command === 'START') {
            await updateTestCenterStatus(activeSession.id, 'LIVE', { actual_start: new Date().toISOString() });
            setActiveSession({ ...activeSession, status: 'LIVE' });
        } else if (command === 'FORCE_SUBMIT') {
            await updateTestCenterStatus(activeSession.id, 'COMPLETED', { completed_at: new Date().toISOString() });
            setActiveSession({ ...activeSession, status: 'COMPLETED' });
        }
        await broadcastToStations(activeSession.id, command, {
            addMinutes: command === 'ADD_TIME' ? 15 : undefined,
        });
    };

    // ============================================
    // HELPERS
    // ============================================
    const getStationColor = (station: TestCenterStation) => {
        const hb = station.last_heartbeat ? new Date(station.last_heartbeat) : null;
        const stale = hb && (Date.now() - hb.getTime() > 90000);
        if (stale) return 'bg-red-500/20 border-red-500/50 text-red-300';
        switch (station.status) {
            case 'ACTIVE': return 'bg-[#8dc63f]/20 border-[#8dc63f]/50 text-[#8dc63f]';
            case 'READY': return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
            case 'SUBMITTED': return 'bg-slate-500/20 border-slate-500/50 text-slate-300';
            case 'ASSIGNED': return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
            default: return 'bg-white/5 border-slate-700 text-slate-600';
        }
    };

    const getCandidateForStation = (stationNum: number) =>
        candidates.find(c => c.assigned_station === stationNum);

    const availableStations = (): number[] => {
        if (!activeSession) return [];
        const assigned = new Set(candidates.filter(c => c.assigned_station).map(c => c.assigned_station!));
        const result: number[] = [];
        for (let i = 1; i <= activeSession.station_count; i++) {
            if (!assigned.has(i)) result.push(i);
        }
        return result;
    };

    const stats = {
        total: stations.length,
        ready: stations.filter(s => s.status === 'READY').length,
        active: stations.filter(s => s.status === 'ACTIVE').length,
        submitted: stations.filter(s => s.status === 'SUBMITTED').length,
        disconnected: stations.filter(s => {
            const hb = s.last_heartbeat ? new Date(s.last_heartbeat) : null;
            return hb && (Date.now() - hb.getTime() > 90000);
        }).length,
        flags: stations.reduce((sum, s) => sum + (s.proctoring_events?.length || 0), 0),
    };

    const candidateStats = {
        total: candidates.length,
        registered: candidates.filter(c => c.status === 'REGISTERED').length,
        checkedIn: candidates.filter(c => c.status === 'CHECKED_IN').length,
        assigned: candidates.filter(c => c.status === 'ASSIGNED').length,
        inExam: candidates.filter(c => c.status === 'IN_EXAM').length,
        completed: candidates.filter(c => c.status === 'COMPLETED').length,
        noShow: candidates.filter(c => c.status === 'NO_SHOW').length,
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'SETUP': 'bg-amber-500/20 text-amber-400',
            'READY': 'bg-blue-500/20 text-blue-400',
            'LIVE': 'bg-[#8dc63f]/20 text-[#8dc63f]',
            'COMPLETED': 'bg-slate-500/20 text-slate-400',
            'CANCELLED': 'bg-red-500/20 text-red-400',
            'REGISTERED': 'bg-slate-500/20 text-slate-400',
            'CHECKED_IN': 'bg-blue-500/20 text-blue-400',
            'ASSIGNED': 'bg-amber-500/20 text-amber-400',
            'IN_EXAM': 'bg-[#8dc63f]/20 text-[#8dc63f]',
            'NO_SHOW': 'bg-red-500/20 text-red-400',
        };
        return `px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[status] || 'bg-slate-700 text-slate-400'}`;
    };

    // ============================================
    // VIEW: SESSION LIST
    // ============================================
    if (view === 'LIST') {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans">
                <div className="bg-[#333] px-6 py-4 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="text-slate-400 hover:text-white">
                                <Icons.ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <Icons.Shield className="w-6 h-6 text-[#8dc63f]" />
                        <h1 className="text-lg font-bold">Test Center Administration</h1>
                    </div>
                    <button
                        onClick={() => setView('CREATE')}
                        className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" /> New Exam Session
                    </button>
                </div>

                <div className="max-w-4xl mx-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Icons.CloudSync className="w-8 h-8 animate-spin text-[#8dc63f]" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-20">
                            <Icons.Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-slate-400 mb-2">No Exam Sessions</h2>
                            <p className="text-slate-600 text-sm mb-6">Create your first session to start managing candidates and workstations</p>
                            <button onClick={() => setView('CREATE')} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded text-sm font-bold">
                                Create Session
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map(session => {
                                const config = EXAM_CONFIGS[session.exam_config_key];
                                return (
                                    <div
                                        key={session.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer"
                                        onClick={() => handleOpenSession(session)}
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-white">{session.name}</h3>
                                                <span className={statusBadge(session.status)}>{session.status}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs text-slate-500">
                                                <span>{config?.title || session.exam_config_key}</span>
                                                <span>{session.station_count} stations</span>
                                                <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Icons.ChevronRight className="w-5 h-5 text-slate-600" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============================================
    // VIEW: CREATE SESSION
    // ============================================
    if (view === 'CREATE') {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans">
                <div className="bg-[#333] px-6 py-4 flex items-center gap-3 border-b border-white/10">
                    <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-white">
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold">Create Exam Session</h1>
                </div>

                <div className="max-w-lg mx-auto p-6">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Session Name</label>
                            <input type="text" placeholder="e.g., April 2026 Part 1 Batch"
                                value={formName} onChange={(e) => setFormName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white placeholder:text-slate-600 text-sm outline-none focus:border-[#8dc63f]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Exam Configuration</label>
                            <select value={formConfig} onChange={(e) => setFormConfig(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-[#8dc63f]/50"
                            >
                                {Object.entries(EXAM_CONFIGS).map(([key, config]) => (
                                    <option key={key} value={key}>{config.title} ({config.mcqCount} MCQ + {config.essayCount} Essay)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Number of Workstations</label>
                            <input type="number" min={1} max={100} value={formStations}
                                onChange={(e) => setFormStations(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-[#8dc63f]/50"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setView('LIST')}
                                className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded font-bold text-sm">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={!formName.trim() || creating}
                                className="flex-1 bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white py-3 rounded font-bold text-sm">
                                {creating ? 'Creating...' : 'Create Session'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // VIEW: MANAGE SESSION (tabs: CANDIDATES | CHECK_IN | MONITOR)
    // ============================================
    if (view === 'MANAGE' && activeSession) {
        const config = EXAM_CONFIGS[activeSession.exam_config_key];
        const cols = Math.min(6, Math.ceil(Math.sqrt(activeSession.station_count)));

        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans">
                {/* Header */}
                <div className="bg-[#333] px-6 py-3 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setView('LIST'); setActiveSession(null); }} className="text-slate-400 hover:text-white">
                            <Icons.ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-sm font-bold">{activeSession.name}</h1>
                            <span className="text-[10px] text-slate-500">{config?.title || activeSession.exam_config_key}</span>
                        </div>
                        <span className={statusBadge(activeSession.status)}>
                            {activeSession.status === 'LIVE' ? '● LIVE' : activeSession.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="text-slate-500">{candidateStats.total} candidates</span>
                        <span className="text-blue-400">{candidateStats.checkedIn} checked in</span>
                        <span className="text-amber-400">{candidateStats.assigned} assigned</span>
                        {candidateStats.noShow > 0 && <span className="text-red-400">{candidateStats.noShow} no-show</span>}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-[#2a2a2a] px-6 flex items-center border-b border-white/5">
                    {(['CANDIDATES', 'CHECK_IN', 'MONITOR'] as ManageTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setManageTab(tab)}
                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                                manageTab === tab
                                    ? 'border-[#8dc63f] text-[#8dc63f]'
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab === 'CANDIDATES' ? 'Candidates' : tab === 'CHECK_IN' ? 'Check-In & Assign' : 'Live Monitor'}
                        </button>
                    ))}

                    {/* Admin controls in tab bar when LIVE */}
                    {manageTab === 'MONITOR' && activeSession.status === 'LIVE' && (
                        <div className="ml-auto flex items-center gap-2">
                            <button onClick={() => handleBroadcast('PAUSE')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1">
                                <Icons.Clock className="w-3 h-3" /> Pause All
                            </button>
                            <button onClick={() => handleBroadcast('RESUME')}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1">
                                <Icons.Zap className="w-3 h-3" /> Resume
                            </button>
                            <button onClick={() => handleBroadcast('ADD_TIME')}
                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1">
                                <Icons.Clock className="w-3 h-3" /> +15 min
                            </button>
                            <button onClick={() => { if (confirm('Force submit ALL exams? This cannot be undone.')) handleBroadcast('FORCE_SUBMIT'); }}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1">
                                <Icons.Lock className="w-3 h-3" /> Force Submit
                            </button>
                        </div>
                    )}

                    {/* Start button when not yet LIVE */}
                    {manageTab === 'MONITOR' && (activeSession.status === 'SETUP' || activeSession.status === 'READY') && (
                        <div className="ml-auto">
                            <button onClick={() => handleBroadcast('START')} disabled={stats.ready === 0}
                                className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-30 text-white px-4 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5">
                                <Icons.Zap className="w-3 h-3" /> Start All Exams ({stats.ready} ready)
                            </button>
                        </div>
                    )}
                </div>

                {/* ==========================================
                    TAB: CANDIDATES — Roster management
                   ========================================== */}
                {manageTab === 'CANDIDATES' && (
                    <div className="max-w-5xl mx-auto p-6">
                        {/* Add / Import row */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Add Candidates</h3>
                            <div className="flex gap-2 mb-3">
                                <input type="text" placeholder="Full Name *" value={addForm.full_name}
                                    onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                                    className="flex-[2] bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#8dc63f]/50"
                                />
                                <input type="email" placeholder="Email" value={addForm.email}
                                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                                    className="flex-[2] bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#8dc63f]/50"
                                />
                                <input type="text" placeholder="Phone" value={addForm.phone}
                                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#8dc63f]/50"
                                />
                                <input type="text" placeholder="ID / Roll No" value={addForm.candidate_id}
                                    onChange={e => setAddForm(f => ({ ...f, candidate_id: e.target.value }))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder:text-slate-600 outline-none focus:border-[#8dc63f]/50"
                                />
                                <button onClick={handleAddCandidate} disabled={!addForm.full_name.trim() || addingCandidate}
                                    className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-bold">
                                    {addingCandidate ? '...' : 'Add'}
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5">
                                    <Icons.Upload className="w-3.5 h-3.5" /> {importing ? 'Importing...' : 'Upload CSV'}
                                </button>
                                <span className="text-slate-600 text-[10px]">CSV format: name, email, phone, candidate_id (header row required)</span>
                                {importResult && (
                                    <span className="text-[#8dc63f] text-xs font-bold ml-auto">{importResult}</span>
                                )}
                            </div>
                        </div>

                        {/* Candidate Table */}
                        {candidates.length === 0 ? (
                            <div className="text-center py-16">
                                <Icons.User className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No candidates added yet. Add manually or upload a CSV.</p>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-wider">
                                            <th className="text-left px-4 py-2.5 font-bold">#</th>
                                            <th className="text-left px-4 py-2.5 font-bold">Name</th>
                                            <th className="text-left px-4 py-2.5 font-bold">Email</th>
                                            <th className="text-left px-4 py-2.5 font-bold">Phone</th>
                                            <th className="text-left px-4 py-2.5 font-bold">ID</th>
                                            <th className="text-left px-4 py-2.5 font-bold">Status</th>
                                            <th className="text-left px-4 py-2.5 font-bold">Station</th>
                                            <th className="text-right px-4 py-2.5 font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.map((c, i) => (
                                            <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                                                <td className="px-4 py-2.5 text-slate-600">{i + 1}</td>
                                                <td className="px-4 py-2.5 text-white font-bold">{c.full_name}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{c.email || '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{c.phone || '—'}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{c.candidate_id || '—'}</td>
                                                <td className="px-4 py-2.5"><span className={statusBadge(c.status)}>{c.status}</span></td>
                                                <td className="px-4 py-2.5 text-slate-400">{c.assigned_station ? `STN ${c.assigned_station}` : '—'}</td>
                                                <td className="px-4 py-2.5 text-right">
                                                    {c.status === 'REGISTERED' && (
                                                        <button onClick={() => handleDeleteCandidate(c.id)}
                                                            className="text-red-400/60 hover:text-red-400 text-[10px] font-bold">
                                                            Remove
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ==========================================
                    TAB: CHECK-IN & ASSIGN
                   ========================================== */}
                {manageTab === 'CHECK_IN' && (
                    <div className="max-w-5xl mx-auto p-6">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: Candidate queue */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                                    Candidate Queue ({candidateStats.registered} waiting, {candidateStats.checkedIn} verified)
                                </h3>
                                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                                    {candidates.filter(c => c.status === 'REGISTERED' || c.status === 'CHECKED_IN').length === 0 && (
                                        <div className="text-center py-10 text-slate-600 text-sm">
                                            {candidates.length === 0 ? 'No candidates added. Go to Candidates tab first.' : 'All candidates have been assigned or marked.'}
                                        </div>
                                    )}
                                    {candidates
                                        .filter(c => c.status === 'REGISTERED' || c.status === 'CHECKED_IN')
                                        .map(c => (
                                        <div
                                            key={c.id}
                                            className={`bg-white/5 border rounded-lg p-3 transition-all cursor-pointer ${
                                                selectedCandidate === c.id
                                                    ? 'border-[#8dc63f]/60 bg-[#8dc63f]/10'
                                                    : 'border-white/10 hover:border-white/20'
                                            }`}
                                            onClick={() => setSelectedCandidate(c.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-white font-bold text-sm">{c.full_name}</div>
                                                    <div className="text-slate-500 text-[11px]">
                                                        {c.candidate_id && <span className="mr-3">ID: {c.candidate_id}</span>}
                                                        {c.email && <span className="mr-3">{c.email}</span>}
                                                        {c.phone && <span>{c.phone}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={statusBadge(c.status)}>{c.status === 'CHECKED_IN' ? 'VERIFIED' : 'WAITING'}</span>
                                                    {c.status === 'REGISTERED' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCheckIn(c.id); }}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                                                        >
                                                            Verify ID
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMarkNoShow(c.id); }}
                                                        className="text-red-400/50 hover:text-red-400 text-[10px] font-bold"
                                                    >
                                                        No-Show
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Already assigned — shown below for reference */}
                                    {candidates.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_EXAM').length > 0 && (
                                        <>
                                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-4 mb-1">Assigned</h4>
                                            {candidates.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_EXAM').map(c => (
                                                <div key={c.id} className="bg-white/3 border border-white/5 rounded-lg p-3 opacity-60">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-slate-400 text-sm font-bold">{c.full_name}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#8dc63f] text-[10px] font-bold">STN {c.assigned_station}</span>
                                                            <span className={statusBadge(c.status)}>{c.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right: Station assignment */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                                    Assign to Station
                                </h3>
                                {selectedCandidate ? (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                                        {(() => {
                                            const c = candidates.find(x => x.id === selectedCandidate);
                                            if (!c) return null;
                                            return (
                                                <>
                                                    <div className="mb-4">
                                                        <div className="text-white font-bold text-lg">{c.full_name}</div>
                                                        <div className="text-slate-500 text-xs mt-1">
                                                            {c.candidate_id && <span className="mr-4">ID: {c.candidate_id}</span>}
                                                            {c.email && <span className="mr-4">{c.email}</span>}
                                                            {c.phone && <span>{c.phone}</span>}
                                                        </div>
                                                        {c.status === 'REGISTERED' && (
                                                            <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded p-2 text-amber-400 text-[11px] font-bold">
                                                                Identity not yet verified. Click "Verify ID" to check in.
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Select Station</label>
                                                        <div className="grid grid-cols-6 gap-2">
                                                            {Array.from({ length: activeSession.station_count }, (_, i) => i + 1).map(stn => {
                                                                const occupied = candidates.find(x => x.assigned_station === stn && x.id !== selectedCandidate);
                                                                const isSelected = assignStation === stn;
                                                                return (
                                                                    <button
                                                                        key={stn}
                                                                        disabled={!!occupied}
                                                                        onClick={() => setAssignStation(stn)}
                                                                        className={`py-2 rounded text-xs font-bold transition-all ${
                                                                            isSelected
                                                                                ? 'bg-[#8dc63f] text-white ring-2 ring-[#8dc63f]/50'
                                                                                : occupied
                                                                                    ? 'bg-white/5 text-slate-700 cursor-not-allowed'
                                                                                    : 'bg-white/5 border border-white/10 text-slate-300 hover:border-[#8dc63f]/50'
                                                                        }`}
                                                                    >
                                                                        {stn}
                                                                        {occupied && <div className="text-[8px] font-normal truncate px-1">{occupied.full_name.split(' ')[0]}</div>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleAssignStation}
                                                        disabled={!assignStation || c.status === 'REGISTERED'}
                                                        className="w-full bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-30 text-white py-3 rounded font-bold text-sm"
                                                    >
                                                        {c.status === 'REGISTERED'
                                                            ? 'Verify ID First'
                                                            : assignStation
                                                                ? `Assign ${c.full_name.split(' ')[0]} → Station ${assignStation}`
                                                                : 'Select a Station'}
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-10 text-center">
                                        <Icons.User className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">Select a candidate from the queue to assign a station</p>
                                    </div>
                                )}

                                {/* Workstation URL helper */}
                                <div className="mt-4 bg-[#8dc63f]/10 border border-[#8dc63f]/20 rounded p-3">
                                    <p className="text-[#8dc63f] text-xs font-bold mb-1">Workstation URL:</p>
                                    <code className="text-[10px] text-slate-300 break-all">{window.location.origin}/exam?center={activeSession.id}&station=N</code>
                                    <p className="text-slate-500 text-[10px] mt-1">Replace N with the station number. Each workstation auto-connects.</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/exam?center=${activeSession.id}&station=`)}
                                        className="mt-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                                    >
                                        <Icons.Copy className="w-3 h-3" /> Copy Base URL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==========================================
                    TAB: LIVE MONITOR — Station grid + controls
                   ========================================== */}
                {manageTab === 'MONITOR' && (
                    <div className="p-6">
                        {/* Station stats bar */}
                        <div className="flex items-center gap-6 text-[11px] font-bold mb-4">
                            <span className="text-[#8dc63f]">{stats.active} Active</span>
                            <span className="text-blue-400">{stats.ready} Ready</span>
                            <span className="text-slate-400">{stats.submitted} Submitted</span>
                            {stats.disconnected > 0 && <span className="text-red-400">{stats.disconnected} Disconnected</span>}
                            {stats.flags > 0 && <span className="text-amber-400">{stats.flags} Proctoring Flags</span>}
                            <div className="flex-1" />
                            <button
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/exam?center=${activeSession.id}&station=`)}
                                className="bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                            >
                                <Icons.Copy className="w-3 h-3" /> Copy URL
                            </button>
                        </div>

                        {/* Station Grid */}
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                            {stations.map(station => {
                                const candidate = getCandidateForStation(station.station_number);
                                const flags = station.proctoring_events?.length || 0;
                                return (
                                    <div key={station.id} className={`border rounded-lg p-3 transition-all ${getStationColor(station)}`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold">STN {station.station_number}</span>
                                            {flags > 0 && (
                                                <span className="bg-amber-500/30 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                    {flags} flags
                                                </span>
                                            )}
                                        </div>
                                        {candidate ? (
                                            <div className="text-[10px] truncate font-bold opacity-90 mb-1">
                                                {candidate.full_name}
                                            </div>
                                        ) : station.candidate_name ? (
                                            <div className="text-[10px] truncate opacity-70 mb-1">{station.candidate_name}</div>
                                        ) : (
                                            <div className="text-[10px] opacity-30 mb-1">Empty</div>
                                        )}
                                        <div className="text-[9px] opacity-50 uppercase font-bold">{station.status}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 text-[10px]">
                            {[
                                { color: 'bg-[#8dc63f]/30 border-[#8dc63f]', label: 'Active' },
                                { color: 'bg-blue-500/30 border-blue-400', label: 'Ready' },
                                { color: 'bg-amber-500/30 border-amber-400', label: 'Assigned' },
                                { color: 'bg-slate-500/30 border-slate-400', label: 'Submitted' },
                                { color: 'bg-red-500/30 border-red-400', label: 'Disconnected' },
                                { color: 'bg-white/5 border-slate-600', label: 'Empty' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded border ${l.color}`} />
                                    <span className="text-slate-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};
