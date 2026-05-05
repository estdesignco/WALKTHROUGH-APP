# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented

### Builder Portal (Apr 17/May 4, 2026) — NEW
- **Public builder page**: `/builder/{access_code}` — no login, unique link per project
- **9 sections**: FF&E (no pricing), Photos, Scope of Work, To-Do, Schedule, Room Finishes, Change Orders, Contacts, Comments
- **Builder can comment** — section-tagged comments with author name
- **Admin management**: People → Builder Portal tab in project
  - Select which rooms builder can see
  - Scope of Work: ONE master rich-text document with inline #trade / 🏷product / @person tag pills
    - Toolbar buttons + **inline autocomplete** (`#paint`, `@joe`)
    - **Live reference model** — tags store only `item.id`; name/photo/size/status/room resolved from the current item state at render time. When an item moves Checklist → FFE, changes name, or gets a photo, ALL tags in ALL scope views update automatically.
    - Product picker pulls from BOTH FFE and Checklist (blue FFE / green CHK badges)
    - TRIM CARPENTER + 19 other default trades + custom trades
    - **Hover preview**: hover any pill → floating card with live thumbnail, vendor/SKU/size/finish/status
    - **Click navigation**: trade chip filters "By Trade"; person chip → Contacts tab; product chip → full-detail modal with large photo + "View in FF&E →"
  - Add schedule/timeline milestones, change orders, contacts
  - Copy shareable link
- **Builder Portal scope views**: Overall / By Room (auto) / By Trade (auto)
- **Price stripping**: cost, price, budget, total_cost all removed from builder view
- **Reverse-lookup badge** (May 4, 2026): every Checklist/FFE item row that is referenced in the scope doc now shows a small `📋 N` badge next to the name. Hover → see every scope sentence that references this item (with room & trade chips). Click → jumps to the Builder Portal Scope editor via `jump-to-scope` custom event. Module-level cache keyed by project id; `invalidateScopeRefs()` fires after scope save so badges update without a page reload.

### Performance Optimization (Apr 17, 2026)
- Default collapsed state for all rooms/categories across all views
- EXPAND ALL / COLLAPSE ALL buttons on all spreadsheets
- Collapsible floor banners on Checklist and FFE
- Floor grouping on mobile views
- localStorage cache migration

### Drag-and-Drop Fix (Apr 17, 2026)
- Flat sequential indices for react-beautiful-dnd compatibility
- handleDragEnd uses same orderedRooms array as render
- Removed error popup — silent reload on failure

### Floor Management System
- Collapsible floor banners with reorder, rename, delete
- Floor assignment dropdowns on room headers
- Legacy floor migration endpoint

### Other Features
- Room Notes synced across all views
- 96 distinct room colors via golden angle algorithm
- 3D Shower View with tile patterns
- Inline editing (contentEditable)

## Credentials
App Password: `DesignReady2026!`

## Key API Endpoints
- `POST /api/builder-portal` — Create builder portal
- `GET /api/builder-portal/project/{project_id}` — Get portal (admin)
- `PUT /api/builder-portal/{portal_id}` — Update portal
- `GET /api/builder/{access_code}` — Public builder view
- `POST /api/builder/{access_code}/comment` — Add comment
- `PUT /api/rooms/{room_id}` — Update room
- `PATCH /api/items/{item_id}/quick-update` — Inline item editing

## Remaining / Backlog
### P1
- Auto-populate plumbing fixtures from FFE/checklist into 3D palette

### P2
- Glass door panel / shower enclosure in 3D view
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Refactor SimpleWalkthroughSpreadsheet.js
