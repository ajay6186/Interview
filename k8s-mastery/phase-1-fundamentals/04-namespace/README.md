# Exercise 1.4 — Namespace

## What you'll learn
- Creating and using Namespaces for resource isolation
- `-n` flag and `--namespace` in kubectl
- Cross-namespace DNS: `service.namespace.svc.cluster.local`
- `kubectl config set-context` to switch default namespace

## Instructions
Complete `exercise/` so that:
1. `namespace.yaml` — creates two namespaces: `dev` and `prod`
2. `dev-deployment.yaml` — deploys nginx in the `dev` namespace
3. `prod-deployment.yaml` — deploys nginx in the `prod` namespace (2 replicas)

## Apply & Verify
```bash
vagrant ssh master

kubectl apply -f /vagrant/phase-1-fundamentals/04-namespace/exercise/
kubectl get namespaces
kubectl get pods -n dev
kubectl get pods -n prod

# Switch default namespace context
kubectl config set-context --current --namespace=dev
kubectl get pods   # now shows dev pods by default

# Cross-namespace DNS
kubectl run test -n dev --image=busybox --rm -it --restart=Never -- \
  wget -qO- http://nginx-svc.prod.svc.cluster.local

# Reset context
kubectl config set-context --current --namespace=default

# Cleanup
kubectl delete -f /vagrant/phase-1-fundamentals/04-namespace/exercise/
```

## Key concepts
- Namespaces provide scope for names — same resource name can exist in different namespaces
- `kube-system`, `kube-public`, `default` are built-in namespaces
- DNS format: `<service>.<namespace>.svc.cluster.local`
- ResourceQuotas and NetworkPolicies are namespace-scoped
