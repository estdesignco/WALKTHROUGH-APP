// HOUZZ PRO CLIPPER INTERCEPTOR
// This script intercepts Houzz Pro clipper data and "drops it off" at our database

// Your webhook URL (replace with your actual domain)
const WEBHOOK_URL = 'https://designflow-master.preview.emergentagent.com/api/furniture/houzz-webhook';

// Function to intercept and forward Houzz clipper data
function interceptHouzzClipperData() {
    console.log('🏠 Houzz Pro Clipper Interceptor Active');
    
    // Method 1: Intercept XMLHttpRequest (common for extensions)
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
        // Check if this is a Houzz Pro clipper request
        if (this._url && this._url.includes('houzz.com') && data) {
            try {
                console.log('🎯 Intercepted Houzz Pro Request:', this._url);
                console.log('📦 Data:', data);
                
                // Parse the data if it's JSON
                let clippedData = data;
                if (typeof data === 'string') {
                    try {
                        clippedData = JSON.parse(data);
                    } catch (e) {
                        // If not JSON, create structured data from current page
                        clippedData = extractProductDataFromPage();
                    }
                }
                
                // Forward to our webhook
                forwardToWebhook(clippedData);
                
            } catch (error) {
                console.error('❌ Error intercepting Houzz data:', error);
            }
        }
        
        // Continue with original request
        originalXHRSend.call(this, data);
    };
    
    // Method 2: Intercept fetch API
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url && url.includes('houzz.com') && options && options.body) {
            try {
                console.log('🎯 Intercepted Houzz Fetch:', url);
                console.log('📦 Body:', options.body);
                
                let clippedData = options.body;
                if (typeof options.body === 'string') {
                    try {
                        clippedData = JSON.parse(options.body);
                    } catch (e) {
                        clippedData = extractProductDataFromPage();
                    }
                }
                
                forwardToWebhook(clippedData);
                
            } catch (error) {
                console.error('❌ Error intercepting Houzz fetch:', error);
            }
        }
        
        return originalFetch.apply(this, args);
    };
}

// Extract product data from current page (fallback method)
function extractProductDataFromPage() {
    console.log('📄 Extracting product data from current page...');
    
    // Common selectors for product data
    const productData = {
        productTitle: getTextContent([
            'h1[data-testid="product-title"]',
            'h1.product-title',
            'h1.pdp-product-name',
            '.product-name h1',
            'h1:first-of-type'
        ]),
        
        vendor: getTextContent([
            '[data-testid="brand-name"]',
            '.brand-name',
            '.vendor-name',
            '.manufacturer-name'
        ]) || extractVendorFromURL(),
        
        cost: extractPrice([
            '[data-testid="price"]',
            '.price',
            '.product-price',
            '.pdp-price',
            '.current-price'
        ]),
        
        sku: getTextContent([
            '[data-testid="sku"]',
            '.sku',
            '.product-sku',
            '.item-number',
            '.model-number'
        ]),
        
        category: getTextContent([
            '[data-testid="category"]',
            '.breadcrumb a:last-child',
            '.category-name',
            '.product-category'
        ]),
        
        dimensions: getTextContent([
            '[data-testid="dimensions"]',
            '.dimensions',
            '.product-dimensions',
            '.size-info'
        ]),
        
        description: getTextContent([
            '[data-testid="description"]',
            '.product-description',
            '.pdp-description',
            '.description-text'
        ]),
        
        images: extractImages(),
        
        productUrl: window.location.href,
        
        finishColor: getTextContent([
            '[data-testid="finish"]',
            '.finish',
            '.color-name',
            '.selected-color'
        ]),
        
        materials: getTextContent([
            '[data-testid="materials"]',
            '.materials',
            '.product-materials',
            '.material-info'
        ])
    };
    
    console.log('✅ Extracted product data:', productData);
    return productData;
}

// Helper function to get text content from multiple selectors
function getTextContent(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            return element.textContent.trim();
        }
    }
    return null;
}

// Helper function to extract price
function extractPrice(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            const priceText = element.textContent.trim();
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
                return parseFloat(priceMatch[0].replace(',', ''));
            }
        }
    }
    return null;
}

// Helper function to extract vendor from URL
function extractVendorFromURL() {
    const url = window.location.href.toLowerCase();
    
    // Your actual trade vendors
    const vendors = {
        'fourhands.com': 'Four Hands',
        'reginaandrew.com': 'Regina Andrew',
        'globalviews.com': 'Global Views',
        'rowefurniture.com': 'Rowe Furniture',
        'bernhardt.com': 'Bernhardt',
        'visualcomfort.com': 'Visual Comfort',
        'hudsonvalleylighting.com': 'Hudson Valley Lighting',
        'arteriors.com': 'Arteriors',
        'uttermost.com': 'Uttermost',
        'curreyco.com': 'Currey & Company',
        'gabbyhome.com': 'Gabby Home',
        'worldsaway.com': 'Worlds Away',
        'surya.com': 'Surya'
    };
    
    for (const [domain, vendor] of Object.entries(vendors)) {
        if (url.includes(domain)) {
            return vendor;
        }
    }
    
    // Fallback to hostname
    const hostname = new URL(window.location.href).hostname;
    return hostname.replace('www.', '').replace('.com', '');
}

// Helper function to extract images
function extractImages() {
    const images = [];
    
    // Common image selectors
    const imageSelectors = [
        '.product-image img',
        '.hero-image img',
        '.main-image img',
        '[data-testid="product-image"] img',
        '.gallery img'
    ];
    
    imageSelectors.forEach(selector => {
        const imgs = document.querySelectorAll(selector);
        imgs.forEach(img => {
            if (img.src && !images.includes(img.src)) {
                images.push(img.src);
            }
        });
    });
    
    return images;
}

// Forward data to our webhook
async function forwardToWebhook(data) {
    try {
        console.log('📡 Forwarding to webhook:', WEBHOOK_URL);
        console.log('📦 Data being sent:', data);
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Successfully forwarded to webhook:', result);
            
            // Show success notification
            showNotification('✅ Product clipped to Houzz Pro AND saved to your furniture search database!');
        } else {
            console.error('❌ Webhook forward failed:', response.status, response.statusText);
        }
        
    } catch (error) {
        console.error('❌ Error forwarding to webhook:', error);
    }
}

// Show notification to user
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #059669, #10B981);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: bold;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 5000);
}

// Manual trigger function for testing
window.testFurnitureClip = function() {
    console.log('🧪 Manual test triggered');
    const testData = extractProductDataFromPage();
    forwardToWebhook(testData);
};

// Auto-initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptHouzzClipperData);
} else {
    interceptHouzzClipperData();
}

console.log('🚀 Houzz Pro Clipper Interceptor Loaded!');
console.log('💡 To manually test, run: testFurnitureClip()');