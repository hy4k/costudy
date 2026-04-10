
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../Icons';
import { CoStudyLogo } from '../CoStudyLogo';
import { Post, UserRole, UserLevel, Comment, ViewState, PostType, User, AlignmentPurpose, AlignmentDuration } from '../../types';
import { summarizePost } from '../../services/geminiService';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { alignmentService } from '../../services/alignmentService';

interface StudyWallProps {
  setView: (view: keyof ViewState) => void;
  isLoggedIn?: boolean;
  userId?: string;
  onAuthRequired?: (view?: 'LOGIN' | 'SIGNUP') => void;
  mode?: 'PUBLIC' | 'FACULTY';
}


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

/** Shown when the feed is empty (All Feed + public) so the wall never looks broken in demos. */
const DEMO_STUDY_WALL_POSTS: Post[] = [
  {
    id: 'demo-wall-1',
    type: PostType.QUESTION,
    author_id: 'demo-1',
    author: {
      name: 'Arjun M.',
      role: UserRole.STUDENT,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjunwall',
    },
    content:
      'When normalizing throughput for a plant with multiple products, do you allocate fixed costs at the bottleneck step or only at the final sellable unit? I am seeing conflicting answers in review materials.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    likes: 8,
    tags: ['CMA Part 1', 'Cost Management'],
  },
  {
    id: 'demo-wall-2',
    type: PostType.RESOURCE,
    author_id: 'demo-2',
    author: {
      name: 'Sneha R.',
      role: UserRole.STUDENT,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=snehawall',
    },
    content:
      'Compiled a one-page flowchart of COSO vs. IIA internal control expectations for the essay section. Happy to share if anyone wants a quick peer review before the exam window.',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    likes: 14,
    tags: ['Internal Controls', 'CMA Part 2'],
  },
  {
    id: 'demo-wall-3',
    type: PostType.MCQ,
    author_id: 'demo-3',
    author: {
      name: 'Marcus T.',
      role: UserRole.STUDENT,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcuswall',
    },
    content:
      "Drill question from today's set: when residual income uses a charge rate higher than WACC, does the project always look worse than under EVA? How does the exam usually frame this trade-off?",
    created_at: new Date(Date.now() - 50 * 3600000).toISOString(),
    likes: 21,
    tags: ['Decision Analysis', 'Investment Decisions'],
  },
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
  const [selectedDuration, setSelectedDuration] = useState<AlignmentDuration | null>(null);
  const [alignmentNote, setAlignmentNote] = useState('');
  const [isSendingAlign, setIsSendingAlign] = useState(false);

  // --- AUDIT STATE ---
  const [auditTargetPost, setAuditTargetPost] = useState<Post | null>(null);
  const [auditVerdict, setAuditVerdict] = useState<'COMPLIANT' | 'NON_COMPLIANT' | null>(null);
  const [auditNotes, setAuditNotes] = useState('');

  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

  // --- BOOKMARKS STATE ---
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('costudy_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // --- POLL STATE ---
  const [pollVotes, setPollVotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('costudy_poll_votes');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [alignFeedback, setAlignFeedback] = useState<string | null>(null);

  const tagsList = mode === 'FACULTY' ? FACULTY_TAGS : STUDENT_TAGS;
  const categories = mode === 'FACULTY'
    ? ['Faculty Lounge', 'Exam Intelligence', 'Resource Exchange', 'Policy Updates']
    : ['All Feed', 'Audit Desk', 'Bounty Board', 'Strategic Notes', 'Expert Q&A', 'Discussions'];

  const displayPosts = useMemo(() => {
    if (mode !== 'PUBLIC') return posts;
    if (posts.length > 0) return posts;
    if (activeCategory !== 'All Feed') return posts;
    return DEMO_STUDY_WALL_POSTS;
  }, [posts, mode, activeCategory]);

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
        const data = await costudyService.getPosts(activeCategory);
        const posts = data || [];

        let filtered = posts;
        if (mode !== 'FACULTY') {
          if (activeCategory === 'Audit Desk') filtered = posts.filter((p: any) => p.type === PostType.PEER_AUDIT_REQUEST);
          else if (activeCategory === 'Bounty Board') filtered = posts.filter((p: any) => p.type === PostType.BOUNTY);
          else if (activeCategory !== 'All Feed') filtered = posts.filter((p: any) => p.type !== PostType.PEER_AUDIT_REQUEST && p.type !== PostType.BOUNTY);
        }

        setPosts(filtered as any);
        setLoading(false);
      } catch (err: any) {
        setPosts([]);
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
      setAlignFeedback("Failed to create post. Please try again.");
      setTimeout(() => setAlignFeedback(null), 3000);
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

      if (peer.signalLevel === 'SILENT_LEARNER' || peer.signalLevel === 'EXAM_WEEK') {
          setAlignFeedback(`${peer.name} is in ${peer.signalLevel?.replace('_', ' ')} mode.`);
          setTimeout(() => setAlignFeedback(null), 3000);
          return;
      }

      setTargetPeer(peer);
      setIsAlignModalOpen(true);
      setSelectedPurpose(null);
      setSelectedDuration(null);
      setAlignmentNote('');
  };

  const confirmAlignment = async () => {
      if (!selectedPurpose || !selectedDuration || !alignmentNote.trim() || !userId || !targetPeer?.id) return;
      setIsSendingAlign(true);
      try {
          await alignmentService.sendRequest(userId, targetPeer.id as string, selectedPurpose, selectedDuration, alignmentNote);
          setIsAlignModalOpen(false);
          setAlignFeedback(`Study contract sent to ${targetPeer?.name}. Awaiting acceptance.`);
          setTimeout(() => setAlignFeedback(null), 4000);
      } catch (e) {
          setAlignFeedback('Failed to send contract. Please try again.');
          setTimeout(() => setAlignFeedback(null), 3000);
      } finally {
          setIsSendingAlign(false);
      }
  };

  // --- TRACKING HANDLER ---
  const handleTrackUser = async (peer: Partial<User>) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      if (!peer.id || peer.id === userId) return;
      try {
          await alignmentService.startTracking(userId!, peer.id as string);
          setAlignFeedback(`Now tracking ${peer.name}.`);
          setTimeout(() => setAlignFeedback(null), 3000);
      } catch (e) {}
  };

  // --- VOUCH HANDLER ---
  const handleVouch = (postId: string) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
      costudyService.likePost(postId);
  };

  // --- BOOKMARK HANDLER ---
  const toggleBookmark = (postId: string) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      setBookmarkedIds(prev => {
          const next = new Set(prev);
          if (next.has(postId)) {
              next.delete(postId);
              setAlignFeedback('Removed from saved');
          } else {
              next.add(postId);
              setAlignFeedback('Saved for exam review');
          }
          setTimeout(() => setAlignFeedback(null), 2000);
          localStorage.setItem('costudy_bookmarks', JSON.stringify([...next]));
          return next;
      });
  };

  // --- AUDIT HANDLERS ---
  const openAuditPanel = (post: Post) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      if (currentUserProfile && (currentUserProfile.signalLevel === 'SILENT_LEARNER' || currentUserProfile.signalLevel === 'REVISION_FOCUSED')) {
          setAlignFeedback("You must be in 'Active Solver' mode to perform Peer Audits.");
          setTimeout(() => setAlignFeedback(null), 3000);
          return;
      }
      setAuditTargetPost(post);
      setAuditVerdict(null);
      setAuditNotes('');
  };

  const submitAudit = async () => {
      if (!auditVerdict || !auditNotes || !auditTargetPost) return;
      try {
          await costudyService.updateAuditStatus(auditTargetPost.id, auditVerdict, auditNotes, userId);
          setPosts(prev => prev.map(p => p.id === auditTargetPost.id ? { ...p, auditStatus: auditVerdict } : p));
          setAuditTargetPost(null);
          setAlignFeedback('Audit submitted. Points awarded.');
          setTimeout(() => setAlignFeedback(null), 3000);
      } catch (e) {
          setPosts(prev => prev.map(p => p.id === auditTargetPost.id ? { ...p, auditStatus: auditVerdict } : p));
          setAuditTargetPost(null);
      }
  };

  const handleClaimBounty = (post: Post) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      setAlignFeedback(`Bounty claimed! Message ${post.author?.name} to submit your work.`);
      setTimeout(() => setAlignFeedback(null), 4000);
  };

  // --- POLL HANDLER ---
  const handlePollVote = (postId: string, option: string) => {
      if (!isLoggedIn) {
          onAuthRequired?.('LOGIN');
          return;
      }
      if (pollVotes[postId]) return; // already voted
      const next = { ...pollVotes, [postId]: option };
      setPollVotes(next);
      localStorage.setItem('costudy_poll_votes', JSON.stringify(next));
      // Optimistic: update local post poll data
      setPosts(prev => prev.map(p => {
          if (p.id !== postId || !p.pollOptions) return p;
          return {
              ...p,
              pollOptions: p.pollOptions.map((opt: any) =>
                  opt.label === option ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
              )
          };
      }));
  };

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
        setAlignFeedback("Action restricted. Please sign in.");
        setTimeout(() => setAlignFeedback(null), 3000);
      }
    };

    const wallClassic = mode !== 'FACULTY';

    return (
      <div className={`mt-4 ${depth > 0 ? (wallClassic ? 'ml-8 border-l-2 border-brand/15 pl-6' : 'ml-8 border-l-2 border-slate-100 pl-6') : ''}`}>
        <div className="flex gap-3">
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100 shrink-0" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
              {(comment.author?.name || 'A').charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div
              className={
                wallClassic
                  ? 'rounded-2xl border border-[#ebe3df] bg-[#fffdfb] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'rounded-2xl border border-slate-100 bg-slate-50 p-4'
              }
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">{comment.author?.name || 'Anonymous'}</span>
                <span className="text-[10px] text-slate-400">{comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
            </div>
            <button type="button" onClick={() => setShowReplyInput(!showReplyInput)} className="ml-2 mt-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:text-brand">Reply</button>
            {showReplyInput && (
              <div className="mt-3 flex animate-in gap-2 slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                  placeholder="Write a reply..."
                  className={
                    wallClassic
                      ? 'flex-1 rounded-xl border border-[#e5ddd9] bg-white px-4 py-2 text-xs outline-none focus:border-brand/35 focus:ring-2 focus:ring-brand/10'
                      : 'flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-brand/30 focus:ring-2 focus:ring-brand/10'
                  }
                />
                <button
                  type="button"
                  onClick={submitReply}
                  className={
                    wallClassic
                      ? 'rounded-xl bg-gradient-to-b from-brand to-brand-600 px-4 py-2 text-[10px] font-bold text-white shadow-sm hover:opacity-95'
                      : 'rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-bold text-white transition-colors hover:bg-brand'
                  }
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
            <div>
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

  const isStudentWall = mode !== 'FACULTY';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const postTypeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    QUESTION: { label: 'Question', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    RESOURCE: { label: 'Resource', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    RESOURCE_DROP: { label: 'Resource', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    MCQ: { label: 'MCQ', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    MCQ_SHARE: { label: 'MCQ', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    PEER_AUDIT_REQUEST: { label: 'Peer Audit', color: 'text-slate-100', bg: 'bg-slate-800', border: 'border-slate-700' },
    BOUNTY: { label: 'Bounty', color: 'text-white', bg: 'bg-brand', border: 'border-brand' },
    FACULTY_DISCUSS: { label: 'Faculty', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    EVENT: { label: 'Event', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
  };

  return (
    <div
      className={
        isStudentWall
          ? 'flex min-h-full w-full flex-col bg-gradient-to-b from-[#faf7f5] via-white to-[#f9f5f3] font-sans text-left'
          : 'flex min-h-full w-full flex-col font-sans text-left'
      }
    >
      <header
        className={
          isStudentWall
            ? 'relative w-full shrink-0 overflow-hidden border-b border-[#e8d4d4]/70 bg-gradient-to-b from-[#fffefc] via-[#fff8f6] to-[#fff4f0] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]'
            : 'relative w-full shrink-0 border-b border-slate-200/70 bg-gradient-to-b from-white via-slate-50/40 to-transparent'
        }
      >
        {isStudentWall ? (
          <div className="mx-auto max-w-3xl px-4 pb-6 pt-8 text-left sm:px-6 sm:pb-8 sm:pt-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1a0a0a] sm:text-[2.15rem]">Study Wall</h1>
          </div>
        ) : (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent"
              aria-hidden
            />
            <div className="mx-auto max-w-3xl px-4 pb-8 pt-10 text-left sm:px-6">
              <div className="flex items-start gap-4 text-left sm:gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
                  <Icons.MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Faculty</p>
                  <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[#1a0a0a] sm:text-[2.15rem]">Faculty wall</h1>
                  <p className="mt-3 max-w-[min(100%,40rem)] text-left text-sm leading-[1.7] text-slate-600">
                    Professional updates, resources, and discussion with your teaching colleagues.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch overflow-visible px-3 pb-24 pt-6 text-left sm:px-6 sm:pb-12 sm:pt-10">

      {/* TOAST FEEDBACK */}
      {alignFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top-4 duration-300">
          <div
            className={
              isStudentWall
                ? 'flex items-center gap-2.5 rounded-2xl border border-white/15 bg-gradient-to-r from-[#5c0a0a] to-[#890b0b] px-6 py-3.5 text-sm font-medium text-[#fff9f4] shadow-[0_20px_50px_-12px_rgba(89,11,11,0.55)] backdrop-blur-sm'
                : 'flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl'
            }
          >
            <Icons.CheckBadge className={`h-4 w-4 shrink-0 ${isStudentWall ? 'text-amber-200/90' : 'text-emerald-400'}`} />
            {alignFeedback}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-8 right-6 sm:bottom-10 sm:right-10 z-10">
        <button
          type="button"
          onClick={() => {
              if (isLoggedIn) setIsPostModalOpen(true);
              else onAuthRequired?.('LOGIN');
          }}
          className={
            isStudentWall
              ? 'group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-[#e01010] to-brand-900 text-white shadow-[0_16px_44px_-10px_rgba(237,0,0,0.55)] ring-2 ring-white/90 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_-12px_rgba(237,0,0,0.5)] active:scale-95 sm:h-16 sm:w-16'
              : 'group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 transition-all duration-300 hover:scale-105 hover:bg-brand hover:shadow-brand/30 active:scale-95 sm:h-16 sm:w-16'
          }
        >
            <Icons.Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </div>

      {/* --- AUDIT PANEL MODAL --- */}
      {auditTargetPost && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#fffdf5] rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-xl"><Icons.Scale className="w-6 h-6 text-white" /></div>
                          <div>
                              <h3 className="text-lg font-bold text-white">Peer Audit Desk</h3>
                              <p className="text-[10px] text-slate-400">Case ID: {auditTargetPost.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setAuditTargetPost(null)} className="text-white/50 hover:text-white transition-colors"><Icons.Plus className="w-6 h-6 rotate-45" /></button>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200">
                          <div className="mb-6">
                              <span className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase">Candidate Submission</span>
                              <h2 className="text-xl font-serif font-bold text-slate-900 mt-4 leading-relaxed">"{auditTargetPost.content}"</h2>
                          </div>

                          {auditTargetPost.tags && (
                              <div className="flex flex-wrap gap-2 mb-6">
                                  {auditTargetPost.tags.map(t => <span key={t} className="px-2 py-1 border border-slate-200 text-slate-500 text-[10px] rounded-md">{t}</span>)}
                              </div>
                          )}
                      </div>

                      <div className="w-full md:w-96 bg-slate-50 p-8 overflow-y-auto flex flex-col gap-6">
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Verdict</label>
                              <div className="space-y-2">
                                  <button
                                    onClick={() => setAuditVerdict('COMPLIANT')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${auditVerdict === 'COMPLIANT' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'}`}
                                  >
                                      <div className="font-bold text-xs flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4" /> Compliant</div>
                                  </button>
                                  <button
                                    onClick={() => setAuditVerdict('NON_COMPLIANT')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${auditVerdict === 'NON_COMPLIANT' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200'}`}
                                  >
                                      <div className="font-bold text-xs flex items-center gap-2"><Icons.AlertCircle className="w-4 h-4" /> Non-Compliant</div>
                                  </button>
                              </div>
                          </div>

                          <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Notes</label>
                              <textarea
                                value={auditNotes}
                                onChange={(e) => setAuditNotes(e.target.value)}
                                placeholder="Cite specific concepts..."
                                className="w-full h-40 bg-white border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-slate-400 resize-none"
                              />
                          </div>

                          <button
                            onClick={submitAudit}
                            disabled={!auditVerdict || !auditNotes}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all disabled:opacity-40"
                          >
                              Submit Audit
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ALIGNMENT (CAN) MODAL --- */}
      {isAlignModalOpen && targetPeer && (
          <div className="fixed inset-0 z-50 bg-violet-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl w-full max-w-3xl p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500"></div>

                  <button onClick={() => setIsAlignModalOpen(false)} className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900">
                      <Icons.Plus className="w-5 h-5 rotate-45" />
                  </button>

                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                      <div className="shrink-0 flex flex-col items-center">
                          {targetPeer.avatar ? (
                            <img src={targetPeer.avatar} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-100 shadow-lg mb-3" />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xl mb-3">
                              {(targetPeer.name || 'P').charAt(0)}
                            </div>
                          )}
                          <h3 className="text-base font-bold text-slate-900">{targetPeer.name}</h3>
                          <span className="text-[10px] text-violet-500 font-medium">Study Partner</span>
                      </div>

                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                              <Icons.Link className="w-4 h-4 text-violet-500" />
                              <h2 className="text-xl font-bold text-slate-900">Alignment Protocol</h2>
                          </div>
                          <p className="text-slate-500 text-sm leading-relaxed">
                              Initiate a formal study connection. Define the purpose and duration.
                          </p>
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Contract Type</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.values(AlignmentPurpose).map((purpose) => (
                              <button
                                  key={purpose}
                                  onClick={() => setSelectedPurpose(purpose)}
                                  className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPurpose === purpose ? 'border-violet-500 bg-violet-50 text-violet-900' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-violet-200'}`}
                              >
                                  <div className="text-xs font-bold leading-tight">{purpose}</div>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Duration</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                              { label: 'Sprint', val: '7 Days' },
                              { label: 'Module', val: '14 Days' },
                              { label: 'Campaign', val: '30 Days' },
                              { label: 'Marathon', val: 'Until Exam' }
                          ].map((d) => (
                              <button
                                  key={d.val}
                                  onClick={() => setSelectedDuration(d.val as AlignmentDuration)}
                                  className={`p-3 rounded-xl border-2 text-center transition-all ${selectedDuration === d.val ? 'border-violet-500 bg-violet-900 text-white' : 'border-slate-100 bg-white text-slate-500 hover:border-violet-200'}`}
                              >
                                  <div className="text-[10px] text-opacity-70 mb-0.5">{d.label}</div>
                                  <div className="text-sm font-bold">{d.val}</div>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Mission Goal</label>
                      <textarea
                          value={alignmentNote}
                          onChange={(e) => setAlignmentNote(e.target.value)}
                          placeholder="E.g., Complete Section A MCQs with 80% accuracy..."
                          className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50 transition-all resize-none"
                      />
                  </div>

                  <button
                      onClick={confirmAlignment}
                      disabled={!selectedPurpose || !selectedDuration || !alignmentNote.trim() || isSendingAlign}
                      className="w-full py-4 bg-violet-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-900/20 hover:bg-violet-800 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                      {isSendingAlign ? (
                          <><Icons.CloudSync className="w-4 h-4 animate-spin" /> Connecting...</>
                      ) : (
                          <>Send Contract <Icons.Send className="w-4 h-4" /></>
                      )}
                  </button>
              </div>
          </div>
      )}

      {/* New Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-30 flex animate-in items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xl fade-in duration-300">
          <div
            className={
              isStudentWall
                ? 'no-scrollbar relative max-h-[90vh] w-full max-w-2xl animate-in zoom-in-95 overflow-y-auto rounded-[1.75rem] border border-[#e8d4d4]/80 bg-gradient-to-b from-[#fffefc] to-white p-6 shadow-[0_24px_64px_-16px_rgba(137,11,11,0.18)] duration-500 md:p-8'
                : 'no-scrollbar relative max-h-[90vh] w-full max-w-2xl animate-in zoom-in-95 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl duration-500 md:p-8'
            }
          >
            {isStudentWall && (
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent md:inset-x-10"
                aria-hidden
              />
            )}
            <button
              type="button"
              onClick={() => setIsPostModalOpen(false)}
              className="absolute right-5 top-5 z-10 rounded-xl p-2 text-slate-400 transition-all hover:bg-black/[0.04] hover:text-slate-900"
            >
              <Icons.Plus className="h-5 w-5 rotate-45" />
            </button>

            <div className="mb-6">
                <h3 className="font-display mb-1 text-xl font-semibold text-[#1a0a0a]">
                  {mode === 'FACULTY' ? 'Faculty Insight' : 'Compose'}
                </h3>
                <p className="text-sm text-slate-600">
                    {mode === 'FACULTY' ? 'Share updates or strategies with colleagues.' : 'Share knowledge with fellow candidates—in the tradition of the Study Wall.'}
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {mode === 'FACULTY' ? (
                  [
                    { type: PostType.FACULTY_DISCUSS, label: 'Discussion', icon: <Icons.MessageCircle className="w-3.5 h-3.5" /> },
                    { type: PostType.RESOURCE, label: 'Resource', icon: <Icons.BookOpen className="w-3.5 h-3.5" /> },
                    { type: PostType.EVENT, label: 'Event', icon: <Icons.Calendar className="w-3.5 h-3.5" /> }
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewPostType(item.type)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${newPostType === item.type ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))
              ) : (
                  [
                    { type: PostType.QUESTION, label: 'Question', icon: <Icons.HelpCircle className="w-3.5 h-3.5" /> },
                    { type: PostType.RESOURCE, label: 'Resource', icon: <Icons.BookOpen className="w-3.5 h-3.5" /> },
                    { type: PostType.MCQ, label: 'MCQ', icon: <Icons.ClipboardList className="w-3.5 h-3.5" /> },
                    { type: PostType.PEER_AUDIT_REQUEST, label: 'Peer Audit', icon: <Icons.Scale className="w-3.5 h-3.5" /> }
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewPostType(item.type)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                        newPostType === item.type
                          ? 'bg-gradient-to-b from-brand to-brand-600 text-white shadow-[0_8px_22px_-6px_rgba(237,0,0,0.4)] ring-1 ring-white/25'
                          : 'border border-[#e8e4e2] bg-white text-slate-600 hover:border-brand/25 hover:bg-brand/[0.04] hover:text-brand-900'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))
              )}
            </div>

            <div className="relative mb-5">
                <textarea
                  autoFocus
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={
                      mode === 'FACULTY' ? "Share a professional update..." :
                      newPostType === PostType.PEER_AUDIT_REQUEST ? "Paste your essay scenario and argument." :
                      "What did you learn today?"
                  }
                  className={`h-36 w-full resize-none rounded-2xl border-2 p-5 text-sm font-medium leading-relaxed outline-none transition-all ${
                    isOverLimit
                      ? 'border-rose-200 bg-rose-50 text-rose-500'
                      : isStudentWall
                        ? 'border-[#ebe3e0] bg-white text-slate-800 focus:border-brand/35 focus:bg-[#fffdfb] focus:ring-2 focus:ring-brand/10'
                        : 'border-transparent bg-slate-50 text-slate-800 focus:border-brand/20 focus:bg-white'
                  }`}
                />
                <div className={`absolute bottom-4 right-5 text-[10px] font-medium transition-colors ${isOverLimit ? 'text-rose-500' : isUnderLimit ? 'text-amber-500' : 'text-slate-400'}`}>
                    {charCount}/{MAX_CHARS}
                </div>
            </div>

            {/* TAGS SECTION */}
            <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tags</label>

                <div className="relative mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleAddTag}
                    placeholder="Add tags (press Enter)"
                    className={
                      isStudentWall
                        ? 'w-full rounded-xl border border-[#e5ddd9] bg-[#fffdfb] px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10'
                        : 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-brand/20 focus:ring-2 focus:ring-brand/10'
                    }
                  />
                </div>

                {newPostTags.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mb-3">
                      {newPostTags.map(tag => (
                        <div
                          key={tag}
                          className={
                            isStudentWall
                              ? 'flex items-center gap-1.5 rounded-lg border border-brand-900/10 bg-gradient-to-r from-brand-900 to-[#5c0a0a] px-3 py-1.5 text-[10px] font-semibold text-[#fff9f4]'
                              : 'flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-medium text-white'
                          }
                        >
                           <span>{tag}</span>
                           <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-200/90">
                             <Icons.Plus className="w-3 h-3 rotate-45" />
                           </button>
                        </div>
                      ))}
                   </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                   {tagsList.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all ${
                          newPostTags.includes(tag)
                            ? isStudentWall
                              ? 'border-brand-900/20 bg-brand/[0.12] text-brand-900'
                              : 'border-slate-900 bg-slate-900 text-white'
                            : isStudentWall
                              ? 'border-[#e8e0dd] bg-white text-slate-500 hover:border-brand/30 hover:text-brand-900'
                              : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                        }`}
                      >
                         {tag}
                      </button>
                   ))}
                </div>
            </div>

            {isUnderLimit && (
                <div className="mb-4 flex items-center gap-2 text-amber-500 text-xs">
                    <Icons.HelpCircle className="w-3.5 h-3.5" />
                    <span>Minimum {MIN_CHARS} characters required.</span>
                </div>
            )}

            {isOverLimit && (
                <div className="mb-4 flex items-center gap-2 text-rose-500 text-xs">
                    <Icons.AlertCircle className="w-3.5 h-3.5" />
                    <span>Reduce by {charCount - MAX_CHARS} characters.</span>
                </div>
            )}

            <button
              type="button"
              onClick={handleCreatePost}
              disabled={isSubmitting || isOverLimit || isUnderLimit}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-lg transition-all ${
                isSubmitting || isOverLimit || isUnderLimit
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : isStudentWall
                    ? 'bg-gradient-to-r from-brand to-brand-900 shadow-[0_12px_32px_-10px_rgba(237,0,0,0.45)] hover:opacity-95 active:scale-[0.98]'
                    : 'bg-slate-900 hover:bg-brand active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                  <><Icons.CloudSync className="w-4 h-4 animate-spin" /> Publishing...</>
              ) : (
                  newPostType === PostType.PEER_AUDIT_REQUEST ? 'Submit for Audit' : 'Publish'
              )}
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY TABS — classic pill rail (student) */}
      <div className="mb-6 w-full overflow-x-auto text-left no-scrollbar">
        <div
          className={
            isStudentWall
              ? 'flex min-w-max justify-start gap-1.5 rounded-2xl border border-[#e8d4d4]/90 bg-white/75 p-1.5 shadow-[0_4px_28px_-8px_rgba(137,11,11,0.08)] backdrop-blur-md sm:gap-2 sm:p-2'
              : 'flex min-w-max justify-start gap-2'
          }
        >
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? isStudentWall
                    ? 'bg-gradient-to-b from-brand to-brand-600 text-white shadow-[0_8px_22px_-6px_rgba(237,0,0,0.45)] ring-1 ring-white/25'
                    : 'bg-brand text-white shadow-md shadow-brand/25 ring-1 ring-brand/30'
                  : isStudentWall
                    ? 'border border-transparent text-slate-700 hover:border-brand/20 hover:bg-brand/[0.05] hover:text-brand-900'
                    : 'border border-slate-200/90 bg-white/95 text-slate-700 hover:border-brand/35 hover:bg-brand/[0.07] hover:text-brand'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FEED */}
      <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-24">
               <div
                 className={
                   isStudentWall
                     ? 'h-9 w-9 animate-spin rounded-full border-[3px] border-[#e8d4d4] border-t-brand shadow-sm'
                     : 'h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand'
                 }
               />
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-20 text-center">
              <div
                className={
                  isStudentWall
                    ? 'flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e8d4d4]/80 bg-gradient-to-br from-white to-[#fff5f2] shadow-[0_8px_28px_-8px_rgba(137,11,11,0.1)]'
                    : 'flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'
                }
              >
                <Icons.PenLine className={isStudentWall ? 'h-6 w-6 text-brand/70' : 'h-5 w-5 text-slate-400'} />
              </div>
              <div>
                <p className="font-display mb-1.5 text-lg font-semibold text-[#1a0a0a]">
                  {activeCategory === 'All Feed' ? 'No posts yet' : `Nothing in ${activeCategory}`}
                </p>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-500">
                  Start a conversation—ask a question, share a resource, or help a peer along the way.
                </p>
              </div>
              <button
                type="button"
                onClick={() => isLoggedIn ? setIsPostModalOpen(true) : onAuthRequired?.('SIGNUP')}
                className={
                  isStudentWall
                    ? 'mt-1 rounded-xl bg-gradient-to-r from-brand to-brand-900 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(237,0,0,0.4)] transition hover:opacity-95'
                    : 'mt-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand'
                }
              >
                {isLoggedIn ? 'Write a post' : 'Sign up to post'}
              </button>
            </div>
          ) : (
            <div
              className={
                isStudentWall
                  ? 'space-y-0 overflow-hidden rounded-2xl border border-[#e5d4d0]/90 bg-[#fffdfb] text-left shadow-[0_16px_48px_-16px_rgba(137,11,11,0.09),inset_0_1px_0_rgba(255,255,255,0.95)]'
                  : 'space-y-px overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.08)]'
              }
            >
              {displayPosts.map((post, idx) => {
                const isAuditRequest = post.type === PostType.PEER_AUDIT_REQUEST;
                const isBounty = post.type === PostType.BOUNTY;
                const typeConf = postTypeConfig[post.type] || { label: post.type, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
                const isBookmarked = bookmarkedIds.has(post.id);
                const isPoll = !!(post as any).pollOptions?.length;
                const myVote = pollVotes[post.id];
                const isLast = idx === displayPosts.length - 1;

                return (
                <article
                  key={post.id}
                  className={`relative transition-colors ${
                    isStudentWall
                      ? `hover:bg-[#fffbf9]/90 ${!isLast ? 'border-b border-[#f0e6e3]' : ''}`
                      : `hover:bg-slate-50/50 ${!isLast ? 'border-b border-slate-100' : ''}`
                  }`}
                >
                  <div className="px-5 py-4 sm:px-6 sm:py-5">
                    {/* Author row */}
                    <div className="flex gap-3">
                      <div className="shrink-0 cursor-pointer mt-0.5" onClick={() => initiateAlignment(post.author || {})}>
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-blue-400/20 flex items-center justify-center text-slate-700 font-semibold text-sm">
                            {(post.author?.name || 'A').charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name line */}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-slate-900 text-[14px] truncate">{post.author?.name || 'Anonymous'}</span>
                          {post.author?.role === UserRole.TEACHER && (
                            <Icons.CheckBadge className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          <span className={`px-1.5 py-px rounded text-[10px] font-medium ${typeConf.bg} ${typeConf.color}`}>
                            {typeConf.label}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto shrink-0">{post.created_at ? timeAgo(post.created_at) : 'now'}</span>
                        </div>

                        {/* Content */}
                        <div className={`mt-1 text-left text-[15px] leading-[1.65] text-slate-800 ${isAuditRequest ? 'mt-2 rounded-lg border border-slate-200 bg-slate-100 p-3 font-mono text-xs' : ''}`}>
                          {post.content}
                        </div>

                        {/* Poll Options */}
                        {isPoll && (
                          <div className="mt-3 space-y-1.5">
                            {(post as any).pollOptions.map((opt: any) => {
                              const totalVotes = (post as any).pollOptions.reduce((s: number, o: any) => s + (o.votes || 0), 0);
                              const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                              const voted = myVote === opt.label;
                              return (
                                <button
                                  key={opt.label}
                                  onClick={() => handlePollVote(post.id, opt.label)}
                                  disabled={!!myVote}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all relative overflow-hidden ${
                                    voted ? 'border-brand bg-brand/5 font-semibold' :
                                    myVote ? 'border-slate-100 bg-slate-50' :
                                    'border-slate-200 hover:border-brand/40 bg-white'
                                  }`}
                                >
                                  {myVote && <div className="absolute inset-y-0 left-0 bg-brand/8 transition-all duration-500" style={{ width: `${pct}%` }} />}
                                  <div className="relative flex items-center justify-between">
                                    <span className="text-sm text-slate-700">{opt.label}</span>
                                    {myVote && <span className="text-xs font-semibold text-slate-500">{pct}%</span>}
                                  </div>
                                </button>
                              );
                            })}
                            {myVote && (
                              <p className="text-[11px] text-slate-400 pl-1">
                                {(post as any).pollOptions.reduce((s: number, o: any) => s + (o.votes || 0), 0)} votes
                              </p>
                            )}
                          </div>
                        )}

                        {/* Bounty Reward */}
                        {isBounty && post.bountyDetails && (
                          <div className="mt-3 flex items-center gap-3 p-3 bg-slate-900 rounded-lg text-white">
                            <Icons.Award className="w-4 h-4 text-brand shrink-0" />
                            <span className="text-sm font-semibold flex-1">{post.bountyDetails.rewardAmount} Credits</span>
                            <button
                              onClick={() => handleClaimBounty(post)}
                              className="px-3 py-1.5 bg-brand rounded-md text-xs font-semibold hover:bg-brand/90 active:scale-95 transition-all"
                            >
                              Claim
                            </button>
                          </div>
                        )}

                        {/* AI Summary */}
                        {activeSummaryId === post.id && (
                          <div className="mt-3">
                            {summary ? (
                              <div
                                className={
                                  isStudentWall
                                    ? 'rounded-xl border border-[#e8d4d4]/80 bg-gradient-to-br from-[#fffefb] to-[#fff5f2] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                                    : 'rounded-lg border border-violet-100 bg-violet-50 p-3'
                                }
                              >
                                <div className="mb-1.5 flex items-center gap-1.5">
                                  <Icons.Sparkles className={`h-3 w-3 ${isStudentWall ? 'text-brand' : 'text-violet-500'}`} />
                                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${isStudentWall ? 'text-brand-900/80' : 'text-violet-500'}`}>AI Summary</span>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
                                <span className="text-xs text-slate-400">Summarizing...</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {post.tags.map(tag => (
                              <span
                                key={tag}
                                className={
                                  isStudentWall
                                    ? 'cursor-pointer text-xs font-medium text-brand-900/70 hover:text-brand hover:underline'
                                    : 'cursor-pointer text-xs text-blue-500 hover:underline'
                                }
                              >
                                #{tag.replace(/\s+/g, '')}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Bar — Twitter-style row */}
                        <div className="flex items-center mt-3 -ml-2">
                          {isAuditRequest ? (
                            <button
                              type="button"
                              onClick={() => openAuditPanel(post)}
                              disabled={post.auditStatus !== 'OPEN'}
                              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                                post.auditStatus !== 'OPEN'
                                  ? 'cursor-not-allowed text-slate-300'
                                  : isStudentWall
                                    ? 'text-slate-500 hover:bg-brand/[0.07] hover:text-brand-900'
                                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-500'
                              }`}
                            >
                              <Icons.Scale className="w-4 h-4" />
                              <span>Audit</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVouch(post.id)}
                              className="group flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Icons.Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              {(post.likes || 0) > 0 && <span>{post.likes}</span>}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => loadDiscussion(post.id)}
                            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors ${
                              openDiscussionId === post.id
                                ? isStudentWall
                                  ? 'bg-brand/10 text-brand-900'
                                  : 'bg-blue-50 text-blue-500'
                                : isStudentWall
                                  ? 'text-slate-500 hover:bg-brand/[0.06] hover:text-brand-900'
                                  : 'text-slate-500 hover:bg-blue-50 hover:text-blue-500'
                            }`}
                          >
                            <Icons.MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Reply</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSummarize(post.id, post.content)}
                            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors ${
                              activeSummaryId === post.id && summary
                                ? isStudentWall
                                  ? 'bg-[#faf5f5] text-brand-900 ring-1 ring-brand/15'
                                  : 'bg-violet-50 text-violet-500'
                                : isStudentWall
                                  ? 'text-slate-500 hover:bg-brand/[0.05] hover:text-brand-900'
                                  : 'text-slate-500 hover:bg-violet-50 hover:text-violet-500'
                            }`}
                          >
                            <Icons.Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline">AI</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleBookmark(post.id)}
                            className={`ml-auto flex items-center rounded-full px-3 py-1.5 text-xs transition-colors ${
                              isBookmarked
                                ? isStudentWall
                                  ? 'text-brand'
                                  : 'text-amber-500'
                                : isStudentWall
                                  ? 'text-slate-400 hover:bg-brand/[0.06] hover:text-brand'
                                  : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
                            }`}
                          >
                            <Icons.Flag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discussion thread */}
                  {openDiscussionId === post.id && (
                    <div
                      className={
                        isStudentWall
                          ? 'border-t border-[#f0e6e3] bg-gradient-to-b from-[#fff9f7]/90 to-[#faf7f5]/80 px-5 pb-4 sm:px-6'
                          : 'border-t border-slate-100 bg-slate-50/30 px-5 pb-4 sm:px-6'
                      }
                    >
                      <h4 className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Replies</h4>
                      {discussions[post.id]?.length === 0 && (
                        <p className="text-xs text-slate-400 py-2">No replies yet.</p>
                      )}
                      <div>
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
    </div>
  );
};
