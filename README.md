# CoStudy - AI-Driven Collaborative Learning Platform

## Vision
A CMA US-first learning operating system that combines AI tutoring, guided practice, collaborative study, and progress intelligence for learners launching from Kerala, proving in India, and scaling globally.

## Launch Focus
- **Initial market:** CMA US only
- **Preferred public website:** costudy.in
- **Positioning:** Learning operating system, not just a course website
- **Scale path:** Launch from Kerala, prove in India, then scale globally

## Core Features

### 1. CMA US AI Study Partner
- Personalized doubt clearing for CMA US Part 1 and Part 2 topics
- Guided explanations across planning, performance, analytics, controls, finance, decision analysis, and ethics
- Prototype adaptive-learning loops based on learner progress

### 2. Collaborative Study
- Virtual study rooms
- Peer matching based on subjects/goals
- Real-time collaboration tools

### 3. CMA US Exam Preparation
- Practice flows for CMA US topic mastery
- Performance analytics for weak-area discovery
- Personalized study-plan direction for Part 1 and Part 2

### 4. Progress Tracking
- Dashboard with learning metrics
- Goal setting and tracking
- Achievement system


## Local Browser Check
Run the app locally with:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173/`.

To check the production preview:

```bash
npm run build
npm run preview
```

Then open `http://localhost:4173/`.

If you are using a hosted workspace, open the forwarded port for `5173` during development or `4173` during preview.

## Current App / Planned Stack
- **Current frontend:** React + JavaScript + TailwindCSS
- **Current build tool:** Vite
- **Planned backend/auth:** Node.js + Supabase; no specific infrastructure constraint is currently specified
- **Planned AI:** provider integration is not yet implemented in this repo; no specific provider constraint is currently specified

## Operating Model
Stage 01 orchestration is documented in `docs/orchestration/stage-01.md`. It defines the CMA US-first scope, multi-agent workstreams, isolation rules, and CHECK-WORK verification expectations.

## Target Users
- CMA US learners in the initial launch segment
- Commerce, accounting, and finance students/professionals preparing for CMA US
- Kerala-first early adopters, with India and global expansion planned after validation

## Design
- Premium, clean interface
- FETS Yellow accent color
- Mobile-first responsive design

## Next Steps
- [ ] Apply Stage 01 orchestration model from `docs/orchestration/stage-01.md`
- [ ] Set up Supabase project
- [ ] Build authentication
- [ ] Create AI chat interface
- [ ] Add collaborative features
- [ ] Deploy to costudy.in
