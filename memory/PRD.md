# PRD — Interior Design Project Management Tool

## Architecture — React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

### Houzz vt-Table Parser Rewrite + Separate Checklist Import (Feb 2026) — NEW
**P0 fix: user raged the Houzz import "doesn't read the lines" (9 items → 2 kept, 10 → 1) and that PO import + Checklist import were wrongly combined into one function.**
- **Root cause:** old parser read Houzz outline numbers ("1.1", "2.2") as quantities, then a qty×unit≠ext math check silently deleted the real rows. Edit views keep all data in `<input value>` fields the old text-based parser never read.
- **New primary parser `_extract_vt_rows()` (`houzz_import.py`):** reads Houzz Pro's semantic virtual-table DOM (`div.tr.vt-row`): `vt-group-row` → room names (SCULLERY, MAN CAVE); `auto-number-column` = row #; `.print-item-name`/`.print-item-note`/`.item-extra-info-pair` (preview views); `<input>` by data-testid/placeholder — quantity, materialCost, "Add SKU", "Add a manufacturer", "Add a color", "Add dimensions", "Add materials", "Add Room" (edit views). Parent/child folding for purchase docs (drape line "1" wrapper folded into fabric spec "1.1"). Unit price derived from total/qty. SKU regex from "(TOB5158)" patterns.
- **Dedupe rewritten:** no more math-based row deletion; only drops placeholder/totals/empty-stub/duplicate rows.
- **Meta fixed:** document # must contain digits; totals must be $-amounts (largest match wins) — ES-400220: subtotal $116,563.06, total $124,722.46 ✓.
- **Two SEPARATE functions (user's explicit demand):**
  1. **PO import** — Purchase Orders tab → "Import from Houzz" (`po-import-houzz-btn`), target defaults to `purchase_order`.
  2. **Checklist import** — Checklist tab banner "Import from Houzz → Checklist" (`checklist-import-houzz-btn`), target defaults to `checklist`. Commit creates Room → FF&E → HOUZZ IMPORT hierarchy (rooms auto-created from Houzz room groupings, per-item room override inputs in review screen). `link` = manufacturer_link ONLY (21 approved B2B domains; blank when brand unapproved — NEVER retail).
- **Review screen upgraded:** Img thumbnail, editable Room, Item, Brand, SKU, Finish/Color, Size, Qty (+unit type), Unit, Ext., Manufacturer columns. "Recent Houzz captures" list on input phase → re-parse + import stored sessions WITHOUT re-scraping (`/api/houzz/reparse/{sid}`).
- **Verified against the user's two REAL stored captures** (db.houzz_raw_captures: hz_cgtfil6xyf estimate 7 items, hz_gzl1npa1v3 drapery PO 5 Kasmir fabric items). 17 regression tests in `tests/test_houzz_parser.py` (fixtures in `tests/fixtures/`). **iteration_60: 24/24 backend + 100% frontend PASS.** Test data cleaned up post-verification.
- Known limitation: images absent in the 2 existing captures because Houzz lazy-load hadn't finished at capture time (extension shows loading dots). Parser extracts `img src` whenever present. Possible future v7.48: wait for `document-image-cell` images before capture.

### Chrome Extension Download Visibility Fix (Jul 5, 2026)
**User complained: "YOU DIDNT INCLUDE THE DOWNLOAD FOR THE SCRAPER!" Their extension was frozen at v7.41 while the app required v7.47. Download button existed only inside modals — invisible from main pages.**
- New `GET /api/extension/version` endpoint (`server.py`) reads `/app/chrome-extension-scraper/manifest.json` at request time → returns `{version, description, download_url, filename}`. No more hardcoded version in frontend.
- New reusable `frontend/src/components/ExtensionDownloadButton.js` with `default`, `compact`, and `banner` variants. Fetches `/api/extension/version` once on mount, renders an `<a>` to `/api/download/chrome-extension?v={ver}_{timestamp}`.
- Dropped into three high-visibility spots:
  - `PurchaseOrdersDashboard.js` header — amber "⬇ Download Scraper v7.47.0" button next to Import from Houzz (`data-testid=po-download-extension-btn`).
  - `HouzzProposalImporter.js` input phase — replaced the hardcoded v7.47 banner with `<ExtensionDownloadButton variant="banner"/>`.
  - `AIDesignAssistantPanel.js` header — compact "⬇ SCRAPER v7.47.0" link next to the 🚀 BURST button (`data-testid=aiassist-download-extension`).
- **iteration_59 pytest 6/6 + UI 3/3 PASS.** Endpoint stays in sync with `manifest.json` (verified via mutate/restore test). Zip is 54,702 bytes, filename includes `v7.47`.

## Architecture  

### Houzz Proposal Import + Purchase Orders (Jul 5, 2026) — NEW
**Two P0 features shipped in one drop. 18/18 backend pytest PASS. UI verified end-to-end.**

**Houzz Proposal Import** (`/api/houzz/*`):
- New router `/app/backend/houzz_import.py` — POST `/api/houzz/proposal-import` receives scraped line items from Chrome Extension v7.43. POST `/api/houzz/proposal-import-pdf` parses a text-based Houzz PDF via PyPDF2 + pdfplumber fallback.
- Session-based review flow: POST `/api/houzz/commit` sends items to either the project's item spreadsheet (`target: items`) or a brand-new Purchase Order (`target: purchase_order`).
- Chrome Extension v7.43 (`/app/chrome-extension-scraper/content.js` line 3200+): `#design-ready-houzz-scrape` hash triggers auto-scraping of `pro.houzz.com/manage/d/estimates/*`, `/proposals/*`, `/purchase-orders/*`. Uses selector cascade + generic text-node heuristics because Houzz Pro is React with rotating class names. Posts payload to `/api/houzz/proposal-import`, notifies coordinator via `postMessage`.
- Frontend: `HouzzProposalImporter.js` — modal with URL input (opens coordinator popup), PDF fallback upload, session polling every 1.5s + `postMessage` listener, review table with manufacturer_link column, target picker (Purchase Order or Spreadsheet), initial PO status selector.

**Manufacturer Link Resolver** (`/app/backend/manufacturer_resolver.py`) — non-negotiable user rule:
- `BRAND_MANUFACTURERS` maps **75+ brands** (furniture / lighting / rugs / plumbing / appliances / hardware) to their canonical manufacturer domain + search URL.
- `FORBIDDEN_RETAILER_DOMAINS` set (33 entries: wayfair, amazon, ballard, west elm, cb2, crateandbarrel, potterybarn, williams-sonoma, overstock, perigold, onekingslane, chairish, 1stdibs, houzz.com marketplace, target, walmart, homedepot, lowes, etsy, ebay, worldmarket, anthropologie, lumens, ylighting, buildwithferguson, livingspaces, raymourflanigan, shopstyle, google, bing, pinterest, instagram, facebook).
- Rules: (1) source URL on brand's own domain → keep; (2) source URL on retailer → auto-swap to brand search URL; (3) unknown 3rd party + known brand → build brand search URL; (4) unknown brand + retailer → return null + warning.
- Verified: Wayfair Uttermost lamp → uttermost.com search; Amazon Four Hands table → fourhands.com search; direct Visual Comfort URL kept as-is. Zero retailer link leaks in production output.

**Purchase Orders** (`/api/purchase-orders/*`):
- New router `/app/backend/purchase_orders.py` — full CRUD, filtering by project_id and status, `/summary` aggregation.
- Deposit + balance payment tracking: POST `/{id}/payments` with `kind: deposit | balance | payment` + `method` (credit_card, ach, check, wire, cash) + `reference` (check#, last-4) + `note`. Status auto-advances: `pending → deposit_paid → paid` based on cumulative payments vs. total (tolerance 0.005). DELETE on payment rolls status back.
- Receipt attachments: POST `/{id}/receipts` with base64 file up to 5MB stored as data URL (fine for receipts; larger uploads should use hosted storage).
- PO PDF import: POST `/import-from-pdf` parses vendor confirmation PDFs (extracts po_number, vendor, subtotal, tax, shipping, total, line items with brand/SKU/qty/unit/ext).
- Statuses: draft, pending, deposit_paid, paid, shipped, received, cancelled.
- Frontend: `PurchaseOrdersDashboard.js` (both global at `/purchase-orders` AND per-project tab inside ProjectDetailPage between FF&E and Whole Home Finishes) + `PurchaseOrderDetailModal.js` (line items with manufacturer_link column, payment history, add-payment form, receipt upload, status pill grid, deposit/balance timestamps).
- Global nav: MainDashboard sidebar now has 💳 POs link → `/purchase-orders`.

**Files added**: `/app/backend/manufacturer_resolver.py`, `/app/backend/houzz_import.py`, `/app/backend/purchase_orders.py`, `/app/backend/tests/test_houzz_po.py`, `/app/frontend/src/components/PurchaseOrdersDashboard.js`, `/app/frontend/src/components/PurchaseOrderDetailModal.js`, `/app/frontend/src/components/HouzzProposalImporter.js`. Extension repackaged as v7.43.0 at `/app/backend/static/design-ready-scraper-v7.43.0.zip` and `/app/chrome-extension-scraper.zip`.

**Testing status**: iteration_58 — Backend 18/18 pytest PASS, frontend 95% (one LOW polish: Houzz URL validation — now fixed with stricter regex requiring `pro.houzz.com` + estimates/proposals/purchase-orders/invoices in path).



### Proposal/Quote — PDF Export + White-Label Email + Customer Accept (Feb 2026, launch-ready)

**Builders/Trades send proposals from THEIR OWN brand. Platform never appears as sender.**

- **BYO email** per portal — Company Profile now has an "EMAIL SETUP" section. Each builder picks their own provider (Resend / Gmail / Outlook / Custom SMTP), enters their own credentials, owns their own deliverability.
- **Credentials encrypted at rest** with Fernet (`FERNET_KEY` env). Cleartext keys/passwords NEVER returned in any API response.
- **PDF generation client-side** via `html2pdf.js` — pixel-identical to on-screen ProposalView.
- **SEND TO CLIENT modal** in ProposalView with pre-filled recipient (project.client_email), subject + message templates, optional CC, "Include Accept & Sign Online button" checkbox.
- **Resend last proposal (standard feature)** — every Proposal/Quote tab shows a `✓ LAST SENT to {email} · {timestamp} · ↻ RESEND` strip the moment a builder has sent at least once. One click reopens the SendToClientModal pre-filled with the previous recipient/cc/subject and a "Following up…" message template. Generates a FRESH accept token (the old link goes dead). Also shows a `📜 N sends` toggle that expands the full send history table with per-row RESEND buttons (each pulls THAT row's fields, not just the latest).
- **Main SEND button auto-relabels** to `SEND AGAIN` once history exists, so the builder never wonders "did I already send this?".
- **Customer accept link** — one-time UUID token persisted on portal, embedded in email body. Token-validated public page at `/customer-proposal/:accessCode/:token` renders read-only proposal + signature box (CustomerProposalPage.js). Empty-scope guarded: accept block renders even when proposal scope is empty. Bad tokens → graceful "Link unavailable".
- **Origin-aware accept URLs** — derives from `Origin`/`Referer` headers, so preview/staging/prod all work without code changes.
- **Backend endpoints** (`server.py`):
  - `POST /api/builder/{code}/proposal/test-email`
  - `POST /api/builder/{code}/proposal/send-email`
  - `GET /api/builder/{code}/proposal/email-log` (drives the RESEND strip + history)
  - `GET /api/customer-proposal/{code}/{token}`
  - `POST /api/customer-proposal/{code}/{token}/accept`
- **Tests**: `/app/backend/tests/test_proposal_email_white_label.py` — 9/9 pytest passing.
- **Verified end-to-end** across iterations 53, 54, 55 — 100% pass on backend + frontend.

### Proposal/Quote — Checklist-style DnD + Inline Rename (Feb 2026) — NEW
**ProposalView refactored to LOOK and OPERATE just like the admin Checklist + Snippet Library is now CLICKABLE.**

### Proposal/Quote — Checklist-style DnD + Inline Rename (Feb 2026) — NEW
**ProposalView refactored to LOOK and OPERATE just like the admin Checklist + Snippet Library is now CLICKABLE.**
- **Snippet cards are now interactive**: click any snippet → small destination-picker modal (Trade + Room dropdowns, or "+ NEW TRADE…/+ NEW ROOM…" inline inputs) → ✓ ADD LINE creates a new extra under the chosen parent with the snippet's default qty/unit/cost/markup. Cards hover-lift + gold border. Green flash + "✓ ADDED" confirmation for ~700ms after add.
- **Shift-click power-user mode**: hold Shift and click any other card → bypasses the modal and instantly adds to the last destination. Hint shows the last destination next to + NEW SNIPPET button.
- Picker handles the empty-proposal case (no trades yet) by defaulting the trade state to `__NEW__` so the new-trade/new-room inputs render immediately.
- **Three-level drag-and-drop** via @hello-pangea/dnd (matches `ExactChecklistSpreadsheet.js` exactly):
  - **Trade reorder** (top-level) — drop zone `trades`, type `TRADE`.
  - **Room reorder** within a Trade — drop zone `rooms-{TRADE}`, type `ROOM-{TRADE}`.
  - **Line reorder** within a Room — drop zone `lines-{TRADE::ROOM}`, type `LINE-{TRADE::ROOM}`.
  - `⋮⋮` drag handles on every banner + first column of every line row (matches Checklist's `cursor-move ⋮⋮` pattern).
- **Inline rename**: Trade and Room names are now `contentEditable` (same pattern as Checklist room names). Blur → debounced PUT to `proposal_layout.trade_renames` / `room_renames`.
- **Trade banner now uses Checklist Room-header recipe**: `getMutedRoomHeaderStyle(TRADE_COLORS[trade])` — full 135deg 5-stop gradient + halo glow + inset shadows + text-shadow. No more flat-colored bars.
- **Room banner** (inside Trade): `getMutedRoomHeaderStyleStandalone(room.color)` (no halo) — same as Checklist category bar treatment, room's own color preserved.
- **Line rows** use Checklist's alternating `linear-gradient(135deg, rgba(0,0,0,0.95)...)` recipe instead of solid `#0a0a0a`/`#0f0e0e`.
- **Layout persistence**: All ordering + renames stored in `portal.proposal_layout = { trade_order, room_order, line_order, trade_renames, room_renames }` via new endpoint `PUT /api/builder/{access_code}/proposal/layout` (works for builder + trade portals, enforces `proposal_edit_enabled` gate).
- All editable cells keep using `contentEditable` spans (not `<input>` boxes) — Excel-cell aesthetic preserved.
- Tests: `/app/backend/tests/test_proposal_layout.py` (5 passing pytest cases).

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
- Tune per-vendor login form selectors in `vendor_scraper.py` / `vendor_portals.py` (Loloi, Bernhardt, Visual Comfort etc.) so TEST LOGIN succeeds when real B2B credentials are entered. The infrastructure (Chromium + Playwright) is fully working now; site-specific selector adjustments are all that remain.

### P2
- Glass door panel / shower enclosure in 3D view
- Refactor ExactChecklistSpreadsheet.js (4000+ lines)
- Refactor SimpleWalkthroughSpreadsheet.js
- Refactor server.py (>21k lines) into separate route modules

### BURST BACKFILL — Browser-side scraper popup (June 1, 2026) — NEW
**The "use the user's authenticated browser session" pattern the user demanded.**

Cloud Playwright is permanently locked out of Uttermost, Four Hands, Gabby — they hard-detect headless. Re-running the same broken cloud scrape via the existing 🔄 BACKFILL button was pointless. New mechanism:

- **Chrome extension v7.39 (`/app/chrome-extension-scraper/`)**: appended a tiny auto-scrape handler to `content.js` that triggers when a page loads with `#design-ready-autoscrape` in the URL hash. Runs `scrapePageData()` in the user's logged-in browser, POSTs result to `/api/extension-scrape`, optionally closes the tab via `&close=1`. Shows a gold→green banner so the user knows what's happening.
- **Backend**:
  - `GET /api/ai-assist/backfill-queue?project_id=…` returns every item with a vendor link but missing image/price/size/finish/finish_image.
  - `POST /api/ai-assist/merge-cache` walks the project's items, matches each to `extension_scrape_cache` by URL, merges any newly-populated fields. Verified end-to-end: simulated extension POST → merge → Rally Mirror updated with price/size/finish/finish_image, queue dropped from 4 to 3.
- **Frontend (`BurstBackfillModal.js`)**: new modal launched from a `🚀 BURST` button in the AI panel header (purple, next to 🔄 BACKFILL). Lists missing-data items with vendor + URL + which fields are blank. One click opens all URLs as tabs (600ms stagger to dodge popup blocker), polls the cache every 3s, ticks each row ✓ as data arrives, then a `↓ MERGE INTO CHECKLIST` button writes everything back to items in one shot.
- **Why this beats the OG BACKFILL**: the user is logged into all their vendor portals in Chrome. The extension was already loaded on every page. We now use the URL hash as a one-way trigger so the cloud app can orchestrate scrapes that physically happen inside the user's browser — no extra clicks, no auth setup, no cloud scraper getting bot-blocked.

### JSON-LD Parsing Fix (June 1, 2026) — CRITICAL
**Why every HVL Group / Bernhardt / similar item came back without price, finish, or correct image.**
- **Root cause**: HVL ships valid product schema in `<script type="application/ld+json">` containing the price (`$5,410.00`), correct image, SKU, brand — but the JSON is technically INVALID (JS-style `//` line comments + trailing commas). Browsers tolerate it, `json.loads`/`JSON.parse` choke. The scraper's `try / except: continue` swallowed every failure silently, so price/finish/size always came back blank for these vendors.
- **Fix in 4 places**:
  1. New `_safe_jsonld_parse()` helper in `server.py` (strips `/* */`, `//` line comments, trailing commas → retries `json.loads`).
  2. `vendor_scraper.py` Playwright-side `page.evaluate()` JSON-LD blocks now sanitize before `JSON.parse`.
  3. `server.py` `scrape_product_advanced` BeautifulSoup fallback now extracts FROM JSON-LD FIRST (name, sku, image, price, color, dimensions, brand) and only falls back to CSS selectors / og:image when JSON-LD didn't fill that field.
  4. `server.py` `ai-assist/re-enrich` and `ai-assist/ingest-pdf` meta-fallback Playwright evals also strip JS-style comments before `JSON.parse`.
- **Frontend (`AIDesignAssistantPanel.js` → `MessageBubble`)**: detected-item cards now render a 56×56 thumbnail of `image_url`, the size (📏), finish color (🎨), finish swatch image, a `🔗 view on vendor →` link, and price in green. Before, even when enrichment succeeded the panel never displayed image/size/finish, so the user thought enrichment was broken.
- **End-to-end verified**: HVL Chambers Chandelier (`2758-AOB`) now returns `name=Chambers Chandelier`, `image_url=2758-AOB.png` (correct product image, not the banner), `sku=2758-AOB`, `vendor=Hudson Valley Lighting`, `price=$5,410.00`. Existing Foyer item backfilled to $5,410.00 via the BACKFILL button.
- **Tests**: `/app/backend/tests/test_safe_jsonld.py` — 5/5 passing covering HVL real-world payload, trailing commas, URL preservation, block comments, garbage input.

### Canva Redirect URI Fix (June 1, 2026)
- Backend `api_router` mounts at `/api`, so the OAuth callback URL is `/api/canva/callback` — not `/canva/callback` (which hits the frontend and 404s).
- Updated `CANVA_REDIRECT_URI` in `backend/.env` and `CANVA_CLIENT_ID`/`CANVA_CLIENT_SECRET` to the new integration `OC-AZ5ixiAhK2Eq`.
- User must register `https://design-burst.preview.emergentagent.com/api/canva/callback` exactly under Canva developer console → Authentication tab for the connect flow to complete.


- New dedicated **📐 Floor plan** attach button in the AI Assistant panel (`/app/frontend/src/components/AIDesignAssistantPanel.js`, next to the regular 📎 Attach).
- New backend field `floor_plan: { base64, mime_type }` on **both** `/api/ai-assist/chat` and `/api/ai-assist/ingest-pdf`.
- Server appends the floor plan as the **last image** in the Gemini request and prepends a one-line label in the user message: *"[FLOOR PLAN ATTACHED — image #N is the floor plan, image(s) #1..N-1 are the room/board. Use the plan for spatial fit and the room image(s) for character + finish."]* This lets the agent obey the "Floor Plan Interpretation" prompt section without guessing which image is which.
- A teal-bordered floor-plan chip renders above the textarea showing the thumbnail + filename. Persists until either the user removes it (✕) or the message/PDF is submitted (auto-clears).
- E2E test (Feb 26, 2026): sent a 200x200 grey JPEG as `floor_plan` with the message *"Confirm you see the floor plan attached as the LAST image and acknowledge by quoting back the FLOOR PLAN label."* The agent replied: *"I confirm I see the FLOOR PLAN attached as the last image. I will use it to guide spatial fit, room shape, wall lengths, openings, and circulation."* `user_message.image_count = 1` as expected.

### MASTER AGENT INSTRUCTIONS (Feb 26, 2026) — VERIFIED
- Replaced the agent's system prompt with the verbatim **MASTER AGENT INSTRUCTIONS** the user supplied. Now ~20.7 KB / 2,800+ words covering: Core Rule, Default Operating Mode, Canva/Board Input, Canva Workflow, Realism Standards, Instruction Fidelity, Do Not Change Items, Full-Room Image Input, Product Extraction, Multi-Angle Consistency, Perspective & Straightening, Scale & Proportion, Room Shape & Space Corrections (incl. room clearing), Empty Room Concepting, Theater/Media Room Guidance, Furniture-Line Priority, Vendor Item Identification, Vendor Fabric Matching, Wallpaper Pattern & Scale, Independent Wall Treatments, Paint Color Matching, Structured Project Continuity / Memory, Correction Priority Order, Response Behavior, Safety, OUTPUT FORMAT (strict JSON).
- Live-editable at `/api/ai-assist/prompt` (Settings → Prompt) per project, no redeploy.
- File: `/app/backend/design_agent_prompt.py`. Default constant: `DEFAULT_DESIGN_AGENT_PROMPT`.

### PDF Pipeline Hardening (Feb 26, 2026) — VERIFIED
- Replaced single-stage URL extraction with **3-stage extraction in priority order**:
  1. **Annotation links** (`pypdf.PdfReader.pages[].Annots` → `/A/URI`) — authored hyperlinks from Canva
  2. **Visible text URLs** (`page.extract_text()` → `re.compile(r"https?://[^\s\"'<>)\]\}]+")`) — catches Canva "as-text" links that aren't annotations
  3. **Raw stream URI scan** (`pdf_bytes.decode('latin-1') → URL regex`) — catches PDFs whose annotations have been flattened
- **Image-only PDF detection**: if total extracted text < 30 chars across all pages, flag `image_only_pdf: true` in the response so the frontend can show a "treated as visual board" badge. Even with zero URLs, the AI vision pipeline still runs and detects items (Gemini 3.1 Pro Vision read 3/3 items from a synthetic image-only board in testing).
- Response now includes `extraction_stages: { annotations, visible_text, raw_stream, total_unique }` so the frontend / debugger can see exactly which stage produced URLs.
- **Self-heal for missing system binaries** (`pdftoppm` + Playwright Chromium) at backend boot. Both auto-install on first run if missing. File: `/app/backend/server.py` lines ~110-145.
- Added wallpaper-specific vendor keys to the URL→key resolver: `phillipjeffries.com → phillip_jeffries`, `yorkwallcoverings.com → york_wallcoverings`, `classichome.com → classic_home`. AI-detected wallpaper links now route to the correct vendor for the public-fallback / future-auth scrape path.
- File: `/app/backend/vendor_portals.py` (added 3 keys to `_URL_DOMAIN_TO_KEY`).

### E2E test results (Feb 26, 2026)
| Scenario | annotations | visible_text | raw_stream | total | image_only_pdf | items |
|----------|-------------|--------------|------------|-------|----------------|-------|
| Synthetic 2-URL PDF (annotation + visible text) | 1 | 1 | 0 | 2 | False | 2 |
| Image-only flattened PDF (no text, no links) | 0 | 0 | 0 | 0 | **True** | 3 (via AI vision) |


- `/admin/vendor-portals` page renders all **18** supported B2B vendors with SAVE / TEST LOGIN per card. Credentials encrypted at rest with Fernet (`VENDOR_ENCRYPTION_KEY`).
- AIDesignAssistantPanel (✨ FAB on every project page) accepts Canva PDFs. Pipeline: parse PDF → extract embedded vendor URLs → render pages → Gemini 3.1 Pro Vision detects items → for each item with a vendor link try authenticated portal scraper first, fall back to public `/scrape-product`, then a third lightweight OG/JSON-LD meta extractor → return enriched items to the panel → user PUSHes to Checklist.
- 17 vendor credentials seeded encrypted. Three sessions live and verified: **Four Hands, Visual Comfort, Rowe**. Loloi/Uttermost/Bernhardt could not authenticate from the cloud preview (Uttermost & Bernhardt B2B login URLs need to be supplied by the user; their public `/customer/account/login/` endpoints either 404 or are decoys).
- **Vendor scraper hardening (May 26, 2026)**:
  - Fixed Shopify-style sites that ship duplicate hidden+visible inputs for responsive layouts (Loloi, Gabby) — `_try_fill()` helper iterates matches and skips invisibles.
  - Replaced flaky text-based post-login detection (looked for words like "error" anywhere on page) with structural signals: auth cookies present (`secure_customer_sig`, Magento `customer_authorization`, generic session/auth tokens), URL changed away from login path, or a visible "logout / my account" link.
  - Rewrote `get_product_details` to read OpenGraph meta tags + JSON-LD `Product` schema + largest visible image, so it works on virtually any vendor regardless of CSS class names.
  - Added a third-pass OG/JSON-LD fallback to the ingest pipeline so even non-authenticated vendors get image+SKU+price metadata when their public pages expose it.
- **End-to-end run with `/tmp/diehl.pdf`** (Master Bathroom): 10 vendor URLs found · 10 items detected by Gemini · **10/10 images** populated · 10/10 SKUs populated · 1/10 prices populated (Bernhardt $8,840 via og:price). 3 items routed via `portal_authenticated` (Rowe + 2× Four Hands), 7 via `public+meta_fallback`. All 10 successfully pushed to the Master Bathroom checklist via `/api/ai-assist/push-items`.
- **CRITICAL infra fix (May 26, 2026)**: backend was missing Playwright's full Chromium binary (only `chromium_headless_shell-1208` shipped; playwright 1.40 expects `chromium-1091`). Result: every TEST LOGIN + every Canva PDF vendor-link enrichment crashed with `Executable doesn't exist`. Fix: ran `playwright install chromium` (writes `/pw-browsers/chromium-1091/`) and added a self-heal block at top of `server.py` so any fresh deploy re-installs automatically on backend boot.

### AI Design Assistant — Earlier (Feb 26, 2026) — VERIFIED
- `/admin/vendor-portals` page renders all 13 (now 18) supported B2B vendors with SAVE / TEST LOGIN per card. Credentials encrypted at rest with Fernet (`VENDOR_ENCRYPTION_KEY`).
- AIDesignAssistantPanel (✨ FAB on every project page) accepts Canva PDFs. Pipeline: parse PDF → extract embedded vendor URLs → render pages → Gemini 3.1 Pro Vision detects items → for each item with a vendor link try authenticated portal scraper first, fall back to public `/scrape-product` → return enriched items to the panel → user PUSHes to Checklist.
- 7/7 backend pytest cases pass (`/app/backend/tests/test_vendor_portals_and_ai.py`). Frontend E2E (iteration_57) confirms page rendering, SAVED badge persistence, panel→portals deep-link, real PDF (`/tmp/diehl.pdf`) ingested with 10 items detected.
- **17 of 18 vendor credentials seeded for the user** (May 26, 2026) — from a screenshot the user provided. Saved (encrypted): four_hands, uttermost, global_views, rowe, regina_andrew, bernhardt, loloi, visual_comfort, hvl_group, vandh, flow_decor, crestview_collection, bassett_mirror, eichholtz, moh_america, safavieh, surya. Only `gabby` left blank (no creds in the user's screenshot).
- **5 new vendor configs added** to `vendor_portals.py` to cover the user's full set: `vandh`, `flow_decor`, `crestview_collection`, `eichholtz`, `moh_america`. Each has selectors + domain mapping registered.
- **CRITICAL infra fix (May 26, 2026)**: backend was missing Playwright's full Chromium binary (only `chromium_headless_shell-1208` shipped; playwright 1.40 expects `chromium-1091`). Result: every TEST LOGIN + every Canva PDF vendor-link enrichment crashed with `Executable doesn't exist`. Fix: ran `playwright install chromium` (writes `/pw-browsers/chromium-1091/`) and added a self-heal block at top of `server.py` so any fresh deploy re-installs automatically on backend boot.
