# PRD — report-service
**Lenguaje:** TypeScript · **Puerto:** 3006 · **DB:** Ninguna

---

## Responsabilidad

Genera reportes agregando datos de otros servicios vía HTTP. No tiene base de datos propia.

---

## Stack

- Node.js 20
- Express 4 (`express`)
- HTTP client: `axios`
- Env vars: `dotenv`
- TypeScript 5
- Tests: Jest + ts-jest
- Process manager EC2: **pm2**

> No usa TypeORM ni ningún ORM. No hay DB ni entidades.

---

## Estructura de carpetas

```
src/
  domain/
    Report.ts           ← interfaces IUserReport, ICustomerReport, ISalesByCustomerReport
  handler/
    report.handler.ts
  routes/
    report.routes.ts
  middleware/
    internal.middleware.ts
  http/
    serviceClient.ts    ← wrapper de axios con X-Internal header
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
PORT=3006
USER_SERVICE_URL=http://localhost:3002
CUSTOMER_SERVICE_URL=http://localhost:3004
SALES_SERVICE_URL=http://localhost:3005
```

---

## Dependencias (package.json)

```json
{
  "dependencies": {
    "express": "^4.19.2",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0"
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

## HTTP client interno

Todos los calls a otros servicios incluyen `X-Internal: true`:

```typescript
// src/http/serviceClient.ts
import axios from 'axios'

export const serviceClient = axios.create({
  headers: { 'X-Internal': 'true' },
  timeout: 5000,
})
```

---

## Endpoints

### GET /users/list

Proxy directo a user-service.

**Flujo:**
1. Llamar `GET {USER_SERVICE_URL}/users/list` con `serviceClient`.
2. Retornar exactamente la respuesta de user-service.

**Response:** igual que user-service — `{ "success": true, "data": [...], "error": null }`

**Casos de prueba:** SP5-QA-01

---

### GET /customers/list

Proxy directo a customer-service.

**Flujo:**
1. Llamar `GET {CUSTOMER_SERVICE_URL}/customers/list` con `serviceClient`.
2. Retornar exactamente la respuesta de customer-service.

**Response:** igual que customer-service — `{ "success": true, "data": [...], "error": null }`

**Casos de prueba:** SP5-QA-02

---

### GET /reports/sales-by-customer

Genera el reporte de ventas totales por cliente.

**Flujo:**
1. Llamar `GET {CUSTOMER_SERVICE_URL}/customers/list` → obtener lista de todos los clientes.
2. Usar `Promise.all` para llamar en paralelo `GET {SALES_SERVICE_URL}/sales/by-customer/{cedula}` por cada cliente.
3. Filtrar: solo incluir clientes cuyo `total_purchases > 0`.
4. Combinar y retornar.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "customer_id": "11111111",
      "full_name": "María López",
      "total_purchases": 45000.00
    },
    {
      "customer_id": "22222222",
      "full_name": "Carlos Ruiz",
      "total_purchases": 12000.00
    }
  ],
  "error": null
}
```

`"data": []` si no hay clientes con ventas.

**Casos de prueba:** SP5-QA-03

---

## Health check

```
GET /health → 200 { "success": true, "data": { "service": "report-service", "status": "ok" }, "error": null }
```

---

## Tests requeridos (Jest)

Los tests mockean `serviceClient` (axios). No hacen llamadas HTTP reales.

| Nombre del test | Caso de prueba |
|---|---|
| `getUsersReport_withData` | SP5-QA-01 — retorna lista de usuarios |
| `getCustomersReport_withData` | SP5-QA-02 — retorna lista de clientes |
| `getSalesByCustomerReport_withData` | SP5-QA-03 — retorna reporte con totales correctos |
| `getSalesByCustomerReport_empty` | Retorna `[]` si no hay ventas |
| `getSalesByCustomerReport_parallel` | Verifica uso de Promise.all (todas las llamadas a sales-service ocurren en paralelo) |