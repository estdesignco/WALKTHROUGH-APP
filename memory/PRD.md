# Interior Design Application - Product Requirements Document

## Original Problem Statement
Build a deployment-ready interior design application with a Chrome Extension web scraper that reliably extracts product data (name, sku, price, size, finish_color, finish_image) from 26 vendor websites.

## Core Requirements

### P0 - Critical
1. **Chrome Extension Web Scraper** - Must work for all 26 vendor sites
   - Uttermost: ✅ WORKING (v5.2.2+)
   - Four Hands: ✅ IMPLEMENTED (v6.1.0) - Requires user testing
   - Visual Comfort: Implemented (generic fallback)
   - Bernhardt: Implemented (generic fallback)
   - Other 22 vendors: Generic fallback + need vendor-specific logic

### P1 - Important
1. **Data Integrity** - Fix destructive auto_populate_projects.py script (NOT STARTED)
2. **Backend Stability** - Ensure all APIs work correctly (TESTED)

### P2 - Nice to Have
1. Google Drive Backup feature
2. Client Approval Portal
3. Backend refactoring (monolithic server.py)

## Architecture

### Tech Stack
- Frontend: React + Tailwind CSS
- Backend: FastAPI (Python)
- Database: MongoDB
- Chrome Extension: Vanilla JavaScript

### Key Files
- `/app/chrome-extension-scraper/popup.js` - Main scraper logic (v6.1.0)
- `/app/chrome-extension-scraper/manifest.json` - Extension manifest
- `/app/backend/server.py` - FastAPI server (monolithic)

## What's Been Implemented

### Chrome Extension v6.1.0 (January 2, 2026)
- Added vendor-specific logic for Four Hands:
  - SKU extraction from subtitle (.text-neutral-50) or URL (/product/SKU pattern)
  - Dimensions parsing for "w x d x h" format
  - Swatch image extraction from label[title] elements
- Preserved Uttermost logic (working since v5.2.2)
- Generic fallbacks for other vendors

### Backend APIs (Tested & Working)
- `/api/download/chrome-extension` - Returns v6.1.0 zip
- `/api/projects` - List all projects
- `/api/extension-scrape` - Cache scraped data
- `/api/extension-scrape-cache` - Retrieve cached data
- `/api/ai-scrape` - AI-powered extraction fallback

## Prioritized Backlog

### P0 - User Must Test
- [ ] **User testing of Chrome Extension v6.1.0 on Four Hands website**
  - Download from: https://furnscape.preview.emergentagent.com/api/download/chrome-extension
  - Test on: https://fourhands.com/product/247447-002 (Brenna Dining Chair)
  - Verify: SKU, dimensions, swatch image, main image all extracted

### P1 - After Four Hands Verification
- [ ] Add vendor-specific logic for remaining 24 vendors (one at a time)
- [ ] Fix auto_populate_projects.py to be non-destructive (idempotent)

### P2 - Future
- [ ] Google Drive Backup feature
- [ ] Full application audit
- [ ] Backend refactoring (split server.py into modules)
- [ ] Client Approval Portal

## Testing Status
- Backend: 100% (18/18 tests passed)
- Frontend: Working (manual verification)
- Chrome Extension: **REQUIRES USER TESTING**

## Known Issues
- auto_populate_projects.py uses destructive delete_many pattern
- Extension cannot be automatically tested (requires browser installation)

## Next Steps
1. User downloads and installs Chrome Extension v6.1.0
2. User tests on Uttermost (regression) and Four Hands (new)
3. User reports results
4. If issues found, debug and fix
5. If working, proceed to next vendor
