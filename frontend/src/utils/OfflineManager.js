// Offline functionality utility
class OfflineManager {
  constructor() {
    this.isOffline = !navigator.onLine;
    this.pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    this.cachedData = JSON.parse(localStorage.getItem('cachedFFEData') || '{}');
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    console.log('🌐 Back online - syncing pending actions...');
    this.isOffline = false;
    this.syncPendingActions();
  }

  handleOffline() {
    console.log('📱 Gone offline - enabling offline mode...');
    this.isOffline = true;
  }

  // Cache project data for offline use
  cacheProjectData(projectId, projectData) {
    this.cachedData[projectId] = {
      ...projectData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('cachedFFEData', JSON.stringify(this.cachedData));
    console.log(`💾 Cached data for project ${projectId}`);
  }

  // Get cached project data when offline
  getCachedProjectData(projectId) {
    return this.cachedData[projectId] || null;
  }

  // Queue actions when offline
  queueAction(action) {
    if (this.isOffline) {
      this.pendingActions.push({
        ...action,
        timestamp: new Date().toISOString(),
        id: Date.now()
      });
      localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
      console.log(`📝 Queued offline action:`, action);
      return true;
    }
    return false;
  }

  // Sync pending actions when back online
  async syncPendingActions() {
    if (this.pendingActions.length === 0) return;

    console.log(`🔄 Syncing ${this.pendingActions.length} pending actions...`);

    for (const action of this.pendingActions) {
      try {
        await this.executeAction(action);
        console.log(`✅ Synced action: ${action.type}`);
      } catch (error) {
        console.error(`❌ Failed to sync action:`, action, error);
      }
    }

    // Clear pending actions after sync
    this.pendingActions = [];
    localStorage.setItem('pendingActions', JSON.stringify([]));
  }

  // Execute queued actions
  async executeAction(action) {
    const { type, data } = action;

    switch (type) {
      case 'CREATE_ITEM':
        return fetch(`https://code-scanner-14.preview.emergentagent.com/api/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

      case 'UPDATE_ITEM':
        return fetch(`https://code-scanner-14.preview.emergentagent.com/api/items/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

      case 'DELETE_ITEM':
        return fetch(`https://code-scanner-14.preview.emergentagent.com/api/items/${data.id}`, {
          method: 'DELETE'
        });

      case 'CREATE_ROOM':
        return fetch(`https://code-scanner-14.preview.emergentagent.com/api/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

      default:
        console.warn(`Unknown action type: ${type}`);
    }
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOffline: this.isOffline,
      pendingActions: this.pendingActions.length,
      cachedProjects: Object.keys(this.cachedData).length
    };
  }
}

export default OfflineManager;