# Terraform GKE Networking on GCP — 50 Examples

> **Project:** `my-gcp-project` | **Cluster:** `my-gke-cluster` | **Region:** `us-central1`
> **Terraform google provider:** `~> 5.0` | **KCC apiVersion:** `cnrm.cloud.google.com/v1beta1`

---

## BASIC (Examples 1–13)

---

### Example 1: Create a Custom VPC Network

**Concept:** Define a custom-mode VPC network in GCP using `google_compute_network`.

```hcl
resource "google_compute_network" "gke_vpc" {
  project                 = "my-gcp-project"
  name                    = "gke-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  description             = "Custom VPC for GKE workloads"
}
```

**Explanation:** Setting `auto_create_subnetworks = false` gives full control over subnet CIDR allocation, which is required for GKE VPC-native clusters. `REGIONAL` routing mode ensures routes are propagated only within the region, reducing unnecessary cross-region route advertisements. Custom-mode VPCs are recommended for production GKE deployments where IP space must be carefully planned.

---

### Example 2: Create a GKE-Ready Subnetwork with Secondary IP Ranges

**Concept:** Define a subnetwork with secondary ranges for GKE Pod and Service CIDR blocks.

```hcl
resource "google_compute_subnetwork" "gke_subnet" {
  project       = "my-gcp-project"
  name          = "gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.gke_vpc.id

  secondary_ip_range {
    range_name    = "gke-pods"
    ip_cidr_range = "10.48.0.0/14"
  }

  secondary_ip_range {
    range_name    = "gke-services"
    ip_cidr_range = "10.52.0.0/20"
  }

  private_ip_google_access = true
}
```

**Explanation:** Secondary IP ranges are mandatory for VPC-native (alias IP) GKE clusters — one range for Pods and one for Services. `private_ip_google_access = true` allows nodes without external IPs to reach Google APIs. The Pod CIDR `/14` supports roughly 250,000 Pod IPs, scaled to the expected cluster size.

---

### Example 3: Firewall Rule — Allow Internal Traffic Within VPC

**Concept:** Create an ingress firewall rule permitting all internal RFC-1918 traffic within the VPC.

```hcl
resource "google_compute_firewall" "allow_internal" {
  project  = "my-gcp-project"
  name     = "gke-allow-internal"
  network  = google_compute_network.gke_vpc.name
  priority = 1000

  allow {
    protocol = "tcp"
  }

  allow {
    protocol = "udp"
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
  description   = "Allow all internal RFC-1918 traffic"
}
```

**Explanation:** Allowing internal traffic across the `10.0.0.0/8` supernet ensures that Pods, Services, and nodes can communicate freely across subnets. This rule is typically supplemented with more restrictive rules for production. ICMP is included to support health checks and diagnostics.

---

### Example 4: Firewall Rule — Allow GKE Master to Node Communication

**Concept:** Permit the GKE control plane to communicate with worker nodes on required ports.

```hcl
resource "google_compute_firewall" "gke_master_to_nodes" {
  project  = "my-gcp-project"
  name     = "gke-master-to-nodes"
  network  = google_compute_network.gke_vpc.name
  priority = 1000

  allow {
    protocol = "tcp"
    ports    = ["10250", "443"]
  }

  source_ranges = ["172.16.0.32/28"]
  target_tags   = ["gke-node"]

  description = "Allow GKE control plane to communicate with worker nodes"
}
```

**Explanation:** GKE's managed control plane originates from a `/28` CIDR that is specified during cluster creation as `master_ipv4_cidr_block`. Port `10250` is the kubelet API used for `kubectl exec`, `kubectl logs`, and liveness probes. Port `443` is used for the API server webhook admission controllers.

---

### Example 5: Firewall Rule — Allow HTTP/HTTPS Ingress

**Concept:** Open ports 80 and 443 to the internet for GKE Ingress controllers.

```hcl
resource "google_compute_firewall" "allow_http_https" {
  project  = "my-gcp-project"
  name     = "gke-allow-http-https"
  network  = google_compute_network.gke_vpc.name
  priority = 1000

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["gke-ingress"]

  description = "Allow inbound HTTP and HTTPS to GKE ingress nodes"
}
```

**Explanation:** Using `target_tags` restricts this broad rule to only nodes tagged `gke-ingress`, reducing the attack surface. Ingress controllers or external load balancer backends need 80/443 open from the public internet. This should be combined with Cloud Armor policies in production environments.

---

### Example 6: Firewall Rule — Deny All Egress with Default Deny

**Concept:** Implement a default-deny egress firewall policy for zero-trust networking.

```hcl
resource "google_compute_firewall" "deny_all_egress" {
  project   = "my-gcp-project"
  name      = "gke-deny-all-egress"
  network   = google_compute_network.gke_vpc.name
  priority  = 65534
  direction = "EGRESS"

  deny {
    protocol = "all"
  }

  destination_ranges = ["0.0.0.0/0"]
  description        = "Default deny all egress - override with higher priority rules"
}
```

**Explanation:** A priority of `65534` ensures this is the last rule evaluated, acting as a catch-all deny. Higher-priority egress rules (lower number) can then whitelist specific destinations. This pattern enforces explicit egress allowlisting and is required for PCI-DSS and similar compliance frameworks.

---

### Example 7: Cloud Router for NAT Gateway

**Concept:** Create a Cloud Router as a prerequisite for Cloud NAT.

```hcl
resource "google_compute_router" "gke_router" {
  project = "my-gcp-project"
  name    = "gke-router"
  region  = "us-central1"
  network = google_compute_network.gke_vpc.id

  bgp {
    asn               = 64514
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]
  }

  description = "Cloud Router for GKE NAT and BGP"
}
```

**Explanation:** Cloud Router is required as the underlay for Cloud NAT and Cloud Interconnect BGP sessions. The ASN `64514` is a private ASN in the range 64512–65534, suitable for internal BGP configurations. `advertise_mode = "CUSTOM"` with `ALL_SUBNETS` ensures all subnet routes are advertised through BGP.

---

### Example 8: Cloud NAT for Private GKE Nodes

**Concept:** Enable outbound internet access for GKE nodes that have no external IP addresses.

```hcl
resource "google_compute_router_nat" "gke_nat" {
  project                            = "my-gcp-project"
  name                               = "gke-nat"
  router                             = google_compute_router.gke_router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.gke_subnet.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }

  min_ports_per_vm                    = 64
  tcp_established_idle_timeout_sec    = 1200
  tcp_transitory_idle_timeout_sec     = 30
}
```

**Explanation:** `AUTO_ONLY` lets GCP automatically allocate external IPs for NAT, removing the need to manage static IPs. Setting `source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"` with `ALL_IP_RANGES` ensures both primary node IPs and secondary Pod IPs are NATted. Enabling logs at `ERRORS_ONLY` captures NAT allocation failures without overwhelming Cloud Logging.

---

### Example 9: Reserve a Static External IP Address

**Concept:** Reserve a static global external IP for use with GKE Ingress or Load Balancer.

```hcl
resource "google_compute_global_address" "gke_ingress_ip" {
  project      = "my-gcp-project"
  name         = "gke-ingress-ip"
  address_type = "EXTERNAL"
  ip_version   = "IPV4"
  description  = "Static IP for GKE Ingress controller"
}

output "ingress_ip" {
  value       = google_compute_global_address.gke_ingress_ip.address
  description = "Reserved static IP for GKE Ingress"
}
```

**Explanation:** A global static IP is required when using GKE's Ingress with a global HTTPS load balancer — ephemeral IPs cannot be used with DNS CNAME records reliably. The `output` block exposes the IP for use in DNS record creation or Helm values. Global addresses are used with global load balancers; regional addresses are used with regional ones.

---

### Example 10: Reserve a Static Regional Internal IP

**Concept:** Reserve a static internal IP address within a subnet for an internal load balancer.

```hcl
resource "google_compute_address" "internal_lb_ip" {
  project      = "my-gcp-project"
  name         = "gke-internal-lb-ip"
  subnetwork   = google_compute_subnetwork.gke_subnet.id
  address_type = "INTERNAL"
  address      = "10.0.0.50"
  region       = "us-central1"
  purpose      = "SHARED_LOADBALANCER_VIP"
  description  = "Static internal IP for GKE internal load balancer"
}
```

**Explanation:** `purpose = "SHARED_LOADBALANCER_VIP"` marks this address as usable for internal load balancer frontends in the subnet. Hardcoding an address within the subnet CIDR ensures predictable IPs for internal services. This IP can be referenced in Helm chart `values.yaml` for Kubernetes `Service` annotations like `cloud.google.com/load-balancer-type: "Internal"`.

---

### Example 11: Firewall Rule — Allow Health Checks from Google Probers

**Concept:** Allow Google's health check IP ranges to reach GKE backend nodes.

```hcl
resource "google_compute_firewall" "allow_health_checks" {
  project  = "my-gcp-project"
  name     = "gke-allow-health-checks"
  network  = google_compute_network.gke_vpc.name
  priority = 900

  allow {
    protocol = "tcp"
    ports    = ["8080", "10256"]
  }

  source_ranges = [
    "35.191.0.0/16",
    "130.211.0.0/22",
    "209.85.152.0/22",
    "209.85.204.0/22"
  ]

  target_tags = ["gke-node"]
  description = "Allow GCP health check probers to reach GKE nodes"
}
```

**Explanation:** Google's load balancer health checkers originate from the four CIDR ranges listed — these are published GCP IP ranges that must be allowed for any backend service to pass health checks. Port `10256` is the `kube-proxy` health check port and port `8080` is commonly used by application health endpoints. Without this rule, all GCP load balancer backends will report unhealthy.

---

### Example 12: Subnetwork with Flow Logs Enabled

**Concept:** Enable VPC Flow Logs on a GKE subnetwork for network traffic visibility.

```hcl
resource "google_compute_subnetwork" "gke_subnet_with_logs" {
  project       = "my-gcp-project"
  name          = "gke-subnet-flow-logs"
  ip_cidr_range = "10.1.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.gke_vpc.id

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
    filter_expr          = "true"
  }

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "gke-pods-2"
    ip_cidr_range = "10.56.0.0/14"
  }
}
```

**Explanation:** VPC Flow Logs capture a sample of network flows at the subnet level, useful for troubleshooting, security auditing, and network topology discovery. `flow_sampling = 0.5` captures 50% of flows, balancing observability cost. `INCLUDE_ALL_METADATA` enriches logs with source/destination GCP resource metadata, making it easier to correlate flows with GKE workloads.

---

### Example 13: Output Key Networking Values for Downstream Use

**Concept:** Export VPC and subnet IDs as Terraform outputs for use by GKE cluster resources.

```hcl
output "vpc_id" {
  value       = google_compute_network.gke_vpc.id
  description = "The self-link of the GKE VPC network"
}

output "vpc_name" {
  value       = google_compute_network.gke_vpc.name
  description = "The name of the GKE VPC network"
}

output "gke_subnet_name" {
  value       = google_compute_subnetwork.gke_subnet.name
  description = "Name of the primary GKE subnetwork"
}

output "pods_secondary_range_name" {
  value       = "gke-pods"
  description = "Secondary range name for GKE Pod CIDRs"
}

output "services_secondary_range_name" {
  value       = "gke-services"
  description = "Secondary range name for GKE Service CIDRs"
}
```

**Explanation:** Exporting networking values as outputs allows the GKE cluster module to consume them via `data "terraform_remote_state"` or module return values. This promotes loose coupling between the networking and cluster layers of infrastructure. The Pod and Service range names must exactly match what is referenced in the `google_container_cluster` resource's `ip_allocation_policy` block.

---

## INTERMEDIATE (Examples 14–26)

---

### Example 14: Shared VPC — Enable Host Project

**Concept:** Enable Shared VPC on a GCP host project so service projects can use its network.

```hcl
resource "google_compute_shared_vpc_host_project" "host" {
  project = "my-gcp-project-host"
}
```

**Explanation:** Enabling Shared VPC on the host project delegates network resource management to a central networking team. Service projects attach to this host and use subnets without owning the network themselves. This pattern is standard in large organizations where network governance is separated from application teams.

---

### Example 15: Shared VPC — Attach a Service Project

**Concept:** Attach a GKE workload service project to the Shared VPC host project.

```hcl
resource "google_compute_shared_vpc_service_project" "gke_service" {
  host_project    = google_compute_shared_vpc_host_project.host.project
  service_project = "my-gcp-project"

  depends_on = [google_compute_shared_vpc_host_project.host]
}
```

**Explanation:** Once attached, the service project (`my-gcp-project`) can deploy GKE clusters into subnets defined in the host project. IAM bindings must also grant the GKE service account in the service project `roles/compute.networkUser` on the shared subnets. The `depends_on` ensures the host project configuration completes before the attachment.

---

### Example 16: Private Service Access for Cloud SQL

**Concept:** Allocate a private IP range and create a VPC peering connection for Google-managed services like Cloud SQL.

```hcl
resource "google_compute_global_address" "private_service_range" {
  project       = "my-gcp-project"
  name          = "google-managed-services-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.gke_vpc.id
  description   = "Range for Private Service Access (Cloud SQL, Memorystore, etc.)"
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.gke_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_range.name]

  depends_on = [google_compute_global_address.private_service_range]
}
```

**Explanation:** Private Service Access establishes a VPC peering connection between your VPC and Google's tenant network, allowing managed services to be reached via internal IPs. The `/16` prefix length provides 65,536 addresses for Google to allocate IPs for multiple service instances. GKE Pods connecting to Cloud SQL should use the private IP exposed through this peering to avoid traversing the internet.

---

### Example 17: VPC Network Peering Between Two VPCs

**Concept:** Establish bidirectional VPC peering to allow traffic between two separate VPC networks.

```hcl
resource "google_compute_network_peering" "gke_to_ops" {
  name                                = "gke-to-ops-peering"
  network                             = google_compute_network.gke_vpc.self_link
  peer_network                        = "projects/my-ops-project/global/networks/ops-vpc"
  export_custom_routes                = true
  import_custom_routes                = true
  export_subnet_routes_with_public_ip = false
}

resource "google_compute_network_peering" "ops_to_gke" {
  name         = "ops-to-gke-peering"
  network      = "projects/my-ops-project/global/networks/ops-vpc"
  peer_network = google_compute_network.gke_vpc.self_link
  export_custom_routes = true
  import_custom_routes = true

  depends_on = [google_compute_network_peering.gke_to_ops]
}
```

**Explanation:** VPC peering is non-transitive — if VPC A peers with VPC B, and VPC B peers with VPC C, A cannot reach C. Both sides of the peering must be created for the connection to become active. `export_custom_routes = true` propagates static and dynamic routes, which is needed when using Cloud Interconnect or VPN on one side.

---

### Example 18: Cloud DNS Managed Zone — Private Zone for GKE

**Concept:** Create a private Cloud DNS zone resolvable only within the VPC.

```hcl
resource "google_dns_managed_zone" "gke_private_zone" {
  project     = "my-gcp-project"
  name        = "gke-internal-zone"
  dns_name    = "internal.gke.example.com."
  description = "Private DNS zone for GKE services"

  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.gke_vpc.id
    }
  }

  dnssec_config {
    state = "off"
  }
}
```

**Explanation:** Private DNS zones are only visible to VMs and resources within the specified VPCs, preventing internal service discovery from leaking externally. The trailing dot in `dns_name` is required by DNS standards and must be included. DNSSEC is disabled here as private zones are already network-isolated, but it can be enabled for compliance.

---

### Example 19: Cloud DNS A Record for Internal Service

**Concept:** Create an A record in the private DNS zone pointing to an internal load balancer IP.

```hcl
resource "google_dns_record_set" "internal_lb_record" {
  project      = "my-gcp-project"
  name         = "api.internal.gke.example.com."
  managed_zone = google_dns_managed_zone.gke_private_zone.name
  type         = "A"
  ttl          = 300

  rrdatas = [google_compute_address.internal_lb_ip.address]
}
```

**Explanation:** Pairing this DNS record with the reserved internal IP from Example 10 creates a stable, human-readable endpoint for GKE services. A TTL of 300 seconds (5 minutes) balances DNS caching efficiency with update propagation speed. This record can be referenced in Helm chart configurations as a stable service endpoint.

---

### Example 20: Cloud DNS — Public Managed Zone

**Concept:** Create a public DNS managed zone for external GKE service endpoints.

```hcl
resource "google_dns_managed_zone" "public_zone" {
  project     = "my-gcp-project"
  name        = "gke-public-zone"
  dns_name    = "gke.example.com."
  description = "Public DNS zone for GKE external services"
  visibility  = "public"

  dnssec_config {
    state          = "on"
    non_existence  = "NSEC3"

    default_key_specs {
      algorithm  = "rsasha256"
      key_length = 2048
      key_type   = "keySigning"
    }

    default_key_specs {
      algorithm  = "rsasha256"
      key_length = 1024
      key_type   = "zoneSigning"
    }
  }
}
```

**Explanation:** Public zones are resolvable from the global internet and require proper NS delegation at the domain registrar. DNSSEC is enabled with NSEC3 for authenticated denial of existence, preventing zone enumeration attacks. The `rsasha256` algorithm with 2048-bit KSK and 1024-bit ZSK is the current recommended configuration for Cloud DNS DNSSEC.

---

### Example 21: Internal Load Balancer — Backend Service and Forwarding Rule

**Concept:** Create a regional internal TCP/UDP load balancer backed by a GKE node instance group.

```hcl
resource "google_compute_region_backend_service" "internal_lb_backend" {
  project               = "my-gcp-project"
  name                  = "gke-internal-lb-backend"
  region                = "us-central1"
  load_balancing_scheme = "INTERNAL"
  protocol              = "TCP"
  health_checks         = [google_compute_region_health_check.gke_hc.id]

  backend {
    group          = "projects/my-gcp-project/zones/us-central1-a/instanceGroups/gke-my-gke-cluster-default-pool"
    balancing_mode = "CONNECTION"
  }
}

resource "google_compute_forwarding_rule" "internal_lb_forwarding" {
  project               = "my-gcp-project"
  name                  = "gke-internal-lb"
  region                = "us-central1"
  load_balancing_scheme = "INTERNAL"
  ip_address            = google_compute_address.internal_lb_ip.address
  ip_protocol           = "TCP"
  ports                 = ["8080"]
  backend_service       = google_compute_region_backend_service.internal_lb_backend.id
  network               = google_compute_network.gke_vpc.id
  subnetwork            = google_compute_subnetwork.gke_subnet.id
}
```

**Explanation:** Internal load balancers use `INTERNAL` scheme and are only accessible within the VPC (and peered networks with appropriate routes). The backend references a GKE-managed instance group — the group name follows GKE's naming convention. This pattern is equivalent to deploying a Kubernetes `Service` with annotation `cloud.google.com/load-balancer-type: "Internal"` but gives full Terraform control.

---

### Example 22: Health Check for Internal Load Balancer

**Concept:** Define a regional TCP health check for the GKE internal load balancer backend.

```hcl
resource "google_compute_region_health_check" "gke_hc" {
  project             = "my-gcp-project"
  name                = "gke-internal-hc"
  region              = "us-central1"
  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3

  tcp_health_check {
    port = 8080
  }

  log_config {
    enable = true
  }
}
```

**Explanation:** Health check parameters control how quickly the load balancer detects and recovers from backend failures. With `check_interval_sec = 10` and `unhealthy_threshold = 3`, a backend is marked unhealthy after 30 seconds of failure. Enabling `log_config` sends health check state transitions to Cloud Logging, which is critical for diagnosing intermittent backend failures.

---

### Example 23: Standalone Network Endpoint Group (NEG) for GKE

**Concept:** Create a zonal network endpoint group to register GKE Pod IPs directly with a load balancer.

```hcl
resource "google_compute_network_endpoint_group" "gke_neg" {
  project              = "my-gcp-project"
  name                 = "gke-pod-neg"
  network              = google_compute_network.gke_vpc.id
  subnetwork           = google_compute_subnetwork.gke_subnet.id
  default_port         = 8080
  zone                 = "us-central1-a"
  network_endpoint_type = "GCE_VM_IP_PORT"

  description = "NEG for GKE Pod-level load balancing"
}
```

**Explanation:** NEGs enable container-native load balancing where the load balancer sends traffic directly to Pod IPs rather than through kube-proxy on nodes. This eliminates a network hop and improves health checking granularity. GKE can automatically manage NEGs via the `cloud.google.com/neg` Service annotation, but this example shows manual Terraform creation for custom configurations.

---

### Example 24: Serverless NEG for Cloud Run Backend

**Concept:** Create a serverless NEG to include a Cloud Run service as a backend in the same load balancer as GKE.

```hcl
resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  project               = "my-gcp-project"
  name                  = "cloudrun-serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_run {
    service = "my-cloud-run-service"
  }
}
```

**Explanation:** Serverless NEGs allow Cloud Run, App Engine, and Cloud Functions to be backends behind the same global load balancer as GKE services. This enables URL-based routing where some paths go to GKE and others to serverless endpoints. No Compute Engine instances are created — the NEG is a pointer to the serverless platform.

---

### Example 25: VPC Connector for Serverless to GKE Connectivity

**Concept:** Create a Serverless VPC Access connector to allow Cloud Run to reach GKE internal services.

```hcl
resource "google_vpc_access_connector" "serverless_connector" {
  project        = "my-gcp-project"
  name           = "gke-vpc-connector"
  region         = "us-central1"
  network        = google_compute_network.gke_vpc.name
  ip_cidr_range  = "10.8.0.0/28"
  min_throughput = 200
  max_throughput = 1000

  subnet {
    name = google_compute_subnetwork.gke_subnet.name
  }
}
```

**Explanation:** The VPC Access connector bridges the serverless VPC and your custom VPC using a `/28` subnet (the minimum allowed). Setting `min_throughput` and `max_throughput` controls auto-scaling of connector instances, which are billed per throughput tier. This is the only way for Cloud Run and Cloud Functions to make requests to GKE services on internal IPs.

---

### Example 26: Cloud Router with Custom Route Advertisements

**Concept:** Configure a Cloud Router to advertise specific custom IP ranges over BGP.

```hcl
resource "google_compute_router" "gke_router_bgp" {
  project = "my-gcp-project"
  name    = "gke-router-custom-bgp"
  region  = "us-central1"
  network = google_compute_network.gke_vpc.id

  bgp {
    asn            = 64514
    advertise_mode = "CUSTOM"

    advertised_ip_ranges {
      range       = "10.0.0.0/20"
      description = "GKE primary subnet"
    }

    advertised_ip_ranges {
      range       = "10.48.0.0/14"
      description = "GKE Pod CIDR range"
    }

    advertised_ip_ranges {
      range       = "10.52.0.0/20"
      description = "GKE Service CIDR range"
    }
  }
}
```

**Explanation:** Advertising Pod and Service CIDRs over BGP is necessary when on-premises systems need to reach Kubernetes Pods and Services directly through a Cloud Interconnect or VPN tunnel. Without advertising the secondary ranges, only the primary node subnet is reachable from on-premises. This configuration is essential for hybrid cloud GKE deployments.

---

## NESTED (Examples 27–38)

---

### Example 27: Full VPC Networking Module — Variables and Locals

**Concept:** Define module inputs and computed locals for a reusable GKE VPC module.

```hcl
# modules/gke-networking/variables.tf
variable "project_id" {
  type        = string
  description = "GCP project ID"
  default     = "my-gcp-project"
}

variable "region" {
  type        = string
  description = "GCP region"
  default     = "us-central1"
}

variable "vpc_name" {
  type    = string
  default = "gke-vpc"
}

variable "subnet_cidr" {
  type    = string
  default = "10.0.0.0/20"
}

variable "pods_cidr" {
  type    = string
  default = "10.48.0.0/14"
}

variable "services_cidr" {
  type    = string
  default = "10.52.0.0/20"
}

variable "master_ipv4_cidr" {
  type    = string
  default = "172.16.0.32/28"
}

# modules/gke-networking/locals.tf
locals {
  subnet_name           = "${var.vpc_name}-subnet"
  pods_range_name       = "${var.vpc_name}-pods"
  services_range_name   = "${var.vpc_name}-services"
  router_name           = "${var.vpc_name}-router"
  nat_name              = "${var.vpc_name}-nat"
}
```

**Explanation:** Separating variables and locals into dedicated files follows Terraform module best practices and makes the module's interface explicit. The `locals` block computes derived names that enforce a consistent naming convention across all resources in the module. Using `var.vpc_name` as a prefix throughout ensures all resources can be identified as belonging to a specific VPC instance.

---

### Example 28: Full VPC Networking Module — Core Resources

**Concept:** Compose VPC, subnet, router, and NAT into a single callable module.

```hcl
# modules/gke-networking/main.tf
resource "google_compute_network" "vpc" {
  project                 = var.project_id
  name                    = var.vpc_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "gke" {
  project                  = var.project_id
  name                     = local.subnet_name
  ip_cidr_range            = var.subnet_cidr
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = local.pods_range_name
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = local.services_range_name
    ip_cidr_range = var.services_cidr
  }
}

resource "google_compute_router" "router" {
  project = var.project_id
  name    = local.router_name
  region  = var.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  project                            = var.project_id
  name                               = local.nat_name
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
```

**Explanation:** This module encapsulates the four foundational networking resources every GKE cluster needs. Using `ALL_SUBNETWORKS_ALL_IP_RANGES` for NAT ensures that future subnets added to this VPC automatically get NAT coverage without module updates. The module can be called multiple times with different `vpc_name` values to create isolated environments (dev, staging, prod).

---

### Example 29: Full VPC Networking Module — Firewall Rules

**Concept:** Add baseline GKE firewall rules to the networking module.

```hcl
# modules/gke-networking/firewall.tf
resource "google_compute_firewall" "allow_internal" {
  project  = var.project_id
  name     = "${var.vpc_name}-allow-internal"
  network  = google_compute_network.vpc.name
  priority = 1000

  allow { protocol = "tcp" }
  allow { protocol = "udp" }
  allow { protocol = "icmp" }

  source_ranges = [
    var.subnet_cidr,
    var.pods_cidr,
    var.services_cidr
  ]
}

resource "google_compute_firewall" "master_to_nodes" {
  project  = var.project_id
  name     = "${var.vpc_name}-master-to-nodes"
  network  = google_compute_network.vpc.name
  priority = 1000

  allow {
    protocol = "tcp"
    ports    = ["10250", "443", "8443"]
  }

  source_ranges = [var.master_ipv4_cidr]
  target_tags   = ["gke-${var.vpc_name}"]
}

resource "google_compute_firewall" "allow_health_checks" {
  project  = var.project_id
  name     = "${var.vpc_name}-allow-hc"
  network  = google_compute_network.vpc.name
  priority = 900

  allow {
    protocol = "tcp"
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  target_tags   = ["gke-${var.vpc_name}"]
}
```

**Explanation:** Scoping `source_ranges` for internal traffic to only the three GKE CIDRs (node, pod, service) is more precise than the broad `10.0.0.0/8` used in earlier examples. Including port `8443` in the master-to-nodes rule supports admission webhook servers running on non-standard ports. The dynamic `target_tags` using `vpc_name` prevent tag collisions when multiple GKE clusters share a VPC.

---

### Example 30: Full VPC Networking Module — Outputs

**Concept:** Export all values needed by the GKE cluster module from the networking module.

```hcl
# modules/gke-networking/outputs.tf
output "network_id" {
  value = google_compute_network.vpc.id
}

output "network_name" {
  value = google_compute_network.vpc.name
}

output "subnet_name" {
  value = google_compute_subnetwork.gke.name
}

output "pods_range_name" {
  value = local.pods_range_name
}

output "services_range_name" {
  value = local.services_range_name
}

output "node_tag" {
  value = "gke-${var.vpc_name}"
  description = "Network tag to apply to GKE nodes"
}

# Root module calling the networking module
module "gke_networking" {
  source       = "./modules/gke-networking"
  project_id   = "my-gcp-project"
  region       = "us-central1"
  vpc_name     = "gke-vpc"
  subnet_cidr  = "10.0.0.0/20"
  pods_cidr    = "10.48.0.0/14"
  services_cidr = "10.52.0.0/20"
}
```

**Explanation:** Well-defined module outputs create a clear contract between the networking module and consumers. The `node_tag` output provides the exact tag that should be added to GKE node pools, ensuring firewall rules correctly target the nodes. Callers reference these as `module.gke_networking.network_name`, `module.gke_networking.subnet_name`, etc.

---

### Example 31: KCC ComputeNetwork — Mirror of Terraform VPC

**Concept:** Define a GKE VPC using the KCC `ComputeNetwork` custom resource definition.

```yaml
# kcc/compute-network.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: gke-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
    cnrm.cloud.google.com/deletion-policy: "abandon"
spec:
  autoCreateSubnetworks: false
  routingMode: REGIONAL
  description: "Custom VPC for GKE workloads managed by KCC"
```

**Explanation:** KCC (Config Connector) translates Kubernetes CRD manifests into GCP API calls, allowing GCP infrastructure to be managed via `kubectl apply`. The `deletion-policy: abandon` annotation prevents accidental VPC deletion when the CRD is removed — critical for production networks. The `namespace: config-connector` is where KCC resources are typically deployed, tied to a Workload Identity-bound service account.

---

### Example 32: KCC ComputeSubnetwork — Mirror of Terraform Subnet

**Concept:** Define a GKE subnetwork with secondary ranges using the KCC `ComputeSubnetwork` CRD.

```yaml
# kcc/compute-subnetwork.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  region: us-central1
  ipCidrRange: "10.0.0.0/20"
  networkRef:
    name: gke-vpc
  privateIpGoogleAccess: true
  secondaryIpRange:
    - rangeName: gke-pods
      ipCidrRange: "10.48.0.0/14"
    - rangeName: gke-services
      ipCidrRange: "10.52.0.0/20"
  logConfig:
    enable: true
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
  description: "GKE subnetwork managed by KCC"
```

**Explanation:** KCC uses `networkRef` to reference other KCC-managed resources by name, establishing dependency order automatically through the KCC controller. The `logConfig` section enables VPC Flow Logs directly in the subnet definition, avoiding the need for a separate configuration resource. KCC ensures this subnet cannot be created before the referenced `ComputeNetwork` exists.

---

### Example 33: KCC ComputeFirewall — Master to Node Rule

**Concept:** Manage a GKE firewall rule declaratively through KCC.

```yaml
# kcc/firewall-master-to-nodes.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: gke-master-to-nodes
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  networkRef:
    name: gke-vpc
  direction: INGRESS
  priority: 1000
  allowed:
    - ipProtocol: tcp
      ports:
        - "10250"
        - "443"
        - "8443"
  sourceRanges:
    - "172.16.0.32/28"
  targetTags:
    - gke-node
  description: "KCC-managed firewall: allow GKE control plane to nodes"
```

**Explanation:** Managing firewall rules via KCC enables GitOps workflows where firewall policy changes go through pull request review before being applied to GCP. The `networkRef` creates an implicit dependency ensuring the network exists before the firewall rule. Changes to this manifest trigger reconciliation by the KCC controller, which calls the GCP Compute API to update the firewall rule.

---

### Example 34: Terraform VPC Outputs Consumed by GKE Cluster Resource

**Concept:** Use networking module outputs directly in a `google_container_cluster` resource configuration.

```hcl
resource "google_container_cluster" "my_gke_cluster" {
  project  = "my-gcp-project"
  name     = "my-gke-cluster"
  location = "us-central1"

  network    = module.gke_networking.network_name
  subnetwork = module.gke_networking.subnet_name

  networking_mode = "VPC_NATIVE"

  ip_allocation_policy {
    cluster_secondary_range_name  = module.gke_networking.pods_range_name
    services_secondary_range_name = module.gke_networking.services_range_name
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.32/28"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/20"
      display_name = "GKE subnet access to master"
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1

  depends_on = [module.gke_networking]
}
```

**Explanation:** This example demonstrates the full integration between the networking module and the GKE cluster — the cluster consumes all networking outputs. `networking_mode = "VPC_NATIVE"` is required when using secondary IP ranges for alias IPs (the modern GKE approach). `enable_private_nodes = true` ensures nodes only get internal IPs, relying on Cloud NAT from the networking module for internet access.

---

### Example 35: Private GKE Cluster with Private Service Connect (PSC)

**Concept:** Configure GKE to use Private Service Connect for accessing the Kubernetes API server endpoint.

```hcl
resource "google_compute_subnetwork" "psc_subnet" {
  project       = "my-gcp-project"
  name          = "gke-psc-subnet"
  ip_cidr_range = "10.2.0.0/29"
  region        = "us-central1"
  network       = google_compute_network.gke_vpc.id
  purpose       = "PRIVATE_SERVICE_CONNECT"
}

resource "google_container_cluster" "private_psc_cluster" {
  project  = "my-gcp-project"
  name     = "my-gke-cluster-psc"
  location = "us-central1"
  network  = google_compute_network.gke_vpc.name
  subnetwork = google_compute_subnetwork.gke_subnet.name

  networking_mode = "VPC_NATIVE"

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = true
    master_ipv4_cidr_block  = "172.16.1.0/28"

    master_global_access_config {
      enabled = true
    }
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  private_service_connect_config {
    network_attachment_resource = google_compute_network_attachment.psc_attachment.id
    no_additional_range_config  = false
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_compute_network_attachment" "psc_attachment" {
  project     = "my-gcp-project"
  name        = "gke-psc-attachment"
  region      = "us-central1"
  connection_preference = "ACCEPT_AUTOMATIC"

  subnetworks = [google_compute_subnetwork.psc_subnet.self_link]
}
```

**Explanation:** PSC for GKE replaces the traditional VPC peering used to connect to the GKE control plane, providing a more secure and scalable architecture. `enable_private_endpoint = true` means the API server endpoint is only accessible via the PSC endpoint IP within the VPC. `master_global_access_config.enabled = true` allows the control plane to be reached from any region within the VPC, not just the cluster's region.

---

### Example 36: KCC-Managed ComputeRouter and ComputeRouterNAT

**Concept:** Define Cloud Router and Cloud NAT as KCC resources for GitOps-managed networking.

```yaml
# kcc/cloud-router.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: ComputeRouter
metadata:
  name: gke-router
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  region: us-central1
  networkRef:
    name: gke-vpc
  description: "Cloud Router for GKE NAT"
  bgp:
    asn: 64514
    advertiseMode: CUSTOM
    advertisedGroups:
      - ALL_SUBNETS
---
# kcc/cloud-nat.yaml
apiVersion: cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: gke-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  region: us-central1
  routerRef:
    name: gke-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
  logConfig:
    enable: true
    filter: ERRORS_ONLY
  minPortsPerVm: 64
```

**Explanation:** Using a YAML multi-document with `---` separator allows deploying both resources in a single `kubectl apply -f`. The `routerRef` in the NAT resource creates a KCC dependency — the NAT will not be created until the router is active. Managing NAT via KCC means NAT configuration changes can be reviewed and approved through Kubernetes admission webhooks or OPA/Gatekeeper policies.

---

### Example 37: Terraform GKE Networking with Dataplane V2 (eBPF/Cilium)

**Concept:** Enable GKE Dataplane V2 which uses Cilium/eBPF for advanced network policy enforcement.

```hcl
resource "google_container_cluster" "dpv2_cluster" {
  project  = "my-gcp-project"
  name     = "my-gke-cluster"
  location = "us-central1"
  network    = google_compute_network.gke_vpc.name
  subnetwork = google_compute_subnetwork.gke_subnet.name

  networking_mode = "VPC_NATIVE"

  datapath_provider = "ADVANCED_DATAPATH"

  network_policy {
    enabled  = false
    provider = "CALICO"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  addons_config {
    network_policy_config {
      disabled = true
    }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}
```

**Explanation:** `datapath_provider = "ADVANCED_DATAPATH"` enables GKE Dataplane V2, which uses eBPF for packet processing instead of iptables/kube-proxy, significantly reducing network latency. When Dataplane V2 is enabled, the Calico network policy addon must be disabled (`network_policy.enabled = false`) since Cilium handles policy enforcement natively. Dataplane V2 also enables native Kubernetes NetworkPolicy without any additional CNI plugins.

---

### Example 38: Terraform Module Composition — Networking + DNS + GKE Cluster

**Concept:** Compose networking, DNS, and GKE cluster modules in a root configuration.

```hcl
# Root main.tf — composing all networking layers
module "networking" {
  source        = "./modules/gke-networking"
  project_id    = "my-gcp-project"
  region        = "us-central1"
  vpc_name      = "gke-vpc"
  subnet_cidr   = "10.0.0.0/20"
  pods_cidr     = "10.48.0.0/14"
  services_cidr = "10.52.0.0/20"
}

module "dns" {
  source     = "./modules/gke-dns"
  project_id = "my-gcp-project"
  vpc_id     = module.networking.network_id
  dns_suffix = "internal.gke.example.com."

  depends_on = [module.networking]
}

module "gke_cluster" {
  source         = "./modules/gke-cluster"
  project_id     = "my-gcp-project"
  cluster_name   = "my-gke-cluster"
  region         = "us-central1"
  network_name   = module.networking.network_name
  subnet_name    = module.networking.subnet_name
  pods_range     = module.networking.pods_range_name
  services_range = module.networking.services_range_name
  node_tag       = module.networking.node_tag

  depends_on = [module.networking, module.dns]
}

output "cluster_endpoint" {
  value     = module.gke_cluster.endpoint
  sensitive = true
}
```

**Explanation:** This root configuration demonstrates the complete three-tier module composition: networking → DNS → cluster. Explicit `depends_on` module dependencies ensure apply order even when direct resource references might not create implicit dependencies between modules. Using this structure, `terraform plan` gives a clear preview of all networking changes before they affect the GKE cluster.

---

## ADVANCED (Examples 39–50)

---

### Example 39: Multi-Region VPC with Cloud Interconnect VLAN Attachments

**Concept:** Extend the GKE VPC across two regions with Cloud Interconnect VLAN attachments for on-premises connectivity.

```hcl
resource "google_compute_router" "us_router" {
  project = "my-gcp-project"
  name    = "gke-router-us-central1"
  region  = "us-central1"
  network = google_compute_network.gke_vpc.id
  bgp {
    asn = 64514
  }
}

resource "google_compute_router" "eu_router" {
  project = "my-gcp-project"
  name    = "gke-router-eu-west1"
  region  = "europe-west1"
  network = google_compute_network.gke_vpc.id
  bgp {
    asn = 64514
  }
}

resource "google_compute_interconnect_attachment" "us_attachment" {
  project              = "my-gcp-project"
  name                 = "gke-ic-us-central1"
  router               = google_compute_router.us_router.id
  type                 = "PARTNER"
  edge_availability_domain = "AVAILABILITY_DOMAIN_1"
  region               = "us-central1"
  admin_enabled        = true
  bandwidth            = "BPS_10G"
  vlan_tag8021q        = 1001
  description          = "Cloud Interconnect VLAN attachment for us-central1 GKE"
}

resource "google_compute_interconnect_attachment" "eu_attachment" {
  project              = "my-gcp-project"
  name                 = "gke-ic-eu-west1"
  router               = google_compute_router.eu_router.id
  type                 = "PARTNER"
  edge_availability_domain = "AVAILABILITY_DOMAIN_2"
  region               = "europe-west1"
  admin_enabled        = true
  bandwidth            = "BPS_10G"
  vlan_tag8021q        = 1002
  description          = "Cloud Interconnect VLAN attachment for eu-west1 GKE"
}
```

**Explanation:** Using `PARTNER` type interconnects (as opposed to `DEDICATED`) allows connection through a Cloud Interconnect partner without owning a cage in a colocation facility. Separate routers per region and different `edge_availability_domain` values provide redundancy across GCP's physical infrastructure. The VLAN tags (`1001`, `1002`) must match the configuration on the customer edge router at the colocation.

---

### Example 40: Traffic Director — gRPC Service Mesh with Terraform

**Concept:** Configure Traffic Director as a managed service mesh control plane for GKE gRPC services.

```hcl
resource "google_compute_health_check" "grpc_hc" {
  project             = "my-gcp-project"
  name                = "td-grpc-health-check"
  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 2

  grpc_health_check {
    port = 50051
    grpc_service_name = "helloworld.Greeter"
  }
}

resource "google_compute_backend_service" "td_backend" {
  project               = "my-gcp-project"
  name                  = "td-grpc-backend"
  load_balancing_scheme = "INTERNAL_SELF_MANAGED"
  protocol              = "GRPC"
  health_checks         = [google_compute_health_check.grpc_hc.id]

  backend {
    group           = "projects/my-gcp-project/zones/us-central1-a/networkEndpointGroups/gke-grpc-neg"
    balancing_mode  = "RATE"
    max_rate_per_endpoint = 100
  }
}

resource "google_compute_url_map" "td_url_map" {
  project         = "my-gcp-project"
  name            = "td-grpc-url-map"
  default_service = google_compute_backend_service.td_backend.id
}

resource "google_compute_target_grpc_proxy" "td_proxy" {
  project        = "my-gcp-project"
  name           = "td-grpc-proxy"
  url_map        = google_compute_url_map.td_url_map.id
  validate_for_proxyless = true
}

resource "google_compute_global_forwarding_rule" "td_rule" {
  project               = "my-gcp-project"
  name                  = "td-grpc-forwarding-rule"
  load_balancing_scheme = "INTERNAL_SELF_MANAGED"
  port_range            = "50051"
  target                = google_compute_target_grpc_proxy.td_proxy.id
  ip_address            = "0.0.0.0"
  network               = google_compute_network.gke_vpc.id
}
```

**Explanation:** Traffic Director uses `INTERNAL_SELF_MANAGED` load balancing scheme to act as a xDS control plane — it doesn't forward traffic itself but distributes load balancing configuration to Envoy proxies or gRPC clients. `validate_for_proxyless = true` enables proxyless gRPC service mesh where the gRPC client library itself acts as an xDS client without a sidecar proxy. The forwarding rule's `ip_address = "0.0.0.0"` is intentional — it tells Traffic Director to intercept all traffic to this port.

---

### Example 41: Global HTTPS Load Balancer with GKE NEGs

**Concept:** Build a global HTTPS load balancer that routes traffic to GKE Pods via NEGs.

```hcl
resource "google_compute_global_forwarding_rule" "https_lb" {
  project               = "my-gcp-project"
  name                  = "gke-https-lb"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  ip_address            = google_compute_global_address.gke_ingress_ip.address
  ip_protocol           = "TCP"
  port_range            = "443"
  target                = google_compute_target_https_proxy.https_proxy.id
}

resource "google_compute_target_https_proxy" "https_proxy" {
  project          = "my-gcp-project"
  name             = "gke-https-proxy"
  url_map          = google_compute_url_map.gke_url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

resource "google_compute_managed_ssl_certificate" "cert" {
  project = "my-gcp-project"
  name    = "gke-managed-cert"
  managed {
    domains = ["app.gke.example.com"]
  }
}

resource "google_compute_url_map" "gke_url_map" {
  project         = "my-gcp-project"
  name            = "gke-url-map"
  default_service = google_compute_backend_service.gke_neg_backend.id

  host_rule {
    hosts        = ["app.gke.example.com"]
    path_matcher = "api-paths"
  }

  path_matcher {
    name            = "api-paths"
    default_service = google_compute_backend_service.gke_neg_backend.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.gke_neg_backend.id
    }

    path_rule {
      paths   = ["/static/*"]
      service = google_compute_backend_service.gke_neg_backend.id
    }
  }
}

resource "google_compute_backend_service" "gke_neg_backend" {
  project               = "my-gcp-project"
  name                  = "gke-neg-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP"
  port_name             = "http"
  health_checks         = [google_compute_health_check.grpc_hc.id]

  backend {
    group           = google_compute_network_endpoint_group.gke_neg.id
    balancing_mode  = "RATE"
    max_rate_per_endpoint = 100
    capacity_scaler = 1.0
  }

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    max_ttl           = 86400
    client_ttl        = 3600
    negative_caching  = true
    serve_while_stale = 86400
  }

  compression_mode = "AUTOMATIC"
}
```

**Explanation:** `EXTERNAL_MANAGED` scheme uses the newer Google Cloud Load Balancer (GCLB) infrastructure with improved capabilities over the legacy `EXTERNAL` scheme. The URL map enables path-based routing without requiring multiple ingress objects in Kubernetes. Google-managed SSL certificates (`google_compute_managed_ssl_certificate`) automate TLS provisioning and renewal, eliminating certificate management overhead.

---

### Example 42: Hierarchical Firewall Policies at the Organization Level

**Concept:** Define organization-level hierarchical firewall policies that apply to all GKE projects.

```hcl
resource "google_compute_firewall_policy" "org_policy" {
  parent      = "organizations/123456789"
  short_name  = "org-gke-security-policy"
  description = "Organization-wide firewall policy for GKE workloads"
}

resource "google_compute_firewall_policy_rule" "deny_ssh_from_internet" {
  firewall_policy = google_compute_firewall_policy.org_policy.name
  priority        = 1000
  action          = "deny"
  direction       = "INGRESS"
  description     = "Block SSH from internet - use IAP instead"

  match {
    src_ip_ranges = ["0.0.0.0/0"]

    layer4_configs {
      ip_protocol = "tcp"
      ports       = ["22"]
    }
  }
}

resource "google_compute_firewall_policy_rule" "allow_google_apis" {
  firewall_policy = google_compute_firewall_policy.org_policy.name
  priority        = 500
  action          = "allow"
  direction       = "EGRESS"
  description     = "Allow egress to Google APIs"

  match {
    dest_ip_ranges = ["199.36.153.8/30", "199.36.153.4/30"]

    layer4_configs {
      ip_protocol = "tcp"
      ports       = ["443"]
    }
  }
}

resource "google_compute_firewall_policy_association" "org_to_folder" {
  firewall_policy    = google_compute_firewall_policy.org_policy.name
  attachment_target  = "folders/987654321"
  name               = "gke-projects-policy-association"
}
```

**Explanation:** Hierarchical firewall policies are evaluated before VPC-level firewall rules, providing a security baseline that cannot be overridden by project-level administrators. The `deny_ssh_from_internet` rule enforces the use of Identity-Aware Proxy (IAP) for SSH access to all GKE nodes across the organization. The Google restricted API IP ranges (`199.36.153.x`) are used for VPC Service Controls perimeter egress.

---

### Example 43: Network Security Policy with Cloud Armor

**Concept:** Create a Google Cloud Armor security policy to protect GKE HTTPS load balancer backends.

```hcl
resource "google_compute_security_policy" "gke_armor_policy" {
  project     = "my-gcp-project"
  name        = "gke-cloud-armor-policy"
  description = "Cloud Armor policy for GKE HTTPS load balancer"

  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQL injection attacks"
  }

  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  rule {
    action   = "throttle"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["0.0.0.0/0"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
    description = "Global rate limit: 100 req/min per IP"
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["0.0.0.0/0"]
      }
    }
    description = "Default allow rule"
  }
}
```

**Explanation:** Cloud Armor preconfigured rules (`evaluatePreconfiguredExpr`) leverage Google's managed WAF rule sets updated by Google's security team, removing the burden of maintaining custom WAF signatures. Adaptive Protection automatically detects and suggests rules for Layer 7 DDoS patterns based on machine learning analysis of traffic. The `throttle` action with `deny(429)` properly signals rate limiting to clients with the correct HTTP status code.

---

### Example 44: Attach Cloud Armor Policy to GKE Backend Service

**Concept:** Associate the Cloud Armor security policy with the GKE NEG backend service.

```hcl
resource "google_compute_backend_service" "protected_gke_backend" {
  project               = "my-gcp-project"
  name                  = "gke-protected-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP"
  health_checks         = [google_compute_health_check.grpc_hc.id]

  security_policy = google_compute_security_policy.gke_armor_policy.id

  backend {
    group           = google_compute_network_endpoint_group.gke_neg.id
    balancing_mode  = "RATE"
    max_rate_per_endpoint = 100
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  outlier_detection {
    consecutive_errors                    = 5
    interval                              = { seconds = 10 }
    base_ejection_time                    = { seconds = 30 }
    max_ejection_percent                  = 50
    consecutive_gateway_failure           = 3
    enforcing_consecutive_errors          = 100
    enforcing_consecutive_gateway_failure = 0
    enforcing_success_rate                = 100
    success_rate_minimum_hosts            = 5
    success_rate_request_volume           = 100
    success_rate_stdev_factor             = 1900
  }
}
```

**Explanation:** Attaching `security_policy` to the backend service activates Cloud Armor inspection for all traffic before it reaches GKE Pods. `outlier_detection` implements circuit breaking — backends with elevated error rates are temporarily ejected from the load balancing pool, preventing cascading failures. `log_config.sample_rate = 1.0` enables 100% request logging to Cloud Logging, necessary for security auditing.

---

### Example 45: VPC Service Controls — Access Policy and Perimeter

**Concept:** Create a VPC Service Controls perimeter to restrict GCP API access to within the GKE VPC.

```hcl
resource "google_access_context_manager_access_policy" "org_policy" {
  parent = "organizations/123456789"
  title  = "GKE Access Policy"
}

resource "google_access_context_manager_service_perimeter" "gke_perimeter" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/servicePerimeters/gke-perimeter"
  title  = "GKE Service Perimeter"

  spec {
    resources = [
      "projects/123456789012",
    ]

    restricted_services = [
      "storage.googleapis.com",
      "bigquery.googleapis.com",
      "container.googleapis.com",
      "artifactregistry.googleapis.com",
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services = [
        "storage.googleapis.com",
        "container.googleapis.com",
        "artifactregistry.googleapis.com",
      ]
    }

    ingress_policies {
      ingress_from {
        sources {
          resource = "projects/my-gcp-project"
        }
        identity_type = "ANY_SERVICE_ACCOUNT"
      }
      ingress_to {
        resources  = ["*"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors {
            method = "*"
          }
        }
      }
    }

    egress_policies {
      egress_from {
        identity_type = "ANY_SERVICE_ACCOUNT"
      }
      egress_to {
        resources = ["*"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors {
            method = "google.storage.objects.list"
          }
        }
      }
    }
  }

  use_explicit_dry_run_spec = true
}
```

**Explanation:** VPC Service Controls create a security perimeter around GCP projects, preventing data exfiltration through the APIs of restricted services even if credentials are compromised. `use_explicit_dry_run_spec = true` enables dry-run mode, which logs violations without blocking requests — essential for testing perimeter rules before enforcement. The `vpc_accessible_services` restriction ensures that only perimeter-trusted services can be called from within the VPC, blocking API calls to unvetted services from GKE workloads.

---

### Example 46: VPC Service Controls — Access Level for Trusted Networks

**Concept:** Define an access level that grants VPC Service Controls perimeter access to corporate network CIDRs.

```hcl
resource "google_access_context_manager_access_level" "trusted_network" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/accessLevels/trusted_network"
  title  = "Trusted Corporate Network"

  basic {
    combining_function = "AND"

    conditions {
      ip_subnetworks = [
        "203.0.113.0/24",
        "198.51.100.0/24",
      ]
      regions = ["US", "GB"]

      required_access_levels = []

      members = [
        "serviceAccount:gke-sa@my-gcp-project.iam.gserviceaccount.com"
      ]
    }
  }
}

resource "google_access_context_manager_service_perimeter" "enforced_perimeter" {
  parent = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${google_access_context_manager_access_policy.org_policy.name}/servicePerimeters/gke-enforced"
  title  = "GKE Enforced Perimeter"

  status {
    resources = ["projects/123456789012"]

    restricted_services = [
      "storage.googleapis.com",
      "bigquery.googleapis.com",
    ]

    access_levels = [
      google_access_context_manager_access_level.trusted_network.name,
    ]
  }
}
```

**Explanation:** Access levels define conditions under which principals can bypass VPC Service Controls restrictions. The `AND` combining function requires all conditions to be true simultaneously — IP subnet match AND region match AND specific service account. This creates a strong context-aware access gate where GKE workloads running in the trusted IP range and region can access restricted services. Transitioning from `spec` (dry-run) to `status` (enforced) should be done after validating dry-run logs.

---

### Example 47: KCC-Based NetworkPolicy Management

**Concept:** Manage Kubernetes NetworkPolicy resources via KCC to enforce Pod-level network isolation.

```yaml
# kcc/network-policy-deny-all.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
  annotations:
    cnrm.cloud.google.com/project-id: "my-gcp-project"
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
# kcc/network-policy-allow-frontend.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
        - namespaceSelector:
            matchLabels:
              name: production
      ports:
        - protocol: TCP
          port: 8080
---
# kcc/network-policy-allow-dns.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

**Explanation:** The three-policy pattern is the recommended approach: start with a default-deny-all, then add specific allow rules. Managing NetworkPolicies through KCC (stored in Git) enables policy changes to go through code review, providing an audit trail for compliance. The DNS egress allowance is critical — without it, the default-deny policy blocks kube-dns resolution, breaking all service discovery in the namespace.

---

### Example 48: Terraform — GKE Workload Identity with Network-Scoped Service Account

**Concept:** Configure Workload Identity linking a Kubernetes service account to a GCP service account with network permissions.

```hcl
resource "google_service_account" "gke_network_sa" {
  project      = "my-gcp-project"
  account_id   = "gke-network-workload"
  display_name = "GKE Network Workload Identity SA"
  description  = "Service account for GKE workloads needing network resource access"
}

resource "google_project_iam_member" "network_viewer" {
  project = "my-gcp-project"
  role    = "roles/compute.networkViewer"
  member  = "serviceAccount:${google_service_account.gke_network_sa.email}"
}

resource "google_project_iam_member" "dns_admin" {
  project = "my-gcp-project"
  role    = "roles/dns.admin"
  member  = "serviceAccount:${google_service_account.gke_network_sa.email}"
}

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.gke_network_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-gcp-project.svc.id.goog[production/external-dns]"
}

# Corresponding Kubernetes ServiceAccount (applied via Helm or kubectl)
# apiVersion: v1
# kind: ServiceAccount
# metadata:
#   name: external-dns
#   namespace: production
#   annotations:
#     iam.gke.io/gcp-service-account: gke-network-workload@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** Workload Identity replaces node-level service account credentials with Pod-level identity, ensuring the principle of least privilege at the workload layer. The IAM binding `my-gcp-project.svc.id.goog[production/external-dns]` links the Kubernetes service account `external-dns` in the `production` namespace to the GCP service account. With `roles/dns.admin`, the ExternalDNS controller running in GKE can update Cloud DNS records when services are created.

---

### Example 49: Multi-Cluster Service Discovery with Cloud DNS Routing Policy

**Concept:** Use Cloud DNS geo-routing to direct traffic to the nearest of multiple regional GKE clusters.

```hcl
resource "google_dns_record_set" "geo_routed_api" {
  project      = "my-gcp-project"
  name         = "api.gke.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 30

  routing_policy {
    geo {
      location = "us-central1"
      rrdatas  = [google_compute_global_address.gke_ingress_ip.address]
    }

    geo {
      location = "europe-west1"
      rrdatas  = ["34.90.100.200"]
    }

    geo {
      location = "asia-east1"
      rrdatas  = ["34.81.200.100"]
    }
  }
}

resource "google_dns_record_set" "weighted_canary" {
  project      = "my-gcp-project"
  name         = "canary.gke.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 30

  routing_policy {
    wrr {
      weight  = 90
      rrdatas = [google_compute_global_address.gke_ingress_ip.address]
    }

    wrr {
      weight  = 10
      rrdatas = ["34.102.200.100"]
    }
  }
}
```

**Explanation:** Cloud DNS geo-routing directs users to their closest GKE cluster load balancer based on the DNS resolver's geographic location, reducing latency for globally distributed users. The weighted round-robin (WRR) policy for canary releases allows sending 10% of traffic to a new GKE cluster version without modifying application code or load balancer configurations. A TTL of 30 seconds ensures rapid failover when updating routing weights during incidents.

---

### Example 50: Complete Network Security Stack — Helm Values Integration

**Concept:** Generate Helm chart values from Terraform networking outputs for a complete ingress-nginx + cert-manager deployment.

```hcl
# Generate Helm values from Terraform networking state
resource "local_file" "ingress_nginx_values" {
  filename = "${path.module}/helm-values/ingress-nginx-values.yaml"
  content  = <<-EOT
    controller:
      replicaCount: 3
      service:
        loadBalancerIP: "${google_compute_global_address.gke_ingress_ip.address}"
        annotations:
          cloud.google.com/neg: '{"ingress": true}'
          cloud.google.com/backend-config: '{"default": "ingress-backendconfig"}'
      config:
        use-forwarded-headers: "true"
        compute-full-forwarded-for: "true"
        use-proxy-protocol: "false"
      metrics:
        enabled: true
        serviceMonitor:
          enabled: true
      podAnnotations:
        cluster-autoscaler.kubernetes.io/safe-to-evict: "true"
    defaultBackend:
      enabled: true
  EOT
}

resource "local_file" "cert_manager_values" {
  filename = "${path.module}/helm-values/cert-manager-values.yaml"
  content  = <<-EOT
    installCRDs: true
    global:
      leaderElection:
        namespace: cert-manager
    serviceAccount:
      annotations:
        iam.gke.io/gcp-service-account: "${google_service_account.gke_network_sa.email}"
    extraArgs:
      - --dns01-recursive-nameservers=8.8.8.8:53,1.1.1.1:53
      - --dns01-recursive-nameservers-only
    clusterResourceNamespace: cert-manager
  EOT
}

# ClusterIssuer for Let's Encrypt with Cloud DNS solver
# (applied after cert-manager Helm install)
# apiVersion: cert-manager.io/v1
# kind: ClusterIssuer
# metadata:
#   name: letsencrypt-prod
# spec:
#   acme:
#     server: https://acme-v02.api.letsencrypt.org/directory
#     email: admin@example.com
#     privateKeySecretRef:
#       name: letsencrypt-prod
#     solvers:
#       - dns01:
#           cloudDNS:
#             project: my-gcp-project
#             serviceAccountSecretRef:
#               name: cert-manager-gcp-sa
#               key: key.json
```

**Explanation:** Using `local_file` to generate Helm values from Terraform outputs creates a tight integration between infrastructure and application configuration without requiring manual value copying. The `cloud.google.com/neg: '{"ingress": true}'` annotation on the ingress-nginx service instructs GKE to automatically create and manage NEGs for container-native load balancing. Cert-manager's Workload Identity annotation (`iam.gke.io/gcp-service-account`) binds it to the GCP service account with Cloud DNS permissions, enabling automated DNS-01 ACME challenge solving for wildcard certificates.

---
