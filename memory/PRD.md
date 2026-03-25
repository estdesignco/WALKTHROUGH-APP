# Design Ready - Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core features include project management, FFE (Furniture, Fixtures & Equipment) tracking, checklists, and a visual Room Finish Schedule with Wall Elevation Diagrams.

**Critical User Requirement**: Source material images already contain patterns (e.g., a photo of a sheet of subway tiles). The application MUST first allow extraction of a single individual tile from the source image, then use that single extracted tile to render new patterns (Herringbone, Stacked, etc.) on the canvas.

## Core Requirements
- Project CRUD with rooms, addresses, client info
- FFE Dashboard with spreadsheet-like editing
- Checklist management with spreadsheet-like editing
- **Room Finish Schedule**: Visual Wall Elevation Diagram with Single Tile Extraction + Pattern Rendering
- Canva API integration for design assets
- Password-protected access (DesignReady2026!)

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI components
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB with auto-seed on startup
- **Key files**: 
  - `/app/backend/server.py` - API endpoints, DB models, auto-seed, image proxy
  - `/app/frontend/src/components/RoomFinishSchedule.js` - Wall diagram, tile crop modal, canvas rendering, material palette

## What's Been Implemented

### Room Finish Schedule (P0 - COMPLETE)
- Visual Wall Elevation Diagram with 6 clickable zones (Ceiling, Upper/Accent, Main Wall, Chair Rail/Stool, Wainscot/Curb, Floor)
- Always-visible material palette pulling actual tile images from FFE/Checklist items
- 8 tile layout patterns: Stacked Horizontal, Stacked Vertical, Offset (Brick), 1/3 Offset, Herringbone, Basket Weave, Stepladder, Diagonal
- **Single Tile Extraction (CROP) Modal** - User draws a rectangle around ONE individual tile from the multi-tile source image
- **Canvas rendering uses ONLY the extracted single tile** for all pattern rendering
- Crop data persisted per material (tile_crop: {x, y, w, h} in source image pixels)
- Existing crop reused when placing same tile on another zone (no duplicate modal)
- Re-crop button allows adjusting the extraction
- Pattern picker with SVG thumbnails
- Measurement lines support
- Multi-surface/wall support

### Bug Fixes Applied (March 25, 2026)
- **CRITICAL FIX**: Completely rewrote rendering engine to extract single tile from multi-tile source images instead of randomly cropping portions
- Added TileCropModal component for interactive tile extraction
- Added tile_crop field to backend MaterialEntry model
- Canvas rendering now uses exact crop coordinates for each tile in pattern
- Subtle per-tile brightness variation and edge bevel effects for realism

## Key API Endpoints
- `POST /api/projects/{project_id}/rooms/{room_id}/finish-schedules`
- `PUT /api/projects/{project_id}/finish-schedules/{schedule_id}` (supports tile_crop in materials)
- `GET /api/projects/{project_id}/rooms/{room_id}/finish-schedules`
- `DELETE /api/projects/{project_id}/finish-schedules/{schedule_id}`
- `GET /api/proxy-image?url=<image_url>` - CORS proxy for canvas rendering
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Project details with rooms

## Testing
- iteration_43.json: 100% backend (8/8) + 100% frontend - ALL PASSED
- Full tile extraction workflow verified: select → place → crop → pattern → render

## Prioritized Backlog

### P1 - Next Up
- Get user verification of the completed Room Finishes wall diagram
- Database seeding reliability fix (auto-seed sometimes fails)

### P2 - Future
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Break RoomFinishSchedule.js into smaller components
- Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- Archive/remove unused /app/mobile/ directory
