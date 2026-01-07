# Interior Design Application - Product Requirements Document

## Original Problem Statement
Build a deployment-ready interior design application with a Chrome Extension web scraper that reliably extracts product data (name, sku, price, size, finish_color, finish_image) from 22+ vendor websites.

## Core Requirements

### P0 - Critical
1. **Chrome Extension Web Scraper** - Must work for all 22 vendor sites
   - **v7.8.2 CURRENT** - Added REMARKS field, Reverse Selection, Background Removal

## Changelog

### January 7, 2026 - Comprehensive Testing & Bug Fixes
- **COMPREHENSIVE PIER-TO-PIER TESTING COMPLETED**
  - 90% backend test pass rate (38/42 tests)
  - 100% frontend test pass rate
  - All 134 Master Contacts verified present and NOT disappearing
  - All dashboard tabs (Deliveries, Shipping, Critical Path) receiving data correctly
  
- **NEW: Whole Home Finishes Tab**
  - Added dedicated tab to ProjectDetailPage (26 total tabs now)
  - Sections: Door Hardware, Paint, Flooring, Electrical, Plumbing, Custom Sections
  - Backend endpoints: GET/POST `/api/projects/{id}/whole-home-finishes`
  
- **Bug Fixes:**
  - Added "CHANGE OUT" status to ItemStatus enum (now 36 total statuses)
  - Data flow from spreadsheets to dashboard tabs verified working
  - Transfer to FFE functionality verified (via Sync buttons in Checklist)
  
- **Testing Agent Results (iteration_15.json):**
  - Master Contacts: 134 contacts, CRUD operations work
  - Projects: 3 projects, full CRUD working
  - FFE Spreadsheet: 187 items, REMARKS and INSTALL NOTES columns present
  - Deliveries tab: Shows 1 item awaiting delivery (data flowing correctly)
  - Shipping tab: Shows 1 item tracked with status cards
  - Critical Path: Shows 1 item ordered
  - All export endpoints return valid HTML
  - Chrome extension download: 38KB zip file

### v7.8.2 (January 6, 2026)
- **Fixed**: Reverse Selection Mode now works correctly
- **Added**: REMARKS field to scraper panel
- **Added**: Reverse Selection Mode (highlight text → click field)
- **Added**: REMARKS column to FFE spreadsheet
- **Added**: INSTALL NOTES column to FFE spreadsheet (editable, green highlight)

### v7.7.6-7.7.8 (January 5, 2026)
- **Added**: ✨ No Background button for AI-powered background removal
- Uses rembg (open source, no API key needed)
- Backend endpoint: POST /api/remove-background

### v7.7.4-7.7.5 (January 5, 2026)
- **Fixed**: Copy Image and Copy Link buttons with robust fallbacks

## Current Application Status

### Working Features ✅
- **Master Contacts Page**: 134 contacts, full CRUD operations
- **Projects Dashboard**: 3 projects, full CRUD
- **FFE Spreadsheet**: 187 items with REMARKS and INSTALL NOTES columns
- **Checklist Spreadsheet**: Transfer to FFE via Sync buttons
- **Walkthrough Spreadsheet**: Working
- **Deliveries Tab**: Receiving data from items (1 item awaiting delivery)
- **Shipping Tab**: Receiving data (1 item tracked)
- **Critical Path Tab**: Receiving data (1 item ordered)
- **Exports Tab**: Electrician Sheet, Load-In Sheets, Mover's FFE Sheet, Customer Sheets
- **Calendar Events**: Working at `/api/calendar-events`
- **Mobile App**: Correct branding and features
- **Questionnaire**: Save and retrieve working
- **Chrome Extension**: v7.8.2 with all features
- **Background Removal**: Working via rembg
- **Whole Home Finishes**: NEW dedicated tab

### Item Statuses (36 total)
- Planning: TO BE SELECTED, RESEARCHING, PENDING APPROVAL
- Procurement: APPROVED, ORDERED, PICKED, CONFIRMED
- Fulfillment: IN PRODUCTION, SHIPPED, IN TRANSIT, OUT FOR DELIVERY
- Delivery: DELIVERED TO RECEIVER, DELIVERED TO JOB SITE, RECEIVED
- Installation: READY FOR INSTALL, INSTALLING, INSTALLED
- Exceptions: ON HOLD, BACKORDERED, DAMAGED, RETURNED, CANCELLED, CHANGE OUT
- Checklist: ORDER SAMPLES, SAMPLES ARRIVED, ASK NEIL, ASK CHARLENE, ASK JALA, GET QUOTE, WAITING ON QT, READY FOR PRESENTATION

## PWA Mobile App (iPad)
- **Version**: 1.0.0
- **App Name**: ESTABLISHED Design Co.
- **Capacitor Project**: Created in `/app/frontend/ios/`
- **Features**: Projects, Photos, Measure, Sync tiles, Offline mode

## Test Results (January 7, 2026)
- **Backend**: 90% (38/42 tests passed)
- **Frontend**: 100% (all pages load correctly)
- **Test Report**: `/app/test_reports/iteration_15.json`
- **Comprehensive Test File**: `/app/tests/test_comprehensive_interior_design.py`

## Prioritized Backlog

### P0 - Next Items
1. ✅ Data flow to dashboard tabs (FIXED - verified working)
2. ✅ Contacts not disappearing (VERIFIED - 134 contacts stable)
3. ✅ Whole Home Finishes tab (IMPLEMENTED)
4. Teams notifications testing (NEEDS WEBHOOK_URL configured)

### P1 - High Priority
- Build and test native iOS app on iPad (Capacitor project ready)
- Enhance export sheets with all images
- End-to-end test of Transfer to FFE workflow

### P2 - Future
- [ ] Google Drive Backup feature
- [ ] Android version of mobile app
- [ ] Canva API Integration (BLOCKED - Canva strips hyperlinks)
- [ ] Client Approval Portal
- [ ] Product Library Frontend
- [ ] Backend refactoring (split server.py into modules)

## Architecture

```
/app
├── backend/
│   ├── server.py             # Monolithic FastAPI server with all endpoints
│   ├── teams_integration.py  # Teams notification logic
│   └── contacts_api.py       # Contacts router
├── frontend/
│   ├── build/                # React production build for Capacitor
│   ├── ios/                  # Capacitor iOS native project
│   └── src/
│       └── components/
│           ├── ProjectDetailPage.js  # 26 tabs including Whole Home Finishes
│           ├── WholeHomeFinishes.js  # NEW dedicated component
│           ├── MasterContactsPage.js # Master contacts UI
│           └── ... (100+ components)
└── chrome-extension-scraper/
    └── content.js            # v7.8.2 scraper
```

## API Endpoints Reference

### Contacts
- `GET /api/master/contacts` - Returns 134 master contacts
- `POST /api/master/contacts` - Create contact, returns {success, contact}
- `PUT /api/master/contacts/{id}` - Update contact
- `DELETE /api/master/contacts/{id}` - Delete contact
- `GET /api/contacts` - Get project contacts

### Projects & Spreadsheets
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}?sheet_type=ffe|checklist|walkthrough` - Get spreadsheet
- `GET /api/projects/{id}/whole-home-finishes` - Get whole home finishes
- `POST /api/projects/{id}/whole-home-finishes` - Save whole home finishes

### Dashboard Data
- `GET /api/deliveries/{project_id}` - Items awaiting delivery
- `GET /api/items/with-tracking/{project_id}` - Shipping tracking
- `GET /api/calendar-events` - Calendar events

### Exports
- `POST /api/exports/{id}/electrician-sheet` - HTML export
- `POST /api/exports/{id}/load-in-sheets` - HTML export
- `POST /api/exports/{id}/movers-ffe` - HTML export

### Other
- `GET /api/download/chrome-extension` - 38KB zip
- `POST /api/remove-background` - AI background removal
- `GET /api/item-statuses` - 36 statuses including CHANGE OUT
