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

### Mobile Builder Portal Privacy Fix (May 5/6, 2026) — CRITICAL
- Bug: `index.html` had a pre-React mobile-redirect script that sent ALL mobile UAs to `/mobile-app`, only whitelisting `/mobile-app` and `/customer`. Result: when a builder opened `https://app.estdesignco.com/builder/{access_code}` on their phone, they were redirected to the **admin** app — exposing pricing/cost data.
- Fix: `frontend/public/index.html` — extended the whitelist to include `/builder` and `/test-questionnaire` so any public builder/customer link is preserved on mobile.
- Verified: iPhone UA + viewport on `/builder/7FQKGDCS` stays on the route; renders BuilderPortal header, tabs, and FF&E Schedule with NO leakage of "Cost / Price / Budget / Wholesale / Markup / Margin" terms.

### Color Parity Fix — Builder Portal uses backend ROOM_COLORS dict by name (May 5/6, 2026)
- Bug: Builder Portal Photos rows + admin Builder Portal Manager pulled `room.color` from the DB. Newer projects (e.g. Diehl Lakehouse) were seeded with the BRIGHT `DISTINCT_ROOM_COLORS` palette (Kitchen=#FF00FE, Pool Area=#F6F655…), so Photos rendered with neon flat colors. Older projects (e.g. The Elliott's) had muted dict colors stored, so they looked correct — inconsistent across projects.
- Fix:
  1. Mirrored the backend `server.py` `ROOM_COLORS` dict EXACTLY into `frontend/src/utils/roomColors.js` as `ROOM_COLORS` (+ extended with custom names from active projects: jack and jill, bunk room, scullery, ladies den, primary sitting area, etc.).
  2. Added `getMutedRoomColor(roomName)` — looks up the muted color by lowercased name, falls back to the canonical `#7A5A8A` muted purple.
  3. `BuilderPortal.js` Photos rows, item _roomColor accents, and `BuilderPortalManager.js` (room toggle buttons + photo room headers) now ignore the DB `room.color` and use `getMutedRoomColor(room.name)`.
  4. Combined with the existing `getMutedRoomHeaderStyle()` (135° gradient + inset glow + inset shadow + textShadow), every "Kitchen" row in the Builder Portal is now `#5A7A5A` muted green, every "Master Bathroom" `#8A6A5A` muted tan — verified via computed style (`rgb(90,122,90)`, `rgb(138,106,90)`).
- FFE was NOT touched per user's explicit instruction.

## Remaining / Backlog
### P1
- Auto-populate plumbing fixtures from FFE/checklist into 3D palette

### P2
- Glass door panel / shower enclosure in 3D view
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Refactor SimpleWalkthroughSpreadsheet.js
