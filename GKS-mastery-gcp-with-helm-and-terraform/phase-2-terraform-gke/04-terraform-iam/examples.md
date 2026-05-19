# Terraform GCP IAM for GKE Workloads — 50 Examples

> GCP project: `my-gcp-project` | Cluster: `my-gke-cluster` | Region: `us-central1`
> Terraform google provider `~> 5.0` | KCC apiVersion: `cnrm.cloud.google.com/v1beta1`

---

## BASIC (Examples 1–13)

---

### Example 1: Create a GCP Service Account
**Concept:** `google_service_account` provisions an IAM identity used by GKE workloads to authenticate with GCP APIs.

```hcl
resource "google_service_account" "gke_app_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-app-sa"
  display_name = "GKE Application Service Account"
  description  = "Service account for GKE workloads in my-gke-cluster"
}

output "service_account_email" {
  value = google_service_account.gke_app_sa.email
}
```

**Explanation:** The `account_id` must be 6–30 characters, lowercase letters, digits, and hyphens. Terraform outputs the full email (`gke-app-sa@my-gcp-project.iam.gserviceaccount.com`) which is used in subsequent IAM bindings. The service account is created in `my-gcp-project` and scoped to that project.

---

### Example 2: Grant a Single IAM Role with `google_project_iam_member`
**Concept:** `google_project_iam_member` adds one member to one role on a project without affecting existing bindings.

```hcl
resource "google_project_iam_member" "gke_app_storage_reader" {
  project = "my-gcp-project"
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.gke_app_sa.email}"
}
```

**Explanation:** This is the safest, most additive IAM resource in Terraform — it only adds the specified member and never removes others bound to the same role. It is idempotent on apply and safe to use in shared environments. The `member` field uses the `serviceAccount:` prefix to identify the principal type.

---

### Example 3: Bind Multiple Members to a Role with `google_project_iam_binding`
**Concept:** `google_project_iam_binding` authoritatively manages all members for a single role, replacing any members not listed.

```hcl
resource "google_project_iam_binding" "gke_developers" {
  project = "my-gcp-project"
  role    = "roles/container.developer"

  members = [
    "serviceAccount:${google_service_account.gke_app_sa.email}",
    "user:dev-team-lead@example.com",
    "group:gke-developers@example.com",
  ]
}
```

**Explanation:** Unlike `google_project_iam_member`, this resource owns the entire membership list for `roles/container.developer` — any member not listed here will be removed on the next `terraform apply`. Use this when you need strict enforcement of who holds a particular role. Avoid using both `google_project_iam_binding` and `google_project_iam_member` for the same role on the same project, as they will conflict.

---

### Example 4: Full Project IAM Policy with `google_project_iam_policy`
**Concept:** `google_project_iam_policy` replaces the entire project-level IAM policy with the declared bindings.

```hcl
data "google_iam_policy" "gke_cluster_policy" {
  binding {
    role = "roles/container.admin"
    members = [
      "user:platform-admin@example.com",
    ]
  }

  binding {
    role = "roles/container.developer"
    members = [
      "serviceAccount:${google_service_account.gke_app_sa.email}",
    ]
  }
}

resource "google_project_iam_policy" "project_policy" {
  project     = "my-gcp-project"
  policy_data = data.google_iam_policy.gke_cluster_policy.policy_data
}
```

**Explanation:** This is the most destructive IAM resource — it overwrites the **entire** project IAM policy, including roles granted to Google-managed service accounts. Use with extreme caution, only in greenfield projects where Terraform owns all IAM. The `data.google_iam_policy` block composes the policy JSON from declarative `binding` blocks. Most teams prefer `google_project_iam_member` for safety.

---

### Example 5: Grant `roles/container.admin` to a GKE Platform Admin SA
**Concept:** `roles/container.admin` provides full control over GKE clusters and all Kubernetes resources within them.

```hcl
resource "google_service_account" "platform_admin_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-platform-admin"
  display_name = "GKE Platform Admin Service Account"
}

resource "google_project_iam_member" "platform_admin_container" {
  project = "my-gcp-project"
  role    = "roles/container.admin"
  member  = "serviceAccount:${google_service_account.platform_admin_sa.email}"
}
```

**Explanation:** `roles/container.admin` includes `container.clusters.create`, `container.clusters.delete`, `container.clusters.update`, and all node pool management permissions. This role should be reserved for CI/CD service accounts that provision clusters, not for application workloads. Coupling this with `google_service_account` in the same file ensures the SA exists before the binding is created.

---

### Example 6: Grant `roles/container.developer` to an App Workload SA
**Concept:** `roles/container.developer` allows deploying and managing workloads in a GKE cluster without cluster-level administrative access.

```hcl
resource "google_service_account" "app_deploy_sa" {
  project      = "my-gcp-project"
  account_id   = "app-deploy-sa"
  display_name = "Application Deployment Service Account"
}

resource "google_project_iam_member" "app_deploy_container" {
  project = "my-gcp-project"
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.app_deploy_sa.email}"
}
```

**Explanation:** `roles/container.developer` includes permissions like `container.pods.create`, `container.deployments.update`, and `container.services.create`, without granting `container.clusters.*` permissions. This follows least-privilege: application deployment pipelines only need to push workloads, not manage the cluster itself. This SA is suitable for use as a Helm deployment identity.

---

### Example 7: Grant `roles/container.viewer` for Read-Only Cluster Access
**Concept:** `roles/container.viewer` provides read-only access to GKE clusters and their workload configurations.

```hcl
resource "google_service_account" "monitoring_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-monitoring-sa"
  display_name = "GKE Monitoring Read-Only SA"
}

resource "google_project_iam_member" "monitoring_viewer" {
  project = "my-gcp-project"
  role    = "roles/container.viewer"
  member  = "serviceAccount:${google_service_account.monitoring_sa.email}"
}
```

**Explanation:** `roles/container.viewer` grants only `get` and `list` permissions on cluster resources, making it appropriate for observability tools, dashboards, or audit systems. Read-only identities minimize blast radius if credentials are compromised. Pair this with `roles/monitoring.viewer` when building a full observability SA.

---

### Example 8: List Predefined GKE IAM Roles via Data Source
**Concept:** The `google_iam_testable_permissions` and `google_project_iam_policy` data sources can enumerate roles; here we use a local to document the common predefined GKE roles.

```hcl
# Document common predefined GKE roles as a local map for reference and reuse
locals {
  gke_predefined_roles = {
    admin        = "roles/container.admin"
    cluster_admin = "roles/container.clusterAdmin"
    developer    = "roles/container.developer"
    viewer       = "roles/container.viewer"
    node_sa      = "roles/container.nodeServiceAccount"
    host_agent   = "roles/container.hostServiceAgentUser"
  }
}

# Grant the cluster node service account role to the default node SA
resource "google_project_iam_member" "node_sa_role" {
  project = "my-gcp-project"
  role    = local.gke_predefined_roles["node_sa"]
  member  = "serviceAccount:${google_service_account.gke_app_sa.email}"
}
```

**Explanation:** Storing role names in a `locals` block prevents typos and makes it easy to audit which roles are in use across your Terraform configuration. `roles/container.nodeServiceAccount` is the minimum role required for GKE nodes to pull images and communicate with the Kubernetes API server. `roles/container.clusterAdmin` is a superset of `container.admin` and should only be assigned to break-glass accounts.

---

### Example 9: Grant Artifact Registry Reader to a GKE Node Pool SA
**Concept:** GKE nodes need `roles/artifactregistry.reader` to pull container images from Artifact Registry without using public image mirrors.

```hcl
resource "google_service_account" "node_pool_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-node-pool-sa"
  display_name = "GKE Node Pool Service Account"
}

resource "google_project_iam_member" "node_ar_reader" {
  project = "my-gcp-project"
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.node_pool_sa.email}"
}

resource "google_project_iam_member" "node_logging" {
  project = "my-gcp-project"
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.node_pool_sa.email}"
}

resource "google_project_iam_member" "node_monitoring" {
  project = "my-gcp-project"
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.node_pool_sa.email}"
}
```

**Explanation:** A custom node pool SA should have the minimum set of roles: `artifactregistry.reader` for image pulls, `logging.logWriter` for Cloud Logging, and `monitoring.metricWriter` for Cloud Monitoring. Avoid using the Compute Engine default SA (`-compute@developer.gserviceaccount.com`) for GKE nodes as it has broad Editor permissions. Terraform manages all three bindings independently, so any can be removed without affecting the others.

---

### Example 10: Grant Secret Manager Accessor Role to an App SA
**Concept:** `roles/secretmanager.secretAccessor` allows a GKE workload to read secret values from Secret Manager at runtime.

```hcl
resource "google_service_account" "secret_reader_sa" {
  project      = "my-gcp-project"
  account_id   = "app-secret-reader"
  display_name = "App Secret Manager Reader SA"
}

resource "google_project_iam_member" "secret_accessor" {
  project = "my-gcp-project"
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.secret_reader_sa.email}"
}
```

**Explanation:** Granting access at the project level allows the SA to read all secrets in the project; for finer control, use `google_secret_manager_secret_iam_member` to scope access to individual secrets. This pattern is foundational for GKE workloads that need to fetch database passwords, API keys, or TLS certificates from Secret Manager. Workload Identity (covered in the Intermediate section) allows the Kubernetes pod's SA to impersonate this GCP SA without needing a key file.

---

### Example 11: Service Account with `google_project_iam_binding` for Multiple Roles
**Concept:** Multiple `google_project_iam_binding` blocks each authoritatively manage a distinct role for a service account.

```hcl
resource "google_service_account" "pubsub_worker_sa" {
  project      = "my-gcp-project"
  account_id   = "pubsub-worker-sa"
  display_name = "Pub/Sub Worker SA for GKE"
}

resource "google_project_iam_binding" "pubsub_subscriber" {
  project = "my-gcp-project"
  role    = "roles/pubsub.subscriber"
  members = [
    "serviceAccount:${google_service_account.pubsub_worker_sa.email}",
  ]
}

resource "google_project_iam_binding" "pubsub_viewer" {
  project = "my-gcp-project"
  role    = "roles/pubsub.viewer"
  members = [
    "serviceAccount:${google_service_account.pubsub_worker_sa.email}",
  ]
}
```

**Explanation:** Each `google_project_iam_binding` controls all members for one role; you can have multiple bindings for different roles without conflict. `roles/pubsub.subscriber` allows the SA to pull messages from subscriptions, while `roles/pubsub.viewer` allows listing topics and subscriptions. This is a common pattern for GKE-based event-driven workers that consume from Pub/Sub.

---

### Example 12: Data Source — Look Up an Existing Service Account
**Concept:** `data.google_service_account` retrieves metadata for an existing SA that was created outside Terraform.

```hcl
data "google_service_account" "existing_sa" {
  project    = "my-gcp-project"
  account_id = "pre-existing-app-sa"
}

resource "google_project_iam_member" "existing_sa_viewer" {
  project = "my-gcp-project"
  role    = "roles/container.viewer"
  member  = "serviceAccount:${data.google_service_account.existing_sa.email}"
}
```

**Explanation:** Using a data source is essential for importing IAM grants onto SAs created by other teams or tools. The `account_id` is the short ID without the full email suffix. This pattern prevents Terraform from trying to create a duplicate SA while still managing the role binding lifecycle. Combining data sources with resources is a common bridge pattern during IAM migrations.

---

### Example 13: Service Account Description and Labels via `google_service_account`
**Concept:** Adding descriptions and labels to service accounts improves auditability and cost attribution across GKE environments.

```hcl
resource "google_service_account" "labeled_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-workload-labeled"
  display_name = "GKE Workload SA — Labeled"
  description  = "Managed by Terraform. Used by the payments service in my-gke-cluster."
}

# Tag the SA with resource manager tags for policy enforcement
resource "google_tags_tag_binding" "sa_env_tag" {
  parent    = "//iam.googleapis.com/projects/my-gcp-project/serviceAccounts/${google_service_account.labeled_sa.unique_id}"
  tag_value = "tagValues/123456789"
}
```

**Explanation:** The `description` field is visible in the Cloud Console and in audit logs, making it easy to identify the owning team and workload. Resource Manager tag bindings on SAs enable attribute-based access control (ABAC) policies, such as restricting which resources the SA can access based on environment tags. Using `unique_id` (not email) in the `parent` field is required for tag bindings on IAM resources. This is a governance best practice for large GKE environments with many service accounts.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: Workload Identity — Create a GCP SA and Link to Kubernetes SA
**Concept:** Workload Identity allows a Kubernetes ServiceAccount to impersonate a GCP ServiceAccount without a key file, using `roles/iam.workloadIdentityUser`.

```hcl
# Step 1: Create the GCP Service Account
resource "google_service_account" "workload_identity_sa" {
  project      = "my-gcp-project"
  account_id   = "wi-app-sa"
  display_name = "Workload Identity App SA"
}

# Step 2: Grant the Kubernetes SA permission to impersonate the GCP SA
resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.workload_identity_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[default/app-ksa]"
}

# Step 3: Grant the GCP SA access to required GCP APIs
resource "google_project_iam_member" "wi_sa_storage" {
  project = "my-gcp-project"
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.workload_identity_sa.email}"
}
```

**Explanation:** The `member` string `serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/KSA_NAME]` is the Workload Identity pool identity that maps a Kubernetes ServiceAccount (`app-ksa` in `default` namespace) to the GCP SA. `google_service_account_iam_member` operates on the SA resource itself (not the project), granting `roles/iam.workloadIdentityUser` specifically. The Kubernetes SA still needs the `iam.gke.io/gcp-service-account` annotation (shown in later examples) to complete the link.

---

### Example 15: Workload Identity — Annotate the Kubernetes SA with Terraform Kubernetes Provider
**Concept:** The Kubernetes ServiceAccount must carry an annotation pointing to the GCP SA email to complete the Workload Identity binding.

```hcl
terraform {
  required_providers {
    google     = { source = "hashicorp/google", version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.0" }
  }
}

data "google_client_config" "default" {}

data "google_container_cluster" "gke" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"
}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
}

resource "kubernetes_service_account" "app_ksa" {
  metadata {
    name      = "app-ksa"
    namespace = "default"
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.workload_identity_sa.email
    }
  }
}
```

**Explanation:** The `iam.gke.io/gcp-service-account` annotation on the Kubernetes SA is what GKE's metadata server reads to issue short-lived OAuth 2.0 tokens to pods. The `data.google_container_cluster` data source dynamically fetches the cluster endpoint and CA certificate so the Kubernetes provider can authenticate. The Terraform resource dependency chain (`workload_identity_sa` → `workload_identity_binding` → `kubernetes_service_account`) ensures correct ordering.

---

### Example 16: Workload Identity for Namespace-Scoped App
**Concept:** A dedicated GCP SA and Kubernetes SA per application namespace enforces IAM isolation between microservices running in the same GKE cluster.

```hcl
variable "apps" {
  default = [
    { name = "payments", namespace = "payments-ns" },
    { name = "orders",   namespace = "orders-ns"   },
  ]
}

resource "google_service_account" "app_sa" {
  for_each     = { for a in var.apps : a.name => a }
  project      = "my-gcp-project"
  account_id   = "${each.key}-sa"
  display_name = "${each.key} workload SA"
}

resource "google_service_account_iam_member" "wi_binding" {
  for_each           = { for a in var.apps : a.name => a }
  service_account_id = google_service_account.app_sa[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[${each.value.namespace}/${each.key}-ksa]"
}
```

**Explanation:** Using `for_each` on a list of applications ensures each microservice gets its own GCP SA and Workload Identity binding without duplicating resource blocks. Each app's Kubernetes SA (`payments-ksa` in `payments-ns`, etc.) is mapped to a distinct GCP SA, so a compromise of the `orders` pod cannot access `payments` GCP resources. This pattern scales cleanly as new microservices are onboarded by appending to the `apps` variable.

---

### Example 17: Custom IAM Role with `google_project_iam_custom_role`
**Concept:** `google_project_iam_custom_role` creates a project-scoped role with an exact set of permissions, enforcing least privilege beyond what predefined roles offer.

```hcl
resource "google_project_iam_custom_role" "gke_secret_reader" {
  project     = "my-gcp-project"
  role_id     = "gkeSecretReader"
  title       = "GKE Secret Reader"
  description = "Allows GKE workloads to access specific Secret Manager secrets"
  stage       = "GA"

  permissions = [
    "secretmanager.versions.access",
    "secretmanager.secrets.get",
    "secretmanager.secrets.list",
  ]
}

resource "google_project_iam_member" "app_custom_role" {
  project = "my-gcp-project"
  role    = google_project_iam_custom_role.gke_secret_reader.name
  member  = "serviceAccount:${google_service_account.workload_identity_sa.email}"
}
```

**Explanation:** Custom roles allow granting only `secretmanager.versions.access` without also granting `secretmanager.secrets.create` or `secretmanager.secrets.delete` that come bundled in predefined roles. The `stage` field can be `ALPHA`, `BETA`, or `GA`; production roles should be `GA`. The `name` output of a custom role follows the format `projects/PROJECT_ID/roles/ROLE_ID`, which is accepted by IAM binding resources. Deleted custom roles enter a 7-day grace period before permanent removal.

---

### Example 18: Conditional IAM Binding with `condition` Block
**Concept:** IAM conditions allow granting a role only when specific attributes match, such as restricting access to a resource tag or time window.

```hcl
resource "google_project_iam_member" "conditional_storage_admin" {
  project = "my-gcp-project"
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.gke_app_sa.email}"

  condition {
    title       = "gke-cluster-tag-only"
    description = "Only allow access to resources tagged for GKE cluster"
    expression  = "resource.matchTag('my-gcp-project/environment', 'production')"
  }
}
```

**Explanation:** The `condition.expression` uses Common Expression Language (CEL) to evaluate attributes at policy enforcement time. This binding only grants `storage.admin` when the target resource carries the `environment: production` tag, preventing accidental writes to dev/staging buckets. Conditions are supported on `google_project_iam_member`, `google_project_iam_binding`, and resource-level IAM resources. Not all GCP services support IAM conditions — check the service documentation before relying on them.

---

### Example 19: Time-Bounded Conditional IAM for Break-Glass Access
**Concept:** A CEL time condition grants elevated access only during a specified window, automating expiry without manual policy cleanup.

```hcl
resource "google_project_iam_member" "break_glass_admin" {
  project = "my-gcp-project"
  role    = "roles/container.admin"
  member  = "user:on-call-engineer@example.com"

  condition {
    title      = "break-glass-window"
    expression = "request.time < timestamp('2026-06-01T00:00:00Z')"
  }
}
```

**Explanation:** After `2026-06-01T00:00:00Z`, this IAM binding becomes permanently inactive and GCP denies requests matching it. Time-bounded access is a best practice for incident response (break-glass) scenarios where an engineer needs temporary elevated permissions. The binding still exists in Terraform state after expiry — add a `lifecycle { destroy on expiry }` comment or an external rotation script to clean it up. Pair this with Cloud Audit Logs to capture all actions taken during the access window.

---

### Example 20: IAM Deny Policy with `google_iam_deny_policy`
**Concept:** IAM deny policies enforce hard restrictions that override any allow bindings, blocking specific permissions for specified principals.

```hcl
resource "google_iam_deny_policy" "block_sa_key_creation" {
  parent       = urlencode("cloudresourcemanager.googleapis.com/projects/my-gcp-project")
  name         = "block-sa-key-creation"
  display_name = "Block Service Account Key Creation"

  rules {
    description = "Prevent any principal from creating SA keys in GKE namespace SAs"

    deny_rule {
      denied_principals = [
        "principal://iam.googleapis.com/projects/my-gcp-project/serviceAccounts/gke-app-sa@my-gcp-project.iam.gserviceaccount.com",
      ]
      denied_permissions = [
        "iam.googleapis.com/serviceAccountKeys.create",
      ]
    }
  }
}
```

**Explanation:** Deny policies evaluate before allow policies, making them the strongest enforcement mechanism in GCP IAM. Blocking `serviceAccountKeys.create` on GKE SAs forces all workloads to use Workload Identity instead of static key files, which is a security best practice. The `parent` must be URL-encoded because it contains forward slashes. Deny policies are billed as a separate IAM feature and require enabling the IAM API.

---

### Example 21: Service Account Key Management (and Why to Avoid It)
**Concept:** `google_service_account_key` creates a static JSON key; this pattern is shown for legacy awareness but Workload Identity is strongly preferred.

```hcl
# WARNING: Static SA keys are a security risk. Use Workload Identity instead.
# This example is for legacy or off-cluster use cases only.
resource "google_service_account_key" "legacy_key" {
  service_account_id = google_service_account.gke_app_sa.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Store the key in Secret Manager, never in Terraform state unencrypted
resource "google_secret_manager_secret" "sa_key_secret" {
  project   = "my-gcp-project"
  secret_id = "gke-app-sa-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "sa_key_version" {
  secret      = google_secret_manager_secret.sa_key_secret.id
  secret_data = base64decode(google_service_account_key.legacy_key.private_key)
}
```

**Explanation:** The `private_key` output is base64-encoded JSON and is stored in Terraform state in plaintext unless state encryption is configured — this is a significant security risk. If static keys are unavoidable (e.g., external CI systems without Workload Identity Federation support), immediately store them in Secret Manager and rotate them on a schedule using Cloud Scheduler. Keys have no built-in expiry; use an organization policy (`constraints/iam.disableServiceAccountKeyCreation`) to block them cluster-wide.

---

### Example 22: Disable Service Account with `google_service_account`
**Concept:** Setting `disabled = true` on a service account prevents it from authenticating without deleting it, useful for incident response.

```hcl
resource "google_service_account" "disabled_sa" {
  project      = "my-gcp-project"
  account_id   = "compromised-sa"
  display_name = "Compromised SA — Disabled"
  disabled     = true
}
```

**Explanation:** Disabling a SA immediately revokes all its active tokens and key-based authentications without permanently deleting the SA or its IAM bindings. This is faster than removing IAM bindings and is reversible by setting `disabled = false`. In incident response workflows, automated detection systems can update this Terraform variable via CI/CD to quarantine a compromised identity. Re-enabling requires setting `disabled = false` and re-applying, providing a clear audit trail in git history.

---

### Example 23: Grant Resource-Level IAM on a GCS Bucket
**Concept:** `google_storage_bucket_iam_member` grants IAM on a specific bucket rather than the entire project, enforcing least privilege.

```hcl
resource "google_storage_bucket" "app_data" {
  project  = "my-gcp-project"
  name     = "my-gcp-project-app-data"
  location = "US-CENTRAL1"
}

resource "google_storage_bucket_iam_member" "app_sa_bucket_reader" {
  bucket = google_storage_bucket.app_data.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.workload_identity_sa.email}"
}
```

**Explanation:** Resource-level IAM is always preferable to project-level IAM when the SA only needs access to a specific resource. `google_storage_bucket_iam_member` creates a binding in the bucket's IAM policy, not the project policy, so `terraform destroy` removes it without affecting project-level bindings. GKE workloads using Workload Identity can use this to access only their application's bucket, not all buckets in the project.

---

### Example 24: Impersonate a Service Account via `google_service_account_iam_member`
**Concept:** Granting `roles/iam.serviceAccountTokenCreator` allows one SA to impersonate another, enabling privilege separation between deployment and execution identities.

```hcl
resource "google_service_account" "deployer_sa" {
  project      = "my-gcp-project"
  account_id   = "helm-deployer-sa"
  display_name = "Helm Deployment SA"
}

resource "google_service_account" "runtime_sa" {
  project      = "my-gcp-project"
  account_id   = "app-runtime-sa"
  display_name = "Application Runtime SA"
}

# Allow the deployer SA to impersonate the runtime SA
resource "google_service_account_iam_member" "deployer_can_impersonate_runtime" {
  service_account_id = google_service_account.runtime_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.deployer_sa.email}"
}
```

**Explanation:** `roles/iam.serviceAccountTokenCreator` allows the grantee to generate short-lived tokens for the target SA, enabling short-lived credential chains instead of static keys. This is commonly used in Helm deployment pipelines where the CI/CD SA (`helm-deployer-sa`) needs to set up resources that will later run as `app-runtime-sa`. Impersonation chains should be kept to one hop when possible to reduce attack surface and simplify audit trails.

---

### Example 25: Project IAM Audit Config for GKE APIs
**Concept:** `google_project_iam_audit_config` enables Cloud Audit Logs for specific GCP services to capture all IAM-related activity on GKE clusters.

```hcl
resource "google_project_iam_audit_config" "container_audit" {
  project = "my-gcp-project"
  service = "container.googleapis.com"

  audit_log_config {
    log_type = "ADMIN_READ"
  }

  audit_log_config {
    log_type = "DATA_READ"
  }

  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

resource "google_project_iam_audit_config" "iam_audit" {
  project = "my-gcp-project"
  service = "iam.googleapis.com"

  audit_log_config {
    log_type = "ADMIN_READ"
  }
}
```

**Explanation:** Audit logs capture who did what, when, and from where — essential for compliance frameworks like SOC 2 and PCI DSS. Enabling `DATA_WRITE` for `container.googleapis.com` captures all `kubectl apply`, `helm upgrade`, and API server mutations. `ADMIN_READ` on `iam.googleapis.com` captures all `getIamPolicy` calls, which is useful for detecting reconnaissance activity. Note that Data Access audit logs can generate high log volume and associated Cloud Logging costs.

---

### Example 26: Org-Level Service Account IAM with `google_organization_iam_member`
**Concept:** `google_organization_iam_member` grants a role at the organization level, which is inherited by all projects in the organization.

```hcl
data "google_organization" "org" {
  domain = "example.com"
}

resource "google_service_account" "org_viewer_sa" {
  project      = "my-gcp-project"
  account_id   = "org-viewer-sa"
  display_name = "Organization-Wide Viewer SA"
}

resource "google_organization_iam_member" "org_viewer" {
  org_id = data.google_organization.org.org_id
  role   = "roles/viewer"
  member = "serviceAccount:${google_service_account.org_viewer_sa.email}"
}
```

**Explanation:** Organization-level IAM is the highest-level grant in the GCP resource hierarchy and should only be used for centralized monitoring, compliance, or security tooling that genuinely needs cross-project visibility. The SA lives in `my-gcp-project` but its IAM binding spans all projects under `example.com`. Use `roles/viewer` rather than `roles/editor` or `roles/owner` at this scope to limit blast radius. Terraform state for org-level bindings is best stored in a dedicated security/foundations project.

---

## NESTED (Examples 27–38)

---

### Example 27: Terraform IAM Module — SA + Project Binding + Workload Identity
**Concept:** A reusable Terraform module encapsulates SA creation, IAM binding, and Workload Identity setup as a single composable unit.

```hcl
# modules/workload-identity/variables.tf
variable "project_id"      { type = string }
variable "account_id"      { type = string }
variable "display_name"    { type = string }
variable "k8s_namespace"   { type = string }
variable "k8s_sa_name"     { type = string }
variable "roles"           { type = list(string) }

# modules/workload-identity/main.tf
resource "google_service_account" "sa" {
  project      = var.project_id
  account_id   = var.account_id
  display_name = var.display_name
}

resource "google_project_iam_member" "bindings" {
  for_each = toset(var.roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.sa.email}"
}

resource "google_service_account_iam_member" "wi" {
  service_account_id = google_service_account.sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.k8s_namespace}/${var.k8s_sa_name}]"
}

# modules/workload-identity/outputs.tf
output "email"       { value = google_service_account.sa.email }
output "name"        { value = google_service_account.sa.name }
output "sa_annotation" {
  value = { "iam.gke.io/gcp-service-account" = google_service_account.sa.email }
}
```

**Explanation:** This module pattern reduces boilerplate by accepting a list of `roles` and creating all bindings with `for_each`, while also wiring up the Workload Identity member in a single call. The `sa_annotation` output provides a ready-made annotation map that can be passed directly to a `kubernetes_service_account` resource. Callers invoke this module once per microservice, making IAM provisioning self-service. Module versioning via Terraform Registry or git tags enables controlled rollouts of IAM policy changes across all services.

---

### Example 28: Module Invocation — Consuming the Workload Identity Module
**Concept:** Calling the workload-identity module from a root configuration wires together GCP SA, IAM bindings, and K8s SA annotation for a specific app.

```hcl
module "payments_wi" {
  source        = "./modules/workload-identity"
  project_id    = "my-gcp-project"
  account_id    = "payments-wi-sa"
  display_name  = "Payments Service Workload Identity SA"
  k8s_namespace = "payments"
  k8s_sa_name   = "payments-ksa"
  roles = [
    "roles/storage.objectViewer",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.subscriber",
  ]
}

resource "kubernetes_service_account" "payments_ksa" {
  metadata {
    name        = "payments-ksa"
    namespace   = "payments"
    annotations = module.payments_wi.sa_annotation
  }
}
```

**Explanation:** The root configuration is clean and declarative — it expresses intent (the payments service needs storage, secrets, and pubsub) without repeating the boilerplate of SA creation and Workload Identity wiring. The `module.payments_wi.sa_annotation` output automatically produces the correct `iam.gke.io/gcp-service-account` annotation map. Module outputs can also be passed as Helm values (see Example 33), creating a tight integration between Terraform-managed IAM and Helm-deployed workloads.

---

### Example 29: KCC `IAMServiceAccount` Resource alongside Terraform SA
**Concept:** KCC's `IAMServiceAccount` can co-exist with Terraform-managed SAs when different teams own different parts of the IAM lifecycle.

```yaml
# kcc/iam-service-account.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: kcc-managed-sa
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  displayName: KCC Managed Service Account
  description: Created by Config Connector for GKE workloads
```

```hcl
# Reference the KCC-created SA in Terraform for additional bindings
data "google_service_account" "kcc_sa" {
  project    = "my-gcp-project"
  account_id = "kcc-managed-sa"

  depends_on = [
    # Ensure KCC has reconciled before Terraform reads
    # Use a null_resource with a local-exec sleep if needed
  ]
}

resource "google_project_iam_member" "kcc_sa_reader" {
  project = "my-gcp-project"
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${data.google_service_account.kcc_sa.email}"
}
```

**Explanation:** In organizations adopting GitOps, the platform team may use KCC to manage SA lifecycle while the application team uses Terraform to manage IAM bindings — this split-ownership model is valid as long as there are no conflicting resources. The Terraform data source reads the KCC-created SA by its `account_id`. The `depends_on` comment highlights a real challenge: Terraform has no native awareness of KCC reconciliation state, so timing dependencies must be handled externally (e.g., in CI pipeline ordering). Avoid having both KCC and Terraform manage the same `IAMServiceAccount` resource simultaneously.

---

### Example 30: KCC `IAMPolicyMember` for Workload Identity
**Concept:** KCC's `IAMPolicyMember` declares the Workload Identity binding as a Kubernetes manifest, enabling GitOps-native IAM management.

```yaml
# kcc/iam-policy-member-workload-identity.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: payments-wi-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: payments-wi-sa
  role: roles/iam.workloadIdentityUser
  member: serviceAccount:my-gcp-project.svc.id.goog[payments/payments-ksa]
```

**Explanation:** `IAMPolicyMember` is the KCC equivalent of `google_service_account_iam_member`, using a `resourceRef` to bind the target SA by Kubernetes resource name rather than email address. This is particularly useful in ArgoCD or Flux GitOps workflows where IAM changes are committed to a git repository and automatically reconciled. The `member` field uses the same Workload Identity pool format as Terraform. KCC reconciles this resource continuously, so manual IAM changes in the Cloud Console will be reverted, enforcing policy-as-code.

---

### Example 31: KCC `IAMPartialPolicy` for Additive IAM Bindings
**Concept:** KCC's `IAMPartialPolicy` adds bindings to an existing IAM policy without replacing it, similar to `google_project_iam_member`.

```yaml
# kcc/iam-partial-policy.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: gke-app-partial-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  bindings:
    - role: roles/storage.objectViewer
      members:
        - memberFrom:
            serviceAccountRef:
              name: kcc-managed-sa
              namespace: config-connector
    - role: roles/pubsub.subscriber
      members:
        - member: serviceAccount:payments-wi-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** `IAMPartialPolicy` is the KCC analog to `google_project_iam_member`, ensuring it only manages the declared bindings without touching others. The `memberFrom.serviceAccountRef` syntax resolves to the email of the referenced `IAMServiceAccount` KCC resource, avoiding hardcoded email strings. This resource type is safe to use alongside Terraform-managed `google_project_iam_member` bindings on the same project. Avoid using KCC `IAMPolicy` (full policy replace) alongside Terraform IAM resources, as they will continuously overwrite each other.

---

### Example 32: Helm Chart Using Terraform-Managed SA Name
**Concept:** A Helm `values.yaml` references a Kubernetes SA created by Terraform, tying workload deployment to the IAM-provisioned identity.

```yaml
# helm/values-payments.yaml
serviceAccount:
  create: false
  name: payments-ksa      # Must match kubernetes_service_account.payments_ksa.metadata.name

image:
  repository: us-central1-docker.pkg.dev/my-gcp-project/my-repo/payments
  tag: "1.2.3"

resources:
  limits:
    cpu: "500m"
    memory: "512Mi"
```

```bash
# Deploy with Helm using the Terraform-provisioned SA
helm upgrade --install payments ./charts/payments \
  --namespace payments \
  --values helm/values-payments.yaml \
  --set image.tag=$(git rev-parse --short HEAD)
```

**Explanation:** By setting `serviceAccount.create: false` and `serviceAccount.name: payments-ksa`, Helm uses the Kubernetes SA that Terraform already created with the Workload Identity annotation. This ensures the deployment fails if the Terraform IAM provisioning step has not yet run — a desirable dependency enforcement. The Helm chart's `serviceAccountName` in the Pod spec inherits the Workload Identity annotation, so pods receive GCP tokens automatically via the metadata server. This pattern cleanly separates infrastructure concerns (SA creation, IAM binding) from application deployment concerns (chart version, image tag).

---

### Example 33: Helm with Terraform-Generated `values.yaml` via `local_file`
**Concept:** Terraform can generate a Helm `values.yaml` file containing the IAM-provisioned SA name and GCP project, ensuring configuration consistency.

```hcl
resource "local_file" "helm_values" {
  filename = "${path.module}/generated/payments-values.yaml"
  content  = yamlencode({
    serviceAccount = {
      create = false
      name   = kubernetes_service_account.payments_ksa.metadata[0].name
    }
    gcpProject = "my-gcp-project"
    gcpSaEmail = module.payments_wi.email
    config = {
      bucketName = google_storage_bucket.app_data.name
    }
  })
}

output "helm_install_command" {
  value = "helm upgrade --install payments ./charts/payments --namespace payments --values ${local_file.helm_values.filename}"
}
```

**Explanation:** `local_file` with `yamlencode` generates a machine-readable Helm values file from Terraform outputs, eliminating manual copying of SA names and project IDs. The output `helm_install_command` can be captured in CI/CD pipeline logs for traceability. This approach keeps application configuration in sync with infrastructure state — if the SA name changes, `terraform apply` regenerates the file before Helm deploy runs. The `generated/` directory should be in `.gitignore` if it contains sensitive values (SA emails, bucket names).

---

### Example 34: Cross-Project IAM — App SA in One Project, Resources in Another
**Concept:** Cross-project IAM grants a SA from `my-gcp-project` access to resources in `shared-services-project`, enabling shared infrastructure patterns.

```hcl
# In the shared-services-project Terraform configuration
resource "google_project_iam_member" "cross_project_reader" {
  project = "shared-services-project"
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:gke-app-sa@my-gcp-project.iam.gserviceaccount.com"
}

# Grant access to a specific Artifact Registry in the shared services project
resource "google_artifact_registry_repository_iam_member" "cross_project_ar" {
  project    = "shared-services-project"
  location   = "us-central1"
  repository = "shared-images"
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:gke-app-sa@my-gcp-project.iam.gserviceaccount.com"
}
```

**Explanation:** Cross-project IAM is a key pattern in multi-project GCP organizations where GKE clusters in team-specific projects need to pull images or data from shared infrastructure projects. The binding is placed in the **target** project (shared-services-project), not the source project. GCP IAM evaluates bindings on the resource being accessed, so the SA identity from `my-gcp-project` is fully valid as a member in `shared-services-project`. Manage cross-project IAM in a dedicated "shared IAM" Terraform module owned by the platform team.

---

### Example 35: KCC + Terraform: SA Created in Terraform, IAM in KCC
**Concept:** A hybrid model where Terraform provisions the GCP SA and KCC manages the IAM bindings, reflecting split team ownership.

```hcl
# terraform/sa.tf — Platform team manages SA lifecycle
resource "google_service_account" "hybrid_sa" {
  project      = "my-gcp-project"
  account_id   = "hybrid-workload-sa"
  display_name = "Hybrid Workload SA (TF SA, KCC IAM)"
}

output "hybrid_sa_email" {
  value = google_service_account.hybrid_sa.email
}
```

```yaml
# kcc/hybrid-iam-member.yaml — App team manages IAM via GitOps
apiVersion: cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: hybrid-workload-storage-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  role: roles/storage.objectViewer
  member: serviceAccount:hybrid-workload-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** This split model is practical when the platform team owns SA naming and lifecycle (preventing sprawl) while application teams self-service their own IAM bindings through GitOps PRs to the KCC manifests repository. The `member` in the KCC manifest uses the hardcoded email output from Terraform — a CI/CD step can template this from `terraform output hybrid_sa_email`. The two systems do not interfere because Terraform manages the `IAMServiceAccount` resource and KCC manages `IAMPolicyMember` resources. Document the ownership boundary clearly in team runbooks.

---

### Example 36: Shared GKE Cluster — Namespace Isolation via IAM
**Concept:** In a multi-tenant GKE cluster, each tenant's GCP SA is scoped to its namespace's Kubernetes SA, preventing cross-namespace GCP API access.

```hcl
locals {
  tenants = {
    "team-alpha" = { namespace = "alpha", roles = ["roles/storage.objectViewer"] }
    "team-beta"  = { namespace = "beta",  roles = ["roles/pubsub.subscriber"]    }
  }
}

resource "google_service_account" "tenant_sa" {
  for_each     = local.tenants
  project      = "my-gcp-project"
  account_id   = "${each.key}-sa"
  display_name = "${each.key} Tenant SA"
}

resource "google_service_account_iam_member" "tenant_wi" {
  for_each           = local.tenants
  service_account_id = google_service_account.tenant_sa[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[${each.value.namespace}/${each.key}-ksa]"
}

resource "google_project_iam_member" "tenant_roles" {
  for_each = {
    for pair in flatten([
      for tenant, cfg in local.tenants : [
        for role in cfg.roles : { key = "${tenant}-${role}", tenant = tenant, role = role }
      ]
    ]) : pair.key => pair
  }
  project = "my-gcp-project"
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.tenant_sa[each.value.tenant].email}"
}
```

**Explanation:** This pattern uses nested `for` expressions to flatten the tenant→roles map into a flat set of project IAM member resources, each with a unique key. Each tenant's Workload Identity binding is scoped to their specific namespace, so a pod in `alpha` namespace cannot assume `team-beta`'s GCP SA. Adding a new tenant is as simple as adding an entry to `local.tenants`. Pair this with Kubernetes NetworkPolicy and RBAC to enforce full namespace isolation in a shared GKE cluster.

---

### Example 37: Helm Post-Install Hook to Verify Workload Identity
**Concept:** A Helm hook Job verifies that Workload Identity is correctly configured after chart installation by attempting a GCP API call.

```yaml
# charts/payments/templates/wi-verify-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: wi-verify-{{ .Release.Name }}
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "0"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      serviceAccountName: {{ .Values.serviceAccount.name }}
      restartPolicy: Never
      containers:
        - name: wi-verify
          image: google/cloud-sdk:slim
          command:
            - /bin/sh
            - -c
            - |
              gcloud auth print-identity-token && \
              gcloud storage ls gs://{{ .Values.config.bucketName }} && \
              echo "Workload Identity verified successfully"
```

**Explanation:** This post-install hook runs a Job in the same namespace using the Terraform-provisioned SA to verify that the GCP token issuance and IAM permissions work end-to-end. If the Job fails (e.g., Workload Identity annotation is missing or IAM binding was not applied), Helm marks the release as failed and rolls back, preventing a broken deployment from going live. `hook-delete-policy: hook-succeeded` cleans up the Job on success to avoid cluttering the namespace. This creates a tight feedback loop between Terraform IAM provisioning and Helm deployment success.

---

### Example 38: Terraform Module Outputting Helm Values for Cross-Stack Integration
**Concept:** A Terraform module outputs a structured map that can be directly fed into Helm as values, bridging the infrastructure and deployment stacks.

```hcl
# modules/gke-app-identity/outputs.tf
output "helm_values" {
  description = "Helm values map for the application chart"
  value = {
    serviceAccount = {
      create = false
      name   = kubernetes_service_account.app_ksa.metadata[0].name
    }
    gcp = {
      project       = var.project_id
      saEmail       = google_service_account.sa.email
      region        = "us-central1"
      secretPrefix  = "projects/${var.project_id}/secrets/"
    }
    workloadIdentity = {
      enabled = true
      pool    = "${var.project_id}.svc.id.goog"
    }
  }
}
```

```hcl
# Root module usage
module "orders_identity" {
  source        = "./modules/gke-app-identity"
  project_id    = "my-gcp-project"
  account_id    = "orders-sa"
  k8s_namespace = "orders"
  k8s_sa_name   = "orders-ksa"
  roles         = ["roles/storage.objectViewer"]
}

resource "local_file" "orders_helm_values" {
  filename = "generated/orders-helm-values.yaml"
  content  = yamlencode(module.orders_identity.helm_values)
}
```

**Explanation:** By structuring the module output as a nested map that mirrors the Helm chart's `values.yaml` schema, the integration between Terraform and Helm becomes type-safe and self-documenting. The `local_file` resource serializes the map to YAML, which is then passed to `helm upgrade --install --values generated/orders-helm-values.yaml`. This eliminates the common CI/CD anti-pattern of manually copying Terraform outputs into Helm values files via shell scripts. Changes to infrastructure (new SA, new region) automatically propagate to Helm values on the next `terraform apply`.

---

## ADVANCED (Examples 39–50)

---

### Example 39: VPC Service Controls — Access Policy and Service Perimeter
**Concept:** VPC Service Controls create a security perimeter around GCP services, restricting access to GKE and related APIs even for authenticated identities outside the perimeter.

```hcl
resource "google_access_context_manager_access_policy" "org_policy" {
  parent = "organizations/123456789"
  title  = "GKE Production Access Policy"
}

resource "google_access_context_manager_service_perimeter" "gke_perimeter" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/servicePerimeters/gke-production"
  title  = "GKE Production Perimeter"
  status {
    restricted_services = [
      "container.googleapis.com",
      "storage.googleapis.com",
      "secretmanager.googleapis.com",
    ]
    resources = [
      "projects/123456789",  # numeric project ID for my-gcp-project
    ]
    ingress_policies {
      ingress_from {
        identities = [
          "serviceAccount:gke-app-sa@my-gcp-project.iam.gserviceaccount.com",
        ]
      }
      ingress_to {
        resources = ["*"]
        operations {
          service_name = "container.googleapis.com"
          method_selectors { method = "*" }
        }
      }
    }
  }
}
```

**Explanation:** VPC Service Controls enforce that even a valid GCP SA cannot access `container.googleapis.com` unless the request originates from within the defined perimeter (a specific VPC network or access level). `ingress_policies` explicitly allow the GKE SA to call container APIs from inside the perimeter. Misconfiguring VPC-SC can lock out legitimate GKE operations, so always test in `DRY_RUN` mode first by setting `use_explicit_dry_run_spec = true`. The numeric project ID (not the string name) is required in the `resources` list.

---

### Example 40: VPC Service Controls — Access Level for GKE Node Pool IPs
**Concept:** An Access Level defines trusted IP ranges (GKE node pool CIDRs) that are allowed to cross the service perimeter.

```hcl
resource "google_access_context_manager_access_level" "gke_node_ips" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/accessLevels/gkeNodeIPs"
  title  = "GKE Node Pool IP Ranges"

  basic {
    conditions {
      ip_subnetworks = [
        "10.100.0.0/24",  # GKE node pool subnet in us-central1
        "10.101.0.0/24",  # Secondary node pool subnet
      ]
      required_access_levels = []
    }
  }
}

# Reference the access level in the perimeter
resource "google_access_context_manager_service_perimeter" "gke_perimeter_with_level" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/servicePerimeters/gke-prod-v2"
  title  = "GKE Production Perimeter v2"
  status {
    restricted_services = ["container.googleapis.com", "storage.googleapis.com"]
    resources           = ["projects/123456789"]
    access_levels       = [google_access_context_manager_access_level.gke_node_ips.name]
  }
}
```

**Explanation:** Access Levels bound to IP subnetworks ensure that only requests originating from GKE node pool IPs (where pod traffic egresses) can reach the restricted services. This prevents credential theft attacks where a stolen SA key is used from an external network. The `ip_subnetworks` should match the primary and secondary ranges of the node pool subnets defined in your VPC. Maintain these IP ranges in a Terraform variable that is also used in the VPC subnet configuration to prevent drift.

---

### Example 41: Organization Policy Constraint — Restrict Resource Location
**Concept:** `google_org_policy_policy` enforces organization-wide constraints that apply regardless of project-level IAM grants, such as restricting GKE clusters to approved regions.

```hcl
resource "google_org_policy_policy" "gke_location_restriction" {
  name   = "projects/my-gcp-project/policies/gcp.resourceLocations"
  parent = "projects/my-gcp-project"

  spec {
    rules {
      values {
        allowed_values = [
          "in:us-central1-locations",
          "in:us-east1-locations",
        ]
      }
    }
  }
}
```

**Explanation:** The `gcp.resourceLocations` constraint prevents creating GKE clusters, node pools, or other regional resources outside the specified locations, regardless of whether the calling identity has `container.clusters.create` permission. This is a defense-in-depth control: even if IAM is misconfigured and grants too-broad permissions, resource creation is still location-restricted. Organization policies at the project level inherit from folder and org levels unless explicitly overridden. Use `in:us-central1-locations` (with location group prefix) to include all zones in a region.

---

### Example 42: Organization Policy — Disable Service Account Key Creation
**Concept:** The `iam.disableServiceAccountKeyCreation` org policy prevents anyone from creating static SA keys, enforcing Workload Identity for all GKE workloads.

```hcl
resource "google_org_policy_policy" "disable_sa_key_creation" {
  name   = "projects/my-gcp-project/policies/iam.disableServiceAccountKeyCreation"
  parent = "projects/my-gcp-project"

  spec {
    rules {
      enforce = true
    }
  }
}

resource "google_org_policy_policy" "disable_sa_key_upload" {
  name   = "projects/my-gcp-project/policies/iam.disableServiceAccountKeyUpload"
  parent = "projects/my-gcp-project"

  spec {
    rules {
      enforce = true
    }
  }
}
```

**Explanation:** Enforcing `iam.disableServiceAccountKeyCreation` at the project level ensures that `google_service_account_key` Terraform resources will fail to create, forcing all workloads to authenticate via Workload Identity or Workload Identity Federation. Pairing it with `iam.disableServiceAccountKeyUpload` prevents user-managed keys from being re-uploaded. These policies can be applied at folder or org level for broader enforcement. Legacy workloads that require static keys should be given a dedicated exemption project with compensating controls (SIEM alerting, short key rotation).

---

### Example 43: Domain-Restricted Sharing Org Policy
**Concept:** `iam.allowedPolicyMemberDomains` prevents granting IAM roles to identities outside the approved domains, blocking accidental public access to GKE-related resources.

```hcl
data "google_organization" "org" {
  domain = "example.com"
}

resource "google_org_policy_policy" "domain_restricted_sharing" {
  name   = "organizations/${data.google_organization.org.org_id}/policies/iam.allowedPolicyMemberDomains"
  parent = "organizations/${data.google_organization.org.org_id}"

  spec {
    rules {
      values {
        allowed_values = [
          "C${data.google_organization.org.directory_customer_id}",  # example.com Workspace directory
        ]
      }
    }
  }
}
```

**Explanation:** The `allowedPolicyMemberDomains` constraint uses Cloud Identity/Workspace customer IDs (prefixed with `C`) to identify trusted identity domains. When enforced, any attempt to grant a role to `allUsers`, `allAuthenticatedUsers`, or an email outside the allowed domains will be rejected by the IAM API. This prevents common accidental data exposure incidents where GCS buckets or GKE resources are inadvertently made public. The customer ID can be retrieved from `data.google_organization.org.directory_customer_id` or from the Admin Console.

---

### Example 44: IAM Recommender — Read Recommendations via Terraform Data Source
**Concept:** The IAM recommender API identifies over-privileged roles; Terraform data sources can surface these recommendations for automated remediation workflows.

```hcl
# Read IAM recommender insights for the GKE SA
data "google_recommender_recommendation" "iam_recs" {
  project         = "my-gcp-project"
  location        = "global"
  recommender     = "google.iam.policy.Recommender"
  recommendation_id = "unique-recommendation-id-from-gcloud"
}

# Example: Apply the recommendation by replacing over-privileged role
# (in practice, parse data.google_recommender_recommendation.iam_recs.content)
resource "google_project_iam_member" "reduced_privilege" {
  project = "my-gcp-project"
  role    = "roles/storage.objectViewer"  # Recommended replacement for roles/storage.admin
  member  = "serviceAccount:gke-app-sa@my-gcp-project.iam.gserviceaccount.com"
}
```

```bash
# List IAM recommendations via gcloud (to find recommendation IDs)
gcloud recommender recommendations list \
  --project=my-gcp-project \
  --location=global \
  --recommender=google.iam.policy.Recommender \
  --format="table(name, stateInfo.state, primaryImpact.category)"
```

**Explanation:** The IAM Recommender analyzes 90 days of Cloud Audit Log activity to identify permissions granted but never used, suggesting role downgrades. The `data.google_recommender_recommendation` resource fetches a specific recommendation by ID, which must first be discovered via `gcloud` or the Recommender API. In practice, an automated remediation pipeline reads recommendations, generates Terraform patches, and opens PRs for human review before applying. This closes the loop between IAM drift detection and Terraform state.

---

### Example 45: IAM Audit Logs — Advanced Log Sink for IAM Events
**Concept:** A Cloud Logging sink exports IAM-related audit logs to BigQuery for long-term retention and analysis of GKE identity activity.

```hcl
resource "google_bigquery_dataset" "iam_audit_logs" {
  project     = "my-gcp-project"
  dataset_id  = "iam_audit_logs"
  location    = "US"
  description = "IAM and GKE audit logs for compliance"

  delete_contents_on_destroy = false
}

resource "google_logging_project_sink" "iam_audit_sink" {
  project     = "my-gcp-project"
  name        = "iam-audit-to-bq"
  destination = "bigquery.googleapis.com/projects/my-gcp-project/datasets/${google_bigquery_dataset.iam_audit_logs.dataset_id}"
  filter      = <<-EOT
    protoPayload.serviceName="iam.googleapis.com"
    OR protoPayload.serviceName="container.googleapis.com"
    AND protoPayload.methodName=~"^google.container.v1.ClusterManager"
  EOT
  unique_writer_identity = true
}

resource "google_bigquery_dataset_iam_member" "sink_writer" {
  project    = "my-gcp-project"
  dataset_id = google_bigquery_dataset.iam_audit_logs.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_project_sink.iam_audit_sink.writer_identity
}
```

**Explanation:** `unique_writer_identity = true` creates a dedicated SA for the log sink, and the `google_bigquery_dataset_iam_member` grants it `bigquery.dataEditor` — following least privilege for the sink writer. The log filter captures all IAM API calls and GKE ClusterManager operations, providing a full audit trail for compliance requirements. BigQuery-stored audit logs can be queried with SQL to detect anomalies like unexpected `setIamPolicy` calls or new SA key creations. Retention should align with your compliance framework (e.g., 1 year for SOC 2, 7 years for PCI DSS).

---

### Example 46: Workload Identity Federation — GitHub Actions to GCP
**Concept:** Workload Identity Federation allows GitHub Actions workflows to authenticate to GCP without storing a service account key, using OIDC tokens issued by GitHub.

```hcl
resource "google_iam_workload_identity_pool" "github_pool" {
  project                   = "my-gcp-project"
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Identity Pool"
  description               = "WIF pool for GitHub Actions CI/CD"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  project                            = "my-gcp-project"
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC Provider"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  attribute_condition = "assertion.repository_owner == 'my-github-org'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "github_ci_sa" {
  project      = "my-gcp-project"
  account_id   = "github-ci-sa"
  display_name = "GitHub Actions CI/CD SA"
}

resource "google_service_account_iam_member" "github_wi_binding" {
  service_account_id = google_service_account.github_ci_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/my-github-org/my-gke-repo"
}
```

**Explanation:** The `attribute_condition` restricts token exchange to only repositories owned by `my-github-org`, preventing other GitHub users from impersonating the CI SA. The `principalSet://` member syntax grants the role to all GitHub Actions runs from the specified repository, rather than a single subject. In the GitHub Actions workflow, use the `google-github-actions/auth` action with `workload_identity_provider` and `service_account` inputs — no secrets stored in GitHub. This is the recommended pattern for GKE CI/CD pipelines running Helm deployments and Terraform plans.

---

### Example 47: GitHub Actions Workflow — Using WIF to Deploy to GKE
**Concept:** The GitHub Actions workflow authenticates to GCP using Workload Identity Federation and then runs `helm upgrade` against `my-gke-cluster`.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GKE

on:
  push:
    branches: [main]

permissions:
  id-token: write   # Required for WIF OIDC token request
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP via WIF
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: "projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
          service_account: "github-ci-sa@my-gcp-project.iam.gserviceaccount.com"

      - name: Configure kubectl for GKE
        uses: google-github-actions/get-gke-credentials@v2
        with:
          cluster_name: my-gke-cluster
          location: us-central1
          project_id: my-gcp-project

      - name: Deploy with Helm
        run: |
          helm upgrade --install payments ./charts/payments \
            --namespace payments \
            --values generated/payments-helm-values.yaml \
            --set image.tag=${{ github.sha }}
```

**Explanation:** The `id-token: write` permission is required for the GitHub OIDC provider to issue a token that WIF can verify. `google-github-actions/auth` exchanges the GitHub OIDC token for a short-lived GCP access token with no static credentials anywhere. `google-github-actions/get-gke-credentials` configures `~/.kube/config` using the GCP credentials from the previous step, authorizing `helm` to reach `my-gke-cluster`. The `github-ci-sa` needs at minimum `roles/container.developer` (from Example 6) and Artifact Registry reader access for image pulls.

---

### Example 48: Service Account Impersonation Chain — CI → Deployer → Runtime
**Concept:** A multi-hop impersonation chain separates CI system privileges from deployment privileges from runtime privileges, minimizing each SA's blast radius.

```hcl
# SA 1: CI system SA (minimal permissions)
resource "google_service_account" "ci_sa" {
  project      = "my-gcp-project"
  account_id   = "ci-system-sa"
  display_name = "CI System SA — can only impersonate deployer"
}

# SA 2: Deployer SA (can deploy to GKE)
resource "google_service_account" "deployer_sa" {
  project      = "my-gcp-project"
  account_id   = "helm-deployer-sa-v2"
  display_name = "Helm Deployer SA"
}

# SA 3: Runtime SA (used by running pods)
resource "google_service_account" "runtime_sa" {
  project      = "my-gcp-project"
  account_id   = "app-runtime-sa-v2"
  display_name = "Application Runtime SA"
}

# Chain: CI → Deployer
resource "google_service_account_iam_member" "ci_impersonate_deployer" {
  service_account_id = google_service_account.deployer_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.ci_sa.email}"
}

# Chain: Deployer → Runtime (for setting up K8s SA annotations)
resource "google_service_account_iam_member" "deployer_impersonate_runtime" {
  service_account_id = google_service_account.runtime_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer_sa.email}"
}

# Deployer gets GKE deploy permissions
resource "google_project_iam_member" "deployer_gke" {
  project = "my-gcp-project"
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.deployer_sa.email}"
}

# Runtime gets only what the app needs
resource "google_project_iam_member" "runtime_storage" {
  project = "my-gcp-project"
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.runtime_sa.email}"
}
```

**Explanation:** `roles/iam.serviceAccountTokenCreator` allows generating tokens for the target SA, while `roles/iam.serviceAccountUser` allows attaching the SA to a VM or pod. The CI SA cannot directly interact with GKE or GCS — it can only impersonate the deployer SA, which in turn can only use (not impersonate) the runtime SA. This defense-in-depth design means compromising the CI SA does not directly expose application data. Impersonation chains longer than 2 hops are rarely justified and should be reviewed by the security team.

---

### Example 49: Workload Identity Federation — Azure AD Identity to GCP
**Concept:** WIF can also federate Azure AD workload identities to GCP, enabling hybrid-cloud GKE workloads that run partially on Azure and need GCP access.

```hcl
resource "google_iam_workload_identity_pool" "azure_pool" {
  project                   = "my-gcp-project"
  workload_identity_pool_id = "azure-ad-pool"
  display_name              = "Azure AD WIF Pool"
}

resource "google_iam_workload_identity_pool_provider" "azure_provider" {
  project                            = "my-gcp-project"
  workload_identity_pool_id          = google_iam_workload_identity_pool.azure_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "azure-provider"
  display_name                       = "Azure AD OIDC Provider"

  attribute_mapping = {
    "google.subject"        = "assertion.sub"
    "attribute.tenant_id"   = "assertion.tid"
    "attribute.object_id"   = "assertion.oid"
  }

  attribute_condition = "assertion.tid == 'your-azure-tenant-id'"

  oidc {
    issuer_uri        = "https://sts.windows.net/your-azure-tenant-id/"
    allowed_audiences = ["api://AzureADTokenExchange"]
  }
}

resource "google_service_account" "azure_federated_sa" {
  project      = "my-gcp-project"
  account_id   = "azure-federated-sa"
  display_name = "Azure-Federated GCP SA"
}

resource "google_service_account_iam_member" "azure_wi" {
  service_account_id = google_service_account.azure_federated_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.azure_pool.name}/attribute.tenant_id/your-azure-tenant-id"
}
```

**Explanation:** The `oidc.issuer_uri` for Azure AD is tenant-specific and must include the trailing slash. `allowed_audiences` restricts which Azure AD applications can exchange tokens — the value `api://AzureADTokenExchange` is the standard Azure WIF exchange audience. The `attribute_condition` locks token exchange to a specific Azure tenant, preventing federation from other tenants. This pattern enables GKE workloads deployed via Azure DevOps pipelines to authenticate to GCP services without storing a GCP SA key in Azure Key Vault.

---

### Example 50: Full Terraform Stack — GKE Cluster, Workload Identity, VPC-SC, and Helm Deployment
**Concept:** A complete, end-to-end Terraform configuration provisions the GKE cluster, IAM, Workload Identity, and triggers a Helm deployment, demonstrating all patterns working together.

```hcl
# providers.tf
terraform {
  required_providers {
    google     = { source = "hashicorp/google",     version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes",  version = "~> 2.0" }
    helm       = { source = "hashicorp/helm",        version = "~> 2.0" }
  }
  backend "gcs" {
    bucket = "my-gcp-project-tfstate"
    prefix = "gke/iam"
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

# main.tf — Workload Identity for the app SA
module "app_identity" {
  source        = "./modules/workload-identity"
  project_id    = "my-gcp-project"
  account_id    = "full-stack-app-sa"
  display_name  = "Full Stack App SA"
  k8s_namespace = "production"
  k8s_sa_name   = "full-stack-ksa"
  roles = [
    "roles/storage.objectViewer",
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent",
    "roles/monitoring.metricWriter",
  ]
}

# Disable SA key creation for the project
resource "google_org_policy_policy" "no_sa_keys" {
  name   = "projects/my-gcp-project/policies/iam.disableServiceAccountKeyCreation"
  parent = "projects/my-gcp-project"
  spec { rules { enforce = true } }
}

# Generate Helm values from Terraform state
resource "local_file" "app_helm_values" {
  filename = "${path.module}/generated/full-stack-values.yaml"
  content  = yamlencode(module.app_identity.helm_values)
}

# Deploy via Helm using Terraform helm provider
provider "helm" {
  kubernetes {
    host                   = "https://${data.google_container_cluster.gke.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(data.google_container_cluster.gke.master_auth[0].cluster_ca_certificate)
  }
}

resource "helm_release" "full_stack_app" {
  name       = "full-stack-app"
  chart      = "./charts/full-stack-app"
  namespace  = "production"
  values     = [local_file.app_helm_values.content]

  set {
    name  = "image.tag"
    value = var.app_image_tag
  }

  depends_on = [
    module.app_identity,
    google_org_policy_policy.no_sa_keys,
  ]
}
```

**Explanation:** This end-to-end stack demonstrates how all patterns compose: the workload-identity module provisions the GCP SA, IAM bindings, and Kubernetes SA annotation; the org policy enforces no static keys; `local_file` bridges Terraform outputs to Helm values; and `helm_release` deploys the application only after IAM is fully configured (via `depends_on`). The GCS backend ensures state is shared across CI/CD runs and team members. Using the `helm` Terraform provider is appropriate for tightly coupled infrastructure+application deployments; for independent deploy cadences, prefer the GitHub Actions pattern from Example 47 where Helm runs as a separate pipeline step after `terraform apply` completes.

---
