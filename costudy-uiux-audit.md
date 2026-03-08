# CoStudy UI/UX Audit Report

> **Audit Date**: March 8, 2026  
> **Scope**: Phase 0 (Environment & Repo) + Phase 1 (Design System & Branding)  
> **Repo**: `costudy-frontend` on `main` (6 commits ahead of `origin/main`)

---

## Phase 0 — Environment & Repo State

### 0.1 Repository Structure

The frontend has a **flat root-level structure** — no `src/` directory. All application code lives at the repo root:

| Path | Purpose |
|---|---|
| `index.html`, `index.tsx`, `App.tsx` | Entry shell |
| `components/Layout.tsx` | App shell (nav, notifications, panic button) |
| `components/Icons.tsx` | Inline SVG icon library (78 icons) |
| `components/auth/Login.tsx`, `SignUp.tsx` | Auth screens |
| `components/views/*.tsx` | 14 view components (StudyWall, AIDeck, MockTests…) |
| `components/InviteCard.tsx`, `InviteCodeInput.tsx` | Shared invite UI |
| `services/*.ts` | 13 service modules (Supabase, Gemini, chat, exams…) |
| `types.ts` | Central domain types (729 lines, 40+ interfaces) |
| `main.css` | Global styles (Tailwind directives + custom CSS) |
| `tailwind.config.js`, `postcss.config.js` | Build-time Tailwind setup |
| `database.sql`, `migrations/*.sql` | Local SQL reference |

**Remote branches**: `design-overhaul`, `main`, `master`, `pre-claude-code-backup`

### 0.2 Dependencies (package.json)

| Category | Packages | Notes |
|---|---|---|
| **Production** | `react` ^19.2.0, `react-dom` ^19.2.0, `@supabase/supabase-js` **latest**, `@google/genai` ^1.30.0 | Only 4 deps. **Supabase pinned to `latest`** — risky for reproducibility. |
| **Dev** | `typescript` ~5.8.2, `vite` ^6.2.0, `tailwindcss` ^3.4.19, `postcss`, `autoprefixer`, `dotenv`, `@types/node`, `@vitejs/plugin-react` | Lean setup. No linters (ESLint), no test framework, no Prettier. |

**Issues found**:
- `@supabase/supabase-js: "latest"` — unpinned, will resolve to whatever is newest at install time. Should be pinned to a specific major version (e.g., `^2.49.0`).
- `npm audit` reports **2 high severity vulnerabilities** in the dependency tree.
- No `eslint`, `prettier`, or test dependencies — no automated quality gates.

### 0.3 TypeScript Configuration (tsconfig.json)

```
Target: ES2022 | Module: ESNext | JSX: react-jsx
```

| Setting | Value | Assessment |
|---|---|---|
| `strict` | **not set** (false) | No strictNullChecks, no noImplicitAny. Weakest TS configuration possible. |
| `skipLibCheck` | true | Skips type-checking of `.d.ts` files — hides issues. |
| `allowJs` | true | Allows untyped JS files — currently none exist, can be removed. |
| `paths` | `@/* → ./*` | Root alias, working correctly with Vite resolve config. |
| `noEmit` | true | Vite handles transpilation; TSC is diagnostic-only. |

**Impact**: With `strict: false`, there's no protection against `null`/`undefined` access, implicit `any` types, or missing return types. The codebase uses `any` in several critical spots (e.g., `user` state in App.tsx line 44, Supabase responses).

### 0.4 Vite Configuration (vite.config.ts)

| Setting | Value | Notes |
|---|---|---|
| Server port | 3000 | Bound to 0.0.0.0 (all interfaces) |
| Manual chunks | `vendor-react`, `vendor-supabase`, `vendor-genai` | Good separation. Each chunk cached independently. |
| Minification | esbuild | Fast, default choice. |
| Source maps | **disabled** in prod | Saves ~30% build size; debugging in production requires re-enabling. |
| Chunk size warning | 600KB | Elevated from default 500KB. |

**Gemini API key injection** (`vite.config.ts:14-15`):
```js
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```
The key is loaded from `.env` `GEMINI_API_KEY` and baked into the client bundle at build time. This means the API key is **visible in the browser** to anyone who inspects the built JS. This is a known Gemini client-side usage pattern but carries abuse risk.

### 0.5 index.html — Stale Import Map

`index.html` lines 9-19 contain a `<script type="importmap">` that maps `react`, `react-dom`, `@google/genai`, and `@supabase/supabase-js` to CDN URLs (`aistudiocdn.com`, `cdn.jsdelivr.net`).

**This is dead code.** Vite resolves these imports from `node_modules` during development and bundles them during production build. The importmap is ignored but is confusing and should be removed. It's a leftover from an earlier CDN-only architecture.

### 0.6 Environment Variables — CRITICAL MISMATCH

| File | Variable | Value |
|---|---|---|
| `.env` | `VITE_SUPABASE_KEY` | `eyJ0eX...iPCg` (anon JWT) |
| `.env` | `SUPABASE_SERVICE_KEY` | `eyJ0eX...3ebQ` (service role JWT) |
| `supabaseClient.ts` | reads | `VITE_SUPABASE_ANON_KEY` |
| `.env.example` | documents | `VITE_SUPABASE_ANON_KEY` |

**Three critical issues**:

1. **Name mismatch**: `.env` defines `VITE_SUPABASE_KEY`, but `supabaseClient.ts` reads `VITE_SUPABASE_ANON_KEY`. Result: the client gets `undefined`, falls back to a placeholder URL/key, and **all Supabase operations silently fail in development**.

2. **Service role key in frontend `.env`**: `SUPABASE_SERVICE_KEY` is a service-role JWT with **full database access bypassing RLS**. Even though it's not `VITE_`-prefixed (so Vite won't expose it to the browser), it should **never** be in a frontend repo's `.env`. If anyone copies `.env` to `.env.production` or a CI pipeline reads it, this key could leak.

3. **`.env.production`** has `VITE_SUPABASE_URL` but no anon key — relies on deployment environment to inject it. The `GEMINI_API_KEY` placeholder value (`your_gemini_api_key_here`) would bake a string literal into the bundle if used as-is.

**Recommended fix**: Rename `VITE_SUPABASE_KEY` → `VITE_SUPABASE_ANON_KEY` in `.env`, remove `SUPABASE_SERVICE_KEY` from frontend `.env` entirely.

### 0.7 Dev Server Sanity Check

| Check | Result |
|---|---|
| `npm install` | Clean install, 223 packages, 2 high severity vulns |
| `npm run dev` | Starts in ~1.2s on port 3002 (3000/3001 were occupied) |
| Console warnings | `[CoStudy] Supabase config missing` (due to env var mismatch above) |
| Landing renders | Yes — but auth/data features non-functional without correct env vars |

---

## Phase 1 — Design System & Branding Recon

### 1.1 Color System

#### Brand Palette (CSS Variables)

The brand palette is defined in `main.css` `:root` and dynamically swapped via JavaScript in `Layout.tsx` and `SignUp.tsx` based on user role.

**Student Theme (Default — Red)**:
| Token | Hex | Usage |
|---|---|---|
| `--color-brand-50` | `#fff1f1` | Tinted backgrounds |
| `--color-brand-100` | `#ffdfdf` | Light accents |
| `--color-brand-200` | `#ffc5c5` | Hover states |
| `--color-brand-300` | `#ff9d9d` | Secondary elements |
| `--color-brand-400` | `#ff6464` | Medium emphasis |
| `--color-brand-500` | `#ff1a1a` | **Primary brand** |
| `--color-brand-600` | `#ed0000` | Hover/active |
| `--color-brand-700` | `#c80000` | Dark variant |
| `--color-brand-800` | `#a50404` | Very dark |
| `--color-brand-900` | `#890b0b` | Deepest |

**Teacher Theme — INCONSISTENT across files**:

| File | Colors Used | Hue Family |
|---|---|---|
| `Layout.tsx` (lines 37-47) | Emerald (#10b981 → #064e3b) | Green/Emerald |
| `SignUp.tsx` (lines 38-48) | Teal (#0d9488 → #042f2e) | Blue-Green/Teal |
| `Login.tsx` (hardcoded) | `emerald-500` via Tailwind | Green/Emerald |

**Issue**: A teacher signing up sees Teal branding, then after login sees Emerald branding. This creates a subtle but noticeable visual inconsistency during the most critical first-use experience.

#### Neutral Palette

Slate scale hardcoded in `tailwind.config.js` (lines 23-34): `slate-50` (#f8fafc) through `slate-900` (#0f172a). This is the standard Tailwind slate palette, which is fine but redundant since Tailwind includes it by default.

#### Missing: FETS Yellow (#FFD633)

**Zero occurrences** of `#FFD633`, `fets-yellow`, or any yellow accent across the entire codebase (all `.tsx`, `.ts`, `.css`, `.html`, `.js` files searched).

The audit plan identified FETS Yellow as a desired signature accent. Its complete absence means:
- No visual connection to the FETS brand identity
- No warm accent to complement the cool red/slate palette
- CTAs, badges, highlights, and achievement markers all default to brand-red or emerald-green
- The design feels monochromatic (red + grey) with no energetic contrast

#### Color Usage Patterns Across Components

| Pattern | Count (approx.) | Files |
|---|---|---|
| Light backgrounds (`bg-white`, `bg-slate-50`, `bg-slate-100`) | 300+ | All views |
| Dark backgrounds (`bg-slate-900`, `bg-slate-950`, `bg-black`) | ~89 | Mainly auth, some badges/tags |
| Emerald/Teal (teacher elements) | ~71 | TeachersDeck, Login, SignUp, Profile, MentorDashboard |
| Direct `red-600`/`red-500` (bypassing brand vars) | ~40 | Landing page exclusively |

**Issue**: The Landing page uses hardcoded `red-600` / `red-500` Tailwind classes instead of `brand` CSS variables. If the brand palette ever changes, Landing won't update.

### 1.2 Typography

#### Font Stack

Single font family: **Plus Jakarta Sans** (weights 300-800), loaded from Google Fonts CDN.

```html
<!-- index.html line 8 -->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Configured as default `sans` in `tailwind.config.js` line 7-8.

**Assessment**: Plus Jakarta Sans is a good geometric sans-serif with personality — slightly warmer than Inter, with a professional but approachable feel. However, using it as the **only** font means there's no typographic contrast between display/headline text and body/UI text. For a mission/cinematic aesthetic, a secondary display font (monospace for data, or a condensed military-style typeface for labels) would add depth.

#### Weight Distribution

| Weight | Tailwind Class | Occurrences | Usage |
|---|---|---|---|
| 900 (Black) | `font-black` | **695+** | Headings, labels, buttons, micro-text, stats — **everywhere** |
| 700 (Bold) | `font-bold` | **695+** | Secondary text, descriptions, form labels |
| 500 (Medium) | `font-medium` | ~150 | Body text, descriptions |
| 600 (Semibold) | `font-semibold` | ~30 | Rare, inconsistent usage |

**Issue**: `font-black` and `font-bold` combined account for ~90% of all text styling. This creates a "wall of heavy text" effect where nothing stands out because everything is maximally bold. The hierarchy collapses — a section heading at `font-black` carries no more visual weight than a label at `font-black`.

#### The "Mission Label" Micro-Text Pattern

The most distinctive typographic pattern in CoStudy is a recurring micro-text treatment:

```
text-[9px] / text-[10px] / text-[11px] + font-black + uppercase + tracking-widest
```

This pattern appears **225+ times** across all components. Examples:

- `text-[10px] font-black uppercase tracking-[0.4em] text-slate-400` (App.tsx line 219)
- `text-[10px] font-black text-slate-500 uppercase tracking-widest` (Layout.tsx line 214)
- `text-[9px] font-bold text-slate-300 mt-1 block uppercase` (Layout.tsx line 337)
- `text-xs font-black text-slate-500 uppercase tracking-widest` (Layout.tsx line 232)

**Assessment**: This is CoStudy's strongest design identity element. It evokes military/mission control briefings and is consistent with the cinematic direction. However:
- The sizes vary arbitrarily (9px, 10px, 11px, 12px) without clear rules for when to use which
- `tracking-widest`, `tracking-[0.2em]`, `tracking-[0.3em]`, `tracking-[0.4em]` vary without rationale
- `uppercase` is used 346+ times — should be a design token, not manually applied each time

#### Heading Hierarchy (Lack Thereof)

Text sizes used for headings across the codebase:

| Size | Example Location | Context |
|---|---|---|
| `text-[15vw]`-`text-[180px]` | Landing hero | "COSTUDY" display |
| `text-7xl` | Login.tsx | Brand statement |
| `text-5xl` | Landing features heading | Section title |
| `text-4xl` | SignUp.tsx, various | Page titles |
| `text-3xl` | Login.tsx form | Form heading |
| `text-2xl` | SignUp.tsx role cards | Card titles |
| `text-xl` | Landing feature boxes, Profile | Subheadings |
| `text-lg` | Various | Large body text |

There is no standardized heading hierarchy (H1–H4 mapping). Sizes are chosen ad hoc per component, leading to inconsistency across views.

### 1.3 Spacing & Layout

#### Container Widths

No consistent container system. `max-w-*` values used across views:

| Width | Location | Context |
|---|---|---|
| `max-w-7xl` (80rem) | Landing nav | Widest content |
| `max-w-6xl` (72rem) | Landing features | Feature grid |
| `max-w-5xl` (64rem) | Landing footer | Footer content |
| `max-w-4xl` (56rem) | Landing stats | Stats section |
| `max-w-3xl` (48rem) | Landing CTA | Beta form |
| `max-w-[1200px]` | SignUp | Auth container |
| `max-w-[1100px]` | Login | Auth container |
| `max-w-lg` / `max-w-md` | Various modals | Modal content |

**Issue**: No single "page container" convention. Each view sets its own max-width, creating inconsistent content widths as users navigate between views.

#### Border Radius Scale

The codebase uses an extreme range of border radii, mixing Tailwind defaults with arbitrary values:

| Radius | Occurrences | Usage |
|---|---|---|
| `rounded-full` | Common | Avatars, pills, indicators |
| `rounded-[4.5rem]` | 2 | Auth screen outer containers |
| `rounded-[3rem]` | ~10 | Panic modal, role cards, error banners |
| `rounded-[2rem]` | ~25 | Primary buttons, notification dropdown |
| `rounded-[1.5rem]` | ~30 | Input fields (auth screens) |
| `rounded-2xl` | Common | Cards, panels |
| `rounded-xl` | Common | Buttons, inputs, badges |
| `rounded-lg` | Occasional | Smaller elements |

**Issue**: 6+ distinct radius values with no clear system. A card might be `rounded-2xl` in one view and `rounded-[3rem]` in another. The arbitrary values (`[1.5rem]`, `[2rem]`, `[3rem]`, `[4.5rem]`) should be formalized into the Tailwind config.

#### Padding

Padding varies significantly and inconsistently:

- Auth screens: `p-12`, `p-16` (very generous)
- Cards: `p-4`, `p-5`, `p-6`, `p-8`, `p-10` (no standard)
- Buttons: `py-3 px-6` to `py-6 px-10` (huge range)
- Section padding: `py-20`, `py-24`, `py-32` (Landing sections)

### 1.4 UI Primitives Inventory

#### Navigation (Layout.tsx)

The nav bar uses a unique **3D tilt button** system defined in `main.css` (lines 38-113):
- A 3×2 CSS grid creates hover zones that trigger `rotateX`/`rotateY` transforms
- Active state fills with brand color
- Mobile: falls back to simple full-width buttons with `font-black uppercase tracking-widest`

**Assessment**: The tilt buttons are a strong, distinctive UI element that supports the mission aesthetic. However, they're implemented entirely in CSS with magic numbers and would be hard to maintain or variant-ize.

#### Buttons (No Standard Variants)

Buttons are styled inline throughout the codebase with no shared component or Tailwind `@apply` abstraction. Identified variants:

| Variant | Example Classes | Used In |
|---|---|---|
| **Primary CTA** | `bg-brand text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl` | SignUp submit |
| **Login** | `bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest` | Layout login button |
| **Landing CTA** | `bg-red-600 text-white rounded-full text-lg font-bold shadow-xl` | Landing hero |
| **Ghost** | `text-slate-500 hover:text-white uppercase tracking-widest text-[10px] font-black` | Auth navigation links |
| **Teacher CTA** | `bg-emerald-600 text-white rounded-[2rem] font-black uppercase` | Login (teacher mode) |
| **Panic** | `bg-red-600 rounded-full w-16 h-16 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse` | Layout panic button |
| **Icon button** | `p-2.5 rounded-xl bg-slate-100` | Notification bell |

**Issue**: At least 7 distinct button styles with no extraction into a reusable component. Styling is duplicated across 20+ files, making brand-wide changes expensive.

#### Cards

Common card patterns identified:

| Pattern | Classes | Used In |
|---|---|---|
| **Standard card** | `bg-white rounded-2xl border border-slate-200 p-6` | InviteCard, feature boxes |
| **Frosted card** | `bg-white/[0.03] backdrop-blur-3xl rounded-[4.5rem] border border-white/10` | Auth screens |
| **Stat card** | `bg-slate-100 rounded-2xl p-6 border border-slate-200` | Panic modal details |
| **Gradient card** | `bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200` | InviteCard compact |

#### Form Inputs

Two distinct input styles exist:

1. **Dark/Auth variant**: `bg-white/5 border-2 border-white/10 rounded-[1.5rem] px-8 py-5 text-white font-bold` — used in Login and SignUp
2. **Light/Standard variant**: `bg-slate-50 rounded-xl border border-slate-200 px-5 py-4` — used in Landing beta form

No shared input component exists; styles are duplicated in every form.

#### Loading States

| Type | Implementation | Used In |
|---|---|---|
| **Spinner** | `border-4 border-brand border-t-transparent rounded-full animate-spin` | App.tsx, various |
| **Skeleton shimmer** | `.skeleton` CSS class (gradient animation) | InviteCard |
| **Pulse text** | `animate-pulse` + micro-text | Initial load ("Neural Handshake Active...") |
| **Icon spin** | `Icons.CloudSync` + `animate-spin` | Auth submit buttons |

#### Notification System

Notifications are implemented inline in `Layout.tsx` with a dropdown panel:
- Bell icon with unread dot indicator
- Dropdown: `rounded-[2rem]` card with `shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)]`
- Real-time via Supabase `postgres_changes` subscription
- Empty state with muted icon and "All caught up" text

### 1.5 Dark Mode Assessment

#### Current State: NO Global Dark Mode

| Surface | Background | Assessment |
|---|---|---|
| **Body default** | `#f8fafc` (slate-50) | Light |
| **App shell / nav** | `bg-white/80 backdrop-blur-2xl` | Light + frosted |
| **Main content area** | `bg-slate-50` | Light |
| **Landing page** | `bg-white` | Fully light |
| **Auth screens** | `bg-slate-950` | **Dark** — cinematic |
| **Auth forms** | `bg-white/5`, `bg-white/[0.03]` | Dark frosted glass |
| **Landing footer** | `bg-slate-950` | Dark |

**The app has a jarring aesthetic shift**: users experience a dark, cinematic auth screen, then upon login are dropped into a light, SaaS-style interface. The "mission control" feeling established during sign-up is immediately lost.

#### Dark Elements Within Light Views

Several components use dark mini-surfaces within the light shell:
- Badge backgrounds: `bg-slate-900 text-white`
- Stat overlays in some dashboards
- Code/terminal-style elements (LibraryVault ingestion logs)
- Panic Protocol modal: `bg-red-950/90 backdrop-blur-xl`

These create visual fragmentation — dark islands in a light sea — rather than a cohesive dark theme.

### 1.6 Cinematic / Mission Aesthetic Gap Analysis

#### Elements That SUPPORT the Mission Aesthetic

| Element | Location | Quality |
|---|---|---|
| 3D tilt nav buttons | Layout.tsx + main.css | Strong — distinctive, tactile |
| Micro-text labels (uppercase, tracked, black weight) | Everywhere | Strong — most consistent identity element |
| Military/mission copy ("Neural Handshake", "Command Center", "Dispatch", "SOS") | App.tsx, Layout.tsx, MentorDashboard | Good — language is on-brand |
| Panic Protocol modal | Layout.tsx | Excellent — full cinematic treatment |
| Auth screen design (dark glass, oversized type, brand gradients) | Login.tsx, SignUp.tsx | Excellent — premium, cinematic |
| Status indicators (pulse dots, signal lights) | Various | Good — dashboard-like |

#### Elements That CONTRADICT the Mission Aesthetic

| Element | Location | Issue |
|---|---|---|
| Light body background (#f8fafc) | main.css, Layout.tsx | Feels like generic SaaS, not mission control |
| Landing page (white, clean, startup-minimal) | Landing.tsx | Completely disconnected from mission aesthetic |
| Feature boxes (white cards, slate borders) | Landing.tsx FeatureBox | Standard startup style, not mission briefings |
| `bg-white/80 backdrop-blur` nav | Layout.tsx line 263 | Light frosted glass ≠ dark HUD |
| Generic chart/stat presentations | MentorDashboard, Profile | No radar/HUD styling |
| Inconsistent dark/light mixing | Across views | Neither fully dark nor deliberately light |

#### Mission Aesthetic Score: 4/10

The **copy and micro-typography** are mission-grade. The **visual treatment** is not. The auth screens (9/10 mission-score) and panic modal (10/10) prove the team can execute the aesthetic — it just hasn't been applied to the main app shell and views.

### 1.7 Summary of Design System Issues (Priority-Ranked)

| # | Issue | Severity | Impact | Files Affected |
|---|---|---|---|---|
| **DS-1** | No global dark mode; light shell contradicts mission aesthetic | High | Brand identity | `main.css`, `Layout.tsx`, all views |
| **DS-2** | FETS Yellow (#FFD633) completely absent | High | Brand identity | None (needs adding) |
| **DS-3** | Teacher theme inconsistent: Emerald in Layout, Teal in SignUp | High | First-use experience | `Layout.tsx:37-47`, `SignUp.tsx:38-48` |
| **DS-4** | No reusable Button component; 7+ ad-hoc variants | Medium | Maintainability | All 20 component files |
| **DS-5** | No reusable Input component; 2 styles duplicated | Medium | Maintainability | Auth + form views |
| **DS-6** | Heading hierarchy undefined; sizes chosen ad-hoc | Medium | Visual consistency | All views |
| **DS-7** | `font-black` overused (695+ times); hierarchy collapses | Medium | Readability | All components |
| **DS-8** | Border radius scale arbitrary (6+ values) | Low | Visual consistency | All components |
| **DS-9** | Container width varies per view (no standard) | Low | Layout consistency | All views |
| **DS-10** | Landing uses hardcoded `red-600` instead of `brand` vars | Low | Maintainability | `Landing.tsx` |
| **DS-11** | Stale `importmap` in index.html | Low | Developer confusion | `index.html:9-19` |
| **DS-12** | Micro-text sizes arbitrary (9px/10px/11px) with no rules | Low | Consistency | All components |

### 1.8 Recommendations — Design System Consolidation

#### Immediate (Quick Wins)

1. **Fix teacher theme consistency**: Align `SignUp.tsx` teacher palette to Emerald (matching `Layout.tsx`), or decide on Teal for both. One truth, not two.

2. **Rename env var**: `.env` `VITE_SUPABASE_KEY` → `VITE_SUPABASE_ANON_KEY` to match `supabaseClient.ts`. Remove `SUPABASE_SERVICE_KEY` from frontend repo entirely.

3. **Remove stale importmap**: Delete lines 9-19 from `index.html`.

4. **Pin Supabase version**: Change `"@supabase/supabase-js": "latest"` to a specific version (e.g., `"^2.49.0"`).

#### Short-Term (Design Tokens)

5. **Introduce FETS Yellow as accent**: Add to `tailwind.config.js`:
   ```js
   accent: {
     DEFAULT: '#FFD633',
     50: '#FFFBEB', 100: '#FFF3C4', 200: '#FFE588',
     300: '#FFD633', 400: '#F5C518', 500: '#D4A017',
   }
   ```
   Use for: CTAs, achievement badges, highlighted stats, active states, notification dots.

6. **Formalize border radius scale**: Add to Tailwind config `borderRadius`:
   ```js
   'card': '1rem',    // ~rounded-2xl
   'panel': '1.5rem', // auth inputs
   'modal': '2rem',   // modals, large buttons
   'shell': '3rem',   // auth containers
   ```

7. **Standardize micro-text**: Create utility classes or a `<Label>` component:
   - `label-xs`: `text-[9px] font-black uppercase tracking-[0.3em]`
   - `label-sm`: `text-[10px] font-black uppercase tracking-[0.2em]`
   - `label-md`: `text-xs font-black uppercase tracking-widest`

#### Medium-Term (Component Extraction)

8. **Extract `<Button>` component** with variants: `primary`, `secondary`, `ghost`, `danger`, `teacher`. Single source of truth for all button styling.

9. **Extract `<Input>` component** with variants: `dark` (auth) and `light` (standard). Include built-in error/success state styling.

10. **Define heading hierarchy**: Map semantic levels to consistent sizes:
    - H1: `text-4xl font-black tracking-tighter`
    - H2: `text-2xl font-black tracking-tight`
    - H3: `text-xl font-bold`
    - H4: `text-lg font-bold`

#### Long-Term (Dark Mode & Aesthetic)

11. **Implement dark mode as default** for the main app shell. The auth screens prove the aesthetic works. Apply `bg-slate-950` body, `bg-white/5` panels, `border-white/10` borders across the entire post-login experience.

12. **Redesign Landing page** to match the dark/cinematic direction. The current light/minimal landing is fine for a startup, but disconnected from the product experience. Consider a "mission briefing" landing that previews the actual app aesthetic.

13. **Add a secondary display font** for data/telemetry elements: a monospace or condensed typeface (e.g., JetBrains Mono, IBM Plex Mono) for stats, timers, countdown displays, and code blocks.

---

---

## Phase 2 — Page-by-Page UI/UX Analysis

### 2.1 Component Quality Summary

| Component | LOC | Design (1-10) | Error Handling | A11y | Mobile | Top Issue |
|---|---|---|---|---|---|---|
| **Login.tsx** | 179 | **9** | Excellent | Fair | Good | No `<label>` elements |
| **SignUp.tsx** | 317 | **9** | Good | Fair | Good | Hardcoded access code |
| **TeachersDeck.tsx** | 207 | **8** | Good | Fair | Fair | Sidebar not collapsible on mobile |
| **DirectMessages.tsx** | 500 | 7 | Poor | Poor | Good | Global subscription, N+1 queries |
| **Landing.tsx** | 259 | 7 | N/A | Fair | Good | Non-functional beta form |
| **LibraryVault.tsx** | 353 | 6 | Poor | Poor | Fair | No error handling on ingestion |
| **ExamSession.tsx** | 816 | 6 | Partial | **Broken** | Fair | Inaccessible MCQ inputs |
| **ExamIntroPages.tsx** | 673 | 6 | N/A | Fair | Fair | 674-line switch/case |
| **Layout.tsx** | 394 | 5 | Poor | Poor | Good | Notification data leak |
| **MockTests.tsx** | 474 | 5 | Poor | Fair | Fair | Unhandled fetch errors |
| **Profile.tsx** | 809 | 5 | Partial | Poor | Fair | 809-line monolith |
| **MentorDashboard.tsx** | 619 | 5 | Partial | Poor | Fair | 3s artificial delay |
| **AIDeck.tsx** | 526 | 5 | Poor | Poor | Fair | No error handling on 3/5 tools |
| **TeachersLounge.tsx** | 83 | 5 | Poor | Fair | Good | Dead "Hire" button |
| **StudentStore.tsx** | 68 | 5 | **None** | Fair | Poor | No payment error handling |
| **StudyWall.tsx** | 970 | 4 | Poor | **None** | Fair | God component, zero a11y |
| **StudyRooms.tsx** | 793 | 4 | None | Poor | **Broken** | All mock data, broken mobile |

### 2.2 Page-by-Page Highlights

#### Landing (7/10)
The cleanest, most intentional design — white bg, bold COSTUDY hero, red CTAs, numbered feature boxes. Polished but **completely disconnected** from the dark cinematic product experience. The beta signup form collects email + invite code but **doesn't submit them** — it just calls `onGetStarted`. Social proof stats (847+ students, 23 countries) are hardcoded.

#### Auth Screens — Login & SignUp (9/10)
**The gold standard.** `bg-slate-950`, frosted glass containers (`bg-white/[0.03] backdrop-blur-3xl`), oversized `text-7xl` headings, animated glow orbs, mission-style copy ("Authorize Entry", "Neural Handshake"). Best error handling in the codebase — inline banners with slide-in animations. The entire app should aspire to this quality. Only issue: no `<label>` elements on any form input (WCAG failure).

#### TeachersDeck (8/10)
**Best visual design among views.** Dark `bg-slate-900`/`bg-slate-950` theme with emerald accents. The only view that looks like it belongs with the auth screens. Chat interface, tool sidebar, and content generation panels are clean and functional. Missing error handling on the generate action.

#### DirectMessages (7/10)
The sidebar uses `bg-[#0f172a]` — closest any main view gets to the dark aesthetic. Context-typed thread creation, signal level indicators, and smart action buttons are well-designed. The master-detail split works well on mobile. Critical bugs: global Supabase subscription (gets ALL messages for ALL users), missing loading UI, N+1 query performance bomb in chatService.

#### AIDeck (5/10)
Functional but visually generic. Light bg, white panels — no cinematic presence. Five tools (Chat, Notes, Flashcards, Topic Blueprint, Essay Auditor) all share a near-identical input→output layout that should be extracted into a shared `<ContentGenerator>` component. **No error handling on 3 out of 5 tools** — API failures leave UI in permanent loading state. No token counting or cost awareness for Gemini API.

#### StudyWall (4/10)
The most complex component (970 lines, 20+ state variables). Social feed with posts, comments, vouching, alignment requests, and peer audits. Uses `alert()` 6 times for user feedback. Three full-screen modals have **zero accessibility** — no focus traps, no ARIA roles, no keyboard dismiss. Silent error swallowing (`catch (err) {}`) throughout. Needs decomposition into 5+ sub-components.

#### StudyRooms (4/10)
**Most visually divergent component.** Uses purple/indigo accents instead of brand red — feels like a completely different app. The room detail view has a 288px fixed sidebar that **completely breaks on mobile** (no responsive handling). All 7 tab features use **hardcoded mock data** — no API integration. The Pomodoro timer counts UP from 0, never stops, and ignores its duration parameter. Fundamentally broken feature.

#### ExamSession (6/10)
Intentionally mimics Prometric testing center UI — appropriate for exam fidelity. Six distinct phases crammed into 816 lines. MCQ options are `<div onClick>` instead of radio inputs — **completely inaccessible to keyboard users**. Question loading has no error handling. Calculator UI is rendered but non-functional (no onClick handlers). Critical exam feature needs significant remediation.

#### Profile (5/10)
809-line monolith mixing profile display, edit form, CAN contracts, tracking radar, and boundary modal. The CAN network section has mission-style dark elements (`bg-slate-900`) but the rest is light. Several mutation handlers (`handleAcceptRequest`, `handleRejectRequest`, `handleBoundaryAction`) have **no try/catch** — errors silently dropped.

#### MentorDashboard (5/10)
The subdomain redirect splash screen is dark and cinematic — then transitions to a completely light dashboard. Forces a **3-second artificial delay** on every load. Revenue section shows hardcoded values (₹12,400, ₹84,200). Bounty creation is mock — no backend call. 619 lines with 6 tabs that should each be separate components.

### 2.3 UX Flow Analysis

#### Onboarding Flow: Landing → Sign Up → Profile Setup → First Room
- **Drop-off risk #1**: Landing (light, startup-minimal) → SignUp (dark, cinematic) is a jarring aesthetic shift
- **Drop-off risk #2**: Beta signup form on Landing doesn't work — email goes nowhere
- **Drop-off risk #3**: After signup, user lands on StudyWall (light) — the dark cinematic feel is instantly lost
- **Missing**: No guided first-time experience, no profile completion prompts, no suggested rooms

#### AI Mastermind Flow: Ask → AI Response → Follow-up → Save
- Works end-to-end for chat; follow-up context threading works
- **Friction**: No token counting or cost awareness — users have no idea of API costs
- **Friction**: Notes, flashcards, and topic blueprint tools have no error handling
- **Friction**: "Save to Vault" and "Export PDF" buttons are non-functional
- **Friction**: Conversation history is lost on page navigation

#### Study Session Flow: Join Room → Focus → Break → Resume
- **Broken**: Room detail view is entirely mock data
- Timer counts up, never stops, ignores duration
- No real-time presence or collaboration features
- The flow concept is good but implementation is non-functional

### 2.4 Cross-Cutting UX Issues

1. **`alert()` as primary feedback** — Used 12+ times across views. Should be replaced with inline toasts.
2. **Permanent loading spinners** — 12+ views can get stuck on loading forever due to missing try/catch on data fetching.
3. **No empty state consistency** — Some views have good empty states (DirectMessages), others show nothing (StudyRooms detail tabs).
4. **Zero accessibility on modals** — 8+ modals across the app lack focus traps, ARIA roles, and keyboard navigation.
5. **Inconsistent button styles** — 7+ button variants with no shared component; users see slightly different CTAs on every screen.

---

*Full technical analysis available in `costudy-technical-audit.md`.*  
*Full services and database analysis available in `costudy-services-audit.md`.*  
*Prioritized action plan available in `costudy-action-plan.md`.*
