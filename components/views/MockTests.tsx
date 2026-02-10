import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { syncStudyTelemetry, fetchGlobalPerformance } from '../../services/fetsService';
import { examService, EXAM_CONFIGS, ExamConfig } from '../../services/examService';
import { ExamSession } from './ExamSession';

interface MockTestsProps {
  userId?: string;
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

export const MockTests: React.FC<MockTestsProps> = ({ userId }) => {
    const [perf, setPerf] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    
    // Active exam state
    const [activeSession, setActiveSession] = useState<any>(null);
    const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
    const [examQuestions, setExamQuestions] = useState<{ mcqs: any[]; essays: any[] }>({ mcqs: [], essays: [] });
    const [isStarting, setIsStarting] = useState(false);

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
    }, [userId]);

    const startExam = async (configKey: string) => {
        if (isStarting) return;
        setIsStarting(true);
        
        const config = EXAM_CONFIGS[configKey];
        if (!config) {
            console.error('Invalid exam config:', configKey);
            setIsStarting(false);
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
            
            // Create session (or use local if offline)
            const session = await examService.createExamSession(userId || 'anonymous', configKey);
            
            setExamQuestions({ mcqs, essays });
            setExamConfig(config);
            setActiveSession(session);
            
        } catch (err) {
            console.error('Error starting exam:', err);
            alert('Failed to start exam. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleExamExit = () => {
        setActiveSession(null);
        setExamConfig(null);
        setExamQuestions({ mcqs: [], essays: [] });
    };

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
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-900 rounded-xl">
                            <Icons.FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            CoStudy Assessment Engine
                        </span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                        Mock Exam Portal
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl">
                        Prometric-authentic exam simulations. Your performance data refines your Study Cluster recommendations.
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            {!loading && perf && (
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Global Rank', value: `#${perf.globalRank}`, icon: <Icons.Trophy className="w-5 h-5" /> },
                                { label: 'Avg Score', value: `${perf.averageMockScore}%`, icon: <Icons.TrendingUp className="w-5 h-5" /> },
                                { label: 'Percentile', value: `${perf.percentile}th`, icon: <Icons.Award className="w-5 h-5" /> },
                                { label: 'Sessions', value: recentSessions.length, icon: <Icons.Clock className="w-5 h-5" /> },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600">{s.icon}</div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                                        <div className="text-2xl font-black text-slate-900">{s.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center gap-6 text-slate-400 py-20">
                        <Icons.CloudSync className="w-16 h-16 animate-spin text-slate-300" />
                        <span className="font-bold uppercase tracking-widest text-sm">Initializing Exam Environment...</span>
                    </div>
                ) : (
                    <>
                        {/* Full Simulations Section */}
                        <div className="mb-16">
                            <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                                <Icons.Target className="w-6 h-6 text-emerald-500" />
                                Full CMA Simulations
                            </h2>
                            <p className="text-slate-500 mb-8">Complete 4-hour exam experience with MCQ and Essay sections</p>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {examCards.filter(c => c.id.startsWith('full-')).map(card => (
                                    <ExamCardComponent 
                                        key={card.id} 
                                        card={card} 
                                        onStart={() => startExam(card.configKey)}
                                        isStarting={isStarting}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Practice Sessions Section */}
                        <div className="mb-16">
                            <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                                <Icons.Zap className="w-6 h-6 text-blue-500" />
                                Practice Sessions
                            </h2>
                            <p className="text-slate-500 mb-8">Focused practice for specific areas</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {examCards.filter(c => !c.id.startsWith('full-')).map(card => (
                                    <ExamCardComponent 
                                        key={card.id} 
                                        card={card} 
                                        onStart={() => startExam(card.configKey)}
                                        isStarting={isStarting}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Recent Sessions */}
                        {recentSessions.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                    <Icons.Clock className="w-6 h-6 text-slate-400" />
                                    Recent Sessions
                                </h2>
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
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
                        <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 text-white">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <Icons.Sparkles className="w-8 h-8 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black mb-2">Hybrid Question Strategy</h3>
                                    <p className="text-slate-300 mb-4 max-w-2xl">
                                        Our question pool combines <span className="text-white font-bold">70% real exam questions</span> from 
                                        our curated database with <span className="text-white font-bold">30% AI-generated variations</span>. 
                                        This ensures you never memorize the bank — every session is fresh.
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                            <span className="text-slate-300">70% Real Questions</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                            <span className="text-slate-300">30% AI-Generated</span>
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
    compact?: boolean;
}> = ({ card, onStart, isStarting, compact }) => {
    if (compact) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
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
                    disabled={isStarting}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {isStarting ? 'Starting...' : 'Start'}
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-3xl border-2 ${card.highlight ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-slate-200'} p-8 hover:shadow-xl transition-all relative overflow-hidden`}>
            {card.highlight && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl"></div>
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

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-slate-900">{card.mcqCount}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">MCQ Questions</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-slate-900">{card.essayCount}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Essay Scenarios</div>
                    </div>
                </div>

                <ul className="space-y-2 mb-8">
                    {card.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Icons.CheckBadge className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            {f}
                        </li>
                    ))}
                </ul>

                <button 
                    onClick={onStart}
                    disabled={isStarting}
                    className={`w-full py-5 ${card.highlight ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg`}
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
