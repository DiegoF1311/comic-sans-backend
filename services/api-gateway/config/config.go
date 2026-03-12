package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	JWTSecret         string
	AuthServiceURL    string
	UserServiceURL    string
	CatalogServiceURL string
	CustomerServiceURL string
	SalesServiceURL   string
	ReportServiceURL  string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:              getEnv("PORT", "8080"),
		JWTSecret:         getEnv("JWT_SECRET", "changeme_use_strong_secret_in_prod"),
		AuthServiceURL:    getEnv("AUTH_SERVICE_URL", "http://localhost:3001"),
		UserServiceURL:    getEnv("USER_SERVICE_URL", "http://localhost:3002"),
		CatalogServiceURL: getEnv("CATALOG_SERVICE_URL", "http://localhost:3003"),
		CustomerServiceURL: getEnv("CUSTOMER_SERVICE_URL", "http://localhost:3004"),
		SalesServiceURL:   getEnv("SALES_SERVICE_URL", "http://localhost:3005"),
		ReportServiceURL:  getEnv("REPORT_SERVICE_URL", "http://localhost:3006"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
