// Design Ready Product Scraper v8.1
// AI-POWERED + IMPROVED SWATCH DETECTION
// Works on ANY vendor site

const APP_URL = 'https://design-harvest-1.preview.emergentagent.com';
const BACKEND_URL = 'https://design-harvest-1.preview.emergentagent.com';
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
// COMPREHENSIVE PAGE DATA EXTRACTION
// ============================================
function getPageData() {
  const data = {
    pageText: document.body.innerText || '',
    pageUrl: window.location.href,
    mainImage: null,
    swatchImage: null,
    swatchColorName: null
  };
  
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  
  // Helper: Get background-image URL from element
  function getBgImageUrl(el) {
    if (!el) return null;
    const style = el.getAttribute('style') || '';
    const computed = window.getComputedStyle(el);
    const bg = computed.backgroundImage || '';
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/) || style.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && match[1] && !match[1].includes('data:')) {
      let url = match[1];
      if (url.startsWith('/')) url = window.location.origin + url;
      if (url.startsWith('http')) return url;
    }
    return null;
  }
  
  // Helper: Check if element is selected
  function isSelected(el) {
    if (!el) return false;
    const classes = (el.className || '').toLowerCase();
    return classes.includes('selected') || 
           classes.includes('active') || 
           classes.includes('current') ||
           classes.includes('checked') ||
           el.getAttribute('aria-selected') === 'true' ||
           el.getAttribute('aria-checked') === 'true' ||
           el.hasAttribute('checked');
  }
  
  // Helper: Get color name from element
  function getColorName(el) {
    if (!el) return null;
    const attrs = ['title', 'data-color', 'data-value', 'data-option-value', 'data-name', 'alt', 'aria-label'];
    for (const attr of attrs) {
      let val = el.getAttribute(attr);
      if (val) {
        val = val.replace(/selected|button|swatch|option|click|choose/gi, '').trim();
        if (val.length > 0 && val.length < 50 && !/^\d/.test(val)) return val;
      }
    }
    return null;
  }
  
  // ============================================
  // MAIN PRODUCT IMAGE
  // ============================================
  // Priority 1: og:image
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content) data.mainImage = ogImg.content;
  
  // Priority 2: Largest product image
  if (!data.mainImage) {
    let best = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || '';
      if (!src.startsWith('http')) return;
      const srcLower = src.toLowerCase();
      if (srcLower.includes('logo') || srcLower.includes('icon') || 
          srcLower.includes('sprite') || srcLower.includes('social') ||
          srcLower.includes('footer') || srcLower.includes('header') ||
          srcLower.includes('banner') || srcLower.includes('arrow') ||
          srcLower.includes('chevron')) return;
      // Skip small images
      const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
      const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
      if (w < 200 || h < 200) return;
      const size = w * h;
      if (size > bestSize) {
        bestSize = size;
        best = src;
      }
    });
    if (best) data.mainImage = best;
  }

  // ============================================
  // SWATCH/COLOR IMAGE - COMPREHENSIVE DETECTION
  // ============================================
  console.log('=== SWATCH DETECTION START ===');
  
  // Strategy 1: Find by Color/Finish/Fabric labels
  const colorLabels = ['color', 'colour', 'finish', 'fabric', 'cover', 'material', 'option'];
  let swatchContainer = null;
  
  // Look through all elements for color-related labels
  document.querySelectorAll('label, legend, span, div, dt, h3, h4, h5, p').forEach(el => {
    if (swatchContainer) return;
    const text = (el.innerText || el.textContent || '').toLowerCase().trim();
    
    // Check if this is a color label
    for (const label of colorLabels) {
      if (text === label || text === label + ':' || text === label + 's' || 
          text.startsWith(label + ':') || text.startsWith(label + ' :')) {
        console.log('Found label:', text);
        
        // Look for swatches in parent containers
        let container = el.parentElement;
        for (let i = 0; i < 8 && container; i++) {
          // Look for buttons, links, or divs that could be swatches
          const swatchElements = container.querySelectorAll(
            'button[style*="background"], div[style*="background"], ' +
            'a[style*="background"], span[style*="background"], ' +
            'button[class*="swatch"], div[class*="swatch"], ' +
            'button[class*="color"], div[class*="color"], ' +
            'button[class*="option"], div[class*="option"], ' +
            'button[class*="tile"], div[class*="tile"], ' +
            'img[class*="swatch"], img[alt*="color"]'
          );
          
          if (swatchElements.length > 0) {
            swatchContainer = container;
            console.log('Found swatch container with', swatchElements.length, 'elements');
            break;
          }
          container = container.parentElement;
        }
        if (swatchContainer) break;
      }
    }
  });
  
  // Strategy 2: Look by common class patterns
  if (!swatchContainer) {
    const selectors = [
      '[class*="color-swatch"]', '[class*="swatch-list"]', '[class*="color-options"]',
      '[class*="color-picker"]', '[class*="finish-selector"]', '[class*="variant-picker"]',
      '[class*="option-selector"]', '[class*="product-options"]', '[class*="configurable"]',
      '[data-option="color"]', '[data-option="Color"]', '[data-option="Finish"]',
      '[class*="tile-list"]', '[class*="tileList"]'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        swatchContainer = el;
        console.log('Found swatch container via selector:', sel);
        break;
      }
    }
  }
  
  // Strategy 3: Look for any element with color-related attributes
  if (!swatchContainer) {
    const colorElements = document.querySelectorAll(
      '[data-color], [data-finish], [data-fabric], [data-option-name*="color" i], ' +
      '[data-option-name*="finish" i], [aria-label*="color" i], [aria-label*="finish" i]'
    );
    if (colorElements.length > 0) {
      swatchContainer = colorElements[0].closest('ul, div, section') || colorElements[0].parentElement;
      console.log('Found swatch container via data attributes');
    }
  }
  
  // Extract swatch from container
  if (swatchContainer) {
    console.log('Processing swatch container');
    
    // Find all potential swatch elements
    const allSwatchElements = swatchContainer.querySelectorAll(
      'button, a, div[role="radio"], div[role="option"], span[role="radio"], ' +
      'li, label, input[type="radio"]'
    );
    
    // First pass: find SELECTED swatch
    for (const el of allSwatchElements) {
      if (!isSelected(el)) continue;
      
      console.log('Found selected element');
      
      // Try to get background-image from this element or its children
      let bgUrl = getBgImageUrl(el);
      if (!bgUrl) {
        // Check children
        const children = el.querySelectorAll('div, span');
        for (const child of children) {
          bgUrl = getBgImageUrl(child);
          if (bgUrl) break;
        }
      }
      
      // Try to get img inside
      if (!bgUrl) {
        const img = el.querySelector('img');
        if (img?.src && img.src.startsWith('http')) {
          bgUrl = img.src;
        }
      }
      
      if (bgUrl) {
        data.swatchImage = bgUrl;
        data.swatchColorName = getColorName(el);
        console.log('Selected swatch:', data.swatchColorName, bgUrl);
        break;
      } else {
        // Even without image, try to get the color name
        data.swatchColorName = getColorName(el);
        console.log('Selected swatch name only:', data.swatchColorName);
      }
    }
    
    // Second pass: if no selected found, take first swatch with image
    if (!data.swatchImage) {
      for (const el of allSwatchElements) {
        let bgUrl = getBgImageUrl(el);
        if (!bgUrl) {
          const children = el.querySelectorAll('div, span');
          for (const child of children) {
            bgUrl = getBgImageUrl(child);
            if (bgUrl) break;
          }
        }
        if (!bgUrl) {
          const img = el.querySelector('img');
          if (img?.src && img.src.startsWith('http')) {
            bgUrl = img.src;
          }
        }
        
        if (bgUrl) {
          data.swatchImage = bgUrl;
          data.swatchColorName = data.swatchColorName || getColorName(el);
          console.log('First swatch with image:', data.swatchColorName, bgUrl);
          break;
        }
      }
    }
  }
  
  // Strategy 4: For sites like Uttermost - look for buttons with background-image in style
  if (!data.swatchImage && domain.includes('uttermost')) {
    console.log('Uttermost specific detection');
    const buttons = document.querySelectorAll('button[style*="background-image"]');
    for (const btn of buttons) {
      // Skip if it's in header/footer/nav
      if (btn.closest('header, footer, nav, [class*="header"], [class*="footer"], [class*="nav"]')) continue;
      
      const bgUrl = getBgImageUrl(btn);
      if (bgUrl) {
        const isSelectedBtn = isSelected(btn);
        if (isSelectedBtn || !data.swatchImage) {
          data.swatchImage = bgUrl;
          data.swatchColorName = getColorName(btn);
          console.log('Uttermost button swatch:', data.swatchColorName, bgUrl, 'selected:', isSelectedBtn);
          if (isSelectedBtn) break;
        }
      }
    }
  }
  
  // Strategy 5: For Visual Comfort - look for finish dropdown or images
  if (!data.swatchImage && (domain.includes('visualcomfort') || domain.includes('visual-comfort'))) {
    console.log('Visual Comfort specific detection');
    // Look for finish selector
    const finishSelect = document.querySelector('select[name*="finish"], select[id*="finish"], [class*="finish"] select');
    if (finishSelect) {
      const selected = finishSelect.options[finishSelect.selectedIndex];
      if (selected) {
        data.swatchColorName = selected.text || selected.value;
        console.log('VC finish from select:', data.swatchColorName);
      }
    }
    // Look for finish images
    const finishImgs = document.querySelectorAll('img[alt*="finish" i], img[class*="finish"], [class*="finish"] img');
    for (const img of finishImgs) {
      if (img.src && img.src.startsWith('http')) {
        data.swatchImage = img.src;
        data.swatchColorName = data.swatchColorName || img.alt;
        console.log('VC finish image:', data.swatchColorName, img.src);
        break;
      }
    }
  }
  
  // Strategy 6: For Four Hands - look for cover/fabric swatches
  if (!data.swatchImage && domain.includes('fourhands')) {
    console.log('Four Hands specific detection');
    // Look for cover/fabric section
    const coverSection = Array.from(document.querySelectorAll('*')).find(el => {
      const text = (el.innerText || '').toLowerCase();
      return text.startsWith('cover:') || text.startsWith('fabric:');
    });
    if (coverSection) {
      const container = coverSection.closest('div, section');
      if (container) {
        const imgs = container.querySelectorAll('img');
        for (const img of imgs) {
          if (img.src && img.src.startsWith('http') && img.width > 20) {
            data.swatchImage = img.src;
            console.log('FH cover image:', img.src);
            break;
          }
        }
      }
    }
    // Also try general swatch pattern
    const swatches = document.querySelectorAll('[class*="swatch"] img, [class*="option"] img');
    for (const img of swatches) {
      if (img.src && img.src.startsWith('http') && img.width > 20 && img.width < 200) {
        data.swatchImage = img.src;
        data.swatchColorName = img.alt || getColorName(img.closest('button, a, div'));
        console.log('FH swatch:', data.swatchColorName, img.src);
        break;
      }
    }
  }
  
  console.log('=== SWATCH DETECTION END ===');
  console.log('Final swatch:', data.swatchColorName, data.swatchImage);
  
  return data;
}

async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>AI Analyzing...</span>';
  showStatus('🤖 AI is analyzing the page...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url || tab.url.startsWith('chrome://')) {
      throw new Error('Navigate to a product page first');
    }
    
    // Get page data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageData
    });
    
    const pageData = results[0].result;
    if (!pageData || !pageData.pageText) {
      throw new Error('Could not read page content');
    }
    
    console.log('Page data:', pageData);
    showStatus('🤖 Sending to AI for extraction...', 'info');
    
    // Call AI backend
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
    
    // Combine AI data with images
    const finalData = {
      url: pageData.pageUrl,
      name: aiData.name,
      sku: aiData.sku,
      price: aiData.price,
      msrp: aiData.msrp,
      size: aiData.size,
      finish_color: pageData.swatchColorName || aiData.finish_color,
      vendor: aiData.vendor,
      image_url: pageData.mainImage,
      finish_image: pageData.swatchImage
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
        'loloirugs': 'Loloi',
        'fourhands': 'Four Hands',
        'hvlgroup': 'Hudson Valley',
        'visualcomfort': 'Visual Comfort'
      };
      v = vendorMap[v] || (v.charAt(0).toUpperCase() + v.slice(1));
      vendorBadge.textContent = v;
      vendorBadge.style.display = 'block';
    }
  } catch (e) {}
})();
