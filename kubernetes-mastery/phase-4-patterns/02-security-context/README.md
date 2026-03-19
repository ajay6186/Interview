# Exercise 4.2 — Security Context

## What you'll learn
- `securityContext` at pod and container level
- Run as non-root user (`runAsUser`, `runAsGroup`)
- Read-only root filesystem (`readOnlyRootFilesystem`)
- Drop Linux capabilities (`capabilities.drop`)
- `allowPrivilegeEscalation: false`

## Instructions
Complete `exercise/manifest.yaml` with a hardened security context.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Confirm running as non-root:
kubectl exec pod/secure-pod -- id
# Expected: uid=1000 gid=3000

# Confirm read-only filesystem:
kubectl exec pod/secure-pod -- sh -c "touch /test.txt"
# Expected: Read-only file system error

# Writing to /tmp should succeed (tmpfs):
kubectl exec pod/secure-pod -- sh -c "echo test > /tmp/test.txt && cat /tmp/test.txt"

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Pod-level `securityContext` applies to ALL containers
- Container-level `securityContext` overrides the pod-level settings
- `readOnlyRootFilesystem`: prevents writing to container image layers
- `capabilities.drop: [ALL]`: remove all Linux capabilities
- `runAsNonRoot: true`: K8s refuses to start if container runs as root
