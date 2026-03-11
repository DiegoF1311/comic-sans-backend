package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/catalog-service/internal/domain"
	"github.com/tienda-generica/catalog-service/internal/repository"
	"gorm.io/gorm"
)

type SupplierHandler struct {
	repo *repository.SupplierRepository
}

func NewSupplierHandler(repo *repository.SupplierRepository) *SupplierHandler {
	return &SupplierHandler{repo: repo}
}

func (h *SupplierHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service": "catalog-service",
			"status":  "ok",
		},
		"error": nil,
	})
}

func (h *SupplierHandler) Create(c *gin.Context) {
	var req domain.CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	if strings.TrimSpace(req.Nit) == "" || strings.TrimSpace(req.SupplierName) == "" ||
		strings.TrimSpace(req.Address) == "" || strings.TrimSpace(req.Phone) == "" ||
		strings.TrimSpace(req.City) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	if existing, _ := h.repo.FindByNit(req.Nit); existing != nil {
		c.JSON(http.StatusConflict, gin.H{"success": false, "data": nil, "error": "Ya existe un proveedor con ese NIT"})
		return
	}

	supplier := domain.Supplier{
		Nit:          req.Nit,
		SupplierName: req.SupplierName,
		Address:      req.Address,
		Phone:        req.Phone,
		City:         req.City,
	}

	if err := h.repo.Create(&supplier); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al crear el proveedor"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": supplier, "error": nil})
}

func (h *SupplierHandler) GetByID(c *gin.Context) {
	nit := c.Param("id")

	supplier, err := h.repo.FindByNit(nit)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Proveedor no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": supplier, "error": nil})
}

func (h *SupplierHandler) List(c *gin.Context) {
	suppliers, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	if suppliers == nil {
		suppliers = []domain.Supplier{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": suppliers, "error": nil})
}

func (h *SupplierHandler) Update(c *gin.Context) {
	var req domain.UpdateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	if strings.TrimSpace(req.Nit) == "" || strings.TrimSpace(req.SupplierName) == "" ||
		strings.TrimSpace(req.Address) == "" || strings.TrimSpace(req.Phone) == "" ||
		strings.TrimSpace(req.City) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Todos los campos son requeridos"})
		return
	}

	supplier, err := h.repo.FindByNit(req.Nit)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Proveedor no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	supplier.SupplierName = req.SupplierName
	supplier.Address = req.Address
	supplier.Phone = req.Phone
	supplier.City = req.City

	if err := h.repo.Update(supplier); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al actualizar el proveedor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": supplier, "error": nil})
}

func (h *SupplierHandler) Delete(c *gin.Context) {
	nit := c.Param("id")

	if _, err := h.repo.FindByNit(nit); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Proveedor no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error interno del servidor"})
		return
	}

	if err := h.repo.Delete(nit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al eliminar el proveedor"})
		return
	}

	c.Status(http.StatusNoContent)
}
