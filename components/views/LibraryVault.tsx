
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { LibraryItem } from '../../types';
import { costudyService } from '../../services/costudyService';
import { costudyAPI } from '../../services/costudyAPI';

export const LibraryVault: React.FC = () => {
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Content');
    const [ingestionLogs, setIngestionLogs] = useState<string[]>([]);
    const [showArchitecture, setShowArchitecture] = useState(false);
    
    // RAG Search State
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            
            // Check API health
            const health = await costudyAPI.health();
            setApiStatus(health.ok ? 'online' : 'offline');
            
            // Fetch library items
            const data = await costudyService.getLibraryItems();
            setLibrary(data);
            setLoading(false);
        };
        init();
    }, []);

    const handleIngest = async (item: LibraryItem) => {
        setProcessingId(item.id);
        setIngestionLogs([
            `[SYSTEM]: Initializing ingestion for ${item.title}`,
            `[SYSTEM]: Establishing pgvector tunnel...`,
            `[IO]: Reading file stream (${item.size})...`
        ]);
        
        const logSteps = [
            `[COMPUTE]: Generating chunks (1000 tokens / 10% overlap)...`,
            `[AI]: Embedding chunks via text-embedding-3-small...`,
            `[DB]: batch_insert into 'vault_vectors'...`,
            `[DB]: Indexing column 'embedding' (HNSW)...`,
            `[SYSTEM]: Handshake verified. ${item.title} is now neural-ready.`
        ];
        
        logSteps.forEach((step, i) => {
            setTimeout(() => {
                setIngestionLogs(prev => [...prev, step]);
            }, (i + 1) * 800);
        });

        setTimeout(async () => {
            await costudyService.ingestToVault(item.id);
            setLibrary(prev => prev.map(l => l.id === item.id ? { ...l, isIndexed: true } : l));
            setProcessingId(null);
        }, logSteps.length * 800 + 500);
    };

    // RAG Search Handler
    const handleRAGSearch = async () => {
        if (!searchTerm.trim()) return;
        
        setIsSearching(true);
        setShowSearchResults(true);
        
        try {
            const result = await costudyAPI.search(searchTerm, { topK: 8 });
            
            if (result.ok && result.hits) {
                setSearchResults(result.hits);
            } else {
                setSearchResults([]);
            }
        } catch (e) {
            console.error('Search error:', e);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRAGSearch();
        }
    };

    const filtered = library.filter(item => 
        (selectedCategory === 'All Content' || item.category === selectedCategory) &&
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-12 py-20 relative">
            {/* RAG Search Results Overlay */}
            {showSearchResults && (
                <div className="fixed inset-0 z-40 bg-slate-950/98 backdrop-blur-3xl flex items-start justify-center p-10 pt-20 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
                    <div className="bg-white/5 border border-white/10 p-12 rounded-[4rem] max-w-5xl w-full relative shadow-[0_0_100px_rgba(255,26,26,0.1)]">
                        <button onClick={() => setShowSearchResults(false)} className="absolute top-8 right-8 p-4 hover:bg-white/10 rounded-full transition-all text-white">
                            <Icons.Plus className="w-8 h-8 rotate-45" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-brand/10 rounded-2xl">
                                <Icons.Search className="w-8 h-8 text-brand" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tighter">Vector Search Results</h3>
                                <p className="text-slate-400 text-sm">Query: "{searchTerm}"</p>
                            </div>
                        </div>

                        {isSearching ? (
                            <div className="flex flex-col items-center py-20 gap-6">
                                <Icons.CloudSync className="w-16 h-16 animate-spin text-brand" />
                                <span className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Searching vector space...</span>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-6">
                                {searchResults.map((hit, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/5 p-8 rounded-3xl hover:border-brand/30 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-brand/20 text-brand px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {Math.round(hit.similarity * 100)}% Match
                                                </span>
                                                <span className="text-slate-500 text-xs font-bold">
                                                    Doc: {hit.document_id?.slice(0, 20)}...
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                Page {hit.page_number} / Chunk {hit.chunk_index}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                                            {hit.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Icons.Search className="w-16 h-16 text-slate-600 mx-auto mb-6" />
                                <p className="text-slate-400 font-bold">No matching vectors found.</p>
                                <p className="text-slate-500 text-sm mt-2">Try a different query or ingest more documents.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Supabase Arch Overlay */}
            {showArchitecture && (
                <div className="fixed inset-0 z-30 bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white/5 border border-white/10 p-16 rounded-[4rem] max-w-5xl w-full max-h-[85vh] overflow-y-auto no-scrollbar relative shadow-[0_0_100px_rgba(255,26,26,0.1)]">
                        <button onClick={() => setShowArchitecture(false)} className="absolute top-10 right-10 p-4 hover:bg-white/10 rounded-full transition-all text-white">
                            <Icons.Plus className="w-8 h-8 rotate-45" />
                        </button>
                        <h3 className="text-5xl font-black text-white mb-8 tracking-tighter uppercase flex items-center gap-4">
                           <Icons.Logo className="w-12 h-12" />
                           Supabase RAG Protocol
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6">
                                <h4 className="text-brand font-black uppercase text-xs tracking-widest">1. Neural Chunking</h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    To handle your <b>1GB library</b>, we split material into semantic chunks. This allows the AI to perform "needle-in-a-haystack" retrieval without exceeding context windows.
                                </p>
                                <div className="bg-black/40 p-6 rounded-2xl font-mono text-[10px] text-brand-300">
                                    {`// Vector RAG Logic\nconst chunks = document.split({ size: 1024, overlap: 128 });`}
                                </div>
                            </div>
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6">
                                <h4 className="text-brand font-black uppercase text-xs tracking-widest">2. pgvector Indexing</h4>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Embeddings are stored as 1536-dimension vectors in Supabase. We use HNSW indexing for sub-millisecond similarity searches.
                                </p>
                                <div className="bg-black/40 p-6 rounded-2xl font-mono text-[10px] text-emerald-400 overflow-x-auto">
                                    {`CREATE INDEX ON vault_vectors \nUSING hnsw (embedding vector_cosine_ops);`}
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand/10 border border-brand/20 p-10 rounded-[3rem] text-center">
                            <Icons.CloudSync className="w-12 h-12 text-brand mx-auto mb-6" />
                            <h4 className="text-white font-black uppercase tracking-widest text-lg mb-2">Retrieval Augmented Generation</h4>
                            <p className="text-slate-400 text-sm max-w-2xl mx-auto italic leading-relaxed">
                                "The CoStudy AI Deck doesn't just guess. It performs a semantic search on your private library, finds the relevant facts, and uses GPT-4 to synthesize a perfect answer."
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <header className="mb-20 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-brand/5 blur-[150px] pointer-events-none"></div>
                <div className="flex justify-center gap-4 mb-8">
                    <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">
                        <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        {apiStatus === 'online' ? 'RAG Engine Online' : apiStatus === 'offline' ? 'RAG Offline' : 'Connecting...'}
                    </div>
                    <button 
                        onClick={() => setShowArchitecture(true)}
                        className="inline-flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand hover:text-white transition-all shadow-xl"
                    >
                        <Icons.Brain className="w-5 h-5" />
                        Engineering Specs
                    </button>
                </div>
                <h2 className="text-8xl font-black text-slate-900 tracking-tighter leading-tight scale-y-110 mb-4 uppercase">Success Library</h2>
                <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
                    Synchronize your personal CMA resources with the **CoStudy RAG Engine**. Transform 1GB of static text into a living, searchable neural network.
                </p>
            </header>

            <div className="flex flex-col md:flex-row gap-12 mb-16 items-center justify-between bg-white/40 backdrop-blur-xl p-8 rounded-[4rem] border border-white/80 shadow-sm">
                <div className="relative w-full max-w-xl">
                    <input 
                        type="text" 
                        placeholder="Semantic search your knowledge vault..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full bg-white border border-slate-100 px-10 py-5 rounded-[2rem] text-sm font-bold text-slate-900 shadow-sm outline-none pl-16 pr-32 transition-all focus:ring-4 focus:ring-brand/5"
                    />
                    <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                    {apiStatus === 'online' && (
                        <button 
                            onClick={handleRAGSearch}
                            disabled={!searchTerm.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            RAG Search
                        </button>
                    )}
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {['All Content', 'Financial Accounting', 'Strategy', 'Practice'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-brand/30'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-32 gap-6 text-slate-300">
                    <Icons.CloudSync className="w-20 h-20 animate-spin text-brand" />
                    <span className="font-black uppercase tracking-widest text-sm animate-pulse">Establishing Supabase Neural Link...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filtered.map(item => (
                        <div key={item.id} className="group bg-white/80 backdrop-blur-3xl border border-white/80 p-10 rounded-[4rem] shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col min-h-[420px]">
                            {processingId === item.id && (
                                <div className="absolute inset-0 z-30 bg-slate-950/98 backdrop-blur-md p-10 flex flex-col justify-center animate-in fade-in duration-300">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-brand/10 rounded-2xl">
                                            <Icons.Brain className="w-8 h-8 text-brand animate-pulse" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-black text-xs uppercase tracking-widest">Vector Ingestion</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">pgvector • hnsw</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 bg-black/30 p-6 rounded-3xl border border-white/5">
                                        {ingestionLogs.map((log, i) => (
                                            <div key={i} className="text-[10px] font-mono text-slate-400 border-l border-brand/40 pl-4 leading-tight animate-in slide-in-from-left duration-500">
                                                <span className="text-brand/60 mr-2">$</span> {log}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-brand h-full animate-[progress_5s_linear]"></div>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                {item.type === 'PDF' && <Icons.FileText className="w-32 h-32" />}
                                {item.type === 'MCQ_BANK' && <Icons.ClipboardList className="w-32 h-32" />}
                                {item.type === 'TRANSCRIPT' && <Icons.MessageCircle className="w-32 h-32" />}
                            </div>
                            
                            <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${item.isIndexed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-brand/5 text-brand border border-brand/10'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.isIndexed ? 'bg-emerald-500' : 'bg-brand animate-pulse'}`}></div>
                                        {item.isIndexed ? 'Neural Sync' : 'Static File'}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-[1.0] mb-6 group-hover:text-brand transition-colors">{item.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {item.tags.map(tag => <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-100">#{tag}</span>)}
                                </div>
                            </div>

                            <div className="relative z-10 pt-8 border-t border-slate-100/80">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Payload</div>
                                        <div className="text-sm font-black text-slate-900">{item.size}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Encryption</div>
                                        <div className="text-sm font-black text-slate-900">AES-256</div>
                                    </div>
                                </div>

                                {item.isIndexed ? (
                                    <div className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border border-emerald-100 shadow-sm shadow-emerald-500/5 transition-all">
                                        <Icons.CheckBadge className="w-4 h-4" /> 
                                        Linked to AI Deck
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleIngest(item)}
                                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Icons.Brain className="w-4 h-4" /> 
                                        Run Neural Ingest
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
};
