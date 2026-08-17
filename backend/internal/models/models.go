package models

import (
	"encoding/json"
	"time"
)

const (
	StatusSideA       = "side_a"
	StatusSideB       = "side_b"
	StatusContested   = "contested"
	StatusUnconfirmed = "unconfirmed"
	StatusNeutral     = "neutral"
)

const (
	ConfidenceHigh        = "confirmed_high"
	ConfidenceMedium      = "medium"
	ConfidenceLow         = "low"
	ConfidenceUnconfirmed = "unconfirmed"
)

type Source struct {
	ID          string    `json:"id"`
	URL         string    `json:"url"`
	ArchiveURL  string    `json:"archive_url,omitempty"`
	SourceType  string    `json:"source_type"`
	Confidence  string    `json:"confidence"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	MediaURL    string    `json:"media_url,omitempty"`
	Coordinates []float64 `json:"coordinates,omitempty"`
	AuthorName  string    `json:"author_name,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Territory struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Status       string                 `json:"status"`
	ColorHex     string                 `json:"color_hex"`
	Geometry     map[string]interface{} `json:"geometry"`
	AreaSqKm     float64                `json:"area_sqkm"`
	LastSourceID string                 `json:"last_source_id,omitempty"`
	LastSource   *Source                `json:"last_source,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

type TerritoryHistory struct {
	ID               string                 `json:"id"`
	TerritoryID      string                 `json:"territory_id"`
	ChangeType       string                 `json:"change_type"`
	OldGeometry      map[string]interface{} `json:"old_geometry,omitempty"`
	NewGeometry      map[string]interface{} `json:"new_geometry"`
	DiffGain         map[string]interface{} `json:"diff_gain,omitempty"`
	DiffLoss         map[string]interface{} `json:"diff_loss,omitempty"`
	DeltaAreaSqKm    float64                `json:"delta_area_sqkm"`
	AuthorName       string                 `json:"author_name"`
	ModeratorName    string                 `json:"moderator_name,omitempty"`
	ModerationStatus string                 `json:"moderation_status"`
	Sources          []Source               `json:"sources,omitempty"`
	SourceIDs        []string               `json:"source_ids,omitempty"`
	ValidFrom        time.Time              `json:"valid_from"`
	ValidTo          *time.Time             `json:"valid_to,omitempty"`
	Notes            string                 `json:"notes,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
}

type GeoJSONFeature struct {
	Type       string                 `json:"type"`
	ID         string                 `json:"id"`
	Geometry   map[string]interface{} `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

type GeoJSONFeatureCollection struct {
	Type     string           `json:"type"`
	Features []GeoJSONFeature `json:"features"`
}

type WSMessage struct {
	Event     string      `json:"event"`
	Timestamp time.Time   `json:"timestamp"`
	Payload   interface{} `json:"payload"`
}

type ModerationProposal struct {
	ID          string                 `json:"id"`
	TerritoryID string                 `json:"territory_id,omitempty"`
	Name        string                 `json:"name"`
	Status      string                 `json:"status"`
	ColorHex    string                 `json:"color_hex"`
	Geometry    map[string]interface{} `json:"geometry"`
	Sources     []Source               `json:"sources"`
	Notes       string                 `json:"notes"`
	AuthorName  string                 `json:"author_name"`
	CreatedAt   time.Time              `json:"created_at"`
}

func ToJSONRaw(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}
