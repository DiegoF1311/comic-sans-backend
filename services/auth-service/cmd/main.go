package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/auth-service/config"
	"github.com/tienda-generica/auth-service/internal/handler"
)

func main() {
	cfg := config.Load()

	h := handler.NewAuthHandler(cfg.JWTSecret, cfg.UserServiceURL)

	r := gin.Default()

	r.GET("/health", h.Health)
	r.POST("/login", h.Login)

	fmt.Printf("auth-service running on :%s\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
