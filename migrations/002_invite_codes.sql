-- ==========================================
-- INVITE CODE SYSTEM
-- Each user gets a code they can share with up to 3 people
-- ==========================================

-- 1. INVITE CODES TABLE
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT 3,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE -- NULL means never expires
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_owner ON invite_codes(owner_id);

-- 2. INVITE USES TABLE (Track who used which code)
CREATE TABLE IF NOT EXISTS invite_uses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invite_code_id UUID REFERENCES invite_codes(id) ON DELETE CASCADE,
  used_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(invite_code_id, used_by) -- Prevent same user using same code twice
);

CREATE INDEX IF NOT EXISTS idx_invite_uses_code ON invite_uses(invite_code_id);
CREATE INDEX IF NOT EXISTS idx_invite_uses_user ON invite_uses(used_by);

-- 3. ADD invited_by TO USER PROFILES (Track referral chain)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS invite_code_used TEXT;

-- 4. ROW LEVEL SECURITY
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_uses ENABLE ROW LEVEL SECURITY;

-- Users can view their own invite codes
CREATE POLICY "Users view own invite codes" ON invite_codes 
  FOR SELECT USING (auth.uid() = owner_id);

-- Users can view public info about any code (for validation)
CREATE POLICY "Anyone can validate codes" ON invite_codes 
  FOR SELECT USING (true);

-- Only system/service role can insert invite codes
CREATE POLICY "System creates invite codes" ON invite_codes 
  FOR INSERT WITH CHECK (true);

-- Users can view invite uses for their own codes
CREATE POLICY "Users view own invite uses" ON invite_uses 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invite_codes 
      WHERE id = invite_uses.invite_code_id 
      AND owner_id = auth.uid()
    )
  );

-- System can insert invite uses
CREATE POLICY "System tracks invite uses" ON invite_uses 
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- 5. HELPER FUNCTIONS
-- ==========================================

-- Generate a unique invite code (6 chars, alphanumeric, uppercase)
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 to avoid confusion
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create invite code for a user (called after signup/approval)
CREATE OR REPLACE FUNCTION create_user_invite_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Check if user already has an active code
  SELECT code INTO new_code FROM invite_codes 
  WHERE owner_id = user_id AND is_active = true 
  LIMIT 1;
  
  IF new_code IS NOT NULL THEN
    RETURN new_code; -- Return existing code
  END IF;
  
  -- Generate unique code (retry if collision)
  LOOP
    new_code := generate_invite_code();
    attempts := attempts + 1;
    
    BEGIN
      INSERT INTO invite_codes (code, owner_id, max_uses, uses_count)
      VALUES (new_code, user_id, 3, 0);
      RETURN new_code;
    EXCEPTION WHEN unique_violation THEN
      IF attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique invite code';
      END IF;
      -- Continue loop to try again
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate an invite code (check if usable)
CREATE OR REPLACE FUNCTION validate_invite_code(input_code TEXT)
RETURNS JSONB AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record FROM invite_codes 
  WHERE code = UPPER(input_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid invite code'
    );
  END IF;
  
  IF code_record.uses_count >= code_record.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'This invite code has reached its maximum uses'
    );
  END IF;
  
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'This invite code has expired'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'code', code_record.code,
    'owner_id', code_record.owner_id,
    'uses_remaining', code_record.max_uses - code_record.uses_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use an invite code (called during signup)
CREATE OR REPLACE FUNCTION use_invite_code(input_code TEXT, new_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  code_record RECORD;
  validation JSONB;
BEGIN
  -- First validate
  validation := validate_invite_code(input_code);
  
  IF NOT (validation->>'valid')::boolean THEN
    RETURN validation;
  END IF;
  
  -- Get the code record
  SELECT * INTO code_record FROM invite_codes 
  WHERE code = UPPER(input_code) AND is_active = true
  FOR UPDATE; -- Lock row to prevent race conditions
  
  -- Double-check uses (race condition protection)
  IF code_record.uses_count >= code_record.max_uses THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invite code has reached its maximum uses'
    );
  END IF;
  
  -- Record the use
  INSERT INTO invite_uses (invite_code_id, used_by)
  VALUES (code_record.id, new_user_id);
  
  -- Increment uses count
  UPDATE invite_codes 
  SET uses_count = uses_count + 1
  WHERE id = code_record.id;
  
  -- Update user profile with referral info
  UPDATE user_profiles
  SET invited_by = code_record.owner_id,
      invite_code_used = code_record.code
  WHERE id = new_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'code', code_record.code,
    'invited_by', code_record.owner_id,
    'uses_remaining', code_record.max_uses - code_record.uses_count - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's invite stats
CREATE OR REPLACE FUNCTION get_invite_stats(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  code_record RECORD;
  invitees JSONB;
BEGIN
  SELECT * INTO code_record FROM invite_codes 
  WHERE owner_id = user_id AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_code', false
    );
  END IF;
  
  -- Get list of people who used this code
  SELECT jsonb_agg(jsonb_build_object(
    'user_id', iu.used_by,
    'used_at', iu.used_at,
    'name', up.name,
    'avatar', up.avatar
  ))
  INTO invitees
  FROM invite_uses iu
  LEFT JOIN user_profiles up ON up.id = iu.used_by
  WHERE iu.invite_code_id = code_record.id;
  
  RETURN jsonb_build_object(
    'has_code', true,
    'code', code_record.code,
    'max_uses', code_record.max_uses,
    'uses_count', code_record.uses_count,
    'uses_remaining', code_record.max_uses - code_record.uses_count,
    'invitees', COALESCE(invitees, '[]'::jsonb),
    'created_at', code_record.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. TRIGGER: Auto-create invite code on profile creation
-- ==========================================
CREATE OR REPLACE FUNCTION auto_create_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_user_invite_code(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_profiles insert
DROP TRIGGER IF EXISTS trigger_create_invite_code ON user_profiles;
CREATE TRIGGER trigger_create_invite_code
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invite_code();
