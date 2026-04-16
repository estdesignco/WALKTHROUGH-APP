# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented (Apr 13, 2026)

### Room Notes (NEW)
- **Notes textarea** at bottom of each room section in Walkthrough, Checklist, and Mobile
- Saves via `PUT /api/rooms/{roomId}` on blur
- Transfers from Walkthrough to Checklist (shared room data)
- Persists in MongoDB

### Room Colors Fix (NEW)
- Backend: `DISTINCT_ROOM_COLORS` array (30 unique colors) assigned by room creation index
- Frontend: Uses `room.color` from DB with fallback to `getColorByIndex(roomIndex)`
- Fixed `SimpleWalkthroughSpreadsheet` calling `getRoomColor(room.name)` without index
- Fixed `AddMultipleRoomsModal` passing object instead of string
- Existing rooms patched with distinct colors

### 3D Shower View (ThreeShowerView.js)
- meshBasicMaterial for pixel-perfect color rendering
- tile_crop extracts single tile from sheet before applying patterns
- Background fill on pattern canvases (no black artifacts)
- Stacked pattern uses full sheet image directly (no crop seam lines)
- 6 patterns: Stacked, Offset, 1/3 Offset, Vertical, Herringbone, Basket Weave
- Drag-and-drop tiles onto walls, bench, niche
- Bench/Niche accept tile material
- Gold fixtures, OrbitControls, zoned walls with wainscoting

## Credentials
App Password: `DesignReady2026!`

## Remaining
- Auto-populate plumbing fixtures from FFE/checklist into palette
- Glass door panel / shower enclosure frame
- More specific drag-and-drop targeting (individual zones)
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
