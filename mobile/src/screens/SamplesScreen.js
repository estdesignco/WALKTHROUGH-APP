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
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function SamplesScreen({ route, navigation }) {
  const { projectId, projectName } = route.params;
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSamples(projectId);
      setSamples(response.data.samples || []);
    } catch (error) {
      console.error('Failed to load samples:', error);
      Alert.alert('Error', 'Failed to load samples library');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSamples();
    setRefreshing(false);
  };

  const updateSampleStatus = async (sampleId, newStatus) => {
    try {
      await apiService.updateSample(sampleId, { status: newStatus });
      setSamples(prev =>
        prev.map(sample =>
          sample.id === sampleId ? { ...sample, status: newStatus } : sample
        )
      );
    } catch (error) {
      console.error('Failed to update sample status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'ordered': return '#3B82F6';
      case 'received': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const filterOptions = ['all', 'pending', 'ordered', 'received', 'approved', 'rejected'];

  const filteredSamples = samples.filter(sample => {
    if (activeFilter === 'all') return true;
    return sample.status?.toLowerCase() === activeFilter;
  });

  const counts = {
    all: samples.length,
    pending: samples.filter(s => s.status?.toLowerCase() === 'pending').length,
    ordered: samples.filter(s => s.status?.toLowerCase() === 'ordered').length,
    received: samples.filter(s => s.status?.toLowerCase() === 'received').length,
    approved: samples.filter(s => s.status?.toLowerCase() === 'approved').length,
    rejected: samples.filter(s => s.status?.toLowerCase() === 'rejected').length,
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading samples library...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.projectTitle}>{projectName}</Text>
        <Text style={styles.subtitle}>Samples Library</Text>
      </View>

      {/* Filter Tabs - Scrollable */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterOptions.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Samples Grid */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A574"
          />
        }
      >
        <View style={styles.grid}>
          {filteredSamples.map(sample => (
            <View key={sample.id} style={styles.sampleCard}>
              {/* Large Image */}
              <View style={styles.imageContainer}>
                {sample.finish_image || sample.image_url ? (
                  <Image
                    source={{ uri: sample.finish_image || sample.image_url }}
                    style={styles.sampleImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImage}>
                    <Text style={styles.noImageIcon}>🖼️</Text>
                    <Text style={styles.noImageText}>No Image</Text>
                  </View>
                )}
                
                {/* Status Badge Overlay */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sample.status) }]}>
                  <Text style={styles.statusText}>
                    {sample.status?.toUpperCase() || 'PENDING'}
                  </Text>
                </View>
              </View>

              {/* Sample Info */}
              <View style={styles.sampleInfo}>
                <Text style={styles.sampleName} numberOfLines={2}>
                  {sample.name || sample.finish_color || 'Unnamed Sample'}
                </Text>
                
                {sample.vendor && (
                  <Text style={styles.sampleVendor}>{sample.vendor}</Text>
                )}
                
                {sample.finish_color && (
                  <Text style={styles.sampleFinish}>Finish: {sample.finish_color}</Text>
                )}

                {/* Quick Status Update */}
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => updateSampleStatus(sample.id, 'approved')}
                  >
                    <Text style={styles.actionButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => updateSampleStatus(sample.id, 'rejected')}
                  >
                    <Text style={styles.actionButtonText}>✗</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Room/Category Info */}
              {(sample.room_name || sample.category_name) && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>
                    {sample.room_name}{sample.room_name && sample.category_name ? ' → ' : ''}{sample.category_name}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {filteredSamples.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎨</Text>
            <Text style={styles.emptyText}>No samples found</Text>
            <Text style={styles.emptySubtext}>
              Samples are synced automatically when you add items with finish colors to your checklist
            </Text>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={{ height: 40 }} />
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
  header: {
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 4,
    borderBottomColor: '#8B5CF6',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#1F2937',
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#374151',
  },
  filterTabActive: {
    backgroundColor: '#D4A574',
  },
  filterTabText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sampleCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#374151',
    position: 'relative',
  },
  sampleImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noImageText: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sampleInfo: {
    padding: 12,
  },
  sampleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  sampleVendor: {
    fontSize: 12,
    color: '#D4A574',
    marginBottom: 2,
  },
  sampleFinish: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
  },
  locationText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
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
    lineHeight: 20,
  },
});
