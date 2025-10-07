// Content script for Canva page scanning
console.log('🎨 Canva Scanner Content Script LOADED at:', new Date().toLocaleTimeString());
console.log('📍 Current URL:', window.location.href);

// Immediately scan when loaded
function scanPageForLinks() {
  console.log('🔍 Starting REAL scan - ALL EXTERNAL LINKS...');
  const results = [];
  
  // Get ALL text from page
  const pageText = document.body.innerText || document.body.textContent || '';
  console.log('📄 Page text length:', pageText.length);
  
  // Scan for ANY http/https URLs (not limited to specific vendors)
  const urlPattern = /https?:\/\/[^\s<>"'\)]+/gi;
  const foundUrls = pageText.match(urlPattern) || [];
  
  console.log('🔗 Total URLs found in text:', foundUrls.length);
  
  // Filter out Canva's own URLs and common non-product URLs
  const filteredUrls = foundUrls.filter(url => {
    const lowerUrl = url.toLowerCase();
    return !lowerUrl.includes('canva.com') &&
           !lowerUrl.includes('google.com') &&
           !lowerUrl.includes('facebook.com') &&
           !lowerUrl.includes('instagram.com') &&
           !lowerUrl.includes('youtube.com') &&
           !lowerUrl.includes('twitter.com') &&
           !lowerUrl.includes('linkedin.com') &&
           !lowerUrl.includes('.js') &&
           !lowerUrl.includes('.css') &&
           !lowerUrl.includes('.png') &&
           !lowerUrl.includes('.jpg') &&
           !lowerUrl.includes('.gif');
  });
  
  console.log('✅ Filtered product URLs:', filteredUrls.length);
  filteredUrls.forEach(url => {
    console.log('  → ', url);
    results.push({ url: url, source: 'text' });
  });
  
  // Scan all <a> tags
  const allLinks = document.querySelectorAll('a[href]');
  console.log('🔗 Total <a> tags on page:', allLinks.length);
  
  let productLinkCount = 0;
  allLinks.forEach(link => {
    const href = link.href;
    if (href && 
        !href.includes('canva.com') && 
        !href.includes('javascript:') &&
        !href.startsWith('#') &&
        !href.includes('google.com') &&
        !href.includes('facebook.com')) {
      results.push({ url: href, source: 'link' });
      productLinkCount++;
      console.log('✅ External link found:', href);
    }
  });
  console.log('🎯 External links in <a> tags:', productLinkCount);
  
  // Remove duplicates
  const uniqueUrls = [...new Set(results.map(r => r.url))];
  console.log('📊 TOTAL UNIQUE EXTERNAL URLS:', uniqueUrls.length);
  uniqueUrls.forEach((url, i) => console.log(`  ${i+1}. ${url}`));
  
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