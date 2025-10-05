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
      
      // If device already paired, try to reconnect
      if (this.device && this.device.gatt) {
        console.log('📱 Found existing device, attempting reconnect...');
        try {
          if (!this.device.gatt.connected) {
            await this.device.gatt.connect();
            console.log('✅ Reconnected to existing device');
          }
        } catch (err) {
          console.log('⚠️ Reconnect failed, requesting new device...');
          this.device = null;
        }
      }
      
      // Request new device if not already connected
      if (!this.device) {
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'DISTO' }
          ],
          optionalServices: [this.SERVICE_UUID]
        });
        console.log('✅ Device selected:', this.device.name);
      }

      // Connect to GATT server with extended timeout and retry
      console.log('🔗 Connecting to GATT server...');
      let retries = 4;
      let lastError = null;
      
      while (retries > 0) {
        try {
          // Extended timeout to 60 seconds for first connection
          const timeout = retries === 4 ? 60000 : 30000;
          
          this.server = await Promise.race([
            this.device.gatt.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Connection timeout after ${timeout/1000}s`)), timeout)
            )
          ]);
          
          console.log('✅ Connected to GATT server');
          lastError = null;
          break;
          
        } catch (err) {
          lastError = err;
          retries--;
          
          if (retries === 0) {
            console.error('❌ All connection attempts failed');
            throw new Error(`Connection failed after all retries: ${err.message}`);
          }
          
          console.log(`⚠️ Retry connection... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Get service with timeout
      console.log('📡 Getting Leica service...');
      this.service = await Promise.race([
        this.server.getPrimaryService(this.SERVICE_UUID),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service discovery timeout')), 15000)
        )
      ]);
      console.log('✅ Service obtained');

      // Get characteristics with timeout
      console.log('📊 Getting characteristics...');
      const [measurementChar, commandChar] = await Promise.race([
        Promise.all([
          this.service.getCharacteristic(this.MEASUREMENT_CHAR_UUID),
          this.service.getCharacteristic(this.COMMAND_CHAR_UUID)
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Characteristic discovery timeout')), 15000)
        )
      ]);
      
      this.measurementCharacteristic = measurementChar;
      this.commandCharacteristic = commandChar;
      console.log('✅ Characteristics obtained');

      // Start notifications for measurements
      await this.startMeasurementNotifications();

      // Handle disconnection with auto-reconnect
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      return {
        success: true,
        deviceName: this.device.name,
        deviceId: this.device.id
      };

    } catch (error) {
      console.error('❌ Connection failed:', error);
      // Clean up on failure
      this.device = null;
      this.server = null;
      this.service = null;
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
    // Keep device reference for reconnection, but clear server
    this.server = null;
    this.service = null;
    this.measurementCharacteristic = null;
    this.commandCharacteristic = null;
    
    // Note: We keep this.device so we can reconnect without re-pairing
    console.log('💡 Device reference kept for quick reconnection');
  }

  // Get connection status
  isConnected() {
    return this.device && this.device.gatt && this.device.gatt.connected;
  }
  
  // Check if device is paired (but maybe not connected)
  isPaired() {
    return this.device !== null;
  }

  // Set measurement callback
  setOnMeasurement(callback) {
    this.onMeasurement = callback;
  }
}

// Export singleton instance
export const leicaManager = new LeicaD5Manager();