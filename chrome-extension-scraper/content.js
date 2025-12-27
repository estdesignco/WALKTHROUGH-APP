// ONE CLICK: Scrape + Open App with data pre-filled
// No copy/paste, no extra steps

const BACKEND_URL = 'https://designready-1.preview.emergentagent.com';
const APP_URL = 'https://designready-1.preview.emergentagent.com';

console.log('🛒 Product Scraper loaded');

function scrapeProductData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '');
  
  const data = {
    url: url,
    vendor: getVendorName(domain),
    name: null,
    sku: null,
    price: null,
    size: null,
    finish_color: null,
    image_url: null
  };
  
  const bodyText = document.body.innerText || '';
  
  // Get name from H1
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  
  // Get price - find ALL dollar amounts and pick the lowest (wholesale)
  const priceMatches = bodyText.match(/\$\s*([\d,]+(?:\.\d{2})?)/g) || [];
  if (priceMatches.length > 0) {
    const prices = priceMatches
      .map(p => parseFloat(p.replace(/[$,\s]/g, '')))
      .filter(p => p > 10 && p < 100000)
      .sort((a, b) => a - b);
    if (prices.length > 0) data.price = prices[0];
  }
  
  // Get SKU
  const skuMatch = bodyText.match(/SKU[:\s]*([A-Z0-9-]+)/i) ||
                   bodyText.match(/Item[:\s#]*([A-Z0-9-]+)/i);
  if (skuMatch) data.sku = skuMatch[1];
  
  // Get size
  const sizeMatch = bodyText.match(/(\d+\.?\d*)\s*[HhWwDd]\s*[Xx×]\s*(\d+\.?\d*)/);
  if (sizeMatch) data.size = sizeMatch[0];
  
  // Get finish/color  
  const finishMatch = bodyText.match(/Finish[:\s]*([^\n,]{3,50})/i);
  if (finishMatch) data.finish_color = finishMatch[1].trim();
  
  // Get image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) data.image_url = ogImage.content;
  
  return data;
}

function getVendorName(domain) {
  const map = {
    'uttermost': 'Uttermost',
    'visualcomfort': 'Visual Comfort', 
    'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt',
    'jaipurliving': 'Jaipur Living',
    'loloirugs': 'Loloi'
  };
  for (const [key, val] of Object.entries(map)) {
    if (domain.includes(key)) return val;
  }
  return domain.split('.')[0];
}

async function scrapeAndOpenApp() {
  const data = scrapeProductData();
  
  // Send to backend to cache
  try {
    await fetch(`${BACKEND_URL}/api/extension-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('Failed to cache:', e);
  }
  
  // Open app with data in URL params - app will read these and populate form
  const params = new URLSearchParams();
  params.set('action', 'add-item');
  if (data.name) params.set('name', data.name);
  if (data.price) params.set('price', data.price);
  if (data.sku) params.set('sku', data.sku);
  if (data.size) params.set('size', data.size);
  if (data.finish_color) params.set('finish', data.finish_color);
  if (data.vendor) params.set('vendor', data.vendor);
  if (data.url) params.set('link', data.url);
  if (data.image_url) params.set('image', data.image_url);
  
  // Open app in new tab with pre-filled data
  const appUrlWithData = `${APP_URL}?${params.toString()}`;
  window.open(appUrlWithData, '_blank');
  
  return data;
}

// Show notification
function showNotification(msg, type) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 15px 25px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white; border-radius: 8px; font-family: sans-serif;
    font-size: 14px; font-weight: 500; z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeAndOpen') {
    const data = scrapeAndOpenApp();
    showNotification(`✅ Price: $${data.price || 'N/A'} - Opening app...`, 'success');
    sendResponse({ success: true, data });
  }
  return true;
});

window.scrapeAndOpenApp = scrapeAndOpenApp;
