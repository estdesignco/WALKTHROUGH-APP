// ====================================================================
// DESIGN READY PRODUCT SCRAPER v18.0.0 - FINAL COMBINED VERSION
// December 31, 2025
// COMBINES: Swatch detection from v16 + Main image detection from v10
// ====================================================================

console.log('████████████████████████████████████████████████████████████████');
console.log('██  SCRAPER VERSION 18.0.0 - FINAL COMBINED                   ██');
console.log('██  Swatch: v16 logic | Main Image: v10 logic                 ██');
console.log('████████████████████████████████████████████████████████████████');

const APP_URL = 'https://add-room-debug.preview.emergentagent.com';
const BACKEND_URL = 'https://add-room-debug.preview.emergentagent.com';
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
// MAIN SCRAPING FUNCTION - v18 FINAL COMBINED
// ============================================================================
function getPageData() {
  console.log('');
  console.log('=== SCRAPER v18.0.0 FINAL COMBINED ===');
  
  const url = window.location.href;
  const hostname = window.location.hostname.toLowerCase();
  
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: url,
    mainProductImage: null,
    detectedSwatchUrl: null,
    detectedSwatchName: null,
    detectedVendor: null
  };

  // Vendor detection
  const vendors = {
    'fourhands.com': 'Four Hands',
    'uttermost.com': 'Uttermost',
    'globalviews.com': 'Global Views',
    'rowefurniture.com': 'Rowe Furniture',
    'reginaandrew.com': 'Regina Andrew',
    'bernhardt.com': 'Bernhardt',
    'loloirugs.com': 'Loloi',
    'visualcomfort.com': 'Visual Comfort',
    'hvlgroup.com': 'HVL Group',
    'vandh.com': 'V&H',
    'flowdecor.com': 'Flow Decor',
    'crestviewcollection.com': 'Crestview Collection',
    'bassettmirror.com': 'Bassett Mirror',
    'eichholtz.com': 'Eichholtz',
    'myohamerica.com': 'MYO America',
    'safavieh.com': 'Safavieh',
    'surya.com': 'Surya',
    'zeevlighting.com': 'Zeev Lighting',
    'hubbardtonforge.com': 'Hubbardton Forge',
    'hinkley.com': 'Hinkley',
    'elegantlighting.com': 'Elegant Lighting',
    'gabby.com': 'Gabby',
    'gabbyhome.com': 'Gabby'
  };
  
  for (const [domain, vendor] of Object.entries(vendors)) {
    if (hostname.includes(domain)) {
      data.detectedVendor = vendor;
      console.log(`🏭 VENDOR: ${vendor}`);
      break;
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  // FROM V10: Check if element is in excluded section (for main image)
  function isInExcludedSection(el) {
    if (!el) return true;
    let parent = el;
    for (let i = 0; i < 25 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      const tagName = parent.tagName?.toLowerCase() || '';
      
      const excludePatterns = [
        'relatedproducts', 'related-products', 'related_products',
        'similarproducts', 'similar-products', 'similar_products',
        'recommendedproducts', 'recommended-products', 'recommendations',
        'also-like', 'you-may-also', 'customers-also', 'cross-sell', 'upsell',
        'recently-viewed', 'recently_viewed', 'browsing-history',
        'complete-the-look', 'shop-the-look', 'pairs-well',
        'product-carousel', 'product-slider', 'featured-products',
        'getcandid', 'candid', 'instagram', 'social', 'reviews', 'review-',
        'newsletter', 'subscribe', 'banner', 'promo', 'advertisement'
      ];
      
      for (const pattern of excludePatterns) {
        if (classes.includes(pattern) || id.includes(pattern)) {
          return true;
        }
      }
      
      if (tagName === 'nav' || tagName === 'header' || tagName === 'footer' || tagName === 'aside') {
        return true;
      }
      
      parent = parent.parentElement;
    }
    return false;
  }

  // FROM V16: Check if element is in swatch area (for swatch detection)
  function isInSwatchArea(el) {
    let parent = el;
    let foundSwatchIndicator = false;
    
    for (let i = 0; i < 8 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      
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
      if (classes.includes('swatch') || classes.includes('color-option') || 
          classes.includes('finish-option') || classes.includes('fabric-option') ||
          classes.includes('variant-option') || classes.includes('option-tile') ||
          classes.includes('color-picker') || classes.includes('color-select') ||
          classes.includes('finish-select') || classes.includes('configurable-option') ||
          id.includes('swatch') || id.includes('color-option') ||
          id.includes('finish-option') || id.includes('fabric-option')) {
        foundSwatchIndicator = true;
      }
      
      // Check for labels that indicate swatch area
      if (!foundSwatchIndicator) {
        const labels = parent.querySelectorAll('label, legend, span.label, h3, h4, dt, .option-label');
        for (const label of labels) {
          const labelText = (label.innerText || '').toLowerCase().trim();
          if (labelText === 'color' || labelText === 'color:' || 
              labelText === 'finish' || labelText === 'finish:' ||
              labelText === 'fabric' || labelText === 'fabric:' ||
              labelText === 'cover' || labelText === 'cover:' ||
              labelText === 'material' || labelText === 'material:' ||
              labelText.startsWith('select color') ||
              labelText.startsWith('select finish') ||
              labelText.startsWith('choose color') ||
              labelText.startsWith('choose finish')) {
            foundSwatchIndicator = true;
            break;
          }
        }
      }
      
      parent = parent.parentElement;
    }
    
    return foundSwatchIndicator;
  }

  // FROM V16: Get background image URL
  function getBgImageUrl(el) {
    if (!el) return null;
    try {
      const computed = window.getComputedStyle(el);
      const bg = computed.backgroundImage;
      if (bg && bg !== 'none') {
        const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1] && !match[1].includes('data:') && !match[1].includes('gradient')) {
          let url = match[1];
          if (url.startsWith('/')) url = window.location.origin + url;
          if (url.startsWith('http')) return url;
        }
      }
    } catch(e) {}
    return null;
  }

  // FROM V16: Check if element is selected
  function isSelected(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || classes.includes('active') || 
           classes.includes('current') || classes.includes('checked') ||
           el.getAttribute('aria-selected') === 'true' ||
           el.getAttribute('aria-checked') === 'true';
  }

  // FROM V16: Get color name from element
  function getColorName(el) {
    if (!el) return null;
    const attrs = ['title', 'data-color', 'data-value', 'data-option-value', 'data-name', 'alt', 'aria-label'];
    for (const attr of attrs) {
      let val = el.getAttribute(attr);
      if (val) {
        val = val.replace(/selected|button|swatch|option|click|choose/gi, '').trim();
        if (val.length > 0 && val.length < 50) return val;
      }
    }
    return null;
  }

  // FROM V16: Check if likely swatch image (small, in swatch area)
  function isLikelySwatchImage(el, url, w, h) {
    if (w > 150 || h > 150) return false;
    if (w < 15 || h < 15) return false;
    const ratio = Math.max(w, h) / Math.min(w, h);
    if (ratio > 2) return false; // Must be roughly square
    if (!isInSwatchArea(el)) return false;
    
    const urlLower = url.toLowerCase();
    if (urlLower.includes('logo') || urlLower.includes('icon') || 
        urlLower.includes('arrow') || urlLower.includes('chevron') ||
        urlLower.includes('close') || urlLower.includes('search') ||
        urlLower.includes('cart') || urlLower.includes('menu')) {
      return false;
    }
    return true;
  }

  // ========================================
  // STEP 1: MAIN PRODUCT IMAGE (FROM V10 - THIS WORKED!)
  // ========================================
  console.log('📷 Step 1: Finding main product image (v10 logic)...');
  
  // Method 1: og:image meta tag (most reliable)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('✅ Main image from og:image');
  }
  
  // Method 2: Vendor-specific image selectors
  if (!data.mainProductImage) {
    const vendorImageSelectors = {
      'HVL Group': ['.product-detail-image img', '.pdp-image img', '#productImage'],
      'Visual Comfort': ['.fotorama__active img', '.gallery-placeholder img', '.product-image-photo'],
      'Loloi': ['.product__image img', '.product-single__photo img'],
      'Four Hands': ['[class*="product-detail"] img', '.product-gallery img'],
      'Regina Andrew': ['.product-image img', '.main-image img'],
      'Uttermost': ['.productSlider-root img', '.swiper-slide-active img']
    };
    
    const selectors = vendorImageSelectors[data.detectedVendor] || [];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img && !isInExcludedSection(img)) {
        const src = img.src || img.dataset.src;
        if (src?.startsWith('http')) {
          data.mainProductImage = src;
          console.log(`✅ Main image from vendor selector: ${sel}`);
          break;
        }
      }
    }
  }
  
  // Method 3: Generic gallery selectors
  if (!data.mainProductImage) {
    const genericSelectors = [
      '.product-media img:first-child',
      '.product-image-container img:first-child',
      '.gallery__image img',
      '.pdp-gallery img:first-child',
      '[data-gallery-role="main"] img',
      '.swiper-slide-active img',
      '.slick-active img',
      '.carousel-item.active img'
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
  
  // Method 4: Largest non-excluded image (NOT in swatch area)
  if (!data.mainProductImage) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      if (isInExcludedSection(img)) return;
      if (isInSwatchArea(img)) return; // Don't pick swatch images as main!
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

  // ========================================
  // STEP 2: SWATCH/COLOR IMAGE (FROM V16 - THIS WORKED!)
  // ========================================
  console.log('🎨 Step 2: Finding swatch image (v16 logic)...');
  
  const seenSwatchUrls = new Set();
  const swatchCandidates = [];
  
  // Method 1: Find buttons/elements with background-image in swatch areas
  document.querySelectorAll('button, a, div, span, label').forEach(el => {
    if (!isInSwatchArea(el)) return;
    
    const bgUrl = getBgImageUrl(el);
    if (!bgUrl || seenSwatchUrls.has(bgUrl)) return;
    
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    
    if (!isLikelySwatchImage(el, bgUrl, w, h)) return;
    
    seenSwatchUrls.add(bgUrl);
    const colorName = getColorName(el);
    const selected = isSelected(el);
    
    swatchCandidates.push({
      url: bgUrl,
      name: colorName,
      selected: selected,
      element: el
    });
    
    if (selected) {
      console.log(`  Found SELECTED swatch: ${colorName || 'unnamed'}`);
    }
  });
  
  // Method 2: Find small images in swatch areas
  document.querySelectorAll('img').forEach(img => {
    if (!isInSwatchArea(img)) return;
    
    const src = img.src || img.dataset.src;
    if (!src?.startsWith('http') || seenSwatchUrls.has(src)) return;
    
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    
    if (!isLikelySwatchImage(img, src, w, h)) return;
    
    seenSwatchUrls.add(src);
    
    // Check if parent is selected
    let parent = img.parentElement;
    let selected = false;
    for (let i = 0; i < 3 && parent; i++) {
      if (isSelected(parent)) {
        selected = true;
        break;
      }
      parent = parent.parentElement;
    }
    
    const colorName = getColorName(img) || getColorName(img.parentElement);
    
    swatchCandidates.push({
      url: src,
      name: colorName,
      selected: selected,
      element: img
    });
    
    if (selected) {
      console.log(`  Found SELECTED swatch img: ${colorName || 'unnamed'}`);
    }
  });
  
  // Pick the best swatch - prefer selected, then first one
  const selectedSwatch = swatchCandidates.find(s => s.selected);
  if (selectedSwatch) {
    data.detectedSwatchUrl = selectedSwatch.url;
    data.detectedSwatchName = selectedSwatch.name;
    console.log(`✅ Using SELECTED swatch: ${data.detectedSwatchName || 'unnamed'}`);
  } else if (swatchCandidates.length > 0) {
    data.detectedSwatchUrl = swatchCandidates[0].url;
    data.detectedSwatchName = swatchCandidates[0].name;
    console.log(`✅ Using first swatch: ${data.detectedSwatchName || 'unnamed'}`);
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('RESULTS:');
  console.log(`  Vendor: ${data.detectedVendor || 'Unknown'}`);
  console.log(`  Main Image: ${data.mainProductImage ? '✅' : '❌'}`);
  console.log(`  Swatch URL: ${data.detectedSwatchUrl ? '✅' : '❌'}`);
  console.log(`  Swatch Name: ${data.detectedSwatchName || 'Not found'}`);
  console.log('════════════════════════════════════════════════════════════');
  
  return data;
}

// ============================================================
// SCRAPE HANDLER
// ============================================================
async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>Analyzing...</span>';
  showStatus('Extracting...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url || tab.url.startsWith('chrome://')) {
      throw new Error('Navigate to a product page first');
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData
    });
    
    const pageData = results[0].result;
    if (!pageData?.pageText) throw new Error('Could not read page');
    
    showStatus('AI analyzing...', 'info');
    
    const response = await fetch(`${BACKEND_URL}/api/ai-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_text: pageData.pageText, page_url: pageData.pageUrl })
    });
    
    if (!response.ok) throw new Error('AI failed');
    
    const aiData = await response.json();
    
    const finalData = {
      url: pageData.pageUrl,
      name: aiData.name,
      sku: aiData.sku,
      price: aiData.price,
      msrp: aiData.msrp,
      size: aiData.size,
      finish_color: pageData.detectedSwatchName || aiData.finish_color,
      vendor: pageData.detectedVendor || aiData.vendor,
      image_url: pageData.mainProductImage || aiData.image_url,
      finish_image: pageData.detectedSwatchUrl
    };
    
    displayResults(finalData);
    showStatus(finalData.name ? `Found: ${finalData.name}` : 'Done', 'success');
    
  } catch (e) {
    showStatus(e.message || 'Failed', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
}

async function sendToApp() {
  if (!scrapedData) return;
  if (!selectedProjectId) { showStatus('Select a project!', 'warning'); return; }
  
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
  
  window.open(`${APP_URL}/checklist/${selectedProjectId}?${params.toString()}`, '_blank');
  showStatus('Sent!', 'success');
}

async function copyToClipboard() {
  if (!scrapedData) return;
  const text = [scrapedData.name, scrapedData.sku, scrapedData.price ? `$${scrapedData.price}` : '', 
                scrapedData.vendor, scrapedData.finish_color, scrapedData.size].filter(x => x).join('\n');
  await navigator.clipboard.writeText(text);
  copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
  setTimeout(() => { copyBtn.innerHTML = '<span>📋</span><span>Copy</span>'; }, 2000);
}

scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

// Auto-detect vendor
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const hostname = new URL(tab.url).hostname.toLowerCase();
      const vendorMap = {
        'fourhands.com': 'Four Hands', 'uttermost.com': 'Uttermost', 'globalviews.com': 'Global Views',
        'rowefurniture.com': 'Rowe', 'reginaandrew.com': 'Regina Andrew', 'bernhardt.com': 'Bernhardt',
        'loloirugs.com': 'Loloi', 'visualcomfort.com': 'Visual Comfort', 'hvlgroup.com': 'HVL Group',
        'vandh.com': 'V&H', 'flowdecor.com': 'Flow Decor', 'crestviewcollection.com': 'Crestview',
        'bassettmirror.com': 'Bassett Mirror', 'eichholtz.com': 'Eichholtz', 'myohamerica.com': 'MYO America',
        'safavieh.com': 'Safavieh', 'surya.com': 'Surya', 'zeevlighting.com': 'Zeev Lighting',
        'hubbardtonforge.com': 'Hubbardton Forge', 'hinkley.com': 'Hinkley', 'elegantlighting.com': 'Elegant Lighting',
        'gabby.com': 'Gabby', 'gabbyhome.com': 'Gabby'
      };
      
      let detected = null;
      for (const [domain, vendor] of Object.entries(vendorMap)) {
        if (hostname.includes(domain)) { detected = vendor; break; }
      }
      
      vendorBadge.textContent = detected || hostname.replace('www.', '').split('.')[0];
      vendorBadge.style.display = 'block';
    }
  } catch (e) {}
})();
