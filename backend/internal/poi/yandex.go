package poi

import (
	"context"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

type Yandex struct {
	key   string
	cache *redis.Client
	log   zerolog.Logger
}

func NewYandex(key string, cache *redis.Client, log zerolog.Logger) *Yandex {
	return &Yandex{key: key, cache: cache, log: log}
}

func (y *Yandex) ETA(ctx context.Context, o, t [2]float64, mode string) (int, error) {
	// TODO: call Yandex Routing, cache
	return 10, nil
}
