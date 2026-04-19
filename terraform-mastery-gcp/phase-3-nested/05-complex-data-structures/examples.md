# Examples 3.5 — Complex Data Structures (GCP) (50 examples)

---

## Basic

### 1. List of strings
```hcl
variable "allowed_regions" {
  type    = list(string)
  default = ["us-central1", "europe-west1", "asia-east1"]
}
```

### 2. Map of strings
```hcl
variable "project_ids" {
  type = map(string)
  default = {
    dev     = "dev-project-123"
    staging = "staging-project-456"
    prod    = "prod-project-789"
  }
}
```

### 3. Object variable
```hcl
variable "db_config" {
  type = object({
    tier              = string
    availability_type = string
    disk_size         = number
    backup_enabled    = bool
  })
}
```

### 4. List of objects
```hcl
variable "firewall_rules" {
  type = list(object({
    name          = string
    protocol      = string
    ports         = list(string)
    source_ranges = list(string)
  }))
}
```

### 5. Map of objects
```hcl
variable "buckets" {
  type = map(object({
    location      = string
    storage_class = string
    versioning    = bool
  }))
}
```

### 6. Nested map
```hcl
variable "environments" {
  type = map(map(string))
  default = {
    dev  = { project = "dev-proj";  region = "us-central1" }
    prod = { project = "prod-proj"; region = "us-central1" }
  }
}
```

### 7. Set of strings
```hcl
variable "enabled_apis" {
  type = set(string)
  default = [
    "compute.googleapis.com",
    "container.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = var.enabled_apis
  service  = each.value
}
```

### 8. Tuple type
```hcl
variable "ip_range" {
  type    = tuple([string, number])
  default = ["10.0.0.0", 24]
}

locals {
  cidr = "${var.ip_range[0]}/${var.ip_range[1]}"
}
```

### 9. Any type for flexibility
```hcl
variable "extra_labels" {
  type    = any
  default = {}
}
```

### 10. List indexing
```hcl
data "google_compute_zones" "available" {
  region = var.region
  status = "UP"
}

locals {
  primary_zone   = data.google_compute_zones.available.names[0]
  secondary_zone = data.google_compute_zones.available.names[1]
}
```

### 11. Map key access
```hcl
locals {
  project_id   = var.project_ids[var.environment]
  machine_type = var.machine_types[var.environment]
}
```

### 12. keys() and values() operations
```hcl
locals {
  all_bucket_names     = keys(var.buckets)
  all_bucket_locations = values(var.buckets)
}
```

---

## Intermediate

### 13. Complex map of objects for GKE node pools
```hcl
variable "node_pools" {
  type = map(object({
    machine_type    = string
    min_node_count  = number
    max_node_count  = number
    disk_size_gb    = number
    disk_type       = string
    spot            = bool
    labels          = map(string)
    taints          = list(object({ key = string; value = string; effect = string }))
  }))
}

resource "google_container_node_pool" "pools" {
  for_each = var.node_pools
  name     = each.key
  cluster  = google_container_cluster.gke.name
  location = var.region

  autoscaling {
    min_node_count = each.value.min_node_count
    max_node_count = each.value.max_node_count
  }

  node_config {
    machine_type = each.value.machine_type
    disk_size_gb = each.value.disk_size_gb
    disk_type    = each.value.disk_type
    spot         = each.value.spot
    labels       = each.value.labels

    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }
  }
}
```

### 14. Flattened list for cross-product resources
```hcl
variable "regions_and_services" {
  type = map(list(string))
  default = {
    us_central1  = ["api", "frontend"]
    europe_west1 = ["api"]
  }
}

locals {
  deployments = flatten([
    for region, services in var.regions_and_services : [
      for service in services : {
        key     = "${region}-${service}"
        region  = region
        service = service
      }
    ]
  ])

  deployment_map = { for d in local.deployments : d.key => d }
}
```

### 15. Object with optional fields (Terraform 1.3+)
```hcl
variable "cloud_run_config" {
  type = object({
    image          = string
    cpu            = string
    memory         = string
    min_instances  = optional(number, 0)
    max_instances  = optional(number, 100)
    concurrency    = optional(number, 80)
    timeout        = optional(string, "300s")
    env_vars       = optional(map(string), {})
    secret_refs    = optional(list(string), [])
  })
}
```

### 16. Deeply nested subnet configuration
```hcl
variable "vpc_config" {
  type = object({
    name = string
    subnets = map(object({
      cidr              = string
      region            = string
      private_access    = bool
      flow_logs         = bool
      secondary_ranges  = optional(map(string), {})
    }))
  })
}
```

### 17. Map merge from multiple sources
```hcl
locals {
  default_labels = { managed_by = "terraform"; org = var.org_name }
  env_labels     = { environment = var.environment; tier = var.tier }
  service_labels = { service = var.service_name; version = var.image_tag }
  custom_labels  = var.extra_labels

  all_labels = merge(
    local.default_labels,
    local.env_labels,
    local.service_labels,
    local.custom_labels,
  )
}
```

### 18. List filtering with for expression
```hcl
variable "vm_configs" {
  type = list(object({
    name         = string
    environment  = string
    machine_type = string
  }))
}

locals {
  prod_vms = [
    for vm in var.vm_configs :
    vm if vm.environment == "prod"
  ]

  prod_vm_map = { for vm in local.prod_vms : vm.name => vm }
}
```

### 19. Nested list flattening for firewall rules
```hcl
variable "service_firewall" {
  type = map(object({
    ports     = list(string)
    protocols = list(string)
    sources   = list(string)
  }))
}

locals {
  all_rules = flatten([
    for svc_name, svc in var.service_firewall : [
      for proto in svc.protocols : {
        name     = "${svc_name}-${proto}"
        protocol = proto
        ports    = svc.ports
        sources  = svc.sources
      }
    ]
  ])
}
```

### 20. Conditional complex object
```hcl
locals {
  db_settings = var.environment == "prod" ? {
    tier              = "db-custom-8-30720"
    availability_type = "REGIONAL"
    disk_size         = 500
    backup_enabled    = true
    read_replicas     = 2
  } : {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 20
    backup_enabled    = false
    read_replicas     = 0
  }
}
```

### 21. zipmap() to create structured data
```hcl
locals {
  service_names = ["api", "frontend", "worker"]
  service_images = [
    "gcr.io/my-project/api:latest",
    "gcr.io/my-project/frontend:latest",
    "gcr.io/my-project/worker:latest",
  ]

  services = zipmap(local.service_names, local.service_images)
  # { api = "...", frontend = "...", worker = "..." }
}
```

### 22. Map transformation preserving structure
```hcl
variable "environments" {
  type = map(object({ project_id = string; region = string; node_count = number }))
}

locals {
  scaled_envs = {
    for env_name, cfg in var.environments :
    env_name => merge(cfg, {
      node_count = cfg.node_count * (env_name == "prod" ? 2 : 1)
    })
  }
}
```

### 23. Structured output with complex type
```hcl
output "cluster_info" {
  value = {
    for name, cluster in google_container_cluster.clusters :
    name => {
      endpoint        = cluster.endpoint
      ca_cert         = cluster.master_auth[0].cluster_ca_certificate
      node_pools      = [for np in google_container_node_pool.pools : np.name if np.cluster == cluster.name]
    }
  }
  sensitive = true
}
```

### 24. Set operations
```hcl
locals {
  required_apis = toset(["compute.googleapis.com", "container.googleapis.com", "run.googleapis.com"])
  enabled_apis  = toset([for s in data.google_project_service.all : s.service])

  missing_apis   = setsubtract(local.required_apis, local.enabled_apis)
  extra_apis     = setsubtract(local.enabled_apis, local.required_apis)
  common_apis    = setintersection(local.required_apis, local.enabled_apis)
}
```

### 25. Deep map access with nested lookups
```hcl
variable "regional_config" {
  type = map(map(object({
    cidr     = string
    zones    = list(string)
    machine  = string
  })))
}

locals {
  # Access: regional_config["us"]["app"]
  us_app_cidr  = var.regional_config["us"]["app"].cidr
  us_app_zones = var.regional_config["us"]["app"].zones
}
```

---

## Nested

### 26. Complex IAM policy matrix
```hcl
variable "iam_matrix" {
  type = map(object({
    project_roles  = list(string)
    bucket_roles   = map(list(string))   # bucket_name => roles
    secret_roles   = list(string)
  }))
}

locals {
  # Flatten project IAM
  project_bindings = flatten([
    for sa_name, cfg in var.iam_matrix : [
      for role in cfg.project_roles : {
        key     = "${sa_name}-${replace(role, "/", "-")}"
        sa_name = sa_name
        role    = role
      }
    ]
  ])

  # Flatten bucket IAM
  bucket_bindings = flatten([
    for sa_name, cfg in var.iam_matrix : [
      for bucket, roles in cfg.bucket_roles : [
        for role in roles : {
          key     = "${sa_name}-${bucket}-${replace(role, "/", "-")}"
          sa_name = sa_name
          bucket  = bucket
          role    = role
        }
      ]
    ]
  ])
}
```

### 27. Recursive subnet CIDR allocation
```hcl
variable "network_topology" {
  type = object({
    base_cidr = string
    regions = map(object({
      subnets = map(object({
        size_bits        = number
        secondary_ranges = optional(map(number), {})
      }))
    }))
  })
}

locals {
  region_cidrs = {
    for idx, region in keys(var.network_topology.regions) :
    region => cidrsubnet(var.network_topology.base_cidr, 8, idx)
  }

  subnet_cidrs = {
    for region, region_cfg in var.network_topology.regions :
    region => {
      for subnet_idx, subnet_name in keys(region_cfg.subnets) :
      subnet_name => cidrsubnet(
        local.region_cidrs[region],
        region_cfg.subnets[subnet_name].size_bits,
        subnet_idx
      )
    }
  }
}
```

### 28. Cloud Run service map with secrets
```hcl
variable "services" {
  type = map(object({
    image         = string
    cpu           = string
    memory        = string
    env_vars      = map(string)
    secrets       = map(string)   # env_var_name => secret_name
    min_instances = number
    max_instances = number
  }))
}

resource "google_cloud_run_v2_service" "services" {
  for_each = var.services
  name     = each.key
  location = var.region

  template {
    containers {
      image = each.value.image

      dynamic "env" {
        for_each = each.value.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = each.value.secrets
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
    }
  }
}
```

### 29. GKE cluster with complex node pool map
```hcl
locals {
  node_pool_defaults = {
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"
    auto_upgrade = true
    auto_repair  = true
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  merged_pools = {
    for name, pool in var.node_pools :
    name => merge(local.node_pool_defaults, pool)
  }
}
```

### 30. Multi-level alert policy configuration
```hcl
variable "alert_policies" {
  type = map(object({
    display_name = string
    conditions = list(object({
      name            = string
      metric_type     = string
      threshold       = number
      duration        = string
      comparison      = string
    }))
    notification_channels = list(string)
  }))
}

resource "google_monitoring_alert_policy" "policies" {
  for_each     = var.alert_policies
  display_name = each.value.display_name
  combiner     = "OR"

  dynamic "conditions" {
    for_each = each.value.conditions
    content {
      display_name = conditions.value.name
      condition_threshold {
        filter          = "metric.type=\"${conditions.value.metric_type}\""
        threshold_value = conditions.value.threshold
        duration        = conditions.value.duration
        comparison      = conditions.value.comparison
      }
    }
  }

  notification_channels = each.value.notification_channels
}
```

### 31. Data transformation pipeline using locals
```hcl
variable "raw_deployments" {
  type = list(object({
    name    = string
    image   = string
    regions = list(string)
    scale   = map(number)   # region => replica_count
  }))
}

locals {
  # Step 1: Create per-region deployment objects
  regional_deployments = flatten([
    for dep in var.raw_deployments : [
      for region in dep.regions : {
        key     = "${dep.name}-${replace(region, "-", "")}"
        name    = dep.name
        image   = dep.image
        region  = region
        replicas = lookup(dep.scale, region, 1)
      }
    ]
  ])

  # Step 2: Convert to map for for_each
  deployment_map = { for d in local.regional_deployments : d.key => d }
}
```

### 32. Nested conditional object building
```hcl
locals {
  gke_features = merge(
    { remove_default_node_pool = true },
    var.enable_workload_identity ? {
      workload_identity_config = { workload_pool = "${var.project_id}.svc.id.goog" }
    } : {},
    var.enable_network_policy ? {
      network_policy = { enabled = true; provider = "CALICO" }
    } : {},
  )
}
```

### 33. Deep data restructuring for Helm values
```hcl
variable "microservices" {
  type = map(object({
    image      = object({ repository = string; tag = string })
    resources  = object({ cpu = string; memory = string })
    replicas   = number
    env        = map(string)
    gcp_sa     = string
  }))
}

locals {
  helm_values = {
    for name, svc in var.microservices :
    name => {
      image            = "${svc.image.repository}:${svc.image.tag}"
      replicaCount     = svc.replicas
      resources        = { limits = { cpu = svc.resources.cpu; memory = svc.resources.memory } }
      serviceAccount   = { annotations = { "iam.gke.io/gcp-service-account" = svc.gcp_sa } }
      env              = svc.env
    }
  }
}
```

### 34. Complex SQL database configuration
```hcl
variable "databases" {
  type = map(object({
    version      = string
    tier         = string
    ha           = bool
    disk_size    = number
    flags        = map(string)
    users        = map(string)   # username => password_secret
    databases    = list(string)
  }))
}

resource "google_sql_database_instance" "instances" {
  for_each         = var.databases
  name             = each.key
  database_version = each.value.version
  region           = var.region

  settings {
    tier              = each.value.tier
    availability_type = each.value.ha ? "REGIONAL" : "ZONAL"
    disk_size         = each.value.disk_size

    dynamic "database_flags" {
      for_each = each.value.flags
      content {
        name  = database_flags.key
        value = database_flags.value
      }
    }
  }
}
```

---

## Advanced

### 35. Three-level nested structure for Organization management
```hcl
variable "org_structure" {
  type = object({
    org_id = string
    folders = map(object({
      display_name = string
      projects = map(object({
        project_id      = string
        billing_account = string
        apis            = list(string)
        budgets         = optional(object({ monthly = number; alert_pct = list(number) }))
      }))
    }))
  })
}
```

### 36. Complex for expression with multiple filters and transforms
```hcl
locals {
  active_prod_services = {
    for name, svc in var.services :
    name => merge(svc, {
      full_image = "gcr.io/${var.project_id}/${svc.image}:${coalesce(svc.tag, "latest")}"
      replicas   = svc.replicas * (var.environment == "prod" ? 2 : 1)
    })
    if svc.enabled && !svc.deprecated
  }
}
```

### 37. Recursive object merge pattern
```hcl
locals {
  base_config = {
    gke = {
      deletion_protection = false
      release_channel     = "REGULAR"
      node_pools = {
        default = { machine_type = "e2-standard-4"; min = 1; max = 5 }
      }
    }
  }

  prod_override = {
    gke = {
      deletion_protection = true
      release_channel     = "STABLE"
      node_pools = {
        default = { machine_type = "e2-standard-8"; min = 3; max = 20 }
        spot    = { machine_type = "e2-standard-4"; min = 0; max = 50 }
      }
    }
  }

  final_config = var.environment == "prod" ? local.prod_override : local.base_config
}
```

### 38. Generating Security Command Center findings filter
```hcl
variable "scc_categories" {
  type = list(object({
    category = string
    severity = string
    sources  = list(string)
  }))
}

locals {
  scc_filters = [
    for cat in var.scc_categories :
    join(" AND ", compact([
      "category=\"${cat.category}\"",
      "severity=\"${cat.severity}\"",
      length(cat.sources) > 0 ? "source_id:(${join(" OR ", cat.sources)})" : null,
    ]))
  ]
}
```

### 39. Complex VPC peering mesh
```hcl
variable "networks" {
  type = map(string)   # name => self_link
}

locals {
  # Generate all unique pairs (A→B, B→A) for full mesh peering
  peer_pairs = flatten([
    for a_name, a_link in var.networks : [
      for b_name, b_link in var.networks :
      { from = a_name; from_link = a_link; to = b_name; to_link = b_link }
      if a_name != b_name
    ]
  ])

  peerings = { for p in local.peer_pairs : "${p.from}-to-${p.to}" => p }
}

resource "google_compute_network_peering" "mesh" {
  for_each     = local.peerings
  name         = each.key
  network      = each.value.from_link
  peer_network = each.value.to_link
}
```

### 40. Data structure for Pub/Sub topic and subscription matrix
```hcl
variable "pubsub_config" {
  type = map(object({
    message_retention = string
    subscriptions = map(object({
      ack_deadline     = number
      retention        = string
      push_endpoint    = optional(string)
      filter           = optional(string)
      retry_policy     = optional(object({ min_backoff = string; max_backoff = string }))
    }))
  }))
}
```

### 41. Complex output for Kubernetes external secrets
```hcl
output "external_secrets_config" {
  value = {
    for sa_name, sa in google_service_account.workload_sas :
    sa_name => {
      serviceAccountEmail = sa.email
      secrets = {
        for secret_name in var.service_secret_bindings[sa_name] :
        secret_name => "projects/${var.project_id}/secrets/${secret_name}"
      }
    }
  }
}
```

### 42. State machine using maps
```hcl
locals {
  transition_rules = {
    dev = {
      next_env   = "staging"
      approvers  = var.dev_approvers
      auto_apply = true
    }
    staging = {
      next_env   = "prod"
      approvers  = var.prod_approvers
      auto_apply = false
    }
    prod = {
      next_env   = null
      approvers  = var.exec_approvers
      auto_apply = false
    }
  }

  current_transition = local.transition_rules[var.environment]
}
```

### 43. Multi-tenant configuration structure
```hcl
variable "tenants" {
  type = map(object({
    project_id = string
    region     = string
    tier = object({
      gke_nodes    = number
      db_tier      = string
      redis_gb     = number
    })
    custom_domain  = optional(string)
    extra_labels   = optional(map(string), {})
    feature_flags  = optional(object({
      cdn          = bool
      armor        = bool
      private_gke  = bool
    }), { cdn = false; armor = false; private_gke = false })
  }))
}
```

### 44. Computed lookup tables
```hcl
locals {
  # Machine type to vCPU count for cost estimation
  vcpu_counts = {
    "e2-micro"       = 0.25
    "e2-small"       = 0.5
    "e2-medium"      = 1
    "e2-standard-2"  = 2
    "e2-standard-4"  = 4
    "e2-standard-8"  = 8
    "e2-standard-16" = 16
    "e2-standard-32" = 32
  }

  total_vcpus = sum([
    for pool in values(var.node_pools) :
    local.vcpu_counts[pool.machine_type] * pool.max_node_count
  ])
}
```

### 45. Region-aware resource configuration
```hcl
locals {
  region_configs = {
    "us-central1" = {
      zones            = ["us-central1-a", "us-central1-b", "us-central1-c"]
      storage_location = "US"
      is_multi_region  = true
      latency_class    = "low"
    }
    "europe-west1" = {
      zones            = ["europe-west1-b", "europe-west1-c", "europe-west1-d"]
      storage_location = "EU"
      is_multi_region  = false
      latency_class    = "medium"
    }
  }

  current_region_config = local.region_configs[var.region]
}
```

### 46. Complex transformation for Cloud Armor rules
```hcl
variable "waf_rules" {
  type = list(object({
    name        = string
    priority    = number
    action      = string
    expressions = list(string)
    preview     = optional(bool, false)
  }))
}

locals {
  # Sort rules by priority and convert to map
  sorted_rules = sort([for r in var.waf_rules : r.name])
  rule_map     = { for r in var.waf_rules : r.name => r }

  # Generate combined expressions
  combined_rules = {
    for name, rule in local.rule_map :
    name => merge(rule, {
      combined_expr = length(rule.expressions) > 1 ?
        "( ${join(") || (", rule.expressions)} )" :
        rule.expressions[0]
    })
  }
}
```

### 47. Hierarchical configuration with inheritance
```hcl
variable "app_defaults" {
  type = object({
    cpu      = string
    memory   = string
    replicas = number
    timeout  = string
  })
  default = {
    cpu      = "1"
    memory   = "512Mi"
    replicas = 1
    timeout  = "300s"
  }
}

variable "app_overrides" {
  type = map(object({
    cpu      = optional(string)
    memory   = optional(string)
    replicas = optional(number)
    timeout  = optional(string)
  }))
}

locals {
  app_configs = {
    for app_name, override in var.app_overrides :
    app_name => {
      cpu      = coalesce(override.cpu,      var.app_defaults.cpu)
      memory   = coalesce(override.memory,   var.app_defaults.memory)
      replicas = coalesce(override.replicas, var.app_defaults.replicas)
      timeout  = coalesce(override.timeout,  var.app_defaults.timeout)
    }
  }
}
```

### 48. Complex set manipulation for network policy
```hcl
locals {
  all_service_cidrs    = toset(values(local.service_cidr_map))
  trusted_cidrs        = toset(var.trusted_ip_ranges)
  internet_cidrs       = toset(["0.0.0.0/0"])

  internal_only_cidrs  = setunion(local.all_service_cidrs, local.trusted_cidrs)
  untrusted_cidrs      = setsubtract(local.internet_cidrs, local.trusted_cidrs)
}
```

### 49. Full multi-environment data structure
```hcl
variable "platform_config" {
  type = map(object({
    # Project
    project_id      = string
    billing_account = string

    # Networking
    vpc_cidr     = string
    enable_nat   = bool
    enable_vpn   = optional(bool, false)

    # GKE
    gke = optional(object({
      enabled      = bool
      version      = string
      node_pools   = map(object({
        machine_type = string
        min_nodes    = number
        max_nodes    = number
        spot         = optional(bool, false)
      }))
    }), { enabled = false; version = "latest"; node_pools = {} })

    # Database
    db = optional(object({
      enabled          = bool
      version          = string
      tier             = string
      ha               = bool
      read_replicas    = optional(number, 0)
    }), { enabled = false; version = "POSTGRES_15"; tier = "db-f1-micro"; ha = false })

    # Monitoring
    monitoring = optional(object({
      enabled           = bool
      alert_channels    = list(string)
      retention_days    = number
    }), { enabled = false; alert_channels = []; retention_days = 30 })
  }))
}
```

### 50. Complete data-structure driven deployment
```hcl
variable "multi_region_platform" {
  type = object({
    org_id          = string
    billing_account = string
    regions = map(object({
      project_id = string
      primary    = bool
      vpc_cidr   = string
      gke = object({
        channel    = string
        node_pools = map(object({
          machine_type = string
          min          = number
          max          = number
        }))
      })
      services = map(object({
        image     = string
        min_scale = number
        max_scale = number
        env       = optional(map(string), {})
      }))
    }))
  })
}

locals {
  primary_region = one([
    for region, cfg in var.multi_region_platform.regions :
    region if cfg.primary
  ])

  all_services = flatten([
    for region, cfg in var.multi_region_platform.regions : [
      for svc_name, svc in cfg.services : {
        key       = "${region}-${svc_name}"
        region    = region
        svc_name  = svc_name
        project   = cfg.project_id
        image     = svc.image
        min_scale = svc.min_scale
        max_scale = svc.max_scale
        env       = svc.env
      }
    ]
  ])

  service_map = { for s in local.all_services : s.key => s }
}

resource "google_cloud_run_v2_service" "services" {
  for_each = local.service_map
  name     = each.value.svc_name
  project  = each.value.project
  location = each.value.region

  template {
    containers {
      image = each.value.image

      dynamic "env" {
        for_each = each.value.env
        content {
          name  = env.key
          value = env.value
        }
      }
    }

    scaling {
      min_instance_count = each.value.min_scale
      max_instance_count = each.value.max_scale
    }
  }
}
```
