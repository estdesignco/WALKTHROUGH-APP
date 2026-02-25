# Interior Design App - PRD

## Original Problem Statement
Interior design project management application (ESTABLISHED Design Co.) with spreadsheets, Chrome extension scraper, email questionnaire, mobile app, appointment booking.

## Architecture
- Frontend: React + Tailwind CSS (port 3000)
- Backend: FastAPI + MongoDB (port 8001)
- Chrome Extension: Manifest V3 (`/app/chrome-extension-scraper/`)
- Mobile: Expo React Native (`/app/mobile/`)
- Email: Microsoft 365 SMTP (info@estdesignco.com)
- Address: Google Places Autocomplete (key restricted to app.estdesignco.com)

## What's Been Implemented

### Feb 25, 2026
- **FIXED**: Booking "Unable to load available times" — `config.js` was pointing to production backend which returned 500. Fixed to use preview URL.
- **FIXED**: Scraper v7.36.0 — Copy Image downloads actual PNG (not URLs), added Vendor/MSRP fields, expanded panel height
- **FIXED**: Email — SENDER_PASSWORD configured, emails confirmed working
- **Mobile**: Expo app running, tunnel at `exp://edit-scraped-data.ngrok.io`

### Previous
- Fit-to-text auto-sizing inputs in spreadsheets (`src/utils/autoSizeInputs.js`)
- Chrome extension redesign with editable fields

## Critical Config
- `frontend/public/config.js` — Sets `window.ENV.REACT_APP_BACKEND_URL`. Must match deployment target.
- `backend/.env` — SMTP creds, MongoDB, Azure OAuth
- Google Maps API key: `AIzaSyCZ4VtXompFHngyxRATD0FZMruCmfDiiC0` (referrer-restricted to `app.estdesignco.com`)

## Pending
- User test of scraper image copy to Canva
- Deploy to production
- Fit-to-text verification in spreadsheets
- EAS Build for standalone iPad app
- Outlook calendar sync for real booking availability
