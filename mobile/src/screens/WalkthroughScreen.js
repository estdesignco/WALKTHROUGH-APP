import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../services/apiService';
import { offlineService } from '../services/offlineService';

export default function WalkthroughScreen({ route, navigation }) {
  const { projectId, projectName } = route.params;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API
      try {
        const response = await apiService.getProject(projectId);
        const project = response.data;
        const fetchedRooms = project.rooms || [];
        setRooms(fetchedRooms);
        
        // Cache for offline use
        await offlineService.cacheRooms(projectId, fetchedRooms);
      } catch (error) {
        console.error('Failed to fetch rooms from API:', error);
        
        // Fall back to cached data
        const cachedRooms = await offlineService.getCachedRooms(projectId);
        setRooms(cachedRooms);
      }
    } catch (error) {
      console.error('Load rooms error:', error);
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomPress = (room) => {
    navigation.navigate('PhotoManager', {
      projectId,
      projectName,
      roomId: room.id,
      roomName: room.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading walkthrough...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Project Header */}
        <View style={styles.header}>
          <Text style={styles.projectTitle}>{projectName}</Text>
          <Text style={styles.subtitle}>Select a room to manage photos</Text>
        </View>

        {/* Rooms Grid */}
        <View style={styles.roomsGrid}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[styles.roomCard, { backgroundColor: room.color || '#1F2937' }]}
              onPress={() => handleRoomPress(room)}
            >
              <Text style={styles.roomIcon}>🏠</Text>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomSubtitle}>
                {room.categories?.length || 0} categories
              </Text>
              <View style={styles.photoIndicator}>
                <Text style={styles.photoIndicatorText}>📸 Photos →</Text>
              </View>
            </TouchableOpacity>
          ))}

          {rooms.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyText}>No rooms found</Text>
              <Text style={styles.emptySubtext}>
                Add rooms on the web app first
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  roomIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roomSubtitle: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  photoIndicator: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  photoIndicatorText: {
    fontSize: 12,
    color: '#D4A574',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    width: '100%',
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
});