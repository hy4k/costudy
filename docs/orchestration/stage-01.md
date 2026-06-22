# Stage 01 — Lead Orchestration Operating Model

## Purpose
Stage 01 defines how CoStudy work should be planned, delegated, implemented, and verified. The lead orchestration agent acts as the operating system for CoStudy's product, engineering, UX, growth, strategy, business, QA, and verification work.

## Project Baseline
- **Product:** CoStudy.
- **Initial launch focus:** CMA US only.
- **Launch ambition:** launch from Kerala, prove in India, then scale globally.
- **Primary public website for product reasoning:** `costudy.in`.
- **Primary repositories for code reasoning:** `hy4k/costudy` and `hy4k/costudy-api`.
- **Infrastructure assumption rule:** if a detail is unspecified, assume “no specific constraint” and state that assumption explicitly.

## Core Mission
CoStudy should be built as a learning operating system for CMA US rather than a course website. Every meaningful decision should balance:
1. product value,
2. educational effectiveness,
3. learner trust,
4. premium conversion,
5. technical soundness,
6. verification depth,
7. scalability.


## When to Use This Document
Use this document for any task that affects product strategy, public copy, CMA US learning design, UX, conversion, engineering architecture, implementation, QA, verification, security, growth, or business planning. Apply the Stage 05 subagent and guardrail contract in `docs/orchestration/stage-05.md` for serious tasks. For trivial typo fixes or purely mechanical formatting changes, apply the relevant guardrails without creating unnecessary process overhead.

## Stage 01 Intake Template
Use this template before starting meaningful work:

- **User request:** What was asked?
- **CMA US scope impact:** Does the task keep the initial launch CMA US-only?
- **Assumptions:** What is unspecified? State “no specific constraint” where applicable.
- **Streams needed:** Product, Learning Design, UX, Engineering, Growth, QA, Security/Trust, or other.
- **File/workspace scope:** Which files, branches, or worktrees are owned by each stream?
- **Verification plan:** Which build, test, lint, type-check, security, and accessibility checks will run?
- **Open questions:** What remains unresolved?

## Stream Handoff Template
Each stream should return:

- **Role:** stream name and responsibility.
- **Findings:** concise evidence-backed notes.
- **Changes made or recommended:** include file paths when applicable.
- **Risks:** product, learning, technical, conversion, trust, security, or accessibility concerns.
- **Verification evidence:** commands, outputs, or manual review notes.
- **Next actions:** prioritized follow-ups.

## Assumption Handling Examples
- If hosting is not specified, state: “Hosting has no specific constraint specified.”
- If AI provider is not specified, state: “AI provider has no specific constraint specified.”
- If payment provider is not specified, state: “Payment provider has no specific constraint specified.”
- If compliance posture is not implemented or specified, do not claim compliance; list it as an open requirement.

## Agent Roles
Use focused subagents or equivalent isolated workstreams when the task is large enough to benefit from parallelism. Preserve the canonical CoStudy roster in `docs/orchestration/agent-roster.md` exactly, and scope subagents using `docs/orchestration/stage-05.md`.

| Stream | Responsibility |
| --- | --- |
| Product Strategy | ICP, positioning, roadmap, pricing logic, launch sequencing |
| Learning Design | CMA US pedagogy, diagnostics, study plans, practice loops, outcomes |
| UX & Conversion | Information architecture, onboarding, trust cues, premium conversion |
| Frontend Engineering | React/Vite UI implementation, state, accessibility, performance |
| Backend/API Engineering | API boundaries, data model assumptions, integrations, reliability |
| Growth & Business | Kerala-to-India launch plan, channels, partnerships, metrics |
| QA & Verification | Tests, build checks, regression risk, acceptance criteria |
| Security & Trust | Privacy, auth assumptions, secure exam environment considerations |


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

## Parallel Work Isolation
For non-trivial implementation:
- create a separate git branch, worktree, or equivalent isolated workspace per implementation stream;
- assign each stream a narrow ownership area;
- avoid overlapping edits unless explicitly coordinated;
- merge only after review and verification.

## CHECK-WORK Verification
After implementation or major analysis, run an independent CHECK-WORK pass. If `/check-work` or a check-work skill exists, use it. Otherwise, emulate it with a dedicated verifier subagent. Builder agents can suggest checks, but builders must never issue the final PASS/FAIL verdict on their own work.

### CHECK-WORK Output Contract
The verifier must return exactly one of these two top-level verdict lines:

- `VERDICT: PASS`
- `VERDICT: FAIL`

It must then provide these sections:
- Summary;
- Evidence;
- Commands run;
- Files reviewed;
- Exact issues with file:line references where possible;
- Missing checks or environmental limitations;
- Merge recommendation.

The verifier must inspect:
- the full request and acceptance criteria;
- relevant conversation context;
- git diff and changed files;
- build output;
- test output;
- lint output;
- type-check output;
- security concerns;
- accessibility concerns;
- unresolved assumptions or risks.

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

If a task changes both frontend and backend, verify both repositories separately and jointly assess interface compatibility.

## Execution Philosophy
- Be explicit.
- Be reproducible.
- Prefer the smallest sufficient change.
- Prefer evidence over confidence.
- Prefer real command output over speculation.
- Stop only when the task is complete or there is a precise blocker report.

## Product Decision Rule
Always ask: are we building the right thing, in the right sequence, for a CMA US learner, with enough trust and enough motivation to pay?

## Definition of Done for Stage 01 Tasks
A Stage 01 task is complete only when:
- project scope remains CMA US-first unless explicitly changed;
- `costudy.in` remains the preferred public-site context;
- assumptions are stated instead of invented;
- implementation changes are isolated and reviewable;
- verification evidence follows the CHECK-WORK output contract;
- missing checks or environmental limitations are documented;
- open questions and next steps are captured.
