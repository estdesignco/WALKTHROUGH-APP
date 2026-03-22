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
- `/app/frontend/src/components/RoomFinishSchedule.js` - Room finish schedule with wall diagram, SVG pattern rendering, material palette
- `/app/frontend/src/components/ProjectFinishSchedules.js` - Project-level room schedule browser
- `/app/frontend/src/components/ProjectDetailPage.js` - Project detail with "Room Finishes" tab

## Data Model
- Projects in `projects` collection
- Rooms in `rooms` collection (linked by project_id)
- Categories in `categories` (linked by room_id)
- Subcategories in `subcategories` (linked by category_id)
- Items in `items` (linked by subcategory_id)
- **finish_schedules** - Stores schedule per room with surfaces, materials (with pattern field), and measurement_lines
- Production API returns assembled/nested docs; local backend reads from separate collections

## What's Implemented (as of Mar 22, 2026)
- **Flat-list search/filter** on desktop AND mobile
- **Unique status colors** — every status has a maximally distinct color
- **Pie chart matches dropdowns** — both use getStatusColor() from master palette
- **Dynamic vendor dropdown** — computed from actual project items
- **localStorage fix** — stores only project ID instead of full data
- **Mobile App Feature Parity** — same search/filter and table columns as desktop
- **Email Reliability** — debounced send button, improved spam score
- **Room Finish Schedules** — Full CRUD for tile, paint/wallpaper, wood/mixed schedules per room with:
  - Visual Wall Elevation Diagram with 6 clickable zones (Ceiling, Upper/Accent, Main Wall, Chair Rail, Wainscot/Curb, Floor)
  - Always-visible material palette pulling actual tile/paint images from Checklist and FFE items
  - 8 tile layout patterns (Stacked H/V, Offset, 1/3 Offset, Herringbone, Basket Weave, Stepladder, Diagonal)
  - Thick SVG grout line overlays (5px main + 7px shadow) that clearly render patterns over tile images
  - Pattern picker showing all 8 patterns with SVG thumbnails
  - SVG-based measurement line drawing tool (select, draw, edit, delete lines)
  - Multiple line colors and thickness options
  - Unique SVG pattern IDs to prevent collisions across multiple wall zones
  - Compact label bars showing material name, vendor, size, and pattern
  - Integrated as "Room Finishes" tab in ProjectDetailPage
- **Database auto-seed** on startup if DB is empty (prevents data loss on pod restarts)

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ line god component)
- **P1**: Refactor TabbedWalkthroughSpreadsheet.js (2800+ lines)
- **P2**: Rename GoogleAddressInput.js -> AddressAutocompleteInput.js
- **P2**: Archive/remove unused /app/mobile/ directory
- **P2**: Break down RoomFinishSchedule.js into smaller components (WallDiagram, MaterialPalette, PatternPicker)
