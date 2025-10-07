const BACKEND_URL = 'https://canvalink.preview.emergentagent.com';
let projectData = null;

// Load saved settings
chrome.storage.local.get(['projectId', 'roomId'], (result) => {
  if (result.projectId) {
    document.getElementById('projectId').value = result.projectId;
  }
});

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
    if (!res.ok) throw new Error('Failed to load project');
    
    projectData = await res.json();
    const roomSelect = document.getElementById('roomSelect');
    roomSelect.innerHTML = '<option value="">-- Select a room --</option>';
    
    (projectData.rooms || []).forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
    });
    
    // Save project ID
    chrome.storage.local.set({ projectId });
    
    // Enable scan button
    document.getElementById('scanBtn').disabled = false;
    
    showStatus(`✅ Loaded ${projectData.rooms.length} rooms!`, 'success');
  } catch (e) {
    showStatus('❌ Error loading project: ' + e.message, 'error');
  }
});

// Scan Canva board
document.getElementById('scanBtn').addEventListener('click', async () => {
  const roomId = document.getElementById('roomSelect').value;
  if (!roomId) {
    showStatus('Please select a room first!', 'error');
    return;
  }

  const room = projectData.rooms.find(r => r.id === roomId);
  if (!room) {
    showStatus('Room not found!', 'error');
    return;
  }

  // Save room ID
  chrome.storage.local.set({ roomId });

  showStatus('🔍 Scanning Canva page for images with links...', 'info');

  // Send message to content script to scan the page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'scanPage' }, async (response) => {
    console.log('📦 Received response from content script:', response);
    
    if (chrome.runtime.lastError) {
      showStatus('❌ Error: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    
    if (!response || !response.images) {
      showStatus('❌ No response from content script. Try refreshing the Canva page.', 'error');
      return;
    }

    const images = response.images;
    showStatus(`📸 Found ${images.length} product links! Starting import...`, 'info');
    console.log('🎯 Product links to process:', images);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
      const { url } = images[i];
      showStatus(`[${i + 1}/${images.length}] Scraping: ${url}`, 'info');

      try {
        // Scrape product
        const scrapeRes = await fetch(`${BACKEND_URL}/api/scrape-product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, auto_clip_to_houzz: true })
        });

        if (!scrapeRes.ok) {
          throw new Error(`Scrape failed: ${scrapeRes.status}`);
        }

        const productData = await scrapeRes.json();
        showStatus(`✓ Scraped: ${productData.name}`, 'success');

        // Smart categorization
        const category = categorizeItem(productData.name);
        let subcategoryId = null;

        for (const cat of room.categories || []) {
          if (cat.name.includes(category)) {
            if (cat.subcategories && cat.subcategories.length > 0) {
              subcategoryId = cat.subcategories[0].id;
              break;
            }
          }
        }

        // Fallback
        if (!subcategoryId && room.categories && room.categories.length > 0) {
          for (const cat of room.categories) {
            if (cat.subcategories && cat.subcategories.length > 0) {
              subcategoryId = cat.subcategories[0].id;
              break;
            }
          }
        }

        if (!subcategoryId) {
          throw new Error('No subcategory found');
        }

        // Add to checklist
        const addRes = await fetch(`${BACKEND_URL}/api/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...productData,
            subcategory_id: subcategoryId,
            status: '',
            quantity: 1
          })
        });

        if (!addRes.ok) {
          throw new Error(`Add failed: ${addRes.status}`);
        }

        showStatus(`✓ Added to checklist!`, 'success');
        successCount++;

      } catch (e) {
        showStatus(`✗ Failed: ${e.message}`, 'error');
        failCount++;
      }
    }

    showStatus(`\n🎉 COMPLETE! ${successCount} added, ${failCount} failed`, 'success');
  });
});

function categorizeItem(name) {
  const text = name.toLowerCase();
  const categories = {
    'Lighting': ['light', 'lamp', 'chandelier', 'sconce', 'pendant', 'fixture'],
    'Furniture': ['chair', 'sofa', 'table', 'desk', 'bed', 'dresser', 'cabinet'],
    'Decor': ['pillow', 'rug', 'art', 'vase', 'mirror', 'frame', 'plant']
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
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  statusDiv.appendChild(line);
  statusDiv.scrollTop = statusDiv.scrollHeight;
}