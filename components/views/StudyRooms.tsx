import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { StudyRoom, User, RoomMessage, RoomMember, RoomMission } from '../../types';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { supabase } from '../../services/supabaseClient';

interface StudyRoomsProps {
  userId?: string;
}

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userId }) => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);

  // Create Room Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    topic: 'CMA US Part 1',
    room_type: 'OPEN' as 'OPEN' | 'PRIVATE' | 'MENTOR_LED',
    max_members: 10,
    pomodoro_duration: 25
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (userId) {
        const user = await getUserProfile(userId);
        setCurrentUser(user);
      }
      const data = await costudyService.getRooms();
      setRooms(data);
      setLoading(false);
    };
    init();
  }, [userId]);

  const handleCreateRoom = async () => {
    if (!newRoomData.name.trim() || !userId) return;
    try {
      const room = await costudyService.createRoom({
        ...newRoomData,
        created_by: userId,
        is_active: true,
        pomodoro_status: 'READY'
      });
      setRooms([room, ...rooms]);
      setShowCreateModal(false);
      navigate(`/rooms/${room.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create room.');
    }
  };

  const joinRoom = async (targetRoomId: string) => {
    if (!userId) return;
    try {
      await costudyService.joinRoom(targetRoomId, userId);
      navigate(`/rooms/${targetRoomId}`);
    } catch (e) {
      console.error("Error joining room", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-slate-50">
        <Icons.Sparkles className="w-12 h-12 text-brand animate-spin" />
        <span className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400">Loading Cluster Data...</span>
      </div>
    );
  }

  if (roomId) {
    return (
      <StudyRoomDetail
        roomId={roomId}
        userId={userId}
        currentUser={currentUser}
        onLeave={() => navigate('/rooms')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b-2 border-slate-200 pb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2">Study Clusters</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Collaborative Mission Control</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-lg shadow-xl hover:-translate-y-1 hover:bg-brand transition-all active:scale-95 text-xs font-black uppercase tracking-widest"
          >
            <Icons.Plus className="w-4 h-4" /> Create Cluster
          </button>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {rooms.map(room => (
            <div key={room.id} className={`bg-white rounded-xl p-6 border-l-[4px] shadow-sm premium-card-hover flex flex-col ${room.room_type === 'OPEN' ? 'border-l-red-500' :
              room.room_type === 'PRIVATE' ? 'border-l-indigo-500' : 'border-l-emerald-500'
              }`}>
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${room.room_type === 'OPEN' ? 'bg-red-50 text-red-600' :
                  room.room_type === 'PRIVATE' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                  {room.room_type.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Icons.Users className="w-3 h-3" /> {room.members_count || 0} / {room.max_members}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2 truncate">{room.name}</h3>
              <p className="text-sm font-bold text-slate-400 capitalize mb-6">{room.topic || 'General Topic'}</p>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-glow"></span> LIVE
                  </span>
                  {room.pomodoro_status === 'FOCUS' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full">
                      <Icons.Clock className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-wider">In Focus</span>
                    </div>
                  )}
                  {room.pomodoro_status === 'BREAK' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      <Icons.Clock className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-wider">On Break</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => joinRoom(room.id)}
                  className="px-6 py-3 bg-slate-50 text-slate-900 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                >
                  Join Room
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-8">New Cluster</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Cluster Name</label>
                <input
                  value={newRoomData.name}
                  onChange={e => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Focus Sprint: Variances"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Type</label>
                  <select
                    value={newRoomData.room_type}
                    onChange={e => setNewRoomData({ ...newRoomData, room_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-brand"
                  >
                    <option value="OPEN">Open (Public)</option>
                    <option value="PRIVATE">Private</option>
                    <option value="MENTOR_LED">Mentor-Led</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Capacity</label>
                  <input
                    type="number"
                    value={newRoomData.max_members}
                    onChange={e => setNewRoomData({ ...newRoomData, max_members: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Focus Topic</label>
                <select
                  value={newRoomData.topic}
                  onChange={e => setNewRoomData({ ...newRoomData, topic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-brand"
                >
                  <optgroup label="CMA Part 1">
                    <option value="Budgeting">Budgeting</option>
                    <option value="Cost Behavior">Cost Behavior</option>
                    <option value="Variance Analysis">Variance Analysis</option>
                  </optgroup>
                  <optgroup label="CMA Part 2">
                    <option value="Financial Statement Analysis">Financial Statement Analysis</option>
                    <option value="Corporate Finance">Corporate Finance</option>
                  </optgroup>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand transition-all active:scale-95 px-4"
                >
                  Deploy
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// STUDY ROOM DETAIL VIEW (Nested Component)
// ==========================================
const StudyRoomDetail: React.FC<{
  roomId: string;
  userId?: string;
  currentUser: User | null;
  onLeave: () => void;
}> = ({ roomId, userId, currentUser, onLeave }) => {
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [activeMembers, setActiveMembers] = useState<any[]>([]); // Presences
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [missions, setMissions] = useState<RoomMission[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [missionInput, setMissionInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStatus, setTimerStatus] = useState<'READY' | 'FOCUS' | 'BREAK'>('READY');
  const [totalTime, setTotalTime] = useState(0);

  // 1. Fetch Room Data
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const [rData, mData, msgData] = await Promise.all([
          costudyService.getRoomById(roomId),
          costudyService.getRoomMissions(roomId),
          supabase.from('study_room_messages').select('*, author:user_profiles(*)').eq('room_id', roomId).order('created_at', { ascending: true })
        ]);
        setRoom(rData);
        setMissions(mData);
        setMessages(msgData.data || []);

        syncTimerWithState(rData);
      } catch (e) {
        console.error("Room load error", e);
      }
    };
    loadRoom();
  }, [roomId]);

  // 2. Realtime Subscriptions
  useEffect(() => {
    // Database Subscriptions
    const dbSub = costudyService.subscribeToRoom(roomId, async (payload) => {
      if (payload.table === 'study_rooms' && payload.eventType === 'UPDATE') {
        setRoom(payload.new as StudyRoom);
        syncTimerWithState(payload.new);
      } else if (payload.table === 'room_missions') {
        if (payload.eventType === 'INSERT') {
          const { data: profile } = await supabase.from('user_profiles').select('name').eq('id', payload.new.completed_by || payload.new.created_by).single();
          setMissions(prev => [...prev, { ...payload.new as RoomMission, profile }]);
        } else if (payload.eventType === 'UPDATE') {
          const { data: profile } = payload.new.completed_by ? await supabase.from('user_profiles').select('name').eq('id', payload.new.completed_by).single() : { data: null };
          setMissions(prev => prev.map(m => m.id === payload.new.id ? { ...payload.new as RoomMission, profile } : m));
        }
      } else if (payload.table === 'study_room_messages' && payload.eventType === 'INSERT') {
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', payload.new.user_id).single();
        setMessages(prev => [...prev, { ...payload.new as RoomMessage, author: profile }]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Presence Subscriptions
    const presChannel = supabase.channel(`presence:${roomId}`);
    presChannel.on('presence', { event: 'sync' }, () => {
      const state = presChannel.presenceState();
      const users: any[] = [];
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (!users.find(u => u.user_id === p.user_id)) users.push(p);
        });
      });
      setActiveMembers(users);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && userId) {
        await presChannel.track({
          user_id: userId,
          name: currentUser?.name || 'Aspirant',
          avatar: currentUser?.avatar || 'https://i.pravatar.cc/150',
          online_at: new Date().toISOString()
        });
      }
    });

    return () => {
      dbSub?.unsubscribe();
      supabase.removeChannel(presChannel);
    };
  }, [roomId, userId, currentUser]);

  // Timer Countdown Logic
  const syncTimerWithState = (roomData: StudyRoom) => {
    setTimerStatus(roomData.pomodoro_status);
    if (roomData.pomodoro_status === 'READY') {
      setTimeLeft(roomData.pomodoro_duration * 60);
      setTotalTime(roomData.pomodoro_duration * 60);
    } else if (roomData.pomodoro_end_time) {
      const end = new Date(roomData.pomodoro_end_time).getTime();
      const now = new Date().getTime();
      const secLeft = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(secLeft);
      // Determine total time based on state to normalize progress bar
      if (roomData.pomodoro_status === 'FOCUS') setTotalTime(roomData.pomodoro_duration * 60);
      if (roomData.pomodoro_status === 'BREAK') setTotalTime(5 * 60); // 5 min break
    }
  };

  useEffect(() => {
    if (timerStatus === 'READY' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-transition Logic (Handled manually by creator for sync reliability)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStatus, timeLeft]);

  // Actions
  const handleStartTimer = async (mode: 'FOCUS' | 'BREAK') => {
    if (!room) return;
    const durMins = mode === 'FOCUS' ? room.pomodoro_duration : 5;
    const endTime = new Date(Date.now() + durMins * 60000).toISOString();
    await costudyService.updateRoomTimerStatus(roomId, mode, endTime);
  };

  const handleResetTimer = async () => {
    await costudyService.updateRoomTimerStatus(roomId, 'READY', null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !userId) return;
    const msg = chatInput;
    setChatInput('');
    await supabase.from('study_room_messages').insert([{
      room_id: roomId,
      user_id: userId,
      content: msg,
      type: 'text'
    }]);
  };

  const truncateString = (str: string, num: number) => str.length > num ? str.slice(0, num) + '...' : str;

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionInput.trim() || !userId) return;
    await costudyService.createRoomMission(roomId, missionInput);
    setMissionInput('');
  };

  const toggleMission = async (m: RoomMission) => {
    if (!userId) return;
    await costudyService.toggleRoomMission(m.id, !m.is_completed, userId);
  };

  if (!room) return null;

  const isCreator = room.created_by === userId;
  const timerFormat = `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;
  const timerProgress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div className="min-h-screen bg-brand-deep text-slate-100 flex flex-col font-sans overflow-hidden fixed inset-0 z-50 animate-in fade-in duration-300">
      {/* Header */}
      <header className="px-6 sm:px-12 py-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-950/50">
        <div className="flex items-center gap-6">
          <button
            onClick={onLeave}
            className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white px-4 py-2"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black uppercase tracking-tight truncate max-w-sm">{room.name}</h1>
              <span className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> LIVE
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{room.topic}</p>
          </div>
        </div>

        {/* Presence Avatars */}
        <div className="flex items-center gap-3 shrink-0 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          <div className="flex -space-x-3">
            {activeMembers.map(m => (
              <img key={m.user_id} src={m.avatar} title={m.name} className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover" />
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{activeMembers.length} Active</span>
        </div>
      </header>

      {/* Main Mission Control Wrapper */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-brand/5 blur-[120px] pointer-events-none"></div>

        {/* Center/Left: Timer & Missions */}
        <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto custom-scrollbar lg:border-r border-white/10 relative z-10">

          {/* Synchronized Pomodoro Centerpiece */}
          <div className="flex flex-col items-center justify-center py-10 lg:py-20 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className={`text-xs font-black uppercase tracking-[0.5em] mb-8 transition-colors duration-500 ${timerStatus === 'FOCUS' ? 'text-brand' :
              timerStatus === 'BREAK' ? 'text-yellow-400' : 'text-slate-500'
              }`}>
              {timerStatus === 'FOCUS' ? 'Deep Focus Session' : timerStatus === 'BREAK' ? 'Mandatory Break' : 'Awaiting Mission Start'}
            </h3>

            <div className="text-[6rem] sm:text-[9rem] lg:text-[12rem] font-black font-mono leading-none tracking-tighter text-white tabular-nums drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              {timerFormat}
            </div>

            <div className="w-full max-w-lg mt-12 bg-white/5 h-2 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(255,255,255,0.5)] ${timerStatus === 'BREAK' ? 'bg-yellow-400 shadow-yellow-400' : 'bg-brand shadow-brand'}`}
                style={{ width: `${timerProgress}%` }}
              ></div>
            </div>

            {/* Creator Controls */}
            {isCreator && (
              <div className="mt-12 flex gap-4">
                {timerStatus === 'READY' ? (
                  <button onClick={() => handleStartTimer('FOCUS')} className="px-8 py-4 bg-white text-slate-900 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl hover:bg-brand hover:text-white transition-all active:scale-95">Initiate Focus</button>
                ) : (
                  <>
                    {timerStatus === 'FOCUS' && <button onClick={() => handleStartTimer('BREAK')} className="px-8 py-4 bg-yellow-400 text-slate-900 rounded-lg text-xs font-black uppercase tracking-widest shadow-xl hover:bg-yellow-300 transition-all active:scale-95">Start Break</button>}
                    {timerStatus === 'BREAK' && <button onClick={() => handleStartTimer('FOCUS')} className="px-8 py-4 bg-brand text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-xl hover:bg-brand/80 transition-all active:scale-95">Resume Focus</button>}
                    <button onClick={handleResetTimer} className="p-4 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-all active:scale-95 px-4 py-2"><Icons.RefreshCw className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mission Board */}
          <div className="mt-8 lg:mt-auto bg-white/5 border border-white/10 rounded-xl p-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-3">
              <Icons.Target className="w-4 h-4" /> Mission Objectives
            </h4>

            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto no-scrollbar">
              {missions.length === 0 ? (
                <p className="text-xs text-slate-600 font-bold italic">No targets locked for this session.</p>
              ) : missions.map(mission => (
                <div key={mission.id} onClick={() => toggleMission(mission)} className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${mission.is_completed ? 'bg-brand/10 border-brand/20 opacity-60' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${mission.is_completed ? 'bg-brand border-brand' : 'border-slate-500'}`}>
                    {mission.is_completed && <Icons.Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${mission.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{mission.task_text}</p>
                    {mission.is_completed && mission.completed_by && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand mt-1 block">Checked off by {mission.profile?.name || 'an aspirant'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isCreator && (
              <form onSubmit={handleAddMission} className="flex gap-2 relative">
                <input
                  value={missionInput}
                  onChange={e => setMissionInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg pl-6 pr-14 py-4 text-sm font-medium text-white outline-none /50 transition-colors placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Lock in a new objective..."
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-white text-slate-900 rounded-lg hover:bg-brand hover:text-white transition-colors px-4 py-2">
                  <Icons.Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right: Live Comms (Chat) */}
        <aside className="w-full lg:w-[400px] flex flex-col bg-slate-950/50 relative z-10 border-t lg:border-t-0 border-white/10 shrink-0">
          <div className="p-6 border-b border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
              <Icons.MessageSquare className="w-4 h-4" /> Live Comms
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-slate-600 font-bold italic uppercase tracking-widest">Comm channel open.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.user_id === userId;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">{msg.author?.name}</span>}
                    <div className={`px-5 py-3 rounded-xl text-sm leading-relaxed ${isMe ? 'bg-brand text-white rounded-br-sm' : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/5'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-slate-900">
            <div className="relative">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-6 pr-16 py-4 text-sm font-medium text-white outline-none /50 transition-colors placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Transmit message..."
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-brand text-white rounded-lg hover:bg-brand/80 transition-colors px-4 py-2">
                <Icons.Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </aside>

      </main>
    </div>
  );
};
