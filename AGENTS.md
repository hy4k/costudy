# CoStudy Agent Operating Instructions

These instructions apply to the full repository.

## Project Context
- Product: CoStudy.
- Initial launch focus: CMA US only.
- Preferred public website for product decisions: `costudy.in`.
- Primary repositories for code reasoning: `hy4k/costudy` and `hy4k/costudy-api`.
- Launch path: start from Kerala, prove in India, then scale globally.
- If an infrastructure detail is unspecified, state the assumption explicitly as “no specific constraint” instead of inventing one.

## Product Mission
Build CoStudy as a learning operating system for CMA US, not merely a course website. Balance:
- product value,
- educational effectiveness,
- learner trust,
- premium conversion,
- technical soundness,
- verification quality,
- scalability.

## Multi-Agent Operating Model
For product, UX, engineering, QA, growth, strategy, learning-design, or security work, start from `docs/orchestration/stage-01.md`, apply the Stage 05 contract in `docs/orchestration/stage-05.md`, and preserve the canonical team roster in `docs/orchestration/agent-roster.md`.

For complex work, split planning, implementation, review, and verification into focused streams. Use specialised subagents when the environment supports them. The canonical CoStudy agent roster lives in `docs/orchestration/agent-roster.md` and must be preserved exactly. Use it especially for:
- product strategy,
- educational design,
- UX and conversion review,
- frontend engineering,
- backend/API engineering,
- QA and verification,
- security and accessibility review.

## Isolation Rule
For non-trivial parallel code work, use isolated git worktrees, branches, or equivalent isolated workspaces. Each implementation stream should own a narrow file/module scope. Do not mix unrelated experiments in a single worktree.


## Feature Workflow Rule
Whenever a feature is proposed, follow this sequence unless the task explicitly requests a different order:
1. Product Agent defines feature
2. Research / Strategy validates need
3. UX Agent designs flow
4. Technical Agent designs implementation
5. Builder Agent develops
6. QA Agent tests
7. Red Team Agent attacks assumptions
8. CHECK-WORK verifier issues final VERDICT: PASS or VERDICT: FAIL

## Pre-Code Parallel Audits
Before writing or modifying significant code, run these parallel audits when relevant:
- Product Audit
- Design Audit
- User Journey Audit
- Business Audit
- Technical Audit

For each audit, summarise:
- what is strong
- what is weak
- what is risky
- what is missing
- what should happen next

## Task Classification
Classify each incoming task into one or more of:
- Explore
- Plan
- Build
- Review
- Verify
- Release

Spawn subagents accordingly with strict scopes.

## Verification Rule
After implementation or major analysis, run an independent CHECK-WORK verification pass when the environment supports subagents. Builders may suggest checks, but they must never issue the final PASS/FAIL verdict for their own work.

The verifier must return exactly one top-level verdict line: `VERDICT: PASS` or `VERDICT: FAIL`. Then include these sections:
- Summary;
- Evidence;
- Commands run;
- Files reviewed;
- Exact issues with file:line references where possible;
- Missing checks or environmental limitations;
- Merge recommendation.

The verifier must review:
- the original task request,
- relevant conversation context,
- git diff and changed files,
- build output,
- test output,
- lint output,
- type-check output,
- security and accessibility findings.

## PR Expectations
For meaningful product copy, UX, learning-flow, auth, data, payment, AI, infrastructure, or security changes, PR descriptions should include:
- scope;
- Stage 01 assumptions;
- verification commands and results;
- unresolved risks or follow-ups.

## Execution Philosophy
- Be explicit.
- Be reproducible.
- Prefer the smallest sufficient change.
- Prefer evidence over confidence.
- Prefer real command output over speculation.
- Stop only when the task is complete or there is a precise blocker report.

## Repo-Aware Verification Baseline
For `hy4k/costudy` frontend work:
- install dependencies if needed;
- run `npm install`;
- run `npm run build`;
- run type-check commands if they exist;
- run the smallest relevant tests first, then broader tests if test scripts exist;
- run lint scripts if they exist;
- if lint or test scripts do not exist, state that explicitly as a verification gap.

For `hy4k/costudy-api` backend work:
- install dependencies if needed;
- run `npm install`;
- run `npm run start` or the smallest safe runtime validation available;
- run the smallest relevant tests first if test scripts exist;
- run lint scripts if they exist;
- run static syntax/type validation if such a command exists;
- if lint or test scripts do not exist, state that explicitly as a verification gap.

If a task changes both frontend and backend, verify both repos separately and jointly assess interface compatibility.

## Product Decision Rule
Before recommending or implementing product changes, ask: are we building the right thing, in the right sequence, for a CMA US learner, with enough trust and enough motivation to pay?

## Stage 05 Guardrails
For subagent behaviour, non-trivial task output, product, premium conversion, design, education, security, scalability, team, release, failure, honesty, planning, build, UX audit, and release verification rules, apply `docs/orchestration/stage-05.md`.

## Engineering Expectations
- Prefer minimal, reviewable, reversible changes.
- Keep app copy and product decisions aligned with CMA US unless a task explicitly expands scope.
- Do not imply external integrations, infrastructure, AI providers, payment systems, or compliance status unless implemented or explicitly specified.
