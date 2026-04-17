# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented (Apr 17, 2026)

### Performance Optimization (P0 - CRITICAL FIX)
- **Default collapsed state**: All rooms, categories, and floors load COLLAPSED on both Walkthrough, Checklist, and FFE spreadsheets
- **DOM reduction**: Instead of rendering thousands of DOM nodes for 38+ rooms, only ~50 lightweight room headers + floor banners render on load
- **EXPAND ALL / COLLAPSE ALL buttons**: Added to all three spreadsheet views (Walkthrough, Checklist, FFE) for quick toggling
- **Floor collapse on Checklist**: Floor banners now have full collapse/expand (▶/▼), move up/down arrows, rename, and delete — matching Walkthrough functionality
- **Floor grouping on FFE**: Added floor banner rows with collapse toggle to FFEView for consistency across all views
- **localStorage cache migration**: Old "everything expanded" cache is invalidated on first load so returning users get the new collapsed default

### Legacy Floor Migration (P0)
- **Backend endpoint**: `POST /api/projects/{project_id}/migrate-legacy-floors` detects rooms named like floor headers (1ST FLOOR, BASEMENT, etc.) with no items and converts them to proper floor assignments
- **Frontend button**: "FIX LEGACY FLOORS" button on both Walkthrough and Checklist views

### Floor Management System (Previously Implemented)
- Collapsible floor banners with drag-to-reorder, rename, delete
- Floor assignment dropdowns on every room header
- `floor_order` stored on project for user-controlled ordering
- Add Floor / Section input

### Room Notes
- Notes textarea at bottom of each room section
- Saves via `PUT /api/rooms/{roomId}` on blur
- Synced across Walkthrough, Checklist, FFE

### Room Colors
- 96 distinct, non-repeating colors via golden angle algorithm
- Colors synced via DB across all views

### 3D Shower View (ThreeShowerView.js)
- meshBasicMaterial for pixel-perfect color rendering
- Tile crop, patterns (Stacked, Offset, 1/3 Offset, Vertical, Herringbone, Basket Weave)
- Drag-and-drop tiles onto walls, bench, niche

### Inline Editing
- contentEditable fields for room names, category names, item properties
- Saves to API on blur

## Credentials
App Password: `DesignReady2026!`

## Key API Endpoints
- `PUT /api/rooms/{room_id}` - Update room (name, floor, color, notes)
- `PATCH /api/items/{item_id}/quick-update` - Inline item editing
- `PUT /api/projects/{project_id}` - Update project (floor_order)
- `POST /api/projects/{project_id}/migrate-legacy-floors` - Legacy floor migration

## Remaining / Backlog
### P1
- Auto-populate plumbing fixtures from FFE/checklist into 3D palette
- Mobile walkthrough floor grouping

### P2
- Glass door panel / shower enclosure frame in 3D view
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Refactor SimpleWalkthroughSpreadsheet.js into smaller components
- Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- Archive/remove unused /app/mobile/ directory
