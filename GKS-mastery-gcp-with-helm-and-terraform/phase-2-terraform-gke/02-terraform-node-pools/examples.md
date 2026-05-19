# Terraform GKE Node Pools — 50 Examples
## Integrating KCC and Helm Patterns

---

## BASIC (Examples 1–13)

---

### Example 1: Minimal Node Pool with Default Settings
**Concept:** Create the simplest possible node pool attached to an existing GKE cluster.
```hcl
resource "google_container_node_pool" "default" {
  name       = "default-pool"
  cluster    = "my-gke-cluster"
  location   = "us-central1"
  project    = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** This is the minimal viable node pool definition in Terraform. The `node_count` sets the static number of nodes per zone. The `oauth_scopes` field grants cloud-platform access so workloads can call GCP APIs. No autoscaling is configured, so the count remains fixed.

---

### Example 2: Node Pool with e2-standard-4 Machine Type
**Concept:** Provision a general-purpose node pool using the cost-efficient `e2-standard-4` machine type.
```hcl
resource "google_container_node_pool" "general" {
  name     = "general-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-balanced"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `e2-standard-4` provides 4 vCPUs and 16 GB memory and is ideal for general web and application workloads. The `pd-balanced` disk type offers a balance between cost and IOPS. Disk size is set to 100 GB to accommodate container images and local ephemeral storage.

---

### Example 3: Node Pool with n2-standard-8 Machine Type
**Concept:** Use the `n2-standard-8` machine type for compute-intensive workloads needing higher single-core performance.
```hcl
resource "google_container_node_pool" "compute" {
  name     = "compute-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 2

  node_config {
    machine_type = "n2-standard-8"
    disk_size_gb = 200
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `n2-standard-8` offers 8 vCPUs and 32 GB RAM with higher sustained CPU performance compared to the E2 series. The `pd-ssd` disk type is selected here to reduce I/O latency for data-heavy processes. This pool is suitable for batch jobs, CI runners, or CPU-bound microservices.

---

### Example 4: Node Pool with n2d-highmem-16 Machine Type
**Concept:** Deploy a memory-optimized pool using `n2d-highmem-16` for applications requiring large in-memory datasets.
```hcl
resource "google_container_node_pool" "highmem" {
  name     = "highmem-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 2

  node_config {
    machine_type = "n2d-highmem-16"
    disk_size_gb = 256
    disk_type    = "pd-ssd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `n2d-highmem-16` provides 16 vCPUs and 128 GB RAM using AMD EPYC processors, making it highly cost-effective for memory-intensive workloads like in-memory caches, analytics engines, or JVM-based services. High-memory machines benefit from fast SSD disks to prevent I/O from becoming a bottleneck. This pool is suitable for Redis, Elasticsearch, or large Spark executors.

---

### Example 5: Node Pool with pd-ssd Disk Type
**Concept:** Explicitly configure a node pool to use SSD-backed persistent disks for low-latency disk I/O.
```hcl
resource "google_container_node_pool" "ssd_pool" {
  name     = "ssd-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `pd-ssd` disk type delivers consistent high IOPS, which is beneficial for workloads with frequent container image pulls or applications that write to the node's local filesystem. `COS_CONTAINERD` is Google's recommended hardened OS image with containerd as the runtime. SSD disks cost more than `pd-balanced` but are worth it for latency-sensitive services.

---

### Example 6: Node Pool with pd-balanced Disk Type
**Concept:** Use `pd-balanced` disks as a cost-performance middle ground for typical production workloads.
```hcl
resource "google_container_node_pool" "balanced_pool" {
  name     = "balanced-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 4

  node_config {
    machine_type = "n2-standard-8"
    disk_size_gb = 150
    disk_type    = "pd-balanced"
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `pd-balanced` disk type uses zonal persistent disks that balance performance (moderate IOPS) and cost, making it the default recommendation for most production clusters. It is less expensive than `pd-ssd` while still providing better performance than standard (`pd-standard`) disks. For mixed workloads that are not I/O-bound, `pd-balanced` is the pragmatic choice.

---

### Example 7: Setting initial_node_count
**Concept:** Use `initial_node_count` to set the starting node count, which autoscaling can later adjust.
```hcl
resource "google_container_node_pool" "autoscaled" {
  name     = "autoscaled-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 2

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `initial_node_count` is the count per zone when the pool is first created; after creation, the cluster autoscaler takes control. When autoscaling is enabled, Terraform ignores subsequent changes to `node_count` after creation to avoid conflicts with autoscaler state. Setting `initial_node_count` to a reasonable baseline avoids cold-start latency when traffic arrives.

---

### Example 8: Static node_count Without Autoscaling
**Concept:** Pin a node pool to a fixed number of nodes using `node_count` when autoscaling is not desired.
```hcl
resource "google_container_node_pool" "static_pool" {
  name     = "static-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 5

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-balanced"
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Using a static `node_count` without an `autoscaling` block keeps the node count constant regardless of cluster load. This approach is used for predictable batch workloads or cost-controlled environments where over-provisioning is acceptable. Terraform will manage scaling only through explicit `node_count` changes in the configuration. A static pool is simpler to reason about but less resilient to traffic spikes.

---

### Example 9: Node Pool with Node Labels
**Concept:** Apply Kubernetes node labels to a pool so workloads can use `nodeSelector` to target specific nodes.
```hcl
resource "google_container_node_pool" "labeled" {
  name     = "labeled-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    labels = {
      environment = "production"
      team        = "backend"
      pool-type   = "general"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Node labels in `node_config.labels` become Kubernetes node labels accessible via `kubectl get nodes --show-labels`. Workloads can use `nodeSelector` or `nodeAffinity` in their pod specs to schedule on nodes with matching labels. Labels are a lightweight way to segregate workloads without using taints, which would actively repel pods that don't tolerate them.

---

### Example 10: Node Pool with Resource Tags
**Concept:** Add GCP network tags to nodes to apply firewall rules selectively to the node pool.
```hcl
resource "google_container_node_pool" "tagged" {
  name     = "tagged-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    tags = ["gke-node", "backend-pool", "allow-internal"]

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** GCP network tags on GKE nodes allow you to create VPC firewall rules that apply only to those nodes. Tags are different from Kubernetes labels — they live at the Compute Engine VM level and control network access. For example, a firewall rule with target tag `allow-internal` can permit traffic from other internal services while blocking external access.

---

### Example 11: Node Pool with Metadata
**Concept:** Set instance metadata on nodes to configure startup behavior or pass custom parameters to workloads.
```hcl
resource "google_container_node_pool" "with_metadata" {
  name     = "metadata-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    metadata = {
      disable-legacy-endpoints = "true"
      cluster-name             = "my-gke-cluster"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `disable-legacy-endpoints = "true"` metadata key is a security best practice that blocks access to the deprecated v0.1 and v1beta1 metadata endpoints, which expose sensitive instance information. Custom metadata keys can also be read by workloads via the GCE metadata server at `http://metadata.google.internal`. This is useful for injecting non-secret configuration without a ConfigMap.

---

### Example 12: Node Pool Linked to a Specific Cluster Data Source
**Concept:** Reference the GKE cluster via a data source to avoid hardcoding cluster attributes in the node pool resource.
```hcl
data "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"
}

resource "google_container_node_pool" "linked" {
  name     = "linked-pool"
  cluster  = data.google_container_cluster.primary.name
  location = data.google_container_cluster.primary.location
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Using a `data` source to look up the cluster decouples the node pool definition from hardcoded strings, making it safer to refactor cluster names or locations. If the cluster is managed in a separate Terraform workspace or root module, the data source approach allows cross-module referencing. This pattern is especially useful in multi-team environments where platform and application teams own separate configurations.

---

### Example 13: Node Pool with Service Account
**Concept:** Assign a dedicated GCP service account to node pool VMs instead of using the default compute service account.
```hcl
resource "google_service_account" "node_sa" {
  account_id   = "gke-node-sa"
  display_name = "GKE Node Service Account"
  project      = "my-gcp-project"
}

resource "google_container_node_pool" "with_sa" {
  name     = "sa-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type    = "e2-standard-4"
    disk_type       = "pd-balanced"
    disk_size_gb    = 100
    service_account = google_service_account.node_sa.email

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Using a dedicated service account for nodes follows the principle of least privilege — you grant only the IAM roles needed for the node pool's workloads rather than the broad permissions on the default compute SA. This reduces the blast radius of a compromised node. The `oauth_scopes` still needs `cloud-platform` when using a custom SA to let the SA's IAM bindings take effect.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: Node Pool with Autoscaling (Min/Max Node Counts)
**Concept:** Enable the GKE cluster autoscaler to dynamically add or remove nodes within defined bounds.
```hcl
resource "google_container_node_pool" "autoscaling" {
  name     = "autoscaling-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 3

  autoscaling {
    min_node_count = 2
    max_node_count = 20
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `autoscaling` block delegates node count management to the GKE cluster autoscaler. Nodes are added when pods cannot be scheduled due to resource pressure and removed when nodes have been underutilized for a configurable period. Setting `min_node_count = 2` ensures there are always at least two nodes for high availability across zones. The `max_node_count` caps cost exposure.

---

### Example 15: Node Pool with Node Taints
**Concept:** Apply Kubernetes node taints to a pool to reserve it for workloads that explicitly tolerate those taints.
```hcl
resource "google_container_node_pool" "tainted" {
  name     = "dedicated-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200

    taint {
      key    = "dedicated"
      value  = "backend"
      effect = "NO_SCHEDULE"
    }

    labels = {
      dedicated = "backend"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Taints prevent pods from being scheduled on a node unless the pod has a matching `toleration`. The `NO_SCHEDULE` effect means new pods without the toleration will not be placed on these nodes; existing pods are unaffected. Pairing a taint with a matching node label is a common pattern — workloads use `nodeAffinity` for the label and `tolerations` for the taint to ensure they land on the right nodes.

---

### Example 16: Node Pool with Multiple Taints
**Concept:** Apply multiple taints to a node pool to enforce strict workload isolation with different eviction behaviors.
```hcl
resource "google_container_node_pool" "multi_tainted" {
  name     = "gpu-dedicated-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 2

  node_config {
    machine_type = "n1-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200

    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    taint {
      key    = "workload-type"
      value  = "ml-training"
      effect = "PREFER_NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Multiple taints can be applied to a single node pool, and a pod must tolerate all of them to be scheduled. `NO_SCHEDULE` is a hard restriction, while `PREFER_NO_SCHEDULE` is a soft hint that allows scheduling if no other nodes are available. This dual-taint pattern ensures GPU machines are reserved for ML workloads while gracefully handling scheduling edge cases during scale events.

---

### Example 17: Preemptible Node Pool
**Concept:** Use preemptible VMs for a node pool to significantly reduce costs for fault-tolerant batch workloads.
```hcl
resource "google_container_node_pool" "preemptible" {
  name     = "preemptible-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 5

  autoscaling {
    min_node_count = 2
    max_node_count = 30
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    preemptible  = true

    labels = {
      node-type = "preemptible"
    }

    taint {
      key    = "cloud.google.com/gke-preemptible"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Preemptible VMs cost up to 80% less than regular VMs but can be reclaimed by GCP with 30 seconds notice. They are suitable for stateless, batch, or embarrassingly parallel workloads. Adding the `cloud.google.com/gke-preemptible` taint ensures only workloads designed to handle interruptions are scheduled here. Combine with autoscaling to replenish preempted nodes automatically.

---

### Example 18: Spot Node Pool (Successor to Preemptible)
**Concept:** Use Spot VMs, which replace preemptible VMs with more flexible pricing and no 24-hour reclamation limit.
```hcl
resource "google_container_node_pool" "spot" {
  name     = "spot-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 4

  autoscaling {
    min_node_count = 0
    max_node_count = 50
  }

  node_config {
    machine_type = "e2-standard-8"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    spot         = true

    labels = {
      node-lifecycle = "spot"
    }

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Spot VMs replace preemptible VMs as GCP's recommended low-cost option; unlike preemptible VMs, Spot VMs have no maximum runtime. Setting `min_node_count = 0` allows the pool to fully scale down when no spot workloads are running, minimizing costs further. The GKE-managed taint `cloud.google.com/gke-spot` is automatically applied when `spot = true` — explicitly defining it here ensures Terraform tracks it.

---

### Example 19: Node Pool Upgrade Strategy — max_surge and max_unavailable
**Concept:** Configure a rolling upgrade strategy to control how many nodes can be simultaneously updated or removed during a node pool upgrade.
```hcl
resource "google_container_node_pool" "upgradeable" {
  name     = "upgradeable-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 6

  upgrade_settings {
    max_surge       = 2
    max_unavailable = 1
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```
**Explanation:** `max_surge` defines how many extra nodes are created temporarily during an upgrade, allowing new nodes to come up before old ones are drained. `max_unavailable` sets the maximum number of nodes that can be simultaneously unavailable (draining or down). A combination of `max_surge = 2` and `max_unavailable = 1` provides a blue-green-like rolling upgrade that maintains capacity. Enabling `auto_repair` and `auto_upgrade` allows GKE to handle node health and version management automatically.

---

### Example 20: Node Pool with Surge-Only Upgrade (Zero Disruption)
**Concept:** Configure an upgrade strategy with zero unavailable nodes to ensure uninterrupted service during upgrades.
```hcl
resource "google_container_node_pool" "zero_disruption" {
  name     = "zero-disruption-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 4

  upgrade_settings {
    max_surge       = 4
    max_unavailable = 0
  }

  node_config {
    machine_type = "n2-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
```
**Explanation:** Setting `max_unavailable = 0` guarantees that no node is taken offline until a replacement is fully available and healthy. The `max_surge = 4` allows the entire node pool to be doubled temporarily during an upgrade, which costs more but is critical for SLA-bound production services. This pattern is often called a "surge-and-drain" upgrade and is recommended for stateful workloads or those with strict availability requirements.

---

### Example 21: Node Pool with gVisor Sandbox (Sandbox Config)
**Concept:** Enable gVisor (GKE Sandbox) on a node pool to run untrusted container workloads with a kernel-level sandbox.
```hcl
resource "google_container_node_pool" "gvisor" {
  name     = "gvisor-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2-standard-4"
    disk_type    = "pd-ssd"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

    sandbox_config {
      sandbox_type = "gvisor"
    }

    labels = {
      sandbox = "gvisor"
    }

    taint {
      key    = "sandbox.gke.io/runtime"
      value  = "gvisor"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** gVisor provides a user-space kernel that intercepts container syscalls, reducing the attack surface compared to standard Linux namespaces. The `sandbox_config.sandbox_type = "gvisor"` field instructs GKE to configure the node with the gVisor runtime class. Pairing this with a taint and label ensures only pods that explicitly request the `gvisor` runtime class are scheduled on these nodes. This pool is ideal for multi-tenant SaaS platforms running customer-provided code.

---

### Example 22: Node Pool with Workload Identity
**Concept:** Enable Workload Identity on a node pool so pods can authenticate to GCP services using Kubernetes service accounts mapped to GCP service accounts.
```hcl
resource "google_service_account" "workload_sa" {
  account_id   = "gke-workload-sa"
  display_name = "GKE Workload Identity SA"
  project      = "my-gcp-project"
}

resource "google_container_node_pool" "workload_identity" {
  name     = "wi-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type    = "e2-standard-4"
    disk_type       = "pd-balanced"
    disk_size_gb    = 100
    service_account = google_service_account.workload_sa.email

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `workload_metadata_config.mode = "GKE_METADATA"` enables the GKE metadata server on each node, intercepting calls to the instance metadata endpoint and returning Workload Identity tokens instead. This allows pods using Kubernetes service accounts (with a corresponding IAM binding) to authenticate to GCP APIs without storing long-lived credentials. The node pool's service account still needs basic permissions, but workload-level access is controlled through Workload Identity bindings.

---

### Example 23: Node Pool Auto-Repair and Auto-Upgrade Management
**Concept:** Enable automatic node repair and upgrade management to reduce operational toil.
```hcl
resource "google_container_node_pool" "managed" {
  name     = "managed-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 4

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `auto_repair = true` instructs GKE to detect and replace nodes that fail health checks, such as nodes stuck in `NotReady` state. `auto_upgrade = true` keeps nodes on the same minor version as the control plane following the GKE release schedule. These are both enabled by default in Standard mode clusters but should be explicitly set in Terraform to prevent configuration drift. Combining with `upgrade_settings` gives fine-grained control over the upgrade rollout.

---

### Example 24: Node Pool with Shielded Instance Config
**Concept:** Enable Shielded VM features on node pool instances to provide verifiable integrity and protection against rootkits.
```hcl
resource "google_container_node_pool" "shielded" {
  name     = "shielded-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2-standard-4"
    disk_type    = "pd-ssd"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

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
**Explanation:** Shielded VMs provide cryptographic verification of the boot sequence via Secure Boot, Measured Boot, and vTPM. `enable_secure_boot = true` blocks execution of unsigned boot components and kernel modules, hardening nodes against bootkit attacks. `enable_integrity_monitoring = true` sends integrity measurements to Cloud Monitoring, allowing anomaly detection if the boot baseline changes. These settings are required by many compliance frameworks like FedRAMP and PCI-DSS.

---

### Example 25: Node Pool Version Pinning
**Concept:** Pin a node pool to a specific Kubernetes version independently of the cluster control plane version.
```hcl
resource "google_container_node_pool" "pinned_version" {
  name     = "pinned-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  version    = "1.29.4-gke.1000001"
  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  management {
    auto_repair  = true
    auto_upgrade = false
  }
}
```
**Explanation:** Pinning the `version` field prevents GKE's auto-upgrade from moving node pools forward, which is useful when testing application compatibility before cluster-wide upgrades. GKE allows node pools to be up to two minor versions behind the control plane. Setting `auto_upgrade = false` with a pinned version requires manual intervention to upgrade, which is appropriate for regulated environments with change approval processes.

---

### Example 26: Node Pool with Local SSD
**Concept:** Attach local NVMe SSDs to nodes for extremely high throughput and low-latency ephemeral storage.
```hcl
resource "google_container_node_pool" "local_ssd" {
  name     = "local-ssd-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 2

  node_config {
    machine_type    = "n2-standard-8"
    disk_type       = "pd-ssd"
    disk_size_gb    = 100
    local_ssd_count = 2
    image_type      = "COS_CONTAINERD"

    labels = {
      storage-type = "local-ssd"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Local SSDs are physically attached NVMe drives providing over 660,000 IOPS per disk, far exceeding even `pd-ssd`. They are ephemeral — data is lost when the VM stops — so they are suitable for scratch space, database write-ahead logs, or high-speed caches. `local_ssd_count = 2` attaches two 375 GB NVMe partitions per node. Applications must mount the local SSDs explicitly via a DaemonSet or init container.

---

## NESTED (Examples 27–38)

---

### Example 27: Multiple Specialized Node Pools — System and Application
**Concept:** Define separate system and application node pools in a single Terraform configuration for workload isolation.
```hcl
# System node pool for GKE add-ons and Kubernetes components
resource "google_container_node_pool" "system" {
  name     = "system-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 1

  node_config {
    machine_type = "e2-standard-2"
    disk_type    = "pd-balanced"
    disk_size_gb = 50

    labels = {
      "cloud.google.com/gke-nodepool" = "system-pool"
      node-role                       = "system"
    }

    taint {
      key    = "CriticalAddonsOnly"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}

# Application node pool for user workloads
resource "google_container_node_pool" "application" {
  name     = "application-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 3

  autoscaling {
    min_node_count = 2
    max_node_count = 15
  }

  node_config {
    machine_type = "n2-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200

    labels = {
      node-role = "application"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Separating system and application pools is a GKE best practice that prevents user workloads from competing with critical cluster components like kube-dns, metrics-server, or Anthos Service Mesh. The system pool uses smaller machines and has a `CriticalAddonsOnly` taint, which only GKE-managed add-ons tolerate. The application pool uses larger machines with autoscaling to serve user traffic.

---

### Example 28: GPU Node Pool with nvidia-tesla-t4
**Concept:** Add a GPU-enabled node pool using `nvidia-tesla-t4` accelerators for ML inference workloads.
```hcl
resource "google_container_node_pool" "gpu" {
  name     = "gpu-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 1

  autoscaling {
    min_node_count = 0
    max_node_count = 5
  }

  node_config {
    machine_type = "n1-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    guest_accelerator {
      type  = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "DEFAULT"
      }
    }

    labels = {
      accelerator = "nvidia-tesla-t4"
    }

    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `guest_accelerator` block attaches GPU hardware to each node. Setting `min_node_count = 0` allows the pool to scale completely down when no GPU workloads are pending, which is essential for cost control since GPU machines are expensive. The taint ensures only pods with a `nvidia.com/gpu` toleration and resource request land on these nodes. The `gpu_driver_version = "DEFAULT"` option uses GKE's managed driver installer, eliminating the need for a separate DaemonSet.

---

### Example 29: Spot Node Pool for Cost Optimization
**Concept:** Create a dedicated spot VM pool alongside standard pools to run batch and non-critical workloads at reduced cost.
```hcl
resource "google_container_node_pool" "spot_batch" {
  name     = "spot-batch-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 2

  autoscaling {
    min_node_count = 0
    max_node_count = 50
  }

  node_config {
    machine_type = "e2-standard-8"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    spot         = true

    labels = {
      node-lifecycle = "spot"
      workload-class = "batch"
    }

    taint {
      key    = "cloud.google.com/gke-spot"
      value  = "true"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}

# Reference: matching pod toleration in a Helm values snippet
# tolerations:
#   - key: "cloud.google.com/gke-spot"
#     operator: "Equal"
#     value: "true"
#     effect: "NoSchedule"
```
**Explanation:** Spot pools are most effective when paired with a standard on-demand pool — the cluster autoscaler will preferentially schedule batch jobs on spot nodes while critical services remain on stable on-demand nodes. Setting `min_node_count = 0` means zero cost when no batch workloads are running. The Helm values comment shows the matching toleration pattern pods must declare to be eligible for this pool.

---

### Example 30: Node Pool Per Availability Zone
**Concept:** Create separate node pools pinned to individual zones for fine-grained zonal placement and resiliency control.
```hcl
resource "google_container_node_pool" "zone_a" {
  name     = "pool-us-central1-a"
  cluster  = "my-gke-cluster"
  location = "us-central1-a"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    labels = {
      topology-zone = "us-central1-a"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}

resource "google_container_node_pool" "zone_b" {
  name     = "pool-us-central1-b"
  cluster  = "my-gke-cluster"
  location = "us-central1-b"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100

    labels = {
      topology-zone = "us-central1-b"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Pinning node pools to specific zones (using a zonal `location`) gives deterministic control over placement, which is required for workloads with strict data residency or latency requirements. Each pool has a `topology-zone` label that pods can use with `nodeAffinity` or Topology Spread Constraints to ensure even distribution. This contrasts with regional node pools that spread nodes across zones automatically and is less common but useful for advanced scheduling scenarios.

---

### Example 31: KCC IAMPolicyMember — Node Pool SA Access to GCS
**Concept:** Use KCC (Config Connector) to grant the node pool service account read access to a GCS bucket, declaratively in Kubernetes.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gke-node-sa-gcs-reader
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: storage.cnrm.cloud.google.com/v1beta1
    kind: StorageBucket
    name: my-app-data-bucket
  role: roles/storage.objectViewer
  member: serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** KCC translates this Kubernetes manifest into a GCP IAM binding, granting the node pool SA the `storage.objectViewer` role on the specified bucket. This enables node-level workloads to read from GCS without Workload Identity, which is useful for bootstrap scripts or init containers that run before Kubernetes service accounts are wired up. KCC watches for drift and reconciles any out-of-band IAM changes, making this approach GitOps-friendly.

---

### Example 32: KCC IAMPolicyMember — Node Pool SA Access to Pub/Sub
**Concept:** Grant the node pool service account publish permissions to a Pub/Sub topic using a KCC IAMPolicyMember resource.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: gke-node-sa-pubsub-publisher
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
    kind: PubSubTopic
    name: my-events-topic
  role: roles/pubsub.publisher
  member: serviceAccount:gke-node-sa@my-gcp-project.iam.gserviceaccount.com
```
**Explanation:** KCC allows IAM bindings to be managed alongside other GCP resources using the same GitOps workflow as Kubernetes resources. The `roles/pubsub.publisher` role allows the SA to publish messages but not subscribe or administer topics, following least-privilege principles. KCC stores the current binding state in a Kubernetes custom resource, making it visible via `kubectl get iampolicymember` alongside all other cluster resources.

---

### Example 33: KCC IAMPolicyMember — Workload Identity Binding
**Concept:** Create a KCC IAMPolicyMember that binds a Kubernetes service account to a GCP service account for Workload Identity.
```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: workload-identity-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: gke-workload-sa
  role: roles/iam.workloadIdentityUser
  member: "serviceAccount:my-gcp-project.svc.id.goog[my-namespace/my-ksa]"
```
**Explanation:** This KCC resource creates the IAM binding that allows a Kubernetes service account (`my-ksa` in namespace `my-namespace`) to impersonate the GCP service account `gke-workload-sa`. The member format `project.svc.id.goog[namespace/ksa]` is the Workload Identity federation identifier. Combined with the node pool's `GKE_METADATA` workload metadata config (Example 22), this enables pods to authenticate to GCP APIs using short-lived OIDC tokens instead of JSON key files.

---

### Example 34: Helm Chart Tolerations Matching Node Pool Taints
**Concept:** Configure a Helm chart values file to add tolerations that match a dedicated node pool's taints.
```yaml
# values.yaml for a Helm chart targeting the dedicated backend pool

replicaCount: 3

tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "backend"
    effect: "NoSchedule"

nodeSelector:
  dedicated: "backend"

affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: "dedicated"
              operator: In
              values:
                - "backend"
```
**Explanation:** This Helm values snippet ensures pods from this chart will be scheduled only on nodes with the `dedicated=backend` taint and label (as defined in Example 15). The `tolerations` allow the pods to be scheduled past the taint, `nodeSelector` filters based on the label, and `affinity.nodeAffinity` provides a stronger guarantee with the required scheduling rule. Using all three in combination is the most explicit and reliable targeting pattern.

---

### Example 35: Helm Chart for GPU Workload with Node Pool Tolerations
**Concept:** Define Helm values for an ML inference deployment that targets the GPU node pool with CUDA requirements.
```yaml
# values.yaml for ML inference service targeting GPU node pool

replicaCount: 2

image:
  repository: gcr.io/my-gcp-project/ml-inference
  tag: "1.0.0"

resources:
  limits:
    nvidia.com/gpu: 1
  requests:
    nvidia.com/gpu: 1
    memory: "8Gi"
    cpu: "4"

tolerations:
  - key: "nvidia.com/gpu"
    operator: "Equal"
    value: "present"
    effect: "NoSchedule"

nodeSelector:
  accelerator: "nvidia-tesla-t4"

affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: "accelerator"
              operator: In
              values:
                - "nvidia-tesla-t4"
```
**Explanation:** The `resources.limits["nvidia.com/gpu"] = 1` resource request is mandatory — without it, the Kubernetes scheduler will not account for GPU capacity and the pod will not be placed on a GPU node. The toleration clears the `nvidia.com/gpu: present` taint from Example 28. The `preferredDuringSchedulingIgnoredDuringExecution` affinity allows falling back to other GPU types if T4 nodes are unavailable, which is useful for multi-region clusters.

---

### Example 36: Helm Chart Targeting Spot Nodes with Fallback
**Concept:** Configure a Helm chart to prefer spot nodes but fall back to on-demand nodes if spot capacity is unavailable.
```yaml
# values.yaml for a batch processor with spot preference

replicaCount: 10

tolerations:
  - key: "cloud.google.com/gke-spot"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"

affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: "cloud.google.com/gke-spot"
              operator: In
              values:
                - "true"

podDisruptionBudget:
  enabled: true
  minAvailable: 5
```
**Explanation:** Using `preferred` (not `required`) node affinity allows the scheduler to place pods on on-demand nodes if no spot capacity is available, providing graceful degradation. The `tolerations` entry allows spot node scheduling, while the affinity steers the scheduler toward them. Setting `minAvailable: 5` in the PodDisruptionBudget ensures that if spot nodes are preempted, at least half the replicas remain running during voluntary disruptions.

---

### Example 37: Terraform for_each to Create Multiple Node Pools
**Concept:** Use Terraform `for_each` to declaratively create multiple node pools with different configurations from a map variable.
```hcl
variable "node_pools" {
  type = map(object({
    machine_type = string
    node_count   = number
    disk_type    = string
    disk_size_gb = number
    labels       = map(string)
  }))
  default = {
    "general" = {
      machine_type = "e2-standard-4"
      node_count   = 3
      disk_type    = "pd-balanced"
      disk_size_gb = 100
      labels       = { pool-type = "general" }
    }
    "compute" = {
      machine_type = "n2-standard-8"
      node_count   = 2
      disk_type    = "pd-ssd"
      disk_size_gb = 200
      labels       = { pool-type = "compute" }
    }
    "highmem" = {
      machine_type = "n2d-highmem-16"
      node_count   = 1
      disk_type    = "pd-ssd"
      disk_size_gb = 256
      labels       = { pool-type = "highmem" }
    }
  }
}

resource "google_container_node_pool" "pools" {
  for_each = var.node_pools

  name     = "${each.key}-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = each.value.node_count

  node_config {
    machine_type = each.value.machine_type
    disk_type    = each.value.disk_type
    disk_size_gb = each.value.disk_size_gb
    labels       = each.value.labels

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `for_each` meta-argument iterates over the `node_pools` map and creates one `google_container_node_pool` resource per entry with a distinct Terraform state key. This approach is DRY and makes adding or removing pools a matter of editing the variable map rather than duplicating resource blocks. Adding a new pool to the map and running `terraform apply` will create only the new resource without affecting existing pools.

---

### Example 38: KCC ContainerNodePool Resource
**Concept:** Manage a GKE node pool declaratively using the KCC `ContainerNodePool` CRD, enabling GitOps-driven node pool lifecycle management.
```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: kcc-managed-pool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  clusterRef:
    name: my-gke-cluster
  nodeCount: 3
  autoscaling:
    minNodeCount: 2
    maxNodeCount: 10
  nodeConfig:
    machineType: e2-standard-4
    diskSizeGb: 100
    diskType: pd-balanced
    imageType: COS_CONTAINERD
    labels:
      managed-by: kcc
    oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
  management:
    autoRepair: true
    autoUpgrade: true
  upgradeSettings:
    maxSurge: 1
    maxUnavailable: 0
```
**Explanation:** KCC's `ContainerNodePool` CRD maps directly to the `google_container_node_pool` Terraform resource but operates within the Kubernetes reconciliation loop. The Config Connector controller watches this manifest and ensures the GCP node pool matches the declared spec. This approach integrates node pool management with ArgoCD or Flux CD GitOps pipelines without requiring a separate Terraform execution environment. KCC is best when your team is already heavily Kubernetes-native.

---

## ADVANCED (Examples 39–50)

---

### Example 39: GPU Node Pool with NVIDIA A100
**Concept:** Provision a high-performance A100 GPU node pool for large-scale ML training workloads.
```hcl
resource "google_container_node_pool" "a100_gpu" {
  name     = "a100-gpu-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 1

  autoscaling {
    min_node_count = 0
    max_node_count = 4
  }

  node_config {
    machine_type = "a2-highgpu-1g"
    disk_type    = "pd-ssd"
    disk_size_gb = 500
    image_type   = "COS_CONTAINERD"

    guest_accelerator {
      type  = "nvidia-tesla-a100"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "LATEST"
      }
    }

    labels = {
      accelerator    = "nvidia-a100"
      workload-class = "ml-training"
    }

    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    taint {
      key    = "accelerator"
      value  = "nvidia-a100"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  management {
    auto_repair  = true
    auto_upgrade = false
  }
}
```
**Explanation:** A100 GPUs run on the `a2-highgpu` machine family, which is purpose-built for GPU workloads with NVLink interconnects. The `LATEST` driver version ensures compatibility with the newest CUDA libraries. `auto_upgrade = false` is deliberately set because GPU driver upgrades on live training nodes can interrupt long-running jobs — upgrades should be coordinated manually. The dual taint pattern ensures only workloads specifically requesting A100 GPUs land on these expensive nodes.

---

### Example 40: CUDA Driver Installer DaemonSet
**Concept:** Deploy a DaemonSet that installs NVIDIA CUDA drivers on GPU nodes when GKE's managed driver installation is not used.
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nvidia-driver-installer
  namespace: kube-system
  labels:
    k8s-app: nvidia-driver-installer
spec:
  selector:
    matchLabels:
      k8s-app: nvidia-driver-installer
  updateStrategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        k8s-app: nvidia-driver-installer
    spec:
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      nodeSelector:
        cloud.google.com/gke-accelerator: nvidia-tesla-t4
      initContainers:
        - name: nvidia-driver-installer
          image: cos-nvidia-installer:fixed
          imagePullPolicy: Never
          env:
            - name: NVIDIA_INSTALL_DIR_HOST
              value: /home/kubernetes/bin/nvidia
            - name: NVIDIA_INSTALL_DIR_CONTAINER
              value: /usr/local/nvidia
          securityContext:
            privileged: true
          volumeMounts:
            - name: nvidia-install-dir-host
              mountPath: /usr/local/nvidia
            - name: dev
              mountPath: /dev
      containers:
        - name: pause
          image: gcr.io/google-containers/pause:2.0
      volumes:
        - name: nvidia-install-dir-host
          hostPath:
            path: /home/kubernetes/bin/nvidia
        - name: dev
          hostPath:
            path: /dev
```
**Explanation:** This DaemonSet runs on every GPU node (identified by `cloud.google.com/gke-accelerator: nvidia-tesla-t4`) and installs the NVIDIA driver via a privileged init container. The `privileged: true` security context is required to access host devices. A `pause` container keeps the pod running after the driver is installed. This pattern is needed for custom driver versions not available through GKE's managed `gpu_driver_installation_config`.

---

### Example 41: Confidential VM Node Pool
**Concept:** Create a node pool using Confidential VMs that encrypt memory contents using AMD SEV, protecting data in use.
```hcl
resource "google_container_node_pool" "confidential" {
  name     = "confidential-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2d-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    confidential_nodes {
      enabled = true
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      security-profile = "confidential"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Confidential VMs use AMD's Secure Encrypted Virtualization (SEV) to encrypt VM memory at the hardware level with keys managed by the AMD processor, making the data inaccessible to GCP operators or a compromised hypervisor. This requires `n2d` machine types (AMD EPYC). Confidential Computing is mandated by some compliance frameworks (e.g., HIPAA, financial services regulations) for processing sensitive data. Note that enabling confidential nodes requires the cluster to be configured with `enable_confidential_nodes = true` as well.

---

### Example 42: Windows Server Node Pool for Mixed Workloads
**Concept:** Add a Windows Server node pool to a GKE cluster to run Windows-based container workloads alongside Linux pods.
```hcl
resource "google_container_node_pool" "windows" {
  name     = "windows-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 2

  node_config {
    machine_type = "n2-standard-4"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "WINDOWS_SAC"

    labels = {
      os-type = "windows"
    }

    taint {
      key    = "node.kubernetes.io/os"
      value  = "windows"
      effect = "NO_SCHEDULE"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** GKE supports Windows Server containers using the `WINDOWS_SAC` (Semi-Annual Channel) image type, which is the recommended Windows image for containerized applications. The `node.kubernetes.io/os: windows` taint is the standard Kubernetes taint for Windows nodes and prevents Linux pods from being scheduled here. Windows pods must declare a toleration for this taint and use a `nodeSelector` of `kubernetes.io/os: windows`. Mixed-OS clusters are useful for migrating legacy .NET Framework applications to Kubernetes.

---

### Example 43: Custom Boot Disk Configuration with CMEK
**Concept:** Combine customer-managed encryption keys (CMEK) with Shielded VM settings for a maximally hardened node pool.
```hcl
resource "google_container_node_pool" "hardened" {
  name     = "hardened-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    boot_disk_kms_key = "projects/my-gcp-project/locations/us-central1/keyRings/gke-keyring/cryptoKeys/node-boot-disk"

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      security-level = "hardened"
      compliance      = "pci-dss"
    }

    metadata = {
      disable-legacy-endpoints = "true"
      block-project-ssh-keys   = "true"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `boot_disk_kms_key` encrypts the node's root persistent disk using a Customer-Managed Encryption Key (CMEK) in Cloud KMS, providing control over key lifecycle and enabling key revocation to instantly render nodes unbootable. The `block-project-ssh-keys` metadata disables project-level SSH key propagation, reducing lateral movement risk. Combined with Shielded VM and CMEK, this configuration satisfies the most stringent regulatory requirements for node-level security hardening.

---

### Example 44: Node Auto-Provisioning (Cluster Autoscaler with New Pools)
**Concept:** Enable Node Auto-Provisioning on the cluster level to let GKE automatically create and delete node pools based on workload demand.
```hcl
resource "google_container_cluster" "primary" {
  name     = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  remove_default_node_pool = true
  initial_node_count       = 1

  cluster_autoscaling {
    enabled = true

    autoscaling_profile = "OPTIMIZE_UTILIZATION"

    resource_limits {
      resource_type = "cpu"
      minimum       = 4
      maximum       = 256
    }

    resource_limits {
      resource_type = "memory"
      minimum       = 16
      maximum       = 1024
    }

    resource_limits {
      resource_type = "nvidia-tesla-t4"
      minimum       = 0
      maximum       = 8
    }

    auto_provisioning_defaults {
      service_account = "gke-node-sa@my-gcp-project.iam.gserviceaccount.com"
      oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

      management {
        auto_repair  = true
        auto_upgrade = true
      }

      disk_size = 100
      disk_type = "pd-balanced"
    }
  }
}
```
**Explanation:** Node Auto-Provisioning (NAP) extends the cluster autoscaler by creating entirely new node pools with the right machine type, accelerator, and size when no existing pool can satisfy a pod's resource requirements. The `resource_limits` block defines upper bounds across all auto-provisioned pools to cap costs. `OPTIMIZE_UTILIZATION` packs workloads more densely, trading headroom for cost efficiency. `auto_provisioning_defaults` ensures all auto-created pools inherit security and management settings.

---

### Example 45: Node Pool Rolling Replace via Terraform Lifecycle
**Concept:** Force Terraform to replace a node pool in-place by modifying an immutable field with a `lifecycle` block to control the replacement order.
```hcl
resource "google_container_cluster" "primary" {
  name               = "my-gke-cluster"
  location           = "us-central1"
  project            = "my-gcp-project"
  min_master_version = "1.29"

  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "rolling_replace" {
  name     = "prod-pool"
  cluster  = google_container_cluster.primary.name
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 4

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [initial_node_count]
    replace_triggered_by = [
      google_container_cluster.primary.master_version,
    ]
  }

  upgrade_settings {
    max_surge       = 4
    max_unavailable = 0
  }

  node_config {
    machine_type = "n2-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `create_before_destroy = true` instructs Terraform to create the new node pool before destroying the old one, preventing downtime during replacements triggered by changes to immutable fields (like `machine_type` or `image_type`). `replace_triggered_by` allows triggering node pool replacement when referenced values change, enabling automated rolling replacements on cluster version bumps. The `max_surge = 4` and `max_unavailable = 0` in `upgrade_settings` ensures the new pool is fully healthy before old nodes are drained.

---

### Example 46: Node Pool with Advanced Kubelet and Sysctls Tuning
**Concept:** Pass custom kubelet configuration to nodes to tune Linux kernel and container runtime behavior for high-performance workloads.
```hcl
resource "google_container_node_pool" "tuned" {
  name     = "tuned-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2-standard-16"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    kubelet_config {
      cpu_manager_policy   = "static"
      cpu_cfs_quota        = true
      cpu_cfs_quota_period = "100ms"
      pod_pids_limit       = 4096
    }

    linux_node_config {
      sysctls = {
        "net.core.somaxconn"           = "65535"
        "net.ipv4.tcp_max_syn_backlog" = "65535"
        "vm.max_map_count"             = "262144"
      }
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `kubelet_config.cpu_manager_policy = "static"` enables CPU pinning, which is critical for latency-sensitive workloads like databases or real-time services that benefit from exclusive CPU core access. `linux_node_config.sysctls` sets kernel parameters directly on the node; `net.core.somaxconn` and `tcp_max_syn_backlog` are commonly tuned for high-connection-rate applications, while `vm.max_map_count` is required for Elasticsearch. These kernel tunings can significantly improve throughput and reduce tail latency.

---

### Example 47: Multi-Zone Node Pool with Balanced Location Policy
**Concept:** Configure a regional node pool with a balanced location policy to distribute nodes evenly across zones.
```hcl
resource "google_container_node_pool" "balanced_zones" {
  name     = "balanced-zone-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_locations = [
    "us-central1-a",
    "us-central1-b",
    "us-central1-c",
  ]

  node_count = 2

  autoscaling {
    min_node_count  = 1
    max_node_count  = 10
    location_policy = "BALANCED"
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_type    = "pd-balanced"
    disk_size_gb = 100
    image_type   = "COS_CONTAINERD"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** `node_locations` explicitly specifies which zones in the region to spread nodes across, rather than letting GKE choose. The `location_policy = "BALANCED"` setting instructs the autoscaler to maintain an even distribution of nodes across the specified zones, which is critical for workloads using Topology Spread Constraints or zonal PersistentVolumes. Without `BALANCED`, the autoscaler may fill up the cheapest or most available zone, creating an uneven distribution.

---

### Example 48: Node Pool with Sole Tenancy Affinity
**Concept:** Configure a node pool to run on sole-tenant nodes for compliance requirements that mandate physical isolation from other GCP customers.
```hcl
resource "google_container_node_pool" "sole_tenant" {
  name     = "sole-tenant-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 2

  node_config {
    machine_type = "n2-standard-16"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    sole_tenant_config {
      node_affinity {
        key      = "workload"
        operator = "IN"
        values   = ["production-sensitive"]
      }
    }

    labels = {
      tenancy = "sole-tenant"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** Sole-tenant nodes are physical Compute Engine servers dedicated exclusively to a single GCP customer's workloads. The `sole_tenant_config.node_affinity` block directs GKE VMs to launch only on sole-tenant node groups with matching labels (provisioned separately via `google_compute_node_group`). This is required for regulated industries (healthcare, finance, government) where multi-tenancy at the hardware level violates compliance policies. Sole tenancy carries a significant cost premium over shared infrastructure.

---

### Example 49: Node Pool with Ephemeral Storage Backed by Local SSD
**Concept:** Use ephemeral storage backed by local NVMe SSDs to dramatically accelerate container image caching and ephemeral volume performance.
```hcl
resource "google_container_node_pool" "ephemeral_storage" {
  name     = "ephemeral-storage-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  node_count = 3

  node_config {
    machine_type = "n2-standard-8"
    disk_type    = "pd-ssd"
    disk_size_gb = 200
    image_type   = "COS_CONTAINERD"

    ephemeral_storage_local_ssd_config {
      local_ssd_count = 2
    }

    labels = {
      storage-backend = "local-nvme"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
**Explanation:** The `ephemeral_storage_local_ssd_config` block provisions local NVMe SSDs and configures them as the backing store for ephemeral storage (emptyDir volumes) and the container image layer cache. This dramatically accelerates workloads that write large temporary files, such as Spark shuffle operations or model checkpoint saves. Unlike `local_ssd_count` (which exposes raw devices), this configuration integrates the SSDs directly into Kubernetes' ephemeral storage accounting, making `ephemeral-storage` resource limits enforced against the NVMe devices.

---

### Example 50: Complete Production-Grade Node Pool Configuration
**Concept:** Combine all critical node pool settings — autoscaling, Workload Identity, Shielded VMs, upgrades, and Helm integration — into a single production-ready Terraform, KCC, and Helm configuration.
```hcl
# Terraform: Production-grade node pool
resource "google_service_account" "prod_node_sa" {
  account_id   = "gke-prod-node-sa"
  display_name = "GKE Production Node SA"
  project      = "my-gcp-project"
}

resource "google_container_node_pool" "production" {
  name     = "production-pool"
  cluster  = "my-gke-cluster"
  location = "us-central1"
  project  = "my-gcp-project"

  initial_node_count = 3

  autoscaling {
    min_node_count  = 3
    max_node_count  = 30
    location_policy = "BALANCED"
  }

  node_locations = [
    "us-central1-a",
    "us-central1-b",
    "us-central1-c",
  ]

  upgrade_settings {
    max_surge       = 3
    max_unavailable = 0
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [initial_node_count]
  }

  node_config {
    machine_type    = "n2-standard-8"
    disk_type       = "pd-ssd"
    disk_size_gb    = 200
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.prod_node_sa.email

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      environment    = "production"
      managed-by     = "terraform"
      workload-class = "general"
    }

    tags = ["gke-prod-node", "allow-health-checks"]

    metadata = {
      disable-legacy-endpoints = "true"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```
```yaml
# KCC: Workload Identity IAM binding
# File: workload-identity-binding.yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: prod-workload-identity-binding
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: gke-prod-node-sa
  role: roles/iam.workloadIdentityUser
  member: "serviceAccount:my-gcp-project.svc.id.goog[production/app-ksa]"
```
```yaml
# Helm: Production app values targeting this node pool
# File: production-values.yaml
nodeSelector:
  environment: production
  workload-class: general

affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: environment
              operator: In
              values:
                - production

resources:
  requests:
    cpu: "2"
    memory: "4Gi"
  limits:
    cpu: "4"
    memory: "8Gi"

podDisruptionBudget:
  enabled: true
  minAvailable: "50%"

topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: my-app
```
**Explanation:** This example integrates every major node pool concern: autoscaling with balanced zonal distribution, zero-disruption rolling upgrades, Workload Identity for pod-level GCP authentication, Shielded VM for node integrity, and a `lifecycle` block to handle Terraform state correctly when the autoscaler modifies `initial_node_count`. The KCC YAML manages the Workload Identity IAM binding declaratively in a GitOps pipeline. The Helm values snippet demonstrates the full scheduling stack — node affinity, resource requests, PodDisruptionBudget, and Topology Spread Constraints — that production-grade deployments targeting this pool should configure.

---
