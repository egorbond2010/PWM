package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

const defaultKMLFeedURL = "https://www.google.com/maps/d/kml?forcekml=1&mid=1FIAJnR1aUSskgWDd_jd3TwXyCPGvZGU"

func main() {
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://localhost:8080"
	}

	kmlFeedURL := os.Getenv("KML_FEED_URL")
	if kmlFeedURL == "" {
		kmlFeedURL = defaultKMLFeedURL
	}

	pollIntervalStr := os.Getenv("POLL_INTERVAL")
	pollInterval := 300 * time.Second
	if pollIntervalStr != "" {
		if d, err := time.ParseDuration(pollIntervalStr); err == nil {
			pollInterval = d
		}
	}

	log.Printf("Starting Google My Maps Sync Worker against: %s", kmlFeedURL)
	log.Printf("Target backend: %s | Poll interval: %v", backendURL, pollInterval)

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	performSync(backendURL, kmlFeedURL)

	for range ticker.C {
		performSync(backendURL, kmlFeedURL)
	}
}

func performSync(backendURL, kmlFeedURL string) {
	log.Printf("Fetching KML feed from Google My Maps...")
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(kmlFeedURL)
	if err != nil {
		log.Printf("Failed to fetch KML feed: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Google My Maps returned status: %d", resp.StatusCode)
		return
	}

	kmlData, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read KML body: %v", err)
		return
	}

	importEndpoint := fmt.Sprintf("%s/api/v1/kml/import", backendURL)
	jsonPayload := fmt.Sprintf(`{"kml_content": %q, "author": "GoogleMyMaps_Sync_Daemon"}`, string(kmlData))

	importResp, err := client.Post(importEndpoint, "application/json", bytes.NewBuffer([]byte(jsonPayload)))
	if err != nil {
		log.Printf("Failed to post KML to backend: %v", err)
		return
	}
	defer importResp.Body.Close()

	body, _ := io.ReadAll(importResp.Body)
	log.Printf("Sync completed. Backend response: %s", string(body))
}
