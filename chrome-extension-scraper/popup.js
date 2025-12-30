// Design Ready Product Scraper v9.6.0 - UTTERMOST STRUCTURE FIX
// December 30, 2025
// Based on actual Uttermost HTML analysis

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
// v9.6.0 - UTTERMOST STRUCTURE-BASED FIX
// ============================================
function getPageData() {
  console.log('🔧🔧🔧 SCRAPER v9.6.0 - UTTERMOST FIX 🔧🔧🔧');
  
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: window.location.href,
    mainProductImage: null,
    swatchImages: [],
    detectedSwatchUrl: null,
    detectedSwatchName: null
  };

  // CRITICAL: Check if element is in EXCLUDED sections
  function isInExcludedSection(el) {
    let parent = el;
    for (let i = 0; i < 20 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      const tagName = parent.tagName?.toLowerCase() || '';
      
      // EXCLUDED SECTIONS - be very thorough
      if (
        // Related/Similar products (Uttermost uses RelatedProducts)
        classes.includes('relatedproducts') ||
        classes.includes('related-products') ||
        classes.includes('similar') ||
        classes.includes('recommend') ||
        classes.includes('also-like') ||
        classes.includes('you-may') ||
        classes.includes('cross-sell') ||
        classes.includes('upsell') ||
        classes.includes('recently-viewed') ||
        // IDs
        id.includes('related') ||
        id.includes('similar') ||
        id.includes('recommend') ||
        id.includes('recently') ||
        // Navigation/Header/Footer
        tagName === 'nav' ||
        tagName === 'header' ||
        tagName === 'footer' ||
        classes.includes('nav-') ||
        classes.includes('header-') ||
        classes.includes('footer-') ||
        classes.includes('menu') ||
        classes.includes('sidebar') ||
        classes.includes('modal') ||
        // Social/External widgets
        classes.includes('candid') ||
        classes.includes('getcandid') ||
        classes.includes('instagram') ||
        classes.includes('social')
      ) {
        console.log('❌ EXCLUDED SECTION:', classes.substring(0, 50) || id || tagName);
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  // Get background image from element
  function getBgImage(el) {
    // Check inline style first
    const inlineStyle = el.getAttribute('style') || '';
    const bgMatch = inlineStyle.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (bgMatch && bgMatch[1]) {
      let url = bgMatch[1];
      if (url.startsWith('/')) url = window.location.origin + url;
      if (url.startsWith('http')) return url;
    }
    
    // Check computed style
    try {
      const computed = window.getComputedStyle(el).backgroundImage;
      if (computed && computed !== 'none') {
        const match = computed.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1] && !match[1].includes('data:') && !match[1].includes('gradient')) {
          let url = match[1];
          if (url.startsWith('/')) url = window.location.origin + url;
          if (url.startsWith('http')) return url;
        }
      }
    } catch(e) {}
    return null;
  }

  // Check if element is a selected swatch
  function isSelectedSwatch(el) {
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || 
           classes.includes('active') || 
           classes.includes('current') || 
           classes.includes('checked') ||
           el.getAttribute('aria-selected') === 'true' ||
           el.getAttribute('aria-checked') === 'true';
  }

  // Get color name from element
  function getColorName(el) {
    // Priority: title > data-* > alt > aria-label
    const title = el.getAttribute('title');
    if (title && title.length < 50) return title.trim();
    
    const dataColor = el.getAttribute('data-color') || el.getAttribute('data-value') || 
                      el.getAttribute('data-option-value') || el.getAttribute('data-name');
    if (dataColor && dataColor.length < 50) return dataColor.trim();
    
    const alt = el.getAttribute('alt');
    if (alt && alt.length < 50) return alt.trim();
    
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
      // Clean up aria-label (e.g., "Fashion size Porcelain button selected" -> "Porcelain")
      const cleaned = ariaLabel.replace(/fashion size|button|selected|option|click|choose/gi, '').trim();
      if (cleaned.length > 0 && cleaned.length < 50) return cleaned;
    }
    
    return null;
  }

  // ========================================
  // 1. FIND MAIN PRODUCT IMAGE
  // ========================================
  console.log('=== STEP 1: FINDING MAIN PRODUCT IMAGE ===');
  
  // Method 1: og:image (most reliable)
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('✅ Main from og:image:', data.mainProductImage.substring(0, 80));
  }
  
  // Method 2: Active slide in product gallery (Uttermost uses swiper)
  if (!data.mainProductImage) {
    const activeSlide = document.querySelector('.swiper-slide-active img, .slick-active img, .carousel-item.active img');
    if (activeSlide && !isInExcludedSection(activeSlide)) {
      const src = activeSlide.src || activeSlide.dataset.src;
      if (src?.startsWith('http')) {
        data.mainProductImage = src;
        console.log('✅ Main from active slide:', data.mainProductImage.substring(0, 80));
      }
    }
  }
  
  // Method 3: Product detail image containers
  if (!data.mainProductImage) {
    const selectors = [
      '.productSlider-root img',
      '.product-media img',
      '.product-image-container img',
      '.gallery-image img',
      '.pdp-gallery img',
      '[data-gallery-role="main"] img'
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img && !isInExcludedSection(img)) {
        const src = img.src || img.dataset.src;
        if (src?.startsWith('http')) {
          data.mainProductImage = src;
          console.log('✅ Main from selector:', sel);
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
      if (lower.endsWith('.svg') || lower.includes('icon') || lower.includes('logo')) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w < 200 || h < 200) return;
      const size = w * h;
      if (size > bestSize) { bestSize = size; bestImg = src; }
    });
    if (bestImg) {
      data.mainProductImage = bestImg;
      console.log('✅ Main from largest image');
    }
  }

  // ========================================
  // 2. FIND SELECTED COLOR SWATCH
  // ========================================
  console.log('=== STEP 2: FINDING COLOR SWATCH ===');
  
  // PRIORITY 1: Look for explicitly selected swatch buttons with background-image
  // This is how Uttermost works: tile-root_selected-Au1 with background-image style
  const swatchSelectors = [
    // Uttermost-style: button with tile-root_selected class
    'button[class*="selected"][style*="background-image"]',
    'button[class*="active"][style*="background-image"]',
    // Generic selected swatches
    '[class*="swatch"][class*="selected"]',
    '[class*="swatch"][class*="active"]',
    '[class*="color-option"][class*="selected"]',
    '[class*="color-option"][class*="active"]',
    // Buttons with tile/swatch in class that are selected
    'button[class*="tile"][class*="selected"]',
    'button[class*="tile"][class*="active"]'
  ];
  
  for (const selector of swatchSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (isInExcludedSection(el)) {
        console.log('❌ Skipping excluded:', selector);
        continue;
      }
      
      const bgUrl = getBgImage(el);
      if (bgUrl) {
        const colorName = getColorName(el);
        console.log('✅ FOUND SELECTED SWATCH:', colorName, bgUrl.substring(0, 60));
        data.detectedSwatchUrl = bgUrl;
        data.detectedSwatchName = colorName;
        data.swatchImages.push({ url: bgUrl, isSelected: true, colorName: colorName });
        break;
      }
    }
    if (data.detectedSwatchUrl) break;
  }
  
  // PRIORITY 2: If no selected swatch found, look in option/swatch containers
  if (!data.detectedSwatchUrl) {
    console.log('No selected swatch found, looking for swatch containers...');
    
    // Find containers that have "Color" or "Finish" labels
    const optionContainers = document.querySelectorAll('[class*="option"], [class*="swatch"], [class*="variant"]');
    
    for (const container of optionContainers) {
      if (isInExcludedSection(container)) continue;
      
      // Check if this container has a color/finish label
      const labels = container.querySelectorAll('span, label, legend, h3, h4');
      let hasColorLabel = false;
      for (const label of labels) {
        const txt = (label.innerText || '').toLowerCase().trim();
        if (txt === 'color' || txt === 'color:' || txt === 'finish' || txt === 'finish:' ||
            txt === 'fabric' || txt === 'fabric:') {
          hasColorLabel = true;
          break;
        }
      }
      
      if (!hasColorLabel) continue;
      
      // Look for buttons/elements with background images in this container
      const swatchElements = container.querySelectorAll('button, [class*="swatch"], [class*="tile"]');
      for (const el of swatchElements) {
        if (isSelectedSwatch(el)) {
          const bgUrl = getBgImage(el);
          if (bgUrl) {
            const colorName = getColorName(el);
            console.log('✅ FOUND SWATCH in container:', colorName, bgUrl.substring(0, 60));
            data.detectedSwatchUrl = bgUrl;
            data.detectedSwatchName = colorName;
            data.swatchImages.push({ url: bgUrl, isSelected: true, colorName: colorName });
            break;
          }
        }
      }
      if (data.detectedSwatchUrl) break;
    }
  }
  
  // PRIORITY 3: Fall back to first swatch in a color section (if nothing selected)
  if (!data.detectedSwatchUrl) {
    console.log('No selected swatch, looking for any swatch in color section...');
    
    const allButtons = document.querySelectorAll('button[style*="background-image"], [class*="swatch"][style*="background-image"]');
    for (const el of allButtons) {
      if (isInExcludedSection(el)) continue;
      
      const bgUrl = getBgImage(el);
      if (bgUrl) {
        // Make sure this is in a color/option area
        let inColorArea = false;
        let parent = el;
        for (let i = 0; i < 5 && parent; i++) {
          const classes = (parent.className || '').toLowerCase();
          if (classes.includes('option') || classes.includes('swatch') || classes.includes('color') || classes.includes('variant')) {
            inColorArea = true;
            break;
          }
          parent = parent.parentElement;
        }
        
        if (inColorArea) {
          const colorName = getColorName(el);
          console.log('✅ Using first swatch:', colorName, bgUrl.substring(0, 60));
          data.detectedSwatchUrl = bgUrl;
          data.detectedSwatchName = colorName;
          data.swatchImages.push({ url: bgUrl, isSelected: false, colorName: colorName });
          break;
        }
      }
    }
  }
  
  console.log('=== COMPLETE ===');
  console.log('Main image:', data.mainProductImage ? data.mainProductImage.substring(0, 60) + '...' : 'NOT FOUND');
  console.log('Swatch URL:', data.detectedSwatchUrl ? data.detectedSwatchUrl.substring(0, 60) + '...' : 'NOT FOUND');
  console.log('Swatch name:', data.detectedSwatchName || 'NOT FOUND');
  
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
    
    // Use detected swatch name if available, otherwise use AI's finish_color
    let finalFinishColor = aiData.finish_color;
    if (pageData.detectedSwatchName) {
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
        'hubbardtonforge': 'Hubbardton Forge', 'vandh': 'Villa & House',
        'bassettmirror': 'Bassett Mirror', 'myohamerica': 'Oh America',
        'elegantlighting': 'Elegant Lighting', 'zeelighting': 'Zee Lighting'
      };
      v = vendorMap[v] || (v.charAt(0).toUpperCase() + v.slice(1));
      vendorBadge.textContent = v;
      vendorBadge.style.display = 'block';
    }
  } catch (e) {}
})();
