// ONE CLICK - Scrape and send to app automatically

document.getElementById('mainBtn').addEventListener('click', async () => {
  const btn = document.getElementById('mainBtn');
  const statusEl = document.getElementById('status');
  const previewEl = document.getElementById('dataPreview');
  
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Scraping...';
  
  statusEl.style.display = 'block';
  statusEl.className = 'status loading';
  statusEl.textContent = '🔍 Extracting product data...';
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab');
    }
    
    // Inject and run content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Small delay for script to initialize
    await new Promise(r => setTimeout(r, 500));
    
    // Send message to scrape AND send to app
    chrome.tabs.sendMessage(tab.id, { action: 'scrapeAndSend' }, (response) => {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡</span> SCRAPE & SEND TO APP';
      
      if (chrome.runtime.lastError) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ ' + chrome.runtime.lastError.message;
        return;
      }
      
      if (!response) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ No response from page';
        return;
      }
      
      const data = response.data;
      
      // Show preview
      previewEl.style.display = 'block';
      
      document.getElementById('previewPrice').textContent = data.price ? `$${data.price}` : 'Not found';
      document.getElementById('previewPrice').className = 'data-value price-highlight' + (data.price ? '' : ' missing');
      
      document.getElementById('previewName').textContent = data.name || 'Not found';
      document.getElementById('previewName').className = 'data-value' + (data.name ? '' : ' missing');
      
      document.getElementById('previewSku').textContent = data.sku || 'Not found';
      document.getElementById('previewSku').className = 'data-value' + (data.sku ? '' : ' missing');
      
      if (response.success) {
        statusEl.className = 'status success';
        if (data.price) {
          statusEl.textContent = `✅ Sent to app! Price: $${data.price}`;
        } else {
          statusEl.textContent = '⚠️ Sent but no price found. Are you logged in?';
        }
      } else {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ ' + (response.error || 'Failed to send');
      }
    });
    
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = '<span>⚡</span> SCRAPE & SEND TO APP';
    statusEl.className = 'status error';
    statusEl.textContent = '❌ ' + e.message;
  }
});
