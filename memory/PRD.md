# PRD — Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for an interior design company. Core feature: "Room Finish Schedule" with a photorealistic, interactive 3D shower perspective where users can apply tile patterns, place niches, benches, and fixtures.

## Architecture
- **Frontend**: React 18 + Three.js (@react-three/fiber v8, @react-three/drei v9) + Tailwind CSS
- **Backend**: FastAPI (Python) + MongoDB
- **3D Engine**: Three.js for photorealistic shower rendering

## Implemented (Apr 12, 2026)

### Three.js 3D Shower View
- 5-wall shower enclosure (back, left, right, floor, ceiling)
- Texture loading: fetch → blob → dataURL → Image → THREE.Texture
- RepeatWrapping with tuned counts (~14 tiles wide on back wall)
- ACES Filmic tone mapping, warm atmospheric lighting
- Recessed niche (centered on back wall)
- Marble bench (right side)
- Gold fixtures: rain showerhead, wall head, handshower with slide bar, valve trim, floor drain
- Corner ambient occlusion shadows
- OrbitControls (rotate/zoom)

### 2D Controls (collapsible below 3D view)
- Tile placement with crop modal
- Pattern selection, grout color, tile size
- Zone management, auto-fill all zones + side walls
- Drag-and-drop niches, benches, fixtures

## Credentials
- App Password: `DesignReady2026!`

## Backlog
- P0: Click-to-place tiles directly in 3D view
- P1: Dynamic niche/bench/fixture placement in 3D (from schedule data)
- P1: Glass door panel / shower enclosure frame
- P2: Merge 2D controls into 3D view
- P2: Refactor monolith files
