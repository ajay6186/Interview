# Examples 1.2 — Resources & Blocks (GCP) (50 examples)

> **Topic Overview:** GCP resources in Terraform follow the `google_<service>_<resource>` naming convention. Core GCP concepts to understand: resources belong to **projects** (not accounts), have **labels** (not tags), and use **self_link** or **id** for cross-resource references. IAM has three resource types: `_iam_member` (additive), `_iam_binding` (authoritative per role), and `_iam_policy` (fully authoritative). Enable APIs via `google_project_service` before creating resources that depend on them. Lifecycle meta-arguments (`prevent_destroy`, `ignore_changes`, `create_before_destroy`) work identically to AWS.

---

## Basic

### 1. Simple GCS bucket resource

> The simplest GCS bucket requires only a globally unique `name` and a `location`. GCS bucket names are globally unique across all GCP customers — use project ID, random suffix, or team-specific prefixes. `location` can be a multi-region (`US`, `EU`, `ASIA`), dual-region, or specific region (`us-central1`). Multi-region locations provide higher availability but at higher cost.

```hcl
resource "google_storage_bucket" "my_bucket" {
  name     = "my-unique-bucket-name"
  location = "US"
}
```

### 2. Compute Engine VM instance

> A minimal Compute Engine instance requires `name`, `machine_type`, `zone`, `boot_disk`, and `network_interface`. The `boot_disk.initialize_params.image` references a GCP image family (`debian-cloud/debian-11` automatically uses the latest Debian 11 image). The `network_interface` with no `access_config` creates a private-only instance; adding `access_config {}` assigns an ephemeral public IP.

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

> In GCP, `google_compute_network` creates a VPC. `auto_create_subnetworks = false` creates a "custom mode" VPC — you control subnet creation. `auto_create_subnetworks = true` creates an "auto mode" VPC with pre-made subnets in every region. Always use `false` for production — auto-mode subnets use fixed CIDR ranges that may conflict with on-premise networks or VPN configurations.

```hcl
resource "google_compute_network" "vpc" {
  name                    = "my-vpc"
  auto_create_subnetworks = false
}
```

### 4. Subnet resource

> GCP subnets are regional (not zonal). `ip_cidr_range` defines the primary CIDR. Referencing `google_compute_network.vpc.id` creates an implicit dependency — Terraform creates the VPC before the subnet. Unlike AWS, GCP subnets require you to specify the `region` even if the provider has a default region — this is a common mistake that causes plan errors.

```hcl
resource "google_compute_subnetwork" "subnet" {
  name          = "my-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.id
}
```

### 5. Cloud SQL instance

> Cloud SQL requires a globally unique `name` within the project. `database_version` specifies the engine (`POSTGRES_15`, `MYSQL_8_0`, `SQLSERVER_2019_STANDARD`). The `settings.tier` specifies the machine type — `db-f1-micro` is the smallest (for dev), `db-custom-<cpus>-<memory_mb>` for production sizing. Cloud SQL creation takes 5-10 minutes, so set appropriate `timeouts`.

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

> `google_service_account` creates a GCP service account. `account_id` becomes the `<account_id>@<project>.iam.gserviceaccount.com` email. Service accounts are identity principals — you attach IAM roles to them, and resources (VMs, Cloud Run services, etc.) use them for API calls. Keep `account_id` descriptive: `app-backend`, `ci-deployer`, `gke-node` indicate purpose.

```hcl
resource "google_service_account" "sa" {
  account_id   = "my-service-account"
  display_name = "My Service Account"
}
```

### 7. terraform plan and apply

> The standard Terraform workflow: `plan` previews changes (shows add/change/destroy counts), `apply` creates/modifies infrastructure (prompts for confirmation), `destroy` removes all managed resources. In CI/CD, use `terraform plan -out=tfplan && terraform apply tfplan` to ensure apply runs exactly the reviewed plan.

```bash
terraform plan    # preview changes
terraform apply   # apply changes
terraform destroy # destroy all resources
```

### 8. Resource with labels

> GCP uses `labels` (not AWS "tags") for resource categorization. Labels are key-value pairs with restrictions: lowercase, alphanumeric and hyphens, max 64 chars. Labels are used for cost allocation in GCP billing reports, for filtering resources in the console, and for automated policy enforcement. Always include `environment` and `team` labels at minimum.

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

> GCP firewalls are at the VPC level, not the instance level (unlike AWS security groups). `source_ranges` specifies allowed source CIDRs. To restrict by service account or network tag, use `source_service_accounts` or `source_tags` instead. Note: opening `0.0.0.0/0` to ports 80/443 is appropriate for public load balancers; individual VMs should use more restrictive source ranges.

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

> `google_cloud_run_v2_service` (V2 API) is the modern Cloud Run resource. The `template` block defines the container configuration. `location` is required (Cloud Run is regional). Cloud Run automatically scales to zero by default. The `containers.image` must be a full image reference accessible by the Cloud Run service account — typically in Artifact Registry or GCR.

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

> `-target` limits plan/apply to a specific resource and its dependencies. Useful for debugging or making surgical changes. GCP resource addresses use the same format as AWS: `<resource_type>.<local_name>`. Warning: using `-target` in normal workflows leads to state drift — it should only be used for emergencies or incremental deployments during troubleshooting.

```bash
terraform apply -target=google_storage_bucket.my_bucket
terraform destroy -target=google_compute_instance.vm
```

### 12. Resource address syntax

> Terraform resource addresses follow `<resource_type>.<local_name>`. Module resources are prefixed with `module.<module_name>`. These addresses are used in `terraform state` commands, `-target` flags, `moved` blocks, and import blocks. The local name (after the dot) is the HCL identifier — it's only meaningful within the Terraform configuration, not in GCP itself.

```bash
# <resource_type>.<local_name>
google_compute_instance.vm
google_storage_bucket.my_bucket
module.networking.google_compute_network.vpc
```

---

## Intermediate

### 13. Resource with lifecycle block

> `prevent_destroy = true` on a GCS bucket prevents `terraform destroy` from deleting it. Essential for production data buckets, audit log buckets, and any resource that takes significant time or data to recreate. To actually delete a protected resource, you must remove `prevent_destroy` from the code, `apply`, then destroy — the two-step prevents accidents.

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

> `ignore_changes = [metadata, labels]` tells Terraform to ignore changes to VM metadata and labels after initial creation. Use this when external systems (like GKE node management, OS Login, or an instance configuration tool) modify these fields — without `ignore_changes`, Terraform would attempt to revert the external changes on every `apply`. Be specific: `ignore_changes = all` is a code smell.

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

> GCP APIs must be enabled before creating resources that use them. `google_project_service` enables the Compute API; `depends_on = [google_project_service.apis]` ensures the API is enabled before the VPC is created. Without this explicit dependency, Terraform might try to create the VPC before the API is fully activated, causing a "API not enabled" error. Always enable APIs first in greenfield projects.

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

> `count = 3` creates three VM instances indexed 0, 1, 2. Use `count.index` to differentiate them — here for naming (`vm-0`, `vm-1`, `vm-2`). All instances are identical except for the index. If you later need to remove `vm-1` (the middle instance), indices shift: Terraform would destroy `vm-1` and `vm-2` and recreate the new `vm-1`. Use `for_each` with a map for stable, renameable instances.

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

> `for_each` with a map creates one resource per map entry with stable keys. `each.key` is the key (`"logs"`, `"backups"`), `each.value` is the value (`"US"`, `"EU"`). This creates two buckets: `my-logs-bucket` in US and `my-backups-bucket` in EU. Adding or removing a key only affects that specific bucket — other buckets are untouched.

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

> `toset([...])` converts a list to a set for use with `for_each`. This is the canonical pattern for enabling multiple GCP APIs: each API gets its own `google_project_service` resource, keyed by the API name. Adding a new API only requires adding it to the list — all existing APIs are unaffected. The `for_each` key is `each.value` (same as `each.key` for sets).

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

> GCP resources like Cloud SQL instances can take 15-30 minutes to create. The default Terraform timeout may be too short, causing the apply to time out even though GCP is still provisioning. Set generous timeouts for Cloud SQL (`30m create`), GKE clusters (`45m create`), and other long-running resources. The operation continues in GCP even after Terraform times out — you'll need to reconcile state manually.

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

> `create_before_destroy = true` creates the new VM before destroying the old one during updates that require replacement (e.g., changing the machine type). This prevents downtime gaps. Note: if the resource name must be unique (like a GCS bucket), you'll need to use `random_id` or a timestamp in the name, since the old resource still exists during the new one's creation.

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

> Cross-referencing resources creates implicit dependencies. `google_compute_network.vpc.self_link` (the canonical URL of the VPC, e.g., `https://www.googleapis.com/compute/v1/projects/.../networks/my-vpc`) is used instead of `.id` for some GCP resources that require full resource URLs. When unsure whether to use `id` or `self_link`, check the resource's documentation — some attributes only accept one form.

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

> `local-exec` runs a command on the machine running Terraform after the resource is created. Provisioners are a last resort — they make Terraform non-idempotent and can fail in CI environments. Here it appends the VM's public IP to a local file. Prefer startup scripts, Cloud Init, or Ansible with inventory plugins over Terraform provisioners for VM configuration.

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

> `remove_default_node_pool = true` with `initial_node_count = 1` is the standard GKE pattern: create the cluster (which requires an initial node pool), then immediately delete the default pool and manage node pools separately via `google_container_node_pool`. This gives you full control over node pool configuration (machine type, autoscaling, taints, labels) without fighting the default pool.

```hcl
resource "google_container_cluster" "gke" {
  name     = "my-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

### 24. IAM binding resource

> `google_project_iam_binding` is **authoritative for the role** — it sets exactly who has the role in the project. If another team member manually grants `roles/viewer` to someone else, the next `terraform apply` removes them. Use `google_project_iam_member` (additive) if you don't want Terraform to control all members of a role. The `members` list uses the format `serviceAccount:email`, `user:email`, or `group:email`.

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

> Most GCP services require explicit API enablement before use. `google_project_service` enables APIs. `disable_dependent_services = true` also disables APIs that depend on this one when you destroy it. `disable_on_destroy = false` (recommended) prevents destroying the resource from disabling the API — useful when other non-Terraform resources use the same API. Always include this resource for new projects.

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

> A fully-configured boot disk with nested blocks: `auto_delete = true` (delete the boot disk when the VM is deleted — usually desired), `size = 50` (GB), `type = "pd-ssd"` (SSD for better performance). The `access_config {}` inside `network_interface` with no arguments requests an ephemeral external IP. Remove `access_config {}` entirely for private-only instances.

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

> A production GCS bucket with three nested block configurations: `logging` (sends access logs to another bucket), `versioning` (keeps previous object versions for recovery), and `lifecycle_rule` (auto-deletes objects older than 90 days). This combination is standard for compliance workloads: versioning + lifecycle prevents both accidental deletion and unbounded storage growth.

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

> A production Cloud SQL PostgreSQL instance with deeply nested settings blocks: `availability_type = "REGIONAL"` for HA (creates a standby in another zone), `backup_configuration` with PITR enabled, `maintenance_window` for scheduled updates, and `insights_config` for query performance analysis. The tier `db-custom-2-7680` means 2 vCPUs and 7680 MB RAM — custom sizing for production.

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

> A GKE node pool with autoscaling, node configuration, and a taint. `autoscaling` block enables cluster autoscaler between 1-10 nodes. `oauth_scopes = ["cloud-platform"]` grants the node's service account all GCP API access (filtered by IAM roles). The `taint` marks nodes so only pods with a matching toleration can schedule there — used for dedicated GPU or high-memory node pools.

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

> GKE requires secondary IP ranges for Pods and Services — native VPC-native networking. The `secondary_ip_range` blocks define these ranges: `pods` gets a `/16` (65,536 IPs for pod capacity), `services` gets a `/20` (4,096 IPs). `private_ip_google_access = true` allows VMs in this subnet to reach Google APIs without a public IP — required for private GKE nodes to pull from Artifact Registry.

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

> A production Cloud Run service with VPC connectivity and environment configuration. `vpc_access.connector` routes egress to private VPC resources (like Cloud SQL private IP). `egress = "PRIVATE_RANGES_ONLY"` only routes RFC 1918 traffic through the VPC connector — public traffic exits directly. Environment variables inject the database host, and `resources.limits` cap CPU/memory to control costs.

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

> Multiple `allow` blocks in one firewall rule handle different protocols. This internal firewall allows all TCP, UDP, and ICMP traffic from `10.0.0.0/8` (all RFC 1918 private ranges). For GCP internal communication within the VPC, this is typical. The `priority = 1000` is the default — lower numbers are evaluated first. Deny rules require `deny {}` blocks instead of `allow {}`.

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

> GCP HTTP(S) load balancing requires a chain of resources: health check → backend service → URL map → target HTTP(S) proxy → forwarding rule. Here the backend service references the health check by ID and the instance group manager's group URL. `log_config.sample_rate = 1.0` logs 100% of requests — reduce to 0.1 for high-traffic backends to control logging costs.

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

> `replace_triggered_by` forces VM replacement when the referenced resource's ID changes. This is useful when changing the VPC means the VM's network configuration is no longer valid — rather than leaving the VM running on the old network, Terraform replaces it automatically. The resource in `replace_triggered_by` must be a managed resource, not a data source.

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

> GCS bucket names have a hard limit of 63 characters. A `precondition` validates this before Terraform attempts to create the bucket — catching the error at plan time with a clear message rather than getting an opaque GCP API error during apply. Preconditions can reference any attribute known at plan time, including `var.*`, `data.*`, and `local.*` values.

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

> A `postcondition` runs after resource creation and verifies the result meets expectations. Here it ensures the Cloud SQL instance was created with `REGIONAL` availability type (not `ZONAL`). This catches cases where Terraform created the resource but GCP defaulted to a less-available configuration. Postconditions can reference `self.*` attributes of the just-created resource.

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

> A typed `map(object(...))` variable drives dynamic VM creation. Each VM gets its own `machine_type`, `zone`, and `disk_size`. `for_each = var.vms` uses the map key as the stable resource identifier. Adding a new VM to the map creates it; removing one destroys it; modifying `machine_type` for one recreates only that VM. This is the standard pattern for managing fleets of VM instances.

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

> Import syntax differs by resource type. GCS buckets use just the bucket name. Compute instances require the full resource path (`projects/<project>/zones/<zone>/instances/<name>`). After import, run `terraform plan` to verify no unintended changes — the imported resource's current state may differ from your HCL config, requiring updates.

```bash
terraform import google_storage_bucket.my_bucket my-existing-bucket
terraform import google_compute_instance.vm projects/my-project/zones/us-central1-a/instances/my-vm
```

### 39. Moved block for resource refactoring

> When refactoring GCP resources — renaming, moving into modules, changing from `count` to `for_each` — use `moved` blocks to update state addresses without destroying and recreating resources. This is equivalent to `terraform state mv` but declarative and version-controllable. Remove the `moved` block after all environments have been updated.

```hcl
moved {
  from = google_compute_instance.old_name
  to   = google_compute_instance.new_name
}
```

### 40. Resource graph visualization

> `terraform graph` outputs the resource dependency graph in DOT format. Piping to `dot` (from Graphviz) renders it as SVG. The plan graph (`-type=plan`) shows only resources that will change in the current plan — more useful than the full graph for large configurations. Use this to debug unexpected dependencies or verify your configuration structure before a complex apply.

```bash
terraform graph | dot -Tsvg > graph.svg
terraform graph -type=plan | dot -Tsvg > plan-graph.svg
```

### 41. Sensitive resource output protection

> Cloud SQL user passwords should always be marked sensitive. `random_password.db_pass.result` generates a secure random password. The `output` with `sensitive = true` hides it from terminal output but stores it in state. To retrieve it: `terraform output -raw db_password`. For production, consider writing the password directly to Secret Manager using `google_secret_manager_secret_version` instead.

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

> The three GCP IAM resource types have different authoritative scope: `_iam_member` is additive (adds a member without removing others), `_iam_binding` is authoritative per role (controls all members for one role), `_iam_policy` is fully authoritative (controls all roles and members). Use `_iam_member` for most cases to avoid conflicts with other Terraform configurations or manual IAM assignments. Use `_iam_binding` when you need to enforce "only these principals have this role."

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

> `google_project_iam_custom_role` creates a custom IAM role with specific permissions. This follows the principle of least privilege — instead of granting `roles/run.admin` (which includes deletion rights), grant only the permissions the deployer needs. Custom roles can be scoped to the project or organization level. The `role_id` becomes part of `projects/<project>/roles/customDeployer`.

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

> GCS bucket names are globally unique — `my-app-bucket` is taken by someone. Using `random_id` with `byte_length = 4` appends an 8-character hex string (e.g., `my-app-a1b2c3d4`). The random ID is stable after creation — it's stored in state and won't change on subsequent applies. This is the standard solution for globally-unique GCP resource names.

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

> `null_resource` with `triggers` runs `local-exec` when the trigger value changes. Here the trigger is the Cloud SQL instance ID — if the DB instance is replaced, the migration script runs again. This pattern is useful for database migrations, post-deployment verification scripts, or any side effect that Terraform can't model as a resource. Prefer `terraform_data` (example 46) for new code.

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

> `terraform_data` (Terraform 1.4+) replaces `null_resource`. It doesn't require the `null` provider and has cleaner trigger semantics: `triggers_replace` is a list of values that cause replacement when changed. When the VM is replaced (new ID), `triggers_replace` changes, `terraform_data` is replaced, and the provisioner re-runs. Prefer this over `null_resource` in all new configurations.

```hcl
resource "terraform_data" "bootstrap" {
  triggers_replace = [google_compute_instance.vm.id]

  provisioner "local-exec" {
    command = "ansible-playbook -i ${self.triggers_replace[0]} playbook.yml"
  }
}
```

### 47. Resource with multiple IAM conditions

> IAM conditions (`condition` block) provide time-bound or attribute-based access control. This grants `storage.objectViewer` to a service account only until 2026-01-01. After expiry, the condition evaluates to false and access is denied automatically — useful for granting temporary access during migrations or audits without having to remember to revoke manually. Conditions use Common Expression Language (CEL).

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

> `ephemeral` resources (Terraform 1.10+) are like data sources but their values are never stored in state. A service account key generated as an ephemeral resource exists only in memory during the apply — it's used to configure other resources (like the Kubernetes provider) and then discarded. This prevents sensitive credentials from persisting in state files. Currently supported for specific providers.

```hcl
ephemeral "google_service_account_key" "temp_key" {
  service_account_id = google_service_account.sa.id
}
```

### 49. Resource state manipulation commands

> GCP-specific state manipulation patterns: `state list` to audit what Terraform manages, `state show google_storage_bucket.my_bucket` to inspect all stored attributes (including computed ones like `url` and `self_link`), `state rm` to stop managing a resource without deleting it from GCP, and `state mv` to rename resources in state without touching GCP. Always run `plan` after any state manipulation.

```bash
terraform state list                                    # list all resources in state
terraform state show google_storage_bucket.my_bucket   # show resource details
terraform state rm google_compute_instance.old_vm      # remove from state without destroying
terraform state mv google_storage_bucket.old google_storage_bucket.new  # rename in state
```

### 50. Full production VM with all blocks

> The production-hardened Compute Engine instance uses all security best practices: OS Login (`enable-oslogin = "TRUE"` replaces SSH key management with IAM), Shielded VM (`enable_secure_boot`, vTPM, integrity monitoring prevent firmware/boot attacks), SSD boot disk for performance, a dedicated service account, and `create_before_destroy` for zero-downtime updates. `ignore_changes = [metadata["ssh-keys"]]` prevents Terraform from reverting SSH keys added by OS Login.

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

---

## Key Takeaways

- **GCP resource naming**: `google_<service>_<resource>` — `google_compute_instance`, `google_storage_bucket`, `google_sql_database_instance`
- **Labels vs Tags**: GCP uses `labels` (not `tags`); lowercase, alphanumeric+hyphens, max 64 chars; used for billing, filtering, and policy enforcement
- **`id` vs `self_link`**: some GCP resources require the full resource URL (`self_link`); use `id` for most references, check docs when getting "invalid reference" errors
- **API enablement**: always create `google_project_service` resources first; add `depends_on` to resources that need the API
- **IAM resource types**: `_iam_member` (additive), `_iam_binding` (authoritative per role), `_iam_policy` (fully authoritative) — use `_iam_member` by default to avoid conflicts
- **GKE pattern**: `remove_default_node_pool = true` + `google_container_node_pool` separate resource gives full node pool control
- **GCS global uniqueness**: use `random_id` suffix or project-ID prefix for globally unique bucket names
- **`private_ip_google_access = true`** on subnets is required for private VM/GKE access to Google APIs without external IPs
- **Shielded VMs**: enable `enable_secure_boot`, `enable_vtpm`, and `enable_integrity_monitoring` for production security hardening
- **`ephemeral` resources** (Terraform 1.10+) prevent sensitive values (like SA keys) from being stored in state — use for short-lived credentials

---

## Common Interview Questions & Answers

**Q: What is the difference between `google_project_iam_member`, `google_project_iam_binding`, and `google_project_iam_policy`?**
A: Three levels of IAM authority: `_iam_member` is additive — it grants a role to one principal without affecting other bindings for that role; safe to use alongside manual IAM. `_iam_binding` is authoritative for a specific role — it sets exactly who has that role; any members not in the list are removed on next apply. `_iam_policy` is fully authoritative — it replaces the entire IAM policy on the resource; any roles/members not listed are removed. Use `_iam_member` for most cases, `_iam_binding` when you need to enforce membership for a specific role, and `_iam_policy` only when you need complete IAM control.

**Q: Why is `remove_default_node_pool = true` the standard pattern for GKE clusters?**
A: GKE requires at least one node pool to create the cluster. If you specify your node pool configuration directly in `google_container_cluster`, you lose flexibility — changes to node configuration may require cluster recreation. The standard pattern creates the cluster with `remove_default_node_pool = true; initial_node_count = 1`, then immediately deletes the default pool, then manages separate `google_container_node_pool` resources. This gives you full control over node pool configuration (autoscaling, machine type, taints, labels) as independent resources that can be updated without cluster recreation.

**Q: How do you handle Cloud SQL creation which can take 15-30 minutes?**
A: Add a `timeouts` block with generous durations: `create = "30m"`, `update = "20m"`, `delete = "20m"`. Without this, Terraform may time out while GCP is still provisioning the instance. The operation continues in GCP even after Terraform times out, leaving state in an inconsistent condition. Also, use `depends_on = [google_project_service.sqladmin_api]` to ensure the Cloud SQL API is enabled before attempting to create the instance, which is a common cause of seemingly random Cloud SQL failures in greenfield projects.

**Q: What is `private_ip_google_access` on a GCP subnet and when do you need it?**
A: `private_ip_google_access = true` allows VMs and GKE nodes in a subnet without external IPs to reach Google APIs (Cloud Storage, Cloud SQL proxy, Artifact Registry, Secret Manager, etc.) via Google's internal network. Without it, private VMs can't pull container images from Artifact Registry, read from GCS, or connect to Secret Manager — common causes of "connection refused" errors in private GKE clusters. Always enable it for subnets hosting private GKE nodes or VMs that need to access GCP services.

**Q: How does GCP IAM differ from AWS IAM in a Terraform context?**
A: Key differences: (1) GCP IAM resources are project/resource-scoped via `project` attribute; AWS IAM is account-global. (2) GCP uses predefined roles (`roles/storage.admin`), custom roles, and basic roles; AWS uses managed and inline policies. (3) GCP `google_project_iam_binding` is authoritative for a role (removes unlisted members); AWS `aws_iam_role_policy_attachment` is additive. (4) GCP service accounts are resources (`google_service_account`); AWS instance profiles are wrappers around IAM roles. (5) GCP IAM conditions use CEL expressions for time-bound/attribute-based access; AWS uses IAM policy conditions with operators.
