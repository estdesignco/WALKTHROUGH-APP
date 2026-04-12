# ESTABLISHED iOS App Build Instructions

## Download the iOS Project

Download the iOS Xcode project from:
**https://design-preview-131.preview.emergentagent.com/api/download/ios-app**

This is a 17MB ZIP file containing the complete Xcode project.

---

## Requirements

- **Mac computer** with macOS 12.0 or later
- **Xcode 14.0** or later (free from App Store)
- **Apple Developer Account** (free for personal testing, $99/year for App Store distribution)

---

## Build Steps

### 1. Extract the ZIP file
```bash
unzip ESTABLISHED_iOS_App.zip
cd ios
```

### 2. Install CocoaPods (if not already installed)
```bash
sudo gem install cocoapods
```

### 3. Install Dependencies
```bash
cd App
pod install
```

### 4. Open in Xcode
```bash
open App.xcworkspace
```
**IMPORTANT**: Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

### 5. Configure Signing
1. In Xcode, select the "App" project in the navigator
2. Go to "Signing & Capabilities" tab
3. Select your Team (Apple Developer account)
4. Xcode will automatically manage signing

### 6. Select Your Device
- Connect your iPad via USB
- Select it from the device dropdown in Xcode's toolbar
- Or select a Simulator for testing

### 7. Build and Run
- Press **Cmd + R** or click the Play button
- The app will build and install on your device

---

## App Configuration

The app is pre-configured with:
- **App ID**: `com.establisheddesign.ffe`
- **App Name**: `ESTABLISHED`
- **Web URL**: `https://design-preview-131.preview.emergentagent.com/mobile-app`
- **Background Color**: `#0F172A` (Dark blue)
- **Accent Color**: `#D4A574` (Gold)

---

## Testing on iPad

1. On your iPad, go to **Settings > General > Device Management**
2. Trust your Developer certificate
3. The app will launch with the full mobile interface

---

## Features in the iOS App

- **Projects List**: View all interior design projects
- **Walkthrough**: Room tabs at top, categories with items
- **FF&E Spreadsheet**: Full inventory with status tracking
- **Contacts**: 136+ vendor and client contacts
- **Photos**: Capture and organize by room
- **Measurements**: GPS-enabled photo capture with Leica D5 support
- **Offline Mode**: Works without internet, syncs when connected

---

## Troubleshooting

### "Untrusted Developer" error
Go to Settings > General > Device Management and trust your developer profile.

### Build fails with signing error
Make sure you've selected a valid Team in Signing & Capabilities.

### App shows blank screen
Check that your iPad has internet connectivity to load the web content.

---

## Distribution to App Store

To distribute via TestFlight or App Store:
1. Create an App Store Connect listing
2. Archive the app (Product > Archive)
3. Upload to App Store Connect
4. Submit for review

---

## Support

For technical issues, contact the development team.
