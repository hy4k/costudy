/**
 * TestCenterAdmin — Admin dashboard for managing physical test center sessions.
 * Features: batch session creation, live 6x5 station grid, admin controls.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../Icons';
import {
    EXAM_CONFIGS,
    createTestCenterSession,
    getTestCenterSessions,
    getTestCenterStations,
    updateTestCenterStatus,
    subscribeToStations,
    broadcastToStations,
    TestCenterSession,
    TestCenterStation,
} from '../../services/examService';

interface TestCenterAdminProps {
    userId: string;
    onBack?: () => void;
}

type View = 'LIST' | 'CREATE' | 'MONITOR';

export const TestCenterAdmin: React.FC<TestCenterAdminProps> = ({ userId, onBack }) => {
    const [view, setView] = useState<View>('LIST');
    const [sessions, setSessions] = useState<TestCenterSession[]>([]);
    const [activeSession, setActiveSession] = useState<TestCenterSession | null>(null);
    const [stations, setStations] = useState<TestCenterStation[]>([]);
    const [loading, setLoading] = useState(true);

    // Create form state
    const [formName, setFormName] = useState('');
    const [formConfig, setFormConfig] = useState('full-standard');
    const [formStations, setFormStations] = useState(30);
    const [creating, setCreating] = useState(false);

    // Load sessions
    useEffect(() => {
        const load = async () => {
            const data = await getTestCenterSessions(userId);
            setSessions(data);
            setLoading(false);
        };
        load();
    }, [userId]);

    // Subscribe to station changes when monitoring
    useEffect(() => {
        if (view !== 'MONITOR' || !activeSession) return;

        // Initial fetch
        getTestCenterStations(activeSession.id).then(setStations);

        // Realtime subscription
        const unsubscribe = subscribeToStations(activeSession.id, setStations);
        return unsubscribe;
    }, [view, activeSession]);

    const handleCreate = async () => {
        if (!formName.trim()) return;
        setCreating(true);
        const session = await createTestCenterSession(
            userId,
            formName.trim(),
            formConfig,
            formStations,
            { lockBrowser: true, allowCalculator: true }
        );
        if (session) {
            setSessions(prev => [session, ...prev]);
            setView('LIST');
        }
        setCreating(false);
    };

    const handleMonitor = async (session: TestCenterSession) => {
        setActiveSession(session);
        setView('MONITOR');
    };

    const handleBroadcast = async (command: 'START' | 'PAUSE' | 'RESUME' | 'ADD_TIME' | 'FORCE_SUBMIT') => {
        if (!activeSession) return;

        if (command === 'START') {
            await updateTestCenterStatus(activeSession.id, 'LIVE', {
                actual_start: new Date().toISOString(),
            });
            setActiveSession({ ...activeSession, status: 'LIVE' });
        } else if (command === 'FORCE_SUBMIT') {
            await updateTestCenterStatus(activeSession.id, 'COMPLETED', {
                completed_at: new Date().toISOString(),
            });
            setActiveSession({ ...activeSession, status: 'COMPLETED' });
        }

        await broadcastToStations(activeSession.id, command, {
            addMinutes: command === 'ADD_TIME' ? 15 : undefined,
        });
    };

    const getStationColor = (station: TestCenterStation) => {
        const hb = station.last_heartbeat ? new Date(station.last_heartbeat) : null;
        const stale = hb && (Date.now() - hb.getTime() > 90000); // 90s without heartbeat

        if (stale) return 'bg-red-500/20 border-red-400 text-red-300';
        switch (station.status) {
            case 'ACTIVE': return 'bg-[#8dc63f]/20 border-[#8dc63f] text-[#8dc63f]';
            case 'READY': return 'bg-blue-500/20 border-blue-400 text-blue-300';
            case 'SUBMITTED': return 'bg-slate-500/20 border-slate-400 text-slate-300';
            case 'ASSIGNED': return 'bg-amber-500/20 border-amber-400 text-amber-300';
            default: return 'bg-white/5 border-slate-600 text-slate-500';
        }
    };

    const getStatusIcon = (station: TestCenterStation) => {
        switch (station.status) {
            case 'ACTIVE': return <Icons.Zap className="w-3 h-3" />;
            case 'READY': return <Icons.CheckCircle className="w-3 h-3" />;
            case 'SUBMITTED': return <Icons.CheckBadge className="w-3 h-3" />;
            case 'ASSIGNED': return <Icons.User className="w-3 h-3" />;
            default: return <Icons.Target className="w-3 h-3 opacity-30" />;
        }
    };

    const stats = {
        total: stations.length,
        empty: stations.filter(s => s.status === 'EMPTY').length,
        ready: stations.filter(s => s.status === 'READY').length,
        active: stations.filter(s => s.status === 'ACTIVE').length,
        submitted: stations.filter(s => s.status === 'SUBMITTED').length,
        disconnected: stations.filter(s => {
            const hb = s.last_heartbeat ? new Date(s.last_heartbeat) : null;
            return hb && (Date.now() - hb.getTime() > 90000);
        }).length,
        flags: stations.reduce((sum, s) => sum + (s.proctoring_events?.length || 0), 0),
    };

    // ==========================================
    // VIEWS
    // ==========================================

    // LIST VIEW
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
                        <h1 className="text-lg font-bold">Test Center Admin</h1>
                    </div>
                    <button
                        onClick={() => setView('CREATE')}
                        className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" /> New Session
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
                            <h2 className="text-xl font-bold text-slate-400 mb-2">No Test Center Sessions</h2>
                            <p className="text-slate-600 text-sm mb-6">Create your first session to start managing exam workstations</p>
                            <button
                                onClick={() => setView('CREATE')}
                                className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded text-sm font-bold"
                            >
                                Create Session
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map(session => {
                                const config = EXAM_CONFIGS[session.exam_config_key];
                                const statusColors: Record<string, string> = {
                                    'SETUP': 'bg-amber-500/20 text-amber-400',
                                    'READY': 'bg-blue-500/20 text-blue-400',
                                    'LIVE': 'bg-[#8dc63f]/20 text-[#8dc63f]',
                                    'COMPLETED': 'bg-slate-500/20 text-slate-400',
                                    'CANCELLED': 'bg-red-500/20 text-red-400',
                                };
                                return (
                                    <div
                                        key={session.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer"
                                        onClick={() => handleMonitor(session)}
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-white">{session.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[session.status] || 'bg-slate-700 text-slate-400'}`}>
                                                    {session.status}
                                                </span>
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

    // CREATE VIEW
    if (view === 'CREATE') {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans">
                <div className="bg-[#333] px-6 py-4 flex items-center gap-3 border-b border-white/10">
                    <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-white">
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold">Create Test Center Session</h1>
                </div>

                <div className="max-w-lg mx-auto p-6">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Session Name</label>
                            <input
                                type="text"
                                placeholder="e.g., April 2026 Part 1 Batch"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white placeholder:text-slate-600 text-sm outline-none focus:border-[#8dc63f]/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Exam Configuration</label>
                            <select
                                value={formConfig}
                                onChange={(e) => setFormConfig(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-[#8dc63f]/50"
                            >
                                {Object.entries(EXAM_CONFIGS).map(([key, config]) => (
                                    <option key={key} value={key}>
                                        {config.title} ({config.mcqCount} MCQ + {config.essayCount} Essay)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Number of Stations</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={formStations}
                                onChange={(e) => setFormStations(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-[#8dc63f]/50"
                            />
                        </div>

                        <div className="bg-[#8dc63f]/10 border border-[#8dc63f]/20 rounded p-3 text-[#8dc63f] text-xs">
                            <p className="font-bold mb-1">Workstation URL:</p>
                            <code className="text-[10px] text-slate-300">costudy.in/exam?center=SESSION_ID&station=1</code>
                            <p className="text-slate-500 mt-1">Each station loads this URL with its station number. Stations register automatically.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setView('LIST')}
                                className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!formName.trim() || creating}
                                className="flex-1 bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white py-3 rounded font-bold text-sm"
                            >
                                {creating ? 'Creating...' : `Create ${formStations} Stations`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // MONITOR VIEW (Live Dashboard)
    if (view === 'MONITOR' && activeSession) {
        const config = EXAM_CONFIGS[activeSession.exam_config_key];
        const cols = Math.min(6, Math.ceil(Math.sqrt(activeSession.station_count)));

        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans">
                {/* Header */}
                <div className="bg-[#333] px-6 py-3 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-white">
                            <Icons.ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-sm font-bold">{activeSession.name}</h1>
                            <span className="text-[10px] text-slate-500">{config?.title || activeSession.exam_config_key}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            activeSession.status === 'LIVE' ? 'bg-[#8dc63f]/20 text-[#8dc63f] animate-pulse' :
                            activeSession.status === 'COMPLETED' ? 'bg-slate-600 text-slate-300' :
                            'bg-amber-500/20 text-amber-400'
                        }`}>
                            {activeSession.status}
                        </span>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                        <span className="text-[#8dc63f]">{stats.active} Active</span>
                        <span className="text-blue-400">{stats.ready} Ready</span>
                        <span className="text-slate-400">{stats.submitted} Done</span>
                        {stats.disconnected > 0 && <span className="text-red-400">{stats.disconnected} Disconnected</span>}
                        {stats.flags > 0 && <span className="text-amber-400">{stats.flags} Flags</span>}
                    </div>
                </div>

                {/* Admin Controls */}
                <div className="bg-[#2a2a2a] px-6 py-2 flex gap-2 border-b border-white/5">
                    {activeSession.status === 'SETUP' || activeSession.status === 'READY' ? (
                        <button
                            onClick={() => handleBroadcast('START')}
                            disabled={stats.ready === 0}
                            className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-30 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                        >
                            <Icons.Zap className="w-3 h-3" /> Start All ({stats.ready} ready)
                        </button>
                    ) : activeSession.status === 'LIVE' ? (
                        <>
                            <button
                                onClick={() => handleBroadcast('PAUSE')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                            >
                                <Icons.Clock className="w-3 h-3" /> Pause All
                            </button>
                            <button
                                onClick={() => handleBroadcast('RESUME')}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                            >
                                <Icons.Zap className="w-3 h-3" /> Resume
                            </button>
                            <button
                                onClick={() => handleBroadcast('ADD_TIME')}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                            >
                                <Icons.Clock className="w-3 h-3" /> +15 min
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={() => {
                                    if (confirm('Force submit all exams? This cannot be undone.')) {
                                        handleBroadcast('FORCE_SUBMIT');
                                    }
                                }}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                            >
                                <Icons.Lock className="w-3 h-3" /> Force Submit All
                            </button>
                        </>
                    ) : null}

                    {/* Copy workstation URL */}
                    <div className="flex-1" />
                    <button
                        onClick={() => {
                            const base = `${window.location.origin}/exam?center=${activeSession.id}`;
                            navigator.clipboard.writeText(base + '&station=');
                        }}
                        className="bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5"
                    >
                        <Icons.Copy className="w-3 h-3" /> Copy URL
                    </button>
                </div>

                {/* Station Grid */}
                <div className="p-6">
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                    >
                        {stations.map(station => {
                            const flags = station.proctoring_events?.length || 0;
                            return (
                                <div
                                    key={station.id}
                                    className={`border rounded-lg p-3 transition-all ${getStationColor(station)}`}
                                >
                                    {/* Station header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            {getStatusIcon(station)}
                                            <span className="text-xs font-bold">STN {station.station_number}</span>
                                        </div>
                                        {flags > 0 && (
                                            <span className="bg-amber-500/30 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                {flags} flags
                                            </span>
                                        )}
                                    </div>

                                    {/* Candidate info */}
                                    {station.candidate_name ? (
                                        <div className="text-[10px] truncate mb-1 opacity-80">
                                            {station.candidate_name}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] opacity-30 mb-1">No candidate</div>
                                    )}

                                    {/* Status line */}
                                    <div className="text-[9px] opacity-50 uppercase font-bold">
                                        {station.status}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap gap-4 text-[10px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-[#8dc63f]/30 border border-[#8dc63f]" />
                            <span className="text-slate-500">Active</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-blue-500/30 border border-blue-400" />
                            <span className="text-slate-500">Ready</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-400" />
                            <span className="text-slate-500">Assigned</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-500/30 border border-slate-400" />
                            <span className="text-slate-500">Submitted</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-400" />
                            <span className="text-slate-500">Disconnected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-white/5 border border-slate-600" />
                            <span className="text-slate-500">Empty</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
