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
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - FF&E spreadsheet
- `/app/frontend/src/components/FFEDashboard.js` - FF&E dashboard wrapper
- `/app/frontend/src/components/RoomFinishSchedule.js` - Room finish schedule with wall diagram, SVG pattern rendering, material palette
- `/app/frontend/src/components/ProjectFinishSchedules.js` - Project-level room schedule browser (supports roomId URL param deep-linking)
- `/app/frontend/src/components/ProjectDetailPage.js` - Project detail with tab navigation

## Data Model
- Projects in `projects` collection
- Rooms in `rooms` collection (linked by project_id)
- Categories in `categories` (linked by room_id)
- Subcategories in `subcategories` (linked by category_id)
- Items in `items` (linked by subcategory_id)
- **finish_schedules** - Stores schedule per room with surfaces, materials (with pattern field), and measurement_lines

## What's Implemented (as of Mar 22, 2026)
- **Flat-list search/filter** on desktop AND mobile
- **Unique status colors** — every status has a maximally distinct color
- **Dynamic vendor dropdown** — computed from actual project items
- **Mobile App Feature Parity** — same search/filter and table columns as desktop
- **Email Reliability** — debounced send button, improved spam score
- **Room Finish Schedules** — Full CRUD for tile, paint/wallpaper, wood/mixed schedules per room:
  - Visual Wall Elevation Diagram with 6 clickable zones
  - Always-visible material palette pulling actual images from project items
  - 8 tile layout patterns with LARGE-SCALE SVG grout rendering (200-300px tile units, 8px grout)
  - Tile image displayed at `cover` size (clean single image, not tiny tiled mess)
  - Pattern picker showing all 8 patterns with SVG thumbnails in 4x2 grid
  - SVG-based measurement line drawing tool
  - Integrated as "Room Finishes" tab in ProjectDetailPage
- **Finish Schedule Access from FF&E** — Big glowing "ROOM FINISH SCHEDULES" button at top of FFE dashboard
- **Finish Schedule Buttons on Room Rows** — Glowing "FINISH SCHEDULE" buttons on both FFE and Checklist room header rows (deep-link via URL params)
- **Deep-linking** — ProjectFinishSchedules reads roomId from URL to auto-select room
- **Database auto-seed** on startup if DB is empty

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ line god component)
- **P1**: Refactor TabbedWalkthroughSpreadsheet.js (2800+ lines)
- **P2**: Rename GoogleAddressInput.js -> AddressAutocompleteInput.js
- **P2**: Archive/remove unused /app/mobile/ directory
- **P2**: Break down RoomFinishSchedule.js into smaller components
