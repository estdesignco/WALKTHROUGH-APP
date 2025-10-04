import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { apiService } from '../services/apiService';
import { offlineService } from '../services/offlineService';
import NetInfo from '@react-native-community/netinfo';

export default function ProjectListScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadProjects();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API
      try {
        const response = await apiService.getProjects();
        const fetchedProjects = response.data || [];
        setProjects(fetchedProjects);
        
        // Cache for offline use
        await offlineService.cacheProjects(fetchedProjects);
      } catch (error) {
        console.error('Failed to fetch projects from API:', error);
        
        // Fall back to cached data
        const cachedProjects = await offlineService.getCachedProjects();
        setProjects(cachedProjects);
      }
    } catch (error) {
      console.error('Load projects error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleProjectPress = (project) => {
    navigation.navigate('Walkthrough', { 
      projectId: project.id,
      projectName: project.name 
    });
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Text style={styles.projectArrow}>→</Text>
      </View>
      
      {item.client_info && (
        <View style={styles.projectInfo}>
          <Text style={styles.clientName}>
            👤 {item.client_info.full_name}
          </Text>
          <Text style={styles.projectDetail}>
            📍 {item.client_info.address}
          </Text>
        </View>
      )}
      
      <View style={styles.projectFooter}>
        <Text style={styles.projectType}>{item.project_type || 'Renovation'}</Text>
        <Text style={styles.roomCount}>
          {item.rooms?.length || 0} rooms
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && projects.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 Offline Mode - Using cached data</Text>
        </View>
      )}
      
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A574"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No projects found</Text>
            <Text style={styles.emptySubtext}>
              Create a project on the web app to get started
            </Text>
          </View>
        }
      />
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
  offlineBanner: {
    backgroundColor: '#F59E0B',
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A574',
    flex: 1,
  },
  projectArrow: {
    fontSize: 24,
    color: '#D4A574',
    marginLeft: 12,
  },
  projectInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  projectDetail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  projectType: {
    fontSize: 12,
    color: '#D4A574',
    fontWeight: '600',
  },
  roomCount: {
    fontSize: 12,
    color: '#9CA3AF',
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
    paddingHorizontal: 40,
  },
});