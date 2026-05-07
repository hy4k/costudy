import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { syncStudyTelemetry, fetchGlobalPerformance } from '../../services/fetsService';
import { examService, EXAM_CONFIGS, ExamConfig, getTestCenterSessionById, findActiveTestCenterExam } from '../../services/examService';
import { ExamSession } from './ExamSession';
import { STUDENT_PAGE_BG, StudentPageChrome } from '../student/StudentPageChrome';

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
    badgeColor: string;
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
            title: 'STANDARD SIMULATION',
            subtitle: 'Authentic CMA Experience',
            description: 'Complete 4-hour exam simulation. Essays unlock automatically after MCQ section.',
            duration: '4 Hours',
            mcqCount: 100,
            essayCount: 2,
            badge: 'RECOMMENDED',
            badgeColor: 'bg-emerald-500',
            features: [
                '3h MCQ Section (100 Questions)',
                '1h Essay Section (2 Scenarios)',
                'Essays unlock regardless of MCQ score',
                'Full Prometric-style interface'
            ],
            highlight: true
        },
        {
            id: 'full-challenge',
            configKey: 'full-challenge',
            title: 'CHALLENGE SIMULATION',
            subtitle: 'Test Your Readiness',
            description: 'Prove your mastery. Score 50%+ on MCQs to unlock the Essay section.',
            duration: '4 Hours',
            mcqCount: 100,
            essayCount: 2,
            badge: 'GATE: 50%',
            badgeColor: 'bg-amber-500',
            features: [
                '3h MCQ Section (100 Questions)',
                '1h Essay Section (2 Scenarios)',
                '⚠️ Must score 50%+ to unlock Essays',
                'Real exam pressure simulation'
            ]
        },
        {
            id: 'mcq-practice',
            configKey: 'mcq-practice',
            title: 'MCQ PRACTICE',
            subtitle: 'Focused Drilling',
            description: 'Practice MCQs without the essay component. Perfect for targeted preparation.',
            duration: '90 Minutes',
            mcqCount: 50,
            essayCount: 0,
            badge: 'MCQ ONLY',
            badgeColor: 'bg-blue-500',
            features: [
                '50 Mixed MCQ Questions',
                '70% Real + 30% AI-Generated',
                'Instant scoring & review',
                'No essay section'
            ]
        },
        {
            id: 'essay-practice',
            configKey: 'essay-practice',
            title: 'ESSAY PRACTICE',
            subtitle: 'Scenario Mastery',
            description: 'Focus on essay writing skills with detailed scenarios and structured response.',
            duration: '60 Minutes',
            mcqCount: 0,
            essayCount: 2,
            badge: 'ESSAY ONLY',
            badgeColor: 'bg-purple-500',
            features: [
                '2 Full Essay Scenarios',
                'Split-screen interface',
                'Real CMA-style requirements',
                'Word count tracking'
            ]
        },
        {
            id: 'quick-10',
            configKey: 'quick-10',
            title: 'QUICK DRILL',
            subtitle: '10 Questions',
            description: 'Fast practice session. Great for daily review or warm-up.',
            duration: '15 Minutes',
            mcqCount: 10,
            essayCount: 0,
            badge: 'QUICK',
            badgeColor: 'bg-slate-500',
            features: [
                '10 Random MCQs',
                'Mixed difficulty',
                'Rapid feedback',
                'Perfect for breaks'
            ]
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
            alert('Failed to start exam. Please try again.');
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

    if (mockPortalLocked && !portalUnlocked) {
        return (
            <div className={`w-full f-body text-slate-800 ${isStudentMocks ? `${STUDENT_PAGE_BG} min-h-full flex flex-col` : ''}`}>
                {isStudentMocks && (
                    <StudentPageChrome
                        eyebrow="Assessment"
                        title="Mock exam portal"
                        description="Demo access is password-protected. Ask your admin for the unlock code."
                        icon={<Icons.Lock className="h-6 w-6" />}
                        compact
                    />
                )}
                <div className={`flex flex-col items-center justify-center px-6 py-16 ${isStudentMocks ? 'flex-1' : ''}`}>
                <div className="w-full max-w-md">
                    {!isStudentMocks && (
                    <div className="flex items-center gap-3 mb-6 justify-center">
                        <div className="p-2.5 ep-neu-raised-sm rounded-xl bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
                            <Icons.Lock className="w-6 h-6 text-[#4a7a1c]" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                            Mock Exam Portal
                        </span>
                    </div>
                    )}
                    <div className={isStudentMocks ? 'rounded-2xl border border-brand/15 bg-white/95 p-8 shadow-clay-red-raised' : 'ep-neu-card p-8'}>
                        <h1 className="f-display text-2xl font-semibold text-slate-800 tracking-tight mb-2 text-center">
                            Demo access
                        </h1>
                        <p className="text-slate-600 text-sm text-center mb-6">
                            Enter the demo password to open mock exams.
                        </p>
                        <form onSubmit={unlockMockPortal} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="mock-portal-pw"
                                    className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2"
                                >
                                    Password
                                </label>
                                <input
                                    id="mock-portal-pw"
                                    type="password"
                                    autoComplete="off"
                                    value={portalPw}
                                    onChange={(e) => setPortalPw(e.target.value)}
                                    className={
                                        isStudentMocks
                                            ? 'w-full rounded-xl border border-brand/20 bg-white px-4 py-3 font-medium text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-brand/30'
                                            : 'w-full px-4 py-3 rounded-xl ep-neu-inset border-0 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8dc63f]/35'
                                    }
                                    placeholder="••••••"
                                />
                                {portalPwError && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{portalPwError}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className={
                                    isStudentMocks
                                        ? 'w-full rounded-xl bg-gradient-to-r from-brand to-brand-600 py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95'
                                        : 'w-full py-3.5 ep-neu-cta ep-shimmer rounded-xl bg-gradient-to-r from-[#8dc63f] via-[#7db536] to-[#6ba52e] text-white font-bold text-sm hover:opacity-95 transition-opacity'
                                }
                            >
                                Unlock mock exams
                            </button>
                        </form>
                    </div>
                </div>
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

    return (
        <div className={isStudentMocks ? `min-h-full ${STUDENT_PAGE_BG} f-body text-slate-800` : 'w-full text-left f-body text-slate-800'}>
            {isStudentMocks ? (
                <StudentPageChrome
                    eyebrow="CoStudy assessment engine"
                    title="Mock exam portal"
                    description="Prometric-style exam simulations. Your performance data refines your Study Cluster recommendations."
                    icon={<Icons.FileText className="h-6 w-6" />}
                />
            ) : (
            <div className="ep-neu-topbar border-b border-white/50 rounded-b-2xl mb-4">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-2xl ep-neu-raised-sm p-2.5 bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
                            <Icons.FileText className="h-6 w-6 text-[#4a7a1c]" />
                        </div>
                        <span className="f-display text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                            CoStudy Assessment Engine
                        </span>
                    </div>
                    <h1 className="f-display mb-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                        Mock Exam Portal
                    </h1>
                    <p className="max-w-2xl text-lg leading-[1.65] text-slate-600">
                        Prometric-authentic exam simulations. Your performance data refines your Study Cluster recommendations.
                    </p>
                </div>
            </div>
            )}

            {/* Stats Bar */}
            {!loading && perf && (
                <div className={isStudentMocks ? 'mb-4 border-b border-brand/10 bg-white/90 shadow-sm' : 'ep-neu-panel border-0 border-b border-white/40 mb-4'}>
                    <div className="mx-auto max-w-7xl px-6 py-6">
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {[
                                { label: 'Global Rank', value: `#${perf.globalRank}`, icon: <Icons.Trophy className="w-5 h-5" /> },
                                { label: 'Avg Score', value: `${perf.averageMockScore}%`, icon: <Icons.TrendingUp className="w-5 h-5" /> },
                                { label: 'Percentile', value: `${perf.percentile}th`, icon: <Icons.Award className="w-5 h-5" /> },
                                { label: 'Sessions', value: recentSessions.length, icon: <Icons.Clock className="w-5 h-5" /> },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={isStudentMocks ? 'rounded-xl bg-brand/10 p-3 text-brand' : 'p-3 ep-neu-raised-sm rounded-xl text-[#4a7a1c] bg-[#f6faf3]/80'}>{s.icon}</div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
                                        <div className="text-2xl font-black text-slate-900">{s.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center gap-6 py-20 text-slate-500">
                        <div className={isStudentMocks ? 'flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10' : 'ep-neu-raised flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]'}>
                            <Icons.CloudSync className={`h-8 w-8 animate-spin ${isStudentMocks ? 'text-brand' : 'text-[#4a7a1c]'}`} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">Initializing exam environment...</span>
                    </div>
                ) : (
                    <>
                        {/* Full Simulations Section */}
                        <div className="mb-16">
                            <h2 className="mb-2 flex items-center gap-3 text-2xl font-black text-slate-900">
                                <Icons.Target className={`h-6 w-6 ${isStudentMocks ? 'text-brand' : 'text-emerald-500'}`} />
                                Full CMA Simulations
                            </h2>
                            <p className="mb-8 text-slate-500">Complete 4-hour exam experience with MCQ and Essay sections</p>
                            
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                {examCards.filter(c => c.id.startsWith('full-')).map(card => (
                                    <ExamCardComponent
                                        key={card.id}
                                        card={card}
                                        onStart={() => startExam(card.configKey)}
                                        isStarting={startingKey === card.configKey}
                                        disabled={!!startingKey && startingKey !== card.configKey}
                                        studentTheme={isStudentMocks}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Practice Sessions Section */}
                        <div className="mb-16">
                            <h2 className="mb-2 flex items-center gap-3 text-2xl font-black text-slate-900">
                                <Icons.Zap className={`h-6 w-6 ${isStudentMocks ? 'text-brand-900/80' : 'text-blue-500'}`} />
                                Practice Sessions
                            </h2>
                            <p className="mb-8 text-slate-500">Focused practice for specific areas</p>
                            
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {examCards.filter(c => !c.id.startsWith('full-')).map(card => (
                                    <ExamCardComponent
                                        key={card.id}
                                        card={card}
                                        onStart={() => startExam(card.configKey)}
                                        isStarting={startingKey === card.configKey}
                                        disabled={!!startingKey && startingKey !== card.configKey}
                                        compact
                                        studentTheme={isStudentMocks}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Recent Sessions */}
                        {recentSessions.length > 0 && (
                            <div>
                                <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-900">
                                    <Icons.Clock className="h-6 w-6 text-slate-400" />
                                    Recent Sessions
                                </h2>
                                <div className={isStudentMocks ? 'overflow-hidden rounded-2xl border border-brand/15 bg-white shadow-clay-red-raised' : 'ep-neu-panel overflow-hidden rounded-2xl border-0'}>
                                    <table className="w-full">
                                        <thead className={isStudentMocks ? 'border-b border-brand/10 bg-brand/[0.06]' : 'border-b border-slate-200/70 bg-[#eef5ea]/70'}>
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Test</th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">MCQ Score</th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSessions.map((session, i) => (
                                                <tr key={session.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                    <td className="px-6 py-4 font-bold text-slate-900">{session.test_title}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            session.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                            session.status === 'ESSAY_LOCKED' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {session.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                                        {session.mcq_score !== null ? `${session.mcq_score}%` : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {new Date(session.started_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Hybrid Strategy Info */}
                        <div className={`mt-16 rounded-3xl p-10 text-slate-800 ${isStudentMocks ? 'border border-brand/15 bg-white/95 shadow-clay-red-raised' : 'ep-neu-panel'}`}>
                            <div className="flex items-start gap-6">
                                <div className={isStudentMocks ? 'rounded-2xl bg-brand/10 p-4' : 'p-4 ep-neu-raised-sm rounded-2xl bg-[#f6faf3]/90'}>
                                    <Icons.Sparkles className={`h-8 w-8 ${isStudentMocks ? 'text-brand' : 'text-[#4a7a1c]'}`} />
                                </div>
                                <div>
                                    <h3 className="f-display text-2xl font-semibold mb-2 text-slate-900">Hybrid Question Strategy</h3>
                                    <p className="text-slate-600 mb-4 max-w-2xl">
                                        Our question pool combines <span className="text-slate-900 font-bold">70% real exam questions</span> from
                                        our curated database with <span className="text-slate-900 font-bold">30% AI-generated variations</span>.
                                        This ensures you never memorize the bank — every session is fresh.
                                    </p>
                                    <div className="flex gap-4 flex-wrap">
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span>70% Real Questions</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                                            <span>30% AI-Generated</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Exam Card Component
const ExamCardComponent: React.FC<{
    card: ExamCard;
    onStart: () => void;
    isStarting: boolean;
    disabled?: boolean;
    compact?: boolean;
    studentTheme?: boolean;
}> = ({ card, onStart, isStarting, disabled, compact, studentTheme }) => {
    if (compact) {
        return (
            <div className={studentTheme ? 'rounded-2xl border border-brand/15 bg-white/95 p-6 shadow-clay-red-raised transition-shadow hover:shadow-md' : 'ep-neu-panel rounded-2xl border-0 p-6 transition-shadow hover:shadow-[0_14px_36px_rgba(95,115,88,0.18)]'}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className={`px-2 py-1 ${card.badgeColor} text-white text-[10px] font-black uppercase tracking-wider rounded`}>
                            {card.badge}
                        </span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">{card.duration}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{card.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{card.subtitle}</p>
                <div className="flex gap-4 mb-6 text-sm">
                    {card.mcqCount > 0 && (
                        <span className="text-slate-600"><strong>{card.mcqCount}</strong> MCQs</span>
                    )}
                    {card.essayCount > 0 && (
                        <span className="text-slate-600"><strong>{card.essayCount}</strong> Essays</span>
                    )}
                </div>
                <button
                    onClick={onStart}
                    disabled={isStarting || disabled}
                    className={
                        studentTheme
                            ? 'w-full rounded-xl bg-gradient-to-r from-brand to-brand-600 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50'
                            : 'w-full py-3 ep-neu-cta ep-shimmer rounded-xl bg-gradient-to-r from-[#8dc63f] via-[#7db536] to-[#6ba52e] text-white font-bold text-sm transition-opacity hover:opacity-95 disabled:opacity-50'
                    }
                >
                    {isStarting ? 'Starting...' : 'Start'}
                </button>
            </div>
        );
    }

    return (
        <div
            className={
                studentTheme
                    ? `relative overflow-hidden rounded-3xl border border-brand/15 bg-white/95 p-8 shadow-clay-red-raised transition-all hover:shadow-md ${card.highlight ? 'ring-2 ring-brand/30' : ''}`
                    : `ep-neu-panel relative overflow-hidden rounded-3xl border-0 p-8 transition-all hover:shadow-[0_18px_48px_rgba(95,115,88,0.2)] ${card.highlight ? 'ring-2 ring-[#8dc63f]/35' : ''}`
            }
        >
            {card.highlight && (
                <div className={`absolute right-0 top-0 h-32 w-32 blur-3xl ${studentTheme ? 'bg-brand/10' : 'bg-emerald-500/5'}`} />
            )}
            <div className="relative">
                <div className="flex justify-between items-start mb-6">
                    <span className={`px-3 py-1.5 ${card.badgeColor} text-white text-xs font-black uppercase tracking-wider rounded-lg`}>
                        {card.badge}
                    </span>
                    <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">{card.duration}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Total Duration</div>
                    </div>
                </div>

                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{card.title}</h3>
                <p className="text-lg text-slate-500 mb-4">{card.subtitle}</p>
                <p className="text-slate-600 mb-6">{card.description}</p>

                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className={studentTheme ? 'rounded-xl border border-brand/10 bg-brand/[0.04] p-4 text-center' : 'ep-neu-inset rounded-xl p-4 text-center'}>
                        <div className="text-3xl font-black text-slate-900">{card.mcqCount}</div>
                        <div className="text-xs font-bold uppercase text-slate-500">MCQ Questions</div>
                    </div>
                    <div className={studentTheme ? 'rounded-xl border border-brand/10 bg-brand/[0.04] p-4 text-center' : 'ep-neu-inset rounded-xl p-4 text-center'}>
                        <div className="text-3xl font-black text-slate-900">{card.essayCount}</div>
                        <div className="text-xs font-bold uppercase text-slate-500">Essay Scenarios</div>
                    </div>
                </div>

                <ul className="mb-8 space-y-2">
                    {card.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Icons.CheckBadge className={`h-4 w-4 shrink-0 ${studentTheme ? 'text-brand' : 'text-emerald-500'}`} />
                            {f}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={onStart}
                    disabled={isStarting || disabled}
                    className={
                        studentTheme
                            ? 'w-full rounded-2xl bg-gradient-to-r from-brand to-brand-600 py-5 font-black text-sm uppercase tracking-widest text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-50'
                            : 'w-full py-5 ep-neu-cta ep-shimmer rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-95 disabled:opacity-50 bg-gradient-to-r from-[#8dc63f] via-[#7db536] to-[#6ba52e]'
                    }
                >
                    {isStarting ? (
                        <span className="flex items-center justify-center gap-2">
                            <Icons.CloudSync className="w-5 h-5 animate-spin" />
                            Preparing Exam...
                        </span>
                    ) : (
                        'Start Exam Session'
                    )}
                </button>
            </div>
        </div>
    );
};
