// Design Ready Product Scraper v5.2
// Clean rebuild - SPECIFIC targeting for Uttermost
// Added: Project selector dropdown with persistence

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

// Load projects from API
async function loadProjects() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/projects`);
    if (!response.ok) throw new Error('Failed to load projects');
    const projects = await response.json();
    
    // Clear and populate dropdown
    projectSelector.innerHTML = '<option value="">-- Select a Project --</option>';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      projectSelector.appendChild(option);
    });
    
    // Restore previously selected project
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

// Save selected project when changed
projectSelector?.addEventListener('change', async () => {
  selectedProjectId = projectSelector.value;
  await chrome.storage.local.set({ selectedProjectId: selectedProjectId });
  console.log('Saved project selection:', selectedProjectId);
});

// Load projects on popup open
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
  
  // VENDOR
  if (domain.includes('uttermost')) data.vendor = 'Uttermost';
  else if (domain.includes('visualcomfort')) data.vendor = 'Visual Comfort';
  else if (domain.includes('fourhands')) data.vendor = 'Four Hands';
  else if (domain.includes('bernhardt')) data.vendor = 'Bernhardt';
  else data.vendor = domain.split('.')[0];

  // PRODUCT NAME - from H1
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();

  // SKU - look for "SKU:" text
  const skuEl = document.querySelector('[class*="productSku"], [class*="sku"]');
  if (skuEl) {
    const skuMatch = skuEl.innerText.match(/SKU[:\s]*(\w+)/i);
    if (skuMatch) data.sku = skuMatch[1];
  }
  if (!data.sku) {
    const bodyText = document.body.innerText;
    const skuMatch = bodyText.match(/SKU[:\s]*(\d+)/i);
    if (skuMatch) data.sku = skuMatch[1];
  }

  // DIMENSIONS - "30 W X 27 H X 32 D"
  const bodyText = document.body.innerText;
  const sizeMatch = bodyText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
  if (sizeMatch) data.size = `${sizeMatch[1]} W X ${sizeMatch[2]} H X ${sizeMatch[3]} D`;

  // PRICE & MSRP - Search the entire page text
  // Uttermost format: "$488.00" and "Suggested retail price $1,464.00"
  const pageText = document.body.innerText;
  
  // First get MSRP - it's clearly labeled
  const msrpMatch = pageText.match(/Suggested retail price \$([\d,]+\.?\d*)/i);
  if (msrpMatch) {
    data.msrp = parseFloat(msrpMatch[1].replace(/,/g, ''));
    console.log('Found MSRP:', data.msrp);
  }
  
  // For dealer price, look for pattern: standalone price before "Suggested retail"
  // Or find price near "ADD TO CART"
  const addToCartMatch = pageText.match(/\$([\d,]+\.?\d*)\s*[\s\S]*?ADD TO CART/i);
  if (addToCartMatch) {
    data.price = parseFloat(addToCartMatch[1].replace(/,/g, ''));
    console.log('Found price near ADD TO CART:', data.price);
  }
  
  // Fallback: find all prices and pick the one that looks like dealer price
  if (!data.price) {
    const allPrices = pageText.match(/\$([\d,]+\.?\d*)/g) || [];
    console.log('All prices found:', allPrices);
    
    for (const p of allPrices) {
      const val = parseFloat(p.replace(/[$,]/g, ''));
      // Dealer price should be > $50 and if we have MSRP, should be less than MSRP
      if (val > 50 && val < 50000) {
        if (data.msrp && val < data.msrp) {
          data.price = val;
          console.log('Found dealer price:', data.price);
          break;
        } else if (!data.msrp) {
          data.price = val;
          break;
        }
      }
    }
  }

  // PRODUCT IMAGE - main product photo from carousel
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage?.content) {
    data.image_url = ogImage.content;
  } else {
    const mainImg = document.querySelector('.swiper-slide-active img, [class*="product-image"] img');
    if (mainImg) data.image_url = mainImg.src;
  }

  // ============================================================================
  // COLOR SWATCH DETECTION - ALL VENDORS
  // ============================================================================
  const domain = window.location.hostname.toLowerCase();
  
  // === UTTERMOST: button[style*="background-image"] ===
  if (domain.includes('uttermost')) {
    const colorLabel = Array.from(document.querySelectorAll('span, label, div')).find(
      el => el.innerText?.trim().toLowerCase() === 'color'
    );
    if (colorLabel) {
      const container = colorLabel.closest('div[class*="option"], section') || colorLabel.parentElement;
      if (container) {
        const swatchButtons = container.querySelectorAll('button[style*="background-image"]');
        for (const btn of swatchButtons) {
          const isSelected = btn.className?.includes('selected') || btn.getAttribute('aria-selected') === 'true';
          if (isSelected || !data.finish_color) {
            data.finish_color = btn.getAttribute('title') || '';
            const style = btn.getAttribute('style') || '';
            const bgMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
            if (bgMatch) {
              let imgUrl = bgMatch[1];
              if (imgUrl.startsWith('/')) imgUrl = window.location.origin + imgUrl;
              data.finish_image = imgUrl;
            }
            if (isSelected) break;
          }
        }
      }
    }
  }
  
  // === FOUR HANDS: Small swatch images ===
  else if (domain.includes('fourhands')) {
    const swatchImgs = document.querySelectorAll('img[src*="swatch" i], img[alt*="swatch" i], [class*="swatch" i] img, [class*="cover" i] img');
    for (const img of swatchImgs) {
      const w = img.naturalWidth || img.width || 50;
      const h = img.naturalHeight || img.height || 50;
      if (w < 200 && h < 200 && w > 15) {
        const parent = img.closest('[class*="selected" i], .active');
        if (parent || !data.finish_image) {
          data.finish_image = img.src;
          data.finish_color = img.alt || img.getAttribute('title') || '';
          if (parent) break;
        }
      }
    }
  }
  
  // === VISUAL COMFORT / HVL GROUP: Finish swatches ===
  else if (domain.includes('visualcomfort') || domain.includes('hvlgroup')) {
    const finishImgs = document.querySelectorAll('[class*="finish" i] img, [class*="swatch" i] img, [data-finish] img');
    for (const img of finishImgs) {
      const parent = img.closest('[class*="selected" i], .active, [aria-selected="true"]');
      const link = img.closest('a');
      if (parent || link?.className?.includes('selected') || !data.finish_image) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || parent?.textContent?.trim() || '';
        if (parent || link?.className?.includes('selected')) break;
      }
    }
  }
  
  // === ROWE FURNITURE: Fabric swatches ===
  else if (domain.includes('rowe')) {
    const fabricImgs = document.querySelectorAll('img[src*="fabric" i], [class*="fabric" i] img, [class*="swatch" i] img');
    for (const img of fabricImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 150 && w > 15) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || '';
        break;
      }
    }
  }
  
  // === BERNHARDT: Fabric/finish selectors ===
  else if (domain.includes('bernhardt')) {
    const swatchImgs = document.querySelectorAll('[class*="fabric" i] img, [class*="finish" i] img, [class*="swatch" i] img');
    for (const img of swatchImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        const parent = img.closest('[class*="active" i], [class*="selected" i]');
        if (parent || !data.finish_image) {
          data.finish_image = img.src;
          data.finish_color = img.alt || img.getAttribute('title') || '';
          if (parent) break;
        }
      }
    }
  }
  
  // === LOLOI RUGS: Color swatches ===
  else if (domain.includes('loloi')) {
    const colorImgs = document.querySelectorAll('[class*="color" i] img, [class*="swatch" i] img, [data-color] img');
    for (const img of colorImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        const parent = img.closest('[class*="selected" i], [class*="active" i]');
        if (parent || !data.finish_image) {
          data.finish_image = img.src;
          data.finish_color = img.alt || img.getAttribute('title') || parent?.textContent?.trim() || '';
          if (parent) break;
        }
      }
    }
  }
  
  // === GLOBAL VIEWS: Finish options ===
  else if (domain.includes('globalviews')) {
    const finishImgs = document.querySelectorAll('[class*="finish" i] img, [class*="swatch" i] img');
    for (const img of finishImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || '';
        break;
      }
    }
  }
  
  // === REGINA ANDREW: Finish swatches ===
  else if (domain.includes('reginaandrew')) {
    const swatchImgs = document.querySelectorAll('[class*="finish" i] img, [class*="swatch" i] img');
    for (const img of swatchImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || '';
        break;
      }
    }
  }
  
  // === ARTERIORS: Finish selections ===
  else if (domain.includes('arteriors')) {
    const finishImgs = document.querySelectorAll('[class*="finish" i] img, [class*="material" i] img');
    for (const img of finishImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || '';
        break;
      }
    }
  }
  
  // === CURREY & COMPANY: Finish options ===
  else if (domain.includes('currey')) {
    const finishImgs = document.querySelectorAll('[class*="finish" i] img, [class*="swatch" i] img');
    for (const img of finishImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || '';
        break;
      }
    }
  }
  
  // === PHILLIPS COLLECTION: Material/finish ===
  else if (domain.includes('phillipscollection')) {
    const finishImgs = document.querySelectorAll('[class*="finish" i] img, [class*="material" i] img');
    for (const img of finishImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 15) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('title') || '';
        break;
      }
    }
  }
  
  // === GENERIC FALLBACK: Works for most vendors ===
  if (!data.finish_image) {
    // Method 1: Look for elements with swatch/color/finish/fabric keywords
    const swatchSelectors = [
      '[class*="swatch" i] img',
      '[class*="color" i] img',
      '[class*="finish" i] img',
      '[class*="fabric" i] img',
      '[class*="material" i] img',
      'img[src*="swatch" i]',
      'img[src*="color" i]',
      'img[src*="finish" i]',
      'img[src*="fabric" i]',
      'img[alt*="swatch" i]',
      'img[alt*="color" i]',
      'img[alt*="finish" i]',
      'button[style*="background-image"]'
    ];
    
    for (const selector of swatchSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (el.tagName === 'IMG') {
          const w = el.naturalWidth || el.width || 50;
          const h = el.naturalHeight || el.height || 50;
          // Small square-ish images are likely swatches
          if (w < 200 && h < 200 && w > 15 && h > 15) {
            const parent = el.closest('[class*="selected" i], [class*="active" i], [aria-selected="true"]');
            if (parent || !data.finish_image) {
              data.finish_image = el.src;
              data.finish_color = el.alt || el.getAttribute('title') || '';
              if (parent) break;
            }
          }
        } else if (el.tagName === 'BUTTON') {
          // For buttons with background-image
          const style = el.getAttribute('style') || '';
          const bgMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
          if (bgMatch) {
            let imgUrl = bgMatch[1];
            if (imgUrl.startsWith('/')) imgUrl = window.location.origin + imgUrl;
            data.finish_image = imgUrl;
            data.finish_color = el.getAttribute('title') || el.getAttribute('aria-label') || '';
            break;
          }
        }
      }
      if (data.finish_image) break;
    }
  }
  
  // Fallback: Get color name from product name (e.g., "Abound Swivel Chair, Ginger")
  if (!data.finish_color && data.name && data.name.includes(',')) {
    data.finish_color = data.name.split(',').pop().trim();
  }

  console.log('Scraped data:', data);
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
  
  // Check if project is selected
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
    
    // Go directly to the selected project's checklist
    const projectUrl = `${APP_URL}/project/${selectedProjectId}?tab=Checklist&${params.toString()}`;
    
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
      const d=new URL(t.url).hostname; 
      if(d.includes('uttermost')){
        vendorBadge.textContent='Uttermost';
        vendorBadge.style.display='block';
      }
    }
  } catch(e){} 
})();
