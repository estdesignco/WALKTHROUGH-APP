import { offlineService } from './offlineService';
import { apiService } from './apiService';
import NetInfo from '@react-native-community/netinfo';

export const syncService = {
  async syncAll() {
    try {
      // Check if online
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        return {
          success: false,
          message: 'No internet connection',
        };
      }

      const results = {
        photos: { synced: 0, failed: 0 },
        items: { synced: 0, failed: 0 },
        measurements: { synced: 0, failed: 0 },
      };

      // Sync photos
      const pendingPhotos = await offlineService.getPendingPhotos();
      for (const photo of pendingPhotos) {
        try {
          await apiService.uploadPhoto(photo.projectId, photo.roomId, {
            base64: photo.base64,
            fileName: photo.fileName,
            metadata: photo.metadata,
          });
          await offlineService.markPhotoSynced(photo.id);
          results.photos.synced++;
        } catch (error) {
          console.error('Photo sync error:', error);
          results.photos.failed++;
        }
      }

      // Sync items
      const pendingItems = await offlineService.getPendingItems();
      for (const item of pendingItems) {
        try {
          if (item.operation === 'create') {
            await apiService.createItem(item.data);
          } else if (item.operation === 'update') {
            await apiService.updateItem(item.itemId, item.data);
          } else if (item.operation === 'delete') {
            await apiService.deleteItem(item.itemId);
          }
          await offlineService.markItemSynced(item.id);
          results.items.synced++;
        } catch (error) {
          console.error('Item sync error:', error);
          results.items.failed++;
        }
      }

      // Sync measurements
      const pendingMeasurements = await offlineService.getPendingMeasurements();
      for (const measurement of pendingMeasurements) {
        try {
          await apiService.saveMeasurement(measurement.data);
          await offlineService.markMeasurementSynced(measurement.id);
          results.measurements.synced++;
        } catch (error) {
          console.error('Measurement sync error:', error);
          results.measurements.failed++;
        }
      }

      return {
        success: true,
        results,
        message: `Synced: ${results.photos.synced + results.items.synced + results.measurements.synced} items`,
      };
    } catch (error) {
      console.error('Sync all error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  // Sync in background periodically
  startBackgroundSync(intervalMinutes = 5) {
    setInterval(async () => {
      const status = await offlineService.getSyncStatus();
      if (status.totalPending > 0) {
        console.log('Background sync triggered:', status);
        await this.syncAll();
      }
    }, intervalMinutes * 60 * 1000);
  },
};

export default syncService;