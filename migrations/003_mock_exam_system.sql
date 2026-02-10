-- Migration 003: Mock Exam System with Hybrid Questions
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
    part TEXT NOT NULL DEFAULT 'Part 1',
    section TEXT NOT NULL,
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    source TEXT DEFAULT 'manual', -- 'manual', 'imported', 'ai_verified'
    times_shown INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ESSAY QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS essay_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_text TEXT NOT NULL,
    requirements TEXT NOT NULL, -- JSON array of requirement strings
    part TEXT NOT NULL DEFAULT 'Part 1',
    section TEXT NOT NULL,
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    grading_rubric JSONB, -- AI grading criteria
    sample_answer TEXT,
    max_score INT DEFAULT 100,
    time_allocation_minutes INT DEFAULT 30,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. AI QUESTION CACHE (Pre-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_question_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'ESSAY')),
    question_data JSONB NOT NULL, -- Full question object
    base_question_id UUID, -- If variation of existing question
    part TEXT NOT NULL DEFAULT 'Part 1',
    section TEXT NOT NULL,
    topic TEXT,
    difficulty TEXT DEFAULT 'Medium',
    generation_model TEXT DEFAULT 'gpt-4',
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    is_used BOOLEAN DEFAULT FALSE,
    times_shown INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXAM SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Test Configuration
    test_type TEXT NOT NULL CHECK (test_type IN ('STANDARD', 'CHALLENGE', 'MCQ_ONLY', 'ESSAY_ONLY', 'QUICK_PRACTICE')),
    test_title TEXT NOT NULL,
    
    -- Question Pool (stored as JSON for session integrity)
    mcq_questions JSONB, -- Array of question IDs with order
    essay_questions JSONB,
    
    -- Progress Tracking
    current_section TEXT DEFAULT 'MCQ' CHECK (current_section IN ('MCQ', 'ESSAY', 'COMPLETED')),
    current_question_index INT DEFAULT 0,
    
    -- MCQ Section Results
    mcq_answers JSONB DEFAULT '{}', -- {questionId: {selected, flagged, timeSpent}}
    mcq_score INT,
    mcq_correct INT,
    mcq_total INT,
    mcq_time_spent_seconds INT DEFAULT 0,
    mcq_completed_at TIMESTAMPTZ,
    
    -- Essay Section Results
    essay_answers JSONB DEFAULT '{}', -- {questionId: {text, wordCount, timeSpent}}
    essay_unlocked BOOLEAN DEFAULT FALSE,
    essay_scores JSONB, -- AI grading results
    essay_time_spent_seconds INT DEFAULT 0,
    essay_completed_at TIMESTAMPTZ,
    
    -- Overall Session
    status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'MCQ_COMPLETED', 'ESSAY_LOCKED', 'COMPLETED', 'ABANDONED')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Hybrid tracking
    real_questions_count INT DEFAULT 0,
    ai_questions_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EXAM SESSION SNAPSHOTS (Auto-save)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_session_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. QUESTION GENERATION JOBS
-- ============================================
CREATE TABLE IF NOT EXISTS question_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL CHECK (job_type IN ('BATCH_MCQ', 'BATCH_ESSAY', 'VARIATION', 'TOPIC_FILL')),
    config JSONB NOT NULL, -- {count, topics, difficulty, etc}
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    questions_generated INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mcq_questions_section ON mcq_questions(section);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_difficulty ON mcq_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_part ON mcq_questions(part);

CREATE INDEX IF NOT EXISTS idx_essay_questions_section ON essay_questions(section);
CREATE INDEX IF NOT EXISTS idx_essay_questions_part ON essay_questions(part);

CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ai_question_cache(question_type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_unused ON ai_question_cache(is_used) WHERE is_used = FALSE;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_question_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_session_snapshots ENABLE ROW LEVEL SECURITY;

-- Questions are readable by all authenticated users
CREATE POLICY "Questions readable by authenticated" ON mcq_questions
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Essays readable by authenticated" ON essay_questions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "AI cache readable by authenticated" ON ai_question_cache
    FOR SELECT TO authenticated USING (true);

-- Sessions belong to users
CREATE POLICY "Users own their sessions" ON exam_sessions
    FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users own their snapshots" ON exam_session_snapshots
    FOR ALL TO authenticated 
    USING (session_id IN (SELECT id FROM exam_sessions WHERE user_id = auth.uid()));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get random MCQs with hybrid mix
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
    correct_answer CHAR(1),
    section TEXT,
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
    -- Real questions
    (SELECT 
        mq.id, mq.question_text, mq.option_a, mq.option_b, 
        mq.option_c, mq.option_d, mq.correct_answer,
        mq.section, mq.difficulty, 'real'::TEXT as source
    FROM mcq_questions mq
    WHERE mq.part = p_part
    ORDER BY RANDOM()
    LIMIT v_real_count)
    
    UNION ALL
    
    -- AI-generated questions
    (SELECT 
        ac.id,
        (ac.question_data->>'question_text')::TEXT,
        (ac.question_data->>'option_a')::TEXT,
        (ac.question_data->>'option_b')::TEXT,
        (ac.question_data->>'option_c')::TEXT,
        (ac.question_data->>'option_d')::TEXT,
        (ac.question_data->>'correct_answer')::CHAR(1),
        ac.section,
        ac.difficulty,
        'ai_generated'::TEXT as source
    FROM ai_question_cache ac
    WHERE ac.question_type = 'MCQ' 
      AND ac.part = p_part
      AND ac.is_used = FALSE
    ORDER BY RANDOM()
    LIMIT v_ai_count);
END;
$$ LANGUAGE plpgsql;

-- Get random essays
CREATE OR REPLACE FUNCTION get_essay_questions(
    p_count INT DEFAULT 2,
    p_part TEXT DEFAULT 'Part 1'
)
RETURNS TABLE (
    id UUID,
    scenario_text TEXT,
    requirements TEXT,
    section TEXT,
    topic TEXT,
    difficulty TEXT,
    time_allocation_minutes INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eq.id, eq.scenario_text, eq.requirements,
        eq.section, eq.topic, eq.difficulty, eq.time_allocation_minutes
    FROM essay_questions eq
    WHERE eq.part = p_part
    ORDER BY RANDOM()
    LIMIT p_count;
END;
$$ LANGUAGE plpgsql;

-- Calculate MCQ score percentage
CREATE OR REPLACE FUNCTION calculate_mcq_score(p_session_id UUID)
RETURNS TABLE (
    correct INT,
    total INT,
    percentage DECIMAL
) AS $$
DECLARE
    v_answers JSONB;
    v_questions JSONB;
    v_correct INT := 0;
    v_total INT := 0;
    v_question RECORD;
BEGIN
    SELECT mcq_answers, mcq_questions INTO v_answers, v_questions
    FROM exam_sessions WHERE id = p_session_id;
    
    -- Count correct answers
    FOR v_question IN 
        SELECT * FROM jsonb_array_elements(v_questions) AS q
    LOOP
        v_total := v_total + 1;
        -- Check if answer matches (simplified - actual impl would join with mcq_questions)
        IF v_answers ? (v_question.value->>'id') THEN
            -- Would need to verify against correct_answer
            v_correct := v_correct + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        v_correct,
        v_total,
        CASE WHEN v_total > 0 THEN ROUND((v_correct::DECIMAL / v_total) * 100, 2) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Sample MCQs (10 for testing)
-- ============================================
INSERT INTO mcq_questions (question_text, option_a, option_b, option_c, option_d, correct_answer, section, topic, difficulty) VALUES
('Which of the following best describes Activity-Based Costing (ABC)?', 
 'A method that allocates costs based on direct labor hours only',
 'A method that assigns costs based on activities that drive resource consumption',
 'A method that uses a single plantwide overhead rate',
 'A method that ignores indirect costs entirely',
 'B', 'Cost Management', 'Cost Allocation', 'Medium'),

('In variance analysis, a favorable material price variance indicates that:',
 'More materials were used than budgeted',
 'Materials were purchased at a lower price than standard',
 'Production volume exceeded expectations',
 'Labor efficiency improved significantly',
 'B', 'Cost Management', 'Variance Analysis', 'Easy'),

('Transfer pricing between divisions should ideally:',
 'Always be set at market price regardless of circumstances',
 'Maximize the profit of the selling division only',
 'Align divisional goals with overall corporate objectives',
 'Be set at variable cost to minimize taxes',
 'C', 'Cost Management', 'Transfer Pricing', 'Hard'),

('The contribution margin ratio is calculated as:',
 'Fixed Costs / Sales Revenue',
 'Variable Costs / Sales Revenue',
 '(Sales - Variable Costs) / Sales',
 'Net Income / Sales Revenue',
 'C', 'Cost Management', 'CVP Analysis', 'Easy'),

('Which budgeting approach starts from zero and requires justification for all expenses?',
 'Incremental budgeting',
 'Zero-based budgeting',
 'Rolling budgets',
 'Static budgets',
 'B', 'Planning & Budgeting', 'Budgeting Methods', 'Easy'),

('The balanced scorecard includes all of the following perspectives EXCEPT:',
 'Financial perspective',
 'Customer perspective',
 'Internal business process perspective',
 'Competitor perspective',
 'D', 'Performance Management', 'Balanced Scorecard', 'Medium'),

('Economic Value Added (EVA) is calculated as:',
 'Net Income - Dividends',
 'NOPAT - (Capital × Cost of Capital)',
 'Revenue - Total Costs',
 'Gross Profit - Operating Expenses',
 'B', 'Financial Analysis', 'Performance Metrics', 'Hard'),

('Which internal control component involves the tone at the top?',
 'Risk Assessment',
 'Control Activities',
 'Control Environment',
 'Monitoring Activities',
 'C', 'Internal Controls', 'COSO Framework', 'Medium'),

('Under IFRS, inventory is valued at:',
 'Lower of cost or market',
 'Lower of cost or net realizable value',
 'Historical cost only',
 'Fair market value',
 'B', 'Financial Reporting', 'Inventory Valuation', 'Medium'),

('The IMA Statement of Ethical Professional Practice includes which standard?',
 'Maximizing shareholder wealth',
 'Competence',
 'Tax minimization',
 'Market share growth',
 'B', 'Ethics', 'Professional Ethics', 'Easy')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Sample Essays (4 for testing)
-- ============================================
INSERT INTO essay_questions (scenario_text, requirements, section, topic, difficulty, time_allocation_minutes) VALUES
('SCENARIO:

Omega Corp is a US-based manufacturer considering expansion into the European market. The CFO is concerned about foreign currency exchange risk as the Euro has been volatile against the USD. The company expects to receive €5 million in revenue over the next year.

Current exchange rate: 1 EUR = 1.08 USD
Forward rate (1 year): 1 EUR = 1.05 USD
The company has identified a European supplier that could provide raw materials at €2 million annually.',

'["1. Identify and explain the three types of foreign currency risk exposure Omega Corp might face (Transaction, Translation, Economic).", "2. Calculate the potential gain or loss if Omega enters a forward contract to hedge its expected €5 million revenue.", "3. Recommend a comprehensive hedging strategy using financial derivatives to mitigate the risks identified."]',
'Financial Risk Management', 'Foreign Currency Risk', 'Hard', 30),

('SCENARIO:

You are the Controller of TechSolutions Inc. The company has traditionally used a volume-based costing system (direct labor hours) to allocate overhead. Recently, competitors have been undercutting TechSolutions'' prices on high-volume products while TechSolutions remains uncompetitively cheap on low-volume specialty products.

Current overhead pool: $2,400,000
Total direct labor hours: 80,000
Product A (high volume): 60,000 DLH, 200 setups
Product B (low volume): 20,000 DLH, 800 setups
Setup cost driver rate: $1,200 per setup',

'["1. Calculate product costs under the traditional volume-based system.", "2. Calculate product costs using Activity-Based Costing with setups as the cost driver.", "3. Explain why the traditional costing system distorts product costs and how ABC provides more accurate cost information for strategic pricing decisions."]',
'Cost Management', 'Activity-Based Costing', 'Hard', 30),

('SCENARIO:

DataStream Analytics is a growing SaaS company preparing its annual budget. The CEO wants to implement a balanced scorecard approach to align departmental goals with the company''s strategic objectives. The company''s key goals are: 30% revenue growth, customer retention above 90%, and product innovation leadership.

Current metrics:
- Annual Recurring Revenue: $12 million
- Customer churn rate: 15%
- NPS Score: 42
- Average development cycle: 6 months',

'["1. Design a balanced scorecard with at least 3 KPIs for each of the four perspectives (Financial, Customer, Internal Process, Learning & Growth).", "2. Explain how these KPIs connect to the company''s strategic goals through cause-and-effect relationships.", "3. Recommend a performance incentive structure that aligns employee behavior with scorecard objectives."]',
'Performance Management', 'Balanced Scorecard', 'Medium', 30),

('SCENARIO:

GreenTech Manufacturing is evaluating a capital investment in new environmentally sustainable equipment. The equipment costs $5 million and is expected to generate annual cash savings of $1.2 million for 6 years. The company''s WACC is 10%. The equipment qualifies for a government sustainability grant of $500,000.

Additional considerations:
- Equipment will require $200,000 in training costs (Year 1)
- Maintenance costs of $100,000 annually starting Year 2
- Salvage value of $400,000 at end of Year 6',

'["1. Calculate the NPV of the investment including all relevant cash flows.", "2. Calculate the IRR and payback period.", "3. Discuss qualitative factors that should be considered in addition to the financial analysis, including ESG considerations."]',
'Financial Analysis', 'Capital Budgeting', 'Hard', 30)
ON CONFLICT DO NOTHING;

-- ============================================
-- Grant execution rights
-- ============================================
GRANT EXECUTE ON FUNCTION get_hybrid_mcqs TO authenticated;
GRANT EXECUTE ON FUNCTION get_essay_questions TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mcq_score TO authenticated;

-- Done!
SELECT 'Migration 003: Mock Exam System completed successfully!' as status;
