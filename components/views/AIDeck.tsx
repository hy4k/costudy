import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import { getChatResponse, getGroundedResponse, generateStudyImage, getMapsGroundedResponse, generateStudyContent, textToSpeech } from '../../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    isContextual?: boolean;
    source?: string;
}

export const AIDeck: React.FC = () => {
    const [activeTool, setActiveTool] = useState<'CHAT' | 'RESEARCH' | 'VISUALIZER' | 'SPOTS' | 'NOTES' | 'FLASHCARDS'>('CHAT');
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Welcome to the Strategic CMA US Intelligence Deck. I am your specialized AI Assistant trained on IMA guidelines, Part 1 & Part 2 syllabus standards, and cost accounting frameworks. How can we accelerate your mastery today? 🚀" }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatMode, setChatMode] = useState<'STANDARD' | 'VAULT_REF' | 'FOLLOW_UP'>('STANDARD');
    const [subject, setSubject] = useState('CMA Part 1');
    const [activeContext, setActiveContext] = useState<string | null>(null);
    const [useThinking, setUseThinking] = useState(true);

    // Research State
    const [researchInput, setResearchInput] = useState('');
    const [researchResult, setResearchResult] = useState<{ text: string; sources: string[] } | null>(null);
    const [isResearchLoading, setIsResearchLoading] = useState(false);

    // Visualizer State
    const [visualPrompt, setVisualPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isVisualLoading, setIsVisualLoading] = useState(false);

    // Spots State
    const [spotsInput, setSpotsInput] = useState('');
    const [spotsResult, setSpotsResult] = useState<{ text: string; places: any[] } | null>(null);
    const [isSpotsLoading, setIsSpotsLoading] = useState(false);

    // Notes State
    const [noteInput, setNoteInput] = useState('');
    const [generatedNotes, setGeneratedNotes] = useState<string | null>(null);
    const [isNotesLoading, setIsNotesLoading] = useState(false);

    // Flashcards State
    const [cardTopic, setCardTopic] = useState('');
    const [generatedCards, setGeneratedCards] = useState<string | null>(null);
    const [isCardsLoading, setIsCardsLoading] = useState(false);

    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatLoading]);

    // Handlers
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput;
        setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsChatLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const responseText = await getChatResponse(history, userMsg, subject, activeContext || undefined, useThinking);
            setMessages(prev => [...prev, { role: 'model', content: responseText }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "Error communicating with AI Deck. Please verify network status." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleResearch = async () => {
        if (!researchInput.trim() || isResearchLoading) return;
        setIsResearchLoading(true);
        try {
            const res = await getGroundedResponse(researchInput);
            setResearchResult(res);
        } catch (e) {
            console.error("Research error:", e);
        } finally {
            setIsResearchLoading(false);
        }
    };

    const handleVisualize = async () => {
        if (!visualPrompt.trim() || isVisualLoading) return;
        setIsVisualLoading(true);
        try {
            const imgUrl = await generateStudyImage(visualPrompt);
            setGeneratedImage(imgUrl);
        } catch (e) {
            console.error("Visualize error:", e);
        } finally {
            setIsVisualLoading(false);
        }
    };

    const handleFindSpots = async () => {
        if (!spotsInput.trim() || isSpotsLoading) return;
        setIsSpotsLoading(true);
        try {
            const res = await getMapsGroundedResponse(spotsInput);
            setSpotsResult(res);
        } catch (e) {
            console.error("Spots error:", e);
        } finally {
            setIsSpotsLoading(false);
        }
    };

    const handleGenerateNotes = async () => {
        if (!noteInput.trim() || isNotesLoading) return;
        setIsNotesLoading(true);
        try {
            const notes = await generateStudyContent(`Generate a comprehensive study guide for: ${noteInput}`, "You are an expert CMA tutor.");
            setGeneratedNotes(notes);
        } catch (e) {
            console.error("Notes error:", e);
        } finally {
            setIsNotesLoading(false);
        }
    };

    const handleGenerateCards = async () => {
        if (!cardTopic.trim() || isCardsLoading) return;
        setIsCardsLoading(true);
        try {
            const cards = await generateStudyContent(`Create 5 high-impact flashcards with term, definition, and CMA exam tip for: ${cardTopic}`, "You are an expert CMA tutor.");
            setGeneratedCards(cards);
        } catch (e) {
            console.error("Cards error:", e);
        } finally {
            setIsCardsLoading(false);
        }
    };

    const handleListen = async (text: string) => {
        if (isSpeaking) return;
        setIsSpeaking(true);
        const base64Audio = await textToSpeech(text);
        if (base64Audio) {
            const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
            audio.onended = () => setIsSpeaking(false);
            audio.play();
        } else {
            setIsSpeaking(false);
        }
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

    const clearContext = () => {
        setActiveContext(null);
        if (chatMode === 'FOLLOW_UP') setChatMode('STANDARD');
    };

    return (
        <div className="flex h-full flex-col md:flex-row bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100">
            {/* Sidebar for Tools */}
            <div className="w-full md:w-80 border-r border-slate-300 dark:border-slate-800 p-8 flex flex-col gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-y-auto no-scrollbar shrink-0">
                <div className="mb-8 flex items-center gap-3">
                    <div className="p-2.5 bg-brand/10 dark:bg-brand/20 rounded-xl">
                      <Icons.Sparkles className="text-brand w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Strategy Lab</h2>
                        <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">CMA AI Intelligence</div>
                    </div>
                </div>
                
                <div className="space-y-1.5">
                    <button 
                        onClick={() => setActiveTool('CHAT')} 
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all border ${activeTool === 'CHAT' ? 'bg-white dark:bg-slate-800 shadow-md text-brand border-slate-300 dark:border-slate-700' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                        <Icons.MessageCircle className="w-5 h-5" /> CMA Mentor
                    </button>
                    <button 
                        onClick={() => setActiveTool('RESEARCH')} 
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all border ${activeTool === 'RESEARCH' ? 'bg-white dark:bg-slate-800 shadow-md text-brand border-slate-300 dark:border-slate-700' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                        <Icons.Search className="w-5 h-5" /> Web Research
                    </button>
                    <button 
                        onClick={() => setActiveTool('VISUALIZER')} 
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all border ${activeTool === 'VISUALIZER' ? 'bg-white dark:bg-slate-800 shadow-md text-brand border-slate-300 dark:border-slate-700' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                        <Icons.Grid className="w-5 h-5" /> Visualizer
                    </button>
                    <button 
                        onClick={() => setActiveTool('SPOTS')} 
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all border ${activeTool === 'SPOTS' ? 'bg-white dark:bg-slate-800 shadow-md text-brand border-slate-300 dark:border-slate-700' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                        <Icons.Stamp className="w-5 h-5" /> Study Spots
                    </button>
                    <button 
                        onClick={() => setActiveTool('NOTES')} 
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all border ${activeTool === 'NOTES' ? 'bg-white dark:bg-slate-800 shadow-md text-brand border-slate-300 dark:border-slate-700' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                        <Icons.BookOpen className="w-5 h-5" /> Study Guides
                    </button>
                    <button 
                        onClick={() => setActiveTool('FLASHCARDS')} 
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left font-bold text-sm transition-all border ${activeTool === 'FLASHCARDS' ? 'bg-white dark:bg-slate-800 shadow-md text-brand border-slate-300 dark:border-slate-700' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                        <Icons.ClipboardList className="w-5 h-5" /> Formula Cards
                    </button>
                </div>

                <div className="mt-8 space-y-4">
                    <div 
                        onClick={() => setUseThinking(!useThinking)}
                        className={`p-5 rounded-2xl cursor-pointer transition-all border ${useThinking ? 'bg-brand/10 border-brand shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Deep Reasoning</p>
                            <div className={`w-2 h-2 rounded-full ${useThinking ? 'bg-brand animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Icons.Brain className={`w-4 h-4 ${useThinking ? 'text-brand' : 'text-slate-400 dark:text-slate-500'}`} />
                             <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">Gemini 3.1 Thinking</span>
                        </div>
                    </div>
                    
                    {activeContext && (
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xl group animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Study Context</p>
                                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 font-medium italic leading-relaxed">"{activeContext}"</div>
                            <button 
                                onClick={clearContext} 
                                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 text-[9px] text-slate-500 dark:text-slate-400 font-black hover:text-brand transition-all uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700"
                            >Reset Context</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tool View */}
            <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {activeTool === 'CHAT' && (
                        <motion.div 
                            key="chat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-300 dark:border-slate-800 overflow-hidden shadow-xl relative"
                        >
                            {/* Chat Header */}
                            <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20 gap-4">
                                <div className="flex items-center gap-6">
                                    <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight uppercase">CMA Mentor</span>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 border border-slate-300 dark:border-slate-700">
                                        <button 
                                            onClick={() => setChatMode('STANDARD')}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'STANDARD' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            Global
                                        </button>
                                        <button 
                                            onClick={() => setChatMode('VAULT_REF')}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'VAULT_REF' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            Library
                                        </button>
                                        <button 
                                            onClick={() => setChatMode('FOLLOW_UP')}
                                            disabled={!activeContext}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chatMode === 'FOLLOW_UP' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand' : activeContext ? 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                                        >
                                            Active
                                        </button>
                                    </div>
                                </div>
                                <select 
                                    value={subject} 
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option>CMA Part 1</option>
                                    <option>CMA Part 2</option>
                                    <option>Ethics & Standards</option>
                                    <option>Cost Management</option>
                                </select>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth no-scrollbar">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed ${
                                            m.role === 'user' 
                                                ? 'bg-brand text-white shadow-lg' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-medium'
                                        }`}>
                                            {(m.isContextual || useThinking) && m.role === 'model' && (
                                                <div className="text-[10px] font-black text-brand uppercase tracking-widest mb-3 border-b border-brand/20 pb-2 flex items-center gap-2">
                                                  <Icons.Award className="w-3.5 h-3.5" />
                                                  {m.source || 'Strategic Reference Active'}
                                                </div>
                                            )}
                                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
                                                <Markdown>{m.content}</Markdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse px-4">
                                        <Icons.Sparkles className="w-4 h-4 animate-spin text-brand" />
                                        <span>{useThinking ? 'Gemini 3.1 Reasoning in Progress...' : 'Analyzing Global CMA Standards...'}</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                                <div className="relative max-w-4xl mx-auto">
                                    <input 
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-8 py-5 pr-20 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none shadow-sm focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all" 
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
                        </motion.div>
                    )}

                    {activeTool === 'RESEARCH' && (
                        <motion.div 
                            key="research"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col gap-8 overflow-hidden"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Grounded Research</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium italic">Search the live web for the latest CMA exam updates, IMA standards, or industry news.</p>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input 
                                        value={researchInput}
                                        onChange={(e) => setResearchInput(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-8 py-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none focus:ring-4 focus:ring-brand/10 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                        placeholder="e.g., Latest CMA Part 1 exam changes 2026..."
                                    />
                                    <button 
                                        onClick={handleResearch}
                                        disabled={isResearchLoading || !researchInput.trim()}
                                        className="px-8 py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md"
                                    >
                                        {isResearchLoading ? <Icons.CloudSync className="w-4 h-4 animate-spin" /> : <Icons.Search className="w-4 h-4" />}
                                        Research
                                    </button>
                                </div>
                            </div>

                            {researchResult && (
                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md overflow-y-auto no-scrollbar">
                                    <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                                        <Markdown>{researchResult.text}</Markdown>
                                    </div>
                                    {researchResult.sources.length > 0 && (
                                        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                                            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Verified Sources</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {researchResult.sources.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] text-brand font-bold hover:bg-brand/10 transition-all truncate max-w-[200px]">
                                                        {new URL(url).hostname}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTool === 'VISUALIZER' && (
                        <motion.div 
                            key="visualizer"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex-1 flex flex-col gap-8 overflow-hidden"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Study Visualizer</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium italic">Generate custom diagrams, charts, or visual study aids using Gemini Flash Image.</p>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input 
                                        value={visualPrompt}
                                        onChange={(e) => setVisualPrompt(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-8 py-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none focus:ring-4 focus:ring-brand/10 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                        placeholder="e.g., A flowchart of the joint costing process..."
                                    />
                                    <button 
                                        onClick={handleVisualize}
                                        disabled={isVisualLoading || !visualPrompt.trim()}
                                        className="px-8 py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md"
                                    >
                                        {isVisualLoading ? <Icons.CloudSync className="w-4 h-4 animate-spin" /> : <Icons.Sparkles className="w-4 h-4" />}
                                        Visualize
                                    </button>
                                </div>
                            </div>

                            {generatedImage && (
                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-4 shadow-md overflow-hidden flex items-center justify-center">
                                    <img src={generatedImage} alt="Study Visual" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTool === 'SPOTS' && (
                        <motion.div 
                            key="spots"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col gap-8 overflow-hidden"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Find Study Spots</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium italic">Locate libraries, study cafes, or CMA coaching centers near you using Google Maps.</p>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input 
                                        value={spotsInput}
                                        onChange={(e) => setSpotsInput(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-8 py-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none focus:ring-4 focus:ring-brand/10 focus:bg-white dark:focus:bg-slate-800 transition-all"
                                        placeholder="e.g., Quiet libraries in Mumbai..."
                                    />
                                    <button 
                                        onClick={handleFindSpots}
                                        disabled={isSpotsLoading || !spotsInput.trim()}
                                        className="px-8 py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-md"
                                    >
                                        {isSpotsLoading ? <Icons.CloudSync className="w-4 h-4 animate-spin" /> : <Icons.Stamp className="w-4 h-4" />}
                                        Find
                                    </button>
                                </div>
                            </div>

                            {spotsResult && (
                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md overflow-y-auto no-scrollbar">
                                    <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                                        <Markdown>{spotsResult.text}</Markdown>
                                    </div>
                                    {spotsResult.places.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {spotsResult.places.map((place, i) => (
                                                <a key={i} href={place.uri} target="_blank" rel="noopener noreferrer" className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl hover:bg-brand/10 hover:border-brand/40 transition-all group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-brand transition-colors">{place.title || 'Study Spot'}</h4>
                                                        <Icons.ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand transition-all group-hover:translate-x-1" />
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">View on Google Maps</p>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTool === 'NOTES' && (
                        <motion.div 
                            key="notes"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex flex-col gap-8 overflow-hidden"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Strategic Guide Generator</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium italic">Paste raw CMA material or describe a complex topic to generate a professional study guide.</p>
                                
                                <textarea 
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[2rem] p-6 md:p-8 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none focus:ring-4 focus:ring-brand/10 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none mb-6"
                                    placeholder="Example: Key differences between physical measures and net realizable value in joint costing..."
                                />
                                
                                <button 
                                    onClick={handleGenerateNotes}
                                    disabled={isNotesLoading || !noteInput.trim()}
                                    className="w-full py-5 bg-slate-900 dark:bg-brand text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {isNotesLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Synthesizing Strategy...</> : <><Icons.Brain className="w-5 h-5" /> Generate Guide</>}
                                </button>
                            </div>

                            {generatedNotes && (
                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md overflow-y-auto no-scrollbar">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Draft Strategy Guide</span>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => handleListen(generatedNotes)} 
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSpeaking ? 'bg-brand text-white' : 'bg-brand/10 text-brand hover:bg-brand hover:text-white'}`}
                                            >
                                                {isSpeaking ? <Icons.CloudSync className="w-3.5 h-3.5 animate-spin" /> : <Icons.Bell className="w-3.5 h-3.5" />}
                                                {isSpeaking ? 'Speaking...' : 'Listen'}
                                            </button>
                                            <button 
                                                onClick={() => handleChatAboutContext(generatedNotes, 'Generated Study Guide')} 
                                                className="px-6 py-2 bg-brand/10 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                            >
                                                Analyze with Mentor
                                            </button>
                                        </div>
                                    </div>
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <Markdown>{generatedNotes}</Markdown>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTool === 'FLASHCARDS' && (
                        <motion.div 
                            key="flashcards"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex-1 flex flex-col gap-8 overflow-hidden"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Formula Card Creator</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 font-medium italic">Generate high-impact flashcards for CMA definitions, formulas, and standards.</p>
                                
                                <textarea 
                                    value={cardTopic}
                                    onChange={(e) => setCardTopic(e.target.value)}
                                    className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[2rem] p-6 md:p-8 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none focus:ring-4 focus:ring-brand/10 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none mb-6"
                                    placeholder="Example: CMA Part 2 - Risk Management & Financial Strategy..."
                                />
                                
                                <button 
                                    onClick={handleGenerateCards}
                                    disabled={isCardsLoading || !cardTopic.trim()}
                                    className="w-full py-5 bg-slate-900 dark:bg-brand text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-brand transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {isCardsLoading ? <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Coding Cards...</> : <><Icons.Plus className="w-5 h-5" /> Generate Deck</>}
                                </button>
                            </div>

                            {generatedCards && (
                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-300 dark:border-slate-800 p-8 md:p-10 shadow-md overflow-y-auto no-scrollbar">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Strategic Flashcards</span>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => handleChatAboutContext(generatedCards, 'Flashcard Deck')} 
                                                className="px-6 py-2 bg-brand/10 text-brand rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                                            >
                                                Practice Mode
                                            </button>
                                        </div>
                                    </div>
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <Markdown>{generatedCards}</Markdown>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
