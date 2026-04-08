-- ============================================
-- 007: Test Center Candidates
-- Pre-registered candidate roster, check-in, station assignment
-- ============================================

-- Candidate roster for each test center session
CREATE TABLE IF NOT EXISTS test_center_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_center_sessions(id) ON DELETE CASCADE,

    -- Candidate identity
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    candidate_id TEXT,            -- External ID (registration number, roll number, etc.)
    photo_url TEXT,
    notes TEXT,

    -- Check-in state
    status TEXT NOT NULL DEFAULT 'REGISTERED'
        CHECK (status IN ('REGISTERED', 'CHECKED_IN', 'ASSIGNED', 'IN_EXAM', 'COMPLETED', 'NO_SHOW')),
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID,           -- Proctor user ID who verified

    -- Station assignment
    assigned_station INT,         -- Station number (1-30 etc)
    assigned_at TIMESTAMPTZ,

    -- Exam linkage (set when exam actually starts)
    exam_session_id UUID,         -- References exam_sessions.id once exam begins
    user_id UUID,                 -- Supabase auth user (if candidate logs in)

    -- Source tracking
    source TEXT DEFAULT 'manual'
        CHECK (source IN ('manual', 'csv_upload', 'fets_api', 'registration_form')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tc_candidates_session ON test_center_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_tc_candidates_status ON test_center_candidates(session_id, status);
CREATE INDEX IF NOT EXISTS idx_tc_candidates_station ON test_center_candidates(session_id, assigned_station);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tc_candidate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tc_candidate_updated ON test_center_candidates;
CREATE TRIGGER trg_tc_candidate_updated
    BEFORE UPDATE ON test_center_candidates
    FOR EACH ROW EXECUTE FUNCTION update_tc_candidate_timestamp();

-- RLS
ALTER TABLE test_center_candidates ENABLE ROW LEVEL SECURITY;

-- Admin can manage candidates for their sessions
CREATE POLICY tc_candidates_admin ON test_center_candidates
    FOR ALL USING (
        session_id IN (
            SELECT id FROM test_center_sessions WHERE admin_user_id = auth.uid()
        )
    );

-- Candidates can see their own record (by user_id)
CREATE POLICY tc_candidates_self ON test_center_candidates
    FOR SELECT USING (user_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE test_center_candidates;
