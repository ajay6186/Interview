# Examples 1.2 — Resources & Blocks (GCP) (50 examples)

---

## Basic

### 1. Simple GCS bucket resource
```hcl
resource "google_storage_bucket" "my_bucket" {
  name     = "my-unique-bucket-name"
  location = "US"
}
```

### 2. Compute Engine VM instance
```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
  }
}
```

### 3. VPC network resource
```hcl
resource "google_compute_network" "vpc" {
  name                    = "my-vpc"
  auto_create_subnetworks = false
}
```

### 4. Subnet resource
```hcl
resource "google_compute_subnetwork" "subnet" {
  name          = "my-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.id
}
```

### 5. Cloud SQL instance
```hcl
resource "google_sql_database_instance" "db" {
  name             = "my-db-instance"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"
  }
}
```

### 6. Service account resource
```hcl
resource "google_service_account" "sa" {
  account_id   = "my-service-account"
  display_name = "My Service Account"
}
```

### 7. terraform plan and apply
```bash
terraform plan    # preview changes
terraform apply   # apply changes
terraform destroy # destroy all resources
```

### 8. Resource with labels
```hcl
resource "google_storage_bucket" "labeled" {
  name     = "labeled-bucket"
  location = "US"

  labels = {
    environment = "production"
    team        = "platform"
  }
}
```

### 9. Firewall rule resource
```hcl
resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}
```

### 10. Cloud Run service
```hcl
resource "google_cloud_run_v2_service" "app" {
  name     = "my-app"
  location = "us-central1"

  template {
    containers {
      image = "gcr.io/cloudrun/hello"
    }
  }
}
```

### 11. Targeting a single resource
```bash
terraform apply -target=google_storage_bucket.my_bucket
terraform destroy -target=google_compute_instance.vm
```

### 12. Resource address syntax
```bash
# <resource_type>.<local_name>
google_compute_instance.vm
google_storage_bucket.my_bucket
module.networking.google_compute_network.vpc
```

---

## Intermediate

### 13. Resource with lifecycle block
```hcl
resource "google_storage_bucket" "protected" {
  name     = "protected-bucket"
  location = "US"

  lifecycle {
    prevent_destroy = true
  }
}
```

### 14. Resource with ignore_changes
```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
  }

  lifecycle {
    ignore_changes = [metadata, labels]
  }
}
```

### 15. Resource with depends_on
```hcl
resource "google_project_service" "apis" {
  service = "compute.googleapis.com"
}

resource "google_compute_network" "vpc" {
  name       = "my-vpc"
  depends_on = [google_project_service.apis]
}
```

### 16. Resource with count
```hcl
resource "google_compute_instance" "vm" {
  count        = 3
  name         = "vm-${count.index}"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }
}
```

### 17. Resource with for_each (map)
```hcl
resource "google_storage_bucket" "buckets" {
  for_each = {
    logs    = "US"
    backups = "EU"
  }

  name     = "my-${each.key}-bucket"
  location = each.value
}
```

### 18. Resource with for_each (set)
```hcl
resource "google_project_service" "enabled" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "cloudsql.googleapis.com",
  ])
  service = each.value
}
```

### 19. Timeouts block
```hcl
resource "google_sql_database_instance" "db" {
  name             = "my-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings { tier = "db-f1-micro" }

  timeouts {
    create = "30m"
    update = "20m"
    delete = "20m"
  }
}
```

### 20. create_before_destroy lifecycle
```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }

  lifecycle {
    create_before_destroy = true
  }
}
```

### 21. Referencing resource attributes
```hcl
resource "google_compute_network" "vpc" {
  name = "my-vpc"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "my-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.self_link  # cross-reference
}
```

### 22. Resource with provisioner (use sparingly)
```hcl
resource "google_compute_instance" "vm" {
  name         = "bootstrapped-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }

  provisioner "local-exec" {
    command = "echo ${self.network_interface[0].access_config[0].nat_ip} >> known_hosts.txt"
  }
}
```

### 23. GKE cluster resource
```hcl
resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

### 24. IAM binding resource
```hcl
resource "google_project_iam_binding" "viewer" {
  project = "my-gcp-project"
  role    = "roles/viewer"

  members = [
    "serviceAccount:${google_service_account.sa.email}",
  ]
}
```

### 25. Enabling a GCP API via resource
```hcl
resource "google_project_service" "storage" {
  project                    = "my-gcp-project"
  service                    = "storage.googleapis.com"
  disable_dependent_services = true
  disable_on_destroy         = false
}
```

---

## Nested

### 26. Nested block: boot_disk with initialize_params
```hcl
resource "google_compute_instance" "vm" {
  name         = "nested-vm"
  machine_type = "e2-standard-2"
  zone         = "us-central1-a"

  boot_disk {
    auto_delete = true
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 50
      type  = "pd-ssd"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    access_config {}  # Ephemeral public IP
  }
}
```

### 27. Nested logging config on GCS bucket
```hcl
resource "google_storage_bucket" "with_logging" {
  name     = "app-data-bucket"
  location = "US"

  logging {
    log_bucket        = google_storage_bucket.logs.name
    log_object_prefix = "app-data/"
  }

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}
```

### 28. Cloud SQL with nested settings
```hcl
resource "google_sql_database_instance" "postgres" {
  name             = "prod-postgres"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL"
    disk_size         = 100
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_client_address   = false
    }
  }
}
```

### 29. GKE node pool with nested autoscaling
```hcl
resource "google_container_node_pool" "nodes" {
  name       = "main-pool"
  cluster    = google_container_cluster.gke.name
  location   = "us-central1"

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = {
      env = "production"
    }

    taint {
      key    = "dedicated"
      value  = "gpu"
      effect = "NO_SCHEDULE"
    }
  }
}
```

### 30. VPC with nested secondary ranges
```hcl
resource "google_compute_subnetwork" "gke_subnet" {
  name          = "gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }

  private_ip_google_access = true
}
```

### 31. Cloud Run with nested VPC access and env vars
```hcl
resource "google_cloud_run_v2_service" "api" {
  name     = "my-api"
  location = "us-central1"

  template {
    service_account = google_service_account.sa.email

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "gcr.io/my-project/my-api:latest"

      env {
        name  = "DB_HOST"
        value = google_sql_database_instance.db.private_ip_address
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}
```

### 32. Firewall with multiple nested allow blocks
```hcl
resource "google_compute_firewall" "internal" {
  name    = "allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
  priority      = 1000
}
```

### 33. Load balancer backend service with nested health check
```hcl
resource "google_compute_health_check" "http" {
  name = "http-health-check"

  http_health_check {
    port         = 80
    request_path = "/health"
  }
}

resource "google_compute_backend_service" "backend" {
  name          = "my-backend"
  health_checks = [google_compute_health_check.http.id]

  backend {
    group           = google_compute_instance_group_manager.igm.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}
```

### 34. replace_triggered_by lifecycle hook
```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  metadata = {
    startup-script = file("startup.sh")
  }

  boot_disk {
    initialize_params { image = "debian-cloud/debian-11" }
  }
  network_interface { network = "default" }

  lifecycle {
    replace_triggered_by = [
      google_compute_network.vpc.id
    ]
  }
}
```

---

## Advanced

### 35. Resource with precondition (Terraform 1.2+)
```hcl
resource "google_storage_bucket" "validated" {
  name     = var.bucket_name
  location = var.bucket_location

  lifecycle {
    precondition {
      condition     = length(var.bucket_name) <= 63
      error_message = "GCS bucket names must be 63 characters or fewer."
    }
  }
}
```

### 36. Resource with postcondition
```hcl
resource "google_sql_database_instance" "db" {
  name             = "prod-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings { tier = "db-custom-2-7680" }

  lifecycle {
    postcondition {
      condition     = self.settings[0].availability_type == "REGIONAL"
      error_message = "Production DB must use REGIONAL availability."
    }
  }
}
```

### 37. Dynamic resource creation with for_each and complex map
```hcl
variable "vms" {
  type = map(object({
    machine_type = string
    zone         = string
    disk_size    = number
  }))
}

resource "google_compute_instance" "fleet" {
  for_each     = var.vms
  name         = each.key
  machine_type = each.value.machine_type
  zone         = each.value.zone

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size  = each.value.disk_size
    }
  }
  network_interface { network = "default" }
}
```

### 38. Importing existing GCP resources
```bash
terraform import google_storage_bucket.my_bucket my-existing-bucket
terraform import google_compute_instance.vm projects/my-project/zones/us-central1-a/instances/my-vm
```

### 39. Moved block for resource refactoring
```hcl
moved {
  from = google_compute_instance.old_name
  to   = google_compute_instance.new_name
}
```

### 40. Resource graph visualization
```bash
terraform graph | dot -Tsvg > graph.svg
terraform graph -type=plan | dot -Tsvg > plan-graph.svg
```

### 41. Sensitive resource output protection
```hcl
resource "google_sql_user" "db_user" {
  name     = "app-user"
  instance = google_sql_database_instance.db.name
  password = random_password.db_pass.result
}

output "db_password" {
  value     = google_sql_user.db_user.password
  sensitive = true
}
```

### 42. google_project_iam_member vs binding
```hcl
# member: additive, won't remove other bindings
resource "google_project_iam_member" "sa_editor" {
  project = "my-project"
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.sa.email}"
}

# binding: authoritative for the role — REMOVES other members
resource "google_project_iam_binding" "owners" {
  project = "my-project"
  role    = "roles/owner"
  members = ["user:admin@example.com"]
}
```

### 43. Custom role resource
```hcl
resource "google_project_iam_custom_role" "custom" {
  role_id     = "customDeployer"
  title       = "Custom Deployer"
  description = "Can deploy Cloud Run services only"
  permissions = [
    "run.services.create",
    "run.services.update",
    "run.services.get",
  ]
}
```

### 44. Random suffix for unique GCS bucket names
```hcl
resource "random_id" "suffix" {
  byte_length = 4
}

resource "google_storage_bucket" "unique" {
  name     = "my-app-${random_id.suffix.hex}"
  location = "US"
}
```

### 45. Null resource for triggering scripts
```hcl
resource "null_resource" "migrate_db" {
  triggers = {
    db_instance = google_sql_database_instance.db.id
  }

  provisioner "local-exec" {
    command = "python scripts/migrate.py --host ${google_sql_database_instance.db.public_ip_address}"
  }

  depends_on = [google_sql_database_instance.db]
}
```

### 46. terraform_data resource (modern alternative to null_resource)
```hcl
resource "terraform_data" "bootstrap" {
  triggers_replace = [google_compute_instance.vm.id]

  provisioner "local-exec" {
    command = "ansible-playbook -i ${self.triggers_replace[0]} playbook.yml"
  }
}
```

### 47. Resource with multiple IAM conditions
```hcl
resource "google_storage_bucket_iam_member" "conditional" {
  bucket = google_storage_bucket.my_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.sa.email}"

  condition {
    title       = "expires_after_2025"
    description = "Expiring access"
    expression  = "request.time < timestamp(\"2026-01-01T00:00:00Z\")"
  }
}
```

### 48. Ephemeral resource (Terraform 1.10+)
```hcl
ephemeral "google_service_account_key" "temp_key" {
  service_account_id = google_service_account.sa.id
}
```

### 49. Resource state manipulation commands
```bash
terraform state list                                    # list all resources in state
terraform state show google_storage_bucket.my_bucket   # show resource details
terraform state rm google_compute_instance.old_vm      # remove from state without destroying
terraform state mv google_storage_bucket.old google_storage_bucket.new  # rename in state
```

### 50. Full production VM with all blocks
```hcl
resource "google_compute_instance" "production" {
  name         = "prod-app-${var.environment}"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    team        = "platform"
  }

  boot_disk {
    auto_delete = true
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 100
      type  = "pd-ssd"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
  }

  service_account {
    email  = google_service_account.sa.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    enable-oslogin = "TRUE"
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [metadata["ssh-keys"]]
    prevent_destroy       = false
  }

  timeouts {
    create = "10m"
    update = "10m"
    delete = "10m"
  }
}
```
