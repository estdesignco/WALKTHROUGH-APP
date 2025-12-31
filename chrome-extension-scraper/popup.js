// ====================================================================
// DESIGN READY PRODUCT SCRAPER v13.0.0 - RESTORED WORKING CODE
// December 30, 2025
// COMBINED: V10 swatch detection (WORKED) + V12 main image + all 22 vendors
// ====================================================================

console.log('');
console.log('████████████████████████████████████████████████████████████████');
console.log('██  SCRAPER VERSION 13.0.0 - RESTORED WORKING SWATCH CODE     ██');
console.log('██  If you see old version number, REINSTALL extension!       ██');
console.log('████████████████████████████████████████████████████████████████');
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
// MAIN SCRAPING FUNCTION - V13.0.0 RESTORED FROM V10 + V12
// ============================================================================
function getPageData() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SCRAPER v13.0.0 - RESTORED WORKING SWATCH CODE           ║');
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

  // ALL 22 VENDORS
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
      console.log(`🏭 VENDOR: ${vendor}`);
      break;
    }
  }

  // ============================================================
  // HELPER FUNCTIONS - RESTORED FROM V10 (THESE WORKED)
  // ============================================================
  
  // Check if element is in excluded section
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
        'nav', 'header', 'footer', 'menu', 'sidebar', 'modal', 'drawer',
        'breadcrumb', 'pagination', 'search-results',
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

  // Check if element is selected - FROM V10
  function isSelectedElement(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    const ariaSelected = el.getAttribute('aria-selected');
    const ariaChecked = el.getAttribute('aria-checked');
    const ariaCurrent = el.getAttribute('aria-current');
    
    return classes.includes('selected') || 
           classes.includes('active') || 
           classes.includes('current') || 
           classes.includes('checked') ||
           classes.includes('is-active') ||
           classes.includes('is-selected') ||
           ariaSelected === 'true' ||
           ariaChecked === 'true' ||
           ariaCurrent === 'true';
  }

  // Get background-image URL - FROM V10
  function getBgImage(el) {
    if (!el) return null;
    
    const inlineStyle = el.getAttribute('style') || '';
    const bgMatch = inlineStyle.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (bgMatch && bgMatch[1]) {
      let url = bgMatch[1];
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = window.location.origin + url;
      if (url.startsWith('http') && !url.includes('data:')) return url;
    }
    
    try {
      const computed = window.getComputedStyle(el).backgroundImage;
      if (computed && computed !== 'none') {
        const match = computed.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1] && !match[1].includes('data:') && !match[1].includes('gradient')) {
          let url = match[1];
          if (url.startsWith('//')) url = 'https:' + url;
          else if (url.startsWith('/')) url = window.location.origin + url;
          if (url.startsWith('http')) return url;
        }
      }
    } catch(e) {}
    return null;
  }

  // Get color name - FROM V10
  function getColorName(el) {
    if (!el) return null;
    
    const sources = [
      el.getAttribute('title'),
      el.getAttribute('data-color'),
      el.getAttribute('data-value'),
      el.getAttribute('data-option-value'),
      el.getAttribute('data-name'),
      el.getAttribute('data-finish'),
      el.getAttribute('alt'),
      el.getAttribute('aria-label'),
      el.querySelector('span')?.innerText,
      el.innerText?.trim()
    ];
    
    for (const src of sources) {
      if (src && src.length > 0 && src.length < 60) {
        let cleaned = src.replace(/^(color|finish|option|select|choose|fashion size|button)[\s:]+/gi, '');
        cleaned = cleaned.replace(/\s*(button|selected|option|click|choose)$/gi, '');
        cleaned = cleaned.trim();
        if (cleaned.length > 0 && cleaned.length < 60) return cleaned;
      }
    }
    return null;
  }

  // ============================================================
  // STEP 1: MAIN PRODUCT IMAGE - FROM V10
  // ============================================================
  console.log('📷 Step 1: Finding main product image...');
  
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
  
  // Method 3: Generic selectors
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
  
  // Method 4: Largest non-excluded image
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
      console.log('✅ Main image from largest');
    }
  }

  // ============================================================
  // STEP 2: SWATCH DETECTION - RESTORED FROM V10 (THIS WORKED!)
  // ============================================================
  console.log('🎨 Step 2: Finding color swatch...');
  
  // --- HVL GROUP ---
  if (hostname.includes('hvlgroup.com')) {
    console.log('  Using HVL Group logic...');
    
    const finishIcon = document.querySelector('#productinfo-finish-icon');
    if (finishIcon?.src) {
      data.detectedSwatchUrl = finishIcon.src;
      const nameSpan = document.querySelector('#productinfo-finish-name');
      if (nameSpan) {
        data.detectedSwatchName = nameSpan.innerText.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
      }
      console.log(`✅ HVL finish: ${data.detectedSwatchName}`);
    }
    
    if (!data.detectedSwatchUrl) {
      const selectedFinish = document.querySelector('.finish-options img.border-hvlg-darkgray');
      if (selectedFinish?.src) {
        data.detectedSwatchUrl = selectedFinish.src;
        const nameEl = selectedFinish.closest('a')?.querySelector('span.p2');
        if (nameEl) {
          data.detectedSwatchName = nameEl.innerText.replace(/<br\s*\/?>/gi, ' ').trim();
        }
      }
    }
  }
  
  // --- FOUR HANDS ---
  else if (hostname.includes('fourhands.com')) {
    console.log('  Using Four Hands logic...');
    
    const productDetail = document.querySelector('fh-product-detail');
    if (productDetail) {
      try {
        const vBind = productDetail.getAttribute('v-bind');
        if (vBind) {
          const decoded = vBind.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          const jsonMatch = decoded.match(/\{.*\}/s);
          if (jsonMatch) {
            const productData = JSON.parse(jsonMatch[0]);
            let activeSku = productDetail.getAttribute(':active-sku');
            if (activeSku) activeSku = activeSku.replace(/&quot;/g, '').replace(/"/g, '');
            
            if (productData.product?.skus) {
              for (const sku of productData.product.skus) {
                if (sku.skuNumber === activeSku) {
                  data.detectedSwatchName = sku.name;
                  if (sku.media && Array.isArray(sku.media)) {
                    for (const m of sku.media) {
                      if ((m.thumbUrl || '').includes('ESS') || (m.largeUrl || '').includes('ESS')) {
                        data.detectedSwatchUrl = m.thumbUrl || m.largeUrl;
                        console.log(`✅ Four Hands ESS: ${data.detectedSwatchName}`);
                        break;
                      }
                    }
                  }
                  break;
                }
              }
            }
          }
        }
      } catch (e) {
        console.log('Four Hands parse error:', e.message);
      }
    }
  }
  
  // --- VISUAL COMFORT ---
  else if (hostname.includes('visualcomfort.com')) {
    console.log('  Using Visual Comfort logic...');
    
    const selectedSwatch = document.querySelector('.swatch-option.selected, .swatch-attribute-selected-option');
    if (selectedSwatch && !isInExcludedSection(selectedSwatch)) {
      const bgUrl = getBgImage(selectedSwatch);
      if (bgUrl) data.detectedSwatchUrl = bgUrl;
      data.detectedSwatchName = selectedSwatch.getAttribute('data-option-label') || 
                                selectedSwatch.getAttribute('title') ||
                                selectedSwatch.getAttribute('aria-label');
      console.log(`✅ Visual Comfort swatch: ${data.detectedSwatchName}`);
    }
  }
  
  // --- LOLOI ---
  else if (hostname.includes('loloirugs.com')) {
    console.log('  Using Loloi logic...');
    
    const urlMatch = url.match(/\/products\/([^/?]+)/);
    if (urlMatch) {
      const handle = urlMatch[1];
      const colorMatch = handle.match(/-(\d{2})-(.+)$/);
      if (colorMatch) {
        data.detectedSwatchName = colorMatch[2].replace(/-/g, ' / ').toUpperCase();
        console.log(`✅ Loloi color from URL: ${data.detectedSwatchName}`);
      }
    }
    
    const colorSwatches = document.querySelectorAll('[data-option-name="Color"] .selected, .product-option--color .selected');
    for (const swatch of colorSwatches) {
      const bgUrl = getBgImage(swatch);
      if (bgUrl) {
        data.detectedSwatchUrl = bgUrl;
        data.detectedSwatchName = swatch.getAttribute('data-value') || data.detectedSwatchName;
        break;
      }
    }
  }
  
  // --- UTTERMOST - FROM V10 (THIS WORKED!) ---
  else if (hostname.includes('uttermost.com')) {
    console.log('  Using Uttermost logic (V10 restored)...');
    
    // V10 METHOD: Look for selected swatch tiles with background-image
    const selectedTile = document.querySelector(
      'button[class*="selected"][style*="background-image"],' +
      'button[class*="active"][style*="background-image"],' +
      '[class*="tile"][class*="selected"][style*="background-image"]'
    );
    
    if (selectedTile && !isInExcludedSection(selectedTile)) {
      const bgUrl = getBgImage(selectedTile);
      if (bgUrl) {
        data.detectedSwatchUrl = bgUrl;
        data.detectedSwatchName = getColorName(selectedTile);
        console.log('✅ Uttermost swatch:', data.detectedSwatchName);
      }
    }
    
    // V10 FALLBACK: Look for option containers with "Color" label
    if (!data.detectedSwatchUrl) {
      const optionContainers = document.querySelectorAll('[class*="option"], [class*="configurable"]');
      for (const container of optionContainers) {
        if (isInExcludedSection(container)) continue;
        
        const labels = container.querySelectorAll('span, label, legend');
        let isColorContainer = false;
        for (const lbl of labels) {
          const txt = (lbl.innerText || '').toLowerCase();
          if (txt.includes('color') || txt.includes('finish')) {
            isColorContainer = true;
            break;
          }
        }
        
        if (isColorContainer) {
          const buttons = container.querySelectorAll('button[style*="background-image"]');
          for (const btn of buttons) {
            if (isSelectedElement(btn)) {
              const bgUrl = getBgImage(btn);
              if (bgUrl) {
                data.detectedSwatchUrl = bgUrl;
                data.detectedSwatchName = getColorName(btn);
                console.log('✅ Uttermost color container swatch:', data.detectedSwatchName);
                break;
              }
            }
          }
          if (data.detectedSwatchUrl) break;
        }
      }
    }
  }
  
  // --- ROWE FURNITURE ---
  else if (hostname.includes('rowefurniture.com')) {
    console.log('  Using Rowe Furniture logic...');
    
    const swatchContainers = document.querySelectorAll('[class*="swatch"], [class*="fabric"], [class*="material"]');
    for (const container of swatchContainers) {
      const selected = container.querySelector('.selected, .active, [aria-selected="true"]');
      if (selected) {
        const img = selected.querySelector('img');
        if (img?.src) {
          data.detectedSwatchUrl = img.src;
          data.detectedSwatchName = selected.getAttribute('title') || img.alt;
          console.log(`✅ Rowe swatch: ${data.detectedSwatchName}`);
          break;
        }
        const bgUrl = getBgImage(selected);
        if (bgUrl) {
          data.detectedSwatchUrl = bgUrl;
          data.detectedSwatchName = selected.getAttribute('title');
          break;
        }
      }
    }
  }
  
  // --- REGINA ANDREW ---
  else if (hostname.includes('reginaandrew.com')) {
    console.log('  Using Regina Andrew logic...');
    
    const optionSelectors = document.querySelectorAll('[data-option], .product-views-option, [class*="option"]');
    for (const option of optionSelectors) {
      const label = option.querySelector('label, .option-label, span');
      if (label && ((label.innerText || '').toLowerCase().includes('color') || 
                    (label.innerText || '').toLowerCase().includes('finish'))) {
        const selected = option.querySelector('.active, .selected, [aria-selected="true"]');
        if (selected) {
          const img = selected.querySelector('img');
          if (img?.src) {
            data.detectedSwatchUrl = img.src;
            data.detectedSwatchName = selected.getAttribute('title') || img.alt;
            console.log(`✅ Regina Andrew swatch: ${data.detectedSwatchName}`);
            break;
          }
        }
      }
    }
  }
  
  // --- GENERIC FALLBACK - FROM V10 ---
  if (!data.detectedSwatchUrl) {
    console.log('  Using generic fallback...');
    
    const selectedSwatchSelectors = [
      'button[class*="selected"][style*="background-image"]',
      'button[class*="active"][style*="background-image"]',
      '[class*="swatch"][class*="selected"]',
      '[class*="swatch"][class*="active"]',
      '[class*="color"][class*="selected"]',
      '[class*="color"][class*="active"]',
      '[class*="finish"][class*="selected"]',
      '[class*="finish"][class*="active"]',
      '[aria-selected="true"][style*="background-image"]',
      '[aria-checked="true"][style*="background-image"]'
    ];
    
    for (const selector of selectedSwatchSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (isInExcludedSection(el)) continue;
        
        const bgUrl = getBgImage(el);
        if (bgUrl) {
          data.detectedSwatchUrl = bgUrl;
          data.detectedSwatchName = getColorName(el);
          console.log(`✅ Generic swatch: ${data.detectedSwatchName}`);
          break;
        }
        
        const img = el.querySelector('img');
        if (img && img.src?.startsWith('http')) {
          data.detectedSwatchUrl = img.src;
          data.detectedSwatchName = getColorName(el) || img.alt;
          break;
        }
      }
      if (data.detectedSwatchUrl) break;
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('RESULTS:');
  console.log(`  Vendor: ${data.detectedVendor || 'Unknown'}`);
  console.log(`  Main Image: ${data.mainProductImage ? '✅' : '❌'}`);
  console.log(`  Swatch URL: ${data.detectedSwatchUrl ? '✅' : '❌'}`);
  console.log(`  Swatch Name: ${data.detectedSwatchName || 'Not found'}`);
  if (data.detectedSwatchUrl) console.log(`  ${data.detectedSwatchUrl.substring(0, 70)}...`);
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
