# Examples 2.1 — Modules (GCP) (50 examples)

---

## Basic

### 1. Calling a local module
```hcl
module "networking" {
  source = "./modules/networking"
}
```

### 2. Module with input variables
```hcl
module "compute" {
  source       = "./modules/compute"
  project_id   = var.project_id
  region       = var.region
  machine_type = "e2-standard-4"
}
```

### 3. Module with outputs
```hcl
# modules/networking/outputs.tf
output "network_id" {
  value = google_compute_network.vpc.id
}

output "subnet_id" {
  value = google_compute_subnetwork.main.id
}
```

### 4. Using module outputs
```hcl
module "networking" {
  source = "./modules/networking"
}

resource "google_compute_instance" "vm" {
  name         = "app-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  network_interface {
    subnetwork = module.networking.subnet_id
  }
  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
}
```

### 5. Public Terraform Registry module
```hcl
module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 29.0"

  project_id = var.project_id
  name       = "my-cluster"
  region     = "us-central1"
  network    = "default"
  subnetwork = "default"
}
```

### 6. Module directory structure
```
modules/
  networking/
    main.tf
    variables.tf
    outputs.tf
  compute/
    main.tf
    variables.tf
    outputs.tf
  gke/
    main.tf
    variables.tf
    outputs.tf
```

### 7. terraform get — download modules
```bash
terraform get         # download/update modules
terraform get -update # force update
```

### 8. Module version pinning (registry)
```hcl
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "= 9.0.0"   # exact pin
}
```

### 9. Module with required variable (no default)
```hcl
# modules/bucket/variables.tf
variable "bucket_name" {
  type        = string
  description = "Name of the GCS bucket (required)"
}
```

### 10. Module with optional variable
```hcl
variable "location" {
  type    = string
  default = "US"
}
```

### 11. Referencing a module in another module
```hcl
module "vpc" {
  source = "../../modules/vpc"
}

module "gke" {
  source     = "../../modules/gke"
  network_id = module.vpc.network_id
  subnet_id  = module.vpc.subnet_id
}
```

### 12. Minimal reusable GCS bucket module
```hcl
# modules/bucket/main.tf
resource "google_storage_bucket" "bucket" {
  name     = var.bucket_name
  location = var.location
  labels   = var.labels

  versioning {
    enabled = var.versioning_enabled
  }
}
```

---

## Intermediate

### 13. Module with for_each
```hcl
module "buckets" {
  for_each = {
    logs    = "US"
    backups = "EU"
  }
  source   = "./modules/bucket"
  name     = "app-${each.key}"
  location = each.value
}
```

### 14. Module with count
```hcl
module "vm" {
  count        = 3
  source       = "./modules/compute"
  name         = "vm-${count.index}"
  machine_type = "e2-medium"
}
```

### 15. GitHub module source
```hcl
module "networking" {
  source = "github.com/my-org/terraform-gcp-modules//networking?ref=v2.1.0"
}
```

### 16. GCS module source
```hcl
module "private_module" {
  source = "gcs::https://www.googleapis.com/storage/v1/my-modules-bucket/networking-v1.0.zip"
}
```

### 17. Nested modules (root calls child calls grandchild)
```hcl
# root/main.tf
module "platform" {
  source = "./modules/platform"
}

# modules/platform/main.tf
module "networking" {
  source = "../networking"
}

module "gke" {
  source     = "../gke"
  network_id = module.networking.network_id
}
```

### 18. Module outputs chaining
```hcl
module "sql" {
  source      = "./modules/cloudsql"
  subnet_id   = module.networking.subnet_id
  project_id  = var.project_id
}

output "db_connection_name" {
  value = module.sql.connection_name
}
```

### 19. Module with validation
```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}
```

### 20. Module with sensitive output
```hcl
# modules/cloudsql/outputs.tf
output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
```

### 21. Reusable GKE module
```hcl
# modules/gke/main.tf
resource "google_container_cluster" "cluster" {
  name     = var.cluster_name
  location = var.location

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = var.network_id
  subnetwork = var.subnet_id
}

resource "google_container_node_pool" "nodes" {
  name     = "main-pool"
  cluster  = google_container_cluster.cluster.name
  location = var.location

  node_count = var.node_count
  node_config {
    machine_type = var.machine_type
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

### 22. Module provider inheritance
```hcl
# Modules inherit providers from the root unless overridden
module "eu_bucket" {
  source    = "./modules/bucket"
  providers = {
    google = google.europe   # override with EU provider
  }
}
```

### 23. terraform-google-modules/network/google
```hcl
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = "my-vpc"
  routing_mode = "GLOBAL"

  subnets = [
    {
      subnet_name   = "app-subnet"
      subnet_ip     = "10.0.0.0/20"
      subnet_region = "us-central1"
    },
    {
      subnet_name   = "gke-subnet"
      subnet_ip     = "10.1.0.0/20"
      subnet_region = "us-central1"
    }
  ]
}
```

### 24. Module with depends_on
```hcl
module "app" {
  source     = "./modules/app"
  depends_on = [module.networking, google_project_service.run]
}
```

### 25. Conditional module invocation
```hcl
module "nat" {
  count  = var.enable_nat ? 1 : 0
  source = "./modules/nat"
  region = var.region
  router = google_compute_router.router.name
}
```

---

## Nested

### 26. Three-tier nested module architecture
```hcl
# root/main.tf
module "infra" {
  source      = "./modules/infra"
  project_id  = var.project_id
  environment = var.environment
}

# modules/infra/main.tf
module "vpc" {
  source     = "./vpc"
  project_id = var.project_id
}

module "gke" {
  source     = "./gke"
  network_id = module.vpc.network_id
  subnet_id  = module.vpc.subnet_id
}

module "databases" {
  source    = "./databases"
  subnet_id = module.vpc.private_subnet_id
}
```

### 27. Passing complex objects into modules
```hcl
module "cloudsql" {
  source = "./modules/cloudsql"

  config = {
    tier              = "db-custom-4-15360"
    availability_type = "REGIONAL"
    disk_size         = 200
    backup_enabled    = true
    read_replicas     = 2
  }
}
```

### 28. Module with dynamic block generation
```hcl
# modules/firewall/main.tf
variable "rules" {
  type = list(object({
    protocol = string
    ports    = list(string)
  }))
}

resource "google_compute_firewall" "rules" {
  name    = var.name
  network = var.network

  dynamic "allow" {
    for_each = var.rules
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }
}
```

### 29. Registry module with submodules
```hcl
module "gke_auth" {
  source = "terraform-google-modules/kubernetes-engine/google//modules/auth"
  version = "~> 29.0"

  project_id   = var.project_id
  cluster_name = module.gke.name
  location     = module.gke.location
}
```

### 30. Passing provider alias into nested module
```hcl
# root/main.tf
provider "google" { alias = "eu"; region = "europe-west1"; project = var.project_id }

module "eu_resources" {
  source    = "./modules/regional"
  providers = { google = google.eu }
}

# modules/regional/main.tf — uses whatever google provider is passed in
resource "google_storage_bucket" "regional" {
  name     = "regional-data"
  location = "EU"
}
```

### 31. Module output used in for_each
```hcl
module "services" {
  for_each    = var.service_configs
  source      = "./modules/cloud-run"
  name        = each.key
  config      = each.value
  network_id  = module.networking.network_id
}

output "service_urls" {
  value = { for k, v in module.services : k => v.url }
}
```

### 32. Module version bumping strategy
```hcl
module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 29.0"   # minor updates OK, breaking changes blocked
  # After testing: bump to "~> 30.0"
}
```

### 33. Module testing with Terratest (Go)
```go
// test/gke_test.go
func TestGKEModule(t *testing.T) {
  opts := &terraform.Options{
    TerraformDir: "../modules/gke",
    Vars: map[string]interface{}{
      "project_id":    "test-project",
      "cluster_name": "test-cluster",
    },
  }
  defer terraform.Destroy(t, opts)
  terraform.InitAndApply(t, opts)

  clusterName := terraform.Output(t, opts, "cluster_name")
  assert.Equal(t, "test-cluster", clusterName)
}
```

### 34. Monorepo module organization
```
modules/
  gcp/
    networking/    # VPC, subnets, NAT, firewall
    gke/           # GKE cluster + node pools
    cloudsql/      # Cloud SQL (Postgres, MySQL)
    cloudrun/      # Cloud Run services
    iam/           # Service accounts, bindings
    monitoring/    # Alerts, dashboards
stacks/
  prod/
    networking/main.tf
    gke/main.tf
```

---

## Advanced

### 35. Module composition with outputs-as-inputs
```hcl
module "vpc"         { source = "./modules/vpc";         project_id = var.project_id }
module "gke"         { source = "./modules/gke";         network_id = module.vpc.network_id; subnet_id = module.vpc.gke_subnet_id }
module "cloudsql"    { source = "./modules/cloudsql";    network_id = module.vpc.network_id }
module "cloud_run"   { source = "./modules/cloudrun";    db_host    = module.cloudsql.private_ip; vpc_connector = module.vpc.connector_id }
```

### 36. Published module with semantic versioning
```bash
git tag v1.0.0
git tag v1.1.0   # minor feature
git tag v2.0.0   # breaking change
git push --tags
```

### 37. Module with feature flags
```hcl
variable "features" {
  type = object({
    enable_nat          = bool
    enable_flow_logs    = bool
    enable_private_gke  = bool
    enable_workload_id  = bool
  })
  default = {
    enable_nat         = true
    enable_flow_logs   = false
    enable_private_gke = true
    enable_workload_id = true
  }
}
```

### 38. Module with complex lifecycle management
```hcl
# modules/sql-with-replica/main.tf
resource "google_sql_database_instance" "primary" {
  name             = "${var.name}-primary"
  database_version = "POSTGRES_15"
  region           = var.primary_region

  settings { tier = var.tier }

  lifecycle { prevent_destroy = true }
}

resource "google_sql_database_instance" "replica" {
  count            = var.replica_count
  name             = "${var.name}-replica-${count.index}"
  database_version = "POSTGRES_15"
  region           = var.replica_region

  master_instance_name = google_sql_database_instance.primary.name
  replica_configuration {
    failover_target = count.index == 0
  }
  settings { tier = var.replica_tier }
}
```

### 39. Module documentation with README
```markdown
## Usage
module "gke" {
  source      = "./modules/gke"
  project_id  = "my-project"
  cluster_name = "prod-cluster"
  location    = "us-central1"
  node_pools  = [...]
}

## Inputs
| Name | Type | Default | Description |
|------|------|---------|-------------|
| project_id | string | — | GCP project ID |

## Outputs
| Name | Description |
|------|-------------|
| cluster_name | GKE cluster name |
```

### 40. Module override files (for testing)
```hcl
# modules/gke/main.tf — production code
resource "google_container_cluster" "cluster" { ... }

# modules/gke/main_override.tf — local test override (not committed)
resource "google_container_cluster" "cluster" {
  name     = "test-cluster"
  location = "us-central1-a"   # zone instead of region for speed
  remove_default_node_pool = true
  initial_node_count = 1
}
```

### 41. Check block inside a module
```hcl
# modules/networking/main.tf
check "subnet_cidr_size" {
  assert {
    condition     = tonumber(split("/", var.subnet_cidr)[1]) <= 24
    error_message = "Subnet must be /24 or larger for GKE pod IP space."
  }
}
```

### 42. Module with ephemeral resource
```hcl
# modules/sa-key/main.tf (Terraform 1.10+)
ephemeral "google_service_account_key" "temp" {
  service_account_id = var.service_account_id
}

output "access_token" {
  value     = ephemeral.google_service_account_key.temp.private_key
  sensitive = true
  ephemeral = true
}
```

### 43. Modules with mixed providers
```hcl
module "dns" {
  source = "./modules/dns"
  providers = {
    google      = google
    google-beta = google-beta
  }
}
```

### 44. Blue-green deployment via modules
```hcl
module "blue" {
  source      = "./modules/cloud-run"
  name        = "app-blue"
  image       = var.blue_image
  traffic     = var.blue_traffic_pct
}

module "green" {
  source      = "./modules/cloud-run"
  name        = "app-green"
  image       = var.green_image
  traffic     = 100 - var.blue_traffic_pct
}
```

### 45. Module with for_each and depends_on
```hcl
module "cloud_run_services" {
  for_each   = var.services
  source     = "./modules/cloud-run"
  name       = each.key
  image      = each.value.image
  depends_on = [
    google_project_service.run,
    module.networking,
  ]
}
```

### 46. Terragrunt-style module wrapping
```hcl
# live/prod/gke/terragrunt.hcl
terraform {
  source = "github.com/my-org/tf-modules//gke?ref=v3.0.0"
}

inputs = {
  project_id   = dependency.project.outputs.project_id
  network_id   = dependency.vpc.outputs.network_id
  subnet_id    = dependency.vpc.outputs.gke_subnet_id
  cluster_name = "prod-cluster"
}
```

### 47. Module registry with custom provider
```hcl
module "custom_resource" {
  source  = "my-registry.example.com/my-org/custom-gcp/google"
  version = "~> 1.0"
}
```

### 48. Module output aggregation
```hcl
output "all_service_accounts" {
  value = merge(
    { for k, v in module.gke_sas    : k => v.email },
    { for k, v in module.app_sas    : k => v.email },
    { for k, v in module.infra_sas  : k => v.email },
  )
}
```

### 49. Module with dynamic provider aliases
```hcl
variable "regions" {
  type    = list(string)
  default = ["us-central1", "europe-west1"]
}

# Cannot use for_each for providers — define statically:
provider "google" { alias = "primary";   region = var.regions[0]; project = var.project_id }
provider "google" { alias = "secondary"; region = var.regions[1]; project = var.project_id }

module "primary_stack"   { source = "./stack"; providers = { google = google.primary } }
module "secondary_stack" { source = "./stack"; providers = { google = google.secondary } }
```

### 50. Full production module call
```hcl
module "production_platform" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 29.0"

  project_id = var.project_id
  name       = "prod-cluster"
  region     = "us-central1"

  network           = module.vpc.network_name
  subnetwork        = module.vpc.subnets_names[0]
  ip_range_pods     = module.vpc.subnets_secondary_ranges[0][0]["range_name"]
  ip_range_services = module.vpc.subnets_secondary_ranges[0][1]["range_name"]

  enable_private_nodes    = true
  master_ipv4_cidr_block  = "172.16.0.0/28"
  deletion_protection     = true
  release_channel         = "REGULAR"
  kubernetes_version      = "latest"

  node_pools = [
    {
      name           = "default-pool"
      machine_type   = "e2-standard-4"
      min_count      = 1
      max_count      = 10
      disk_size_gb   = 100
      disk_type      = "pd-ssd"
      auto_upgrade   = true
      auto_repair    = true
    }
  ]

  node_pools_oauth_scopes = {
    all = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```
