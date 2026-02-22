
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

    return (
        <div className="flex h-full flex-col md:flex-row bg-slate-50">
            {/* Sidebar for Tools */}
            <div className="w-full md:w-80 border-r border-slate-200 p-8 flex flex-col gap-4 bg-white/50">
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-2 bg-brand/10 rounded-xl">
                        <Icons.Sparkles className="text-brand w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-xl text-slate-900 tracking-tight">CMA Mastermind</h2>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Super-Tutor Intel Layer</div>
                    </div>
                </div>

                <button
                    onClick={() => setActiveTool('CHAT')}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left font-bold text-sm transition-all ${activeTool === 'CHAT' ? 'bg-white shadow-lg text-brand ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Icons.MessageCircle className="w-5 h-5 px-4 py-2 transition-all" /> Mastermind Chat
                </button>
                <button
                    onClick={() => setActiveTool('TOPIC')}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left font-bold text-sm transition-all ${activeTool === 'TOPIC' ? 'bg-white shadow-lg text-brand ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Icons.Grid className="w-5 h-5 px-4 py-2 transition-all" /> Topic Blueprint
                </button>
                <button
                    onClick={() => setActiveTool('NOTES')}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left font-bold text-sm transition-all ${activeTool === 'NOTES' ? 'bg-white shadow-lg text-brand ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Icons.BookOpen className="w-5 h-5 px-4 py-2 transition-all" /> Notes Refiner
                </button>
                <button
                    onClick={() => setActiveTool('FLASHCARDS')}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left font-bold text-sm transition-all ${activeTool === 'FLASHCARDS' ? 'bg-white shadow-lg text-brand ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Icons.ClipboardList className="w-5 h-5 px-4 py-2 transition-all" /> Formula Cards
                </button>
                <button
                    onClick={() => setActiveTool('ESSAY')}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left font-bold text-sm transition-all ${activeTool === 'ESSAY' ? 'bg-white shadow-lg text-brand ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Icons.Pencil className="w-5 h-5 px-4 py-2 transition-all" /> Essay Auditor
                </button>

                <div className="mt-auto space-y-4">
                    <div
                        onClick={() => setChatMode('VAULT_REF')}
                        className={`p-5 rounded-xl cursor-pointer transition-all border ${chatMode === 'VAULT_REF' ? 'bg-brand/10 border-brand shadow-lg scale-105' : 'bg-slate-100 border-slate-200'}`}
                    >
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-2">Resource Library</p>
                        <div className="flex items-center gap-2">
                            <Icons.BookOpen className={`w-4 h-4 text-brand`} />
                            <span className="text-[10px] font-black text-slate-900 uppercase">IMA Official Content Linked</span>
                        </div>
                    </div>
                    {activeContext && (
                        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xl group animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Study Context</p>
                                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-3 mb-4 font-medium italic leading-relaxed">"{activeContext}"</div>
                            <button
                                onClick={clearContext}
                                className="w-full py-2 bg-slate-50 hover:bg-brand/5 text-[9px] text-slate-400 font-black hover:text-brand transition-all uppercase tracking-widest rounded-lg border border-slate-100 px-4"
                            >Reset Context</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tool View */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                {activeTool === 'CHAT' && (
                    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative">
                        {/* Chat Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-20">
                            <div className="flex items-center gap-6">
                                <span className="font-black text-slate-900 text-sm tracking-tight uppercase">CMA-US Super-Tutor</span>
                                <div className="flex bg-slate-50 rounded-xl p-1 gap-1 border border-slate-200">
                                    <button
                                        onClick={() => setChatMode('STANDARD')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'STANDARD' ? 'bg-white shadow-sm text-brand' : 'text-slate-400 hover:text-slate-900'}`}
                                    >
                                        Global
                                    </button>
                                    <button
                                        onClick={() => setChatMode('VAULT_REF')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'VAULT_REF' ? 'bg-white shadow-sm text-brand' : 'text-slate-400 hover:text-slate-900'}`}
                                    >
                                        Library
                                    </button>
                                    <button
                                        onClick={() => setChatMode('FOLLOW_UP')}
                                        disabled={!activeContext}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'FOLLOW_UP' ? 'bg-white shadow-sm text-brand' : activeContext ? 'text-slate-400 hover:text-slate-900' : 'text-slate-200 cursor-not-allowed'}`}
                                    >
                                        Active
                                    </button>
                                </div>
                            </div>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand outline-none transition-all"
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
                                    <div className={`max-w-[85%] p-6 rounded-xl text-sm leading-relaxed ${m.role === 'user'
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
                                        className="ml-4 px-4 py-2 bg-white/50 hover:bg-brand hover:text-white border border-brand/10 text-brand rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
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
                                    className="w-full bg-white border border-slate-300 rounded-lg-lg px-4 py-3 pr-20 text-sm text-slate-900 font-medium outline-none shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder={chatMode === 'VAULT_REF' ? "Ask about Part 1 or Part 2 specific content..." : "Ask your CMA US Mentor anything..."}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isChatLoading || !chatInput.trim()}
                                    className="absolute right-2 top-2 bottom-2 px-4 py-2 bg-brand text-white rounded-lg-lg hover:bg-brand-600 transition-all disabled:opacity-30 shadow-sm flex items-center justify-center active:scale-95"
                                >
                                    <Icons.Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'TOPIC' && (
                    <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Topic Blueprint Generator</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Enter any CMA topic (e.g. "Variance Analysis" or "Internal Controls") to generate a complete study guide.</p>

                            <input
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg-lg px-4 py-3 text-sm font-medium outline-none transition-all mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter Topic Name..."
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateTopic()}
                            />

                            <button
                                onClick={handleGenerateTopic}
                                disabled={isTopicLoading || !topicInput.trim()}
                                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg-lg text-sm font-black uppercase tracking-[0.1em] shadow-sm hover:bg-brand hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isTopicLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Drafting Blueprint...</> : <><Icons.Grid className="w-5 h-5" /> Generate Guide</>}
                            </button>
                        </div>

                        {generatedTopic && (
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Strategic Blueprint</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(generatedTopic, 'Generated Blueprint')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Deep Dive
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Save to Vault</button>
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
                        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Strategic Notes Refiner</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Paste raw material, rough notes, or transcripts. We'll restructure them into professional study guides.</p>

                            <textarea
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                className="w-full h-40 bg-white border border-slate-300 rounded-lg-lg px-4 py-3 text-sm font-medium outline-none transition-all resize-none mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Example: Paste a paragraph about Joint Costing methods here..."
                            />

                            <button
                                onClick={handleGenerateNotes}
                                disabled={isNotesLoading || !noteInput.trim()}
                                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg-lg text-sm font-black uppercase tracking-[0.1em] shadow-sm hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isNotesLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Synthesizing Strategy...</> : <><Icons.Brain className="w-5 h-5" /> Refine Notes</>}
                            </button>
                        </div>

                        {generatedNotes && (
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Draft Strategy Guide</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(generatedNotes, 'Generated Study Guide')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Analyze with Mentor
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Export PDF</button>
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
                        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Formula Card Creator</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Generate high-impact flashcards for CMA definitions, formulas, and standards.</p>

                            <textarea
                                value={cardTopic}
                                onChange={(e) => setCardTopic(e.target.value)}
                                className="w-full h-40 bg-white border border-slate-300 rounded-lg-lg px-4 py-3 text-sm font-medium outline-none transition-all resize-none mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Example: CMA Part 2 - Risk Management & Financial Strategy..."
                            />

                            <button
                                onClick={handleGenerateCards}
                                disabled={isCardsLoading || !cardTopic.trim()}
                                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg-lg text-sm font-black uppercase tracking-[0.1em] shadow-sm hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isCardsLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Coding Cards...</> : <><Icons.Plus className="w-5 h-5" /> Generate Deck</>}
                            </button>
                        </div>

                        {generatedCards && (
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Strategic Flashcards</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(generatedCards, 'Flashcard Deck')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Practice Mode
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Save to Vault</button>
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
                        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-500">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Essay Sandbox & Auditor</h3>
                            <p className="text-slate-500 text-sm mb-8 font-medium italic">Paste your essay here. The Mastermind will audit it against official IMA rubrics from the Knowledge Vault.</p>

                            <textarea
                                value={essayInput}
                                onChange={(e) => setEssayInput(e.target.value)}
                                className="w-full h-64 bg-white border border-slate-300 rounded-lg-lg px-4 py-3 text-sm font-medium outline-none transition-all resize-none mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Write or paste your essay response here..."
                            />

                            <button
                                onClick={handleEvaluateEssay}
                                disabled={isEssayLoading || !essayInput.trim()}
                                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg-lg text-sm font-black uppercase tracking-[0.1em] shadow-sm hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isEssayLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Performing Audit...</> : <><Icons.Award className="w-5 h-5" /> Audit Essay</>}
                            </button>
                        </div>

                        {essayEvaluation && (
                            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-8 duration-700">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                    <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Official Audit Report</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleChatAboutContext(essayEvaluation, 'Essay Audit Report')}
                                            className="px-6 py-2 bg-brand/5 text-brand rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                        >
                                            Discuss Gaps
                                        </button>
                                        <button className="px-6 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Download Audit</button>
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
