# Despliegue — Tienda Genérica Backend (Docker + Nginx)

Stack completo en **una sola EC2** usando Docker Compose. Nginx actúa como balanceador de carga frente a múltiples réplicas del `api-gateway`; el resto de los servicios quedan en una red interna Docker (`tienda-net`) y no se exponen al host.

---

## Arquitectura

```
Internet :80
      │
      ▼
  ┌─────────┐
  │  nginx  │  (container, único con puerto publicado)
  └────┬────┘
       │ upstream api_gateway
       ▼
  red interna: tienda-net
  ├── api-gateway       ×N  (8080)
  ├── auth-service      ×N  (3001)
  ├── user-service      ×N  (3002)  ─► db_users
  ├── catalog-service   ×N  (3003)  ─► db_catalog
  ├── customer-service  ×N  (3004)  ─► db_customers
  ├── sales-service     ×N  (3005)  ─► db_sales
  ├── report-service    ×N  (3006)
  └── mysql:8.0             (volumen mysql-data)
```

El balanceo interno (gateway → servicio) usa el DNS round-robin de Docker: al
resolver `http://sales-service:3005` la red entrega todas las IPs de las
réplicas y el cliente itera entre ellas.

---

## Requisitos en la EC2

- Amazon Linux 2023 (o Ubuntu 22+)
- Puerto 80 abierto en el Security Group
- 2 GB RAM mínimo (recomendado 4 GB con las réplicas)

### Instalar Docker + Compose (Amazon Linux 2023)

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# cerrar sesión y volver a entrar para aplicar el grupo

# Docker Compose v2 (plugin)
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

---

## Primer despliegue

```bash
git clone https://github.com/org/tienda-generica-backend.git
cd tienda-generica-backend

# 1. Configurar secretos
cp .env.example .env
nano .env   # poner DB_PASSWORD y JWT_SECRET fuertes

# 2. Construir y levantar (solo backend)
docker compose up -d --build

# 3. Verificar
docker compose ps
```

La primera vez MySQL ejecuta `deploy/mysql-init.sql` y crea los 4 schemas.

### Modos de ejecución

El nginx de este compose está detrás de un **profile** (`standalone`) para
no chocar con el edge nginx del repo `ComicSans-Frontend` cuando ambos
corren en la misma EC2.

```bash
# Full-stack: no arrancar el nginx del backend. El edge del frontend ocupa :80
# y proxea /api/ hacia api-gateway dentro de la red compartida tienda-net.
docker compose up -d --build

# Backend-only (dev): incluir el nginx del backend
docker compose --profile standalone up -d --build
curl http://localhost/healthz
curl http://localhost/api/health
```

---

## Escalar réplicas

El número por defecto son 2 réplicas por servicio (definido en
`docker-compose.yml` bajo `deploy.replicas`). Para cambiarlo en caliente:

```bash
docker compose up -d --scale sales-service=4 --scale api-gateway=3
```

Comprobar que el balanceo funciona:

```bash
# cada request debería alternar entre réplicas
for i in {1..10}; do curl -s http://localhost/api/sales/list | head -c 80; echo; done
docker compose logs --tail=5 sales-service
```

---

## Operación

| Tarea | Comando |
|---|---|
| Ver logs de un servicio | `docker compose logs -f sales-service` |
| Reiniciar un servicio | `docker compose restart sales-service` |
| Reconstruir tras cambios | `docker compose up -d --build <servicio>` |
| Bajar todo | `docker compose down` |
| Bajar + borrar datos MySQL | `docker compose down -v` (⚠ destructivo) |
| Entrar al contenedor MySQL | `docker compose exec mysql mysql -uroot -p` |

---

## Variables de entorno (`.env` en la raíz)

```env
DB_PASSWORD=<password fuerte para MySQL root>
JWT_SECRET=<secreto HS256, mínimo 32 chars>
```

Todas las demás variables (puertos, URLs internas) están hardcodeadas en el
`docker-compose.yml` porque apuntan a nombres DNS de la red Docker, no cambian
entre entornos.

---

## Troubleshooting

- **`unhealthy` en `docker compose ps`** → `docker compose logs <servicio>`.
  Los servicios TS esperan a MySQL; si tarda mucho aumentar `start_period` del
  healthcheck del servicio.
- **502 Bad Gateway desde nginx** → todas las réplicas del gateway están caídas
  o marcadas `max_fails`. Ver `docker compose logs api-gateway`.
- **MySQL no arranca** → probablemente `mysql-data` quedó en mal estado:
  `docker compose down -v` (⚠ borra datos) y volver a levantar.
