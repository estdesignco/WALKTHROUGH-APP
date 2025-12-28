// Design Ready Product Scraper - Popup Script v3.0
// FIXED: Aggressive image extraction

const APP_URL = 'https://vendor-bridge-8.preview.emergentagent.com';
const BACKEND_URL = 'https://vendor-bridge-8.preview.emergentagent.com';

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
  const icons = { success: '✅', error: '❌', info: '🔍', warning: '⚠️' };
  statusBar.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
}

function displayResults(data) {
  scrapedData = data;
  emptyState.style.display = 'none';
  resultsContainer.style.display = 'block';
  
  if (data.vendor) {
    vendorBadge.textContent = data.vendor;
    vendorBadge.style.display = 'block';
  }
  
  document.getElementById('productName').textContent = data.name || 'Unknown Product';
  document.getElementById('productSku').textContent = data.sku ? `SKU: ${data.sku}` : '';
  
  const priceEl = document.getElementById('productPrice');
  if (data.price) {
    priceEl.textContent = `$${parseFloat(data.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    priceEl.className = 'product-price';
    loginWarning.style.display = 'none';
  } else {
    priceEl.textContent = 'Price not found';
    priceEl.className = 'product-price missing';
    loginWarning.style.display = 'flex';
  }
  
  // Product image
  const imgEl = document.getElementById('productImage');
  if (data.image_url) {
    imgEl.src = data.image_url;
    imgEl.style.display = 'block';
    imgEl.onerror = () => { imgEl.style.display = 'none'; };
  } else {
    imgEl.style.display = 'none';
  }
  
  // Finish swatch image
  const finishImgEl = document.getElementById('finishImage');
  const finishImgContainer = document.getElementById('finishImageContainer');
  const finishNameEl = document.getElementById('finishName');
  
  if (data.finish_image) {
    finishImgEl.src = data.finish_image;
    finishImgContainer.style.display = 'flex';
    finishImgContainer.classList.add('visible');
    finishNameEl.textContent = data.finish_color || 'Swatch';
    finishImgEl.onerror = () => { finishImgContainer.style.display = 'none'; };
  } else {
    finishImgContainer.style.display = 'none';
  }
  
  document.getElementById('dataVendor').textContent = data.vendor || 'Not found';
  document.getElementById('dataSize').textContent = data.size || 'Not found';
  document.getElementById('dataFinish').textContent = data.finish_color || 'Not found';
  document.getElementById('dataMsrp').textContent = data.msrp ? `$${parseFloat(data.msrp).toLocaleString()}` : 'Not found';
  document.getElementById('dataUrl').textContent = data.url || 'Not found';
  
  console.log('=== SCRAPE RESULTS ===');
  console.log('Main Image:', data.image_url || 'NONE');
  console.log('Finish Image:', data.finish_image || 'NONE');
}

// The scraping function - runs in page context
function scrapePageData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const bodyText = document.body.innerText || '';
  
  const data = {
    url: url,
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
  
  // === VENDOR ===
  const vendorMap = {
    'uttermost': 'Uttermost', 'visualcomfort': 'Visual Comfort', 'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt', 'reginaandrew': 'Regina Andrew', 'jaipurliving': 'Jaipur Living',
    'loloirugs': 'Loloi', 'globalviews': 'Global Views', 'surya': 'Surya', 'gabby': 'Gabby'
  };
  for (const [key, val] of Object.entries(vendorMap)) {
    if (domain.includes(key)) { data.vendor = val; break; }
  }
  if (!data.vendor) data.vendor = domain.split('.')[0];
  
  // === NAME ===
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  if (!data.name) {
    const og = document.querySelector('meta[property="og:title"]');
    if (og) data.name = og.content.split('|')[0].trim();
  }
  
  // === SKU ===
  const skuMatch = bodyText.match(/(?:SKU|Item)[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i);
  if (skuMatch) data.sku = skuMatch[1].toUpperCase();
  if (!data.sku) {
    const urlSku = url.match(/\/([A-Z0-9][-A-Z0-9]{4,15})(?:[\/?#]|$)/i);
    if (urlSku) data.sku = urlSku[1].toUpperCase();
  }
  
  // === PRICE ===
  const priceEls = document.querySelectorAll('[class*="price"]');
  let prices = [];
  priceEls.forEach(el => {
    const matches = (el.innerText || '').match(/\$\s*([\d,]+\.?\d*)/g);
    if (matches) matches.forEach(m => {
      const v = parseFloat(m.replace(/[$,]/g, ''));
      if (v > 10 && v < 500000) prices.push(v);
    });
  });
  prices = [...new Set(prices)].sort((a,b) => a-b);
  if (prices.length > 0) { data.price = prices[0]; if (prices.length > 1) data.msrp = prices[prices.length-1]; }
  
  // === SIZE ===
  const sizeMatch = bodyText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
  if (sizeMatch) data.size = `${sizeMatch[1]} W X ${sizeMatch[2]} H X ${sizeMatch[3]} D`;
  
  // === FINISH COLOR (from title) ===
  const finishes = ['Bronze','Brass','Gold','Silver','Chrome','Nickel','Black','White','Toffee','Smoke','Gray','Natural','Oak','Walnut','Leather'];
  if (data.name) {
    for (const f of finishes) {
      if (data.name.toLowerCase().includes(f.toLowerCase())) { data.finish_color = f; break; }
    }
  }
  if (!data.finish_color && data.name && data.name.includes(' - ')) {
    const parts = data.name.split(' - ');
    if (parts.length > 1) data.finish_color = parts[parts.length-1].split(',')[0].trim();
  }
  
  // === HELPER: Get any possible src from an image ===
  function getSrc(img) {
    return img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || 
           img.getAttribute('data-original') || img.getAttribute('data-zoom-image') ||
           (img.srcset ? img.srcset.split(',')[0].split(' ')[0] : '') || '';
  }
  
  // === MAIN PRODUCT IMAGE - AGGRESSIVE ===
  // Try og:image first
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg && ogImg.content) {
    data.image_url = ogImg.content;
    console.log('Got og:image:', data.image_url);
  }
  
  // Try common selectors
  if (!data.image_url) {
    const selectors = [
      'img[class*="product"]', 'img[class*="gallery"]', 'img[class*="main"]',
      'img[class*="hero"]', 'img[class*="primary"]', '.product-image img',
      '.gallery img', '.main-image img', '#product-image', '.pdp-image img'
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img) {
        const src = getSrc(img);
        if (src && src.startsWith('http')) { data.image_url = src; console.log('Got image from selector:', sel); break; }
      }
    }
  }
  
  // Find LARGEST image on page (likely product image)
  if (!data.image_url) {
    let bestImg = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = getSrc(img);
      if (!src || !src.startsWith('http') || src.startsWith('data:')) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w * h > bestSize && w > 200 && h > 200) {
        bestSize = w * h;
        bestImg = src;
      }
    });
    if (bestImg) { data.image_url = bestImg; console.log('Got largest image:', bestImg); }
  }
  
  // Last resort - first big image
  if (!data.image_url) {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      const src = getSrc(img);
      if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
        data.image_url = src;
        console.log('Got first valid image:', src);
        break;
      }
    }
  }
  
  // === FINISH/SWATCH IMAGE ===
  const isExcluded = (src) => {
    const lower = src.toLowerCase();
    return ['arrow','chevron','nav','prev','next','icon','logo','sprite','pixel','track','spacer','load','close','search','cart','social','facebook','twitter','instagram'].some(x => lower.includes(x));
  };
  
  // Collect ALL small-medium images that aren't the main image
  const swatchCandidates = [];
  document.querySelectorAll('img').forEach(img => {
    const src = getSrc(img);
    if (!src || !src.startsWith('http') || src.startsWith('data:')) return;
    if (src === data.image_url) return; // Skip main image
    if (isExcluded(src)) return;
    
    const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
    const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
    
    // Skip very large (main product) or tiny (icons)
    if (w > 400 || h > 400) return;
    if (w > 0 && w < 25) return;
    if (h > 0 && h < 25) return;
    
    // Score it
    let score = 1;
    const srcLower = src.toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    const cls = (img.className || '').toLowerCase();
    const parentCls = (img.parentElement?.className || '').toLowerCase();
    const gpCls = (img.parentElement?.parentElement?.className || '').toLowerCase();
    
    if (srcLower.includes('swatch') || srcLower.includes('leather') || srcLower.includes('fabric') || srcLower.includes('color')) score += 30;
    if (cls.includes('swatch') || cls.includes('color') || cls.includes('option')) score += 20;
    if (parentCls.includes('swatch') || parentCls.includes('color')) score += 15;
    if (gpCls.includes('swatch') || gpCls.includes('color')) score += 10;
    if (img.classList.contains('selected') || img.classList.contains('active')) score += 25;
    if (img.parentElement?.classList.contains('selected') || img.parentElement?.classList.contains('active')) score += 25;
    
    if (data.finish_color) {
      const fc = data.finish_color.toLowerCase();
      if (alt.includes(fc) || img.title?.toLowerCase().includes(fc) || srcLower.includes(fc)) score += 30;
    }
    
    swatchCandidates.push({ src, score });
  });
  
  // Sort and pick best
  if (swatchCandidates.length > 0) {
    swatchCandidates.sort((a,b) => b.score - a.score);
    data.finish_image = swatchCandidates[0].src;
    console.log('Best swatch:', data.finish_image, 'score:', swatchCandidates[0].score);
  }
  
  // Fallback
  if (!data.finish_image && data.image_url) {
    data.finish_image = data.image_url;
    console.log('Using main image as swatch fallback');
  }
  
  console.log('=== FINAL DATA ===', data);
  return data;
}

// Main scrape action
async function doScrape() {
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<div class="spinner"></div><span>Scraping...</span>';
  showStatus('Extracting product data...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      throw new Error('Navigate to a product page first');
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageData
    });
    
    const data = results[0].result;
    if (!data) throw new Error('Scrape returned no data');
    
    displayResults(data);
    showStatus(data.name ? `Found: ${data.name}` : 'Scraped page', 'success');
  } catch (error) {
    console.error('Scrape error:', error);
    showStatus(error.message || 'Failed', 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
}

// Send to app
async function sendToApp() {
  if (!scrapedData) return;
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<div class="spinner"></div><span>Sending...</span>';
  
  try {
    try { await fetch(`${BACKEND_URL}/api/extension-scrape`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(scrapedData) }); } catch(e){}
    
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('source', 'extension');
    Object.entries({
      name: scrapedData.name, price: scrapedData.price, sku: scrapedData.sku,
      size: scrapedData.size, finish: scrapedData.finish_color, finish_image: scrapedData.finish_image,
      vendor: scrapedData.vendor, link: scrapedData.url, image: scrapedData.image_url, msrp: scrapedData.msrp
    }).forEach(([k,v]) => { if(v) params.set(k,v); });
    
    let appUrl = APP_URL;
    try {
      const stored = await chrome.storage.local.get('lastProjectUrl');
      if (stored.lastProjectUrl?.includes('/project/')) appUrl = stored.lastProjectUrl.split('?')[0];
    } catch(e){}
    
    window.open(`${appUrl}?${params.toString()}`, '_blank');
    showStatus('Sent! Click PASTE on any row.', 'success');
  } catch(e) { showStatus('Failed', 'error'); }
  finally { sendBtn.disabled = false; sendBtn.innerHTML = '<span>🚀</span><span>SEND TO APP</span>'; }
}

// Copy
async function copyToClipboard() {
  if (!scrapedData) return;
  const text = `Product: ${scrapedData.name}\nPrice: $${scrapedData.price||'N/A'}\nSKU: ${scrapedData.sku||'N/A'}\nVendor: ${scrapedData.vendor||'N/A'}\nFinish: ${scrapedData.finish_color||'N/A'}`;
  try { await navigator.clipboard.writeText(text); copyBtn.innerHTML = '<span>✅</span><span>Copied!</span>'; setTimeout(()=>{copyBtn.innerHTML='<span>📋</span><span>Copy</span>';},2000); } catch(e){}
}

scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);

(async function() {
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (tab?.url) {
      const d = new URL(tab.url).hostname.replace('www.','');
      const v = {'uttermost':'Uttermost','visualcomfort':'Visual Comfort','fourhands':'Four Hands'};
      for (const [k,n] of Object.entries(v)) { if(d.includes(k)){vendorBadge.textContent=n;vendorBadge.style.display='block';break;} }
    }
  } catch(e){}
})();
