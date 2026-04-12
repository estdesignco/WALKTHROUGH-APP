# PRD — Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core feature: "Room Finish Schedule" with a photorealistic, interactive 3D shower perspective where users can apply tile patterns, place niches, benches, and fixtures.

## Architecture
- **Frontend**: React 18 + Three.js (@react-three/fiber v8, @react-three/drei v9) + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) + MongoDB
- **3D Engine**: Three.js with React Three Fiber for photorealistic shower rendering

## What's Been Implemented (Apr 12, 2026)

### Three.js 3D Shower View (WORKING)
- Proper 3D shower enclosure (5 surfaces: back wall, left wall, right wall, floor, ceiling)
- **Texture loading FIXED** — fetch → blob → dataURL → Image → THREE.Texture pipeline
- RepeatWrapping for seamless tile tiling on 3D surfaces
- ACES Filmic tone mapping for realistic lighting
- Point light + directional lights + ambient light
- Corner ambient occlusion (dark edge lines)
- OrbitControls for camera rotation/zoom
- Camera positioned for shower interior perspective

### Core Features (Working)
- Project/room/material management
- FF&E spreadsheet, Room Finish Schedule
- Tile crop modal, pattern selection, grout color, tile size slider
- Zone management (Main Wall + Floor default, add Upper/Wainscot)
- Drag-and-drop niches, benches, fixtures (2D view)
- Side wall auto-fill from back wall
- All zones auto-fill when tile applied to one zone

### Tile Rendering
- Full image: auto-crop center 80% → render as individual tiles (g=0, seamless)
- Cropped tile: render with selected pattern (g=0, seamless)
- Fixed 90px base tile size across all walls

## Credentials
- App Password: `DesignReady2026!`

## Prioritized Backlog

### P0 — In Progress
- Verify Three.js textures look good in user's browser
- Tune tile repeat counts for photorealistic appearance
- Add click-to-place interaction in 3D view

### P1 — Next
- Add 3D niche, bench, fixture geometry to Three.js scene
- Glass door panel / shower enclosure frame
- Improve lighting/shadows for photorealism

### P2 — Future
- Merge 2D controls into 3D view (single unified interface)
- Refactor large monolith files
- Archive unused directories
