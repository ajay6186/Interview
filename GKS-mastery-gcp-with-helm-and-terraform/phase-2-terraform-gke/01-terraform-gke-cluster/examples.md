# Phase 2 – Terraform GKE Cluster: 50 Examples

> **Stack:** Terraform `google` provider `~> 5.0`, GCP project `my-gcp-project`, cluster `my-gke-cluster`, region `us-central1`.
> KCC resources use `apiVersion: cnrm.cloud.google.com/v1beta1`.

---

## BASIC (Examples 1–13)

---

### Example 1: Minimal GKE Cluster with google_container_cluster

**Concept:** The simplest possible `google_container_cluster` resource that provisions a zonal GKE cluster.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1-a"

  # Remove the default node pool after creation and manage nodes separately
  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** This block is the minimal viable cluster definition — it sets the cluster name and a zonal location. `remove_default_node_pool = true` is a best practice that lets you manage node pools independently via `google_container_node_pool`. The `initial_node_count = 1` is required by GCP even when the default pool is immediately removed.

---

### Example 2: Separate Node Pool with google_container_node_pool

**Concept:** Decoupling the node pool from the cluster resource allows independent scaling and upgrades.

```hcl
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = "us-central1-a"
  cluster    = google_container_cluster.my_gke_cluster.name
  node_count = 2

  node_config {
    machine_type = "e2-medium"
    disk_size_gb = 50
    disk_type    = "pd-standard"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```

**Explanation:** `google_container_node_pool` references the cluster by its `.name` attribute, establishing a dependency. `oauth_scopes` controls which GCP APIs the node's service account can call — `cloud-platform` is the broadest scope and is suitable for most workloads. Using a separate node pool allows you to change machine type or node count without recreating the cluster.

---

### Example 3: Deletion Protection on a GKE Cluster

**Concept:** `deletion_protection` prevents accidental `terraform destroy` of a production cluster.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name               = "my-gke-cluster"
  location           = "us-central1-a"
  deletion_protection = true

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** When `deletion_protection = true`, any `terraform destroy` or resource removal will fail at the API level, acting as a safeguard against accidents. This attribute was introduced in provider `~> 5.0` and maps directly to the GKE API's `deletionProtection` field. To destroy the cluster you must first apply a change setting this to `false`. It is recommended for all production clusters.

---

### Example 4: Pinning the Master Version

**Concept:** `min_master_version` locks the control plane to a specific Kubernetes version.

```hcl
data "google_container_engine_versions" "us_central1" {
  location = "us-central1"
  project  = "my-gcp-project"
}

resource "google_container_cluster" "my_gke_cluster" {
  name               = "my-gke-cluster"
  location           = "us-central1-a"
  min_master_version = data.google_container_engine_versions.us_central1.latest_master_version

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** The `google_container_engine_versions` data source queries GCP for available Kubernetes versions in the specified location. Using `latest_master_version` pins the cluster to the newest available version at apply time, which is useful for testing. In production, prefer a hard-coded version string (e.g., `"1.29.3-gke.1000"`) to avoid unintentional upgrades during re-applies.

---

### Example 5: Release Channel – REGULAR

**Concept:** Release channels let GCP manage version upgrades automatically within a chosen cadence.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1-a"

  release_channel {
    channel = "REGULAR"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** The `REGULAR` channel receives updates a few weeks after the `RAPID` channel, balancing feature availability with stability. When a release channel is set, you should omit `min_master_version` to let GCP handle the version; setting both can cause conflicts. `REGULAR` is the recommended default for most production workloads.

---

### Example 6: Release Channel – STABLE

**Concept:** The `STABLE` channel delays updates the longest, prioritising reliability over new features.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1-a"

  release_channel {
    channel = "STABLE"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `STABLE` channel clusters receive only versions that have proven themselves in `RAPID` and `REGULAR` channels, making it ideal for compliance-sensitive or business-critical environments. GCP automatically upgrades both the control plane and node pools enrolled in a channel, reducing operational overhead. Pair this with `maintenance_policy` blocks if you need to constrain when upgrades occur.

---

### Example 7: Zonal Cluster (Single Zone)

**Concept:** A zonal cluster places both the control plane and nodes in one zone, minimising cost.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1-a"   # single zone -> zonal cluster

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** When `location` is set to a zone (three-part string ending in `-a`, `-b`, etc.), GKE creates a zonal cluster with a single-replica control plane. Zonal clusters are cheaper but offer no control-plane SLA and will experience brief downtime during master upgrades. They are well-suited for development or non-critical workloads.

---

### Example 8: Regional Cluster (High Availability)

**Concept:** Setting `location` to a region creates a regional cluster with a replicated control plane across three zones.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"   # region -> regional cluster

  node_locations = [
    "us-central1-a",
    "us-central1-b",
    "us-central1-c",
  ]

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** A regional cluster runs three control-plane replicas, one per zone, providing a 99.95% uptime SLA for the API server. `node_locations` explicitly specifies which zones receive node pool instances; omitting it defaults to all zones in the region. Regional clusters cost more (three control-plane VMs are billed) but are required for production-grade availability.

---

### Example 9: Cluster Labels and Resource Tags

**Concept:** Labels on the cluster resource enable cost attribution and policy targeting.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  resource_labels = {
    environment = "production"
    team        = "platform"
    managed-by  = "terraform"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `resource_labels` are GCP-level labels that appear in billing reports and can be used in IAM conditions. They differ from Kubernetes labels, which live inside the cluster. Labelling clusters with `managed-by = "terraform"` is a common convention that makes it easy to audit which clusters are under IaC control.

---

### Example 10: Logging and Monitoring Configuration

**Concept:** Explicit logging and monitoring settings ensure observability is consistently configured across clusters.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "APISERVER", "SCHEDULER", "CONTROLLER_MANAGER"]
    managed_prometheus {
      enabled = true
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `logging_config` and `monitoring_config` replace the older `logging_service` and `monitoring_service` fields and provide granular control over which components are observed. Enabling `managed_prometheus` activates Google's managed collection of Prometheus metrics, eliminating the need to self-host a Prometheus stack. `WORKLOADS` logging forwards application container logs to Cloud Logging automatically.

---

### Example 11: Network and Subnetwork Assignment

**Concept:** Attaching the cluster to a specific VPC and subnet is required for production environments.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name       = "my-gke-cluster"
  location   = "us-central1"
  network    = "projects/my-gcp-project/global/networks/my-vpc"
  subnetwork = "projects/my-gcp-project/regions/us-central1/subnetworks/my-subnet"

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `network` and `subnetwork` use full self-link paths to avoid ambiguity across projects. The `ip_allocation_policy` block enables VPC-native (alias IP) networking, which is required for private clusters and recommended for all clusters because it avoids IP masquerading. `cluster_secondary_range_name` and `services_secondary_range_name` must match secondary ranges pre-configured on the subnet.

---

### Example 12: Maintenance Window Configuration

**Concept:** `maintenance_policy` restricts when GKE can perform automatic upgrades and repairs.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  maintenance_policy {
    recurring_window {
      start_time = "2026-01-01T02:00:00Z"
      end_time   = "2026-01-01T06:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `recurring_window` uses RFC 5545 RRULE syntax for the `recurrence` field, giving flexible scheduling control. The example restricts maintenance to a four-hour window on Saturday and Sunday nights (UTC), which is a common pattern for reducing business-hours disruption. GKE will not start upgrades outside the defined window, though in-progress upgrades may extend past it.

---

### Example 13: Enabling Shielded Nodes

**Concept:** Shielded nodes provide verifiable node identity and integrity monitoring.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  enable_shielded_nodes = true

  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_nodes" {
  name     = "primary-node-pool"
  location = "us-central1"
  cluster  = google_container_cluster.my_gke_cluster.name

  node_config {
    machine_type = "e2-standard-2"

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```

**Explanation:** `enable_shielded_nodes` at the cluster level enforces that all nodes use the Shielded VM feature set. The node pool's `shielded_instance_config` block adds Secure Boot (prevents loading unsigned bootloaders or kernels) and integrity monitoring (baseline vs. live boot measurement comparisons). These controls are typically required for CIS Benchmark and PCI-DSS compliance.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: Private Cluster with private_cluster_config

**Concept:** Private clusters restrict node external IP addresses, routing all traffic through Private Google Access.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"
  network    = google_compute_network.vpc.self_link
  subnetwork = google_compute_subnetwork.subnet.self_link

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `enable_private_nodes = true` removes public IPs from worker nodes, so all workload egress goes through Cloud NAT or VPC peering. `enable_private_endpoint = false` keeps the Kubernetes API server reachable from authorised external networks, which is convenient for Terraform to continue managing the cluster. `master_ipv4_cidr_block` allocates a `/28` CIDR for the control-plane peering VPC — it must not overlap any existing ranges.

---

### Example 15: Master Authorized Networks

**Concept:** `master_authorized_networks_config` restricts which CIDR blocks can reach the Kubernetes API server.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/8"
      display_name = "Internal VPN range"
    }
    cidr_blocks {
      cidr_block   = "203.0.113.50/32"
      display_name = "CI/CD runner static IP"
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** Multiple `cidr_blocks` sub-blocks can be defined within a single `master_authorized_networks_config`. The `display_name` field is purely informational but is invaluable for auditing who can reach the API server. Any IP not in the allowlist will receive a TCP reset from the load balancer in front of the master, providing network-level access control independent of RBAC.

---

### Example 16: Workload Identity Configuration

**Concept:** Workload Identity federates Kubernetes service accounts to GCP IAM service accounts without key files.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_nodes" {
  name     = "primary-node-pool"
  location = "us-central1"
  cluster  = google_container_cluster.my_gke_cluster.name

  node_config {
    machine_type = "e2-standard-2"

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```

**Explanation:** The `workload_pool` format is always `<PROJECT_ID>.svc.id.goog`. On the node pool, `workload_metadata_config.mode = "GKE_METADATA"` replaces the legacy metadata server with the GKE metadata server, which enforces that only pods with a bound Workload Identity can obtain GCP credentials. This eliminates the need to distribute service account key JSON files to pods.

---

### Example 17: IAM Binding for Workload Identity

**Concept:** Binding a Kubernetes service account to a GCP service account completes the Workload Identity setup.

```hcl
resource "google_service_account" "app_sa" {
  account_id   = "my-app-sa"
  display_name = "Application Service Account"
  project      = "my-gcp-project"
}

resource "google_service_account_iam_binding" "workload_identity_binding" {
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:my-gcp-project.svc.id.goog[my-namespace/my-ksa]",
  ]
}
```

**Explanation:** The `members` entry follows the format `serviceAccount:<PROJECT>.svc.id.goog[<K8S_NAMESPACE>/<K8S_SA_NAME>]`, linking a specific Kubernetes namespace and service account to the GCP service account. You still need to annotate the Kubernetes service account with `iam.gke.io/gcp-service-account: my-app-sa@my-gcp-project.iam.gserviceaccount.com`. This two-way binding is what allows the metadata server to issue short-lived tokens.

---

### Example 18: Binary Authorization Policy

**Concept:** Binary Authorization enforces that only attested container images can be deployed to the cluster.

```hcl
resource "google_binary_authorization_policy" "policy" {
  project = "my-gcp-project"

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"

    require_attestations_by = [
      google_binary_authorization_attestor.build_attestor.name,
    ]
  }

  global_policy_evaluation_mode = "ENABLE"
}

resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** Binary Authorization integrates with the GKE admission webhook to block unsigned or unattested images at deploy time. `ENFORCED_BLOCK_AND_AUDIT_LOG` both blocks non-compliant images and writes Cloud Audit Log entries, providing a clear audit trail. The cluster's `binary_authorization` block must reference `PROJECT_SINGLETON_POLICY_ENFORCE` to activate the project-level policy defined in `google_binary_authorization_policy`.

---

### Example 19: Network Policy with Calico

**Concept:** Enabling network policy support activates the Calico CNI plugin for Kubernetes NetworkPolicy enforcement.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # Calico requires the network policy addon
  addons_config {
    network_policy_config {
      disabled = false
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** GKE supports two network policy providers: `CALICO` (the default) and `PROVIDER_UNSPECIFIED`. Setting `network_policy.enabled = true` installs the Calico agents as a DaemonSet on every node. The `network_policy_config.disabled = false` addon must be explicitly enabled alongside it; the two settings work together. Once active, standard Kubernetes `NetworkPolicy` resources are enforced at the kernel level using eBPF/iptables rules.

---

### Example 20: Addon – HorizontalPodAutoscaling

**Concept:** `HorizontalPodAutoscaling` addon enables the Kubernetes HPA controller backed by the GKE metrics adapter.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  addons_config {
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** The HorizontalPodAutoscaling addon is enabled by default in GKE but must be explicitly set to `disabled = false` in Terraform to prevent configuration drift if it was ever disabled. When enabled, the GKE-managed metrics server exposes CPU and memory metrics to the HPA controller. Combined with Managed Prometheus, custom metrics from applications can also drive HPA scaling decisions.

---

### Example 21: Addon – HttpLoadBalancing

**Concept:** The `HttpLoadBalancing` addon provisions Google Cloud Load Balancers for Kubernetes Ingress resources.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  addons_config {
    http_load_balancing {
      disabled = false
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** With `http_load_balancing` enabled, creating a `kubernetes.io/ingress.class: "gce"` Ingress resource automatically provisions a Google Cloud HTTP(S) load balancer, complete with a managed SSL certificate if configured. Disabling this addon forces teams to use a third-party ingress controller (e.g., NGINX), which is a valid pattern but requires additional operational overhead. GKE's native load balancer integrates directly with Cloud Armor for WAF capabilities.

---

### Example 22: Addon – GcpFilestoreCsiDriver

**Concept:** The Filestore CSI driver addon enables ReadWriteMany persistent volumes backed by Cloud Filestore.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  addons_config {
    gcp_filestore_csi_driver_config {
      enabled = true
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** The Filestore CSI driver installs the `filestore.csi.storage.gke.io` StorageClass driver, which allows PersistentVolumeClaims with `accessModes: [ReadWriteMany]` — a mode not supported by standard `pd-standard` or `pd-ssd` disks. This is essential for stateful workloads like CMS platforms, machine learning training jobs, or any application that requires shared filesystem access across multiple pods. The addon is managed by GKE and auto-upgraded alongside the cluster.

---

### Example 23: Node Auto-Provisioning (Cluster Autoscaler)

**Concept:** `cluster_autoscaling` with node auto-provisioning lets GKE create and delete node pools automatically.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  cluster_autoscaling {
    enabled = true

    resource_limits {
      resource_type = "cpu"
      minimum       = 4
      maximum       = 64
    }

    resource_limits {
      resource_type = "memory"
      minimum       = 16
      maximum       = 256
    }

    auto_provisioning_defaults {
      oauth_scopes = [
        "https://www.googleapis.com/auth/cloud-platform",
      ]
      service_account = google_service_account.node_sa.email
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** Node Auto-Provisioning (NAP) is an advanced form of the Cluster Autoscaler that can create entirely new node pools when no existing pool can satisfy a pending pod's resource requests or node selectors. `resource_limits` set the cluster-wide caps on total CPU and memory that NAP can provision, preventing runaway cost. `auto_provisioning_defaults` ensures newly created pools inherit the correct service account and OAuth scopes.

---

### Example 24: Vertical Pod Autoscaling

**Concept:** VPA automatically adjusts CPU and memory requests/limits on running pods based on observed usage.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  vertical_pod_autoscaling {
    enabled = true
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** Enabling VPA at the cluster level installs the VPA admission webhook and recommender components. Individual workloads opt in by creating `VerticalPodAutoscaler` objects in their namespaces. VPA operates in three modes: `Off` (recommendations only), `Initial` (sets requests at pod creation), and `Auto` (evicts and restarts pods with updated requests). It pairs well with NAP to ensure right-sized pods on right-sized nodes.

---

### Example 25: Intranode Visibility (VPC Flow Logs for Pods)

**Concept:** Intranode visibility enables VPC Flow Logs to capture pod-to-pod traffic within a node.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  enable_intranode_visibility = true

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** By default, traffic between pods on the same node bypasses the VPC data plane and is therefore invisible to VPC Flow Logs and network policies enforced at the VPC level. Setting `enable_intranode_visibility = true` routes pod-to-pod traffic through the VPC, making it visible to flow logs and firewalls. This is a requirement for compliance frameworks that mandate full east-west traffic logging but adds a small latency overhead.

---

### Example 26: DNS Config with Cloud DNS for GKE

**Concept:** Switching the cluster DNS provider to Cloud DNS improves scalability and eliminates kube-dns performance bottlenecks.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  dns_config {
    cluster_dns        = "CLOUD_DNS"
    cluster_dns_scope  = "CLUSTER_SCOPE"
    cluster_dns_domain = "cluster.local"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** Cloud DNS for GKE replaces the in-cluster `kube-dns` or `CoreDNS` pods with a managed Cloud DNS zone, dramatically improving DNS query throughput at scale (from ~10k QPS per kube-dns pod to millions via Cloud DNS). `CLUSTER_SCOPE` means the zone is private to the cluster; `VPC_SCOPE` would share DNS resolution across all clusters in the VPC. This setting is immutable after cluster creation, so it must be planned upfront.

---

## NESTED (Examples 27–38)

---

### Example 27: VPC and Subnet Creation for GKE

**Concept:** Provisioning a dedicated VPC and subnet with secondary ranges before creating the cluster.

```hcl
resource "google_compute_network" "vpc" {
  name                    = "my-gke-vpc"
  auto_create_subnetworks = false
  project                 = "my-gcp-project"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "my-gke-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.self_link
  project       = "my-gcp-project"

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }
}
```

**Explanation:** `auto_create_subnetworks = false` creates a custom-mode VPC, which is required for production as it prevents accidental subnet creation in all regions. The two secondary ranges named `pods` and `services` are referenced by the cluster's `ip_allocation_policy` block (see Example 11). The `/16` for pods accommodates up to 65,536 pod IPs, while the `/20` for services covers 4,096 service VIPs.

---

### Example 28: Full Cluster Wiring VPC + Subnet + Cluster

**Concept:** Composing the VPC, subnet, and cluster resources into a complete, dependency-aware Terraform configuration.

```hcl
resource "google_compute_network" "vpc" {
  name                    = "my-gke-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "my-gke-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.self_link

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }
}

resource "google_container_cluster" "my_gke_cluster" {
  name       = "my-gke-cluster"
  location   = "us-central1"
  network    = google_compute_network.vpc.self_link
  subnetwork = google_compute_subnetwork.subnet.self_link

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }

  remove_default_node_pool = true
  initial_node_count       = 1

  depends_on = [google_compute_subnetwork.subnet]
}
```

**Explanation:** Terraform infers most dependencies automatically through attribute references (e.g., `google_compute_network.vpc.self_link`), but the explicit `depends_on` for the subnet ensures secondary ranges are fully registered before the cluster attempts to use them. This full composition is the recommended baseline configuration for a production GKE cluster — private nodes, VPC-native networking, Workload Identity, and a release channel are all enabled.

---

### Example 29: Terraform Helm Provider Bootstrap

**Concept:** Configuring the Helm provider to target the freshly created GKE cluster using its kubeconfig credentials.

```hcl
data "google_client_config" "default" {}

provider "helm" {
  kubernetes {
    host                   = "https://${google_container_cluster.my_gke_cluster.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(
      google_container_cluster.my_gke_cluster.master_auth[0].cluster_ca_certificate
    )
  }
}
```

**Explanation:** The `google_client_config` data source retrieves the current ADC (Application Default Credentials) access token, which Terraform uses to authenticate to the Kubernetes API server. `base64decode` is necessary because GKE returns the CA certificate in base64-encoded form. This provider block must appear after the cluster is created, which Terraform enforces automatically because `my_gke_cluster.endpoint` is a known-after-apply attribute.

---

### Example 30: Installing KCC via Helm Release

**Concept:** Deploying the Kubernetes Config Connector operator into the cluster using a `helm_release` resource.

```hcl
resource "helm_release" "kcc_operator" {
  name             = "kcc-operator"
  repository       = "https://charts.konghq.com"   # placeholder; use official KCC Helm chart repo
  chart            = "config-connector"
  namespace        = "cnrm-system"
  create_namespace = true
  version          = "1.119.0"

  set {
    name  = "googleProjectId"
    value = "my-gcp-project"
  }

  depends_on = [google_container_cluster.my_gke_cluster]
}
```

**Explanation:** The `helm_release` resource manages the full lifecycle of a Helm chart, including installs, upgrades, and rollbacks. `create_namespace = true` ensures the `cnrm-system` namespace exists before Helm attempts to deploy resources into it. Pinning the `version` is critical in production to avoid inadvertent upgrades; the version here maps to the KCC operator image tag. The `depends_on` guarantees the cluster is healthy before Helm attempts to connect.

---

### Example 31: KCC Namespace and IAM Service Account Setup

**Concept:** Creating the namespace and GCP service account that KCC will use to manage GCP resources.

```hcl
resource "google_service_account" "kcc_sa" {
  account_id   = "kcc-sa"
  display_name = "Kubernetes Config Connector Service Account"
  project      = "my-gcp-project"
}

resource "google_project_iam_member" "kcc_owner" {
  project = "my-gcp-project"
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.kcc_sa.email}"
}

resource "google_service_account_iam_binding" "kcc_workload_identity" {
  service_account_id = google_service_account.kcc_sa.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]",
  ]
}
```

**Explanation:** KCC requires a GCP service account with permissions to create and manage the GCP resources it will reconcile — `roles/owner` is the broadest option (fine for a dev environment; use least-privilege in production). The Workload Identity binding authorises the `cnrm-controller-manager` Kubernetes service account in `cnrm-system` to impersonate the GCP service account without key files. This is the preferred authentication method for KCC in GKE.

---

### Example 32: KCC ConfigConnector Custom Resource

**Concept:** The `ConfigConnector` CRD instance configures how KCC authenticates to GCP.

```yaml
apiVersion: core.cnrm.cloud.google.com/v1beta1
kind: ConfigConnector
metadata:
  name: configconnector.core.cnrm.cloud.google.com
spec:
  mode: cluster
  googleServiceAccount: kcc-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** The `ConfigConnector` resource is cluster-scoped and tells the KCC operator which GCP service account to use for all reconciliation. `mode: cluster` means a single controller manages all KCC resources across all namespaces; `mode: namespaced` allows per-namespace service accounts for multi-tenant clusters. This YAML is typically applied via `kubectl apply` after the Helm release installs the CRDs.

---

### Example 33: KCC-Managed GCS Bucket Resource

**Concept:** Once KCC is installed, GCP resources are declared as Kubernetes objects using KCC's CRDs.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: my-kcc-managed-bucket
  namespace: config-control
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  location: us-central1
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
```

**Explanation:** KCC translates this `StorageBucket` Kubernetes object into the equivalent `google_storage_bucket` GCP API call. The `cnrm.cloud.google.com/project-id` annotation tells KCC which project to create the bucket in. The `namespace: config-control` is the conventional namespace for KCC resources managed by the cluster admin. KCC continuously reconciles — if the bucket is manually modified in GCP, KCC will revert it to match this spec.

---

### Example 34: Terraform null_resource to Apply KCC YAML

**Concept:** Using a `null_resource` with a `local-exec` provisioner to apply KCC manifests after Helm bootstraps the operator.

```hcl
resource "null_resource" "apply_kcc_config" {
  triggers = {
    cluster_id = google_container_cluster.my_gke_cluster.id
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud container clusters get-credentials my-gke-cluster \
        --region us-central1 \
        --project my-gcp-project
      kubectl apply -f ${path.module}/kcc-config/configconnector.yaml
    EOT
  }

  depends_on = [helm_release.kcc_operator]
}
```

**Explanation:** `null_resource` with `local-exec` is a pragmatic escape hatch for operations that have no native Terraform provider support, such as running `kubectl apply`. The `triggers` map ensures the provisioner re-runs if the cluster is replaced. This pattern is acceptable during bootstrapping but should be replaced with the `kubernetes_manifest` resource or a dedicated KCC Terraform provider once the CRDs are registered.

---

### Example 35: kubernetes_manifest for KCC Resources via Terraform

**Concept:** The `kubernetes_manifest` resource (from `hashicorp/kubernetes`) can manage KCC CRD instances directly in Terraform state.

```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
  }
}

resource "kubernetes_manifest" "kcc_config_connector" {
  manifest = {
    apiVersion = "core.cnrm.cloud.google.com/v1beta1"
    kind       = "ConfigConnector"
    metadata = {
      name = "configconnector.core.cnrm.cloud.google.com"
    }
    spec = {
      mode                 = "cluster"
      googleServiceAccount = "kcc-sa@my-gcp-project.iam.gserviceaccount.com"
    }
  }

  depends_on = [helm_release.kcc_operator]
}
```

**Explanation:** `kubernetes_manifest` is a flexible resource that can manage any Kubernetes resource, including Custom Resources, as long as the CRD exists in the cluster before the plan/apply. The `depends_on = [helm_release.kcc_operator]` is essential because KCC's CRDs are installed by the Helm chart — without it, Terraform would attempt to validate the manifest schema before the CRD exists. This is the cleanest Terraform-native approach to managing KCC resources.

---

### Example 36: Helm Release for cert-manager Post-Cluster

**Concept:** Deploying cert-manager via Helm after the GKE cluster is provisioned to manage TLS certificates.

```hcl
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "v1.14.4"

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "global.leaderElection.namespace"
    value = "cert-manager"
  }

  depends_on = [google_container_cluster.my_gke_cluster]
}
```

**Explanation:** cert-manager automates the issuance and renewal of TLS certificates from Let's Encrypt, Vault, or other ACME-compatible CAs. `installCRDs = true` is important for Helm-based cert-manager installs, as it deploys the CRDs as part of the chart rather than requiring a separate `kubectl apply`. This pattern — cluster first, then cert-manager, then application Helm releases — is a common GKE bootstrapping order.

---

### Example 37: Helm Release for External Secrets Operator

**Concept:** Deploying External Secrets Operator (ESO) to sync secrets from Secret Manager into Kubernetes.

```hcl
resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  namespace        = "external-secrets"
  create_namespace = true
  version          = "0.9.14"

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "serviceAccount.annotations.iam\\.gke\\.io/gcp-service-account"
    value = "eso-sa@my-gcp-project.iam.gserviceaccount.com"
  }

  depends_on = [
    google_container_cluster.my_gke_cluster,
    helm_release.cert_manager,
  ]
}
```

**Explanation:** ESO reads secrets from external stores (Cloud Secret Manager, HashiCorp Vault, AWS SSM) and creates native Kubernetes `Secret` objects. The `serviceAccount.annotations` set injects a Workload Identity annotation onto the ESO service account so it can authenticate to Secret Manager without key files. ESO is often deployed after cert-manager because some production configurations use cert-manager-issued certificates for ESO's webhook TLS.

---

### Example 38: Full Module Composition (locals + outputs)

**Concept:** Defining local values and outputs to make a full GKE + KCC module self-contained and reusable.

```hcl
locals {
  cluster_name  = "my-gke-cluster"
  region        = "us-central1"
  project_id    = "my-gcp-project"
  workload_pool = "${local.project_id}.svc.id.goog"
  kcc_sa_email  = "kcc-sa@${local.project_id}.iam.gserviceaccount.com"
}

output "cluster_endpoint" {
  description = "GKE cluster API server endpoint"
  value       = google_container_cluster.my_gke_cluster.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Base64-encoded CA certificate for cluster TLS"
  value       = google_container_cluster.my_gke_cluster.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "kcc_service_account_email" {
  description = "Email of the GCP SA used by KCC"
  value       = google_service_account.kcc_sa.email
}
```

**Explanation:** Using `locals` for repeated values like `project_id` and `region` prevents copy-paste errors when the same string is needed in multiple resources. Marking `cluster_endpoint` and `cluster_ca_certificate` as `sensitive = true` prevents Terraform from printing them to stdout, protecting credentials in CI logs. These outputs allow a root module to consume the cluster's connection parameters and pass them to child modules (e.g., the Helm provider configuration).

---

## ADVANCED (Examples 39–50)

---

### Example 39: GKE Autopilot Cluster with Terraform

**Concept:** Autopilot clusters abstract node management entirely, with GCP managing node provisioning and scaling.

```hcl
resource "google_container_cluster" "autopilot_cluster" {
  name             = "my-gke-cluster"
  location         = "us-central1"
  enable_autopilot = true

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  network    = google_compute_network.vpc.self_link
  subnetwork = google_compute_subnetwork.subnet.self_link
}
```

**Explanation:** `enable_autopilot = true` fundamentally changes the cluster model — there are no node pools to manage, no `remove_default_node_pool`, and no `initial_node_count`. GCP provisions, scales, patches, and deletes nodes automatically based on pod resource requests. Many cluster-level settings (like `cluster_autoscaling`) are unavailable in Autopilot mode. Billing shifts from node-hour to pod-second, which often reduces costs for variable-load workloads.

---

### Example 40: Autopilot with Spot Pods Configuration

**Concept:** Autopilot supports spot (preemptible) pod scheduling for cost reduction on fault-tolerant workloads.

```hcl
resource "google_container_cluster" "autopilot_cluster" {
  name             = "my-gke-cluster"
  location         = "us-central1"
  enable_autopilot = true

  release_channel {
    channel = "REGULAR"
  }
}
```

```yaml
# Pod spec requesting Autopilot Spot scheduling
apiVersion: v1
kind: Pod
metadata:
  name: spot-workload
spec:
  nodeSelector:
    cloud.google.com/gke-spot: "true"
  terminationGracePeriodSeconds: 25
  containers:
  - name: app
    image: my-app:latest
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
```

**Explanation:** In GKE Autopilot, Spot scheduling is requested at the pod level via the `cloud.google.com/gke-spot: "true"` node selector, rather than at the node pool level as in Standard clusters. Autopilot will then schedule the pod on Spot infrastructure at a discount. The `terminationGracePeriodSeconds: 25` is set below the 30-second maximum preemption notice to ensure the pod terminates cleanly. This pattern reduces costs by 60-91% for batch, ML training, or CI workloads.

---

### Example 41: Multi-Cluster Federation with Fleet API

**Concept:** Registering multiple GKE clusters to a Fleet enables multi-cluster services and policy management.

```hcl
resource "google_gke_hub_membership" "cluster_membership" {
  membership_id = "my-gke-cluster-membership"
  project       = "my-gcp-project"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.my_gke_cluster.id}"
    }
  }

  authority {
    issuer = "https://container.googleapis.com/v1/${google_container_cluster.my_gke_cluster.id}"
  }
}

resource "google_gke_hub_feature" "multicluster_ingress" {
  name     = "multiclusteringress"
  location = "global"
  project  = "my-gcp-project"

  spec {
    multiclusteringress {
      config_membership = google_gke_hub_membership.cluster_membership.id
    }
  }
}
```

**Explanation:** `google_gke_hub_membership` registers a GKE cluster with Anthos Fleet, which is the prerequisite for multi-cluster features like Multi-Cluster Ingress (MCI), Multi-Cluster Services (MCS), and Config Sync. `resource_link` uses the `//container.googleapis.com/` prefix — a full resource URI. The `authority.issuer` field enables Workload Identity Federation at the fleet level, allowing cross-cluster pod identity.

---

### Example 42: Reusable Terraform Module for GKE Cluster

**Concept:** Packaging the cluster configuration as a Terraform module with typed input variables and outputs.

```hcl
# modules/gke-cluster/variables.tf
variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "cluster_name" {
  type        = string
  description = "GKE cluster name"
  default     = "my-gke-cluster"
}

variable "region" {
  type        = string
  description = "GCP region for the cluster"
  default     = "us-central1"
}

variable "release_channel" {
  type        = string
  description = "GKE release channel: RAPID, REGULAR, or STABLE"
  default     = "REGULAR"
  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE"], var.release_channel)
    error_message = "release_channel must be RAPID, REGULAR, or STABLE."
  }
}

variable "enable_private_nodes" {
  type    = bool
  default = true
}
```

**Explanation:** The `validation` block enforces allowed values at `terraform plan` time, failing fast with a clear error message rather than a cryptic API error. Wrapping the cluster in a module with well-typed variables allows multiple teams to create clusters with consistent defaults while overriding only what they need. The module pattern also enables governance: the platform team maintains the module and teams consume versioned releases.

---

### Example 43: Module Invocation and Version Pinning

**Concept:** Calling a versioned GKE module from a root configuration to provision a production cluster.

```hcl
module "gke_cluster" {
  source  = "git::https://github.com/my-org/terraform-gke-module.git?ref=v2.3.0"

  project_id           = "my-gcp-project"
  cluster_name         = "my-gke-cluster"
  region               = "us-central1"
  release_channel      = "STABLE"
  enable_private_nodes = true

  node_pools = [
    {
      name         = "general-pool"
      machine_type = "e2-standard-4"
      min_count    = 1
      max_count    = 10
      disk_size_gb = 100
    }
  ]
}
```

**Explanation:** Pinning the module source to a Git tag (`?ref=v2.3.0`) ensures that all environments consuming the module use identical infrastructure code, preventing configuration skew across dev/staging/prod. The `node_pools` input uses a list-of-objects type, enabling the module to create multiple node pools with a `for_each` or `count` internally. Module versioning via Git tags is the GitOps equivalent of library versioning.

---

### Example 44: Cluster Upgrade Strategy – Blue/Green Node Pools

**Concept:** Performing a zero-downtime Kubernetes node upgrade by creating a new pool and draining the old one.

```hcl
# Step 1: Create the new node pool with the upgraded version
resource "google_container_node_pool" "nodes_v2" {
  name     = "primary-pool-v2"
  location = "us-central1"
  cluster  = google_container_cluster.my_gke_cluster.name

  version    = "1.30.2-gke.1587003"
  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  management {
    auto_repair  = true
    auto_upgrade = false
  }
}

# Step 2 (separate apply): Remove old node pool after workloads drain
# resource "google_container_node_pool" "nodes_v1" { ... } # <- delete this block
```

**Explanation:** The blue/green node pool strategy creates a parallel pool running the new version, waits for workloads to reschedule via natural disruption or `kubectl drain`, then removes the old pool. `auto_upgrade = false` on the new pool prevents GKE from changing the version during the migration window. This approach is safer than in-place surge upgrades because you can immediately roll back by scaling up the old pool if issues arise.

---

### Example 45: Terraform Import of an Existing GKE Cluster

**Concept:** Bringing an existing GKE cluster under Terraform management without recreation.

```bash
# Step 1: Write the Terraform resource block matching the existing cluster
# resource "google_container_cluster" "my_gke_cluster" {
#   name     = "my-gke-cluster"
#   location = "us-central1"
#   ...
# }

# Step 2: Import the existing cluster into Terraform state
terraform import \
  google_container_cluster.my_gke_cluster \
  "projects/my-gcp-project/locations/us-central1/clusters/my-gke-cluster"

# Step 3: Generate a plan to detect configuration drift
terraform plan

# Step 4 (optional): Use import block for declarative import (Terraform >= 1.5)
```

```hcl
# Declarative import block (Terraform >= 1.5)
import {
  to = google_container_cluster.my_gke_cluster
  id = "projects/my-gcp-project/locations/us-central1/clusters/my-gke-cluster"
}
```

**Explanation:** The import resource ID for GKE clusters follows the format `projects/<PROJECT>/locations/<LOCATION>/clusters/<CLUSTER_NAME>`. The declarative `import` block (available since Terraform 1.5) is preferred over the CLI command because it is repeatable and reviewable in pull requests. After import, always run `terraform plan` to identify drift — fields not specified in the Terraform config will appear as planned changes.

---

### Example 46: Terraform Cloud Remote State for GKE

**Concept:** Using Terraform Cloud as a remote backend stores state securely and enables team collaboration.

```hcl
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      name = "gke-production"
    }
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Remote state data source -- read outputs from another workspace
data "terraform_remote_state" "networking" {
  backend = "remote"

  config = {
    organization = "my-org"
    workspaces = {
      name = "networking-production"
    }
  }
}

resource "google_container_cluster" "my_gke_cluster" {
  name       = "my-gke-cluster"
  location   = "us-central1"
  network    = data.terraform_remote_state.networking.outputs.vpc_self_link
  subnetwork = data.terraform_remote_state.networking.outputs.subnet_self_link

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** The `terraform.cloud` block configures Terraform Cloud as both the remote backend (state storage) and the execution environment. `terraform_remote_state` allows the GKE workspace to consume VPC and subnet outputs from a separate networking workspace, enforcing a clean separation of concerns without hard-coding resource IDs. Terraform Cloud also provides state locking, preventing concurrent applies that could corrupt the GKE cluster state.

---

### Example 47: Post-Cluster Helm Release – NGINX Ingress

**Concept:** Installing the NGINX ingress controller as a Helm release after the cluster is provisioned.

```hcl
resource "helm_release" "nginx_ingress" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  version          = "4.10.1"

  values = [
    yamlencode({
      controller = {
        service = {
          type = "LoadBalancer"
          annotations = {
            "cloud.google.com/load-balancer-type" = "External"
          }
        }
        replicaCount = 2
        resources = {
          requests = { cpu = "100m", memory = "90Mi" }
          limits   = { cpu = "500m", memory = "256Mi" }
        }
      }
    })
  ]

  depends_on = [google_container_cluster.my_gke_cluster]
}
```

**Explanation:** The `values` block accepts a list of YAML strings — using `yamlencode` with a Terraform map keeps the values type-safe and avoids heredoc indentation issues. The `cloud.google.com/load-balancer-type: External` annotation instructs GKE to provision an external Network Load Balancer for the ingress controller service. `depends_on` ensures the Helm provider has a live cluster endpoint before attempting the installation.

---

### Example 48: Helm Release with Sensitive Values from Secret Manager

**Concept:** Injecting secrets from GCP Secret Manager into a Helm release without storing them in Terraform state.

```hcl
data "google_secret_manager_secret_version" "db_password" {
  secret  = "my-db-password"
  project = "my-gcp-project"
}

resource "helm_release" "my_app" {
  name      = "my-app"
  chart     = "./charts/my-app"
  namespace = "production"

  set_sensitive {
    name  = "database.password"
    value = data.google_secret_manager_secret_version.db_password.secret_data
  }

  set {
    name  = "image.tag"
    value = "v1.2.3"
  }

  depends_on = [google_container_cluster.my_gke_cluster]
}
```

**Explanation:** `set_sensitive` behaves identically to `set` but marks the value as sensitive in the Terraform plan output, preventing it from appearing in logs or the Terraform Cloud UI. The value is still stored in Terraform state (which must be encrypted at rest — Terraform Cloud does this automatically). Using `google_secret_manager_secret_version` as the source ensures the secret is read fresh on each apply, picking up rotations automatically.

---

### Example 49: GKE Cluster with Config Sync (GitOps)

**Concept:** Enabling Config Sync through the GKE Fleet feature to drive GitOps-based cluster configuration.

```hcl
resource "google_gke_hub_feature" "config_management" {
  name     = "configmanagement"
  location = "global"
  project  = "my-gcp-project"
}

resource "google_gke_hub_feature_membership" "cluster_config_sync" {
  location   = "global"
  feature    = google_gke_hub_feature.config_management.name
  membership = google_gke_hub_membership.cluster_membership.membership_id
  project    = "my-gcp-project"

  configmanagement {
    config_sync {
      git {
        sync_repo   = "https://github.com/my-org/cluster-config"
        sync_branch = "main"
        policy_dir  = "clusters/production"
        secret_type = "none"
      }
    }
    policy_controller {
      enabled = true
    }
  }
}
```

**Explanation:** Config Sync continuously reconciles cluster state from a Git repository, implementing the GitOps pattern at the GKE Fleet level. `policy_dir` scopes which directory in the repo applies to this cluster, enabling a mono-repo structure where `clusters/production/` and `clusters/staging/` are independent. `policy_controller.enabled = true` also activates Gatekeeper-based policy enforcement using `ConstraintTemplate` and `Constraint` objects committed to the same repo.

---

### Example 50: Complete End-to-End Configuration (Cluster + KCC + Helm)

**Concept:** A single Terraform configuration that provisions the VPC, the GKE cluster, bootstraps KCC via Helm, and deploys an application Helm chart.

```hcl
terraform {
  required_providers {
    google     = { source = "hashicorp/google",     version = "~> 5.0"  }
    helm       = { source = "hashicorp/helm",       version = "~> 2.13" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.27" }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

data "google_client_config" "default" {}

# -- Networking ---------------------------------------------------------------
resource "google_compute_network" "vpc" {
  name                    = "my-gke-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "my-gke-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = "us-central1"
  network       = google_compute_network.vpc.self_link

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.0.0/16"
  }
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.30.0.0/20"
  }
}

# -- GKE Cluster --------------------------------------------------------------
resource "google_container_cluster" "my_gke_cluster" {
  name       = "my-gke-cluster"
  location   = "us-central1"
  network    = google_compute_network.vpc.self_link
  subnetwork = google_compute_subnetwork.subnet.self_link

  release_channel     { channel = "REGULAR" }
  deletion_protection = false

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary" {
  name     = "primary-pool"
  location = "us-central1"
  cluster  = google_container_cluster.my_gke_cluster.name

  initial_node_count = 1
  autoscaling {
    min_node_count = 1
    max_node_count = 5
  }

  node_config {
    machine_type = "e2-standard-4"
    workload_metadata_config { mode = "GKE_METADATA" }
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}

# -- Providers (post-cluster) -------------------------------------------------
provider "helm" {
  kubernetes {
    host  = "https://${google_container_cluster.my_gke_cluster.endpoint}"
    token = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(
      google_container_cluster.my_gke_cluster.master_auth[0].cluster_ca_certificate
    )
  }
}

provider "kubernetes" {
  host  = "https://${google_container_cluster.my_gke_cluster.endpoint}"
  token = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(
    google_container_cluster.my_gke_cluster.master_auth[0].cluster_ca_certificate
  )
}

# -- KCC Bootstrap ------------------------------------------------------------
resource "google_service_account" "kcc_sa" {
  account_id   = "kcc-sa"
  display_name = "KCC Service Account"
}

resource "google_project_iam_member" "kcc_owner" {
  project = "my-gcp-project"
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.kcc_sa.email}"
}

resource "google_service_account_iam_binding" "kcc_wi" {
  service_account_id = google_service_account.kcc_sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:my-gcp-project.svc.id.goog[cnrm-system/cnrm-controller-manager]",
  ]
}

resource "helm_release" "kcc" {
  name             = "kcc-operator"
  chart            = "config-connector"
  namespace        = "cnrm-system"
  create_namespace = true
  version          = "1.119.0"
  depends_on       = [google_container_node_pool.primary]
}

resource "kubernetes_manifest" "config_connector" {
  manifest = {
    apiVersion = "core.cnrm.cloud.google.com/v1beta1"
    kind       = "ConfigConnector"
    metadata   = { name = "configconnector.core.cnrm.cloud.google.com" }
    spec = {
      mode                 = "cluster"
      googleServiceAccount = google_service_account.kcc_sa.email
    }
  }
  depends_on = [helm_release.kcc]
}

# -- Application Helm Release -------------------------------------------------
resource "helm_release" "my_app" {
  name             = "my-app"
  chart            = "./charts/my-app"
  namespace        = "production"
  create_namespace = true
  version          = "1.0.0"

  set { name = "replicaCount", value = "2" }
  set { name = "image.tag",    value = "latest" }

  depends_on = [kubernetes_manifest.config_connector]
}

# -- Outputs ------------------------------------------------------------------
output "cluster_endpoint" {
  value     = google_container_cluster.my_gke_cluster.endpoint
  sensitive = true
}

output "kcc_sa_email" {
  value = google_service_account.kcc_sa.email
}
```

**Explanation:** This end-to-end configuration demonstrates the full provisioning pipeline in a single Terraform root module: networking (VPC + subnet with secondary ranges), a private regional GKE cluster with Workload Identity and a node pool, Helm and Kubernetes providers configured using the cluster's live credentials, KCC bootstrapped via Helm and activated via a `kubernetes_manifest`, and finally an application Helm release that depends on the KCC layer being healthy. The dependency chain — networking -> cluster -> node pool -> KCC Helm -> KCC manifest -> app Helm — is explicit through `depends_on` and implicit attribute references, ensuring every `terraform apply` succeeds in a single pass.

---
