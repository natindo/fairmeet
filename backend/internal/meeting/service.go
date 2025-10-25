package meeting

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"fairmeet/internal/calc"
	"fairmeet/internal/poi"
	"fairmeet/internal/realtime"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

type Service struct {
	db   *sql.DB
	rdb  *redis.Client
	y    *poi.Yandex
	calc *calc.Engine
	hub  *realtime.Hub
	log  zerolog.Logger
}

func NewService(db *sql.DB, rdb *redis.Client, y *poi.Yandex, c *calc.Engine, hub *realtime.Hub, log zerolog.Logger) *Service {
	return &Service{db, rdb, y, c, hub, log}
}

type ParticipantInput struct {
	Nickname string `json:"nickname"`
	Origin   struct {
		Address string     `json:"address"`
		Coords  [2]float64 `json:"coords"`
	} `json:"origin"`
	DepartAt string `json:"departAt"`
}

func (s *Service) Create(ctx context.Context, title, category string) (map[string]string, error) {
	id := fmt.Sprintf("%x", time.Now().UnixNano())[:6]
	_, err := s.db.ExecContext(ctx, `INSERT INTO meetings(id,title,category,status)
	 VALUES ($1,$2,$3,'collecting')`, id, title, category)
	if err != nil {
		return nil, err
	}
	return map[string]string{"id": id, "title": title, "category": category, "status": "collecting"}, nil
}

func (s *Service) Get(ctx context.Context, id string) (any, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id,title,category,status FROM meetings WHERE id=$1`, id)
	var m struct {
		ID, Title, Category, Status string
	}
	if err := row.Scan(&m.ID, &m.Title, &m.Category, &m.Status); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *Service) UpsertParticipant(ctx context.Context, meetingID, clientID string, p ParticipantInput) (any, error) {
	_, err := s.db.ExecContext(ctx, `
	INSERT INTO participants(id,meeting_id,nickname,address,coords_lon,coords_lat,depart_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7)
	ON CONFLICT (id) DO UPDATE SET
	  nickname=EXCLUDED.nickname,
	  address=EXCLUDED.address,
	  coords_lon=EXCLUDED.coords_lon,
	  coords_lat=EXCLUDED.coords_lat,
	  depart_at=EXCLUDED.depart_at,
	  updated_at=now()`,
		clientID, meetingID, p.Nickname, p.Origin.Address, p.Origin.Coords[0], p.Origin.Coords[1], p.DepartAt)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, meetingID)
}

func (s *Service) Organize(ctx context.Context, meetingID string) {
	s.db.ExecContext(ctx, `UPDATE meetings SET status='organizing' WHERE id=$1`, meetingID)
	ps := s.calc.LoadParticipants(ctx, s.db, meetingID)
	zone, candidates := s.calc.Compute(ctx, ps, "coffee", "walking", s.y, s.rdb)

	bz, _ := json.Marshal(zone)
	s.db.ExecContext(ctx, `INSERT INTO zones(meeting_id,center_lon,center_lat,polygon,max_wait_min,mean_wait_min,meeting_eta)
	  VALUES ($1,$2,$3,$4,$5,$6,$7)
	  ON CONFLICT (meeting_id) DO UPDATE SET
	  center_lon=EXCLUDED.center_lon, center_lat=EXCLUDED.center_lat, polygon=EXCLUDED.polygon,
	  max_wait_min=EXCLUDED.max_wait_min, mean_wait_min=EXCLUDED.mean_wait_min, meeting_eta=EXCLUDED.meeting_eta`,
		meetingID, zone.Center[0], zone.Center[1], string(bz), zone.Stats.MaxWaitMin, zone.Stats.MeanWaitMin, zone.Stats.MeetingETA)

	for _, c := range candidates {
		beta, _ := json.Marshal(c.EtaByUser)
		s.db.ExecContext(ctx, `INSERT INTO candidates(id,meeting_id,poi_id,name,address,coords_lon,coords_lat,score,eta_by_user)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		 ON CONFLICT (id) DO UPDATE SET score=EXCLUDED.score, eta_by_user=EXCLUDED.eta_by_user`,
			fmt.Sprintf("%s:%s", meetingID, c.ID), meetingID, c.ID, c.Name, c.Address, c.Coords[0], c.Coords[1], c.Score, string(beta))
	}
	s.hub.Broadcast(meetingID, map[string]string{"status": "updated"})
}
