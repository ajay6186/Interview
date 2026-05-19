# Examples 1.3 — Variables & Outputs (GCP) (50 examples)

> **Topic Overview:** Variables and outputs in GCP Terraform work identically to AWS — the same type system, validation rules, sensitivity controls, and precedence order apply. GCP-specific considerations: `project_id` is almost always a required variable (GCP resources require explicit project assignment in some resources), labels must be lowercase (use validation), and `self_link` outputs are often needed alongside `id` outputs since many GCP resources accept one form or the other. The `optional()` modifier (Terraform 1.3+) is particularly valuable for GCP modules with complex Cloud SQL and GKE configurations.

---

## Basic

### 1. String variable

> `project_id` is the most important GCP variable — it's the string identifier of your GCP project (e.g., `my-project-123456`). No default is provided, making it required — the caller must always specify it. In GCP, project IDs are globally unique, lowercase, and between 6-30 characters. Declare it without a default to prevent accidental deployment to the wrong project.

```hcl
variable "project_id" {
  type        = string
  description = "GCP project ID"
}
```

### 2. Variable with default value

> `region` defaults to `"us-central1"` — one of GCP's most available regions with good multi-zone support. Setting a sensible default means callers can omit the region for non-critical deployments. For production modules, consider not providing a default for region to force explicit selection and avoid accidental deployments to the wrong region.

```hcl
variable "region" {
  type    = string
  default = "us-central1"
}
```

### 3. Number variable

> `node_count` with a default of `3` is typical for GKE node pools — three nodes across three zones provides high availability with minimal cost. Unlike strings, number variables accept both integers and decimals. Terraform will type-coerce — passing `"3"` as a string will work if the context expects a number.

```hcl
variable "node_count" {
  type    = number
  default = 3
}
```

### 4. Boolean variable

> `enable_deletion_protection` defaults to `true` for safety. Boolean variables accept `true`/`false` in HCL or `"true"`/`"false"` strings from environment variables (`TF_VAR_enable_deletion_protection=false`). Setting this as a variable (rather than hardcoding) allows CI/CD pipelines to disable it for teardown of ephemeral environments.

```hcl
variable "enable_deletion_protection" {
  type    = bool
  default = true
}
```

### 5. Simple output

> The minimal output definition — a name and value. The `value` evaluates the GCS bucket's `name` attribute after creation. Outputs from the root module are displayed after `terraform apply` and accessible via `terraform output`. Module outputs are referenced by callers as `module.<name>.<output_name>`.

```hcl
output "bucket_name" {
  value = google_storage_bucket.my_bucket.name
}
```

### 6. Output with description

> The `network_interface[0].access_config[0].nat_ip` path traverses nested blocks to get the VM's public IP. `[0]` indexes the first item in repeated blocks. The `description` documents what the output contains and how it's used — important for module consumers who shouldn't need to read the source to understand what an output means.

```hcl
output "vm_ip" {
  description = "The public IP of the VM instance"
  value       = google_compute_instance.vm.network_interface[0].access_config[0].nat_ip
}
```

### 7. Using a variable in a resource

> `var.environment` in the bucket name ensures unique, identifiable resource names per environment. GCS bucket names are globally unique — `app-prod-data` and `app-dev-data` are separate buckets. This prevents dev and prod from colliding. Always include environment in GCS bucket names since you can't create two buckets with the same name in GCP.

```hcl
variable "environment" {
  type = string
}

resource "google_storage_bucket" "app" {
  name     = "app-${var.environment}-data"
  location = "US"
}
```

### 8. Passing variable via CLI

> `-var="key=value"` passes individual values at the command line. Multiple `-var` flags override in order. CLI variables have the highest precedence — they override tfvars files and environment variables. Use for one-off values or secrets in CI/CD; use tfvars files for environment-specific configuration that's checked into version control.

```bash
terraform apply -var="project_id=my-gcp-project"
terraform apply -var="region=europe-west1" -var="environment=prod"
```

### 9. Variable via .tfvars file

> `terraform.tfvars` is automatically loaded if present in the working directory. It's the standard place for environment-specific configuration. Check `terraform.tfvars` into version control for non-sensitive defaults; use `.gitignore` for `*.tfvars` files containing secrets. GCP project IDs are not secrets and can be committed.

```hcl
# terraform.tfvars
project_id  = "my-gcp-project"
region      = "us-central1"
environment = "production"
```

### 10. Passing a .tfvars file explicitly

> `-var-file` loads a specific tfvars file. Multiple `-var-file` flags merge in order (later files override earlier ones). The standard pattern for multi-environment deployments: `terraform apply -var-file="production.tfvars"` for prod, `terraform apply -var-file="staging.tfvars"` for staging, using the same code but different configurations.

```bash
terraform apply -var-file="production.tfvars"
terraform plan  -var-file="staging.tfvars"
```

### 11. Environment variable for input

> `TF_VAR_<name>` environment variables are the standard way to pass secrets to Terraform in CI/CD — they don't appear in command line history and can be injected by secret management systems. The variable name is case-sensitive: `TF_VAR_project_id` maps to `var.project_id`. These have lower precedence than `-var` flags.

```bash
export TF_VAR_project_id="my-gcp-project"
export TF_VAR_environment="production"
terraform apply
```

### 12. Sensitive output

> `sensitive = true` hides the output value from `terraform apply` and `terraform output` terminal display — it shows as `(sensitive value)`. The value IS stored in state (in plaintext) and IS accessible via `terraform output -raw db_password`. Cloud SQL passwords should always be marked sensitive. Consider writing them directly to Secret Manager instead.

```hcl
output "db_password" {
  value     = google_sql_user.app_user.password
  sensitive = true
}
```

---

## Intermediate

### 13. List variable

> A `list(string)` variable for allowed GCP regions. Lists maintain order and allow duplicates. Use this to validate deployments to an approved list of regions (perhaps for data residency compliance). Access individual elements with `var.allowed_regions[0]`, or use in `for_each = toset(var.allowed_regions)` to deploy to all regions.

```hcl
variable "allowed_regions" {
  type    = list(string)
  default = ["us-central1", "europe-west1", "asia-east1"]
}
```

### 14. Map variable

> A `map(string)` variable maps environment names to GCP machine types. Direct indexing `var.machine_types[var.environment]` errors if the key doesn't exist — use `lookup(var.machine_types, var.environment, "e2-micro")` for a safe default. `e2-*` machine types are cost-optimized; `n2-*` are balanced; `c2-*` are compute-optimized.

```hcl
variable "machine_types" {
  type = map(string)
  default = {
    dev  = "e2-micro"
    staging = "e2-medium"
    prod = "e2-standard-4"
  }
}

resource "google_compute_instance" "vm" {
  machine_type = var.machine_types[var.environment]
  # ...
}
```

### 15. Object variable

> An `object()` type groups related Cloud SQL configuration. This is better than three separate variables: callers provide a structured config block, and the variable's `default` shows the minimal (dev) configuration. Production callers override with `db-custom-2-7680` tier and `REGIONAL` availability. The object type enforces that all required fields are present.

```hcl
variable "db_config" {
  type = object({
    tier              = string
    availability_type = string
    disk_size         = number
  })
  default = {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 20
  }
}
```

### 16. Variable validation

> Validation blocks enforce business rules at plan time with clear error messages. `contains(["dev", "staging", "prod"], var.environment)` prevents typos like `"production"` or `"Development"` that would create misnamed resources without failing loudly. The `condition` must be a boolean expression using only the variable being validated — you can't reference other variables.

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

### 17. Variable validation with regex

> `can(regex(pattern, value))` returns `true` if the string matches the pattern — `can()` converts the regex error into `false` instead of throwing. GCP project IDs have specific requirements: lowercase, start with letter, 6-30 chars. Validating at plan time (before any API call) gives engineers immediate feedback instead of a confusing GCP API error about invalid project IDs.

```hcl
variable "project_id" {
  type = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be a valid GCP project identifier."
  }
}
```

### 18. Output depends_on

> `depends_on` on an output delays its computation until the listed resources are ready. Here the Cloud Run service URL should only be output after the IAM member resource that grants public access is created — otherwise callers might try to access the URL before it's publicly accessible. `depends_on` on outputs is rare but useful for ordering guarantees.

```hcl
output "service_url" {
  value       = google_cloud_run_v2_service.app.uri
  description = "Cloud Run service URL"
  depends_on  = [google_cloud_run_v2_service_iam_member.public]
}
```

### 19. Nullable variable

> `nullable = true` (the default) allows callers to pass `null` explicitly, which replaces the `default` value with `null`. `nullable = false` means passing `null` uses the default instead. Use `nullable = true` for optional endpoints where `null` means "don't configure this" — the resource can check `var.custom_endpoint != null` before using the value.

```hcl
variable "custom_endpoint" {
  type     = string
  default  = null
  nullable = true
}
```

### 20. Tuple variable

> `tuple([string, string])` defines a fixed-length list where each element has a specific type and position. Unlike `list(string)` (variable length), tuples are fixed-width. Use tuples for config that always has exactly N elements with positional meaning — like `[primary_cidr, secondary_cidr]`. Attempting to pass more or fewer elements causes a plan error.

```hcl
variable "cidr_blocks" {
  type = tuple([string, string])
  default = ["10.0.0.0/24", "10.1.0.0/24"]
}
```

### 21. Output a resource attribute map

> A `for` expression in an output generates a map from `for_each` resources. Here `google_storage_bucket.buckets` is created with `for_each`, so it's itself a map — the `for` expression transforms it into a map of bucket name → URL. This output structure is useful for module consumers who need to look up bucket URLs by logical name.

```hcl
output "bucket_urls" {
  value = {
    for k, bucket in google_storage_bucket.buckets :
    k => bucket.url
  }
}
```

### 22. Sensitive variable

> `sensitive = true` on a variable prevents its value from appearing in plan/apply output. The value is redacted as `(sensitive value)` in terminal output. Use for passwords, API keys, and private keys. Note: Terraform still processes the value normally — sensitive just controls display. The value IS visible in state files and `.terraform/` directory.

```hcl
variable "db_password" {
  type      = string
  sensitive = true
}
```

### 23. Output from count resources

> When a resource uses `count`, it creates a list of instances. The splat operator `[*]` expands all instances and extracts the same attribute from each — `google_compute_instance.vm[*].network_interface[0].network_ip` returns a `list(string)` of all VMs' private IPs. Consumers of this output index into it: `module.compute.vm_ips[0]`.

```hcl
output "vm_ips" {
  value = google_compute_instance.vm[*].network_interface[0].network_ip
}
```

### 24. Output from for_each resources

> When a resource uses `for_each`, it creates a map keyed by the `for_each` keys. The output `for` expression transforms the resource map into a map of keys → self_links. Unlike `count` resources (indexed by integer), `for_each` outputs are maps (indexed by string keys) — much more usable for downstream resources that need to find a specific instance by name.

```hcl
output "bucket_self_links" {
  value = {
    for k, b in google_storage_bucket.buckets : k => b.self_link
  }
}
```

### 25. Variable precedence (low → high)

> GCP-specific note: `GOOGLE_PROJECT` and `GOOGLE_REGION` environment variables are read by the GCP *provider* configuration, not Terraform's variable system. `TF_VAR_*` variables are different — they map to Terraform variables. The precedence order shown is critical for debugging "why is my variable value wrong?" in CI/CD pipelines.

```bash
# 1. Default values in variable blocks
# 2. terraform.tfvars
# 3. *.auto.tfvars (alphabetical)
# 4. -var-file flags
# 5. -var flags
# 6. TF_VAR_* environment variables (actually #2, below tfvars)
```

---

## Nested

### 26. Nested object variable for GKE

> A nested object variable captures the full GKE cluster configuration hierarchy: cluster-level settings and a list of node pool definitions. Each node pool is an object with name, machine type, and autoscaling bounds. This interface lets callers configure multiple differently-sized node pools (e.g., a `"general"` pool and a `"gpu"` pool) in a single variable.

```hcl
variable "gke_config" {
  type = object({
    name     = string
    location = string
    node_pools = list(object({
      name         = string
      machine_type = string
      min_nodes    = number
      max_nodes    = number
    }))
  })
}
```

### 27. Complex map of objects variable

> A `map(object(...))` variable allows callers to define multiple GCS buckets with different configurations. The map key is the logical name (`"logs"`, `"backups"`), and the object defines all per-bucket settings. This drives `for_each = var.buckets` in the resource — adding a new bucket only requires adding an entry to the variable.

```hcl
variable "buckets" {
  type = map(object({
    location       = string
    storage_class  = string
    versioning     = bool
    lifecycle_age  = number
  }))
  default = {
    logs = {
      location      = "US"
      storage_class = "NEARLINE"
      versioning    = false
      lifecycle_age = 30
    }
    backups = {
      location      = "EU"
      storage_class = "COLDLINE"
      versioning    = true
      lifecycle_age = 365
    }
  }
}
```

### 28. Using nested variable in for_each resource

> Consuming the `var.buckets` map variable with `for_each` creates one bucket per entry. `each.key` is the map key (`"logs"`, `"backups"`), `each.value.location` etc. access object fields. The nested `versioning {}` and `lifecycle_rule {}` blocks use `each.value` fields — this elegantly maps a declarative variable to complex nested resource blocks.

```hcl
resource "google_storage_bucket" "configured" {
  for_each      = var.buckets
  name          = "app-${each.key}-bucket"
  location      = each.value.location
  storage_class = each.value.storage_class

  versioning {
    enabled = each.value.versioning
  }

  lifecycle_rule {
    condition { age = each.value.lifecycle_age }
    action    { type = "Delete" }
  }
}
```

### 29. Output nested object

> Grouping related VPC attributes into a single structured output creates a clean interface. Consumers reference `module.network.vpc_info.network_id`, `module.network.vpc_info.subnet_ids`, etc. The `for` expression inside the output collects all subnet IDs into a list. Adding more attributes to this output is backwards-compatible — consumers only read what they need.

```hcl
output "vpc_info" {
  value = {
    network_id   = google_compute_network.vpc.id
    network_name = google_compute_network.vpc.name
    subnet_ids   = [for s in google_compute_subnetwork.subnets : s.id]
    gateway_ip   = google_compute_subnetwork.main.gateway_address
  }
}
```

### 30. Variable with optional object fields (Terraform 1.3+)

> `optional(type, default)` marks object fields as optional with a default value. Callers can omit `disk_size`, `labels`, and `spot` and get sensible defaults. This is far better than requiring all fields or using `type = any` — the structure is documented, typed, and partially required. The `spot = true` default would be unusual here (false is safer), but the pattern is clear.

```hcl
variable "vm_config" {
  type = object({
    machine_type = string
    zone         = string
    disk_size    = optional(number, 50)
    labels       = optional(map(string), {})
    spot         = optional(bool, false)
  })
}
```

### 31. Output with complex transformation

> Transforming `for_each` Cloud Run services into a map of name → `{url, region}` objects. This output is useful for API gateway configuration, DNS record generation, or monitoring setup — consumers need both the URL and the region. The `for` expression in outputs is the primary tool for reshaping resource maps into the structure consumers need.

```hcl
output "service_endpoints" {
  value = {
    for name, svc in google_cloud_run_v2_service.services :
    name => {
      url    = svc.uri
      region = svc.location
    }
  }
}
```

### 32. Chained variable defaults using local

> `coalesce(var.project_id, data.google_project.current.project_id)` returns the first non-null, non-empty value. If the caller provides `project_id`, use it; otherwise auto-discover from the current authenticated project. This pattern makes `project_id` optional without using `default = null` on the variable — the local provides the effective value used throughout the configuration.

```hcl
variable "project_id" {
  type    = string
  default = null
}

locals {
  project_id = coalesce(var.project_id, data.google_project.current.project_id)
}
```

### 33. Variable for a list of firewall rules

> A `list(object(...))` variable for firewall rules enables declarative, data-driven firewall management. The `for_each = { for r in var.firewall_rules : r.name => r }` converts the list to a map (keyed by rule name) suitable for `for_each`. Adding a new firewall rule only requires adding an entry to the variable — no HCL changes needed.

```hcl
variable "firewall_rules" {
  type = list(object({
    name          = string
    protocol      = string
    ports         = list(string)
    source_ranges = list(string)
  }))
}

resource "google_compute_firewall" "rules" {
  for_each = { for r in var.firewall_rules : r.name => r }

  name    = each.value.name
  network = google_compute_network.vpc.name

  allow {
    protocol = each.value.protocol
    ports    = each.value.ports
  }

  source_ranges = each.value.source_ranges
}
```

### 34. Passing outputs between modules

> Module output chaining is the standard way to connect GCP resources across modules. The networking module exposes `network_id` and `subnet_id`; the compute module accepts them as variables. This creates an explicit dependency — Terraform applies the networking module before the compute module. Always use output references (not hardcoded IDs) to maintain proper dependency tracking.

```hcl
module "networking" {
  source = "./modules/networking"
}

module "compute" {
  source     = "./modules/compute"
  network_id = module.networking.network_id
  subnet_id  = module.networking.subnet_id
}
```

---

## Advanced

### 35. Ephemeral variable (Terraform 1.10+)

> `ephemeral = true` on a variable (Terraform 1.10+) means the value is never stored in state, plan files, or logs — it only exists in memory during the current operation. Use for OAuth tokens, short-lived credentials, and session tokens that would be useless (and potentially harmful) if stored. Unlike `sensitive = true` (which hides display but stores), ephemeral truly doesn't persist.

```hcl
variable "oauth_token" {
  type      = string
  sensitive = true
  ephemeral = true
}
```

### 36. Output with precondition (Terraform 1.5+)

> An output `precondition` validates a condition before publishing the output value. Here it verifies the Cloud SQL instance has `REGIONAL` availability before exposing the connection string. This prevents callers from connecting to a non-HA database they might assume is HA based on the output name. Fails at apply time with a clear error if the condition is false.

```hcl
output "db_connection_string" {
  value = "postgresql://${google_sql_user.app.name}@${google_sql_database_instance.db.private_ip_address}:5432/${google_sql_database.app_db.name}"

  precondition {
    condition     = google_sql_database_instance.db.settings[0].availability_type == "REGIONAL"
    error_message = "DB must be REGIONAL for production use."
  }
}
```

### 37. Variable-driven conditional resource

> `count = var.create_nat_gateway ? 1 : 0` is the standard boolean flag pattern for optional resources. `google_compute_router_nat` (Cloud NAT) is expensive — you only want it in environments that need internet egress from private VMs. Setting `create_nat_gateway = false` (the default) for dev/test environments saves cost while production sets it to `true`.

```hcl
variable "create_nat_gateway" {
  type    = bool
  default = false
}

resource "google_compute_router_nat" "nat" {
  count  = var.create_nat_gateway ? 1 : 0
  name   = "cloud-nat"
  router = google_compute_router.router.name
  region = "us-central1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
```

### 38. Any type variable for flexibility

> `type = any` accepts any value type — useful for an `extra_labels` variable that callers can pass as a map of strings without strict typing. Combine with `merge()` to layer extra labels onto common labels. Use `type = any` sparingly — it bypasses Terraform's type checking. Prefer `map(string)` when you know the structure; use `any` only for truly dynamic structures.

```hcl
variable "extra_labels" {
  type    = any
  default = {}
}

locals {
  common_labels = merge({
    managed_by  = "terraform"
    environment = var.environment
  }, var.extra_labels)
}
```

### 39. Variables for multi-region deployment

> A `map(object(...))` variable drives multi-region deployments with `for_each`. The map keys (`"primary"`, `"secondary"`) are logical names — more meaningful than region names as keys. Each object contains region, zone, and CIDR. Using `for_each = var.regions` creates one set of infrastructure per entry. Adding a tertiary region only requires adding an entry.

```hcl
variable "regions" {
  type = map(object({
    region = string
    zone   = string
    cidr   = string
  }))
  default = {
    primary = {
      region = "us-central1"
      zone   = "us-central1-a"
      cidr   = "10.0.0.0/20"
    }
    secondary = {
      region = "europe-west1"
      zone   = "europe-west1-b"
      cidr   = "10.1.0.0/20"
    }
  }
}
```

### 40. Output all GKE cluster details

> GKE cluster outputs are marked `sensitive = true` because they contain the cluster endpoint and CA certificate — together they're equivalent to a kubeconfig that grants Kubernetes API access. The `for` expression over multiple GKE clusters provides a complete inventory. Consumers use `terraform output -json gke_clusters` to retrieve the data for kubeconfig generation.

```hcl
output "gke_clusters" {
  sensitive = true
  value = {
    for name, cluster in google_container_cluster.clusters :
    name => {
      endpoint               = cluster.endpoint
      ca_certificate         = cluster.master_auth[0].cluster_ca_certificate
      cluster_id             = cluster.id
    }
  }
}
```

### 41. Secret Manager variable integration

> Reading secrets from GCP Secret Manager is the recommended pattern for database passwords and API keys. `data.google_secret_manager_secret_version.db_password.secret_data` retrieves the latest version of the secret. This avoids storing secrets in tfvars files or environment variables — secrets stay in Secret Manager, and Terraform's access is controlled by IAM.

```hcl
data "google_secret_manager_secret_version" "db_password" {
  secret = "db-password"
}

locals {
  db_password = data.google_secret_manager_secret_version.db_password.secret_data
}

resource "google_sql_user" "app" {
  name     = "app"
  instance = google_sql_database_instance.db.name
  password = local.db_password
}
```

### 42. Variable with cross-validation using locals

> Cross-variable validation (one variable's value relative to another) isn't supported in `validation` blocks — they can only reference their own variable. The workaround: a `locals` block with a forced error using `tobool("error message")`. If `min_nodes > max_nodes`, this local's evaluation throws an error with the message. It's a hack, but it works for cross-variable constraints in Terraform < 1.9.

```hcl
variable "min_nodes" {
  type    = number
  default = 1
}

variable "max_nodes" {
  type    = number
  default = 5
}

locals {
  _ = (var.min_nodes <= var.max_nodes) ? null : tobool("min_nodes must be <= max_nodes")
}
```

### 43. Terragrunt-style tfvars for environment isolation

> Environment-specific tfvars files are the standard for Terragrunt users and teams using the directory-per-environment pattern. Each file contains all environment-specific values. These files are committed to version control (non-sensitive values) or partially template-generated (substituting secret values). The GCP project ID differs per environment — crucial for preventing cross-environment resource creation.

```bash
# environments/prod/terraform.tfvars
project_id        = "prod-project-123"
environment       = "prod"
region            = "us-central1"
enable_deletion_protection = true
db_tier           = "db-custom-8-30720"
```

### 44. Output for CI/CD consumption

> `jsonencode()` in an output produces a JSON string that CI/CD pipelines can parse with `terraform output -raw deployment_info | jq .url`. This captures the complete deployment context in a single parseable output. `latest_ready_revision` is the Cloud Run revision identifier — useful for deployment tracking, rollback scripts, and monitoring dashboards.

```hcl
output "deployment_info" {
  value = jsonencode({
    project  = var.project_id
    region   = var.region
    service  = google_cloud_run_v2_service.app.name
    url      = google_cloud_run_v2_service.app.uri
    revision = google_cloud_run_v2_service.app.latest_ready_revision
  })
}
```

### 45. Using outputs in remote module

> Extracting specific values from Terraform outputs in scripts. `-json` returns all outputs as a JSON object; pipe to `jq` to extract specific values. `-raw` returns a scalar value without quotes — the most common pattern for shell scripts. These are the commands CI/CD pipelines use after `terraform apply` to capture infrastructure details for downstream deployment steps.

```bash
terraform output -json | jq '.bucket_name.value'
terraform output -raw vm_ip
```

### 46. Variable for organization-level configuration

> An organization-level configuration variable captures the hierarchy: org ID (numeric), billing account ID, and a map of folders. This is used by modules that manage GCP Organization resources — creating projects, folders, and org policies. The nested `map(object(...))` for `folders` allows flexible folder hierarchies without changing the module interface.

```hcl
variable "org_config" {
  type = object({
    org_id          = string
    billing_account = string
    folders = map(object({
      display_name = string
      parent       = string
    }))
  })
}
```

### 47. Output with for expression filtering

> A `for` expression with an `if` condition filters the output — only VMs with the `environment = "production"` label are included. This is useful when a module manages VMs across environments and consumers only want specific ones. The `if` clause comes after the `=>` pair and before the closing `}` in map for expressions: `for k, v in map : k => v.attr if condition`.

```hcl
output "production_vms" {
  value = {
    for k, vm in google_compute_instance.fleet :
    k => vm.network_interface[0].network_ip
    if vm.labels["environment"] == "production"
  }
}
```

### 48. Sensitive output with masking

> `base64decode()` converts the base64-encoded private key from `google_service_account_key` back to the JSON key file content. Marking the output sensitive prevents it from displaying in logs. Access it via `terraform output -raw service_account_key`. Note: service account keys in Terraform state are a security concern — prefer Workload Identity Federation and avoid key-based authentication in production.

```hcl
output "service_account_key" {
  value     = base64decode(google_service_account_key.key.private_key)
  sensitive = true
}
# Access via: terraform output -raw service_account_key
```

### 49. Variable default using can() for safe parsing

> A disk size variable with range validation using numeric comparisons. `var.disk_size_gb >= 10` ensures the minimum for any disk (GCP minimum), and `<= 65536` is GCP's maximum disk size. This validation runs at plan time — providing a 0 or negative disk size would cause a confusing GCP API error without validation, but with it you get a clear message immediately.

```hcl
variable "disk_size_gb" {
  type = number
  validation {
    condition     = var.disk_size_gb >= 10 && var.disk_size_gb <= 65536
    error_message = "Disk size must be between 10 GB and 65536 GB."
  }
}
```

### 50. Full variable and output pattern for a GCP module

> The complete module interface pattern: flat scalar variables for simple values, an `object()` type for complex nested config with defaults for optional fields, and structured outputs. `sensitive = true` on the cluster endpoint protects it from log exposure. `self_link` and `id` outputs both provided since different GCP resources need different reference formats.

```hcl
# variables.tf
variable "project_id"   { type = string }
variable "region"       { type = string; default = "us-central1" }
variable "environment"  { type = string }
variable "vpc_cidr"     { type = string; default = "10.0.0.0/16" }
variable "enable_nat"   { type = bool;   default = true }

variable "node_pool" {
  type = object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
  })
  default = {
    machine_type = "e2-standard-4"
    min_nodes    = 1
    max_nodes    = 5
  }
}

# outputs.tf
output "cluster_endpoint"  { value = google_container_cluster.gke.endpoint; sensitive = true }
output "network_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_id"         { value = google_compute_subnetwork.main.id }
output "service_account"   { value = google_service_account.gke_sa.email }
```

---

## Key Takeaways

- **`project_id` is required** in almost every GCP module — no default forces explicit project selection, preventing accidental cross-project deployments
- **Labels must be lowercase** — validate with `condition = var.label_value == lower(var.label_value)` to catch uppercase labels before GCP API rejects them
- **`self_link` vs `id`** — some GCP resources require `self_link` (full URL), others accept `id`; output both from modules when the resource type is commonly referenced by other resources
- **`optional(type, default)`** (Terraform 1.3+) is essential for GCP module design — Cloud SQL and GKE have 20+ configuration options; make non-critical ones optional
- **Secret Manager integration** via `google_secret_manager_secret_version` data source is the GCP-native way to inject secrets — avoids secrets in state, tfvars files, or environment variables
- **`sensitive = true` on cluster outputs** (GKE endpoint, CA cert) protects credentials from log exposure while keeping them accessible via `terraform output -raw`
- **Cross-variable validation** uses the `locals` hack (`tobool("error message")`) since validation blocks can't reference other variables in Terraform < 1.9
- **`ephemeral = true`** (Terraform 1.10+) prevents OAuth tokens and session credentials from persisting in state files
- **`jsonencode()` outputs** are the CI/CD interface pattern — one structured output parsed with `jq` beats many scalar outputs

---

## Common Interview Questions & Answers

**Q: What is the variable precedence order in Terraform? Which source wins?**
A: From lowest to highest priority: (1) default values in variable blocks, (2) `terraform.tfvars` (auto-loaded), (3) `*.auto.tfvars` files (alphabetical), (4) `-var-file` flags (in order), (5) `-var` CLI flags. Confusingly, `TF_VAR_*` environment variables are actually processed between (1) and (2) — they override defaults but are overridden by tfvars files. The last `-var` flag wins if multiple `-var` flags set the same variable. In CI/CD, use `-var` flags for the most critical values since they always win.

**Q: What's the difference between `sensitive = true` on a variable vs. on an output?**
A: On a variable: the value is redacted in plan/apply output — `(sensitive value)` instead of the actual content. The value IS still passed to resources normally. On an output: the value is hidden in `terraform output` and apply output — `(sensitive value)`. It IS stored in state. The value IS accessible via `terraform output -raw <name>`. Key insight: `sensitive` only controls display, not storage. For values that shouldn't be in state at all, use `ephemeral = true` (Terraform 1.10+). Always mark database passwords, API keys, and private keys as sensitive.

**Q: How do you share values between Terraform modules in GCP — module outputs or `terraform_remote_state`?**
A: Two patterns: (1) **Module outputs** for values within the same root module — `module.networking.network_id` passes the VPC ID to the compute module. This is clean and Terraform manages dependencies automatically. (2) **`terraform_remote_state`** for values across separate Terraform stacks (separate state files) — the VPC stack exposes `network_id` as an output, and the app stack reads it via `data "terraform_remote_state" "vpc" { backend = "gcs" ... }`. Use module outputs when possible; remote state when stacks are independently deployable.

**Q: How do you validate that a GCS bucket name meets GCP's naming requirements in Terraform?**
A: Use a variable validation block with regex: `condition = can(regex("^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$", var.bucket_name))`. This enforces: starts and ends with alphanumeric, 3-63 chars total, allows lowercase letters, numbers, hyphens, underscores, and dots. Also add length validation: `length(var.bucket_name) >= 3 && length(var.bucket_name) <= 63`. Running validation at plan time with a clear error message prevents confusing GCP API errors like "bucket name invalid."

**Q: When would you use `type = any` for a variable, and what are the risks?**
A: Use `type = any` for: (1) extra labels/tags where the structure is `map(string)` but you want to accept an empty map `{}` naturally, (2) optional configuration objects where the entire structure may or may not be provided, (3) pass-through variables in wrapper modules where you don't want to duplicate the inner module's type definition. Risks: (1) Terraform can't validate the structure at plan time, so errors appear at apply time as obscure attribute access failures, (2) no documentation of what the variable expects — callers must read code to understand the expected structure, (3) future type changes don't show up in `terraform plan` diffs. Prefer specific types whenever the structure is known.
