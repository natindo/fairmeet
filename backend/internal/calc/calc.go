package calc

import (
	"context"
	"database/sql"
	"math"
)

type Engine struct{}

func New() *Engine { return &Engine{} }

type Participant struct {
	ID     string
	Nick   string
	Coords [2]float64
}

type Zone struct {
	Center [2]float64
	Stats  struct {
		MaxWaitMin, MeanWaitMin, MeetingETA int
	}
}

type Candidate struct {
	ID        string
	Name      string
	Address   string
	Coords    [2]float64
	EtaByUser map[string]int
	Score     float64
}

func (e *Engine) LoadParticipants(ctx context.Context, db *sql.DB, meetingID string) []Participant {
	rows, _ := db.QueryContext(ctx, `SELECT id,nickname,coords_lon,coords_lat FROM participants WHERE meeting_id=$1`, meetingID)
	defer rows.Close()
	var ps []Participant
	for rows.Next() {
		var p Participant
		rows.Scan(&p.ID, &p.Nick, &p.Coords[0], &p.Coords[1])
		ps = append(ps, p)
	}
	return ps
}

func (e *Engine) Compute(ctx context.Context, ps []Participant, cat, mode string, y any, cache any) (Zone, []Candidate) {
	// для MVP — просто геоцентр
	var zone Zone
	var lonSum, latSum float64
	for _, p := range ps {
		lonSum += p.Coords[0]
		latSum += p.Coords[1]
	}
	n := float64(len(ps))
	zone.Center = [2]float64{lonSum / n, latSum / n}
	zone.Stats.MaxWaitMin = 10
	zone.Stats.MeanWaitMin = 8
	zone.Stats.MeetingETA = 8
	cands := []Candidate{{
		ID:      "poi1",
		Name:    "Stub Cafe",
		Address: "ул. Примерная, 1",
		Coords:  zone.Center,
		EtaByUser: map[string]int{
			"u1": 8, "u2": 10,
		},
		Score: -15,
	}}
	return zone, cands
}

func haversine(lon1, lat1, lon2, lat2 float64) float64 {
	R := 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*math.Sin(dLon/2)*math.Sin(dLon/2)
	return 2 * R * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}
