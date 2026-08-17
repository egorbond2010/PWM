package repository

import (
	"encoding/json"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/google/uuid"
	"neutralmap-backend/internal/models"
)

type Repository interface {
	GetMapFeatures() (*models.GeoJSONFeatureCollection, error)
	GetHistory(targetDate *time.Time) ([]models.TerritoryHistory, error)
	GetTerritory(id string) (*models.Territory, error)
	GetSources() ([]models.Source, error)
	GetSource(id string) (*models.Source, error)
	GetDiffs() ([]models.TerritoryHistory, error)
	SubmitProposal(proposal *models.ModerationProposal) (*models.TerritoryHistory, error)
	ApproveProposal(historyID string, moderatorName string) (*models.Territory, error)
	ImportGeoJSON(fc *models.GeoJSONFeatureCollection, authorName string) (int, error)
}

type InMemoryRepository struct {
	mu          sync.RWMutex
	territories map[string]*models.Territory
	history     []models.TerritoryHistory
	sources     map[string]*models.Source
}

func NewInMemoryRepository() *InMemoryRepository {
	repo := &InMemoryRepository{
		territories: make(map[string]*models.Territory),
		history:     make([]models.TerritoryHistory, 0),
		sources:     make(map[string]*models.Source),
	}
	repo.seedInitialData()
	return repo
}

func (r *InMemoryRepository) seedInitialData() {
	now := time.Now()

	s1 := &models.Source{
		ID:          "src-1429",
		URL:         "https://t.me/osint_geoconfirm/14290",
		ArchiveURL:  "https://web.archive.org/web/20260812/osint-14290",
		SourceType:  "video",
		Confidence:  models.ConfidenceHigh,
		Title:       "Geolocated Drone Video #1429 — North Ridge",
		Description: "UAV reconnaissance footage showing infantry movements along trench systems near the industrial silo (48.595, 37.998). Coordinates cross-referenced with satellite landmarks.",
		MediaURL:    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop",
		Coordinates: []float64{37.998, 48.595},
		AuthorName:  "OSINT_Analyst_01",
		CreatedAt:   now.Add(-48 * time.Hour),
	}

	s2 := &models.Source{
		ID:          "src-sat-2026",
		URL:         "https://sentinel-hub.com/eo-browser/sample-2026",
		ArchiveURL:  "https://archive.is/sentinel-diff-2026",
		SourceType:  "sat_imagery",
		Confidence:  models.ConfidenceHigh,
		Title:       "Sentinel-2 Multispectral Satellite Pass",
		Description: "High-resolution optical pass confirming fortified berms and vehicular tracks along the western canal bank.",
		MediaURL:    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
		Coordinates: []float64{37.865, 48.421},
		AuthorName:  "Chief_Moderator",
		CreatedAt:   now.Add(-24 * time.Hour),
	}

	s3 := &models.Source{
		ID:          "src-report-88",
		URL:         "https://twitter.com/analyst_mapper/status/18920192",
		SourceType:  "official_report",
		Confidence:  models.ConfidenceMedium,
		Title:       "Tactical Situation Report — Sector Central",
		Description: "Heavy artillery engagements and contested patrol clashes near the railway overpass. Border remains fluid.",
		MediaURL:    "https://images.unsplash.com/photo-1508873696983-2df570464756?w=800&auto=format&fit=crop",
		Coordinates: []float64{38.012, 48.520},
		AuthorName:  "Frontline_Watcher",
		CreatedAt:   now.Add(-6 * time.Hour),
	}

	r.sources[s1.ID] = s1
	r.sources[s2.ID] = s2
	r.sources[s3.ID] = s3

	t1 := &models.Territory{
		ID:       "t-side-a-north",
		Name:     "Northern Sector — Stronghold Alpha",
		Status:   models.StatusSideA,
		ColorHex: "#3b82f6",
		Geometry: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{
					{37.85, 48.65},
					{38.02, 48.68},
					{38.06, 48.58},
					{37.92, 48.56},
					{37.85, 48.65},
				},
			},
		},
		AreaSqKm:     62.4,
		LastSourceID: s1.ID,
		LastSource:   s1,
		CreatedAt:    now.Add(-7 * 24 * time.Hour),
		UpdatedAt:    now.Add(-24 * time.Hour),
	}

	t2 := &models.Territory{
		ID:       "t-side-b-east",
		Name:     "Eastern Approach & Industrial Cluster",
		Status:   models.StatusSideB,
		ColorHex: "#ef4444",
		Geometry: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{
					{38.06, 48.58},
					{38.22, 48.62},
					{38.25, 48.48},
					{38.05, 48.46},
					{38.06, 48.58},
				},
			},
		},
		AreaSqKm:     84.1,
		LastSourceID: s2.ID,
		LastSource:   s2,
		CreatedAt:    now.Add(-7 * 24 * time.Hour),
		UpdatedAt:    now.Add(-12 * time.Hour),
	}

	t3 := &models.Territory{
		ID:       "t-contested-central",
		Name:     "Central Buffer Zone (Bakhmut Ridge)",
		Status:   models.StatusContested,
		ColorHex: "#eab308",
		Geometry: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{
					{37.92, 48.56},
					{38.06, 48.58},
					{38.05, 48.46},
					{37.90, 48.44},
					{37.92, 48.56},
				},
			},
		},
		AreaSqKm:     34.8,
		LastSourceID: s3.ID,
		LastSource:   s3,
		CreatedAt:    now.Add(-5 * 24 * time.Hour),
		UpdatedAt:    now.Add(-6 * time.Hour),
	}

	t4 := &models.Territory{
		ID:       "t-unconfirmed-south",
		Name:     "Southern Forestry Perimeter (Unconfirmed)",
		Status:   models.StatusUnconfirmed,
		ColorHex: "#6b7280",
		Geometry: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{
					{37.90, 48.44},
					{38.05, 48.46},
					{38.02, 48.34},
					{37.86, 48.33},
					{37.90, 48.44},
				},
			},
		},
		AreaSqKm:  41.5,
		CreatedAt: now.Add(-3 * 24 * time.Hour),
		UpdatedAt: now,
	}

	r.territories[t1.ID] = t1
	r.territories[t2.ID] = t2
	r.territories[t3.ID] = t3
	r.territories[t4.ID] = t4

	h1 := models.TerritoryHistory{
		ID:          "hist-diff-001",
		TerritoryID: t2.ID,
		ChangeType:  "advance",
		OldGeometry: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{
					{38.09, 48.58},
					{38.22, 48.62},
					{38.25, 48.48},
					{38.08, 48.46},
					{38.09, 48.58},
				},
			},
		},
		NewGeometry: t2.Geometry,
		DiffGain: map[string]interface{}{
			"type": "Polygon",
			"coordinates": [][][]float64{
				{
					{38.06, 48.58},
					{38.09, 48.58},
					{38.08, 48.46},
					{38.05, 48.46},
					{38.06, 48.58},
				},
			},
		},
		DeltaAreaSqKm:    4.2,
		AuthorName:       "OSINT_Analyst_01",
		ModeratorName:    "Chief_Moderator",
		ModerationStatus: "approved",
		Sources:          []models.Source{*s1, *s2},
		SourceIDs:        []string{s1.ID, s2.ID},
		ValidFrom:        now.Add(-18 * time.Hour),
		Notes:            "Advance confirmed through geolocated UAV footage and thermal satellite detection. Area expanded westward by 4.2 sq km.",
		CreatedAt:        now.Add(-18 * time.Hour),
	}

	r.history = append(r.history, h1)
}

func (r *InMemoryRepository) GetMapFeatures() (*models.GeoJSONFeatureCollection, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	fc := &models.GeoJSONFeatureCollection{
		Type:     "FeatureCollection",
		Features: make([]models.GeoJSONFeature, 0, len(r.territories)),
	}

	for _, t := range r.territories {
		props := map[string]interface{}{
			"id":             t.ID,
			"name":           t.Name,
			"status":         t.Status,
			"color_hex":      t.ColorHex,
			"area_sqkm":      t.AreaSqKm,
			"updated_at":     t.UpdatedAt.Format(time.RFC3339),
			"last_source_id": t.LastSourceID,
		}
		if t.LastSource != nil {
			props["last_source_title"] = t.LastSource.Title
			props["last_source_type"] = t.LastSource.SourceType
			props["confidence"] = t.LastSource.Confidence
		}

		feat := models.GeoJSONFeature{
			Type:       "Feature",
			ID:         t.ID,
			Geometry:   t.Geometry,
			Properties: props,
		}
		fc.Features = append(fc.Features, feat)
	}

	return fc, nil
}

func (r *InMemoryRepository) GetHistory(targetDate *time.Time) ([]models.TerritoryHistory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if targetDate == nil {
		return r.history, nil
	}

	var filtered []models.TerritoryHistory
	for _, h := range r.history {
		if h.ValidFrom.Before(*targetDate) || h.ValidFrom.Equal(*targetDate) {
			if h.ValidTo == nil || h.ValidTo.After(*targetDate) {
				filtered = append(filtered, h)
			}
		}
	}
	return filtered, nil
}

func (r *InMemoryRepository) GetTerritory(id string) (*models.Territory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	t, exists := r.territories[id]
	if !exists {
		return nil, fmt.Errorf("territory not found: %s", id)
	}
	return t, nil
}

func (r *InMemoryRepository) GetSources() ([]models.Source, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sources := make([]models.Source, 0, len(r.sources))
	for _, s := range r.sources {
		sources = append(sources, *s)
	}
	return sources, nil
}

func (r *InMemoryRepository) GetSource(id string) (*models.Source, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, exists := r.sources[id]
	if !exists {
		return nil, fmt.Errorf("source not found: %s", id)
	}
	return s, nil
}

func (r *InMemoryRepository) GetDiffs() ([]models.TerritoryHistory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	diffs := make([]models.TerritoryHistory, 0)
	for _, h := range r.history {
		if h.DiffGain != nil || h.DiffLoss != nil {
			diffs = append(diffs, h)
		}
	}
	return diffs, nil
}

func (r *InMemoryRepository) SubmitProposal(proposal *models.ModerationProposal) (*models.TerritoryHistory, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	histID := "prop-" + uuid.New().String()[:8]
	tID := proposal.TerritoryID
	if tID == "" {
		tID = "t-" + uuid.New().String()[:8]
	}

	var oldGeom map[string]interface{}
	if existing, ok := r.territories[tID]; ok {
		oldGeom = existing.Geometry
	}

	sourceIDs := make([]string, 0)
	for i := range proposal.Sources {
		s := proposal.Sources[i]
		if s.ID == "" {
			s.ID = "src-" + uuid.New().String()[:8]
		}
		s.CreatedAt = time.Now()
		r.sources[s.ID] = &s
		sourceIDs = append(sourceIDs, s.ID)
	}

	hist := models.TerritoryHistory{
		ID:               histID,
		TerritoryID:      tID,
		ChangeType:       "correction",
		OldGeometry:      oldGeom,
		NewGeometry:      proposal.Geometry,
		DiffGain:         proposal.Geometry,
		DeltaAreaSqKm:    approximateAreaSqKm(proposal.Geometry),
		AuthorName:       proposal.AuthorName,
		ModerationStatus: "pending",
		Sources:          proposal.Sources,
		SourceIDs:        sourceIDs,
		ValidFrom:        time.Now(),
		Notes:            proposal.Notes,
		CreatedAt:        time.Now(),
	}

	r.history = append(r.history, hist)
	return &hist, nil
}

func (r *InMemoryRepository) ApproveProposal(historyID string, moderatorName string) (*models.Territory, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var targetHist *models.TerritoryHistory
	for i := range r.history {
		if r.history[i].ID == historyID {
			targetHist = &r.history[i]
			break
		}
	}

	if targetHist == nil {
		return nil, fmt.Errorf("history record not found: %s", historyID)
	}

	targetHist.ModerationStatus = "approved"
	targetHist.ModeratorName = moderatorName

	var lastSource *models.Source
	var lastSourceID string
	if len(targetHist.Sources) > 0 {
		lastSource = &targetHist.Sources[0]
		lastSourceID = lastSource.ID
	}

	t, exists := r.territories[targetHist.TerritoryID]
	if !exists {
		t = &models.Territory{
			ID:        targetHist.TerritoryID,
			Name:      "Sector " + targetHist.TerritoryID,
			Status:    models.StatusContested,
			ColorHex:  "#eab308",
			CreatedAt: time.Now(),
		}
	}

	t.Geometry = targetHist.NewGeometry
	t.AreaSqKm = targetHist.DeltaAreaSqKm
	t.LastSource = lastSource
	t.LastSourceID = lastSourceID
	t.UpdatedAt = time.Now()
	r.territories[t.ID] = t

	return t, nil
}

func (r *InMemoryRepository) ImportGeoJSON(fc *models.GeoJSONFeatureCollection, authorName string) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	importedCount := 0
	for _, feat := range fc.Features {
		if feat.Geometry == nil {
			continue
		}

		name, _ := feat.Properties["name"].(string)
		if name == "" {
			name = fmt.Sprintf("Imported Zone #%d", importedCount+1)
		}
		status, _ := feat.Properties["status"].(string)
		if status == "" {
			status = models.StatusUnconfirmed
		}
		color, _ := feat.Properties["color_hex"].(string)
		if color == "" {
			color = "#6b7280"
		}

		id := feat.ID
		if id == "" {
			id = "t-kml-" + uuid.New().String()[:8]
		}

		area := approximateAreaSqKm(feat.Geometry)

		t := &models.Territory{
			ID:        id,
			Name:      name,
			Status:    status,
			ColorHex:  color,
			Geometry:  feat.Geometry,
			AreaSqKm:  area,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		r.territories[id] = t

		r.history = append(r.history, models.TerritoryHistory{
			ID:               "hist-kml-" + uuid.New().String()[:8],
			TerritoryID:      id,
			ChangeType:       "kml_sync",
			NewGeometry:      feat.Geometry,
			DeltaAreaSqKm:    area,
			AuthorName:       authorName,
			ModerationStatus: "approved",
			ValidFrom:        time.Now(),
			Notes:            "Synchronized from Google My Maps KML layer",
			CreatedAt:        time.Now(),
		})

		importedCount++
	}

	return importedCount, nil
}

func approximateAreaSqKm(geom map[string]interface{}) float64 {
	coordsRaw, ok := geom["coordinates"]
	if !ok {
		return 12.5
	}
	bytes, _ := json.Marshal(coordsRaw)
	var rings [][][]float64
	if err := json.Unmarshal(bytes, &rings); err != nil || len(rings) == 0 {
		return 15.0
	}
	ring := rings[0]
	if len(ring) < 3 {
		return 5.0
	}

	var area float64
	const r = 6371.0
	for i := 0; i < len(ring)-1; i++ {
		p1 := ring[i]
		p2 := ring[i+1]
		area += (p2[0] - p1[0]) * (math.Pi / 180.0) * (2 + math.Sin(p1[1]*math.Pi/180.0) + math.Sin(p2[1]*math.Pi/180.0))
	}
	area = math.Abs(area * r * r / 2.0)
	if area < 0.1 || math.IsNaN(area) {
		return 14.2
	}
	return math.Round(area*10) / 10
}
