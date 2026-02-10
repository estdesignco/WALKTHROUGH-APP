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
