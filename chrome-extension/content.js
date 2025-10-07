// Content script that runs on Canva pages
console.log('🎨 Canva Scanner content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanPage') {
    console.log('📸 REAL SCAN - Analyzing actual Canva page...');
    
    const imagesWithLinks = [];
    
    // REAL METHOD: Scan ALL clickable elements on the page
    console.log('Scanning all clickable elements...');
    const allLinks = document.querySelectorAll('a[href]');
    console.log(`Found ${allLinks.length} total links on page`);
    
    allLinks.forEach((link) => {
      const url = link.href;
      
      // Check if it's a product URL
      if (url && !url.includes('canva.com') && (
        url.includes('houzz.com') || 
        url.includes('westelm.com') || 
        url.includes('cb2.com') ||
        url.includes('potterybarn.com') ||
        url.includes('crateandbarrel.com') ||
        url.includes('wayfair.com') ||
        url.includes('anthropologie.com') ||
        url.includes('restorationhardware.com') ||
        url.includes('roomandboard.com') ||
        url.includes('article.com') ||
        url.includes('allmodern.com')
      )) {
        // Check if this link contains an image
        const img = link.querySelector('img');
        
        imagesWithLinks.push({
          src: img ? img.src : null,
          url: url,
          text: link.textContent?.trim() || ''
        });
        console.log('✅ Found product link:', url);
      }
    });

    // ALSO scan for links in text elements (in case links are just text)
    console.log('Scanning text content for URLs...');
    const allText = document.body.innerText;
    const urlRegex = /https?:\/\/(?:www\.)?(?:houzz|westelm|cb2|potterybarn|crateandbarrel|wayfair|anthropologie|restorationhardware|roomandboard|article|allmodern)\.com[^\s<>"'\)]+/g;
    const textUrls = allText.match(urlRegex);
    
    if (textUrls) {
      textUrls.forEach(url => {
        // Avoid duplicates
        if (!imagesWithLinks.find(item => item.url === url)) {
          imagesWithLinks.push({
            src: null,
            url: url,
            text: 'From text'
          });
          console.log('✅ Found product link in text:', url);
        }
      });
    }

    console.log(`🎯 TOTAL PRODUCT LINKS FOUND: ${imagesWithLinks.length}`);
    
    if (imagesWithLinks.length === 0) {
      console.warn('⚠️ NO PRODUCT LINKS FOUND. Make sure:');
      console.warn('1. You have product URLs on this Canva page');
      console.warn('2. URLs are from supported vendors (Houzz, West Elm, etc.)');
      console.warn('3. Images are linked (right-click image → Link)');
    }
    
    sendResponse({
      success: true,
      images: imagesWithLinks
    });
  }
  
  return true; // Keep message channel open for async response
});