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
        top: 10px;
        right: 20px;
        width: 360px;
        max-height: 95vh;
        background: #0f0f1a;
        border: 1px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        z-index: 2147483640;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow-y: auto;
        display: none;
      }
      #dr-scraper-panel * {
        box-sizing: border-box;
      }
      #dr-scraper-panel .dr-header {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 10px 14px;
        border-bottom: 1px solid #333;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      #dr-scraper-panel .dr-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #dr-scraper-panel .dr-logo {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
      #dr-scraper-panel .dr-title {
        font-size: 13px;
        font-weight: 600;
      }
      #dr-scraper-panel .dr-close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }
      #dr-scraper-panel .dr-close-btn:hover {
        background: #333;
        color: #fff;
      }
      #dr-scraper-panel .dr-content {
        padding: 12px;
        max-height: 45vh;
        overflow-y: auto;
      }
      #dr-scraper-panel .dr-field {
        margin-bottom: 8px;
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
        padding: 12px;
        border-top: 1px solid #333;
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: sticky;
        bottom: 0;
        background: #0f0f1a;
      }
      #dr-scraper-panel .dr-btn-primary {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: #000;
        border: none;
        border-radius: 8px;
        font-size: 13px;
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
      
      <div class="dr-field" data-field="remarks">
        <div class="dr-field-label">
          <span>📋 Remarks</span>
          <span class="dr-click-hint">Click to select</span>
        </div>
        <div class="dr-field-value" id="dr-field-remarks">Not found</div>
      </div>
      
      <!-- MULTI-IMAGE GALLERY -->
      <div id="dr-multi-image-section" style="display: none; margin-top: 12px; padding: 10px; background: #1a1a2e; border-radius: 8px; border: 1px solid #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #4ade80;">🖼️ Product Images (click to select)</span>
          <span id="dr-selected-count" style="font-size: 11px; color: #888; background: #222; padding: 2px 8px; border-radius: 4px;">0 selected</span>
        </div>
        <div id="dr-image-gallery" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; max-height: 160px; overflow-y: auto;"></div>
      </div>
    </div>
    
    <div class="dr-actions">
      <button class="dr-btn-primary" id="dr-send-btn">
        🚀 SEND TO APP
      </button>
      <button class="dr-btn-secondary" id="dr-houzz-sync-btn" style="background: linear-gradient(135deg, #00c853 0%, #009624 100%); color: white; border-color: #00c853; font-weight: 600;">
        🏠 SYNC FROM HOUZZ CLIPPER
      </button>
      <div style="display: flex; gap: 6px;">
        <button class="dr-btn-secondary" id="dr-copy-link-btn" style="flex: 1; background: #2563eb; color: white; border-color: #2563eb;">
          🔗 Copy Link
        </button>
        <button class="dr-btn-secondary" id="dr-copy-image-btn" style="flex: 1; background: #7c3aed; color: white; border-color: #7c3aed;">
          📷 Copy Image
        </button>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="dr-btn-secondary" id="dr-copy-nobg-btn" style="flex: 1; background: #059669; color: white; border-color: #059669;">
          ✨ No Background
        </button>
        <button class="dr-btn-secondary" id="dr-rescrape-btn" style="flex: 1;">
          🔄 Re-scrape
        </button>
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
  document.getElementById('dr-copy-nobg-btn').addEventListener('click', copyImageNoBackground);
  document.getElementById('dr-copy-link-btn').addEventListener('click', copyLink);
  document.getElementById('dr-rescrape-btn').addEventListener('click', () => {
    scrapeAndShow();
  });
  document.getElementById('dr-houzz-sync-btn').addEventListener('click', () => {
    syncFromHouzz();
  });
  
  // Store the selection before click clears it
  let pendingSelection = '';
  
  // Capture selection on mousedown (before it gets cleared by click)
  document.querySelectorAll('#dr-scraper-panel .dr-field').forEach(field => {
    field.addEventListener('mousedown', (e) => {
      // Capture the current selection before click clears it
      pendingSelection = window.getSelection().toString().trim();
      console.log('[Scraper] Captured selection on mousedown:', pendingSelection);
    });
  });
  
  // Field click handlers - click on field in panel to select from page
  // ALSO supports REVERSE: highlight text first, then click field to populate
  document.querySelectorAll('#dr-scraper-panel .dr-field').forEach(field => {
    field.addEventListener('click', (e) => {
      const fieldId = field.dataset.field;
      
      // Use the selection we captured on mousedown
      if (pendingSelection) {
        // REVERSE MODE: User highlighted text first, now clicking field to populate
        console.log('[Scraper] Reverse select - using captured text:', pendingSelection);
        
        // Update the field with highlighted text
        if (scrapedData) {
          scrapedData[fieldId] = pendingSelection;
          updateFieldDisplay(fieldId, pendingSelection);
          showToast(`✅ ${formatFieldName(fieldId)} updated!`);
        }
        
        // Clear the pending selection
        pendingSelection = '';
        window.getSelection().removeAllRanges();
      } else {
        // NORMAL MODE: Click field first, then click element on page
        startFieldSelection(fieldId);
      }
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
    { id: 'remarks', label: 'Remarks', icon: '📋' },
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

function formatFieldName(fieldId) {
  const names = {
    name: 'Product Title',
    price: 'Price',
    sku: 'SKU',
    size: 'Dimensions',
    finish_color: 'Finish/Color',
    finish_image: 'Finish Image',
    image_url: 'Main Image',
    remarks: 'Remarks',
    msrp: 'MSRP'
  };
  return names[fieldId] || fieldId;
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
  stopHouzzAutoSync(); // Stop Houzz auto-sync when panel is hidden
  
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
  updateFieldDisplay('remarks', scrapedData.remarks);
  
  // Display multi-image gallery if multiple images found
  displayMultiImageGallery(scrapedData.all_images || []);
  
  showToast('✅ Page scraped! Click any field to manually select.');
}

// MULTI-IMAGE GALLERY - State
let allProductImages = [];
let selectedImages = [];

function displayMultiImageGallery(images) {
  allProductImages = images || [];
  selectedImages = images.filter(img => img.isPrimary).map(img => img.url);
  
  const section = document.getElementById('dr-multi-image-section');
  const gallery = document.getElementById('dr-image-gallery');
  const countEl = document.getElementById('dr-selected-count');
  
  if (!section || !gallery) return;
  
  if (images.length <= 1) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  gallery.innerHTML = '';
  
  images.forEach((img, index) => {
    const div = document.createElement('div');
    div.style.cssText = `
      position: relative;
      aspect-ratio: 1;
      cursor: pointer;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid ${img.isPrimary || selectedImages.includes(img.url) ? '#4ade80' : 'transparent'};
      transition: all 0.2s;
      box-shadow: ${selectedImages.includes(img.url) ? '0 0 10px rgba(74, 222, 128, 0.4)' : 'none'};
    `;
    div.innerHTML = `
      <img src="${img.url}" alt="Product image ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
      ${img.isPrimary ? '<span style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #f59e0b; color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">★</span>' : ''}
      ${selectedImages.includes(img.url) ? '<span style="position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: #4ade80; color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">✓</span>' : ''}
    `;
    
    div.addEventListener('click', () => toggleImageSelection(img.url, div));
    div.addEventListener('mouseenter', () => { div.style.transform = 'scale(1.05)'; div.style.borderColor = '#4ade80'; });
    div.addEventListener('mouseleave', () => { div.style.transform = 'scale(1)'; div.style.borderColor = selectedImages.includes(img.url) ? '#4ade80' : 'transparent'; });
    
    gallery.appendChild(div);
  });
  
  updateSelectedCount();
}

function toggleImageSelection(url, element) {
  const index = selectedImages.indexOf(url);
  if (index > -1) {
    selectedImages.splice(index, 1);
  } else {
    selectedImages.push(url);
  }
  
  // Refresh gallery display
  displayMultiImageGallery(allProductImages);
  
  // Update main image if this is the first selected
  if (selectedImages.length > 0 && scrapedData) {
    scrapedData.image_url = selectedImages[0];
    updateFieldDisplay('image_url', selectedImages[0]);
  }
  
  // Store all selected images in scraped data
  if (scrapedData) {
    scrapedData.selected_images = selectedImages;
  }
  
  showToast(`${selectedImages.length} image(s) selected`);
}

function updateSelectedCount() {
  const countEl = document.getElementById('dr-selected-count');
  if (countEl) {
    countEl.textContent = `${selectedImages.length} selected`;
  }
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
    image_url: null,
    remarks: null
  };

  const domain = window.location.hostname.replace('www.', '').toLowerCase();
  const pageText = document.body.innerText;
  const pageHtml = document.body.innerHTML;

  // ===================== HELPER: EXTRACT TRADE PRICE (NOT MSRP) =====================
  function extractTradePrice() {
    // Get ALL dollar amounts from the page
    const allPrices = pageText.match(/\$[\d,]+\.?\d*/g) || [];
    console.log('[Price Debug] All dollar amounts found:', allPrices);
    
    // Priority 1: Look for explicitly labeled trade/wholesale/your price
    const tradePricePatterns = [
      /(?:Trade|Wholesale|Your|Net|Dealer)\s*Price[:\s]*\$?([\d,]+\.?\d*)/i,
      /(?:Trade|NET|YOUR PRICE)[:\s]*\$?([\d,]+\.?\d*)/i
    ];
    for (const pattern of tradePricePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > 1 && val < 50000) {
          console.log('[Price Debug] Found labeled trade price:', val);
          return val;
        }
      }
    }
    
    // Priority 2: Look for Add to Cart button price or main price element
    const priceElementSelectors = [
      '[class*="add-to-cart"]', 'button[type="submit"]', '.add-to-cart',
      '[class*="current-price"]', '[class*="sale-price"]', '[class*="our-price"]',
      '[class*="trade-price"]', '[class*="your-price"]', '[class*="net-price"]',
      '.price:not(.msrp):not(.was):not(.compare)',
      '[itemprop="price"]', '[data-price]'
    ];
    for (const sel of priceElementSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.innerText || el.dataset?.price || el.content || '';
          // Skip if contains MSRP/MAP keywords
          if (/msrp|map|retail|compare|was|list/i.test(text)) continue;
          const priceMatch = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
          if (priceMatch) {
            const val = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (val > 1 && val < 50000) {
              console.log('[Price Debug] Found price element:', val, 'from', sel);
              return val;
            }
          }
        }
      } catch(e) {}
    }
    
    // Priority 3: Take the FIRST REASONABLE price that is NOT near MAP/MSRP keywords
    // Skip prices over $50,000 as they're likely filters or errors
    for (const priceStr of allPrices) {
      const val = parseFloat(priceStr.replace(/[$,]/g, ''));
      
      // SKIP unreasonable prices - most furniture/rugs are under $50k
      if (val <= 1 || val >= 50000) {
        console.log('[Price Debug] Skipping unreasonable price:', val);
        continue;
      }
      
      // Find this price in the text and check surrounding context
      const idx = pageText.indexOf(priceStr);
      const before = pageText.substring(Math.max(0, idx - 30), idx).toLowerCase();
      const after = pageText.substring(idx, Math.min(pageText.length, idx + priceStr.length + 30)).toLowerCase();
      const context = before + after;
      
      // Skip if this price is PRECEDED by MSRP/MAP/Retail keywords (within 20 chars before)
      // OR if it's in a "Price Range" context
      const skipBeforePattern = /\b(map|msrp|retail|list|compare|was|original|regular|suggested|range|filter)\b/i;
      if (skipBeforePattern.test(before)) {
        console.log('[Price Debug] Skipping - keyword before price:', val);
        continue;
      }
      
      // Check what comes RIGHT AFTER the price
      const immediateAfter = pageText.substring(idx + priceStr.length, idx + priceStr.length + 5).trim().toLowerCase();
      
      // Skip if this IS the MAP price (pattern: "$1,589 MAP" without colon)
      // But ACCEPT if pattern is "$649 MAP: $xxx" (the $649 is trade, $xxx is MAP)
      if (/^map/i.test(immediateAfter) && !immediateAfter.includes(':')) {
        console.log('[Price Debug] Skipping - this IS the MAP price:', val);
        continue;
      }
      
      console.log('[Price Debug] Found trade price:', val);
      return val;
    }
    
    // Priority 4: If still nothing, take the smallest reasonable price (likely the trade price)
    const reasonablePrices = allPrices
      .map(p => parseFloat(p.replace(/[$,]/g, '')))
      .filter(v => v > 10 && v < 50000)
      .sort((a, b) => a - b);
    
    if (reasonablePrices.length > 0) {
      console.log('[Price Debug] Fallback - using smallest reasonable price:', reasonablePrices[0]);
      return reasonablePrices[0];
    }
    
    return null;
  }
  
  // ===================== HELPER: EXTRACT MSRP =====================
  function extractMSRP() {
    const msrpPatterns = [
      /(?:MSRP|MAP|Retail|List|Suggested)[:\s]*\$?([\d,]+\.?\d*)/i,
      /\$?([\d,]+\.?\d*)\s*(?:MSRP|MAP|Retail|List)/i
    ];
    for (const pattern of msrpPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > 1 && val < 500000) return val;
      }
    }
    return null;
  }
  
  // ===================== HELPER: EXTRACT COLOR/FINISH =====================
  function extractColor() {
    // Priority 1: Check H1 for color pattern like "Product Name - Color" or "Product Name, Color"
    const h1 = document.querySelector('h1');
    if (h1) {
      const h1Text = h1.innerText?.trim();
      // Pattern: "LOE-03 NATURAL / ESPRESSO" or "Chair Name, Camel" or "Product - Bronze"
      const h1ColorMatch = h1Text?.match(/(?:[-,]\s*|\s{2,})([A-Z][A-Za-z\s\/]+)$/i);
      if (h1ColorMatch) {
        const color = h1ColorMatch[1].trim();
        if (color.length > 1 && color.length < 50 && !/add|cart|buy|shop/i.test(color)) {
          return color;
        }
      }
      // Pattern: "SKU-123 COLOR NAME" (uppercase color after SKU)
      const skuColorMatch = h1Text?.match(/[A-Z]{2,}-\d+\s+([A-Z][A-Za-z\s\/]+)/);
      if (skuColorMatch) {
        const color = skuColorMatch[1].trim();
        if (color.length > 1 && color.length < 50) {
          return color;
        }
      }
    }
    
    // Priority 2: Check for selected swatch/option with title attribute
    const swatchSelectors = [
      '[class*="selected"][title]', '[class*="active"][title]', 
      'button.selected[title]', 'label.selected[title]',
      '[class*="swatch"].selected[title]', '[class*="color"].selected[title]',
      '[class*="finish"].selected[title]', '[aria-checked="true"][title]',
      '[class*="option"].selected[title]', '.selected[title]'
    ];
    for (const sel of swatchSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el?.title && el.title.length > 1 && el.title.length < 50) {
          return el.title;
        }
      } catch(e) {}
    }
    
    // Priority 3: Check for selected option text
    const selectedSelectors = [
      '.selected-color', '.selected-finish', '.color-name.selected',
      '.finish-name.selected', '[class*="selected"] .color-name',
      '[class*="selected"] .finish-name', '.variation-selected',
      '.color-selected', '.finish-selected', '.active-color',
      '[class*="color"].active', '[class*="finish"].active'
    ];
    for (const sel of selectedSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el?.innerText) {
          const text = el.innerText.trim();
          if (text.length > 1 && text.length < 50) return text;
        }
      } catch(e) {}
    }
    
    // Priority 4: Check for color/finish in product info sections
    const infoSelectors = [
      '[class*="product-info"] [class*="color"]',
      '[class*="product-info"] [class*="finish"]',
      '[class*="variant"] [class*="color"]',
      '[class*="option-value"]'
    ];
    for (const sel of infoSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el?.innerText) {
          const text = el.innerText.trim();
          if (text.length > 1 && text.length < 50 && !/select|choose/i.test(text)) return text;
        }
      } catch(e) {}
    }
    
    // Priority 5: Check page text for labeled color/finish
    const colorPatterns = [
      /(?:Color|Finish|Colorway)[:\s]+([A-Za-z][A-Za-z\s\-\/]+?)(?:\n|,|\||$)/i,
      /(?:Selected|Current)[:\s]+([A-Za-z][A-Za-z\s\-\/]+?)(?:\n|,|\||$)/i,
      /(?:Fabric|Material|Cover)[:\s]+([A-Za-z][A-Za-z\s\-\/]+?)(?:\n|,|\||$)/i
    ];
    for (const pattern of colorPatterns) {
      const match = pageText.match(pattern);
      if (match && match[1].trim().length > 1 && match[1].trim().length < 50) {
        return match[1].trim();
      }
    }
    
    return null;
  }

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
  
  // Debug: Log which vendor was detected
  let vendorDetected = 'GENERIC';
  
  // FOUR HANDS - fourhands.com
  if (domain.includes('fourhands')) {
    vendorDetected = 'FOUR HANDS';
    
    // SKU from URL: /product/100074-009
    const fhSkuMatch = window.location.pathname.match(/\/product\/([A-Z0-9-]+)/i) || 
                       window.location.pathname.match(/\/p\/([A-Z0-9-]+)/i);
    if (fhSkuMatch) data.sku = fhSkuMatch[1];
    
    // ===== COLOR EXTRACTION =====
    // On Four Hands, color shows as "Durango Smoke • 100074-009" below the title
    // OR in the "Cover" section showing "Durango Smoke"
    
    // Strategy 1: Look for "Cover" label with color name
    const coverMatch = pageText.match(/Cover[:\s]*([A-Za-z][A-Za-z\s]+?)(?:\n|$)/i);
    if (coverMatch && coverMatch[1].trim().length > 2 && coverMatch[1].trim().length < 40) {
      data.finish_color = coverMatch[1].trim();
      console.log('[FH Debug] Found Color from Cover:', data.finish_color);
    }
    
    // Strategy 2: Look right below the product name for "Color • SKU" pattern
    // But ONLY get the last 2-3 words before the bullet (to avoid breadcrumb)
    if (!data.finish_color && data.sku) {
      const shortPattern = new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s*[•·]\\s*${data.sku}`, 'i');
      const shortMatch = pageText.match(shortPattern);
      if (shortMatch) {
        data.finish_color = shortMatch[1].trim();
        console.log('[FH Debug] Found Color from short pattern:', data.finish_color);
      }
    }
    
    // Strategy 3: Selected swatch with title attribute
    if (!data.finish_color) {
      const selectedSwatch = document.querySelector('[class*="selected"][title], [class*="active"][title], button[aria-selected="true"][title], label[aria-checked="true"][title]');
      if (selectedSwatch?.title && selectedSwatch.title.length > 2 && selectedSwatch.title.length < 40) {
        if (!/seating|dining|bedroom|tables|chairs|living|office/i.test(selectedSwatch.title)) {
          data.finish_color = selectedSwatch.title;
        }
      }
    }
    
    // SWATCH IMAGE
    const fhSwatchImg = document.querySelector('label img.rounded-full, .rounded-full img, [title] img.rounded-full');
    if (fhSwatchImg?.src) {
      data.finish_image = fhSwatchImg.src;
      console.log('[FH Debug] Found Swatch Image:', data.finish_image);
    }
    
    // DIMENSIONS - "24.00"w x 27.50"d x 37.25"h"
    const fhDimMatch = pageText.match(/([\d.]+)"?\s*w\s*x\s*([\d.]+)"?\s*d\s*x\s*([\d.]+)"?\s*h/i);
    if (fhDimMatch) data.size = `${fhDimMatch[1]}"W x ${fhDimMatch[2]}"D x ${fhDimMatch[3]}"H`;
    
    // ===== PRICE EXTRACTION =====
    // Four Hands: Find ALL dollar amounts, take first that's NOT MAP
    // The trade price appears BEFORE the MAP price on the page
    const allDollarAmounts = pageText.match(/\$[\d,]+\.?\d*/g) || [];
    console.log('[FH Debug] All prices found:', allDollarAmounts);
    
    for (let i = 0; i < allDollarAmounts.length; i++) {
      const priceStr = allDollarAmounts[i];
      const val = parseFloat(priceStr.replace(/[$,]/g, ''));
      
      // Skip if this price is immediately followed by "MAP" or preceded by "MAP"
      const priceIdx = pageText.indexOf(priceStr);
      const surroundingText = pageText.substring(Math.max(0, priceIdx - 10), priceIdx + priceStr.length + 10);
      
      if (val > 5 && val < 500000) {
        if (/MAP/i.test(surroundingText)) {
          data.msrp = val;
          console.log('[FH Debug] Found MAP/MSRP:', val);
        } else if (!data.price) {
          data.price = val;
          console.log('[FH Debug] Found Trade Price:', val);
        }
      }
    }
    
    // MAIN IMAGE
    const fhMainImg = document.querySelector('img[src*="S1200x1200"], img[src*="cloudfront.net"][src*="FRT"], [class*="product-image"] img, [class*="gallery"] img');
    if (fhMainImg?.src) {
      data.image_url = fhMainImg.src;
    }
  }
  
  // UTTERMOST - uttermost.com
  else if (domain.includes('uttermost')) {
    vendorDetected = 'UTTERMOST';
    
    // SKU - "SKU: 53083" pattern
    const uttSkuMatch = pageText.match(/SKU[:\s]+(\d+)/i);
    if (uttSkuMatch) data.sku = uttSkuMatch[1];
    
    // Also check URL for SKU - /lenoir-swivel-chair-53083
    if (!data.sku) {
      const urlSkuMatch = window.location.pathname.match(/-(\d{4,})$/);
      if (urlSkuMatch) data.sku = urlSkuMatch[1];
    }
    
    // PRICE - Uttermost shows "Your Price" or trade price
    const uttPriceMatch = pageText.match(/Your\s*Price[:\s]*\$?([\d,]+\.?\d*)/i) ||
                          pageText.match(/Trade[:\s]*\$?([\d,]+\.?\d*)/i) ||
                          pageText.match(/Net[:\s]*\$?([\d,]+\.?\d*)/i);
    if (uttPriceMatch) {
      data.price = parseFloat(uttPriceMatch[1].replace(/,/g, ''));
    }
    // Fallback - find price that's NOT MSRP/Retail
    if (!data.price) {
      const priceEls = document.querySelectorAll('[class*="price"]');
      for (const el of priceEls) {
        const text = el.innerText?.toLowerCase() || '';
        if (!text.includes('msrp') && !text.includes('retail') && !text.includes('compare')) {
          const match = text.match(/\$?([\d,]+\.?\d*)/);
          if (match) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (val > 5 && val < 100000) {
              data.price = val;
              break;
            }
          }
        }
      }
    }
    
    // MSRP
    const uttMsrpMatch = pageText.match(/(?:MSRP|Retail|Suggested)[:\s]*\$?([\d,]+\.?\d*)/i);
    if (uttMsrpMatch) data.msrp = parseFloat(uttMsrpMatch[1].replace(/,/g, ''));
    
    // Dimensions - "34 W X 29 H X 30 D (in)"
    const uttDimMatch = pageText.match(/(\d+)\s*W\s*X\s*(\d+)\s*H\s*X\s*(\d+)\s*D\s*\(?in/i);
    if (uttDimMatch) data.size = `${uttDimMatch[1]}"W x ${uttDimMatch[3]}"D x ${uttDimMatch[2]}"H`;
    
    // Color - from H1 heading like "Conifer Dining Armchair, Camel"
    const h1Text = document.querySelector('h1')?.innerText?.trim();
    if (h1Text) {
      const colorMatch = h1Text.match(/,\s*([A-Za-z][A-Za-z\s]+?)\s*$/);
      if (colorMatch) data.finish_color = colorMatch[1].trim();
    }
    
    // Also check page title
    if (!data.finish_color) {
      const titleColor = document.title.match(/,\s*([A-Za-z]+)\s*-/);
      if (titleColor) data.finish_color = titleColor[1];
    }
    
    // Also look for selected color name in swatches
    if (!data.finish_color) {
      const selectedSwatch = document.querySelector('.tile-root_selected-Au1[title], [class*="selected"][title], button.selected[title]');
      if (selectedSwatch?.title) data.finish_color = selectedSwatch.title;
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
    
    // Main image
    const uttMainImg = document.querySelector('.product-image img, [class*="gallery"] img, img[src*="uttermost"]');
    if (uttMainImg?.src) data.image_url = uttMainImg.src;
  }
  
  // GLOBAL VIEWS - globalviews.com
  else if (domain.includes('globalviews')) {
    vendorDetected = 'GLOBAL VIEWS';
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
    vendorDetected = 'ROWE FURNITURE';
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
    vendorDetected = 'REGINA ANDREW';
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
    vendorDetected = 'BERNHARDT';
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
  // v7.7.0 - Fixed price extraction to avoid $99k bug from price ranges
  else if (domain.includes('loloi')) {
    vendorDetected = 'LOLOI RUGS';
    console.log('[LOLOI v7.7.0] Starting Loloi extraction...');
    
    // SKU - from URL like /products/loe-03-natural-e or from page
    const urlSkuMatch = window.location.pathname.match(/\/products\/([a-z]{2,}-\d+)/i);
    if (urlSkuMatch) {
      data.sku = urlSkuMatch[1].toUpperCase();
    }
    if (!data.sku) {
      const pageSkuMatch = pageText.match(/([A-Z]{2,}-\d+)/i);
      if (pageSkuMatch) data.sku = pageSkuMatch[1];
    }
    console.log('[LOLOI] SKU:', data.sku);
    
    // COLOR - from product title like "LOE-03 NATURAL / ESPRESSO"
    const h1 = document.querySelector('h1');
    if (h1) {
      const h1Text = h1.innerText?.trim();
      // Extract color after the SKU pattern (e.g., "LOE-03 NATURAL / ESPRESSO" -> "NATURAL / ESPRESSO")
      const colorMatch = h1Text?.match(/[A-Z]{2,}-\d+\s+(.+)/i);
      if (colorMatch) {
        data.finish_color = colorMatch[1].trim();
        console.log('[LOLOI] Color from H1:', data.finish_color);
      }
    }
    // Fallback - look for color in breadcrumb or page
    if (!data.finish_color) {
      const colorMatch = pageText.match(/(?:Color|Colorway)[:\s]+([A-Za-z][A-Za-z\s\/\-]+?)(?:\n|,|$)/i);
      if (colorMatch) {
        data.finish_color = colorMatch[1].trim();
        console.log('[LOLOI] Color from text pattern:', data.finish_color);
      }
    }
    
    // ===== PRICE EXTRACTION - v7.7.0 =====
    // CRITICAL: Loloi shows "Price Range: $99 - $99,999" which caused the $99k bug
    // We must ONLY extract the ACTUAL price for the SELECTED size, not the max range price
    
    // Strategy 1: Look for a price element that's NOT part of a range
    // The actual price is typically displayed prominently, often near the selected size or Add to Cart
    
    // First, identify and SKIP any "Price Range" or "$XX - $XX" patterns
    const priceRangePattern = /\$[\d,]+\s*[-–—]\s*\$[\d,]+/g;
    const hasRange = pageText.match(priceRangePattern);
    if (hasRange) {
      console.log('[LOLOI] Price range detected - will avoid extracting from range:', hasRange[0]);
    }
    
    // Strategy 2: Find prices associated with the selected size option
    // On Loloi, each size has its own price displayed
    const selectedSizeEl = document.querySelector('[class*="selected"], [aria-checked="true"], .active');
    if (selectedSizeEl) {
      // Look for price within or near the selected element
      let priceInSelected = selectedSizeEl.innerText?.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceInSelected) {
        const val = parseFloat(priceInSelected[1].replace(/,/g, ''));
        // Sanity check: rug prices should be reasonable (most rugs $50 - $15,000)
        if (val > 30 && val < 20000) {
          data.price = val;
          console.log('[LOLOI] Price from selected size element:', data.price);
        }
      }
    }
    
    // Strategy 3: Look for Add to Cart button with price
    if (!data.price) {
      const addToCartBtn = document.querySelector('[class*="add-to-cart"], button[type="submit"], button[name="add"]');
      if (addToCartBtn) {
        const btnText = addToCartBtn.innerText;
        const priceMatch = btnText?.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          const val = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (val > 30 && val < 20000) {
            data.price = val;
            console.log('[LOLOI] Price from Add to Cart button:', data.price);
          }
        }
      }
    }
    
    // Strategy 4: Look for standalone price elements (NOT in a range context)
    if (!data.price) {
      const priceEls = document.querySelectorAll('[class*="price"], [data-price]');
      for (const el of priceEls) {
        const elText = el.innerText?.trim() || '';
        // SKIP if this element contains a range (dash between two prices)
        if (/\$[\d,]+\s*[-–—]\s*\$[\d,]+/.test(elText)) {
          console.log('[LOLOI] Skipping price range element:', elText);
          continue;
        }
        // SKIP if labeled as MAP/MSRP
        if (/MAP|MSRP|retail|compare/i.test(elText)) {
          continue;
        }
        const match = elText.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          // STRICT validation: Skip obviously wrong prices
          if (val > 30 && val < 15000) {
            data.price = val;
            console.log('[LOLOI] Price from element:', data.price, '- text was:', elText);
            break;
          } else {
            console.log('[LOLOI] Skipping unreasonable price:', val);
          }
        }
      }
    }
    
    // MSRP - labeled as MAP (but NOT from a range)
    const mapMatch = pageText.match(/\$(\d{1,3}(?:,\d{3})*)\s*MAP/i);
    if (mapMatch) {
      const msrpVal = parseFloat(mapMatch[1].replace(/,/g, ''));
      if (msrpVal < 50000) {
        data.msrp = msrpVal;
        console.log('[LOLOI] MSRP (MAP):', data.msrp);
      }
    }
    
    // Rug dimensions - from selected size like "8'6" x 11'6""
    const selectedSize = document.querySelector('[class*="selected"] [class*="size"], .size-option.selected, [aria-checked="true"]');
    if (selectedSize) {
      const sizeText = selectedSize.innerText?.trim();
      const dimMatch = sizeText?.match(/([\d'\"]+)\s*x\s*([\d'\"]+)/i);
      if (dimMatch) {
        data.size = `${dimMatch[1]} x ${dimMatch[2]}`;
        console.log('[LOLOI] Size from selected:', data.size);
      }
    }
    // Fallback dimension pattern
    if (!data.size) {
      const loDimMatch = pageText.match(/([\d]+[''][\d]*["]?)\s*x\s*([\d]+[''][\d]*["]?)/);
      if (loDimMatch) {
        data.size = `${loDimMatch[1]} x ${loDimMatch[2]}`;
        console.log('[LOLOI] Size from text pattern:', data.size);
      }
    }
    
    // Main rug image
    const loMainImg = document.querySelector('.product-image img, .pdp-image img, [class*="gallery"] img, img[src*="loloi"]');
    if (loMainImg?.src) {
      data.image_url = loMainImg.src;
      console.log('[LOLOI] Main image found');
    }
    
    console.log('[LOLOI v7.7.0] Extraction complete');
  }
  
  // VISUAL COMFORT - visualcomfort.com
  else if (domain.includes('visualcomfort')) {
    vendorDetected = 'VISUAL COMFORT';
    // SKU - Format: 700MDP3 or TOB 5003BZ-L
    const vcSkuMatch = pageText.match(/(?:SKU|Item|Style)[:\s#]*([A-Z0-9]{3,}[A-Z0-9\-]*)/i);
    if (vcSkuMatch) data.sku = vcSkuMatch[1].replace(/\s+/g, '').trim();
    
    // URL pattern - /modernrail-pendant-700mdp3
    if (!data.sku) {
      const urlMatch = window.location.pathname.match(/-([0-9]+[a-z0-9]*)/i);
      if (urlMatch) data.sku = urlMatch[1].toUpperCase();
    }
    
    // Dimensions - Length: 12.8" Width: 12.8" Height: 36"
    const vcLength = pageText.match(/Length[:\s]*([\d.]+)"/i);
    const vcHeight = pageText.match(/Height[:\s]*([\d.]+)"/i);
    const vcWidth = pageText.match(/Width[:\s]*([\d.]+)"/i);
    if (vcWidth && vcHeight) {
      data.size = `${vcWidth[1]}"W x ${vcHeight[1]}"H`;
    } else if (vcLength && vcHeight) {
      data.size = `${vcLength[1]}"W x ${vcHeight[1]}"H`;
    }
    
    // Finish from selected option - look for specific finish selector
    const vcFinishEl = document.querySelector('[class*="finish"].selected, .finish-option.active, [data-finish].selected, [class*="swatch"][class*="selected"]');
    if (vcFinishEl) {
      const finishText = vcFinishEl.innerText?.trim() || vcFinishEl.dataset.finish || vcFinishEl.title;
      // Only use if it looks like a finish name, not location
      if (finishText && finishText.length < 40 && !/united|states|country|ship/i.test(finishText)) {
        data.finish_color = finishText;
      }
    }
    
    // Fallback - look for Finish: in a structured way
    if (!data.finish_color) {
      // Look for finish in the product specs area, NOT general page text
      const specElements = document.querySelectorAll('[class*="spec"], [class*="detail"], table td, dl dd');
      for (const el of specElements) {
        const prevText = el.previousElementSibling?.innerText?.toLowerCase() || '';
        if (prevText.includes('finish')) {
          const finishText = el.innerText?.trim();
          if (finishText && finishText.length < 40 && !/united|states|country|ship/i.test(finishText)) {
            data.finish_color = finishText;
            break;
          }
        }
      }
    }
  }
  
  // HVL GROUP - hvlgroup.com (Hudson Valley, Troy, Mitzi, Corbett)
  else if (domain.includes('hvlgroup') || domain.includes('hudsonvalley') || domain.includes('mitzi') || domain.includes('corbett') || domain.includes('troylighting')) {
    vendorDetected = 'HVL GROUP';
    
    // PRODUCT NAME - from H1 (e.g., "Scarlett")
    const hvlH1 = document.querySelector('h1');
    if (hvlH1) data.name = hvlH1.innerText?.trim();
    
    // SKU from page text - "SKU: H300701-GL/BK"
    const hvlSkuTextMatch = pageText.match(/SKU[:\s]*([A-Z0-9]+-[A-Z0-9\/]+)/i);
    if (hvlSkuTextMatch) data.sku = hvlSkuTextMatch[1];
    
    // SKU from URL fallback - /Product/H300701-GL/BK/
    if (!data.sku) {
      const hvlSkuMatch = window.location.pathname.match(/\/([A-Z0-9]+-[A-Z0-9]+)/i);
      if (hvlSkuMatch) data.sku = hvlSkuMatch[1];
    }
    
    // Dimensions - Width/Diameter: 5" Height: 16.75"
    const hvlWidth = pageText.match(/(?:Width|Diameter)[:\s]*([\d.]+)"/i);
    const hvlHeight = pageText.match(/Height[:\s]*([\d.]+)"/i);
    if (hvlWidth && hvlHeight) {
      data.size = `${hvlWidth[1]}"W x ${hvlHeight[1]}"H`;
    }
    
    // Finish/Color - look for "Living Finish" section or "Finish" in specs
    // On HVL, the finish is often in a table row
    const hvlFinishRow = document.evaluate(
      "//td[contains(text(),'Finish') or contains(text(),'Living Finish')]/following-sibling::td",
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    if (hvlFinishRow) {
      data.finish_color = hvlFinishRow.innerText?.trim();
    }
    
    // Fallback - look for finish pattern in text
    if (!data.finish_color) {
      const hvlFinishMatch = pageText.match(/(?:Living\s*)?Finish[:\s]+([A-Za-z][A-Za-z\s\-\/]+?)(?:\n|,|Width|Height|$)/i);
      if (hvlFinishMatch && hvlFinishMatch[1].trim().length > 1) {
        data.finish_color = hvlFinishMatch[1].trim();
      }
    }
    
    // Main image
    const hvlMainImg = document.querySelector('.product-image img, [class*="gallery"] img, img[src*="mitzi"], img[src*="hudson"]');
    if (hvlMainImg?.src) data.image_url = hvlMainImg.src;
    
    // Swatch image
    const hvlSwatchImg = document.querySelector('img[src*="SWATCH"], img[src*="swatch"], [class*="swatch"] img');
    if (hvlSwatchImg?.src) data.finish_image = hvlSwatchImg.src;
  }
  
  // VANGUARD FURNITURE - vanguardfurniture.com / vandh.com
  else if (domain.includes('vanguard') || domain.includes('vandh')) {
    vendorDetected = 'VANGUARD/V&H';
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
    vendorDetected = 'FLOW DECOR';
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
    vendorDetected = 'CRESTVIEW';
    // SKU - CVTOP3594, CVCZR287, etc. format (starts with CV or is in URL like /mistbound-cvtop3594)
    const cvUrlMatch = window.location.pathname.match(/[_-]?(cv[a-z]{2,}\d+)/i) ||
                       window.location.pathname.match(/(cv[a-z]+\d+)/i);
    if (cvUrlMatch) {
      data.sku = cvUrlMatch[1].toUpperCase();
    } else {
      // Look for Crestview SKU patterns in text: CV followed by 2+ letters then numbers
      const cvTextMatch = pageText.match(/\b(CV[A-Z]{2,}\d+)\b/i);
      if (cvTextMatch) data.sku = cvTextMatch[1].toUpperCase();
    }
    
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
    vendorDetected = 'BASSETT MIRROR';
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
    vendorDetected = 'EICHHOLTZ';
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
    vendorDetected = 'MYOH AMERICA';
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
    vendorDetected = 'SAFAVIEH';
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
    vendorDetected = 'SURYA';
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
    vendorDetected = 'ZEE LIGHTING';
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
    vendorDetected = 'HUBBARDTON FORGE';
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
    vendorDetected = 'HINKLEY';
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
    vendorDetected = 'ELEGANT LIGHTING';
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
    vendorDetected = 'GABBY';
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

  // ===================== UNIVERSAL PRICE/COLOR EXTRACTION =====================
  // Apply to ALL vendors - use helper functions for consistency
  
  // Extract TRADE price (not MSRP) if vendor-specific didn't find it
  if (!data.price) {
    data.price = extractTradePrice();
  }
  
  // Extract MSRP if available
  if (!data.msrp) {
    data.msrp = extractMSRP();
  }
  
  // Extract color/finish if vendor-specific didn't find it
  if (!data.finish_color) {
    data.finish_color = extractColor();
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
  // ONLY run generic price extraction if vendor-specific code didn't find a price
  if (!data.price) {
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
  }
  // Text patterns - also only if no price yet
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

  // ===================== MULTI-IMAGE COLLECTION =====================
  // Collect ALL product images for gallery selection
  data.all_images = [];
  const seenUrls = new Set();
  
  // Add main image first if we have it
  if (data.image_url) {
    data.all_images.push({ url: data.image_url, isPrimary: true });
    seenUrls.add(data.image_url);
  }
  
  // Common gallery selectors for various vendors
  const gallerySelectors = [
    '.swiper-slide img', '.swiper-wrapper img',
    '[class*="gallery"] img', '[class*="Gallery"] img',
    '[class*="product-image"] img', '[class*="ProductImage"] img',
    '[class*="thumbnail"] img', '[class*="Thumbnail"] img',
    '[class*="carousel"] img', '[class*="slider"] img',
    'img[data-zoom-image]', 'img[data-large]', 'img[data-full]', 'img[data-src]',
    '.product-gallery img', '.product-images img', '.image-gallery img',
    '#product-images img', '.pdp-gallery img',
    'img[src*="_PRM_"]', 'img[src*="_FRT_"]', 'img[src*="_ALT_"]', 'img[src*="_DET_"]',
    'img[srcset]'
  ];
  
  for (const selector of gallerySelectors) {
    try {
      const images = document.querySelectorAll(selector);
      for (const img of images) {
        let imgUrl = null;
        
        // Try to get highest quality URL from srcset
        if (img.srcset) {
          const srcsetParts = img.srcset.split(',');
          let maxWidth = 0;
          for (const part of srcsetParts) {
            const match = part.trim().match(/(\S+)\s+(\d+)w/);
            if (match && parseInt(match[2]) > maxWidth) {
              maxWidth = parseInt(match[2]);
              imgUrl = match[1];
            }
          }
        }
        
        // Try data attributes for high-res versions
        imgUrl = imgUrl || 
                 img.getAttribute('data-zoom-image') || 
                 img.getAttribute('data-large') || 
                 img.getAttribute('data-full-size') ||
                 img.getAttribute('data-src') ||
                 img.src;
        
        // Validate URL
        if (imgUrl && imgUrl.startsWith('http') && !seenUrls.has(imgUrl)) {
          // Filter out tiny icons, logos, etc.
          const isLikelyProduct = !imgUrl.includes('logo') && 
                                  !imgUrl.includes('icon') && 
                                  !imgUrl.includes('badge') &&
                                  !imgUrl.includes('payment') &&
                                  !imgUrl.includes('social') &&
                                  !imgUrl.includes('1x1') &&
                                  (img.naturalWidth > 100 || !img.naturalWidth);
          
          if (isLikelyProduct) {
            // Try to upgrade to higher resolution
            let highResUrl = imgUrl
              .replace(/w_\d+/g, 'w_2400')
              .replace(/h_\d+/g, 'h_2400')
              .replace(/\/\d+x\d+\//g, '/2400x2400/')
              .replace(/S\d+x\d+/g, 'S2400x2400');
            
            data.all_images.push({ 
              url: highResUrl, 
              isPrimary: false,
              originalUrl: imgUrl
            });
            seenUrls.add(imgUrl);
            seenUrls.add(highResUrl);
          }
        }
      }
    } catch(e) { /* ignore selector errors */ }
  }
  
  console.log(`📸 Found ${data.all_images.length} product images`);

  // ===================== DEBUG LOGGING =====================
  // v7.7.0 - Log vendor detection and extracted data for troubleshooting
  console.log('%c[Design Ready Scraper v7.7.3]', 'background: #6366f1; color: white; padding: 2px 6px; border-radius: 3px;');
  console.log('Domain:', domain);
  console.log('Vendor Logic Used:', vendorDetected);
  console.log('Extracted Data:', JSON.stringify(data, null, 2));
  console.table({
    'Name': data.name || '❌ MISSING',
    'SKU': data.sku || '❌ MISSING',
    'Price': data.price || '❌ MISSING',
    'Size': data.size || '❌ MISSING',
    'Color/Finish': data.finish_color || '❌ MISSING',
    'Main Image': data.image_url ? '✅ Found' : '❌ MISSING',
    'Swatch Image': data.finish_image ? '✅ Found' : '⚠️ Not found'
  });

  return data;
}

// ============================================================================
// SEND TO APP + LIBRARIES
// ============================================================================

const BACKEND_URL = 'https://app.estdesignco.com';

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
    if (scrapedData.remarks) params.set('remarks', scrapedData.remarks);
    
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
    showToast('⚠️ No image available');
    return;
  }
  
  const imageUrl = scrapedData.image_url;
  console.log('[Scraper] Attempting to copy image:', imageUrl);
  
  // Method 1: Try to find the actual image on the page and copy it directly
  try {
    const imgElements = document.querySelectorAll('img');
    let targetImg = null;
    
    for (const img of imgElements) {
      if (img.src === imageUrl || img.src.includes(imageUrl.split('?')[0].split('/').pop())) {
        targetImg = img;
        break;
      }
    }
    
    if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = targetImg.naturalWidth;
      canvas.height = targetImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      
      try {
        ctx.drawImage(targetImg, 0, 0);
        const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (pngBlob && navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          showToast('✅ Image copied!');
          return;
        }
      } catch (canvasErr) {
        console.log('[Scraper] Canvas method failed:', canvasErr.message);
      }
    }
  } catch (method1Err) {
    console.log('[Scraper] Method 1 failed:', method1Err.message);
  }
  
  // Fallback: Copy the image URL using execCommand
  const fallbackCopyUrl = (url) => {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  };
  
  if (fallbackCopyUrl(imageUrl)) {
    showToast('📋 Image URL copied!');
  } else {
    showToast('❌ Copy failed - URL: ' + imageUrl.substring(0, 40) + '...');
  }
}

async function copyLink() {
  const url = scrapedData?.url || window.location.href;
  console.log('[Scraper] Copying link:', url);
  
  // Method 1: Modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('✅ Link copied!');
      return;
    } catch (e) {
      console.log('[Scraper] Clipboard API failed:', e.message);
    }
  }
  
  // Method 2: Fallback using execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (success) {
      showToast('✅ Link copied!');
      return;
    }
  } catch (e) {
    console.log('[Scraper] execCommand failed:', e.message);
  }
  
  // Method 3: Show the URL for manual copy
  showToast('📋 URL: ' + url.substring(0, 50) + '...');
  console.log('[Scraper] Full URL for manual copy:', url);
}

async function copyImageNoBackground() {
  if (!scrapedData || !scrapedData.image_url) {
    showToast('⚠️ No image available');
    return;
  }
  
  const imageUrl = scrapedData.image_url;
  console.log('[Scraper] Removing background from:', imageUrl);
  showToast('⏳ Removing background...');
  
  // Update button to show loading
  const btn = document.getElementById('dr-copy-nobg-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Processing...';
  btn.disabled = true;
  
  try {
    // Call backend API to remove background
    const response = await fetch(`${BACKEND_URL}/api/remove-background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Background removal failed');
    }
    
    const result = await response.json();
    
    if (result.success && result.image_base64) {
      // Convert base64 to blob
      const binaryString = atob(result.image_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      
      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('✅ Image copied (no background)!');
          btn.innerHTML = originalText;
          btn.disabled = false;
          return;
        } catch (clipErr) {
          console.log('[Scraper] Clipboard write failed:', clipErr.message);
        }
      }
      
      // Fallback: Open image in new tab for manual copy
      const dataUrl = `data:image/png;base64,${result.image_base64}`;
      window.open(dataUrl, '_blank');
      showToast('📷 Image opened in new tab - right-click to copy');
    } else {
      throw new Error('No image data received');
    }
    
  } catch (error) {
    console.error('[Scraper] Background removal error:', error);
    showToast('❌ ' + error.message);
  }
  
  btn.innerHTML = originalText;
  btn.disabled = false;
}

function copyImageWithLink() {
  copyImage();
}

// ============================================================================
// HOUZZ PRO CLIPPER INTEGRATION
// Detects and syncs data from Houzz Pro Clipper when it's open
// ============================================================================

let houzzSyncInterval = null;

function detectHouzzClipper() {
  // Houzz Pro Clipper injects a modal/iframe into the page
  // Look for common Houzz clipper elements
  const houzzSelectors = [
    'iframe[src*="houzz"]',
    '[class*="houzz-clipper"]',
    '[class*="HouzzClipper"]',
    '[id*="houzz-clipper"]',
    '[data-houzz]',
    // Houzz clipper modal container
    'div[class*="clipper-modal"]',
    'div[class*="ClipperModal"]',
    // Shadow DOM container that Houzz might use
    'houzz-clipper',
    '#houzz-clipper-root',
    // Generic modal that might be Houzz
    'div[style*="z-index: 2147483647"]'
  ];
  
  for (const selector of houzzSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      console.log('[Houzz Sync] Found Houzz clipper element:', selector);
      return el;
    }
  }
  
  // Also check for iframes that might contain Houzz
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      if (iframe.src && (iframe.src.includes('houzz') || iframe.src.includes('clipper'))) {
        console.log('[Houzz Sync] Found Houzz iframe:', iframe.src);
        return iframe;
      }
    } catch (e) {}
  }
  
  return null;
}

function extractHouzzClipperData() {
  // Try to extract data from Houzz clipper's UI elements
  const data = {
    name: null,
    price: null,
    sku: null,
    size: null,
    finish_color: null,
    image_url: null,
    vendor: null,
    description: null
  };
  
  // Strategy 1: Look for input fields that Houzz clipper populates
  // These are typically named inputs or have data attributes
  const inputSelectors = {
    name: ['input[name*="name" i]', 'input[name*="title" i]', 'input[placeholder*="name" i]', '[data-field="name"]'],
    price: ['input[name*="price" i]', 'input[type="number"][name*="cost" i]', '[data-field="price"]'],
    sku: ['input[name*="sku" i]', 'input[name*="model" i]', 'input[name*="item" i]', '[data-field="sku"]'],
    size: ['input[name*="dimension" i]', 'input[name*="size" i]', 'textarea[name*="dimension" i]', '[data-field="dimensions"]'],
    description: ['textarea[name*="description" i]', 'textarea[name*="note" i]', '[data-field="description"]']
  };
  
  for (const [field, selectors] of Object.entries(inputSelectors)) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.value && el.value.trim()) {
        data[field] = el.value.trim();
        console.log(`[Houzz Sync] Found ${field}:`, data[field]);
        break;
      }
    }
  }
  
  // Strategy 2: Look for visible text in modal that might be product data
  // Houzz clipper shows extracted data in a modal with labels
  const labelValuePairs = document.querySelectorAll('label, [class*="label"], [class*="field-label"]');
  for (const label of labelValuePairs) {
    const labelText = label.innerText?.toLowerCase().trim();
    const valueEl = label.nextElementSibling || label.querySelector('input, textarea, span');
    const value = valueEl?.value || valueEl?.innerText;
    
    if (!value || !value.trim()) continue;
    
    if (labelText?.includes('name') || labelText?.includes('title')) {
      data.name = data.name || value.trim();
    } else if (labelText?.includes('price') || labelText?.includes('cost')) {
      const priceMatch = value.match(/[\d,]+\.?\d*/);
      if (priceMatch) data.price = data.price || parseFloat(priceMatch[0].replace(/,/g, ''));
    } else if (labelText?.includes('sku') || labelText?.includes('model') || labelText?.includes('item')) {
      data.sku = data.sku || value.trim();
    } else if (labelText?.includes('dimension') || labelText?.includes('size')) {
      data.size = data.size || value.trim();
    } else if (labelText?.includes('vendor') || labelText?.includes('brand') || labelText?.includes('manufacturer')) {
      data.vendor = data.vendor || value.trim();
    }
  }
  
  // Strategy 3: Look for product images in clipper modal
  // Usually a prominent image with specific class or in an image container
  const imgSelectors = [
    '[class*="clipper"] img',
    '[class*="product-image"] img',
    '[class*="main-image"] img',
    'img[src*="product"]',
    '.modal img[src^="http"]'
  ];
  
  for (const selector of imgSelectors) {
    const img = document.querySelector(selector);
    if (img && img.src && img.src.startsWith('http') && img.naturalWidth > 100) {
      data.image_url = img.src;
      console.log('[Houzz Sync] Found image:', data.image_url);
      break;
    }
  }
  
  // Strategy 4: Check if any data was manually highlighted/selected
  // Users might have text selected that represents product info
  const selection = window.getSelection().toString().trim();
  if (selection && selection.length > 2 && selection.length < 500) {
    // If it looks like a price
    if (/^\$?[\d,]+\.?\d*$/.test(selection.replace(/\s/g, ''))) {
      const priceVal = parseFloat(selection.replace(/[$,\s]/g, ''));
      if (priceVal > 0 && !data.price) data.price = priceVal;
    }
    // If it looks like a SKU (alphanumeric with dashes)
    else if (/^[A-Z0-9-]{3,20}$/i.test(selection)) {
      if (!data.sku) data.sku = selection;
    }
  }
  
  // Log what we found
  const foundFields = Object.entries(data).filter(([k, v]) => v !== null).map(([k]) => k);
  console.log('[Houzz Sync] Extracted fields:', foundFields);
  
  return data;
}

function syncFromHouzz() {
  console.log('[Houzz Sync] Starting sync from Houzz Pro Clipper...');
  
  const houzzData = extractHouzzClipperData();
  
  // Check if we got any useful data
  const hasData = Object.values(houzzData).some(v => v !== null);
  
  if (!hasData) {
    showToast('⚠️ No Houzz data detected. Open the Houzz Clipper first.');
    return false;
  }
  
  // Merge with existing scraped data (Houzz data takes priority for empty fields)
  if (!scrapedData) {
    scrapedData = {
      url: window.location.href,
      vendor: null,
      name: null,
      sku: null,
      price: null,
      msrp: null,
      size: null,
      finish_color: null,
      finish_image: null,
      image_url: null,
      remarks: null
    };
  }
  
  let syncedCount = 0;
  for (const [field, value] of Object.entries(houzzData)) {
    if (value !== null && (scrapedData[field] === null || scrapedData[field] === undefined || scrapedData[field] === '')) {
      scrapedData[field] = value;
      updateFieldDisplay(field, value);
      syncedCount++;
    }
  }
  
  if (syncedCount > 0) {
    showToast(`✅ Synced ${syncedCount} field(s) from Houzz!`);
    return true;
  } else {
    showToast('ℹ️ All fields already have data');
    return false;
  }
}

function startHouzzAutoSync() {
  // Auto-detect Houzz clipper and sync when it appears
  if (houzzSyncInterval) {
    clearInterval(houzzSyncInterval);
  }
  
  houzzSyncInterval = setInterval(() => {
    const houzzClipper = detectHouzzClipper();
    if (houzzClipper && sidePanel && sidePanel.style.display === 'block') {
      // Houzz clipper is open and our panel is open - try to sync
      console.log('[Houzz Sync] Houzz clipper detected, attempting auto-sync...');
      syncFromHouzz();
    }
  }, 2000); // Check every 2 seconds
}

function stopHouzzAutoSync() {
  if (houzzSyncInterval) {
    clearInterval(houzzSyncInterval);
    houzzSyncInterval = null;
  }
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openScraper') {
    scrapeAndShow();
    // Start Houzz auto-sync when our panel opens
    startHouzzAutoSync();
    sendResponse({ success: true });
  }
  
  if (request.action === 'syncFromHouzz') {
    const result = syncFromHouzz();
    sendResponse({ success: result });
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
