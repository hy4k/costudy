
INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-028$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Short-term financing$tp$,
  $d$medium$d$,
  $qt$Commercial paper is best described as which instrument?$qt$,
  $op${"A": "Unsecured short-term promissory notes issued by large, creditworthy firms.", "B": "Long-term bonds backed by specific plant assets.", "C": "Bank term loans with maturities over five years.", "D": "Equity warrants attached to preferred stock."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Commercial paper is short-term, typically unsecured debt sold by strong issuers in the money market to fund working capital needs.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-029$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Dividend discount model$tp$,
  $d$medium$d$,
  $qt$A stock will pay a $2.40 dividend next year, dividends grow at 4% perpetually, and the required return is 10%. What is the stock’s intrinsic value under the Gordon growth model?$qt$,
  $op${"A": "$40.00.", "B": "$24.00.", "C": "$60.00.", "D": "$28.80."}$op$::jsonb,
  $ca$A$ca$,
  $ex$P0 = D1 ÷ (r − g) = $2.40 ÷ (0.10 − 0.04) = $2.40 ÷ 0.06 = $40.00.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-030$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$EOQ$tp$,
  $d$medium$d$,
  $qt$Annual demand is 10,000 units, ordering cost is $50 per order, and carrying cost is $4 per unit per year. What is the economic order quantity?$qt$,
  $op${"A": "500 units.", "B": "250 units.", "C": "1,000 units.", "D": "125 units."}$op$::jsonb,
  $ca$A$ca$,
  $ex$EOQ = √(2DS ÷ H) = √(2 × 10,000 × 50 ÷ 4) = √250,000 = 500 units.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-031$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Lease vs buy$tp$,
  $d$hard$d$,
  $qt$When evaluating a lease-versus-buy decision from the lessee’s perspective, which cash flow is typically treated as a benefit of leasing?$qt$,
  $op${"A": "Avoidance of the initial asset purchase outflow.", "B": "The present value of lease payments discounted at the equity cost.", "C": "Depreciation tax shields retained while leasing.", "D": "Interest tax shields on a loan that is never taken."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Leasing replaces buying, so the key benefit is not paying the purchase price up front; the lessee forgoes ownership tax shields and pays lease rentals instead.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-032$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Raising capital$tp$,
  $d$easy$d$,
  $qt$In a seasoned equity offering, flotation costs primarily cause which effect on the net proceeds to the issuer?$qt$,
  $op${"A": "They reduce net proceeds below the offer price.", "B": "They increase the market price of existing shares.", "C": "They eliminate underpricing risk entirely.", "D": "They convert preferred stock into common equity."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Underwriting fees and other flotation costs are deducted from gross proceeds, so the issuer receives less cash per share than the public offer price.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-033$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Beta and risk$tp$,
  $d$medium$d$,
  $qt$Which type of risk does beta primarily measure in the CAPM framework?$qt$,
  $op${"A": "Systematic (market) risk that cannot be diversified away.", "B": "Firm-specific risk that investors can eliminate with diversification.", "C": "Liquidity risk of thinly traded securities only.", "D": "Credit risk of the firm’s outstanding bonds."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Beta measures sensitivity to market movements—nondiversifiable systematic risk—which is the risk compensated in CAPM expected returns.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-034$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Working capital policy$tp$,
  $d$medium$d$,
  $qt$A firm that finances seasonal current assets with short-term debt and permanent assets with long-term capital is following which approach?$qt$,
  $op${"A": "A maturity-matching (moderate) working capital financing policy.", "B": "An aggressive policy using only short-term debt for all assets.", "C": "A conservative policy financing all assets with equity.", "D": "A residual financing policy based solely on dividends."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Maturity matching aligns the duration of financing with the life of the assets: permanent needs with long-term funds and temporary needs with short-term debt.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-035$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Cost of preferred stock$tp$,
  $d$easy$d$,
  $qt$Preferred stock pays an $8 annual dividend and can be issued at a net price of $80 after flotation costs. What is the cost of preferred equity?$qt$,
  $op${"A": "10.0%.", "B": "8.0%.", "C": "12.5%.", "D": "9.0%."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Cost of preferred = Dp ÷ Net proceeds = $8 ÷ $80 = 10%. Preferred dividends are not tax deductible, so no tax adjustment is made.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-036$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Share repurchase$tp$,
  $d$medium$d$,
  $qt$Compared with a cash dividend of equal total amount, an open-market share repurchase typically has which effect, all else equal?$qt$,
  $op${"A": "It reduces shares outstanding and can increase EPS.", "B": "It always increases the firm’s debt-to-equity ratio immediately.", "C": "It creates a contractual obligation identical to preferred dividends.", "D": "It is treated as an investing cash outflow under U.S. GAAP."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Repurchases retire shares, lowering the share count so that the same earnings produce higher EPS; they are financing outflows, not investing.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-037$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Bankruptcy and distress$tp$,
  $d$hard$d$,
  $qt$In the trade-off theory of capital structure, firms balance the tax advantages of debt against which primary offsetting cost?$qt$,
  $op${"A": "Expected costs of financial distress and bankruptcy.", "B": "Flotation costs of issuing commercial paper.", "C": "Agency costs of free cash flow only for all-equity firms.", "D": "Underpricing in initial public offerings."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Trade-off theory sets optimal leverage where the marginal tax shield benefit equals the marginal increase in expected distress costs.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-038$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$Factoring$tp$,
  $d$medium$d$,
  $qt$When a firm factors its receivables without recourse, which risk is typically transferred to the factor?$qt$,
  $op${"A": "Credit risk of customer nonpayment.", "B": "Interest rate risk on the firm’s bonds.", "C": "Foreign exchange risk on all exports.", "D": "Obsolescence risk of finished goods inventory."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Nonrecourse factoring means the factor assumes credit losses if customers default; the seller receives cash sooner but pays fees and discounts.$ex$
);

INSERT INTO public.question_bank (
  question_kind, source_kind, quality_flag, is_active, external_id, tags, reference_links,
  part, section, topic, difficulty, question_text, options, correct_answer, explanation
) VALUES (
  'MCQ',
  'curated_pipeline',
  'verified',
  true,
  $id$p2-seed-039$id$,
  '{p2_seed_20260907}',
  '[]'::jsonb,
  $p$Part 2$p$,
  $s$Section B$s$,
  $tp$WACC$tp$,
  $d$hard$d$,
  $qt$A project has the same business risk as the firm but will be financed entirely with debt. For NPV analysis, management should generally discount project cash flows at which rate?$qt$,
  $op${"A": "The firm’s WACC reflecting the target capital structure.", "B": "The after-tax cost of the project’s specific debt only.", "C": "The risk-free rate because debt financing eliminates risk.", "D": "The cost of equity without any debt adjustment."}$op$::jsonb,
  $ca$A$ca$,
  $ex$Project value depends on asset risk and the firm’s long-run financing mix; using project-specific cheap debt understates required return and overstates NPV.$ex$
);
