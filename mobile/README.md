# 📱 Interior Design Manager - React Native Mobile App

A robust, offline-first mobile application for on-site interior design project management with photo capture and Leica D5 laser measurement integration.

## ✨ Features

### Core Functionality
- **📸 Photo Management**: Capture and organize photos by room with offline support
- **📏 Leica D5 Integration**: Bluetooth connection to Leica DISTO D5 laser measurement device
- **🏠 Walkthrough Management**: On-site project room navigation
- **📡 Offline-First Design**: Works seamlessly without internet connection
- **🔄 Auto-Sync**: Automatically syncs data when connection is restored

### Advanced Features
- Base64 photo storage for consistent rendering
- Room-based photo organization
- Pending sync queue visualization
- Bluetooth Low Energy (BLE) device scanning
- Real-time measurement display
- Photo annotation (coming soon)
- Measurement-tagged photos (coming soon)

## 🛠️ Technology Stack

- **React Native** via **Expo** (v52.0.0)
- **React Navigation** for routing
- **AsyncStorage** for offline data persistence
- **expo-camera** for photo capture
- **expo-image-picker** for gallery access
- **react-native-ble-plx** for Leica D5 Bluetooth connectivity
- **@react-native-community/netinfo** for connectivity monitoring
- **Axios** for API communication

## 📋 Prerequisites

- Node.js 16+ and Yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for Android development)
- Physical device for Bluetooth testing (simulators don't support BLE)

## 🚀 Installation

```bash
# Navigate to mobile directory
cd /app/mobile

# Install dependencies
yarn install

# Start Expo development server
yarn start
```

## 📱 Running the App

### iOS (Mac only)
```bash
yarn ios
```

### Android
```bash
yarn android
```

### Using Expo Go App
1. Install Expo Go on your phone from App Store/Play Store
2. Run `yarn start`
3. Scan the QR code with Expo Go app

## 🔧 Configuration

### Backend URL
Edit `/app/mobile/.env`:
```env
BACKEND_URL=https://designhub-74.preview.emergentagent.com
API_URL=https://designhub-74.preview.emergentagent.com/api
```

### App Configuration
Main settings in `/app/mobile/app.json`:
- App name, version, bundle identifiers
- Required permissions (Camera, Bluetooth, Storage)
- Icons and splash screens

## 📂 Project Structure

```
/app/mobile/
├── App.js                      # Main app entry with navigation
├── src/
│   ├── screens/               # Screen components
│   │   ├── HomeScreen.js
│   │   ├── ProjectListScreen.js
│   │   ├── WalkthroughScreen.js
│   │   ├── PhotoManagerScreen.js
│   │   └── LeicaConnectionScreen.js
│   └── services/              # Business logic & API services
│       ├── apiService.js      # Backend API communication
│       ├── offlineService.js  # Offline storage management
│       ├── syncService.js     # Data synchronization
│       ├── photoService.js    # Photo capture & management
│       └── leicaService.js    # Leica D5 BLE integration
├── package.json
├── app.json                   # Expo configuration
└── README.md
```

## 📸 Photo Management

### How It Works
1. **Capture**: Use camera or pick from gallery
2. **Store**: Photos saved as Base64 strings
3. **Organize**: Automatically grouped by room
4. **Sync**: Upload to backend when online

### Offline Handling
- Photos stored locally in AsyncStorage
- Queued for sync when offline
- Visual indicators for pending uploads
- Automatic sync on reconnection

## 📏 Leica D5 Integration

### Device Requirements
- Leica DISTO D5 laser distance meter
- Bluetooth 5.0 (BLE) enabled
- Device paired (first-time use)

### Connection Process
1. Power on Leica D5
2. Enable Bluetooth in device menu
3. Tap "Scan for Devices" in app
4. Select your device from list
5. Take measurements remotely

### Measurement Data
- **Distance**: Horizontal distance in meters
- **Height**: Vertical difference
- **Angle**: Inclination (if available)
- **Timestamp**: When measurement was taken

### BLE Service UUIDs
Current implementation uses placeholders. Update in `/app/mobile/src/services/leicaService.js`:
```javascript
const LEICA_SERVICE_UUID = 'ACTUAL_UUID_HERE';
const MEASUREMENT_CHARACTERISTIC_UUID = 'ACTUAL_UUID_HERE';
```

Refer to Leica DISTO D5 official documentation for actual UUIDs.

## 🔄 Sync & Offline Strategy

### Data Sync Priority
1. Photos (with metadata)
2. Measurements (Leica D5 data)
3. Item updates (walkthrough changes)

### Sync Triggers
- App comes online after being offline
- Manual refresh in screens
- Background sync every 5 minutes (configurable)

### Conflict Resolution
- Last-write-wins for most data
- Server data takes precedence for projects/rooms
- Local photos always preserved until confirmed uploaded

## 🔐 Permissions

### iOS Permissions
- **Camera**: For on-site photo capture
- **Photo Library**: For selecting existing photos
- **Bluetooth**: For Leica D5 connection

### Android Permissions
- Same as iOS, plus:
- **Location**: Required for Bluetooth scanning on Android

## 🐛 Troubleshooting

### Photos Not Uploading
- Check network connection
- View sync status on Home screen
- Check backend URL in .env
- Verify backend `/api/photos/upload` endpoint is accessible

### Bluetooth Not Finding Device
- Ensure Leica D5 is powered on
- Enable Bluetooth in device settings (not phone)
- Try re-pairing in phone Bluetooth settings
- Test on physical device (not simulator)

### App Crashes on Photo Capture
- Check camera permissions
- Test on physical device
- Check Expo Go app is updated
- Review logs: `expo start` shows console output

## 📊 Storage Management

### Local Storage Limits
- Photos stored as Base64 (larger than binary)
- Estimate: ~1-2MB per photo
- Monitor storage via Home screen stats
- Clear synced photos periodically

### Recommendations
- Upload photos regularly when online
- Delete synced photos if storage is limited
- Use lower quality settings if needed

## 🚢 Deployment

### Build for Production

#### iOS (requires Mac & Apple Developer Account)
```bash
expo build:ios
```

#### Android
```bash
expo build:android
```

### App Store Submission
Follow Expo documentation:
https://docs.expo.dev/distribution/app-stores/

## 🔮 Upcoming Features

### Phase 2: Photo Annotation
- Draw arrows on photos
- Add text labels
- Attach Leica measurements to arrows
- Save annotated versions

### Phase 3: Enhanced Walkthrough
- Full offline item management
- Checkbox interactions
- Add/remove/edit items on-site
- Category management

### Phase 4: Advanced Features
- Multi-photo selection
- Photo comparison view
- Before/after galleries
- Export photo reports

## 🤝 Integration with Web App

### Shared Backend
- Same FastAPI backend at `/app/backend/server.py`
- Endpoints prefixed with `/api/`
- Authentication shared (when implemented)

### Data Flow
```
Mobile App → API → MongoDB ← Web App
```

### Endpoint Usage
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/photos/upload` - Upload photos
- `GET /api/photos/by-room/{projectId}/{roomId}` - Get room photos
- `POST /api/measurements` - Save Leica measurements

## 📖 Documentation

- **Expo Docs**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **React Navigation**: https://reactnavigation.org/
- **Leica DISTO D5 Manual**: Included in project research

## 🆘 Support

For issues or questions:
1. Check this README
2. Review backend logs: `/var/log/supervisor/backend.out.log`
3. Check Expo console output
4. Review relevant service file in `/app/mobile/src/services/`

## 📝 License

Part of the Interior Design Management System.
© 2025 Established Design Co.