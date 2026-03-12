package handler

import (
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/tienda-generica/catalog-service/internal/domain"
	"github.com/tienda-generica/catalog-service/internal/repository"
	"gorm.io/gorm"
)

type ProductHandler struct {
	productRepo  *repository.ProductRepository
	supplierRepo *repository.SupplierRepository
}

func NewProductHandler(productRepo *repository.ProductRepository, supplierRepo *repository.SupplierRepository) *ProductHandler {
	return &ProductHandler{productRepo: productRepo, supplierRepo: supplierRepo}
}

func (h *ProductHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "A file must be selected"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".csv" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "File must be in CSV format"})
		return
	}

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil || len(records) < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Invalid CSV format"})
		return
	}

	headerRow := records[0]
	if len(headerRow) != 6 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "Invalid CSV format"})
		return
	}

	result := domain.UploadResult{
		RejectedRows: []domain.RejectedRow{},
	}

	for i, row := range records[1:] {
		rowNum := i + 2

		if len(row) != 6 {
			result.Rejected++
			result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
				Row:         rowNum,
				ProductCode: "",
				Reason:      "invalid number of columns",
			})
			continue
		}

		productCode := strings.TrimSpace(row[0])
		productName := strings.TrimSpace(row[1])
		nitSupplier := strings.TrimSpace(row[2])
		purchasePriceStr := strings.TrimSpace(row[3])
		purchaseVatStr := strings.TrimSpace(row[4])
		salePriceStr := strings.TrimSpace(row[5])

		if _, err := h.supplierRepo.FindByNit(nitSupplier); err != nil {
			result.Rejected++
			result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
				Row:         rowNum,
				ProductCode: productCode,
				Reason:      fmt.Sprintf("nit_supplier %s does not exist", nitSupplier),
			})
			continue
		}

		purchasePrice, err := strconv.ParseFloat(purchasePriceStr, 64)
		if err != nil {
			result.Rejected++
			result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
				Row:         rowNum,
				ProductCode: productCode,
				Reason:      "invalid purchase_price",
			})
			continue
		}

		purchaseVat, err := strconv.ParseFloat(purchaseVatStr, 64)
		if err != nil {
			result.Rejected++
			result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
				Row:         rowNum,
				ProductCode: productCode,
				Reason:      "invalid purchase_vat",
			})
			continue
		}

		salePrice, err := strconv.ParseFloat(salePriceStr, 64)
		if err != nil {
			result.Rejected++
			result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
				Row:         rowNum,
				ProductCode: productCode,
				Reason:      "invalid sale_price",
			})
			continue
		}

		existing, _ := h.productRepo.FindByCode(productCode)
		if existing != nil {
			existing.ProductName = productName
			existing.NitSupplier = nitSupplier
			existing.PurchasePrice = purchasePrice
			existing.PurchaseVat = purchaseVat
			existing.SalePrice = salePrice

			if err := h.productRepo.Update(existing); err != nil {
				result.Rejected++
				result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
					Row:         rowNum,
					ProductCode: productCode,
					Reason:      "failed to update product",
				})
				continue
			}
			result.Updated++
		} else {
			product := domain.Product{
				ProductCode:   productCode,
				ProductName:   productName,
				NitSupplier:   nitSupplier,
				PurchasePrice: purchasePrice,
				PurchaseVat:   purchaseVat,
				SalePrice:     salePrice,
			}

			if err := h.productRepo.Create(&product); err != nil {
				result.Rejected++
				result.RejectedRows = append(result.RejectedRows, domain.RejectedRow{
					Row:         rowNum,
					ProductCode: productCode,
					Reason:      "failed to insert product",
				})
				continue
			}
			result.Inserted++
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": result, "error": nil})
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	code := c.Param("id")

	product, err := h.productRepo.FindByCode(code)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "data": nil, "error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": product, "error": nil})
}

func (h *ProductHandler) List(c *gin.Context) {
	products, err := h.productRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Internal server error"})
		return
	}

	if products == nil {
		products = []domain.Product{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": products, "error": nil})
}
