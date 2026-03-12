package handler

import (
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

type ProxyHandler struct {
	authServiceURL     string
	userServiceURL     string
	catalogServiceURL  string
	customerServiceURL string
	salesServiceURL    string
	reportServiceURL   string
}

func NewProxyHandler(authURL, userURL, catalogURL, customerURL, salesURL, reportURL string) *ProxyHandler {
	return &ProxyHandler{
		authServiceURL:     authURL,
		userServiceURL:     userURL,
		catalogServiceURL:  catalogURL,
		customerServiceURL: customerURL,
		salesServiceURL:    salesURL,
		reportServiceURL:   reportURL,
	}
}

func (p *ProxyHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service": "api-gateway",
			"status":  "ok",
		},
		"error": nil,
	})
}

func (p *ProxyHandler) ProxyAuth() gin.HandlerFunc {
	return p.createProxy(p.authServiceURL, "")
}

func (p *ProxyHandler) ProxyUsers() gin.HandlerFunc {
	return p.createProxy(p.userServiceURL, "/users")
}

func (p *ProxyHandler) ProxyCatalog() gin.HandlerFunc {
	return p.createProxy(p.catalogServiceURL, "")
}

func (p *ProxyHandler) ProxyCustomers() gin.HandlerFunc {
	return p.createProxy(p.customerServiceURL, "/customers")
}

func (p *ProxyHandler) ProxySales() gin.HandlerFunc {
	return p.createProxy(p.salesServiceURL, "/sales")
}

func (p *ProxyHandler) ProxyReports() gin.HandlerFunc {
	return p.createProxy(p.reportServiceURL, "/reports")
}

func (p *ProxyHandler) createProxy(target string, prefix string) gin.HandlerFunc {
	targetURL, _ := url.Parse(target)

	return func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		proxy.Director = func(req *http.Request) {
			req.URL.Scheme = targetURL.Scheme
			req.URL.Host = targetURL.Host
			req.URL.Path = prefix + c.Param("path")
			req.URL.RawQuery = c.Request.URL.RawQuery
			req.Host = targetURL.Host

			// Copy original headers
			req.Header = c.Request.Header.Clone()

			// Add internal headers
			if userID, exists := c.Get("user_id"); exists {
				req.Header.Set("X-User-Id", userID.(string))
			}
			if username, exists := c.Get("username"); exists {
				req.Header.Set("X-Username", username.(string))
			}
			req.Header.Set("X-Internal", "true")
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
