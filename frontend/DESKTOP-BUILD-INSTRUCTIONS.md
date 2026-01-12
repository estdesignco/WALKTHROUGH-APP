# ESTABLISHED Desktop App Build Instructions

## Quick Summary
The Electron configuration is ready. You need to build on each target platform:
- **Windows .exe** → Build on Windows
- **Mac .dmg** → Build on Mac  
- **Linux .AppImage** → Already built!

---

## Option A: Build on Your Mac (for Mac .dmg)

### Prerequisites:
1. Install Node.js: https://nodejs.org (v18 or higher)
2. Install Yarn: `npm install -g yarn`

### Steps:
1. Download the frontend folder from this project
2. Open Terminal and navigate to the frontend folder
3. Run these commands:

```bash
# Install dependencies
yarn install

# Build Mac app
yarn electron:build:mac
```

4. Find your .dmg file in: `dist-electron/ESTABLISHED-0.1.0.dmg`
5. Double-click to install!

---

## Option B: Build on Windows (for Windows .exe)

### Prerequisites:
1. Install Node.js: https://nodejs.org (v18 or higher)
2. Install Yarn: `npm install -g yarn`

### Steps:
1. Download the frontend folder from this project
2. Open Command Prompt/PowerShell and navigate to the frontend folder
3. Run these commands:

```bash
# Install dependencies
yarn install

# Build Windows app
yarn electron:build:win
```

4. Find your installer in: `dist-electron/ESTABLISHED Setup 0.1.0.exe`
5. Run the installer!

---

## Important: Update the Production URL

Before building, update the URL in `electron/main.js`:

```javascript
// Change this line to your deployed production URL:
const PRODUCTION_URL = 'https://YOUR-DEPLOYED-URL.emergentagent.com';
```

---

## What You Get:
- Desktop app icon on your desktop/dock
- Native window (no browser toolbar)
- Keyboard shortcuts (Cmd+C, Cmd+V, etc.)
- Application menu
- Works with your production server

---

## Files Included:
- `electron/main.js` - Main Electron process
- `package.json` - Build configuration
- `public/icon-512x512.png` - App icon

