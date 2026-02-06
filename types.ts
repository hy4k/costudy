
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
  BOUNTY = 'BOUNTY' // New Type
}

// --- CAN: CMA Alignment Network Types ---
export enum AlignmentPurpose {
  MCQ_DRILL = 'MCQ Drill Partner',
  ESSAY_REVIEW = 'Essay Reviewer',
  ACCOUNTABILITY = 'Accountability Buddy',
  CONCEPT = 'Concept Clarifier',
  REVISION_SPRINT = 'Revision Sprint Partner',
  MOCK_COPILOT = 'Mock Exam Co-Pilot'
}

export type AlignmentDuration = '7 Days' | '14 Days' | '30 Days' | 'Until Exam';

export interface AlignmentRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  purpose: AlignmentPurpose;
  duration: AlignmentDuration; // New: Time constraint
  note: string; // The Goal
  timestamp: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
}

export interface ActiveAlignment {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar: string;
  purpose: AlignmentPurpose;
  goal: string; // The specific goal text
  startDate: string;
  duration: AlignmentDuration;
  status: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED' | 'PAUSED';
  streak: number;
  // Boundary Settings
  pausedUntil?: string;
  restrictions?: ('NO_ESSAYS' | 'MCQ_ONLY' | 'ASYNC_ONLY')[];
}

// --- TRACKING / RADAR SYSTEM ---
export interface TrackingRecord {
  id: string;
  targetId: string;
  targetName: string;
  targetAvatar: string;
  // Metrics visible on the Radar
  stats: {
    consistencyStreak: number;
    lastMockScore?: number;
    essaysSubmitted: number;
    doubtsSolved: number;
  };
  trackedSince: string;
}

export interface ObserverRecord {
  id: string;
  observerId: string;
  observerName: string;
  observerAvatar: string;
  observedSince: string;
}

// --- SIGNAL LEVELS (Profile Visibility) ---
export type SignalLevel = 'SILENT_LEARNER' | 'ACTIVE_SOLVER' | 'ESSAY_SPECIALIST' | 'REVISION_FOCUSED' | 'EXAM_WEEK';

export const SignalConfig: Record<SignalLevel, { label: string; color: string; desc: string; icon: string }> = {
  'SILENT_LEARNER': { label: 'Silent Learner', color: 'bg-slate-400', desc: 'Low visibility. No incoming requests.', icon: 'EyeOff' },
  'ACTIVE_SOLVER': { label: 'Active Solver', color: 'bg-emerald-500', desc: 'Open to all academic connections.', icon: 'Zap' },
  'ESSAY_SPECIALIST': { label: 'Essay Specialist', color: 'bg-blue-500', desc: 'Accepting Essay Review protocols only.', icon: 'PenTool' },
  'REVISION_FOCUSED': { label: 'Revision Focused', color: 'bg-orange-500', desc: 'High intensity. Sprint requests only.', icon: 'Flame' },
  'EXAM_WEEK': { label: 'Exam-Week Mode', color: 'bg-rose-600', desc: 'Radio silence. No new connections.', icon: 'Lock' }
};
// ----------------------------------------

export interface ManagedStudent {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  focus: string;
  lastActivity: string;
  performanceScore: number;
  status: 'Active' | 'On Leave' | 'Struggling';
}

export interface Broadcast {
  id: string;
  teacher_id: string;
  title: string;
  content: string;
  type: 'GENERAL' | 'URGENT' | 'RESOURCE';
  created_at: string;
}

export interface TopicPerformance {
  topic: string;
  score: number;
  attempts: number;
  lastScore: number;
  trend: 'Up' | 'Down' | 'Stable';
  style: 'Conceptual' | 'Calculation' | 'Both';
}

export interface ReputationMetrics {
  studyScore: {
    total: number;
    consistencyWeight: number;
    attemptWeight: number;
    improvementWeight: number;
  };
  consistencyScore: {
    streak: number;
    status: 'Active' | 'Consistent' | 'Dedicated';
  };
  helpfulnessScore: {
    total: number;
    answersVerified: number;
    resourcesShared: number;
    groupsLed: number;
  };
  // New Metric
  professionalSkepticism: number; // Points gained from Audits
  vouchesReceived: number; // Replaces 'likes' total
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
  // Mentor Specifics
  specialties?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  specialistSlug?: string;

  // CAN Data
  alignments?: ActiveAlignment[];
  pendingRequests?: AlignmentRequest[];

  // Radar Data
  tracking?: TrackingRecord[];
  observers?: ObserverRecord[];

  // Visibility
  signalLevel: SignalLevel;
}

export interface LibraryItem {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'MCQ_BANK' | 'TRANSCRIPT';
  size: string;
  category: string;
  tags: string[];
  isIndexed: boolean;
  pageCount?: number;
}

export interface BountyDetails {
  rewardAmount: number;
  rewardType: 'CREDITS' | 'BADGE';
  deadline?: string;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
}

export interface Post {
  id: string;
  type: PostType;
  author_id: string;
  author?: Partial<User>;
  content: string;
  created_at: string;
  likes: number; // Used for Vouches
  tags: string[];
  subject?: string;
  // Peer Audit Specifics
  auditStatus?: 'OPEN' | 'COMPLIANT' | 'NON_COMPLIANT';
  auditorId?: string;
  // Bounty Specifics
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
  file_type?: string;
  size?: string;
  category?: string;
  author?: Partial<User>;
  summary?: string;
}

export interface StudySession {
  id: string;
  room_id: string;
  created_by: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  session_type: 'STRATEGY' | 'DRILL' | 'MOCK_EXAM' | 'Q&A' | 'GENERAL';
  meeting_link?: string;
  created_at?: string;
  author?: Partial<User>;
}

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
}

export interface MentorOffering {
  type: string;
  label: string;
  price: number;
  currency: string;
  unit?: string;
}

export interface Mentor {
  id: string;
  name: string;
  specialties: string[];
  isVerified: boolean;
  img: string;
  reputation: {
    studentImprovement: number;
    avgScoreJump: number;
    consistency: number;
    helpfulness: number;
    responseTime: string;
  };
  trackRecord: {
    studentsTaught: number;
    reviewCount: number;
    passRate: number;
    avgImprovement: number;
  };
  offerings: MentorOffering[];
  learningStyle: string[];
  timezone: string;
  communicationPreference: string[];
}

// --- CONTEXT THREADS (Messaging) ---
export type ThreadContextType = 'QUESTION' | 'ESSAY' | 'MOCK_EXAM' | 'CONCEPT';

export interface ChatConversation {
  id: string;
  created_at: string;
  updated_at: string;
  is_group: boolean;
  name?: string;
  // Context Fields
  contextType?: ThreadContextType;
  contextId?: string;
  contextTitle?: string;
  status?: 'ACTIVE' | 'LOCKED'; // Locked if inactive > 7 days
  lastActiveAt?: string;

  // Hydrated fields
  participants?: Partial<User>[];
  last_message?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: Partial<User>;
}

export interface ViewState {
  WALL: 'WALL';
  FACULTY_ROOM: 'FACULTY_ROOM'; // New Teacher Wall
  ROOMS: 'ROOMS';
  ROOM_DETAIL: 'ROOM_DETAIL';
  PROFILE: 'PROFILE';
  AI_DECK: 'AI_DECK';
  TEACHERS: 'TEACHERS';
  TESTS: 'TESTS';
  STORE: 'STORE';
  MESSAGES: 'MESSAGES';
  // Teacher (Specialist) Silo
  DASHBOARD: 'DASHBOARD';
  REVENUE: 'REVENUE';
}

export const ViewState: ViewState = {
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
  REVENUE: 'REVENUE'
};

export interface CoStudyCloudStatus {
  connected: boolean;
  latency: number;
  lastSync: string;
  authSession: string | null;
  dataCore: 'IDLE' | 'SYNCING' | 'PUSHING';
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'MESSAGE' | 'ALERT' | 'SYSTEM';
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
