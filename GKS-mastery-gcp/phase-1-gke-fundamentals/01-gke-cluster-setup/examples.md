# GKE Cluster Setup — Examples

## Basic

### 1. Create a Zonal GKE Cluster (gcloud)
A zonal cluster runs its control plane in a single zone. Fastest to create, lowest cost, but no control-plane HA.

```bash
gcloud container clusters create my-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-medium \
  --project my-gcp-project
```

---

### 2. Create a Regional GKE Cluster
A regional cluster replicates the control plane across 3 zones, providing high availability.

```bash
gcloud container clusters create my-regional-cluster \
  --region us-central1 \
  --num-nodes 1 \
  --machine-type e2-standard-2 \
  --project my-gcp-project
```

---

### 3. Get Cluster Credentials (kubeconfig)
After creating a cluster, fetch credentials so `kubectl` can connect.

```bash
gcloud container clusters get-credentials my-cluster \
  --zone us-central1-a \
  --project my-gcp-project

# Verify connection
kubectl cluster-info
kubectl get nodes
```

---

### 4. List All GKE Clusters
View all clusters in a project, across all locations.

```bash
# List clusters in a specific zone
gcloud container clusters list --zone us-central1-a
# gcloud container clusters list --zone us-central1-a --project abiding-splicer-494411-m9

# List clusters in all locations
gcloud container clusters list --project my-gcp-project
```

---

### 5. Describe a GKE Cluster
Inspect detailed cluster configuration including version, network, and status.

```bash
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --project my-gcp-project
```

---

### 6. Delete a GKE Cluster
Permanently deletes the cluster and all associated node pools.

```bash
gcloud container clusters delete my-cluster \
  --zone us-central1-a \
  --project my-gcp-project \
  --quiet   # skip confirmation prompt
```

---

### 7. Create Cluster with a Specific Kubernetes Version
Pin the Kubernetes version to avoid unexpected upgrades.

```bash
gcloud container clusters create versioned-cluster \
  --zone us-central1-a \
  --cluster-version 1.29.3-gke.1000 \
  --num-nodes 2

# List available versions
gcloud container get-server-config --zone us-central1-a
```

---

### 8. Enable Workload Identity on a New Cluster
Workload Identity is the recommended way for GKE workloads to access GCP APIs securely.

```bash
gcloud container clusters create wi-cluster \
  --zone us-central1-a \
  --workload-pool=my-gcp-project.svc.id.goog \
  --num-nodes 2
```

---

### 9. Create a Cluster with Custom Network
Specify an existing VPC and subnet instead of the default network.

```bash
gcloud container clusters create custom-net-cluster \
  --zone us-central1-a \
  --network my-vpc \
  --subnetwork my-subnet \
  --num-nodes 2

# gcloud compute networks create my-vpc --subnet-mode=custom --project abiding-splicer-494411-m9
# gcloud compute networks subnets create my-subnet --network=my-vpc --region=us-central1 --range=10.0.0.0/24 --project abiding-splicer-494411-m9
# gcloud container clusters create custom-net-cluster --zone us-central1-a --network my-vpc --subnetwork my-subnet --num-nodes 2 --disk-type=pd-standard --project abiding-splicer-494411-m9
```

---

### 10. View Cluster Upgrade Targets
Check what Kubernetes versions are available for upgrading an existing cluster.

```bash
gcloud container get-server-config \
  --zone us-central1-a \
  --format="yaml(validMasterVersions,validNodeVersions)"
```

---

### 11. Resize a Cluster's Default Node Pool
Scale the number of nodes in the default node pool.

```bash
gcloud container clusters resize my-cluster \
  --zone us-central1-a \
  --num-nodes 5 \
  --node-pool default-pool
```

---

### 12. Enable HTTP Load Balancing Add-on
HTTP load balancing is enabled by default. Explicitly verify or enable it.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-addons HttpLoadBalancing=ENABLED
```

---

### 13. View Cluster Nodes via kubectl
List all nodes with status, roles, and Kubernetes version.

```bash
kubectl get nodes
kubectl get nodes -o wide   # includes internal/external IPs
kubectl describe node <node-name>
```

---

### 14. Check Cluster Operations (Long-Running)
GKE cluster create/upgrade/delete are tracked as operations.

```bash
# List recent operations
gcloud container operations list --zone us-central1-a

# Wait for an operation to complete
gcloud container operations wait OPERATION_ID --zone us-central1-a
```

---

### 15. Export Cluster Config to YAML
Export cluster configuration as YAML for auditing or recreating.

```bash
gcloud container clusters describe my-cluster \
  --zone us-central1-a \
  --format=yaml > cluster-config.yaml
```

---

## Intermediate

### 16. Upgrade Cluster Control Plane
Upgrade the master (control plane) to a newer Kubernetes version.

```bash
gcloud container clusters upgrade my-cluster \
  --zone us-central1-a \
  --master \
  --cluster-version 1.29.5-gke.1000
```

---

### 17. Upgrade Node Pool
After upgrading the control plane, upgrade the nodes separately.

```bash
gcloud container clusters upgrade my-cluster \
  --zone us-central1-a \
  --node-pool default-pool \
  --cluster-version 1.29.5-gke.1000
```

---

### 18. Enable Vertical Pod Autoscaler (VPA)
VPA automatically adjusts resource requests/limits based on historical usage.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-addons VerticalPodAutoscaling=ENABLED
```

---

### 19. Enable Binary Authorization
Enforce that only signed container images can be deployed to the cluster.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --binauthz-evaluation-mode PROJECT_SINGLETON_POLICY_ENFORCE
```

---

### 20. Enable Dataplane V2 (eBPF-based networking)
Dataplane V2 uses eBPF for networking, enabling better observability and policy enforcement.

```bash
gcloud container clusters create dp2-cluster \
  --zone us-central1-a \
  --enable-dataplane-v2 \
  --num-nodes 2
```

---

### 21. Enable Shielded GKE Nodes
Shielded Nodes protect against rootkit and bootkit attacks.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --enable-shielded-nodes
```

---

### 22. Set Maintenance Window
Schedule maintenance operations to occur during low-traffic windows.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --maintenance-window-start 2024-01-01T02:00:00Z \
  --maintenance-window-end 2024-01-01T06:00:00Z \
  --maintenance-window-recurrence "FREQ=WEEKLY;BYDAY=SA,SU"
```

---

### 23. Enable Cloud Logging and Monitoring
Configure which GKE components send logs/metrics to Cloud Operations.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM,API_SERVER,SCHEDULER,CONTROLLER_MANAGER
```

---

### 24. Enable Intranode Visibility
See traffic between Pods on the same node in VPC Flow Logs.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --enable-intra-node-visibility
```

---

### 25. Set Resource Usage Export to BigQuery
Export cluster resource usage data to BigQuery for cost analysis.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --resource-usage-bigquery-dataset my_gke_usage_dataset
```

---

### 26. Enable Network Policy (Calico)
Enable Kubernetes NetworkPolicy enforcement using Calico.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-addons NetworkPolicy=ENABLED

gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --enable-network-policy
```

---

### 27. Create Autopilot Cluster
Autopilot manages node provisioning and scaling automatically — pay per Pod, not per node.

```bash
gcloud container clusters create-auto autopilot-cluster \
  --region us-central1 \
  --project my-gcp-project
```

---

### 28. Add Labels to a Cluster
Labels help organize clusters and apply IAM conditions.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-labels env=production,team=platform
```

---

### 29. Set Default Max Pods Per Node
Controls the IP address space allocated to each node (affects density).

```bash
gcloud container clusters create dense-cluster \
  --zone us-central1-a \
  --default-max-pods-per-node 32 \
  --num-nodes 2
```

---

IMP
### 30. Enable Config Connector Add-on (KCC)
Install the Config Connector add-on to manage GCP resources via Kubernetes.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-addons ConfigConnector=ENABLED
```

---

## Nested

### 31. KCC — ContainerCluster Resource
Create and manage a GKE cluster declaratively using Config Connector.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: my-kcc-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  nodeConfig:
    machineType: e2-standard-2
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
  workloadIdentityConfig:
    workloadPool: my-gcp-project.svc.id.goog
```

---

### 32. KCC — ContainerCluster with Logging and Monitoring
Declare cluster observability settings via KCC.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: observed-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  loggingConfig:
    enableComponents:
      - SYSTEM_COMPONENTS
      - WORKLOADS
  monitoringConfig:
    enableComponents:
      - SYSTEM_COMPONENTS
      - APISERVER
```

---

### 33. KCC — ContainerCluster with Network Config
Declare VPC-native cluster with custom network and subnet.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: vpc-native-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  networkRef:
    name: my-vpc
  subnetworkRef:
    name: my-subnet
  ipAllocationPolicy:
    useIpAliases: true
    clusterSecondaryRangeName: pods
    servicesSecondaryRangeName: services
```

---

### 34. KCC — ContainerCluster with Binary Authorization
Enforce image signing via KCC-managed cluster.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: secure-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  binaryAuthorization:
    evaluationMode: PROJECT_SINGLETON_POLICY_ENFORCE
  shieldedNodes:
    enabled: true
```

---

### 35. KCC — ContainerCluster with Maintenance Policy
Declare maintenance windows via KCC for predictable cluster updates.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: maintained-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  initialNodeCount: 2
  maintenancePolicy:
    recurringWindow:
      window:
        startTime: "2024-01-01T02:00:00Z"
        endTime: "2024-01-01T06:00:00Z"
      recurrence: "FREQ=WEEKLY;BYDAY=SA,SU"
```

---

### 36. KCC — ContainerCluster with Autopilot Mode
Declare an Autopilot cluster via Config Connector.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: autopilot-kcc-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  enableAutopilot: true
  networkRef:
    name: my-vpc
  subnetworkRef:
    name: my-subnet
```

---

### 37. KCC — Check Cluster Status
Query the KCC-managed cluster resource status.

```bash
# Check reconciliation status
kubectl get containercluster my-kcc-cluster -n config-connector

# Detailed status with conditions
kubectl describe containercluster my-kcc-cluster -n config-connector

# Get the GKE cluster resource status field
kubectl get containercluster my-kcc-cluster -n config-connector \
  -o jsonpath='{.status.conditions}'
```

---

### 38. KCC — ContainerCluster with Add-ons Config
Enable GKE add-ons declaratively via KCC.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: addon-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  addonsConfig:
    httpLoadBalancing:
      disabled: false
    horizontalPodAutoscaling:
      disabled: false
    configConnectorConfig:
      enabled: true
    gcePersistentDiskCsiDriverConfig:
      enabled: true
```

---

### 39. KCC — ContainerCluster with Master Authorized Networks
Restrict API server access to specific CIDR ranges.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: restricted-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  masterAuthorizedNetworksConfig:
    cidrBlocks:
      - cidrBlock: 10.0.0.0/8
        displayName: internal-network
      - cidrBlock: 203.0.113.0/24
        displayName: office-network
```

---

### 40. KCC — ContainerCluster with Resource Labels
Apply GCP resource labels to the cluster via KCC.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: labeled-cluster
  namespace: config-connector
  labels:
    env: production
    team: platform
    cost-center: engineering
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  resourceLabels:
    env: production
    team: platform
```

---

## Advanced

### 41. KCC — Private GKE Cluster
Create a private cluster where nodes have no external IPs.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: private-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  privateClusterConfig:
    enablePrivateNodes: true
    enablePrivateEndpoint: false
    masterIpv4CidrBlock: 172.16.0.0/28
  masterAuthorizedNetworksConfig:
    cidrBlocks:
      - cidrBlock: 10.0.0.0/8
        displayName: internal
  ipAllocationPolicy:
    useIpAliases: true
```

---

### 42. KCC — ContainerCluster with Network Policy and Dataplane V2
Enable eBPF-based networking and policy enforcement via KCC.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: dp2-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  datapathProvider: ADVANCED_DATAPATH
  networkPolicy:
    enabled: true
    provider: CALICO
```

---

### 43. KCC — Multi-zonal Cluster via ContainerCluster
Distribute nodes across multiple zones for workload resilience.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: multi-zone-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  nodeLocations:
    - us-central1-a
    - us-central1-b
    - us-central1-c
  initialNodeCount: 1
  nodeConfig:
    machineType: e2-standard-4
```

---

### 44. KCC — ContainerCluster with Cluster Autoscaler Profiles
Configure cluster autoscaler behavior profile.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: autoscaling-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  clusterAutoscaling:
    enabled: true
    autoscalingProfile: OPTIMIZE_UTILIZATION
    resourceLimits:
      - resourceType: cpu
        minimum: 4
        maximum: 64
      - resourceType: memory
        minimum: 16
        maximum: 256
```

---

### 45. KCC — ContainerCluster with Notification Config
Receive upgrade notifications via Pub/Sub.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: notified-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  notificationConfig:
    pubsub:
      enabled: true
      topicRef:
        name: gke-notifications-topic
```

---

### 46. Blue-Green Cluster Migration Pattern
Migrate workloads from an old cluster to a new one with zero downtime.

```bash
# Step 1: Create new cluster
gcloud container clusters create green-cluster \
  --zone us-central1-a --num-nodes 3

# Step 2: Get credentials for new cluster
gcloud container clusters get-credentials green-cluster --zone us-central1-a

# Step 3: Apply all manifests to new cluster
kubectl apply -f k8s-manifests/

# Step 4: Verify all workloads are running
kubectl get pods --all-namespaces

# Step 5: Update DNS / load balancer to point to new cluster
# Step 6: Delete old cluster after verification
gcloud container clusters delete blue-cluster --zone us-central1-a
```

---

### 47. KCC — ContainerCluster with Database Encryption
Encrypt Kubernetes secrets at rest using a Cloud KMS key.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: encrypted-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  databaseEncryption:
    state: ENCRYPTED
    keyName: projects/my-gcp-project/locations/us-central1/keyRings/my-ring/cryptoKeys/my-key
```

---

### 48. KCC — ContainerCluster with Release Channel
Pin cluster to a GKE release channel for managed upgrade cadence.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: channel-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  initialNodeCount: 2
  releaseChannel:
    channel: REGULAR   # RAPID | REGULAR | STABLE
  workloadIdentityConfig:
    workloadPool: my-gcp-project.svc.id.goog
```

---

### 49. Cluster Fleet Registration (GKE Enterprise)
Register a GKE cluster to a fleet for multi-cluster management.

```bash
# Register cluster to fleet
gcloud container fleet memberships register my-cluster \
  --gke-cluster us-central1-a/my-cluster \
  --enable-workload-identity \
  --project my-gcp-project

# List fleet memberships
gcloud container fleet memberships list --project my-gcp-project

# Describe fleet membership
gcloud container fleet memberships describe my-cluster \
  --project my-gcp-project
```

---

### 50. KCC — Full Production Cluster Stack
A complete production-ready cluster with all security and observability settings.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: production-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  releaseChannel:
    channel: REGULAR
  workloadIdentityConfig:
    workloadPool: my-gcp-project.svc.id.goog
  binaryAuthorization:
    evaluationMode: PROJECT_SINGLETON_POLICY_ENFORCE
  shieldedNodes:
    enabled: true
  datapathProvider: ADVANCED_DATAPATH
  privateClusterConfig:
    enablePrivateNodes: true
    enablePrivateEndpoint: false
    masterIpv4CidrBlock: 172.16.0.0/28
  masterAuthorizedNetworksConfig:
    cidrBlocks:
      - cidrBlock: 10.0.0.0/8
        displayName: internal
  databaseEncryption:
    state: ENCRYPTED
    keyName: projects/my-gcp-project/locations/us-central1/keyRings/gke-ring/cryptoKeys/gke-key
  loggingConfig:
    enableComponents:
      - SYSTEM_COMPONENTS
      - WORKLOADS
  monitoringConfig:
    enableComponents:
      - SYSTEM_COMPONENTS
      - APISERVER
  maintenancePolicy:
    recurringWindow:
      window:
        startTime: "2024-01-01T02:00:00Z"
        endTime: "2024-01-01T06:00:00Z"
      recurrence: "FREQ=WEEKLY;BYDAY=SA,SU"
  addonsConfig:
    httpLoadBalancing:
      disabled: false
    horizontalPodAutoscaling:
      disabled: false
    gcePersistentDiskCsiDriverConfig:
      enabled: true
  resourceLabels:
    env: production
    team: platform

---

## Expert

### 51. KCC — ContainerCluster with Confidential GKE Nodes
Create a GKE cluster with Confidential Nodes enabled via Config Connector for hardware-level memory encryption using AMD SEV.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: confidential-cluster
  namespace: config-control
spec:
  location: us-central1
  initialNodeCount: 1
  confidentialNodes:
    enabled: true
  nodeConfig:
    machineType: n2d-standard-4
    imageType: COS_CONTAINERD
    shieldedInstanceConfig:
      enableSecureBoot: true
      enableIntegrityMonitoring: true
  releaseChannel:
    channel: REGULAR
  resourceID: confidential-cluster
```

---

### 52. Config Controller — Create Managed KCC Instance
Provision a Config Controller instance (managed KCC) to manage GCP resources declaratively at scale.

```bash
gcloud anthos config controller create my-config-controller \
  --location=us-central1 \
  --full-management
```

---

### 53. Config Controller — Get Credentials and Verify
Retrieve kubeconfig credentials for the Config Controller cluster and verify the KCC installation.

```bash
gcloud anthos config controller get-credentials my-config-controller \
  --location=us-central1

kubectl get pods -n cnrm-system
kubectl get crds | grep cnrm.cloud.google.com | wc -l
```

---

### 54. Cluster Hardening — Disable Metadata Server Access from Pods
Prevent pods from accessing the GCE metadata server by enabling Workload Identity and blocking the legacy metadata endpoint.

```bash
gcloud container clusters create hardened-cluster \
  --zone=us-central1-a \
  --workload-pool=PROJECT_ID.svc.id.goog \
  --metadata=disable-legacy-endpoints=true \
  --no-enable-legacy-authorization \
  --enable-shielded-nodes
```

---

### 55. Enable Pod Security Admission (PSA) with Enforce Namespace Labels
Apply Pod Security Standards at the namespace level using PSA enforce labels to block non-conforming pods.

```bash
kubectl label namespace production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/warn-version=latest \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/audit-version=latest
```

---

### 56. Cluster Bootstrap with Full VPC Controls (Private + Authorized Networks + PSC)
Create a production-grade private GKE cluster with authorized networks, Private Service Connect, and no public endpoint.

```bash
gcloud container clusters create secure-cluster \
  --zone=us-central1-a \
  --enable-private-nodes \
  --enable-private-endpoint \
  --master-ipv4-cidr=172.16.0.0/28 \
  --enable-ip-alias \
  --network=prod-vpc \
  --subnetwork=prod-subnet \
  --enable-master-authorized-networks \
  --master-authorized-networks=10.0.0.0/8 \
  --enable-master-global-access \
  --private-endpoint-subnetwork=control-plane-subnet
```

---

### 57. Multi-Region Active-Active Cluster Setup with Multi-Cluster Ingress
Deploy two regional GKE clusters and configure Multi-Cluster Ingress for global active-active traffic distribution.

```bash
# Create clusters in two regions
gcloud container clusters create cluster-us \
  --region=us-central1 --enable-fleet --fleet-project=PROJECT_ID

gcloud container clusters create cluster-eu \
  --region=europe-west1 --enable-fleet --fleet-project=PROJECT_ID

# Enable Multi-cluster Ingress on the fleet
gcloud container fleet ingress enable \
  --config-membership=projects/PROJECT_ID/locations/us-central1/memberships/cluster-us

# Apply MultiClusterIngress resource
kubectl apply -f multi-cluster-ingress.yaml --context=cluster-us
```

---

### 58. SLSA Compliance — Cluster Creation with Attestation and Binary Authorization
Enable Binary Authorization with attestation enforcement to meet SLSA supply-chain security requirements.

```bash
gcloud container clusters create slsa-cluster \
  --zone=us-central1-a \
  --binauthz-evaluation-mode=PROJECT_SINGLETON_POLICY_ENFORCE

# Create attestor
gcloud container binauthz attestors create my-attestor \
  --attestation-authority-note=projects/PROJECT_ID/notes/my-note \
  --attestation-authority-note-public-keys=my-public-key.pem

# Update policy to require attestation
gcloud container binauthz policy import policy.yaml
```

---

### 59. Cluster-Level Audit Logging — Enable AuditPolicy with Fine-Grained Rules
Configure fine-grained Kubernetes audit logging to capture specific API server events for compliance and security analysis.

```bash
gcloud container clusters create audit-cluster \
  --zone=us-central1-a \
  --enable-cloud-logging \
  --logging=SYSTEM,WORKLOAD,API_SERVER \
  --monitoring=SYSTEM

# Verify audit logs flowing to Cloud Logging
gcloud logging read \
  'logName="projects/PROJECT_ID/logs/cloudaudit.googleapis.com%2Factivity" resource.type="k8s_cluster"' \
  --limit=10 \
  --format=json
```

---

### 60. KCC — ContainerCluster with Config Connector in Namespaced Mode
Deploy a GKE cluster via KCC configured with Config Connector running in namespaced mode for multi-tenant environments.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: namespaced-kcc-cluster
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/project-id: "my-project"
spec:
  location: us-central1-a
  initialNodeCount: 3
  workloadIdentityConfig:
    workloadPool: my-project.svc.id.goog
  addonsConfig:
    configConnectorConfig:
      enabled: true
  releaseChannel:
    channel: STABLE
  resourceID: namespaced-kcc-cluster
```

---

### 61. GKE Sandbox (gVisor) — Enable Node Pool with Sandbox Config
Add a gVisor-enabled node pool to run untrusted workloads in a sandboxed kernel environment.

```bash
gcloud container node-pools create sandbox-pool \
  --cluster=my-cluster \
  --zone=us-central1-a \
  --machine-type=n2-standard-4 \
  --image-type=COS_CONTAINERD \
  --sandbox type=gvisor \
  --num-nodes=2
```

---

### 62. Fleet-Connected Cluster Bootstrap (Register + Config Sync + KCC in One Flow)
Register a GKE cluster to a fleet and enable Config Sync and Config Connector as a single integrated bootstrap operation.

```bash
# Register cluster to fleet
gcloud container fleet memberships register my-cluster \
  --gke-cluster=us-central1-a/my-cluster \
  --enable-workload-identity

# Enable Config Sync on the fleet
gcloud beta container fleet config-management apply \
  --membership=my-cluster \
  --config=config-sync.yaml \
  --project=PROJECT_ID

# Enable Config Connector on the fleet
gcloud container fleet config-management apply \
  --membership=my-cluster \
  --config=kcc-config.yaml
```

---

### 63. Cloud Armor — Attach Security Policy to Cluster Ingress via BackendConfig
Associate a Cloud Armor security policy with a GKE Ingress backend to enable WAF and DDoS protection.

```yaml
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: armor-backend-config
  namespace: production
spec:
  securityPolicy:
    name: my-cloud-armor-policy
---
apiVersion: v1
kind: Service
metadata:
  name: protected-service
  namespace: production
  annotations:
    cloud.google.com/backend-config: '{"default": "armor-backend-config"}'
spec:
  type: ClusterIP
  selector:
    app: protected-app
  ports:
    - port: 80
      targetPort: 8080
```

---

### 64. Advanced Maintenance Exclusions — Block Upgrades During Peak Traffic Windows
Configure maintenance exclusions to prevent GKE auto-upgrades during known high-traffic periods.

```bash
gcloud container clusters update my-cluster \
  --zone=us-central1-a \
  --add-maintenance-exclusion-name=black-friday \
  --add-maintenance-exclusion-start=2024-11-25T00:00:00Z \
  --add-maintenance-exclusion-end=2024-11-30T23:59:59Z \
  --add-maintenance-exclusion-scope=NO_UPGRADES

# Verify exclusions
gcloud container clusters describe my-cluster \
  --zone=us-central1-a \
  --format="yaml(maintenancePolicy)"
```

---

### 65. KCC — Full Immutable Cluster Config (All Security Features Enabled)
Define a fully hardened, immutable GKE cluster via KCC with all security features enabled to eliminate configuration drift.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: immutable-secure-cluster
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: "my-project"
spec:
  location: us-central1
  initialNodeCount: 3
  releaseChannel:
    channel: STABLE
  workloadIdentityConfig:
    workloadPool: my-project.svc.id.goog
  confidentialNodes:
    enabled: true
  binaryAuthorization:
    evaluationMode: PROJECT_SINGLETON_POLICY_ENFORCE
  networkPolicy:
    enabled: true
    provider: CALICO
  enableShieldedNodes: true
  privateClusterConfig:
    enablePrivateNodes: true
    enablePrivateEndpoint: false
    masterIpv4CidrBlock: 172.16.0.0/28
  masterAuthorizedNetworksConfig:
    cidrBlocks:
      - cidrBlock: 10.0.0.0/8
        displayName: internal-only
  addonsConfig:
    networkPolicyConfig:
      disabled: false
    gcePersistentDiskCsiDriverConfig:
      enabled: true
    configConnectorConfig:
      enabled: true
  loggingConfig:
    enableComponents:
      - SYSTEM_COMPONENTS
      - WORKLOADS
      - API_SERVER
  monitoringConfig:
    enableComponents:
      - SYSTEM_COMPONENTS
      - APISERVER
  resourceLabels:
    env: production
    security: hardened
    managed-by: kcc
```
    managed-by: config-connector
