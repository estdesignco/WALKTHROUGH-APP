// Design Ready Product Scraper v6.0
// UNIVERSAL SCRAPER - Works on ANY vendor site
// No site-specific code - uses intelligent pattern detection

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

// Load projects from API
async function loadProjects() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/projects`);
    if (!response.ok) throw new Error('Failed to load projects');
    const projects = await response.json();
    
    projectSelector.innerHTML = '<option value="">-- Select a Project --</option>';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      projectSelector.appendChild(option);
    });
    
    const stored = await chrome.storage.local.get('selectedProjectId');
    if (stored.selectedProjectId) {
      projectSelector.value = stored.selectedProjectId;
      selectedProjectId = stored.selectedProjectId;
    }
  } catch (e) {
    console.error('Failed to load projects:', e);
    projectSelector.innerHTML = '<option value="">-- Could not load projects --</option>';
  }
}

projectSelector?.addEventListener('change', async () => {
  selectedProjectId = projectSelector.value;
  await chrome.storage.local.set({ selectedProjectId: selectedProjectId });
});

loadProjects();

function showStatus(message, type = 'info') {
  statusBar.style.display = 'flex';
  statusBar.className = `status-bar ${type}`;
  statusBar.innerHTML = `<span>${{success:'✅',error:'❌',info:'🔍',warning:'⚠️'}[type]||'•'}</span><span>${message}</span>`;
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
// UNIVERSAL SCRAPING FUNCTION - Works on ANY site
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
  // 1. VENDOR - Extract from domain
  // ============================================
  const domainParts = domain.split('.');
  data.vendor = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  
  // ============================================
  // 2. PRODUCT NAME - Usually in H1
  // ============================================
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  
  // Fallback: og:title or title tag
  if (!data.name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.name = ogTitle.content;
  }
  if (!data.name) {
    data.name = document.title.split('|')[0].split('-')[0].trim();
  }

  // ============================================
  // 3. SKU - Look for common patterns
  // ============================================
  const skuPatterns = [
    /(?:SKU|Item\s*#?|Style\s*#?|Model\s*#?|Product\s*#?)[:\s]*([A-Z0-9][-A-Z0-9]{2,20})/i,
    /(?:Item|Style|Model|SKU)[:\s#]*(\d{4,10})/i
  ];
  
  for (const pattern of skuPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      data.sku = match[1].trim();
      break;
    }
  }
  
  // Also check meta tags and structured data
  if (!data.sku) {
    const skuMeta = document.querySelector('meta[property="product:sku"], meta[name="sku"]');
    if (skuMeta) data.sku = skuMeta.content;
  }

  // ============================================
  // 4. PRICE & MSRP - Smart detection
  // ============================================
  // Look for MSRP/Retail price first (it's usually labeled)
  const msrpPatterns = [
    /(?:MSRP|Retail|Suggested\s*(?:retail)?\s*price|List\s*price|Regular\s*price)[:\s]*\$\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)\s*(?:MSRP|Retail|List)/i
  ];
  
  for (const pattern of msrpPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      data.msrp = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }
  
  // Look for dealer/your price
  const pricePatterns = [
    /(?:Your\s*price|Sale\s*price|Our\s*price|Price|Net)[:\s]*\$\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)/  // Fallback: first dollar amount
  ];
  
  // Get all prices on page
  const allPriceMatches = pageText.match(/\$\s*[\d,]+\.?\d*/g) || [];
  const prices = allPriceMatches
    .map(p => parseFloat(p.replace(/[$,\s]/g, '')))
    .filter(p => p > 10 && p < 100000)
    .sort((a, b) => a - b);
  
  // If we have MSRP, the dealer price is likely the lowest price less than MSRP
  if (data.msrp && prices.length > 0) {
    const dealerPrice = prices.find(p => p < data.msrp);
    if (dealerPrice) data.price = dealerPrice;
  }
  
  // If no MSRP, try labeled price patterns
  if (!data.price) {
    for (const pattern of pricePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (price > 10 && price < 100000) {
          data.price = price;
          break;
        }
      }
    }
  }
  
  // Fallback: if still no price, use first reasonable price found
  if (!data.price && prices.length > 0) {
    data.price = prices[0];
  }

  // ============================================
  // 5. DIMENSIONS/SIZE - Common patterns
  // ============================================
  const sizePatterns = [
    /(\d+(?:\.\d+)?)\s*["']?\s*[Ww](?:idth)?\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[Hh](?:eight)?\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*["']?\s*[Dd](?:epth)?/,
    /(\d+(?:\.\d+)?)\s*[Ww]\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*[Hh]\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*[Dd]/,
    /(?:Dimensions|Size)[:\s]*(\d+(?:\.\d+)?)\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*[Xx×]\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*[Xx×]\s*(\d+(?:\.\d+)?)\s*(?:in|inches|")/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = pageText.match(pattern);
    if (match) {
      data.size = `${match[1]} W X ${match[2]} H X ${match[3]} D`;
      break;
    }
  }

  // ============================================
  // 6. MAIN PRODUCT IMAGE
  // ============================================
  // Priority: og:image > largest product image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage?.content) {
    data.image_url = ogImage.content;
  }
  
  if (!data.image_url) {
    // Find largest image that's not a logo/icon
    let bestImg = null;
    let bestSize = 0;
    
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || img.dataset.lazySrc || '';
      if (!src || !src.startsWith('http')) return;
      
      // Skip small images, icons, logos
      const srcLower = src.toLowerCase();
      if (srcLower.includes('logo') || srcLower.includes('icon') || 
          srcLower.includes('sprite') || srcLower.includes('pixel') ||
          srcLower.includes('social') || srcLower.includes('footer')) return;
      
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      const size = w * h;
      
      if (w > 200 && h > 200 && size > bestSize) {
        bestSize = size;
        bestImg = src;
      }
    });
    
    if (bestImg) data.image_url = bestImg;
  }

  // ============================================
  // 7. FINISH/COLOR SWATCH - Universal detection
  // ============================================
  // Strategy: Find color/finish selection area, then find selected swatch
  
  // Helper: Extract background-image URL
  function getBackgroundImageUrl(el) {
    const style = el.getAttribute('style') || '';
    const computed = window.getComputedStyle(el);
    const bg = computed.backgroundImage || style;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && match[1] && !match[1].includes('data:')) {
      let url = match[1];
      if (url.startsWith('/')) url = window.location.origin + url;
      return url;
    }
    return null;
  }
  
  // Helper: Check if element appears selected
  function isSelected(el) {
    const classes = (el.className || '').toLowerCase();
    const ariaSelected = el.getAttribute('aria-selected');
    const ariaChecked = el.getAttribute('aria-checked');
    
    return classes.includes('selected') || 
           classes.includes('active') || 
           classes.includes('current') ||
           classes.includes('checked') ||
           ariaSelected === 'true' ||
           ariaChecked === 'true';
  }
  
  // Helper: Get color name from element
  function getColorName(el) {
    return el.getAttribute('title') || 
           el.getAttribute('aria-label')?.replace(/selected|button|swatch/gi, '').trim() ||
           el.getAttribute('data-color') ||
           el.getAttribute('data-value') ||
           el.alt ||
           '';
  }
  
  // Look for color/finish section by common labels
  const colorLabels = ['color', 'colour', 'finish', 'swatch', 'variant', 'option'];
  let colorContainer = null;
  
  // Method 1: Find by label text
  document.querySelectorAll('label, span, div, h3, h4, p').forEach(el => {
    const text = (el.innerText || '').toLowerCase().trim();
    if (colorLabels.some(label => text === label || text === label + ':' || text === label + 's')) {
      // Found a color label, look for swatches nearby
      let container = el.closest('div, section, fieldset') || el.parentElement;
      for (let i = 0; i < 5 && container; i++) {
        const hasSwatches = container.querySelectorAll('button, [role="radio"], [role="option"], img').length > 1;
        if (hasSwatches) {
          colorContainer = container;
          break;
        }
        container = container.parentElement;
      }
    }
  });
  
  // Method 2: Look for swatch-like containers by class names
  if (!colorContainer) {
    const swatchSelectors = [
      '[class*="swatch"]',
      '[class*="color-option"]',
      '[class*="color-picker"]',
      '[class*="variant"]',
      '[class*="finish"]',
      '[class*="option-tile"]',
      '[data-option="color"]',
      '[data-option="Color"]'
    ];
    
    for (const selector of swatchSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        colorContainer = el.closest('div, ul, fieldset') || el.parentElement;
        break;
      }
    }
  }
  
  // Now find the selected swatch in the container
  if (colorContainer) {
    console.log('Found color container:', colorContainer);
    
    // Look for selected element with background-image (buttons, divs)
    const elementsWithBg = colorContainer.querySelectorAll('button, div, span, a');
    for (const el of elementsWithBg) {
      const bgUrl = getBackgroundImageUrl(el);
      if (bgUrl && isSelected(el)) {
        data.finish_image = bgUrl;
        data.finish_color = getColorName(el);
        console.log('Found selected swatch (bg-image):', data.finish_color, bgUrl);
        break;
      }
    }
    
    // If no selected found with bg-image, try img tags
    if (!data.finish_image) {
      const imgs = colorContainer.querySelectorAll('img');
      for (const img of imgs) {
        const src = img.src || img.dataset.src || '';
        if (!src || !src.startsWith('http')) continue;
        
        const parent = img.closest('button, a, div, li');
        if (parent && isSelected(parent)) {
          data.finish_image = src;
          data.finish_color = getColorName(img) || getColorName(parent);
          console.log('Found selected swatch (img):', data.finish_color, src);
          break;
        }
      }
    }
    
    // Fallback: take first swatch if none selected
    if (!data.finish_image) {
      for (const el of elementsWithBg) {
        const bgUrl = getBackgroundImageUrl(el);
        if (bgUrl) {
          data.finish_image = bgUrl;
          data.finish_color = getColorName(el);
          console.log('Using first swatch (bg-image):', data.finish_color, bgUrl);
          break;
        }
      }
    }
    
    if (!data.finish_image) {
      const firstImg = colorContainer.querySelector('img[src*="http"]');
      if (firstImg) {
        data.finish_image = firstImg.src;
        data.finish_color = getColorName(firstImg);
        console.log('Using first swatch (img):', data.finish_color);
      }
    }
  }
  
  // Fallback: Extract color from product name (e.g., "Chair, Ginger" or "Chair - Oak")
  if (!data.finish_color && data.name) {
    const separators = [',', ' - ', ' – ', ' in '];
    for (const sep of separators) {
      if (data.name.includes(sep)) {
        const parts = data.name.split(sep);
        const lastPart = parts[parts.length - 1].trim();
        // Only use if it looks like a color (short, no numbers)
        if (lastPart.length < 30 && !/\d/.test(lastPart)) {
          data.finish_color = lastPart;
          break;
        }
      }
    }
  }

  console.log('=== UNIVERSAL SCRAPE RESULT ===', data);
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
    
    const projectUrl = `${APP_URL}/checklist/${selectedProjectId}?${params.toString()}`;
    window.open(projectUrl, '_blank');
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

// Auto-detect vendor on popup open
(async()=>{ 
  try { 
    const [t] = await chrome.tabs.query({active:true,currentWindow:true}); 
    if(t?.url){
      const d = new URL(t.url).hostname.replace('www.','');
      const vendor = d.split('.')[0];
      vendorBadge.textContent = vendor.charAt(0).toUpperCase() + vendor.slice(1);
      vendorBadge.style.display = 'block';
    }
  } catch(e){} 
})();
