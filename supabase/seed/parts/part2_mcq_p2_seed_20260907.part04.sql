
INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-040$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Float$tp$,
  $d$easy$d$,
  $qt$Disbursement float equals which difference?$qt$,
  $op${"A": "The firm’s book balance minus the bank’s available balance for checks written.", "B": "Cash on the balance sheet minus marketable securities.", "C": "Accounts payable minus accounts receivable.", "D": "Collected lockbox deposits minus wire transfer fees."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Disbursement float arises because checks written reduce the book balance before clearing at the bank, temporarily leaving more cash available at the bank.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-041$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$CV-P$tp$,
  $d$easy$d$,
  $qt$A product sells for $50, variable cost is $30 per unit, and fixed costs are $200,000. What is the break-even point in units?$qt$,
  $op${"A": "10,000 units.", "B": "4,000 units.", "C": "6,667 units.", "D": "20,000 units."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Contribution margin per unit = $50 − $30 = $20. Break-even units = $200,000 ÷ $20 = 10,000.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-042$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$CV-P$tp$,
  $d$medium$d$,
  $qt$Using the data from a firm with $20 contribution margin per unit and $200,000 fixed costs, how many units must be sold to earn a target pretax profit of $80,000?$qt$,
  $op${"A": "14,000 units.", "B": "10,000 units.", "C": "4,000 units.", "D": "12,000 units."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Required units = (Fixed costs + Target profit) ÷ CM per unit = ($200,000 + $80,000) ÷ $20 = 14,000.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-043$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Margin of safety$tp$,
  $d$medium$d$,
  $qt$Actual sales are $800,000 and break-even sales are $500,000. What is the margin of safety percentage?$qt$,
  $op${"A": "37.5%.", "B": "62.5%.", "C": "60.0%.", "D": "25.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Margin of safety = ($800,000 − $500,000) ÷ $800,000 = 37.5%, the cushion before losses begin.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-044$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Relevant costs$tp$,
  $d$medium$d$,
  $qt$In a special-order decision with idle capacity, which cost is generally relevant?$qt$,
  $op${"A": "Incremental variable manufacturing costs of the order.", "B": "Allocated corporate headquarters rent.", "C": "Sunk research costs incurred last year.", "D": "Book value of existing idle equipment."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Only future costs that differ between alternatives are relevant; with idle capacity, incremental variable costs (and any incremental fixed costs) drive the decision.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-045$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Make or buy$tp$,
  $d$medium$d$,
  $qt$Unit costs to make a part are: materials $8, labor $5, variable overhead $3, allocated fixed overhead $4. A supplier quotes $15. Fixed overhead continues either way and capacity has no alternative use. What is the advantage of buying per unit?$qt$,
  $op${"A": "$1 per unit advantage to buying.", "B": "$5 per unit advantage to buying.", "C": "$4 per unit advantage to making.", "D": "Indifferent between make and buy."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Relevant make cost = $8 + $5 + $3 = $16. Buy cost = $15. Buying is $1 per unit cheaper. Allocated fixed overhead continues and is irrelevant.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-046$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Make or buy$tp$,
  $d$hard$d$,
  $qt$Continuing a make-or-buy analysis: relevant make cost is $16 and buy quote is $15, but idle capacity used to make the part could instead earn $3 contribution per unit from another product. What should management do?$qt$,
  $op${"A": "Buy the part and free capacity for the other product.", "B": "Make the part because $16 is only $1 above the quote.", "C": "Make the part to absorb more fixed overhead.", "D": "Buy only if the supplier offers a further $4 discount."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Opportunity cost raises the cost of making to $16 + $3 = $19 versus $15 to buy; buying frees capacity that earns $3, improving overall profit.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-047$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Product mix$tp$,
  $d$hard$d$,
  $qt$Two products share a scarce machine hour. Product X contributes $30 per unit and uses 2 hours; Product Y contributes $40 per unit and uses 5 hours. Which product has the higher contribution per constraining resource?$qt$,
  $op${"A": "Product X at $15 per hour.", "B": "Product Y at $8 per hour.", "C": "Product Y at $40 per unit.", "D": "Product X at $30 per unit."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Rank by CM per scarce resource: X = $30 ÷ 2 = $15/hour; Y = $40 ÷ 5 = $8/hour. Prefer X when machine hours are limited.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-048$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Keep or drop$tp$,
  $d$medium$d$,
  $qt$A segment reports sales of $300,000, variable costs of $180,000, avoidable fixed costs of $70,000, and unavoidable allocated fixed costs of $60,000. What is the segment’s contribution to overall firm profit if kept?$qt$,
  $op${"A": "$50,000 positive contribution.", "B": "$10,000 loss, so drop it.", "C": "$120,000 contribution margin only.", "D": "$(-10,000) including unavoidable costs."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Segment margin using avoidable costs = $300,000 − $180,000 − $70,000 = $50,000. Unavoidable allocations continue if dropped and should not justify dropping.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-049$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Pricing$tp$,
  $d$easy$d$,
  $qt$Cost-plus pricing that marks up full manufacturing cost by a target percentage is primarily intended to achieve which goal?$qt$,
  $op${"A": "Cover costs and provide a planned profit margin.", "B": "Match competitors’ prices regardless of cost.", "C": "Set price equal to variable cost only.", "D": "Maximize short-run contribution ignoring fixed costs."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Full-cost-plus pricing embeds absorption cost plus a markup so that, at expected volume, revenues cover costs and earn the desired return.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-050$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Transfer pricing$tp$,
  $d$hard$d$,
  $qt$When the selling division has idle capacity and no alternative market, the minimum transfer price from a company perspective generally equals which amount?$qt$,
  $op${"A": "Variable cost of producing the transferred unit.", "B": "Full absorption cost plus a 20% markup.", "C": "Market price of the intermediate product.", "D": "Fixed cost per unit based on practical capacity."}$op$::jsonb,
  $ca$A$ca$,
  $ex$With idle capacity, opportunity cost is zero, so the firm-optimal minimum transfer price is incremental (usually variable) cost.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-051$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$CV-P$tp$,
  $d$hard$d$,
  $qt$Sales mix is 3 units of A and 1 unit of B. Contribution margins are $10 for A and $20 for B. Fixed costs are $100,000. How many total units (A+B) are needed to break even?$qt$,
  $op${"A": "8,000 total units.", "B": "10,000 total units.", "C": "5,000 total units.", "D": "4,000 total units."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Weighted CM per package (3A+1B) = 3×$10 + 1×$20 = $50 for 4 units, or $12.50 per unit. Break-even packages = $100,000 ÷ $50 = 2,000 packages = 8,000 units.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-052$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section C$s$,
  $tp$Operating leverage$tp$,
  $d$medium$d$,
  $qt$Contribution margin is $400,000 and operating income is $100,000. What is the degree of operating leverage?$qt$,
  $op${"A": "4.0.", "B": "0.25.", "C": "5.0.", "D": "3.0."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Degree of operating leverage = Contribution margin ÷ Operating income = $400,000 ÷ $100,000 = 4.0, implying a 1% sales change moves operating income about 4%.$ex$
);
