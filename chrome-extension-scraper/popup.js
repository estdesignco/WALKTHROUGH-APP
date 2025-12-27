const BACKEND_URL = 'https://vendor-bridge-8.preview.emergentagent.com';

let scrapedData = null;

// Scrape button
document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('scrapeBtn');
  const status = document.getElementById('status');
  const emptyState = document.getElementById('emptyState');
  const resultContainer = document.getElementById('resultContainer');
  
  btn.disabled = true;
  btn.textContent = '⏳ Scraping...';
  status.style.display = 'block';
  status.className = 'status info';
  status.textContent = '🔍 Extracting product data...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject and execute scraping script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapePageData
    });
    
    scrapedData = results[0].result;
    
    if (!scrapedData || !scrapedData.name) {
      throw new Error('Could not extract product data from this page');
    }
    
    // Show results
    emptyState.style.display = 'none';
    resultContainer.style.display = 'block';
    
    document.getElementById('resultName').textContent = scrapedData.name || '-';
    document.getElementById('resultPrice').textContent = scrapedData.price ? `$${scrapedData.price}` : '-';
    document.getElementById('resultPrice').className = 'field-value price' + (scrapedData.price ? '' : ' missing');
    document.getElementById('resultMsrp').textContent = scrapedData.msrp ? `$${scrapedData.msrp}` : '-';
    document.getElementById('resultSku').textContent = scrapedData.sku || '-';
    document.getElementById('resultVendor').textContent = scrapedData.vendor || '-';
    document.getElementById('resultSize').textContent = scrapedData.size || '-';
    document.getElementById('resultFinish').textContent = scrapedData.finish_color || '-';
    document.getElementById('resultUrl').textContent = scrapedData.url || '-';
    
    if (scrapedData.image_url) {
      document.getElementById('resultImage').src = scrapedData.image_url;
    }
    
    status.className = 'status success';
    status.textContent = scrapedData.price ? `✅ Found price: $${scrapedData.price}` : '⚠️ Scraped but no price found - are you logged in?';
    
  } catch (e) {
    status.className = 'status error';
    status.textContent = '❌ ' + e.message;
  }
  
  btn.disabled = false;
  btn.textContent = '⚡ SCRAPE THIS PAGE';
});

// Send to app button
document.getElementById('sendBtn').addEventListener('click', async () => {
  if (!scrapedData) return;
  
  const btn = document.getElementById('sendBtn');
  const status = document.getElementById('status');
  
  btn.disabled = true;
  btn.textContent = '⏳ Sending...';
  
  try {
    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/extension-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapedData)
    });
    
    if (!response.ok) throw new Error('Failed to send to server');
    
    // Open app with data in URL
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('name', scrapedData.name || '');
    params.set('price', scrapedData.price || '');
    params.set('sku', scrapedData.sku || '');
    params.set('size', scrapedData.size || '');
    params.set('finish', scrapedData.finish_color || '');
    params.set('vendor', scrapedData.vendor || '');
    params.set('link', scrapedData.url || '');
    params.set('image', scrapedData.image_url || '');
    
    window.open(`${BACKEND_URL}?${params.toString()}`, '_blank');
    
    status.className = 'status success';
    status.textContent = '✅ Sent! App should open with data filled in.';
    
  } catch (e) {
    status.className = 'status error';
    status.textContent = '❌ ' + e.message;
  }
  
  btn.disabled = false;
  btn.textContent = '🚀 SEND TO DESIGN READY APP';
});

// Copy button
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!scrapedData) return;
  
  const text = `Product: ${scrapedData.name}
Price: $${scrapedData.price || 'N/A'}
SKU: ${scrapedData.sku || 'N/A'}
Vendor: ${scrapedData.vendor || 'N/A'}
Size: ${scrapedData.size || 'N/A'}
Finish: ${scrapedData.finish_color || 'N/A'}
URL: ${scrapedData.url}`;
  
  await navigator.clipboard.writeText(text);
  
  const btn = document.getElementById('copyBtn');
  btn.textContent = '✅ Copied!';
  setTimeout(() => btn.textContent = '📋 Copy to Clipboard', 2000);
});

// The actual scraping function - runs in page context
function scrapePageData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '');
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
    image_url: null
  };
  
  // Vendor detection
  const vendorMap = {
    'uttermost': 'Uttermost',
    'visualcomfort': 'Visual Comfort',
    'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt',
    'reginaandrew': 'Regina Andrew',
    'jaipurliving': 'Jaipur Living',
    'loloirugs': 'Loloi',
    'globalviews': 'Global Views',
    'surya': 'Surya',
    'gabby': 'Gabby'
  };
  
  for (const [key, val] of Object.entries(vendorMap)) {
    if (domain.includes(key)) {
      data.vendor = val;
      break;
    }
  }
  if (!data.vendor) {
    data.vendor = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  }
  
  // Name - H1 or og:title
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim();
  if (!data.name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) data.name = ogTitle.content;
  }
  
  // Price - find dollar amounts
  const priceMatches = bodyText.match(/\$\s*([\d,]+(?:\.\d{2})?)/g) || [];
  if (priceMatches.length > 0) {
    const prices = priceMatches
      .map(p => parseFloat(p.replace(/[$,\s]/g, '')))
      .filter(p => p > 10 && p < 100000)
      .sort((a, b) => a - b);
    
    if (prices.length >= 2) {
      data.price = prices[0]; // Lowest = wholesale
      data.msrp = prices[prices.length - 1]; // Highest = MSRP
    } else if (prices.length === 1) {
      data.price = prices[0];
    }
  }
  
  // SKU
  const skuPatterns = [
    /SKU[:\s]*([A-Z0-9][-A-Z0-9]*)/i,
    /Item\s*#?[:\s]*([A-Z0-9][-A-Z0-9]*)/i,
    /Model[:\s]*([A-Z0-9][-A-Z0-9]*)/i
  ];
  for (const pattern of skuPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      data.sku = match[1].toUpperCase();
      break;
    }
  }
  
  // Size
  const sizePatterns = [
    /(\d+\.?\d*)\s*["']?\s*[Hh]\s*[Xx×]\s*(\d+\.?\d*)\s*["']?\s*[Ww]\s*[Xx×]?\s*(\d+\.?\d*)?\s*["']?\s*[Dd]?/,
    /(\d+\.?\d*)\s*["']?\s*[Ww]\s*[Xx×]\s*(\d+\.?\d*)\s*["']?\s*[Hh]\s*[Xx×]?\s*(\d+\.?\d*)?\s*["']?\s*[Dd]?/,
    /Dimensions?[:\s]*([^\n]{5,50})/i
  ];
  for (const pattern of sizePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      if (match[3]) {
        data.size = `${match[1]} x ${match[2]} x ${match[3]}`;
      } else if (match[2]) {
        data.size = `${match[1]} x ${match[2]}`;
      } else {
        data.size = match[1].trim();
      }
      break;
    }
  }
  
  // Finish/Color
  const finishPatterns = [
    /Finish[:\s]*([^\n,]{3,40})/i,
    /Color[:\s]*([^\n,]{3,40})/i
  ];
  for (const pattern of finishPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      data.finish_color = match[1].trim();
      break;
    }
  }
  
  // Image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) data.image_url = ogImage.content;
  
  return data;
}
