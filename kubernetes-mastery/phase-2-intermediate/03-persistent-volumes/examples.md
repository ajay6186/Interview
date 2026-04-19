# Examples 2.3 — Persistent Volumes (50 examples)

---

## BASIC

### 1. PersistentVolume (static provisioning)
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:
    path: /data/my-pv    # dev only
```

### 2. PersistentVolumeClaim
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: manual
  resources:
    requests:
      storage: 5Gi
```

### 3. Mount PVC in pod
```yaml
spec:
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-pvc
  containers:
  - name: app
    image: nginx:alpine
    volumeMounts:
    - name: data
      mountPath: /data
```

### 4. Access modes
```
ReadWriteOnce  (RWO)  — one node can read and write
ReadOnlyMany   (ROX)  — multiple nodes read only
ReadWriteMany  (RWX)  — multiple nodes read and write
ReadWriteOncePod (RWOP) — one pod only (k8s 1.22+)
```

### 5. Reclaim policies
```
Retain   — PV kept after PVC deleted, manual cleanup needed
Delete   — PV and underlying storage deleted with PVC
Recycle  — deprecated (was: rm -rf /data/*)
```

### 6. List PVs and PVCs
```bash
kubectl get pv
kubectl get pvc
kubectl describe pv my-pv
kubectl describe pvc my-pvc
```

### 7. PVC status
```
Pending   — not yet bound to a PV
Bound     — bound to a PV, ready to use
Lost      — bound PV no longer exists
```

### 8. emptyDir volume (ephemeral, not persistent)
```yaml
volumes:
- name: scratch
  emptyDir: {}           # deleted when pod is deleted
- name: memory-scratch
  emptyDir:
    medium: Memory       # tmpfs (in-RAM, fast, counts against memory limit)
    sizeLimit: 256Mi
```

### 9. hostPath volume (dev only)
```yaml
volumes:
- name: host-data
  hostPath:
    path: /var/data
    type: DirectoryOrCreate    # creates if not exists
# types: Directory, File, Socket, CharDevice, BlockDevice, DirectoryOrCreate, FileOrCreate
```

### 10. StorageClass
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/gce-pd    # or ebs.csi.aws.com, etc.
parameters:
  type: pd-ssd
reclaimPolicy: Delete
allowVolumeExpansion: true
```

### 11. Dynamic provisioning with StorageClass
```yaml
# PVC — no PV needed, StorageClass provisions automatically
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  storageClassName: fast-ssd
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

### 12. Default StorageClass
```bash
kubectl get storageclass
# NAME                 PROVISIONER            DEFAULT
# standard (default)   kubernetes.io/gce-pd   yes

# Set default:
kubectl patch storageclass standard \
  -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

### 13. Delete PVC
```bash
kubectl delete pvc my-pvc
# PV behavior depends on reclaim policy (Retain vs Delete)
```

### 14. Check PV/PVC binding
```bash
kubectl get pv -o custom-columns=\
  NAME:.metadata.name,CAPACITY:.spec.capacity.storage,\
  STATUS:.status.phase,CLAIM:.spec.claimRef.name
```

### 15. tmpfs volume
```yaml
volumes:
- name: tmp
  emptyDir:
    medium: Memory
    sizeLimit: 128Mi
containers:
- name: app
  volumeMounts:
  - name: tmp
    mountPath: /tmp
```

---

## INTERMEDIATE

### 16. StatefulSet volumeClaimTemplates
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: my-db
spec:
  serviceName: my-db
  replicas: 3
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
  template:
    spec:
      containers:
      - name: db
        image: postgres:16-alpine
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
```

### 17. Volume expansion (online)
```yaml
# StorageClass must have allowVolumeExpansion: true
# Resize PVC:
spec:
  resources:
    requests:
      storage: 50Gi    # increase from 20Gi
```
```bash
kubectl patch pvc my-pvc -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
kubectl get pvc my-pvc    # Status: FileSystemResizePending → Bound
```

### 18. Volume binding mode: WaitForFirstConsumer
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
# PV not bound until pod is scheduled — ensures same zone
```

### 19. Local PersistentVolume
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /mnt/disks/ssd1
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values: ["node-1"]
```

### 20. NFS volume
```yaml
spec:
  volumes:
  - name: nfs-data
    nfs:
      server: nfs-server.example.com
      path: /exported/path
  containers:
  - name: app
    volumeMounts:
    - name: nfs-data
      mountPath: /data
```

### 21. ConfigMap as volume
```yaml
spec:
  volumes:
  - name: config
    configMap:
      name: my-config
      defaultMode: 0644
  containers:
  - name: app
    volumeMounts:
    - name: config
      mountPath: /etc/config
```

### 22. PVC clone
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc-clone
spec:
  dataSource:
    name: my-pvc         # source PVC
    kind: PersistentVolumeClaim
    apiGroup: ""
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

### 23. Volume snapshot
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: my-snapshot
spec:
  volumeSnapshotClassName: csi-hostpath-snapclass
  source:
    persistentVolumeClaimName: my-pvc
```

### 24. Restore PVC from snapshot
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-from-snapshot
spec:
  dataSource:
    name: my-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 25. Pre-populated PVC (dataSourceRef)
```yaml
spec:
  dataSourceRef:
    apiGroup: ""
    kind: PersistentVolumeClaim
    name: source-pvc
```

### 26. Volume mode: Block
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: block-pvc
spec:
  volumeMode: Block    # raw block device (default: Filesystem)
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 27. ReclaimPolicy: Retain — manual cleanup
```bash
# After PVC is deleted, PV stays in Released state
kubectl get pv
# NAME     STATUS    CLAIM
# my-pv    Released  default/my-pvc

# To reuse: remove claimRef
kubectl patch pv my-pv -p '{"spec":{"claimRef":null}}'
```

### 28. fsGroup for volume ownership
```yaml
spec:
  securityContext:
    fsGroup: 2000    # all files in mounted volumes owned by GID 2000
    fsGroupChangePolicy: OnRootMismatch   # faster than Always
```

### 29. Read-only volume mount
```yaml
containers:
- name: app
  volumeMounts:
  - name: config
    mountPath: /etc/config
    readOnly: true    # container cannot write to this volume
```

### 30. AWS EBS CSI driver PVC
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ebs-pvc
spec:
  storageClassName: gp3    # AWS gp3 via EBS CSI
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

---

## NESTED

### 31. StatefulSet with multiple volume claims
```yaml
spec:
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      storageClassName: fast-ssd
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 50Gi
  - metadata:
      name: logs
    spec:
      storageClassName: standard
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 10Gi
  template:
    spec:
      containers:
      - name: db
        image: postgres:16
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
        - name: logs
          mountPath: /var/log/postgresql
```

### 32. Backup job using shared PVC
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          volumes:
          - name: db-data
            persistentVolumeClaim:
              claimName: db-pvc
              readOnly: true
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          containers:
          - name: backup
            image: postgres:16
            command: ["/bin/sh", "-c"]
            args: ["pg_basebackup -D /backup/$(date +%Y%m%d)"]
            volumeMounts:
            - name: db-data
              mountPath: /data
              readOnly: true
            - name: backup-storage
              mountPath: /backup
```

### 33. NFS ReadWriteMany for shared upload storage
```yaml
# PVC with RWX for shared file access across replicas
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uploads-pvc
spec:
  accessModes:
  - ReadWriteMany    # multiple pods can read+write
  storageClassName: nfs-storage
  resources:
    requests:
      storage: 100Gi
---
# Deployment mounts same PVC across all replicas
spec:
  replicas: 5
  template:
    spec:
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: uploads-pvc
```

### 34. StorageClass with topology awareness (zone)
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: zone-aware
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
allowedTopologies:
- matchLabelExpressions:
  - key: topology.kubernetes.io/zone
    values:
    - us-east-1a
    - us-east-1b
```

### 35. Volume health monitoring
```bash
# CSI volume health (k8s 1.21+)
kubectl describe pvc my-pvc | grep -A5 Conditions
# AbnormalVolumeArrangement condition if issues

# Monitor with events:
kubectl get events --field-selector reason=FailedMount
```

### 36. Velero backup of PVCs
```bash
# Backup namespace with PVCs
velero backup create my-backup \
  --include-namespaces my-namespace \
  --snapshot-volumes

# Restore
velero restore create --from-backup my-backup \
  --include-namespaces my-namespace
```

### 37. Projected volume: configmap + secret + PVC data
```yaml
# You can't project PVCs, but initContainers can copy:
initContainers:
- name: copy-config
  image: busybox
  command: ["sh", "-c", "cp /pvc-data/* /config/"]
  volumeMounts:
  - name: source-pvc
    mountPath: /pvc-data
  - name: config-vol
    mountPath: /config
```

### 38. StorageClass parameters for Ceph/Rook
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: rook-ceph-block
provisioner: rook-ceph.rbd.csi.ceph.com
parameters:
  clusterID: my-cluster
  pool: replicapool
  imageFormat: "2"
  imageFeatures: layering
  csi.storage.k8s.io/provisioner-secret-name: rook-csi-rbd-provisioner
  csi.storage.k8s.io/provisioner-secret-namespace: rook-ceph
reclaimPolicy: Delete
allowVolumeExpansion: true
```

### 39. Multi-attach prevention with RWOP
```yaml
# ReadWriteOncePod — only ONE pod can use this volume at a time
# Prevents split-brain in stateful apps
spec:
  accessModes:
  - ReadWriteOncePod
  resources:
    requests:
      storage: 10Gi
```

### 40. PVC with dataSource for pre-seeded database
```yaml
# First create snapshot of seeded DB:
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: seeded-db-snapshot
spec:
  source:
    persistentVolumeClaimName: seeded-db-pvc
---
# New PVC pre-populated with seed data:
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-db-pvc
spec:
  dataSource:
    name: seeded-db-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 10Gi
```

---

## ADVANCED

### 41. Volume attribution and quota
```yaml
# Per-StorageClass quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-quota
  namespace: my-namespace
spec:
  hard:
    persistentvolumeclaims: "10"
    requests.storage: "100Gi"
    fast-ssd.storageclass.storage.k8s.io/requests.storage: "50Gi"
    fast-ssd.storageclass.storage.k8s.io/persistentvolumeclaims: "5"
```

### 42. Online volume migration (CSI migration)
```bash
# In-tree plugin → CSI driver migration (transparent):
# kubernetes.io/aws-ebs → ebs.csi.aws.com
# kubernetes.io/gce-pd  → pd.csi.storage.gke.io
# Enabled by feature gate: CSIMigration (GA in 1.25)
kubectl get sc -o jsonpath='{.items[*].provisioner}'
```

### 43. Volume population controller pattern
```yaml
# Custom VolumePopulator (k8s 1.22+ alpha)
# Allows populating PVCs from arbitrary data sources
# e.g., download dataset from S3 on PVC creation
apiVersion: populator.storage.k8s.io/v1beta1
kind: VolumePopulator
metadata:
  name: s3-populator
sourceKind:
  group: datapopulator.example.com
  version: v1alpha1
  kind: S3Dataset
```

### 44. Encrypted volumes (AWS EBS CMK)
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: encrypted-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:us-east-1:123456789:key/abc-123"
```

### 45. Volume cross-zone awareness
```bash
# PV bound to zone-specific storage — pod must schedule in same zone
# Use WaitForFirstConsumer to ensure co-location
# Check PV zone affinity:
kubectl get pv my-pv -o jsonpath='{.spec.nodeAffinity}'
# Shows: topology.kubernetes.io/zone=us-east-1a
```

### 46. Performance tier auto-tiering
```yaml
# Multiple StorageClasses for different performance tiers
# Application uses appropriate class based on workload:
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ultra-fast    # NVMe for hot data
provisioner: ebs.csi.aws.com
parameters:
  type: io2
  iops: "10000"
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard      # HDD for cold data
provisioner: ebs.csi.aws.com
parameters:
  type: sc1
```

### 47. StatefulSet PVC retention policy
```yaml
spec:
  persistentVolumeClaimRetentionPolicy:
    whenDeleted: Delete      # delete PVCs when StatefulSet deleted
    whenScaled: Retain       # keep PVCs when scaled down
```

### 48. Volume IOPS and throughput configuration
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-fast
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "6000"
  throughput: "500"    # MB/s
```

### 49. CSI node topology spread
```bash
# Verify CSI topology labels on nodes:
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}: {.metadata.labels.topology\.ebs\.csi\.aws\.com/zone}{"\n"}{end}'

# StorageClass uses topology for zone-aware provisioning:
allowedTopologies:
- matchLabelExpressions:
  - key: topology.ebs.csi.aws.com/zone
    values: [us-east-1a, us-east-1b]
```

### 50. Full storage architecture checklist
```
Provisioning:
✓ Use dynamic provisioning with StorageClass (not static PVs)
✓ WaitForFirstConsumer binding mode for topology-aware provisioning
✓ allowVolumeExpansion: true for growth without recreation

Performance:
✓ Match storage class to workload (NVMe for DB, HDD for archives)
✓ Request appropriate IOPS/throughput in StorageClass parameters
✓ Use local PVs for latency-sensitive workloads

Data protection:
✓ Regular VolumeSnapshots (CronJob)
✓ Velero backups for full namespace backup
✓ Retention policy: Retain for important data

Security:
✓ Encrypted StorageClass (KMS/CMEK)
✓ fsGroup for volume ownership
✓ readOnly mounts where writes are not needed
✓ RBAC restricting PVC creation to necessary namespaces
```
