# Mobile App Handoff — ESTABLISHED Design Co.

## Backend API
**Base URL:** `https://design-burst.preview.emergentagent.com/api`  
**Auth:** App password `DesignReady2026!` (frontend-only gate, API is open)

---

## Core API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| GET | `/projects/{project_id}` | Get full project with rooms, categories, items |
| POST | `/projects` | Create project |
| PUT | `/projects/{project_id}` | Update project |
| DELETE | `/projects/{project_id}` | Delete project |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms` | List all rooms |
| GET | `/rooms/{room_id}` | Get single room |
| POST | `/rooms` | Create room (body: `{name, description, project_id, order_index, sheet_type}`) |
| PUT | `/rooms/{room_id}` | Update room (body: `{name?, description?, notes?, color?, order_index?}`) |
| DELETE | `/rooms/{room_id}` | Delete room |
| POST | `/rooms/{room_id}/copy` | Copy room |

### Categories & Subcategories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/categories` | Create category |
| PUT | `/categories/{category_id}` | Update category |
| DELETE | `/categories/{category_id}` | Delete category |
| GET | `/category-options` | Get available category templates |
| POST | `/subcategories` | Create subcategory |
| DELETE | `/subcategories/{subcategory_id}` | Delete subcategory |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/items` | Create item |
| POST | `/items/bulk` | Bulk create items |
| GET | `/items/{item_id}` | Get item |
| PUT | `/items/{item_id}` | Update item |
| DELETE | `/items/{item_id}` | Delete item |
| PATCH | `/items/{item_id}/quick-update` | Quick update single field |
| POST | `/upload-item-image` | Upload image for item |

### Sync & Transfer
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync/walkthrough-to-checklist/{project_id}` | Transfer walkthrough data to checklist |
| GET | `/sync/status/{project_id}` | Check sync status |

### Room Finish Schedule (3D Shower View)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{project_id}/rooms/{room_id}/finish-schedules` | Get finish schedules |
| POST | `/projects/{project_id}/rooms/{room_id}/finish-schedules` | Create finish schedule |
| PUT | `/projects/{project_id}/finish-schedules/{schedule_id}` | Update finish schedule |
| DELETE | `/projects/{project_id}/finish-schedules/{schedule_id}` | Delete finish schedule |

### Photos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/photos/upload-to-item` | Upload photo to item |
| POST | `/canva/upload-room-images` | Upload room images |

### Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/proxy-image?url={url}` | Proxy external images (CORS bypass) |
| GET | `/health` | Health check |
| GET | `/room-colors` | Get room color palette |
| GET | `/item-statuses` | Get available item statuses |
| GET | `/carrier-types` | Get carrier options |
| GET | `/vendor-types` | Get vendor types |

---

## Data Models

### Project
```json
{
  "id": "uuid",
  "name": "Wheeler Ridge Residence",
  "client_info": { "name": "Demo Client", "email": "demo@test.com", "phone": "555-0100", "address": "123 Demo St" },
  "floor_order": ["1ST FLOOR", "2ND FLOOR", "BASEMENT"],
  "rooms": [Room],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Room
```json
{
  "id": "uuid",
  "name": "Master Bathroom",
  "description": "",
  "project_id": "uuid",
  "order_index": 0,
  "sheet_type": "walkthrough|checklist|ffe",
  "color": "#ED2A2A",
  "floor": "1ST FLOOR",
  "notes": "Room notes text — shared across walkthrough/checklist/FFE",
  "categories": [Category],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Category
```json
{
  "id": "uuid",
  "name": "Tile & Stone",
  "room_id": "uuid",
  "order_index": 0,
  "color": "#065F46",
  "subcategories": [Subcategory]
}
```

### Subcategory
```json
{
  "id": "uuid",
  "name": "Shower Tile",
  "category_id": "uuid",
  "items": [Item]
}
```

### Item
```json
{
  "id": "uuid",
  "name": "Subway Tile White Gloss",
  "quantity": "",
  "size": "3x6",
  "vendor": "Daltile",
  "status": "SELECTED|ORDERED|RECEIVED|INSTALLED",
  "cost": "",
  "link": "https://...",
  "sku": "SKU123",
  "finish_color": "White Gloss",
  "finish_image": "https://...",
  "image_url": "https://...",
  "is_checked": false,
  "notes": "",
  "tracking_number": "",
  "carrier": "",
  "price": "",
  "photos": [],
  "subcategory_id": "uuid"
}
```

---

## Mobile App Screens Needed

### 1. Project List
- Show all projects with client name and address
- Tap to open project

### 2. Project Detail (Tabbed)
- **Walkthrough Tab**: Room list → expand room → categories → subcategories → items with checkboxes
- **Checklist Tab**: Same structure, shows only checked/transferred items
- **FFE Tab**: Same structure with additional shipping/status columns
- **Room Finishes Tab**: 3D shower view (Three.js — may need WebView for this)

### 3. Room Section (per tab)
- Room header with DISTINCT COLOR (from `room.color`)
- Expandable categories and subcategories
- Item rows with: checkbox, name, qty, size, finish/color, vendor, status
- **ROOM NOTES** textarea at bottom of each room section
- Notes save on blur, persist, and sync across all tabs

### 4. Add Room Modal
- Quick select from common room list (80+ rooms)
- Each room button shows its DISTINCT COLOR
- Custom room name input
- Multi-select and bulk create

### 5. Item Detail
- Full item editing (name, vendor, sku, size, finish, status, cost, etc.)
- Image upload
- Photo gallery
- Tracking info

---

## Room Color System
96 colors generated via golden-angle (137.5°) hue rotation — guarantees maximum visual distance between consecutive rooms. Colors stored per room in `room.color` field. Frontend palette at `/app/frontend/src/utils/roomColors.js`.

---

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Database**: MongoDB (collections: `projects`, `rooms`, `categories`, `items`)
- **Frontend (web)**: React 18 + Tailwind CSS + Three.js (for 3D view)
- **Mobile should use**: Expo (React Native) connecting to the same backend API
