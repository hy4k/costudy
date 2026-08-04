import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { supabase } from '../../services/supabaseClient';
import { fetchEssayQuestions } from '../../services/fetsService';

export interface EssayQuestionData {
    id: string;
    question_text: string;
    rubric_guidelines?: string;
    section?: string;
    part?: string;
    difficulty_level?: string;
}

interface EssayInterfaceProps {
    question?: EssayQuestionData;
    essayText?: string;
    onChange?: (text: string) => void;
    onNext?: () => void;
    onPrev?: () => void;
    currentIndex?: number;
    totalQuestions?: number;
    showNavigation?: boolean;
}

export const EssayInterface: React.FC<EssayInterfaceProps> = ({
    question: initialQuestion,
    essayText: controlledEssayText,
    onChange,
    onNext,
    onPrev,
    currentIndex = 1,
    totalQuestions = 2,
    showNavigation = false
}) => {
    const [fetchedQuestions, setFetchedQuestions] = useState<EssayQuestionData[]>([]);
    const [loading, setLoading] = useState<boolean>(!initialQuestion);
    const [error, setError] = useState<string | null>(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
    const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
    const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

    // Load from Supabase essay_questions if no question prop supplied
    useEffect(() => {
        if (!initialQuestion) {
            const loadEssayQuestions = async () => {
                setLoading(true);
                setError(null);
                try {
                    const { data, error: dbError } = await supabase
                        .from('essay_questions')
                        .select('*');

                    if (!dbError && data && data.length > 0) {
                        setFetchedQuestions(data);
                    } else {
                        // Fallback to service if DB is empty or fails
                        const fallback = await fetchEssayQuestions(2);
                        setFetchedQuestions(fallback);
                    }
                } catch (err: any) {
                    console.error("Error fetching essay_questions in EssayInterface:", err);
                    const fallback = await fetchEssayQuestions(2);
                    setFetchedQuestions(fallback);
                } finally {
                    setLoading(false);
                }
            };

            loadEssayQuestions();
        }
    }, [initialQuestion]);

    const activeQuestion: EssayQuestionData | undefined = initialQuestion || fetchedQuestions[activeQuestionIndex];
    const currentText = controlledEssayText !== undefined 
        ? controlledEssayText 
        : (activeQuestion ? (localAnswers[activeQuestion.id] || '') : '');

    const handleTextChange = (val: string) => {
        if (onChange) {
            onChange(val);
        } else if (activeQuestion) {
            setLocalAnswers(prev => ({ ...prev, [activeQuestion.id]: val }));
        }
    };

    const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
    const charCount = currentText.length;

    // Prometric editor toolbar actions
    const handleCut = async () => {
        try {
            await navigator.clipboard.writeText(currentText);
            handleTextChange('');
        } catch (e) {
            console.error("Cut error", e);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentText);
        } catch (e) {
            console.error("Copy error", e);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            handleTextChange(currentText + text);
        } catch (e) {
            console.error("Paste error", e);
        }
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear your current response?")) {
            handleTextChange('');
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-[#f4f4f6] border border-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Icons.CloudSync className="w-8 h-8 text-slate-600 animate-spin mb-4" />
                <p className="font-mono text-sm text-slate-700 font-bold uppercase tracking-wider">Fetching Essay Questions from Supabase backend...</p>
            </div>
        );
    }

    if (!activeQuestion) {
        return (
            <div className="w-full bg-amber-50 border border-amber-300 p-8 text-center text-amber-800">
                <p className="font-bold mb-2">No Essay Questions Found</p>
                <p className="text-sm">Please check the `essay_questions` table in Supabase.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#e6e6e6] border-2 border-[#888888] shadow-md flex flex-col font-sans select-none">
            {/* Prometric Exemplar Top Header */}
            <div className="bg-[#333333] text-white px-4 py-2 flex flex-wrap justify-between items-center border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <span className="bg-amber-400 text-black px-2 py-0.5 text-xs font-black rounded-xs uppercase tracking-wider">
                        Prometric Essay Exemplar
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                        {activeQuestion.section || 'Section 2: Essay Section'} | {activeQuestion.part || 'Part 1'}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5 bg-[#222222] px-2.5 py-1 rounded border border-[#555]">
                        <span className="text-slate-400">Difficulty:</span>
                        <span className="text-amber-300 font-bold">{activeQuestion.difficulty_level || 'Medium'}</span>
                    </div>
                    
                    {!initialQuestion && fetchedQuestions.length > 1 && (
                        <div className="flex items-center gap-1 bg-[#222222] px-2 py-1 rounded border border-[#555]">
                            <button
                                onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeQuestionIndex === 0}
                                className="px-1 text-amber-400 disabled:opacity-30 hover:text-white"
                            >
                                ◄
                            </button>
                            <span className="text-slate-300 px-1 font-bold">
                                Essay {activeQuestionIndex + 1} of {fetchedQuestions.length}
                            </span>
                            <button
                                onClick={() => setActiveQuestionIndex(prev => Math.min(fetchedQuestions.length - 1, prev + 1))}
                                disabled={activeQuestionIndex === fetchedQuestions.length - 1}
                                className="px-1 text-amber-400 disabled:opacity-30 hover:text-white"
                            >
                                ►
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 bg-[#d6d6d6]">
                {/* Left Pane: Scenario & Question Prompt */}
                <div className="bg-white border-2 border-[#999999] flex flex-col h-[520px] overflow-hidden shadow-xs">
                    <div className="bg-[#4d4d4d] text-white px-4 py-2 font-bold text-xs flex justify-between items-center border-b border-black shrink-0">
                        <span className="uppercase tracking-wider flex items-center gap-1.5">
                            <Icons.BookOpen className="w-3.5 h-3.5 text-amber-300" /> Case Scenario & Instructions
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">Exam Document Viewer</span>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 text-slate-900 leading-relaxed font-serif text-sm">
                        <div className="mb-4 pb-3 border-b border-slate-200">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-sans">
                                {activeQuestion.section || 'ICMA CMA Strategic Scenario'}
                            </span>
                        </div>

                        <div className="whitespace-pre-wrap font-serif text-[#111] text-[15px] leading-7">
                            {activeQuestion.question_text}
                        </div>

                        {activeQuestion.rubric_guidelines && (
                            <div className="mt-6 pt-4 border-t-2 border-dashed border-amber-200 bg-amber-50/60 p-4 rounded text-xs text-amber-900 font-sans">
                                <span className="font-bold uppercase tracking-wider text-amber-800 block mb-1">
                                    💡 Key Evaluation Focus Areas (Rubric):
                                </span>
                                {activeQuestion.rubric_guidelines}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Pane: Prometric Response Text Area */}
                <div className="bg-white border-2 border-[#999999] flex flex-col h-[520px] overflow-hidden shadow-xs">
                    {/* Prometric Toolbar */}
                    <div className="bg-[#4d4d4d] text-white px-3 py-1.5 flex justify-between items-center border-b border-black shrink-0 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300 mr-2 uppercase tracking-wide">Response Box</span>
                            
                            <button 
                                onClick={handleCut}
                                className="px-2 py-0.5 bg-[#333] hover:bg-[#555] border border-[#666] text-white text-[11px] rounded"
                                title="Cut text"
                            >
                                Cut
                            </button>
                            <button 
                                onClick={handleCopy}
                                className="px-2 py-0.5 bg-[#333] hover:bg-[#555] border border-[#666] text-white text-[11px] rounded"
                                title="Copy text"
                            >
                                Copy
                            </button>
                            <button 
                                onClick={handlePaste}
                                className="px-2 py-0.5 bg-[#333] hover:bg-[#555] border border-[#666] text-white text-[11px] rounded"
                                title="Paste text"
                            >
                                Paste
                            </button>
                            <button 
                                onClick={handleClear}
                                className="px-2 py-0.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-white text-[11px] rounded"
                                title="Clear Response"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-400">Font:</span>
                                <button 
                                    onClick={() => setFontSize('sm')} 
                                    className={`px-1 rounded ${fontSize === 'sm' ? 'bg-amber-400 text-black font-bold' : 'text-slate-300'}`}
                                >
                                    S
                                </button>
                                <button 
                                    onClick={() => setFontSize('md')} 
                                    className={`px-1 rounded ${fontSize === 'md' ? 'bg-amber-400 text-black font-bold' : 'text-slate-300'}`}
                                >
                                    M
                                </button>
                                <button 
                                    onClick={() => setFontSize('lg')} 
                                    className={`px-1 rounded ${fontSize === 'lg' ? 'bg-amber-400 text-black font-bold' : 'text-slate-300'}`}
                                >
                                    L
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 relative flex flex-col bg-[#fffefc]">
                        <textarea
                            value={currentText}
                            onChange={(e) => handleTextChange(e.target.value)}
                            placeholder="Type your structured essay response here. Use numerical headings and clear paragraph breaks matching the requirement numbers..."
                            spellCheck={false}
                            className={`flex-1 w-full p-5 font-mono outline-none resize-none bg-transparent text-slate-900 leading-relaxed ${
                                fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
                            }`}
                        />
                    </div>

                    {/* Prometric Bottom Status Bar */}
                    <div className="bg-[#2a2a2a] text-slate-300 px-4 py-1.5 flex justify-between items-center text-xs font-mono border-t border-black shrink-0">
                        <div className="flex items-center gap-4">
                            <span>Words: <strong className="text-white">{wordCount}</strong></span>
                            <span className="text-slate-600">|</span>
                            <span>Chars: <strong className="text-white">{charCount}</strong></span>
                        </div>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Auto-Sync Active
                        </div>
                    </div>
                </div>
            </div>

            {/* Optional Prometric Footer Navigation Bar */}
            {showNavigation && (
                <div className="bg-[#333333] text-white p-3 flex justify-between items-center border-t-2 border-black">
                    <button
                        onClick={onPrev}
                        disabled={currentIndex <= 1}
                        className="px-4 py-1.5 bg-[#555] hover:bg-[#666] border border-[#777] font-bold text-xs rounded disabled:opacity-30 disabled:pointer-events-none"
                    >
                        ◄ Previous Question
                    </button>

                    <span className="text-xs font-mono text-slate-300">
                        Question {currentIndex} of {totalQuestions}
                    </span>

                    <button
                        onClick={onNext}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded border border-amber-300 shadow-xs"
                    >
                        Next Question ►
                    </button>
                </div>
            )}
        </div>
    );
};

export default EssayInterface;
