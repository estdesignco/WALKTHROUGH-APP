// Content script that runs on Canva pages
console.log('🎨 Canva Scanner content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanPage') {
    console.log('📸 Scanning page for images with links...');
    
    const imagesWithLinks = [];
    
    // Method 1: Find all images with data attributes or link wrappers
    const allImages = document.querySelectorAll('img');
    console.log(`Found ${allImages.length} total images`);
    
    allImages.forEach((img) => {
      // Check if image has a link in parent or nearby elements
      let linkElement = img.closest('a');
      
      if (!linkElement) {
        // Check siblings
        const parent = img.parentElement;
        if (parent) {
          linkElement = parent.querySelector('a');
        }
      }
      
      if (linkElement && linkElement.href) {
        const url = linkElement.href;
        // Only include product URLs (not Canva internal links)
        if (!url.includes('canva.com') && (
          url.includes('houzz.com') || 
          url.includes('westelm.com') || 
          url.includes('cb2.com') ||
          url.includes('potterybarn.com') ||
          url.includes('crateandbarrel.com') ||
          url.includes('wayfair.com') ||
          url.includes('anthropologie.com') ||
          url.includes('restorationhardware.com')
        )) {
          imagesWithLinks.push({
            src: img.src,
            url: url
          });
          console.log('✅ Found image with product link:', url);
        }
      }
    });

    // Method 2: Check for Canva's data structures
    // Canva stores design data in JSON, let's try to find it
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || script.innerText;
      if (content && content.includes('http') && content.includes('.com')) {
        // Try to extract URLs from JSON-like content
        const urlMatches = content.match(/https?:\/\/(?:www\.)?(?:houzz|westelm|cb2|potterybarn|crateandbarrel|wayfair|anthropologie|restorationhardware)\.com[^\s"'>}]+/g);
        if (urlMatches) {
          urlMatches.forEach(url => {
            // Avoid duplicates
            if (!imagesWithLinks.find(item => item.url === url)) {
              imagesWithLinks.push({
                src: null,
                url: url
              });
              console.log('✅ Found product link in page data:', url);
            }
          });
        }
      }
    });

    console.log(`🎯 Total images with product links found: ${imagesWithLinks.length}`);
    
    sendResponse({
      success: true,
      images: imagesWithLinks
    });
  }
  
  return true; // Keep message channel open for async response
});