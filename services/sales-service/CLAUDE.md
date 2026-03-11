# PRD — sales-service
**Lenguaje:** TypeScript · **Puerto:** 3005 · **DB:** db_sales

---

## Responsabilidad

Registro de ventas con cálculo de IVA, generación de código consecutivo (`V001`, `V002`, ...) e inserción atómica de venta + detalles.

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
    Sale.ts             ← interfaces ISale, ISaleDetail, ICreateSaleDTO
  entity/
    SaleEntity.ts       ← entidad TypeORM con relación a SaleDetailEntity
    SaleDetailEntity.ts
  handler/
    sale.handler.ts
  repository/
    sale.repository.ts
  routes/
    sale.routes.ts
  middleware/
    internal.middleware.ts
  database.ts
  index.ts
package.json
tsconfig.json
.env
.env.example
README.md
```

---

## Variables de entorno

```env
PORT=3005
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=db_sales
```

---

## Esquema de base de datos

```sql
CREATE DATABASE IF NOT EXISTS db_sales;
USE db_sales;

CREATE TABLE sales (
  sale_code      VARCHAR(20)    NOT NULL PRIMARY KEY,
  customer_id    VARCHAR(20)    NOT NULL,
  user_id        VARCHAR(20)    NOT NULL,
  total_sale     DECIMAL(10,2)  NOT NULL,
  total_vat      DECIMAL(10,2)  NOT NULL,
  total_with_vat DECIMAL(10,2)  NOT NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_details (
  id           INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_code    VARCHAR(20)    NOT NULL,
  product_code VARCHAR(20)    NOT NULL,
  product_name VARCHAR(100)   NOT NULL,
  quantity     INT            NOT NULL,
  unit_price   DECIMAL(10,2)  NOT NULL,
  vat_rate     DECIMAL(5,2)   NOT NULL,
  line_total   DECIMAL(10,2)  NOT NULL,
  line_vat     DECIMAL(10,2)  NOT NULL,
  FOREIGN KEY (sale_code) REFERENCES sales(sale_code)
);
```

---

## TypeORM — configuración del DataSource

```typescript
// src/database.ts
import { DataSource } from 'typeorm'
import { SaleEntity } from './entity/SaleEntity'
import { SaleDetailEntity } from './entity/SaleDetailEntity'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [SaleEntity, SaleDetailEntity],
  synchronize: true,
  logging: false,
})
```

---

## TypeORM — entidades

```typescript
// src/entity/SaleEntity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { SaleDetailEntity } from './SaleDetailEntity'

@Entity('sales')
export class SaleEntity {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  sale_code: string

  @Column({ type: 'varchar', length: 20 })
  customer_id: string

  @Column({ type: 'varchar', length: 20 })
  user_id: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_sale: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_vat: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_with_vat: number

  @CreateDateColumn()
  created_at: Date

  @OneToMany(() => SaleDetailEntity, (detail) => detail.sale, { cascade: true, eager: true })
  details: SaleDetailEntity[]
}
```

```typescript
// src/entity/SaleDetailEntity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { SaleEntity } from './SaleEntity'

@Entity('sale_details')
export class SaleDetailEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 20 })
  sale_code: string

  @Column({ type: 'varchar', length: 20 })
  product_code: string

  @Column({ type: 'varchar', length: 100 })
  product_name: string

  @Column({ type: 'int' })
  quantity: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  vat_rate: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  line_total: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  line_vat: number

  @ManyToOne(() => SaleEntity, (sale) => sale.details)
  @JoinColumn({ name: 'sale_code' })
  sale: SaleEntity
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

---

## Endpoints

### POST /sales/save

**Auth:** requiere header `X-User-Id` (inyectado por el gateway).

**Request body:**
```json
{
  "customer_id": "11111111",
  "details": [
    {
      "product_code": "1001",
      "product_name": "Manzanas Rojas",
      "quantity": 2,
      "unit_price": 4000,
      "vat_rate": 19
    },
    {
      "product_code": "1002",
      "product_name": "Plátanos",
      "quantity": 3,
      "unit_price": 3000,
      "vat_rate": 19
    }
  ]
}
```

**Validaciones:**
- `customer_id` obligatorio → 400 `{ "error": "El cliente es requerido" }`.
- `details` debe existir y tener entre 1 y 3 items → 400 `{ "error": "Debe incluir entre 1 y 3 productos" }`.
- Cada detalle: `product_code`, `product_name`, `quantity`, `unit_price`, `vat_rate` obligatorios → 400.

**Flujo:**
1. Validar campos.
2. Generar `sale_code`:
   - Buscar el MAX de `sale_code` en la tabla `sales`.
   - Extraer el número (ej: `"V003"` → `3`).
   - Si la tabla está vacía → iniciar en `1`.
   - Formatear: `"V" + número.toString().padStart(3, "0")` → `"V001"`.
3. Calcular por cada detalle:
   - `line_total = unit_price * quantity`
   - `line_vat = line_total * (vat_rate / 100)`
4. Calcular totales:
   - `total_sale = sum(line_total)`
   - `total_vat = sum(line_vat)`
   - `total_with_vat = total_sale + total_vat`
5. Obtener `user_id` del header `X-User-Id`.
6. Insertar `Sale` + todos los `SaleDetail` en una **transacción atómica** usando `AppDataSource.transaction(...)`. Si cualquier operación falla → rollback total → 500.
7. Retornar 201 con la venta completa.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "sale_code": "V001",
    "customer_id": "11111111",
    "user_id": "12345678",
    "total_sale": 17000.00,
    "total_vat": 3230.00,
    "total_with_vat": 20230.00,
    "created_at": "2024-01-01T00:00:00.000Z",
    "details": [
      {
        "product_code": "1001",
        "product_name": "Manzanas Rojas",
        "quantity": 2,
        "unit_price": 4000.00,
        "vat_rate": 19.00,
        "line_total": 8000.00,
        "line_vat": 1520.00
      },
      {
        "product_code": "1002",
        "product_name": "Plátanos",
        "quantity": 3,
        "unit_price": 3000.00,
        "vat_rate": 19.00,
        "line_total": 9000.00,
        "line_vat": 1710.00
      }
    ]
  },
  "error": null
}
```

**Casos de prueba:** SP4-QA-05, SP4-QA-06, SP4-QA-07, SP4-QA-08, SP4-QA-09, SP4-QA-10

---

### GET /sales/list

Retorna todas las ventas con sus detalles (relación eager). `"data": []` si no hay.

---

### GET /sales/by-customer/:customer_id

**Uso exclusivo:** llamado interno por report-service.
Retorna la suma total de compras de un cliente.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "customer_id": "11111111",
    "total_purchases": 45000.00,
    "sale_count": 3
  },
  "error": null
}
```

Si el cliente no tiene ventas: `total_purchases: 0`, `sale_count: 0`.

---

## Health check

```
GET /health → 200 { "success": true, "data": { "service": "sales-service", "status": "ok" }, "error": null }
```

---

## Tests requeridos (Jest)

| Nombre del test | Caso de prueba |
|---|---|
| `calculateLineTotal_correct` | SP4-QA-05 — `4000 * 3 = 12000`, `vat = 2280` |
| `calculateSaleTotal_correct` | SP4-QA-06 — suma de dos líneas |
| `generateSaleCode_consecutive` | SP4-QA-07 — V001 → V002 |
| `createSale_success` | SP4-QA-08 |
| `createSale_noProducts` | SP4-QA-09 — details vacío → 400 |
| `createSale_noCustomer` | SP4-QA-10 — sin customer_id → 400 |
| `getSalesByCustomer_withSales` | report interno con ventas |
| `getSalesByCustomer_noSales` | retorna 0 si no hay ventas |

Los tests mockean el repository TypeORM. No requieren conexión a DB real.