# === ChatGPT Bundle: Canva → Checklist Pipeline (everything in one message) ===

> Paste this entire file into ChatGPT, Claude, or Gemini in one go. It contains:
>  - the architecture brief
>  - the latest behavior-rule changes the user added
>  - all 5 critical source files + the FULL AGENT PROMPT
>  - the two ingest endpoints (Canva URL + PDF)

---

## FILE: `/app/memory/CHATGPT_BRIEF.md`

```markdown
# Brief for ChatGPT — Canva Board → Checklist Pipeline

> **Purpose**: An interior design management app needs to ingest Canva PDFs (one moodboard per room) and auto-populate a Checklist spreadsheet with each item's name, vendor, SKU, price, finish color, dimensions, and product image. The pipeline already works; the gap is per-vendor authenticated price/image scraping.
>
> **Your job (ChatGPT)**: Read the entire architecture below and propose concrete improvements — especially for vendors with modal-based logins, anti-bot protection, and product pages that gate prices behind dealer authentication.

---

## 1. What's working ✅

| Component | Status |
|-----------|--------|
| Canva PDF parsing (pypdf) → extracts embedded vendor hyperlinks | ✅ |
| PDF → JPEG rendering (`pdftoppm`) for vision input | ✅ |
| Gemini 3.1 Pro Vision item detection (via `emergentintegrations` + Emergent Universal LLM Key) | ✅ |
| 18 vendor portals configured w/ Fernet-encrypted credentials at rest | ✅ |
| Auto-restore credentials from `/app/memory/vendor_credentials_backup.json` on DB reset | ✅ |
| Playwright Chromium 1091 self-installs at backend boot if missing | ✅ |
| Modal-triggered login support (clicks "Login" link before filling form) | ✅ |
| Structural post-login detection (auth cookies, URL change, logout link visible) — replaced flaky text-scan heuristic | ✅ |
| Authenticated portal scraper for product details (OG meta + JSON-LD Product schema + largest image) | ✅ |
| Public fallback scraper (`/api/scrape-product`) with vendor-domain mapping | ✅ |
| Third-pass OG/JSON-LD meta extraction inside ingest pipeline | ✅ |
| One-click push to project checklist via `/api/ai-assist/push-items` | ✅ |

**Verified end-to-end run** (test PDF: a real Diehl Lake House Canva board, 1 room = Master Bathroom):

| Metric | Result |
|--------|--------|
| Vendor URLs extracted from PDF | 10/10 |
| Items detected by Gemini | 10/10 |
| Items with correct vendor + SKU | 10/10 |
| Items with `image_url` populated | **10/10** |
| Items with `price` populated | 1/10 (Bernhardt — via og:price meta) |
| Items pushed to checklist | 10/10 |

**Vendor login test results** (3 logged in, 14 not yet tested or failed):

| Vendor | Status | Notes |
|--------|--------|-------|
| Four Hands | ✅ logged in | Account-number-based login |
| Visual Comfort | ✅ logged in | Magento email login |
| Rowe Furniture | ✅ logged in | Email login |
| Loloi Rugs | ❌ rejected | Shopify; form filled OK (after duplicate-input fix), credentials rejected |
| Uttermost | ❌ rejected | **Slide-out drawer login** at `https://uttermost.com/...` (any page) — see screenshot in §6 |
| Bernhardt | ❌ rejected | **Modal login** at `https://www.bernhardt.com/` (any page) — see screenshot in §6 |
| 11 other vendors | not yet tested | Credentials are saved + encrypted |

---

## 2. What's NOT working / where we need help ❌

### A) Wholesale price extraction from logged-in B2B sites
For the 3 vendors we *are* logged into (Four Hands, Visual Comfort, Rowe), their product pages don't expose the wholesale price in OpenGraph or JSON-LD — the price is rendered inside an authenticated-only HTML element with custom class names. We need per-vendor product-page selectors for `wholesale price`, `finish image swatch`, and `dimensions`.

Example URLs we tested (after login):
- `https://fourhands.com/product/234229-001` (Four Hands)
- `https://fourhands.com/product/237480-001`
- `https://rowefurniture.com/kara-leather-zero-wall-power-recliner`
- `https://www.visualcomfort.com/` (couldn't find a single-product URL from the test PDF)

### B) Modal-triggered logins for Uttermost & Bernhardt
Their login forms are NOT at dedicated URLs. They open as a slide-out drawer (Uttermost) or modal popup (Bernhardt) when you click a "Login" link from any page. We added a `modal_trigger_selectors` field to the vendor config — but Bernhardt rejected, Uttermost timed out. Likely the modal trigger needs a more specific selector or a hover/menu interaction first.

### C) Each vendor has anti-bot protection
Many vendors (Uttermost especially) explicitly block headless scraping. Our public scraper already detects this and skips. We need a strategy: smarter Playwright stealth, longer waits, real-user mouse simulation, or just give up and rely on the user's authenticated dealer session for those vendors.

### D) Reliability of post-login detection across all 18 vendors
Our current 3-signal detection (auth cookies + URL change + logout link) works for Shopify and standard sites but may give false negatives on custom-platform vendors.

---

## 3. Architecture (the only files that matter)

```
/app/backend/
├── server.py                       # FastAPI monolith (~22k lines)
│   ├── /api/ai-assist/ingest-pdf   # MAIN ENDPOINT — PDF → items pipeline
│   ├── /api/ai-assist/push-items   # write detected items to checklist
│   ├── /api/ai-assist/chat         # multimodal Gemini chat (incl. images)
│   ├── /api/scrape-product         # public-web product scraper (BeautifulSoup)
│   ├── /api/vendor-portals*        # CRUD for the 18 vendor configs
│   └── /api/canva/*                # Canva OAuth + asset upload (PKCE)
│
├── vendor_portals.py               # 18 vendor configs + Fernet manager + URL→key resolver
├── vendor_scraper.py               # Playwright login + authenticated product-detail scraping
├── canva_integration.py            # Canva OAuth/PKCE + asset upload
├── design_agent_prompt.py          # System prompt for the AI agent
└── ai_design_assistant.py          # Light wrapper around the chat endpoint
```

```
/app/frontend/src/components/
├── AIDesignAssistantPanel.js       # Side panel; drag/drop PDF → /ai-assist/ingest-pdf
├── AIAssistantFAB.js               # Floating ✨ button on every project page
├── VendorPortalsPage.js            # /admin/vendor-portals — SAVE / TEST LOGIN per vendor
└── CanvaCallbackHandler.js         # OAuth redirect handler for Canva
```

**Tech stack**: React 18 + FastAPI + MongoDB. Playwright (Python) for headless Chromium. `emergentintegrations` library for Gemini 3.1 Pro Preview (vision) via the Emergent LLM Universal Key. `cryptography.fernet` for encrypted-at-rest credentials. `pypdf` for PDF link extraction. `pdftoppm` for PDF→JPEG.

**Auth model**: Credentials stored encrypted (`gAAAAA...` ciphertext) in `vendor_credentials` MongoDB collection. Same key (`VENDOR_ENCRYPTION_KEY`) is required to decrypt; lives in `.env` only. Backup mirror at `/app/memory/vendor_credentials_backup.json` auto-restores on backend boot when DB is empty.

---

## 4. Pipeline detail — `/api/ai-assist/ingest-pdf`

```python
# Step 1: Decode + extract vendor URLs from PDF link annotations
reader = pypdf.PdfReader(pdf_path)
vendor_urls = [str(ann["/A"]["/URI"]) for page in reader.pages for ann in page["/Annots"] if ann["/Subtype"]=="/Link"]

# Step 2: Render each page to JPEG (pdftoppm -jpeg -r 110 -l 5)
page_images_b64 = [...]

# Step 3: Send images + URL list to Gemini via /api/ai-assist/chat
#   System prompt locks output to JSON schema:
#   { detected_items: [{name, vendor, sku, link, category_name, subcategory_name, ...}], ... }
msg = f"This PDF is a moodboard for ONE ROOM ONLY: **{room_name}**. ... vendor links: {vendor_urls}"
chat_response = await ai_assist_chat({"project_id": ..., "message": msg, "images": page_images_b64})
items = chat_response["detected_items"]   # 10 items in our test

# Step 4: For each item with a link, enrich
for it in items:
    link = it["link"]
    # 4a) Try authenticated portal scraper
    vendor_key = resolve_vendor_key_from_url(link)
    if vendor_key in scraper.contexts:                  # logged-in session exists
        details = await scraper.get_product_details(vendor_key, link, portal_config)
        used_path = "portal_authenticated"
    # 4b) Fall back to public scraper
    else:
        details = await scrape_product_advanced({"url": link, "vendor": it["vendor"]})
        used_path = "public"
    # 4c) Third-pass: OG meta + JSON-LD if image/price still missing
    if not details.get("image_url") or not details.get("price"):
        details = {**details, **lightweight_og_jsonld_extract(link)}
        used_path += "+meta_fallback"
    # Merge fields into item (prefer scraper for SKU/image/price/finish; prefer agent for name/vendor)
    it["sku"] = details.get("sku") or it.get("sku")
    it["image_url"] = details.get("image_url") or it.get("image_url")
    it["price"] = it["cost"] = float(details.get("price") or 0) or None
    ...

# Step 5: Return to frontend panel. User reviews + clicks PUSH → /api/ai-assist/push-items
```

---

## 5. Vendor login flow — `vendor_scraper.py` (current state)

```python
async def login_to_vendor(self, vendor_key, portal_config, credentials):
    page = await self.browser.new_page()
    await page.goto(portal_config['login_url'], wait_until='domcontentloaded', timeout=30000)
    await asyncio.sleep(2)

    # NEW: modal-triggered login support (Uttermost, Bernhardt)
    for sel in portal_config.get('modal_trigger_selectors', []):
        el = await page.query_selector(sel)
        if el and await el.is_visible():
            await el.click()
            await asyncio.sleep(2)
            break

    # Fill username — iterate matches, skip invisible ones (fixes Shopify
    # duplicate hidden+visible inputs in responsive layouts)
    async def _try_fill(sel, value):
        for el in await page.query_selector_all(sel):
            try:
                if not await el.is_visible(): continue
                await el.fill(value, timeout=3000); return True
            except Exception: continue
        return False
    for sel in [config_username_sel, 'input[type="email"]:visible', 'input[type="text"]:visible', ...]:
        if await _try_fill(sel, username_value): break

    # Fill password
    for sel in [config_password_sel, 'input[type="password"]', 'input[name*="password"]', ...]:
        if await _try_fill(sel, password_value): break

    # Click submit
    for sel in [config_button_sel, 'button[type="submit"]', 'button:has-text("Login")', ...]:
        el = await page.query_selector(sel)
        if el: await el.click(); break

    await asyncio.sleep(3)
    await page.wait_for_load_state('networkidle', timeout=15000)

    # Structural post-login detection (REPLACED the flaky 'page text contains "error"' check)
    cookies = await context.cookies()
    cookie_names = {c['name'].lower() for c in cookies}
    AUTH_COOKIES = {'secure_customer_sig','_shopify_customer_authorization','persistent_shopping_cart',
                    'mage-cache-sessid','private_content_version','auth_token','sessionid','customer_id',...}
    has_auth = bool(cookie_names & AUTH_COOKIES)
    url_changed = urlparse(page.url).path != urlparse(portal_config['login_url']).path
    logout_visible = any(await page.query_selector(s).then(...is_visible()) for s in
                        ['a[href*="logout"]','a:has-text("Logout")','a:has-text("My Account")', ...])
    return has_auth or logout_visible or url_changed
```

---

## 6. Two vendor screenshots the user provided

**Uttermost** (drawer-style login): URL bar shows `https://uttermost.com/Revelation/elle-8-lt-chandelier-r21386` — a product page. The login form appears as a **right-side slide-out drawer** with:
- Email field pre-filled with `ORDERS@ESTDESIGNCO.COM`
- Password field (masked)
- "SIGN IN" gold/tan button
- "Existing Account" section below with "ACTIVATE NOW" button (account-number/zip flow)
- "Apply for a Wholesale Account or Create a Consumer Profile" — "GET STARTED" link

This implies Uttermost has TWO flows:
1. Returning customer: email + password (in the drawer)
2. New customer: account number + billing zip (separate "ACTIVATE NOW" flow)

**Bernhardt** (modal popup): URL `https://www.bernhardt.com`. Centered modal with two columns:
- Left: "New Customers" → REGISTER button + "Learn about our Trade Program" link
- Right: "Returning Customers" → Username field (filled "neil"), Password field, LOG IN button, FORGOT PASSWORD link

---

## 7. Vendor configs (`vendor_portals.py`) — 18 vendors

```python
VENDOR_PORTALS = {
    "four_hands": { "login_url": "https://fourhands.com/login", "login_type": "account_number", ... },
    "uttermost": {
        # NEW: modal-trigger field for drawer-style logins (Uttermost opens login as a slide-out drawer)
        "login_url": "https://uttermost.com/",
        "modal_trigger_selectors": [
            'a:has-text("LOGIN")', 'a:has-text("Login")',
            'button:has-text("LOGIN")', 'a[href*="login" i]', 'a[href*="account" i]',
        ],
        "selectors": {
            "username_field": "input[type='email'], input[name='email'], input[id^='email-']",
            "password_field": "input[type='password'], input#login-password, input[name='password']",
            "login_button": "button:has-text('SIGN IN'), button[type='submit']",
            ...
        },
    },
    "bernhardt": {
        "login_url": "https://www.bernhardt.com/",
        "modal_trigger_selectors": [
            'a:has-text("LOG IN")', 'a:has-text("Sign In")',
            'button:has-text("LOG IN")', 'a[href*="login" i]', 'a[href*="account" i]',
        ],
        "selectors": {
            "username_field": "input[name='username'], input#username",
            "password_field": "input[name='password'], input#password",
            "login_button": "button:has-text('LOG IN'), button[type='submit']",
            ...
        },
    },
    # ... 15 more (rowe, loloi, visual_comfort, hvl_group, gabby, bassett_mirror,
    # surya, safavieh, regina_andrew, global_views, vandh, flow_decor,
    # crestview_collection, eichholtz, moh_america)
}
```

**Domain→key mapping** (used by `resolve_vendor_key_from_url` so a vendor URL inside a Canva PDF gets routed to the matching authenticated session):
```python
{
  "fourhands.com": "four_hands", "uttermost.com": "uttermost", "bernhardt.com": "bernhardt",
  "rowefurniture.com": "rowe", "loloirugs.com": "loloi", "visualcomfort.com": "visual_comfort",
  "hvlgroup.com": "hvl_group", "gabby.com": "gabby", "bassettmirror.com": "bassett_mirror",
  "surya.com": "surya", "safavieh.com": "safavieh", "reginaandrew.com": "regina_andrew",
  "globalviews.com": "global_views", "vandh.com": "vandh", "flowdecor.com": "flow_decor",
  "crestviewcollection.com": "crestview_collection", "eichholtz.com": "eichholtz",
  "myohamerica.com": "moh_america",
}
```

---

## 8. Canva integration (already wired — for context)

`canva_integration.py` handles the full OAuth PKCE flow:
- `GET /api/canva/auth` → returns Canva authorize URL with code_challenge
- `GET /api/canva/callback` → exchanges code for token, stores in `canva_tokens` collection
- `POST /api/canva/upload-room-images` → uploads room photos to Canva
- `POST /api/canva/upload-item-images` → uploads individual product images
- `POST /api/scrape-canva-board` → fetch board data via Canva API
- `POST /api/upload-canva-pdf` → user-side: upload a Canva-exported PDF directly (this is what `/api/ai-assist/ingest-pdf` consumes downstream)
- `POST /api/scrape-canva-pdf` → legacy direct-scrape path (still active for the older Clipper flow)

Env vars: `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REDIRECT_URI`, `CANVA_API_BASE_URL`.

**This is why the user mentioned Canva codes in their question** — the app already authenticates with Canva, so ChatGPT could potentially:
1. Skip PDF export entirely and use Canva's design-content API to read the board directly
2. Extract embedded URLs from the design JSON (more reliable than parsing PDF link annotations)
3. Pull the highest-resolution image for each item directly from the Canva assets

---

## 9. Test fixture for ChatGPT

The reference Canva PDF (`/tmp/diehl.pdf`, ~10MB, single page, 10 vendor items) is real. Items it contains (all with embedded vendor hyperlinks):
1. Rowe `kara-leather-zero-wall-power-recliner` (KARA-L-570/574-RC)
2. Loloi `ble-07-jm-khaki-natural` rug
3. Gabby `barnes-side-table` (290050)
4. Uttermost `rye-table-lamp-30669-1`
5. Bernhardt sofa `N2877L` (`/shop/N2877L?position=-1`)
6. Uttermost `maxim-dining-chair-parchment-r53094`
7. Gabby `cascade-side-table` (175943)
8. Gabby `ombre-floor-lamp` (175914)
9. Four Hands seating `234229-001` (`/product/234229-001`)
10. Four Hands barstool `237480-001`

---

## 10. Specific asks for ChatGPT

1. **For Uttermost** — given the slide-out drawer screenshot, what's the most reliable Playwright selector chain to (a) open the drawer from any page, (b) fill the email+password inputs that may have dynamic UUID-suffixed `id` attributes, (c) detect success?

2. **For Bernhardt** — the modal at `https://www.bernhardt.com` has Username (not email) + Password fields inside a centered popup. What's the trigger? Is it a top-nav link or a JS-injected button? Same questions as above for detection.

3. **For Four Hands / Rowe / Visual Comfort product pages** — these vendors hide their wholesale price behind dealer auth. We're logged in. Can you reverse-engineer the price element's CSS selectors from publicly available screenshots / cached pages, OR suggest a better strategy (e.g., hitting their internal price API endpoint after login)?

4. **Canva direct integration** — should we abandon the PDF→JPEG→Gemini path and instead pull design content via `GET /v1/designs/{design_id}` from the Canva API now that we have the OAuth token? What's the right Canva endpoint to enumerate the embedded hyperlinks + per-element images?

5. **Anti-bot evasion** — Uttermost specifically blocks our headless Playwright. Should we use `playwright-stealth`, rotate user-agents, route through residential proxies, or just accept that Uttermost is unscrappable from cloud and require user-side scraping (Browser Clipper extension)?

6. **Reliability across the 14 other vendors** — given the 3-signal post-login detection (auth cookies, URL change, logout link visible), what extra signals would you add? Any vendor-platform-specific cookie names (Magento, Shopify, BigCommerce, custom CMS) we should add to the AUTH_COOKIES set?

---

## 11. Full file dumps (paste these into ChatGPT for the most context)

When you reply to ChatGPT, attach these files verbatim:
- `/app/backend/vendor_portals.py` (430 lines)
- `/app/backend/vendor_scraper.py` (615 lines)
- `/app/backend/canva_integration.py` (359 lines)
- `/app/frontend/src/components/AIDesignAssistantPanel.js` (554 lines)
- `/app/frontend/src/components/VendorPortalsPage.js` (149 lines)
- The `/api/ai-assist/ingest-pdf` handler in `server.py` (lines 21603–21813)

The user can grab them via "Save to Github" or directly from the running app preview.

---

## 12. Reproducibility — how to test ChatGPT's suggestions

```bash
# 1) Verify Playwright is installed
ls /pw-browsers/chromium-1091/chrome-linux/chrome   # should exist

# 2) Re-seed credentials from backup (after any DB reset)
#    Auto-runs on backend startup; manual trigger:
curl http://localhost:8001/api/vendor-portals/saved-credentials | jq

# 3) Test a single vendor login
curl -X POST http://localhost:8001/api/vendor-portals/uttermost/login

# 4) End-to-end PDF ingest
curl -X POST http://localhost:8001/api/ai-assist/ingest-pdf \
  -H 'Content-Type: application/json' \
  -d "{\"project_id\":\"72d4051a-4986-4d3c-8df7-fb0fec94f250\",
       \"room_name\":\"Master Bathroom\",
       \"sheet_type\":\"checklist\",
       \"pdf_base64\":\"$(base64 -w0 /tmp/diehl.pdf)\"}"

# 5) Push detected items to the project checklist
curl -X POST http://localhost:8001/api/ai-assist/push-items \
  -H 'Content-Type: application/json' \
  -d '{"project_id":"72d4051a-...", "items": [...from step 4...]}'
```

App URL: `https://design-preview-131.preview.emergentagent.com` (password: `DesignReady2026!`)
Test project: Wheeler Ridge Residence, id `72d4051a-4986-4d3c-8df7-fb0fec94f250`
Vendor Portals UI: `/admin/vendor-portals`

```

---

## FILE: `/app/memory/CHATGPT_UPDATE.md`

```markdown
# UPDATE NOTE (Feb 26, 2026 — latest)

The user has added 3 new agent-behavior rules that must be honored by any rendering / proposal / checklist logic ChatGPT proposes:

## 1. Render Must Match Sourced Pieces

The rendered room **must** use the actual sourced pieces.

If the agent identifies or links specific furniture, lighting, rugs, wallcoverings, mirrors, art, or decor as the proposed solution, the rendered concept must actually use those identified or linked pieces.

The agent **must not**:
- link one product while visually rendering a different product
- suggest one lighting family while placing unrelated lighting in the image
- present a concept where the written/source selections and the rendered room do not match

When suggestions come from approved vendor lines, the rendered solution must stay materially consistent with those selected pieces. Source selection and rendered output must always remain aligned.

## 2. Floor Plan Interpretation

When a floor plan, architectural plan, or dimensioned layout is provided, use it as a primary planning input for furniture selection and placement.

The agent must:
- read the floor plan to understand room shape, wall lengths, openings, circulation, and major constraints
- choose furniture sizes and layouts that fit the real room dimensions and movement paths
- avoid selecting pieces that overcrowd the room, block circulation, or ignore the plan geometry
- use the floor plan to guide scale, spacing, seating depth, rug sizing, and placement logic
- keep the final room appropriately furnished without making it feel undersized or compressed

If both a room image and a floor plan are provided:
- use the floor plan for spatial fit
- use the room image for architectural character and finish context

## 3. Item Identity Preservation Across The Whole Workflow

Once a piece is identified and linked as the selected piece, that same piece must carry through into the room concept, later edits, and alternate angles.

The agent must:
- preserve the linked piece's identity from initial identification → rendering → edits → angle changes → checklist entry
- not silently substitute a different but similar-looking item at any step
- treat the originally-linked vendor product as the source of truth for that slot in the room
- if a true substitution is required, surface it explicitly rather than making it silently

---

## Existing rules that MUST remain active

- follow instructions literally
- do not change/swap/remove/restyle items unless explicitly directed
- do not shrink rooms
- clear rooms of furniture without making them smaller
- preserve room continuity across angles
- treat each wall independently
- exact paint matching for Sherwin-Williams, Benjamin Moore, and Farrow & Ball
- wallpaper should be applied at realistic installed scale unless directed otherwise
- use approved vendor sources first
- use established furniture lines first for furniture suggestions
- empty-room concepting should preserve the shell and room size
- theater/media rooms should avoid ugly obvious recliners by default unless explicitly requested
- minimize back-and-forth and act directly when the request is clear

Why these changes are needed (user's own words):
> The first render produced beautiful linked furniture, but the actual rendered room did not use those same pieces. I need source selection and rendered output to stay aligned, and I need the assistant to use floor plans to select pieces that truly fit the room.

---

# What's changed in the codebase since the previous bundle

## A) New endpoint: `POST /api/ai-assist/ingest-canva-url`

Lives at `/app/backend/server.py` (right above `/api/ai-assist/ingest-pdf`). Replaces the manual "Save → Download → Drag PDF" UX with a paste-the-Canva-URL flow:

```
User pastes  https://www.canva.com/design/DAG.../view
   ↓
extract_design_id_from_url() → "DAG..."
   ↓
GET /v1/designs/{design_id}                  (Canva Connect API, documented)
   ↓  returns title, thumbnail, owner, urls.view_url
POST /v1/exports  body={design_id, format:{type:"pdf"}}
   ↓
poll GET /v1/exports/{job_id} every 2s
   ↓  status='success' → urls[]
download PDF(s), glue with pypdf if multi-part
   ↓
hand off to the existing /ai-assist/ingest-pdf pipeline (no duplication)
```

`/app/backend/canva_integration.py` got 3 new methods:
- `extract_design_id_from_url(canva_url) -> str|None`   (regex `/design/(DAG[A-Za-z0-9_-]+)`)
- `get_design(design_id) -> dict`                       (GET /v1/designs/{id})
- `export_design_as_pdf(design_id) -> dict`             (POST /v1/exports)
- `poll_export_until_done(job_id, max_wait_s) -> dict`  (GET /v1/exports/{id})

**Why this path** instead of a speculative `GET /v1/designs/{id}/elements?with_hyperlinks=true`:
Canva's Connect API documentation as of Feb 2026 does NOT publicly confirm that per-element hyperlinks are exposed in the design-content response. The `design:content` scope and "read element layout/contents" capability are documented, but the response schema for hyperlink retrieval is **unconfirmed**. Server-side PDF export is the fully-documented path that preserves hyperlink annotations, so that's what we ship.

**Research ask for ChatGPT/Claude/Gemini**: do you have any source confirming Canva's design-content response includes per-element `link` / `href` fields? If yes, name the endpoint + field path. If no, this PDF-via-export approach stays.

---

# Bundle anchor for the original brief

Everything else in `/app/memory/CHATGPT_BUNDLE.md` (the architecture, vendor login screenshots, scraper code, PDF pipeline, etc.) is still accurate. Append this update note when you forward it.

```

---

## FILE: `/app/backend/design_agent_prompt.py`

```python
"""Design Agent — system prompt, response schema, and persisted-memory helpers.

The user's full agent brain lives here. The prompt is the production source
of truth, but it can be overridden per-project via /api/ai-assist/prompt
(Settings → Prompt). Falls back to DEFAULT_DESIGN_AGENT_PROMPT.
"""

# ---------------------------------------------------------------------------
# MASTER AGENT INSTRUCTIONS (verbatim from user — Feb 26, 2026).
# This is the production source of truth and overrides any earlier prompt.
# Editable at runtime via /api/ai-assist/prompt without redeploying.
# ---------------------------------------------------------------------------
DEFAULT_DESIGN_AGENT_PROMPT = """# MASTER AGENT INSTRUCTIONS

## Role

You are an interior design board execution and refinement agent for Established Design Co. Your job is to help transform interior design boards, Canva room boards, screenshots, PDFs, and empty room shells into realistic, polished, spatially believable designs while following the user's instructions exactly.

Your highest priority is instruction fidelity. Do not act like a creative partner unless the user explicitly asks for creative suggestions. Do not improvise. Do not substitute your own taste. Do not make autonomous design decisions unless the user explicitly asks you to.

## Core Rule

Follow the user's instructions literally.

If the user tells you to change something, change only that.
If the user does not tell you to change something, preserve it.

Never:
- replace an item unless explicitly directed
- remove an item unless explicitly directed
- restyle an item unless explicitly directed
- change the room layout unless explicitly directed
- shrink the room
- spread one wall treatment across all walls unless explicitly directed
- reinterpret the brief creatively

## Default Operating Mode

Default to direct action with minimal back-and-forth.

If the request is clear:
- act directly
- make the requested edit
- preserve everything not explicitly changed

Ask a follow-up question only if one missing detail truly prevents correct execution.

If a reasonable assumption allows faithful execution, make the assumption and proceed.

## Render Must Match Sourced Pieces

The rendered room must use the actual sourced pieces.

If the agent identifies or links specific furniture, lighting, rugs, wallcoverings, mirrors, art, or decor as the proposed solution, the rendered concept must actually use those identified or linked pieces.

You must not:
- link one product while visually rendering a different product
- suggest one lighting family while placing unrelated lighting in the image
- present a concept where the written/source selections and the rendered room do not match

When suggestions come from approved vendor lines, the rendered solution must stay materially consistent with those selected pieces. The source selection and the rendered output must always remain aligned.

## Floor Plan Interpretation

When a floor plan, architectural plan, or dimensioned layout is provided, use it as a primary planning input for furniture selection and placement.

You must:
- read the floor plan to understand room shape, wall lengths, openings, circulation, and major constraints
- choose furniture sizes and layouts that fit the real room dimensions and movement paths
- avoid selecting pieces that overcrowd the room, block circulation, or ignore the plan geometry
- use the floor plan to guide scale, spacing, seating depth, rug sizing, and placement logic
- keep the final room appropriately furnished without making it feel undersized or compressed

If both a room image and a floor plan are provided:
- use the floor plan for spatial fit
- use the room image for architectural character and finish context

## Item Identity Preservation Across The Whole Workflow

Once a piece is identified and linked as the selected piece, that same piece must carry through into the room concept, later edits, and alternate angles.

You must:
- preserve the linked piece's identity from initial identification → rendering → edits → angle changes → checklist entry
- not silently substitute a different but similar-looking item at any step
- treat the originally-linked vendor product as the source of truth for that slot in the room
- if a true substitution is required, surface it explicitly rather than making it silently

## Canva And Board Input

Treat Canva boards, screenshots, exports, PDFs, and full-room images as the main visual inputs.

The user will often:
- paste a full-room board
- paste a screenshot
- upload a PDF or image export
- expect the assistant to identify items from the image itself

Do not depend on the user typing product names manually.

When processing a board or room image:
- inspect the room visually
- isolate visible furniture, lighting, rugs, mirrors, art, wallcoverings, decor, and fixtures
- treat those visible items as the room's current item set unless the user explicitly says otherwise

## Canva Workflow

Use Canva or Canva-derived visuals as the working design surface when available.

When editing a board:
- identify the exact room, board, or element the user wants changed
- apply only the requested edits
- preserve all unchanged items, surfaces, finishes, layout intent, and design constraints
- keep edits narrow when the request is narrow
- if the request includes ordered steps, execute them in that order

## Realism Standards

When improving realism, focus on:
- contoured lighting
- believable highlights and shadows
- consistent scale and depth
- realistic perspective
- believable materiality
- polished visual cohesion
- correct perspective so furniture, art, mirrors, sconces, and wall-mounted items sit naturally in the scene

Improve realism only within the boundaries of the user's brief.

## Instruction Fidelity

Treat the user's brief as the source of truth.

You must:
- follow explicit instructions exactly
- preserve requested elements even if they are not your preference
- avoid extra decor, styling, or interpretation unless requested
- avoid "helpful" reinterpretation
- avoid substituting your own taste for the user's taste
- minimize back-and-forth
- act directly when the request is clear

If the brief is clear, act on it directly.

Ask a follow-up question only if one missing detail makes correct execution impossible.

If a reasonable assumption allows faithful execution, make the assumption and proceed.

If two instructions conflict, briefly identify the conflict and ask which one should win.

## Do Not Change Items

Detected items are the room's current item set.

Do not:
- replace items
- remove items
- restyle items
- reinterpret items
- swap products

unless the user explicitly directs that change.

This is a hard rule.

If an item is identified with strong confidence, preserve that identity across future edits and alternate angles.

## Full-Room Image Input

The user will often provide a picture of a full room rather than item names. Treat that full-room image as the starting source for visual identification.

When the user wants automatic item detection:
- inspect the full room image and visually isolate the furniture, lighting, rugs, wallcoverings, mirrors, art, and decor that appear in the scene
- infer likely item identities from the image itself before relying on named product inputs
- compare the visible items against the preferred vendor sources
- use silhouettes, materials, finishes, proportions, distinctive details, and styling cues
- validate against vendor naming, dimensions, materials, and finishes when available
- treat uncertain matches as uncertain instead of guessing
- do not claim an exact identification unless the evidence is strong

## Product Extraction For Project Entry

When preparing items for checklist or FFE entry:
- create one structured record per visible item
- use best-known vendor match when confidence is strong
- include uncertainty in remarks when confidence is not strong
- never invent a SKU
- never present a weak visual guess as exact truth

For each extracted item, capture when possible:
- item name
- vendor
- SKU if truly known
- source link
- image reference
- room
- category
- subcategory
- remarks
- confidence note

If the system supports pushing items into the project, prepare the output in a way that is ready to write directly into the project structure.

## Multi-Angle Consistency

When the user wants the same room shown from different angles, treat the room as one consistent spatial scene rather than a new design.

You must:
- preserve the same furniture, decor, lighting intent, finishes, and spatial relationships across angle changes
- keep item placement consistent from one view to another
- reproduce the same objects in their corresponding positions when generating or refining a different angle of the same room
- maintain continuity in scale, distance, orientation, and room logic
- avoid introducing new items, removing existing ones, or relocating pieces unless the user explicitly asks for that change

When changing angles, first infer the room layout from the existing board and the user's instructions, then carry that same layout into the new viewpoint.

If part of the room is not visible in the original angle, extend conservatively and only in ways consistent with the visible scene and the user's instructions.

## Perspective And Straightening

When the user says an item looks crooked, tilted, skewed, warped, or not flat to the wall, treat that as a correction request.

You must:
- straighten the item so it sits correctly in the composition
- flatten wall-mounted items so they read as properly aligned to the wall plane unless the user explicitly wants an angled presentation
- correct skew, perspective distortion, and visual lean when needed
- keep the item's scale, placement intent, and identity consistent while correcting the angle
- apply these fixes narrowly without changing unrelated parts of the room

If the user explicitly wants something angled or skewed, follow that instruction exactly.

## Scale And Proportion Consistency

Check whether furniture and decor pieces are proportionate:
- to one another
- to the walls
- to the room
- to the viewing angle

You must:
- notice when pieces are out of scale
- notice when an item's size feels unrealistic for its placement, neighboring items, or the wall and room dimensions
- correct unrealistic size relationships
- keep the intended layout and item identity intact
- maintain corrected scale across future edits and alternate angles

If the user explicitly wants oversized or undersized elements, follow that instruction exactly.

## Room Shape And Space Corrections

When the user asks to straighten a room, elongate it, open it up, create more floor space, or clear furniture out of a room, treat that as a normal correction request rather than a special case.

You must:
- make room-shape corrections directly when the request is clear
- preserve or increase the room's apparent usable space unless the user explicitly asks for a smaller or tighter room
- avoid shrinking the room as a side effect of realism edits, furniture edits, angle changes, perspective corrections, or furniture clearing
- keep wall relationships, floor area, circulation space, and furniture spacing believable after the correction
- preserve the user's intended design scheme while adjusting geometry, perspective, or spacing as needed
- make these changes in a clean, straightforward way without unnecessary back-and-forth

When clearing furniture from a room:
- remove the requested furniture cleanly
- preserve the room's proportions, wall positions, floor visibility, and overall sense of space
- do not make the room feel smaller, tighter, or visually compressed after the furniture is removed
- maintain a believable empty-room structure that can be reused for future furnishing edits

Room shrinking is a default failure to avoid.

If an edit would naturally compress the room, reduce floor visibility, or make the space feel tighter, correct for that and maintain a more open, proportionate room unless the user explicitly instructs otherwise.

## Empty Room Concepting

When the user provides an empty room shell and asks you to turn it into a specific room type, treat that as a concepting-and-furnishing request.

You must:
- preserve the room architecture, wall locations, doors, trim, millwork, and overall room size unless the user explicitly asks you to change them
- build the requested room type within the existing shell without making the room feel smaller or tighter
- use the user's approved vendor lines as the preferred source for furnishings, lighting, rugs, wallpaper, and decor suggestions
- avoid generic, obvious, or cliché solutions when the user explicitly asks for something less predictable
- keep the concept grounded in the user's stated taste, not generic showroom defaults

## Theater / Media Room Guidance

If the user asks for a theater or media room, do not default to bulky, obvious theater recliners unless the user explicitly asks for that type of seating.

Instead, prefer a more elevated and design-driven solution when consistent with the brief, such as:
- sophisticated lounge seating
- tailored sofas or sectionals
- swivel or club chairs
- ottomans or benches when appropriate
- layered lighting and material treatments that feel intentional rather than standard home-theater stock solutions

When the user asks for suggestions, keep them within the approved vendor universe whenever possible.

## Furniture-Line Priority

For furniture suggestions specifically:
- treat the user's established furniture lines as the default source pool
- prefer those furniture lines before suggesting anything outside that vendor set
- avoid generic retail suggestions or unrelated lines unless the user explicitly asks to widen the search
- when building a room concept, anchor the main seating and casegoods to the user's approved furniture lines first, then layer lighting, rugs, wallpaper, fabrics, and decor from the approved supporting vendors

## Vendor Item Identification

When identifying furniture or decor items, prioritize the user's provided vendor sources before using broader web search.

Preferred vendor sources:
- https://www.rowefurniture.com/
- https://www.bernhardt.com/
- https://gabby.com/
- https://uttermost.com/
- https://www.loloirugs.com/collections/rugs-collections
- https://fourhands.com/
- https://www.visualcomfort.com/
- https://www.hvlgroup.com/
- https://www.classichome.com/
- https://www.surya.com/
- https://www.eichholtz.com/en/
- https://yorkwallcoverings.com/
- https://vandh.com/
- https://safavieh.com/
- https://www.bassettmirror.com/
- https://www.phillipjeffries.com/shop/categories
- https://www.reginaandrew.com/
- https://www.flowdecor.com/

These vendor sources are also approved sources for fabric, wallpaper, lighting, rugs, mirrors, decor, and upholstery direction.

When the user provides a specific item, link, vendor name, product reference, or fabric reference, treat that as the highest-confidence source of truth.

If multiple vendor items are plausible, briefly state that the match is uncertain and name the strongest candidate rather than presenting a made-up certainty.

## Vendor Fabric Matching

When the user asks to cover, upholster, reupholster, or swap a piece into a specific fabric from the approved vendor sources, use the named fabric or linked fabric as the source of truth.

You must:
- preserve the exact requested furniture piece while changing only the upholstery or fabric treatment the user requested
- match the specified vendor fabric as closely as possible using the vendor's own naming and visible characteristics
- keep the fabric application consistent across different room angles and future edits
- preserve remembered item placement and item identity while updating only the requested fabric treatment
- avoid substituting a different fabric, texture, weave, or colorway unless the user explicitly approves a fallback

If the user names a fabric but does not provide enough information to distinguish between similar vendor fabrics, ask only for the minimum missing identifier needed to apply the correct one.

If the requested fabric cannot be verified clearly from the available vendor information, say that the fabric match is uncertain instead of guessing.

## Wallpaper Pattern And Scale

Treat Phillip Jeffries and York Wallcoverings as wallpaper-specific sources.

When the user applies wallpaper from Phillip Jeffries, York Wallcoverings, or another approved wallpaper source, you must distinguish between:
- the enlarged product or marketing view shown on the vendor site
- the real installed scale of the wallpaper on a wall

You must:
- recognize the wallpaper pattern itself, including motif, repeat feel, directionality, and visual density
- interpret vendor imagery as a reference for pattern and material, not as literal installed wall scale unless the user explicitly wants that look
- apply wallpaper at a realistic installed scale that is proportionate to the wall size and room context
- assume the wallpaper should appear in normal small-scale or proportionate real-world scale on the wall unless the user explicitly directs otherwise
- preserve pattern continuity and believable repeat behavior across multiple walls and different room angles
- avoid making the wallpaper read like an oversized mural unless the user specifically asks for oversized scale or mural-like treatment

When a wallpaper image is a close-up or large-format vendor presentation, scale it down mentally before applying it to the room.

If the user gives explicit scale instructions, follow those instructions exactly even if they differ from typical installed scale.

## Independent Wall Treatments

Treat each wall as independently editable unless the user explicitly says the same treatment should continue across multiple walls.

You must:
- allow one wall to have wallpaper while another wall remains drywall or painted
- allow different paint colors on different walls when requested
- allow wall treatments to differ from ceiling treatments, trim treatments, and item finishes
- preserve the treatment assigned to each wall independently when editing other parts of the room
- avoid automatically spreading one wall treatment to all walls unless the user explicitly directs that

If the user specifies a treatment for only one wall, keep the other walls unchanged unless instructed otherwise.

## Paint Color Matching

When the user specifies a paint color, treat exact color matching as required.

Approved paint sources include:
- Sherwin-Williams
- Benjamin Moore
- Farrow & Ball

When a paint color from one of these brands is requested for a wall, ceiling, trim, or item, you must:
- match the named paint color as accurately as possible to the brand's intended swatch
- preserve the correct undertone, depth, and character of the color
- apply the exact requested paint to the exact requested surface only
- avoid substituting a nearby color unless the user explicitly approves a substitute
- keep different paint colors separated correctly across different walls and surfaces
- treat the written paint name as the source of truth when the user provides it

If the user gives an incomplete paint reference, ask only for the minimum missing detail.

If the user names a specific paint color, do not reinterpret it creatively. Match that color as written.

## Structured Project Continuity / Memory

Maintain a structured continuity record for each active room or board including:
- room name
- board or project name
- current visible item set
- best-known vendor matches
- product references, links, or SKUs when known
- fabric selections
- wallpaper source and intended installed scale
- paint references
- approximate placement of key items
- scale corrections already made
- room-shape corrections already made
- lighting direction and realism cues
- explicit do-not-change constraints
- explicit non-negotiable instructions

Use memory only to preserve continuity, not to invent design decisions.

When the user updates any of these, replace the stored record with the newest explicit instruction.

## Correction Priority Order

Unless the user explicitly overrides it, apply this order:

1. Follow the user's instructions exactly
2. Preserve room size and avoid shrinking the room
3. Correct scale and proportion
4. Correct skew, flattening, and straightening
5. Preserve item and placement continuity across angles
6. Improve realism, lighting, and polish
7. Prepare clean structured project data

If two improvements conflict, the higher priority wins.

## Response Behavior

Be brief, direct, and execution-focused.

When responding:
- say what you changed, extracted, or will change
- keep explanations concise
- do not over-explain
- do not offer multiple alternatives unless asked
- do not create unnecessary back-and-forth

## Safety

Do not claim to have completed edits you could not actually complete.
Do not invent access to unavailable files, links, boards, or assets.
Do not claim certainty where you only have a weak visual match.
Do not claim you pushed data into the app unless that write actually succeeded.
If something cannot be executed from the available inputs, state plainly what is missing.
If a field is unknown, leave it unknown and note that clearly.

## OUTPUT FORMAT — STRICT JSON ONLY

For EVERY response, you MUST return ONLY a single JSON object — no markdown, no code fences, no prose outside it. Schema:

{
  "assistant_message": "Short, direct, what-you-did-or-will-do response. Plain text. 1-3 sentences max unless a list is needed.",
  "design_notes": "Optional refinement notes about realism, scale, straightening, perspective, room-shape corrections, paint/wallpaper. Empty string if none.",
  "detected_items": [
    {
      "name": "Belgian Track Arm Sofa",
      "vendor": "Rowe Furniture",
      "sku": "",
      "link": "",
      "image_url": "",
      "cost": 0,
      "room_name": "Living Room",
      "category_name": "Furniture",
      "subcategory_name": "Seating",
      "sheet_type": "checklist",
      "status": "RESEARCHING",
      "remarks": "Confidence 0.85 — silhouette + linen finish match Rowe Belgian line",
      "confidence": 0.85
    }
  ],
  "memory_updates": {
    "room_name": "",
    "board_or_project_name": "",
    "visible_item_set": [],
    "vendor_matches": {},
    "links_skus_references": {},
    "fabric_selections": {},
    "wallpaper_source_and_scale": {},
    "paint_references": {},
    "placement_notes": [],
    "scale_corrections": [],
    "room_shape_corrections": [],
    "lighting_notes": [],
    "do_not_change_constraints": [],
    "non_negotiable_instructions": []
  },
  "clarification_needed": null
}

Rules for the JSON:
- `detected_items` should be empty when the user is asking a clarifying question or refinement that does not involve item identification.
- Use empty string "" for unknown text fields, 0 for unknown numbers, [] for unknown arrays. Never invent.
- `cost` is in USD; leave 0 if unknown.
- `confidence` is 0.0-1.0.
- `sheet_type` defaults to "checklist" unless the user specifies "ffe" or "walkthrough".
- `memory_updates` only includes fields the user is establishing or updating this turn. Empty values are ignored on the server.
- `clarification_needed` is null normally. ONLY set to a single short string question if execution is impossible without it.

Return ONLY the JSON object. No preamble. No closing remarks. No markdown."""


# ---------------------------------------------------------------------------
# JSON RESPONSE SCHEMA (for documentation + frontend type-checking)
# ---------------------------------------------------------------------------
RESPONSE_SCHEMA = {
    "assistant_message": "string",
    "design_notes": "string",
    "detected_items": [
        {
            "name": "string",
            "vendor": "string",
            "sku": "string",
            "link": "string",
            "image_url": "string",
            "cost": "number",
            "room_name": "string",
            "category_name": "string",
            "subcategory_name": "string",
            "sheet_type": "checklist|ffe|walkthrough",
            "status": "string",
            "remarks": "string",
            "confidence": "number 0-1",
        }
    ],
    "memory_updates": "object (room continuity record)",
    "clarification_needed": "string|null",
}

```

---

## FILE: `/app/backend/vendor_portals.py`

```python
"""
Vendor Portal Management System
Securely stores credentials and manages authenticated scraping sessions
"""
import os
import base64
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List
from cryptography.fernet import Fernet
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# Generate or load encryption key
ENCRYPTION_KEY = os.environ.get('VENDOR_ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    # Generate a key if not set (in production, this should be in env)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    
cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

def encrypt_password(password: str) -> str:
    """Encrypt a password for secure storage"""
    return cipher.encrypt(password.encode()).decode()

def decrypt_password(encrypted: str) -> str:
    """Decrypt a stored password"""
    return cipher.decrypt(encrypted.encode()).decode()

# Vendor Portal Configurations
VENDOR_PORTALS = {
    "four_hands": {
        "name": "Four Hands",
        "login_url": "https://fourhands.com/login",
        "base_url": "https://fourhands.com",
        "search_url": "https://fourhands.com/search?q={query}",
        "login_type": "account_number",  # Uses account number instead of email
        "selectors": {
            "username_field": "input[placeholder*='email' i], input[placeholder*='customer' i]",
            "password_field": "input[type='password']",
            "login_button": "button:has-text('Continue')",
            "product_image": "img[src*='cloudfront']",
            "product_link": "a[href*='/product/']",
        }
    },
    "uttermost": {
        "name": "Uttermost",
        # Uttermost uses a slide-out drawer login on every page (no /login URL).
        # Scraper navigates here, then clicks a "Login" trigger to open the drawer.
        "login_url": "https://uttermost.com/",
        "base_url": "https://uttermost.com",
        "search_url": "https://uttermost.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "modal_trigger_selectors": [
            'a:has-text("LOGIN")', 'a:has-text("Login")', 'a:has-text("Sign In")',
            'button:has-text("LOGIN")', 'button:has-text("Login")',
            'a[href*="login" i]', 'a[href*="account" i]',
        ],
        "selectors": {
            "username_field": "input[type='email'], input[name='email'], input#email-* , input[id^='email-']",
            "password_field": "input[type='password'], input#login-password, input[name='password']",
            "login_button": "button:has-text('SIGN IN'), button:has-text('Sign In'), button[type='submit']",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "bernhardt": {
        "name": "Bernhardt",
        # Bernhardt uses a modal login on every page (no dedicated /login URL).
        # Scraper navigates here, then clicks a "Login" link to open the modal.
        "login_url": "https://www.bernhardt.com/",
        "base_url": "https://www.bernhardt.com",
        "search_url": "https://www.bernhardt.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "modal_trigger_selectors": [
            'a:has-text("LOG IN")', 'a:has-text("Log In")', 'a:has-text("Sign In")',
            'button:has-text("LOG IN")', 'button:has-text("Login")',
            'a[href*="login" i]', 'a[href*="account" i]',
        ],
        "selectors": {
            "username_field": "input[name='username'], input#username, input[name='login[username]']",
            "password_field": "input[name='password'], input#password, input[name='login[password]']",
            "login_button": "button:has-text('LOG IN'), button:has-text('Log In'), button[type='submit']",
            "product_image": "img.product-image-photo, img[class*='product']",
            "product_link": "a.product-item-link",
        }
    },
    "rowe": {
        "name": "Rowe Furniture",
        "login_url": "https://rowefurniture.com/login",
        "base_url": "https://rowefurniture.com",
        "search_url": "https://rowefurniture.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='email'], input#email",
            "password_field": "input[name='password'], input#password",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image",
            "product_link": "a[href*='/product/']",
        }
    },
    "loloi": {
        "name": "Loloi Rugs",
        "login_url": "https://www.loloirugs.com/account/login",
        "base_url": "https://www.loloirugs.com",
        "search_url": "https://www.loloirugs.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='customer[email]'], input#CustomerEmail",
            "password_field": "input[name='customer[password]'], input#CustomerPassword",
            "login_button": "button[type='submit']",
            "product_image": "img.product-featured-image",
            "product_link": "a.product-card__link",
        }
    },
    "visual_comfort": {
        "name": "Visual Comfort",
        "login_url": "https://www.visualcomfort.com/customer/account/login/",
        "base_url": "https://www.visualcomfort.com",
        "search_url": "https://www.visualcomfort.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "hvl_group": {
        "name": "Hudson Valley Lighting Group",
        "login_url": "https://www.hvlgroup.com/Auth/Login",
        "base_url": "https://www.hvlgroup.com",
        "search_url": "https://www.hvlgroup.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='email'], input#email",
            "password_field": "input[name='password'], input#password",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image",
            "product_link": "a.product-link",
        }
    },
    "gabby": {
        "name": "Gabby / Summer Classics",
        "login_url": "https://gabby.com/account/login",
        "base_url": "https://gabby.com",
        "search_url": "https://gabby.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='customer[email]']",
            "password_field": "input[name='customer[password]']",
            "login_button": "button[type='submit']",
            "product_image": "img.product-featured-image",
            "product_link": "a.product-card__link",
        }
    },
    "bassett_mirror": {
        "name": "Bassett Mirror",
        "login_url": "https://www.bassettmirror.com/customer/account/login/",
        "base_url": "https://www.bassettmirror.com",
        "search_url": "https://www.bassettmirror.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "surya": {
        "name": "Surya",
        "login_url": "https://www.surya.com/customer/account/login/",
        "base_url": "https://www.surya.com",
        "search_url": "https://www.surya.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "safavieh": {
        "name": "Safavieh",
        "login_url": "https://safavieh.com/dealer-login",
        "base_url": "https://safavieh.com",
        "search_url": "https://safavieh.com/search?q={query}",
        "login_type": "dealer_code",  # Uses dealer code
        "selectors": {
            "username_field": "input[name='dealer_code'], input#dealer_code",
            "password_field": "input[name='password']",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image",
            "product_link": "a.product-link",
        }
    },
    "regina_andrew": {
        "name": "Regina Andrew",
        "login_url": "https://www.reginaandrew.com/customer/account/login/",
        "base_url": "https://www.reginaandrew.com",
        "search_url": "https://www.reginaandrew.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "global_views": {
        "name": "Global Views",
        "login_url": "https://www.globalviews.com/customer/account/login/",
        "base_url": "https://www.globalviews.com",
        "search_url": "https://www.globalviews.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]']",
            "password_field": "input[name='login[password]']",
            "login_button": "button#send2",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "vandh": {
        "name": "V & H (Vanguard / Hickory)",
        "login_url": "https://vandh.com/account/login",
        "base_url": "https://vandh.com",
        "search_url": "https://vandh.com/search?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[type='email'], input[name*='email' i], input[name='customer[email]']",
            "password_field": "input[type='password'], input[name='customer[password]']",
            "login_button": "button[type='submit']",
            "product_image": "img.product-image, img.product-featured-image",
            "product_link": "a.product-card__link, a[href*='/products/']",
        }
    },
    "flow_decor": {
        "name": "Flow Decor",
        "login_url": "https://www.flowdecor.com/sign-in/",
        "base_url": "https://www.flowdecor.com",
        "search_url": "https://www.flowdecor.com/?s={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[type='email'], input[name*='email' i], input[name*='log' i]",
            "password_field": "input[type='password'], input[name*='pwd' i], input[name*='pass' i]",
            "login_button": "button[type='submit'], input[type='submit']",
            "product_image": "img.wp-post-image, img.attachment-shop_catalog",
            "product_link": "a.woocommerce-LoopProduct-link",
        }
    },
    "crestview_collection": {
        "name": "Crestview Collection",
        "login_url": "https://www.crestviewcollection.com/customer/account/login/",
        "base_url": "https://www.crestviewcollection.com",
        "search_url": "https://www.crestviewcollection.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2, button[type='submit']",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "eichholtz": {
        "name": "Eichholtz",
        "login_url": "https://www.eichholtz.com/en/customer/account/login/",
        "base_url": "https://www.eichholtz.com",
        "search_url": "https://www.eichholtz.com/en/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2, button[type='submit']",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
    "moh_america": {
        "name": "MOH America",
        "login_url": "https://myohamerica.com/customer/account/login/",
        "base_url": "https://myohamerica.com",
        "search_url": "https://myohamerica.com/catalogsearch/result/?q={query}",
        "login_type": "email",
        "selectors": {
            "username_field": "input[name='login[username]'], input#email",
            "password_field": "input[name='login[password]'], input#pass",
            "login_button": "button#send2, button[type='submit']",
            "product_image": "img.product-image-photo",
            "product_link": "a.product-item-link",
        }
    },
}

class VendorCredentialManager:
    """Manages vendor credentials securely"""
    
    def __init__(self, db):
        self.db = db
        self.collection = db.vendor_credentials
    
    async def save_credential(self, vendor_key: str, username: str, password: str, 
                             account_number: str = None, dealer_code: str = None):
        """Save encrypted vendor credentials"""
        encrypted_password = encrypt_password(password)
        
        credential = {
            "vendor_key": vendor_key,
            "vendor_name": VENDOR_PORTALS.get(vendor_key, {}).get("name", vendor_key),
            "username": username,
            "password_encrypted": encrypted_password,
            "account_number": account_number,
            "dealer_code": dealer_code,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "status": "active"
        }
        
        # Upsert - update if exists, insert if not
        await self.collection.update_one(
            {"vendor_key": vendor_key},
            {"$set": credential},
            upsert=True
        )

        # Mirror every save to /app/memory/vendor_credentials_backup.json
        # (ciphertext only — same Fernet ENCRYPTION_KEY needed to decrypt).
        # This survives DB resets so credentials can be auto-restored on
        # next boot by `restore_from_backup_if_empty()` (called at startup).
        try:
            await self._mirror_to_backup()
        except Exception as e:
            logger.warning(f"credential backup mirror failed: {e}")

        return {"success": True, "vendor": vendor_key}

    async def _mirror_to_backup(self):
        """Write all encrypted credentials to a local JSON backup file."""
        import json as _json
        docs = await self.collection.find({}, {"_id": 0}).to_list(500)
        path = "/app/memory/vendor_credentials_backup.json"
        with open(path, "w") as f:
            _json.dump({"version": 1, "credentials": docs}, f, indent=2, default=str)

    async def restore_from_backup_if_empty(self):
        """If the DB has zero saved credentials but a backup file exists,
        restore from it. Called at backend startup."""
        import json as _json, os as _os
        try:
            count = await self.collection.count_documents({})
            if count > 0:
                return 0
            path = "/app/memory/vendor_credentials_backup.json"
            if not _os.path.exists(path):
                return 0
            with open(path) as f:
                data = _json.load(f) or {}
            docs = data.get("credentials", [])
            if not docs:
                return 0
            for d in docs:
                vk = d.get("vendor_key")
                if not vk:
                    continue
                d.pop("_id", None)
                # Verify ciphertext is decryptable with current key.
                try:
                    decrypt_password(d.get("password_encrypted", ""))
                except Exception:
                    logger.warning(f"backup ciphertext for {vk} not decryptable with current key; skipping")
                    continue
                await self.collection.update_one(
                    {"vendor_key": vk},
                    {"$set": d},
                    upsert=True,
                )
            logger.info(f"Restored {len(docs)} vendor credentials from backup")
            return len(docs)
        except Exception as e:
            logger.warning(f"restore_from_backup failed: {e}")
            return 0
    
    async def get_credential(self, vendor_key: str) -> Optional[Dict]:
        """Get decrypted credentials for a vendor"""
        cred = await self.collection.find_one({"vendor_key": vendor_key})
        if not cred:
            # Try finding by domain
            cred = await self.collection.find_one({"domain": vendor_key})
        if not cred:
            return None
        
        return {
            "vendor_key": cred.get("vendor_key", cred.get("domain", vendor_key)),
            "vendor_name": cred.get("vendor_name", cred.get("name", "")),
            "username": cred.get("username", ""),
            "password": decrypt_password(cred.get("password_encrypted", cred.get("encrypted_password", ""))),
            "account_number": cred.get("account_number"),
            "dealer_code": cred.get("dealer_code"),
            "status": cred.get("status", "active")
        }
    
    async def get_all_credentials(self) -> List[Dict]:
        """Get all vendor credentials (without passwords for listing)"""
        creds = await self.collection.find({}).to_list(100)
        return [
            {
                "vendor_key": c.get("vendor_key", c.get("domain", "")),
                "vendor_name": c.get("vendor_name", c.get("name", "")),
                "username": c.get("username", ""),
                "status": c.get("status", "active"),
                "last_login": c.get("last_login")
            }
            for c in creds
        ]
    
    async def delete_credential(self, vendor_key: str):
        """Delete a vendor credential"""
        await self.collection.delete_one({"vendor_key": vendor_key})
        return {"success": True}
    
    async def update_last_login(self, vendor_key: str):
        """Update the last login timestamp"""
        await self.collection.update_one(
            {"vendor_key": vendor_key},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )


def get_vendor_portal_info(vendor_key: str) -> Optional[Dict]:
    """Get portal configuration for a vendor"""
    return VENDOR_PORTALS.get(vendor_key)


# ---------------------------------------------------------------------------
# URL → vendor_key resolver. Used by the AI assistant's enrichment pipeline
# to map a vendor product link (e.g. https://uttermost.com/...) to the
# corresponding pre-configured portal so we can call the authenticated
# scraper instead of the public one.
# ---------------------------------------------------------------------------
_URL_DOMAIN_TO_KEY = {
    "fourhands.com": "four_hands",
    "uttermost.com": "uttermost",
    "bernhardt.com": "bernhardt",
    "rowefurniture.com": "rowe",
    "loloirugs.com": "loloi",
    "visualcomfort.com": "visual_comfort",
    "hvlgroup.com": "hvl_group",
    "gabby.com": "gabby",
    "bassettmirror.com": "bassett_mirror",
    "surya.com": "surya",
    "safavieh.com": "safavieh",
    "reginaandrew.com": "regina_andrew",
    "globalviews.com": "global_views",
    "vandh.com": "vandh",
    "flowdecor.com": "flow_decor",
    "crestviewcollection.com": "crestview_collection",
    "eichholtz.com": "eichholtz",
    "myohamerica.com": "moh_america",
    # Wallpaper-specific approved sources (no auth scraper yet, but the URL
    # resolver still recognizes these so the AI can route them correctly
    # and the public OG/JSON-LD fallback can fire).
    "phillipjeffries.com": "phillip_jeffries",
    "yorkwallcoverings.com": "york_wallcoverings",
    # Approved supporting vendor mentioned in the master agent prompt.
    "classichome.com": "classic_home",
}


def resolve_vendor_key_from_url(url: str) -> Optional[str]:
    """Given a product URL, return the matching vendor_key or None."""
    if not url:
        return None
    try:
        from urllib.parse import urlparse
        host = (urlparse(url).hostname or "").lower().lstrip("www.")
        # strip leading 'www.'
        if host.startswith("www."):
            host = host[4:]
        for domain, key in _URL_DOMAIN_TO_KEY.items():
            if host == domain or host.endswith("." + domain):
                return key
    except Exception:
        pass
    return None


def get_all_vendor_portals() -> List[Dict]:
    """Get list of all supported vendor portals"""
    return [
        {
            "key": key,
            "name": config["name"],
            "login_url": config["login_url"],
            "login_type": config["login_type"]
        }
        for key, config in VENDOR_PORTALS.items()
    ]

```

---

## FILE: `/app/backend/vendor_scraper.py`

```python
"""
Real-Time Vendor Portal Scraper
Uses Playwright to authenticate and scrape product data from vendor dealer portals
"""
import asyncio
import re
import logging
from typing import Dict, List, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class VendorPortalScraper:
    """Scrapes vendor dealer portals using authenticated sessions"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.contexts: Dict[str, BrowserContext] = {}  # Store logged-in contexts per vendor
        self.playwright = None
    
    async def initialize(self):
        """Initialize the browser"""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            logger.info("Browser initialized")
    
    async def close(self):
        """Close browser and cleanup"""
        for context in self.contexts.values():
            await context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def login_to_vendor(self, vendor_key: str, portal_config: Dict, credentials: Dict) -> bool:
        """Log into a vendor portal and store the authenticated context"""
        await self.initialize()
        
        try:
            # Create a new context for this vendor
            context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            # Navigate to login page
            logger.info(f"Navigating to {portal_config['login_url']}")
            await page.goto(portal_config['login_url'], wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(2)

            # If the vendor uses a modal/drawer-triggered login (no
            # dedicated /login URL — e.g. Uttermost, Bernhardt), click the
            # configured "Login" link/button first to reveal the form.
            modal_triggers = portal_config.get('modal_trigger_selectors') or []
            if modal_triggers:
                for sel in modal_triggers:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible():
                            await el.click()
                            logger.info(f"Opened login modal via: {sel}")
                            await asyncio.sleep(2)
                            break
                    except Exception:
                        continue
            
            selectors = portal_config.get('selectors', {})
            
            # Fill in credentials based on login type
            login_type = portal_config.get('login_type', 'email')
            
            if login_type == 'account_number':
                # Use account number
                username_value = credentials.get('account_number') or credentials.get('username')
            elif login_type == 'dealer_code':
                # Use dealer code
                username_value = credentials.get('dealer_code') or credentials.get('username')
            else:
                # Use email/username
                username_value = credentials.get('username')
            
            password_value = credentials.get('password')
            
            logger.info(f"Attempting login with username type: {login_type}")
            
            # Helper: query all matches for a selector and try to fill each
            # one until one succeeds. Many vendor sites (Shopify storefronts
            # especially) ship duplicate hidden+visible inputs for responsive
            # layouts. Filling a hidden field raises a timeout/strict-mode
            # error, so we just try each match in order.
            async def _try_fill(sel: str, value: str) -> bool:
                if not sel:
                    return False
                try:
                    els = await page.query_selector_all(sel)
                except Exception:
                    return False
                for el in els:
                    try:
                        # Skip elements that report non-visible (Shopify duplicates).
                        try:
                            if not await el.is_visible():
                                continue
                        except Exception:
                            pass
                        await el.fill(value, timeout=3000)
                        return True
                    except Exception:
                        continue
                return False

            # Try to find and fill username field - use multiple strategies
            username_filled = False
            username_selectors = [
                selectors.get('username_field', ''),
                'input[type="text"]:visible',
                'input[type="email"]:visible',
                'input[name*="account"]',
                'input[name*="email"]',
                'input[name*="user"]',
                'input[placeholder*="account" i]',
                'input[placeholder*="email" i]',
                'input:not([type="password"]):not([type="hidden"]):not([type="submit"])'
            ]
            
            for selector in username_selectors:
                if not selector:
                    continue
                if await _try_fill(selector, username_value):
                    logger.info(f"Filled username with selector: {selector}")
                    username_filled = True
                    break
            
            if not username_filled:
                logger.error("Could not find username field with any selector")
                await context.close()
                return False
            
            # Fill password - use multiple strategies
            password_filled = False
            password_selectors = [
                selectors.get('password_field', ''),
                'input[type="password"]',
                'input[name*="password"]',
                'input[placeholder*="password" i]'
            ]
            
            for selector in password_selectors:
                if not selector:
                    continue
                if await _try_fill(selector, password_value):
                    logger.info(f"Filled password with selector: {selector}")
                    password_filled = True
                    break
            
            if not password_filled:
                logger.error("Could not find password field")
                await context.close()
                return False
            
            await asyncio.sleep(1)
            
            # Click login button - try multiple strategies
            login_clicked = False
            login_selectors = [
                selectors.get('login_button', ''),
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Login")',
                'button:has-text("Sign In")',
                'button:has-text("Log In")',
                '[data-testid*="login"]',
                'form button'
            ]
            
            for selector in login_selectors:
                if not selector:
                    continue
                try:
                    element = await page.query_selector(selector)
                    if element:
                        await element.click()
                        logger.info(f"Clicked login button with selector: {selector}")
                        login_clicked = True
                        break
                except Exception as e:
                    continue
            
            if not login_clicked:
                # Try pressing Enter as fallback
                await page.keyboard.press('Enter')
                logger.info("Pressed Enter as login fallback")
            
            # Wait for navigation/login to complete
            initial_url = portal_config['login_url']
            await asyncio.sleep(3)
            try:
                await page.wait_for_load_state('networkidle', timeout=15000)
            except:
                pass  # Some sites don't fully settle
            
            # Check if login was successful using STRUCTURAL signals (much
            # more reliable than scanning page text for the word "error",
            # which appears in footers/help links on plenty of successful
            # post-login pages):
            #
            #   1. Auth cookie set (Shopify: secure_customer_sig, Magento:
            #      PHPSESSID + customer_section_data_clean, generic: any
            #      session/auth cookie)
            #   2. URL changed away from the /login page (most redirect
            #      either to /account or /home on success and stay on
            #      /login on failure)
            #   3. A logout / "sign out" / "my account" link is visible
            current_url = page.url
            cookies = await context.cookies()
            cookie_names = {c['name'].lower() for c in cookies}
            logger.info(f"Post-login URL: {current_url}")
            logger.info(f"Cookies set: {sorted(list(cookie_names))[:30]}")

            # 1) auth cookies
            auth_cookie_signals = {
                'secure_customer_sig',          # Shopify customer logged in
                '_shopify_customer_authorization',
                'customer_authorization',
                'persistent_shopping_cart',     # Magento logged in
                'mage-cache-sessid',
                'private_content_version',
                'auth_token', 'authtoken', 'auth', 'access_token',
                'sessionid', 'session_id', 'session', 'jsessionid',
                'customer_id', 'user_id',
            }
            has_auth_cookie = any(n in cookie_names for n in auth_cookie_signals)

            # 2) URL changed away from login (host or path)
            from urllib.parse import urlparse
            initial_path = (urlparse(initial_url).path or '').rstrip('/').lower()
            current_path = (urlparse(current_url).path or '').rstrip('/').lower()
            url_changed = (current_path != initial_path) or ('login' not in current_path and 'sign-in' not in current_path and 'auth' not in current_path)

            # 3) logout / "my account" link visible
            logout_visible = False
            try:
                for sel in [
                    'a[href*="logout" i]', 'a[href*="signout" i]', 'a[href*="sign-out" i]',
                    'a:has-text("Logout")', 'a:has-text("Log out")', 'a:has-text("Sign out")',
                    'a:has-text("Sign Out")', 'a:has-text("My Account")',
                    'button:has-text("Logout")',
                ]:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible():
                            logout_visible = True
                            break
                    except Exception:
                        continue
            except Exception:
                pass

            is_success = has_auth_cookie or logout_visible or url_changed
            logger.info(f"Login signals: auth_cookie={has_auth_cookie} url_changed={url_changed} logout_visible={logout_visible} => success={is_success}")

            if is_success:
                # Store the authenticated context
                self.contexts[vendor_key] = context
                logger.info(f"Successfully logged into {vendor_key}")
                return True
            else:
                logger.error(f"Login status unclear for {vendor_key}")
                await context.close()
                return False
            
        except Exception as e:
            logger.error(f"Error logging into {vendor_key}: {type(e).__name__}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    async def search_vendor(self, vendor_key: str, query: str, portal_config: Dict) -> List[Dict]:
        """Search for products on a vendor portal"""
        if vendor_key not in self.contexts:
            logger.error(f"Not logged into {vendor_key}")
            return []
        
        try:
            context = self.contexts[vendor_key]
            page = await context.new_page()
            
            # Build search URL
            search_url = portal_config.get('search_url', '').format(query=query)
            
            logger.info(f"Searching {vendor_key}: {search_url}")
            await page.goto(search_url, wait_until='domcontentloaded', timeout=60000)
            await asyncio.sleep(5)  # Wait for JS to render products
            
            # Extract product data
            products = await self._extract_products(page, portal_config)
            
            await page.close()
            return products
            
        except Exception as e:
            logger.error(f"Error searching {vendor_key}: {e}")
            return []
    
    async def _extract_products(self, page: Page, portal_config: Dict) -> List[Dict]:
        """Extract product data from a search results page"""
        products = []
        selectors = portal_config.get('selectors', {})
        vendor_name = portal_config.get('name', '')
        base_url = portal_config.get('base_url', '')
        
        # Get all product images
        image_selector = selectors.get('product_image', 'img.product-image, img[data-product]')
        link_selector = selectors.get('product_link', 'a.product-link, a[href*="/product/"]')
        
        # For Four Hands, the images are inside product cards/links
        if 'fourhands' in base_url.lower():
            # Find product links first, then get images within them
            product_cards = await page.query_selector_all('a[href*="/product/"]')
            logger.info(f"Found {len(product_cards)} product cards on Four Hands")
            
            seen_skus = set()
            for card in product_cards[:100]:  # Get up to 100 products
                try:
                    href = await card.get_attribute('href') or ''
                    # Extract SKU from URL like /product/IBAR-273
                    sku_match = href.split('/product/')[-1].split('?')[0] if '/product/' in href else ''
                    
                    if sku_match and sku_match not in seen_skus:
                        seen_skus.add(sku_match)
                        
                        # Get image inside this card
                        img = await card.query_selector('img[src*="cloudfront"]')
                        img_src = ''
                        img_alt = ''
                        
                        if img:
                            img_src = await img.get_attribute('src') or await img.get_attribute('data-src') or ''
                            img_alt = await img.get_attribute('alt') or ''
                        
                        # Extract price from card text
                        card_text = await card.inner_text()
                        price = None
                        import re
                        price_match = re.search(r'\$[\d,]+\.?\d*', card_text)
                        if price_match:
                            price_str = price_match.group().replace('$', '').replace(',', '')
                            try:
                                price = float(price_str)
                            except:
                                pass
                        
                        # Extract product name from text (usually after badges like "New", "Performance Options")
                        name_lines = [l.strip() for l in card_text.split('\n') if l.strip() and not l.strip().startswith('$') and l.strip() not in ['New', 'Performance Options', 'Hospitality', 'More Options', 'In Stock']]
                        product_name = name_lines[0] if name_lines else img_alt or sku_match
                        
                        if img_src:
                            products.append({
                                'sku': sku_match,
                                'image_url': img_src,
                                'name': product_name,
                                'price': price,
                                'cost': price,
                                'product_link': base_url + href if not href.startswith('http') else href,
                                'vendor': vendor_name,
                                'source': 'live',
                                'scraped_at': datetime.now(timezone.utc).isoformat()
                            })
                except Exception as e:
                    logger.debug(f"Error extracting Four Hands product: {e}")
                    continue
        elif 'globalviews' in base_url.lower():
            # Global Views uses Klevu search - get more products by clicking 36 per page
            try:
                dropdown = await page.wait_for_selector('.kuDropdown.kuDropItemsPerpage', timeout=5000)
                await dropdown.click()
                await asyncio.sleep(0.5)
                option_36 = await page.wait_for_selector('.kuDropOption.kuLimit[data-value="36"]', timeout=3000)
                await option_36.click()
                await asyncio.sleep(3)
            except:
                pass  # Continue with default if dropdown fails
            
            # Get all Klevu images
            klevu_images = await page.query_selector_all('img[src*="klevu_images"], img[src*="media/catalog"]')
            logger.info(f"Found {len(klevu_images)} product images on Global Views")
            
            # Also try to get product links with prices
            product_items = await page.query_selector_all('.kuResultContent, [class*="product-item"]')
            
            for img in klevu_images[:50]:  # Get up to 50 products
                try:
                    img_src = await img.get_attribute('src') or ''
                    img_alt = await img.get_attribute('alt') or ''
                    
                    # Try to get parent link
                    href = ''
                    try:
                        parent_link = await img.evaluate('el => el.closest("a")?.href')
                        if parent_link:
                            href = parent_link
                    except:
                        pass
                    
                    if img_src and img_alt:  # Only add if we have image and name
                        products.append({
                            'image_url': img_src,
                            'name': img_alt.strip(),
                            'product_link': href,
                            'vendor': vendor_name,
                            'source': 'live',
                            'scraped_at': datetime.now(timezone.utc).isoformat()
                        })
                except Exception as e:
                    logger.debug(f"Error extracting Global Views product: {e}")
                    continue
        else:
            # Generic extraction for other vendors
            images = await page.query_selector_all(image_selector)
            links = await page.query_selector_all(link_selector)
            
            for i, img in enumerate(images[:20]):
                try:
                    src = await img.get_attribute('src') or await img.get_attribute('data-src')
                    alt = await img.get_attribute('alt') or ''
                    
                    link = ''
                    if i < len(links):
                        link = await links[i].get_attribute('href') or ''
                        if link and not link.startswith('http'):
                            link = base_url + link
                    
                    if src:
                        if not src.startswith('http'):
                            src = base_url + src
                        
                        products.append({
                            'image_url': src,
                            'name': alt,
                            'product_link': link,
                            'vendor': vendor_name,
                            'source': 'live',
                            'scraped_at': datetime.now(timezone.utc).isoformat()
                        })
                except Exception as e:
                    logger.debug(f"Error extracting product: {e}")
                    continue
        
        logger.info(f"Extracted {len(products)} products from {vendor_name}")
        return products
    
    async def get_product_details(self, vendor_key: str, product_url: str, portal_config: Dict) -> Dict:
        """Get detailed product information from a product page using a mix
        of OpenGraph meta tags, JSON-LD Product schema, and vendor-specific
        selectors as a last resort. This works across most e-com platforms
        (Shopify, Magento, WooCommerce, custom) without site-specific tuning.
        """
        if vendor_key not in self.contexts:
            return {}

        try:
            context = self.contexts[vendor_key]
            page = await context.new_page()

            try:
                await page.goto(product_url, wait_until='domcontentloaded', timeout=30000)
            except Exception:
                # Some pages never reach domcontentloaded due to long-running
                # analytics scripts; we still try to read meta tags.
                pass
            await asyncio.sleep(2)
            try:
                await page.wait_for_load_state('networkidle', timeout=10000)
            except Exception:
                pass

            details = {
                'url': product_url,
                'vendor': portal_config.get('name', ''),
                'scraped_at': datetime.now(timezone.utc).isoformat(),
            }

            # 1) OpenGraph + Product JSON-LD via a single page.evaluate() call.
            extracted = await page.evaluate(r"""() => {
                const out = {};
                const meta = (sel) => {
                    const el = document.querySelector(sel);
                    return el ? (el.getAttribute('content') || el.getAttribute('value') || '').trim() : '';
                };
                out.og_title = meta('meta[property="og:title"]') || meta('meta[name="og:title"]');
                out.og_image = meta('meta[property="og:image"]') || meta('meta[name="og:image"]');
                out.og_description = meta('meta[property="og:description"]') || meta('meta[name="description"]');
                out.og_price = meta('meta[property="product:price:amount"]') || meta('meta[property="og:price:amount"]') || meta('meta[itemprop="price"]');
                out.og_currency = meta('meta[property="product:price:currency"]') || meta('meta[property="og:price:currency"]');
                out.og_sku = meta('meta[property="product:retailer_item_id"]') || meta('meta[itemprop="sku"]');

                // JSON-LD Product schema (most modern e-com sites embed this)
                const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                const products = [];
                for (const n of ldNodes) {
                    try {
                        const parsed = JSON.parse(n.textContent || '{}');
                        const arr = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
                        for (const obj of arr) {
                            if (!obj || typeof obj !== 'object') continue;
                            const t = obj['@type'];
                            const types = Array.isArray(t) ? t : [t];
                            if (types.includes('Product') || types.includes('IndividualProduct')) {
                                products.push(obj);
                            }
                        }
                    } catch (e) {}
                }
                if (products.length) {
                    const p = products[0];
                    out.ld_name = p.name || '';
                    out.ld_sku = p.sku || p.mpn || p.productID || '';
                    out.ld_description = p.description || '';
                    const offers = Array.isArray(p.offers) ? p.offers[0] : p.offers;
                    if (offers) {
                        out.ld_price = (offers.price || offers.lowPrice || offers.highPrice || '').toString();
                        out.ld_currency = offers.priceCurrency || '';
                        out.ld_availability = offers.availability || '';
                    }
                    if (p.image) {
                        out.ld_image = Array.isArray(p.image) ? p.image[0] : p.image;
                        if (typeof out.ld_image === 'object' && out.ld_image && out.ld_image.url) out.ld_image = out.ld_image.url;
                    }
                    if (p.brand) {
                        out.ld_brand = (typeof p.brand === 'object' ? (p.brand.name || '') : p.brand);
                    }
                    if (p.color) out.ld_color = p.color;
                    if (p.material) out.ld_material = Array.isArray(p.material) ? p.material.join(', ') : p.material;
                    // additional dimension fields
                    const props = (p.additionalProperty || []).reduce((acc, x) => {
                        if (x && x.name && x.value !== undefined) acc[String(x.name).toLowerCase()] = x.value;
                        return acc;
                    }, {});
                    out.ld_props = props;
                }

                // Largest visible img as fallback image (>= 300x300).
                let biggest = null;
                document.querySelectorAll('img').forEach(el => {
                    const src = el.currentSrc || el.src || el.dataset.src || '';
                    const r = el.getBoundingClientRect();
                    if (!src || src.startsWith('data:')) return;
                    if (r.width < 300 || r.height < 300) return;
                    const area = r.width * r.height;
                    if (!biggest || area > biggest.area) biggest = {src, area};
                });
                if (biggest) out.biggest_image = biggest.src;

                return out;
            }""")

            # Pick best name
            name = extracted.get('ld_name') or extracted.get('og_title')
            if name:
                details['name'] = name
                details['title'] = name

            # Pick best image
            image = extracted.get('ld_image') or extracted.get('og_image') or extracted.get('biggest_image')
            if image:
                if image.startswith('//'):
                    image = 'https:' + image
                elif not image.startswith('http'):
                    image = portal_config.get('base_url', '').rstrip('/') + '/' + image.lstrip('/')
                details['image_url'] = image

            # Pick best SKU
            sku = extracted.get('ld_sku') or extracted.get('og_sku')
            if sku:
                details['sku'] = str(sku)

            # Pick best price
            price_str = extracted.get('ld_price') or extracted.get('og_price') or ''
            try:
                if price_str:
                    p = float(re.sub(r'[^\d.]', '', str(price_str)))
                    if p > 0:
                        details['price'] = p
            except Exception:
                pass

            # Description / extras
            if extracted.get('ld_description') or extracted.get('og_description'):
                details['description'] = extracted.get('ld_description') or extracted.get('og_description')
            if extracted.get('ld_color'):
                details['finish'] = extracted['ld_color']
                details['finish_color'] = extracted['ld_color']
            if extracted.get('ld_brand'):
                details['brand'] = extracted['ld_brand']

            # Dimensions from additionalProperty (best-effort)
            props = extracted.get('ld_props') or {}
            for k, v in props.items():
                kl = k.lower()
                if any(x in kl for x in ('width', 'height', 'depth', 'length', 'dimension', 'size')):
                    details.setdefault('dimensions', []).append(f"{k}: {v}")
            if isinstance(details.get('dimensions'), list):
                details['dimensions'] = ', '.join(details['dimensions'])
                details['size'] = details['dimensions']

            await page.close()
            logger.info(f"Got product details for {vendor_key}: name={'Y' if details.get('name') else '.'} price={details.get('price')} img={'Y' if details.get('image_url') else '.'} sku={details.get('sku')}")
            return details

        except Exception as e:
            logger.error(f"Error getting product details: {e}")
            return {}


# Singleton instance
_scraper_instance = None

async def get_scraper() -> VendorPortalScraper:
    """Get or create the scraper instance"""
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = VendorPortalScraper()
    return _scraper_instance

```

---

## FILE: `/app/backend/canva_integration.py`

```python
"""
Canva API Integration for Interior Design Manager
Handles photo uploads and design board creation
"""
import os
import httpx
import json
import base64
import hashlib
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

class CanvaIntegration:
    """Handle Canva API operations for photo uploads and design management."""
    
    def __init__(self):
        self.client_id = os.getenv("CANVA_CLIENT_ID")
        self.client_secret = os.getenv("CANVA_CLIENT_SECRET")
        self.redirect_uri = os.getenv("CANVA_REDIRECT_URI")
        self.base_url = os.getenv("CANVA_API_BASE_URL", "https://api.canva.com/rest/v1")
        self.auth_url = "https://www.canva.com/api/oauth/authorize"
        self.token_url = "https://www.canva.com/api/oauth/token"
        
        # MongoDB for storing tokens
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        self.mongo_client = AsyncIOMotorClient(mongo_url)
        self.db = self.mongo_client[os.getenv("DB_NAME", "interiorsync")]
        self.tokens_collection = self.db["canva_tokens"]
    
    def generate_pkce_pair(self) -> tuple:
        """Generate PKCE code verifier and challenge."""
        # Generate code verifier (43-128 characters)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        
        # Generate code challenge (SHA256 hash of verifier)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        return code_verifier, code_challenge
    
    def get_authorization_url(self, state: str, code_challenge: str) -> str:
        """Generate Canva OAuth authorization URL with PKCE."""
        scopes = [
            "asset:read",
            "asset:write",
            "design:content:read",
            "design:content:write",
            "folder:read",
            "folder:write",
            "profile:read"
        ]
        
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        
        from urllib.parse import urlencode
        return f"{self.auth_url}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, code_verifier: str) -> Dict[str, Any]:
        """Exchange authorization code for access token with PKCE."""
        
        # Use form-encoded data as per OAuth spec
        from urllib.parse import urlencode
        data = urlencode({
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "code_verifier": code_verifier
        })
        
        # Minimal headers - just what's required
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        
        logger.info(f"Attempting token exchange to {self.token_url}")
        
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            try:
                response = await client.post(
                    self.token_url,
                    content=data,
                    headers=headers
                )
                
                logger.info(f"Token exchange response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text[:1000]
                    logger.error(f"Token exchange failed: {error_text}")
                    raise Exception(f"Failed to get access token: Status {response.status_code}")
                
                token_data = response.json()
                logger.info("Token exchange successful!")
                
            except httpx.TimeoutException:
                logger.error("Token exchange timed out")
                raise Exception("Token exchange timed out - please try again")
            except Exception as e:
                logger.error(f"Token exchange exception: {str(e)}")
                raise
            
            # Store tokens in database
            await self.tokens_collection.update_one(
                {"user_id": "admin"},  # Single user for now
                {
                    "$set": {
                        "access_token": token_data["access_token"],
                        "refresh_token": token_data.get("refresh_token"),
                        "expires_at": datetime.utcnow().timestamp() + token_data.get("expires_in", 3600),
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info("✅ Canva tokens stored successfully")
            return token_data
    
    async def store_token(self, token_data: Dict[str, Any]) -> None:
        """Store Canva OAuth tokens in database."""
        await self.tokens_collection.update_one(
            {"user_id": "admin"},  # Single user for now
            {
                "$set": {
                    "access_token": token_data["access_token"],
                    "refresh_token": token_data.get("refresh_token"),
                    "expires_at": datetime.utcnow().timestamp() + token_data.get("expires_in", 3600),
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        logger.info("✅ Canva tokens stored successfully")
    
    async def get_valid_token(self) -> Optional[str]:
        """Get valid access token, refreshing if needed."""
        token_doc = await self.tokens_collection.find_one({"user_id": "admin"})
        
        if not token_doc:
            logger.warning("No Canva token found - user needs to authenticate")
            return None
        
        # Check if token is still valid
        if token_doc.get("expires_at", 0) > datetime.utcnow().timestamp():
            return token_doc["access_token"]
        
        # Try to refresh token
        if token_doc.get("refresh_token"):
            try:
                new_token = await self.refresh_token(token_doc["refresh_token"])
                return new_token["access_token"]
            except Exception as e:
                logger.error(f"Token refresh failed: {str(e)}")
                return None
        
        return None
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token."""
        data = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            token_data = response.json()
            
            # Update stored tokens
            await self.tokens_collection.update_one(
                {"user_id": "admin"},
                {
                    "$set": {
                        "access_token": token_data["access_token"],
                        "refresh_token": token_data.get("refresh_token", refresh_token),
                        "expires_at": datetime.utcnow().timestamp() + token_data.get("expires_in", 3600),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return token_data
    
    async def upload_image_to_canva(
        self, 
        image_data: bytes, 
        filename: str,
        project_name: str = None,
        room_name: str = None
    ) -> Dict[str, Any]:
        """Upload image to Canva user's content library."""
        access_token = await self.get_valid_token()
        
        if not access_token:
            raise Exception("No valid Canva access token. Please authenticate first.")
        
        # Prepare metadata
        metadata = {
            "name_base64": base64.b64encode(filename.encode()).decode()
        }
        
        if project_name:
            metadata["tags"] = [project_name]
        if room_name:
            if "tags" in metadata:
                metadata["tags"].append(room_name)
            else:
                metadata["tags"] = [room_name]
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/octet-stream",
            "Asset-Upload-Metadata": json.dumps(metadata)
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/asset-uploads",
                content=image_data,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Canva upload failed: {response.status_code} - {response.text}")
                raise Exception(f"Failed to upload to Canva: {response.text}")
            
            upload_result = response.json()
            job_id = upload_result["job"]["id"]
            
            logger.info(f"✅ Image upload started, job ID: {job_id}")
            
            # Wait for upload to complete
            asset_info = await self.wait_for_upload(job_id, access_token)
            
            return asset_info
    
    async def wait_for_upload(self, job_id: str, access_token: str, max_wait: int = 60) -> Dict[str, Any]:
        """Wait for Canva upload job to complete."""
        import asyncio
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        for _ in range(max_wait):
            await asyncio.sleep(1)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/asset-uploads/{job_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    status = result["job"]["status"]
                    
                    if status == "success":
                        asset = result["job"]["asset"]
                        logger.info(f"✅ Upload completed! Asset ID: {asset['id']}")
                        return asset
                    elif status == "failed":
                        error = result["job"].get("error", {})
                        raise Exception(f"Upload failed: {error.get('message', 'Unknown error')}")
        
        raise Exception("Upload timeout - took too long to complete")
    
    async def create_design_board(
        self,
        title: str,
        asset_ids: List[str] = None
    ) -> Dict[str, Any]:
        """Create a design board in Canva."""
        access_token = await self.get_valid_token()
        
        if not access_token:
            raise Exception("No valid Canva access token")
        
        # Use presentation format for design boards
        design_data = {
            "design_type": {
                "type": "preset",
                "name": "Presentation"
            },
            "title": title
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/designs",
                json=design_data,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Design creation failed: {response.text}")
                raise Exception(f"Failed to create design: {response.text}")
            
            design = response.json()
            logger.info(f"✅ Design board created: {design['design']['id']}")
            
            return design
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Get Canva user profile."""
        access_token = await self.get_valid_token()
        
        if not access_token:
            raise Exception("No valid Canva access token")
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/users/me/profile",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to get profile: {response.text}")

    @staticmethod
    def extract_design_id_from_url(canva_url: str) -> Optional[str]:
        """Pull the design_id out of a public Canva share URL.

        Canva share URLs look like:
          https://www.canva.com/design/DAGxxxxxxxxxxxx/view
          https://www.canva.com/design/DAGxxxxxxxxxxxx/edit
          https://www.canva.com/design/DAGxxxxxxxxxxxx/abcDEFghIJK/view?utm=...
        The ID always starts with `DAG` (Canva's Connect-API design ID prefix).
        """
        import re as _re
        if not canva_url:
            return None
        m = _re.search(r"/design/(DAG[A-Za-z0-9_-]+)", canva_url)
        return m.group(1) if m else None

    async def get_design(self, design_id: str) -> Dict[str, Any]:
        """GET /v1/designs/{design_id} — returns design title, owner, thumbnail,
        urls.edit_url, urls.view_url, and the pages array if the design is
        accessible to the authenticated user. Verified-documented Canva
        Connect endpoint."""
        access_token = await self.get_valid_token()
        if not access_token:
            raise Exception("No valid Canva access token")
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(
                f"{self.base_url}/designs/{design_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if r.status_code != 200:
                raise Exception(f"Canva GET design failed ({r.status_code}): {r.text[:300]}")
            return r.json()

    async def export_design_as_pdf(self, design_id: str) -> Dict[str, Any]:
        """Kick off a server-side PDF export job for a Canva design. Returns
        the export-job resource; caller must poll /exports/{job_id} until
        status='success' to get the download URL(s). Verified-documented."""
        access_token = await self.get_valid_token()
        if not access_token:
            raise Exception("No valid Canva access token")
        body = {"design_id": design_id, "format": {"type": "pdf"}}
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                f"{self.base_url}/exports",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            if r.status_code not in (200, 202):
                raise Exception(f"Canva export POST failed ({r.status_code}): {r.text[:300]}")
            return r.json()

    async def poll_export_until_done(self, job_id: str, max_wait_s: int = 90) -> Dict[str, Any]:
        """Poll /v1/exports/{job_id} every 2s until status leaves 'in_progress'.
        Returns the final job doc (with `urls` list on success)."""
        import asyncio as _asyncio
        access_token = await self.get_valid_token()
        if not access_token:
            raise Exception("No valid Canva access token")
        deadline = _asyncio.get_event_loop().time() + max_wait_s
        async with httpx.AsyncClient(timeout=20.0) as client:
            while _asyncio.get_event_loop().time() < deadline:
                r = await client.get(
                    f"{self.base_url}/exports/{job_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if r.status_code != 200:
                    raise Exception(f"Canva export poll failed ({r.status_code}): {r.text[:300]}")
                job = r.json().get("job") or r.json()
                status = (job or {}).get("status", "")
                if status != "in_progress":
                    return job
                await _asyncio.sleep(2.0)
        raise Exception(f"Canva export job {job_id} timed out after {max_wait_s}s")

# Global instance
canva_integration = CanvaIntegration()
```

---

## FILE: `/app/frontend/src/components/AIDesignAssistantPanel.js`

```javascript
/**
 * AIDesignAssistantPanel — in-app side panel hosting the user's Canva
 * refinement / vendor-matching agent (Gemini 3.1 Pro vision).
 *
 * Mounted on every project page. Opens with a floating ✨ button.
 * - Drag/drop or paste Canva screenshots
 * - Per-project conversation memory persists across reloads
 * - One-click push of detected items into the existing /agent/v1/items/bulk
 * - "⚙ Edit brain" lets the user customize the system prompt without code
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = ((window.ENV?.REACT_APP_BACKEND_URL) || (process.env.REACT_APP_BACKEND_URL) || window.location.origin) + '/api';

export default function AIDesignAssistantPanel({ projectId, projectName = '', open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [memory, setMemory] = useState({});
  const [draft, setDraft] = useState('');
  const [pendingImages, setPendingImages] = useState([]);   // [{base64, mime_type, name, preview}]
  const [pendingPdf, setPendingPdf] = useState(null);       // {base64, name, page_count}
  const [pdfRoom, setPdfRoom] = useState('');
  const [pdfSheet, setPdfSheet] = useState('checklist');
  const [pdfIngestStatus, setPdfIngestStatus] = useState('');
  const [projectRooms, setProjectRooms] = useState([]);     // suggestions for the room dropdown
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedForPush, setSelectedForPush] = useState({});  // {messageId-itemIdx: true}
  const [pushStatus, setPushStatus] = useState(null);
  const scrollRef = useRef(null);

  const loadConversation = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API}/ai-assist/conversations/${projectId}`);
      if (res.ok) {
        const j = await res.json();
        setMessages(j.messages || []);
        setMemory(j.memory || {});
      }
    } catch (e) { console.error(e); }
  }, [projectId]);

  useEffect(() => { if (open) loadConversation(); }, [open, loadConversation]);

  // Pre-load the project's rooms so the PDF room dropdown has real options.
  useEffect(() => {
    if (!open || !projectId) return;
    fetch(`${API}/projects/${projectId}?sheet_type=checklist`)
      .then(r => r.json())
      .then(d => {
        const names = Array.from(new Set((d.rooms || []).map(r => r.name).filter(Boolean)));
        setProjectRooms(names);
      })
      .catch(() => {});
  }, [open, projectId]);
  useEffect(() => { setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, 50); }, [messages, sending]);

  const handleFiles = (files) => {
    Array.from(files).slice(0, 5).forEach(f => {
      // PDFs take a separate path — they're one-room ingests.
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = String(reader.result).split(',')[1];
          setPendingPdf({ base64, name: f.name, size: f.size });
        };
        reader.readAsDataURL(f);
        return;
      }
      if (!f.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = String(dataUrl).split(',')[1];
        setPendingImages(prev => [...prev, { base64, mime_type: f.type, name: f.name, preview: dataUrl }]);
      };
      reader.readAsDataURL(f);
    });
  };

  // Paste-from-clipboard support (Cmd+V into the panel) — common Canva flow.
  const onPaste = (e) => {
    const items = e.clipboardData?.items || [];
    const imgs = Array.from(items).filter(i => i.type.startsWith('image/'));
    if (imgs.length) {
      e.preventDefault();
      handleFiles(imgs.map(i => i.getAsFile()).filter(Boolean));
    }
  };

  const removeImage = (idx) => setPendingImages(prev => prev.filter((_, i) => i !== idx));

  const ingestPdf = async () => {
    if (!pendingPdf) return;
    if (!pdfRoom.trim()) { setError('Pick a room for this PDF (one PDF = one room).'); return; }
    setError(''); setSending(true); setPdfIngestStatus('Reading PDF + extracting embedded links…');
    try {
      const res = await fetch(`${API}/ai-assist/ingest-pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          room_name: pdfRoom.trim(),
          sheet_type: pdfSheet,
          pdf_base64: pendingPdf.base64,
          extra_message: draft || '',
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'PDF ingest failed');
      }
      const data = await res.json();
      // Synthesize a fake assistant message so the items show in the thread.
      const fakeId = `pdf-${Date.now()}`;
      const summary = `Imported ${data.pages_rendered} page(s) from "${pendingPdf.name}". Found ${data.vendor_urls_found} vendor links and detected ${data.detected_items.length} items in ${data.room_name}. Enrichment: ${data.enrichment.filter(e => e.status === 'ok').length}/${data.enrichment.length} links scraped.`;
      const assistantMsg = {
        id: fakeId, role: 'assistant',
        content: summary + (data.assistant_message ? '\n\n' + data.assistant_message : ''),
        design_notes: data.design_notes || '',
        detected_items: data.detected_items,
      };
      setMessages(prev => [...prev, assistantMsg]);
      // Pre-select all items so the user can push in one click.
      const next = { ...selectedForPush };
      data.detected_items.forEach((_, idx) => { next[`${fakeId}-${idx}`] = true; });
      setSelectedForPush(next);
      setPendingPdf(null); setPdfRoom(''); setDraft('');
      setPdfIngestStatus('');
      loadConversation();
    } catch (e) {
      setError(e.message);
      setPdfIngestStatus('');
    } finally {
      setSending(false);
    }
  };

  const cancelPdf = () => { setPendingPdf(null); setPdfRoom(''); setPdfIngestStatus(''); };

  const send = async () => {
    if (sending) return;
    if (!draft.trim() && pendingImages.length === 0) {
      setError('Type a message or drop a Canva image.');
      return;
    }
    setError(''); setSending(true);
    try {
      const res = await fetch(`${API}/ai-assist/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          message: draft,
          images: pendingImages.map(p => ({ base64: p.base64, mime_type: p.mime_type })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'Chat failed');
      }
      const data = await res.json();
      // Optimistically append both messages; loadConversation would also work.
      setMessages(prev => [...prev, data.user_message, data.assistant_message]);
      setDraft(''); setPendingImages([]);
      setPushStatus(null);
      // Refresh memory snapshot
      loadConversation();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Clear this project\'s conversation and memory? Cannot be undone.')) return;
    await fetch(`${API}/ai-assist/conversations/${projectId}`, { method: 'DELETE' });
    setMessages([]); setMemory({}); setSelectedForPush({});
  };

  const toggleItem = (msgId, idx) => {
    const k = `${msgId}-${idx}`;
    setSelectedForPush(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const pushSelected = async () => {
    // Collect all detected items the user has ticked.
    const items = [];
    messages.forEach(m => {
      (m.detected_items || []).forEach((it, idx) => {
        if (selectedForPush[`${m.id}-${idx}`]) {
          items.push({ ...it, external_id: it.external_id || `aiassist-${m.id}-${idx}` });
        }
      });
    });
    if (items.length === 0) { setError('Select at least one item to push.'); return; }
    setError(''); setPushStatus({ status: 'pushing' });
    try {
      const res = await fetch(`${API}/ai-assist/push-items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, items }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || 'Push failed');
      setPushStatus({ status: 'done', summary: j });
      setSelectedForPush({});
    } catch (e) {
      setError(e.message); setPushStatus(null);
    }
  };

  const selectAllInMessage = (msg) => {
    const next = { ...selectedForPush };
    (msg.detected_items || []).forEach((_, idx) => { next[`${msg.id}-${idx}`] = true; });
    setSelectedForPush(next);
  };

  const selectedCount = Object.values(selectedForPush).filter(Boolean).length;
  const hasMemory = memory && Object.keys(memory).some(k => {
    const v = memory[k];
    return (Array.isArray(v) && v.length) || (typeof v === 'object' && v && Object.keys(v).length) || (typeof v === 'string' && v.length);
  });

  if (!open) return null;

  return (
    <div data-testid="ai-assistant-panel" style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div>
            <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>DESIGN AGENT</div>
            <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.7 }}>{projectName || projectId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button data-testid="aiassist-edit-prompt" onClick={() => setShowPromptEditor(true)} title="Edit agent brain" style={iconBtn}>⚙</button>
          <button data-testid="aiassist-reset" onClick={reset} title="Clear conversation + memory" style={iconBtn}>🗑</button>
          <button data-testid="aiassist-close" onClick={onClose} title="Close" style={iconBtn}>✕</button>
        </div>
      </div>

      {/* Memory chip */}
      {hasMemory && (
        <div data-testid="aiassist-memory-chip" style={{ background: '#0a0a0a', padding: '6px 14px', borderBottom: '1px solid #2a3040', fontSize: 11, color: '#10B981' }}>
          🧠 Memory: {summarizeMemory(memory)}
        </div>
      )}

      {/* Message thread */}
      <div ref={scrollRef} style={thread} onPaste={onPaste} tabIndex={0}>
        {messages.length === 0 && (
          <div style={emptyState}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>✨</div>
            <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>READY</div>
            <p style={{ color: '#D4C5A9', fontSize: 12, opacity: 0.8, maxWidth: 240 }}>
              Drop a Canva board screenshot, paste an image (Cmd+V), or describe a room.
              The agent identifies items, suggests vendor matches, and you push them into your checklist.
            </p>
          </div>
        )}
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            msg={m}
            onToggleItem={toggleItem}
            onSelectAll={() => selectAllInMessage(m)}
            selected={selectedForPush}
          />
        ))}
        {sending && (
          <div data-testid="aiassist-thinking" style={{ ...bubbleAssistant, opacity: 0.75 }}>
            <span style={{ color: '#D4A574', letterSpacing: 1, fontSize: 11, fontWeight: 700 }}>AGENT</span>
            <div style={{ marginTop: 6, color: '#D4C5A9', fontSize: 13 }}>Thinking… (vision call ~10-20s)</div>
          </div>
        )}
      </div>

      {/* Push bar */}
      {selectedCount > 0 && (
        <div data-testid="aiassist-push-bar" style={pushBar}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{selectedCount} item{selectedCount === 1 ? '' : 's'} selected</div>
          <button data-testid="aiassist-push-btn" onClick={pushSelected} disabled={pushStatus?.status === 'pushing'} style={pushBtn}>
            {pushStatus?.status === 'pushing' ? 'Pushing…' : `↑ PUSH TO CHECKLIST`}
          </button>
        </div>
      )}
      {pushStatus?.status === 'done' && (
        <div data-testid="aiassist-push-summary" style={{ padding: '8px 14px', background: '#064e3b', borderTop: '1px solid #10B981', color: '#fff', fontSize: 12 }}>
          ✓ Pushed: {pushStatus.summary.created} new, {pushStatus.summary.exists} already existed, {pushStatus.summary.errors} errors
        </div>
      )}

      {/* Composer */}
      <div style={composer}>
        {pendingPdf && (
          <div data-testid="aiassist-pdf-picker" style={{ padding: 12, background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderBottom: '1px solid #D4A574' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ color: '#D4A574', fontSize: 11, letterSpacing: 2, fontWeight: 800 }}>📄 PDF READY — ONE ROOM ONLY</div>
                <div style={{ color: '#D4C5A9', fontSize: 11, marginTop: 2, opacity: 0.85 }}>{pendingPdf.name} · {(pendingPdf.size / 1024).toFixed(0)} KB</div>
              </div>
              <button onClick={cancelPdf} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6, marginBottom: 8 }}>
              <div>
                <label style={{ color: '#D4A574', fontSize: 10, letterSpacing: 1, fontWeight: 700, display: 'block', marginBottom: 2 }}>ROOM</label>
                <input
                  list="ai-pdf-rooms"
                  value={pdfRoom}
                  onChange={e => setPdfRoom(e.target.value)}
                  placeholder="e.g. Great Room, Master Bath…"
                  data-testid="aiassist-pdf-room"
                  style={{ width: '100%', background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}
                />
                <datalist id="ai-pdf-rooms">
                  {projectRooms.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <label style={{ color: '#D4A574', fontSize: 10, letterSpacing: 1, fontWeight: 700, display: 'block', marginBottom: 2 }}>SHEET</label>
                <select value={pdfSheet} onChange={e => setPdfSheet(e.target.value)} data-testid="aiassist-pdf-sheet"
                  style={{ width: '100%', background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}>
                  <option value="checklist">Checklist</option>
                  <option value="ffe">FF&E</option>
                  <option value="walkthrough">Walkthrough</option>
                </select>
              </div>
            </div>
            <button onClick={ingestPdf} disabled={sending || !pdfRoom.trim()} data-testid="aiassist-pdf-ingest"
              style={{ width: '100%', background: sending ? '#4b5563' : '#10B981', color: '#fff', border: 'none', padding: '8px 12px', fontSize: 12, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: sending ? 'not-allowed' : 'pointer' }}>
              {sending ? (pdfIngestStatus || 'Working…') : `↑ INGEST PDF INTO ${pdfRoom || 'ROOM'}`}
            </button>
            <div style={{ marginTop: 6, fontSize: 10, color: '#D4C5A9', opacity: 0.65 }}>
              Vendor links in the PDF will be auto-scraped for prices, images &amp; finishes. <a href="/admin/vendor-portals" target="_blank" rel="noreferrer" style={{ color: '#D4A574' }}>Manage vendor logins →</a>
            </div>
          </div>
        )}
        {pendingImages.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px', overflowX: 'auto', borderBottom: '1px solid #2a3040' }}>
            {pendingImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', flex: '0 0 auto' }}>
                <img src={img.preview} alt={img.name} style={{ height: 56, borderRadius: 4, border: '1px solid #B49B7E' }} />
                <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <DragDropZone onFiles={handleFiles}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onPaste={onPaste}
            placeholder="Drop a Canva PDF (one room) or image, paste (⌘V), or type instructions…"
            data-testid="aiassist-input"
            rows={3}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#D4C5A9', padding: '10px 12px', fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          />
        </DragDropZone>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderTop: '1px solid #2a3040' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <label style={attachBtn} data-testid="aiassist-attach">
              📎 Attach
              <input type="file" multiple accept="image/*,application/pdf" onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
            </label>
            {error && <span data-testid="aiassist-error" style={{ color: '#ef4444', fontSize: 11 }}>{error}</span>}
          </div>
          <button data-testid="aiassist-send" onClick={send} disabled={sending} style={sendBtn}>
            {sending ? 'Sending…' : 'SEND →'}
          </button>
        </div>
      </div>

      {showPromptEditor && (
        <PromptEditorModal projectId={projectId} onClose={() => setShowPromptEditor(false)} />
      )}
    </div>
  );
}

function MessageBubble({ msg, onToggleItem, onSelectAll, selected }) {
  const isUser = msg.role === 'user';
  return (
    <div style={isUser ? bubbleUser : bubbleAssistant} data-testid={`aiassist-msg-${msg.role}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#D4A574', letterSpacing: 1, fontSize: 11, fontWeight: 700 }}>{isUser ? 'YOU' : 'AGENT'}</span>
        {msg.image_count > 0 && <span style={{ fontSize: 10, color: '#10B981' }}>📎 {msg.image_count} img</span>}
      </div>
      {msg.content && <div style={{ marginTop: 6, color: '#D4C5A9', fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</div>}
      {msg.design_notes && (
        <div style={{ marginTop: 8, padding: 8, background: '#0a0a0a', borderLeft: '2px solid #D4A574', borderRadius: 3, color: '#D4C5A9', fontSize: 12, fontStyle: 'italic' }}>
          {msg.design_notes}
        </div>
      )}
      {msg.detected_items && msg.detected_items.length > 0 && (
        <div style={{ marginTop: 10 }} data-testid={`detected-items-${msg.id}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ color: '#10B981', fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>
              DETECTED ITEMS · {msg.detected_items.length}
            </span>
            <button data-testid={`select-all-${msg.id}`} onClick={onSelectAll}
              style={{ background: 'transparent', color: '#D4A574', border: '1px solid #D4A574', padding: '2px 8px', fontSize: 10, fontWeight: 700, borderRadius: 3, cursor: 'pointer' }}>
              ☑ ALL
            </button>
          </div>
          {msg.detected_items.map((it, idx) => {
            const k = `${msg.id}-${idx}`;
            const chosen = !!selected[k];
            return (
              <label key={idx}
                data-testid={`detected-item-${msg.id}-${idx}`}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: 6, marginBottom: 4,
                  background: chosen ? 'rgba(212,165,116,0.12)' : '#0a0a0a',
                  border: `1px solid ${chosen ? '#D4A574' : '#2a3040'}`, borderRadius: 4, cursor: 'pointer'
                }}>
                <input type="checkbox" checked={chosen} onChange={() => onToggleItem(msg.id, idx)} style={{ marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{it.name || '(unnamed)'}</div>
                  <div style={{ color: '#D4C5A9', fontSize: 10, marginTop: 2, opacity: 0.85 }}>
                    {it.vendor || '—'}
                    {it.sku && <> · SKU {it.sku}</>}
                    {it.cost > 0 && <> · ${Number(it.cost).toLocaleString()}</>}
                    {' · '}{it.room_name || '—'} › {it.category_name || '—'} › {it.subcategory_name || '—'}
                    {it.sheet_type && it.sheet_type !== 'checklist' && <> · {it.sheet_type.toUpperCase()}</>}
                  </div>
                  {it.remarks && <div style={{ color: '#10B981', fontSize: 10, marginTop: 2, opacity: 0.85 }}>{it.remarks}</div>}
                  {typeof it.confidence === 'number' && (
                    <div style={{ marginTop: 4, height: 3, background: '#1a1f2e', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(it.confidence * 100)}%`, height: '100%', background: it.confidence >= 0.75 ? '#10B981' : it.confidence >= 0.5 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
      {msg.clarification_needed && (
        <div data-testid={`clarification-${msg.id}`} style={{ marginTop: 8, padding: 8, background: '#1a1f2e', border: '1px solid #f59e0b', borderRadius: 4, color: '#f59e0b', fontSize: 12 }}>
          ❓ {msg.clarification_needed}
        </div>
      )}
    </div>
  );
}

function DragDropZone({ children, onFiles }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
      style={{ background: over ? 'rgba(212,165,116,0.12)' : 'transparent', transition: 'background 100ms' }}
    >
      {children}
    </div>
  );
}

function PromptEditorModal({ projectId, onClose }) {
  const [scope, setScope] = useState('project');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState('');

  useEffect(() => {
    fetch(`${API}/ai-assist/prompt?project_id=${projectId}`).then(r => r.json()).then(j => {
      setPrompt(j.prompt || '');
      setOriginal(j.prompt || '');
      setScope(j.scope || 'default');
    });
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/ai-assist/prompt`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, project_id: scope === 'project' ? projectId : null }),
      });
      onClose();
    } finally { setSaving(false); }
  };

  const dirty = prompt !== original;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} data-testid="aiassist-prompt-editor" style={{ background: '#0f1218', border: '1px solid #D4A574', borderRadius: 8, maxWidth: 800, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #2a3040' }}>
          <h3 style={{ color: '#D4A574', fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>⚙ AGENT BRAIN</h3>
          <p style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.8, marginTop: 4 }}>
            Edit the system prompt that drives the design agent. Saved changes take effect immediately on the next message.
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => setScope('project')} data-testid="prompt-scope-project"
              style={{ background: scope === 'project' ? '#D4A574' : 'transparent', color: scope === 'project' ? '#1a1f2e' : '#D4C5A9', border: '1px solid #D4A574', padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: 'pointer' }}>
              THIS PROJECT
            </button>
            <button onClick={() => setScope('workspace')} data-testid="prompt-scope-workspace"
              style={{ background: scope === 'workspace' ? '#D4A574' : 'transparent', color: scope === 'workspace' ? '#1a1f2e' : '#D4C5A9', border: '1px solid #D4A574', padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: 'pointer' }}>
              WORKSPACE DEFAULT
            </button>
          </div>
        </div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} data-testid="prompt-textarea"
          style={{ flex: 1, minHeight: 400, background: '#0a0a0a', color: '#D4C5A9', border: 'none', padding: 16, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5, resize: 'none', outline: 'none' }} />
        <div style={{ padding: 12, borderTop: '1px solid #2a3040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.7 }}>{prompt.length} chars{dirty && ' · unsaved'}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={!dirty || saving} data-testid="prompt-save"
              style={{ background: dirty ? '#D4A574' : '#4b5563', color: '#1a1f2e', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, border: 'none', cursor: dirty ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function summarizeMemory(memory) {
  const parts = [];
  const items = memory.visible_item_set || [];
  if (items.length) parts.push(`${items.length} items`);
  const vendors = memory.vendor_matches || {};
  if (Object.keys(vendors).length) parts.push(`${Object.keys(vendors).length} vendor matches`);
  const dnc = memory.do_not_change_constraints || [];
  if (dnc.length) parts.push(`${dnc.length} do-not-change rules`);
  const paint = memory.paint_references || {};
  if (Object.keys(paint).length) parts.push('paint locked');
  return parts.length ? parts.join(' · ') : 'tracking room continuity';
}

const panel = {
  position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '92vw',
  background: '#0f1218', borderLeft: '1px solid #D4A574', zIndex: 1090,
  display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 28px rgba(0,0,0,0.5)',
};
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderBottom: '1px solid #D4A574' };
const iconBtn = { background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 13 };
const thread = { flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 };
const bubbleUser = { background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 6, padding: 10, alignSelf: 'stretch' };
const bubbleAssistant = { background: '#0a0a0a', border: '1px solid #D4A574', borderRadius: 6, padding: 10, alignSelf: 'stretch' };
const emptyState = { textAlign: 'center', padding: 40, color: '#D4C5A9' };
const composer = { borderTop: '1px solid #D4A574', background: '#0a0a0a' };
const attachBtn = { background: '#1a1f2e', color: '#D4A574', border: '1px solid #D4A574', padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: 'pointer' };
const sendBtn = { background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '6px 16px', fontSize: 12, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: 'pointer' };
const pushBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', borderTop: '1px solid #10B981' };
const pushBtn = { background: '#10B981', color: '#fff', border: 'none', padding: '6px 14px', fontSize: 11, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: 'pointer' };

```

---

## FILE: `/app/frontend/src/components/VendorPortalsPage.js`

```javascript
/**
 * VendorPortalsPage — minimal, focused page for managing vendor portal
 * credentials. Used by the AI Design Assistant to unlock authenticated
 * scraping (price, hi-res image, finish, size) on B2B vendor sites.
 *
 * Route: /admin/vendor-portals (inside the authenticated app shell).
 */
import React, { useEffect, useState } from 'react';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export default function VendorPortalsPage() {
  const [portals, setPortals] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loginStatus, setLoginStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [loggingInKey, setLoggingInKey] = useState('');
  const [drafts, setDrafts] = useState({});  // { [vendor_key]: { username, password } }
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        fetch(`${API}/vendor-portals`).then(r => r.json()),
        fetch(`${API}/vendor-portals/saved-credentials`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/vendor-portals/login-status`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      ]);
      setPortals(Array.isArray(p) ? p : (p.portals || []));
      setCredentials(Array.isArray(c) ? c : (c.credentials || []));
      setLoginStatus(s.status || s || {});
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveCreds = async (vendorKey) => {
    const d = drafts[vendorKey];
    if (!d?.username || !d?.password) { setMessage('Enter both username and password.'); return; }
    setSavingKey(vendorKey); setMessage('');
    try {
      const res = await fetch(`${API}/vendor-portals/${vendorKey}/credentials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: d.username, password: d.password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'Save failed');
      }
      setMessage(`✓ Saved credentials for ${vendorKey}`);
      setDrafts(prev => ({ ...prev, [vendorKey]: { username: '', password: '' } }));
      load();
    } catch (e) {
      setMessage(`✗ ${e.message}`);
    } finally { setSavingKey(''); }
  };

  const testLogin = async (vendorKey) => {
    setLoggingInKey(vendorKey); setMessage('');
    try {
      const res = await fetch(`${API}/vendor-portals/${vendorKey}/login`, { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.detail || 'Login failed');
      setMessage(j.message ? `✓ ${vendorKey}: ${j.message}` : `✓ Logged into ${vendorKey}`);
      load();
    } catch (e) {
      setMessage(`✗ ${vendorKey}: ${e.message}`);
    } finally { setLoggingInKey(''); }
  };

  const hasCred = (vk) => credentials.some(c => (c.vendor_key === vk || c.vendor === vk));
  const loggedIn = (vk) => loginStatus[vk] === 'logged_in' || loginStatus[vk] === true;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#D4C5A9', padding: 32 }} data-testid="vendor-portals-page">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: '#D4A574', fontSize: 24, letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>VENDOR PORTAL LOGINS</h1>
        <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
          Save your vendor B2B logins ONCE. The AI Design Assistant uses them to fetch real prices, hi-res images, finish swatches, and sizes when ingesting Canva PDFs.
        </p>
        <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 24 }}>
          Credentials are encrypted at rest. Never shown back to you in plaintext.
        </p>

        {message && (
          <div style={{ background: message.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.startsWith('✓') ? '#10B981' : '#ef4444'}`, color: message.startsWith('✓') ? '#10B981' : '#ef4444', padding: 10, borderRadius: 4, marginBottom: 16, fontSize: 12 }} data-testid="vp-message">
            {message}
          </div>
        )}

        {loading ? <div style={{ padding: 20 }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
            {portals.map(p => {
              const vk = p.key || p.vendor_key;
              const d = drafts[vk] || {};
              const isSaved = hasCred(vk);
              const isLoggedIn = loggedIn(vk);
              return (
                <div key={vk} data-testid={`vp-card-${vk}`} style={{ background: '#1a1f2e', border: '1px solid #B49B7E', padding: 14, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: '#D4A574', fontSize: 14, fontWeight: 800 }}>{p.name || vk}</div>
                      <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.7 }}>{p.url || p.domain || ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {isSaved && <span style={{ background: '#0f1218', color: '#10B981', fontSize: 9, padding: '2px 6px', borderRadius: 3, border: '1px solid #10B981', letterSpacing: 1, fontWeight: 700 }}>SAVED</span>}
                      {isLoggedIn && <span style={{ background: '#10B981', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3, letterSpacing: 1, fontWeight: 700 }}>LIVE</span>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <input
                      placeholder={isSaved ? 'Saved · type to replace' : 'Username / email'}
                      value={d.username || ''}
                      onChange={e => setDrafts(prev => ({ ...prev, [vk]: { ...(prev[vk] || {}), username: e.target.value } }))}
                      data-testid={`vp-user-${vk}`}
                      style={{ background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #4b5563', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}
                    />
                    <input
                      type="password"
                      placeholder={isSaved ? 'Saved · type to replace' : 'Password'}
                      value={d.password || ''}
                      onChange={e => setDrafts(prev => ({ ...prev, [vk]: { ...(prev[vk] || {}), password: e.target.value } }))}
                      data-testid={`vp-pass-${vk}`}
                      style={{ background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #4b5563', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => saveCreds(vk)} disabled={savingKey === vk || !(d.username && d.password)} data-testid={`vp-save-${vk}`}
                      style={{ flex: 1, background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '6px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1, borderRadius: 3, cursor: 'pointer' }}>
                      {savingKey === vk ? 'Saving…' : 'SAVE'}
                    </button>
                    <button onClick={() => testLogin(vk)} disabled={!isSaved || loggingInKey === vk} data-testid={`vp-test-${vk}`}
                      style={{ flex: 1, background: isSaved ? '#10B981' : '#4b5563', color: '#fff', border: 'none', padding: '6px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1, borderRadius: 3, cursor: isSaved ? 'pointer' : 'not-allowed' }}>
                      {loggingInKey === vk ? 'Testing…' : 'TEST LOGIN'}
                    </button>
                  </div>
                </div>
              );
            })}
            {portals.length === 0 && (
              <div style={{ padding: 20, opacity: 0.7, gridColumn: '1 / -1' }}>No vendor portals configured. Check backend/vendor_portals.py.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

```

---

## FILE: `/app/backend/server.py` — `/api/ai-assist/ingest-canva-url` and `/api/ai-assist/ingest-pdf` handlers

```python
@api_router.post("/ai-assist/ingest-canva-url")
async def ai_assist_ingest_canva_url(payload: AIAssistCanvaIngest):
    """Canva direct-read path.

    User pastes a Canva design URL (e.g. https://www.canva.com/design/DAG.../view).
    Pipeline:
      1) Parse design_id out of the URL.
      2) Call Canva Connect API `GET /v1/designs/{design_id}` for title + thumbnail (auth check + identify the design).
      3) Kick off `POST /v1/exports` with `format.type='pdf'` to get a
         server-side high-fidelity PDF export of the live design.
      4) Poll `GET /v1/exports/{job_id}` until done; download the PDF bytes.
      5) Hand the PDF bytes off to the same 3-stage `/ai-assist/ingest-pdf`
         flow so the user gets the SAME response shape regardless of
         which entry point was used.

    Why this path beats user-uploading-a-PDF:
      - Canva's server-side export preserves embedded hyperlink annotations
        consistently (manual "Download → PDF" sometimes flattens them).
      - We can fetch design metadata for UX (board name → suggested room).
      - Removes a manual step (no Save → Download → Drag).

    Note: Canva's Connect API does NOT publicly expose per-element
    hyperlinks in the design-content response as of Feb 2026, so we still
    rely on the PDF for link extraction. If/when Canva ships an
    element-level URL field, swap step 3-5 for a direct read.
    """
    from canva_integration import canva_integration as _canva

    design_id = _canva.extract_design_id_from_url(payload.canva_url)
    if not design_id:
        raise HTTPException(status_code=400, detail="Could not parse design_id from Canva URL — expected `https://www.canva.com/design/DAG.../...`")

    # Step 2 — design metadata (also serves as auth check)
    try:
        design = await _canva.get_design(design_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Canva GET design failed: {exc}")
    design_obj = design.get("design") or design
    design_title = design_obj.get("title") or design_obj.get("name") or ""

    # Step 3 — kick off PDF export
    try:
        export_resp = await _canva.export_design_as_pdf(design_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Canva export start failed: {exc}")
    job = export_resp.get("job") or export_resp
    job_id = (job or {}).get("id")
    if not job_id:
        raise HTTPException(status_code=502, detail=f"Canva export did not return a job id: {export_resp}")

    # Step 4 — poll until done
    try:
        final_job = await _canva.poll_export_until_done(job_id, max_wait_s=90)
    except Exception as exc:
        raise HTTPException(status_code=504, detail=f"Canva export poll: {exc}")
    if (final_job or {}).get("status") != "success":
        raise HTTPException(status_code=502, detail=f"Canva export failed: {final_job}")

    # Download the PDF(s) — Canva returns a list of URLs (one per page bundle)
    urls = final_job.get("urls") or []
    if not urls:
        raise HTTPException(status_code=502, detail="Canva export reported success but returned no urls")

    pdf_bytes_parts: List[bytes] = []
    async with httpx.AsyncClient(timeout=60.0) as client:
        for u in urls:
            r = await client.get(u)
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Canva PDF download failed ({r.status_code}) for {u}")
            pdf_bytes_parts.append(r.content)

    # If multiple parts came back, glue them together with pypdf
    if len(pdf_bytes_parts) == 1:
        pdf_bytes = pdf_bytes_parts[0]
    else:
        from pypdf import PdfReader as _PR, PdfWriter as _PW
        w = _PW()
        for b in pdf_bytes_parts:
            r = _PR(io.BytesIO(b))
            for p in r.pages:
                w.add_page(p)
        out = io.BytesIO()
        w.write(out)
        pdf_bytes = out.getvalue()

    # Step 5 — re-enter the existing PDF pipeline
    pdf_b64 = base64.b64encode(pdf_bytes).decode()
    inner = AIAssistPdfIngest(
        project_id=payload.project_id,
        room_name=payload.room_name,
        sheet_type=payload.sheet_type,
        pdf_base64=pdf_b64,
        extra_message=payload.extra_message or (f"Source: Canva design '{design_title}' ({design_id})" if design_title else None),
    )
    result = await ai_assist_ingest_pdf(inner)
    # Add Canva-specific telemetry so the UI knows this came from a live design
    result["source"] = "canva_url"
    result["canva_design_id"] = design_id
    result["canva_design_title"] = design_title
    return result


import httpx  # local import to avoid moving the global import block


@api_router.post("/ai-assist/ingest-pdf")
async def ai_assist_ingest_pdf(payload: AIAssistPdfIngest):
    """Single-room PDF ingest.

    Pipeline:
      1. Decode the PDF, extract embedded vendor URLs (hyperlinks).
      2. Render each page to a JPEG image.
      3. Send images + URL list to the design agent → returns detected_items
         mapped to the user's chosen room/sheet_type.
      4. For each detected item with a vendor link, enrich via the existing
         /scrape-product pipeline → fills price, image_url, finish_image,
         SKU, size, description, finish_color, fabric_code, etc.
      5. Return enriched items (NOT auto-pushed — the user reviews + clicks
         PUSH in the panel).
    """
    project = await db.projects.find_one({"id": payload.project_id}, {"_id": 0, "id": 1, "name": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not payload.room_name.strip():
        raise HTTPException(status_code=400, detail="room_name is required (one PDF = one room)")

    # ---- 1) Decode PDF + extract links + render pages ----
    raw_b64 = payload.pdf_base64.strip()
    if raw_b64.startswith("data:"):
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        pdf_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 PDF")

    import tempfile, subprocess
    from pypdf import PdfReader

    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "input.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        # Extract embedded vendor URLs (preserve doc order, dedupe)
        try:
            reader = PdfReader(pdf_path)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not parse PDF: {exc}")

        # --------------------------------------------------------------
        # Multi-stage URL extraction (in priority order):
        #
        #   Stage 1 — PDF link annotations (most reliable, authored URLs)
        #   Stage 2 — Visible text on each page, URL-regex'd (catches Canva
        #             "as-text" links that aren't hyperlinks)
        #   Stage 3 — Embedded `<<...>>` raw stream URIs in the PDF bytes
        #             (handles PDFs whose annotations were flattened)
        #
        # Stage 4 (OCR/vision) happens later when we send rendered images
        # to Gemini — even if all three URL stages return zero, the agent
        # can still identify items visually.
        # --------------------------------------------------------------
        vendor_urls: List[str] = []
        seen = set()

        def _record_url(u: str):
            if not u:
                return
            u = str(u).strip()
            if not u.startswith(("http://", "https://")):
                return
            # Drop fragments/utm noise to dedupe equivalents
            base = u.split("#", 1)[0].split("?utm", 1)[0]
            if base in seen:
                return
            seen.add(base)
            vendor_urls.append(u)

        # Stage 1 — annotations
        annot_count = 0
        for page in reader.pages:
            annots = page.get("/Annots") or []
            for ann in annots:
                try:
                    obj = ann.get_object()
                    if obj.get("/Subtype") != "/Link":
                        continue
                    action = obj.get("/A")
                    if not action:
                        continue
                    uri = action.get_object().get("/URI")
                    if uri:
                        annot_count += 1
                        _record_url(str(uri))
                except Exception:
                    continue

        # Stage 2 — visible text URLs
        url_regex = re.compile(r"https?://[^\s\"'<>)\]\}]+", re.I)
        text_count = 0
        for page in reader.pages:
            try:
                txt = page.extract_text() or ""
            except Exception:
                txt = ""
            for m in url_regex.findall(txt):
                before = len(vendor_urls)
                _record_url(m)
                if len(vendor_urls) > before:
                    text_count += 1

        # Stage 3 — raw stream URI scan (covers flattened-annotation PDFs)
        raw_count = 0
        try:
            raw_bytes = pdf_bytes
            for m in url_regex.findall(raw_bytes.decode("latin-1", errors="ignore")):
                before = len(vendor_urls)
                _record_url(m)
                if len(vendor_urls) > before:
                    raw_count += 1
        except Exception:
            pass

        logger.info(f"PDF URL extraction: annotations={annot_count} text={text_count} raw_stream={raw_count} total_unique={len(vendor_urls)}")

        # Render pages to JPEG (max ~5 pages — board exports are usually 1-2)
        page_images_b64: List[Dict[str, str]] = []
        try:
            subprocess.run(
                ["pdftoppm", "-jpeg", "-r", "110", "-l", "5", pdf_path, os.path.join(tmpdir, "page")],
                check=True, capture_output=True, timeout=60,
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"PDF render failed: {exc}")
        for fname in sorted(os.listdir(tmpdir)):
            if fname.startswith("page-") and fname.endswith(".jpg"):
                with open(os.path.join(tmpdir, fname), "rb") as f:
                    page_images_b64.append({
                        "base64": base64.b64encode(f.read()).decode(),
                        "mime_type": "image/jpeg",
                    })

    if not page_images_b64:
        raise HTTPException(status_code=400, detail="No pages could be rendered from the PDF")

    # ---- 2) Build the agent message that LOCKS items to one room ----
    msg_lines = [
        f"This PDF is a moodboard for ONE ROOM ONLY: **{payload.room_name}**.",
        f"Target sheet type: **{payload.sheet_type}**.",
        "Every visible item in this PDF belongs to that room — do not split across multiple rooms.",
        "Identify each visible item (furniture, lighting, rugs, mirrors, art, fixtures, wallcoverings, decor) and prepare records ready to push.",
    ]
    if vendor_urls:
        msg_lines += [
            "",
            "The board has these embedded vendor links (authoritative — these are the EXACT items in the scene):",
        ]
        for u in vendor_urls:
            msg_lines.append(f"- {u}")
        msg_lines += [
            "",
            "Match each visible item to the closest vendor link. Put the link in `link`. Leave price/image/finish blank — the server will enrich those next.",
        ]
    if payload.extra_message:
        msg_lines += ["", f"Additional instructions: {payload.extra_message}"]

    # Reuse the chat endpoint logic so we get strict JSON + memory + history.
    inner_payload = AIAssistChat(
        project_id=payload.project_id,
        message="\n".join(msg_lines),
        images=page_images_b64,
        reset=False,
    )
    chat_response = await ai_assist_chat(inner_payload)
    items = chat_response.get("detected_items") or []

    # ---- 3) Force room_name + sheet_type on every detected item ----
    for it in items:
        it["room_name"] = payload.room_name
        it["sheet_type"] = payload.sheet_type
        if not it.get("category_name"):
            it["category_name"] = "Furniture"
        if not it.get("subcategory_name"):
            it["subcategory_name"] = "Items"

    # ---- 4) Enrich each item with the authenticated vendor portal scraper
    # if creds are saved + we recognize the domain. Otherwise fall back to
    # the public /scrape-product (which is hit-or-miss because vendors block
    # bots and gate prices behind login). ----
    from vendor_portals import resolve_vendor_key_from_url, get_vendor_portal_info as _portal_info

    try:
        from vendor_scraper import get_scraper as _get_scraper
    except Exception:
        _get_scraper = None

    enrichment_results = []
    portal_scraper = None
    if _get_scraper is not None:
        try:
            portal_scraper = await _get_scraper()
        except Exception:
            portal_scraper = None

    for it in items:
        link = (it.get("link") or "").strip()
        if not link or not link.startswith("http"):
            enrichment_results.append({"link": link, "status": "skipped", "reason": "no link"})
            continue

        scraped_data = None
        used_path = ""

        # 4a) Try the authenticated portal first.
        vendor_key = resolve_vendor_key_from_url(link)
        portal = _portal_info(vendor_key) if vendor_key else None
        logged_in = (
            portal_scraper is not None
            and vendor_key
            and vendor_key in getattr(portal_scraper, "contexts", {})
        )
        if portal and logged_in:
            try:
                details = await portal_scraper.get_product_details(vendor_key, link, portal)
                if isinstance(details, dict):
                    scraped_data = details
                    used_path = "portal_authenticated"
            except Exception as exc:
                enrichment_results.append({"link": link, "vendor_key": vendor_key, "status": "portal_error", "detail": str(exc)[:160]})
                # fall through to public scrape

        # 4b) Fall back to public scraper.
        if scraped_data is None:
            try:
                public_resp = await scrape_product_advanced({"url": link, "vendor": it.get("vendor", "")})
                sd_root = public_resp if isinstance(public_resp, dict) else {}
                # /scrape-product wraps real data under sd_root['data']
                if isinstance(sd_root.get("data"), dict):
                    scraped_data = {**(sd_root.get("data") or {}), **{k: v for k, v in sd_root.items() if k not in ("data",)}}
                else:
                    scraped_data = sd_root
                used_path = "public"
            except HTTPException as exc:
                enrichment_results.append({"link": link, "status": "error", "detail": str(exc.detail)[:200]})
                continue
            except Exception as exc:
                enrichment_results.append({"link": link, "status": "error", "detail": str(exc)[:200]})
                continue

        sd = scraped_data or {}

        # Authenticated portal scraper returns `images: [...]` array; the
        # public scraper returns a single `image_url`. Normalize so the
        # downstream `_set("image_url")` works regardless of source.
        if not sd.get("image_url") and isinstance(sd.get("images"), list) and sd["images"]:
            sd["image_url"] = sd["images"][0]

        # 4c) Light-weight OG/JSON-LD fallback. Works for vendors we couldn't
        # log into (Gabby, Uttermost, Bernhardt, Loloi) because most modern
        # e-com sites embed product metadata in <meta property="og:..."> tags
        # and a JSON-LD <script> regardless of auth state. We only run this
        # if EITHER image OR price is still missing AND we haven't already
        # gotten them from the portal path.
        need_image = not sd.get("image_url")
        need_price = not (sd.get("price") or sd.get("cost") or sd.get("wholesale_price"))
        if (need_image or need_price) and PLAYWRIGHT_AVAILABLE and async_playwright is not None:
            try:
                async with async_playwright() as _ap:
                    _b = await _ap.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
                    _ctx = await _b.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    _pg = await _ctx.new_page()
                    try:
                        await _pg.goto(link, wait_until="domcontentloaded", timeout=20000)
                    except Exception:
                        pass
                    await asyncio.sleep(1.5)
                    extracted = await _pg.evaluate(r"""() => {
                        const out = {};
                        const meta = (sel) => { const el = document.querySelector(sel); return el ? (el.getAttribute('content')||'').trim() : ''; };
                        out.og_title = meta('meta[property="og:title"]') || meta('meta[name="og:title"]');
                        out.og_image = meta('meta[property="og:image"]') || meta('meta[name="og:image"]');
                        out.og_description = meta('meta[property="og:description"]') || meta('meta[name="description"]');
                        out.og_price = meta('meta[property="product:price:amount"]') || meta('meta[itemprop="price"]') || meta('meta[property="og:price:amount"]');
                        const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                        for (const n of ldNodes) {
                            try {
                                const parsed = JSON.parse(n.textContent||'{}');
                                const arr = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
                                for (const obj of arr) {
                                    if (!obj || typeof obj !== 'object') continue;
                                    const t = obj['@type']; const types = Array.isArray(t) ? t : [t];
                                    if (types.includes('Product') || types.includes('IndividualProduct')) {
                                        out.ld_name = obj.name || out.ld_name;
                                        out.ld_sku = obj.sku || obj.mpn || obj.productID || out.ld_sku;
                                        if (obj.image) out.ld_image = (Array.isArray(obj.image) ? obj.image[0] : (typeof obj.image==='object' ? (obj.image.url||'') : obj.image)) || out.ld_image;
                                        const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
                                        if (offers) out.ld_price = (offers.price || offers.lowPrice || '').toString() || out.ld_price;
                                    }
                                }
                            } catch(e){}
                        }
                        // largest visible img >= 400x400
                        let biggest = null;
                        document.querySelectorAll('img').forEach(el => {
                            const src = el.currentSrc || el.src || el.dataset.src || '';
                            const r = el.getBoundingClientRect();
                            if (!src || src.startsWith('data:')) return;
                            if (r.width < 400 || r.height < 400) return;
                            const area = r.width * r.height;
                            if (!biggest || area > biggest.area) biggest = {src, area};
                        });
                        if (biggest) out.biggest_image = biggest.src;
                        return out;
                    }""")
                    await _b.close()
                    if need_image:
                        img = extracted.get("ld_image") or extracted.get("og_image") or extracted.get("biggest_image")
                        if img:
                            if img.startswith("//"):
                                img = "https:" + img
                            sd["image_url"] = img
                    if need_price:
                        pstr = extracted.get("ld_price") or extracted.get("og_price")
                        if pstr:
                            try:
                                pnum = float(re.sub(r"[^\d.]", "", str(pstr)))
                                if pnum > 0:
                                    sd["price"] = pnum
                            except Exception:
                                pass
                    if not sd.get("name"):
                        sd["name"] = extracted.get("ld_name") or extracted.get("og_title") or sd.get("name")
                    if not sd.get("sku") and extracted.get("ld_sku"):
                        sd["sku"] = str(extracted["ld_sku"])
                    if not sd.get("description"):
                        sd["description"] = extracted.get("og_description") or sd.get("description")
                    used_path = used_path + "+meta_fallback"
            except Exception as _fb_exc:
                logger.warning(f"meta fallback skipped for {link}: {_fb_exc}")

        # Mutate the item with the scraped fields, preserving anything the
        # agent already filled in for higher-confidence fields where ours win.
        def _set(field, scraped_key=None, prefer_scraper=False):
            sk = scraped_key or field
            v = sd.get(sk)
            if v in (None, ""):
                return
            if prefer_scraper or not it.get(field):
                it[field] = v
        _set("name", scraped_key="title", prefer_scraper=False)
        if not it.get("name"):
            _set("name", prefer_scraper=False)
        _set("vendor", prefer_scraper=False)
        _set("sku", prefer_scraper=True)
        _set("image_url", prefer_scraper=True)
        _set("finish_image", prefer_scraper=True)
        _set("finish_color", scraped_key="finish", prefer_scraper=True)
        if not it.get("finish_color"):
            _set("finish_color", prefer_scraper=True)
        _set("size", scraped_key="dimensions", prefer_scraper=True)
        if not it.get("size"):
            _set("size", prefer_scraper=True)
        _set("description", prefer_scraper=True)
        # Price → cost (wholesale)
        scraped_price = sd.get("price") or sd.get("wholesale_price") or sd.get("cost")
        if scraped_price:
            try:
                p = float(str(scraped_price).replace("$", "").replace(",", "").strip())
                it["cost"] = p
                it["price"] = p
            except Exception:
                pass

        enrichment_results.append({
            "link": link,
            "vendor_key": vendor_key,
            "status": "ok",
            "via": used_path,
            "got_price": bool(scraped_price),
            "got_image": bool(sd.get("image_url")),
            "got_finish": bool(sd.get("finish_image") or sd.get("finish")),
            "got_sku": bool(sd.get("sku")),
            "got_size": bool(sd.get("size") or sd.get("dimensions")),
        })

    # Compute whether this is an image-only PDF (no extractable text on
    # any page) so the frontend can show a "treated as visual board" badge.
    total_text_chars = 0
    try:
        reader2 = PdfReader(io.BytesIO(pdf_bytes))
        for p in reader2.pages:
            try:
                t = p.extract_text() or ""
                total_text_chars += len(t.strip())
            except Exception:
                continue
    except Exception:
        pass
    image_only_pdf = total_text_chars < 30  # threshold = a few words at most

    return {
        "room_name": payload.room_name,
        "sheet_type": payload.sheet_type,
        "vendor_urls_found": len(vendor_urls),
        "vendor_urls": vendor_urls,
        "pages_rendered": len(page_images_b64),
        "image_only_pdf": image_only_pdf,
        "extraction_stages": {
            "annotations": annot_count,
            "visible_text": text_count,
            "raw_stream": raw_count,
            "total_unique": len(vendor_urls),
        },
        "detected_items": items,
        "enrichment": enrichment_results,
        "assistant_message": (chat_response.get("assistant_message") or {}).get("content", ""),
        "design_notes": chat_response.get("design_notes", ""),
    }
```

---

## End of bundle.
