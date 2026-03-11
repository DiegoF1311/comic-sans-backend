package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/tienda-generica/auth-service/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	jwtSecret      string
	userServiceURL string
	httpClient     *http.Client
}

func NewAuthHandler(jwtSecret, userServiceURL string) *AuthHandler {
	return &AuthHandler{
		jwtSecret:      jwtSecret,
		userServiceURL: userServiceURL,
		httpClient:     &http.Client{Timeout: 10 * time.Second},
	}
}

func (h *AuthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service": "auth-service",
			"status":  "ok",
		},
		"error": nil,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "username y password son requeridos"})
		return
	}

	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.Password) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "data": nil, "error": "username y password son requeridos"})
		return
	}

	userData, err := h.fetchUser(req.Username)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": nil, "error": "Credenciales inválidas"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al consultar el servicio de usuarios"})
		return
	}

	if !userData.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": nil, "error": "Usuario inactivo"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(userData.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "data": nil, "error": "Credenciales inválidas"})
		return
	}

	token, err := h.generateToken(userData.Cedula, userData.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "data": nil, "error": "Error al generar el token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"token": token}, "error": nil})
}

func (h *AuthHandler) fetchUser(username string) (*domain.UserData, error) {
	url := fmt.Sprintf("%s/users/by-username/%s", h.userServiceURL, username)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Set("X-Internal", "true")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error calling user-service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("user not found")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status from user-service: %d", resp.StatusCode)
	}

	var userResp domain.UserServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return nil, fmt.Errorf("error decoding response: %w", err)
	}

	if !userResp.Success || userResp.Data == nil {
		return nil, fmt.Errorf("user not found")
	}

	return userResp.Data, nil
}

func (h *AuthHandler) generateToken(userID, username string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"iat":      now.Unix(),
		"exp":      now.Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}
