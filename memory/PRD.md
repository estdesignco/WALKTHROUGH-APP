# PRD — Interior Design Project Management Tool

## Architecture
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented Features (Apr 13, 2026)

### 3D Shower View
- 5-wall enclosure with texture mapping
- **Full Sheet mode** — one slab covers entire wall
- **Tile mode** — image repeats with correct aspect ratio
- **Offset/Brick pattern** — working in 3D (2-row offset canvas)
- **Stacked + Vertical patterns** — working
- Auto-calculated repeatY preserving image proportions
- Zoned walls (wainscoting support with trim lines)
- Zone fallback to main_wall material
- Recessed niche (data-driven + default)
- Marble bench (data-driven + default)
- Gold fixtures (rain head, wall head, handshower, valve, drain)
- Warm atmospheric lighting, corner shadows, OrbitControls

### Quick-Place Panel
- MODE toggle: TILE / FULL SHEET
- PATTERN toggle: STACKED / OFFSET / VERTICAL
- Surface buttons: ALL WALLS, individual walls, Floor, Ceiling
- Mode + pattern stored on materials and passed to 3D

### Toolbar Buttons
- NICHE: directly adds niche to back wall (shows in 3D)
- BENCH: directly adds bench to back wall (shows in 3D)
- + UPPER: adds upper accent zone
- + WAINSCOT: adds wainscot zone with trim line
- × buttons to remove zones

## Credentials
- App Password: `DesignReady2026!`

## Remaining Work
- Glass door panel / shower enclosure frame
- Dynamic niche/bench repositioning (drag in 3D)
- More patterns (herringbone, basket weave)
- Click-to-place on 3D surfaces
