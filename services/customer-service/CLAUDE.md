# PRD — customer-service
**Lenguaje:** TypeScript · **Puerto:** 3004 · **DB:** db_customers

---

## Responsabilidad

CRUD completo de clientes de la tienda.

---

## Stack

- Node.js 20
- Express 4 (`express`)
- TypeORM 0.3 (`typeorm` + `mysql2`)
- Env vars: `dotenv`
- TypeScript 5
- Tests: Jest + ts-jest
- Process manager EC2: **pm2**

---

## Estructura de carpetas

```
src/
  domain/
    Customer.ts         ← interfaz ICustomer
  entity/
    CustomerEntity.ts   ← entidad TypeORM con decoradores
  handler/
    customer.handler.ts
  repository/
    customer.repository.ts
  routes/
    customer.routes.ts
  middleware/
    internal.middleware.ts  ← valida X-Internal header
  database.ts             ← inicialización del DataSource
  index.ts                ← bootstrap Express
package.json
tsconfig.json
.env
.env.example
README.md
```

---

## Variables de entorno

```env
PORT=3004
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=db_customers
```

---

## Esquema de base de datos

```sql
CREATE DATABASE IF NOT EXISTS db_customers;
USE db_customers;

CREATE TABLE customers (
  cedula     VARCHAR(20)  NOT NULL PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  address    VARCHAR(200) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  email      VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## TypeORM — configuración del DataSource

```typescript
// src/database.ts
import { DataSource } from 'typeorm'
import { CustomerEntity } from './entity/CustomerEntity'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [CustomerEntity],
  synchronize: true,   // crea/actualiza tablas automáticamente al arrancar
  logging: false,
})
```

---

## TypeORM — entidad Customer

```typescript
// src/entity/CustomerEntity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('customers')
export class CustomerEntity {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  cedula: string

  @Column({ type: 'varchar', length: 100 })
  full_name: string

  @Column({ type: 'varchar', length: 200 })
  address: string

  @Column({ type: 'varchar', length: 20 })
  phone: string

  @Column({ type: 'varchar', length: 100 })
  email: string

  @CreateDateColumn()
  created_at: Date
}
```

---

## Dependencias (package.json)

```json
{
  "dependencies": {
    "express": "^4.19.2",
    "typeorm": "^0.3.20",
    "mysql2": "^3.9.0",
    "dotenv": "^16.4.0",
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "ts-node": "^10.9.2",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

**Importante:** importar `reflect-metadata` al inicio de `src/index.ts`:
```typescript
import 'reflect-metadata'
```

---

## Endpoints

### POST /customers/save

**Request body:**
```json
{
  "cedula": "11111111",
  "full_name": "María López",
  "address": "Calle 1 #2-3",
  "phone": "3001234567",
  "email": "maria@mail.com"
}
```

**Validaciones:**
- Todos los campos obligatorios → 400 `{ "success": false, "data": null, "error": "Todos los campos son requeridos" }`.
- `cedula` única → 409 `{ "error": "Ya existe un cliente con esa cédula" }`.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "cedula": "11111111",
    "full_name": "María López",
    "address": "Calle 1 #2-3",
    "phone": "3001234567",
    "email": "maria@mail.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "error": null
}
```

**Casos de prueba:** SP2-QA-01, SP2-QA-02

---

### GET /customers/:id

Busca cliente por cédula.

**Response 200:** cliente.
**Response 404:** `{ "success": false, "data": null, "error": "Cliente no encontrado" }`

**Casos de prueba:** SP2-QA-03, SP2-QA-04, SP4-QA-01, SP4-QA-02

---

### GET /customers/list

Retorna todos los clientes. `"data": []` si no hay.

**Casos de prueba:** SP5-QA-02

---

### PUT /customers/update

**Request body:**
```json
{
  "cedula": "11111111",
  "full_name": "María López Actualizada",
  "address": "Nueva dirección",
  "phone": "3109876543",
  "email": "marianew@mail.com"
}
```

**Validaciones:**
- Todos los campos obligatorios → 400.
- Cliente debe existir → 404.
- `cedula` no se puede cambiar.

**Response 200:** cliente actualizado.

**Casos de prueba:** SP2-QA-05, SP2-QA-06

---

### DELETE /customers/delete/:id

**Validaciones:** cliente debe existir → 404.
**Response 204.**

**Casos de prueba:** SP2-QA-07, SP2-QA-08

---

## Middleware — validación X-Internal

Todos los endpoints aplican este middleware:

```typescript
// src/middleware/internal.middleware.ts
import { Request, Response, NextFunction } from 'express'

export function requireInternal(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-internal'] !== 'true') {
    return res.status(401).json({ success: false, data: null, error: 'Acceso no autorizado' })
  }
  next()
}
```

---

## Health check

```
GET /health → 200 { "success": true, "data": { "service": "customer-service", "status": "ok" }, "error": null }
```

---

## Tests requeridos (Jest)

| Nombre del test | Caso de prueba |
|---|---|
| `createCustomer_success` | SP2-QA-01 |
| `createCustomer_missingFields` | SP2-QA-02 |
| `getCustomer_found` | SP2-QA-03 / SP4-QA-01 |
| `getCustomer_notFound` | SP2-QA-04 / SP4-QA-02 |
| `updateCustomer_success` | SP2-QA-05 |
| `updateCustomer_missingFields` | SP2-QA-06 |
| `deleteCustomer_success` | SP2-QA-07 |
| `deleteCustomer_notFound` | SP2-QA-08 |
| `listCustomers_withData` | SP5-QA-02 |

Los tests mockean el repository TypeORM. No requieren conexión a DB real.