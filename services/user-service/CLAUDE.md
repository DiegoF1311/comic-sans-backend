# PRD — user-service
**Lenguaje:** Go · **Puerto:** 3002 · **DB:** db_users

---

## Responsabilidad

CRUD completo de usuarios del sistema. Incluye el seed del usuario inicial `admininicial` y la lógica de desactivación automática del mismo al registrarse el primer usuario real.

---

## Stack

- Go 1.22
- Gin (`github.com/gin-gonic/gin`)
- GORM (`gorm.io/gorm` + `gorm.io/driver/mysql`)
- Password hashing: `golang.org/x/crypto/bcrypt`
- Env vars: `github.com/joho/godotenv`
- Process manager EC2: **systemd**

---

## Estructura de carpetas

```
cmd/main.go
internal/
  domain/
    user.go           ← struct User, UserResponse
  handler/
    user_handler.go
  repository/
    user_repository.go
config/config.go
.env
.env.example
go.mod
README.md
```

---

## Variables de entorno

```env
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=db_users
```

---

## Esquema de base de datos

```sql
CREATE DATABASE IF NOT EXISTS db_users;
USE db_users;

CREATE TABLE users (
  cedula        VARCHAR(20)  NOT NULL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Usar **GORM AutoMigrate** al arrancar para crear la tabla si no existe.

---

## Seed automático

Ejecutar **antes** de levantar el servidor HTTP:

```
1. Contar filas en tabla users
2. Si count == 0:
   a. Hashear "admin123456" con bcrypt (cost 10)
   b. Insertar:
        cedula       = "0"
        full_name    = "Administrador Inicial"
        email        = "admin@tienda.com"
        username     = "admininicial"
        password_hash = <hash>
        is_active    = true
```

---

## Regla de negocio — desactivación de admininicial

Cada vez que se crea un nuevo usuario exitosamente con `POST /users/save`:
1. Verificar si existe usuario con `username = "admininicial"` e `is_active = true`.
2. Si existe → actualizar su `is_active` a `false`.

---

## Endpoints

### GET /users/by-username/:username
**Uso exclusivo:** llamado interno por auth-service. Retorna el usuario **incluyendo** `password_hash`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "cedula": "0",
    "full_name": "Administrador Inicial",
    "email": "admin@tienda.com",
    "username": "admininicial",
    "password_hash": "$2a$10$...",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

**Response 404:** `{ "success": false, "data": null, "error": "Usuario no encontrado" }`

---

### POST /users/save

**Request body:**
```json
{
  "cedula": "12345678",
  "full_name": "Juan Pérez",
  "email": "juan@mail.com",
  "username": "jperez",
  "password": "pass123"
}
```

**Validaciones:**
- Todos los campos obligatorios → 400 `{ "error": "Todos los campos son requeridos" }`.
- `cedula` única → 409 `{ "error": "Ya existe un usuario con esa cédula" }`.
- `username` único → 409 `{ "error": "El nombre de usuario ya está en uso" }`.

**Flujo:**
1. Validar campos.
2. Hashear `password` con bcrypt (cost 10).
3. Insertar en DB.
4. Ejecutar regla de desactivación de `admininicial`.
5. Retornar 201 con el usuario **sin** `password_hash`.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "cedula": "12345678",
    "full_name": "Juan Pérez",
    "email": "juan@mail.com",
    "username": "jperez",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

**Casos de prueba:** SP1-QA-03, SP1-QA-04

---

### GET /users/:id

Busca usuario por `cedula`. Nunca retorna `password_hash`.

**Response 200:** usuario sin `password_hash`.
**Response 404:** `{ "success": false, "data": null, "error": "Usuario no encontrado" }`

**Casos de prueba:** SP1-QA-05, SP1-QA-06

---

### GET /users/list

Retorna todos los usuarios (activos e inactivos). Nunca retorna `password_hash`.

**Response 200:** `{ "success": true, "data": [ ... ], "error": null }` — lista vacía `[]` si no hay usuarios.

**Casos de prueba:** SP5-QA-01

---

### PUT /users/update

**Request body:**
```json
{
  "cedula": "12345678",
  "full_name": "Juan Pérez Actualizado",
  "email": "juannuevo@mail.com",
  "username": "jperez2",
  "password": "newpass123"
}
```

**Validaciones:**
- Todos los campos obligatorios → 400.
- El usuario con esa `cedula` debe existir → 404.
- `cedula` no se puede cambiar (es el identificador).

**Flujo:**
1. Validar campos.
2. Buscar usuario por `cedula` → 404 si no existe.
3. Si `password` no está vacío, hashear con bcrypt.
4. Actualizar en DB.
5. Retornar 200 con usuario actualizado sin `password_hash`.

**Casos de prueba:** SP1-QA-07, SP1-QA-08

---

### DELETE /users/delete/:id

Elimina usuario por cédula.

**Validaciones:**
- El usuario debe existir → 404.
- No eliminar el usuario en sesión: comparar `:id` con header `X-User-Id` → 400 `{ "error": "No puedes eliminar tu propio usuario" }`.

**Response 204:** body vacío.

**Casos de prueba:** SP1-QA-09, SP1-QA-10

---

## Health check

```
GET /health → 200 { "success": true, "data": { "service": "user-service", "status": "ok" }, "error": null }
```

---

## Tests requeridos

| Nombre del test | Caso de prueba |
|---|---|
| `TestCreateUserSuccess` | SP1-QA-03 |
| `TestCreateUserMissingFields` | SP1-QA-04 |
| `TestGetUserFound` | SP1-QA-05 |
| `TestGetUserNotFound` | SP1-QA-06 |
| `TestUpdateUserSuccess` | SP1-QA-07 |
| `TestUpdateUserMissingFields` | SP1-QA-08 |
| `TestDeleteUserSuccess` | SP1-QA-09 |
| `TestDeleteUserNotFound` | SP1-QA-10 |
| `TestListUsers` | SP5-QA-01 |
| `TestSeedAdmininicial` | Verifica seed automático |
| `TestDeactivateAdmininicial` | Verifica desactivación tras crear usuario |