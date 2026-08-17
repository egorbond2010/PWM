# NeutralMap Technical Architecture & GIS Engine

## 1. System Components

```text
neutralmap/
├── database/            # PostgreSQL 16 + PostGIS 3.4 spatial schemas and seed datasets
├── backend/             # Go REST API, WebSocket Hub, and PostGIS abstraction layer
├── sync/                # Background Google My Maps KML polling and diff detection worker
├── frontend/            # React 18, MapLibre GL JS, Tailwind, Timeline & Proof-of-Change cards
├── docker/              # Docker Compose multi-container configuration & Nginx proxy
└── docs/                # Architecture and API specifications
```

---

## 2. Geometric Diff Calculation Engine (PostGIS)

NeutralMap uses spatial relational algebra to determine territorial expansion and contraction.

### A. Advance Calculation (Gained Territory):
```sql
SELECT ST_Difference(new_geom, old_geom) AS diff_gain;
```

### B. Retreat Calculation (Lost Territory):
```sql
SELECT ST_Difference(old_geom, new_geom) AS diff_loss;
```

### C. Geodesic Area Calculation ($km^2$):
```sql
SELECT (ST_Area(new_geom::geography) - ST_Area(old_geom::geography)) / 1000000.0 AS delta_sqkm;
```

---

## 3. Real-Time WebSocket Protocol

The backend maintains active WebSocket connections at `/ws`. Whenever a moderator approves a submission or the KML sync worker ingests changes:

```json
{
  "event": "territory_updated",
  "timestamp": "2026-08-14T15:50:00Z",
  "payload": {
    "id": "t-side-b-east",
    "name": "Eastern Approach & Industrial Cluster",
    "status": "side_b",
    "area_sqkm": 88.3,
    "color_hex": "#ef4444"
  }
}
```

The React frontend listens to this stream and updates the MapLibre layer in-memory without requiring a page reload.

---

## 4. Google My Maps Sync Cycle

1. **Fetch**: The sync daemon polls the configured Google My Maps KML export URL every 300 seconds.
2. **Parse**: Extract placemarks, coordinates, names, and style tags.
3. **Compare**: Compare coordinate bounds against current PostGIS database records.
4. **Diff & Ingest**: If differences exist, PostGIS calculates `diff_gain` / `diff_loss` and stores them in `territory_history`.
5. **Broadcast**: Notifies connected clients via WebSocket to flash the updated boundary with neon green highlights.
