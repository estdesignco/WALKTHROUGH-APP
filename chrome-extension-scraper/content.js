// Design Ready Product Scraper - Content Script
// This script runs in the context of web pages
// Version 2.0

console.log('🛒 Design Ready Scraper loaded on:', window.location.hostname);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      const data = scrapeCurrentPage();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});

function scrapeCurrentPage() {
  // This is a fallback - the main scraping is done via executeScript in popup.js
  // This allows the extension to work even if scripting fails
  return {
    url: window.location.href,
    title: document.title,
    vendor: detectVendor()
  };
}

function detectVendor() {
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const vendorMap = {
    'uttermost': 'Uttermost',
    'visualcomfort': 'Visual Comfort',
    'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt',
    'jaipurliving': 'Jaipur Living',
    'loloirugs': 'Loloi'
  };
  
  for (const [key, val] of Object.entries(vendorMap)) {
    if (domain.includes(key)) return val;
  }
  return domain.split('.')[0];
}