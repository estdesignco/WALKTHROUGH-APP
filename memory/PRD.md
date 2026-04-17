# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented (Apr 17, 2026)

### Performance Optimization (P0 - CRITICAL FIX)
- **Default collapsed state**: All rooms, categories load COLLAPSED on Walkthrough, Checklist, FFE, and Mobile views
- **DOM reduction**: 38+ rooms → ~50 lightweight headers on load instead of thousands of DOM nodes
- **EXPAND ALL / COLLAPSE ALL buttons**: All spreadsheet views (desktop + mobile)
- **Floor collapse on Checklist**: Full collapsible floor banners with toggle/move/rename/delete
- **Floor grouping on FFE**: Floor banner rows with collapse toggle
- **Floor grouping on Mobile**: Tab bar floor labels, floor banners on MobileWalkthrough/MobileFFE
- **localStorage cache migration**: Old "everything expanded" cache invalidated

### Drag-and-Drop Fix (P0)
- Fixed index mismatch: removed sort in render IIFE, using original array order with floor grouping
- Always render ALL Draggables (collapsed floors use height:0 instead of removal from DOM)
- react-beautiful-dnd index tracking preserved

### Legacy Floor Migration (P0)
- Backend: `POST /api/projects/{project_id}/migrate-legacy-floors`
- Frontend: "FIX LEGACY FLOORS" button on Walkthrough and Checklist

### Floor Management System
- Collapsible floor banners with drag-to-reorder, rename, delete
- Floor assignment dropdowns on every room header
- `floor_order` on project for user-controlled ordering

### Room Notes
- Synced across Walkthrough, Checklist, FFE, Mobile

### Room Colors
- 96 distinct colors via golden angle algorithm, synced via DB

### 3D Shower View (ThreeShowerView.js)
- 6 tile patterns, drag-and-drop tiles, bench/niche support

### Inline Editing
- contentEditable fields for room names, category names, item properties

## Credentials
App Password: `DesignReady2026!`

## Key API Endpoints
- `PUT /api/rooms/{room_id}` - Update room
- `PATCH /api/items/{item_id}/quick-update` - Inline item editing
- `PUT /api/projects/{project_id}` - Update project (floor_order)
- `POST /api/projects/{project_id}/migrate-legacy-floors` - Legacy floor migration

## Remaining / Backlog
### P1
- Auto-populate plumbing fixtures from FFE/checklist into 3D palette

### P2
- Glass door panel / shower enclosure frame in 3D view
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Refactor SimpleWalkthroughSpreadsheet.js into smaller components
- Rename GoogleAddressInput.js to AddressAutocompleteInput.js
- Archive/remove unused /app/mobile/ directory
