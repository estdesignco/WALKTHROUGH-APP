// ====================================================================
// DESIGN READY PRODUCT SCRAPER v19.0.0 - FORENSIC COMBINATION
// December 31, 2025
// SWATCH DETECTION: From v16 (isInSwatchArea + isLikelySwatchImage)
// MAIN IMAGE DETECTION: From v10 (og:image + vendor-specific + largest image)
// CRITICAL FIX: Combining ONLY the working parts from each version
// ====================================================================

console.log('████████████████████████████████████████████████████████████████');
console.log('██  SCRAPER VERSION 19.0.0 - FORENSIC COMBINATION             ██');
console.log('██  Swatch Logic: v16 | Main Image Logic: v10                 ██');
console.log('██  BOTH SHOULD WORK NOW - USER VERIFIED COMBINATION          ██');
console.log('████████████████████████████████████████████████████████████████');

const APP_URL = 'https://bugfix-central-89.preview.emergentagent.com';
const BACKEND_URL = 'https://bugfix-central-89.preview.emergentagent.com';
let scrapedData = null;
let selectedProjectId = null;

const scrapeBtn = document.getElementById('scrapeBtn');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const rescrapeBtn = document.getElementById('rescrapeBtn');
const statusBar = document.getElementById('statusBar');
const emptyState = document.getElementById('emptyState');
const resultsContainer = document.getElementById('resultsContainer');
const vendorBadge = document.getElementById('vendorBadge');
const loginWarning = document.getElementById('loginWarning');
const projectSelector = document.getElementById('projectSelector');

async function loadProjects() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/projects`);
    if (!response.ok) throw new Error('Failed');
    const projects = await response.json();
    projectSelector.innerHTML = '<option value="">-- Select a Project --</option>';
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectSelector.appendChild(opt);
    });
    const stored = await chrome.storage.local.get('selectedProjectId');
    if (stored.selectedProjectId) {
      projectSelector.value = stored.selectedProjectId;
      selectedProjectId = stored.selectedProjectId;
    }
  } catch (e) {
    projectSelector.innerHTML = '<option value="">-- Could not load --</option>';
  }
}

projectSelector?.addEventListener('change', async () => {
  selectedProjectId = projectSelector.value;
  await chrome.storage.local.set({ selectedProjectId });
});

loadProjects();

function showStatus(msg, type = 'info') {
  statusBar.style.display = 'flex';
  statusBar.className = `status-bar ${type}`;
  statusBar.innerHTML = `<span>${{success:'✅',error:'❌',info:'🔍',warning:'⚠️'}[type]||'•'}</span><span>${msg}</span>`;
}

function displayResults(data) {
  scrapedData = data;
  emptyState.style.display = 'none';
  resultsContainer.style.display = 'block';
  if (data.vendor) { vendorBadge.textContent = data.vendor; vendorBadge.style.display = 'block'; }
  document.getElementById('productName').textContent = data.name || 'Unknown';
  document.getElementById('productSku').textContent = data.sku ? `SKU: ${data.sku}` : '';
  const priceEl = document.getElementById('productPrice');
  if (data.price) { priceEl.textContent = `$${parseFloat(data.price).toLocaleString('en-US',{minimumFractionDigits:2})}`; priceEl.className='product-price'; loginWarning.style.display='none'; }
  else { priceEl.textContent = 'Price not found'; priceEl.className='product-price missing'; loginWarning.style.display='flex'; }
  const imgEl = document.getElementById('productImage');
  if (data.image_url) { imgEl.src = data.image_url; imgEl.style.display = 'block'; } else { imgEl.style.display = 'none'; }
  const finishImgEl = document.getElementById('finishImage');
  const finishImgContainer = document.getElementById('finishImageContainer');
  const finishNameEl = document.getElementById('finishName');
  if (data.finish_image) { 
    finishImgEl.src = data.finish_image; 
    finishImgContainer.style.display = 'flex'; 
    finishNameEl.textContent = data.finish_color || 'Swatch'; 
  } else { 
    finishImgContainer.style.display = 'none'; 
  }
  document.getElementById('dataVendor').textContent = data.vendor || 'Not found';
  document.getElementById('dataSize').textContent = data.size || 'Not found';
  document.getElementById('dataFinish').textContent = data.finish_color || 'Not found';
  document.getElementById('dataMsrp').textContent = data.msrp ? `$${data.msrp}` : 'Not found';
  document.getElementById('dataUrl').textContent = data.url || 'Not found';
}

// ============================================================================
// MAIN SCRAPING FUNCTION - v19.0.0 FORENSIC COMBINATION
// ============================================================================
function getPageData() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SCRAPER v19.0.0 - FORENSIC COMBINATION                   ║');
  console.log('║  Main Image: v10 logic | Swatch: v16 logic                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const url = window.location.href;
  const hostname = window.location.hostname.toLowerCase();
  
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: url,
    mainProductImage: null,
    swatchImages: [],
    detectedSwatchUrl: null,
    detectedSwatchName: null
  };
  
  // ========================================
  // HELPER FUNCTIONS FROM v16 (for swatches)
  // ========================================
  function getBgImageUrl(el) {
    if (!el) return null;
    try {
      const computed = window.getComputedStyle(el);
      const bgImg = computed.backgroundImage;
      if (!bgImg || bgImg === 'none') return null;
      const match = bgImg.match(/url\(['"]?([^'"]+)['"]?\)/);
      return match ? match[1] : null;
    } catch(e) { return null; }
  }
  
  function isSelected(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || classes.includes('active') || 
           el.getAttribute('aria-selected') === 'true' ||
           el.getAttribute('aria-checked') === 'true';
  }
  
  function getColorName(el) {
    if (!el) return null;
    return el.getAttribute('data-value') || el.getAttribute('title') || 
           el.getAttribute('aria-label') || el.getAttribute('alt') || null;
  }
  
  function isInSwatchArea(el) {
    // Check if element is inside a color/finish/fabric selection area
    // Must be STRICT to avoid false positives like menu icons
    let parent = el;
    let foundSwatchIndicator = false;
    
    for (let i = 0; i < 8 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      const dataAttrs = Array.from(parent.attributes || [])
        .map(attr => attr.name.toLowerCase() + '=' + attr.value.toLowerCase())
        .join(' ');
      
      // EXCLUDE: Navigation, header, footer, menu areas
      if (classes.includes('nav') || classes.includes('menu') || 
          classes.includes('header') || classes.includes('footer') ||
          classes.includes('modal') || classes.includes('popup') ||
          classes.includes('overlay') || classes.includes('sidebar') ||
          id.includes('nav') || id.includes('menu') || 
          id.includes('header') || id.includes('footer')) {
        return false;
      }
      
      // INCLUDE: Actual swatch/color selection areas
      // Uttermost-specific: tile, option, configurable
      if (classes.includes('swatch') || classes.includes('color') || 
          classes.includes('finish') || classes.includes('fabric') ||
          classes.includes('variant') || classes.includes('option') ||
          classes.includes('tile') || classes.includes('configurable') ||
          id.includes('swatch') || id.includes('color') || 
          id.includes('finish') || id.includes('fabric') ||
          dataAttrs.includes('data-option') || dataAttrs.includes('data-color')) {
        foundSwatchIndicator = true;
      }
      
      // Check for text labels like "Color:", "Finish:", "Fabric:"
      const textContent = (parent.textContent || '').toLowerCase();
      if (textContent.includes('color:') || textContent.includes('finish:') || 
          textContent.includes('fabric:') || textContent.includes('select color') ||
          textContent.includes('choose color') || textContent.includes('available colors')) {
        foundSwatchIndicator = true;
      }
      
      parent = parent.parentElement;
    }
    
    return foundSwatchIndicator;
  }

  function isLikelyProductImage(img, src) {
    if (!img || !src) return false;
    
    // Must be reasonable size
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    if (w < 200 || h < 200) return false;
    
    // URL checks
    const urlLower = src.toLowerCase();
    if (urlLower.endsWith('.svg') || urlLower.includes('.svg?')) return false;
    if (urlLower.includes('logo') || urlLower.includes('icon') || 
        urlLower.includes('placeholder') || urlLower.includes('loading')) return false;
    
    // Must not be in a swatch area
    if (isInSwatchArea(img)) return false;
    
    return true;
  }
  
  function isLikelySwatchImage(el, url, w, h) {
    // Swatch images are SMALL (typically 30-100px) and in swatch areas
    
    // Must be small and square-ish
    if (w > 150 || h > 150) return false;
    if (w < 15 || h < 15) return false;
    
    // Should be roughly square
    const ratio = Math.max(w, h) / Math.min(w, h);
    if (ratio > 2) return false;
    
    // Must be in a swatch/color area
    if (!isInSwatchArea(el)) return false;
    
    // Exclude obvious non-swatches
    const urlLower = url.toLowerCase();
    
    // CRITICAL: Exclude SVG files - they are icons, not swatches
    if (urlLower.endsWith('.svg') || urlLower.includes('.svg?')) {
      return false;
    }
    
    // Exclude UI elements and icons
    if (urlLower.includes('lightbulb') || urlLower.includes('bulb') ||
        urlLower.includes('arrow') || urlLower.includes('chevron') ||
        urlLower.includes('icon') || urlLower.includes('logo') ||
        urlLower.includes('close') || urlLower.includes('menu') ||
        urlLower.includes('cart') || urlLower.includes('search') ||
        urlLower.includes('nav') || urlLower.includes('mobile') ||
        urlLower.includes('hamburger') || urlLower.includes('plus') ||
        urlLower.includes('minus') || urlLower.includes('zoom')) {
      return false;
    }
    
    return true;
  }

  // ========================================
  // HELPER FUNCTION FROM v10 (for main image exclusion)
  // ========================================
  function isInExcludedSection(el) {
    if (!el) return true;
    let parent = el;
    for (let i = 0; i < 25 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      const tagName = parent.tagName?.toLowerCase() || '';
      const dataSection = (parent.getAttribute('data-section') || '').toLowerCase();
      const ariaLabel = (parent.getAttribute('aria-label') || '').toLowerCase();
      
      // COMPREHENSIVE EXCLUSION LIST
      const excludePatterns = [
        // Related/Similar/Recommended products
        'relatedproducts', 'related-products', 'related_products',
        'similarproducts', 'similar-products', 'similar_products',
        'recommendedproducts', 'recommended-products', 'recommendations',
        'also-like', 'you-may-also', 'customers-also', 'cross-sell', 'upsell',
        'recently-viewed', 'recently_viewed', 'browsing-history',
        'complete-the-look', 'shop-the-look', 'pairs-well',
        // Carousels/Sliders of other products
        'product-carousel', 'product-slider', 'featured-products',
        // Navigation/Chrome
        'nav', 'header', 'footer', 'menu', 'sidebar', 'modal', 'drawer',
        'breadcrumb', 'pagination', 'search-results',
        // Social/Marketing
        'getcandid', 'candid', 'instagram', 'social', 'reviews', 'review-',
        'newsletter', 'subscribe', 'banner', 'promo', 'advertisement'
      ];
      
      for (const pattern of excludePatterns) {
        if (classes.includes(pattern) || id.includes(pattern) || 
            dataSection.includes(pattern) || ariaLabel.includes(pattern)) {
          return true;
        }
      }
      
      // Tag-based exclusions
      if (tagName === 'nav' || tagName === 'header' || tagName === 'footer' || tagName === 'aside') {
        return true;
      }
      
      parent = parent.parentElement;
    }
    return false;
  }

  // ============================================================
  // STEP 1: MAIN PRODUCT IMAGE DETECTION (FROM v10 - WORKING)
  // ============================================================
  console.log('=== STEP 1: MAIN PRODUCT IMAGE ===');
  
  // Method 1: og:image meta tag (most reliable across all vendors)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('✅ Main image from og:image:', data.mainProductImage.substring(0, 80));
  }
  
  // Method 2: Generic gallery/product image selectors (including Uttermost-specific)
  if (!data.mainProductImage) {
    const genericSelectors = [
      // Uttermost-specific (React/PWA)
      '.productSlider-root img',
      '.productSlider-image_container img',
      '.image-container img',
      '[class*="productSlider"] img',
      '[class*="galleryImage"] img',
      '[class*="heroImage"] img',
      // Modern React/PWA patterns
      '.hero-image img',
      '.main-product-image img',
      '.product-gallery-main img',
      '[data-testid="main-image"]',
      '[data-testid="hero-image"]',
      '[data-cy="product-image"]',
      '[role="img"]',
      // Traditional e-commerce
      '.product-media img:first-child',
      '.product-image-container img:first-child',
      '.gallery__image img',
      '.pdp-gallery img:first-child',
      '[data-gallery-role="main"] img',
      '.swiper-slide-active img',
      '.slick-active img',
      '.carousel-item.active img',
      '.fotorama__active img',
      '.product-image-photo',
      '.product__image img',
      '.product-single__photo img'
    ];
    
    for (const sel of genericSelectors) {
      const img = document.querySelector(sel);
      if (img && !isInExcludedSection(img)) {
        const src = img.src || img.dataset.src;
        if (src?.startsWith('http')) {
          data.mainProductImage = src;
          console.log(`✅ Main image from generic selector: ${sel}`);
          break;
        }
      }
    }
  }
  
  // Method 3: Largest non-excluded image
  if (!data.mainProductImage) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      if (isInExcludedSection(img)) return;
      const src = img.src || img.dataset.src;
      if (!src?.startsWith('http')) return;
      const lower = src.toLowerCase();
      if (lower.endsWith('.svg') || lower.includes('icon') || lower.includes('logo') || 
          lower.includes('placeholder') || lower.includes('loading')) return;
      const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
      const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
      if (w < 200 || h < 200) return;
      const size = w * h;
      if (size > bestSize) { bestSize = size; bestImg = src; }
    });
    if (bestImg) {
      data.mainProductImage = bestImg;
      console.log('✅ Main image from largest non-excluded');
    }
  }

  console.log('Final main image:', data.mainProductImage);

  // ============================================================
  // STEP 2: SWATCH/COLOR IMAGE DETECTION (FROM v16 - WORKING)
  // ============================================================
  console.log('');
  console.log('=== FINDING SWATCH IMAGES ===');
  
  const seenSwatchUrls = new Set();
  let foundSelectedSwatch = false;
  
  // Method 1: Find buttons/elements with background-image in swatch areas
  document.querySelectorAll('button, a, div, span, label').forEach(el => {
    if (!isInSwatchArea(el)) return;
    
    const bgUrl = getBgImageUrl(el);
    if (!bgUrl || seenSwatchUrls.has(bgUrl)) return;
    
    // Get element size
    const rect = el.getBoundingClientRect();
    const w = rect.width || 50;
    const h = rect.height || 50;
    
    if (!isLikelySwatchImage(el, bgUrl, w, h)) return;
    
    seenSwatchUrls.add(bgUrl);
    const selected = isSelected(el);
    const colorName = getColorName(el);
    
    data.swatchImages.push({
      url: bgUrl,
      isSelected: selected,
      colorName: colorName,
      type: 'background'
    });
    
    if (selected && !foundSelectedSwatch) {
      data.detectedSwatchUrl = bgUrl;
      data.detectedSwatchName = colorName;
      foundSelectedSwatch = true;
      console.log('Found SELECTED swatch (bg):', colorName, bgUrl);
    }
  });
  
  // Method 2: Find small img tags in swatch areas
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.dataset.src;
    if (!src?.startsWith('http') || seenSwatchUrls.has(src)) return;
    
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 50;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 50;
    
    if (!isLikelySwatchImage(img, src, w, h)) return;
    
    seenSwatchUrls.add(src);
    const parent = img.closest('button, a, div, label, li');
    const selected = parent ? isSelected(parent) : false;
    const colorName = getColorName(img) || (parent ? getColorName(parent) : null);
    
    data.swatchImages.push({
      url: src,
      isSelected: selected,
      colorName: colorName,
      type: 'img'
    });
    
    if (selected && !foundSelectedSwatch) {
      data.detectedSwatchUrl = src;
      data.detectedSwatchName = colorName;
      foundSelectedSwatch = true;
      console.log('Found SELECTED swatch (img):', colorName, src);
    }
  });
  
  // If no selected swatch found, use first one
  if (!data.detectedSwatchUrl && data.swatchImages.length > 0) {
    data.detectedSwatchUrl = data.swatchImages[0].url;
    data.detectedSwatchName = data.swatchImages[0].colorName;
    console.log('Using first swatch:', data.detectedSwatchName, data.detectedSwatchUrl);
  }
  
  console.log('=== IMAGE DETECTION COMPLETE ===');
  console.log('Main image:', data.mainProductImage);
  console.log('Swatch count:', data.swatchImages.length);
  console.log('Selected swatch:', data.detectedSwatchUrl);
  
  return data;
}

async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>AI Analyzing...</span>';
  showStatus('🤖 Extracting page data...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url || tab.url.startsWith('chrome://')) {
      throw new Error('Navigate to a product page first');
    }
    const injectedData = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: getPageData,
    });
    const pageData = injectedData[0].result;
    if (!pageData.pageText) throw new Error('Could not extract page content');
    
    const vendorHostname = new URL(tab.url).hostname.replace('www.', '');
    
    showStatus('🤖 Sending to AI for analysis...', 'info');
    const response = await fetch(`${BACKEND_URL}/api/ai-scrape`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        page_text: pageData.pageText,
        page_url: tab.url
      }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `API error: ${response.status}`);
    }
    const extractedData = await response.json();
    
    // Add the images and URL we detected client-side
    extractedData.image_url = pageData.mainProductImage;
    extractedData.finish_image = pageData.detectedSwatchUrl;
    if (pageData.detectedSwatchName && !extractedData.finish_color) {
      extractedData.finish_color = pageData.detectedSwatchName;
    }
    extractedData.url = tab.url;
    // AI scraper already provides: name, sku, price, msrp, size, finish_color (from text)
    
    displayResults(extractedData);
    showStatus('✅ Data extracted successfully!', 'success');
    sendBtn.disabled = false;
    copyBtn.disabled = false;
    rescrapeBtn.disabled = false;
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>Scrape Current Page</span>';
  }
}

async function sendToApp() {
  if (!scrapedData) {
    alert('No data to send. Please scrape a page first.');
    return;
  }
  if (!selectedProjectId) {
    alert('Please select a project first');
    return;
  }
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="spinner"></div><span>Sending...</span>';
  try {
    const response = await fetch(`${BACKEND_URL}/api/projects/${selectedProjectId}/items`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(scrapedData),
    });
    if (!response.ok) throw new Error('Failed to save');
    showStatus('✅ Item added to project!', 'success');
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    await chrome.tabs.update(tab.id, {url: `${APP_URL}/projects/${selectedProjectId}`});
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<span>Add to Project & View</span>';
  }
}

async function copyToClipboard() {
  if (!scrapedData) return;
  const text = JSON.stringify(scrapedData, null, 2);
  await navigator.clipboard.writeText(text);
  copyBtn.innerHTML = '<span>✅ Copied!</span>';
  setTimeout(() => {
    copyBtn.innerHTML = '<span>📋 Copy JSON</span>';
  }, 2000);
}

scrapeBtn?.addEventListener('click', doScrape);
sendBtn?.addEventListener('click', sendToApp);
copyBtn?.addEventListener('click', copyToClipboard);
rescrapeBtn?.addEventListener('click', doScrape);
