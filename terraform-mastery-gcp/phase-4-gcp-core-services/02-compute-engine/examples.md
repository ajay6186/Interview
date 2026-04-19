# Examples 4.2 — Compute Engine (GCP) (50 examples)

---

## Basic

### 1. Simple VM instance
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
    access_config {}   # Ephemeral public IP
  }
}
```

### 2. VM with custom disk size
```hcl
resource "google_compute_instance" "vm" {
  name         = "app-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 100
      type  = "pd-ssd"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
  }
}
```

### 3. Compute image data source
```hcl
data "google_compute_image" "ubuntu" {
  family  = "ubuntu-2204-lts"
  project = "ubuntu-os-cloud"
}

resource "google_compute_instance" "vm" {
  name         = "app-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
    }
  }
  network_interface { network = "default" }
}
```

### 4. VM with labels and metadata
```hcl
resource "google_compute_instance" "vm" {
  name         = "labeled-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  labels = {
    environment = "production"
    team        = "platform"
  }

  metadata = {
    enable-oslogin = "TRUE"
    startup-script = file("scripts/startup.sh")
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 5. VM with service account
```hcl
resource "google_compute_instance" "vm" {
  name         = "sa-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 6. Spot (preemptible) VM
```hcl
resource "google_compute_instance" "spot" {
  name         = "spot-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  scheduling {
    preemptible        = true
    automatic_restart  = false
    on_host_maintenance = "TERMINATE"
    spot               = true
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 7. terraform import a VM
```bash
terraform import google_compute_instance.vm \
  projects/my-project/zones/us-central1-a/instances/my-vm
```

### 8. VM with attached data disk
```hcl
resource "google_compute_disk" "data" {
  name = "data-disk"
  type = "pd-ssd"
  zone = "us-central1-a"
  size = 200
}

resource "google_compute_instance" "vm" {
  name         = "vm-with-data"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }

  attached_disk {
    source      = google_compute_disk.data.id
    device_name = "data-disk"
  }

  network_interface { network = "default" }
}
```

### 9. VM startup script
```hcl
resource "google_compute_instance" "web" {
  name         = "web-server"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  metadata = {
    startup-script = <<-EOT
      #!/bin/bash
      apt-get update
      apt-get install -y nginx
      systemctl start nginx
    EOT
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface {
    network = "default"
    access_config {}
  }
}
```

### 10. VM with network tag
```hcl
resource "google_compute_instance" "tagged" {
  name         = "web"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  tags         = ["web-server", "allow-http"]

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 11. Stop and start VM
```bash
gcloud compute instances stop my-vm --zone=us-central1-a
gcloud compute instances start my-vm --zone=us-central1-a
```

### 12. SSH into VM via IAP
```bash
gcloud compute ssh my-vm --zone=us-central1-a --tunnel-through-iap
```

---

## Intermediate

### 13. Instance template
```hcl
resource "google_compute_instance_template" "app" {
  name_prefix  = "app-template-"
  machine_type = "e2-standard-4"

  disk {
    source_image = "ubuntu-os-cloud/ubuntu-2204-lts"
    auto_delete  = true
    boot         = true
    disk_size_gb = 100
    disk_type    = "pd-ssd"
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
  }

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script = file("scripts/startup.sh")
  }

  labels = {
    environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### 14. Managed Instance Group (MIG) with autoscaling
```hcl
resource "google_compute_region_instance_group_manager" "igm" {
  name               = "app-igm"
  base_instance_name = "app"
  region             = "us-central1"

  version {
    instance_template = google_compute_instance_template.app.id
  }

  target_size = 3

  auto_healing_policies {
    health_check      = google_compute_health_check.http.id
    initial_delay_sec = 300
  }
}

resource "google_compute_region_autoscaler" "scaler" {
  name   = "app-autoscaler"
  region = "us-central1"
  target = google_compute_region_instance_group_manager.igm.id

  autoscaling_policy {
    max_replicas    = 20
    min_replicas    = 2
    cooldown_period = 60

    cpu_utilization {
      target = 0.6
    }
  }
}
```

### 15. Zonal MIG
```hcl
resource "google_compute_instance_group_manager" "zonal_igm" {
  name               = "zonal-app-igm"
  base_instance_name = "app"
  zone               = "us-central1-a"

  version {
    instance_template = google_compute_instance_template.app.id
  }

  target_size = 2
}
```

### 16. Compute health check
```hcl
resource "google_compute_health_check" "http" {
  name = "http-health-check"

  timeout_sec         = 5
  check_interval_sec  = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3

  http_health_check {
    port         = 80
    request_path = "/health"
  }
}
```

### 17. MIG rolling update
```hcl
resource "google_compute_region_instance_group_manager" "igm" {
  name               = "app-igm"
  base_instance_name = "app"
  region             = "us-central1"

  version {
    name              = "v2"
    instance_template = google_compute_instance_template.app_v2.id
  }

  update_policy {
    type                         = "PROACTIVE"
    minimal_action               = "REPLACE"
    max_surge_fixed              = 3
    max_unavailable_fixed        = 0
    replacement_method           = "SUBSTITUTE"
  }
}
```

### 18. Custom machine type
```hcl
resource "google_compute_instance" "custom" {
  name         = "custom-vm"
  machine_type = "custom-8-30720"   # 8 vCPUs, 30 GB RAM
  zone         = "us-central1-a"

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 19. Shielded VM
```hcl
resource "google_compute_instance" "shielded" {
  name         = "shielded-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }
  network_interface { network = "default" }
}
```

### 20. Confidential VM
```hcl
resource "google_compute_instance" "confidential" {
  name         = "confidential-vm"
  machine_type = "n2d-standard-4"   # AMD needed for confidential
  zone         = "us-central1-a"

  confidential_instance_config {
    enable_confidential_compute = true
  }

  scheduling {
    on_host_maintenance = "TERMINATE"
  }

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }
  network_interface { network = "default" }
}
```

### 21. Snapshot policy
```hcl
resource "google_compute_resource_policy" "snapshot" {
  name   = "daily-snapshot"
  region = "us-central1"

  snapshot_schedule_policy {
    schedule {
      daily_schedule {
        days_in_cycle = 1
        start_time    = "04:00"
      }
    }

    retention_policy {
      max_retention_days    = 14
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }
  }
}

resource "google_compute_disk_resource_policy_attachment" "attachment" {
  name = google_compute_resource_policy.snapshot.name
  disk = google_compute_disk.data.name
  zone = "us-central1-a"
}
```

### 22. VM with GPU
```hcl
resource "google_compute_instance" "gpu" {
  name         = "gpu-vm"
  machine_type = "n1-standard-4"
  zone         = "us-central1-c"

  guest_accelerator {
    type  = "nvidia-tesla-t4"
    count = 1
  }

  scheduling {
    on_host_maintenance = "TERMINATE"
  }

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size  = 100
    }
  }
  network_interface { network = "default" }
}
```

### 23. VM serial console access
```hcl
resource "google_compute_instance" "debug_vm" {
  name         = "debug-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  metadata = {
    serial-port-enable = "TRUE"
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 24. Persistent disk snapshot
```hcl
resource "google_compute_snapshot" "backup" {
  name        = "data-snapshot-${formatdate("YYYYMMDD", timestamp())}"
  source_disk = google_compute_disk.data.id
  zone        = "us-central1-a"

  labels = {
    environment = var.environment
  }
}
```

### 25. Instance group named port
```hcl
resource "google_compute_instance_group" "unmanaged" {
  name = "my-instances"
  zone = "us-central1-a"

  named_port {
    name = "http"
    port = "80"
  }

  instances = [
    google_compute_instance.vm[0].id,
    google_compute_instance.vm[1].id,
  ]
}
```

---

## Nested

### 26. MIG with canary deployment
```hcl
resource "google_compute_region_instance_group_manager" "igm" {
  name               = "app-igm"
  base_instance_name = "app"
  region             = "us-central1"

  version {
    name              = "stable"
    instance_template = google_compute_instance_template.stable.id
  }

  version {
    name              = "canary"
    instance_template = google_compute_instance_template.canary.id
    target_size {
      percent = 10   # 10% canary traffic
    }
  }

  target_size = 10
}
```

### 27. Multi-zone MIG with stateful disks
```hcl
resource "google_compute_region_instance_group_manager" "stateful" {
  name               = "stateful-igm"
  base_instance_name = "node"
  region             = "us-central1"
  distribution_policy_zones = ["us-central1-a", "us-central1-b", "us-central1-c"]

  version {
    instance_template = google_compute_instance_template.node.id
  }

  stateful_disk {
    device_name = "data"
    delete_rule = "ON_PERMANENT_INSTANCE_DELETION"
  }
}
```

### 28. Instance template with templatefile
```hcl
resource "google_compute_instance_template" "web" {
  name_prefix  = "web-"
  machine_type = "e2-standard-2"

  disk {
    source_image = data.google_compute_image.ubuntu.self_link
    auto_delete  = true
    boot         = true
  }

  metadata = {
    startup-script = templatefile("${path.module}/templates/startup.sh.tpl", {
      db_host      = google_sql_database_instance.db.private_ip_address
      redis_host   = google_redis_instance.cache.host
      environment  = var.environment
      project_id   = var.project_id
    })
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
  }

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  lifecycle { create_before_destroy = true }
}
```

### 29. Fleet of VMs across zones
```hcl
locals {
  zones = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

resource "google_compute_instance" "workers" {
  count        = 6
  name         = "worker-${count.index}"
  machine_type = "e2-standard-4"
  zone         = local.zones[count.index % length(local.zones)]

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }
  network_interface { subnetwork = google_compute_subnetwork.main.id }
}
```

### 30. VM with multiple network interfaces
```hcl
resource "google_compute_instance" "multi_nic" {
  name         = "multi-nic-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
    # Internal only, no access_config
  }

  network_interface {
    subnetwork = google_compute_subnetwork.dmz.id
    access_config {}   # Public IP on DMZ interface
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
}
```

### 31. Sole-tenant node
```hcl
resource "google_compute_node_template" "sole_tenant" {
  name      = "sole-tenant-template"
  region    = "us-central1"
  node_type = "n1-node-96-624"
}

resource "google_compute_node_group" "node_group" {
  name          = "sole-tenant-group"
  zone          = "us-central1-a"
  description   = "Sole-tenant node group"
  node_template = google_compute_node_template.sole_tenant.id
  initial_size  = 1
}

resource "google_compute_instance" "sole_tenant_vm" {
  name         = "sole-tenant-vm"
  machine_type = "n1-standard-4"
  zone         = "us-central1-a"

  scheduling {
    node_affinities {
      key      = "compute.googleapis.com/node-group-name"
      operator = "IN"
      values   = [google_compute_node_group.node_group.name]
    }
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 32. VM with startup script from Secret Manager
```hcl
data "google_secret_manager_secret_version" "startup" {
  secret = "vm-startup-script"
}

resource "google_compute_instance" "secure" {
  name         = "secure-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  metadata = {
    startup-script = data.google_secret_manager_secret_version.startup.secret_data
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { subnetwork = google_compute_subnetwork.main.id }
}
```

### 33. Instance group manager with auto-healing
```hcl
resource "google_compute_health_check" "tcp" {
  name = "tcp-health-check"
  tcp_health_check { port = 8080 }
}

resource "google_compute_region_instance_group_manager" "igm" {
  name               = "auto-healed-igm"
  base_instance_name = "app"
  region             = "us-central1"

  version {
    instance_template = google_compute_instance_template.app.id
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.tcp.id
    initial_delay_sec = 300
  }

  target_size = 3
}
```

### 34. Disk encryption with CMEK
```hcl
data "google_kms_key_ring" "ring" {
  name     = "my-key-ring"
  location = "us-central1"
}

data "google_kms_crypto_key" "key" {
  name     = "disk-encryption-key"
  key_ring = data.google_kms_key_ring.ring.id
}

resource "google_compute_disk" "encrypted" {
  name                      = "encrypted-data-disk"
  type                      = "pd-ssd"
  zone                      = "us-central1-a"
  size                      = 200
  disk_encryption_key {
    kms_key_self_link = data.google_kms_crypto_key.key.id
  }
}
```

---

## Advanced

### 35. Blue-green deployment via MIG versions
```bash
# Step 1: Deploy v2 as canary (10%)
# Update MIG to have v1 (90%) + v2 (10%)

# Step 2: Validate
# Run tests against canary instances

# Step 3: Full rollout
# Update v2 to 100%
terraform apply -var="canary_percent=100"

# Step 4: Remove v1
# Delete v1 version block from MIG config
```

### 36. Autoscaler with custom metric
```hcl
resource "google_compute_region_autoscaler" "custom" {
  name   = "custom-autoscaler"
  region = "us-central1"
  target = google_compute_region_instance_group_manager.igm.id

  autoscaling_policy {
    max_replicas    = 50
    min_replicas    = 2
    cooldown_period = 120

    metric {
      name                       = "custom.googleapis.com/queue/depth"
      single_instance_assignment = 100
      filter                     = "resource.type = \"global\""
    }
  }
}
```

### 37. Compute instance with Ops Agent via startup
```hcl
resource "google_compute_instance" "observed" {
  name         = "observed-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  metadata = {
    startup-script = <<-EOT
      curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
      bash add-google-cloud-ops-agent-repo.sh --also-install
    EOT
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { subnetwork = google_compute_subnetwork.main.id }
}
```

### 38. Rolling replacement with zero downtime
```hcl
resource "google_compute_region_instance_group_manager" "zero_downtime" {
  name               = "zero-downtime-igm"
  base_instance_name = "app"
  region             = "us-central1"

  version {
    instance_template = google_compute_instance_template.app.id
  }

  update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_surge_percent     = 100  # Double capacity during update
    max_unavailable_fixed = 0    # No downtime
    replacement_method    = "SUBSTITUTE"
  }

  target_size = 5
}
```

### 39. Committed Use Discounts (CUD)
```hcl
resource "google_compute_region_commitment" "commitment" {
  name     = "one-year-commitment"
  region   = "us-central1"
  plan     = "TWELVE_MONTH"

  resources {
    type   = "VCPU"
    amount = "100"
  }

  resources {
    type   = "MEMORY"
    amount = "400"    # GB
  }
}
```

### 40. Compute Engine + OS Config patch management
```hcl
resource "google_os_config_patch_deployment" "weekly" {
  patch_deployment_id = "weekly-patch"
  project             = var.project_id

  instance_filter {
    all = true
  }

  patch_config {
    apt { type = "UPGRADE" }
    reboot_config = "ALWAYS"
  }

  recurring_schedule {
    time_zone { id = "America/Chicago" }
    time_of_day { hours = 3; minutes = 0 }
    weekly { day_of_week = "SUNDAY" }
  }
}
```

### 41. Spot VM preemption handling
```hcl
resource "google_compute_instance" "spot_worker" {
  name         = "spot-worker"
  machine_type = "e2-standard-8"
  zone         = "us-central1-a"

  scheduling {
    spot               = true
    preemptible        = true
    automatic_restart  = false
    on_host_maintenance = "TERMINATE"

    instance_termination_action = "STOP"   # STOP instead of DELETE on preemption
  }

  metadata = {
    shutdown-script = file("scripts/preemption-handler.sh")
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { subnetwork = google_compute_subnetwork.main.id }
}
```

### 42. Bulk resize MIG
```bash
# Scale up quickly for load events:
gcloud compute instance-groups managed resize app-igm \
  --region=us-central1 \
  --size=50

# Scale back down:
gcloud compute instance-groups managed resize app-igm \
  --region=us-central1 \
  --size=5
```

### 43. VM with startup script and secret injection
```hcl
data "google_secret_manager_secret_version" "db_pass" {
  secret = "db-password"
}

resource "google_compute_instance" "app" {
  name         = "app-server"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  metadata = {
    startup-script = templatefile("${path.module}/startup.sh.tpl", {
      db_password = data.google_secret_manager_secret_version.db_pass.secret_data
      db_host     = google_sql_database_instance.db.private_ip_address
    })
  }

  service_account {
    email  = google_service_account.app_sa.email
    scopes = ["cloud-platform"]
  }

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }
  network_interface { subnetwork = google_compute_subnetwork.main.id }
}
```

### 44. Compute reservation
```hcl
resource "google_compute_reservation" "reservation" {
  name = "vm-reservation"
  zone = "us-central1-a"

  specific_reservation {
    count = 10
    instance_properties {
      machine_type = "e2-standard-4"

      guest_accelerators {
        accelerator_count = 0
        accelerator_type  = ""
      }
    }
  }
}
```

### 45. Private VM accessible only via IAP
```hcl
resource "google_compute_instance" "private_vm" {
  name         = "private-vm"
  machine_type = "e2-standard-4"
  zone         = "us-central1-a"

  # No access_config = no public IP
  network_interface {
    subnetwork = google_compute_subnetwork.private.id
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
}

resource "google_iap_tunnel_instance_iam_member" "admin" {
  instance = google_compute_instance.private_vm.name
  zone     = google_compute_instance.private_vm.zone
  role     = "roles/iap.tunnelResourceAccessor"
  member   = "user:admin@example.com"
}
```

### 46. Cross-region instance template
```hcl
resource "google_compute_instance_template" "global_app" {
  name_prefix  = "global-app-"
  machine_type = "e2-standard-4"

  disk {
    source_image = "ubuntu-os-cloud/ubuntu-2204-lts"
    auto_delete  = true
    boot         = true
  }

  network_interface {
    network = google_compute_network.vpc.id
    # Subnetwork determined at MIG creation time
  }

  lifecycle { create_before_destroy = true }
}

resource "google_compute_region_instance_group_manager" "us" {
  name     = "app-us"
  region   = "us-central1"
  base_instance_name = "app"
  version { instance_template = google_compute_instance_template.global_app.id }
  target_size = 3
}

resource "google_compute_region_instance_group_manager" "eu" {
  name     = "app-eu"
  region   = "europe-west1"
  base_instance_name = "app"
  version { instance_template = google_compute_instance_template.global_app.id }
  target_size = 2
}
```

### 47. Managed instance group + global load balancer
```hcl
resource "google_compute_backend_service" "app" {
  name                  = "app-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.http.id]
  protocol              = "HTTP"
  timeout_sec           = 30

  backend {
    group           = google_compute_region_instance_group_manager.us.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  backend {
    group           = google_compute_region_instance_group_manager.eu.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}
```

### 48. Node affinity for hardware-specific workloads
```hcl
resource "google_compute_instance" "memory_optimized" {
  name         = "memory-vm"
  machine_type = "m1-ultramem-40"
  zone         = "us-central1-f"   # Check zone availability for M1

  scheduling {
    on_host_maintenance = "TERMINATE"
  }

  boot_disk { initialize_params { image = "rhel-cloud/rhel-8" } }
  network_interface { network = "default" }
}
```

### 49. VM metrics and alerting via Terraform
```hcl
resource "google_monitoring_alert_policy" "vm_cpu" {
  display_name = "VM CPU High"
  combiner     = "OR"

  conditions {
    display_name = "CPU > 90%"
    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/instance/cpu/utilization\" AND resource.type=\"gce_instance\""
      threshold_value = 0.9
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [var.alert_channel_id]
}
```

### 50. Full production Compute Engine stack
```hcl
# Service Account
resource "google_service_account" "app_sa" {
  account_id   = "${var.env}-app-sa"
  display_name = "App VM Service Account"
}

resource "google_project_iam_member" "sa_roles" {
  for_each = toset(["roles/cloudsql.client", "roles/secretmanager.secretAccessor", "roles/storage.objectViewer"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.app_sa.email}"
}

# Instance Template
resource "google_compute_instance_template" "app" {
  name_prefix  = "${var.env}-app-"
  machine_type = var.machine_type
  region       = var.region

  disk {
    source_image = data.google_compute_image.ubuntu.self_link
    auto_delete  = true
    boot         = true
    disk_size_gb = 100
    disk_type    = "pd-ssd"
  }

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
  }

  service_account {
    email  = google_service_account.app_sa.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script = templatefile("${path.module}/startup.sh.tpl", {
      db_host = google_sql_database_instance.db.private_ip_address
      env     = var.env
    })
    enable-oslogin = "TRUE"
  }

  labels = { environment = var.env; managed_by = "terraform" }

  shielded_instance_config {
    enable_secure_boot = true
    enable_vtpm        = true
  }

  lifecycle { create_before_destroy = true }
}

# MIG
resource "google_compute_region_instance_group_manager" "app" {
  name               = "${var.env}-app-igm"
  base_instance_name = "app"
  region             = var.region

  version { instance_template = google_compute_instance_template.app.id }

  auto_healing_policies {
    health_check      = google_compute_health_check.http.id
    initial_delay_sec = 300
  }

  update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_surge_percent     = 50
    max_unavailable_fixed = 0
  }

  target_size = var.min_instances
}

# Autoscaler
resource "google_compute_region_autoscaler" "app" {
  name   = "${var.env}-autoscaler"
  region = var.region
  target = google_compute_region_instance_group_manager.app.id

  autoscaling_policy {
    max_replicas    = var.max_instances
    min_replicas    = var.min_instances
    cooldown_period = 120

    cpu_utilization { target = 0.6 }
  }
}
```
