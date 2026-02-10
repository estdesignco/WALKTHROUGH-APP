# ESTABLISHED Design Co. - PRD

## Core Architecture
- Frontend: React (CRA) port 3000 | Backend: FastAPI port 8001 | DB: MongoDB
- Config: Runtime `config.js` → `window.ENV.REACT_APP_BACKEND_URL` (per-environment)
- Priority: `window.ENV` > `process.env` > `window.location.origin`
- NEVER overwrite `window.ENV` if already set by config.js

## Implemented (Feb 10, 2026)
- Fixed "Project Not Found": MainDashboard hardcoded production URL + index.js overwrote window.ENV
- Fixed duplicate bottom nav bar: Pass hideNavigation from dashboards to CompletePageLayout  
- Fixed To-Do toggle: completed flag was always false when toggling to done status
- Fixed Transfer Walkthrough→Checklist: quantity '' → null (422 error)
- Fixed Transfer Checklist→FFE: status 'BLANK' → '', removed order_index
- Removed misplaced search bar/buttons from MainContainer.js
- Photo management verified working
- Removed hardcoded SENDER_PASSWORD from backend/.env

## All Backend APIs Verified Working
Projects, Todos (create/update/delete/comments), Samples, Calendar, Questionnaire, Company Todos, Item Statuses, Walkthrough/Checklist/FFE rooms, Shipping tracking

## Key Config
- `/app/frontend/public/config.js` — Runtime URL (production: app.estdesignco.com)
- `/app/frontend/src/index.js` — Guards `if (!window.ENV)` 
- All components use `window.ENV?.REACT_APP_BACKEND_URL || window.location.origin`

## Backlog
- P1: Wallpaper calculator, mobile parity, FFE add rooms/search
- P2: Google Calendar, room color consistency, paint workflow
- P3: Refactor ProjectDetailPage.js, Android app, Google Drive, Client Portal

## Login: DesignReady2026!
