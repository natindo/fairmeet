package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/natindo/fairmeet/backend/internal/calc"
	"github.com/natindo/fairmeet/backend/internal/config"
	"github.com/natindo/fairmeet/backend/internal/httpapi"
	"github.com/natindo/fairmeet/backend/internal/log"
	"github.com/natindo/fairmeet/backend/internal/meeting"

	"github.com/natindo/fairmeet/backend/internal/poi"
	"github.com/natindo/fairmeet/backend/internal/realtime"
	"github.com/natindo/fairmeet/backend/internal/repo"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func main() {
	cfg := config.FromEnv()
	logger := log.New()

	db := repo.MustOpenPostgres(cfg.PostgresDSN)
	cache := repo.MustOpenRedis(cfg.RedisAddr)
	yapi := poi.NewYandex(cfg.YandexKey, cache, logger)
	calculator := calc.New()
	hub := realtime.NewHub()

	svc := meeting.NewService(db, cache, yapi, calculator, hub, logger)

	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{AllowedOrigins: []string{"*"}, AllowedMethods: []string{"GET", "POST", "OPTIONS"}}))
	httpapi.RegisterRoutes(r, svc, hub)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: r}
	go hub.Run()
	go func() {
		logger.Info().Msg("listening on :" + cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("server")
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	logger.Info().Msg("shutting down")
	srv.Shutdown(context.Background())
}
