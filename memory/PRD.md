# Design Ready - Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core feature: Room Finish Schedule with a 3D shower enclosure viewer where tile patterns can be visually and realistically applied to all surfaces.

**Critical User Requirement**: Source material images already contain patterns. The app MUST extract a single individual tile from the source image, then use that extracted tile to render new patterns on the canvas.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (`interior_design_db`) with auto-seed on startup
- **Key files**: 
  - `/app/backend/server.py` - API, models, seed, image proxy
  - `/app/frontend/src/components/RoomFinishSchedule.js` - 3D shower viewer

## What's Been Implemented

### 3D Shower Enclosure Viewer (One-Point Perspective)
- **Clip-path perspective box**: 5 surfaces rendered as trapezoids with explicit z-index stacking
  - Ceiling: z-index:1, clip-path at top 10%
  - Left/Right walls: z-index:2, trapezoidal clip-paths
  - Back wall: z-index:5, flat center rectangle (20%-80% width, 10%-82% height)
  - Floor: z-index:6, clip-path at bottom 18% (clickable and interactive)
  - SVG corner shadow lines (z-index:20, pointer-events:none)
- **4 Configurable Wall Zones**: Upper, Main Wall, Wainscot, Floor
  - Zone resize by dragging dividers between zones
  - Editable dimension labels (SIZE buttons)
- **Single Tile Extraction** via Crop Modal + USE FULL IMAGE button
- **Tile Size Slider** (50%-500% scale, stored as tile_scale on material)
- **Realistic Tile Scale**: Base tile size = 12% of zone height (was 60%, way too big)
- **9 Tile Patterns**: Stacked H/V, Offset, 1/3 Offset, Herringbone H/V, Basket Weave, Stepladder, Diagonal
- **Grout Color Selection**: White, Light Gray, Gray, Brown, Charcoal, Black
- **Tile Orientation Control**: Horizontal / Vertical toggle
- **Auto-fill Side Walls**: When tile placed on back wall, left/right walls auto-get same tile (unless already tiled)
- **Niche Placement**: Click-to-place, drag-to-move, drag corners to resize, tileable interior
- **Bench Placement**: Anchored to bottom of zone (y=65%), drag-to-move, drag corners to resize, tileable
- **Tile on Bench/Niche**: Select tile then click bench/niche to apply tile texture
- **Schluter/Trim Options**: None, Schluter (Metal), Bullnose, Pencil Liner, Quarter Round
- **Bench/Niche Size Inputs**: WIDTH and HEIGHT in inches
- **Fixture Placement**: From FFE/Checklist items, drag-to-move
- **Ceiling & Floor**: Clickable tileable surfaces
- **Measurement Canvas**: Draw/edit/delete measurement lines

### Backend Model
- `SurfaceEntry`: zone_config, niches, benches, fixtures (class Config: extra = "allow")
- `MaterialEntry`: tile_scale (Optional[float] = 1.0)
- Niche/Bench elements: material, trim, width_inches, height_inches fields

## Testing
- iteration_46.json: 100% backend + frontend (clip-path version)
- iteration_47.json: 100% (all 10 bug fixes verified - drag, floor, bench, auto-fill, trim, sizing)

## Key API Endpoints
- `GET /api/proxy-image?url=<url>` - CORS proxy
- `POST/GET/PUT/DELETE` finish schedules

## Prioritized Backlog

### P0 (All Done)
- 3D shower enclosure with ceiling + floor
- Realistic tile scale (12% base, slider 50-500%)
- Floor clickable with z-index stacking
- Drag-to-move for all elements (surfaceId prop fix)
- Bench anchored to bottom of zone
- Auto-fill side walls from back wall
- Tile on bench/niche
- Schluter/trim options
- Bench/niche size specification

### P1
- Glass door panel / shower enclosure frame
- User final sign-off on complete feature set

### P2
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Break RoomFinishSchedule.js into smaller components
- Rename GoogleAddressInput.js
- Archive /app/mobile/
