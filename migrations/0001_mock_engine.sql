-- =====================================================
-- CoStudy Mock Engine v1
-- Migration 0001 — initial schema for CMA US mock exams
--
-- Adds:
--   exam_sections     — taxonomy (CMA P1/P2 sections + weights)
--   mock_exams        — exam metadata
--   mcq_questions     — structured MCQs (linkable to existing document_sections RAG chunks)
--   essay_prompts     — essay scenarios + rubric JSON
--   mock_attempts     — per-user exam attempts
--   mcq_responses     — per-question answers within an attempt
--   essay_submissions — submitted essay text + multi-pass grading results
--   mastery_topics    — per-topic running mastery scores
--
-- Designed for self-hosted Supabase (postgres 14+).
-- Idempotent: safe to re-run.
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------
-- 1. Exam taxonomy (CMA P1, P2, IELTS, etc. — extensible)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_sections (
  id           TEXT PRIMARY KEY,                     -- 'cma_p1_a', 'cma_p2_b', 'ielts_writing'
  exam         TEXT NOT NULL,                        -- 'cma_p1', 'cma_p2', 'ielts'
  section_code TEXT NOT NULL,                        -- 'A', 'B', 'C'
  title        TEXT NOT NULL,
  weight_pct   INT  NOT NULL CHECK (weight_pct BETWEEN 0 AND 100),
  topics       TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed CMA Part 1 (IMA blueprint weights — source of truth for sectioning)
INSERT INTO exam_sections (id, exam, section_code, title, weight_pct, topics) VALUES
  ('cma_p1_a', 'cma_p1', 'A', 'External Financial Reporting Decisions', 15,
    ARRAY['gaap','ifrs','income_statement','balance_sheet','statement_of_cash_flows','revenue_recognition','inventory_valuation']),
  ('cma_p1_b', 'cma_p1', 'B', 'Planning, Budgeting & Forecasting',      20,
    ARRAY['strategic_planning','budgeting_concepts','forecasting','top_down','bottom_up','flexible_budgets','project_budgets']),
  ('cma_p1_c', 'cma_p1', 'C', 'Performance Management',                 20,
    ARRAY['variance_analysis','cost_variances','revenue_variances','responsibility_centers','balanced_scorecard','transfer_pricing']),
  ('cma_p1_d', 'cma_p1', 'D', 'Cost Management',                        15,
    ARRAY['cost_concepts','costing_systems','overhead_allocation','process_costing','job_order_costing','abc_costing','jit','tqm']),
  ('cma_p1_e', 'cma_p1', 'E', 'Internal Controls',                      15,
    ARRAY['coso_framework','sox','risk_assessment','control_activities','it_general_controls','fraud_detection']),
  ('cma_p1_f', 'cma_p1', 'F', 'Technology & Analytics',                 15,
    ARRAY['data_analytics','data_visualization','etl_processes','machine_learning_basics','data_governance','cybersecurity'])
ON CONFLICT (id) DO NOTHING;

-- Seed CMA Part 2
INSERT INTO exam_sections (id, exam, section_code, title, weight_pct, topics) VALUES
  ('cma_p2_a', 'cma_p2', 'A', 'Financial Statement Analysis',           20,
    ARRAY['ratio_analysis','common_size','horizontal_analysis','quality_of_earnings','off_balance_sheet']),
  ('cma_p2_b', 'cma_p2', 'B', 'Corporate Finance',                      20,
    ARRAY['risk_return','capital_structure','dividend_policy','working_capital','raising_capital']),
  ('cma_p2_c', 'cma_p2', 'C', 'Decision Analysis',                      25,
    ARRAY['cvp_analysis','marginal_analysis','make_or_buy','pricing_decisions','sensitivity_analysis']),
  ('cma_p2_d', 'cma_p2', 'D', 'Risk Management',                        10,
    ARRAY['enterprise_risk','financial_risk','operational_risk','hedging_basics']),
  ('cma_p2_e', 'cma_p2', 'E', 'Investment Decisions',                   10,
    ARRAY['npv','irr','payback','real_options','capital_rationing']),
  ('cma_p2_f', 'cma_p2', 'F', 'Professional Ethics',                    15,
    ARRAY['ima_statement','conflict_of_interest','fraudulent_reporting','whistleblowing','ethical_dilemmas'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 2. Mock exam metadata
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mock_exams (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,                 -- 'cma-p1-mock-01'
  exam           TEXT NOT NULL,                        -- 'cma_p1', 'cma_p2'
  title          TEXT NOT NULL,
  description    TEXT,
  total_minutes  INT  NOT NULL DEFAULT 240,            -- 4 hr exam-grade default
  mcq_minutes    INT  NOT NULL DEFAULT 180,            -- first 3 hr
  essay_minutes  INT  NOT NULL DEFAULT 60,             -- last 1 hr
  mcq_count      INT  NOT NULL DEFAULT 100,
  essay_count    INT  NOT NULL DEFAULT 2,
  difficulty     TEXT NOT NULL DEFAULT 'exam_grade'
                 CHECK (difficulty IN ('practice','easy','medium','hard','exam_grade')),
  is_paid        BOOLEAN NOT NULL DEFAULT false,
  is_published   BOOLEAN NOT NULL DEFAULT false,
  pass_threshold INT NOT NULL DEFAULT 360,             -- IMA scaled pass (out of 500)
  metadata       JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mock_exams_exam_pub ON mock_exams(exam) WHERE is_published;

-- ---------------------------------------------------------------
-- 3. MCQ bank — structured, linkable to your existing 26k RAG chunks
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mcq_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  section_id      TEXT NOT NULL REFERENCES exam_sections(id),
  topic           TEXT,                                -- e.g. 'variance_analysis'
  stem            TEXT NOT NULL,
  choices         JSONB NOT NULL,                      -- [{"key":"A","text":"..."}, ...]
  correct_key     TEXT NOT NULL,                       -- 'A' | 'B' | 'C' | 'D' | 'E'
  explanation     TEXT NOT NULL,                       -- shown only after submission
  difficulty      TEXT NOT NULL DEFAULT 'medium',
  position        INT  NOT NULL,                       -- 1..N display order
  source_chunk_id UUID,                                -- optional FK to document_sections (your existing RAG)
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(choices) = 'array')
);
CREATE INDEX IF NOT EXISTS idx_mcq_exam     ON mcq_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_mcq_section  ON mcq_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_mcq_topic    ON mcq_questions(topic);

-- ---------------------------------------------------------------
-- 4. Essay prompts with model answer + structured rubric
--    model_answer is INTERNAL — never returned to client.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS essay_prompts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  section_id          TEXT NOT NULL REFERENCES exam_sections(id),
  position            INT  NOT NULL,                   -- 1, 2 (CMA gives two essays)
  scenario            TEXT NOT NULL,                   -- the case context
  question            TEXT NOT NULL,                   -- the actual prompt(s), often (a)(b)(c)
  recommended_minutes INT  NOT NULL DEFAULT 15,
  model_answer        TEXT NOT NULL,                   -- internal reference
  rubric              JSONB NOT NULL,                  -- see /02-api/src/types/grading.ts for shape
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_essay_prompts_exam ON essay_prompts(exam_id);

-- ---------------------------------------------------------------
-- 5. Per-user attempts
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mock_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id         UUID NOT NULL REFERENCES mock_exams(id),
  state           TEXT NOT NULL DEFAULT 'in_progress'
                  CHECK (state IN ('in_progress','submitted','grading','completed','abandoned')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,                         -- set when grading_state of every essay = graded
  total_score     NUMERIC(5,2),                        -- on IMA scale (out of 500)
  mcq_score       NUMERIC(5,2),                        -- raw % * weight
  essay_score     NUMERIC(5,2),                        -- raw % * weight
  pass_threshold  INT NOT NULL DEFAULT 360,
  metadata        JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_attempts_user      ON mock_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_user ON mock_attempts(exam_id, user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_state     ON mock_attempts(state) WHERE state IN ('submitted','grading');

-- ---------------------------------------------------------------
-- 6. MCQ responses (one row per question per attempt)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mcq_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id   UUID NOT NULL REFERENCES mock_attempts(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES mcq_questions(id),
  selected_key TEXT,                                   -- nullable for skipped
  is_correct   BOOLEAN,
  flagged      BOOLEAN NOT NULL DEFAULT false,
  time_seconds INT,
  answered_at  TIMESTAMPTZ,
  UNIQUE(attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_mcq_responses_attempt ON mcq_responses(attempt_id);

-- ---------------------------------------------------------------
-- 7. Essay submissions + multi-pass grading results
--    grading runs async; rows transition through grading_state.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS essay_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          UUID NOT NULL REFERENCES mock_attempts(id) ON DELETE CASCADE,
  prompt_id           UUID NOT NULL REFERENCES essay_prompts(id),
  content             TEXT NOT NULL,
  word_count          INT  GENERATED ALWAYS AS (
                        coalesce(array_length(regexp_split_to_array(trim(content), '\s+'), 1), 0)
                      ) STORED,

  -- async grading state machine
  grading_state       TEXT NOT NULL DEFAULT 'pending'
                      CHECK (grading_state IN ('pending','grading','graded','failed')),
  grading_started_at  TIMESTAMPTZ,
  graded_at           TIMESTAMPTZ,
  grading_error       TEXT,

  -- raw per-pass output (preserved for debugging + appeals)
  pass1_concepts      JSONB,                            -- concept extraction
  pass2_calcs         JSONB,                            -- calculation verification
  pass3_communication JSONB,                            -- communication quality
  pass4_aggregate     JSONB,                            -- final aggregation + feedback

  -- denormalized scores for quick dashboards
  concept_score       NUMERIC(5,2),
  calc_score          NUMERIC(5,2),
  comm_score          NUMERIC(5,2),
  total_score         NUMERIC(5,2),                     -- 0–100
  performance_band    TEXT,                             -- 'Distinction'|'Pass'|'Borderline'|'Fail'

  -- ops/cost tracking
  grading_model       TEXT,                             -- e.g. 'claude-sonnet-4-6'
  grading_input_tokens  INT,
  grading_output_tokens INT,
  grading_cost_usd_micro INT,                           -- micro-dollars (1 USD = 1,000,000)

  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, prompt_id)
);
CREATE INDEX IF NOT EXISTS idx_essay_subs_attempt ON essay_submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_essay_subs_state   ON essay_submissions(grading_state)
  WHERE grading_state IN ('pending','grading');

-- ---------------------------------------------------------------
-- 8. Mastery tracking — feeds Mastermind drill recommendations
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mastery_topics (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam              TEXT NOT NULL,                      -- 'cma_p1'
  section_id        TEXT NOT NULL REFERENCES exam_sections(id),
  topic             TEXT NOT NULL,
  attempts          INT NOT NULL DEFAULT 0,
  correct           INT NOT NULL DEFAULT 0,
  last_score        NUMERIC(5,2),
  rolling_score     NUMERIC(5,2),                       -- weighted avg of last 10 attempts
  last_practiced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, exam, section_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_mastery_user_score ON mastery_topics(user_id, rolling_score);

-- ---------------------------------------------------------------
-- 9. updated_at trigger helper
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mock_exams_uat ON mock_exams;
CREATE TRIGGER trg_mock_exams_uat
  BEFORE UPDATE ON mock_exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- 10. Row Level Security
--     Backend uses service-role key to bypass RLS for content delivery.
--     Direct client access is locked down so:
--      - mcq.correct_key, mcq.explanation can't leak before submission
--      - essay.model_answer never leaks
--      - users only see their OWN attempts/responses/submissions
-- ---------------------------------------------------------------
ALTER TABLE mock_exams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_prompts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_topics     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can list published exams
DROP POLICY IF EXISTS p_mock_exams_select_published ON mock_exams;
CREATE POLICY p_mock_exams_select_published ON mock_exams
  FOR SELECT TO authenticated
  USING (is_published = true);

-- MCQs and essay prompts: NO direct client read.
-- Backend (service_role) delivers them, stripping correct_key/model_answer.
DROP POLICY IF EXISTS p_mcq_questions_no_direct ON mcq_questions;
CREATE POLICY p_mcq_questions_no_direct ON mcq_questions
  FOR SELECT TO authenticated USING (false);

DROP POLICY IF EXISTS p_essay_prompts_no_direct ON essay_prompts;
CREATE POLICY p_essay_prompts_no_direct ON essay_prompts
  FOR SELECT TO authenticated USING (false);

-- Attempts: user owns their own
DROP POLICY IF EXISTS p_attempts_owner ON mock_attempts;
CREATE POLICY p_attempts_owner ON mock_attempts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS p_mcq_responses_owner ON mcq_responses;
CREATE POLICY p_mcq_responses_owner ON mcq_responses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM mock_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM mock_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS p_essay_subs_owner ON essay_submissions;
CREATE POLICY p_essay_subs_owner ON essay_submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM mock_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM mock_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS p_mastery_owner ON mastery_topics;
CREATE POLICY p_mastery_owner ON mastery_topics
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- exam_sections is reference data — readable by anyone authenticated
ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_exam_sections_read ON exam_sections;
CREATE POLICY p_exam_sections_read ON exam_sections
  FOR SELECT TO authenticated USING (true);

COMMIT;

-- =====================================================
-- DONE. Verify with:
--   SELECT id, title, weight_pct FROM exam_sections ORDER BY id;
-- Should return 12 rows (CMA P1 + P2).
-- =====================================================
