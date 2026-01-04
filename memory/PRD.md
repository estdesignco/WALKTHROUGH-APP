# Interior Design Application - Product Requirements Document

## Original Problem Statement
Build a deployment-ready interior design application with a Chrome Extension web scraper that reliably extracts product data (name, sku, price, size, finish_color, finish_image) from 26 vendor websites.

## Core Requirements

### P0 - Critical
1. **Chrome Extension Web Scraper** - Must work for all 26 vendor sites
   - **v6.5.0 COMPLETE** - All vendors supported + NEW Click to Select feature

## v6.5.0 Features (January 3, 2026)

### NEW: Click to Select Feature
Like Houzz Clipper - auto-scrape first, then manually fix any missing data:
1. **Auto-scrape** runs first (existing functionality)
2. Click **"CLICK TO SELECT"** button (orange)
3. **Hover** over any element on page (green highlight appears)
4. **Click** any text or image
5. **Dropdown menu** appears: Select which field to populate
   - Product Title, Price, SKU, Dimensions, Finish/Color, Finish Image, Main Image, MSRP
6. Selected value **replaces** the auto-scraped value
7. Press **Escape** or click **"STOP SELECTING"** to exit mode

### All 26 Vendors Supported
Uttermost, Four Hands, Bernhardt, Visual Comfort, HVL Group, Gabby, Loloi, Rowe, Global Views, Regina Andrew, Surya, Safavieh, Eichholtz, Crestview Collection, Bassett Mirror, Flow Decor, Hubbardton Forge, Hinkley, Elegant Lighting, ZEE Lighting, Vanguard, Arteriors, Currey & Company

### Dimension Detection (7 Patterns)
- `30 W X 27 H X 32 D` - Uttermost format
- `Width: 33 Depth: 38 Height: 33` - Bernhardt, others
- `H: 18.5 W: 12 D: 12` - HVL Group, lighting
- `21.50"w x 23.00"d x 38.50"h` - Four Hands format
- `32"W x 38"D x 34"H` - Standard WxDxH
- `Overall: 12w 18h 12d` - Some furniture sites
- `2'3" x 7'9"` - Rug format (Loloi, Safavieh)

## Testing Status (January 3, 2026)
- **Backend**: 100% (3/3 API tests passed)
- **Frontend**: 100% (all features working)
- **Extension Code**: 100% (29/29 tests passed)
- **JavaScript Syntax**: Valid (confirmed by node -c)

## Download
**Extension URL:** `https://interiordata.preview.emergentagent.com/api/download/chrome-extension`

## User Instructions
1. Remove old extension from Chrome
2. Download v6.5.0 from URL above
3. Unzip and load unpacked in chrome://extensions
4. Navigate to any vendor product page
5. Click extension icon → "SCRAPE THIS PAGE"
6. If any data is missing or wrong → Click "CLICK TO SELECT"
7. Click the correct element on the page → Select field from dropdown
8. Click "SEND TO APP" when done

## Prioritized Backlog

### P1 - After User Verification
- [ ] Fix auto_populate_projects.py to be non-destructive (idempotent)

### P2 - Future
- [ ] Google Drive Backup feature
- [ ] Full application audit
- [ ] Backend refactoring (split server.py into modules)
- [ ] Client Approval Portal
