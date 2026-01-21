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
- **Chrome Extension**: Manifest V3 scraper

## What's Been Implemented

### Core Features
- ✅ Project CRUD with rooms, categories, subcategories, items
- ✅ Checklist spreadsheet with inline editing
- ✅ FFE spreadsheet with comprehensive tracking
- ✅ Chrome extension scraper (v7.24.0) with 26+ vendor support
- ✅ Samples Library with auto-sync based on finish_color + vendor
- ✅ To-Do list with comments, status dropdowns, FFE linking
- ✅ Punch list with comments and status tracking
- ✅ Materials library and master database
- ✅ Contact management
- ✅ Outlook Calendar integration (working)
- ✅ Background image removal (rembg)

### Recent Changes (Jan 21, 2026)
- ✅ **DUPLICATE Line Feature** - Added to checklist items
- ✅ **PLACEMENT Column** - Added for Tile/Countertops/Flooring categories
- ✅ **Scraper v7.24.0** - Higher resolution images, better tab reuse
- ✅ **Samples Library UI Redesign** - Large images
- ✅ **Comment Threads** - Added to To-Do and Punch list
- ✅ **Quantity Default** - Changed from "1" to blank

## Known Issues / Blockers

### P0 - Critical
- [ ] GitHub push blocked by secret scanning (user needs to resolve in repo settings)
- [ ] Production config sometimes shows test data (deployment process issue)
- [ ] Potential UI flickering (auto-refresh was removed, needs verification)
- [ ] Scraper price transfer reliability (improved, needs testing)
- [ ] Data loss reports (needs investigation)

### P1 - High
- [ ] Google Calendar integration broken
- [ ] Mobile app not updated with desktop features
- [ ] Background remover may be slow (model loading)

### P2 - Medium
- [ ] Multiple image scraping not implemented
- [ ] Priority Timer feature incomplete
- [ ] Enhanced rooms templates not applied

## File Structure
```
/app
├── backend/
│   ├── server.py              # Main API (17000+ lines)
│   ├── .env                   # Credentials (SMTP, MongoDB)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       ├── ExactChecklistSpreadsheet.js  # Checklist with duplicate/placement
│   │       ├── ExactFFESpreadsheet.js        # FFE tracking
│   │       ├── ToDoList.js                   # With comments
│   │       ├── PunchList.js                  # With comments
│   │       └── SampleTracker.js              # Large image redesign
│   └── .env
├── chrome-extension-scraper/
│   ├── manifest.json          # v7.24.0
│   ├── popup.js               # High-res images, tab reuse
│   └── content.js             # Page scraping
└── mobile/                    # NEEDS UPDATES
```

## Credentials
- **App Password**: `DesignReady2026!`
- **SMTP**: info@estdesignco.com (Outlook)

## Upcoming Tasks
1. Test duplicate and placement features
2. Test scraper v7.24.0
3. Fix email if broken
4. Port features to mobile app
5. Fix Google Calendar integration
6. Apply enhanced_rooms templates

## Future Backlog
- FFE Portrait/Landscape View for iPad
- Android mobile app
- Google Drive Backup
- Client Approval Portal
- Refactor monolithic server.py
