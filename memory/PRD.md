# Interior Design Application - Product Requirements Document

## Original Problem Statement
Build a deployment-ready interior design application with a Chrome Extension web scraper that reliably extracts product data (name, sku, price, size, finish_color, finish_image) from 22+ vendor websites.

## Core Requirements

### P0 - Critical
1. **Chrome Extension Web Scraper** - Must work for all 22 vendor sites
   - **v7.0.0 COMPLETE** - All 22 vendors supported with vendor-specific scraping logic

## v7.0.0 Features (January 4, 2025)

### Comprehensive Vendor-Specific Scraping
Each of the 22 vendors now has dedicated scraping logic for optimal data extraction:

| # | Vendor | Domain | Features |
|---|--------|--------|----------|
| 1 | Four Hands | fourhands.com | SKU from URL, dimensions WxDxH, color bullet pattern |
| 2 | Uttermost | uttermost.com | SKU from page, dimensions WxDxH, H1 color, swatch CSS |
| 3 | Global Views | globalviews.com | Item # SKU, standard dimensions |
| 4 | Rowe Furniture | rowefurniture.com | Style # SKU, fabric selection |
| 5 | Regina Andrew | reginaandrew.com | Item # SKU, both dimension formats |
| 6 | Bernhardt | bernhardt.com | Style SKU, finish dropdown, fabric patterns |
| 7 | Loloi Rugs | loloi.com | Rug SKU format, rug dimensions (feet) |
| 8 | Visual Comfort | visualcomfort.com | TOB SKU format, Height/Width separate |
| 9 | HVL Group | hvlgroup.com | SKU-finish format, lighting dimensions |
| 10 | Vanguard/V&H | vandh.com | Style # SKU, fabric selection |
| 11 | Flow Decor | flowdecor.com | WooCommerce format |
| 12 | Crestview | crestviewcollection.com | CVXXX SKU format |
| 13 | Bassett Mirror | bassettmirror.com | Item # SKU |
| 14 | Eichholtz | eichholtz.com | Article code, metric dimensions |
| 15 | MyOh America | myohamerica.com | Leather/Fabric finish |
| 16 | Safavieh | safavieh.com | TUL format SKU, rug/furniture dims |
| 17 | Surya | surya.com | XXX-0000 SKU format, rug dimensions |
| 18 | Zee Lighting | zeelighting.com | Lighting dimensions |
| 19 | Hubbardton Forge | hubbardtonforge.com | 6-digit SKU, finish swatch |
| 20 | Hinkley | hinkley.com | Number+letters SKU format |
| 21 | Elegant Lighting | elegantlighting.com | Standard lighting format |
| 22 | Gabby | gabby.com | SCH-SKU format, fabric swatch |

### Click to Select Feature (from v6.5.0)
Manual override for any missing/incorrect data:
1. **Auto-scrape** runs first
2. Click **"CLICK TO SELECT"** button
3. **Hover** over any element (green highlight)
4. **Click** any text or image
5. **Dropdown menu** appears: Select field to populate
6. Press **Escape** or click **"STOP SELECTING"** to exit

### Dimension Detection (7 Patterns)
- `30 W X 27 H X 32 D` - Uttermost format
- `Width: 33 Depth: 38 Height: 33` - Bernhardt, others
- `H: 18.5 W: 12 D: 12` - HVL Group, lighting
- `21.50"w x 23.00"d x 38.50"h` - Four Hands format
- `32"W x 38"D x 34"H` - Standard WxDxH
- `Overall: 12w 18h 12d` - Some furniture sites
- `8' x 10'` - Rug format (Loloi, Safavieh, Surya)

## Testing Status (January 4, 2025)
- **Extension Code**: JavaScript syntax valid (node --check passed)
- **Vendor Coverage**: 22/22 vendors with specific logic
- **Generic Fallback**: Available for unknown vendors

## Download
**Extension URL:** `https://scrapefixer.preview.emergentagent.com/api/download/chrome-extension`

## User Instructions
1. Remove old extension from Chrome
2. Download v7.0.0 from URL above (or use zip file)
3. Unzip and load unpacked in chrome://extensions
4. Navigate to any vendor product page
5. Click extension icon → "SCRAPE THIS PAGE"
6. If any data is missing or wrong → Click "CLICK TO SELECT"
7. Click the correct element on the page → Select field from dropdown
8. Click "SEND TO APP" when done

## Prioritized Backlog

### P1 - Canva Integration (BLOCKED)
- One-click "Copy for Canva" with embedded hyperlink
- Technical limitation: Canva strips hyperlinks from clipboard paste
- Only viable path: Official Canva API integration (requires user credentials)

### P2 - Future
- [ ] Google Drive Backup feature
- [ ] Full application audit
- [ ] Backend refactoring (split server.py into modules)
- [ ] Client Approval Portal
- [ ] Product Library and Materials Library Frontend
