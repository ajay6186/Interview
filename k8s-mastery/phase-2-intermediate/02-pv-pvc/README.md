# Exercise 2.2 — PersistentVolume & PersistentVolumeClaim

## What you'll learn
- `PersistentVolume` (PV) — cluster-level storage resource
- `PersistentVolumeClaim` (PVC) — namespace-level storage request
- `hostPath` volume type (for local clusters)
- Access modes: `ReadWriteOnce`, `ReadOnlyMany`, `ReadWriteMany`
- PV lifecycle: Available → Bound → Released

## Instructions
Complete `exercise/` so that:
1. `pv.yaml` — PersistentVolume `local-pv` with:
   - `hostPath: /data/pv001`
   - Storage: `1Gi`
   - Access mode: `ReadWriteOnce`
2. `pvc.yaml` — PVC `local-pvc` requesting `500Mi`
3. `deployment.yaml` — Pod that mounts the PVC at `/data`

## Apply & Verify
```bash
vagrant ssh master

# Create host directory on master node first
sudo mkdir -p /data/pv001

kubectl apply -f /vagrant/phase-2-intermediate/02-pv-pvc/exercise/
kubectl get pv
kubectl get pvc
# PVC should show STATUS=Bound

# Write data to persistent storage
kubectl exec -it $(kubectl get pod -l app=storage-app -o name | head -1) -- \
  sh -c "echo 'hello persistent world' > /data/test.txt"

# Delete pod and verify data survives
kubectl delete pod -l app=storage-app
kubectl exec -it $(kubectl get pod -l app=storage-app -o name | head -1) -- cat /data/test.txt

# Cleanup
kubectl delete -f /vagrant/phase-2-intermediate/02-pv-pvc/exercise/
```

## Key concepts
- PV is provisioned by an admin (or dynamically by a StorageClass)
- PVC is requested by an app — Kubernetes binds it to a matching PV
- `hostPath` ties data to a specific node — not suitable for production multi-node
- Use StorageClass + dynamic provisioning in real clusters
