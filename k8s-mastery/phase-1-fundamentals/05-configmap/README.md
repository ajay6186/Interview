# Exercise 1.5 — ConfigMap

## What you'll learn
- Creating ConfigMaps from literals and files
- Injecting config as environment variables (`envFrom`, `env.valueFrom`)
- Mounting ConfigMap as a volume (config files inside the container)
- Updating config without rebuilding the image

## Instructions
Complete `exercise/` so that:
1. `configmap.yaml` — ConfigMap `app-config` with keys:
   - `APP_ENV=production`
   - `LOG_LEVEL=info`
   - `app.properties` — a multi-line file with `host=db` and `port=5432`
2. `deployment.yaml` — Deployment that:
   - Injects `APP_ENV` and `LOG_LEVEL` as env vars
   - Mounts `app.properties` at `/etc/config/app.properties`

## Apply & Verify
```bash
vagrant ssh master

kubectl apply -f /vagrant/phase-1-fundamentals/05-configmap/exercise/
kubectl get configmap app-config
kubectl describe configmap app-config

# Verify env vars
kubectl exec -it $(kubectl get pod -l app=myapp -o name | head -1) -- env | grep -E "APP_ENV|LOG_LEVEL"

# Verify mounted file
kubectl exec -it $(kubectl get pod -l app=myapp -o name | head -1) -- cat /etc/config/app.properties

# Cleanup
kubectl delete -f /vagrant/phase-1-fundamentals/05-configmap/exercise/
```

## Key concepts
- ConfigMaps store non-sensitive config data as key-value pairs
- `envFrom.configMapRef` injects all keys as env vars
- Volume mount is ideal for config files — updates propagate without pod restart (eventually)
- Never store secrets in ConfigMaps — use the Secret resource instead
