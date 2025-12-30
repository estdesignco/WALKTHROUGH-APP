// Design Ready Product Scraper v9.2
// FIXED: Proper separation of MAIN IMAGE vs SWATCH IMAGE
// Main image = Large product photo (NOT a swatch)
// Swatch image = Small color/finish chip ONLY

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
// FIXED IMAGE DETECTION - v9.2
// Strictly separates MAIN IMAGE from SWATCH IMAGE
// ============================================
function getPageData() {
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: window.location.href,
    mainProductImage: null,
    swatchImages: [],  // ONLY small swatch/color images
    detectedSwatchUrl: null,
    detectedSwatchName: null
  };
  
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  
  // ========================================
  // HELPER FUNCTIONS
  // ========================================
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
  
  function isSelected(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || classes.includes('active') || 
           classes.includes('current') || classes.includes('checked') ||
           el.getAttribute('aria-selected') === 'true';
  }
  
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
  
  function isInSwatchArea(el) {
    // Check if element is inside a color/finish/fabric selection area
    // Must be STRICT to avoid false positives like menu icons
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
          // Must be an exact or near-exact match for color/finish labels
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
  
  function isLikelyProductImage(img, src) {
    // Product images are large and NOT in swatch areas
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    
    // Must be reasonably large
    if (w < 200 || h < 200) return false;
    
    // Should not be in a swatch area
    if (isInSwatchArea(img)) return false;
    
    // Exclude common non-product images
    const srcLower = src.toLowerCase();
    if (srcLower.includes('logo') || srcLower.includes('icon') || 
        srcLower.includes('sprite') || srcLower.includes('social') ||
        srcLower.includes('footer') || srcLower.includes('header') ||
        srcLower.includes('banner') || srcLower.includes('nav') ||
        srcLower.includes('lightbulb') || srcLower.includes('bulb') ||
        srcLower.includes('arrow') || srcLower.includes('chevron')) {
      return false;
    }
    
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
        urlLower.includes('minus') || urlLower.includes('zoom') ||
        urlLower.includes('share') || urlLower.includes('heart') ||
        urlLower.includes('wishlist') || urlLower.includes('spinner') ||
        urlLower.includes('loading') || urlLower.includes('play') ||
        urlLower.includes('video')) {
      return false;
    }
    
    // Check element's alt/title for non-swatch indicators
    const alt = (el.getAttribute('alt') || '').toLowerCase();
    const title = (el.getAttribute('title') || '').toLowerCase();
    if (alt.includes('close') || alt.includes('menu') || alt.includes('icon') ||
        title.includes('close') || title.includes('menu') || title.includes('icon')) {
      return false;
    }
    
    return true;
  }
  
  // ========================================
  // 1. FIND MAIN PRODUCT IMAGE
  // Priority: og:image > twitter:image > largest product image > first gallery image
  // ========================================
  console.log('=== FINDING MAIN PRODUCT IMAGE ===');
  
  // Method 1: Open Graph image (most reliable)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('Main image from og:image:', data.mainProductImage);
  }
  
  // Method 2: Twitter card image
  if (!data.mainProductImage) {
    const twitterImg = document.querySelector('meta[name="twitter:image"]');
    if (twitterImg?.content && twitterImg.content.startsWith('http')) {
      data.mainProductImage = twitterImg.content;
      console.log('Main image from twitter:image:', data.mainProductImage);
    }
  }
  
  // Method 3: Product schema image
  if (!data.mainProductImage) {
    const schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (schemaScript) {
      try {
        const schema = JSON.parse(schemaScript.textContent);
        const imgUrl = schema.image || (schema['@graph'] && schema['@graph'].find(i => i.image)?.image);
        if (imgUrl) {
          const finalUrl = Array.isArray(imgUrl) ? imgUrl[0] : imgUrl;
          if (finalUrl && finalUrl.startsWith('http')) {
            data.mainProductImage = finalUrl;
            console.log('Main image from schema:', data.mainProductImage);
          }
        }
      } catch(e) {}
    }
  }
  
  // Method 4: Look for common product image containers
  if (!data.mainProductImage) {
    const productImgSelectors = [
      '.product-image img',
      '.product-media img',
      '.gallery-image img',
      '.main-image img',
      '.product-photo img',
      '[data-gallery-role="main-image"] img',
      '.product-image-container img',
      '.pdp-image img',
      '.product-detail img',
      '.fotorama__img',
      '.slick-current img',
      '.carousel-item.active img'
    ];
    
    for (const selector of productImgSelectors) {
      const img = document.querySelector(selector);
      if (img) {
        const src = img.src || img.dataset.src || img.dataset.lazySrc;
        if (src && src.startsWith('http')) {
          data.mainProductImage = src;
          console.log('Main image from selector:', selector, data.mainProductImage);
          break;
        }
      }
    }
  }
  
  // Method 5: Largest non-swatch image as fallback
  if (!data.mainProductImage) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src;
      if (!src?.startsWith('http')) return;
      
      if (!isLikelyProductImage(img, src)) return;
      
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      const size = w * h;
      
      if (size > bestSize) {
        bestSize = size;
        bestImg = src;
      }
    });
    
    if (bestImg) {
      data.mainProductImage = bestImg;
      console.log('Main image from largest:', data.mainProductImage);
    }
  }
  
  console.log('Final main image:', data.mainProductImage);
  
  // ========================================
  // 2. FIND SWATCH/COLOR IMAGES
  // ONLY look in color/finish/fabric sections
  // ONLY accept small images
  // ========================================
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
    
    // Get page data with improved image detection
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
    
    // Call AI backend for text extraction
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
    
    // Use our improved image detection, NOT the AI's
    // Main image = large product photo
    // Swatch image = small color chip from swatch area ONLY
    const finalData = {
      url: pageData.pageUrl,
      name: aiData.name,
      sku: aiData.sku,
      price: aiData.price,
      msrp: aiData.msrp,
      size: aiData.size,
      finish_color: pageData.detectedSwatchName || aiData.finish_color,
      vendor: aiData.vendor,
      image_url: pageData.mainProductImage,  // ALWAYS the large product photo
      finish_image: pageData.detectedSwatchUrl  // ONLY small swatch from swatch area
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
    sendBtn.innerHTML = '<span>🚀</span><span>SEND TO APP</span>';
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
