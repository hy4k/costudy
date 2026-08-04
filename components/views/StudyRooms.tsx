import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from '../Icons';
import { StudyRoom, User, RoomMessage, RoomResource, MentorInvitation } from '../../types';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { supabase } from '../../services/supabaseClient';
import { generateStudyContent, getMapsGroundedResponse } from '../../services/geminiService';
import Markdown from 'react-markdown';

type RoomTab = 'Chat' | 'Live Audio' | 'Whiteboard' | 'Resources' | 'Schedule' | 'Faculty Hive' | 'Study Spots' | 'Settings';

interface StudyRoomsProps {
  userId?: string;
}

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userId }) => {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [activeTab, setActiveTab] = useState<RoomTab>('Chat');
  
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});
  
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [notebookStructure, setNotebookStructure] = useState<any>(null);

  // -- NEW: Faculty Hiring State --
  const [availableMentors, setAvailableMentors] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [isHiring, setIsHiring] = useState(false);
  const [hireFee, setHireFee] = useState(2500);

  const [editingResource, setEditingResource] = useState<RoomResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    duration: '60',
    type: 'PEER_STUDY' as any
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAiListening, setIsAiListening] = useState(false);
  const sessionRef = useRef<any>(null);

  const [spotsQuery, setSpotsQuery] = useState('');
  const [spotsResult, setSpotsResult] = useState<{text: string, places: any[]}>({ text: '', places: [] });
  const [isSearchingSpots, setIsSearchingSpots] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // -- NEW: Room Settings Persistence --
  const [roomSettings, setRoomSettings] = useState<Record<string, Partial<StudyRoom>>>({});

  useEffect(() => {
    const saved = localStorage.getItem('costudy_room_settings');
    if (saved) {
      try {
        setRoomSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse room settings", e);
      }
    }
  }, []);

  const saveRoomSettings = (roomId: string, settings: Partial<StudyRoom>) => {
    const newSettings = { ...roomSettings, [roomId]: { ...roomSettings[roomId], ...settings } };
    setRoomSettings(newSettings);
    localStorage.setItem('costudy_room_settings', JSON.stringify(newSettings));
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !userId || !selectedRoom) return;
    const { error } = await supabase.from('study_room_messages').insert([{
      room_id: selectedRoom.id,
      user_id: userId,
      content: chatInput,
      type: 'text'
    }]);
    if (!error) setChatInput('');
  };

  const handleFindSpots = async () => {
    if (!spotsQuery.trim()) return;
    setIsSearchingSpots(true);
    try {
      const result = await getMapsGroundedResponse(`Find good study spots or libraries near: ${spotsQuery}`);
      setSpotsResult(result);
    } catch (error) {
      console.error("Spots Error", error);
    } finally {
      setIsSearchingSpots(false);
    }
  };

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

  useEffect(() => {
      if (selectedRoom && activeTab === 'Faculty Hive') {
          const fetchMentorsAndInvs = async () => {
              const { data: mentors } = await supabase.from('user_profiles').select('*').eq('role', 'TEACHER');
              if (mentors) setAvailableMentors(mentors as any);

              const { data: invs } = await supabase
                .from('mentor_invitations')
                .select('*, mentor:user_profiles(*)')
                .eq('room_id', selectedRoom.id);
              if (invs) setInvitations(invs as any);
          };
          fetchMentorsAndInvs();
      }
  }, [selectedRoom, activeTab]);

  const handleInviteMentor = async (mentor: User) => {
      if (!userId || !selectedRoom) return;
      setIsHiring(true);
      
      const { error } = await supabase.from('mentor_invitations').insert([{
          room_id: selectedRoom.id,
          mentor_id: mentor.id,
          inviter_id: userId,
          agreed_fee: hireFee,
          costudy_fee: Math.round(hireFee * 0.15), 
          status: 'PENDING'
      }]);

      if (!error) {
          alert(`Strategic Invitation dispatched to ${mentor.name}. Upon acceptance, cluster members can contribute to the session fee.`);
          const { data } = await supabase
                .from('mentor_invitations')
                .select('*, mentor:user_profiles(*)')
                .eq('room_id', selectedRoom.id);
          if (data) setInvitations(data as any);
      }
      setIsHiring(false);
  };

  useEffect(() => {
    const channel = supabase.channel('room_presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const counts: Record<string, number> = {};
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.roomId) counts[p.roomId] = (counts[p.roomId] || 0) + 1;
          });
        });
        setPresenceCounts(counts);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId || 'anon-' + Math.floor(Math.random() * 1000),
            online_at: new Date().toISOString(),
            roomId: null
          });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    const channel = supabase.getChannels().find(c => c.topic === 'room_presence');
    if (channel) {
      channel.track({
        user_id: userId || 'anon-' + Math.floor(Math.random() * 1000),
        online_at: new Date().toISOString(),
        roomId: selectedRoom?.id || null
      });
    }
  }, [selectedRoom, userId]);

  const liveRooms = useMemo(() => {
    return rooms.map(room => {
        const settings = roomSettings[room.id] || {};
        return {
            ...room,
            name: settings.name || room.name,
            color: settings.color || room.color,
            targetTopics: settings.targetTopics || room.targetTopics,
            activeOnline: room.activeOnline + (presenceCounts[room.id] || 0)
        };
    });
  }, [rooms, presenceCounts, roomSettings]);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return liveRooms;
    const q = searchQuery.toLowerCase();
    return liveRooms.filter(room => 
      room.name.toLowerCase().includes(q) || 
      room.category.toLowerCase().includes(q) ||
      room.targetTopics?.some(t => t.toLowerCase().includes(q))
    );
  }, [liveRooms, searchQuery]);

  const selectedRoomLiveCount = selectedRoom 
    ? (selectedRoom.activeOnline + (presenceCounts[selectedRoom.id] || 0))
    : 0;

  const currentRoom = useMemo(() => {
    if (!selectedRoom) return null;
    return liveRooms.find(r => r.id === selectedRoom.id) || selectedRoom;
  }, [selectedRoom, liveRooms]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 opacity-40">
       <Icons.Sparkles className="w-16 h-16 animate-spin text-brand" />
       <span className="font-black uppercase tracking-[0.4em] text-sm animate-pulse text-slate-900">Establishing Cluster Sync...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 sm:py-20 relative min-h-screen">
      
      {currentRoom ? (
        <div className="fixed inset-0 top-20 z-20 bg-slate-50 overflow-hidden flex flex-col lg:flex-row animate-in slide-in-from-right duration-500">
          
          <aside className="w-full lg:w-80 glass-card lg:m-6 lg:rounded-[3.5rem] p-6 lg:p-10 flex flex-col shadow-2xl border-b lg:border border-white/50 bg-white/60 shrink-0">
            <div className="flex justify-between items-start lg:block">
              <button onClick={() => setSelectedRoom(null)} className="flex items-center gap-2 text-slate-400 hover:text-brand font-black text-[10px] uppercase tracking-widest mb-4 lg:mb-12 transition-colors">
                <Icons.Plus className="rotate-45 w-4 h-4" /> Exit Cluster
              </button>
              
              <div className="mb-4 lg:mb-12 flex lg:block items-center gap-4">
                <div className={`w-12 h-12 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[2rem] ${currentRoom.color} mb-0 lg:mb-6 shadow-2xl flex items-center justify-center text-white shrink-0`}><Icons.Logo className="w-6 h-6 lg:w-12 lg:h-12" /></div>
                <div>
                   <h2 className="text-xl lg:text-3xl font-black text-slate-900 uppercase leading-[0.85] mb-1 lg:mb-3 tracking-tighter truncate max-w-[200px] lg:max-w-none">{currentRoom.name}</h2>
                   <div className="flex flex-col gap-1 lg:gap-2">
                      <div className="flex items-center gap-2 text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                          <Icons.Users className="w-3 h-3 lg:w-4 lg:h-4" /> {currentRoom.members} Scholars
                      </div>
                      <div className="flex items-center gap-2 text-[8px] lg:text-[10px] font-black text-brand uppercase tracking-[0.2em] animate-pulse">
                          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-brand"></div>
                          {selectedRoomLiveCount} Active
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-2 lg:space-y-4 overflow-x-auto lg:overflow-visible flex lg:block pb-2 lg:pb-0 gap-2 lg:gap-0 no-scrollbar">
              {(['Chat', 'Live Audio', 'Whiteboard', 'Resources', 'Schedule', 'Faculty Hive', 'Study Spots', 'Settings'] as RoomTab[]).map(tab => (
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

          <main className="flex-1 relative flex flex-col p-4 lg:p-12 overflow-hidden h-full">
             <div className="flex-1 bg-white/90 backdrop-blur-3xl rounded-[2.5rem] lg:rounded-[4.5rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative h-full">
                
                {activeTab === 'Faculty Hive' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-16 overflow-y-auto no-scrollbar bg-white">
                      <div className="mb-16">
                        <h4 className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Strategic Mentorship</h4>
                        <h2 className="text-4xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">The Faculty Hive</h2>
                        <p className="text-slate-400 font-medium italic text-lg max-w-2xl">"Enlist a registered CMA specialist to lead your cluster session. Split the fees among members for professional-grade mastery."</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                          <div className="lg:col-span-2">
                             <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] mb-8 flex items-center gap-4">
                                <Icons.GraduationCap className="w-5 h-5" /> Registered Specialists
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableMentors.map(mentor => (
                                    <div key={mentor.id} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all group">
                                        <div className="flex items-center gap-4 mb-8">
                                            <img src={mentor.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover" />
                                            <div>
                                                <div className="text-lg font-black text-slate-900 uppercase tracking-tight">{mentor.name}</div>
                                                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Verified Faculty</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {mentor.specialties?.map(s => <span key={s} className="px-3 py-1 bg-white text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200">{s}</span>)}
                                        </div>
                                        <div className="flex justify-between items-center mb-6 pt-6 border-t border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Hourly Session</span>
                                            <span className="text-xl font-black text-slate-900">₹{mentor.hourlyRate || '2500'}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleInviteMentor(mentor)}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                                        >
                                            Enlist for Session
                                        </button>
                                    </div>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-10">
                             <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Icons.DollarSign className="w-24 h-24 text-emerald-400" /></div>
                                <h3 className="text-xl font-black uppercase tracking-widest mb-8 relative z-10">Cluster Ledger</h3>
                                <div className="space-y-6 relative z-10">
                                   {invitations.length === 0 ? (
                                       <div className="text-center py-10 opacity-30">
                                           <p className="text-xs font-bold uppercase tracking-widest italic">No pending enlistments</p>
                                       </div>
                                   ) : invitations.map(inv => (
                                       <div key={inv.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                           <div className="flex justify-between items-start mb-2">
                                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${inv.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-slate-700'}`}>{inv.status}</span>
                                               <span className="text-[10px] font-black text-emerald-400">₹{inv.agreed_fee}</span>
                                           </div>
                                           <div className="text-sm font-black uppercase tracking-tight text-white mb-2">{inv.mentor?.name}</div>
                                           {inv.status === 'ACCEPTED' && (
                                               <button className="w-full py-2 bg-brand text-white rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 hover:bg-emerald-600 transition-all">Contribute Fee</button>
                                           )}
                                       </div>
                                   ))}
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                    * Fees are shared. CoStudy retains 15% for secure vault facilitation.
                                </div>
                             </div>

                             <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[3rem] flex flex-col items-center text-center">
                                <Icons.CheckBadge className="w-12 h-12 text-emerald-600 mb-6" />
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Faculty Guarantee</h4>
                                <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                                    "All faculty members on the Hive are manually verified CMA professionals. Your cluster's investment is protected until the session concludes."
                                </p>
                             </div>
                          </div>
                      </div>
                  </div>
                )}

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

                {activeTab === 'Study Spots' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-16 overflow-y-auto no-scrollbar bg-white">
                    <div className="mb-12">
                      <h4 className="text-brand font-black text-[10px] uppercase tracking-[0.4em] mb-4">Physical Grounding</h4>
                      <h2 className="text-4xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Study Spots</h2>
                      <p className="text-slate-400 font-medium italic text-lg max-w-2xl">"Find the best local libraries, cafes, and quiet zones to sync with your cluster in person."</p>
                    </div>

                    <div className="max-w-3xl mb-12">
                      <div className="relative">
                        <input 
                          value={spotsQuery}
                          onChange={(e) => setSpotsQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleFindSpots()}
                          placeholder="Enter city or area (e.g., Bangalore, HSR Layout)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 pr-20 text-lg font-bold text-slate-900 shadow-inner outline-none focus:ring-8 focus:ring-brand/5 focus:border-brand/30 transition-all"
                        />
                        <button 
                          onClick={handleFindSpots}
                          disabled={isSearchingSpots}
                          className="absolute right-3 top-3 bottom-3 px-8 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-brand transition-all disabled:opacity-50"
                        >
                          {isSearchingSpots ? <Icons.CloudSync className="w-6 h-6 animate-spin" /> : <Icons.Search className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>

                    {spotsResult.text && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 prose prose-slate max-w-none">
                          <Markdown>{spotsResult.text}</Markdown>
                        </div>
                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-6">Verified Locations</h3>
                          {spotsResult.places.map((place: any, idx: number) => (
                            <a 
                              key={idx}
                              href={place.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-6 bg-white border border-slate-200 rounded-3xl hover:border-brand/30 hover:shadow-xl transition-all group"
                            >
                              <div className="flex justify-between items-center">
                                <div className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-brand transition-colors">{place.title || 'Study Spot'}</div>
                                <Icons.ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-brand" />
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">View on Google Maps</div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Settings' && selectedRoom && (
                  <div className="flex-1 flex flex-col p-6 lg:p-16 overflow-y-auto no-scrollbar bg-white">
                    <div className="mb-12">
                      <h4 className="text-brand font-black text-[10px] uppercase tracking-[0.4em] mb-4">Cluster Management</h4>
                      <h2 className="text-4xl lg:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Room Settings</h2>
                      <p className="text-slate-400 font-medium italic text-lg max-w-2xl">"Customize your cluster's identity and focus. These settings are persisted locally for your session."</p>
                    </div>

                    <div className="max-w-3xl space-y-12">
                      <section>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Cluster Name</label>
                        <input 
                          type="text"
                          value={roomSettings[selectedRoom.id]?.name || selectedRoom.name}
                          onChange={(e) => saveRoomSettings(selectedRoom.id, { name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4 text-lg font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/30 transition-all"
                        />
                      </section>

                      <section>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Color Theme</label>
                        <div className="flex flex-wrap gap-4">
                          {['bg-brand', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-slate-900'].map(color => (
                            <button 
                              key={color}
                              onClick={() => saveRoomSettings(selectedRoom.id, { color })}
                              className={`w-12 h-12 rounded-xl ${color} transition-all ${ (roomSettings[selectedRoom.id]?.color || selectedRoom.color) === color ? 'ring-4 ring-offset-2 ring-brand scale-110' : 'opacity-60 hover:opacity-100'}`}
                            />
                          ))}
                        </div>
                      </section>

                      <section>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Target Topics</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(roomSettings[selectedRoom.id]?.targetTopics || selectedRoom.targetTopics).map((topic, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest group">
                              {topic}
                              <button 
                                onClick={() => {
                                  const current = roomSettings[selectedRoom.id]?.targetTopics || selectedRoom.targetTopics;
                                  saveRoomSettings(selectedRoom.id, { targetTopics: current.filter((_, idx) => idx !== i) });
                                }}
                                className="hover:text-rose-500 transition-colors"
                              >
                                <Icons.Plus className="rotate-45 w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Add new topic..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  const current = roomSettings[selectedRoom.id]?.targetTopics || selectedRoom.targetTopics;
                                  saveRoomSettings(selectedRoom.id, { targetTopics: [...current, val] });
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand/5 transition-all"
                          />
                        </div>
                      </section>

                      <div className="p-8 bg-brand/5 border border-brand/10 rounded-[3rem] flex items-center gap-6">
                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                          <Icons.CloudSync className="w-8 h-8 text-brand" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Local Persistence Active</h4>
                          <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                            "Your customizations are saved to your browser's local storage. They will persist even if you refresh the page."
                          </p>
                        </div>
                      </div>
                    </div>
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
                       <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{room.activeOnline} Online</span>
                    </div>
                  </div>
                  <h3 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-6 uppercase leading-[0.85] group-hover:text-brand transition-colors">{room.name}</h3>
                  <p className="text-slate-500 font-medium text-lg lg:text-xl leading-relaxed italic opacity-80">"{room.description}"</p>
                  <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-center">
                     <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i}-${room.id}`} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-[4px] border-white shadow-xl" />)}
                     </div>
                     <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-900 text-white rounded-[1.5rem] group-hover:bg-brand group-hover:scale-110 transition-all flex items-center justify-center shadow-xl">
                        <Icons.Plus className="w-6 h-6 lg:w-8 lg:h-8" />
                     </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};