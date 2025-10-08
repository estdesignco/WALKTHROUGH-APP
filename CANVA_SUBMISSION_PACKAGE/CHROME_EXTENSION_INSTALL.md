# 🔌 CHROME EXTENSION INSTALLATION GUIDE

## ⚠️ IMPORTANT NOTE

The Chrome Extension approach has **limited effectiveness** due to Canva's internal DOM structure. The **PDF Import method** is more reliable for extracting product links from Canva boards.

However, if you still want to use the extension, follow these instructions:

---

## 📦 INSTALLATION STEPS

### Step 1: Locate the Extension Folder
The extension is in: `/CHROME_EXTENSION/`

### Step 2: Open Chrome Extensions
1. Open Google Chrome
2. Type in address bar: `chrome://extensions/`
3. Press Enter

### Step 3: Enable Developer Mode
1. Toggle "Developer mode" ON (top right corner)

### Step 4: Load Unpacked Extension
1. Click "Load unpacked"
2. Navigate to `/CHROME_EXTENSION/` folder
3. Click "Select Folder"

### Step 5: Verify Installation
1. Extension icon should appear in Chrome toolbar
2. Name: "Interior Design Canva Scanner"
3. Version: 2.2.0

---

## 🎯 HOW TO USE

### Step 1: Open Canva Design
1. Go to https://www.canva.com
2. Open a design with product images/links

### Step 2: Click Extension Icon
1. Click the extension icon in toolbar
2. Popup will show scan options

### Step 3: Start Scan
1. Click "Scan This Page"
2. Wait for scan to complete
3. Results will show found links

### Step 4: Review Results
1. See how many links found
2. Review detected vendors
3. Choose import option

### Step 5: Import to Checklist
1. Select target project
2. Select target room
3. Click "Import All"
4. Wait for processing

---

## ⚙️ CONFIGURATION

### Update Backend URL

If using a different backend, update in `popup.js`:

```javascript
const BACKEND_URL = 'https://your-backend-url.com';
```

### Customize Trade Vendors

Add/remove vendors in `content.js`:

```javascript
const KNOWN_TRADE_VENDORS = [
  'fourhands.com',
  'safavieh.com',
  'arteriorshome.com',
  // Add more...
];
```

---

## 🐛 TROUBLESHOOTING

### No Links Found
**Reason**: Canva stores links in internal data structure
**Solution**: Use PDF export method instead

### Extension Not Loading
**Check**:
1. Developer mode enabled?
2. Correct folder selected?
3. manifest.json present?
4. No JSON syntax errors?

### Can't Click Scan Button
**Check**:
1. On Canva.com page?
2. Design fully loaded?
3. Console errors?

### Import Fails
**Check**:
1. Backend URL correct?
2. Backend running?
3. Valid project/room selected?
4. Network connection active?

---

## 🔄 ALTERNATIVE: PDF IMPORT METHOD (RECOMMENDED)

### Why Better:
✅ More reliable
✅ Extracts all links
✅ Better accuracy
✅ Simpler workflow

### How to Use:
1. In Canva: File → Download → PDF
2. In your app: Click "Import from PDF"
3. Upload the PDF file
4. Select project and room
5. System extracts and imports all links
6. Products scraped automatically

---

## 📝 KNOWN LIMITATIONS

1. **DOM Access**: Canva's structure hides embedded links
2. **Dynamic Loading**: Content loads asynchronously
3. **Image Links**: Links within images not accessible
4. **Shadow DOM**: Some elements in shadow DOM
5. **Detection Rate**: ~10-20% success rate

---

## 🚀 FUTURE IMPROVEMENTS

### Potential Solutions:
1. **Canva API Integration**: Official API access
2. **AI Image Recognition**: Detect brands from images
3. **Manual Link Entry**: Bulk paste interface
4. **Browser Automation**: Headless browser scraping

---

## 📞 SUPPORT

If you encounter issues:
1. Check console for errors (F12)
2. Review network tab for API calls
3. Verify backend connectivity
4. Try PDF import method instead

---

**Recommendation: Use PDF Import for production workflows!**
