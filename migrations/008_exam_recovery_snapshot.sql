-- ============================================
-- 008: Exam Session Recovery & Submission Snapshot
-- Adds columns for timer persistence, full question backup,
-- submission snapshot, and test center linkage.
-- ============================================

-- Timer state for session recovery (resume from where they left off)
ALTER TABLE exam_sessions
    ADD COLUMN IF NOT EXISTS time_remaining_seconds INT;

-- Full question data stored with session (for re-evaluation if question bank changes)
-- Contains the actual question text, options, correct answers — everything needed to re-grade
ALTER TABLE exam_sessions
    ADD COLUMN IF NOT EXISTS full_questions JSONB;

-- Complete submission snapshot — frozen at submit time for archival/re-evaluation
-- Contains: all answers, all questions, timing data, candidate info, config
ALTER TABLE exam_sessions
    ADD COLUMN IF NOT EXISTS submitted_snapshot JSONB;

-- Link exam session to a test center session (for recovery across stations)
ALTER TABLE exam_sessions
    ADD COLUMN IF NOT EXISTS test_center_session_id UUID;

-- Link exam session to the candidate record
ALTER TABLE exam_sessions
    ADD COLUMN IF NOT EXISTS test_center_candidate_id UUID;

-- Index for finding active sessions in a test center context
CREATE INDEX IF NOT EXISTS idx_exam_sessions_tc_recovery
    ON exam_sessions(user_id, test_center_session_id, status)
    WHERE test_center_session_id IS NOT NULL AND status = 'IN_PROGRESS';

-- Index for finding sessions by candidate
CREATE INDEX IF NOT EXISTS idx_exam_sessions_tc_candidate
    ON exam_sessions(test_center_candidate_id)
    WHERE test_center_candidate_id IS NOT NULL;
