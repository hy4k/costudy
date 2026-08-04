
-- ... (Existing SQL) ...

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
