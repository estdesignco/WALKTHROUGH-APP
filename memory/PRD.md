# Interior Design App - PRD

## Original Problem Statement
Interior design project management application (ESTABLISHED Design Co.) with:
- Spreadsheets (Checklist, Walkthrough, FF&E) with fit-to-text auto-sizing
- Chrome Extension scraper for vendor product data
- Email questionnaire system (info@estdesignco.com)
- Mobile app for iPad (Expo React Native)
- Google Maps address autocomplete in questionnaire

## Architecture
- Frontend: React + Tailwind CSS (port 3000)
- Backend: FastAPI + MongoDB (port 8001)
- Chrome Extension: Manifest V3, vanilla JS (`/app/chrome-extension-scraper/`)
- Mobile App: Expo React Native (`/app/mobile/`)
- Email: Microsoft 365 SMTP (info@estdesignco.com)

## What's Been Implemented

### Scraper Extension (v7.36.0)
- Copy Image copies ACTUAL PNG image data to clipboard (not URLs)
- Added Vendor and MSRP fields to side panel
- Expanded panel content area (75vh) and gallery (320px)
- All fields editable via `<input>` elements
- Input sync handlers wire typed data back to scrapedData
- Files: `chrome-extension-scraper/content.js`, `manifest.json`

### Email System
- SMTP via Microsoft 365 (smtp-mail.outlook.com:587)
- Sends branded HTML questionnaire emails
- SENDER_PASSWORD configured in backend/.env
- Endpoint: POST /api/send-questionnaire

### Mobile App (Expo)
- Screens: Home, Projects, Walkthrough, Photos, Contacts, Leica D5, ToDo, Punch List, Samples
- API points to https://app.estdesignco.com/api
- Tunnel accessible via exp://edit-scraped-data.ngrok.io
- Assets generated, all dependencies installed

### Fit-to-Text (JS-based)
- `src/utils/autoSizeInputs.js` dynamically sizes input elements
- Called from App.js on mount
- Pending user verification

## Known Issues
- Google Maps Address Autocomplete: Places API + Geocoding API need to be ENABLED in Google Cloud Console for key AIzaSyCZ4VtXompFHngyxRATD0FZMruCmfDiiC0

## Key Files
- `chrome-extension-scraper/content.js` - Scraper with image copy fix
- `chrome-extension-scraper/manifest.json` - v7.36.0
- `backend/.env` - SMTP credentials, API keys
- `backend/server.py` - Main backend (email, API routes)
- `frontend/src/components/CustomerfacingQuestionnaire.js` - Questionnaire with Google Places
- `mobile/App.js` - Expo mobile app entry
- `src/utils/autoSizeInputs.js` - Fit-to-text utility

## Backlog
- Build standalone iOS app via EAS Build
- Verify fit-to-text in all 3 spreadsheets
- Refactor autoSizeInputs into per-component hooks
