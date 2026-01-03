// Design Ready Product Scraper v7.0.0
// COMPLETE REWRITE - Multi-vendor support with vendor-specific logic
// Vendors: Uttermost, Four Hands, Bernhardt, Visual Comfort, HVL Group, Gabby, Loloi, Rowe

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
    projectSelector.innerHTML = '<option value="">-- Could not load --</option>';
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
  // VENDOR DETECTION
  // ============================================================================
  if (domain.includes('uttermost')) data.vendor = 'Uttermost';
  else if (domain.includes('fourhands')) data.vendor = 'Four Hands';
  else if (domain.includes('bernhardt')) data.vendor = 'Bernhardt';
  else if (domain.includes('visualcomfort')) data.vendor = 'Visual Comfort';
  else if (domain.includes('hvlgroup')) data.vendor = 'HVL Group';
  else if (domain.includes('gabby')) data.vendor = 'Gabby';
  else if (domain.includes('loloirugs') || domain.includes('loloi')) data.vendor = 'Loloi';
  else if (domain.includes('rowefurniture') || domain.includes('rowe')) data.vendor = 'Rowe Furniture';
  else data.vendor = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  // ============================================================================
  // BERNHARDT - Angular-based site
  // ============================================================================
  if (domain.includes('bernhardt')) {
    // Name from h1 with specific class
    const h1 = document.querySelector('h1.product-description, h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU from URL or product-id element
    const urlMatch = window.location.pathname.match(/\/shop\/([A-Z0-9]+)/i);
    if (urlMatch) data.sku = urlMatch[1];
    if (!data.sku) {
      const skuEl = document.querySelector('.product-id, [ng-bind*="product.id"]');
      if (skuEl) data.sku = skuEl.innerText.trim();
    }
    
    // Price
    const priceEl = document.querySelector('.pricing-row .price, .product-price');
    if (priceEl) {
      const priceMatch = priceEl.innerText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Dimensions from spec rows
    const specRows = document.querySelectorAll('.spec-row, .dimension-item, [class*="dimension"]');
    let width = '', height = '', depth = '';
    specRows.forEach(row => {
      const text = row.innerText;
      if (text.includes('Width') || text.includes('W:')) {
        const match = text.match(/(\d+)/);
        if (match) width = match[1];
      }
      if (text.includes('Height') || text.includes('H:')) {
        const match = text.match(/(\d+)/);
        if (match) height = match[1];
      }
      if (text.includes('Depth') || text.includes('D:')) {
        const match = text.match(/(\d+)/);
        if (match) depth = match[1];
      }
    });
    // Also try from page text
    if (!width) {
      const wMatch = pageText.match(/Width[:\s]*(\d+)/i);
      if (wMatch) width = wMatch[1];
    }
    if (!height) {
      const hMatch = pageText.match(/Height[:\s]*(\d+)/i);
      if (hMatch) height = hMatch[1];
    }
    if (!depth) {
      const dMatch = pageText.match(/Depth[:\s]*(\d+)/i);
      if (dMatch) depth = dMatch[1];
    }
    if (width || height || depth) {
      data.size = `${width || '?'}"W x ${depth || '?'}"D x ${height || '?'}"H`;
    }
    
    // Fabric/Finish from the "BODY FABRIC" or "Fabric Shown" section
    const fabricLabels = document.querySelectorAll('.fabric-swatch-label, [class*="fabric"] .label, .body-fabric-label');
    for (const label of fabricLabels) {
      const text = label.innerText.trim();
      if (text && text.length > 2 && !text.includes('BODY') && !text.includes('Fabric')) {
        data.finish_color = text;
        break;
      }
    }
    // Try from the fabric shown text
    if (!data.finish_color) {
      const fabricMatch = pageText.match(/Fabric Shown[:\s]*([^\n]+)/i);
      if (fabricMatch) data.finish_color = fabricMatch[1].trim();
    }
    // Try from specific element
    if (!data.finish_color) {
      const fabricEl = document.querySelector('[ng-bind*="FabricShown"], .fabric-name');
      if (fabricEl) data.finish_color = fabricEl.innerText.trim();
    }
    
    // Fabric swatch image
    const fabricImg = document.querySelector('.fabric-swatch img, [class*="fabric-swatch"] img, .swatch-image img');
    if (fabricImg && fabricImg.src) data.finish_image = fabricImg.src;
    
    // Main product image
    const mainImg = document.querySelector('.grid-image, .product-image img, meta[property="og:image"]');
    if (mainImg) {
      data.image_url = mainImg.src || mainImg.content;
    }
  }
  
  // ============================================================================
  // VISUAL COMFORT - Magento-based site
  // ============================================================================
  else if (domain.includes('visualcomfort')) {
    // Name
    const h1 = document.querySelector('h1.page-title span, h1.page-title, h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU from title or URL
    const titleEl = document.querySelector('title');
    if (titleEl) {
      const skuMatch = titleEl.innerText.match(/([A-Z]{2,}\d+[A-Z]*)/);
      if (skuMatch) data.sku = skuMatch[1];
    }
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/([a-z]{2,}\d+[a-z]*)/i);
      if (urlMatch) data.sku = urlMatch[1].toUpperCase();
    }
    
    // Price
    const priceEl = document.querySelector('[data-price-type="finalPrice"] .price, .price-final_price .price');
    if (priceEl) {
      const priceMatch = priceEl.innerText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Dimensions from specs
    const specText = pageText;
    const heightMatch = specText.match(/Height[:\s]*([\d.]+)["']/i);
    const widthMatch = specText.match(/Width[:\s]*([\d.]+)["']/i);
    const depthMatch = specText.match(/(?:Depth|Extension)[:\s]*([\d.]+)["']/i);
    if (heightMatch || widthMatch) {
      data.size = `${widthMatch?.[1] || '?'}"W x ${depthMatch?.[1] || '?'}"D x ${heightMatch?.[1] || '?'}"H`;
    }
    
    // Finish from options
    const optionLabel = document.querySelector('.product-options-wrapper .swatch-option.selected, .swatch-attribute-selected-option');
    if (optionLabel) data.finish_color = optionLabel.innerText.trim() || optionLabel.getAttribute('aria-label') || optionLabel.getAttribute('data-option-label');
    
    // Finish swatch image
    const swatchImg = document.querySelector('.swatch-option.selected img, .product-options-wrapper .swatch-option img');
    if (swatchImg && swatchImg.src) data.finish_image = swatchImg.src;
    
    // Main image
    const mainImg = document.querySelector('.gallery-placeholder__image, .fotorama__img, meta[property="og:image"]');
    if (mainImg) data.image_url = mainImg.src || mainImg.content;
  }
  
  // ============================================================================
  // HVL GROUP (Hudson Valley, Troy, Corbett, Mitzi)
  // ============================================================================
  else if (domain.includes('hvlgroup')) {
    // Name from h1.item-title
    const h1 = document.querySelector('h1.item-title, h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU from URL or page
    const urlMatch = window.location.pathname.match(/\/Product\/([^\/]+)/i);
    if (urlMatch) data.sku = urlMatch[1];
    
    // Price - look for "Trade Price" or "Net Price" in spec rows
    const specRows = document.querySelectorAll('.spec-row, .price-row, [class*="spec"]');
    specRows.forEach(row => {
      const label = row.querySelector('.spec-label, label');
      const value = row.querySelector('.spec-value, .value');
      if (label && value) {
        const labelText = label.innerText.toLowerCase();
        if (labelText.includes('trade') || labelText.includes('net') || labelText.includes('price')) {
          const priceMatch = value.innerText.match(/\$([\d,]+\.?\d*)/);
          if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
        if (labelText.includes('msrp') || labelText.includes('retail')) {
          const msrpMatch = value.innerText.match(/\$([\d,]+\.?\d*)/);
          if (msrpMatch) data.msrp = parseFloat(msrpMatch[1].replace(/,/g, ''));
        }
      }
    });
    // Fallback: find price from page text
    if (!data.price) {
      const priceMatch = pageText.match(/Trade Price[:\s]*\$([\d,]+\.?\d*)/i);
      if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    if (!data.price) {
      const priceMatch = pageText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Dimensions
    const dimMatch = pageText.match(/(\d+(?:\.\d+)?)"?\s*[Hh]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[Ww]\s*[x×X]?\s*(\d+(?:\.\d+)?)?/);
    if (dimMatch) {
      data.size = `${dimMatch[2]}"W x ${dimMatch[3] || '?'}"D x ${dimMatch[1]}"H`;
    } else {
      // Try individual dimensions
      const hMatch = pageText.match(/Height[:\s]*([\d.]+)/i);
      const wMatch = pageText.match(/Width[:\s]*([\d.]+)/i);
      const dMatch = pageText.match(/Depth[:\s]*([\d.]+)/i);
      if (hMatch || wMatch) {
        data.size = `${wMatch?.[1] || '?'}"W x ${dMatch?.[1] || '?'}"D x ${hMatch?.[1] || '?'}"H`;
      }
    }
    
    // Finish from "AVAILABLE FINISHES" section
    const finishLinks = document.querySelectorAll('.finish-link, [class*="finish"] a, .available-finishes a');
    for (const link of finishLinks) {
      const isSelected = link.classList.contains('selected') || link.classList.contains('active');
      if (isSelected) {
        data.finish_color = link.getAttribute('title') || link.innerText.trim();
        const img = link.querySelector('img');
        if (img && img.src) data.finish_image = img.src;
        break;
      }
    }
    // If no selected, get from page text
    if (!data.finish_color) {
      const finishMatch = pageText.match(/(?:Finish|Color)[:\s]*([A-Za-z\s]+?)(?:\n|$)/i);
      if (finishMatch) data.finish_color = finishMatch[1].trim();
    }
    // Get finish from URL suffix
    if (!data.finish_color && data.sku) {
      const suffixMatch = data.sku.match(/-([A-Z]+)$/);
      if (suffixMatch) {
        const finishCodes = {VB: 'Vintage Brass', PN: 'Polished Nickel', AB: 'Aged Brass', OB: 'Old Bronze'};
        data.finish_color = finishCodes[suffixMatch[1]] || suffixMatch[1];
      }
    }
    
    // Main image
    const mainImg = document.querySelector('.product-image img, .main-image img, meta[property="og:image"]');
    if (mainImg) data.image_url = mainImg.src || mainImg.content;
  }
  
  // ============================================================================
  // GABBY
  // ============================================================================
  else if (domain.includes('gabby')) {
    // Name
    const h1 = document.querySelector('h1.product-title, h1.product-name, h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU
    const skuEl = document.querySelector('.product-sku, [class*="sku"]');
    if (skuEl) {
      const skuMatch = skuEl.innerText.match(/(?:SKU|Item)[:\s#]*([A-Z0-9-]+)/i);
      if (skuMatch) data.sku = skuMatch[1];
    }
    if (!data.sku) {
      const skuMatch = pageText.match(/(?:SKU|Item)[:\s#]*([A-Z0-9-]+)/i);
      if (skuMatch) data.sku = skuMatch[1];
    }
    
    // Price
    const priceEl = document.querySelector('.product-price, .price, [class*="price"]');
    if (priceEl) {
      const priceMatch = priceEl.innerText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Dimensions
    const dimMatch = pageText.match(/(\d+(?:\.\d+)?)"?\s*[Ww]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[Dd]\s*[x×X]\s*(\d+(?:\.\d+)?)"?\s*[Hh]/);
    if (dimMatch) {
      data.size = `${dimMatch[1]}"W x ${dimMatch[2]}"D x ${dimMatch[3]}"H`;
    }
    
    // Fabric/Finish
    const fabricEl = document.querySelector('.product-fabric, .fabric-name, [class*="fabric"]');
    if (fabricEl) data.finish_color = fabricEl.innerText.trim();
    
    // Swatch image
    const swatchImg = document.querySelector('.fabric-swatch img, .swatch-image img, [class*="swatch"] img');
    if (swatchImg && swatchImg.src) data.finish_image = swatchImg.src;
    
    // Main image
    const mainImg = document.querySelector('.product-image img, .main-image img, meta[property="og:image"]');
    if (mainImg) data.image_url = mainImg.src || mainImg.content;
  }
  
  // ============================================================================
  // LOLOI RUGS
  // ============================================================================
  else if (domain.includes('loloi')) {
    // Name
    const h1 = document.querySelector('h1.product-title, h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU
    const skuMatch = pageText.match(/(?:SKU|Style)[:\s#]*([A-Z0-9-]+)/i);
    if (skuMatch) data.sku = skuMatch[1];
    
    // Price
    const priceMatch = pageText.match(/\$([\d,]+\.?\d*)/);
    if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    
    // Dimensions (rugs have size like 2'3" x 3'9")
    const rugSizeMatch = pageText.match(/(\d+'[\d"]+)\s*[x×X]\s*(\d+'[\d"]+)/);
    if (rugSizeMatch) {
      data.size = `${rugSizeMatch[1]} x ${rugSizeMatch[2]}`;
    }
    
    // Color from product name or selector
    const colorEl = document.querySelector('.product-color, .color-name, [class*="color"]');
    if (colorEl) data.finish_color = colorEl.innerText.trim();
    if (!data.finish_color && data.name && data.name.includes('/')) {
      data.finish_color = data.name.split('/').pop().trim();
    }
    
    // Color swatch
    const swatchImg = document.querySelector('.color-swatch img, [class*="swatch"] img');
    if (swatchImg && swatchImg.src) data.finish_image = swatchImg.src;
    
    // Main image
    const mainImg = document.querySelector('.product-image img, meta[property="og:image"]');
    if (mainImg) data.image_url = mainImg.src || mainImg.content;
  }
  
  // ============================================================================
  // ROWE FURNITURE
  // ============================================================================
  else if (domain.includes('rowe')) {
    // Name
    const h1 = document.querySelector('h1.product-name, h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU
    const skuMatch = pageText.match(/(?:SKU|Style|Model)[:\s#]*([A-Z0-9-]+)/i);
    if (skuMatch) data.sku = skuMatch[1];
    
    // Price
    const priceMatch = pageText.match(/\$([\d,]+\.?\d*)/);
    if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    
    // Dimensions
    const dimMatch = pageText.match(/(\d+)"?\s*[Ww]\s*[x×X]\s*(\d+)"?\s*[Dd]\s*[x×X]\s*(\d+)"?\s*[Hh]/);
    if (dimMatch) {
      data.size = `${dimMatch[1]}"W x ${dimMatch[2]}"D x ${dimMatch[3]}"H`;
    }
    
    // Fabric
    const fabricEl = document.querySelector('.fabric-name, .selected-fabric, [class*="fabric"]');
    if (fabricEl) data.finish_color = fabricEl.innerText.trim();
    
    // Fabric swatch
    const swatchImg = document.querySelector('.fabric-swatch img, [class*="fabric"] img');
    if (swatchImg && swatchImg.src) data.finish_image = swatchImg.src;
    
    // Main image
    const mainImg = document.querySelector('.product-image img, meta[property="og:image"]');
    if (mainImg) data.image_url = mainImg.src || mainImg.content;
  }
  
  // ============================================================================
  // FOUR HANDS
  // ============================================================================
  else if (domain.includes('fourhands')) {
    // Name
    const h1 = document.querySelector('h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU from subtitle or URL
    const subtitle = document.querySelector('.text-neutral-50');
    if (subtitle && subtitle.textContent.includes('•')) {
      const parts = subtitle.textContent.split('•');
      data.finish_color = parts[0].trim();
      if (parts[1]) data.sku = parts[1].trim();
    }
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/\/product\/([^\/]+)/i);
      if (urlMatch) data.sku = urlMatch[1];
    }
    
    // Price
    const priceMatch = pageText.match(/\$([\d,]+\.?\d*)/);
    if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    
    // Dimensions
    const dimMatch = pageText.match(/([\d.]+)"?\s*[Ww]\s*[x×X]\s*([\d.]+)"?\s*[Dd]\s*[x×X]\s*([\d.]+)"?\s*[Hh]/i);
    if (dimMatch) {
      data.size = `${dimMatch[1]}"W x ${dimMatch[2]}"D x ${dimMatch[3]}"H`;
    }
    
    // Cover/Cushion color from truncate elements
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
    
    // Swatch from labels
    const swatchLabels = document.querySelectorAll('label[title]');
    for (const label of swatchLabels) {
      const title = label.getAttribute('title');
      const img = label.querySelector('img');
      if (title && title !== 'None' && img && img.src && !img.src.includes('PLACEHOLDER')) {
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
    
    // Main image
    const mainImg = document.querySelector('img[src*="1200x1200"], img[src*="_PRM_"]');
    if (mainImg) data.image_url = mainImg.src;
    if (!data.image_url) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) data.image_url = ogImg.content;
    }
  }
  
  // ============================================================================
  // UTTERMOST (Original working logic)
  // ============================================================================
  else if (domain.includes('uttermost')) {
    // Name
    const h1 = document.querySelector('h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU
    const skuMatch = pageText.match(/SKU[:\s]*(\d+)/i);
    if (skuMatch) data.sku = skuMatch[1];
    
    // MSRP
    const msrpMatch = pageText.match(/Suggested retail price \$([\d,]+\.?\d*)/i);
    if (msrpMatch) data.msrp = parseFloat(msrpMatch[1].replace(/,/g, ''));
    
    // Price near ADD TO CART
    const addToCartMatch = pageText.match(/\$([\d,]+\.?\d*)\s*[\s\S]*?ADD TO CART/i);
    if (addToCartMatch) data.price = parseFloat(addToCartMatch[1].replace(/,/g, ''));
    if (!data.price) {
      const allPrices = pageText.match(/\$([\d,]+\.?\d*)/g) || [];
      for (const p of allPrices) {
        const val = parseFloat(p.replace(/[$,]/g, ''));
        if (val > 50 && val < 50000) {
          if (data.msrp && val < data.msrp) {
            data.price = val;
            break;
          } else if (!data.msrp) {
            data.price = val;
            break;
          }
        }
      }
    }
    
    // Dimensions
    const sizeMatch = pageText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D/i);
    if (sizeMatch) data.size = `${sizeMatch[1]}"W x ${sizeMatch[3]}"D x ${sizeMatch[2]}"H`;
    
    // Color swatches - buttons with background-image
    const colorLabel = Array.from(document.querySelectorAll('span, label, div')).find(
      el => el.innerText?.trim().toLowerCase() === 'color'
    );
    if (colorLabel) {
      const container = colorLabel.closest('div[class*="option"], section') || colorLabel.parentElement;
      if (container) {
        const swatchButtons = container.querySelectorAll('button[style*="background-image"]');
        for (const btn of swatchButtons) {
          const isSelected = btn.className?.includes('selected') || 
                            btn.getAttribute('aria-selected') === 'true';
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
    
    // Fallback color from product name
    if (!data.finish_color && data.name && data.name.includes(',')) {
      data.finish_color = data.name.split(',').pop().trim();
    }
    
    // Main image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content) data.image_url = ogImage.content;
    else {
      const mainImg = document.querySelector('.swiper-slide-active img, [class*="product-image"] img');
      if (mainImg) data.image_url = mainImg.src;
    }
  }
  
  // ============================================================================
  // GENERIC FALLBACK for other vendors
  // ============================================================================
  else {
    // Name
    const h1 = document.querySelector('h1');
    if (h1) data.name = h1.innerText.trim();
    
    // SKU
    const skuMatch = pageText.match(/(?:SKU|Item|Style|Model)[:\s#]*([A-Z0-9-]+)/i);
    if (skuMatch) data.sku = skuMatch[1];
    
    // Price
    const priceMatch = pageText.match(/\$([\d,]+\.?\d*)/);
    if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    
    // Dimensions
    const dimMatch = pageText.match(/(\d+)"?\s*[Ww]\s*[x×X]\s*(\d+)"?\s*[Dd]\s*[x×X]\s*(\d+)"?\s*[Hh]/);
    if (dimMatch) data.size = `${dimMatch[1]}"W x ${dimMatch[2]}"D x ${dimMatch[3]}"H`;
    
    // Generic swatch detection
    const swatchImgs = document.querySelectorAll('[class*="swatch"] img, [class*="color"] img, [class*="finish"] img');
    for (const img of swatchImgs) {
      if (img.src && img.src.startsWith('http')) {
        data.finish_image = img.src;
        data.finish_color = img.alt || '';
        break;
      }
    }
    
    // Main image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content) data.image_url = ogImage.content;
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

// Auto-detect vendor on popup open
(async()=>{ 
  try { 
    const [t] = await chrome.tabs.query({active:true,currentWindow:true}); 
    if(t?.url){
      const d=new URL(t.url).hostname.toLowerCase(); 
      let vendor = '';
      if(d.includes('uttermost')) vendor = 'Uttermost';
      else if(d.includes('fourhands')) vendor = 'Four Hands';
      else if(d.includes('bernhardt')) vendor = 'Bernhardt';
      else if(d.includes('visualcomfort')) vendor = 'Visual Comfort';
      else if(d.includes('hvlgroup')) vendor = 'HVL Group';
      else if(d.includes('gabby')) vendor = 'Gabby';
      else if(d.includes('loloi')) vendor = 'Loloi';
      else if(d.includes('rowe')) vendor = 'Rowe';
      if(vendor) {
        vendorBadge.textContent = vendor;
        vendorBadge.style.display = 'block';
      }
    }
  } catch(e){} 
})();
