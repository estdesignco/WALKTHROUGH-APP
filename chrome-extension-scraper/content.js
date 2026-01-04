// Design Ready Product Scraper - Content Script
// Version 4.0 - Full Page-Injected UI with Click to Select
// UI stays open on page, doesn't close like popup

console.log('🛒 Design Ready Scraper loaded on:', window.location.hostname);

// State
let scrapedData = null;
let clickToSelectActive = false;
let selectedElements = {}; // Track which elements are selected for which fields
let sidePanel = null;
let highlightOverlay = null;
let fieldDropdown = null;
let lastClickedElement = null;

// ============================================================================
// SIDE PANEL UI - Injected into the page
// ============================================================================

function createSidePanel() {
  if (sidePanel) return sidePanel;
  
  sidePanel = document.createElement('div');
  sidePanel.id = 'dr-scraper-panel';
  sidePanel.innerHTML = `
    <style>
      #dr-scraper-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 380px;
        max-height: 90vh;
        background: #0f0f1a;
        border: 1px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        z-index: 2147483640;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow: hidden;
        display: none;
      }
      #dr-scraper-panel * {
        box-sizing: border-box;
      }
      #dr-scraper-panel .dr-header {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 12px 16px;
        border-bottom: 1px solid #333;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
      }
      #dr-scraper-panel .dr-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #dr-scraper-panel .dr-logo {
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      #dr-scraper-panel .dr-title {
        font-size: 14px;
        font-weight: 600;
      }
      #dr-scraper-panel .dr-close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }
      #dr-scraper-panel .dr-close-btn:hover {
        background: #333;
        color: #fff;
      }
      #dr-scraper-panel .dr-content {
        padding: 16px;
        max-height: calc(90vh - 200px);
        overflow-y: auto;
      }
      #dr-scraper-panel .dr-field {
        margin-bottom: 12px;
        background: #16162a;
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;
      }
      #dr-scraper-panel .dr-field:hover {
        border-color: #4ade80;
      }
      #dr-scraper-panel .dr-field.selected {
        border-color: #4ade80;
        background: #1a2e1a;
      }
      #dr-scraper-panel .dr-field.selecting {
        border-color: #f59e0b;
        background: #2e2a1a;
        animation: pulse-border 1s ease-in-out infinite;
      }
      @keyframes pulse-border {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
        50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); }
      }
      #dr-scraper-panel .dr-field-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #666;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #dr-scraper-panel .dr-field-value {
        font-size: 13px;
        color: #fff;
        word-break: break-word;
      }
      #dr-scraper-panel .dr-field-value.missing {
        color: #666;
        font-style: italic;
      }
      #dr-scraper-panel .dr-field-value.has-image {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #dr-scraper-panel .dr-field-value img {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
        border: 1px solid #333;
      }
      #dr-scraper-panel .dr-click-hint {
        font-size: 9px;
        color: #4ade80;
        background: rgba(74, 222, 128, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
      }
      #dr-scraper-panel .dr-actions {
        padding: 16px;
        border-top: 1px solid #333;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #dr-scraper-panel .dr-btn-primary {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: #000;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      #dr-scraper-panel .dr-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
      }
      #dr-scraper-panel .dr-btn-secondary {
        width: 100%;
        padding: 10px;
        background: transparent;
        color: #888;
        border: 1px solid #333;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
      }
      #dr-scraper-panel .dr-btn-secondary:hover {
        background: #222;
        color: #fff;
      }
      #dr-scraper-panel .dr-mode-banner {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #000;
        padding: 10px 16px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        display: none;
      }
      #dr-scraper-panel .dr-mode-banner.active {
        display: block;
      }
      
      /* Highlight for selected elements on page */
      .dr-element-highlight {
        outline: 3px solid #4ade80 !important;
        outline-offset: 2px !important;
        background: rgba(74, 222, 128, 0.1) !important;
      }
      
      /* Hover highlight */
      #dr-hover-highlight {
        position: fixed;
        pointer-events: none;
        border: 3px solid #f59e0b;
        background: rgba(245, 158, 11, 0.15);
        z-index: 2147483645;
        border-radius: 4px;
        display: none;
      }
      
      /* Field dropdown on page */
      #dr-field-dropdown {
        position: fixed;
        background: #1a1a2e;
        border: 2px solid #4ade80;
        border-radius: 8px;
        padding: 8px 0;
        z-index: 2147483647;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        min-width: 200px;
        display: none;
      }
      #dr-field-dropdown .dr-dropdown-header {
        padding: 8px 12px;
        color: #4ade80;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        border-bottom: 1px solid #333;
        margin-bottom: 4px;
      }
      #dr-field-dropdown .dr-dropdown-item {
        padding: 10px 12px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #dr-field-dropdown .dr-dropdown-item:hover {
        background: #333;
      }
      #dr-field-dropdown .dr-dropdown-cancel {
        padding: 10px 12px;
        color: #f87171;
        font-size: 12px;
        cursor: pointer;
        text-align: center;
        border-top: 1px solid #333;
        margin-top: 4px;
      }
    </style>
    
    <div class="dr-header">
      <div class="dr-header-left">
        <div class="dr-logo">🛒</div>
        <div class="dr-title">Design Ready Scraper</div>
      </div>
      <button class="dr-close-btn" id="dr-close-btn">×</button>
    </div>
    
    <div class="dr-mode-banner" id="dr-mode-banner">
      🎯 CLICK TO SELECT MODE - Click any element on the page
    </div>
    
    <div class="dr-content" id="dr-content">
      <div class="dr-field" data-field="name">
        <div class="dr-field-label">
          <span>📝 Product Title</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-name">Not found</div>
      </div>
      
      <div class="dr-field" data-field="price">
        <div class="dr-field-label">
          <span>💰 Price</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-price">Not found</div>
      </div>
      
      <div class="dr-field" data-field="sku">
        <div class="dr-field-label">
          <span>🏷️ SKU</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-sku">Not found</div>
      </div>
      
      <div class="dr-field" data-field="size">
        <div class="dr-field-label">
          <span>📏 Dimensions</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-size">Not found</div>
      </div>
      
      <div class="dr-field" data-field="finish_color">
        <div class="dr-field-label">
          <span>🎨 Finish / Color</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-finish_color">Not found</div>
      </div>
      
      <div class="dr-field" data-field="finish_image">
        <div class="dr-field-label">
          <span>🖼️ Finish Image</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-finish_image">Not found</div>
      </div>
      
      <div class="dr-field" data-field="image_url">
        <div class="dr-field-label">
          <span>📷 Main Image</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-image_url">Not found</div>
      </div>
    </div>
    
    <div class="dr-actions">
      <button class="dr-btn-primary" id="dr-send-btn">
        🚀 SEND TO APP + LIBRARIES
      </button>
      <div style="display: flex; gap: 8px;">
        <button class="dr-btn-secondary" id="dr-copy-image-btn" style="flex: 1; background: #7c3aed; color: white; border-color: #7c3aed;">
          📷 Copy Image
        </button>
        <button class="dr-btn-secondary" id="dr-copy-link-btn" style="flex: 1; background: #2563eb; color: white; border-color: #2563eb;">
          🔗 Copy Link
        </button>
      </div>
      <button class="dr-btn-secondary" id="dr-rescrape-btn" style="width: 100%;">
        🔄 Re-scrape
      </button>
      <div style="font-size: 10px; color: #666; text-align: center; padding-top: 4px;">
        Saves to: Checklist/FFE • Product Library • Materials Library
      </div>
    </div>
  `;
  
  document.body.appendChild(sidePanel);
  
  // Create hover highlight element
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'dr-hover-highlight';
  document.body.appendChild(highlightOverlay);
  
  // Create field dropdown
  createFieldDropdown();
  
  // Event listeners
  document.getElementById('dr-close-btn').addEventListener('click', hidePanel);
  document.getElementById('dr-send-btn').addEventListener('click', sendToAppAndLibraries);
  document.getElementById('dr-copy-image-btn').addEventListener('click', copyImage);
  document.getElementById('dr-copy-link-btn').addEventListener('click', copyLink);
  document.getElementById('dr-rescrape-btn').addEventListener('click', () => {
    scrapeAndShow();
  });
  
  // Field click handlers - click on field in panel to select from page
  document.querySelectorAll('#dr-scraper-panel .dr-field').forEach(field => {
    field.addEventListener('click', () => {
      const fieldId = field.dataset.field;
      startFieldSelection(fieldId);
    });
  });
  
  // Make panel draggable
  makeDraggable(sidePanel);
  
  return sidePanel;
}

function createFieldDropdown() {
  fieldDropdown = document.createElement('div');
  fieldDropdown.id = 'dr-field-dropdown';
  
  const fields = [
    { id: 'name', label: 'Product Title', icon: '📝' },
    { id: 'price', label: 'Price', icon: '💰' },
    { id: 'sku', label: 'SKU', icon: '🏷️' },
    { id: 'size', label: 'Dimensions', icon: '📏' },
    { id: 'finish_color', label: 'Finish / Color', icon: '🎨' },
    { id: 'finish_image', label: 'Finish Image', icon: '🖼️' },
    { id: 'image_url', label: 'Main Image', icon: '📷' },
  ];
  
  let html = '<div class="dr-dropdown-header">➕ Add as...</div>';
  fields.forEach(f => {
    html += `<div class="dr-dropdown-item" data-field="${f.id}">${f.icon} ${f.label}</div>`;
  });
  html += '<div class="dr-dropdown-cancel">✕ Cancel</div>';
  
  fieldDropdown.innerHTML = html;
  document.body.appendChild(fieldDropdown);
  
  // Event listeners for dropdown items
  fieldDropdown.querySelectorAll('.dr-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const fieldId = item.dataset.field;
      assignElementToField(fieldId);
    });
  });
  
  fieldDropdown.querySelector('.dr-dropdown-cancel').addEventListener('click', (e) => {
    e.stopPropagation();
    hideFieldDropdown();
  });
}

function showFieldDropdown(x, y) {
  // Adjust position to stay in viewport
  const dropdownWidth = 200;
  const dropdownHeight = 300;
  
  if (x + dropdownWidth > window.innerWidth) {
    x = window.innerWidth - dropdownWidth - 20;
  }
  if (y + dropdownHeight > window.innerHeight) {
    y = window.innerHeight - dropdownHeight - 20;
  }
  
  fieldDropdown.style.left = x + 'px';
  fieldDropdown.style.top = y + 'px';
  fieldDropdown.style.display = 'block';
}

function hideFieldDropdown() {
  if (fieldDropdown) {
    fieldDropdown.style.display = 'none';
  }
  lastClickedElement = null;
}

// ============================================================================
// CLICK TO SELECT FUNCTIONALITY
// ============================================================================

let activeField = null;

function startFieldSelection(fieldId) {
  // Highlight the field being selected
  document.querySelectorAll('#dr-scraper-panel .dr-field').forEach(f => {
    f.classList.remove('selecting');
  });
  
  const fieldEl = document.querySelector(`#dr-scraper-panel .dr-field[data-field="${fieldId}"]`);
  if (fieldEl) {
    fieldEl.classList.add('selecting');
  }
  
  activeField = fieldId;
  clickToSelectActive = true;
  
  // Show mode banner
  document.getElementById('dr-mode-banner').classList.add('active');
  document.getElementById('dr-mode-banner').textContent = `🎯 Click any element to set as ${getFieldLabel(fieldId)}`;
  
  // Change cursor
  document.body.style.cursor = 'crosshair';
  
  // Add listeners
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handlePageClick, true);
}

function stopFieldSelection() {
  clickToSelectActive = false;
  activeField = null;
  
  // Remove highlighting from field
  document.querySelectorAll('#dr-scraper-panel .dr-field').forEach(f => {
    f.classList.remove('selecting');
  });
  
  // Hide mode banner
  document.getElementById('dr-mode-banner').classList.remove('active');
  
  // Reset cursor
  document.body.style.cursor = '';
  
  // Hide hover highlight
  if (highlightOverlay) {
    highlightOverlay.style.display = 'none';
  }
  
  // Remove listeners
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handlePageClick, true);
  
  hideFieldDropdown();
}

function handleMouseMove(e) {
  if (!clickToSelectActive) return;
  
  const target = e.target;
  
  // Ignore our own elements
  if (target.closest('#dr-scraper-panel') || target.closest('#dr-field-dropdown') || target.closest('#dr-hover-highlight')) {
    highlightOverlay.style.display = 'none';
    return;
  }
  
  const rect = target.getBoundingClientRect();
  highlightOverlay.style.left = rect.left + 'px';
  highlightOverlay.style.top = rect.top + 'px';
  highlightOverlay.style.width = rect.width + 'px';
  highlightOverlay.style.height = rect.height + 'px';
  highlightOverlay.style.display = 'block';
}

function handlePageClick(e) {
  if (!clickToSelectActive) return;
  
  let target = e.target;
  
  // Ignore our own elements
  if (target.closest('#dr-scraper-panel') || target.closest('#dr-field-dropdown') || target.closest('#dr-hover-highlight')) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  // For image fields, always try to find the actual image
  if (activeField === 'image_url' || activeField === 'finish_image') {
    // If not already an image, search for one
    if (target.tagName !== 'IMG') {
      // Try multiple ways to find the image
      let foundImg = null;
      
      // Check if target has background-image
      const bgImg = window.getComputedStyle(target).backgroundImage;
      if (bgImg && bgImg !== 'none') {
        const urlMatch = bgImg.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch) {
          // Create a fake element with the URL for our handler
          foundImg = { tagName: 'IMG', src: urlMatch[1] };
        }
      }
      
      // Direct child img
      if (!foundImg) foundImg = target.querySelector('img');
      
      // Within parent containers
      if (!foundImg) foundImg = target.closest('button')?.querySelector('img');
      if (!foundImg) foundImg = target.closest('a')?.querySelector('img');
      if (!foundImg) foundImg = target.closest('label')?.querySelector('img');
      if (!foundImg) foundImg = target.closest('[class*="swatch"]')?.querySelector('img');
      if (!foundImg) foundImg = target.closest('[class*="color"]')?.querySelector('img');
      if (!foundImg) foundImg = target.closest('[class*="option"]')?.querySelector('img');
      if (!foundImg) foundImg = target.closest('div')?.querySelector('img');
      
      // Check data attributes for image URL
      if (!foundImg) {
        const imgUrl = target.dataset.src || target.dataset.image || target.dataset.img;
        if (imgUrl) {
          foundImg = { tagName: 'IMG', src: imgUrl };
        }
      }
      
      if (foundImg) {
        target = foundImg;
      }
    }
  }
  
  lastClickedElement = target;
  
  if (activeField) {
    // Direct assignment if field was pre-selected
    assignElementToField(activeField);
    stopFieldSelection();
  } else {
    // Show dropdown for field selection
    showFieldDropdown(e.clientX + 10, e.clientY + 10);
  }
}

function assignElementToField(fieldId) {
  if (!lastClickedElement) return;
  
  let value = '';
  
  // Get value based on element type
  if (lastClickedElement.tagName === 'IMG') {
    // Could be real IMG element or our fake object with src
    value = lastClickedElement.src || lastClickedElement.dataset?.src || '';
  } else {
    // For text fields, get text content
    value = lastClickedElement.innerText?.trim() || lastClickedElement.textContent?.trim() || '';
    
    // Clean up price values
    if (fieldId === 'price') {
      const priceMatch = value.match(/\$?([\d,]+\.?\d*)/);
      if (priceMatch) {
        value = priceMatch[1].replace(/,/g, '');
      }
    }
  }
  
  // If we're setting an image field but got text, it's wrong - don't update
  if ((fieldId === 'image_url' || fieldId === 'finish_image') && value && !value.startsWith('http')) {
    showToast('⚠️ Click directly on the image');
    return;
  }
  
  // Update scraped data
  if (scrapedData) {
    scrapedData[fieldId] = value;
  }
  
  // Update display
  updateFieldDisplay(fieldId, value);
  
  // Highlight the element on page
  highlightSelectedElement(lastClickedElement, fieldId);
  
  // Mark field as selected
  const fieldEl = document.querySelector(`#dr-scraper-panel .dr-field[data-field="${fieldId}"]`);
  if (fieldEl) {
    fieldEl.classList.add('selected');
  }
  
  hideFieldDropdown();
  stopFieldSelection();
  
  // Show confirmation
  showToast(`✅ ${getFieldLabel(fieldId)} updated`);
}

function highlightSelectedElement(element, fieldId) {
  // Remove previous highlight for this field
  if (selectedElements[fieldId]) {
    selectedElements[fieldId].classList.remove('dr-element-highlight');
  }
  
  // Add new highlight
  element.classList.add('dr-element-highlight');
  selectedElements[fieldId] = element;
}

function getFieldLabel(fieldId) {
  const labels = {
    name: 'Product Title',
    price: 'Price',
    sku: 'SKU',
    size: 'Dimensions',
    finish_color: 'Finish/Color',
    finish_image: 'Finish Image',
    image_url: 'Main Image'
  };
  return labels[fieldId] || fieldId;
}

function updateFieldDisplay(fieldId, value) {
  const el = document.getElementById(`dr-field-${fieldId}`);
  if (!el) return;
  
  if (fieldId === 'finish_image' || fieldId === 'image_url') {
    if (value && value.startsWith('http')) {
      el.innerHTML = `<img src="${value}" alt="${fieldId}"> <span>${value.split('/').pop().substring(0, 30)}...</span>`;
      el.classList.add('has-image');
    } else {
      el.textContent = value || 'Not found';
      el.classList.remove('has-image');
    }
  } else if (fieldId === 'price') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      el.textContent = '$' + num.toLocaleString('en-US', {minimumFractionDigits: 2});
    } else {
      el.textContent = value || 'Not found';
    }
  } else {
    el.textContent = value || 'Not found';
  }
  
  el.classList.toggle('missing', !value);
}

// ============================================================================
// PANEL CONTROL
// ============================================================================

function showPanel() {
  createSidePanel();
  sidePanel.style.display = 'block';
}

function hidePanel() {
  if (sidePanel) {
    sidePanel.style.display = 'none';
  }
  stopFieldSelection();
  
  // Remove all element highlights
  Object.values(selectedElements).forEach(el => {
    el?.classList.remove('dr-element-highlight');
  });
  selectedElements = {};
}

function makeDraggable(element) {
  const header = element.querySelector('.dr-header');
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('dr-close-btn')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    document.body.style.userSelect = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    element.style.left = (startLeft + dx) + 'px';
    element.style.top = (startTop + dy) + 'px';
    element.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #166534;
    color: #4ade80;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ============================================================================
// SCRAPING LOGIC (copied from popup.js)
// ============================================================================

function scrapeAndShow() {
  scrapedData = scrapePageData();
  showPanel();
  
  // Update all field displays
  updateFieldDisplay('name', scrapedData.name);
  updateFieldDisplay('price', scrapedData.price);
  updateFieldDisplay('sku', scrapedData.sku);
  updateFieldDisplay('size', scrapedData.size);
  updateFieldDisplay('finish_color', scrapedData.finish_color);
  updateFieldDisplay('finish_image', scrapedData.finish_image);
  updateFieldDisplay('image_url', scrapedData.image_url);
  
  showToast('✅ Page scraped! Click any field to manually select.');
}

function scrapePageData() {
  const data = {
    url: window.location.href,
    vendor: null,
    name: null,
    sku: null,
    price: null,
    msrp: null,
    size: null,
    finish_color: null,
    finish_image: null,
    image_url: null
  };

  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const pageText = document.body.innerText;
  const pageHtml = document.body.innerHTML;

  // VENDOR DETECTION
  const vendorMap = {
    'uttermost': 'Uttermost', 'visualcomfort': 'Visual Comfort', 'fourhands': 'Four Hands',
    'bernhardt': 'Bernhardt', 'hvlgroup': 'HVL Group', 'gabby': 'Gabby',
    'loloirugs': 'Loloi', 'loloi': 'Loloi', 'rowefurniture': 'Rowe Furniture',
    'globalviews': 'Global Views', 'reginaandrew': 'Regina Andrew', 'surya': 'Surya',
    'safavieh': 'Safavieh', 'eichholtz': 'Eichholtz', 'crestviewcollection': 'Crestview Collection',
    'bassettmirror': 'Bassett Mirror', 'flowdecor': 'Flow Decor', 'hubbardtonforge': 'Hubbardton Forge',
    'hinkley': 'Hinkley', 'elegantlighting': 'Elegant Lighting', 'zeelighting': 'ZEE Lighting',
    'vanguardfurniture': 'Vanguard', 'arteriorshome': 'Arteriors', 'curreyandcompany': 'Currey & Company'
  };
  
  for (const [key, name] of Object.entries(vendorMap)) {
    if (domain.includes(key)) { data.vendor = name; break; }
  }
  if (!data.vendor) data.vendor = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  // ===================== PRODUCT NAME =====================
  // Try multiple selectors for product name
  const nameSelectors = [
    'h1.product-title', 'h1.product-name', 'h1[itemprop="name"]',
    '.product-title h1', '.product-name h1', '.pdp-title',
    '[data-testid="product-title"]', '.product-detail h1',
    'h1'
  ];
  for (const sel of nameSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText?.trim().split('\n')[0];
      if (text && text.length > 2 && text.length < 200) {
        data.name = text;
        break;
      }
    }
  }

  // ===================== VENDOR-SPECIFIC SCRAPING =====================
  // Version 7.0 - Comprehensive vendor support for ~22 sites
  
  // FOUR HANDS - fourhands.com
  if (domain.includes('fourhands')) {
    // SKU from URL: /product/100074-009
    const fhSkuMatch = window.location.pathname.match(/\/product\/([A-Z0-9-]+)/i) || 
                       window.location.pathname.match(/\/p\/([A-Z0-9-]+)/i);
    if (fhSkuMatch) data.sku = fhSkuMatch[1];
    
    // Color - "Durango Smoke • 100074-009" pattern
    const fhColorEl = document.querySelector('.text-body span, [class*="text-neutral"]');
    if (fhColorEl) {
      const colorText = fhColorEl.innerText?.trim();
      if (colorText && !colorText.includes('•')) {
        data.finish_color = colorText;
      }
    }
    // Also try the pattern with bullet
    if (!data.finish_color) {
      const bulletMatch = pageText.match(/([A-Za-z][A-Za-z\s]+?)\s*[•·]\s*\d{5,}/);
      if (bulletMatch) data.finish_color = bulletMatch[1].trim();
    }
    
    // Swatch image from selected/expanded cover section
    const fhSwatchImg = document.querySelector('[title][class*="group"] img.rounded-full, label[title] img');
    if (fhSwatchImg?.src) data.finish_image = fhSwatchImg.src;
    
    // Dimensions - "Overall Dimensions" or "24.00"w x 27.50"d x 37.25"h"
    const fhDimMatch = pageText.match(/([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h/i);
    if (fhDimMatch) data.size = `${fhDimMatch[1]}"W x ${fhDimMatch[2]}"D x ${fhDimMatch[3]}"H`;
    
    // Main image
    const fhMainImg = document.querySelector('img[alt*="DINING" i], img[alt*="CHAIR" i], img[alt*="SOFA" i], img[alt*="TABLE" i], button img[alt]');
    if (fhMainImg?.src && fhMainImg.src.includes('S1200x1200')) {
      data.image_url = fhMainImg.src;
    }
  }
  
  // UTTERMOST - uttermost.com
  else if (domain.includes('uttermost')) {
    // SKU - "SKU: 53083" pattern
    const uttSkuMatch = pageText.match(/SKU[:\s]+(\d+)/i);
    if (uttSkuMatch) data.sku = uttSkuMatch[1];
    
    // Also check URL for SKU - /lenoir-swivel-chair-53083
    if (!data.sku) {
      const urlSkuMatch = window.location.pathname.match(/-(\d{4,})$/);
      if (urlSkuMatch) data.sku = urlSkuMatch[1];
    }
    
    // Dimensions - "34 W X 29 H X 30 D (in)"
    const uttDimMatch = pageText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D\s*\(?in/i);
    if (uttDimMatch) data.size = `${uttDimMatch[1]}"W x ${uttDimMatch[3]}"D x ${uttDimMatch[2]}"H`;
    
    // Color - from H1 heading like "Conifer Dining Armchair, Camel"
    const h1Text = document.querySelector('h1')?.innerText?.trim();
    if (h1Text) {
      const colorMatch = h1Text.match(/,\s*([A-Za-z]+)\s*$/);
      if (colorMatch) data.finish_color = colorMatch[1];
    }
    
    // Also check page title
    if (!data.finish_color) {
      const titleColor = document.title.match(/,\s*([A-Za-z]+)\s*-/);
      if (titleColor) data.finish_color = titleColor[1];
    }
    
    // Get swatch image from selected color button (has background-image style)
    const selectedSwatch = document.querySelector('.tile-root_selected-Au1[style*="background-image"], button[title].tile-root_selected-Au1');
    if (selectedSwatch) {
      const bgStyle = selectedSwatch.style.backgroundImage;
      if (bgStyle) {
        const urlMatch = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch) {
          let swatchUrl = urlMatch[1];
          if (swatchUrl.startsWith('/')) {
            swatchUrl = window.location.origin + swatchUrl;
          }
          data.finish_image = swatchUrl;
        }
      }
    }
  }
  
  // GLOBAL VIEWS - globalviews.com
  else if (domain.includes('globalviews')) {
    // SKU from page - Item #: 9.93892
    const gvSkuMatch = pageText.match(/Item\s*#?\s*:?\s*([0-9.]+)/i);
    if (gvSkuMatch) data.sku = gvSkuMatch[1];
    
    // SKU from URL pattern
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/([0-9]{5,})/);
      if (urlMatch) data.sku = urlMatch[1];
    }
    
    // Dimensions - "Dimensions: 12"W x 12"D x 24"H"
    const gvDimMatch = pageText.match(/Dimensions[:\s]*([\d.]+)"?\s*W?\s*[xX×]\s*([\d.]+)"?\s*D?\s*[xX×]\s*([\d.]+)"?\s*H?/i);
    if (gvDimMatch) data.size = `${gvDimMatch[1]}"W x ${gvDimMatch[2]}"D x ${gvDimMatch[3]}"H`;
    
    // Finish/Material from specs
    const gvFinishMatch = pageText.match(/(?:Finish|Material|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (gvFinishMatch) data.finish_color = gvFinishMatch[1].trim();
    
    // Main image
    const gvMainImg = document.querySelector('.product-image img, .main-image img, [class*="gallery"] img:first-child');
    if (gvMainImg?.src) data.image_url = gvMainImg.src;
  }
  
  // ROWE FURNITURE - rowefurniture.com
  else if (domain.includes('rowefurniture')) {
    // SKU - Style #: N123
    const rwSkuMatch = pageText.match(/Style\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (rwSkuMatch) data.sku = rwSkuMatch[1];
    
    // Dimensions - common furniture format
    const rwDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (rwDimMatch) data.size = `${rwDimMatch[1]}"W x ${rwDimMatch[2]}"D x ${rwDimMatch[3]}"H`;
    
    // Selected fabric/finish
    const rwFinishEl = document.querySelector('.selected-fabric, .fabric-name.active, [class*="selected"] .fabric-name');
    if (rwFinishEl) data.finish_color = rwFinishEl.innerText?.trim();
    
    // Swatch image
    const rwSwatchImg = document.querySelector('.fabric-swatch.selected img, .active .swatch-image img');
    if (rwSwatchImg?.src) data.finish_image = rwSwatchImg.src;
  }
  
  // REGINA ANDREW - reginaandrew.com
  else if (domain.includes('reginaandrew')) {
    // SKU - Item #: 15-1114
    const raSkuMatch = pageText.match(/Item\s*#?\s*:?\s*([\d-]+)/i);
    if (raSkuMatch) data.sku = raSkuMatch[1];
    
    // URL SKU pattern
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/([\d]+-[\d]+)/);
      if (urlMatch) data.sku = urlMatch[1];
    }
    
    // Dimensions
    const raDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (raDimMatch) data.size = `${raDimMatch[1]}"W x ${raDimMatch[2]}"D x ${raDimMatch[3]}"H`;
    
    // Also check H x W x D format
    if (!data.size) {
      const raDimMatch2 = pageText.match(/([\d.]+)"?\s*H\s*[xX×]\s*([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D/i);
      if (raDimMatch2) data.size = `${raDimMatch2[2]}"W x ${raDimMatch2[3]}"D x ${raDimMatch2[1]}"H`;
    }
    
    // Finish from product name or specs
    const raFinishMatch = pageText.match(/(?:Finish|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (raFinishMatch) data.finish_color = raFinishMatch[1].trim();
    
    // Main image
    const raMainImg = document.querySelector('.product-image-main img, .pdp-main-image img');
    if (raMainImg?.src) data.image_url = raMainImg.src;
  }
  
  // BERNHARDT - bernhardt.com
  else if (domain.includes('bernhardt')) {
    // SKU - Style: 345-044 or Item: 345-044
    const bhSkuMatch = pageText.match(/(?:Style|Item|SKU)[:\s#]+([0-9A-Z-]+)/i);
    if (bhSkuMatch) data.sku = bhSkuMatch[1];
    
    // Dimensions
    const bhDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (bhDimMatch) data.size = `${bhDimMatch[1]}"W x ${bhDimMatch[2]}"D x ${bhDimMatch[3]}"H`;
    
    // Finish from dropdown or specs
    const bhFinishEl = document.querySelector('.finish-selected, .selected-finish, [class*="finish"].active');
    if (bhFinishEl) data.finish_color = bhFinishEl.innerText?.trim() || bhFinishEl.title;
    
    // Fabric/Finish pattern in text
    if (!data.finish_color) {
      const bhFinishMatch = pageText.match(/(?:Finish|Fabric|Cover)[:\s]+([A-Za-z][A-Za-z0-9\s\-]+?)(?:\n|,|Available)/i);
      if (bhFinishMatch) data.finish_color = bhFinishMatch[1].trim();
    }
  }
  
  // LOLOI RUGS - loloi.com / loloirugs.com
  else if (domain.includes('loloi')) {
    // SKU - format like LOLRK-01 or similar
    const loSkuMatch = pageText.match(/SKU[:\s]+([A-Z]{2,}-\d+)/i) || 
                       window.location.pathname.match(/\/([A-Z]{2,}[\d-]+)/i);
    if (loSkuMatch) data.sku = loSkuMatch[1];
    
    // Rug dimensions - "8'0" x 10'0"" or "8 x 10"
    const loDimMatch = pageText.match(/([\d]+)'?\s*"?\s*[xX×]\s*([\d]+)'?\s*"?/);
    if (loDimMatch) data.size = `${loDimMatch[1]}' x ${loDimMatch[2]}'`;
    
    // Color from product name or specs
    const loColorMatch = pageText.match(/(?:Color|Colorway)[:\s]+([A-Za-z][A-Za-z\s\/\-]+?)(?:\n|,|$)/i);
    if (loColorMatch) data.finish_color = loColorMatch[1].trim();
    
    // Main rug image
    const loMainImg = document.querySelector('.product-image img, .pdp-image img, [class*="gallery-main"] img');
    if (loMainImg?.src) data.image_url = loMainImg.src;
  }
  
  // VISUAL COMFORT - visualcomfort.com
  else if (domain.includes('visualcomfort')) {
    // SKU - Format: TOB 5003BZ-L or similar
    const vcSkuMatch = pageText.match(/(?:SKU|Item|Style)[:\s#]*([A-Z]{2,}\s*\d+[A-Z0-9\-]+)/i);
    if (vcSkuMatch) data.sku = vcSkuMatch[1].replace(/\s+/g, ' ').trim();
    
    // URL pattern
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/\/([a-z]{2,}\d+[a-z0-9-]+)/i);
      if (urlMatch) data.sku = urlMatch[1].toUpperCase();
    }
    
    // Dimensions - Height: 24" Width: 12"
    const vcHeight = pageText.match(/Height[:\s]*([\d.]+)"/i);
    const vcWidth = pageText.match(/Width[:\s]*([\d.]+)"/i);
    if (vcHeight && vcWidth) {
      data.size = `${vcWidth[1]}"W x ${vcHeight[1]}"H`;
    }
    
    // Finish from selected option
    const vcFinishEl = document.querySelector('[class*="finish"].selected, .finish-option.active, [data-finish].selected');
    if (vcFinishEl) data.finish_color = vcFinishEl.innerText?.trim() || vcFinishEl.dataset.finish || vcFinishEl.title;
    
    // Finish from text
    if (!data.finish_color) {
      const vcFinishMatch = pageText.match(/Finish[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
      if (vcFinishMatch) data.finish_color = vcFinishMatch[1].trim();
    }
  }
  
  // HVL GROUP - hvlgroup.com (Hudson Valley, Troy, Mitzi, Corbett)
  else if (domain.includes('hvlgroup') || domain.includes('hudsonvalley') || domain.includes('?"?"?"?"?') || domain.includes('corbett')) {
    // SKU from URL - /8744-AGB format
    const hvlSkuMatch = window.location.pathname.match(/\/([A-Z0-9]+-[A-Z0-9]+)/i);
    if (hvlSkuMatch) data.sku = hvlSkuMatch[1];
    
    // Also check page text
    if (!data.sku) {
      const hvlCodeMatch = pageText.match(/(?:Item|SKU|Model)[:\s#]*([A-Z0-9]+-[A-Z0-9]+)/i);
      if (hvlCodeMatch) data.sku = hvlCodeMatch[1];
    }
    
    // Dimensions
    const hvlDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (hvlDimMatch) data.size = `${hvlDimMatch[1]}"W x ${hvlDimMatch[2]}"H`;
    
    // Finish
    const hvlFinishMatch = pageText.match(/Finish[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (hvlFinishMatch) data.finish_color = hvlFinishMatch[1].trim();
  }
  
  // VANGUARD FURNITURE - vanguardfurniture.com / vandh.com
  else if (domain.includes('vanguard') || domain.includes('vandh')) {
    // SKU - Style #
    const vgSkuMatch = pageText.match(/(?:Style|Item|SKU)[:\s#]*([A-Z0-9-]+)/i);
    if (vgSkuMatch) data.sku = vgSkuMatch[1];
    
    // Dimensions
    const vgDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (vgDimMatch) data.size = `${vgDimMatch[1]}"W x ${vgDimMatch[2]}"D x ${vgDimMatch[3]}"H`;
    
    // Selected fabric
    const vgFabricEl = document.querySelector('.selected-fabric, .fabric-selected, [class*="fabric"].active');
    if (vgFabricEl) data.finish_color = vgFabricEl.innerText?.trim();
    
    // Swatch image
    const vgSwatchImg = document.querySelector('.fabric-swatch.selected img, .selected .fabric-image img');
    if (vgSwatchImg?.src) data.finish_image = vgSwatchImg.src;
  }
  
  // FLOW DECOR - flowdecor.com
  else if (domain.includes('flowdecor')) {
    // SKU from page
    const fdSkuMatch = pageText.match(/SKU[:\s]+([A-Z0-9-]+)/i);
    if (fdSkuMatch) data.sku = fdSkuMatch[1];
    
    // URL pattern - /product/lamp-name-12345/
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/-(\d{4,})/);
      if (urlMatch) data.sku = urlMatch[1];
    }
    
    // Dimensions
    const fdDimMatch = pageText.match(/([\d.]+)"?\s*[wW]\s*[xX×]\s*([\d.]+)"?\s*[hH]/i);
    if (fdDimMatch) data.size = `${fdDimMatch[1]}"W x ${fdDimMatch[2]}"H`;
    
    // Finish from dropdown or text
    const fdFinishEl = document.querySelector('.variation-selected, select[name*="finish"] option:checked');
    if (fdFinishEl) data.finish_color = fdFinishEl.innerText?.trim() || fdFinishEl.value;
    
    // Main image
    const fdMainImg = document.querySelector('.woocommerce-product-gallery__image img, .product-image img');
    if (fdMainImg?.src) data.image_url = fdMainImg.src;
  }
  
  // CRESTVIEW COLLECTION - crestviewcollection.com
  else if (domain.includes('crestview')) {
    // SKU - CVTOP3594 format in URL or page
    const cvSkuMatch = pageText.match(/([A-Z]{2,}[A-Z0-9]+)/i) ||
                       window.location.pathname.match(/([A-Z]{2,}[A-Z0-9]+)/i);
    if (cvSkuMatch) data.sku = cvSkuMatch[1].toUpperCase();
    
    // Dimensions - "51.6 x 1.5 x 61.6 (in)"
    const cvDimMatch = pageText.match(/([\d.]+)\s*[xX×]\s*([\d.]+)\s*[xX×]\s*([\d.]+)\s*\(?in/i);
    if (cvDimMatch) data.size = `${cvDimMatch[1]}"W x ${cvDimMatch[2]}"D x ${cvDimMatch[3]}"H`;
    
    // Finish/Material
    const cvFinishMatch = pageText.match(/(?:Finish|Material|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (cvFinishMatch) data.finish_color = cvFinishMatch[1].trim();
    
    // Main image
    const cvMainImg = document.querySelector('.product-image img, [class*="gallery"] img:first-child');
    if (cvMainImg?.src) data.image_url = cvMainImg.src;
  }
  
  // BASSETT MIRROR - bassettmirror.com
  else if (domain.includes('bassettmirror')) {
    // SKU - Item #
    const bmSkuMatch = pageText.match(/(?:Item|SKU|Style)[:\s#]*([A-Z0-9-]+)/i);
    if (bmSkuMatch) data.sku = bmSkuMatch[1];
    
    // Dimensions
    const bmDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D?\s*[xX×]?\s*([\d.]+)?"?\s*H?/i);
    if (bmDimMatch) {
      if (bmDimMatch[3]) {
        data.size = `${bmDimMatch[1]}"W x ${bmDimMatch[2]}"D x ${bmDimMatch[3]}"H`;
      } else {
        data.size = `${bmDimMatch[1]}"W x ${bmDimMatch[2]}"H`;
      }
    }
    
    // Finish
    const bmFinishMatch = pageText.match(/(?:Finish|Frame)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (bmFinishMatch) data.finish_color = bmFinishMatch[1].trim();
  }
  
  // EICHHOLTZ - eichholtz.com
  else if (domain.includes('eichholtz')) {
    // SKU - Article code or product code
    const ehSkuMatch = pageText.match(/(?:Article|Code|SKU)[:\s#]*([0-9]+)/i);
    if (ehSkuMatch) data.sku = ehSkuMatch[1];
    
    // Dimensions - metric or imperial
    const ehDimMatch = pageText.match(/([\d.]+)\s*(?:cm|")?\s*[xX×]\s*([\d.]+)\s*(?:cm|")?\s*[xX×]\s*([\d.]+)\s*(?:cm|")?/i);
    if (ehDimMatch) data.size = `${ehDimMatch[1]} x ${ehDimMatch[2]} x ${ehDimMatch[3]}`;
    
    // Finish/Material
    const ehFinishMatch = pageText.match(/(?:Finish|Material|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (ehFinishMatch) data.finish_color = ehFinishMatch[1].trim();
    
    // Main image
    const ehMainImg = document.querySelector('.product-image img, .gallery-main img, .fotorama__img');
    if (ehMainImg?.src) data.image_url = ehMainImg.src;
  }
  
  // MY OH AMERICA / AMERICA LEATHER - myohamerica.com / americaleather.com
  else if (domain.includes('myohamerica') || domain.includes('americaleather')) {
    // SKU
    const maSkuMatch = pageText.match(/(?:Item|SKU|Style)[:\s#]*([A-Z0-9-]+)/i);
    if (maSkuMatch) data.sku = maSkuMatch[1];
    
    // Dimensions
    const maDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (maDimMatch) data.size = `${maDimMatch[1]}"W x ${maDimMatch[2]}"D x ${maDimMatch[3]}"H`;
    
    // Finish
    const maFinishMatch = pageText.match(/(?:Finish|Leather|Fabric)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (maFinishMatch) data.finish_color = maFinishMatch[1].trim();
  }
  
  // SAFAVIEH - safavieh.com / salavieh (possible typo in list)
  else if (domain.includes('safavieh') || domain.includes('salavieh')) {
    // SKU - format like TUL272A
    const sfSkuMatch = pageText.match(/(?:SKU|Item|Style)[:\s#]*([A-Z]{2,}\d+[A-Z]*)/i) ||
                       window.location.pathname.match(/\/([A-Z]{2,}\d+[A-Z]*)/i);
    if (sfSkuMatch) data.sku = sfSkuMatch[1].toUpperCase();
    
    // Rug dimensions - "8' x 10'" or "8'0" x 10'0""
    const sfDimMatch = pageText.match(/([\d]+)'?\s*"?\s*[xX×]\s*([\d]+)'?\s*"?/);
    if (sfDimMatch) data.size = `${sfDimMatch[1]}' x ${sfDimMatch[2]}'`;
    
    // Also check W x D x H for furniture
    if (!data.size) {
      const sfDimMatch2 = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
      if (sfDimMatch2) data.size = `${sfDimMatch2[1]}"W x ${sfDimMatch2[2]}"D x ${sfDimMatch2[3]}"H`;
    }
    
    // Color
    const sfColorMatch = pageText.match(/(?:Color|Colorway)[:\s]+([A-Za-z][A-Za-z\s\/\-]+?)(?:\n|,|$)/i);
    if (sfColorMatch) data.finish_color = sfColorMatch[1].trim();
    
    // Main image
    const sfMainImg = document.querySelector('.product-image img, [class*="gallery-main"] img, .fotorama__img');
    if (sfMainImg?.src) data.image_url = sfMainImg.src;
  }
  
  // SURYA - surya.com
  else if (domain.includes('surya')) {
    // SKU - format like AAA-2300 or AMOR-001
    const sySkuMatch = pageText.match(/([A-Z]{2,}-\d+)/i) ||
                       window.location.pathname.match(/\/([A-Z]{2,}-\d+)/i);
    if (sySkuMatch) data.sku = sySkuMatch[1].toUpperCase();
    
    // Rug dimensions
    const syDimMatch = pageText.match(/([\d]+)'?\s*"?\s*[xX×]\s*([\d]+)'?\s*"?/);
    if (syDimMatch) data.size = `${syDimMatch[1]}' x ${syDimMatch[2]}'`;
    
    // Color
    const syColorMatch = pageText.match(/(?:Color|Colors?)[:\s]+([A-Za-z][A-Za-z\s\/,\-]+?)(?:\n|$)/i);
    if (syColorMatch) data.finish_color = syColorMatch[1].split(',')[0].trim();
    
    // Main image
    const syMainImg = document.querySelector('.product-image img, [class*="gallery"] img:first-child');
    if (syMainImg?.src) data.image_url = syMainImg.src;
  }
  
  // ZEE LIGHTING / Z-LITE - zeelighting.com / zlite.com
  else if (domain.includes('zeelighting') || domain.includes('zlite')) {
    // SKU
    const zlSkuMatch = pageText.match(/(?:SKU|Item|Model)[:\s#]*([A-Z0-9-]+)/i);
    if (zlSkuMatch) data.sku = zlSkuMatch[1];
    
    // Dimensions
    const zlDimMatch = pageText.match(/([\d.]+)"?\s*[wW]?\s*[xX×]\s*([\d.]+)"?\s*[hH]?/i);
    if (zlDimMatch) data.size = `${zlDimMatch[1]}"W x ${zlDimMatch[2]}"H`;
    
    // Finish
    const zlFinishMatch = pageText.match(/(?:Finish|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (zlFinishMatch) data.finish_color = zlFinishMatch[1].trim();
  }
  
  // HUBBARDTON FORGE - hubbardtonforge.com
  else if (domain.includes('hubbardtonforge')) {
    // SKU - 6-digit format like 126500
    const hfSkuMatch = pageText.match(/(?:SKU|Item|Model)[:\s#]*(\d{6})/i) ||
                       window.location.pathname.match(/\/(\d{6})/);
    if (hfSkuMatch) data.sku = hfSkuMatch[1];
    
    // Dimensions
    const hfDimMatch = pageText.match(/([\d.]+)"?\s*[wW]\s*[xX×]\s*([\d.]+)"?\s*[hH]/i);
    if (hfDimMatch) data.size = `${hfDimMatch[1]}"W x ${hfDimMatch[2]}"H`;
    
    // Finish - selected option
    const hfFinishEl = document.querySelector('.finish-selected, [class*="finish"].active, .selected-finish');
    if (hfFinishEl) data.finish_color = hfFinishEl.innerText?.trim() || hfFinishEl.title;
    
    // Finish from text
    if (!data.finish_color) {
      const hfFinishMatch = pageText.match(/(?:Finish|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
      if (hfFinishMatch) data.finish_color = hfFinishMatch[1].trim();
    }
    
    // Swatch image
    const hfSwatchImg = document.querySelector('.finish-swatch.selected img, [class*="finish"].active img');
    if (hfSwatchImg?.src) data.finish_image = hfSwatchImg.src;
  }
  
  // HINKLEY - hinkley.com
  else if (domain.includes('hinkley')) {
    // SKU - format like 1234BZ
    const hkSkuMatch = pageText.match(/(?:SKU|Item|Model)[:\s#]*(\d+[A-Z]{2,})/i) ||
                       window.location.pathname.match(/\/(\d+[a-z]{2,})/i);
    if (hkSkuMatch) data.sku = hkSkuMatch[1].toUpperCase();
    
    // Dimensions
    const hkDimMatch = pageText.match(/([\d.]+)"?\s*[wW]\s*[xX×]\s*([\d.]+)"?\s*[hH]/i);
    if (hkDimMatch) data.size = `${hkDimMatch[1]}"W x ${hkDimMatch[2]}"H`;
    
    // Finish
    const hkFinishEl = document.querySelector('.finish-selected, [class*="finish"].active, select[name*="finish"] option:checked');
    if (hkFinishEl) data.finish_color = hkFinishEl.innerText?.trim() || hkFinishEl.value;
    
    // Finish from text
    if (!data.finish_color) {
      const hkFinishMatch = pageText.match(/(?:Finish)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
      if (hkFinishMatch) data.finish_color = hkFinishMatch[1].trim();
    }
  }
  
  // ELEGANT LIGHTING - elegantlighting.com
  else if (domain.includes('elegantlighting')) {
    // SKU
    const elSkuMatch = pageText.match(/(?:SKU|Item|Model)[:\s#]*([A-Z0-9-]+)/i);
    if (elSkuMatch) data.sku = elSkuMatch[1];
    
    // Dimensions
    const elDimMatch = pageText.match(/([\d.]+)"?\s*[wW]\s*[xX×]\s*([\d.]+)"?\s*[hH]/i);
    if (elDimMatch) data.size = `${elDimMatch[1]}"W x ${elDimMatch[2]}"H`;
    
    // Finish
    const elFinishMatch = pageText.match(/(?:Finish|Color)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
    if (elFinishMatch) data.finish_color = elFinishMatch[1].trim();
  }
  
  // GABBY - gabbyhome.com / gabby.com
  else if (domain.includes('gabby')) {
    // SKU - format like SCH-123456
    const gbSkuMatch = pageText.match(/(?:SKU|Item|Style)[:\s#]*([A-Z]{2,}-?\d+)/i) ||
                       window.location.pathname.match(/([A-Z]{2,}-\d+)/i);
    if (gbSkuMatch) data.sku = gbSkuMatch[1].toUpperCase();
    
    // Dimensions
    const gbDimMatch = pageText.match(/([\d.]+)"?\s*W\s*[xX×]\s*([\d.]+)"?\s*D\s*[xX×]\s*([\d.]+)"?\s*H/i);
    if (gbDimMatch) data.size = `${gbDimMatch[1]}"W x ${gbDimMatch[2]}"D x ${gbDimMatch[3]}"H`;
    
    // Finish/Fabric
    const gbFinishEl = document.querySelector('.selected-fabric, .finish-selected, [class*="option"].active');
    if (gbFinishEl) data.finish_color = gbFinishEl.innerText?.trim();
    
    // Finish from text
    if (!data.finish_color) {
      const gbFinishMatch = pageText.match(/(?:Finish|Fabric|Cover)[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:\n|,|$)/i);
      if (gbFinishMatch) data.finish_color = gbFinishMatch[1].trim();
    }
    
    // Swatch image
    const gbSwatchImg = document.querySelector('.fabric-swatch.selected img, .selected .swatch-image img');
    if (gbSwatchImg?.src) data.finish_image = gbSwatchImg.src;
  }

  // ===================== GENERIC SKU (fallback) =====================
  if (!data.sku) {
    // Check data attributes first
    const skuDataEl = document.querySelector('[data-sku], [data-product-sku], [itemprop="sku"]');
    if (skuDataEl) {
      data.sku = skuDataEl.dataset.sku || skuDataEl.dataset.productSku || skuDataEl.content || skuDataEl.innerText?.trim();
    }
  }
  if (!data.sku) {
    // Check URL for SKU patterns - numbers with dashes
    const urlSkuMatch = window.location.pathname.match(/\/(\d{3,}[-]?\d*[-A-Z0-9]*)/i);
    if (urlSkuMatch && urlSkuMatch[1].length >= 4) data.sku = urlSkuMatch[1];
  }
  if (!data.sku) {
    // Text patterns
    const skuPatterns = [
      /(?:SKU|Item|Style|Model|Product)\s*(?:#|:|\s)\s*([A-Z0-9][-A-Z0-9]{2,})/i,
      /(?:Item Number|Product Code|Article)\s*(?:#|:|\s)\s*([A-Z0-9][-A-Z0-9]{2,})/i
    ];
    for (const pattern of skuPatterns) {
      const match = pageText.match(pattern);
      if (match && match[1].length >= 4 && match[1].length <= 30) {
        if (!/click|view|more|add|cart|buy|product/i.test(match[1])) {
          data.sku = match[1];
          break;
        }
      }
    }
  }

  // ===================== PRICE =====================
  // Check price elements first
  const priceSelectors = [
    '[data-price]', '[itemprop="price"]', '.product-price', '.price-value',
    '.trade-price', '.your-price', '.sale-price', '.current-price',
    '[class*="price"]:not([class*="compare"]):not([class*="was"]):not([class*="msrp"])'
  ];
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const priceText = el.dataset.price || el.content || el.innerText;
      const priceMatch = priceText?.match(/\$?([\d,]+\.?\d*)/);
      if (priceMatch) {
        const val = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (val > 5 && val < 500000) {
          data.price = val;
          break;
        }
      }
    }
  }
  // Text patterns
  if (!data.price) {
    const pricePatterns = [
      /Trade\s*Price[:\s]*\$?([\d,]+\.?\d*)/i,
      /Your\s*Price[:\s]*\$?([\d,]+\.?\d*)/i,
      /Net\s*Price[:\s]*\$?([\d,]+\.?\d*)/i,
      /Sale\s*Price[:\s]*\$?([\d,]+\.?\d*)/i,
      /Price[:\s]*\$?([\d,]+\.?\d*)/i,
      /\$([\d,]+\.\d{2})/
    ];
    for (const pattern of pricePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > 5 && val < 500000) {
          data.price = val;
          break;
        }
      }
    }
  }

  // ===================== DIMENSIONS =====================
  const dimPatterns = [
    // W x D x H patterns
    [/(\d+(?:\.\d+)?)\s*"?\s*W\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"?\s*D\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"?\s*H/i, 
      m => `${m[1]}"W x ${m[2]}"D x ${m[3]}"H`],
    // W x H x D patterns
    [/(\d+(?:\.\d+)?)\s*"?\s*W\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"?\s*H\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"?\s*D/i, 
      m => `${m[1]}"W x ${m[3]}"D x ${m[2]}"H`],
    // Width/Depth/Height labels
    [/Width[:\s]*([\d.]+).*?Depth[:\s]*([\d.]+).*?Height[:\s]*([\d.]+)/is, 
      m => `${m[1]}"W x ${m[2]}"D x ${m[3]}"H`],
    // Simple w x d x h
    [/([\d.]+)"?\s*w\s*[xX×]\s*([\d.]+)"?\s*d\s*[xX×]\s*([\d.]+)"?\s*h/i, 
      m => `${m[1]}"W x ${m[2]}"D x ${m[3]}"H`],
    // Just W x H
    [/(\d+(?:\.\d+)?)\s*"?\s*W\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"?\s*H/i, 
      m => `${m[1]}"W x ${m[2]}"H`],
    // Overall: format
    [/Overall[:\s]*([\d.]+)\s*"?\s*[wW]\s*[xX×]\s*([\d.]+)\s*"?\s*[dD]\s*[xX×]\s*([\d.]+)\s*"?\s*[hH]/i,
      m => `${m[1]}"W x ${m[2]}"D x ${m[3]}"H`],
    // Generic 3 numbers with quotes
    [/(\d+(?:\.\d+)?)\s*"\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"\s*[xX×]\s*(\d+(?:\.\d+)?)\s*"/,
      m => `${m[1]}" x ${m[2]}" x ${m[3]}"`],
  ];
  for (const [pattern, formatter] of dimPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      data.size = formatter(match);
      break;
    }
  }

  // ===================== FINISH/COLOR (generic fallback) =====================
  if (!data.finish_color) {
    // Check selected swatches, color pickers, option labels, etc
    const colorSelectors = [
      '.selected-color', '.active-swatch', '[class*="swatch"].active', '[class*="swatch"].selected',
      '[class*="color-name"]', '[class*="finish-name"]', '.selected-finish',
      '[data-selected-color]', '[data-color].selected', '[data-finish].active',
      '.color-option.selected', '.finish-option.selected', '[class*="option"].active',
      '.variant-option.selected', '[aria-selected="true"]'
    ];
    for (const sel of colorSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.title || el.getAttribute('aria-label') || el.dataset.color || el.dataset.finish || el.dataset.value || el.innerText?.trim();
        if (text && text.length > 1 && text.length < 50 && !/view|click|select|choose|add|cart/i.test(text)) {
          data.finish_color = text.split('\n')[0].trim();
          break;
        }
      }
    }
  }
  
  // Text patterns as final fallback
  if (!data.finish_color) {
    const finishPatterns = [
      /(?:Finish|Color|Fabric|Cover)\s*:\s*([A-Za-z][A-Za-z0-9\s\-\/]{1,35})/i,
      /(?:Selected|Current|Chosen)\s*(?:Color|Finish|Option)\s*:\s*([A-Za-z][A-Za-z0-9\s\-\/]{1,35})/i
    ];
    for (const pattern of finishPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const val = match[1].trim();
        if (val.length > 1 && val.length < 40 && !/view|click|more|select|add|cart|buy|shop/i.test(val)) {
          data.finish_color = val;
          break;
        }
      }
    }
  }

  // ===================== MAIN IMAGE =====================
  // Try product image selectors FIRST (before OG which might be logo)
  const imgSelectors = [
    '.product-image img', '.pdp-image img', '.main-image img', '.primary-image img',
    '[class*="product-gallery"] img:first-child', '[class*="product-image"] img',
    '[class*="gallery"] img:first-child', '[class*="slider"] img:first-child',
    '[data-main-image]', '[itemprop="image"]', '.gallery-main img',
    '#product-image img', '.product-detail img', '.hero-image img',
    '[class*="zoom"] img', '[class*="featured"] img'
  ];
  for (const sel of imgSelectors) {
    const img = document.querySelector(sel);
    if (img?.src && img.src.startsWith('http') && !img.src.includes('logo') && !img.src.includes('icon')) {
      data.image_url = img.src;
      break;
    }
  }
  
  // Open Graph image as backup
  if (!data.image_url) {
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg?.content && !ogImg.content.includes('logo')) data.image_url = ogImg.content;
  }
  
  // Find largest visible image as final fallback
  if (!data.image_url) {
    let largestImg = null;
    let largestArea = 0;
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || img.dataset.lazySrc;
      if (!src || !src.startsWith('http')) return;
      if (src.includes('logo') || src.includes('icon') || src.includes('sprite')) return;
      
      const rect = img.getBoundingClientRect();
      const w = rect.width || img.naturalWidth || img.width || 0;
      const h = rect.height || img.naturalHeight || img.height || 0;
      const area = w * h;
      
      // Must be visible and reasonably sized
      if (area > largestArea && w > 150 && h > 150 && rect.top < window.innerHeight) {
        largestArea = area;
        largestImg = img;
      }
    });
    if (largestImg) {
      data.image_url = largestImg.src || largestImg.dataset.src || largestImg.dataset.lazySrc;
    }
  }

  // ===================== SWATCH/FINISH IMAGE =====================
  const swatchSelectors = [
    '[class*="swatch"].active img', '[class*="swatch"].selected img',
    '[class*="color-swatch"] img', '[class*="finish-swatch"] img',
    '.swatch-image img', 'label.selected img', '[data-swatch] img',
    '[class*="swatch"] img'
  ];
  for (const sel of swatchSelectors) {
    const img = document.querySelector(sel);
    if (img?.src && img.src.startsWith('http')) {
      data.finish_image = img.src;
      break;
    }
  }

  return data;
}

// ============================================================================
// SEND TO APP + LIBRARIES
// ============================================================================

const BACKEND_URL = 'https://interiordata.preview.emergentagent.com';

async function sendToAppAndLibraries() {
  if (!scrapedData) return;
  
  showToast('⏳ Saving to libraries...');
  
  // Get selected project from storage
  const stored = await chrome.storage.local.get('selectedProjectId');
  const projectId = stored.selectedProjectId;
  
  if (!projectId) {
    showToast('⚠️ Please select a project in the extension popup first');
    return;
  }
  
  try {
    // 1. Save to Product Library
    await fetch(`${BACKEND_URL}/api/products/library`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: scrapedData.name,
        vendor: scrapedData.vendor,
        sku: scrapedData.sku,
        price: scrapedData.price,
        msrp: scrapedData.msrp,
        size: scrapedData.size,
        finish_color: scrapedData.finish_color,
        finish_image: scrapedData.finish_image,
        image_url: scrapedData.image_url,
        product_url: scrapedData.url,
        project_id: projectId,
        category: 'furniture'
      })
    });
    console.log('✅ Saved to Product Library');
    
    // 2. Save Finish/Material to Materials Library (if we have finish data)
    if (scrapedData.finish_color || scrapedData.finish_image) {
      await fetch(`${BACKEND_URL}/api/materials/from-scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scrapedData.finish_color || 'Unknown Finish',
          vendor: scrapedData.vendor,
          sku: scrapedData.sku,
          image_url: scrapedData.finish_image,
          product_name: scrapedData.name,
          product_url: scrapedData.url,
          product_sku: scrapedData.sku,
          project_id: projectId,
          category: 'fabric'
        })
      });
      console.log('✅ Saved to Materials Library');
    }
    
    // 3. Send to App (Checklist/FFE)
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('source', 'extension');
    if (scrapedData.name) params.set('name', scrapedData.name);
    if (scrapedData.price) params.set('price', scrapedData.price);
    if (scrapedData.sku) params.set('sku', scrapedData.sku);
    if (scrapedData.size) params.set('size', scrapedData.size);
    if (scrapedData.finish_color) params.set('finish', scrapedData.finish_color);
    if (scrapedData.finish_image) params.set('finish_image', scrapedData.finish_image);
    if (scrapedData.vendor) params.set('vendor', scrapedData.vendor);
    if (scrapedData.url) params.set('link', scrapedData.url);
    if (scrapedData.image_url) params.set('image', scrapedData.image_url);
    
    const projectUrl = `${BACKEND_URL}/project/${projectId}?tab=Checklist&${params.toString()}`;
    window.open(projectUrl, '_blank');
    
    showToast('✅ Saved to App + Product Library + Materials Library!');
    hidePanel();
    
  } catch (error) {
    console.error('Error saving to libraries:', error);
    showToast('⚠️ Error saving to libraries, but opening app...');
    
    // Still try to open the app even if library save failed
    const params = new URLSearchParams();
    params.set('action', 'add-item');
    params.set('source', 'extension');
    if (scrapedData.name) params.set('name', scrapedData.name);
    if (scrapedData.price) params.set('price', scrapedData.price);
    const projectUrl = `${BACKEND_URL}/project/${projectId}?tab=Checklist&${params.toString()}`;
    window.open(projectUrl, '_blank');
  }
}

// ============================================================================
// CANVA INTEGRATION
// ============================================================================

let canvaToken = null;

async function copyImage() {
  if (!scrapedData || !scrapedData.image_url) {
    showToast('⚠️ No image');
    return;
  }
  
  try {
    const response = await fetch(scrapedData.image_url);
    const blob = await response.blob();
    
    // Convert to PNG
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    
    const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    showToast('✅ Image copied!');
  } catch (e) {
    // Fallback: copy URL
    await navigator.clipboard.writeText(scrapedData.image_url);
    showToast('📋 Image URL copied');
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href);
  showToast('✅ Link copied!');
}

function copyImageWithLink() {
  copyImage();
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openScraper') {
    scrapeAndShow();
    sendResponse({ success: true });
  }
  
  if (request.action === 'getLastProject') {
    chrome.storage.local.get(['lastProjectUrl', 'lastProjectTime'], (data) => {
      sendResponse(data);
    });
    return true;
  }
  
  return true;
});

// Escape key to stop selection
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (clickToSelectActive) {
      stopFieldSelection();
    } else if (sidePanel?.style.display === 'block') {
      hidePanel();
    }
  }
});

// Save project URL if on app
if (window.location.hostname.includes('emergentagent.com') || window.location.hostname.includes('localhost')) {
  if (window.location.pathname.includes('/project/')) {
    chrome.storage.local.set({ lastProjectUrl: window.location.href, lastProjectTime: Date.now() });
  }
}
