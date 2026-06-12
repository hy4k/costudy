import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { syncStudyTelemetry, fetchGlobalPerformance } from '../../services/fetsService';
import { examService, EXAM_CONFIGS, ExamConfig, getTestCenterSessionById, findActiveTestCenterExam } from '../../services/examService';
import { ExamSession } from './ExamSession';

/** Session-only unlock for demo; clear with sessionStorage.removeItem(...) or new browser session. */
const MOCK_PORTAL_STORAGE_KEY = 'costudy_mock_portal_unlocked';

interface MockTestsProps {
  userId?: string;
  testCenter?: { centerId: string; stationNumber: number };
}

interface ExamCard {
    id: string;
    configKey: string;
    title: string;
    subtitle: string;
    description: string;
    duration: string;
    mcqCount: number;
    essayCount: number;
    badge: string;
    badgeCls: string;
    features: string[];
    highlight?: boolean;
}

export const MockTests: React.FC<MockTestsProps> = ({ userId, testCenter }) => {
    const isStudentMocks = !testCenter;
    const mockPortalLocked =
        import.meta.env.VITE_MOCK_TESTS_LOCKED !== 'false';
    const mockPortalPassword =
        import.meta.env.VITE_MOCK_TESTS_PASSWORD || '123456';

    const [portalUnlocked, setPortalUnlocked] = useState(() => {
        if (!mockPortalLocked) return true;
        try {
            return sessionStorage.getItem(MOCK_PORTAL_STORAGE_KEY) === '1';
        } catch {
            return false;
        }
    });
    const [portalPw, setPortalPw] = useState('');
    const [portalPwError, setPortalPwError] = useState('');

    const [perf, setPerf] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);

    // Active exam state
    const [activeSession, setActiveSession] = useState<any>(null);
    const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
    const [examQuestions, setExamQuestions] = useState<{ mcqs: any[]; essays: any[] }>({ mcqs: [], essays: [] });
    const [startingKey, setStartingKey] = useState<string | null>(null);

    // Exam cards configuration
    const examCards: ExamCard[] = [
        {
            id: 'full-standard',
            configKey: 'full-standard',
            title: 'Full Mock — Standard',
            subtitle: 'Authentic CMA experience',
            description: 'Complete 4-hour exam simulation on the Prometric-style interface. Essays unlock automatically after the MCQ section.',
            duration: '4 hours',
            mcqCount: 100,
            essayCount: 2,
            badge: 'Standard',
            badgeCls: 'mock-badge-green',
            features: [
                '3h MCQ section — 100 questions',
                '1h essay section — 2 scenarios',
                'Essays unlock regardless of MCQ score',
                'Full Prometric-style interface'
            ],
            highlight: true
        },
        {
            id: 'full-challenge',
            configKey: 'full-challenge',
            title: 'Full Mock — Strict',
            subtitle: 'Test your readiness',
            description: 'Prove your mastery under real conditions. Score 50%+ on MCQs to unlock the essay section — just like exam day.',
            duration: '4 hours',
            mcqCount: 100,
            essayCount: 2,
            badge: 'Strict · Gate 50%',
            badgeCls: 'mock-badge-amber',
            features: [
                '3h MCQ section — 100 questions',
                '1h essay section — 2 scenarios',
                'Must score 50%+ to unlock essays',
                'Real exam pressure simulation'
            ]
        },
        {
            id: 'mcq-practice',
            configKey: 'mcq-practice',
            title: 'MCQ Practice',
            subtitle: '50 mixed questions',
            description: 'Focused drilling without the essay component. 70% real + 30% AI-generated.',
            duration: '90 min',
            mcqCount: 50,
            essayCount: 0,
            badge: 'MCQ only',
            badgeCls: '',
            features: []
        },
        {
            id: 'essay-practice',
            configKey: 'essay-practice',
            title: 'Essay Practice',
            subtitle: '2 scenarios',
            description: 'Scenario mastery with structured responses and word-count tracking.',
            duration: '60 min',
            mcqCount: 0,
            essayCount: 2,
            badge: 'Essay only',
            badgeCls: '',
            features: []
        },
        {
            id: 'quick-10',
            configKey: 'quick-10',
            title: 'Quick Drill',
            subtitle: '10 questions',
            description: 'Fast practice session — great for daily review or a warm-up.',
            duration: '15 min',
            mcqCount: 10,
            essayCount: 0,
            badge: 'Quick',
            badgeCls: '',
            features: []
        }
    ];

    useEffect(() => {
        if (mockPortalLocked && !portalUnlocked) return;
        const load = async () => {
            const targetId = userId || 'u-me';
            const [perfData, sessions] = await Promise.all([
                fetchGlobalPerformance(targetId),
                userId ? examService.getUserSessions(userId, 5) : Promise.resolve([])
            ]);
            setPerf(perfData);
            setRecentSessions(sessions);
            setLoading(false);
            syncStudyTelemetry({ userId: targetId, event: 'view_mock_tests' });
        };
        load();
    }, [userId, mockPortalLocked, portalUnlocked]);

    // Test center session-locked mode: auto-start the admin-configured exam
    const [tcLoading, setTcLoading] = useState(!!testCenter);
    const [tcError, setTcError] = useState<string | null>(null);

    useEffect(() => {
        if (!testCenter || !userId) return;
        // Already have an active session — don't re-fetch
        if (activeSession) return;

        const autoStart = async () => {
            setTcLoading(true);
            setTcError(null);
            try {
                // Look up the test center session to get the exam config
                const tcSession = await getTestCenterSessionById(testCenter.centerId);
                if (!tcSession) {
                    setTcError('Test center session not found. Please check the URL.');
                    setTcLoading(false);
                    return;
                }

                const config = EXAM_CONFIGS[tcSession.exam_config_key];
                if (!config) {
                    setTcError('Invalid exam configuration for this test center session.');
                    setTcLoading(false);
                    return;
                }

                // --- RECOVERY: Check for an existing in-progress session ---
                const existingSession = await findActiveTestCenterExam(userId, testCenter.centerId);
                if (existingSession && existingSession.full_questions) {
                    console.log('[TestCenter] Recovering existing session:', existingSession.id);
                    const fq = existingSession.full_questions as any;
                    setExamQuestions({
                        mcqs: fq.mcqs || [],
                        essays: fq.essays || [],
                    });
                    setExamConfig(config);
                    setActiveSession(existingSession);
                    setTcLoading(false);
                    return;
                }

                // --- NEW SESSION: Fetch questions and create ---
                const mcqs = config.mcqCount > 0
                    ? await examService.fetchHybridMCQs(config.mcqCount, config.hybridRatio, config.part)
                    : [];
                const essays = config.essayCount > 0
                    ? await examService.fetchEssayQuestions(config.essayCount, config.part)
                    : [];

                const session = await examService.createExamSession(
                    userId, tcSession.exam_config_key, mcqs, essays,
                    { centerSessionId: testCenter.centerId }
                );

                setExamQuestions({ mcqs, essays });
                setExamConfig(config);
                setActiveSession(session);
            } catch (err) {
                console.error('Test center auto-start failed:', err);
                setTcError('Failed to load exam. Please refresh or contact the proctor.');
            } finally {
                setTcLoading(false);
            }
        };
        autoStart();
    }, [testCenter, userId]);

    // In test center mode, show loading/error states instead of exam picker
    // (Test-center kiosk keeps the FETS green ep-neu theme — unchanged by the redesign.)
    if (testCenter && (tcLoading || tcError)) {
        return (
            <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-4 f-body text-slate-800 px-6">
                {tcLoading ? (
                    <>
                        <div className="ep-neu-raised w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
                            <Icons.CloudSync className="w-8 h-8 animate-spin text-[#4a7a1c]" />
                        </div>
                        <p className="text-slate-600 text-sm font-bold">Loading exam for Station {testCenter.stationNumber}...</p>
                    </>
                ) : (
                    <>
                        <Icons.AlertCircle className="w-12 h-12 text-red-600" />
                        <p className="text-red-700 text-sm font-bold text-center max-w-md">{tcError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 ep-neu-raised-sm px-5 py-2.5 rounded-xl text-slate-800 text-sm font-bold border border-[#8dc63f]/20 bg-[#f6faf3]/90 hover:bg-[#eef5ea]"
                        >
                            Retry
                        </button>
                    </>
                )}
            </div>
        );
    }

    const unlockMockPortal = (e: React.FormEvent) => {
        e.preventDefault();
        setPortalPwError('');
        if (portalPw === mockPortalPassword) {
            try {
                sessionStorage.setItem(MOCK_PORTAL_STORAGE_KEY, '1');
            } catch {
                /* ignore */
            }
            setPortalUnlocked(true);
            setPortalPw('');
        } else {
            setPortalPwError('Incorrect password.');
        }
    };

    const startExam = async (configKey: string) => {
        if (startingKey) return;
        setStartingKey(configKey);

        const config = EXAM_CONFIGS[configKey];
        if (!config) {
            console.error('Invalid exam config:', configKey);
            setStartingKey(null);
            return;
        }

        syncStudyTelemetry({ userId, event: 'start_exam', configKey });

        try {
            // Fetch questions
            const mcqs = config.mcqCount > 0
                ? await examService.fetchHybridMCQs(config.mcqCount, config.hybridRatio, config.part)
                : [];

            const essays = config.essayCount > 0
                ? await examService.fetchEssayQuestions(config.essayCount, config.part)
                : [];

            // Create session with pre-fetched questions (avoids double-fetch)
            const session = await examService.createExamSession(userId || 'anonymous', configKey, mcqs, essays);

            setExamQuestions({ mcqs, essays });
            setExamConfig(config);
            setActiveSession(session);

        } catch (err) {
            console.error('Error starting exam:', err);
        } finally {
            setStartingKey(null);
        }
    };

    const handleExamExit = () => {
        // In test center mode, don't allow going back to exam picker
        if (testCenter) return;
        setActiveSession(null);
        setExamConfig(null);
        setExamQuestions({ mcqs: [], essays: [] });
    };

    // ---------- Password gate ----------
    if (mockPortalLocked && !portalUnlocked) {
        if (!isStudentMocks) {
            // Test-center gate keeps the green kiosk look
            return (
                <div className="w-full f-body text-slate-800">
                    <div className="flex flex-col items-center justify-center px-6 py-16">
                        <div className="w-full max-w-md">
                            <div className="flex items-center gap-3 mb-6 justify-center">
                                <div className="p-2.5 ep-neu-raised-sm rounded-xl bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
                                    <Icons.Lock className="w-6 h-6 text-[#4a7a1c]" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    Mock Exam Portal
                                </span>
                            </div>
                            <div className="ep-neu-card p-8">
                                <h1 className="f-display text-2xl font-semibold text-slate-800 tracking-tight mb-2 text-center">Demo access</h1>
                                <p className="text-slate-600 text-sm text-center mb-6">Enter the demo password to open mock exams.</p>
                                <form onSubmit={unlockMockPortal} className="space-y-4">
                                    <input
                                        type="password"
                                        autoComplete="off"
                                        value={portalPw}
                                        onChange={(e) => setPortalPw(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl ep-neu-inset border-0 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8dc63f]/35"
                                        placeholder="••••••"
                                    />
                                    {portalPwError && <p className="text-sm text-red-600 font-medium">{portalPwError}</p>}
                                    <button type="submit" className="w-full py-3.5 ep-neu-cta ep-shimmer rounded-xl bg-gradient-to-r from-[#8dc63f] via-[#7db536] to-[#6ba52e] text-white font-bold text-sm hover:opacity-95 transition-opacity">
                                        Unlock mock exams
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="proto wall-embedded">
                <div className="wall" data-page="mocks">
                    <main className="shell-solo">
                        <div className="feed-hello">
                            <h1 className="font-display">Mock Exam Portal</h1>
                            <p>Demo access is password-protected. Ask your admin for the unlock code.</p>
                        </div>
                        <div className="post" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center', padding: '32px 28px' }}>
                            <div style={{ margin: '0 auto 14px', width: 52, height: 52, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', boxShadow: 'var(--nm-xs)' }}>
                                <Icons.Lock className="w-5 h-5" />
                            </div>
                            <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Demo access</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 18 }}>Enter the demo password to open mock exams.</p>
                            <form onSubmit={unlockMockPortal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input
                                    id="mock-portal-pw"
                                    type="password"
                                    autoComplete="off"
                                    value={portalPw}
                                    onChange={(e) => setPortalPw(e.target.value)}
                                    className="clay-textarea"
                                    style={{ height: 'auto', textAlign: 'center', letterSpacing: '0.2em' }}
                                    placeholder="••••••"
                                    aria-label="Password"
                                />
                                {portalPwError && (
                                    <p style={{ color: 'var(--accent-deep)', fontSize: '0.8rem', fontWeight: 700 }}>{portalPwError}</p>
                                )}
                                <button type="submit" className="clay-cta">Unlock mock exams</button>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // If exam is active, render ExamSession
    if (activeSession && examConfig) {
        return (
            <ExamSession
                session={activeSession}
                config={examConfig}
                mcqQuestions={examQuestions.mcqs}
                essayQuestions={examQuestions.essays}
                userId={userId || 'anonymous'}
                onExit={handleExamExit}
                testCenter={testCenter}
            />
        );
    }

    const fullCards = examCards.filter(c => c.id.startsWith('full-'));
    const practiceCards = examCards.filter(c => !c.id.startsWith('full-'));

    return (
        <div className="proto wall-embedded">
            <div className="wall" data-page="mocks">
                <main className="shell-solo shell-wide">
                    {/* Masthead */}
                    <div className="feed-hello">
                        <h1 className="font-display">Mock Exam Portal</h1>
                        <p>Prometric-style simulations. Your performance refines your study recommendations.</p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    ) : (
                        <>
                            {/* Performance stats */}
                            {perf && (
                                <div className="post prof-card" style={{ marginBottom: 8 }}>
                                    <div className="prof-stats" style={{ marginTop: 0 }}>
                                        <div className="prof-stat">
                                            <strong className="font-display">#{perf.globalRank}</strong>
                                            <span>Global rank</span>
                                        </div>
                                        <div className="prof-stat">
                                            <strong className="font-display">{perf.averageMockScore}%</strong>
                                            <span>Avg score</span>
                                        </div>
                                        <div className="prof-stat">
                                            <strong className="font-display">{perf.percentile}th</strong>
                                            <span>Percentile</span>
                                        </div>
                                        <div className="prof-stat">
                                            <strong className="font-display">{recentSessions.length}</strong>
                                            <span>Sessions</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Full simulations */}
                            <h2 className="mock-h2">Full CMA simulations</h2>
                            <div className="mock-grid-2">
                                {fullCards.map((card) => (
                                    <div key={card.id} className="post mock-card">
                                        <div className="mock-card-top">
                                            <span className={`mock-badge ${card.badgeCls}`}>{card.badge}</span>
                                            <span className="mock-duration">{card.duration}</span>
                                        </div>
                                        <h3>{card.title}</h3>
                                        <p className="mock-sub">{card.subtitle}</p>
                                        <p className="mock-desc">{card.description}</p>
                                        <div className="mock-stats">
                                            <span><strong>{card.mcqCount}</strong> MCQs</span>
                                            <span><strong>{card.essayCount}</strong> Essays</span>
                                        </div>
                                        <ul className="mock-feats">
                                            {card.features.map((f) => (
                                                <li key={f}><Icons.CheckCircle className="w-[13px] h-[13px]" /> {f}</li>
                                            ))}
                                        </ul>
                                        <button
                                            type="button"
                                            className="btn-post mock-start"
                                            disabled={!!startingKey}
                                            onClick={() => startExam(card.configKey)}
                                        >
                                            {startingKey === card.configKey ? 'Preparing exam…' : 'Start simulation'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Practice sessions */}
                            <h2 className="mock-h2">Practice sessions</h2>
                            <div className="mock-grid-3">
                                {practiceCards.map((card) => (
                                    <div key={card.id} className="post mock-card mock-card-sm">
                                        <div className="mock-card-top">
                                            <span className="mock-meta">{card.subtitle}</span>
                                            <span className="mock-duration">{card.duration}</span>
                                        </div>
                                        <h3>{card.title}</h3>
                                        <p className="mock-desc">{card.description}</p>
                                        <button
                                            type="button"
                                            className="rooms-create mock-start-ghost"
                                            disabled={!!startingKey}
                                            onClick={() => startExam(card.configKey)}
                                        >
                                            {startingKey === card.configKey ? 'Preparing…' : 'Start'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Recent sessions */}
                            {recentSessions.length > 0 && (
                                <>
                                    <h2 className="mock-h2">Recent sessions</h2>
                                    <div className="post mock-recent">
                                        {recentSessions.map((session) => (
                                            <div key={session.id} className="mock-recent-row">
                                                <span className="res-ic"><Icons.FileText className="w-[18px] h-[18px]" /></span>
                                                <div className="res-info">
                                                    <strong>{session.test_title}</strong>
                                                    <span>
                                                        {new Date(session.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        {' · '}{String(session.status || '').replace('_', ' ').toLowerCase()}
                                                    </span>
                                                </div>
                                                <span className={`status-chip ${session.status === 'ESSAY_LOCKED' ? 'status-bad' : ''}`}>
                                                    {session.mcq_score !== null && session.mcq_score !== undefined ? `${session.mcq_score}%` : '—'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Hybrid strategy note */}
                            <div className="post mock-hybrid">
                                <span className="ai-chip"><Icons.Sparkles className="w-3 h-3" /> Hybrid question strategy</span>
                                <p>
                                    Every session blends <strong>70% real exam questions</strong> from our curated database with{' '}
                                    <strong>30% AI-generated variations</strong> — you never memorize the bank; every sitting is fresh.
                                </p>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};
