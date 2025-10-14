const BACKEND_URL = 'https://designhub-74.preview.emergentagent.com';
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
    showStatus('❌ Please enter a Project ID', 'error');
    return;
  }

  showStatus('⏳ Loading project...', 'info');
  
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
    
    // Save project ID
    chrome.storage.local.set({ projectId });
    
    // Enable scan button
    document.getElementById('scanBtn').disabled = false;
    
    showStatus(`✅ Loaded project with ${projectData.rooms.length} rooms!`, 'success');
  } catch (e) {
    showStatus(`❌ Error loading project: ${e.message}`, 'error');
    console.error('Project load error:', e);
  }
});

// Scan Canva board
document.getElementById('scanBtn').addEventListener('click', async () => {
  const roomId = document.getElementById('roomSelect').value;
  if (!roomId) {
    showStatus('⚠️ Please select a room first!', 'warning');
    return;
  }

  const room = projectData.rooms.find(r => r.id === roomId);
  if (!room) {
    showStatus('❌ Room not found!', 'error');
    return;
  }

  // Save room ID
  chrome.storage.local.set({ roomId });

  showStatus('🔍 Scanning Canva board for TRADE vendor products...', 'info');
  showStatus('⏳ This may take a moment...', 'info');

  // Send message to content script to scan the page
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if we're on Canva
    if (!tab.url || !tab.url.includes('canva.com')) {
      showStatus('❌ Please navigate to a Canva design page first!', 'error');
      return;
    }
    
    // TRY TO INJECT CONTENT SCRIPT IF IT'S NOT LOADED
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      showStatus('✅ Scanner loaded on page', 'success');
      // Wait a moment for script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (injectError) {
      console.log('Content script might already be loaded:', injectError);
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'scanPage' }, async (response) => {
      console.log('📦 Received response from content script:', response);
      
      if (chrome.runtime.lastError) {
        showStatus('❌ Error: ' + chrome.runtime.lastError.message, 'error');
        showStatus('💡 Try refreshing the Canva page and scanning again', 'info');
        return;
      }
      
      if (!response || !response.images) {
        showStatus('❌ No response from content script', 'error');
        showStatus('💡 Make sure you\'re on a Canva design page', 'info');
        return;
      }

      const images = response.images;
      
      if (images.length === 0) {
        showStatus('⚠️ No product links found on this Canva board', 'warning');
        showStatus('💡 Make sure your products have clickable links', 'info');
        return;
      }
      
      showStatus(`✅ Found ${images.length} product link${images.length > 1 ? 's' : ''}!`, 'success');
      showStatus('🚀 Starting import process...', 'info');
      console.log('🎯 Product links to process:', images);

      let successCount = 0;
      let failCount = 0;
      const failedUrls = [];

      for (let i = 0; i < images.length; i++) {
        const { url, confidence } = images[i];
        const progress = `[${i + 1}/${images.length}]`;
        showStatus(`${progress} Processing: ${truncateUrl(url)}`, 'info');

        try {
          // Scrape product
          showStatus(`${progress} Scraping product data...`, 'info');
          const scrapeRes = await fetch(`${BACKEND_URL}/api/scrape-product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, auto_clip_to_houzz: true })
          });

          if (!scrapeRes.ok) {
            throw new Error(`Scrape failed (HTTP ${scrapeRes.status})`);
          }

          const productData = await scrapeRes.json();
          const productName = productData.name || 'Unknown Product';
          showStatus(`${progress} ✓ Scraped: ${truncateText(productName, 40)}`, 'success');

          // Smart categorization
          const category = categorizeItem(productName);
          let subcategoryId = null;

          // Try to find matching category
          for (const cat of room.categories || []) {
            if (cat.name.toLowerCase().includes(category.toLowerCase())) {
              if (cat.subcategories && cat.subcategories.length > 0) {
                subcategoryId = cat.subcategories[0].id;
                break;
              }
            }
          }

          // Fallback to first available subcategory
          if (!subcategoryId && room.categories && room.categories.length > 0) {
            for (const cat of room.categories) {
              if (cat.subcategories && cat.subcategories.length > 0) {
                subcategoryId = cat.subcategories[0].id;
                break;
              }
            }
          }

          if (!subcategoryId) {
            throw new Error('No subcategory available in room');
          }

          // Add to checklist
          showStatus(`${progress} Adding to checklist...`, 'info');
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
            throw new Error(`Add to checklist failed (HTTP ${addRes.status})`);
          }

          showStatus(`${progress} ✅ Successfully added to ${room.name}!`, 'success');
          successCount++;

        } catch (e) {
          showStatus(`${progress} ❌ Failed: ${e.message}`, 'error');
          failCount++;
          failedUrls.push({ url, error: e.message });
          console.error('Import error:', e, url);
        }
        
        // Small delay between requests to avoid rate limiting
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Final summary
      showStatus('\n' + '='.repeat(40), 'info');
      showStatus('🎉 IMPORT COMPLETE!', 'success');
      showStatus(`✅ Successfully added: ${successCount}`, 'success');
      if (failCount > 0) {
        showStatus(`❌ Failed: ${failCount}`, 'error');
      }
      showStatus('='.repeat(40), 'info');
      
      if (failedUrls.length > 0) {
        showStatus('\n⚠️ Failed URLs:', 'warning');
        failedUrls.forEach(({ url, error }) => {
          showStatus(`  • ${truncateUrl(url, 50)}`, 'error');
          showStatus(`    └─ ${error}`, 'error');
        });
      }
    });
  } catch (e) {
    showStatus(`❌ Critical error: ${e.message}`, 'error');
    console.error('Scan error:', e);
  }
});

function categorizeItem(name) {
  const text = name.toLowerCase();
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

function truncateUrl(url, maxLength = 60) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
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