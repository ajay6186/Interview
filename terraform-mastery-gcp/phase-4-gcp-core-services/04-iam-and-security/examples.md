# Examples 4.4 — IAM & Security (GCP) (50 examples)

---

## Basic

### 1. Create a service account
```hcl
resource "google_service_account" "app_sa" {
  account_id   = "my-app-sa"
  display_name = "Application Service Account"
  description  = "Used by the app to access GCP services"
  project      = var.project_id
}
```

### 2. IAM member (additive binding)
```hcl
resource "google_project_iam_member" "app_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}
```

### 3. IAM binding (authoritative for role)
```hcl
resource "google_project_iam_binding" "admin" {
  project = var.project_id
  role    = "roles/editor"
  members = [
    "user:admin@example.com",
    "serviceAccount:${google_service_account.app_sa.email}",
  ]
}
```

### 4. Grant multiple roles to a service account
```hcl
locals {
  sa_roles = [
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
    "roles/run.invoker",
  ]
}

resource "google_project_iam_member" "sa_roles" {
  for_each = toset(local.sa_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.app_sa.email}"
}
```

### 5. Service account key (avoid if possible — use WI instead)
```hcl
resource "google_service_account_key" "key" {
  service_account_id = google_service_account.app_sa.name
}

output "sa_key_b64" {
  value     = google_service_account_key.key.private_key
  sensitive = true
}
```

### 6. IAM policy (fully authoritative — overwrites all)
```hcl
data "google_iam_policy" "project" {
  binding {
    role    = "roles/editor"
    members = ["user:admin@example.com"]
  }
  binding {
    role    = "roles/viewer"
    members = ["group:devs@example.com"]
  }
}

resource "google_project_iam_policy" "project" {
  project     = var.project_id
  policy_data = data.google_iam_policy.project.policy_data
}
```

### 7. Bucket-level IAM
```hcl
resource "google_storage_bucket_iam_member" "bucket_reader" {
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.app_sa.email}"
}
```

### 8. List predefined roles
```bash
gcloud iam roles list --format="value(name)" | head -20
# Common roles:
# roles/viewer, roles/editor, roles/owner
# roles/compute.admin, roles/container.admin
# roles/storage.admin, roles/cloudsql.admin
```

### 9. Impersonation: who can impersonate a SA
```hcl
resource "google_service_account_iam_member" "impersonation" {
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:ci-deployer@${var.project_id}.iam.gserviceaccount.com"
}
```

### 10. Folder-level IAM
```hcl
resource "google_folder_iam_member" "folder_viewer" {
  folder = "folders/${var.folder_id}"
  role   = "roles/viewer"
  member = "group:readonly-team@example.com"
}
```

### 11. Organization-level IAM
```hcl
resource "google_organization_iam_member" "org_admin" {
  org_id = var.org_id
  role   = "roles/resourcemanager.organizationAdmin"
  member = "user:org-admin@example.com"
}
```

### 12. Viewing IAM policy
```bash
gcloud projects get-iam-policy my-project
gcloud projects get-iam-policy my-project --format=json | jq '.bindings'
```

---

## Intermediate

### 13. Custom IAM role
```hcl
resource "google_project_iam_custom_role" "deployer" {
  role_id     = "customCloudRunDeployer"
  title       = "Cloud Run Deployer"
  description = "Allows deploying Cloud Run services"
  permissions = [
    "run.services.create",
    "run.services.update",
    "run.services.get",
    "run.services.list",
    "run.operations.get",
  ]
}

resource "google_project_iam_member" "ci_deployer" {
  project = var.project_id
  role    = google_project_iam_custom_role.deployer.id
  member  = "serviceAccount:${google_service_account.ci_sa.email}"
}
```

### 14. Organization custom role
```hcl
resource "google_organization_iam_custom_role" "org_auditor" {
  role_id     = "orgAuditor"
  org_id      = var.org_id
  title       = "Organization Auditor"
  description = "Read-only audit access across all projects"
  permissions = [
    "cloudaudit.googleapis.com/activity:read",
    "logging.logEntries.list",
    "monitoring.alertPolicies.list",
  ]
}
```

### 15. Workload Identity Federation for GitHub Actions
```hcl
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"
  description               = "WIF pool for GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC Provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.repository"       = "assertion.repository"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"
}

resource "google_service_account_iam_member" "github_wif" {
  service_account_id = google_service_account.ci_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}
```

### 16. Workload Identity for GKE
```hcl
resource "google_service_account" "ksa_gcp_sa" {
  account_id   = "k8s-app-sa"
  display_name = "Kubernetes App Service Account"
}

resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.ksa_gcp_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.k8s_sa_name}]"
}

resource "google_project_iam_member" "ksa_roles" {
  for_each = toset(["roles/cloudsql.client", "roles/secretmanager.secretAccessor"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.ksa_gcp_sa.email}"
}
```

### 17. Secret Manager secret
```hcl
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}
```

### 18. Secret Manager IAM
```hcl
resource "google_secret_manager_secret_iam_member" "accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app_sa.email}"
}
```

### 19. Cloud KMS key ring and crypto key
```hcl
resource "google_kms_key_ring" "ring" {
  name     = "my-key-ring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "key" {
  name     = "my-encryption-key"
  key_ring = google_kms_key_ring.ring.id

  rotation_period = "7776000s"   # 90 days

  lifecycle {
    prevent_destroy = true
  }
}
```

### 20. KMS IAM for encryption/decryption
```hcl
resource "google_kms_crypto_key_iam_member" "encrypter_decrypter" {
  crypto_key_id = google_kms_crypto_key.key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${google_service_account.app_sa.email}"
}
```

### 21. IAM with conditions (time-based access)
```hcl
resource "google_project_iam_member" "temp_access" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "user:contractor@example.com"

  condition {
    title       = "temporary_access"
    description = "Access expires after project deadline"
    expression  = "request.time < timestamp(\"2026-06-01T00:00:00Z\")"
  }
}
```

### 22. Audit logging configuration
```hcl
resource "google_project_iam_audit_config" "audit" {
  project = var.project_id
  service = "allServices"

  audit_log_config {
    log_type = "ADMIN_READ"
  }
  audit_log_config {
    log_type         = "DATA_READ"
    exempted_members = ["serviceAccount:${google_service_account.analytics_sa.email}"]
  }
  audit_log_config {
    log_type = "DATA_WRITE"
  }
}
```

### 23. Binary Authorization policy
```hcl
resource "google_binary_authorization_policy" "policy" {
  admission_whitelist_patterns {
    name_pattern = "gcr.io/google_containers/*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    require_attestations_by = [google_binary_authorization_attestor.attestor.name]
  }
}
```

### 24. VPC Service Controls — access level
```hcl
resource "google_access_context_manager_access_level" "internal" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/accessLevels/internal"
  title  = "Internal Network"

  basic {
    conditions {
      ip_subnetworks = ["10.0.0.0/8"]
    }
  }
}
```

### 25. Organization policy — restrict VM external IPs
```hcl
resource "google_organization_policy" "restrict_external_ips" {
  org_id     = var.org_id
  constraint = "compute.vmExternalIpAccess"

  list_policy {
    deny {
      all = true
    }
  }
}
```

---

## Nested

### 26. IAM role matrix across multiple SAs and resources
```hcl
variable "role_bindings" {
  type = list(object({
    sa_name  = string
    resource = string
    role     = string
  }))
  default = [
    { sa_name = "app_sa";     resource = "project"; role = "roles/cloudsql.client" },
    { sa_name = "app_sa";     resource = "bucket";  role = "roles/storage.objectViewer" },
    { sa_name = "ingest_sa";  resource = "bucket";  role = "roles/storage.objectCreator" },
  ]
}

resource "google_project_iam_member" "dynamic_project_bindings" {
  for_each = { for b in var.role_bindings : "${b.sa_name}-${b.role}" => b if b.resource == "project" }
  project  = var.project_id
  role     = each.value.role
  member   = "serviceAccount:${google_service_account.sas[each.value.sa_name].email}"
}
```

### 27. Nested Workload Identity pool with multiple providers
```hcl
resource "google_iam_workload_identity_pool" "pool" {
  workload_identity_pool_id = "ci-pool"
}

# GitHub provider
resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
  attribute_mapping = { "google.subject" = "assertion.sub" }
}

# GitLab provider
resource "google_iam_workload_identity_pool_provider" "gitlab" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "gitlab"
  oidc { issuer_uri = "https://gitlab.com" }
  attribute_mapping = { "google.subject" = "assertion.sub" }
}
```

### 28. KMS key per environment
```hcl
locals {
  kms_keys = {
    storage = "Storage encryption key"
    compute = "Disk encryption key"
    db      = "Database encryption key"
  }
}

resource "google_kms_key_ring" "ring" {
  name     = "${var.env}-key-ring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "keys" {
  for_each = local.kms_keys

  name            = "${var.env}-${each.key}-key"
  key_ring        = google_kms_key_ring.ring.id
  rotation_period = "7776000s"
  description     = each.value

  lifecycle { prevent_destroy = var.env == "prod" }
}
```

### 29. Secret rotation with multiple versions
```hcl
resource "google_secret_manager_secret" "api_key" {
  secret_id = "api-key"
  replication { auto {} }

  rotation {
    next_rotation_time  = "2026-01-01T00:00:00Z"
    rotation_period     = "7776000s"   # 90 days
  }
}

# Current active version
resource "google_secret_manager_secret_version" "v1" {
  secret      = google_secret_manager_secret.api_key.id
  secret_data = var.api_key_v1
}
```

### 30. Service account for each service in microservices
```hcl
variable "services" {
  type = map(object({ roles = list(string) }))
  default = {
    api     = { roles = ["roles/cloudsql.client", "roles/secretmanager.secretAccessor"] }
    worker  = { roles = ["roles/pubsub.subscriber", "roles/storage.objectCreator"] }
    frontend = { roles = ["roles/run.invoker"] }
  }
}

resource "google_service_account" "service_sas" {
  for_each     = var.services
  account_id   = "${var.env}-${each.key}-sa"
  display_name = "${each.key} Service Account (${var.env})"
}

locals {
  sa_role_pairs = flatten([
    for svc_name, svc in var.services : [
      for role in svc.roles : {
        key      = "${svc_name}-${replace(role, "/", "-")}"
        svc_name = svc_name
        role     = role
      }
    ]
  ])
}

resource "google_project_iam_member" "sa_roles" {
  for_each = { for p in local.sa_role_pairs : p.key => p }
  project  = var.project_id
  role     = each.value.role
  member   = "serviceAccount:${google_service_account.service_sas[each.value.svc_name].email}"
}
```

### 31. IAM with resource-level conditions
```hcl
resource "google_storage_bucket_iam_member" "path_restricted" {
  bucket = google_storage_bucket.shared.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.restricted_sa.email}"

  condition {
    title      = "restrict_to_prefix"
    expression = "resource.name.startsWith(\"projects/_/buckets/${google_storage_bucket.shared.name}/objects/${var.team_prefix}/\")"
  }
}
```

### 32. Cloud Armor + IAP for defense in depth
```hcl
resource "google_compute_security_policy" "waf" {
  name = "app-waf-${var.env}"

  dynamic "rule" {
    for_each = var.blocked_countries
    content {
      priority = 1000 + rule.key
      action   = "deny(403)"
      match {
        expr { expression = "origin.region_code == '${rule.value}'" }
      }
    }
  }

  rule {
    priority = 2147483647
    action   = "allow"
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
  }
}
```

### 33. Org policy + project policy combination
```hcl
# Org-level: restrict service account key creation
resource "google_organization_policy" "no_sa_keys" {
  org_id     = var.org_id
  constraint = "iam.disableServiceAccountKeyCreation"
  boolean_policy { enforced = true }
}

# Project-level exception for CI/CD project
resource "google_project_organization_policy" "ci_sa_key_exception" {
  project    = "ci-cd-project"
  constraint = "iam.disableServiceAccountKeyCreation"
  boolean_policy { enforced = false }   # Override for this project
}
```

### 34. Privileged access management via IAM conditions
```hcl
resource "google_project_iam_member" "break_glass" {
  project = var.project_id
  role    = "roles/owner"
  member  = "user:on-call@example.com"

  condition {
    title      = "break_glass_window"
    expression = "request.time >= timestamp(\"${var.incident_start}\") && request.time <= timestamp(\"${var.incident_end}\")"
  }
}
```

---

## Advanced

### 35. Zero-trust architecture with all controls
```hcl
# 1. Workload Identity (no service account keys)
# 2. VPC Service Controls (restrict data exfiltration)
# 3. Binary Authorization (only signed images)
# 4. Cloud Armor (block malicious traffic)
# 5. IAP (identity-aware proxy for all internal access)
# 6. Audit logging (all data access logged)
# 7. CMEK encryption (customer-managed keys everywhere)
```

### 36. Service account impersonation chain
```hcl
# CI/CD SA impersonates deployment SA which impersonates resource SA
resource "google_service_account_iam_member" "ci_impersonates_deploy" {
  service_account_id = google_service_account.deploy_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.ci_sa.email}"
}

resource "google_service_account_iam_member" "deploy_impersonates_app" {
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deploy_sa.email}"
}
```

### 37. Data Access Transparency
```hcl
resource "google_project_iam_audit_config" "data_access" {
  project = var.project_id
  service = "storage.googleapis.com"

  audit_log_config {
    log_type = "DATA_READ"
  }
  audit_log_config {
    log_type = "DATA_WRITE"
  }
}
```

### 38. Cloud Identity-Aware Proxy for internal apps
```hcl
resource "google_project_service" "iap" {
  service = "iap.googleapis.com"
}

resource "google_iap_web_backend_service_iam_member" "iap_access" {
  web_backend_service = google_compute_backend_service.app.name
  role                = "roles/iap.httpsResourceAccessor"
  member              = "group:employees@example.com"
}
```

### 39. Certificate Authority Service
```hcl
resource "google_privateca_ca_pool" "pool" {
  name     = "my-ca-pool"
  location = "us-central1"
  tier     = "DEVOPS"

  publishing_options {
    publish_ca_cert = true
    publish_crl     = true
  }
}

resource "google_privateca_certificate_authority" "ca" {
  pool                     = google_privateca_ca_pool.pool.name
  certificate_authority_id = "my-ca"
  location                 = "us-central1"
  deletion_protection      = var.env == "prod"

  config {
    subject_config {
      subject {
        organization = "Example Corp"
        common_name  = "Example Root CA"
      }
    }
    x509_config {
      ca_options { is_ca = true }
      key_usage {
        base_key_usage {
          cert_sign = true
          crl_sign  = true
        }
        extended_key_usage {}
      }
    }
  }

  key_spec {
    algorithm = "RSA_PKCS1_4096_SHA256"
  }
}
```

### 40. Security posture with Security Command Center
```hcl
resource "google_project_service" "scc" {
  service = "securitycenter.googleapis.com"
}

resource "google_scc_notification_config" "critical_findings" {
  config_id    = "critical-findings"
  organization = var.org_id
  description  = "Notify on critical SCC findings"
  pubsub_topic = google_pubsub_topic.scc_alerts.id

  streaming_config {
    filter = "state = \"ACTIVE\" AND severity = \"CRITICAL\""
  }
}
```

### 41. IAP TCP Tunneling
```hcl
resource "google_compute_firewall" "allow_iap_rdp" {
  name          = "allow-iap-rdp"
  network       = google_compute_network.vpc.name
  source_ranges = ["35.235.240.0/20"]

  allow {
    protocol = "tcp"
    ports    = ["3389"]   # RDP via IAP tunnel
  }
}
```

### 42. Automated secret rotation with Cloud Functions
```hcl
resource "google_cloudfunctions2_function" "rotate_secret" {
  name     = "rotate-db-password"
  location = "us-central1"

  build_config {
    runtime     = "python311"
    entry_point = "rotate_secret"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.rotate_fn.name
      }
    }
  }

  event_trigger {
    event_type            = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic          = google_pubsub_topic.secret_rotation.id
    retry_policy          = "RETRY_POLICY_DO_NOT_RETRY"
  }
}
```

### 43. VPC Service Controls with access levels
```hcl
resource "google_access_context_manager_service_perimeter" "data_perimeter" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/data-perimeter"
  title  = "Data Protection Perimeter"

  status {
    resources            = ["projects/${data.google_project.current.number}"]
    restricted_services  = ["storage.googleapis.com", "bigquery.googleapis.com"]
    access_levels        = [google_access_context_manager_access_level.internal.name]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services   = ["RESTRICTED-SERVICES"]
    }

    ingress_policies {
      ingress_from {
        identity_type = "SERVICE_ACCOUNT"
        identities    = ["serviceAccount:${google_service_account.app_sa.email}"]
      }
      ingress_to {
        resources  = ["*"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors { method = "*" }
        }
      }
    }
  }
}
```

### 44. Data loss prevention (DLP) for secret scanning
```hcl
resource "google_project_service" "dlp" {
  service = "dlp.googleapis.com"
}

resource "google_data_loss_prevention_inspect_template" "pii_template" {
  parent       = "projects/${var.project_id}"
  description  = "PII detection template"

  inspect_config {
    info_types { name = "EMAIL_ADDRESS" }
    info_types { name = "PHONE_NUMBER" }
    info_types { name = "CREDIT_CARD_NUMBER" }
    info_types { name = "SOCIAL_SECURITY_NUMBER" }

    min_likelihood = "LIKELY"
  }
}
```

### 45. Org policy: require OS login
```hcl
resource "google_organization_policy" "require_os_login" {
  org_id     = var.org_id
  constraint = "compute.requireOsLogin"
  boolean_policy { enforced = true }
}
```

### 46. Deny policy (IAM Deny)
```hcl
resource "google_iam_deny_policy" "deny_dangerous_actions" {
  parent   = "projects/${var.project_id}"
  name     = "deny-dangerous-actions"
  display_name = "Deny dangerous IAM actions"

  rules {
    description = "Deny billing admin removal"

    deny_rule {
      denied_principals    = ["principalSet://iam.googleapis.com/projects/-/serviceAccounts/*"]
      denied_permissions   = ["resourcemanager.projects.delete", "billing.accounts.close"]
    }
  }
}
```

### 47. Federated identity with AWS
```hcl
resource "google_iam_workload_identity_pool_provider" "aws" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "aws-provider"
  display_name                       = "AWS Provider"

  aws {
    account_id = var.aws_account_id
  }

  attribute_mapping = {
    "google.subject"     = "assertion.arn"
    "attribute.aws_role" = "assertion.arn.split('/')[2]"
  }

  attribute_condition = "attribute.aws_role == '${var.aws_role_name}'"
}
```

### 48. Privileged Access Management (PAM) — just-in-time
```hcl
resource "google_privileged_access_manager_entitlement" "jit_access" {
  provider              = google-beta
  entitlement_id        = "jit-storage-admin"
  location              = "global"
  parent                = "projects/${var.project_id}"
  max_request_duration  = "28800s"   # 8 hours max

  eligible_users {
    principals = ["group:ops@example.com"]
  }

  privileged_access {
    gcp_iam_access {
      resource      = "//cloudresourcemanager.googleapis.com/projects/${var.project_id}"
      resource_type = "cloudresourcemanager.googleapis.com/Project"
      role_bindings {
        role = "roles/storage.admin"
      }
    }
  }

  approval_workflow {
    manual_approvals {
      require_approver_justification = true
      steps {
        approvals_needed = 1
        approvers {
          principals = ["group:managers@example.com"]
        }
      }
    }
  }
}
```

### 49. Secret Manager with automatic replication per region
```hcl
resource "google_secret_manager_secret" "regional_secret" {
  secret_id = "regional-db-password"

  replication {
    user_managed {
      replicas {
        location = "us-central1"
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.keys["us-central1"].id
        }
      }
      replicas {
        location = "europe-west1"
        customer_managed_encryption {
          kms_key_name = google_kms_crypto_key.keys["europe-west1"].id
        }
      }
    }
  }
}
```

### 50. Full IAM and security baseline
```hcl
# Service accounts per service
resource "google_service_account" "sas" {
  for_each     = var.services
  account_id   = "${var.env}-${each.key}-sa"
  display_name = "${title(each.key)} SA (${var.env})"
}

# Role bindings from variable
resource "google_project_iam_member" "all_roles" {
  for_each = { for pair in local.sa_role_pairs : pair.key => pair }
  project  = var.project_id
  role     = each.value.role
  member   = "serviceAccount:${google_service_account.sas[each.value.svc_name].email}"
}

# KMS for encryption
resource "google_kms_key_ring" "main" {
  name     = "${var.env}-keyring"
  location = var.region
}

resource "google_kms_crypto_key" "main" {
  name            = "${var.env}-main-key"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s"
  lifecycle { prevent_destroy = true }
}

# Audit logging
resource "google_project_iam_audit_config" "all" {
  project = var.project_id
  service = "allServices"
  audit_log_config { log_type = "ADMIN_READ" }
  audit_log_config { log_type = "DATA_READ" }
  audit_log_config { log_type = "DATA_WRITE" }
}

# Workload Identity for GKE
resource "google_service_account_iam_member" "wi" {
  for_each           = var.services
  service_account_id = google_service_account.sas[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${each.key}]"
}
```
