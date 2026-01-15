# Design Ready Product Scraper - Chrome Extension

## 📦 Version 7.14.0

This Chrome extension scrapes product data from wholesale vendor websites and sends it directly to your Design Ready app. It works with YOUR logged-in browser session, so it can see the wholesale prices that require authentication.

## ✨ Features

- **One-Click Scraping**: Click the extension icon, then "Scrape" to extract product data
- **See Before You Send**: Review all extracted data in a beautiful table before sending
- **Works With Your Login**: Uses your existing browser session to see wholesale prices
- **22+ Vendors Supported**: Full vendor-specific logic for optimal scraping accuracy
- **Click-to-Select**: Manually override any scraped field by clicking on page elements
- **Swatch Support**: Captures color swatches from CSS background-image styles
- **🆕 Houzz Pro Clipper Integration**: Sync data from Houzz Pro Clipper to reduce double entry!
- **🆕 Quick Paste URL**: Paste any product URL and scrape it without leaving the current page!

## 📋 NEW: Quick Paste URL (v7.14.0)

Copy a product URL to your clipboard, then click **"📋 QUICK PASTE URL"** to instantly scrape that product without navigating to it!

### How it works:
1. Copy any product URL to your clipboard (Ctrl+C / Cmd+C)
2. Open the **Design Ready Scraper** panel on any page
3. Click the **"📋 QUICK PASTE URL"** button
4. The extension will fetch and scrape the product automatically!
5. Review the data and click "Send to App"

This is perfect for:
- Scraping products from emails or documents
- Quick-adding items you've bookmarked
- Batch processing without opening each page

## 🏠 Houzz Pro Clipper Integration (v7.13.0)

If you already use the **Houzz Pro Clipper** to capture product data, you can now sync that data directly into the Design Ready Scraper!

### How it works:
1. Open the **Houzz Pro Clipper** on any product page
2. Let Houzz fill in the product details
3. Open the **Design Ready Scraper** panel
4. Click the **"🏠 SYNC FROM HOUZZ CLIPPER"** button
5. The scraper will pull any data from Houzz and fill in empty fields!

This helps you avoid entering the same product data twice - Houzz for your Houzz Pro library, and Design Ready for your project checklists.

## 🚀 Installation

### Step 1: Download the Extension
1. Download the extension folder (or unzip if provided as .zip)
2. Save it somewhere permanent on your computer (e.g., `Documents/chrome-extension-scraper`)

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the extension folder you downloaded
5. The extension icon should appear in your toolbar!

### Step 3: Pin the Extension (Recommended)
1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Design Ready Product Scraper"
3. Click the pin icon to keep it visible

## 📋 How to Use

### Basic Workflow
1. **Login** to your wholesale vendor account (e.g., Uttermost, Visual Comfort)
2. **Navigate** to a product page
3. **Click** the extension icon in your toolbar
4. **Click** "SCRAPE THIS PAGE" - the extension extracts all data
5. **Review** the data in the popup table
6. **Click** "ADD TO DESIGN READY APP" - opens the app with data pre-filled!

### What Gets Extracted
- ✅ Product Name
- ✅ Price (wholesale/trade)
- ✅ MSRP (if available)
- ✅ SKU/Item Number
- ✅ Size/Dimensions
- ✅ Finish/Color
- ✅ Swatch/Finish Image
- ✅ Product Image
- ✅ Product URL

## 🔧 Supported Vendors (v7.14.0)

| Vendor | Domain | Status |
|--------|--------|--------|
| Four Hands | fourhands.com | ✅ Full Support |
| Uttermost | uttermost.com | ✅ Full Support |
| Global Views | globalviews.com | ✅ Full Support |
| Rowe Furniture | rowefurniture.com | ✅ Full Support |
| Regina Andrew | reginaandrew.com | ✅ Full Support |
| Bernhardt | bernhardt.com | ✅ Full Support |
| Loloi Rugs | loloi.com | ✅ Full Support |
| Visual Comfort | visualcomfort.com | ✅ Full Support |
| HVL Group | hvlgroup.com | ✅ Full Support |
| Vanguard/V&H | vandh.com | ✅ Full Support |
| Flow Decor | flowdecor.com | ✅ Full Support |
| Crestview | crestviewcollection.com | ✅ Full Support |
| Bassett Mirror | bassettmirror.com | ✅ Full Support |
| Eichholtz | eichholtz.com | ✅ Full Support |
| MyOh America | myohamerica.com | ✅ Full Support |
| Safavieh | safavieh.com | ✅ Full Support |
| Surya | surya.com | ✅ Full Support |
| Zee Lighting | zeelighting.com | ✅ Full Support |
| Hubbardton Forge | hubbardtonforge.com | ✅ Full Support |
| Hinkley | hinkley.com | ✅ Full Support |
| Elegant Lighting | elegantlighting.com | ✅ Full Support |
| Gabby | gabby.com | ✅ Full Support |

## ❓ Troubleshooting

### "No price found"
- Make sure you're **logged in** to the vendor website
- Refresh the product page and try again
- Some vendors require you to "Add to Cart" to see prices

### Extension not working?
1. Go to `chrome://extensions/`
2. Find "Design Ready Product Scraper"
3. Click the refresh icon to reload
4. Try scraping again

### Wrong data extracted?
- Use the "Click-to-Select" feature to manually override fields
- Click on the correct element on the page to capture it
- Some vendor websites have unusual layouts

### Houzz Sync not working?
- Make sure the Houzz Pro Clipper modal is **open and visible** on the page
- Both extensions need to be active on the same page
- Try clicking "Sync from Houzz" again after the Houzz clipper has loaded

## 📞 Support

If you have issues, please report:
1. Which vendor website
2. What data was missing or wrong
3. A screenshot of the product page

---

**Version**: 7.13.0  
**Last Updated**: January 2025  
**New in 7.13.0**: Houzz Pro Clipper integration for reduced double data entry