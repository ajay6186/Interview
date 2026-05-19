# KCC Setup and CRDs — Examples

## Basic

### 1. What is Config Connector (KCC)?
Config Connector is a Kubernetes add-on that lets you manage GCP resources using Kubernetes manifests and `kubectl`.

```bash
# KCC translates Kubernetes resources into GCP API calls
# You declare GCP resources as Kubernetes CRDs
# KCC continuously reconciles desired vs actual state

# Example: this Kubernetes resource creates a GCS bucket
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-bucket
spec:
  location: US-CENTRAL1
```

---

### 2. Enable Config Connector Add-on on GKE
Install KCC as a GKE cluster add-on.

```bash
gcloud container clusters update my-cluster \
  --zone us-central1-a \
  --update-addons ConfigConnector=ENABLED
```

---

### 3. Create a KCC Identity (Google Service Account)
Create a GCP Service Account for KCC to use when managing GCP resources.

```bash
# Create the GCP SA
gcloud iam service-accounts create config-connector-sa \
  --project my-gcp-project \
  --description "Config Connector service account"

# Grant it project owner (or more restrictive roles)
gcloud projects add-iam-policy-binding my-gcp-project \
  --member "serviceAccount:config-connector-sa@my-gcp-project.iam.gserviceaccount.com" \
  --role "roles/owner"

# Allow KCC's Kubernetes SA to impersonate it (Workload Identity)
gcloud iam service-accounts add-iam-policy-binding \
  config-connector-sa@my-gcp-project.iam.gserviceaccount.com \
  --member "serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]" \
  --role "roles/iam.workloadIdentityUser"
```

---

### 4. Configure Config Connector (Cluster Mode)
Apply the ConfigConnector resource to configure KCC for the cluster.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: "config-connector-sa@my-gcp-project.iam.gserviceaccount.com"
```

---

### 5. Configure Config Connector (Namespaced Mode)
Run KCC in namespaced mode so different namespaces can manage different GCP projects.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: namespaced
```

---

### 6. Create a ConfigConnectorContext (Namespaced Mode)
Bind a namespace to a specific GCP project and service account.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-a
spec:
  googleServiceAccount: "team-a-sa@my-gcp-project.iam.gserviceaccount.com"
  requestProjectPolicy: BILLING_PROJECT_IN_RESOURCE_ANNOTATION
```

---

### 7. Annotate a Namespace with GCP Project ID
Tell KCC which GCP project a namespace's resources belong to.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
```

---

### 8. List All KCC CRDs
View all GCP resource types KCC can manage.

```bash
kubectl get crds | grep cnrm.cloud.google.com
kubectl get crds | grep cnrm.cloud.google.com | wc -l   # count

# List by service
kubectl get crds | grep storage.cnrm
kubectl get crds | grep compute.cnrm
kubectl get crds | grep container.cnrm
kubectl get crds | grep iam.cnrm
```

---

### 9. Check KCC Health
Verify that the Config Connector pods are running.

```bash
kubectl get pods -n cnrm-system
kubectl describe pod -n cnrm-system -l cnrm.cloud.google.com/system: "true"

# Check operator logs
kubectl logs -n cnrm-system -l cnrm.cloud.google.com/component=cnrm-controller-manager
```

---

### 10. Install Config Connector Manually (Non-GKE Add-on)
Install KCC on any Kubernetes cluster using the operator bundle.

```bash
# Download KCC operator
gsutil cp gs://configconnector-operator/latest/release-bundle.tar.gz release-bundle.tar.gz
tar zxvf release-bundle.tar.gz

# Install the operator
kubectl apply -f operator-system/configconnector-operator.yaml

# Wait for operator to be ready
kubectl wait -n configconnector-operator-system \
  --for=condition=Ready pod \
  --selector cnrm.cloud.google.com/component=cnrm-operator \
  --timeout=5m
```

---

### 11. Create a Simple GCP Resource with KCC
Create a GCS bucket as the "hello world" of Config Connector.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-first-kcc-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
```

```bash
kubectl apply -f bucket.yaml
kubectl get storagebucket my-first-kcc-bucket -n config-connector
```

---

### 12. Check KCC Resource Status
All KCC-managed resources have a `status.conditions` field showing reconciliation state.

```bash
kubectl describe storagebucket my-first-kcc-bucket -n config-connector

# The Ready condition becomes True when resource is created in GCP
kubectl get storagebucket my-first-kcc-bucket -n config-connector \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
```

---

### 13. Delete a KCC Resource
Deleting a KCC resource also deletes the underlying GCP resource (unless abandoned).

```bash
kubectl delete storagebucket my-first-kcc-bucket -n config-connector

# To keep the GCP resource when deleting the KCC resource, add annotation first:
kubectl annotate storagebucket my-first-kcc-bucket \
  cnrm.cloud.google.com/deletion-policy=abandon
```

---

### 14. Adopt Existing GCP Resources with KCC
Import an existing GCP resource into KCC management.

```yaml
# Apply a KCC resource that matches an existing GCP resource
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: existing-bucket    # must match actual GCP resource name
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
# KCC will adopt the existing bucket instead of creating a new one
```

---

### 15. View KCC Resource Events
See what KCC is doing behind the scenes.

```bash
kubectl get events -n config-connector \
  --field-selector involvedObject.name=my-first-kcc-bucket

# Watch KCC controller logs
kubectl logs -n cnrm-system \
  -l cnrm.cloud.google.com/component=cnrm-controller-manager \
  -f
```

---

## Intermediate

### 16. KCC Resource Reference — Cross-Resource Dependencies
Reference another KCC resource instead of hardcoding IDs.

```yaml
apiVersion: sql.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: my-sql-instance
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  databaseVersion: POSTGRES_15
  region: us-central1
  settings:
    tier: db-n1-standard-2
    ipConfiguration:
      privateNetworkRef:
        name: my-vpc   # references a ComputeNetwork KCC resource
```

---

### 17. KCC with Kustomize
Manage KCC resources across environments using Kustomize overlays.

```yaml
# base/storagebucket.yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: app-data
  namespace: config-connector
spec:
  location: US-CENTRAL1
  storageClass: STANDARD
---
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
patches:
  - target:
      kind: StorageBucket
      name: app-data
    patch: |
      - op: replace
        path: /metadata/annotations/cnrm.cloud.google.com~1project-id
        value: production-project
```

---

### 18. KCC — Namespace-Level Project Annotation
Avoid repeating project-id annotations on every resource.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-backend
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
# Now all resources in this namespace default to my-gcp-project
```

---

### 19. KCC — Cross-Project Resource References
Reference a resource in a different GCP project.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: cross-project-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: source-project
spec:
  displayName: "Cross-project service account"
---
# Reference in another project's resource
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucketAccessControl
metadata:
  name: bucket-access
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: target-project
spec:
  bucketRef:
    name: shared-bucket
  entity: serviceAccount:cross-project-sa@source-project.iam.gserviceaccount.com
  role: READER
```

---

### 20. KCC — Manage Resources in Multiple GCP Projects
Use namespaced mode with per-namespace ConfigConnectorContexts.

```yaml
# team-a manages resources in project-a
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-a
spec:
  googleServiceAccount: "team-a@project-a.iam.gserviceaccount.com"
---
# team-b manages resources in project-b
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-b
spec:
  googleServiceAccount: "team-b@project-b.iam.gserviceaccount.com"
```

---

### 21. KCC Resource Deletion Policy — Abandon
Keep the GCP resource when the KCC resource is deleted.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: important-data
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
    cnrm.cloud.google.com/deletion-policy: abandon   # don't delete GCP resource
spec:
  location: US-CENTRAL1
```

---

### 22. KCC Reconciliation — Force Re-sync
Force KCC to re-reconcile a resource against GCP.

```bash
# Add/update an annotation to trigger reconciliation
kubectl annotate storagebucket my-bucket \
  cnrm.cloud.google.com/reconcile-trigger=$(date +%s) \
  --overwrite

# Or delete and recreate the resource
kubectl delete storagebucket my-bucket
kubectl apply -f bucket.yaml
```

---

### 23. KCC — Manage GKE Add-ons via ConfigConnector
Enable/disable GKE add-ons declaratively.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: managed-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  initialNodeCount: 2
  addonsConfig:
    configConnectorConfig:
      enabled: true      # enable KCC add-on
    gcePersistentDiskCsiDriverConfig:
      enabled: true
    gcsFuseCsiDriverConfig:
      enabled: true
```

---

### 24. KCC — Version Pinning and Upgrades
Pin KCC to a specific version for stability.

```bash
# Check installed KCC version
kubectl get pods -n cnrm-system -o jsonpath='{.items[0].spec.containers[0].image}'

# Upgrade KCC by updating the operator bundle
gsutil cp gs://configconnector-operator/1.118.0/release-bundle.tar.gz .
tar zxvf release-bundle.tar.gz
kubectl apply -f operator-system/configconnector-operator.yaml
```

---

### 25. KCC — Dry Run Before Applying
Preview what KCC will do before applying changes.

```bash
kubectl apply -f resource.yaml --dry-run=server
kubectl apply -f resource.yaml --dry-run=client

# Diff current state vs desired state
kubectl diff -f resource.yaml
```

---

### 26. KCC — Resource Export (Reverse Engineering)
Export existing GCP resources as KCC manifests.

```bash
# Install config-connector CLI tool
# Export a GCS bucket as KCC YAML
config-connector export \
  --project my-gcp-project \
  --kind StorageBucket \
  --name my-existing-bucket \
  --output bucket.yaml
```

---

### 27. KCC — Bulk Apply with kubectl
Apply all KCC resources in a directory at once.

```bash
# Apply all YAML files in a directory
kubectl apply -f infra/gcp-resources/

# Apply with kustomize
kubectl apply -k infra/overlays/production/

# Dry run first
kubectl apply -f infra/gcp-resources/ --dry-run=server
```

---

### 28. KCC — Resource Status Polling
Wait for a KCC resource to be ready.

```bash
# Wait for StorageBucket to be ready
kubectl wait storagebucket my-bucket \
  --for=condition=Ready \
  --timeout=5m \
  -n config-connector

# Poll until ready
until kubectl get storagebucket my-bucket -n config-connector \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep -q True; do
  echo "Waiting..."
  sleep 5
done
```

---

### 29. KCC Error Handling — Common Issues
Debug common KCC resource failures.

```bash
# Resource stuck in not-ready state
kubectl describe storagebucket my-bucket -n config-connector | grep -A 10 Conditions

# Common causes:
# 1. Missing permissions on the KCC service account
# 2. GCP API not enabled
# 3. Resource name conflict
# 4. Invalid field values

# Check KCC controller logs for details
kubectl logs -n cnrm-system \
  -l cnrm.cloud.google.com/component=cnrm-controller-manager \
  --tail=100 | grep ERROR
```

---

### 30. KCC — RBAC for Managing Config Connector Resources
Grant team members permission to manage specific KCC resource types.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: kcc-storage-manager
  namespace: config-connector
rules:
  - apiGroups: ["storage.cnrm.cloud.google.com"]
    resources: ["storagebuckets"]
    verbs: ["get", "list", "create", "update", "patch", "delete"]
  - apiGroups: ["storage.cnrm.cloud.google.com"]
    resources: ["storagebuckets/status"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-storage-manager
  namespace: config-connector
subjects:
  - kind: User
    name: team-a-developer@my-project.iam.gserviceaccount.com
roleRef:
  kind: Role
  name: kcc-storage-manager
  apiGroup: rbac.authorization.k8s.io
```

---

## Nested

### 31. KCC — Full Project Bootstrap
Create a new GCP project and all required APIs/services via KCC.

```yaml
apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: new-team-project
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: parent-project
spec:
  name: New Team Project
  organizationRef:
    external: "123456789"
  billingAccountRef:
    external: "ABCDEF-123456-GHIJKL"
---
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: compute-api
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: new-team-project
spec:
  resourceID: compute.googleapis.com
---
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: container-api
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: new-team-project
spec:
  resourceID: container.googleapis.com
```

---

### 32. KCC — Service Account + Workload Identity Binding
Create a GCP SA and wire it to a Kubernetes SA via Workload Identity.

```yaml
# GCP Service Account
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: app-gcp-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Application GCP Service Account"
---
# IAM binding: Kubernetes SA can impersonate GCP SA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: workload-identity-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    kind: IAMServiceAccount
    name: app-gcp-sa
  bindings:
    - role: roles/iam.workloadIdentityUser
      members:
        - member: serviceAccount:my-gcp-project.svc.id.goog[default/app-ksa]
---
# Kubernetes Service Account with annotation
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-ksa
  namespace: default
  annotations:
    iam.gke.io/gcp-service-account: app-gcp-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 33. KCC — Enable GCP APIs Declaratively
Enable required GCP APIs before provisioning resources.

```yaml
# Enable all required APIs for a GKE + KCC deployment
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: container-api
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: container.googleapis.com
---
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: cloudresourcemanager-api
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: cloudresourcemanager.googleapis.com
---
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: sqladmin-api
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: sqladmin.googleapis.com
```

---

### 34. KCC — Resource Hierarchy (Folders and Projects)
Manage GCP organizational hierarchy via KCC.

```yaml
apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Folder
metadata:
  name: engineering-folder
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: org-management-project
spec:
  displayName: Engineering
  organizationRef:
    external: "123456789"
---
apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
kind: Project
metadata:
  name: backend-team-project
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: org-management-project
spec:
  name: Backend Team
  folderRef:
    name: engineering-folder
  billingAccountRef:
    external: "ABCDEF-123456-GHIJKL"
```

---

### 35. KCC — GitOps with Config Sync Integration
Integrate KCC with Config Sync for GitOps management of GCP resources.

```yaml
# .gitsync/rootsync.yaml — sync GCP infra from git
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: infra-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/gcp-infra
    branch: main
    dir: kcc-resources
    auth: gcpserviceaccount
    gcpServiceAccountEmail: config-sync-sa@my-project.iam.gserviceaccount.com
  override:
    resources:
      - group: storage.cnrm.cloud.google.com
        kind: StorageBucket
        name: "*"
        namespaces: ["*"]
```

---

### 36. KCC — Conditional Resource Creation with Labels
Use Kustomize to enable/disable KCC resources per environment.

```yaml
# base/pubsub-topic.yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: app-events
  namespace: config-connector
  labels:
    environment: base
spec:
  messageRetentionDuration: "86400s"
---
# overlays/production/patch.yaml
- op: replace
  path: /spec/messageRetentionDuration
  value: "604800s"   # 7 days in production
```

---

### 37. KCC — Monitoring KCC Resource Reconciliation
Track KCC resource health via Cloud Monitoring metrics.

```bash
# KCC exports metrics to Cloud Monitoring
# Key metrics:
# - cnrm.cloud.google.com/kcc_resource_reconcile_count
# - cnrm.cloud.google.com/kcc_resource_reconcile_errors

# Create a dashboard query
gcloud monitoring dashboards create \
  --config-from-file kcc-dashboard.json

# Alert on reconciliation errors
gcloud alpha monitoring policies create \
  --notification-channels=my-channel \
  --display-name="KCC Reconciliation Errors" \
  --condition-filter='metric.type="custom.googleapis.com/kcc_reconcile_errors"'
```

---

### 38. KCC — Namespace-Scoped vs Cluster-Scoped Resources
Understand which KCC resources are namespace vs cluster scoped.

```bash
# Namespace-scoped (most resources — tied to a GCP project)
kubectl api-resources --namespaced=true | grep cnrm

# Cluster-scoped (project-level and above)
kubectl api-resources --namespaced=false | grep cnrm

# Examples of cluster-scoped KCC resources:
# - resourcemanager.cnrm.cloud.google.com/v1beta1 Project
# - resourcemanager.cnrm.cloud.google.com/v1beta1 Folder
```

---

### 39. KCC — Field Reference vs External Reference
Use `nameRef` for KCC-managed resources, `external` for pre-existing GCP resources.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
  # Reference a KCC-managed resource by name
  encryptionKey:
    kmsKeyRef:
      name: my-kms-key             # KCC-managed resource
      # OR: external reference to pre-existing resource
      # external: "projects/my-project/locations/us-central1/keyRings/my-ring/cryptoKeys/my-key"
```

---

### 40. KCC — Pause/Resume Resource Reconciliation
Temporarily stop KCC from reconciling a resource (e.g., during maintenance).

```bash
# Pause reconciliation
kubectl annotate storagebucket my-bucket \
  cnrm.cloud.google.com/reconciler-pause=true

# Resume reconciliation
kubectl annotate storagebucket my-bucket \
  cnrm.cloud.google.com/reconciler-pause- \
  --overwrite
```

---

## Advanced

### 41. KCC — Multi-Project Architecture with Shared VPC
Manage a shared VPC host project and service projects via KCC.

```yaml
# Host project VPC
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: shared-vpc
  namespace: host-project-ns
  annotations:
    cnrm.cloud.google.com/project-id: host-project
spec:
  autoCreateSubnetworks: false
---
# Service project using shared VPC
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCServiceProject
metadata:
  name: service-project-link
  namespace: host-project-ns
  annotations:
    cnrm.cloud.google.com/project-id: host-project
spec:
  serviceProjectRef:
    external: service-project
```

---

### 42. KCC — Policy Controller Integration
Use Policy Controller to validate KCC resources before they are applied.

```yaml
# Constraint template: require all StorageBuckets to have uniform access
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: gcpstoragebucketuniformaccess
spec:
  crd:
    spec:
      names:
        kind: GCPStorageBucketUniformAccess
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package gcpstoragebucketuniformaccess
        violation[{"msg": msg}] {
          input.review.object.kind == "StorageBucket"
          not input.review.object.spec.uniformBucketLevelAccess
          msg := "StorageBucket must have uniformBucketLevelAccess enabled"
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: GCPStorageBucketUniformAccess
metadata:
  name: require-uniform-access
spec:
  enforcementAction: deny
  match:
    kinds:
      - apiGroups: ["storage.cnrm.cloud.google.com"]
        kinds: ["StorageBucket"]
```

---

### 43. KCC — Automated GCP Resource Inventory
Use KCC to maintain an always-current inventory of GCP resources.

```bash
# Get all KCC-managed resources across all types
kubectl get $(kubectl get crds -o name | grep cnrm | \
  xargs -I{} kubectl get crds {} -o jsonpath='{.spec.names.plural}' | \
  tr '\n' ',' | sed 's/,$//') \
  -A -o json > gcp-inventory.json

# Count resources by type
kubectl get crds -o name | grep cnrm | while read crd; do
  KIND=$(kubectl get $crd -o jsonpath='{.spec.names.plural}')
  COUNT=$(kubectl get $KIND -A --no-headers 2>/dev/null | wc -l)
  echo "$KIND: $COUNT"
done
```

---

### 44. KCC — Blue-Green Infrastructure Rollout
Deploy a complete new GCP infrastructure stack alongside the current one.

```bash
# Apply blue (current) resources with blue label
kubectl apply -f infra/ -l version=blue

# Deploy green (new) infrastructure
kubectl apply -f infra-v2/ -l version=green

# Verify green is healthy
kubectl get storagebucket,sqldatabase,pubsubtopic \
  -A -l version=green \
  -o jsonpath='{range .items[*]}{.metadata.name}: {.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'

# Switch traffic to green (update App configs)
# Remove blue resources
kubectl delete storagebucket,sqldatabase -l version=blue -A
```

---

### 45. KCC — Resource Dependency Graph
Understand and manage dependencies between KCC resources.

```yaml
# VPC must be created before Subnet
# Subnet must be created before GKE Cluster
# GKE Cluster must be created before ConfigConnectorContext

# KCC handles this via resource references
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: app-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: app-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.0.0.0/24
  networkRef:
    name: app-vpc   # KCC waits for app-vpc to be ready first
```

---

### 46. KCC — Audit and Compliance Reporting
Generate compliance reports from KCC resource state.

```bash
# Check all KCC resources for compliance
# Find buckets without versioning enabled
kubectl get storagebuckets -A -o json | \
  jq '.items[] | select(.spec.versioning.enabled != true) | .metadata.name'

# Find SQL instances without SSL required
kubectl get sqlinstances -A -o json | \
  jq '.items[] | select(.spec.settings.ipConfiguration.requireSsl != true) | .metadata.name'

# Generate full compliance report
kubectl get storagebuckets,sqldatabases,computenetworks -A -o yaml > compliance-report.yaml
```

---

### 47. KCC — High Availability KCC Controller Setup
Run KCC controller with leader election for HA.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: "config-connector-sa@my-gcp-project.iam.gserviceaccount.com"
  # Controller runs with 2 replicas; leader election ensures only one is active
  # Configure via operator settings
```

```bash
# Verify HA setup
kubectl get pods -n cnrm-system
# Should see multiple cnrm-controller-manager pods
```

---

### 48. KCC — Custom Resource Transformation with CEL
Use Config Controller (managed KCC) with advanced policy validation.

```yaml
# Config Controller is a managed KCC + Policy Controller instance
# Create via GKE Hub
gcloud alpha anthos config controller create my-config-controller \
  --location us-central1 \
  --full-management

# Connect to Config Controller cluster
gcloud alpha anthos config controller get-credentials my-config-controller \
  --location us-central1
```

---

### 49. KCC — Resource State Machine Monitoring
Build alerts around KCC resource state transitions.

```yaml
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  name: kcc-resource-failures
spec:
  displayName: "KCC Resource Reconciliation Failures"
  conditions:
    - displayName: "KCC resources not ready > 5 min"
      conditionAbsent:
        filter: >
          resource.type="k8s_container"
          metric.type="kubernetes.io/container/restart_count"
          resource.labels.container_name="cnrm-controller-manager"
        duration: 300s
  notificationChannels:
    - projects/my-project/notificationChannels/1234567890
```

---

### 50. Full KCC Infrastructure Bootstrap
Complete bootstrap: project, APIs, VPC, GKE cluster, and KCC setup.

```yaml
# 1. Enable APIs
apiVersion: serviceusage.cnrm.cloud.google.com/v1beta1
kind: Service
metadata:
  name: enable-container-api
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: container.googleapis.com
---
# 2. Create VPC
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: production-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
---
# 3. Create Subnet
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.1.0.0/16
  networkRef:
    name: production-vpc
  secondaryIpRange:
    - rangeName: pods
      ipCidrRange: 10.2.0.0/16
    - rangeName: services
      ipCidrRange: 10.3.0.0/20
---
# 4. Create GKE Cluster
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: production-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  networkRef:
    name: production-vpc
  subnetworkRef:
    name: gke-subnet
  ipAllocationPolicy:
    useIpAliases: true
    clusterSecondaryRangeName: pods
    servicesSecondaryRangeName: services
  workloadIdentityConfig:
    workloadPool: my-gcp-project.svc.id.goog
  addonsConfig:
    configConnectorConfig:
      enabled: true
  releaseChannel:
    channel: REGULAR
  initialNodeCount: 3

---

## Expert

### 51. KCC Webhook — Configure Admission Webhook for Resource Validation
Register a validating admission webhook so KCC rejects invalid resource specs before they reach the controller.

```bash
# KCC installs its webhook automatically; verify it is registered
kubectl get validatingwebhookconfiguration \
  | grep cnrm

# Inspect the webhook configuration
kubectl describe validatingwebhookconfiguration \
  cnrm-validating-webhook

# Patch the webhook failure policy to Fail (strict mode)
kubectl patch validatingwebhookconfiguration \
  cnrm-validating-webhook \
  --type=json \
  -p='[{"op":"replace","path":"/webhooks/0/failurePolicy","value":"Fail"}]'
```

---

### 52. KCC Performance Tuning — Increase Controller QPS Limits
Raise the Kubernetes client QPS and burst limits so KCC reconciles large resource sets faster.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: kcc-sa@my-gcp-project.iam.gserviceaccount.com
  # Controller resource tuning
  stateIntoSpec: Merge
---
# Patch the controller manager deployment directly
# kubectl -n cnrm-system patch deployment cnrm-controller-manager \
#   --type=json \
#   -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kube-api-qps=100"},
#        {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kube-api-burst=200"}]'
```

---

### 53. KCC Watch-Only Mode for Resource Import Without Management
Set KCC to observe existing GCP resources without taking ownership, enabling safe import workflows.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: config-connector
spec:
  googleServiceAccount: kcc-sa@my-gcp-project.iam.gserviceaccount.com
  # annotate individual resources with abandon policy so KCC never deletes
```

```bash
# Annotate a resource to prevent deletion (watch-only behaviour)
kubectl annotate storagebucket my-bucket \
  -n config-connector \
  cnrm.cloud.google.com/deletion-policy=abandon

# Bulk-annotate all resources in a namespace
kubectl get crd -o name | while read crd; do
  resource=$(echo $crd | cut -d/ -f2 | cut -d. -f1)
  kubectl annotate $resource --all \
    -n config-connector \
    cnrm.cloud.google.com/deletion-policy=abandon \
    --overwrite 2>/dev/null || true
done
```

---

### 54. KCC Managed (Config Controller) — Create via gcloud
Provision a managed Config Controller instance (hosted KCC + Config Sync + Policy Controller).

```bash
# Enable required APIs
gcloud services enable krmapihosting.googleapis.com \
  --project my-gcp-project

# Create a Config Controller instance
gcloud anthos config controller create my-config-controller \
  --location us-central1 \
  --project my-gcp-project

# Check status
gcloud anthos config controller describe my-config-controller \
  --location us-central1 \
  --project my-gcp-project
```

---

### 55. Config Controller — Connect and Deploy Resources
Authenticate to Config Controller and apply KCC resources through it.

```bash
# Get credentials for Config Controller
gcloud anthos config controller get-credentials my-config-controller \
  --location us-central1 \
  --project my-gcp-project

# Verify KCC is running inside Config Controller
kubectl get pods -n cnrm-system

# Grant the Config Controller SA project owner for bootstrapping
SA_EMAIL=$(kubectl get ConfigConnectorContext \
  -n config-control \
  -o jsonpath='{.items[0].spec.googleServiceAccount}')

gcloud projects add-iam-policy-binding my-gcp-project \
  --member "serviceAccount:${SA_EMAIL}" \
  --role roles/owner

# Apply a resource
kubectl apply -f my-resource.yaml -n config-control
```

---

### 56. KCC + Terraform Interop — Import Terraform-Managed Resources into KCC
Adopt resources created by Terraform into KCC management without recreation.

```bash
# 1. Export the existing resource state from Terraform
terraform state show google_storage_bucket.my_bucket

# 2. Create a matching KCC manifest (with same resource name/project)
cat <<EOF | kubectl apply -f -
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-existing-bucket
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: US-CENTRAL1
EOF

# 3. KCC will detect the resource already exists and adopt it
kubectl get storagebucket my-existing-bucket \
  -n config-connector -o jsonpath='{.status.conditions}'

# 4. Remove from Terraform state to avoid dual management
terraform state rm google_storage_bucket.my_bucket
```

---

### 57. KCC Resource Validation with CEL (Common Expression Language)
Use Policy Controller (Gatekeeper) CEL-based constraints to validate KCC resources before apply.

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: KCCStorageBucketPublicAccessRequired
metadata:
  name: require-public-access-prevention
spec:
  match:
    kinds:
      - apiGroups: ["storage.cnrm.cloud.google.com"]
        kinds: ["StorageBucket"]
  parameters:
    requiredValue: "enforced"
---
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: kccstoragebuketpublicaccessrequired
spec:
  crd:
    spec:
      names:
        kind: KCCStorageBucketPublicAccessRequired
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package kccstoragebuketpublicaccessrequired
        violation[{"msg": msg}] {
          input.review.object.kind == "StorageBucket"
          input.review.object.spec.publicAccessPrevention != input.parameters.requiredValue
          msg := "StorageBucket must have publicAccessPrevention: enforced"
        }
```

---

### 58. KCC Custom Resource Transformation — Kustomize Preprocessing
Use Kustomize to patch KCC manifests per environment before applying.

```bash
# kustomization.yaml for production overlay
cat > kustomization.yaml <<EOF
resources:
  - ../../base
patches:
  - target:
      kind: SQLInstance
      name: app-postgres
    patch: |-
      - op: replace
        path: /spec/settings/tier
        value: db-n1-highmem-8
      - op: replace
        path: /spec/settings/availabilityType
        value: REGIONAL
commonAnnotations:
  cnrm.cloud.google.com/project-id: my-gcp-project
namePrefix: prod-
EOF

# Build and apply
kubectl apply -k overlays/production/
```

---

### 59. KCC — Namespace-to-Project Mapping at Scale (100+ Namespaces)
Automate namespace creation and per-namespace project annotation for large multi-tenant clusters.

```bash
#!/bin/bash
# bulk-create-namespaces.sh
PROJECTS=(proj-alpha proj-beta proj-gamma)   # extend to 100+

for PROJECT in "${PROJECTS[@]}"; do
  NS="kcc-${PROJECT}"
  kubectl create namespace "$NS" --dry-run=client -o yaml | \
    kubectl apply -f -

  kubectl annotate namespace "$NS" \
    cnrm.cloud.google.com/project-id="$PROJECT" \
    --overwrite

  kubectl apply -f - <<EOF
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: $NS
spec:
  googleServiceAccount: kcc-sa@${PROJECT}.iam.gserviceaccount.com
EOF
done
```

---

### 60. KCC Rollback — Revert Resource to Previous State Using Git History
Use Git to retrieve a previous version of a KCC manifest and re-apply it.

```bash
# View the commit history for a resource file
git log --oneline -- kcc/storage/prod-bucket.yaml

# Retrieve the manifest from 2 commits ago
git show HEAD~2:kcc/storage/prod-bucket.yaml > /tmp/prod-bucket-prev.yaml

# Diff to verify what will change
kubectl diff -f /tmp/prod-bucket-prev.yaml

# Re-apply the previous version
kubectl apply -f /tmp/prod-bucket-prev.yaml

# Confirm KCC reconciled back to the old spec
kubectl get storagebucket prod-bucket \
  -n config-connector \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
```

---

### 61. KCC Chaos Testing — Validate Resource Drift Detection and Reconciliation
Deliberately mutate a GCP resource out-of-band and confirm KCC reconciles it back.

```bash
# Baseline: record current bucket storage class
kubectl get storagebucket prod-uploads \
  -n config-connector \
  -o jsonpath='{.spec.storageClass}'

# Introduce drift: change storage class directly in GCP (bypassing KCC)
gsutil defstorageclass set NEARLINE gs://prod-uploads

# Wait one reconciliation cycle (default 10 min) or force it
kubectl annotate storagebucket prod-uploads \
  -n config-connector \
  cnrm.cloud.google.com/reconcile-interval-seconds="10" \
  --overwrite

# Watch KCC restore STANDARD storage class
kubectl get events -n config-connector \
  --field-selector reason=Updating \
  --watch
```

---

### 62. KCC Observability — Custom Cloud Monitoring Alert for Reconcile Latency
Create a Cloud Monitoring alert that fires when KCC reconcile latency exceeds a threshold.

```bash
# Create an alert policy for KCC reconcile errors
gcloud alpha monitoring policies create \
  --project my-gcp-project \
  --display-name "KCC High Reconcile Error Rate" \
  --condition-display-name "cnrm reconcile errors > 5/min" \
  --condition-filter \
    'resource.type="k8s_container"
     metric.type="logging.googleapis.com/user/kcc_reconcile_errors"
     resource.labels.namespace_name="cnrm-system"' \
  --condition-threshold-value 5 \
  --condition-threshold-duration 60s \
  --condition-comparison COMPARISON_GT \
  --notification-channels projects/my-gcp-project/notificationChannels/MY_CHANNEL

# Create a log-based metric for reconcile errors first
gcloud logging metrics create kcc_reconcile_errors \
  --project my-gcp-project \
  --description "KCC controller reconcile errors" \
  --log-filter \
    'resource.type="k8s_container"
     resource.labels.namespace_name="cnrm-system"
     severity=ERROR
     textPayload:"reconcile error"'
```

---

### 63. KCC — Bulk Resource Migration Between GCP Projects
Move KCC-managed resources from one GCP project to another by re-annotating and re-applying.

```bash
#!/bin/bash
# migrate-kcc-resources.sh
SOURCE_PROJECT=my-gcp-project
DEST_PROJECT=my-new-project
NAMESPACE=config-connector

# Export all KCC resources from source namespace
kubectl get $(kubectl api-resources \
    --api-group=storage.cnrm.cloud.google.com \
    -o name | tr '\n' ',') \
  -n $NAMESPACE -o yaml > /tmp/kcc-export.yaml

# Swap project annotation
sed -i \
  "s/cnrm.cloud.google.com\/project-id: ${SOURCE_PROJECT}/cnrm.cloud.google.com\/project-id: ${DEST_PROJECT}/g" \
  /tmp/kcc-export.yaml

# Remove status and resourceVersion fields
kubectl neat < /tmp/kcc-export.yaml > /tmp/kcc-clean.yaml

# Apply to destination cluster/namespace
kubectl apply -f /tmp/kcc-clean.yaml -n $NAMESPACE
```

---

### 64. KCC — Resource Export of Entire Project to Git
Use `config-connector export` to snapshot all GCP project resources into Git-tracked YAML.

```bash
# Install the config-connector CLI plugin
gcloud components install config-connector

# Export all supported resources from the project
config-connector export \
  --project my-gcp-project \
  --output-dir ./kcc-export/ \
  --oauth2-token $(gcloud auth print-access-token)

# Organise by resource kind and commit
cd kcc-export/
git init
git add .
git commit -m "Initial KCC export of my-gcp-project $(date +%Y-%m-%d)"

# Push to remote for GitOps
git remote add origin https://github.com/my-org/gcp-infra
git push -u origin main
```

---

### 65. KCC — Production Readiness Checklist and Deployment Script
Validate all production KCC prerequisites and deploy with a single idempotent script.

```bash
#!/bin/bash
set -euo pipefail
PROJECT=my-gcp-project
CLUSTER=production-cluster
REGION=us-central1

echo "=== KCC Production Readiness Check ==="

# 1. Workload Identity enabled
gcloud container clusters describe $CLUSTER \
  --region $REGION --project $PROJECT \
  --format="value(workloadIdentityConfig.workloadPool)" | \
  grep -q "svc.id.goog" && echo "[OK] Workload Identity" || echo "[FAIL] Workload Identity"

# 2. KCC SA has required roles
gcloud projects get-iam-policy $PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.members:kcc-sa@${PROJECT}.iam.gserviceaccount.com" \
  --format="value(bindings.role)" | grep -q "roles/owner" && \
  echo "[OK] KCC SA roles" || echo "[WARN] KCC SA roles — check least-privilege"

# 3. KCC pods healthy
kubectl get pods -n cnrm-system \
  --field-selector=status.phase!=Running 2>/dev/null | \
  grep -q "No resources" && echo "[OK] KCC pods running" || echo "[FAIL] Unhealthy KCC pods"

# 4. Webhook registered
kubectl get validatingwebhookconfiguration \
  | grep -q cnrm && echo "[OK] Webhook registered" || echo "[FAIL] Webhook missing"

# 5. Apply baseline resources
kubectl apply -f kcc/namespaces/ --dry-run=server
kubectl apply -f kcc/iam/
kubectl apply -f kcc/networking/
kubectl apply -f kcc/databases/
kubectl apply -f kcc/storage/

echo "=== Deployment Complete ==="
```
