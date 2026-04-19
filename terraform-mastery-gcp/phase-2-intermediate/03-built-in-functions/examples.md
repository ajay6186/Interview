# Examples 2.3 — Built-in Functions (GCP) (50 examples)

---

## Basic

### 1. length() — count list/map items
```hcl
variable "zones" {
  default = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

output "zone_count" {
  value = length(var.zones)   # 3
}
```

### 2. toset() — convert list to set
```hcl
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "run.googleapis.com",
  ])
  service = each.value
}
```

### 3. tolist() — convert set to list
```hcl
locals {
  sorted_zones = tolist(toset(var.zones))
}
```

### 4. tomap() — convert object to map
```hcl
locals {
  labels_map = tomap({
    environment = "prod"
    team        = "platform"
  })
}
```

### 5. join() — join list to string
```hcl
locals {
  tag_string = join(",", ["env:prod", "team:platform", "managed:terraform"])
}
```

### 6. split() — split string to list
```hcl
locals {
  cidr_parts = split("/", "10.0.0.0/24")
  # ["10.0.0.0", "24"]
}
```

### 7. lower() / upper() — string case
```hcl
locals {
  bucket_name = lower("MY-APP-${var.environment}")
  # "my-app-prod"
}
```

### 8. format() — string formatting
```hcl
locals {
  vm_name = format("app-%s-%02d", var.environment, count.index)
  # "app-prod-01"
}
```

### 9. trimspace() — remove whitespace
```hcl
locals {
  clean_project = trimspace(var.project_id)
}
```

### 10. contains() — check list membership
```hcl
variable "region" {
  validation {
    condition     = contains(["us-central1", "europe-west1", "asia-east1"], var.region)
    error_message = "Region must be an approved region."
  }
}
```

### 11. lookup() — map lookup with default
```hcl
locals {
  machine_type = lookup({
    dev  = "e2-micro"
    prod = "e2-standard-4"
  }, var.environment, "e2-medium")
}
```

### 12. merge() — merge maps
```hcl
locals {
  common_labels = { managed_by = "terraform"; team = "platform" }
  env_labels    = { environment = var.environment }
  all_labels    = merge(local.common_labels, local.env_labels)
}
```

---

## Intermediate

### 13. flatten() — flatten nested lists
```hcl
locals {
  all_subnets = flatten([
    module.vpc_us.subnet_ids,
    module.vpc_eu.subnet_ids,
  ])
}
```

### 14. distinct() — remove duplicates
```hcl
locals {
  unique_apis = distinct([
    "compute.googleapis.com",
    "container.googleapis.com",
    "compute.googleapis.com",  # duplicate
  ])
}
```

### 15. concat() — combine lists
```hcl
locals {
  all_sa_emails = concat(
    [google_service_account.gke_sa.email],
    [for sa in google_service_account.app_sas : sa.email]
  )
}
```

### 16. coalesce() — first non-null value
```hcl
locals {
  project = coalesce(var.override_project, data.google_project.current.project_id)
  region  = coalesce(var.region, "us-central1")
}
```

### 17. coalescelist() — first non-empty list
```hcl
locals {
  zones = coalescelist(var.custom_zones, data.google_compute_zones.available.names)
}
```

### 18. element() — get list item by index (wraps)
```hcl
resource "google_compute_instance" "vm" {
  count = 6
  zone  = element(["us-central1-a", "us-central1-b", "us-central1-c"], count.index)
  # Distributes VMs round-robin across zones
}
```

### 19. slice() — extract list subset
```hcl
locals {
  first_two_zones = slice(data.google_compute_zones.available.names, 0, 2)
}
```

### 20. keys() and values() — map keys/values
```hcl
locals {
  bucket_names = keys(var.bucket_configs)
  bucket_locs  = values(var.bucket_configs)
}
```

### 21. zipmap() — create map from keys and values
```hcl
locals {
  bucket_map = zipmap(
    ["logs", "backups", "artifacts"],
    ["US", "EU", "ASIA"]
  )
}
```

### 22. can() — test if expression succeeds
```hcl
variable "replica_count" {
  default = "3"
}

locals {
  count = can(tonumber(var.replica_count)) ? tonumber(var.replica_count) : 0
}
```

### 23. try() — return first successful expression
```hcl
locals {
  subnet_id = try(
    module.networking.subnet_id,
    data.google_compute_subnetwork.default.id,
    "default"
  )
}
```

### 24. regex() and regexall()
```hcl
locals {
  project_number = regex("^projects/([0-9]+)", data.google_project.current.id)[0]
  # Extract project number from "projects/123456789"
}
```

### 25. replace() — string replacement
```hcl
locals {
  clean_name = replace(var.cluster_name, "_", "-")
  # GKE names can't have underscores
}
```

---

## Nested

### 26. Complex for expression with filter
```hcl
locals {
  prod_instances = {
    for name, inst in google_compute_instance.fleet :
    name => inst.network_interface[0].network_ip
    if inst.labels["environment"] == "production"
  }
}
```

### 27. Nested flatten for firewall rule generation
```hcl
locals {
  firewall_rules = flatten([
    for svc_name, svc in var.services : [
      for rule in svc.firewall_rules : {
        name     = "${svc_name}-${rule.name}"
        protocol = rule.protocol
        ports    = rule.ports
      }
    ]
  ])
}

resource "google_compute_firewall" "rules" {
  for_each = { for r in local.firewall_rules : r.name => r }
  name     = each.value.name
  network  = google_compute_network.vpc.name

  allow {
    protocol = each.value.protocol
    ports    = each.value.ports
  }
}
```

### 28. jsonencode() for Cloud Run env vars from map
```hcl
locals {
  env_config = jsonencode({
    database_url  = "postgresql://${local.db_host}:5432/app"
    redis_url     = "redis://${local.redis_host}:6379"
    environment   = var.environment
  })
}
```

### 29. jsondecode() for parsing JSON config
```hcl
data "google_secret_manager_secret_version" "app_config" {
  secret = "app-config"
}

locals {
  config = jsondecode(data.google_secret_manager_secret_version.app_config.secret_data)
  db_host = local.config.database.host
  db_port = local.config.database.port
}
```

### 30. base64encode / base64decode
```hcl
locals {
  startup_script = base64encode(file("scripts/startup.sh"))
}

resource "google_compute_instance" "vm" {
  name         = "app"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  metadata = {
    startup-script = base64decode(local.startup_script)
  }

  boot_disk { initialize_params { image = "debian-cloud/debian-11" } }
  network_interface { network = "default" }
}
```

### 31. templatefile() for startup scripts
```hcl
resource "google_compute_instance" "web" {
  name         = "web-server"
  machine_type = "e2-standard-2"
  zone         = "us-central1-a"

  metadata = {
    startup-script = templatefile("${path.module}/templates/startup.sh.tpl", {
      db_host     = google_sql_database_instance.db.private_ip_address
      db_name     = "app"
      environment = var.environment
      redis_host  = google_redis_instance.cache.host
    })
  }

  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts" } }
  network_interface { subnetwork = google_compute_subnetwork.main.id }
}
```

### 32. cidrsubnet() for subnet allocation
```hcl
locals {
  vpc_cidr = "10.0.0.0/16"
  subnets = {
    app     = cidrsubnet(local.vpc_cidr, 4, 0)   # 10.0.0.0/20
    gke     = cidrsubnet(local.vpc_cidr, 4, 1)   # 10.0.16.0/20
    db      = cidrsubnet(local.vpc_cidr, 4, 2)   # 10.0.32.0/20
    tools   = cidrsubnet(local.vpc_cidr, 4, 3)   # 10.0.48.0/20
  }
}
```

### 33. cidrhost() for specific IP allocation
```hcl
locals {
  vpc_cidr   = "10.0.0.0/16"
  gateway_ip = cidrhost(local.vpc_cidr, 1)   # 10.0.0.1
  nat_ip     = cidrhost(local.vpc_cidr, 2)   # 10.0.0.2
}
```

### 34. Complex label generation with functions
```hcl
locals {
  git_sha_short = substr(var.git_sha, 0, 7)
  deploy_date   = formatdate("YYYYMMDD", timestamp())

  resource_labels = {
    environment  = lower(var.environment)
    team         = replace(lower(var.team_name), " ", "-")
    version      = local.git_sha_short
    deploy_date  = local.deploy_date
    managed_by   = "terraform"
  }
}
```

---

## Advanced

### 35. setintersection() — common elements
```hcl
locals {
  required_apis = toset(["compute.googleapis.com", "container.googleapis.com"])
  enabled_apis  = toset([for s in data.google_project_service.enabled : s.service])
  missing_apis  = setsubtract(local.required_apis, local.enabled_apis)
}
```

### 36. setunion() and setsubtract()
```hcl
locals {
  base_scopes = toset([
    "https://www.googleapis.com/auth/cloud-platform",
  ])
  extra_scopes = toset([
    "https://www.googleapis.com/auth/devstorage.read_only",
  ])
  all_scopes = setunion(local.base_scopes, local.extra_scopes)
}
```

### 37. one() — extract single item from set
```hcl
data "google_compute_zones" "primary" {
  region = var.region
  status = "UP"
}

locals {
  # one() errors if set has != 1 element
  # Use only when exactly one result is expected:
  # zone = one([for z in data.google_compute_zones.primary.names : z if endswith(z, "-a")])
}
```

### 38. indent() for multi-line template values
```hcl
locals {
  policy_yaml = templatefile("policy.yaml.tpl", {
    rules = indent(4, join("\n", [for r in var.rules : "- ${r}"]))
  })
}
```

### 39. abspath() and path functions
```hcl
locals {
  module_path = abspath(path.module)
  root_path   = abspath(path.root)
  cwd         = abspath(path.cwd)
  script      = "${path.module}/scripts/deploy.sh"
}
```

### 40. timestamp() and formatdate()
```hcl
locals {
  created_at  = timestamp()
  date_label  = formatdate("YYYY-MM-DD", timestamp())
  rotate_date = timeadd(timestamp(), "720h")   # 30 days from now
}

resource "google_storage_bucket" "snapshot" {
  name   = "snapshot-${formatdate("YYYYMMDD", timestamp())}"
  location = "US"
}
```

### 41. sha256() and md5() for content hashing
```hcl
locals {
  script_hash = sha256(file("${path.module}/scripts/startup.sh"))
}

resource "google_compute_instance" "vm" {
  name = "app"
  metadata = {
    startup-script     = file("${path.module}/scripts/startup.sh")
    startup-script-sha = local.script_hash
  }
  # ...
}
```

### 42. uuidv5() for stable UUIDs
```hcl
locals {
  resource_uuid = uuidv5("dns", "my-gcp-resource.example.com")
}
```

### 43. sensitive() — mark runtime value sensitive
```hcl
locals {
  db_url = sensitive(
    "postgresql://${var.db_user}:${var.db_password}@${google_sql_database_instance.db.private_ip_address}:5432/app"
  )
}
```

### 44. nonsensitive() — unwrap sensitive (use carefully)
```hcl
output "db_host_only" {
  value = nonsensitive(google_sql_database_instance.db.private_ip_address)
  # Safe: IP address alone is not sensitive
}
```

### 45. Complex subnet calculation for multi-region
```hcl
locals {
  base_cidr = "10.0.0.0/8"
  regions = ["us-central1", "europe-west1", "asia-east1"]

  region_cidrs = {
    for idx, region in local.regions :
    region => cidrsubnet(local.base_cidr, 8, idx)
    # us-central1: 10.0.0.0/16, europe-west1: 10.1.0.0/16, etc.
  }
}
```

### 46. Dynamic IAM member list construction
```hcl
locals {
  gke_sa_email  = google_service_account.gke_sa.email
  app_sa_emails = [for sa in google_service_account.app_sas : sa.email]
  ci_sa_emails  = [for sa in google_service_account.ci_sas : sa.email]

  all_viewer_members = concat(
    ["serviceAccount:${local.gke_sa_email}"],
    [for e in local.app_sa_emails : "serviceAccount:${e}"],
  )
}
```

### 47. parseint() for numeric string conversion
```hcl
locals {
  disk_size = parseint(split("/", "pd-ssd/100")[1], 10)  # 100
}
```

### 48. tostring() for type coercion in labels
```hcl
locals {
  labels = {
    replica_count = tostring(var.replica_count)   # labels must be strings
    disk_size_gb  = tostring(var.disk_size_gb)
    ha_enabled    = tostring(var.ha_enabled)
  }
}
```

### 49. null coalescing pattern
```hcl
variable "custom_network" {
  type    = string
  default = null
}

locals {
  network = var.custom_network != null ? var.custom_network : google_compute_network.default.id
}
```

### 50. Full function composition for GCP resource naming
```hcl
locals {
  # Normalize and validate all naming inputs
  raw_name    = var.service_name
  env         = lower(terraform.workspace)
  region_code = substr(replace(var.region, "-", ""), 0, 6)  # "uscentr"
  git_short   = substr(coalesce(var.git_sha, "local"), 0, 7)

  # Build consistent name: app-prod-uscentr-a1b2c3d (max 63 chars)
  resource_name = lower(join("-", compact([
    local.raw_name,
    local.env,
    local.region_code,
    local.git_short,
  ])))

  safe_name = replace(local.resource_name, "_", "-")

  # Shared labels for all resources
  labels = merge(
    var.extra_labels,
    {
      service     = local.raw_name
      environment = local.env
      region      = var.region
      git_sha     = local.git_short
      managed_by  = "terraform"
    }
  )
}

resource "google_storage_bucket" "app_data" {
  name     = "${local.safe_name}-data"
  location = "US"
  labels   = local.labels
}
```
