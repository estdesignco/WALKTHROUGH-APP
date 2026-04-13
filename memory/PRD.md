# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented (Apr 13, 2026)

### 3D Shower View (ThreeShowerView.js)
- **meshBasicMaterial** for textured walls — pixel-perfect color rendering
- **tile_crop** support — extracts single tile from sheet before applying patterns
- **Background fill** on all pattern canvases — samples tile average color, no more black artifacts
- Tile aspect ratio preserved
- Full Sheet mode (per-wall via drag-and-drop)
- 6 patterns: Stacked, Offset, 1/3 Offset, Vertical, Herringbone, Basket Weave
- Zoned walls with wainscoting + metallic trim lines
- Clean niche rendering (individual planes, no box-edge artifacts)
- Niche accepts its own tile material (drop target)
- Bench accepts tile material (drop target)
- Data-driven niches and benches (fixed x/y/w/h field mapping)
- Gold fixtures (rain head, wall head, handshower, valve, drain)
- OrbitControls for rotate/zoom
- **Drag-and-drop** tiles from palette onto 3D walls, bench, niche (Three.js raycasting)
- Ceiling rendered as TexturedWall (supports tile textures)

### Tile Palette
- 4 tile items with draggable thumbnails
- "DRAG TO 3D" label
- Click-to-select with green ring indicator

### Quick-Place Panel  
- MODE: TILE / FULL SHEET (per-wall)
- PATTERN: 6 options
- Surface buttons: ALL WALLS + individual walls + Floor + Ceiling

### Toolbar
- NICHE: adds to back wall, renders in 3D
- BENCH: adds to back wall, renders in 3D
- UPPER / WAINSCOT: zone management

## Credentials
App Password: `DesignReady2026!`

## Remaining
- Auto-populate plumbing fixtures from FFE/checklist into palette
- Glass door panel / shower enclosure frame
- More specific drag-and-drop targeting (individual zones)
- Niche/bench repositioning in 3D
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
