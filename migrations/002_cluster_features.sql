-- ==========================================
-- COSTUDY V2 MIGRATION: Cluster Hub, Group Premium, Faculty Hive
-- Run this after the initial database.sql
-- ==========================================

-- ==========================================
-- 1. VOUCHES (Professional Endorsements)
-- ==========================================
CREATE TABLE IF NOT EXISTS vouches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voucher_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Optional, if vouching a comment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Ensure one vouch per user per post/comment
  UNIQUE(voucher_id, post_id),
  UNIQUE(voucher_id, comment_id)
);

ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vouches are viewable by everyone" ON vouches FOR SELECT USING (true);
CREATE POLICY "Users can vouch" ON vouches FOR INSERT WITH CHECK (auth.uid() = voucher_id);
CREATE POLICY "Users can remove own vouches" ON vouches FOR DELETE USING (auth.uid() = voucher_id);

-- ==========================================
-- 2. POST SUMMARIES (AI-Generated)
-- ==========================================
CREATE TABLE IF NOT EXISTS post_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  bullets JSONB NOT NULL, -- Array of 3 strategic bullet points
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE post_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Summaries are viewable by everyone" ON post_summaries FOR SELECT USING (true);

-- ==========================================
-- 3. ENHANCED STUDY ROOMS (Cluster Hubs)
-- ==========================================

-- Add new columns to existing study_rooms table
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES user_profiles(id);
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'PUBLIC'; -- 'PUBLIC', 'PRIVATE', 'GROUP_PREMIUM'
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS group_subscription_id UUID; -- Links to group purchase
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"radioSilence": false, "focusTheme": "default"}';
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS cluster_streak INTEGER DEFAULT 0;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS last_streak_update DATE;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Study Room Members (with roles and status)
CREATE TABLE IF NOT EXISTS study_room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER', -- 'ADMIN', 'MEMBER'
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'AWAY'
  signal_light TEXT DEFAULT 'OFFLINE', -- 'GREEN' (Active Solving), 'BLUE' (On Audio), 'VIOLET' (Reading), 'OFFLINE'
  daily_contribution BOOLEAN DEFAULT false, -- Did they contribute today?
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  UNIQUE(room_id, user_id)
);

ALTER TABLE study_room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view room members" ON study_room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = study_room_members.room_id AND srm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM study_rooms sr WHERE sr.id = study_room_members.room_id AND sr.room_type = 'PUBLIC')
);
CREATE POLICY "Users can join rooms" ON study_room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON study_room_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage members" ON study_room_members FOR ALL USING (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = study_room_members.room_id AND srm.user_id = auth.uid() AND srm.role = 'ADMIN')
);

-- Study Room Missions (Goals)
CREATE TABLE IF NOT EXISTS study_room_missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., "85% Accuracy in Section B by Sunday"
  description TEXT,
  target_type TEXT, -- 'ACCURACY', 'QUESTIONS_COMPLETED', 'ESSAYS_AUDITED', 'STREAK_DAYS'
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'FAILED', 'CERTIFIED'
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE study_room_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view missions" ON study_room_missions FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = study_room_missions.room_id AND srm.user_id = auth.uid())
);
CREATE POLICY "Admins can create missions" ON study_room_missions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = room_id AND srm.user_id = auth.uid() AND srm.role = 'ADMIN')
);

-- MCQ War Room Sessions
CREATE TABLE IF NOT EXISTS mcq_war_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  host_id UUID REFERENCES user_profiles(id),
  title TEXT,
  question_count INTEGER DEFAULT 50,
  topic_tags TEXT[],
  status TEXT DEFAULT 'WAITING', -- 'WAITING', 'LIVE', 'COMPLETED'
  room_accuracy NUMERIC DEFAULT 0,
  global_average NUMERIC DEFAULT 0, -- Comparison metric
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS mcq_war_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES mcq_war_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  UNIQUE(session_id, user_id)
);

ALTER TABLE mcq_war_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_war_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view war sessions" ON mcq_war_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = mcq_war_sessions.room_id AND srm.user_id = auth.uid())
);
CREATE POLICY "Members can create war sessions" ON mcq_war_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = room_id AND srm.user_id = auth.uid())
);
CREATE POLICY "View war participants" ON mcq_war_participants FOR SELECT USING (true);
CREATE POLICY "Join war sessions" ON mcq_war_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared Ledger (Resource Vault) - Enhanced
ALTER TABLE study_room_resources ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
ALTER TABLE study_room_resources ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'ROOM'; -- 'ROOM', 'ALIGNED_ONLY'
ALTER TABLE study_room_resources ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
ALTER TABLE study_room_resources ADD COLUMN IF NOT EXISTS vouches INTEGER DEFAULT 0;

-- Strategic Whiteboard Sessions
CREATE TABLE IF NOT EXISTS whiteboard_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  title TEXT,
  canvas_data JSONB, -- JSON representation of the whiteboard state
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE whiteboard_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can access whiteboards" ON whiteboard_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = whiteboard_sessions.room_id AND srm.user_id = auth.uid())
);

-- ==========================================
-- 4. GROUP PREMIUM SUBSCRIPTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS group_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchaser_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  plan_type TEXT DEFAULT 'PRO', -- 'PRO'
  billing_cycle TEXT DEFAULT 'YEARLY', -- 'MONTHLY', 'YEARLY'
  group_size INTEGER NOT NULL,
  base_price NUMERIC NOT NULL, -- Original per-person price
  discount_percent NUMERIC NOT NULL, -- Applied discount
  per_person_price NUMERIC NOT NULL, -- Final per-person price
  total_amount NUMERIC NOT NULL, -- Total charged
  
  -- Payment Info
  payment_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
  payment_id TEXT, -- External payment gateway ID
  
  -- Validity
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Auto-created study room
  study_room_id UUID REFERENCES study_rooms(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS group_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_subscription_id UUID REFERENCES group_subscriptions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL, -- Unique code for registration
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED'
  accepted_by UUID REFERENCES user_profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE group_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Purchaser can view subscription" ON group_subscriptions FOR SELECT USING (auth.uid() = purchaser_id);
CREATE POLICY "Invites viewable by recipient" ON group_invites FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_subscriptions gs WHERE gs.id = group_invites.group_subscription_id AND gs.purchaser_id = auth.uid())
  OR accepted_by = auth.uid()
);

-- ==========================================
-- 5. FACULTY HIVE (Mentor Sessions)
-- ==========================================

-- Mentor Availability
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  available_for_flash BOOLEAN DEFAULT true, -- Can be pulled into flash sessions
  topics TEXT[], -- Topics they're available to teach
  timezone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view mentor availability" ON mentor_availability FOR SELECT USING (true);
CREATE POLICY "Mentors can update own availability" ON mentor_availability FOR ALL USING (auth.uid() = mentor_id);

-- Mentor Sessions (Flash Sessions / Deep Dives)
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE SET NULL, -- Which cluster requested
  mentor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES user_profiles(id), -- Who clicked "Enlist Specialist"
  
  -- Session Details
  title TEXT,
  topic TEXT,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT DEFAULT 'FLASH', -- 'FLASH', 'SCHEDULED', 'SOS'
  
  -- Pricing
  total_fee NUMERIC NOT NULL,
  platform_fee_percent NUMERIC DEFAULT 12.5, -- CoStudy cut
  mentor_payout NUMERIC, -- Fee - Platform cut
  
  -- Status
  status TEXT DEFAULT 'REQUESTED', -- 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'
  
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Quality
  room_vouch BOOLEAN, -- Did the room vouch for quality?
  mentor_rating NUMERIC, -- 1-5 rating
  feedback TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Session Payments (Split-Fee Escrow)
CREATE TABLE IF NOT EXISTS session_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL, -- Their share of the split
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'ESCROWED', 'RELEASED', 'REFUNDED'
  payment_id TEXT, -- External payment gateway ID
  paid_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(session_id, user_id)
);

ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View sessions for participants" ON mentor_sessions FOR SELECT USING (
  mentor_id = auth.uid() 
  OR requested_by = auth.uid()
  OR EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = mentor_sessions.room_id AND srm.user_id = auth.uid())
);
CREATE POLICY "Room members can request sessions" ON mentor_sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM study_room_members srm WHERE srm.room_id = room_id AND srm.user_id = auth.uid())
);
CREATE POLICY "View own payments" ON session_payments FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 6. COSTUDY WALLET & CREDITS
-- ==========================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'CREDIT', 'DEBIT', 'REFUND', 'REWARD', 'SESSION_PAYMENT'
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  reference_type TEXT, -- 'SESSION', 'BOUNTY', 'SUBSCRIPTION', 'TOPUP'
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 7. MASTERY BADGES
-- ==========================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'SECTION_A_MASTER', 'STREAK_30', etc.
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon URL
  category TEXT, -- 'MASTERY', 'STREAK', 'ALIGNMENT', 'CONTRIBUTION'
  requirements JSONB -- { type: 'mission_complete', value: 'SECTION_A' }
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  source_type TEXT, -- 'ROOM', 'ALIGNMENT', 'BOUNTY'
  source_id UUID,
  
  UNIQUE(user_id, badge_id)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "View own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id OR true); -- Public for profiles

-- ==========================================
-- 8. ROOM LEADERBOARDS (Room vs Room)
-- ==========================================
CREATE TABLE IF NOT EXISTS room_leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Start of the week
  
  -- Metrics
  essays_audited INTEGER DEFAULT 0,
  questions_solved INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  
  -- Ranking
  global_rank INTEGER,
  
  UNIQUE(room_id, week_start)
);

ALTER TABLE room_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view leaderboard" ON room_leaderboard FOR SELECT USING (true);

-- ==========================================
-- 9. HELPER FUNCTIONS
-- ==========================================

-- Function to calculate group discount
CREATE OR REPLACE FUNCTION calculate_group_discount(group_size INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- 20% base + 5% per additional member (after 2), max 50%
  RETURN LEAST(0.20 + (group_size - 2) * 0.05, 0.50);
END;
$$ LANGUAGE plpgsql;

-- Function to increment room member count
CREATE OR REPLACE FUNCTION increment_room_members(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE study_rooms 
  SET members_count = members_count + 1
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement room member count
CREATE OR REPLACE FUNCTION decrement_room_members(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE study_rooms 
  SET members_count = GREATEST(members_count - 1, 0)
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment post vouches
CREATE OR REPLACE FUNCTION increment_post_vouches(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes = likes + 1
  WHERE id = post_id;
  
  -- Also update author's reputation
  UPDATE user_profiles 
  SET reputation = jsonb_set(
    reputation, 
    '{vouchesReceived}', 
    to_jsonb(COALESCE((reputation->>'vouchesReceived')::integer, 0) + 1)
  )
  WHERE id = (SELECT author_id FROM posts WHERE id = post_id);
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post vouches
CREATE OR REPLACE FUNCTION decrement_post_vouches(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = post_id;
  
  UPDATE user_profiles 
  SET reputation = jsonb_set(
    reputation, 
    '{vouchesReceived}', 
    to_jsonb(GREATEST(COALESCE((reputation->>'vouchesReceived')::integer, 0) - 1, 0))
  )
  WHERE id = (SELECT author_id FROM posts WHERE id = post_id);
END;
$$ LANGUAGE plpgsql;

-- Function to update cluster streak
CREATE OR REPLACE FUNCTION update_cluster_streak(p_room_id UUID)
RETURNS void AS $$
DECLARE
  all_contributed BOOLEAN;
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Check if all active members contributed today
  SELECT NOT EXISTS (
    SELECT 1 FROM study_room_members 
    WHERE room_id = p_room_id 
    AND status = 'ACTIVE' 
    AND daily_contribution = false
  ) INTO all_contributed;
  
  IF all_contributed THEN
    UPDATE study_rooms 
    SET cluster_streak = cluster_streak + 1,
        last_streak_update = current_date
    WHERE id = p_room_id 
    AND (last_streak_update IS NULL OR last_streak_update < current_date);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily contributions (run via cron at midnight UTC)
CREATE OR REPLACE FUNCTION reset_daily_contributions()
RETURNS void AS $$
BEGIN
  UPDATE study_room_members SET daily_contribution = false;
  
  -- Break streaks for rooms that didn't have all members contribute yesterday
  UPDATE study_rooms 
  SET cluster_streak = 0 
  WHERE last_streak_update < CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 10. SEED DATA: Default Badges
-- ==========================================
INSERT INTO badges (code, name, description, icon, category) VALUES
  ('SECTION_A_MASTER', 'Section A Master', 'Completed a Section A mastery mission', '🎯', 'MASTERY'),
  ('SECTION_B_MASTER', 'Section B Master', 'Completed a Section B mastery mission', '🎯', 'MASTERY'),
  ('SECTION_C_MASTER', 'Section C Master', 'Completed a Section C mastery mission', '🎯', 'MASTERY'),
  ('STREAK_7', 'Week Warrior', 'Maintained a 7-day study streak', '🔥', 'STREAK'),
  ('STREAK_30', 'Monthly Master', 'Maintained a 30-day study streak', '🔥', 'STREAK'),
  ('STREAK_100', 'Century Legend', 'Maintained a 100-day study streak', '💯', 'STREAK'),
  ('FIRST_ALIGNMENT', 'First Contact', 'Completed your first alignment contract', '🤝', 'ALIGNMENT'),
  ('GLOBAL_PARTNER', 'Global Partner', 'Aligned with students from 3+ countries', '🌍', 'ALIGNMENT'),
  ('BOUNTY_HUNTER', 'Bounty Hunter', 'Completed 10 bounty tasks', '💰', 'CONTRIBUTION'),
  ('AUDIT_PRO', 'Audit Professional', 'Performed 20 peer audits', '📋', 'CONTRIBUTION'),
  ('VOUCH_LEADER', 'Trust Builder', 'Received 50 vouches', '✅', 'CONTRIBUTION'),
  ('WAR_ROOM_VICTOR', 'War Room Victor', 'Won 5 MCQ War Room sessions', '⚔️', 'MASTERY'),
  ('CLUSTER_LEGEND', 'Cluster Legend', 'Part of a 30-day cluster streak', '👥', 'STREAK')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 11. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vouches_post ON vouches(post_id);
CREATE INDEX IF NOT EXISTS idx_vouches_voucher ON vouches(voucher_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON study_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON study_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_email ON group_invites(email);
CREATE INDEX IF NOT EXISTS idx_group_invites_code ON group_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_room ON mentor_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_session ON session_payments(session_id);
CREATE INDEX IF NOT EXISTS idx_room_leaderboard_week ON room_leaderboard(week_start);
