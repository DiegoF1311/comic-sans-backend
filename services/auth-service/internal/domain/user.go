package domain

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserServiceResponse struct {
	Success bool     `json:"success"`
	Data    *UserData `json:"data"`
	Error   *string  `json:"error"`
}

type UserData struct {
	Cedula       string `json:"cedula"`
	FullName     string `json:"full_name"`
	Email        string `json:"email"`
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
	IsActive     bool   `json:"is_active"`
	CreatedAt    string `json:"created_at"`
}
