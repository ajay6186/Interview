# Exercise 1.5 — Services

## What you'll learn
- ClusterIP: cluster-internal stable IP and DNS name
- NodePort: accessible from outside the cluster via `<node-ip>:<nodePort>`
- LoadBalancer: cloud provider creates an external load balancer
- How selector routes traffic to pods

## Instructions
Complete `exercise/manifest.yaml` with three Service types.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get services

# Test ClusterIP (from inside cluster):
kubectl run test --image=busybox --rm -it -- wget -O- nginx-clusterip

# Test NodePort (from your machine):
# minikube: minikube service nginx-nodeport --url
# kind: requires port-forward or extra setup
kubectl port-forward service/nginx-nodeport 8080:80
curl http://localhost:8080

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- ClusterIP: default, only reachable inside cluster
- NodePort: opens a port (30000–32767) on EVERY node, reachable externally
- LoadBalancer: extends NodePort + provisions a cloud LB (needs cloud provider)
- Service DNS: `<name>.<namespace>.svc.cluster.local`
- `targetPort` = port on the Pod; `port` = port on the Service
