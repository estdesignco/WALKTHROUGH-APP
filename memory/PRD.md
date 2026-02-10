# ESTABLISHED Design Co. - PRD

## Core Architecture
- Frontend: React (CRA) port 3000 | Backend: FastAPI port 8001 | DB: MongoDB
- Config: Runtime `config.js` → `window.ENV.REACT_APP_BACKEND_URL`
- Priority: `window.ENV` > `process.env` > `window.location.origin`

## Implemented (Feb 10, 2026)
- Multi-room bulk delete: Select rooms via checkboxes, one confirm prompt for all
- No per-room delete confirmation prompts
- Fixed To-Do toggle (completed flag)
- Fixed "Project Not Found" (hardcoded URL + window.ENV overwrite)
- Fixed duplicate bottom nav bar
- Fixed transfers (Walkthrough→Checklist, Checklist→FFE)
- Removed misplaced search bar
- Photo management verified

## Backlog
- P1: Wallpaper calculator, mobile parity, FFE add rooms/search
- P2: Google Calendar, room color consistency, paint workflow
- P3: Refactor ProjectDetailPage.js, Android app

## Login: DesignReady2026!
