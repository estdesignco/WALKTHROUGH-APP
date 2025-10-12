# 📡 API Reference - Interior Design Management System v3.0.0

## Complete Endpoint Documentation for Phases 1-6

---

## 📌 Base URL

```
http://localhost:8001/api
https://designflow-master.preview.emergentagent.com/api
```

---

## 🔄 Phase 2: Bidirectional Sync Endpoints

### 1. Get Project Changes

**GET** `/projects/{project_id}/changes`

**Description:** Get items changed since last sync (incremental sync)

**Parameters:**
- `project_id` (path) - Project UUID
- `since` (query, optional) - Unix timestamp of last sync

**Response:**
```json
{
  "project_id": "uuid",
  "changes": [
    {
      "id": "item-uuid",
      "name": "Crystal Chandelier",
      "status": "Picked",
      "updated_at": "2025-10-07T18:30:00Z",
      ...
    }
  ],
  "change_count": 5,
  "timestamp": 1759860294.815632,
  "since": 1759860000.0
}
```

**Usage:**
```javascript
const lastSync = 1759860000;
const response = await fetch(
  `${API_URL}/projects/${projectId}/changes?since=${lastSync}`
);
const data = await response.json();
```

---

### 2. Quick Update Item

**PATCH** `/items/{item_id}/quick-update`

**Description:** Fast single-field update (e.g., status toggle)

**Parameters:**
- `item_id` (path) - Item UUID

**Body:**
```json
{
  "status": "Picked"
}
```

**Response:**
```json
{
  "id": "item-uuid",
  "name": "Crystal Chandelier",
  "status": "Picked",
  "updated_at": "2025-10-07T18:30:00Z",
  ...
}
```

**Usage:**
```javascript
await fetch(`${API_URL}/items/${itemId}/quick-update`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'Picked' })
});
```

---

### 3. Sync Heartbeat

**GET** `/canva-sync/heartbeat`

**Description:** Verify sync connection and get server timestamp

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1759860294.815632,
  "server_time": "2025-10-07T18:30:00Z"
}
```

---

## 📤 Phase 3: Image Upload Endpoints

### 4. Upload Room Images

**POST** `/canva/upload-room-images`

**Description:** Upload all images from a room to Canva (background task)

**Parameters:**
- `project_id` (query) - Project UUID
- `room_id` (query) - Room UUID

**Response:**
```json
{
  "success": true,
  "job_id": "upload-job-uuid",
  "message": "Upload started for Master Bedroom"
}
```

**Usage:**
```javascript
const response = await fetch(
  `${API_URL}/canva/upload-room-images?project_id=${projectId}&room_id=${roomId}`,
  { method: 'POST' }
);
const { job_id } = await response.json();
// Poll for progress using endpoint #5
```

---

### 5. Get Upload Job Status

**GET** `/canva/upload-job/{job_id}`

**Description:** Track progress of image upload job

**Parameters:**
- `job_id` (path) - Upload job UUID

**Response:**
```json
{
  "id": "job-uuid",
  "project_name": "Luxury Residence",
  "room_name": "Master Bedroom",
  "status": "processing",
  "total_images": 30,
  "uploaded_images": 18,
  "failed_images": 2,
  "created_at": "2025-10-07T18:00:00Z",
  "updated_at": "2025-10-07T18:05:00Z",
  "errors": ["image1.jpg: timeout"]
}
```

**Polling:**
```javascript
const pollInterval = setInterval(async () => {
  const res = await fetch(`${API_URL}/canva/upload-job/${jobId}`);
  const job = await res.json();
  
  updateProgress(job.uploaded_images / job.total_images);
  
  if (job.status === 'completed' || job.status === 'failed') {
    clearInterval(pollInterval);
  }
}, 2000);
```

---

### 6. Upload Item Images

**POST** `/canva/upload-item-images`

**Description:** Upload images for a single item

**Parameters:**
- `item_id` (query) - Item UUID

**Response:**
```json
{
  "success": true,
  "job_id": "upload-job-uuid",
  "message": "Upload started for Crystal Chandelier"
}
```

---

## 🤖 Phase 4: AI Categorization Endpoints

### 7. AI Suggest Category

**POST** `/ai/suggest-category`

**Description:** Get AI-powered category suggestion for a product

**Parameters:**
- `item_name` (query) - Product name
- `description` (query, optional) - Product description

**Response:**
```json
{
  "success": true,
  "category": "Lighting",
  "confidence": 0.95,
  "method": "ai-powered",
  "message": "AI categorization successful"
}
```

**Fallback Response (no OpenAI key):**
```json
{
  "success": true,
  "category": "Lighting",
  "confidence": 0.6,
  "method": "rule-based",
  "message": "Using rule-based categorization"
}
```

**Usage:**
```javascript
const response = await fetch(
  `${API_URL}/ai/suggest-category?item_name=${encodeURIComponent(name)}&description=${encodeURIComponent(desc)}`,
  { method: 'POST' }
);
const { category, confidence } = await response.json();
```

---

### 8. Batch AI Categorize

**POST** `/ai/batch-categorize`

**Description:** Categorize multiple items in background

**Body:**
```json
{
  "item_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "ai-job-uuid",
  "message": "Batch categorization started for 15 items"
}
```

---

### 9. Get AI Batch Job

**GET** `/ai/batch-job/{job_id}`

**Description:** Track AI batch categorization progress

**Response:**
```json
{
  "id": "job-uuid",
  "type": "ai_categorization",
  "status": "processing",
  "total_items": 15,
  "processed_items": 10,
  "updated_items": 9,
  "created_at": "2025-10-07T18:00:00Z",
  "updated_at": "2025-10-07T18:05:00Z"
}
```

---

## 📊 Phase 6: Export & Analytics Endpoints

### 10. Export Project PDF

**GET** `/export/project/{project_id}/pdf`

**Description:** Export project as structured JSON (PDF-ready)

**Parameters:**
- `project_id` (path) - Project UUID
- `sheet_type` (query, optional) - "checklist", "walkthrough", "ffe"

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Luxury Residence",
    ...
  },
  "rooms": [...],
  "generated_at": "2025-10-07T18:30:00Z",
  "sheet_type": "checklist"
}
```

**Headers:**
```
Content-Disposition: attachment; filename=project_UUID_checklist.json
```

---

### 11. Export Project Excel

**GET** `/export/project/{project_id}/excel`

**Description:** Export project as CSV (Excel-compatible)

**Parameters:**
- `project_id` (path) - Project UUID
- `sheet_type` (query, optional) - "checklist", "walkthrough", "ffe"

**Response:**
```csv
Room,Category,Subcategory,Item,Vendor,Cost,Status,SKU,Link
"Master Bedroom","Lighting","Ceiling","Crystal Chandelier","Visual Comfort",2500,"Picked","CH123","https://..."
```

**Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename=project_UUID_checklist.csv
```

**Usage:**
```javascript
window.location.href = `${API_URL}/export/project/${projectId}/excel?sheet_type=checklist`;
```

---

### 12. Project Analytics

**GET** `/analytics/project/{project_id}`

**Description:** Advanced project analytics and insights

**Parameters:**
- `project_id` (path) - Project UUID

**Response:**
```json
{
  "success": true,
  "project_id": "uuid",
  "summary": {
    "total_items": 150,
    "total_cost": 125000,
    "total_rooms": 8,
    "total_vendors": 15
  },
  "status_distribution": {
    "Picked": 80,
    "Ordered": 45,
    "Delivered": 25
  },
  "vendor_distribution": {
    "Visual Comfort": 25,
    "Bernhardt": 20,
    ...
  },
  "vendor_spending": {
    "Visual Comfort": 45000,
    "Bernhardt": 38000,
    ...
  },
  "room_spending": {
    "Master Bedroom": 35000,
    "Living Room": 42000,
    ...
  },
  "room_items": {
    "Master Bedroom": 25,
    "Living Room": 30,
    ...
  },
  "top_vendors": [
    ["Visual Comfort", 45000],
    ["Bernhardt", 38000],
    ...
  ],
  "top_spending_rooms": [
    ["Living Room", 42000],
    ["Master Bedroom", 35000],
    ...
  ]
}
```

**Usage:**
```javascript
const response = await fetch(`${API_URL}/analytics/project/${projectId}`);
const analytics = await response.json();

// Create charts with analytics.room_spending, etc.
```

---

### 13. System Status

**GET** `/health/system-status`

**Description:** System health check and feature status

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2025-10-07T18:30:00Z",
  "services": {
    "database": "healthy",
    "canva_integration": "configured",
    "ai_categorization": "not_configured",
    "file_storage": "operational"
  },
  "version": "3.0.0",
  "features": {
    "canva_scanner": true,
    "bidirectional_sync": true,
    "image_upload": true,
    "ai_categorization": true,
    "export": true,
    "analytics": true
  }
}
```

---

## 🛡️ Error Responses

### Standard Error Format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes:

- `200` - Success
- `404` - Resource not found (project, room, item)
- `500` - Server error (database, API, processing)

### Common Errors:

**404 - Not Found:**
```json
{
  "detail": "Project not found"
}
```

**500 - Server Error:**
```json
{
  "detail": "Database connection failed"
}
```

---

## 📈 Rate Limiting

**Current:** No rate limiting implemented

**Recommended:**
- Sync endpoints: Poll no faster than every 2 seconds
- Upload endpoints: Max 1 concurrent upload per project
- AI endpoints: Max 10 requests/minute (if using OpenAI)

---

## 🔐 Authentication

**Current:** No authentication on API endpoints

**Note:** Canva OAuth is handled separately for Canva integration features

---

## 📦 Response Headers

### JSON Responses:
```
Content-Type: application/json
```

### File Downloads:
```
Content-Type: text/csv | application/json
Content-Disposition: attachment; filename="..."
```

---

## 📝 Examples

### Complete Sync Flow:

```javascript
// 1. Initial load
const project = await fetch(`/api/projects/${projectId}?sheet_type=checklist`);

// 2. Get current timestamp
const { timestamp } = await fetch('/api/canva-sync/heartbeat').then(r => r.json());

// 3. Poll for changes
setInterval(async () => {
  const changes = await fetch(
    `/api/projects/${projectId}/changes?since=${timestamp}`
  ).then(r => r.json());
  
  if (changes.change_count > 0) {
    // Apply changes to UI
    updateItems(changes.changes);
  }
  
  timestamp = changes.timestamp; // Update for next poll
}, 5000);

// 4. Quick update when user makes change
await fetch(`/api/items/${itemId}/quick-update`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'Picked' })
});
```

### Complete Upload Flow:

```javascript
// 1. Start upload
const { job_id } = await fetch(
  `/api/canva/upload-room-images?project_id=${projectId}&room_id=${roomId}`,
  { method: 'POST' }
).then(r => r.json());

// 2. Poll for progress
const pollInterval = setInterval(async () => {
  const job = await fetch(`/api/canva/upload-job/${job_id}`).then(r => r.json());
  
  const progress = (job.uploaded_images / job.total_images) * 100;
  updateProgressBar(progress);
  
  if (job.status === 'completed') {
    clearInterval(pollInterval);
    showSuccess(`Uploaded ${job.uploaded_images} images!`);
  } else if (job.status === 'failed') {
    clearInterval(pollInterval);
    showError('Upload failed');
  }
}, 2000);
```

---

## 📚 Related Documentation

- **User Guide:** `canva-scanner-guide.html`
- **Keyboard Shortcuts:** `keyboard-shortcuts.html`
- **Phase 1 Details:** `PHASE-1-COMPLETE-SUMMARY.md`
- **Phase 2 Details:** `PHASE-2-COMPLETE-SUMMARY.md`
- **Phase 3 Details:** `PHASE-3-COMPLETE-SUMMARY.md`
- **Phases 4-6 Details:** `COMPLETE-PHASES-4-5-6-SUMMARY.md`

---

*API Reference v3.0.0*
*Interior Design Management System*
*October 7, 2025*