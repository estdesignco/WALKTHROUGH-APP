// Design Ready Product Scraper v4.0
// CRITICAL FIX: Swatch images on Uttermost are CSS background-images on buttons, NOT img tags!

const APP_URL = 'https://decor-grab.preview.emergentagent.com';
const BACKEND_URL = 'https://decor-grab.preview.emergentagent.com';
let scrapedData = null;

const scrapeBtn = document.getElementById('scrapeBtn');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const rescrapeBtn = document.getElementById('rescrapeBtn');
const statusBar = document.getElementById('statusBar');
const emptyState = document.getElementById('emptyState');
const resultsContainer = document.getElementById('resultsContainer');
const vendorBadge = document.getElementById('vendorBadge');
const loginWarning = document.getElementById('loginWarning');

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

function scrapePageData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const bodyText = document.body.innerText || '';
  
  const data = { url, vendor: null, name: null, sku: null, price: null, msrp: null, size: null, finish_color: null, finish_image: null, image_url: null };
  
  // Vendor detection
  const vendors = {'uttermost':'Uttermost','visualcomfort':'Visual Comfort','fourhands':'Four Hands','bernhardt':'Bernhardt'};
  for (const [k,v] of Object.entries(vendors)) { if (domain.includes(k)) { data.vendor = v; break; } }
  if (!data.vendor) data.vendor = domain.split('.')[0];
  
  // Product Name from H1
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  
  // SKU
  const skuMatch = bodyText.match(/(?:SKU|Item)[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i);
  if (skuMatch) data.sku = skuMatch[1].toUpperCase();
  
  // Price - comprehensive search
  let prices = [];
  
  // Method 1: Elements with "price" in class
  document.querySelectorAll('[class*="price"], [class*="Price"]').forEach(el => {
    const m = (el.innerText||'').match(/\$\s*([\d,]+\.?\d*)/g);
    if (m) m.forEach(x => { const v = parseFloat(x.replace(/[$,]/g,'')); if (v > 10 && v < 500000) prices.push(v); });
  });
  
  // Method 2: Look for price near common labels
  document.querySelectorAll('*').forEach(el => {
    const text = el.innerText?.trim() || '';
    // Look for "Price:" or "Your Price:" patterns
    if (text.match(/^(Your\s+)?Price:?\s*\$/i)) {
      const m = text.match(/\$\s*([\d,]+\.?\d*)/);
      if (m) { const v = parseFloat(m[1].replace(/,/g,'')); if (v > 10 && v < 500000) prices.push(v); }
    }
  });
  
  // Method 3: Find any dollar amounts on the page in product area
  const productArea = document.querySelector('[class*="productFullDetail"], [class*="product-detail"], main, article') || document.body;
  const priceMatches = productArea.innerText.match(/\$\s*[\d,]+\.?\d*/g) || [];
  priceMatches.forEach(p => {
    const v = parseFloat(p.replace(/[$,\s]/g, ''));
    if (v > 50 && v < 50000) prices.push(v); // Reasonable furniture price range
  });
  
  prices = [...new Set(prices)].sort((a,b)=>a-b);
  console.log('Found prices:', prices);
  if (prices.length) { data.price = prices[0]; if (prices.length > 1) data.msrp = prices[prices.length-1]; }
  
  // Size
  const sizeMatch = bodyText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
  if (sizeMatch) data.size = `${sizeMatch[1]} W X ${sizeMatch[2]} H X ${sizeMatch[3]} D`;
  
  // Helper to extract background-image URL from style
  function extractBackgroundImageUrl(element) {
    const style = element.getAttribute('style') || '';
    const computed = window.getComputedStyle(element);
    const bgImage = computed.backgroundImage || style;
    
    // Match url("...") or url('...') or url(...)
    const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
    if (urlMatch && urlMatch[1]) {
      let imgUrl = urlMatch[1];
      // Convert relative URL to absolute
      if (imgUrl.startsWith('/')) {
        imgUrl = window.location.origin + imgUrl;
      }
      return imgUrl;
    }
    return null;
  }
  
  // Helper to get image src
  function getSrc(img) {
    return img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
  }
  
  // Check if element/src should be excluded
  function isExcludedImage(src, element) {
    const srcLower = src.toLowerCase();
    const socialIcons = ['linkedin', 'facebook', 'instagram', 'pinterest', 'twitter', 'youtube', 'tiktok'];
    const uiElements = ['arrow', 'chevron', 'caret', 'nav', 'prev', 'next', 'icon', 'logo', 'sprite', 
                        'pixel', 'track', 'spacer', 'loader', 'spinner', 'close', 'search', 'cart', 
                        'bag', 'wishlist', 'heart', 'share', 'social', 'follow'];
    
    if (socialIcons.some(s => srcLower.includes(s))) return true;
    if (uiElements.some(u => srcLower.includes(u))) return true;
    if (element?.closest('footer, [class*="footer"], [class*="social"]')) return true;
    
    return false;
  }
  
  // === UTTERMOST SPECIFIC: Color swatch buttons with background-image ===
  console.log('=== STARTING UTTERMOST SWATCH DETECTION ===');
  
  // Find the Color option section - look for span with "Color" text
  const colorLabels = document.querySelectorAll('span.option-title-KCu, [class*="option-title"]');
  let colorOptionContainer = null;
  
  for (const label of colorLabels) {
    if (label.textContent.trim().toLowerCase() === 'color') {
      // Found the Color label - the container is its parent
      colorOptionContainer = label.closest('[class*="option-root"]') || label.parentElement;
      console.log('Found Color option container via label');
      break;
    }
  }
  
  // Fallback: look for tileList with buttons having background-image
  if (!colorOptionContainer) {
    const tileLists = document.querySelectorAll('[class*="tileList"], [class*="tile-list"]');
    for (const list of tileLists) {
      const buttons = list.querySelectorAll('button[style*="background-image"]');
      if (buttons.length > 0) {
        colorOptionContainer = list.closest('[class*="option-root"]') || list;
        console.log('Found Color option via tileList with background-image buttons');
        break;
      }
    }
  }
  
  if (colorOptionContainer) {
    console.log('Color option container found');
    
    // Look for buttons with background-image (these are the swatches!)
    const swatchButtons = colorOptionContainer.querySelectorAll('button[style*="background-image"]');
    console.log('Found', swatchButtons.length, 'swatch buttons with background-image');
    
    for (const btn of swatchButtons) {
      const isSelected = btn.classList.contains('tile-root_selected-Au1') || 
                         btn.classList.contains('selected') ||
                         btn.getAttribute('aria-selected') === 'true' ||
                         btn.classList.toString().includes('selected');
      
      const colorName = btn.getAttribute('title') || btn.getAttribute('aria-label')?.replace(/^Fashion size /, '').replace(/ button selected$/, '') || '';
      const bgUrl = extractBackgroundImageUrl(btn);
      
      console.log('Swatch button:', colorName, 'selected:', isSelected, 'bgUrl:', bgUrl);
      
      if (isSelected && bgUrl) {
        data.finish_image = bgUrl;
        data.finish_color = colorName;
        console.log('*** FOUND SELECTED SWATCH ***', colorName, bgUrl);
        break;
      }
    }
    
    // If no selected found, take first one
    if (!data.finish_image && swatchButtons.length > 0) {
      const firstBtn = swatchButtons[0];
      const bgUrl = extractBackgroundImageUrl(firstBtn);
      const colorName = firstBtn.getAttribute('title') || '';
      if (bgUrl) {
        data.finish_image = bgUrl;
        data.finish_color = colorName;
        console.log('Using first swatch as fallback:', colorName, bgUrl);
      }
    }
  }
  
  // Fallback: Extract color from product name if contains comma (e.g., "Abound Swivel Chair, Ginger")
  if (!data.finish_color && data.name) {
    const parts = data.name.split(',');
    if (parts.length > 1) {
      data.finish_color = parts[parts.length - 1].trim();
      console.log('Extracted finish_color from name:', data.finish_color);
    }
  }
  
  // === MAIN PRODUCT IMAGE ===
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content) data.image_url = ogImg.content;
  
  if (!data.image_url) {
    // Look for main product image in swiper or image carousel
    const mainImageSelectors = [
      '.swiper-slide-active img',
      '[class*="imageCarousel"] img',
      '[class*="product-image"] img',
      '[class*="productSlider"] .swiper-slide-active img'
    ];
    
    for (const selector of mainImageSelectors) {
      const img = document.querySelector(selector);
      if (img) {
        const src = getSrc(img);
        if (src && src.startsWith('http') && !isExcludedImage(src, img)) {
          data.image_url = src;
          console.log('Main image from selector:', selector, src);
          break;
        }
      }
    }
  }
  
  // Ultimate fallback for main image
  if (!data.image_url) {
    let best = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = getSrc(img);
      if (!src || !src.startsWith('http')) return;
      if (isExcludedImage(src, img)) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w > 200 && h > 200 && w*h > bestSize) { bestSize = w*h; best = src; }
    });
    if (best) data.image_url = best;
  }
  
  // === GENERIC FALLBACK FOR SWATCH (for non-Uttermost sites) ===
  if (!data.finish_image) {
    // Try finding swatch images (actual img tags)
    const swatchContainers = document.querySelectorAll('[class*="swatch"], [class*="color-option"], [class*="variant"]');
    for (const container of swatchContainers) {
      if (container.closest('footer')) continue;
      
      // Check for background-image on any element
      const elementsWithBg = container.querySelectorAll('[style*="background-image"]');
      for (const el of elementsWithBg) {
        const bgUrl = extractBackgroundImageUrl(el);
        if (bgUrl && !isExcludedImage(bgUrl, el)) {
          data.finish_image = bgUrl;
          console.log('Swatch from background-image:', bgUrl);
          break;
        }
      }
      if (data.finish_image) break;
      
      // Check for img tags
      const imgs = container.querySelectorAll('img');
      for (const img of imgs) {
        const src = getSrc(img);
        if (src && src.startsWith('http') && !isExcludedImage(src, img) && src !== data.image_url) {
          data.finish_image = src;
          console.log('Swatch from img tag:', src);
          break;
        }
      }
      if (data.finish_image) break;
    }
  }
  
  console.log('=== FINAL SCRAPE RESULT ===', data);
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
  sendBtn.disabled = true;
  try {
    try { await fetch(`${BACKEND_URL}/api/extension-scrape`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(scrapedData)}); } catch(e){}
    const params = new URLSearchParams();
    params.set('action','add-item'); params.set('source','extension');
    if(scrapedData.name) params.set('name',scrapedData.name);
    if(scrapedData.price) params.set('price',scrapedData.price);
    if(scrapedData.sku) params.set('sku',scrapedData.sku);
    if(scrapedData.size) params.set('size',scrapedData.size);
    if(scrapedData.finish_color) params.set('finish',scrapedData.finish_color);
    if(scrapedData.finish_image) params.set('finish_image',scrapedData.finish_image);
    if(scrapedData.vendor) params.set('vendor',scrapedData.vendor);
    if(scrapedData.url) params.set('link',scrapedData.url);
    if(scrapedData.image_url) params.set('image',scrapedData.image_url);
    let appUrl = APP_URL;
    try { const s = await chrome.storage.local.get('lastProjectUrl'); if(s.lastProjectUrl?.includes('/project/')) appUrl = s.lastProjectUrl.split('?')[0]; } catch(e){}
    window.open(`${appUrl}?${params.toString()}`, '_blank');
    showStatus('Sent!', 'success');
  } catch(e) { showStatus('Failed', 'error'); }
  finally { sendBtn.disabled = false; sendBtn.innerHTML = '<span>🚀</span><span>SEND TO APP</span>'; }
}

async function copyToClipboard() {
  if (!scrapedData) return;
  try { await navigator.clipboard.writeText(`${scrapedData.name}\n$${scrapedData.price}\n${scrapedData.vendor}\n${scrapedData.finish_color}`); copyBtn.innerHTML='<span>✅</span><span>Copied!</span>'; setTimeout(()=>{copyBtn.innerHTML='<span>📋</span><span>Copy</span>';},2000); } catch(e){}
}

scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

(async()=>{ try { const [t] = await chrome.tabs.query({active:true,currentWindow:true}); if(t?.url){const d=new URL(t.url).hostname; if(d.includes('uttermost')){vendorBadge.textContent='Uttermost';vendorBadge.style.display='block';}}} catch(e){} })();
