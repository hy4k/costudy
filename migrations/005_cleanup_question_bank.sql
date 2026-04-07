-- Migration 005: Clean up question_bank data quality
-- The PDF extraction pipeline imported junk rows as questions.
-- This deactivates (is_active = false) bad rows while preserving them for audit.
-- Run this in Supabase SQL Editor.

-- ============================================
-- STEP 1: Add a quality_flag column for tracking
-- ============================================
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS quality_flag TEXT DEFAULT 'unreviewed';

-- ============================================
-- STEP 2: Deactivate junk ESSAY rows
-- These are raw text fragments, rationale snippets, dollar amounts, etc.
-- A real CMA essay scenario should be at least 80 characters.
-- ============================================

-- 2a: Deactivate essays shorter than 80 chars (e.g. "Define beta.", "$80", "Rationale @ $50")
UPDATE question_bank
SET is_active = false, quality_flag = 'too_short'
WHERE question_kind = 'ESSAY'
  AND is_active = true
  AND LENGTH(COALESCE(question_text, '')) < 80;

-- 2b: Deactivate essays that are clearly not questions (rationale/explanation fragments)
UPDATE question_bank
SET is_active = false, quality_flag = 'not_a_question'
WHERE question_kind = 'ESSAY'
  AND is_active = true
  AND (
    question_text ILIKE 'Rationale%'
    OR question_text ILIKE 'Correct Answer Explanation%'
    OR question_text ILIKE 'Explanation for Choice%'
    OR question_text ILIKE 'Question was not answered%'
    OR question_text ILIKE 'Your Answer%'
    OR question_text ILIKE 'Question ID:%'
    OR question_text ILIKE 'Hock %'
    OR question_text ~ '^\s*\$\d'          -- starts with dollar amount like "$80"
    OR question_text ~ '^\s*\(\d+\)\s*$'   -- just a number in parens like "(40)"
    OR question_text ~ '^\s*"?\$\d'        -- quoted dollar amount
    OR question_text ~ '^\s*"?Rationale'   -- quoted rationale
    OR question_text ~ '^\s*Combine like'  -- math fragments
  );

-- 2c: Deactivate essays that lack question characteristics
-- A real essay should contain words like scenario, calculate, explain, analyze, discuss, etc.
UPDATE question_bank
SET is_active = false, quality_flag = 'no_question_intent'
WHERE question_kind = 'ESSAY'
  AND is_active = true
  AND LENGTH(question_text) < 200
  AND question_text !~* '(scenario|calculate|explain|analyze|discuss|describe|prepare|identify|evaluate|recommend|compare|assess|determine|outline|justify|what|why|how|which|list|define)'
  AND quality_flag = 'unreviewed';

-- ============================================
-- STEP 3: Deactivate junk MCQ rows
-- ============================================

-- 3a: MCQs without all 4 options filled
UPDATE question_bank
SET is_active = false, quality_flag = 'missing_options'
WHERE question_kind = 'MCQ'
  AND is_active = true
  AND (
    options IS NULL
    OR options->>'A' IS NULL OR TRIM(options->>'A') = ''
    OR options->>'B' IS NULL OR TRIM(options->>'B') = ''
    OR options->>'C' IS NULL OR TRIM(options->>'C') = ''
    OR options->>'D' IS NULL OR TRIM(options->>'D') = ''
  );

-- 3b: MCQs without a correct answer
UPDATE question_bank
SET is_active = false, quality_flag = 'no_answer'
WHERE question_kind = 'MCQ'
  AND is_active = true
  AND (correct_answer IS NULL OR TRIM(correct_answer) = '' OR correct_answer NOT IN ('A','B','C','D'));

-- 3c: MCQs that are clearly metadata/junk (too short question text)
UPDATE question_bank
SET is_active = false, quality_flag = 'too_short'
WHERE question_kind = 'MCQ'
  AND is_active = true
  AND LENGTH(COALESCE(question_text, '')) < 20;

-- 3d: MCQs that are answer explanations rather than questions
UPDATE question_bank
SET is_active = false, quality_flag = 'not_a_question'
WHERE question_kind = 'MCQ'
  AND is_active = true
  AND (
    question_text ILIKE 'Rationale%'
    OR question_text ILIKE 'Correct Answer Explanation%'
    OR question_text ILIKE 'Explanation for Choice%'
    OR question_text ILIKE 'Question was not answered%'
    OR question_text ILIKE 'Your Answer%'
  );

-- ============================================
-- STEP 4: Mark surviving rows as quality-checked
-- ============================================
UPDATE question_bank
SET quality_flag = 'verified'
WHERE is_active = true AND quality_flag = 'unreviewed';

-- ============================================
-- STEP 5: Report results
-- ============================================
SELECT
  question_kind,
  quality_flag,
  COUNT(*) as count
FROM question_bank
GROUP BY question_kind, quality_flag
ORDER BY question_kind, quality_flag;
