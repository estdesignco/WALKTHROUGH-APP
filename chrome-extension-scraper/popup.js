// Design Ready Product Scraper - Popup Script
// Version 2.1 - Enhanced with finish_image extraction and direct row targeting

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
  
  // Main product image
  const imgEl = document.getElementById('productImage');
  if (data.image_url && !data.image_url.startsWith('data:image/gif')) {
    imgEl.src = data.image_url;
    imgEl.style.display = 'block';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
  }
  
  // Finish swatch image
  const finishImgEl = document.getElementById('finishImage');
  const finishImgContainer = document.getElementById('finishImageContainer');
  if (data.finish_image && !data.finish_image.startsWith('data:image/gif')) {
    finishImgEl.src = data.finish_image;
    finishImgContainer.style.display = 'block';
  } else {
    finishImgContainer.style.display = 'none';
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
    finish_image: null,  // CRITICAL: Swatch image URL
    image_url: null
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
    const domainPart = domain.split('.')[0];
    data.vendor = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
  }
  
  // ======= PRODUCT NAME =======
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
  if (!data.sku) {
    const urlMatch = url.match(/\/([A-Z0-9][-A-Z0-9]{4,15})(?:[\/?#]|$)/i);
    if (urlMatch) data.sku = urlMatch[1].toUpperCase();
  }
  
  // ======= PRICE EXTRACTION =======
  const priceSelectors = [
    '[class*="price"]:not([class*="compare"]):not([class*="msrp"]):not([class*="retail"])',
    '[class*="cost"]', '[class*="wholesale"]', '[class*="trade-price"]',
    '[itemprop="price"]', '[data-price]', '.pdp-price'
  ];
  
  let allPrices = [];
  
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
  
  const textContent = Array.from(document.querySelectorAll('p, span, div, td, li'))
    .filter(el => !el.closest('script') && !el.closest('style') && !el.closest('noscript'))
    .map(el => el.innerText)
    .join(' ');
  
  const priceMatches = textContent.match(/\$\s*([\d,]+\.\d{2})/g) || [];
  priceMatches.forEach(m => {
    const val = parseFloat(m.replace(/[$,\s]/g, ''));
    if (val > 10 && val < 500000) allPrices.push(val);
  });
  
  allPrices = [...new Set(allPrices)].sort((a, b) => a - b);
  if (allPrices.length > 0) {
    data.price = allPrices[0];
    if (allPrices.length > 1) {
      data.msrp = allPrices[allPrices.length - 1];
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
  // VENDOR-SPECIFIC extraction for better accuracy
  
  // Try to extract from product title first (often contains finish like "Bronze", "Brass", etc.)
  const commonFinishes = ['Bronze', 'Brass', 'Gold', 'Silver', 'Chrome', 'Nickel', 'Black', 'White', 
    'Natural', 'Oak', 'Walnut', 'Mahogany', 'Gray', 'Grey', 'Antique', 'Polished', 'Brushed', 
    'Satin', 'Matte', 'Aged', 'Weathered', 'Rustic', 'Iron', 'Copper', 'Pewter'];
  
  if (data.name) {
    for (const finish of commonFinishes) {
      if (data.name.toLowerCase().includes(finish.toLowerCase())) {
        data.finish_color = finish;
        break;
      }
    }
  }
  
  // Uttermost-specific: Look for color swatches section
  if (domain.includes('uttermost')) {
    // Look for the Color label and its associated swatches
    const colorLabels = document.querySelectorAll('span, div, label');
    for (const label of colorLabels) {
      if (label.innerText && label.innerText.trim().toLowerCase() === 'color') {
        // Find the next sibling or parent container with swatch images
        const parent = label.closest('div');
        if (parent) {
          const swatchImgs = parent.querySelectorAll('img');
          if (swatchImgs.length > 0) {
            // Get the first swatch as the selected one
            const selectedSwatch = parent.querySelector('img.selected, img:first-child');
            if (selectedSwatch && selectedSwatch.alt) {
              data.finish_color = selectedSwatch.alt;
            }
            if (selectedSwatch && selectedSwatch.src) {
              data.finish_image = selectedSwatch.src;
            }
          }
        }
        break;
      }
    }
    
    // If still no finish, try to extract from the product title after the dash
    if (!data.finish_color && data.name && data.name.includes(' - ')) {
      const parts = data.name.split(' - ');
      if (parts.length > 1) {
        // The part after the dash often contains the finish
        const finishPart = parts[1].split(',')[0].trim();
        if (finishPart.length > 1 && finishPart.length < 30) {
          data.finish_color = finishPart;
        }
      }
    }
  }
  
  // Four Hands specific
  if (domain.includes('fourhands')) {
    const finishEl = document.querySelector('[class*="finish"], [data-finish]');
    if (finishEl) {
      data.finish_color = finishEl.innerText.trim();
    }
  }
  
  // Visual Comfort specific
  if (domain.includes('visualcomfort')) {
    const finishEl = document.querySelector('[class*="selected-finish"], [class*="finish-name"]');
    if (finishEl) {
      data.finish_color = finishEl.innerText.trim();
    }
  }
  
  // Generic fallback selectors (avoid shipping info!)
  if (!data.finish_color) {
    const finishSelectors = [
      '[class*="finish-name"]', '[class*="color-name"]', '[class*="variant-name"]',
      '[class*="selected-option"]:not([class*="ship"])', 
      '[data-finish]', '[data-color]',
      '[class*="option-value"]:not([class*="ship"])'
    ];
    for (const sel of finishSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.innerText) {
          const txt = el.innerText.trim();
          // Skip if it looks like shipping info
          if (txt.length > 2 && txt.length < 60 && 
              !txt.match(/^\$/) && 
              !txt.toLowerCase().includes('ship') &&
              !txt.toLowerCase().includes('freight') &&
              !txt.toLowerCase().includes('delivery')) {
            data.finish_color = txt;
            break;
          }
        }
      } catch (e) {}
    }
  }
  
  // Pattern-based fallback (avoid shipping terms)
  if (!data.finish_color) {
    const finishPatterns = [
      /Finish[:\s]+([^\n,]{3,40})/i,
      /Color[:\s]+([^\n,]{3,40})/i,
      /Material[:\s]+([^\n,]{3,40})/i
    ];
    for (const pattern of finishPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const value = match[1].trim();
        if (!value.toLowerCase().includes('ship') && 
            !value.toLowerCase().includes('freight') &&
            !value.toLowerCase().includes('motor')) {
          data.finish_color = value;
          break;
        }
      }
    }
  }
  
  // ======= MAIN PRODUCT IMAGE (AGGRESSIVE) =======
  // Strategy: Find ALL images, filter by size and position, pick the best one
  
  // First try: og:image meta tag (most reliable)
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    data.image_url = ogImage.content;
  }
  
  // Second try: Specific selectors for product images
  if (!data.image_url) {
    const imgSelectors = [
      // Common e-commerce patterns
      '[class*="product-image"] img',
      '[class*="ProductImage"] img', 
      '[class*="product-detail"] img',
      '[class*="main-image"] img',
      '[class*="MainImage"] img',
      '[class*="hero-image"] img',
      '[class*="gallery"] img:first-child',
      '[class*="Gallery"] img:first-child',
      '[class*="zoom"] img',
      '[class*="Zoom"] img',
      '.pdp-image img',
      '[itemprop="image"]',
      // Uttermost specific
      '[class*="slick"] img',
      '[class*="carousel"] img:first-child',
      '[class*="slider"] img:first-child',
      // Data attributes
      'img[data-zoom-image]',
      'img[data-large]',
      'img[data-src]'
    ];
    
    for (const sel of imgSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          // Check multiple possible sources
          const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-zoom-image') || 
                      el.getAttribute('data-large') || el.getAttribute('data-lazy') || el.getAttribute('content');
          if (src && src.startsWith('http') && !src.includes('placeholder') && 
              !src.includes('spacer') && !src.includes('loading') && !src.startsWith('data:')) {
            data.image_url = src;
            break;
          }
        }
      } catch (e) {}
    }
  }
  
  // Third try: Find the LARGEST image on the page (likely the product image)
  if (!data.image_url) {
    const allImages = document.querySelectorAll('img');
    let bestImage = null;
    let bestSize = 0;
    
    for (const img of allImages) {
      // Get actual displayed size or natural size
      const width = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
      const height = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
      const size = width * height;
      
      // Get source
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      
      // Skip invalid images
      if (!src || src.startsWith('data:') || src.includes('placeholder') || 
          src.includes('spacer') || src.includes('pixel') || src.includes('logo') ||
          src.includes('icon') || src.includes('sprite') || src.includes('loading')) {
        continue;
      }
      
      // Must be reasonably large (at least 100x100)
      if (size > bestSize && width >= 100 && height >= 100) {
        bestSize = size;
        bestImage = src;
      }
    }
    
    if (bestImage) {
      data.image_url = bestImage;
    }
  }
  
  // ======= FINISH/SWATCH IMAGE (AGGRESSIVE) =======
  
  // First: Look for images with swatch/color in src or class
  const allImgs = document.querySelectorAll('img');
  for (const img of allImgs) {
    const src = img.src || img.getAttribute('data-src') || '';
    const className = (img.className || '').toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    const parentClass = (img.parentElement?.className || '').toLowerCase();
    
    // Check if this looks like a swatch
    const isSwatch = src.toLowerCase().includes('swatch') || 
                     src.toLowerCase().includes('color') ||
                     src.toLowerCase().includes('finish') ||
                     className.includes('swatch') ||
                     className.includes('color') ||
                     alt.includes('swatch') ||
                     alt.includes('color') ||
                     alt.includes('finish') ||
                     parentClass.includes('swatch') ||
                     parentClass.includes('color');
    
    if (isSwatch && src && src.startsWith('http') && !src.startsWith('data:')) {
      data.finish_image = src;
      break;
    }
  }
  
  // Second: Look for small square images near "Color" or "Finish" labels
  if (!data.finish_image) {
    const labels = document.querySelectorAll('span, div, label, p');
    for (const label of labels) {
      const text = (label.innerText || '').toLowerCase().trim();
      if (text === 'color' || text === 'finish' || text === 'colors' || text === 'finishes') {
        // Found a color/finish label, look for nearby images
        const parent = label.closest('div, section, li');
        if (parent) {
          const nearbyImgs = parent.querySelectorAll('img');
          for (const img of nearbyImgs) {
            const src = img.src || img.getAttribute('data-src');
            if (src && src.startsWith('http') && !src.startsWith('data:')) {
              data.finish_image = src;
              break;
            }
          }
        }
        if (data.finish_image) break;
      }
    }
  }
  
  // Third: If we have a finish_color from title but no image, try to use a thumbnail
  if (!data.finish_image && data.finish_color) {
    // Look for any small image (thumbnails are usually small)
    for (const img of allImgs) {
      const src = img.src || img.getAttribute('data-src');
      const width = img.width || img.naturalWidth || 0;
      const height = img.height || img.naturalHeight || 0;
      
      // Small square-ish images are often swatches (20-100px)
      if (src && src.startsWith('http') && !src.startsWith('data:') &&
          width >= 20 && width <= 100 && height >= 20 && height <= 100) {
        // Skip icons and logos
        if (!src.includes('icon') && !src.includes('logo') && !src.includes('sprite')) {
          data.finish_image = src;
          break;
        }
      }
    }
  }
  
  // If STILL no finish image, use the main product image as fallback
  if (!data.finish_image && data.image_url) {
    data.finish_image = data.image_url;
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
      throw new Error('Could not find product data on this page. Make sure you\'re on a product detail page.');
    }
    
    displayResults(data);
    
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
  sendBtn.innerHTML = '<div class="spinner"></div><span>Opening App...</span>';
  
  try {
    // Cache data on server
    try {
      await fetch(`${BACKEND_URL}/api/extension-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapedData)
      });
    } catch (e) {
      console.warn('Could not cache on server:', e);
    }
    
    // Build URL with all parameters including finish_image
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('source', 'extension');
    if (scrapedData.name) params.set('name', scrapedData.name);
    if (scrapedData.price) params.set('price', scrapedData.price);
    if (scrapedData.sku) params.set('sku', scrapedData.sku);
    if (scrapedData.size) params.set('size', scrapedData.size);
    if (scrapedData.finish_color) params.set('finish', scrapedData.finish_color);
    if (scrapedData.finish_image) params.set('finish_image', scrapedData.finish_image); // CRITICAL: Include finish image
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
    `Finish Image: ${scrapedData.finish_image || 'N/A'}`,
    `Product Image: ${scrapedData.image_url || 'N/A'}`,
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