# Product Price Scraper Extension

This Chrome extension scrapes product data (including PRICES) from your logged-in wholesale vendor browser sessions.

## Why This Extension Exists

Wholesale vendors like Uttermost, Visual Comfort, and Bernhardt require login to see prices. When you're logged in on your browser, you can see the prices - but the server-side scraper can't access your session.

This extension runs IN YOUR BROWSER, so it can see everything you see - including prices!

## How to Install

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this folder (`chrome-extension-scraper`)
5. The extension icon should appear in your toolbar

## How to Use

1. Navigate to a product page on any supported vendor (Uttermost, Visual Comfort, etc.)
2. Make sure you're LOGGED IN (you should see prices)
3. Click the extension icon
4. Click "Scrape This Page"
5. The extension will extract: Name, Price, SKU, Size, Finish
6. Click "Copy Price" to copy just the price
7. Click "Send to App" to send all data to the app

## Supported Vendors

- Uttermost
- Visual Comfort
- Bernhardt
- Regina Andrew
- HVL Group
- Loloi Rugs
- Global Views
- Surya
- Four Hands
- Jaipur Living

## Troubleshooting

- **No price found?** Make sure you're logged in on the vendor website
- **Extension not working?** Try refreshing the product page
- **Wrong price?** The extension picks the lowest price on the page (usually trade/wholesale)
