// ====================================================================
// DESIGN READY PRODUCT SCRAPER v11.0.0 - ALL 22 VENDORS
// December 30, 2025
// COMPLETE REWRITE - Supports ALL vendor sites from user's list
// ====================================================================

console.log('');
console.log('████████████████████████████████████████████████████████████');
console.log('██  SCRAPER VERSION 15.0.0 - V11 RESTORED - ALL 22 VENDORS SUPPORTED     ██');
console.log('██  If you see old version number, REINSTALL extension!   ██');
console.log('████████████████████████████████████████████████████████████');
console.log('');

const APP_URL = 'https://designvault-5.preview.emergentagent.com';
const BACKEND_URL = 'https://designvault-5.preview.emergentagent.com';
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
// MAIN SCRAPING FUNCTION - v11.0.0 ALL 22 VENDORS
// ============================================================================
function getPageData() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SCRAPER v11.0.0 - ALL 22 VENDORS SUPPORTED               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
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

  // ============================================================
  // ALL 22 VENDORS FROM USER'S LIST
  // ============================================================
  const vendorDetection = {
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
  
  for (const [domain, vendor] of Object.entries(vendorDetection)) {
    if (hostname.includes(domain.replace('www.', ''))) {
      data.detectedVendor = vendor;
      console.log(`🏭 VENDOR DETECTED: ${vendor}`);
      break;
    }
  }
  
  if (!data.detectedVendor) {
    // Fallback - capitalize domain
    const d = hostname.replace('www.', '').split('.')[0];
    data.detectedVendor = d.charAt(0).toUpperCase() + d.slice(1);
    console.log(`🏭 VENDOR (from domain): ${data.detectedVendor}`);
  }

  // ============================================================
  // HELPER: Check if element is in excluded section
  // ============================================================
  function isInExcludedSection(el) {
    if (!el) return true;
    let parent = el;
    for (let i = 0; i < 20 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      const tagName = parent.tagName?.toLowerCase() || '';
      
      const excludePatterns = [
        'related', 'similar', 'recommend', 'also-like', 'you-may', 'cross-sell',
        'upsell', 'recently', 'complete-the-look', 'shop-the-look',
        'carousel', 'slider', 'featured', 'getcandid', 'candid', 'instagram',
        'social', 'review', 'newsletter', 'subscribe', 'banner', 'promo'
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

  // ============================================================
  // HELPER: Get background-image URL
  // ============================================================
  function getBgImage(el) {
    if (!el) return null;
    
    // Inline style
    const style = el.getAttribute('style') || '';
    const match = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (match && match[1] && !match[1].includes('data:')) {
      let url = match[1];
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = window.location.origin + url;
      return url;
    }
    
    // Computed style
    try {
      const computed = window.getComputedStyle(el).backgroundImage;
      if (computed && computed !== 'none') {
        const m = computed.match(/url\(["']?([^"')]+)["']?\)/);
        if (m && m[1] && !m[1].includes('data:') && !m[1].includes('gradient')) {
          let url = m[1];
          if (url.startsWith('//')) url = 'https:' + url;
          else if (url.startsWith('/')) url = window.location.origin + url;
          return url;
        }
      }
    } catch(e) {}
    return null;
  }

  // ============================================================
  // HELPER: Check if element is selected/active
  // ============================================================
  function isSelected(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || classes.includes('active') || 
           classes.includes('current') || classes.includes('checked') ||
           el.getAttribute('aria-selected') === 'true' ||
           el.getAttribute('aria-checked') === 'true';
  }

  // ============================================================
  // HELPER: Get color/finish name from element
  // ============================================================
  function getColorName(el) {
    if (!el) return null;
    const sources = [
      el.getAttribute('title'),
      el.getAttribute('data-color'),
      el.getAttribute('data-value'),
      el.getAttribute('data-option-value'),
      el.getAttribute('data-name'),
      el.getAttribute('data-finish'),
      el.getAttribute('data-option-label'),
      el.getAttribute('alt'),
      el.getAttribute('aria-label'),
      el.innerText?.trim()
    ];
    
    for (const src of sources) {
      if (src && src.length > 0 && src.length < 50) {
        let cleaned = src.replace(/^(color|finish|option|select|choose)[\s:]+/gi, '').trim();
        if (cleaned.length > 0 && cleaned.length < 50) return cleaned;
      }
    }
    return null;
  }

  // ============================================================
  // STEP 1: MAIN PRODUCT IMAGE
  // ============================================================
  console.log('📷 Step 1: Finding main product image...');
  
  // Method 1: og:image (most reliable)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('  ✓ Found via og:image');
  }
  
  // Method 2: Common product image selectors
  if (!data.mainProductImage) {
    const selectors = [
      '.product-image img', '.product-media img', '.pdp-image img',
      '.gallery-image img', '.product-gallery img', '.main-image img',
      '[data-gallery] img', '.product-detail img', '.product-photo img',
      '.slick-active img', '.swiper-slide-active img', '.carousel-item.active img',
      '.fotorama__active img', '#product-image img', '.primary-image img'
    ];
    
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img && !isInExcludedSection(img)) {
        const src = img.src || img.dataset.src || img.dataset.lazySrc;
        if (src?.startsWith('http')) {
          data.mainProductImage = src;
          console.log(`  ✓ Found via selector: ${sel}`);
          break;
        }
      }
    }
  }
  
  // Method 3: Largest image not in excluded section
  if (!data.mainProductImage) {
    let best = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      if (isInExcludedSection(img)) return;
      const src = img.src || img.dataset.src;
      if (!src?.startsWith('http')) return;
      const lower = src.toLowerCase();
      if (lower.includes('logo') || lower.includes('icon') || lower.includes('placeholder')) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w < 150 || h < 150) return;
      const size = w * h;
      if (size > bestSize) { bestSize = size; best = src; }
    });
    if (best) {
      data.mainProductImage = best;
      console.log('  ✓ Found via largest image');
    }
  }

  // ============================================================
  // STEP 2: SWATCH/FINISH IMAGE DETECTION
  // ============================================================
  console.log('🎨 Step 2: Finding swatch/finish image...');
  
  // Strategy A: Find selected swatch with background-image
  const swatchSelectors = [
    // Selected swatches
    '[class*="swatch"][class*="selected"]',
    '[class*="swatch"][class*="active"]',
    '[class*="color"][class*="selected"]',
    '[class*="color"][class*="active"]',
    '[class*="finish"][class*="selected"]',
    '[class*="finish"][class*="active"]',
    '[class*="option"][class*="selected"]',
    '[class*="option"][class*="active"]',
    // Aria selected
    '[aria-selected="true"]',
    '[aria-checked="true"]',
    // Button style swatches
    'button[class*="selected"][style*="background"]',
    'button[class*="active"][style*="background"]',
    // Specific vendor patterns
    '.swatch-option.selected',
    '.color-swatch.active',
    '.finish-option.selected',
    '.variant-option.selected'
  ];
  
  for (const sel of swatchSelectors) {
    const elements = document.querySelectorAll(sel);
    for (const el of elements) {
      if (isInExcludedSection(el)) continue;
      
      // Check for background-image
      const bgUrl = getBgImage(el);
      if (bgUrl) {
        data.detectedSwatchUrl = bgUrl;
        data.detectedSwatchName = getColorName(el);
        console.log(`  ✓ Swatch found via ${sel}: ${data.detectedSwatchName || 'unnamed'}`);
        break;
      }
      
      // Check for img child
      const img = el.querySelector('img');
      if (img) {
        const src = img.src || img.dataset.src;
        if (src?.startsWith('http')) {
          data.detectedSwatchUrl = src;
          data.detectedSwatchName = getColorName(el) || img.alt;
          console.log(`  ✓ Swatch img found via ${sel}: ${data.detectedSwatchName || 'unnamed'}`);
          break;
        }
      }
    }
    if (data.detectedSwatchUrl) break;
  }
  
  // Strategy B: Find color/finish option group and get selected option
  if (!data.detectedSwatchUrl) {
    const optionGroups = document.querySelectorAll(
      '[class*="option"], [class*="variant"], [class*="swatch-container"], ' +
      '[data-option], [class*="configurable"], [class*="product-option"]'
    );
    
    for (const group of optionGroups) {
      if (isInExcludedSection(group)) continue;
      
      // Check if this is a color/finish group
      const text = group.innerText?.toLowerCase() || '';
      const labels = group.querySelectorAll('label, legend, span, h3, h4, h5');
      let isColorGroup = false;
      
      for (const lbl of labels) {
        const lblText = (lbl.innerText || '').toLowerCase();
        if (lblText.includes('color') || lblText.includes('finish') || 
            lblText.includes('fabric') || lblText.includes('material')) {
          isColorGroup = true;
          break;
        }
      }
      
      if (!isColorGroup && !text.includes('color') && !text.includes('finish')) continue;
      
      // Find selected option
      const selected = group.querySelector('.selected, .active, [aria-selected="true"], [aria-checked="true"]');
      if (selected) {
        const bgUrl = getBgImage(selected);
        if (bgUrl) {
          data.detectedSwatchUrl = bgUrl;
          data.detectedSwatchName = getColorName(selected);
          console.log(`  ✓ Swatch found in option group: ${data.detectedSwatchName || 'unnamed'}`);
          break;
        }
        
        const img = selected.querySelector('img');
        if (img) {
          const src = img.src || img.dataset.src;
          if (src?.startsWith('http')) {
            data.detectedSwatchUrl = src;
            data.detectedSwatchName = getColorName(selected) || img.alt;
            console.log(`  ✓ Swatch img in option group: ${data.detectedSwatchName || 'unnamed'}`);
            break;
          }
        }
      }
    }
  }
  
  // Strategy C: Look for any small square images that look like swatches
  if (!data.detectedSwatchUrl) {
    const smallImages = document.querySelectorAll('img');
    for (const img of smallImages) {
      if (isInExcludedSection(img)) continue;
      
      const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
      const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
      
      // Swatch images are typically small and square-ish
      if (w >= 20 && w <= 100 && h >= 20 && h <= 100 && Math.abs(w - h) < 20) {
        const src = img.src || img.dataset.src;
        if (!src?.startsWith('http')) continue;
        
        const lower = src.toLowerCase();
        if (lower.includes('swatch') || lower.includes('color') || lower.includes('finish')) {
          // Check if this image's parent is selected
          let parent = img.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            if (isSelected(parent)) {
              data.detectedSwatchUrl = src;
              data.detectedSwatchName = getColorName(parent) || img.alt;
              console.log(`  ✓ Swatch found via small image: ${data.detectedSwatchName || 'unnamed'}`);
              break;
            }
            parent = parent.parentElement;
          }
          if (data.detectedSwatchUrl) break;
        }
      }
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('SCRAPE RESULTS:');
  console.log(`  Vendor: ${data.detectedVendor}`);
  console.log(`  Main Image: ${data.mainProductImage ? '✓' : '✗'}`);
  console.log(`  Swatch URL: ${data.detectedSwatchUrl ? '✓' : '✗'}`);
  console.log(`  Swatch Name: ${data.detectedSwatchName || 'Not found'}`);
  console.log('════════════════════════════════════════════════════════════');
  
  return data;
}

// ============================================================
// SCRAPE BUTTON HANDLER
// ============================================================
async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>Analyzing...</span>';
  showStatus('Extracting product data...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url || tab.url.startsWith('chrome://')) {
      throw new Error('Navigate to a product page first');
    }
    
    // Execute scraping in page context
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData
    });
    
    const pageData = results[0].result;
    if (!pageData?.pageText) {
      throw new Error('Could not read page content');
    }
    
    console.log('Page data extracted:', pageData);
    showStatus('AI analyzing product...', 'info');
    
    // Send to AI for text extraction
    const response = await fetch(`${BACKEND_URL}/api/ai-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_text: pageData.pageText,
        page_url: pageData.pageUrl
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'AI extraction failed');
    }
    
    const aiData = await response.json();
    console.log('AI extracted:', aiData);
    
    // Combine AI text data with client-side image detection
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
    
    console.log('Final data:', finalData);
    displayResults(finalData);
    showStatus(finalData.name ? `Found: ${finalData.name}` : 'Extraction complete', 'success');
    
  } catch (e) {
    console.error('Scrape error:', e);
    showStatus(e.message || 'Scrape failed', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
}

// ============================================================
// SEND TO APP
// ============================================================
async function sendToApp() {
  if (!scrapedData) return;
  if (!selectedProjectId) {
    showStatus('Select a project first!', 'warning');
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
    showStatus('Failed to send', 'error');
  } finally {
    sendBtn.disabled = false;
  }
}

// ============================================================
// COPY TO CLIPBOARD
// ============================================================
async function copyToClipboard() {
  if (!scrapedData) return;
  try {
    const text = [
      scrapedData.name || '',
      scrapedData.sku || '',
      scrapedData.price ? `$${scrapedData.price}` : '',
      scrapedData.vendor || '',
      scrapedData.finish_color || '',
      scrapedData.size || ''
    ].filter(x => x).join('\n');
    
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
    setTimeout(() => { copyBtn.innerHTML = '<span>📋</span><span>Copy</span>'; }, 2000);
  } catch (e) {
    showStatus('Copy failed', 'error');
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

// ============================================================
// AUTO-DETECT VENDOR ON POPUP OPEN
// ============================================================
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const hostname = new URL(tab.url).hostname.toLowerCase();
      const vendorMap = {
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
      
      let detected = null;
      for (const [domain, vendor] of Object.entries(vendorMap)) {
        if (hostname.includes(domain)) {
          detected = vendor;
          break;
        }
      }
      
      if (detected) {
        vendorBadge.textContent = detected;
        vendorBadge.style.display = 'block';
      } else {
        const d = hostname.replace('www.', '').split('.')[0];
        vendorBadge.textContent = d.charAt(0).toUpperCase() + d.slice(1);
        vendorBadge.style.display = 'block';
      }
    }
  } catch (e) {
    console.error('Vendor detection error:', e);
  }
})();
