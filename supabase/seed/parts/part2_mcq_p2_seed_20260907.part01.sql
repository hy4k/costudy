-- CMA US Part 2 MCQ seed for public.question_bank
-- Generated 2026-09-07; tags {p2_seed_20260907}
BEGIN;

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-001$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Ratio analysis$tp$,
  $d$easy$d$,
  $qt$A company has current assets of $450,000, inventory of $120,000, and current liabilities of $180,000. What is the quick (acid-test) ratio?$qt$,
  $op${"A": "1.83.", "B": "2.50.", "C": "1.67.", "D": "3.75."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Quick ratio = (Current assets − Inventory) ÷ Current liabilities = ($450,000 − $120,000) ÷ $180,000 = 1.83. Inventory is excluded because it is less liquid than cash and receivables.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-002$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Ratio analysis$tp$,
  $d$medium$d$,
  $qt$Net credit sales are $2,400,000 and average accounts receivable are $300,000. Assuming a 360-day year, what is the average collection period?$qt$,
  $op${"A": "45 days.", "B": "36 days.", "C": "60 days.", "D": "72 days."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Receivables turnover = $2,400,000 ÷ $300,000 = 8 times. Average collection period = 360 ÷ 8 = 45 days.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-003$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Ratio analysis$tp$,
  $d$medium$d$,
  $qt$A firm reports net income of $180,000, preferred dividends of $30,000, and average common equity of $750,000. What is return on common equity?$qt$,
  $op${"A": "20.0%.", "B": "24.0%.", "C": "16.0%.", "D": "18.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Return on common equity = (Net income − Preferred dividends) ÷ Average common equity = ($180,000 − $30,000) ÷ $750,000 = 20%.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-004$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Common-size analysis$tp$,
  $d$easy$d$,
  $qt$In a common-size income statement, each line item is typically expressed as a percentage of which amount?$qt$,
  $op${"A": "Net sales revenue.", "B": "Total assets.", "C": "Net income.", "D": "Operating income."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Common-size income statements scale every item to net sales (or total revenue), enabling cross-firm and trend comparison of cost structure and margins.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-005$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Horizontal analysis$tp$,
  $d$easy$d$,
  $qt$Horizontal (trend) analysis of financial statements primarily focuses on which type of comparison?$qt$,
  $op${"A": "Changes in account balances over successive periods.", "B": "Each account as a percent of a base total in one period.", "C": "Industry averages for the current year only.", "D": "Market values versus book values of assets."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Horizontal analysis compares dollar and percentage changes in the same accounts across multiple periods to identify trends and growth patterns.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-006$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Profitability ratios$tp$,
  $d$medium$d$,
  $qt$Sales are $5,000,000, cost of goods sold is $3,000,000, and operating expenses are $1,200,000. What is the operating profit margin?$qt$,
  $op${"A": "16%.", "B": "40%.", "C": "24%.", "D": "60%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Operating income = $5,000,000 − $3,000,000 − $1,200,000 = $800,000. Operating profit margin = $800,000 ÷ $5,000,000 = 16%.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-007$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Leverage ratios$tp$,
  $d$medium$d$,
  $qt$Total assets are $2,000,000 and total equity is $800,000. What is the debt-to-equity ratio?$qt$,
  $op${"A": "1.50.", "B": "0.40.", "C": "2.50.", "D": "0.60."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Total liabilities = $2,000,000 − $800,000 = $1,200,000. Debt-to-equity = $1,200,000 ÷ $800,000 = 1.50.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-008$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Asset turnover$tp$,
  $d$easy$d$,
  $qt$Net sales are $1,800,000 and average total assets are $900,000. What is the total asset turnover?$qt$,
  $op${"A": "2.0 times.", "B": "0.5 times.", "C": "1.5 times.", "D": "3.0 times."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Total asset turnover = Net sales ÷ Average total assets = $1,800,000 ÷ $900,000 = 2.0 times, measuring how efficiently assets generate sales.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-009$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Dupont analysis$tp$,
  $d$hard$d$,
  $qt$A firm has a profit margin of 8%, asset turnover of 1.25, and an equity multiplier of 1.6. What is return on equity under the DuPont framework?$qt$,
  $op${"A": "16.0%.", "B": "10.0%.", "C": "12.8%.", "D": "20.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$DuPont ROE = Profit margin × Asset turnover × Equity multiplier = 0.08 × 1.25 × 1.6 = 0.16, or 16%.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-010$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Cash flow analysis$tp$,
  $d$medium$d$,
  $qt$Which of the following items is classified as a cash outflow from investing activities under U.S. GAAP?$qt$,
  $op${"A": "Purchase of machinery for cash.", "B": "Payment of cash dividends to shareholders.", "C": "Issuance of long-term bonds.", "D": "Collection of accounts receivable from customers."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Cash purchases of property, plant, and equipment are investing outflows. Dividends and bond issuance are financing; collecting receivables is operating.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-011$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Earnings quality$tp$,
  $d$medium$d$,
  $qt$Which practice most clearly reduces the quality of reported earnings?$qt$,
  $op${"A": "Recognizing revenue before goods are shipped and accepted.", "B": "Accelerating depreciation for tax reporting only.", "C": "Disclosing a change in accounting estimate in the notes.", "D": "Classifying cash paid for interest as an operating outflow."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Premature revenue recognition inflates current earnings without corresponding cash or completed earnings process, impairing earnings quality and sustainability.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-012$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Inventory analysis$tp$,
  $d$medium$d$,
  $qt$Cost of goods sold is $720,000 and average inventory is $120,000. What is inventory turnover and days inventory outstanding (360-day year)?$qt$,
  $op${"A": "6 times; 60 days.", "B": "6 times; 45 days.", "C": "5 times; 72 days.", "D": "8 times; 45 days."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Inventory turnover = $720,000 ÷ $120,000 = 6. Days inventory outstanding = 360 ÷ 6 = 60 days.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-013$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Interest coverage$tp$,
  $d$easy$d$,
  $qt$EBIT is $480,000 and interest expense is $80,000. What is the times-interest-earned ratio?$qt$,
  $op${"A": "6.0 times.", "B": "5.0 times.", "C": "4.0 times.", "D": "8.0 times."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Times interest earned = EBIT ÷ Interest expense = $480,000 ÷ $80,000 = 6.0, indicating ability to cover interest from operating earnings.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-014$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Book vs market$tp$,
  $d$medium$d$,
  $qt$A company has 200,000 shares outstanding, book value of equity of $4,000,000, and a market price of $28 per share. What is the market-to-book ratio?$qt$,
  $op${"A": "1.40.", "B": "2.00.", "C": "0.70.", "D": "1.25."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Book value per share = $4,000,000 ÷ 200,000 = $20. Market-to-book = $28 ÷ $20 = 1.40.$ex$
);
