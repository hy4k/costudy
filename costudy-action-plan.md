## CoStudy Action Plan

Last updated: 2026-03-07  
Inputs: `costudy-uiux-audit.md`, `costudy-technical-audit.md`, codebase review, and automated checks.

---

## 1. Executive Summary & Overall Health

- **Overall health**: **78/100** – strong foundation (rich feature set, solid Supabase schema, thoughtful mission concepts) with gaps in:
  - Dark, cinematic, military/mission visual consistency.
  - Type safety and strictness.
  - RLS tightening and secrets hygiene.
  - Discoverability and cohesion for key features (vouch, alignments, AI decks, mock exams).
- This plan organizes work into a **priority matrix** across **Impact (High/Low)** and **Effort (High/Low)** and references underlying reports where details live.

### 1.1 Audit completion status (plan phases 0–8)

- **Delivered**: `costudy-uiux-audit.md`, `costudy-technical-audit.md`, and this action plan. Phases 0–5 and 7 are complete; Phase 6 automated checks are documented (Lighthouse/axe blocked in headless environment; complexity and npm audit run).
- **Done as follow-up**: Quick win **#1** – hard-coded Supabase anon key removed; `services/supabaseClient.ts` now requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `.env.example` added for frontend.
- **Run locally**: Lighthouse and axe-cli (see costudy-technical-audit.md §2.3); then continue with quick wins #2–5 and the themed initiatives.

---

## 2. Priority Matrix

### 2.1 High Impact / Low Effort (Do First – “Quick Wins”)

1. **Remove hard-coded Supabase anon key** ✅ *Done*
   - **Impact**: High (security posture, best practices).
   - **Effort**: Low.
   - **Action**:
     - Update `services/supabaseClient.ts` to require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with no fallback.
     - Document required env vars in `.env.example` (frontend) and in `costudy-technical-audit.md`.

2. **Standardize mission-style error and loading states**
   - **Impact**: High (UX polish, trust).
   - **Effort**: Low.
   - **Action**:
     - Replace ad-hoc `alert()` calls in views like `MentorDashboard`, `StudyWall`, `MockTests`, `StudyRooms` with a shared notification/toast component wired into `Layout`.
     - Use consistent copy patterns (“Neural Handshake Failed”, “Mission Briefing Lost – Retry”) and severity styling.

3. **Add minimal ARIA & modal semantics**
   - **Impact**: High (accessibility, usability).
   - **Effort**: Low–Medium.
   - **Action**:
     - Introduce a reusable `<Dialog>` wrapper with:
       - `role="dialog"`, `aria-modal="true"`, focus trapping, ESC/overlay close behavior.
     - Use it for: panic modal in `Layout`, RAG search overlay in `LibraryVault`, exam intro overlays, DM thread creation overlay.

4. **Surface vouch counts and trust cues in UI**
   - **Impact**: High (social trust, differentiation).
   - **Effort**: Low.
   - **Action**:
     - On StudyWall and TeachersLounge:
       - Show vouch counts (from `reputation.vouchesReceived`) and use distinctive chips (“Vouched by X peers”) near names.
       - Use FETS Yellow accent for trust badges.

5. **Lock down StudyRoom resources/messages RLS**
   - **Impact**: High (data privacy).
   - **Effort**: Low–Medium.
   - **Action**:
     - In Supabase SQL (in `database.sql` / migrations):
       - Replace `FOR ALL USING (true)` on `study_room_messages` and `study_room_resources` with policies requiring:
         - Membership (`study_room_members` row with `user_id = auth.uid()`), or
         - Room type `PUBLIC`.

### 2.2 High Impact / High Effort (Planned Projects)

6. **Global mission-style dark theme with FETS Yellow**
   - **Impact**: Very High (brand, UX coherence).
   - **Effort**: High.
   - **Action**:
     - Define a **global design token set** in `index.html`:
       - Backgrounds (`--color-mission-bg`, `--color-panel-bg`), foregrounds, FETS Yellow accent (`--color-fets-accent`).
     - Update `Layout` root to dark backgrounds and adjust nav/email shells accordingly.
     - Re-skin high-impact views (StudyRooms, AIDeck, MockTests, MentorDashboard, LibraryVault, DirectMessages, Profile) to reuse these tokens.

7. **Routing & deep-linking migration**
   - **Impact**: High (sharability, SEO readiness, analytics).
   - **Effort**: High.
   - **Action**:
     - Introduce React Router (or file-based Vite router) and:
       - Map `ViewState` to URL segments (e.g., `/wall`, `/rooms`, `/ai`, `/tests`, `/mentor`, `/profile`).
       - Keep `currentView` in sync with URL while maintaining backward compatibility.
     - Add route params for:
       - Specific StudyRooms, posts, DM conversations, and exam sessions.

8. **TS strictness initiative & large-view refactors**
   - **Impact**: High (reliability, maintainability).
   - **Effort**: High.
   - **Action**:
     - Add `@types/react` / `@types/react-dom`; enable `strict` and gradually fix errors.
     - Extract domain-specific hooks and subcomponents from:
       - `StudyWall`, `StudyRooms`, `MentorDashboard`, `MockTests`, `ExamSession`, `AIDeck`, `Profile`.
     - Introduce module boundaries: `views/`, `modules/`, `hooks/`, `ui/`.

9. **Full exam engine hardening**
   - **Impact**: High (core CMA value).
   - **Effort**: High.
   - **Action**:
     - Ensure all Supabase exam tables (`mcq_questions`, `essay_questions`, `exam_sessions`, `ai_question_cache`) are migrated in production.
     - Validate `get_hybrid_mcqs`, `fetchEssayQuestions`, `createExamSession`, `saveExamProgress`, `completeExamSession` RPCs against real data.
     - Add guardrails:
       - Timeout/retry logic in `examService`.
       - Robust resume/restore support in `ExamSession.tsx` when user refreshes mid-exam.

### 2.3 Low Impact / Low Effort (Fill-ins)

10. **Depcheck and npm audit hygiene**
    - **Impact**: Low–Medium.
    - **Effort**: Low.
    - **Action**:
      - Periodically run `depcheck` and `npm audit`.
      - Apply `npm audit fix` or update transitive deps (e.g., `minimatch`, `rollup`) on a regular cadence.

11. **Improve log & error observability**
    - **Impact**: Medium.
    - **Effort**: Low.
    - **Action**:
      - Standardize logging wrappers (e.g., `log.warn`, `log.error`) in services to annotate errors (feature, operation, userId).

### 2.4 Low Impact / High Effort (Defer Unless Needed)

12. **Backend normalization of analytics**
    - **Impact**: Medium.
    - **Effort**: High.
    - **Action**:
      - Move performance and reputation data from JSONB fields to relational tables for advanced analytics; defer until analytics requirements stabilize.

---

## 3. Themed Initiatives

### 3.1 “Mission Console” Visual Initiative

- **Goals**
  - Make the entire experience feel like a **CMA command center**.
  - Align all core views with a **dark, cinematic, FETS Yellow**-accented aesthetic.

- **Key steps**
  1. Add FETS Yellow tokens and re-skin:
     - Use FETS Yellow for:
       - Critical call-to-action buttons (Start Exam, Join Room, Confirm SOS).
       - Status beacons (RAG online, alignment active, mission in progress).
  2. Replace light shells:
     - `Layout` root, `MockTests` headers, StudyRooms wrappers, `StudentStore` header with dark backgrounds and mission typography.
  3. Unify shell patterns:
     - Use shared components for headers, stats bars, mission/radar panels across StudyWall, StudyRooms, MentorDashboard, LibraryVault.

### 3.2 “Alignment & Trust” Initiative

- **Goals**
  - Make CAN alignments and vouches visible, understandable, and rewarding.

- **Key steps**
  1. Elevate vouch system:
     - Show vouch badges and counts next to mentor and peer names.
     - Include vouch-related summary in Profile and StudyWall posts.
  2. Clarify CAN lifecycle:
     - Show simple, stepwise UI for “Request Alignment → Accept/Decline → Track Streak → Renew/Archive”.
  3. Connect trust signals to StudyRooms and DM:
     - Filter mentors and peers in Smart Match by signal level and vouches.

### 3.3 “Exam Mastery Engine” Initiative

- **Goals**
  - Deliver a stable, realistic, and data-backed mock exam experience.

- **Key steps**
  1. Productionize hybrid question strategy:
     - Verify `get_hybrid_mcqs` RPC and fallback queries.
     - Add logging on question fetch paths (real vs AI vs mock).
  2. Harden exam sessions:
     - Persist exam state reliably through `exam_sessions` and `saveExamProgress`.
     - Ensure auto-save and resume logic is robust under refresh/network glitches.
  3. Dashboard loops:
     - Surface exam performance telemetry into StudyWall and StudyRooms (e.g., mission suggestions) and MentorDashboard.

---

## 4. Specific Phase 7 Question Answers

### 4.1 Aesthetic & Dark Mode

- **Does the UI match the “military/mission-style” aesthetic?**
  - **Partially**. TeachersDeck, DirectMessages, LibraryVault, Profile CAN sections, and parts of MentorDashboard embody the mission style.
  - Landing, Layout shell, and some product screens (StudentStore, MockTests shell) still look like standard SaaS.

- **Is dark mode implementation consistent and accessible?**
  - Not yet. Several screens are fully dark; others are fully light. Dark mode is not implemented as a first-class theme toggle.
  - The plan above recommends making dark mission mode the default shell, with consistent tokens and accessibility adjustments.

### 4.2 CSS Regressions / Consistency and CLAUDE Spec

- **Are there CSS regressions or inconsistencies?**
  - There is no `CLAUDE.md` in this repo, so previous spec-driven constraints aren’t enforced.
  - Observed inconsistencies:
    - Mixed use of large magic values for radii and shadows.
    - Repeated ad-hoc text sizes (`text-[8px]`, `text-[9px]`) and letterspacing.
  - The action plan:
    - Extract a small set of CSS tokens for radii, shadows, text sizes, and spacing.
    - Optionally reintroduce a `CLAUDE.md` or `DESIGN_SYSTEM.md` to encode constraints.

### 4.3 Vouch System & Study Rooms

- **Is the Vouch system database implementation correct?**
  - Yes structurally:
    - `vouches` table with proper FKs and unique constraints.
    - RLS correctly restricts creation/removal to the voucher.
  - Improvements:
    - Combine vouch insert/delete and reputation increments into a single transactional RPC.

- **Is the `study_rooms` table properly structured?**
  - Yes for current needs:
    - Base `study_rooms` plus `cluster` enhancements (types, streaks, settings, relations to member/mission/wars).
  - Improvements:
    - Tighten RLS for `study_room_messages` and `study_room_resources` to enforce room-level privacy.

### 4.4 Real-time Features & Gemini Integration

- **Are real-time features (presence, chat) optimized?**
  - Chat and notifications use Supabase Realtime effectively, but:
    - Global conversations refresh on every insert; not optimal for large scales.
    - Presence is approximated, not fully live.
  - Plan calls for more fine-grained channels and true presence tracking.

- **Is Gemini AI integration secure and cost-efficient?**
  - Reasonable but improvable:
    - Integration goes through `geminiService`. Responses are rendered plainly, so injection risk is limited to text.
    - No explicit token budgeting, truncation, or caching yet.
  - Actions:
    - Add input validation and truncation for prompts.
    - Implement basic rate limiting and cost-aware mode labeling in UI (Global vs Library vs Active).

### 4.5 Performance, Dependencies, and DRYness

- **What’s the current Lighthouse performance score?**
  - Cannot be measured in this environment (no Chrome). Must be run from a local/CI environment.

- **Are there unused dependencies bloating the bundle?**
  - `depcheck` only flagged `typescript` as unused, which is a false-positive (TS used by Vite).
  - Vendor chunk sizes for Supabase and GenAI are large but expected.

- **Is the code DRY with proper component reuse?**
  - Partially:
    - There is a good separation between view components and service/data layer.
    - However, many view-level patterns (headers, cards, metrics, modals) are repeated across screens.
  - The action plan calls for:
    - Extracting shared shell components and mission panels.
    - Modularizing large views via hooks and smaller presentational components.

---

## 5. Next Steps

1. **Pick 3–5 Quick Wins**:
   - Supabase anon key removal, RLS tightening, mission-style error/toast system, and vouch surfacing.
2. **Select 1–2 High-Impact Projects for the next sprint**:
   - Recommended: “Mission Console” visual initiative and TS strictness/large-view refactors.
3. **Run Lighthouse & axe locally** and update `costudy-technical-audit.md` with concrete scores once Chrome/axe can be executed in a full environment.

