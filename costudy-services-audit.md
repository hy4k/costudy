# CoStudy Frontend Services Layer — Technical Audit

**Date**: 2026-03-08  
**Scope**: All 13 service files, `database.sql`, 6 migration files  
**Auditor**: Automated deep-read analysis

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Service-by-Service Analysis](#service-by-service-analysis)
3. [Database Schema Analysis](#database-schema-analysis)
4. [Migration Files Analysis](#migration-files-analysis)
5. [Cross-Cutting Concerns](#cross-cutting-concerns)
6. [Critical Findings Summary](#critical-findings-summary)

---

## Executive Summary

The CoStudy frontend contains **13 service files** totaling ~3,500 lines of service code across authentication, social features, study rooms, exams, AI chat, alignment networking, and payments. The database schema spans **~30 tables** across `database.sql` and 5 migration files (the 6th is a corrupted chat log).

### Severity Overview

| Severity | Count | Examples |
|----------|-------|---------|
| **CRITICAL** | 6 | API key in client bundle, `USING (true)` on mutable tables, corrupted migration file, chat N+1 query bomb |
| **HIGH** | 9 | Missing auth checks on RPCs, race conditions in vouch/streak, schema mismatch between service and DB |
| **MEDIUM** | 12 | Silent failures masking bugs, untyped `any` casts, mock data in production paths, duplicated exam logic |
| **LOW** | 8 | Dead code, hardcoded URLs, missing indexes, inconsistent naming |

---

## Service-by-Service Analysis

---

### 1. `fetsService.ts`

**A) Purpose**: Core authentication, user profiles, and exam question fetching. The "god service" — handles auth, profiles, mock tests, payments, telemetry, and exam questions in a single file.

**B) Lines of Code**: 555

**C) Supabase Usage**:
- **Tables**: `user_profiles` (SELECT, INSERT/UPSERT, UPDATE), `mcq_questions` (SELECT), `essay_questions` (SELECT), `exam_sessions` (SELECT, INSERT, UPDATE)
- **RPCs**: None

**D) Error Handling**: 
- Auth methods have try/catch with CORS fallback to `localAuthService` — good resilience pattern.
- `getUserProfile` silently returns `null` on errors — "self-healing" comment suggests this is intentional but masks real bugs.
- `createUserProfile` throws on upsert failure but callers in `signUp` swallow the error (`catch (e) { console.warn(...) }`).
- `saveExamProgress` returns `false` on failure instead of throwing — auto-save shouldn't crash exam (correct).
- `fetchExamQuestions` has full fallback chain: DB → sample questions → fallback on error (good).

**E) Type Safety**:
- `createUserProfile` takes `metadata: any` — no input validation.
- `updateUserProfile` builds `dbUpdates: any` — field mapping is manual and fragile.
- `getUserProfile` return type is `Promise<User | null>` — properly typed.
- Supabase responses are not generically typed (no `supabase.from<UserProfile>(...)` pattern).
- `syncStudyTelemetry` takes `data: any` — unused sink function.

**F) Security Concerns**:
- **CRITICAL**: `COSTUDY_CONFIG` exports `merchantId: 'MID_COSTUDY_2025'` — merchant ID exposed to client.
- `getCoStudyCloudStatus` returns fake data with random latency — dead/placeholder code shipped to production.
- `processUnifiedPayment` is a fake payment simulator (setTimeout → resolve) — if called in production, money goes nowhere.
- `fetchGlobalPerformance` returns hardcoded mock data — user gets fake rank/scores.

**G) Real-time Features**: None.

**H) Code Smells**:
- **God service**: Auth + Profiles + Exams + Payments + Telemetry in one file.
- **Duplicated exam logic**: `fetchExamQuestions` and `fetchEssayQuestions` here overlap with `examService.ts`.
- **Dead code**: `getCoStudyCloudStatus`, `processUnifiedPayment`, `fetchMockTestData`, `fetchGlobalPerformance`, `syncStudyTelemetry` are all mock/placeholder.
- **CORS fallback to localAuthService**: The fallback creates a parallel auth path that may diverge in behavior.
- Role normalization with `.toUpperCase()` on line 169 hides DB enum case mismatches instead of fixing them.

**I) Top 3 Issues**:
1. **Fake payment processor in production code** — `processUnifiedPayment` returns fake success.
2. **God service** — 555 lines mixing 5+ unrelated domains; splitting auth/profile/exam is essential.
3. **Duplicated exam question fetching** — both `fetsService` and `examService` fetch from `mcq_questions`/`essay_questions` with different logic.

---

### 2. `costudyService.ts`

**A) Purpose**: Social wall (posts, comments), study rooms, mentors, library, teacher dashboard (broadcasts, managed students), study sessions, and notifications.

**B) Lines of Code**: 384

**C) Supabase Usage**:
- **Tables**: `posts` (SELECT, INSERT), `comments` (SELECT, INSERT), `study_rooms` (SELECT), `user_profiles` (SELECT for mentors), `student_enrollments` (SELECT), `teacher_broadcasts` (SELECT, INSERT), `study_room_resources` (UPDATE, DELETE), `study_room_sessions` (SELECT, INSERT), `notifications` (SELECT, UPDATE)
- **RPCs**: None

**D) Error Handling**:
- Most methods use try/catch returning empty arrays `[]` or `null` — errors are logged but swallowed.
- `createPost` and `createComment` throw errors (no try/catch) — inconsistent with other methods.
- `createBroadcast` throws on error — same pattern.
- `notificationService.markAsRead` silently fails — user never knows their notification wasn't marked.

**E) Type Safety**:
- `getRooms` casts data to `(room: any)` — loses type safety.
- `getMentors` casts to `(profile: any)` — same issue.
- `getManagedStudents` casts enrollment data to `(e: any)`.
- `getBroadcasts` uses `(data as Broadcast[])` — unsafe cast without validation.
- `getPostDiscussion` returns `data as Comment[]` — trusts DB shape entirely.

**F) Security Concerns**:
- `getMentors` exposes `hourly_rate`, `costudy_status`, full `reputation` JSONB — potentially sensitive business data.
- `getManagedStudents` has a hardcoded fallback with mock student data (names, avatars) — demo data leaks into production.
- `deleteResource` has no ownership check — relies entirely on RLS, but `study_room_resources` has `USING (true)` for ALL operations (see DB analysis).
- `notificationService.markAllAsRead` uses only `user_id` filter — depends on RLS being correct.

**G) Real-time Features**: None (no Supabase channels/subscriptions despite study room chat being a natural fit).

**H) Code Smells**:
- `activeOnline: room.active_count || Math.floor(Math.random() * 20) + 5` — random fake online counts in production.
- `getMentors` invents data: `avgScoreJump: Math.floor(Math.random() * 15) + 5`, `passRate: 85 + Math.floor(Math.random() * 15)` — fake reputation metrics shown to paying students choosing mentors.
- `getLibraryItems` returns hardcoded array — no DB integration.
- `ingestToVault` is a fake `setTimeout` — pretends to ingest but does nothing.
- `getDefaultRooms()` returns 3 hardcoded rooms — used as fallback but may confuse users.

**I) Top 3 Issues**:
1. **Fake mentor metrics** — `avgScoreJump`, `passRate` are randomized; students pay real money based on fabricated stats.
2. **No real-time** — Study rooms have no live updates; users must manually refresh.
3. **Mock data in production paths** — `getLibraryItems`, `ingestToVault`, fallback managed students are all fakes.

---

### 3. `clusterService.ts`

**A) Purpose**: The largest service (1058 lines). Covers enhanced study rooms (Cluster Hubs), room membership, missions, MCQ War Room, whiteboards, group premium subscriptions, Faculty Hive (mentor sessions, split payments, escrow), vouch system, badges, and leaderboards.

**B) Lines of Code**: 1058

**C) Supabase Usage**:
- **Tables**: `study_rooms`, `study_room_members`, `study_room_missions`, `mcq_war_sessions`, `mcq_war_participants`, `whiteboard_sessions`, `group_subscriptions`, `group_invites`, `user_profiles`, `mentor_availability`, `mentor_sessions`, `session_payments`, `vouches`, `posts`, `badges`, `user_badges`, `room_leaderboard`
- **RPCs**: `increment_room_members`, `update_cluster_streak`, `increment_post_vouches`, `decrement_post_vouches`

**D) Error Handling**:
- Consistent try/catch pattern returning `null` or `false` on failure.
- Multi-step operations (e.g., `completePayment`) don't roll back on partial failure — if room creation succeeds but member insert fails, orphaned room exists.
- `acceptInvite` is especially fragile — 4 sequential DB operations with no transaction wrapper.

**E) Type Safety**:
- Generally well-typed with imports from `../types`.
- `updateWhiteboardCanvas` takes `canvasData: any`.
- `Partial<EnhancedStudyRoom>` used for `createRoom` — allows inserting incomplete rooms.

**F) Security Concerns**:
- **`acceptInvite` updates `costudy_status` on `user_profiles`** — sets `subscription: 'Pro'` directly from client. An attacker could call this with a forged invite code.
- `generateInviteCode` runs client-side — codes are predictable (8 chars from 31-char set = ~8.5 billion combinations, but no server-side validation beyond DB uniqueness).
- **`completePayment` creates rooms and adds members** — complex financial workflow executed client-side with no server-side orchestration.
- Split payments and escrow logic are entirely client-side — a compromised client can mark payments as `ESCROWED`/`RELEASED`.
- `completeSession` releases escrowed payments from the client — should be server-side only.

**G) Real-time Features**: None — MCQ War Room, whiteboards, and signal lights are all stateless DB reads with no subscriptions.

**H) Code Smells**:
- **God service #2** — 7 distinct service objects in one file (`clusterService`, `groupPremiumService`, `facultyHiveService`, `vouchService`, `badgeService`, `leaderboardService`, helper functions).
- `endWarSession` fetches all participants, computes average accuracy, then updates — race condition if called concurrently.
- `updateMissionProgress` does read-then-write (check target → update) — TOCTOU race condition.
- `getWeekStart()` at the bottom is a utility that belongs in a shared utils file.
- `acceptInvite` has no check that the invite email matches the accepting user's email.

**I) Top 3 Issues**:
1. **CRITICAL: Financial operations client-side** — Escrow release, payment recording, subscription upgrades all run in the browser. Must be server-side functions.
2. **No transactions** — Multi-step operations (payment → room creation → member add → status update) can partially fail leaving inconsistent state.
3. **Invite code bypass** — `acceptInvite` doesn't verify the invite email matches the user, and directly upgrades to Pro subscription.

---

### 4. `chatService.ts`

**A) Purpose**: 1-on-1 and group chat — conversations, messages, context threads, user search.

**B) Lines of Code**: 167

**C) Supabase Usage**:
- **Tables**: `chat_participants` (SELECT, INSERT), `chat_conversations` (SELECT, INSERT, UPDATE), `chat_messages` (SELECT, INSERT), `user_profiles` (SELECT)
- **RPCs**: None

**D) Error Handling**:
- `getConversations` returns `[]` on error — user sees empty chat, no indication of failure.
- `sendMessage` throws on error — caller must handle.
- `startContextThread` returns `null` on failure — no error details.

**E) Type Safety**:
- Line 51-53: `(c as any).context_type` — casts to `any` because the DB schema may not have these columns yet.
- Line 165: `(data as any[])` — searchUsers returns untyped array.
- Overall moderate type safety — ChatMessage and ChatConversation types are used.

**F) Security Concerns**:
- `searchUsers` uses `ilike('name', '%${query}%')` — **SQL injection risk** if Supabase client doesn't properly escape. (Supabase JS client does parameterize, so this is safe, but the pattern is concerning.)
- `startContextThread` stores context as JSON in the `name` field — a hack that bypasses schema. Anyone reading `name` gets raw JSON.

**G) Real-time Features**: **None** — this is a chat service with no real-time subscriptions. Users must poll or refresh to see new messages.

**H) Code Smells**:
- **N+1 query bomb** in `getConversations`: For each conversation, it makes 2 additional queries (participants + last message) inside `Promise.all(convos.map(...))`. With 50 conversations, that's 100+ queries.
- `startContextThread` stores JSON in `name` column — comment says "hacky persistence".
- Hydration fetches full `user_profiles(*)` for every participant in every conversation.

**I) Top 3 Issues**:
1. **CRITICAL: N+1 query explosion** — `getConversations` fires 2N+1 queries. With 50 conversations = 101 Supabase calls.
2. **No real-time** — Chat requires websocket subscriptions to function properly; currently poll-only.
3. **Hacky context storage** — JSON in `name` field will break if schema evolves.

---

### 5. `alignmentService.ts`

**A) Purpose**: CMA Alignment Network (CAN) — peer study partnerships, alignment requests, academic tracking (following/observers).

**B) Lines of Code**: 361

**C) Supabase Usage**:
- **Tables**: `alignments` (SELECT, INSERT, UPDATE), `alignment_requests` (SELECT, INSERT, UPDATE), `tracking_records` (SELECT, INSERT, UPDATE)
- **RPCs**: `increment_alignment_streak`, `accept_alignment_request`

**D) Error Handling**:
- Consistent try/catch → return empty array/null/false pattern.
- `acceptRequest` delegates to an RPC — good for atomicity.

**E) Type Safety**:
- Good use of typed enums: `AlignmentPurpose`, `AlignmentDuration`.
- `updateAlignmentStatus` uses `updates: any` for the intermediate object.
- Supabase FK relations used for joins (`peer:peer_id(...)`) — properly mapped.

**F) Security Concerns**:
- **Schema mismatch**: Service uses `user_id` column but DB table has `requester_id`. The `getMyAlignments` query `.eq('user_id', userId)` will fail or return nothing.
- `getTracking` and `getObservers` query `tracking_records` but DB table is named `user_tracking` — **table name mismatch**.
- `startTracking` also queries `tracking_records` — same mismatch.
- No rate limiting on alignment requests — a user could spam requests.

**G) Real-time Features**: None.

**H) Code Smells**:
- `getTracking` returns hardcoded zeros for `lastMockScore`, `essaysSubmitted`, `doubtsSolved` with comments saying "Would need to join with performance data" — shipped as incomplete.
- `renewAlignment` resets streak to 0 and start_date — but doesn't check if the alignment is actually expired.
- Column name mismatches suggest the service was written against a different schema version.

**I) Top 3 Issues**:
1. **CRITICAL: Table/column name mismatches** — `tracking_records` vs `user_tracking`, `user_id` vs `requester_id`. These queries silently return empty results.
2. **Incomplete tracking stats** — Hardcoded zeros for all tracking metrics defeat the feature's purpose.
3. **No request deduplication** — Users can send multiple alignment requests to the same peer.

---

### 6. `examService.ts`

**A) Purpose**: Full mock exam system — hybrid 70/30 question strategy (real + AI-generated), exam session lifecycle, MCQ scoring, essay section gating.

**B) Lines of Code**: 683

**C) Supabase Usage**:
- **Tables**: `mcq_questions` (SELECT), `ai_question_cache` (SELECT), `essay_questions` (SELECT), `exam_sessions` (SELECT, INSERT, UPDATE)
- **RPCs**: `get_hybrid_mcqs`

**D) Error Handling**:
- Robust fallback chain: RPC → direct query → mock data generation.
- `createExamSession` falls back to `createLocalSession` on DB failure — user can still take exam offline.
- `completeMCQSection` and `completeEssaySection` log errors but don't prevent score calculation — results are computed locally even if DB save fails.

**E) Type Safety**:
- **Best typed service in the codebase** — exports proper interfaces: `MCQQuestion`, `EssayQuestion`, `ExamSession`, `ExamConfig`.
- RPC results cast via `(q: any)` → manual mapping.
- `question_data as any` for AI cache questions.

**F) Security Concerns**:
- `correct_answer` is included in the MCQ questions sent to the client (in `createExamSession`, the session stores `mcq_questions: mcqs.map(q => ({ id: q.id, correct_answer: q.correct_answer }))`) — **answers stored in client-accessible session data**.
- `EXAM_CONFIGS` is client-side — users can modify test parameters.
- Score calculation is entirely client-side — a user can submit fabricated scores.

**G) Real-time Features**: None.

**H) Code Smells**:
- **Duplicates `fetsService.ts`**: Both files export `fetchExamQuestions`, `fetchEssayQuestions`, `saveExamProgress`.
- `generateMockMCQ` always generates the same question text — useless for actual practice.
- `createLocalSession` generates `id: 'local-${Date.now()}'` — not a UUID, will conflict if later synced to DB.

**I) Top 3 Issues**:
1. **CRITICAL: Correct answers sent to client** — `correct_answer` stored in session data visible to browser DevTools.
2. **Client-side scoring** — Score is computed in browser and sent to DB; trivially falsifiable.
3. **Duplicated exam logic** — Two services (`fetsService` and `examService`) fetch and manage exam data independently.

---

### 7. `matchingService.ts`

**A) Purpose**: Client-side matching algorithms for mentor recommendation and study room suggestions based on student profile.

**B) Lines of Code**: 76

**C) Supabase Usage**: **None** — pure client-side computation.

**D) Error Handling**:
- Defensive checks for empty performance data (returns empty results).
- No try/catch needed (no async operations).

**E) Type Safety**:
- Well-typed with generic `MatchResult<T>` interface.
- Properly uses `User`, `Mentor`, `StudyRoom` types.

**F) Security Concerns**: None — no DB access, no sensitive data handling.

**G) Real-time Features**: None (not applicable).

**H) Code Smells**:
- Hardcoded matching weights (40, 30, 20, 10) should be configurable.
- `student.budget` is referenced but doesn't exist on the `User` type — will always be `undefined`.
- `matchRoomsForStudent` checks for 'evening' in room name — fragile string matching.
- Scoring is simplistic — doesn't account for mentor availability, past session ratings, or completion rates.

**I) Top 3 Issues**:
1. `student.budget` doesn't exist on User type — budget matching never works.
2. Hardcoded scoring weights are not tunable.
3. Simplistic matching that doesn't use historical data.

---

### 8. `geminiService.ts`

**A) Purpose**: AI chat integration — Gemini API for CMA tutoring, essay evaluation, and teaching resources. Includes RAG (vector search) integration with `api.costudy.in`.

**B) Lines of Code**: 283

**C) Supabase Usage**: **None** — uses external APIs (Gemini, api.costudy.in).

**D) Error Handling**:
- Multi-layer fallback: Backend API → Gemini → hardcoded error message.
- `askCMAExpert` returns `null as any` on failure — **type lie** that will cause downstream `Cannot read property` errors.
- `evaluateEssay` tries backend first, falls back to Gemini — good pattern.

**E) Type Safety**:
- `ChunkType` union type is defined but only used in one place.
- `history` parameter typed as `{ role: string, content: string }[]` — `role` should be a union type.
- RAG response parsed with `(r: any)` — no validation.

**F) Security Concerns**:
- **CRITICAL**: `const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })` — In a Vite frontend, `process.env.API_KEY` won't work (Vite uses `import.meta.env.VITE_*`). If this somehow resolves, the API key is in the client bundle.
- `COSTUDY_API_URL = 'https://api.costudy.in'` — hardcoded production URL, no staging/dev toggle.
- No auth headers sent to `api.costudy.in` endpoints — anyone can call the RAG API.
- No rate limiting on AI calls — a user could spam the Gemini API.

**G) Real-time Features**: None.

**H) Code Smells**:
- `performBackendVectorSearch` returns poetic error strings ("Databank connection jitter. Relying on master expertise.") — not useful for debugging.
- `getChatResponse` has query expansion logic that concatenates user messages — can produce malformed search queries.
- Model names `gemini-3-pro-preview` and `gemini-3-flash-preview` are hardcoded — should be configurable.

**I) Top 3 Issues**:
1. **CRITICAL: API key exposure** — `process.env.API_KEY` in client-side code. Either it's broken (likely) or it's exposing the key.
2. **`null as any` return** — `askCMAExpert` silently returns a type-unsafe null on failure.
3. **No authentication on RAG API calls** — public access to `api.costudy.in/api/search`, `/api/ask-cma`, etc.

---

### 9. `prompts.ts`

**A) Purpose**: System prompts and instruction generators for the Gemini-based CMA tutor AI (student mode, essay evaluation mode, teacher mode).

**B) Lines of Code**: 167

**C) Supabase Usage**: **None** — pure string templates.

**D) Error Handling**: N/A — no async operations.

**E) Type Safety**: All functions return `string`. Parameters are `string | undefined`. Acceptable.

**F) Security Concerns**:
- System prompts are in the client bundle — users can read the AI's exact instructions and craft adversarial inputs.
- No input sanitization in template interpolation — `${subject}`, `${additionalContext}`, `${retrievedContext}` could be used for prompt injection.

**G) Real-time Features**: None.

**H) Code Smells**:
- Very long template literals (CMA_SUPER_TUTOR_PROMPT is ~65 lines) — should be loaded from config/CMS.
- Prompts claim "100% accuracy" and "Never hallucinate facts" — impossible guarantees that set wrong expectations.

**I) Top 3 Issues**:
1. **Prompt injection risk** — user input interpolated directly into system instructions.
2. **Prompts in client bundle** — full AI personality and instructions visible to end users.
3. **Over-promising** — "100% accuracy" claim in system prompt.

---

### 10. `costudyAPI.ts`

**A) Purpose**: HTTP client for the CoStudy backend RAG API at `api.costudy.in` — search, ask, summarize, health check.

**B) Lines of Code**: 143

**C) Supabase Usage**: **None** — pure REST client.

**D) Error Handling**:
- All methods return typed error objects `{ ok: false, error: String(e) }` — good pattern.
- No retry logic for transient failures.
- `response.json()` called without checking `response.ok` in `ragSearch` and `askCMA` — may throw on non-JSON error responses.

**E) Type Safety**:
- Well-typed with `SearchHit`, `SearchResponse`, `AskResponse`, `SummarizeResponse` interfaces.
- API_BASE uses `import.meta.env` correctly (unlike `geminiService`).

**F) Security Concerns**:
- No authentication headers — API is publicly accessible.
- `API_BASE` fallback is production URL — dev environment hits production API.

**G) Real-time Features**: None.

**H) Code Smells**:
- **Overlaps with `geminiService.ts`** — both files call `api.costudy.in/api/search`, `api.costudy.in/api/ask-cma`, and `api.costudy.in/api/summarize`. Duplicated HTTP logic.
- Default thresholds differ: `costudyAPI.ragSearch` uses `threshold: 0.75`, `geminiService.performBackendVectorSearch` uses `threshold: 0.5`.

**I) Top 3 Issues**:
1. **Duplicated with geminiService** — same API endpoints called from two different files with different configs.
2. **No auth on API calls** — public access to backend.
3. **Missing `response.ok` check** before calling `response.json()`.

---

### 11. `inviteService.ts`

**A) Purpose**: Invite code system — validate, use, create invite codes, share via clipboard/Web Share API.

**B) Lines of Code**: 157

**C) Supabase Usage**:
- **Tables**: None directly
- **RPCs**: `validate_invite_code`, `use_invite_code`, `get_invite_stats`, `create_user_invite_code`

**D) Error Handling**:
- Delegates to RPCs which handle validation — good separation.
- `getMyInviteStats` returns `null` if no user session — appropriate.
- RPC errors logged and returned as typed result objects.

**E) Type Safety**:
- Well-typed with `InviteStats`, `ValidateResult`, `UseCodeResult` interfaces.
- RPC returns cast with `as ValidateResult` — trusts server shape.

**F) Security Concerns**:
- `getMyInviteStats` and `createMyInviteCode` call `supabase.auth.getUser()` — properly checks auth.
- `validateInviteCode` is called pre-signup (unauthenticated) — the RPC is `SECURITY DEFINER` which is correct for this use case.
- `getInviteLink` uses `window.location.origin` — safe for link generation.

**G) Real-time Features**: None.

**H) Code Smells**:
- `shareInvite` hardcodes emoji in share text — minor.
- No debouncing on `validateInviteCode` — could be called on every keystroke.

**I) Top 3 Issues**:
1. No client-side debouncing on code validation.
2. RPC result types trusted without runtime validation.
3. No error feedback if Web Share API fails silently.

---

### 12. `localAuthService.ts`

**A) Purpose**: Fallback authentication proxy through `api.costudy.in/auth/*` — used when Supabase CORS blocks direct auth calls.

**B) Lines of Code**: 161

**C) Supabase Usage**: **None** — uses custom REST API.

**D) Error Handling**:
- Proper error parsing from API responses.
- `refreshSession` clears localStorage on failure — prevents stale session loops.
- `signOut` has nested try/catch for API call — clearing localStorage always succeeds.

**E) Type Safety**:
- `SessionData` and `SignUpData` interfaces defined.
- `signUp` takes `userData?: any` — untyped metadata passthrough.

**F) Security Concerns**:
- **Stores session in `localStorage`** including `access_token` and `refresh_token` — vulnerable to XSS attacks.
- **No CSRF protection** on auth endpoints.
- Hardcoded `https://api.costudy.in` — no environment switching.
- `signOut` doesn't send the current session token — server can't invalidate the specific session.
- Session expiry check uses `Date.now() < sessionData.expires_at * 1000` — assumes `expires_at` is Unix seconds, fragile.

**G) Real-time Features**: None.

**H) Code Smells**:
- Parallel auth system with `fetsService.ts` — two auth paths create maintenance burden.
- No token refresh on 401 responses — only checks expiry proactively.

**I) Top 3 Issues**:
1. **Tokens in localStorage** — XSS vulnerability for auth tokens.
2. **Parallel auth system** — Two different auth flows (Supabase direct + API proxy) can drift.
3. **No session invalidation on signout** — server can't kill the session.

---

### 13. `supabaseClient.ts`

**A) Purpose**: Supabase client initialization with environment variable configuration.

**B) Lines of Code**: 31

**C) Supabase Usage**: Creates the client instance used by all other services.

**D) Error Handling**:
- Dev mode: warns on missing config.
- Production: throws on missing config — correct.
- Falls back to `'https://placeholder.supabase.co'` in dev — will make requests to a non-existent server.

**E) Type Safety**: Uses `import.meta.env` which is `string | undefined` — appropriately handled.

**F) Security Concerns**:
- `autoRefreshToken: false` — **tokens will expire and not be refreshed automatically**. Combined with `fetsService.getSession`'s stale token handling, this creates auth reliability issues.
- `persistSession: true` — sessions stored in localStorage (Supabase default).
- The `placeholder-anon-key` fallback is a non-functional placeholder — requests will fail with 401.

**G) Real-time Features**: Client is capable of realtime but no service uses it.

**H) Code Smells**:
- Placeholder URL/key fallback masks configuration errors in dev.

**I) Top 3 Issues**:
1. **`autoRefreshToken: false`** — manual token refresh is handled inconsistently across services.
2. Placeholder fallbacks hide missing configuration.
3. No database type generation (`supabase gen types`) — all queries untyped.

---

## Database Schema Analysis

### Tables Found (across `database.sql` + migrations)

| # | Table | Source | RLS Enabled | Notes |
|---|-------|--------|-------------|-------|
| 1 | `user_profiles` | database.sql | Yes | Core identity table |
| 2 | `posts` | database.sql | Yes | Social wall |
| 3 | `comments` | database.sql | Yes | Threaded replies |
| 4 | `chat_conversations` | database.sql | Yes | DM/group chats |
| 5 | `chat_participants` | database.sql | Yes | M:N chat membership |
| 6 | `chat_messages` | database.sql | Yes | Message content |
| 7 | `alignments` | database.sql | Yes | Peer study contracts |
| 8 | `user_tracking` | database.sql | Yes | Academic radar |
| 9 | `teacher_broadcasts` | database.sql | Yes | Teacher announcements |
| 10 | `student_enrollments` | database.sql | Yes | Teacher-student link |
| 11 | `study_rooms` | database.sql | **NO** | Missing RLS! |
| 12 | `study_room_messages` | database.sql | Yes | Room chat |
| 13 | `study_room_resources` | database.sql | Yes | Shared files |
| 14 | `study_room_notebooks` | database.sql | **NO** | Missing RLS! |
| 15 | `notifications` | database.sql | Yes | User notifications |
| 16 | `vault_vectors` | database.sql | Yes | RAG embeddings |
| 17 | `invite_codes` | 002_invite | Yes | Invite system |
| 18 | `invite_uses` | 002_invite | Yes | Invite tracking |
| 19 | `vouches` | 002_cluster | Yes | Post endorsements |
| 20 | `post_summaries` | 002_cluster | Yes | AI summaries |
| 21 | `study_room_members` | 002_cluster | Yes | Room membership |
| 22 | `study_room_missions` | 002_cluster | Yes | Room goals |
| 23 | `mcq_war_sessions` | 002_cluster | Yes | MCQ battles |
| 24 | `mcq_war_participants` | 002_cluster | Yes | Battle participants |
| 25 | `whiteboard_sessions` | 002_cluster | Yes | Shared whiteboards |
| 26 | `group_subscriptions` | 002_cluster | Yes | Group premium |
| 27 | `group_invites` | 002_cluster | Yes | Group invite codes |
| 28 | `mentor_availability` | 002_cluster | Yes | Mentor status |
| 29 | `mentor_sessions` | 002_cluster | Yes | Mentor bookings |
| 30 | `session_payments` | 002_cluster | Yes | Split-fee escrow |
| 31 | `wallet_transactions` | 002_cluster | Yes | Credits ledger |
| 32 | `badges` | 002_cluster | Yes | Achievement defs |
| 33 | `user_badges` | 002_cluster | Yes | Earned achievements |
| 34 | `room_leaderboard` | 002_cluster | Yes | Weekly rankings |
| 35 | `mcq_questions` | 003_exam (x3) | Yes | Real MCQs |
| 36 | `essay_questions` | 003_exam (x3) | Yes | Essay prompts |
| 37 | `ai_question_cache` | 003_exam | Yes | AI-generated Qs |
| 38 | `exam_sessions` | 003_exam (x3) | Yes | Test sessions |
| 39 | `exam_session_snapshots` | 003_exam | Yes | Auto-save |
| 40 | `question_generation_jobs` | 003_exam | No RLS specified | Job queue |

### Overly Permissive RLS Policies (`USING (true)`)

| Table | Policy | Risk |
|-------|--------|------|
| `user_profiles` | SELECT `USING (true)` | **Medium** — All profile data publicly readable (including `costudy_status`, `performance` JSONB) |
| `posts` | SELECT `USING (true)` | Low — Posts are intentionally public |
| `comments` | SELECT `USING (true)` | Low — Comments are intentionally public |
| `study_room_messages` | ALL `USING (true)` | **CRITICAL** — Anyone can INSERT/UPDATE/DELETE any room message |
| `study_room_resources` | ALL `USING (true)` | **CRITICAL** — Anyone can INSERT/UPDATE/DELETE any resource |
| `chat_conversations` | INSERT `WITH CHECK (true)` | **HIGH** — Anyone can create conversations |
| `notifications` | INSERT `WITH CHECK (true)` | **HIGH** — Anyone can insert notifications for any user |
| `invite_codes` | SELECT `USING (true)` + INSERT `WITH CHECK (true)` | **HIGH** — Conflicting policies (own codes only + anyone can see all + anyone can insert) |
| `invite_uses` | INSERT `WITH CHECK (true)` | **Medium** — Anyone can record invite usage |
| `teacher_broadcasts` | SELECT `USING (true)` | Low — Broadcasts are intentionally public |
| `vault_vectors` | SELECT `USING (true)` | Low — Embeddings alone aren't sensitive |
| `post_summaries` | SELECT `USING (true)` | Low — Summaries are public |
| `badges` | SELECT `USING (true)` | Low — Badge definitions are public |
| `user_badges` | SELECT `USING (true) OR true` | Low — Public badge display (redundant OR) |
| `room_leaderboard` | SELECT `USING (true)` | Low — Leaderboard is public |
| `mcq_questions` | SELECT `USING (true)` | **Medium** — All questions (including correct answers) readable by any authenticated user |
| `mentor_availability` | SELECT `USING (true)` | Low — Availability is public |

### Functions/RPCs Defined

| Function | File | SECURITY DEFINER? | Notes |
|----------|------|-------------------|-------|
| `generate_invite_code()` | 002_invite | No | Random code generator |
| `create_user_invite_code(UUID)` | 002_invite | **Yes** | Auto-creates invite code |
| `validate_invite_code(TEXT)` | 002_invite | **Yes** | Validates code |
| `use_invite_code(TEXT, UUID)` | 002_invite | **Yes** | Uses code with `FOR UPDATE` lock |
| `get_invite_stats(UUID)` | 002_invite | **Yes** | Gets invite usage stats |
| `auto_create_invite_code()` | 002_invite | **Yes** | Trigger function |
| `calculate_group_discount(INT)` | 002_cluster | No | Pure calculation |
| `increment_room_members(UUID)` | 002_cluster | No | Counter update |
| `decrement_room_members(UUID)` | 002_cluster | No | Counter update |
| `increment_post_vouches(UUID)` | 002_cluster | No | Vouch + reputation update |
| `decrement_post_vouches(UUID)` | 002_cluster | No | Vouch + reputation update |
| `update_cluster_streak(UUID)` | 002_cluster | No | Streak logic |
| `reset_daily_contributions()` | 002_cluster | No | Cron job target |
| `get_hybrid_mcqs(INT, DECIMAL, TEXT)` | 003_exam | No | Hybrid question fetch |
| `get_essay_questions(INT, TEXT)` | 003_exam | No | Random essay fetch |
| `calculate_mcq_score(UUID)` | 003_exam | No | Score calculation |
| `get_random_essays(INT, exam_part)` | 003_essay | No | Random essay fetch |
| `get_random_mcqs(INT, exam_part)` | 003_essay | No | Random MCQ fetch |

### Missing Indexes on High-Traffic Columns

| Table | Column(s) | Why Needed |
|-------|-----------|------------|
| `user_profiles` | `handle` | Looked up for profile URLs / mentions |
| `user_profiles` | `role` | Filtered for mentor listings |
| `posts` | `author_id` | FK joins on every post fetch |
| `posts` | `type` | Filtered by category in feed |
| `posts` | `created_at` | ORDER BY on every feed load |
| `comments` | `post_id` | JOIN for every post discussion |
| `chat_messages` | `conversation_id` | JOIN on every message fetch |
| `chat_messages` | `created_at` | ORDER BY on every message list |
| `chat_participants` | `user_id` | Filtered to find user's conversations |
| `alignments` | `user_id`/`requester_id` | Filtered for user's alignments |
| `notifications` | `user_id` | Filtered on every page load |
| `study_rooms` | `room_type` | Filtered by type |
| `exam_sessions` | `user_id, status` | Compound index for finding active sessions |

### Foreign Key Relationships

```
auth.users ──1:1──> user_profiles
user_profiles ──1:N──> posts (author_id)
user_profiles ──1:N──> comments (author_id)
user_profiles ──1:N──> chat_participants
user_profiles ──M:N──> chat_conversations (via chat_participants)
user_profiles ──1:N──> alignments (requester_id, peer_id)
user_profiles ──M:N──> user_tracking (tracker_id, target_id)
user_profiles ──1:N──> teacher_broadcasts (teacher_id)
user_profiles ──M:N──> student_enrollments (student_id, teacher_id)
user_profiles ──1:N──> notifications (user_id)
user_profiles ──1:N──> invite_codes (owner_id)
user_profiles ──1:N──> study_room_members (user_id)
user_profiles ──1:N──> mentor_availability (mentor_id)
user_profiles ──1:N──> mentor_sessions (mentor_id, requested_by)
user_profiles ──1:N──> session_payments (user_id)
user_profiles ──1:N──> wallet_transactions (user_id)
user_profiles ──1:N──> user_badges (user_id)
user_profiles ──1:N──> vouches (voucher_id)

posts ──1:N──> comments (post_id)
posts ──1:N──> vouches (post_id)
posts ──1:1──> post_summaries (post_id)
comments ──1:N──> comments (parent_id, self-referencing)

study_rooms ──1:N──> study_room_members (room_id)
study_rooms ──1:N──> study_room_missions (room_id)
study_rooms ──1:N──> study_room_messages (room_id)
study_rooms ──1:N──> study_room_resources (room_id*)  -- FK not enforced
study_rooms ──1:1──> study_room_notebooks (room_id)
study_rooms ──1:N──> mcq_war_sessions (room_id)
study_rooms ──1:N──> whiteboard_sessions (room_id)
study_rooms ──1:N──> mentor_sessions (room_id)

group_subscriptions ──1:N──> group_invites (group_subscription_id)
group_subscriptions ──1:1──> study_rooms (study_room_id)

mentor_sessions ──1:N──> session_payments (session_id)
mcq_war_sessions ──1:N──> mcq_war_participants (session_id)
exam_sessions ──1:N──> exam_session_snapshots (session_id)
```

### Vouch System Schema

**Tables**: `vouches` (002_cluster)  
**Structure**: `voucher_id`, `post_id`, `comment_id`, `created_at` with `UNIQUE(voucher_id, post_id)` and `UNIQUE(voucher_id, comment_id)`.

**RPCs**: `increment_post_vouches(UUID)`, `decrement_post_vouches(UUID)` — these update both `posts.likes` and `user_profiles.reputation.vouchesReceived`.

**Race Conditions**:
- **Vouch count race**: `increment_post_vouches` does `likes = likes + 1` which is atomic within a single UPDATE, but the vouch INSERT and the RPC call in `vouchService.vouchPost` are two separate operations. If the vouch INSERT succeeds but the RPC fails, the vouch exists without incrementing the count. **No transaction wrapping.**
- **Double-vouch prevention**: The `UNIQUE(voucher_id, post_id)` constraint prevents duplicate vouches at the DB level — this is good. But the service doesn't handle the unique violation error gracefully.
- **Reputation update race**: The RPC updates `user_profiles.reputation` JSONB using `jsonb_set` — concurrent vouches on different posts by the same author could overwrite each other's reputation increments.

### Study Rooms Structure

**Main table**: `study_rooms` in `database.sql` — basic schema (name, category, description, counts, color).  
**Enhanced** in `002_cluster`: Added `creator_id`, `room_type` (PUBLIC/PRIVATE/GROUP_PREMIUM), `group_subscription_id`, `settings` JSONB, `cluster_streak`, `last_streak_update`, `created_at`.  
**Missing**: `study_rooms` has **no RLS policies** in `database.sql` — only the enhanced columns are added in migration but RLS is never enabled on the base table.  
**Child tables**: `study_room_members`, `study_room_missions`, `study_room_messages`, `study_room_resources`, `study_room_notebooks`.  
**Concern**: `study_room_resources` has `room_id UUID` without explicit FK constraint — comment says "Explicit FK if table exists".

### Alignment System Schema

**Tables**: `alignments` (purpose, duration, goal, status, streak, restrictions, paused_until), `alignment_requests` (referenced in service but **not in any SQL file**).

**Missing**: The `alignment_requests` table is used by `alignmentService.ts` but is **not defined in `database.sql` or any migration**. The `tracking_records` table is also missing — the DB defines `user_tracking` instead.

**Service-DB Column Mismatch**:
| Service Column | DB Column |
|---------------|-----------|
| `user_id` | `requester_id` |
| `start_date` | `start_date` (matches) |
| `updated_at` | Not in DDL |

---

## Migration Files Analysis

| File | Purpose | Status |
|------|---------|--------|
| `002_invite_codes.sql` | Invite code tables, RPCs, trigger | **Clean** — well-structured with `FOR UPDATE` race condition protection |
| `002_cluster_features.sql` | Vouches, enhanced rooms, group premium, faculty hive, badges, leaderboards | **Clean but large** — 501 lines covering 15+ tables |
| `003_essay_questions.sql` | Essay/MCQ tables with `exam_part` enum, exam sessions | **Conflicts with 003_mock_exam_system.sql** — different schemas for same tables |
| `003_mock_exam_system.sql` | MCQ/Essay/AI cache tables, hybrid RPC, seed data | **Conflicts with 003_essay_questions.sql** — different column names, UUID vs TEXT PKs |
| `003_mock_exam_system_v2.sql` | Simplified version of 003 without `section` column, safe for existing schemas | **Third conflicting version** — creates tables without `section` NOT NULL |
| `003_mock_exam_safe.sql` | **NOT SQL** — 2680-line OpenClaw chat log dump | **CRITICAL: Corrupted file** — should be deleted |

**Migration Conflicts Detail**:
- `essay_questions` has **3 different schemas** across migrations:
  - `003_essay_questions.sql`: PK is `TEXT`, has `scenario`/`tasks` columns, uses `exam_part` enum
  - `003_mock_exam_system.sql`: PK is `UUID`, has `scenario_text`/`requirements` columns, `section NOT NULL`
  - `003_mock_exam_system_v2.sql`: PK is `UUID`, no `section` column
- `exam_sessions` has **2 different schemas**:
  - `003_essay_questions.sql`: Simple (test_id, answers, current_index, time_remaining)
  - `003_mock_exam_system.sql`: Complex (test_type, mcq_questions, essay_questions, hybrid tracking)
- Running any two of these migrations will cause conflicts or silent column mismatches.

---

## Cross-Cutting Concerns

### 1. No Supabase Type Generation
Zero services use generated database types. Every query result is cast with `as Type` or accessed via `(data: any)`. A single `supabase gen types typescript` would eliminate an entire class of runtime errors.

### 2. No Real-Time Anywhere
Despite Supabase having excellent realtime support, **zero services use channels or subscriptions**. Features that desperately need it:
- Chat messages (currently requires manual refresh)
- Study room signal lights
- MCQ War Room live scoring
- Whiteboard collaboration
- Notification delivery

### 3. Client-Side Financial Operations
Payment processing, escrow management, subscription upgrades, and split-fee calculations all run in the browser. These should be Supabase Edge Functions or backend API endpoints.

### 4. Inconsistent Error Handling
Three patterns coexist:
1. Return `null`/`false`/`[]` (most services) — errors silently swallowed
2. Throw errors (createPost, createComment, sendMessage) — caller must handle
3. Return typed error objects (inviteService, costudyAPI) — best pattern

### 5. Hardcoded Mock/Fake Data in Production Paths
- `fetsService`: Fake payment processor, fake global performance, fake cloud status
- `costudyService`: Random mentor metrics, hardcoded library items, mock managed students
- `alignmentService`: Hardcoded zero tracking stats

---

## Critical Findings Summary

### P0 — Must Fix Immediately

| # | Finding | Service | Impact |
|---|---------|---------|--------|
| 1 | `study_room_messages` and `study_room_resources` have `USING (true)` for ALL operations | database.sql | Any authenticated user can delete/modify any room message or resource |
| 2 | `notifications` INSERT allows anyone to create notifications for any user | database.sql | Spam/phishing notifications |
| 3 | Financial operations (escrow, payments, subscription upgrades) run client-side | clusterService | Trivially exploitable — users can grant themselves Pro subscriptions |
| 4 | Correct answers sent to client in exam session data | examService | Exam integrity compromised — answers visible in DevTools |
| 5 | `003_mock_exam_safe.sql` is a 2680-line chat log, not SQL | migrations/ | Will fail catastrophically if run against DB |
| 6 | Gemini API key potentially in client bundle | geminiService | API key exposure / billing abuse |

### P1 — Fix Soon

| # | Finding | Service | Impact |
|---|---------|---------|--------|
| 7 | Chat N+1 query explosion (2N+1 queries per page load) | chatService | Performance degradation at scale |
| 8 | Table/column name mismatches (tracking_records vs user_tracking, user_id vs requester_id) | alignmentService | Features silently broken |
| 9 | 3 conflicting migration files for exam system | migrations/ | Cannot reliably reproduce DB schema |
| 10 | No real-time subscriptions for chat, rooms, or war room | All services | Poor UX — requires manual refresh |
| 11 | `autoRefreshToken: false` with inconsistent manual refresh | supabaseClient | Users randomly logged out |
| 12 | Invite code acceptance doesn't verify email match | clusterService | Anyone with a code can upgrade to Pro |
| 13 | Fake mentor metrics (random passRate, avgScoreJump) | costudyService | Students choose mentors based on fabricated data |
| 14 | `alignment_requests` table not in any migration/DDL | alignmentService | Feature depends on manually-created table |
| 15 | Vouch race condition on concurrent vouches | clusterService + DB | Reputation counts can drift |

### P2 — Plan to Fix

| # | Finding | Impact |
|---|---------|--------|
| 16 | No Supabase type generation — all queries untyped | Runtime type errors |
| 17 | God services (fetsService: 555 LOC, clusterService: 1058 LOC) | Maintenance burden |
| 18 | Duplicated exam logic across fetsService and examService | Divergent behavior |
| 19 | Duplicated RAG API calls across geminiService and costudyAPI | Inconsistent thresholds |
| 20 | Missing indexes on 13+ high-traffic columns | Query performance |
| 21 | `study_rooms` base table has no RLS | Data exposure |
| 22 | No input validation/sanitization on AI prompts | Prompt injection |
| 23 | Mock/fake data in production code paths | User trust |
| 24 | `student.budget` referenced but doesn't exist on User type | Dead matching logic |
| 25 | `null as any` return in askCMAExpert | Runtime crashes |
