
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

// ==========================================
// CLUSTER HUB TYPES (Study Rooms V2)
// ==========================================

export type RoomType = 'PUBLIC' | 'PRIVATE' | 'GROUP_PREMIUM';
export type SignalLight = 'GREEN' | 'BLUE' | 'VIOLET' | 'OFFLINE';
export type MemberRole = 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'AWAY';

export interface StudyRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  user?: Partial<User>;
  role: MemberRole;
  status: MemberStatus;
  signal_light: SignalLight;
  daily_contribution: boolean;
  joined_at: string;
  last_active_at: string;
}

export interface StudyRoomMission {
  id: string;
  room_id: string;
  title: string;
  description?: string;
  target_type: 'ACCURACY' | 'QUESTIONS_COMPLETED' | 'ESSAYS_AUDITED' | 'STREAK_DAYS';
  target_value: number;
  current_value: number;
  deadline?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CERTIFIED';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface EnhancedStudyRoom extends StudyRoom {
  creator_id?: string;
  room_type: RoomType;
  group_subscription_id?: string;
  settings: {
    radioSilence: boolean;
    focusTheme: 'default' | 'dark' | 'minimal';
  };
  cluster_streak: number;
  last_streak_update?: string;
  created_at: string;
  members_list?: StudyRoomMember[];
  active_mission?: StudyRoomMission;
}

// ==========================================
// MCQ WAR ROOM TYPES
// ==========================================

export type WarSessionStatus = 'WAITING' | 'LIVE' | 'COMPLETED';

export interface MCQWarSession {
  id: string;
  room_id: string;
  host_id: string;
  host?: Partial<User>;
  title: string;
  question_count: number;
  topic_tags: string[];
  status: WarSessionStatus;
  room_accuracy: number;
  global_average: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  participants?: MCQWarParticipant[];
}

export interface MCQWarParticipant {
  id: string;
  session_id: string;
  user_id: string;
  user?: Partial<User>;
  score: number;
  questions_answered: number;
  accuracy: number;
  joined_at: string;
}

// ==========================================
// WHITEBOARD TYPES
// ==========================================

export interface WhiteboardSession {
  id: string;
  room_id: string;
  title: string;
  canvas_data: any; // JSON canvas state
  is_active: boolean;
  created_by: string;
  creator?: Partial<User>;
  created_at: string;
  updated_at: string;
}

// ==========================================
// GROUP PREMIUM TYPES
// ==========================================

export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface GroupSubscription {
  id: string;
  purchaser_id: string;
  purchaser?: Partial<User>;
  plan_type: 'PRO';
  billing_cycle: BillingCycle;
  group_size: number;
  base_price: number;
  discount_percent: number;
  per_person_price: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_id?: string;
  starts_at?: string;
  expires_at?: string;
  study_room_id?: string;
  study_room?: EnhancedStudyRoom;
  created_at: string;
  invites?: GroupInvite[];
}

export interface GroupInvite {
  id: string;
  group_subscription_id: string;
  email: string;
  invite_code: string;
  status: InviteStatus;
  accepted_by?: string;
  sent_at: string;
  accepted_at?: string;
  expires_at?: string;
}

// Group pricing calculator
export const calculateGroupPricing = (groupSize: number, billingCycle: BillingCycle) => {
  const basePrice = billingCycle === 'YEARLY' ? 3999 : 499;
  const discountPercent = Math.min(0.20 + (groupSize - 2) * 0.05, 0.50);
  const perPersonPrice = Math.round(basePrice * (1 - discountPercent));
  const totalAmount = perPersonPrice * groupSize;
  
  return {
    basePrice,
    discountPercent,
    perPersonPrice,
    totalAmount,
    savings: basePrice * groupSize - totalAmount
  };
};

// ==========================================
// FACULTY HIVE / MENTOR SESSION TYPES
// ==========================================

export type SessionType = 'FLASH' | 'SCHEDULED' | 'SOS';
export type SessionStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type SessionPaymentStatus = 'PENDING' | 'PAID' | 'ESCROWED' | 'RELEASED' | 'REFUNDED';

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  mentor?: Partial<User>;
  is_online: boolean;
  available_for_flash: boolean;
  topics: string[];
  timezone: string;
  updated_at: string;
}

export interface MentorSession {
  id: string;
  room_id?: string;
  room?: EnhancedStudyRoom;
  mentor_id?: string;
  mentor?: Partial<User>;
  requested_by: string;
  requester?: Partial<User>;
  
  title: string;
  topic: string;
  description?: string;
  duration_minutes: number;
  session_type: SessionType;
  
  total_fee: number;
  platform_fee_percent: number;
  mentor_payout?: number;
  
  status: SessionStatus;
  
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  
  room_vouch?: boolean;
  mentor_rating?: number;
  feedback?: string;
  
  created_at: string;
  payments?: SessionPayment[];
}

export interface SessionPayment {
  id: string;
  session_id: string;
  user_id: string;
  user?: Partial<User>;
  amount: number;
  status: SessionPaymentStatus;
  payment_id?: string;
  paid_at?: string;
}

// Split fee calculator
export const calculateSplitFee = (totalFee: number, memberCount: number, platformFeePercent: number = 12.5) => {
  const perPersonShare = Math.ceil(totalFee / memberCount);
  const platformCut = Math.round(totalFee * (platformFeePercent / 100));
  const mentorPayout = totalFee - platformCut;
  
  return {
    perPersonShare,
    platformCut,
    mentorPayout,
    totalCollected: perPersonShare * memberCount
  };
};

// ==========================================
// VOUCH TYPES
// ==========================================

export interface Vouch {
  id: string;
  voucher_id: string;
  voucher?: Partial<User>;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

// ==========================================
// POST SUMMARY TYPES
// ==========================================

export interface PostSummary {
  id: string;
  post_id: string;
  bullets: string[]; // 3 strategic bullet points
  generated_at: string;
}

// ==========================================
// BADGE TYPES
// ==========================================

export type BadgeCategory = 'MASTERY' | 'STREAK' | 'ALIGNMENT' | 'CONTRIBUTION';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirements?: {
    type: string;
    value: string | number;
  };
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
  earned_at: string;
  source_type?: 'ROOM' | 'ALIGNMENT' | 'BOUNTY';
  source_id?: string;
}

// ==========================================
// WALLET TYPES
// ==========================================

export type TransactionType = 'CREDIT' | 'DEBIT' | 'REFUND' | 'REWARD' | 'SESSION_PAYMENT';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference_type?: 'SESSION' | 'BOUNTY' | 'SUBSCRIPTION' | 'TOPUP';
  reference_id?: string;
  created_at: string;
}

// ==========================================
// ROOM LEADERBOARD TYPES
// ==========================================

export interface RoomLeaderboardEntry {
  id: string;
  room_id: string;
  room?: EnhancedStudyRoom;
  week_start: string;
  essays_audited: number;
  questions_solved: number;
  streak_days: number;
  total_score: number;
  global_rank?: number;
}
