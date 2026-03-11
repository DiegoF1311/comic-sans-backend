package domain

import "time"

type User struct {
	Cedula       string    `gorm:"primaryKey;column:cedula;type:varchar(20)" json:"cedula"`
	FullName     string    `gorm:"column:full_name;type:varchar(100);not null" json:"full_name"`
	Email        string    `gorm:"column:email;type:varchar(100);not null" json:"email"`
	Username     string    `gorm:"column:username;type:varchar(50);not null;uniqueIndex" json:"username"`
	PasswordHash string    `gorm:"column:password_hash;type:varchar(255);not null" json:"password_hash,omitempty"`
	IsActive     bool      `gorm:"column:is_active;not null;default:true" json:"is_active"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (User) TableName() string {
	return "users"
}

type UserResponse struct {
	Cedula    string    `json:"cedula"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		Cedula:    u.Cedula,
		FullName:  u.FullName,
		Email:     u.Email,
		Username:  u.Username,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
	}
}

type CreateUserRequest struct {
	Cedula   string `json:"cedula"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type UpdateUserRequest struct {
	Cedula   string `json:"cedula"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}
