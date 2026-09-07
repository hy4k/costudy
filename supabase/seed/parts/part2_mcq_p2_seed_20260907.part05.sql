
INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-053$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Sell or process further$tp$,
  $d$medium$d$,
  $qt$A joint product can be sold at split-off for $40,000 or processed further for an additional $15,000 cost and then sold for $62,000. What should management do?$qt$,
  $op${"A": "Process further; incremental profit is $7,000.", "B": "Sell at split-off; further processing loses money.", "C": "Process further; incremental profit is $22,000.", "D": "Allocate joint costs before deciding."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Incremental revenue = $62,000 − $40,000 = $22,000; incremental cost = $15,000; net benefit = $7,000. Joint costs are sunk for this decision.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-054$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Relevant costs$tp$,
  $d$easy$d$,
  $qt$Which cost is always irrelevant to a future decision?$qt$,
  $op${"A": "A sunk cost already incurred that cannot be changed.", "B": "An opportunity cost of a scarce resource.", "C": "An incremental cash outflow that differs by alternative.", "D": "Avoidable fixed costs tied to a product line."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Sunk costs do not change with the decision and therefore cannot affect differential cash flows or rational choice.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-055$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Target costing$tp$,
  $d$medium$d$,
  $qt$Market price is expected to be $80 and the required profit margin is 20% of price. What is the allowable target cost per unit?$qt$,
  $op${"A": "$64.00.", "B": "$80.00.", "C": "$96.00.", "D": "$16.00."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Target cost = Price − Desired profit = $80 − (0.20 × $80) = $80 − $16 = $64.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-056$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Absorption vs variable$tp$,
  $d$hard$d$,
  $qt$Production exceeds sales in a period. Compared with variable costing operating income, absorption costing operating income will generally be:$qt$,
  $op${"A": "Higher because fixed manufacturing overhead is deferred in inventory.", "B": "Lower because all fixed overhead is expensed immediately.", "C": "Identical regardless of inventory change.", "D": "Higher only if selling prices increase during the period."}$op$::jsonb,
  $ca$A$ca$,
  $ex$When inventory rises, absorption costing capitalizes a portion of fixed manufacturing overhead in ending inventory, increasing current operating income relative to variable costing.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-057$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$CV-P$tp$,
  $d$easy$d$,
  $qt$If the selling price increases while variable cost per unit and fixed costs remain constant, the break-even point in units will:$qt$,
  $op${"A": "Decrease because contribution margin per unit rises.", "B": "Increase because fewer customers will buy.", "C": "Remain unchanged because fixed costs are constant.", "D": "Decrease only if total fixed costs also fall."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Higher price raises unit contribution margin, so fewer units are needed to cover the same fixed costs, lowering the break-even quantity.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-058$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Special order$tp$,
  $d$hard$d$,
  $qt$A special order for 1,000 units offers $18 each. Variable cost is $14; fixed manufacturing overhead is $5 per unit based on normal volume. The order requires $1,500 of extra setup and uses idle capacity. What is the effect on operating income if accepted?$qt$,
  $op${"A": "Increase of $2,500.", "B": "Decrease of $1,000.", "C": "Increase of $4,000.", "D": "Increase of $1,000."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Incremental CM = 1,000 × ($18 − $14) = $4,000; subtract extra setup $1,500 → $2,500 benefit. Allocated fixed overhead is not incremental.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-059$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Pricing$tp$,
  $d$medium$d$,
  $qt$In the short run with idle capacity, the lowest price a firm should normally accept on a one-time order is approximately equal to:$qt$,
  $op${"A": "Incremental variable costs plus any incremental fixed costs of the order.", "B": "Full absorption cost including allocated corporate overhead.", "C": "Target cost under long-run market pricing.", "D": "Historical average total cost for the past three years."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Short-run floor pricing covers incremental costs so the order does not reduce profit; full-cost floors apply more to long-run ongoing pricing.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-060$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Sensitivity analysis$tp$,
  $d$medium$d$,
  $qt$Sensitivity analysis in CVP and capital budgeting is used primarily to:$qt$,
  $op${"A": "Show how results change when key assumptions are varied.", "B": "Eliminate uncertainty from forecasts entirely.", "C": "Replace probability distributions with a single point estimate.", "D": "Guarantee that the most likely scenario will occur."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Sensitivity analysis varies inputs one at a time or in scenarios to reveal which assumptions most affect profit, NPV, or break-even outcomes.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-061$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$FX risk$tp$,
  $d$medium$d$,
  $qt$A U.S. exporter will receive euros in 90 days. Which hedge best locks in the dollar value of that receivable?$qt$,
  $op${"A": "Sell euros forward against dollars.", "B": "Buy euros forward against dollars.", "C": "Buy a call option on the dollar only.", "D": "Enter a long futures position in euros."}$op$::jsonb,
  $ca$A$ca$,
  $ex$To hedge a euro receivable, the firm sells euros forward so conversion to dollars occurs at a known forward rate, protecting against euro depreciation.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-062$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$FX risk$tp$,
  $d$hard$d$,
  $qt$A firm has a net monetary asset position in a foreign currency. If that currency depreciates relative to the reporting currency, transaction exposure generally causes:$qt$,
  $op${"A": "An exchange loss on the net monetary assets.", "B": "An exchange gain on the net monetary assets.", "C": "No effect because monetary items are not remeasured.", "D": "A gain equal to the depreciation percentage times inventory."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Net monetary assets denominated in a weakening foreign currency convert into fewer reporting-currency units, producing a transaction or remeasurement loss.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-063$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Interest rate risk$tp$,
  $d$medium$d$,
  $qt$A company with floating-rate debt that expects rates to rise can hedge by:$qt$,
  $op${"A": "Entering a pay-fixed, receive-floating interest rate swap.", "B": "Entering a pay-floating, receive-fixed interest rate swap.", "C": "Buying a put option on its own bonds only.", "D": "Shortening duration of fixed-rate assets only."}$op$::jsonb,
  $ca$A$ca$,
  $ex$A pay-fixed swap converts floating interest obligations into synthetic fixed-rate debt, protecting the borrower if market rates increase.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-064$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Risk types$tp$,
  $d$easy$d$,
  $qt$Which risk arises from the possibility that a counterparty will fail to meet its contractual payment obligations?$qt$,
  $op${"A": "Credit (default) risk.", "B": "Translation exposure only.", "C": "Commodity basis risk only.", "D": "Systematic market risk only."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Credit risk is the exposure to loss if a borrower, customer, or derivative counterparty does not perform as promised.$ex$
);
