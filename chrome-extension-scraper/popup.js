// Design Ready Product Scraper v7.14.0
// VENDOR-SPECIFIC SCRAPING for 22 vendors
// NEW: Houzz Pro Clipper integration + Quick Paste URL
// Debug logging enabled in console

const APP_URL = 'https://designflow-app-9.preview.emergentagent.com';
const BACKEND_URL = 'https://designflow-app-9.preview.emergentagent.com';
let scrapedData = null;
let selectedProjectId = null;
let clickToSelectActive = false;

const scrapeBtn = document.getElementById('scrapeBtn');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const rescrapeBtn = document.getElementById('rescrapeBtn');
const clickSelectBtn = document.getElementById('clickSelectBtn');
const statusBar = document.getElementById('statusBar');
const emptyState = document.getElementById('emptyState');
const resultsContainer = document.getElementById('resultsContainer');
const vendorBadge = document.getElementById('vendorBadge');
const loginWarning = document.getElementById('loginWarning');
const projectSelector = document.getElementById('projectSelector');

// Load projects from API
async function loadProjects() {
  try {
    const apiUrl = `${BACKEND_URL}/api/projects`;
    console.log('[v7.12.0] Loading projects from:', apiUrl);
    
    // Add a cache-busting parameter
    const cacheBuster = `?_t=${Date.now()}`;
    const fullUrl = apiUrl + cacheBuster;
    console.log('[v7.12.0] Full URL with cache buster:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('[v7.12.0] Response status:', response.status);
    console.log('[v7.12.0] Response URL:', response.url);
    console.log('[v7.12.0] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[v7.12.0] Error response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    }
    
    const data = await response.json();
    // Handle both array and object responses
    const projects = Array.isArray(data) ? data : (data.projects || []);
    console.log('[v7.12.0] Projects loaded:', projects.length);
    
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
    
    showStatus(`✓ Loaded ${projects.length} projects`, 'success');
  } catch (e) {
    console.error('[v7.12.0] Failed to load projects:', e);
    console.error('[v7.12.0] Error type:', e.name);
    console.error('[v7.12.0] Error message:', e.message);
    console.error('[v7.12.0] Error stack:', e.stack);
    projectSelector.innerHTML = '<option value="">-- Could not load --</option>';
    
    // Show error in status bar with more details
    showStatus(`⚠ Projects failed: ${e.message}`, 'warning');
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
  
  // VENDOR DETECTION - All 26+ vendors
  const vendorMap = {
    'uttermost': 'Uttermost',
    'visualcomfort': 'Visual Comfort',
    'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt',
    'hvlgroup': 'HVL Group',
    'gabby': 'Gabby',
    'loloirugs': 'Loloi',
    'loloi': 'Loloi',
    'rowefurniture': 'Rowe Furniture',
    'rowe': 'Rowe Furniture',
    'globalviews': 'Global Views',
    'reginaandrew': 'Regina Andrew',
    'surya': 'Surya',
    'safavieh': 'Safavieh',
    'eichholtz': 'Eichholtz',
    'crestviewcollection': 'Crestview Collection',
    'bassettmirror': 'Bassett Mirror',
    'flowdecor': 'Flow Decor',
    'hubbardtonforge': 'Hubbardton Forge',
    'hinkley': 'Hinkley',
    'elegantlighting': 'Elegant Lighting',
    'zeelighting': 'ZEE Lighting',
    'vanguardfurniture': 'Vanguard',
    'arteriorshome': 'Arteriors',
    'arteriors': 'Arteriors',
    'curreyandcompany': 'Currey & Company',
    'currey': 'Currey & Company'
  };
  
  for (const [key, name] of Object.entries(vendorMap)) {
    if (domain.includes(key)) {
      data.vendor = name;
      break;
    }
  }
  if (!data.vendor) {
    data.vendor = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  }

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
      const urlMatch = window.location.pathname.match(/\/product\/([^\/]+)/i);
      if (urlMatch) data.sku = urlMatch[1];
    }
  } else if (domain.includes('bernhardt')) {
    // Bernhardt: SKU in URL /shop/B1212
    const urlMatch = window.location.pathname.match(/\/shop\/([A-Z0-9]+)/i);
    if (urlMatch) data.sku = urlMatch[1];
  } else if (domain.includes('hvlgroup')) {
    // HVL: SKU in URL /Product/507-30-VB
    const urlMatch = window.location.pathname.match(/\/Product\/([^\/]+)/i);
    if (urlMatch) data.sku = urlMatch[1];
  } else if (domain.includes('visualcomfort')) {
    // Visual Comfort: SKU in URL or title (e.g., KW2735)
    const titleMatch = document.title?.match(/([A-Z]{2,}\d+[A-Z0-9]*)/);
    if (titleMatch) data.sku = titleMatch[1];
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/([a-z]{2,}\d+[a-z0-9]*)/i);
      if (urlMatch) data.sku = urlMatch[1].toUpperCase();
    }
  } else {
    // Generic SKU detection - multiple patterns
    const skuPatterns = [
      /SKU[:\s#]*([A-Z0-9-]+)/i,
      /Item[:\s#]*([A-Z0-9-]+)/i,
      /Style[:\s#]*([A-Z0-9-]+)/i,
      /Model[:\s#]*([A-Z0-9-]+)/i,
      /Product Code[:\s#]*([A-Z0-9-]+)/i
    ];
    const pageText = document.body.innerText;
    for (const pattern of skuPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        data.sku = match[1];
        break;
      }
    }
    // Also try from URL
    if (!data.sku) {
      const urlPatterns = [
        /\/product\/([^\/]+)/i,
        /\/p\/([^\/]+)/i,
        /\/item\/([^\/]+)/i,
        /[?&]sku=([^&]+)/i
      ];
      for (const pattern of urlPatterns) {
        const match = window.location.href.match(pattern);
        if (match) {
          data.sku = match[1];
          break;
        }
      }
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
  }
  
  // Generic dimension detection - try multiple patterns if not found yet
  if (!data.size) {
    // Pattern 1: "30 W X 27 H X 32 D" (Uttermost)
    let sizeMatch = bodyText.match(/(\d+(?:\.\d+)?)\s*W\s*X\s*(\d+(?:\.\d+)?)\s*H\s*X\s*(\d+(?:\.\d+)?)\s*D/i);
    if (sizeMatch) {
      data.size = `${sizeMatch[1]}"W x ${sizeMatch[3]}"D x ${sizeMatch[2]}"H`;
    }
  }
  
  if (!data.size) {
    // Pattern 2: "Width: 33 Depth: 38 Height: 33" (Bernhardt, many others)
    const wMatch = bodyText.match(/Width[:\s]*([\d.]+)/i);
    const dMatch = bodyText.match(/Depth[:\s]*([\d.]+)/i);
    const hMatch = bodyText.match(/Height[:\s]*([\d.]+)/i);
    if (wMatch || hMatch) {
      data.size = `${wMatch?.[1] || '?'}"W x ${dMatch?.[1] || '?'}"D x ${hMatch?.[1] || '?'}"H`;
    }
  }
  
  if (!data.size) {
    // Pattern 3: "H: 18.5 W: 12 D: 12" or "H 18.5 x W 12 x D 12" (HVL, some lighting)
    const hMatch2 = bodyText.match(/H[:\s]*([\d.]+)/i);
    const wMatch2 = bodyText.match(/W[:\s]*([\d.]+)/i);
    const dMatch2 = bodyText.match(/D[:\s]*([\d.]+)/i);
    if (hMatch2 || wMatch2) {
      data.size = `${wMatch2?.[1] || '?'}"W x ${dMatch2?.[1] || '?'}"D x ${hMatch2?.[1] || '?'}"H`;
    }
  }
  
  if (!data.size) {
    // Pattern 4: "18"H x 12"W x 12"D" or "18" H x 12" W x 12" D"
    let sizeMatch = bodyText.match(/([\d.]+)"?\s*H\s*[x×X]\s*([\d.]+)"?\s*W\s*[x×X]\s*([\d.]+)"?\s*D/i);
    if (sizeMatch) {
      data.size = `${sizeMatch[2]}"W x ${sizeMatch[3]}"D x ${sizeMatch[1]}"H`;
    }
  }
  
  if (!data.size) {
    // Pattern 5: "12"W x 12"D x 18"H" (standard WxDxH)
    let sizeMatch = bodyText.match(/([\d.]+)"?\s*W\s*[x×X]\s*([\d.]+)"?\s*D\s*[x×X]\s*([\d.]+)"?\s*H/i);
    if (sizeMatch) {
      data.size = `${sizeMatch[1]}"W x ${sizeMatch[2]}"D x ${sizeMatch[3]}"H`;
    }
  }
  
  if (!data.size) {
    // Pattern 6: "Overall: 12w 18h 12d" (some furniture sites)
    let sizeMatch = bodyText.match(/Overall[:\s]*([\d.]+)\s*[wW]\s*([\d.]+)\s*[hH]\s*([\d.]+)\s*[dD]/i);
    if (sizeMatch) {
      data.size = `${sizeMatch[1]}"W x ${sizeMatch[3]}"D x ${sizeMatch[2]}"H`;
    }
  }
  
  if (!data.size) {
    // Pattern 7: Rug format "2'3" x 7'9"" (Loloi, Safavieh)
    let rugMatch = bodyText.match(/(\d+'[\d."]+)\s*[x×X]\s*(\d+'[\d."]+)/);
    if (rugMatch) {
      data.size = `${rugMatch[1]} x ${rugMatch[2]}`;
    }
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
    // First try to get finish from dropdown/select text
    if (!data.finish_color) {
      const finishLabels = ['finish', 'color', 'option'];
      for (const label of finishLabels) {
        const regex = new RegExp(`${label}[:\\s]*([^\\n$]+)`, 'i');
        const match = bodyText.match(regex);
        if (match && match[1]) {
          const value = match[1].trim().split('\n')[0].trim();
          if (value && value.length > 1 && value.length < 50 && !value.match(/^(select|choose)/i)) {
            data.finish_color = value;
            break;
          }
        }
      }
    }
    
    const finishOptions = document.querySelectorAll('a[class*="finish"], button[class*="finish"], [data-finish]');
    for (const opt of finishOptions) {
      const img = opt.querySelector('img');
      if (img && img.src) {
        const w = img.naturalWidth || img.width || 50;
        if (w < 200 && w > 20) {
          data.finish_image = img.src;
          if (!data.finish_color) {
            data.finish_color = img.alt || opt.getAttribute('title') || opt.getAttribute('aria-label') || '';
          }
          if (opt.className?.includes('selected') || opt.getAttribute('aria-selected') === 'true') break;
        }
      }
    }
  }
  
  // ROWE FURNITURE: Fabric swatches and dropdown
  if (!data.finish_image && domain.includes('rowe')) {
    // First try to get finish from "Choose Body Cover: XXX" pattern
    if (!data.finish_color) {
      const coverMatch = bodyText.match(/(?:choose\s+)?(?:body\s+)?cover[:\s]*([^\n]+)/i);
      if (coverMatch) {
        data.finish_color = coverMatch[1].trim().split('\n')[0].trim();
      }
    }
    
    const fabricImgs = document.querySelectorAll('img[src*="fabric"], img[alt*="fabric" i], [class*="fabric"] img');
    for (const img of fabricImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 150 && w > 20) {
        data.finish_image = img.src;
        if (!data.finish_color) data.finish_color = img.alt || '';
        break;
      }
    }
  }
  
  // BERNHARDT: Fabric/Finish selectors
  if (!data.finish_image && domain.includes('bernhardt')) {
    // Get fabric name from "Fabric Shown: XXX" pattern
    if (!data.finish_color) {
      const fabricMatch = bodyText.match(/(?:fabric\s+shown|body\s+fabric)[:\s]*([^\n]+)/i);
      if (fabricMatch) {
        data.finish_color = fabricMatch[1].trim().split('\n')[0].trim();
      }
    }
    
    const swatchImgs = document.querySelectorAll('[class*="swatch"] img, [class*="fabric"] img, [class*="finish"] img');
    for (const img of swatchImgs) {
      const w = img.naturalWidth || img.width || 50;
      if (w < 200 && w > 20) {
        data.finish_image = img.src;
        if (!data.finish_color) data.finish_color = img.alt || '';
        break;
      }
    }
  }
  
  // HVL GROUP - additional finish detection from URL suffix
  if (!data.finish_color && domain.includes('hvlgroup') && data.sku) {
    const suffixMatch = data.sku.match(/-([A-Z]+)$/);
    if (suffixMatch) {
      const finishCodes = {
        'VB': 'Vintage Brass', 'PN': 'Polished Nickel', 'AB': 'Aged Brass', 
        'OB': 'Old Bronze', 'GL': 'Gold Leaf', 'SL': 'Silver Leaf',
        'BK': 'Black', 'WH': 'White', 'PBR': 'Patina Brass', 'AGB': 'Aged Brass'
      };
      data.finish_color = finishCodes[suffixMatch[1]] || suffixMatch[1];
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
  showStatus('Opening scraper panel on page...', 'info');
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url || tab.url.startsWith('chrome://')) throw new Error('Navigate to product page');
    
    // Send message to content script to open the scraper panel
    chrome.tabs.sendMessage(tab.id, { action: 'openScraper' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded, inject it first
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'openScraper' });
          }, 100);
        });
      }
    });
    
    showStatus('Scraper panel opened on page!', 'success');
    
    // Close popup after a brief moment
    setTimeout(() => window.close(), 500);
    
  } catch(e) { 
    showStatus(e.message, 'error'); 
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span>⚡</span><span>SCRAPE THIS PAGE</span>';
  }
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

// ============================================================================
// CLICK TO SELECT FUNCTIONALITY
// ============================================================================

async function toggleClickToSelect() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tab?.id) return;
  
  if (clickToSelectActive) {
    // Deactivate
    chrome.tabs.sendMessage(tab.id, { action: 'deactivateClickToSelect' });
    clickToSelectActive = false;
    clickSelectBtn.classList.remove('active');
    clickSelectBtn.innerHTML = '<span>🎯</span><span>CLICK TO SELECT</span>';
    showStatus('Click to Select deactivated', 'info');
  } else {
    // Make sure we have scraped data first
    if (!scrapedData) {
      showStatus('Scrape the page first!', 'warning');
      return;
    }
    
    // Activate
    chrome.tabs.sendMessage(tab.id, { action: 'activateClickToSelect' });
    clickToSelectActive = true;
    clickSelectBtn.classList.add('active');
    clickSelectBtn.innerHTML = '<span>🛑</span><span>STOP SELECTING</span>';
    showStatus('Click any element on the page to select it', 'info');
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fieldSelected') {
    // Update scraped data with the manually selected value
    if (scrapedData && request.field && request.value) {
      scrapedData[request.field] = request.value;
      
      // Update the display
      updateFieldDisplay(request.field, request.value);
      
      showStatus(`Updated ${formatFieldName(request.field)}`, 'success');
    }
    sendResponse({ success: true });
  }
  
  if (request.action === 'clickToSelectDeactivated') {
    // User pressed Escape on the page
    clickToSelectActive = false;
    clickSelectBtn.classList.remove('active');
    clickSelectBtn.innerHTML = '<span>🎯</span><span>CLICK TO SELECT</span>';
    showStatus('Click to Select cancelled', 'info');
    sendResponse({ success: true });
  }
  
  return true;
});

function formatFieldName(field) {
  const names = {
    name: 'Product Title',
    price: 'Price',
    sku: 'SKU',
    size: 'Dimensions',
    finish_color: 'Finish/Color',
    finish_image: 'Finish Image',
    image_url: 'Main Image',
    msrp: 'MSRP'
  };
  return names[field] || field;
}

function updateFieldDisplay(field, value) {
  switch(field) {
    case 'name':
      document.getElementById('productName').textContent = value;
      break;
    case 'price':
      const priceVal = parseFloat(value);
      if (!isNaN(priceVal)) {
        scrapedData.price = priceVal;
        document.getElementById('productPrice').textContent = `$${priceVal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        document.getElementById('productPrice').className = 'product-price';
        loginWarning.style.display = 'none';
      }
      break;
    case 'sku':
      document.getElementById('productSku').textContent = `SKU: ${value}`;
      break;
    case 'size':
      document.getElementById('dataSize').textContent = value;
      document.getElementById('dataSize').className = 'data-value';
      break;
    case 'finish_color':
      document.getElementById('dataFinish').textContent = value;
      document.getElementById('dataFinish').className = 'data-value';
      document.getElementById('finishName').textContent = value;
      break;
    case 'finish_image':
      document.getElementById('finishImage').src = value;
      document.getElementById('finishImageContainer').style.display = 'flex';
      break;
    case 'image_url':
      document.getElementById('productImage').src = value;
      document.getElementById('productImage').style.display = 'block';
      break;
    case 'msrp':
      const msrpVal = parseFloat(value);
      if (!isNaN(msrpVal)) {
        scrapedData.msrp = msrpVal;
        document.getElementById('dataMsrp').textContent = `$${msrpVal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
      }
      break;
  }
}

// Event listeners
scrapeBtn.addEventListener('click', doScrape);
sendBtn.addEventListener('click', sendToApp);
copyBtn.addEventListener('click', copyToClipboard);
rescrapeBtn.addEventListener('click', doScrape);
clickSelectBtn?.addEventListener('click', toggleClickToSelect);

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
