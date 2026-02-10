# ESTABLISHED Design Co. - PRD

## Core Architecture
- Frontend: React (CRA) port 3000 | Backend: FastAPI port 8001 | DB: MongoDB
- Config: Runtime `config.js` → `window.ENV.REACT_APP_BACKEND_URL` (per-environment). Fallback: `process.env` (build-time)
- Priority: `window.ENV` > `process.env` > `window.location.origin`
- NEVER overwrite `window.ENV` if already set by config.js

## Implemented (Feb 10, 2026)
- Fixed "Project Not Found": MainDashboard hardcoded production URL + index.js overwrote window.ENV
- Fixed duplicate bottom nav bar: Pass `hideNavigation` from dashboards to CompletePageLayout
- Fixed Transfer Walkthrough→Checklist: quantity sent as '' instead of null (422 error)
- Fixed Transfer Checklist→FFE: status 'BLANK' → '', removed invalid order_index
- Removed misplaced search bar/buttons from MainContainer.js
- Photo management verified working
- Removed hardcoded SENDER_PASSWORD from backend/.env

## Key Config Files
- `/app/frontend/public/config.js` — Runtime backend URL (production: app.estdesignco.com)
- `/app/frontend/build/config.js` — Same for built assets
- `/app/frontend/src/index.js` — Guards `if (!window.ENV)` to not overwrite runtime config
- `/app/frontend/src/App.js` — BACKEND_URL resolution, sets window.ENV fallback

## Backlog
- P1: Wallpaper calculator, mobile parity, FFE add rooms/search
- P2: Google Calendar, room color consistency, paint workflow
- P3: Refactor ProjectDetailPage.js, Android app, Google Drive, Client Portal

## Login: DesignReady2026!
