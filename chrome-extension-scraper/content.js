// Design Ready Product Scraper - Content Script
// This script runs in the context of web pages
// Version 2.3 - Tracks last project URL

console.log('🛒 Design Ready Scraper loaded on:', window.location.hostname);

// If we're on the Design Ready app, save the current project URL
if (window.location.hostname.includes('emergentagent.com') || 
    window.location.hostname.includes('localhost')) {
  
  // Check if we're on a project page
  if (window.location.pathname.includes('/project/')) {
    // Save this URL so extension can return here
    chrome.storage.local.set({ 
      lastProjectUrl: window.location.href,
      lastProjectTime: Date.now()
    });
    console.log('📍 Saved project URL:', window.location.href);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLastProject') {
    chrome.storage.local.get(['lastProjectUrl', 'lastProjectTime'], (data) => {
      sendResponse(data);
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'scrape') {
    try {
      const data = scrapeCurrentPage();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

function scrapeCurrentPage() {
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
