// Design Ready Product Scraper v7.0
// UNIVERSAL SCRAPER - FIXED for all vendor sites
// Improved SKU, Price, Finish/Color detection

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
  if (data.finish_image) { finishImgEl.src = data.finish_image; finishImgContainer.style.display = 'flex'; finishNameEl.textContent = data.finish_color || 'Swatch'; }
  else { finishImgContainer.style.display = 'none'; }
  document.getElementById('dataVendor').textContent = data.vendor || 'Not found';
  document.getElementById('dataSize').textContent = data.size || 'Not found';
  document.getElementById('dataFinish').textContent = data.finish_color || 'Not found';
  document.getElementById('dataMsrp').textContent = data.msrp ? `$${data.msrp}` : 'Not found';
  document.getElementById('dataUrl').textContent = data.url || 'Not found';
}

// ============================================
// UNIVERSAL SCRAPING FUNCTION v7
// ============================================
function scrapePageData() {
  const data = {
    url: window.location.href,
    vendor: null,
    name: null,
    sku: null,
    price: null,
    msrp: null,
    size: null,
    finish_color: null,
    finish_image: null,
    image_url: null
  };

  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const pageText = document.body.innerText || '';
  
  // ============================================
  // 1. VENDOR
  // ============================================
  const domainParts = domain.split('.');
  let vendorName = domainParts[0];
  // Clean up common vendor names
  if (vendorName === 'loloirugs') vendorName = 'Loloi';
  else if (vendorName === 'fourhands') vendorName = 'Four Hands';
  else if (vendorName === 'hvlgroup') vendorName = 'Hudson Valley';
  else if (vendorName === 'visualcomfort') vendorName = 'Visual Comfort';
  else vendorName = vendorName.charAt(0).toUpperCase() + vendorName.slice(1);
  data.vendor = vendorName;
  
  // ============================================
  // 2. PRODUCT NAME
  // ============================================
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  if (!data.name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.name = ogTitle.content.split('|')[0].split('-')[0].trim();
  }

  // ============================================
  // 3. SKU - IMPROVED: Only accept alphanumeric codes
  // ============================================
  // Look for SKU in specific elements first
  const skuSelectors = [
    '[data-testid="sku"]', '.sku', '.product-sku', '[itemprop="sku"]',
    '.sku-value', '.product-id', '.item-number'
  ];
  
  for (const sel of skuSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText.trim();
      // SKU should be alphanumeric, possibly with dashes
      if (/^[A-Z0-9][-A-Z0-9]{2,20}$/i.test(text)) {
        data.sku = text;
        break;
      }
    }
  }
  
  // Look for labeled SKU in text - be strict about format
  if (!data.sku) {
    // Match "SKU: 23878" or "Item #: ABC-123" but NOT "SKU: Information"
    const skuPatterns = [
      /SKU[:\s#]*([A-Z0-9][-A-Z0-9]{2,20})\b/i,
      /Item\s*(?:#|Number|No\.?)[:\s]*([A-Z0-9][-A-Z0-9]{2,20})\b/i,
      /Style\s*(?:#|Number|No\.?)[:\s]*([A-Z0-9][-A-Z0-9]{2,20})\b/i,
      /Model\s*(?:#|Number|No\.?)[:\s]*([A-Z0-9][-A-Z0-9]{2,20})\b/i
    ];
    
    for (const pattern of skuPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const sku = match[1].trim();
        // Validate: must have at least one digit and not be a common word
        const badWords = ['information', 'global', 'details', 'description', 'none', 'available'];
        if (/\d/.test(sku) && !badWords.includes(sku.toLowerCase())) {
          data.sku = sku;
          break;
        }
      }
    }
  }
  
  // Try URL for SKU (many sites have it in URL)
  if (!data.sku) {
    const urlMatch = window.location.pathname.match(/\/([A-Z0-9][-A-Z0-9]{3,20})(?:\/|$|\?)/i);
    if (urlMatch && /\d/.test(urlMatch[1])) {
      data.sku = urlMatch[1];
    }
  }

  // ============================================
  // 4. PRICE & MSRP - IMPROVED
  // ============================================
  // Collect all price elements and their context
  const priceElements = [];
  
  document.querySelectorAll('[class*="price"], [data-price], [itemprop="price"]').forEach(el => {
    const text = el.innerText || '';
    const matches = text.match(/\$\s*([\d,]+\.?\d*)/g);
    if (matches) {
      matches.forEach(m => {
        const val = parseFloat(m.replace(/[$,\s]/g, ''));
        if (val > 50 && val < 100000) {
          // Check context for MSRP indicators
          const fullText = (el.closest('div, span, p')?.innerText || '').toLowerCase();
          const isMsrp = fullText.includes('msrp') || fullText.includes('retail') || 
                        fullText.includes('list') || fullText.includes('was') ||
                        fullText.includes('compare') || fullText.includes('regular');
          priceElements.push({ value: val, isMsrp, element: el });
        }
      });
    }
  });
  
  // Also check for prices near "Add to Cart" button
  const addToCartBtn = document.querySelector('button[class*="add-to-cart"], button[class*="addtocart"], [data-action="add-to-cart"], button:has-text("Add to Cart")');
  if (addToCartBtn) {
    const container = addToCartBtn.closest('div, section, form');
    if (container) {
      const priceMatch = container.innerText.match(/\$\s*([\d,]+\.?\d*)/);
      if (priceMatch) {
        const val = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (val > 50 && val < 100000) {
          priceElements.push({ value: val, isMsrp: false, isNearCart: true });
        }
      }
    }
  }
  
  // Separate MSRP and regular prices
  const msrpPrices = priceElements.filter(p => p.isMsrp).map(p => p.value);
  const regularPrices = priceElements.filter(p => !p.isMsrp).map(p => p.value);
  const cartPrices = priceElements.filter(p => p.isNearCart).map(p => p.value);
  
  // Set MSRP (highest MSRP-labeled price)
  if (msrpPrices.length > 0) {
    data.msrp = Math.max(...msrpPrices);
  }
  
  // Set Price (prefer price near cart, then lowest non-MSRP)
  if (cartPrices.length > 0) {
    data.price = cartPrices[0];
  } else if (regularPrices.length > 0) {
    // If we have MSRP, price should be lower
    const validPrices = data.msrp ? regularPrices.filter(p => p < data.msrp) : regularPrices;
    if (validPrices.length > 0) {
      data.price = Math.min(...validPrices);
    } else {
      data.price = Math.min(...regularPrices);
    }
  }
  
  // Fallback: scan page for MSRP pattern
  if (!data.msrp) {
    const msrpMatch = pageText.match(/(?:MSRP|Retail|Suggested\s*(?:Retail)?\s*Price|List\s*Price|MAP)[:\s]*\$\s*([\d,]+\.?\d*)/i);
    if (msrpMatch) {
      data.msrp = parseFloat(msrpMatch[1].replace(/,/g, ''));
    }
  }

  // ============================================
  // 5. DIMENSIONS/SIZE
  // ============================================
  const sizePatterns = [
    /(\d+(?:\.\d+)?)\s*["']?\s*[Ww](?:idth)?\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[Hh](?:eight)?\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[Dd]/,
    /(?:Dimensions?|Size)[:\s]*(\d+(?:\.\d+)?)\s*[Xx×"']\s*(\d+(?:\.\d+)?)\s*[Xx×"']\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*[Ww]\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*[Hh]\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*[Dd]/,
    /(?:Width|W)[:\s]*(\d+(?:\.\d+)?)["\s]*(?:Height|H)[:\s]*(\d+(?:\.\d+)?)["\s]*(?:Depth|D)[:\s]*(\d+(?:\.\d+)?)/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = pageText.match(pattern);
    if (match) {
      data.size = `${match[1]} W X ${match[2]} H X ${match[3]} D`;
      break;
    }
  }
  
  // Try individual dimension fields
  if (!data.size) {
    const widthMatch = pageText.match(/(?:Width|W)[:\s]*(\d+(?:\.\d+)?)\s*(?:"|in|inch)/i);
    const heightMatch = pageText.match(/(?:Height|H)[:\s]*(\d+(?:\.\d+)?)\s*(?:"|in|inch)/i);
    const depthMatch = pageText.match(/(?:Depth|D|Length|L)[:\s]*(\d+(?:\.\d+)?)\s*(?:"|in|inch)/i);
    
    if (widthMatch && heightMatch) {
      data.size = `${widthMatch[1]} W X ${heightMatch[1]} H` + (depthMatch ? ` X ${depthMatch[1]} D` : '');
    }
  }

  // ============================================
  // 6. MAIN PRODUCT IMAGE
  // ============================================
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage?.content) {
    data.image_url = ogImage.content;
  }
  
  if (!data.image_url) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || '';
      if (!src || !src.startsWith('http')) return;
      const srcLower = src.toLowerCase();
      if (srcLower.includes('logo') || srcLower.includes('icon') || srcLower.includes('sprite') ||
          srcLower.includes('social') || srcLower.includes('footer') || srcLower.includes('banner')) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w > 200 && h > 200 && w * h > bestSize) {
        bestSize = w * h;
        bestImg = src;
      }
    });
    if (bestImg) data.image_url = bestImg;
  }

  // ============================================
  // 7. FINISH/COLOR - IMPROVED DETECTION
  // ============================================
  function getBackgroundImageUrl(el) {
    const style = el.getAttribute('style') || '';
    const computed = window.getComputedStyle(el);
    const bg = computed.backgroundImage || style;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && match[1] && !match[1].includes('data:') && match[1].startsWith('http')) {
      return match[1];
    }
    if (match && match[1] && match[1].startsWith('/')) {
      return window.location.origin + match[1];
    }
    return null;
  }
  
  function isSelected(el) {
    const classes = (el.className || '').toLowerCase();
    const ariaSelected = el.getAttribute('aria-selected');
    return classes.includes('selected') || classes.includes('active') || 
           classes.includes('current') || classes.includes('checked') ||
           ariaSelected === 'true' || el.hasAttribute('checked');
  }
  
  function getColorName(el) {
    // Get color name from various attributes
    const attrs = ['title', 'data-color', 'data-value', 'data-option-value', 'data-name', 'alt'];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val && val.length < 50 && !/\d+['"]?\s*[xX×]\s*\d+/.test(val)) { // Not a size
        // Clean up the value
        let clean = val.replace(/selected|button|swatch|option/gi, '').trim();
        if (clean.length > 0 && clean.length < 40) return clean;
      }
    }
    // Check aria-label
    const ariaLabel = el.getAttribute('aria-label') || '';
    const cleanLabel = ariaLabel.replace(/selected|button|swatch|option/gi, '').trim();
    if (cleanLabel.length > 0 && cleanLabel.length < 40 && !/\d+['"]?\s*[xX×]\s*\d+/.test(cleanLabel)) {
      return cleanLabel;
    }
    return null;
  }
  
  // Strategy 1: Find by explicit labels (Color, Finish, Option)
  const colorLabelPatterns = ['color', 'colour', 'finish', 'fabric', 'material'];
  let colorContainer = null;
  
  // Look for label elements
  document.querySelectorAll('label, legend, span, div, h3, h4, dt').forEach(el => {
    if (colorContainer) return;
    const text = (el.innerText || '').toLowerCase().trim();
    // Match exact label or label with colon
    if (colorLabelPatterns.some(p => text === p || text === p + ':' || text === p + 's' || text === p + 's:')) {
      // Don't match if it's just showing a value (like "Color: Blue")
      if (text.includes(':') && text.split(':')[1]?.trim().length > 0) {
        // This might be showing the current color value
        const colorVal = text.split(':')[1].trim();
        if (colorVal.length < 30 && !/\d+['"]?\s*[xX×]\s*\d+/.test(colorVal)) {
          data.finish_color = colorVal.charAt(0).toUpperCase() + colorVal.slice(1);
        }
      }
      // Look for swatches nearby
      let container = el.closest('div, section, fieldset, form') || el.parentElement;
      for (let i = 0; i < 6 && container; i++) {
        const buttons = container.querySelectorAll('button, [role="radio"], [role="option"], a[data-value]');
        const imgs = container.querySelectorAll('img[src*="swatch"], img[alt*="color"], img[data-color]');
        if (buttons.length > 1 || imgs.length > 1) {
          colorContainer = container;
          break;
        }
        container = container.parentElement;
      }
    }
  });
  
  // Strategy 2: Find by class names
  if (!colorContainer) {
    const swatchSelectors = [
      '[class*="color-swatch"]', '[class*="swatch-container"]', '[class*="color-options"]',
      '[class*="color-picker"]', '[class*="finish-options"]', '[class*="variant-picker"]',
      '[data-option-name="color"]', '[data-option-name="Color"]', '[data-option-name="Finish"]'
    ];
    for (const sel of swatchSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        colorContainer = el.closest('div, ul, fieldset, section') || el;
        break;
      }
    }
  }
  
  // Extract swatch from container
  if (colorContainer) {
    console.log('Found color container');
    
    // Look for selected swatch with background-image
    const allClickables = colorContainer.querySelectorAll('button, a, div[role="radio"], span[role="option"], li');
    for (const el of allClickables) {
      if (!isSelected(el)) continue;
      
      // Try background-image
      const bgUrl = getBackgroundImageUrl(el);
      if (bgUrl) {
        data.finish_image = bgUrl;
        data.finish_color = data.finish_color || getColorName(el);
        console.log('Found selected swatch (bg):', data.finish_color);
        break;
      }
      
      // Try child img
      const img = el.querySelector('img');
      if (img?.src && img.src.startsWith('http')) {
        data.finish_image = img.src;
        data.finish_color = data.finish_color || getColorName(el) || getColorName(img);
        console.log('Found selected swatch (img):', data.finish_color);
        break;
      }
      
      // Just get color name even without image
      const colorName = getColorName(el);
      if (colorName && !data.finish_color) {
        data.finish_color = colorName;
      }
    }
    
    // Fallback: take first swatch if none selected
    if (!data.finish_image) {
      for (const el of allClickables) {
        const bgUrl = getBackgroundImageUrl(el);
        if (bgUrl) {
          data.finish_image = bgUrl;
          data.finish_color = data.finish_color || getColorName(el);
          break;
        }
        const img = el.querySelector('img');
        if (img?.src) {
          data.finish_image = img.src;
          data.finish_color = data.finish_color || getColorName(el) || getColorName(img);
          break;
        }
      }
    }
  }
  
  // Strategy 3: Look for currently selected color shown as text on page
  if (!data.finish_color) {
    // Common patterns: "Color: Ginger" or "Finish: Oak"
    const colorTextPatterns = [
      /(?:Color|Colour|Finish|Fabric)[:\s]+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s*[|,\n]|$)/i,
      /(?:Selected|Current)[:\s]+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s*[|,\n]|$)/i
    ];
    
    for (const pattern of colorTextPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const val = match[1].trim();
        // Make sure it's not a size or dimension
        if (!/\d+['"]?\s*[xX×]\s*\d+/.test(val) && val.length < 30) {
          data.finish_color = val;
          break;
        }
      }
    }
  }
  
  // Strategy 4: Extract from product name (e.g., "Chair, Ginger" or "Sofa - Blue")
  if (!data.finish_color && data.name) {
    const separators = [', ', ' - ', ' – ', ' in '];
    for (const sep of separators) {
      if (data.name.includes(sep)) {
        const parts = data.name.split(sep);
        const lastPart = parts[parts.length - 1].trim();
        // Must be a color-like word (no digits, not too long)
        if (lastPart.length < 25 && !/\d/.test(lastPart) && /^[A-Za-z\s]+$/.test(lastPart)) {
          data.finish_color = lastPart;
          break;
        }
      }
    }
  }

  console.log('=== SCRAPE RESULT v7 ===', data);
  return data;
}

async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>Scraping...</span>';
  showStatus('Extracting...', 'info');
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab?.url || tab.url.startsWith('chrome://')) throw new Error('Navigate to product page');
    const results = await chrome.scripting.executeScript({ target:{tabId:tab.id}, func:scrapePageData });
    const data = results[0].result;
    if (!data) throw new Error('No data');
    displayResults(data);
    showStatus(data.name ? `Found: ${data.name}` : 'Done', 'success');
  } catch(e) { showStatus(e.message, 'error'); }
  finally { scrapeBtn.disabled = false; scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>'; }
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
    params.set('action','add-item');
    params.set('source','extension');
    if(scrapedData.name) params.set('name',scrapedData.name);
    if(scrapedData.price) params.set('price',scrapedData.price);
    if(scrapedData.sku) params.set('sku',scrapedData.sku);
    if(scrapedData.size) params.set('size',scrapedData.size);
    if(scrapedData.finish_color) params.set('finish',scrapedData.finish_color);
    if(scrapedData.finish_image) params.set('finish_image',scrapedData.finish_image);
    if(scrapedData.vendor) params.set('vendor',scrapedData.vendor);
    if(scrapedData.url) params.set('link',scrapedData.url);
    if(scrapedData.image_url) params.set('image',scrapedData.image_url);
    if(scrapedData.msrp) params.set('msrp',scrapedData.msrp);
    window.open(`${APP_URL}/checklist/${selectedProjectId}?${params.toString()}`, '_blank');
    showStatus('Sent to project!', 'success');
  } catch(e) { showStatus('Failed', 'error'); }
  finally { sendBtn.disabled = false; sendBtn.innerHTML = '<span>🚀</span><span>SEND TO APP</span>'; }
}

async function copyToClipboard() {
  if (!scrapedData) return;
  try { 
    await navigator.clipboard.writeText(`${scrapedData.name}\n$${scrapedData.price}\n${scrapedData.vendor}\n${scrapedData.finish_color}`); 
    copyBtn.innerHTML='<span>✅</span><span>Copied!</span>'; 
    setTimeout(()=>{copyBtn.innerHTML='<span>📋</span><span>Copy</span>';},2000); 
  } catch(e){}
}

scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

(async()=>{ 
  try { 
    const [t] = await chrome.tabs.query({active:true,currentWindow:true}); 
    if(t?.url){
      const d = new URL(t.url).hostname.replace('www.','');
      let v = d.split('.')[0];
      if (v === 'loloirugs') v = 'Loloi';
      else if (v === 'fourhands') v = 'Four Hands';
      else if (v === 'hvlgroup') v = 'Hudson Valley';
      else if (v === 'visualcomfort') v = 'Visual Comfort';
      else v = v.charAt(0).toUpperCase() + v.slice(1);
      vendorBadge.textContent = v;
      vendorBadge.style.display = 'block';
    }
  } catch(e){} 
})();
