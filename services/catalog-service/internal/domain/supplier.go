package domain

import "time"

type Supplier struct {
	Nit          string    `gorm:"primaryKey;column:nit;type:varchar(20)" json:"nit"`
	SupplierName string    `gorm:"column:supplier_name;type:varchar(100);not null" json:"supplier_name"`
	Address      string    `gorm:"column:address;type:varchar(200);not null" json:"address"`
	Phone        string    `gorm:"column:phone;type:varchar(20);not null" json:"phone"`
	City         string    `gorm:"column:city;type:varchar(100);not null" json:"city"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (Supplier) TableName() string {
	return "suppliers"
}

type CreateSupplierRequest struct {
	Nit          string `json:"nit"`
	SupplierName string `json:"supplier_name"`
	Address      string `json:"address"`
	Phone        string `json:"phone"`
	City         string `json:"city"`
}

type UpdateSupplierRequest struct {
	Nit          string `json:"nit"`
	SupplierName string `json:"supplier_name"`
	Address      string `json:"address"`
	Phone        string `json:"phone"`
	City         string `json:"city"`
}
