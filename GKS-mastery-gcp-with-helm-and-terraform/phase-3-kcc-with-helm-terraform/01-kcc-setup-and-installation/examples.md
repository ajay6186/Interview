# KCC Setup and Installation — Examples

**Topic:** Kubernetes Config Connector (KCC) Setup and Installation on GKE with Terraform and Helm
**GCP Project:** my-gcp-project | **Cluster:** my-gke-cluster | **Region:** us-central1
**KCC apiVersion:** cnrm.cloud.google.com/v1beta1 | **Terraform google provider:** ~> 5.0

---

## BASIC (Examples 1–13)

### Example 1: Enable KCC Addon via Terraform on GKE
**Concept:** The Config Connector addon can be enabled directly on a GKE cluster through Terraform's `google_container_cluster` resource.
```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  initial_node_count = 3

  addons_config {
    config_connector_config {
      enabled = true
    }
  }

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }
}
```
**Explanation:** Setting `config_connector_config.enabled = true` inside `addons_config` instructs GKE to deploy the KCC addon automatically. Workload Identity must also be enabled on the cluster because KCC uses it to authenticate to GCP APIs. This approach delegates the KCC lifecycle to GKE, so upgrades happen alongside node pool updates. It is the simplest path for clusters that do not require a custom KCC version.

---

### Example 2: Install KCC via Helm Chart
**Concept:** KCC can be deployed to an existing GKE cluster using the official Helm chart from the Google artifact registry.
```bash
# Add the Google KCC Helm repository
helm repo add kcc https://googlecloudplatform.github.io/k8s-config-connector/charts
helm repo update

# Install KCC into the cnrm-system namespace
helm install config-connector kcc/config-connector \
  --namespace cnrm-system \
  --create-namespace \
  --version 1.117.0 \
  --set global.project=my-gcp-project \
  --set global.clusterName=my-gke-cluster
```
**Explanation:** The Helm chart creates the `cnrm-system` namespace and deploys all KCC controllers, CRDs, webhooks, and RBAC manifests in one operation. Specifying `--version` pins the KCC release to ensure reproducible deployments across environments. The `global.project` and `global.clusterName` values are embedded into the controller configuration. After installation, verify the pods reach Running state before creating any KCC resources.

---

### Example 3: ConfigConnector CRD — Cluster-Scoped Resource
**Concept:** The `ConfigConnector` custom resource is a cluster-scoped singleton that configures KCC's authentication mode and Google service account identity.
```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: kcc-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** There must be exactly one `ConfigConnector` object per cluster; its metadata name is fixed as the string shown above. The `mode: cluster` field instructs all KCC reconcilers to use a single GCP service account for all namespaces. The `googleServiceAccount` field references the GCP service account whose permissions determine what GCP resources KCC can manage. In namespace mode this field is omitted and per-namespace `ConfigConnectorContext` objects provide the identity instead.

---

### Example 4: ConfigConnectorContext — Namespace-Scoped Identity
**Concept:** `ConfigConnectorContext` binds a specific GCP service account to a Kubernetes namespace, enabling namespace-level identity isolation.
```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-alpha
spec:
  googleServiceAccount: kcc-team-alpha@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** `ConfigConnectorContext` is a namespaced resource and must be created in every namespace that will contain KCC-managed resources. Its metadata name is also a fixed string, similar to `ConfigConnector`. When KCC reconciles resources in `team-alpha`, it impersonates `kcc-team-alpha@my-gcp-project.iam.gserviceaccount.com` using Workload Identity. This design allows different teams to hold least-privilege GCP service accounts scoped to their own GCP projects or resource sets.

---

### Example 5: Annotating a Namespace for KCC Management
**Concept:** Namespaces must carry the `cnrm.cloud.google.com/project-id` annotation to tell KCC which GCP project owns the resources declared within them.
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
```
**Explanation:** Without this annotation, KCC cannot determine the GCP project context and will refuse to reconcile resources in the namespace. The annotation value must be a valid GCP project ID, not a project number. Multiple namespaces can reference the same project ID, enabling logical separation of teams while sharing one GCP project. This annotation is the primary mechanism by which KCC resolves the target project for all resource objects in the namespace.

---

### Example 6: Applying Namespace Annotation via Terraform
**Concept:** Terraform's `kubernetes_namespace_v1` resource can create and annotate the KCC-managed namespace as part of the cluster bootstrap.
```hcl
resource "kubernetes_namespace_v1" "team_alpha" {
  metadata {
    name = "team-alpha"
    annotations = {
      "cnrm.cloud.google.com/project-id" = "my-gcp-project"
    }
  }
}
```
**Explanation:** Declaring the namespace in Terraform alongside the GKE cluster ensures the project annotation is applied before any KCC resources are created. Using `kubernetes_namespace_v1` requires the Kubernetes Terraform provider configured with the GKE cluster credentials. This approach keeps namespace lifecycle management in the same state file as the cluster, simplifying teardown. Terraform destroy will remove the namespace and all KCC-managed GCP resources it contained if `deletionPolicy` on those resources is set to `delete`.

---

### Example 7: Verifying KCC Pods are Running
**Concept:** After installation, confirming that all KCC controller pods in the `cnrm-system` namespace are in the Running state validates a healthy deployment.
```bash
# Check all KCC pods in cnrm-system
kubectl get pods -n cnrm-system

# Expected output pattern:
# NAME                                          READY   STATUS    RESTARTS   AGE
# cnrm-controller-manager-0                    2/2     Running   0          3m
# cnrm-deletiondefender-0                      1/1     Running   0          3m
# cnrm-resource-stats-recorder-xxxxxxx-xxxxx   1/1     Running   0          3m
# cnrm-webhook-manager-xxxxxxx-xxxxx           1/1     Running   0          3m

# Check logs of the main controller
kubectl logs -n cnrm-system cnrm-controller-manager-0 -c manager --tail=50
```
**Explanation:** The `cnrm-controller-manager-0` pod contains the reconciliation loop for all GCP resource types and is the most important pod to verify. The `cnrm-deletiondefender` prevents accidental deletion of resources when the abandon policy is active. The webhook manager handles admission validation for KCC custom resources before they are written to etcd. Restarting pods or checking events in the `cnrm-system` namespace is the first step in diagnosing installation failures.

---

### Example 8: Listing All KCC CRDs
**Concept:** KCC installs hundreds of CRDs, one per supported GCP resource type; listing them confirms the installation is complete.
```bash
# List all KCC CRDs
kubectl get crds | grep cnrm.cloud.google.com

# Count the number of installed KCC CRDs
kubectl get crds | grep cnrm.cloud.google.com | wc -l

# Get details of a specific CRD
kubectl describe crd storagebuckets.storage.cnrm.cloud.google.com

# List available API groups for KCC
kubectl api-resources --api-group=storage.cnrm.cloud.google.com
```
**Explanation:** A complete KCC installation typically registers over 200 CRDs covering GCP services such as BigQuery, Cloud SQL, GKE, IAM, Pub/Sub, and more. Each CRD name follows the pattern `<resourcetype>.<gcp-service>.cnrm.cloud.google.com`. Checking the CRD count against the expected number for a given KCC version is a useful health check. If CRDs are missing, the Helm chart installation may have failed or the GKE addon may not have fully initialized.

---

### Example 9: Basic Resource Test — Creating a GCS Bucket with KCC
**Concept:** A `StorageBucket` manifest is the simplest end-to-end test to confirm KCC can create a real GCP resource.
```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-kcc-test-bucket
  namespace: team-alpha
spec:
  location: us-central1
  uniformBucketLevelAccess: true
  versioning:
    enabled: false
```
**Explanation:** When this manifest is applied, KCC reads the `cnrm.cloud.google.com/project-id` annotation from the `team-alpha` namespace and creates a GCS bucket named `my-kcc-test-bucket` in project `my-gcp-project`. The resource name in Kubernetes becomes the GCP resource name unless overridden by `resourceID`. If the bucket is created successfully, the object's status conditions will show `Ready: True`. This test validates the full KCC flow: webhook admission, Workload Identity auth, GCP API call, and status reconciliation.

---

### Example 10: Checking KCC Resource Status Conditions
**Concept:** KCC resources expose structured status conditions that indicate whether the corresponding GCP resource is in sync with the desired state.
```bash
# Check status conditions on a StorageBucket
kubectl get storagebucket my-kcc-test-bucket -n team-alpha -o yaml

# Use jsonpath for a quick health check
kubectl get storagebucket my-kcc-test-bucket -n team-alpha \
  -o jsonpath='{.status.conditions[*].message}'

# Watch the resource until it becomes Ready
kubectl wait storagebucket/my-kcc-test-bucket \
  --namespace=team-alpha \
  --for=condition=Ready \
  --timeout=120s
```
**Explanation:** The `status.conditions` array follows the standard Kubernetes condition format with `type`, `status`, `reason`, and `message` fields. A `Ready: True` condition means the GCP resource exists and matches the spec. A `Ready: False` condition with reason `UpdateFailed` or `CreateFailed` provides the GCP API error message inline. Using `kubectl wait` is the preferred way to block CI/CD pipelines until resources are confirmed healthy.

---

### Example 11: Describing KCC Status with kubectl describe
**Concept:** `kubectl describe` aggregates status conditions and Kubernetes events for a KCC resource into a human-readable format for quick diagnosis.
```bash
# Describe a StorageBucket resource
kubectl describe storagebucket my-kcc-test-bucket -n team-alpha

# Describe a ConfigConnector object
kubectl describe configconnector configconnector.core.cnrm.cloud.google.com

# Watch events in a namespace for KCC reconciliation activity
kubectl get events -n team-alpha --sort-by='.lastTimestamp' \
  --field-selector reason=UpdateSucceeded

# Get events for a specific resource
kubectl get events -n team-alpha \
  --field-selector involvedObject.name=my-kcc-test-bucket
```
**Explanation:** The Events section of `kubectl describe` shows GCP API calls, retry attempts, and error messages from the KCC reconciler. Successful reconciliation produces an `UpToDate` or `UpdateSucceeded` event. Failed reconciliation events contain the full GCP error, such as permission denied or quota exceeded. Filtering events by `reason` is faster than scanning pod logs when investigating a single resource issue.

---

### Example 12: Helm Values File for KCC Installation
**Concept:** A Helm values file provides a declarative, version-controlled configuration for KCC that is repeatable across environments.
```yaml
# kcc-values.yaml
global:
  project: my-gcp-project
  clusterName: my-gke-cluster

manager:
  resources:
    requests:
      cpu: 100m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

webhookManager:
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi

deletionDefender:
  enabled: true

prometheusMetrics:
  enabled: true
  port: 8888
```
**Explanation:** Externalizing configuration into a values file makes the Helm install command portable and avoids long flag-laden commands. Resource requests and limits prevent KCC from consuming excessive node capacity in shared clusters. Enabling `prometheusMetrics` exposes a scrape endpoint for cluster monitoring systems. Store this file in Git alongside your Terraform code so the cluster bootstrap is fully auditable.

---

### Example 13: Installing KCC with a Helm Values File via Terraform
**Concept:** The Terraform `helm_release` resource can deploy KCC using a values file, integrating Helm into the infrastructure-as-code workflow.
```hcl
resource "helm_release" "config_connector" {
  name             = "config-connector"
  repository       = "https://googlecloudplatform.github.io/k8s-config-connector/charts"
  chart            = "config-connector"
  version          = "1.117.0"
  namespace        = "cnrm-system"
  create_namespace = true

  values = [
    file("${path.module}/kcc-values.yaml")
  ]

  depends_on = [
    google_container_cluster.my_gke_cluster
  ]
}
```
**Explanation:** Using `helm_release` in Terraform ensures KCC is installed as part of the same apply that provisions the GKE cluster. The `depends_on` attribute guarantees the cluster exists and its credentials are available before Helm attempts the install. The `file()` function reads the values file at plan time, making the configuration visible in `terraform plan` diffs. Pinning `version` prevents unintended upgrades when the Helm repository publishes new chart releases.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: Configuring Workload Identity for KCC Service Account
**Concept:** Workload Identity links a Kubernetes service account in `cnrm-system` to a GCP service account, eliminating the need for long-lived credentials.
```hcl
# Create the GCP service account for KCC
resource "google_service_account" "kcc_sa" {
  account_id   = "kcc-sa"
  display_name = "KCC Controller Service Account"
  project      = "my-gcp-project"
}

# Grant it owner or fine-grained roles
resource "google_project_iam_member" "kcc_sa_owner" {
  project = "my-gcp-project"
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.kcc_sa.email}"
}

# Allow the Kubernetes SA to impersonate the GCP SA
resource "google_service_account_iam_binding" "kcc_workload_identity" {
  service_account_id = google_service_account.kcc_sa.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]"
  ]
}
```
**Explanation:** The Workload Identity binding maps the Kubernetes service account `cnrm-controller-manager` in the `cnrm-system` namespace to the GCP service account `kcc-sa@my-gcp-project.iam.gserviceaccount.com`. This allows the KCC pod to obtain short-lived GCP credentials from the metadata server without storing keys. Granting `roles/owner` is the simplest approach for a lab; production environments should scope IAM roles to only the resource types KCC will manage. The binding must exist before KCC pods start; if the cluster and IAM are in the same Terraform apply, `depends_on` ensures ordering.

---

### Example 15: Annotating the KCC Kubernetes Service Account for Workload Identity
**Concept:** The Kubernetes service account used by KCC must be annotated with the GCP service account email to complete the Workload Identity configuration.
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cnrm-controller-manager
  namespace: cnrm-system
  annotations:
    iam.gke.io/gcp-service-account: kcc-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** This annotation tells the GKE metadata server which GCP service account to issue tokens for when the KCC pod makes GCP API requests. When KCC is deployed via Helm, this annotation can be set through the values file using `manager.serviceAccount.annotations`. If the annotation is missing, GCP API calls will fail with a permissions error even if the IAM binding is correct. Verify the annotation is present with `kubectl get sa cnrm-controller-manager -n cnrm-system -o yaml`.

---

### Example 16: Namespace Mode vs Cluster Mode — ConfigConnector Spec
**Concept:** KCC supports two modes: cluster mode uses one GCP SA for all namespaces, while namespace mode uses per-namespace SAs for fine-grained multi-tenancy.
```yaml
# Cluster mode — single GCP SA for all namespaces
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: kcc-sa@my-gcp-project.iam.gserviceaccount.com

---
# Namespace mode — per-namespace GCP SA
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: namespaced
```
**Explanation:** In cluster mode, every KCC-managed resource across all namespaces is reconciled using the same GCP service account, which simplifies setup but reduces isolation. In namespaced mode, the `googleServiceAccount` field is removed from `ConfigConnector` and each namespace must have a `ConfigConnectorContext` with its own GCP SA. Namespaced mode is recommended for multi-tenant clusters where teams manage resources in different GCP projects. Switching between modes requires deleting and recreating the `ConfigConnector` object and restarting KCC pods.

---

### Example 17: Multi-Project KCC Contexts
**Concept:** Multiple `ConfigConnectorContext` objects in different namespaces can target different GCP projects, enabling one cluster to manage resources across many GCP projects.
```yaml
# Namespace for team-alpha targeting project-alpha
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
---
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-alpha
spec:
  googleServiceAccount: kcc-team-alpha@my-gcp-project.iam.gserviceaccount.com
---
# Namespace for team-beta targeting a different project
apiVersion: v1
kind: Namespace
metadata:
  name: team-beta
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project-beta
---
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-beta
spec:
  googleServiceAccount: kcc-team-beta@my-gcp-project-beta.iam.gserviceaccount.com
```
**Explanation:** The `cnrm.cloud.google.com/project-id` annotation on each namespace determines which GCP project receives the resources declared there, while `ConfigConnectorContext` determines which identity is used to make the API calls. The GCP SA in each context must have Workload Identity bindings in their respective projects. This pattern is common in platform engineering where a central GKE cluster acts as a control plane for managing infrastructure across many GCP projects. Each team's GCP SA should hold only the permissions needed for their project.

---

### Example 18: Resource Readiness Conditions — Detailed Status Inspection
**Concept:** KCC resources expose multiple status conditions beyond `Ready`, including `Updating`, `DependenciesMet`, and `ManagementConflict`, which provide detailed reconciliation state.
```bash
# Get full status block of a KCC resource
kubectl get storagebucket my-kcc-test-bucket -n team-alpha \
  -o jsonpath='{.status}' | python3 -m json.tool

# Check for dependency conditions specifically
kubectl get storagebucket my-kcc-test-bucket -n team-alpha \
  -o jsonpath='{.status.conditions[?(@.type=="DependenciesMet")].message}'

# List all resources in a namespace with their Ready status
kubectl get storagebuckets -n team-alpha \
  -o custom-columns=NAME:.metadata.name,READY:.status.conditions[0].status,REASON:.status.conditions[0].reason
```
**Explanation:** The `DependenciesMet` condition becomes `False` when a KCC resource references another KCC resource (via `resourceRef`) that does not yet exist or is not Ready itself. The `ManagementConflict` condition fires when KCC detects that the GCP resource was modified outside of KCC, causing a drift between desired and actual state. Using `custom-columns` output provides a quick dashboard view of many resources at once without querying each one individually. These conditions map to Kubernetes events, so `kubectl get events` provides the same information in a timeline format.

---

### Example 19: Watching KCC Events in Real Time
**Concept:** Streaming Kubernetes events for a namespace shows KCC reconciliation activity and errors as they happen, which is essential during development and debugging.
```bash
# Watch all events in the team-alpha namespace
kubectl get events -n team-alpha -w

# Watch events for a specific resource type
kubectl get events -n team-alpha -w \
  --field-selector involvedObject.kind=StorageBucket

# Watch events across all KCC namespaces
kubectl get events --all-namespaces -w \
  --field-selector reason=UpdateFailed

# Get events sorted by time with full message
kubectl get events -n team-alpha \
  --sort-by='.lastTimestamp' \
  -o custom-columns=TIME:.lastTimestamp,NAME:.involvedObject.name,REASON:.reason,MESSAGE:.message
```
**Explanation:** KCC emits events with reasons such as `UpToDate`, `UpdateSucceeded`, `UpdateFailed`, `CreateSucceeded`, `CreateFailed`, and `Deleting`. Watching with `-w` shows the reconciliation loop in real time, typically firing every 10 seconds for unchanged resources. Filtering by `reason=UpdateFailed` across all namespaces is the fastest way to find any failing resources in a multi-tenant cluster. Events have a default retention of one hour in Kubernetes; for long-term storage, ship events to Cloud Logging using a log exporter.

---

### Example 20: Unmanaged Resources — Abandon Deletion Policy
**Concept:** Setting `cnrm.cloud.google.com/deletion-policy: abandon` causes KCC to leave the GCP resource intact when the Kubernetes object is deleted.
```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-kcc-test-bucket
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/deletion-policy: abandon
spec:
  location: us-central1
  uniformBucketLevelAccess: true
```
**Explanation:** Without the abandon annotation, deleting a KCC resource object will trigger deletion of the underlying GCP resource, which can be catastrophic for production databases or storage buckets. The `abandon` policy is recommended for any stateful GCP resource that holds data or serves live traffic. When a KCC object with `abandon` is deleted, the GCP resource continues to exist and can later be imported into a new KCC object using `resourceID`. This annotation is also useful during migrations when transferring resource ownership from KCC to Terraform or another management tool.

---

### Example 21: Resource Reference Resolution — Cross-Resource Dependencies
**Concept:** KCC resources can reference other KCC resources by name using `resourceRef`, creating dependency graphs that KCC resolves in order.
```yaml
# First, create a KMS KeyRing
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSKeyRing
metadata:
  name: my-keyring
  namespace: team-alpha
spec:
  location: us-central1

---
# Then, create a CryptoKey referencing the KeyRing
apiVersion: kms.cnrm.cloud.google.com/v1beta1
kind: KMSCryptoKey
metadata:
  name: my-crypto-key
  namespace: team-alpha
spec:
  keyRingRef:
    name: my-keyring
  purpose: ENCRYPT_DECRYPT
  rotationPeriod: 7776000s
```
**Explanation:** The `keyRingRef.name` field is a KCC-native resource reference that causes the `KMSCryptoKey` to wait until `my-keyring` exists and is in the Ready state before attempting to create the GCP crypto key. This eliminates the need for manual ordering or `sleep` hacks in CI pipelines. If the referenced resource is in a different namespace, use `keyRingRef.namespace` to specify it explicitly. Reference resolution failures appear as `DependenciesMet: False` conditions on the dependent resource.

---

### Example 22: Importing an Existing GCP Resource into KCC
**Concept:** The `cnrm.cloud.google.com/resource-id` annotation, combined with the resource's GCP identifier, imports an existing GCP resource under KCC management without recreation.
```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-existing-bucket
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/deletion-policy: abandon
spec:
  resourceID: my-existing-production-bucket
  location: us-central1
  uniformBucketLevelAccess: true
```
**Explanation:** The `resourceID` field tells KCC to adopt the GCP resource with that identifier rather than creating a new one. This is the primary import mechanism for bringing pre-existing GCP infrastructure under KCC management. The `deletion-policy: abandon` annotation should always accompany imports to prevent accidental deletion if the manifest is removed. After applying the manifest, check the resource conditions: if the spec diverges from the actual GCP state, KCC will attempt to reconcile the difference by updating the GCP resource.

---

### Example 23: Config Sync Integration — Syncing KCC Resources from Git
**Concept:** Config Sync can watch a Git repository and apply KCC manifests automatically, creating a GitOps loop for GCP infrastructure.
```yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchy
  git:
    repo: https://github.com/my-org/gcp-infra-configs
    branch: main
    dir: environments/production
    auth: token
    secretRef:
      name: git-creds
```
**Explanation:** Config Sync is a separate GKE addon that runs alongside KCC and continuously pulls manifests from the specified Git repository. When a developer commits a new `StorageBucket` or `IAMServiceAccount` manifest to the `environments/production` directory, Config Sync applies it to the cluster, and KCC then creates the corresponding GCP resource. This two-layer approach separates cluster state management (Config Sync) from GCP resource provisioning (KCC). The Git repository becomes the single source of truth for all GCP infrastructure in that environment.

---

### Example 24: Pausing KCC Reconciliation for a Resource
**Concept:** Adding the `cnrm.cloud.google.com/reconciler: none` annotation pauses KCC reconciliation for a specific resource, allowing manual changes to the GCP resource without KCC overwriting them.
```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-kcc-test-bucket
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/deletion-policy: abandon
    cnrm.cloud.google.com/reconciler: none
spec:
  location: us-central1
  uniformBucketLevelAccess: true
```
**Explanation:** Setting `cnrm.cloud.google.com/reconciler: none` is equivalent to a maintenance mode for a single resource; KCC stops watching and reconciling it. This is useful during incident response when you need to manually adjust a GCP resource's configuration without triggering a KCC revert. Remove the annotation to resume normal reconciliation, which will immediately attempt to align GCP state with the Kubernetes spec. Do not leave this annotation in place permanently in production; it defeats the purpose of declarative management.

---

### Example 25: Resource Quota and Rate Limiting Configuration
**Concept:** KCC supports configuring QPS and burst limits for GCP API calls to avoid hitting API quotas in environments with many resources.
```yaml
# kcc-values.yaml with rate limiting
global:
  project: my-gcp-project
  clusterName: my-gke-cluster

manager:
  args:
    - --qps=20
    - --burst=30
    - --reconciler-count=20

  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 2Gi
```
**Explanation:** The `--qps` and `--burst` flags control the token bucket rate limiter for outbound GCP API calls from the KCC controller. Increasing `--reconciler-count` spins up additional reconciliation goroutines, which improves throughput for clusters managing many GCP resources simultaneously. Default QPS of 5 can be too low for clusters with hundreds of KCC-managed resources and frequent spec changes. Monitor GCP API quota consumption in Cloud Console and tune these values if you observe `quotaExceeded` errors in KCC events.

---

### Example 26: Verifying Workload Identity is Functioning for KCC
**Concept:** Running a test workload that calls the GCP metadata server confirms that Workload Identity token exchange is working for the KCC service account.
```bash
# Verify the KCC SA annotation
kubectl get sa cnrm-controller-manager -n cnrm-system -o yaml | grep iam.gke.io

# Exec into the KCC manager pod and test metadata server token retrieval
kubectl exec -n cnrm-system cnrm-controller-manager-0 -c manager -- \
  curl -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"

# Check KCC controller logs for authentication errors
kubectl logs -n cnrm-system cnrm-controller-manager-0 -c manager \
  | grep -i "permission\|auth\|token\|denied" | tail -20

# Verify IAM binding for Workload Identity exists
gcloud iam service-accounts get-iam-policy \
  kcc-sa@my-gcp-project.iam.gserviceaccount.com \
  --project=my-gcp-project
```
**Explanation:** The metadata server request should return a JSON object with `access_token`, `expires_in`, and `token_type` fields if Workload Identity is configured correctly. If it returns an error, check that the GKE cluster has Workload Identity enabled, the GCP SA has the Workload Identity User binding, and the Kubernetes SA has the correct annotation. Authentication errors in KCC logs typically manifest as HTTP 403 responses from GCP APIs. Fixing Workload Identity usually requires restarting the KCC controller pod after correcting the configuration.

---

## NESTED (Examples 27–38)

### Example 27: Full Terraform Bootstrap — GKE Cluster with KCC Addon
**Concept:** A complete Terraform module provisions the GKE cluster, enables the KCC addon, creates the GCP service account, configures Workload Identity, and deploys KCC via Helm in a single apply.
```hcl
# main.tf

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

# GKE Cluster
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }

  addons_config {
    config_connector_config {
      enabled = true
    }
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-nodes"
  location   = "us-central1"
  cluster    = google_container_cluster.my_gke_cluster.name
  node_count = 2

  node_config {
    machine_type    = "e2-standard-4"
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}

# KCC GCP Service Account
resource "google_service_account" "kcc_sa" {
  account_id   = "kcc-sa"
  display_name = "KCC Controller SA"
  project      = "my-gcp-project"
}

resource "google_project_iam_member" "kcc_sa_owner" {
  project = "my-gcp-project"
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.kcc_sa.email}"
}

resource "google_service_account_iam_binding" "kcc_wif_binding" {
  service_account_id = google_service_account.kcc_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]"
  ]
}

# Kubernetes provider using GKE cluster credentials
data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.my_gke_cluster.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(
    google_container_cluster.my_gke_cluster.master_auth[0].cluster_ca_certificate
  )
}

provider "helm" {
  kubernetes {
    host                   = "https://${google_container_cluster.my_gke_cluster.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(
      google_container_cluster.my_gke_cluster.master_auth[0].cluster_ca_certificate
    )
  }
}

# Annotate the KCC Kubernetes service account for Workload Identity
resource "kubernetes_annotations" "kcc_sa_wif" {
  api_version = "v1"
  kind        = "ServiceAccount"
  metadata {
    name      = "cnrm-controller-manager"
    namespace = "cnrm-system"
  }
  annotations = {
    "iam.gke.io/gcp-service-account" = google_service_account.kcc_sa.email
  }

  depends_on = [
    google_container_cluster.my_gke_cluster,
    google_service_account_iam_binding.kcc_wif_binding
  ]
}
```
**Explanation:** This module chains all KCC prerequisites together using `depends_on` and provider configuration to ensure correct ordering across resource creation. The `remove_default_node_pool` pattern is a best practice that allows node pool configuration to be managed separately from the cluster control plane. Workload Identity is configured at three layers: the GKE cluster workload pool, the GCP IAM binding, and the Kubernetes SA annotation. Running `terraform apply` from this configuration produces a fully operational KCC cluster ready to manage GCP resources.

---

### Example 28: Terraform — ConfigConnector Object via Kubernetes Manifest
**Concept:** After the GKE cluster and KCC bootstrap are in place, the `ConfigConnector` singleton object is applied through Terraform's `kubernetes_manifest` resource.
```hcl
resource "kubernetes_manifest" "config_connector" {
  manifest = {
    apiVersion = "core.cnrm.cloud.google.com/v1beta1"
    kind       = "ConfigConnector"
    metadata = {
      name = "configconnector.core.cnrm.cloud.google.com"
    }
    spec = {
      mode                 = "cluster"
      googleServiceAccount = google_service_account.kcc_sa.email
    }
  }

  depends_on = [
    google_container_cluster.my_gke_cluster,
    kubernetes_annotations.kcc_sa_wif
  ]
}
```
**Explanation:** The `kubernetes_manifest` resource is the Terraform Kubernetes provider's mechanism for managing arbitrary custom resources, including KCC's own CRDs. The `depends_on` ensures KCC is already running before Terraform attempts to write the `ConfigConnector` object, since the CRD must exist for the manifest to be accepted by the API server. Referencing `google_service_account.kcc_sa.email` rather than hard-coding the email creates an implicit dependency and avoids drift. If this resource fails with `no match for kind` errors, the KCC addon is not fully initialized yet; add a `time_sleep` or retry logic.

---

### Example 29: Multi-Project KCC Terraform Module
**Concept:** A reusable Terraform module encapsulates all the resources needed to onboard a new team namespace onto KCC with its own GCP project and service account.
```hcl
# modules/kcc-namespace/main.tf

variable "team_name" {}
variable "gcp_project_id" {}
variable "gke_workload_pool" {
  default = "my-gcp-project.svc.id.goog"
}

resource "google_service_account" "team_kcc_sa" {
  account_id   = "kcc-${var.team_name}"
  display_name = "KCC SA for ${var.team_name}"
  project      = var.gcp_project_id
}

resource "google_project_iam_member" "team_kcc_owner" {
  project = var.gcp_project_id
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.team_kcc_sa.email}"
}

resource "google_service_account_iam_binding" "team_wif" {
  service_account_id = google_service_account.team_kcc_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:${var.gke_workload_pool}[${var.team_name}/cnrm-controller-manager]"
  ]
}

resource "kubernetes_namespace_v1" "team_ns" {
  metadata {
    name = var.team_name
    annotations = {
      "cnrm.cloud.google.com/project-id" = var.gcp_project_id
    }
  }
}

resource "kubernetes_manifest" "team_kcc_context" {
  manifest = {
    apiVersion = "core.cnrm.cloud.google.com/v1beta1"
    kind       = "ConfigConnectorContext"
    metadata = {
      name      = "configconnectorcontext.core.cnrm.cloud.google.com"
      namespace = var.team_name
    }
    spec = {
      googleServiceAccount = google_service_account.team_kcc_sa.email
    }
  }
  depends_on = [kubernetes_namespace_v1.team_ns]
}

# Usage example in root module
# module "team_alpha" {
#   source         = "./modules/kcc-namespace"
#   team_name      = "team-alpha"
#   gcp_project_id = "my-gcp-project"
# }
```
**Explanation:** Encapsulating the namespace onboarding pattern into a module reduces repetition when adding multiple teams and enforces consistent configuration. The `team_name` variable drives both the Kubernetes namespace name and the GCP SA account ID, keeping names aligned. Calling the module multiple times with different `team_name` and `gcp_project_id` values creates isolated KCC contexts for each team. The WIF binding uses the team namespace as the Kubernetes namespace component in the principal format.

---

### Example 30: ArgoCD Managing KCC Resources — Application Definition
**Concept:** An ArgoCD `Application` object can manage KCC resource manifests stored in Git, providing GitOps-driven GCP infrastructure provisioning.
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gcp-infra-team-alpha
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/my-org/gcp-infra-configs
    targetRevision: main
    path: teams/team-alpha/gcp-resources
  destination:
    server: https://kubernetes.default.svc
    namespace: team-alpha
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```
**Explanation:** ArgoCD continuously syncs the `teams/team-alpha/gcp-resources` directory to the `team-alpha` namespace in the cluster, and KCC then reconciles those Kubernetes objects to actual GCP resources. The `prune: true` setting means that deleting a manifest from Git will cause ArgoCD to delete the Kubernetes object, which in turn causes KCC to delete the GCP resource unless `deletion-policy: abandon` is set. The `selfHeal: true` option reverts manual changes to KCC resource objects in the cluster, ensuring Git remains the authoritative source. Retry backoff prevents ArgoCD from hammering the API server when KCC resources are temporarily unready.

---

### Example 31: Terraform to KCC Ownership Handoff
**Concept:** Resources provisioned by Terraform can be handed off to KCC management by importing them as KCC objects with `resourceID` and then removing the Terraform resource.
```hcl
# Step 1: Original Terraform resource
# resource "google_storage_bucket" "my_bucket" {
#   name     = "my-existing-production-bucket"
#   location = "us-central1"
#   project  = "my-gcp-project"
# }

# Step 2: Remove from Terraform state before adding to KCC
# terraform state rm google_storage_bucket.my_bucket
```
```yaml
# Step 3: Create KCC manifest with resourceID to import
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-existing-production-bucket
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/deletion-policy: abandon
spec:
  resourceID: my-existing-production-bucket
  location: us-central1
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
```
**Explanation:** The handoff process has three steps: remove the resource from Terraform state, apply the KCC manifest with `resourceID` pointing to the existing GCP resource, and verify KCC shows `Ready: True` without recreating anything. The `deletion-policy: abandon` annotation is critical during this transition to prevent accidental deletion. After KCC takes ownership, any Terraform code referencing the resource should be removed from the codebase entirely to avoid dual management. The handoff is reversible: set `deletion-policy: abandon` on the KCC object, delete it, then re-import into Terraform with `terraform import`.

---

### Example 32: Helm-Deployed KCC with Custom CRD Installation
**Concept:** For environments where CRDs must be applied separately from the main Helm chart (to avoid upgrade ordering issues), CRDs can be installed independently before the chart.
```bash
# Install CRDs separately before the Helm chart
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/k8s-config-connector/v1.117.0/install-bundles/install-bundle-namespaced/crds.yaml

# Wait for CRDs to be established
kubectl wait --for=condition=Established crd/storagebuckets.storage.cnrm.cloud.google.com --timeout=60s

# Install the Helm chart without CRD management
helm install config-connector kcc/config-connector \
  --namespace cnrm-system \
  --create-namespace \
  --version 1.117.0 \
  --set global.project=my-gcp-project \
  --set global.clusterName=my-gke-cluster \
  --skip-crds
```
**Explanation:** Helm's built-in CRD management has a limitation: CRDs in the `crds/` directory are never deleted on `helm uninstall` and are not upgraded on `helm upgrade`. Applying CRDs separately with `kubectl apply` gives full lifecycle control. The `--skip-crds` flag tells Helm to deploy controllers and webhooks without touching CRDs. This pattern is recommended for production environments where CRD schema changes during KCC upgrades need to be reviewed and applied deliberately. The `kubectl wait` step prevents the Helm chart from starting until CRDs are registered with the API server.

---

### Example 33: Terraform Module — KCC Observability Stack
**Concept:** A Terraform module can deploy Prometheus rules and Grafana dashboards alongside KCC to provide infrastructure-level observability for GCP resource reconciliation.
```hcl
resource "kubernetes_manifest" "kcc_prometheus_rule" {
  manifest = {
    apiVersion = "monitoring.coreos.com/v1"
    kind       = "PrometheusRule"
    metadata = {
      name      = "kcc-alerts"
      namespace = "cnrm-system"
      labels = {
        prometheus = "kube-prometheus"
        role       = "alert-rules"
      }
    }
    spec = {
      groups = [
        {
          name = "kcc.rules"
          rules = [
            {
              alert = "KCCResourceReconcileFailed"
              expr  = "increase(cnrm_controller_reconciliation_errors_total[5m]) > 0"
              for   = "2m"
              labels = {
                severity = "warning"
              }
              annotations = {
                summary     = "KCC resource reconciliation is failing"
                description = "KCC controller in {{ $labels.namespace }} has reconciliation errors for resource type {{ $labels.resource }}"
              }
            }
          ]
        }
      ]
    }
  }
}
```
**Explanation:** KCC exposes Prometheus metrics at `:8888/metrics` including reconciliation latency, error rates, and queue depth when `prometheusMetrics.enabled` is set in the Helm values. The `cnrm_controller_reconciliation_errors_total` counter increments each time a resource fails to reconcile, making it the primary alerting metric. This Terraform resource requires the Prometheus Operator CRDs to be installed in the cluster. The alert fires after two minutes of sustained reconciliation errors, giving transient GCP API errors time to resolve naturally before paging on-call.

---

### Example 34: Nested Module — Complete Platform Bootstrap
**Concept:** A top-level Terraform root module calls child modules for cluster creation, KCC setup, team namespace onboarding, and monitoring in the correct dependency order.
```hcl
# root/main.tf

module "gke_cluster" {
  source     = "./modules/gke-cluster"
  project_id = "my-gcp-project"
  region     = "us-central1"
  cluster_name = "my-gke-cluster"
}

module "kcc_bootstrap" {
  source       = "./modules/kcc-bootstrap"
  project_id   = "my-gcp-project"
  cluster_name = module.gke_cluster.cluster_name
  cluster_endpoint = module.gke_cluster.endpoint
  cluster_ca_cert  = module.gke_cluster.ca_certificate

  depends_on = [module.gke_cluster]
}

module "team_alpha" {
  source         = "./modules/kcc-namespace"
  team_name      = "team-alpha"
  gcp_project_id = "my-gcp-project"

  depends_on = [module.kcc_bootstrap]
}

module "team_beta" {
  source         = "./modules/kcc-namespace"
  team_name      = "team-beta"
  gcp_project_id = "my-gcp-project-beta"

  depends_on = [module.kcc_bootstrap]
}

module "kcc_monitoring" {
  source     = "./modules/kcc-observability"
  project_id = "my-gcp-project"

  depends_on = [module.kcc_bootstrap]
}
```
**Explanation:** The nested module pattern separates concerns cleanly: each module owns one layer of the stack (cluster, KCC system, team namespaces, monitoring) and can be updated independently. Explicit `depends_on` at the module level enforces the correct provisioning order since Terraform cannot infer cross-module resource dependencies automatically. Adding a new team is a two-line change (a new `module` block) that reuses all the onboarding logic from `kcc-namespace`. This structure also enables targeted `terraform apply -target=module.team_beta` commands when only one team's configuration changes.

---

### Example 35: ArgoCD ApplicationSet for Multi-Team KCC
**Concept:** An ArgoCD `ApplicationSet` with a Git directory generator automatically creates ArgoCD Applications for each team directory found in the Git repository.
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: gcp-infra-teams
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/my-org/gcp-infra-configs
        revision: main
        directories:
          - path: teams/*
  template:
    metadata:
      name: gcp-infra-{{path.basename}}
    spec:
      project: default
      source:
        repoURL: https://github.com/my-org/gcp-infra-configs
        targetRevision: main
        path: "{{path}}/gcp-resources"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{path.basename}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```
**Explanation:** The `git` generator discovers all directories under `teams/` and creates one ArgoCD Application per directory, mapping the directory name to both the Kubernetes namespace and the GCP infrastructure path. Adding a new team to the platform requires only creating a new `teams/team-gamma/gcp-resources/` directory in Git; ArgoCD and KCC handle the rest automatically. The `{{path.basename}}` template variable extracts the team name from the Git path, keeping naming conventions consistent across Git, Kubernetes, and ArgoCD. Combined with the Terraform namespace module, this creates a fully automated team onboarding pipeline.

---

### Example 36: KCC with Helm — Post-Install Hook Validation
**Concept:** A Helm post-install hook job can validate that KCC is operational immediately after the Helm chart finishes deploying.
```yaml
# templates/kcc-validate-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: kcc-validate
  namespace: cnrm-system
  annotations:
    helm.sh/hook: post-install,post-upgrade
    helm.sh/hook-weight: "10"
    helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: cnrm-controller-manager
      restartPolicy: Never
      containers:
        - name: validator
          image: gcr.io/google.com/cloudsdktool/cloud-sdk:slim
          command:
            - /bin/bash
            - -c
            - |
              until kubectl get configconnector \
                configconnector.core.cnrm.cloud.google.com \
                -o jsonpath='{.status.healthy}' | grep -q true; do
                echo "Waiting for ConfigConnector to become healthy..."
                sleep 10
              done
              echo "KCC is healthy and ready."
```
**Explanation:** Post-install Helm hooks run in the cluster after all chart manifests are applied, making them suitable for readiness polling. The job polls the `ConfigConnector` object's `status.healthy` field, which transitions to `true` when all KCC controllers are ready. Using `hook-delete-policy: hook-succeeded` keeps the job pod available for log inspection when it fails but removes it on success to avoid cluttering the namespace. This validation step gives Helm users a clear signal that the chart is fully operational rather than just applied.

---

### Example 37: Terraform Workspace Strategy for KCC Environments
**Concept:** Terraform workspaces isolate state for dev, staging, and production KCC deployments using a single configuration with workspace-driven variable values.
```hcl
locals {
  env = terraform.workspace

  config = {
    dev = {
      project_id   = "my-gcp-project-dev"
      cluster_name = "my-gke-cluster-dev"
      region       = "us-central1"
      node_count   = 1
    }
    staging = {
      project_id   = "my-gcp-project-staging"
      cluster_name = "my-gke-cluster-staging"
      region       = "us-central1"
      node_count   = 2
    }
    production = {
      project_id   = "my-gcp-project"
      cluster_name = "my-gke-cluster"
      region       = "us-central1"
      node_count   = 3
    }
  }

  current = local.config[local.env]
}

resource "google_container_cluster" "cluster" {
  name     = local.current.cluster_name
  location = local.current.region
  project  = local.current.project_id

  addons_config {
    config_connector_config {
      enabled = true
    }
  }

  workload_identity_config {
    workload_pool = "${local.current.project_id}.svc.id.goog"
  }

  initial_node_count = local.current.node_count
}
```
**Explanation:** The `locals` map pattern replaces separate `.tfvars` files with inline environment configuration, making all environment differences visible in one place. Selecting a workspace with `terraform workspace select production` automatically routes all resources to the production project and cluster name. This approach works well for KCC environments because each workspace maintains independent Terraform state, so a failed dev apply cannot corrupt the production cluster state. The workspace name is also available for tagging resources with `environment = local.env`.

---

### Example 38: KCC Resource with Sensitive Output — Secret Manager Integration
**Concept:** KCC can manage a Secret Manager secret resource, and Terraform can read the secret value using a data source after KCC creates the underlying GCP resource.
```yaml
# KCC creates the SecretManagerSecret resource
apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
kind: SecretManagerSecret
metadata:
  name: my-app-db-password
  namespace: team-alpha
spec:
  replication:
    automatic: {}
```
```hcl
# Terraform data source reads the secret after KCC creates it
data "google_secret_manager_secret_version" "db_password" {
  secret  = "my-app-db-password"
  project = "my-gcp-project"
}

output "db_password" {
  value     = data.google_secret_manager_secret_version.db_password.secret_data
  sensitive = true
}
```
**Explanation:** This pattern uses KCC to declare the secret's existence and metadata (replication policy, labels) while Terraform reads the secret value for use in other infrastructure components such as Cloud SQL connection strings. The split between KCC (resource lifecycle) and Terraform (consuming outputs) follows the principle of separation of concerns. The secret's value is populated by application code or CI/CD pipelines, not by KCC, which only manages the GCP Secret Manager resource object itself. Mark Terraform outputs as `sensitive = true` to prevent the secret value from appearing in plan and apply logs.

---

## ADVANCED (Examples 39–50)

### Example 39: KCC Upgrade Procedure
**Concept:** Upgrading KCC requires draining the reconciler, applying the new version's CRDs, updating the Helm chart, and verifying all resources return to Ready state.
```bash
# Step 1: Check the current KCC version
kubectl get deployment -n cnrm-system -o jsonpath='{.items[0].spec.template.spec.containers[0].image}'

# Step 2: Review the KCC release notes for breaking changes
# https://github.com/GoogleCloudPlatform/k8s-config-connector/releases

# Step 3: Update CRDs for the new version
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/k8s-config-connector/v1.118.0/install-bundles/install-bundle-namespaced/crds.yaml

# Step 4: Wait for CRD updates to propagate
kubectl wait --for=condition=Established crd/storagebuckets.storage.cnrm.cloud.google.com --timeout=60s

# Step 5: Upgrade the Helm chart
helm upgrade config-connector kcc/config-connector \
  --namespace cnrm-system \
  --version 1.118.0 \
  --reuse-values \
  --skip-crds

# Step 6: Monitor pod rollout
kubectl rollout status statefulset/cnrm-controller-manager -n cnrm-system --timeout=300s

# Step 7: Verify all resources are still Ready
kubectl get storagebuckets --all-namespaces -o wide
```
**Explanation:** CRDs must be applied before the controller upgrade because new KCC versions often add or modify fields on existing CRDs, and the new controller requires those schema changes to be present. Using `--reuse-values` in `helm upgrade` preserves the existing values file configuration and only changes the image versions. After the rollout, query all KCC resources across namespaces to confirm none regressed to a failed state due to API or schema changes in the new version. Rollback with `helm rollback config-connector` followed by re-applying the old CRD version if issues are found.

---

### Example 40: Multi-Tenant Namespace-Per-Team with Separate GCP SAs
**Concept:** A fully realized multi-tenant KCC deployment assigns each team a dedicated Kubernetes namespace, GCP service account, and GCP project with minimum required roles.
```hcl
# Create fine-grained IAM roles instead of roles/owner for production
resource "google_project_iam_member" "team_alpha_storage_admin" {
  project = "my-gcp-project"
  role    = "roles/storage.admin"
  member  = "serviceAccount:kcc-team-alpha@my-gcp-project.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "team_alpha_pubsub_admin" {
  project = "my-gcp-project"
  role    = "roles/pubsub.admin"
  member  = "serviceAccount:kcc-team-alpha@my-gcp-project.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "team_alpha_bigquery_admin" {
  project = "my-gcp-project"
  role    = "roles/bigquery.admin"
  member  = "serviceAccount:kcc-team-alpha@my-gcp-project.iam.gserviceaccount.com"
}
```
```yaml
# NetworkPolicy to restrict team-alpha from accessing other namespaces
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kcc-namespace-isolation
  namespace: team-alpha
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: cnrm-system
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
```
**Explanation:** Granting only the specific IAM roles that each team needs (storage admin, Pub/Sub admin, etc.) follows the principle of least privilege and limits blast radius if a team's namespace is compromised. NetworkPolicy restricts team pods from communicating with other teams' namespaces while allowing DNS resolution and access to the KCC controller in `cnrm-system`. This isolation model mirrors how dedicated GCP projects provide strong boundaries between teams. Use `google_project_iam_audit_config` to enable data access audit logs for each team's GCP SA to maintain compliance audit trails.

---

### Example 41: KCC Prometheus Metrics — ServiceMonitor Configuration
**Concept:** A Prometheus Operator `ServiceMonitor` scrapes KCC's built-in metrics endpoint, enabling dashboards and alerts for reconciliation health.
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kcc-metrics
  namespace: cnrm-system
  labels:
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app: cnrm-controller-manager
  namespaceSelector:
    matchNames:
      - cnrm-system
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
      scheme: http
```
**Explanation:** The KCC controller exposes Prometheus metrics on port 8888 when `prometheusMetrics.enabled: true` is set in the Helm values. The `ServiceMonitor` tells the Prometheus Operator to add the KCC metrics endpoint to Prometheus's scrape configuration. Key metrics include `cnrm_controller_reconciliation_count`, `cnrm_controller_reconciliation_errors_total`, and `cnrm_controller_reconciliation_duration_seconds`. These metrics are tagged with the resource kind and namespace, enabling per-resource-type and per-team performance breakdowns in Grafana.

---

### Example 42: KCC Alerting — PrometheusRule for Critical Conditions
**Concept:** PrometheusRule alerts for KCC cover reconciliation failure rate, controller downtime, and webhook unavailability to provide comprehensive coverage.
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kcc-critical-alerts
  namespace: cnrm-system
  labels:
    release: kube-prometheus-stack
spec:
  groups:
    - name: kcc.critical
      rules:
        - alert: KCCControllerDown
          expr: absent(up{job="cnrm-controller-manager"}) == 1
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: KCC controller is not running
            description: The cnrm-controller-manager pod in cnrm-system is not scraping metrics, indicating it may be down.

        - alert: KCCHighReconcileErrorRate
          expr: |
            rate(cnrm_controller_reconciliation_errors_total[5m]) > 0.1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: KCC reconciliation error rate is high
            description: KCC is failing to reconcile more than 0.1 resources per second in namespace {{ $labels.namespace }}.

        - alert: KCCWebhookUnavailable
          expr: |
            kube_deployment_status_replicas_available{deployment="cnrm-webhook-manager", namespace="cnrm-system"} < 1
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: KCC admission webhook is unavailable
            description: No webhook manager replicas are available; KCC resource admission validation is disabled.
```
**Explanation:** The `KCCControllerDown` alert uses `absent()` to fire when the metrics target disappears entirely, catching cases where the pod crashes and never registers with Prometheus. The error rate alert uses `rate()` over five minutes to smooth transient spikes while catching sustained failures. The webhook alert is critical because when the webhook is unavailable, Kubernetes will reject all KCC resource creates and updates by default due to the `failurePolicy: Fail` setting on the webhook. Route critical alerts to PagerDuty and warnings to Slack.

---

### Example 43: Resource Lifecycle Policy — Retention and Finalization
**Concept:** KCC's deletion lifecycle is controlled by the `deletion-policy` annotation and Kubernetes finalizers, which together prevent premature GCP resource deletion.
```bash
# View the finalizers set by KCC on a resource
kubectl get storagebucket my-kcc-test-bucket -n team-alpha \
  -o jsonpath='{.metadata.finalizers}'
# Output: ["cnrm.cloud.google.com/finalizer"]

# Manually remove the finalizer to force-delete a stuck resource (use with caution)
kubectl patch storagebucket my-kcc-test-bucket -n team-alpha \
  --type=json \
  -p='[{"op": "remove", "path": "/metadata/finalizers"}]'

# List all KCC resources that have abandon policy set
kubectl get storagebuckets --all-namespaces \
  -o jsonpath='{range .items[?(@.metadata.annotations.cnrm\.cloud\.google\.com/deletion-policy=="abandon")]}{.metadata.namespace}/{.metadata.name}{"\n"}{end}'
```
**Explanation:** KCC automatically adds `cnrm.cloud.google.com/finalizer` to every managed resource, which prevents Kubernetes from removing the object until KCC has finished its deletion logic (either deleting the GCP resource or abandoning it). If KCC is uninstalled while resources still exist, the finalizers prevent the objects from being garbage collected, protecting GCP resources from orphaning. Manually removing finalizers should only be done when KCC is being permanently removed and you have confirmed the GCP resources are safe. Auditing for `abandon` policy resources ensures teams have not inadvertently disabled cleanup for resources that should be deleted.

---

### Example 44: GitOps-Driven GCP Infrastructure — Full Pipeline
**Concept:** A complete GitOps pipeline combines Terraform for cluster bootstrap, Helm for KCC installation, Config Sync for manifest delivery, and KCC for GCP resource provisioning.
```yaml
# .github/workflows/kcc-gitops.yaml
name: KCC GitOps Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
      - 'kcc-manifests/**'

jobs:
  terraform-bootstrap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
          service_account: terraform-sa@my-gcp-project.iam.gserviceaccount.com
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.0
      - name: Terraform Apply
        working-directory: terraform/
        run: |
          terraform init
          terraform workspace select production
          terraform apply -auto-approve -target=module.gke_cluster -target=module.kcc_bootstrap

  validate-kcc:
    needs: terraform-bootstrap
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: my-gke-cluster
          location: us-central1
          project_id: my-gcp-project
      - name: Wait for KCC Ready
        run: |
          kubectl wait --for=condition=Ready \
            configconnector/configconnector.core.cnrm.cloud.google.com \
            --timeout=300s
```
**Explanation:** The GitHub Actions workflow separates the Terraform bootstrap from KCC validation, ensuring the cluster and KCC are operational before Config Sync begins syncing GCP resource manifests. Using Workload Identity Federation for GitHub Actions eliminates long-lived service account keys in GitHub Secrets. The `-target` flags in the Terraform apply limit the initial run to only the cluster and KCC modules, allowing team namespace modules to be applied in separate jobs with proper ordering. Config Sync then takes over continuous delivery of GCP resource manifests from the `kcc-manifests/` directory.

---

### Example 45: Config Sync with Policy Controller for KCC Governance
**Concept:** Policy Controller (based on OPA Gatekeeper) can enforce organizational policies on KCC resources before they reach the cluster, such as requiring deletion-policy annotations.
```yaml
# ConstraintTemplate requiring deletion-policy annotation on all KCC resources
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: kccmusthavedeletionpolicy
spec:
  crd:
    spec:
      names:
        kind: KCCMustHaveDeletionPolicy
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package kccmusthavedeletionpolicy

        violation[{"msg": msg}] {
          input.review.object.apiVersion
          contains(input.review.object.apiVersion, "cnrm.cloud.google.com")
          not input.review.object.metadata.annotations["cnrm.cloud.google.com/deletion-policy"]
          msg := sprintf("KCC resource %v/%v must have cnrm.cloud.google.com/deletion-policy annotation", [
            input.review.object.metadata.namespace,
            input.review.object.metadata.name
          ])
        }
---
apiVersion: kccmusthavedeletionpolicy.constraints.gatekeeper.sh/v1beta1
kind: KCCMustHaveDeletionPolicy
metadata:
  name: require-kcc-deletion-policy
spec:
  match:
    namespaces:
      - team-alpha
      - team-beta
```
**Explanation:** The `ConstraintTemplate` uses Rego to check that any manifest whose `apiVersion` contains `cnrm.cloud.google.com` has the `deletion-policy` annotation set. The separate `Constraint` object activates the policy and scopes it to specific namespaces. Policy Controller runs as an admission webhook, so non-compliant manifests are rejected before they reach etcd and before KCC sees them. This approach ensures governance is enforced at the platform level rather than relying on team discipline.

---

### Example 46: KCC Resource Drift Detection
**Concept:** KCC's reconciliation loop detects and corrects drift between the Kubernetes spec and GCP resource state, which can be observed through status events.
```bash
# Simulate drift by directly modifying a GCS bucket's configuration in GCP
gcloud storage buckets update gs://my-kcc-test-bucket \
  --no-uniform-bucket-level-access \
  --project=my-gcp-project

# Watch KCC detect and correct the drift
kubectl get events -n team-alpha -w \
  --field-selector involvedObject.name=my-kcc-test-bucket

# Expected events:
# REASON           MESSAGE
# Updating         Successfully updated StorageBucket "my-kcc-test-bucket"
# UpToDate         StorageBucket "my-kcc-test-bucket" is up to date

# Check the reconciliation interval
kubectl get storagebucket my-kcc-test-bucket -n team-alpha \
  -o jsonpath='{.metadata.annotations.cnrm\.cloud\.google\.com/reconcile-interval-in-seconds}'
```
**Explanation:** KCC's reconciliation loop runs on a default interval (approximately every 10 minutes for unchanged resources, immediately for spec changes) and compares the desired state in the Kubernetes object against the actual state in GCP. When drift is detected, KCC emits an `Updating` event and calls the GCP API to restore the desired configuration. Setting `cnrm.cloud.google.com/reconcile-interval-in-seconds` annotation to a shorter value like `30` increases the frequency of drift correction at the cost of additional GCP API calls. This automatic drift correction is one of KCC's primary advantages over one-time Terraform applies.

---

### Example 47: Troubleshooting Runbook — KCC Resource Stuck in Updating
**Concept:** A systematic troubleshooting runbook covers the steps to diagnose and resolve a KCC resource stuck in the Updating state.
```bash
# Step 1: Check the resource status conditions
kubectl describe storagebucket my-kcc-test-bucket -n team-alpha

# Step 2: Check recent events for the resource
kubectl get events -n team-alpha \
  --field-selector involvedObject.name=my-kcc-test-bucket \
  --sort-by='.lastTimestamp'

# Step 3: Check KCC controller logs for errors related to the resource
kubectl logs -n cnrm-system cnrm-controller-manager-0 -c manager \
  | grep "my-kcc-test-bucket" | tail -30

# Step 4: Check if the GCP resource exists and its current state
gcloud storage buckets describe gs://my-kcc-test-bucket \
  --project=my-gcp-project --format=json

# Step 5: Verify KCC SA has permissions to the resource
gcloud projects get-iam-policy my-gcp-project \
  --flatten="bindings[].members" \
  --filter="bindings.members:kcc-sa@my-gcp-project.iam.gserviceaccount.com" \
  --format="table(bindings.role)"

# Step 6: Force a reconciliation by adding a no-op annotation
kubectl annotate storagebucket my-kcc-test-bucket -n team-alpha \
  cnrm.cloud.google.com/force-reconcile=$(date +%s) --overwrite
```
**Explanation:** Resources stuck in Updating usually indicate either a GCP API error (permissions, quota, invalid spec) or a transient GCP service disruption. The controller logs at step 3 contain the raw GCP API response, which provides the definitive error message. Step 4 verifies whether the GCP resource actually exists, which is needed to distinguish between creation failures and update failures. The force reconciliation annotation at step 6 triggers an immediate reconciliation cycle without waiting for the next scheduled interval, which is useful after fixing a permissions issue.

---

### Example 48: Troubleshooting Runbook — KCC Webhook Failures
**Concept:** When KCC admission webhooks are unavailable, all KCC resource creates and updates fail with webhook timeout errors that require specific remediation steps.
```bash
# Check webhook configuration
kubectl get validatingwebhookconfiguration | grep cnrm
kubectl get mutatingwebhookconfiguration | grep cnrm

# Check webhook manager pods
kubectl get pods -n cnrm-system -l app=cnrm-webhook-manager

# Check webhook manager logs
kubectl logs -n cnrm-system -l app=cnrm-webhook-manager --tail=50

# Temporarily patch the webhook failurePolicy to Ignore (emergency only)
kubectl patch validatingwebhookconfiguration cnrm-validating-webhook \
  --type='json' \
  -p='[{"op":"replace","path":"/webhooks/0/failurePolicy","value":"Ignore"}]'

# Verify the webhook endpoint is reachable
kubectl get svc -n cnrm-system cnrm-webhook-manager-service
kubectl run -it --rm debug --image=gcr.io/google.com/cloudsdktool/cloud-sdk:slim \
  --restart=Never -n cnrm-system -- \
  curl -k https://cnrm-webhook-manager-service.cnrm-system.svc:443/healthz
```
**Explanation:** Webhook failures typically occur after KCC upgrades that change the webhook certificate or after the webhook manager deployment fails to roll out. The `failurePolicy: Ignore` patch is an emergency measure that allows resource operations to proceed without webhook validation; revert it as soon as the webhook pods are healthy. Checking the webhook service ensures the endpoint is correctly targeting the webhook manager pods; misconfigured selectors cause the webhook to fail with connection refused errors. In GKE, KCC webhook certificates are managed by the cluster and rotate automatically, so certificate expiration is rare but can occur if KCC is left unmanaged for extended periods.

---

### Example 49: KCC Resource Export — Capturing Existing GCP State
**Concept:** The `config-connector export` CLI tool generates KCC manifests from existing GCP resources, enabling bulk import of infrastructure without writing manifests by hand.
```bash
# Install the config-connector CLI
gcloud components install config-connector

# Export all GCS buckets in a project to KCC manifests
config-connector export \
  storage.googleapis.com/Bucket \
  --project=my-gcp-project \
  --output=kcc-imports/

# Export a specific resource
config-connector export \
  "//storage.googleapis.com/projects/_/buckets/my-existing-production-bucket" \
  --output=kcc-imports/storage-bucket.yaml

# Export all resources of all types from a project
config-connector export \
  --project=my-gcp-project \
  --all-namespaces \
  --output=kcc-imports/

# Apply the exported manifests with abandon policy annotation
kubectl apply -f kcc-imports/ -n team-alpha
```
**Explanation:** The `config-connector export` command queries GCP's Asset Inventory API and translates existing GCP resources into KCC-compatible YAML manifests. This dramatically accelerates migration from Terraform or manual GCP Console configuration to KCC management. Exported manifests should be reviewed before applying because some fields may contain read-only values that KCC cannot set (such as GCP-assigned IDs). Always apply exported manifests with `deletion-policy: abandon` until the configuration is validated to avoid accidentally deleting production resources during the import process.

---

### Example 50: KCC Full Observability — Logs, Metrics, and Tracing Integration
**Concept:** A complete observability configuration for KCC combines Cloud Logging for structured logs, Prometheus for metrics, and distributed tracing for slow reconciliation diagnosis.
```yaml
# Cloud Logging log filter for KCC errors (save as a Cloud Logging sink query)
# resource.type="k8s_container"
# resource.labels.cluster_name="my-gke-cluster"
# resource.labels.namespace_name="cnrm-system"
# severity>=WARNING
# jsonPayload.logger="controller"

# Grafana dashboard config snippet (JSON model excerpt)
apiVersion: v1
kind: ConfigMap
metadata:
  name: kcc-grafana-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  kcc-dashboard.json: |
    {
      "title": "KCC Controller Health",
      "uid": "kcc-health",
      "panels": [
        {
          "title": "Reconciliation Errors per Minute",
          "type": "graph",
          "targets": [
            {
              "expr": "rate(cnrm_controller_reconciliation_errors_total[1m])",
              "legendFormat": "{{resource_type}} errors/min"
            }
          ]
        },
        {
          "title": "Reconciliation Latency P99",
          "type": "graph",
          "targets": [
            {
              "expr": "histogram_quantile(0.99, rate(cnrm_controller_reconciliation_duration_seconds_bucket[5m]))",
              "legendFormat": "P99 latency - {{resource_type}}"
            }
          ]
        },
        {
          "title": "Total Managed Resources",
          "type": "stat",
          "targets": [
            {
              "expr": "sum(cnrm_controller_resource_count)",
              "legendFormat": "Total KCC Resources"
            }
          ]
        }
      ]
    }
```
```bash
# Query KCC logs from Cloud Logging using gcloud
gcloud logging read \
  'resource.type="k8s_container" AND resource.labels.cluster_name="my-gke-cluster" AND resource.labels.namespace_name="cnrm-system" AND severity>=WARNING' \
  --project=my-gcp-project \
  --limit=50 \
  --format=json | python3 -m json.tool

# Set up a Cloud Logging alert for KCC errors
gcloud alpha monitoring policies create \
  --notification-channels=projects/my-gcp-project/notificationChannels/my-channel \
  --display-name="KCC Controller Errors" \
  --condition-filter='resource.type="k8s_container" AND resource.labels.namespace_name="cnrm-system" AND severity="ERROR"' \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```
**Explanation:** The three-tier observability stack gives operators different granularities of insight: Cloud Logging captures every reconciliation action with full context for post-incident analysis, Prometheus metrics provide real-time aggregated health signals for dashboards and alerting, and distributed tracing (when enabled via OpenTelemetry) shows which GCP API calls are slow during reconciliation. The Grafana ConfigMap with the `grafana_dashboard: "1"` label is discovered automatically by the Grafana sidecar if using the official Grafana Helm chart. Cloud Logging alerts complement Prometheus alerts by covering cases where KCC logs errors but does not emit metrics (such as webhook panics or initialization failures).

---
