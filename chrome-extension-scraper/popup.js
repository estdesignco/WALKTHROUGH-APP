const BACKEND_URL = 'https://designready-1.preview.emergentagent.com';
let scrapedData = null;

document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const dataBox = document.getElementById('dataBox');
  
  statusEl.style.display = 'block';
  statusEl.className = 'status info';
  statusEl.textContent = '🔍 Scraping page...';
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if we're on a supported vendor page
    const supportedVendors = [
      'uttermost.com', 'visualcomfort.com', 'bernhardt.com', 
      'reginaandrew.com', 'hvlgroup.com', 'loloirugs.com',
      'globalviews.com', 'surya.com', 'fourhands.com', 'jaipurliving.com'
    ];
    
    const isSupported = supportedVendors.some(v => tab.url.includes(v));
    
    if (!isSupported) {
      statusEl.className = 'status error';
      statusEl.textContent = '❌ Not on a supported vendor page. Navigate to a product page first.';
      return;
    }
    
    // Inject content script if needed
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      console.log('Content script may already be loaded:', e);
    }
    
    // Wait a moment for script to load
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'scrapeProduct' }, (response) => {
      if (chrome.runtime.lastError) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ Error: ' + chrome.runtime.lastError.message;
        return;
      }
      
      if (!response || !response.success) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ Failed to scrape page';
        return;
      }
      
      scrapedData = response.data;
      
      // Update UI
      dataBox.style.display = 'block';
      
      document.getElementById('dataName').textContent = scrapedData.name || '-';
      document.getElementById('dataName').className = 'data-value' + (scrapedData.name ? '' : ' missing');
      
      document.getElementById('dataPrice').textContent = scrapedData.price ? `$${scrapedData.price}` : '-';
      document.getElementById('dataPrice').className = 'data-value' + (scrapedData.price ? '' : ' missing');
      
      document.getElementById('dataSku').textContent = scrapedData.sku || '-';
      document.getElementById('dataSku').className = 'data-value' + (scrapedData.sku ? '' : ' missing');
      
      document.getElementById('dataSize').textContent = scrapedData.size || '-';
      document.getElementById('dataSize').className = 'data-value' + (scrapedData.size ? '' : ' missing');
      
      document.getElementById('dataFinish').textContent = scrapedData.finish_color || '-';
      document.getElementById('dataFinish').className = 'data-value' + (scrapedData.finish_color ? '' : ' missing');
      
      statusEl.className = 'status success';
      if (scrapedData.price) {
        statusEl.textContent = `✅ Found price: $${scrapedData.price}`;
      } else {
        statusEl.textContent = '⚠️ Scraped but no price found. Are you logged in?';
      }
    });
    
  } catch (e) {
    statusEl.className = 'status error';
    statusEl.textContent = '❌ Error: ' + e.message;
    console.error('Scrape error:', e);
  }
});

// Copy price to clipboard
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (scrapedData && scrapedData.price) {
    await navigator.clipboard.writeText(scrapedData.price.toString());
    document.getElementById('status').textContent = '📋 Price copied to clipboard!';
  }
});

// Send to app
document.getElementById('sendBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  
  if (!scrapedData) {
    statusEl.className = 'status error';
    statusEl.textContent = '❌ No data to send. Scrape first!';
    return;
  }
  
  statusEl.className = 'status info';
  statusEl.textContent = '🚀 Sending to app...';
  
  try {
    // Send the scraped data to the backend
    const response = await fetch(`${BACKEND_URL}/api/extension-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrapedData)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    statusEl.className = 'status success';
    statusEl.textContent = '✅ Data sent to app! Check your browser.';
    
  } catch (e) {
    statusEl.className = 'status error';
    statusEl.textContent = '❌ Failed to send: ' + e.message;
    console.error('Send error:', e);
  }
});
