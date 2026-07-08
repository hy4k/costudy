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

const DECK_TOOLS: { key: Tool; icon: keyof typeof Icons; title: string; hint: string }[] = [
    { key: 'CHAT', icon: 'Sparkles', title: 'Mastermind Chat', hint: 'Ask anything, IMA-aligned' },
    { key: 'NOTES', icon: 'BookOpen', title: 'Notes Refiner', hint: 'Turn rough material into clean notes' },
    { key: 'FLASHCARDS', icon: 'ClipboardList', title: 'Flashcards', hint: 'Drill a topic deck' },
    { key: 'TOPIC', icon: 'Grid', title: 'Topic Blueprint', hint: 'Map a section in minutes' },
    { key: 'ESSAY', icon: 'Scale', title: 'Essay Audit', hint: 'Rubric-graded feedback' },
];

const GEN_CONF: Record<Exclude<Tool, 'CHAT'>, { label: string; placeholder: string; rows: number; cta: string }> = {
    TOPIC: { label: 'Topic blueprint', placeholder: 'e.g. Part 1 Section F — Technology & Analytics', rows: 2, cta: 'Generate blueprint' },
    NOTES: { label: 'Study guide', placeholder: 'Paste rough notes or a transcript — e.g. a paragraph about joint costing methods…', rows: 5, cta: 'Refine notes' },
    FLASHCARDS: { label: 'Flashcard deck', placeholder: 'e.g. CMA Part 2 — Risk Management & Financial Strategy', rows: 3, cta: 'Generate deck' },
    ESSAY: { label: 'Essay audit', placeholder: 'Write or paste your essay response here…', rows: 8, cta: 'Audit essay' },
};

export const AIDeck: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('CHAT');

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Greetings, future CMA. I'm grounded in your library — ask me anything from Part 1 or Part 2, and I'll guide you to exam mastery." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [subject, setSubject] = useState('CMA Part 1');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>('STANDARD');
    const [activeContext, setActiveContext] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Generator tools state (one slot per tool)
    const [genInput, setGenInput] = useState<Record<string, string>>({});
    const [genOutput, setGenOutput] = useState<Record<string, string>>({});
    const [genLoading, setGenLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatLoading]);

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
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const runGenerator = async (tool: Exclude<Tool, 'CHAT'>) => {
        const input = (genInput[tool] || '').trim();
        if (!input) return;
        setGenLoading(prev => ({ ...prev, [tool]: true }));

        try {
            let result = '';
            if (tool === 'NOTES') {
                result = await generateStudyContent(
                    `Convert the following material into professional, structured CMA US strategic study notes with clear headers, bullet points, and key formula highlights where applicable:\n\n${input}`,
                    "You are a world-class CMA US academic coach specializing in strategic and clear note-taking based on official IMA standards."
                );
            } else if (tool === 'FLASHCARDS') {
                result = await generateStudyContent(
                    `Generate 5 high-impact CMA US flashcards (Question and Answer format) for the following topic/material. Focus on exam-heavy concepts and key definitions:\n\n${input}`,
                    "You are a specialized CMA exam designer creating flashcards for strategic mastery."
                );
            } else if (tool === 'TOPIC') {
                result = await generateStudyContent(
                    `Create a comprehensive, deep-dive CMA US study guide for the topic: "${input}".

            Structure Required:
            1. Concept Definition (Official IMA Definition if applicable)
            2. Strategic Relevance (Why it matters for Part 1/2)
            3. Key Formulas / Components (with breakdown)
            4. Example Scenario (Practical Application)
            5. Exam Tips (Common pitfalls & Weightage)`,
                    "You are a CMA Exam Curriculum Expert."
                );
            } else if (tool === 'ESSAY') {
                result = await evaluateEssay(input, subject);
            }
            setGenOutput(prev => ({ ...prev, [tool]: result }));
        } finally {
            setGenLoading(prev => ({ ...prev, [tool]: false }));
        }
    };

    const handleChatAboutContext = (content: string, source: string) => {
        setActiveContext(content);
        setChatMode('FOLLOW_UP');
        setActiveTool('CHAT');
        setMessages([{
            role: 'model',
            content: `I've analyzed the ${source}. What specific concept or exam-related strategy from this material should we break down further?`,
            isContextual: true,
            source: source
        }]);
    };

    const clearContext = () => {
        setActiveContext(null);
        if (chatMode === 'FOLLOW_UP') setChatMode('STANDARD');
    };

    const genConf = activeTool !== 'CHAT' ? GEN_CONF[activeTool] : null;
    const genSourceLabel: Record<string, string> = {
        TOPIC: 'Generated Blueprint',
        NOTES: 'Generated Study Guide',
        FLASHCARDS: 'Flashcard Deck',
        ESSAY: 'Essay Audit Report',
    };

    return (
        <div className="proto wall-embedded">
            <div className="wall" data-page="ai">
                <main className="shell-solo shell-wide">
                    {/* Masthead */}
                    <div className="feed-hello">
                        <h1 className="font-display">CMA Mastermind</h1>
                        <p>IMA-aligned tools for chat, notes, and drills — grounded in your materials.</p>
                    </div>

                    <div className="deck-wrap">
                        {/* Tools rail */}
                        <div className="deck-tools">
                            {DECK_TOOLS.map((t) => {
                                const TIc = Icons[t.icon] as React.FC<{ className?: string }>;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        className={`deck-tool ${activeTool === t.key ? 'on' : ''}`}
                                        onClick={() => setActiveTool(t.key)}
                                    >
                                        <span className="deck-tool-ic"><TIc className="w-[18px] h-[18px]" /></span>
                                        <span className="deck-tool-tx">
                                            <strong>{t.title}</strong>
                                            <span>{t.hint}</span>
                                        </span>
                                    </button>
                                );
                            })}

                            {/* Active context card */}
                            {activeContext && (
                                <div className="post" style={{ padding: '14px 15px', marginTop: 6 }}>
                                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-deep)', marginBottom: 6 }}>
                                        Active context
                                    </p>
                                    <p style={{ fontSize: '0.74rem', color: 'var(--muted)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 10 }}>
                                        “{activeContext}”
                                    </p>
                                    <button type="button" className="clay-option" style={{ padding: '8px 12px', fontSize: '0.72rem' }} onClick={clearContext}>
                                        Reset context
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Panel */}
                        <div className="post deck-panel">
                            {activeTool === 'CHAT' ? (
                                <div className="deck-chat">
                                    {/* Modes + subject */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                        <div className="deck-modes" style={{ marginBottom: 0 }}>
                                            <button type="button" className={`seg ${chatMode === 'STANDARD' ? 'seg-on' : ''}`} onClick={() => setChatMode('STANDARD')}>Global</button>
                                            <button type="button" className={`seg ${chatMode === 'VAULT_REF' ? 'seg-on' : ''}`} onClick={() => setChatMode('VAULT_REF')}>Library</button>
                                            <button
                                                type="button"
                                                className={`seg ${chatMode === 'FOLLOW_UP' ? 'seg-on' : ''}`}
                                                disabled={!activeContext}
                                                style={!activeContext ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                                                onClick={() => activeContext && setChatMode('FOLLOW_UP')}
                                            >
                                                Follow-up
                                            </button>
                                        </div>
                                        <select
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            style={{
                                                border: '1.5px solid var(--line)', borderRadius: 12, padding: '7px 12px',
                                                fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)',
                                                background: 'var(--card)', outline: 'none', marginBottom: 14,
                                            }}
                                        >
                                            <option>CMA Part 1</option>
                                            <option>CMA Part 2</option>
                                            <option>Ethics & Standards</option>
                                            <option>Cost Management</option>
                                        </select>
                                    </div>

                                    {/* Messages */}
                                    <div className="deck-msgs">
                                        {messages.map((m, i) => (
                                            <div key={i} className={`dm-bubble ${m.role === 'user' ? 'mine' : ''}`}>
                                                {m.isContextual && m.role === 'model' && m.source && (
                                                    <span className="dm-src"><Icons.BookOpen className="w-[11px] h-[11px]" /> {m.source}</span>
                                                )}
                                                {m.content}
                                            </div>
                                        ))}
                                        {isChatLoading && (
                                            <div className="dm-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                                                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', flex: 'none' }} />
                                                Mastermind is thinking…
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Follow-up context strip */}
                                    {activeContext && chatMode === 'FOLLOW_UP' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 14, background: 'var(--accent-soft)', margin: '10px 0 0', fontSize: '0.74rem', color: 'var(--accent-deep)' }}>
                                            <Icons.Brain className="w-4 h-4" style={{ flex: 'none' }} />
                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                                                Focusing on: “{activeContext}”
                                            </span>
                                            <button type="button" onClick={clearContext} style={{ fontWeight: 800, flex: 'none' }}>Clear ✕</button>
                                        </div>
                                    )}

                                    {/* Input */}
                                    <div className="deck-input">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={chatInput}
                                            placeholder={chatMode === 'VAULT_REF' ? 'Ask about Part 1 or Part 2 specific content…' : 'Ask your CMA mentor anything…'}
                                            disabled={isChatLoading}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button
                                            type="button"
                                            className="comment-send"
                                            onClick={handleSendMessage}
                                            disabled={isChatLoading || !chatInput.trim()}
                                            aria-label="Send"
                                            style={isChatLoading || !chatInput.trim() ? { opacity: 0.4 } : undefined}
                                        >
                                            <Icons.Send className="w-[15px] h-[15px]" />
                                        </button>
                                    </div>
                                </div>
                            ) : genConf && (
                                <div className="deck-gen">
                                    <textarea
                                        className="composer-text"
                                        rows={genConf.rows}
                                        placeholder={genConf.placeholder}
                                        value={genInput[activeTool] || ''}
                                        onChange={(e) => setGenInput(prev => ({ ...prev, [activeTool]: e.target.value }))}
                                    ></textarea>
                                    <div className="deck-gen-row">
                                        <button
                                            type="button"
                                            className="btn-post"
                                            disabled={genLoading[activeTool] || !(genInput[activeTool] || '').trim()}
                                            onClick={() => runGenerator(activeTool as Exclude<Tool, 'CHAT'>)}
                                        >
                                            <Icons.Sparkles className="w-[14px] h-[14px]" />
                                            {genLoading[activeTool] ? 'Generating…' : genConf.cta}
                                        </button>
                                        {genOutput[activeTool] && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="rooms-create"
                                                    onClick={() => handleChatAboutContext(genOutput[activeTool], genSourceLabel[activeTool])}
                                                >
                                                    Discuss with Mastermind
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rooms-create"
                                                    onClick={() => setGenOutput(prev => ({ ...prev, [activeTool]: '' }))}
                                                >
                                                    Clear
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {genLoading[activeTool] && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.82rem', padding: '14px 4px' }}>
                                            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                                            Working on your {genConf.label.toLowerCase()}…
                                        </div>
                                    )}
                                    {genOutput[activeTool] && !genLoading[activeTool] && (
                                        <div className="ai-summary deck-out">
                                            <span className="ai-chip"><Icons.Sparkles className="w-3 h-3" /> {genConf.label}</span>
                                            <p style={{ whiteSpace: 'pre-wrap' }}>{genOutput[activeTool]}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
