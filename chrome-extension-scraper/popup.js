// ====================================================================
// DESIGN READY PRODUCT SCRAPER v17.0.0 - MULTI-VENDOR TARGETED FIX
// December 30, 2025
// Based on ACTUAL HTML analysis of: Uttermost, Loloi, HVL, VisualComfort, Regina Andrew, Four Hands
// ====================================================================

console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
console.log('🚀 SCRAPER VERSION 17.0.0 - V10 WITH BOTH FIXES - MULTI-VENDOR FIX 🚀');
console.log('🚀 If you see old version, REINSTALL extension! 🚀');
console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');

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
// MAIN SCRAPING FUNCTION - v17.0.0 MULTI-VENDOR
// ============================================================================
function getPageData() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SCRAPER v17.0.0 - MULTI-VENDOR TARGETED FIX              ║');
  console.log('║  Built: December 30, 2025                                  ║');
  console.log('║  Vendors: Uttermost, Loloi, HVL, VisualComfort, Regina,   ║');
  console.log('║           Four Hands, and 20+ more                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
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

  // Detect vendor from hostname
  const vendorDetection = {
    'uttermost.com': 'Uttermost',
    'loloirugs.com': 'Loloi',
    'hvlgroup.com': 'HVL Group',
    'visualcomfort.com': 'Visual Comfort',
    'reginaandrew.com': 'Regina Andrew',
    'fourhands.com': 'Four Hands',
    'globalviews.com': 'Global Views',
    'hubbardtonforge.com': 'Hubbardton Forge',
    'arteriorshome.com': 'Arteriors',
    'currey.com': 'Currey & Company',
    'bernhardt.com': 'Bernhardt',
    'universalfurniture.com': 'Universal Furniture',
    'centuryfurniture.com': 'Century Furniture',
    'kravet.com': 'Kravet',
    'phillipscollection.com': 'Phillips Collection',
    'sarreid.com': 'Sarreid',
    'johnrichard.com': 'John Richard',
    'maitland-smith.com': 'Maitland Smith',
    'hickorychair.com': 'Hickory Chair',
    'woodbridge-?"furniture.com': 'Woodbridge',
    'theodorealexander.com': 'Theodore Alexander',
    'caracole.com': 'Caracole',
    'lefroyfurniture.com': 'Lefroy',
    'palecek.com': 'Palecek',
    'serenaandlily.com': 'Serena & Lily'
  };
  
  for (const [domain, vendor] of Object.entries(vendorDetection)) {
    if (hostname.includes(domain.replace('www.', ''))) {
      data.detectedVendor = vendor;
      console.log(`🏪 Detected Vendor: ${vendor}`);
      break;
    }
  }

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  // CRITICAL: Check if element is in EXCLUDED sections (Related Products, Similar Items, etc.)
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
          console.log(`❌ EXCLUDED: ${pattern} in`, classes.substring(0, 40) || id || tagName);
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

  // Get background-image URL from element
  function getBgImage(el) {
    if (!el) return null;
    
    // Check inline style attribute first (most reliable)
    const inlineStyle = el.getAttribute('style') || '';
    const bgMatch = inlineStyle.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (bgMatch && bgMatch[1]) {
      let url = bgMatch[1];
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = window.location.origin + url;
      if (url.startsWith('http') && !url.includes('data:')) return url;
    }
    
    // Check computed style
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

  // Check if element appears to be selected/active
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

  // Extract color/finish name from element
  function getColorName(el) {
    if (!el) return null;
    
    // Priority order for color name extraction
    const sources = [
      el.getAttribute('title'),
      el.getAttribute('data-color'),
      el.getAttribute('data-value'),
      el.getAttribute('data-option-value'),
      el.getAttribute('data-name'),
      el.getAttribute('data-finish'),
      el.getAttribute('alt'),
      el.querySelector('span')?.innerText,
      el.innerText?.trim()
    ];
    
    for (const src of sources) {
      if (src && src.length > 0 && src.length < 60) {
        // Clean up common prefixes/suffixes
        let cleaned = src.replace(/^(color|finish|option|select|choose|fashion size|button)[\s:]+/gi, '');
        cleaned = cleaned.replace(/\s*(button|selected|option|click|choose)$/gi, '');
        cleaned = cleaned.trim();
        if (cleaned.length > 0 && cleaned.length < 60) return cleaned;
      }
    }
    
    // Try aria-label as last resort
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
      let cleaned = ariaLabel.replace(/^(color|finish|option|select|choose|fashion size|button)[\s:]+/gi, '');
      cleaned = cleaned.replace(/\s*(button|selected|option|click|choose)$/gi, '');
      cleaned = cleaned.trim();
      if (cleaned.length > 0 && cleaned.length < 60) return cleaned;
    }
    
    return null;
  }

  // ============================================================
  // VENDOR-SPECIFIC SCRAPING LOGIC
  // ============================================================
  
  console.log('=== STEP 1: MAIN PRODUCT IMAGE ===');
  
  // Method 1: og:image meta tag (most reliable across all vendors)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('✅ Main image from og:image:', data.mainProductImage.substring(0, 80));
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
  
  // Method 3: Generic gallery/product image selectors
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
      console.log('✅ Main image from largest non-excluded');
    }
  }

  // ============================================================
  // STEP 2: COLOR SWATCH DETECTION (VENDOR-SPECIFIC)
  // ============================================================
  console.log('');
  console.log('=== STEP 2: COLOR SWATCH DETECTION ===');
  
  // --- HVL GROUP SPECIFIC ---
  if (hostname.includes('hvlgroup.com')) {
    console.log('🎯 Using HVL Group specific logic');
    
    // HVL uses .finish-options with circular images
    const finishOptions = document.querySelector('.finish-options');
    if (finishOptions && !isInExcludedSection(finishOptions)) {
      // Look for selected finish (has border-hvlg-darkgray class)
      const selectedFinish = finishOptions.querySelector('img.border-hvlg-darkgray, img[class*="selected"]');
      if (selectedFinish) {
        data.detectedSwatchUrl = selectedFinish.src;
        // Get name from sibling span
        const nameSpan = selectedFinish.closest('div')?.querySelector('span.p2, span[id*="finish-name"]');
        if (nameSpan) {
          data.detectedSwatchName = nameSpan.innerText.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
        }
        console.log('✅ HVL finish:', data.detectedSwatchName, data.detectedSwatchUrl?.substring(0, 60));
      }
    }
  }
  
  // --- FOUR HANDS SPECIFIC ---
  else if (hostname.includes('fourhands.com')) {
    console.log('🎯 Using Four Hands specific logic');
    
    // Four Hands embeds product data as JSON in fh-product-detail component
    const productDetail = document.querySelector('fh-product-detail');
    if (productDetail) {
      try {
        const vBind = productDetail.getAttribute('v-bind') || productDetail.getAttribute(':product');
        if (vBind) {
          // Parse the JSON data
          const jsonMatch = vBind.match(/\{.*\}/s);
          if (jsonMatch) {
            const decoded = jsonMatch[0].replace(/&quot;/g, '"');
            const productData = JSON.parse(decoded);
            
            // Get active SKU info
            const activeSku = productDetail.getAttribute(':active-sku') || 
                             document.querySelector('[activeSku]')?.getAttribute('activeSku');
            
            if (productData.product?.skus) {
              for (const sku of productData.product.skus) {
                if (sku.skuNumber === activeSku || sku.inStock) {
                  data.detectedSwatchName = sku.name; // e.g., "Sapphire Navy"
                  // Get the ESS (essence/swatch) image if available
                  const essImage = sku.media?.find(m => m.thumbUrl?.includes('ESS'));
                  if (essImage) {
                    data.detectedSwatchUrl = essImage.thumbUrl || essImage.largeUrl;
                  }
                  console.log('✅ Four Hands color:', data.detectedSwatchName);
                  break;
                }
              }
            }
          }
        }
      } catch(e) {
        console.log('Four Hands JSON parse error:', e.message);
      }
    }
  }
  
  // --- LOLOI SPECIFIC ---
  else if (hostname.includes('loloirugs.com')) {
    console.log('🎯 Using Loloi specific logic');
    
    // Loloi embeds product data in ShopifyAnalytics.meta
    const shopifyMeta = window.ShopifyAnalytics?.meta?.product;
    if (shopifyMeta) {
      // Color is usually in the product title after the SKU prefix
      const title = shopifyMeta.handle || '';
      const colorMatch = title.match(/\d{2}-(\w+)-(\w+)/i); // e.g., "rom-03-ivory-granite"
      if (colorMatch) {
        data.detectedSwatchName = `${colorMatch[1]} / ${colorMatch[2]}`.toUpperCase();
        console.log('✅ Loloi color from handle:', data.detectedSwatchName);
      }
    }
    
    // Look for color swatch elements
    if (!data.detectedSwatchName) {
      const colorOption = document.querySelector('.product-option--color .selected, [data-option-name="Color"] .selected');
      if (colorOption) {
        data.detectedSwatchName = colorOption.getAttribute('data-value') || colorOption.innerText?.trim();
        const bgUrl = getBgImage(colorOption);
        if (bgUrl) data.detectedSwatchUrl = bgUrl;
      }
    }
  }
  
  // --- VISUAL COMFORT SPECIFIC ---
  else if (hostname.includes('visualcomfort.com')) {
    console.log('🎯 Using Visual Comfort specific logic');
    
    // Visual Comfort uses Magento with swatch options
    const selectedSwatch = document.querySelector('.swatch-option.selected, .swatch-attribute-selected-option');
    if (selectedSwatch && !isInExcludedSection(selectedSwatch)) {
      const bgUrl = getBgImage(selectedSwatch);
      if (bgUrl) data.detectedSwatchUrl = bgUrl;
      data.detectedSwatchName = selectedSwatch.getAttribute('data-option-label') || 
                                selectedSwatch.getAttribute('title') ||
                                selectedSwatch.getAttribute('aria-label');
      console.log('✅ Visual Comfort swatch:', data.detectedSwatchName);
    }
    
    // Also check for finish selector
    if (!data.detectedSwatchName) {
      const finishLabel = document.querySelector('.swatch-attribute-label, [data-attribute-code="finish"]');
      if (finishLabel) {
        const selectedOption = finishLabel.closest('.swatch-attribute')?.querySelector('.selected');
        if (selectedOption) {
          data.detectedSwatchName = selectedOption.getAttribute('data-option-label');
        }
      }
    }
  }
  
  // --- REGINA ANDREW SPECIFIC ---
  else if (hostname.includes('reginaandrew.com')) {
    console.log('🎯 Using Regina Andrew specific logic');
    
    // Regina Andrew uses NetSuite/SuiteCommerce
    // Look for finish/color selectors
    const finishSelector = document.querySelector('[data-option="Finish"], [data-option="Color"], .product-views-option-color');
    if (finishSelector && !isInExcludedSection(finishSelector)) {
      const selectedOption = finishSelector.querySelector('.active, .selected, [aria-selected="true"]');
      if (selectedOption) {
        data.detectedSwatchName = selectedOption.getAttribute('data-value') || 
                                  selectedOption.getAttribute('title') ||
                                  selectedOption.innerText?.trim();
        const bgUrl = getBgImage(selectedOption);
        if (bgUrl) data.detectedSwatchUrl = bgUrl;
      }
    }
  }
  
  // --- UTTERMOST SPECIFIC ---
  else if (hostname.includes('uttermost.com')) {
    console.log('🎯 Using Uttermost specific logic');
    
    // Uttermost uses React/Venia PWA with specific class patterns
    // Look for selected swatch tiles with background-image
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
        console.log('✅ Uttermost swatch:', data.detectedSwatchName, bgUrl?.substring(0, 60));
      }
    }
    
    // Also look for option containers with "Color" label
    if (!data.detectedSwatchUrl) {
      const optionContainers = document.querySelectorAll('[class*="option"], [class*="configurable"]');
      for (const container of optionContainers) {
        if (isInExcludedSection(container)) continue;
        
        // Check for Color/Finish label
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
          // Find selected button with background-image
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
  
  // ============================================================
  // GENERIC SWATCH DETECTION (FALLBACK)
  // ============================================================
  if (!data.detectedSwatchUrl) {
    console.log('🔍 Using generic swatch detection...');
    
    // Priority 1: Selected swatches with background-image
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
          console.log(`✅ Generic swatch from ${selector}:`, data.detectedSwatchName);
          break;
        }
        
        // Also check for img child
        const img = el.querySelector('img');
        if (img && img.src?.startsWith('http')) {
          data.detectedSwatchUrl = img.src;
          data.detectedSwatchName = getColorName(el) || img.alt;
          console.log('✅ Generic swatch from img child:', data.detectedSwatchName);
          break;
        }
      }
      if (data.detectedSwatchUrl) break;
    }
    
    // Priority 2: Look for color/finish option containers
    if (!data.detectedSwatchUrl) {
      const optionGroups = document.querySelectorAll(
        '[class*="option-group"], [class*="variant-group"], [class*="swatch-container"],' +
        '[data-option], [data-variant], [class*="product-option"]'
      );
      
      for (const group of optionGroups) {
        if (isInExcludedSection(group)) continue;
        
        // Check if this is a color/finish group
        const headerText = group.querySelector('label, legend, span, h3, h4')?.innerText?.toLowerCase() || '';
        if (!headerText.includes('color') && !headerText.includes('finish') && 
            !headerText.includes('fabric') && !headerText.includes('material')) {
          continue;
        }
        
        // Find selected option in this group
        const selectedOption = group.querySelector('.selected, .active, [aria-selected="true"], [aria-checked="true"]');
        if (selectedOption) {
          const bgUrl = getBgImage(selectedOption);
          if (bgUrl) {
            data.detectedSwatchUrl = bgUrl;
            data.detectedSwatchName = getColorName(selectedOption);
            console.log('✅ Generic swatch from option group:', data.detectedSwatchName);
            break;
          }
          
          const img = selectedOption.querySelector('img');
          if (img && img.src?.startsWith('http')) {
            data.detectedSwatchUrl = img.src;
            data.detectedSwatchName = getColorName(selectedOption) || img.alt;
            console.log('✅ Generic swatch img from option group:', data.detectedSwatchName);
            break;
          }
        }
      }
    }
  }
  
  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SCRAPE RESULTS                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Vendor:', data.detectedVendor || 'Unknown');
  console.log('║ Main Image:', data.mainProductImage ? '✅ Found' : '❌ Not found');
  console.log('║ Swatch URL:', data.detectedSwatchUrl ? '✅ Found' : '❌ Not found');
  console.log('║ Swatch Name:', data.detectedSwatchName || 'Not found');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  if (data.mainProductImage) {
    console.log('📷 Main:', data.mainProductImage.substring(0, 80) + '...');
  }
  if (data.detectedSwatchUrl) {
    console.log('🎨 Swatch:', data.detectedSwatchUrl.substring(0, 80) + '...');
  }
  
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
    
    console.log('Page data from content script:', pageData);
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
    console.log('AI extracted data:', aiData);
    
    // Combine AI data with our client-side detection
    // Client-side detection takes priority for images and swatches
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
    
    console.log('Final combined data:', finalData);
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

// Auto-detect vendor on popup open
(async () => {
  try {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (t?.url) {
      const hostname = new URL(t.url).hostname.toLowerCase();
      const vendorMap = {
        'uttermost.com': 'Uttermost',
        'loloirugs.com': 'Loloi',
        'hvlgroup.com': 'HVL Group',
        'visualcomfort.com': 'Visual Comfort',
        'reginaandrew.com': 'Regina Andrew',
        'fourhands.com': 'Four Hands',
        'globalviews.com': 'Global Views',
        'hubbardtonforge.com': 'Hubbardton Forge',
        'arteriorshome.com': 'Arteriors',
        'currey.com': 'Currey & Company'
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
        // Fallback: capitalize first part of domain
        const d = hostname.replace('www.', '');
        let v = d.split('.')[0];
        v = v.charAt(0).toUpperCase() + v.slice(1);
        vendorBadge.textContent = v;
        vendorBadge.style.display = 'block';
      }
    }
  } catch (e) {}
})();
