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

### Feb 28, 2026
- **FIXED P0 BUG**: "Add Room" on mobile app for projects with ZERO rooms. Root cause: Add Room modal JSX was only rendered in the main return path of `TabbedWalkthroughSpreadsheet.js`, not in the early-return for zero-rooms case. Fix: duplicated modal into the early-return block (lines 562-685). Verified with testing agent (8/8 backend tests pass, all frontend flows working).

### Previous
- **Address Autocomplete**: Replaced Google Maps with OpenStreetMap Nominatim API (`GoogleAddressInput.js`)
- **Mobile App Redirect**: Touch device detection redirects to `/mobile-app`
- **Mobile Dashboard**: Redesigned home screen listing all projects
- **Dynamic API Config**: `config.js` uses `window.location.origin` (DO NOT CHANGE)
- **Booking Endpoint**: Hardened `/api/booking/available-slots`
- **Chrome Extension v7.37.0**: Fixed image copying, thumbnails, added Vendor/MSRP fields
- **Email**: SMTP configured and working
- Fit-to-text auto-sizing inputs in spreadsheets

## Critical Config
- `frontend/src/App.js` line 60 — Sets BACKEND_URL via window.ENV or window.location.origin. DO NOT hardcode URLs.
- `backend/.env` — SMTP creds, MongoDB, Azure OAuth, Google Maps key
- DO NOT TOUCH `config.js` or hardcode preview URLs

## Pending / Backlog
- P1: User verification of OpenStreetMap address autocomplete
- P2: User verification of Chrome Extension fixes (v7.37.0)
- Rename `GoogleAddressInput.js` to `AddressAutocompleteInput.js`
- Clean up unused `/app/mobile/` Expo directory
- Deploy to production
- EAS Build for standalone iPad app
- Outlook calendar sync for real booking availability
