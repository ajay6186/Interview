# Examples 5.4 — Cloud CDN (GCP) (50 examples)

## Basic

**1. Enable CDN on a backend service**
```hcl
resource "google_compute_backend_service" "cdn_enabled" {
  name                  = "cdn-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**2. Cache mode: CACHE_ALL_STATIC**
```hcl
resource "google_compute_backend_service" "static_cache" {
  name                  = "static-cache-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**3. Cache mode: USE_ORIGIN_HEADERS**
```hcl
resource "google_compute_backend_service" "origin_headers_cache" {
  name                  = "origin-headers-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "USE_ORIGIN_HEADERS"
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**4. Cache mode: FORCE_CACHE_ALL**
```hcl
resource "google_compute_backend_service" "force_cache" {
  name                  = "force-cache-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "FORCE_CACHE_ALL"
    default_ttl = 3600
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**5. Set default TTL, client TTL, and max TTL**
```hcl
resource "google_compute_backend_service" "ttl_config" {
  name                  = "ttl-config-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    client_ttl  = 7200
    max_ttl     = 86400
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**6. Enable negative caching**
```hcl
resource "google_compute_backend_service" "negative_cache" {
  name                  = "negative-cache-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode       = "CACHE_ALL_STATIC"
    negative_caching = true

    negative_caching_policy {
      code = 404
      ttl  = 120
    }

    negative_caching_policy {
      code = 503
      ttl  = 30
    }
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**7. Serve stale content while revalidating**
```hcl
resource "google_compute_backend_service" "stale_while_revalidate" {
  name                  = "stale-revalidate-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    serve_while_stale = 86400
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**8. CDN with request coalescing**
```hcl
resource "google_compute_backend_service" "request_coalescing" {
  name                  = "coalescing-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode          = "CACHE_ALL_STATIC"
    request_coalescing  = true
    default_ttl         = 3600
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**9. GCS backend bucket with CDN enabled**
```hcl
resource "google_storage_bucket" "static_assets" {
  name          = "${var.project_id}-static-assets"
  location      = "US"
  force_destroy = false

  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.static_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_compute_backend_bucket" "cdn_bucket" {
  name        = "static-assets-cdn"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true
}
```

**10. Backend bucket with TTL settings**
```hcl
resource "google_compute_backend_bucket" "ttl_bucket" {
  name        = "ttl-cdn-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    client_ttl  = 7200
    max_ttl     = 86400
  }
}
```

**11. Simple URL map routing to CDN backend bucket**
```hcl
resource "google_compute_url_map" "cdn_map" {
  name            = "cdn-url-map"
  default_service = google_compute_backend_service.api_backend.id

  host_rule {
    hosts        = ["assets.example.com"]
    path_matcher = "assets"
  }

  path_matcher {
    name            = "assets"
    default_service = google_compute_backend_bucket.cdn_bucket.id
  }
}
```

**12. Output CDN-enabled backend URL**
```hcl
output "cdn_backend_id" {
  description = "CDN-enabled backend service ID"
  value       = google_compute_backend_service.cdn_enabled.id
}

output "cdn_bucket_id" {
  description = "CDN-enabled backend bucket ID"
  value       = google_compute_backend_bucket.cdn_bucket.id
}

output "static_bucket_url" {
  description = "Public URL for static assets"
  value       = "https://storage.googleapis.com/${google_storage_bucket.static_assets.name}"
}
```

---

## Intermediate

**13. Signed URL key on backend service**
```hcl
resource "random_id" "cdn_key" {
  byte_length = 16
}

resource "google_compute_backend_service" "signed_url" {
  name                  = "signed-url-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode             = "CACHE_ALL_STATIC"
    default_ttl            = 3600
    signed_url_cache_max_age_sec = 7200
  }

  signed_url_key {
    key_name = "cdn-signing-key"
    key_value = base64encode(random_id.cdn_key.b64_std)
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**14. Signed URL key on backend bucket**
```hcl
resource "random_id" "bucket_cdn_key" {
  byte_length = 16
}

resource "google_compute_backend_bucket" "signed_bucket" {
  name        = "signed-cdn-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true

  cdn_policy {
    signed_url_cache_max_age_sec = 7200
    cache_mode                   = "CACHE_ALL_STATIC"
  }

  signed_url_key {
    key_name  = "bucket-signing-key"
    key_value = base64encode(random_id.bucket_cdn_key.b64_std)
  }
}
```

**15. Custom cache key: include specific query parameters**
```hcl
resource "google_compute_backend_service" "custom_cache_key" {
  name                  = "custom-key-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"

    cache_key_policy {
      include_host          = true
      include_protocol      = true
      query_string_whitelist = ["version", "lang", "format"]
    }
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**16. Custom cache key: exclude specific query parameters**
```hcl
resource "google_compute_backend_service" "exclude_qs" {
  name                  = "exclude-qs-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"

    cache_key_policy {
      include_host              = true
      include_protocol          = true
      query_string_blacklist    = ["utm_source", "utm_medium", "utm_campaign", "fbclid"]
    }
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**17. Custom cache key: include specific HTTP headers**
```hcl
resource "google_compute_backend_service" "header_cache_key" {
  name                  = "header-cache-key-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"

    cache_key_policy {
      include_host        = true
      include_protocol    = true
      include_http_headers = ["Accept-Language", "Accept-Encoding"]
    }
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**18. Bypass CDN for dynamic API routes using URL map**
```hcl
resource "google_compute_backend_service" "dynamic_no_cdn" {
  name                  = "dynamic-no-cdn"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = false

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.api_mig.instance_group
  }
}

resource "google_compute_url_map" "cdn_bypass" {
  name            = "cdn-bypass-map"
  default_service = google_compute_backend_service.cdn_enabled.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "app"
  }

  path_matcher {
    name            = "app"
    default_service = google_compute_backend_service.cdn_enabled.id

    path_rule {
      paths   = ["/api/*", "/auth/*", "/admin/*"]
      service = google_compute_backend_service.dynamic_no_cdn.id
    }

    path_rule {
      paths   = ["/static/*", "/assets/*", "/images/*"]
      service = google_compute_backend_bucket.cdn_bucket.id
    }
  }
}
```

**19. CDN for GCS bucket origin via backend bucket**
```hcl
resource "google_storage_bucket" "cdn_origin" {
  name          = "${var.project_id}-cdn-origin"
  location      = "US"
  force_destroy = false

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  cors {
    origin          = ["https://app.example.com"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Cache-Control"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "cdn_public" {
  bucket = google_storage_bucket.cdn_origin.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_compute_backend_bucket" "gcs_cdn" {
  name        = "gcs-cdn-backend"
  bucket_name = google_storage_bucket.cdn_origin.name
  enable_cdn  = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
    client_ttl  = 7200
    negative_caching = true
    negative_caching_policy {
      code = 404
      ttl  = 60
    }
  }
}
```

**20. CDN cache key policy excluding all query strings**
```hcl
resource "google_compute_backend_service" "no_qs_cache" {
  name                  = "no-qs-cache-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"

    cache_key_policy {
      include_host              = true
      include_protocol          = true
      include_query_string      = false
    }
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**21. CDN with response compression (custom response headers)**
```hcl
resource "google_compute_backend_service" "cdn_compression" {
  name                  = "cdn-compression-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  custom_response_headers = [
    "Vary: Accept-Encoding",
    "Cache-Control: public, max-age=3600"
  ]

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**22. CDN key resource for signed cookies**
```hcl
resource "google_compute_backend_bucket_signed_url_key" "bucket_key" {
  name           = "cdn-cookie-key"
  key_value      = base64encode(var.cdn_signing_secret)
  backend_bucket = google_compute_backend_bucket.cdn_bucket.name
}
```

**23. Backend bucket with custom response headers**
```hcl
resource "google_compute_backend_bucket" "custom_headers_bucket" {
  name        = "custom-headers-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true

  custom_response_headers = [
    "X-Frame-Options: SAMEORIGIN",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Cache-Control: public, max-age=3600, immutable"
  ]

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }
}
```

**24. CDN with SSL certificate for custom domain**
```hcl
resource "google_compute_managed_ssl_certificate" "cdn_cert" {
  name = "cdn-ssl-cert"
  managed {
    domains = ["assets.example.com"]
  }
}

resource "google_compute_target_https_proxy" "cdn_proxy" {
  name             = "cdn-https-proxy"
  url_map          = google_compute_url_map.cdn_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cdn_cert.id]
}

resource "google_compute_global_address" "cdn_ip" {
  name = "cdn-global-ip"
}

resource "google_compute_global_forwarding_rule" "cdn_https_rule" {
  name                  = "cdn-https-rule"
  ip_address            = google_compute_global_address.cdn_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.cdn_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
```

**25. CDN for Cloud Run via serverless NEG**
```hcl
resource "google_compute_region_network_endpoint_group" "run_neg_cdn" {
  name                  = "run-cdn-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"

  cloud_run {
    service = google_cloud_run_v2_service.app.name
  }
}

resource "google_compute_backend_service" "run_cdn_backend" {
  name                  = "run-cdn-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 300
    max_ttl     = 3600
    cache_key_policy {
      include_host     = true
      include_protocol = true
    }
  }

  backend {
    group = google_compute_region_network_endpoint_group.run_neg_cdn.id
  }
}
```

---

## Nested

**26. Complete Cloud CDN setup (global LB + CDN + GCS backend bucket + SSL cert)**
```hcl
# Storage bucket for assets
resource "google_storage_bucket" "full_cdn_assets" {
  name          = "${var.project_id}-full-cdn-assets"
  location      = "US"
  force_destroy = false
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "full_cdn_public" {
  bucket = google_storage_bucket.full_cdn_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Backend bucket with CDN
resource "google_compute_backend_bucket" "full_cdn" {
  name        = "full-cdn-backend-bucket"
  bucket_name = google_storage_bucket.full_cdn_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    client_ttl        = 7200
    max_ttl           = 86400
    negative_caching  = true
    serve_while_stale = 86400
    request_coalescing = true

    cache_key_policy {
      include_host     = true
      include_protocol = true
    }
  }

  custom_response_headers = [
    "X-Frame-Options: SAMEORIGIN",
    "X-Content-Type-Options: nosniff",
    "Cache-Control: public, max-age=3600"
  ]
}

# SSL certificate
resource "google_compute_managed_ssl_certificate" "full_cdn_cert" {
  name = "full-cdn-cert"
  managed {
    domains = ["cdn.example.com"]
  }
}

# URL map
resource "google_compute_url_map" "full_cdn_map" {
  name            = "full-cdn-url-map"
  default_service = google_compute_backend_bucket.full_cdn.id
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "full_cdn_proxy" {
  name             = "full-cdn-proxy"
  url_map          = google_compute_url_map.full_cdn_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.full_cdn_cert.id]
}

# Global IP
resource "google_compute_global_address" "full_cdn_ip" {
  name = "full-cdn-ip"
}

# Forwarding rule
resource "google_compute_global_forwarding_rule" "full_cdn_https" {
  name                  = "full-cdn-https-rule"
  ip_address            = google_compute_global_address.full_cdn_ip.address
  port_range            = "443"
  target                = google_compute_target_https_proxy.full_cdn_proxy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

output "cdn_url" {
  value = "https://cdn.example.com"
}

output "cdn_ip" {
  value = google_compute_global_address.full_cdn_ip.address
}
```

**27. CDN with Cloud Armor WAF integration**
```hcl
resource "google_compute_security_policy" "cdn_armor" {
  name = "cdn-armor-policy"

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
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
        count        = 1000
        interval_sec = 60
      }
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
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

resource "google_compute_backend_service" "cdn_armor_backend" {
  name                  = "cdn-armor-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn      = true
  security_policy = google_compute_security_policy.cdn_armor.id

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**28. Multi-origin CDN with URL map**
```hcl
# API backend (no CDN, dynamic)
resource "google_compute_backend_service" "multi_api" {
  name                  = "multi-api-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = false

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.api_mig.instance_group
  }
}

# Static web app backend (CDN)
resource "google_compute_backend_service" "multi_web" {
  name                  = "multi-web-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.web_mig.instance_group
  }
}

# GCS assets backend (CDN)
resource "google_compute_backend_bucket" "multi_assets" {
  name        = "multi-assets-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 86400
    max_ttl     = 604800
  }
}

# Multi-origin URL map
resource "google_compute_url_map" "multi_origin" {
  name            = "multi-origin-cdn-map"
  default_service = google_compute_backend_service.multi_web.id

  host_rule {
    hosts        = ["example.com", "www.example.com"]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.multi_web.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.multi_api.id
    }

    path_rule {
      paths   = ["/assets/*", "/images/*", "/fonts/*"]
      service = google_compute_backend_bucket.multi_assets.id
    }
  }
}
```

**29. CDN cache invalidation via null_resource local-exec**
```hcl
resource "null_resource" "cdn_invalidation" {
  triggers = {
    deployment_version = var.app_version
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud compute url-maps invalidate-cdn-cache ${google_compute_url_map.cdn_map.name} \
        --path "/*" \
        --project ${var.project_id} \
        --async
    EOT
  }

  depends_on = [
    google_compute_backend_service.cdn_enabled,
    google_compute_backend_bucket.cdn_bucket
  ]
}
```

**30. CDN invalidation for specific paths after deployment**
```bash
# Invalidate specific CDN paths after Terraform deployment
gcloud compute url-maps invalidate-cdn-cache app-url-map \
  --path "/static/*" \
  --project ${PROJECT_ID}

# Invalidate backend bucket CDN cache
gcloud compute backend-buckets invalidate-cdn-cache static-assets-cdn \
  --path "/*.js" \
  --project ${PROJECT_ID}

gcloud compute backend-buckets invalidate-cdn-cache static-assets-cdn \
  --path "/*.css" \
  --project ${PROJECT_ID}
```

**31. CDN with object versioning on GCS**
```hcl
resource "google_storage_bucket" "versioned_assets" {
  name          = "${var.project_id}-versioned-assets"
  location      = "US"
  force_destroy = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 3
    }
  }

  uniform_bucket_level_access = true
}

resource "google_compute_backend_bucket" "versioned_cdn" {
  name        = "versioned-cdn-bucket"
  bucket_name = google_storage_bucket.versioned_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 86400
    max_ttl     = 604800
    cache_key_policy {
      include_host              = true
      include_protocol          = true
      include_query_string      = false
    }
  }
}
```

**32. CDN hit/miss logging to Cloud Logging**
```hcl
resource "google_compute_backend_service" "cdn_with_logging" {
  name                  = "cdn-logging-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  custom_response_headers = [
    "X-Cache-Status: {cdn_cache_status}",
    "X-Cache-Hit: {cdn_cache_id}"
  ]

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

---

## Advanced

**33. CDN with Google-managed certificate and certificate map**
```hcl
resource "google_certificate_manager_certificate" "cdn_cert" {
  name        = "cdn-cert"
  description = "CDN managed certificate"

  managed {
    domains = ["assets.example.com", "cdn.example.com"]
  }
}

resource "google_certificate_manager_certificate_map" "cdn_map" {
  name = "cdn-cert-map"
}

resource "google_certificate_manager_certificate_map_entry" "cdn_entry" {
  name         = "cdn-cert-entry"
  map          = google_certificate_manager_certificate_map.cdn_map.name
  certificates = [google_certificate_manager_certificate.cdn_cert.id]
  hostname     = "assets.example.com"
}

resource "google_compute_target_https_proxy" "cdn_cert_map_proxy" {
  name            = "cdn-cert-map-proxy"
  url_map         = google_compute_url_map.cdn_map.id
  certificate_map = "//certificatemanager.googleapis.com/${google_certificate_manager_certificate_map.cdn_map.id}"
}
```

**34. CDN logs exported to BigQuery**
```hcl
resource "google_bigquery_dataset" "cdn_logs" {
  dataset_id    = "cdn_access_logs"
  friendly_name = "CDN Access Logs"
  location      = "US"

  default_table_expiration_ms = 2592000000 # 30 days

  labels = {
    env = "production"
  }
}

resource "google_logging_project_sink" "cdn_to_bq" {
  name        = "cdn-logs-to-bigquery"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.cdn_logs.dataset_id}"

  filter = "resource.type=\"http_load_balancer\" AND httpRequest.requestUrl=~\".*\""

  bigquery_options {
    use_partitioned_tables = true
  }

  unique_writer_identity = true
}

resource "google_bigquery_dataset_iam_member" "sink_bq_writer" {
  dataset_id = google_bigquery_dataset.cdn_logs.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_project_sink.cdn_to_bq.writer_identity
}
```

**35. CDN performance monitoring with Cloud Monitoring**
```hcl
resource "google_monitoring_alert_policy" "cdn_cache_hit_rate" {
  display_name = "CDN Cache Hit Rate Low"
  combiner     = "OR"

  conditions {
    display_name = "Cache hit ratio below 80%"

    condition_threshold {
      filter = "resource.type=\"https_lb_rule\" AND metric.type=\"loadbalancing.googleapis.com/https/backend_request_count\""

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }

      comparison      = "COMPARISON_LT"
      threshold_value = 0.8
      duration        = "600s"
    }
  }

  notification_channels = [var.notification_channel_id]

  alert_strategy {
    auto_close = "1800s"
  }
}

resource "google_monitoring_dashboard" "cdn_dashboard" {
  dashboard_json = jsonencode({
    displayName = "CDN Performance"
    gridLayout = {
      columns = 2
      widgets = [
        {
          title = "Cache Hit Rate"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"loadbalancing.googleapis.com/https/backend_request_bytes_count\" AND resource.type=\"https_lb_rule\""
                }
              }
            }]
          }
        }
      ]
    }
  })
}
```

**36. Signed URL generation with HMAC key**
```hcl
resource "google_storage_hmac_key" "cdn_hmac" {
  service_account_email = google_service_account.cdn_sa.email
}

resource "google_service_account" "cdn_sa" {
  account_id   = "cdn-signing-sa"
  display_name = "CDN URL Signing Service Account"
}

output "cdn_hmac_access_id" {
  value     = google_storage_hmac_key.cdn_hmac.access_id
  sensitive = false
}

output "cdn_hmac_secret" {
  value     = google_storage_hmac_key.cdn_hmac.secret
  sensitive = true
}
```

**37. CDN origin failover configuration**
```hcl
resource "google_compute_backend_service" "cdn_failover" {
  name                  = "cdn-failover-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    serve_while_stale = 86400
    negative_caching  = true
    negative_caching_policy {
      code = 503
      ttl  = 10
    }
  }

  health_checks = [google_compute_health_check.http_check.id]

  # Primary origin
  backend {
    group           = google_compute_region_instance_group_manager.primary_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
    description     = "Primary origin"
  }

  # Failover origin
  backend {
    group           = google_compute_region_instance_group_manager.failover_mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 0.0
    description     = "Failover origin"
  }
}
```

**38. CDN with CORS headers configuration**
```hcl
resource "google_compute_backend_bucket" "cors_cdn" {
  name        = "cors-cdn-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  custom_response_headers = [
    "Access-Control-Allow-Origin: https://app.example.com",
    "Access-Control-Allow-Methods: GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers: Content-Type, Accept",
    "Access-Control-Max-Age: 3600",
    "Timing-Allow-Origin: *"
  ]
}
```

**39. CDN with preload and performance hints**
```hcl
resource "google_compute_backend_service" "performance_cdn" {
  name                  = "performance-cdn-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode         = "CACHE_ALL_STATIC"
    default_ttl        = 3600
    max_ttl            = 86400
    request_coalescing = true
    serve_while_stale  = 86400
  }

  custom_response_headers = [
    "Link: </fonts/main.woff2>; rel=preload; as=font; crossorigin",
    "Link: </css/critical.css>; rel=preload; as=style",
    "Cache-Control: public, max-age=3600, stale-while-revalidate=86400",
    "X-Cache-Status: {cdn_cache_status}"
  ]

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**40. CDN with Terraform remote state reference**
```hcl
data "terraform_remote_state" "networking" {
  backend = "gcs"
  config = {
    bucket = "${var.project_id}-tfstate"
    prefix = "networking"
  }
}

resource "google_compute_backend_service" "cdn_from_state" {
  name                  = "cdn-from-state-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = data.terraform_remote_state.networking.outputs.mig_instance_group
  }
}
```

**41. CDN with variable TTL based on content type**
```hcl
resource "google_compute_url_map" "ttl_routing" {
  name            = "ttl-routing-map"
  default_service = google_compute_backend_service.cdn_enabled.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "ttl-matcher"
  }

  path_matcher {
    name            = "ttl-matcher"
    default_service = google_compute_backend_service.cdn_enabled.id

    path_rule {
      # Immutable versioned assets (1 year)
      paths   = ["/assets/v*/"]
      service = google_compute_backend_bucket.immutable_bucket.id
    }

    path_rule {
      # Frequently updated JS/CSS (1 hour)
      paths   = ["/*.js", "/*.css"]
      service = google_compute_backend_bucket.hourly_bucket.id
    }

    path_rule {
      # HTML pages (5 minutes)
      paths   = ["/*.html", "/"]
      service = google_compute_backend_service.html_backend.id
    }
  }
}

resource "google_compute_backend_bucket" "immutable_bucket" {
  name        = "immutable-assets-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true
  cdn_policy {
    cache_mode  = "FORCE_CACHE_ALL"
    default_ttl = 31536000
    max_ttl     = 31536000
  }
}

resource "google_compute_backend_bucket" "hourly_bucket" {
  name        = "hourly-assets-bucket"
  bucket_name = google_storage_bucket.static_assets.name
  enable_cdn  = true
  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 7200
  }
}
```

**42. CDN compression settings**
```hcl
resource "google_compute_backend_service" "compressed_cdn" {
  name                  = "compressed-cdn-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  # Request Cloud CDN to compress eligible responses
  custom_response_headers = [
    "Vary: Accept-Encoding",
    "X-Content-Type-Options: nosniff"
  ]

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**43. CDN with Pub/Sub invalidation trigger**
```hcl
resource "google_pubsub_topic" "cache_invalidation" {
  name = "cdn-cache-invalidation"
}

resource "google_cloudfunctions2_function" "cache_invalidator" {
  name     = "cdn-cache-invalidator"
  location = "us-central1"

  build_config {
    runtime     = "nodejs20"
    entry_point = "invalidateCache"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = "cdn-invalidator.zip"
      }
    }
  }

  service_config {
    available_memory      = "256M"
    service_account_email = google_service_account.function_sa.email
    environment_variables = {
      URL_MAP_NAME = google_compute_url_map.cdn_map.name
      PROJECT_ID   = var.project_id
    }
  }

  event_trigger {
    trigger_region = "us-central1"
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.cache_invalidation.id
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
  }
}

resource "google_project_iam_member" "function_compute_admin" {
  project = var.project_id
  role    = "roles/compute.networkAdmin"
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}
```

**44. CDN + GCS lifecycle for cost optimization**
```hcl
resource "google_storage_bucket" "tiered_cdn_assets" {
  name          = "${var.project_id}-tiered-cdn"
  location      = "US"
  force_destroy = false
  storage_class = "STANDARD"

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }

  uniform_bucket_level_access = true
}

resource "google_compute_backend_bucket" "tiered_cdn" {
  name        = "tiered-cdn-bucket"
  bucket_name = google_storage_bucket.tiered_cdn_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 86400
    max_ttl           = 604800
    serve_while_stale = 2592000
  }
}
```

**45. CDN edge security headers**
```hcl
resource "google_compute_backend_service" "security_headers_cdn" {
  name                  = "security-headers-cdn"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  enable_cdn = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
  }

  custom_response_headers = [
    "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options: SAMEORIGIN",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy: geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'"
  ]

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}
```

**46. Multi-region CDN backend service with geolocation**
```hcl
resource "google_compute_backend_service" "geo_cdn" {
  name                  = "geo-cdn-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
    cache_key_policy {
      include_host     = true
      include_protocol = true
    }
  }

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
}
```

**47. CDN monitoring alert for high cache miss rate**
```hcl
resource "google_monitoring_alert_policy" "cdn_miss_rate" {
  display_name = "CDN High Cache Miss Rate"
  combiner     = "OR"

  conditions {
    display_name = "Cache miss rate > 50% for 10 minutes"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type=\"https_lb_rule\"",
        "metric.type=\"loadbalancing.googleapis.com/https/backend_request_count\"",
        "metric.labels.cache_result=\"MISS\""
      ])

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }

      comparison      = "COMPARISON_GT"
      threshold_value = 100
      duration        = "600s"
    }
  }

  notification_channels = [var.notification_channel_id]
}
```

**48. CDN with path-level cache control**
```hcl
resource "google_compute_url_map" "granular_cdn" {
  name            = "granular-cdn-map"
  default_service = google_compute_backend_service.cdn_enabled.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "granular"
  }

  path_matcher {
    name            = "granular"
    default_service = google_compute_backend_service.cdn_enabled.id

    route_rules {
      priority = 1
      match_rules {
        prefix_match = "/api/"
      }
      route_action {
        weighted_backend_services {
          backend_service = google_compute_backend_service.api_backend.id
          weight          = 100
          header_action {
            response_headers_to_add {
              header_name  = "Cache-Control"
              header_value = "no-store, no-cache"
              replace      = true
            }
          }
        }
      }
    }

    route_rules {
      priority = 2
      match_rules {
        prefix_match = "/static/"
      }
      route_action {
        weighted_backend_services {
          backend_service = google_compute_backend_service.cdn_enabled.id
          weight          = 100
          header_action {
            response_headers_to_add {
              header_name  = "Cache-Control"
              header_value = "public, max-age=86400, immutable"
              replace      = true
            }
          }
        }
      }
    }
  }
}
```

**49. Cloud CDN with Terraform data source for existing bucket**
```hcl
data "google_storage_bucket" "existing_assets" {
  name = "${var.project_id}-existing-assets"
}

resource "google_compute_backend_bucket" "existing_cdn" {
  name        = "existing-cdn-backend"
  bucket_name = data.google_storage_bucket.existing_assets.name
  enable_cdn  = true

  cdn_policy {
    cache_mode  = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
    cache_key_policy {
      include_host              = true
      include_protocol          = true
      include_query_string      = false
    }
  }
}
```

**50. Complete CDN + Cloud Armor + BigQuery logging + Monitoring**
```hcl
# GCS bucket for CDN origin
resource "google_storage_bucket" "complete_cdn_origin" {
  name          = "${var.project_id}-complete-cdn"
  location      = "US"
  force_destroy = false
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "complete_public" {
  bucket = google_storage_bucket.complete_cdn_origin.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Cloud Armor
resource "google_compute_security_policy" "complete_armor" {
  name = "complete-cdn-armor"

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

# Backend with CDN + Cloud Armor
resource "google_compute_backend_service" "complete_cdn" {
  name                  = "complete-cdn-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  security_policy       = google_compute_security_policy.complete_armor.id
  enable_cdn            = true

  cdn_policy {
    cache_mode         = "CACHE_ALL_STATIC"
    default_ttl        = 3600
    max_ttl            = 86400
    request_coalescing = true
    negative_caching   = true
  }

  custom_response_headers = [
    "X-Cache-Status: {cdn_cache_status}",
    "Strict-Transport-Security: max-age=31536000; includeSubDomains"
  ]

  log_config {
    enable      = true
    sample_rate = 1.0
  }

  health_checks = [google_compute_health_check.http_check.id]

  backend {
    group = google_compute_region_instance_group_manager.mig.instance_group
  }
}

# BigQuery log sink
resource "google_bigquery_dataset" "complete_cdn_logs" {
  dataset_id = "cdn_logs_complete"
  location   = "US"
}

resource "google_logging_project_sink" "complete_cdn_logs" {
  name        = "complete-cdn-logs"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.complete_cdn_logs.dataset_id}"
  filter      = "resource.type=\"https_lb_rule\""
  bigquery_options {
    use_partitioned_tables = true
  }
  unique_writer_identity = true
}

resource "google_bigquery_dataset_iam_member" "cdn_sink_writer" {
  dataset_id = google_bigquery_dataset.complete_cdn_logs.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_project_sink.complete_cdn_logs.writer_identity
}

output "complete_cdn_backend_id" {
  value = google_compute_backend_service.complete_cdn.id
}
```
