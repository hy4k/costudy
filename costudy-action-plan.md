# CoStudy Action Plan — Prioritized Roadmap

> **Generated**: March 8, 2026  
> **Based on**: Full-stack audit (UI/UX + Technical + Database + Automated Metrics)  
> **Reports**: `costudy-uiux-audit.md`, `costudy-technical-audit.md`, `costudy-services-audit.md`

---

## Executive Summary

CoStudy has strong foundations — clean dependency set, effective code splitting, a distinctive brand voice in its micro-typography and mission-style copy, and genuinely excellent auth screen design. However, the audit reveals **6 critical security issues**, **9 high-priority bugs**, a fractured design identity (dark auth vs light app), and systemic gaps in error handling, accessibility, and type safety across all 14 views.

### Answers to Key Questions

| Question | Answer |
|---|---|
| **Military/mission aesthetic?** | Score: 4/10. Copy and micro-typography are mission-grade. Visual treatment is not — light SaaS shell contradicts dark cinematic auth. |
| **Dark mode?** | Does not exist globally. Auth screens are dark (9/10), everything else is light. |
| **CSS regressions?** | Teacher theme is inconsistent: Emerald in Layout, Teal in SignUp. Landing uses hardcoded `red-600` instead of brand vars. |
| **Vouch system correctness?** | Partially correct. DB-level unique constraint prevents double-votes. But vouch INSERT + RPC call are non-atomic — count can drift on failures. |
| **Study_rooms table?** | Base table lacks RLS. Enhanced columns added via migration. `study_room_resources` FK not enforced. Messages/resources have `USING (true)` — any user can modify any room's data. |
| **Real-time features?** | Near-zero. Only 2 subscriptions exist, both unfiltered (leak data). Chat, rooms, war room, whiteboards have no real-time. |
| **Gemini integration?** | API key baked into client bundle. No token counting, no cost awareness, no rate limiting. Unbounded conversation history. |
| **Unused dependencies?** | None — all 4 "unused" flags from depcheck are false positives (build tools). |
| **DRYness / component reuse?** | Poor. No shared Button, Input, Modal, or Card components. 7+ button variants duplicated inline. 8 files exceed 600 lines. |

---

## Priority Matrix

### 🔴 P0 — Critical (Fix This Week)

These are security vulnerabilities and data integrity issues that could be exploited or cause data loss.

| # | Task | Impact | Effort | Report Ref |
|---|---|---|---|---|
| **P0-1** | Fix `study_room_messages` and `study_room_resources` RLS — replace `USING (true)` with membership-based policies | Any user can delete anyone's room messages/resources | Low | S-1 |
| **P0-2** | Fix `notifications` INSERT policy — restrict to system or self | Any user can spam-create notifications for others | Low | S-4 |
| **P0-3** | Move financial operations to Supabase Edge Functions (escrow, payment, subscription upgrades) | Client-side payments are trivially exploitable | High | S-2 |
| **P0-4** | Remove correct answers from client-side exam session data | Exam integrity compromised — answers visible in DevTools | Medium | S-3 |
| **P0-5** | Delete `003_mock_exam_safe.sql` (corrupted chat log) | Will fail if run against DB | Trivial | Migration |
| **P0-6** | Fix env var: rename `.env` `VITE_SUPABASE_KEY` → `VITE_SUPABASE_ANON_KEY`; remove `SUPABASE_SERVICE_KEY` from frontend | Supabase silently fails in dev; service key exposure risk | Trivial | Phase 0 |

### 🟠 P1 — High Priority (Fix This Sprint)

Issues that break features, cause poor UX, or have security implications.

| # | Task | Impact | Effort | Report Ref |
|---|---|---|---|---|
| **P1-1** | Fix notification subscription — add `.filter('user_id=eq.${userId}')` | Currently leaks ALL users' notifications to every client | Trivial | Layout.tsx |
| **P1-2** | Fix `chatService.getConversations` N+1 query — use single query with joins | 2N+1 queries per page load; will not scale | Medium | chatService |
| **P1-3** | Fix alignment service table/column mismatches (`tracking_records` → `user_tracking`, `user_id` → `requester_id`) | Alignment and tracking features silently broken | Low | alignmentService |
| **P1-3b** | Replace vouch INSERT+RPC with atomic `add_vouch`/`remove_vouch` RPCs | Prevents count drift on partial failures | Low | clusterService, 002_cluster_features.sql |
| **P1-4** | Consolidate 3 conflicting exam migrations into one canonical migration | Cannot reliably reproduce DB schema | Medium | Migrations |
| **P1-5** | Install `@types/react` and `@types/react-dom` | Eliminates ~3,900 of 4,385 TS strict errors | Trivial | Phase 6 |
| **P1-6** | Add try/catch to all `useEffect` data-loading functions (every view) | API failures cause permanent loading spinners in 12+ views | Low | All views |
| **P1-7** | Fix teacher theme inconsistency (Emerald vs Teal) — pick one, apply everywhere | Jarring visual shift during signup → login transition | Trivial | DS-3 |
| **P1-8** | Remove hardcoded access code `'CMA2025'` from client; validate server-side | Teacher access code visible in source | Low | SignUp.tsx |
| **P1-9** | Move Gemini API calls to backend/Edge Function | API key visible in client bundle | High | geminiService |
| **P1-10** | Run `npm audit fix` to resolve minimatch and rollup vulnerabilities | 2 high-severity CVEs | Trivial | Phase 6 |

### 🟢 P2 — Quick Wins (Low Effort, High Impact)

| # | Task | Impact | Effort |
|---|---|---|---|
| **P2-1** | Remove stale `<script type="importmap">` from `index.html` | Eliminates developer confusion | 1 min |
| **P2-2** | Pin `@supabase/supabase-js` to specific version (not `"latest"`) | Reproducible builds | 1 min |
| **P2-3** | Remove dead cloud status polling in Layout.tsx (lines 63-68) | Saves a polling interval every 4s | 2 min |
| **P2-4** | Replace all `alert()` calls with inline toasts (12+ occurrences) | Professional user feedback | 1 hour |
| **P2-5** | Add `<label>` elements to all form inputs (Login, SignUp) | WCAG AA compliance for auth flow | 30 min |
| **P2-6** | Remove fake mentor metrics (random passRate, avgScoreJump) | Students shouldn't see fabricated data | 15 min |
| **P2-7** | Remove artificial 3-second delay in MentorDashboard | Teachers waste 3s on every dashboard load | 1 min |
| **P2-8** | Add FETS Yellow `#FFD633` to Tailwind config as `accent` color | Brand identity — currently zero occurrences | 5 min |
| **P2-9** | Move `PRODUCTS` array and exam card configs out of component bodies to module-level constants | Prevent unnecessary re-renders | 15 min |
| **P2-10** | Fix Landing page to use `brand` CSS vars instead of hardcoded `red-600` | Theme consistency | 15 min |

### 🔵 P3 — Medium-Term Improvements (Plan as Projects)

| # | Task | Impact | Effort | Category |
|---|---|---|---|---|
| **P3-1** | Implement global dark mode as default for post-login shell | Brand identity transformation | High | Design |
| **P3-2** | Extract shared components: `<Button>`, `<Input>`, `<Modal>`, `<Card>` | Eliminate 200+ lines of duplicated JSX per component | High | Architecture |
| **P3-3** | Decompose god components: StudyWall (→5), Profile (→4), StudyRooms (→8), MentorDashboard (→6), ExamSession (→5) | Maintainability; enables testing | High | Architecture |
| **P3-4** | Split god services: fetsService (→3), clusterService (→7) | Separation of concerns | Medium | Architecture |
| **P3-5** | Add Supabase real-time subscriptions for chat, rooms, war room, presence | Core feature requirement for collaborative UX | High | Feature |
| **P3-6** | Run `supabase gen types typescript` and type all service queries | Eliminate `any` casts, catch schema mismatches at compile time | Medium | Quality |
| **P3-7** | Add `role="dialog"`, `aria-modal`, focus traps to all modals | Accessibility compliance | Medium | A11y |
| **P3-8** | Make MCQ options accessible (radio inputs, keyboard navigation, ARIA) | Exam flow is inaccessible to keyboard/screen reader users | Medium | A11y |
| **P3-9** | Add conversation history truncation and token counting to AIDeck | Control Gemini API costs; prevent context overflow | Medium | Feature |
| **P3-10** | Implement proper form validation (Zod or similar) for all user inputs | Consistent validation, better error messages | Medium | Quality |
| **P3-11** | Add error boundaries (app-level + per-view) | Prevent white-screen crashes | Low | Resilience |
| **P3-12** | Add missing DB indexes (13+ high-traffic columns) | Query performance at scale | Low | Performance |

### ⚪ P4 — Long-Term / Architectural (Roadmap Items)

| # | Task | Impact | Effort | Category |
|---|---|---|---|---|
| **P4-1** | Redesign Landing page to match dark/cinematic brand | Brand coherence from first touchpoint | High | Design |
| **P4-2** | Adopt React Router for URL-based routing | Deep linking, browser history, SEO, shareable URLs | High | Architecture |
| **P4-3** | Add ESLint + Prettier + pre-commit hooks | Automated code quality | Medium | Tooling |
| **P4-4** | Add testing framework (Vitest + React Testing Library) | Regression prevention | High | Quality |
| **P4-5** | Enable `strict: true` in tsconfig (after P1-5) | Full type safety | Medium | Quality |
| **P4-6** | Add secondary display font (monospace) for data/telemetry | Reinforce mission aesthetic | Low | Design |
| **P4-7** | Implement offline retry for critical operations (exam save, chat send) | Resilience for unreliable connections | Medium | UX |
| **P4-8** | Feature-folder refactor (move from flat root to `src/features/`) | Scaling, code organization | High | Architecture |
| **P4-9** | Complete StudyRooms with real API integration (currently all mock) | Core product feature non-functional | Very High | Feature |
| **P4-10** | Build backend API for payment processing, exam grading, mentor matching | Move business logic server-side | Very High | Architecture |

---

## Impact/Effort Matrix

```
                    HIGH IMPACT
                        │
    P0-1,P0-2,P0-6     │     P0-3, P3-1, P4-9
    P1-1,P1-5,P1-7     │     P1-9, P3-5, P4-10
    P1-10,P2-1–P2-10   │     P3-2, P3-3, P4-2
    ────────────────────┼────────────────────────
    P2-9                │     P4-3, P4-4, P4-5
                        │     P4-8, P3-10
                        │
  LOW EFFORT ───────────┼─────────── HIGH EFFORT
                        │
                   LOW IMPACT
```

**Do first** (top-left): P0-1, P0-2, P0-6, P1-1, P1-5, P1-7, P1-10, all P2 items  
**Plan as projects** (top-right): P0-3, P1-9, P3-1, P3-5, P4-9, P4-10  
**Fill-ins** (bottom-left): P2-9  
**Defer** (bottom-right): P4-3, P4-4, P4-8

---

## Suggested Implementation Order

### Week 1: Security & Stability
- P0-1 through P0-6 (critical security fixes)
- P1-1 (notification leak)
- P1-5 (`@types/react`)
- P1-10 (`npm audit fix`)
- All P2 quick wins

### Week 2: Error Handling & Type Safety
- P1-3 (alignment service fixes)
- P1-6 (try/catch on all data loading)
- P1-7 (teacher theme)
- P1-8 (remove hardcoded access code)
- P3-6 (Supabase type generation)

### Week 3-4: Architecture
- P3-2 (extract shared components)
- P3-3 (decompose god components — start with StudyWall)
- P3-4 (split god services)
- P1-4 (consolidate exam migrations)

### Month 2: UX & Features
- P3-1 (global dark mode)
- P3-5 (real-time subscriptions)
- P3-7, P3-8 (accessibility)
- P3-9 (Gemini cost controls)
- P1-2 (chat query optimization)

### Month 3+: Platform
- P0-3 / P1-9 (server-side financial ops + Gemini)
- P4-2 (React Router)
- P4-9 (StudyRooms real API)
- P4-10 (backend API build-out)

---

## Metrics to Track

| Metric | Current | Target | How to Measure |
|---|---|---|---|
| TS strict errors | 4,385 | 0 | `npx tsc --noEmit --strict 2>&1 \| grep error \| wc -l` |
| npm audit high/critical | 2 | 0 | `npm audit` |
| Files >600 LOC | 8 | 0 | `wc -l` on all source files |
| Components with try/catch on data loading | ~3/17 | 17/17 | Code review |
| Components with proper loading UI | ~8/17 | 17/17 | Code review |
| Forms with `<label>` elements | 0/5 | 5/5 | Accessibility audit |
| Modals with focus trap + ARIA | 0/8+ | 8/8 | Accessibility audit |
| Bundle size (gzipped) | ~260 KB | <250 KB | `npm run build` |
| Real-time subscriptions | 2 (broken) | 6+ (working) | Code review |
| Mock/fake data in production paths | 10+ | 0 | Code review |
