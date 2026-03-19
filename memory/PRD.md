# Design Ready - Interior Design Management App

## Problem Statement
Full-stack project management tool for an interior design company (EST Design Co). Manages projects with rooms, categories, subcategories, and items through walkthrough, checklist, and FF&E workflows.

## Tech Stack
- **Frontend**: React, Tailwind CSS, @hello-pangea/dnd (drag-and-drop)
- **Backend**: FastAPI (Python), MongoDB
- **3rd Party**: OpenStreetMap Nominatim, Microsoft Graph API, Leica D5

## Architecture
- `/app/backend/server.py` - All FastAPI endpoints (19K+ lines)
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Desktop checklist (4000+ lines)
- `/app/frontend/src/components/TabbedWalkthroughSpreadsheet.js` - Mobile walkthrough/checklist
- `/app/frontend/src/components/MobileAppSimulator.js` - Mobile app shell
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - FF&E
- `/app/frontend/src/components/ChecklistStatusOverview.js` - Pie chart (uses master colors)
- `/app/frontend/src/utils/statusColors.js` - Single source of truth for ALL status colors
- `/app/frontend/src/components/RoomFinishSchedule.js` - Room finish schedule with measurement lines
- `/app/frontend/src/components/ProjectFinishSchedules.js` - Project-level room schedule browser
- `/app/frontend/src/components/ProjectDetailPage.js` - Project detail with "Room Finishes" tab

## Data Model
- Projects in `projects` collection
- Rooms in `rooms` collection (linked by project_id)
- Categories in `categories` (linked by room_id)
- Subcategories in `subcategories` (linked by category_id)
- Items in `items` (linked by subcategory_id)
- **finish_schedules** - Stores schedule per room with surfaces, materials, and measurement_lines
- Production API returns assembled/nested docs; local backend reads from separate collections

## What's Implemented (as of Mar 19, 2026)
- **Flat-list search/filter** on desktop AND mobile
- **Unique status colors** — every status has a maximally distinct color
- **Pie chart matches dropdowns** — both use getStatusColor() from master palette
- **Dynamic vendor dropdown** — computed from actual project items
- **localStorage fix** — stores only project ID instead of full data
- **Mobile App Feature Parity** — same search/filter and table columns as desktop
- **Email Reliability** — debounced send button, improved spam score
- **Room Finish Schedules** (NEW) — Full CRUD for tile, paint/wallpaper, wood/mixed schedules per room with:
  - Visual SVG-based measurement line drawing tool (select, draw, edit, delete lines)
  - Multiple line colors and thickness options
  - Both global room measurements and per-surface measurements
  - Material management per surface (manual entry + quick-pick from room items)
  - Surface management (add/remove with type-specific defaults)
  - Integrated as "Room Finishes" tab in ProjectDetailPage

## Backlog
- **P0**: Investigate and fix root cause of database wipes (recurring issue)
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ line god component)
- **P1**: Refactor TabbedWalkthroughSpreadsheet.js (2800+ lines)
- **P2**: Rename GoogleAddressInput.js -> AddressAutocompleteInput.js
- **P2**: Archive/remove unused /app/mobile/ directory
