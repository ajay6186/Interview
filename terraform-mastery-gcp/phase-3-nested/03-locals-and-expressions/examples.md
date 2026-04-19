# Examples 3.3 — Locals & Expressions (GCP) (50 examples)

---

## Basic

### 1. Simple local value
```hcl
locals {
  project_id = "my-gcp-project"
  region     = "us-central1"
}
```

### 2. Local derived from variable
```hcl
variable "environment" { type = string }

locals {
  env_prefix = "${var.environment}-"
}

resource "google_storage_bucket" "app" {
  name     = "${local.env_prefix}app-data"
  location = "US"
}
```

### 3. String interpolation in locals
```hcl
locals {
  bucket_name = "app-${var.environment}-${var.region}"
}
```

### 4. Boolean expression
```hcl
locals {
  is_prod    = var.environment == "prod"
  enable_nat = var.environment != "dev"
}
```

### 5. Conditional expression (ternary)
```hcl
locals {
  machine_type = var.environment == "prod" ? "e2-standard-4" : "e2-micro"
  disk_size    = var.environment == "prod" ? 100 : 10
}
```

### 6. Arithmetic expression
```hcl
variable "node_count" { default = 3 }

locals {
  total_vcpus  = var.node_count * 4
  total_memory = var.node_count * 15360
}
```

### 7. Map literal
```hcl
locals {
  common_labels = {
    environment = var.environment
    managed_by  = "terraform"
    team        = var.team_name
  }
}
```

### 8. Using locals in multiple resources
```hcl
resource "google_compute_network" "vpc" {
  name   = "${local.env_prefix}vpc"
  labels = local.common_labels
}

resource "google_storage_bucket" "data" {
  name   = "${local.env_prefix}data"
  labels = local.common_labels
}
```

### 9. String functions in locals
```hcl
locals {
  safe_name    = lower(replace(var.service_name, "_", "-"))
  short_region = substr(var.region, 0, 2)   # "us" from "us-central1"
}
```

### 10. Merged map local
```hcl
locals {
  all_labels = merge(
    local.common_labels,
    { service = var.service_name },
    var.extra_labels,
  )
}
```

### 11. List local
```hcl
locals {
  enabled_apis = [
    "compute.googleapis.com",
    "container.googleapis.com",
    "iam.googleapis.com",
  ]
}
```

### 12. Path reference in locals
```hcl
locals {
  startup_script = file("${path.module}/scripts/startup.sh")
  cloud_config   = templatefile("${path.module}/templates/config.yaml.tpl", {
    env = var.environment
  })
}
```

---

## Intermediate

### 13. For expression — list transformation
```hcl
locals {
  api_members = [
    for email in var.developer_emails :
    "user:${email}"
  ]
}
```

### 14. For expression — map transformation
```hcl
variable "services" {
  type = map(string)   # name => image
}

locals {
  service_names = [for name, _ in var.services : name]
  service_map   = { for name, image in var.services : name => { image = image; region = var.region } }
}
```

### 15. For expression with filter
```hcl
locals {
  prod_services = {
    for name, config in var.services :
    name => config
    if config.environment == "prod"
  }
}
```

### 16. Flatten local for nested structures
```hcl
variable "env_services" {
  type = map(list(string))
  default = {
    us    = ["api", "frontend"]
    eu    = ["api"]
  }
}

locals {
  all_deployments = flatten([
    for region, services in var.env_services : [
      for svc in services : { region = region; service = svc }
    ]
  ])
}
```

### 17. Lookup with default
```hcl
locals {
  db_tier = lookup({
    dev     = "db-f1-micro"
    staging = "db-g1-small"
    prod    = "db-custom-4-15360"
  }, var.environment, "db-f1-micro")
}
```

### 18. cidrsubnet in locals
```hcl
locals {
  vpc_cidr = "10.0.0.0/16"
  subnets  = {
    app  = cidrsubnet(local.vpc_cidr, 4, 0)
    gke  = cidrsubnet(local.vpc_cidr, 4, 1)
    db   = cidrsubnet(local.vpc_cidr, 4, 2)
  }
}
```

### 19. Timestamp and date in locals
```hcl
locals {
  deploy_date  = formatdate("YYYY-MM-DD", timestamp())
  snapshot_tag = "snap-${formatdate("YYYYMMDD", timestamp())}"
}
```

### 20. JSON encoding in locals
```hcl
locals {
  app_config_json = jsonencode({
    database = {
      host     = google_sql_database_instance.db.private_ip_address
      port     = 5432
      name     = "app"
    }
    redis = {
      host = google_redis_instance.cache.host
      port = 6379
    }
    environment = var.environment
  })
}
```

### 21. Conditional list building with compact()
```hcl
locals {
  service_accounts = compact([
    google_service_account.app_sa.email,
    var.enable_monitoring ? google_service_account.monitoring_sa.email : null,
    var.enable_logging    ? google_service_account.logging_sa.email    : null,
  ])
}
```

### 22. Region-derived locals
```hcl
variable "region" { default = "us-central1" }

locals {
  zone           = "${var.region}-a"
  region_short   = join("", [for part in split("-", var.region) : substr(part, 0, 2)])
  # "us-central1" → "usce"
}
```

### 23. Complex label construction
```hcl
locals {
  git_sha_short = substr(var.git_sha, 0, 7)
  labels = {
    environment = lower(var.environment)
    team        = lower(replace(var.team_name, " ", "-"))
    service     = lower(var.service_name)
    version     = local.git_sha_short
    managed_by  = "terraform"
  }
}
```

### 24. Self-referential locals (chained)
```hcl
locals {
  base_name     = "${var.app_name}-${var.environment}"
  bucket_name   = "${local.base_name}-data"
  log_bucket    = "${local.base_name}-logs"
  backup_bucket = "${local.base_name}-backups"
}
```

### 25. Locals for IAM member formatting
```hcl
locals {
  app_sa_member = "serviceAccount:${google_service_account.app_sa.email}"
  gke_sa_member = "serviceAccount:${google_service_account.gke_sa.email}"
  wi_member     = "serviceAccount:${var.project_id}.svc.id.goog[${var.namespace}/${var.k8s_sa_name}]"
}
```

---

## Nested

### 26. Nested for expression for IAM role matrix
```hcl
variable "roles_map" {
  type = map(list(string))
  default = {
    app_sa = ["roles/cloudsql.client", "roles/secretmanager.secretAccessor"]
    gke_sa = ["roles/container.nodeServiceAccount", "roles/storage.objectViewer"]
  }
}

locals {
  iam_bindings = flatten([
    for sa_name, roles in var.roles_map : [
      for role in roles : {
        key     = "${sa_name}--${replace(role, "/", "-")}"
        sa_name = sa_name
        role    = role
      }
    ]
  ])
}

resource "google_project_iam_member" "all" {
  for_each = { for b in local.iam_bindings : b.key => b }
  project  = var.project_id
  role     = each.value.role
  member   = "serviceAccount:${google_service_account.sas[each.value.sa_name].email}"
}
```

### 27. Nested map for multi-region subnets
```hcl
variable "regions" {
  type = map(object({ cidr = string; zones = list(string) }))
  default = {
    us_central1  = { cidr = "10.0.0.0/20"; zones = ["us-central1-a", "us-central1-b"] }
    europe_west1 = { cidr = "10.1.0.0/20"; zones = ["europe-west1-b", "europe-west1-c"] }
  }
}

locals {
  all_zones = flatten([
    for region, config in var.regions : config.zones
  ])
}
```

### 28. Dynamic cloud_run env vars from locals
```hcl
locals {
  env_vars = merge(
    {
      ENVIRONMENT   = var.environment
      PROJECT_ID    = var.project_id
      REGION        = var.region
    },
    var.extra_env_vars,
  )
}

resource "google_cloud_run_v2_service" "app" {
  name     = "my-app"
  location = var.region

  template {
    containers {
      image = var.image

      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }
}
```

### 29. Complex locals for GKE node pool configs
```hcl
locals {
  node_pool_defaults = {
    machine_type   = "e2-standard-4"
    disk_size_gb   = 100
    disk_type      = "pd-ssd"
    auto_upgrade   = true
    auto_repair    = true
    image_type     = "COS_CONTAINERD"
    min_count      = 1
    max_count      = 5
  }

  node_pools = {
    for name, overrides in var.node_pool_configs :
    name => merge(local.node_pool_defaults, overrides)
  }
}
```

### 30. Recursive CIDR calculation
```hcl
locals {
  base_cidr  = "10.0.0.0/8"
  envs       = ["dev", "staging", "prod"]
  env_cidrs  = {
    for idx, env in local.envs :
    env => cidrsubnet(local.base_cidr, 8, idx)
  }
  subnet_cidrs = {
    for env, cidr in local.env_cidrs :
    env => {
      app = cidrsubnet(cidr, 4, 0)
      gke = cidrsubnet(cidr, 4, 1)
      db  = cidrsubnet(cidr, 4, 2)
    }
  }
}
```

### 31. Locals for structured Helm values
```hcl
locals {
  helm_values = {
    replicaCount = var.environment == "prod" ? 3 : 1
    image = {
      repository = "gcr.io/${var.project_id}/${var.service_name}"
      tag        = var.image_tag
    }
    serviceAccount = {
      annotations = {
        "iam.gke.io/gcp-service-account" = google_service_account.app_sa.email
      }
    }
    resources = {
      limits   = { cpu = "500m"; memory = "512Mi" }
      requests = { cpu = "100m"; memory = "128Mi" }
    }
  }
}
```

### 32. Complex firewall rule locals
```hcl
locals {
  ingress_rules = {
    for rule in var.ingress_config : rule.name => {
      protocol      = rule.protocol
      ports         = rule.ports
      source_ranges = coalesce(rule.source_ranges, ["10.0.0.0/8"])
      priority      = coalesce(rule.priority, 1000)
    }
  }

  egress_rules = {
    for rule in var.egress_config : rule.name => {
      protocol            = rule.protocol
      ports               = rule.ports
      destination_ranges  = coalesce(rule.destination_ranges, ["0.0.0.0/0"])
      priority            = coalesce(rule.priority, 1000)
    }
  }
}
```

### 33. Locals combining remote state and variables
```hcl
data "terraform_remote_state" "networking" {
  backend = "gcs"
  config  = { bucket = "tfstate", prefix = "${var.env}/networking" }
}

locals {
  network_id  = data.terraform_remote_state.networking.outputs.network_id
  subnet_id   = data.terraform_remote_state.networking.outputs.subnet_id
  db_subnet   = data.terraform_remote_state.networking.outputs.db_subnet_id
  connector   = data.terraform_remote_state.networking.outputs.connector_id

  gke_config = {
    network    = local.network_id
    subnetwork = local.subnet_id
    pods_range = data.terraform_remote_state.networking.outputs.pods_range
    svc_range  = data.terraform_remote_state.networking.outputs.services_range
  }
}
```

### 34. Locals for startup script generation
```hcl
locals {
  startup_vars = {
    db_host       = google_sql_database_instance.db.private_ip_address
    redis_host    = google_redis_instance.cache.host
    environment   = var.environment
    project_id    = var.project_id
    service_name  = var.service_name
  }

  startup_script = templatefile("${path.module}/templates/startup.sh.tpl", local.startup_vars)
}

resource "google_compute_instance_template" "app" {
  name_prefix  = "app-tmpl-"
  machine_type = "e2-standard-4"

  metadata = {
    startup-script = local.startup_script
  }
  # ...
}
```

---

## Advanced

### 35. Locals with complex type transformations
```hcl
variable "multi_region_config" {
  type = map(object({
    project_id    = string
    node_count    = number
    machine_type  = string
    zones         = list(string)
  }))
}

locals {
  # Expand each region config into per-zone node pool specs
  zone_pools = flatten([
    for region, cfg in var.multi_region_config : [
      for zone in cfg.zones : {
        key          = "${region}-${zone}"
        project_id   = cfg.project_id
        region       = region
        zone         = zone
        node_count   = ceil(cfg.node_count / length(cfg.zones))
        machine_type = cfg.machine_type
      }
    ]
  ])

  zone_pool_map = { for pool in local.zone_pools : pool.key => pool }
}
```

### 36. Locals for Workload Identity annotations
```hcl
locals {
  wi_annotation_key   = "iam.gke.io/gcp-service-account"
  wi_annotation_value = google_service_account.app_sa.email

  k8s_sa_annotations = {
    (local.wi_annotation_key) = local.wi_annotation_value
  }
}
```

### 37. Locals for dynamic backend service weights
```hcl
variable "traffic_splits" {
  type    = map(number)
  default = { blue = 90; green = 10 }
}

locals {
  total_weight     = sum(values(var.traffic_splits))
  normalized_split = {
    for svc, pct in var.traffic_splits :
    svc => round(pct * 100 / local.total_weight) / 100
  }
}
```

### 38. Expression for Secret Manager path
```hcl
locals {
  secret_path  = "projects/${var.project_id}/secrets"
  secret_names = ["db-password", "api-key", "jwt-secret", "oauth-client-secret"]

  secret_full_paths = {
    for name in local.secret_names :
    name => "${local.secret_path}/${name}/versions/latest"
  }
}
```

### 39. Locals for VPC Service Controls perimeter
```hcl
locals {
  restricted_services = [
    "storage.googleapis.com",
    "bigquery.googleapis.com",
    "cloudsql.googleapis.com",
    "container.googleapis.com",
  ]

  access_policy_name = "accessPolicies/${var.access_policy_id}"

  perimeter_resources = [
    for project_id in var.protected_project_ids :
    "projects/${data.google_project.projects[project_id].number}"
  ]
}
```

### 40. Self-referential check using try()
```hcl
locals {
  gke_endpoint = try(
    google_container_cluster.gke.endpoint,
    data.google_container_cluster.existing.endpoint,
    ""
  )
  has_gke = local.gke_endpoint != ""
}
```

### 41. Locals for monitoring filter expressions
```hcl
locals {
  base_filter      = "resource.type=\"cloud_run_revision\""
  service_filter   = "${local.base_filter} AND resource.labels.service_name=\"${var.service_name}\""
  error_filter     = "${local.service_filter} AND severity>=ERROR"
  latency_filter   = "${local.service_filter} AND httpRequest.latency>\"2s\""
}
```

### 42. Locals with regex extraction
```hcl
locals {
  # Extract project number from self_link
  project_number = regex(
    "projects/([0-9]+)",
    data.google_project.current.self_link
  )[0]

  # Extract short region code
  region_code = join("", [
    for segment in split("-", var.region) :
    substr(segment, 0, min(2, length(segment)))
  ])
}
```

### 43. Locals for alert threshold calculation
```hcl
locals {
  baseline_qps = var.expected_rps

  alert_thresholds = {
    error_rate_pct  = var.environment == "prod" ? 1.0 : 5.0
    latency_p99_ms  = var.environment == "prod" ? 2000 : 5000
    cpu_util_pct    = var.environment == "prod" ? 80.0 : 90.0
    high_qps        = local.baseline_qps * 3
    low_qps         = local.baseline_qps * 0.2
  }
}
```

### 44. Locals for organized resource naming
```hcl
locals {
  # Naming convention: <org>-<env>-<region_short>-<resource>-<suffix>
  org          = "acme"
  env          = var.environment
  region_short = substr(replace(var.region, "-", ""), 0, 6)

  name_prefix = "${local.org}-${local.env}-${local.region_short}"

  names = {
    vpc         = "${local.name_prefix}-vpc"
    gke         = "${local.name_prefix}-gke"
    db          = "${local.name_prefix}-db"
    redis       = "${local.name_prefix}-redis"
    state_bucket = "${local.name_prefix}-tfstate"
  }
}
```

### 45. Expression for policy binding generation
```hcl
locals {
  viewer_principals = concat(
    [for email in var.viewer_users    : "user:${email}"],
    [for email in var.viewer_groups   : "group:${email}"],
    [for email in var.viewer_sas      : "serviceAccount:${email}"],
  )

  editor_principals = concat(
    [for email in var.editor_users    : "user:${email}"],
    [for email in var.editor_groups   : "group:${email}"],
  )
}
```

### 46. Locals for Cloud Armor rate limiting rules
```hcl
locals {
  rate_limits = {
    for tier, config in var.service_tiers :
    tier => {
      count        = config.requests_per_minute
      interval_sec = 60
      action       = tier == "free" ? "throttle" : "allow"
    }
  }
}
```

### 47. Locals driven by data sources
```hcl
data "google_compute_zones" "available" { region = var.region; status = "UP" }
data "google_project" "current" {}
data "google_client_config" "me" {}

locals {
  zones          = data.google_compute_zones.available.names
  primary_zone   = local.zones[0]
  secondary_zone = local.zones[1]
  project_id     = data.google_project.current.project_id
  project_number = data.google_project.current.number
  access_token   = data.google_client_config.me.access_token
}
```

### 48. Locals for GCS lifecycle rules
```hcl
variable "retention_policies" {
  type = map(object({ days_standard = number; days_nearline = number; days_coldline = number; days_delete = number }))
}

locals {
  lifecycle_rules = {
    for bucket_type, policy in var.retention_policies :
    bucket_type => [
      { age = policy.days_nearline; action = "SetStorageClass"; storage_class = "NEARLINE" },
      { age = policy.days_coldline; action = "SetStorageClass"; storage_class = "COLDLINE" },
      { age = policy.days_delete;   action = "Delete" },
    ]
  }
}
```

### 49. Expression: dynamic provider map for Workload Identity
```hcl
locals {
  wi_providers = {
    for env, cfg in var.environments :
    env => "projects/${cfg.project_number}/locations/global/workloadIdentityPools/${env}-pool/providers/${env}-gh-provider"
  }
}
```

### 50. Full production locals block
```hcl
locals {
  # Core identifiers
  env          = var.environment
  project_id   = var.project_id
  region       = var.region
  is_prod      = local.env == "prod"

  # Naming
  prefix        = "${var.org_name}-${local.env}"
  cluster_name  = "${local.prefix}-gke"
  db_name       = "${local.prefix}-postgres"
  redis_name    = "${local.prefix}-redis"
  bucket_prefix = "${local.prefix}-"

  # Sizing
  gke_machine  = local.is_prod ? "e2-standard-8"  : "e2-standard-4"
  db_tier      = local.is_prod ? "db-custom-8-30720" : "db-f1-micro"
  db_ha        = local.is_prod
  min_nodes    = local.is_prod ? 3 : 1
  max_nodes    = local.is_prod ? 20 : 5

  # Networking
  vpc_cidr   = "10.0.0.0/16"
  app_cidr   = cidrsubnet(local.vpc_cidr, 4, 0)
  gke_cidr   = cidrsubnet(local.vpc_cidr, 4, 1)
  db_cidr    = cidrsubnet(local.vpc_cidr, 4, 2)

  # Labels
  labels = {
    environment = local.env
    org         = var.org_name
    region      = local.region
    managed_by  = "terraform"
  }

  # IAM
  app_sa_member = "serviceAccount:${google_service_account.app.email}"
  gke_sa_member = "serviceAccount:${google_service_account.gke.email}"
}
```
