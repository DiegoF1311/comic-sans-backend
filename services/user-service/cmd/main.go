package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/user-service/config"
	"github.com/tienda-generica/user-service/internal/domain"
	"github.com/tienda-generica/user-service/internal/handler"
	"github.com/tienda-generica/user-service/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}

	if err := db.AutoMigrate(&domain.User{}); err != nil {
		log.Fatalf("Error en AutoMigrate: %v", err)
	}

	seedAdmin(db)

	repo := repository.NewUserRepository(db)
	h := handler.NewUserHandler(repo)

	r := gin.Default()

	r.GET("/health", h.Health)
	r.GET("/users/by-username/:username", h.GetByUsername)
	r.POST("/users/save", h.Create)
	r.GET("/users/list", h.List)
	r.GET("/users/:id", h.GetByID)
	r.PUT("/users/update", h.Update)
	r.DELETE("/users/delete/:id", h.Delete)

	fmt.Printf("user-service running on :%s\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}

func seedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&domain.User{}).Count(&count)
	if count > 0 {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123456"), 10)
	if err != nil {
		log.Fatalf("Error al hashear contraseña del admin: %v", err)
	}

	admin := domain.User{
		Cedula:       "0",
		FullName:     "Administrador Inicial",
		Email:        "admin@tienda.com",
		Username:     "admininicial",
		PasswordHash: string(hash),
		IsActive:     true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatalf("Error al crear usuario admin inicial: %v", err)
	}

	log.Println("Seed: usuario admininicial creado")
}
