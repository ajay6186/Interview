# Node Pools — Examples

## Basic

### 1. List Node Pools in a Cluster
View all node pools and their configuration.

```bash
gcloud container node-pools list \
  --cluster my-cluster \
  --zone us-central1-a
```

---

### 2. Create a Node Pool
Add a new node pool with a specific machine type.

```bash
gcloud container node-pools create high-mem-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n2-highmem-4 \
  --num-nodes 2
```

---

### 3. Delete a Node Pool
Remove a node pool (workloads are rescheduled to other pools first).

```bash
gcloud container node-pools delete high-mem-pool \
  --cluster my-cluster \
  --zone us-central1-a
```

---

### 4. Describe a Node Pool
Inspect configuration details of a specific node pool.

```bash
gcloud container node-pools describe default-pool \
  --cluster my-cluster \
  --zone us-central1-a
```

---

### 5. Get Node Pool Nodes via kubectl
List nodes belonging to a specific node pool using labels.

```bash
kubectl get nodes -l cloud.google.com/gke-nodepool=default-pool
kubectl get nodes -l cloud.google.com/gke-nodepool=high-mem-pool -o wide
```

---

### 6. Resize a Node Pool
Manually scale the number of nodes in a pool.

```bash
gcloud container clusters resize my-cluster \
  --zone us-central1-a \
  --node-pool high-mem-pool \
  --num-nodes 4
```

---

### 7. Create Node Pool with SSD Boot Disk
Use SSD disks for faster node startup and I/O.

```bash
gcloud container node-pools create ssd-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-4 \
  --disk-type pd-ssd \
  --disk-size 100 \
  --num-nodes 2
```

---

### 8. Create Node Pool with Spot VMs
Use Spot (preemptible) VMs for cost savings on fault-tolerant workloads.

```bash
gcloud container node-pools create spot-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-4 \
  --spot \
  --num-nodes 3
```

---

### 9. Add Node Pool Labels
Apply custom labels to nodes in a pool for scheduling workloads.

```bash
gcloud container node-pools create labeled-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-4 \
  --node-labels env=production,workload=batch \
  --num-nodes 2
```

---

### 10. Add Node Pool Taints
Taint a node pool so only Pods with matching tolerations are scheduled.

```bash
gcloud container node-pools create tainted-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n2-standard-4 \
  --node-taints dedicated=gpu:NoSchedule \
  --num-nodes 2
```

---

### 11. Upgrade a Node Pool
Upgrade nodes in a pool to a newer Kubernetes version.

```bash
gcloud container clusters upgrade my-cluster \
  --zone us-central1-a \
  --node-pool default-pool \
  --cluster-version 1.29.5-gke.1000
```

---

### 12. Create Node Pool in Specific Zones
Distribute node pool nodes across multiple zones.

```bash
gcloud container node-pools create multi-zone-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --node-locations us-central1-a,us-central1-b,us-central1-c \
  --machine-type e2-standard-2 \
  --num-nodes 1
```

---

### 13. Set Node Pool Service Account
Assign a custom service account to nodes instead of the default compute SA.

```bash
gcloud container node-pools create custom-sa-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --service-account gke-nodes@my-gcp-project.iam.gserviceaccount.com \
  --num-nodes 2
```

---

### 14. Create a Windows Node Pool
Add Windows Server nodes for Windows container workloads.

```bash
gcloud container node-pools create windows-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n2-standard-4 \
  --image-type WINDOWS_LTSC_CONTAINERD \
  --num-nodes 1
```

---

### 15. Create Node Pool with Max Pods Per Node
Control IP allocation density by limiting pods per node.

```bash
gcloud container node-pools create dense-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-8 \
  --max-pods-per-node 64 \
  --num-nodes 2
```

---

## Intermediate

### 16. Enable Cluster Autoscaler on a Node Pool
Automatically scale node count based on workload demand.

```bash
gcloud container node-pools update default-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10
```

---

### 17. Disable Cluster Autoscaler on a Node Pool
Revert to manual scaling for a specific pool.

```bash
gcloud container node-pools update default-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --no-enable-autoscaling
```

---

### 18. Enable Node Auto-Provisioning (NAP)
GKE automatically creates and deletes node pools based on pending Pod demands.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --enable-autoprovisioning \
  --min-cpu 1 --max-cpu 64 \
  --min-memory 1 --max-memory 256
```

---

### 19. Configure Autoscaler Profile
Set autoscaler behavior — balanced or optimize-utilization.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --autoscaling-profile optimize-utilization
```

---

### 20. Create GPU Node Pool
Add NVIDIA GPU nodes for machine learning workloads.

```bash
gcloud container node-pools create gpu-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n1-standard-4 \
  --accelerator type=nvidia-tesla-t4,count=1 \
  --num-nodes 1

# Install GPU drivers automatically
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/container-engine-accelerators/master/nvidia-driver-installer/cos/daemonset-preloaded.yaml
```

---

### 21. Node Pool with Shielded Nodes
Enable Shielded Nodes for a specific pool to prevent rootkit attacks.

```bash
gcloud container node-pools create shielded-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-4 \
  --shielded-secure-boot \
  --shielded-integrity-monitoring \
  --num-nodes 2
```

---

### 22. Cordon and Drain a Node Pool
Safely remove workloads from nodes before maintenance.

```bash
# Get nodes in the pool
NODES=$(kubectl get nodes -l cloud.google.com/gke-nodepool=old-pool -o name)

# Cordon each node (prevent new scheduling)
for node in $NODES; do kubectl cordon $node; done

# Drain each node (evict existing pods)
for node in $NODES; do kubectl drain $node --ignore-daemonsets --delete-emptydir-data; done
```

---

### 23. Set Node Pool Upgrade Settings
Control how many nodes are unavailable during upgrades (surge upgrades).

```bash
gcloud container node-pools update default-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --max-surge-upgrade 1 \
  --max-unavailable-upgrade 0
```

---

### 24. Create ARM-based Node Pool (Tau T2A)
Use Arm-based VMs for cost-efficient, scale-out workloads.

```bash
gcloud container node-pools create arm-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type t2a-standard-4 \
  --num-nodes 2
```

---

### 25. Node Pool with Workload Identity
Configure a node pool to support Workload Identity for secure GCP API access.

```bash
gcloud container node-pools create wi-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --workload-metadata GKE_METADATA \
  --num-nodes 2
```

---

### 26. Schedule Pods to Specific Node Pools
Use `nodeSelector` to target a specific node pool by its label.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-job
spec:
  replicas: 3
  selector:
    matchLabels:
      app: batch
  template:
    metadata:
      labels:
        app: batch
    spec:
      nodeSelector:
        cloud.google.com/gke-nodepool: spot-pool
      containers:
        - name: worker
          image: myapp:1.0
```

---

### 27. Tolerate Spot Node Pool Taints
Allow Pods to schedule on Spot nodes which are automatically tainted.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: spot-tolerant-pod
spec:
  tolerations:
    - key: cloud.google.com/gke-spot
      operator: Equal
      value: "true"
      effect: NoSchedule
  nodeSelector:
    cloud.google.com/gke-spot: "true"
  containers:
    - name: app
      image: myapp:1.0
```

---

### 28. Create Confidential Computing Node Pool
Use AMD SEV-based nodes to protect data in use via memory encryption.

```bash
gcloud container node-pools create confidential-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n2d-standard-4 \
  --enable-confidential-nodes \
  --num-nodes 2
```

---

### 29. Node Pool with Boot Disk Image Type
Specify container-optimized OS or Ubuntu image for nodes.

```bash
# Container-Optimized OS (default, recommended)
gcloud container node-pools create cos-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --image-type COS_CONTAINERD \
  --num-nodes 2

# Ubuntu with containerd
gcloud container node-pools create ubuntu-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --image-type UBUNTU_CONTAINERD \
  --num-nodes 2
```

---

### 30. Node Pool with Local SSD
Add local NVMe SSD storage for latency-sensitive workloads.

```bash
gcloud container node-pools create local-ssd-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n2-standard-8 \
  --local-ssd-count 2 \
  --num-nodes 2
```

---

## Nested

### 31. KCC — ContainerNodePool Resource
Create a node pool declaratively using Config Connector.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: kcc-node-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: e2-standard-4
    diskSizeGb: 100
    diskType: pd-ssd
    imageType: COS_CONTAINERD
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 32. KCC — ContainerNodePool with Autoscaling
Declare autoscaling settings for a node pool via KCC.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: autoscaling-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  autoscaling:
    minNodeCount: 1
    maxNodeCount: 10
  nodeConfig:
    machineType: e2-standard-4
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 33. KCC — ContainerNodePool with Spot VMs
Declare a Spot node pool for cost savings.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: spot-node-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 3
  nodeConfig:
    machineType: e2-standard-4
    spot: true
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 34. KCC — ContainerNodePool with Taints and Labels
Apply scheduling controls via KCC-managed node pool.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: dedicated-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: n2-highmem-8
    labels:
      workload-type: memory-intensive
      env: production
    taints:
      - key: dedicated
        value: memory-workloads
        effect: NO_SCHEDULE
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 35. KCC — ContainerNodePool with GPU Accelerator
Declare a GPU node pool via Config Connector.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: gpu-node-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 1
  nodeConfig:
    machineType: n1-standard-4
    accelerators:
      - acceleratorCount: 1
        acceleratorType: nvidia-tesla-t4
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 36. KCC — ContainerNodePool with Surge Upgrade Config
Control upgrade behavior to minimize disruption.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: rolling-upgrade-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 3
  upgradeSettings:
    maxSurge: 1
    maxUnavailable: 0
  nodeConfig:
    machineType: e2-standard-4
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 37. KCC — ContainerNodePool with Shielded Instance Config
Declare shielded node settings for security compliance.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: shielded-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: e2-standard-4
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 38. KCC — ContainerNodePool with Service Account
Assign a custom IAM service account to node pool nodes.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: custom-sa-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: e2-standard-4
    serviceAccountRef:
      name: gke-node-sa
    workloadMetadataConfig:
      mode: GKE_METADATA
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 39. KCC — ContainerNodePool with Node Management
Configure auto-repair and auto-upgrade behavior.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: managed-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 3
  management:
    autoRepair: true
    autoUpgrade: true
  nodeConfig:
    machineType: e2-standard-4
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 40. Multi-Pool Strategy with Priorities
Use multiple node pools with different characteristics and route workloads accordingly.

```yaml
# Spot pool for batch workloads
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-processor
spec:
  replicas: 10
  selector:
    matchLabels:
      app: batch
  template:
    metadata:
      labels:
        app: batch
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              preference:
                matchExpressions:
                  - key: cloud.google.com/gke-spot
                    operator: In
                    values: ["true"]
      tolerations:
        - key: cloud.google.com/gke-spot
          operator: Equal
          value: "true"
          effect: NoSchedule
      containers:
        - name: worker
          image: batch-worker:1.0
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
```

---

## Advanced

### 41. KCC — Multi-Pool Cluster Architecture
Declare multiple node pools for different workload types.

```yaml
# General-purpose pool
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: general-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: production-cluster
  autoscaling:
    minNodeCount: 2
    maxNodeCount: 20
  nodeConfig:
    machineType: e2-standard-4
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
---
# High-memory pool for data processing
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: highmem-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: production-cluster
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 10
  nodeConfig:
    machineType: n2-highmem-8
    taints:
      - key: dedicated
        value: highmem
        effect: NO_SCHEDULE
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 42. Node Auto-Provisioning with Custom Machine Families
Configure NAP to provision nodes from specific machine families.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --enable-autoprovisioning \
  --autoprovisioning-config-file nap-config.yaml

# nap-config.yaml
cat > nap-config.yaml << 'EOF'
resourceLimits:
  - resourceType: cpu
    minimum: 4
    maximum: 128
  - resourceType: memory
    minimum: 16
    maximum: 512
autoprovisioningNodePoolDefaults:
  serviceAccount: gke-nodes@my-gcp-project.iam.gserviceaccount.com
  oauthScopes:
    - https://www.googleapis.com/auth/cloud-platform
  management:
    autoUpgrade: true
    autoRepair: true
  shieldedInstanceConfig:
    enableSecureBoot: true
    enableIntegrityMonitoring: true
EOF
```

---

### 43. Graceful Node Shutdown Handling
Configure Pods to handle Spot node preemption gracefully.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spot-aware-app
spec:
  replicas: 5
  selector:
    matchLabels:
      app: spot-aware
  template:
    metadata:
      labels:
        app: spot-aware
    spec:
      terminationGracePeriodSeconds: 25  # less than GKE's 30s preemption window
      tolerations:
        - key: cloud.google.com/gke-spot
          operator: Exists
          effect: NoSchedule
      containers:
        - name: app
          image: myapp:1.0
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 20 && /app/graceful-shutdown.sh"]
```

---

### 44. KCC — ContainerNodePool with Confidential Computing
Declare AMD SEV-based confidential nodes for sensitive workloads.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: confidential-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: secure-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: n2d-standard-4
    confidentialNodes:
      enabled: true
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 45. Topology-Aware Scheduling with Node Pool Zones
Spread workloads across zones for resilience using topology spread constraints.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zone-spread-app
spec:
  replicas: 9
  selector:
    matchLabels:
      app: zone-spread
  template:
    metadata:
      labels:
        app: zone-spread
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: zone-spread
        - maxSkew: 2
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: zone-spread
      containers:
        - name: app
          image: myapp:1.0
```

---

### 46. Node Pool Blue-Green Upgrade Strategy
Create a new node pool and migrate workloads without downtime.

```bash
# Step 1: Create new pool with updated configuration
gcloud container node-pools create new-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type e2-standard-4 \
  --num-nodes 3

# Step 2: Cordon old pool nodes
kubectl get nodes -l cloud.google.com/gke-nodepool=old-pool \
  -o name | xargs kubectl cordon

# Step 3: Drain old pool nodes
kubectl get nodes -l cloud.google.com/gke-nodepool=old-pool \
  -o name | xargs -I{} kubectl drain {} \
  --ignore-daemonsets --delete-emptydir-data --force

# Step 4: Delete old node pool
gcloud container node-pools delete old-pool \
  --cluster my-cluster \
  --zone us-central1-a
```

---

### 47. KCC — ContainerNodePool with GCFS (Filestore CSI)
Enable GCS FUSE and Filestore CSI drivers for file workloads.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: filestore-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: e2-standard-4
    gcfsConfig:
      enabled: true   # enables GCS FUSE
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 48. Node Pool Cost Optimization with Committed Use
Combine committed use discounts with node pools for production workloads.

```bash
# Purchase 1-year committed use for baseline capacity
gcloud compute commitments create gke-baseline \
  --region us-central1 \
  --resources vcpu=32,memory=128GB \
  --plan 12-month

# Create dedicated pool for committed-use workloads
gcloud container node-pools create committed-pool \
  --cluster my-cluster \
  --zone us-central1-a \
  --machine-type n2-standard-8 \
  --num-nodes 4 \
  --node-labels capacity-type=committed
```

---

### 49. KCC — ContainerNodePool with Linux Node Config
Tune kernel parameters for high-performance workloads.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: tuned-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  clusterRef:
    name: my-kcc-cluster
  initialNodeCount: 2
  nodeConfig:
    machineType: n2-standard-16
    linuxNodeConfig:
      sysctls:
        net.core.somaxconn: "32768"
        net.ipv4.tcp_rmem: "4096 87380 16777216"
        net.ipv4.tcp_wmem: "4096 16384 16777216"
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
```

---

### 50. Full Production Node Pool Strategy
Complete multi-pool setup for a production cluster with KCC.

```yaml
# System/critical workloads pool
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: system-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  clusterRef:
    name: production-cluster
  autoscaling:
    minNodeCount: 2
    maxNodeCount: 5
  management:
    autoRepair: true
    autoUpgrade: true
  upgradeSettings:
    maxSurge: 1
    maxUnavailable: 0
  nodeConfig:
    machineType: e2-standard-4
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
    workloadMetadataConfig:
      mode: GKE_METADATA
    serviceAccountRef:
      name: gke-system-sa
    taints:
      - key: CriticalAddonsOnly
        value: "true"
        effect: NO_SCHEDULE
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
---
# Application workloads pool
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: app-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  clusterRef:
    name: production-cluster
  autoscaling:
    minNodeCount: 3
    maxNodeCount: 50
  management:
    autoRepair: true
    autoUpgrade: true
  upgradeSettings:
    maxSurge: 2
    maxUnavailable: 0
  nodeConfig:
    machineType: e2-standard-8
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
    workloadMetadataConfig:
      mode: GKE_METADATA
    serviceAccountRef:
      name: gke-app-sa
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform

---

## Expert

### 51. Confidential VM Node Pool (AMD SEV)
Create a node pool using Confidential VMs to encrypt in-use memory with AMD SEV hardware.

```bash
gcloud container node-pools create confidential-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=n2d-standard-4 \
  --image-type=COS_CONTAINERD \
  --enable-confidential-nodes \
  --num-nodes=2
```

---

### 52. Arm64 Node Pool (T2A Machines)
Add a cost-efficient Arm64 node pool using Tau T2A machines for Arm-compatible workloads.

```bash
gcloud container node-pools create arm64-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=t2a-standard-4 \
  --image-type=COS_CONTAINERD \
  --num-nodes=2
```

---

### 53. Windows Server Node Pool Creation
Create a Windows Server node pool to run Windows-based containerized workloads on GKE.

```bash
gcloud container node-pools create windows-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=n2-standard-4 \
  --image-type=WINDOWS_LTSC_CONTAINERD \
  --num-nodes=2 \
  --no-enable-autoupgrade
```

---

### 54. Windows Workload Deployment with nodeSelector
Schedule a Windows container workload to the Windows node pool using a nodeSelector.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: windows-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: windows-app
  template:
    metadata:
      labels:
        app: windows-app
    spec:
      nodeSelector:
        kubernetes.io/os: windows
      containers:
        - name: windows-app
          image: mcr.microsoft.com/windows/servercore/iis:windowsservercore-ltsc2022
          ports:
            - containerPort: 80
```

---

### 55. Custom Node Image — COS vs Ubuntu-containerd
Create node pools with specific OS images to compare COS (hardened) and Ubuntu-containerd (extensible) environments.

```bash
# Container-Optimized OS (default, hardened)
gcloud container node-pools create cos-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --image-type=COS_CONTAINERD \
  --machine-type=e2-standard-4

# Ubuntu with containerd (allows custom kernel modules)
gcloud container node-pools create ubuntu-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --image-type=UBUNTU_CONTAINERD \
  --machine-type=e2-standard-4
```

---

### 56. GPU Node Pool with NVIDIA T4 (n1-standard-4 + T4)
Provision a GPU node pool with NVIDIA T4 accelerators for ML inference workloads.

```bash
gcloud container node-pools create gpu-t4-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator type=nvidia-tesla-t4,count=1 \
  --image-type=COS_CONTAINERD \
  --num-nodes=2 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=4
```

---

### 57. TPU Node Pool (TPU v4) Creation
Create a node pool with Cloud TPU v4 accelerators for large-scale machine learning training.

```bash
gcloud container node-pools create tpu-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=ct4p-hightpu-4t \
  --tpu-topology=2x2x1 \
  --num-nodes=2
```

---

### 58. Node Pool with Local SSD NVMe Drives
Attach high-throughput NVMe local SSDs to nodes for latency-sensitive workloads requiring fast ephemeral storage.

```bash
gcloud container node-pools create local-ssd-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=n2-standard-16 \
  --local-ssd-count=2 \
  --ephemeral-storage-local-ssd count=2 \
  --image-type=COS_CONTAINERD \
  --num-nodes=2
```

---

### 59. Node Pool with GKE Sandbox (gVisor) Enabled
Create a node pool with gVisor sandbox for running untrusted container workloads with kernel-level isolation.

```bash
gcloud container node-pools create gvisor-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=n2-standard-4 \
  --image-type=COS_CONTAINERD \
  --sandbox type=gvisor \
  --num-nodes=2
```

---

### 60. Node Pool Surge Upgrade with Zero Disruption
Configure a node pool to perform upgrades using the surge strategy with zero unavailable nodes.

```bash
gcloud container node-pools update my-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --max-surge-upgrade=3 \
  --max-unavailable-upgrade=0
```

---

### 61. Node Pool Blue-Green Upgrade Strategy
Enable blue-green upgrade strategy on a node pool to batch nodes into wave sets for safe rollout.

```bash
gcloud container node-pools update my-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --node-pool-soak-duration=3600s \
  --standard-rollout-policy=batch-node-count=5,batch-soak-duration=600s
```

---

### 62. Node Pool with Custom OAuth Scopes
Create a node pool with fine-grained OAuth scopes instead of the broad cloud-platform scope.

```bash
gcloud container node-pools create scoped-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --scopes=https://www.googleapis.com/auth/logging.write,\
https://www.googleapis.com/auth/monitoring,\
https://www.googleapis.com/auth/devstorage.read_only \
  --num-nodes=2
```

---

### 63. Node Pool with Compact Placement Policy (Low Latency)
Create a node pool pinned to a compact placement policy to minimize inter-node network latency for HPC workloads.

```bash
# Create placement policy
gcloud compute resource-policies create group-placement compact-policy \
  --collocation=COLLOCATED \
  --region=us-central1

# Create node pool referencing the policy
gcloud container node-pools create compact-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=c2-standard-8 \
  --placement-type=COMPACT \
  --num-nodes=4
```

---

### 64. KCC — ContainerNodePool with All Security Configs (Shielded, Secure Boot, Integrity Monitoring)
Define a fully hardened node pool via Config Connector with all shielded VM security features enabled.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: hardened-node-pool
  namespace: config-control
spec:
  clusterRef:
    name: my-cluster
  location: us-central1-a
  nodeCount: 3
  nodeConfig:
    machineType: e2-standard-4
    imageType: COS_CONTAINERD
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
    workloadMetadataConfig:
      mode: GKE_METADATA
    serviceAccountRef:
      name: gke-nodes-sa
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
  management:
    autoRepair: true
    autoUpgrade: true
```

---

### 65. KCC — ContainerNodePool with Auto-Upgrade and Auto-Repair Policies
Declare a node pool in KCC with explicit auto-upgrade and auto-repair management policies enforced via GitOps.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: managed-node-pool
  namespace: config-control
spec:
  clusterRef:
    name: production-cluster
  location: us-central1
  autoscaling:
    minNodeCount: 2
    maxNodeCount: 10
  management:
    autoRepair: true
    autoUpgrade: true
  upgradeSettings:
    maxSurge: 2
    maxUnavailable: 0
  nodeConfig:
    machineType: e2-standard-4
    imageType: COS_CONTAINERD
    workloadMetadataConfig:
      mode: GKE_METADATA
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
```
