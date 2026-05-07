-- =====================================================
-- SEED: CMA Part 1 — Mock 01 (sample / proof-of-concept)
-- =====================================================
-- One published mock with:
--   • 5 sample MCQs across sections B, C, D
--   • 1 essay prompt: variance analysis (Section C — Performance Management)
--   • Rubric authored to match the IMA-style essay grading approach
--
-- This is a STARTER seed. Your content team should use this as the template
-- shape and bulk-load the real 100 MCQ + 2 essay exam-grade content.
--
-- Safe to re-run: uses ON CONFLICT DO NOTHING / DO UPDATE.
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------
-- 1. The mock itself
-- ---------------------------------------------------------------
INSERT INTO mock_exams (
  slug, exam, title, description,
  total_minutes, mcq_minutes, essay_minutes,
  mcq_count, essay_count, difficulty,
  is_paid, is_published, pass_threshold
) VALUES (
  'cma-p1-mock-01',
  'cma_p1',
  'CMA Part 1 — Mock 01',
  'Full-length practice exam aligned to the IMA blueprint. Performance Management, Cost Management, and Planning & Budgeting weighted per official content specification.',
  240, 180, 60,
  5, 1, 'exam_grade',
  false, true, 360
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_published = EXCLUDED.is_published;

-- Capture the id for child inserts
DO $$
DECLARE
  v_exam_id UUID;
BEGIN
  SELECT id INTO v_exam_id FROM mock_exams WHERE slug = 'cma-p1-mock-01';

  -- ---------------------------------------------------------------
  -- 2. Sample MCQs (5 questions across sections)
  -- ---------------------------------------------------------------
  -- Wipe + reseed MCQs for this mock so re-running this script produces
  -- a deterministic question set.
  DELETE FROM mcq_questions WHERE exam_id = v_exam_id;

  INSERT INTO mcq_questions (exam_id, section_id, topic, stem, choices, correct_key, explanation, difficulty, position) VALUES
  (
    v_exam_id, 'cma_p1_b', 'flexible_budgets',
    'A company prepared a flexible budget for production levels of 10,000, 12,000, and 14,000 units. Variable manufacturing overhead is budgeted at $4 per unit and fixed manufacturing overhead is $80,000. If actual production was 13,000 units, what is the flexible budget for total manufacturing overhead?',
    '[
      {"key":"A","text":"$132,000"},
      {"key":"B","text":"$128,000"},
      {"key":"C","text":"$120,000"},
      {"key":"D","text":"$80,000"}
    ]'::jsonb,
    'A',
    'Flexible budget total manufacturing overhead = (Variable rate × actual units) + Fixed overhead = ($4 × 13,000) + $80,000 = $52,000 + $80,000 = $132,000. The flexible budget adjusts the variable component to actual output while holding fixed overhead constant.',
    'medium', 1
  ),
  (
    v_exam_id, 'cma_p1_c', 'variance_analysis',
    'Standard direct labor cost is 0.5 hours per unit at $20 per hour. During May, 4,800 units were produced using 2,500 actual hours at $19.50 per hour. What is the direct labor efficiency variance?',
    '[
      {"key":"A","text":"$1,250 favorable"},
      {"key":"B","text":"$2,000 unfavorable"},
      {"key":"C","text":"$2,000 favorable"},
      {"key":"D","text":"$1,250 unfavorable"}
    ]'::jsonb,
    'B',
    'Direct Labor Efficiency Variance = (AH − SH) × SR = (2,500 − (4,800 × 0.5)) × $20 = (2,500 − 2,400) × $20 = 100 × $20 = $2,000 Unfavorable. More hours used than the standard allowed for actual output, so the variance is unfavorable.',
    'medium', 2
  ),
  (
    v_exam_id, 'cma_p1_c', 'responsibility_centers',
    'A division manager is evaluated on operating income relative to invested capital. The division reports operating income of $480,000 on $3,000,000 of average operating assets. The company''s cost of capital is 12%. What is the division''s residual income?',
    '[
      {"key":"A","text":"$120,000"},
      {"key":"B","text":"$360,000"},
      {"key":"C","text":"$480,000"},
      {"key":"D","text":"$0"}
    ]'::jsonb,
    'A',
    'Residual Income = Operating Income − (Cost of Capital × Average Operating Assets) = $480,000 − (0.12 × $3,000,000) = $480,000 − $360,000 = $120,000. Residual income measures the excess operating income above the required return on assets.',
    'medium', 3
  ),
  (
    v_exam_id, 'cma_p1_d', 'abc_costing',
    'A company uses Activity-Based Costing. Setup activity has a cost pool of $200,000 and a cost driver of 500 setups annually. Product X requires 40 setups for 10,000 units produced. What is the setup cost per unit of Product X?',
    '[
      {"key":"A","text":"$0.40"},
      {"key":"B","text":"$1.60"},
      {"key":"C","text":"$2.00"},
      {"key":"D","text":"$16.00"}
    ]'::jsonb,
    'B',
    'Setup activity rate = $200,000 ÷ 500 setups = $400 per setup. Product X setup cost = 40 setups × $400 = $16,000. Per unit = $16,000 ÷ 10,000 units = $1.60 per unit.',
    'medium', 4
  ),
  (
    v_exam_id, 'cma_p1_d', 'cost_concepts',
    'Which of the following is NOT a relevant cost when deciding whether to accept a special order?',
    '[
      {"key":"A","text":"Incremental variable manufacturing costs"},
      {"key":"B","text":"Allocated fixed manufacturing overhead that will not change"},
      {"key":"C","text":"Opportunity cost of forgone sales to regular customers"},
      {"key":"D","text":"Additional shipping costs for the special order"}
    ]'::jsonb,
    'B',
    'Allocated fixed costs that do not change with the decision are NOT relevant — they are sunk or unavoidable regardless of accepting the order. Relevant costs are those that differ between alternatives: incremental variables, opportunity costs, and incremental fixed costs all qualify.',
    'easy', 5
  );

  -- ---------------------------------------------------------------
  -- 3. Essay prompt: Variance Analysis with full rubric
  -- ---------------------------------------------------------------
  DELETE FROM essay_prompts WHERE exam_id = v_exam_id;

  INSERT INTO essay_prompts (
    exam_id, section_id, position,
    scenario, question, recommended_minutes,
    model_answer, rubric
  ) VALUES (
    v_exam_id, 'cma_p1_c', 1,

    -- SCENARIO ----------------------------------------------------
    E'ABC Manufacturing produces a single product, the WidgetPro. The company uses a standard costing system. The standard cost card per unit is:\n\n• Direct materials: 2 lbs at $5.00 per lb = $10.00\n• Direct labor: 0.5 hours at $20.00 per hour = $10.00\n• Variable manufacturing overhead: 0.5 hours at $4.00 per hour = $2.00\n• Fixed manufacturing overhead: $50,000 per month, allocated based on normal capacity of 5,000 units\n\nActual results for May:\n• Units produced: 4,800\n• Direct materials purchased and used: 9,800 lbs at $5.20 per lb\n• Direct labor: 2,500 hours at $19.50 per hour\n• Variable manufacturing overhead incurred: $9,500\n• Fixed manufacturing overhead incurred: $52,000\n\nThe production manager has asked for your analysis as a CMA before the monthly performance review meeting tomorrow.',

    -- QUESTION ----------------------------------------------------
    E'a) Calculate the direct materials price variance and the direct materials quantity variance for May. Identify each as favorable (F) or unfavorable (U) and show your formulas.\n\nb) Calculate the direct labor rate variance and the direct labor efficiency variance for May. Identify each as favorable (F) or unfavorable (U) and show your formulas.\n\nc) As a CMA reporting to the production manager, recommend three specific operational actions management should take based on the variance analysis. Each recommendation must be linked explicitly to one or more of the variances calculated above and justified using management accounting principles.',

    15,

    -- MODEL ANSWER (internal reference for Pass 2 grading) --------
    E'a) Direct Materials Variances\n\nDM Price Variance = (AP − SP) × AQ = ($5.20 − $5.00) × 9,800 lbs = $1,960 Unfavorable\nDM Quantity Variance = (AQ − SQ) × SP = (9,800 − (4,800 × 2)) × $5.00 = (9,800 − 9,600) × $5.00 = $1,000 Unfavorable\n\nb) Direct Labor Variances\n\nDL Rate Variance = (AR − SR) × AH = ($19.50 − $20.00) × 2,500 = $1,250 Favorable\nDL Efficiency Variance = (AH − SH) × SR = (2,500 − (4,800 × 0.5)) × $20.00 = (2,500 − 2,400) × $20.00 = $2,000 Unfavorable\n\nc) Three operational recommendations:\n\n1. Investigate materials sourcing. The DM price variance of $1,960 U signals materials were purchased above standard. Recommend negotiating with current suppliers, soliciting competitive bids, or evaluating quality differences if higher-cost materials reduce scrap. This addresses the price variance directly.\n\n2. Review production methods or worker training. The DL efficiency variance of $2,000 U indicates 100 more labor hours were required than standard allows. Possible causes: machine downtime, materials defects causing rework (consistent with the DM quantity variance of $1,000 U), or insufficient training. Recommend a root-cause analysis on the production floor and a training assessment.\n\n3. Reassess the standards if learning effect is exhausted. The favorable DL rate variance of $1,250 F could indicate hiring less experienced (cheaper) labor — which may be contributing to the unfavorable efficiency variance. Management should evaluate whether the rate-efficiency trade-off is net beneficial, and if not, return to higher-skilled labor or revise standards to reflect current realities.',

    -- RUBRIC (drives the multi-pass grading pipeline) -------------
    '{
      "expected_concepts": [
        {
          "id": "dm_price_variance_concept",
          "description": "Identifies and interprets the direct materials price variance, including F/U direction",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "dm_quantity_variance_concept",
          "description": "Identifies and interprets the direct materials quantity (usage) variance, including F/U direction",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "dl_rate_variance_concept",
          "description": "Identifies and interprets the direct labor rate variance, including F/U direction",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "dl_efficiency_variance_concept",
          "description": "Identifies and interprets the direct labor efficiency variance, including F/U direction",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "linkage_quantity_efficiency",
          "description": "Connects DM quantity variance and DL efficiency variance as potentially causally linked (e.g. defective materials causing rework)",
          "topic_tag": "variance_interpretation"
        },
        {
          "id": "rate_efficiency_tradeoff",
          "description": "Recognizes the trade-off between favorable DL rate variance and unfavorable DL efficiency variance (cheaper labor often less efficient)",
          "topic_tag": "responsibility_centers"
        },
        {
          "id": "actionable_recommendations",
          "description": "Provides concrete, operational management actions linked to specific variances rather than generic advice",
          "topic_tag": "performance_management"
        }
      ],
      "expected_calculations": [
        {
          "id": "dm_price_var",
          "label": "Direct Materials Price Variance",
          "formula": "(AP − SP) × AQ",
          "expected_value": "($5.20 − $5.00) × 9,800 = $1,960 U",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "dm_quantity_var",
          "label": "Direct Materials Quantity Variance",
          "formula": "(AQ − SQ) × SP",
          "expected_value": "(9,800 − 9,600) × $5.00 = $1,000 U",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "dl_rate_var",
          "label": "Direct Labor Rate Variance",
          "formula": "(AR − SR) × AH",
          "expected_value": "($19.50 − $20.00) × 2,500 = $1,250 F",
          "topic_tag": "variance_analysis"
        },
        {
          "id": "dl_efficiency_var",
          "label": "Direct Labor Efficiency Variance",
          "formula": "(AH − SH) × SR",
          "expected_value": "(2,500 − 2,400) × $20.00 = $2,000 U",
          "topic_tag": "variance_analysis"
        }
      ],
      "weighting": {
        "concepts": 0.50,
        "calculations": 0.30,
        "communication": 0.20
      },
      "bands": {
        "distinction": 85,
        "pass": 70,
        "borderline": 55
      }
    }'::jsonb
  );
END $$;

COMMIT;

-- =====================================================
-- DONE. Verify with:
--   SELECT slug, mcq_count, essay_count, is_published FROM mock_exams WHERE slug='cma-p1-mock-01';
--   SELECT count(*) FROM mcq_questions WHERE exam_id=(SELECT id FROM mock_exams WHERE slug='cma-p1-mock-01');
--   SELECT count(*) FROM essay_prompts WHERE exam_id=(SELECT id FROM mock_exams WHERE slug='cma-p1-mock-01');
-- Should return: 1 mock, 5 mcqs, 1 essay.
-- =====================================================
