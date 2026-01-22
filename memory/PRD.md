# Design Ready - Interior Design Management System

## Original Problem Statement
Build a comprehensive interior design management application for EST Design Co. with features including:
- Project management with checklist and FFE (Furniture, Fixtures & Equipment) tracking
- Chrome extension scraper for capturing product data from vendor websites
- Mobile-responsive walkthrough for site visits
- Email questionnaire system for clients
- Calendar integration (Outlook/Google)
- Materials and samples library
- To-Do and Punch list management
- Client approval portal

## User's Priority Concerns
1. **Application Stability** - No data loss, no crashes, no UI flickering
2. **Core Features Working** - Scraper price transfer, email, samples library
3. **Feature Parity** - Desktop and mobile apps must have same features
4. **Performance** - App must be FAST, not slow

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Chrome Extension**: Manifest V3 scraper (v7.27.0)
- **Mobile**: React Native + Expo

## What's Been Implemented

### Core Features ✅
- Project CRUD with rooms, categories, subcategories, items
- Checklist spreadsheet with inline editing
- FFE spreadsheet with comprehensive tracking
- Chrome extension scraper (v7.27.0) with 26+ vendor support + multi-image gallery
- Samples Library with auto-sync based on finish_color + vendor
- To-Do list with comments, status dropdowns, FFE linking, Timed Priority badges
- Punch list with comments and status tracking
- Materials library and master database
- Contact management
- Outlook Calendar integration (working)
- Google Calendar integration (functional - needs OAuth setup)
- Background image removal (rembg)

### Session Changes (Jan 22, 2026)

#### P0 Fixes - COMPLETED ✅
1. ✅ **DONE Items Sort to Bottom** - All To-Do and Punch lists now sort completed items to bottom
   - `ToDoList.js` - Project To-Do list sorting
   - `PunchList.js` - Project Punch list sorting
   - `MasterToDoList.js` - Company todos, project todos, and punch items sorting
   - `ToDoListScreen.js` (mobile) - Mobile To-Do list sorting
   - `PunchListScreen.js` (mobile) - Mobile Punch list sorting

2. ✅ **Scraper Multi-Image Gallery (v7.27.0)** - Added multi-image selection to content.js
   - Collects ALL product images from page (srcset, data attributes, gallery selectors)
   - Displays thumbnail gallery below scraped data
   - Click to select/deselect images
   - Shows selected count
   - Primary image marked with ★

#### P1 Fixes - COMPLETED ✅
3. ✅ **Timed Priority Feature** - Already implemented and working
   - Shows age-based urgency badges on To-Do items
   - 🆕 New (< 1 hour) - Green
   - 🕐 Xh old (1-24 hours) - Blue
   - ⏰ Xd old (1-3 days) - Yellow
   - ⚠️ Xd - Aging (3-7 days) - Orange
   - 🔥 Xd - CRITICAL (7+ days) - Red with pulse animation
   - Hidden for completed items

4. ✅ **Google Calendar Integration** - Enhanced and functional
   - `/api/auth/google/status` - Check connection status
   - `/api/auth/google/login` - Initiate OAuth flow
   - `/api/auth/google/callback` - Handle OAuth callback
   - `/api/calendar/google/sync/{project_id}` - Sync project dates (delivery, installation, completion)
   - Token refresh logic implemented
   - Frontend shows connected email in UI

### Previous Session Changes (Jan 21, 2026)
- DUPLICATE Line Feature for checklist items
- PLACEMENT Column for Tile/Countertops/Flooring categories
- Scraper v7.24.0 with higher resolution images
- Teams notifications refactored (only for new items)
- Checkbox decoupled from status dropdown
- Status dropdowns standardized across all lists
- Mobile app feature parity (To-Do, Punch List, Samples screens)
- Client appointment booking via Outlook

## Known Issues / Status

### Resolved ✅
- To-Do/Punch list sorting (DONE items at bottom) - WORKING
- Timed Priority badges visible - WORKING
- Google Calendar endpoints - WORKING (needs user OAuth setup)
- Scraper multi-image gallery - IMPLEMENTED (v7.27.0)
- Checklist DUPLICATE line feature - WORKING
- PLACEMENT column for Tile/Countertops/Flooring - WORKING
- Scraper high-res images - WORKING
- Mobile app feature parity - COMPLETE

### Pending User Action
- [ ] Google Calendar OAuth - User needs to connect via app settings
- [ ] Azure credentials for Outlook booking - User needs to provide

### Known Limitations
- [ ] Application performance ("snails pace") - Not yet investigated
- [ ] GitHub push blocked by secret scanning - User needs to remove SENDER_PASSWORD from .env

## File Structure
```
/app
├── backend/
│   ├── server.py              # Main API - Updated with Google Calendar sync
│   ├── .env                   # Credentials (SMTP, MongoDB, OAuth)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       ├── ExactChecklistSpreadsheet.js  # Duplicate button, Placement column
│   │       ├── ToDoList.js                   # UPDATED: Sorting, Timed Priority
│   │       ├── PunchList.js                  # UPDATED: Sorting
│   │       ├── MasterToDoList.js             # UPDATED: Sorting
│   │       └── ExportsDashboard.js           # UPDATED: Google Calendar UI
├── chrome-extension-scraper/
│   ├── manifest.json          # v7.27.0
│   ├── content.js             # UPDATED: Multi-image gallery
│   └── popup.js
└── mobile/
    └── src/screens/
        ├── ToDoListScreen.js    # UPDATED: Sorting
        └── PunchListScreen.js   # UPDATED: Sorting
```

## API Endpoints Added/Modified
- `GET /api/auth/google/status` - Check Google Calendar connection
- `GET /api/auth/google/login` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/calendar/google/sync/{project_id}` - Sync project to Google Calendar

## Test Reports
- `/app/test_reports/iteration_30.json` - Latest test results (all passing)
- `/app/tests/test_calendar_endpoints.py` - Google Calendar endpoint tests

## Upcoming Tasks
1. [ ] Investigate app performance issues
2. [ ] Guide user to connect Google Calendar OAuth
3. [ ] Guide user on Azure credentials for Outlook booking
4. [ ] Test scraper multi-image feature in real Chrome extension

## Future/Backlog
- Refactor server.py (17000+ lines - needs splitting)
- Build Android version of mobile app
- Google Drive Backup feature
- Client Approval Portal
