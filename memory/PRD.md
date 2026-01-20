# Interior Design Management System - PRD

## Original Problem Statement
Full-stack interior design project management application with multiple spreadsheets (FFE, Checklist, Walkthrough), task management (To-Do, Punch List, Company Tasks), and Microsoft Teams integration.

## 🚀 LATEST SESSION - January 20, 2026 (Continued)

### ALL FIXES IMPLEMENTED THIS SESSION:

#### 1. CHECKBOX STATUS FIX ✅
- Checkbox now stays checked for PICKED and ALL post-picked statuses
- Statuses: PICKED, ORDER SAMPLES, SAMPLES ORDERED, SAMPLES ARRIVED, GET QUOTE, WAITING ON QT, READY FOR PRESENTATION, ENTER INTO HOUZZ

#### 2. COST/PRICE FIELD EDITABLE ✅
- Changed from contentEditable div to proper input field
- Click to edit, Enter or blur to save

#### 3. ADD ITEM = BLANK ROW ✅
- "+ Add Item" now adds empty row directly
- No modal, no form - just blank line ready for input

#### 4. REMOVED "ARE YOU SURE" CONFIRMATIONS ✅
- Delete now happens immediately (items, categories, subcategories, to-dos, projects)

#### 5. IMAGE UPLOAD FOR ITEMS ✅
- Manual image upload when scraper fails
- Click 📷 icon to upload from device
- Hover existing image to replace

#### 6. REMARKS FIELD FIXED ✅
- Changed to proper input field
- Saves on blur or Enter

#### 7. COPY ROOM ✅
- "📋 Copy" button on room headers
- Copies room with all categories, subcategories, and items

#### 8. "SAMPLES ORDERED" STATUS ✅
- Added to status dropdown in checklist

#### 9. CLIENT NAME IN HEADER ✅
- Changed from "CHECKLIST - GREENE" to actual client name

#### 10. DELETE MULTIPLE ✅
- "🗑️ Delete Multiple" button in toolbar
- Select items with checkboxes, then bulk delete

#### 11. TO-DO COMMENTS & STATUS ✅
- Status dropdown (Pending/Working/Done) visible directly
- Notes/Comments field when editing
- Notes displayed in view mode

#### 12. FILES DISAPPEARING FIX ✅
- Added cache-busting headers to ALL API calls
- Timestamp added to GET requests

#### 13. EMAIL CLIENT FIX ✅
- Corrected API endpoint from `/api/send-questionnaire-email` to `/api/send-questionnaire`
- Fixed request body format

#### 14. SCRAPER v7.21.0 ✅
- Improved price detection with vendor-specific logic
- Better data transfer with explicit null checks
- Debug logging for troubleshooting

### FILES MODIFIED:
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Multiple fixes
- `/app/frontend/src/components/GlobalToDoModal.js` - Comments, status dropdown
- `/app/frontend/src/components/MainDashboard.js` - Email fix
- `/app/frontend/src/components/CustomerfacingLandingPage.js` - Email fix
- `/app/frontend/src/components/ChecklistDashboard.js` - Client name header
- `/app/frontend/src/components/ChecklistSheet.js` - Client name header
- `/app/frontend/src/App.js` - Cache-busting headers
- `/app/backend/server.py` - Copy room endpoint, SAMPLES ORDERED status, image upload
- `/app/chrome-extension-scraper/popup.js` - v7.21.0 price fixes
- `/app/chrome-extension-scraper/manifest.json` - Version bump

---

## PREVIOUS SESSION WORK:

### GLOBAL TO-DO MODAL - COMPLETE ✅

**New GlobalToDoModal Component Features:**
1. **Large Modal on Same Page** - Opens as full-page overlay, NO navigation away
2. **Alternating Row Colors** - Similar tones for better readability (purple shades for company, brown shades for projects)
3. **Direct Inline Editing** - Click on any task text to edit:
   - Text field
   - Priority dropdown (Low/Medium/High/Urgent)
   - Assignee field
   - Deadline date picker
   - Save/Cancel buttons
4. **Quick Add Form** - "+ Add Task" button shows immediate form at top
5. **Available from ANY Page**:
   - Via sidebar To-Do icon
   - Via `window.openGlobalTodo()` function
   - Via keyboard shortcut: Ctrl/Cmd + T
   - Via clicking any to-do panel on dashboard
6. **Tabs**: All / Company / Projects with counts
7. **Pending counts** on section headers
8. **Status circle toggle** - Click to cycle through: pending → in_progress → completed

### Files Created/Modified:
- `/app/frontend/src/components/GlobalToDoModal.js` - NEW: Global to-do modal component
- `/app/frontend/src/App.js` - Added global modal state and keyboard shortcuts
- `/app/frontend/src/components/MainDashboard.js` - Simplified, removed local modal, uses global modal

### Previous Session Work:
- Dashboard UI with Houzz-inspired sidebar layout
- Performance optimizations (N+1 query fixes)
- Scraper "white screen" bug fix
- Outlook Calendar integration working
- Scraper extension v7.18.0 with tab reuse and background removal

---

## 🚀 PREVIOUS SESSION - January 18, 2026

### WALKTHROUGH & ROOM FIXES ✅

1. **Checkbox Uncheck Fix** - Walkthrough checkboxes now properly toggle on/off
   - Removed `|| item.status === 'PICKED'` condition that prevented unchecking

2. **Quantity Column Removed** - QTY column removed from Walkthrough spreadsheet as requested

3. **New Item Cells Now BLANK** - Adding new items creates blank rows instead of "NEW ITEM"

4. **Add Room Modal Updated** - Now includes ALL questionnaire rooms:
   - Living Spaces: Living Room, Family Room, Great Room, Den, Sunroom, Screened Porch
   - Bedrooms: Primary, Guest, Children's, Nursery, Bedroom 2/3/4
   - Bathrooms: Primary, Guest, Half, Powder Room, Jack and Jill, Pool Bathroom
   - Kitchen: Kitchen, Pantry, Butler's Pantry, Scullery, Breakfast Nook
   - Work Spaces: Home Office, Study, Library, Craft Room, Art Studio, Workshop
   - Entertainment: Bar Area, Wine Cellar, Home Theater, Media Room, Game Room
   - Outdoor: Patio, Deck, Outdoor Kitchen, Pool House, Cabana, Porches, Balcony, Terrace

5. **TRUE OUTDOOR FURNITURE Category Created** - New outdoor room template with:
   - Outdoor Lighting (path lights, string lights, landscape, wall lanterns)
   - Outdoor Furniture (sectionals, dining sets, loungers, hammocks, fire pit tables)
   - Outdoor Structures (umbrellas, pergolas, fire pits, water features)
   - Outdoor Kitchen (grills, refrigerators, sinks, pizza ovens)
   - Landscaping & Planters

### Previous Fixes (January 16-17):
- Dashboard Loading Bug FIXED
- Chrome Extension v7.15.0 updated for production
- Comprehensive E2E Testing completed

---

## 🚀 LAUNCH READINESS - January 12, 2026

### TEST RESULTS: 100/100 PASSED ✅

**Backend API Tests:** 23/23 (100%)
**Frontend UI Tests:** 100%
**Mobile App Tests:** 100%

### All Pathways Verified:
1. ✅ Scraper → Checklist (PASTE column, 73+ buttons)
2. ✅ Status CHANGE OUT/GET QUOTE/ORDER SAMPLES → Auto-create To-Do
3. ✅ Status ORDERED/RECEIVED/INSTALLED/COMPLETE/DELIVERED/SAMPLES ARRIVED/PICKED → Auto-complete To-Do → Remove highlight
4. ✅ Master To-Do List - ALL identifiers (room, category, item, vendor, SKU, spreadsheet type, link icon)
5. ✅ To-Do checked off → Highlight removed from Checklist (5-second sync)
6. ✅ Punch List completed → Highlight removed
7. ✅ Delete operations working (To-Do, Punch, Items)
8. ✅ Mobile App - All tabs, identifiers, sync working
9. ✅ Live Sync - Desktop ↔ Mobile

### Chrome Extension v7.14.0 (January 15, 2026)
Download: https://apprescue-deploy.preview.emergentagent.com/chrome-extension-scraper.zip

**New in v7.14.0: Quick Paste URL**
- Added "📋 QUICK PASTE URL" button to the scraper panel
- Copy any product URL to clipboard, click the button, and it auto-scrapes
- No need to navigate to each product page
- Perfect for scraping products from emails, bookmarks, or documents

**New in v7.13.0: Houzz Pro Clipper Integration**
- Added "🏠 SYNC FROM HOUZZ CLIPPER" button to the scraper panel
- Auto-detects when Houzz Pro Clipper is open on the page
- Syncs product data from Houzz clipper to fill empty fields
- Reduces double data entry when using both tools
- Auto-sync runs in background when both panels are open

---

## Latest Session (January 15, 2026)

### Features Implemented

1. **Calendar Integration - Google & Outlook (P0)**
   - Added OAuth 2.0 authentication for Google Calendar and Microsoft Outlook
   - Backend endpoints for calendar connection management
   - Two-way sync support (read/write events)
   - "Add Calendar" button in Project Calendar with connection UI
   - Auto token refresh for long-term connections
   - New event types: Google Calendar, Outlook Calendar, To-Do deadlines
   - Credentials configured in backend .env

2. **Data Loss Fix (P0)**
   - Fixed auto-populate script that was wiping data on restart
   - Now only creates sample data if NO projects exist
   - User data is preserved on server restarts

3. **Chrome Extension v7.12.0 Restored**
   - Reverted to last working version after Houzz integration attempts failed
   - Houzz clipper sync not possible due to Chrome extension sandboxing

### Files Modified
- `/app/backend/.env` - Added Google and Outlook OAuth credentials
- `/app/backend/server.py` - Added calendar OAuth endpoints, external calendar events API
- `/app/backend/auto_populate_projects.py` - Fixed data loss bug
- `/app/frontend/src/components/ProjectCalendar.js` - Added calendar connection UI, new event types
- `/app/chrome-extension-scraper/` - Restored to v7.12.0

### IMPORTANT: User Action Required
To complete calendar integration, add these redirect URIs:

**Google Cloud Console:**
- Go to: https://console.cloud.google.com/apis/credentials
- Click on your OAuth client
- Add redirect URI: `https://apprescue-deploy.preview.emergentagent.com/api/auth/google/callback`

**Azure Portal:**
- Go to: https://portal.azure.com
- App registrations → Your app → Authentication
- Add redirect URI: `https://apprescue-deploy.preview.emergentagent.com/api/auth/outlook/callback`

---

## Previous Session (January 12, 2026)

### Features Implemented

1. **Master To-Do List Item Identifiers** - Added full item context to all To-Do and Punch items:
   - Spreadsheet type badge (CHECKLIST in blue, FF&E in green)
   - Room name badge (purple 🏠)
   - Category name badge (teal 📁)
   - Item name badge (amber 📦)
   - Vendor badge (blue 🏪)
   - SKU badge (gray #)
   - Direct link icon (🔗) that navigates to the correct project/tab

2. **Auto-Complete To-Do on Status Change** - When checklist status changes to:
   - ORDERED, RECEIVED, INSTALLED, COMPLETE, DELIVERED
   - The linked To-Do item is automatically marked as completed
   - Toast notification shows "✅ To-Do Completed: [item name]"

3. **Auto-Create To-Do Enhancements** - Enhanced auto-create logic:
   - Includes full item details: room_name, category_name, vendor, sku, source_type
   - Toast notification shows "📋 To-Do Created: [status] - [item name]"

4. **Checklist Text Color Fix** - Fixed unreadable text on highlighted rows:
   - Highlighted rows show BLACK text (#000000)
   - Applied to all text elements via inline styles

5. **Highlight Auto-Refresh** - 10-second polling interval:
   - Automatically refreshes linked item status
   - Highlights disappear when tasks are completed

6. **Chrome Extension v7.12.0** - Fixed and updated:
   - URL: https://apprescue-deploy.preview.emergentagent.com
   - Download: /chrome-extension-scraper.zip

### Files Modified
- `/app/frontend/src/components/MasterToDoList.js` - Item identifiers with badges and links
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Auto-complete, toast notifications
- `/app/frontend/src/components/ToDoList.js` - Updated linked item fields
- `/app/frontend/src/App.js` - Added Toaster component for sonner

---

## Previous Session (January 11, 2026)
1. **Company To-Do endpoint route ordering** - `/todos/company` routes were being captured by `/todos/{project_id}` parameter route. Fixed by moving company routes BEFORE parameterized routes in server.py.

2. **Medium priority color** - Changed from yellow (`bg-yellow-600`) to cyan (`bg-cyan-600`) to differentiate from "Modern Kitchen" room color.

3. **ToDoList interface** - Rebuilt to match PunchList interface exactly:
   - Filter tabs (All, PENDING, IN PROGRESS, COMPLETED)
   - Status toggle button with icons
   - FFE/Checklist item linking dropdown
   - Deadline date picker
   - Description field
   - Assigned to field
   - Priority dropdown

4. **Company To-Do (MasterToDoList)** - Rebuilt to match PunchList interface:
   - Section tabs (All Tasks, Company Tasks, Project Tasks)
   - Filter tabs (All, PENDING, IN PROGRESS, COMPLETED)
   - "+ Add Company Task" form with deadline
   - Status toggle cycling
   - Priority badges

5. **Deadline field added** to all 3 lists:
   - To-Do List: `deadline` field
   - Punch List: `due_date` field (already existed)
   - Company To-Do: `deadline` field

6. **Teams Webhook separation**:
   - Project To-Do & Punch List → Design Den webhook (existing `TEAMS_WEBHOOK_URL`)
   - Company To-Do → NEW Company webhook (`COMPANY_TEAMS_WEBHOOK_URL`)

7. **FFE Spreadsheet highlighting** - Updated to:
   - Load both Punch List AND To-Do linked items
   - Sort linked items to TOP of their category
   - Use bright "highlighter" colors (yellow, green, pink, blue, orange, plum)
   - Show badges: "PUNCH" (red), "TO-DO" (blue), "✓ DONE" (green)

### Files Modified
- `/app/backend/server.py` - Route ordering fix, deadline fields, Teams webhook
- `/app/backend/teams_integration.py` - Added `notify_company_todo()` function with separate webhook
- `/app/backend/.env` - Added `COMPANY_TEAMS_WEBHOOK_URL`
- `/app/frontend/src/components/ToDoList.js` - Complete rebuild to match PunchList
- `/app/frontend/src/components/PunchList.js` - Added deadline field, changed medium priority to cyan
- `/app/frontend/src/components/MasterToDoList.js` - Rebuilt Company section to match PunchList
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - Added To-Do linked items, bright highlighting, sorting

### Testing Status
- **Backend**: 15/15 tests passed (100%)
- **Frontend**: All UI elements verified
- Test file: `/app/tests/test_todo_punchlist_features.py`

## Architecture

### Backend (FastAPI + MongoDB)
- Port: 8001
- Database: interior_design_db
- Collections: projects, rooms, todos, company_todos, punch_list, master_contacts, etc.

### Frontend (React)
- Port: 3000
- Components in `/app/frontend/src/components/`
- UI library: Shadcn/UI + Tailwind CSS

### Key API Endpoints
- `GET/POST/PUT/DELETE /api/todos/company` - Company tasks (MUST be before `/todos/{project_id}`)
- `GET/POST /api/todos/{project_id}` - Project tasks
- `GET/POST/PATCH/DELETE /api/punch-list` - Punch list items
- `GET /api/projects/{id}?sheet_type=ffe|checklist|walkthrough` - Project data

### Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `TEAMS_WEBHOOK_URL` - Design Den webhook for projects
- `COMPANY_TEAMS_WEBHOOK_URL` - Company tasks webhook

## Priority Colors
- Low: `bg-gray-600`
- Medium: `bg-cyan-600` (NOT yellow)
- High: `bg-orange-600`
- Urgent: `bg-red-600`

## Backlog / Future Tasks
1. **Login Protection (P0)** - Implement access control for main app dashboard while keeping /customer public (waiting for user choice: Simple Password vs User Accounts)
2. **Punch list identifiers** - Show linked item details (room, vendor, SKU) on punch list items (P1)
3. iPad Portrait/Landscape View for spreadsheets
4. Android mobile app
5. Google Drive Backup feature
6. Client Approval Portal
7. Backend refactoring (modular API routers)
8. Root cause investigation for recurring data loss

## Known Issues
- Chrome Scraper - Fixed missing `/api/scraper/save` endpoint that was causing HTTP 404
- Recurring data loss - Root cause not yet identified
