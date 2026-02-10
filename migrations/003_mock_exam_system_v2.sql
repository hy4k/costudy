-- Migration 003 v2: Mock Exam System with Hybrid Questions
-- SAFE VERSION - Works with existing tables
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. MCQ QUESTIONS TABLE (Real Questions)
-- ============================================
CREATE TABLE IF NOT EXISTS mcq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    part TEXT DEFAULT 'Part 1',
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium',
    source TEXT DEFAULT 'manual',
    times_shown INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AI QUESTION CACHE (Pre-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_question_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'ESSAY')),
    question_data JSONB NOT NULL,
    base_question_id UUID,
    part TEXT DEFAULT 'Part 1',
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium',
    generation_model TEXT DEFAULT 'gpt-4',
    quality_score DECIMAL(3,2),
    is_used BOOLEAN DEFAULT FALSE,
    times_shown INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. EXAM SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    test_type TEXT NOT NULL CHECK (test_type IN ('STANDARD', 'CHALLENGE', 'MCQ_ONLY', 'ESSAY_ONLY', 'QUICK_PRACTICE')),
    test_title TEXT NOT NULL,
    
    mcq_questions JSONB,
    essay_questions JSONB,
    
    current_section TEXT DEFAULT 'MCQ' CHECK (current_section IN ('MCQ', 'ESSAY', 'COMPLETED')),
    current_question_index INT DEFAULT 0,
    
    mcq_answers JSONB DEFAULT '{}',
    mcq_score INT,
    mcq_correct INT,
    mcq_total INT,
    mcq_time_spent_seconds INT DEFAULT 0,
    mcq_completed_at TIMESTAMPTZ,
    
    essay_answers JSONB DEFAULT '{}',
    essay_unlocked BOOLEAN DEFAULT FALSE,
    essay_scores JSONB,
    essay_time_spent_seconds INT DEFAULT 0,
    essay_completed_at TIMESTAMPTZ,
    
    status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'MCQ_COMPLETED', 'ESSAY_LOCKED', 'COMPLETED', 'ABANDONED')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    real_questions_count INT DEFAULT 0,
    ai_questions_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXAM SESSION SNAPSHOTS (Auto-save)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_session_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (safe to re-run)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mcq_questions_topic ON mcq_questions(topic);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_difficulty ON mcq_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_part ON mcq_questions(part);

CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ai_question_cache(question_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_unused ON ai_question_cache(is_used) WHERE is_used = FALSE;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_session_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (prevents errors on re-run)
DROP POLICY IF EXISTS "Questions readable by authenticated" ON mcq_questions;
DROP POLICY IF EXISTS "AI cache readable by authenticated" ON ai_question_cache;
DROP POLICY IF EXISTS "Users own their sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users own their snapshots" ON exam_session_snapshots;

-- Create policies
CREATE POLICY "Questions readable by authenticated" ON mcq_questions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "AI cache readable by authenticated" ON ai_question_cache
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users own their sessions" ON exam_sessions
    FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users own their snapshots" ON exam_session_snapshots
    FOR ALL TO authenticated 
    USING (session_id IN (SELECT id FROM exam_sessions WHERE user_id = auth.uid()));

-- ============================================
-- HELPER FUNCTION: Get hybrid MCQs
-- ============================================
CREATE OR REPLACE FUNCTION get_hybrid_mcqs(
    p_count INT DEFAULT 100,
    p_real_ratio DECIMAL DEFAULT 0.7,
    p_part TEXT DEFAULT 'Part 1'
)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT,
    topic TEXT,
    difficulty TEXT,
    source TEXT
) AS $$
DECLARE
    v_real_count INT;
    v_ai_count INT;
BEGIN
    v_real_count := CEIL(p_count * p_real_ratio);
    v_ai_count := p_count - v_real_count;
    
    RETURN QUERY
    (SELECT 
        mq.id, mq.question_text, mq.option_a, mq.option_b, 
        mq.option_c, mq.option_d, mq.correct_answer::TEXT,
        mq.topic, mq.difficulty, 'real'::TEXT as source
    FROM mcq_questions mq
    WHERE mq.part = p_part OR p_part IS NULL
    ORDER BY RANDOM()
    LIMIT v_real_count)
    
    UNION ALL
    
    (SELECT 
        ac.id,
        (ac.question_data->>'question_text')::TEXT,
        (ac.question_data->>'option_a')::TEXT,
        (ac.question_data->>'option_b')::TEXT,
        (ac.question_data->>'option_c')::TEXT,
        (ac.question_data->>'option_d')::TEXT,
        (ac.question_data->>'correct_answer')::TEXT,
        ac.topic,
        ac.difficulty,
        'ai_generated'::TEXT as source
    FROM ai_question_cache ac
    WHERE ac.question_type = 'MCQ' 
      AND (ac.part = p_part OR p_part IS NULL)
      AND ac.is_used = FALSE
    ORDER BY RANDOM()
    LIMIT v_ai_count);
END;
$$ LANGUAGE plpgsql;

-- Grant execution
GRANT EXECUTE ON FUNCTION get_hybrid_mcqs TO authenticated;

-- ============================================
-- SEED DATA: Sample MCQs (10 for testing)
-- ============================================
INSERT INTO mcq_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty) VALUES
('Which of the following best describes Activity-Based Costing (ABC)?', 
 'A method that allocates costs based on direct labor hours only',
 'A method that assigns costs based on activities that drive resource consumption',
 'A method that uses a single plantwide overhead rate',
 'A method that ignores indirect costs entirely',
 'B', 'Cost Allocation', 'Medium'),

('In variance analysis, a favorable material price variance indicates that:',
 'More materials were used than budgeted',
 'Materials were purchased at a lower price than standard',
 'Production volume exceeded expectations',
 'Labor efficiency improved significantly',
 'B', 'Variance Analysis', 'Easy'),

('Transfer pricing between divisions should ideally:',
 'Always be set at market price regardless of circumstances',
 'Maximize the profit of the selling division only',
 'Align divisional goals with overall corporate objectives',
 'Be set at variable cost to minimize taxes',
 'C', 'Transfer Pricing', 'Hard'),

('The contribution margin ratio is calculated as:',
 'Fixed Costs / Sales Revenue',
 'Variable Costs / Sales Revenue',
 '(Sales - Variable Costs) / Sales',
 'Net Income / Sales Revenue',
 'C', 'CVP Analysis', 'Easy'),

('Which budgeting approach starts from zero and requires justification for all expenses?',
 'Incremental budgeting',
 'Zero-based budgeting',
 'Rolling budgets',
 'Static budgets',
 'B', 'Budgeting Methods', 'Easy'),

('The balanced scorecard includes all of the following perspectives EXCEPT:',
 'Financial perspective',
 'Customer perspective',
 'Internal business process perspective',
 'Competitor perspective',
 'D', 'Balanced Scorecard', 'Medium'),

('Economic Value Added (EVA) is calculated as:',
 'Net Income - Dividends',
 'NOPAT - (Capital × Cost of Capital)',
 'Revenue - Total Costs',
 'Gross Profit - Operating Expenses',
 'B', 'Performance Metrics', 'Hard'),

('Which internal control component involves the tone at the top?',
 'Risk Assessment',
 'Control Activities',
 'Control Environment',
 'Monitoring Activities',
 'C', 'COSO Framework', 'Medium'),

('Under IFRS, inventory is valued at:',
 'Lower of cost or market',
 'Lower of cost or net realizable value',
 'Historical cost only',
 'Fair market value',
 'B', 'Inventory Valuation', 'Medium'),

('The IMA Statement of Ethical Professional Practice includes which standard?',
 'Maximizing shareholder wealth',
 'Competence',
 'Tax minimization',
 'Market share growth',
 'B', 'Professional Ethics', 'Easy')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Migration 003 v2: Mock Exam System completed successfully!' as status;
