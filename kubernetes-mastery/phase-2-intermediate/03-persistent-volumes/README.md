# Exercise 2.3 — Persistent Volumes

## What you'll learn
- PersistentVolume (PV): cluster-wide storage resource
- PersistentVolumeClaim (PVC): request for storage by a pod
- StorageClass: dynamic provisioning
- Access modes: ReadWriteOnce, ReadOnlyMany, ReadWriteMany

## Instructions
Complete `exercise/manifest.yaml` with PV, PVC, and a Pod using the PVC.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

kubectl get pv
kubectl get pvc
# STATUS should show: Bound

kubectl exec pod/pv-pod -- sh -c "echo hello > /data/test.txt"
kubectl exec pod/pv-pod -- cat /data/test.txt

# Delete pod and recreate — data should persist:
kubectl delete pod pv-pod
kubectl apply -f exercise/manifest.yaml
kubectl exec pod/pv-pod -- cat /data/test.txt
# Should still show: hello

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- PV is provisioned by an admin (or dynamically by StorageClass)
- PVC is requested by a developer/pod
- Binding: K8s matches a PVC to a PV with compatible size and access mode
- `hostPath` PV stores data on the node — only for local/dev clusters
- Production: use cloud StorageClass (EBS, GCE PD, Azure Disk) for dynamic PVs
