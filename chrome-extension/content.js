// Content script for Canva page scanning
console.log('🎨 Canva Scanner Content Script LOADED at:', new Date().toLocaleTimeString());
console.log('📍 Current URL:', window.location.href);

// Immediately scan when loaded
function scanPageForLinks() {
  console.log('🔍 Starting REAL scan of page...');
  const results = [];
  
  // Get ALL text from page
  const pageText = document.body.innerText || document.body.textContent || '';
  console.log('📄 Page text length:', pageText.length);
  
  // Scan for product URLs in text
  const urlPattern = /https?:\/\/(www\.)?(houzz|westelm|cb2|potterybarn|crateandbarrel|wayfair|anthropologie|restorationhardware|roomandboard|article|allmodern)\.com[^\s<>"'\)]+/gi;
  const foundUrls = pageText.match(urlPattern) || [];
  
  console.log('✅ Found URLs in text:', foundUrls.length);
  foundUrls.forEach(url => console.log('  → ', url));
  
  foundUrls.forEach(url => {
    results.push({ url: url, source: 'text' });
  });
  
  // Scan all <a> tags
  const allLinks = document.querySelectorAll('a[href]');
  console.log('🔗 Total <a> tags on page:', allLinks.length);
  
  let productLinkCount = 0;
  allLinks.forEach(link => {
    const href = link.href;
    if (href && urlPattern.test(href)) {
      results.push({ url: href, source: 'link' });
      productLinkCount++;
      console.log('✅ Product link found:', href);
    }
  });
  console.log('🎯 Product links in <a> tags:', productLinkCount);
  
  // Remove duplicates
  const uniqueUrls = [...new Set(results.map(r => r.url))];
  console.log('📊 TOTAL UNIQUE PRODUCT URLS:', uniqueUrls.length);
  
  return uniqueUrls.map(url => ({ url }));
}

// Test scan immediately
const immediateResults = scanPageForLinks();
console.log('🎉 Immediate scan results:', immediateResults);

// Listen for scan requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request);
  
  if (request.action === 'scanPage') {
    console.log('🚀 Executing scan...');
    const results = scanPageForLinks();
    console.log('📦 Sending results:', results);
    sendResponse({ success: true, images: results });
  }
  
  return true;
});

console.log('✅ Content script ready and waiting for messages');