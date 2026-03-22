# Design Ready - Interior Design Management App

## Problem Statement
Full-stack project management tool for an interior design company (EST Design Co). Manages projects with rooms, categories, subcategories, and items through walkthrough, checklist, and FF&E workflows.

## Tech Stack
- **Frontend**: React, Tailwind CSS, @hello-pangea/dnd (drag-and-drop)
- **Backend**: FastAPI (Python), MongoDB
- **3rd Party**: OpenStreetMap Nominatim, Microsoft Graph API, Leica D5

## Architecture
- `/app/backend/server.py` - All FastAPI endpoints
- `/app/frontend/src/components/RoomFinishSchedule.js` - Room finish schedule with CSS mask-image pattern rendering
- `/app/frontend/src/components/ProjectFinishSchedules.js` - Room schedule browser (roomId URL deep-link)
- `/app/frontend/src/components/ProjectDetailPage.js` - Project detail with tab navigation
- `/app/frontend/src/components/FFEDashboard.js` - FF&E dashboard with glowing Finish Schedule button
- `/app/frontend/src/components/ExactFFESpreadsheet.js` - FF&E spreadsheet
- `/app/frontend/src/components/ExactChecklistSpreadsheet.js` - Desktop checklist

## What's Implemented (as of Mar 22, 2026)
- **Room Finish Schedules** with CSS mask-image pattern rendering:
  - Tile image masked into actual tile shapes (rects, parallelograms) via SVG masks
  - Grout-colored background (#c8bfb0) visible through gaps between tiles
  - 8 patterns: Stacked H/V, Offset, 1/3 Offset, Herringbone, Basket Weave, Stepladder, Diagonal
  - Visual Wall Elevation Diagram with 6 clickable zones
  - Always-visible material palette with real tile images
  - Pattern picker with SVG thumbnails (4x2 grid)
  - Measurement line drawing tool
- **Finish Schedule access from FF&E** - Big glowing golden "ROOM FINISH SCHEDULES" button
- **Finish Schedule on room rows** - Glowing buttons on FFE/Checklist room headers with deep-link
- **Database auto-seed** on startup if DB empty

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- **P2**: Rename GoogleAddressInput.js -> AddressAutocompleteInput.js
- **P2**: Archive /app/mobile/ directory
- **P2**: Break down RoomFinishSchedule.js into smaller components
