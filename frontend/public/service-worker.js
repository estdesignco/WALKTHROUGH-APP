/* eslint-disable no-restricted-globals */

// Service Worker for Offline Capability
const CACHE_NAME = 'established-design-v1';
const API_CACHE_NAME = 'established-api-v1';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/mobile-app',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            // Only cache GET requests
            if (request.method === 'GET') {
              cache.put(request, responseClone);
            }
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          console.log('[SW] Network failed, serving from cache:', request.url);
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets - Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }
        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          // Cache the new response
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Offline and not in cache - return offline page for navigation
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when back online
async function syncOfflineData() {
  console.log('[SW] Syncing offline data...');
  // Get pending actions from IndexedDB and sync them
  // This would be implemented based on your offline queue
}

console.log('[SW] Service Worker loaded');
