// Content script for Canva page scanning - TRADE VENDORS ONLY

// Prevent double-loading
if (window.__canvaScannerLoaded) {
  console.log('🎨 Canva Scanner already loaded, skipping...');
} else {
  window.__canvaScannerLoaded = true;
  console.log('🎨 Canva Scanner Content Script LOADED at:', new Date().toLocaleTimeString());
  console.log('📍 Current URL:', window.location.href);
}

// Known trade vendor domains (from user's list + open to others)
const KNOWN_TRADE_VENDORS = [
  'lounards.com',
  'estdesignco.com',
  'havefurniture.com',
  'globeviews.com',
  'bernhardt.com',
  'lolahug.com',
  'visualcomfort.com',
  'hvlgroup.com',
  'gabby.com',
  '1owdecor.com',
  'cre8tivecolletion.com',
  'baseliminar.com',
  'eichholtz.com',
  'myshomercq.com',
  'safavieh.com',
  'surya.com',
  'beekighting.com',
  'hubbardtonforge.com',
  'hinkley.com',
  'elegantlighting.com',
  'reginaandrew.com',
  'arteriorshome.com',
  'vanguardfurniture.com'
];

// RETAIL SITES TO EXCLUDE (the "NPC" sites user mentioned)
const RETAIL_BLACKLIST = [
  'wayfair.com',
  'crateandbarrel.com',
  'westelm.com',
  'potterybarn.com',
  'cb2.com',
  'anthropologie.com',
  'urbanoutfitters.com',
  'target.com',
  'amazon.com',
  'walmart.com',
  'overstock.com',
  'homedepot.com',
  'lowes.com',
  'ikea.com',
  'roomandboard.com'
];

// Product URL patterns that indicate it's a product page
const PRODUCT_URL_PATTERNS = [
  '/product/',
  '/products/',
  '/item/',
  '/items/',
  '/furniture/',
  '/lighting/',
  '/collection/',
  '/collections/',
  '/catalog/',
  '/shop/',
  '-p-',
  '/pd/',
  '/detail/',
  '/sku/',
  '/model/'
];

// Non-product page patterns to exclude
const NON_PRODUCT_PATTERNS = [
  '/login',
  '/signin',
  '/signup',
  '/register',
  '/cart',
  '/checkout',
  '/account',
  '/customer/account',
  '/dealer',
  '/about',
  '/contact',
  '/home',
  '/index',
  '/search',
  '/gallery'
];

function isProductUrl(url) {
  const lowerUrl = url.toLowerCase();
  
  // Check if it's a retail site (EXCLUDE)
  if (RETAIL_BLACKLIST.some(retail => lowerUrl.includes(retail))) {
    console.log(`❌ EXCLUDED (retail): ${url}`);
    return false;
  }
  
  // Check if it matches non-product patterns (EXCLUDE)
  if (NON_PRODUCT_PATTERNS.some(pattern => lowerUrl.includes(pattern))) {
    console.log(`❌ EXCLUDED (non-product page): ${url}`);
    return false;
  }
  
  // Check if it's a known trade vendor (HIGH PRIORITY)
  const isKnownVendor = KNOWN_TRADE_VENDORS.some(vendor => lowerUrl.includes(vendor));
  
  // Check if URL structure suggests it's a product
  const hasProductPattern = PRODUCT_URL_PATTERNS.some(pattern => lowerUrl.includes(pattern));
  
  // Accept if: (known vendor) OR (has product pattern AND not retail)
  if (isKnownVendor) {
    console.log(`✅ ACCEPTED (known trade vendor): ${url}`);
    return true;
  }
  
  if (hasProductPattern) {
    console.log(`✅ ACCEPTED (product URL pattern): ${url}`);
    return true;
  }
  
  console.log(`⚠️ SKIPPED (uncertain): ${url}`);
  return false;
}

function scanPageForLinks() {
  console.log('🔍 Starting SMART scan for TRADE VENDOR product links...');
  const results = [];
  const seenUrls = new Set();
  const allFoundUrls = []; // Debug: track ALL URLs found
  
  // METHOD 1: Scan all text content for URLs
  console.log('\n📄 METHOD 1: Scanning page text...');
  const pageText = document.body.innerText || document.body.textContent || '';
  const urlPattern = /https?:\/\/[^\s<>"'\)]+/gi;
  const foundUrls = pageText.match(urlPattern) || [];
  console.log(`   Found ${foundUrls.length} total URLs in text`);
  
  // DEBUG: Log ALL URLs found (not just product ones)
  foundUrls.forEach(url => {
    if (!url.includes('canva.com')) {
      allFoundUrls.push({ url, method: 'text' });
    }
  });
  
  foundUrls.forEach(url => {
    if (!url.includes('canva.com') && isProductUrl(url) && !seenUrls.has(url)) {
      seenUrls.add(url);
      results.push({ url, source: 'text', confidence: 'high' });
    }
  });
  
  // METHOD 2: Scan all <a> tags
  console.log('\n🔗 METHOD 2: Scanning <a> tags...');
  const allLinks = document.querySelectorAll('a[href]');
  console.log(`   Found ${allLinks.length} total <a> tags`);
  
  allLinks.forEach(link => {
    const href = link.href;
    if (href && 
        !href.includes('canva.com') && 
        !href.startsWith('javascript:') &&
        !href.startsWith('#') &&
        isProductUrl(href) &&
        !seenUrls.has(href)) {
      seenUrls.add(href);
      results.push({ url: href, source: 'link', confidence: 'high' });
    }
  });
  
  // METHOD 3: Scan for data attributes (Canva might store links here)
  console.log('\n🎯 METHOD 3: Scanning data attributes...');
  const elementsWithData = document.querySelectorAll('[data-href], [data-url], [data-link]');
  console.log(`   Found ${elementsWithData.length} elements with data attributes`);
  
  elementsWithData.forEach(el => {
    const dataUrl = el.getAttribute('data-href') || el.getAttribute('data-url') || el.getAttribute('data-link');
    if (dataUrl && isProductUrl(dataUrl) && !seenUrls.has(dataUrl)) {
      seenUrls.add(dataUrl);
      results.push({ url: dataUrl, source: 'data-attribute', confidence: 'medium' });
    }
  });
  
  // METHOD 4: Look inside image elements for associated links
  console.log('\n🖼️ METHOD 4: Scanning images with clickable parents...');
  const allImages = document.querySelectorAll('img');
  console.log(`   Found ${allImages.length} total images`);
  
  allImages.forEach(img => {
    // Check if image is inside a link
    const parentLink = img.closest('a[href]');
    if (parentLink && parentLink.href) {
      const href = parentLink.href;
      if (!href.includes('canva.com') && isProductUrl(href) && !seenUrls.has(href)) {
        seenUrls.add(href);
        results.push({ url: href, source: 'image-link', confidence: 'high' });
      }
    }
  });
  
  // METHOD 5: Search for URLs in style attributes and background images
  console.log('\n🎨 METHOD 5: Scanning inline styles...');
  const elementsWithStyle = document.querySelectorAll('[style*="url("]');
  console.log(`   Found ${elementsWithStyle.length} elements with background URLs`);
  
  elementsWithStyle.forEach(el => {
    const style = el.getAttribute('style');
    const urlMatches = style.match(/url\(['"]?([^'"\)]+)['"]?\)/gi);
    if (urlMatches) {
      urlMatches.forEach(match => {
        const url = match.replace(/url\(['"]?([^'"\)]+)['"]?\)/, '$1');
        if (isProductUrl(url) && !seenUrls.has(url)) {
          seenUrls.add(url);
          results.push({ url, source: 'style', confidence: 'low' });
        }
      });
    }
  });
  
  console.log('\n📊 SCAN COMPLETE!');
  console.log(`   Total unique product URLs found: ${results.length}`);
  
  // DEBUG: Show ALL URLs found (even if not product URLs)
  if (allFoundUrls.length > 0) {
    console.log('\n🔍 DEBUG - ALL URLs FOUND (including non-product):');
    allFoundUrls.slice(0, 20).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.url} [method: ${item.method}]`);
    });
    if (allFoundUrls.length > 20) {
      console.log(`   ... and ${allFoundUrls.length - 20} more`);
    }
  } else {
    console.log('\n⚠️ DEBUG: NO URLs found anywhere on page!');
    console.log('   This might mean:');
    console.log('   1. Links are not yet added to Canva images');
    console.log('   2. Links are in a format we don\'t detect');
    console.log('   3. Page hasn\'t fully loaded');
  }
  
  console.log('\n🎯 RESULTS:');
  results.forEach((item, i) => {
    console.log(`   ${i + 1}. [${item.confidence}] ${item.url}`);
    console.log(`      └─ Source: ${item.source}`);
  });
  
  return results;
}

// Test scan immediately when script loads
setTimeout(() => {
  console.log('\n⏰ Running initial scan after 2 second delay...');
  const immediateResults = scanPageForLinks();
  console.log(`\n🎉 Initial scan complete: ${immediateResults.length} product links found!`);
}, 2000);

// Only set up listener if not already loaded
if (!window.__canvaScannerListenerSet) {
  window.__canvaScannerListenerSet = true;
  
  // Listen for scan requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received from popup:', request);
    
    if (request.action === 'scanPage') {
      console.log('🚀 Executing manual scan from popup...');
      const results = scanPageForLinks();
      console.log('📦 Sending results to popup:', results);
      sendResponse({ success: true, images: results });
    }
    
    return true;
  });
  
  console.log('✅ Content script fully loaded and ready!');
}