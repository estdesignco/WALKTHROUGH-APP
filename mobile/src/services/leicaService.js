import { BleManager } from 'react-native-ble-plx';

// Leica DISTO D5 BLE Service UUIDs (placeholders - need actual UUIDs from device)
const LEICA_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb'; // Replace with actual
const MEASUREMENT_CHARACTERISTIC_UUID = '00002345-0000-1000-8000-00805f9b34fb'; // Replace with actual

export class LeicaService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isConnected = false;
    this.measurementCallback = null;
  }

  async initialize() {
    try {
      const state = await this.manager.state();
      console.log('Bluetooth state:', state);
      
      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not powered on');
      }
      
      return true;
    } catch (error) {
      console.error('BLE initialization error:', error);
      throw error;
    }
  }

  async scanForLeica(timeout = 10000) {
    try {
      await this.initialize();
      
      const devices = [];
      
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.manager.stopDeviceScan();
          resolve(devices);
        }, timeout);

        this.manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            clearTimeout(timer);
            this.manager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && device.name && 
              (device.name.includes('DISTO') || 
               device.name.includes('Leica') ||
               device.name.includes('D5'))) {
            console.log('Found Leica device:', device.name, device.id);
            
            // Avoid duplicates
            if (!devices.find(d => d.id === device.id)) {
              devices.push({
                id: device.id,
                name: device.name,
                rssi: device.rssi,
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Scan for Leica error:', error);
      throw error;
    }
  }

  async connect(deviceId) {
    try {
      console.log('Connecting to device:', deviceId);
      
      this.device = await this.manager.connectToDevice(deviceId);
      await this.device.discoverAllServicesAndCharacteristics();
      
      this.isConnected = true;
      console.log('Connected to Leica D5');

      // Setup notifications for measurements
      await this.setupMeasurementNotifications();
      
      return true;
    } catch (error) {
      console.error('Connect error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async setupMeasurementNotifications() {
    try {
      if (!this.device) {
        throw new Error('Device not connected');
      }

      // Monitor characteristic for measurement data
      this.device.monitorCharacteristicForService(
        LEICA_SERVICE_UUID,
        MEASUREMENT_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Measurement notification error:', error);
            return;
          }

          if (characteristic?.value) {
            const measurement = this.parseMeasurement(characteristic.value);
            if (this.measurementCallback) {
              this.measurementCallback(measurement);
            }
          }
        }
      );
    } catch (error) {
      console.error('Setup notifications error:', error);
    }
  }

  parseMeasurement(base64Data) {
    try {
      // Decode base64 to get raw bytes
      const decoded = atob(base64Data);
      
      // Parse GSI format (simplified - actual implementation depends on device)
      // GSI format example: "11....+00000001.234 81..00+00000012.567"
      // Word ID 11 = horizontal distance, 81 = height difference
      
      // This is a placeholder implementation
      // TODO: Implement actual GSI format parsing based on Leica documentation
      
      return {
        distance: 0, // Parse from decoded data
        height: 0,
        angle: 0,
        unit: 'meters',
        timestamp: new Date().toISOString(),
        raw: base64Data,
      };
    } catch (error) {
      console.error('Parse measurement error:', error);
      return null;
    }
  }

  onMeasurement(callback) {
    this.measurementCallback = callback;
  }

  async triggerMeasurement() {
    try {
      if (!this.device || !this.isConnected) {
        throw new Error('Device not connected');
      }

      // Send trigger command to device
      // TODO: Implement actual trigger command based on Leica protocol
      
      console.log('Measurement triggered');
      return true;
    } catch (error) {
      console.error('Trigger measurement error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.device) {
        await this.device.cancelConnection();
        this.device = null;
        this.isConnected = false;
        console.log('Disconnected from Leica D5');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  async getDeviceInfo() {
    try {
      if (!this.device) {
        return null;
      }

      return {
        id: this.device.id,
        name: this.device.name,
        rssi: this.device.rssi,
        isConnected: this.isConnected,
      };
    } catch (error) {
      console.error('Get device info error:', error);
      return null;
    }
  }

  destroy() {
    this.disconnect();
    this.manager.destroy();
  }
}

export const leicaService = new LeicaService();
export default leicaService;