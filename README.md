# tienda-generica-backend

| Servicio           | Lenguaje   | Puerto |
|--------------------|------------|--------|
| auth-service       | Go         | 8080   |
| user-service       | Go         | 8080   |
| catalog-service    | Go         | 8080   |
| customer-service   | TypeScript | 3000   |
| sales-service      | TypeScript | 3000   |
| report-service     | TypeScript | 3000   |

## Clonar solo un servicio en EC2

```bash
git clone --filter=blob:none --sparse https://github.com/org/tienda-generica-backend.git
cd tienda-generica-backend
git sparse-checkout set services/auth-service
```
