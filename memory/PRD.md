# PRD — Interior Design Project Management Tool

## Architecture  
React 18 + Three.js (@react-three/fiber v8) + Tailwind + FastAPI + MongoDB

## Implemented

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

### Floor-Plan Upload (Feb 26, 2026) — VERIFIED
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
