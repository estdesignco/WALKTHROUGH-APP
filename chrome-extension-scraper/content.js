// Content script that runs on wholesale vendor pages
// This scrapes product data from the USER'S logged-in browser session

console.log('🛒 Product Scraper loaded on:', window.location.href);

// Extract product data from the current page
function scrapeProductData() {
  const url = window.location.href;
  const domain = window.location.hostname.replace('www.', '');
  
  console.log('🔍 Scraping product data from:', domain);
  
  const data = {
    url: url,
    vendor: domain,
    name: null,
    sku: null,
    price: null,
    size: null,
    finish_color: null,
    image_url: null
  };
  
  // Get all text from the page
  const bodyText = document.body.innerText || '';
  const bodyHTML = document.body.innerHTML || '';
  
  // === EXTRACT NAME ===
  // Try H1 first
  const h1 = document.querySelector('h1');
  if (h1) {
    data.name = h1.innerText.trim();
  }
  // Fallback to title
  if (!data.name || data.name.length < 3) {
    const title = document.querySelector('title');
    if (title) {
      data.name = title.innerText.split('|')[0].split('-')[0].trim();
    }
  }
  
  // === EXTRACT PRICE ===
  // Look for dollar amounts - the wholesale/trade price is usually the LOWER one
  const priceMatches = bodyText.match(/\$[\d,]+\.?\d*/g) || [];
  console.log('💰 Found price patterns:', priceMatches);
  
  if (priceMatches.length > 0) {
    // Convert to numbers and sort
    const prices = priceMatches.map(p => {
      const num = parseFloat(p.replace(/[$,]/g, ''));
      return isNaN(num) ? 0 : num;
    }).filter(p => p > 10 && p < 100000); // Filter reasonable prices
    
    // Sort ascending - lowest is usually trade/wholesale price
    prices.sort((a, b) => a - b);
    
    if (prices.length > 0) {
      data.price = prices[0]; // Take the lowest price
      console.log('✅ Selected price:', data.price);
    }
  }
  
  // === EXTRACT SKU ===
  // Look for SKU patterns
  const skuPatterns = [
    /SKU[:\s]*([A-Z0-9-]+)/i,
    /Item[:\s#]*([A-Z0-9-]+)/i,
    /Model[:\s#]*([A-Z0-9-]+)/i,
    /Product[:\s#]*([A-Z0-9-]+)/i
  ];
  
  for (const pattern of skuPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      data.sku = match[1].toUpperCase();
      break;
    }
  }
  
  // Fallback: extract from URL
  if (!data.sku) {
    const urlSkuMatch = url.match(/[-\/]([A-Z]?\d{4,6}[-A-Z0-9]*)/i);
    if (urlSkuMatch) {
      data.sku = urlSkuMatch[1].toUpperCase();
    }
  }
  
  // === EXTRACT SIZE/DIMENSIONS ===
  const sizePatterns = [
    /(\d+\.?\d*)\s*["']?\s*[HhWwDdLl]\s*[Xx×]\s*(\d+\.?\d*)\s*["']?\s*[HhWwDdLl]\s*[Xx×]?\s*(\d+\.?\d*)?/,
    /Dimensions?[:\s]*([^<\n]+)/i,
    /Size[:\s]*([^<\n]+)/i,
    /(\d+\.?\d*)\s*[Hh]\s*[Xx×]\s*(\d+\.?\d*)\s*[Ww]\s*[Xx×]?\s*(\d+\.?\d*)?\s*[Dd]?/
  ];
  
  for (const pattern of sizePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      if (match[3]) {
        data.size = `${match[1]} x ${match[2]} x ${match[3]}`;
      } else if (match[2]) {
        data.size = `${match[1]} x ${match[2]}`;
      } else if (match[1]) {
        data.size = match[1].trim();
      }
      break;
    }
  }
  
  // === EXTRACT FINISH/COLOR ===
  const finishPatterns = [
    /Finish[:\s]*([^<\n,]+)/i,
    /Color[:\s]*([^<\n,]+)/i,
    /Material[:\s]*([^<\n,]+)/i
  ];
  
  for (const pattern of finishPatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1].length < 100) {
      data.finish_color = match[1].trim();
      break;
    }
  }
  
  // === EXTRACT IMAGE ===
  // Try Open Graph image first
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    data.image_url = ogImage.content;
  }
  
  // Fallback to main product image
  if (!data.image_url) {
    const productImages = document.querySelectorAll('img[src*="product"], img[class*="product"], img[class*="gallery"]');
    if (productImages.length > 0) {
      data.image_url = productImages[0].src;
    }
  }
  
  console.log('📦 Scraped data:', data);
  return data;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message:', request);
  
  if (request.action === 'scrapeProduct') {
    const data = scrapeProductData();
    sendResponse({ success: true, data: data });
  }
  
  return true;
});

// Also expose scrapeProductData to the window for debugging
window.scrapeProductData = scrapeProductData;

console.log('✅ Product Scraper ready! You can call window.scrapeProductData() to test.');
