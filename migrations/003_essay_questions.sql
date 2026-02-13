-- Migration: Create essay_questions table for CMA mock tests
-- Run this in Supabase SQL Editor

-- Create enum for exam parts
DO $$ BEGIN
    CREATE TYPE exam_part AS ENUM ('Part1', 'Part2', 'Additional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create essay_questions table
CREATE TABLE IF NOT EXISTS essay_questions (
    id TEXT PRIMARY KEY,
    part exam_part NOT NULL DEFAULT 'Part1',
    topic TEXT NOT NULL,
    scenario TEXT NOT NULL,
    tasks TEXT NOT NULL,
    answer_guidance TEXT,
    citations TEXT,
    difficulty TEXT DEFAULT 'Medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create MCQ questions table (for real questions later)
CREATE TABLE IF NOT EXISTS mcq_questions (
    id TEXT PRIMARY KEY,
    part exam_part NOT NULL DEFAULT 'Part1',
    section TEXT NOT NULL,
    topic TEXT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    difficulty TEXT DEFAULT 'Medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_sessions table for progress tracking
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL,
    answers JSONB DEFAULT '[]',
    current_index INTEGER DEFAULT 0,
    time_remaining INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_saved_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score_mcq INTEGER,
    score_essay INTEGER,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_essay_questions_part ON essay_questions(part);
CREATE INDEX IF NOT EXISTS idx_essay_questions_topic ON essay_questions(topic);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_part ON mcq_questions(part);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_section ON mcq_questions(section);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);

-- Enable RLS
ALTER TABLE essay_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Questions readable by authenticated users
CREATE POLICY "Questions are viewable by authenticated users" ON essay_questions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "MCQ Questions are viewable by authenticated users" ON mcq_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies: Users can only see/modify their own exam sessions
CREATE POLICY "Users can view own exam sessions" ON exam_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam sessions" ON exam_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam sessions" ON exam_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to get random essay questions
CREATE OR REPLACE FUNCTION get_random_essays(p_count INTEGER DEFAULT 2, p_part exam_part DEFAULT NULL)
RETURNS SETOF essay_questions AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM essay_questions
    WHERE is_active = true
    AND (p_part IS NULL OR part = p_part)
    ORDER BY RANDOM()
    LIMIT p_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get random MCQ questions
CREATE OR REPLACE FUNCTION get_random_mcqs(p_count INTEGER DEFAULT 100, p_part exam_part DEFAULT NULL)
RETURNS SETOF mcq_questions AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM mcq_questions
    WHERE is_active = true
    AND (p_part IS NULL OR part = p_part)
    ORDER BY RANDOM()
    LIMIT p_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE essay_questions IS 'CMA essay questions for mock tests - imported from CSV';
COMMENT ON TABLE mcq_questions IS 'CMA MCQ questions for mock tests';
COMMENT ON TABLE exam_sessions IS 'User exam session progress and results';
