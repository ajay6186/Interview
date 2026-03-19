# Exercise 2.5 — Health Probes

## What you'll learn
- `livenessProbe`: is the container alive? Restart it if not.
- `readinessProbe`: is the container ready to serve traffic? Remove from Service if not.
- `startupProbe`: give slow-starting apps time to initialize before liveness kicks in
- Probe types: HTTP, TCP, exec command

## Instructions
Complete `exercise/manifest.yaml` with all three probe types.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get pods
# Watch probes in action:
kubectl describe pod probe-pod
# Look for: Liveness, Readiness, Startup sections

# Trigger a liveness failure (simulate crash):
kubectl exec probe-pod -- sh -c "rm /tmp/healthy"
# Wait ~30s — pod should restart
kubectl get pods  # RESTARTS counter should increment

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `livenessProbe` failure → container is **restarted**
- `readinessProbe` failure → pod is **removed from Service endpoints** (no traffic)
- `startupProbe` → liveness/readiness are paused until startup succeeds
- `initialDelaySeconds`: wait before first probe (grace period for app startup)
- `periodSeconds`: how often to probe
- `failureThreshold`: how many consecutive failures before action
