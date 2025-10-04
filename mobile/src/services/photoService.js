import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { offlineService } from './offlineService';
import { apiService } from './apiService';
import NetInfo from '@react-native-community/netinfo';

export const photoService = {
  async requestPermissions() {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return {
        camera: cameraStatus === 'granted',
        library: libraryStatus === 'granted',
      };
    } catch (error) {
      console.error('Permission request error:', error);
      return { camera: false, library: false };
    }
  },

  async takePhoto(projectId, roomId, roomName) {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return await this.processPhoto(projectId, roomId, roomName, asset);
      }

      return null;
    } catch (error) {
      console.error('Take photo error:', error);
      throw error;
    }
  },

  async pickFromGallery(projectId, roomId, roomName) {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.library) {
        throw new Error('Photo library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return await this.processPhoto(projectId, roomId, roomName, asset);
      }

      return null;
    } catch (error) {
      console.error('Pick photo error:', error);
      throw error;
    }
  },

  async processPhoto(projectId, roomId, roomName, asset) {
    try {
      const fileName = `${roomName}_${Date.now()}.jpg`.replace(/\s+/g, '_');
      const base64 = asset.base64;

      const photoData = {
        projectId,
        roomId,
        roomName,
        fileName,
        base64: `data:image/jpeg;base64,${base64}`,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        metadata: {
          timestamp: new Date().toISOString(),
          location: null, // Could add GPS coordinates if needed
        },
      };

      // Check if online
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

      if (isOnline) {
        // Try to upload immediately
        try {
          const response = await apiService.uploadPhoto(projectId, roomId, {
            base64: photoData.base64,
            fileName: photoData.fileName,
            metadata: photoData.metadata,
          });
          
          return {
            ...photoData,
            synced: true,
            serverId: response.data.id,
          };
        } catch (error) {
          console.error('Immediate upload failed, queuing for later:', error);
          // Fall through to offline handling
        }
      }

      // Store offline for later sync
      const savedPhoto = await offlineService.addPendingPhoto(photoData);
      return {
        ...savedPhoto,
        synced: false,
      };
    } catch (error) {
      console.error('Process photo error:', error);
      throw error;
    }
  },

  async getPhotosByRoom(projectId, roomId) {
    try {
      // Try to get from server
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        try {
          const response = await apiService.getPhotosByRoom(projectId, roomId);
          return response.data.photos || [];
        } catch (error) {
          console.error('Failed to fetch photos from server:', error);
        }
      }

      // Fall back to offline photos
      const pendingPhotos = await offlineService.getPendingPhotos();
      return pendingPhotos.filter(
        p => p.projectId === projectId && p.roomId === roomId
      );
    } catch (error) {
      console.error('Get photos by room error:', error);
      return [];
    }
  },

  async deletePhoto(photoId, isLocal = false) {
    try {
      if (isLocal) {
        // Remove from offline storage
        const pending = await offlineService.getPendingPhotos();
        const updated = pending.filter(p => p.id !== photoId);
        await AsyncStorage.setItem('pendingPhotos', JSON.stringify(updated));
      } else {
        // Try to delete from server
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected && netInfo.isInternetReachable) {
          await apiService.deletePhoto(photoId);
        } else {
          // Queue for deletion when online
          await offlineService.addPendingItem({
            operation: 'delete_photo',
            photoId,
            data: null,
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Delete photo error:', error);
      throw error;
    }
  },

  // Calculate storage usage
  async getStorageInfo() {
    try {
      const pendingPhotos = await offlineService.getPendingPhotos();
      const totalSize = pendingPhotos.reduce((sum, photo) => {
        // Rough estimate: base64 string length / 1.37 ≈ original bytes
        const estimatedBytes = (photo.base64?.length || 0) / 1.37;
        return sum + estimatedBytes;
      }, 0);

      return {
        photoCount: pendingPhotos.length,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      };
    } catch (error) {
      console.error('Get storage info error:', error);
      return { photoCount: 0, totalSizeMB: '0.00' };
    }
  },
};

export default photoService;