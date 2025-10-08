# 🛠️ TECHNICAL DOCUMENTATION

## 🏛️ SYSTEM ARCHITECTURE

### Components:
```
┌────────────────────────┐
│   Canva Live Checklist   │
│   (React + TypeScript)   │
└─────────┬─────────────┘
          │
          │ HTTPS/REST API
          │
┌─────────┴───────────────┐
│   FastAPI Backend        │
│   (Python)               │
└─────────┬───────────────┘
          │
┌─────────┴───────────────┐
│   MongoDB                │
│   (Database)             │
└────────────────────────┘
```

---

## 📦 CANVA APP STRUCTURE

### File Tree:
```
CANVA_APP/
├── src/
│   ├── app.tsx              # Main app component
│   └── index.tsx            # Entry point
├── utils/
│   ├── use_add_element.ts   # Add elements to design
│   └── use_selection_hook.ts # Selection management
├── styles/
│   └── components.css       # Custom styles
├── canva-app.json         # App manifest
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── webpack.config.ts      # Build configuration
```

---

## 🔌 API ENDPOINTS USED

### 1. Get Project
```http
GET /api/projects/{project_id}?sheet_type=checklist
```
**Response**:
```json
{
  "id": "uuid",
  "name": "Project Name",
  "rooms": [
    {
      "id": "uuid",
      "name": "Living Room",
      "categories": [
        {
          "id": "uuid",
          "name": "Furniture",
          "subcategories": [
            {
              "id": "uuid",
              "name": "SEATING",
              "items": [
                {
                  "id": "uuid",
                  "name": "Product Name",
                  "vendor": "Vendor Name",
                  "sku": "SKU123",
                  "cost": 1299.99,
                  "status": "PICKED",
                  "link": "https://...",
                  "image_url": "https://..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Sync Changes
```http
GET /api/canva-sync/heartbeat?project_id={id}&last_sync={timestamp}
```
**Response**:
```json
{
  "has_changes": true,
  "change_count": 5,
  "timestamp": "2025-01-01T12:00:00Z",
  "changes": [
    {
      "type": "status_update",
      "item_id": "uuid",
      "new_value": "ORDERED"
    }
  ]
}
```

### 3. Quick Update Item
```http
PATCH /api/items/{item_id}/quick-update
Content-Type: application/json

{
  "status": "PICKED"
}
```
**Response**:
```json
{
  "success": true,
  "item": { /* updated item */ }
}
```

---

## 🔄 SYNC MECHANISM

### Bidirectional Sync Flow:

```
Canva App                    Backend
    |                            |
    |--- 1. Poll heartbeat ----->|
    |    (every 5 seconds)       |
    |                            |
    |<-- 2. Changes detected? ---|
    |                            |
    |--- 3. Fetch full data ----->|
    |                            |
    |<-- 4. Return updated data -|
    |                            |
    |--- 5. Update UI ---------->|
```

### Implementation:
```typescript
useEffect(() => {
  const syncChanges = async () => {
    try {
      setSyncStatus('syncing');
      
      const res = await fetch(
        `${BACKEND_URL}/api/canva-sync/heartbeat?project_id=${projectId}&last_sync=${lastSyncTimestamp}`
      );
      
      const data = await res.json();
      
      if (data.has_changes) {
        // Reload project
        const projectRes = await fetch(
          `${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`
        );
        const projectData = await projectRes.json();
        setProject(projectData);
      }
      
      setLastSyncTimestamp(data.timestamp);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('error');
    }
  };
  
  syncChanges();
  const interval = setInterval(syncChanges, 5000);
  
  return () => clearInterval(interval);
}, [projectId]);
```

---

## 🎨 UI COMPONENTS

### Status Indicator
```typescript
const SyncIndicator = ({ status }: { status: string }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: status === 'synced' ? '#10b981' : '#f59e0b',
    borderRadius: '8px'
  }}>
    {status === 'syncing' ? '⌛' : '✅'}
    <span>{status === 'synced' ? 'Synced' : 'Syncing...'}</span>
  </div>
);
```

### Room Selector
```typescript
const RoomSelector = ({ rooms, onSelect }: Props) => (
  <select 
    onChange={(e) => onSelect(rooms[e.target.value])}
    style={{
      background: '#1e293b',
      color: '#D4A574',
      border: '2px solid #D4A574',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '16px'
    }}
  >
    {rooms.map((room, i) => (
      <option key={room.id} value={i}>{room.name}</option>
    ))}
  </select>
);
```

### Item Row
```typescript
const ItemRow = ({ item, onStatusChange }: Props) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    padding: '12px',
    borderBottom: '1px solid #334155',
    alignItems: 'center'
  }}>
    <span style={{ color: '#D4C5A9' }}>{item.name}</span>
    
    <select
      value={item.status}
      onChange={(e) => onStatusChange(item.id, e.target.value)}
      style={{
        background: getStatusColor(item.status),
        padding: '6px',
        borderRadius: '4px'
      }}
    >
      <option value="">PENDING</option>
      <option value="PICKED">PICKED</option>
      <option value="ORDERED">ORDERED</option>
      <option value="DELIVERED">DELIVERED</option>
    </select>
    
    {item.link && (
      <button onClick={() => openLink(item.link)}>
        🔗 View
      </button>
    )}
  </div>
);
```

---

## 🔒 SECURITY

### Authentication:
- Project ID required for access
- No hardcoded credentials
- Backend validates all requests

### Data Protection:
- HTTPS only
- No sensitive data stored in Canva
- All data encrypted in transit

### Privacy:
- No user tracking
- No analytics in app
- Minimal data collection

---

## ⚡ PERFORMANCE OPTIMIZATION

### 1. Sync Frequency
```typescript
// Balance between real-time and performance
const SYNC_INTERVAL = 5000; // 5 seconds
```

### 2. Conditional Rendering
```typescript
{!collapsedCats.has(cat.id) && (
  // Only render if not collapsed
  <CategoryContent category={cat} />
)}
```

### 3. Memoization
```typescript
const filteredItems = useMemo(
  () => items.filter(item => item.status === filter),
  [items, filter]
);
```

### 4. Debouncing
```typescript
const debouncedUpdate = debounce((id, value) => {
  updateStatus(id, value);
}, 300);
```

---

## 🐛 ERROR HANDLING

### Network Errors
```typescript
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
} catch (e) {
  setSyncStatus('error');
  console.error('Sync failed:', e);
  // Retry after delay
  setTimeout(syncChanges, 10000);
}
```

### Data Validation
```typescript
if (!project || !project.rooms) {
  return <ErrorState message="Invalid project data" />;
}
```

### Graceful Degradation
```typescript
// If sync fails, still show last known data
{syncStatus === 'error' && (
  <div style={{ color: 'orange' }}>
    ⚠️ Sync error - showing cached data
  </div>
)}
```

---

## 📊 TESTING

### Unit Tests
```typescript
describe('ItemRow', () => {
  it('renders item name', () => {
    const item = { name: 'Test Item', status: '', link: '' };
    render(<ItemRow item={item} onStatusChange={() => {}} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
describe('Sync', () => {
  it('fetches and updates on change', async () => {
    // Mock API
    fetchMock.get('/api/canva-sync/heartbeat', {
      has_changes: true,
      change_count: 1
    });
    
    // Render app
    render(<App />);
    
    // Wait for sync
    await waitFor(() => {
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 DEPLOYMENT

### Production Build:
```bash
npm run build
```

### Output:
```
dist/
├── index.js           # Main bundle
├── canva.json         # Manifest
└── assets/            # Static assets
```

### Upload to Canva:
```bash
canva upload
```

---

## 📝 MAINTENANCE

### Regular Updates:
1. **Security patches** - Monthly
2. **Dependency updates** - Quarterly
3. **Feature additions** - As needed
4. **Bug fixes** - Within 48 hours

### Monitoring:
- Error logs
- Sync failures
- Performance metrics
- User feedback

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 2:
- [ ] Image placement on Canva board
- [ ] Drag and drop positioning
- [ ] Bulk operations
- [ ] Filtering and search

### Phase 3:
- [ ] Offline mode
- [ ] Conflict resolution
- [ ] Version history
- [ ] Collaborative editing

### Phase 4:
- [ ] AI suggestions
- [ ] Budget tracking
- [ ] Timeline view
- [ ] Client sharing

---

## 📚 REFERENCES

- [Canva Apps SDK](https://www.canva.dev/docs/apps/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
