# PRD — catalog-service
**Lenguaje:** Go · **Puerto:** 3003 · **DB:** db_catalog

---

## Responsabilidad

CRUD de proveedores y carga masiva de productos desde archivos CSV.

---

## Stack

- Go 1.22
- Gin (`github.com/gin-gonic/gin`)
- GORM (`gorm.io/gorm` + `gorm.io/driver/mysql`)
- Env vars: `github.com/joho/godotenv`
- CSV: `encoding/csv` (stdlib)
- Multipart: Gin built-in (`c.FormFile`)
- Process manager EC2: **systemd**

---

## Estructura de carpetas

```
cmd/main.go
internal/
  domain/
    supplier.go
    product.go
  handler/
    supplier_handler.go
    product_handler.go
  repository/
    supplier_repository.go
    product_repository.go
config/config.go
.env
.env.example
go.mod
README.md
```

---

## Variables de entorno

```env
PORT=3003
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=db_catalog
```

---

## Esquema de base de datos

```sql
CREATE DATABASE IF NOT EXISTS db_catalog;
USE db_catalog;

CREATE TABLE suppliers (
  nit           VARCHAR(20)  NOT NULL PRIMARY KEY,
  supplier_name VARCHAR(100) NOT NULL,
  address       VARCHAR(200) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  city          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  product_code   VARCHAR(20)    NOT NULL PRIMARY KEY,
  product_name   VARCHAR(100)   NOT NULL,
  nit_supplier   VARCHAR(20)    NOT NULL,
  purchase_price DECIMAL(10,2)  NOT NULL,
  purchase_vat   DECIMAL(5,2)   NOT NULL,
  sale_price     DECIMAL(10,2)  NOT NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nit_supplier) REFERENCES suppliers(nit)
);
```

Usar **GORM AutoMigrate** al arrancar.

---

## Endpoints — Suppliers

### POST /suppliers/save

**Request body:**
```json
{
  "nit": "900123456",
  "supplier_name": "Frutas S.A.",
  "address": "Carrera 10 #5-20",
  "phone": "6012345678",
  "city": "Bogotá"
}
```

**Validaciones:**
- Todos los campos obligatorios → 400 `{ "error": "Todos los campos son requeridos" }`.
- NIT único → 409 `{ "error": "Ya existe un proveedor con ese NIT" }`.

**Response 201:** proveedor creado.

**Casos de prueba:** SP2-QA-09, SP2-QA-10

---

### GET /suppliers/:id

Busca proveedor por NIT.

**Response 200:** proveedor.
**Response 404:** `{ "error": "Proveedor no encontrado" }`

**Casos de prueba:** SP2-QA-11, SP2-QA-12

---

### GET /suppliers/list

Retorna todos los proveedores. `"data": []` si no hay.

---

### PUT /suppliers/update

**Request body:**
```json
{
  "nit": "900123456",
  "supplier_name": "Frutas S.A. Actualizado",
  "address": "Nueva dirección",
  "phone": "6019999999",
  "city": "Medellín"
}
```

**Validaciones:** todos los campos obligatorios → 400. Proveedor debe existir → 404.

**Casos de prueba:** SP2-QA-13, SP2-QA-14

---

### DELETE /suppliers/delete/:id

**Validaciones:** proveedor debe existir → 404.
**Response 204.**

**Casos de prueba:** SP2-QA-15, SP2-QA-16

---

## Endpoints — Products

### POST /products/upload

Carga masiva de productos desde archivo CSV.
`Content-Type: multipart/form-data` · campo del archivo: `file`

**Validaciones previas:**
- Sin archivo → 400 `{ "error": "Debe seleccionar un archivo" }`.
- Extensión diferente a `.csv` → 400 `{ "error": "El archivo debe ser formato CSV" }`.
- CSV sin header o con columnas distintas a las 6 esperadas → 400 `{ "error": "Formato de CSV inválido" }`.

**Estructura esperada del CSV (con header):**
```
product_code,product_name,nit_supplier,purchase_price,purchase_vat,sale_price
1001,Manzanas Rojas,900123456,2500,19,4000
1002,Plátanos,900123456,1800,19,3000
```

**Flujo por cada fila:**
1. Verificar que `nit_supplier` exista en tabla `suppliers`.
2. Si no existe → marcar como rechazada, continuar con la siguiente fila (no detener el proceso).
3. Si `product_code` ya existe en la tabla → **UPDATE**.
4. Si no existe → **INSERT**.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "inserted": 15,
    "updated": 2,
    "rejected": 1,
    "rejected_rows": [
      { "row": 4, "product_code": "1004", "reason": "nit_supplier 000000001 no existe" }
    ]
  },
  "error": null
}
```

**Casos de prueba:** SP3-QA-01, SP3-QA-02, SP3-QA-03, SP3-QA-04

---

### GET /products/:id

Busca producto por `product_code`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "product_code": "1001",
    "product_name": "Manzanas Rojas",
    "nit_supplier": "900123456",
    "purchase_price": 2500.00,
    "purchase_vat": 19.00,
    "sale_price": 4000.00,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "error": null
}
```

**Response 404:** `{ "error": "Producto no encontrado" }`

**Casos de prueba:** SP4-QA-03, SP4-QA-04

---

### GET /products/list

Retorna todos los productos. `"data": []` si no hay.

---

## Health check

```
GET /health → 200 { "success": true, "data": { "service": "catalog-service", "status": "ok" }, "error": null }
```

---

## Tests requeridos

| Nombre del test | Caso de prueba |
|---|---|
| `TestCreateSupplierSuccess` | SP2-QA-09 |
| `TestCreateSupplierMissingFields` | SP2-QA-10 |
| `TestGetSupplierFound` | SP2-QA-11 |
| `TestGetSupplierNotFound` | SP2-QA-12 |
| `TestUpdateSupplierSuccess` | SP2-QA-13 |
| `TestUpdateSupplierMissingFields` | SP2-QA-14 |
| `TestDeleteSupplierSuccess` | SP2-QA-15 |
| `TestDeleteSupplierNotFound` | SP2-QA-16 |
| `TestCSVUploadSuccess` | SP3-QA-01 |
| `TestCSVUploadNoFile` | SP3-QA-02 |
| `TestCSVUploadInvalidFormat` | SP3-QA-03 |
| `TestCSVUploadInvalidNIT` | SP3-QA-04 |
| `TestGetProductFound` | SP4-QA-03 |
| `TestGetProductNotFound` | SP4-QA-04 |