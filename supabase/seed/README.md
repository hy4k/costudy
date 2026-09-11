# CoStudy content seeds

## MCQ bank (`question_bank`)
Mocks call RPC `pick_mock_mcqs(part, count)`, which selects rows where:
- `question_kind = 'MCQ'`
- `is_active = true`
- `quality_flag = 'verified'`
- `options` and `correct_answer` are present

### Part 2 curated seed (2026-09-07)
- `part2_mcq_p2_seed_20260907.json` / `.sql` — 100 original Part 2 MCQs (`external_id` `p2-seed-001`…`100`, tag `p2_seed_20260907`).

### Quarantine
See `quarantine_bad_mcqs.sql`. Scraped/truncated options were soft-disabled rather than deleted.

## CBQ (`cbq_cases` / `cbq_tasks`)
Mock engine selects cases with `active` and `verified`.
- `cbq_cases_fets_v1.sql` — original 6 FETS cases (`source='fets'`). **Destructive:** begins with `DELETE … WHERE source='fets'`.
- `cbq_cases_fets_v2.sql` — additional cases (`source='fets_v2'`), append-only.

## Deploy notes
Apply SQL via Supabase SQL editor / MCP `execute_sql`. Edge function `mock-engine` must stay in sync with `supabase/functions/mock-engine/`.

### CBQ v2 (2026-09-07)
- `cbq_cases_fets_v2.sql` / `.json` — 6 additional cases (`source='fets_v2'`), append-only:
  - Part 1: Palakkad FinTech (ITGC), Kollam Cashew (FIFO process costing), Kozhikode Spices (inventory/revenue)
  - Part 2: Munnar Tea (FX hedge), Wayanad Coffee (NPV/IRR), Pathanamthitta Hydro (WACC)


## Large files (`parts/`)

Full CBQ SQL and Part 2 MCQ seeds are split into ordered parts (automation single-file limit):

| Original | Parts |
|---|---|
| `cbq_cases_fets_v1.sql` | `parts/cbq_cases_fets_v1.part*.sql` |
| `cbq_cases_fets_v2.sql` | `parts/cbq_cases_fets_v2.part*.sql` |
| `cbq_cases_fets_v2.json` | `parts/cbq_cases_fets_v2.part*.json` (`jq -s add`) |
| `part2_mcq_p2_seed_20260907.sql` | `parts/part2_mcq_p2_seed_20260907.part*.sql` |
| `part2_mcq_p2_seed_20260907.json` | `parts/part2_mcq_p2_seed_20260907.part*.json` (`jq -s add`) |

```bash
cat supabase/seed/parts/cbq_cases_fets_v1.part*.sql > /tmp/cbq_v1.sql
cat supabase/seed/parts/cbq_cases_fets_v2.part*.sql > /tmp/cbq_v2.sql
cat supabase/seed/parts/part2_mcq_p2_seed_20260907.part*.sql > /tmp/p2.sql
jq -s 'add' supabase/seed/parts/cbq_cases_fets_v2.part*.json > /tmp/cbq_v2.json
jq -s 'add' supabase/seed/parts/part2_mcq_p2_seed_20260907.part*.json > /tmp/p2.json
```

Already applied live on Supabase (2026-09-07): quarantine, 100 Part 2 MCQs (`p2-seed-001`…`100`), 6 CBQ cases (`source=fets_v2`).
