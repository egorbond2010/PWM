# NeutralMap — Verifiable GIS Territory & Frontline Monitoring Platform

## Overview
NeutralMap is an open-source, high-precision GIS platform engineered for tracking territorial control, frontline shifts, and contested zones. 

Unlike traditional static war maps (e.g. DeepState, Liveuamap), **every geometric shift in NeutralMap is backed by verifiable OSINT evidence**, multi-source confidence ratings, cryptographic/database audit logs, and automatic topological diff calculation (`ST_Difference` / `ST_SymDifference`).

---

## Key Features

1. **Proof-of-Change & Verifiable Provenance ("Proof-of-Change Card")**:
   - Clicking any territory segment opens a transparent card detailing primary sources (geolocated drone videos, Sentinel-2 multi-spectral imagery, analyst reports).
   - Shows confidence rating (*High / Medium / Unconfirmed*), exact geocoordinates, archive web backups, mapper identity, and approving moderator.
2. **PostGIS Geometric Diff Engine**:
   - Computes topological differences between boundary versions (`ST_Difference(new, old)` for advances and `ST_Difference(old, new)` for retreats).
   - Renders animated neon pulsing overlays and calculates exact delta areas in square kilometers ($km^2$).
3. **Google My Maps Two-Way Synchronization**:
   - Standalone background sync worker polls Google My Maps KML feeds, parses placemarks and polygons, infers status from colors/styles, and feeds updates into the moderation pipeline.
4. **Time-Travel Timeline & Machine Replay**:
   - Scrub historical dates seamlessly or click "Play" to watch frontline progression step-by-step.
5. **Real-time WebSockets**:
   - Push-based event broadcasting (`territory_updated`, `diff_alert`, `moderation_approved`) for zero-refresh map updates across all connected viewers.
6. **In-Browser GIS Editor & Moderation Suite**:
   - Create territory proposals, assign sources, adjust vertices, and review pending submissions.

---

## Quickstart Guide

### 1. Run Everything with Docker Compose
```bash
cd docker
docker compose up --build -d
```
Services started:
- `Frontend`: [http://localhost:3000](http://localhost:3000) (or port 80 via Nginx)
- `Backend API`: [http://localhost:8080/api/v1/map](http://localhost:8080/api/v1/map)
- `WebSocket`: `ws://localhost:8080/ws`
- `PostGIS 16`: `localhost:5432`

---

### 2. Standalone Local Development

#### Start Backend (Go):
```bash
cd backend
go run ./cmd/server
```

#### Start Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```

#### Start KML Sync Worker (Go):
```bash
cd sync
go run ./cmd/sync
```
