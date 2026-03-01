# Interior Design App - PRD

## Original Problem Statement
Interior design project management application (ESTABLISHED Design Co.) with spreadsheets, Chrome extension scraper, email questionnaire, mobile app, appointment booking.

## Architecture
- Frontend: React + Tailwind CSS (port 3000)
- Backend: FastAPI + MongoDB (port 8001)
- Chrome Extension: Manifest V3 (`/app/chrome-extension-scraper/`)
- Mobile: PWA approach via `/mobile-app` route (MobileAppSimulator.js)
- Email: Microsoft 365 SMTP (info@estdesignco.com)
- Address: OpenStreetMap Nominatim API (replaced Google Maps)

## What's Been Implemented

### Mar 1, 2026
- **FIXED P0 BUG #1**: "Add Room" modal not appearing for projects with ZERO rooms. Root cause: modal JSX was only in the main return path, not the early-return for zero-rooms. Fix: duplicated modal into early-return block (TabbedWalkthroughSpreadsheet.js lines 562-685).
- **FIXED P0 BUG #2**: iPad users who logged in at root URL `/` saw desktop dashboard instead of mobile app. Root cause: `useEffect` in App.js had `[]` dependency — only fired on mount, not after login state change. Fix: changed to `[authenticated]` dependency so redirect fires after login.
- **IMPROVED iPad detection**: Added `pointer: coarse` media query check to both `index.html` pre-React redirect and App.js useEffect redirect for more robust iPad/tablet detection.
- All verified: 8/8 backend tests pass, full end-to-end mobile UI flow tested.

### Previous (from handoff)
- Address Autocomplete: Replaced Google Maps with OpenStreetMap Nominatim API
- Mobile App Redirect: Touch device detection redirects to `/mobile-app`
- Mobile Dashboard: Redesigned home screen listing all projects
- Dynamic API Config: `config.js` uses `window.location.origin` (DO NOT CHANGE)
- Booking Endpoint: Hardened `/api/booking/available-slots`
- Chrome Extension v7.37.0: Fixed image copying, thumbnails, added Vendor/MSRP fields
- Email: SMTP configured and working

## Critical Config (DO NOT CHANGE)
- `frontend/public/config.js` — Uses `window.location.origin`. DO NOT hardcode URLs.
- `backend/.env` — SMTP creds, MongoDB, Azure OAuth, Google Maps key

## Pending / Backlog
- P1: User verification of OpenStreetMap address autocomplete
- P2: User verification of Chrome Extension fixes (v7.37.0)
- Rename `GoogleAddressInput.js` to `AddressAutocompleteInput.js`
- Clean up unused `/app/mobile/` Expo directory
- Outlook calendar sync for real booking availability
