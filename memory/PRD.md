# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented

### Proposal / Quote Module (May 7, 2026) — NEW (huge feature)
**Builder + Trade end-to-end quote workflow with white-label, snippets, master kill-switches.**
- New tabs in Builder Portal: **PROPOSAL / QUOTE** and **TRADES**.
- New public route: `/trade/:accessCode` for sub-contractors (filtered scope).
- **3-stage gating**: designer-toggled `proposal_view_enabled` → builder accepts (typed-name signature) → editing auto-unlocks (or designer can pre-unlock via `proposal_edit_enabled`).
- **FFE-styled scope tree** in `ProposalView.js` — same gold borders, gradient room headers, dark green category bars, alternating-row recipe — extra columns: Qty / Unit / Cost / Markup % / Line Total. Live SUMS at bottom: Subtotal, Tax %, PM Fee %, **TOTAL DUE**, **Profit** (private to viewer).
- **Editable everything when unlocked**: cells are inline-editable, builder/trade can rename, override qty/unit/cost/markup, **add their own line items** anywhere (room/category/sub-category level), or pull from a **Snippets Library** (saved templates with default qty/unit/cost/markup — Dumpster, Permit Fee, Demo, etc.).
- **White-label**: `CompanyProfileForm.js` modal — logo upload (base64, ≤1.5MB), company name, address, phone, email, license #, payment terms, deposit %, accent color. Quote header swaps to viewer's branding only. **Designer name nowhere on the builder/trade quote.**
- **Trade sub-portals** (`BuilderTradesManager.js`): builder spawns one link per trade, picks visible categories, copies share URL, toggles each link on/off, deletes when done. Trade pricing **never reaches the designer**.
- **4 master kill-switches** in admin Builder Portal Manager (`ProposalToggles`):
  - `Builder Link` — hard-disables `/builder/:code`
  - `All Trade Sub-Links` — cascade-disables every trade link under this builder
  - `Proposal View` — read-only release toggle
  - `Proposal Editing` — pre-unlock without acceptance
- **Print / Save PDF**: every Proposal view has a "🖨 PRINT / SAVE PDF" button → browser print dialog renders the styled quote (white-label header + scope + sums) for save-as-PDF or print.
- **Privacy guarantees enforced server-side** (`_get_portal_by_access`):
  - Designer's pricing stripped from every builder/trade scope payload (`cost / price / budget / total_cost`).
  - Per-portal `proposal_overrides` + `proposal_extras` collections — each tier writes only into their own.
  - `company_profiles` keyed by access_code so each portal's branding is isolated.
- **General Uploads bug FIXED**: old code stored entire files array as a JSON-encoded "comment" on every upload, then concatenated all comments on load → exponential duplication + eventual MongoDB doc-size failures. Replaced with dedicated `GET/PUT /api/builder/{code}/general-files` endpoints that store a single canonical array per portal. Per-file 8MB hard cap; delete button on every tile.

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
- **Reverse-lookup badge** (May 4, 2026): every Checklist/FFE item row that is referenced in the scope doc now shows a small `📋 N` badge next to the name.

### Mobile / Privacy / Color Parity (May 5/6, 2026)
- Mobile redirect script in `index.html` whitelists `/mobile-app`, `/customer`, `/builder`, `/trade`, `/test-questionnaire` so public links never bounce to the admin app.
- Microsoft Surface (Windows + touch) treated as desktop; iPad/iPhone/Android still go to `/mobile-app`.
- Builder Portal FF&E + Photos + Manager rooms now use `getMutedRoomHeaderStyle()` — same 135° gradient + inset white-glow + heavy black inner-shadow as admin Checklist. Same `room.color` source = identical pixel render.

### Transfer Logic Fix (May 6, 2026)
- Checklist → FFE transfer now uses checkbox state ONLY (was previously also pulling items by status, causing unchecked items to leak through).

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

### Builder Portal FFE + Photos color parity (May 5/6, 2026)
- Bug: `FFEView.js` (Builder Portal-only FFE component, separate from admin `ExactFFESpreadsheet.js`) rendered room headers with flat `backgroundColor: room.color` — bright neon magenta/red on Wheeler Ridge. Admin FFE's `ExactFFESpreadsheet.js` already uses the muted gradient + heavy inner-shadow recipe.
- Fix: Centralized `getMutedRoomHeaderStyle(roomColor)` in `frontend/src/utils/roomColors.js` (mirrors the admin recipe exactly). Applied to `FFEView.js` room header rows + add-room column, `BuilderPortal.js` Photos rows, and `BuilderPortalManager.js` (admin Builder Portal tab).
- Color source unchanged: `room.color || getRoomColor(room.name)` — exact same chain as Checklist/admin FFE. Same DB value + same recipe = identical render.
- Admin FFE (`ExactFFESpreadsheet.js`) NOT touched.

## Remaining / Backlog
### P1
- Auto-populate plumbing fixtures from FFE/checklist into 3D palette

### P2
- Glass door panel / shower enclosure in 3D view
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Refactor SimpleWalkthroughSpreadsheet.js
