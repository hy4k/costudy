
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { User, ChatConversation, ChatMessage, ThreadContextType, SignalLevel, SignalConfig } from '../../types';
import { chatService } from '../../services/chatService';
import { supabase } from '../../services/supabaseClient';

interface DirectMessagesProps {
  userId?: string;
}

export const DirectMessages: React.FC<DirectMessagesProps> = ({ userId }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Search & Creation State
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  // New Context Selection State
  const [selectedPeer, setSelectedPeer] = useState<User | null>(null);
  const [contextType, setContextType] = useState<ThreadContextType | null>(null);
  const [contextTitle, setContextTitle] = useState('');

  // Micro-Consulting State
  const [isBookingConsult, setIsBookingConsult] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      loadConversations();
      
      const channel = supabase.channel('global_chats')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
             loadConversations(); 
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [userId]);

  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId);

      const channel = supabase.channel(`chat_${activeConvoId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${activeConvoId}` }, async (payload) => {
            const { data: sender } = await supabase.from('user_profiles').select('*').eq('id', payload.new.sender_id).single();
            setMessages(prev => [...prev, { ...payload.new as any, sender }]);
            scrollToBottom();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeConvoId]);

  const loadConversations = async () => {
    if (!userId) return;
    const data = await chatService.getConversations(userId);
    // Parse context from name field if it exists (hack for demo persistence)
    const parsedData = data.map(c => {
        try {
            if (c.name && c.name.startsWith('{')) {
                const ctx = JSON.parse(c.name);
                return { ...c, contextType: ctx.type, contextId: ctx.id, contextTitle: ctx.title };
            }
        } catch(e) {}
        return c;
    });
    setConversations(parsedData);
    setLoading(false);
  };

  const loadMessages = async (id: string) => {
    const msgs = await chatService.getMessages(id);
    setMessages(msgs);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendMessage = async (customContent?: string) => {
    const contentToSend = customContent || inputText;
    if (!contentToSend.trim() || !activeConvoId || !userId) return;
    try {
      setInputText('');
      await chatService.sendMessage(activeConvoId, userId, contentToSend);
    } catch (e) {
      console.error("Failed to send", e);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length > 2 && userId) {
      const res = await chatService.searchUsers(q, userId);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const handlePeerSelect = (user: User) => {
      setSelectedPeer(user);
      setSearchQuery('');
      setSearchResults([]);
  };

  const handleStartContextThread = async () => {
      if (!userId || !selectedPeer || !contextType || !contextTitle.trim()) return;
      
      const newConvo = await chatService.startContextThread(userId, selectedPeer.id, {
          type: contextType,
          id: `ctx-${Date.now()}`,
          title: contextTitle
      });

      if (newConvo) {
          setConversations(prev => [newConvo, ...prev]);
          setActiveConvoId(newConvo.id);
          // Reset UI
          setIsCreatingThread(false);
          setSelectedPeer(null);
          setContextType(null);
          setContextTitle('');
      }
  };

  const handleMicroConsulting = async () => {
      setIsBookingConsult(true);
      setTimeout(() => {
          setIsBookingConsult(false);
          handleSendMessage("[SYSTEM]: ⚡ Micro-Consulting Session Confirmed (15m). Credits deducted.");
      }, 1500);
  };

  const getOtherParticipant = (convo: ChatConversation) => {
    return convo.participants?.find(p => p.id !== userId) || convo.participants?.[0];
  };

  const activeConversation = conversations.find(c => c.id === activeConvoId);
  const isThreadLocked = activeConversation?.status === 'LOCKED'; 
  const otherParticipant = activeConversation ? getOtherParticipant(activeConversation) : null;
  const signalConfig = otherParticipant?.signalLevel ? SignalConfig[otherParticipant.signalLevel as SignalLevel] : SignalConfig['ACTIVE_SOLVER'];

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
      
      {/* SIDEBAR: ROSTER & MISSIONS */}
      <div className={`w-full md:w-[400px] flex flex-col bg-[#0f172a] text-white rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden shrink-0 ${activeConvoId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-8 border-b border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center mb-6">
             <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Inbox</h2>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Your Conversations</div>
             </div>
             <button 
                onClick={() => setIsCreatingThread(!isCreatingThread)} 
                className={`w-12 h-12 rounded-2xl shadow-lg transition-all flex items-center justify-center ${isCreatingThread ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-brand text-white hover:bg-brand-600 hover:scale-105 active:scale-95'}`}
             >
                <Icons.Plus className="w-5 h-5" />
             </button>
          </div>
          
          {/* Thread Creation Interface */}
          {isCreatingThread && (
             <div className="animate-in slide-in-from-top-4 bg-slate-800 border border-slate-700 rounded-[2rem] p-6 shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand"></div>
                {!selectedPeer ? (
                    <>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Select Target Scholar</p>
                        <div className="relative">
                            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              autoFocus
                              placeholder="Search handle..." 
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand/50 mb-2 transition-all"
                              value={searchQuery}
                              onChange={e => handleSearchUsers(e.target.value)}
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                           {searchResults.map(u => (
                             <div key={u.id} onClick={() => handlePeerSelect(u)} className="flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-600">
                                <img src={u.avatar} className="w-8 h-8 rounded-lg bg-slate-800 object-cover" />
                                <div>
                                    <div className="text-xs font-black text-white leading-none">{u.name}</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase">@{u.handle || 'user'}</div>
                                </div>
                             </div>
                           ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <img src={selectedPeer.avatar} className="w-8 h-8 rounded-lg object-cover" />
                                <span className="text-xs font-black text-white">{selectedPeer.name}</span>
                            </div>
                            <button onClick={() => setSelectedPeer(null)} className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest">Change</button>
                        </div>

                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Establish Context</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['QUESTION', 'ESSAY', 'MOCK_EXAM', 'CONCEPT'] as ThreadContextType[]).map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setContextType(type)}
                                        className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${contextType === type ? 'bg-white text-slate-900 border-white shadow-md transform scale-105' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-brand/50'}`}
                                    >
                                        {type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {contextType && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">3. Mission Objective</p>
                                <input 
                                    placeholder="e.g. Audit Essay #214..."
                                    value={contextTitle}
                                    onChange={(e) => setContextTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                                />
                            </div>
                        )}

                        <button 
                            onClick={handleStartContextThread}
                            disabled={!contextTitle.trim()}
                            className="w-full py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 hover:bg-brand-600 transition-all shadow-xl active:scale-95"
                        >
                            Initialize Link
                        </button>
                    </div>
                )}
             </div>
          )}
          
          <div className="relative group">
             <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand transition-colors" />
             <input placeholder="Filter conversations..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-slate-700 transition-all shadow-sm placeholder:text-slate-600" />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-900/30 custom-scrollbar">
           {conversations.length === 0 && !loading && (
             <div className="text-center py-20 opacity-30 flex flex-col items-center">
               <Icons.MessageCircle className="w-12 h-12 text-slate-600 mb-4" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Active Conversations</p>
             </div>
           )}
           
           {conversations.map(convo => {
             const other = getOtherParticipant(convo);
             const isActive = convo.id === activeConvoId;
             // Mock signal level for list view items if data missing
             const signalColor = other?.signalLevel ? SignalConfig[other.signalLevel as SignalLevel].color : 'bg-emerald-500';

             return (
               <div 
                 key={convo.id} 
                 onClick={() => setActiveConvoId(convo.id)}
                 className={`p-5 rounded-[2rem] cursor-pointer transition-all border group relative overflow-hidden ${isActive ? 'bg-slate-800 border-slate-700 shadow-xl ring-1 ring-white/10' : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'}`}
               >
                 {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand"></div>}
                 
                 <div className="flex items-start gap-4 relative z-10">
                    <div className="relative">
                       <img src={other?.avatar || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-800 shadow-sm" />
                       <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-slate-900 ${signalColor}`}></div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                       <div className="flex justify-between items-center mb-1">
                          <h4 className={`text-xs font-black uppercase tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>{other?.name}</h4>
                          <span className="text-[9px] font-bold text-slate-600">{convo.last_message ? new Date(convo.last_message.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'New'}</span>
                       </div>
                       
                       <div className="flex items-center gap-2 mb-2">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isActive ? 'bg-brand text-white' : 'bg-slate-800 text-slate-500'}`}>
                               {convo.contextType || 'GENERAL'}
                           </span>
                       </div>

                       <p className={`text-[11px] font-medium truncate leading-relaxed ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                          {convo.last_message ? convo.last_message.content : <span className="italic opacity-30">Conversation started.</span>}
                       </p>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* MAIN CHAT AREA: "THE COCKPIT" */}
      <div className={`flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative ${!activeConvoId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {activeConvoId && activeConversation ? (
          <>
            {/* Header: Mission Brief */}
            <div className="px-8 py-6 bg-white/90 backdrop-blur-xl border-b border-slate-100 relative z-20 flex flex-col gap-4">
               
               {/* Top Row: User Info & Controls */}
               <div className="flex justify-between items-center">
                   <div className="flex items-center gap-5">
                      <button className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900" onClick={() => setActiveConvoId(null)}>
                          <Icons.ChevronLeft className="w-6 h-6" />
                      </button>
                      <div className="relative">
                          <img src={otherParticipant?.avatar} className="w-14 h-14 rounded-2xl ring-4 ring-slate-50 shadow-lg object-cover" />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white ${signalConfig?.color || 'bg-gray-500'}`}></div>
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{otherParticipant?.name}</h3>
                         <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${signalConfig?.color || 'bg-gray-500'} animate-pulse`}></div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{signalConfig?.label || 'Unknown Signal'}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex gap-3">
                       {/* Context Badge */}
                       <div className="hidden sm:flex flex-col items-end">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Topic</span>
                           <div className="px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <Icons.Link className="w-3 h-3" />
                               {activeConversation.contextType}
                           </div>
                       </div>
                   </div>
               </div>

               {/* Second Row: Context Title & Smart Actions */}
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-3 text-slate-600">
                       <Icons.FileText className="w-4 h-4 text-slate-400" />
                       <span className="text-sm font-bold tracking-wide">"{activeConversation.contextTitle || 'General Discussion'}"</span>
                   </div>

                   {/* SMART ACTION BAR */}
                   <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                       {/* Micro-Consulting Button */}
                       <button 
                           onClick={handleMicroConsulting}
                           disabled={isBookingConsult}
                           className="px-4 py-2 bg-slate-900 text-white hover:bg-brand rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shadow-md disabled:opacity-50"
                       >
                           {isBookingConsult ? <Icons.CloudSync className="w-3 h-3 animate-spin" /> : <Icons.Clock className="w-3 h-3" />} 
                           Book 15m SOS
                       </button>

                       {activeConversation.contextType === 'ESSAY' && (
                           <>
                               <button 
                                onClick={() => handleSendMessage("[SYSTEM]: Marked as Compliant ✅")}
                                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap"
                               >
                                   <Icons.CheckCircle className="w-3 h-3" /> Mark Compliant
                               </button>
                               <button 
                                onClick={() => handleSendMessage("[SYSTEM]: Flagged for Revision 🚩")}
                                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap"
                               >
                                   <Icons.AlertCircle className="w-3 h-3" /> Flag Issue
                               </button>
                           </>
                       )}
                       {activeConversation.contextType === 'MOCK_EXAM' && (
                           <button 
                            onClick={() => handleSendMessage(`[SYSTEM]: Sharing Mock Stats 📊\nScore: 82%\nPercentile: 94th\nWeakness: Ethics`)}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap"
                           >
                               <Icons.BarChart className="w-3 h-3" /> Share Stats
                           </button>
                       )}
                       {activeConversation.contextType === 'QUESTION' && (
                           <button 
                            onClick={() => handleSendMessage("[SYSTEM]: Vouched for Solution 🏆")}
                            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap"
                           >
                               <Icons.Stamp className="w-3 h-3" /> Vouch
                           </button>
                       )}
                   </div>
               </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar bg-slate-50/50">
               {messages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-40">
                       <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
                           <Icons.Link className="w-10 h-10 text-slate-300" />
                       </div>
                       <div className="text-center space-y-2">
                           <h3 className="text-lg font-black text-slate-900 uppercase tracking-[0.2em]">Link Established</h3>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Begin transmission regarding<br/>"{activeConversation.contextTitle}"</p>
                       </div>
                   </div>
               )}
               
               {messages.map((m, i) => {
                 const isMe = m.sender_id === userId;
                 const isSystem = m.content.startsWith('[SYSTEM]:');
                 
                 if (isSystem) {
                     return (
                         <div key={m.id || i} className="flex justify-center my-6">
                             <div className="bg-slate-100 border border-slate-200 px-6 py-3 rounded-full flex items-center gap-3 shadow-sm">
                                 <Icons.CheckBadge className="w-4 h-4 text-slate-500" />
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.content.replace('[SYSTEM]:', '')}</span>
                             </div>
                         </div>
                     );
                 }

                 return (
                   <div key={m.id || i} className={`flex items-end gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && <img src={m.sender?.avatar} className="w-10 h-10 rounded-xl shadow-sm ring-2 ring-white object-cover" />}
                      
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[65%]`}>
                          <div className={`p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-md ${isMe ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-900 rounded-bl-none border border-slate-100'}`}>
                             {m.content}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest px-2">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100 relative z-20">
               {isThreadLocked ? (
                   <div className="text-center py-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center gap-3">
                       <Icons.Lock className="w-6 h-6 text-slate-400" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Archived</p>
                       <button onClick={() => { setIsCreatingThread(true); setActiveConvoId(null); }} className="text-xs font-bold text-brand hover:text-slate-900 transition-colors">Initialize New Protocol</button>
                   </div>
               ) : (
                   <div className="relative max-w-4xl mx-auto">
                      <input 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder={`Transmit message to ${otherParticipant?.name}...`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] pl-8 pr-24 py-6 text-sm text-slate-900 font-medium outline-none focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand/30 transition-all placeholder:text-slate-400"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <button className="p-3 text-slate-400 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-100">
                              <Icons.Link className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleSendMessage()} 
                            disabled={!inputText.trim()}
                            className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-brand active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
                          >
                             <Icons.Send className="w-5 h-5" />
                          </button>
                      </div>
                   </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 p-8">
             <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
                <Icons.MessageCircle className="w-20 h-20 text-slate-300" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Select a Message</h3>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                 Choose a conversation from your inbox or start a new chat.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
    