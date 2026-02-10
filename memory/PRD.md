# ESTABLISHED Design Co. - Interior Design Project Management

## Original Problem Statement
Full-stack React/FastAPI/MongoDB application for interior design project management. 

## Core Architecture
- **Frontend**: React (CRA) at port 3000
- **Backend**: FastAPI at port 8001
- **Database**: MongoDB
- **Config**: Runtime `config.js` injects `window.ENV.REACT_APP_BACKEND_URL` (environment-specific). Fallback: `process.env.REACT_APP_BACKEND_URL` (build-time).

## What's Been Implemented (Feb 10, 2026)

### Critical Fixes
- **"Project Not Found" Fix**: 
  1. `MainDashboard.js` had hardcoded `https://app.estdesignco.com/api` — replaced with `window.ENV?.REACT_APP_BACKEND_URL`
  2. `index.js` was overwriting `window.ENV` (set by runtime config.js) with build-time preview URL — fixed with `if (!window.ENV)` guard
  3. Restored `<script src="/config.js">` in `index.html` — needed for runtime URL injection per environment
  4. Updated `config.js` in both `/public/` and `/build/` to point to production backend
- **Transfer Walkthrough→Checklist**: Fixed 422 error (quantity sent as empty string instead of null)
- **Transfer Checklist→FFE**: Fixed status field ('BLANK' → ''), removed invalid order_index
- **Removed Misplaced UI**: Non-functional search bar/buttons from MainContainer.js
- **Photo Management**: Verified working
- **GitHub Push**: Removed hardcoded SENDER_PASSWORD from backend/.env

## Key Config Notes
- `config.js` is the RUNTIME config — different per environment (preview vs production)
- `process.env.REACT_APP_BACKEND_URL` is BAKED IN at build time — always the preview URL
- Priority: `window.ENV` (runtime) > `process.env` (build-time) > `window.location.origin` (fallback)
- NEVER overwrite `window.ENV` if already set by config.js

## Prioritized Backlog

### P1 (High)
- [ ] Wallpaper calculator 4-wall verification
- [ ] Mobile app parity
- [ ] Add "Add Rooms" and Search Bar to FFE sheet

### P2 (Medium)  
- [ ] Google Calendar integration
- [ ] Room color consistency
- [ ] Paint workflow fixes

### P3 (Backlog)
- [ ] Refactor ProjectDetailPage.js
- [ ] Android app, Google Drive Backup, Client Approval Portal

## Key Files
- `/app/frontend/public/config.js` — Runtime backend URL config
- `/app/frontend/src/index.js` — Guards against overwriting window.ENV
- `/app/frontend/src/App.js` — BACKEND_URL resolution
- `/app/frontend/src/components/MainDashboard.js` — Dashboard project list
- `/app/frontend/src/components/ProjectDetailPage.js` — Project detail page

## Login: `DesignReady2026!`
