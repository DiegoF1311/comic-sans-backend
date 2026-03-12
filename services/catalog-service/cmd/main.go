package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/DiegoF1311/comic-sans-backend/services/catalog-service/config"
	"github.com/DiegoF1311/comic-sans-backend/services/catalog-service/internal/domain"
	"github.com/DiegoF1311/comic-sans-backend/services/catalog-service/internal/handler"
	"github.com/DiegoF1311/comic-sans-backend/services/catalog-service/internal/repository"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(&domain.Supplier{}); err != nil {
		log.Fatalf("AutoMigrate failed (suppliers): %v", err)
	}
	if err := db.AutoMigrate(&domain.Product{}); err != nil {
		log.Fatalf("AutoMigrate failed (products): %v", err)
	}

	supplierRepo := repository.NewSupplierRepository(db)
	productRepo := repository.NewProductRepository(db)

	supplierHandler := handler.NewSupplierHandler(supplierRepo)
	productHandler := handler.NewProductHandler(productRepo, supplierRepo)

	r := gin.Default()

	r.GET("/health", supplierHandler.Health)

	r.POST("/suppliers/save", supplierHandler.Create)
	r.GET("/suppliers/list", supplierHandler.List)
	r.GET("/suppliers/:id", supplierHandler.GetByID)
	r.PUT("/suppliers/update", supplierHandler.Update)
	r.DELETE("/suppliers/delete/:id", supplierHandler.Delete)

	r.POST("/products/upload", productHandler.Upload)
	r.GET("/products/list", productHandler.List)
	r.GET("/products/:id", productHandler.GetByID)

	fmt.Printf("catalog-service running on :%s\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
