
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from '../Icons';
import { StudyRoom, User, RoomMessage, RoomResource, StudySession } from '../../types';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { supabase } from '../../services/supabaseClient';
import { GoogleGenAI, Modality } from '@google/genai';
import { generateStudyContent } from '../../services/geminiService';

type RoomTab = 'Chat' | 'Live Audio' | 'Whiteboard' | 'Resources' | 'Calendar';

interface StudyRoomsProps {
  userId?: string;
}

interface PresenceState {
  user_id: string;
  roomId: string | null;
  online_at: string;
  name?: string;
  avatar?: string;
  role?: string;
}

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userId }) => {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [activeTab, setActiveTab] = useState<RoomTab>('Chat');

  // -- Real-time Presence State --
  const [roomPresence, setRoomPresence] = useState<Record<string, PresenceState[]>>({});

  // -- Room Feature States --
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // -- RESOURCES STATE --
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [notebookStructure, setNotebookStructure] = useState<any>(null); // AI Generated TOC

  // Resource Editing State
  const [editingResource, setEditingResource] = useState<RoomResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');

  // -- SESSIONS STATE --
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    session_type: 'GENERAL' as 'STRATEGY' | 'DRILL' | 'MOCK_EXAM' | 'Q&A' | 'GENERAL',
    meeting_link: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Gemini Live API State --
  const [isAiListening, setIsAiListening] = useState(false);
  const sessionRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [roomData, userData] = await Promise.all([
        costudyService.getRooms(),
        userId ? getUserProfile(userId) : Promise.resolve(null)
      ]);
      setRooms(roomData);
      setCurrentUser(userData);
      setLoading(false);
    };
    load();
  }, [userId]);

  // -- Supabase Presence Logic --
  useEffect(() => {
    if (userId && !currentUser) return;

    const channel = supabase.channel('room_presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const presenceMap: Record<string, PresenceState[]> = {};

        Object.values(newState).forEach((presences: any) => {
          presences.forEach((p: PresenceState) => {
            if (p.roomId) {
              if (!presenceMap[p.roomId]) presenceMap[p.roomId] = [];
              if (!presenceMap[p.roomId].find(existing => existing.user_id === p.user_id)) {
                presenceMap[p.roomId].push(p);
              }
            }
          });
        });
        setRoomPresence(presenceMap);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId || 'anon-' + Math.floor(Math.random() * 1000),
            online_at: new Date().toISOString(),
            roomId: null,
            name: currentUser?.name || 'Anonymous Aspirant',
            avatar: currentUser?.avatar || 'https://i.pravatar.cc/150',
            role: currentUser?.role || 'STUDENT'
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentUser]);

  // -- Track Room Changes --
  useEffect(() => {
    const channel = supabase.getChannels().find(c => c.topic === 'room_presence');
    if (channel) {
      channel.track({
        user_id: userId || 'anon-' + Math.floor(Math.random() * 1000),
        online_at: new Date().toISOString(),
        roomId: selectedRoom?.id || null,
        name: currentUser?.name || 'Anonymous Aspirant',
        avatar: currentUser?.avatar || 'https://i.pravatar.cc/150',
        role: currentUser?.role || 'STUDENT'
      });
    }
  }, [selectedRoom, userId, currentUser]);


  // -- RESOURCES & NOTEBOOK LOGIC (The Core Request) --
  const fetchResources = async () => {
    if (!selectedRoom) return;
    const { data } = await supabase
      .from('study_room_resources')
      .select('*, author:user_profiles(*)')
      .eq('room_id', selectedRoom.id)
      .order('created_at', { ascending: false });
    if (data) setResources(data);

    const { data: nb } = await supabase
      .from('study_room_notebooks')
      .select('*')
      .eq('room_id', selectedRoom.id)
      .maybeSingle();
    setNotebookStructure(nb);
  };

  useEffect(() => {
    if (selectedRoom && activeTab === 'Resources') {
      fetchResources();
    }
    if (selectedRoom && activeTab === 'Calendar') {
      fetchSessions();
    }
  }, [selectedRoom, activeTab]);

  const fetchSessions = async () => {
    if (!selectedRoom) return;
    setIsSessionsLoading(true);
    const data = await costudyService.getSessions(selectedRoom.id);
    setSessions(data);
    setIsSessionsLoading(false);
  };

  const handleCreateSession = async () => {
    if (!selectedRoom || !userId || !sessionForm.title || !sessionForm.start_time || !sessionForm.end_time) return;

    try {
      const newS = await costudyService.createSession({
        room_id: selectedRoom.id,
        created_by: userId,
        title: sessionForm.title,
        description: sessionForm.description,
        start_time: new Date(sessionForm.start_time).toISOString(),
        end_time: new Date(sessionForm.end_time).toISOString(),
        session_type: sessionForm.session_type,
        meeting_link: sessionForm.meeting_link
      });

      setSessions(prev => [...prev, newS].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      setShowSessionModal(false);
      setSessionForm({ title: '', description: '', start_time: '', end_time: '', session_type: 'GENERAL', meeting_link: '' });
    } catch (err) {
      alert("Failed to schedule session.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom || !userId) return;

    setIsUploading(true);
    try {
      // In a real app, this would upload to Supabase Storage.
      // Here we simulate the record creation.
      const { data, error } = await supabase.from('study_room_resources').insert([{
        room_id: selectedRoom.id,
        user_id: userId,
        title: file.name,
        file_type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        category: 'Unsorted Drop', // Initial category
        summary: 'Analyzing content...' // Placeholder for AI
      }]).select('*, author:user_profiles(*)').single();

      if (data) {
        const updatedResources = [data, ...resources];
        setResources(updatedResources);
        // Trigger AI Re-indexing
        await compileMasterManual(updatedResources);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const compileMasterManual = async (currentResources = resources) => {
    if (!selectedRoom || currentResources.length === 0) return;
    setIsCompiling(true);

    try {
      const resourceList = currentResources.map(r => `${r.title} (${r.file_type})`).join(', ');

      // The AI Prompt to act as a Librarian/Editor
      const aiResponse = await generateStudyContent(
        `Act as a CMA Curriculum Architect. I have a list of raw study resources dropped by students: [${resourceList}].
        
        Organize these into a logical, structured "Textbook" Table of Contents for a CMA Study Manual.
        Group them into Chapters (e.g., "Chapter 1: Financial Reporting", "Chapter 2: Ethics").
        
        Return ONLY a JSON object with this exact structure: 
        { "chapters": [ { "title": "Chapter Name", "sections": [ { "title": "Resource Name From List" } ] } ] }
        Do not include markdown formatting like \`\`\`json. Just the raw JSON string.`,
        "Format as valid JSON."
      );

      const jsonStr = aiResponse.replace(/```json|```/g, '').trim();
      const structure = JSON.parse(jsonStr);

      const { data } = await supabase
        .from('study_room_notebooks')
        .upsert({
          room_id: selectedRoom.id,
          title: `${selectedRoom.name} Master Strategy Manual`,
          table_of_contents: structure,
          last_compiled_at: new Date().toISOString()
        }, { onConflict: 'room_id' })
        .select('*').single();

      setNotebookStructure(data);
    } catch (err) {
      console.error("AI Compilation failed", err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Remove this page from the Master Manual?")) return;
    try {
      await costudyService.deleteResource(id);
      const updated = resources.filter(r => r.id !== id);
      setResources(updated);
      await compileMasterManual(updated);
    } catch (err) {
      alert("Delete sync failed.");
    }
  };

  const startEditing = (res: any) => {
    setEditingResource(res);
    setEditTitle(res.title);
    setEditSummary(res.summary || '');
  };

  const handleUpdateResource = async () => {
    if (!editingResource) return;
    try {
      await costudyService.updateResource(editingResource.id, {
        title: editTitle,
        summary: editSummary
      });
      const updated = resources.map(r => r.id === editingResource.id ? { ...r, title: editTitle, summary: editSummary } : r);
      setResources(updated);
      setEditingResource(null);
      await compileMasterManual(updated);
    } catch (err) {
      alert("Update sync failed.");
    }
  };

  // -- Real-time Chat Logic --
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('study_room_messages')
        .select('*, author:user_profiles(*)')
        .eq('room_id', selectedRoom.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchHistory();

    const channel = supabase
      .channel(`room-chat-${selectedRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${selectedRoom.id}` }, async (payload) => {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', payload.new.user_id).single();
        setMessages(prev => [...prev, { ...payload.new as any, author: data }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !userId || !selectedRoom) return;
    const msg = chatInput;
    setChatInput('');
    await supabase.from('study_room_messages').insert([{
      room_id: selectedRoom.id,
      user_id: userId,
      content: msg,
      type: 'text'
    }]);
  };

  // -- Whiteboard Logic --
  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  // -- Gemini Live Audio --
  const toggleAiAudio = async () => {
    if (isAiListening) {
      setIsAiListening(false);
      sessionRef.current?.close();
      return;
    }

    setIsAiListening(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => console.log('AI Facilitator Online'),
          onmessage: async (message) => { /* Audio stream handling */ },
          onerror: (e) => setIsAiListening(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the study facilitator for the ${selectedRoom?.name} cluster. Guide CMA aspirants with precision.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setIsAiListening(false);
    }
  };

  // -- Filter Rooms & Merge Live Counts --
  const liveRooms = useMemo(() => {
    return rooms.map(room => ({
      ...room,
      // Combine Mock Base + Real Presence for a lively feel
      activeOnline: room.activeOnline + (roomPresence[room.id]?.length || 0)
    }));
  }, [rooms, roomPresence]);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return liveRooms;
    const q = searchQuery.toLowerCase();
    return liveRooms.filter(room =>
      room.name.toLowerCase().includes(q) ||
      room.category.toLowerCase().includes(q) ||
      room.targetTopics?.some(t => t.toLowerCase().includes(q))
    );
  }, [liveRooms, searchQuery]);

  const activeUsersInRoom = selectedRoom ? (roomPresence[selectedRoom.id] || []) : [];
  const selectedRoomLiveCount = selectedRoom
    ? (selectedRoom.activeOnline + activeUsersInRoom.length)
    : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 opacity-40">
      <Icons.Sparkles className="w-16 h-16 animate-spin text-brand" />
      <span className="font-black uppercase tracking-[0.4em] text-sm animate-pulse text-slate-900">Establishing Cluster Sync...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 sm:py-20 relative min-h-screen">

      {selectedRoom ? (
        <div className="fixed inset-0 top-20 z-20 bg-slate-50 overflow-hidden flex flex-col lg:flex-row animate-in slide-in-from-right duration-500">

          {/* Room Sidebar */}
          <aside className="w-full lg:w-80 glass-card lg:m-6 lg:rounded-[3.5rem] p-6 lg:p-10 flex flex-col shadow-2xl border-b lg:border border-white/50 bg-white/60 shrink-0">
            <div className="flex justify-between items-start lg:block">
              <button onClick={() => setSelectedRoom(null)} className="flex items-center gap-2 text-slate-400 hover:text-brand font-black text-[10px] uppercase tracking-widest mb-4 lg:mb-12 transition-colors">
                <Icons.Plus className="rotate-45 w-4 h-4" /> Exit Cluster
              </button>

              <div className="mb-4 lg:mb-8 flex lg:block items-center gap-4">
                <div className={`w-12 h-12 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[2rem] ${selectedRoom.color} mb-0 lg:mb-6 shadow-2xl flex items-center justify-center text-white shrink-0`}><Icons.Logo className="w-6 h-6 lg:w-12 lg:h-12" /></div>
                <div>
                  <h2 className="text-xl lg:text-3xl font-black text-slate-900 uppercase leading-[0.85] mb-1 lg:mb-3 tracking-tighter truncate max-w-[200px] lg:max-w-none">{selectedRoom.name}</h2>
                  <div className="flex flex-col gap-1 lg:gap-2">
                    <div className="flex items-center gap-2 text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      <Icons.Users className="w-3 h-3 lg:w-4 lg:h-4" /> {selectedRoom.members} Scholars
                    </div>
                    <div className="flex items-center gap-2 text-[8px] lg:text-[10px] font-black text-brand uppercase tracking-[0.2em] animate-pulse">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-brand"></div>
                      {selectedRoomLiveCount} Active
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users List */}
            <div className="hidden lg:block mb-8 flex-1 overflow-y-auto min-h-[100px] max-h-[200px] custom-scrollbar pr-2 border-t border-slate-100 pt-4">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Present Scholars</h4>
              {activeUsersInRoom.length > 0 ? (
                <div className="space-y-3">
                  {activeUsersInRoom.map((user, idx) => (
                    <div key={`${user.user_id}-${idx}`} className="flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatar || 'https://i.pravatar.cc/150'} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white shadow-sm" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] font-bold text-slate-300 italic">Listening for peers...</p>
              )}
            </div>

            <nav className="space-y-2 lg:space-y-4 overflow-x-auto lg:overflow-visible flex lg:block pb-2 lg:pb-0 gap-2 lg:gap-0 no-scrollbar mt-auto">
              {(['Chat', 'Live Audio', 'Whiteboard', 'Resources', 'Calendar'] as RoomTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-none lg:w-full flex items-center gap-3 lg:gap-5 px-6 lg:px-8 py-3 lg:py-5 rounded-2xl lg:rounded-3xl text-left font-black text-[10px] lg:text-[11px] uppercase tracking-[0.2em] transition-all group ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <span className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${activeTab === tab ? 'bg-brand' : 'bg-slate-200 group-hover:bg-brand'} transition-colors hidden lg:block`}></span>
                  {tab}
                </button>
              ))}
            </nav>
          </aside>

          {/* Room Workspace */}
          <main className="flex-1 relative flex flex-col p-4 lg:p-12 overflow-hidden h-full">
            <div className="flex-1 bg-white/90 backdrop-blur-3xl rounded-[2.5rem] lg:rounded-[4.5rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative h-full">

              {/* RESOURCES: NotebookLM Textbook Mode */}
              {activeTab === 'Resources' && (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white relative">

                  {/* Page Edit Modal */}
                  {editingResource && (
                    <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 lg:p-10 animate-in fade-in duration-300">
                      <div className="bg-white rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-16 max-w-xl w-full shadow-[0_40px_100px_-10px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-300">
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Annotate Asset</h3>
                        <p className="text-slate-400 font-medium italic text-sm mb-12">"Refining the strategic summary for the cluster manual."</p>

                        <div className="space-y-8">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Manual Title</label>
                            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-base font-black text-slate-900 outline-none focus:ring-8 focus:ring-brand/5 focus:border-brand/40 transition-all uppercase tracking-tight" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Executive Summary</label>
                            <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] px-8 py-6 text-sm font-medium outline-none h-40 resize-none focus:ring-8 focus:ring-brand/5 focus:border-brand/40 transition-all leading-relaxed" placeholder="Describe the key strategic value of this drop..." />
                          </div>
                          <div className="flex gap-4 pt-6">
                            <button onClick={handleUpdateResource} className="flex-1 py-6 bg-brand text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand/20 active:scale-95 transition-all">Apply to Manual</button>
                            <button onClick={() => setEditingResource(null)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Discard</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Left: Textbook Hard Copy Spine/Index */}
                  <div className="w-full lg:w-[420px] border-b lg:border-b-0 lg:border-r border-slate-100 p-8 lg:p-12 overflow-y-auto no-scrollbar bg-slate-50/40 relative max-h-[30vh] lg:max-h-none">
                    <div className="absolute top-0 right-0 w-4 bottom-0 bg-gradient-to-l from-slate-200/40 to-transparent pointer-events-none"></div>

                    <div className="flex justify-between items-center mb-10">
                      <div>
                        <h4 className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-1">Index</h4>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Strategic Manual</h3>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 lg:p-4 rounded-2xl shadow-2xl transition-all ${isUploading ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-brand hover:scale-110 active:scale-95'}`}
                        disabled={isUploading}
                        title="Drop Resource"
                      >
                        {isUploading ? <Icons.CloudSync className="w-5 h-5 lg:w-6 lg:h-6 animate-spin text-slate-400" /> : <Icons.Plus className="w-5 h-5 lg:w-6 lg:h-6" />}
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    </div>

                    {isCompiling ? (
                      <div className="space-y-8 animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="space-y-3">
                            <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
                            <div className="h-3 bg-slate-100 rounded-full w-1/2 ml-4"></div>
                          </div>
                        ))}
                        <p className="text-[9px] font-black text-slate-300 text-center uppercase tracking-widest pt-10">AI Re-indexing Knowledge...</p>
                      </div>
                    ) : notebookStructure?.table_of_contents ? (
                      <div className="space-y-12 animate-in fade-in duration-500">
                        {(notebookStructure.table_of_contents.chapters || []).map((chap: any, idx: number) => (
                          <div key={idx} className="group/chap">
                            <div className="flex items-center gap-3 mb-6">
                              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{chap.title}</h4>
                            </div>
                            <div className="space-y-1 ml-11 border-l border-slate-100 pl-6">
                              {(chap.sections || []).map((sec: any, sIdx: number) => (
                                <button key={sIdx} className="w-full text-left py-3 text-[12px] font-bold text-slate-400 hover:text-brand transition-all flex items-center justify-between group/sec">
                                  <span className="truncate">{sec.title}</span>
                                  <span className="text-[9px] opacity-0 group-hover/sec:opacity-100 transition-opacity">→</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 lg:py-32 opacity-20 flex flex-col items-center gap-6 grayscale">
                        <Icons.BookOpen className="w-16 h-16 lg:w-20 lg:h-20" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em]">Empty Manual Spine</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Master Manual Content Canvas */}
                  <div className="flex-1 p-6 lg:p-16 overflow-y-auto no-scrollbar relative bg-white">
                    <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none hidden lg:block"></div>

                    <div className="max-w-4xl mx-auto pb-40">
                      <div className="mb-12 lg:mb-20 flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-slate-900 pb-12 gap-6">
                        <div>
                          <h4 className="text-[10px] lg:text-[12px] font-black text-brand uppercase tracking-[0.5em] mb-4">CMA US Unified Knowledge Base</h4>
                          <h2 className="text-4xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedRoom.name}</h2>
                          <p className="text-slate-400 font-bold text-xs lg:text-sm mt-4 uppercase tracking-widest italic opacity-70">Authenticated Cluster Registry</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">Neural Compiled</span>
                          <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">{notebookStructure?.last_compiled_at ? new Date(notebookStructure.last_compiled_at).toLocaleDateString() : 'Ready for Ingest'}</span>
                        </div>
                      </div>

                      {resources.length === 0 ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-[6px] border-dashed border-slate-50 rounded-[3rem] lg:rounded-[5rem] p-10 lg:p-40 flex flex-col items-center justify-center gap-10 cursor-pointer hover:border-brand/20 hover:bg-brand/[0.01] transition-all group"
                        >
                          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-slate-50 rounded-[2.5rem] lg:rounded-[3.5rem] group-hover:bg-brand group-hover:text-white transition-all flex items-center justify-center shadow-inner">
                            <Icons.Plus className="w-12 h-12 lg:w-16 lg:h-16" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">Initiate Manual</h3>
                            <p className="text-slate-400 font-medium italic text-sm lg:text-lg">"Drop PDFs, notes, or transcripts to seed the master index."</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-20 animate-in slide-in-from-bottom-8 duration-700">
                          <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.6em] mb-12 flex items-center gap-4">
                            <span className="flex-1 h-px bg-slate-900"></span>
                            Knowledge Vault Assets
                            <span className="flex-1 h-px bg-slate-900"></span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {resources.map(res => (
                              <div key={res.id} className="p-8 lg:p-12 bg-white rounded-[3rem] lg:rounded-[4rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_100px_rgba(255,26,26,0.1)] hover:border-brand/30 transition-all duration-700 group relative overflow-hidden flex flex-col">
                                <div className="flex items-center gap-5 mb-10">
                                  <div className="p-4 bg-slate-900 text-white rounded-3xl group-hover:bg-brand transition-all shadow-xl">
                                    <Icons.FileText className="w-8 h-8" />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1">{res.title}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.file_type} • {res.size}</span>
                                  </div>
                                </div>

                                <p className="text-sm text-slate-500 font-medium italic leading-relaxed mb-10 flex-1 border-l-4 border-slate-50 pl-6 py-2">
                                  "{res.summary || 'Strategic analysis pending... AI has categorized this drop in the master manual index.'}"
                                </p>

                                <div className="flex gap-3 pt-6 border-t border-slate-50">
                                  <button onClick={() => startEditing(res)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95">
                                    <Icons.Pencil className="w-4 h-4" /> Refine
                                  </button>
                                  <button onClick={() => handleDeleteResource(res.id)} className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-brand hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm">
                                    <Icons.Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* NotebookLM Footer / Aesthetic Pagination */}
                          <div className="pt-24 flex justify-center items-center gap-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] select-none">
                            <span>Folio 01</span>
                            <Icons.Logo className="w-8 h-8 opacity-20" />
                            <span>Authenticated</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CALENDAR TAB */}
              {activeTab === 'Calendar' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  <div className="p-8 lg:p-12 flex justify-between items-center border-b border-slate-100">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Study Schedule</h3>
                      <p className="text-slate-400 font-medium italic text-sm">Visualizing collective focus & strategic sessions.</p>
                    </div>
                    <button
                      onClick={() => setShowSessionModal(true)}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Icons.Plus className="w-4 h-4" /> Schedule Session
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                    {isSessionsLoading ? (
                      <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-40">
                        <Icons.CloudSync className="w-12 h-12 animate-spin text-brand" />
                        <span className="font-black uppercase tracking-widest text-xs">Syncing Calendar Data...</span>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-40 gap-8 grayscale opacity-20">
                        <Icons.Calendar className="w-32 h-32" />
                        <div className="text-center">
                          <h4 className="text-2xl font-black uppercase tracking-tighter">No Active Sessions</h4>
                          <p className="text-sm font-bold uppercase tracking-widest">Architect the first study sprint.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sessions.map(session => (
                          <div key={session.id} className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:border-brand/30 hover:bg-white hover:shadow-2xl transition-all duration-500 group relative flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                              <span className="px-3 py-1 bg-white text-slate-900 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">{session.session_type}</span>
                              <div className="text-right">
                                <div className="text-[10px] font-black text-slate-900">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase">{new Date(session.start_time).toLocaleDateString()}</div>
                              </div>
                            </div>

                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-brand transition-colors">{session.title}</h4>
                            <p className="text-xs text-slate-500 font-medium italic leading-relaxed mb-8 flex-1">"{session.description || 'No description provided.'}"</p>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <img src={session.author?.avatar || 'https://i.pravatar.cc/100'} className="w-6 h-6 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">@{session.author?.handle || 'host'}</span>
                              </div>
                              {session.meeting_link && (
                                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 text-white rounded-lg hover:bg-brand transition-all shadow-lg active:scale-90">
                                  <Icons.Plus className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Schedule Modal */}
                  {showSessionModal && (
                    <div className="absolute inset-0 z-[100] bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                      <div className="bg-white rounded-[4rem] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
                        <header className="mb-10 text-center">
                          <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Architect Session</h3>
                          <p className="text-slate-400 font-medium italic">"Synchronizing the cluster's collective momentum."</p>
                        </header>

                        <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Session Title</label>
                            <input
                              value={sessionForm.title}
                              onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-sm font-black text-slate-900 outline-none focus:border-brand transition-all"
                              placeholder="e.g. MCQ Drill: Internal Controls"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Start Time</label>
                              <input
                                type="datetime-local"
                                value={sessionForm.start_time}
                                onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-sm font-bold text-slate-900 outline-none focus:border-brand transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">End Time</label>
                              <input
                                type="datetime-local"
                                value={sessionForm.end_time}
                                onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-sm font-bold text-slate-900 outline-none focus:border-brand transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Session Type</label>
                            <select
                              value={sessionForm.session_type}
                              onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value as any })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-sm font-black text-slate-900 outline-none focus:border-brand transition-all"
                            >
                              <option value="STRATEGY">Strategic Planning</option>
                              <option value="DRILL">MCQ Drill</option>
                              <option value="MOCK_EXAM">Mock Exam Sync</option>
                              <option value="Q&A">Open Q&A</option>
                              <option value="GENERAL">General Discussion</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-4">Meeting Link (Optional)</label>
                            <input
                              value={sessionForm.meeting_link}
                              onChange={(e) => setSessionForm({ ...sessionForm, meeting_link: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-sm font-medium text-slate-900 outline-none focus:border-brand transition-all underline decoration-brand/20"
                              placeholder="GMeet, Zoom, or CoStudy Live Link"
                            />
                          </div>
                          <div className="flex gap-4 pt-6">
                            <button onClick={handleCreateSession} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Deploy Session</button>
                            <button onClick={() => setShowSessionModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Discard</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CHAT TAB */}
              {activeTab === 'Chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-6 lg:space-y-10 no-scrollbar">
                    {messages.map((m, i) => (
                      <div key={m.id || i} className={`flex items-start gap-3 lg:gap-5 ${m.user_id === userId ? 'flex-row-reverse' : ''}`}>
                        <img src={m.author?.avatar || 'https://i.pravatar.cc/100'} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl object-cover ring-4 ring-white shadow-xl" />
                        <div className={`max-w-[85%] lg:max-w-[75%] p-5 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] text-sm lg:text-[15px] font-medium leading-relaxed ${m.user_id === userId ? 'bg-brand text-white shadow-2xl shadow-brand/20' : 'bg-slate-50 text-slate-800 border border-slate-100 shadow-sm'}`}>
                          <div className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">{m.author?.name || 'Aspirant'}</div>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 lg:p-10 bg-slate-50/50 border-t border-slate-100">
                    <div className="relative max-w-4xl mx-auto">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="w-full bg-white border border-slate-200 rounded-[2rem] px-8 lg:px-10 py-5 lg:py-6 pr-20 lg:pr-24 text-sm lg:text-[15px] font-medium outline-none focus:ring-8 lg:focus:ring-[12px] focus:ring-brand/5 focus:border-brand/30 transition-all shadow-sm"
                        placeholder="Message the knowledge cluster..."
                      />
                      <button onClick={sendMessage} className="absolute right-3 lg:right-4 top-3 lg:top-4 bottom-3 lg:bottom-4 px-6 lg:px-8 bg-brand text-white rounded-2xl shadow-2xl shadow-brand/30 active:scale-90 transition-all flex items-center justify-center">
                        <Icons.Send className="w-5 h-5 lg:w-6 lg:h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE AUDIO TAB */}
              {activeTab === 'Live Audio' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 animate-in fade-in duration-500 text-center">
                  <div className={`w-48 h-48 lg:w-60 lg:h-60 rounded-full flex items-center justify-center transition-all duration-1000 ${isAiListening ? 'bg-brand/10 ring-[2rem] lg:ring-[4rem] ring-brand/5' : 'bg-slate-50 ring-0'}`}>
                    <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full flex items-center justify-center relative transition-all ${isAiListening ? 'bg-brand scale-110 shadow-[0_0_80px_rgba(255,26,26,0.5)]' : 'bg-white shadow-2xl'}`}>
                      {isAiListening && <div className="absolute inset-0 rounded-full border-[6px] border-white/30 animate-ping"></div>}
                      <Icons.Brain className={`w-16 h-16 lg:w-20 lg:h-20 ${isAiListening ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                  </div>
                  <h3 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter mt-12 lg:mt-16 mb-6 leading-none">Neural Facilitator</h3>
                  <p className="text-slate-500 font-medium max-w-lg italic mb-12 lg:mb-16 text-base lg:text-lg">"Strategic real-time interaction powered by the CoStudy Knowledge Vault."</p>
                  <button onClick={toggleAiAudio} className={`px-10 lg:px-16 py-5 lg:py-7 rounded-[3rem] font-black text-xs lg:text-sm uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center gap-2 ${isAiListening ? 'bg-slate-900 text-white' : 'bg-brand text-white shadow-brand/30'}`}>
                    {isAiListening ? <><Icons.Plus className="rotate-45 w-4 h-4 lg:w-5 lg:h-5" /> Disconnect AI</> : <><Icons.Sparkles className="w-4 h-4 lg:w-5 lg:h-5" /> Connect Neural Link</>}
                  </button>
                </div>
              )}

              {/* WHITEBOARD TAB */}
              {activeTab === 'Whiteboard' && (
                <div className="flex-1 flex flex-col bg-white overflow-hidden p-6 lg:p-10">
                  <div className="mb-6 lg:mb-8 flex justify-between items-center">
                    <div className="flex gap-2 lg:gap-4">
                      {['#0f172a', '#ff1a1a', '#3b82f6', '#10b981'].map(color => (
                        <button key={color} className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl shadow-xl border-[4px] border-white hover:scale-110 transition-transform active:scale-95" style={{ backgroundColor: color }}></button>
                      ))}
                    </div>
                    <button onClick={() => {
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }} className="px-6 lg:px-8 py-2 lg:py-3 bg-slate-100 text-slate-500 rounded-2xl text-[9px] lg:text-[11px] font-black uppercase tracking-widest hover:bg-brand/10 hover:text-brand transition-all">Reset Workspace</button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={1400}
                    height={1000}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      const canvas = canvasRef.current;
                      const rect = canvas?.getBoundingClientRect();
                      if (canvas && rect) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.beginPath();
                          ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                          setIsDrawing(true);
                        }
                      }
                    }}
                    onTouchMove={(e) => {
                      if (!isDrawing) return;
                      e.preventDefault();
                      const touch = e.touches[0];
                      const canvas = canvasRef.current;
                      const rect = canvas?.getBoundingClientRect();
                      if (canvas && rect) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                          ctx.stroke();
                        }
                      }
                    }}
                    onTouchEnd={stopDrawing}
                    className="flex-1 bg-slate-50/50 rounded-[2.5rem] lg:rounded-[4rem] cursor-crosshair border-2 border-slate-50 shadow-inner w-full"
                  />
                </div>
              )}

            </div>
          </main>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <header className="mb-12 text-center relative">
            <h2 className="text-5xl sm:text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter mb-6 uppercase scale-y-110">CMA Clusters</h2>
            <p className="text-lg sm:text-2xl text-slate-500 font-medium max-w-2xl mx-auto italic opacity-60">"Collaborative strategy for elite certification aspirants."</p>
          </header>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-20 relative z-20">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active clusters..."
                className="w-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] px-8 sm:px-10 py-5 sm:py-6 pl-12 sm:pl-16 text-base sm:text-lg font-bold text-slate-900 shadow-xl outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/30 transition-all placeholder:text-slate-400"
              />
              <Icons.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-focus-within:text-brand transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {filteredRooms.map(room => (
              <div key={room.id} onClick={() => setSelectedRoom(room)} className="bg-white border border-slate-200 p-10 lg:p-14 rounded-[3rem] lg:rounded-[5rem] shadow-xl hover:-translate-y-3 transition-all duration-500 cursor-pointer group hover:shadow-2xl hover:border-brand/30">
                <div className="flex justify-between items-start mb-10">
                  <span className="text-[9px] lg:text-[11px] font-black text-brand uppercase tracking-[0.4em] bg-brand/5 px-4 lg:px-6 py-2 rounded-full">{room.category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{room.activeOnline + (roomPresence[room.id]?.length || 0)} Online</span>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-6 uppercase leading-[0.85] group-hover:text-brand transition-colors">{room.name}</h3>
                <p className="text-slate-500 font-medium text-lg lg:text-xl leading-relaxed italic opacity-80">"{room.description}"</p>
                <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex -space-x-3">
                    {/* Display real active users if available, otherwise static placeholders */}
                    {(roomPresence[room.id]?.slice(0, 4) || []).map((u, i) => (
                      <img key={`${u.user_id}-${i}`} src={u.avatar || `https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-[4px] border-white shadow-xl object-cover" title={u.name} />
                    ))}
                    {(!roomPresence[room.id] || roomPresence[room.id].length === 0) && [1, 2, 3].map(i => <div key={i} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-[4px] border-white shadow-xl bg-slate-100"></div>)}
                  </div>
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-900 text-white rounded-[1.5rem] group-hover:bg-brand group-hover:scale-110 transition-all flex items-center justify-center shadow-xl">
                    <Icons.Plus className="w-6 h-6 lg:w-8 lg:h-8" />
                  </div>
                </div>
              </div>
            ))}

            {filteredRooms.length === 0 && (
              <div className="col-span-full text-center py-20 opacity-50">
                <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No clusters found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
