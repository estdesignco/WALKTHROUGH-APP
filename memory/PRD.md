# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented (Apr 13, 2026)

### 3D Shower View
- White tiles render WHITE (boosted lighting)
- Tile aspect ratio preserved (rectangles not squares)
- Full Sheet mode (per-wall, not global)
- 6 patterns: Stacked, Offset, 1/3 Offset, Vertical, Herringbone, Basket Weave
- Zoned walls with wainscoting + trim lines
- Data-driven niches and benches
- Gold fixtures (rain head, wall head, handshower, valve, drain)
- OrbitControls for rotate/zoom

### Quick-Place Panel  
- MODE: TILE / FULL SHEET (per-wall)
- PATTERN: 6 options, stored per-material
- Surface buttons: ALL WALLS + individual walls + Floor + Ceiling

### Toolbar
- NICHE: adds to back wall, renders in 3D
- BENCH: adds to back wall, renders in 3D
- + UPPER / + WAINSCOT: zone management

## Credentials
App Password: `DesignReady2026!`

## Remaining
- Glass door panel
- Drag-and-drop UX for tiles
- Auto-populate fixtures from FFE/checklist
- Niche/bench repositioning in 3D
