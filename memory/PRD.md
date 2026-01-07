# Interior Design Application - Product Requirements Document

## Original Problem Statement
Build a deployment-ready interior design application with a Chrome Extension web scraper that reliably extracts product data (name, sku, price, size, finish_color, finish_image) from 22+ vendor websites.

## Core Requirements

### P0 - Critical
1. **Chrome Extension Web Scraper** - Must work for all 22 vendor sites
   - **v7.8.2 CURRENT** - Added REMARKS field, Reverse Selection, Background Removal

## Changelog

### v7.8.2 (January 6, 2026)
- **Fixed**: Reverse Selection Mode now works correctly
  - Captures text selection on mousedown before click clears it
  - Highlight text on page → Click field in panel to populate

### v7.8.1 (January 6, 2026)
- **Added**: REMARKS field to scraper panel
- **Added**: Reverse Selection Mode (highlight text → click field)
- **Added**: REMARKS column to FFE spreadsheet
- **Added**: INSTALL NOTES column to FFE spreadsheet (editable, green highlight)
- **Updated**: Electrician Sheet export includes REMARKS
- **Updated**: Load-In Sheets export includes all fields (size, finish, vendor, remarks, install_notes)
- **Updated**: Movers FFE export includes SIZE/FINISH and REMARKS columns

### v7.7.9 (January 5, 2026)
- **Fixed**: Panel scrolling and layout - no longer cut off at bottom
- **Fixed**: Buttons arranged in compact 2x2 grid

### v7.7.6-7.7.8 (January 5, 2026)
- **Added**: ✨ No Background button for AI-powered background removal
- Uses rembg (open source, no API key needed)
- Backend endpoint: POST /api/remove-background

### v7.7.4-7.7.5 (January 5, 2026)
- **Fixed**: Copy Image and Copy Link buttons with robust fallbacks
- Uses execCommand fallback when clipboard API fails

### v7.7.3 (January 5, 2025)
- Fixed price-overwriting logic error
- Fixed Four Hands, Visual Comfort, HVL Group specific issues

## PWA Mobile App (iPad)
- **Version**: 1.0.0
- **App Name**: ESTABLISHED Design Co.
- **Icons**: All sizes generated (72-512px)
- **Installation**: Add to Home Screen on iPad Safari

## Test Results (January 6, 2026)
- Backend: 92% (24/26 tests passed)
- Frontend: 100% (all pages load correctly)
- All export endpoints working
- Chrome extension download working
- Background removal working

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
**Extension URL:** `https://dashmaster-15.preview.emergentagent.com/api/download/chrome-extension`

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
