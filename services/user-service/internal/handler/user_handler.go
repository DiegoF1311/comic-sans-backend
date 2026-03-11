package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/user-service/internal/domain"
	"github.com/tienda-generica/user-service/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserHandler struct {
	repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

func (h *UserHandler) GetByUsername(c *gin.Context) {
	username := c.Param("username")

	user, err := h.repo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Usuario no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": user, "error": nil})
}

func (h *UserHandler) Create(c *gin.Context) {
	var req domain.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	if strings.TrimSpace(req.Cedula) == "" || strings.TrimSpace(req.FullName) == "" ||
		strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Username) == "" ||
		strings.TrimSpace(req.Password) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	if existing, _ := h.repo.FindByCedula(req.Cedula); existing != nil {
		c.JSON(http.StatusConflict, gin.H{"success": false, "data": nil, "error": "Ya existe un usuario con esa cédula"})
		return
	}

	if existing, _ := h.repo.FindByUsername(req.Username); existing != nil {
		c.JSON(http.StatusConflict, gin.H{"success": false, "data": nil, "error": "El nombre de usuario ya está en uso"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al procesar la contraseña"})
		return
	}

	user := domain.User{
		Cedula:       req.Cedula,
		FullName:     req.FullName,
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hash),
		IsActive:     true,
	}

	if err := h.repo.Create(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al crear el usuario"})
		return
	}

	h.repo.DeactivateAdmininicial()

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": user.ToResponse(), "error": nil})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	cedula := c.Param("id")

	user, err := h.repo.FindByCedula(cedula)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Usuario no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": user.ToResponse(), "error": nil})
}

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	var response []domain.UserResponse
	for _, u := range users {
		response = append(response, u.ToResponse())
	}

	if response == nil {
		response = []domain.UserResponse{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": response, "error": nil})
}

func (h *UserHandler) Update(c *gin.Context) {
	var req domain.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	if strings.TrimSpace(req.Cedula) == "" || strings.TrimSpace(req.FullName) == "" ||
		strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Username) == "" ||
		strings.TrimSpace(req.Password) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	user, err := h.repo.FindByCedula(req.Cedula)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Usuario no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	user.FullName = req.FullName
	user.Email = req.Email
	user.Username = req.Username

	if strings.TrimSpace(req.Password) != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al procesar la contraseña"})
			return
		}
		user.PasswordHash = string(hash)
	}

	if err := h.repo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al actualizar el usuario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": user.ToResponse(), "error": nil})
}

func (h *UserHandler) Delete(c *gin.Context) {
	cedula := c.Param("id")

	xUserID := c.GetHeader("X-User-Id")
	if xUserID == cedula {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "No puedes eliminar tu propio usuario"})
		return
	}

	if _, err := h.repo.FindByCedula(cedula); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Usuario no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	if err := h.repo.Delete(cedula); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al eliminar el usuario"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service": "user-service",
			"status":  "ok",
		},
		"error": nil,
	})
}
