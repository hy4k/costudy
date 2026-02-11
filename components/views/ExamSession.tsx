import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icons } from '../Icons';
import { examService, ExamConfig, MCQQuestion, EssayQuestion, MCQAnswer, EssayAnswer } from '../../services/examService';
import { getIntroPageContent, TOTAL_INTRO_PAGES } from './ExamIntroPages';

// ============================================
// TYPES
// ============================================

interface ExamSessionProps {
    session: any;
    config: ExamConfig;
    mcqQuestions: MCQQuestion[];
    essayQuestions: EssayQuestion[];
    userId: string;
    onExit: () => void;
}

type ExamPhase = 'CONFIRM' | 'TERMS' | 'INTRODUCTION' | 'MCQ_TEST' | 'MCQ_RESULTS' | 'ESSAY_TEST' | 'FINAL_RESULTS';

// ============================================
// MAIN COMPONENT
// ============================================

export const ExamSession: React.FC<ExamSessionProps> = ({ 
    session, 
    config, 
    mcqQuestions, 
    essayQuestions, 
    userId, 
    onExit 
}) => {
    // Phase Management
    const [phase, setPhase] = useState<ExamPhase>('CONFIRM');
    
    // MCQ State
    const [mcqIndex, setMcqIndex] = useState(0);
    const [mcqAnswers, setMcqAnswers] = useState<Map<string, MCQAnswer>>(new Map());
    const [mcqTimeRemaining, setMcqTimeRemaining] = useState(config.mcqDurationMinutes * 60);
    
    // Essay State
    const [essayIndex, setEssayIndex] = useState(0);
    const [essayAnswers, setEssayAnswers] = useState<Map<string, EssayAnswer>>(new Map());
    const [essayTimeRemaining, setEssayTimeRemaining] = useState(config.essayDurationMinutes * 60);
    
    // Results
    const [mcqResults, setMcqResults] = useState<{ correct: number; total: number; percentage: number; essayUnlocked: boolean } | null>(null);
    
    // UI State
    const [introTimeRemaining, setIntroTimeRemaining] = useState(15 * 60);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [introPage, setIntroPage] = useState(1);
    const [showCalculator, setShowCalculator] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
    
    const essayInputRef = useRef<HTMLTextAreaElement>(null);
    
    // Persistence key for localStorage (allows navigation away and return)
    const EXAM_STATE_KEY = `costudy_exam_${session.id}`;

    // Load saved state from localStorage (for resuming after navigation away)
    useEffect(() => {
        const savedState = localStorage.getItem(EXAM_STATE_KEY);
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.phase && state.phase !== 'CONFIRM' && state.phase !== 'TERMS') {
                    setPhase(state.phase);
                    setMcqIndex(state.mcqIndex || 0);
                    setEssayIndex(state.essayIndex || 0);
                    setMcqTimeRemaining(state.mcqTimeRemaining ?? config.mcqDurationMinutes * 60);
                    setEssayTimeRemaining(state.essayTimeRemaining ?? config.essayDurationMinutes * 60);
                    setIntroPage(state.introPage || 1);
                    if (state.mcqAnswers) {
                        setMcqAnswers(new Map(Object.entries(state.mcqAnswers)));
                    }
                    if (state.essayAnswers) {
                        setEssayAnswers(new Map(Object.entries(state.essayAnswers)));
                    }
                    if (state.mcqResults) {
                        setMcqResults(state.mcqResults);
                    }
                    return; // Skip normal initialization
                }
            } catch (e) {
                console.error('Failed to load exam state:', e);
            }
        }
        
        // Normal initialization if no saved state
        const mcqMap = new Map<string, MCQAnswer>();
        mcqQuestions.forEach(q => {
            mcqMap.set(q.id, { selected: null, flagged: false, timeSpent: 0 });
        });
        setMcqAnswers(mcqMap);
        
        const essayMap = new Map<string, EssayAnswer>();
        essayQuestions.forEach(q => {
            essayMap.set(q.id, { text: '', wordCount: 0, timeSpent: 0 });
        });
        setEssayAnswers(essayMap);
    }, []);
    
    // Save state to localStorage whenever important state changes
    useEffect(() => {
        if (phase === 'CONFIRM' || phase === 'TERMS') return; // Don't save pre-exam states
        
        const stateToSave = {
            phase,
            mcqIndex,
            essayIndex,
            mcqTimeRemaining,
            essayTimeRemaining,
            introPage,
            mcqAnswers: Object.fromEntries(mcqAnswers),
            essayAnswers: Object.fromEntries(essayAnswers),
            mcqResults,
            savedAt: Date.now()
        };
        localStorage.setItem(EXAM_STATE_KEY, JSON.stringify(stateToSave));
    }, [phase, mcqIndex, essayIndex, mcqTimeRemaining, essayTimeRemaining, introPage, mcqAnswers, essayAnswers, mcqResults]);
    
    // Clear saved state when exam is completed
    const clearSavedState = useCallback(() => {
        localStorage.removeItem(EXAM_STATE_KEY);
    }, [EXAM_STATE_KEY]);

    // Timer Effects
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        if (phase === 'CONFIRM' || phase === 'TERMS' || phase === 'INTRODUCTION') {
            timer = setInterval(() => {
                setIntroTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        } else if (phase === 'MCQ_TEST' && mcqTimeRemaining > 0) {
            timer = setInterval(() => {
                setMcqTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleFinishMCQ();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (phase === 'ESSAY_TEST' && essayTimeRemaining > 0) {
            timer = setInterval(() => {
                setEssayTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleFinishEssay();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        
        return () => clearInterval(timer);
    }, [phase, mcqTimeRemaining, essayTimeRemaining]);

    // Auto-save every 60 seconds
    useEffect(() => {
        if (phase !== 'MCQ_TEST' && phase !== 'ESSAY_TEST') return;
        
        const interval = setInterval(async () => {
            setSaveStatus('SAVING');
            try {
                await examService.saveExamProgress(session.id, {
                    currentQuestionIndex: phase === 'MCQ_TEST' ? mcqIndex : essayIndex,
                    mcqAnswers: Object.fromEntries(mcqAnswers),
                    essayAnswers: Object.fromEntries(essayAnswers),
                    mcqTimeSpent: (config.mcqDurationMinutes * 60) - mcqTimeRemaining,
                    essayTimeSpent: (config.essayDurationMinutes * 60) - essayTimeRemaining
                });
                setSaveStatus('SAVED');
            } catch {
                setSaveStatus('ERROR');
            }
        }, 60000);
        
        return () => clearInterval(interval);
    }, [phase, mcqIndex, essayIndex, mcqAnswers, essayAnswers, mcqTimeRemaining, essayTimeRemaining]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleSelectMCQAnswer = (letter: string) => {
        const currentQ = mcqQuestions[mcqIndex];
        const updated = new Map(mcqAnswers);
        const existing = updated.get(currentQ.id);
        if (existing) {
            updated.set(currentQ.id, { ...existing, selected: letter });
            setMcqAnswers(updated);
        }
    };

    const handleFlagQuestion = () => {
        const currentQ = mcqQuestions[mcqIndex];
        const updated = new Map(mcqAnswers);
        const existing = updated.get(currentQ.id);
        if (existing) {
            updated.set(currentQ.id, { ...existing, flagged: !existing.flagged });
            setMcqAnswers(updated);
        }
    };

    const handleEssayChange = (text: string) => {
        const currentQ = essayQuestions[essayIndex];
        const updated = new Map(essayAnswers);
        const existing = updated.get(currentQ.id);
        if (existing) {
            updated.set(currentQ.id, { 
                ...existing, 
                text, 
                wordCount: text.trim().split(/\s+/).filter(Boolean).length 
            });
            setEssayAnswers(updated);
        }
    };

    const handleFinishMCQ = useCallback(async () => {
        // Build question data for scoring
        const questionData = mcqQuestions.map(q => ({
            id: q.id,
            correct_answer: q.correct_answer
        }));
        
        const results = await examService.completeMCQSection(
            session.id,
            Object.fromEntries(mcqAnswers),
            questionData,
            (config.mcqDurationMinutes * 60) - mcqTimeRemaining,
            config.testType,
            config.mcqPassThreshold
        );
        
        setMcqResults(results);
        setPhase('MCQ_RESULTS');
    }, [mcqQuestions, mcqAnswers, mcqTimeRemaining, session.id, config]);

    const handleContinueToEssay = () => {
        if (mcqResults?.essayUnlocked && essayQuestions.length > 0) {
            setPhase('ESSAY_TEST');
        } else {
            setPhase('FINAL_RESULTS');
        }
    };

    const handleFinishEssay = useCallback(async () => {
        await examService.completeEssaySection(
            session.id,
            Object.fromEntries(essayAnswers),
            (config.essayDurationMinutes * 60) - essayTimeRemaining
        );
        setPhase('FINAL_RESULTS');
    }, [essayAnswers, essayTimeRemaining, session.id, config]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ============================================
    // PHASE RENDERERS
    // ============================================

    // 1. CONFIRM DETAILS (Prometric Style)
    if (phase === 'CONFIRM') {
        return (
            <div className="fixed inset-0 bg-[#e8e8e8] flex items-center justify-center p-4 z-50 font-sans">
                <div className="bg-white shadow-2xl w-full max-w-lg border border-slate-300">
                    {/* Header */}
                    <div className="bg-[#4d4d4d] text-white px-6 py-3 flex justify-between items-center">
                        <span className="font-bold text-lg">Confirm Details</span>
                        <div className="flex items-center gap-2">
                            <Icons.Clock className="w-5 h-5" />
                            <span className="font-mono text-lg">{formatTime(introTimeRemaining)}</span>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-8 flex flex-col items-center">
                        {/* CMA Logo */}
                        <div className="mb-8">
                            <div className="border border-slate-300 px-4 py-2 inline-flex items-center gap-3">
                                <span className="font-serif font-bold text-3xl text-slate-600 italic border-r border-slate-300 pr-3">CMA</span>
                                <div className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                                    <div>IMA's Certification for</div>
                                    <div>Accountants and</div>
                                    <div>Financial Professionals</div>
                                    <div>in Business</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Details Box */}
                        <div className="border border-slate-300 bg-slate-50 p-6 w-full mb-8">
                            <div className="grid grid-cols-3 gap-y-3 text-sm">
                                <span className="text-slate-500 font-bold">Last Name:</span>
                                <span className="col-span-2 font-bold text-slate-800 uppercase">{userId.split('-')[0] || 'USER'}</span>
                                <span className="text-slate-500 font-bold">First Name:</span>
                                <span className="col-span-2 font-bold text-slate-800">Demo</span>
                                <span className="text-slate-500 font-bold">Test Name:</span>
                                <span className="col-span-2 font-bold text-slate-800">{config.title}</span>
                                <span className="text-slate-500 font-bold">Language:</span>
                                <span className="col-span-2 font-bold text-slate-800">us</span>
                            </div>
                        </div>
                        
                        <p className="mb-8 text-slate-700 font-medium text-center">Are the details above correct?</p>
                        
                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setPhase('TERMS')} 
                                className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2.5 font-bold shadow-sm flex items-center gap-2"
                            >
                                <Icons.CheckBadge className="w-5 h-5" /> Confirm
                            </button>
                            <button 
                                onClick={onExit} 
                                className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2.5 font-bold shadow-sm flex items-center gap-2"
                            >
                                <Icons.Plus className="w-5 h-5 rotate-45" /> Cancel
                            </button>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="px-4 py-2 bg-white text-right text-xs text-slate-400 font-medium border-t border-slate-200">
                        Prometric
                    </div>
                </div>
            </div>
        );
    }

    // 2. TERMS AND CONDITIONS
    if (phase === 'TERMS') {
        return (
            <div className="fixed inset-0 bg-[#e8e8e8] flex items-center justify-center p-4 z-50 font-sans">
                <div className="bg-white shadow-2xl w-full max-w-[1000px] h-[85vh] flex flex-col border border-slate-400">
                    {/* Header */}
                    <div className="bg-[#4d4d4d] text-white px-4 py-2 flex justify-between items-center shrink-0">
                        <span className="font-bold text-lg">Agree to Terms</span>
                        <div className="flex items-center gap-2">
                            <Icons.Clock className="w-5 h-5" />
                            <span className="font-mono text-lg">{formatTime(introTimeRemaining)}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-white">
                        {/* CMA Logo */}
                        <div className="mb-6">
                            <div className="border border-slate-300 px-4 py-2 inline-flex items-center gap-3">
                                <span className="font-serif font-bold text-4xl text-slate-600 italic border-r border-slate-300 pr-3">CMA</span>
                                <div className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                                    <div>IMA's Certification for</div>
                                    <div>Accountants and</div>
                                    <div>Financial Professionals</div>
                                    <div>in Business</div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-slate-700 text-lg text-center mb-6">
                            Please ensure you scroll down to read and accept<br/>the organisation's Terms.
                        </p>

                        {/* Agreement Box */}
                        <div className="w-full max-w-4xl border-[3px] border-[#f7b500] rounded-xl p-1 mb-8 bg-white">
                            <div className="max-h-[350px] overflow-y-auto p-8 text-justify text-sm leading-relaxed text-slate-800">
                                <h3 className="text-center font-bold text-slate-800 mb-8 uppercase text-base">CONFIDENTIALITY AGREEMENT</h3>
                                <p className="mb-6">
                                    I hereby attest that I will not remove any examination materials from this test site. I understand that examination content is confidential and proprietary, and that unauthorized disclosure or reproduction of any portion of this examination is prohibited.
                                </p>
                                <p className="mb-6">
                                    I agree to maintain the confidentiality of the examination questions and content, and I will not discuss, disseminate, or otherwise disclose examination content to any person or entity at any time.
                                </p>
                                <p className="mb-6">
                                    I understand that violating this agreement may result in the invalidation of my examination scores, prohibition from future examinations, and other penalties as determined by the IMA.
                                </p>
                                <p className="font-bold">
                                    By clicking "I accept these terms" you affirm that you accept the terms of this agreement.
                                </p>
                            </div>
                        </div>

                        {/* Checkbox */}
                        <div className="mb-10 flex items-center gap-3">
                            <div 
                                onClick={() => setTermsAccepted(!termsAccepted)}
                                className={`w-6 h-6 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer bg-white transition-all ${termsAccepted ? 'border-slate-800' : ''}`}
                            >
                                {termsAccepted && <div className="w-3 h-3 bg-slate-800 rounded-[1px]"></div>}
                            </div>
                            <span className="text-slate-500 font-medium select-none cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
                                I accept these terms.
                            </span>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button onClick={onExit} className="bg-[#aecf68] hover:bg-[#a8c64d] text-white px-10 py-3 font-bold shadow-sm flex items-center gap-2 text-sm uppercase">
                                <span className="font-bold text-xl">×</span> Exit
                            </button>
                            <button 
                                onClick={() => termsAccepted && setPhase('INTRODUCTION')} 
                                disabled={!termsAccepted}
                                className={`px-10 py-3 font-bold shadow-sm flex items-center gap-2 text-sm uppercase ${termsAccepted ? 'bg-[#8dc63f] hover:bg-[#7db536] text-white' : 'bg-[#e0e0e0] text-slate-400 cursor-not-allowed'}`}
                            >
                                <Icons.CheckBadge className="w-5 h-5" /> Continue
                            </button>
                        </div>
                    </div>

                    <div className="px-4 py-2 bg-white text-right text-xs text-slate-400 border-t border-slate-200">
                        Prometric
                    </div>
                </div>
            </div>
        );
    }

    // 3. INTRODUCTION
    if (phase === 'INTRODUCTION') {
        const introProgress = Math.round((introPage / TOTAL_INTRO_PAGES) * 100);
        
        return (
            <div className="flex flex-col h-screen bg-white font-sans">
                {/* Top Header */}
                <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center h-14 shrink-0">
                    <div className="text-sm font-bold leading-tight">
                        Page: {introPage}<br/>
                        <span className="font-medium text-slate-300">Section: Introduction</span>
                    </div>
                    <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                        <Icons.Clock className="w-5 h-5" />
                        <div>
                            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">Intro Time</div>
                            <div className="font-mono text-lg font-bold">{formatTime(introTimeRemaining)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-right hidden sm:block">
                            <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1">
                                <div className="bg-white h-full transition-all" style={{width: `${introProgress}%`}}></div>
                            </div>
                            Progress {introProgress}%
                        </div>
                    </div>
                </div>
                
                {/* Green Info Bar */}
                <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center h-8 shrink-0">
                    <span className="font-bold text-sm">Test: {config.title}</span>
                    <span className="font-bold text-sm">Candidate: {userId.toUpperCase().slice(0, 8)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Page Nav */}
                    <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0">
                        {[...Array(TOTAL_INTRO_PAGES)].map((_, i) => (
                            <div 
                                key={i} 
                                onClick={() => setIntroPage(i+1)} 
                                className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer mb-1 border border-l-0 ${
                                    i+1 === introPage ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' : 'bg-[#9cc65a] text-white border-[#8dc63f] opacity-80'
                                }`}
                            >
                                {i+1}
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-12 overflow-y-auto">
                        <div className="max-w-4xl">
                            {getIntroPageContent({
                                page: introPage,
                                config,
                                mcqCount: mcqQuestions.length,
                                essayCount: essayQuestions.length
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#4d4d4d] px-4 py-3 flex justify-between items-center border-t border-[#666] shrink-0">
                    <div></div>
                    <div className="flex gap-4">
                        <button onClick={() => setIntroPage(Math.max(1, introPage - 1))} className="bg-[#8dc63f] text-white px-6 py-2 font-bold flex items-center gap-1 text-sm">
                            <Icons.ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button onClick={() => setIntroPage(Math.min(TOTAL_INTRO_PAGES, introPage + 1))} className="bg-[#8dc63f] text-white px-6 py-2 font-bold flex items-center gap-1 text-sm">
                            Next <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                            className="bg-[#8dc63f] text-white px-6 py-2 font-bold flex items-center gap-1 ml-4 text-sm" 
                            onClick={() => setPhase(mcqQuestions.length > 0 ? 'MCQ_TEST' : 'ESSAY_TEST')}
                        >
                            Start the Test <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. MCQ TEST
    if (phase === 'MCQ_TEST') {
        const currentQ = mcqQuestions[mcqIndex];
        const currentAns = mcqAnswers.get(currentQ?.id);
        const answeredCount = Array.from(mcqAnswers.values()).filter(a => a.selected !== null).length;
        const progressPercent = Math.round((answeredCount / mcqQuestions.length) * 100);

        return (
            <div className="flex flex-col h-screen bg-white font-sans relative">
                {/* Top Header */}
                <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center h-14 shrink-0 z-20">
                    <div className="text-sm font-bold leading-tight">
                        Page: {mcqIndex + 1}<br/>
                        <span className="font-medium text-slate-300">Section: {currentQ?.section || 'MCQ'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                        <Icons.Clock className="w-5 h-5" />
                        <div>
                            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">Section Time Remaining</div>
                            <div className={`font-mono text-xl font-bold ${mcqTimeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
                                {formatTime(mcqTimeRemaining)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`text-[9px] font-bold uppercase tracking-widest ${saveStatus === 'SAVING' ? 'text-yellow-400' : saveStatus === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {saveStatus === 'SAVING' ? 'Syncing...' : saveStatus === 'ERROR' ? 'Sync Failed' : 'Saved'}
                        </div>
                        <div className="text-xs text-right hidden sm:block">
                            <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1">
                                <div className="bg-white h-full transition-all" style={{width: `${progressPercent}%`}}></div>
                            </div>
                            Progress {progressPercent}%
                        </div>
                        <button onClick={handleFinishMCQ} className="bg-[#e6e6e6] hover:bg-white text-[#333] px-4 py-2 font-bold text-sm">
                            Finish Section
                        </button>
                    </div>
                </div>

                {/* Green Info Bar */}
                <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center h-8 shrink-0 z-10">
                    <span className="font-bold text-sm">Test: {config.title}</span>
                    <span className="font-bold text-sm">Candidate: {userId.toUpperCase().slice(0, 8)}</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Question Nav Sidebar */}
                    <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0">
                        {mcqQuestions.map((q, i) => {
                            const ans = mcqAnswers.get(q.id);
                            const isAnswered = ans?.selected !== null;
                            const isFlagged = ans?.flagged;
                            return (
                                <div 
                                    key={q.id} 
                                    onClick={() => setMcqIndex(i)}
                                    className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold shadow-sm cursor-pointer border border-l-0 relative mb-1 ${
                                        i === mcqIndex ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' : 
                                        isAnswered ? 'bg-[#666] text-white border-[#4d4d4d]' :
                                        'bg-[#9cc65a] text-white border-[#8dc63f] opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    {i + 1}
                                    {i === mcqIndex && <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-[#8dc63f]"></div>}
                                    {isFlagged && <div className="absolute top-0 right-0 p-[1px]"><Icons.Flag className="w-2 h-2 fill-current text-white" /></div>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-4 border-b border-slate-200 pb-2 flex justify-between items-center">
                                <h2 className="font-bold text-black text-lg">Multiple-Choice Question</h2>
                                <button onClick={() => setShowCalculator(!showCalculator)} className="flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-bold text-slate-700">
                                    <Icons.Grid className="w-3 h-3" /> Calculator
                                </button>
                            </div>

                            <div className="bg-white border-2 border-slate-300 p-8 min-h-[300px] mb-8">
                                <p className="text-lg font-medium text-slate-900 leading-relaxed mb-8">
                                    {currentQ?.question_text}
                                </p>

                                <div className="space-y-4">
                                    {['A', 'B', 'C', 'D'].map((letter) => {
                                        const optionKey = `option_${letter.toLowerCase()}` as keyof MCQQuestion;
                                        const text = currentQ?.[optionKey];
                                        const isSelected = currentAns?.selected === letter;
                                        return (
                                            <div 
                                                key={letter} 
                                                onClick={() => handleSelectMCQAnswer(letter)}
                                                className="flex items-center gap-4 cursor-pointer group"
                                            >
                                                <div className={`font-bold text-sm w-4 ${isSelected ? 'text-black scale-110' : 'text-slate-600'}`}>{letter}</div>
                                                <div className={`flex-1 p-3 border-2 transition-all ${isSelected ? 'border-black bg-[#fff9c4]' : 'border-slate-400 bg-white group-hover:border-slate-600'}`}>
                                                    <span className={`text-slate-900 text-base ${isSelected ? 'font-bold' : 'font-medium'}`}>{text}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calculator Overlay */}
                    {showCalculator && (
                        <div className="absolute top-20 right-20 w-64 bg-[#e0e0e0] border-2 border-slate-400 rounded shadow-xl z-50 p-2">
                            <div className="bg-slate-700 text-white px-2 py-1 text-xs flex justify-between mb-2">
                                <span>Calculator</span>
                                <button onClick={() => setShowCalculator(false)} className="hover:text-red-300">X</button>
                            </div>
                            <div className="bg-white border border-slate-400 h-10 mb-2 text-right p-1 font-mono text-lg flex items-center justify-end">0</div>
                            <div className="grid grid-cols-4 gap-1">
                                {['MC','MR','MS','M+','←','CE','C','±','√','7','8','9','/','%','4','5','6','*','1/x','1','2','3','-','=','0','.','+'].map((k, idx) => (
                                    <button key={idx} className={`bg-slate-200 border border-slate-300 p-2 text-[10px] font-bold hover:bg-slate-300 ${k === '=' ? 'row-span-2 bg-slate-300' : ''}`}>{k}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Review */}
                    {isReviewOpen && (
                        <div className="absolute bottom-0 left-0 w-72 h-[450px] z-40 bg-[#f0f0f0] border-t border-r border-slate-400 shadow-xl flex flex-col">
                            <div className="bg-[#4d4d4d] text-white px-3 py-2 font-bold text-xs flex justify-between items-center">
                                <span>Section Review</span>
                                <button onClick={() => setIsReviewOpen(false)} className="hover:text-red-300"><Icons.Plus className="w-3 h-3 rotate-45" /></button>
                            </div>
                            <div className="p-4 bg-[#e6e6e6] flex-1 overflow-y-auto">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {mcqQuestions.map((q, idx) => {
                                        const ans = mcqAnswers.get(q.id);
                                        const isSelected = ans?.selected;
                                        return (
                                            <button 
                                                key={q.id}
                                                onClick={() => { setMcqIndex(idx); setIsReviewOpen(false); }}
                                                className={`h-8 border relative font-bold text-xs flex items-center justify-center ${
                                                    isSelected ? 'bg-[#8dc63f] text-white border-[#7db536]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                }`}
                                            >
                                                {idx + 1}
                                                {ans?.flagged && <div className="absolute top-0 right-0 p-0.5"><Icons.Flag className="w-2 h-2 fill-current text-white" /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-[#4d4d4d] px-6 py-4 flex justify-between items-center border-t border-[#666] shrink-0 z-30 h-16">
                    <div className="flex gap-2">
                        <button onClick={() => setIsReviewOpen(!isReviewOpen)} className={`w-10 h-10 rounded flex items-center justify-center text-white border ${isReviewOpen ? 'bg-white/20 border-white/40' : 'bg-transparent border-transparent hover:bg-white/10'}`}>
                            <Icons.Grid className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handleFlagQuestion}
                            className={`px-4 py-2 font-bold flex items-center gap-2 text-sm ${currentAns?.flagged ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
                        >
                            <Icons.Flag className={`w-4 h-4 ${currentAns?.flagged ? 'fill-current' : ''}`} />
                            {currentAns?.flagged ? 'Flagged' : 'Flag'}
                        </button>

                        <div className="h-full w-px bg-[#666] mx-2"></div>

                        <button 
                            onClick={() => setMcqIndex(Math.max(0, mcqIndex - 1))}
                            disabled={mcqIndex === 0}
                            className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-6 py-2 font-bold flex items-center gap-1 text-sm"
                        >
                            <Icons.ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        
                        <button 
                            onClick={() => setMcqIndex(Math.min(mcqQuestions.length - 1, mcqIndex + 1))}
                            className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 font-bold flex items-center gap-1 text-sm"
                        >
                            Next <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 5. MCQ RESULTS
    if (phase === 'MCQ_RESULTS' && mcqResults) {
        const passed = mcqResults.percentage >= (config.mcqPassThreshold || 0) * 100;
        
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-6">
                <div className="bg-white shadow-2xl max-w-2xl w-full border border-slate-300">
                    <div className="bg-[#4d4d4d] text-white px-6 py-4 font-bold text-lg flex justify-between">
                        <span>MCQ Section Complete</span>
                        <span className="text-[#8dc63f] uppercase tracking-widest text-sm">Prometric</span>
                    </div>
                    
                    <div className="p-10 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'border-[#8dc63f] text-[#8dc63f]' : 'border-amber-500 text-amber-500'}`}>
                            {passed ? <Icons.CheckBadge className="w-12 h-12" /> : <Icons.AlertCircle className="w-12 h-12" />}
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                            {mcqResults.percentage}% Score
                        </h2>
                        <p className="text-slate-500 mb-8 font-medium text-center">
                            {mcqResults.correct} of {mcqResults.total} questions correct
                        </p>

                        <div className="w-full bg-slate-50 border border-slate-200 p-8 grid grid-cols-3 gap-8 text-center mb-8">
                            <div>
                                <div className="text-4xl font-black text-slate-800 mb-1">{mcqResults.percentage}%</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Score</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black text-[#8dc63f] mb-1">{mcqResults.correct}</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Correct</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black text-red-500 mb-1">{mcqResults.total - mcqResults.correct}</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Incorrect</div>
                            </div>
                        </div>

                        {/* Essay Unlock Message */}
                        {essayQuestions.length > 0 && (
                            <div className={`w-full p-6 rounded-xl mb-8 ${mcqResults.essayUnlocked ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
                                {mcqResults.essayUnlocked ? (
                                    <div className="flex items-center gap-4">
                                        <Icons.CheckBadge className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-emerald-800 text-lg">Essay Section Unlocked!</p>
                                            <p className="text-emerald-600">You have {config.essayDurationMinutes} minutes to complete {essayQuestions.length} essay questions.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <Icons.Lock className="w-10 h-10 text-amber-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-amber-800 text-lg">Essay Section Locked</p>
                                            <p className="text-amber-600">You needed {(config.mcqPassThreshold || 0.5) * 100}% to unlock. Your score: {mcqResults.percentage}%</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button 
                            onClick={handleContinueToEssay}
                            className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-12 py-3 font-bold shadow-lg uppercase tracking-widest text-sm"
                        >
                            {mcqResults.essayUnlocked && essayQuestions.length > 0 ? 'Continue to Essays' : 'View Final Results'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 6. ESSAY TEST
    if (phase === 'ESSAY_TEST') {
        const currentQ = essayQuestions[essayIndex];
        const currentAns = essayAnswers.get(currentQ?.id);
        
        return (
            <div className="flex flex-col h-screen bg-white font-sans">
                {/* Top Header */}
                <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center h-14 shrink-0">
                    <div className="text-sm font-bold leading-tight">
                        Essay: {essayIndex + 1} of {essayQuestions.length}<br/>
                        <span className="font-medium text-slate-300">Topic: {currentQ?.topic || 'Essay'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                        <Icons.Clock className="w-5 h-5" />
                        <div>
                            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">Essay Time Remaining</div>
                            <div className={`font-mono text-xl font-bold ${essayTimeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
                                {formatTime(essayTimeRemaining)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={handleFinishEssay} className="bg-[#e6e6e6] hover:bg-white text-[#333] px-4 py-2 font-bold text-sm">
                            Finish Section
                        </button>
                    </div>
                </div>

                {/* Green Info Bar */}
                <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center h-8 shrink-0">
                    <span className="font-bold text-sm">Test: {config.title} - Essay Section</span>
                    <span className="font-bold text-sm">Candidate: {userId.toUpperCase().slice(0, 8)}</span>
                </div>

                {/* Split Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Scenario */}
                    <div className="w-1/2 bg-slate-50 border-r border-slate-300 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                            <span className="font-bold text-sm text-slate-700 uppercase">Scenario</span>
                            <Icons.FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                                {currentQ?.scenario_text}
                            </pre>
                            
                            <div className="mt-8 pt-4 border-t border-slate-200">
                                <h4 className="font-bold text-slate-800 mb-4 uppercase text-sm">Requirements:</h4>
                                <ol className="list-decimal list-inside space-y-3">
                                    {currentQ?.requirements.map((req, i) => (
                                        <li key={i} className="text-sm text-slate-700">{req}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Right: Response */}
                    <div className="w-1/2 flex flex-col">
                        <div className="bg-[#4d4d4d] text-white px-4 py-2 text-xs font-bold flex justify-between items-center">
                            <span>Response Editor</span>
                            <span>Words: {currentAns?.wordCount || 0}</span>
                        </div>
                        <textarea 
                            ref={essayInputRef}
                            className="flex-1 border-0 p-6 font-mono text-sm leading-relaxed outline-none resize-none"
                            placeholder="Type your response here..."
                            value={currentAns?.text || ''}
                            onChange={(e) => handleEssayChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#4d4d4d] px-6 py-4 flex justify-between items-center border-t border-[#666] shrink-0">
                    <div></div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setEssayIndex(Math.max(0, essayIndex - 1))}
                            disabled={essayIndex === 0}
                            className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-6 py-2 font-bold flex items-center gap-1 text-sm"
                        >
                            <Icons.ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        
                        <button 
                            onClick={() => {
                                if (essayIndex < essayQuestions.length - 1) {
                                    setEssayIndex(essayIndex + 1);
                                }
                            }}
                            className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 font-bold flex items-center gap-1 text-sm"
                        >
                            Next <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 7. FINAL RESULTS
    if (phase === 'FINAL_RESULTS') {
        const overallScore = mcqResults?.percentage || 0;
        const passed = overallScore >= 72;
        
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-6">
                <div className="bg-white shadow-2xl max-w-2xl w-full border border-slate-300">
                    <div className="bg-[#4d4d4d] text-white px-6 py-4 font-bold text-lg flex justify-between">
                        <span>Examination Complete</span>
                        <span className="text-[#8dc63f] uppercase tracking-widest text-sm">Prometric</span>
                    </div>
                    
                    <div className="p-10 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'border-[#8dc63f] text-[#8dc63f]' : 'border-red-500 text-red-500'}`}>
                            {passed ? <Icons.CheckBadge className="w-12 h-12" /> : <Icons.AlertCircle className="w-12 h-12" />}
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                            {passed ? 'Pass' : 'Did Not Pass'}
                        </h2>
                        <p className="text-slate-500 mb-8 font-medium text-center">
                            {essayQuestions.length > 0 && mcqResults?.essayUnlocked 
                                ? 'MCQs scored. Essay responses saved for review.'
                                : 'Examination complete.'}
                        </p>

                        {/* MCQ Results */}
                        <div className="w-full bg-slate-50 border border-slate-200 p-8 mb-6">
                            <h3 className="font-bold text-slate-700 mb-4 uppercase text-sm">MCQ Section</h3>
                            <div className="grid grid-cols-3 gap-8 text-center">
                                <div>
                                    <div className="text-4xl font-black text-slate-800 mb-1">{mcqResults?.percentage || 0}%</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Score</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-[#8dc63f] mb-1">{mcqResults?.correct || 0}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Correct</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-red-500 mb-1">{(mcqResults?.total || 0) - (mcqResults?.correct || 0)}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Incorrect</div>
                                </div>
                            </div>
                        </div>

                        {/* Essay Status */}
                        {essayQuestions.length > 0 && (
                            <div className="w-full bg-purple-50 border border-purple-200 p-6 mb-8 rounded-xl">
                                <h3 className="font-bold text-purple-700 mb-2 uppercase text-sm flex items-center gap-2">
                                    <Icons.FileText className="w-4 h-4" />
                                    Essay Section
                                </h3>
                                {mcqResults?.essayUnlocked ? (
                                    <p className="text-purple-600 text-sm">
                                        {essayQuestions.length} essay responses submitted. Results pending manual review.
                                    </p>
                                ) : (
                                    <p className="text-purple-600 text-sm">
                                        Essay section was locked (required {(config.mcqPassThreshold || 0.5) * 100}% on MCQs).
                                    </p>
                                )}
                            </div>
                        )}

                        <button onClick={() => { clearSavedState(); onExit(); }} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-12 py-3 font-bold shadow-lg uppercase tracking-widest text-sm">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
