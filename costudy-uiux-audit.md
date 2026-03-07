## CoStudy UI/UX Audit Report

Last updated: 2026-03-07  
Scope: `costudy-frontend` (Vite + React 19 + Tailwind CDN), with emphasis on CMA US flows.

---

## 1. Executive Summary

- **Overall UI/UX health**: **72/100** – strong conceptual direction (mission-style language, exam focus, AI tooling) with inconsistent visual hierarchy, mixed light/dark usage, and missing systematic design tokens.
- **Brand alignment**: The app leans toward **“premium exam product”** but not yet the requested **dark, cinematic, military/mission console**. Most core screens are light (`bg-slate-50`/`bg-white`) with branded red/emerald accents, and FETS Yellow (`#FFD633`) is **not used anywhere**.
- **System quality**: Individual screens (Study Rooms, Mock Tests, Library Vault, Direct Messages, AI Decks, Mentor Dashboard) are **ambitious and visually rich**, but the system lacks a unified design language (shared layout primitives, typography scale, spacing, and motion rules).
- **Top opportunities**:
  - Introduce a **global mission-style theme system** (dark base, FETS Yellow accent, brand role palettes), and re-skin key views to match.
  - Normalize **page shells** (headers, subheaders, stat bars, pill navs) and **cards** across StudyWall, StudyRooms, MockTests, AIDeck, MentorDashboard, LibraryVault.
  - Tighten **accessibility and responsiveness** (focus outlines, ARIA, semantic regions, small-screen nav behavior).

---

## 2. Design System Assessment

### 2.1 Tokens, Tailwind, and Theming

- **Tailwind setup**
  - Defined via CDN and inline config in `[index.html](index.html)`:
    - `fontFamily.sans` → `Plus Jakarta Sans`.
    - `colors.brand` → CSS variables `--color-brand-50..900`.
    - Custom `slate` palette overrides.
  - No standalone `tailwind.config.*` file; theming is centralized in `index.html`.

- **Color system**
  - **Default student palette** in `[index.html](index.html)` (`:root`):
    - Brand red scale defined as CSS vars (`--color-brand-50..900`), base `--color-brand-500: #ff1a1a`.
  - **Runtime teacher palette**:
    - `[components/Layout.tsx](components/Layout.tsx)` and `[components/auth/SignUp.tsx](components/auth/SignUp.tsx)` override `--color-brand-*` when `userRole` / `role` is teacher, using an emerald/teal scale.
  - **FETS Yellow**:
    - `#FFD633` / `#ffd633` **does not appear** anywhere in the codebase.
    - Current brand accent is effectively **red vs emerald**, not FETS Yellow.
  - **Other color usage**:
    - Frequent use of `bg-slate-50`, `bg-white`, `bg-slate-900`, and translucent whites (`bg-white/5`) in view components.
    - Many CTA and badges hard-code color tokens (`bg-red-600`, `bg-emerald-600`, `bg-slate-900`) instead of using `brand` or role-based tokens.

- **Typography**
  - Global font: Plus Jakarta Sans via Google Fonts in `[index.html](index.html)`.
  - Pattern:
    - Headings often use **heavy weights and tight tracking** (e.g., `font-black uppercase tracking-[0.4em]`), strongly supporting the mission aesthetic.
    - However, there is **no explicit typography scale**; sizes are chosen ad hoc (`text-7xl`, `text-8xl`, `text-[10px]`, etc.).
  - Issue:
    - Repeated use of very small uppercase text (`text-[8px]`, `text-[9px]`, `text-[10px]`) for labels may hurt accessibility and legibility on smaller screens.

- **Spacing & layout**
  - Positive:
    - Many views use generous paddings and rounded “console card” shells (`rounded-[3rem]`, `rounded-[4rem]`).
    - Complex dashboards (MentorDashboard, LibraryVault, MockTests) generally use grid layouts and clear sections.
  - Gaps:
    - There is **no shared spacing token system**; margins/paddings vary widely (`p-6`, `p-8`, `p-10`, `p-12`, `p-16`).
    - Cards and headers are styled uniquely per view, increasing cognitive load.

- **Radius / elevation**
  - Radius:
    - Uses large radii (`rounded-[4.5rem]`, `rounded-[5rem]`, `rounded-[3rem]`) to create a “pill-panel” aesthetic.
    - Inconsistent use of smaller radii (`rounded-xl`, `rounded-2xl`) inside those shells; still coherent visually but not tokenized.
  - Shadows:
    - Rich, cinematic shadows (`shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]`, `shadow-2xl`) help with depth.
    - Shadows are hand-tuned on each component instead of referenced via a system (e.g. `shadow-mission-1`, `shadow-mission-2`).

- **Animations & motion**
  - Global:
    - `public/index.css` defines `.fade-in` and `.skeleton` shimmer utilities.
  - Components:
    - Frequent use of `animate-spin`, `animate-pulse`, and `animate-bounce`.
    - Panels and overlays use “animate-in” classes (likely from a Tailwind plugin) for entrance transitions.
  - Issue:
    - Motion feels **lively but not orchestrated** – there is no shared rhythm between pages or a motion spec (durations, easings, max concurrent animations).

### 2.2 Dark Mode & Cinematic/Mission Aesthetic

- **Current baseline**
  - The **global shell** (`Layout`) uses `bg-slate-50` + `bg-white/80` nav, which reads as a **light SaaS dashboard**, not a mission console:
    - See root `<div>` in `[components/Layout.tsx](components/Layout.tsx)` (`bg-slate-50 text-slate-900`).
  - Many mission-like views (AIDeck, TeachersDeck, DirectMessages, Profile CAN network, LibraryVault overlays) are designed on **dark backdrops** with neon-esque glows and brand accents.

- **Mismatch**
  - Landing page (`Landing.tsx`) is fully **light and marketing-style**, with red hero typography and white backgrounds – not dark/cinematic.
  - The app shell around mission views remains light, so the global navigation and background do not match the inner “console” aesthetics.

- **Recommendations**
  - **Introduce a dark global theme**:
    - Change `body` and `Layout` root backgrounds to `bg-slate-950` / `bg-slate-900`, and ensure all views render on top of dark surfaces, using translucent panels (`bg-slate-900/70`, `bg-slate-800/70`) for content.
  - **Add FETS Yellow as a first-class accent**:
    - Extend `index.html` CSS vars:
      - `--color-fets-yellow: #FFD633;`
    - Map to Tailwind via `tailwind.config` inline:
      - `colors: { brandAccent: '#FFD633', ... }` or update `brand.400`/`brandAccent` to use FETS Yellow for cross-role highlights (e.g., mission indicators, important CTAs, timers).
    - Use FETS Yellow consistently for:
      - Critical CTAs (start mock exam, join room, confirm AI call).
      - Status beacons (online, engine active, countdown thresholds).
  - **Rationalize palettes**:
    - **Role base** (student vs teacher) remains red/emerald.
    - **Mission accent** (FETS Yellow) is used for shared mission-critical cues, not for every button.

---

## 3. Component Inventory (High-Level)

Below ratings are 1–10 for **Visual Design Quality**, reflecting premium, dark, cinematic, mission alignment.

### 3.1 Global Shell & Auth

- **`Layout` (app shell)** – file: `components/Layout.tsx`  
  - **Purpose**: Global nav, notifications, mission panic button, and shell around all in-app views.
  - **Visual design (7/10)**:
    - Strong mission language (“Panic Protocol”, “Exam SOS”), 3D nav buttons (`.container-button` / `.tilt-btn`), and notification panel with good hierarchy.
    - Light background (`bg-slate-50` + `bg-white/80`) undercuts mission console mood.
    - Teacher/student theme switching via CSS variables is a strong foundation.
  - **Interactions**:
    - Hoverable 3D nav buttons, animated notification dropdown, panic modal with simulated wait/cost.
    - Mobile nav overlay is solid; hamburger toggles correctly.
  - **Accessibility**:
    - Buttons use `<button>` semantics; notification dropdown uses divs without ARIA (`role="menu"`, `aria-expanded` missing).
    - Panic modal lacks `role="dialog"` and focus trapping.
  - **Responsiveness**:
    - Desktop nav works well; mobile nav uses full-screen overlay.
    - Fixed-height nav may feel cramped on very small devices but generally acceptable.
  - **Code quality**:
    - Well-organized, uses internal `NavButton`, clear separation for notifications.
    - Some inline style usage (`style={{ width: '130px' }}`) instead of Tailwind.

- **`Login` & `SignUp` (auth shell)** – files: `components/auth/Login.tsx`, `components/auth/SignUp.tsx`  
  - **Purpose**: High-impact entry gateway with strong branding and role selection.
  - **Visual design (8.5/10)**:
    - Both screens embrace **dark, cinematic, mission aesthetic**:
      - Dark backgrounds (`bg-slate-950`), glass panels, heavy uppercase labels, glowing gradients.
      - Role-specific styling (Aspirant vs Mentor) with color-coded CTAs.
    - SignUp “Choose Your Path” panel is especially strong – feels like onboarding into a mission.
  - **Interactions**:
    - Role toggles change theme in real time via CSS vars.
    - Invite code validation adds micro-feedback (check/x icons, loading spinners).
  - **Accessibility**:
    - Inputs are labeled via placeholders only; use of proper `<label>` tags is inconsistent.
    - Contrast: excellent for most text; some small grey-on-dark text may be borderline for WCAG.
  - **Responsiveness**:
    - Grid collapses to single-column on mobile; still readable and visually clear.
  - **Code quality**:
    - Clear separation of concerns (role-based behaviors, invite code handling).
    - Could extract shared input and banner components for reuse.

### 3.2 Core Views

Below are summarized; per-page details are in section 4.

- **`Landing`** – `components/views/Landing.tsx`  
  - **Visual (6.5/10)**:
    - Clean, minimal marketing page with large COSTUDY hero type and red accent.
    - Not aligned with dark/mission aesthetic; feels like a different product brand.
  - **Interactions**: simple scroll CTA and beta request form; effective but not immersive.

- **`StudyWall`** – `components/views/StudyWall.tsx`  
  - **Visual (7.5/10)**:
    - Feels like a social mission feed with categories like “Audit Desk”, “Bounty Board”.
    - Uses cards, tags, statuses; decent density for a social wall.
  - **Interactions**:
    - Category filters, post creation modal, alignment (CAN) contract flow, audit/bounty features.
    - Complex but powerful; needs clearer empty/loading states and visual grouping.

- **`StudyRooms`** – `components/views/StudyRooms.tsx`  
  - **Visual (8/10)**:
    - Strong “operations board” layout with tabs: Mission, Focus, Resources, Discussion, Quiz, Calendar, Mentors.
    - Mission cards, discussion tiles, calendar events, mentors – visually coherent.
  - **Interactions**:
    - Simulated focus sessions with timers, discussions, resource lists.
    - Currently uses mock data; UI feels mission-like but could benefit from consistent timer and status styling across views.

- **`AIDeck`** – `components/views/AIDeck.tsx`  
  - **Visual (7.5/10)**:
    - Light shell with white card interior; good contrast but not fully cinematic.
    - Sidebar tools (Chat, Topic Blueprint, Notes, Flashcards, Essay Auditor) are clearly delineated with icons and copy.
  - **Interactions**:
    - Tool switching, chat modes (Global/Library/Active), context chips.
    - Strong mental model but token/cost awareness UI is minimal.

- **`TeachersDeck`** – `components/views/TeachersDeck.tsx`  
  - **Visual (8/10)**:
    - Dark, emerald-accented educator console with Teacher Mastermind persona.
    - Good alignment with mission-style for faculty persona.
  - **Interactions**:
    - Chat plus resource generation tools (lesson plans, rubrics, etc.).

- **`MentorDashboard`** – `components/views/MentorDashboard.tsx`  
  - **Visual (8/10)**:
    - Strong use of **subdomain redirect simulation** and multi-section dashboard with detail overlays.
    - Once loaded, “specialist-mode” dashboard feels like a command center.
  - **Interactions**:
    - Tabs for Impact, Broadcast, Classrooms, Revenue, Bounties, Teacher Deck.
    - Good use of overlays and progress bars; some button microcopy is still generic.

- **`MockTests` / `ExamSession` / `ExamIntroPages`** – `components/views/MockTests.tsx`, `components/views/ExamSession.tsx`, `components/views/ExamIntroPages.tsx`  
  - **Visual (8.5/10)**:
    - Exam Portal and simulation are meticulously themed to **Prometric exam** with custom intros, timers, navigation states.
    - `ExamIntroPages` uses detailed content and even mimics exam tutorial flows.
  - **Interactions**:
    - Rich exam experience: intros, timers, auto-save, MCQ+ESSAY separation, score calculation.
    - UX is exam-accurate but could add more clear “mission-style” overlays explaining risk and progress.

- **`DirectMessages`** – `components/views/DirectMessages.tsx`  
  - **Visual (8/10)**:
    - Dark inbox shell with neon brand accent and mission-like microcopy (“Micro-Consulting Session”, “Initialize Link”).
  - **Interactions**:
    - Conversation list, context-based threads (QUESTION, ESSAY, MOCK_EXAM, CONCEPT), micro-consult booking simulation.
    - Real-time updates via Supabase channels.

- **`LibraryVault`** – `components/views/LibraryVault.tsx`  
  - **Visual (8.5/10)**:
    - One of the most cinematic UIs: dark overlays, RAG architecture panel, vector search overlay with mission logs.
  - **Interactions**:
    - Ingestion logs simulate RAG pipeline; vector search results show similarity, document/page metadata.
    - Clear sense of **“neural engine”** running; close alignment with mission narrative.

- **`StudentStore`** – `components/views/StudentStore.tsx`  
  - **Visual (7.5/10)**:
    - Bright, premium marketplace cards with brand glow.
    - Feels more like a Fintech pricing page than a military console, but overall high quality.

- **`Profile`** – `components/views/Profile.tsx`  
  - **Visual (8/10)**:
    - Deep focus on **alignments, CAN network, signal levels**, radar-like views.
    - Mission language and high-density panels match concept well.

- **`TeachersLounge`** – `components/views/TeachersLounge.tsx`  
  - **Visual (7.5/10)**:
    - Mentor cards, trust emphasis, and Smart Match toggle.
    - Slightly more “ed-tech marketplace” than “black-ops hiring board”, but close.

### 3.3 Shared Utilities

- **`Icons`** – `components/Icons.tsx`
  - Rich inline icon set; consistent brand style.
  - Good candidate for centralizing iconography and semantics (e.g., mapping icons to roles/statuses).
- **`InviteCard` / `InviteCodeInput`**
  - Invite-focused components that combine metrics, copy, and call-to-action buttons.
  - Visuals align more with Landing/marketing style than core console; still coherent.

---

## 4. Page-by-Page UI/UX Analysis

For each page: **Visual hierarchy**, **Whitespace**, **Typography**, **Color/Contrast**, **Alignment**, **Responsive behavior**, **Dark-mode fit**, **Animation/motion**.

### 4.1 Landing (`Landing.tsx`)

- **Visual hierarchy (6/10)**:
  - Strong central “COSTUDY” wordmark and “Don’t study alone.” tagline.
  - Features and beta CTA sections are clear, but storytelling around **mission / alignments / AI decks** is absent.
- **Whitespace & layout (7/10)**:
  - Good vertical spacing and distinct sections (hero, features, stats, beta CTA, footer).
  - On very large screens, hero may feel too sparse; could benefit from background storytelling (mission overlays, exam imagery).
- **Typography & color**:
  - Heavy red hero, white background, slate type – clean but conventional SaaS.
  - Does not use FETS Yellow; no mission-style label typography.
- **Responsiveness**:
  - Well-behaved across breakpoints; CTAs reflow correctly.
- **Dark/cinematic fit**:
  - **Low** – this is the furthest from the desired aesthetic. Needs a redesigned hero (dark mission room, FETS yellow HUD elements, exam telemetry, AI callouts).
- **Key recommendations**:
  - Convert Landing into a **scroll-based mission briefing**:
    - Dark background, cinematic hero panel with mission timer (“Next CMA window: X days”), FETS Yellow progress indicators.
    - Replace simple feature grid with **“Mission modules”** that map to StudyRooms, AI Deck, MockTests, Mentors.

### 4.2 StudyWall (`StudyWall.tsx`)

- **Visual hierarchy (7/10)**:
  - Category chips (All Feed, Audit Desk, Bounty Board, etc.) give good top-level segmentation.
  - Within each post card, author, tags, and content are laid out, but **actions and summaries** (e.g., AI summarization) could be more visually distinct.
- **Whitespace & density (7/10)**:
  - Balanced for a feed; could tighten between header filters and first post.
  - Comments/discussions risks vertical bloat; consider collapsible controls.
- **Color & contrast**:
  - Uses brand colors for categories and callouts; generally accessible but some subcopy uses subdued greys.
- **Dark-mode fit**:
  - Feels more like a neutral content feed; would need a dark shell and brand-accented cards to match mission dashboard.
- **Interactions**:
  - Many: create post, tags, alignment CAN modal, summarization, bounty/audit flows.
  - Need consistent loading states and non-blocking error feedback (avoid `alert`).

### 4.3 StudyRooms (`StudyRooms.tsx`)

- **Visual hierarchy (8/10)**:
  - Clear primary nav via room selection and tabs.
  - Missions, discussions, resources, calendar, and mentors each have differentiated layouts.
- **Whitespace (8/10)**:
  - Good breathing room inside each tab; supports reading longer descriptions.
- **Color & contrast**:
  - Thoughtful mix of whites, slates, and brand accents on a light base.
  - For mission-style, consider darkening container backgrounds.
- **Dark-mode fit**:
  - Conceptually strong (mission board, focus timer, mentors), but light base backgrounds dilute the cinematic feel.
- **Interactions**:
  - Pomodoro timer, mission progress, pinned discussions, calendaring – conceptually rich.
  - Currently driven by mock data; design should anticipate real-time updates and variable content size.

### 4.4 AIDeck (`AIDeck.tsx`)

- **Visual hierarchy (7.5/10)**:
  - Sidebar clearly lists tools; active tool state is visually indicated.
  - Chat header with mode toggles (Global, Library, Active) is clear, but cost/latency indicators are missing.
- **Whitespace**:
  - Plenty in main chat and tools; some text areas (notes/essay) could benefit from subtle grid/background.
- **Color/contrast**:
  - Light card backgrounds (`bg-white`) with brand accents; accessible but not cinematic.
- **Dark-mode fit**:
  - As-is, more “productivity app” than mission console. Converting card/container backgrounds to darker tones would align it with TeachersDeck and DirectMessages.
- **Interactions**:
  - Chat with context modes, note refiner, flashcards, topic blueprint, essay auditor.
  - Very strong tool multiply; consider a consistent header that surfaces token usage, cost, and latency across tools.

### 4.5 TeachersDeck (`TeachersDeck.tsx`)

- **Visual hierarchy (8/10)**:
  - Clear teacher persona and tool segmentation.
- **Color & dark-mode**:
  - Strong dark base with emerald accent aligns well with **teacher specialist mission**.
- **Interactions**:
  - Chat plus resource generation; mostly text-driven, but layout is robust and responsive.

### 4.6 MentorDashboard (`MentorDashboard.tsx`)

- **Visual hierarchy (8/10)**:
  - Subdomain redirect simulation is unique and on-brand.
  - Once loaded, dashboards, student detail views, and notes have good structure.
- **Color/contrast**:
  - Mix of white cards and darker info panels; consistent with teacher emerald accent.
- **Dark-mode fit**:
  - Very close to mission aesthetic, especially in student detail view and notes panel.
- **Interactions**:
  - Tabbed dashboards, broadcast forms, bounties.
  - Alerts via `alert` are functional but not mission-style; replace with inline toasts/panels.

### 4.7 MockTests & ExamSession

- **Visual hierarchy (9/10)**:
  - Exam header, stats bar, exam cards, and active session strongly guided.
  - Intro/tutorial content is long but well broken into pages.
- **Color/contrast**:
  - Mostly white backgrounds mimicking Prometric; appropriate for exam simulation but visually separate from app’s mission console.
- **Dark-mode fit**:
  - We should keep exam interior close to Prometric style, but outer shell (headers/nav) can still embrace dark mission theme.

### 4.8 DirectMessages (`DirectMessages.tsx`)

- **Visual hierarchy (8/10)**:
  - Sidebar vs active chat separation is very clear.
  - Thread creation “Initialize Link” interface is well structured.
- **Dark-mode fit**:
  - Excellent: uses dark backgrounds, brand accents, console-like layout.
- **Interactions**:
  - Real-time chat, context threads, micro-consultation triggers.
  - Some microcopy (“Micro-Consulting Session Confirmed”) is delightful and on-theme.

### 4.9 LibraryVault (`LibraryVault.tsx`)

- **Visual hierarchy (9/10)**:
  - Clear header, search bar, category filters, ingestion logs, and overlays.
- **Dark-mode & cinematic**:
  - Very strong: RAG overlays, architecture diagram, and vector search result list feel like a **neural operations center**.

### 4.10 StudentStore (`StudentStore.tsx`)

- **Visual hierarchy (7.5/10)**:
  - Product cards, pricing, and CTAs are clear and well-structured.
- **Brand fit**:
  - Looks like a premium pricing page; some mission accent language present but less pronounced.

### 4.11 Profile (`Profile.tsx`)

- **Visual hierarchy (8/10)**:
  - Strong emphasis on alignment contracts, radar, tracking.
  - Tabs for contracts vs radar, CAN network data, and signals.
- **Dark-mode fit**:
  - Mixed light/dark, but CAN section leans mission-style.

### 4.12 TeachersLounge (`TeachersLounge.tsx`)

- **Visual hierarchy (7.5/10)**:
  - Hero heading and Smart Match toggle are clear.
  - Mentor cards highlight identity and specialties effectively.
- **Brand fit**:
  - Close to **trust-driven mission recruiting**, but backgrounds and tokens still lean SaaS.

---

## 5. UX Flow Analysis

### 5.1 Onboarding Flow – Landing → Sign Up → Profile → First Study Room

- **Current path**
  - **Landing** (`Landing.tsx`):
    - Hero CTA “Join the Beta” and “Request Access” both route to showing the SignUp overlay (`onGetStarted()` → `App`’s `handleAuthRequired('SIGNUP')`).
  - **Sign Up** (`SignUp.tsx`):
    - Role selection (Student vs Teacher) with theme preview.
    - Student path requires invite code validation; teacher path requires specialist access code.
  - **Post-signup**:
    - Auth listener in `App.tsx` sets `isLoggedIn` and, after identity sync, user lands on `StudyWall` (or faculty wall for teachers).
    - There is **no explicit first-time “Profile Setup” wizard**; users must discover `Profile` tab.
  - **First room**:
    - Students must navigate manually to `StudyRooms` from the global nav.

- **Friction points / drop-off risks**
  - Invite-only gating for students may be appropriate for beta but risks confusion if not framed clearly on Landing.
  - No explicit onboarding checklist (complete profile, join first room, try AIDeck, run a mock).
  - First experience on StudyWall can feel **information-heavy** without guidance.

- **Recommendations**
  - Add a **first-session mission overlay**:
    - After first login, show a modal or overlay with 3 steps: “1) Complete Profile, 2) Join Study Room, 3) Run First Mock”.
    - Use FETS Yellow for progress and checkmarks.
  - Align Landing copy with **invite-only and mission language** (e.g., “Get your alignment code to join the campaign”).

### 5.2 Study Session Flow – Join Room → Pomodoro/Focus → Break → Resume

- **Current path**
  - From nav → **Study Rooms**.
  - User selects a room, then enters `Mission` tab by default; can switch to `Focus` tab for timers, `Discussion`, `Resources`, etc.
  - Focus sessions and timer are simulated in UI without deep guidance.

- **Friction points**
  - Focus sessions are not visually coupled to **global progress** (streaks, exam readiness).
  - Lack of explicit break/summary overlays after a session; results are not clearly linked to StudyWall, Profile, or MockTests.

- **Recommendations**
  - Add **mission brief** at the top of StudyRooms: what the session is for and how it affects exam readiness.
  - Integrate FETS Yellow countdown and progress arcs to make focus sessions feel like countdown operations.

### 5.3 Social Interaction Flow – Find Peers → Vouch System → Study Group → Chat

- **Current path**
  - **Discovery**:
    - Peers visible via StudyWall posts and TeachersLounge for mentors.
  - **Vouch system**:
    - Types and schema exist (vouches and reputation metrics), and `clusterService` supports vouch actions; UI surfaces are less obvious but likely in StudyWall and Profile.
  - **Groups & chat**:
    - StudyRooms and DirectMessages connect users, with context-aware threads in DM.

- **Friction points**
  - Vouch system is **not visually foregrounded** – users may not realize its importance.
  - Trust signals (vouches, badges, alignment contracts) are scattered and not unified into a single “trust radar.”

- **Recommendations**
  - Elevate **vouch and alignment badges** onto StudyWall and TeachersLounge cards.
  - Use mission-style HUD elements (FETS Yellow) to denote high-trust peers and mentors.

### 5.4 AI Mastermind Flow – Ask Question → AI Response → Follow-up → Save Notes

- **Current path**
  - From nav → `AI Deck` (student) or `Teaching Deck` (teacher).
  - User engages in chat, then possibly generates notes, flashcards, or essays.
  - AIDeck provides follow-up modes (Library / Active context); TeachersDeck provides lesson/MCQ/rubric generation.

- **Friction points**
  - Lack of **clear, persistent notion of what has been “saved”** – notes, flashcards, and essay evaluations are mostly local to the current session.
  - No prominent indication of **AI context window** or cost; can feel like a black box.

- **Recommendations**
  - Introduce a **“Mission Log”** panel summarizing all AI outputs tied to current study week/session.
  - Add simple cost awareness (“This answer used ~X tokens; using Library mode is more expensive”) with FETS Yellow token chips.

---

## 6. Accessibility & Mobile Experience

### 6.1 Accessibility (WCAG / ARIA)

- **Strengths**
  - Most interactive controls are `<button>` elements with clear text.
  - Color palettes mostly achieve good contrast for primary text on backgrounds.
  - Loading and empty states often show icons + messages.

- **Issues**
  - **Missing ARIA roles** for modals and overlays (panic modal, notifications, search overlays in LibraryVault, RAG results).
  - **Focus management**:
    - Modals do not trap focus; keyboard users can tab into background content.
  - **Small text**:
    - Many labels use `text-[8px]`–`text-[10px]` uppercase; this is likely **too small** for WCAG AA at normal viewing distances.
  - **Semantic regions**:
    - Complex layouts (MentorDashboard, StudyRooms, DirectMessages) use generic `div`s instead of `main`, `nav`, `aside`, `section`.

### 6.2 Mobile & Responsive Behavior

- **Strengths**
  - Landing, auth pages, and many cards collapse gracefully into single-column.
  - Layout nav includes a mobile menu overlay with reflowed nav items.

- **Gaps**
  - High-density dashboards (MentorDashboard, MockTests, LibraryVault, DirectMessages) need careful stress testing on narrow screens; some content may overflow or become scroll-heavy.
  - Some typography sizes do not adjust by breakpoint, leading to overly large headings or tiny labels on small devices.

---

## 7. Key UI/UX Recommendations (Summary)

- **Unify the mission aesthetic**
  - Move entire logged-in shell to a **dark, cinematic base** with FETS Yellow as a cross-cut accent.
  - Define a small token set in `index.html` / Tailwind config:
    - `--color-mission-bg`, `--color-panel-bg`, `--color-accent-fets`, `--shadow-mission-*`, standardized typographic scale.

- **Normalize shells and cards**
  - Extract shared components for:
    - Page headers (icon + badge + title + subtitle).
    - Stat bars and overview strips.
    - Mission panels and cards (StudyRooms, LibraryVault, MockTests, MentorDashboard).

- **Accessibility upgrades**
  - Introduce **modal primitives with focus trapping**.
  - Increase minimum body/label font sizes and use `text-xs`/`sm` instead of custom `text-[8px]`.
  - Add ARIA roles/labels for critical components (dialogs, nav, notification menus).

- **Storytelling & onboarding**
  - Rebuild Landing as an **interactive mission briefing** that introduces alignments, vouch system, AI decks, and mock exams.
  - Add first-session mission checklist, using FETS Yellow to represent “mission steps” and completion.

These findings are intended to be paired with the more detailed technical and architectural audit in `costudy-technical-audit.md` and the prioritized roadmap in `costudy-action-plan.md`.

