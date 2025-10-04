import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { leicaService } from '../services/leicaService';

export default function LeicaConnectionScreen({ navigation }) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Setup measurement callback
    leicaService.onMeasurement((measurement) => {
      console.log('Measurement received:', measurement);
      setLastMeasurement(measurement);
    });

    return () => {
      leicaService.disconnect();
    };
  }, []);

  const handleScan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      
      const foundDevices = await leicaService.scanForLeica(10000);
      setDevices(foundDevices);
      
      if (foundDevices.length === 0) {
        Alert.alert(
          'No Devices Found',
          'Make sure your Leica D5 is turned on and Bluetooth is enabled.\n\nDevice should show:\n• DISTO D5\n• Leica...\n• Last 7 digits of serial number'
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device) => {
    try {
      setConnecting(true);
      await leicaService.connect(device.id);
      setConnectedDevice(device);
      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connect error:', error);
      Alert.alert('Connection Error', error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await leicaService.disconnect();
      setConnectedDevice(null);
      setLastMeasurement(null);
      Alert.alert('Disconnected', 'Device disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleMeasure = async () => {
    try {
      await leicaService.triggerMeasurement();
      Alert.alert('Measurement Triggered', 'Waiting for measurement data...');
    } catch (error) {
      console.error('Measure error:', error);
      Alert.alert('Measurement Error', error.message);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleConnect(item)}
      disabled={connecting}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>ID: {item.id.substring(0, 18)}...</Text>
        <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
      </View>
      <Text style={styles.connectIcon}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leica DISTO D5</Text>
        <Text style={styles.subtitle}>Bluetooth Laser Measurement</Text>
      </View>

      {/* Connection Status */}
      {connectedDevice ? (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusTitle}>✅ Connected</Text>
              <Text style={styles.statusDevice}>{connectedDevice.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          {/* Measurement Display */}
          {lastMeasurement && (
            <View style={styles.measurementCard}>
              <Text style={styles.measurementTitle}>Last Measurement</Text>
              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Distance</Text>
                  <Text style={styles.measurementValue}>
                    {lastMeasurement.distance.toFixed(3)} m
                  </Text>
                </View>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Height</Text>
                  <Text style={styles.measurementValue}>
                    {lastMeasurement.height.toFixed(3)} m
                  </Text>
                </View>
              </View>
              <Text style={styles.measurementTime}>
                {new Date(lastMeasurement.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}

          {/* Measure Button */}
          <TouchableOpacity
            style={styles.measureButton}
            onPress={handleMeasure}
          >
            <Text style={styles.measureButtonText}>📏 Take Measurement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Scan Button */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.scanButtonText}>🔍 Scan for Devices</Text>
            )}
          </TouchableOpacity>

          {/* Device List */}
          {devices.length > 0 ? (
            <View style={styles.deviceList}>
              <Text style={styles.listTitle}>Found Devices ({devices.length})</Text>
              <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📏</Text>
              <Text style={styles.emptyText}>No devices found</Text>
              <Text style={styles.emptySubtext}>
                Tap "Scan for Devices" to search for your Leica D5
              </Text>
            </View>
          )}
        </>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📝 Instructions</Text>
        <Text style={styles.instructionText}>1. Turn on your Leica DISTO D5</Text>
        <Text style={styles.instructionText}>2. Enable Bluetooth in device menu</Text>
        <Text style={styles.instructionText}>3. Scan and connect to device</Text>
        <Text style={styles.instructionText}>4. Take measurements remotely</Text>
        <Text style={styles.instructionNote}>
          Note: First time may require pairing
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statusDevice: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  measurementCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  measurementTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  measurementItem: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A574',
  },
  measurementTime: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  measureButton: {
    backgroundColor: '#D4A574',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  measureButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deviceList: {
    flex: 1,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 12,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#6B7280',
  },
  connectIcon: {
    fontSize: 24,
    color: '#D4A574',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
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
  instructions: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
    paddingLeft: 8,
  },
  instructionNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 8,
  },
});