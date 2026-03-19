# Exercise 2.4 — Resource Requests and Limits

## What you'll learn
- `requests`: minimum resources guaranteed for scheduling
- `limits`: maximum resources the container can use
- CPU: measured in millicores (1000m = 1 CPU core)
- Memory: measured in bytes (Mi = mebibytes, Gi = gibibytes)
- LimitRange: sets defaults for a namespace

## Instructions
Complete `exercise/manifest.yaml` with resource requests and limits.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

kubectl describe pod resource-pod
# Look at: Requests and Limits sections

# See node resource usage:
kubectl top node   # requires metrics-server
kubectl top pod    # requires metrics-server

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- **Requests**: used for scheduling (pod placed on node with enough free resources)
- **Limits**: enforced at runtime (OOMKilled if memory exceeded, CPU throttled)
- `requests == limits` = Guaranteed QoS (most predictable)
- `requests < limits` = Burstable QoS
- No requests/limits = BestEffort QoS (first evicted under pressure)
- Rule of thumb: set limits ~2x requests for most apps
