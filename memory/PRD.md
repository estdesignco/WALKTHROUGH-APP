# PRD — Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core feature: "Room Finish Schedule" with a realistic, interactive 3D shower perspective where users can apply tile patterns, place niches, benches, and fixtures.

## Architecture
- **Frontend**: React 18 + Three.js (@react-three/fiber v8) + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) + MongoDB
- **3D Engine**: Three.js with React Three Fiber for realistic shower rendering

## What's Been Implemented

### Core Features (Working)
- Project management with rooms, categories, subcategories
- FF&E (Furniture, Fixtures & Equipment) spreadsheet
- Room Finish Schedule with tile placement
- Tile crop modal (extract single tiles from product photos)
- Pattern selection (stacked, offset, herringbone, basket weave, etc.)
- Grout color selection
- Tile orientation (horizontal/vertical)
- Tile size slider
- Drag-and-drop niches, benches, fixtures
- Bench anchoring to bottom of walls
- Side wall auto-fill from back wall
- Floor/ceiling tile placement
- Zone management (add/remove Upper, Wainscot zones)
- Measurement canvas with dimension lines

### Three.js 3D Shower View (NEW - Apr 12, 2026)
- Three.js-based 3D shower enclosure (5 walls: back, left, right, floor, ceiling)
- Texture loading from tile product images via proxy
- RepeatWrapping for proper tile tiling
- Lighting: ambient + point + directional lights
- Corner shadow effects (ambient occlusion)
- OrbitControls for camera rotation
- Runs alongside the 2D interactive view

### Known Limitations
- Headless browser (Playwright) cannot render WebGL textures — appears gray in automated screenshots
- Textures render correctly in real browsers with GPU support
- Three.js view is currently VIEW-ONLY (no click-to-place interaction yet)
- Interactive features (tile placement, niches, benches) still use the 2D view below

## Default Zone Configuration
- Main Wall (85%) + Floor (15%)
- Upper Accent and Wainscot can be added via toolbar buttons

## Credentials
- App Password: `DesignReady2026!`

## Prioritized Backlog

### P0 — Critical
- Verify Three.js textures render in real browser
- Add click-to-place tile interaction to 3D view
- Match reference image visual quality (dark aesthetic, proper proportions)

### P1 — Important
- Glass door panel / shower enclosure frame
- 3D niche, bench, fixture placement in Three.js view
- Merge 2D controls into 3D view (eliminate dual-view)

### P2 — Enhancement
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Break down RoomFinishSchedule.js into smaller components
- Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- Archive unused /app/mobile/ directory

## Key Files
- `/app/frontend/src/components/ThreeShowerView.js` — Three.js 3D shower
- `/app/frontend/src/components/RoomFinishSchedule.js` — Main room finish schedule (2D + controls)
- `/app/backend/server.py` — Backend API
