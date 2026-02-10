# ESTABLISHED Design Co. - Interior Design Project Management

## Original Problem Statement
Full-stack React/FastAPI/MongoDB application for interior design project management. Manages walkthrough items, checklists, FF&E (Furniture, Fixtures & Equipment) tracking, photos, and project workflows.

## Core Architecture
- **Frontend**: React (Create React App) at port 3000
- **Backend**: FastAPI at port 8001
- **Database**: MongoDB
- **Config**: `process.env.REACT_APP_BACKEND_URL` (set in `.env`, used via `window.ENV` pattern)

## What's Been Implemented

### Phase 1 - Critical Fixes (Feb 10, 2026)
- **"Project Not Found" Fix**: `MainDashboard.js` had hardcoded production URL `https://app.estdesignco.com/api`. Dashboard fetched production projects but detail pages used environment backend. Fixed to use `process.env.REACT_APP_BACKEND_URL`.
- **Environment Config Fix**: Removed hardcoded `config.js` injection from `index.html`, moved to `process.env.REACT_APP_BACKEND_URL` in App.js. `window.ENV` set from build-time env vars.
- **Transfer Walkthrough→Checklist**: Fixed 422 errors caused by sending `quantity: ''` (empty string) instead of `null`.
- **Transfer Checklist→FFE**: Fixed `status: 'BLANK'` (invalid enum) → `''`, removed invalid `order_index` field.
- **Removed Misplaced UI**: Removed non-functional search bar, Export FF&E, and Spec Sheet buttons from `MainContainer.js`.
- **Photo Management**: Verified working - collapsible section, room folder click opens PhotoManagerModal.
- **GitHub Push Fix**: Removed hardcoded `SENDER_PASSWORD` value from `backend/.env`.

### Previously Implemented (Prior Sessions)
- Backend regex safety (`safe_regex()` helper)
- Dropdown navigation in `ProjectDetailPage.js`
- 4-wall wallpaper calculator
- Collapsible photo sections with consistent colors
- Editable scraper UI fields
- WholeHomeFinishes page with PASTE button
- Mobile app color and photo updates

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Fix "Project Not Found" (hardcoded production URL in MainDashboard)
- [x] Fix preview environment config
- [x] Fix Walkthrough→Checklist transfer
- [x] Fix Checklist→FFE transfer
- [x] Fix photo adding to rooms
- [x] Remove misplaced search bar

### P1 (High)
- [ ] Wallpaper calculator 4-wall verification
- [ ] Room colors matching between Photos section and spreadsheet
- [ ] Photo section consistency across all dashboards
- [ ] Scraper UI editable fields verification
- [ ] WholeHomeFinishes page verification
- [ ] Mobile app parity for all changes
- [ ] Add "Add Rooms" and Search Bar to FFE sheet

### P2 (Medium)
- [ ] Google Calendar integration completion
- [ ] Outlook Calendar verification
- [ ] Performance optimization verification
- [ ] Paint color selection workflow fix
- [ ] Paint samples visual swatch

### P3 (Backlog)
- [ ] Refactor ProjectDetailPage.js (1100+ lines)
- [ ] Android app
- [ ] Google Drive Backup
- [ ] Client Approval Portal

## Key Files
- `/app/frontend/src/components/MainDashboard.js` - Dashboard (was hardcoded to production URL)
- `/app/frontend/src/App.js` - Backend URL config
- `/app/frontend/src/components/SimpleWalkthroughSpreadsheet.js` - Walkthrough with transfer
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Checklist with FFE transfer
- `/app/frontend/src/components/ProjectDetailPage.js` - Project detail with dropdown nav
- `/app/frontend/src/components/MainContainer.js` - Page layout container (cleaned up)
- `/app/backend/server.py` - All API endpoints

## Login Credentials
- Password: `DesignReady2026!`
