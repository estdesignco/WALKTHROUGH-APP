# Design Ready - Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core feature: Room Finish Schedule with a 3D shower enclosure viewer where tile patterns can be visually and realistically applied to all surfaces.

**Critical User Requirement**: Source material images already contain patterns (e.g., a photo of a sheet of subway tiles). The app MUST extract a single individual tile from the source image, then use that extracted tile to render new patterns on the canvas.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (`interior_design_db`) with auto-seed on startup
- **Key files**: 
  - `/app/backend/server.py` - API, models, seed, image proxy
  - `/app/frontend/src/components/RoomFinishSchedule.js` - 3D shower viewer, crop modal, canvas rendering

## What's Been Implemented

### Room Finish Schedule - FULLY WORKING
- **3D Shower Enclosure Viewer** with CSS 3D perspective transforms
  - Ceiling surface (rotateX 58deg)
  - Floor surface (rotateX -52deg)
  - Left wall (rotateY 42deg), Back wall (flat), Right wall (rotateY -42deg)
  - Corner shadow lines for depth
- **4 Wall Zones per wall**: Upper, Main Wall, Wainscot, Floor
- **Zone Dimension Labels**: Editable "SIZE" buttons on back wall zones
- **Single Tile Extraction** via Crop Modal (offscreen canvas approach)
- **9 Tile Patterns**: Stacked H/V, Offset, 1/3 Offset, Herringbone, Herringbone Vertical, Basket Weave, Stepladder, Diagonal
- **Grout Color Selection**: White, Light Gray, Gray, Brown, Charcoal, Black
- **Tile Orientation Control**: Horizontal / Vertical toggle
- **Niche Placement**: Click-to-place recessed shelf on any wall zone, with position/size controls
- **Bench Placement**: Click-to-place seating on any wall zone, with position/size controls
- **Fixture Placement**: Place plumbing items from FFE/Checklist as fixture pins on walls
- **Material Palette** from room FFE items
- **Measurement Canvas** with draw/edit/delete measurement lines
- **Ceiling & Floor** as tileable surfaces

### Key Technical Detail: Offscreen Canvas Approach
```
Source Image (1024x1024, shows many tiles)
    → User crops one tile region {x, y, w, h}
    → Offscreen Canvas created (crop.w x crop.h pixels)
    → Only cropped region drawn onto offscreen canvas
    → drawTilePattern receives offscreen canvas (NOT source image)
    → Result: clean individual tiles in the pattern
```

### Backend Model (SurfaceEntry)
- `zone_config`: Array of {id, label, height, dimension} for wall zone sizes
- `niches`: Array of {id, zone_id, x, y, w, h, material} for recessed shelves
- `benches`: Array of {id, zone_id, x, y, w, h, material} for seats
- `fixtures`: Array of {id, item_id, name, image, zone_id, x, y} for plumbing
- `class Config: extra = "allow"` for future extensibility

## Testing
- iteration_44.json: 100% (2D version before 3D shower)
- iteration_45.json: 100% backend (18/18) + 100% frontend (all 3D features verified)

## Key API Endpoints
- `GET /api/proxy-image?url=<url>` - CORS proxy for canvas
- `POST/GET/PUT/DELETE` for finish schedules under `/api/projects/{id}/rooms/{room_id}/finish-schedules`

## Prioritized Backlog

### P0 (Done)
- 3D shower enclosure with ceiling + floor
- Grout color selection
- Tile orientation control
- Niche, bench, fixture placement
- Zone dimension labels

### P1
- User verification and feedback on 3D shower visual quality
- Drag-to-move and drag-to-resize for niches/benches/fixtures
- Zone resize by dragging dividers between zones

### P2
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Break RoomFinishSchedule.js into smaller components
- Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- Archive /app/mobile/
