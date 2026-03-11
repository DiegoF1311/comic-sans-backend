package repository

import (
	"github.com/tienda-generica/user-service/internal/domain"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&domain.User{}).Count(&count).Error
	return count, err
}

func (r *UserRepository) Create(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByCedula(cedula string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("cedula = ?", cedula).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByUsername(username string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindAll() ([]domain.User, error) {
	var users []domain.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *UserRepository) Update(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(cedula string) error {
	return r.db.Where("cedula = ?", cedula).Delete(&domain.User{}).Error
}

func (r *UserRepository) DeactivateAdmininicial() error {
	return r.db.Model(&domain.User{}).
		Where("username = ? AND is_active = ?", "admininicial", true).
		Update("is_active", false).Error
}
