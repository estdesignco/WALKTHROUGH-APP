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
        <button class="dr-btn-secondary" id="dr-copy-link-btn" style="flex: 1; background: #7c3aed; color: white; border-color: #7c3aed;">
          🔗 Copy Page Link
        </button>
        <button class="dr-btn-secondary" id="dr-rescrape-btn" style="flex: 1;">
          🔄 Re-scrape
        </button>
      </div>
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
  document.getElementById('dr-copy-link-btn').addEventListener('click', copyPageLink);
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
  
  const target = e.target;
  
  // Ignore our own elements
  if (target.closest('#dr-scraper-panel') || target.closest('#dr-field-dropdown') || target.closest('#dr-hover-highlight')) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
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
    value = lastClickedElement.src;
  } else {
    value = lastClickedElement.innerText?.trim() || lastClickedElement.textContent?.trim() || '';
    
    // Clean up price values
    if (fieldId === 'price') {
      const priceMatch = value.match(/\$?([\d,]+\.?\d*)/);
      if (priceMatch) {
        value = priceMatch[1].replace(/,/g, '');
      }
    }
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

  // NAME - H1
  const h1 = document.querySelector('h1');
  if (h1) data.name = h1.innerText.trim().split('\n')[0];

  // SKU - multiple patterns
  const skuPatterns = [/SKU[:\s#]*([A-Z0-9-]+)/i, /Item[:\s#]*([A-Z0-9-]+)/i, /Style[:\s#]*([A-Z0-9-]+)/i];
  for (const pattern of skuPatterns) {
    const match = pageText.match(pattern);
    if (match) { data.sku = match[1]; break; }
  }

  // PRICE
  const pricePatterns = [/Trade Price[:\s]*\$([\d,]+\.?\d*)/i, /Your Price[:\s]*\$([\d,]+\.?\d*)/i, /\$([\d,]+\.?\d*)/];
  for (const pattern of pricePatterns) {
    const match = pageText.match(pattern);
    if (match) { 
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > 10 && val < 100000) { data.price = val; break; }
    }
  }

  // DIMENSIONS
  const dimPatterns = [
    [/(\d+(?:\.\d+)?)\s*W\s*X\s*(\d+(?:\.\d+)?)\s*H\s*X\s*(\d+(?:\.\d+)?)\s*D/i, (m) => `${m[1]}"W x ${m[3]}"D x ${m[2]}"H`],
    [/Width[:\s]*([\d.]+).*?Depth[:\s]*([\d.]+).*?Height[:\s]*([\d.]+)/is, (m) => `${m[1]}"W x ${m[2]}"D x ${m[3]}"H`],
    [/([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h/i, (m) => `${m[1]}"W x ${m[2]}"D x ${m[3]}"H`],
  ];
  for (const [pattern, formatter] of dimPatterns) {
    const match = pageText.match(pattern);
    if (match) { data.size = formatter(match); break; }
  }

  // FINISH/COLOR
  const finishPatterns = [
    /(?:choose\s+)?(?:body\s+)?cover[:\s]*([^\n]+)/i,
    /(?:fabric\s+shown|body\s+fabric)[:\s]*([^\n]+)/i,
    /(?:finish|color|option)[:\s]*([^\n]+)/i
  ];
  for (const pattern of finishPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      const val = match[1].trim().split('\n')[0].trim();
      if (val && val.length > 1 && val.length < 50) { data.finish_color = val; break; }
    }
  }

  // IMAGES
  const ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg?.content) data.image_url = ogImg.content;
  
  // Swatch images
  const swatchImgs = document.querySelectorAll('[class*="swatch"] img, label[title] img');
  for (const img of swatchImgs) {
    if (img.src && img.src.startsWith('http')) {
      const w = img.naturalWidth || img.width || 100;
      if (w < 200 && w > 10) {
        data.finish_image = img.src;
        break;
      }
    }
  }

  return data;
}

// ============================================================================
// SEND TO APP + LIBRARIES
// ============================================================================

const BACKEND_URL = 'https://interiorai-9.preview.emergentagent.com';

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

function copyPageLink() {
  const pageUrl = window.location.href;
  
  navigator.clipboard.writeText(pageUrl).then(() => {
    showToast('✅ Page link copied!');
    // Change button text briefly
    const btn = document.getElementById('dr-copy-link-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    btn.style.background = '#10b981';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '#7c3aed';
    }, 2000);
  }).catch(() => {
    showToast('⚠️ Failed to copy link');
  });
}

function copyImageWithLink() {
  // Copy product info to clipboard
  const text = `${scrapedData.name || 'Product'}
${scrapedData.vendor || ''}
${window.location.href}

Image: ${scrapedData.image_url || ''}`;
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Product info copied!');
  });
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
