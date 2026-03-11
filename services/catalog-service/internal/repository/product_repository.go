package repository

import (
	"github.com/tienda-generica/catalog-service/internal/domain"
	"gorm.io/gorm"
)

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(product *domain.Product) error {
	return r.db.Create(product).Error
}

func (r *ProductRepository) FindByCode(code string) (*domain.Product, error) {
	var product domain.Product
	err := r.db.Where("product_code = ?", code).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *ProductRepository) FindAll() ([]domain.Product, error) {
	var products []domain.Product
	err := r.db.Find(&products).Error
	return products, err
}

func (r *ProductRepository) Update(product *domain.Product) error {
	return r.db.Save(product).Error
}
