// Design Ready Product Scraper v9.4.0 - COMPLETE REWRITE
// December 30, 2025
// FIXES: SVG exclusion, menu icon exclusion, proper swatch detection

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
// COMPLETE REWRITE - v9.4.0 - December 30, 2025
// ============================================
function getPageData() {
  console.log('🔧🔧🔧 SCRAPER v9.4.0 - Dec 30 2025 - COMPLETE REWRITE 🔧🔧🔧');
  
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: window.location.href,
    mainProductImage: null,
    swatchImages: [],
    detectedSwatchUrl: null,
    detectedSwatchName: null
  };

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
           el.getAttribute('aria-selected') === 'true';
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

  // HELPER: Check if in swatch area (STRICT)
  function isInSwatchArea(el) {
    let parent = el;
    let foundSwatchIndicator = false;
    
    for (let i = 0; i < 8 && parent; i++) {
      const classes = (parent.className || '').toLowerCase();
      const id = (parent.id || '').toLowerCase();
      
      // EXCLUDE navigation, menu, header, footer
      if (classes.includes('nav') || classes.includes('menu') || 
          classes.includes('header') || classes.includes('footer') ||
          classes.includes('modal') || classes.includes('overlay') ||
          id.includes('nav') || id.includes('menu') || 
          id.includes('header') || id.includes('footer')) {
        return false;
      }
      
      // INCLUDE actual swatch areas
      if (classes.includes('swatch') || classes.includes('color-option') || 
          classes.includes('finish') || classes.includes('fabric') ||
          classes.includes('configurable') || classes.includes('option-tile') ||
          id.includes('swatch') || id.includes('color')) {
        foundSwatchIndicator = true;
      }
      
      // Check for color/finish labels
      if (!foundSwatchIndicator) {
        const labels = parent.querySelectorAll('label, legend, span, h3, h4, dt');
        for (const label of labels) {
          const txt = (label.innerText || '').toLowerCase().trim();
          if (txt === 'color' || txt === 'color:' || txt === 'finish' || txt === 'finish:' ||
              txt === 'fabric' || txt === 'fabric:' || txt === 'material' || txt === 'material:' ||
              txt.startsWith('select color') || txt.startsWith('select finish')) {
            foundSwatchIndicator = true;
            break;
          }
        }
      }
      
      parent = parent.parentElement;
    }
    return foundSwatchIndicator;
  }

  // HELPER: Check if URL is excluded (SVG, icons, etc)
  function isExcludedUrl(url) {
    const lower = url.toLowerCase();
    
    // EXCLUDE SVG files
    if (lower.endsWith('.svg') || lower.includes('.svg?') || lower.includes('.svg#')) {
      console.log('❌ Excluding SVG:', url);
      return true;
    }
    
    // EXCLUDE icons and UI elements
    const excludePatterns = [
      'icon', 'logo', 'arrow', 'chevron', 'close', 'menu', 'cart', 'search',
      'nav', 'mobile', 'hamburger', 'plus', 'minus', 'zoom', 'share', 'heart',
      'wishlist', 'spinner', 'loading', 'play', 'video', 'lightbulb', 'bulb'
    ];
    
    for (const pattern of excludePatterns) {
      if (lower.includes(pattern)) {
        console.log('❌ Excluding pattern "' + pattern + '":', url);
        return true;
      }
    }
    
    return false;
  }

  // HELPER: Check if likely a product image
  function isLikelyProductImage(img, src) {
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (w < 200 || h < 200) return false;
    if (isInSwatchArea(img)) return false;
    if (isExcludedUrl(src)) return false;
    return true;
  }

  // HELPER: Check if likely a swatch image
  function isLikelySwatchImage(el, url, w, h) {
    // Must be small
    if (w > 150 || h > 150) return false;
    if (w < 15 || h < 15) return false;
    
    // Must be roughly square
    const ratio = Math.max(w, h) / Math.min(w, h);
    if (ratio > 2) return false;
    
    // Must be in swatch area
    if (!isInSwatchArea(el)) return false;
    
    // Must not be excluded URL
    if (isExcludedUrl(url)) return false;
    
    // Check alt/title for exclusions
    const alt = (el.getAttribute('alt') || '').toLowerCase();
    const title = (el.getAttribute('title') || '').toLowerCase();
    if (alt.includes('close') || alt.includes('menu') || alt.includes('icon') ||
        title.includes('close') || title.includes('menu') || title.includes('icon')) {
      console.log('❌ Excluding by alt/title:', url);
      return false;
    }
    
    return true;
  }

  // ========================================
  // 1. FIND MAIN PRODUCT IMAGE
  // ========================================
  console.log('=== STEP 1: FINDING MAIN PRODUCT IMAGE ===');
  
  // Try og:image first
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content && ogImg.content.startsWith('http')) {
    data.mainProductImage = ogImg.content;
    console.log('✅ Main image from og:image:', data.mainProductImage);
  }
  
  // Try twitter:image
  if (!data.mainProductImage) {
    const twitterImg = document.querySelector('meta[name="twitter:image"]');
    if (twitterImg?.content && twitterImg.content.startsWith('http')) {
      data.mainProductImage = twitterImg.content;
      console.log('✅ Main image from twitter:image:', data.mainProductImage);
    }
  }
  
  // Try JSON-LD schema
  if (!data.mainProductImage) {
    const schema = document.querySelector('script[type="application/ld+json"]');
    if (schema) {
      try {
        const json = JSON.parse(schema.textContent);
        const imgUrl = json.image || (json['@graph']?.find(i => i.image)?.image);
        if (imgUrl) {
          const finalUrl = Array.isArray(imgUrl) ? imgUrl[0] : imgUrl;
          if (finalUrl?.startsWith('http')) {
            data.mainProductImage = finalUrl;
            console.log('✅ Main image from schema:', data.mainProductImage);
          }
        }
      } catch(e) {}
    }
  }
  
  // Try common selectors
  if (!data.mainProductImage) {
    const selectors = [
      '.product-image img', '.product-media img', '.gallery-image img',
      '.main-image img', '.pdp-image img', '.fotorama__img',
      '[data-gallery-role="main-image"] img', '.slick-current img'
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img) {
        const src = img.src || img.dataset.src;
        if (src?.startsWith('http')) {
          data.mainProductImage = src;
          console.log('✅ Main image from selector:', sel);
          break;
        }
      }
    }
  }
  
  // Fallback: largest image
  if (!data.mainProductImage) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src;
      if (!src?.startsWith('http')) return;
      if (!isLikelyProductImage(img, src)) return;
      const size = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0);
      if (size > bestSize) { bestSize = size; bestImg = src; }
    });
    if (bestImg) {
      data.mainProductImage = bestImg;
      console.log('✅ Main image from largest:', data.mainProductImage);
    }
  }
  
  console.log('Final main image:', data.mainProductImage || 'NOT FOUND');

  // ========================================
  // 2. FIND SWATCH IMAGES
  // ========================================
  console.log('=== STEP 2: FINDING SWATCH IMAGES ===');
  
  const seenUrls = new Set();
  let foundSelected = false;
  
  // Method 1: Background images
  document.querySelectorAll('button, a, div, span, label').forEach(el => {
    const bgUrl = getBgImageUrl(el);
    if (!bgUrl || seenUrls.has(bgUrl)) return;
    
    const rect = el.getBoundingClientRect();
    const w = rect.width || 50;
    const h = rect.height || 50;
    
    if (!isLikelySwatchImage(el, bgUrl, w, h)) return;
    
    seenUrls.add(bgUrl);
    const selected = isSelected(el);
    const colorName = getColorName(el);
    
    console.log('✅ Found swatch (bg):', colorName, bgUrl, selected ? '[SELECTED]' : '');
    data.swatchImages.push({ url: bgUrl, isSelected: selected, colorName: colorName });
    
    if (selected && !foundSelected) {
      data.detectedSwatchUrl = bgUrl;
      data.detectedSwatchName = colorName;
      foundSelected = true;
    }
  });
  
  // Method 2: img tags
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || img.dataset.src;
    if (!src?.startsWith('http') || seenUrls.has(src)) return;
    
    const w = img.naturalWidth || img.width || 50;
    const h = img.naturalHeight || img.height || 50;
    
    if (!isLikelySwatchImage(img, src, w, h)) return;
    
    seenUrls.add(src);
    const parent = img.closest('button, a, div, label, li');
    const selected = parent ? isSelected(parent) : false;
    const colorName = getColorName(img) || (parent ? getColorName(parent) : null);
    
    console.log('✅ Found swatch (img):', colorName, src, selected ? '[SELECTED]' : '');
    data.swatchImages.push({ url: src, isSelected: selected, colorName: colorName });
    
    if (selected && !foundSelected) {
      data.detectedSwatchUrl = src;
      data.detectedSwatchName = colorName;
      foundSelected = true;
    }
  });
  
  // Use first valid swatch if none selected
  if (!data.detectedSwatchUrl && data.swatchImages.length > 0) {
    data.detectedSwatchUrl = data.swatchImages[0].url;
    data.detectedSwatchName = data.swatchImages[0].colorName;
    console.log('Using first swatch:', data.detectedSwatchName);
  }
  
  console.log('=== COMPLETE ===');
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
    
    const finalData = {
      url: pageData.pageUrl,
      name: aiData.name,
      sku: aiData.sku,
      price: aiData.price,
      msrp: aiData.msrp,
      size: aiData.size,
      finish_color: pageData.detectedSwatchName || aiData.finish_color,
      vendor: aiData.vendor,
      image_url: pageData.mainProductImage,
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
