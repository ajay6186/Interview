# KCC IAM Resources

## BASIC (Examples 1–12)

### Example 1: Create a GCP Service Account via KCC
**Concept:** `IAMServiceAccount` is the KCC resource that provisions a GCP Service Account declaratively.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: my-workload-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "My Workload Service Account"
  description: "Service account for GKE workloads"
```
**Explanation:** KCC reconciles this manifest by creating the GSA `my-workload-sa@my-gcp-project.iam.gserviceaccount.com` in GCP. The `namespace` must match the KCC-managed namespace. Changes to `displayName` are also reconciled automatically.

---

### Example 2: Grant a Project-Level IAM Role via IAMPolicyMember
**Concept:** `IAMPolicyMember` adds a single non-authoritative IAM binding to a GCP resource.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-workload-sa-storage-viewer
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** `IAMPolicyMember` is additive — it does not remove other members from the role. This is the safest KCC IAM resource for granting access without overwriting existing bindings.

---

### Example 3: Grant Viewer Role on a Specific GCS Bucket
**Concept:** `IAMPolicyMember` can target any KCC-managed GCP resource, including Storage buckets.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-bucket-viewer
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-data-bucket
    namespace: config-connector
```
**Explanation:** Scoping IAM bindings to specific buckets instead of the project follows the principle of least privilege. KCC resolves the `resourceRef` to the actual GCP resource ARN automatically.

---

### Example 4: Check KCC IAM Resource Status
**Concept:** Every KCC resource exposes a `Ready` condition in its `.status.conditions` field.
```bash
# Check if IAMServiceAccount reconciled successfully
kubectl get iamserviceaccount my-workload-sa -n config-connector -o yaml

# Check all IAM resources in a namespace
kubectl get iamserviceaccount,iampolicymember,iambinding -n config-connector
```
**Explanation:** The `Ready: True` condition confirms GCP-side provisioning succeeded. If `Ready: False`, the `message` field describes the GCP API error, making it easy to diagnose permission or quota issues.

---

### Example 5: IAMBinding — Grant a Role to Multiple Members
**Concept:** `IAMBinding` manages a role binding with a list of members, replacing any existing members for that role.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMBinding
metadata:
  name: developers-cloudsql-client
  namespace: config-connector
spec:
  members:
    - serviceAccount:app-sa@my-gcp-project.iam.gserviceaccount.com
    - group:dev-team@mycompany.com
  role: roles/cloudsql.client
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** `IAMBinding` is authoritative for the specified role — it overwrites any existing members for that role. Use it when you want full control over who holds a particular role, but be aware it will remove members not listed here.

---

### Example 6: Annotate Kubernetes Service Account for Workload Identity
**Concept:** Workload Identity requires annotating the KSA with the GSA email to link the two identities.
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-ksa
  namespace: my-app
  annotations:
    iam.gke.io/gcp-service-account: my-workload-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** This annotation tells the GKE metadata server to exchange the KSA token for a GSA token. Combined with the `roles/iam.workloadIdentityUser` binding, pods using this KSA can authenticate as the GSA without any key files.

---

### Example 7: Grant Workload Identity User Role
**Concept:** The `roles/iam.workloadIdentityUser` binding allows a KSA to impersonate a GSA.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-identity-binding
  namespace: config-connector
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[my-app/my-app-ksa]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-workload-sa
    namespace: config-connector
```
**Explanation:** The `serviceAccount:PROJECT.svc.id.goog[NAMESPACE/KSA]` member format is the Workload Identity principal. This binding is what actually enables the KSA to authenticate as the GSA — the KSA annotation alone is insufficient.

---

### Example 8: Delete IAM Resources Safely
**Concept:** Deleting a KCC IAM resource removes the corresponding GCP binding but does not cascade to dependent resources.
```bash
# Delete a specific policy member binding
kubectl delete iampolicymember workload-bucket-viewer -n config-connector

# Verify the binding is removed from GCP
gcloud projects get-iam-policy my-gcp-project \
  --flatten="bindings[].members" \
  --filter="bindings.members:my-workload-sa@my-gcp-project.iam.gserviceaccount.com"
```
**Explanation:** KCC uses GCP finalizers to ensure the GCP resource is deleted before the Kubernetes object is removed. Always verify with `gcloud` after deletion to confirm GCP-side cleanup completed.

---

### Example 9: Assign roles/logging.logWriter to a Service Account
**Concept:** Granting `roles/logging.logWriter` allows GKE workloads to write structured logs to Cloud Logging.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-workload-sa-log-writer
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/logging.logWriter
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** This role is required for workloads that write to Cloud Logging using the Logging API. Combined with `roles/monitoring.metricWriter` and `roles/cloudtrace.agent`, this covers the standard observability permission set for GKE workloads.

---

### Example 10: Grant roles/monitoring.metricWriter
**Concept:** `roles/monitoring.metricWriter` allows GKE nodes and workloads to push metrics to Cloud Monitoring.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-workload-sa-metric-writer
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/monitoring.metricWriter
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** Nodes in a GKE cluster need this role to report system-level metrics. For node pool service accounts provisioned via Terraform, adding this KCC binding ensures consistent metric reporting across all node pools.

---

### Example 11: List All KCC IAM Resources in a Namespace
**Concept:** `kubectl get` with multiple resource types gives an overview of all KCC-managed IAM state.
```bash
kubectl get \
  iamserviceaccount,\
  iampolicymember,\
  iambinding,\
  iampolicy,\
  iampartialpolicy \
  -n config-connector \
  -o wide
```
**Explanation:** This command is the equivalent of `gcloud projects get-iam-policy` but shows the desired state as defined in Kubernetes. Comparing this output with the GCP policy helps identify drift when KCC reconciliation fails.

---

### Example 12: Describe a KCC IAMServiceAccount for Debugging
**Concept:** `kubectl describe` shows events and conditions that explain why a KCC resource failed to reconcile.
```bash
kubectl describe iamserviceaccount my-workload-sa -n config-connector
```
**Explanation:** The `Events` section shows recent KCC controller actions including errors from the GCP IAM API. Common issues include the KCC service account lacking `roles/iam.serviceAccountAdmin` on the project, which appears as a permission denied event.

---

## INTERMEDIATE (Examples 13–25)

### Example 13: IAMPartialPolicy — Non-Authoritative Role Management
**Concept:** `IAMPartialPolicy` manages only the bindings it declares, leaving all other bindings for that resource untouched.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: app-team-partial-policy
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  bindings:
    - role: roles/storage.objectAdmin
      members:
        - memberFrom:
            serviceAccountRef:
              name: my-workload-sa
              namespace: config-connector
    - role: roles/pubsub.publisher
      members:
        - member: serviceAccount:publisher-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** Unlike `IAMPolicy`, `IAMPartialPolicy` does not remove roles not listed in its spec. This makes it safe to use in shared projects where multiple teams manage their own IAM bindings via separate KCC resources.

---

### Example 14: IAMPolicy — Authoritative Full Project Policy
**Concept:** `IAMPolicy` completely replaces the IAM policy of the target resource with what is declared in the spec.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicy
metadata:
  name: my-project-iam-policy
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  bindings:
    - role: roles/owner
      members:
        - user:admin@mycompany.com
    - role: roles/editor
      members:
        - serviceAccount:terraform-sa@my-gcp-project.iam.gserviceaccount.com
    - role: roles/viewer
      members:
        - group:all-devs@mycompany.com
```
**Explanation:** `IAMPolicy` is dangerous in shared projects — any binding not listed here will be removed. Reserve it for dedicated single-team projects where you want complete GitOps control over the entire IAM policy.

---

### Example 15: Service Account Key via KCC (IAMServiceAccountKey)
**Concept:** `IAMServiceAccountKey` creates a GCP service account key and stores it as a Kubernetes Secret.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccountKey
metadata:
  name: my-workload-sa-key
  namespace: config-connector
spec:
  publicKeyType: TYPE_X509_PEM_FILE
  privateKeyType: TYPE_GOOGLE_CREDENTIALS_FILE
  serviceAccountRef:
    name: my-workload-sa
    namespace: config-connector
```
**Explanation:** Avoid service account keys when Workload Identity is available — they are a security risk if leaked. Use this only for workloads that cannot run on GKE (e.g., on-premises systems) and rotate keys frequently using KCC's reconcile loop.

---

### Example 16: Cross-Project IAMPolicyMember
**Concept:** A service account in one project can be granted access to resources in another project via KCC.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: cross-project-storage-access
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/shared-data-project
```
**Explanation:** The KCC namespace targets `my-gcp-project` for identity, but the `resourceRef` points to `shared-data-project`. The KCC controller must have IAM Admin permissions on both projects for this to reconcile successfully.

---

### Example 17: Conditional IAM Binding via KCC
**Concept:** IAM conditions restrict when a binding applies, such as time-based or resource-tag-based constraints.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: conditional-storage-access
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  condition:
    title: "production-only"
    description: "Access only during production hours UTC"
    expression: 'request.time.getHours("UTC") >= 6 && request.time.getHours("UTC") <= 22'
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-data-bucket
    namespace: config-connector
```
**Explanation:** CEL (Common Expression Language) expressions define fine-grained access conditions. Conditional bindings require the target resource to be at version 3 of the IAM policy, which KCC handles automatically.

---

### Example 18: Audit Log Configuration via IAMPolicy
**Concept:** IAM audit log settings can be managed as part of an `IAMPolicy` resource in KCC.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicy
metadata:
  name: project-audit-config
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  auditConfigs:
    - service: allServices
      auditLogConfigs:
        - logType: ADMIN_READ
        - logType: DATA_READ
        - logType: DATA_WRITE
  bindings: []
```
**Explanation:** Enabling `DATA_READ` and `DATA_WRITE` audit logs creates a complete audit trail for compliance. Note: `bindings: []` with `IAMPolicy` would remove all bindings — always include the full binding list when using `IAMPolicy` with `auditConfigs`.

---

### Example 19: Role Binding on Cloud SQL Instance
**Concept:** KCC can grant IAM roles directly on a Cloud SQL instance resource.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: app-sa-cloudsql-client
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/cloudsql.client
  resourceRef:
    apiVersion: sql.cnrm.cloud.google.com/v1beta1
    kind: SQLInstance
    name: my-sql-instance
    namespace: config-connector
```
**Explanation:** Resource-level IAM bindings are more secure than project-level bindings. Scoping `roles/cloudsql.client` to a specific instance means the workload can only connect to that SQL instance and nothing else.

---

### Example 20: GKE RBAC ClusterRole + IAM Integration
**Concept:** Combine GKE RBAC with KCC-managed GSA for end-to-end identity management.
```yaml
# KCC: provision GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: cluster-admin-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Cluster Admin Service Account"
---
# Kubernetes: bind KSA to GKE cluster-admin role
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-admin-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: cluster-admin-ksa
    namespace: kube-system
```
**Explanation:** GKE RBAC controls Kubernetes API access while KCC IAM controls GCP resource access. Managing both in the same GitOps repository ensures consistent identity governance across both planes.

---

### Example 21: Node Pool Service Account with Minimal Permissions
**Concept:** GKE node pools should use a dedicated service account with only the permissions required by system components.
```yaml
# KCC: minimal node pool GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: gke-node-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "GKE Node Pool Service Account"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gke-node-log-writer
  namespace: config-connector
spec:
  member: serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/logging.logWriter
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** The minimal node service account requires `logging.logWriter`, `monitoring.metricWriter`, `monitoring.viewer`, and `stackdriver.resourceMetadata.writer`. Using KCC to manage these ensures they are version-controlled and auditable.

---

### Example 22: Watch KCC IAM Reconciliation with kubectl
**Concept:** `kubectl get --watch` streams KCC resource status updates in real-time.
```bash
# Watch all IAM resources reconcile
kubectl get iampolicymember,iamserviceaccount -n config-connector -w

# Wait for a specific resource to become ready
kubectl wait --for=condition=Ready \
  iamserviceaccount/my-workload-sa \
  -n config-connector \
  --timeout=120s
```
**Explanation:** KCC reconciliation usually takes 10-30 seconds per resource. `kubectl wait` is useful in CI/CD pipelines where subsequent steps (like deploying Helm charts) depend on IAM bindings being active in GCP.

---

### Example 23: IAMBinding on Pub/Sub Topic
**Concept:** Scope publisher permissions to a specific Pub/Sub topic via KCC `IAMBinding`.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMBinding
metadata:
  name: pubsub-publisher-binding
  namespace: config-connector
spec:
  members:
    - serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/pubsub.publisher
  resourceRef:
    apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
    kind: PubSubTopic
    name: my-app-events
    namespace: config-connector
```
**Explanation:** Topic-level IAM means this service account can only publish to `my-app-events` and cannot access other topics or subscriptions. This is critical for multi-tenant systems where different workloads publish to different topics.

---

### Example 24: Grant Access to Secret Manager Secret
**Concept:** Workloads that read secrets need `roles/secretmanager.secretAccessor` on each specific secret.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-secret-accessor
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
  resourceRef:
    apiVersion: secretmanager.cnrm.cloud.google.com/v1beta1
    kind: SecretManagerSecret
    name: db-password
    namespace: config-connector
```
**Explanation:** Scoping secret access to individual secrets rather than project-wide is essential for security. Combined with Workload Identity, this means only the specific pod can read the specific secret — no credentials on disk.

---

### Example 25: Disable Service Account via KCC Annotation
**Concept:** KCC supports setting `cnrm.cloud.google.com/deletion-policy` to control resource lifecycle.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: deprecated-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
    cnrm.cloud.google.com/deletion-policy: abandon
spec:
  displayName: "Deprecated - Do Not Use"
  description: "Marked for decommission"
```
**Explanation:** Setting `deletion-policy: abandon` means deleting this KCC resource will NOT delete the GCP service account, allowing safe handoff. Change the description first to signal the intent, then revoke all bindings before final deletion.

---

## NESTED (Examples 26–37)

### Example 26: Full Workload Identity Stack — IAMServiceAccount + Binding + KSA Annotation
**Concept:** Complete Workload Identity setup as a single multi-resource manifest.
```yaml
# 1. Provision GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: my-app-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "My App GSA"
---
# 2. Grant GCS read access
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-gsa-storage
  namespace: config-connector
spec:
  member: serviceAccount:my-app-gsa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectViewer
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-data-bucket
    namespace: config-connector
---
# 3. Allow KSA to impersonate GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-workload-identity
  namespace: config-connector
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[my-app/my-app-ksa]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-app-gsa
    namespace: config-connector
---
# 4. Annotate KSA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-ksa
  namespace: my-app
  annotations:
    iam.gke.io/gcp-service-account: my-app-gsa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** Apply these four resources with `kubectl apply -f workload-identity.yaml` to configure the complete Workload Identity chain. Resources 1-3 are KCC-managed and reconcile against GCP; resource 4 is a native Kubernetes object. Order doesn't matter since KCC reconciles asynchronously.

---

### Example 27: KCC IAM + Helm Deployed App Using the Identity
**Concept:** Combine KCC IAM setup with a Helm chart deployment that uses the provisioned identity.
```yaml
# kcc-iam.yaml — apply first
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: my-app-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "My App GSA"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-gsa-wi
  namespace: config-connector
spec:
  member: serviceAccount:my-gcp-project.svc.id.goog[my-app/my-app-ksa]
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-app-gsa
    namespace: config-connector
```
```bash
# Wait for KCC to reconcile, then deploy Helm chart
kubectl wait --for=condition=Ready iamserviceaccount/my-app-gsa \
  -n config-connector --timeout=120s

helm upgrade --install my-app \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
  --namespace my-app --create-namespace \
  --set serviceAccount.name=my-app-ksa \
  --set serviceAccount.annotations."iam\.gke\.io/gcp-service-account"=my-app-gsa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** The `kubectl wait` gate ensures IAM bindings are active in GCP before the Helm chart creates pods that depend on them. Without this gate, pods may fail on startup if they try to access GCP APIs before the Workload Identity binding propagates.

---

### Example 28: Terraform Bootstrap GSA + KCC Manages Policy Members
**Concept:** Terraform provisions the GKE cluster and base GSA; KCC manages ongoing IAM policy members.
```hcl
# terraform/main.tf — bootstrap only
resource "google_service_account" "workload_sa" {
  project      = "my-gcp-project"
  account_id   = "my-workload-sa"
  display_name = "Workload SA — managed by Terraform"
}

# Output for KCC reference
output "workload_sa_email" {
  value = google_service_account.workload_sa.email
}
```
```yaml
# kcc/policy-member.yaml — day-2 IAM management via KCC
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-sa-bigquery-viewer
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/bigquery.dataViewer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** This split pattern — Terraform for initial provisioning, KCC for ongoing policy management — avoids Terraform state conflicts when multiple teams add IAM bindings. KCC's additive `IAMPolicyMember` is safe to use from multiple namespaces and teams simultaneously.

---

### Example 29: Multi-Namespace KCC IAM Configuration
**Concept:** Different app teams can manage their own KCC IAM resources in separate namespaces with distinct identities.
```yaml
# namespace: team-alpha
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: alpha-app-gsa
  namespace: team-alpha
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Alpha Team App GSA"
---
# namespace: team-beta
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: beta-app-gsa
  namespace: team-beta
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Beta Team App GSA"
```
```bash
# Each namespace needs its own ConfigConnectorContext
kubectl apply -f - <<EOF
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnectorContext
metadata:
  name: configconnectorcontext.core.cnrm.cloud.google.com
  namespace: team-alpha
spec:
  googleServiceAccount: cnrm-team-alpha@my-gcp-project.iam.gserviceaccount.com
EOF
```
**Explanation:** Each namespace uses a different KCC identity GSA, enabling per-team IAM isolation. Team Alpha's KCC controller can only manage resources it has permissions for, preventing one team from modifying another team's GCP resources.

---

### Example 30: Service Account Impersonation Chain via KCC
**Concept:** Allow one service account to impersonate another using `roles/iam.serviceAccountTokenCreator`.
```yaml
# Allow Terraform SA to impersonate the workload SA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: terraform-impersonates-workload
  namespace: config-connector
spec:
  member: serviceAccount:terraform-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/iam.serviceAccountTokenCreator
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: my-workload-sa
    namespace: config-connector
```
**Explanation:** Impersonation chains eliminate the need for key files in CI/CD. The `terraform-sa` can generate short-lived tokens for `my-workload-sa` without holding a permanent key, significantly reducing credential exposure risk.

---

### Example 31: KCC IAM with Config Sync (GitOps) Structure
**Concept:** Organize KCC IAM resources in a Config Sync repository structure for automated GitOps reconciliation.
```bash
# Repository structure for Config Sync
config-sync-repo/
├── namespaces/
│   └── config-connector/
│       ├── iam-service-accounts.yaml
│       ├── iam-policy-members-storage.yaml
│       ├── iam-policy-members-sql.yaml
│       └── iam-policy-members-pubsub.yaml
└── cluster/
    └── rbac/
        └── cluster-role-bindings.yaml
```
```yaml
# namespaces/config-connector/iam-service-accounts.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: api-server-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "API Server GSA"
```
**Explanation:** Config Sync continuously reconciles the git repository to the cluster, meaning any IAM drift (manually added bindings outside of git) is automatically corrected. This makes KCC with Config Sync the gold standard for compliance-driven IAM management.

---

### Example 32: Custom IAM Role via KCC (IAMCustomRole)
**Concept:** `IAMCustomRole` creates a project-level custom role with a specific set of permissions.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMCustomRole
metadata:
  name: gke-workload-minimal
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  title: "GKE Workload Minimal"
  description: "Minimal permissions for GKE application workloads"
  stage: GA
  permissions:
    - storage.objects.get
    - storage.objects.list
    - pubsub.topics.publish
    - secretmanager.versions.access
```
**Explanation:** Custom roles enforce true least-privilege by granting only the specific API methods needed. KCC manages the role lifecycle declaratively, and you can update `permissions` in git to add/remove permissions with full audit history.

---

### Example 33: Bind Custom Role to Service Account
**Concept:** Use the KCC custom role in an `IAMPolicyMember` binding.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-sa-custom-role
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: projects/my-gcp-project/roles/gkeWorkloadMinimal
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** Custom role IDs in `IAMPolicyMember` use the full resource path format `projects/PROJECT_ID/roles/ROLE_ID`. After applying, verify the binding propagated with `gcloud projects get-iam-policy my-gcp-project`.

---

## ADVANCED (Examples 38–50)

### Example 38: Org-Level IAMPolicyMember via KCC
**Concept:** KCC can manage IAM bindings at the GCP Organization level using `resourceRef` pointing to an org resource.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: org-security-viewer
  namespace: config-connector
spec:
  member: group:security-team@mycompany.com
  role: roles/securitycenter.adminViewer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Organization
    external: organizations/123456789012
```
**Explanation:** Org-level KCC IAM requires the KCC service account to have org-level IAM Admin permissions. This is powerful — manage entire org-wide security group bindings from a single KCC resource in a central admin cluster.

---

### Example 39: Folder-Level IAM Binding
**Concept:** Scope IAM bindings to a GCP folder to apply across all projects within that folder.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: folder-billing-viewer
  namespace: config-connector
spec:
  member: serviceAccount:billing-reporter@my-gcp-project.iam.gserviceaccount.com
  role: roles/billing.viewer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Folder
    external: folders/987654321
```
**Explanation:** Folder-level bindings are inherited by all child projects. Use this for cross-project tooling like billing reporters or audit log aggregators that need consistent access across multiple environments.

---

### Example 40: VPC Service Controls + IAM Integration
**Concept:** Combine VPC Service Controls access policies with KCC IAM for defense-in-depth.
```yaml
# Grant access level to service account for VPC-SC protected resources
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-sa-vpc-sc-access
  namespace: config-connector
spec:
  member: serviceAccount:my-workload-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/storage.objectAdmin
  condition:
    title: "vpc-sc-compliant-access"
    expression: >
      resource.name.startsWith("projects/my-gcp-project/buckets/secure-") &&
      "accessPolicies/POLICY_ID/accessLevels/corporate_network" in
      request.auth.access_levels
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** This conditional binding requires the workload to be both in the VPC-SC perimeter AND accessing only `secure-*` prefixed buckets. Combining VPC-SC access levels with IAM conditions provides two independent security controls.

---

### Example 41: Full Workload Identity Federation (External OIDC)
**Concept:** Allow workloads outside GKE (CI/CD, on-premises) to authenticate as a GSA via Workload Identity Federation.
```yaml
# KCC: create the GSA for federation
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: github-actions-gsa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "GitHub Actions Federation GSA"
---
# KCC: allow GitHub Actions to impersonate the GSA
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: github-actions-token-creator
  namespace: config-connector
spec:
  member: >
    principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/
    workloadIdentityPools/github-pool/attribute.repository/myorg/myrepo
  role: roles/iam.workloadIdentityUser
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: github-actions-gsa
    namespace: config-connector
```
**Explanation:** Workload Identity Federation eliminates long-lived service account keys in CI/CD entirely. GitHub Actions exchanges its OIDC token for a GCP access token, scoped to the specific repository and GSA defined in this KCC resource.

---

### Example 42: Automated IAM Lifecycle with KCC + Argo CD
**Concept:** Full GitOps IAM lifecycle where Argo CD syncs KCC IAM resources from git on every PR merge.
```yaml
# argo-cd/applications/iam-management.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gcp-iam-management
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: https://github.com/myorg/gcp-iam-config
    targetRevision: main
    path: iam/production
  destination:
    server: https://kubernetes.default.svc
    namespace: config-connector
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - RespectIgnoreDifferences=true
  ignoreDifferences:
    - group: iam.cnrm.cloud.google.com
      kind: IAMPolicy
      jsonPointers:
        - /spec/bindings
```
**Explanation:** `prune: true` means Argo CD will delete KCC IAM resources removed from git, which triggers KCC to remove the GCP binding. `selfHeal: true` corrects drift — if someone manually adds a binding via `gcloud`, Argo CD restores the git-defined state.

---

### Example 43: Service Account Key Rotation Automation
**Concept:** Automate key rotation by deleting and recreating `IAMServiceAccountKey` KCC resources on a schedule.
```bash
# Rotate key by replacing the KCC resource (triggers deletion + recreation)
kubectl delete iamserviceaccountkey my-workload-sa-key -n config-connector

# Wait for deletion
kubectl wait --for=delete iamserviceaccountkey/my-workload-sa-key \
  -n config-connector --timeout=60s

# Re-apply to create a new key (stored in new secret)
kubectl apply -f - <<EOF
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccountKey
metadata:
  name: my-workload-sa-key
  namespace: config-connector
spec:
  privateKeyType: TYPE_GOOGLE_CREDENTIALS_FILE
  serviceAccountRef:
    name: my-workload-sa
    namespace: config-connector
EOF
```
**Explanation:** This pattern can be automated via a Kubernetes CronJob. The new key is stored in a Kubernetes Secret, which can be synced to workloads via the External Secrets Operator. Aim for 90-day rotation cycles as a baseline.

---

### Example 44: Least-Privilege CI/CD Service Account
**Concept:** Define the minimal IAM set for a CI/CD pipeline service account using multiple KCC resources.
```yaml
# GSA for CI/CD
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: cicd-pipeline-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "CI/CD Pipeline Service Account"
---
# Push to Artifact Registry
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: cicd-artifact-writer
  namespace: config-connector
spec:
  member: serviceAccount:cicd-pipeline-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/artifactregistry.writer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
---
# Deploy to GKE
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: cicd-gke-developer
  namespace: config-connector
spec:
  member: serviceAccount:cicd-pipeline-sa@my-gcp-project.iam.gserviceaccount.com
  role: roles/container.developer
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
```
**Explanation:** Each IAM permission is a separate `IAMPolicyMember` resource, making it easy to audit, add, or remove individual capabilities. Avoid `roles/editor` or `roles/owner` for CI/CD — the blast radius of a compromised pipeline token is limited by these granular bindings.

---

### Example 45: IAM Deny Policy via KCC (Preview Resource)
**Concept:** GCP IAM Deny policies explicitly block specific actions, overriding any allow bindings.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1alpha1
kind: IAMDenyPolicy
metadata:
  name: deny-bucket-delete
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  parent: projects/my-gcp-project
  displayName: "Deny bucket deletion for all except admins"
  rules:
    - denyRule:
        deniedPrincipals:
          - principalSet://goog/public:all
        exceptionPrincipals:
          - serviceAccount:storage-admin@my-gcp-project.iam.gserviceaccount.com
        deniedPermissions:
          - storage.googleapis.com/buckets.delete
```
**Explanation:** IAM Deny policies are evaluated before allow policies and cannot be overridden by granting `roles/owner`. This is a critical control for protecting production data — even if a service account is accidentally granted broad permissions, the deny policy prevents bucket deletion.

---

### Example 46: Full Production IAM Stack — Terraform + KCC + Helm
**Concept:** End-to-end production IAM setup combining Terraform infra, KCC IAM management, and Helm application deployment.
```bash
# Step 1: Terraform provisions GKE cluster with Workload Identity enabled
terraform apply -target=module.gke_cluster

# Step 2: KCC bootstrap — install Config Connector
helm upgrade --install config-connector \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/config-connector \
  --namespace cnrm-system --create-namespace \
  --values config-connector-values.yaml

# Step 3: Apply KCC IAM resources from GitOps repo
kubectl apply -k iam/production/

# Step 4: Wait for all IAM resources to reconcile
kubectl wait --for=condition=Ready \
  iamserviceaccount,iampolicymember \
  --all -n config-connector --timeout=300s

# Step 5: Deploy application with Helm
helm upgrade --install my-app \
  oci://us-central1-docker.pkg.dev/my-gcp-project/helm-charts/my-app \
  --namespace my-app --create-namespace \
  --values values-production.yaml
```
**Explanation:** This 5-step sequence is the production deployment pattern for GKE with KCC. Each step has a clear prerequisite, and the `kubectl wait` gate between steps 4 and 5 ensures IAM is active before application pods start. Codify this as a CI/CD pipeline for repeatable deployments.

---

### Example 47: IAM Audit Export to BigQuery via KCC
**Concept:** Configure Cloud Logging sinks to export IAM audit logs to BigQuery for analysis.
```yaml
# KCC: configure log sink for IAM audit events
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingLogSink
metadata:
  name: iam-audit-to-bigquery
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  destination: bigquery.googleapis.com/projects/my-gcp-project/datasets/audit_logs
  filter: >
    protoPayload.serviceName="iam.googleapis.com" AND
    protoPayload.methodName=~"google.iam.admin.v1.IAM.*"
  bigqueryOptions:
    usePartitionedTables: true
```
**Explanation:** Exporting IAM audit logs to BigQuery enables SQL-based security analysis — detect privilege escalation, unused permissions, and access anomalies. Partitioned tables keep query costs low as log volume grows.

---

### Example 48: Per-Environment IAM Overlays with Kustomize
**Concept:** Use Kustomize overlays to apply different IAM bindings per environment while reusing base GSA definitions.
```yaml
# base/kustomization.yaml
resources:
  - iam-service-accounts.yaml
  - iam-workload-identity.yaml

# overlays/production/kustomization.yaml
bases:
  - ../../base
patches:
  - path: production-iam-patch.yaml

# overlays/production/production-iam-patch.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: my-app-gsa-prod-storage
  namespace: config-connector
spec:
  role: roles/storage.objectAdmin
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-prod-data
    namespace: config-connector
```
**Explanation:** Kustomize overlays let production have broader IAM than staging (e.g., `objectAdmin` vs `objectViewer`) without duplicating the GSA definitions. Combine with Argo CD ApplicationSets to deploy environment-specific IAM from a single git repository.

---

### Example 49: Drift Detection and Remediation for KCC IAM
**Concept:** Detect when GCP IAM state drifts from KCC desired state and trigger automated remediation.
```bash
# Force KCC to re-sync all IAM resources (triggers GCP API reconciliation)
kubectl annotate iampolicymember --all \
  -n config-connector \
  cnrm.cloud.google.com/reconcile-on="$(date +%s)" \
  --overwrite

# Check for failed reconciliations
kubectl get iampolicymember,iamserviceaccount \
  -n config-connector \
  -o jsonpath='{range .items[?(@.status.conditions[0].reason!="UpToDate")]}{.metadata.name}{"\t"}{.status.conditions[0].message}{"\n"}{end}'

# Export current GCP IAM policy and compare with KCC desired state
gcloud projects get-iam-policy my-gcp-project --format=json > actual-policy.json
kubectl get iampolicymember -n config-connector -o json > desired-state.json
```
**Explanation:** The annotation trick forces KCC to re-reconcile all resources immediately. The jsonpath query surfaces any resources that are not `UpToDate`, narrowing the scope of investigation. Schedule this as a daily CronJob to proactively detect drift before it causes incidents.

---

### Example 50: Complete Enterprise IAM-as-Code Architecture
**Concept:** Full enterprise IAM governance combining Terraform (bootstrap), KCC (operational), Config Sync (GitOps), and Helm (apps).
```yaml
# config-sync-repo/iam/production/namespace-configs/
# Each file manages one team's IAM surface

# team-payments/iam-service-accounts.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: payments-api-gsa
  namespace: team-payments
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: "Payments API GSA"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: payments-api-permissions
  namespace: team-payments
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  bindings:
    - role: roles/cloudsql.client
      members:
        - memberFrom:
            serviceAccountRef:
              name: payments-api-gsa
    - role: roles/pubsub.publisher
      members:
        - memberFrom:
            serviceAccountRef:
              name: payments-api-gsa
    - role: roles/secretmanager.secretAccessor
      members:
        - memberFrom:
            serviceAccountRef:
              name: payments-api-gsa
```
```bash
# Validate IAM config before merge (run in CI)
kubeval --strict iam/production/**/*.yaml
kubectl apply --dry-run=server -k iam/production/

# Config Sync syncs on merge to main
# Argo CD deploys Helm charts after IAM reconciles
```
**Explanation:** This architecture gives each team ownership of their IAM surface in git while the platform team controls the KCC operator permissions. Config Sync continuously enforces the declared state, Argo CD gates application deployments on IAM readiness, and the custom role registry prevents permission sprawl. This is the production-grade pattern for compliance-driven organizations.
