# Interior Design Walkthrough App - PRD

## Original Problem Statement
An interior design project management application with:
1. **Spreadsheets**: Checklist, Walkthrough, FF&E spreadsheets with "Fit to Text" auto-sizing columns (like Excel)
2. **Chrome Extension Scraper**: Scans Canva boards for trade vendor product links, allows editing scraped data before sending to the app

## Core Requirements
- Columns in spreadsheets auto-widen to fit cell content (no truncation/wrapping)
- Chrome Extension allows editing all scraped fields before submission
- Horizontal scrolling when content is wide

## What's Been Implemented
- **Fit to Text** (JS-based): `src/utils/autoSizeInputs.js` dynamically measures and sizes `<input>` elements in tables
- **Chrome Extension v3.0**: Redesigned with editable fields (Name, Vendor, SKU, Price, MSRP, Size, Finish/Color, Link, Remarks), scan auto-populates, manual entry supported

## Architecture
- Frontend: React + Tailwind CSS
- Backend: FastAPI + MongoDB
- Chrome Extension: Manifest V3, vanilla JS

## Key Files
- `src/utils/autoSizeInputs.js` - Auto-size inputs in tables
- `src/App.js` - Calls autoSizeInputs hook
- `chrome-extension/popup.html` - Extension UI with editable form
- `chrome-extension/popup.js` - Extension logic
- `chrome-extension/content.js` - Canva page scanner
- `src/components/spreadsheets/ExactChecklistSpreadsheet.js`
- `src/components/spreadsheets/ExactFFESpreadsheet.js`
- `src/components/spreadsheets/SimpleWalkthroughSpreadsheet.js`

## Pending Verification
- User verification of "Fit to Text" functionality
- User testing of Chrome Extension editable fields

## Backlog
- Refactor autoSizeInputs into per-component React hooks
- Update Chrome Extension README with current vendor list
