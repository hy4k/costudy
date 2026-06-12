-- =====================================================
-- CoStudy Auth & Profiles
-- Migration 0002 — user profiles + onboarding + exam targets
--
-- Table names match the API routes and frontend exactly:
--   user_profiles      — extends auth.users with CoStudy identity
--   user_exam_targets  — multi-exam support (CMA P1, P2, IELTS, etc.)
--
-- Trigger: auto-creates a user_profiles row on signup.
-- Depends on: 0001_mock_engine.sql (uses set_updated_at function)
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------
-- 1. User profiles — core identity table
--    Matches AuthContext.UserProfile type 1:1
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT,
  avatar_url           TEXT,
  email                TEXT,
  bio                  TEXT,

  -- Auth metadata
  auth_provider        TEXT NOT NULL DEFAULT 'email',      -- 'email', 'google', 'github'
  email_verified       BOOLEAN NOT NULL DEFAULT false,

  -- Access tiers
  tier                 TEXT NOT NULL DEFAULT 'free'
                       CHECK (tier IN ('free', 'pro', 'premium')),
  role                 TEXT NOT NULL DEFAULT 'student'
                       CHECK (role IN ('student', 'mentor', 'admin')),

  -- Onboarding (4-step flow)
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step      INT NOT NULL DEFAULT 0,            -- 0=not started, 1-3=in progress, 4=done

  -- Exam focus (set during onboarding step 2)
  primary_exam         TEXT,                               -- 'cma_p1','cma_p2','ielts','toefl','gre'
  exam_window          TEXT,                               -- 'jan_feb_2026', 'may_jun_2026', etc.
  study_hours_per_week INT,
  experience_level     TEXT,                               -- 'beginner','intermediate','retaker'

  -- Gamification / activity
  streak_days          INT NOT NULL DEFAULT 0,
  last_active_at       TIMESTAMPTZ DEFAULT now(),
  total_mocks          INT NOT NULL DEFAULT 0,
  total_essays         INT NOT NULL DEFAULT 0,

  -- Location (for CoStudy Partner matching)
  city                 TEXT,
  country              TEXT DEFAULT 'India',
  timezone             TEXT DEFAULT 'Asia/Kolkata',

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_exam ON user_profiles(primary_exam) WHERE primary_exam IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed) WHERE NOT onboarding_completed;
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier) WHERE tier != 'free';

-- ---------------------------------------------------------------
-- 2. Exam targets — supports users targeting multiple exams
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_exam_targets (
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  exam       TEXT NOT NULL,                                -- 'cma_p1', 'ielts', etc.
  exam_window TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exam)
);

-- ---------------------------------------------------------------
-- 3. Auto-create profile on Supabase auth signup
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT;
BEGIN
  -- Detect auth provider from raw_app_meta_data
  v_provider := COALESCE(
    NEW.raw_app_meta_data ->> 'provider',
    'email'
  );

  INSERT INTO user_profiles (
    id, email, display_name, avatar_url,
    auth_provider, email_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    v_provider,
    CASE WHEN v_provider = 'google' THEN true
         WHEN NEW.email_confirmed_at IS NOT NULL THEN true
         ELSE false END
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(user_profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(user_profiles.avatar_url, EXCLUDED.avatar_url),
    auth_provider = EXCLUDED.auth_provider,
    email_verified = EXCLUDED.email_verified;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any (from migration 0001 or earlier attempts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also fire on update (e.g. when email gets confirmed)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------
-- 4. Updated_at trigger
-- ---------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_user_profiles_uat ON user_profiles;
CREATE TRIGGER trg_user_profiles_uat
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_targets ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can READ any profile (for Partner matching, StudyWall, etc.)
DROP POLICY IF EXISTS p_user_profiles_select ON user_profiles;
CREATE POLICY p_user_profiles_select ON user_profiles
  FOR SELECT TO authenticated USING (true);

-- Users can only UPDATE their own profile
DROP POLICY IF EXISTS p_user_profiles_update ON user_profiles;
CREATE POLICY p_user_profiles_update ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Exam targets: private to user
DROP POLICY IF EXISTS p_exam_targets_owner ON user_exam_targets;
CREATE POLICY p_exam_targets_owner ON user_exam_targets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;

-- =====================================================
-- VERIFY:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'user_profiles' ORDER BY ordinal_position;
-- =====================================================
