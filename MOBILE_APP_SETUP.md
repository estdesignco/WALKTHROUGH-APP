# 🚀 React Native Mobile App - Setup & Testing Guide

## ✅ What's Been Built

### 📱 React Native Mobile Application
Location: `/app/mobile/`

A complete offline-first mobile app with:
- **Photo capture & management** organized by room
- **Offline storage** with auto-sync capability  
- **Leica DISTO D5** Bluetooth integration (ready for testing)
- **Project & room navigation**
- **Base64 photo storage** for consistent rendering

### 🔧 Backend API Endpoints (Added to `/app/backend/server.py`)
- `POST /api/photos/upload` - Upload room photos
- `GET /api/photos/by-room/{projectId}/{roomId}` - Get photos by room
- `DELETE /api/photos/{photoId}` - Delete photo
- `POST /api/measurements` - Save Leica D5 measurements
- `GET /api/measurements/{projectId}/{roomId}` - Get measurements

## 🎯 Quick Start

### 1. Install Expo CLI (if not installed)
```bash
npm install -g expo-cli
```

### 2. Install Mobile App Dependencies
```bash
cd /app/mobile
yarn install
```

### 3. Start the Mobile App
```bash
cd /app/mobile
yarn start
```

This will open Expo DevTools in your browser with:
- QR code to scan with Expo Go app
- Options to run in iOS simulator or Android emulator

### 4. Test on Your Phone (Recommended)

**iOS:**
1. Install "Expo Go" from App Store
2. Open Expo Go app
3. Scan QR code from terminal/browser

**Android:**
1. Install "Expo Go" from Play Store  
2. Open Expo Go app
3. Scan QR code from terminal/browser

## 📸 Testing Photo Functionality

### Test Flow:
1. **Home Screen** → Tap "Projects"
2. **Project List** → Select a project
3. **Walkthrough Screen** → Select a room
4. **Photo Manager** → Tap "Take Photo" or "Gallery"
5. **Capture/Select** photo
6. **View** photos in grid
7. **Tap** photo to see fullscreen with options

### Offline Testing:
1. Turn on Airplane Mode
2. Take photos (they'll be queued)
3. See "⏳ Not synced yet" badge
4. Turn off Airplane Mode
5. Photos auto-sync to backend
6. Badges disappear when synced

## 📏 Testing Leica D5 Integration

### Prerequisites:
- Physical phone (BLE doesn't work on simulators)
- Leica DISTO D5 device
- Bluetooth enabled on phone

### Test Flow:
1. Power on Leica D5
2. Navigate to: **Home → Leica D5**
3. Tap "Scan for Devices"
4. Wait ~10 seconds for device discovery
5. Tap your device from list
6. Once connected, tap "Take Measurement"
7. View measurement data displayed

### Important Notes:
- **BLE Service UUIDs**: Currently using placeholders in `/app/mobile/src/services/leicaService.js`
- **Need actual UUIDs** from Leica D5 documentation or reverse engineering
- **GSI Format Parsing**: Basic implementation needs refinement based on actual data format

## 🗂️ Project Structure

```
/app/mobile/
├── App.js                          # Main navigation setup
├── package.json                    # Dependencies
├── app.json                        # Expo configuration
│
├── src/
│   ├── screens/                    # 5 screen components
│   │   ├── HomeScreen.js           # Dashboard with sync status
│   │   ├── ProjectListScreen.js    # List all projects
│   │   ├── WalkthroughScreen.js    # Room list for project
│   │   ├── PhotoManagerScreen.js   # Photo capture & gallery
│   │   └── LeicaConnectionScreen.js # BLE device connection
│   │
│   └── services/                   # Business logic
│       ├── apiService.js           # Backend API calls
│       ├── offlineService.js       # AsyncStorage management
│       ├── syncService.js          # Background sync logic
│       ├── photoService.js         # Photo capture/upload
│       └── leicaService.js         # Leica D5 BLE connection
```

## 🔍 Key Features Implemented

### 1. Photo Management (`photoService.js`)
```javascript
// Take photo with camera
await photoService.takePhoto(projectId, roomId, roomName);

// Pick from gallery
await photoService.pickFromGallery(projectId, roomId, roomName);

// Get photos for room
const photos = await photoService.getPhotosByRoom(projectId, roomId);
```

### 2. Offline Storage (`offlineService.js`)
```javascript
// Store pending photos
await offlineService.addPendingPhoto(photoData);

// Get sync status
const status = await offlineService.getSyncStatus();
// Returns: { pendingPhotos: 5, pendingItems: 2, totalPending: 7 }
```

### 3. Auto-Sync (`syncService.js`)
```javascript
// Manual sync trigger
const result = await syncService.syncAll();

// Background sync (every 5 minutes)
syncService.startBackgroundSync(5);
```

### 4. Leica D5 BLE (`leicaService.js`)
```javascript
// Scan for devices
const devices = await leicaService.scanForLeica(10000);

// Connect to device
await leicaService.connect(deviceId);

// Trigger measurement
await leicaService.triggerMeasurement();

// Receive measurements
leicaService.onMeasurement((measurement) => {
  console.log('Distance:', measurement.distance);
  console.log('Height:', measurement.height);
});
```

## ⚙️ Configuration

### Backend URL
Edit `/app/mobile/.env`:
```env
BACKEND_URL=https://designflow-master.preview.emergentagent.com
API_URL=https://designflow-master.preview.emergentagent.com/api
```

### Permissions (app.json)
- ✅ Camera access
- ✅ Photo library access
- ✅ Bluetooth access
- ✅ Location (Android BLE requirement)

## 🚨 Known Limitations & Next Steps

### Leica D5 Integration
- ⚠️ **BLE UUIDs are placeholders** - Need actual values from device
- ⚠️ **GSI format parsing incomplete** - Need to implement based on actual data
- ✅ **Connection logic complete** - Ready for real device testing
- ✅ **UI/UX complete** - Scanning, connection, measurement display

### Photo Annotation
- 📝 **Planned for Phase 2**
- Will use `react-native-svg` for drawing
- Attach measurements to arrow annotations
- Save annotated versions separately

### Recommendations
1. **Test with real Leica D5** to capture actual BLE data
2. **Update UUIDs** in `leicaService.js` based on findings
3. **Implement GSI parsing** based on captured data format
4. **Build photo annotation** feature next

## 📊 Database Collections

Backend automatically creates these MongoDB collections:

### `photos`
```javascript
{
  id: "uuid",
  project_id: "project-uuid",
  room_id: "room-uuid",
  file_name: "Living_Room_1234567890.jpg",
  photo_data: "data:image/jpeg;base64,...", // Base64 string
  metadata: { timestamp, location },
  uploaded_at: "2025-01-20T10:30:00Z",
  synced: true
}
```

### `measurements`
```javascript
{
  id: "uuid",
  project_id: "project-uuid",
  room_id: "room-uuid",
  distance: 5.234,
  height: 2.890,
  angle: 45.0,
  unit: "meters",
  photo_id: "photo-uuid", // Optional
  metadata: {},
  measured_at: "2025-01-20T10:35:00Z"
}
```

## 🔥 Testing Checklist

- [ ] Install Expo Go on phone
- [ ] Run `yarn start` in `/app/mobile`
- [ ] Scan QR code with Expo Go
- [ ] Navigate: Home → Projects → Select Project
- [ ] Navigate to room walkthrough
- [ ] Take photo with camera
- [ ] Pick photo from gallery
- [ ] Test offline: Airplane mode ON → take photo → see "⏳" badge
- [ ] Test sync: Airplane mode OFF → verify photo syncs
- [ ] View photos in grid
- [ ] Tap photo for fullscreen
- [ ] Delete photo
- [ ] Navigate to Leica D5 screen
- [ ] (If device available) Scan and connect
- [ ] (If device available) Trigger measurement

## 💡 Tips

### Development
- Use `console.log()` - output appears in Expo DevTools
- Shake phone to open developer menu
- Enable "Fast Refresh" for instant updates
- Use React DevTools for debugging

### Performance
- Photos stored as Base64 (larger than binary)
- Limit to ~100 photos per project locally
- Sync regularly to clear local storage
- Consider image compression for production

### Bluetooth Testing
- **Must use physical device** - Simulators don't support BLE
- Keep device close to Leica D5 during testing
- Check phone Bluetooth settings if connection fails
- May need to unpair/repair for first-time connection

## 📚 Additional Resources

- Mobile App README: `/app/mobile/README.md`
- Leica D5 Research: Check Perplexity research output above
- Backend Code: `/app/backend/server.py` (lines 6246-6362)
- Expo Docs: https://docs.expo.dev/

## 🎉 What's Next?

1. **Test photo upload** - Verify end-to-end flow
2. **Connect real Leica D5** - Get actual BLE data
3. **Implement photo annotation** - Draw arrows + measurements
4. **Build full walkthrough** - Item management offline
5. **App Store deployment** - Production builds

---

## 🆘 Troubleshooting

**Q: Expo not starting?**
```bash
# Clear cache and restart
cd /app/mobile
rm -rf node_modules
yarn install
yarn start --clear
```

**Q: Can't connect to backend?**
- Check backend is running: `sudo supervisorctl status backend`
- Verify URL in `/app/mobile/.env`
- Test endpoint: `curl https://designflow-master.preview.emergentagent.com/api/projects`

**Q: Photos not uploading?**
- Check network connection
- Review Expo DevTools console for errors
- Verify backend logs: `tail -f /var/log/supervisor/backend.out.log`

**Q: Bluetooth not working?**
- Use physical device (not simulator)
- Enable Bluetooth on Leica D5
- Grant location permission (Android requirement)
- Check phone Bluetooth settings

---

**Ready to test! Start with: `cd /app/mobile && yarn start`** 🚀