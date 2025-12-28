// Design Ready Product Scraper v3.1
// FIXED: Excludes social icons and footer images

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
  
  // Vendor
  const vendors = {'uttermost':'Uttermost','visualcomfort':'Visual Comfort','fourhands':'Four Hands','bernhardt':'Bernhardt'};
  for (const [k,v] of Object.entries(vendors)) { if (domain.includes(k)) { data.vendor = v; break; } }
  if (!data.vendor) data.vendor = domain.split('.')[0];
  
  // Name
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  
  // SKU
  const skuMatch = bodyText.match(/(?:SKU|Item)[:#\s]*([A-Z0-9][-A-Z0-9]{2,20})/i);
  if (skuMatch) data.sku = skuMatch[1].toUpperCase();
  
  // Price
  let prices = [];
  document.querySelectorAll('[class*="price"]').forEach(el => {
    const m = (el.innerText||'').match(/\$\s*([\d,]+\.?\d*)/g);
    if (m) m.forEach(x => { const v = parseFloat(x.replace(/[$,]/g,'')); if (v > 10 && v < 500000) prices.push(v); });
  });
  prices = [...new Set(prices)].sort((a,b)=>a-b);
  if (prices.length) { data.price = prices[0]; if (prices.length > 1) data.msrp = prices[prices.length-1]; }
  
  // Size
  const sizeMatch = bodyText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
  if (sizeMatch) data.size = `${sizeMatch[1]} W X ${sizeMatch[2]} H X ${sizeMatch[3]} D`;
  
  // Finish color from name
  if (data.name && data.name.includes(' - ')) {
    data.finish_color = data.name.split(' - ').pop().split(',')[0].trim();
  }
  
  // Helper
  function getSrc(img) {
    return img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
  }
  
  // STRICT exclusion check
  function isExcludedImage(img, src) {
    const srcLower = src.toLowerCase();
    
    // Social media icons - EXPLICIT
    const socialIcons = ['linkedin', 'facebook', 'instagram', 'pinterest', 'twitter', 'youtube', 'tiktok', 'snapchat', 'whatsapp'];
    if (socialIcons.some(s => srcLower.includes(s))) return true;
    
    // Navigation and UI elements
    const uiElements = ['arrow', 'chevron', 'caret', 'nav', 'prev', 'next', 'icon', 'logo', 'sprite', 
                        'pixel', 'track', 'spacer', 'loader', 'loading', 'spinner', 'close', 'x-btn',
                        'search', 'cart', 'bag', 'wishlist', 'heart', 'share', 'social', 'follow'];
    if (uiElements.some(u => srcLower.includes(u))) return true;
    
    // Check if image is in footer
    const footer = img.closest('footer, [class*="footer"], [id*="footer"], [class*="social"], [class*="follow"]');
    if (footer) return true;
    
    // Check alt text for social
    const alt = (img.alt || '').toLowerCase();
    if (socialIcons.some(s => alt.includes(s))) return true;
    
    // Check parent for social indicators
    const parent = img.parentElement;
    const parentClass = (parent?.className || '').toLowerCase();
    const parentHref = (parent?.href || '').toLowerCase();
    if (socialIcons.some(s => parentClass.includes(s) || parentHref.includes(s))) return true;
    
    return false;
  }
  
  // Main image - og:image first
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content) data.image_url = ogImg.content;
  
  if (!data.image_url) {
    let best = null, bestSize = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = getSrc(img);
      if (!src || !src.startsWith('http')) return;
      if (isExcludedImage(img, src)) return;
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (w > 200 && h > 200 && w*h > bestSize) { bestSize = w*h; best = src; }
    });
    if (best) data.image_url = best;
  }
  
  // === SWATCH IMAGE - ONLY from color section ===
  // Find the "Color" section specifically
  let colorSection = null;
  document.querySelectorAll('*').forEach(el => {
    const text = el.innerText?.trim();
    if (text && (text.toLowerCase() === 'color' || text.toLowerCase() === 'colors')) {
      // Found "Color" label - look for nearby swatch container
      let parent = el.parentElement;
      for (let i = 0; i < 5 && parent; i++) {
        const imgs = parent.querySelectorAll('img');
        if (imgs.length >= 2 && imgs.length <= 10) {
          // Found a container with multiple images near "Color" - likely swatches
          colorSection = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }
  });
  
  if (colorSection) {
    console.log('Found color section with images');
    const imgs = colorSection.querySelectorAll('img');
    let bestSwatch = null;
    let bestScore = 0;
    
    for (const img of imgs) {
      const src = getSrc(img);
      if (!src || !src.startsWith('http')) continue;
      if (isExcludedImage(img, src)) continue;
      if (src === data.image_url) continue;
      
      let score = 10; // Base score for being in color section
      
      // Check if selected
      const parent = img.closest('a, button, div, li');
      if (img.classList.contains('selected') || img.classList.contains('active') ||
          parent?.classList.contains('selected') || parent?.classList.contains('active')) {
        score += 50;
      }
      
      // Match color name
      if (data.finish_color) {
        const fc = data.finish_color.toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        const title = (img.title || '').toLowerCase();
        if (alt.includes(fc) || title.includes(fc) || src.toLowerCase().includes(fc)) {
          score += 40;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestSwatch = src;
      }
    }
    
    if (bestSwatch) {
      data.finish_image = bestSwatch;
      console.log('Swatch from color section:', bestSwatch, 'score:', bestScore);
    }
  }
  
  // Fallback: Look for swatch-specific classes ONLY
  if (!data.finish_image) {
    const swatchContainers = document.querySelectorAll('[class*="swatch"], [class*="color-option"], [class*="variant-option"]');
    for (const container of swatchContainers) {
      // Skip if in footer
      if (container.closest('footer, [class*="footer"]')) continue;
      
      const imgs = container.querySelectorAll('img');
      for (const img of imgs) {
        const src = getSrc(img);
        if (!src || !src.startsWith('http')) continue;
        if (isExcludedImage(img, src)) continue;
        if (src === data.image_url) continue;
        
        data.finish_image = src;
        console.log('Swatch from swatch container:', src);
        break;
      }
      if (data.finish_image) break;
    }
  }
  
  // Final fallback: use main image
  if (!data.finish_image && data.image_url) {
    data.finish_image = data.image_url;
    console.log('Using main image as swatch fallback');
  }
  
  console.log('=== SCRAPE RESULT ===', data);
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
