# Live Checklist Canva App

An interactive checklist that lives inside your Canva designs, syncing with your project management system.

## Features

- ✅ View full project checklist organized by rooms and categories
- ✅ Collapsible rooms and categories for easy navigation
- ✅ Check off items as you add them to designs
- ✅ View item images, prices, and status
- ✅ Open product links directly from Canva
- ✅ Auto-detect items added to designs (Phase 2)
- ✅ Real-time sync with main app (Phase 3)

## Development

### Install Dependencies
```bash
yarn install
```

### Start Development Server
```bash
yarn dev
```

### Build for Production
```bash
yarn build
```

## Usage

1. Open the app in Canva
2. Enter your Project ID (from your main app URL)
3. Click "Connect to Project"
4. Browse and interact with your checklist
5. Items will sync back to your main app

## Project Structure

- `/src/App.tsx` - Main app component
- `/src/components/ChecklistPanel.tsx` - Checklist display and interaction
- `/src/components/DesignMonitor.tsx` - Design scanning and auto-detection

## Next Steps

- Phase 2: Implement auto-detection of items with links
- Phase 3: Add WebSocket for real-time bidirectional sync
