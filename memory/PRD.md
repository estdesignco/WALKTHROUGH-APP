# Design Ready - Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core feature: Room Finish Schedule with visual Wall Elevation Diagrams where tile patterns can be realistically applied.

**Critical User Requirement**: Source material images already contain patterns (e.g., a photo of a sheet of subway tiles). The app MUST extract a single individual tile from the source image, then use that extracted tile to render new patterns (Herringbone, Stacked, etc.) on the canvas. The rendering engine MUST use an offscreen canvas with ONLY the cropped single tile — never the full source image.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (`interior_design_db`) with auto-seed on startup
- **Key files**: 
  - `/app/backend/server.py` - API, models, seed, image proxy
  - `/app/frontend/src/components/RoomFinishSchedule.js` - Wall diagram, crop modal, canvas rendering

## What's Been Implemented (March 25 - April 11, 2026)

### Room Finish Schedule - FULLY WORKING
- Visual Wall Elevation Diagram with 6 clickable zones
- Material palette from room FFE items
- 8 tile patterns: Stacked H/V, Offset, 1/3 Offset, Herringbone, Basket Weave, Stepladder, Diagonal
- **Single Tile Extraction (Crop Modal)** - user draws rectangle around ONE tile
- **Offscreen Canvas Rendering** - crop is drawn to an isolated canvas, then ONLY that canvas is used for pattern rendering (never the full source image)
- Auto-crop fallback (center 24% of image when no crop defined)
- Crop data persists via `tile_crop` field on MaterialEntry
- Re-crop and pattern switching supported
- Measurement lines with draw/edit/delete

### Key Technical Detail: Offscreen Canvas Approach
```
Source Image (1024x1024, shows many tiles)
    → User crops one tile region {x, y, w, h}
    → Offscreen Canvas created (crop.w x crop.h pixels)
    → Only cropped region drawn onto offscreen canvas
    → drawTilePattern receives offscreen canvas (NOT source image)
    → Each tile slot draws from offscreen canvas (0,0 to full size)
    → Result: clean individual tiles in the pattern
```

## Testing
- iteration_43.json: 100% (before offscreen canvas fix)
- iteration_44.json: 100% backend (8/8) + 100% frontend (all features verified)
- Herringbone, Offset, Stacked Vertical all visually verified via screenshots

## Key API Endpoints
- `GET /api/proxy-image?url=<url>` - CORS proxy for canvas
- `POST/GET/PUT/DELETE` for finish schedules under `/api/projects/{id}/rooms/{room_id}/finish-schedules`

## Prioritized Backlog

### P1
- User verification of the completed wall diagram
- Database seeding reliability fix

### P2
- Compound / Live Near Friends feature (all phases)
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Break RoomFinishSchedule.js into smaller components
- Rename GoogleAddressInput.js → AddressAutocompleteInput.js
- Archive /app/mobile/
