package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/api-gateway/config"
	"github.com/tienda-generica/api-gateway/internal/handler"
	"github.com/tienda-generica/api-gateway/internal/middleware"
)

func main() {
	cfg := config.Load()

	proxy := handler.NewProxyHandler(
		cfg.AuthServiceURL,
		cfg.UserServiceURL,
		cfg.CatalogServiceURL,
		cfg.CustomerServiceURL,
		cfg.SalesServiceURL,
		cfg.ReportServiceURL,
	)

	r := gin.Default()

	r.GET("/health", proxy.Health)

	// Auth route — no JWT validation
	r.POST("/api/auth/*path", proxy.ProxyAuth())

	// Protected routes — JWT validation required
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		protected.Any("/users/*path", proxy.ProxyUsers())
		protected.Any("/catalog/*path", proxy.ProxyCatalog())
		protected.Any("/customers/*path", proxy.ProxyCustomers())
		protected.Any("/sales/*path", proxy.ProxySales())
		protected.Any("/reports/*path", proxy.ProxyReports())
	}

	fmt.Printf("api-gateway running on :%s\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
