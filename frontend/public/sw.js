// Service Worker for Mobile App & Offline Functionality
const CACHE_NAME = 'ffe-app-v3-nocache';
const API_CACHE = 'ffe-api-v3-nocache';

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/established-logo.png'
];

// Cache API endpoints for offline use
const API_ENDPOINTS = [
  '/api/projects',
  '/api/rooms',
  '/api/categories/available',
  '/api/item-statuses-enhanced',
  '/api/carrier-options',
  '/api/vendor-types'
];

// DISABLED SERVICE WORKER - CAUSING ROUTING ISSUES
self.addEventListener('install', event => {
  console.log('📱 Service Worker DISABLED - skipping installation');
  self.skipWaiting();
  return;
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('💾 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache API responses
      caches.open(API_CACHE).then(cache => {
        console.log('🔗 Pre-caching API endpoints...');
        return Promise.all(
          API_ENDPOINTS.map(endpoint => {
            return fetch(endpoint)
              .then(response => {
                if (response.ok) {
                  return cache.put(endpoint, response.clone());
                }
              })
              .catch(err => console.warn(`Failed to cache ${endpoint}:`, err));
          })
        );
      })
    ])
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // SERVICE WORKER DISABLED - Let all requests through
  return;
  const { request } = event;
  const url = new URL(request.url);
  
  // Bypass service worker for OAuth callbacks (Canva, etc.)
  if (url.pathname.includes('/callback') || url.pathname.includes('/oauth')) {
    // Let the browser handle it directly, don't intercept
    return;
  }
  
  // CRITICAL: Don't cache HTML navigation requests - let React Router handle them
  if (request.mode === 'navigate' || request.destination === 'document') {
    // Network only for HTML pages - this fixes React Router refresh issue
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  }
  // Handle static assets
  else {
    event.respondWith(handleStaticRequest(request));
  }
});

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // For GET requests, try cache first, then network
  if (request.method === 'GET') {
    try {
      // Try network first for fresh data
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful response
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      console.log('🌐 Network failed, trying cache...');
    }
    
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('💾 Serving from cache:', url.pathname);
      return cachedResponse;
    }
    
    // Return offline message if no cache available
    return new Response(
      JSON.stringify({
        error: 'Offline - No cached data available',
        offline: true,
        endpoint: url.pathname
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // For POST/PUT/DELETE, try network or queue for later
  else {
    try {
      return await fetch(request);
    } catch (error) {
      // Queue offline actions
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        await queueOfflineAction(request);
        
        return new Response(
          JSON.stringify({
            success: true,
            offline: true,
            queued: true,
            message: 'Action queued for when online'
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw error;
    }
  }
}

async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Try network for static assets
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline');
    }
    throw error;
  }
}

async function queueOfflineAction(request) {
  try {
    const body = await request.text();
    const action = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Store in IndexedDB for persistence
    const db = await openDB();
    const transaction = db.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    await store.add(action);
    
    console.log('📝 Queued offline action:', action.id);
  } catch (error) {
    console.error('❌ Failed to queue offline action:', error);
  }
}

// IndexedDB helper for offline action storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ffe_offline_db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object store for offline actions
      if (!db.objectStoreNames.contains('offline_actions')) {
        const store = db.createObjectStore('offline_actions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create object store for cached project data
      if (!db.objectStoreNames.contains('cached_projects')) {
        const store = db.createObjectStore('cached_projects', { keyPath: 'id' });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
}

// Sync offline actions when connection restored
self.addEventListener('online', event => {
  console.log('🌐 Connection restored - syncing offline actions...');
  event.waitUntil(syncOfflineActions());
});

async function syncOfflineActions() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offline_actions'], 'readonly');
    const store = transaction.objectStore('offline_actions');
    const actions = await store.getAll();
    
    console.log(`🔄 Syncing ${actions.length} offline actions...`);
    
    for (const action of actions) {
      try {
        const request = new Request(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        const response = await fetch(request);
        
        if (response.ok) {
          // Remove successfully synced action
          const deleteTransaction = db.transaction(['offline_actions'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('offline_actions');
          await deleteStore.delete(action.id);
          
          console.log('✅ Synced offline action:', action.id);
        } else {
          console.warn('⚠️ Failed to sync action:', action.id, response.status);
        }
      } catch (error) {
        console.error('❌ Sync error for action:', action.id, error);
      }
    }
    
    // Notify main app of sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'OFFLINE_SYNC_COMPLETE',
          syncedActions: actions.length
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Offline sync failed:', error);
  }
}

// Handle background sync for reliable offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'ffe-sync') {
    console.log('🔄 Background sync triggered...');
    event.waitUntil(syncOfflineActions());
  }
});

// Handle push notifications for project updates
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.message,
      icon: '/established-logo.png',
      badge: '/badge-icon.png',
      tag: data.tag || 'ffe-notification',
      data: data.payload || {},
      actions: [
        {
          action: 'view',
          title: 'View Project'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FF&E Update', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the project in the app
    const projectId = event.notification.data.projectId;
    const url = `/project/${projectId}/ffe`;
    
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        // Focus existing window if open
        const existingClient = clients.find(client => 
          client.url.includes(projectId)
        );
        
        if (existingClient) {
          existingClient.focus();
        } else {
          // Open new window
          self.clients.openWindow(url);
        }
      })
    );
  }
});