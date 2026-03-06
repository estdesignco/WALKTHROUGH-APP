# Design Ready - Interior Design Management App

## Problem Statement
Full-stack project management tool for an interior design company (EST Design Co). Manages projects with rooms, categories, subcategories, and items through walkthrough, checklist, and FF&E workflows.

## Tech Stack
- **Frontend**: React, Tailwind CSS, @hello-pangea/dnd (drag-and-drop)
- **Backend**: FastAPI (Python), MongoDB
- **3rd Party**: OpenStreetMap Nominatim, Microsoft Graph API, Leica D5

## Architecture
- `/app/backend/server.py` - All FastAPI endpoints (18K+ lines)
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Desktop checklist (4000+ lines)
- `/app/frontend/src/components/TabbedWalkthroughSpreadsheet.js` - Mobile walkthrough/checklist
- `/app/frontend/src/components/MobileAppSimulator.js` - Mobile app shell
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - FF&E
- `/app/frontend/src/components/ChecklistStatusOverview.js` - Pie chart (uses master colors)
- `/app/frontend/src/utils/statusColors.js` - Single source of truth for ALL status colors

## Data Model
- Projects in `projects` collection
- Rooms in `rooms` collection (linked by project_id)
- Categories in `categories` (linked by room_id)
- Subcategories in `subcategories` (linked by category_id)
- Items in `items` (linked by subcategory_id)
- Production API returns assembled/nested docs; local backend reads from separate collections

## What's Implemented (as of Mar 6, 2026)
- **Flat-list search/filter** on desktop AND mobile — search text, status dropdown, vendor dropdown all trigger instant flat list results with no room/category headers
- **SEARCH button** + CLEAR ALL on desktop
- **Mobile search/filter** — same functionality as desktop with mobile-optimized card layout
- **Unique status colors** — every status has a maximally distinct color (pure red, bright orange, lime green, dodger blue, violet, deep pink, etc.)
- **Pie chart matches dropdowns** — both use getStatusColor() from master palette
- **Dynamic vendor dropdown** — computed from actual project items (not hardcoded)
- **localStorage fix** — stores only project ID instead of full data to prevent quota exceeded errors
- **10 production projects restored** (5858 items, 141 rooms)
- All previous fixes: mobile app (add room, scrolling, redirect), data sync, status dropdowns, color consistency

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ line god component)
- **P2**: Rename GoogleAddressInput.js → AddressAutocompleteInput.js
- **P2**: Archive/remove unused /app/mobile/ directory
