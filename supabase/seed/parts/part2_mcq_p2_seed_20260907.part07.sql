
INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-077$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Capital budgeting$tp$,
  $d$easy$d$,
  $qt$Which capital budgeting method ignores the time value of money?$qt$,
  $op${"A": "Accounting rate of return (and simple payback).", "B": "Net present value analysis method.", "C": "Internal rate of return method.", "D": "Profitability index ranking method."}$op$::jsonb,
  $ca$A$ca$,
  $ex$ARR uses accounting income without discounting; undiscounted payback also ignores TVM. NPV, IRR, and PI incorporate discounting.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-078$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$IRR$tp$,
  $d$medium$d$,
  $qt$A project's IRR equals 14% and the required return is 11%. Which statement is correct?$qt$,
  $op${"A": "NPV is positive at the 11% hurdle rate.", "B": "NPV is negative at the 11% hurdle rate.", "C": "NPV is exactly zero at the 11% rate.", "D": "The project should be rejected under NPV rules."}$op$::jsonb,
  $ca$A$ca$,
  $ex$IRR is the rate that sets NPV to zero. If IRR exceeds the cost of capital, NPV at that cost of capital is positive and the project should be accepted.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-079$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Payback$tp$,
  $d$easy$d$,
  $qt$A project costs $90,000 and generates equal annual cash inflows of $30,000. What is the simple payback period?$qt$,
  $op${"A": "3.0 years.", "B": "2.0 years.", "C": "4.5 years.", "D": "1.5 years."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Payback = Initial investment / Annual cash inflow = $90,000 / $30,000 = 3 years when inflows are level.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-080$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Profitability index$tp$,
  $d$medium$d$,
  $qt$The present value of a project's future cash inflows is $125,000 and the initial investment is $100,000. What is the profitability index?$qt$,
  $op${"A": "1.25.", "B": "0.80.", "C": "1.00.", "D": "25.0."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Profitability index = PV of future inflows / Initial investment = $125,000 / $100,000 = 1.25, indicating $1.25 of PV benefit per dollar invested.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-081$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Capital budgeting$tp$,
  $d$hard$d$,
  $qt$When ranking mutually exclusive projects of different sizes, which criterion is generally preferred for maximizing shareholder wealth?$qt$,
  $op${"A": "Net present value.", "B": "Highest internal rate of return only.", "C": "Shortest undiscounted payback only.", "D": "Highest accounting rate of return only."}$op$::jsonb,
  $ca$A$ca$,
  $ex$NPV measures absolute value created. IRR can favor smaller projects with high rates that add less total wealth than a larger lower-IRR alternative.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-082$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$After-tax cash flows$tp$,
  $d$hard$d$,
  $qt$A machine costs $200,000, has a 5-year life, zero salvage, and straight-line depreciation. Pretax operating savings are $60,000 per year. Tax rate is 30%. What is the annual after-tax operating cash flow?$qt$,
  $op${"A": "$54,000.", "B": "$42,000.", "C": "$60,000.", "D": "$48,000."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Depreciation = $40,000 per year. Taxable income = $20,000; tax = $6,000. OCF = after-tax savings + depreciation tax effects = $54,000 (or NI $14,000 + depreciation $40,000).$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-083$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Discounted payback$tp$,
  $d$medium$d$,
  $qt$Compared with simple payback, discounted payback:$qt$,
  $op${"A": "Recognizes the time value of money but may still ignore cash flows after the cutoff.", "B": "Always equals the project's IRR recovery period.", "C": "Includes all project cash flows through infinity.", "D": "Cannot be used when project cash flows are uneven."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Discounted payback accumulates PV of inflows until the investment is recovered, incorporating TVM, yet still truncates analysis after the payback point.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-084$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Real options$tp$,
  $d$hard$d$,
  $qt$The option to abandon a capital project if cash flows disappoint is most similar to which financial option?$qt$,
  $op${"A": "A put option on the project's remaining value.", "B": "A call option to expand operating capacity.", "C": "A forward contract with obligatory cash settlement.", "D": "A written naked call on the firm's common stock."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Abandonment lets management sell the project's remaining cash flows for salvage, analogous to exercising a put when continuation value falls below salvage.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-085$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Cost of capital$tp$,
  $d$medium$d$,
  $qt$A high-risk project should be evaluated using a discount rate that is:$qt$,
  $op${"A": "Higher than the firm's WACC for average-risk projects.", "B": "Equal to the risk-free rate to remain conservative.", "C": "Lower than WACC to encourage innovation projects.", "D": "Always equal to the after-tax cost of debt."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Risk-adjusted discount rates rise with project systematic risk; using firm WACC for riskier projects overstates NPV and leads to value-destroying acceptances.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-086$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Replacement decision$tp$,
  $d$hard$d$,
  $qt$In an equipment replacement analysis, the relevant initial investment typically includes:$qt$,
  $op${"A": "Cost of the new asset minus after-tax proceeds from selling the old asset.", "B": "Original historical cost of the old asset only.", "C": "Book value of the old asset with no tax effects considered.", "D": "Future depreciation of the old asset if kept forever."}$op$::jsonb,
  $ca$A$ca$,
  $ex$The incremental outlay is what must be spent now: purchase cost of the new machine, reduced by after-tax salvage from disposing of the old machine.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-087$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Inflation$tp$,
  $d$medium$d$,
  $qt$If cash flow forecasts include inflation, the discount rate used in NPV analysis should generally be:$qt$,
  $op${"A": "A nominal rate that also embeds inflation expectations.", "B": "A real rate with inflation removed inconsistently.", "C": "The real risk-free rate with no risk premium added.", "D": "Zero because inflation cancels in every NPV ratio."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Consistency requires matching: nominal cash flows with a nominal discount rate, or real cash flows with a real rate—not mixing the two.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-088$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Capital rationing$tp$,
  $d$medium$d$,
  $qt$Under hard capital rationing with divisible projects, managers often rank projects by:$qt$,
  $op${"A": "Profitability index to maximize NPV per dollar invested.", "B": "Largest initial investment amount first.", "C": "Highest accounting income in year one only.", "D": "Longest payback to ensure project durability."}$op$::jsonb,
  $ca$A$ca$,
  $ex$When capital is limited, the profitability index helps select the combination of projects that yields the greatest total NPV per scarce investment dollar.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-089$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Sensitivity analysis$tp$,
  $d$easy$d$,
  $qt$In capital budgeting, a tornado diagram or one-way sensitivity test is used mainly to:$qt$,
  $op${"A": "Identify which input assumptions most affect NPV.", "B": "Compute the project's accounting rate of return.", "C": "Eliminate the need for selecting a discount rate.", "D": "Guarantee that IRR equals the cost of capital."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Sensitivity tools vary key drivers such as sales, costs, and life to show which uncertainties have the largest impact on NPV or IRR.$ex$
);
