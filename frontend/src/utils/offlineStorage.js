// Offline Storage Utility for Mobile App
// Handles storing and syncing data when offline

const DB_NAME = 'InteriorDesignOfflineDB';
const DB_VERSION = 1;
const STORE_NAMES = {
  PROJECTS: 'projects',
  ROOMS: 'rooms',
  ITEMS: 'items',
  PHOTOS: 'photos',
  PENDING_SYNC: 'pending_sync'
};

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.PROJECTS)) {
        db.createObjectStore(STORE_NAMES.PROJECTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.ROOMS)) {
        db.createObjectStore(STORE_NAMES.ROOMS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.ITEMS)) {
        const itemStore = db.createObjectStore(STORE_NAMES.ITEMS, { keyPath: 'id' });
        itemStore.createIndex('room_id', 'room_id', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.PHOTOS)) {
        const photoStore = db.createObjectStore(STORE_NAMES.PHOTOS, { keyPath: 'id' });
        photoStore.createIndex('room_id', 'room_id', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAMES.PENDING_SYNC)) {
        db.createObjectStore(STORE_NAMES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Save project data offline
export const saveProjectOffline = async (project) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAMES.PROJECTS], 'readwrite');
  const store = transaction.objectStore(STORE_NAMES.PROJECTS);
  
  return new Promise((resolve, reject) => {
    const request = store.put(project);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get project data from offline storage
export const getProjectOffline = async (projectId) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAMES.PROJECTS], 'readonly');
  const store = transaction.objectStore(STORE_NAMES.PROJECTS);
  
  return new Promise((resolve, reject) => {
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save item update to pending sync queue
export const queueItemUpdate = async (itemId, updates) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAMES.PENDING_SYNC], 'readwrite');
  const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
  
  const syncItem = {
    type: 'UPDATE_ITEM',
    itemId,
    updates,
    timestamp: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(syncItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get all pending sync items
export const getPendingSyncItems = async () => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAMES.PENDING_SYNC], 'readonly');
  const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Clear pending sync item after successful sync
export const clearSyncItem = async (syncId) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAMES.PENDING_SYNC], 'readwrite');
  const store = transaction.objectStore(STORE_NAMES.PENDING_SYNC);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(syncId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Check if online
export const isOnline = () => {
  return navigator.onLine;
};

// Sync pending changes to server
export const syncToServer = async (apiUrl) => {
  if (!isOnline()) {
    console.log('📴 Offline - cannot sync');
    return { success: false, reason: 'offline' };
  }
  
  const pendingItems = await getPendingSyncItems();
  
  if (pendingItems.length === 0) {
    console.log('✅ Nothing to sync');
    return { success: true, synced: 0 };
  }
  
  console.log(`🔄 Syncing ${pendingItems.length} items...`);
  let synced = 0;
  
  for (const item of pendingItems) {
    try {
      if (item.type === 'UPDATE_ITEM') {
        const response = await fetch(`${apiUrl}/items/${item.itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.updates)
        });
        
        if (response.ok) {
          await clearSyncItem(item.id);
          synced++;
          console.log(`✅ Synced item ${item.itemId}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to sync item ${item.id}:`, error);
    }
  }
  
  console.log(`✅ Sync complete: ${synced}/${pendingItems.length} items`);
  return { success: true, synced, total: pendingItems.length };
};