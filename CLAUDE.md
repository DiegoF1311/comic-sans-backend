# PRD — Tienda Genérica · General
**Versión:** 1.0 · Ciclo 3 MinTIC · Universidad El Bosque

---

## 1. Contexto y objetivo

Sistema backend para una tienda genérica que gestiona usuarios, proveedores, productos, clientes, ventas y reportes. Arquitectura de microservicios con un API Gateway central. Este documento define las convenciones globales compartidas por todos los servicios.

---

## 2. Arquitectura general

```
                        ┌─────────────────────────────────────────┐
                        │            EC2 — api-gateway             │
  React Frontend  ──►   │  Go · Puerto 8080 · Valida JWT           │
                        │  Agrega X-User-Id header                 │
                        └──────────────────┬──────────────────────┘
                                           │ HTTP interno
              ┌────────────────────────────┼───────────────────────────┐
              │            │               │              │             │
              ▼            ▼               ▼              ▼             ▼
        auth-service  user-service   catalog-service  customer-service sales-service
        Go · 3001     Go · 3002      Go · 3003        TS · 3004        TS · 3005
        (sin DB)      db_users       db_catalog        db_customers     db_sales
                           ▲               ▲                            │
                           │               │                            │
                      report-service (TS · 3006) ◄───────────── HTTP calls
                      (sin DB)
```

### Tabla de servicios

| Servicio | Lenguaje | Puerto | DB | Responsabilidad |
|---|---|---|---|---|
| api-gateway | Go | 8080 | — | Punto de entrada, validación JWT, routing |
| auth-service | Go | 3001 | — | Login, generación de token |
| user-service | Go | 3002 | db_users | CRUD usuarios |
| catalog-service | Go | 3003 | db_catalog | CRUD proveedores, carga CSV productos |
| customer-service | TypeScript | 3004 | db_customers | CRUD clientes |
| sales-service | TypeScript | 3005 | db_sales | Registro de ventas, cálculo de IVA |
| report-service | TypeScript | 3006 | — | Reportes agregados vía HTTP |

---

## 3. Stack tecnológico

### Servicios Go
- **Runtime:** Go 1.22
- **Framework HTTP:** Gin (`github.com/gin-gonic/gin`)
- **ORM:** GORM (`gorm.io/gorm` + `gorm.io/driver/mysql`)
- **JWT:** `github.com/golang-jwt/jwt/v5`
- **Env vars:** `github.com/joho/godotenv`
- **Password hashing:** `golang.org/x/crypto/bcrypt`
- **Process manager en EC2:** systemd

### Servicios TypeScript
- **Runtime:** Node.js 20
- **Framework HTTP:** Express 4 (`express`)
- **ORM:** TypeORM 0.3 (`typeorm` + `mysql2`)
- **JWT verify:** `jsonwebtoken`
- **Env vars:** `dotenv`
- **CSV parsing (solo catalog):** `csv-parse` + `multer`
- **HTTP client (solo report):** `axios`
- **Process manager en EC2:** pm2

### Base de datos
- MySQL 8.0 (una instancia RDS)
- Un schema por servicio: `db_users`, `db_catalog`, `db_customers`, `db_sales`

---

## 4. Convenciones globales

### 4.1 Formato de respuesta HTTP

Todos los servicios responden con esta estructura sin excepción:

```json
// Éxito con dato u objeto
{ "success": true, "data": { ... }, "error": null }

// Éxito con lista
{ "success": true, "data": [ ... ], "error": null }

// Éxito sin contenido (DELETE → 204)
{ "success": true, "data": null, "error": null }

// Error
{ "success": false, "data": null, "error": "Mensaje descriptivo" }
```

### 4.2 Códigos HTTP

| Situación | Código |
|---|---|
| Lectura exitosa | 200 OK |
| Creación exitosa | 201 Created |
| Eliminación exitosa | 204 No Content |
| Campos faltantes o inválidos | 400 Bad Request |
| Sin autenticación o token inválido | 401 Unauthorized |
| Recurso no encontrado | 404 Not Found |
| Recurso ya existe (duplicado) | 409 Conflict |
| Error interno del servidor | 500 Internal Server Error |

### 4.3 Headers internos (gateway → servicios)

El API Gateway agrega estos headers a cada request antes de reenviarlo:

| Header | Valor |
|---|---|
| `X-User-Id` | cédula del usuario autenticado |
| `X-Username` | username del usuario autenticado |
| `X-Internal` | `"true"` |

Los servicios internos **no validan JWT**. Si un request llega sin `X-Internal: true`, rechazarlo con 401.
Todos los calls inter-servicio (service → service) también incluyen `X-Internal: true`.

### 4.4 Payload del JWT

```json
{
  "user_id": "12345678",
  "username": "jperez",
  "iat": 1700000000,
  "exp": 1700086400
}
```

Expiración: **24 horas** desde la emisión. Algoritmo: HS256.

### 4.5 Variables de entorno estándar

```env
PORT=xxxx
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=db_xxxx
JWT_SECRET=changeme_use_strong_secret_in_prod

# Solo en servicios que llaman a otros
USER_SERVICE_URL=http://localhost:3002
CUSTOMER_SERVICE_URL=http://localhost:3004
SALES_SERVICE_URL=http://localhost:3005
```

---

## 5. Arquitectura interna (Clean Architecture sin casos de uso)

```
Handler → Repository → Domain
```

- **Domain:** structs / interfaces / tipos. Sin lógica de negocio.
- **Repository:** toda interacción con la DB. Recibe y retorna tipos del dominio.
- **Handler:** recibe el HTTP request, llama al repository, construye la respuesta.
- **No existe capa de use cases / services.**

### Estructura Go

```
cmd/main.go
internal/
  domain/       ← structs
  handler/      ← funciones HTTP
  repository/   ← GORM queries
  middleware/   ← solo gateway: JWT validation
config/config.go
.env
.env.example
go.mod
README.md
```

### Estructura TypeScript

```
src/
  domain/       ← interfaces y tipos TypeScript
  entity/       ← entidades TypeORM (decoradores)
  handler/      ← Express route handlers
  repository/   ← TypeORM queries
  routes/       ← definición de rutas Express
  middleware/   ← headers, validación X-Internal
  database.ts   ← inicialización del DataSource TypeORM
  index.ts      ← bootstrap Express
package.json
tsconfig.json
.env
.env.example
README.md
```

---

## 6. Mapa de comunicación entre servicios

```
Frontend
  └─► api-gateway (8080)
        ├─► auth-service (3001)
        │     └─► user-service (3002)  [GET /users/by-username/:username]
        ├─► user-service (3002)
        ├─► catalog-service (3003)
        ├─► customer-service (3004)
        ├─► sales-service (3005)
        └─► report-service (3006)
              ├─► user-service (3002)     [GET /users/list]
              ├─► customer-service (3004) [GET /customers/list]
              └─► sales-service (3005)    [GET /sales/by-customer/:id] ← en paralelo con Promise.all
```

---

## 7. Despliegue en EC2 vanilla (sin Docker)

### 7.1 Servicios Go

```bash
# 1. Instalar Go
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# 2. Clonar solo el servicio
git clone --filter=blob:none --sparse https://github.com/org/tienda-generica-backend.git
cd tienda-generica-backend
git sparse-checkout set services/<nombre>-service

# 3. Compilar
cd services/<nombre>-service
go build -o server .

# 4. Configurar .env
cp .env.example .env
# Editar con valores reales

# 5. Crear unit de systemd
sudo nano /etc/systemd/system/<nombre>-service.service
```

Contenido del archivo `.service`:
```ini
[Unit]
Description=<nombre>-service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/tienda-generica-backend/services/<nombre>-service
ExecStart=/home/ec2-user/tienda-generica-backend/services/<nombre>-service/server
Restart=on-failure
RestartSec=5
EnvironmentFile=/home/ec2-user/tienda-generica-backend/services/<nombre>-service/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable <nombre>-service
sudo systemctl start <nombre>-service
sudo systemctl status <nombre>-service
```

### 7.2 Servicios TypeScript

```bash
# 1. Instalar Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 2. Instalar pm2 globalmente
sudo npm install -g pm2

# 3. Clonar solo el servicio
git clone --filter=blob:none --sparse https://github.com/org/tienda-generica-backend.git
cd tienda-generica-backend
git sparse-checkout set services/<nombre>-service

# 4. Instalar dependencias y compilar
cd services/<nombre>-service
npm install
npm run build

# 5. Configurar .env
cp .env.example .env
# Editar con valores reales

# 6. Levantar con pm2
pm2 start dist/index.js --name <nombre>-service
pm2 save
pm2 startup  # seguir las instrucciones que imprime
```