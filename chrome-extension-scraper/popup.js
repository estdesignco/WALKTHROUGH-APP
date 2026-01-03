// Design Ready Product Scraper v7.2.0
// FIXED: Added dropdown/select detection for finish/color
// FIXED: Better swatch image name detection
// Works across ALL vendor sites

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
  const pageText = document.body.innerText;

  // ============================================================================
  // STEP 1: VENDOR DETECTION (always runs)
  // ============================================================================
  const vendorMap = {
    'uttermost': 'Uttermost',
    'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt',
    'visualcomfort': 'Visual Comfort',
    'hvlgroup': 'HVL Group',
    'gabby': 'Gabby',
    'loloi': 'Loloi',
    'rowe': 'Rowe Furniture',
    'globalviews': 'Global Views',
    'reginaandrew': 'Regina Andrew',
    'surya': 'Surya',
    'safavieh': 'Safavieh',
    'salavieh': 'Safavieh',
    'eichholtz': 'Eichholtz',
    'crestview': 'Crestview Collection',
    'bassettmirror': 'Bassett Mirror',
    'flowdecor': 'Flow Decor',
    'hubbardtonforge': 'Hubbardton Forge',
    'hinkley': 'Hinkley',
    'elegantlighting': 'Elegant Lighting',
    'zeelighting': 'ZEE Lighting',
    'vanguard': 'Vanguard',
    'arteriors': 'Arteriors',
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

  // ============================================================================
  // STEP 2: GENERIC EXTRACTION (works for ALL sites)
  // ============================================================================
  
  // --- NAME: From H1 ---
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim().split('\n')[0];

  // --- SKU: Multiple patterns ---
  // Pattern 1: "SKU: XXX" or "Item #XXX" or "Style: XXX"
  const skuPatterns = [
    /SKU[:\s#]*([A-Z0-9-]+)/i,
    /Item[:\s#]*([A-Z0-9-]+)/i,
    /Style[:\s#]*([A-Z0-9-]+)/i,
    /Model[:\s#]*([A-Z0-9-]+)/i,
    /Product Code[:\s#]*([A-Z0-9-]+)/i
  ];
  for (const pattern of skuPatterns) {
    const match = pageText.match(pattern);
    if (match) { data.sku = match[1]; break; }
  }
  // Pattern 2: From URL
  if (!data.sku) {
    const urlPatterns = [
      /\/product\/([A-Z0-9-]+)/i,
      /\/shop\/([A-Z0-9-]+)/i,
      /\/p\/([A-Z0-9-]+)/i,
      /[?&]sku=([A-Z0-9-]+)/i
    ];
    for (const pattern of urlPatterns) {
      const match = window.location.href.match(pattern);
      if (match) { data.sku = match[1]; break; }
    }
  }
  // Pattern 3: From elements
  if (!data.sku) {
    const skuEl = document.querySelector('[class*="sku" i], [class*="product-id" i], [class*="item-number" i]');
    if (skuEl) {
      const text = skuEl.innerText.trim();
      const match = text.match(/([A-Z0-9-]{3,})/i);
      if (match) data.sku = match[1];
    }
  }

  // --- PRICE: Find dollar amounts ---
  // Look for price near common labels
  const priceLabels = ['Trade Price', 'Net Price', 'Your Price', 'Price', 'Sale'];
  for (const label of priceLabels) {
    const regex = new RegExp(label + '[:\\s]*\\$([\\d,]+\\.?\\d*)', 'i');
    const match = pageText.match(regex);
    if (match) {
      data.price = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }
  // Fallback: First reasonable price on page
  if (!data.price) {
    const priceEl = document.querySelector('[class*="price" i]:not([class*="msrp" i]):not([class*="retail" i])');
    if (priceEl) {
      const match = priceEl.innerText.match(/\$([\d,]+\.?\d*)/);
      if (match) data.price = parseFloat(match[1].replace(/,/g, ''));
    }
  }
  if (!data.price) {
    const allPrices = pageText.match(/\$([\d,]+\.?\d*)/g) || [];
    for (const p of allPrices) {
      const val = parseFloat(p.replace(/[$,]/g, ''));
      if (val > 10 && val < 100000) {
        data.price = val;
        break;
      }
    }
  }

  // --- MSRP ---
  const msrpPatterns = [
    /MSRP[:\s]*\$([\d,]+\.?\d*)/i,
    /Retail[:\s]*\$([\d,]+\.?\d*)/i,
    /Suggested[:\s]*(?:retail[:\s]*)?\$([\d,]+\.?\d*)/i,
    /List Price[:\s]*\$([\d,]+\.?\d*)/i
  ];
  for (const pattern of msrpPatterns) {
    const match = pageText.match(pattern);
    if (match) { data.msrp = parseFloat(match[1].replace(/,/g, '')); break; }
  }

  // --- DIMENSIONS: Multiple formats ---
  // Format 1: "W x D x H" or "W x H x D"
  let dimMatch = pageText.match(/(\d+(?:\.\d+)?)"?\s*[Ww]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[DdHh]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[HhDd]/);
  if (dimMatch) {
    data.size = `${dimMatch[1]}"W x ${dimMatch[2]}"D x ${dimMatch[3]}"H`;
  }
  // Format 2: "H x W x D"
  if (!data.size) {
    dimMatch = pageText.match(/(\d+(?:\.\d+)?)"?\s*[Hh]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[Ww]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[Dd]/);
    if (dimMatch) data.size = `${dimMatch[2]}"W x ${dimMatch[3]}"D x ${dimMatch[1]}"H`;
  }
  // Format 3: Separate Width/Height/Depth labels
  if (!data.size) {
    const wMatch = pageText.match(/Width[:\s]*([\d.]+)/i);
    const hMatch = pageText.match(/Height[:\s]*([\d.]+)/i);
    const dMatch = pageText.match(/Depth[:\s]*([\d.]+)/i);
    if (wMatch || hMatch) {
      data.size = `${wMatch?.[1] || '?'}"W x ${dMatch?.[1] || '?'}"D x ${hMatch?.[1] || '?'}"H`;
    }
  }
  // Format 4: "30 W X 27 H X 32 D" (Uttermost format)
  if (!data.size) {
    dimMatch = pageText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
    if (dimMatch) data.size = `${dimMatch[1]}"W x ${dimMatch[3]}"D x ${dimMatch[2]}"H`;
  }

  // --- MAIN IMAGE ---
  // Method 1: og:image meta tag
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content) data.image_url = ogImg.content;
  // Method 2: Main product image containers
  if (!data.image_url) {
    const imgSelectors = [
      '.product-image img',
      '.main-image img',
      '[class*="gallery"] img',
      '[class*="carousel"] img.active',
      '.swiper-slide-active img',
      '[class*="product"] img[src*="large"]',
      '[class*="product"] img[src*="main"]'
    ];
    for (const sel of imgSelectors) {
      const img = document.querySelector(sel);
      if (img?.src && img.src.startsWith('http')) {
        data.image_url = img.src;
        break;
      }
    }
  }

  // --- FINISH/COLOR/SWATCH ---
  
  // Method 0: Check dropdowns and select elements FIRST (Rowe, Visual Comfort style)
  // Look for selects/dropdowns near "Finish", "Color", "Cover", "Fabric" labels
  const dropdownLabels = ['finish', 'color', 'cover', 'fabric', 'material', 'body cover'];
  for (const label of dropdownLabels) {
    // Pattern: "Finish: Natural Brass" or "Choose Body Cover: 100CR-28"
    const labelRegex = new RegExp(`(?:choose\\s+)?${label}[:\\s]*([^\\n$]+)`, 'i');
    const textMatch = pageText.match(labelRegex);
    if (textMatch && textMatch[1]) {
      const value = textMatch[1].trim().split('\n')[0].trim();
      if (value && value.length > 1 && value.length < 100 && !value.match(/^(select|choose|pick)/i)) {
        data.finish_color = value;
        break;
      }
    }
  }
  
  // Also try select/dropdown elements
  if (!data.finish_color) {
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      const label = select.closest('label, .form-group, [class*="option"]');
      const labelText = label?.innerText?.toLowerCase() || select.name?.toLowerCase() || '';
      if (dropdownLabels.some(l => labelText.includes(l))) {
        const selected = select.options[select.selectedIndex];
        if (selected && selected.text && selected.text !== 'Select' && selected.text !== 'Choose') {
          data.finish_color = selected.text.trim();
          break;
        }
      }
    }
  }
  
  // Method 1: Selected swatch button with background-image (Uttermost style)
  const colorSection = Array.from(document.querySelectorAll('span, label, div')).find(
    el => /^(color|finish|fabric|material)$/i.test(el.innerText?.trim())
  );
  if (colorSection) {
    const container = colorSection.closest('div, section') || colorSection.parentElement;
    if (container) {
      // Look for buttons with background-image
      const swatchBtns = container.querySelectorAll('button[style*="background-image"], [class*="swatch"][style*="background-image"]');
      for (const btn of swatchBtns) {
        const isSelected = btn.className?.includes('selected') || btn.getAttribute('aria-selected') === 'true';
        if (isSelected || swatchBtns.length === 1) {
          // Only override if we don't have a finish_color yet
          if (!data.finish_color) {
            data.finish_color = btn.getAttribute('title') || btn.getAttribute('aria-label') || '';
          }
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

  // Method 2: Swatch images in various containers
  if (!data.finish_image) {
    const swatchSelectors = [
      '[class*="swatch" i] img',
      '[class*="color" i] img',
      '[class*="finish" i] img',
      '[class*="fabric" i] img',
      'label[title] img',
      '[data-color] img',
      '[data-finish] img'
    ];
    for (const sel of swatchSelectors) {
      const imgs = document.querySelectorAll(sel);
      for (const img of imgs) {
        if (!img.src || !img.src.startsWith('http')) continue;
        // Check if it's a small swatch image
        const w = img.naturalWidth || img.width || 100;
        const h = img.naturalHeight || img.height || 100;
        if (w < 300 && h < 300 && w > 10 && h > 10) {
          const parent = img.closest('[class*="selected"], [class*="active"], [aria-selected="true"], label, [class*="current"]');
          if (parent || !data.finish_image) {
            data.finish_image = img.src;
            // Get color name from various sources
            if (!data.finish_color) {
              data.finish_color = img.alt || 
                                  img.getAttribute('title') || 
                                  parent?.getAttribute('title') ||
                                  parent?.getAttribute('data-color') ||
                                  parent?.getAttribute('data-fabric') ||
                                  parent?.querySelector('.name, .title, .label')?.innerText?.trim() ||
                                  '';
            }
            if (parent) break;
          }
        }
      }
      if (data.finish_image) break;
    }
  }

  // Method 3: Look for any image that looks like a fabric/color swatch nearby the product
  if (!data.finish_image) {
    // Check for fabric grid items with images
    const fabricItems = document.querySelectorAll('[class*="fabric"] img, [class*="swatch-grid"] img, [class*="color-option"] img');
    for (const img of fabricItems) {
      if (!img.src || !img.src.startsWith('http')) continue;
      const isSelected = img.closest('[class*="selected"], [class*="active"], [class*="current"]');
      if (isSelected) {
        data.finish_image = img.src;
        if (!data.finish_color) {
          // Try to get the name from nearby text
          const container = img.closest('div, figure, li');
          const nameEl = container?.querySelector('.name, .title, span, p');
          if (nameEl) data.finish_color = nameEl.innerText.trim();
        }
        break;
      }
    }
  }

  // Method 4: Get color name from product title (e.g., "Chair, Ginger" or "Chair - Brass")
  if (!data.finish_color && data.name) {
    if (data.name.includes(',')) {
      data.finish_color = data.name.split(',').pop().trim();
    } else if (data.name.includes(' - ')) {
      data.finish_color = data.name.split(' - ').pop().trim();
    }
  }

  // ============================================================================
  // STEP 3: VENDOR-SPECIFIC ENHANCEMENTS (only fills in missing data)
  // ============================================================================

  // --- FOUR HANDS specific ---
  if (domain.includes('fourhands')) {
    // SKU from subtitle "Color • SKU" format
    if (!data.sku) {
      const subtitle = document.querySelector('.text-neutral-50, [class*="subtitle"]');
      if (subtitle?.textContent.includes('•')) {
        const parts = subtitle.textContent.split('•');
        if (!data.finish_color) data.finish_color = parts[0].trim();
        if (parts[1]) data.sku = parts[1].trim();
      }
    }
    // Cover/Cushion selector
    if (!data.finish_color) {
      const truncates = document.querySelectorAll('.truncate');
      for (const el of truncates) {
        const text = el.textContent.trim();
        if (text && text !== 'None' && !text.includes('Select')) {
          data.finish_color = text;
          break;
        }
      }
    }
    // Swatch labels
    if (!data.finish_image) {
      const labels = document.querySelectorAll('label[title]');
      for (const label of labels) {
        const title = label.getAttribute('title');
        const img = label.querySelector('img');
        if (title && title !== 'None' && img?.src && !img.src.includes('PLACEHOLDER')) {
          if (data.finish_color && title.toLowerCase() === data.finish_color.toLowerCase()) {
            data.finish_image = img.src;
            break;
          }
          if (!data.finish_image) {
            data.finish_image = img.src;
            if (!data.finish_color) data.finish_color = title;
          }
        }
      }
    }
  }

  // --- HVL GROUP specific ---
  if (domain.includes('hvlgroup')) {
    // Name from item-title
    if (!data.name || data.name === 'Unknown') {
      const itemTitle = document.querySelector('h1.item-title, .product-title');
      if (itemTitle) data.name = itemTitle.innerText.trim();
    }
    // Finish from URL suffix
    if (!data.finish_color && data.sku) {
      const suffixMatch = data.sku.match(/-([A-Z]+)$/);
      if (suffixMatch) {
        const codes = {VB:'Vintage Brass', PN:'Polished Nickel', AB:'Aged Brass', OB:'Old Bronze', GL:'Gold Leaf', SL:'Silver Leaf', BK:'Black', WH:'White'};
        data.finish_color = codes[suffixMatch[1]] || suffixMatch[1];
      }
    }
  }

  // --- BERNHARDT specific ---
  if (domain.includes('bernhardt')) {
    // Fabric from "Fabric Shown" 
    if (!data.finish_color) {
      const fabricMatch = pageText.match(/(?:Fabric Shown|Body Fabric)[:\s]*([^\n]+)/i);
      if (fabricMatch) data.finish_color = fabricMatch[1].trim().split('\n')[0];
    }
  }

  // --- VISUAL COMFORT specific ---
  if (domain.includes('visualcomfort')) {
    // SKU from page title
    if (!data.sku) {
      const title = document.querySelector('title')?.innerText || '';
      const match = title.match(/([A-Z]{2,}\d+[A-Z]*)/);
      if (match) data.sku = match[1];
    }
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

(async()=>{ 
  try { 
    const [t] = await chrome.tabs.query({active:true,currentWindow:true}); 
    if(t?.url){
      const d=new URL(t.url).hostname.toLowerCase(); 
      const vendorMap = {
        'uttermost': 'Uttermost', 'fourhands': 'Four Hands', 'bernhardt': 'Bernhardt',
        'visualcomfort': 'Visual Comfort', 'hvlgroup': 'HVL Group', 'gabby': 'Gabby',
        'loloi': 'Loloi', 'rowe': 'Rowe', 'globalviews': 'Global Views',
        'reginaandrew': 'Regina Andrew', 'surya': 'Surya', 'safavieh': 'Safavieh',
        'eichholtz': 'Eichholtz', 'crestview': 'Crestview', 'bassettmirror': 'Bassett Mirror',
        'flowdecor': 'Flow Decor', 'hubbardtonforge': 'Hubbardton Forge', 'hinkley': 'Hinkley',
        'elegantlighting': 'Elegant Lighting', 'zeelighting': 'ZEE Lighting'
      };
      for (const [key, name] of Object.entries(vendorMap)) {
        if (d.includes(key)) {
          vendorBadge.textContent = name;
          vendorBadge.style.display = 'block';
          break;
        }
      }
    }
  } catch(e){} 
})();
