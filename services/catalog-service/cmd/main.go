package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/catalog-service/config"
	"github.com/tienda-generica/catalog-service/internal/domain"
	"github.com/tienda-generica/catalog-service/internal/handler"
	"github.com/tienda-generica/catalog-service/internal/repository"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}

	if err := db.AutoMigrate(&domain.Supplier{}); err != nil {
		log.Fatalf("Error en AutoMigrate (suppliers): %v", err)
	}
	if err := db.AutoMigrate(&domain.Product{}); err != nil {
		log.Fatalf("Error en AutoMigrate (products): %v", err)
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
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
