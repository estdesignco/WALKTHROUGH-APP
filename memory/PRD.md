# EST Design Co - Product Requirements Document

## Original Problem Statement
Interior design project management application with checklist/FFE spreadsheets, sample tracking, web scraping, and client management features. Critical requirement: All fixes on desktop must be mirrored to mobile app.

## User Personas
- Interior designers managing multiple client projects
- Design team members tracking materials, finishes, and furnishings
- Clients reviewing project progress

## Core Requirements
1. **Stabilize Application** - Eliminate recurring bugs in data sync, samples, FFE transfer
2. **Fix Core Functionality** - Web scraper, To-Do/Punch lists, checklist features, paint color workflow
3. **Full Feature Parity** - Desktop and mobile must have identical features
4. **Resolve Blockers** - GitHub push (secrets in .env), deployment issues
5. **UI/UX Improvements** - Dynamic titles, feature consistency, remove obsolete buttons

## Architecture
- **Frontend:** React (web) + React Native/Expo (mobile)
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Deployment:** Containerized (Docker/Kubernetes)

## Current Session Progress (Feb 4, 2026)

### Completed ✅
- [x] Fixed regex error in `/api/fix-sample-images` and `/api/sync-samples-to-master` endpoints
  - Root cause: Paint colors with parentheses like "Pure White (SW 7005)" broke MongoDB regex
  - Fix: Added `re.escape()` to escape special characters in sample names/colors
- [x] Created `/api/sync-samples-to-master` endpoint alias

### In Progress 🔄
- [ ] Paint color selection workflow (doesn't create sample or populate vendor info)
- [ ] Paint samples missing visual swatch/color chip images
- [ ] GitHub push blocked by `SENDER_PASSWORD` in backend/.env

### P1 Features (Upcoming)
- [ ] Complete Photo Management for Checklist & FFE Dashboards
- [ ] Add "Add Room" and Search functionality to FFE sheet
- [ ] Mirror all UI changes to mobile app

### P2 Verification (Pending)
- [ ] Verify Outlook Calendar after secret updates
- [ ] Confirm performance improvements resolved slow loading

### Backlog
- [ ] Complete Google Calendar integration
- [ ] Refactor `ExactChecklistSpreadsheet.js` into smaller components
- [ ] Android app build
- [ ] Google Drive backup feature
- [ ] Client Approval Portal

## Key Files
- `/app/backend/server.py` - Main backend logic, API endpoints
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Main checklist component
- `/app/frontend/src/components/SampleTracker.js` - Sample library display
- `/app/frontend/src/components/PaintColorAutocomplete.js` - Paint color selection
- `/app/mobile/` - Mobile app (React Native/Expo)

## Critical Notes
- Backend code is shared between desktop and mobile via the same API
- `SENDER_PASSWORD` in backend/.env must be removed to unblock GitHub pushes
- Data synchronization between items and samples is a frequent bug source
