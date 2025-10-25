package config

import "os"

type Config struct {
	Port         string
	PostgresDSN  string
	RedisAddr    string
	YandexKey    string
	GridRadiusKm float64
	GridStepM    float64
}

func FromEnv() Config {
	return Config{
		Port:         getenv("PORT", "8080"),
		PostgresDSN:  getenv("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/fairmeet?sslmode=disable"),
		RedisAddr:    getenv("REDIS_ADDR", "localhost:6379"),
		GridRadiusKm: 3,
		GridStepM:    400,
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
