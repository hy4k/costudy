# CoStudy Development Workflow

## Overview

This document outlines the development workflow for CoStudy, enabling seamless work between your **local Windows machine** and **cloud server**.

---

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   LOCAL MACHINE     │         │    CLOUD SERVER     │
│   (Development)     │         │    (Production)     │
├─────────────────────┤         ├─────────────────────┤
│ • Code editing      │   Git   │ • Live deployment   │
│ • Testing           │ ──────► │ • Monitoring        │
│ • UI/UX iteration   │  Push   │ • Background tasks  │
│ • Fast feedback     │         │ • OpenClaw agent    │
└─────────────────────┘         └─────────────────────┘
         │                               │
         └───────────┬───────────────────┘
                     │
              ┌──────▼──────┐
              │   GitHub    │
              │ (hy4k/*)    │
              └─────────────┘
```

---

## Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| costudy | Frontend (React/TS) | https://github.com/hy4k/costudy.git |
| costudy-api | Backend API | https://github.com/hy4k/costudy-api.git |

---

## Daily Workflow

### 1. Start of Day (Local)

```powershell
# Navigate to workspace
cd C:\Users\USER\.openclaw\workspace

# Pull latest changes
cd costudy; git pull origin main; cd ..
cd costudy-api; git pull origin main; cd ..
```

### 2. Development Cycle (Local)

```powershell
# Start local dev server
cd costudy
npm run dev

# Make changes, test locally at http://localhost:5173
```

### 3. Commit & Deploy

```powershell
# Stage and commit changes
git add .
git commit -m "feat: description of changes"

# Push to GitHub (triggers Coolify deployment)
git push origin main
```

### 4. Verify Deployment (Server)

- Check https://costudy.in for frontend
- Check https://api.costudy.in/health for API

---

## Coolify Auto-Deploy Setup

Your Coolify should be configured to:

1. **Watch GitHub repos** for changes on `main` branch
2. **Auto-build** on push using Dockerfile
3. **Deploy** to respective domains

### Coolify Webhook (if not already set)

In each GitHub repo → Settings → Webhooks:
- URL: `https://your-coolify-domain/webhooks/github`
- Content type: `application/json`
- Events: `push`

---

## OpenClaw Sync Strategy

### Memory Files (Manual Sync)

Your OpenClaw memories are local to each instance. To maintain continuity:

**Option A: Git-based sync (Recommended)**

```powershell
# One-time setup: Create a private repo for workspace
cd C:\Users\USER\.openclaw\workspace
git init
git remote add sync https://github.com/hy4k/openclaw-workspace.git

# Daily sync (end of day)
git add memory/*.md MEMORY.md
git commit -m "sync: $(Get-Date -Format 'yyyy-MM-dd')"
git push sync main
```

**Option B: Cloud storage sync**

Use OneDrive/Dropbox to sync the `~/.openclaw/workspace/memory` folder.

---

## Quick Commands Reference

### Local Development

| Task | Command |
|------|---------|
| Start frontend dev | `cd costudy; npm run dev` |
| Build for production | `cd costudy; npm run build` |
| Run API locally | `cd costudy-api; node server.js` |
| Check git status | `git status` |
| Push changes | `git push origin main` |

### Server (via SSH)

| Task | Command |
|------|---------|
| Check deployments | `coolify status` |
| View logs | `coolify logs costudy` |
| Restart service | `coolify restart costudy` |
| OpenClaw status | `openclaw status` |

---

## Environment Variables

### Frontend (.env.production)

```env
VITE_COSTUDY_API_URL=https://api.costudy.in
VITE_SUPABASE_URL=https://supabase.fets.in
```

### Backend (Coolify Environment)

```env
SUPABASE_URL=https://supabase.fets.in
SUPABASE_SERVICE_ROLE_KEY=<your-key>
OPENAI_API_KEY=<your-key>
PORT=8080
```

---

## Troubleshooting

### Build fails on Coolify

1. Check build logs in Coolify dashboard
2. Verify all env vars are set
3. Try local build first: `npm run build`

### Changes not reflecting

1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache
3. Check Coolify deployment status
4. Verify git push succeeded

### CORS issues

1. Check API `allowedOrigins` in `server.js`
2. Verify Supabase CORS settings
3. Check browser console for specific errors

---

## Contacts & Resources

- **Live App**: https://costudy.in
- **API Health**: https://api.costudy.in/health
- **GitHub**: https://github.com/hy4k
- **Coolify**: Your server dashboard

---

*Last updated: 2026-02-09*
