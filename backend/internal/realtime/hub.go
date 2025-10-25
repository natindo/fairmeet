package realtime

import (
	"fmt"
	"net/http"
)

type Hub struct {
	subs map[string][]chan []byte
}

func NewHub() *Hub { return &Hub{subs: make(map[string][]chan []byte)} }

func (h *Hub) Run() {}

func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "stream unsupported", 500)
		return
	}
	ch := make(chan []byte, 5)
	h.subs[id] = append(h.subs[id], ch)
	w.Header().Set("Content-Type", "text/event-stream")
	for data := range ch {
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}
}

func (h *Hub) Broadcast(meetingID string, v any) {
	msg := []byte(fmt.Sprintf(`{"meeting":"%s"}`, meetingID))
	for _, c := range h.subs[meetingID] {
		select {
		case c <- msg:
		default:
		}
	}
}
