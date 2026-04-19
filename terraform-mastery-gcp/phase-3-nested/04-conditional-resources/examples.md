# Examples 3.4 — Conditional Resources (GCP) (50 examples)

---

## Basic

### 1. count = 0 to disable a resource
```hcl
variable "enable_nat" { type = bool; default = true }

resource "google_compute_router_nat" "nat" {
  count  = var.enable_nat ? 1 : 0
  name   = "cloud-nat"
  router = google_compute_router.router.name
  region = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

### 2. Conditional bucket creation
```hcl
variable "create_log_bucket" { type = bool; default = false }

resource "google_storage_bucket" "logs" {
  count    = var.create_log_bucket ? 1 : 0
  name     = "app-logs-${var.environment}"
  location = "US"
}
```

### 3. Conditional Cloud SQL read replica
```hcl
variable "enable_read_replica" { type = bool; default = false }

resource "google_sql_database_instance" "replica" {
  count                = var.enable_read_replica ? 1 : 0
  name                 = "app-db-replica"
  database_version     = "POSTGRES_15"
  region               = var.region
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration { failover_target = false }
  settings { tier = "db-custom-2-7680" }
}
```

### 4. Conditional VM with public IP
```hcl
variable "assign_public_ip" { type = bool; default = false }

resource "google_compute_instance" "vm" {
  name         = "app-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id

    dynamic "access_config" {
      for_each = var.assign_public_ip ? [1] : []
      content {}  # Empty block = ephemeral public IP
    }
  }
}
```

### 5. Conditional output
```hcl
output "nat_ip" {
  value = var.enable_nat ? google_compute_router_nat.nat[0].nat_ips : []
}
```

### 6. Conditional machine type
```hcl
locals {
  machine_type = var.environment == "prod" ? "e2-standard-8" : "e2-micro"
}
```

### 7. Conditional project service enablement
```hcl
variable "enable_gke" { type = bool; default = true }

resource "google_project_service" "container" {
  count   = var.enable_gke ? 1 : 0
  service = "container.googleapis.com"
}
```

### 8. Conditional lifecycle prevent_destroy
```hcl
resource "google_storage_bucket" "data" {
  name     = "app-data-${var.environment}"
  location = "US"

  lifecycle {
    prevent_destroy = var.environment == "prod"
  }
}
```

### 9. Conditional regional HA for Cloud SQL
```hcl
resource "google_sql_database_instance" "db" {
  name             = "app-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "prod" ? "REGIONAL" : "ZONAL"
  }
}
```

### 10. Conditional deletion protection
```hcl
resource "google_sql_database_instance" "db" {
  name                = "app-db"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = var.environment == "prod"

  settings { tier = "db-f1-micro" }
}
```

### 11. Conditional resource reference using try()
```hcl
locals {
  nat_ip = try(google_compute_router_nat.nat[0].nat_ips[0], null)
}
```

### 12. Conditional IAM binding
```hcl
variable "make_bucket_public" { type = bool; default = false }

resource "google_storage_bucket_iam_member" "public" {
  count  = var.make_bucket_public ? 1 : 0
  bucket = google_storage_bucket.web.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
```

---

## Intermediate

### 13. Conditional module invocation
```hcl
variable "enable_monitoring" { type = bool; default = true }

module "monitoring" {
  count  = var.enable_monitoring ? 1 : 0
  source = "./modules/monitoring"

  project_id   = var.project_id
  cluster_name = google_container_cluster.gke.name
}
```

### 14. Conditional Redis instance
```hcl
variable "enable_cache" { type = bool; default = false }

resource "google_redis_instance" "cache" {
  count          = var.enable_cache ? 1 : 0
  name           = "app-cache"
  memory_size_gb = var.environment == "prod" ? 4 : 1
  region         = var.region
  tier           = var.environment == "prod" ? "STANDARD_HA" : "BASIC"
}
```

### 15. Conditional Cloud Run IAM (public vs private)
```hcl
variable "public_access" { type = bool; default = false }

resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.public_access ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

### 16. Conditional GKE private cluster
```hcl
variable "private_cluster" { type = bool; default = true }

resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  dynamic "private_cluster_config" {
    for_each = var.private_cluster ? [1] : []
    content {
      enable_private_nodes    = true
      enable_private_endpoint = false
      master_ipv4_cidr_block  = "172.16.0.0/28"
    }
  }
}
```

### 17. Conditional VPC flow logs
```hcl
variable "enable_flow_logs" { type = bool; default = false }

resource "google_compute_subnetwork" "main" {
  name          = "main-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc.id

  dynamic "log_config" {
    for_each = var.enable_flow_logs ? [1] : []
    content {
      aggregation_interval = "INTERVAL_5_SEC"
      flow_sampling        = 0.5
      metadata             = "INCLUDE_ALL_METADATA"
    }
  }
}
```

### 18. Conditional backup configuration
```hcl
resource "google_sql_database_instance" "db" {
  settings {
    tier = var.db_tier

    dynamic "backup_configuration" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        enabled                        = true
        point_in_time_recovery_enabled = true
        start_time                     = "03:00"
        backup_retention_settings {
          retained_backups = 30
        }
      }
    }
  }
}
```

### 19. Conditional alert policy
```hcl
variable "enable_alerts" { type = bool; default = false }

resource "google_monitoring_alert_policy" "high_cpu" {
  count        = var.enable_alerts ? 1 : 0
  display_name = "High CPU - ${var.environment}"
  combiner     = "OR"

  conditions {
    display_name = "CPU > 80%"
    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/instance/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
    }
  }

  notification_channels = [var.alert_channel_id]
}
```

### 20. Conditional VPC access connector
```hcl
variable "enable_serverless_vpc" { type = bool; default = false }

resource "google_vpc_access_connector" "connector" {
  count         = var.enable_serverless_vpc ? 1 : 0
  name          = "vpc-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
}
```

### 21. Conditional Cloud Armor policy
```hcl
variable "enable_cloud_armor" { type = bool; default = false }

resource "google_compute_security_policy" "waf" {
  count = var.enable_cloud_armor ? 1 : 0
  name  = "waf-policy-${var.environment}"

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
    description = "default allow"
  }
}
```

### 22. Conditional KMS encryption for GCS
```hcl
variable "kms_key_id" { type = string; default = null }

resource "google_storage_bucket" "data" {
  name     = "app-data"
  location = "US"

  dynamic "encryption" {
    for_each = var.kms_key_id != null ? [var.kms_key_id] : []
    content {
      default_kms_key_name = encryption.value
    }
  }
}
```

### 23. Conditional custom domain for Cloud Run
```hcl
variable "custom_domain" { type = string; default = null }

resource "google_cloud_run_domain_mapping" "domain" {
  count    = var.custom_domain != null ? 1 : 0
  location = var.region
  name     = var.custom_domain

  metadata { namespace = var.project_id }
  spec { route_name = google_cloud_run_v2_service.app.name }
}
```

### 24. Conditional Cloud CDN
```hcl
variable "enable_cdn" { type = bool; default = false }

resource "google_compute_backend_bucket" "web" {
  name        = "web-backend"
  bucket_name = google_storage_bucket.web.name
  enable_cdn  = var.enable_cdn
}
```

### 25. Conditional preemptible nodes
```hcl
resource "google_container_node_pool" "nodes" {
  name     = "main-pool"
  cluster  = google_container_cluster.gke.name
  location = var.region

  node_config {
    machine_type = var.machine_type

    scheduling {
      preemptible  = var.environment != "prod"
      spot         = var.environment != "prod"
    }
  }
}
```

---

## Nested

### 26. Conditional module + conditional output chaining
```hcl
variable "enable_cache" { type = bool; default = false }

module "redis" {
  count  = var.enable_cache ? 1 : 0
  source = "./modules/redis"
  region = var.region
}

resource "google_cloud_run_v2_service" "app" {
  template {
    containers {
      dynamic "env" {
        for_each = var.enable_cache ? [1] : []
        content {
          name  = "REDIS_HOST"
          value = module.redis[0].host
        }
      }
    }
  }
}
```

### 27. Multi-condition nested ternary
```hcl
locals {
  db_tier = (
    var.environment == "prod" ? "db-custom-8-30720" :
    var.environment == "staging" ? "db-custom-2-7680" :
    "db-f1-micro"
  )

  gke_nodes = (
    var.environment == "prod" ? { min = 3; max = 20 } :
    var.environment == "staging" ? { min = 2; max = 5 } :
    { min = 1; max = 3 }
  )
}
```

### 28. Conditional secondary IP ranges for GKE
```hcl
variable "use_secondary_ranges" { type = bool; default = true }

resource "google_compute_subnetwork" "gke" {
  name          = "gke-subnet"
  ip_cidr_range = "10.1.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc.id

  dynamic "secondary_ip_range" {
    for_each = var.use_secondary_ranges ? [
      { name = "pods";     cidr = "10.10.0.0/16" },
      { name = "services"; cidr = "10.11.0.0/20" },
    ] : []
    content {
      range_name    = secondary_ip_range.value.name
      ip_cidr_range = secondary_ip_range.value.cidr
    }
  }
}
```

### 29. Conditional database replicas with for_each
```hcl
variable "replica_regions" {
  type    = list(string)
  default = []
}

resource "google_sql_database_instance" "replicas" {
  for_each = toset(var.replica_regions)

  name                 = "db-replica-${replace(each.value, "-", "")}"
  database_version     = "POSTGRES_15"
  region               = each.value
  master_instance_name = google_sql_database_instance.primary.name

  replica_configuration { failover_target = false }
  settings { tier = "db-custom-2-7680" }
}
```

### 30. Conditional private service access
```hcl
variable "enable_private_services" { type = bool; default = false }

resource "google_compute_global_address" "private_ip_alloc" {
  count         = var.enable_private_services ? 1 : 0
  name          = "private-ip-alloc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_connection" {
  count                   = var.enable_private_services ? 1 : 0
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc[0].name]
}
```

### 31. Conditional VPC peering
```hcl
variable "peer_network" { type = string; default = null }

resource "google_compute_network_peering" "peer" {
  count        = var.peer_network != null ? 1 : 0
  name         = "vpc-peer"
  network      = google_compute_network.vpc.self_link
  peer_network = var.peer_network
}
```

### 32. Conditional workload identity binding
```hcl
variable "enable_workload_identity" { type = bool; default = false }

resource "google_service_account_iam_member" "workload_identity" {
  count              = var.enable_workload_identity ? 1 : 0
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.k8s_sa_name}]"
}
```

### 33. Conditional logging export sink
```hcl
variable "export_logs_to_bigquery" { type = bool; default = false }

resource "google_logging_project_sink" "bq_sink" {
  count                  = var.export_logs_to_bigquery ? 1 : 0
  name                   = "bq-audit-logs"
  destination            = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.audit_logs[0].dataset_id}"
  unique_writer_identity = true

  filter = "severity>=WARNING"
}

resource "google_bigquery_dataset" "audit_logs" {
  count      = var.export_logs_to_bigquery ? 1 : 0
  dataset_id = "audit_logs"
  location   = "US"
}
```

### 34. Nested conditional GKE features
```hcl
resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = var.region

  dynamic "binary_authorization" {
    for_each = var.environment == "prod" ? [1] : []
    content { mode = "PROJECT_SINGLETON_POLICY_ENFORCE" }
  }

  dynamic "network_policy" {
    for_each = var.enable_network_policy ? [1] : []
    content { enabled = true; provider = "CALICO" }
  }

  dynamic "workload_identity_config" {
    for_each = var.enable_workload_identity ? [1] : []
    content { workload_pool = "${var.project_id}.svc.id.goog" }
  }
}
```

---

## Advanced

### 35. Conditional across multiple environments using object
```hcl
variable "environments" {
  type = map(object({
    create       = bool
    node_count   = number
    machine_type = string
    ha_db        = bool
  }))
}

resource "google_container_cluster" "clusters" {
  for_each = { for env, cfg in var.environments : env => cfg if cfg.create }

  name     = "cluster-${each.key}"
  location = var.region
  deletion_protection = each.key == "prod"

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

### 36. Conditional maintenance window policy
```hcl
resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = var.region

  dynamic "maintenance_policy" {
    for_each = var.maintenance_window != null ? [var.maintenance_window] : []
    content {
      recurring_window {
        start_time = maintenance_policy.value.start_time
        end_time   = maintenance_policy.value.end_time
        recurrence = "FREQ=WEEKLY;BYDAY=${maintenance_policy.value.day}"
      }
    }
  }
}
```

### 37. Conditional DNS zone creation
```hcl
variable "create_private_dns" { type = bool; default = false }

resource "google_dns_managed_zone" "private" {
  count      = var.create_private_dns ? 1 : 0
  name       = "private-zone"
  dns_name   = "${var.environment}.internal."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }
}
```

### 38. Conditional spot node pool
```hcl
variable "spot_node_pool" {
  type = object({ enabled = bool; min_nodes = number; max_nodes = number })
  default = { enabled = false; min_nodes = 0; max_nodes = 0 }
}

resource "google_container_node_pool" "spot" {
  count    = var.spot_node_pool.enabled ? 1 : 0
  name     = "spot-pool"
  cluster  = google_container_cluster.gke.name
  location = var.region

  autoscaling {
    min_node_count = var.spot_node_pool.min_nodes
    max_node_count = var.spot_node_pool.max_nodes
  }

  node_config {
    machine_type = "e2-standard-4"
    spot         = true
  }
}
```

### 39. Conditional resource with count and external condition
```hcl
data "google_compute_network" "existing" {
  count = var.use_existing_network ? 1 : 0
  name  = var.existing_network_name
}

resource "google_compute_network" "new" {
  count                   = var.use_existing_network ? 0 : 1
  name                    = var.network_name
  auto_create_subnetworks = false
}

locals {
  network_id = var.use_existing_network ? data.google_compute_network.existing[0].id : google_compute_network.new[0].id
}
```

### 40. Conditional multi-region deployment
```hcl
variable "multi_region" { type = bool; default = false }

locals {
  regions = var.multi_region ? ["us-central1", "europe-west1", "asia-east1"] : ["us-central1"]
}

resource "google_cloud_run_v2_service" "app" {
  for_each = toset(local.regions)
  name     = "app-${replace(each.value, "-", "")}"
  location = each.value

  template {
    containers {
      image = var.image
    }
  }
}
```

### 41. Conditional service mesh enablement
```hcl
variable "enable_service_mesh" { type = bool; default = false }

resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = var.region

  dynamic "mesh_certificates" {
    for_each = var.enable_service_mesh ? [1] : []
    content { enable_certificates = true }
  }
}

resource "google_gke_hub_feature" "service_mesh" {
  count    = var.enable_service_mesh ? 1 : 0
  provider = google-beta
  name     = "servicemesh"
  location = "global"
}
```

### 42. Conditional SSL policy strictness
```hcl
resource "google_compute_ssl_policy" "policy" {
  name            = "ssl-policy"
  min_tls_version = var.environment == "prod" ? "TLS_1_2" : "TLS_1_0"
  profile         = var.environment == "prod" ? "RESTRICTED" : "COMPATIBLE"
}
```

### 43. Feature flag driven resource creation
```hcl
variable "features" {
  type = object({
    nat          = bool
    cdn          = bool
    armor        = bool
    private_gke  = bool
    ha_db        = bool
    redis        = bool
    monitoring   = bool
  })
}

resource "google_compute_router_nat" "nat"      { count = var.features.nat     ? 1 : 0; ... }
resource "google_redis_instance" "cache"         { count = var.features.redis   ? 1 : 0; ... }
resource "google_compute_security_policy" "waf"  { count = var.features.armor   ? 1 : 0; ... }
```

### 44. Conditional shielded VM
```hcl
variable "enable_shielded_vm" { type = bool; default = false }

resource "google_compute_instance" "vm" {
  name         = "app-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }

  dynamic "shielded_instance_config" {
    for_each = var.enable_shielded_vm ? [1] : []
    content {
      enable_secure_boot          = true
      enable_vtpm                 = true
      enable_integrity_monitoring = true
    }
  }
}
```

### 45. Conditional IAP tunnel
```hcl
variable "enable_iap" { type = bool; default = false }

resource "google_iap_tunnel_instance_iam_member" "iap" {
  count    = var.enable_iap ? 1 : 0
  instance = google_compute_instance.vm.name
  zone     = google_compute_instance.vm.zone
  role     = "roles/iap.tunnelResourceAccessor"
  member   = "user:${var.admin_email}"
}
```

### 46. Conditional database flags
```hcl
locals {
  prod_flags = var.environment == "prod" ? [
    { name = "log_min_duration_statement"; value = "5000" },
    { name = "log_connections";            value = "on" },
    { name = "cloudsql.enable_pgaudit";    value = "on" },
  ] : []
}

resource "google_sql_database_instance" "db" {
  settings {
    tier = var.db_tier
    dynamic "database_flags" {
      for_each = local.prod_flags
      content {
        name  = database_flags.value.name
        value = database_flags.value.value
      }
    }
  }
}
```

### 47. Conditional peering with shared VPC host
```hcl
variable "use_shared_vpc" { type = bool; default = false }

resource "google_compute_shared_vpc_service_project" "shared" {
  count           = var.use_shared_vpc ? 1 : 0
  host_project    = var.host_project_id
  service_project = var.project_id
}
```

### 48. Conditional deployment in check block
```hcl
check "prod_ha_required" {
  assert {
    condition = (
      var.environment != "prod" ||
      google_sql_database_instance.db.settings[0].availability_type == "REGIONAL"
    )
    error_message = "Production databases must use REGIONAL availability."
  }
}
```

### 49. Conditional GCS versioning and lifecycle
```hcl
resource "google_storage_bucket" "data" {
  name     = "app-${var.environment}-data"
  location = "US"

  versioning {
    enabled = var.environment == "prod"
  }

  dynamic "lifecycle_rule" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      condition { num_newer_versions = 30; with_state = "ARCHIVED" }
      action    { type = "Delete" }
    }
  }

  dynamic "lifecycle_rule" {
    for_each = var.environment != "prod" ? [1] : []
    content {
      condition { age = 30 }
      action    { type = "Delete" }
    }
  }
}
```

### 50. Full conditional platform with all environment gates
```hcl
variable "environment" { type = string }

locals {
  is_prod    = var.environment == "prod"
  is_staging = var.environment == "staging"
  is_dev     = var.environment == "dev"
}

# Prod-only: HA DB, replicas, deletion protection
resource "google_sql_database_instance" "db" {
  name                = "app-db-${var.environment}"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = local.is_prod

  settings {
    tier              = local.is_prod ? "db-custom-8-30720" : local.is_staging ? "db-custom-2-7680" : "db-f1-micro"
    availability_type = local.is_prod ? "REGIONAL" : "ZONAL"

    dynamic "backup_configuration" {
      for_each = local.is_prod ? [1] : []
      content {
        enabled                        = true
        point_in_time_recovery_enabled = true
        start_time                     = "03:00"
      }
    }
  }
}

# Non-dev: Redis cache
resource "google_redis_instance" "cache" {
  count          = local.is_dev ? 0 : 1
  name           = "app-cache-${var.environment}"
  memory_size_gb = local.is_prod ? 8 : 2
  region         = var.region
  tier           = local.is_prod ? "STANDARD_HA" : "BASIC"
}

# Prod-only: monitoring alerts
resource "google_monitoring_alert_policy" "error_rate" {
  count        = local.is_prod ? 1 : 0
  display_name = "Error Rate"
  combiner     = "OR"
  conditions {
    display_name = "Error Rate > 1%"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\""
      threshold_value = 0.01
      duration        = "60s"
      comparison      = "COMPARISON_GT"
    }
  }
}
```
