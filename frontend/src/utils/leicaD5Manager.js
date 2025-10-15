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
    this.pollingInterval = null;
    this.lastRawValue = null; // Track last value to detect changes
    this.lastMeasurement = null;
    
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
  
  // Get detailed browser compatibility info
  getBrowserCompatibilityInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    
    // Important: Chrome on iOS uses Safari's WebKit, so Web Bluetooth won't work
    const isChromeOnIOS = isIOS && isChrome;
    const isRealChrome = isChrome && !isIOS; // Real Chrome (Android/Desktop)
    
    return {
      browser: isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Other',
      platform: isIOS ? 'iOS/iPadOS' : isAndroid ? 'Android' : 'Desktop',
      supported: navigator.bluetooth !== undefined,
      isSafari,
      isIOS,
      isAndroid,
      isChrome,
      isChromeOnIOS,
      isRealChrome
    };
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
        console.log('🔍 Searching for Leica DISTO devices...');
        // Try to find device with more flexible filtering
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'DISTO' },
            { namePrefix: 'Leica' },
            { namePrefix: 'D5' }
          ],
          optionalServices: [
            this.SERVICE_UUID, 
            'generic_access', 
            'device_information',
            'battery_service'
          ]
        });
        console.log('✅ Device selected:', this.device.name || 'Unknown Device');
      }

      // Connect to GATT server with extended timeout and retry
      console.log('🔗 Connecting to GATT server...');
      console.log('💡 Tip: Make sure Leica D5 is ON and not connected to another device');
      
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          // Simple connection with 90 second timeout
          const timeout = 90000;
          
          console.log(`🔌 Attempt ${4 - retries}/3 - Please wait up to 90 seconds...`);
          
          this.server = await Promise.race([
            this.device.gatt.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Connection timeout after ${timeout/1000}s - Try turning Leica OFF and ON`)), timeout)
            )
          ]);
          
          console.log('✅ Connected to GATT server successfully!');
          lastError = null;
          break;
          
        } catch (err) {
          lastError = err;
          retries--;
          
          if (retries === 0) {
            console.error('❌ All connection attempts failed');
            console.error('💡 Troubleshooting: 1) Turn Leica OFF and back ON, 2) Make sure it\'s not connected to another device, 3) Move closer to Leica');
            throw new Error(`Connection failed: ${err.message}`);
          }
          
          console.log(`⚠️ Connection failed, retrying... (${retries} attempts left)`);
          console.log(`   Error was: ${err.message}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Get ALL services and discover the actual UUIDs
      console.log('📡 Discovering all services...');
      const services = await Promise.race([
        this.server.getPrimaryServices(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service discovery timeout')), 15000)
        )
      ]);
      
      console.log(`✅ Found ${services.length} services`);
      
      // Log all services and characteristics for debugging
      for (const service of services) {
        console.log(`📡 Service: ${service.uuid}`);
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            console.log(`  📊 Characteristic: ${char.uuid} - Properties: ${char.properties.map(p => p).join(', ')}`);
          }
        } catch (e) {
          console.log(`  ⚠️ Could not get characteristics: ${e.message}`);
        }
      }
      
      // Try to find the Leica-specific service, or use any available service
      let targetService = services.find(s => s.uuid.toLowerCase() === this.SERVICE_UUID.toLowerCase());
      
      if (!targetService && services.length > 0) {
        // Use first non-standard service (not generic access or device info)
        targetService = services.find(s => 
          !s.uuid.startsWith('0000180') && 
          !s.uuid.startsWith('0000181')
        );
      }
      
      if (!targetService && services.length > 0) {
        // Fall back to any service
        targetService = services[0];
      }
      
      if (!targetService) {
        throw new Error('No usable service found on device');
      }
      
      this.service = targetService;
      console.log(`✅ Using service: ${this.service.uuid}`);

      // Get ALL characteristics from this service
      console.log('📊 Getting all characteristics...');
      const allChars = await Promise.race([
        this.service.getCharacteristics(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Characteristic discovery timeout')), 15000)
        )
      ]);
      
      console.log(`✅ Found ${allChars.length} characteristics`);
      
      // Find writable and readable characteristics
      this.commandCharacteristic = allChars.find(c => 
        c.properties.write || c.properties.writeWithoutResponse
      );
      
      this.measurementCharacteristic = allChars.find(c => 
        c.properties.read || c.properties.notify
      );
      
      if (this.commandCharacteristic) {
        console.log(`✅ Command characteristic: ${this.commandCharacteristic.uuid}`);
      }
      if (this.measurementCharacteristic) {
        console.log(`✅ Measurement characteristic: ${this.measurementCharacteristic.uuid}`);
      }

      // Start notifications for measurements, fall back to polling if needed
      try {
        const notificationsStarted = await this.startMeasurementNotifications();
        if (!notificationsStarted) {
          console.log('💡 Falling back to polling mode (every 2 seconds)');
          this.startPolling(2000); // Poll every 2 seconds
        }
      } catch (notificationError) {
        console.warn('⚠️ Notification setup failed, using polling mode:', notificationError.message);
        this.startPolling(2000); // Poll every 2 seconds
      }

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
      console.warn('⚠️ No measurement characteristic available');
      return false;
    }

    try {
      // Check if characteristic supports notifications
      if (!this.measurementCharacteristic.properties.notify) {
        console.warn('⚠️ Characteristic does not support notifications, will use polling instead');
        return false;
      }

      console.log('🔔 Starting measurement notifications...');
      await this.measurementCharacteristic.startNotifications();
      
      this.measurementCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const measurement = this.parseMeasurement(value);
        console.log('📏 Measurement received:', measurement);
        
        if (this.onMeasurement) {
          this.onMeasurement(measurement);
        }
      });
      
      console.log('✅ Notifications started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start notifications:', error);
      console.log('💡 Will fall back to polling mode');
      return false;
    }
  }
  
  // Force fresh measurement reading - no cache
  async readCurrentMeasurement() {
    if (!this.measurementCharacteristic) {
      throw new Error('Measurement characteristic not available');
    }

    try {
      console.log('🔄 FORCING FRESH MEASUREMENT READ...');
      
      // Clear any cached values first
      this.lastRawValue = null;
      this.lastMeasurement = null;
      
      // Stop any polling to avoid interference
      this.stopPolling();
      
      // Force a fresh read from the device
      const value = await this.measurementCharacteristic.readValue();
      
      if (!value || value.byteLength === 0) {
        console.log('❌ No data received from Leica');
        return null;
      }
      
      console.log(`📊 Fresh data: ${value.byteLength} bytes`);
      
      // Log raw bytes
      const bytes = [];
      for (let i = 0; i < value.byteLength; i++) {
        bytes.push(value.getUint8(i).toString(16).padStart(2, '0'));
      }
      console.log('🔍 Fresh raw bytes:', bytes.join(' '));
      
      // Force re-parse without cache check
      const measurement = this.parseMeasurement(value);
      
      if (measurement) {
        console.log('✅ FRESH MEASUREMENT:', measurement.feetInches);
        this.lastMeasurement = measurement;
        return measurement;
      } else {
        console.log('❌ Failed to parse fresh measurement');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Fresh measurement read failed:', error);
      throw error;
    }
  }
  async readMeasurement() {
    if (!this.measurementCharacteristic) {
      throw new Error('No measurement characteristic available');
    }

    try {
      const value = await this.measurementCharacteristic.readValue();
      
      // Create a hash of the raw bytes to detect changes
      let rawHash = '';
      for (let i = 0; i < value.byteLength; i++) {
        rawHash += value.getUint8(i).toString(16).padStart(2, '0');
      }
      
      // Only process if the value has CHANGED
      if (rawHash === this.lastRawValue) {
        // Same value, no new measurement
        return null;
      }
      
      console.log('🆕 NEW measurement detected! (value changed)');
      this.lastRawValue = rawHash;
      
      const measurement = this.parseMeasurement(value);
      
      if (!measurement) {
        console.error('❌ Failed to parse measurement');
        return null;
      }
      
      console.log('📏 NEW Measurement:', measurement.feetInches, `(${measurement.meters}m)`);
      this.lastMeasurement = measurement;
      
      if (this.onMeasurement) {
        this.onMeasurement(measurement);
      }
      
      return measurement;
    } catch (error) {
      console.error('❌ Failed to read measurement:', error);
      return null;
    }
  }
  
  // Start polling for measurements (fallback when notifications not supported)
  startPolling(intervalMs = 1000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    console.log('🔄 Starting measurement polling (checking for changes every second)...');
    console.log('💡 Press the measurement button on your Leica D5 to take a new reading');
    
    this.pollingInterval = setInterval(async () => {
      try {
        const measurement = await this.readMeasurement();
        // readMeasurement returns null if no change, so no spam
      } catch (error) {
        // Silently fail during polling
      }
    }, intervalMs);
  }
  
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹ Stopped polling');
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
      // Log raw data for debugging
      console.log('🔍 Raw data buffer length:', dataView.byteLength);
      const rawBytes = [];
      for (let i = 0; i < Math.min(dataView.byteLength, 20); i++) {
        rawBytes.push(dataView.getUint8(i).toString(16).padStart(2, '0'));
      }
      console.log('🔍 Raw bytes (hex):', rawBytes.join(' '));
      
      let distanceMM;
      
      // Try multiple parsing methods
      let parsedSuccessfully = false;
      
      // Method 1: ASCII string
      try {
        const decoder = new TextDecoder('utf-8');
        const asciiString = decoder.decode(dataView.buffer);
        console.log('🔍 Method 1 - ASCII String:', JSON.stringify(asciiString));
        
        const cleaned = asciiString.replace(/[^\d.-]/g, '');
        const parsedFromString = parseFloat(cleaned);
        
        if (!isNaN(parsedFromString) && parsedFromString > 0 && parsedFromString < 100000) {
          console.log('✅ Method 1 SUCCESS:', parsedFromString, 'mm');
          distanceMM = parsedFromString;
          parsedSuccessfully = true;
        }
      } catch (e) {
        console.log('⚠️ Method 1 failed:', e.message);
      }
      
      // Method 2: 32-bit float (some Leicas use this)
      if (!parsedSuccessfully && dataView.byteLength >= 4) {
        try {
          const float32 = dataView.getFloat32(0, true);
          console.log('🔍 Method 2 - 32-bit Float LE:', float32);
          
          if (!isNaN(float32) && float32 > 0 && float32 < 100000) {
            console.log('✅ Method 2 SUCCESS:', float32, 'mm');
            distanceMM = float32;
            parsedSuccessfully = true;
          }
        } catch (e) {
          console.log('⚠️ Method 2 failed:', e.message);
        }
      }
      
      // Method 3: 32-bit int (binary)
      if (!parsedSuccessfully && dataView.byteLength >= 4) {
        const int32 = dataView.getUint32(0, true);
        console.log('🔍 Method 3 - 32-bit Int LE:', int32);
        
        // Check if it looks like millimeters (reasonable range)
        if (int32 > 0 && int32 < 100000) {
          console.log('✅ Method 3 SUCCESS:', int32, 'mm');
          distanceMM = int32;
          parsedSuccessfully = true;
        } else {
          console.log('⚠️ Method 3 - value out of range');
        }
      }
      
      // Method 4: Try reading just the first 2 bytes
      if (!parsedSuccessfully && dataView.byteLength >= 2) {
        const int16 = dataView.getUint16(0, true);
        console.log('🔍 Method 4 - 16-bit Int LE:', int16);
        
        if (int16 > 0 && int16 < 100000) {
          console.log('✅ Method 4 SUCCESS:', int16, 'mm');
          distanceMM = int16;
          parsedSuccessfully = true;
        }
      }
      
      if (!parsedSuccessfully) {
        console.error('❌ ALL PARSING METHODS FAILED!');
        return null;
      }
      
      // Convert to different units
      const distanceMeters = distanceMM / 1000;
      const distanceInches = distanceMM / 25.4;
      const distanceFeet = distanceInches / 12;
      const distanceCM = distanceMM / 10;

      const result = {
        mm: distanceMM,
        cm: Math.round(distanceCM * 10) / 10,
        meters: Math.round(distanceMeters * 1000) / 1000,
        inches: Math.round(distanceInches * 10) / 10,
        feet: Math.round(distanceFeet * 100) / 100,
        feetInches: this.toFeetInches(distanceInches),
        timestamp: Date.now()
      };
      
      console.log('📏 Parsed measurement:', result);
      return result;
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
    // Stop polling if active
    this.stopPolling();
    
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
    
    // Stop polling if active
    this.stopPolling();
    
    // Clear cached values
    this.lastRawValue = null;
    this.lastMeasurement = null;
    
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