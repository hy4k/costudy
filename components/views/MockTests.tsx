
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { fetchMockTestData, syncStudyTelemetry, fetchGlobalPerformance } from '../../services/fetsService';
import { ExamSession } from './ExamSession';

interface MockTestsProps {
  userId?: string;
}

export const MockTests: React.FC<MockTestsProps> = ({ userId }) => {
    const [tests, setTests] = useState<any[]>([]);
    const [perf, setPerf] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Exam Session State
    const [activeTestId, setActiveTestId] = useState<string | null>(null);
    const [activeTestTitle, setActiveTestTitle] = useState('');
    const [activeTestQuestions, setActiveTestQuestions] = useState(0);
    const [activeTestDuration, setActiveTestDuration] = useState(0); // in minutes

    useEffect(() => {
        const load = async () => {
            const targetId = userId || 'u-me';
            const [testData, perfData] = await Promise.all([
                fetchMockTestData(),
                fetchGlobalPerformance(targetId)
            ]);
            setTests(testData);
            setPerf(perfData);
            setLoading(false);
            syncStudyTelemetry({ userId: targetId, event: 'view_mock_tests', count: testData.length });
        };
        load();
    }, [userId]);

    const startTest = (test: any) => {
        // Parse Duration string (e.g. '4h' or '30m' or '1h 30m') to minutes
        let durationMinutes = 0;
        const hMatch = test.duration.match(/(\d+)h/);
        const mMatch = test.duration.match(/(\d+)m/);
        if (hMatch) durationMinutes += parseInt(hMatch[1]) * 60;
        if (mMatch) durationMinutes += parseInt(mMatch[1]);
        
        // If parsing fails fallback to default
        if (durationMinutes === 0) durationMinutes = 180;

        setActiveTestId(test.id);
        setActiveTestTitle(test.title);
        setActiveTestQuestions(test.questions);
        setActiveTestDuration(durationMinutes);
        
        syncStudyTelemetry({ userId, event: 'start_mock_test', testId: test.id });
    };

    if (activeTestId) {
        return (
            <ExamSession 
                testId={activeTestId}
                userId={userId || 'anon-session'} 
                title={activeTestTitle}
                questionCount={activeTestQuestions}
                durationMinutes={activeTestDuration}
                onExit={() => setActiveTestId(null)}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <header className="w-full text-center mb-16 relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand/5 blur-[120px] pointer-events-none"></div>
                 <div className="inline-flex items-center gap-2 mb-8 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em]">
                    <Icons.CloudSync className="w-4 h-4 text-brand" />
                    CoStudy Assessment Engine
                </div>
                <h2 className="text-8xl font-black text-slate-900 tracking-tighter leading-tight scale-y-110 mb-4 uppercase">Exam Portal</h2>
                <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">Simulated test environment. Your results instantly refine your Study Cluster recommendations.</p>
            </header>

            {!loading && perf && (
                <div className="max-w-5xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Global Rank', value: `#${perf.globalRank}`, icon: <Icons.Trophy className="w-4 h-4" /> },
                        { label: 'Average Score', value: `${perf.averageMockScore}%`, icon: <Icons.TrendingUp className="w-4 h-4" /> },
                        { label: 'Percentile', value: `${perf.percentile}th`, icon: <Icons.Award className="w-4 h-4" /> },
                        { label: 'Last Attempt', value: '2d ago', icon: <Icons.Clock className="w-4 h-4" /> },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl text-brand">{s.icon}</div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</div>
                                <div className="text-xl font-black text-slate-900 leading-none">{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center gap-6 text-slate-300 py-20">
                    <Icons.CloudSync className="w-20 h-20 animate-spin text-brand" />
                    <span className="font-black uppercase tracking-widest text-sm animate-pulse">Initializing Exam Environment...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl mx-auto">
                    {tests.map(test => (
                        <div key={test.id} className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-12 rounded-xl shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><Icons.Logo className="w-48 h-48" /></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">{test.title}</h3>
                                    <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">{test.difficulty}</span>
                                </div>
                                <div className="flex gap-12 mb-12">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</div>
                                        <div className="text-3xl font-black text-slate-900">{test.questions} MCQs</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Limit</div>
                                        <div className="text-3xl font-black text-slate-900">{test.duration}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => startTest(test)}
                                    className="w-full py-6 bg-brand text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-brand/20 active:scale-95 px-4"
                                >
                                    Start Session
                                </button>
                                <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    * Progress auto-saves to your profile
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
