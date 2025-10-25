package httpapi

import (
	"encoding/json"
	"net/http"

	"fairmeet/internal/meeting"
	"fairmeet/internal/realtime"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router, svc *meeting.Service, hub *realtime.Hub) {
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/meetings", createMeeting(svc))
		r.Get("/meetings/{id}", getMeeting(svc))
		r.Post("/meetings/{id}/participants", upsertParticipant(svc, hub))
		r.Post("/meetings/{id}/organize", organize(svc))
		r.Get("/meetings/{id}/stream", hub.ServeHTTP)
	})
}

func createMeeting(svc *meeting.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Title    string `json:"title"`
			Category string `json:"category"`
		}
		json.NewDecoder(r.Body).Decode(&req)
		m, err := svc.Create(r.Context(), req.Title, req.Category)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		json.NewEncoder(w).Encode(m)
	}
}

func getMeeting(svc *meeting.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		m, err := svc.Get(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), 404)
			return
		}
		json.NewEncoder(w).Encode(m)
	}
}

func upsertParticipant(svc *meeting.Service, hub *realtime.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		client := r.Header.Get("X-Client-ID")
		var p meeting.ParticipantInput
		json.NewDecoder(r.Body).Decode(&p)
		m, err := svc.UpsertParticipant(r.Context(), id, client, p)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		hub.Broadcast(id, m)
		json.NewEncoder(w).Encode(m)
	}
}

func organize(svc *meeting.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		go svc.Organize(r.Context(), id)
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]string{"status": "organizing"})
	}
}
