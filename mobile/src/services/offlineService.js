import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PENDING_PHOTOS: 'pendingPhotos',
  PENDING_ITEMS: 'pendingItems',
  PENDING_MEASUREMENTS: 'pendingMeasurements',
  CACHED_PROJECTS: 'cachedProjects',
  CACHED_ROOMS: 'cachedRooms',
  SYNC_QUEUE: 'syncQueue',
};

export const offlineService = {
  async init() {
    try {
      // Initialize storage keys if they don't exist
      const keys = Object.values(KEYS);
      for (const key of keys) {
        const existing = await AsyncStorage.getItem(key);
        if (!existing) {
          await AsyncStorage.setItem(key, JSON.stringify([]));
        }
      }
      console.log('Offline service initialized');
    } catch (error) {
      console.error('Offline service init error:', error);
    }
  },

  // Projects Cache
  async cacheProjects(projects) {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.error('Cache projects error:', error);
    }
  },

  async getCachedProjects() {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get cached projects error:', error);
      return [];
    }
  },

  // Rooms Cache
  async cacheRooms(projectId, rooms) {
    try {
      const key = `${KEYS.CACHED_ROOMS}_${projectId}`;
      await AsyncStorage.setItem(key, JSON.stringify(rooms));
    } catch (error) {
      console.error('Cache rooms error:', error);
    }
  },

  async getCachedRooms(projectId) {
    try {
      const key = `${KEYS.CACHED_ROOMS}_${projectId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get cached rooms error:', error);
      return [];
    }
  },

  // Pending Photos
  async addPendingPhoto(photo) {
    try {
      const pending = await this.getPendingPhotos();
      const newPhoto = {
        ...photo,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        synced: false,
      };
      pending.push(newPhoto);
      await AsyncStorage.setItem(KEYS.PENDING_PHOTOS, JSON.stringify(pending));
      return newPhoto;
    } catch (error) {
      console.error('Add pending photo error:', error);
      throw error;
    }
  },

  async getPendingPhotos() {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_PHOTOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get pending photos error:', error);
      return [];
    }
  },

  async markPhotoSynced(photoId) {
    try {
      const pending = await this.getPendingPhotos();
      const updated = pending.filter(p => p.id !== photoId);
      await AsyncStorage.setItem(KEYS.PENDING_PHOTOS, JSON.stringify(updated));
    } catch (error) {
      console.error('Mark photo synced error:', error);
    }
  },

  // Pending Items
  async addPendingItem(item) {
    try {
      const pending = await this.getPendingItems();
      const newItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        synced: false,
      };
      pending.push(newItem);
      await AsyncStorage.setItem(KEYS.PENDING_ITEMS, JSON.stringify(pending));
      return newItem;
    } catch (error) {
      console.error('Add pending item error:', error);
      throw error;
    }
  },

  async getPendingItems() {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get pending items error:', error);
      return [];
    }
  },

  async markItemSynced(itemId) {
    try {
      const pending = await this.getPendingItems();
      const updated = pending.filter(i => i.id !== itemId);
      await AsyncStorage.setItem(KEYS.PENDING_ITEMS, JSON.stringify(updated));
    } catch (error) {
      console.error('Mark item synced error:', error);
    }
  },

  // Pending Measurements
  async addPendingMeasurement(measurement) {
    try {
      const pending = await this.getPendingMeasurements();
      const newMeasurement = {
        ...measurement,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        synced: false,
      };
      pending.push(newMeasurement);
      await AsyncStorage.setItem(KEYS.PENDING_MEASUREMENTS, JSON.stringify(pending));
      return newMeasurement;
    } catch (error) {
      console.error('Add pending measurement error:', error);
      throw error;
    }
  },

  async getPendingMeasurements() {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_MEASUREMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get pending measurements error:', error);
      return [];
    }
  },

  async markMeasurementSynced(measurementId) {
    try {
      const pending = await this.getPendingMeasurements();
      const updated = pending.filter(m => m.id !== measurementId);
      await AsyncStorage.setItem(KEYS.PENDING_MEASUREMENTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Mark measurement synced error:', error);
    }
  },

  // Clear all offline data (for testing/reset)
  async clearAll() {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      await this.init();
      console.log('Offline storage cleared');
    } catch (error) {
      console.error('Clear all error:', error);
    }
  },

  // Get sync status
  async getSyncStatus() {
    try {
      const [photos, items, measurements] = await Promise.all([
        this.getPendingPhotos(),
        this.getPendingItems(),
        this.getPendingMeasurements(),
      ]);

      return {
        pendingPhotos: photos.length,
        pendingItems: items.length,
        pendingMeasurements: measurements.length,
        totalPending: photos.length + items.length + measurements.length,
      };
    } catch (error) {
      console.error('Get sync status error:', error);
      return {
        pendingPhotos: 0,
        pendingItems: 0,
        pendingMeasurements: 0,
        totalPending: 0,
      };
    }
  },
};

export default offlineService;