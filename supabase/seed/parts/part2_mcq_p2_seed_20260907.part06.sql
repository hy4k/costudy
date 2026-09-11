
INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-065$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Enterprise risk$tp$,
  $d$medium$d$,
  $qt$In enterprise risk management, residual risk is best defined as:$qt$,
  $op${"A": "Risk remaining after management's risk responses are applied.", "B": "Inherent risk before any controls or responses.", "C": "Only risks that can be fully insured away.", "D": "Risks outside the organization's home industry."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Inherent risk exists before responses; residual risk is what remains after avoidance, reduction, sharing, or acceptance strategies are implemented.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-066$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Options hedging$tp$,
  $d$hard$d$,
  $qt$A U.S. importer must pay yen in six months and buys a call option on yen. Which outcome is correct if the yen depreciates sharply?$qt$,
  $op${"A": "The option expires unexercised; loss is limited to the premium paid.", "B": "The importer must exercise and buy yen at the high strike.", "C": "The option pays the full notional in dollars automatically.", "D": "The importer faces unlimited loss on the option itself."}$op$::jsonb,
  $ca$A$ca$,
  $ex$If spot yen is cheaper than the strike, the call is out of the money and abandoned; the importer buys yen in the spot market and loses only the premium.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-067$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Value at risk$tp$,
  $d$medium$d$,
  $qt$A one-day 95% VaR of $2 million means which of the following under typical interpretations?$qt$,
  $op${"A": "There is about a 5% chance that one-day losses will exceed $2 million.", "B": "The firm will lose exactly $2 million on 95% of trading days.", "C": "Maximum possible loss over any horizon is $2 million.", "D": "Expected loss on every trading day is $2 million."}$op$::jsonb,
  $ca$A$ca$,
  $ex$VaR at 95% estimates a loss threshold expected to be exceeded only about 5% of the time for the chosen holding period, not a guaranteed maximum loss.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-068$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Operational risk$tp$,
  $d$easy$d$,
  $qt$Which event is the clearest example of operational risk?$qt$,
  $op${"A": "A processing error that causes an incorrect wire transfer.", "B": "A decline in equity prices affecting the stock portfolio.", "C": "Depreciation of a foreign currency receivable balance.", "D": "An increase in benchmark market interest rates."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Operational risk stems from people, processes, systems, or external events; a wire error is a process failure, unlike market or FX price risk.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-069$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Insurance$tp$,
  $d$easy$d$,
  $qt$Purchasing property insurance is an example of which risk response?$qt$,
  $op${"A": "Risk sharing (transfer).", "B": "Risk avoidance by exiting the business.", "C": "Risk acceptance with no mitigation steps.", "D": "Risk reduction through diversification only."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Insurance transfers specified loss exposures to an insurer in exchange for premiums, which is a classic risk-sharing response.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-070$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Commodity risk$tp$,
  $d$medium$d$,
  $qt$A bakery that will buy wheat in three months hedges price risk by:$qt$,
  $op${"A": "Taking a long position in wheat futures.", "B": "Taking a short position in wheat futures.", "C": "Selling a call option on wheat grain.", "D": "Shorting bakery equity shares publicly."}$op$::jsonb,
  $ca$A$ca$,
  $ex$A future buyer of the commodity goes long futures so that gains on the hedge offset higher spot purchase prices if wheat rises.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-071$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Translation exposure$tp$,
  $d$hard$d$,
  $qt$Under the current-rate translation method, which items are typically translated at the current (closing) exchange rate?$qt$,
  $op${"A": "Assets and liabilities.", "B": "Common stock at historical issuance as the only rate used.", "C": "Revenues exclusively at the year-end closing rate.", "D": "All equity accounts at the current closing rate."}$op$::jsonb,
  $ca$A$ca$,
  $ex$The current-rate method translates assets and liabilities at the closing rate; equity uses historical rates and income typically uses average rates, with CTA in OCI.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-072$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Political risk$tp$,
  $d$medium$d$,
  $qt$Which action most directly mitigates expropriation risk in a foreign subsidiary?$qt$,
  $op${"A": "Obtaining political risk insurance and structuring local financing.", "B": "Hedging only with short-dated currency forward contracts.", "C": "Increasing the subsidiary's net monetary asset position.", "D": "Switching from FIFO to LIFO for local inventory costing."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Political risk insurance and local-source financing reduce net assets at risk and provide recovery if governments seize or restrict operations.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-073$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Derivatives$tp$,
  $d$medium$d$,
  $qt$Compared with a forward contract, an at-the-money currency option purchased as a hedge typically:$qt$,
  $op${"A": "Requires an upfront premium but allows favorable currency moves to benefit the firm.", "B": "Has zero premium and obligates both parties to settle always.", "C": "Eliminates basis risk completely in all hedge markets.", "D": "Can only be used to hedge interest rate exposures."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Options cost a premium and limit downside while preserving upside if rates move favorably; forwards lock a rate with no premium but no upside.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-074$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Risk map$tp$,
  $d$easy$d$,
  $qt$On a risk map plotting likelihood against impact, which risks usually receive the highest priority for treatment?$qt$,
  $op${"A": "High-likelihood, high-impact risks.", "B": "Low-likelihood, low-impact risks.", "C": "Risks with unknown owners exclusively.", "D": "Risks that are already fully insured."}$op$::jsonb,
  $ca$A$ca$,
  $ex$ERM prioritizes risks that combine significant chance of occurrence with severe consequences, typically the upper-right quadrant of a risk heat map.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-075$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section D$s$,
  $tp$Basis risk$tp$,
  $d$hard$d$,
  $qt$Basis risk in a futures hedge is the risk that:$qt$,
  $op${"A": "The futures price and the spot price of the hedged item do not move in perfect unison.", "B": "The counterparty defaults on an OTC forward contract.", "C": "Interest rates and FX rates change at the same time.", "D": "The hedge ratio is exactly one-to-one by contract design."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Imperfect correlation between the hedging instrument and the underlying exposure leaves residual gain or loss known as basis risk.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-076$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section E$s$,
  $tp$Capital budgeting$tp$,
  $d$medium$d$,
  $qt$An investment of $80,000 yields cash inflows of $30,000, $35,000, and $40,000 at the ends of years 1-3. Present value factors at 12% are 0.893, 0.797, and 0.712. What is the project's NPV?$qt$,
  $op${"A": "$3,165.", "B": "$25,000.", "C": "$(3,165).", "D": "$83,165."}$op$::jsonb,
  $ca$A$ca$,
  $ex$PV of inflows = $26,790 + $27,895 + $28,480 = $83,165. NPV = $83,165 - $80,000 = $3,165, so the project adds value at 12%.$ex$
);
