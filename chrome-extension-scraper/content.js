// Design Ready Product Scraper - Content Script
// Version 3.0 - Click to Select feature
// This script runs in the context of web pages

console.log('🛒 Design Ready Scraper loaded on:', window.location.hostname);

// State for Click to Select mode
let clickToSelectActive = false;
let highlightOverlay = null;
let dropdownMenu = null;
let lastHoveredElement = null;

// If we're on the Design Ready app, save the current project URL
if (window.location.hostname.includes('emergentagent.com') || 
    window.location.hostname.includes('localhost')) {
  if (window.location.pathname.includes('/project/')) {
    chrome.storage.local.set({ 
      lastProjectUrl: window.location.href,
      lastProjectTime: Date.now()
    });
    console.log('📍 Saved project URL:', window.location.href);
  }
}

// Create highlight overlay element
function createHighlightOverlay() {
  if (highlightOverlay) return highlightOverlay;
  
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'dr-scraper-highlight';
  highlightOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 3px solid #4ade80;
    background: rgba(74, 222, 128, 0.15);
    z-index: 2147483646;
    transition: all 0.1s ease;
    border-radius: 4px;
    display: none;
  `;
  document.body.appendChild(highlightOverlay);
  return highlightOverlay;
}

// Create dropdown menu for field selection
function createDropdownMenu() {
  if (dropdownMenu) return dropdownMenu;
  
  dropdownMenu = document.createElement('div');
  dropdownMenu.id = 'dr-scraper-dropdown';
  dropdownMenu.style.cssText = `
    position: fixed;
    background: #1a1a2e;
    border: 1px solid #4ade80;
    border-radius: 8px;
    padding: 8px 0;
    z-index: 2147483647;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    display: none;
    min-width: 180px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  const fields = [
    { id: 'name', label: '📝 Product Title', icon: '📝' },
    { id: 'price', label: '💰 Price', icon: '💰' },
    { id: 'sku', label: '🏷️ SKU', icon: '🏷️' },
    { id: 'size', label: '📏 Dimensions', icon: '📏' },
    { id: 'finish_color', label: '🎨 Finish/Color', icon: '🎨' },
    { id: 'finish_image', label: '🖼️ Finish Image', icon: '🖼️' },
    { id: 'image_url', label: '📷 Main Image', icon: '📷' },
    { id: 'msrp', label: '💵 MSRP', icon: '💵' },
  ];
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 8px 12px;
    color: #4ade80;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #333;
    margin-bottom: 4px;
  `;
  header.textContent = '➕ Add as...';
  dropdownMenu.appendChild(header);
  
  fields.forEach(field => {
    const item = document.createElement('div');
    item.className = 'dr-dropdown-item';
    item.dataset.field = field.id;
    item.style.cssText = `
      padding: 10px 12px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    item.innerHTML = `<span>${field.icon}</span><span>${field.label.split(' ').slice(1).join(' ')}</span>`;
    
    item.addEventListener('mouseenter', () => {
      item.style.background = '#333';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleFieldSelection(field.id);
    });
    
    dropdownMenu.appendChild(item);
  });
  
  // Cancel button
  const cancelBtn = document.createElement('div');
  cancelBtn.style.cssText = `
    padding: 10px 12px;
    color: #f87171;
    font-size: 12px;
    cursor: pointer;
    text-align: center;
    border-top: 1px solid #333;
    margin-top: 4px;
  `;
  cancelBtn.textContent = '✕ Cancel';
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideDropdown();
  });
  dropdownMenu.appendChild(cancelBtn);
  
  document.body.appendChild(dropdownMenu);
  return dropdownMenu;
}

// Show dropdown at position
function showDropdown(x, y) {
  const menu = createDropdownMenu();
  
  // Adjust position to stay within viewport
  const menuWidth = 180;
  const menuHeight = 350;
  
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10;
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10;
  }
  
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.style.display = 'block';
}

// Hide dropdown
function hideDropdown() {
  if (dropdownMenu) {
    dropdownMenu.style.display = 'none';
  }
}

// Handle field selection from dropdown
function handleFieldSelection(fieldId) {
  if (!lastHoveredElement) return;
  
  let value = '';
  
  // Check if it's an image
  if (lastHoveredElement.tagName === 'IMG') {
    value = lastHoveredElement.src;
  } else {
    // Get text content
    value = lastHoveredElement.innerText?.trim() || lastHoveredElement.textContent?.trim() || '';
    
    // If field is price or msrp, try to extract number
    if (fieldId === 'price' || fieldId === 'msrp') {
      const priceMatch = value.match(/\$?([\d,]+\.?\d*)/);
      if (priceMatch) {
        value = priceMatch[1].replace(/,/g, '');
      }
    }
  }
  
  console.log(`📋 Selected ${fieldId}:`, value);
  
  // Send to popup
  chrome.runtime.sendMessage({
    action: 'fieldSelected',
    field: fieldId,
    value: value
  });
  
  hideDropdown();
  
  // Show brief confirmation
  showConfirmation(fieldId, value);
}

// Show confirmation toast
function showConfirmation(field, value) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #166534;
    color: #4ade80;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
  toast.innerHTML = `✅ <strong>${field}</strong> updated: ${displayValue}`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Handle mouse move for highlighting
function handleMouseMove(e) {
  if (!clickToSelectActive) return;
  
  const target = e.target;
  
  // Ignore our own elements
  if (target.id?.startsWith('dr-scraper') || target.closest('#dr-scraper-dropdown')) {
    return;
  }
  
  lastHoveredElement = target;
  
  const overlay = createHighlightOverlay();
  const rect = target.getBoundingClientRect();
  
  overlay.style.left = rect.left + 'px';
  overlay.style.top = rect.top + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';
  overlay.style.display = 'block';
}

// Handle click for selection
function handleClick(e) {
  if (!clickToSelectActive) return;
  
  const target = e.target;
  
  // Ignore our own elements
  if (target.id?.startsWith('dr-scraper') || target.closest('#dr-scraper-dropdown')) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  lastHoveredElement = target;
  showDropdown(e.clientX + 10, e.clientY + 10);
}

// Activate Click to Select mode
function activateClickToSelect() {
  clickToSelectActive = true;
  createHighlightOverlay();
  createDropdownMenu();
  
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  
  // Change cursor
  document.body.style.cursor = 'crosshair';
  
  // Show activation toast
  const toast = document.createElement('div');
  toast.id = 'dr-scraper-mode-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    color: #000;
    padding: 12px 24px;
    border-radius: 25px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 2147483647;
    box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);
  `;
  toast.textContent = '🎯 Click to Select Mode Active - Click any element';
  document.body.appendChild(toast);
  
  console.log('🎯 Click to Select mode activated');
}

// Deactivate Click to Select mode
function deactivateClickToSelect() {
  clickToSelectActive = false;
  
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  
  // Reset cursor
  document.body.style.cursor = '';
  
  // Hide overlay
  if (highlightOverlay) {
    highlightOverlay.style.display = 'none';
  }
  
  // Hide dropdown
  hideDropdown();
  
  // Remove mode toast
  const toast = document.getElementById('dr-scraper-mode-toast');
  if (toast) toast.remove();
  
  console.log('🎯 Click to Select mode deactivated');
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLastProject') {
    chrome.storage.local.get(['lastProjectUrl', 'lastProjectTime'], (data) => {
      sendResponse(data);
    });
    return true;
  }
  
  if (request.action === 'activateClickToSelect') {
    activateClickToSelect();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'deactivateClickToSelect') {
    deactivateClickToSelect();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'scrape') {
    try {
      const data = scrapeCurrentPage();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

// Escape key to exit Click to Select mode
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && clickToSelectActive) {
    deactivateClickToSelect();
    chrome.runtime.sendMessage({ action: 'clickToSelectDeactivated' });
  }
});

function scrapeCurrentPage() {
  return {
    url: window.location.href,
    title: document.title,
    vendor: detectVendor()
  };
}

function detectVendor() {
  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const vendorMap = {
    'uttermost': 'Uttermost',
    'visualcomfort': 'Visual Comfort',
    'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt',
    'jaipurliving': 'Jaipur Living',
    'loloirugs': 'Loloi'
  };
  
  for (const [key, val] of Object.entries(vendorMap)) {
    if (domain.includes(key)) return val;
  }
  return domain.split('.')[0];
}
