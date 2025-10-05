// Leica DISTO D5 Bluetooth Integration
// Connects to Leica D5 via Web Bluetooth API

export class LeicaD5Manager {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.measurementCharacteristic = null;
    this.commandCharacteristic = null;
    this.onMeasurement = null;
    
    // Leica D5 Bluetooth UUIDs (standard DISTO protocol)
    this.SERVICE_UUID = '3ab10100-f831-4395-b29d-570977d5bf94';
    this.MEASUREMENT_CHAR_UUID = '3ab10101-f831-4395-b29d-570977d5bf94';
    this.COMMAND_CHAR_UUID = '3ab10102-f831-4395-b29d-570977d5bf94';
  }

  // Check if Web Bluetooth is supported
  isSupported() {
    if (!navigator.bluetooth) {
      console.error('Web Bluetooth not supported in this browser');
      return false;
    }
    return true;
  }

  // Connect to Leica D5
  async connect() {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth not supported. Use Chrome on Android or desktop.');
    }

    try {
      console.log('🔍 Requesting Leica DISTO D5...');
      
      // Request device with ALL possible filters
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'DISTO' }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      console.log('✅ Device selected:', this.device.name);

      // Connect to GATT server
      console.log('🔗 Connecting to GATT server...');
      this.server = await this.device.gatt.connect();
      console.log('✅ Connected to GATT server');

      // Get service
      console.log('📡 Getting Leica service...');
      this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
      console.log('✅ Service obtained');

      // Get characteristics
      console.log('📊 Getting measurement characteristic...');
      this.measurementCharacteristic = await this.service.getCharacteristic(this.MEASUREMENT_CHAR_UUID);
      console.log('✅ Measurement characteristic obtained');

      console.log('📝 Getting command characteristic...');
      this.commandCharacteristic = await this.service.getCharacteristic(this.COMMAND_CHAR_UUID);
      console.log('✅ Command characteristic obtained');

      // Start notifications for measurements
      await this.startMeasurementNotifications();

      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      return {
        success: true,
        deviceName: this.device.name,
        deviceId: this.device.id
      };

    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw new Error(`Failed to connect to Leica D5: ${error.message}`);
    }
  }

  // Start listening for measurements
  async startMeasurementNotifications() {
    if (!this.measurementCharacteristic) {
      throw new Error('Measurement characteristic not available');
    }

    try {
      await this.measurementCharacteristic.startNotifications();
      console.log('✅ Measurement notifications started');

      this.measurementCharacteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleMeasurementChange.bind(this)
      );

    } catch (error) {
      console.error('❌ Failed to start notifications:', error);
      throw error;
    }
  }

  // Handle measurement data
  handleMeasurementChange(event) {
    const value = event.target.value;
    const measurement = this.parseMeasurement(value);
    
    console.log('📏 Measurement received:', measurement);

    if (this.onMeasurement && typeof this.onMeasurement === 'function') {
      this.onMeasurement(measurement);
    }
  }

  // Parse measurement data from Leica
  parseMeasurement(dataView) {
    try {
      // Leica sends distance in millimeters as 32-bit integer (little-endian)
      const distanceMM = dataView.getUint32(0, true);
      
      // Convert to different units
      const distanceMeters = distanceMM / 1000;
      const distanceInches = distanceMM / 25.4;
      const distanceFeet = distanceInches / 12;
      const distanceCM = distanceMM / 10;

      return {
        mm: distanceMM,
        cm: Math.round(distanceCM * 10) / 10,
        meters: Math.round(distanceMeters * 1000) / 1000,
        inches: Math.round(distanceInches * 10) / 10,
        feet: Math.round(distanceFeet * 100) / 100,
        feetInches: this.toFeetInches(distanceInches),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to parse measurement:', error);
      return null;
    }
  }

  // Convert inches to feet'inches" format
  toFeetInches(totalInches) {
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }

  // Trigger measurement (if device supports remote trigger)
  async triggerMeasurement() {
    if (!this.commandCharacteristic) {
      throw new Error('Command characteristic not available');
    }

    try {
      // Command byte to trigger measurement (device-specific, may need adjustment)
      const triggerCommand = new Uint8Array([0x01]);
      await this.commandCharacteristic.writeValue(triggerCommand);
      console.log('✅ Measurement triggered');
    } catch (error) {
      console.error('❌ Failed to trigger measurement:', error);
      throw error;
    }
  }

  // Disconnect from device
  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
      console.log('✅ Disconnected from Leica D5');
    }
    this.device = null;
    this.server = null;
    this.service = null;
    this.measurementCharacteristic = null;
    this.commandCharacteristic = null;
  }

  // Handle disconnection
  onDisconnected() {
    console.log('⚠️ Leica D5 disconnected');
    this.device = null;
    this.server = null;
  }

  // Get connection status
  isConnected() {
    return this.device && this.device.gatt && this.device.gatt.connected;
  }

  // Set measurement callback
  setOnMeasurement(callback) {
    this.onMeasurement = callback;
  }
}

// Export singleton instance
export const leicaManager = new LeicaD5Manager();