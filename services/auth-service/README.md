# auth-service

Servicio de autenticación. Valida credenciales contra user-service y emite JWT.

## Ejecutar

```bash
cp .env.example .env
go run cmd/main.go
```

## Endpoints

- `GET /health` — Health check
- `POST /login` — Autenticación (retorna JWT)
