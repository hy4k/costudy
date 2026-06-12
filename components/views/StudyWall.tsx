import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../Icons';
import { Post, UserRole, Comment, ViewState, PostType, User, AlignmentPurpose, AlignmentDuration } from '../../types';
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

/** PostType → redesign type-chip class + label */
const TYPE_CHIP: Record<string, { label: string; cls: string }> = {
  QUESTION: { label: 'Question', cls: 'type-question' },
  RESOURCE: { label: 'Resource', cls: 'type-resource' },
  RESOURCE_DROP: { label: 'Resource', cls: 'type-resource' },
  MCQ: { label: 'MCQ Drill', cls: 'type-mcq' },
  MCQ_SHARE: { label: 'MCQ Drill', cls: 'type-mcq' },
  PEER_AUDIT_REQUEST: { label: 'Peer Audit', cls: 'type-audit' },
  BOUNTY: { label: 'Bounty', cls: 'type-bounty' },
  FACULTY_DISCUSS: { label: 'Discussion', cls: 'type-discuss' },
  EVENT: { label: 'Event', cls: 'type-event' },
};

export const StudyWall: React.FC<StudyWallProps> = ({ setView, isLoggedIn = false, userId, onAuthRequired, mode = 'PUBLIC' }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(mode === 'FACULTY' ? 'Faculty Lounge' : 'All Feed');
  const [summary, setSummary] = useState<string | null>(null);
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<Record<string, Comment[]>>({});

  // Post composer state
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
        const data = await costudyService.getPosts(activeCategory);
        const fetched = data || [];

        let filtered = fetched;
        if (mode !== 'FACULTY') {
          if (activeCategory === 'Audit Desk') filtered = fetched.filter((p: any) => p.type === PostType.PEER_AUDIT_REQUEST);
          else if (activeCategory === 'Bounty Board') filtered = fetched.filter((p: any) => p.type === PostType.BOUNTY);
          else if (activeCategory !== 'All Feed') filtered = fetched.filter((p: any) => p.type !== PostType.PEER_AUDIT_REQUEST && p.type !== PostType.BOUNTY);
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

  const toast = (msg: string, ms = 3000) => {
    setAlignFeedback(msg);
    setTimeout(() => setAlignFeedback(null), ms);
  };

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
      toast('Failed to create post. Please try again.');
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
    setNewPostTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const toggleTag = (tag: string) => {
    if (newPostTags.includes(tag)) handleRemoveTag(tag);
    else setNewPostTags([...newPostTags, tag].slice(0, 5));
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
      setDiscussions(prev => ({ ...prev, [postId]: buildCommentTree(data) }));
    } catch (err) { /* view simply shows "no replies" */ }
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
    setSummary(null);
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
      toast(`${peer.name} is in ${peer.signalLevel?.replace('_', ' ')} mode.`);
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
      toast(`Study contract sent to ${targetPeer?.name}. Awaiting acceptance.`, 4000);
    } catch (e) {
      toast('Failed to send contract. Please try again.');
    } finally {
      setIsSendingAlign(false);
    }
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
        toast('Removed from saved', 2000);
      } else {
        next.add(postId);
        toast('Saved for exam review', 2000);
      }
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
      toast("You must be in 'Active Solver' mode to perform Peer Audits.");
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
      toast('Audit submitted. Points awarded.');
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
    toast(`Bounty claimed! Message ${post.author?.name} to submit your work.`, 4000);
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
    setPosts(prev => prev.map(p => {
      if (p.id !== postId || !(p as any).pollOptions) return p;
      return {
        ...p,
        pollOptions: (p as any).pollOptions.map((opt: any) =>
          opt.label === option ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
        )
      } as Post;
    }));
  };

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

  // ---------- Threaded comment (clay) ----------
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
        toast('Action restricted. Please sign in.');
      }
    };

    return (
      <div style={depth > 0 ? { marginLeft: 26, paddingLeft: 14, borderLeft: '2px solid var(--line)' } : undefined}>
        <div className="comment">
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} alt="" style={{ width: 30, height: 30, borderRadius: 10, objectFit: 'cover', flex: 'none' }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: 10, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 12 }}>
              {(comment.author?.name || 'A').charAt(0)}
            </div>
          )}
          <div className="comment-body">
            <div className="comment-head">
              <strong>{comment.author?.name || 'Anonymous'}</strong>
              {comment.author?.role === UserRole.TEACHER && (
                <span className="role-chip role-mentor"><Icons.CheckBadge className="w-2.5 h-2.5" /> Mentor</span>
              )}
              <span className="comment-time">
                {comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
              </span>
            </div>
            <p>{comment.content}</p>
            <button
              type="button"
              onClick={() => setShowReplyInput(!showReplyInput)}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginTop: 4 }}
            >
              Reply
            </button>
            {showReplyInput && (
              <div className="comment-input" style={{ marginTop: 8 }}>
                <input
                  type="text"
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                  placeholder="Write a reply…"
                />
                <button type="button" className="comment-send" onClick={submitReply} aria-label="Send">
                  <Icons.Send className="w-3.5 h-3.5" />
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
  const trimmedCount = newPostContent.trim().length;
  const isUnderLimit = charCount > 0 && trimmedCount < MIN_CHARS;
  const canPublish = !isSubmitting && trimmedCount >= MIN_CHARS && charCount <= MAX_CHARS;

  const isFaculty = mode === 'FACULTY';

  const composerTypes = isFaculty
    ? [
        { type: PostType.FACULTY_DISCUSS, label: 'Discussion' },
        { type: PostType.RESOURCE, label: 'Resource' },
        { type: PostType.EVENT, label: 'Event' },
      ]
    : [
        { type: PostType.QUESTION, label: 'Question' },
        { type: PostType.RESOURCE, label: 'Resource' },
        { type: PostType.MCQ, label: 'MCQ Drill' },
        { type: PostType.PEER_AUDIT_REQUEST, label: 'Peer Audit' },
      ];

  const openComposer = () => {
    if (isLoggedIn) setIsPostModalOpen(true);
    else onAuthRequired?.('LOGIN');
  };

  const eyebrow: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
  };

  return (
    <div className="proto wall-embedded" data-theme={isFaculty ? 'faculty' : undefined}>
      <div className="wall" data-page="wall">
        <main className="shell-solo shell-feed">
          {/* Masthead */}
          <div className="feed-hello">
            <h1 className="font-display">{isFaculty ? 'Staff Room' : 'Study Wall'}</h1>
            <p>{isFaculty ? 'Updates, pedagogy, and shop talk — colleagues only.' : 'Questions, drills, and wins from candidates like you.'}</p>
          </div>

          {/* Category tabs */}
          <div className="feed-cats" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                className={`cat ${activeCategory === cat ? 'on' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Composer prompt */}
          <button type="button" className="feed-prompt" onClick={openComposer}>
            {currentUserProfile?.avatar ? (
              <img src={currentUserProfile.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <span style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)' }}>
                <Icons.PenLine className="w-4 h-4" />
              </span>
            )}
            <span>{isFaculty ? 'Share an update with colleagues…' : 'Ask the wall anything…'}</span>
            <span className="feed-prompt-ic"><Icons.Plus className="w-4 h-4" /></span>
          </button>

          {/* Feed */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid var(--line)', borderTopColor: 'var(--accent)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          ) : displayPosts.length === 0 ? (
            <article className="post" style={{ textAlign: 'center', padding: '48px 28px' }}>
              <div style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', boxShadow: 'var(--nm-xs)' }}>
                <Icons.PenLine className="w-6 h-6" />
              </div>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                {activeCategory === 'All Feed' ? 'No posts yet' : `Nothing in ${activeCategory}`}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', maxWidth: 320, margin: '8px auto 18px' }}>
                Start a conversation — ask a question, share a resource, or help a peer along the way.
              </p>
              <button
                type="button"
                className="clay-cta"
                style={{ maxWidth: 220, margin: '0 auto' }}
                onClick={() => isLoggedIn ? setIsPostModalOpen(true) : onAuthRequired?.('SIGNUP')}
              >
                {isLoggedIn ? 'Write a post' : 'Sign up to post'}
              </button>
            </article>
          ) : (
            <div className="feed-posts">
              {displayPosts.map((post) => {
                const isAuditRequest = post.type === PostType.PEER_AUDIT_REQUEST;
                const isBounty = post.type === PostType.BOUNTY;
                const chip = TYPE_CHIP[post.type] || { label: String(post.type), cls: '' };
                const isBookmarked = bookmarkedIds.has(post.id);
                const pollOptions = (post as any).pollOptions as { label: string; votes?: number }[] | undefined;
                const myVote = pollVotes[post.id];
                const discussOpen = openDiscussionId === post.id;
                const summaryOpen = activeSummaryId === post.id;

                return (
                  <article key={post.id} className="post">
                    {/* Header */}
                    <header className="post-head">
                      <button type="button" onClick={() => initiateAlignment(post.author || {})} style={{ flex: 'none' }} aria-label={`Connect with ${post.author?.name || 'author'}`}>
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt="" style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover' }} />
                        ) : (
                          <span style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800 }}>
                            {(post.author?.name || 'A').charAt(0)}
                          </span>
                        )}
                      </button>
                      <div className="post-meta">
                        <div className="post-author-row">
                          <strong className="post-author">{post.author?.name || 'Anonymous'}</strong>
                          {post.author?.role === UserRole.TEACHER && (
                            <span className="role-chip role-mentor"><Icons.CheckBadge className="w-2.5 h-2.5" /> Mentor</span>
                          )}
                        </div>
                        <div className="post-sub">
                          <span className={`type-chip ${chip.cls}`}>{chip.label}</span>
                          <span className="post-time">{post.created_at ? timeAgo(post.created_at) : 'now'}</span>
                        </div>
                      </div>
                    </header>

                    {/* Body */}
                    <p className="post-body" style={isAuditRequest ? { fontFamily: 'Geist Mono, ui-monospace, monospace', fontSize: '0.82rem', background: 'var(--inset-bg)', borderRadius: 14, padding: '12px 14px', boxShadow: 'var(--nm-inset-sm)' } : undefined}>
                      {post.content}
                    </p>

                    {/* Poll */}
                    {pollOptions && pollOptions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, margin: '4px 0 8px' }}>
                        {pollOptions.map((opt) => {
                          const totalVotes = pollOptions.reduce((s, o) => s + (o.votes || 0), 0);
                          const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                          const voted = myVote === opt.label;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              className={`poll-opt ${voted ? 'voted' : ''}`}
                              disabled={!!myVote}
                              onClick={() => handlePollVote(post.id, opt.label)}
                            >
                              {myVote && <span className="poll-fill" style={{ width: `${pct}%` }} />}
                              <span style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ink)' }}>
                                <span>{opt.label}</span>
                                {myVote && <span style={{ fontWeight: 700, color: 'var(--muted)' }}>{pct}%</span>}
                              </span>
                            </button>
                          );
                        })}
                        {myVote && (
                          <p style={{ fontSize: 11, color: 'var(--muted)', paddingLeft: 4 }}>
                            {pollOptions.reduce((s, o) => s + (o.votes || 0), 0)} votes
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bounty */}
                    {isBounty && post.bountyDetails && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'var(--accent-soft)', boxShadow: 'var(--nm-xs)', margin: '4px 0 8px' }}>
                        <Icons.Award className="w-4 h-4" style={{ color: 'var(--accent-deep)' }} />
                        <span style={{ flex: 1, fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-deep)' }}>{post.bountyDetails.rewardAmount} Credits</span>
                        <button type="button" className="clay-cta" style={{ width: 'auto', padding: '8px 18px', fontSize: '0.75rem' }} onClick={() => handleClaimBounty(post)}>
                          Claim
                        </button>
                      </div>
                    )}

                    {/* AI summary */}
                    {summaryOpen && (
                      <div className="ai-summary">
                        <span className="ai-chip"><Icons.Sparkles className="w-3 h-3" /> AI recap</span>
                        {summary ? <p>{summary}</p> : <p style={{ color: 'var(--muted)' }}>Summarizing…</p>}
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="post-tags">
                        {post.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                      </div>
                    )}

                    {/* Actions */}
                    <footer className="post-actions">
                      {isAuditRequest ? (
                        <button
                          type="button"
                          className="act"
                          disabled={post.auditStatus !== 'OPEN'}
                          style={post.auditStatus !== 'OPEN' ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                          onClick={() => openAuditPanel(post)}
                        >
                          <span className="act-ic"><Icons.Scale className="w-[18px] h-[18px]" /></span>
                          <span className="act-label">Audit</span>
                        </button>
                      ) : (
                        <button type="button" className="act act-vouch" onClick={() => handleVouch(post.id)}>
                          <span className="act-ic"><Icons.Heart className="w-[18px] h-[18px]" /></span>
                          <span className="act-label">Vouch</span>
                          {(post.likes || 0) > 0 && <span className="act-count">{post.likes}</span>}
                        </button>
                      )}

                      <button type="button" className={`act ${discussOpen ? 'act-on' : ''}`} onClick={() => loadDiscussion(post.id)}>
                        <span className="act-ic"><Icons.MessageCircle className="w-[18px] h-[18px]" /></span>
                        <span className="act-label">Discuss</span>
                        {(discussions[post.id]?.length || 0) > 0 && <span className="act-count">{discussions[post.id].length}</span>}
                      </button>

                      <span className="act-spacer"></span>

                      <button
                        type="button"
                        className={`act act-icon-only ${summaryOpen && summary ? 'act-on' : ''}`}
                        onClick={() => handleSummarize(post.id, post.content)}
                        aria-label="AI summary"
                      >
                        <span className="act-ic"><Icons.Sparkles className="w-[18px] h-[18px]" /></span>
                      </button>
                      <button
                        type="button"
                        className={`act act-icon-only ${isBookmarked ? 'act-on' : ''}`}
                        onClick={() => toggleBookmark(post.id)}
                        aria-label="Bookmark"
                      >
                        <span className="act-ic"><Icons.Flag className="w-[18px] h-[18px]" /></span>
                      </button>
                    </footer>

                    {/* Discussion thread */}
                    {discussOpen && (
                      <div className="discuss">
                        {(discussions[post.id]?.length || 0) === 0 && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', padding: '4px 0' }}>No replies yet.</p>
                        )}
                        {discussions[post.id]?.map((comment: any) => (
                          <CommentItem key={comment.id} comment={comment} postId={post.id} />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
              <div className="feed-end">You're all caught up</div>
            </div>
          )}
        </main>

        {/* Toast */}
        {alignFeedback && (
          <div className="wall-toast" role="status">
            <Icons.CheckBadge className="w-4 h-4" />
            {alignFeedback}
          </div>
        )}

        {/* Floating compose button */}
        <button type="button" className="wall-fab" onClick={openComposer} aria-label="New post">
          <Icons.Plus className="w-6 h-6" />
        </button>

        {/* ---------- Composer modal ---------- */}
        {isPostModalOpen && (
          <div className="modal-veil" onClick={(e) => { if (e.target === e.currentTarget) setIsPostModalOpen(false); }}>
            <div className="composer" role="dialog" aria-modal="true" aria-label="New post">
              <div className="composer-grip" aria-hidden="true"></div>
              <header className="composer-head">
                <h3>{isFaculty ? 'Faculty insight' : 'New post'}</h3>
                <button type="button" className="composer-x" onClick={() => setIsPostModalOpen(false)} aria-label="Close">
                  <Icons.Plus className="w-[18px] h-[18px] rotate-45" />
                </button>
              </header>

              <div className="composer-types">
                {composerTypes.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={`seg ${newPostType === item.type ? 'seg-on' : ''}`}
                    onClick={() => setNewPostType(item.type)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                className="composer-text"
                autoFocus
                value={newPostContent}
                maxLength={MAX_CHARS}
                placeholder={
                  isFaculty ? 'Share an update or open a discussion with colleagues…' :
                  newPostType === PostType.PEER_AUDIT_REQUEST ? 'Paste your essay scenario and argument for peer review…' :
                  'Ask the wall — be specific, cite the concept you’re stuck on…'
                }
                onChange={(e) => setNewPostContent(e.target.value)}
              ></textarea>

              <div className="composer-tags">
                {tagsList.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag tag-pick ${newPostTags.includes(tag) ? 'tag-on' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Custom tag input + picked custom tags */}
              <div className="comment-input" style={{ marginTop: 10 }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleAddTag}
                  placeholder="Add your own tag (press Enter)"
                />
              </div>
              {newPostTags.filter(t => !tagsList.includes(t)).length > 0 && (
                <div className="composer-tags" style={{ marginTop: 8 }}>
                  {newPostTags.filter(t => !tagsList.includes(t)).map(tag => (
                    <button key={tag} type="button" className="tag tag-pick tag-on" onClick={() => handleRemoveTag(tag)}>
                      {tag} ✕
                    </button>
                  ))}
                </div>
              )}

              <footer className="composer-foot">
                <span className={`charcount ${isUnderLimit ? 'charcount-low' : ''}`}>
                  {trimmedCount < MIN_CHARS ? `${Math.max(0, MIN_CHARS - trimmedCount)} more chars` : `${charCount}/${MAX_CHARS}`}
                </span>
                <button type="button" className="btn-post" disabled={!canPublish} onClick={handleCreatePost}>
                  {isSubmitting ? 'Publishing…' : newPostType === PostType.PEER_AUDIT_REQUEST ? 'Submit for audit' : 'Post to wall'}
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ---------- Peer Audit modal ---------- */}
        {auditTargetPost && (
          <div className="modal-veil" onClick={(e) => { if (e.target === e.currentTarget) setAuditTargetPost(null); }}>
            <div className="clay-modal" role="dialog" aria-modal="true" aria-label="Peer audit desk">
              <header className="composer-head" style={{ marginBottom: 14 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.Scale className="w-5 h-5" style={{ color: 'var(--accent-deep)' }} /> Peer Audit Desk
                </h3>
                <button type="button" className="composer-x" onClick={() => setAuditTargetPost(null)} aria-label="Close">
                  <Icons.Plus className="w-[18px] h-[18px] rotate-45" />
                </button>
              </header>

              <p style={eyebrow}>Candidate submission · Case {auditTargetPost.id.slice(0, 8)}</p>
              <p className="post-body" style={{ background: 'var(--inset-bg)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--nm-inset-sm)', marginBottom: 14 }}>
                “{auditTargetPost.content}”
              </p>
              {auditTargetPost.tags && auditTargetPost.tags.length > 0 && (
                <div className="post-tags" style={{ marginBottom: 16 }}>
                  {auditTargetPost.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              )}

              <p style={eyebrow}>Verdict</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button type="button" className={`clay-option ${auditVerdict === 'COMPLIANT' ? 'on' : ''}`} onClick={() => setAuditVerdict('COMPLIANT')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.CheckCircle className="w-4 h-4" /> Compliant</span>
                </button>
                <button type="button" className={`clay-option ${auditVerdict === 'NON_COMPLIANT' ? 'on' : ''}`} onClick={() => setAuditVerdict('NON_COMPLIANT')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icons.AlertCircle className="w-4 h-4" /> Non-Compliant</span>
                </button>
              </div>

              <p style={eyebrow}>Notes</p>
              <textarea
                className="clay-textarea"
                style={{ height: 120, marginBottom: 16 }}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Cite specific concepts…"
              />

              <button type="button" className="clay-cta" disabled={!auditVerdict || !auditNotes} onClick={submitAudit}>
                Submit audit
              </button>
            </div>
          </div>
        )}

        {/* ---------- Alignment (study contract) modal ---------- */}
        {isAlignModalOpen && targetPeer && (
          <div className="modal-veil" onClick={(e) => { if (e.target === e.currentTarget) setIsAlignModalOpen(false); }}>
            <div className="clay-modal" role="dialog" aria-modal="true" aria-label="Alignment protocol">
              <header className="composer-head" style={{ marginBottom: 16 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.Link className="w-5 h-5" style={{ color: 'var(--accent-deep)' }} /> Study contract
                </h3>
                <button type="button" className="composer-x" onClick={() => setIsAlignModalOpen(false)} aria-label="Close">
                  <Icons.Plus className="w-[18px] h-[18px] rotate-45" />
                </button>
              </header>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                {targetPeer.avatar ? (
                  <img src={targetPeer.avatar} alt="" style={{ width: 56, height: 56, borderRadius: 18, objectFit: 'cover', boxShadow: 'var(--nm-xs)' }} />
                ) : (
                  <span style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 20 }}>
                    {(targetPeer.name || 'P').charAt(0)}
                  </span>
                )}
                <div>
                  <strong className="font-display" style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>{targetPeer.name}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Initiate a formal study connection — define the purpose and duration.</p>
                </div>
              </div>

              <p style={eyebrow}>Contract type</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
                {Object.values(AlignmentPurpose).map((purpose) => (
                  <button
                    key={purpose}
                    type="button"
                    className={`clay-option ${selectedPurpose === purpose ? 'on' : ''}`}
                    onClick={() => setSelectedPurpose(purpose)}
                  >
                    {purpose}
                  </button>
                ))}
              </div>

              <p style={eyebrow}>Duration</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Sprint', val: '7 Days' },
                  { label: 'Module', val: '14 Days' },
                  { label: 'Campaign', val: '30 Days' },
                  { label: 'Marathon', val: 'Until Exam' },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    className={`clay-option ${selectedDuration === d.val ? 'on' : ''}`}
                    onClick={() => setSelectedDuration(d.val as AlignmentDuration)}
                  >
                    <span style={{ display: 'block', fontSize: 10, opacity: 0.7 }}>{d.label}</span>
                    {d.val}
                  </button>
                ))}
              </div>

              <p style={eyebrow}>Mission goal</p>
              <textarea
                className="clay-textarea"
                style={{ height: 80, marginBottom: 18 }}
                value={alignmentNote}
                onChange={(e) => setAlignmentNote(e.target.value)}
                placeholder="E.g., Complete Section A MCQs with 80% accuracy…"
              />

              <button
                type="button"
                className="clay-cta"
                disabled={!selectedPurpose || !selectedDuration || !alignmentNote.trim() || isSendingAlign}
                onClick={confirmAlignment}
              >
                {isSendingAlign ? 'Connecting…' : <>Send contract <Icons.Send className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
