# Examples 5.5 — Cloud DNS (50 examples)

---

## Basic

### 1. Public Managed Zone
```hcl
resource "google_dns_managed_zone" "public_zone" {
  project     = "my-prod-project-001"
  name        = "example-public-zone"
  dns_name    = "example.com."
  description = "Public DNS zone for example.com"
  visibility  = "public"

  labels = {
    env     = "production"
    managed = "terraform"
  }
}
```

### 2. Private Managed Zone
```hcl
resource "google_dns_managed_zone" "private_zone" {
  project     = "my-prod-project-001"
  name        = "internal-private-zone"
  dns_name    = "internal.example.com."
  description = "Private DNS zone for internal services"
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
  }

  labels = {
    env  = "production"
    type = "private"
  }
}
```

### 3. A Record Set
```hcl
resource "google_dns_record_set" "a_record" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 300

  rrdatas = ["34.102.136.180", "34.98.127.226"]
}
```

### 4. CNAME Record Set
```hcl
resource "google_dns_record_set" "cname_record" {
  project      = "my-prod-project-001"
  name         = "www.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "CNAME"
  ttl          = 300

  rrdatas = ["app.example.com."]
}
```

### 5. MX Record Set
```hcl
resource "google_dns_record_set" "mx_record" {
  project      = "my-prod-project-001"
  name         = "example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "MX"
  ttl          = 3600

  rrdatas = [
    "1 aspmx.l.google.com.",
    "5 alt1.aspmx.l.google.com.",
    "5 alt2.aspmx.l.google.com.",
    "10 alt3.aspmx.l.google.com.",
    "10 alt4.aspmx.l.google.com.",
  ]
}
```

### 6. TXT Record Set
```hcl
resource "google_dns_record_set" "txt_spf" {
  project      = "my-prod-project-001"
  name         = "example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "TXT"
  ttl          = 3600

  rrdatas = [
    "\"v=spf1 include:_spf.google.com ~all\"",
    "\"google-site-verification=abc123XYZverification456\"",
  ]
}
```

### 7. NS Record Set
```hcl
resource "google_dns_record_set" "ns_record" {
  project      = "my-prod-project-001"
  name         = "sub.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "NS"
  ttl          = 21600

  rrdatas = [
    "ns-cloud-a1.googledomains.com.",
    "ns-cloud-a2.googledomains.com.",
    "ns-cloud-a3.googledomains.com.",
    "ns-cloud-a4.googledomains.com.",
  ]
}
```

### 8. AAAA Record Set (IPv6)
```hcl
resource "google_dns_record_set" "aaaa_record" {
  project      = "my-prod-project-001"
  name         = "ipv6.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "AAAA"
  ttl          = 300

  rrdatas = ["2001:4860:4802:32::a"]
}
```

### 9. SRV Record Set
```hcl
resource "google_dns_record_set" "srv_record" {
  project      = "my-prod-project-001"
  name         = "_sip._tcp.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "SRV"
  ttl          = 300

  # format: priority weight port target
  rrdatas = [
    "10 20 5060 sip1.example.com.",
    "10 20 5060 sip2.example.com.",
  ]
}
```

### 10. PTR Record Set (Reverse DNS)
```hcl
resource "google_dns_managed_zone" "reverse_zone" {
  project     = "my-prod-project-001"
  name        = "reverse-lookup-zone"
  dns_name    = "100.168.192.in-addr.arpa."
  description = "Reverse DNS zone for 192.168.100.0/24"
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
  }
}

resource "google_dns_record_set" "ptr_record" {
  project      = "my-prod-project-001"
  name         = "10.100.168.192.in-addr.arpa."
  managed_zone = google_dns_managed_zone.reverse_zone.name
  type         = "PTR"
  ttl          = 300

  rrdatas = ["db-server.internal.example.com."]
}
```

### 11. SOA Record Customization
```hcl
resource "google_dns_record_set" "soa_record" {
  project      = "my-prod-project-001"
  name         = "example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "SOA"
  ttl          = 21600

  # ns email serial refresh retry expire minimum
  rrdatas = [
    "ns-cloud-a1.googledomains.com. cloud-dns-hostmaster.google.com. 1 21600 3600 259200 300"
  ]
}
```

### 12. Zone Visibility — Public vs Private
```hcl
# Public zone — visible to entire internet
resource "google_dns_managed_zone" "public" {
  project     = "my-prod-project-001"
  name        = "public-zone"
  dns_name    = "example.com."
  visibility  = "public"
  description = "Internet-facing DNS zone"
}

# Private zone — visible only within specified VPCs
resource "google_dns_managed_zone" "private" {
  project     = "my-prod-project-001"
  name        = "private-zone"
  dns_name    = "example.com."
  visibility  = "private"
  description = "Internal DNS zone (split-horizon)"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
    networks {
      network_url = google_compute_network.secondary_vpc.id
    }
  }
}
```

---

## Intermediate

### 13. DNS Peering Zone (Peer to Another VPC)
```hcl
# Producer VPC has a private zone for its services
resource "google_dns_managed_zone" "producer_zone" {
  project     = "producer-project-001"
  name        = "producer-services"
  dns_name    = "producer.internal."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.producer_vpc.id
    }
  }
}

# Consumer VPC peers DNS to producer zone
resource "google_dns_managed_zone" "consumer_peering_zone" {
  project     = "consumer-project-001"
  name        = "consumer-to-producer-peering"
  dns_name    = "producer.internal."
  visibility  = "private"
  description = "DNS peering zone pointing to producer project"

  private_visibility_config {
    networks {
      network_url = google_compute_network.consumer_vpc.id
    }
  }

  peering_config {
    target_network {
      network_url = google_compute_network.producer_vpc.id
    }
  }
}
```

### 14. Forwarding Zone (to On-Premises Resolver)
```hcl
resource "google_dns_managed_zone" "onprem_forwarding_zone" {
  project     = "my-prod-project-001"
  name        = "onprem-corp-forwarding"
  dns_name    = "corp.internal."
  description = "Forward corp.internal queries to on-prem DNS servers"
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.shared_vpc.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "10.0.0.53"
      forwarding_path = "private"
    }
    target_name_servers {
      ipv4_address    = "10.0.0.54"
      forwarding_path = "private"
    }
  }
}
```

### 15. Response Policy Zone
```hcl
resource "google_dns_response_policy" "block_policy" {
  project              = "my-prod-project-001"
  response_policy_name = "block-malicious-domains"
  description          = "Block known malicious or internal-bypass domains"

  networks {
    network_url = google_compute_network.main_vpc.id
  }
}

resource "google_dns_response_policy_rule" "block_example" {
  project         = "my-prod-project-001"
  response_policy = google_dns_response_policy.block_policy.response_policy_name
  rule_name       = "block-badsite"
  dns_name        = "badsite.example.net."

  local_data {
    local_datas {
      name    = "badsite.example.net."
      type    = "A"
      ttl     = 300
      rrdatas = ["127.0.0.1"]
    }
  }
}
```

### 16. DNSSEC Configuration
```hcl
resource "google_dns_managed_zone" "dnssec_zone" {
  project     = "my-prod-project-001"
  name        = "secure-public-zone"
  dns_name    = "secure.example.com."
  description = "DNSSEC-enabled public zone"
  visibility  = "public"

  dnssec_config {
    state         = "on"
    non_existence = "nsec3"

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

output "dnssec_ds_record" {
  description = "DS record to register with parent zone registrar"
  value       = google_dns_managed_zone.dnssec_zone.name_servers
}
```

### 17. DNS Server Policy on VPC (Inbound / Outbound)
```hcl
resource "google_dns_policy" "vpc_dns_policy" {
  project                   = "my-prod-project-001"
  name                      = "main-vpc-dns-policy"
  description               = "Enable inbound DNS forwarding and logging on main VPC"
  enable_inbound_forwarding = true
  enable_logging            = true

  networks {
    network_url = google_compute_network.main_vpc.id
  }

  alternative_name_server_config {
    target_name_servers {
      ipv4_address    = "10.10.0.53"
      forwarding_path = "private"
    }
    target_name_servers {
      ipv4_address    = "10.10.0.54"
      forwarding_path = "private"
    }
  }
}
```

### 18. DNS Record for Cloud SQL Private IP
```hcl
resource "google_sql_database_instance" "postgres_main" {
  project          = "my-prod-project-001"
  name             = "postgres-main-instance"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-15360"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main_vpc.id
    }
  }
}

resource "google_dns_record_set" "cloudsql_dns" {
  project      = "my-prod-project-001"
  name         = "postgres.internal.example.com."
  managed_zone = google_dns_managed_zone.private_zone.name
  type         = "A"
  ttl          = 300

  rrdatas = [google_sql_database_instance.postgres_main.private_ip_address]
}
```

### 19. DNS Record for GKE Internal Service
```hcl
# After GKE cluster and internal LoadBalancer service is created,
# capture the internal IP and register it in private DNS
resource "google_dns_record_set" "gke_internal_service" {
  project      = "my-prod-project-001"
  name         = "api-service.internal.example.com."
  managed_zone = google_dns_managed_zone.private_zone.name
  type         = "A"
  ttl          = 60

  # Reference from a data source or known output of LB IP
  rrdatas = [var.gke_internal_lb_ip]

  depends_on = [google_container_cluster.primary]
}
```

### 20. DNS Record for Cloud Run
```hcl
resource "google_cloud_run_v2_service" "api" {
  project  = "my-prod-project-001"
  name     = "api-service"
  location = "us-central1"

  template {
    containers {
      image = "us-central1-docker.pkg.dev/my-prod-project-001/app/api:latest"
    }
  }
}

# Cloud Run custom domain mapping creates a CNAME target
resource "google_dns_record_set" "cloud_run_cname" {
  project      = "my-prod-project-001"
  name         = "api.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "CNAME"
  ttl          = 300

  rrdatas = ["ghs.googlehosted.com."]
}

# Domain ownership TXT record for Cloud Run domain mapping
resource "google_dns_record_set" "cloud_run_acme_txt" {
  project      = "my-prod-project-001"
  name         = "api.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "TXT"
  ttl          = 300

  rrdatas = ["\"google-site-verification=UniqueVerificationToken123\""]
}
```

### 21. Cloud DNS Logging
```hcl
# Enable DNS query logging via DNS policy
resource "google_dns_policy" "logging_policy" {
  project        = "my-prod-project-001"
  name           = "dns-logging-policy"
  description    = "Enable DNS query logging for audit and troubleshooting"
  enable_logging = true

  networks {
    network_url = google_compute_network.main_vpc.id
  }
}

# Cloud Logging sink to export DNS logs to BigQuery
resource "google_logging_project_sink" "dns_logs_sink" {
  project     = "my-prod-project-001"
  name        = "dns-query-logs-to-bq"
  destination = "bigquery.googleapis.com/projects/my-prod-project-001/datasets/dns_audit_logs"
  filter      = "resource.type=\"dns_query\""

  bigquery_options {
    use_partitioned_tables = true
  }

  unique_writer_identity = true
}
```

### 22. Certificate Manager DNS Validation (ACM Equivalent)
```hcl
resource "google_certificate_manager_certificate" "wildcard_cert" {
  project     = "my-prod-project-001"
  name        = "wildcard-example-cert"
  description = "Wildcard TLS certificate for example.com"
  scope       = "DEFAULT"

  managed {
    domains = ["example.com", "*.example.com"]
    dns_authorizations = [
      google_certificate_manager_dns_authorization.root_auth.id,
      google_certificate_manager_dns_authorization.wildcard_auth.id,
    ]
  }
}

resource "google_certificate_manager_dns_authorization" "root_auth" {
  project     = "my-prod-project-001"
  name        = "root-domain-auth"
  description = "DNS authorization for example.com"
  domain      = "example.com"
}

resource "google_certificate_manager_dns_authorization" "wildcard_auth" {
  project     = "my-prod-project-001"
  name        = "wildcard-domain-auth"
  description = "DNS authorization for *.example.com"
  domain      = "*.example.com"
}

# Add the CNAME records that Certificate Manager requires for validation
resource "google_dns_record_set" "cert_validation_root" {
  project      = "my-prod-project-001"
  name         = google_certificate_manager_dns_authorization.root_auth.dns_resource_record[0].name
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = google_certificate_manager_dns_authorization.root_auth.dns_resource_record[0].type
  ttl          = 300

  rrdatas = [google_certificate_manager_dns_authorization.root_auth.dns_resource_record[0].data]
}
```

### 23. WRR (Weighted Round Robin) Routing Policy
```hcl
resource "google_dns_record_set" "wrr_record" {
  project      = "my-prod-project-001"
  name         = "api.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 60

  routing_policy {
    wrr {
      weight  = 70
      rrdatas = ["34.102.136.180"]
    }
    wrr {
      weight  = 20
      rrdatas = ["34.98.127.226"]
    }
    wrr {
      weight  = 10
      rrdatas = ["34.107.246.10"]
    }
  }
}
```

### 24. GEO Routing Policy
```hcl
resource "google_dns_record_set" "geo_record" {
  project      = "my-prod-project-001"
  name         = "cdn.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 60

  routing_policy {
    geo {
      location = "us-central1"
      rrdatas  = ["34.102.136.180"]
    }
    geo {
      location = "europe-west1"
      rrdatas  = ["35.241.243.29"]
    }
    geo {
      location = "asia-southeast1"
      rrdatas  = ["34.87.152.10"]
    }
  }
}
```

### 25. Health-Checked Records (Routing Policy with Health Checks)
```hcl
resource "google_compute_health_check" "dns_http_check" {
  project = "my-prod-project-001"
  name    = "dns-routing-http-check"

  http_health_check {
    port         = 80
    request_path = "/healthz"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

resource "google_dns_record_set" "failover_record" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 30

  routing_policy {
    primary_backup {
      trickle_ratio = 0.1

      primary {
        internal_load_balancers {
          load_balancer_type = "regionalL4ilb"
          ip_address         = google_compute_forwarding_rule.primary_ilb.ip_address
          port               = "80"
          ip_protocol        = "TCP"
          network_url        = google_compute_network.main_vpc.id
          project            = "my-prod-project-001"
          region             = "us-central1"
        }
      }

      backup_geo {
        location = "us-east1"
        rrdatas  = ["34.75.10.100"]
      }
    }
  }
}
```

---

## Nested

### 26. Split-Horizon DNS Pattern
```hcl
# Public view — returns load balancer's public IP
resource "google_dns_managed_zone" "public_horizon" {
  project     = "my-prod-project-001"
  name        = "public-horizon"
  dns_name    = "example.com."
  visibility  = "public"
  description = "Public DNS — internet-facing IPs"
}

resource "google_dns_record_set" "public_app" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_horizon.name
  type         = "A"
  ttl          = 300
  rrdatas      = ["34.102.136.180"]
}

# Private view — same hostname returns internal IP for VPC traffic
resource "google_dns_managed_zone" "private_horizon" {
  project     = "my-prod-project-001"
  name        = "private-horizon"
  dns_name    = "example.com."
  visibility  = "private"
  description = "Private DNS — internal IPs for VPC traffic"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
  }
}

resource "google_dns_record_set" "private_app" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.private_horizon.name
  type         = "A"
  ttl          = 300
  rrdatas      = ["10.128.0.100"]
}
```

### 27. Cross-Project DNS Zone
```hcl
# Shared services project hosts the private DNS zone
resource "google_dns_managed_zone" "shared_services_zone" {
  project     = "shared-services-project"
  name        = "shared-internal-zone"
  dns_name    = "shared.internal."
  visibility  = "private"
  description = "Shared internal DNS zone accessible by all service projects"

  private_visibility_config {
    # Grant visibility to multiple service project VPCs
    networks {
      network_url = "projects/app-project-001/global/networks/app-vpc"
    }
    networks {
      network_url = "projects/data-project-001/global/networks/data-vpc"
    }
    networks {
      network_url = "projects/shared-services-project/global/networks/shared-vpc"
    }
  }
}

resource "google_dns_record_set" "shared_database" {
  project      = "shared-services-project"
  name         = "db-primary.shared.internal."
  managed_zone = google_dns_managed_zone.shared_services_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = ["10.10.0.100"]
}

resource "google_dns_record_set" "shared_cache" {
  project      = "shared-services-project"
  name         = "redis.shared.internal."
  managed_zone = google_dns_managed_zone.shared_services_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = ["10.10.0.110"]
}
```

### 28. Private Forwarding to On-Prem Resolver (Full Configuration)
```hcl
# DNS policy to enable inbound resolver on the VPC
resource "google_dns_policy" "onprem_integration_policy" {
  project                   = "my-prod-project-001"
  name                      = "onprem-integration"
  description               = "Enable inbound DNS + forward to on-prem for corp domains"
  enable_inbound_forwarding = true
  enable_logging            = true

  networks {
    network_url = google_compute_network.hybrid_vpc.id
  }
}

# Forward corp.acme.com queries to on-prem resolvers
resource "google_dns_managed_zone" "corp_forwarding" {
  project     = "my-prod-project-001"
  name        = "corp-acme-forwarding"
  dns_name    = "corp.acme.com."
  visibility  = "private"
  description = "Forward all corp.acme.com DNS to on-prem resolvers"

  private_visibility_config {
    networks {
      network_url = google_compute_network.hybrid_vpc.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "192.168.1.53"
      forwarding_path = "private"
    }
    target_name_servers {
      ipv4_address    = "192.168.2.53"
      forwarding_path = "private"
    }
  }
}

# Firewall rule allowing DNS from on-prem to Cloud DNS inbound forwarder IPs
resource "google_compute_firewall" "allow_onprem_dns_inbound" {
  project = "my-prod-project-001"
  name    = "allow-onprem-dns-inbound"
  network = google_compute_network.hybrid_vpc.name

  allow {
    protocol = "udp"
    ports    = ["53"]
  }
  allow {
    protocol = "tcp"
    ports    = ["53"]
  }

  source_ranges = ["192.168.0.0/16"]
  description   = "Allow DNS queries from on-prem to GCP inbound forwarder"
}
```

### 29. DNS Failover with Routing Policies
```hcl
resource "google_dns_health_check" "primary_health_check" {
  project = "my-prod-project-001"
  # DNS health checks use google_compute_health_check
}

resource "google_compute_health_check" "primary_app_hc" {
  project = "my-prod-project-001"
  name    = "primary-app-health-check"

  https_health_check {
    port         = 443
    request_path = "/healthz"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 1
  unhealthy_threshold = 2
}

# Primary-backup routing policy for automatic failover
resource "google_dns_record_set" "failover_app" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 30

  routing_policy {
    enable_geo_fencing = false

    primary_backup {
      trickle_ratio = 0.0

      primary {
        internal_load_balancers {
          load_balancer_type = "globalL7ilb"
          ip_address         = "34.102.136.180"
          port               = "443"
          ip_protocol        = "TCP"
          network_url        = google_compute_network.main_vpc.id
          project            = "my-prod-project-001"
          region             = "us-central1"
        }
      }

      backup_geo {
        location = "us-east1"
        rrdatas  = ["34.75.10.200"]
      }

      backup_geo {
        location = "europe-west1"
        rrdatas  = ["35.241.0.100"]
      }
    }
  }
}
```

### 30. Cloud DNS with VPC Service Controls
```hcl
# Access policy must exist at org level
data "google_access_context_manager_access_policy" "org_policy" {
  parent = "organizations/123456789012"
}

# Service perimeter that includes Cloud DNS
resource "google_access_context_manager_service_perimeter" "dns_perimeter" {
  parent = "accessPolicies/${data.google_access_context_manager_access_policy.org_policy.name}"
  name   = "accessPolicies/${data.google_access_context_manager_access_policy.org_policy.name}/servicePerimeters/dns-data-perimeter"
  title  = "DNS Data Perimeter"

  status {
    restricted_services = [
      "dns.googleapis.com",
    ]
    resources = [
      "projects/1234567890",
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services   = ["dns.googleapis.com"]
    }
  }
}

# Private zone remains inside perimeter
resource "google_dns_managed_zone" "vsc_private_zone" {
  project     = "my-prod-project-001"
  name        = "vsc-protected-zone"
  dns_name    = "protected.internal."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
  }
}
```

### 31. Multi-VPC DNS Architecture
```hcl
locals {
  vpcs = {
    production  = google_compute_network.prod_vpc.id
    staging     = google_compute_network.staging_vpc.id
    development = google_compute_network.dev_vpc.id
  }

  dns_zones = {
    production  = "prod.internal."
    staging     = "staging.internal."
    development = "dev.internal."
  }
}

resource "google_dns_managed_zone" "env_zones" {
  for_each = local.dns_zones

  project     = "my-prod-project-001"
  name        = "${each.key}-internal-zone"
  dns_name    = each.value
  visibility  = "private"
  description = "Internal DNS zone for ${each.key} environment"

  private_visibility_config {
    networks {
      network_url = local.vpcs[each.key]
    }
  }

  labels = {
    environment = each.key
    managed_by  = "terraform"
  }
}

resource "google_dns_record_set" "env_api_records" {
  for_each = {
    production  = "10.0.0.100"
    staging     = "10.1.0.100"
    development = "10.2.0.100"
  }

  project      = "my-prod-project-001"
  name         = "api.${local.dns_zones[each.key]}"
  managed_zone = google_dns_managed_zone.env_zones[each.key].name
  type         = "A"
  ttl          = 300
  rrdatas      = [each.value]
}
```

### 32. DNS Record Module Pattern
```hcl
# modules/dns-record/variables.tf
variable "project_id" { type = string }
variable "managed_zone" { type = string }
variable "records" {
  type = list(object({
    name    = string
    type    = string
    ttl     = number
    rrdatas = list(string)
  }))
}

# modules/dns-record/main.tf
resource "google_dns_record_set" "records" {
  for_each = { for r in var.records : r.name => r }

  project      = var.project_id
  name         = each.value.name
  managed_zone = var.managed_zone
  type         = each.value.type
  ttl          = each.value.ttl
  rrdatas      = each.value.rrdatas
}

# Usage in root module
module "app_dns_records" {
  source       = "./modules/dns-record"
  project_id   = "my-prod-project-001"
  managed_zone = google_dns_managed_zone.public_zone.name

  records = [
    { name = "app.example.com.", type = "A", ttl = 300, rrdatas = ["34.102.136.180"] },
    { name = "www.example.com.", type = "CNAME", ttl = 300, rrdatas = ["app.example.com."] },
    { name = "api.example.com.", type = "A", ttl = 60, rrdatas = ["34.98.127.226"] },
  ]
}
```

### 33. Complete DNS Architecture (Hub-and-Spoke Forwarding)
```hcl
# Hub VPC handles all DNS resolution
resource "google_dns_policy" "hub_inbound_policy" {
  project                   = "hub-project-001"
  name                      = "hub-inbound-dns"
  enable_inbound_forwarding = true
  enable_logging            = true

  networks {
    network_url = google_compute_network.hub_vpc.id
  }
}

# Spoke VPCs forward DNS to hub via peering
resource "google_dns_managed_zone" "spoke_to_hub_forwarding" {
  for_each = toset(["spoke-a", "spoke-b", "spoke-c"])

  project     = "${each.key}-project"
  name        = "forward-to-hub"
  dns_name    = "."
  visibility  = "private"
  description = "Forward all DNS from ${each.key} to hub resolvers"

  private_visibility_config {
    networks {
      network_url = "projects/${each.key}-project/global/networks/${each.key}-vpc"
    }
  }

  forwarding_config {
    target_name_servers {
      # Hub VPC inbound forwarder IP (assigned by Cloud DNS)
      ipv4_address    = var.hub_inbound_forwarder_ip
      forwarding_path = "private"
    }
  }
}
```

### 34. DNS for GKE Workloads (Internal + External)
```hcl
resource "google_container_cluster" "primary" {
  project  = "my-prod-project-001"
  name     = "primary-cluster"
  location = "us-central1"

  dns_config {
    cluster_dns        = "CLOUD_DNS"
    cluster_dns_scope  = "VPC_SCOPE"
    cluster_dns_domain = "cluster.local"
  }

  networking_mode = "VPC_NATIVE"
  network         = google_compute_network.main_vpc.name
  subnetwork      = google_compute_subnetwork.gke_subnet.name
}

# External DNS record for GKE Ingress IP
resource "google_dns_record_set" "gke_ingress_external" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [var.gke_ingress_external_ip]
}

# Internal DNS record for GKE internal LoadBalancer
resource "google_dns_record_set" "gke_internal_lb" {
  project      = "my-prod-project-001"
  name         = "app-internal.prod.internal."
  managed_zone = google_dns_managed_zone.private_zone.name
  type         = "A"
  ttl          = 60
  rrdatas      = [var.gke_internal_lb_ip]
}
```

### 35. Wildcard DNS Records
```hcl
# Wildcard A record for all subdomains
resource "google_dns_record_set" "wildcard_a" {
  project      = "my-prod-project-001"
  name         = "*.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = ["34.102.136.180"]
}

# Specific subdomain overrides wildcard
resource "google_dns_record_set" "specific_override" {
  project      = "my-prod-project-001"
  name         = "mail.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = ["34.75.10.200"]
}

# Wildcard TXT for certificate validation
resource "google_dns_record_set" "wildcard_txt" {
  project      = "my-prod-project-001"
  name         = "_acme-challenge.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "TXT"
  ttl          = 60
  rrdatas      = ["\"challenge-token-value-abc123\""]
}
```

### 36. Dynamic DNS Records from Compute Instances
```hcl
resource "google_compute_instance" "app_servers" {
  for_each = {
    "us-central1-a" = "10.0.0.11"
    "us-central1-b" = "10.0.0.12"
    "us-central1-c" = "10.0.0.13"
  }

  project      = "my-prod-project-001"
  name         = "app-server-${replace(each.key, "-", "")}"
  machine_type = "e2-standard-4"
  zone         = each.key

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    network    = google_compute_network.main_vpc.name
    subnetwork = google_compute_subnetwork.app_subnet.name
    network_ip = each.value
  }
}

# Register each instance in private DNS
resource "google_dns_record_set" "app_server_records" {
  for_each = google_compute_instance.app_servers

  project      = "my-prod-project-001"
  name         = "${each.value.name}.prod.internal."
  managed_zone = google_dns_managed_zone.private_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [each.value.network_interface[0].network_ip]
}
```

### 37. DKIM and DMARC DNS Records
```hcl
# DMARC policy record
resource "google_dns_record_set" "dmarc_record" {
  project      = "my-prod-project-001"
  name         = "_dmarc.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "TXT"
  ttl          = 3600

  rrdatas = [
    "\"v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com; ruf=mailto:dmarc-forensics@example.com; sp=reject; adkim=s; aspf=s; pct=100\""
  ]
}

# DKIM public key record for Google Workspace
resource "google_dns_record_set" "dkim_record" {
  project      = "my-prod-project-001"
  name         = "google._domainkey.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "TXT"
  ttl          = 3600

  rrdatas = [
    "\"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xHn/EXAMPLE_DKIM_PUBLIC_KEY_VALUE_HERE\""
  ]
}

# BIMI record for brand logo in email
resource "google_dns_record_set" "bimi_record" {
  project      = "my-prod-project-001"
  name         = "default._bimi.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "TXT"
  ttl          = 3600

  rrdatas = [
    "\"v=BIMI1; l=https://example.com/bimi-logo.svg; a=https://example.com/bimi-vmc.pem\""
  ]
}
```

---

## Advanced

### 38. Complete DNS Architecture for Multi-VPC (Production-Ready)
```hcl
# variables.tf
variable "org_id" {
  description = "GCP Organization ID"
  type        = string
  default     = "123456789012"
}

variable "dns_hub_project" {
  description = "Project ID hosting the DNS hub"
  type        = string
  default     = "dns-hub-project-001"
}

variable "environments" {
  description = "Map of environments with VPC and project info"
  type = map(object({
    project_id  = string
    vpc_name    = string
    dns_domain  = string
    cidr        = string
  }))
  default = {
    production = {
      project_id = "prod-project-001"
      vpc_name   = "prod-vpc"
      dns_domain = "prod.internal."
      cidr       = "10.0.0.0/16"
    }
    staging = {
      project_id = "staging-project-001"
      vpc_name   = "staging-vpc"
      dns_domain = "staging.internal."
      cidr       = "10.1.0.0/16"
    }
    development = {
      project_id = "dev-project-001"
      vpc_name   = "dev-vpc"
      dns_domain = "dev.internal."
      cidr       = "10.2.0.0/16"
    }
  }
}

# Central DNS hub zone in hub project
resource "google_dns_managed_zone" "hub_root_zone" {
  project     = var.dns_hub_project
  name        = "hub-root-internal"
  dns_name    = "internal."
  visibility  = "private"
  description = "Central hub zone — delegates to per-env zones"

  private_visibility_config {
    dynamic "networks" {
      for_each = var.environments
      content {
        network_url = "projects/${networks.value.project_id}/global/networks/${networks.value.vpc_name}"
      }
    }
  }
}

# Per-environment delegated zones
resource "google_dns_managed_zone" "env_zones" {
  for_each = var.environments

  project     = var.dns_hub_project
  name        = "${each.key}-zone"
  dns_name    = each.value.dns_domain
  visibility  = "private"
  description = "Private DNS zone for ${each.key}"

  private_visibility_config {
    networks {
      network_url = "projects/${each.value.project_id}/global/networks/${each.value.vpc_name}"
    }
  }
}

# DNS policies — inbound forwarding on each env VPC
resource "google_dns_policy" "env_dns_policies" {
  for_each = var.environments

  project                   = each.value.project_id
  name                      = "${each.key}-dns-policy"
  enable_inbound_forwarding = true
  enable_logging            = each.key == "production"

  networks {
    network_url = "projects/${each.value.project_id}/global/networks/${each.value.vpc_name}"
  }
}
```

### 39. DNS Peering Chain (Three-Tier)
```hcl
# Tier 1: Shared Services project hosts authoritative zone
resource "google_dns_managed_zone" "tier1_authoritative" {
  project     = "shared-services-001"
  name        = "shared-services-authoritative"
  dns_name    = "svc.internal."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.shared_vpc.id
    }
  }
}

# Tier 2: Hub project peers to shared services
resource "google_dns_managed_zone" "tier2_peering" {
  project     = "hub-project-001"
  name        = "peer-to-shared-services"
  dns_name    = "svc.internal."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.hub_vpc.id
    }
  }

  peering_config {
    target_network {
      network_url = google_compute_network.shared_vpc.id
    }
  }
}

# Tier 3: Spoke projects peer to hub
resource "google_dns_managed_zone" "tier3_spoke_peering" {
  for_each = toset(["spoke-a", "spoke-b"])

  project     = "${each.value}-project"
  name        = "peer-to-hub-svc"
  dns_name    = "svc.internal."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = "projects/${each.value}-project/global/networks/${each.value}-vpc"
    }
  }

  peering_config {
    target_network {
      network_url = google_compute_network.hub_vpc.id
    }
  }
}
```

### 40. DNSSEC with Key Management
```hcl
resource "google_dns_managed_zone" "dnssec_production" {
  project     = "my-prod-project-001"
  name        = "production-dnssec-zone"
  dns_name    = "secure.example.com."
  visibility  = "public"

  dnssec_config {
    state         = "on"
    non_existence = "nsec3"

    default_key_specs {
      algorithm  = "ecdsap256sha256"
      key_length = 256
      key_type   = "keySigning"
    }

    default_key_specs {
      algorithm  = "ecdsap256sha256"
      key_length = 256
      key_type   = "zoneSigning"
    }
  }
}

# Output the DS record info needed for parent zone
output "dnssec_key_signing_keys" {
  description = "KSK info for DS record registration with domain registrar"
  value       = google_dns_managed_zone.dnssec_production.name_servers
  sensitive   = false
}

# Monitor DNSSEC validity via Cloud Monitoring
resource "google_monitoring_alert_policy" "dnssec_validity" {
  project      = "my-prod-project-001"
  display_name = "DNSSEC Validity Alert"
  combiner     = "OR"

  conditions {
    display_name = "DNSSEC signature expiry warning"
    condition_threshold {
      filter          = "resource.type=\"dns_managed_zone\" AND metric.type=\"dns.googleapis.com/response/count\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1000

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [var.ops_notification_channel]
}
```

### 41. DNS Routing Policy — Full GEO + Health Check + Failover
```hcl
# Health checks for each regional endpoint
resource "google_compute_health_check" "regional_hc" {
  for_each = {
    "us-central1"  = { ip = "34.102.136.180", project = "my-prod-project-001" }
    "europe-west1" = { ip = "35.241.243.29", project = "my-prod-project-001" }
    "asia-east1"   = { ip = "34.80.10.100", project = "my-prod-project-001" }
  }

  project = each.value.project
  name    = "hc-${replace(each.key, "-", "")}"

  https_health_check {
    port         = 443
    request_path = "/healthz"
    host         = "app.example.com"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 1
  unhealthy_threshold = 3
}

# GEO routing with health checks per region
resource "google_dns_record_set" "geo_health_checked" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 30

  routing_policy {
    enable_geo_fencing = true

    geo {
      location = "us-central1"
      health_checked_targets {
        internal_load_balancers {
          load_balancer_type = "regionalL4ilb"
          ip_address         = "34.102.136.180"
          port               = "443"
          ip_protocol        = "TCP"
          network_url        = google_compute_network.main_vpc.id
          project            = "my-prod-project-001"
          region             = "us-central1"
        }
      }
    }

    geo {
      location = "europe-west1"
      health_checked_targets {
        internal_load_balancers {
          load_balancer_type = "regionalL4ilb"
          ip_address         = "35.241.243.29"
          port               = "443"
          ip_protocol        = "TCP"
          network_url        = google_compute_network.eu_vpc.id
          project            = "my-prod-project-001"
          region             = "europe-west1"
        }
      }
    }

    geo {
      location = "asia-east1"
      rrdatas  = ["34.80.10.100"]
    }
  }
}
```

### 42. Automated DNS Cleanup (null_resource Pattern)
```hcl
resource "null_resource" "dns_record_cleanup" {
  triggers = {
    zone_name   = google_dns_managed_zone.public_zone.name
    record_name = "stale-service.example.com."
    project_id  = "my-prod-project-001"
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      gcloud dns record-sets delete \
        ${self.triggers.record_name} \
        --type=A \
        --zone=${self.triggers.zone_name} \
        --project=${self.triggers.project_id} \
        --quiet || true
    EOT
  }
}
```

### 43. DNS Zone with Multiple Record Types (Full Domain Setup)
```hcl
locals {
  zone_name   = google_dns_managed_zone.public_zone.name
  project_id  = "my-prod-project-001"
  domain      = "example.com."
}

# All standard DNS records for a full domain configuration
resource "google_dns_record_set" "all_records" {
  for_each = {
    root_a = {
      name    = local.domain
      type    = "A"
      ttl     = 300
      rrdatas = ["34.102.136.180"]
    }
    root_aaaa = {
      name    = local.domain
      type    = "AAAA"
      ttl     = 300
      rrdatas = ["2001:4860:4802:32::a"]
    }
    www = {
      name    = "www.${local.domain}"
      type    = "CNAME"
      ttl     = 300
      rrdatas = ["${local.domain}"]
    }
    mail = {
      name    = "mail.${local.domain}"
      type    = "A"
      ttl     = 300
      rrdatas = ["34.75.10.200"]
    }
    spf = {
      name    = local.domain
      type    = "TXT"
      ttl     = 3600
      rrdatas = ["\"v=spf1 include:_spf.google.com -all\""]
    }
  }

  project      = local.project_id
  name         = each.value.name
  managed_zone = local.zone_name
  type         = each.value.type
  ttl          = each.value.ttl
  rrdatas      = each.value.rrdatas
}
```

### 44. DNS Monitoring and Alerting
```hcl
# Monitor for DNS query volume anomalies
resource "google_monitoring_alert_policy" "dns_query_spike" {
  project      = "my-prod-project-001"
  display_name = "Cloud DNS Query Volume Spike"
  combiner     = "OR"

  conditions {
    display_name = "DNS response count spike"
    condition_threshold {
      filter     = <<-EOT
        resource.type="dns_managed_zone"
        AND metric.type="dns.googleapis.com/response/count"
        AND metric.labels.response_code="NXDOMAIN"
      EOT
      duration   = "120s"
      comparison = "COMPARISON_GT"
      threshold_value = 1000

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.zone_name"]
      }
    }
  }

  notification_channels = [var.ops_notification_channel]
  severity              = "WARNING"

  alert_strategy {
    auto_close = "604800s"
  }
}

# Dashboard for DNS health
resource "google_monitoring_dashboard" "dns_dashboard" {
  project        = "my-prod-project-001"
  dashboard_json = jsonencode({
    displayName = "Cloud DNS Health Overview"
    mosaicLayout = {
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "DNS Query Rate by Response Code"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"dns_managed_zone\" metric.type=\"dns.googleapis.com/response/count\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                }
              }]
            }
          }
        }
      ]
    }
  })
}
```

### 45. Cloud Domains + Cloud DNS Integration
```hcl
# Register or import domain via Cloud Domains
resource "google_cloud_domains_registration" "example_domain" {
  project         = "my-prod-project-001"
  domain_name     = "example.com"
  location        = "global"

  yearly_price {
    currency_code = "USD"
    units         = 12
  }

  dns_settings {
    google_domains_dns {
      ds_state = "DS_RECORDS_PUBLISHED"
    }
  }

  contact_settings {
    privacy = "PRIVATE_CONTACT_DATA"

    registrant_contact {
      phone_number    = "+1.2125551234"
      email           = "admin@example.com"
      postal_address {
        region_code    = "US"
        postal_code    = "10001"
        administrative_area = "NY"
        locality       = "New York"
        address_lines  = ["123 Main St"]
        recipients     = ["ACME Corp"]
      }
    }

    admin_contact {
      phone_number    = "+1.2125551234"
      email           = "admin@example.com"
      postal_address {
        region_code    = "US"
        postal_code    = "10001"
        administrative_area = "NY"
        locality       = "New York"
        address_lines  = ["123 Main St"]
        recipients     = ["ACME Corp"]
      }
    }

    technical_contact {
      phone_number    = "+1.2125551234"
      email           = "tech@example.com"
      postal_address {
        region_code    = "US"
        postal_code    = "10001"
        administrative_area = "NY"
        locality       = "New York"
        address_lines  = ["123 Main St"]
        recipients     = ["ACME Corp"]
      }
    }
  }
}
```

### 46. DNS Policy — Outbound Forwarding from VPC
```hcl
# Outbound forwarding: GCP VMs query on-prem names
# On-prem resolvers handle corp.* domains
resource "google_dns_managed_zone" "outbound_forwarding_corp" {
  project     = "my-prod-project-001"
  name        = "outbound-corp-forwarding"
  dns_name    = "corp.example.internal."
  visibility  = "private"
  description = "Forward corp.example.internal to on-prem DNS"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "10.200.0.10"
      forwarding_path = "private"
    }
    target_name_servers {
      ipv4_address    = "10.200.0.11"
      forwarding_path = "private"
    }
  }
}

# Additional forwarding for AD domain (Windows)
resource "google_dns_managed_zone" "ad_domain_forwarding" {
  project     = "my-prod-project-001"
  name        = "ad-domain-forwarding"
  dns_name    = "ad.corp.example.com."
  visibility  = "private"
  description = "Forward Active Directory DNS queries to DCs"

  private_visibility_config {
    networks {
      network_url = google_compute_network.main_vpc.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "10.200.1.10"
      forwarding_path = "private"
    }
    target_name_servers {
      ipv4_address    = "10.200.1.11"
      forwarding_path = "private"
    }
  }
}
```

### 47. Terraform-Driven Blue/Green DNS Cutover
```hcl
variable "active_environment" {
  description = "Which environment is live: blue or green"
  type        = string
  default     = "blue"

  validation {
    condition     = contains(["blue", "green"], var.active_environment)
    error_message = "active_environment must be 'blue' or 'green'."
  }
}

locals {
  endpoint_ips = {
    blue  = "34.102.136.180"
    green = "34.98.127.226"
  }
  active_ip = local.endpoint_ips[var.active_environment]
}

resource "google_dns_record_set" "blue_green_cutover" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = 60  # Low TTL for fast propagation during cutover

  rrdatas = [local.active_ip]
}

output "active_endpoint" {
  description = "Currently active endpoint IP"
  value       = local.active_ip
}

output "cutover_instructions" {
  description = "To switch traffic, run: terraform apply -var='active_environment=green'"
  value       = "Change var.active_environment to switch DNS between blue and green"
}
```

### 48. DNS Record Lifecycle with TTL Reduction Strategy
```hcl
# Step 1: Before migration — run terraform apply with ttl=60
# Step 2: After DNS propagation — change IP and restore ttl=300
variable "migration_mode" {
  description = "Set to true during migration to lower TTL"
  type        = bool
  default     = false
}

variable "new_endpoint_ip" {
  description = "New IP address for migration target"
  type        = string
  default     = "34.102.136.180"
}

variable "current_endpoint_ip" {
  description = "Current production IP address"
  type        = string
  default     = "34.75.10.200"
}

resource "google_dns_record_set" "migratable_record" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.public_zone.name
  type         = "A"
  ttl          = var.migration_mode ? 60 : 300

  rrdatas = [var.migration_mode ? var.new_endpoint_ip : var.current_endpoint_ip]

  lifecycle {
    create_before_destroy = true
  }
}
```

### 49. Complete Production DNS Setup with All Record Types and Policies
```hcl
module "production_dns" {
  source = "./modules/dns"

  project_id  = "my-prod-project-001"
  domain      = "example.com"
  environment = "production"

  public_zone_config = {
    name        = "prod-public-zone"
    description = "Production public DNS zone"
    dnssec      = true
  }

  private_zone_config = {
    name        = "prod-private-zone"
    description = "Production private DNS zone"
    vpc_ids     = ["projects/my-prod-project-001/global/networks/prod-vpc"]
  }

  dns_policy_config = {
    enable_inbound_forwarding = true
    enable_logging            = true
    alternative_resolvers     = ["10.0.0.53", "10.0.0.54"]
  }

  public_records = [
    { name = "@", type = "A", ttl = 300, values = ["34.102.136.180"] },
    { name = "www", type = "CNAME", ttl = 300, values = ["example.com."] },
    { name = "api", type = "A", ttl = 60, values = ["34.98.127.226"] },
    { name = "mail", type = "MX", ttl = 3600, values = ["1 aspmx.l.google.com.", "5 alt1.aspmx.l.google.com."] },
    { name = "@", type = "TXT", ttl = 3600, values = ["v=spf1 include:_spf.google.com -all"] },
  ]

  private_records = [
    { name = "db-primary", type = "A", ttl = 300, values = ["10.0.0.100"] },
    { name = "cache", type = "A", ttl = 60, values = ["10.0.0.110"] },
    { name = "k8s-api", type = "A", ttl = 60, values = ["10.0.0.120"] },
  ]
}
```

### 50. Comprehensive DNS Architecture with Failover, Logging, and Security
```hcl
# Complete production DNS architecture
# Combines: public zone + private zone + forwarding + DNSSEC + logging + policies + health checks

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-prod-project-001"
  region  = "us-central1"
}

# 1. Public Zone with DNSSEC
resource "google_dns_managed_zone" "prod_public" {
  project     = "my-prod-project-001"
  name        = "prod-public"
  dns_name    = "example.com."
  visibility  = "public"

  dnssec_config {
    state         = "on"
    non_existence = "nsec3"
    default_key_specs {
      algorithm  = "ecdsap256sha256"
      key_length = 256
      key_type   = "keySigning"
    }
    default_key_specs {
      algorithm  = "ecdsap256sha256"
      key_length = 256
      key_type   = "zoneSigning"
    }
  }

  labels = { env = "production", managed_by = "terraform" }
}

# 2. Private Zone
resource "google_dns_managed_zone" "prod_private" {
  project    = "my-prod-project-001"
  name       = "prod-private"
  dns_name   = "prod.internal."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.prod_vpc.id
    }
  }
}

# 3. Forwarding Zone for on-prem
resource "google_dns_managed_zone" "onprem_fwd" {
  project    = "my-prod-project-001"
  name       = "onprem-forwarding"
  dns_name   = "corp.acme.internal."
  visibility = "private"

  private_visibility_config {
    networks {
      network_url = google_compute_network.prod_vpc.id
    }
  }

  forwarding_config {
    target_name_servers {
      ipv4_address    = "10.200.0.10"
      forwarding_path = "private"
    }
  }
}

# 4. DNS Policy with inbound forwarding + logging
resource "google_dns_policy" "prod_policy" {
  project                   = "my-prod-project-001"
  name                      = "prod-dns-policy"
  enable_inbound_forwarding = true
  enable_logging            = true

  networks {
    network_url = google_compute_network.prod_vpc.id
  }
}

# 5. Global health-checked failover record (WRR primary + GEO backup)
resource "google_dns_record_set" "app_failover" {
  project      = "my-prod-project-001"
  name         = "app.example.com."
  managed_zone = google_dns_managed_zone.prod_public.name
  type         = "A"
  ttl          = 30

  routing_policy {
    primary_backup {
      trickle_ratio = 0.0

      primary {
        internal_load_balancers {
          load_balancer_type = "globalL7ilb"
          ip_address         = "34.102.136.180"
          port               = "443"
          ip_protocol        = "TCP"
          network_url        = google_compute_network.prod_vpc.id
          project            = "my-prod-project-001"
          region             = "us-central1"
        }
      }

      backup_geo {
        location = "us-east1"
        rrdatas  = ["34.75.10.200"]
      }
    }
  }
}

# 6. All standard public records
resource "google_dns_record_set" "standard_records" {
  for_each = {
    mx = {
      name    = "example.com."
      type    = "MX"
      ttl     = 3600
      rrdatas = ["1 aspmx.l.google.com.", "5 alt1.aspmx.l.google.com."]
    }
    spf = {
      name    = "example.com."
      type    = "TXT"
      ttl     = 3600
      rrdatas = ["\"v=spf1 include:_spf.google.com -all\""]
    }
    dmarc = {
      name    = "_dmarc.example.com."
      type    = "TXT"
      ttl     = 3600
      rrdatas = ["\"v=DMARC1; p=reject; rua=mailto:dmarc@example.com\""]
    }
  }

  project      = "my-prod-project-001"
  name         = each.value.name
  managed_zone = google_dns_managed_zone.prod_public.name
  type         = each.value.type
  ttl          = each.value.ttl
  rrdatas      = each.value.rrdatas
}

# 7. Private DNS records for internal services
resource "google_dns_record_set" "private_services" {
  for_each = {
    "db-primary.prod.internal."  = "10.0.0.100"
    "db-replica.prod.internal."  = "10.0.0.101"
    "redis.prod.internal."       = "10.0.0.110"
    "api-internal.prod.internal." = "10.0.0.120"
  }

  project      = "my-prod-project-001"
  name         = each.key
  managed_zone = google_dns_managed_zone.prod_private.name
  type         = "A"
  ttl          = 300
  rrdatas      = [each.value]
}

# 8. Response policy to block internal IP leaks
resource "google_dns_response_policy" "security_policy" {
  project              = "my-prod-project-001"
  response_policy_name = "prod-security-response-policy"
  description          = "Block DNS rebinding and internal address leaks"

  networks {
    network_url = google_compute_network.prod_vpc.id
  }
}

output "public_zone_name_servers" {
  description = "Name servers to configure at domain registrar"
  value       = google_dns_managed_zone.prod_public.name_servers
}

output "private_zone_id" {
  description = "Private zone resource ID"
  value       = google_dns_managed_zone.prod_private.id
}
```
