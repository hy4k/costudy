
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import { getChatResponse, generateStudyContent, evaluateEssay } from '../../services/geminiService';

type Tool = 'CHAT' | 'NOTES' | 'FLASHCARDS' | 'TOPIC' | 'ESSAY';
type ChatMode = 'STANDARD' | 'FOLLOW_UP' | 'VAULT_REF';

interface Message {
    role: string;
    content: string;
    isContextual?: boolean;
    source?: string;
}

export const AIDeck: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('CHAT');

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Greetings, future CMA! I am the CMA-US Mastermind. I'm here to analyze your progress, drill core concepts, and guide you to exam mastery. Ready to tackle Part 1 or Part 2? 🚀" }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [subject, setSubject] = useState('CMA Part 1');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>('STANDARD');
    const [activeContext, setActiveContext] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Notes State
    const [noteInput, setNoteInput] = useState('');
    const [generatedNotes, setGeneratedNotes] = useState('');
    const [isNotesLoading, setIsNotesLoading] = useState(false);

    // Flashcards State
    const [cardTopic, setCardTopic] = useState('');
    const [generatedCards, setGeneratedCards] = useState('');
    const [isCardsLoading, setIsCardsLoading] = useState(false);

    // Topic Blueprint State
    const [topicInput, setTopicInput] = useState('');
    const [generatedTopic, setGeneratedTopic] = useState('');
    const [isTopicLoading, setIsTopicLoading] = useState(false);

    // Essay Evaluation State
    const [essayInput, setEssayInput] = useState('');
    const [essayEvaluation, setEssayEvaluation] = useState('');
    const [isEssayLoading, setIsEssayLoading] = useState(false);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatLoading]);

    // Auto-focus input when tool changes to CHAT
    useEffect(() => {
        if (activeTool === 'CHAT') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [activeTool]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsChatLoading(true);

        const vaultContext = chatMode === 'VAULT_REF' ? "You are querying the specialized CMA Knowledge Vault. Prioritize IMA standards, formulas, and Part 1/2 official guidelines." : "";

        try {
            const responseText = await getChatResponse(
                messages,
                userMsg,
                subject,
                `${chatMode === 'FOLLOW_UP' ? `STUDY CONTEXT: ${activeContext || ''}` : ''}\n${vaultContext}`
            );

            setMessages(prev => [...prev, {
                role: 'model',
                content: responseText || "Error connecting.",
                isContextual: chatMode !== 'STANDARD',
                source: chatMode === 'VAULT_REF' ? 'CMA Resource Library' : (chatMode === 'FOLLOW_UP' ? 'Active Notes Context' : undefined)
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "Connection interrupted. Please retry." }]);
        } finally {
            setIsChatLoading(false);
            // Refocus input after response
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleGenerateNotes = async () => {
        if (!noteInput.trim()) return;
        setIsNotesLoading(true);
        const result = await generateStudyContent(
            `Convert the following material into professional, structured CMA US strategic study notes with clear headers, bullet points, and key formula highlights where applicable:\n\n${noteInput}`,
            "You are a world-class CMA US academic coach specializing in strategic and clear note-taking based on official IMA standards."
        );
        setGeneratedNotes(result);
        setIsNotesLoading(false);
    };

    const handleGenerateCards = async () => {
        if (!cardTopic.trim()) return;
        setIsCardsLoading(true);
        const result = await generateStudyContent(
            `Generate 5 high-impact CMA US flashcards (Question and Answer format) for the following topic/material. Focus on exam-heavy concepts and key definitions:\n\n${cardTopic}`,
            "You are a specialized CMA exam designer creating flashcards for strategic mastery."
        );
        setGeneratedCards(result);
        setIsCardsLoading(false);
    };

    const handleGenerateTopic = async () => {
        if (!topicInput.trim()) return;
        setIsTopicLoading(true);
        const result = await generateStudyContent(
            `Create a comprehensive, deep-dive CMA US study guide for the topic: "${topicInput}".
            
            Structure Required:
            1. Concept Definition (Official IMA Definition if applicable)
            2. Strategic Relevance (Why it matters for Part 1/2)
            3. Key Formulas / Components (with breakdown)
            4. Example Scenario (Practical Application)
            5. Exam Tips (Common pitfalls & Weightage)`,
            "You are a CMA Exam Curriculum Expert."
        );
        setGeneratedTopic(result);
        setIsTopicLoading(false);
    };

    const handleChatAboutContext = (content: string, source: string) => {
        setActiveContext(content);
        setChatMode('FOLLOW_UP');
        setActiveTool('CHAT');
        setMessages([{
            role: 'model',
            content: `I've analyzed the ${source}. What specific concept or exam-related strategy from this material should we break down further? 🧠`,
            isContextual: true,
            source: source
        }]);
    };

    const handleEvaluateEssay = async () => {
        if (!essayInput.trim()) return;
        setIsEssayLoading(true);
        const result = await evaluateEssay(essayInput, subject);
        setEssayEvaluation(result);
        setIsEssayLoading(false);
    };

    const clearContext = () => {
        setActiveContext(null);
        if (chatMode === 'FOLLOW_UP') setChatMode('STANDARD');
    };

    const toolBtn = (tool: Tool, icon: React.ReactNode, title: string, hint: string) => (
        <button
            type="button"
            onClick={() => setActiveTool(tool)}
            className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                activeTool === tool
                    ? 'border-brand/30 bg-white shadow-md ring-1 ring-slate-200/80'
                    : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white/80'
            }`}
        >
            <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    activeTool === tool ? 'bg-brand/12 text-brand' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80'
                }`}
            >
                {icon}
            </span>
            <span className="min-w-0">
                <span className={`block text-sm font-semibold ${activeTool === tool ? 'text-slate-900' : 'text-slate-600'}`}>{title}</span>
                <span className="mt-0.5 block text-xs font-medium leading-snug text-slate-500">{hint}</span>
            </span>
        </button>
    );

    return (
        <div className="flex h-full min-h-0 flex-col bg-gradient-to-br from-slate-50 via-white to-brand/[0.04] md:flex-row">
            {/* Sidebar for Tools */}
            <div className="flex w-full flex-col gap-2 border-b border-slate-200/80 bg-white/70 p-6 backdrop-blur-md md:w-80 md:border-b-0 md:border-r md:p-8">
                <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
                        <Icons.Sparkles className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">AI workspace</p>
                        <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">CMA Mastermind</h2>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">IMA-aligned tools for chat, notes, and drills.</p>
                    </div>
                </div>

                {toolBtn('CHAT', <Icons.MessageCircle className="h-[18px] w-[18px]" />, 'Chat', 'Ask anything across Part 1 & 2')}
                {toolBtn('TOPIC', <Icons.Grid className="h-[18px] w-[18px]" />, 'Topic blueprint', 'Structured deep-dives by topic')}
                {toolBtn('NOTES', <Icons.BookOpen className="h-[18px] w-[18px]" />, 'Notes refiner', 'Turn rough material into clean notes')}
                {toolBtn('FLASHCARDS', <Icons.ClipboardList className="h-[18px] w-[18px]" />, 'Formula cards', 'Quick recall for exam-heavy ideas')}
                {toolBtn('ESSAY', <Icons.Pencil className="h-[18px] w-[18px]" />, 'Essay auditor', 'Practice responses with feedback')}

                <div className="mt-auto space-y-3 pt-6">
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setChatMode('VAULT_REF');
                            }
                        }}
                        onClick={() => setChatMode('VAULT_REF')}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                            chatMode === 'VAULT_REF' ? 'border-brand/35 bg-brand/[0.07] shadow-sm' : 'border-slate-200 bg-slate-50/80 hover:border-brand/25'
                        }`}
                    >
                        <p className="text-xs font-semibold text-brand">Resource library</p>
                        <div className="mt-2 flex items-center gap-2 text-slate-700">
                            <Icons.BookOpen className="h-4 w-4 shrink-0 text-brand" />
                            <span className="text-xs font-medium leading-snug">IMA-linked reference mode for chat</span>
                        </div>
                    </div>
                    {activeContext && (
                        <div className="animate-in slide-in-from-bottom-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg duration-500 group">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-semibold text-brand">Active context</p>
                                <div className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                            </div>
                            <div className="mb-3 line-clamp-3 text-xs font-medium italic leading-relaxed text-slate-600">"{activeContext}"</div>
                            <button
                                type="button"
                                onClick={clearContext}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-brand/30 hover:bg-brand/[0.06] hover:text-slate-900"
                            >
                                Reset context
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tool View */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                {activeTool === 'CHAT' && (
                    <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative">
                        {/* Chat Header */}
                        <div className="z-20 flex flex-col gap-4 border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                                <span className="shrink-0 text-sm font-semibold text-slate-900">CMA US tutor</span>
                                <div className="flex gap-1 rounded-full border border-slate-200/90 bg-slate-50/90 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setChatMode('STANDARD')}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${chatMode === 'STANDARD' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Global
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChatMode('VAULT_REF')}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${chatMode === 'VAULT_REF' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Library
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChatMode('FOLLOW_UP')}
                                        disabled={!activeContext}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${chatMode === 'FOLLOW_UP' ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200/80' : activeContext ? 'text-slate-500 hover:text-slate-900' : 'cursor-not-allowed text-slate-300'}`}
                                    >
                                        Follow-up
                                    </button>
                                </div>
                            </div>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand outline-none"
                            >
                                <option>CMA Part 1</option>
                                <option>CMA Part 2</option>
                                <option>Ethics & Standards</option>
                                <option>Cost Management</option>
                            </select>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth no-scrollbar">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed ${m.role === 'user'
                                        ? 'bg-brand text-white shadow-lg shadow-brand/10'
                                        : 'bg-slate-50 text-slate-800 border border-slate-100 font-medium'
                                        }`}>
                                        {m.isContextual && m.role === 'model' && (
                                            <div className="text-[10px] font-black text-brand uppercase tracking-widest mb-3 border-b border-brand/10 pb-2 flex items-center gap-2">
                                                <Icons.Award className="w-3 h-3" />
                                                {m.source || 'Strategic Reference Active'}
                                            </div>
                                        )}
                                        <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap">{m.content}</div>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold animate-pulse px-4">
                                    <Icons.Sparkles className="w-4 h-4 animate-spin text-brand" />
                                    <span>Mastermind is calculating strategic response...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                            {/* Integrated Active Context Banner */}
                            {activeContext && chatMode === 'FOLLOW_UP' && (
                                <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-brand/[0.04] border border-brand/10 rounded-[1.5rem] px-6 py-4 animate-in slide-in-from-bottom-4 duration-500 shadow-sm ring-1 ring-brand/5">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="p-2.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 shrink-0">
                                            <Icons.Brain className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[9px] font-black text-brand uppercase tracking-[0.2em] mb-0.5">Focusing Discussion On</span>
                                            <span className="text-[11px] text-slate-600 font-bold truncate italic leading-none">"{activeContext}"</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearContext}
                                        className="ml-4 px-4 py-2 bg-white/50 hover:bg-brand hover:text-white border border-brand/10 text-brand rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                                        title="Clear Focus"
                                    >
                                        <Icons.Plus className="w-3.5 h-3.5 rotate-45" />
                                        Clear Focus
                                    </button>
                                </div>
                            )}

                            <div className="relative max-w-4xl mx-auto">
                                <input
                                    ref={inputRef}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-8 py-5 pr-20 text-sm text-slate-900 font-medium outline-none shadow-sm focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all"
                                    placeholder={chatMode === 'VAULT_REF' ? "Ask about Part 1 or Part 2 specific content..." : "Ask your CMA US Mentor anything..."}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isChatLoading || !chatInput.trim()}
                                    className="absolute right-3 top-3 bottom-3 px-6 bg-brand text-white rounded-xl hover:bg-brand-600 transition-all disabled:opacity-30 shadow-lg shadow-brand/20 flex items-center justify-center active:scale-95"
                                >
                                    <Icons.Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'TOPIC' && (
                    <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Topic Blueprint Generator</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Enter any CMA topic (e.g. "Variance Analysis" or "Internal Controls") to generate a complete study guide.</p>

                            <input
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-medium outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all mb-6"
                                placeholder="Enter Topic Name..."
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateTopic()}
                            />

                            <button
                                onClick={handleGenerateTopic}
                                disabled={isTopicLoading || !topicInput.trim()}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isTopicLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Drafting Blueprint...</> : <><Icons.Grid className="w-5 h-5" /> Generate Guide</>}
                            </button>
                        </div>

                        {generatedTopic && (
                            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Strategic Blueprint</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(generatedTopic, 'Generated Blueprint')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Deep Dive
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Save to Vault</button>
                                    </div>
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">{generatedTopic}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTool === 'NOTES' && (
                    <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Strategic Notes Refiner</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Paste raw material, rough notes, or transcripts. We'll restructure them into professional study guides.</p>

                            <textarea
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-sm font-medium outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all resize-none mb-6"
                                placeholder="Example: Paste a paragraph about Joint Costing methods here..."
                            />

                            <button
                                onClick={handleGenerateNotes}
                                disabled={isNotesLoading || !noteInput.trim()}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isNotesLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Synthesizing Strategy...</> : <><Icons.Brain className="w-5 h-5" /> Refine Notes</>}
                            </button>
                        </div>

                        {generatedNotes && (
                            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Draft Strategy Guide</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(generatedNotes, 'Generated Study Guide')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Analyze with Mentor
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Export PDF</button>
                                    </div>
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">{generatedNotes}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTool === 'FLASHCARDS' && (
                    <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Formula Card Creator</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Generate high-impact flashcards for CMA definitions, formulas, and standards.</p>

                            <textarea
                                value={cardTopic}
                                onChange={(e) => setCardTopic(e.target.value)}
                                className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-sm font-medium outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all resize-none mb-6"
                                placeholder="Example: CMA Part 2 - Risk Management & Financial Strategy..."
                            />

                            <button
                                onClick={handleGenerateCards}
                                disabled={isCardsLoading || !cardTopic.trim()}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isCardsLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Coding Cards...</> : <><Icons.Plus className="w-5 h-5" /> Generate Deck</>}
                            </button>
                        </div>

                        {generatedCards && (
                            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Strategic Flashcards</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(generatedCards, 'Flashcard Deck')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Practice Mode
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Save to Vault</button>
                                    </div>
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">{generatedCards}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTool === 'ESSAY' && (
                    <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Essay Sandbox & Auditor</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Paste your essay here. The Mastermind will audit it against official IMA rubrics from the Knowledge Vault.</p>

                            <textarea
                                value={essayInput}
                                onChange={(e) => setEssayInput(e.target.value)}
                                className="w-full h-64 bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-sm font-medium outline-none focus:ring-4 focus:ring-brand/5 focus:bg-white transition-all resize-none mb-6"
                                placeholder="Write or paste your essay response here..."
                            />

                            <button
                                onClick={handleEvaluateEssay}
                                disabled={isEssayLoading || !essayInput.trim()}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {isEssayLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Performing Audit...</> : <><Icons.Award className="w-5 h-5" /> Audit Essay</>}
                            </button>
                        </div>

                        {essayEvaluation && (
                            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Official Audit Report</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(essayEvaluation, 'Essay Audit Report')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Discuss Gaps
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Download Audit</button>
                                    </div>
                                </div>
                                <div className="prose prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">{essayEvaluation}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
