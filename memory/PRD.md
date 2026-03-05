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
- Flat-list search in checklist (Mar 2026)
- Unique status colors per option in dropdowns (Mar 2026)

## Architecture
- `/app/backend/server.py` - All FastAPI endpoints (18K+ lines)
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Checklist (4000+ lines, needs refactoring)
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - FF&E
- `/app/frontend/src/utils/statusColors.js` - Master status color map (single source of truth)
- `/app/frontend/src/App.js` - Routing, mobile redirect
- `/app/backend/auto_populate_projects.py` - Seed test projects if DB empty

## Data Model
- Projects stored in `projects` collection (top level)
- Rooms in `rooms` collection (linked by project_id)
- Categories in `categories` collection (linked by room_id)
- Subcategories in `subcategories` collection (linked by category_id)
- Items in `items` collection (linked by subcategory_id)
- Production API returns assembled/nested docs; local backend reads from separate collections

## What's Implemented (as of Mar 5, 2026)
- All mobile app fixes (add room, scrolling, redirect, flashing UI)
- Data sync fixes (no more "PICKED" regression, skip empty categories, field updates propagate)
- Checklist/FFE UI fixes (uncheck items, standardized status dropdowns, REPLACEMENT status)
- **Unique status colors** — each status has a distinct color in both Checklist and FFE dropdowns
- **No duplicate colors** in the STATUS_COLORS palette
- **Status colors in dropdown options** — each `<option>` now renders with its own background color
- **Flat-list search** — checklist search shows a simple table without room/category headers
- **Production data imported** — all 9 projects (5620 items) restored from production

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ line god component)
- **P2**: Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- **P2**: Archive/remove unused /app/mobile/ directory
- **P1**: Full user verification of all session fixes
