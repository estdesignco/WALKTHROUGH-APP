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
    - Toolbar buttons (`# TRADE`, `🏷 PRODUCT`, `@ PERSON`, `▼ ROOM HEADING`) for explicit insertion
    - **Inline autocomplete**: type `#paint` for trades+products predict-text, `@joe` for people; Up/Down + Enter/Tab to select, Esc to cancel
    - Product picker pulls from BOTH FFE and Checklist with color-coded source badges (blue FFE / green CHK)
    - Trades list includes TRIM CARPENTER + 19 other defaults; user can add custom trades
    - Quill custom blots (TradeTagBlot, ProductTagBlot, PersonTagBlot) with class-only styling for round-trip persistence
    - Builder portal AUTO-GENERATES "By Room" and "By Trade" views by parsing inline tags + H2 room headings
  - Add schedule/timeline milestones
  - Add change orders with dates
  - Add project contacts (name, role, phone, email)
  - Copy shareable link
- **Builder Portal scope views**: Overall (full doc as-is) / By Room (auto-grouped) / By Trade (auto-grouped)
- **Price stripping**: cost, price, budget, total_cost all removed from builder view

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
