// Design Ready Product Scraper v6.2.0
// FIXED: Four Hands Cover/Cushion selector detection
// FIXED: Round swatch image detection

const APP_URL = 'https://furnscape.preview.emergentagent.com';
const BACKEND_URL = 'https://furnscape.preview.emergentagent.com';
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
    console.log('Loading projects from:', `${BACKEND_URL}/api/projects`);
    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const projects = await response.json();
    console.log('Projects loaded:', projects.length);
    
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
    console.error('Error details:', e.message);
    projectSelector.innerHTML = '<option value="">-- Could not load --</option>';
    
    // Show error in status bar
    showStatus(`Projects failed: ${e.message}`, 'warning');
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

  // SKU - vendor-specific logic
  if (domain.includes('fourhands')) {
    // Four Hands: SKU is in subtitle "Color • SKU" format
    const subtitleEl = document.querySelector('.text-neutral-50');
    if (subtitleEl && subtitleEl.textContent.includes('•')) {
      const parts = subtitleEl.textContent.split('•');
      if (parts.length >= 2) {
        data.sku = parts[1].trim();
      }
    }
    // Also try URL - Four Hands URLs end with SKU like /product/247447-002
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/\/product\/(\d+-\d+)/);
      if (urlMatch) data.sku = urlMatch[1];
    }
  } else {
    // Generic SKU detection
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
  }

  // DIMENSIONS - vendor-specific logic
  const bodyText = document.body.innerText;
  
  if (domain.includes('fourhands')) {
    // Four Hands: "21.50"w x 23.00"d x 38.50"h" format
    const fhSizeMatch = bodyText.match(/([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h/i);
    if (fhSizeMatch) {
      data.size = `${fhSizeMatch[1]}"W x ${fhSizeMatch[2]}"D x ${fhSizeMatch[3]}"H`;
    }
  } else {
    // Generic: "30 W X 27 H X 32 D" format
    const sizeMatch = bodyText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
    if (sizeMatch) data.size = `${sizeMatch[1]} W X ${sizeMatch[2]} H X ${sizeMatch[3]} D`;
  }

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

  // PRODUCT IMAGE - vendor-specific main product photo
  if (domain.includes('fourhands')) {
    // Four Hands: Look for gallery images with PRM (primary) in filename
    const galleryImgs = document.querySelectorAll('img[src*="_PRM_"], img[src*="_FRT_"]');
    for (const img of galleryImgs) {
      // Get the large version (not thumbnail)
      if (img.src && img.src.includes('1200x1200')) {
        data.image_url = img.src;
        break;
      }
    }
    // Fallback: get any large gallery image
    if (!data.image_url) {
      const largeImg = document.querySelector('img[src*="1200x1200"]');
      if (largeImg) data.image_url = largeImg.src;
    }
  }
  
  // Generic fallbacks
  if (!data.image_url) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content) {
      data.image_url = ogImage.content;
    } else {
      const mainImg = document.querySelector('.swiper-slide-active img, [class*="product-image"] img');
      if (mainImg) data.image_url = mainImg.src;
    }
  }

  // ============================================================================
  // FINISH COLOR & SWATCH IMAGE DETECTION - ALL 26 VENDORS
  // ============================================================================
  
  // UTTERMOST: button[style*="background-image"] - WORKING, DON'T TOUCH
  const colorLabel = Array.from(document.querySelectorAll('span, label, div')).find(
    el => el.innerText?.trim().toLowerCase() === 'color'
  );
  if (colorLabel) {
    const container = colorLabel.closest('div[class*="option"], section') || colorLabel.parentElement;
    if (container) {
      const swatchButtons = container.querySelectorAll('button[style*="background-image"]');
      for (const btn of swatchButtons) {
        const classList = btn.className || '';
        const isSelected = classList.includes('selected') || 
                          btn.getAttribute('aria-selected') === 'true' ||
                          btn.getAttribute('aria-label')?.includes('selected');
        if (isSelected) {
          data.finish_color = btn.getAttribute('title') || '';
          const style = btn.getAttribute('style') || '';
          const bgMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
          if (bgMatch) {
            let imgUrl = bgMatch[1];
            if (imgUrl.startsWith('/')) imgUrl = window.location.origin + imgUrl;
            data.finish_image = imgUrl;
          }
          break;
        }
      }
      if (!data.finish_color && swatchButtons.length > 0) {
        const firstBtn = swatchButtons[0];
        data.finish_color = firstBtn.getAttribute('title') || '';
        const style = firstBtn.getAttribute('style') || '';
        const bgMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
        if (bgMatch) {
          let imgUrl = bgMatch[1];
          if (imgUrl.startsWith('/')) imgUrl = window.location.origin + imgUrl;
          data.finish_image = imgUrl;
        }
      }
    }
  }
  
  // FOUR HANDS: Swatches are in label elements with title attribute
  // Structure: <label title="Color Name"><img src="swatch.jpg" alt="Color Name"></label>
  // Also handles "Cover" and "Cushion" selector dropdowns
  if (!data.finish_image && domain.includes('fourhands')) {
    // FIRST: Try the subtitle which shows "Light Camel • 100074-008" format
    // This is the most reliable source for the selected color
    const subtitles = document.querySelectorAll('.text-neutral-50, [class*="text-neutral"]');
    for (const subtitle of subtitles) {
      if (subtitle.textContent.includes('•')) {
        data.finish_color = subtitle.textContent.split('•')[0].trim();
        break;
      }
    }
    
    // SECOND: If no subtitle, look for dropdown display showing selected option
    // The selected value is often in a truncate element inside a button or selector
    if (!data.finish_color) {
      // Look for specific option selector patterns
      const optionButtons = document.querySelectorAll('button .truncate, [class*="option"] .truncate, [class*="select"] .truncate');
      for (const display of optionButtons) {
        const text = display.textContent.trim();
        if (text && text !== 'None' && !text.includes('Select') && !text.includes('Choose')) {
          data.finish_color = text;
          break;
        }
      }
    }
    
    // THIRD: Try any truncate that looks like a color name (not a label)
    if (!data.finish_color) {
      const dropdownDisplays = document.querySelectorAll('.truncate');
      for (const display of dropdownDisplays) {
        const text = display.textContent.trim();
        // Skip if it looks like a label (ends with :, is all caps, etc)
        if (text && text !== 'None' && !text.includes('Select') && !text.includes('Choose') && 
            !text.endsWith(':') && text !== 'Cover' && text !== 'Cushion' && text !== 'Finish') {
          data.finish_color = text;
          break;
        }
      }
    }
    
    // Find swatch images in labels - PRIORITIZE SELECTED STATES
    const swatchLabels = document.querySelectorAll('label[title]');
    
    // First pass: look for explicitly selected swatch
    for (const label of swatchLabels) {
      const title = label.getAttribute('title');
      const img = label.querySelector('img');
      
      if (!title || title === 'None' || !img || !img.src || img.src.includes('PLACEHOLDER')) {
        continue;
      }
      
      // Check if this label or its parent is marked as selected/active/checked
      const isSelected = label.classList.contains('selected') || 
                         label.classList.contains('active') ||
                         label.querySelector('input:checked') ||
                         label.closest('[class*="selected"]') ||
                         label.closest('[class*="active"]');
      
      if (isSelected) {
        data.finish_image = img.src;
        data.finish_color = title; // Use the title as the definitive color name
        console.log('Found SELECTED swatch:', title, img.src);
        break;
      }
    }
    
    // Second pass: if no selected found, try to match by color name
    if (!data.finish_image) {
      for (const label of swatchLabels) {
        const title = label.getAttribute('title');
        const img = label.querySelector('img');
        
        if (!title || title === 'None' || !img || !img.src || img.src.includes('PLACEHOLDER')) {
          continue;
        }
        
        // Check if this matches the finish_color we found
        if (data.finish_color && title.toLowerCase() === data.finish_color.toLowerCase()) {
          data.finish_image = img.src;
          console.log('Found matching swatch for', data.finish_color, ':', img.src);
          break;
        }
      }
    }
    
    // Third pass: just take first valid swatch as fallback
    if (!data.finish_image) {
      for (const label of swatchLabels) {
        const title = label.getAttribute('title');
        const img = label.querySelector('img');
        
        if (title && title !== 'None' && img?.src && img.src.startsWith('http') && !img.src.includes('PLACEHOLDER')) {
          data.finish_image = img.src;
          if (!data.finish_color) {
            data.finish_color = title;
          }
          break;
        }
      }
    }
    
    // Also look for round swatch images that might be outside labels
    if (!data.finish_image) {
      const roundSwatches = document.querySelectorAll('img.rounded-full, img[class*="rounded-full"]');
      for (const img of roundSwatches) {
        if (img.src && img.src.startsWith('http') && !img.src.includes('PLACEHOLDER')) {
          const parent = img.closest('label, button, [title]');
          const swatchName = parent?.getAttribute('title') || img.alt || '';
          
          if (data.finish_color && swatchName.toLowerCase() === data.finish_color.toLowerCase()) {
            data.finish_image = img.src;
            break;
          }
          
          if (!data.finish_image) {
            data.finish_image = img.src;
            if (!data.finish_color) data.finish_color = swatchName;
          }
        }
      }
    }
  }
  
  // HVL GROUP / VISUAL COMFORT: Finish option images
  if (!data.finish_image && (domain.includes('hvlgroup') || domain.includes('visualcomfort'))) {
    const finishOptions = document.querySelectorAll('a[class*="finish"], button[class*="finish"], [data-finish]');
    for (const opt of finishOptions) {
      const img = opt.querySelector('img');
      if (img && img.src) {
        const w = img.naturalWidth || img.width || 50;
        if (w < 200 && w > 20) {
          data.finish_image = img.src;
          data.finish_color = img.alt || opt.getAttribute('title') || opt.getAttribute('aria-label') || '';
          if (opt.className?.includes('selected') || opt.getAttribute('aria-selected') === 'true') break;
        }
      }
    }
  }
  
  // ROWE FURNITURE: Fabric swatches
  if (!data.finish_image && domain.includes('rowe')) {
    const fabricImgs = document.querySelectorAll('img[src*="fabric"], img[alt*="fabric" i], [class*="fabric"] img');
    for (const img of fabricImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 150 && w > 20) {
        data.finish_image = img.src;
        data.finish_color = img.alt || '';
        break;
      }
    }
  }
  
  // BERNHARDT: Fabric/Finish selectors
  if (!data.finish_image && domain.includes('bernhardt')) {
    const swatchImgs = document.querySelectorAll('[class*="swatch"] img, [class*="fabric"] img, [class*="finish"] img');
    for (const img of swatchImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 20) {
        data.finish_image = img.src;
        data.finish_color = img.alt || '';
        break;
      }
    }
  }
  
  // LOLOI RUGS: Color swatches
  if (!data.finish_image && domain.includes('loloi')) {
    const colorImgs = document.querySelectorAll('[class*="color"] img, [data-color] img, [class*="swatch"] img');
    for (const img of colorImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 20) {
        data.finish_image = img.src;
        data.finish_color = img.alt || img.getAttribute('data-color') || '';
        break;
      }
    }
  }
  
  // GENERIC FALLBACK for remaining vendors (Global Views, Regina Andrew, Arteriors, etc.)
  if (!data.finish_image) {
    const genericSwatches = document.querySelectorAll(
      '[class*="swatch" i] img, [class*="color" i] img, [class*="finish" i] img, ' +
      '[class*="fabric" i] img, [class*="material" i] img, ' +
      'img[src*="swatch" i], img[src*="color" i], img[alt*="swatch" i]'
    );
    for (const img of genericSwatches) {
      const w = img.naturalWidth || img.width || 50;
      const h = img.naturalHeight || img.height || 50;
      if (w < 200 && h < 200 && w > 15 && h > 15) {
        const parent = img.closest('[class*="selected" i], [class*="active" i], [aria-selected="true"]');
        if (parent || !data.finish_image) {
          data.finish_image = img.src;
          data.finish_color = img.alt || img.getAttribute('title') || '';
          if (parent) break;
        }
      }
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
