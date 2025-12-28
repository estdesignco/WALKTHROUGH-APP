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
  
  // Main product image - SHOW PLACEHOLDER IF MISSING
  const imgEl = document.getElementById('productImage');
  if (data.image_url && data.image_url.startsWith('http')) {
    imgEl.src = data.image_url;
    imgEl.style.display = 'block';
    imgEl.onerror = () => {
      imgEl.src = '';
      imgEl.style.display = 'none';
      console.log('Failed to load product image:', data.image_url);
    };
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
    console.log('No product image found');
  }
  
  // Finish swatch image - SHOW IF AVAILABLE
  const finishImgEl = document.getElementById('finishImage');
  const finishImgContainer = document.getElementById('finishImageContainer');
  const finishNameEl = document.getElementById('finishName');
  
  if (data.finish_image && data.finish_image.startsWith('http')) {
    finishImgEl.src = data.finish_image;
    finishImgContainer.style.display = 'flex';
    finishImgContainer.classList.add('visible');
    finishNameEl.textContent = data.finish_color || 'Swatch';
    finishImgEl.onerror = () => {
      finishImgContainer.style.display = 'none';
      finishImgContainer.classList.remove('visible');
      console.log('Failed to load finish image:', data.finish_image);
    };
  } else {
    finishImgContainer.style.display = 'none';
    finishImgContainer.classList.remove('visible');
    console.log('No finish image found');
  }
  
  // Log what was found for debugging
  console.log('=== SCRAPE RESULTS ===');
  console.log('Product Image:', data.image_url || 'NOT FOUND');
  console.log('Finish Image:', data.finish_image || 'NOT FOUND');
  console.log('Finish Color:', data.finish_color || 'NOT FOUND');
  
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
  
  // ======= FINISH/SWATCH IMAGE - UTTERMOST SPECIFIC FIX =======
  
  function getImageSrc(img) {
    return img.src || 
           img.getAttribute('data-src') || 
           img.getAttribute('data-lazy-src') ||
           img.getAttribute('data-original') ||
           img.getAttribute('data-image') ||
           img.srcset?.split(',')[0]?.trim().split(' ')[0] ||
           '';
  }
  
  // Check if image is the main product image (we don't want this as swatch)
  function isMainProductImage(img, src, mainImageUrl) {
    if (src === mainImageUrl) return true;
    // Main images are usually large
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    if (width > 400 || height > 400) return true;
    return false;
  }
  
  // Check if image is a navigation/icon element (NOT a swatch)
  function isNavigationOrIcon(img, src) {
    const srcLower = (src || '').toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    const className = (img.className || '').toLowerCase();
    const parentClass = (img.parentElement?.className || '').toLowerCase();
    
    // EXCLUDE: arrows, navigation, icons, logos, etc.
    const excludePatterns = [
      'arrow', 'chevron', 'caret', 'nav', 'prev', 'next', 'back', 'forward',
      'icon', 'logo', 'sprite', 'pixel', 'tracking', 'spacer', 'loader',
      'spinner', 'loading', 'placeholder', 'blank', 'empty', 'close', 'x-',
      'zoom', 'search', 'cart', 'bag', 'wishlist', 'heart', 'share', 'social',
      'facebook', 'twitter', 'instagram', 'pinterest', 'youtube', 'email',
      'slider-arrow', 'slick-arrow', 'carousel-control', 'scroll'
    ];
    
    for (const pattern of excludePatterns) {
      if (srcLower.includes(pattern) || alt.includes(pattern) || 
          className.includes(pattern) || parentClass.includes(pattern)) {
        return true;
      }
    }
    
    // Also exclude very small images (likely icons)
    const width = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const height = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    if ((width > 0 && width < 30) || (height > 0 && height < 30)) {
      return true;
    }
    
    return false;
  }
  
  // STRATEGY 1: Find the "Color" section and get the SELECTED swatch image
  // Look for container that has "Color" text AND multiple small images (the swatches)
  const allTextNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim().toLowerCase();
    if (text === 'color' || text === 'colors' || text === 'colour' || text === 'colours') {
      allTextNodes.push(walker.currentNode.parentElement);
    }
  }
  
  for (const colorLabel of allTextNodes) {
    // Find the closest container that has multiple images (swatch group)
    let container = colorLabel.parentElement;
    for (let i = 0; i < 8 && container && !data.finish_image; i++) {
      const imgs = container.querySelectorAll('img');
      const validSwatches = [];
      let selectedSwatch = null;
      
      for (const img of imgs) {
        const src = getImageSrc(img);
        if (!src || !src.startsWith('http') || src.startsWith('data:')) continue;
        if (isNavigationOrIcon(img, src)) continue;
        
        const width = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 100;
        const height = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 100;
        
        if (width >= 30 && width <= 250 && height >= 30 && height <= 250) {
          // Check if THIS swatch is the selected/active one
          const imgParent = img.closest('a, button, div, li, span');
          const isSelected = 
            img.classList.contains('selected') || img.classList.contains('active') ||
            img.classList.contains('current') || img.classList.contains('chosen') ||
            imgParent?.classList.contains('selected') || imgParent?.classList.contains('active') ||
            imgParent?.classList.contains('current') || imgParent?.classList.contains('chosen') ||
            imgParent?.getAttribute('aria-selected') === 'true' ||
            imgParent?.getAttribute('aria-checked') === 'true' ||
            imgParent?.hasAttribute('data-selected') ||
            // Check for border/outline indicating selection (common pattern)
            imgParent?.style.border?.includes('2px') ||
            imgParent?.style.outline?.includes('2px') ||
            img.style.border?.includes('2px') ||
            // Check for classes with "select" in the name
            Array.from(imgParent?.classList || []).some(c => c.includes('select')) ||
            Array.from(img.classList || []).some(c => c.includes('select'));
          
          if (isSelected) {
            selectedSwatch = { img, src, width, height };
            console.log('✅ Found SELECTED swatch:', src);
          }
          validSwatches.push({ img, src, width, height });
        }
      }
      
      // Prefer the selected swatch, otherwise grab first one if we found 2+
      if (selectedSwatch) {
        data.finish_image = selectedSwatch.src;
        break;
      } else if (validSwatches.length >= 2) {
        // If no selected found but we have swatches, check by matching the finish_color name
        if (data.finish_color) {
          const colorName = data.finish_color.toLowerCase();
          for (const swatch of validSwatches) {
            const alt = (swatch.img.alt || '').toLowerCase();
            const title = (swatch.img.title || '').toLowerCase();
            const src = swatch.src.toLowerCase();
            if (alt.includes(colorName) || title.includes(colorName) || src.includes(colorName)) {
              data.finish_image = swatch.src;
              console.log('✅ Found swatch matching color name:', colorName, swatch.src);
              break;
            }
          }
        }
        // Still no match? Take first one
        if (!data.finish_image) {
          data.finish_image = validSwatches[0].src;
          console.log('✅ Using first swatch from group:', data.finish_image);
        }
        break;
      }
      
      container = container.parentElement;
    }
    if (data.finish_image) break;
  }
  
  // STRATEGY 2: Look for swatch containers by class name
  if (!data.finish_image) {
    const swatchContainers = document.querySelectorAll(
      '[class*="swatch"], [class*="color-option"], [class*="color-select"], ' +
      '[class*="variant-option"], [class*="option-swatch"], [class*="configurable-option"]'
    );
    
    for (const container of swatchContainers) {
      const imgs = container.querySelectorAll('img');
      for (const img of imgs) {
        const src = getImageSrc(img);
        if (!src || !src.startsWith('http') || src.startsWith('data:')) continue;
        if (isNavigationOrIcon(img, src)) continue;
        
        data.finish_image = src;
        console.log('✅ Found swatch from swatch container:', src);
        break;
      }
      if (data.finish_image) break;
    }
  }
  
  // STRATEGY 3: Look for images with swatch/leather/fabric/material in the URL
  if (!data.finish_image) {
    const allImgs = document.querySelectorAll('img');
    for (const img of allImgs) {
      const src = getImageSrc(img);
      if (!src || !src.startsWith('http') || src.startsWith('data:')) continue;
      if (isNavigationOrIcon(img, src)) continue;
      
      const srcLower = src.toLowerCase();
      // Very specific swatch indicators in URL
      if (srcLower.includes('swatch') || srcLower.includes('leather') || 
          srcLower.includes('fabric') || srcLower.includes('material') ||
          srcLower.includes('finish') || srcLower.includes('_color')) {
        data.finish_image = src;
        console.log('✅ Found swatch by URL keyword:', src);
        break;
      }
    }
  }
  
  // STRATEGY 4: Look for product thumbnails/gallery that show different angles/colors
  if (!data.finish_image) {
    const thumbContainers = document.querySelectorAll(
      '[class*="thumbnail"], [class*="gallery-thumb"], [class*="product-thumb"], ' +
      '[class*="image-thumb"], [class*="more-views"]'
    );
    
    for (const container of thumbContainers) {
      const imgs = container.querySelectorAll('img');
      for (const img of imgs) {
        const src = getImageSrc(img);
        if (!src || !src.startsWith('http') || src.startsWith('data:')) continue;
        if (isNavigationOrIcon(img, src)) continue;
        if (src === data.image_url) continue; // Skip main image
        
        data.finish_image = src;
        console.log('✅ Found thumbnail as swatch:', src);
        break;
      }
      if (data.finish_image) break;
    }
  }
  
  // STRATEGY 5: Background images on swatch elements
  if (!data.finish_image) {
    const elements = document.querySelectorAll(
      '[class*="swatch"], [class*="color"], [class*="option"]:not([class*="nav"])'
    );
    for (const el of elements) {
      if (el.tagName === 'IMG') continue; // Skip img tags
      const style = getComputedStyle(el);
      const bg = style.backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url')) {
        const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1] && match[1].startsWith('http')) {
          const bgUrl = match[1];
          // Make sure it's not an arrow/icon
          if (!bgUrl.includes('arrow') && !bgUrl.includes('icon') && !bgUrl.includes('nav')) {
            data.finish_image = bgUrl;
            console.log('✅ Found background-image swatch:', bgUrl);
            break;
          }
        }
      }
    }
  }
  
  // FINAL FALLBACK: Use main product image (better than nothing or an arrow!)
  if (!data.finish_image && data.image_url) {
    data.finish_image = data.image_url;
    console.log('⚠️ Using main product image as finish fallback');
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
    
    // Get the last project URL from storage (if user was on a specific project)
    let lastProjectUrl = null;
    try {
      const stored = await chrome.storage.local.get('lastProjectUrl');
      lastProjectUrl = stored.lastProjectUrl;
    } catch (e) {
      console.log('No stored project URL');
    }
    
    // If we have a last project URL, return to that project's checklist
    let appUrl;
    if (lastProjectUrl && lastProjectUrl.includes('/project/')) {
      // Extract the project path and add our params
      const projectPath = lastProjectUrl.split('?')[0]; // Remove any existing params
      appUrl = `${projectPath}?${params.toString()}`;
      console.log('Returning to last project:', appUrl);
    } else {
      // Default to home with params
      appUrl = `${APP_URL}?${params.toString()}`;
    }
    
    // Open app in new tab with data
    window.open(appUrl, '_blank');
    
    showStatus('Data sent! Go to your checklist and click PASTE on any row.', 'success');
    
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