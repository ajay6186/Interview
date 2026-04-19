# Examples 2.4 — Remote Backends (GCP) (50 examples)

---

## Basic

### 1. GCS backend — simplest form
```hcl
terraform {
  backend "gcs" {
    bucket = "my-tfstate-bucket"
    prefix = "terraform/state"
  }
}
```

### 2. Create the state bucket first (bootstrapping)
```hcl
resource "google_storage_bucket" "tfstate" {
  name          = "my-org-tfstate"
  location      = "US"
  force_destroy = false

  versioning { enabled = true }
  uniform_bucket_level_access = true
}
```

### 3. Initialize with GCS backend
```bash
terraform init
# If switching from local:
terraform init -migrate-state
```

### 4. GCS backend with impersonation
```hcl
terraform {
  backend "gcs" {
    bucket                      = "my-tfstate-bucket"
    prefix                      = "prod/app"
    impersonate_service_account = "terraform@my-project.iam.gserviceaccount.com"
  }
}
```

### 5. Terraform Cloud backend (alternative)
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "gcp-production"
    }
  }
}
```

### 6. Backend with credentials file (service account)
```hcl
terraform {
  backend "gcs" {
    bucket      = "my-tfstate-bucket"
    prefix      = "app/prod"
    credentials = "service-account.json"
  }
}
```

### 7. Partial backend configuration
```hcl
# backend.tf
terraform {
  backend "gcs" {}
}
```
```bash
terraform init \
  -backend-config="bucket=my-tfstate-bucket" \
  -backend-config="prefix=prod/networking"
```

### 8. Backend config file
```hcl
# prod.backend.hcl
bucket = "my-tfstate-bucket"
prefix = "prod/app"
```
```bash
terraform init -backend-config=prod.backend.hcl
```

### 9. terraform_remote_state data source
```hcl
data "terraform_remote_state" "networking" {
  backend = "gcs"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "prod/networking"
  }
}

locals {
  vpc_id    = data.terraform_remote_state.networking.outputs.vpc_id
  subnet_id = data.terraform_remote_state.networking.outputs.subnet_id
}
```

### 10. Terraform Cloud remote run
```bash
# Set TFC token:
terraform login
# All plans/applies run in TFC workspace:
terraform plan
terraform apply
```

### 11. Show remote state outputs
```bash
terraform output -state=$(terraform state pull | jq -r '.serial')
# Or:
terraform output -json
```

### 12. Backend locking in GCS
```bash
# GCS uses native object locking (no DynamoDB equivalent needed)
# Lock file: gs://bucket/prefix.tflock
# Force unlock if stuck:
terraform force-unlock LOCK_ID
```

---

## Intermediate

### 13. GCS backend with customer-managed encryption
```hcl
terraform {
  backend "gcs" {
    bucket              = "encrypted-tfstate-bucket"
    prefix              = "prod/app"
    encryption_key      = "projects/my-project/locations/us-central1/keyRings/my-ring/cryptoKeys/tfstate-key"
  }
}
```

### 14. Multiple backends per environment (directory-per-env)
```
infra/
  prod/
    backend.tf    → gcs prefix = "prod/app"
    main.tf
  staging/
    backend.tf    → gcs prefix = "staging/app"
    main.tf
  dev/
    backend.tf    → gcs prefix = "dev/app"
    main.tf
```

### 15. Cross-project remote state
```hcl
data "terraform_remote_state" "shared" {
  backend = "gcs"
  config = {
    bucket      = "shared-services-tfstate"
    prefix      = "shared/infrastructure"
    credentials = file("cross-project-sa.json")
  }
}
```

### 16. Remote state with workspace
```hcl
data "terraform_remote_state" "gke" {
  backend   = "gcs"
  workspace = "prod"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "gke"
  }
}
```

### 17. Terraform Cloud workspace tags
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      tags = ["gcp", "production"]
    }
  }
}
```

### 18. Remote state for cross-stack IAM
```hcl
data "terraform_remote_state" "iam" {
  backend = "gcs"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "prod/iam"
  }
}

resource "google_project_iam_member" "app_sa" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${data.terraform_remote_state.iam.outputs.app_sa_email}"
}
```

### 19. HTTP backend (alternative for custom state servers)
```hcl
terraform {
  backend "http" {
    address        = "https://my-state-server.example.com/state/prod-app"
    lock_address   = "https://my-state-server.example.com/lock/prod-app"
    unlock_address = "https://my-state-server.example.com/lock/prod-app"
    username       = "terraform"
    password       = var.state_server_password
  }
}
```

### 20. Backend reconfiguration
```bash
# Change state prefix:
# 1. Update backend.tf
# 2. Run:
terraform init -reconfigure
# WARNING: -reconfigure does NOT migrate state. Use -migrate-state for that.
```

### 21. State migration between GCS prefixes
```bash
terraform state pull > backup.tfstate
# Update backend.tf to new prefix
terraform init -migrate-state
```

### 22. S3 backend for AWS comparison (non-GCP)
```hcl
# Note: Use GCS for GCP; S3 for AWS
terraform {
  backend "s3" {
    bucket         = "my-tfstate"
    key            = "prod/app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}
```

### 23. Remote state outputs documentation pattern
```hcl
# networking/outputs.tf — expose only what consumers need
output "vpc_id"              { value = google_compute_network.vpc.id }
output "subnet_id"           { value = google_compute_subnetwork.main.id }
output "pods_range_name"     { value = google_compute_subnetwork.gke.secondary_ip_range[0].range_name }
output "services_range_name" { value = google_compute_subnetwork.gke.secondary_ip_range[1].range_name }
output "connector_id"        { value = google_vpc_access_connector.connector.id }
```

### 24. State bucket access via Workload Identity
```hcl
resource "google_storage_bucket_iam_member" "wif_access" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_actions_sa.email}"
}
```

### 25. Pull state and inspect version
```bash
terraform state pull | jq '{version: .version, serial: .serial, terraform_version: .terraform_version}'
```

---

## Nested

### 26. Full layered remote state architecture
```
tfstate-bucket/
  prod/
    bootstrap/        # project, billing, APIs
    networking/       # VPC, subnets, NAT, DNS
    security/         # KMS, IAM, policies
    gke/              # cluster, node pools
    databases/        # Cloud SQL, Redis
    monitoring/       # alerts, dashboards
    apps/
      api/            # Cloud Run API service
      frontend/       # Cloud Run frontend
```

### 27. Cross-environment dependency graph
```hcl
# apps/api/main.tf
data "terraform_remote_state" "networking" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "${var.env}/networking" }
}

data "terraform_remote_state" "databases" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "${var.env}/databases" }
}

data "terraform_remote_state" "gke" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "${var.env}/gke" }
}

resource "google_cloud_run_v2_service" "api" {
  name     = "api"
  location = var.region

  template {
    containers {
      image = var.image

      env {
        name  = "DATABASE_URL"
        value = data.terraform_remote_state.databases.outputs.connection_string
      }
    }

    vpc_access {
      connector = data.terraform_remote_state.networking.outputs.connector_id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }
}
```

### 28. Remote state with sensitive outputs
```hcl
# In producer stack:
output "db_password" {
  value     = random_password.db.result
  sensitive = true
}

# In consumer stack:
data "terraform_remote_state" "databases" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "prod/databases" }
}

resource "google_cloud_run_v2_service" "app" {
  template {
    containers {
      env {
        name  = "DB_PASSWORD"
        value = data.terraform_remote_state.databases.outputs.db_password
      }
    }
  }
}
```

### 29. Backend config via CI environment variables
```bash
# In GitHub Actions:
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="prefix=$TF_STATE_PREFIX" \
  -backend-config="impersonate_service_account=$TF_SA"
```

### 30. Multi-project remote state federation
```hcl
data "terraform_remote_state" "shared_vpc" {
  backend = "gcs"
  config = {
    bucket      = "shared-services-tfstate"
    prefix      = "shared/networking"
    credentials = jsonencode({
      type                    = "impersonated_service_account"
      service_account_impersonation_url = "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/tf@shared.iam.gserviceaccount.com:generateAccessToken"
    })
  }
}
```

### 31. Remote state for Kubernetes provider
```hcl
data "terraform_remote_state" "gke" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "prod/gke" }
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${data.terraform_remote_state.gke.outputs.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.terraform_remote_state.gke.outputs.ca_cert)
}
```

### 32. Backend with state encryption verification
```bash
# Verify state object is encrypted in GCS:
gsutil stat gs://my-tfstate-bucket/prod/app/terraform.tfstate | grep -i encrypt
```

### 33. Remote state with version pinning
```hcl
# Ensure consumer and producer use compatible Terraform versions
terraform {
  required_version = "~> 1.6.0"

  backend "gcs" {
    bucket = "my-tfstate"
    prefix = "prod/app"
  }
}
```

### 34. Automated remote state cleanup script
```bash
#!/bin/bash
# List all state prefixes:
gsutil ls gs://my-tfstate-bucket/

# Delete old feature branch states:
gsutil -m rm -r gs://my-tfstate-bucket/feature-*/
```

---

## Advanced

### 35. State backend for Organization-level Terraform
```hcl
# org-bootstrap/backend.tf
terraform {
  backend "gcs" {
    bucket = "org-mgmt-tfstate"
    prefix = "org/bootstrap"
    impersonate_service_account = "org-terraform@org-admin.iam.gserviceaccount.com"
  }
}
```

### 36. Cross-account remote state via service account impersonation
```hcl
terraform {
  backend "gcs" {
    bucket                      = "central-tfstate-bucket"
    prefix                      = "prod/workload"
    impersonate_service_account = "tf-backend@central-project.iam.gserviceaccount.com"
  }
}
```

### 37. Terragrunt remote state management
```hcl
# terragrunt.hcl (root)
remote_state {
  backend = "gcs"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }
  config = {
    bucket = "my-org-tfstate"
    prefix = "${path_relative_to_include()}/terraform.tfstate"
    project = "my-project"
    location = "US"
  }
}
```

### 38. State backend with object retention policy
```hcl
resource "google_storage_bucket" "tfstate" {
  name     = "org-tfstate"
  location = "US"

  versioning { enabled = true }

  retention_policy {
    retention_period = 2592000   # 30 days minimum retention
    is_locked        = false
  }
}
```

### 39. Multi-region state replication
```hcl
resource "google_storage_bucket" "tfstate" {
  name          = "org-tfstate"
  location      = "US"   # Multi-region (US = us-central1 + us-east1 + ...)
  storage_class = "MULTI_REGIONAL"
}
```

### 40. State bucket audit logging
```hcl
resource "google_storage_bucket_access_control" "public_rule" {}

resource "google_project_iam_audit_config" "tfstate_audit" {
  project = var.project_id
  service = "storage.googleapis.com"

  audit_log_config { log_type = "DATA_WRITE" }
  audit_log_config { log_type = "DATA_READ" }
  audit_log_config { log_type = "ADMIN_READ" }
}
```

### 41. Monitoring state bucket for unauthorized access
```hcl
resource "google_monitoring_alert_policy" "state_access" {
  display_name = "TFState Unauthorized Access"
  combiner     = "OR"

  conditions {
    display_name = "Non-SA access to state bucket"
    condition_matched_log {
      filter = <<-EOT
        resource.type="gcs_bucket"
        resource.labels.bucket_name="${google_storage_bucket.tfstate.name}"
        protoPayload.authenticationInfo.principalEmail!~"@.*gserviceaccount.com"
      EOT
    }
  }
}
```

### 42. Import existing remote state
```bash
# State already exists in GCS from manual Terraform run
# Just init with matching backend config:
terraform init
# Terraform will use existing state automatically
```

### 43. State locking race condition handling
```bash
# If CI jobs run in parallel:
# - GCS native locking prevents corruption
# - Wait and retry strategy in CI:
until terraform apply -auto-approve; do
  echo "Apply failed (possibly locked), retrying in 30s..."
  sleep 30
done
```

### 44. Terraform Cloud Agents for private GCP access
```hcl
# Terraform Cloud agent runs inside GCP (GKE/VM)
# Accesses private GCS state and private GCP APIs
terraform {
  cloud {
    organization = "my-org"
    workspaces { name = "gcp-private-prod" }
  }
}
```

### 45. Drift detection via scheduled plan
```bash
#!/bin/bash
# Run nightly drift detection:
terraform init -backend-config=prod.backend.hcl
terraform plan -detailed-exitcode
if [ $? -eq 2 ]; then
  # Send alert (Slack, PagerDuty, etc.)
  curl -X POST "$SLACK_WEBHOOK" -d '{"text":"Drift detected in prod!"}'
fi
```

### 46. State cleanup: remove orphaned workspaces
```bash
for ws in $(terraform workspace list | grep "feature-"); do
  terraform workspace select $ws
  terraform state list | wc -l
  # If 0 resources, safe to delete:
  terraform workspace select default
  terraform workspace delete $ws
done
```

### 47. Backend switching (GCS → Terraform Cloud)
```bash
# 1. Pull current state:
terraform state pull > local.tfstate

# 2. Update backend.tf to Terraform Cloud:
# cloud { organization = "..." workspaces { name = "..." } }

# 3. Init and push state:
terraform init
terraform state push local.tfstate
```

### 48. Remote state for Helm values
```hcl
data "terraform_remote_state" "platform" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "prod/platform" }
}

resource "helm_release" "prometheus" {
  name      = "prometheus"
  chart     = "prometheus-community/kube-prometheus-stack"
  namespace = "monitoring"

  values = [yamlencode({
    grafana = {
      serviceAccount = {
        annotations = {
          "iam.gke.io/gcp-service-account" = data.terraform_remote_state.platform.outputs.monitoring_sa_email
        }
      }
    }
  })]
}
```

### 49. Remote state output version compatibility
```hcl
# Always use output names that are stable across refactors
# Never rename outputs that are consumed by other stacks
# Use deprecation warnings before removing:
output "vpc_id" {
  value       = google_compute_network.vpc.id
  description = "DEPRECATED: use network_id instead"
}
output "network_id" {
  value = google_compute_network.vpc.id
}
```

### 50. Full production GCS backend setup
```hcl
# 1. Bootstrap bucket (applied with local state first)
resource "google_storage_bucket" "tfstate" {
  project       = var.project_id
  name          = "${var.project_id}-tfstate"
  location      = "US"
  force_destroy = false
  uniform_bucket_level_access = true

  versioning { enabled = true }

  lifecycle_rule {
    condition { num_newer_versions = 20; with_state = "ARCHIVED" }
    action    { type = "Delete" }
  }

  lifecycle { prevent_destroy = true }
}

resource "google_storage_bucket_iam_binding" "tf_sa_admin" {
  bucket  = google_storage_bucket.tfstate.name
  role    = "roles/storage.objectAdmin"
  members = ["serviceAccount:terraform@${var.project_id}.iam.gserviceaccount.com"]
}

resource "google_storage_bucket_iam_binding" "devs_readonly" {
  bucket  = google_storage_bucket.tfstate.name
  role    = "roles/storage.objectViewer"
  members = ["group:devs@example.com"]
}

# 2. After bucket exists, all stacks use:
# terraform {
#   backend "gcs" {
#     bucket                      = "${project_id}-tfstate"
#     prefix                      = "<stack>/<env>"
#     impersonate_service_account = "terraform@${project_id}.iam.gserviceaccount.com"
#   }
# }
```
