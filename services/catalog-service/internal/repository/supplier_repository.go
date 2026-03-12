package repository

import (
	"github.com/DiegoF1311/comic-sans-backend/services/catalog-service/internal/domain"
	"gorm.io/gorm"
)

type SupplierRepository struct {
	db *gorm.DB
}

func NewSupplierRepository(db *gorm.DB) *SupplierRepository {
	return &SupplierRepository{db: db}
}

func (r *SupplierRepository) Create(supplier *domain.Supplier) error {
	return r.db.Create(supplier).Error
}

func (r *SupplierRepository) FindByNit(nit string) (*domain.Supplier, error) {
	var supplier domain.Supplier
	err := r.db.Where("nit = ?", nit).First(&supplier).Error
	if err != nil {
		return nil, err
	}
	return &supplier, nil
}

func (r *SupplierRepository) FindAll() ([]domain.Supplier, error) {
	var suppliers []domain.Supplier
	err := r.db.Find(&suppliers).Error
	return suppliers, err
}

func (r *SupplierRepository) Update(supplier *domain.Supplier) error {
	return r.db.Save(supplier).Error
}

func (r *SupplierRepository) Delete(nit string) error {
	return r.db.Where("nit = ?", nit).Delete(&domain.Supplier{}).Error
}
