# ESTABLISHED Design Co. - PRD

## Core Architecture
- React frontend + FastAPI backend + MongoDB
- Chrome Extension for web scraping products from Canva boards

## Product Requirements
1. Project management dashboard for interior designers
2. Spreadsheets: Walkthrough, Checklist, FF&E with editable cells
3. To-Do list with status management (Pending/In Progress/Working/Done)
4. Bulk room deletion across all spreadsheet views
5. Chrome Extension scraper with editable fields before import
6. Calendar, Contacts, Materials, Samples, Teams modules
7. Photo management per room
8. PDF export reports

## What's Been Implemented
### Session Feb 12, 2026 (Current)
- **Fit to Text Fix**: Widened all spreadsheet columns significantly across all 3 active spreadsheets:
  - ExactChecklistSpreadsheet: 4200px total, ITEM 500px, VENDOR 300px, SIZE 400px, FINISH 400px, REMARKS 400px
  - SimpleWalkthroughSpreadsheet: 2800px total, ITEM 800px, SIZE 500px, FINISH 500px
  - ExactFFESpreadsheet: 5000px total
  - Added global CSS in index.css for white-space: normal on all table cells
- **Chrome Extension v3.0.0**: Complete redesign with editable fields (Item Name, Vendor, SKU, Price, MSRP, Size, Finish, Link, Remarks) visible before sending to app
- **All regression tests passed**: 12/12 backend, 6/6 frontend features verified

### Previous Sessions (Completed)
- API URL stability (window.ENV vs process.env pattern)
- Bulk room deletion UI and backend
- Duplicate nav bar removal
- To-Do list optimistic UI updates
- Scraper remarks field transfer
- Data transfer fixes (Walkthrough → Checklist → FF&E)

## Key API Endpoints
- GET /api/projects - All projects
- GET /api/projects/{id}?sheet_type=checklist - Project details
- PUT /api/todos/{todo_id} - Update to-do status
- DELETE /api/projects/{id}/rooms - Bulk delete rooms
- POST /api/items - Add item to subcategory
- GET /api/download/chrome-extension - Download extension zip

## DB Schema
- projects: {id, name, client_info, rooms[]}
- rooms: {id, project_id, name, categories[]}
- items: {id, subcategory_id, name, vendor, sku, cost, size, finish_color, remarks, status}
- todos: {todo_id, project_id, status, completed, title}

## Login: DesignReady2026!

## Pending / Backlog
- P1: Full functional audit of Samples, Teams, Calendar, Questionnaire, Emails, Charts, Exports, Critical Paths, Shipping & Tracking
- P2: Centralize API URL handling into a single utility function
- P2: General code cleanup (remove backup/broken files)
