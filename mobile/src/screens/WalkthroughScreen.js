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
  const [project, setProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      try {
        const response = await apiService.getProject(projectId);
        const proj = response.data;
        setProject(proj);
        setRooms(proj.rooms || []);
        await offlineService.cacheRooms(projectId, proj.rooms || []);
      } catch (error) {
        console.error('Failed to fetch rooms from API:', error);
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

  const getFloorOrder = () => {
    if (project?.floor_order?.length) return [...project.floor_order];
    const floors = [];
    rooms.forEach(r => {
      const f = r.floor || '1ST FLOOR';
      if (!floors.includes(f)) floors.push(f);
    });
    return floors.length ? floors : ['1ST FLOOR'];
  };

  const toggleFloor = (f) => {
    setExpandedFloors(prev => ({ ...prev, [f]: prev[f] === false ? true : false }));
  };

  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const handleRoomPress = (room) => {
    navigation.navigate('PhotoManager', {
      projectId,
      projectName,
      roomId: room.id,
      roomName: room.name,
    });
  };

  const expandAll = () => {
    const newFloors = {};
    const newRooms = {};
    rooms.forEach(r => { newRooms[r.id] = true; });
    setExpandedFloors(newFloors);
    setExpandedRooms(newRooms);
  };

  const collapseAll = () => {
    const newFloors = {};
    const newRooms = {};
    getFloorOrder().forEach(f => { newFloors[f] = false; });
    rooms.forEach(r => { newRooms[r.id] = false; });
    setExpandedFloors(newFloors);
    setExpandedRooms(newRooms);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading walkthrough...</Text>
      </View>
    );
  }

  const floors = getFloorOrder();
  rooms.forEach(r => {
    const f = r.floor || '1ST FLOOR';
    if (!floors.includes(f)) floors.push(f);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Project Header */}
        <View style={styles.header}>
          <Text style={styles.projectTitle}>{projectName}</Text>
          <Text style={styles.subtitle}>{rooms.length} rooms</Text>
        </View>

        {/* Expand / Collapse All */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.expandBtn} onPress={expandAll}>
            <Text style={styles.expandBtnText}>EXPAND ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.collapseBtn} onPress={collapseAll}>
            <Text style={styles.collapseBtnText}>COLLAPSE ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Floor-Grouped Rooms */}
        {floors.map((floorName) => {
          const floorRooms = rooms.filter(r => (r.floor || '1ST FLOOR') === floorName);
          const isFloorCollapsed = expandedFloors[floorName] === false;

          return (
            <View key={`floor-${floorName}`}>
              {/* Floor Banner */}
              <TouchableOpacity style={styles.floorBanner} onPress={() => toggleFloor(floorName)}>
                <View style={styles.floorBannerLeft}>
                  <Text style={styles.floorToggle}>{isFloorCollapsed ? '▶' : '▼'}</Text>
                  <View style={styles.floorBadge}>
                    <Text style={styles.floorBadgeText}>
                      {floorName.match(/\d+/) ? floorName.match(/\d+/)[0] : floorName.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.floorName}>{floorName}</Text>
                </View>
                <Text style={styles.floorCount}>
                  {floorRooms.length} ROOM{floorRooms.length !== 1 ? 'S' : ''}
                </Text>
              </TouchableOpacity>

              {/* Rooms */}
              {!isFloorCollapsed && (
                <View style={styles.roomsList}>
                  {floorRooms.map((room) => {
                    const isExpanded = expandedRooms[room.id];
                    return (
                      <View key={room.id}>
                        {/* Room Header */}
                        <TouchableOpacity
                          style={[styles.roomHeader, { backgroundColor: room.color || '#1F2937' }]}
                          onPress={() => toggleRoom(room.id)}
                        >
                          <View style={styles.roomHeaderLeft}>
                            <Text style={styles.roomToggle}>{isExpanded ? '▼' : '▶'}</Text>
                            <Text style={styles.roomName}>{room.name.toUpperCase()}</Text>
                          </View>
                          <Text style={styles.roomCatCount}>
                            {room.categories?.length || 0} categories
                          </Text>
                        </TouchableOpacity>

                        {/* Room Content - Categories */}
                        {isExpanded && (
                          <View style={styles.roomContent}>
                            {room.categories?.map((category) => (
                              <View key={category.id} style={styles.categorySection}>
                                <View style={styles.categoryHeader}>
                                  <Text style={styles.categoryName}>{category.name.toUpperCase()}</Text>
                                </View>
                                {category.subcategories?.map((sub) => (
                                  <View key={sub.id}>
                                    {sub.items?.map((item) => (
                                      <View key={item.id} style={styles.itemRow}>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.itemSize}>{item.size || ''}</Text>
                                        <Text style={styles.itemFinish}>{item.finish_color || ''}</Text>
                                      </View>
                                    ))}
                                  </View>
                                ))}
                              </View>
                            ))}

                            {/* Photo Button */}
                            <TouchableOpacity
                              style={styles.photoButton}
                              onPress={() => handleRoomPress(room)}
                            >
                              <Text style={styles.photoButtonText}>📸 Manage Photos</Text>
                            </TouchableOpacity>

                            {/* Room Notes */}
                            {room.notes ? (
                              <View style={styles.notesSection}>
                                <Text style={styles.notesLabel}>NOTES</Text>
                                <Text style={styles.notesText}>{room.notes}</Text>
                              </View>
                            ) : null}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {rooms.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rooms found</Text>
            <Text style={styles.emptySubtext}>Add rooms on the web app first</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  loadingText: { marginTop: 16, color: '#9CA3AF', fontSize: 16 },
  content: { flex: 1 },
  header: { padding: 20, backgroundColor: '#1F2937', borderBottomWidth: 3, borderBottomColor: '#D4A574' },
  projectTitle: { fontSize: 24, fontWeight: 'bold', color: '#D4A574', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF' },
  buttonRow: { flexDirection: 'row', padding: 12, gap: 8 },
  expandBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(212,165,116,0.2)', borderWidth: 1, borderColor: 'rgba(212,165,116,0.3)' },
  expandBtnText: { color: '#D4A574', fontWeight: 'bold', fontSize: 12 },
  collapseBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(107,114,128,0.2)', borderWidth: 1, borderColor: 'rgba(107,114,128,0.3)' },
  collapseBtnText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 12 },
  floorBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 8,
    backgroundColor: '#2a2218', borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#D4A574',
  },
  floorBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floorToggle: { color: '#D4A574', fontSize: 16 },
  floorBadge: {
    width: 30, height: 30, borderRadius: 6, backgroundColor: '#D4A574',
    justifyContent: 'center', alignItems: 'center',
  },
  floorBadgeText: { color: '#000', fontWeight: '900', fontSize: 14 },
  floorName: { color: '#D4A574', fontWeight: '900', fontSize: 16, letterSpacing: 3 },
  floorCount: { color: '#D4A574', opacity: 0.5, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  roomsList: { paddingHorizontal: 4 },
  roomHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, marginTop: 4, borderRadius: 4, borderWidth: 1, borderColor: '#B49B7E',
  },
  roomHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomToggle: { color: '#FFF', fontSize: 14 },
  roomName: { color: '#FFF', fontWeight: 'bold', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  roomCatCount: { color: '#D4C5A9', fontSize: 11 },
  roomContent: { paddingHorizontal: 8, paddingBottom: 12 },
  categorySection: { marginTop: 8, borderRadius: 4, overflow: 'hidden' },
  categoryHeader: { backgroundColor: '#065F46', padding: 8, borderWidth: 1, borderColor: '#B49B7E' },
  categoryName: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  itemRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#374151', backgroundColor: '#1F2937' },
  itemName: { flex: 3, color: '#F5F5DC', fontSize: 13 },
  itemSize: { flex: 1, color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
  itemFinish: { flex: 1, color: '#9CA3AF', fontSize: 12, textAlign: 'right' },
  photoButton: { backgroundColor: '#D4A574', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  photoButtonText: { color: '#1F2937', fontWeight: 'bold', fontSize: 14 },
  notesSection: { marginTop: 8, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(180,155,126,0.2)' },
  notesLabel: { color: '#D4A574', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  notesText: { color: '#F5F5DC', fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 18, color: '#9CA3AF', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
