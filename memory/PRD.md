# Design Ready - Interior Design Management App

## Problem Statement
Full-stack project management tool for an interior design company (EST Design Co). Manages projects with rooms, categories, subcategories, and items through walkthrough, checklist, and FF&E workflows.

## Tech Stack
- **Frontend**: React, Tailwind CSS, @hello-pangea/dnd (drag-and-drop)
- **Backend**: FastAPI (Python), MongoDB
- **3rd Party**: OpenStreetMap Nominatim, Microsoft Graph API, Leica D5

## Core Features
- Password-based auth (DesignReady2026!)
- Project management with rooms/categories/subcategories/items
- Walkthrough spreadsheet (data entry)
- Checklist spreadsheet (with drag-and-drop, status tracking)
- FF&E spreadsheet
- Walkthrough-to-checklist data sync
- Status overview with pie charts
- Mobile-responsive views
- Chrome extension scraper integration
- Flat-list search in checklist (Feb 2026)

## Architecture
- `/app/backend/main.py` - All FastAPI endpoints
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Checklist (4000+ lines, needs refactoring)
- `/app/frontend/src/components/FFE_Exact_Spreadsheet.js` - FF&E
- `/app/frontend/src/constants/statusColors.js` - Master status color map
- `/app/frontend/src/App.js` - Routing, mobile redirect

## What's Implemented (as of Feb 2026)
- All mobile app fixes (add room, scrolling, redirect, flashing UI)
- Data sync fixes (no more "PICKED" regression, skip empty categories, field updates propagate)
- Checklist/FFE UI fixes (uncheck items, standardized status dropdowns, REPLACEMENT status)
- Status color consistency across Checklist, FFE, and pie chart
- Backend Pydantic enum updated for new statuses
- **Flat-list search in checklist** - when searching, shows a simple table without room/category headers (TESTED, PASSING)

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ line god component)
- **P2**: Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- **P2**: Archive/remove unused /app/mobile/ directory
- **P1**: Full user verification of all session fixes
