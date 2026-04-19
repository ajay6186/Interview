# Examples 3.1 — Dynamic Blocks (50 examples)

---

## Basic

### 1. Dynamic Block: Ingress Rules on google_compute_firewall
```hcl
variable "ingress_ports" {
  type    = list(number)
  default = [80, 443, 8080]
}

resource "google_compute_firewall" "web" {
  name    = "allow-web-ingress"
  network = "projects/my-prod-project/global/networks/default"
  project = "my-prod-project"

  dynamic "allow" {
    for_each = var.ingress_ports
    content {
      protocol = "tcp"
      ports    = [tostring(allow.value)]
    }
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}
```

### 2. Dynamic Block: Egress Rules on google_compute_firewall
```hcl
variable "egress_ports" {
  type    = list(number)
  default = [443, 5432, 6379]
}

resource "google_compute_firewall" "egress" {
  name      = "allow-app-egress"
  network   = "projects/my-prod-project/global/networks/vpc-main"
  project   = "my-prod-project"
  direction = "EGRESS"

  dynamic "allow" {
    for_each = var.egress_ports
    content {
      protocol = "tcp"
      ports    = [tostring(allow.value)]
    }
  }

  destination_ranges = ["10.0.0.0/8"]
}
```

### 3. Dynamic Block with for_each on a Map
```hcl
variable "firewall_rules" {
  type = map(object({
    protocol = string
    ports    = list(string)
  }))
  default = {
    http  = { protocol = "tcp", ports = ["80"] }
    https = { protocol = "tcp", ports = ["443"] }
    ssh   = { protocol = "tcp", ports = ["22"] }
  }
}

resource "google_compute_firewall" "multi_rule" {
  name    = "multi-protocol-allow"
  network = "projects/my-prod-project/global/networks/vpc-main"
  project = "my-prod-project"

  dynamic "allow" {
    for_each = var.firewall_rules
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  source_ranges = ["10.0.0.0/8"]
}
```

### 4. Dynamic Block with content Block and Labels
```hcl
variable "deny_rules" {
  type = list(object({
    protocol = string
    ports    = list(string)
  }))
  default = [
    { protocol = "tcp", ports = ["23"] },
    { protocol = "tcp", ports = ["21"] },
  ]
}

resource "google_compute_firewall" "deny_insecure" {
  name    = "deny-insecure-protocols"
  network = "projects/my-prod-project/global/networks/vpc-main"
  project = "my-prod-project"

  dynamic "deny" {
    for_each = var.deny_rules
    content {
      protocol = deny.value.protocol
      ports    = deny.value.ports
    }
  }

  source_ranges = ["0.0.0.0/0"]
  priority      = 1000
}
```

### 5. Dynamic Block with if Condition Using lookup
```hcl
variable "optional_ports" {
  type = map(object({
    protocol = string
    ports    = list(string)
    enabled  = bool
  }))
  default = {
    http    = { protocol = "tcp", ports = ["80"],   enabled = true  }
    ftp     = { protocol = "tcp", ports = ["21"],   enabled = false }
    metrics = { protocol = "tcp", ports = ["9090"], enabled = true  }
  }
}

resource "google_compute_firewall" "conditional_ports" {
  name    = "conditional-ports-firewall"
  network = "projects/my-prod-project/global/networks/vpc-main"
  project = "my-prod-project"

  dynamic "allow" {
    for_each = { for k, v in var.optional_ports : k => v if v.enabled }
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  source_ranges = ["10.128.0.0/9"]
}
```

### 6. Dynamic Block with coalesce for Default Values
```hcl
variable "service_rules" {
  type = list(object({
    protocol = string
    ports    = optional(list(string))
  }))
  default = [
    { protocol = "tcp", ports = ["8080"] },
    { protocol = "icmp", ports = null },
  ]
}

resource "google_compute_firewall" "services" {
  name    = "service-firewall"
  network = "projects/my-prod-project/global/networks/vpc-main"
  project = "my-prod-project"

  dynamic "allow" {
    for_each = var.service_rules
    content {
      protocol = allow.value.protocol
      ports    = coalesce(allow.value.ports, [])
    }
  }

  source_ranges = ["10.0.0.0/8"]
}
```

### 7. Dynamic Block: Iterator Override
```hcl
variable "inbound_rules" {
  type = list(object({
    protocol = string
    ports    = list(string)
  }))
  default = [
    { protocol = "tcp", ports = ["80", "443"] },
    { protocol = "udp", ports = ["53"] },
  ]
}

resource "google_compute_firewall" "iterator_example" {
  name    = "iterator-override-firewall"
  network = "projects/my-prod-project/global/networks/vpc-main"
  project = "my-prod-project"

  dynamic "allow" {
    for_each = var.inbound_rules
    iterator = rule
    content {
      protocol = rule.value.protocol
      ports    = rule.value.ports
    }
  }

  source_ranges = ["0.0.0.0/0"]
}
```

### 8. Dynamic Block on google_compute_instance network_interface
```hcl
variable "network_interfaces" {
  type = list(object({
    network    = string
    subnetwork = string
    nat_ip     = optional(string)
  }))
  default = [
    {
      network    = "projects/my-prod-project/global/networks/vpc-main"
      subnetwork = "projects/my-prod-project/regions/us-central1/subnetworks/subnet-app"
      nat_ip     = null
    }
  ]
}

resource "google_compute_instance" "app_server" {
  name         = "app-server-01"
  machine_type = "n2-standard-4"
  zone         = "us-central1-a"
  project      = "my-prod-project"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size  = 50
    }
  }

  dynamic "network_interface" {
    for_each = var.network_interfaces
    content {
      network    = network_interface.value.network
      subnetwork = network_interface.value.subnetwork

      dynamic "access_config" {
        for_each = network_interface.value.nat_ip != null ? [network_interface.value.nat_ip] : []
        content {
          nat_ip = access_config.value
        }
      }
    }
  }
}
```

### 9. Dynamic Block for google_storage_bucket lifecycle_rule
```hcl
variable "lifecycle_rules" {
  type = list(object({
    action_type          = string
    storage_class        = optional(string)
    age                  = optional(number)
    num_newer_versions   = optional(number)
  }))
  default = [
    { action_type = "SetStorageClass", storage_class = "NEARLINE",  age = 30  },
    { action_type = "SetStorageClass", storage_class = "COLDLINE",  age = 90  },
    { action_type = "Delete",          storage_class = null,        age = 365 },
  ]
}

resource "google_storage_bucket" "data_archive" {
  name                        = "my-prod-project-data-archive"
  location                    = "US"
  project                     = "my-prod-project"
  uniform_bucket_level_access = true

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_rules
    content {
      action {
        type          = lifecycle_rule.value.action_type
        storage_class = lifecycle_rule.value.storage_class
      }
      condition {
        age = lifecycle_rule.value.age
      }
    }
  }
}
```

### 10. Dynamic Block for google_compute_backend_service backend
```hcl
variable "backend_groups" {
  type = list(object({
    group                 = string
    balancing_mode        = string
    capacity_scaler       = number
    max_utilization       = optional(number)
  }))
}

resource "google_compute_backend_service" "api" {
  name                  = "api-backend-service"
  project               = "my-prod-project"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30

  dynamic "backend" {
    for_each = var.backend_groups
    content {
      group           = backend.value.group
      balancing_mode  = backend.value.balancing_mode
      capacity_scaler = backend.value.capacity_scaler
      max_utilization = backend.value.balancing_mode == "UTILIZATION" ? backend.value.max_utilization : null
    }
  }

  health_checks = [google_compute_health_check.api.id]
}

resource "google_compute_health_check" "api" {
  name    = "api-health-check"
  project = "my-prod-project"
  http_health_check {
    port         = 8080
    request_path = "/health"
  }
}
```

### 11. Dynamic Block for IAM Binding Conditions
```hcl
variable "iam_bindings" {
  type = list(object({
    role    = string
    members = list(string)
    condition = optional(object({
      title       = string
      description = string
      expression  = string
    }))
  }))
}

resource "google_project_iam_binding" "conditional" {
  for_each = { for idx, b in var.iam_bindings : b.role => b }

  project = "my-prod-project"
  role    = each.value.role
  members = each.value.members

  dynamic "condition" {
    for_each = each.value.condition != null ? [each.value.condition] : []
    content {
      title       = condition.value.title
      description = condition.value.description
      expression  = condition.value.expression
    }
  }
}
```

### 12. Dynamic Block with Complex Objects
```hcl
variable "alert_conditions" {
  type = list(object({
    display_name = string
    filter       = string
    duration     = string
    comparison   = string
    threshold    = number
    aggregation = object({
      alignment_period   = string
      per_series_aligner = string
    })
  }))
}

resource "google_monitoring_alert_policy" "complex" {
  display_name = "Complex Alert Policy"
  project      = "my-prod-project"
  combiner     = "OR"

  dynamic "conditions" {
    for_each = var.alert_conditions
    content {
      display_name = conditions.value.display_name
      condition_threshold {
        filter          = conditions.value.filter
        duration        = conditions.value.duration
        comparison      = conditions.value.comparison
        threshold_value = conditions.value.threshold
        aggregations {
          alignment_period   = conditions.value.aggregation.alignment_period
          per_series_aligner = conditions.value.aggregation.per_series_aligner
        }
      }
    }
  }

  notification_channels = []
}
```

---

## Intermediate

### 13. Nested Dynamic Blocks: Firewall with Nested access_config
```hcl
variable "instances" {
  type = list(object({
    name    = string
    zone    = string
    subnets = list(object({
      subnetwork  = string
      external_ip = bool
    }))
  }))
}

resource "google_compute_instance" "multi_nic" {
  for_each     = { for i in var.instances : i.name => i }
  name         = each.value.name
  machine_type = "n2-standard-2"
  zone         = each.value.zone
  project      = "my-prod-project"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  dynamic "network_interface" {
    for_each = each.value.subnets
    iterator = nic
    content {
      subnetwork = nic.value.subnetwork

      dynamic "access_config" {
        for_each = nic.value.external_ip ? [1] : []
        content {}
      }
    }
  }
}
```

### 14. Dynamic Block for GKE Node Pools
```hcl
variable "node_pools" {
  type = list(object({
    name         = string
    machine_type = string
    min_count    = number
    max_count    = number
    disk_size_gb = number
    preemptible  = bool
    labels       = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
}

resource "google_container_cluster" "gke" {
  name     = "prod-gke-cluster"
  project  = "my-prod-project"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = "projects/my-prod-project/global/networks/vpc-main"
  subnetwork = "projects/my-prod-project/regions/us-central1/subnetworks/subnet-gke"
}

resource "google_container_node_pool" "pools" {
  for_each = { for np in var.node_pools : np.name => np }

  name       = each.value.name
  cluster    = google_container_cluster.gke.id
  project    = "my-prod-project"
  location   = "us-central1"

  autoscaling {
    min_node_count = each.value.min_count
    max_node_count = each.value.max_count
  }

  node_config {
    machine_type = each.value.machine_type
    disk_size_gb = each.value.disk_size_gb
    preemptible  = each.value.preemptible
    labels       = each.value.labels

    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```

### 15. Dynamic Block for Cloud SQL Settings
```hcl
variable "database_flags" {
  type = list(object({
    name  = string
    value = string
  }))
  default = [
    { name = "max_connections",    value = "200" },
    { name = "log_min_duration_statement", value = "1000" },
    { name = "log_checkpoints",    value = "on" },
  ]
}

variable "ip_config" {
  type = object({
    ipv4_enabled    = bool
    private_network = string
    require_ssl     = bool
    authorized_networks = list(object({
      name  = string
      value = string
    }))
  })
}

resource "google_sql_database_instance" "postgres" {
  name             = "prod-postgres-01"
  project          = "my-prod-project"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-custom-4-15360"
    availability_type = "REGIONAL"
    disk_size         = 100
    disk_type         = "PD_SSD"

    dynamic "database_flags" {
      for_each = var.database_flags
      content {
        name  = database_flags.value.name
        value = database_flags.value.value
      }
    }

    ip_configuration {
      ipv4_enabled    = var.ip_config.ipv4_enabled
      private_network = var.ip_config.private_network
      require_ssl     = var.ip_config.require_ssl

      dynamic "authorized_networks" {
        for_each = var.ip_config.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.value
        }
      }
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
    }
  }

  deletion_protection = true
}
```

### 16. Dynamic Block for GKE addons_config
```hcl
variable "gke_addons" {
  type = object({
    http_load_balancing        = bool
    horizontal_pod_autoscaling = bool
    network_policy             = bool
    dns_cache                  = bool
    gce_persistent_disk_csi   = bool
  })
  default = {
    http_load_balancing        = true
    horizontal_pod_autoscaling = true
    network_policy             = true
    dns_cache                  = true
    gce_persistent_disk_csi   = true
  }
}

resource "google_container_cluster" "with_addons" {
  name     = "prod-cluster-addons"
  project  = "my-prod-project"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  addons_config {
    http_load_balancing {
      disabled = !var.gke_addons.http_load_balancing
    }
    horizontal_pod_autoscaling {
      disabled = !var.gke_addons.horizontal_pod_autoscaling
    }
    network_policy_config {
      disabled = !var.gke_addons.network_policy
    }
    dns_cache_config {
      enabled = var.gke_addons.dns_cache
    }
    gce_persistent_disk_csi_driver_config {
      enabled = var.gke_addons.gce_persistent_disk_csi
    }
  }
}
```

### 17. Dynamic Block for Cloud Armor Security Policy Rules
```hcl
variable "armor_rules" {
  type = list(object({
    priority    = number
    action      = string
    description = string
    src_ip_ranges = list(string)
  }))
  default = [
    { priority = 1000, action = "allow",  description = "Allow corporate IPs",  src_ip_ranges = ["203.0.113.0/24"] },
    { priority = 2000, action = "deny(403)", description = "Block bad actors", src_ip_ranges = ["198.51.100.0/24"] },
    { priority = 2147483647, action = "allow", description = "Default allow",  src_ip_ranges = ["*"] },
  ]
}

resource "google_compute_security_policy" "waf" {
  name    = "prod-waf-policy"
  project = "my-prod-project"

  dynamic "rule" {
    for_each = var.armor_rules
    content {
      priority    = rule.value.priority
      action      = rule.value.action
      description = rule.value.description

      match {
        versioned_expr = "SRC_IPS_V1"
        config {
          src_ip_ranges = rule.value.src_ip_ranges
        }
      }
    }
  }
}
```

### 18. Dynamic Block for Load Balancer URL Map Path Rules
```hcl
variable "path_rules" {
  type = list(object({
    paths   = list(string)
    service = string
  }))
  default = [
    { paths = ["/api/*"],    service = "api-backend" },
    { paths = ["/static/*"], service = "cdn-backend" },
    { paths = ["/admin/*"],  service = "admin-backend" },
  ]
}

resource "google_compute_url_map" "main" {
  name            = "prod-url-map"
  project         = "my-prod-project"
  default_service = google_compute_backend_service.default.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "main-matcher"
  }

  path_matcher {
    name            = "main-matcher"
    default_service = google_compute_backend_service.default.id

    dynamic "path_rule" {
      for_each = var.path_rules
      content {
        paths   = path_rule.value.paths
        service = "projects/my-prod-project/global/backendServices/${path_rule.value.service}"
      }
    }
  }
}

resource "google_compute_backend_service" "default" {
  name    = "default-backend-service"
  project = "my-prod-project"
}
```

### 19. Dynamic Block for Pub/Sub Subscription Filters
```hcl
variable "subscriptions" {
  type = list(object({
    name                       = string
    topic                      = string
    ack_deadline               = number
    filter                     = optional(string)
    enable_exactly_once        = bool
    expiration_policy_ttl      = optional(string)
    dead_letter_topic          = optional(string)
    max_delivery_attempts      = optional(number)
  }))
}

resource "google_pubsub_subscription" "subs" {
  for_each = { for s in var.subscriptions : s.name => s }

  name    = each.value.name
  topic   = each.value.topic
  project = "my-prod-project"

  ack_deadline_seconds         = each.value.ack_deadline
  filter                       = each.value.filter
  enable_exactly_once_delivery = each.value.enable_exactly_once

  dynamic "expiration_policy" {
    for_each = each.value.expiration_policy_ttl != null ? [each.value.expiration_policy_ttl] : []
    content {
      ttl = expiration_policy.value
    }
  }

  dynamic "dead_letter_policy" {
    for_each = each.value.dead_letter_topic != null ? [1] : []
    content {
      dead_letter_topic     = each.value.dead_letter_topic
      max_delivery_attempts = each.value.max_delivery_attempts
    }
  }
}
```

### 20. Dynamic Block for Cloud Run Environment Variables
```hcl
variable "env_vars" {
  type = list(object({
    name  = string
    value = optional(string)
    secret_ref = optional(object({
      name = string
      key  = string
    }))
  }))
}

resource "google_cloud_run_service" "app" {
  name     = "prod-app-service"
  location = "us-central1"
  project  = "my-prod-project"

  template {
    spec {
      containers {
        image = "us-central1-docker.pkg.dev/my-prod-project/app-repo/app:latest"

        dynamic "env" {
          for_each = [for e in var.env_vars : e if e.value != null]
          content {
            name  = env.value.name
            value = env.value.value
          }
        }

        dynamic "env" {
          for_each = [for e in var.env_vars : e if e.secret_ref != null]
          iterator = secret_env
          content {
            name = secret_env.value.name
            value_from {
              secret_key_ref {
                name = secret_env.value.secret_ref.name
                key  = secret_env.value.secret_ref.key
              }
            }
          }
        }
      }
    }
  }
}
```

### 21. Dynamic Block for Access Control List (GCS)
```hcl
variable "bucket_acl_entries" {
  type = list(object({
    role   = string
    entity = string
  }))
  default = [
    { role = "OWNER",  entity = "user-admin@my-prod-project.iam.gserviceaccount.com" },
    { role = "READER", entity = "group-data-consumers@example.com" },
  ]
}

resource "google_storage_bucket_acl" "data_acl" {
  bucket = google_storage_bucket.data.name

  dynamic "role_entity" {
    for_each = var.bucket_acl_entries
    content {
      role   = role_entity.value.role
      entity = role_entity.value.entity
    }
  }
}

resource "google_storage_bucket" "data" {
  name     = "my-prod-project-raw-data"
  location = "US"
  project  = "my-prod-project"
}
```

### 22. Dynamic Block for google_monitoring_alert_policy conditions
```hcl
variable "monitoring_conditions" {
  type = list(object({
    name            = string
    filter          = string
    duration        = string
    comparison      = string
    threshold_value = number
    aligner         = string
    period          = string
    reducer         = string
  }))
}

resource "google_monitoring_alert_policy" "infra" {
  display_name = "Infrastructure Alert Policy"
  project      = "my-prod-project"
  combiner     = "AND"

  dynamic "conditions" {
    for_each = var.monitoring_conditions
    content {
      display_name = conditions.value.name
      condition_threshold {
        filter          = conditions.value.filter
        duration        = conditions.value.duration
        comparison      = conditions.value.comparison
        threshold_value = conditions.value.threshold_value

        aggregations {
          alignment_period     = conditions.value.period
          per_series_aligner   = conditions.value.aligner
          cross_series_reducer = conditions.value.reducer
        }
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
  }

  notification_channels = [
    "projects/my-prod-project/notificationChannels/1234567890",
  ]
}
```

### 23. Dynamic Block for VPC Firewall Rules from a Map
```hcl
variable "vpc_firewall_map" {
  type = map(object({
    direction     = string
    priority      = number
    protocol      = string
    ports         = list(string)
    source_ranges = optional(list(string))
    target_tags   = optional(list(string))
    source_tags   = optional(list(string))
  }))
}

resource "google_compute_firewall" "from_map" {
  for_each = var.vpc_firewall_map

  name      = "fw-${each.key}"
  network   = "projects/my-prod-project/global/networks/vpc-main"
  project   = "my-prod-project"
  direction = each.value.direction
  priority  = each.value.priority

  dynamic "allow" {
    for_each = each.value.direction == "INGRESS" ? [1] : []
    content {
      protocol = each.value.protocol
      ports    = each.value.ports
    }
  }

  dynamic "allow" {
    for_each = each.value.direction == "EGRESS" ? [1] : []
    content {
      protocol = each.value.protocol
      ports    = each.value.ports
    }
  }

  source_ranges      = each.value.source_ranges
  target_tags        = each.value.target_tags
  source_tags        = each.value.source_tags
}
```

### 24. Dynamic Block for Cloud Run with Optional Attributes
```hcl
variable "cloud_run_services" {
  type = list(object({
    name         = string
    image        = string
    cpu          = string
    memory       = string
    min_instances = number
    max_instances = number
    concurrency   = number
    vpc_connector = optional(string)
    env_vars      = optional(map(string), {})
  }))
}

resource "google_cloud_run_service" "services" {
  for_each = { for s in var.cloud_run_services : s.name => s }

  name     = each.value.name
  location = "us-central1"
  project  = "my-prod-project"

  template {
    metadata {
      annotations = merge(
        {
          "autoscaling.knative.dev/minScale" = tostring(each.value.min_instances)
          "autoscaling.knative.dev/maxScale" = tostring(each.value.max_instances)
        },
        each.value.vpc_connector != null ? {
          "run.googleapis.com/vpc-access-connector" = each.value.vpc_connector
          "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
        } : {}
      )
    }
    spec {
      container_concurrency = each.value.concurrency
      containers {
        image = each.value.image
        resources {
          limits = {
            cpu    = each.value.cpu
            memory = each.value.memory
          }
        }
        dynamic "env" {
          for_each = each.value.env_vars
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }
}
```

### 25. Dynamic Block with Optional Attributes (Terraform 1.3+)
```hcl
variable "firewall_policies" {
  type = list(object({
    name        = string
    description = optional(string, "Managed by Terraform")
    rules = list(object({
      priority      = number
      action        = string
      direction     = string
      protocol      = string
      ports         = optional(list(string), [])
      src_ranges    = optional(list(string), [])
      dest_ranges   = optional(list(string), [])
      target_tags   = optional(list(string), [])
      disabled      = optional(bool, false)
    }))
  }))
}

resource "google_compute_network_firewall_policy" "policies" {
  for_each    = { for p in var.firewall_policies : p.name => p }
  name        = each.value.name
  description = each.value.description
  project     = "my-prod-project"
}

resource "google_compute_network_firewall_policy_rule" "rules" {
  for_each = {
    for pair in flatten([
      for policy in var.firewall_policies : [
        for rule in policy.rules : {
          key      = "${policy.name}-${rule.priority}"
          policy   = policy.name
          rule     = rule
        }
      ]
    ]) : pair.key => pair
  }

  firewall_policy = google_compute_network_firewall_policy.policies[each.value.policy].name
  project         = "my-prod-project"
  priority        = each.value.rule.priority
  action          = each.value.rule.action
  direction       = each.value.rule.direction
  disabled        = each.value.rule.disabled

  match {
    src_ip_ranges  = each.value.rule.direction == "INGRESS" ? each.value.rule.src_ranges : null
    dest_ip_ranges = each.value.rule.direction == "EGRESS"  ? each.value.rule.dest_ranges : null
    layer4_configs {
      ip_protocol = each.value.rule.protocol
      ports       = each.value.rule.ports
    }
  }
}
```

---

## Nested

### 26. Nested Dynamic Blocks: GKE Cluster with Node Pool Taints and Labels
```hcl
locals {
  node_pools = {
    general = {
      machine_type = "n2-standard-4"
      min_count    = 2
      max_count    = 10
      labels       = { role = "general", env = "prod" }
      taints       = []
    }
    gpu = {
      machine_type = "n1-standard-8"
      min_count    = 0
      max_count    = 4
      labels       = { role = "gpu", env = "prod" }
      taints       = [
        { key = "nvidia.com/gpu", value = "present", effect = "NO_SCHEDULE" }
      ]
    }
    spot = {
      machine_type = "n2-standard-2"
      min_count    = 0
      max_count    = 20
      labels       = { role = "spot", env = "prod" }
      taints       = [
        { key = "cloud.google.com/gke-spot", value = "true", effect = "NO_SCHEDULE" }
      ]
    }
  }
}

resource "google_container_node_pool" "pools" {
  for_each = local.node_pools

  name       = each.key
  cluster    = "projects/my-prod-project/locations/us-central1/clusters/prod-cluster"
  project    = "my-prod-project"
  location   = "us-central1"

  autoscaling {
    min_node_count = each.value.min_count
    max_node_count = each.value.max_count
  }

  node_config {
    machine_type = each.value.machine_type
    labels       = each.value.labels

    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}
```

### 27. Nested Dynamic Block: VPC with Subnets and Secondary Ranges
```hcl
variable "subnets" {
  type = list(object({
    name          = string
    region        = string
    cidr          = string
    private_access = bool
    secondary_ranges = list(object({
      range_name    = string
      ip_cidr_range = string
    }))
    log_config = optional(object({
      aggregation_interval = string
      flow_sampling        = number
      metadata             = string
    }))
  }))
}

resource "google_compute_subnetwork" "subnets" {
  for_each = { for s in var.subnets : s.name => s }

  name                     = each.value.name
  region                   = each.value.region
  ip_cidr_range            = each.value.cidr
  network                  = google_compute_network.vpc.id
  project                  = "my-prod-project"
  private_ip_google_access = each.value.private_access

  dynamic "secondary_ip_range" {
    for_each = each.value.secondary_ranges
    content {
      range_name    = secondary_ip_range.value.range_name
      ip_cidr_range = secondary_ip_range.value.ip_cidr_range
    }
  }

  dynamic "log_config" {
    for_each = each.value.log_config != null ? [each.value.log_config] : []
    content {
      aggregation_interval = log_config.value.aggregation_interval
      flow_sampling        = log_config.value.flow_sampling
      metadata             = log_config.value.metadata
    }
  }
}

resource "google_compute_network" "vpc" {
  name                    = "vpc-main"
  project                 = "my-prod-project"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}
```

### 28. Nested Dynamic Blocks: Cloud SQL with Users and Databases
```hcl
variable "databases" {
  type = list(object({
    name    = string
    charset = optional(string, "UTF8")
    collation = optional(string, "en_US.UTF8")
  }))
}

variable "sql_users" {
  type = list(object({
    name     = string
    password = string
    host     = optional(string, "%")
  }))
}

resource "google_sql_database_instance" "main" {
  name             = "prod-sql-main"
  project          = "my-prod-project"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier              = "db-custom-8-30720"
    availability_type = "REGIONAL"
    disk_size         = 200
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = "projects/my-prod-project/global/networks/vpc-main"
      require_ssl     = true
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }
  }
}

resource "google_sql_database" "databases" {
  for_each  = { for d in var.databases : d.name => d }
  instance  = google_sql_database_instance.main.name
  project   = "my-prod-project"
  name      = each.value.name
  charset   = each.value.charset
  collation = each.value.collation
}

resource "google_sql_user" "users" {
  for_each = { for u in var.sql_users : u.name => u }
  instance = google_sql_database_instance.main.name
  project  = "my-prod-project"
  name     = each.value.name
  password = each.value.password
  host     = each.value.host
}
```

### 29. Dynamic Block for Org Policy Constraints
```hcl
variable "org_policies" {
  type = list(object({
    constraint = string
    policy_type = string
    allowed_values  = optional(list(string))
    denied_values   = optional(list(string))
    enforce         = optional(bool)
    inherit_from_parent = optional(bool, true)
  }))
}

resource "google_project_organization_policy" "policies" {
  for_each   = { for p in var.org_policies : p.constraint => p }
  project    = "my-prod-project"
  constraint = each.value.constraint

  dynamic "list_policy" {
    for_each = each.value.policy_type == "list" ? [1] : []
    content {
      inherit_from_parent = each.value.inherit_from_parent

      dynamic "allow" {
        for_each = each.value.allowed_values != null ? [1] : []
        content {
          values = each.value.allowed_values
        }
      }

      dynamic "deny" {
        for_each = each.value.denied_values != null ? [1] : []
        content {
          values = each.value.denied_values
        }
      }
    }
  }

  dynamic "boolean_policy" {
    for_each = each.value.policy_type == "boolean" ? [1] : []
    content {
      enforced = each.value.enforce
    }
  }
}
```

### 30. Dynamic Block for Complete Firewall Module Pattern
```hcl
variable "firewall_config" {
  type = object({
    vpc_name = string
    ingress_rules = list(object({
      name          = string
      priority      = number
      source_ranges = list(string)
      target_tags   = list(string)
      protocols = list(object({
        protocol = string
        ports    = list(string)
      }))
    }))
    egress_rules = list(object({
      name               = string
      priority           = number
      destination_ranges = list(string)
      target_tags        = list(string)
      protocols = list(object({
        protocol = string
        ports    = list(string)
      }))
    }))
  })
}

resource "google_compute_firewall" "ingress" {
  for_each = { for r in var.firewall_config.ingress_rules : r.name => r }

  name      = each.value.name
  network   = "projects/my-prod-project/global/networks/${var.firewall_config.vpc_name}"
  project   = "my-prod-project"
  direction = "INGRESS"
  priority  = each.value.priority

  dynamic "allow" {
    for_each = each.value.protocols
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  source_ranges = each.value.source_ranges
  target_tags   = each.value.target_tags
}

resource "google_compute_firewall" "egress" {
  for_each = { for r in var.firewall_config.egress_rules : r.name => r }

  name      = each.value.name
  network   = "projects/my-prod-project/global/networks/${var.firewall_config.vpc_name}"
  project   = "my-prod-project"
  direction = "EGRESS"
  priority  = each.value.priority

  dynamic "allow" {
    for_each = each.value.protocols
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  destination_ranges = each.value.destination_ranges
  target_tags        = each.value.target_tags
}
```

### 31. Dynamic Block for Cloud Armor with Rate Limiting
```hcl
variable "armor_policy_config" {
  type = object({
    name = string
    rules = list(object({
      priority    = number
      action      = string
      description = string
      match_type  = string
      src_ranges  = optional(list(string))
      expression  = optional(string)
      rate_limit = optional(object({
        count        = number
        interval_sec = number
        enforce_on_key = string
        exceed_action  = string
      }))
    }))
  })
}

resource "google_compute_security_policy" "advanced" {
  name    = var.armor_policy_config.name
  project = "my-prod-project"

  dynamic "rule" {
    for_each = var.armor_policy_config.rules
    content {
      priority    = rule.value.priority
      action      = rule.value.rate_limit == null ? rule.value.action : "rate_based_ban"
      description = rule.value.description

      match {
        versioned_expr = rule.value.match_type == "ip" ? "SRC_IPS_V1" : null
        dynamic "expr" {
          for_each = rule.value.match_type == "expr" ? [rule.value.expression] : []
          content {
            expression = expr.value
          }
        }
        dynamic "config" {
          for_each = rule.value.match_type == "ip" ? [rule.value.src_ranges] : []
          content {
            src_ip_ranges = config.value
          }
        }
      }

      dynamic "rate_limit_options" {
        for_each = rule.value.rate_limit != null ? [rule.value.rate_limit] : []
        content {
          conform_action = "allow"
          exceed_action  = rate_limit_options.value.exceed_action
          enforce_on_key = rate_limit_options.value.enforce_on_key
          rate_limit_threshold {
            count        = rate_limit_options.value.count
            interval_sec = rate_limit_options.value.interval_sec
          }
        }
      }
    }
  }
}
```

### 32. Dynamic Block: GKE Workload Identity with IAM
```hcl
variable "workload_identities" {
  type = list(object({
    namespace       = string
    ksa_name        = string
    gsa_name        = string
    gsa_roles       = list(string)
  }))
}

resource "google_service_account" "gsa" {
  for_each     = { for wi in var.workload_identities : wi.gsa_name => wi }
  account_id   = each.value.gsa_name
  display_name = "GKE Workload Identity: ${each.value.gsa_name}"
  project      = "my-prod-project"
}

resource "google_service_account_iam_member" "workload_identity" {
  for_each           = { for wi in var.workload_identities : wi.gsa_name => wi }
  service_account_id = google_service_account.gsa[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:my-prod-project.svc.id.goog[${each.value.namespace}/${each.value.ksa_name}]"
}

resource "google_project_iam_member" "gsa_roles" {
  for_each = {
    for pair in flatten([
      for wi in var.workload_identities : [
        for role in wi.gsa_roles : {
          key  = "${wi.gsa_name}-${replace(role, "/", "-")}"
          gsa  = wi.gsa_name
          role = role
        }
      ]
    ]) : pair.key => pair
  }

  project = "my-prod-project"
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.gsa[each.value.gsa].email}"
}
```

### 33. Dynamic Block for Multi-Region Cloud Run Deployment
```hcl
variable "regions" {
  type    = list(string)
  default = ["us-central1", "us-east1", "europe-west1"]
}

variable "run_config" {
  type = object({
    image       = string
    cpu         = string
    memory      = string
    min_scale   = number
    max_scale   = number
    env_vars    = map(string)
    secrets     = list(object({
      env_name    = string
      secret_name = string
      version     = string
    }))
  })
}

resource "google_cloud_run_service" "regional" {
  for_each = toset(var.regions)

  name     = "prod-app-${each.value}"
  location = each.value
  project  = "my-prod-project"

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = tostring(var.run_config.min_scale)
        "autoscaling.knative.dev/maxScale" = tostring(var.run_config.max_scale)
      }
    }
    spec {
      containers {
        image = var.run_config.image
        resources {
          limits = {
            cpu    = var.run_config.cpu
            memory = var.run_config.memory
          }
        }

        dynamic "env" {
          for_each = var.run_config.env_vars
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = var.run_config.secrets
          iterator = secret_env
          content {
            name = secret_env.value.env_name
            value_from {
              secret_key_ref {
                name = secret_env.value.secret_name
                key  = secret_env.value.version
              }
            }
          }
        }
      }
    }
  }

  autogenerate_revision_name = true
}
```

### 34. Dynamic Block for GCP Load Balancer with Multiple Backends
```hcl
variable "lb_backends" {
  type = list(object({
    name            = string
    port            = number
    protocol        = string
    health_check_path = string
    instance_groups = list(string)
    cdn_enabled     = bool
    iap = optional(object({
      client_id     = string
      client_secret = string
    }))
  }))
}

resource "google_compute_backend_service" "backends" {
  for_each = { for b in var.lb_backends : b.name => b }

  name                  = each.value.name
  project               = "my-prod-project"
  protocol              = each.value.protocol
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = 30
  enable_cdn            = each.value.cdn_enabled

  dynamic "backend" {
    for_each = each.value.instance_groups
    content {
      group           = backend.value
      balancing_mode  = "UTILIZATION"
      max_utilization = 0.8
      capacity_scaler = 1.0
    }
  }

  dynamic "iap" {
    for_each = each.value.iap != null ? [each.value.iap] : []
    content {
      oauth2_client_id     = iap.value.client_id
      oauth2_client_secret = iap.value.client_secret
    }
  }

  health_checks = [
    google_compute_health_check.backends[each.key].id
  ]
}

resource "google_compute_health_check" "backends" {
  for_each = { for b in var.lb_backends : b.name => b }

  name    = "hc-${each.value.name}"
  project = "my-prod-project"

  http_health_check {
    port         = each.value.port
    request_path = each.value.health_check_path
  }
}
```

### 35. Dynamic Block for Monitoring Uptime Checks
```hcl
variable "uptime_checks" {
  type = list(object({
    display_name = string
    host         = string
    path         = string
    port         = number
    period       = string
    timeout      = string
    regions      = list(string)
    auth = optional(object({
      username = string
      password = string
    }))
    headers      = optional(map(string), {})
  }))
}

resource "google_monitoring_uptime_check_config" "checks" {
  for_each     = { for c in var.uptime_checks : c.display_name => c }
  display_name = each.value.display_name
  project      = "my-prod-project"
  period       = each.value.period
  timeout      = each.value.timeout
  selected_regions = each.value.regions

  http_check {
    path = each.value.path
    port = each.value.port
    use_ssl = each.value.port == 443

    dynamic "auth_info" {
      for_each = each.value.auth != null ? [each.value.auth] : []
      content {
        username = auth_info.value.username
        password = auth_info.value.password
      }
    }

    dynamic "headers" {
      for_each = each.value.headers
      content {
        key   = headers.key
        value = headers.value
      }
    }
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = "my-prod-project"
      host       = each.value.host
    }
  }
}
```

### 36. Dynamic Block for VPN Tunnels with BGP Sessions
```hcl
variable "vpn_config" {
  type = object({
    router_name = string
    tunnels = list(object({
      name               = string
      peer_ip            = string
      shared_secret      = string
      peer_asn           = number
      advertised_routes  = list(string)
    }))
  })
}

resource "google_compute_router" "vpn_router" {
  name    = var.vpn_config.router_name
  network = "projects/my-prod-project/global/networks/vpc-main"
  region  = "us-central1"
  project = "my-prod-project"

  bgp {
    asn               = 65000
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]
  }
}

resource "google_compute_vpn_tunnel" "tunnels" {
  for_each = { for t in var.vpn_config.tunnels : t.name => t }

  name                    = each.value.name
  region                  = "us-central1"
  project                 = "my-prod-project"
  peer_ip                 = each.value.peer_ip
  shared_secret           = each.value.shared_secret
  router                  = google_compute_router.vpn_router.id
  vpn_gateway             = google_compute_ha_vpn_gateway.gateway.id
  vpn_gateway_interface   = 0
  peer_external_gateway   = google_compute_external_vpn_gateway.peer.id
  peer_external_gateway_interface = 0
}

resource "google_compute_router_interface" "interfaces" {
  for_each   = { for t in var.vpn_config.tunnels : t.name => t }
  name       = "iface-${each.key}"
  router     = google_compute_router.vpn_router.name
  region     = "us-central1"
  project    = "my-prod-project"
  vpn_tunnel = google_compute_vpn_tunnel.tunnels[each.key].name
}

resource "google_compute_router_peer" "peers" {
  for_each        = { for t in var.vpn_config.tunnels : t.name => t }
  name            = "peer-${each.key}"
  router          = google_compute_router.vpn_router.name
  region          = "us-central1"
  project         = "my-prod-project"
  peer_ip_address = each.value.peer_ip
  peer_asn        = each.value.peer_asn
  interface       = google_compute_router_interface.interfaces[each.key].name

  dynamic "advertised_ip_ranges" {
    for_each = each.value.advertised_routes
    content {
      range = advertised_ip_ranges.value
    }
  }
}

resource "google_compute_ha_vpn_gateway" "gateway" {
  name    = "ha-vpn-gateway"
  network = "projects/my-prod-project/global/networks/vpc-main"
  region  = "us-central1"
  project = "my-prod-project"
}

resource "google_compute_external_vpn_gateway" "peer" {
  name            = "peer-vpn-gateway"
  project         = "my-prod-project"
  redundancy_type = "SINGLE_IP_INTERNALLY_REDUNDANT"
  interfaces {
    id         = 0
    ip_address = "203.0.113.1"
  }
}
```

### 37. Dynamic Block for Complete IAM Policy with Multiple Roles
```hcl
variable "iam_policy" {
  type = object({
    resource = string
    bindings = list(object({
      role    = string
      members = list(string)
      condition = optional(object({
        title      = string
        expression = string
      }))
    }))
  })
}

data "google_iam_policy" "policy" {
  dynamic "binding" {
    for_each = var.iam_policy.bindings
    content {
      role    = binding.value.role
      members = binding.value.members

      dynamic "condition" {
        for_each = binding.value.condition != null ? [binding.value.condition] : []
        content {
          title      = condition.value.title
          expression = condition.value.expression
        }
      }
    }
  }
}

resource "google_storage_bucket_iam_policy" "policy" {
  bucket      = var.iam_policy.resource
  policy_data = data.google_iam_policy.policy.policy_data
}
```

---

## Advanced

### 38. Complete Production Security Group Using Dynamic Blocks
```hcl
locals {
  env     = "prod"
  project = "my-prod-project"
  network = "projects/my-prod-project/global/networks/vpc-prod"

  security_groups = {
    web = {
      ingress = [
        { protocol = "tcp", ports = ["80", "443"], ranges = ["0.0.0.0/0"], tags = [] },
        { protocol = "tcp", ports = ["8080"],       ranges = ["10.0.0.0/8"],  tags = [] },
      ]
      egress = [
        { protocol = "tcp", ports = ["443", "5432", "6379"], ranges = ["10.0.0.0/8"], tags = [] },
      ]
    }
    db = {
      ingress = [
        { protocol = "tcp", ports = ["5432"], ranges = [], tags = ["web-server"] },
      ]
      egress = [
        { protocol = "tcp", ports = ["443"], ranges = ["0.0.0.0/0"], tags = [] },
      ]
    }
    cache = {
      ingress = [
        { protocol = "tcp", ports = ["6379"], ranges = [], tags = ["web-server"] },
      ]
      egress = []
    }
  }
}

resource "google_compute_firewall" "ingress_rules" {
  for_each = {
    for pair in flatten([
      for sg_name, sg in local.security_groups : [
        for idx, rule in sg.ingress : {
          key      = "${sg_name}-ingress-${idx}"
          sg_name  = sg_name
          rule     = rule
        }
      ]
    ]) : pair.key => pair
  }

  name      = "fw-${each.value.sg_name}-ingress-${index(local.security_groups[each.value.sg_name].ingress, each.value.rule)}"
  network   = local.network
  project   = local.project
  direction = "INGRESS"

  dynamic "allow" {
    for_each = [each.value.rule]
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  source_ranges = length(each.value.rule.ranges) > 0 ? each.value.rule.ranges : null
  source_tags   = length(each.value.rule.tags) > 0 ? each.value.rule.tags : null
  target_tags   = [each.value.sg_name]

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}
```

### 39. Dynamic Block for GKE Private Cluster with Full Config
```hcl
variable "gke_config" {
  type = object({
    name             = string
    location         = string
    release_channel  = string
    network          = string
    subnetwork       = string
    pods_range       = string
    services_range   = string
    master_cidr      = string
    authorized_networks = list(object({
      cidr_block   = string
      display_name = string
    }))
    node_pools = list(object({
      name           = string
      machine_type   = string
      min_count      = number
      max_count      = number
      disk_size_gb   = number
      disk_type      = string
      image_type     = string
      preemptible    = bool
      spot           = bool
      labels         = map(string)
      resource_labels = map(string)
      taints         = list(object({
        key    = string
        value  = string
        effect = string
      }))
      additional_oauth_scopes = list(string)
    }))
  })
}

resource "google_container_cluster" "private" {
  name     = var.gke_config.name
  location = var.gke_config.location
  project  = "my-prod-project"

  network    = var.gke_config.network
  subnetwork = var.gke_config.subnetwork

  remove_default_node_pool = true
  initial_node_count       = 1

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = var.gke_config.master_cidr
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.gke_config.pods_range
    services_secondary_range_name = var.gke_config.services_range
  }

  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.gke_config.authorized_networks
      content {
        cidr_block   = cidr_blocks.value.cidr_block
        display_name = cidr_blocks.value.display_name
      }
    }
  }

  release_channel {
    channel = var.gke_config.release_channel
  }

  workload_identity_config {
    workload_pool = "my-prod-project.svc.id.goog"
  }

  addons_config {
    http_load_balancing { disabled = false }
    horizontal_pod_autoscaling { disabled = false }
    gce_persistent_disk_csi_driver_config { enabled = true }
    dns_cache_config { enabled = true }
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus { enabled = true }
  }
}

resource "google_container_node_pool" "pools" {
  for_each = { for np in var.gke_config.node_pools : np.name => np }

  name     = each.value.name
  cluster  = google_container_cluster.private.id
  project  = "my-prod-project"
  location = var.gke_config.location

  autoscaling {
    min_node_count = each.value.min_count
    max_node_count = each.value.max_count
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type    = each.value.machine_type
    disk_size_gb    = each.value.disk_size_gb
    disk_type       = each.value.disk_type
    image_type      = each.value.image_type
    preemptible     = each.value.preemptible
    spot            = each.value.spot
    labels          = each.value.labels
    resource_labels = each.value.resource_labels

    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }

    oauth_scopes = concat(
      ["https://www.googleapis.com/auth/cloud-platform"],
      each.value.additional_oauth_scopes
    )

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

### 40. Dynamic Block for Cloud Armor with OWASP Rules
```hcl
locals {
  owasp_rules = {
    sqli = {
      priority   = 1000
      expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      action     = "deny(403)"
    }
    xss = {
      priority   = 1001
      expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      action     = "deny(403)"
    }
    lfi = {
      priority   = 1002
      expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      action     = "deny(403)"
    }
    rfi = {
      priority   = 1003
      expression = "evaluatePreconfiguredExpr('rfi-v33-stable')"
      action     = "deny(403)"
    }
    rce = {
      priority   = 1004
      expression = "evaluatePreconfiguredExpr('rce-v33-stable')"
      action     = "deny(403)"
    }
  }

  geo_block_rule = {
    priority   = 900
    expression = "origin.region_code == 'CN' || origin.region_code == 'RU'"
    action     = "deny(403)"
  }
}

resource "google_compute_security_policy" "owasp" {
  name    = "owasp-waf-policy"
  project = "my-prod-project"
  type    = "CLOUD_ARMOR"

  dynamic "rule" {
    for_each = local.owasp_rules
    content {
      priority    = rule.value.priority
      action      = rule.value.action
      description = "OWASP rule: ${rule.key}"
      match {
        expr {
          expression = rule.value.expression
        }
      }
    }
  }

  rule {
    priority    = local.geo_block_rule.priority
    action      = local.geo_block_rule.action
    description = "Geo-block high-risk regions"
    match {
      expr {
        expression = local.geo_block_rule.expression
      }
    }
  }

  rule {
    priority    = 2147483647
    action      = "allow"
    description = "Default allow"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}
```

### 41. Dynamic Block for Complete Application Stack (Cloud Run + IAM + Pub/Sub)
```hcl
variable "applications" {
  type = list(object({
    name         = string
    image        = string
    region       = string
    env_vars     = map(string)
    invokers     = list(string)
    topics       = list(string)
    subscriptions = list(object({
      name   = string
      filter = optional(string)
    }))
  }))
}

resource "google_cloud_run_service" "apps" {
  for_each = { for app in var.applications : app.name => app }

  name     = each.value.name
  location = each.value.region
  project  = "my-prod-project"

  template {
    spec {
      service_account_name = google_service_account.app_sa[each.key].email
      containers {
        image = each.value.image
        dynamic "env" {
          for_each = each.value.env_vars
          content {
            name  = env.key
            value = env.value
          }
        }
      }
    }
  }
}

resource "google_service_account" "app_sa" {
  for_each     = { for app in var.applications : app.name => app }
  account_id   = "sa-${each.value.name}"
  display_name = "SA for ${each.value.name}"
  project      = "my-prod-project"
}

resource "google_cloud_run_service_iam_member" "invokers" {
  for_each = {
    for pair in flatten([
      for app in var.applications : [
        for invoker in app.invokers : {
          key     = "${app.name}-${replace(invoker, "@", "-")}"
          app     = app.name
          region  = app.region
          invoker = invoker
        }
      ]
    ]) : pair.key => pair
  }

  service  = google_cloud_run_service.apps[each.value.app].name
  location = each.value.region
  project  = "my-prod-project"
  role     = "roles/run.invoker"
  member   = each.value.invoker
}

resource "google_pubsub_topic" "app_topics" {
  for_each = toset(flatten([for app in var.applications : [for t in app.topics : "${app.name}-${t}"]]))
  name     = each.key
  project  = "my-prod-project"
}
```

### 42. Dynamic Block for Dataflow Pipeline with Flexible Config
```hcl
variable "dataflow_jobs" {
  type = list(object({
    name              = string
    template_gcs_path = string
    temp_gcs_location = string
    region            = string
    zone              = string
    machine_type      = string
    max_workers       = number
    parameters        = map(string)
    network           = string
    subnetwork        = string
    service_account   = string
    labels            = map(string)
  }))
}

resource "google_dataflow_job" "jobs" {
  for_each              = { for j in var.dataflow_jobs : j.name => j }
  name                  = each.value.name
  project               = "my-prod-project"
  template_gcs_path     = each.value.template_gcs_path
  temp_gcs_location     = each.value.temp_gcs_location
  region                = each.value.region
  zone                  = each.value.zone
  machine_type          = each.value.machine_type
  max_workers           = each.value.max_workers
  parameters            = each.value.parameters
  network               = each.value.network
  subnetwork            = each.value.subnetwork
  service_account_email = each.value.service_account
  labels                = each.value.labels
  on_delete             = "drain"
}
```

### 43. Dynamic Block for BigQuery Dataset with Access Controls
```hcl
variable "bq_datasets" {
  type = list(object({
    dataset_id    = string
    friendly_name = string
    location      = string
    description   = string
    labels        = map(string)
    access = list(object({
      role           = string
      user_by_email  = optional(string)
      group_by_email = optional(string)
      special_group  = optional(string)
      domain         = optional(string)
      view = optional(object({
        project_id = string
        dataset_id = string
        table_id   = string
      }))
    }))
    default_table_expiration_ms = optional(number)
  }))
}

resource "google_bigquery_dataset" "datasets" {
  for_each      = { for d in var.bq_datasets : d.dataset_id => d }
  dataset_id    = each.value.dataset_id
  friendly_name = each.value.friendly_name
  location      = each.value.location
  description   = each.value.description
  project       = "my-prod-project"
  labels        = each.value.labels

  default_table_expiration_ms = each.value.default_table_expiration_ms

  dynamic "access" {
    for_each = each.value.access
    content {
      role           = access.value.view == null ? access.value.role : null
      user_by_email  = access.value.user_by_email
      group_by_email = access.value.group_by_email
      special_group  = access.value.special_group
      domain         = access.value.domain

      dynamic "view" {
        for_each = access.value.view != null ? [access.value.view] : []
        content {
          project_id = view.value.project_id
          dataset_id = view.value.dataset_id
          table_id   = view.value.table_id
        }
      }
    }
  }

  delete_contents_on_destroy = false
}
```

### 44. Dynamic Block for Multi-Environment Monitoring Dashboard
```hcl
variable "dashboard_config" {
  type = object({
    display_name = string
    widgets = list(object({
      title    = string
      type     = string
      filters  = list(string)
      metrics  = list(object({
        type        = string
        filter      = string
        aggregation = object({
          period  = string
          aligner = string
        })
      }))
    }))
  })
}

resource "google_monitoring_dashboard" "main" {
  project        = "my-prod-project"
  dashboard_json = jsonencode({
    displayName = var.dashboard_config.display_name
    gridLayout = {
      columns = 2
      widgets = [
        for widget in var.dashboard_config.widgets : {
          title = widget.title
          xyChart = widget.type == "xy" ? {
            dataSets = [
              for metric in widget.metrics : {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = metric.filter
                    aggregation = {
                      alignmentPeriod    = metric.aggregation.period
                      perSeriesAligner   = metric.aggregation.aligner
                    }
                  }
                }
              }
            ]
          } : null
        }
      ]
    }
  })
}
```

### 45. Dynamic Block for Vertex AI Workbench with Config Options
```hcl
variable "workbench_instances" {
  type = list(object({
    name        = string
    location    = string
    machine_type = string
    disk_size_gb = number
    owner        = string
    network      = string
    subnetwork   = string
    labels       = map(string)
    metadata     = map(string)
    accelerators = optional(list(object({
      type  = string
      count = number
    })), [])
  }))
}

resource "google_workbench_instance" "instances" {
  for_each = { for i in var.workbench_instances : i.name => i }

  name     = each.value.name
  location = each.value.location
  project  = "my-prod-project"
  labels   = each.value.labels

  gce_setup {
    machine_type = each.value.machine_type
    metadata     = each.value.metadata

    boot_disk {
      disk_size_gb = each.value.disk_size_gb
      disk_type    = "PD_SSD"
    }

    network_interfaces {
      network    = each.value.network
      subnet     = each.value.subnetwork
      nic_type   = "GVNIC"
    }

    dynamic "accelerators" {
      for_each = each.value.accelerators
      content {
        type       = accelerators.value.type
        core_count = accelerators.value.count
      }
    }

    service_accounts {
      email = "compute@my-prod-project.iam.gserviceaccount.com"
    }
  }
}
```

### 46. Dynamic Block for Cloud Scheduler with Pub/Sub Targets
```hcl
variable "scheduled_jobs" {
  type = list(object({
    name        = string
    schedule    = string
    timezone    = string
    description = string
    target_type = string
    http_target = optional(object({
      uri    = string
      method = string
      headers = optional(map(string), {})
      body   = optional(string)
      oidc_service_account = optional(string)
    }))
    pubsub_target = optional(object({
      topic_name = string
      data       = string
      attributes = optional(map(string), {})
    }))
  }))
}

resource "google_cloud_scheduler_job" "jobs" {
  for_each    = { for j in var.scheduled_jobs : j.name => j }
  name        = each.value.name
  project     = "my-prod-project"
  region      = "us-central1"
  schedule    = each.value.schedule
  time_zone   = each.value.timezone
  description = each.value.description

  dynamic "http_target" {
    for_each = each.value.target_type == "http" ? [each.value.http_target] : []
    content {
      uri         = http_target.value.uri
      http_method = http_target.value.method
      headers     = http_target.value.headers
      body        = http_target.value.body != null ? base64encode(http_target.value.body) : null

      dynamic "oidc_token" {
        for_each = http_target.value.oidc_service_account != null ? [http_target.value.oidc_service_account] : []
        content {
          service_account_email = oidc_token.value
        }
      }
    }
  }

  dynamic "pubsub_target" {
    for_each = each.value.target_type == "pubsub" ? [each.value.pubsub_target] : []
    content {
      topic_name = pubsub_target.value.topic_name
      data       = base64encode(pubsub_target.value.data)
      attributes = pubsub_target.value.attributes
    }
  }
}
```

### 47. Dynamic Block for Comprehensive VPC with All Features
```hcl
locals {
  vpc_config = {
    name         = "vpc-prod"
    routing_mode = "GLOBAL"
    subnets = [
      {
        name           = "subnet-app-us-central1"
        region         = "us-central1"
        cidr           = "10.10.0.0/20"
        private_access = true
        secondary_ranges = [
          { range_name = "pods",     ip_cidr_range = "10.100.0.0/16" },
          { range_name = "services", ip_cidr_range = "10.101.0.0/20" },
        ]
        log_config = { aggregation_interval = "INTERVAL_10_MIN", flow_sampling = 0.5, metadata = "INCLUDE_ALL_METADATA" }
      },
      {
        name           = "subnet-app-us-east1"
        region         = "us-east1"
        cidr           = "10.20.0.0/20"
        private_access = true
        secondary_ranges = []
        log_config = null
      },
    ]
    peerings = [
      { name = "peer-to-shared-vpc", network = "projects/shared-vpc-project/global/networks/vpc-shared", export_routes = true, import_routes = false }
    ]
    nat_regions = ["us-central1", "us-east1"]
  }
}

resource "google_compute_network" "vpc" {
  name                    = local.vpc_config.name
  project                 = "my-prod-project"
  auto_create_subnetworks = false
  routing_mode            = local.vpc_config.routing_mode
}

resource "google_compute_subnetwork" "subnets" {
  for_each = { for s in local.vpc_config.subnets : s.name => s }

  name                     = each.value.name
  region                   = each.value.region
  ip_cidr_range            = each.value.cidr
  network                  = google_compute_network.vpc.id
  project                  = "my-prod-project"
  private_ip_google_access = each.value.private_access

  dynamic "secondary_ip_range" {
    for_each = each.value.secondary_ranges
    content {
      range_name    = secondary_ip_range.value.range_name
      ip_cidr_range = secondary_ip_range.value.ip_cidr_range
    }
  }

  dynamic "log_config" {
    for_each = each.value.log_config != null ? [each.value.log_config] : []
    content {
      aggregation_interval = log_config.value.aggregation_interval
      flow_sampling        = log_config.value.flow_sampling
      metadata             = log_config.value.metadata
    }
  }
}

resource "google_compute_network_peering" "peerings" {
  for_each             = { for p in local.vpc_config.peerings : p.name => p }
  name                 = each.value.name
  network              = google_compute_network.vpc.id
  peer_network         = each.value.network
  export_custom_routes = each.value.export_routes
  import_custom_routes = each.value.import_routes
}

resource "google_compute_router" "nat_routers" {
  for_each = toset(local.vpc_config.nat_regions)
  name     = "router-nat-${each.value}"
  region   = each.value
  network  = google_compute_network.vpc.id
  project  = "my-prod-project"
}

resource "google_compute_router_nat" "nats" {
  for_each                           = toset(local.vpc_config.nat_regions)
  name                               = "nat-${each.value}"
  router                             = google_compute_router.nat_routers[each.value].name
  region                             = each.value
  project                            = "my-prod-project"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
```

### 48. Dynamic Block for GKE Fleet Registration
```hcl
variable "gke_fleet_config" {
  type = object({
    fleet_project = string
    clusters = list(object({
      name        = string
      location    = string
      project     = string
      features    = list(string)
      config_sync = optional(object({
        git_repo   = string
        branch     = string
        secret_type = string
        policy_dir = string
      }))
    }))
  })
}

resource "google_gke_hub_membership" "memberships" {
  for_each      = { for c in var.gke_fleet_config.clusters : c.name => c }
  membership_id = each.value.name
  project       = var.gke_fleet_config.fleet_project
  location      = "global"

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/projects/${each.value.project}/locations/${each.value.location}/clusters/${each.value.name}"
    }
  }

  authority {
    issuer = "https://container.googleapis.com/v1/projects/${each.value.project}/locations/${each.value.location}/clusters/${each.value.name}"
  }
}

resource "google_gke_hub_feature_membership" "config_sync" {
  for_each   = { for c in var.gke_fleet_config.clusters : c.name => c if c.config_sync != null }
  project    = var.gke_fleet_config.fleet_project
  location   = "global"
  feature    = "configmanagement"
  membership = google_gke_hub_membership.memberships[each.key].membership_id

  configmanagement {
    config_sync {
      git {
        sync_repo   = each.value.config_sync.git_repo
        sync_branch = each.value.config_sync.branch
        secret_type = each.value.config_sync.secret_type
        policy_dir  = each.value.config_sync.policy_dir
      }
    }
    policy_controller {
      enabled                    = contains(each.value.features, "policy_controller")
      referential_rules_enabled  = true
      log_denies_enabled         = true
    }
  }
}
```

### 49. Dynamic Block for Apigee Organization and Environment
```hcl
variable "apigee_config" {
  type = object({
    project_id         = string
    analytics_region   = string
    authorized_network = string
    environments = list(object({
      name         = string
      display_name = string
      description  = string
      node_config = object({
        min_node_count = number
        max_node_count = number
      })
      iam_bindings = list(object({
        role    = string
        members = list(string)
      }))
    }))
    instance = object({
      name         = string
      location     = string
      machine_type = string
      disk_size_gb = number
    })
  })
}

resource "google_apigee_organization" "org" {
  project_id         = var.apigee_config.project_id
  analytics_region   = var.apigee_config.analytics_region
  authorized_network = var.apigee_config.authorized_network
  billing_type       = "PAYG"

  runtime_database_encryption_key_name = google_kms_crypto_key.apigee.id
}

resource "google_apigee_environment" "envs" {
  for_each     = { for e in var.apigee_config.environments : e.name => e }
  name         = each.value.name
  display_name = each.value.display_name
  description  = each.value.description
  org_id       = google_apigee_organization.org.id

  node_config {
    min_node_count = each.value.node_config.min_node_count
    max_node_count = each.value.node_config.max_node_count
  }
}

resource "google_apigee_environment_iam_binding" "env_iam" {
  for_each = {
    for pair in flatten([
      for env in var.apigee_config.environments : [
        for binding in env.iam_bindings : {
          key     = "${env.name}-${replace(binding.role, "/", "-")}"
          env     = env.name
          role    = binding.role
          members = binding.members
        }
      ]
    ]) : pair.key => pair
  }

  org_id  = google_apigee_organization.org.id
  env_id  = google_apigee_environment.envs[each.value.env].name
  role    = each.value.role
  members = each.value.members
}

resource "google_apigee_instance" "instance" {
  name         = var.apigee_config.instance.name
  location     = var.apigee_config.instance.location
  org_id       = google_apigee_organization.org.id
  disk_size_gb = var.apigee_config.instance.disk_size_gb
}

resource "google_kms_key_ring" "apigee" {
  name     = "apigee-keyring"
  location = var.apigee_config.analytics_region
  project  = var.apigee_config.project_id
}

resource "google_kms_crypto_key" "apigee" {
  name     = "apigee-key"
  key_ring = google_kms_key_ring.apigee.id
}
```

### 50. Dynamic Block for Complete Production GCP Security Policy Pattern
```hcl
locals {
  project = "my-prod-project"

  firewall_policy = {
    name        = "prod-network-policy"
    description = "Production network firewall policy"

    ingress_rules = [
      {
        priority      = 1000
        action        = "allow"
        description   = "Allow IAP SSH"
        protocols     = [{ protocol = "tcp", ports = ["22"] }]
        src_ranges    = ["35.235.240.0/20"]
        target_tags   = ["ssh-access"]
      },
      {
        priority      = 1001
        action        = "allow"
        description   = "Allow LB health checks"
        protocols     = [{ protocol = "tcp", ports = ["80", "443", "8080"] }]
        src_ranges    = ["130.211.0.0/22", "35.191.0.0/16"]
        target_tags   = ["web-server"]
      },
      {
        priority      = 1002
        action        = "allow"
        description   = "Allow internal traffic"
        protocols     = [{ protocol = "tcp", ports = [] }, { protocol = "udp", ports = [] }, { protocol = "icmp", ports = [] }]
        src_ranges    = ["10.0.0.0/8"]
        target_tags   = []
      },
    ]

    egress_rules = [
      {
        priority      = 1000
        action        = "allow"
        description   = "Allow HTTPS egress"
        protocols     = [{ protocol = "tcp", ports = ["443"] }]
        dest_ranges   = ["0.0.0.0/0"]
        target_tags   = []
      },
      {
        priority      = 1001
        action        = "allow"
        description   = "Allow internal egress"
        protocols     = [{ protocol = "all", ports = [] }]
        dest_ranges   = ["10.0.0.0/8"]
        target_tags   = []
      },
    ]
  }
}

resource "google_compute_firewall" "prod_ingress" {
  for_each = {
    for idx, rule in local.firewall_policy.ingress_rules :
    "ingress-${idx}" => rule
  }

  name      = "prod-fw-${each.key}"
  network   = "projects/${local.project}/global/networks/vpc-prod"
  project   = local.project
  direction = "INGRESS"
  priority  = each.value.priority

  dynamic "allow" {
    for_each = [for p in each.value.protocols : p if each.value.action == "allow"]
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  dynamic "deny" {
    for_each = [for p in each.value.protocols : p if each.value.action == "deny"]
    content {
      protocol = deny.value.protocol
      ports    = deny.value.ports
    }
  }

  source_ranges = length(each.value.src_ranges) > 0 ? each.value.src_ranges : null
  target_tags   = length(each.value.target_tags) > 0 ? each.value.target_tags : null

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_firewall" "prod_egress" {
  for_each = {
    for idx, rule in local.firewall_policy.egress_rules :
    "egress-${idx}" => rule
  }

  name      = "prod-fw-${each.key}"
  network   = "projects/${local.project}/global/networks/vpc-prod"
  project   = local.project
  direction = "EGRESS"
  priority  = each.value.priority

  dynamic "allow" {
    for_each = [for p in each.value.protocols : p if each.value.action == "allow"]
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  destination_ranges = length(each.value.dest_ranges) > 0 ? each.value.dest_ranges : null
  target_tags        = length(each.value.target_tags) > 0 ? each.value.target_tags : null

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }
}
```
