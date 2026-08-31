
-- ... (Existing SQL) ...

-- ==========================================
-- SUPABASE AUTH TRIGGER (FOR AUTOMATIC PROFILE CREATION)
-- ==========================================
-- This ensures any user created in Supabase Auth (or via the app)
-- automatically gets a corresponding user_profiles row with the right role.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role, handle, avatar)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Aspirant'),
    COALESCE(new.raw_user_meta_data->>'role', 'STUDENT'),
    COALESCE(LOWER(REPLACE(new.raw_user_meta_data->>'full_name', ' ', '_')), 'user_' || substr(new.id::text, 1, 8)),
    'https://i.pravatar.cc/150?u=' || new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 11. MENTOR INVITATIONS & GROUP PAYMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS mentor_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  agreed_fee NUMERIC NOT NULL,
  costudy_fee NUMERIC NOT NULL, -- Platform cut
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'PAID'
  session_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS group_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id),
  plan_type TEXT NOT NULL, -- 'PRO_GROUP'
  emails JSONB NOT NULL, -- List of emails to invite
  pre_created_room_id UUID REFERENCES study_rooms(id),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE mentor_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members can view invitations" ON mentor_invitations FOR SELECT USING (true);
CREATE POLICY "Mentors can respond to invitations" ON mentor_invitations FOR UPDATE USING (auth.uid() = mentor_id);
