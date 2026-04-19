# Examples 3.2 — Nested Modules (50 examples)

---

## Basic

### 1. Parent Module Calling a Child Module
```hcl
# root/main.tf
module "networking" {
  source  = "./modules/networking"
  project = var.project_id
  region  = var.region
  env     = var.env
}

module "compute" {
  source     = "./modules/compute"
  project    = var.project_id
  region     = var.region
  network_id = module.networking.vpc_id
  subnet_id  = module.networking.subnet_id
}
```

### 2. Passing Variables Between Nested Modules
```hcl
# root/main.tf
module "vpc" {
  source   = "./modules/networking/vpc"
  project  = "my-prod-project"
  name     = "vpc-prod"
  region   = "us-central1"
}

module "subnet" {
  source     = "./modules/networking/subnet"
  project    = "my-prod-project"
  vpc_name   = module.vpc.name
  vpc_id     = module.vpc.id
  region     = "us-central1"
  cidr_range = "10.10.0.0/20"
  name       = "subnet-app"
}
```

### 3. Output Chaining Between Modules
```hcl
# root/main.tf
module "sql" {
  source           = "./modules/data/cloudsql"
  project          = "my-prod-project"
  region           = "us-central1"
  instance_name    = "prod-postgres-01"
  vpc_network      = module.networking.vpc_self_link
  database_version = "POSTGRES_15"
}

module "app" {
  source          = "./modules/app/cloudrun"
  project         = "my-prod-project"
  region          = "us-central1"
  db_host         = module.sql.private_ip_address
  db_name         = module.sql.database_name
  db_user         = module.sql.user_name
  db_password_ref = module.sql.password_secret_id
}

# modules/data/cloudsql/outputs.tf
output "private_ip_address" {
  value = google_sql_database_instance.main.private_ip_address
}
output "database_name" {
  value = google_sql_database.app.name
}
output "user_name" {
  value = google_sql_user.app.name
}
output "password_secret_id" {
  value     = google_secret_manager_secret.db_password.id
  sensitive = true
}
```

### 4. Module Dependency via depends_on
```hcl
# root/main.tf
module "project_services" {
  source  = "./modules/project-services"
  project = "my-prod-project"
  services = [
    "compute.googleapis.com",
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
  ]
}

module "networking" {
  source  = "./modules/networking"
  project = "my-prod-project"
  region  = "us-central1"

  depends_on = [module.project_services]
}

module "gke" {
  source   = "./modules/gke"
  project  = "my-prod-project"
  region   = "us-central1"
  vpc_name = module.networking.vpc_name
  subnet   = module.networking.gke_subnet

  depends_on = [module.networking]
}
```

### 5. Provider Passing to Child Modules
```hcl
# root/main.tf
provider "google" {
  project = "my-prod-project"
  region  = "us-central1"
}

provider "google" {
  alias   = "europe"
  project = "my-prod-project"
  region  = "europe-west1"
}

module "us_infra" {
  source = "./modules/regional-infra"
  providers = {
    google = google
  }
  region = "us-central1"
}

module "eu_infra" {
  source = "./modules/regional-infra"
  providers = {
    google = google.europe
  }
  region = "europe-west1"
}
```

### 6. Module with count Calling Nested Module
```hcl
# root/main.tf
variable "environments" {
  type    = list(string)
  default = ["dev", "staging", "prod"]
}

module "per_env_infra" {
  count   = length(var.environments)
  source  = "./modules/environment"
  project = "my-prod-project"
  env     = var.environments[count.index]
  region  = "us-central1"
}

# modules/environment/main.tf
module "vpc" {
  source  = "../networking/vpc"
  project = var.project
  name    = "vpc-${var.env}"
  region  = var.region
}

module "gke" {
  source   = "../gke"
  project  = var.project
  env      = var.env
  vpc_name = module.vpc.name
  region   = var.region
}
```

### 7. Module with for_each Calling Nested Module
```hcl
# root/main.tf
variable "regions" {
  type = map(object({
    cidr     = string
    gke_cidr = string
  }))
  default = {
    us-central1  = { cidr = "10.10.0.0/20", gke_cidr = "10.100.0.0/16" }
    us-east1     = { cidr = "10.20.0.0/20", gke_cidr = "10.110.0.0/16" }
    europe-west1 = { cidr = "10.30.0.0/20", gke_cidr = "10.120.0.0/16" }
  }
}

module "regional" {
  for_each = var.regions
  source   = "./modules/regional-stack"
  project  = "my-prod-project"
  region   = each.key
  cidr     = each.value.cidr
  gke_cidr = each.value.gke_cidr
}
```

### 8. Nested Module File Structure
```hcl
# Directory layout:
# modules/
#   networking/
#     main.tf
#     variables.tf
#     outputs.tf
#     modules/
#       subnet/
#         main.tf
#         variables.tf
#         outputs.tf
#       firewall/
#         main.tf
#         variables.tf
#         outputs.tf

# modules/networking/main.tf
resource "google_compute_network" "vpc" {
  name                    = var.vpc_name
  project                 = var.project
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

module "subnets" {
  source   = "./modules/subnet"
  project  = var.project
  vpc_name = google_compute_network.vpc.name
  vpc_id   = google_compute_network.vpc.id
  subnets  = var.subnets
}

module "firewall" {
  source   = "./modules/firewall"
  project  = var.project
  vpc_name = google_compute_network.vpc.name
  rules    = var.firewall_rules
}
```

### 9. Module Composition Pattern
```hcl
# root/main.tf — composing from small, focused modules
module "vpc" {
  source  = "./modules/networking/vpc"
  project = "my-prod-project"
  name    = "vpc-prod"
  region  = "us-central1"
}

module "subnets" {
  source   = "./modules/networking/subnets"
  project  = "my-prod-project"
  vpc_id   = module.vpc.id
  vpc_name = module.vpc.name
  subnets  = local.subnet_configs
}

module "nat" {
  source     = "./modules/networking/nat"
  project    = "my-prod-project"
  region     = "us-central1"
  vpc_name   = module.vpc.name
  subnet_ids = module.subnets.subnet_ids
}

module "dns" {
  source   = "./modules/networking/dns"
  project  = "my-prod-project"
  vpc_id   = module.vpc.id
  vpc_name = module.vpc.name
  zones    = local.dns_zones
}
```

### 10. Module for GCP Network (VPC + Subnets + Firewall as Nested)
```hcl
# modules/networking/main.tf
variable "project"         { type = string }
variable "vpc_name"        { type = string }
variable "region"          { type = string }
variable "subnets"         { type = list(any) }
variable "firewall_rules"  { type = list(any) }

resource "google_compute_network" "vpc" {
  name                    = var.vpc_name
  project                 = var.project
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  mtu                     = 1460
}

module "subnets" {
  source   = "./modules/subnets"
  project  = var.project
  vpc_id   = google_compute_network.vpc.id
  vpc_name = google_compute_network.vpc.name
  region   = var.region
  subnets  = var.subnets
}

module "firewall" {
  source        = "./modules/firewall"
  project       = var.project
  vpc_name      = google_compute_network.vpc.name
  firewall_rules = var.firewall_rules
}

output "vpc_id"      { value = google_compute_network.vpc.id }
output "vpc_name"    { value = google_compute_network.vpc.name }
output "vpc_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_ids"  { value = module.subnets.subnet_ids }
output "subnet_self_links" { value = module.subnets.subnet_self_links }
```

### 11. Module for GKE (Cluster + Node Pools + IAM as Nested)
```hcl
# modules/gke/main.tf
module "cluster" {
  source          = "./modules/cluster"
  project         = var.project
  name            = var.cluster_name
  location        = var.location
  network         = var.network
  subnetwork      = var.subnetwork
  pods_range      = var.pods_ip_range_name
  services_range  = var.services_ip_range_name
  release_channel = var.release_channel
  master_cidr     = var.master_ipv4_cidr
}

module "node_pools" {
  source     = "./modules/node-pools"
  project    = var.project
  cluster_id = module.cluster.cluster_id
  location   = var.location
  node_pools = var.node_pools

  depends_on = [module.cluster]
}

module "iam" {
  source          = "./modules/iam"
  project         = var.project
  cluster_sa_email = module.cluster.node_service_account
  workload_identities = var.workload_identities

  depends_on = [module.cluster]
}

output "cluster_id"        { value = module.cluster.cluster_id }
output "cluster_endpoint"  { value = module.cluster.endpoint }
output "cluster_ca_cert"   { value = module.cluster.ca_certificate }
```

### 12. Module for Cloud SQL (Instance + Databases + Users as Nested)
```hcl
# modules/cloudsql/main.tf
module "instance" {
  source           = "./modules/instance"
  project          = var.project
  region           = var.region
  name             = var.instance_name
  database_version = var.database_version
  tier             = var.tier
  vpc_network      = var.vpc_network
  disk_size        = var.disk_size
  high_availability = var.high_availability
}

module "databases" {
  source      = "./modules/databases"
  project     = var.project
  instance    = module.instance.name
  databases   = var.databases

  depends_on = [module.instance]
}

module "users" {
  source    = "./modules/users"
  project   = var.project
  instance  = module.instance.name
  users     = var.users

  depends_on = [module.instance]
}

module "secrets" {
  source   = "./modules/secrets"
  project  = var.project
  instance = module.instance.name
  users    = module.users.user_passwords

  depends_on = [module.users]
}

output "instance_name"      { value = module.instance.name }
output "private_ip"         { value = module.instance.private_ip_address }
output "connection_name"    { value = module.instance.connection_name }
output "database_names"     { value = module.databases.names }
output "secret_ids"         { value = module.secrets.secret_ids }
```

---

## Intermediate

### 13. Module for Application (Cloud Run + IAM + Pub/Sub as Nested)
```hcl
# modules/application/main.tf
variable "project"    { type = string }
variable "region"     { type = string }
variable "app_name"   { type = string }
variable "image"      { type = string }
variable "env_vars"   { type = map(string) }
variable "invokers"   { type = list(string) }
variable "topics"     { type = list(string) }

module "service_account" {
  source       = "./modules/service-account"
  project      = var.project
  name         = "sa-${var.app_name}"
  display_name = "SA for ${var.app_name}"
  roles = [
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher",
  ]
}

module "cloud_run" {
  source     = "./modules/cloud-run"
  project    = var.project
  region     = var.region
  name       = var.app_name
  image      = var.image
  env_vars   = var.env_vars
  sa_email   = module.service_account.email
}

module "iam" {
  source       = "./modules/run-iam"
  project      = var.project
  region       = var.region
  service_name = module.cloud_run.name
  invokers     = var.invokers
}

module "pubsub" {
  source   = "./modules/pubsub"
  project  = var.project
  app_name = var.app_name
  topics   = var.topics
  push_endpoint = module.cloud_run.url
  push_sa_email = module.service_account.email
}
```

### 14. Module Output to Root Outputs
```hcl
# root/outputs.tf
output "vpc_id" {
  description = "The ID of the main VPC"
  value       = module.networking.vpc_id
}

output "gke_cluster_endpoint" {
  description = "GKE cluster API endpoint"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "gke_cluster_ca_cert" {
  description = "GKE cluster CA certificate"
  value       = module.gke.cluster_ca_cert
  sensitive   = true
}

output "sql_connection_name" {
  description = "Cloud SQL connection name for Cloud SQL proxy"
  value       = module.cloudsql.connection_name
}

output "app_url" {
  description = "Public URL of the Cloud Run service"
  value       = module.application.service_url
}

output "load_balancer_ip" {
  description = "External IP of the load balancer"
  value       = module.load_balancer.external_ip
}
```

### 15. Module for_each with Nested Resource for_each
```hcl
# root/main.tf
variable "service_configs" {
  type = map(object({
    image  = string
    region = string
    regions_secondary = list(string)
    env    = map(string)
  }))
}

module "services" {
  for_each = var.service_configs
  source   = "./modules/multi-region-service"
  project  = "my-prod-project"
  name     = each.key
  image    = each.value.image
  primary_region    = each.value.region
  secondary_regions = each.value.regions_secondary
  env_vars = each.value.env
}

# modules/multi-region-service/main.tf
resource "google_cloud_run_service" "primary" {
  name     = var.name
  location = var.primary_region
  project  = var.project
  template {
    spec {
      containers {
        image = var.image
        dynamic "env" {
          for_each = var.env_vars
          content { name = env.key; value = env.value }
        }
      }
    }
  }
}

resource "google_cloud_run_service" "secondary" {
  for_each = toset(var.secondary_regions)
  name     = "${var.name}-${each.value}"
  location = each.value
  project  = var.project
  template {
    spec {
      containers {
        image = var.image
        dynamic "env" {
          for_each = var.env_vars
          content { name = env.key; value = env.value }
        }
      }
    }
  }
}
```

### 16. Module Testing with terraform test
```hcl
# tests/networking.tftest.hcl
variables {
  project  = "test-project-12345"
  region   = "us-central1"
  vpc_name = "test-vpc"
  subnets = [
    {
      name      = "test-subnet"
      cidr      = "10.0.0.0/24"
      region    = "us-central1"
      secondary_ranges = []
    }
  ]
}

run "create_networking" {
  command = plan

  module {
    source = "./modules/networking"
  }

  assert {
    condition     = google_compute_network.vpc.name == "test-vpc"
    error_message = "VPC name must be test-vpc"
  }

  assert {
    condition     = google_compute_network.vpc.auto_create_subnetworks == false
    error_message = "VPC must not auto-create subnets"
  }
}

run "apply_and_verify" {
  command = apply

  module {
    source = "./modules/networking"
  }

  assert {
    condition     = length(module.subnets.subnet_ids) == 1
    error_message = "Expected exactly 1 subnet"
  }
}
```

### 17. Module Documentation Pattern (variables.tf)
```hcl
# modules/gke/variables.tf
variable "project" {
  description = "The GCP project ID where GKE resources will be created."
  type        = string

  validation {
    condition     = length(var.project) > 0
    error_message = "Project ID must not be empty."
  }
}

variable "cluster_name" {
  description = "The name of the GKE cluster. Must be unique within the project and location."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,38}[a-z0-9]$", var.cluster_name))
    error_message = "Cluster name must be 3-40 characters, lowercase alphanumeric and hyphens, must start with a letter."
  }
}

variable "location" {
  description = "The region or zone where the GKE cluster will run. Use a region for regional (HA) clusters."
  type        = string
  default     = "us-central1"
}

variable "release_channel" {
  description = "The release channel for GKE. One of: RAPID, REGULAR, STABLE."
  type        = string
  default     = "REGULAR"

  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE"], var.release_channel)
    error_message = "Release channel must be one of: RAPID, REGULAR, STABLE."
  }
}

variable "node_pools" {
  description = "List of node pool configurations."
  type = list(object({
    name         = string
    machine_type = string
    min_count    = number
    max_count    = number
    disk_size_gb = optional(number, 100)
    disk_type    = optional(string, "pd-ssd")
    spot         = optional(bool, false)
    labels       = optional(map(string), {})
    taints       = optional(list(object({
      key    = string
      value  = string
      effect = string
    })), [])
  }))
}
```

### 18. DRY Pattern with Deeply Nested Modules
```hcl
# modules/gcp-project-factory/main.tf
# This module sets up a complete GCP project with all standard resources.

module "project" {
  source          = "./modules/project"
  project_id      = var.project_id
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = var.folder_id
  labels          = var.labels
}

module "apis" {
  source   = "./modules/project-services"
  project  = module.project.project_id
  services = concat(var.default_services, var.additional_services)

  depends_on = [module.project]
}

module "iam" {
  source   = "./modules/project-iam"
  project  = module.project.project_id
  bindings = var.iam_bindings

  depends_on = [module.project]
}

module "networking" {
  source   = "./modules/networking"
  project  = module.project.project_id
  region   = var.primary_region
  config   = var.network_config

  depends_on = [module.apis]
}

module "observability" {
  source   = "./modules/observability"
  project  = module.project.project_id
  config   = var.observability_config

  depends_on = [module.project]
}
```

### 19. Complete 3-Tier GCP Infrastructure as Nested Modules (Networking/Compute/Data)
```hcl
# root/main.tf — 3-Tier Architecture
locals {
  project = "my-prod-project"
  region  = "us-central1"
  env     = "prod"
}

# Tier 1: Networking
module "networking" {
  source  = "./modules/networking"
  project = local.project
  region  = local.region
  env     = local.env
  vpc_name = "vpc-${local.env}"
  subnets = {
    app = {
      cidr   = "10.10.0.0/20"
      region = local.region
      secondary_ranges = {
        pods     = "10.100.0.0/16"
        services = "10.101.0.0/20"
      }
    }
    data = {
      cidr   = "10.11.0.0/24"
      region = local.region
      secondary_ranges = {}
    }
  }
  nat_regions    = [local.region]
  firewall_rules = local.firewall_rules
}

# Tier 2: Compute
module "compute" {
  source          = "./modules/compute"
  project         = local.project
  region          = local.region
  env             = local.env
  vpc_name        = module.networking.vpc_name
  app_subnet      = module.networking.subnet_self_links["app"]
  gke_pods_range  = "pods"
  gke_svc_range   = "services"
  cluster_config  = var.gke_config
  run_services    = var.cloud_run_services

  depends_on = [module.networking]
}

# Tier 3: Data
module "data" {
  source          = "./modules/data"
  project         = local.project
  region          = local.region
  env             = local.env
  vpc_network     = module.networking.vpc_self_link
  data_subnet     = module.networking.subnet_self_links["data"]
  postgres_config = var.postgres_config
  redis_config    = var.redis_config
  gcs_buckets     = var.gcs_buckets
  bq_datasets     = var.bq_datasets

  depends_on = [module.networking]
}

# Observability (cross-cutting)
module "observability" {
  source         = "./modules/observability"
  project        = local.project
  cluster_name   = module.compute.gke_cluster_name
  sql_instance   = module.data.sql_instance_name
  notification_channels = var.alert_notification_channels
  alert_policies = local.alert_policies

  depends_on = [module.compute, module.data]
}
```

### 20. Module for Shared VPC Host and Service Projects
```hcl
# modules/shared-vpc/main.tf
variable "host_project_id"    { type = string }
variable "service_project_ids" { type = list(string) }
variable "subnets"            { type = list(any) }

resource "google_compute_shared_vpc_host_project" "host" {
  project = var.host_project_id
}

resource "google_compute_shared_vpc_service_project" "service_projects" {
  for_each        = toset(var.service_project_ids)
  host_project    = google_compute_shared_vpc_host_project.host.project
  service_project = each.value
}

resource "google_compute_network" "shared" {
  name                    = "shared-vpc"
  project                 = var.host_project_id
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

module "subnets" {
  source   = "./modules/subnets"
  project  = var.host_project_id
  vpc_id   = google_compute_network.shared.id
  vpc_name = google_compute_network.shared.name
  subnets  = var.subnets
}

# Grant subnet access to service projects
resource "google_compute_subnetwork_iam_binding" "shared_subnet_users" {
  for_each = {
    for pair in setproduct(keys(module.subnets.subnet_map), var.service_project_ids) :
    "${pair[0]}-${pair[1]}" => { subnet = pair[0], project = pair[1] }
  }
  project    = var.host_project_id
  region     = module.subnets.subnet_map[each.value.subnet].region
  subnetwork = each.value.subnet
  role       = "roles/compute.networkUser"
  members    = ["serviceAccount:${data.google_project.service[each.value.project].number}@cloudservices.gserviceaccount.com"]
}

data "google_project" "service" {
  for_each   = toset(var.service_project_ids)
  project_id = each.value
}
```

### 21. Module for Cloud SQL with Private Service Access
```hcl
# modules/data/cloudsql/main.tf
variable "project"          { type = string }
variable "region"           { type = string }
variable "name"             { type = string }
variable "database_version" { type = string }
variable "tier"             { type = string }
variable "vpc_id"           { type = string }
variable "vpc_name"         { type = string }
variable "databases"        { type = list(string) }
variable "users"            { type = list(object({ name = string, password_secret = string })) }

resource "google_compute_global_address" "private_ip_range" {
  name          = "psa-range-${var.name}"
  project       = var.project
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 20
  network       = var.vpc_id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = var.vpc_id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}

resource "google_sql_database_instance" "main" {
  name             = var.name
  project          = var.project
  region           = var.region
  database_version = var.database_version

  settings {
    tier              = var.tier
    availability_type = "REGIONAL"
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id
      require_ssl     = true
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
    }
  }

  depends_on = [google_service_networking_connection.private_vpc]
}

resource "google_sql_database" "databases" {
  for_each = toset(var.databases)
  instance = google_sql_database_instance.main.name
  project  = var.project
  name     = each.value
}

output "name"             { value = google_sql_database_instance.main.name }
output "private_ip"       { value = google_sql_database_instance.main.private_ip_address }
output "connection_name"  { value = google_sql_database_instance.main.connection_name }
output "database_names"   { value = [for db in google_sql_database.databases : db.name] }
```

### 22. Module for GCS Bucket with Lifecycle and IAM
```hcl
# modules/storage/gcs-bucket/main.tf
variable "project"      { type = string }
variable "name"         { type = string }
variable "location"     { type = string }
variable "storage_class" { type = string; default = "STANDARD" }
variable "versioning"   { type = bool; default = true }
variable "lifecycle_rules" { type = list(any); default = [] }
variable "iam_bindings" { type = list(object({ role = string, members = list(string) })); default = [] }
variable "labels"       { type = map(string); default = {} }
variable "cors"         { type = list(any); default = [] }

resource "google_storage_bucket" "bucket" {
  name                        = var.name
  project                     = var.project
  location                    = var.location
  storage_class               = var.storage_class
  uniform_bucket_level_access = true
  labels                      = var.labels

  versioning {
    enabled = var.versioning
  }

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_rules
    content {
      action {
        type          = lifecycle_rule.value.action_type
        storage_class = lookup(lifecycle_rule.value, "storage_class", null)
      }
      condition {
        age                   = lookup(lifecycle_rule.value, "age", null)
        num_newer_versions    = lookup(lifecycle_rule.value, "num_newer_versions", null)
        with_state            = lookup(lifecycle_rule.value, "with_state", null)
      }
    }
  }

  dynamic "cors" {
    for_each = var.cors
    content {
      origin          = cors.value.origins
      method          = cors.value.methods
      response_header = cors.value.response_headers
      max_age_seconds = cors.value.max_age
    }
  }
}

resource "google_storage_bucket_iam_binding" "bindings" {
  for_each = { for b in var.iam_bindings : b.role => b }
  bucket   = google_storage_bucket.bucket.name
  role     = each.value.role
  members  = each.value.members
}

output "name"      { value = google_storage_bucket.bucket.name }
output "url"       { value = google_storage_bucket.bucket.url }
output "self_link" { value = google_storage_bucket.bucket.self_link }
```

### 23. Module for Secret Manager with Rotation
```hcl
# modules/secrets/main.tf
variable "project"  { type = string }
variable "secrets"  {
  type = list(object({
    name           = string
    secret_data    = optional(string)
    rotation_days  = optional(number)
    replication    = optional(string, "automatic")
    locations      = optional(list(string), [])
    accessors      = optional(list(string), [])
  }))
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = { for s in var.secrets : s.name => s }
  secret_id = each.value.name
  project   = var.project

  dynamic "replication" {
    for_each = each.value.replication == "automatic" ? [1] : []
    content {
      automatic {}
    }
  }

  dynamic "replication" {
    for_each = each.value.replication == "user_managed" ? [1] : []
    content {
      user_managed {
        dynamic "replicas" {
          for_each = each.value.locations
          content {
            location = replicas.value
          }
        }
      }
    }
  }

  dynamic "rotation" {
    for_each = each.value.rotation_days != null ? [each.value.rotation_days] : []
    content {
      rotation_period = "${rotation.value * 86400}s"
    }
  }

  labels = { managed-by = "terraform" }
}

resource "google_secret_manager_secret_version" "versions" {
  for_each    = { for s in var.secrets : s.name => s if s.secret_data != null }
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value.secret_data
}

resource "google_secret_manager_secret_iam_binding" "accessors" {
  for_each  = { for s in var.secrets : s.name => s if length(s.accessors) > 0 }
  project   = var.project
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  members   = each.value.accessors
}

output "secret_ids"      { value = { for k, v in google_secret_manager_secret.secrets : k => v.id } }
output "secret_versions" { value = { for k, v in google_secret_manager_secret_version.versions : k => v.name } }
```

### 24. Root Module Using All Sub-Modules Together (Complete App Platform)
```hcl
# root/main.tf — Production Application Platform
module "networking" {
  source   = "./modules/networking"
  project  = var.project
  region   = var.region
  vpc_name = "vpc-${var.env}"
  subnets  = var.network_subnets
  nat_config = { regions = [var.region], log_config = true }
}

module "secrets" {
  source  = "./modules/secrets"
  project = var.project
  secrets = var.application_secrets
}

module "cloudsql" {
  source           = "./modules/data/cloudsql"
  project          = var.project
  region           = var.region
  name             = "pg-${var.env}-01"
  database_version = "POSTGRES_15"
  tier             = var.db_tier
  vpc_id           = module.networking.vpc_id
  vpc_name         = module.networking.vpc_name
  databases        = var.databases
  users            = var.db_users
}

module "gke" {
  source         = "./modules/gke"
  project        = var.project
  cluster_name   = "gke-${var.env}"
  location       = var.region
  network        = module.networking.vpc_name
  subnetwork     = module.networking.subnet_names["app"]
  node_pools     = var.gke_node_pools
  workload_identities = var.workload_identities
}

module "application" {
  source   = "./modules/application"
  project  = var.project
  region   = var.region
  app_name = var.app_name
  image    = var.app_image
  env_vars = merge(var.app_env_vars, {
    DB_HOST = module.cloudsql.private_ip
    DB_NAME = module.cloudsql.database_names[0]
  })
  invokers = var.app_invokers
  topics   = var.pubsub_topics
}

module "load_balancer" {
  source          = "./modules/load-balancer"
  project         = var.project
  name            = "lb-${var.env}"
  ssl_domains     = var.ssl_domains
  cloud_run_services = module.application.service_names
  security_policy = module.cloud_armor.policy_id
}

module "cloud_armor" {
  source       = "./modules/cloud-armor"
  project      = var.project
  policy_name  = "waf-${var.env}"
  enable_owasp = true
  rate_limits  = var.rate_limit_rules
  geo_blocks   = var.blocked_regions
}

module "observability" {
  source        = "./modules/observability"
  project       = var.project
  env           = var.env
  gke_cluster   = module.gke.cluster_id
  sql_instance  = module.cloudsql.name
  lb_name       = module.load_balancer.name
  notification_channels = var.notification_channels
}
```

### 25. Nested Module: Complete Networking (VPC + Firewall + NAT + DNS)
```hcl
# modules/networking/main.tf — Full networking stack
resource "google_compute_network" "vpc" {
  name                    = var.vpc_name
  project                 = var.project
  auto_create_subnetworks = false
  routing_mode            = var.routing_mode
  mtu                     = 1460
  delete_default_routes_on_create = false
}

module "subnets" {
  source   = "./modules/subnets"
  project  = var.project
  vpc_id   = google_compute_network.vpc.id
  vpc_name = google_compute_network.vpc.name
  subnets  = var.subnets
}

module "firewall" {
  source   = "./modules/firewall"
  project  = var.project
  vpc_name = google_compute_network.vpc.name
  rules    = var.firewall_rules
}

module "cloud_router" {
  source   = "./modules/cloud-router"
  project  = var.project
  vpc_name = google_compute_network.vpc.name
  regions  = distinct([for s in var.subnets : s.region])
}

module "cloud_nat" {
  source     = "./modules/cloud-nat"
  project    = var.project
  routers    = module.cloud_router.routers
  nat_config = var.nat_config
}

module "cloud_dns" {
  source   = "./modules/cloud-dns"
  project  = var.project
  vpc_id   = google_compute_network.vpc.id
  dns_zones = var.dns_zones
}

output "vpc_id"        { value = google_compute_network.vpc.id }
output "vpc_name"      { value = google_compute_network.vpc.name }
output "vpc_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_ids"    { value = module.subnets.subnet_ids }
output "subnet_names"  { value = module.subnets.subnet_names }
output "subnet_self_links" { value = module.subnets.subnet_self_links }
```

---

## Nested

### 26. Deeply Nested Module: GKE with Workload Identity and RBAC
```hcl
# modules/gke/modules/workload-identity/main.tf
variable "project"    { type = string }
variable "cluster_id" { type = string }
variable "workloads"  {
  type = list(object({
    namespace  = string
    ksa_name   = string
    gsa_name   = string
    gsa_roles  = list(string)
  }))
}

resource "google_service_account" "gsas" {
  for_each     = { for w in var.workloads : w.gsa_name => w }
  account_id   = each.value.gsa_name
  display_name = "Workload Identity GSA: ${each.value.gsa_name}"
  project      = var.project
}

resource "google_project_iam_member" "gsa_roles" {
  for_each = {
    for pair in flatten([
      for w in var.workloads : [
        for role in w.gsa_roles : {
          key  = "${w.gsa_name}-${replace(role, "/", "-")}"
          gsa  = w.gsa_name
          role = role
        }
      ]
    ]) : pair.key => pair
  }
  project = var.project
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.gsas[each.value.gsa].email}"
}

resource "google_service_account_iam_member" "wi_binding" {
  for_each = { for w in var.workloads : w.gsa_name => w }
  service_account_id = google_service_account.gsas[each.key].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project}.svc.id.goog[${each.value.namespace}/${each.value.ksa_name}]"
}

output "gsa_emails" {
  value = { for k, v in google_service_account.gsas : k => v.email }
}
```

### 27. Nested Module: Observability (Monitoring + Logging + Alerting)
```hcl
# modules/observability/main.tf
module "log_sinks" {
  source   = "./modules/log-sinks"
  project  = var.project
  sinks    = var.log_sinks
}

module "log_metrics" {
  source   = "./modules/log-metrics"
  project  = var.project
  metrics  = var.log_based_metrics
}

module "alert_policies" {
  source   = "./modules/alert-policies"
  project  = var.project
  policies = var.alert_policies
  notification_channels = var.notification_channels
}

module "dashboards" {
  source     = "./modules/dashboards"
  project    = var.project
  dashboards = var.dashboards
}

module "uptime_checks" {
  source  = "./modules/uptime-checks"
  project = var.project
  checks  = var.uptime_checks
}

# modules/observability/modules/log-sinks/main.tf
resource "google_logging_project_sink" "sinks" {
  for_each    = { for s in var.sinks : s.name => s }
  name        = each.value.name
  project     = var.project
  destination = each.value.destination
  filter      = each.value.filter
  unique_writer_identity = true

  dynamic "bigquery_options" {
    for_each = can(regex("^bigquery", each.value.destination)) ? [1] : []
    content {
      use_partitioned_tables = true
    }
  }
}
```

### 28. Nested Module: Data Platform (BigQuery + Dataflow + Pub/Sub)
```hcl
# modules/data-platform/main.tf
module "pubsub" {
  source  = "./modules/pubsub"
  project = var.project
  topics  = var.pubsub_topics
  subscriptions = var.pubsub_subscriptions
}

module "bigquery" {
  source   = "./modules/bigquery"
  project  = var.project
  location = var.bq_location
  datasets = var.bq_datasets
  tables   = var.bq_tables
}

module "dataflow" {
  source      = "./modules/dataflow"
  project     = var.project
  region      = var.region
  network     = var.network
  subnetwork  = var.subnetwork
  jobs        = var.dataflow_jobs
  temp_bucket = module.gcs.bucket_names["dataflow-temp"]
}

module "gcs" {
  source   = "./modules/gcs"
  project  = var.project
  location = var.gcs_location
  buckets  = var.gcs_buckets
}

# Wire pubsub → dataflow → bigquery
output "pipeline_config" {
  value = {
    input_topics  = module.pubsub.topic_names
    output_tables = module.bigquery.table_ids
    temp_bucket   = module.gcs.bucket_names["dataflow-temp"]
  }
}
```

### 29. Nested Module: Security (IAM + Secret Manager + KMS)
```hcl
# modules/security/main.tf
module "service_accounts" {
  source  = "./modules/service-accounts"
  project = var.project
  service_accounts = var.service_accounts
}

module "project_iam" {
  source      = "./modules/project-iam"
  project     = var.project
  iam_bindings = var.project_iam_bindings
  sa_emails   = module.service_accounts.emails
}

module "kms" {
  source   = "./modules/kms"
  project  = var.project
  location = var.region
  keyrings = var.kms_keyrings
}

module "secrets" {
  source   = "./modules/secrets"
  project  = var.project
  secrets  = var.secrets
  kms_keys = module.kms.key_ids
}

module "org_policies" {
  source       = "./modules/org-policies"
  project      = var.project
  org_policies = var.org_policies
}

output "service_account_emails" { value = module.service_accounts.emails }
output "kms_key_ids"            { value = module.kms.key_ids }
output "secret_ids"             { value = module.secrets.secret_ids }
```

### 30. Nested Module: Cloud Run Application with Full Stack
```hcl
# modules/cloudrun-app/main.tf
module "service_account" {
  source   = "./modules/service-account"
  project  = var.project
  name     = "sa-${var.app_name}"
  roles    = var.app_roles
}

module "secrets" {
  source   = "./modules/app-secrets"
  project  = var.project
  app_name = var.app_name
  secrets  = var.app_secrets
  accessor_sa = module.service_account.email
}

module "cloud_run" {
  source           = "./modules/cloud-run-service"
  project          = var.project
  region           = var.region
  name             = var.app_name
  image            = var.image
  env_vars         = var.env_vars
  secrets          = module.secrets.secret_refs
  service_account  = module.service_account.email
  vpc_connector    = var.vpc_connector
  min_instances    = var.min_instances
  max_instances    = var.max_instances
  concurrency      = var.concurrency
  cpu              = var.cpu
  memory           = var.memory
}

module "load_balancer" {
  source         = "./modules/serverless-lb"
  project        = var.project
  name           = "lb-${var.app_name}"
  region         = var.region
  cloud_run_name = module.cloud_run.name
  domains        = var.custom_domains
  ssl_policy     = var.ssl_policy
}

module "iam" {
  source       = "./modules/run-iam"
  project      = var.project
  region       = var.region
  service_name = module.cloud_run.name
  invokers     = var.invokers
}

output "service_url"     { value = module.cloud_run.url }
output "lb_ip"           { value = module.load_balancer.ip_address }
output "sa_email"        { value = module.service_account.email }
```

### 31. Nested Module: Complete GCP Landing Zone
```hcl
# modules/landing-zone/main.tf
# Hierarchical: Org → Folder → Projects → Resources

module "folder_structure" {
  source        = "./modules/folder-structure"
  org_id        = var.org_id
  environments  = var.environments
  departments   = var.departments
}

module "projects" {
  source          = "./modules/projects"
  for_each        = var.project_configs
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = module.folder_structure.folder_ids[each.value.folder]
  project_config  = each.value
}

module "networking" {
  source     = "./modules/shared-networking"
  host_project_id    = module.projects.project_ids["shared-vpc-host"]
  service_project_ids = [for k, p in module.projects.project_ids : p if k != "shared-vpc-host"]
  network_config = var.network_config

  depends_on = [module.projects]
}

module "security" {
  source     = "./modules/org-security"
  org_id     = var.org_id
  org_policies = var.org_policies
  audit_log_project = module.projects.project_ids["logging"]
}

module "observability" {
  source    = "./modules/central-observability"
  project   = module.projects.project_ids["monitoring"]
  monitored_projects = module.projects.project_ids
}
```

### 32. Nested Module: Kubernetes Application Deployment (GKE + Helm)
```hcl
# modules/k8s-application/main.tf
terraform {
  required_providers {
    google     = { source = "hashicorp/google" }
    kubernetes = { source = "hashicorp/kubernetes" }
    helm       = { source = "hashicorp/helm" }
  }
}

module "namespace" {
  source      = "./modules/k8s-namespace"
  namespace   = var.namespace
  labels      = var.labels
  annotations = var.annotations
}

module "service_account" {
  source    = "./modules/k8s-sa"
  namespace = var.namespace
  name      = var.app_name
  gsa_email = var.gsa_email

  depends_on = [module.namespace]
}

module "configmap" {
  source      = "./modules/k8s-configmap"
  namespace   = var.namespace
  app_name    = var.app_name
  config_data = var.app_config

  depends_on = [module.namespace]
}

module "secrets" {
  source    = "./modules/k8s-secret"
  namespace = var.namespace
  app_name  = var.app_name
  secrets   = var.k8s_secrets

  depends_on = [module.namespace]
}

module "helm_release" {
  source       = "./modules/helm-release"
  name         = var.app_name
  namespace    = var.namespace
  chart        = var.helm_chart
  repository   = var.helm_repo
  chart_version = var.chart_version
  values       = var.helm_values
  sa_name      = module.service_account.name

  depends_on = [module.service_account, module.configmap, module.secrets]
}
```

---

## Advanced

### 33. Complete Production Networking Module (HA + Multi-Region)
```hcl
# modules/networking/main.tf — Production HA Multi-Region Networking
locals {
  regions = distinct([for s in var.subnets : s.region])
}

resource "google_compute_network" "vpc" {
  name                    = var.vpc_name
  project                 = var.project
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  mtu                     = 1500
}

module "subnets" {
  source   = "./modules/subnets"
  project  = var.project
  vpc_id   = google_compute_network.vpc.id
  vpc_name = google_compute_network.vpc.name
  subnets  = var.subnets
}

module "firewall" {
  source        = "./modules/firewall"
  project       = var.project
  vpc_name      = google_compute_network.vpc.name
  common_rules  = var.common_firewall_rules
  custom_rules  = var.custom_firewall_rules
}

module "nat" {
  for_each = toset(local.regions)
  source   = "./modules/cloud-nat"
  project  = var.project
  region   = each.value
  vpc_name = google_compute_network.vpc.name
  nat_ips  = var.static_nat_ips[each.value]
}

module "vpn" {
  for_each = var.vpn_connections
  source   = "./modules/ha-vpn"
  project  = var.project
  region   = each.value.region
  vpc_id   = google_compute_network.vpc.id
  vpc_name = google_compute_network.vpc.name
  peer_gateways = each.value.peer_gateways
  bgp_asn    = var.bgp_asn
  bgp_peers  = each.value.bgp_peers
}

module "dns" {
  source    = "./modules/cloud-dns"
  project   = var.project
  vpc_id    = google_compute_network.vpc.id
  zones     = var.dns_zones
  records   = var.dns_records
}

module "vpc_peering" {
  for_each     = var.vpc_peerings
  source       = "./modules/vpc-peering"
  project      = var.project
  network      = google_compute_network.vpc.id
  peer_network = each.value.peer_network
  peer_project = each.value.peer_project
}

output "vpc_id"   { value = google_compute_network.vpc.id }
output "vpc_name" { value = google_compute_network.vpc.name }
output "vpc_self_link" { value = google_compute_network.vpc.self_link }
output "subnet_ids"   { value = module.subnets.subnet_ids }
output "subnet_self_links" { value = module.subnets.subnet_self_links }
output "nat_ips"      { value = { for region, nat in module.nat : region => nat.external_ips } }
```

### 34. Module for Anthos Config Management Setup
```hcl
# modules/anthos-config/main.tf
variable "project"       { type = string }
variable "fleet_project" { type = string }
variable "clusters"      { type = map(any) }
variable "git_config"    { type = any }

module "fleet_memberships" {
  source        = "./modules/fleet-memberships"
  project       = var.fleet_project
  clusters      = var.clusters
}

module "config_sync" {
  source       = "./modules/config-sync"
  project      = var.fleet_project
  memberships  = module.fleet_memberships.membership_ids
  git_config   = var.git_config

  depends_on = [module.fleet_memberships]
}

module "policy_controller" {
  source      = "./modules/policy-controller"
  project     = var.fleet_project
  memberships = module.fleet_memberships.membership_ids
  constraints = var.policy_constraints

  depends_on = [module.fleet_memberships]
}

module "service_mesh" {
  source      = "./modules/service-mesh"
  project     = var.fleet_project
  memberships = module.fleet_memberships.membership_ids

  depends_on = [module.config_sync]
}

# modules/anthos-config/modules/config-sync/main.tf
resource "google_gke_hub_feature_membership" "config_sync" {
  for_each   = var.memberships
  project    = var.project
  location   = "global"
  feature    = "configmanagement"
  membership = each.value

  configmanagement {
    config_sync {
      git {
        sync_repo   = var.git_config.repo_url
        sync_branch = var.git_config.branch
        secret_type = var.git_config.secret_type
        policy_dir  = var.git_config.policy_dir
        sync_wait_secs = var.git_config.sync_wait_secs
      }
      source_format = "hierarchy"
    }
    policy_controller {
      enabled                   = true
      referential_rules_enabled = true
      log_denies_enabled        = true
      audit_interval_seconds    = "60"
    }
  }
}
```

### 35. Complete 3-Tier Infrastructure Module (Prod-Grade)
```hcl
# root/main.tf — Complete production 3-tier on GCP
terraform {
  required_version = ">= 1.5"
  required_providers {
    google      = { source = "hashicorp/google", version = "~> 5.0" }
    google-beta = { source = "hashicorp/google-beta", version = "~> 5.0" }
  }
  backend "gcs" {
    bucket = "my-prod-project-tfstate"
    prefix = "prod/main"
  }
}

locals {
  project     = "my-prod-project"
  region      = "us-central1"
  env         = "prod"
  common_labels = {
    environment = "prod"
    managed-by  = "terraform"
    team        = "platform"
  }
}

module "networking" {
  source        = "./modules/networking"
  project       = local.project
  region        = local.region
  env           = local.env
  vpc_name      = "vpc-${local.env}"
  routing_mode  = "GLOBAL"
  subnets       = var.subnet_configs
  nat_regions   = [local.region, "us-east1"]
  dns_zones     = var.dns_zones
  firewall_rules = var.firewall_rules
  labels        = local.common_labels
}

module "security" {
  source          = "./modules/security"
  project         = local.project
  region          = local.region
  service_accounts = var.service_accounts
  kms_keyrings    = var.kms_keyrings
  secrets         = var.application_secrets
  org_policies    = var.org_policies
  labels          = local.common_labels
}

module "compute" {
  source          = "./modules/compute"
  project         = local.project
  region          = local.region
  env             = local.env
  vpc_name        = module.networking.vpc_name
  gke_subnet      = module.networking.subnet_self_links["gke"]
  run_connector   = module.networking.vpc_connector_id
  gke_config      = var.gke_config
  cloud_run_apps  = var.cloud_run_services
  service_accounts = module.security.service_account_emails
  labels          = local.common_labels

  depends_on = [module.networking, module.security]
}

module "data" {
  source         = "./modules/data"
  project        = local.project
  region         = local.region
  env            = local.env
  vpc_id         = module.networking.vpc_id
  data_subnet    = module.networking.subnet_self_links["data"]
  kms_keys       = module.security.kms_key_ids
  postgres_config = var.postgres_config
  redis_config   = var.redis_config
  bq_datasets    = var.bq_datasets
  gcs_buckets    = var.gcs_buckets
  labels         = local.common_labels

  depends_on = [module.networking, module.security]
}

module "load_balancer" {
  source          = "./modules/load-balancer"
  project         = local.project
  env             = local.env
  name            = "lb-prod"
  ssl_domains     = var.ssl_domains
  backends        = module.compute.backend_configs
  armor_policy    = module.cloud_armor.policy_id
  labels          = local.common_labels

  depends_on = [module.compute]
}

module "cloud_armor" {
  source       = "./modules/cloud-armor"
  project      = local.project
  policy_name  = "waf-prod"
  enable_owasp = true
  rate_limits  = var.rate_limit_config
  geo_blocks   = var.blocked_countries
}

module "observability" {
  source        = "./modules/observability"
  project       = local.project
  env           = local.env
  gke_cluster   = module.compute.gke_cluster_name
  sql_instances = [module.data.sql_instance_name]
  lb_name       = module.load_balancer.name
  notification_channels = var.notification_channels
  alert_policies = local.alert_policies
  log_sinks     = var.log_sinks
  labels        = local.common_labels

  depends_on = [module.compute, module.data, module.load_balancer]
}
```

### 36. Module Version Pinning and Registry Pattern
```hcl
# root/main.tf — Using registry modules with version pinning
terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Internal registry modules (company Terraform Registry)
module "networking" {
  source  = "registry.example.com/platform/gcp-networking/google"
  version = "~> 3.0"

  project  = "my-prod-project"
  region   = "us-central1"
  vpc_name = "vpc-prod"
  subnets  = var.subnets
}

module "gke" {
  source  = "registry.example.com/platform/gcp-gke/google"
  version = "~> 2.5"

  project      = "my-prod-project"
  region       = "us-central1"
  cluster_name = "gke-prod"
  network      = module.networking.vpc_name
  subnetwork   = module.networking.subnet_names["gke"]
  node_pools   = var.node_pools
}

# Public registry module with version lock
module "cloud_sql_postgres" {
  source  = "GoogleCloudPlatform/sql-db/google//modules/postgresql"
  version = "18.1.0"

  project_id       = "my-prod-project"
  name             = "postgres-prod"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  zone             = "us-central1-a"
  tier             = "db-custom-4-15360"
  vpc_network      = module.networking.vpc_self_link
}
```

### 37. Nested Module for ML Platform (Vertex AI + GCS + BigQuery)
```hcl
# modules/ml-platform/main.tf
module "storage" {
  source   = "./modules/ml-storage"
  project  = var.project
  region   = var.region
  buckets = {
    datasets   = { name = "${var.project}-ml-datasets",   lifecycle_days = 0  }
    models     = { name = "${var.project}-ml-models",     lifecycle_days = 0  }
    pipelines  = { name = "${var.project}-ml-pipelines",  lifecycle_days = 90 }
    artifacts  = { name = "${var.project}-ml-artifacts",  lifecycle_days = 30 }
  }
  kms_key = var.kms_key_id
}

module "feature_store" {
  source        = "./modules/vertex-feature-store"
  project       = var.project
  region        = var.region
  name          = "${var.project}-feature-store"
  feature_groups = var.feature_groups
  online_serving_fixed_node_count = var.feature_store_nodes
}

module "model_registry" {
  source   = "./modules/vertex-model-registry"
  project  = var.project
  region   = var.region
  models   = var.models
  endpoints = var.model_endpoints
}

module "pipelines" {
  source          = "./modules/vertex-pipelines"
  project         = var.project
  region          = var.region
  pipeline_root   = "gs://${module.storage.bucket_names["pipelines"]}"
  service_account = var.pipeline_sa_email
  schedules       = var.pipeline_schedules
}

module "notebooks" {
  source    = "./modules/vertex-notebooks"
  project   = var.project
  region    = var.region
  instances = var.notebook_instances
  network   = var.network
  subnet    = var.subnet
}

module "bigquery_ml" {
  source    = "./modules/bqml"
  project   = var.project
  location  = var.bq_location
  datasets  = var.bq_ml_datasets
}

output "storage_buckets"  { value = module.storage.bucket_names }
output "pipeline_root"    { value = "gs://${module.storage.bucket_names["pipelines"]}" }
output "feature_store_id" { value = module.feature_store.id }
```

---

## Advanced

### 38. Nested Module with Conditional Sub-Module Invocation
```hcl
# modules/flexible-app/main.tf
variable "enable_gke"       { type = bool; default = false }
variable "enable_cloud_run" { type = bool; default = true }
variable "enable_gce"       { type = bool; default = false }
variable "enable_cdn"       { type = bool; default = false }
variable "enable_armor"     { type = bool; default = false }

module "gke_deployment" {
  count    = var.enable_gke ? 1 : 0
  source   = "./modules/gke-deployment"
  project  = var.project
  region   = var.region
  config   = var.gke_config
  network  = var.network
  subnet   = var.subnet
}

module "cloud_run_deployment" {
  count   = var.enable_cloud_run ? 1 : 0
  source  = "./modules/cloudrun-deployment"
  project = var.project
  region  = var.region
  config  = var.cloud_run_config
}

module "gce_deployment" {
  count   = var.enable_gce ? 1 : 0
  source  = "./modules/gce-deployment"
  project = var.project
  region  = var.region
  config  = var.gce_config
  network = var.network
  subnet  = var.subnet
}

module "cdn" {
  count     = var.enable_cdn ? 1 : 0
  source    = "./modules/cloud-cdn"
  project   = var.project
  lb_name   = local.lb_name
  backends  = local.backend_ids
}

module "armor" {
  count   = var.enable_armor ? 1 : 0
  source  = "./modules/cloud-armor"
  project = var.project
  config  = var.armor_config
}

locals {
  lb_name = "lb-${var.app_name}"
  backend_ids = compact([
    var.enable_gke ? one(module.gke_deployment).backend_service_id : null,
    var.enable_cloud_run ? one(module.cloud_run_deployment).neg_id : null,
    var.enable_gce ? one(module.gce_deployment).backend_service_id : null,
  ])
}
```

### 39. Nested Module for Multi-Tenant SaaS Platform
```hcl
# modules/saas-tenant/main.tf
# Each tenant gets isolated resources but shared infrastructure
variable "tenants" {
  type = map(object({
    tier            = string
    region          = string
    db_size_gb      = number
    gke_namespace   = string
    custom_domain   = optional(string)
    features        = list(string)
  }))
}

module "tenant_databases" {
  for_each = var.tenants
  source   = "./modules/tenant-database"
  project  = var.project
  region   = each.value.region
  name     = "tenant-${each.key}"
  tier     = each.value.tier == "enterprise" ? "db-custom-8-30720" : "db-custom-2-7680"
  disk_gb  = each.value.db_size_gb
  vpc_id   = var.shared_vpc_id
}

module "tenant_namespaces" {
  for_each      = var.tenants
  source        = "./modules/k8s-tenant-namespace"
  tenant        = each.key
  namespace     = each.value.gke_namespace
  tier          = each.value.tier
  resource_quota = local.quota_by_tier[each.value.tier]
  db_host       = module.tenant_databases[each.key].private_ip
  db_secret     = module.tenant_databases[each.key].password_secret
}

module "tenant_dns" {
  for_each      = { for k, v in var.tenants : k => v if v.custom_domain != null }
  source        = "./modules/tenant-dns"
  project       = var.project
  domain        = each.value.custom_domain
  lb_ip         = var.shared_lb_ip
}

locals {
  quota_by_tier = {
    starter    = { cpu = "4", memory = "8Gi", pods = "20" }
    growth     = { cpu = "16", memory = "32Gi", pods = "50" }
    enterprise = { cpu = "64", memory = "128Gi", pods = "200" }
  }
}
```

### 40. Module for Event-Driven Architecture (Pub/Sub + Cloud Functions + BigQuery)
```hcl
# modules/event-driven/main.tf
module "pubsub_infrastructure" {
  source  = "./modules/pubsub-infra"
  project = var.project
  topics  = var.event_topics
  schemas = var.event_schemas
}

module "event_processors" {
  for_each = var.event_processors
  source   = "./modules/cloud-function"
  project  = var.project
  region   = var.region
  name     = "fn-${each.key}"
  runtime  = each.value.runtime
  entry_point = each.value.entry_point
  source_bucket = module.function_source_bucket.name
  source_object = each.value.source_object

  trigger_config = {
    type       = "pubsub"
    topic_name = module.pubsub_infrastructure.topic_names[each.value.input_topic]
  }

  env_vars = merge(each.value.env_vars, {
    OUTPUT_DATASET = module.bigquery_output.dataset_ids[each.value.output_dataset]
    OUTPUT_TABLE   = each.value.output_table
  })

  service_account = module.function_sa[each.key].email
}

module "bigquery_output" {
  source    = "./modules/bq-datasets"
  project   = var.project
  location  = var.bq_location
  datasets  = var.output_datasets
}

module "function_source_bucket" {
  source   = "./modules/gcs-bucket"
  project  = var.project
  name     = "${var.project}-fn-source"
  location = var.region
}

module "function_sa" {
  for_each     = var.event_processors
  source       = "./modules/service-account"
  project      = var.project
  name         = "sa-fn-${each.key}"
  display_name = "SA for function ${each.key}"
  roles        = each.value.sa_roles
}
```

### 41. Nested Module: GitOps-Ready Infrastructure with Workspaces
```hcl
# root/main.tf — Workspace-based environment separation
locals {
  env_configs = {
    dev = {
      gke_tier  = "n2-standard-2"
      db_tier   = "db-custom-2-7680"
      min_nodes = 1
      max_nodes = 3
      region    = "us-central1"
    }
    staging = {
      gke_tier  = "n2-standard-4"
      db_tier   = "db-custom-4-15360"
      min_nodes = 2
      max_nodes = 5
      region    = "us-central1"
    }
    prod = {
      gke_tier  = "n2-standard-8"
      db_tier   = "db-custom-8-30720"
      min_nodes = 3
      max_nodes = 20
      region    = "us-central1"
    }
  }
  config = local.env_configs[terraform.workspace]
}

module "networking" {
  source   = "./modules/networking"
  project  = "my-${terraform.workspace}-project"
  region   = local.config.region
  vpc_name = "vpc-${terraform.workspace}"
  subnets  = var.subnet_configs[terraform.workspace]
}

module "gke" {
  source       = "./modules/gke"
  project      = "my-${terraform.workspace}-project"
  region       = local.config.region
  cluster_name = "gke-${terraform.workspace}"
  network      = module.networking.vpc_name
  subnetwork   = module.networking.subnet_names["gke"]
  node_pools = [{
    name         = "default"
    machine_type = local.config.gke_tier
    min_count    = local.config.min_nodes
    max_count    = local.config.max_nodes
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    spot         = terraform.workspace != "prod"
    labels       = { env = terraform.workspace }
    taints       = []
  }]
}

module "data" {
  source   = "./modules/data"
  project  = "my-${terraform.workspace}-project"
  region   = local.config.region
  db_tier  = local.config.db_tier
  vpc_id   = module.networking.vpc_id
}
```

### 42. Module for Zero-Trust Network Architecture
```hcl
# modules/zero-trust/main.tf
module "vpc_sc" {
  source    = "./modules/vpc-service-controls"
  project   = var.project
  org_id    = var.org_id
  policy_id = var.access_policy_id

  service_perimeters = var.service_perimeters
  access_levels      = var.access_levels
}

module "iap" {
  source   = "./modules/iap"
  project  = var.project
  org_id   = var.org_id

  backends       = var.iap_backends
  allowed_members = var.iap_allowed_members
}

module "cloud_armor_zt" {
  source  = "./modules/cloud-armor-zt"
  project = var.project

  allowed_regions    = var.allowed_regions
  allowed_ip_ranges  = var.corporate_ip_ranges
  bot_management     = true
  adaptive_protection = true
  rate_limit_config  = var.rate_limit_config
}

module "certificate_authority" {
  source   = "./modules/cas"
  project  = var.project
  region   = var.region
  ca_pools = var.ca_pools
}

module "workload_certificates" {
  source   = "./modules/workload-certs"
  project  = var.project
  pools    = module.certificate_authority.pool_ids
  workloads = var.workload_certificate_configs
}

module "binary_authorization" {
  source    = "./modules/binary-auth"
  project   = var.project
  policy    = var.binauthz_policy
  attestors = var.binauthz_attestors
}
```

### 43. Cross-Project Module Pattern (Shared Services)
```hcl
# modules/cross-project/main.tf
# Pattern: core services project + workload projects
variable "core_project"      { type = string }
variable "workload_projects" { type = list(string) }
variable "shared_network"    { type = string }
variable "shared_kms_key"    { type = string }
variable "shared_artifact_registry" { type = string }

# Grant workload projects access to shared KMS key
resource "google_kms_crypto_key_iam_member" "workload_kms" {
  for_each = toset(var.workload_projects)

  crypto_key_id = var.shared_kms_key
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_project.workload[each.value].number}@cloudservices.gserviceaccount.com"
}

# Grant workload projects access to shared Artifact Registry
resource "google_artifact_registry_repository_iam_member" "workload_registry" {
  for_each   = toset(var.workload_projects)
  project    = var.core_project
  location   = "us-central1"
  repository = var.shared_artifact_registry
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${data.google_project.workload[each.value].number}-compute@developer.gserviceaccount.com"
}

# Grant workload projects access to shared network
resource "google_compute_subnetwork_iam_member" "workload_subnet" {
  for_each = toset(var.workload_projects)
  project  = var.core_project
  region   = "us-central1"
  subnetwork = var.shared_network
  role     = "roles/compute.networkUser"
  member   = "serviceAccount:${data.google_project.workload[each.value].number}@cloudservices.gserviceaccount.com"
}

data "google_project" "workload" {
  for_each   = toset(var.workload_projects)
  project_id = each.value
}
```

### 44. Module for Disaster Recovery (Multi-Region Failover)
```hcl
# modules/disaster-recovery/main.tf
variable "primary_region"   { type = string; default = "us-central1" }
variable "secondary_region" { type = string; default = "us-east1" }
variable "project"          { type = string }
variable "rpo_minutes"      { type = number; default = 60 }
variable "rto_minutes"      { type = number; default = 30 }

module "primary_networking" {
  source   = "../networking"
  project  = var.project
  region   = var.primary_region
  vpc_name = "vpc-primary"
  subnets  = var.primary_subnets
}

module "secondary_networking" {
  source   = "../networking"
  project  = var.project
  region   = var.secondary_region
  vpc_name = "vpc-secondary"
  subnets  = var.secondary_subnets
}

module "vpc_peering_dr" {
  source       = "../vpc-peering"
  project      = var.project
  network_a    = module.primary_networking.vpc_self_link
  network_b    = module.secondary_networking.vpc_self_link
}

module "primary_gke" {
  source       = "../gke"
  project      = var.project
  region       = var.primary_region
  cluster_name = "gke-primary"
  network      = module.primary_networking.vpc_name
  subnetwork   = module.primary_networking.subnet_names["gke"]
  node_pools   = var.primary_node_pools
}

module "secondary_gke" {
  source       = "../gke"
  project      = var.project
  region       = var.secondary_region
  cluster_name = "gke-secondary"
  network      = module.secondary_networking.vpc_name
  subnetwork   = module.secondary_networking.subnet_names["gke"]
  node_pools   = var.secondary_node_pools
}

module "sql_primary" {
  source           = "../data/cloudsql"
  project          = var.project
  region           = var.primary_region
  name             = "pg-primary"
  database_version = "POSTGRES_15"
  tier             = var.db_tier
  vpc_id           = module.primary_networking.vpc_id
  high_availability = true
}

module "sql_replica" {
  source                  = "../data/cloudsql-replica"
  project                 = var.project
  region                  = var.secondary_region
  name                    = "pg-replica"
  primary_instance_name   = module.sql_primary.name
  vpc_id                  = module.secondary_networking.vpc_id

  depends_on = [module.sql_primary]
}

module "global_load_balancer" {
  source   = "../global-load-balancer"
  project  = var.project
  name     = "lb-global"
  backends = {
    primary   = { region = var.primary_region, neg = module.primary_gke.neg_id,   weight = 100 }
    secondary = { region = var.secondary_region, neg = module.secondary_gke.neg_id, weight = 0   }
  }
  failover_policy = {
    disable_connection_drain_on_failover = false
    drop_traffic_if_unhealthy            = true
    failover_ratio                       = 0.1
  }
}
```

### 45. Module Testing Infrastructure Pattern
```hcl
# tests/integration/main.tf — Integration test infrastructure
terraform {
  required_version = ">= 1.7"
}

variable "test_project" {
  type    = string
  default = "my-test-project-12345"
}

variable "test_id" {
  type        = string
  description = "Unique ID for this test run to avoid naming conflicts"
}

module "test_networking" {
  source   = "../../modules/networking"
  project  = var.test_project
  region   = "us-central1"
  vpc_name = "test-vpc-${var.test_id}"
  subnets = [{
    name   = "test-subnet"
    region = "us-central1"
    cidr   = "10.200.0.0/24"
    secondary_ranges = []
    log_config = null
  }]
  nat_regions = []
  firewall_rules = []
}

module "test_gke" {
  source       = "../../modules/gke"
  project      = var.test_project
  cluster_name = "test-cluster-${var.test_id}"
  location     = "us-central1"
  network      = module.test_networking.vpc_name
  subnetwork   = module.test_networking.subnet_names["test-subnet"]
  node_pools = [{
    name         = "test-pool"
    machine_type = "e2-medium"
    min_count    = 1
    max_count    = 2
    disk_size_gb = 50
    disk_type    = "pd-standard"
    spot         = true
    labels       = { test = "true", test_id = var.test_id }
    taints       = []
  }]

  depends_on = [module.test_networking]
}

# tests/integration/networking.tftest.hcl
run "validate_vpc" {
  command = apply
  assert {
    condition     = module.test_networking.vpc_id != ""
    error_message = "VPC must have a valid ID"
  }
}

run "validate_subnet" {
  command = apply
  assert {
    condition     = length(module.test_networking.subnet_ids) == 1
    error_message = "Must have exactly one subnet"
  }
}
```

### 46. Module for Complete CI/CD Infrastructure on GCP
```hcl
# modules/cicd/main.tf
module "artifact_registry" {
  source    = "./modules/artifact-registry"
  project   = var.project
  location  = var.region
  repositories = {
    docker = { format = "DOCKER", description = "Docker images" }
    maven  = { format = "MAVEN", description = "Maven artifacts" }
    npm    = { format = "NPM", description = "NPM packages" }
  }
  cleanup_policies = var.registry_cleanup_policies
}

module "cloud_build" {
  source   = "./modules/cloud-build"
  project  = var.project
  region   = var.region
  triggers = var.build_triggers
  workers  = var.build_worker_pools
  sa_roles = [
    "roles/container.developer",
    "roles/artifactregistry.writer",
    "roles/clouddeploy.releaser",
  ]
}

module "cloud_deploy" {
  source   = "./modules/cloud-deploy"
  project  = var.project
  region   = var.region
  pipelines = var.delivery_pipelines
  targets  = var.deploy_targets
}

module "binary_authorization" {
  source    = "./modules/binary-auth"
  project   = var.project
  cloud_build_sa = module.cloud_build.service_account_email
  cluster_names  = var.target_cluster_names
  attestors     = var.binauthz_attestors
}

module "source_repositories" {
  source    = "./modules/source-repos"
  project   = var.project
  repos     = var.git_repositories
  iam_policy = var.repo_iam
}

output "registry_urls"      { value = module.artifact_registry.repository_urls }
output "build_sa_email"     { value = module.cloud_build.service_account_email }
output "deploy_pipeline_ids" { value = module.cloud_deploy.pipeline_ids }
```

### 47. Complete Module Registry with Source URLs
```hcl
# root/main.tf — Using internal Terraform module registry
module "vpc" {
  source  = "git::https://github.com/my-org/terraform-google-networking.git//modules/vpc?ref=v3.2.1"
  project = "my-prod-project"
  name    = "vpc-prod"
  region  = "us-central1"
}

module "gke" {
  source  = "git::https://github.com/my-org/terraform-google-gke.git?ref=v2.8.0"
  project    = "my-prod-project"
  name       = "gke-prod"
  location   = "us-central1"
  network    = module.vpc.name
  subnetwork = module.vpc.subnet_names["us-central1-app"]
}

module "cloud_sql" {
  source  = "GoogleCloudPlatform/sql-db/google//modules/postgresql"
  version = "18.1.0"

  project_id       = "my-prod-project"
  name             = "postgres-prod"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  zone             = "us-central1-a"
  tier             = "db-custom-4-15360"
  vpc_network      = module.vpc.self_link
}

module "memorystore" {
  source  = "terraform-google-modules/memorystore/google"
  version = "~> 7.0"

  project        = "my-prod-project"
  name           = "redis-prod"
  region         = "us-central1"
  memory_size_gb = 5
  tier           = "STANDARD_HA"
  connect_mode   = "PRIVATE_SERVICE_ACCESS"
  authorized_network = module.vpc.self_link
}
```

### 48. Production Module with Full Variable Validation
```hcl
# modules/gke-production/variables.tf
variable "project" {
  description = "GCP project ID"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project))
    error_message = "Project ID must be 6-30 chars, lowercase letters, numbers, hyphens."
  }
}

variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,38}[a-z0-9]$", var.cluster_name))
    error_message = "Cluster name must be 3-40 chars, start with letter, lowercase alphanumeric and hyphens."
  }
}

variable "location" {
  description = "GCP region or zone for GKE cluster"
  type        = string
  validation {
    condition     = can(regex("^[a-z]+-[a-z]+[0-9]+(-[a-z])?$", var.location))
    error_message = "Location must be a valid GCP region or zone."
  }
}

variable "master_ipv4_cidr_block" {
  description = "CIDR for GKE master nodes. Must be /28."
  type        = string
  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/28$", var.master_ipv4_cidr_block))
    error_message = "Master CIDR must be a valid /28 CIDR block."
  }
}

variable "node_pools" {
  description = "List of node pool configurations"
  type = list(object({
    name         = string
    machine_type = string
    min_count    = number
    max_count    = number
    disk_size_gb = optional(number, 100)
    spot         = optional(bool, false)
    labels       = optional(map(string), {})
    taints       = optional(list(object({ key = string; value = string; effect = string })), [])
  }))
  validation {
    condition     = length(var.node_pools) >= 1
    error_message = "At least one node pool is required."
  }
  validation {
    condition     = alltrue([for np in var.node_pools : np.min_count <= np.max_count])
    error_message = "Each node pool min_count must be <= max_count."
  }
  validation {
    condition     = alltrue([for np in var.node_pools : np.disk_size_gb >= 50])
    error_message = "Node pool disk size must be at least 50 GB."
  }
}

variable "release_channel" {
  type    = string
  default = "REGULAR"
  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE", "UNSPECIFIED"], var.release_channel)
    error_message = "Release channel must be one of RAPID, REGULAR, STABLE, UNSPECIFIED."
  }
}
```

### 49. Module for Complete BigQuery Analytics Platform
```hcl
# modules/analytics-platform/main.tf
module "raw_zone" {
  source    = "./modules/bq-dataset"
  project   = var.project
  location  = var.location
  dataset_id = "raw"
  description = "Raw ingested data - immutable"
  access = var.raw_zone_access
  table_expiration_ms = null
  labels = merge(var.labels, { zone = "raw" })
}

module "staging_zone" {
  source    = "./modules/bq-dataset"
  project   = var.project
  location  = var.location
  dataset_id = "staging"
  description = "Staging/transformation zone"
  access = var.staging_zone_access
  table_expiration_ms = 2592000000  # 30 days
  labels = merge(var.labels, { zone = "staging" })
}

module "curated_zone" {
  source    = "./modules/bq-dataset"
  project   = var.project
  location  = var.location
  dataset_id = "curated"
  description = "Business-ready curated data"
  access = var.curated_zone_access
  table_expiration_ms = null
  labels = merge(var.labels, { zone = "curated" })
}

module "scheduled_queries" {
  source   = "./modules/bq-scheduled-queries"
  project  = var.project
  location = var.location
  queries  = var.scheduled_queries
  sa_email = var.dts_service_account
  depends_on = [module.raw_zone, module.staging_zone, module.curated_zone]
}

module "reservations" {
  source    = "./modules/bq-reservations"
  project   = var.project
  location  = var.location
  slots_total = var.committed_slots
  assignments = var.slot_assignments
}

module "data_catalog" {
  source    = "./modules/data-catalog"
  project   = var.project
  location  = var.location
  tag_templates = var.catalog_tag_templates
  datasets = {
    raw     = module.raw_zone.dataset_id
    staging = module.staging_zone.dataset_id
    curated = module.curated_zone.dataset_id
  }
}

output "raw_dataset_id"     { value = module.raw_zone.dataset_id }
output "staging_dataset_id" { value = module.staging_zone.dataset_id }
output "curated_dataset_id" { value = module.curated_zone.dataset_id }
```

### 50. Complete Nested Module Pattern: Enterprise GCP Platform
```hcl
# root/main.tf — Full enterprise GCP platform with all nested modules
# This is the top-level orchestration module for a production GCP platform.

locals {
  project     = "my-prod-project"
  org_id      = "123456789012"
  region      = "us-central1"
  env         = terraform.workspace
  common_labels = {
    environment  = terraform.workspace
    managed_by   = "terraform"
    team         = "platform-engineering"
    cost_center  = "cc-1234"
    created_date = "2026-01"
  }
}

# 1. Foundation: IAM, APIs, Org Policies
module "foundation" {
  source          = "./modules/foundation"
  project         = local.project
  org_id          = local.org_id
  billing_account = var.billing_account
  services        = var.required_apis
  org_policies    = var.org_policies
  labels          = local.common_labels
}

# 2. Security: KMS, Secret Manager, Service Accounts, BinAuthZ
module "security" {
  source           = "./modules/security"
  project          = local.project
  region           = local.region
  service_accounts = var.service_accounts
  kms_keyrings     = var.kms_keyrings
  secrets          = var.secrets
  binauthz_config  = var.binauthz_config
  labels           = local.common_labels
  depends_on       = [module.foundation]
}

# 3. Networking: VPC, Subnets, NAT, DNS, VPN, Peering
module "networking" {
  source         = "./modules/networking"
  project        = local.project
  region         = local.region
  vpc_name       = "vpc-${local.env}"
  subnets        = var.subnet_configs
  nat_regions    = var.nat_regions
  dns_zones      = var.dns_zones
  vpn_connections = var.vpn_connections
  vpc_peerings   = var.vpc_peerings
  firewall_rules = var.firewall_rules
  labels         = local.common_labels
  depends_on     = [module.foundation]
}

# 4. Compute: GKE, Cloud Run
module "compute" {
  source         = "./modules/compute"
  project        = local.project
  region         = local.region
  env            = local.env
  vpc_name       = module.networking.vpc_name
  subnet_self_links = module.networking.subnet_self_links
  vpc_connector  = module.networking.vpc_connector_id
  gke_config     = var.gke_config
  cloud_run_apps = var.cloud_run_services
  security_config = {
    sa_emails = module.security.service_account_emails
    kms_key   = module.security.kms_key_ids["compute"]
    binauthz_enabled = var.enable_binary_authorization
  }
  labels         = local.common_labels
  depends_on     = [module.networking, module.security]
}

# 5. Data: Cloud SQL, Redis, GCS, BigQuery
module "data" {
  source         = "./modules/data"
  project        = local.project
  region         = local.region
  env            = local.env
  vpc_id         = module.networking.vpc_id
  subnet_self_links = module.networking.subnet_self_links
  kms_keys       = module.security.kms_key_ids
  postgres_config = var.postgres_config
  redis_config   = var.redis_config
  gcs_buckets    = var.gcs_buckets
  bq_datasets    = var.bq_datasets
  labels         = local.common_labels
  depends_on     = [module.networking, module.security]
}

# 6. Load Balancing & CDN: HTTPS LB, Cloud Armor, CDN
module "load_balancer" {
  source         = "./modules/load-balancer"
  project        = local.project
  env            = local.env
  name           = "lb-${local.env}"
  ssl_domains    = var.ssl_domains
  backends       = module.compute.backend_service_ids
  armor_policy   = module.cloud_armor.policy_id
  ssl_policy     = var.ssl_policy_name
  labels         = local.common_labels
  depends_on     = [module.compute]
}

module "cloud_armor" {
  source        = "./modules/cloud-armor"
  project       = local.project
  policy_name   = "waf-${local.env}"
  enable_owasp  = true
  rate_limits   = var.rate_limit_rules
  geo_blocks    = var.blocked_regions
  adaptive_protection = local.env == "prod"
}

# 7. Observability: Monitoring, Logging, Alerting, Dashboards
module "observability" {
  source         = "./modules/observability"
  project        = local.project
  env            = local.env
  gke_cluster    = module.compute.gke_cluster_name
  sql_instances  = module.data.sql_instance_names
  cloud_run_services = module.compute.cloud_run_service_names
  lb_name        = module.load_balancer.name
  notification_channels = var.notification_channels
  alert_policies = var.alert_policies
  log_sinks      = var.log_sinks
  dashboards     = var.monitoring_dashboards
  labels         = local.common_labels
  depends_on     = [module.compute, module.data, module.load_balancer]
}

# 8. CI/CD: Artifact Registry, Cloud Build, Cloud Deploy
module "cicd" {
  count   = local.env == "prod" ? 1 : 0
  source  = "./modules/cicd"
  project = local.project
  region  = local.region
  build_triggers     = var.build_triggers
  delivery_pipelines = var.delivery_pipelines
  target_clusters    = module.compute.gke_cluster_names
  labels             = local.common_labels
  depends_on         = [module.compute]
}

# Consolidated outputs
output "vpc_id"              { value = module.networking.vpc_id }
output "gke_cluster_endpoint" { value = module.compute.gke_cluster_endpoint; sensitive = true }
output "sql_connection_names" { value = module.data.sql_connection_names }
output "load_balancer_ip"    { value = module.load_balancer.external_ip }
output "sa_emails"           { value = module.security.service_account_emails }
output "secret_ids"          { value = module.security.secret_ids; sensitive = true }
```
