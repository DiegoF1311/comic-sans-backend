# Despliegue en Kubernetes (k3s)

Manifests para correr todo el stack Comic-Sans sobre **k3s** en una sola EC2.

## Prerrequisitos

- Cluster k3s funcionando (`kubectl get nodes` → `Ready`).
- Las imágenes `comic-sans-backend-*` y `comicsans-frontend-*` importadas al containerd de k3s. Verificar con:
  ```bash
  sudo k3s ctr images list -q | grep -E 'comic-sans|comicsans'
  ```

## Aplicar

```bash
kubectl apply -f k8s/
```

Los archivos están numerados para que `kubectl apply -f` los procese en orden (namespace → secrets → MySQL → servicios → frontends → ingress).

## Verificar

```bash
kubectl get pods -n comic-sans -w           # esperar a que todos estén Running
kubectl get all -n comic-sans
kubectl get ingress -n comic-sans
```

Acceso desde navegador: `http://<EC2_PUBLIC_IP>/` (POS), `/admin/` (Admin), `/api/health` (gateway).

## Demos rápidas

**Auto-healing:**
```bash
kubectl delete pod -n comic-sans -l app=sales-service --grace-period=0
kubectl get pods -n comic-sans -w
```

**Escalar:**
```bash
kubectl scale deployment/sales-service -n comic-sans --replicas=5
kubectl get pods -n comic-sans -l app=sales-service
```

**Logs agregados de N réplicas:**
```bash
kubectl logs -n comic-sans -l app=api-gateway --tail=50 -f --max-log-requests=10
```

## Limpiar

```bash
kubectl delete namespace comic-sans
```

Esto borra todos los recursos del namespace, incluyendo el PVC de MySQL.
