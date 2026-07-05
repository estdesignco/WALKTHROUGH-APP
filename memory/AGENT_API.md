# Agent API — Reference for ChatGPT / MCP / external automation

> Authenticated REST API to create, update, search and image-attach checklist /
> FFE / walkthrough rows in this app from any external agent.
>
> Live now in **preview** (`https://design-burst.preview.emergentagent.com`).
> Will be live on **production** (`https://app.estdesignco.com`) after redeploy.

---

## TL;DR

| Question | Answer |
|---|---|
| Does the app have an API? | **Yes.** New `/api/agent/v1/*` namespace, designed for AI agents. |
| Webhooks? | Not yet (one-way: agent → app). Easy to add later if needed. |
| MCP server? | Not built-in, but you can wrap these endpoints as MCP tools in 10 minutes (sample below). |
| Auth? | **API key** via `X-API-Key` header. Keys are minted per-project or workspace-wide. |
| Base URL | `https://app.estdesignco.com/api` (prod) · `https://design-burst.preview.emergentagent.com/api` (preview) |

---

## 1) Authentication

Every agent request requires an `X-API-Key` header.

### Mint a key (from inside the app, you-the-user only)
```http
POST /api/agent/admin/api-keys
Content-Type: application/json

{
  "name": "ChatGPT Canva agent",
  "project_id": "6c82f07b-ff71-465e-850b-674f2f91a810",
  "expires_at": null
}
```
**Response (key is shown ONCE):**
```json
{
  "id": "788992fe-b8d2-4989-853a-0c662aec160b",
  "name": "ChatGPT Canva agent",
  "prefix": "edk_paGyEpvW",
  "project_id": "6c82f07b-ff71-465e-850b-674f2f91a810",
  "created_at": "2026-05-25T05:48:31Z",
  "api_key": "edk_paGyEpvWFOaxZN8D6cJ-rmiJZssWOItmKa8J1jjEIds",
  "warning": "Save this key now — it will not be shown again."
}
```

> Keys are SHA-256 hashed at rest. If `project_id` is `null`, the key is workspace-wide.

### List keys
```http
GET /api/agent/admin/api-keys
```

### Revoke a key
```http
DELETE /api/agent/admin/api-keys/{key_id}
```

---

## 2) Endpoints the agent calls

All agent requests use:
```
X-API-Key: edk_...your_key...
Content-Type: application/json
```

### 2.1 Ping (sanity-check)
```http
GET /api/agent/v1/ping
```
**Response:**
```json
{ "ok": true, "key_id": "...", "key_name": "ChatGPT Canva agent",
  "project_id": "6c82f07b-...", "server_time": "2026-05-25T05:49:23Z" }
```

### 2.2 Get project summary
Returns rooms, item counts, **all valid status values**, and the valid `sheet_type` values.
```http
GET /api/agent/v1/projects/{project_id}
```
**Response:**
```json
{
  "project": { "id": "6c82f07b-...", "name": "Diehl Lakehouse", "client_info": {...} },
  "rooms": [
    { "id": "...", "name": "Living Room", "sheet_type": "checklist" },
    { "id": "...", "name": "Master Bathroom", "sheet_type": "ffe" }
  ],
  "categories": 28,
  "subcategories": 32,
  "item_count": 84,
  "valid_sheet_types": ["checklist", "ffe", "walkthrough"],
  "valid_statuses": ["", "TO BE SELECTED", "RESEARCHING", "PENDING APPROVAL",
                     "APPROVED", "ORDERED", "PICKED", "CONFIRMED",
                     "IN PRODUCTION", "SHIPPED", "IN TRANSIT", "OUT FOR DELIVERY",
                     "DELIVERED TO RECEIVER", "DELIVERED TO JOB SITE", "RECEIVED",
                     "READY FOR INSTALL", "INSTALLING", "INSTALLED",
                     "ON HOLD", "BACKORDERED", "DAMAGED", "RETURNED", "CANCELLED",
                     "ORDER SAMPLES", "SAMPLES ORDERED", "SAMPLES ARRIVED",
                     "GET QUOTE", "WAITING ON QT", "..."]
}
```

### 2.3 CREATE an item (the main endpoint)
The agent does **not** need to know UUIDs — it passes human-readable names.
The server finds-or-creates Room → Category → Subcategory for the given
`sheet_type` (`checklist` | `ffe` | `walkthrough`).

```http
POST /api/agent/v1/items
```
**Request body:**
```json
{
  "project_id": "6c82f07b-ff71-465e-850b-674f2f91a810",
  "room_name": "Living Room",
  "category_name": "Furniture",
  "subcategory_name": "Seating",
  "sheet_type": "checklist",

  "name": "Belgian Track Arm Sofa",
  "vendor": "Restoration Hardware",
  "sku": "BEL-TR-96-LIN",
  "link": "https://rh.com/sofa-bel-tr-96",
  "image_url": "https://images.example.com/sofa.jpg",
  "cost": 4200.00,
  "price": 5600.00,
  "quantity": 1,
  "size": "96\"W x 40\"D x 32\"H",
  "finish_color": "Antique Walnut",
  "fabric_code": "Crypton Velvet Navy",
  "colorway": null,
  "status": "RESEARCHING",
  "remarks": "Confidence 0.92 from Canva — best match vendor SKU verified",
  "notes": "Client wants two of these once approved",
  "placement": null,
  "priority": "Medium",
  "external_id": "canva-card-abc123"
}
```

**Response:**
```json
{
  "status": "created",
  "item": {
    "id": "83e9d003-3f8a-4a56-8fb5-5bb30ebc8a75",
    "subcategory_id": "...",
    "name": "Belgian Track Arm Sofa",
    "vendor": "Restoration Hardware",
    "sku": "BEL-TR-96-LIN",
    "link": "https://rh.com/sofa-bel-tr-96",
    "image_url": "https://images.example.com/sofa.jpg",
    "cost": 4200.0,
    "price": 5600.0,
    "quantity": 1,
    "status": "RESEARCHING",
    "remarks": "Confidence 0.92 from Canva — best match vendor SKU verified",
    "external_id": "canva-card-abc123",
    "created_at": "2026-05-25T05:50:12Z"
  },
  "scaffolding": {
    "room_id": "...", "category_id": "...", "subcategory_id": "..."
  }
}
```

**Idempotency:** If you pass `external_id` and call again with the same key,
the response is `{"status": "exists", "item": {...}}` and **no duplicate is created**.

### 2.4 UPDATE an item (partial / PATCH)
```http
PATCH /api/agent/v1/items/{item_id}
```
Body: any subset of the create-item fields (except `project_id`/`room_name`/etc which are not movable here).
```json
{ "status": "APPROVED", "cost": 4150.00, "remarks": "Client signed off" }
```

### 2.5 SEARCH items in a project
```http
GET /api/agent/v1/items?project_id={pid}&sheet_type=checklist&room=Living%20Room&q=sofa&limit=50
```
- All filters except `project_id` are optional.
- `q` matches `name`, `sku`, or `vendor` (case-insensitive substring).

Each result includes the full breadcrumb:
```json
{
  "items": [
    { "id": "...", "name": "Belgian Track Arm Sofa",
      "room_name": "Living Room", "category_name": "Furniture",
      "subcategory_name": "Seating", "sheet_type": "checklist",
      "vendor": "Restoration Hardware", "sku": "BEL-TR-96-LIN",
      "cost": 4150.0, "status": "APPROVED", "link": "..." }
  ],
  "total": 1
}
```

### 2.6 Attach an image to an existing item
Accepts **either** a remote URL **or** raw base64.
```http
POST /api/agent/v1/items/{item_id}/image
```
```json
{ "url": "https://images.example.com/sofa-front.jpg", "image_type": "main" }
```
or
```json
{ "base64": "iVBORw0KG...", "mime_type": "image/png", "image_type": "finish" }
```
- `image_type=main` → stored in `image_url`
- `image_type=finish` → stored in `finish_image` (for swatch / fabric / paint chips)

---

## 3) Field reference

| Field | Type | Notes |
|---|---|---|
| `project_id` | string (UUID) | Required. Find in the URL: `/project/{project_id}?tab=Checklist` |
| `room_name` | string | Free-text. Auto-created if missing. Match is case-insensitive. |
| `category_name` | string | Free-text. Auto-created. (e.g. "Furniture", "Lighting", "Plumbing") |
| `subcategory_name` | string | Free-text. Auto-created. (e.g. "Seating", "Drapery & Hardware") |
| `sheet_type` | enum | `checklist` (default) · `ffe` · `walkthrough` |
| `name` | string | Required. The item / product name. |
| `vendor` | string | e.g. "Restoration Hardware" |
| `sku` | string | Vendor SKU |
| `link` | string (URL) | Source / product page URL |
| `image_url` | string (URL OR data URL) | Main product image |
| `cost` | float | Wholesale / cost |
| `price` | float | Retail / sell price |
| `quantity` | int | Defaults to 1 |
| `size` | string | Free-form ("96\"W x 40\"D x 32\"H") |
| `finish_color` | string | |
| `fabric_code` | string | For upholstery |
| `colorway` | string | For rugs / textiles |
| `status` | enum | See `valid_statuses` from project summary endpoint |
| `remarks` | string | Confidence, vendor-match notes, placement notes — anything per-item |
| `notes` | string | Internal notes |
| `placement` | string | For Tile / Countertops / Flooring (e.g., "Kitchen Floor") |
| `priority` | string | "High" / "Medium" / "Low" |
| `external_id` | string | **Use this for idempotent posts** — the agent's own card/row id from Canva |

---

## 4) Errors

All errors return JSON: `{ "detail": "human-readable error message" }`

| Code | Meaning |
|---|---|
| 401 | Missing `X-API-Key` or invalid key |
| 403 | Key revoked / expired / not scoped to that project |
| 400 | Bad payload (invalid `status`, missing `name`, etc.) — `detail` contains valid values |
| 404 | Project or item not found |
| 500 | Server error — please paste the response back |

---

## 5) MCP / ChatGPT Action wrapper (10-min recipe)

### Option A — ChatGPT Custom GPT "Actions"
1. In ChatGPT GPT Editor → **Configure** → **Actions** → **Create new action**
2. Authentication: **API Key** · Header name `X-API-Key` · Paste the `edk_...` key
3. Schema: paste this OpenAPI YAML

```yaml
openapi: 3.1.0
info: { title: Established Design API, version: 1.0.0 }
servers:
  - url: https://app.estdesignco.com/api/agent/v1
paths:
  /projects/{project_id}:
    get:
      operationId: getProjectSummary
      parameters:
        - { in: path, name: project_id, required: true, schema: { type: string } }
      responses: { "200": { description: ok } }
  /items:
    post:
      operationId: createItem
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [project_id, room_name, name]
              properties:
                project_id:       { type: string }
                room_name:        { type: string }
                category_name:    { type: string, default: Furniture }
                subcategory_name: { type: string, default: Items }
                sheet_type:       { type: string, enum: [checklist, ffe, walkthrough], default: checklist }
                name:             { type: string }
                vendor:           { type: string }
                sku:              { type: string }
                link:             { type: string }
                image_url:        { type: string }
                cost:             { type: number }
                price:            { type: number }
                quantity:         { type: integer, default: 1 }
                status:           { type: string }
                remarks:          { type: string }
                external_id:      { type: string }
      responses: { "200": { description: ok } }
    get:
      operationId: searchItems
      parameters:
        - { in: query, name: project_id, required: true, schema: { type: string } }
        - { in: query, name: sheet_type, schema: { type: string } }
        - { in: query, name: room, schema: { type: string } }
        - { in: query, name: q, schema: { type: string } }
      responses: { "200": { description: ok } }
  /items/{item_id}:
    patch:
      operationId: updateItem
      parameters:
        - { in: path, name: item_id, required: true, schema: { type: string } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                status:  { type: string }
                cost:    { type: number }
                price:   { type: number }
                vendor:  { type: string }
                sku:     { type: string }
                link:    { type: string }
                remarks: { type: string }
                notes:   { type: string }
      responses: { "200": { description: ok } }
  /items/{item_id}/image:
    post:
      operationId: attachImage
      parameters:
        - { in: path, name: item_id, required: true, schema: { type: string } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                url:        { type: string }
                base64:     { type: string }
                image_type: { type: string, enum: [main, finish], default: main }
      responses: { "200": { description: ok } }
```

### Option B — MCP server stub (Python)
```python
# pip install mcp httpx
from mcp.server.fastmcp import FastMCP
import httpx, os

API = "https://app.estdesignco.com/api/agent/v1"
KEY = os.environ["EDC_API_KEY"]
HEADERS = {"X-API-Key": KEY, "Content-Type": "application/json"}

mcp = FastMCP("established-design")

@mcp.tool()
async def create_item(project_id: str, room_name: str, name: str,
                      category_name: str = "Furniture",
                      subcategory_name: str = "Items",
                      sheet_type: str = "checklist",
                      vendor: str = "", sku: str = "", link: str = "",
                      image_url: str = "", cost: float = 0, status: str = "",
                      remarks: str = "", external_id: str = ""):
    """Create a checklist/FFE/walkthrough item row."""
    body = {k: v for k, v in locals().items() if v not in ("", 0, None)}
    async with httpx.AsyncClient() as c:
        r = await c.post(f"{API}/items", json=body, headers=HEADERS)
        return r.json()

@mcp.tool()
async def search_items(project_id: str, q: str = "", room: str = "",
                       sheet_type: str = ""):
    params = {k: v for k, v in locals().items() if v}
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{API}/items", params=params, headers=HEADERS)
        return r.json()

if __name__ == "__main__":
    mcp.run()
```

---

## 6) Working example — full Canva → app flow

```bash
KEY="edk_paGyEpvWFOaxZN8D6cJ-rmiJZssWOItmKa8J1jjEIds"
PID="6c82f07b-ff71-465e-850b-674f2f91a810"
API="https://app.estdesignco.com/api/agent/v1"

# 1) Agent identifies a sofa on the Canva board.
curl -X POST "$API/items" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{
    "project_id": "'$PID'",
    "room_name": "Living Room",
    "category_name": "Furniture",
    "subcategory_name": "Seating",
    "sheet_type": "checklist",
    "name": "Belgian Track Arm Sofa",
    "vendor": "Restoration Hardware",
    "link": "https://rh.com/sofa-bel-tr-96",
    "image_url": "https://images.example.com/sofa.jpg",
    "cost": 4200,
    "status": "RESEARCHING",
    "remarks": "Canva confidence 0.92",
    "external_id": "canva-card-abc123"
  }'
# Response: { "status": "created", "item": { "id": "83e9d003-...", ... } }

# 2) Later, client approves it.
curl -X PATCH "$API/items/83e9d003-3f8a-4a56-8fb5-5bb30ebc8a75" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"status": "APPROVED", "cost": 4150}'
# Response: { "status": "updated", "item": { ... } }
```

---

## 7) Notes for production rollout

- **Preview** has all of this NOW. Production gets it on next redeploy.
- All endpoints are versioned (`/v1/`) — additive changes won't break agents.
- Database is the same as the UI — what the agent writes appears immediately
  in the Checklist / FFE / Walkthrough spreadsheets in the app.
- Per-key rate limiting is not yet enabled. If you expect > 100 req/min from
  the agent, ping me and I'll add it.
