// Design Ready Product Scraper v9.0
// UNIVERSAL AI-POWERED SCRAPER
// Uses GPT for BOTH text AND image identification

const APP_URL = 'https://decor-grab.preview.emergentagent.com';
const BACKEND_URL = 'https://decor-grab.preview.emergentagent.com';
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
// COMPREHENSIVE PAGE DATA EXTRACTION v9
// Collects ALL potential images for AI to analyze
// ============================================
function getPageData() {
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: window.location.href,
    pageHtml: '', // Simplified HTML structure for AI analysis
    allImages: [], // All potential images with context
    mainProductImage: null
  };
  
  // Helper functions
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
  
  function getElementContext(el) {
    const context = {
      tag: el.tagName?.toLowerCase(),
      classes: el.className || '',
      id: el.id || '',
      role: el.getAttribute('role') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      ariaSelected: el.getAttribute('aria-selected'),
      title: el.getAttribute('title') || '',
      dataAttrs: {},
      parentClasses: el.parentElement?.className || '',
      nearbyText: ''
    };
    
    // Get data attributes
    for (const attr of el.attributes || []) {
      if (attr.name.startsWith('data-')) {
        context.dataAttrs[attr.name] = attr.value;
      }
    }
    
    // Get nearby text (parent and siblings)
    try {
      const parent = el.closest('div, li, label, fieldset, section');
      if (parent) {
        const textNodes = parent.querySelectorAll('span, label, p, h3, h4, h5, legend');
        for (const tn of textNodes) {
          if (tn.innerText?.length < 50) {
            context.nearbyText += ' ' + tn.innerText;
          }
        }
      }
    } catch(e) {}
    
    return context;
  }
  
  function isLikelySwatchElement(el, context) {
    const classLower = (context.classes || '').toLowerCase();
    const parentClassLower = (context.parentClasses || '').toLowerCase();
    const nearbyTextLower = (context.nearbyText || '').toLowerCase();
    
    // Keywords that suggest swatch/color selection
    const swatchKeywords = ['swatch', 'color', 'colour', 'finish', 'fabric', 'material', 'option', 'variant', 'tile', 'chip'];
    
    for (const kw of swatchKeywords) {
      if (classLower.includes(kw) || parentClassLower.includes(kw) || 
          (context.dataAttrs && Object.values(context.dataAttrs).some(v => v?.toLowerCase()?.includes(kw)))) {
        return true;
      }
    }
    
    // Check if nearby text mentions color-related words
    const colorWords = ['color', 'colour', 'finish', 'fabric', 'cover', 'material', 'option'];
    for (const cw of colorWords) {
      if (nearbyTextLower.includes(cw)) return true;
    }
    
    return false;
  }
  
  function isLikelySelected(el, context) {
    const classLower = (context.classes || '').toLowerCase();
    
    // Check various selection indicators
    if (classLower.includes('selected') || classLower.includes('active') || 
        classLower.includes('current') || classLower.includes('checked')) return true;
    if (context.ariaSelected === 'true') return true;
    if (el.checked) return true;
    
    // Check for visual indicators (border, ring, etc.)
    try {
      const computed = window.getComputedStyle(el);
      const borderWidth = parseInt(computed.borderWidth) || 0;
      const outlineWidth = parseInt(computed.outlineWidth) || 0;
      if (borderWidth > 2 || outlineWidth > 0) return true;
    } catch(e) {}
    
    return false;
  }
  
  // ========================================
  // COLLECT ALL POTENTIAL SWATCH IMAGES
  // ========================================
  const seenUrls = new Set();
  
  // 1. Find all clickable elements that might be swatches
  const clickableSelectors = 'button, a, [role="radio"], [role="option"], [role="button"], label, li, div[tabindex]';
  document.querySelectorAll(clickableSelectors).forEach(el => {
    // Skip if in header/footer/nav
    if (el.closest('header, footer, nav, [class*="header"], [class*="footer"], [class*="nav"], [class*="menu"]')) return;
    
    const context = getElementContext(el);
    const isSwatchLike = isLikelySwatchElement(el, context);
    const isSelected = isLikelySelected(el, context);
    
    // Check for background-image on this element or its children
    let bgUrl = getBgImageUrl(el);
    if (!bgUrl) {
      const children = el.querySelectorAll('div, span');
      for (const child of children) {
        bgUrl = getBgImageUrl(child);
        if (bgUrl) break;
      }
    }
    
    // Check for img inside
    let imgUrl = null;
    const img = el.querySelector('img');
    if (img) {
      imgUrl = img.src || img.dataset.src;
      if (imgUrl && !imgUrl.startsWith('http')) {
        if (imgUrl.startsWith('/')) imgUrl = window.location.origin + imgUrl;
        else imgUrl = null;
      }
    }
    
    const url = bgUrl || imgUrl;
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      data.allImages.push({
        url: url,
        type: bgUrl ? 'background' : 'img',
        width: img?.naturalWidth || img?.width || 0,
        height: img?.naturalHeight || img?.height || 0,
        isSwatchLike: isSwatchLike,
        isSelected: isSelected,
        context: {
          classes: context.classes,
          title: context.title,
          ariaLabel: context.ariaLabel,
          nearbyText: context.nearbyText.trim().substring(0, 100),
          dataColor: context.dataAttrs['data-color'] || context.dataAttrs['data-value'] || ''
        }
      });
    }
  });
  
  // 2. Find all small images (likely swatches by size)
  document.querySelectorAll('img').forEach(img => {
    if (img.closest('header, footer, nav, [class*="header"], [class*="footer"], [class*="nav"]')) return;
    
    const src = img.src || img.dataset.src;
    if (!src || !src.startsWith('http') || seenUrls.has(src)) return;
    
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    
    // Small square-ish images are likely swatches
    const isSmall = w > 10 && w < 200 && h > 10 && h < 200;
    const isSquarish = Math.abs(w - h) < Math.max(w, h) * 0.3;
    
    if (isSmall && isSquarish) {
      const context = getElementContext(img);
      const parentContext = getElementContext(img.parentElement);
      const isSwatchLike = isLikelySwatchElement(img, context) || isLikelySwatchElement(img.parentElement, parentContext);
      const isSelected = isLikelySelected(img.parentElement, parentContext);
      
      seenUrls.add(src);
      data.allImages.push({
        url: src,
        type: 'img',
        width: w,
        height: h,
        isSwatchLike: isSwatchLike,
        isSelected: isSelected,
        isSmallSquare: true,
        context: {
          classes: context.classes,
          alt: img.alt || '',
          title: context.title || img.title || '',
          nearbyText: context.nearbyText.trim().substring(0, 100)
        }
      });
    }
  });
  
  // 3. Find main product image
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content) {
    data.mainProductImage = ogImg.content;
  } else {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = img.src;
      if (!src?.startsWith('http')) return;
      const srcLower = src.toLowerCase();
      if (srcLower.includes('logo') || srcLower.includes('icon') || srcLower.includes('sprite') ||
          srcLower.includes('social') || srcLower.includes('footer')) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w > 300 && h > 300 && w * h > bestSize) {
        bestSize = w * h;
        bestImg = src;
      }
    });
    if (bestImg) data.mainProductImage = bestImg;
  }
  
  // 4. Create simplified HTML context for AI
  // Get the product area HTML structure
  try {
    const productArea = document.querySelector('[class*="product-detail"], [class*="pdp"], main, article, [itemtype*="Product"]');
    if (productArea) {
      // Get a simplified version of the HTML
      const clone = productArea.cloneNode(true);
      // Remove scripts and styles
      clone.querySelectorAll('script, style, svg, noscript').forEach(el => el.remove());
      // Truncate to reasonable size
      data.pageHtml = clone.innerHTML.substring(0, 15000);
    }
  } catch(e) {}
  
  console.log('=== PAGE DATA COLLECTED ===');
  console.log('Images found:', data.allImages.length);
  console.log('Swatch-like images:', data.allImages.filter(i => i.isSwatchLike).length);
  console.log('Selected images:', data.allImages.filter(i => i.isSelected).length);
  
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
    
    // Get comprehensive page data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData
    });
    
    const pageData = results[0].result;
    if (!pageData || !pageData.pageText) {
      throw new Error('Could not read page content');
    }
    
    console.log('Page data:', pageData);
    showStatus('🤖 AI analyzing product & swatch...', 'info');
    
    // Call AI backend with all data including images
    const response = await fetch(`${BACKEND_URL}/api/ai-scrape-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_text: pageData.pageText,
        page_url: pageData.pageUrl,
        all_images: pageData.allImages,
        main_image: pageData.mainProductImage
      })
    });
    
    if (!response.ok) {
      // Fallback to v1 endpoint
      console.log('Trying v1 endpoint...');
      const v1Response = await fetch(`${BACKEND_URL}/api/ai-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_text: pageData.pageText,
          page_url: pageData.pageUrl
        })
      });
      
      if (!v1Response.ok) {
        const error = await v1Response.json();
        throw new Error(error.detail || 'AI extraction failed');
      }
      
      const aiData = await v1Response.json();
      
      // Use best swatch image from our detection
      let swatchImage = null;
      const selectedSwatches = pageData.allImages.filter(i => i.isSelected && i.isSwatchLike);
      const swatchLikeImages = pageData.allImages.filter(i => i.isSwatchLike);
      const smallSquareImages = pageData.allImages.filter(i => i.isSmallSquare);
      
      if (selectedSwatches.length > 0) {
        swatchImage = selectedSwatches[0].url;
      } else if (swatchLikeImages.length > 0) {
        swatchImage = swatchLikeImages[0].url;
      } else if (smallSquareImages.length > 0) {
        swatchImage = smallSquareImages[0].url;
      }
      
      const finalData = {
        url: pageData.pageUrl,
        name: aiData.name,
        sku: aiData.sku,
        price: aiData.price,
        msrp: aiData.msrp,
        size: aiData.size,
        finish_color: aiData.finish_color,
        vendor: aiData.vendor,
        image_url: pageData.mainProductImage,
        finish_image: swatchImage
      };
      
      displayResults(finalData);
      showStatus(finalData.name ? `✅ Found: ${finalData.name}` : '✅ Done', 'success');
      return;
    }
    
    const aiData = await response.json();
    console.log('AI v2 data:', aiData);
    
    const finalData = {
      url: pageData.pageUrl,
      name: aiData.name,
      sku: aiData.sku,
      price: aiData.price,
      msrp: aiData.msrp,
      size: aiData.size,
      finish_color: aiData.finish_color,
      vendor: aiData.vendor,
      image_url: aiData.image_url || pageData.mainProductImage,  // Use API response or fallback to local detection
      finish_image: aiData.swatch_image_url
    };
    
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
        'hubbardtonforge': 'Hubbardton Forge'
      };
      v = vendorMap[v] || (v.charAt(0).toUpperCase() + v.slice(1));
      vendorBadge.textContent = v;
      vendorBadge.style.display = 'block';
    }
  } catch (e) {}
})();
