# PRD — Interior Design Project Management Tool

## Original Problem Statement
Full-stack project management tool for interior design company. Core: "Room Finish Schedule" with photorealistic 3D shower with tiles, niches, benches, fixtures.

## Architecture
- React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented (Apr 13, 2026)

### Three.js 3D Shower (WORKING)
- 5-wall shower enclosure with texture loading
- Auto-calculated repeatY preserving image aspect ratio on walls
- Zone fallback: zones without material inherit main_wall material
- Niche, marble bench, gold fixtures (rain head, wall head, handshower, valve, drain)
- Warm atmospheric lighting, corner shadows, OrbitControls
- Quick-place panel: ALL WALLS, individual wall, Floor, Ceiling buttons

### Data Flow
- Select tile → click surface button → crop modal → tile saved → 3D updates
- Zone auto-fill: placing on one zone fills all zones + auto-fills side walls

## Credentials
- App Password: `DesignReady2026!`

## Still Needs Fixing (User Reported)
1. **Full Sheet mode** — option to display one slab covering entire wall (no repeat)
2. **Pattern options** — stacked, offset, herringbone etc. need to be accessible from quick-place
3. **Niche button** — needs to add/position niches from toolbar, not just show hardcoded
4. **Bench button** — needs to add/position benches from toolbar
5. **Wainscot** — +UPPER/+WAINSCOT need to work and show different tiles per zone
6. **Tile shape** — subway tiles should render as rectangles not squares (partially fixed with aspect ratio calc)

## Backlog
- Glass door panel / shower enclosure frame
- Click-to-place directly on 3D surfaces
- Merge all controls into 3D interface
