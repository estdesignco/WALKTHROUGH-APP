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
