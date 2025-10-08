# 🎨 Interior Design Canva Scanner - Chrome Extension

## What It Does

This Chrome extension automatically scans your Canva mood boards for product images with links and adds them to your Interior Design checklist with smart categorization.

---

## Installation

### Step 1: Download the Extension
The extension files are located in `/app/chrome-extension/`

### Step 2: Load in Chrome
1. Open Chrome and go to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `/app/chrome-extension/` folder
5. The extension icon should appear in your toolbar

---

## How to Use

### Step 1: Open Your Canva Board
1. Go to Canva.com
2. Open the mood board you want to scan (e.g., your JOHNSON room board)
3. Make sure all product images have their links attached

### Step 2: Open the Extension
1. Click the extension icon in your Chrome toolbar
2. You'll see the "Canva Board Scanner" popup

### Step 3: Connect Your Project
1. Enter your **Project ID** (from your Interior Design app)
2. Click **"Load Project"**
3. Select the **Room** you want to add items to (e.g., "JOHNSON")

### Step 4: Scan & Import
1. Click **"🔍 Scan Canva Board"**
2. Watch the status log as it:
   - Finds all images with product links
   - Scrapes each product URL
   - Smart categorizes (Lighting, Furniture, Decor, etc.)
   - Adds to your checklist
3. Done! Check your main app to see all items added

---

## Features

✅ **Auto-Detection**: Finds all images with product links on your Canva page
✅ **Smart Categorization**: Automatically sorts items by type
✅ **Bulk Import**: Process entire mood boards in one click
✅ **Real-time Status**: See exactly what's happening
✅ **Error Handling**: Shows which items succeeded/failed

---

## Supported Vendors

The scanner recognizes links from:
- Houzz
- West Elm
- CB2
- Pottery Barn
- Crate & Barrel
- Wayfair
- Anthropologie
- Restoration Hardware

---

## Tips

💡 **Attach Links to Images**: In Canva, right-click image → Link → paste product URL
💡 **One Board at a Time**: Scan each room's board separately
💡 **Check Results**: After scanning, open your main app to verify items were added
💡 **Save Settings**: The extension remembers your Project ID

---

## Troubleshooting

**Q: Extension says "No images with links found"**
A: Make sure your product images in Canva have links attached

**Q: Some products failed to import**
A: Check the status log for specific errors. Some websites may block scraping.

**Q: Wrong categories**
A: The smart categorization uses keywords. You can manually move items in the main app.

---

## How It Works

1. **Content Script** scans the Canva page DOM for images with links
2. **Popup** provides the UI and orchestrates the scanning
3. **Backend API** scrapes product data from each URL
4. **Smart Algorithm** categorizes items based on product name
5. **Database** stores everything in your checklist

---

## Development

Built with:
- Chrome Extension Manifest V3
- Vanilla JavaScript
- Canva page DOM scanning
- Interior Design API integration

---

Need help? Contact support or check the main app documentation.