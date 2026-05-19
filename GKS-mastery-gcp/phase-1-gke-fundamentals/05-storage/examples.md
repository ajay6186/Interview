# GKE Storage — Examples

## Basic

### 1. Default StorageClass in GKE
GKE provides a default StorageClass backed by Persistent Disk (pd-standard).

```bash
# View available StorageClasses
kubectl get storageclass
kubectl describe storageclass standard-rwo
```

---

### 2. Create a PersistentVolumeClaim (PVC)
Request storage from the default StorageClass.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

---

### 3. Mount a PVC in a Pod
Use a PVC as a volume in a Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-storage
spec:
  containers:
    - name: app
      image: nginx:1.25
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: my-pvc
```

---

### 4. Delete a PVC
Remove a PVC — behavior depends on the StorageClass reclaimPolicy.

```bash
kubectl delete pvc my-pvc

# Check if PV was also deleted or retained
kubectl get pv
```

---

### 5. List PVs and PVCs
Inspect the state of persistent storage in the cluster.

```bash
kubectl get pvc                        # all PVCs in current namespace
kubectl get pvc -A                     # all namespaces
kubectl get pv                         # all PVs (cluster-scoped)
kubectl describe pvc my-pvc
```

---

### 6. SSD StorageClass (pd-ssd)
Create a StorageClass backed by SSD Persistent Disk for higher IOPS.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

---

### 7. Balanced Persistent Disk StorageClass
Use `pd-balanced` for a cost-performance balance (between pd-standard and pd-ssd).

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: balanced
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-balanced
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

---

### 8. emptyDir Volume (Ephemeral)
Use `emptyDir` for temporary shared storage between containers in a Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-pod
spec:
  containers:
    - name: writer
      image: busybox:1.36
      command: ["sh", "-c", "echo data > /scratch/file; sleep 3600"]
      volumeMounts:
        - name: scratch
          mountPath: /scratch
    - name: reader
      image: busybox:1.36
      command: ["sh", "-c", "cat /scratch/file; sleep 3600"]
      volumeMounts:
        - name: scratch
          mountPath: /scratch
  volumes:
    - name: scratch
      emptyDir: {}
```

---

### 9. ConfigMap as Volume
Mount a ConfigMap as files in a container.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.properties: |
    log.level=info
    db.pool.size=10
  nginx.conf: |
    server { listen 80; }
---
apiVersion: v1
kind: Pod
metadata:
  name: config-volume-pod
spec:
  containers:
    - name: app
      image: nginx:1.25
      volumeMounts:
        - name: config
          mountPath: /etc/app
          readOnly: true
  volumes:
    - name: config
      configMap:
        name: app-config
```

---

### 10. Secret as Volume
Mount a Kubernetes Secret as files for sensitive configuration.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-cert
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
---
apiVersion: v1
kind: Pod
metadata:
  name: tls-pod
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      volumeMounts:
        - name: tls
          mountPath: /etc/nginx/tls
          readOnly: true
  volumes:
    - name: tls
      secret:
        secretName: tls-cert
```

---

### 11. Resize a PVC (Volume Expansion)
Expand a PVC to a larger size (requires `allowVolumeExpansion: true` in StorageClass).

```bash
kubectl patch pvc my-pvc -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'
kubectl get pvc my-pvc   # status shows resize in progress
```

---

### 12. StatefulSet with VolumeClaimTemplate
Each StatefulSet replica gets its own PVC automatically.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          env:
            - name: MYSQL_ROOT_PASSWORD
              value: "changeme"
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: ssd
        resources:
          requests:
            storage: 50Gi
```

---

### 13. hostPath Volume (Node-Local)
Mount a directory from the node's filesystem (not portable).

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh", "-c", "ls /node-logs; sleep 3600"]
      volumeMounts:
        - name: logs
          mountPath: /node-logs
  volumes:
    - name: logs
      hostPath:
        path: /var/log
        type: Directory
```

---

### 14. Check Storage Provisioning Events
Debug PVC binding issues by checking events.

```bash
kubectl describe pvc my-pvc
kubectl get events --field-selector involvedObject.name=my-pvc
kubectl get pvc my-pvc -o jsonpath='{.status.phase}'
```

---

### 15. Manual PersistentVolume (Static Provisioning)
Pre-create a PV and bind it to a PVC manually.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: static-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: ""
  csi:
    driver: pd.csi.storage.gke.io
    volumeHandle: projects/my-project/zones/us-central1-a/disks/my-disk
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: static-pvc
spec:
  storageClassName: ""
  volumeName: static-pv
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
```

---

## Intermediate

### 16. Regional Persistent Disk StorageClass
Use a regional PD for data replicated across two zones.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: regional-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
  replication-type: regional-pd
  zones: us-central1-a,us-central1-b
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

---

### 17. VolumeSnapshot — Create a Disk Snapshot
Take a point-in-time snapshot of a PVC.

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: pd-snapshot-class
driver: pd.csi.storage.gke.io
deletionPolicy: Delete
---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: my-pvc-snapshot
spec:
  volumeSnapshotClassName: pd-snapshot-class
  source:
    persistentVolumeClaimName: my-pvc
```

---

### 18. Restore PVC from Snapshot
Create a new PVC pre-populated with snapshot data.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-pvc
spec:
  storageClassName: ssd
  dataSource:
    name: my-pvc-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

---

### 19. GCS Fuse CSI Driver — Mount GCS Bucket
Mount a Google Cloud Storage bucket directly as a volume.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gcs-fuse-pod
spec:
  serviceAccountName: gcs-reader-sa
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: gcs-bucket
          mountPath: /data
  volumes:
    - name: gcs-bucket
      csi:
        driver: gcsfuse.csi.storage.gke.io
        readOnly: false
        volumeAttributes:
          bucketName: my-data-bucket
          mountOptions: "implicit-dirs"
```

---

### 20. Filestore (NFS) for ReadWriteMany
Use GCP Filestore (managed NFS) for shared storage across multiple Pods.

```bash
# Create Filestore instance
gcloud filestore instances create my-nfs \
  --zone us-central1-a \
  --tier BASIC_HDD \
  --file-share name=data,capacity=1TB \
  --network name=default
```

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: filestore-pv
spec:
  capacity:
    storage: 1Ti
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: filestore
  nfs:
    server: 10.X.X.X   # Filestore instance IP
    path: /data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: filestore-pvc
spec:
  storageClassName: filestore
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Ti
```

---

### 21. Filestore CSI Driver StorageClass
Dynamically provision Filestore instances via the CSI driver.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: filestore-sc
provisioner: filestore.csi.storage.gke.io
parameters:
  tier: BASIC_SSD
  network: default
reclaimPolicy: Delete
volumeBindingMode: Immediate
allowVolumeExpansion: true
```

---

### 22. PVC with Retain Policy (Disaster Recovery)
Keep the underlying disk when the PVC is deleted.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: retain-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
reclaimPolicy: Retain   # disk survives PVC deletion
allowVolumeExpansion: true
```

---

### 23. Volume Access Modes
Understand GKE volume access modes for different use cases.

```yaml
# ReadWriteOnce (RWO) — one node at a time (Persistent Disk)
# ReadWriteMany (RWX) — many nodes simultaneously (Filestore/GCS FUSE)
# ReadOnlyMany (ROX) — many nodes read-only

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: rwx-pvc
spec:
  storageClassName: filestore-sc
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
```

---

### 24. Volume Mount with SubPath
Mount a specific sub-directory of a volume instead of the root.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: subpath-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: data
          mountPath: /data/app1
          subPath: app1     # only mounts volume/app1 directory
        - name: data
          mountPath: /data/app2
          subPath: app2
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: shared-pvc
```

---

### 25. Ephemeral Volume (Generic)
Create a temporary PVC-backed volume that lives only as long as the Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ephemeral-vol-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: scratch
          mountPath: /scratch
  volumes:
    - name: scratch
      ephemeral:
        volumeClaimTemplate:
          spec:
            accessModes: ["ReadWriteOnce"]
            storageClassName: ssd
            resources:
              requests:
                storage: 5Gi
```

---

### 26. tmpfs (Memory-backed emptyDir)
Use a memory-backed volume for high-performance ephemeral storage.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: tmpfs-pod
spec:
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: mem-vol
          mountPath: /dev/shm
  volumes:
    - name: mem-vol
      emptyDir:
        medium: Memory
        sizeLimit: 1Gi
```

---

### 27. Backup PVC to GCS with CronJob
Schedule periodic backups of PVC data to a GCS bucket.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pvc-backup
spec:
  schedule: "0 1 * * *"   # 1am daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-sa
          containers:
            - name: backup
              image: google/cloud-sdk:slim
              command:
                - sh
                - -c
                - gsutil -m rsync -r /data gs://my-backup-bucket/$(date +%Y-%m-%d)/
              volumeMounts:
                - name: data
                  mountPath: /data
                  readOnly: true
          volumes:
            - name: data
              persistentVolumeClaim:
                claimName: app-data-pvc
                readOnly: true
          restartPolicy: OnFailure
```

---

### 28. Storage Resource Quota
Limit the total storage requests in a namespace.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-quota
  namespace: team-a
spec:
  hard:
    requests.storage: "500Gi"
    persistentvolumeclaims: "20"
    ssd.storageclass.storage.k8s.io/requests.storage: "200Gi"
    ssd.storageclass.storage.k8s.io/persistentvolumeclaims: "10"
```

---

### 29. Pre-Populate a Volume with an Init Container
Seed a PVC with initial data before the main container starts.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: seeded-pod
spec:
  initContainers:
    - name: data-seeder
      image: google/cloud-sdk:slim
      command:
        - sh
        - -c
        - gsutil -m cp -r gs://my-seed-data/* /data/
      volumeMounts:
        - name: data
          mountPath: /data
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: data
          mountPath: /data
          readOnly: true
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: app-data-pvc
```

---

### 30. Volume Mount with ReadOnly Flag
Mount a shared PVC as read-only for consumers.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readonly-vol-pod
spec:
  containers:
    - name: reader
      image: busybox:1.36
      volumeMounts:
        - name: shared-data
          mountPath: /data
          readOnly: true    # container cannot write to the volume
  volumes:
    - name: shared-data
      persistentVolumeClaim:
        claimName: shared-pvc
        readOnly: true
```

---

## Nested

### 31. KCC — ComputeDisk Resource
Create and manage a Persistent Disk via Config Connector.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeDisk
metadata:
  name: app-data-disk
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  type: pd-ssd
  size: 100
  description: "Application data disk"
```

---

### 32. KCC — StorageBucket for GCS FUSE Backing
Declare a GCS bucket via KCC and use it as a GCS FUSE volume.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: app-data-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
    - action:
        type: Delete
      condition:
        age: 90
```

---

### 33. Filestore with KCC IAM Binding
Create a Filestore instance and grant access via KCC.

```yaml
apiVersion: file.cnrm.cloud.google.com/v1beta1
kind: FilestoreInstance
metadata:
  name: shared-nfs
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  tier: BASIC_SSD
  fileShares:
    - capacityGb: 2660
      name: data
  networks:
    - network: default
      modes:
        - MODE_IPV4
```

---

### 34. StatefulSet with Regional PD for Zone-Resilient Storage
Use regional persistent disks so StatefulSet data survives zone failures.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: regional-pd-wait
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
  replication-type: regional-pd
  zones: us-central1-a,us-central1-b
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: regional-db
spec:
  serviceName: regional-db
  replicas: 2
  selector:
    matchLabels:
      app: regional-db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        storageClassName: regional-pd-wait
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
  template:
    metadata:
      labels:
        app: regional-db
    spec:
      containers:
        - name: db
          image: postgres:15
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
```

---

### 35. VolumeSnapshot — Scheduled Snapshots via CronJob
Automatically create disk snapshots on a schedule.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: snapshot-job
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: snapshot-creator-sa
          containers:
            - name: snap
              image: bitnami/kubectl:latest
              command:
                - sh
                - -c
                - |
                  kubectl apply -f - <<EOF
                  apiVersion: snapshot.storage.k8s.io/v1
                  kind: VolumeSnapshot
                  metadata:
                    name: db-snap-$(date +%Y%m%d%H%M)
                  spec:
                    volumeSnapshotClassName: pd-snapshot-class
                    source:
                      persistentVolumeClaimName: db-data-pvc
                  EOF
          restartPolicy: OnFailure
```

---

### 36. GCS FUSE with Workload Identity for Secure Access
Mount a GCS bucket securely without explicit credentials.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gcs-accessor
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: gcs-accessor@my-project.iam.gserviceaccount.com
---
apiVersion: v1
kind: Pod
metadata:
  name: gcs-fuse-wi-pod
  annotations:
    gke-gcsfuse/volumes: "true"
spec:
  serviceAccountName: gcs-accessor
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: gcs-data
          mountPath: /data
  volumes:
    - name: gcs-data
      csi:
        driver: gcsfuse.csi.storage.gke.io
        volumeAttributes:
          bucketName: my-secure-bucket
          mountOptions: "implicit-dirs,uid=1000,gid=1000"
```

---

### 37. Multi-Volume Pod — PVC + GCS FUSE + ConfigMap
Mount multiple volume types simultaneously in one Pod.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-vol-pod
spec:
  serviceAccountName: app-sa
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: persistent-data
          mountPath: /persistent
        - name: gcs-archive
          mountPath: /archive
        - name: config
          mountPath: /etc/app
          readOnly: true
        - name: secrets
          mountPath: /run/secrets
          readOnly: true
  volumes:
    - name: persistent-data
      persistentVolumeClaim:
        claimName: app-pvc
    - name: gcs-archive
      csi:
        driver: gcsfuse.csi.storage.gke.io
        volumeAttributes:
          bucketName: archive-bucket
    - name: config
      configMap:
        name: app-config
    - name: secrets
      secret:
        secretName: app-secrets
```

---

### 38. VolumePopulator — Restore from GCS
Populate a new PVC directly from a GCS object.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-pvc
spec:
  storageClassName: ssd
  dataSourceRef:
    apiGroup: populator.storage.k8s.io
    kind: VolumePopulator
    name: gcs-restore
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

---

### 39. Extreme Persistent Disk StorageClass
Use `pd-extreme` for the highest IOPS (e.g., large databases).

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: extreme-pd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-extreme
  provisioned-iops-on-create: "15000"
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

---

### 40. Dynamic Provisioning with Topology Awareness
Provision disks in the same zone as the Pod using WaitForFirstConsumer.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: zone-aware-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer   # wait until pod is scheduled
allowVolumeExpansion: true
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zone-aware-pvc
spec:
  storageClassName: zone-aware-ssd
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
# PVC stays unbound until a Pod is scheduled, then disk is provisioned in pod's zone
```

---

## Advanced

### 41. KCC — ComputeDisk with KMS Encryption
Create an encrypted Persistent Disk via Config Connector.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeDisk
metadata:
  name: encrypted-disk
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  type: pd-ssd
  size: 500
  diskEncryptionKey:
    kmsKeyRef:
      name: disk-encryption-key
```

---

### 42. Cross-Region Disk Replication via Snapshots
Replicate data to another region by copying snapshots.

```bash
# Create snapshot in source region
gcloud compute snapshots create db-backup \
  --source-disk my-db-disk \
  --source-disk-zone us-central1-a \
  --storage-location us-east1

# Create disk from snapshot in target region
gcloud compute disks create db-replica \
  --source-snapshot db-backup \
  --zone us-east1-a \
  --type pd-ssd \
  --size 100GB
```

---

### 43. Storage Performance Tuning with Block Volume Mode
Use raw block device mode for databases requiring direct disk access.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: block-pvc
spec:
  storageClassName: extreme-pd
  volumeMode: Block    # raw block device, not filesystem
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Ti
---
apiVersion: v1
kind: Pod
metadata:
  name: block-vol-pod
spec:
  containers:
    - name: db
      image: mydb:1.0
      volumeDevices:          # use volumeDevices for block mode
        - name: raw-data
          devicePath: /dev/xvda
  volumes:
    - name: raw-data
      persistentVolumeClaim:
        claimName: block-pvc
```

---

### 44. Disaster Recovery — PVC Migration Between Clusters
Move persistent data from one cluster to another.

```bash
# Step 1: Create snapshot from source PVC
kubectl apply -f - <<EOF
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: migration-snapshot
spec:
  volumeSnapshotClassName: pd-snapshot-class
  source:
    persistentVolumeClaimName: source-pvc
EOF

# Step 2: Get snapshot handle
SNAPSHOT_HANDLE=$(kubectl get volumesnapshot migration-snapshot \
  -o jsonpath='{.status.snapshotHandle}')

# Step 3: Pre-create PV in target cluster using snapshot handle
# Step 4: Apply the PV manifest in the target cluster
```

---

### 45. Storage Class with Custom FSType and MountOptions
Fine-tune filesystem behavior for performance workloads.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tuned-ext4
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
  csi.storage.k8s.io/fstype: ext4
mountOptions:
  - noatime        # skip access time updates
  - nodiratime     # skip directory access time
  - data=writeback # better write performance (less metadata consistency)
reclaimPolicy: Retain
allowVolumeExpansion: true
```

---

### 46. StatefulSet with Ordered, Graceful Scaling and Storage
Configure precise StatefulSet storage and scaling behavior.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: production-db
spec:
  serviceName: production-db
  replicas: 3
  podManagementPolicy: OrderedReady   # scale one at a time
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0   # update all pods
  selector:
    matchLabels:
      app: production-db
  template:
    metadata:
      labels:
        app: production-db
    spec:
      terminationGracePeriodSeconds: 120
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: production-db
      containers:
        - name: db
          image: postgres:15
          resources:
            requests:
              cpu: "2"
              memory: "8Gi"
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
            - name: wal
              mountPath: /var/lib/postgresql/wal
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        storageClassName: extreme-pd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 500Gi
    - metadata:
        name: wal
      spec:
        storageClassName: ssd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
```

---

### 47. GCS FUSE Sidecar Pattern for ML Model Loading
Load large ML models from GCS at startup without baking them into images.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-inference
  template:
    metadata:
      labels:
        app: ml-inference
      annotations:
        gke-gcsfuse/volumes: "true"
        gke-gcsfuse/memory-limit: "2Gi"
        gke-gcsfuse/cpu-limit: "500m"
    spec:
      serviceAccountName: ml-sa
      containers:
        - name: inference-server
          image: ml-server:1.0
          env:
            - name: MODEL_PATH
              value: /models/my-model
          volumeMounts:
            - name: models
              mountPath: /models
              readOnly: true
      volumes:
        - name: models
          csi:
            driver: gcsfuse.csi.storage.gke.io
            readOnly: true
            volumeAttributes:
              bucketName: ml-models-bucket
              mountOptions: "file-cache:enable-parallel-downloads:true"
```

---

### 48. KCC — Manage Filestore with IAM via Config Connector
Declare Filestore instance and access controls as Kubernetes resources.

```yaml
apiVersion: file.cnrm.cloud.google.com/v1beta1
kind: FilestoreInstance
metadata:
  name: production-nfs
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  tier: ENTERPRISE
  fileShares:
    - capacityGb: 10240
      name: shared
      nfsExportOptions:
        - ipRanges:
            - "10.0.0.0/8"
          accessMode: READ_WRITE
          squashMode: ROOT_SQUASH
  networks:
    - network: production-vpc
      modes:
        - MODE_IPV4
      connectMode: PRIVATE_SERVICE_ACCESS
```

---

### 49. Storage Monitoring — PVC Usage Alerting
Set up alerts when PVC usage exceeds a threshold.

```yaml
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  name: pvc-usage-alert
spec:
  displayName: "GKE PVC Usage High"
  conditions:
    - displayName: "PVC Usage > 80%"
      conditionThreshold:
        filter: >
          resource.type = "k8s_container"
          AND metric.type = "kubernetes.io/container/ephemeral_storage/used_bytes"
        comparison: COMPARISON_GT
        thresholdValue: 858993459   # ~80% of 1Gi
        duration: 300s
  alertStrategy:
    notificationRateLimit:
      period: 3600s
  notificationChannels:
    - projects/my-project/notificationChannels/1234567890
```

---

### 50. Full Production Storage Architecture
Complete storage setup for a stateful production application.

```yaml
# StorageClasses
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: prod-ssd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-ssd
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: prod-extreme
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-extreme
  provisioned-iops-on-create: "20000"
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
---
# VolumeSnapshotClass for backups
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: prod-snapshot-class
  annotations:
    snapshot.storage.kubernetes.io/is-default-class: "true"
driver: pd.csi.storage.gke.io
deletionPolicy: Retain
---
# Storage quota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-storage-quota
  namespace: production
spec:
  hard:
    requests.storage: "10Ti"
    persistentvolumeclaims: "50"
    prod-ssd.storageclass.storage.k8s.io/requests.storage: "5Ti"
    prod-extreme.storageclass.storage.k8s.io/requests.storage: "2Ti"
---
# Daily snapshot CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-db-snapshot
  namespace: production
spec:
  schedule: "0 2 * * *"
  successfulJobsHistoryLimit: 7
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: snapshot-sa
          containers:
            - name: snapshot-creator
              image: bitnami/kubectl:latest
              command:
                - sh
                - -c
                - |
                  DATE=$(date +%Y%m%d)
                  kubectl apply -f - <<EOF
                  apiVersion: snapshot.storage.k8s.io/v1
                  kind: VolumeSnapshot
                  metadata:
                    name: db-snapshot-${DATE}
                    namespace: production
                  spec:
                    volumeSnapshotClassName: prod-snapshot-class
                    source:
                      persistentVolumeClaimName: db-data-pvc
                  EOF
          restartPolicy: OnFailure


---

## Expert

### 51. Cloud Storage FUSE CSI — Mount GCS Bucket as Volume
Access a GCS bucket from a pod as a POSIX filesystem using the GCS FUSE CSI driver.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gcs-fuse-pod
  annotations:
    gke-gcsfuse/volumes: "true"
spec:
  serviceAccountName: gcs-fuse-ksa
  containers:
  - name: app
    image: gcr.io/my-gcp-project/app:latest
    volumeMounts:
    - name: gcs-bucket
      mountPath: /data
  volumes:
  - name: gcs-bucket
    csi:
      driver: gcsfuse.csi.storage.gke.io
      readOnly: false
      volumeAttributes:
        bucketName: my-data-bucket
        mountOptions: "implicit-dirs"
```

---

### 52. Cloud Storage FUSE — Ephemeral Inline Volume
Mount a GCS bucket ephemerally without creating a PersistentVolume.

```yaml
volumes:
- name: gcs-ephemeral
  csi:
    driver: gcsfuse.csi.storage.gke.io
    volumeAttributes:
      bucketName: my-ephemeral-bucket
      mountOptions: "implicit-dirs,file-cache:enable-parallel-downloads:true"
```

---

### 53. Filestore CSI — Create PV for NFS Share
Create a Filestore NFS share and expose it as a PersistentVolume.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: filestore-pv
spec:
  capacity:
    storage: 1Ti
  accessModes:
  - ReadWriteMany
  nfs:
    path: /data
    server: 10.0.0.5
  persistentVolumeReclaimPolicy: Retain
  storageClassName: ""
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-nfs-pvc
spec:
  accessModes:
  - ReadWriteMany
  storageClassName: ""
  volumeName: filestore-pv
  resources:
    requests:
      storage: 100Gi
```

---

### 54. Filestore — ReadWriteMany Across Multiple Nodes
Share a Filestore NFS PVC among multiple pods on different nodes.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shared-writer
spec:
  replicas: 5
  selector:
    matchLabels:
      app: shared-writer
  template:
    metadata:
      labels:
        app: shared-writer
    spec:
      containers:
      - name: writer
        image: gcr.io/my-gcp-project/writer:latest
        volumeMounts:
        - name: shared
          mountPath: /shared
      volumes:
      - name: shared
        persistentVolumeClaim:
          claimName: shared-nfs-pvc
```

---

### 55. Regional Persistent Disk StorageClass
Create a StorageClass that provisions cross-zone replicated PDs for HA.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: regional-pd
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-balanced
  replication-type: regional-pd
  regions: us-central1
volumeBindingMode: WaitForFirstConsumer
allowedTopologies:
- matchLabelExpressions:
  - key: topology.kubernetes.io/zone
    values:
    - us-central1-a
    - us-central1-b
```

---

### 56. VolumeSnapshotClass for PD CSI
Define a snapshot class to enable taking snapshots of Persistent Disks.

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: pd-snapshot-class
  annotations:
    snapshot.storage.kubernetes.io/is-default-class: "true"
driver: pd.csi.storage.gke.io
deletionPolicy: Delete
parameters:
  storage-locations: us-central1
```

---

### 57. VolumeSnapshot — Create Snapshot from PVC
Take a point-in-time snapshot of a PVC for backup or clone purposes.

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: db-snapshot-20240101
spec:
  volumeSnapshotClassName: pd-snapshot-class
  source:
    persistentVolumeClaimName: db-pvc
```

```bash
kubectl get volumesnapshot db-snapshot-20240101
kubectl describe volumesnapshot db-snapshot-20240101
```

---

### 58. VolumeSnapshot — Restore PVC from Snapshot
Create a new PVC pre-populated from a snapshot for DR or testing.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-restored-pvc
spec:
  dataSource:
    name: db-snapshot-20240101
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
  - ReadWriteOnce
  storageClassName: premium-rwo
  resources:
    requests:
      storage: 50Gi
```

---

### 59. Volume Cloning — Duplicate a PVC
Clone an existing PVC for fast test environment creation with real data.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-clone-pvc
spec:
  dataSource:
    name: db-pvc
    kind: PersistentVolumeClaim
  accessModes:
  - ReadWriteOnce
  storageClassName: premium-rwo
  resources:
    requests:
      storage: 50Gi
```

---

### 60. PV with Retain Reclaim Policy
Keep the underlying disk when the PVC is deleted; manually reclaim the PV afterward.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: critical-data-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  csi:
    driver: pd.csi.storage.gke.io
    volumeHandle: projects/my-gcp-project/zones/us-central1-a/disks/critical-disk
```

```bash
# After PVC deletion the PV is in Released state; re-bind it:
kubectl patch pv critical-data-pv -p '{"spec":{"claimRef":null}}'
```

---

### 61. StatefulSet volumeClaimTemplates for Per-Replica PVCs
Automatically provision a dedicated PVC for every StatefulSet replica.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16
        volumeMounts:
        - name: pgdata
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: pgdata
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: premium-rwo
      resources:
        requests:
          storage: 50Gi
```

---

### 62. emptyDir with sizeLimit
Evict a pod when its scratch space exceeds the limit, preventing node disk exhaustion.

```yaml
spec:
  containers:
  - name: processor
    image: gcr.io/my-gcp-project/processor:latest
    volumeMounts:
    - name: scratch
      mountPath: /tmp/work
    resources:
      requests:
        ephemeral-storage: "2Gi"
      limits:
        ephemeral-storage: "4Gi"
  volumes:
  - name: scratch
    emptyDir:
      sizeLimit: 4Gi
```

---

### 63. Projected Volume — Token, ConfigMap, and Secret Combined
Mount a service account token, config file, and secret into one directory.

```yaml
volumes:
- name: config-vol
  projected:
    sources:
    - serviceAccountToken:
        path: token
        expirationSeconds: 3600
        audience: my-gcp-project.svc.id.goog
    - configMap:
        name: app-config
        items:
        - key: config.yaml
          path: config.yaml
    - secret:
        name: app-secrets
        items:
        - key: db-password
          path: db-password
```

---

### 64. Secrets Store CSI Driver — Mount from GCP Secret Manager
Inject a Secret Manager secret as a file without creating a Kubernetes Secret object.

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: gcp-secrets
spec:
  provider: gcp
  parameters:
    secrets: |
      - resourceName: "projects/my-gcp-project/secrets/db-password/versions/latest"
        path: "db-password"
---
volumes:
- name: secrets-vol
  csi:
    driver: secrets-store.csi.k8s.io
    readOnly: true
    volumeAttributes:
      secretProviderClass: gcp-secrets
```

---

### 65. KCC — StorageBucket with GCS FUSE IAM Access
Declare a versioned GCS bucket and grant a Workload Identity SA read access for FUSE mounts.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: ml-training-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: fuse-read-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    kind: StorageBucket
    name: ml-training-data
  bindings:
  - role: roles/storage.objectViewer
    members:
    - member: serviceAccount:ml-sa@my-gcp-project.iam.gserviceaccount.com
