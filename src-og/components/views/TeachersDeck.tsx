
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import { getTeacherResponse, generateTeachingResource } from '../../services/geminiService';

type TeacherTool = 'CHAT' | 'LESSON_PLAN' | 'MCQ' | 'CASE_STUDY' | 'RUBRIC';

interface Message {
    role: string;
    content: string;
}

export const TeachersDeck: React.FC = () => {
    const [activeTool, setActiveTool] = useState<TeacherTool>('CHAT');
    const [subject, setSubject] = useState('CMA Part 1');

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Welcome, Professor. How can I assist you with your academic strategy today? I can help architect lessons, craft MCQ banks, or break down pedagogical concepts using the Knowledge Vault. 🎓" }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Resource Generation States
    const [generationInput, setGenerationInput] = useState('');
    const [generatedResult, setGeneratedResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatLoading]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsChatLoading(true);

        try {
            const responseText = await getTeacherResponse(messages, userMsg, subject, 'Mastery Chat');
            setMessages(prev => [...prev, { role: 'model', content: responseText || "Blackout in faculty lounge. Please retry." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "Communication error with Teacher Mastermind." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!generationInput.trim()) return;
        setIsGenerating(true);
        const result = await generateTeachingResource(subject, activeTool as any, generationInput);
        setGeneratedResult(result);
        setIsGenerating(false);
    };

    return (
        <div className="flex h-full flex-col md:flex-row bg-slate-900 text-slate-100">
            {/* Sidebar */}
            <div className="w-full md:w-80 border-r border-white/5 p-8 flex flex-col gap-4 bg-slate-950">
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Icons.Sparkles className="text-emerald-500 w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-xl text-white tracking-tight">Teacher Mastermind</h2>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Academic Strategist Deck</div>
                    </div>
                </div>

                <button
                    onClick={() => setActiveTool('CHAT')}
                    className={`flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all ${activeTool === 'CHAT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <Icons.Users className="w-5 h-5" /> Mastery Chat
                </button>
                <button
                    onClick={() => setActiveTool('LESSON_PLAN')}
                    className={`flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all ${activeTool === 'LESSON_PLAN' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <Icons.Grid className="w-5 h-5" /> Lesson Architect
                </button>
                <button
                    onClick={() => setActiveTool('MCQ')}
                    className={`flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all ${activeTool === 'MCQ' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <Icons.BookOpen className="w-5 h-5" /> Resource Crafter
                </button>
                <button
                    onClick={() => setActiveTool('RUBRIC')}
                    className={`flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all ${activeTool === 'RUBRIC' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <Icons.Award className="w-5 h-5" /> Evaluation Engine
                </button>

                <div className="mt-auto p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">
                    Neural Teaching Pipeline Active
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                {activeTool === 'CHAT' ? (
                    <div className="flex-1 flex flex-col bg-slate-800/50 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl relative">
                        {/* Chat Header */}
                        <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
                            <span className="font-black text-white text-sm tracking-tight uppercase">Mastery Chat (Peer-Level)</span>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-slate-700 border border-white/10 text-white font-bold text-xs rounded-xl px-4 py-2 outline-none"
                            >
                                <option>CMA Part 1</option>
                                <option>CMA Part 2</option>
                                <option>Pedagogical Strategy</option>
                            </select>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed ${m.role === 'user'
                                        ? 'bg-emerald-700 text-white shadow-lg'
                                        : 'bg-slate-700/50 text-slate-200 border border-white/5 font-medium'
                                        }`}>
                                        <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">{m.content}</div>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex items-center gap-3 text-emerald-500 text-xs font-bold animate-pulse px-4">
                                    <Icons.Sparkles className="w-4 h-4 animate-spin" />
                                    <span>Architecting response for faculty...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-8 bg-slate-900/50 border-t border-white/5">
                            <div className="relative max-w-4xl mx-auto">
                                <input
                                    ref={inputRef}
                                    className="w-full bg-slate-700 border border-white/10 rounded-2xl px-8 py-5 pr-20 text-sm text-white font-medium outline-none shadow-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                    placeholder="Consult your AI Strategy Colleague..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="absolute right-3 top-3 bottom-3 px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                                >
                                    <Icons.Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                        <div className="bg-slate-800/50 rounded-[3rem] border border-white/5 p-10 shadow-2xl animate-in fade-in">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                {activeTool === 'LESSON_PLAN' ? 'Lesson Architect' : activeTool === 'MCQ' ? 'Resource Crafter' : 'Evaluation Engine'}
                            </h3>
                            <p className="text-slate-400 text-sm mb-8 font-medium italic">
                                {activeTool === 'LESSON_PLAN' ? 'Design timing-based lesson plans and discussion points.' : activeTool === 'MCQ' ? 'Generate MCQs and case studies with teacher-only distractor logic.' : 'Develop grading rubrics and assessment standards.'}
                            </p>

                            <textarea
                                value={generationInput}
                                onChange={(e) => setGenerationInput(e.target.value)}
                                className="w-full h-40 bg-slate-700 border border-white/10 rounded-[2rem] p-8 text-sm text-white font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-slate-700 transition-all resize-none mb-6"
                                placeholder={`Enter the topic or context for your ${activeTool.toLowerCase().replace('_', ' ')}...`}
                            />

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !generationInput.trim()}
                                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isGenerating ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Synthesizing...</> : <><Icons.Sparkles className="w-5 h-5" /> Generate Materials</>}
                            </button>
                        </div>

                        {generatedResult && (
                            <div className="flex-1 bg-slate-800/50 rounded-[3rem] border border-white/5 p-10 shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8">
                                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Generated Teaching Material</span>
                                    <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Copy to Slides</button>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed text-sm">{generatedResult}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
