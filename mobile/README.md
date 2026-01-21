# Design Ready Mobile App

## Overview
React Native mobile application for the Design Ready Interior Design Management System.
Built with Expo for easy deployment to both iOS and Android.

## Features (Synced with Desktop - Jan 2026)

### Core Features
- **Project List** - Browse and select projects
- **Project Details** - View client info, rooms, and project details
- **Walkthrough** - Room-by-room photo documentation
- **Photo Manager** - Capture, organize, and annotate photos
- **Contacts** - View project contacts

### NEW: Feature Parity with Desktop App

#### ✅ To-Do List (ToDoListScreen.js)
- Create, update, delete to-do items
- Status filtering (All, Pending, Working, Done)
- Priority levels (High, Medium, Low)
- **Comment threads** - Add and view comments on each item
- Linked FFE items support
- Assigned to tracking

#### ✅ Punch List (PunchListScreen.js)
- Create, update, delete punch items
- Status filtering (All, Open, In Progress, Completed)
- Priority levels with color coding
- Location tracking (room/area)
- Photo attachments support
- **Comment threads** - Add and view comments on each item
- Assigned to tracking

#### ✅ Samples Library (SamplesScreen.js)
- View all project samples with **large images**
- Status tracking (Pending, Ordered, Received, Approved, Rejected)
- Quick approve/reject actions
- Filter by status
- Pull-to-refresh
- Auto-sync based on finish_color and vendor from checklist

### Hardware Integration
- **Leica D5 Connection** - Bluetooth integration for laser measurements

## Navigation Structure

```
Home
├── ProjectList
│   └── ProjectDetails
│       ├── Contacts
│       ├── Walkthrough
│       │   └── PhotoManager
│       ├── ToDoList       (NEW)
│       ├── PunchList      (NEW)
│       └── Samples        (NEW)
└── LeicaConnection
```

## API Endpoints Used

```javascript
// Projects
GET  /api/projects
GET  /api/projects/:id

// To-Do List
GET  /api/todos/project/:projectId
POST /api/todos
PUT  /api/todos/:id
DELETE /api/todos/:id
POST /api/todos/:id/comments

// Punch List
GET  /api/punch-list/project/:projectId
POST /api/punch-list
PUT  /api/punch-list/:id
DELETE /api/punch-list/:id
POST /api/punch-list/:id/comments

// Samples
GET  /api/samples/project/:projectId
PUT  /api/samples/:id
POST /api/samples/sync/:projectId

// Photos
POST /api/photos/upload
GET  /api/photos/by-room/:projectId/:roomId
DELETE /api/photos/:id
```

## Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure environment:
```bash
# Create .env file with:
EXPO_PUBLIC_BACKEND_URL=https://app.estdesignco.com/api
```

3. Start development:
```bash
npx expo start
```

## Building

### iOS
```bash
npx expo build:ios
```

### Android
```bash
npx expo build:android
```

## Tech Stack
- React Native with Expo
- React Navigation (Stack Navigator)
- Axios for API calls
- AsyncStorage for offline caching
- NetInfo for connectivity monitoring

## Offline Support
- Automatic offline detection
- Local caching of project data
- Background sync when connectivity restored
- Visual offline mode indicator

## Last Updated
January 21, 2026 - Added To-Do List, Punch List, and Samples Library screens with full feature parity to desktop app.
