# catalog-service

CRUD de proveedores y carga masiva de productos desde CSV.

## Run

```bash
go run cmd/main.go
```

## Endpoints

### Health
- `GET /health`

### Suppliers
- `POST /suppliers/save`
- `GET /suppliers/list`
- `GET /suppliers/:id`
- `PUT /suppliers/update`
- `DELETE /suppliers/delete/:id`

### Products
- `POST /products/upload` (multipart/form-data, campo: `file`)
- `GET /products/list`
- `GET /products/:id`
