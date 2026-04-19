# Examples 1.5 — Terraform State (GCP) (50 examples)

---

## Basic

### 1. Local state (default, development only)
```hcl
# No backend block = local state in terraform.tfstate
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}
```

### 2. GCS backend (standard for GCP)
```hcl
terraform {
  backend "gcs" {
    bucket = "my-tfstate-bucket"
    prefix = "terraform/state"
  }
}
```

### 3. Initialize with GCS backend
```bash
terraform init
# or reconfigure if backend changes:
terraform init -reconfigure
```

### 4. terraform show — inspect current state
```bash
terraform show
terraform show -json | jq '.values.root_module.resources[].address'
```

### 5. terraform state list
```bash
terraform state list
# Output:
# google_compute_instance.vm
# google_storage_bucket.app
```

### 6. terraform state show a resource
```bash
terraform state show google_compute_instance.vm
terraform state show 'google_storage_bucket.buckets["logs"]'
```

### 7. terraform refresh
```bash
terraform refresh   # sync state with real infrastructure (deprecated in 0.15+)
terraform apply -refresh-only  # modern equivalent
```

### 8. terraform plan with state
```bash
terraform plan              # compare state vs config vs real infra
terraform plan -out=tfplan  # save plan to file
terraform apply tfplan       # apply saved plan
```

### 9. View raw state file
```bash
cat terraform.tfstate | jq '.resources[].type'
# Never edit terraform.tfstate directly
```

### 10. GCS bucket for state storage
```hcl
resource "google_storage_bucket" "tfstate" {
  name          = "my-org-tfstate"
  location      = "US"
  force_destroy = false

  versioning {
    enabled = true
  }
}
```

### 11. State file locking with GCS
```bash
# GCS backend uses native object locking — no separate lock table needed
# Lock info stored in: gs://bucket/prefix.tflock
```

### 12. terraform output — read outputs from state
```bash
terraform output
terraform output -json
terraform output -raw bucket_name
```

---

## Intermediate

### 13. GCS backend with prefix per environment
```hcl
terraform {
  backend "gcs" {
    bucket = "my-org-tfstate"
    prefix = "prod/networking"
  }
}
```

### 14. Partial backend configuration (init-time injection)
```hcl
# backend.tf
terraform {
  backend "gcs" {}
}
```
```bash
terraform init \
  -backend-config="bucket=my-tfstate-bucket" \
  -backend-config="prefix=prod/app"
```

### 15. Backend config file
```hcl
# backend.hcl
bucket = "my-tfstate-bucket"
prefix = "staging/app"
```
```bash
terraform init -backend-config=backend.hcl
```

### 16. terraform state rm — remove resource from state
```bash
terraform state rm google_compute_instance.old_vm
# Resource removed from state but NOT destroyed in GCP
```

### 17. terraform state mv — rename resource in state
```bash
terraform state mv google_storage_bucket.old_name google_storage_bucket.new_name
terraform state mv 'google_compute_instance.vm[0]' 'google_compute_instance.vm["primary"]'
```

### 18. terraform import — bring existing GCP resource into state
```bash
terraform import google_storage_bucket.existing my-existing-bucket
terraform import google_compute_instance.vm projects/my-project/zones/us-central1-a/instances/my-vm
terraform import google_compute_network.vpc projects/my-project/global/networks/my-vpc
```

### 19. terraform state pull — download state
```bash
terraform state pull > local-backup.tfstate
```

### 20. terraform state push — upload state (use with caution)
```bash
terraform state push local-backup.tfstate
```

### 21. Workspace-per-environment state isolation
```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
terraform workspace select prod
terraform apply
```

### 22. GCS backend with workspace prefix
```hcl
# With workspaces, GCS creates: bucket/prefix/env:workspace/terraform.tfstate
terraform {
  backend "gcs" {
    bucket = "my-tfstate-bucket"
    prefix = "app"
  }
}
```

### 23. terraform_remote_state data source
```hcl
data "terraform_remote_state" "networking" {
  backend = "gcs"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "prod/networking"
  }
}

resource "google_compute_instance" "app" {
  network_interface {
    subnetwork = data.terraform_remote_state.networking.outputs.subnet_id
  }
  # ...
}
```

### 24. Locking state during apply
```bash
# GCS automatically handles locks
# If lock is stuck, force-unlock with caution:
terraform force-unlock LOCK_ID
```

### 25. State encryption with CMEK on GCS
```hcl
resource "google_storage_bucket" "tfstate" {
  name     = "my-encrypted-tfstate"
  location = "US"

  encryption {
    default_kms_key_name = google_kms_crypto_key.tfstate_key.id
  }
}
```

---

## Nested

### 26. Separate state per component (layered architecture)
```
tfstate-bucket/
  prod/
    networking/terraform.tfstate    # VPC, subnets, NAT
    gke/terraform.tfstate           # GKE clusters
    databases/terraform.tfstate     # Cloud SQL
    app/terraform.tfstate           # Cloud Run, services
```

### 27. Cross-stack references via remote_state
```hcl
# In app stack:
data "terraform_remote_state" "gke" {
  backend = "gcs"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "prod/gke"
  }
}

resource "kubernetes_deployment" "app" {
  metadata {
    namespace = data.terraform_remote_state.gke.outputs.namespace
  }
  # ...
}
```

### 28. Using workspace in resource naming
```hcl
locals {
  env = terraform.workspace
}

resource "google_storage_bucket" "app_data" {
  name     = "app-${local.env}-data"
  location = "US"

  labels = {
    environment = local.env
  }
}
```

### 29. Moved block for state refactoring
```hcl
moved {
  from = google_compute_instance.web
  to   = module.compute.google_compute_instance.web
}
```

### 30. Migrating state between backends
```bash
# 1. Update backend config to new GCS location
# 2. Run init to migrate:
terraform init -migrate-state
# Or copy state manually with state push/pull
```

### 31. State manipulation for for_each refactor
```bash
# When converting count to for_each:
terraform state mv 'google_compute_instance.vm[0]' 'google_compute_instance.vm["primary"]'
terraform state mv 'google_compute_instance.vm[1]' 'google_compute_instance.vm["secondary"]'
```

### 32. Multiple remote state references
```hcl
data "terraform_remote_state" "vpc" {
  backend = "gcs"
  config  = { bucket = "my-tfstate", prefix = "prod/vpc" }
}

data "terraform_remote_state" "gke" {
  backend = "gcs"
  config  = { bucket = "my-tfstate", prefix = "prod/gke" }
}

data "terraform_remote_state" "databases" {
  backend = "gcs"
  config  = { bucket = "my-tfstate", prefix = "prod/databases" }
}
```

### 33. State bucket with lifecycle rules
```hcl
resource "google_storage_bucket" "tfstate" {
  name          = "my-org-tfstate"
  location      = "US"
  force_destroy = false

  versioning { enabled = true }

  lifecycle_rule {
    condition { num_newer_versions = 20 }
    action    { type = "Delete" }
  }

  lifecycle_rule {
    condition { age = 365; with_state = "ARCHIVED" }
    action    { type = "Delete" }
  }
}
```

### 34. IAM for state bucket access control
```hcl
resource "google_storage_bucket_iam_member" "terraform_sa" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:terraform@my-project.iam.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "read_only" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectViewer"
  member = "group:devs@example.com"
}
```

---

## Advanced

### 35. Terraform Cloud backend (alternative to GCS)
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

### 36. State file schema version awareness
```bash
# Never downgrade Terraform if state was written by a newer version
# Always check state version:
cat terraform.tfstate | jq '.terraform_version'
```

### 37. Import config generation (Terraform 1.5+)
```bash
# Generate import block from existing resources:
terraform plan -generate-config-out=generated.tf
```
```hcl
import {
  id = "my-existing-bucket"
  to = google_storage_bucket.existing
}
```

### 38. Automated state backup to secondary GCS bucket
```hcl
resource "google_storage_transfer_job" "state_backup" {
  description = "Backup tfstate to secondary region"
  project     = var.project_id

  transfer_spec {
    gcs_data_source {
      bucket_name = google_storage_bucket.tfstate.name
    }
    gcs_data_sink {
      bucket_name = google_storage_bucket.tfstate_backup.name
    }
  }

  schedule {
    schedule_start_date { year = 2024; month = 1; day = 1 }
    start_time_of_day   { hours = 3; minutes = 0; seconds = 0; nanos = 0 }
  }
}
```

### 39. Detecting state drift in CI
```bash
#!/bin/bash
terraform plan -detailed-exitcode
EXIT_CODE=$?
# 0 = no changes, 1 = error, 2 = changes detected
if [ $EXIT_CODE -eq 2 ]; then
  echo "Drift detected!" && exit 1
fi
```

### 40. State-driven cost estimation with Infracost
```bash
terraform show -json > plan.json
infracost breakdown --path plan.json
```

### 41. Partial state import using import blocks
```hcl
import {
  to = google_compute_instance.vm
  id = "projects/my-project/zones/us-central1-a/instances/my-vm"
}

import {
  to = google_storage_bucket.data
  id = "my-existing-data-bucket"
}
```

### 42. State isolation per team with separate GCS prefixes
```hcl
# Team networking
terraform {
  backend "gcs" {
    bucket = "org-tfstate"
    prefix = "teams/networking/prod"
  }
}

# Team platform
terraform {
  backend "gcs" {
    bucket = "org-tfstate"
    prefix = "teams/platform/prod"
  }
}
```

### 43. Cross-organization state sharing
```hcl
data "terraform_remote_state" "shared_services" {
  backend = "gcs"
  config = {
    bucket      = "shared-services-tfstate"
    prefix      = "infrastructure"
    credentials = file("cross-org-sa.json")
  }
}
```

### 44. State output used in Helm chart values
```hcl
data "terraform_remote_state" "gke" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "prod/gke" }
}

resource "helm_release" "app" {
  name  = "my-app"
  chart = "./charts/my-app"

  set {
    name  = "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account"
    value = data.terraform_remote_state.gke.outputs.workload_identity_sa
  }
}
```

### 45. Audit who changed state (GCS audit logs)
```hcl
resource "google_project_iam_audit_config" "tfstate_audit" {
  project = var.project_id
  service = "storage.googleapis.com"

  audit_log_config {
    log_type = "DATA_WRITE"
  }

  audit_log_config {
    log_type = "DATA_READ"
  }
}
```

### 46. Using terraform state for blue-green deployments
```bash
# Blue environment lives in state
terraform workspace select blue
terraform apply

# Switch traffic, then provision green:
terraform workspace select green
terraform apply

# Roll back: switch to blue workspace
terraform workspace select blue
```

### 47. Object-level versioning for state recovery
```bash
# List all versions of state file:
gsutil ls -a gs://my-tfstate-bucket/prod/app/terraform.tfstate

# Restore a specific version:
gsutil cp gs://my-tfstate-bucket/prod/app/terraform.tfstate#VERSION_ID ./recovery.tfstate
terraform state push recovery.tfstate
```

### 48. prevent_destroy guard on state bucket
```hcl
resource "google_storage_bucket" "tfstate" {
  name     = "critical-org-tfstate"
  location = "US"

  lifecycle {
    prevent_destroy = true
  }
}
```

### 49. Terraform state in a monorepo with multiple roots
```
infra/
  networking/     # terraform init/apply here
  gke/            # separate state root
  databases/      # separate state root
  apps/
    api/          # separate state root
    frontend/     # separate state root
```
```bash
# Each directory has its own backend.tf pointing to different GCS prefix
```

### 50. Full production state setup
```hcl
# state-bootstrap/main.tf — create the state bucket first (local state)
resource "google_storage_bucket" "tfstate" {
  name          = "${var.project_id}-tfstate"
  location      = "US"
  force_destroy = false

  versioning { enabled = true }
  uniform_bucket_level_access = true

  lifecycle { prevent_destroy = true }

  lifecycle_rule {
    condition { num_newer_versions = 30 }
    action    { type = "Delete" }
  }
}

resource "google_storage_bucket_iam_member" "tf_sa" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:terraform@${var.project_id}.iam.gserviceaccount.com"
}

# After creation, migrate this bootstrap state manually, then all other stacks use:
# terraform {
#   backend "gcs" {
#     bucket = "${var.project_id}-tfstate"
#     prefix = "stack-name/env"
#   }
# }
```
