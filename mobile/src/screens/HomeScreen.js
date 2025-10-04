import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { offlineService } from '../services/offlineService';

export default function HomeScreen({ navigation }) {
  const [syncStatus, setSyncStatus] = useState({
    pendingPhotos: 0,
    pendingItems: 0,
    pendingMeasurements: 0,
    totalPending: 0,
  });

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    const status = await offlineService.getSyncStatus();
    setSyncStatus(status);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Interior Design Manager</Text>
          <Text style={styles.subtitle}>On-Site Project Management</Text>
        </View>

        {/* Sync Status Card */}
        {syncStatus.totalPending > 0 && (
          <View style={styles.syncCard}>
            <Text style={styles.syncTitle}>📡 Pending Sync</Text>
            <Text style={styles.syncText}>
              {syncStatus.pendingPhotos} photos, {syncStatus.pendingItems} items,{' '}
              {syncStatus.pendingMeasurements} measurements
            </Text>
            <Text style={styles.syncNote}>
              Will sync automatically when online
            </Text>
          </View>
        )}

        {/* Main Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.primaryCard]}
            onPress={() => navigation.navigate('ProjectList')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Projects</Text>
            <Text style={styles.actionSubtitle}>View all projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.secondaryCard]}
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Select a project first to access walkthrough'
              );
            }}
          >
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionTitle}>Walkthrough</Text>
            <Text style={styles.actionSubtitle}>On-site checklists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.secondaryCard]}
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Select a project first to manage photos'
              );
            }}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionTitle}>Photos</Text>
            <Text style={styles.actionSubtitle}>Manage project photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.secondaryCard]}
            onPress={() => navigation.navigate('LeicaConnection')}
          >
            <Text style={styles.actionIcon}>📏</Text>
            <Text style={styles.actionTitle}>Leica D5</Text>
            <Text style={styles.actionSubtitle}>Laser measurements</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✨ Features</Text>
          <Text style={styles.infoText}>• Offline-first design</Text>
          <Text style={styles.infoText}>• Photo capture with room organization</Text>
          <Text style={styles.infoText}>• Leica D5 laser measurement integration</Text>
          <Text style={styles.infoText}>• Photo annotation with measurements</Text>
          <Text style={styles.infoText}>• Auto-sync when online</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  syncCard: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  syncText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  syncNote: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#D4A574',
    width: '100%',
  },
  secondaryCard: {
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
    paddingLeft: 8,
  },
});