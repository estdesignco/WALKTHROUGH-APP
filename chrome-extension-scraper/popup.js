// ====================================================================
// DESIGN READY PRODUCT SCRAPER v12.0.0 - FIXED SWATCH DETECTION
// December 30, 2025
// ACTUAL WORKING SELECTORS based on real HTML from vendor sites
// ====================================================================

console.log('');
console.log('████████████████████████████████████████████████████████████████');
console.log('██  SCRAPER VERSION 12.0.0 - SWATCH DETECTION FIXED           ██');
console.log('██  TESTED WITH REAL HTML FROM: HVL, Four Hands, Loloi,       ██');
console.log('██  Visual Comfort, Uttermost, Rowe                            ██');
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
// MAIN SCRAPING FUNCTION - v12.0.0 WITH ACTUAL WORKING SELECTORS
// ============================================================================
function getPageData() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SCRAPER v12.0.0 - SWATCH DETECTION FIXED                 ║');
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

  // ============================================================
  // STEP 1: MAIN PRODUCT IMAGE
  // ============================================================
  console.log('📷 Finding main product image...');
  
  // og:image is most reliable
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content?.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('  ✓ og:image found');
  }
  
  // Fallback to common selectors
  if (!data.mainProductImage) {
    const selectors = [
      '.product-image img', '.product-media img', '.pdp-image img',
      '.gallery-image img', '.product-gallery img', '.main-image img',
      '.slick-active img', '.swiper-slide-active img'
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img?.src?.startsWith('http')) {
        data.mainProductImage = img.src;
        console.log(`  ✓ Found via ${sel}`);
        break;
      }
    }
  }

  // ============================================================
  // STEP 2: VENDOR-SPECIFIC SWATCH DETECTION
  // Each vendor has completely different HTML structure
  // ============================================================
  console.log('🎨 Finding color swatch...');

  // ---------------------------------------------------------
  // HVL GROUP / HUDSON VALLEY
  // Uses: #productinfo-finish-icon, .finish-options img
  // ---------------------------------------------------------
  if (hostname.includes('hvlgroup.com')) {
    console.log('  Using HVL Group selectors...');
    
    // Method 1: productinfo-finish-icon (the selected finish)
    const finishIcon = document.querySelector('#productinfo-finish-icon');
    if (finishIcon?.src) {
      data.detectedSwatchUrl = finishIcon.src;
      // Get name from nearby span
      const nameSpan = document.querySelector('#productinfo-finish-name');
      if (nameSpan) {
        data.detectedSwatchName = nameSpan.innerText.replace(/\n/g, ' ').replace(/\(.*\)/, '').trim();
      }
      console.log(`  ✓ HVL finish: ${data.detectedSwatchName}`);
    }
    
    // Method 2: .finish-options with border-hvlg-darkgray (selected)
    if (!data.detectedSwatchUrl) {
      const selectedFinish = document.querySelector('.finish-options img.border-hvlg-darkgray');
      if (selectedFinish?.src) {
        data.detectedSwatchUrl = selectedFinish.src;
        const nameEl = selectedFinish.closest('a')?.querySelector('span.p2');
        if (nameEl) {
          data.detectedSwatchName = nameEl.innerText.replace(/\n/g, ' ').replace(/\(.*\)/, '').trim();
        }
        console.log(`  ✓ HVL selected finish: ${data.detectedSwatchName}`);
      }
    }
    
    // Method 3: productinfo-swatch-icon
    if (!data.detectedSwatchUrl) {
      const swatchIcon = document.querySelector('#productinfo-swatch-icon');
      if (swatchIcon?.src) {
        data.detectedSwatchUrl = swatchIcon.src;
        const swatchDiv = swatchIcon.closest('div')?.querySelector('div');
        if (swatchDiv) {
          data.detectedSwatchName = swatchDiv.innerText.replace('Swatch', '').trim();
        }
        console.log(`  ✓ HVL swatch icon: ${data.detectedSwatchName}`);
      }
    }
  }

  // ---------------------------------------------------------
  // FOUR HANDS
  // Uses: fh-product-detail with JSON data, ESS images are swatches
  // ---------------------------------------------------------
  else if (hostname.includes('fourhands.com')) {
    console.log('  Using Four Hands selectors...');
    
    // Method 1: Parse JSON from fh-product-detail
    const productDetail = document.querySelector('fh-product-detail');
    if (productDetail) {
      try {
        const vBind = productDetail.getAttribute('v-bind');
        if (vBind) {
          // Decode HTML entities
          const decoded = vBind.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          const jsonMatch = decoded.match(/\{.*\}/s);
          if (jsonMatch) {
            const productData = JSON.parse(jsonMatch[0]);
            const activeSku = productDetail.getAttribute(':active-sku')?.replace(/&quot;/g, '"') || 
                             productData.activeSku;
            
            // Find the active SKU's data
            if (productData.product?.skus) {
              for (const sku of productData.product.skus) {
                if (sku.skuNumber === activeSku) {
                  data.detectedSwatchName = sku.name; // e.g., "Sapphire Navy"
                  
                  // Find ESS image (the swatch/essence image)
                  if (sku.media) {
                    for (const m of sku.media) {
                      if (m.thumbUrl?.includes('_ESS') || m.largeUrl?.includes('_ESS')) {
                        data.detectedSwatchUrl = m.thumbUrl || m.largeUrl;
                        console.log(`  ✓ Four Hands ESS swatch: ${data.detectedSwatchName}`);
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
        console.log('  Four Hands JSON parse error:', e.message);
      }
    }
    
    // Method 2: Look for SKU selector buttons
    if (!data.detectedSwatchUrl) {
      const activeSkuBtn = document.querySelector('[class*="sku"][class*="active"], [class*="variant"][class*="selected"]');
      if (activeSkuBtn) {
        const img = activeSkuBtn.querySelector('img');
        if (img?.src) {
          data.detectedSwatchUrl = img.src;
          data.detectedSwatchName = activeSkuBtn.getAttribute('title') || activeSkuBtn.innerText?.trim();
        }
      }
    }
  }

  // ---------------------------------------------------------
  // VISUAL COMFORT
  // Uses: Magento swatch system with .swatch-option
  // ---------------------------------------------------------
  else if (hostname.includes('visualcomfort.com')) {
    console.log('  Using Visual Comfort selectors...');
    
    // Method 1: Selected swatch option
    const selectedSwatch = document.querySelector('.swatch-option.selected, .swatch-attribute-selected-option');
    if (selectedSwatch) {
      // Get background-image
      const style = selectedSwatch.getAttribute('style') || '';
      const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
      if (bgMatch?.[1]) {
        let bgUrl = bgMatch[1];
        if (bgUrl.startsWith('//')) bgUrl = 'https:' + bgUrl;
        data.detectedSwatchUrl = bgUrl;
      }
      data.detectedSwatchName = selectedSwatch.getAttribute('data-option-label') || 
                                selectedSwatch.getAttribute('title') ||
                                selectedSwatch.getAttribute('aria-label');
      console.log(`  ✓ Visual Comfort swatch: ${data.detectedSwatchName}`);
    }
    
    // Method 2: Look for swatch images
    if (!data.detectedSwatchUrl) {
      const swatchImgs = document.querySelectorAll('.swatch-option img, [class*="swatch"] img');
      for (const img of swatchImgs) {
        const parent = img.closest('.selected, .active, [aria-selected="true"]');
        if (parent && img.src) {
          data.detectedSwatchUrl = img.src;
          data.detectedSwatchName = parent.getAttribute('title') || img.alt;
          console.log(`  ✓ Visual Comfort swatch img: ${data.detectedSwatchName}`);
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------
  // LOLOI RUGS
  // Shopify site - color is in product handle, no swatch images
  // ---------------------------------------------------------
  else if (hostname.includes('loloirugs.com')) {
    console.log('  Using Loloi selectors...');
    
    // Color is usually in the URL/handle
    const urlMatch = url.match(/\/products\/([^/?]+)/);
    if (urlMatch) {
      const handle = urlMatch[1]; // e.g., "rom-03-ivory-granite"
      const colorMatch = handle.match(/-(\d{2})-(.+)$/);
      if (colorMatch) {
        const colorPart = colorMatch[2].replace(/-/g, ' / ').toUpperCase();
        data.detectedSwatchName = colorPart;
        console.log(`  ✓ Loloi color from URL: ${data.detectedSwatchName}`);
      }
    }
    
    // Try to find color swatch if exists
    const colorSwatches = document.querySelectorAll('[data-option-name="Color"] .selected, .product-option--color .selected');
    for (const swatch of colorSwatches) {
      const style = swatch.getAttribute('style') || '';
      const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
      if (bgMatch?.[1]) {
        data.detectedSwatchUrl = bgMatch[1].startsWith('//') ? 'https:' + bgMatch[1] : bgMatch[1];
        data.detectedSwatchName = swatch.getAttribute('data-value') || data.detectedSwatchName;
        console.log(`  ✓ Loloi swatch: ${data.detectedSwatchName}`);
        break;
      }
    }
  }

  // ---------------------------------------------------------
  // UTTERMOST
  // React PWA - color swatches are small square buttons with background-image
  // The selected one has aria-checked="true" or class contains "selected"
  // ---------------------------------------------------------
  else if (hostname.includes('uttermost.com')) {
    console.log('  Using Uttermost selectors...');
    
    // Find ALL buttons with background-image (potential swatches)
    const allBgButtons = document.querySelectorAll('button[style*="background-image"]');
    console.log(`  Found ${allBgButtons.length} buttons with background-image`);
    
    // Filter to find actual color swatches (small square buttons, not product images)
    for (const btn of allBgButtons) {
      const style = btn.getAttribute('style') || '';
      const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
      if (!bgMatch?.[1]) continue;
      
      let bgUrl = bgMatch[1];
      if (bgUrl.startsWith('//')) bgUrl = 'https:' + bgUrl;
      
      // Skip if this looks like a main product image (large dimensions in URL or not a swatch)
      const urlLower = bgUrl.toLowerCase();
      if (urlLower.includes('/product/') && !urlLower.includes('swatch') && !urlLower.includes('color')) {
        continue; // This is likely a product image, not a swatch
      }
      
      // Check if selected
      const classes = (btn.className || '').toLowerCase();
      const ariaChecked = btn.getAttribute('aria-checked');
      const ariaSelected = btn.getAttribute('aria-selected');
      const isSelected = classes.includes('selected') || classes.includes('active') ||
                         ariaChecked === 'true' || ariaSelected === 'true';
      
      if (isSelected) {
        data.detectedSwatchUrl = bgUrl;
        data.detectedSwatchName = btn.getAttribute('title') || btn.getAttribute('aria-label');
        console.log(`  ✓ Uttermost swatch: ${data.detectedSwatchName} - ${bgUrl.substring(0, 60)}`);
        break;
      }
    }
    
    // Method 2: Find "Color" section and get selected swatch
    if (!data.detectedSwatchUrl) {
      // Look for sections/containers with "Color" in text
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const directText = el.childNodes[0]?.textContent?.trim() || '';
        if (directText.toLowerCase() === 'color') {
          // This element labels a color section, look for swatches nearby
          const parent = el.parentElement;
          if (parent) {
            const swatchBtns = parent.querySelectorAll('button[style*="background-image"]');
            for (const btn of swatchBtns) {
              const ariaChecked = btn.getAttribute('aria-checked');
              if (ariaChecked === 'true') {
                const style = btn.getAttribute('style') || '';
                const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
                if (bgMatch?.[1]) {
                  data.detectedSwatchUrl = bgMatch[1].startsWith('//') ? 'https:' + bgMatch[1] : bgMatch[1];
                  data.detectedSwatchName = btn.getAttribute('title') || btn.getAttribute('aria-label');
                  console.log(`  ✓ Uttermost color section swatch: ${data.detectedSwatchName}`);
                  break;
                }
              }
            }
          }
          if (data.detectedSwatchUrl) break;
        }
      }
    }
    
    // Method 3: Look for tile-root classes (Uttermost uses these)
    if (!data.detectedSwatchUrl) {
      const tileButtons = document.querySelectorAll('[class*="tile"][style*="background-image"]');
      for (const btn of tileButtons) {
        const classes = (btn.className || '').toLowerCase();
        if (classes.includes('selected') || btn.getAttribute('aria-checked') === 'true') {
          const style = btn.getAttribute('style') || '';
          const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
          if (bgMatch?.[1]) {
            data.detectedSwatchUrl = bgMatch[1].startsWith('//') ? 'https:' + bgMatch[1] : bgMatch[1];
            data.detectedSwatchName = btn.getAttribute('title');
            console.log(`  ✓ Uttermost tile swatch: ${data.detectedSwatchName}`);
            break;
          }
        }
      }
    }
  }

  // ---------------------------------------------------------
  // ROWE FURNITURE
  // Custom platform - fabric swatches
  // ---------------------------------------------------------
  else if (hostname.includes('rowefurniture.com')) {
    console.log('  Using Rowe Furniture selectors...');
    
    // Look for fabric/material swatch selectors
    const swatchContainers = document.querySelectorAll('[class*="swatch"], [class*="fabric"], [class*="material"]');
    for (const container of swatchContainers) {
      const selected = container.querySelector('.selected, .active, [aria-selected="true"]');
      if (selected) {
        const img = selected.querySelector('img');
        if (img?.src) {
          data.detectedSwatchUrl = img.src;
          data.detectedSwatchName = selected.getAttribute('title') || selected.getAttribute('data-name') || img.alt;
          console.log(`  ✓ Rowe swatch: ${data.detectedSwatchName}`);
          break;
        }
        // Check for background-image
        const style = selected.getAttribute('style') || '';
        const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
        if (bgMatch?.[1]) {
          data.detectedSwatchUrl = bgMatch[1].startsWith('//') ? 'https:' + bgMatch[1] : bgMatch[1];
          data.detectedSwatchName = selected.getAttribute('title') || selected.getAttribute('data-name');
          console.log(`  ✓ Rowe swatch bg: ${data.detectedSwatchName}`);
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------
  // REGINA ANDREW
  // NetSuite/SuiteCommerce
  // ---------------------------------------------------------
  else if (hostname.includes('reginaandrew.com')) {
    console.log('  Using Regina Andrew selectors...');
    
    // Look for product options
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
            console.log(`  ✓ Regina Andrew swatch: ${data.detectedSwatchName}`);
            break;
          }
        }
      }
    }
  }

  // ---------------------------------------------------------
  // GENERIC FALLBACK for other vendors
  // ---------------------------------------------------------
  else {
    console.log('  Using generic swatch detection...');
    
    // Generic selected swatch selectors
    const genericSelectors = [
      '[class*="swatch"][class*="selected"] img',
      '[class*="swatch"][class*="active"] img',
      '[class*="color"][class*="selected"] img',
      '[class*="finish"][class*="selected"] img',
      '[aria-selected="true"] img',
      '.selected[style*="background-image"]',
      '.active[style*="background-image"]'
    ];
    
    for (const sel of genericSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        if (el.tagName === 'IMG' && el.src) {
          data.detectedSwatchUrl = el.src;
          data.detectedSwatchName = el.alt || el.closest('[title]')?.getAttribute('title');
          console.log(`  ✓ Generic swatch img: ${data.detectedSwatchName}`);
          break;
        } else {
          const style = el.getAttribute('style') || '';
          const bgMatch = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
          if (bgMatch?.[1]) {
            data.detectedSwatchUrl = bgMatch[1].startsWith('//') ? 'https:' + bgMatch[1] : bgMatch[1];
            data.detectedSwatchName = el.getAttribute('title');
            console.log(`  ✓ Generic swatch bg: ${data.detectedSwatchName}`);
            break;
          }
        }
      }
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('RESULTS:');
  console.log(`  Vendor: ${data.detectedVendor || 'Unknown'}`);
  console.log(`  Main Image: ${data.mainProductImage ? '✓ FOUND' : '✗ NOT FOUND'}`);
  console.log(`  Swatch URL: ${data.detectedSwatchUrl ? '✓ FOUND' : '✗ NOT FOUND'}`);
  console.log(`  Swatch Name: ${data.detectedSwatchName || 'Not found'}`);
  if (data.detectedSwatchUrl) {
    console.log(`  Swatch: ${data.detectedSwatchUrl.substring(0, 60)}...`);
  }
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
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData
    });
    
    const pageData = results[0].result;
    if (!pageData?.pageText) {
      throw new Error('Could not read page content');
    }
    
    console.log('Page data:', pageData);
    showStatus('AI analyzing...', 'info');
    
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
      throw new Error(err.detail || 'AI failed');
    }
    
    const aiData = await response.json();
    console.log('AI data:', aiData);
    
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
    console.error('Error:', e);
    showStatus(e.message || 'Failed', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
}

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
    showStatus('Sent!', 'success');
  } catch (e) {
    showStatus('Failed', 'error');
  } finally {
    sendBtn.disabled = false;
  }
}

async function copyToClipboard() {
  if (!scrapedData) return;
  try {
    const text = [scrapedData.name, scrapedData.sku, scrapedData.price ? `$${scrapedData.price}` : '', 
                  scrapedData.vendor, scrapedData.finish_color, scrapedData.size].filter(x => x).join('\n');
    await navigator.clipboard.writeText(text);
    copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
    setTimeout(() => { copyBtn.innerHTML = '<span>📋</span><span>Copy</span>'; }, 2000);
  } catch (e) {}
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
