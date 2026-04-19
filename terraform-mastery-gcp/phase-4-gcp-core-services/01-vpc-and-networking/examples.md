# Examples 4.1 — VPC & Networking (GCP) (50 examples)

---

## Basic

### 1. Custom VPC network
```hcl
resource "google_compute_network" "vpc" {
  name                    = "my-vpc"
  auto_create_subnetworks = false
}
```

### 2. Subnet in a VPC
```hcl
resource "google_compute_subnetwork" "main" {
  name          = "main-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.vpc.id
}
```

### 3. Firewall rule — allow HTTP/HTTPS
```hcl
resource "google_compute_firewall" "allow_web" {
  name    = "allow-web"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}
```

### 4. Firewall rule — allow internal traffic
```hcl
resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = google_compute_network.vpc.name

  allow { protocol = "tcp";  ports = ["0-65535"] }
  allow { protocol = "udp";  ports = ["0-65535"] }
  allow { protocol = "icmp" }

  source_ranges = ["10.0.0.0/8"]
}
```

### 5. Firewall rule — allow SSH via IAP
```hcl
resource "google_compute_firewall" "allow_iap_ssh" {
  name    = "allow-iap-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["35.235.240.0/20"]   # IAP CIDR
}
```

### 6. Cloud Router
```hcl
resource "google_compute_router" "router" {
  name    = "my-router"
  region  = "us-central1"
  network = google_compute_network.vpc.id
}
```

### 7. Cloud NAT
```hcl
resource "google_compute_router_nat" "nat" {
  name                               = "cloud-nat"
  router                             = google_compute_router.router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

### 8. Static external IP
```hcl
resource "google_compute_address" "static_ip" {
  name   = "my-static-ip"
  region = "us-central1"
}

resource "google_compute_instance" "vm" {
  name         = "web-server"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  network_interface {
    subnetwork = google_compute_subnetwork.main.id
    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
}
```

### 9. Private Google Access on subnet
```hcl
resource "google_compute_subnetwork" "private" {
  name                     = "private-subnet"
  ip_cidr_range            = "10.1.0.0/20"
  region                   = "us-central1"
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}
```

### 10. VPC output references
```hcl
output "vpc_id"     { value = google_compute_network.vpc.id }
output "subnet_id"  { value = google_compute_subnetwork.main.id }
output "nat_ip"     { value = google_compute_router_nat.nat.nat_ips }
```

### 11. Default route check
```bash
# GCP auto-creates a default internet route when VPC is created
# View routes:
gcloud compute routes list --filter="network=my-vpc"
```

### 12. Global vs Regional resources
```hcl
# Global: compute networks, firewall rules, global addresses, url maps
# Regional: subnets, cloud routers, NAT, regional addresses

resource "google_compute_global_address" "lb_ip" {
  name = "lb-global-ip"
}
```

---

## Intermediate

### 13. Subnet with secondary IP ranges (for GKE)
```hcl
resource "google_compute_subnetwork" "gke" {
  name          = "gke-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.vpc.id

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.10.0.0/16"
  }
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.20.0.0/20"
  }
}
```

### 14. VPC flow logs
```hcl
resource "google_compute_subnetwork" "with_logs" {
  name          = "monitored-subnet"
  ip_cidr_range = "10.2.0.0/20"
  region        = "us-central1"
  network       = google_compute_network.vpc.id

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}
```

### 15. VPC peering
```hcl
resource "google_compute_network" "vpc_a" { name = "vpc-a"; auto_create_subnetworks = false }
resource "google_compute_network" "vpc_b" { name = "vpc-b"; auto_create_subnetworks = false }

resource "google_compute_network_peering" "a_to_b" {
  name         = "a-to-b"
  network      = google_compute_network.vpc_a.self_link
  peer_network = google_compute_network.vpc_b.self_link
}

resource "google_compute_network_peering" "b_to_a" {
  name         = "b-to-a"
  network      = google_compute_network.vpc_b.self_link
  peer_network = google_compute_network.vpc_a.self_link
}
```

### 16. Shared VPC (host project)
```hcl
resource "google_compute_shared_vpc_host_project" "host" {
  project = var.host_project_id
}

resource "google_compute_shared_vpc_service_project" "service" {
  host_project    = var.host_project_id
  service_project = var.service_project_id
  depends_on      = [google_compute_shared_vpc_host_project.host]
}
```

### 17. Private service access for Cloud SQL
```hcl
resource "google_compute_global_address" "private_range" {
  name          = "private-services-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_range.name]
}
```

### 18. VPC access connector (for Cloud Run/Functions)
```hcl
resource "google_vpc_access_connector" "connector" {
  name          = "vpc-connector"
  region        = "us-central1"
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 10
  machine_type  = "e2-micro"
}
```

### 19. Cloud DNS private zone
```hcl
resource "google_dns_managed_zone" "private" {
  name       = "private-zone"
  dns_name   = "internal.example.com."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }
}

resource "google_dns_record_set" "db" {
  name         = "db.internal.example.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.private.name
  rrdatas      = [google_sql_database_instance.db.private_ip_address]
}
```

### 20. Cloud NAT with manual IP allocation
```hcl
resource "google_compute_address" "nat_ip" {
  count  = 2
  name   = "nat-ip-${count.index}"
  region = "us-central1"
}

resource "google_compute_router_nat" "nat_manual" {
  name                               = "cloud-nat-manual"
  router                             = google_compute_router.router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "MANUAL_ONLY"
  nat_ips                            = google_compute_address.nat_ip[*].self_link
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

### 21. Firewall rule with target service account
```hcl
resource "google_compute_firewall" "allow_sa" {
  name    = "allow-from-gke-nodes"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  target_service_accounts = [google_service_account.gke_sa.email]
  source_service_accounts = [google_service_account.app_sa.email]
}
```

### 22. Cloud VPN tunnel
```hcl
resource "google_compute_vpn_gateway" "vpn_gw" {
  name    = "my-vpn-gateway"
  network = google_compute_network.vpc.id
  region  = "us-central1"
}

resource "google_compute_vpn_tunnel" "tunnel" {
  name               = "my-vpn-tunnel"
  peer_ip            = var.peer_vpn_ip
  shared_secret      = var.vpn_shared_secret
  target_vpn_gateway = google_compute_vpn_gateway.vpn_gw.id

  depends_on = [
    google_compute_forwarding_rule.fr_esp,
    google_compute_forwarding_rule.fr_udp500,
    google_compute_forwarding_rule.fr_udp4500,
  ]
}
```

### 23. HA VPN
```hcl
resource "google_compute_ha_vpn_gateway" "ha_vpn" {
  name    = "ha-vpn-gateway"
  network = google_compute_network.vpc.id
  region  = "us-central1"
}
```

### 24. Interconnect attachment (VLAN)
```hcl
resource "google_compute_interconnect_attachment" "vlan" {
  name                     = "my-vlan-attachment"
  edge_availability_domain = "AVAILABILITY_DOMAIN_1"
  type                     = "PARTNER"
  router                   = google_compute_router.router.id
  region                   = "us-central1"
}
```

### 25. Cloud Armor security policy attachment
```hcl
resource "google_compute_security_policy" "waf" {
  name = "my-waf-policy"

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["10.0.0.0/8"] }
    }
    description = "Block internal CIDRs"
  }

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

---

## Nested

### 26. Full VPC with multiple subnets
```hcl
resource "google_compute_network" "vpc" {
  name                    = "${var.env}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

locals {
  subnets = {
    app    = { cidr = "10.0.0.0/20"; region = "us-central1" }
    gke    = { cidr = "10.1.0.0/20"; region = "us-central1" }
    db     = { cidr = "10.2.0.0/24"; region = "us-central1" }
    tools  = { cidr = "10.3.0.0/24"; region = "us-central1" }
  }
}

resource "google_compute_subnetwork" "subnets" {
  for_each = local.subnets

  name                     = "${var.env}-${each.key}-subnet"
  ip_cidr_range            = each.value.cidr
  region                   = each.value.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}
```

### 27. VPC with multi-region subnets and NAT per region
```hcl
variable "regions" {
  type = map(object({ cidr = string; nat = bool }))
  default = {
    us-central1  = { cidr = "10.0.0.0/20"; nat = true }
    europe-west1 = { cidr = "10.1.0.0/20"; nat = true }
  }
}

resource "google_compute_subnetwork" "regional" {
  for_each      = var.regions
  name          = "${var.env}-${replace(each.key, "-", "")}-subnet"
  ip_cidr_range = each.value.cidr
  region        = each.key
  network       = google_compute_network.vpc.id
}

resource "google_compute_router" "routers" {
  for_each = var.regions
  name     = "router-${replace(each.key, "-", "")}"
  region   = each.key
  network  = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nats" {
  for_each                           = { for k, v in var.regions : k => v if v.nat }
  name                               = "nat-${replace(each.key, "-", "")}"
  router                             = google_compute_router.routers[each.key].name
  region                             = each.key
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

### 28. Firewall rules from variable config
```hcl
variable "firewall_rules" {
  type = list(object({
    name          = string
    direction     = string
    protocol      = string
    ports         = list(string)
    source_ranges = optional(list(string), [])
    target_tags   = optional(list(string), [])
    priority      = optional(number, 1000)
  }))
}

resource "google_compute_firewall" "rules" {
  for_each  = { for r in var.firewall_rules : r.name => r }
  name      = "${var.env}-${each.value.name}"
  network   = google_compute_network.vpc.name
  direction = each.value.direction
  priority  = each.value.priority

  dynamic "allow" {
    for_each = each.value.direction == "INGRESS" ? [1] : []
    content {
      protocol = each.value.protocol
      ports    = each.value.ports
    }
  }

  dynamic "deny" {
    for_each = each.value.direction == "EGRESS" ? [1] : []
    content {
      protocol = each.value.protocol
      ports    = each.value.ports
    }
  }

  source_ranges = each.value.source_ranges
  target_tags   = each.value.target_tags
}
```

### 29. Private DNS with multiple records
```hcl
locals {
  dns_records = {
    "db"    = google_sql_database_instance.db.private_ip_address
    "cache" = google_redis_instance.cache.host
    "api"   = google_compute_instance.api.network_interface[0].network_ip
  }
}

resource "google_dns_record_set" "internal" {
  for_each     = local.dns_records
  name         = "${each.key}.${var.internal_domain}."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.private.name
  rrdatas      = [each.value]
}
```

### 30. Network security with layered firewall rules
```hcl
# Layer 1: deny all ingress by default (implicit)
# Layer 2: allow IAP SSH access
resource "google_compute_firewall" "iap_ssh" {
  name          = "allow-iap-ssh"
  network       = google_compute_network.vpc.name
  priority      = 100
  source_ranges = ["35.235.240.0/20"]
  allow { protocol = "tcp"; ports = ["22"] }
}

# Layer 3: allow internal communication
resource "google_compute_firewall" "internal" {
  name          = "allow-internal"
  network       = google_compute_network.vpc.name
  priority      = 200
  source_ranges = ["10.0.0.0/8"]
  allow { protocol = "tcp"; ports = ["0-65535"] }
  allow { protocol = "udp"; ports = ["0-65535"] }
  allow { protocol = "icmp" }
}

# Layer 4: allow health checks
resource "google_compute_firewall" "health_checks" {
  name          = "allow-health-checks"
  network       = google_compute_network.vpc.name
  priority      = 300
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  allow { protocol = "tcp" }
}

# Layer 5: deny all egress except to GCP services
resource "google_compute_firewall" "deny_egress" {
  name               = "deny-all-egress"
  network            = google_compute_network.vpc.name
  direction          = "EGRESS"
  priority           = 65534
  destination_ranges = ["0.0.0.0/0"]
  deny { protocol = "all" }
}
```

### 31. VPC Service Controls (perimeter)
```hcl
resource "google_access_context_manager_service_perimeter" "perimeter" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/my-perimeter"
  title  = "My Service Perimeter"

  status {
    resources = [
      "projects/${data.google_project.current.number}",
    ]
    restricted_services = [
      "storage.googleapis.com",
      "bigquery.googleapis.com",
    ]
  }
}
```

### 32. Interconnect with BGP session
```hcl
resource "google_compute_router" "interconnect_router" {
  name    = "interconnect-router"
  network = google_compute_network.vpc.id
  region  = "us-central1"

  bgp {
    asn               = 64514
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]
    advertised_ip_ranges {
      range = "10.0.0.0/16"
    }
  }
}
```

### 33. Cloud NAT with logging
```hcl
resource "google_compute_router_nat" "nat_with_logging" {
  name                               = "cloud-nat-logged"
  router                             = google_compute_router.router.name
  region                             = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
```

### 34. Multi-tier firewall tag strategy
```hcl
locals {
  firewall_rules = {
    "web-to-app" = {
      source_tags = ["web-tier"]
      target_tags = ["app-tier"]
      port        = "8080"
    }
    "app-to-db" = {
      source_tags = ["app-tier"]
      target_tags = ["db-tier"]
      port        = "5432"
    }
    "app-to-cache" = {
      source_tags = ["app-tier"]
      target_tags = ["cache-tier"]
      port        = "6379"
    }
  }
}

resource "google_compute_firewall" "tier_rules" {
  for_each    = local.firewall_rules
  name        = each.key
  network     = google_compute_network.vpc.name
  source_tags = each.value.source_tags
  target_tags = each.value.target_tags

  allow {
    protocol = "tcp"
    ports    = [each.value.port]
  }
}
```

---

## Advanced

### 35. Full hub-and-spoke network topology
```hcl
# Hub VPC (shared services)
resource "google_compute_network" "hub" {
  name                    = "hub-vpc"
  auto_create_subnetworks = false
}

# Spoke VPCs (workloads)
resource "google_compute_network" "spokes" {
  for_each                = toset(["dev", "staging", "prod"])
  name                    = "${each.key}-vpc"
  auto_create_subnetworks = false
}

# Hub ↔ Spoke peerings
resource "google_compute_network_peering" "hub_to_spoke" {
  for_each     = google_compute_network.spokes
  name         = "hub-to-${each.key}"
  network      = google_compute_network.hub.self_link
  peer_network = each.value.self_link
}

resource "google_compute_network_peering" "spoke_to_hub" {
  for_each     = google_compute_network.spokes
  name         = "${each.key}-to-hub"
  network      = each.value.self_link
  peer_network = google_compute_network.hub.self_link
}
```

### 36. Network Intelligence monitoring
```hcl
resource "google_project_service" "network_intelligence" {
  service = "networkmanagement.googleapis.com"
}

# Connectivity tests run ad-hoc via gcloud — not a managed Terraform resource
# gcloud network-management connectivity-tests create my-test \
#   --source-instance=... --destination-instance=... --protocol=TCP --destination-port=443
```

### 37. Cloud Load Balancer (HTTP)
```hcl
resource "google_compute_backend_service" "backend" {
  name          = "my-backend"
  health_checks = [google_compute_health_check.http.id]
  backend {
    group = google_compute_instance_group_manager.igm.instance_group
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "my-url-map"
  default_service = google_compute_backend_service.backend.id
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "my-https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_ssl_certificate.cert.id]
}

resource "google_compute_global_forwarding_rule" "https" {
  name       = "https-rule"
  target     = google_compute_target_https_proxy.https_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.lb_ip.address
}
```

### 38. Internal TCP/UDP load balancer
```hcl
resource "google_compute_forwarding_rule" "internal_lb" {
  name                  = "internal-lb"
  region                = "us-central1"
  load_balancing_scheme = "INTERNAL"
  backend_service       = google_compute_region_backend_service.backend.id
  ip_address            = google_compute_address.internal_ip.address
  ip_protocol           = "TCP"
  ports                 = ["8080"]
  network               = google_compute_network.vpc.name
  subnetwork            = google_compute_subnetwork.main.name
}
```

### 39. Cloud Armor with rate-based rules
```hcl
resource "google_compute_security_policy" "advanced_waf" {
  name = "advanced-waf"
  type = "CLOUD_ARMOR"

  rule {
    action   = "rate_based_ban"
    priority = 100
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["0.0.0.0/0"] }
    }
    rate_limit_options {
      rate_limit_threshold {
        count        = 1000
        interval_sec = 60
      }
      ban_duration_sec = 300
      conform_action   = "allow"
      exceed_action    = "deny(429)"
      ban_http_request_count       = 10000
      ban_http_request_interval_sec = 600
    }
  }
}
```

### 40. Network endpoint group (NEG) for Cloud Run
```hcl
resource "google_compute_region_network_endpoint_group" "cloud_run_neg" {
  provider              = google-beta
  name                  = "cloudrun-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_run {
    service = google_cloud_run_v2_service.app.name
  }
}

resource "google_compute_backend_service" "cloud_run_backend" {
  name                  = "cloudrun-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.cloud_run_neg.id
  }
}
```

### 41. Packet Mirroring
```hcl
resource "google_compute_packet_mirroring" "mirror" {
  name    = "my-mirror"
  region  = "us-central1"
  network { url = google_compute_network.vpc.id }

  collector_ilb {
    url = google_compute_forwarding_rule.collector_ilb.id
  }

  mirrored_resources {
    subnetworks {
      url = google_compute_subnetwork.main.id
    }
  }

  filter {
    ip_protocols = ["tcp"]
    direction    = "BOTH"
  }
}
```

### 42. Private NAT (RFC 1918 to RFC 1918)
```hcl
resource "google_compute_router_nat" "private_nat" {
  name   = "private-nat"
  router = google_compute_router.router.name
  region = "us-central1"
  type   = "PRIVATE"

  rules {
    rule_number = 100
    description = "Route to peered VPC"
    match       = "nexthop.is_router"
    action {
      source_nat_active_ranges = [google_compute_subnetwork.nat_subnet.self_link]
    }
  }
}
```

### 43. Network connectivity center (NCC)
```hcl
resource "google_network_connectivity_hub" "hub" {
  provider = google-beta
  name     = "my-ncc-hub"
  project  = var.project_id
}

resource "google_network_connectivity_spoke" "spoke" {
  provider = google-beta
  name     = "my-spoke"
  location = "global"
  hub      = google_network_connectivity_hub.hub.id

  linked_vpc_network {
    uri                     = google_compute_network.spoke_vpc.self_link
    exclude_export_ranges   = ["10.0.0.0/8"]
  }
}
```

### 44. DNS peering between zones
```hcl
resource "google_dns_managed_zone" "peer_zone" {
  name       = "peer-zone"
  dns_name   = "partner.internal."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }

  peering_config {
    target_network {
      network_url = var.partner_vpc_id
    }
  }
}
```

### 45. BGP routing with custom advertised prefixes
```hcl
resource "google_compute_router" "bgp_router" {
  name    = "bgp-router"
  network = google_compute_network.vpc.id
  region  = "us-central1"

  bgp {
    asn            = 64512
    advertise_mode = "CUSTOM"
    advertised_ip_ranges {
      range       = "10.0.0.0/16"
      description = "Production VPC"
    }
    advertised_ip_ranges {
      range       = "10.1.0.0/16"
      description = "GKE pods"
    }
  }
}
```

### 46. Private endpoint for GCP APIs (Restricted VIP)
```hcl
resource "google_dns_managed_zone" "restricted_apis" {
  name       = "restricted-googleapis"
  dns_name   = "googleapis.com."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.vpc.id
    }
  }
}

resource "google_dns_record_set" "restricted_cname" {
  name         = "*.googleapis.com."
  type         = "CNAME"
  ttl          = 300
  managed_zone = google_dns_managed_zone.restricted_apis.name
  rrdatas      = ["restricted.googleapis.com."]
}

resource "google_dns_record_set" "restricted_a" {
  name         = "restricted.googleapis.com."
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.restricted_apis.name
  rrdatas      = ["199.36.153.4", "199.36.153.5", "199.36.153.6", "199.36.153.7"]
}
```

### 47. Firewall Insights
```hcl
resource "google_project_service" "firewall_insights" {
  service = "firewallinsights.googleapis.com"
}
# After enabling, view in console:
# Security > Firewall Insights
```

### 48. Hierarchical firewall policies (Organization)
```hcl
resource "google_compute_firewall_policy" "org_policy" {
  provider    = google-beta
  short_name  = "org-baseline-policy"
  description = "Organization-wide baseline rules"
  parent      = "organizations/${var.org_id}"
}

resource "google_compute_firewall_policy_rule" "allow_iap" {
  provider        = google-beta
  firewall_policy = google_compute_firewall_policy.org_policy.id
  priority        = 100
  direction       = "INGRESS"
  action          = "allow"

  match {
    src_ip_ranges = ["35.235.240.0/20"]
    layer4_configs {
      ip_protocol = "tcp"
      ports       = ["22", "3389"]
    }
  }
}
```

### 49. Zero-trust network access with BeyondCorp
```hcl
resource "google_iap_web_backend_service_iam_member" "iap" {
  web_backend_service = google_compute_backend_service.backend.name
  role                = "roles/iap.httpsResourceAccessor"
  member              = "group:eng@example.com"
}

resource "google_compute_backend_service" "backend" {
  name     = "iap-protected-backend"
  protocol = "HTTP"

  iap {
    enabled              = true
    oauth2_client_id     = var.iap_client_id
    oauth2_client_secret = var.iap_client_secret
  }
}
```

### 50. Full production networking stack
```hcl
# VPC
resource "google_compute_network" "vpc" {
  name                    = "${var.env}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

# Subnets
resource "google_compute_subnetwork" "app" {
  name                     = "${var.env}-app-subnet"
  ip_cidr_range            = "10.0.0.0/20"
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_subnetwork" "gke" {
  name                     = "${var.env}-gke-subnet"
  ip_cidr_range            = "10.1.0.0/20"
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
  secondary_ip_range { range_name = "pods";     ip_cidr_range = "10.10.0.0/16" }
  secondary_ip_range { range_name = "services"; ip_cidr_range = "10.20.0.0/20" }
}

# Router + NAT
resource "google_compute_router" "router" {
  name    = "${var.env}-router"
  region  = var.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.env}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  log_config { enable = true; filter = "ERRORS_ONLY" }
}

# Private service access
resource "google_compute_global_address" "private_range" {
  name          = "${var.env}-private-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_range.name]
}

# VPC access connector
resource "google_vpc_access_connector" "connector" {
  name          = "${var.env}-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 10
}
```
