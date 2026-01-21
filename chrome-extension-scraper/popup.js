// Design Ready Product Scraper v7.21.0
// VENDOR-SPECIFIC SCRAPING for 26+ vendors
// IMPROVED PRICE DETECTION & DATA TRANSFER - Jan 2026
// Debug logging enabled in console

const APP_URL = 'https://app.estdesignco.com';
const BACKEND_URL = 'https://app.estdesignco.com';
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
    image_url: null,
    description: null  // Added for remarks field
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

  // PRICE & MSRP - IMPROVED VENDOR-SPECIFIC DETECTION
  const pageText = document.body.innerText;
  
  // ============================================================================
  // VENDOR-SPECIFIC PRICE DETECTION
  // ============================================================================
  
  if (domain.includes('uttermost')) {
    // Uttermost: Dealer price is first price, MSRP follows "Suggested retail price"
    const msrpMatch = pageText.match(/Suggested retail price \$([\d,]+\.?\d*)/i);
    if (msrpMatch) {
      data.msrp = parseFloat(msrpMatch[1].replace(/,/g, ''));
    }
    // Find price before "Suggested retail" - that's the dealer price
    const priceBeforeMsrp = pageText.match(/\$([\d,]+\.?\d*)[\s\S]*?Suggested retail/i);
    if (priceBeforeMsrp) {
      data.price = parseFloat(priceBeforeMsrp[1].replace(/,/g, ''));
    }
  }
  
  else if (domain.includes('fourhands')) {
    // Four Hands: Price in specific element near product title
    const priceEl = document.querySelector('[class*="price"], [data-testid*="price"]');
    if (priceEl) {
      const match = priceEl.textContent.match(/\$([\d,]+\.?\d*)/);
      if (match) data.price = parseFloat(match[1].replace(/,/g, ''));
    }
    // Also try looking for price pattern in page
    if (!data.price) {
      const priceMatch = pageText.match(/\$([\d,]+\.?\d*)\s*(?:USD|each|per item)?/i);
      if (priceMatch) data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
  }
  
  else if (domain.includes('bernhardt')) {
    // Bernhardt: Look for price in product details
    const priceEl = document.querySelector('.product-price, .price, [class*="price"]');
    if (priceEl) {
      const match = priceEl.textContent.match(/\$([\d,]+\.?\d*)/);
      if (match) data.price = parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  else if (domain.includes('visualcomfort')) {
    // Visual Comfort: Price shown prominently
    const priceEl = document.querySelector('[class*="price"], .product-price');
    if (priceEl) {
      const match = priceEl.textContent.match(/\$([\d,]+\.?\d*)/);
      if (match) data.price = parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  else if (domain.includes('hvlgroup')) {
    // HVL: Look for Trade Price specifically
    const tradePriceMatch = pageText.match(/Trade Price[:\s]*\$([\d,]+\.?\d*)/i);
    if (tradePriceMatch) {
      data.price = parseFloat(tradePriceMatch[1].replace(/,/g, ''));
    }
    const msrpMatch = pageText.match(/MSRP[:\s]*\$([\d,]+\.?\d*)/i);
    if (msrpMatch) {
      data.msrp = parseFloat(msrpMatch[1].replace(/,/g, ''));
    }
  }
  
  // GENERIC PRICE DETECTION - AGGRESSIVE VERSION
  if (!data.price) {
    // Try to find price in structured data first (most reliable)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const jsonLd of jsonLdScripts) {
      if (data.price) break;
      try {
        const jsonData = JSON.parse(jsonLd.textContent);
        // Direct offers
        if (jsonData.offers?.price) {
          data.price = parseFloat(String(jsonData.offers.price).replace(/[^0-9.]/g, ''));
          console.log('💰 Found price in JSON-LD offers:', data.price);
        } else if (jsonData.offers?.lowPrice) {
          data.price = parseFloat(String(jsonData.offers.lowPrice).replace(/[^0-9.]/g, ''));
          console.log('💰 Found price in JSON-LD lowPrice:', data.price);
        }
        // @graph array
        if (!data.price && jsonData['@graph']) {
          for (const item of jsonData['@graph']) {
            if (item.offers?.price) {
              data.price = parseFloat(String(item.offers.price).replace(/[^0-9.]/g, ''));
              console.log('💰 Found price in JSON-LD @graph:', data.price);
              break;
            }
          }
        }
        // Product type
        if (!data.price && jsonData['@type'] === 'Product' && jsonData.offers) {
          const offers = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
          if (offers.price) {
            data.price = parseFloat(String(offers.price).replace(/[^0-9.]/g, ''));
            console.log('💰 Found price in Product offers:', data.price);
          }
        }
      } catch(e) { console.log('JSON-LD parse failed:', e.message); }
    }
  }
  
  if (!data.price) {
    // Look for price in common price elements - EXPANDED SELECTORS
    const priceSelectors = [
      '[itemprop="price"]', '[data-price]', '[data-product-price]',
      '.product-price', '.price', '.current-price', '.sale-price', '.regular-price',
      '.price-value', '.price-amount', '.product-price-value',
      '[class*="price"]:not([class*="compare"]):not([class*="was"])',
      '[class*="Price"]:not([class*="Compare"]):not([class*="Was"])',
      '.cost', '.amount', '[class*="cost"]',
      'span[class*="price"]', 'div[class*="price"]', 'p[class*="price"]',
      '[data-testid*="price"]', '[data-qa*="price"]'
    ];
    for (const sel of priceSelectors) {
      if (data.price) break;
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const text = el.textContent || el.getAttribute('content') || el.getAttribute('data-price') || '';
        const match = text.match(/\$?\s*([\d,]+\.?\d*)/);
        if (match) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (val > 0 && val < 500000) {
            data.price = val;
            console.log('💰 Found price via selector', sel, ':', data.price);
            break;
          }
        }
      }
    }
  }
  
  if (!data.price) {
    // Look for price in meta tags
    const priceMeta = document.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[name="price"]');
    if (priceMeta) {
      const val = parseFloat(priceMeta.content.replace(/[^0-9.]/g, ''));
      if (val > 0) {
        data.price = val;
        console.log('💰 Found price in meta tag:', data.price);
      }
    }
  }
  
  if (!data.price) {
    // Last resort: find price near "ADD TO CART" or "Add to Cart"
    const addToCartMatch = pageText.match(/\$([\d,]+\.?\d*)[\s\S]{0,200}(?:ADD TO CART|Add to Cart|ADD TO BAG|Buy Now)/i);
    if (addToCartMatch) {
      data.price = parseFloat(addToCartMatch[1].replace(/,/g, ''));
      console.log('💰 Found price near Add to Cart:', data.price);
    }
  }
  
  if (!data.price) {
    // Final fallback: get first reasonable price on page (NOT in navigation/header)
    const mainContent = document.querySelector('main, #main, .main, [role="main"], .product, .pdp') || document.body;
    const mainText = mainContent.textContent || '';
    const allPrices = mainText.match(/\$([\d,]+\.?\d*)/g) || [];
    for (const p of allPrices) {
      const val = parseFloat(p.replace(/[$,]/g, ''));
      if (val > 10 && val < 500000) {
        // Skip if this looks like an MSRP (if we already found one)
        if (data.msrp && val === data.msrp) continue;
        data.price = val;
        console.log('💰 Found price via text scan:', data.price);
        break;
      }
    }
  }
  
  // Get MSRP if not found yet
  if (!data.msrp) {
    const msrpPatterns = [
      /(?:MSRP|Retail|List Price|Suggested Retail)[:\s]*\$([\d,]+\.?\d*)/i,
      /\$([\d,]+\.?\d*)\s*(?:MSRP|Retail|List)/i
    ];
    for (const pattern of msrpPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        data.msrp = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
  }
  
  console.log('💰 Price found:', data.price, 'MSRP:', data.msrp);

  // PRODUCT IMAGE - vendor-specific main product photo with HIGH RESOLUTION PRIORITIZED
  if (domain.includes('fourhands')) {
    // Four Hands: Look for gallery images with PRM (primary) in filename - HIGHEST RES
    // Try to get 2400x2400 first, then 1800x1800, then 1200x1200
    const resolutions = ['2400x2400', '1800x1800', '1200x1200', 'S1200x1200'];
    for (const res of resolutions) {
      const largeImg = document.querySelector(`img[src*="${res}"], img[src*="_PRM_"][src*="${res}"], img[src*="_FRT_"][src*="${res}"]`);
      if (largeImg?.src) {
        data.image_url = largeImg.src;
        break;
      }
    }
    // If not found, try to upgrade existing image URL to higher res
    if (!data.image_url) {
      const anyImg = document.querySelector('img[src*="_PRM_"], img[src*="_FRT_"], img[src*="cloudfront"]');
      if (anyImg?.src) {
        // Try to replace resolution in URL for higher quality
        let imgUrl = anyImg.src;
        imgUrl = imgUrl.replace(/S\d+x\d+/g, 'S2400x2400')
                       .replace(/\/\d+x\d+\//g, '/2400x2400/')
                       .replace(/w_\d+,h_\d+/g, 'w_2400,h_2400');
        data.image_url = imgUrl;
      }
    }
  }
  
  // Generic HIGH-RES image detection for other vendors
  if (!data.image_url) {
    // Try og:image first (usually high quality)
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content) {
      let imgUrl = ogImage.content;
      // Try to upgrade to higher resolution if URL contains size parameters
      imgUrl = imgUrl.replace(/w_\d+/g, 'w_2400')
                     .replace(/h_\d+/g, 'h_2400')
                     .replace(/\/\d+x\d+\//g, '/2400x2400/')
                     .replace(/_\d+x\d+\./g, '_2400x2400.');
      data.image_url = imgUrl;
    }
  }
  
  if (!data.image_url) {
    // Try to find the largest product image on the page
    const productImgs = document.querySelectorAll(
      '.swiper-slide img, [class*="product-image"] img, [class*="gallery"] img, ' +
      '[class*="main-image"] img, [data-zoom-image], [data-large], [srcset]'
    );
    
    let bestImg = null;
    let bestSize = 0;
    
    for (const img of productImgs) {
      // Check srcset for highest resolution
      if (img.srcset) {
        const srcsetParts = img.srcset.split(',');
        for (const part of srcsetParts) {
          const match = part.trim().match(/(\S+)\s+(\d+)w/);
          if (match && parseInt(match[2]) > bestSize) {
            bestSize = parseInt(match[2]);
            bestImg = match[1];
          }
        }
      }
      // Check data attributes for zoom/large images
      const zoomSrc = img.getAttribute('data-zoom-image') || 
                      img.getAttribute('data-large') || 
                      img.getAttribute('data-full-size') ||
                      img.getAttribute('data-src');
      if (zoomSrc && zoomSrc.startsWith('http')) {
        bestImg = zoomSrc;
        break;
      }
      // Check natural dimensions
      const naturalSize = (img.naturalWidth || 0) * (img.naturalHeight || 0);
      if (naturalSize > bestSize && img.src?.startsWith('http')) {
        bestSize = naturalSize;
        bestImg = img.src;
      }
    }
    
    if (bestImg) {
      data.image_url = bestImg;
    }
  }
  
  // Final fallback: any main product image
  if (!data.image_url) {
    const mainImg = document.querySelector('.swiper-slide-active img, [class*="product-image"] img, #product-image img');
    if (mainImg?.src) data.image_url = mainImg.src;
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

  // ============================================================================
  // FINAL DEBUG OUTPUT - Log ALL scraped data
  // ============================================================================
  console.log('==================== SCRAPE RESULTS ====================');
  console.log('🏪 Vendor:', data.vendor);
  console.log('📦 Product Name:', data.name);
  console.log('🏷️ SKU:', data.sku);
  console.log('💰 PRICE:', data.price);
  console.log('💵 MSRP:', data.msrp);
  console.log('📐 Size:', data.size);
  console.log('🎨 Finish/Color:', data.finish_color);
  console.log('🖼️ Finish Image:', data.finish_image ? 'YES' : 'NO');
  console.log('📷 Product Image:', data.image_url ? 'YES' : 'NO');
  console.log('🔗 URL:', data.url);
  console.log('=========================================================');
  
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
  sendBtn.innerHTML = '<div class="spinner"></div><span>Sending...</span>';
  
  try {
    const params = new URLSearchParams();
    params.set('action','add-item');
    params.set('source','extension');
    
    // ALWAYS send all available data - don't skip based on truthiness
    if(scrapedData.name) params.set('name', scrapedData.name);
    if(scrapedData.price !== undefined && scrapedData.price !== null && scrapedData.price !== '') {
      params.set('price', String(scrapedData.price));
    }
    if(scrapedData.sku) params.set('sku', scrapedData.sku);
    if(scrapedData.size) params.set('size', scrapedData.size);
    if(scrapedData.finish_color) params.set('finish', scrapedData.finish_color);
    if(scrapedData.finish_image) params.set('finish_image', scrapedData.finish_image);
    if(scrapedData.vendor) params.set('vendor', scrapedData.vendor);
    if(scrapedData.url) params.set('link', scrapedData.url);
    if(scrapedData.image_url) params.set('image', scrapedData.image_url);
    if(scrapedData.msrp !== undefined && scrapedData.msrp !== null && scrapedData.msrp !== '') {
      params.set('msrp', String(scrapedData.msrp));
    }
    if(scrapedData.description) params.set('remarks', scrapedData.description);
    
    // DEBUG: Log what we're sending
    console.log('==================== SENDING TO APP ====================');
    console.log('Name:', scrapedData.name);
    console.log('Price:', scrapedData.price, '(type:', typeof scrapedData.price, ')');
    console.log('SKU:', scrapedData.sku);
    console.log('Vendor:', scrapedData.vendor);
    console.log('Image:', scrapedData.image_url ? 'YES' : 'NO');
    console.log('Full params:', params.toString());
    console.log('=========================================================');
    
    // Go directly to the selected project's checklist
    const projectUrl = `${APP_URL}/project/${selectedProjectId}?tab=Checklist&${params.toString()}`;
    
    // IMPROVED TAB REUSE: Find ANY existing app tab and reuse it
    // This prevents opening new windows every time
    chrome.tabs.query({}, function(allTabs) {
      // Look for any tab that has our app URL (any path)
      const existingTab = allTabs.find(t => 
        t.url && (
          t.url.includes('app.estdesignco.com') || 
          t.url.includes('estdesignco.com') ||
          t.url.includes('localhost:3000')
        )
      );
      
      if (existingTab) {
        // REUSE existing tab - just update the URL and bring to front
        console.log('♻️ Reusing existing app tab:', existingTab.id);
        chrome.tabs.update(existingTab.id, {url: projectUrl, active: true});
        // Also focus the window containing the tab
        if (existingTab.windowId) {
          chrome.windows.update(existingTab.windowId, {focused: true});
        }
      } else {
        // No existing tab found - create one
        console.log('🆕 Creating new app tab');
        chrome.tabs.create({url: projectUrl});
      }
    });
    showStatus('Sent to project!', 'success');
  } catch(e) { 
    console.error('Error sending to app:', e);
    // Fallback: Use window.open with same name to reuse window
    window.open(projectUrl, 'design_ready_app');
    showStatus('Sent to project!', 'success');
  }
  finally { 
    sendBtn.disabled = false; 
    sendBtn.innerHTML = '<span>🚀</span><span>SEND TO APP</span>'; 
  }
}

async function copyToClipboard() {
  if (!scrapedData) return;
  try { 
    await navigator.clipboard.writeText(`${scrapedData.name}\n$${scrapedData.price}\n${scrapedData.vendor}\n${scrapedData.finish_color}`); 
    copyBtn.innerHTML='<span>✅</span><span>Copied!</span>'; 
    setTimeout(()=>{copyBtn.innerHTML='<span>📋</span><span>Copy</span>';},2000); 
  } catch(e){}
}

// Copy Image with Background Removed
const copyImageNoBgBtn = document.getElementById('copyImageNoBgBtn');
copyImageNoBgBtn.addEventListener('click', copyImageNoBg);

async function copyImageNoBg() {
  if (!scrapedData || !scrapedData.image_url) {
    showStatus('No image to process!', 'warning');
    return;
  }
  
  copyImageNoBgBtn.disabled = true;
  copyImageNoBgBtn.innerHTML = '<span>⏳</span><span>Processing...</span>';
  showStatus('Removing background...', 'info');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/remove-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: scrapedData.image_url })
    });
    
    if (!response.ok) {
      throw new Error('Background removal failed');
    }
    
    const data = await response.json();
    if (data.success && data.image_base64) {
      // Convert base64 to blob and copy to clipboard
      const byteString = atob(data.image_base64);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([uint8Array], { type: 'image/png' });
      
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showStatus('Image copied (no background)!', 'success');
        copyImageNoBgBtn.innerHTML = '<span>✅</span><span>Copied!</span>';
      } catch (clipErr) {
        // Fallback: open image in new tab
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        showStatus('Image opened in new tab', 'success');
        copyImageNoBgBtn.innerHTML = '<span>✅</span><span>Opened!</span>';
      }
    } else {
      throw new Error('No image data received');
    }
  } catch (e) {
    console.error('BG removal error:', e);
    showStatus('Background removal failed', 'error');
    copyImageNoBgBtn.innerHTML = '<span>❌</span><span>Failed</span>';
  }
  
  setTimeout(() => {
    copyImageNoBgBtn.disabled = false;
    copyImageNoBgBtn.innerHTML = '<span>🖼️</span><span>Copy Image (No BG)</span>';
  }, 2000);
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
