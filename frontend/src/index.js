import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />
);

// Register service worker for offline functionality and mobile app features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('📱 Service Worker registered successfully:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New version available - refresh to update');
              // Show update notification to user
              if (window.confirm('New version available. Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Enable app install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 App install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button
  const installButton = document.createElement('button');
  installButton.textContent = '📱 Install App';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #8b7355;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    z-index: 1000;
    font-weight: bold;
  `;
  
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`📱 Install prompt result: ${outcome}`);
      deferredPrompt = null;
      installButton.remove();
    }
  });
  
  document.body.appendChild(installButton);
});

// Track app installation
window.addEventListener('appinstalled', (evt) => {
  console.log('📱 FF&E Manager app installed successfully');
  // Track installation analytics
});
