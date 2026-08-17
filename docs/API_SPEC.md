# NeutralMap REST & WebSocket API Specification

Base URL: `http://localhost:8080/api/v1`

---

## REST Endpoints

### 1. `GET /api/v1/map`
Returns the active map layer as a standard GeoJSON `FeatureCollection`.

**Response (200 OK):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "t-side-a-north",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[37.85, 48.65], [38.02, 48.68], [38.06, 48.58], [37.92, 48.56], [37.85, 48.65]]]
      },
      "properties": {
        "id": "t-side-a-north",
        "name": "Northern Sector — Stronghold Alpha",
        "status": "side_a",
        "color_hex": "#3b82f6",
        "area_sqkm": 62.4,
        "updated_at": "2026-08-13T20:15:00Z",
        "last_source_id": "src-1429",
        "last_source_title": "Geolocated Drone Video #1429",
        "confidence": "confirmed_high"
      }
    }
  ]
}
```

---

### 2. `GET /api/v1/history?date=:isoDate`
Retrieves temporal snapshots for historical time-travel scrubbing.

---

### 3. `GET /api/v1/diffs`
Returns all active topological diff polygons (`diff_gain`, `diff_loss`) computed by PostGIS.

---

### 4. `GET /api/v1/sources`
Retrieves the registry of verified OSINT sources with media URLs, geolocation coordinates, and archive links.

---

### 5. `POST /api/v1/moderation/submit`
Submits a boundary shift proposal to the pending moderation queue.

---

### 6. `POST /api/v1/moderation/approve`
Approves a pending proposal, applies the new geometry to `territories`, and broadcasts a WebSocket notification.

---

### 7. `POST /api/v1/kml/import`
Parses raw Google My Maps XML/KML and converts it into GeoJSON features.

---

## WebSocket Feed

- **URL**: `ws://localhost:8080/ws`
- **Events**:
  - `territory_updated`
  - `diff_alert`
  - `proposal_submitted`
  - `map_reloaded`
