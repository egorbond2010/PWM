package main

import (
	"log"
	"net/http"
	"os"

	"neutralmap-backend/internal/api"
	"neutralmap-backend/internal/repository"
	"neutralmap-backend/internal/websocket"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	wsHub := websocket.NewHub()
	go wsHub.Run()

	repo := repository.NewInMemoryRepository()
	apiHandler := api.NewAPI(repo, wsHub)
	mux := http.NewServeMux()
	apiHandler.RegisterRoutes(mux)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"pwm-backend","version":"2.4.0"}`))
	})

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("Listening on http://localhost:%s\n", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
