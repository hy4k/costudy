
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI RAG features (LibraryVault)

-- ==========================================
-- 1. IDENTITY & PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  handle TEXT,
  avatar TEXT,
  bio TEXT,
  role TEXT DEFAULT 'STUDENT', -- 'STUDENT', 'TEACHER', 'PEER_TUTOR'
  level TEXT DEFAULT 'STARTER',
  
  -- Student Specifics
  strategic_milestone TEXT,
  exam_focus TEXT, -- 'CMA Part 1', 'CMA Part 2', 'Both'
  learning_style TEXT,
  costudy_status JSONB DEFAULT '{"subscription": "Basic", "walletBalance": 0, "isVerified": false, "globalRank": 0}',
  performance JSONB DEFAULT '[]', -- Array of TopicPerformance
  reputation JSONB DEFAULT '{"studyScore": {"total": 0}, "consistencyScore": {"streak": 0, "status": "Active"}, "helpfulnessScore": {"total": 0}, "professionalSkepticism": 0, "vouchesReceived": 0}',
  
  -- Mentor Specifics
  specialties TEXT[],
  years_experience NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  specialist_slug TEXT, -- Subdomain feature (e.g., 'vikram.costudy.cloud')
  
  -- Visibility & Signals
  signal_level TEXT DEFAULT 'ACTIVE_SOLVER', -- 'SILENT_LEARNER', 'ACTIVE_SOLVER', 'ESSAY_SPECIALIST', etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. SOCIAL WALL (Posts, Bounties, Audits)
-- ==========================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'QUESTION', -- 'QUESTION', 'RESOURCE', 'BOUNTY', 'PEER_AUDIT_REQUEST'
  tags TEXT[],
  likes INTEGER DEFAULT 0, -- Used for 'Vouches'
  
  -- Feature: Peer Audit
  audit_status TEXT DEFAULT 'OPEN', -- 'OPEN', 'COMPLIANT', 'NON_COMPLIANT'
  auditor_id UUID REFERENCES user_profiles(id),
  
  -- Feature: The Bounty Board
  bounty_details JSONB, -- { rewardAmount: number, rewardType: 'CREDITS'|'BADGE', status: 'OPEN'|'CLOSED' }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id), -- Threaded replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- ==========================================
-- 3. MISSION CONTROL MESSAGING
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_group BOOLEAN DEFAULT false,
  name TEXT, -- Optional group name OR JSON payload for context (legacy support)
  
  -- Feature: Contextual Protocols
  context_type TEXT, -- 'QUESTION', 'ESSAY', 'MOCK_EXAM'
  context_id TEXT,   -- ID of the related resource (e.g., Post ID)
  context_title TEXT, -- e.g., "Audit Essay #214"
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'LOCKED' (Archived)
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS chat_participants (
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for brevity)
CREATE POLICY "View own conversations" ON chat_conversations FOR SELECT USING (EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = chat_conversations.id AND user_id = auth.uid()));
CREATE POLICY "Create conversations" ON chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "View participants" ON chat_participants FOR SELECT USING (EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.conversation_id = chat_participants.conversation_id AND cp.user_id = auth.uid()));
CREATE POLICY "Join conversations" ON chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()));
CREATE POLICY "View messages" ON chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));

-- ==========================================
-- 4. COSTUDY ALIGNMENT NETWORK (CAN)
-- ==========================================
CREATE TABLE IF NOT EXISTS alignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  peer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Contract Details
  purpose TEXT, -- 'MCQ_DRILL', 'ACCOUNTABILITY', etc.
  duration TEXT, -- '7 Days', 'Until Exam'
  goal TEXT, -- The "Mission Objective"
  
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'EXPIRED', 'ARCHIVED', 'PAUSED'
  streak INTEGER DEFAULT 0,
  
  -- Boundary Settings
  restrictions JSONB DEFAULT '[]', -- ['NO_ESSAYS', 'ASYNC_ONLY']
  paused_until TIMESTAMP WITH TIME ZONE,
  
  start_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE alignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alignments" ON alignments FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = peer_id);
CREATE POLICY "Users can create alignments" ON alignments FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own alignments" ON alignments FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = peer_id);

-- ==========================================
-- 5. ACADEMIC RADAR (Tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_tracking (
  tracker_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (tracker_id, target_id)
);

ALTER TABLE user_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage tracking" ON user_tracking FOR ALL USING (auth.uid() = tracker_id);

-- ==========================================
-- 6. TEACHER DASHBOARD & BROADCASTS
-- ==========================================
CREATE TABLE IF NOT EXISTS teacher_broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'GENERAL', -- 'GENERAL', 'URGENT', 'RESOURCE'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE teacher_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can see broadcasts" ON teacher_broadcasts FOR SELECT USING (true);
CREATE POLICY "Teachers can create broadcasts" ON teacher_broadcasts FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ACTIVE',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view enrollments" ON student_enrollments FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = student_id);

-- ==========================================
-- 7. STUDY ROOMS & RESOURCES
-- ==========================================
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  members_count INTEGER DEFAULT 0,
  active_count INTEGER DEFAULT 0,
  color_theme TEXT
);

-- Note: Pre-seed some rooms manually or via migration script if needed

CREATE TABLE IF NOT EXISTS study_room_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE, -- In a real app, FK to rooms
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  content TEXT,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS study_room_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID, -- Explicit FK if table exists
  user_id UUID REFERENCES user_profiles(id),
  title TEXT,
  file_type TEXT,
  size TEXT,
  category TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS study_room_notebooks (
  room_id UUID PRIMARY KEY,
  title TEXT,
  table_of_contents JSONB, -- AI Generated Structure
  last_compiled_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE study_room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public room messages" ON study_room_messages FOR ALL USING (true);

ALTER TABLE study_room_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public room resources" ON study_room_resources FOR ALL USING (true);

-- ==========================================
-- 8. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT, -- 'MESSAGE', 'ALERT', 'SYSTEM'
  content TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true); -- Ideally restricted to service role
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 9. LIBRARY VAULT (RAG)
-- ==========================================
CREATE TABLE IF NOT EXISTS vault_vectors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding vector(1536) -- Requires vector extension
);

ALTER TABLE vault_vectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public vectors" ON vault_vectors FOR SELECT USING (true);

