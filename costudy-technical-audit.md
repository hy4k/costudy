# CoStudy Technical Audit Report

> **Audit Date**: March 8, 2026  
> **Scope**: Full-stack frontend audit — architecture, code quality, database, services, automated metrics  
> **Repo**: `costudy-frontend` on `main`

---

## 1. Architecture Overview

```
User → Browser → CoStudy SPA (Vite + React 19)
                    ├── Supabase (Auth, Postgres, Realtime)
                    ├── Gemini API (AI Deck / Teaching Deck)
                    └── CoStudy API (RAG pipeline, backend services)
```

**Frontend structure** (flat, no `src/`):

| Layer | Files | Total LOC |
|---|---|---|
| Entry shell | `index.html`, `index.tsx`, `App.tsx` | ~340 |
| Layout & shared | `Layout.tsx`, `Icons.tsx`, `InviteCard.tsx`, `InviteCodeInput.tsx` | ~710 |
| Views (14) | `components/views/*.tsx` | ~7,200 |
| Auth (2) | `components/auth/*.tsx` | ~500 |
| Services (13) | `services/*.ts` | ~4,700 |
| Types | `types.ts` | 729 |
| **Total application code** | **~33 files** | **~14,200** |

---

## 2. Code Quality Metrics (Phase 6)

### 2.1 TypeScript Strict Check

```
npx tsc --noEmit --strict → 4,385 errors (exit code 2)
```

**Errors by file (top 15)**:

| File | Errors | Primary Error Types |
|---|---|---|
| `ExamIntroPages.tsx` | 462 | TS7026 (JSX implicit any) |
| `ExamSession.tsx` | 433 | TS7026, TS7006 (implicit any param) |
| `Profile.tsx` | 425 | TS7026, TS7006 |
| `MentorDashboard.tsx` | 410 | TS7026, TS7006 |
| `StudyRooms.tsx` | 375 | TS7026, TS7006 |
| `StudyWall.tsx` | 357 | TS7026, TS7006 |
| `Icons.tsx` | 301 | TS7026 (every SVG element) |
| `AIDeck.tsx` | 233 | TS7026, TS7006 |
| `DirectMessages.tsx` | 219 | TS7026, TS7006 |
| `MockTests.tsx` | 199 | TS7026, TS7006 |
| `LibraryVault.tsx` | 188 | TS7026, TS7006 |
| `Layout.tsx` | 153 | TS7026, TS7006 |
| `Landing.tsx` | 130 | TS7026 |
| `InviteCard.tsx` | 98 | TS7026 |
| `TeachersDeck.tsx` | 94 | TS7026 |

**Root causes**:
- **~3,900 errors** are `TS7026` (JSX implicit any) — caused by missing `@types/react` and `@types/react-dom` in dependencies. Adding these two packages would eliminate ~89% of all strict errors.
- **~400 errors** are `TS7006` (implicit any parameter) — genuine type safety gaps in callback params, event handlers, and service responses.
- **~80 errors** are real type mismatches (`TS2322`, `TS2339`, `TS2552`) in services — these represent actual bugs.

**Actionable path to strict mode**:
1. `npm i -D @types/react @types/react-dom` → eliminates ~3,900 errors
2. Fix ~400 implicit `any` params → add proper types to callbacks
3. Fix ~80 real type errors → actual bugs that should be fixed regardless

### 2.2 Bundle Analysis

```
npm run build → 44.81s, 22 output files
Total dist: 1.1 MB (uncompressed)
```

| Chunk | Size | Gzip | Category |
|---|---|---|---|
| `vendor-genai` | 259 KB | 51 KB | **Largest** — Google GenAI SDK |
| `index` (app core) | 237 KB | 73 KB | App shell + services + types |
| `vendor-supabase` | 170 KB | 45 KB | Supabase client |
| `MockTests` | 51 KB | 13 KB | Heaviest view |
| `Profile` | 42 KB | 10 KB | Second heaviest |
| `StudyWall` | 32 KB | 9 KB | Third heaviest |
| `MentorDashboard` | 25 KB | 6 KB | |
| `StudyRooms` | 22 KB | 5 KB | |
| `AIDeck` | 21 KB | 5 KB | |
| `DirectMessages` | 20 KB | 6 KB | |
| `vendor-react` | 12 KB | 4 KB | React 19 (small!) |
| CSS | 79 KB | 13 KB | All Tailwind output |

**Key findings**:
- **Vendor chunks working well**: React (12KB), Supabase (170KB), GenAI (259KB) are properly separated for independent caching.
- **GenAI is the biggest cost**: 259KB for an AI chat SDK. Consider lazy-loading only when user opens AIDeck.
- **App core index (237KB)**: Contains all services and types — could be further split by route.
- **Lazy loading working**: All 14 views are code-split into separate chunks. Good.
- **CSS is monolithic**: 79KB single CSS file. Tailwind purging is working (raw Tailwind would be 3MB+), but could be further optimized.

### 2.3 Unused Dependencies (depcheck)

| Status | Packages |
|---|---|
| **Unused devDependencies** | `autoprefixer`, `postcss`, `tailwindcss`, `typescript` |
| **Missing from deps** | None |

depcheck flags `tailwindcss`, `postcss`, `autoprefixer` as unused because they're consumed by the build pipeline (PostCSS config), not imported in code. `typescript` is similarly a build tool. **All 4 are false positives** — these should remain.

**Verdict**: No truly unused dependencies. The dependency set is lean and correct.

### 2.4 npm Security Audit

```
2 high severity vulnerabilities, 0 critical
```

| Package | Severity | Issue | Fix |
|---|---|---|---|
| `minimatch` 9.0.0–9.0.6 | High | ReDoS via wildcards, nested extglobs, GLOBSTAR segments | `npm audit fix` |
| `rollup` 4.0.0–4.58.0 | High | Arbitrary file write via path traversal | `npm audit fix` |

Both are fixable with `npm audit fix`. The `rollup` vulnerability is in Vite's bundler dependency — updating Vite to latest should resolve it.

### 2.5 Code Complexity (Lines of Code)

**Files by size (descending)**:

| File | LOC | Assessment |
|---|---|---|
| `clusterService.ts` | 1,058 | **Critical** — God service, 7 services crammed into one file |
| `StudyWall.tsx` | 970 | **Critical** — God component, 20+ state variables |
| `ExamSession.tsx` | 816 | **High** — 6 phases in one component |
| `Profile.tsx` | 809 | **High** — Profile + CAN network + boundary modal |
| `StudyRooms.tsx` | 793 | **High** — Room list + 7-tab detail view |
| `types.ts` | 729 | Acceptable — central type definitions |
| `examService.ts` | 682 | **High** — Overlaps with fetsService |
| `ExamIntroPages.tsx` | 673 | **High** — 16-page switch/case, should be data-driven |
| `MentorDashboard.tsx` | 619 | **High** — 6 tabs in one file |
| `fetsService.ts` | 554 | **High** — God service (auth + profiles + exams + payments) |
| `AIDeck.tsx` | 526 | Medium — 5 AI tools |
| `DirectMessages.tsx` | 500 | Medium — Master-detail chat |
| `MockTests.tsx` | 474 | Medium |
| `Layout.tsx` | 394 | Acceptable |

**8 files exceed 600 lines** — all candidates for decomposition.

---

## 3. Database Design Review

### 3.1 Schema Summary (~30 tables)

**Core**: `user_profiles`, `posts`, `comments`, `vouches`, `notifications`  
**Study Rooms**: `study_rooms`, `study_room_members`, `study_room_missions`, `study_room_messages`, `study_room_resources`, `study_room_notebooks`  
**Social**: `chat_conversations`, `chat_participants`, `chat_messages`, `alignments`, `alignment_requests` (missing from DDL), `user_tracking`  
**Exams**: `mcq_questions`, `essay_questions`, `ai_question_cache`, `exam_sessions`, `exam_session_snapshots`  
**Monetization**: `group_subscriptions`, `group_invites`, `mentor_sessions`, `session_payments`, `wallet_transactions`  
**Gamification**: `badges`, `user_badges`, `room_leaderboard`, `mcq_war_sessions`, `mcq_war_participants`  
**Other**: `invite_codes`, `teacher_broadcasts`, `student_enrollments`, `mentor_availability`, `whiteboard_sessions`

### 3.2 Critical RLS Issues

| Table | Policy | Issue |
|---|---|---|
| `study_room_messages` | `USING (true)` for ALL ops | **Any user can delete/modify any room's messages** |
| `study_room_resources` | `USING (true)` for ALL ops | **Any user can delete/modify any room's resources** |
| `notifications` | INSERT allows any authenticated user | **Any user can create notifications for any other user** (spam/phishing vector) |
| `study_rooms` | No RLS on base table | Base table has no policies; only enhanced columns covered |

### 3.3 Schema Conflicts

**3 conflicting migration files** for the exam system:
- `003_essay_questions.sql`: TEXT PKs, `scenario`/`tasks` columns, `exam_part` enum
- `003_mock_exam_system.sql`: UUID PKs, `scenario_text`/`requirements` columns, `section NOT NULL`
- `003_mock_exam_system_v2.sql`: UUID PKs, no `section`

Running any two creates conflicts. A single canonical migration must be chosen.

**Corrupted file**: `003_mock_exam_safe.sql` is a 2,680-line OpenClaw chat log, not SQL.

### 3.4 Missing Schema Elements

| Element | Used By | Status |
|---|---|---|
| `alignment_requests` table | `alignmentService.ts` | **Not in any DDL or migration** |
| `tracking_records` table | `alignmentService.ts` | Service uses this name; DB defines `user_tracking` |
| `user_id` column in alignments | `alignmentService.ts` | DB has `requester_id` instead |

### 3.5 Missing Indexes

13+ high-traffic columns lack indexes. Key ones:
- `posts.author_id`, `posts.created_at`, `posts.type`
- `comments.post_id`
- `chat_messages.conversation_id`, `chat_messages.created_at`
- `notifications.user_id`
- `exam_sessions.user_id + status` (compound)

### 3.6 Vouch System Assessment

**Schema**: `vouches` table with `UNIQUE(voucher_id, post_id)` — prevents double-voting at DB level. Good.

**RPCs**: `increment_post_vouches` / `decrement_post_vouches` update both `posts.likes` and `user_profiles.reputation.vouchesReceived`.

**Race conditions**:
- Vouch INSERT and RPC call are separate operations — if INSERT succeeds but RPC fails, count drifts
- JSONB reputation updates via `jsonb_set` are not atomic across concurrent vouches
- No transaction wrapping around the two operations

---

## 4. API / Services Integration Review

### 4.1 Supabase Client Configuration

- `autoRefreshToken: false` — manual refresh needed but **not implemented consistently**. Users may experience random logouts.
- `persistSession: true` — sessions survive page refresh. Good.
- **Env var mismatch**: `.env` has `VITE_SUPABASE_KEY` but code reads `VITE_SUPABASE_ANON_KEY`
- Placeholder fallback when config missing — silently broken in dev

### 4.2 Service Layer Issues

| Service | LOC | Critical Issues |
|---|---|---|
| `fetsService.ts` | 554 | God service (5 domains), fake payment processor, mock performance data |
| `costudyService.ts` | 384 | Fake mentor metrics (random passRate), no real-time, mock library |
| `clusterService.ts` | 1,058 | **Client-side financial operations** (escrow, payments, subscriptions), invite code bypass, 7 sub-services |
| `chatService.ts` | 167 | **N+1 query bomb** (2N+1 queries per page), no real-time, JSON in name field |
| `alignmentService.ts` | 361 | **Table/column name mismatches** — features silently broken |
| `examService.ts` | 682 | **Correct answers sent to client**, client-side scoring, duplicates fetsService |
| `geminiService.ts` | 283 | API key in client bundle, no token counting, no rate limiting |
| `matchingService.ts` | 76 | Clean — pure client-side computation |
| `inviteService.ts` | 139 | Well-structured with typed returns — best service pattern |
| `localAuthService.ts` | 73 | Clean fallback service |
| `costudyAPI.ts` | 116 | Hardcoded URL, duplicate RAG search, good error handling |
| `prompts.ts` | ~60 | System prompts for Gemini — no injection protection |

### 4.3 Real-Time Features Assessment

**Current state**: Near-zero real-time. Only two subscriptions exist:
1. `Layout.tsx` → `notifications` table (but **no user filter** — leaks all users' notifications)
2. `DirectMessages.tsx` → `chat_messages` (but **global subscription** — triggers on all messages for all users)

**Features needing real-time**: Chat, study room presence, MCQ War scoring, whiteboard collaboration, notification delivery, signal lights.

---

## 5. Security Assessment

### 5.1 Critical Vulnerabilities

| # | Issue | Severity | Location |
|---|---|---|---|
| S-1 | `study_room_messages`/`resources` RLS allows any user to modify/delete any data | **Critical** | `database.sql` |
| S-2 | Financial operations (escrow, payments, subscriptions) run client-side | **Critical** | `clusterService.ts` |
| S-3 | Exam correct answers sent to client in session data | **Critical** | `examService.ts` |
| S-4 | Notification INSERT allows any user to create notifications for any user | **Critical** | `database.sql` |
| S-5 | Gemini API key baked into client bundle via `process.env.API_KEY` | **High** | `vite.config.ts`, `geminiService.ts` |
| S-6 | Hardcoded teacher access code `'CMA2025'` in client source | **High** | `SignUp.tsx:104` |
| S-7 | `SUPABASE_SERVICE_KEY` in frontend `.env` | **High** | `.env` |
| S-8 | Invite code acceptance doesn't verify email match | **Medium** | `clusterService.ts` |
| S-9 | No input sanitization on AI prompts | **Medium** | `prompts.ts` |
| S-10 | Client-side exam scoring — trivially falsifiable | **Medium** | `examService.ts` |

### 5.2 Auth Assessment

- Sign-up/sign-in via Supabase Auth — solid foundation
- CORS fallback to `localAuthService` creates a parallel auth path
- `autoRefreshToken: false` without consistent manual refresh
- No rate limiting on auth attempts
- Email verification flow exists but not enforced

---

## 6. Performance Analysis

### 6.1 Build Performance

- Production build: **44.8 seconds** (acceptable for 14K LOC)
- Total bundle: **1.1 MB** uncompressed, **~260 KB** gzipped (good)
- Largest chunks: GenAI (259KB), Index (237KB), Supabase (170KB)

### 6.2 Code-Splitting Effectiveness

All 14 views are lazy-loaded via `React.lazy()` + `Suspense`. Initial load only requires:
- `index.js` (237KB) — app shell, services, types
- `vendor-react.js` (12KB)
- `vendor-supabase.js` (170KB)
- `index.css` (79KB)

**Total initial load: ~498KB uncompressed, ~135KB gzipped** — good for a feature-rich SPA.

`vendor-genai` (259KB) is only loaded when AIDeck/TeachersDeck is opened — correct.

### 6.3 Runtime Performance Concerns

| Concern | Location | Impact |
|---|---|---|
| Chat N+1 query bomb (2N+1 queries) | `chatService.getConversations` | Scales linearly with conversations |
| Cloud status polling every 4s (unused result) | `Layout.tsx` | Wasted network + CPU |
| `matchResults` recomputed every render | `TeachersLounge.tsx` | CPU waste on re-renders |
| Global notification subscription (all users' data) | `Layout.tsx` | Network + memory |
| Full Gemini message history sent per request | `AIDeck.tsx` | Token costs scale with conversation length |

---

## 7. Feature-by-Feature Technical Status

| Feature | Components | Services | Status | Critical Issues |
|---|---|---|---|---|
| **Auth** | Login, SignUp | fetsService, localAuth | Functional | No `<label>` elements, CORS fallback complexity |
| **Social Wall** | StudyWall | costudyService, clusterService | Partially functional | God component (970 LOC), silent errors, zero a11y on modals |
| **Study Rooms** | StudyRooms | costudyService, clusterService | **Mostly mock** | All 7 tabs use hardcoded data, timer broken, no mobile detail view |
| **AI Deck** | AIDeck | geminiService, prompts | Functional | No error handling on 3/5 tools, unbounded history, no cost awareness |
| **Teaching Deck** | TeachersDeck | geminiService, prompts | Functional | Best-designed view (8/10), missing try/catch on generate |
| **Mock Tests** | MockTests, ExamSession, ExamIntro | examService, fetsService | Functional | Answers in client, client-side scoring, inaccessible MCQ inputs |
| **Profile / CAN** | Profile | alignmentService, fetsService | **Broken** | Table/column mismatches → features silently fail |
| **Messages** | DirectMessages | chatService | Functional | N+1 query bomb, global subscription, no loading UI |
| **Library Vault** | LibraryVault | costudyService, costudyAPI | **Mock** | Ingestion is fake, library items hardcoded |
| **Mentor Dashboard** | MentorDashboard | costudyService | Partially functional | 3s artificial delay, fake revenue data, mock bounties |
| **Mentors** | TeachersLounge | costudyService, matchingService | Partially functional | Fake metrics, dead "Hire" button |
| **Student Store** | StudentStore | fetsService | **Non-functional** | Fake payment processor, hardcoded wallet |
| **Vouch System** | StudyWall | clusterService | Partially functional | Race conditions, vouch/reputation count drift |
| **Notifications** | Layout | costudyService | **Broken** | No user filter on subscription — leaks all users' data |

---

## 8. Component Quality Matrix

| Component | LOC | Design (1-10) | Error Handling | A11y | Mobile | Top Issue |
|---|---|---|---|---|---|---|
| Login.tsx | 179 | **9** | **Excellent** | Fair | Good | No `<label>` elements |
| SignUp.tsx | 317 | **9** | Good | Fair | Good | Hardcoded access code in client |
| TeachersDeck.tsx | 207 | **8** | Good | Fair | Fair | Missing try/catch on generate |
| DirectMessages.tsx | 500 | 7 | Poor | Poor | Good | Global subscription, N+1 queries |
| Landing.tsx | 259 | 7 | N/A | Fair | Good | Non-functional beta form |
| LibraryVault.tsx | 353 | 6 | Poor | Poor | Fair | No error handling on ingestion |
| ExamSession.tsx | 816 | 6 | Partial | **Broken** | Fair | Inaccessible MCQ inputs |
| ExamIntroPages.tsx | 673 | 6 | N/A | Fair | Fair | 674-line switch/case |
| Layout.tsx | 394 | 5 | Poor | Poor | Good | Notification data leak |
| MockTests.tsx | 474 | 5 | Poor | Fair | Fair | Unhandled fetch errors |
| Profile.tsx | 809 | 5 | Partial | Poor | Fair | 809-line monolith |
| MentorDashboard.tsx | 619 | 5 | Partial | Poor | Fair | 3s artificial delay |
| AIDeck.tsx | 526 | 5 | Poor | Poor | Fair | No error handling on 3/5 tools |
| TeachersLounge.tsx | 83 | 5 | Poor | Fair | Good | Dead "Hire" button |
| StudentStore.tsx | 68 | 5 | **None** | Fair | Poor | No payment error handling |
| StudyWall.tsx | 970 | 4 | Poor | **None** | Fair | God component, zero a11y |
| StudyRooms.tsx | 793 | 4 | None | Poor | **Broken** | All mock data, broken mobile |

---

*Full services-layer analysis with table-by-table schema review available in `costudy-services-audit.md`.*  
*UI/UX design system analysis available in `costudy-uiux-audit.md`.*  
*Prioritized action plan available in `costudy-action-plan.md`.*
