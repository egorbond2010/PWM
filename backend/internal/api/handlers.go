package api

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"neutralmap-backend/internal/kml"
	"neutralmap-backend/internal/models"
	"neutralmap-backend/internal/repository"
	"neutralmap-backend/internal/websocket"
)

var (
	viewsMutex sync.Mutex
	viewsCount int64 = 0
	viewsLoaded bool
)

type API struct {
	repo repository.Repository
	hub  *websocket.Hub
}

func NewAPI(repo repository.Repository, hub *websocket.Hub) *API {
	return &API{
		repo: repo,
		hub:  hub,
	}
}

func (a *API) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/map", a.corsMiddleware(a.handleGetMap))
	mux.HandleFunc("/api/v1/history", a.corsMiddleware(a.handleGetHistory))
	mux.HandleFunc("/api/v1/territory/", a.corsMiddleware(a.handleGetTerritory))
	mux.HandleFunc("/api/v1/diffs", a.corsMiddleware(a.handleGetDiffs))
	mux.HandleFunc("/api/v1/sources", a.corsMiddleware(a.handleGetSources))
	mux.HandleFunc("/api/v1/views", a.corsMiddleware(a.handleGetAndIncrementViews))
	mux.HandleFunc("/api/v1/moderation/submit", a.corsMiddleware(a.handleSubmitModeration))
	mux.HandleFunc("/api/v1/moderation/approve", a.corsMiddleware(a.handleApproveModeration))
	mux.HandleFunc("/api/v1/kml/import", a.corsMiddleware(a.handleImportKML))
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWS(a.hub, w, r)
	})
}

func (a *API) corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func (a *API) handleGetAndIncrementViews(w http.ResponseWriter, r *http.Request) {
	viewsMutex.Lock()
	if !viewsLoaded {
		if data, err := os.ReadFile("views.json"); err == nil {
			var saved struct {
				Views int64 `json:"views"`
			}
			if err := json.Unmarshal(data, &saved); err == nil {
				viewsCount = saved.Views
			}
		}
		viewsLoaded = true
	}
	viewsCount++
	current := viewsCount

	go func(cnt int64) {
		data, _ := json.Marshal(map[string]int64{"views": cnt})
		_ = os.WriteFile("views.json", data, 0644)
	}(current)
	viewsMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"views": current,
	})
}

func (a *API) handleGetMap(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	fc, err := a.repo.GetMapFeatures()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fc)
}

func (a *API) handleGetHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	dateStr := r.URL.Query().Get("date")
	var targetDate *time.Time
	if dateStr != "" {
		t, err := time.Parse(time.RFC3339, dateStr)
		if err == nil {
			targetDate = &t
		}
	}

	hist, err := a.repo.GetHistory(targetDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hist)
}

func (a *API) handleGetTerritory(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/territory/")
	if id == "" {
		http.Error(w, "Territory ID required", http.StatusBadRequest)
		return
	}
	t, err := a.repo.GetTerritory(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func (a *API) handleGetDiffs(w http.ResponseWriter, r *http.Request) {
	diffs, err := a.repo.GetDiffs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(diffs)
}

func (a *API) handleGetSources(w http.ResponseWriter, r *http.Request) {
	sources, err := a.repo.GetSources()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sources)
}

func (a *API) handleSubmitModeration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var proposal models.ModerationProposal
	if err := json.NewDecoder(r.Body).Decode(&proposal); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	hist, err := a.repo.SubmitProposal(&proposal)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.hub.Broadcast("proposal_submitted", hist)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(hist)
}

func (a *API) handleApproveModeration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		HistoryID     string `json:"history_id"`
		ModeratorName string `json:"moderator_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.ModeratorName == "" {
		req.ModeratorName = "Chief_Moderator"
	}

	t, err := a.repo.ApproveProposal(req.HistoryID, req.ModeratorName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	a.hub.Broadcast("territory_updated", t)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func (a *API) handleImportKML(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fc, err := kml.ParseKML(r.Body)
	if err != nil {
		http.Error(w, "Failed to parse KML: "+err.Error(), http.StatusBadRequest)
		return
	}

	author := r.URL.Query().Get("author")
	if author == "" {
		author = "KML_Sync_Daemon"
	}

	count, err := a.repo.ImportGeoJSON(fc, author)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	newMap, _ := a.repo.GetMapFeatures()
	a.hub.Broadcast("map_reloaded", newMap)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"imported_count": count,
		"features":       fc.Features,
	})
}
