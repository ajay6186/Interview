# Exercise 2.1 — ConfigMaps

## What you'll learn
- Storing configuration as key/value pairs in a ConfigMap
- Consuming ConfigMap as environment variables (single key and all keys)
- Mounting ConfigMap as files via a volume

## Instructions
Complete `exercise/manifest.yaml` — create a ConfigMap and use it two ways.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get configmap app-config
kubectl describe configmap app-config

# Check env vars injected into the pod:
kubectl exec deploy/app -- printenv APP_COLOR
kubectl exec deploy/app -- printenv APP_MODE

# Check file mount:
kubectl exec deploy/app -- cat /etc/config/app.properties

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `data:` stores plain text key-value pairs
- `binaryData:` stores base64-encoded binary data
- Three consumption methods:
  1. `env[].valueFrom.configMapKeyRef` — single key as env var
  2. `envFrom[].configMapRef` — all keys as env vars
  3. `volumes` + `volumeMounts` — keys as files on disk
- Updating ConfigMap doesn't auto-restart pods (use `kubectl rollout restart`)
