-- ============================================
-- CoStudy Grading System Migration
-- Essay grading queue + Test center tables
-- Run in Supabase SQL Editor
-- ============================================

-- 1. ESSAY GRADING QUEUE
-- Backend worker polls this table to process essay evaluations via LLM
CREATE TABLE IF NOT EXISTS essay_grading_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    essay_question_id TEXT NOT NULL,
    essay_text TEXT NOT NULL,
    scenario_text TEXT,
    topic TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','RETRY')),
    priority INT DEFAULT 0,          -- Higher = processed first (test center = 10, online = 0)
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    result JSONB,                    -- Structured evaluation result
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_essay_queue_status ON essay_grading_queue(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_essay_queue_session ON essay_grading_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_essay_queue_user ON essay_grading_queue(user_id);

-- RLS: Users can see their own queue entries
ALTER TABLE essay_grading_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own essay queue entries"
    ON essay_grading_queue FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own essay queue entries"
    ON essay_grading_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role (backend worker) needs full access — handled by service_role key

-- 2. TEST CENTER SESSIONS
CREATE TABLE IF NOT EXISTS test_center_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    name TEXT NOT NULL,
    exam_config_key TEXT NOT NULL,
    status TEXT DEFAULT 'SETUP' CHECK (status IN ('SETUP','READY','LIVE','COMPLETED','CANCELLED')),
    station_count INT DEFAULT 30,
    settings JSONB DEFAULT '{}',     -- { lockBrowser, allowCalculator, customDuration }
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_center_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test center sessions"
    ON test_center_sessions FOR ALL
    USING (auth.uid() = admin_user_id);

CREATE POLICY "Authenticated users can view test center sessions"
    ON test_center_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

-- 3. TEST CENTER STATIONS
CREATE TABLE IF NOT EXISTS test_center_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_session_id UUID NOT NULL REFERENCES test_center_sessions(id) ON DELETE CASCADE,
    station_number INT NOT NULL,
    candidate_name TEXT,
    student_user_id UUID,
    exam_session_id UUID,
    status TEXT DEFAULT 'EMPTY' CHECK (status IN ('EMPTY','ASSIGNED','READY','ACTIVE','SUBMITTED','DISCONNECTED')),
    last_heartbeat TIMESTAMPTZ,
    ip_address TEXT,
    proctoring_events JSONB DEFAULT '[]',  -- [{type, timestamp, detail}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(center_session_id, station_number)
);

CREATE INDEX IF NOT EXISTS idx_tc_stations_session ON test_center_stations(center_session_id);

ALTER TABLE test_center_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stations"
    ON test_center_stations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own station"
    ON test_center_stations FOR UPDATE
    USING (auth.uid() = student_user_id OR
           auth.uid() = (SELECT admin_user_id FROM test_center_sessions WHERE id = center_session_id));

CREATE POLICY "Admin can manage stations"
    ON test_center_stations FOR ALL
    USING (auth.uid() = (SELECT admin_user_id FROM test_center_sessions WHERE id = center_session_id));

-- 4. ENABLE REALTIME for essay grading and test center monitoring
-- (Supabase Realtime listens for changes to push to subscribers)
ALTER PUBLICATION supabase_realtime ADD TABLE essay_grading_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE test_center_stations;

-- 5. HELPER: Function to pick next essay from queue (for backend worker)
CREATE OR REPLACE FUNCTION pick_next_essay_for_grading()
RETURNS essay_grading_queue AS $$
DECLARE
    picked essay_grading_queue;
BEGIN
    SELECT * INTO picked
    FROM essay_grading_queue
    WHERE status = 'PENDING'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF picked IS NOT NULL THEN
        UPDATE essay_grading_queue
        SET status = 'PROCESSING',
            started_at = NOW(),
            attempts = attempts + 1
        WHERE id = picked.id;
    END IF;

    RETURN picked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. HELPER: Complete essay grading and update exam session
CREATE OR REPLACE FUNCTION complete_essay_grading(
    queue_id UUID,
    evaluation_result JSONB
)
RETURNS void AS $$
DECLARE
    queue_row essay_grading_queue;
    current_scores JSONB;
    all_done BOOLEAN;
BEGIN
    -- Update queue entry
    UPDATE essay_grading_queue
    SET status = 'COMPLETED',
        result = evaluation_result,
        completed_at = NOW()
    WHERE id = queue_id
    RETURNING * INTO queue_row;

    -- Get current essay_scores from exam session
    SELECT COALESCE(essay_scores, '{"status":"PENDING","essays":{}}')::JSONB
    INTO current_scores
    FROM exam_sessions
    WHERE id = queue_row.session_id;

    -- Add this essay's evaluation
    current_scores = jsonb_set(
        current_scores,
        ARRAY['essays', queue_row.essay_question_id],
        evaluation_result
    );

    -- Check if all essays for this session are graded
    SELECT NOT EXISTS(
        SELECT 1 FROM essay_grading_queue
        WHERE session_id = queue_row.session_id
        AND status != 'COMPLETED'
    ) INTO all_done;

    IF all_done THEN
        current_scores = jsonb_set(current_scores, '{status}', '"COMPLETE"');
        current_scores = jsonb_set(current_scores, '{gradedAt}', to_jsonb(NOW()::TEXT));
    ELSE
        current_scores = jsonb_set(current_scores, '{status}', '"PARTIAL"');
    END IF;

    -- Update exam session
    UPDATE exam_sessions
    SET essay_scores = current_scores
    WHERE id = queue_row.session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Report current state
DO $$
BEGIN
    RAISE NOTICE 'Grading system tables created:';
    RAISE NOTICE '  - essay_grading_queue (for async essay evaluation)';
    RAISE NOTICE '  - test_center_sessions (admin exam batches)';
    RAISE NOTICE '  - test_center_stations (per-workstation tracking)';
    RAISE NOTICE '  - pick_next_essay_for_grading() function';
    RAISE NOTICE '  - complete_essay_grading() function';
END $$;
