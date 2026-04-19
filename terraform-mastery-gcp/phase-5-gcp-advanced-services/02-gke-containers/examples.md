# Examples 5.2 — GKE & Containers (GCP) (50 examples)

## Basic

**1. Minimal regional GKE cluster**
```hcl
resource "google_container_cluster" "primary" {
  name     = "primary-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name
}
```

**2. Separate node pool for the cluster**
```hcl
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-nodes"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
```

**3. Node pool with machine type and disk configuration**
```hcl
resource "google_container_node_pool" "compute_nodes" {
  name    = "compute-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_config {
    machine_type = "n2-standard-8"
    disk_size_gb = 200
    disk_type    = "pd-balanced"
    image_type   = "COS_CONTAINERD"

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
```

**4. Enable auto repair and auto upgrade**
```hcl
resource "google_container_node_pool" "managed_nodes" {
  name    = "managed-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_count = 2

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = "e2-standard-2"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**5. Node service account with minimal permissions**
```hcl
resource "google_service_account" "gke_node_sa" {
  account_id   = "gke-node-sa"
  display_name = "GKE Node Service Account"
}

resource "google_project_iam_member" "node_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_node_sa.email}"
}

resource "google_project_iam_member" "node_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_node_sa.email}"
}

resource "google_project_iam_member" "node_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.gke_node_sa.email}"
}

resource "google_container_node_pool" "sa_nodes" {
  name    = "sa-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_config {
    machine_type    = "e2-standard-2"
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**6. Set GKE release channel**
```hcl
resource "google_container_cluster" "stable_channel" {
  name     = "stable-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  release_channel {
    channel = "STABLE"
  }
}
```

**7. GKE cluster with logging and monitoring**
```hcl
resource "google_container_cluster" "observed" {
  name     = "observed-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "APISERVER", "SCHEDULER", "CONTROLLER_MANAGER"]
  }
}
```

**8. Node pool with specific node locations (zonal)**
```hcl
resource "google_container_node_pool" "zonal_nodes" {
  name     = "zonal-nodes"
  cluster  = google_container_cluster.primary.name
  location = "us-central1"

  node_locations = [
    "us-central1-a",
    "us-central1-b",
    "us-central1-c"
  ]

  node_count = 1

  node_config {
    machine_type = "e2-standard-2"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**9. GKE with IP alias (VPC-native) enabled**
```hcl
resource "google_container_cluster" "vpc_native" {
  name     = "vpc-native-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  networking_mode = "VPC_NATIVE"

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name
}
```

**10. Artifact Registry repository for container images**
```hcl
resource "google_artifact_registry_repository" "images" {
  location      = "us-central1"
  repository_id = "app-images"
  description   = "Docker images for GKE workloads"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-tagged"
    action = "KEEP"
    condition {
      tag_state    = "TAGGED"
      older_than   = "0s"
    }
  }
}
```

**11. Grant GKE node SA access to Artifact Registry**
```hcl
resource "google_artifact_registry_repository_iam_member" "node_reader" {
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.gke_node_sa.email}"
}
```

**12. Output GKE cluster kubeconfig**
```hcl
output "cluster_endpoint" {
  value     = google_container_cluster.primary.endpoint
  sensitive = true
}

output "cluster_ca_certificate" {
  value     = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
  sensitive = true
}

output "kubeconfig_command" {
  value = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${google_container_cluster.primary.location} --project ${var.project_id}"
}
```

---

## Intermediate

**13. Private cluster with private nodes and private endpoint**
```hcl
resource "google_container_cluster" "private" {
  name     = "private-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = var.admin_cidr
      display_name = "Admin Access"
    }
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }
}
```

**14. Workload Identity configuration**
```hcl
resource "google_container_cluster" "with_wi" {
  name     = "wi-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

resource "google_service_account" "workload_sa" {
  account_id   = "k8s-workload-sa"
  display_name = "Kubernetes Workload SA"
}

resource "google_service_account_iam_member" "wi_binding" {
  service_account_id = google_service_account.workload_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.k8s_namespace}/${var.k8s_sa_name}]"
}
```

**15. Node pool with taints and labels**
```hcl
resource "google_container_node_pool" "gpu_nodes" {
  name    = "gpu-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_count = 1

  node_config {
    machine_type = "n1-standard-8"

    labels = {
      workload-type = "ml"
      team          = "data-science"
    }

    taint {
      key    = "gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**16. Cluster autoscaler on node pool**
```hcl
resource "google_container_node_pool" "auto_scaled" {
  name    = "auto-scaled-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  autoscaling {
    min_node_count  = 1
    max_node_count  = 20
    location_policy = "BALANCED"
  }

  node_config {
    machine_type = "e2-standard-4"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```

**17. Maintenance policy with recurring window**
```hcl
resource "google_container_cluster" "with_maintenance" {
  name     = "maintained-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  maintenance_policy {
    recurring_window {
      start_time = "2024-01-01T02:00:00Z"
      end_time   = "2024-01-01T06:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }

    maintenance_exclusion {
      exclusion_name = "holiday-freeze"
      start_time     = "2024-12-20T00:00:00Z"
      end_time       = "2025-01-02T00:00:00Z"
      exclusion_options {
        scope = "NO_UPGRADES"
      }
    }
  }
}
```

**18. Node pool with Spot (preemptible) VMs**
```hcl
resource "google_container_node_pool" "spot_nodes" {
  name    = "spot-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  autoscaling {
    min_node_count = 0
    max_node_count = 50
  }

  node_config {
    machine_type = "e2-standard-4"
    spot         = true

    labels = {
      "node-type" = "spot"
    }

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**19. GKE with network policy enabled**
```hcl
resource "google_container_cluster" "with_netpol" {
  name     = "netpol-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  addons_config {
    network_policy_config {
      disabled = false
    }
  }
}
```

**20. Node pool upgrade strategy (surge upgrades)**
```hcl
resource "google_container_node_pool" "surge_upgrade" {
  name    = "surge-upgrade-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_count = 3

  upgrade_settings {
    strategy        = "SURGE"
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type = "e2-standard-2"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**21. Binary Authorization policy for GKE**
```hcl
resource "google_binary_authorization_policy" "gke_policy" {
  project = var.project_id

  admission_whitelist_patterns {
    name_pattern = "gcr.io/google_containers/*"
  }

  admission_whitelist_patterns {
    name_pattern = "k8s.gcr.io/*"
  }

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.prod_attestor.name
    ]
  }
}

resource "google_container_cluster" "binauthz" {
  name     = "binauthz-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }
}
```

**22. Artifact Registry with vulnerability scanning**
```hcl
resource "google_artifact_registry_repository" "scanned" {
  location      = "us-central1"
  repository_id = "scanned-images"
  format        = "DOCKER"
  description   = "Images with automatic vulnerability scanning"

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}

resource "google_project_service" "container_scanning" {
  service = "containerscanning.googleapis.com"
}
```

**23. GKE cluster with Config Connector**
```hcl
resource "google_container_cluster" "config_connector" {
  name     = "config-connector-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  addons_config {
    config_connector_config {
      enabled = true
    }
  }
}

resource "google_project_iam_member" "config_connector_sa" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${var.project_id}.svc.id.goog[cnrm-system/cnrm-controller-manager]"
}
```

**24. Node pool with local SSD**
```hcl
resource "google_container_node_pool" "local_ssd_nodes" {
  name    = "local-ssd-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_count = 2

  node_config {
    machine_type    = "n2-standard-8"
    local_ssd_count = 2

    ephemeral_storage_local_ssd_config {
      local_ssd_count = 2
    }

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**25. GKE with master authorized networks**
```hcl
resource "google_container_cluster" "authorized" {
  name     = "authorized-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/8"
      display_name = "Internal Network"
    }
    cidr_blocks {
      cidr_block   = "${var.office_ip}/32"
      display_name = "Office IP"
    }
  }
}
```

---

## Nested

**26. Complete GKE private cluster (VPC + cluster + node pool + Workload Identity)**
```hcl
resource "google_compute_network" "gke_vpc" {
  name                    = "gke-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "gke_subnet" {
  name          = "gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.gke_vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

resource "google_container_cluster" "full_private" {
  name     = "full-private-cluster"
  location = "us-central1"

  network    = google_compute_network.gke_vpc.name
  subnetwork = google_compute_subnetwork.gke_subnet.name

  remove_default_node_pool = true
  initial_node_count       = 1

  networking_mode = "VPC_NATIVE"

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  release_channel {
    channel = "REGULAR"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = var.admin_cidr
      display_name = "Admin"
    }
  }
}

resource "google_container_node_pool" "full_private_nodes" {
  name     = "private-nodes"
  cluster  = google_container_cluster.full_private.name
  location = "us-central1"

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type    = "e2-standard-4"
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}
```

**27. Multi-node-pool cluster (general + spot + gpu)**
```hcl
resource "google_container_cluster" "multi_pool" {
  name     = "multi-pool-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

resource "google_container_node_pool" "general" {
  name    = "general"
  cluster = google_container_cluster.multi_pool.name
  location = "us-central1"

  autoscaling {
    min_node_count = 2
    max_node_count = 10
  }

  node_config {
    machine_type    = "e2-standard-4"
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}

resource "google_container_node_pool" "spot" {
  name    = "spot"
  cluster = google_container_cluster.multi_pool.name
  location = "us-central1"

  autoscaling {
    min_node_count = 0
    max_node_count = 50
  }

  node_config {
    machine_type = "e2-standard-8"
    spot         = true

    labels = { "node-type" = "spot" }
    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}

resource "google_container_node_pool" "gpu" {
  name    = "gpu"
  cluster = google_container_cluster.multi_pool.name
  location = "us-central1-a"

  autoscaling {
    min_node_count = 0
    max_node_count = 5
  }

  node_config {
    machine_type = "n1-standard-8"

    guest_accelerator {
      type  = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "DEFAULT"
      }
    }

    labels = { "workload-type" = "gpu" }
    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**28. GKE with Binary Authorization attestor**
```hcl
resource "google_container_analysis_note" "build_note" {
  name = "build-attestor-note"

  attestation_authority {
    hint {
      human_readable_name = "Build Attestor"
    }
  }
}

resource "google_binary_authorization_attestor" "build_attestor" {
  name = "build-attestor"

  attestation_authority_note {
    note_reference = google_container_analysis_note.build_note.name
    public_keys {
      ascii_armored_pgp_public_key = var.pgp_public_key
    }
  }
}

resource "google_binary_authorization_policy" "enforced" {
  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    require_attestations_by = [
      google_binary_authorization_attestor.build_attestor.name
    ]
  }

  admission_whitelist_patterns {
    name_pattern = "gcr.io/google-containers/*"
  }

  admission_whitelist_patterns {
    name_pattern = "gcr.io/gke-release/*"
  }
}

resource "google_container_cluster" "binauthz_enforced" {
  name     = "binauthz-enforced"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }
}
```

**29. GKE Hub membership (Fleet enrollment)**
```hcl
resource "google_gke_hub_membership" "fleet_member" {
  membership_id = google_container_cluster.primary.name
  project       = var.project_id

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.primary.id}"
    }
  }

  authority {
    issuer = "https://container.googleapis.com/v1/${google_container_cluster.primary.id}"
  }
}

resource "google_gke_hub_feature" "config_management" {
  name     = "configmanagement"
  location = "global"

  fleet_default_member_config {
    configmanagement {
      config_sync {
        git {
          sync_repo = "https://github.com/${var.github_org}/${var.config_repo}"
          sync_branch = "main"
          policy_dir  = "config"
          secret_type = "none"
        }
      }
    }
  }
}
```

**30. GKE Autopilot cluster**
```hcl
resource "google_container_cluster" "autopilot" {
  name     = "autopilot-cluster"
  location = "us-central1"

  enable_autopilot = true

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  release_channel {
    channel = "STABLE"
  }
}

output "autopilot_endpoint" {
  value     = google_container_cluster.autopilot.endpoint
  sensitive = true
}
```

**31. GKE with Dataplane V2 (eBPF)**
```hcl
resource "google_container_cluster" "dataplane_v2" {
  name     = "dataplane-v2-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  networking_mode  = "VPC_NATIVE"
  datapath_provider = "ADVANCED_DATAPATH"

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  addons_config {
    network_policy_config {
      disabled = true
    }
  }
}
```

**32. GKE with Cloud Armor via BackendConfig**
```hcl
resource "google_compute_security_policy" "gke_armor" {
  name = "gke-armor-policy"

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = var.blocked_ip_ranges
      }
    }
    description = "Block known bad IPs"
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow"
  }
}
```

---

## Advanced

**33. GKE Autopilot with Workload Identity and VPC**
```hcl
resource "google_container_cluster" "autopilot_full" {
  name     = "autopilot-full"
  location = "us-central1"

  enable_autopilot = true

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = var.admin_cidr
      display_name = "Admin"
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }
}
```

**34. GKE node pool with Blue/Green upgrade strategy**
```hcl
resource "google_container_node_pool" "blue_green" {
  name    = "blue-green-pool"
  cluster = google_container_cluster.primary.name
  location = "us-central1"

  node_count = 3

  upgrade_settings {
    strategy        = "BLUE_GREEN"
    blue_green_settings {
      standard_rollout_policy {
        batch_percentage    = 0.3
        batch_soak_duration = "300s"
      }
      node_pool_soak_duration = "600s"
    }
  }

  node_config {
    machine_type    = "e2-standard-4"
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**35. GKE with managed Prometheus (Google Cloud Managed Service for Prometheus)**
```hcl
resource "google_container_cluster" "with_prometheus" {
  name     = "prometheus-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  monitoring_config {
    managed_prometheus {
      enabled = true
    }
    enable_components = [
      "SYSTEM_COMPONENTS",
      "APISERVER",
      "CONTROLLER_MANAGER",
      "SCHEDULER"
    ]
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}
```

**36. GKE Fleet with multi-cluster service discovery**
```hcl
resource "google_gke_hub_feature" "mcs" {
  name     = "multiclusterservicediscovery"
  location = "global"
}

resource "google_gke_hub_membership" "cluster_a" {
  membership_id = "cluster-a"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.cluster_a.id}"
    }
  }
}

resource "google_gke_hub_membership" "cluster_b" {
  membership_id = "cluster-b"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.cluster_b.id}"
    }
  }
}

resource "google_gke_hub_feature_membership" "cluster_a_mcs" {
  location   = "global"
  feature    = google_gke_hub_feature.mcs.name
  membership = google_gke_hub_membership.cluster_a.membership_id

  multiclusterservicediscovery {}
}
```

**37. GKE node pool with Confidential VMs**
```hcl
resource "google_container_node_pool" "confidential" {
  name    = "confidential-nodes"
  cluster = google_container_cluster.primary.name
  location = "us-central1-a"

  node_count = 2

  node_config {
    machine_type = "n2d-standard-4"

    confidential_nodes {
      enabled = true
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**38. GKE with Anthos Service Mesh config**
```hcl
resource "google_gke_hub_feature" "asm" {
  name     = "servicemesh"
  location = "global"
}

resource "google_gke_hub_feature_membership" "asm_member" {
  location   = "global"
  feature    = google_gke_hub_feature.asm.name
  membership = google_gke_hub_membership.fleet_member.membership_id

  mesh {
    management = "MANAGEMENT_AUTOMATIC"
  }
}
```

**39. GKE private cluster with Cloud NAT for egress**
```hcl
resource "google_compute_router" "gke_router" {
  name    = "gke-router"
  region  = "us-central1"
  network = google_compute_network.gke_vpc.id
}

resource "google_compute_router_nat" "gke_nat" {
  name                               = "gke-nat"
  router                             = google_compute_router.gke_router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

resource "google_container_cluster" "private_with_nat" {
  name     = "private-nat-cluster"
  location = "us-central1"

  network    = google_compute_network.gke_vpc.name
  subnetwork = google_compute_subnetwork.gke_subnet.name

  remove_default_node_pool = true
  initial_node_count       = 1

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  depends_on = [google_compute_router_nat.gke_nat]
}
```

**40. GKE node auto-provisioning (cluster-level autoscaler)**
```hcl
resource "google_container_cluster" "nap" {
  name     = "nap-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  cluster_autoscaling {
    enabled = true

    auto_provisioning_defaults {
      oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
      service_account = google_service_account.gke_node_sa.email

      management {
        auto_repair  = true
        auto_upgrade = true
      }
    }

    resource_limits {
      resource_type = "cpu"
      minimum       = 4
      maximum       = 100
    }

    resource_limits {
      resource_type = "memory"
      minimum       = 8
      maximum       = 400
    }
  }
}
```

**41. GKE with backup and restore**
```hcl
resource "google_gke_backup_backup_plan" "backup_plan" {
  name     = "cluster-backup-plan"
  cluster  = google_container_cluster.primary.id
  location = "us-central1"

  backup_config {
    include_volume_data = true
    include_secrets     = true
    all_namespaces      = true
  }

  backup_schedule {
    cron_schedule = "0 3 * * *"
  }

  retention_policy {
    backup_delete_lock_days = 7
    backup_retain_days      = 30
  }
}
```

**42. GKE with Artifact Registry and image streaming**
```hcl
resource "google_container_cluster" "image_streaming" {
  name     = "image-streaming-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  node_pool_defaults {
    node_config_defaults {
      containerd_config {
        private_registry_access_config {
          enabled = true
          certificate_authority_domain_config {
            fqdns = ["${var.region}-docker.pkg.dev"]
            gcr_cacert_config {
              ca_cert_attribute = "CA_CERT_ATTRIBUTE_SYSTEM_STORE"
            }
          }
        }
      }
      image_streaming_config {
        enabled = true
      }
    }
  }
}
```

**43. GKE with Vertex AI Workbench notebook node pool**
```hcl
resource "google_container_node_pool" "ai_notebook" {
  name     = "ai-notebook-pool"
  cluster  = google_container_cluster.primary.name
  location = "us-central1"

  autoscaling {
    min_node_count = 0
    max_node_count = 5
  }

  node_config {
    machine_type = "n1-highmem-8"

    labels = {
      "workload"  = "ai-notebook"
      "team"      = "ml"
    }

    taint {
      key    = "dedicated"
      value  = "ai-notebook"
      effect = "NO_SCHEDULE"
    }

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

**44. GKE cross-project setup (host VPC project)**
```hcl
provider "google" {
  alias   = "host"
  project = var.host_project_id
}

provider "google" {
  alias   = "service"
  project = var.service_project_id
}

resource "google_compute_network" "shared_vpc" {
  provider                = google.host
  name                    = "shared-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "gke_subnet" {
  provider      = google.host
  name          = "gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.shared_vpc.id

  secondary_ip_range {
    range_name    = "gke-pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "gke-services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

resource "google_container_cluster" "shared_vpc_cluster" {
  provider = google.service
  name     = "shared-vpc-cluster"
  location = "us-central1"

  network    = google_compute_network.shared_vpc.self_link
  subnetwork = google_compute_subnetwork.gke_subnet.self_link

  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }
}
```

**45. GKE with Kubernetes secrets encrypted via Cloud KMS**
```hcl
resource "google_kms_key_ring" "gke_ring" {
  name     = "gke-key-ring"
  location = "us-central1"
}

resource "google_kms_crypto_key" "gke_secret_key" {
  name     = "gke-secrets-key"
  key_ring = google_kms_key_ring.gke_ring.id

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_container_cluster" "encrypted_secrets" {
  name     = "encrypted-secrets-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  database_encryption {
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke_secret_key.id
  }
}
```

**46. GKE Gateway API (HTTP Route)**
```hcl
resource "google_container_cluster" "gateway_api" {
  name     = "gateway-api-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  addons_config {
    http_load_balancing {
      disabled = false
    }
  }

  gateway_api_config {
    channel = "CHANNEL_STANDARD"
  }
}
```

**47. GKE with Managed Certificate Authority Service**
```hcl
resource "google_privateca_ca_pool" "gke_pool" {
  name     = "gke-ca-pool"
  location = "us-central1"
  tier     = "ENTERPRISE"

  publishing_options {
    publish_ca_cert = true
    publish_crl     = false
  }
}

resource "google_privateca_certificate_authority" "gke_ca" {
  certificate_authority_id = "gke-ca"
  location                 = "us-central1"
  pool                     = google_privateca_ca_pool.gke_pool.name

  config {
    subject_config {
      subject {
        common_name  = "GKE Certificate Authority"
        organization = var.org_name
      }
    }
    x509_config {
      ca_options {
        is_ca = true
      }
      key_usage {
        base_key_usage {
          cert_sign = true
          crl_sign  = true
        }
        extended_key_usage {}
      }
    }
  }

  key_spec {
    algorithm = "RSA_PKCS1_4096_SHA256"
  }
}
```

**48. GKE DNS-based service discovery (Cloud DNS scope)**
```hcl
resource "google_container_cluster" "dns_cluster" {
  name     = "dns-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  dns_config {
    cluster_dns        = "CLOUD_DNS"
    cluster_dns_scope  = "CLUSTER_SCOPE"
    cluster_dns_domain = "cluster.local"
  }
}
```

**49. Complete GKE setup with all hardening options**
```hcl
resource "google_container_cluster" "hardened" {
  name     = "hardened-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.gke_vpc.name
  subnetwork = google_compute_subnetwork.gke_subnet.name

  networking_mode  = "VPC_NATIVE"
  datapath_provider = "ADVANCED_DATAPATH"

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  database_encryption {
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.gke_secret_key.id
  }

  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  release_channel {
    channel = "REGULAR"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = var.admin_cidr
      display_name = "Admins"
    }
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus { enabled = true }
  }
}
```

**50. GKE with Terraform kubernetes provider for initial resources**
```hcl
data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.primary.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(
    google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  )
}

resource "kubernetes_namespace" "app" {
  metadata {
    name = "app"
    labels = {
      "istio-injection" = "enabled"
    }
  }
}

resource "kubernetes_service_account" "app_sa" {
  metadata {
    name      = "app-service-account"
    namespace = kubernetes_namespace.app.metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.workload_sa.email
    }
  }
}
```
