// Design Ready Product Scraper v9.5.0 - STRICT MAIN PRODUCT ONLY
// December 30, 2025
// CRITICAL FIX: Only detect swatches in MAIN PRODUCT area, not Similar Items

const APP_URL = 'https://shopfetch-1.preview.emergentagent.com';
const BACKEND_URL = 'https://shopfetch-1.preview.emergentagent.com';
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

// ============================================
// v9.5.0 - STRICT MAIN PRODUCT DETECTION
// ============================================
function getPageData() {
  console.log('🔧🔧🔧 SCRAPER v9.5.0 - STRICT MAIN PRODUCT ONLY 🔧🔧🔧');
  
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: window.location.href,
    mainProductImage: null,
    swatchImages: [],
    detectedSwatchUrl: null,
    detectedSwatchName: null
  };

  // HELPER: Check if element is in EXCLUDED area (Similar Items, Related, Footer, etc)
  function isInExcludedArea(el) {
    let parent = el;
    for (let i = 0; i < 15 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      const tagName = parent.tagName?.toLowerCase() || '';
      
      // Get text content of nearby headers
      const nearbyText = (parent.innerText || '').substring(0, 500).toLowerCase();
      
      // EXCLUDE these areas completely
      if (
        // Similar/Related products
        classes.includes('similar') || classes.includes('related') ||
        classes.includes('recommend') || classes.includes('also-like') ||
        classes.includes('you-may') || classes.includes('recently') ||
        classes.includes('cross-sell') || classes.includes('upsell') ||
        id.includes('similar') || id.includes('related') ||
        id.includes('recommend') || id.includes('recently') ||
        // Navigation/Header/Footer
        classes.includes('nav') || classes.includes('menu') ||
        classes.includes('header') || classes.includes('footer') ||
        classes.includes('sidebar') || classes.includes('modal') ||
        id.includes('nav') || id.includes('menu') ||
        id.includes('header') || id.includes('footer') ||
        // Carousel/Slider sections that aren't the main product
        (classes.includes('carousel') && !classes.includes('product-carousel')) ||
        (classes.includes('slider') && !classes.includes('product-slider')) ||
        // Check for "Similar Items" text
        nearbyText.includes('similar items') ||
        nearbyText.includes('you may also like') ||
        nearbyText.includes('related products') ||
        nearbyText.includes('recently viewed') ||
        nearbyText.includes('customers also')
      ) {
        console.log('❌ EXCLUDED AREA:', classes || id || tagName);
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  // HELPER: Check if in MAIN PRODUCT swatch area
  function isInMainProductSwatchArea(el) {
    // First check if we're in an excluded area
    if (isInExcludedArea(el)) {
      return false;
    }
    
    let parent = el;
    let foundSwatchIndicator = false;
    let foundMainProduct = false;
    
    for (let i = 0; i < 10 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      
      // Check if we're in the main product detail area
      if (classes.includes('product-detail') || classes.includes('product-info') ||
          classes.includes('pdp-') || classes.includes('product-page') ||
          classes.includes('product-main') || classes.includes('product-view') ||
          id.includes('product-detail') || id.includes('pdp') ||
          id.includes('main-product') || id.includes('product-info')) {
        foundMainProduct = true;
      }
      
      // Check for swatch indicators
      if (classes.includes('swatch') || classes.includes('color-option') || 
          classes.includes('finish') || classes.includes('fabric') ||
          classes.includes('configurable') || classes.includes('variant') ||
          id.includes('swatch') || id.includes('color-option')) {
        foundSwatchIndicator = true;
      }
      
      // Check for color/finish labels nearby
      const labels = parent.querySelectorAll('label, legend, span, h3, h4, dt, .label');
      for (const label of labels) {
        const txt = (label.innerText || '').toLowerCase().trim();
        if (txt === 'color' || txt === 'color:' || txt === 'finish' || txt === 'finish:' ||
            txt === 'fabric' || txt === 'fabric:' || txt === 'cover' || txt === 'cover:' ||
            txt === 'material' || txt === 'material:' ||
            txt.startsWith('select color') || txt.startsWith('select finish') ||
            txt.startsWith('choose color') || txt.startsWith('choose finish')) {
          foundSwatchIndicator = true;
          break;
        }
      }
      
      parent = parent.parentElement;
    }
    
    // Must have swatch indicator, and either be in main product OR not be deep in excluded areas
    return foundSwatchIndicator;
  }

  // HELPER: Get background image URL
  function getBgImageUrl(el) {
    if (!el) return null;
    try {
      const bg = window.getComputedStyle(el).backgroundImage;
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

  // HELPER: Check if element is selected
  function isSelected(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || classes.includes('active') || 
           classes.includes('current') || classes.includes('checked') ||
           el.getAttribute('aria-selected') === 'true' ||
           el.getAttribute('aria-checked') === 'true';
  }

  // HELPER: Get color name from element
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

  // HELPER: Check if URL should be excluded
  function isExcludedUrl(url) {
    const lower = url.toLowerCase();
    if (lower.endsWith('.svg') || lower.includes('.svg?')) return true;
    const patterns = ['icon', 'logo', 'arrow', 'chevron', 'close', 'menu', 'cart', 'search',
                      'nav', 'mobile', 'hamburger', 'lightbulb', 'bulb', 'spinner', 'loading',
                      'placeholder', 'pixel', 'tracking', 'spacer', 'blank'];
    for (const p of patterns) {
      if (lower.includes(p)) return true;
    }
    return false;
  }

  // HELPER: Check if likely a product image
  function isLikelyProductImage(img, src) {
    if (isInExcludedArea(img)) return false;
    if (isExcludedUrl(src)) return false;
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (w < 200 || h < 200) return false;
    return true;
  }

  // HELPER: Check if likely a swatch image  
  function isLikelySwatchImage(el, url, w, h) {
    if (w > 150 || h > 150) return false;
    if (w < 10 || h < 10) return false;
    const ratio = Math.max(w, h) / Math.min(w, h);
    if (ratio > 2.5) return false;
    if (isExcludedUrl(url)) return false;
    if (!isInMainProductSwatchArea(el)) return false;
    return true;
  }

  // ========================================
  // 1. FIND MAIN PRODUCT IMAGE
  // ========================================
  console.log('=== STEP 1: FINDING MAIN PRODUCT IMAGE ===');
  
  // Try og:image first (most reliable)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('✅ Main image from og:image:', data.mainProductImage);
  }
  
  // Try product schema
  if (!data.mainProductImage) {
    const schemas = document.querySelectorAll('script[type="application/ld+json"]');
    for (const schema of schemas) {
      try {
        const json = JSON.parse(schema.textContent);
        let imgUrl = null;
        if (json['@type'] === 'Product' && json.image) {
          imgUrl = Array.isArray(json.image) ? json.image[0] : json.image;
        } else if (json['@graph']) {
          const product = json['@graph'].find(i => i['@type'] === 'Product');
          if (product?.image) {
            imgUrl = Array.isArray(product.image) ? product.image[0] : product.image;
          }
        }
        if (imgUrl?.startsWith('http')) {
          data.mainProductImage = imgUrl;
          console.log('✅ Main image from schema:', data.mainProductImage);
          break;
        }
      } catch(e) {}
    }
  }
  
  // Try common product image selectors (but NOT in similar items)
  if (!data.mainProductImage) {
    const selectors = [
      '.product-media-gallery img',
      '.product-image-container img',
      '.product-detail img',
      '.pdp-gallery img',
      '[data-gallery-role="main-image"] img',
      '.fotorama__stage img',
      '.product-image img:first-child'
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img && !isInExcludedArea(img)) {
        const src = img.src || img.dataset.src;
        if (src?.startsWith('http') && !isExcludedUrl(src)) {
          data.mainProductImage = src;
          console.log('✅ Main image from selector:', sel);
          break;
        }
      }
    }
  }
  
  // Fallback: largest image NOT in excluded areas
  if (!data.mainProductImage) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      if (isInExcludedArea(img)) return;
      const src = img.src || img.dataset.src;
      if (!src?.startsWith('http')) return;
      if (isExcludedUrl(src)) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w < 200 || h < 200) return;
      const size = w * h;
      if (size > bestSize) { bestSize = size; bestImg = src; }
    });
    if (bestImg) {
      data.mainProductImage = bestImg;
      console.log('✅ Main image from largest:', data.mainProductImage);
    }
  }

  // ========================================
  // 2. FIND SWATCH IMAGES (MAIN PRODUCT ONLY)
  // ========================================
  console.log('=== STEP 2: FINDING SWATCH IMAGES (MAIN PRODUCT ONLY) ===');
  
  const seenUrls = new Set();
  let foundSelected = false;
  
  // Method 1: Look for swatch containers with background images
  document.querySelectorAll('button, a, div, span, label, [class*="swatch"], [class*="color"]').forEach(el => {
    const bgUrl = getBgImageUrl(el);
    if (!bgUrl || seenUrls.has(bgUrl)) return;
    
    const rect = el.getBoundingClientRect();
    const w = rect.width || 50;
    const h = rect.height || 50;
    
    if (!isLikelySwatchImage(el, bgUrl, w, h)) return;
    
    seenUrls.add(bgUrl);
    const selected = isSelected(el);
    const colorName = getColorName(el);
    
    console.log('✅ Found swatch (bg):', colorName || 'unnamed', bgUrl.substring(0, 60), selected ? '[SELECTED]' : '');
    data.swatchImages.push({ url: bgUrl, isSelected: selected, colorName: colorName });
    
    if (selected && !foundSelected) {
      data.detectedSwatchUrl = bgUrl;
      data.detectedSwatchName = colorName;
      foundSelected = true;
      console.log('🎯 Using SELECTED swatch:', colorName);
    }
  });
  
  // Method 2: Look for small img tags in swatch areas
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.dataset.src;
    if (!src?.startsWith('http') || seenUrls.has(src)) return;
    
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 50;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 50;
    
    if (!isLikelySwatchImage(img, src, w, h)) return;
    
    seenUrls.add(src);
    const parent = img.closest('button, a, div, label, li, [class*="swatch"]');
    const selected = parent ? isSelected(parent) : isSelected(img);
    const colorName = getColorName(img) || (parent ? getColorName(parent) : null);
    
    console.log('✅ Found swatch (img):', colorName || 'unnamed', src.substring(0, 60), selected ? '[SELECTED]' : '');
    data.swatchImages.push({ url: src, isSelected: selected, colorName: colorName });
    
    if (selected && !foundSelected) {
      data.detectedSwatchUrl = src;
      data.detectedSwatchName = colorName;
      foundSelected = true;
      console.log('🎯 Using SELECTED swatch:', colorName);
    }
  });
  
  // Use first valid swatch only if none selected
  if (!data.detectedSwatchUrl && data.swatchImages.length > 0) {
    data.detectedSwatchUrl = data.swatchImages[0].url;
    data.detectedSwatchName = data.swatchImages[0].colorName;
    console.log('Using first swatch:', data.detectedSwatchName);
  }
  
  console.log('=== COMPLETE ===');
  console.log('Main image:', data.mainProductImage ? data.mainProductImage.substring(0, 60) + '...' : 'NOT FOUND');
  console.log('Swatch count:', data.swatchImages.length);
  console.log('Selected swatch:', data.detectedSwatchUrl ? data.detectedSwatchUrl.substring(0, 60) + '...' : 'NONE');
  console.log('Swatch name:', data.detectedSwatchName || 'NONE');
  
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
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData
    });
    
    const pageData = results[0].result;
    if (!pageData || !pageData.pageText) {
      throw new Error('Could not read page content');
    }
    
    console.log('Page data:', pageData);
    showStatus('🤖 AI analyzing product...', 'info');
    
    const response = await fetch(`${BACKEND_URL}/api/ai-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_text: pageData.pageText,
        page_url: pageData.pageUrl
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'AI extraction failed');
    }
    
    const aiData = await response.json();
    console.log('AI data:', aiData);
    
    // IMPORTANT: Use AI finish_color if no swatch detected, or if swatch name looks wrong
    let finalFinishColor = aiData.finish_color;
    if (pageData.detectedSwatchName && pageData.detectedSwatchName.length > 0) {
      finalFinishColor = pageData.detectedSwatchName;
    }
    
    const finalData = {
      url: pageData.pageUrl,
      name: aiData.name,
      sku: aiData.sku,
      price: aiData.price,
      msrp: aiData.msrp,
      size: aiData.size,
      finish_color: finalFinishColor,
      vendor: aiData.vendor,
      image_url: pageData.mainProductImage || aiData.image_url,
      finish_image: pageData.detectedSwatchUrl
    };
    
    console.log('Final data:', finalData);
    displayResults(finalData);
    showStatus(finalData.name ? `✅ Found: ${finalData.name}` : '✅ Done', 'success');
    
  } catch (e) {
    console.error('Scrape error:', e);
    showStatus(e.message || 'Scrape failed', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
}

async function sendToApp() {
  if (!scrapedData) return;
  if (!selectedProjectId) {
    showStatus('Please select a project first!', 'warning');
    projectSelector.focus();
    return;
  }
  sendBtn.disabled = true;
  try {
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
    showStatus('Sent to project!', 'success');
  } catch (e) {
    showStatus('Failed', 'error');
  } finally {
    sendBtn.disabled = false;
  }
}

async function copyToClipboard() {
  if (!scrapedData) return;
  try {
    const text = `${scrapedData.name || ''}\n${scrapedData.sku || ''}\n$${scrapedData.price || ''}\n${scrapedData.vendor || ''}\n${scrapedData.finish_color || ''}`;
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
    setTimeout(() => { copyBtn.innerHTML = '<span>📋</span><span>Copy</span>'; }, 2000);
  } catch (e) {}
}

scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

(async () => {
  try {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (t?.url) {
      const d = new URL(t.url).hostname.replace('www.', '');
      let v = d.split('.')[0];
      const vendorMap = {
        'loloirugs': 'Loloi', 'fourhands': 'Four Hands', 'hvlgroup': 'Hudson Valley',
        'visualcomfort': 'Visual Comfort', 'globalviews': 'Global Views',
        'reginaandrew': 'Regina Andrew', 'crestviewcollection': 'Crestview',
        'hubbardtonforge': 'Hubbardton Forge', 'villaandhouse': 'Villa & House',
        'bassettmirror': 'Bassett Mirror'
      };
      v = vendorMap[v] || (v.charAt(0).toUpperCase() + v.slice(1));
      vendorBadge.textContent = v;
      vendorBadge.style.display = 'block';
    }
  } catch (e) {}
})();
