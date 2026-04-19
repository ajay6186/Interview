# Examples 2.5 — Meta-Arguments (GCP) (50 examples)

---

## Basic

### 1. count — create multiple VMs
```hcl
resource "google_compute_instance" "vm" {
  count        = 3
  name         = "app-vm-${count.index}"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }
}
```

### 2. count.index — use index in naming
```hcl
resource "google_storage_bucket" "shards" {
  count    = 4
  name     = "app-shard-${count.index}"
  location = "US"
}
```

### 3. for_each with a map
```hcl
resource "google_storage_bucket" "buckets" {
  for_each = {
    logs    = "US"
    backups = "EU"
    archive = "ASIA"
  }

  name     = "app-${each.key}"
  location = each.value
}
```

### 4. for_each with toset()
```hcl
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "run.googleapis.com",
    "sql-component.googleapis.com",
  ])
  service = each.value
}
```

### 5. depends_on — explicit dependency
```hcl
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_compute_network" "vpc" {
  name       = "my-vpc"
  depends_on = [google_project_service.compute]
}
```

### 6. lifecycle — prevent_destroy
```hcl
resource "google_sql_database_instance" "db" {
  name             = "prod-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  settings { tier = "db-custom-4-15360" }

  lifecycle {
    prevent_destroy = true
  }
}
```

### 7. lifecycle — ignore_changes
```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }

  lifecycle {
    ignore_changes = [metadata["ssh-keys"], labels]
  }
}
```

### 8. lifecycle — create_before_destroy
```hcl
resource "google_compute_instance" "web" {
  name         = "web-server"
  machine_type = "e2-standard-2"
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }
  network_interface { network = "default" }

  lifecycle {
    create_before_destroy = true
  }
}
```

### 9. provider meta-argument
```hcl
resource "google_storage_bucket" "eu_bucket" {
  provider = google.europe
  name     = "my-eu-bucket"
  location = "EU"
}
```

### 10. Referencing count resources
```hcl
output "vm_ips" {
  value = google_compute_instance.vm[*].network_interface[0].network_ip
}
```

### 11. Referencing for_each resources
```hcl
output "bucket_urls" {
  value = {
    for k, b in google_storage_bucket.buckets : k => b.url
  }
}
```

### 12. count with conditional (enable/disable)
```hcl
resource "google_compute_router_nat" "nat" {
  count  = var.enable_nat ? 1 : 0
  name   = "cloud-nat"
  router = google_compute_router.router.name
  region = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

---

## Intermediate

### 13. for_each with complex object map
```hcl
variable "services" {
  type = map(object({
    image    = string
    cpu      = string
    memory   = string
    min_inst = number
    max_inst = number
  }))
}

resource "google_cloud_run_v2_service" "services" {
  for_each = var.services
  name     = each.key
  location = var.region

  template {
    containers {
      image = each.value.image
      resources {
        limits = {
          cpu    = each.value.cpu
          memory = each.value.memory
        }
      }
    }
    scaling {
      min_instance_count = each.value.min_inst
      max_instance_count = each.value.max_inst
    }
  }
}
```

### 14. depends_on with module
```hcl
module "app" {
  source     = "./modules/app"
  depends_on = [
    module.networking,
    google_project_service.run,
  ]
}
```

### 15. lifecycle replace_triggered_by (Terraform 1.2+)
```hcl
resource "google_compute_instance" "app" {
  name         = "app"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }

  lifecycle {
    replace_triggered_by = [
      google_compute_subnetwork.main.id,
    ]
  }
}
```

### 16. ignore_changes with all
```hcl
resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  lifecycle {
    ignore_changes = [
      node_config,
      node_pool,
    ]
  }
}
```

### 17. for_each converting list to map
```hcl
variable "subnet_names" {
  type    = list(string)
  default = ["app", "db", "tools"]
}

resource "google_compute_subnetwork" "subnets" {
  for_each      = { for name in var.subnet_names : name => name }
  name          = "${each.key}-subnet"
  ip_cidr_range = cidrsubnet("10.0.0.0/16", 4, index(var.subnet_names, each.key))
  region        = "us-central1"
  network       = google_compute_network.vpc.id
}
```

### 18. count vs for_each decision guide
```hcl
# Use count when:
# - Creating N identical resources
# - Toggling a resource on/off

# Use for_each when:
# - Resources differ by configuration
# - Stable identity matters (count[0] shifts on deletion)
# - Map keys give meaningful addresses
```

### 19. Meta-argument provider for beta resources
```hcl
resource "google_compute_region_network_endpoint_group" "serverless" {
  provider              = google-beta
  name                  = "serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
  cloud_run {
    service = google_cloud_run_v2_service.app.name
  }
}
```

### 20. depends_on for implicit dependency bypass
```hcl
resource "google_project_iam_member" "role" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.app.email}"
}

resource "google_cloud_run_v2_service" "app" {
  # Terraform may not detect the IAM change as a dependency
  depends_on = [google_project_iam_member.role]
  # ...
}
```

### 21. for_each with set of objects (Terraform 1.0+)
```hcl
locals {
  firewall_rules = toset([
    { name = "allow-http",  port = "80",  protocol = "tcp" },
    { name = "allow-https", port = "443", protocol = "tcp" },
  ])
}

resource "google_compute_firewall" "rules" {
  for_each = { for r in local.firewall_rules : r.name => r }
  name     = each.value.name
  network  = google_compute_network.vpc.name
  allow {
    protocol = each.value.protocol
    ports    = [each.value.port]
  }
  source_ranges = ["0.0.0.0/0"]
}
```

### 22. lifecycle postcondition
```hcl
resource "google_sql_database_instance" "db" {
  name             = "prod-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  settings { tier = "db-custom-4-15360" }

  lifecycle {
    postcondition {
      condition     = self.settings[0].availability_type == "REGIONAL"
      error_message = "Production DB must be REGIONAL."
    }
  }
}
```

### 23. lifecycle precondition
```hcl
resource "google_storage_bucket" "secure" {
  name     = var.bucket_name
  location = var.location

  lifecycle {
    precondition {
      condition     = var.location != "US"
      error_message = "Buckets with PII must NOT be in the US multi-region."
    }
  }
}
```

### 24. Moving between count and for_each
```bash
# Step 1: Remove old count-based resources from state
terraform state rm 'google_compute_instance.vm[0]'
terraform state rm 'google_compute_instance.vm[1]'

# Step 2: Import with for_each keys
terraform import 'google_compute_instance.vm["primary"]' projects/my-project/zones/us-central1-a/instances/vm-0
terraform import 'google_compute_instance.vm["replica"]' projects/my-project/zones/us-central1-b/instances/vm-1
```

### 25. Aggregating outputs from for_each resources
```hcl
output "service_endpoints" {
  value = {
    for name, svc in google_cloud_run_v2_service.services :
    name => {
      url    = svc.uri
      latest = svc.latest_ready_revision
    }
  }
}
```

---

## Nested

### 26. Nested for_each for IAM bindings
```hcl
locals {
  sa_roles = {
    gke_sa = ["roles/container.nodeServiceAccount", "roles/storage.objectViewer"]
    app_sa = ["roles/cloudsql.client", "roles/secretmanager.secretAccessor"]
  }

  bindings = flatten([
    for sa, roles in local.sa_roles : [
      for role in roles : {
        sa   = sa
        role = role
      }
    ]
  ])
}

resource "google_project_iam_member" "bindings" {
  for_each = {
    for b in local.bindings : "${b.sa}-${b.role}" => b
  }
  project = var.project_id
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.sas[each.value.sa].email}"
}
```

### 27. count across zones for HA
```hcl
locals {
  zones = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

resource "google_compute_instance" "ha_vms" {
  count        = length(local.zones)
  name         = "app-vm-${count.index}"
  machine_type = "e2-standard-4"
  zone         = local.zones[count.index]

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
  }
}
```

### 28. for_each module calls
```hcl
module "regional_gke" {
  for_each = {
    primary   = { region = "us-central1"; node_count = 5 }
    secondary = { region = "europe-west1"; node_count = 3 }
  }

  source     = "./modules/gke"
  name       = "cluster-${each.key}"
  region     = each.value.region
  node_count = each.value.node_count
  network_id = module.networking.network_id
}
```

### 29. depends_on for API enablement chain
```hcl
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "iam.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = "us-central1"

  depends_on = [google_project_service.required_apis]

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

### 30. lifecycle with multiple constraints
```hcl
resource "google_storage_bucket" "critical" {
  name     = "critical-business-data"
  location = "US"

  versioning { enabled = true }

  lifecycle {
    prevent_destroy       = true
    create_before_destroy = false
    ignore_changes        = [labels, website]
  }
}
```

### 31. replace_triggered_by with resource reference
```hcl
resource "google_compute_ssl_certificate" "cert" {
  name_prefix = "my-cert-"
  private_key = file("server.key")
  certificate = file("server.crt")

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_target_https_proxy" "proxy" {
  name             = "my-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_ssl_certificate.cert.id]

  lifecycle {
    replace_triggered_by = [google_compute_ssl_certificate.cert.id]
  }
}
```

### 32. Conditional module + depends_on
```hcl
module "dr_cluster" {
  count      = var.enable_dr ? 1 : 0
  source     = "./modules/gke"
  region     = var.dr_region
  depends_on = [module.primary_cluster]
}
```

### 33. for_each with null-coalescing
```hcl
resource "google_compute_instance" "vms" {
  for_each     = var.vm_configs
  name         = each.key
  machine_type = coalesce(each.value.machine_type, "e2-medium")
  zone         = coalesce(each.value.zone, "${var.region}-a")

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 34. depends_on for Workload Identity setup
```hcl
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.k8s_sa_name}]"
}

resource "kubernetes_service_account" "app" {
  metadata {
    name      = var.k8s_sa_name
    namespace = var.namespace
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.app_sa.email
    }
  }

  depends_on = [google_service_account_iam_member.workload_identity]
}
```

---

## Advanced

### 35. for_each with optional fields (Terraform 1.3+)
```hcl
variable "buckets" {
  type = map(object({
    location      = string
    versioning    = optional(bool, false)
    lifecycle_age = optional(number, 90)
    kms_key       = optional(string)
  }))
}

resource "google_storage_bucket" "buckets" {
  for_each = var.buckets
  name     = "app-${each.key}"
  location = each.value.location

  versioning { enabled = each.value.versioning }

  dynamic "encryption" {
    for_each = each.value.kms_key != null ? [each.value.kms_key] : []
    content {
      default_kms_key_name = encryption.value
    }
  }

  lifecycle_rule {
    condition { age = each.value.lifecycle_age }
    action    { type = "Delete" }
  }
}
```

### 36. Meta-argument interaction with providers
```hcl
resource "google_storage_bucket" "replicas" {
  for_each = {
    us    = { provider = google         ; location = "US" }
    eu    = { provider = google.europe  ; location = "EU" }
    asia  = { provider = google.asia    ; location = "ASIA" }
  }

  provider = each.value.provider
  name     = "app-${each.key}-replica"
  location = each.value.location
}
```

### 37. count with depends_on ordering
```hcl
resource "google_compute_firewall" "rules" {
  count   = length(var.firewall_configs)
  name    = var.firewall_configs[count.index].name
  network = google_compute_network.vpc.name

  allow {
    protocol = var.firewall_configs[count.index].protocol
    ports    = var.firewall_configs[count.index].ports
  }
  source_ranges = var.firewall_configs[count.index].source_ranges

  depends_on = [google_compute_network.vpc]
}
```

### 38. Ephemeral resource with meta-arguments (Terraform 1.10+)
```hcl
ephemeral "google_service_account_key" "deploy_key" {
  service_account_id = google_service_account.deploy_sa.id
}
```

### 39. Moved block for count-to-for_each migration
```hcl
moved {
  from = google_compute_instance.vm[0]
  to   = google_compute_instance.vm["primary"]
}

moved {
  from = google_compute_instance.vm[1]
  to   = google_compute_instance.vm["replica"]
}
```

### 40. Complex postcondition
```hcl
resource "google_container_cluster" "gke" {
  name     = "prod-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = true

  lifecycle {
    postcondition {
      condition     = self.endpoint != ""
      error_message = "GKE cluster endpoint must be available after creation."
    }
    postcondition {
      condition     = self.master_version != null
      error_message = "GKE cluster master version must be set."
    }
  }
}
```

### 41. for_each with sensitive map values
```hcl
variable "service_credentials" {
  type      = map(string)
  sensitive = true
}

resource "google_secret_manager_secret_version" "creds" {
  for_each    = var.service_credentials
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}
```

### 42. depends_on with external data source
```hcl
data "external" "wait_for_db" {
  program = ["bash", "-c", <<-EOT
    until pg_isready -h ${google_sql_database_instance.db.private_ip_address}; do
      sleep 5
    done
    echo '{"ready": "true"}'
  EOT
  ]
}

resource "null_resource" "run_migrations" {
  depends_on = [data.external.wait_for_db]

  provisioner "local-exec" {
    command = "flyway migrate"
  }
}
```

### 43. for_each with count combination (use sparingly)
```hcl
# Avoid nesting for_each/count — use flatten + for_each instead
locals {
  all_rules = flatten([
    for vpc_name, vpc in var.vpcs : [
      for rule in vpc.firewall_rules : merge(rule, { vpc = vpc_name })
    ]
  ])
}

resource "google_compute_firewall" "all" {
  for_each = { for r in local.all_rules : "${r.vpc}-${r.name}" => r }
  name     = "${each.value.vpc}-${each.value.name}"
  network  = google_compute_network.vpcs[each.value.vpc].name
  allow {
    protocol = each.value.protocol
    ports    = each.value.ports
  }
}
```

### 44. provider meta-argument in module
```hcl
module "eu_workload" {
  source = "./modules/workload"
  providers = {
    google      = google.europe
    google-beta = google-beta.europe
  }
  region = "europe-west1"
}
```

### 45. Replacing specific for_each instance
```bash
# Replace only one instance in a for_each:
terraform apply -replace='google_compute_instance.vms["primary"]'
```

### 46. Full lifecycle management for blue-green
```hcl
resource "google_cloud_run_v2_service" "blue" {
  name     = "app-blue"
  location = var.region

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [template[0].revision]
  }
}
```

### 47. depends_on for cross-project IAM
```hcl
resource "google_project_iam_member" "shared_vpc_access" {
  project = var.host_project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:service-${data.google_project.service.number}@container-engine-robot.iam.gserviceaccount.com"
}

resource "google_container_cluster" "gke" {
  name    = "my-cluster"
  network = "projects/${var.host_project_id}/global/networks/${var.shared_vpc_name}"

  depends_on = [google_project_iam_member.shared_vpc_access]
}
```

### 48. Conditional for_each with null coalescing
```hcl
resource "google_compute_instance" "workers" {
  for_each = var.enable_workers ? var.worker_configs : {}

  name         = "worker-${each.key}"
  machine_type = each.value.machine_type
  zone         = each.value.zone

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 49. Meta-argument best practices summary
```hcl
# count: use for N identical resources or on/off toggle
# for_each: use for distinct resources with map/set keys
# depends_on: only when Terraform can't auto-detect dependency
# lifecycle.prevent_destroy: production critical resources
# lifecycle.ignore_changes: externally managed attributes
# lifecycle.create_before_destroy: zero-downtime replacements
# lifecycle.replace_triggered_by: force replacement on dependency change
# provider: when resource needs non-default provider alias
```

### 50. Full production example combining all meta-arguments
```hcl
locals {
  services = {
    api      = { image = var.api_image;      cpu = "2"; memory = "1Gi"; min = 2; max = 20 }
    worker   = { image = var.worker_image;   cpu = "1"; memory = "512Mi"; min = 1; max = 10 }
    frontend = { image = var.frontend_image; cpu = "1"; memory = "256Mi"; min = 2; max = 50 }
  }
}

resource "google_cloud_run_v2_service" "services" {
  for_each = local.services
  provider = google
  name     = "${var.app_name}-${each.key}"
  location = var.region

  depends_on = [
    google_project_service.run,
    google_project_iam_member.service_roles,
  ]

  template {
    service_account = google_service_account.app_sa.email

    containers {
      image = each.value.image
      resources {
        limits = { cpu = each.value.cpu; memory = each.value.memory }
      }
    }

    scaling {
      min_instance_count = each.value.min
      max_instance_count = each.value.max
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [template[0].revision]

    precondition {
      condition     = each.value.min <= each.value.max
      error_message = "min_instances must be <= max_instances for service ${each.key}."
    }
  }
}
```
