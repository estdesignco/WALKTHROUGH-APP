// React Hook for Offline Sync - REAL-TIME SYNC ENABLED
import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  syncToServer,
  saveProjectOffline,
  getProjectOffline,
  queueItemUpdate,
  getPendingSyncItems
} from '../utils/offlineStorage';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export const useOfflineSync = (projectId) => {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setOnline(true);
      // Auto-sync when coming back online
      performSync();
    };
    
    const handleOffline = () => {
      console.log('📴 Connection lost');
      setOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending sync count
  const checkPendingCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncItems();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error checking pending count:', error);
    }
  }, []);

  useEffect(() => {
    checkPendingCount();
    // Check every 30 seconds
    const interval = setInterval(checkPendingCount, 30000);
    return () => clearInterval(interval);
  }, [checkPendingCount]);

  // Perform sync
  const performSync = useCallback(async () => {
    if (!isOnline()) {
      console.log('📴 Cannot sync - offline');
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      const result = await syncToServer(API_URL);
      
      if (result.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        await checkPendingCount();
        
        // Reset status after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  }, [checkPendingCount]);

  // Update item - REAL-TIME SYNC when online
  const updateItemOffline = useCallback(async (itemId, updates) => {
    try {
      if (online && navigator.onLine) {
        // REAL-TIME: If online, update immediately and show feedback
        console.log('🔄 Real-time sync: Updating item', itemId, updates);
        setSyncStatus('syncing');
        
        const response = await fetch(`${API_URL}/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (response.ok) {
          console.log('✅ Item synced to server in real-time');
          setSyncStatus('success');
          setLastSyncTime(new Date());
          setTimeout(() => setSyncStatus('idle'), 1500);
          return { success: true, mode: 'realtime' };
        } else {
          // If server update failed, queue for retry
          console.log('⚠️ Server update failed, queuing for retry');
          await queueItemUpdate(itemId, updates);
          await checkPendingCount();
          setSyncStatus('error');
          return { success: true, mode: 'queued' };
        }
      }
      
      // If offline, queue for sync
      await queueItemUpdate(itemId, updates);
      await checkPendingCount();
      console.log('💾 Item queued for sync (offline)');
      return { success: true, mode: 'offline' };
      
    } catch (error) {
      console.error('Update error:', error);
      
      // Queue for sync even on error
      await queueItemUpdate(itemId, updates);
      await checkPendingCount();
      setSyncStatus('error');
      return { success: true, mode: 'offline' };
    }
  }, [online, checkPendingCount]);

  // Cache project data
  const cacheProject = useCallback(async (project) => {
    try {
      await saveProjectOffline(project);
      console.log('💾 Project cached offline');
    } catch (error) {
      console.error('Cache error:', error);
    }
  }, []);

  // Load project from cache
  const loadProjectFromCache = useCallback(async () => {
    try {
      const project = await getProjectOffline(projectId);
      return project;
    } catch (error) {
      console.error('Load from cache error:', error);
      return null;
    }
  }, [projectId]);

  return {
    online,
    syncStatus,
    pendingCount,
    lastSyncTime,
    performSync,
    updateItemOffline,
    cacheProject,
    loadProjectFromCache
  };
};