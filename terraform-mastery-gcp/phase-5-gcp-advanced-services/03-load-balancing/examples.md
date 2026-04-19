# Examples 5.3 — Load Balancing (GCP) (50 examples)

## Basic

**1. HTTP health check**
```hcl
resource "google_compute_health_check" "http_check" {
  name               = "http-health-check"
  check_interval_sec = 10
  timeout_sec        = 5
  healthy_threshold  = 2
  unhealthy_threshold = 3

  http_health_check {
    port         = 80
    request_path = "/health"
  }
}
```

**2. HTTPS health check**
```hcl
resource "google_compute_health_check" "https_check" {
  name               = "https-health-check"
  check_interval_sec = 10
  timeout_sec        = 5

  https_health_check {
    port         = 443
    request_path = "/health"
  }
}
```

**3. Backend service pointing to a MIG**
```hcl
resource "google_compute_backend_service" "backend" {
  name                  = "app-backend-service"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}
```

**4. URL map (default route)**
```hcl
resource "google_compute_url_map" "url_map" {
  name            = "app-url-map"
  default_service = google_compute_backend_service.backend.id
}
```

**5. HTTP target proxy**
```hcl
resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "app-http-proxy"
  url_map = google_compute_url_map.url_map.id
}
```

**6. Global forwarding rule (HTTP)**
```hcl
resource "google_compute_global_forwarding_rule" "http_rule" {
  name                  = "app-http-forwarding-rule"
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "80"
  target                = google_compute_target_http_proxy.http_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**7. Reserve a static global IP address**
```hcl
resource "google_compute_global_address" "lb_ip" {
  name         = "app-lb-ip"
  ip_version   = "IPV4"
  address_type = "EXTERNAL"
}

output "lb_ip_address" {
  value = google_compute_global_address.lb_ip.address
}
```

**8. TCP health check**
```hcl
resource "google_compute_health_check" "tcp_check" {
  name               = "tcp-health-check"
  check_interval_sec = 10
  timeout_sec        = 5

  tcp_health_check {
    port = 8080
  }
}
```

**9. Backend service with connection draining**
```hcl
resource "google_compute_backend_service" "with_draining" {
  name                  = "draining-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  connection_draining_timeout_sec = 300

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**10. Backend service with session affinity**
```hcl
resource "google_compute_backend_service" "sticky" {
  name                  = "sticky-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  session_affinity      = "CLIENT_IP"

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**11. Global forwarding rule with port range**
```hcl
resource "google_compute_global_forwarding_rule" "http_80" {
  name                  = "http-80-rule"
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "80"
  target                = google_compute_target_http_proxy.http_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**12. Backend service log config**
```hcl
resource "google_compute_backend_service" "with_logs" {
  name                  = "logging-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_health_check.http_check.id]

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

---

## Intermediate

**13. HTTPS load balancer with managed SSL certificate**
```hcl
resource "google_compute_managed_ssl_certificate" "cert" {
  name = "app-ssl-cert"

  managed {
    domains = ["app.example.com", "www.example.com"]
  }
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "app-https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

resource "google_compute_global_forwarding_rule" "https_rule" {
  name                  = "app-https-rule"
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.https_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**14. HTTP to HTTPS redirect**
```hcl
resource "google_compute_url_map" "redirect_map" {
  name = "http-redirect-map"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "redirect_proxy" {
  name    = "http-redirect-proxy"
  url_map = google_compute_url_map.redirect_map.id
}

resource "google_compute_global_forwarding_rule" "http_redirect_rule" {
  name                  = "http-redirect-rule"
  ip_address            = google_compute_global_address.lb_ip.address
  port_range            = "80"
  target                = google_compute_target_http_proxy.redirect_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**15. Path-based routing with host rules and path matchers**
```hcl
resource "google_compute_url_map" "path_based" {
  name            = "path-based-url-map"
  default_service = google_compute_backend_service.default_backend.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "app-paths"
  }

  path_matcher {
    name            = "app-paths"
    default_service = google_compute_backend_service.default_backend.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api_backend.id
    }

    path_rule {
      paths   = ["/static/*"]
      service = google_compute_backend_service.static_backend.id
    }
  }
}
```

**16. Host-based routing**
```hcl
resource "google_compute_url_map" "host_based" {
  name            = "host-based-url-map"
  default_service = google_compute_backend_service.default_backend.id

  host_rule {
    hosts        = ["api.example.com"]
    path_matcher = "api-matcher"
  }

  host_rule {
    hosts        = ["static.example.com"]
    path_matcher = "static-matcher"
  }

  path_matcher {
    name            = "api-matcher"
    default_service = google_compute_backend_service.api_backend.id
  }

  path_matcher {
    name            = "static-matcher"
    default_service = google_compute_backend_service.static_backend.id
  }
}
```

**17. Regional internal HTTP(S) load balancer**
```hcl
resource "google_compute_region_health_check" "regional_check" {
  name   = "regional-http-check"
  region = "us-central1"

  http_health_check {
    port         = 8080
    request_path = "/health"
  }
}

resource "google_compute_region_backend_service" "internal_backend" {
  name                  = "internal-backend"
  region                = "us-central1"
  protocol              = "HTTP"
  load_balancing_scheme = "INTERNAL_MANAGED"

  health_checks = [google_compute_region_health_check.regional_check.id]

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}

resource "google_compute_region_url_map" "internal_url_map" {
  name            = "internal-url-map"
  region          = "us-central1"
  default_service = google_compute_region_backend_service.internal_backend.id
}

resource "google_compute_region_target_http_proxy" "internal_proxy" {
  name    = "internal-http-proxy"
  region  = "us-central1"
  url_map = google_compute_region_url_map.internal_url_map.id
}

resource "google_compute_forwarding_rule" "internal_rule" {
  name                  = "internal-lb-rule"
  region                = "us-central1"
  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_region_target_http_proxy.internal_proxy.id
  network               = google_compute_network.vpc.id
  subnetwork            = google_compute_subnetwork.subnet.id
}
```

**18. Serverless NEG backend for Cloud Run**
```hcl
resource "google_compute_region_network_endpoint_group" "run_neg" {
  name                  = "cloud-run-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_run {
    service = google_cloud_run_v2_service.app.name
  }
}

resource "google_compute_backend_service" "run_backend" {
  name                  = "run-backend-service"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.run_neg.id
  }
}
```

**19. Internet NEG (external backend)**
```hcl
resource "google_compute_global_network_endpoint_group" "internet_neg" {
  name                  = "internet-neg"
  network_endpoint_type = "INTERNET_FQDN_PORT"
  default_port          = 443
}

resource "google_compute_global_network_endpoint" "external_endpoint" {
  global_network_endpoint_group = google_compute_global_network_endpoint_group.internet_neg.name
  fqdn                          = "api.external-service.com"
  port                          = 443
}

resource "google_compute_backend_service" "internet_backend" {
  name                  = "internet-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_global_network_endpoint_group.internet_neg.id
  }
}
```

**20. Zonal NEG for GCE instances**
```hcl
resource "google_compute_network_endpoint_group" "zonal_neg" {
  name         = "zonal-neg"
  network      = google_compute_network.vpc.id
  subnetwork   = google_compute_subnetwork.subnet.id
  default_port = "8080"
  zone         = "us-central1-a"
}

resource "google_compute_network_endpoint" "endpoint" {
  network_endpoint_group = google_compute_network_endpoint_group.zonal_neg.name
  zone                   = "us-central1-a"
  ip_address             = google_compute_instance.app.network_interface[0].network_ip
  port                   = 8080
}
```

**21. Backend service with custom request headers**
```hcl
resource "google_compute_backend_service" "with_headers" {
  name                  = "headers-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_health_check.http_check.id]

  custom_request_headers  = ["X-Client-IP: {client_ip_address}", "X-Forwarded-Proto: https"]
  custom_response_headers = ["X-Cache-Status: {cdn_cache_status}"]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**22. URL map with weighted backend splitting**
```hcl
resource "google_compute_url_map" "weighted" {
  name            = "weighted-url-map"
  default_service = google_compute_backend_service.v1_backend.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "canary"
  }

  path_matcher {
    name            = "canary"
    default_service = google_compute_backend_service.v1_backend.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/"
      }
      route_action {
        weighted_backend_services {
          backend_service = google_compute_backend_service.v1_backend.id
          weight          = 90
        }
        weighted_backend_services {
          backend_service = google_compute_backend_service.v2_backend.id
          weight          = 10
        }
      }
    }
  }
}
```

**23. Backend bucket (GCS) for static content**
```hcl
resource "google_compute_backend_bucket" "static_assets" {
  name        = "static-assets-backend"
  bucket_name = google_storage_bucket.assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    client_ttl                   = 7200
    max_ttl                      = 86400
    negative_caching             = true
    serve_while_stale            = 86400
  }
}
```

**24. URL map combining backend service and backend bucket**
```hcl
resource "google_compute_url_map" "combined" {
  name            = "combined-url-map"
  default_service = google_compute_backend_service.api_backend.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.api_backend.id

    path_rule {
      paths   = ["/static/*", "/assets/*"]
      service = google_compute_backend_bucket.static_assets.id
    }

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api_backend.id
    }
  }
}
```

**25. Self-managed SSL certificate**
```hcl
resource "google_compute_ssl_certificate" "self_managed" {
  name        = "self-managed-cert"
  private_key = file(var.ssl_private_key_path)
  certificate = file(var.ssl_certificate_path)

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_target_https_proxy" "with_custom_cert" {
  name             = "custom-cert-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_ssl_certificate.self_managed.id]
}
```

---

## Nested

**26. Complete global HTTPS load balancer (IP + cert + proxy + url_map + backend + MIG)**
```hcl
# Global IP
resource "google_compute_global_address" "app_ip" {
  name = "app-global-ip"
}

# Managed SSL certificate
resource "google_compute_managed_ssl_certificate" "app_cert" {
  name = "app-managed-cert"
  managed {
    domains = ["app.example.com"]
  }
}

# Health check
resource "google_compute_health_check" "app_hc" {
  name = "app-health-check"
  http_health_check {
    port         = 80
    request_path = "/healthz"
  }
}

# Backend service
resource "google_compute_backend_service" "app_bs" {
  name                  = "app-backend-svc"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.app_hc.id]

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  backend {
    group           = google_compute_region_instance_group_manager.app_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}

# URL map
resource "google_compute_url_map" "app_map" {
  name            = "app-url-map"
  default_service = google_compute_backend_service.app_bs.id
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "app_proxy" {
  name             = "app-https-proxy"
  url_map          = google_compute_url_map.app_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.app_cert.id]
}

# HTTPS forwarding rule
resource "google_compute_global_forwarding_rule" "app_https" {
  name                  = "app-https-fwd"
  ip_address            = google_compute_global_address.app_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.app_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# HTTP redirect
resource "google_compute_url_map" "redirect" {
  name = "http-redirect"
  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "redirect_proxy" {
  name    = "http-redirect-proxy"
  url_map = google_compute_url_map.redirect.id
}

resource "google_compute_global_forwarding_rule" "app_http_redirect" {
  name                  = "app-http-redirect"
  ip_address            = google_compute_global_address.app_ip.address
  port_range            = "80"
  target                = google_compute_target_http_proxy.redirect_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**27. Cloud Armor security policy attached to backend**
```hcl
resource "google_compute_security_policy" "waf_policy" {
  name = "waf-security-policy"

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
    description = "Block SQL injection attacks"
  }

  rule {
    action   = "throttle"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
    }
    description = "Rate limiting"
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

resource "google_compute_backend_service" "armor_protected" {
  name                  = "armor-protected-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  security_policy = google_compute_security_policy.waf_policy.id

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**28. Multi-region backend service with failover**
```hcl
resource "google_compute_backend_service" "multi_region" {
  name                  = "multi-region-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_health_check.http_check.id]

  locality_lb_policy = "ROUND_ROBIN"

  # Primary region backend
  backend {
    group           = google_compute_region_instance_group_manager.us_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
    description     = "US primary"
  }

  # Secondary region backend
  backend {
    group           = google_compute_region_instance_group_manager.eu_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 0.5
    description     = "EU failover"
  }

  log_config {
    enable      = true
    sample_rate = 0.1
  }
}
```

**29. Serverless NEG for Cloud Run with URL map routing**
```hcl
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "api-run-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

resource "google_compute_region_network_endpoint_group" "web_neg" {
  name                  = "web-run-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
  cloud_run {
    service = google_cloud_run_v2_service.web.name
  }
}

resource "google_compute_backend_service" "api_backend" {
  name                  = "api-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"
  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
}

resource "google_compute_backend_service" "web_backend" {
  name                  = "web-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"
  backend {
    group = google_compute_region_network_endpoint_group.web_neg.id
  }
}

resource "google_compute_url_map" "serverless_map" {
  name            = "serverless-url-map"
  default_service = google_compute_backend_service.web_backend.id

  host_rule {
    hosts        = ["example.com", "www.example.com"]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.web_backend.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api_backend.id
    }
  }
}
```

**30. Internal TCP/UDP load balancer**
```hcl
resource "google_compute_region_health_check" "tcp_check" {
  name   = "internal-tcp-check"
  region = "us-central1"

  tcp_health_check {
    port = 8080
  }
}

resource "google_compute_region_backend_service" "internal_tcp" {
  name                  = "internal-tcp-backend"
  region                = "us-central1"
  protocol              = "TCP"
  load_balancing_scheme = "INTERNAL"

  health_checks = [google_compute_region_health_check.tcp_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}

resource "google_compute_forwarding_rule" "internal_tcp_rule" {
  name                  = "internal-tcp-lb"
  region                = "us-central1"
  load_balancing_scheme = "INTERNAL"
  backend_service       = google_compute_region_backend_service.internal_tcp.id
  all_ports             = true
  network               = google_compute_network.vpc.id
  subnetwork            = google_compute_subnetwork.subnet.id
}
```

**31. Network Load Balancer (regional, external)**
```hcl
resource "google_compute_region_health_check" "nlb_check" {
  name   = "nlb-health-check"
  region = "us-central1"

  tcp_health_check {
    port = 443
  }
}

resource "google_compute_region_backend_service" "nlb_backend" {
  name                  = "nlb-backend"
  region                = "us-central1"
  protocol              = "TCP"
  load_balancing_scheme = "EXTERNAL"

  health_checks = [google_compute_region_health_check.nlb_check.id]

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "CONNECTION"
  }
}

resource "google_compute_address" "nlb_ip" {
  name   = "nlb-static-ip"
  region = "us-central1"
}

resource "google_compute_forwarding_rule" "nlb_rule" {
  name                  = "external-nlb-rule"
  region                = "us-central1"
  load_balancing_scheme = "EXTERNAL"
  backend_service       = google_compute_region_backend_service.nlb_backend.id
  ip_address            = google_compute_address.nlb_ip.address
  port_range            = "443"
  ip_protocol           = "TCP"
}
```

**32. Internal Application Load Balancer (L7 internal)**
```hcl
resource "google_compute_subnetwork" "proxy_subnet" {
  name          = "proxy-only-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = "us-central1"
  purpose       = "REGIONAL_MANAGED_PROXY"
  role          = "ACTIVE"
  network       = google_compute_network.vpc.id
}

resource "google_compute_region_health_check" "internal_hc" {
  name   = "internal-lb-hc"
  region = "us-central1"
  http_health_check {
    port = 8080
  }
}

resource "google_compute_region_backend_service" "internal_l7_backend" {
  name                  = "internal-l7-backend"
  region                = "us-central1"
  protocol              = "HTTP"
  load_balancing_scheme = "INTERNAL_MANAGED"

  health_checks = [google_compute_region_health_check.internal_hc.id]

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}

resource "google_compute_region_url_map" "internal_l7_map" {
  name            = "internal-l7-url-map"
  region          = "us-central1"
  default_service = google_compute_region_backend_service.internal_l7_backend.id
}

resource "google_compute_region_target_http_proxy" "internal_l7_proxy" {
  name    = "internal-l7-proxy"
  region  = "us-central1"
  url_map = google_compute_region_url_map.internal_l7_map.id
}

resource "google_compute_forwarding_rule" "internal_l7_rule" {
  name                  = "internal-l7-lb"
  region                = "us-central1"
  load_balancing_scheme = "INTERNAL_MANAGED"
  ip_protocol           = "TCP"
  port_range            = "80"
  target                = google_compute_region_target_http_proxy.internal_l7_proxy.id
  network               = google_compute_network.vpc.id
  subnetwork            = google_compute_subnetwork.subnet.id

  depends_on = [google_compute_subnetwork.proxy_subnet]
}
```

---

## Advanced

**33. SSL policy (TLS 1.2 minimum)**
```hcl
resource "google_compute_ssl_policy" "tls12_policy" {
  name            = "tls12-ssl-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

resource "google_compute_target_https_proxy" "tls12_proxy" {
  name             = "tls12-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
  ssl_policy       = google_compute_ssl_policy.tls12_policy.id
}
```

**34. SSL policy with restricted cipher suites**
```hcl
resource "google_compute_ssl_policy" "restricted_policy" {
  name            = "restricted-ssl-policy"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_2"
}
```

**35. Target SSL proxy (TCP load balancer with SSL termination)**
```hcl
resource "google_compute_ssl_certificate" "tcp_cert" {
  name        = "tcp-ssl-cert"
  private_key = file(var.private_key_path)
  certificate = file(var.certificate_path)
}

resource "google_compute_target_ssl_proxy" "ssl_proxy" {
  name             = "tcp-ssl-proxy"
  backend_service  = google_compute_backend_service.tcp_backend.id
  ssl_certificates = [google_compute_ssl_certificate.tcp_cert.id]
  ssl_policy       = google_compute_ssl_policy.tls12_policy.id
  proxy_header     = "PROXY_V1"
}

resource "google_compute_global_forwarding_rule" "tcp_ssl_rule" {
  name       = "tcp-ssl-rule"
  ip_address = google_compute_global_address.lb_ip.address
  port_range = "443"
  target     = google_compute_target_ssl_proxy.ssl_proxy.id
}
```

**36. gRPC load balancing with NEG**
```hcl
resource "google_compute_network_endpoint_group" "grpc_neg" {
  name                  = "grpc-neg"
  network               = google_compute_network.vpc.id
  subnetwork            = google_compute_subnetwork.subnet.id
  default_port          = 50051
  zone                  = "us-central1-a"
  network_endpoint_type = "GCE_VM_IP_PORT"
}

resource "google_compute_health_check" "grpc_check" {
  name = "grpc-health-check"

  grpc_health_check {
    port         = 50051
    grpc_service_name = "grpc.health.v1.Health"
  }
}

resource "google_compute_backend_service" "grpc_backend" {
  name                  = "grpc-backend"
  protocol              = "HTTP2"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_health_check.grpc_check.id]

  backend {
    group          = google_compute_network_endpoint_group.grpc_neg.id
    balancing_mode = "RATE"
    max_rate       = 1000
  }
}

resource "google_compute_url_map" "grpc_map" {
  name            = "grpc-url-map"
  default_service = google_compute_backend_service.grpc_backend.id
}

resource "google_compute_target_https_proxy" "grpc_proxy" {
  name             = "grpc-https-proxy"
  url_map          = google_compute_url_map.grpc_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}
```

**37. Cross-region load balancing with geo-based routing**
```hcl
resource "google_compute_backend_service" "geo_backend" {
  name                  = "geo-backend-service"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  locality_lb_policy    = "LEAST_REQUEST"

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group           = google_compute_region_instance_group_manager.us_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  backend {
    group           = google_compute_region_instance_group_manager.eu_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  backend {
    group           = google_compute_region_instance_group_manager.ap_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  outlier_detection {
    consecutive_errors                    = 5
    interval                              = { seconds = 10 }
    base_ejection_time                    = { seconds = 30 }
    max_ejection_percent                  = 50
    enforcing_consecutive_errors          = 100
    enforcing_success_rate                = 100
    success_rate_minimum_hosts            = 5
    success_rate_request_volume           = 100
    success_rate_stdev_factor             = 1900
    consecutive_gateway_failure           = 5
    enforcing_consecutive_gateway_failure = 0
  }
}
```

**38. URL map with header-based routing and rewrites**
```hcl
resource "google_compute_url_map" "advanced_routing" {
  name            = "advanced-routing-map"
  default_service = google_compute_backend_service.default_backend.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "advanced"
  }

  path_matcher {
    name            = "advanced"
    default_service = google_compute_backend_service.default_backend.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/v2/"
        header_matches {
          header_name   = "X-Feature"
          exact_match   = "beta"
        }
      }
      route_action {
        url_rewrite {
          path_prefix_rewrite = "/api/v2/"
        }
        weighted_backend_services {
          backend_service = google_compute_backend_service.beta_backend.id
          weight          = 100
        }
      }
    }
  }
}
```

**39. Cloud Armor rate limiting with adaptive protection**
```hcl
resource "google_compute_security_policy" "adaptive" {
  name = "adaptive-protection-policy"

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
        expression = "evaluatePreconfiguredExpr('xss-stable') || evaluatePreconfiguredExpr('sqli-stable') || evaluatePreconfiguredExpr('lfi-stable') || evaluatePreconfiguredExpr('rfi-canary')"
      }
    }
    description = "OWASP Top 10 protection"
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
    description = "Default rule"
  }
}
```

**40. Load balancer with IAP (Identity-Aware Proxy)**
```hcl
resource "google_iap_brand" "brand" {
  support_email     = var.support_email
  application_title = "App"
  project           = var.project_id
}

resource "google_iap_client" "iap_client" {
  display_name = "IAP Client"
  brand        = google_iap_brand.brand.name
}

resource "google_compute_backend_service" "iap_backend" {
  name                  = "iap-protected-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_health_check.http_check.id]

  iap {
    enabled              = true
    oauth2_client_id     = google_iap_client.iap_client.client_id
    oauth2_client_secret = google_iap_client.iap_client.secret
  }

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**41. Autoscaling MIG with LB**
```hcl
resource "google_compute_instance_template" "web_template" {
  name_prefix  = "web-template-"
  machine_type = "e2-medium"

  disk {
    source_image = "debian-cloud/debian-12"
    auto_delete  = true
    boot         = true
  }

  network_interface {
    network    = google_compute_network.vpc.name
    subnetwork = google_compute_subnetwork.subnet.name
  }

  metadata_startup_script = file("startup.sh")

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_region_instance_group_manager" "mig" {
  name               = "web-mig"
  region             = "us-central1"
  base_instance_name = "web"

  version {
    instance_template = google_compute_instance_template.web_template.id
  }

  named_port {
    name = "http"
    port = 80
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.http_check.id
    initial_delay_sec = 300
  }
}

resource "google_compute_region_autoscaler" "web_asg" {
  name   = "web-autoscaler"
  region = "us-central1"
  target = google_compute_region_instance_group_manager.mig.id

  autoscaling_policy {
    max_replicas    = 20
    min_replicas    = 2
    cooldown_period = 60

    cpu_utilization {
      target = 0.6
    }

    load_balancing_utilization {
      target = 0.8
    }
  }
}
```

**42. LB with request/response header transformation**
```hcl
resource "google_compute_url_map" "header_transform" {
  name            = "header-transform-map"
  default_service = google_compute_backend_service.backend.id

  host_rule {
    hosts        = ["api.example.com"]
    path_matcher = "api"
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.backend.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/"
      }
      route_action {
        weighted_backend_services {
          backend_service = google_compute_backend_service.backend.id
          weight          = 100

          header_action {
            request_headers_to_add {
              header_name  = "X-Backend-Version"
              header_value = "v1"
              replace      = true
            }
            response_headers_to_add {
              header_name  = "Strict-Transport-Security"
              header_value = "max-age=31536000; includeSubDomains"
              replace      = false
            }
          }
        }
      }
    }
  }
}
```

**43. External Application Load Balancer with CDN and Cloud Armor**
```hcl
resource "google_compute_backend_service" "full_featured" {
  name                  = "full-featured-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30

  security_policy = google_compute_security_policy.waf_policy.id

  enable_cdn = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    client_ttl                   = 7200
    max_ttl                      = 86400
    negative_caching             = true
    signed_url_cache_max_age_sec = 7200
  }

  health_checks = [google_compute_health_check.http_check.id]

  log_config {
    enable      = true
    sample_rate = 0.1
  }

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}
```

**44. LB with timeout and retry policy**
```hcl
resource "google_compute_url_map" "retry_map" {
  name            = "retry-url-map"
  default_service = google_compute_backend_service.backend.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "retry"
  }

  path_matcher {
    name            = "retry"
    default_service = google_compute_backend_service.backend.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/api/"
      }
      route_action {
        timeout {
          seconds = 30
          nanos   = 0
        }
        retry_policy {
          retry_conditions = ["deadline-exceeded", "resource-exhausted"]
          num_retries      = 3
          per_try_timeout {
            seconds = 10
          }
        }
        weighted_backend_services {
          backend_service = google_compute_backend_service.backend.id
          weight          = 100
        }
      }
    }
  }
}
```

**45. Certificate map for SNI-based multi-domain LB**
```hcl
resource "google_certificate_manager_certificate" "primary" {
  name = "primary-cert"
  managed {
    domains = ["example.com", "www.example.com"]
  }
}

resource "google_certificate_manager_certificate" "api" {
  name = "api-cert"
  managed {
    domains = ["api.example.com"]
  }
}

resource "google_certificate_manager_certificate_map" "cert_map" {
  name = "app-cert-map"
}

resource "google_certificate_manager_certificate_map_entry" "primary_entry" {
  name         = "primary-entry"
  map          = google_certificate_manager_certificate_map.cert_map.name
  certificates = [google_certificate_manager_certificate.primary.id]
  hostname     = "example.com"
}

resource "google_certificate_manager_certificate_map_entry" "api_entry" {
  name         = "api-entry"
  map          = google_certificate_manager_certificate_map.cert_map.name
  certificates = [google_certificate_manager_certificate.api.id]
  hostname     = "api.example.com"
}

resource "google_compute_target_https_proxy" "cert_map_proxy" {
  name             = "cert-map-proxy"
  url_map          = google_compute_url_map.url_map.id
  certificate_map  = "//certificatemanager.googleapis.com/${google_certificate_manager_certificate_map.cert_map.id}"
}
```

**46. LB with mirror traffic to testing backend**
```hcl
resource "google_compute_url_map" "mirrored" {
  name            = "mirrored-url-map"
  default_service = google_compute_backend_service.prod_backend.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "mirror"
  }

  path_matcher {
    name            = "mirror"
    default_service = google_compute_backend_service.prod_backend.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/"
      }
      route_action {
        weighted_backend_services {
          backend_service = google_compute_backend_service.prod_backend.id
          weight          = 100
        }
        request_mirror_policy {
          backend_service = google_compute_backend_service.shadow_backend.id
        }
      }
    }
  }
}
```

**47. Serverless NEG for Cloud Functions backend**
```hcl
resource "google_compute_region_network_endpoint_group" "function_neg" {
  name                  = "function-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_function {
    function = google_cloudfunctions2_function.hello_http.name
  }
}

resource "google_compute_backend_service" "function_backend" {
  name                  = "function-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.function_neg.id
  }
}
```

**48. Regional external Application Load Balancer**
```hcl
resource "google_compute_address" "regional_lb_ip" {
  name         = "regional-lb-ip"
  region       = "us-central1"
  address_type = "EXTERNAL"
  network_tier = "STANDARD"
}

resource "google_compute_region_health_check" "regional_hc" {
  name   = "regional-hc"
  region = "us-central1"
  http_health_check {
    port = 80
  }
}

resource "google_compute_region_backend_service" "regional_external" {
  name                  = "regional-external-backend"
  region                = "us-central1"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_region_health_check.regional_hc.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}

resource "google_compute_region_url_map" "regional_map" {
  name            = "regional-url-map"
  region          = "us-central1"
  default_service = google_compute_region_backend_service.regional_external.id
}

resource "google_compute_region_target_http_proxy" "regional_proxy" {
  name    = "regional-http-proxy"
  region  = "us-central1"
  url_map = google_compute_region_url_map.regional_map.id
}

resource "google_compute_forwarding_rule" "regional_external_rule" {
  name                  = "regional-external-rule"
  region                = "us-central1"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  ip_address            = google_compute_address.regional_lb_ip.address
  port_range            = "80"
  target                = google_compute_region_target_http_proxy.regional_proxy.id
  network_tier          = "STANDARD"
}
```

**49. LB with circuit breaker and outlier detection**
```hcl
resource "google_compute_backend_service" "circuit_breaker" {
  name                  = "circuit-breaker-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  health_checks = [google_compute_health_check.http_check.id]

  circuit_breakers {
    max_requests_per_connection = 100
    max_connections             = 1000
    max_pending_requests        = 200
    max_requests                = 1000
    max_retries                 = 3
  }

  outlier_detection {
    consecutive_errors                    = 5
    interval                              = { seconds = 30 }
    base_ejection_time                    = { seconds = 30 }
    max_ejection_percent                  = 50
    enforcing_consecutive_errors          = 100
    enforcing_success_rate                = 100
    success_rate_minimum_hosts            = 5
    success_rate_request_volume           = 100
    success_rate_stdev_factor             = 1900
    consecutive_gateway_failure           = 5
    enforcing_consecutive_gateway_failure = 0
  }

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**50. Complete multi-region HTTPS LB with CDN, Cloud Armor, and health checks**
```hcl
resource "google_compute_global_address" "final_ip" {
  name = "final-lb-ip"
}

resource "google_compute_managed_ssl_certificate" "final_cert" {
  name = "final-ssl-cert"
  managed {
    domains = [var.domain]
  }
}

resource "google_compute_ssl_policy" "final_ssl_policy" {
  name            = "final-ssl-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

resource "google_compute_security_policy" "final_armor" {
  name = "final-cloud-armor"
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable') || evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
  }
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config { src_ip_ranges = ["*"] }
    }
  }
}

resource "google_compute_health_check" "final_hc" {
  name = "final-health-check"
  http_health_check {
    port         = 80
    request_path = "/healthz"
  }
}

resource "google_compute_backend_service" "final_backend" {
  name                  = "final-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.final_armor.id
  health_checks         = [google_compute_health_check.final_hc.id]

  enable_cdn = true
  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }

  backend {
    group           = google_compute_region_instance_group_manager.us_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  backend {
    group           = google_compute_region_instance_group_manager.eu_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 0.1
  }
}

resource "google_compute_url_map" "final_map" {
  name            = "final-url-map"
  default_service = google_compute_backend_service.final_backend.id
}

resource "google_compute_target_https_proxy" "final_proxy" {
  name             = "final-https-proxy"
  url_map          = google_compute_url_map.final_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.final_cert.id]
  ssl_policy       = google_compute_ssl_policy.final_ssl_policy.id
}

resource "google_compute_global_forwarding_rule" "final_https" {
  name                  = "final-https-rule"
  ip_address            = google_compute_global_address.final_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.final_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

output "final_lb_ip" {
  value = google_compute_global_address.final_ip.address
}
```
