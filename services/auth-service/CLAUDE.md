# PRD — auth-service
**Lenguaje:** Go · **Puerto:** 3001 · **DB:** Ninguna

---

## Responsabilidad

Valida credenciales de usuario y emite un JWT. No tiene base de datos propia; delega la búsqueda del usuario a user-service vía HTTP interno.

---

## Stack

- Go 1.22
- Gin (`github.com/gin-gonic/gin`)
- JWT: `github.com/golang-jwt/jwt/v5`
- Password hashing: `golang.org/x/crypto/bcrypt`
- Env vars: `github.com/joho/godotenv`
- Process manager EC2: **systemd**

---

## Estructura de carpetas

```
cmd/main.go
internal/
  domain/
    user.go         ← struct UserResponse (lo que retorna user-service)
  handler/
    auth_handler.go ← lógica de login
config/config.go
.env
.env.example
go.mod
README.md
```

---

## Variables de entorno

```env
PORT=3001
JWT_SECRET=changeme_use_strong_secret_in_prod
USER_SERVICE_URL=http://localhost:3002
```

---

## Endpoint

### POST /login

Valida credenciales y retorna un JWT.

**Request body:**
```json
{
  "username": "admininicial",
  "password": "admin123456"
}
```

**Flujo:**
1. Validar que `username` y `password` estén presentes y no vacíos → 400 si falta alguno.
2. Llamar a `GET {USER_SERVICE_URL}/users/by-username/{username}` con header `X-Internal: true`.
3. Si user-service retorna 404 → responder 401 con `"error": "Credenciales inválidas"`.
4. Si el usuario tiene `is_active: false` → responder 401 con `"error": "Usuario inactivo"`.
5. Comparar `password` con `password_hash` usando `bcrypt.CompareHashAndPassword`.
6. Si no coincide → 401 con `"error": "Credenciales inválidas"`.
7. Generar JWT HS256 con payload `{ "user_id": cedula, "username": username }`, expiry 24h, firmado con `JWT_SECRET`.
8. Retornar 200.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

**Response 400:**
```json
{
  "success": false,
  "data": null,
  "error": "username y password son requeridos"
}
```

**Response 401:**
```json
{
  "success": false,
  "data": null,
  "error": "Credenciales inválidas"
}
```

---

## Health check

```
GET /health → 200 { "success": true, "data": { "service": "auth-service", "status": "ok" }, "error": null }
```

---

## Tests requeridos

| Nombre | Caso de prueba |
|---|---|
| `TestLoginSuccess` | SP1-QA-01 — login con credenciales correctas |
| `TestLoginWrongPassword` | SP1-QA-02 — login con contraseña incorrecta |
| `TestLoginMissingFields` | Validación 400 cuando faltan campos |
| `TestLoginInactiveUser` | Retorna 401 si `is_active: false` |