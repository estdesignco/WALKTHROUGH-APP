# Leica D5 Bluetooth Integration Plan

## Overview
The Leica DISTO D5 is a laser distance meter with Bluetooth connectivity. This document outlines the implementation plan for integrating it with the mobile app.

## Technical Requirements

### 1. Bluetooth Web API
- Use Web Bluetooth API (supported in Chrome/Edge on Android and desktop)
- iOS Safari does NOT support Web Bluetooth (would need native app)
- Alternative: Use React Native Bluetooth libraries for full mobile support

### 2. Leica D5 Specifications
- **Bluetooth Profile**: Bluetooth 4.0 (BLE - Bluetooth Low Energy)
- **Communication**: GATT (Generic Attribute Profile) protocol
- **Measurement Range**: 0.05m to 200m
- **Accuracy**: ±1mm

### 3. Implementation Approach

#### Option A: Web Bluetooth API (Browser-based)
**Pros:**
- No app store approval needed
- Works on existing web app
- Quick implementation

**Cons:**
- Only works on Chrome/Edge Android and desktop Chrome
- No iOS support
- Requires HTTPS

**Implementation Steps:**
1. Request Bluetooth device access
2. Connect to Leica D5 via Bluetooth GATT
3. Subscribe to measurement notifications
4. Parse measurement data
5. Display in UI and attach to photos

#### Option B: React Native (Native Mobile App)
**Pros:**
- Full iOS and Android support
- Better performance
- Can work offline without browser restrictions

**Cons:**
- Requires building native apps
- App store approval process
- More development time

### 4. Leica D5 Protocol

The Leica D5 communicates using proprietary GATT characteristics:

```
Service UUID: 3ab10100-f831-4395-b29d-570977d5bf94
Measurement Characteristic: 3ab10101-f831-4395-b29d-570977d5bf94
Command Characteristic: 3ab10102-f831-4395-b29d-570977d5bf94
```

**Measurement Data Format:**
- Distance value in millimeters (4 bytes)
- Unit indicator
- Status flags

## Implementation Code (Web Bluetooth)

### Step 1: Request Device Access
```javascript
async function connectLeicaD5() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ 
        name: 'DISTO D5' 
      }],
      optionalServices: ['3ab10100-f831-4395-b29d-570977d5bf94']
    });
    
    const server = await device.gatt.connect();
    return server;
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

### Step 2: Subscribe to Measurements
```javascript
async function subscribeMeasurements(server) {
  const service = await server.getPrimaryService(
    '3ab10100-f831-4395-b29d-570977d5bf94'
  );
  
  const characteristic = await service.getCharacteristic(
    '3ab10101-f831-4395-b29d-570977d5bf94'
  );
  
  await characteristic.startNotifications();
  
  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const value = event.target.value;
    const distance = parseMeasurement(value);
    console.log('Measurement:', distance, 'mm');
    onMeasurementReceived(distance);
  });
}
```

### Step 3: Parse Measurement Data
```javascript
function parseMeasurement(dataView) {
  // Distance is typically in bytes 0-3 (little-endian)
  const distanceMM = dataView.getUint32(0, true);
  const distanceM = distanceMM / 1000;
  const distanceInches = distanceMM / 25.4;
  
  return {
    mm: distanceMM,
    meters: distanceM,
    inches: distanceInches,
    feet: distanceInches / 12
  };
}
```

### Step 4: Integration with Photo Annotations
```javascript
// When user clicks on photo to add measurement
function addMeasurementToPhoto(photo, measurement, position) {
  const annotation = {
    x: position.x,
    y: position.y,
    measurement: measurement,
    label: `${measurement.feet.toFixed(2)}' (${measurement.inches.toFixed(1)}")`,
    timestamp: Date.now()
  };
  
  // Draw arrow with measurement on photo
  drawArrowOnPhoto(photo, annotation);
  
  // Save to database
  saveMeasurementAnnotation(photo.id, annotation);
}
```

## Current Implementation Status

✅ **Completed:**
- Research and documentation
- Integration plan created
- Code samples prepared

⏳ **Pending:**
- Web Bluetooth implementation
- Testing with actual Leica D5 device
- Photo annotation UI
- Measurement storage in database

## Next Steps

1. **Immediate (Web Implementation):**
   - Create LeicaD5Manager utility class
   - Add "Connect Leica" button to mobile photo view
   - Implement measurement capture on button click
   - Add measurement overlay to photos

2. **Future (Native App):**
   - Consider React Native rebuild if iOS support needed
   - Implement native Bluetooth libraries
   - Submit to app stores

## Testing Requirements

- **Hardware:** Leica DISTO D5 device
- **Browser:** Chrome on Android (v56+) or Chrome on desktop
- **HTTPS:** App must be served over HTTPS for Web Bluetooth
- **Permissions:** User must grant Bluetooth permission

## Alternative Solutions

If Leica D5 integration proves difficult:

1. **Manual Entry:** Simple text input for measurements
2. **Photo Ruler:** On-screen ruler tool for rough measurements
3. **Voice Input:** Dictate measurements via speech recognition
4. **Other Laser Meters:** Support generic Bluetooth laser measures

## Resources

- [Web Bluetooth API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Leica Geosystems Developer](https://leica-geosystems.com/developer)
- [BLE GATT Protocol](https://www.bluetooth.com/specifications/gatt/)

---

**Note:** Full implementation requires physical access to Leica D5 device for testing and protocol verification.