
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  PEER_TUTOR = 'PEER_TUTOR'
}

export enum UserLevel {
  STARTER = 'STARTER',
  LEARNER = 'LEARNER',
  SCHOLAR = 'SCHOLAR',
  EXPERT = 'EXPERT'
}

export enum PostType {
  QUESTION = 'QUESTION',
  MCQ = 'MCQ_SHARE',
  MILESTONE = 'SCORE_MILESTONE',
  RESOURCE = 'RESOURCE_DROP',
  EVENT = 'EVENT',
  FACULTY_DISCUSS = 'FACULTY_DISCUSS',
  PEER_AUDIT_REQUEST = 'PEER_AUDIT_REQUEST',
  BOUNTY = 'BOUNTY'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  PRO_GROUP = 'PRO_GROUP'
}

export interface MentorInvitation {
    id: string;
    room_id: string;
    mentor_id: string;
    inviter_id: string;
    agreed_fee: number;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'PAID';
    mentor?: Partial<User>;
}

// Added missing TopicPerformance interface
export interface TopicPerformance {
    topic: string;
    score: number;
    attempts: number;
    lastScore: number;
    trend: 'Up' | 'Down' | 'Stable';
    style: string;
}

// Added missing ReputationMetrics interface
export interface ReputationMetrics {
    studyScore: { total: number };
    consistencyScore?: { streak: number, status: string };
    helpfulnessScore?: { total: number, answersVerified: number, resourcesShared: number, groupsLed: number };
    vouchesReceived?: number;
    professionalSkepticism?: number;
}

// Added missing SignalLevel enum
export enum SignalLevel {
    ACTIVE_SOLVER = 'ACTIVE_SOLVER',
    SILENT_LEARNER = 'SILENT_LEARNER',
    EXAM_WEEK = 'EXAM_WEEK',
    REVISION_FOCUSED = 'REVISION_FOCUSED'
}

// Added missing SignalConfig constant
export const SignalConfig: Record<SignalLevel, { label: string, color: string }> = {
    [SignalLevel.ACTIVE_SOLVER]: { label: 'Active Solver', color: 'bg-emerald-500' },
    [SignalLevel.SILENT_LEARNER]: { label: 'Silent Learner', color: 'bg-slate-400' },
    [SignalLevel.EXAM_WEEK]: { label: 'Exam Week', color: 'bg-rose-500' },
    [SignalLevel.REVISION_FOCUSED]: { label: 'Revision Focused', color: 'bg-amber-500' }
};

// Added missing AlignmentPurpose enum
export enum AlignmentPurpose {
    MCQ_DRILL = 'MCQ DRILL',
    ACCOUNTABILITY = 'ACCOUNTABILITY',
    REVISION_SPRINT = 'REVISION SPRINT',
    ESSAY_AUDIT = 'ESSAY AUDIT'
}

// Added missing AlignmentDuration type
export type AlignmentDuration = '7 Days' | '14 Days' | '30 Days' | 'Until Exam';

// Added missing ActiveAlignment interface
export interface ActiveAlignment {
    id: string;
    peerId: string;
    peerName: string;
    peerAvatar: string;
    purpose: AlignmentPurpose;
    streak: number;
    startDate: string;
    duration: AlignmentDuration;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'EXPIRED';
    goal: string;
    pausedUntil?: string;
    restrictions?: string[];
}

// Added missing AlignmentRequest interface
export interface AlignmentRequest {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    purpose: AlignmentPurpose;
    duration: AlignmentDuration;
    note: string;
    timestamp: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

// Added missing TrackingRecord interface
export interface TrackingRecord {
    id: string;
    targetId: string;
    targetName: string;
    targetAvatar: string;
    stats: {
        consistencyStreak: number;
        lastMockScore: number;
        essaysSubmitted: number;
        doubtsSolved: number;
    };
    trackedSince: string;
}

// Added missing ObserverRecord interface
export interface ObserverRecord {
    id: string;
    observerId: string;
    observerName: string;
    observerAvatar: string;
    observedSince: string;
}

// Added missing BountyDetails interface
export interface BountyDetails {
    rewardAmount: number;
    rewardType: 'CREDITS' | 'BADGE';
    status: 'OPEN' | 'CLOSED';
}

// Added missing CoStudyCloudStatus interface
export interface CoStudyCloudStatus {
    connected: boolean;
    latency: number;
    lastSync: string;
    authSession: string;
    dataCore: string;
}

// Added missing Notification interface
export interface Notification {
    id: string;
    user_id: string;
    content: string;
    type: 'MESSAGE' | 'ALERT' | 'SYNC';
    is_read: boolean;
    created_at: string;
    link?: keyof ViewState;
}

// Added missing Comment interface
export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    author?: Partial<User>;
    content: string;
    created_at: string;
    parent_id?: string;
    replies?: Comment[];
}

// Added missing Mentor interface
export type MentorStatus = 'online' | 'offline' | 'in_session';

export interface Mentor {
    id: string;
    name: string;
    img: string;
    isVerified: boolean;
    specialties: string[];
    learningStyle: string;
    timezone: string;
    offerings: { type: string; price: number }[];
    status?: MentorStatus;
    lastActive?: string;
    responseTime?: string;
    activeSessions?: number;
    rating?: number;
    reviewCount?: number;
    hourlyRate?: number;
    bio?: string;
}

// Added missing LibraryItem interface
export interface LibraryItem {
    id: string;
    title: string;
    type: 'PDF' | 'MCQ_BANK' | 'TRANSCRIPT';
    size: string;
    category: string;
    tags: string[];
    isIndexed: boolean;
    pageCount?: number;
}

// Added missing ManagedStudent interface
export interface ManagedStudent {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    focus: string;
    lastActivity: string;
    performanceScore: number;
    status: 'Active' | 'Struggling';
}

// Added missing Broadcast interface
export interface Broadcast {
    id: string;
    teacher_id: string;
    title: string;
    content: string;
    type: 'GENERAL' | 'URGENT' | 'RESOURCE';
    created_at: string;
}

// Added missing ThreadContextType type
export type ThreadContextType = 'QUESTION' | 'ESSAY' | 'MOCK_EXAM' | 'CONCEPT';

// Added missing ChatConversation interface
export interface ChatConversation {
    id: string;
    name?: string;
    is_group: boolean;
    updated_at: string;
    contextType?: ThreadContextType;
    contextTitle?: string;
    contextId?: string;
    status?: 'ACTIVE' | 'LOCKED' | 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
    participants?: Partial<User>[];
    last_message?: ChatMessage | null;
}

// Added missing ChatMessage interface
export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender?: Partial<User>;
    content: string;
    created_at: string;
}

export interface User {
  id: string;
  name: string;
  handle?: string;
  bio?: string;
  strategicMilestone?: string;
  examFocus?: 'CMA Part 1' | 'CMA Part 2' | 'Both';
  email?: string;
  avatar: string;
  role: UserRole;
  level: UserLevel;
  badges?: string[];
  tagline?: string;
  learningWith: number;
  learningFrom: number;
  consistencyScore?: number;
  learningStyle: 'Visual' | 'Discussion' | 'Practical';
  timezone: string;
  budget?: number;
  availableHours: 'Morning' | 'Evening' | 'Night';
  performance: TopicPerformance[];
  reputation: ReputationMetrics;
  costudyStatus: {
    subscription: 'Basic' | 'Pro' | 'Elite';
    walletBalance: number;
    isVerified: boolean;
    lastMockDate?: string;
    globalRank?: number;
  };
  specialties?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  specialistSlug?: string;
  alignments?: ActiveAlignment[];
  pendingRequests?: AlignmentRequest[];
  tracking?: TrackingRecord[];
  observers?: ObserverRecord[];
  signalLevel: SignalLevel;
}

export interface Post {
  id: string;
  type: PostType;
  author_id: string;
  author?: Partial<User>; 
  content: string;
  created_at: string;
  likes: number; 
  tags: string[];
  subject?: string;
  auditStatus?: 'OPEN' | 'COMPLIANT' | 'NON_COMPLIANT';
  auditorId?: string;
  bountyDetails?: BountyDetails;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'system';
  created_at: string;
  author?: Partial<User>;
}

export interface RoomResource {
  id: string;
  room_id: string;
  title: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  size?: string;
  category?: string;
  author?: Partial<User>;
  summary?: string;
}

export interface ClusterMember {
  id: string;
  name: string;
  role: 'ADMIN' | 'MODERATOR' | 'SCHOLAR' | 'FACULTY';
  avatar?: string;
  joined_at?: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  category: string;
  members: number;
  activeOnline: number;
  color: string;
  description: string;
  sections: string[];
  targetTopics: string[];
  managed_by?: string; // Teacher ID
  admin_id?: string;
  admin_name?: string;
  privacy?: 'PUBLIC' | 'INVITE_ONLY';
  member_list?: ClusterMember[];
}

export interface ViewState {
  LANDING: 'LANDING';
  WALL: 'WALL';
  FACULTY_ROOM: 'FACULTY_ROOM';
  ROOMS: 'ROOMS';
  ROOM_DETAIL: 'ROOM_DETAIL';
  PROFILE: 'PROFILE';
  AI_DECK: 'AI_DECK';
  TEACHERS: 'TEACHERS';
  TESTS: 'TESTS';
  STORE: 'STORE';
  MESSAGES: 'MESSAGES';
  DASHBOARD: 'DASHBOARD';
  REVENUE: 'REVENUE';
  MASTERY_PATH: 'MASTERY_PATH';
  LAUNCH_MOMENTUM: 'LAUNCH_MOMENTUM';
}

export const ViewState: ViewState = {
  LANDING: 'LANDING',
  WALL: 'WALL',
  FACULTY_ROOM: 'FACULTY_ROOM',
  ROOMS: 'ROOMS',
  ROOM_DETAIL: 'ROOM_DETAIL',
  PROFILE: 'PROFILE',
  AI_DECK: 'AI_DECK',
  TEACHERS: 'TEACHERS',
  TESTS: 'TESTS',
  STORE: 'STORE',
  MESSAGES: 'MESSAGES',
  DASHBOARD: 'DASHBOARD',
  REVENUE: 'REVENUE',
  MASTERY_PATH: 'MASTERY_PATH',
  LAUNCH_MOMENTUM: 'LAUNCH_MOMENTUM'
};
