// Simple: Scrape page and save to server (keyed by URL)
// User then pastes URL into app, app finds the cached data with price

document.getElementById('mainBtn').addEventListener('click', async () => {
  const btn = document.getElementById('mainBtn');
  const statusEl = document.getElementById('status');
  const priceDisplay = document.getElementById('priceDisplay');
  const priceValue = document.getElementById('priceValue');
  
  btn.disabled = true;
  btn.textContent = '⏳ Scraping...';
  
  statusEl.style.display = 'block';
  statusEl.className = 'status loading';
  statusEl.textContent = '🔍 Extracting data...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab');
    }
    
    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      // May already be injected
    }
    
    await new Promise(r => setTimeout(r, 500));
    
    // Scrape the page
    chrome.tabs.sendMessage(tab.id, { action: 'scrapeAndSend' }, (response) => {
      btn.disabled = false;
      btn.textContent = '⚡ SCRAPE THIS PAGE';
      
      if (chrome.runtime.lastError) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ ' + chrome.runtime.lastError.message;
        return;
      }
      
      if (!response || !response.data) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ Could not scrape page';
        return;
      }
      
      const data = response.data;
      
      if (response.success && data.price) {
        statusEl.className = 'status success';
        statusEl.textContent = '✅ Saved! Now paste the URL into the app.';
        
        priceDisplay.style.display = 'block';
        priceValue.textContent = '$' + data.price;
      } else if (response.success) {
        statusEl.className = 'status success';
        statusEl.textContent = '⚠️ Saved but no price found. Are you logged in?';
        priceDisplay.style.display = 'none';
      } else {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ ' + (response.error || 'Failed');
      }
    });
    
  } catch (e) {
    btn.disabled = false;
    btn.textContent = '⚡ SCRAPE THIS PAGE';
    statusEl.className = 'status error';
    statusEl.textContent = '❌ ' + e.message;
  }
});
