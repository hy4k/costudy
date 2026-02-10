# USER.md - About Your Human

- **Name:** Midhun
- **What to call them:** Midhun
- **Timezone:** GMT+5:30 (India)
- **Notes:** Founder/developer of CoStudy

## Context

Building **CoStudy** — an AI-powered educational social network for CMA US students.

### Tech Stack
- **Frontend:** React/TypeScript, built in AI Studio, deployed via Coolify
- **Backend:** Supabase + custom API
- **Infra:** Hostinger VPS, Coolify for deployment
- **AI/RAG:** pgvector, embeddings, page-based chunking

### Repos
- Frontend: https://github.com/hy4k/costudy.git
- Backend API: https://github.com/hy4k/costudy-api.git

### Live Sites
- App: https://costudy.in/
- API: https://api.costudy.in/

### Current State (as of 2026-02-06)
- 39,914 chunks loaded into Supabase (96/102 PDFs indexed)
- RAG pipeline: page-based chunking + embeddings + pgvector
- Storage bucket: study-materials
- Table: document_sections
- RPC: match_documents

### Immediate Goals
- Connect frontend (AIDeck.tsx) to backend API
- Add chunk_type (mcq_question / mcq_answer / essay / other)
- Add question_no field where possible
- Essay handling: use MCQ knowledge as backbone + AI generation/evaluation
