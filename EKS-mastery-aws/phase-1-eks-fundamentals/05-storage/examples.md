# EKS Storage — Examples

## Basic

### 1. Install EBS CSI Driver addon
```bash
# Install as EKS managed addon
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster my-cluster \
  --service-account-role-arn arn:aws:iam::123456789:role/AmazonEBS_CSI_DriverRole \
  --force

# Verify installation
kubectl get pods -n kube-system -l app=ebs-csi-controller
kubectl get daemonset ebs-csi-node -n kube-system
```

---

### 2. Create a StorageClass for gp3 EBS
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer   # create volume in same AZ as pod
reclaimPolicy: Delete
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
```

---

### 3. Create a PersistentVolumeClaim (PVC)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce    # EBS: only one node at a time
  storageClassName: gp3
  resources:
    requests:
      storage: 20Gi
```

---

### 4. Mount PVC in a pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: data-pod
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: data-pvc
```

---

### 5. List PVCs and PVs
```bash
kubectl get pvc
kubectl get pv
kubectl describe pvc data-pvc
kubectl describe pv pvc-xxxxx
```

---

### 6. Expand a PVC (increase storage size)
```bash
# First, ensure StorageClass has allowVolumeExpansion: true
kubectl get sc gp3 -o jsonpath='{.allowVolumeExpansion}'

# Patch the PVC to request more storage
kubectl patch pvc data-pvc \
  -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'

# Monitor expansion
kubectl get pvc data-pvc -w
```

---

### 7. EFS CSI Driver for shared (ReadWriteMany) storage
```bash
# Install EFS CSI Driver
helm repo add aws-efs-csi-driver https://kubernetes-sigs.github.io/aws-efs-csi-driver/
helm upgrade --install aws-efs-csi-driver \
  aws-efs-csi-driver/aws-efs-csi-driver \
  --namespace kube-system \
  --set controller.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::123456789:role/AmazonEFSCSIDriverRole
```

---

### 8. EFS StorageClass and PVC (ReadWriteMany)
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap         # EFS access point per PVC
  fileSystemId: fs-0123456789abcdef
  directoryPerms: "700"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-pvc
spec:
  accessModes:
    - ReadWriteMany    # EFS: multiple pods across nodes!
  storageClassName: efs-sc
  resources:
    requests:
      storage: 5Gi
```

---

### 9. EmptyDir for ephemeral shared storage between containers
```yaml
spec:
  containers:
    - name: app
      volumeMounts:
        - name: cache
          mountPath: /tmp/cache
    - name: sidecar
      volumeMounts:
        - name: cache
          mountPath: /tmp/cache
  volumes:
    - name: cache
      emptyDir:
        medium: Memory    # tmpfs: faster but uses RAM
        sizeLimit: 512Mi
```

---

### 10. HostPath volume (for DaemonSets accessing node files)
```yaml
spec:
  volumes:
    - name: varlog
      hostPath:
        path: /var/log
        type: DirectoryOrCreate
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
        type: Socket
```

---

### 11. ConfigMap as volume (read config files)
```yaml
spec:
  volumes:
    - name: nginx-config
      configMap:
        name: nginx-conf
        defaultMode: 0644
  containers:
    - name: nginx
      volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/conf.d
          readOnly: true
```

---

### 12. Secret as volume (TLS certificates)
```yaml
spec:
  volumes:
    - name: tls-certs
      secret:
        secretName: app-tls
        defaultMode: 0400    # read-only, owner only
  containers:
    - name: app
      volumeMounts:
        - name: tls-certs
          mountPath: /etc/ssl/app
          readOnly: true
```

---

### 13. Delete a PVC
```bash
# Must delete pod using PVC first
kubectl delete pod data-pod
kubectl delete pvc data-pvc
# PV is automatically deleted if reclaimPolicy=Delete
```

---

### 14. View volume usage inside a pod
```bash
kubectl exec -it data-pod -- df -h /data
kubectl exec -it data-pod -- du -sh /data/*
```

---

### 15. Create EBS snapshot manually
```bash
# Get PV name for the PVC
PV_NAME=$(kubectl get pvc data-pvc -o jsonpath='{.spec.volumeName}')

# Get EBS volume ID
EBS_ID=$(kubectl get pv $PV_NAME -o jsonpath='{.spec.csi.volumeHandle}')

# Create snapshot
aws ec2 create-snapshot \
  --volume-id $EBS_ID \
  --description "PVC backup $(date +%Y%m%d)"
```

---

## Intermediate

### 16. VolumeSnapshotClass and VolumeSnapshot (CSI snapshots)
```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: ebs-vsc
driver: ebs.csi.aws.com
deletionPolicy: Delete
parameters:
  tagSpecification_1: "key=Environment,value=production"
---
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: data-snapshot
spec:
  volumeSnapshotClassName: ebs-vsc
  source:
    persistentVolumeClaimName: data-pvc
```
```bash
kubectl get volumesnapshot
kubectl get volumesnapshotcontent
```

---

### 17. Restore PVC from snapshot
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 20Gi
  dataSource:
    name: data-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
```

---

### 18. StatefulSet with volumeClaimTemplates
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
spec:
  replicas: 3
  serviceName: elasticsearch
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: gp3
        resources:
          requests:
            storage: 100Gi
  template:
    spec:
      containers:
        - name: elasticsearch
          image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
          volumeMounts:
            - name: data
              mountPath: /usr/share/elasticsearch/data
          env:
            - name: cluster.name
              value: k8s-cluster
            - name: node.name
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
```

---

### 19. S3 as object storage using s3fs or Mountpoint for S3
```yaml
# Using Mountpoint for Amazon S3 CSI Driver
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: s3-sc
provisioner: s3.csi.aws.com
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: s3-pv
spec:
  capacity:
    storage: 1200Gi
  accessModes:
    - ReadWriteMany
  mountOptions:
    - allow-delete
    - allow-overwrite
    - region ap-south-1
  csi:
    driver: s3.csi.aws.com
    volumeHandle: my-s3-bucket
    volumeAttributes:
      bucketName: my-data-bucket
```

---

### 20. Dynamic provisioning with different storage tiers
```yaml
# High IOPS StorageClass for databases
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: io2-high-perf
provisioner: ebs.csi.aws.com
parameters:
  type: io2
  iops: "10000"
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain    # keep data even if PVC deleted
---
# Standard StorageClass for general use
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-standard
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
```

---

### 21. StorageClass with zone topology
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-zone-a
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
allowedTopologies:
  - matchLabelExpressions:
      - key: topology.kubernetes.io/zone
        values:
          - ap-south-1a
```

---

### 22. Retain PV data after PVC deletion
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: retained-pv
spec:
  capacity:
    storage: 50Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain   # data preserved after PVC deleted
  storageClassName: gp3
  csi:
    driver: ebs.csi.aws.com
    volumeHandle: vol-0123456789abcdef0
    fsType: ext4
```

---

### 23. Reclaim a retained PV for reuse
```bash
# 1. Delete the PVC
kubectl delete pvc old-pvc

# 2. PV status becomes "Released" but data still exists
kubectl get pv retained-pv
# STATUS: Released

# 3. Remove the claimRef to make it "Available"
kubectl patch pv retained-pv \
  -p '{"spec":{"claimRef": null}}'

# 4. Create new PVC referencing this PV
```
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: new-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ""   # must match PV
  volumeName: retained-pv
  resources:
    requests:
      storage: 50Gi
```

---

### 24. Multi-attach EBS io2 (block storage for clustered apps)
```yaml
# io2 Block Express volumes support multi-attach on Nitro instances
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: io2-multi-attach
provisioner: ebs.csi.aws.com
parameters:
  type: io2
  iops: "3000"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-block
spec:
  accessModes:
    - ReadWriteMany    # only with io2 multi-attach + Nitro instances
  storageClassName: io2-multi-attach
  resources:
    requests:
      storage: 100Gi
```

---

### 25. Automated backup with Velero and S3
```bash
# Configure Velero S3 backup location
velero backup-location create default \
  --provider aws \
  --bucket velero-backups \
  --config region=ap-south-1

# Schedule automatic backups
velero schedule create daily-backup \
  --schedule="0 1 * * *" \
  --ttl 720h \
  --include-namespaces '*'

# List backups
velero backup get

# Restore specific namespace
velero restore create \
  --from-backup daily-backup-xxx \
  --include-namespaces production
```

---

## Nested

### 26. StatefulSet backup automation with CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pvc-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-sa
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: bitnami/kubectl:latest
              command:
                - /bin/sh
                - -c
                - |
                  # Create VolumeSnapshot for each PVC
                  for pvc in $(kubectl get pvc -l backup=enabled -o name); do
                    name=${pvc##*/}
                    cat <<EOF | kubectl apply -f -
                  apiVersion: snapshot.storage.k8s.io/v1
                  kind: VolumeSnapshot
                  metadata:
                    name: ${name}-$(date +%Y%m%d%H%M)
                    labels:
                      scheduled-backup: "true"
                  spec:
                    volumeSnapshotClassName: ebs-vsc
                    source:
                      persistentVolumeClaimName: ${name}
                  EOF
                  done
```

---

### 27. Cross-AZ storage considerations and performance
```bash
# Check which AZ a PVC's EBS volume is in
PV=$(kubectl get pvc my-pvc -o jsonpath='{.spec.volumeName}')
kubectl get pv $PV -o jsonpath='{.spec.nodeAffinity}'

# Check if pod and PV are in same AZ (cross-AZ = higher latency + cost)
kubectl get pod my-pod -o jsonpath='{.spec.nodeName}' | \
  xargs kubectl get node -o jsonpath='{.metadata.labels.topology\.kubernetes\.io/zone}'

# Use WaitForFirstConsumer to ensure PVC created in pod's AZ
```

---

### 28. EFS with encryption and access control
```bash
# Create encrypted EFS file system
aws efs create-file-system \
  --encrypted \
  --kms-key-id arn:aws:kms:ap-south-1:123456789:key/your-key \
  --performance-mode generalPurpose \
  --throughput-mode elastic \
  --tags Key=Name,Value=eks-shared-storage

# Create mount target in each subnet
for SUBNET in subnet-aaaa subnet-bbbb; do
  aws efs create-mount-target \
    --file-system-id fs-0123456789abcdef \
    --subnet-id $SUBNET \
    --security-groups sg-0123456789
done

# Create access point for team isolation
aws efs create-access-point \
  --file-system-id fs-0123456789abcdef \
  --posix-user Uid=1000,Gid=1000 \
  --root-directory "Path=/team-a,CreationInfo={OwnerUid=1000,OwnerGid=1000,Permissions=750}"
```

---

## Advanced

### 29. Volume cloning (copy a PVC)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cloned-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 20Gi
  dataSource:
    kind: PersistentVolumeClaim
    name: source-pvc    # clone from existing PVC (same StorageClass required)
```

---

### 30. CSI volume attributes class (Kubernetes 1.29+)
```yaml
# Dynamically adjust volume IOPS/throughput without detach
apiVersion: storage.k8s.io/v1alpha1
kind: VolumeAttributesClass
metadata:
  name: silver
driverName: ebs.csi.aws.com
parameters:
  iops: "3000"
  throughput: "125"
---
apiVersion: storage.k8s.io/v1alpha1
kind: VolumeAttributesClass
metadata:
  name: gold
driverName: ebs.csi.aws.com
parameters:
  iops: "16000"
  throughput: "1000"
```

---

## Expert

### 31. Local NVMe storage for ultra-low latency workloads
```yaml
# StorageClass for local SSDs
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-nvme
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
---
# PersistentVolume (must be created manually per node)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv-node1
spec:
  capacity:
    storage: 1.8Ti
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-nvme
  local:
    path: /mnt/nvme0n1
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - ip-10-0-1-100
```

---

### 32. Disaster recovery: replicate EBS snapshots cross-region
```bash
#!/bin/bash
SOURCE_REGION="ap-south-1"
DR_REGION="ap-southeast-1"

# Get all PV EBS volumes in cluster
VOLUMES=$(kubectl get pv -o jsonpath='{.items[*].spec.csi.volumeHandle}')

for VOL in $VOLUMES; do
  echo "Snapshotting $VOL..."
  SNAPSHOT_ID=$(aws ec2 create-snapshot \
    --volume-id $VOL \
    --region $SOURCE_REGION \
    --description "DR snapshot $(date +%Y%m%d)" \
    --query 'SnapshotId' --output text)

  echo "Waiting for snapshot $SNAPSHOT_ID..."
  aws ec2 wait snapshot-completed \
    --snapshot-ids $SNAPSHOT_ID \
    --region $SOURCE_REGION

  echo "Copying to DR region..."
  aws ec2 copy-snapshot \
    --source-region $SOURCE_REGION \
    --source-snapshot-id $SNAPSHOT_ID \
    --region $DR_REGION \
    --description "DR copy of $SNAPSHOT_ID"
done

echo "DR snapshot replication complete"
```

---
