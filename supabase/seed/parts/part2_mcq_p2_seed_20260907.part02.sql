
INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-015$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Working capital$tp$,
  $d$easy$d$,
  $qt$Current assets are $650,000 and current liabilities are $410,000. What is net working capital?$qt$,
  $op${"A": "$240,000.", "B": "$650,000.", "C": "$410,000.", "D": "$1,060,000."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Net working capital = Current assets − Current liabilities = $650,000 − $410,000 = $240,000.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-016$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$EPS$tp$,
  $d$hard$d$,
  $qt$Net income is $450,000 with no preferred stock. Weighted-average common shares are 100,000. Dilutive options cover 10,000 shares at a $20 exercise price; average market price is $25. Using the treasury stock method, diluted EPS is closest to which amount?$qt$,
  $op${"A": "$4.41.", "B": "$4.50.", "C": "$4.09.", "D": "$3.75."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Proceeds = $200,000; shares bought back = 8,000; incremental shares = 2,000; diluted shares = 102,000; diluted EPS = $450,000 ÷ 102,000 ≈ $4.41.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-017$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Liquidity ratios$tp$,
  $d$medium$d$,
  $qt$Compared with the current ratio, the quick ratio always excludes which current asset category?$qt$,
  $op${"A": "Inventories and typically prepaid expenses.", "B": "Cash and cash equivalents only.", "C": "Accounts receivable from customers.", "D": "Marketable securities held for trading."}$op$::jsonb,
  $ca$A$ca$,
  $ex$The quick ratio removes inventory and usually prepaid expenses from current assets because they convert to cash less quickly than receivables and marketable securities.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-018$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Profitability ratios$tp$,
  $d$hard$d$,
  $qt$A firm earns $120,000 after tax. Interest expense was $40,000 and the tax rate is 25%. Average total assets are $1,500,000. What is return on assets using NOPAT in the numerator?$qt$,
  $op${"A": "10.0%.", "B": "8.0%.", "C": "12.0%.", "D": "6.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$EBT = $120,000 ÷ 0.75 = $160,000; EBIT = $160,000 + $40,000 = $200,000; NOPAT = $200,000 × 0.75 = $150,000. ROA = $150,000 ÷ $1,500,000 = 10%.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-019$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Cash conversion cycle$tp$,
  $d$hard$d$,
  $qt$Days inventory outstanding is 55, days sales outstanding is 40, and days payable outstanding is 30. What is the cash conversion cycle?$qt$,
  $op${"A": "65 days.", "B": "125 days.", "C": "85 days.", "D": "35 days."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Cash conversion cycle = DIO + DSO − DPO = 55 + 40 − 30 = 65 days, measuring the net time cash is tied up in operations.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-020$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section A$s$,
  $tp$Financial statement analysis$tp$,
  $d$medium$d$,
  $qt$An analyst notices that inventory rose 40% while sales rose only 8%. Which conclusion is most reasonable pending further investigation?$qt$,
  $op${"A": "Inventory may be building up, signaling weaker demand or overproduction.", "B": "The firm necessarily improved its inventory turnover.", "C": "Accounts receivable must have declined by a similar percentage.", "D": "Gross margin must have increased due to better cost control."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Inventory growing much faster than sales often indicates slowing demand, obsolete stock, or production exceeding sales, which can pressure future cash flow and margins.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-021$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$WACC$tp$,
  $d$medium$d$,
  $qt$A firm’s capital structure is 40% debt and 60% equity. The after-tax cost of debt is 6% and the cost of equity is 12%. What is the weighted average cost of capital?$qt$,
  $op${"A": "9.6%.", "B": "9.0%.", "C": "10.8%.", "D": "8.4%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$WACC = (0.40 × 6%) + (0.60 × 12%) = 2.4% + 7.2% = 9.6%.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-022$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Cost of equity$tp$,
  $d$medium$d$,
  $qt$The risk-free rate is 3%, the market risk premium is 5%, and a stock’s beta is 1.4. Using CAPM, what is the cost of equity?$qt$,
  $op${"A": "10.0%.", "B": "8.0%.", "C": "12.0%.", "D": "7.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Cost of equity = Rf + β × MRP = 3% + 1.4 × 5% = 3% + 7% = 10%.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-023$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Cost of debt$tp$,
  $d$easy$d$,
  $qt$A company can issue bonds at a 9% yield to maturity. The marginal tax rate is 30%. What is the after-tax cost of debt for WACC purposes?$qt$,
  $op${"A": "6.3%.", "B": "9.0%.", "C": "12.9%.", "D": "2.7%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$After-tax cost of debt = YTM × (1 − tax rate) = 9% × (1 − 0.30) = 6.3%, reflecting the tax deductibility of interest.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-024$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Dividend policy$tp$,
  $d$medium$d$,
  $qt$Under the residual dividend model, dividends are paid from which residual amount?$qt$,
  $op${"A": "Earnings remaining after funding all positive-NPV projects at the target capital structure.", "B": "A fixed percentage of last year’s dividends plus a growth factor.", "C": "All free cash flow after mandatory debt principal repayments only.", "D": "Cash equal to depreciation plus net income each year."}$op$::jsonb,
  $ca$A$ca$,
  $ex$The residual model prioritizes investment needs consistent with the target capital structure; any leftover earnings are distributed as dividends.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-025$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Working capital management$tp$,
  $d$medium$d$,
  $qt$A firm offers terms of 2/10, net 30. What is the approximate annualized cost of forgoing the discount if payment is made on day 30?$qt$,
  $op${"A": "36.7%.", "B": "24.0%.", "C": "18.0%.", "D": "2.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Approximate cost = [2% ÷ (100% − 2%)] × [365 ÷ (30 − 10)] ≈ 0.020408 × 18.25 ≈ 37.2% (often rounded near 36.7% with 360 days: 0.020408 × 18 = 36.7%).$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-026$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Capital structure$tp$,
  $d$hard$d$,
  $qt$According to Modigliani and Miller with corporate taxes but no bankruptcy costs, which statement is correct?$qt$,
  $op${"A": "Firm value rises with debt due to the interest tax shield.", "B": "Capital structure is irrelevant to firm value.", "C": "100% equity always maximizes firm value.", "D": "WACC is constant regardless of leverage."}$op$::jsonb,
  $ca$A$ca$,
  $ex$With corporate taxes only, debt creates a valuable tax shield, so firm value increases with leverage; without bankruptcy costs the theoretical optimum is maximum debt.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-027$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Cash management$tp$,
  $d$easy$d$,
  $qt$Which technique accelerates cash collections by reducing mail and processing float?$qt$,
  $op${"A": "A lockbox system.", "B": "Stretching accounts payable.", "C": "Issuing commercial paper.", "D": "A revolving credit facility."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Lockboxes place collection points near customers so remittances clear faster, shortening collection float and increasing available cash.$ex$
);
