-- CoStudy question_bank quarantine (2026-09-07)
-- Soft-disable only: is_active=false. Restore by setting quality_flag='verified' and is_active=true.
--
-- Pass 1 (truncated_scrape): short continuation fragments / stem-echo options (~727 Part 1 rows)
-- Pass 2 (quality_gate_fail): strict keep-gate failure (~2951 Part 1 + ~17 Part 2)
--
-- Live mock pool uses pick_mock_mcqs: question_kind='MCQ' AND is_active AND quality_flag='verified'
--   AND options IS NOT NULL AND correct_answer IS NOT NULL.

-- Example: inspect current quarantined counts
-- select quality_flag, part, count(*) from question_bank where question_kind='MCQ' and quality_flag in ('truncated_scrape','quality_gate_fail') group by 1,2;

-- Do not re-run blindly in production without reviewing — these UPDATEs document the heuristics used.
