import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from '../Icons';
import { StudyRoom, User, RoomMessage, RoomResource, MentorInvitation, ClusterMember } from '../../types';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { supabase } from '../../services/supabaseClient';
import { generateStudyContent, getMapsGroundedResponse } from '../../services/geminiService';
import Markdown from 'react-markdown';
import { triggerConfetti, triggerGoalAchievementConfetti } from '../../utils/confetti';

type RoomTab = 'Chat' | 'Live Audio' | 'Whiteboard' | 'Resources' | 'Schedule' | 'Faculty Hive' | 'Study Spots' | 'Settings';

interface StudyRoomsProps {
  userId?: string;
}

interface StudyEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: string;
  type: 'PEER_STUDY' | 'PRACTICE_EXAM' | 'MENTOR_SESSION' | 'QUIZ_NIGHT';
  hostName: string;
  attendees: number;
  userRsvp: boolean;
}

interface StructuredSpot {
  name: string;
  category: string;
  amenities: string[];
  description: string;
  mapLink?: string;
}

export const StudyRooms: React.FC<StudyRoomsProps> = ({ userId }) => {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [activeTab, setActiveTab] = useState<RoomTab>('Chat');
  
  const [presenceCounts, setPresenceCounts] = useState<Record<string, number>>({});
  
  // -- Chat State --
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  // -- Live Audio State --
  const [isMicOn, setIsMicOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isOnStage, setIsOnStage] = useState(true);
  const [aiScribeNotes, setAiScribeNotes] = useState<string[]>([]);
  const [isGeneratingScribe, setIsGeneratingScribe] = useState(false);
  const [audioVolumeBars, setAudioVolumeBars] = useState<number[]>([15, 30, 60, 40, 20, 75, 50, 25]);

  // -- Whiteboard State --
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser' | 'line' | 'rect' | 'circle'>('pen');
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);
  const [aiDiagramPrompt, setAiDiagramPrompt] = useState('');
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [aiDiagramConcept, setAiDiagramConcept] = useState<string | null>(null);

  // -- Resources & File Attachment State --
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceCategory, setNewResourceCategory] = useState('Formula Sheet');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceSummary, setNewResourceSummary] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string; dataUrl: string } | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaryOutput, setSummaryOutput] = useState<Record<string, string>>({});

  // -- Schedule State --
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('18:00');
  const [newEventDuration, setNewEventDuration] = useState('60');
  const [newEventType, setNewEventType] = useState<StudyEvent['type']>('PEER_STUDY');

  // -- Faculty Hive State --
  const [availableMentors, setAvailableMentors] = useState<Partial<User>[]>([]);
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [hireFee, setHireFee] = useState(2500);

  // -- Study Spots State --
  const [spotsQuery, setSpotsQuery] = useState('');
  const [spotsResult, setSpotsResult] = useState<{text: string, places: any[]}>({ text: '', places: [] });
  const [isSearchingSpots, setIsSearchingSpots] = useState(false);

  // -- Room Creation State --
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCategory, setCreateCategory] = useState('CMA US Part 1');
  const [createDesc, setCreateDesc] = useState('');
  const [createColor, setCreateColor] = useState('bg-brand');
  const [createTopics, setCreateTopics] = useState('Internal Controls, Variance Analysis');
  const [createPrivacy, setCreatePrivacy] = useState<'PUBLIC' | 'INVITE_ONLY'>('PUBLIC');

  // -- Member Management State --
  const [roomMembers, setRoomMembers] = useState<ClusterMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ClusterMember['role']>('SCHOLAR');

  // -- Room List Search & Settings --
  const [searchQuery, setSearchQuery] = useState('');
  const [roomSettings, setRoomSettings] = useState<Record<string, Partial<StudyRoom>>>({});

  // Mic animation simulator for live audio visualizer
  useEffect(() => {
    let interval: any;
    if (isMicOn) {
      interval = setInterval(() => {
        setAudioVolumeBars([
          Math.floor(Math.random() * 80) + 10,
          Math.floor(Math.random() * 95) + 15,
          Math.floor(Math.random() * 70) + 20,
          Math.floor(Math.random() * 100) + 10,
          Math.floor(Math.random() * 85) + 15,
          Math.floor(Math.random() * 60) + 20,
          Math.floor(Math.random() * 90) + 10,
          Math.floor(Math.random() * 75) + 15,
        ]);
      }, 150);
    } else {
      setAudioVolumeBars([10, 15, 10, 15, 10, 15, 10, 15]);
    }
    return () => clearInterval(interval);
  }, [isMicOn]);

  // Load initial settings
  useEffect(() => {
    const saved = localStorage.getItem('costudy_room_settings');
    if (saved) {
      try { setRoomSettings(JSON.parse(saved)); } catch (e) { console.error("Parse room settings error", e); }
    }
  }, []);

  const saveRoomSettings = (roomId: string, settings: Partial<StudyRoom>) => {
    const newSettings = { ...roomSettings, [roomId]: { ...roomSettings[roomId], ...settings } };
    setRoomSettings(newSettings);
    localStorage.setItem('costudy_room_settings', JSON.stringify(newSettings));
  };

  // Initial Rooms & User load
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

  // Initial resources & events default data when room selected
  useEffect(() => {
    if (selectedRoom) {
      setRoomMembers(selectedRoom.member_list || [
        { id: selectedRoom.admin_id || 'admin-1', name: selectedRoom.admin_name || 'Cluster Lead', role: 'ADMIN', avatar: 'https://i.pravatar.cc/100?u=admin' },
        { id: 'm-2', name: 'Sneha P.', role: 'MODERATOR', avatar: 'https://i.pravatar.cc/100?u=sneha' },
        { id: 'm-3', name: 'Dr. Ananya Sharma', role: 'FACULTY', avatar: 'https://i.pravatar.cc/100?u=ananya' },
        { id: 'm-4', name: 'Amit Kumar', role: 'SCHOLAR', avatar: 'https://i.pravatar.cc/100?u=amit' }
      ]);

      setResources([
        {
          id: 'res-1',
          room_id: selectedRoom.id,
          title: 'CMA Part 1 - Internal Control Framework Summary',
          summary: 'COSO Internal Control 5 Components & 17 Principles Cheatsheet',
          file_url: 'https://www.imanet.org/',
          file_name: 'COSO_Internal_Control_Master.pdf',
          file_type: 'PDF',
          size: '2.4 MB',
          category: 'Formula Sheet'
        },
        {
          id: 'res-2',
          room_id: selectedRoom.id,
          title: 'Variance Analysis Calculation Cheatsheet',
          summary: 'Direct Material, Labor, and Overhead variances step-by-step formula breakdown',
          file_url: 'https://www.imanet.org/',
          file_name: 'Variance_Analysis_Formula_Card.docx',
          file_type: 'DOCX',
          size: '1.1 MB',
          category: 'Cheatsheet'
        }
      ]);

      setEvents([
        {
          id: 'ev-1',
          title: 'Internal Control & COSO Framework Deep Dive',
          description: 'Interactive peer solving on COSO principles and risk management questions.',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          startTime: '19:00',
          duration: '60 mins',
          type: 'PEER_STUDY',
          hostName: selectedRoom.admin_name || 'Rahul V.',
          attendees: 18,
          userRsvp: true
        },
        {
          id: 'ev-2',
          title: 'Part 1 Calculation Speed Sprint (20 MCQs)',
          description: 'Timed MCQ blitz with instant solution walkthroughs.',
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          startTime: '20:30',
          duration: '45 mins',
          type: 'PRACTICE_EXAM',
          hostName: 'Sneha P.',
          attendees: 32,
          userRsvp: false
        }
      ]);

      setMessages([
        {
          id: 'm1',
          room_id: selectedRoom.id,
          user_id: 'sys1',
          content: `Welcome to ${selectedRoom.name}! Share questions, join live audio sessions, or use the interactive whiteboard. Admin: ${selectedRoom.admin_name || 'Cluster Lead'}`,
          type: 'text',
          created_at: new Date().toISOString(),
          author: { id: 'sys1', name: 'CoStudy Cluster Bot', avatar: 'https://i.pravatar.cc/100?u=bot' }
        }
      ]);
    }
  }, [selectedRoom]);

  // Real-time presence sync
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

  // Load Mentors for Faculty Hive
  useEffect(() => {
    if (selectedRoom && activeTab === 'Faculty Hive') {
      const fetchMentorsAndInvs = async () => {
        const { data: mentors } = await supabase.from('user_profiles').select('*').eq('role', 'TEACHER');
        if (mentors && mentors.length > 0) setAvailableMentors(mentors as any);
        else {
          setAvailableMentors([
            { id: 'm1', name: 'Dr. Ananya Sharma, CMA', role: 'TEACHER' as any, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', specialties: ['Part 1 Financial Reporting', 'Internal Controls'], hourlyRate: 3000, signalLevel: 'ACTIVE_SOLVER' as any },
            { id: 'm2', name: 'Prof. Vikram Roy, FCMA', role: 'TEACHER' as any, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', specialties: ['Part 2 Decision Analysis', 'Risk Management'], hourlyRate: 2500, signalLevel: 'SILENT_LEARNER' as any }
          ]);
        }

        const { data: invs } = await supabase
          .from('mentor_invitations')
          .select('*, mentor:user_profiles(*)')
          .eq('room_id', selectedRoom.id);
        if (invs) setInvitations(invs as any);
      };
      fetchMentorsAndInvs();
    }
  }, [selectedRoom, activeTab]);

  // --- CREATE ROOM LOGIC ---
  const handleCreateCluster = async () => {
    if (!createName.trim()) return;
    const topicsArr = createTopics.split(',').map(t => t.trim()).filter(Boolean);
    const newRoomData = await costudyService.createRoom({
      name: createName,
      category: createCategory,
      description: createDesc || 'Custom collaborative study group.',
      color: createColor,
      targetTopics: topicsArr.length > 0 ? topicsArr : ['Exam Prep'],
      admin_id: userId || 'admin-user',
      admin_name: currentUser?.name || 'Cluster Creator',
      privacy: createPrivacy
    });

    setRooms(prev => [newRoomData, ...prev]);
    setSelectedRoom(newRoomData);
    setShowCreateModal(false);
    setCreateName('');
    setCreateDesc('');
    triggerGoalAchievementConfetti();
  };

  // --- MEMBER MANAGEMENT LOGIC ---
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newM: ClusterMember = {
      id: `m-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole,
      avatar: `https://i.pravatar.cc/100?u=${Date.now()}`
    };
    setRoomMembers(prev => [...prev, newM]);
    if (selectedRoom) {
      setSelectedRoom({
        ...selectedRoom,
        members: selectedRoom.members + 1
      });
    }
    setNewMemberName('');
    setShowAddMemberModal(false);
  };

  const handlePromoteMember = (memberId: string, role: ClusterMember['role']) => {
    setRoomMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const handleRemoveMember = (memberId: string) => {
    setRoomMembers(prev => prev.filter(m => m.id !== memberId));
  };

  // --- FILE ATTACHMENT / UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: sizeInMB,
        type: ext,
        dataUrl: reader.result as string
      });
      if (!newResourceTitle) {
        setNewResourceTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddResource = () => {
    if (!newResourceTitle.trim()) return;
    const newRes: RoomResource = {
      id: `res-${Date.now()}`,
      room_id: selectedRoom?.id || 'r1',
      title: newResourceTitle,
      category: newResourceCategory,
      file_url: attachedFile?.dataUrl || newResourceUrl || 'https://www.imanet.org/',
      file_name: attachedFile?.name || `${newResourceTitle}.${newResourceCategory.toLowerCase()}`,
      file_type: attachedFile?.type || 'PDF',
      size: attachedFile?.size || '1.5 MB',
      summary: newResourceSummary || 'Uploaded by cluster scholar.'
    };
    setResources(prev => [newRes, ...prev]);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceSummary('');
    setAttachedFile(null);
    setShowAddResource(false);
    triggerConfetti();
  };

  const handleSummarizeResource = async (resItem: RoomResource) => {
    setSummarizingId(resItem.id);
    try {
      const summary = await generateStudyContent(`Summarize the following study resource for CMA candidates in 3 high-impact bullet points:\nTitle: ${resItem.title}\nCategory: ${resItem.category}\nNotes: ${resItem.summary}`, "You are a CMA exam summary expert.");
      setSummaryOutput(prev => ({ ...prev, [resItem.id]: summary }));
    } catch (e) {
      console.error("Summarize error", e);
    } finally {
      setSummarizingId(null);
    }
  };

  // --- LIVE AUDIO AI SCRIBE ---
  const generateScribeNotes = async () => {
    setIsGeneratingScribe(true);
    try {
      const text = await generateStudyContent(`Simulate live AI scribe meeting notes for an active CMA Voice Study Group on ${selectedRoom?.name}. Generate 3 key takeaways discussed by participants today including CMA formulas or internal control points.`, "You are an AI meeting scribe.");
      setAiScribeNotes(prev => [text, ...prev]);
    } catch (e) {
      console.error("AI Scribe error", e);
    } finally {
      setIsGeneratingScribe(false);
    }
  };

  const handleSaveScribeToResources = () => {
    if (aiScribeNotes.length === 0) return;
    const combinedNotes = aiScribeNotes.join('\n\n');
    const newRes: RoomResource = {
      id: `res-scribe-${Date.now()}`,
      room_id: selectedRoom?.id || 'r1',
      title: `AI Voice Scribe Session Notes - ${new Date().toLocaleDateString()}`,
      category: 'AI Scribe Notes',
      file_url: '#',
      file_name: `AI_Voice_Scribe_${Date.now()}.txt`,
      file_type: 'TXT',
      size: '45 KB',
      summary: combinedNotes.substring(0, 150) + '...'
    };
    setResources(prev => [newRes, ...prev]);
    alert("Live Audio AI Scribe notes have been saved to Cluster Resources!");
  };

  // --- STUDY SPOTS SEARCH & DATA PARSER ---
  const handleFindSpots = async () => {
    if (!spotsQuery.trim()) return;
    setIsSearchingSpots(true);
    try {
      const result = await getMapsGroundedResponse(`Find top 6 study spots, quiet reading rooms, 24/7 study lounges, or study cafes in and around: ${spotsQuery}. List specific names, operating hours, amenities (Wi-Fi, AC, Power sockets, quiet zones), and location details.`);
      setSpotsResult(result);
    } catch (error) {
      console.error("Spots Error", error);
    } finally {
      setIsSearchingSpots(false);
    }
  };

  // Structured parser for Gemini Maps response
  const structuredSpots = useMemo(() => {
    if (!spotsResult.text) return [];

    const lines = spotsResult.text.split('\n');
    const spots: StructuredSpot[] = [];
    let currentSpot: StructuredSpot | null = null;
    let currentCategory = 'Study Spot';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.toLowerCase().includes('reading room') || trimmed.toLowerCase().includes('dedicated study') || trimmed.toLowerCase().includes('study lounge')) {
        currentCategory = '📚 Reading Room & Study Lounge';
      } else if (trimmed.toLowerCase().includes('library') || trimmed.toLowerCase().includes('libraries')) {
        currentCategory = '🤫 Public Library & Quiet Hall';
      } else if (trimmed.toLowerCase().includes('cafe') || trimmed.toLowerCase().includes('coffee')) {
        currentCategory = '☕ Study-Friendly Cafe';
      }

      // Check for bold title headers e.g. **SitLearn Reading Room**
      if (trimmed.startsWith('**') || trimmed.startsWith('###') || (trimmed.includes(':') && trimmed.length < 80 && !trimmed.startsWith('-'))) {
        const name = trimmed.replace(/\*\*/g, '').replace(/###/g, '').replace(/[\d\.]/g, '').trim();
        if (name && name.length > 3 && !name.toLowerCase().includes('cma') && !name.toLowerCase().includes('offers')) {
          if (currentSpot) spots.push(currentSpot);
          
          const amenities: string[] = [];
          if (trimmed.toLowerCase().includes('24/7') || trimmed.toLowerCase().includes('24 hours')) amenities.push('🕒 24/7 Access');
          if (trimmed.toLowerCase().includes('wi-fi') || trimmed.toLowerCase().includes('wifi')) amenities.push('⚡ High-Speed Wi-Fi');
          if (trimmed.toLowerCase().includes('ac') || trimmed.toLowerCase().includes('air')) amenities.push('❄️ Air Conditioned');
          if (trimmed.toLowerCase().includes('power') || trimmed.toLowerCase().includes('charging') || trimmed.toLowerCase().includes('socket')) amenities.push('🔌 Power Sockets');
          if (trimmed.toLowerCase().includes('coffee') || trimmed.toLowerCase().includes('tea') || trimmed.toLowerCase().includes('cafe')) amenities.push('☕ Refreshments');
          if (trimmed.toLowerCase().includes('silent') || trimmed.toLowerCase().includes('quiet') || trimmed.toLowerCase().includes('cabin')) amenities.push('🤫 Silent Cabins');

          currentSpot = {
            name,
            category: currentCategory,
            amenities: amenities.length > 0 ? amenities : ['⚡ High-Speed Wi-Fi', '🔌 Power Sockets', '🤫 Quiet Study Zone'],
            description: trimmed
          };
        }
      } else if (currentSpot) {
        currentSpot.description += ' ' + trimmed.replace(/\*\*/g, '');
        if (trimmed.toLowerCase().includes('24/7')) currentSpot.amenities.push('🕒 24/7 Access');
        if (trimmed.toLowerCase().includes('wi-fi')) currentSpot.amenities.push('⚡ Wi-Fi');
        if (trimmed.toLowerCase().includes('power') || trimmed.toLowerCase().includes('socket')) currentSpot.amenities.push('🔌 Power Outlets');
        currentSpot.amenities = Array.from(new Set(currentSpot.amenities));
      }
    });

    if (currentSpot) spots.push(currentSpot);
    return spots.slice(0, 8);
  }, [spotsResult]);

  // -- WHITEBOARD LOGIC --
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setCanvasHistory(prev => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    setIsDrawing(true);
    setStartPos({ x, y });

    if (drawingTool === 'pen' || drawingTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawingTool === 'pen') {
      ctx.strokeStyle = drawingColor;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawingTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (canvasHistory.length > 0) {
      ctx.putImageData(canvasHistory[canvasHistory.length - 1], 0, 0);
      ctx.strokeStyle = drawingColor;
      ctx.fillStyle = drawingColor + '20';

      if (drawingTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (drawingTool === 'rect') {
        ctx.beginPath();
        ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        ctx.fill();
        ctx.stroke();
      } else if (drawingTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasHistory([]);
  };

  const handleGenerateAiDiagram = async (presetPrompt?: string) => {
    const query = presetPrompt || aiDiagramPrompt;
    if (!query.trim()) return;
    setIsGeneratingDiagram(true);
    try {
      const result = await generateStudyContent(`Create a structured study concept diagram & key formulas for: "${query}". Include 4 sequential boxes/steps, formula breakdown, and decision logic for CMA exam.`, "You are an expert CMA diagram visualizer.");
      setAiDiagramConcept(result);
    } catch (e) {
      console.error("AI Diagram error", e);
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const handleRenderDiagramToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw clean diagram boxes
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('AI CONCEPT MAP: ' + (aiDiagramPrompt || 'CMA Strategy'), 40, 40);

    // Box 1
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 70, 180, 80);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('1. Control Environment', 50, 100);
    ctx.font = '10px sans-serif';
    ctx.fillText('Governance & Integrity', 50, 120);

    // Arrow 1
    ctx.beginPath();
    ctx.moveTo(220, 110);
    ctx.lineTo(260, 110);
    ctx.stroke();

    // Box 2
    ctx.strokeRect(260, 70, 180, 80);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('2. Risk Assessment', 270, 100);
    ctx.font = '10px sans-serif';
    ctx.fillText('Identify & Analyze Risk', 270, 120);

    // Arrow 2
    ctx.beginPath();
    ctx.moveTo(440, 110);
    ctx.lineTo(480, 110);
    ctx.stroke();

    // Box 3
    ctx.strokeRect(480, 70, 180, 80);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('3. Control Activities', 490, 100);
    ctx.font = '10px sans-serif';
    ctx.fillText('Policies & Segregation', 490, 120);

    alert("AI Concept Diagram rendered directly onto Whiteboard canvas!");
  };

  // Chat message send
  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedRoom) return;
    const newMsg: RoomMessage = {
      id: `msg-${Date.now()}`,
      room_id: selectedRoom.id,
      user_id: userId || 'user-1',
      content: chatInput,
      type: 'text',
      created_at: new Date().toISOString(),
      author: {
        id: userId || 'user-1',
        name: currentUser?.name || 'Aspirant Scholar',
        avatar: currentUser?.avatar || 'https://i.pravatar.cc/100?u=me'
      }
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    if (chatInput.toLowerCase().includes('@ai') || chatInput.toLowerCase().includes('explain') || chatInput.includes('?')) {
      setIsAiAnswering(true);
      try {
        const aiAnswer = await generateStudyContent(`User question in CMA Study Group (${selectedRoom.name}): "${chatInput}". Give a concise, encouraging 2-sentence explanation with key exam tip.`, "You are CoStudy AI Cluster Tutor.");
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          room_id: selectedRoom.id,
          user_id: 'ai-bot',
          content: aiAnswer,
          type: 'text',
          created_at: new Date().toISOString(),
          author: { id: 'ai-bot', name: 'CoStudy AI Assistant', avatar: 'https://i.pravatar.cc/100?u=aicluster' }
        }]);
      } catch (e) {
        console.warn("AI Chat response failed:", e);
      } finally {
        setIsAiAnswering(false);
      }
    }
  };

  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEv: StudyEvent = {
      id: `ev-${Date.now()}`,
      title: newEventTitle,
      description: newEventDesc || 'Cluster study session',
      date: newEventDate,
      startTime: newEventTime,
      duration: `${newEventDuration} mins`,
      type: newEventType,
      hostName: currentUser?.name || 'Scholar Host',
      attendees: 1,
      userRsvp: true
    };
    setEvents(prev => [newEv, ...prev]);
    setNewEventTitle('');
    setNewEventDesc('');
    setShowAddEvent(false);
    triggerConfetti();
  };

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

  const currentRoom = useMemo(() => {
    if (!selectedRoom) return null;
    return liveRooms.find(r => r.id === selectedRoom.id) || selectedRoom;
  }, [selectedRoom, liveRooms]);

  const menuTabs: { tab: RoomTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'Chat', label: 'Chat', icon: <Icons.MessageCircle className="w-4 h-4" /> },
    { tab: 'Live Audio', label: 'Live Audio', icon: <Icons.Mic className="w-4 h-4" /> },
    { tab: 'Whiteboard', label: 'Whiteboard', icon: <Icons.Brain className="w-4 h-4" /> },
    { tab: 'Resources', label: 'Resources', icon: <Icons.FileText className="w-4 h-4" /> },
    { tab: 'Schedule', label: 'Schedule', icon: <Icons.Calendar className="w-4 h-4" /> },
    { tab: 'Faculty Hive', label: 'Faculty Hive', icon: <Icons.GraduationCap className="w-4 h-4" /> },
    { tab: 'Study Spots', label: 'Study Spots', icon: <Icons.Search className="w-4 h-4" /> },
    { tab: 'Settings', label: 'Settings', icon: <Icons.Users className="w-4 h-4" /> }
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 opacity-60">
       <Icons.Sparkles className="w-16 h-16 animate-spin text-brand" />
       <span className="font-black uppercase tracking-[0.4em] text-sm animate-pulse text-slate-900 dark:text-white">Establishing Cluster Sync...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12 relative min-h-screen">
      
      {currentRoom ? (
        <div className="fixed inset-0 top-20 z-20 bg-slate-100 dark:bg-[#0b0f19] overflow-hidden flex flex-col lg:flex-row animate-in slide-in-from-right duration-500">
          
          {/* LEFT SIDEBAR MENU */}
          <aside className="w-full lg:w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl lg:m-4 lg:rounded-[2.5rem] p-5 lg:p-6 flex flex-col shadow-2xl border-b lg:border border-slate-200 dark:border-slate-800 shrink-0 h-auto lg:h-[calc(100vh-6.5rem)] overflow-hidden">
            <div className="flex justify-between items-start lg:block shrink-0 mb-4">
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="flex items-center gap-2 text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand font-black text-[10px] uppercase tracking-widest mb-3 transition-colors"
              >
                <Icons.Plus className="rotate-45 w-4 h-4" /> Exit Cluster
              </button>
              
              <div className="flex lg:flex-col items-center lg:items-start gap-3">
                <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-2xl ${currentRoom.color} shadow-lg flex items-center justify-center text-white shrink-0`}>
                  <Icons.Logo className="w-5 h-5 lg:w-8 lg:h-8" />
                </div>
                <div>
                   <h2 className="text-base lg:text-xl font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight truncate max-w-[180px] lg:max-w-none">{currentRoom.name}</h2>
                   <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <Icons.Users className="w-3 h-3" /> {roomMembers.length} Members
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          {currentRoom.activeOnline} Active
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 shrink-0"></div>

            {/* SCROLLABLE MENU NAV */}
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar gap-1.5 my-2 pb-2 lg:pb-0 flex-1">
              {menuTabs.map(item => (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 lg:w-full ${
                    activeTab === item.tab 
                      ? 'bg-slate-900 dark:bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CLUSTER ADMIN CARD */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 mt-auto shrink-0 hidden lg:block">
              <div className="text-[9px] font-black uppercase tracking-widest text-brand mb-1 flex items-center gap-1">
                ⭐ Cluster Admin
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{currentRoom.admin_name || 'Rahul V.'}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{currentRoom.privacy || 'PUBLIC'} Cluster</div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 bg-white dark:bg-slate-900 lg:m-4 lg:ml-0 lg:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-[calc(100vh-13rem)] lg:h-[calc(100vh-6.5rem)] relative">
             
             {/* TOP ROOM HEADER */}
             <header className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <span className="px-3 py-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest rounded-full">{currentRoom.category}</span>
                   <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider hidden sm:block">{activeTab}</h3>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2">
                     {roomMembers.slice(0, 4).map((m) => (
                       <img key={m.id} src={m.avatar || `https://i.pravatar.cc/100?u=${m.id}`} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover" title={`${m.name} (${m.role})`} />
                     ))}
                   </div>
                   <button 
                     onClick={() => setShowAddMemberModal(true)}
                     className="px-3 py-1.5 bg-slate-900 dark:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-1"
                   >
                     + Add Member
                   </button>
                </div>
             </header>

             {/* TAB VIEWPORTS */}
             <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* 1. CHAT TAB */}
                {activeTab === 'Chat' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                     <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                        {messages.map((msg) => (
                           <div key={msg.id} className={`flex gap-3 max-w-2xl ${msg.user_id === userId ? 'ml-auto flex-row-reverse' : ''}`}>
                              <img src={msg.author?.avatar || 'https://i.pravatar.cc/100'} className="w-9 h-9 rounded-2xl object-cover shrink-0" />
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{msg.author?.name}</span>
                                    <span className="text-[8px] font-bold text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                                 <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                                    msg.user_id === 'ai-bot'
                                       ? 'bg-amber-500/10 border border-amber-500/30 text-slate-900 dark:text-amber-100'
                                       : msg.user_id === userId
                                       ? 'bg-brand text-white rounded-tr-none'
                                       : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                                 }`}>
                                    <Markdown>{msg.content}</Markdown>
                                 </div>
                              </div>
                           </div>
                        ))}
                        {isAiAnswering && (
                           <div className="flex items-center gap-2 text-xs font-bold text-amber-500 animate-pulse p-4">
                              <Icons.Sparkles className="w-4 h-4 animate-spin" /> CoStudy AI Assistant is drafting response...
                           </div>
                        )}
                     </div>

                     <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                        <input 
                           type="text"
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                           placeholder="Type message or ask @ai for formula help..."
                           className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand"
                        />
                        <button onClick={sendMessage} className="px-6 py-3 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2">
                           <Icons.Send className="w-4 h-4" /> Send
                        </button>
                     </div>
                  </div>
                )}

                {/* 2. LIVE AUDIO TAB */}
                {activeTab === 'Live Audio' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto no-scrollbar bg-slate-900 text-white">
                     <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                        <div>
                           <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full mb-2 inline-block">● Voice Lounge Live</span>
                           <h2 className="text-3xl font-black uppercase tracking-tight">Active Audio Stage</h2>
                           <p className="text-xs text-slate-400 font-medium mt-1">High-fidelity voice room with Web Audio API level meter and real-time AI Scribe.</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setIsMicOn(!isMicOn)}
                             className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                               isMicOn ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                             }`}
                           >
                             {isMicOn ? <Icons.Mic className="w-4 h-4 animate-bounce" /> : <Icons.MicOff className="w-4 h-4" />}
                             {isMicOn ? 'Mic Active' : 'Unmute Mic'}
                           </button>

                           <button 
                             onClick={() => setIsHandRaised(!isHandRaised)}
                             className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                               isHandRaised ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-300'
                             }`}
                           >
                             ✋ {isHandRaised ? 'Hand Raised' : 'Raise Hand'}
                           </button>

                           <button 
                             onClick={() => setIsSharingScreen(!isSharingScreen)}
                             className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                               isSharingScreen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                             }`}
                           >
                             🖥️ {isSharingScreen ? 'Sharing Screen' : 'Share Screen'}
                           </button>
                        </div>
                     </div>

                     {/* REAL-TIME AUDIO LEVEL WAVE SPECTRUM */}
                     <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-3xl mb-8 flex flex-col items-center justify-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4 flex items-center gap-2">
                          <Icons.Volume2 className="w-4 h-4 animate-pulse" /> Web Audio Frequency Meter
                        </div>
                        <div className="flex items-end justify-center gap-2 h-16 w-full max-w-md">
                           {audioVolumeBars.map((h, i) => (
                             <div 
                               key={i} 
                               className="w-4 bg-emerald-400 rounded-t-lg transition-all duration-150 shadow-lg shadow-emerald-500/20"
                               style={{ height: `${isMicOn ? h : 10}%` }}
                             />
                           ))}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-4">
                           {isMicOn ? '🎙️ Speaking live into cluster stream...' : 'Microphone muted. Click Unmute Mic to start speaking.'}
                        </div>
                     </div>

                     {/* STAGE SPEAKERS GRID */}
                     <div className="mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Stage Speakers</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {roomMembers.map((m) => (
                              <div key={m.id} className="p-5 bg-slate-800 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <img src={m.avatar} className="w-11 h-11 rounded-xl object-cover" />
                                    <div>
                                       <div className="text-xs font-black uppercase text-white">{m.name}</div>
                                       <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{m.role}</div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                    {m.id === 'admin-1' && isMicOn ? (
                                       <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                                    ) : (
                                       <span className="text-[10px] text-slate-500">Muted</span>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* AI VOICE SCRIBE PANEL */}
                     <div className="p-6 bg-slate-800/60 border border-slate-700/80 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                           <div>
                              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                 <Icons.Sparkles className="w-4 h-4" /> AI Voice Scribe Live Notes
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium">Auto-captures key discussion takeaways, formulas, and study points.</p>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={generateScribeNotes}
                                disabled={isGeneratingScribe}
                                className="px-4 py-2 bg-amber-500 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50"
                              >
                                {isGeneratingScribe ? 'Scribing...' : 'Capture Scribe Note'}
                              </button>
                              {aiScribeNotes.length > 0 && (
                                <button 
                                  onClick={handleSaveScribeToResources}
                                  className="px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                >
                                  Save to Resources
                                </button>
                              )}
                           </div>
                        </div>

                        {aiScribeNotes.length === 0 ? (
                           <div className="text-center py-6 text-slate-500 text-xs italic">
                              Click "Capture Scribe Note" to synthesize current audio session into bullet points.
                           </div>
                        ) : (
                           <div className="space-y-3">
                              {aiScribeNotes.map((note, idx) => (
                                 <div key={idx} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 text-xs text-slate-200">
                                    <Markdown>{note}</Markdown>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
                )}

                {/* 3. WHITEBOARD TAB */}
                {activeTab === 'Whiteboard' && (
                  <div className="flex-1 flex flex-col p-6 overflow-hidden bg-slate-50 dark:bg-slate-900">
                     {/* TOOLBAR */}
                     <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap justify-between items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => setDrawingTool('pen')}
                             className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${drawingTool === 'pen' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                           >
                              ✏️ Pen
                           </button>
                           <button 
                             onClick={() => setDrawingTool('eraser')}
                             className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${drawingTool === 'eraser' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                           >
                              🧹 Eraser
                           </button>
                           <button 
                             onClick={() => setDrawingTool('rect')}
                             className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${drawingTool === 'rect' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                           >
                              🟦 Box
                           </button>

                           <input 
                             type="color" 
                             value={drawingColor} 
                             onChange={(e) => setDrawingColor(e.target.value)}
                             className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                           />
                        </div>

                        <div className="flex items-center gap-3">
                           <button onClick={clearCanvas} className="px-3 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-black uppercase">Clear</button>
                        </div>
                     </div>

                     {/* AI CONCEPT MAP GENERATOR PRESETS */}
                     <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                           <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                              <Icons.Sparkles className="w-4 h-4 text-brand" /> AI Concept Map Generator
                           </span>
                           <div className="flex gap-2">
                              <button onClick={() => handleGenerateAiDiagram('COSO 5 Internal Control Components')} className="px-3 py-1 bg-brand/10 text-brand rounded-lg text-[9px] font-black uppercase">COSO 5 Map</button>
                              <button onClick={() => handleGenerateAiDiagram('Variance Analysis Decision Tree')} className="px-3 py-1 bg-brand/10 text-brand rounded-lg text-[9px] font-black uppercase">Variance Tree</button>
                              <button onClick={() => handleGenerateAiDiagram('Part 1 Master Budgeting Flow')} className="px-3 py-1 bg-brand/10 text-brand rounded-lg text-[9px] font-black uppercase">Budget Flow</button>
                           </div>
                        </div>

                        <div className="flex gap-2">
                           <input 
                             type="text"
                             value={aiDiagramPrompt}
                             onChange={(e) => setAiDiagramPrompt(e.target.value)}
                             placeholder="Enter topic e.g. WACC Formula Breakdown or Activity Based Costing..."
                             className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                           />
                           <button 
                             onClick={() => handleGenerateAiDiagram()}
                             disabled={isGeneratingDiagram}
                             className="px-4 py-2 bg-slate-900 dark:bg-brand text-white rounded-xl text-xs font-black uppercase tracking-wider"
                           >
                              {isGeneratingDiagram ? 'Generating...' : 'Generate Diagram'}
                           </button>
                        </div>

                        {aiDiagramConcept && (
                           <div className="mt-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-slate-900 dark:text-amber-100">
                              <div className="flex justify-between items-center mb-2">
                                 <span className="font-black text-[10px] uppercase text-amber-600 dark:text-amber-400">Generated Concept Diagram:</span>
                                 <button onClick={handleRenderDiagramToCanvas} className="px-3 py-1 bg-amber-500 text-slate-900 rounded-lg text-[9px] font-black uppercase">Render on Canvas</button>
                              </div>
                              <Markdown>{aiDiagramConcept}</Markdown>
                           </div>
                        )}
                     </div>

                     {/* CANVAS */}
                     <div className="flex-1 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-inner">
                        <canvas 
                          ref={canvasRef}
                          width={900}
                          height={500}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="w-full h-full cursor-crosshair touch-none"
                        />
                     </div>
                  </div>
                )}

                {/* 4. RESOURCES TAB WITH FILE UPLOAD */}
                {activeTab === 'Resources' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Cluster Resources & File Vault</h2>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Upload and attach study material, formula sheets, or mock questions for cluster members.</p>
                        </div>
                        <button 
                          onClick={() => setShowAddResource(true)}
                          className="px-5 py-3 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-brand/20"
                        >
                           <Icons.Plus className="w-4 h-4" /> Upload Resource
                        </button>
                     </div>

                     {/* ADD RESOURCE MODAL */}
                     {showAddResource && (
                       <div className="mb-8 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl animate-in fade-in duration-300">
                          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-4">Attach & Share New Resource</h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                             <input 
                               type="text" 
                               placeholder="Resource Title..." 
                               value={newResourceTitle}
                               onChange={(e) => setNewResourceTitle(e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none"
                             />
                             <select 
                               value={newResourceCategory}
                               onChange={(e) => setNewResourceCategory(e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                             >
                               <option value="Formula Sheet">Formula Sheet</option>
                               <option value="Cheatsheet">Cheatsheet</option>
                               <option value="Mock Test">Mock MCQ Test</option>
                               <option value="Summary Notes">Summary Notes</option>
                             </select>
                          </div>

                          {/* FILE ATTACHMENT PICKER */}
                          <div className="mb-4 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-900/50">
                             <input 
                               type="file" 
                               id="res-file-input"
                               accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.xlsx"
                               onChange={handleFileSelect}
                               className="hidden"
                             />
                             <label htmlFor="res-file-input" className="cursor-pointer block">
                                <Icons.FileText className="w-8 h-8 mx-auto text-brand mb-2" />
                                {attachedFile ? (
                                   <div className="text-xs font-black text-emerald-500 uppercase">
                                      ✓ Attached: {attachedFile.name} ({attachedFile.size})
                                   </div>
                                ) : (
                                   <div>
                                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase">Click to Select or Drop File</div>
                                      <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Supports PDF, DOCX, TXT, Excel & Images</div>
                                   </div>
                                )}
                             </label>
                          </div>

                          <textarea 
                            placeholder="Resource summary or key formula overview..." 
                            value={newResourceSummary}
                            onChange={(e) => setNewResourceSummary(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white mb-4 h-20 outline-none"
                          />

                          <div className="flex justify-end gap-2">
                             <button onClick={() => setShowAddResource(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase">Cancel</button>
                             <button onClick={handleAddResource} className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest">Publish File</button>
                          </div>
                       </div>
                     )}

                     {/* RESOURCE CARDS */}
                     <div className="space-y-4">
                        {resources.map(res => (
                           <div key={res.id} className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-md transition-all">
                              <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                 <div>
                                    <div className="flex items-center gap-2 mb-2">
                                       <span className="px-3 py-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest rounded-full">{res.category}</span>
                                       {res.size && <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase rounded-lg">{res.file_type || 'PDF'} • {res.size}</span>}
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">{res.title}</h3>
                                 </div>
                                 <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleSummarizeResource(res)}
                                      disabled={summarizingId === res.id}
                                      className="px-3 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      <Icons.Sparkles className="w-3.5 h-3.5" />
                                      {summarizingId === res.id ? 'Summarizing...' : 'AI Key Summary'}
                                    </button>
                                    <a 
                                      href={res.file_url || '#'} 
                                      download={res.file_name || 'resource'}
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all flex items-center gap-1.5"
                                    >
                                      📥 Download / Open
                                    </a>
                                 </div>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{res.summary}</p>

                              {summaryOutput[res.id] && (
                                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-slate-900 dark:text-amber-100">
                                   <div className="font-black text-[9px] uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                                      <Icons.Sparkles className="w-3.5 h-3.5" /> AI Key Takeaways:
                                   </div>
                                   <Markdown>{summaryOutput[res.id]}</Markdown>
                                </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {/* 5. SCHEDULE TAB */}
                {activeTab === 'Schedule' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Cluster Calendar & Sessions</h2>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Upcoming group study sessions, mock exam countdowns, and peer review labs.</p>
                        </div>
                        <button 
                          onClick={() => setShowAddEvent(true)}
                          className="px-5 py-3 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-brand/20"
                        >
                           <Icons.Plus className="w-4 h-4" /> Schedule Session
                        </button>
                     </div>

                     {/* ADD EVENT MODAL */}
                     {showAddEvent && (
                       <div className="mb-8 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl animate-in fade-in duration-300">
                          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-4">Schedule New Session</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                             <input 
                               type="text" 
                               placeholder="Session Title..." 
                               value={newEventTitle}
                               onChange={(e) => setNewEventTitle(e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                             />
                             <select 
                               value={newEventType}
                               onChange={(e) => setNewEventType(e.target.value as any)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                             >
                               <option value="PEER_STUDY">Peer Study Session</option>
                               <option value="PRACTICE_EXAM">Practice MCQ Blitz</option>
                               <option value="MENTOR_SESSION">Mentor Workshop</option>
                               <option value="QUIZ_NIGHT">Rapid Fire Quiz</option>
                             </select>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                             <input 
                               type="date" 
                               value={newEventDate}
                               onChange={(e) => setNewEventDate(e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                             />
                             <input 
                               type="time" 
                               value={newEventTime}
                               onChange={(e) => setNewEventTime(e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                             />
                             <select 
                               value={newEventDuration}
                               onChange={(e) => setNewEventDuration(e.target.value)}
                               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white"
                             >
                               <option value="30">30 Mins</option>
                               <option value="45">45 Mins</option>
                               <option value="60">60 Mins</option>
                               <option value="90">90 Mins</option>
                             </select>
                          </div>
                          <textarea 
                            placeholder="Session agenda / topics..." 
                            value={newEventDesc}
                            onChange={(e) => setNewEventDesc(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white mb-4 h-20 outline-none"
                          />
                          <div className="flex justify-end gap-2">
                             <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase">Cancel</button>
                             <button onClick={handleCreateEvent} className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest">Schedule</button>
                          </div>
                       </div>
                     )}

                     {/* EVENTS LIST */}
                     <div className="space-y-4">
                        {events.map(ev => (
                          <div key={ev.id} className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm flex flex-wrap justify-between items-center gap-6">
                             <div>
                                <div className="flex items-center gap-3 mb-2">
                                   <span className="px-3 py-1 bg-slate-900 dark:bg-brand text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
                                      {ev.type.replace('_', ' ')}
                                   </span>
                                   <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                      <Icons.Calendar className="w-3.5 h-3.5" /> {ev.date} @ {ev.startTime} ({ev.duration})
                                   </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-1">{ev.title}</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-xl">{ev.description}</p>
                             </div>

                             <button 
                               onClick={() => setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, userRsvp: !e.userRsvp } : e))}
                               className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                 ev.userRsvp 
                                   ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                   : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-brand hover:text-white'
                               }`}
                             >
                               {ev.userRsvp ? '✓ Attending' : 'RSVP Now'}
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                {/* 6. FACULTY HIVE TAB */}
                {activeTab === 'Faculty Hive' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900">
                      <div className="mb-10">
                        <h4 className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Strategic Mentorship</h4>
                        <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">The Faculty Hive</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic text-sm max-w-2xl">Enlist registered CMA specialists to lead your cluster session. Split fees among cluster members.</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2">
                             <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Icons.GraduationCap className="w-4 h-4 text-emerald-500" /> Registered Specialists
                             </h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {availableMentors.map(mentor => {
                                    const isOnline = mentor.signalLevel === 'ACTIVE_SOLVER';
                                    return (
                                    <div key={mentor.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all group">
                                        <div className="flex items-center justify-between gap-3 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={mentor.avatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700 shadow" />
                                                    <div 
                                                        className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                                                            isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                                                        }`}
                                                        title={isOnline ? 'Online now' : 'Offline'}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{mentor.name}</div>
                                                    <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Verified Faculty</div>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                                isOnline 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                {isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-6">
                                            {mentor.specialties?.map(s => <span key={s} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">{s}</span>)}
                                        </div>
                                        <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Hourly Session</span>
                                            <span className="text-lg font-black text-slate-900 dark:text-white">₹{mentor.hourlyRate || '2500'}</span>
                                        </div>
                                        <button 
                                            onClick={() => alert(`Enlistment sent to ${mentor.name}`)}
                                            className="w-full py-3 bg-slate-900 dark:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 cursor-pointer"
                                        >
                                            {isOnline ? 'Enlist Instantly (Online)' : 'Request Session (Offline)'}
                                        </button>
                                    </div>
                                    );
                                })}
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                <h3 className="text-base font-black uppercase tracking-widest mb-6 relative z-10">Cluster Mentorship Ledger</h3>
                                <p className="text-xs text-slate-300">Co-funded sessions automatically divide faculty fees equally among active cluster members.</p>
                             </div>
                          </div>
                      </div>
                  </div>
                )}

                {/* 7. STUDY SPOTS TAB (STRUCTURED CARDS FIX) */}
                {activeTab === 'Study Spots' && (
                  <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900">
                    <div className="mb-8">
                      <h4 className="text-brand font-black text-[10px] uppercase tracking-[0.3em] mb-2">Physical Grounding</h4>
                      <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Study Spots Finder</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs max-w-xl">Find structured reading rooms, quiet libraries, and study cafes near your city powered by Google Maps.</p>
                    </div>

                    <div className="max-w-2xl mb-8">
                      <div className="relative">
                        <input 
                          value={spotsQuery}
                          onChange={(e) => setSpotsQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleFindSpots()}
                          placeholder="Enter city or area (e.g., Cochin, Bangalore, HSR Layout)..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 pr-16 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand/10 transition-all"
                        />
                        <button 
                          onClick={handleFindSpots}
                          disabled={isSearchingSpots}
                          className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 dark:bg-brand text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                          {isSearchingSpots ? <Icons.CloudSync className="w-5 h-5 animate-spin" /> : <Icons.Search className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* STRUCTURED STUDY SPOT CARDS GRID */}
                    {spotsResult.text && (
                      <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand mb-4">
                              📍 Verified Study Locations in {spotsQuery || 'Search Region'}
                           </h3>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {structuredSpots.length > 0 ? (
                                structuredSpots.map((spot, idx) => (
                                  <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-brand/40 transition-all flex flex-col justify-between">
                                     <div>
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                           <span className="px-3 py-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest rounded-full">{spot.category}</span>
                                        </div>

                                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-2 leading-snug">{spot.name}</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">{spot.description.substring(0, 220)}...</p>

                                        {/* AMENITIES BADGES */}
                                        <div className="flex flex-wrap gap-1.5 mb-6">
                                           {spot.amenities.map((amenity, aIdx) => (
                                              <span key={aIdx} className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                                                 {amenity}
                                              </span>
                                           ))}
                                        </div>
                                     </div>

                                     {/* GOOGLE MAPS ACTION BUTTON */}
                                     {spotsResult.places && spotsResult.places[idx] ? (
                                        <a 
                                          href={spotsResult.places[idx].uri} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="w-full py-3 bg-slate-900 dark:bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all text-center flex items-center justify-center gap-2 shadow-md"
                                        >
                                           <Icons.ExternalLink className="w-3.5 h-3.5" /> View on Google Maps
                                        </a>
                                     ) : (
                                        <a 
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ' ' + spotsQuery)}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="w-full py-3 bg-slate-900 dark:bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all text-center flex items-center justify-center gap-2 shadow-md"
                                        >
                                           <Icons.ExternalLink className="w-3.5 h-3.5" /> Open Google Maps
                                        </a>
                                     )}
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                                   <Markdown>{spotsResult.text}</Markdown>
                                </div>
                              )}
                           </div>
                        </div>

                        {/* VERIFIED GOOGLE PLACES QUICK LIST */}
                        {spotsResult.places && spotsResult.places.length > 0 && (
                          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Direct Google Maps Coordinates</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {spotsResult.places.map((place: any, idx: number) => (
                                <a 
                                  key={idx}
                                  href={place.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-brand transition-all flex justify-between items-center"
                                >
                                  <div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{place.title || 'Study Spot'}</div>
                                    <div className="text-[9px] font-bold text-brand uppercase tracking-wider mt-0.5">Google Verified Place</div>
                                  </div>
                                  <Icons.ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 8. SETTINGS TAB WITH MEMBER & ADMIN CONTROLS */}
                {activeTab === 'Settings' && selectedRoom && (
                  <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900">
                    <div className="mb-8">
                      <h4 className="text-brand font-black text-[10px] uppercase tracking-[0.3em] mb-2">Cluster Customization</h4>
                      <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Room Settings</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium italic text-xs max-w-xl">Customize cluster identity, member roles, admins, and study targets.</p>
                    </div>

                    <div className="max-w-2xl space-y-8">
                      
                      {/* CLUSTER MEMBERS & ADMIN MANAGEMENT */}
                      <section className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700">
                         <div className="flex justify-between items-center mb-4">
                            <div>
                               <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">Cluster Admins & Members</h3>
                               <p className="text-[10px] text-slate-400 font-medium">Manage member access and elevate leadership roles.</p>
                            </div>
                            <button 
                              onClick={() => setShowAddMemberModal(true)}
                              className="px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                            >
                               + Add Member
                            </button>
                         </div>

                         <div className="space-y-3">
                            {roomMembers.map(member => (
                               <div key={member.id} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                     <img src={member.avatar || 'https://i.pravatar.cc/100'} className="w-9 h-9 rounded-xl object-cover" />
                                     <div>
                                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase">{member.name}</div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                           member.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}>
                                           {member.role === 'ADMIN' ? '👑 Cluster Admin' : member.role}
                                        </span>
                                     </div>
                                  </div>

                                  <div className="flex gap-2">
                                     {member.role !== 'ADMIN' && (
                                        <button 
                                          onClick={() => handlePromoteMember(member.id, 'ADMIN')}
                                          className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white"
                                        >
                                           Make Admin
                                        </button>
                                     )}
                                     <button 
                                       onClick={() => handleRemoveMember(member.id)}
                                       className="px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white"
                                     >
                                        Remove
                                     </button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </section>

                      <section>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cluster Name</label>
                        <input 
                          type="text"
                          value={roomSettings[selectedRoom.id]?.name || selectedRoom.name}
                          onChange={(e) => saveRoomSettings(selectedRoom.id, { name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand"
                        />
                      </section>

                      <section>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color Accent</label>
                        <div className="flex flex-wrap gap-3">
                          {['bg-brand', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-slate-900'].map(color => (
                            <button 
                              key={color}
                              onClick={() => saveRoomSettings(selectedRoom.id, { color })}
                              className={`w-10 h-10 rounded-xl ${color} transition-all ${ (roomSettings[selectedRoom.id]?.color || selectedRoom.color) === color ? 'ring-4 ring-offset-2 ring-brand scale-110' : 'opacity-70 hover:opacity-100'}`}
                            />
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
             </div>
          </main>
        </div>
      ) : (
        /* ROOM SELECTION PORTAL GRID */
        <div className="animate-in fade-in duration-700">
            <header className="mb-10 text-center relative">
               <div className="flex justify-center items-center gap-3 mb-2">
                  <span className="px-4 py-1.5 bg-brand/10 text-brand text-xs font-black uppercase tracking-[0.3em] rounded-full">Collaborative Learning Hubs</span>
               </div>
               <h2 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-4 uppercase scale-y-105">CMA Clusters</h2>
               <p className="text-base sm:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto italic mb-6">Collaborative strategy rooms for elite certification aspirants.</p>
               
               {/* CREATE NEW ROOM BUTTON */}
               <button 
                 onClick={() => setShowCreateModal(true)}
                 className="px-8 py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2"
               >
                  <Icons.Plus className="w-5 h-5" /> + Create New Cluster
               </button>
            </header>
           
            <div className="max-w-xl mx-auto mb-12 relative z-20">
              <div className="relative group">
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search active study clusters or topics..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 pl-12 text-sm font-bold text-slate-900 dark:text-white shadow-lg outline-none focus:ring-4 focus:ring-brand/10 transition-all placeholder:text-slate-400"
                  />
                  <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand transition-colors" />
              </div>
            </div>
           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
              {filteredRooms.map(room => (
                <div 
                  key={room.id} 
                  onClick={() => setSelectedRoom(room)} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-[2.5rem] shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:border-brand/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/10 px-4 py-1.5 rounded-full">{room.category}</span>
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{room.activeOnline} Active</span>
                      </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3 uppercase leading-snug group-hover:text-brand transition-colors">{room.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed italic opacity-90">"{room.description}"</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                           {[1, 2, 3].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i}-${room.id}`} className="w-8 h-8 rounded-xl border-2 border-white dark:border-slate-900 shadow-md" />)}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Admin: {room.admin_name || 'Rahul V.'}</span>
                     </div>
                     <div className="w-11 h-11 bg-slate-900 dark:bg-brand text-white rounded-2xl group-hover:scale-110 transition-all flex items-center justify-center shadow-lg">
                        <Icons.Plus className="w-6 h-6" />
                     </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* CREATE NEW ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Create New Study Cluster</h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-black">✕</button>
              </div>

              <div className="space-y-4 mb-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cluster Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Kochi CMA Part 1 Speed Sprints..."
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                       <select 
                         value={createCategory}
                         onChange={(e) => setCreateCategory(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                       >
                          <option value="CMA US Part 1">CMA US Part 1</option>
                          <option value="CMA US Part 2">CMA US Part 2</option>
                          <option value="Case Studies & Variance">Case Studies & Variance</option>
                          <option value="Ethics & Governance">Ethics & Governance</option>
                          <option value="Local Chapter">Local Chapter</option>
                       </select>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Privacy</label>
                       <select 
                         value={createPrivacy}
                         onChange={(e) => setCreatePrivacy(e.target.value as any)}
                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                       >
                          <option value="PUBLIC">Public</option>
                          <option value="INVITE_ONLY">Invite Only</option>
                       </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea 
                      placeholder="Cluster objective, meeting times, target topics..."
                      value={createDesc}
                      onChange={(e) => setCreateDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none h-20"
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Topics (Comma Separated)</label>
                    <input 
                      type="text"
                      placeholder="Cost Accounting, Internal Controls, Financial Ratio Analysis"
                      value={createTopics}
                      onChange={(e) => setCreateTopics(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-3">
                 <button onClick={() => setShowCreateModal(false)} className="px-5 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase">Cancel</button>
                 <button onClick={handleCreateCluster} className="px-6 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">Launch Cluster</button>
              </div>
           </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Add Scholar / Member</h3>
                 <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 font-black">✕</button>
              </div>

              <div className="space-y-4 mb-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Scholar Name or Handle</label>
                    <input 
                      type="text"
                      placeholder="e.g. Priya Nair"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Role Assignment</label>
                    <select 
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                    >
                       <option value="SCHOLAR">Scholar Member</option>
                       <option value="MODERATOR">Moderator</option>
                       <option value="FACULTY">Faculty Mentor</option>
                       <option value="ADMIN">Cluster Admin</option>
                    </select>
                 </div>
              </div>

              <div className="flex justify-end gap-3">
                 <button onClick={() => setShowAddMemberModal(false)} className="px-5 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase">Cancel</button>
                 <button onClick={handleAddMember} className="px-6 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest">Add Member</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
