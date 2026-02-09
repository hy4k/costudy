
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { Post, UserRole, UserLevel, Comment, ViewState, PostType, User, AlignmentPurpose, AlignmentDuration } from '../../types';
import { summarizePost } from '../../services/geminiService';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';

interface StudyWallProps {
  setView: (view: keyof ViewState) => void;
  isLoggedIn?: boolean;
  userId?: string;
  onAuthRequired?: (view?: 'LOGIN' | 'SIGNUP') => void;
  mode?: 'PUBLIC' | 'FACULTY';
}

// ... (Existing Constants: FALLBACK_POSTS, FACULTY_POSTS, MIN_CHARS, MAX_CHARS, TAGS...)
const FALLBACK_POSTS: any[] = [
  {
    id: 'p-fb-1',
    type: PostType.QUESTION,
    author: { name: 'Rohan Sharma', avatar: 'https://i.pravatar.cc/150?u=rohan', role: UserRole.STUDENT, level: UserLevel.LEARNER, signalLevel: 'ACTIVE_SOLVER' },
    author_id: 'rohan-id',
    content: "Can someone explain the Joint Cost concept in CMA Part 2? Specifically, how do we allocate costs when the sales value at split-off is unknown?",
    created_at: new Date().toISOString(),
    likes: 42,
    tags: ['CMA Part 2', 'Costing', 'Joint Costs'],
    subject: 'Cost Management'
  },
  {
    id: 'p-fb-2',
    type: PostType.RESOURCE,
    author: { name: 'Dr. Anita Desai', avatar: 'https://i.pravatar.cc/150?u=anita', role: UserRole.TEACHER, level: UserLevel.EXPERT, signalLevel: 'ACTIVE_SOLVER' },
    author_id: 'anita-id',
    content: "Just uploaded the summarized IMA Ethics notes for Part 1. Focus on the four overarching principles for this Sunday's mock.",
    created_at: new Date().toISOString(),
    likes: 128,
    tags: ['Part 1', 'Ethics', 'Study Guide'],
    subject: 'IMA Standards'
  },
  {
    id: 'p-audit-1',
    type: PostType.PEER_AUDIT_REQUEST,
    author: { name: 'Candidate #8842', avatar: '', role: UserRole.STUDENT, level: UserLevel.SCHOLAR, signalLevel: 'ACTIVE_SOLVER' },
    author_id: 'u-audit-req',
    content: "CASE FILE: Essay on Responsibility Accounting and Controllability Principle. \n\nScenario: Division Manager A is held responsible for allocated corporate overheads. Is this compliant with responsibility accounting?\n\nMy Argument: No, because allocated costs are non-controllable at the division level. Managers should only be evaluated on costs they can significantly influence.",
    created_at: new Date(Date.now() - 100000).toISOString(),
    likes: 0,
    tags: ['Audit Request', 'Essay Review', 'Part 1'],
    auditStatus: 'OPEN'
  },
  // Mock Bounty
  {
      id: 'p-bounty-1',
      type: PostType.BOUNTY,
      author: { name: 'Prof. Vikram Sethi', avatar: 'https://i.pravatar.cc/150?u=vikram', role: UserRole.TEACHER, level: UserLevel.EXPERT },
      author_id: 't-1',
      content: "TASK: Create a 1-page summary PDF of the 'COSO Framework' changes for 2025. Must include visual diagrams.",
      created_at: new Date().toISOString(),
      likes: 5,
      tags: ['Bounty', 'Research', 'Credits'],
      bountyDetails: {
          rewardAmount: 500,
          rewardType: 'CREDITS',
          status: 'OPEN'
      }
  }
];

const FACULTY_POSTS: any[] = [
    {
        id: 'f-1',
        type: PostType.FACULTY_DISCUSS,
        author: { name: 'Prof. Vikram Sethi', avatar: 'https://i.pravatar.cc/150?u=vikram', role: UserRole.TEACHER, level: UserLevel.EXPERT },
        author_id: 't-1',
        content: "Observing a trend in the latest Part 1 window: Students are struggling significantly with the new Tech & Analytics domain questions. Recommending deep-dive sessions on Data Governance.",
        created_at: new Date().toISOString(),
        likes: 15,
        tags: ['Exam Trends', 'Part 1', 'Curriculum'],
        subject: 'CMA Updates'
    },
    {
        id: 'f-2',
        type: PostType.RESOURCE,
        author: { name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=sarah', role: UserRole.TEACHER, level: UserLevel.EXPERT },
        author_id: 't-2',
        content: "Shared my 'Internal Controls' case study template in the shared drive. It's working well to engage students in practical application rather than rote memorization.",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        likes: 24,
        tags: ['Resources', 'Pedagogy', 'Case Study'],
        subject: 'Teaching Strategy'
    }
];

const MIN_CHARS = 30;
const MAX_CHARS = 600;

const STUDENT_TAGS = [
  'CMA Part 1', 'CMA Part 2', 'Financial Reporting', 'Cost Management', 
  'Internal Controls', 'Ethics', 'Decision Analysis', 'Investment Decisions', 
  'Mock Exam', 'Exam Strategy', 'Study Group'
];

const FACULTY_TAGS = [
    'Exam Updates', 'Pedagogy', 'Student Behavior', 'Curriculum Design',
    'IMA Standards', 'Resources', 'Career Guidance', 'Classroom Mgmt'
];

export const StudyWall: React.FC<StudyWallProps> = ({ setView, isLoggedIn = false, userId, onAuthRequired, mode = 'PUBLIC' }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(mode === 'FACULTY' ? 'Faculty Lounge' : 'All Feed');
  const [summary, setSummary] = useState<string | null>(null);
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<Record<string, Comment[]>>({});
  
  // Post modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<PostType>(mode === 'FACULTY' ? PostType.FACULTY_DISCUSS : PostType.QUESTION);
  const [newPostTags, setNewPostTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ALIGNMENT (CAN) STATE ---
  const [isAlignModalOpen, setIsAlignModalOpen] = useState(false);
  const [targetPeer, setTargetPeer] = useState<Partial<User> | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<AlignmentPurpose | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<AlignmentDuration | null>(null); // New Duration State
  const [alignmentNote, setAlignmentNote] = useState('');
  const [isSendingAlign, setIsSendingAlign] = useState(false);

  // --- AUDIT STATE ---
  const [auditTargetPost, setAuditTargetPost] = useState<Post | null>(null);
  const [auditVerdict, setAuditVerdict] = useState<'COMPLIANT' | 'NON_COMPLIANT' | null>(null);
  const [auditNotes, setAuditNotes] = useState('');

  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

  const tagsList = mode === 'FACULTY' ? FACULTY_TAGS : STUDENT_TAGS;
  const categories = mode === 'FACULTY' 
    ? ['Faculty Lounge', 'Exam Intelligence', 'Resource Exchange', 'Policy Updates']
    : ['All Feed', 'Audit Desk', 'Bounty Board', 'Strategic Notes', 'Expert Q&A', 'Discussions'];

  useEffect(() => {
      const loadProfile = async () => {
          if (userId) {
              const p = await getUserProfile(userId);
              setCurrentUserProfile(p);
          }
      };
      loadProfile();
  }, [userId]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        if (mode === 'FACULTY') {
             setTimeout(() => {
                 setPosts(FACULTY_POSTS as any);
                 setLoading(false);
             }, 600);
        } else {
            const data = await costudyService.getPosts(activeCategory);
            // MERGE FALLBACK POSTS IF DATA EMPTY OR FOR DEMO SAKE TO SHOW AUDIT
            const combined = [...(data || []), ...FALLBACK_POSTS];
            
            // Filter Logic
            let filtered = combined;
            if (activeCategory === 'Audit Desk') filtered = combined.filter(p => p.type === PostType.PEER_AUDIT_REQUEST);
            else if (activeCategory === 'Bounty Board') filtered = combined.filter(p => p.type === PostType.BOUNTY);
            else if (activeCategory !== 'All Feed') filtered = combined.filter(p => p.type !== PostType.PEER_AUDIT_REQUEST && p.type !== PostType.BOUNTY);

            // Remove duplicates
            const unique = Array.from(new Map(filtered.map(item => [item.id, item])).values());
            
            setPosts(unique as any);
            setLoading(false);
        }
      } catch (err: any) {
        setPosts(FALLBACK_POSTS as any);
        setLoading(false);
      }
    };
    fetchPosts();
  }, [activeCategory, mode]);

  const handleCreatePost = async () => {
    if (!userId) {
        onAuthRequired?.('LOGIN');
        return;
    }
    const charCount = newPostContent.length;
    if (charCount < MIN_CHARS || charCount > MAX_CHARS) return;

    setIsSubmitting(true);
    try {
      const post = await costudyService.createPost(userId, newPostContent, newPostType, newPostTags);
      setPosts(prev => [post, ...prev]);
      setNewPostContent('');
      setNewPostTags([]);
      setTagInput('');
      setIsPostModalOpen(false);
    } catch (err) {
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!newPostTags.includes(tagInput.trim())) {
      setNewPostTags([...newPostTags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewPostTags(newPostTags.filter(tag => tag !== tagToRemove));
  };

  const toggleTag = (tag: string) => {
    if (newPostTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setNewPostTags([...newPostTags, tag]);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const map: Record<string, Comment> = {};
    const roots: Comment[] = [];
    comments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies?.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  const loadDiscussion = async (postId: string) => {
    if (!isLoggedIn) {
        onAuthRequired?.('LOGIN');
        return;
    }
    if (openDiscussionId === postId) {
      setOpenDiscussionId(null);
      return;
    }
    try {
      setOpenDiscussionId(postId);
      const data = await costudyService.getPostDiscussion(postId);
      const threadedData = buildCommentTree(data);
      setDiscussions(prev => ({ ...prev, [postId]: threadedData }));
    } catch (err) {}
  };

  const handleSummarize = async (postId: string, content: string) => {
    if (!isLoggedIn) {
        onAuthRequired?.('LOGIN');
        return;
    }
    if (activeSummaryId === postId && summary) {
      setActiveSummaryId(null);
      return;
    }
    setActiveSummaryId(postId);
    const result = await summarizePost(content);
    setSummary(result);
  };

  // --- ALIGNMENT HANDLERS ---
  const initiateAlignment = (peer: Partial<User>) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      if (peer.id === userId) return; 

      // Signal Guard
      if (peer.signalLevel === 'SILENT_LEARNER' || peer.signalLevel === 'EXAM_WEEK') {
          alert(`Signal Intercepted: ${peer.name} is in ${peer.signalLevel?.replace('_', ' ')} mode and is not accepting protocols.`);
          return;
      }

      setTargetPeer(peer);
      setIsAlignModalOpen(true);
      setSelectedPurpose(null);
      setSelectedDuration(null); // Reset duration
      setAlignmentNote('');
  };

  const confirmAlignment = async () => {
      if (!selectedPurpose || !selectedDuration || !alignmentNote.trim()) return;
      setIsSendingAlign(true);
      
      // Simulate API call
      setTimeout(() => {
          setIsSendingAlign(false);
          setIsAlignModalOpen(false);
          alert(`Alignment Request Dispatched to ${targetPeer?.name}.\nPurpose: ${selectedPurpose}\nDuration: ${selectedDuration}\n\nThis contract is now pending acceptance.`);
      }, 1500);
  };

  // --- TRACKING HANDLER ---
  const handleTrackUser = (peer: Partial<User>) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      if (peer.id === userId) return;
      alert(`Radar Lock Established: ${peer.name}\n\nYou are now silently tracking their metrics.`);
  };

  // --- VOUCH HANDLER ---
  const handleVouch = (postId: string) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      // Optimistic Update
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      // In real app, call API
  };

  const handleClaimBounty = (post: Post) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      alert(`Bounty Claimed! Contact ${post.author?.name} via Messages to submit your work.`);
  };

  // --- AUDIT HANDLERS ---
  const openAuditPanel = (post: Post) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      // Visibility Guard: Only Active Solvers or Experts can audit
      if (currentUserProfile && (currentUserProfile.signalLevel === 'SILENT_LEARNER' || currentUserProfile.signalLevel === 'REVISION_FOCUSED')) {
          alert("Access Denied: You must be in 'Active Solver' or 'Essay Specialist' mode to perform Peer Audits.");
          return;
      }
      setAuditTargetPost(post);
      setAuditVerdict(null);
      setAuditNotes('');
  };

  const submitAudit = () => {
      if (!auditVerdict || !auditNotes) return;
      // In real app: API call to update post status, reward points to both.
      alert(`Audit Submitted.\nVerdict: ${auditVerdict}\n\nProfessional Skepticism Points Awarded to you.`);
      
      // Optimistic update
      setPosts(prev => prev.map(p => p.id === auditTargetPost?.id ? { ...p, auditStatus: auditVerdict } : p));
      setAuditTargetPost(null);
  };

  const CategoryButton = ({ label, active, onClick, isSpecial }: any) => (
    <div className="container-button" style={{ width: '160px' }} onClick={onClick}>
      <div className="hover-area bt-1"></div>
      <div className="hover-area bt-2"></div>
      <div className="hover-area bt-3"></div>
      <div className="hover-area bt-4"></div>
      <div className="hover-area bt-5"></div>
      <div className="hover-area bt-6"></div>
      <button className={`tilt-btn ${active ? 'active shadow-lg shadow-brand/20' : ''} ${isSpecial ? 'font-black border-brand/20 bg-white/40 text-slate-900' : ''}`} style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </button>
    </div>
  );

  const CommentItem = ({ comment, depth = 0, postId }: any) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');

    const submitReply = async () => {
      if (!replyText.trim() || !userId) return;
      try {
        await costudyService.createComment(postId, userId, replyText, comment.id);
        setReplyText('');
        setShowReplyInput(false);
        loadDiscussion(postId); 
      } catch (err: any) {
        alert("Action restricted. Please sign in.");
      }
    };

    return (
      <div className={`mt-6 ${depth > 0 ? 'ml-10 border-l-2 border-slate-100 pl-8' : ''}`}>
        <div className="flex gap-4">
          <img src={comment.author?.avatar || 'https://i.pravatar.cc/100'} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm" alt="" />
          <div className="flex-1">
            <div className="bg-slate-50/70 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{comment.author?.name || 'Anonymous'}</span>
                <span className="text-[10px] text-slate-400 font-bold">{comment.created_at ? new Date(comment.created_at).toLocaleTimeString() : 'now'}</span>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.content}</p>
            </div>
            <div className="flex gap-6 mt-3 ml-4">
               <button onClick={() => setShowReplyInput(!showReplyInput)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors">Reply</button>
               {/* Vouch for Comments too? Maybe just stick to main posts for now to avoid complexity */}
            </div>
            {showReplyInput && (
              <div className="mt-4 flex gap-3 animate-in slide-in-from-top-2 duration-300">
                <input 
                  type="text" 
                  autoFocus
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Share a thought..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:ring-4 focus:ring-brand/5"
                />
                <button onClick={submitReply} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Send</button>
              </div>
            )}
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
                {comment.replies.map((reply: any) => (
                    <CommentItem key={reply.id} comment={reply} depth={depth + 1} postId={postId} />
                ))}
            </div>
        )}
      </div>
    );
  };

  const charCount = newPostContent.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isUnderLimit = charCount > 0 && charCount < MIN_CHARS;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-12 flex flex-col items-center overflow-visible pb-24 sm:pb-12">
      
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-10 right-8 sm:bottom-12 sm:right-12 z-10">
        <button
          onClick={() => {
              if (isLoggedIn) setIsPostModalOpen(true);
              else onAuthRequired?.('LOGIN');
          }}
          className="group relative flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 bg-brand rounded-[2rem] text-white shadow-2xl shadow-brand/30 hover:shadow-brand/50 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
        >
            <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
                <Icons.Plus className="w-6 h-6 sm:w-10 sm:h-10 group-hover:rotate-90 transition-transform duration-300" />
            </div>
            
            <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none whitespace-nowrap hidden sm:block">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">New {mode === 'FACULTY' ? 'Announcement' : 'Broadcast'}</span>
            </div>
        </button>
      </div>

      {/* --- AUDIT PANEL MODAL --- */}
      {auditTargetPost && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#fffdf5] rounded-[2rem] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative border-[8px] border-slate-800 overflow-hidden">
                  {/* Audit Header */}
                  <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-xl"><Icons.Scale className="w-6 h-6 text-white" /></div>
                          <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight">Peer Audit Desk</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case ID: {auditTargetPost.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setAuditTargetPost(null)} className="text-white/50 hover:text-white"><Icons.Plus className="w-8 h-8 rotate-45" /></button>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      {/* Left: The Evidence (Post Content) */}
                      <div className="flex-1 p-10 overflow-y-auto border-r border-slate-200">
                          <div className="mb-8">
                              <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Candidate Submission</span>
                              <h2 className="text-2xl font-serif font-bold text-slate-900 mt-4 leading-tight">"{auditTargetPost.content}"</h2>
                          </div>
                          
                          {auditTargetPost.tags && (
                              <div className="flex flex-wrap gap-2 mb-8">
                                  {auditTargetPost.tags.map(t => <span key={t} className="px-2 py-1 border border-slate-300 text-slate-500 text-[10px] font-bold uppercase">{t}</span>)}
                              </div>
                          )}

                          <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 text-sm text-slate-600 italic">
                              "Please verify adherence to IMA standard 2C regarding Responsibility Accounting controllability logic."
                          </div>
                      </div>

                      {/* Right: The Evaluation Form */}
                      <div className="w-full md:w-96 bg-slate-50 p-10 overflow-y-auto flex flex-col gap-8">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">1. Verdict</label>
                              <div className="space-y-3">
                                  <button 
                                    onClick={() => setAuditVerdict('COMPLIANT')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${auditVerdict === 'COMPLIANT' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'}`}
                                  >
                                      <div className="font-black uppercase text-xs flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4" /> Compliant (Pass)</div>
                                  </button>
                                  <button 
                                    onClick={() => setAuditVerdict('NON_COMPLIANT')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${auditVerdict === 'NON_COMPLIANT' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200'}`}
                                  >
                                      <div className="font-black uppercase text-xs flex items-center gap-2"><Icons.AlertCircle className="w-4 h-4" /> Non-Compliant (Revision)</div>
                                  </button>
                              </div>
                          </div>

                          <div className="flex-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">2. Auditor Notes</label>
                              <textarea 
                                value={auditNotes}
                                onChange={(e) => setAuditNotes(e.target.value)}
                                placeholder="Cite specific concepts (e.g. 'Correct application of dual-rate method...')"
                                className="w-full h-40 bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-slate-400 resize-none"
                              />
                          </div>

                          <button 
                            onClick={submitAudit}
                            disabled={!auditVerdict || !auditNotes}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all disabled:opacity-50"
                          >
                              Seal Audit
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ALIGNMENT (CAN) MODAL --- */}
      {isAlignModalOpen && targetPeer && (
          <div className="fixed inset-0 z-50 bg-violet-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] w-full max-w-3xl p-8 md:p-12 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden border-2 border-violet-500/20 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500"></div>
                  
                  <button onClick={() => setIsAlignModalOpen(false)} className="absolute top-6 right-6 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900">
                      <Icons.Plus className="w-6 h-6 rotate-45" />
                  </button>

                  <div className="flex flex-col md:flex-row gap-8 mb-10">
                      <div className="shrink-0 flex flex-col items-center">
                          <img src={targetPeer.avatar || 'https://i.pravatar.cc/150'} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-violet-50 shadow-xl mb-4" />
                          <div className="text-center">
                              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{targetPeer.name}</h3>
                              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Target Peer</span>
                          </div>
                      </div>
                      
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-violet-100 text-violet-600 rounded-lg"><Icons.Link className="w-5 h-5" /></div>
                              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Alignment Protocol</h2>
                          </div>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">
                              You are initiating a formal academic connection. This is not a friend request; it is a commitment to mutual growth. Define the purpose and duration.
                          </p>
                      </div>
                  </div>

                  {/* Step 1: Purpose */}
                  <div className="mb-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">1. Select Contract Type</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.values(AlignmentPurpose).map((purpose) => (
                              <button
                                  key={purpose}
                                  onClick={() => setSelectedPurpose(purpose)}
                                  className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selectedPurpose === purpose ? 'border-violet-500 bg-violet-50 text-violet-900 shadow-lg scale-[1.02]' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-violet-200'}`}
                              >
                                  {selectedPurpose === purpose && <div className="absolute top-2 right-2 text-violet-500"><Icons.CheckCircle className="w-4 h-4" /></div>}
                                  <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70 group-hover:opacity-100">Type</div>
                                  <div className="text-xs md:text-sm font-bold leading-tight">{purpose}</div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Step 2: Duration */}
                  <div className="mb-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">2. Define Protocol Duration</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                              { label: 'Sprint', val: '7 Days' },
                              { label: 'Module', val: '14 Days' },
                              { label: 'Campaign', val: '30 Days' },
                              { label: 'Marathon', val: 'Until Exam' }
                          ].map((d) => (
                              <button
                                  key={d.val}
                                  onClick={() => setSelectedDuration(d.val as AlignmentDuration)}
                                  className={`p-3 rounded-2xl border-2 text-center transition-all ${selectedDuration === d.val ? 'border-violet-500 bg-violet-900 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-500 hover:border-violet-200'}`}
                              >
                                  <div className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">{d.label}</div>
                                  <div className="text-sm font-bold">{d.val}</div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Step 3: Goal */}
                  <div className="mb-10">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">3. Mission Goal (Mandatory)</label>
                      <textarea 
                          value={alignmentNote}
                          onChange={(e) => setAlignmentNote(e.target.value)}
                          placeholder="E.g., Complete Section A MCQs with 80% accuracy..."
                          className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all resize-none"
                      />
                  </div>

                  <button 
                      onClick={confirmAlignment}
                      disabled={!selectedPurpose || !selectedDuration || !alignmentNote.trim() || isSendingAlign}
                      className="w-full py-5 bg-violet-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-violet-900/20 hover:bg-violet-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                      {isSendingAlign ? (
                          <><Icons.CloudSync className="w-4 h-4 animate-spin" /> ESTABLISHING LINK...</>
                      ) : (
                          <>SEND CONTRACT <Icons.Send className="w-4 h-4" /></>
                      )}
                  </button>
              </div>
          </div>
      )}

      {/* New Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] sm:rounded-[4rem] w-full max-w-2xl p-8 md:p-12 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-visible border border-white/50 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 p-4 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 z-10"
            >
              <Icons.Plus className="w-8 h-8 rotate-45" />
            </button>
            
            <div className="mb-8 mt-4 sm:mt-0">
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">{mode === 'FACULTY' ? 'Faculty Insight' : 'Broadcasting...'}</h3>
                <p className="text-slate-500 font-medium text-sm md:text-base">
                    {mode === 'FACULTY' ? 'Share professional updates, teaching strategies, or industry news with colleagues.' : 'Share strategic knowledge. Keep it concise, professional, and exam-focused.'}
                </p>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {mode === 'FACULTY' ? (
                  [
                    { type: PostType.FACULTY_DISCUSS, label: 'Discussion', icon: <Icons.MessageCircle className="w-4 h-4" /> },
                    { type: PostType.RESOURCE, label: 'Resource Share', icon: <Icons.BookOpen className="w-4 h-4" /> },
                    { type: PostType.EVENT, label: 'Event', icon: <Icons.Calendar className="w-4 h-4" /> }
                  ].map(item => (
                    <button 
                      key={item.type}
                      onClick={() => setNewPostType(item.type)}
                      className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newPostType === item.type ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))
              ) : (
                  [
                    { type: PostType.QUESTION, label: 'Question', icon: <Icons.HelpCircle className="w-4 h-4" /> },
                    { type: PostType.RESOURCE, label: 'Resource', icon: <Icons.BookOpen className="w-4 h-4" /> },
                    { type: PostType.MCQ, label: 'MCQ Share', icon: <Icons.ClipboardList className="w-4 h-4" /> },
                    { type: PostType.PEER_AUDIT_REQUEST, label: 'Request Peer Audit', icon: <Icons.Scale className="w-4 h-4" /> }
                  ].map(item => (
                    <button 
                      key={item.type}
                      onClick={() => setNewPostType(item.type)}
                      className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newPostType === item.type ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))
              )}
            </div>

            <div className="relative mb-6">
                <textarea 
                  autoFocus
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={
                      mode === 'FACULTY' ? "Colleagues, regarding the recent changes to Part 2..." : 
                      newPostType === PostType.PEER_AUDIT_REQUEST ? "Paste your essay scenario and your argument here. Be precise." :
                      "What strategic insight have you learned today?"
                  }
                  className={`w-full h-40 p-8 bg-slate-50 rounded-[2.5rem] border-2 text-lg font-medium outline-none transition-all resize-none shadow-inner leading-relaxed ${isOverLimit ? 'border-rose-200 text-rose-500 bg-rose-50' : 'border-transparent focus:border-brand/30 focus:bg-white text-slate-800'}`}
                />
                
                {/* Character Counter */}
                <div className={`absolute bottom-6 right-8 text-[10px] font-black uppercase tracking-widest transition-colors ${isOverLimit ? 'text-rose-500' : isUnderLimit ? 'text-amber-500' : 'text-slate-400'}`}>
                    {charCount} / {MAX_CHARS}
                </div>
            </div>

            {/* TAGS SECTION */}
            <div className="mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 block ml-2">Strategic Tags</label>
                
                {/* Tag Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleAddTag}
                    placeholder="Add tags (press Enter)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/30 transition-all placeholder:text-slate-400 uppercase"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button 
                       onClick={handleAddTag} 
                       disabled={!tagInput.trim()}
                       className="p-2 bg-slate-200 text-slate-500 rounded-xl hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                    >
                      <Icons.Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Tags */}
                {newPostTags.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-6">
                      {newPostTags.map(tag => (
                        <div key={tag} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95">
                           <span>{tag}</span>
                           <button onClick={() => handleRemoveTag(tag)} className="hover:text-brand-200">
                             <Icons.Plus className="w-3 h-3 rotate-45" />
                           </button>
                        </div>
                      ))}
                   </div>
                )}

                {/* Suggested Tags */}
                <div className="flex flex-wrap gap-2">
                   {tagsList.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${newPostTags.includes(tag) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-brand/30 hover:text-brand'}`}
                      >
                         {tag}
                      </button>
                   ))}
                </div>
            </div>

            {isUnderLimit && (
                <div className="mb-6 flex items-center gap-2 text-amber-500 px-4">
                    <Icons.HelpCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Expansion Required: Minimum {MIN_CHARS} characters.</span>
                </div>
            )}
            
            {isOverLimit && (
                <div className="mb-6 flex items-center gap-2 text-rose-500 px-4">
                    <Icons.HelpCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Overflow Alert: Reduce payload by {charCount - MAX_CHARS} chars.</span>
                </div>
            )}

            <button 
              onClick={handleCreatePost}
              disabled={isSubmitting || isOverLimit || isUnderLimit}
              className={`w-full py-6 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 ${isSubmitting || isOverLimit || isUnderLimit ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand shadow-brand/30 hover:shadow-brand/50 hover:-translate-y-1 active:scale-95'}`}
            >
              {isSubmitting ? (
                  <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Synchronizing...</>
              ) : (
                  newPostType === PostType.PEER_AUDIT_REQUEST ? 'Submit for Audit' : 'Confirm Broadcast'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hero Header - Compact on mobile */}
      <header className="w-full text-center mb-6 sm:mb-12 relative py-6 sm:py-16 px-4 sm:px-10 overflow-hidden rounded-2xl sm:rounded-[4rem] bg-white/60 backdrop-blur-2xl border border-white/80 shadow-lg sm:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-brand/5 blur-[100px] -mr-20 -mt-20 rounded-full animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-none mb-2 sm:mb-4 select-none antialiased uppercase">
            {mode === 'FACULTY' ? 'FACULTY' : 'COSTUDY'}
          </h1>
          <h2 className="text-[10px] sm:text-sm md:text-lg font-bold tracking-[0.15em] sm:tracking-[0.3em] text-slate-400 uppercase select-none opacity-80 antialiased">
            {mode === 'FACULTY' ? 'ROOM & NETWORK' : 'CMA Success Network'}
          </h2>

          {/* Category Pills - Horizontal scroll on mobile */}
          <div className="mt-6 sm:mt-10 w-full overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-2 sm:gap-3 sm:flex-wrap sm:justify-center min-w-max sm:min-w-0">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-brand text-white shadow-lg' : 'bg-white/80 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content Wall - Social Media Feed Width */}
      <div className="w-full">
          {loading ? (
            <div className="flex flex-col items-center py-20 sm:py-40 gap-6 opacity-40">
               <Icons.Sparkles className="w-10 h-10 sm:w-16 sm:h-16 animate-spin text-brand" />
               <span className="font-bold uppercase tracking-widest text-xs sm:text-sm animate-pulse">Loading feed...</span>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {posts.map(post => {
                const isAuditRequest = post.type === PostType.PEER_AUDIT_REQUEST;
                const isBounty = post.type === PostType.BOUNTY;
                
                return (
                <article key={post.id} className={`relative bg-white border p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 ${isAuditRequest ? 'border-l-4 border-l-slate-800 border-slate-200' : isBounty ? 'border-l-4 border-l-brand border-slate-200 bg-slate-50/50' : 'border-slate-200'}`}>
                  {isAuditRequest && (
                      <div className="absolute top-0 left-0 right-0 h-6 sm:h-7 bg-slate-800 flex items-center justify-center rounded-t-xl sm:rounded-t-2xl">
                          <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider">Peer Audit</span>
                      </div>
                  )}
                  {isBounty && (
                      <div className="absolute top-0 left-0 right-0 h-6 sm:h-7 bg-brand flex items-center justify-center rounded-t-xl sm:rounded-t-2xl">
                          <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider">Bounty</span>
                      </div>
                  )}
                  
                  <div className={`flex items-start gap-3 mb-3 sm:mb-4 ${isAuditRequest || isBounty ? 'mt-4 sm:mt-5' : ''}`}>
                     <div className="relative shrink-0 cursor-pointer group/avatar" onClick={() => initiateAlignment(post.author || {})}>
                        {isAuditRequest ? (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                <Icons.Lock className="w-5 h-5" />
                            </div>
                        ) : isBounty ? (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand text-white flex items-center justify-center">
                                <Icons.Award className="w-5 h-5" />
                            </div>
                        ) : (
                            <>
                                <img src={post.author?.avatar || 'https://i.pravatar.cc/100'} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover" />
                                <div className="absolute -bottom-0.5 -right-0.5 bg-brand text-white p-0.5 rounded-md">
                                    <Icons.CheckBadge className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </div>
                            </>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{post.author?.name || 'Anonymous'}</h3>
                            <span className="text-[10px] text-slate-400 font-medium">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                           {post.type && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-500">{post.type.replace('_', ' ')}</span>}
                           {isAuditRequest && <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold text-white ${post.auditStatus === 'OPEN' ? 'bg-blue-500' : post.auditStatus === 'COMPLIANT' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{post.auditStatus || 'OPEN'}</span>}
                        </div>
                     </div>
                  </div>
                  
                  <div className="text-slate-700 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                    {post.content}
                  </div>

                  {/* Bounty Reward Box */}
                  {isBounty && post.bountyDetails && (
                      <div className="mb-4 p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-lg">
                                  <Icons.Award className="w-5 h-5 text-brand" />
                              </div>
                              <div>
                                  <div className="text-[9px] font-semibold uppercase text-slate-400">Reward</div>
                                  <div className="text-lg font-bold">{post.bountyDetails.rewardAmount} Credits</div>
                              </div>
                          </div>
                          <button 
                            onClick={() => handleClaimBounty(post)}
                            className="px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-bold uppercase active:scale-95"
                          >
                              Claim
                          </button>
                      </div>
                  )}

                  {/* Display Tags */}
                  {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-brand/5 text-brand rounded-md text-[9px] font-semibold">{tag}</span>
                          ))}
                      </div>
                  )}

                  {/* Action Bar - Compact on mobile */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                    <div className="flex gap-1">
                      {isAuditRequest ? (
                          <button 
                            onClick={() => openAuditPanel(post)}
                            disabled={post.auditStatus !== 'OPEN'}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold ${post.auditStatus !== 'OPEN' ? 'opacity-50' : 'active:scale-95'}`}
                          >
                            <Icons.Scale className="w-4 h-4" />
                            <span className="hidden sm:inline">Audit</span>
                          </button>
                      ) : (
                          <button onClick={() => handleVouch(post.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors active:scale-95">
                            <Icons.Stamp className="w-4 h-4" />
                            <span className="text-xs font-semibold">{post.likes || 0}</span>
                          </button>
                      )}
                      
                      <button onClick={() => loadDiscussion(post.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors active:scale-95 ${openDiscussionId === post.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        <Icons.MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold hidden sm:inline">Chat</span>
                      </button>
                    </div>
                    <button onClick={() => handleSummarize(post.id, post.content)} className="px-3 py-2 bg-brand/10 text-brand rounded-xl text-xs font-semibold hover:bg-brand hover:text-white transition-colors active:scale-95">
                        AI Summary
                    </button>
                  </div>

                  {openDiscussionId === post.id && (
                    <div className="mt-14 pt-14 border-t border-slate-100 animate-in slide-in-from-bottom-6 duration-700">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12">Knowledge Exchange Thread</h4>
                      <div className="space-y-6">
                        {discussions[post.id]?.map((comment: any) => (
                          <CommentItem key={comment.id} comment={comment} postId={post.id} />
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
              })}
            </div>
          )}
      </div>
    </div>
  );
};
