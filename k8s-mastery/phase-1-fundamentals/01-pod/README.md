# Exercise 1.1 — Your First Pod

## What you'll learn
- `apiVersion` and `kind` fields
- Pod `metadata` — name and labels
- `spec.containers` — image, ports, env vars
- `kubectl apply`, `kubectl get`, `kubectl describe`, `kubectl logs`

## Instructions
Complete `exercise/pod.yaml` so that:
1. Creates a Pod named `nginx-pod` in the `default` namespace
2. Uses the `nginx:1.25` image
3. Exposes container port `80`
4. Has a label `app: nginx`

## Apply & Verify
```bash
vagrant ssh master

kubectl apply -f /vagrant/phase-1-fundamentals/01-pod/exercise/
kubectl get pods
kubectl describe pod nginx-pod
kubectl logs nginx-pod

# Cleanup
kubectl delete -f /vagrant/phase-1-fundamentals/01-pod/exercise/
```

## Expected output
```
NAME        READY   STATUS    RESTARTS   AGE
nginx-pod   1/1     Running   0          10s
```

## Key concepts
- A Pod is the smallest deployable unit in Kubernetes
- One Pod = one or more tightly coupled containers sharing network + storage
- Pods are ephemeral — use Deployments to manage them in production
- `kubectl describe` shows events, which is your first debugging tool
