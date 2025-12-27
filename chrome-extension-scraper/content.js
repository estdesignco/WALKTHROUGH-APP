// Content script - scrapes product data from the USER'S logged-in browser
// ONE CLICK = Scrape + Send to App (no extra steps)

const BACKEND_URL = 'https://designready-1.preview.emergentagent.com';

console.log('🛒 Product Scraper loaded on:', window.location.href);

// Extract product data from the current page
function scrapeProductData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '');
  
  console.log('🔍 Scraping product data from:', domain);
  
  const data = {
    url: url,
    vendor: getVendorName(domain),
    name: null,
    sku: null,
    price: null,
    size: null,
    finish_color: null,
    image_url: null,
    msrp: null
  };
  
  const bodyText = document.body.innerText || '';
  
  // === VENDOR-SPECIFIC EXTRACTION ===
  if (domain.includes('uttermost')) {
    data.name = extractText('h1') || extractMeta('og:title');
    data.sku = extractPattern(bodyText, /SKU[:\s]*(\d+)/i) || extractFromUrl(/[-\/](\d{5})/);
    data.price = extractUttermostPrice(bodyText);
    data.msrp = extractPattern(bodyText, /Suggested retail price[:\s]*\$?([\d,]+)/i);
    data.size = extractPattern(bodyText, /Dimensions[:\s]*([^\n]+)/i) || 
                extractPattern(bodyText, /(\d+\.?\d*)\s*W\s*X\s*(\d+\.?\d*)\s*H\s*X\s*(\d+\.?\d*)\s*D/i);
    data.finish_color = extractPattern(bodyText, /Finish[:\s]*([^\n,]+)/i);
    data.image_url = extractMeta('og:image') || extractFirstImage();
  } 
  else if (domain.includes('visualcomfort')) {
    data.name = extractText('h1.product-name, h1');
    data.sku = extractPattern(bodyText, /SKU[:\s]*([A-Z0-9-]+)/i);
    data.price = extractFirstPrice(bodyText);
    data.size = extractPattern(bodyText, /Dimensions[:\s]*([^\n]+)/i);
    data.finish_color = extractPattern(bodyText, /Finish[:\s]*([^\n,]+)/i);
    data.image_url = extractMeta('og:image');
  }
  else if (domain.includes('fourhands')) {
    data.name = extractText('h1');
    data.sku = extractPattern(bodyText, /Item[:\s#]*([A-Z0-9-]+)/i) || extractFromUrl(/product\/([^\/]+)/);
    data.price = extractFirstPrice(bodyText);
    data.size = extractPattern(bodyText, /(\d+\.?\d*)"?\s*[Ww]\s*[Xx×]\s*(\d+\.?\d*)"?\s*[Dd]\s*[Xx×]\s*(\d+\.?\d*)"?\s*[Hh]/);
    data.finish_color = extractPattern(bodyText, /Finish[:\s]*([^\n,]+)/i);
    data.image_url = extractMeta('og:image');
  }
  else {
    // Generic extraction for other vendors
    data.name = extractText('h1') || extractMeta('og:title');
    data.sku = extractPattern(bodyText, /SKU[:\s]*([A-Z0-9-]+)/i) || 
               extractPattern(bodyText, /Item[:\s#]*([A-Z0-9-]+)/i) ||
               extractFromUrl(/[-\/]([A-Z]?\d{4,6}[-A-Z0-9]*)/i);
    data.price = extractFirstPrice(bodyText);
    data.size = extractPattern(bodyText, /Dimensions?[:\s]*([^\n]+)/i) ||
                extractPattern(bodyText, /Size[:\s]*([^\n]+)/i);
    data.finish_color = extractPattern(bodyText, /Finish[:\s]*([^\n,]+)/i) ||
                        extractPattern(bodyText, /Color[:\s]*([^\n,]+)/i);
    data.image_url = extractMeta('og:image') || extractFirstImage();
  }
  
  // Clean up size if it's a match array
  if (data.size && typeof data.size === 'object') {
    data.size = `${data.size[1]}W x ${data.size[2]}H x ${data.size[3] || ''}D`.trim();
  }
  
  console.log('📦 Scraped data:', data);
  return data;
}

// Helper functions
function extractText(selector) {
  const el = document.querySelector(selector);
  return el ? el.innerText.trim() : null;
}

function extractMeta(property) {
  const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  return el ? el.content : null;
}

function extractPattern(text, pattern) {
  const match = text.match(pattern);
  return match ? (match[1] || match[0]).trim() : null;
}

function extractFromUrl(pattern) {
  const match = window.location.href.match(pattern);
  return match ? match[1] : null;
}

function extractFirstImage() {
  const imgs = document.querySelectorAll('img[src*="product"], img.product-image, .gallery img');
  return imgs.length > 0 ? imgs[0].src : null;
}

function extractUttermostPrice(text) {
  // Uttermost shows wholesale price first, then "Suggested retail price"
  // Look for dollar amount that's NOT after "Suggested retail"
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('suggested retail')) continue;
    const priceMatch = line.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }
  }
  return null;
}

function extractFirstPrice(text) {
  const prices = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/g) || [];
  if (prices.length === 0) return null;
  
  // Convert to numbers and get the lowest (usually wholesale)
  const numPrices = prices.map(p => parseFloat(p.replace(/[$,]/g, '')))
                          .filter(p => p > 10 && p < 100000)
                          .sort((a, b) => a - b);
  
  return numPrices.length > 0 ? numPrices[0] : null;
}

function getVendorName(domain) {
  const vendorMap = {
    'uttermost.com': 'Uttermost',
    'visualcomfort.com': 'Visual Comfort',
    'fourhands.com': 'Four Hands',
    'bernhardt.com': 'Bernhardt',
    'reginaandrew.com': 'Regina Andrew',
    'loloirugs.com': 'Loloi',
    'jaipurliving.com': 'Jaipur Living',
    'globalviews.com': 'Global Views',
    'surya.com': 'Surya',
    'gabby.com': 'Gabby'
  };
  
  for (const [key, value] of Object.entries(vendorMap)) {
    if (domain.includes(key.replace('.com', ''))) return value;
  }
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

// Send data to app automatically
async function sendToApp(data) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/extension-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('✅ Data sent to app successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to send data:', response.status);
      return { success: false, error: `Server error: ${response.status}` };
    }
  } catch (e) {
    console.error('❌ Error sending data:', e);
    return { success: false, error: e.message };
  }
}

// ONE CLICK: Scrape + Send + Open App
async function scrapeAndSend() {
  const data = scrapeProductData();
  const result = await sendToApp(data);
  
  if (result.success) {
    // Open the app in a new tab with the data pre-filled
    const appUrl = `${BACKEND_URL}?scraped=true&url=${encodeURIComponent(data.url)}`;
    
    // Show success notification
    showNotification('✅ Product scraped! Price: $' + (data.price || 'N/A'), 'success');
  } else {
    showNotification('❌ Failed to send: ' + result.error, 'error');
  }
  
  return { ...result, data };
}

// Show a notification on the page
function showNotification(message, type = 'info') {
  const existing = document.getElementById('scraper-notification');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'scraper-notification';
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  div.textContent = message;
  document.body.appendChild(div);
  
  // Add animation style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  setTimeout(() => div.remove(), 4000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeAndSend') {
    scrapeAndSend().then(result => sendResponse(result));
    return true; // Keep channel open for async response
  }
  if (request.action === 'scrapeOnly') {
    const data = scrapeProductData();
    sendResponse({ success: true, data });
  }
});

// Expose for debugging
window.scrapeProductData = scrapeProductData;
window.scrapeAndSend = scrapeAndSend;

console.log('✅ Product Scraper ready! Click extension icon to scrape.');
