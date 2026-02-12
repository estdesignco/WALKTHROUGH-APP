import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Only set window.ENV if not already set by runtime config.js
if (!window.ENV) {
  window.ENV = {
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL || window.location.origin,
  };
}

// FIT TO TEXT: Auto-size table inputs to their content (like Excel)
function autoSizeTableInputs() {
  document.querySelectorAll('table td input[type="text"]').forEach(input => {
    const text = input.value || input.placeholder || '';
    input.size = Math.max(text.length + 2, 8);
  });
}
// Run on DOM changes (new data loaded, edits, etc.)
const fitObserver = new MutationObserver(() => requestAnimationFrame(autoSizeTableInputs));
fitObserver.observe(document.body, { subtree: true, childList: true, characterData: true });
// Also run on any input event
document.addEventListener('input', (e) => {
  if (e.target.matches('table td input[type="text"]')) {
    e.target.size = Math.max((e.target.value || '').length + 2, 8);
  }
}, true);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <App />
);

// REGISTER service worker for OFFLINE capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered for offline capability:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Service Worker update found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 New Service Worker installed, refresh for updates');
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Enable app install prompt (hidden - users install via browser menu)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 App install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  // Install button hidden - app can be installed via browser menu if needed
});

// Track app installation
window.addEventListener('appinstalled', (evt) => {
  console.log('📱 FF&E Manager app installed successfully');
  // Track installation analytics
});
