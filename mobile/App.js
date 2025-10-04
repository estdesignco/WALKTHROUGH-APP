import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ProjectListScreen from './src/screens/ProjectListScreen';
import WalkthroughScreen from './src/screens/WalkthroughScreen';
import PhotoManagerScreen from './src/screens/PhotoManagerScreen';
import LeicaConnectionScreen from './src/screens/LeicaConnectionScreen';

// Services
import { syncService } from './src/services/syncService';
import { offlineService } from './src/services/offlineService';

const Stack = createStackNavigator();

export default function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      
      if (online && !isSyncing) {
        // Trigger background sync when coming online
        handleSync();
      }
    });

    // Initialize offline storage
    offlineService.init();

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await syncService.syncAll();
      if (result.success) {
        console.log('Sync completed:', result);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Error', 'Failed to sync data. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      
      {/* Offline/Sync Indicator */}
      {(!isOnline || isSyncing) && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {isSyncing ? '🔄 Syncing...' : '📡 Offline Mode'}
          </Text>
        </View>
      )}

      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1F2937',
          },
          headerTintColor: '#D4A574',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Interior Design Manager' }}
        />
        <Stack.Screen 
          name="ProjectList" 
          component={ProjectListScreen}
          options={{ title: 'Projects' }}
        />
        <Stack.Screen 
          name="Walkthrough" 
          component={WalkthroughScreen}
          options={{ title: 'Walkthrough' }}
        />
        <Stack.Screen 
          name="PhotoManager" 
          component={PhotoManagerScreen}
          options={{ title: 'Photo Management' }}
        />
        <Stack.Screen 
          name="LeicaConnection" 
          component={LeicaConnectionScreen}
          options={{ title: 'Leica D5 Connection' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: '#F59E0B',
    padding: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 12,
  },
});