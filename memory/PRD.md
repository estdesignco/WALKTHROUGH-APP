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
- **Clip-path perspective box** (NOT CSS 3D transforms): 5 surfaces rendered as trapezoids
  - Ceiling: `clip-path: polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)` at top 10%
  - Floor: `clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)` at bottom 18%
  - Left/Right walls: trapezoidal clip-paths
  - Back wall: flat center rectangle (20%-80% width, 10%-82% height)
  - SVG corner shadow lines for depth
- **4 Configurable Wall Zones**: Upper, Main Wall, Wainscot, Floor
  - Zone resize by dragging dividers between zones
  - Editable dimension labels (SIZE buttons)
- **Single Tile Extraction** via Crop Modal + **USE FULL IMAGE** button
- **Tile Size Slider** (30%-300% scale, stored as tile_scale on material)
- **9 Tile Patterns**: Stacked H/V, Offset, 1/3 Offset, Herringbone H/V, Basket Weave, Stepladder, Diagonal
- **Grout Color Selection**: White, Light Gray, Gray, Brown, Charcoal, Black
- **Tile Orientation Control**: Horizontal / Vertical toggle
- **Niche Placement**: Click-to-place, drag-to-move, drag corners to resize, tileable interior
- **Bench Placement**: Click-to-place, drag-to-move, drag corners to resize, tileable
- **Fixture Placement**: From FFE/Checklist items, drag-to-move
- **Ceiling & Floor**: Clickable tileable surfaces
- **Measurement Canvas**: Draw/edit/delete measurement lines

### Backend Model
- `SurfaceEntry`: zone_config, niches, benches, fixtures (class Config: extra = "allow")
- `MaterialEntry`: tile_scale (Optional[float] = 1.0)

## Testing
- iteration_44.json: 100% (original 2D version)
- iteration_45.json: 100% (CSS 3D version)
- iteration_46.json: 100% backend (19/19) + 100% frontend (clip-path version with all features)

## Key API Endpoints
- `GET /api/proxy-image?url=<url>` - CORS proxy
- `POST/GET/PUT/DELETE` finish schedules

## Prioritized Backlog

### P0 (Done)
- 3D shower enclosure with ceiling + floor (clip-path perspective)
- Tile size control (slider 30-300%)
- USE FULL IMAGE option in crop modal
- Zone resize by dragging dividers
- Niche/bench/fixture drag-to-move and drag-to-resize
- Grout color, tile orientation controls

### P1
- User verification and feedback on updated 3D visual
- Glass door panel / shower enclosure frame

### P2
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Break RoomFinishSchedule.js into smaller components
- Rename GoogleAddressInput.js
- Archive /app/mobile/
