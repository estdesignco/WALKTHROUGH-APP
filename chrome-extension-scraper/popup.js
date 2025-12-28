// Design Ready Product Scraper - Popup Script
// Version 2.8 - Uttermost-specific swatch detection

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

function showStatus(message, type = 'info') {
  statusBar.style.display = 'flex';
  statusBar.className = `status-bar ${type}`;
  const icons = { success: '✅', error: '❌', info: '🔍', warning: '⚠️' };
  statusBar.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
}

function displayResults(data) {
  scrapedData = data;
  emptyState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  if (data.vendor) {
    vendorBadge.textContent = data.vendor;
    vendorBadge.style.display = 'block';
  }
  
  document.getElementById('productName').textContent = data.name || 'Unknown Product';
  document.getElementById('productSku').textContent = data.sku ? `SKU: ${data.sku}` : '';
  
  const priceEl = document.getElementById('productPrice');
  if (data.price) {
    priceEl.textContent = `$${parseFloat(data.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    priceEl.className = 'product-price';
    loginWarning.style.display = 'none';
  } else {
    priceEl.textContent = 'Price not found';
    priceEl.className = 'product-price missing';
    loginWarning.style.display = 'flex';
  }
  
  const imgEl = document.getElementById('productImage');
  if (data.image_url && data.image_url.startsWith('http')) {
    imgEl.src = data.image_url;
    imgEl.style.display = 'block';
  } else {
    imgEl.style.display = 'none';
  }
  
  const finishImgEl = document.getElementById('finishImage');
  const finishImgContainer = document.getElementById('finishImageContainer');
  const finishNameEl = document.getElementById('finishName');
  
  if (data.finish_image && data.finish_image.startsWith('http')) {
    finishImgEl.src = data.finish_image;
    finishImgContainer.style.display = 'flex';
    finishImgContainer.classList.add('visible');
    finishNameEl.textContent = data.finish_color || 'Swatch';
  } else {
    finishImgContainer.style.display = 'none';
  }
  
  document.getElementById('dataVendor').textContent = data.vendor || 'Not found';
  document.getElementById('dataSize').textContent = data.size || 'Not found';
  document.getElementById('dataFinish').textContent = data.finish_color || 'Not found';
  document.getElementById('dataMsrp').textContent = data.msrp ? `$${parseFloat(data.msrp).toLocaleString()}` : 'Not found';
  document.getElementById('dataUrl').textContent = data.url || 'Not found';
}

// The scraping function
function scrapePageData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const bodyText = document.body.innerText || '';
  
  const data = {
    url: url,
    vendor: null,
    name: null,
    sku: null,
    price: null,
    msrp: null,
    size: null,
    finish_color: null,
    finish_image: null,
    image_url: null
  };
  
  // Vendor detection
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
    'gabby.com': 'Gabby'
  };
  
  for (const [domainKey, vendorName] of Object.entries(vendorMap)) {
    if (domain.includes(domainKey.replace('.com', ''))) {
      data.vendor = vendorName;
      break;
    }
  }
  if (!data.vendor) {
    data.vendor = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  }
  
  // Product name
  const h1 = document.querySelector('h1');
  if (h1 && h1.innerText.trim().length > 2 && h1.innerText.trim().length < 200) {
    data.name = h1.innerText.trim();
  }
  if (!data.name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.name = ogTitle.content.split('|')[0].trim();
  }
  
  // SKU
  const skuPatterns = [/SKU[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i, /Item\s*#?[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i];
  for (const pattern of skuPatterns) {
    const match = bodyText.match(pattern);
    if (match) { data.sku = match[1].toUpperCase(); break; }
  }
  if (!data.sku) {
    const urlMatch = url.match(/\/([A-Z0-9][-A-Z0-9]{4,15})(?:[\/?#]|$)/i);
    if (urlMatch) data.sku = urlMatch[1].toUpperCase();
  }
  
  // Price
  let allPrices = [];
  document.querySelectorAll('[class*="price"]').forEach(el => {
    const txt = el.innerText || el.getAttribute('content') || '';
    const matches = txt.match(/\$?\s*([\d,]+\.?\d{0,2})/g);
    if (matches) {
      matches.forEach(m => {
        const val = parseFloat(m.replace(/[$,\s]/g, ''));
        if (val > 10 && val < 500000) allPrices.push(val);
      });
    }
  });
  allPrices = [...new Set(allPrices)].sort((a, b) => a - b);
  if (allPrices.length > 0) {
    data.price = allPrices[0];
    if (allPrices.length > 1) data.msrp = allPrices[allPrices.length - 1];
  }
  
  // Size
  const sizePatterns = [/(\d+\.?\d*)\s*["']?\s*[Ww]\s*[Xx×]\s*(\d+\.?\d*)\s*["']?\s*[Hh]/];
  for (const pattern of sizePatterns) {
    const match = bodyText.match(pattern);
    if (match) { data.size = `${match[1]}" W x ${match[2]}" H`; break; }
  }
  if (!data.size) {
    const dimMatch = bodyText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
    if (dimMatch) data.size = `${dimMatch[1]} W X ${dimMatch[2]} H X ${dimMatch[3]} D`;
  }
  
  // Finish/Color from title
  const commonFinishes = ['Bronze', 'Brass', 'Gold', 'Silver', 'Chrome', 'Nickel', 'Black', 'White', 
    'Natural', 'Oak', 'Walnut', 'Toffee', 'Smoke', 'Gray', 'Grey', 'Antique', 'Leather'];
  if (data.name) {
    for (const finish of commonFinishes) {
      if (data.name.toLowerCase().includes(finish.toLowerCase())) {
        data.finish_color = finish;
        break;
      }
    }
  }
  if (!data.finish_color && data.name && data.name.includes(' - ')) {
    const parts = data.name.split(' - ');
    if (parts.length > 1) {
      const finishPart = parts[parts.length - 1].split(',')[0].trim();
      if (finishPart.length > 1 && finishPart.length < 30) {
        data.finish_color = finishPart;
      }
    }
  }
  
  // Main product image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    data.image_url = ogImage.content;
  }
  if (!data.image_url) {
    const mainImg = document.querySelector('[class*="product-image"] img, [class*="main-image"] img, [class*="gallery"] img');
    if (mainImg && mainImg.src && mainImg.src.startsWith('http')) {
      data.image_url = mainImg.src;
    }
  }
  
  // ===== FINISH/SWATCH IMAGE =====
  
  function getImgSrc(img) {
    return img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
  }
  
  function isNavOrIcon(src) {
    const lower = src.toLowerCase();
    const excludes = ['arrow', 'chevron', 'nav', 'prev', 'next', 'icon', 'logo', 'sprite', 'pixel', 'tracking', 'spacer', 'loader', 'close', 'search', 'cart', 'social'];
    return excludes.some(e => lower.includes(e));
  }
  
  // Find all images that could be swatches (small, not main image, not icons)
  const allImgs = document.querySelectorAll('img');
  const swatchCandidates = [];
  
  for (const img of allImgs) {
    const src = getImgSrc(img);
    if (!src || !src.startsWith('http') || src.startsWith('data:')) continue;
    if (isNavOrIcon(src)) continue;
    if (src === data.image_url) continue; // Skip main product image
    
    const width = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const height = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    
    // Skip very large images (main product) and very small (icons)
    if (width > 300 || height > 300) continue;
    if (width < 30 && width > 0) continue;
    if (height < 30 && height > 0) continue;
    
    // Check context
    const parent = img.closest('div, a, button, li');
    const parentClass = (parent?.className || '').toLowerCase();
    const parentText = (parent?.innerText || '').toLowerCase();
    const grandparent = parent?.parentElement;
    const gpClass = (grandparent?.className || '').toLowerCase();
    const gpText = (grandparent?.innerText || '').toLowerCase();
    
    let score = 0;
    
    // Score based on context
    if (parentClass.includes('swatch') || parentClass.includes('color') || parentClass.includes('option')) score += 20;
    if (gpClass.includes('swatch') || gpClass.includes('color') || gpClass.includes('option')) score += 15;
    if (parentText === 'color' || gpText.includes('color')) score += 10;
    if (src.toLowerCase().includes('swatch') || src.toLowerCase().includes('leather') || src.toLowerCase().includes('fabric')) score += 15;
    
    // Check if selected
    const isSelected = img.classList.contains('selected') || img.classList.contains('active') ||
                       parent?.classList.contains('selected') || parent?.classList.contains('active');
    if (isSelected) score += 30;
    
    // Match color name
    if (data.finish_color) {
      const colorLower = data.finish_color.toLowerCase();
      const alt = (img.alt || '').toLowerCase();
      const title = (img.title || '').toLowerCase();
      if (alt.includes(colorLower) || title.includes(colorLower) || src.toLowerCase().includes(colorLower)) {
        score += 25;
      }
    }
    
    if (score > 0) {
      swatchCandidates.push({ src, score, img });
    }
  }
  
  // Sort by score and take best
  if (swatchCandidates.length > 0) {
    swatchCandidates.sort((a, b) => b.score - a.score);
    data.finish_image = swatchCandidates[0].src;
    console.log('✅ Swatch found:', data.finish_image, 'Score:', swatchCandidates[0].score);
  }
  
  // Fallback: use main image
  if (!data.finish_image && data.image_url) {
    data.finish_image = data.image_url;
    console.log('⚠️ Using main image as swatch fallback');
  }
  
  return data;
}

// Main scrape action
async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>Scraping...</span>';
  showStatus('Extracting product data...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      throw new Error('Please navigate to a product page first');
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageData
    });
    
    const data = results[0].result;
    if (!data || (!data.name && !data.price)) {
      throw new Error('Could not find product data on this page.');
    }
    
    displayResults(data);
    showStatus(data.price ? `Found: ${data.name} - $${data.price}` : `Found: ${data.name}`, data.price ? 'success' : 'warning');
  } catch (error) {
    console.error('Scrape error:', error);
    showStatus(error.message || 'Failed to scrape page', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
}

// Send data to app
async function sendToApp() {
  if (!scrapedData) return;
  
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="spinner"></div><span>Sending...</span>';
  
  try {
    // Cache on server
    try {
      await fetch(`${BACKEND_URL}/api/extension-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapedData)
      });
    } catch (e) {}
    
    // Build URL params
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('source', 'extension');
    if (scrapedData.name) params.set('name', scrapedData.name);
    if (scrapedData.price) params.set('price', scrapedData.price);
    if (scrapedData.sku) params.set('sku', scrapedData.sku);
    if (scrapedData.size) params.set('size', scrapedData.size);
    if (scrapedData.finish_color) params.set('finish', scrapedData.finish_color);
    if (scrapedData.finish_image) params.set('finish_image', scrapedData.finish_image);
    if (scrapedData.vendor) params.set('vendor', scrapedData.vendor);
    if (scrapedData.url) params.set('link', scrapedData.url);
    if (scrapedData.image_url) params.set('image', scrapedData.image_url);
    if (scrapedData.msrp) params.set('msrp', scrapedData.msrp);
    
    // Get last project URL
    let lastProjectUrl = null;
    try {
      const stored = await chrome.storage.local.get('lastProjectUrl');
      lastProjectUrl = stored.lastProjectUrl;
    } catch (e) {}
    
    let appUrl = lastProjectUrl && lastProjectUrl.includes('/project/') 
      ? `${lastProjectUrl.split('?')[0]}?${params.toString()}`
      : `${APP_URL}?${params.toString()}`;
    
    window.open(appUrl, '_blank');
    showStatus('Data sent! Go to checklist and click PASTE.', 'success');
  } catch (error) {
    showStatus('Failed to send', 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<span>🚀</span><span>SEND TO APP</span>';
  }
}

// Copy to clipboard
async function copyToClipboard() {
  if (!scrapedData) return;
  const text = [
    `Product: ${scrapedData.name || 'N/A'}`,
    `Price: ${scrapedData.price ? '$' + scrapedData.price : 'N/A'}`,
    `SKU: ${scrapedData.sku || 'N/A'}`,
    `Vendor: ${scrapedData.vendor || 'N/A'}`,
    `Size: ${scrapedData.size || 'N/A'}`,
    `Finish: ${scrapedData.finish_color || 'N/A'}`,
    `URL: ${scrapedData.url || 'N/A'}`
  ].join('\n');
  
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
    setTimeout(() => { copyBtn.innerHTML = '<span>📋</span><span>Copy All</span>'; }, 2000);
  } catch (e) {}
}

// Event Listeners
scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

// Auto-detect vendor
(async function() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const domain = new URL(tab.url).hostname.replace('www.', '');
      const vendors = { 'uttermost': 'Uttermost', 'visualcomfort': 'Visual Comfort', 'fourhands': 'Four Hands' };
      for (const [key, val] of Object.entries(vendors)) {
        if (domain.includes(key)) { vendorBadge.textContent = val; vendorBadge.style.display = 'block'; break; }
      }
    }
  } catch (e) {}
})();
