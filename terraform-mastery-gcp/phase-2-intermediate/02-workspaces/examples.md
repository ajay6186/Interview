# Examples 2.2 — Workspaces (GCP) (50 examples)

---

## Basic

### 1. List workspaces
```bash
terraform workspace list
# * default
#   dev
#   staging
#   prod
```

### 2. Create a new workspace
```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
```

### 3. Select a workspace
```bash
terraform workspace select prod
terraform workspace show   # show current workspace
```

### 4. Delete a workspace
```bash
terraform workspace select default
terraform workspace delete dev
```

### 5. Show current workspace
```bash
terraform workspace show
# prod
```

### 6. Use workspace name in resource
```hcl
resource "google_storage_bucket" "app" {
  name     = "app-${terraform.workspace}-data"
  location = "US"
}
```

### 7. Workspace-aware project IDs
```hcl
locals {
  project_id = terraform.workspace == "prod" ? "my-prod-project" : "my-dev-project"
}

provider "google" {
  project = local.project_id
  region  = "us-central1"
}
```

### 8. GCS backend state per workspace
```bash
# Workspaces with GCS create:
# bucket/prefix/env:dev/terraform.tfstate
# bucket/prefix/env:prod/terraform.tfstate
# bucket/prefix/terraform.tfstate  (default)
```

### 9. Workspace in labels
```hcl
resource "google_compute_instance" "vm" {
  name         = "app-${terraform.workspace}"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  labels = {
    environment = terraform.workspace
    managed_by  = "terraform"
  }

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }
}
```

### 10. terraform apply to a specific workspace
```bash
terraform workspace select prod
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"
```

### 11. Workspace list in CI pipeline
```bash
WORKSPACE=prod
terraform workspace select $WORKSPACE || terraform workspace new $WORKSPACE
terraform apply -auto-approve
```

### 12. Default workspace for local development
```bash
terraform workspace select default
terraform apply   # fast local iteration, no environment prefix
```

---

## Intermediate

### 13. Map lookup by workspace
```hcl
locals {
  machine_types = {
    dev     = "e2-micro"
    staging = "e2-medium"
    prod    = "e2-standard-4"
  }
  machine_type = local.machine_types[terraform.workspace]
}

resource "google_compute_instance" "app" {
  name         = "app-vm"
  machine_type = local.machine_type
  zone         = "us-central1-a"

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }
}
```

### 14. Workspace-driven resource count
```hcl
locals {
  node_counts = {
    dev     = 1
    staging = 2
    prod    = 5
  }
}

resource "google_container_node_pool" "nodes" {
  name       = "main-pool"
  cluster    = google_container_cluster.gke.name
  location   = "us-central1"
  node_count = local.node_counts[terraform.workspace]

  node_config { machine_type = "e2-standard-4" }
}
```

### 15. Workspace-driven project selection
```hcl
variable "project_ids" {
  type = map(string)
  default = {
    dev     = "dev-project-123"
    staging = "staging-project-456"
    prod    = "prod-project-789"
  }
}

locals {
  project_id = var.project_ids[terraform.workspace]
}
```

### 16. Conditional behavior by workspace
```hcl
locals {
  is_prod = terraform.workspace == "prod"
}

resource "google_storage_bucket" "app" {
  name     = "app-${terraform.workspace}"
  location = "US"

  versioning {
    enabled = local.is_prod
  }

  lifecycle {
    prevent_destroy = local.is_prod
  }
}
```

### 17. Workspace-driven region selection
```hcl
locals {
  regions = {
    dev     = "us-central1"
    staging = "us-central1"
    prod    = "us-central1"
  }
  dr_regions = {
    dev     = null
    staging = null
    prod    = "europe-west1"
  }
}
```

### 18. Workspace-specific tfvars with CI
```bash
# ci/deploy.sh
WORKSPACE=${1:-dev}
terraform workspace select $WORKSPACE
terraform apply -var-file="envs/${WORKSPACE}.tfvars" -auto-approve
```

### 19. Workspace in GCS prefix
```hcl
terraform {
  backend "gcs" {
    bucket = "my-org-tfstate"
    prefix = "gcp-platform"
    # GCS will create: gcp-platform/env:prod/terraform.tfstate
  }
}
```

### 20. Workspace for feature branch isolation
```bash
# Developer creates isolated environment:
terraform workspace new feature-new-api
terraform apply
# Do work, test...
terraform destroy
terraform workspace delete feature-new-api
```

### 21. Output workspace name
```hcl
output "deployment_workspace" {
  value = terraform.workspace
}
```

### 22. Workspace guard in CI
```bash
# Prevent accidental prod applies from non-prod branches:
if [[ "$TF_WORKSPACE" == "prod" && "$CI_BRANCH" != "main" ]]; then
  echo "Cannot apply prod from non-main branch" && exit 1
fi
```

### 23. Workspace-driven deletion protection
```hcl
resource "google_sql_database_instance" "db" {
  name             = "app-db-${terraform.workspace}"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  deletion_protection = terraform.workspace == "prod"
  settings { tier = terraform.workspace == "prod" ? "db-custom-4-15360" : "db-f1-micro" }
}
```

### 24. Workspace-based VPC CIDR allocation
```hcl
locals {
  cidr_blocks = {
    dev     = "10.10.0.0/20"
    staging = "10.20.0.0/20"
    prod    = "10.30.0.0/20"
  }
}

resource "google_compute_subnetwork" "main" {
  name          = "main-subnet"
  ip_cidr_range = local.cidr_blocks[terraform.workspace]
  region        = "us-central1"
  network       = google_compute_network.vpc.id
}
```

### 25. Workspace limitations
```bash
# Workspaces are NOT a substitute for separate accounts/projects
# Limitations:
# - All workspaces share the same provider config
# - Cannot have different providers per workspace
# - No native approval gates between workspaces
# - Prefer separate state roots for strong isolation
```

---

## Nested

### 26. Workspace + module combination
```hcl
locals { env = terraform.workspace }

module "networking" {
  source      = "./modules/networking"
  environment = local.env
  project_id  = var.project_ids[local.env]
  cidr        = var.cidrs[local.env]
}

module "compute" {
  source      = "./modules/compute"
  environment = local.env
  subnet_id   = module.networking.subnet_id
}
```

### 27. Workspace-driven node pool scaling
```hcl
variable "node_pools" {
  type = map(map(object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
  })))
  default = {
    dev = {
      default = { machine_type = "e2-medium"; min_nodes = 1; max_nodes = 2 }
    }
    prod = {
      default = { machine_type = "e2-standard-8"; min_nodes = 3; max_nodes = 20 }
      spot    = { machine_type = "e2-standard-4"; min_nodes = 0; max_nodes = 50 }
    }
  }
}

resource "google_container_node_pool" "pools" {
  for_each = var.node_pools[terraform.workspace]
  name     = each.key
  cluster  = google_container_cluster.gke.name
  location = "us-central1"

  autoscaling {
    min_node_count = each.value.min_nodes
    max_node_count = each.value.max_nodes
  }
  node_config { machine_type = each.value.machine_type }
}
```

### 28. Remote state scoped by workspace
```hcl
data "terraform_remote_state" "networking" {
  backend   = "gcs"
  workspace = terraform.workspace
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "networking"
  }
}
```

### 29. Workspace-aware monitoring thresholds
```hcl
locals {
  alert_thresholds = {
    dev     = { cpu = 0.9;  error_rate = 0.1 }
    staging = { cpu = 0.85; error_rate = 0.05 }
    prod    = { cpu = 0.8;  error_rate = 0.01 }
  }
  thresholds = local.alert_thresholds[terraform.workspace]
}

resource "google_monitoring_alert_policy" "cpu" {
  display_name = "${terraform.workspace}-high-cpu"
  combiner     = "OR"

  conditions {
    display_name = "CPU > ${local.thresholds.cpu * 100}%"
    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/instance/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = local.thresholds.cpu
    }
  }
}
```

### 30. Workspace promotion pipeline
```bash
#!/bin/bash
# Promote from staging to prod
TF_DIR="./infrastructure"

echo "=== Deploying to staging ==="
terraform -chdir=$TF_DIR workspace select staging
terraform -chdir=$TF_DIR apply -var-file=envs/staging.tfvars -auto-approve

echo "=== Running integration tests ==="
pytest tests/integration/

echo "=== Promoting to prod ==="
terraform -chdir=$TF_DIR workspace select prod
terraform -chdir=$TF_DIR plan -var-file=envs/prod.tfvars
# Manual approval before apply in real CI
```

### 31. Workspace for database migration testing
```bash
# Create isolated copy of schema
terraform workspace new db-migration-test
terraform apply -var="db_name=test-migration-db" -auto-approve

# Run migration
flyway migrate -url=jdbc:postgresql://... -locations=filesystem:./migrations

# Verify and clean up
terraform destroy -auto-approve
terraform workspace delete db-migration-test
```

### 32. Workspace metadata in resource naming
```hcl
locals {
  prefix = "${var.project}-${terraform.workspace}"
  labels = {
    environment = terraform.workspace
    project     = var.project
    managed_by  = "terraform"
  }
}

resource "google_compute_network" "vpc" {
  name = "${local.prefix}-vpc"
}

resource "google_storage_bucket" "data" {
  name   = "${local.prefix}-data"
  location = "US"
  labels = local.labels
}
```

### 33. Workspaces in Terraform Cloud with run triggers
```hcl
# Terraform Cloud workspace configuration
# - networking workspace triggers gke workspace on apply
# - gke workspace triggers app workspace on apply
```

### 34. Workspace-specific backend files
```bash
# Use different backend configs per environment:
terraform init -backend-config="backends/prod.hcl"
terraform workspace select prod
terraform apply
```

---

## Advanced

### 35. Workspace anti-pattern: when NOT to use workspaces
```bash
# Avoid workspaces when:
# - Different teams manage different environments
# - Environments have different provider configs (accounts, credentials)
# - Strong blast-radius isolation is required
# - Different Terraform versions per environment

# Use separate state roots + directories instead:
infra/
  envs/
    dev/main.tf     (separate init, plan, apply)
    prod/main.tf
```

### 36. Workspace detection for conditional locals
```hcl
locals {
  is_production  = terraform.workspace == "prod"
  is_development = contains(["dev", "local"], terraform.workspace)
  is_staging     = terraform.workspace == "staging"

  availability_type = local.is_production ? "REGIONAL" : "ZONAL"
  deletion_protect  = local.is_production
  replica_count     = local.is_production ? 2 : 0
}
```

### 37. Cross-workspace dependencies via remote state
```hcl
locals {
  env = terraform.workspace
}

data "terraform_remote_state" "shared" {
  backend   = "gcs"
  workspace = "default"   # shared services always in default
  config = {
    bucket = "org-tfstate"
    prefix = "shared-services"
  }
}

data "terraform_remote_state" "networking" {
  backend   = "gcs"
  workspace = local.env
  config = {
    bucket = "org-tfstate"
    prefix = "networking"
  }
}
```

### 38. Workspace-based cost allocation labels
```hcl
locals {
  cost_labels = {
    cost_center = lookup({
      dev     = "engineering-dev"
      staging = "engineering-qa"
      prod    = "engineering-prod"
    }, terraform.workspace, "unknown")
  }
}
```

### 39. GitHub Actions matrix with workspaces
```yaml
# .github/workflows/terraform.yml
strategy:
  matrix:
    workspace: [dev, staging, prod]
steps:
  - name: Terraform Apply
    run: |
      terraform workspace select ${{ matrix.workspace }}
      terraform apply -var-file=envs/${{ matrix.workspace }}.tfvars -auto-approve
    env:
      TF_WORKSPACE: ${{ matrix.workspace }}
```

### 40. Workspace-scoped IAM for deployment SAs
```hcl
locals {
  env_sa = {
    dev  = "tf-dev@dev-project.iam.gserviceaccount.com"
    prod = "tf-prod@prod-project.iam.gserviceaccount.com"
  }
}

provider "google" {
  project                     = var.project_ids[terraform.workspace]
  impersonate_service_account = local.env_sa[terraform.workspace]
}
```

### 41. Workspace with spot/preemptible VMs for non-prod
```hcl
resource "google_compute_instance" "worker" {
  name         = "worker-${terraform.workspace}"
  machine_type = terraform.workspace == "prod" ? "e2-standard-8" : "e2-medium"
  zone         = "us-central1-a"

  scheduling {
    preemptible        = terraform.workspace != "prod"
    automatic_restart  = terraform.workspace == "prod"
    on_host_maintenance = terraform.workspace == "prod" ? "MIGRATE" : "TERMINATE"
  }

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }
}
```

### 42. Workspace isolation check in apply
```hcl
check "valid_workspace" {
  assert {
    condition     = contains(["dev", "staging", "prod"], terraform.workspace)
    error_message = "Invalid workspace '${terraform.workspace}'. Must be dev, staging, or prod."
  }
}
```

### 43. Workspace-aware Cloud Armor policy strictness
```hcl
resource "google_compute_security_policy" "waf" {
  name = "waf-policy-${terraform.workspace}"

  rule {
    action   = terraform.workspace == "prod" ? "deny(403)" : "allow"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["0.0.0.0/0"] }
    }
    description = terraform.workspace == "prod" ? "Block all in prod WAF" : "Allow all in non-prod"
  }
}
```

### 44. Workspace state size monitoring
```bash
# Check state file size for each workspace:
gsutil ls -l gs://my-tfstate/app/env:prod/terraform.tfstate
gsutil ls -l gs://my-tfstate/app/env:dev/terraform.tfstate
```

### 45. Workspace-driven KMS key selection
```hcl
data "google_kms_crypto_key" "key" {
  name     = "${terraform.workspace}-encryption-key"
  key_ring = data.google_kms_key_ring.ring.id
}

resource "google_storage_bucket" "encrypted" {
  name     = "app-${terraform.workspace}-data"
  location = "US"

  encryption {
    default_kms_key_name = data.google_kms_crypto_key.key.id
  }
}
```

### 46. Workspace environment variable export
```bash
# Export workspace to shell for use in scripts:
export TF_WORKSPACE=$(terraform workspace show)
echo "Deploying to: $TF_WORKSPACE"
gcloud config set project $(terraform output -raw project_id)
```

### 47. Workspace + Sentinel policy for prod protection
```python
# sentinel/enforce-prod-approvals.sentinel
main = rule {
  tfplan.workspace == "prod" implies tfplan.is_apply implies
  tfrun.variables["APPROVAL_TOKEN"] is not undefined
}
```

### 48. Workspace-based maintenance windows
```hcl
locals {
  maintenance_windows = {
    dev     = { day = 1; hour = 0 }   # Any time Monday
    staging = { day = 2; hour = 2 }   # Tuesday 2am
    prod    = { day = 7; hour = 3 }   # Sunday 3am
  }
  mw = local.maintenance_windows[terraform.workspace]
}

resource "google_sql_database_instance" "db" {
  settings {
    tier = "db-f1-micro"
    maintenance_window {
      day          = local.mw.day
      hour         = local.mw.hour
      update_track = terraform.workspace == "prod" ? "stable" : "canary"
    }
  }
}
```

### 49. Workspace-aware replication factor
```hcl
locals {
  replication = {
    dev     = { regional = false; read_replicas = 0 }
    staging = { regional = false; read_replicas = 0 }
    prod    = { regional = true;  read_replicas = 2 }
  }
  rep = local.replication[terraform.workspace]
}

resource "google_sql_database_instance" "db" {
  settings {
    tier              = "db-custom-4-15360"
    availability_type = local.rep.regional ? "REGIONAL" : "ZONAL"
  }
}
```

### 50. Full workspace-driven platform configuration
```hcl
locals {
  env = terraform.workspace

  configs = {
    dev = {
      project_id    = "dev-project-123"
      region        = "us-central1"
      gke_nodes     = { min = 1; max = 3;  type = "e2-medium" }
      db_tier       = "db-f1-micro"
      ha_db         = false
      nat_enabled   = false
      log_retention = 7
    }
    prod = {
      project_id    = "prod-project-789"
      region        = "us-central1"
      gke_nodes     = { min = 3; max = 20; type = "e2-standard-8" }
      db_tier       = "db-custom-8-30720"
      ha_db         = true
      nat_enabled   = true
      log_retention = 30
    }
  }

  cfg = local.configs[local.env]
}

provider "google" {
  project = local.cfg.project_id
  region  = local.cfg.region
}

resource "google_container_cluster" "gke" {
  name     = "${local.env}-cluster"
  location = local.cfg.region
  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = local.env == "prod"
}

resource "google_container_node_pool" "nodes" {
  name     = "main"
  cluster  = google_container_cluster.gke.name
  location = local.cfg.region

  autoscaling {
    min_node_count = local.cfg.gke_nodes.min
    max_node_count = local.cfg.gke_nodes.max
  }
  node_config { machine_type = local.cfg.gke_nodes.type }
}
```
