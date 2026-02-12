# ESTABLISHED Design Co. - PRD

## Core Architecture
- React frontend + FastAPI backend + MongoDB
- Chrome Extension for web scraping products from Canva boards

## Product Requirements
1. Project management dashboard for interior designers
2. Spreadsheets: Walkthrough, Checklist, FF&E with editable cells — "fit to text" like Excel
3. To-Do list with status management (Pending/In Progress/Working/Done)
4. Bulk room deletion across all spreadsheet views
5. Chrome Extension scraper with editable fields before import
6. Calendar, Contacts, Materials, Samples, Teams modules
7. Photo management per room
8. PDF export reports

## What's Been Implemented
### Session Feb 12, 2026 — Fit to Text (FINAL FIX)
- **Excel-like Fit to Text**: Columns auto-size to their content width, NOT fixed widths.
  - Global JS in `index.js`: MutationObserver auto-sizes every `<input type="text">` inside table cells by calculating pixel width from character count
  - CSS in `index.css`: `white-space: nowrap`, `width: auto`, `max-width: none` on all table cell content
  - Table uses `width: max-content` (not fixed minWidth) so it naturally grows
  - `InlineProductAutocomplete`, `VendorDropdown`, `PaintColorAutocomplete` wrappers changed from `w-full` to `max-content`
  - **Result**: Every cell now shows 100% of its content. Zero truncation. Verified with JS diagnostics.
- **Chrome Extension v3.0.0**: Complete redesign with editable fields visible before sending

### Previous Sessions (Completed)
- API URL stability, bulk room deletion, duplicate nav removal, To-Do optimistic updates, scraper remarks transfer, data transfer fixes

## Key Files Modified
- `frontend/src/index.js` — Global auto-size script for table inputs
- `frontend/src/index.css` — Fit-to-text CSS rules
- `frontend/src/components/ExactChecklistSpreadsheet.js` — Table width: max-content
- `frontend/src/components/SimpleWalkthroughSpreadsheet.js` — Table width: max-content
- `frontend/src/components/ExactFFESpreadsheet.js` — Table width: max-content
- `frontend/src/components/InlineProductAutocomplete.js` — Removed w-full constraint
- `frontend/src/components/PaintColorAutocomplete.js` — Removed w-full constraint
- `chrome-extension/popup.html` — Full redesign with editable fields
- `chrome-extension/popup.js` — Edit-before-send workflow

## Login: DesignReady2026!

## Pending / Backlog
- P1: Full functional audit of Samples, Teams, Calendar, Questionnaire, Emails, Charts, Exports, Critical Paths, Shipping & Tracking
- P2: Centralize API URL handling into a single utility function
- P2: General code cleanup
