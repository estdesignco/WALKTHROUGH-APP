const BACKEND_URL = 'https://edit-scraped-data.preview.emergentagent.com';
let projectData = null;

// Load saved settings
chrome.storage.local.get(['projectId', 'roomId'], (result) => {
  if (result.projectId) {
    document.getElementById('projectId').value = result.projectId;
  }
});

// Always show edit section so user can manually type in fields
document.getElementById('editSection').classList.remove('hidden');

// Load project
document.getElementById('loadBtn').addEventListener('click', async () => {
  const projectId = document.getElementById('projectId').value.trim();
  if (!projectId) {
    showStatus('Please enter a Project ID', 'error');
    return;
  }

  showStatus('Loading project...', 'info');
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
    if (!res.ok) {
      throw new Error(`Failed to load project (HTTP ${res.status})`);
    }
    
    projectData = await res.json();
    const roomSelect = document.getElementById('roomSelect');
    roomSelect.innerHTML = '<option value="">-- Select a room --</option>';
    
    if (!projectData.rooms || projectData.rooms.length === 0) {
      throw new Error('No rooms found in project');
    }
    
    projectData.rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    });
    
    chrome.storage.local.set({ projectId });
    document.getElementById('scanBtn').disabled = false;
    
    showStatus(`Loaded project with ${projectData.rooms.length} rooms!`, 'success');
  } catch (e) {
    showStatus(`Error loading project: ${e.message}`, 'error');
    console.error('Project load error:', e);
  }
});

// Scan Canva board - populate editable fields with first result
document.getElementById('scanBtn').addEventListener('click', async () => {
  const roomId = document.getElementById('roomSelect').value;
  if (!roomId) {
    showStatus('Please select a room first!', 'warning');
    return;
  }

  const room = projectData.rooms.find(r => r.id === roomId);
  if (!room) {
    showStatus('Room not found!', 'error');
    return;
  }

  chrome.storage.local.set({ roomId });

  showStatus('Scanning Canva board for TRADE vendor products...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    if (!tab.url || !tab.url.includes('canva.com')) {
      showStatus('Please navigate to a Canva design page first!', 'error');
      return;
    }
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      showStatus('Scanner loaded on page', 'success');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (injectError) {
      console.log('Content script might already be loaded:', injectError);
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'scanPage' }, async (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      
      if (!response || !response.images) {
        showStatus('No response from content script', 'error');
        return;
      }

      const images = response.images;
      
      if (images.length === 0) {
        showStatus('No product links found on this Canva board', 'warning');
        return;
      }
      
      showStatus(`Found ${images.length} product link(s)! Scraping first one...`, 'success');

      // Scrape the first product and populate editable fields
      const { url } = images[0];
      try {
        const scrapeRes = await fetch(`${BACKEND_URL}/api/scrape-product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, auto_clip_to_houzz: true })
        });

        if (!scrapeRes.ok) {
          throw new Error(`Scrape failed (HTTP ${scrapeRes.status})`);
        }

        const productData = await scrapeRes.json();
        
        // Populate the editable fields
        document.getElementById('editName').value = productData.name || '';
        document.getElementById('editVendor').value = productData.vendor || '';
        document.getElementById('editSku').value = productData.sku || '';
        document.getElementById('editPrice').value = productData.price || productData.cost || '';
        document.getElementById('editMsrp').value = productData.msrp || '';
        document.getElementById('editSize').value = productData.size || '';
        document.getElementById('editFinish').value = productData.finish_color || '';
        document.getElementById('editLink').value = url || '';
        document.getElementById('editRemarks').value = productData.remarks || '';
        
        // Show edit section
        document.getElementById('editSection').classList.remove('hidden');
        
        showStatus(`Scraped: ${productData.name || 'Product'}. Edit fields below and click SEND.`, 'success');
        
        // If there are more products, notify user
        if (images.length > 1) {
          showStatus(`${images.length - 1} more product(s) found. Send this one first, then scan again.`, 'info');
        }
      } catch (e) {
        showStatus(`Scrape failed: ${e.message}. You can still type in the fields manually!`, 'error');
        document.getElementById('editLink').value = url;
        document.getElementById('editSection').classList.remove('hidden');
      }
    });
  } catch (e) {
    showStatus(`Critical error: ${e.message}`, 'error');
    console.error('Scan error:', e);
  }
});

// SEND TO APP - takes whatever is in the editable fields and sends to the app
document.getElementById('sendBtn').addEventListener('click', async () => {
  const roomId = document.getElementById('roomSelect').value;
  if (!roomId) {
    showStatus('Please select a room first!', 'warning');
    return;
  }

  const room = projectData?.rooms?.find(r => r.id === roomId);
  if (!room) {
    showStatus('Please load a project and select a room first!', 'warning');
    return;
  }

  // Gather all field values
  const itemData = {
    name: document.getElementById('editName').value.trim(),
    vendor: document.getElementById('editVendor').value.trim(),
    sku: document.getElementById('editSku').value.trim(),
    price: document.getElementById('editPrice').value.trim(),
    msrp: document.getElementById('editMsrp').value.trim(),
    size: document.getElementById('editSize').value.trim(),
    finish_color: document.getElementById('editFinish').value.trim(),
    link: document.getElementById('editLink').value.trim(),
    remarks: document.getElementById('editRemarks').value.trim()
  };

  if (!itemData.name && !itemData.sku && !itemData.vendor) {
    showStatus('Please fill in at least one field (name, vendor, or SKU)', 'warning');
    return;
  }

  showStatus('Sending to app...', 'info');

  try {
    // Find a subcategory to add the item to
    const category = categorizeItem(itemData.name);
    let subcategoryId = null;

    for (const cat of room.categories || []) {
      if (cat.name.toLowerCase().includes(category.toLowerCase())) {
        if (cat.subcategories && cat.subcategories.length > 0) {
          subcategoryId = cat.subcategories[0].id;
          break;
        }
      }
    }

    if (!subcategoryId && room.categories && room.categories.length > 0) {
      for (const cat of room.categories) {
        if (cat.subcategories && cat.subcategories.length > 0) {
          subcategoryId = cat.subcategories[0].id;
          break;
        }
      }
    }

    if (!subcategoryId) {
      showStatus('No subcategory available in room. Please add a category first.', 'error');
      return;
    }

    // Parse price
    let cost = 0;
    if (itemData.price) {
      cost = parseFloat(String(itemData.price).replace(/[^0-9.]/g, '')) || 0;
    }

    const addRes = await fetch(`${BACKEND_URL}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: itemData.name || '',
        vendor: itemData.vendor || '',
        sku: itemData.sku || '',
        cost: cost,
        size: itemData.size || '',
        finish_color: itemData.finish_color || '',
        link: itemData.link || '',
        remarks: itemData.remarks || '',
        image_url: '',
        quantity: 1,
        subcategory_id: subcategoryId,
        status: ''
      })
    });

    if (!addRes.ok) {
      throw new Error(`Add to checklist failed (HTTP ${addRes.status})`);
    }

    showStatus(`Successfully added "${itemData.name || 'Item'}" to ${room.name}!`, 'success');
    
    // Clear fields after successful send
    clearAllFields();
    
  } catch (e) {
    showStatus(`Failed to send: ${e.message}`, 'error');
    console.error('Send error:', e);
  }
});

// Clear all editable fields
document.getElementById('clearFieldsBtn').addEventListener('click', () => {
  clearAllFields();
  showStatus('All fields cleared.', 'info');
});

function clearAllFields() {
  document.getElementById('editName').value = '';
  document.getElementById('editVendor').value = '';
  document.getElementById('editSku').value = '';
  document.getElementById('editPrice').value = '';
  document.getElementById('editMsrp').value = '';
  document.getElementById('editSize').value = '';
  document.getElementById('editFinish').value = '';
  document.getElementById('editLink').value = '';
  document.getElementById('editRemarks').value = '';
}

function categorizeItem(name) {
  const text = (name || '').toLowerCase();
  const categories = {
    'Lighting': ['light', 'lamp', 'chandelier', 'sconce', 'pendant', 'fixture', 'lantern'],
    'Furniture': ['chair', 'sofa', 'table', 'desk', 'bed', 'dresser', 'cabinet', 'bench', 'ottoman'],
    'Decor': ['pillow', 'rug', 'art', 'vase', 'mirror', 'frame', 'plant', 'sculpture', 'bowl']
  };
  
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => text.includes(kw))) return cat;
  }
  return 'Furniture';
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.classList.remove('hidden');
  
  const line = document.createElement('div');
  line.className = `status-line ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  line.textContent = `[${timestamp}] ${message}`;
  
  statusDiv.appendChild(line);
  statusDiv.scrollTop = statusDiv.scrollHeight;
}
