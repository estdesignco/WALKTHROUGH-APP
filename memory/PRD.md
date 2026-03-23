# Design Ready - Interior Design Management App

## Problem Statement
Full-stack project management tool for an interior design company (EST Design Co).

## Tech Stack
- **Frontend**: React, Tailwind CSS, HTML5 Canvas
- **Backend**: FastAPI (Python), MongoDB

## Architecture
- `/app/backend/server.py` - All FastAPI endpoints
- `/app/frontend/src/components/RoomFinishSchedule.js` - Canvas-based tile pattern rendering
- `/app/frontend/src/components/ProjectFinishSchedules.js` - Room schedule browser (roomId URL deep-link)
- `/app/frontend/src/components/FFEDashboard.js` - FF&E dashboard + glowing Finish Schedule button
- `/app/frontend/src/components/ExactFFESpreadsheet.js` / `ExactChecklistSpreadsheet.js` - Room-level FINISH SCHEDULE buttons

## What's Implemented (as of Mar 23, 2026)
- **Room Finish Schedules** — Canvas-based tile pattern rendering:
  - HTML5 Canvas draws ACTUAL tile images at every position using ctx.drawImage()
  - 8 patterns: Stacked H/V, Offset, 1/3 Offset, Herringbone, Basket Weave, Stepladder, Diagonal
  - Basket weave rotates vertical tiles 90deg (ctx.rotate) for real weave effect
  - Tile dimensions: 160x54px (3:1), 6px grout gap, #c8bfb0 warm grout
  - Each tile has subtle inset border for depth
  - Visual Wall Elevation Diagram with 6 clickable zones
  - Always-visible material palette with real tile images from project items
  - Pattern picker with all 8 patterns in 4x2 grid
  - SVG-based measurement line drawing tool
  - Empty zones: clean #f5f5f0 background (no green lines)
- **Finish Schedule access from FF&E** — Big glowing golden button at top of FFE dashboard
- **Finish Schedule on room rows** — Glowing buttons on FFE/Checklist room headers with deep-link
- **Database auto-seed** on startup if DB empty

## Backlog
- **P1**: Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- **P2**: Rename GoogleAddressInput.js -> AddressAutocompleteInput.js  
- **P2**: Archive /app/mobile/ directory
- **P2**: Break RoomFinishSchedule.js into smaller components
