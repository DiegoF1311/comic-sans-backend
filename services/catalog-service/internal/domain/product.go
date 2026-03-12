package domain

import "time"

type Product struct {
	ProductCode   string    `gorm:"primaryKey;column:product_code;type:varchar(20)" json:"product_code"`
	ProductName   string    `gorm:"column:product_name;type:varchar(100);not null" json:"product_name"`
	NitSupplier   string    `gorm:"column:nit_supplier;type:varchar(20);not null" json:"nit_supplier"`
	PurchasePrice float64   `gorm:"column:purchase_price;type:decimal(10,2);not null" json:"purchase_price"`
	PurchaseVat   float64   `gorm:"column:purchase_vat;type:decimal(5,2);not null" json:"purchase_vat"`
	SalePrice     float64   `gorm:"column:sale_price;type:decimal(10,2);not null" json:"sale_price"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (Product) TableName() string {
	return "products"
}

type RejectedRow struct {
	Row         int    `json:"row"`
	ProductCode string `json:"product_code"`
	Reason      string `json:"reason"`
}

type UploadResult struct {
	Inserted     int           `json:"inserted"`
	Updated      int           `json:"updated"`
	Rejected     int           `json:"rejected"`
	RejectedRows []RejectedRow `json:"rejected_rows"`
}
