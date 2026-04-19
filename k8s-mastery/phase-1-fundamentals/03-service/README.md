# Exercise 1.3 — Service

## What you'll learn
- `ClusterIP`, `NodePort`, and `LoadBalancer` service types
- `selector` connects Service to Pods via labels
- `port` vs `targetPort` vs `nodePort`
- Service DNS within the cluster

## Instructions
Complete the files in `exercise/` so that:
1. `deployment.yaml` — Deployment with 2 nginx replicas, label `app: web`
2. `service-clusterip.yaml` — ClusterIP Service on port `80` → targetPort `80`
3. `service-nodeport.yaml` — NodePort Service, nodePort `30080`

## Apply & Verify
```bash
vagrant ssh master

kubectl apply -f /vagrant/phase-1-fundamentals/03-service/exercise/
kubectl get svc
kubectl get endpoints web-clusterip

# Test ClusterIP from inside cluster
kubectl run test --image=busybox --rm -it --restart=Never -- wget -qO- http://web-clusterip

# Test NodePort from host machine (worker1 IP)
curl http://192.168.56.11:30080

# Cleanup
kubectl delete -f /vagrant/phase-1-fundamentals/03-service/exercise/
```

## Key concepts
- `ClusterIP` — internal-only, reachable within the cluster
- `NodePort` — exposes on every node's IP at a static port (30000–32767)
- `LoadBalancer` — provisions a cloud LB (not available in bare-metal without MetalLB)
- Service selector must match Pod labels exactly
