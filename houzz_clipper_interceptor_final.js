// HOUZZ PRO CLIPPER INTERCEPTOR - FINAL VERSION
// This intercepts your ACTUAL Houzz Pro clipper data and "drops it off" in our database

console.log('🏠 Loading Houzz Pro Clipper Interceptor...');

// Your unified furniture search webhook URL
const WEBHOOK_URL = 'https://designhub-74.preview.emergentagent.com/api/furniture/houzz-webhook';

// Function to intercept Houzz Pro clipper form submissions
function interceptHouzzClipperSubmissions() {
    console.log('🎯 Houzz Pro Clipper Interceptor Active!');
    
    // Method 1: Intercept form submissions to Houzz Pro
    const originalFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
        try {
            // Check if this is a Houzz Pro clipper form
            if (this.action && this.action.includes('houzz.com') || 
                this.querySelector('[value*="Save to Houzz"]') ||
                this.querySelector('button:contains("Save to Houzz Pro")')) {
                
                console.log('🏠 Intercepted Houzz Pro Clipper Form Submission!');
                
                // Extract form data
                const formData = extractClipperFormData(this);
                
                if (formData) {
                    // Send to our webhook FIRST, then continue to Houzz Pro
                    sendToWebhook(formData).then(() => {
                        console.log('✅ Data sent to unified database');
                    }).catch(err => {
                        console.error('❌ Webhook error:', err);
                    });
                }
            }
        } catch (error) {
            console.error('Error intercepting form:', error);
        }
        
        // Continue with normal Houzz Pro submission
        originalFormSubmit.call(this);
    };
    
    // Method 2: Intercept button clicks on "Save to Houzz Pro" button
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Check if clicked button is "Save to Houzz Pro"
        if (target.textContent && 
            (target.textContent.includes('Save to Houzz Pro') || 
             target.textContent.includes('Save to Houzz'))) {
            
            console.log('🏠 Houzz Pro Save Button Clicked!');
            
            // Wait a moment for form to be populated, then extract data
            setTimeout(() => {
                const form = target.closest('form') || document.querySelector('form');
                if (form) {
                    const formData = extractClipperFormData(form);
                    if (formData) {
                        sendToWebhook(formData).then(() => {
                            showSuccessNotification('✅ Product clipped to Houzz Pro AND saved to unified catalog!');
                        });
                    }
                }
            }, 500);
        }
    }, true);
    
    // Method 3: Watch for Houzz Pro extension iframe/popup
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Look for Houzz Pro clipper popup/iframe
                    if (node.querySelector && 
                        (node.querySelector('[src*="houzz.com"]') || 
                         node.querySelector('*[class*="houzz"]') ||
                         node.textContent.includes('Save to Houzz Pro'))) {
                        
                        console.log('🏠 Houzz Pro Clipper UI Detected!');
                        
                        // Set up form monitoring for this new element
                        setupFormMonitoring(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Extract data from Houzz Pro clipper form
function extractClipperFormData(form) {
    try {
        console.log('📋 Extracting clipper form data...');
        
        // Get all form elements
        const formElements = form.querySelectorAll('input, select, textarea');
        const data = {};
        
        // Map form fields to our webhook format
        formElements.forEach(element => {
            const name = element.name || element.id || '';
            const value = element.value || '';
            
            if (value && name) {
                // Map Houzz Pro fields to our webhook fields
                if (name.toLowerCase().includes('title') || name.toLowerCase().includes('product')) {
                    data.productTitle = value;
                } else if (name.toLowerCase().includes('cost') || name.toLowerCase().includes('price')) {
                    data.cost = parseFloat(value) || 0;
                } else if (name.toLowerCase().includes('sku')) {
                    data.sku = value;
                } else if (name.toLowerCase().includes('vendor') || name.toLowerCase().includes('manufacturer')) {
                    data.vendor = value;
                } else if (name.toLowerCase().includes('category')) {
                    data.category = value;
                } else if (name.toLowerCase().includes('dimension')) {
                    data.dimensions = value;
                } else if (name.toLowerCase().includes('finish') || name.toLowerCase().includes('color')) {
                    data.finishColor = value;
                } else if (name.toLowerCase().includes('material')) {
                    data.materials = value;
                } else if (name.toLowerCase().includes('description')) {
                    data.description = value;
                } else if (name.toLowerCase().includes('note')) {
                    data.internalNotes = value;
                } else if (name.toLowerCase().includes('tag')) {
                    data.tags = value;
                } else if (name.toLowerCase().includes('msrp')) {
                    data.msrp = parseFloat(value) || 0;
                }
            }
        });
        
        // Try to get product images
        const images = [];
        const imgElements = form.querySelectorAll('img') || document.querySelectorAll('img[src*="product"], img[alt*="product"]');
        imgElements.forEach(img => {
            if (img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
                images.push(img.src);
            }
        });
        
        if (images.length > 0) {
            data.images = images.slice(0, 5); // Limit to 5 images as per Houzz Pro
        }
        
        // Get current page URL as product URL
        data.productUrl = window.location.href;
        
        // Add timestamp
        data.clipperTimestamp = new Date().toISOString();
        
        console.log('📦 Extracted data:', data);
        
        // Only return data if we have essential fields
        if (data.productTitle || data.cost || data.sku) {
            return data;
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error extracting form data:', error);
        return null;
    }
}

// Send data to our webhook
async function sendToWebhook(data) {
    try {
        console.log('📡 Sending to unified database...');
        console.log('🔗 Webhook URL:', WEBHOOK_URL);
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Webhook success:', result.message);
            console.log('📦 Item ID:', result.item_id);
            return result;
        } else {
            console.error('❌ Webhook failed:', response.status);
            throw new Error(`Webhook failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error sending to webhook:', error);
        throw error;
    }
}

// Set up form monitoring for dynamically added content
function setupFormMonitoring(container) {
    const forms = container.querySelectorAll('form');
    forms.forEach(form => {
        // Monitor form for submit events
        form.addEventListener('submit', function(e) {
            console.log('🏠 Form submit detected');
            const data = extractClipperFormData(this);
            if (data) {
                sendToWebhook(data);
            }
        });
        
        // Monitor save buttons
        const saveButtons = form.querySelectorAll('button, input[type="submit"]');
        saveButtons.forEach(button => {
            if (button.textContent && button.textContent.includes('Save')) {
                button.addEventListener('click', function() {
                    setTimeout(() => {
                        const data = extractClipperFormData(form);
                        if (data) {
                            sendToWebhook(data);
                        }
                    }, 1000);
                });
            }
        });
    });
}

// Show success notification
function showSuccessNotification(message) {
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #059669, #10B981);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: bold;
        font-size: 14px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        border: 2px solid #34D399;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">🎉</div>
            <div>${message}</div>
        </div>
    `;
    
    // Add animation style
    if (!document.getElementById('houzz-interceptor-styles')) {
        const style = document.createElement('style');
        style.id = 'houzz-interceptor-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Manual test function
window.testHouzzInterceptor = function() {
    console.log('🧪 Manual test triggered');
    
    const testData = {
        productTitle: 'Manual Test Product',
        vendor: 'Four Hands',
        cost: 599.99,
        sku: 'TEST-MANUAL-001',
        category: 'Seating',
        dimensions: '24"W x 26"D x 32"H',
        productUrl: window.location.href,
        clipperTimestamp: new Date().toISOString()
    };
    
    sendToWebhook(testData).then(() => {
        showSuccessNotification('🧪 Manual test successful! Product sent to unified catalog.');
    }).catch(err => {
        alert('❌ Manual test failed: ' + err.message);
    });
};

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptHouzzClipperSubmissions);
} else {
    interceptHouzzClipperSubmissions();
}

console.log('🎉 Houzz Pro Clipper Interceptor Loaded Successfully!');
console.log('💡 To manually test, run: testHouzzInterceptor()');
console.log('🏠 Your Houzz Pro clipper will now save to BOTH Houzz Pro AND your unified catalog!');