package kml

import (
	"encoding/xml"
	"fmt"
	"io"
	"strconv"
	"strings"

	"neutralmap-backend/internal/models"
)

type KMLRoot struct {
	XMLName  xml.Name    `xml:"kml"`
	Document KMLDocument `xml:"Document"`
}

type KMLDocument struct {
	Name       string         `xml:"name"`
	Folders    []KMLFolder    `xml:"Folder"`
	Placemarks []KMLPlacemark `xml:"Placemark"`
}

type KMLFolder struct {
	Name       string         `xml:"name"`
	Placemarks []KMLPlacemark `xml:"Placemark"`
}

type KMLPlacemark struct {
	Name        string      `xml:"name"`
	Description string      `xml:"description"`
	StyleURL    string      `xml:"styleUrl"`
	Polygon     *KMLPolygon `xml:"Polygon"`
	Point       *KMLPoint   `xml:"Point"`
	LineString  *KMLLine    `xml:"LineString"`
}

type KMLPolygon struct {
	OuterBoundary KMLBoundary `xml:"outerBoundaryIs>LinearRing"`
}

type KMLBoundary struct {
	Coordinates string `xml:"coordinates"`
}

type KMLPoint struct {
	Coordinates string `xml:"coordinates"`
}

type KMLLine struct {
	Coordinates string `xml:"coordinates"`
}

func ParseKML(r io.Reader) (*models.GeoJSONFeatureCollection, error) {
	var kml KMLRoot
	decoder := xml.NewDecoder(r)
	if err := decoder.Decode(&kml); err != nil {
		return nil, fmt.Errorf("failed to decode KML XML: %w", err)
	}

	var placemarks []KMLPlacemark
	placemarks = append(placemarks, kml.Document.Placemarks...)
	for _, folder := range kml.Document.Folders {
		placemarks = append(placemarks, folder.Placemarks...)
	}

	fc := &models.GeoJSONFeatureCollection{
		Type:     "FeatureCollection",
		Features: make([]models.GeoJSONFeature, 0),
	}

	for i, pm := range placemarks {
		if pm.Polygon == nil && pm.Point == nil && pm.LineString == nil {
			continue
		}

		status, color := inferStatusAndColor(pm.Name, pm.Description, pm.StyleURL)
		featureID := fmt.Sprintf("kml-import-%d", i+1)

		if pm.Polygon != nil {
			coords := parseCoordString(pm.Polygon.OuterBoundary.Coordinates)
			if len(coords) >= 3 {
				if coords[0][0] != coords[len(coords)-1][0] || coords[0][1] != coords[len(coords)-1][1] {
					coords = append(coords, coords[0])
				}
				feature := models.GeoJSONFeature{
					Type: "Feature",
					ID:   featureID,
					Geometry: map[string]interface{}{
						"type":        "Polygon",
						"coordinates": [][][]float64{coords},
					},
					Properties: map[string]interface{}{
						"name":        pm.Name,
						"description": pm.Description,
						"status":      status,
						"color_hex":   color,
						"imported":    true,
					},
				}
				fc.Features = append(fc.Features, feature)
			}
		} else if pm.Point != nil {
			ptCoords := parseCoordString(pm.Point.Coordinates)
			if len(ptCoords) > 0 {
				feature := models.GeoJSONFeature{
					Type: "Feature",
					ID:   featureID,
					Geometry: map[string]interface{}{
						"type":        "Point",
						"coordinates": ptCoords[0],
					},
					Properties: map[string]interface{}{
						"name":        pm.Name,
						"description": pm.Description,
						"status":      status,
						"color_hex":   color,
					},
				}
				fc.Features = append(fc.Features, feature)
			}
		}
	}

	return fc, nil
}

func parseCoordString(raw string) [][]float64 {
	var result [][]float64
	lines := strings.Fields(raw)
	for _, line := range lines {
		parts := strings.Split(strings.TrimSpace(line), ",")
		if len(parts) >= 2 {
			lng, err1 := strconv.ParseFloat(parts[0], 64)
			lat, err2 := strconv.ParseFloat(parts[1], 64)
			if err1 == nil && err2 == nil {
				result = append(result, []float64{lng, lat})
			}
		}
	}
	return result
}

func inferStatusAndColor(name, desc, style string) (string, string) {
	combined := strings.ToLower(name + " " + desc + " " + style)
	if strings.Contains(combined, "side_a") || strings.Contains(combined, "blue") || strings.Contains(combined, "friendly") {
		return models.StatusSideA, "#3b82f6"
	}
	if strings.Contains(combined, "side_b") || strings.Contains(combined, "red") || strings.Contains(combined, "hostile") {
		return models.StatusSideB, "#ef4444"
	}
	if strings.Contains(combined, "contested") || strings.Contains(combined, "yellow") || strings.Contains(combined, "grey") || strings.Contains(combined, "gray") {
		return models.StatusContested, "#eab308"
	}
	return models.StatusUnconfirmed, "#6b7280"
}
