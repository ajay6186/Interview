# Examples 1.3 — Variables & Outputs (GCP) (50 examples)

---

## Basic

### 1. String variable
```hcl
variable "project_id" {
  type        = string
  description = "GCP project ID"
}
```

### 2. Variable with default value
```hcl
variable "region" {
  type    = string
  default = "us-central1"
}
```

### 3. Number variable
```hcl
variable "node_count" {
  type    = number
  default = 3
}
```

### 4. Boolean variable
```hcl
variable "enable_deletion_protection" {
  type    = bool
  default = true
}
```

### 5. Simple output
```hcl
output "bucket_name" {
  value = google_storage_bucket.my_bucket.name
}
```

### 6. Output with description
```hcl
output "vm_ip" {
  description = "The public IP of the VM instance"
  value       = google_compute_instance.vm.network_interface[0].access_config[0].nat_ip
}
```

### 7. Using a variable in a resource
```hcl
variable "environment" {
  type = string
}

resource "google_storage_bucket" "app" {
  name     = "app-${var.environment}-data"
  location = "US"
}
```

### 8. Passing variable via CLI
```bash
terraform apply -var="project_id=my-gcp-project"
terraform apply -var="region=europe-west1" -var="environment=prod"
```

### 9. Variable via .tfvars file
```hcl
# terraform.tfvars
project_id  = "my-gcp-project"
region      = "us-central1"
environment = "production"
```

### 10. Passing a .tfvars file explicitly
```bash
terraform apply -var-file="production.tfvars"
terraform plan  -var-file="staging.tfvars"
```

### 11. Environment variable for input
```bash
export TF_VAR_project_id="my-gcp-project"
export TF_VAR_environment="production"
terraform apply
```

### 12. Sensitive output
```hcl
output "db_password" {
  value     = google_sql_user.app_user.password
  sensitive = true
}
```

---

## Intermediate

### 13. List variable
```hcl
variable "allowed_regions" {
  type    = list(string)
  default = ["us-central1", "europe-west1", "asia-east1"]
}
```

### 14. Map variable
```hcl
variable "machine_types" {
  type = map(string)
  default = {
    dev  = "e2-micro"
    staging = "e2-medium"
    prod = "e2-standard-4"
  }
}

resource "google_compute_instance" "vm" {
  machine_type = var.machine_types[var.environment]
  # ...
}
```

### 15. Object variable
```hcl
variable "db_config" {
  type = object({
    tier              = string
    availability_type = string
    disk_size         = number
  })
  default = {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 20
  }
}
```

### 16. Variable validation
```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

### 17. Variable validation with regex
```hcl
variable "project_id" {
  type = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be a valid GCP project identifier."
  }
}
```

### 18. Output depends_on
```hcl
output "service_url" {
  value       = google_cloud_run_v2_service.app.uri
  description = "Cloud Run service URL"
  depends_on  = [google_cloud_run_v2_service_iam_member.public]
}
```

### 19. Nullable variable
```hcl
variable "custom_endpoint" {
  type     = string
  default  = null
  nullable = true
}
```

### 20. Tuple variable
```hcl
variable "cidr_blocks" {
  type = tuple([string, string])
  default = ["10.0.0.0/24", "10.1.0.0/24"]
}
```

### 21. Output a resource attribute map
```hcl
output "bucket_urls" {
  value = {
    for k, bucket in google_storage_bucket.buckets :
    k => bucket.url
  }
}
```

### 22. Sensitive variable
```hcl
variable "db_password" {
  type      = string
  sensitive = true
}
```

### 23. Output from count resources
```hcl
output "vm_ips" {
  value = google_compute_instance.vm[*].network_interface[0].network_ip
}
```

### 24. Output from for_each resources
```hcl
output "bucket_self_links" {
  value = {
    for k, b in google_storage_bucket.buckets : k => b.self_link
  }
}
```

### 25. Variable precedence (low → high)
```bash
# 1. Default values in variable blocks
# 2. terraform.tfvars
# 3. *.auto.tfvars (alphabetical)
# 4. -var-file flags
# 5. -var flags
# 6. TF_VAR_* environment variables (actually #2, below tfvars)
```

---

## Nested

### 26. Nested object variable for GKE
```hcl
variable "gke_config" {
  type = object({
    name     = string
    location = string
    node_pools = list(object({
      name         = string
      machine_type = string
      min_nodes    = number
      max_nodes    = number
    }))
  })
}
```

### 27. Complex map of objects variable
```hcl
variable "buckets" {
  type = map(object({
    location       = string
    storage_class  = string
    versioning     = bool
    lifecycle_age  = number
  }))
  default = {
    logs = {
      location      = "US"
      storage_class = "NEARLINE"
      versioning    = false
      lifecycle_age = 30
    }
    backups = {
      location      = "EU"
      storage_class = "COLDLINE"
      versioning    = true
      lifecycle_age = 365
    }
  }
}
```

### 28. Using nested variable in for_each resource
```hcl
resource "google_storage_bucket" "configured" {
  for_each      = var.buckets
  name          = "app-${each.key}-bucket"
  location      = each.value.location
  storage_class = each.value.storage_class

  versioning {
    enabled = each.value.versioning
  }

  lifecycle_rule {
    condition { age = each.value.lifecycle_age }
    action    { type = "Delete" }
  }
}
```

### 29. Output nested object
```hcl
output "vpc_info" {
  value = {
    network_id   = google_compute_network.vpc.id
    network_name = google_compute_network.vpc.name
    subnet_ids   = [for s in google_compute_subnetwork.subnets : s.id]
    gateway_ip   = google_compute_subnetwork.main.gateway_address
  }
}
```

### 30. Variable with optional object fields (Terraform 1.3+)
```hcl
variable "vm_config" {
  type = object({
    machine_type = string
    zone         = string
    disk_size    = optional(number, 50)
    labels       = optional(map(string), {})
    spot         = optional(bool, false)
  })
}
```

### 31. Output with complex transformation
```hcl
output "service_endpoints" {
  value = {
    for name, svc in google_cloud_run_v2_service.services :
    name => {
      url    = svc.uri
      region = svc.location
    }
  }
}
```

### 32. Chained variable defaults using local
```hcl
variable "project_id" {
  type    = string
  default = null
}

locals {
  project_id = coalesce(var.project_id, data.google_project.current.project_id)
}
```

### 33. Variable for a list of firewall rules
```hcl
variable "firewall_rules" {
  type = list(object({
    name          = string
    protocol      = string
    ports         = list(string)
    source_ranges = list(string)
  }))
}

resource "google_compute_firewall" "rules" {
  for_each = { for r in var.firewall_rules : r.name => r }

  name    = each.value.name
  network = google_compute_network.vpc.name

  allow {
    protocol = each.value.protocol
    ports    = each.value.ports
  }

  source_ranges = each.value.source_ranges
}
```

### 34. Passing outputs between modules
```hcl
module "networking" {
  source = "./modules/networking"
}

module "compute" {
  source     = "./modules/compute"
  network_id = module.networking.network_id
  subnet_id  = module.networking.subnet_id
}
```

---

## Advanced

### 35. Ephemeral variable (Terraform 1.10+)
```hcl
variable "oauth_token" {
  type      = string
  sensitive = true
  ephemeral = true
}
```

### 36. Output with precondition (Terraform 1.5+)
```hcl
output "db_connection_string" {
  value = "postgresql://${google_sql_user.app.name}@${google_sql_database_instance.db.private_ip_address}:5432/${google_sql_database.app_db.name}"

  precondition {
    condition     = google_sql_database_instance.db.settings[0].availability_type == "REGIONAL"
    error_message = "DB must be REGIONAL for production use."
  }
}
```

### 37. Variable-driven conditional resource
```hcl
variable "create_nat_gateway" {
  type    = bool
  default = false
}

resource "google_compute_router_nat" "nat" {
  count  = var.create_nat_gateway ? 1 : 0
  name   = "cloud-nat"
  router = google_compute_router.router.name
  region = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

### 38. Any type variable for flexibility
```hcl
variable "extra_labels" {
  type    = any
  default = {}
}

locals {
  common_labels = merge({
    managed_by  = "terraform"
    environment = var.environment
  }, var.extra_labels)
}
```

### 39. Variables for multi-region deployment
```hcl
variable "regions" {
  type = map(object({
    region = string
    zone   = string
    cidr   = string
  }))
  default = {
    primary = {
      region = "us-central1"
      zone   = "us-central1-a"
      cidr   = "10.0.0.0/20"
    }
    secondary = {
      region = "europe-west1"
      zone   = "europe-west1-b"
      cidr   = "10.1.0.0/20"
    }
  }
}
```

### 40. Output all GKE cluster details
```hcl
output "gke_clusters" {
  sensitive = true
  value = {
    for name, cluster in google_container_cluster.clusters :
    name => {
      endpoint               = cluster.endpoint
      ca_certificate         = cluster.master_auth[0].cluster_ca_certificate
      cluster_id             = cluster.id
    }
  }
}
```

### 41. Secret Manager variable integration
```hcl
data "google_secret_manager_secret_version" "db_password" {
  secret = "db-password"
}

locals {
  db_password = data.google_secret_manager_secret_version.db_password.secret_data
}

resource "google_sql_user" "app" {
  name     = "app"
  instance = google_sql_database_instance.db.name
  password = local.db_password
}
```

### 42. Variable with cross-validation using locals
```hcl
variable "min_nodes" {
  type    = number
  default = 1
}

variable "max_nodes" {
  type    = number
  default = 5
}

locals {
  _ = (var.min_nodes <= var.max_nodes) ? null : tobool("min_nodes must be <= max_nodes")
}
```

### 43. Terragrunt-style tfvars for environment isolation
```bash
# environments/prod/terraform.tfvars
project_id        = "prod-project-123"
environment       = "prod"
region            = "us-central1"
enable_deletion_protection = true
db_tier           = "db-custom-8-30720"
```

### 44. Output for CI/CD consumption
```hcl
output "deployment_info" {
  value = jsonencode({
    project  = var.project_id
    region   = var.region
    service  = google_cloud_run_v2_service.app.name
    url      = google_cloud_run_v2_service.app.uri
    revision = google_cloud_run_v2_service.app.latest_ready_revision
  })
}
```

### 45. Using outputs in remote module
```bash
terraform output -json | jq '.bucket_name.value'
terraform output -raw vm_ip
```

### 46. Variable for organization-level configuration
```hcl
variable "org_config" {
  type = object({
    org_id          = string
    billing_account = string
    folders = map(object({
      display_name = string
      parent       = string
    }))
  })
}
```

### 47. Output with for expression filtering
```hcl
output "production_vms" {
  value = {
    for k, vm in google_compute_instance.fleet :
    k => vm.network_interface[0].network_ip
    if vm.labels["environment"] == "production"
  }
}
```

### 48. Sensitive output with masking
```hcl
output "service_account_key" {
  value     = base64decode(google_service_account_key.key.private_key)
  sensitive = true
}
# Access via: terraform output -raw service_account_key
```

### 49. Variable default using can() for safe parsing
```hcl
variable "disk_size_gb" {
  type = number
  validation {
    condition     = var.disk_size_gb >= 10 && var.disk_size_gb <= 65536
    error_message = "Disk size must be between 10 GB and 65536 GB."
  }
}
```

### 50. Full variable and output pattern for a GCP module
```hcl
# variables.tf
variable "project_id"   { type = string }
variable "region"       { type = string; default = "us-central1" }
variable "environment"  { type = string }
variable "vpc_cidr"     { type = string; default = "10.0.0.0/16" }
variable "enable_nat"   { type = bool;   default = true }

variable "node_pool" {
  type = object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
  })
  default = {
    machine_type = "e2-standard-4"
    min_nodes    = 1
    max_nodes    = 5
  }
}

# outputs.tf
output "cluster_endpoint"  { value = google_container_cluster.gke.endpoint; sensitive = true }
output "network_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_id"         { value = google_compute_subnetwork.main.id }
output "service_account"   { value = google_service_account.gke_sa.email }
```
