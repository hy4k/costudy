-- Migration 004: AI Question Cache & Generation Infrastructure
-- Run this in Supabase SQL Editor
-- Required for the hybrid question strategy (70% real + 30% AI-generated)

-- ============================================
-- 0. ENSURE question_bank EXISTS (unified table used by examService)
--    The costudy-api ingestion pipeline creates and populates this.
--    This is a safety net in case it was never created.
-- ============================================
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_kind TEXT NOT NULL CHECK (question_kind IN ('MCQ', 'ESSAY')),
    question_text TEXT NOT NULL,
    options JSONB,                -- {A: "...", B: "...", C: "...", D: "..."} for MCQs
    correct_answer TEXT,          -- 'A','B','C','D' for MCQs
    explanation TEXT,
    part TEXT NOT NULL DEFAULT 'Part 1',
    section TEXT DEFAULT 'General',
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium',
    tags TEXT[],
    source_kind TEXT DEFAULT 'real', -- 'real', 'ai_generated', 'imported'
    is_active BOOLEAN DEFAULT true,
    times_shown INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qbank_kind ON question_bank(question_kind);
CREATE INDEX IF NOT EXISTS idx_qbank_part ON question_bank(part);
CREATE INDEX IF NOT EXISTS idx_qbank_active ON question_bank(is_active) WHERE is_active = true;

-- RLS for question_bank
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_bank' AND policyname = 'qbank_select_auth') THEN
        CREATE POLICY "qbank_select_auth" ON question_bank FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- ============================================
-- 1. AI QUESTION CACHE (Pre-generated + On-demand)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_question_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'ESSAY')),
    question_data JSONB NOT NULL,
    base_question_id UUID,
    part TEXT NOT NULL DEFAULT 'Part 1',
    section TEXT NOT NULL DEFAULT 'General',
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium',
    generation_model TEXT DEFAULT 'costudy-backend-llm',
    quality_score DECIMAL(3,2) DEFAULT 0.75,
    is_used BOOLEAN DEFAULT FALSE,
    times_shown INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ai_question_cache(question_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_unused ON ai_question_cache(is_used) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_ai_cache_part ON ai_question_cache(part);
CREATE INDEX IF NOT EXISTS idx_ai_cache_quality ON ai_question_cache(quality_score);

-- ============================================
-- 3. QUESTION GENERATION JOBS (batch tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS question_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL CHECK (job_type IN ('BATCH_MCQ', 'BATCH_ESSAY', 'VARIATION', 'TOPIC_FILL')),
    config JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    questions_generated INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXAM SESSION SNAPSHOTS (auto-save)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_session_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE ai_question_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read questions during exams
CREATE POLICY "ai_cache_select_auth"
    ON ai_question_cache FOR SELECT
    TO authenticated
    USING (true);

-- Allow marking questions as used during exam sessions
CREATE POLICY "ai_cache_update_auth"
    ON ai_question_cache FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow inserting new AI-generated questions (from on-demand generation)
CREATE POLICY "ai_cache_insert_auth"
    ON ai_question_cache FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- 6. HELPER: Recycle used AI questions (call periodically)
-- ============================================
CREATE OR REPLACE FUNCTION recycle_ai_question_cache(target_part TEXT DEFAULT 'Part 1')
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    recycled_count INTEGER;
BEGIN
    UPDATE ai_question_cache
    SET is_used = false, times_shown = 0
    WHERE is_used = true AND part = target_part;

    GET DIAGNOSTICS recycled_count = ROW_COUNT;
    RETURN recycled_count;
END;
$$;
