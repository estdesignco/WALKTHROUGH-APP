import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { photoService } from '../services/photoService';
import { offlineService } from '../services/offlineService';

const { width } = Dimensions.get('window');
const photoSize = (width - 48) / 3; // 3 columns with padding

export default function PhotoManagerScreen({ route, navigation }) {
  const { projectId, projectName, roomId, roomName } = route.params;
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [storageInfo, setStorageInfo] = useState({ photoCount: 0, totalSizeMB: '0.00' });

  useEffect(() => {
    loadPhotos();
    loadStorageInfo();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const roomPhotos = await photoService.getPhotosByRoom(projectId, roomId);
      setPhotos(roomPhotos);
    } catch (error) {
      console.error('Load photos error:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    const info = await photoService.getStorageInfo();
    setStorageInfo(info);
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await photoService.takePhoto(projectId, roomId, roomName);
      if (photo) {
        await loadPhotos();
        await loadStorageInfo();
        Alert.alert(
          'Photo Captured',
          photo.synced ? 'Photo uploaded successfully' : 'Photo saved offline for sync'
        );
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const photo = await photoService.pickFromGallery(projectId, roomId, roomName);
      if (photo) {
        await loadPhotos();
        await loadStorageInfo();
        Alert.alert(
          'Photo Added',
          photo.synced ? 'Photo uploaded successfully' : 'Photo saved offline for sync'
        );
      }
    } catch (error) {
      console.error('Pick photo error:', error);
      Alert.alert('Error', 'Failed to pick photo: ' + error.message);
    }
  };

  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePhoto = (photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoService.deletePhoto(photo.id || photo.serverId, !photo.synced);
              await loadPhotos();
              await loadStorageInfo();
              setSelectedPhoto(null);
              Alert.alert('Success', 'Photo deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const handleAnnotatePhoto = (photo) => {
    setSelectedPhoto(null);
    Alert.alert(
      'Photo Annotation',
      'Annotation feature coming soon!\n\nThis will allow you to:\n• Draw arrows on photos\n• Add Leica D5 measurements\n• Add text labels',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.roomName}>📍 {roomName}</Text>
        </View>
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>{storageInfo.photoCount} photos</Text>
          <Text style={styles.storageSizeText}>{storageInfo.totalSizeMB} MB</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleTakePhoto}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handlePickPhoto}
        >
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('LeicaConnection')}
        >
          <Text style={styles.actionIcon}>📏</Text>
          <Text style={styles.actionText}>Measure</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      <ScrollView style={styles.photoGrid}>
        {loading && photos.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D4A574" />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Take or upload photos for this room
            </Text>
          </View>
        ) : (
          <View style={styles.photoRow}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id || index}
                style={styles.photoItem}
                onPress={() => handlePhotoPress(photo)}
              >
                <Image
                  source={{ uri: photo.uri || photo.base64 }}
                  style={styles.photoImage}
                />
                {!photo.synced && (
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncBadgeText}>⏳</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.uri || selectedPhoto.base64 }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.annotateButton]}
                    onPress={() => handleAnnotatePhoto(selectedPhoto)}
                  >
                    <Text style={styles.modalButtonText}>✏️ Annotate</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => handleDeletePhoto(selectedPhoto)}
                  >
                    <Text style={styles.modalButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={() => setSelectedPhoto(null)}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
                
                {!selectedPhoto.synced && (
                  <Text style={styles.syncWarning}>
                    ⏳ Not synced yet - will upload when online
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  projectName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4A574',
  },
  storageInfo: {
    alignItems: 'flex-end',
  },
  storageText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 2,
  },
  storageSizeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#D4A574',
  },
  secondaryButton: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  photoGrid: {
    flex: 1,
    padding: 16,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: photoSize,
    height: photoSize,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  syncBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBadgeText: {
    fontSize: 12,
  },
  centerContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  annotateButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  closeButton: {
    backgroundColor: '#6B7280',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  syncWarning: {
    marginTop: 12,
    textAlign: 'center',
    color: '#F59E0B',
    fontSize: 12,
  },
});