// Design Ready Product Scraper - Popup Script
// Version 2.0 - Enhanced with vendor-specific extraction

const APP_URL = 'https://vendor-bridge-8.preview.emergentagent.com';
const BACKEND_URL = 'https://vendor-bridge-8.preview.emergentagent.com';

let scrapedData = null;

// DOM Elements
const scrapeBtn = document.getElementById('scrapeBtn');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const rescrapeBtn = document.getElementById('rescrapeBtn');
const statusBar = document.getElementById('statusBar');
const emptyState = document.getElementById('emptyState');
const resultsContainer = document.getElementById('resultsContainer');
const vendorBadge = document.getElementById('vendorBadge');
const loginWarning = document.getElementById('loginWarning');

// Show status message
function showStatus(message, type = 'info') {
  statusBar.style.display = 'flex';
  statusBar.className = `status-bar ${type}`;
  
  const icons = { success: '✅', error: '❌', info: '🔍', warning: '⚠️' };
  statusBar.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
}

// Hide status
function hideStatus() {
  statusBar.style.display = 'none';
}

// Display scraped data in the UI
function displayResults(data) {
  scrapedData = data;
  
  // Show results, hide empty state
  emptyState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  // Vendor badge
  if (data.vendor) {
    vendorBadge.textContent = data.vendor;
    vendorBadge.style.display = 'block';
  }
  
  // Product header
  document.getElementById('productName').textContent = data.name || 'Unknown Product';
  document.getElementById('productSku').textContent = data.sku ? `SKU: ${data.sku}` : '';
  
  // Price
  const priceEl = document.getElementById('productPrice');
  if (data.price) {
    priceEl.textContent = `$${parseFloat(data.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    priceEl.className = 'product-price';
    loginWarning.style.display = 'none';
  } else {
    priceEl.textContent = 'Price not found';
    priceEl.className = 'product-price missing';
    loginWarning.style.display = 'flex';
  }
  
  // Image
  const imgEl = document.getElementById('productImage');
  if (data.image_url && !data.image_url.startsWith('data:image/gif')) {
    imgEl.src = data.image_url;
    imgEl.style.display = 'block';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
  }
  
  // Data grid
  setDataValue('dataVendor', data.vendor);
  setDataValue('dataSize', data.size);
  setDataValue('dataFinish', data.finish_color);
  setDataValue('dataMsrp', data.msrp ? `$${parseFloat(data.msrp).toLocaleString()}` : null);
  setDataValue('dataUrl', data.url, true);
}

function setDataValue(id, value, isLink = false) {
  const el = document.getElementById(id);
  if (value) {
    el.textContent = value;
    el.className = isLink ? 'data-value link' : 'data-value';
  } else {
    el.textContent = 'Not found';
    el.className = 'data-value missing';
  }
}

// The scraping function that runs in the page context
function scrapePageData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const bodyText = document.body.innerText || '';
  const bodyHtml = document.body.innerHTML || '';
  
  const data = {
    url: url,
    vendor: null,
    name: null,
    sku: null,
    price: null,
    msrp: null,
    size: null,
    finish_color: null,
    image_url: null,
    finish_image: null
  };
  
  // ======= VENDOR DETECTION =======
  const vendorMap = {
    'uttermost.com': 'Uttermost',
    'visualcomfort.com': 'Visual Comfort',
    'fourhands.com': 'Four Hands',
    'bernhardt.com': 'Bernhardt',
    'reginaandrew.com': 'Regina Andrew',
    'jaipurliving.com': 'Jaipur Living',
    'loloirugs.com': 'Loloi',
    'globalviews.com': 'Global Views',
    'surya.com': 'Surya',
    'gabby.com': 'Gabby',
    'gabbyhome.com': 'Gabby',
    'hvlgroup.com': 'HVL Group',
    'hudsongallery.net': 'Hudson Gallery',
    'currey.com': 'Currey & Company',
    'arteriorshome.com': 'Arteriors',
    'rowefurniture.com': 'Rowe Furniture',
    'crestviewcollection.com': 'Crestview Collection',
    'bassettmirror.com': 'Bassett Mirror',
    'hinkley.com': 'Hinkley',
    'hubbardtonforge.com': 'Hubbardton Forge',
    'elegantlighting.com': 'Elegant Lighting',
    'zeevlighting.com': 'Zeev Lighting'
  };
  
  for (const [domainKey, vendorName] of Object.entries(vendorMap)) {
    if (domain.includes(domainKey.replace('.com', ''))) {
      data.vendor = vendorName;
      break;
    }
  }
  if (!data.vendor) {
    // Try to extract from domain
    const domainPart = domain.split('.')[0];
    data.vendor = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
  }
  
  // ======= PRODUCT NAME =======
  // Try multiple strategies
  const h1 = document.querySelector('h1');
  if (h1 && h1.innerText.trim().length > 2 && h1.innerText.trim().length < 200) {
    data.name = h1.innerText.trim();
  }
  if (!data.name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.name = ogTitle.content.split('|')[0].trim();
  }
  if (!data.name) {
    const titleEl = document.querySelector('[class*="product-title"], [class*="productTitle"], [class*="product-name"], .pdp-title');
    if (titleEl) data.name = titleEl.innerText.trim();
  }
  
  // ======= SKU EXTRACTION =======
  const skuSelectors = [
    '[class*="sku"]', '[class*="SKU"]', '[class*="item-number"]', 
    '[class*="product-id"]', '[class*="model-number"]',
    '[data-sku]', '[itemprop="sku"]'
  ];
  for (const sel of skuSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const txt = el.innerText || el.getAttribute('data-sku') || el.getAttribute('content');
      if (txt) {
        const match = txt.match(/([A-Z0-9][-A-Z0-9]{2,20})/i);
        if (match) {
          data.sku = match[1].toUpperCase();
          break;
        }
      }
    }
  }
  // Fallback: regex on body text
  if (!data.sku) {
    const skuPatterns = [
      /SKU[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i,
      /Item\s*(?:#|Number)?[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i,
      /Model[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i,
      /Product\s*(?:Code|ID)[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i
    ];
    for (const pattern of skuPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        data.sku = match[1].toUpperCase();
        break;
      }
    }
  }
  // Extract from URL if still not found
  if (!data.sku) {
    const urlMatch = url.match(/\/([A-Z0-9][-A-Z0-9]{4,15})(?:[\/?#]|$)/i);
    if (urlMatch) data.sku = urlMatch[1].toUpperCase();
  }
  
  // ======= PRICE EXTRACTION =======
  // Strategy: Find all prices, pick the lowest valid one (usually wholesale)
  const priceSelectors = [
    '[class*="price"]:not([class*="compare"]):not([class*="msrp"]):not([class*="retail"])',
    '[class*="cost"]', '[class*="wholesale"]', '[class*="trade-price"]',
    '[itemprop="price"]', '[data-price]', '.pdp-price'
  ];
  
  let allPrices = [];
  
  // From specific elements
  for (const sel of priceSelectors) {
    const els = document.querySelectorAll(sel);
    els.forEach(el => {
      const txt = el.innerText || el.getAttribute('content') || el.getAttribute('data-price');
      if (txt) {
        const matches = txt.match(/\$?\s*([\d,]+\.?\d{0,2})/g);
        if (matches) {
          matches.forEach(m => {
            const val = parseFloat(m.replace(/[$,\s]/g, ''));
            if (val > 10 && val < 500000) allPrices.push(val);
          });
        }
      }
    });
  }
  
  // From body text (excluding CSS/JS)
  const textContent = Array.from(document.querySelectorAll('p, span, div, td, li'))
    .filter(el => {
      const tag = el.tagName.toLowerCase();
      return !el.closest('script') && !el.closest('style') && !el.closest('noscript');
    })
    .map(el => el.innerText)
    .join(' ');
  
  const priceMatches = textContent.match(/\$\s*([\d,]+\.\d{2})/g) || [];
  priceMatches.forEach(m => {
    const val = parseFloat(m.replace(/[$,\s]/g, ''));
    if (val > 10 && val < 500000) allPrices.push(val);
  });
  
  // Sort and pick
  allPrices = [...new Set(allPrices)].sort((a, b) => a - b);
  if (allPrices.length > 0) {
    data.price = allPrices[0]; // Lowest = wholesale/trade
    if (allPrices.length > 1) {
      data.msrp = allPrices[allPrices.length - 1]; // Highest = MSRP
    }
  }
  
  // ======= SIZE / DIMENSIONS =======
  const sizeSelectors = [
    '[class*="dimension"]', '[class*="size"]', '[class*="spec"]',
    '[itemprop="width"]', '[itemprop="height"]'
  ];
  for (const sel of sizeSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText) {
      const txt = el.innerText.trim();
      if (txt.match(/\d/) && txt.length < 100) {
        data.size = txt;
        break;
      }
    }
  }
  if (!data.size) {
    const sizePatterns = [
      /(\d+\.?\d*)\s*["']?\s*[Ww]\s*[Xx×]\s*(\d+\.?\d*)\s*["']?\s*[Dd]?\s*[Xx×]?\s*(\d+\.?\d*)?\s*["']?\s*[Hh]?/,
      /(\d+\.?\d*)\s*["']?\s*[Hh]\s*[Xx×]\s*(\d+\.?\d*)\s*["']?\s*[Ww]\s*[Xx×]?\s*(\d+\.?\d*)?\s*["']?\s*[Dd]?/,
      /Dimensions?[:\s]+([^\n]{5,60})/i,
      /Size[:\s]+([^\n]{5,60})/i,
      /(\d+)\s*["']?\s*[Ww]\s*[Xx×]\s*(\d+)\s*["']?\s*[Hh]/
    ];
    for (const pattern of sizePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        if (match[3]) {
          data.size = `${match[1]}" W x ${match[2]}" D x ${match[3]}" H`;
        } else if (match[2]) {
          data.size = `${match[1]}" x ${match[2]}"`;
        } else if (match[1]) {
          data.size = match[1].trim();
        }
        if (data.size) break;
      }
    }
  }
  
  // ======= FINISH / COLOR =======
  const finishSelectors = [
    '[class*="finish"]', '[class*="color"]', '[class*="variant"]',
    '[class*="selected-option"]', '[data-finish]'
  ];
  for (const sel of finishSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText) {
      const txt = el.innerText.trim();
      if (txt.length > 2 && txt.length < 60 && !txt.match(/^\$/)) {
        data.finish_color = txt;
        break;
      }
    }
  }
  if (!data.finish_color) {
    const finishPatterns = [
      /Finish[:\s]+([^\n,]{3,40})/i,
      /Color[:\s]+([^\n,]{3,40})/i,
      /Material[:\s]+([^\n,]{3,40})/i
    ];
    for (const pattern of finishPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        data.finish_color = match[1].trim();
        break;
      }
    }
  }
  
  // ======= IMAGES =======
  // Main product image
  const imgSelectors = [
    '[class*="product-image"] img', '[class*="gallery"] img:first-child',
    '[class*="main-image"] img', '.pdp-image img', '[itemprop="image"]',
    'meta[property="og:image"]'
  ];
  for (const sel of imgSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const src = el.src || el.getAttribute('content') || el.getAttribute('href');
      if (src && src.startsWith('http') && !src.includes('placeholder') && !src.startsWith('data:')) {
        data.image_url = src;
        break;
      }
    }
  }
  if (!data.image_url) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) data.image_url = ogImage.content;
  }
  
  // Finish/Swatch image
  const swatchSelectors = [
    '[class*="swatch"] img', '[class*="finish-image"] img',
    '[class*="color-swatch"]', '[class*="thumbnail"] img'
  ];
  for (const sel of swatchSelectors) {
    const el = document.querySelector(sel);
    if (el && el.src && el.src.startsWith('http')) {
      data.finish_image = el.src;
      break;
    }
  }
  
  return data;
}

// Main scrape action
async function doScrape() {
  const originalText = scrapeBtn.innerHTML;
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>Scraping...</span>';
  showStatus('Extracting product data...', 'info');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      throw new Error('Please navigate to a product page first');
    }
    
    // Execute scraping script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageData
    });
    
    const data = results[0].result;
    
    if (!data || (!data.name && !data.price)) {
      throw new Error('Could not find product data on this page. Make sure you\'re on a product detail page.');
    }
    
    // Display results
    displayResults(data);
    
    // Show success status
    if (data.price) {
      showStatus(`Found: ${data.name} - $${data.price}`, 'success');
    } else {
      showStatus(`Found: ${data.name} (no price - login required?)`, 'warning');
    }
    
  } catch (error) {
    console.error('Scrape error:', error);
    showStatus(error.message || 'Failed to scrape page', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = originalText;
  }
}

// Send data to app
async function sendToApp() {
  if (!scrapedData) return;
  
  const originalText = sendBtn.innerHTML;
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="spinner"></div><span>Sending...</span>';
  
  try {
    // Cache data on server (optional, for backup)
    try {
      await fetch(`${BACKEND_URL}/api/extension-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapedData)
      });
    } catch (e) {
      console.warn('Could not cache on server:', e);
    }
    
    // Build URL with all parameters
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('source', 'extension');
    if (scrapedData.name) params.set('name', scrapedData.name);
    if (scrapedData.price) params.set('price', scrapedData.price);
    if (scrapedData.sku) params.set('sku', scrapedData.sku);
    if (scrapedData.size) params.set('size', scrapedData.size);
    if (scrapedData.finish_color) params.set('finish', scrapedData.finish_color);
    if (scrapedData.vendor) params.set('vendor', scrapedData.vendor);
    if (scrapedData.url) params.set('link', scrapedData.url);
    if (scrapedData.image_url) params.set('image', scrapedData.image_url);
    if (scrapedData.msrp) params.set('msrp', scrapedData.msrp);
    
    // Open app in new tab with data
    const appUrl = `${APP_URL}?${params.toString()}`;
    window.open(appUrl, '_blank');
    
    showStatus('App opened with product data!', 'success');
    
  } catch (error) {
    console.error('Send error:', error);
    showStatus('Failed to send to app', 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalText;
  }
}

// Copy all data to clipboard
async function copyToClipboard() {
  if (!scrapedData) return;
  
  const text = [
    `Product: ${scrapedData.name || 'N/A'}`,
    `Price: ${scrapedData.price ? '$' + scrapedData.price : 'N/A'}`,
    `MSRP: ${scrapedData.msrp ? '$' + scrapedData.msrp : 'N/A'}`,
    `SKU: ${scrapedData.sku || 'N/A'}`,
    `Vendor: ${scrapedData.vendor || 'N/A'}`,
    `Size: ${scrapedData.size || 'N/A'}`,
    `Finish/Color: ${scrapedData.finish_color || 'N/A'}`,
    `URL: ${scrapedData.url || 'N/A'}`
  ].join('\n');
  
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
    setTimeout(() => {
      copyBtn.innerHTML = '<span>📋</span><span>Copy All</span>';
    }, 2000);
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

// Event Listeners
scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

// Auto-detect vendor on popup open
(async function detectVendor() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const domain = new URL(tab.url).hostname.replace('www.', '');
      const vendorMap = {
        'uttermost': 'Uttermost', 'visualcomfort': 'Visual Comfort',
        'fourhands': 'Four Hands', 'bernhardt': 'Bernhardt',
        'jaipurliving': 'Jaipur Living', 'loloirugs': 'Loloi',
        'reginaandrew': 'Regina Andrew', 'globalviews': 'Global Views'
      };
      for (const [key, val] of Object.entries(vendorMap)) {
        if (domain.includes(key)) {
          vendorBadge.textContent = val;
          vendorBadge.style.display = 'block';
          break;
        }
      }
    }
  } catch (e) {}
})();