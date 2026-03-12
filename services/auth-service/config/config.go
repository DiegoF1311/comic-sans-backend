package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	JWTSecret      string
	UserServiceURL string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:           getEnv("PORT", "3001"),
		JWTSecret:      getEnv("JWT_SECRET", "changeme_use_strong_secret_in_prod"),
		UserServiceURL: getEnv("USER_SERVICE_URL", "http://localhost:3002"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
