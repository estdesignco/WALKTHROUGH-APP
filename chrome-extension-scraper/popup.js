document.getElementById('btn').addEventListener('click', async () => {
  const btn = document.getElementById('btn');
  const status = document.getElementById('status');
  
  btn.disabled = true;
  btn.textContent = '⏳ Scraping...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    chrome.tabs.sendMessage(tab.id, { action: 'scrapeAndOpen' }, (response) => {
      btn.disabled = false;
      btn.textContent = '⚡ ADD TO APP';
      
      if (response && response.data && response.data.price) {
        status.style.display = 'block';
        status.className = 'status success';
        status.textContent = `✅ $${response.data.price} - Opening app!`;
      } else {
        status.style.display = 'block';
        status.className = 'status error';
        status.textContent = '⚠️ No price found - are you logged in?';
      }
    });
  } catch (e) {
    btn.disabled = false;
    btn.textContent = '⚡ ADD TO APP';
    status.style.display = 'block';
    status.className = 'status error';
    status.textContent = '❌ ' + e.message;
  }
});
