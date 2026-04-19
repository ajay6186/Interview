# Examples 6.1 — Multi-Project Strategy (GCP) (50 examples)

---

## Basic

### 1. Create a GCP project
```hcl
resource "google_project" "my_project" {
  name            = "My App Project"
  project_id      = "my-app-project-${var.suffix}"
  org_id          = var.org_id
  billing_account = var.billing_account
}
```

### 2. Create a project in a folder
```hcl
resource "google_project" "workload" {
  name            = "Workload Project"
  project_id      = "workload-${var.environment}"
  folder_id       = google_folder.env.name
  billing_account = var.billing_account
}
```

### 3. Create a folder
```hcl
resource "google_folder" "engineering" {
  display_name = "Engineering"
  parent       = "organizations/${var.org_id}"
}

resource "google_folder" "envs" {
  for_each     = toset(["dev", "staging", "prod"])
  display_name = title(each.value)
  parent       = google_folder.engineering.name
}
```

### 4. Enable APIs in a project
```hcl
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "cloudsql.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  project            = google_project.workload.project_id
  service            = each.value
  disable_on_destroy = false
}
```

### 5. Set default labels on a project
```hcl
resource "google_project" "labeled" {
  name            = "Labeled Project"
  project_id      = "labeled-project-${var.suffix}"
  org_id          = var.org_id
  billing_account = var.billing_account

  labels = {
    environment = var.environment
    team        = var.team_name
    cost_center = var.cost_center
  }
}
```

### 6. List projects in folder
```bash
gcloud projects list --filter="parent.id=${FOLDER_ID}"
gcloud resource-manager folders list --folder=${FOLDER_ID}
```

### 7. Cross-project provider
```hcl
provider "google" {
  alias   = "workload"
  project = var.workload_project_id
  region  = "us-central1"
}

resource "google_compute_network" "vpc" {
  provider = google.workload
  name     = "workload-vpc"
}
```

### 8. terraform_remote_state across projects
```hcl
data "terraform_remote_state" "shared" {
  backend = "gcs"
  config = {
    bucket = "org-tfstate"
    prefix = "shared-services"
  }
}
```

### 9. Folder IAM
```hcl
resource "google_folder_iam_member" "dev_access" {
  folder = google_folder.envs["dev"].name
  role   = "roles/editor"
  member = "group:dev-team@example.com"
}
```

### 10. Organization IAM
```hcl
resource "google_organization_iam_member" "security_admin" {
  org_id = var.org_id
  role   = "roles/securitycenter.admin"
  member = "group:security@example.com"
}
```

### 11. Project deletion protection
```hcl
resource "google_project" "protected" {
  name            = "Protected Project"
  project_id      = "protected-project"
  org_id          = var.org_id
  billing_account = var.billing_account

  lifecycle { prevent_destroy = true }
}
```

### 12. Billing export to BigQuery
```hcl
resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account
  display_name    = "Monthly Budget"

  budget_filter {
    projects = ["projects/${google_project.workload.number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "1000"
    }
  }

  threshold_rules { threshold_percent = 0.5 }
  threshold_rules { threshold_percent = 0.9 }
  threshold_rules { threshold_percent = 1.0 }
}
```

---

## Intermediate

### 13. Project factory pattern
```hcl
variable "projects" {
  type = map(object({
    folder      = string
    environment = string
    apis        = list(string)
    labels      = map(string)
  }))
}

resource "google_project" "projects" {
  for_each        = var.projects
  name            = each.key
  project_id      = "${each.key}-${random_id.suffix[each.key].hex}"
  folder_id       = google_folder.folders[each.value.folder].name
  billing_account = var.billing_account
  labels          = merge(each.value.labels, { environment = each.value.environment })
}

resource "random_id" "suffix" {
  for_each    = var.projects
  byte_length = 4
}
```

### 14. Shared VPC host project
```hcl
resource "google_compute_shared_vpc_host_project" "host" {
  project = var.host_project_id
}

resource "google_compute_shared_vpc_service_project" "services" {
  for_each        = var.service_project_ids
  host_project    = var.host_project_id
  service_project = each.value
  depends_on      = [google_compute_shared_vpc_host_project.host]
}
```

### 15. Org policy at folder level
```hcl
resource "google_folder_organization_policy" "require_private_ips" {
  folder     = google_folder.envs["prod"].name
  constraint = "compute.vmExternalIpAccess"

  list_policy {
    deny { all = true }
  }
}
```

### 16. Multi-project networking with Shared VPC
```hcl
# Host project owns VPC
# Service projects use subnets via Shared VPC
resource "google_compute_subnetwork_iam_member" "service_project_network_user" {
  for_each   = var.service_project_ids
  project    = var.host_project_id
  region     = var.region
  subnetwork = google_compute_subnetwork.shared.name
  role       = "roles/compute.networkUser"
  member     = "serviceAccount:service-${data.google_project.service[each.key].number}@container-engine-robot.iam.gserviceaccount.com"
}
```

### 17. Project lien (prevent deletion)
```hcl
resource "google_resource_manager_lien" "lien" {
  parent       = "projects/${google_project.critical.number}"
  restrictions = ["resourcemanager.projects.delete"]
  origin       = "terraform"
  reason       = "Critical production project — deletion prevented"
}
```

### 18. Cross-project service account impersonation
```hcl
resource "google_service_account_iam_member" "cross_project" {
  service_account_id = "projects/${var.shared_project}/serviceAccounts/shared-sa@${var.shared_project}.iam.gserviceaccount.com"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:app-sa@${var.workload_project}.iam.gserviceaccount.com"
}
```

### 19. Project-level budget alerts with Pub/Sub
```hcl
resource "google_pubsub_topic" "budget_alerts" {
  name    = "budget-alerts"
  project = var.billing_project_id
}

resource "google_billing_budget" "per_project" {
  for_each        = var.project_budgets
  billing_account = var.billing_account
  display_name    = "${each.key} Monthly Budget"

  budget_filter {
    projects = ["projects/${google_project.projects[each.key].number}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(each.value)
    }
  }

  all_updates_rule {
    pubsub_topic                     = google_pubsub_topic.budget_alerts.id
    schema_version                   = "1.0"
    monitoring_notification_channels = [var.alert_channel]
  }

  threshold_rules { threshold_percent = 0.8 }
  threshold_rules { threshold_percent = 1.0 }
}
```

### 20. Centralized logging sink
```hcl
resource "google_logging_organization_sink" "centralized" {
  name             = "centralized-log-sink"
  org_id           = var.org_id
  destination      = "bigquery.googleapis.com/projects/${var.logging_project}/datasets/${google_bigquery_dataset.logs.dataset_id}"
  filter           = "severity>=WARNING"
  include_children = true

  bigquery_options {
    use_partitioned_tables = true
  }
}

resource "google_project_iam_member" "sink_writer" {
  project = var.logging_project
  role    = "roles/bigquery.dataEditor"
  member  = google_logging_organization_sink.centralized.writer_identity
}
```

### 21. Cross-project GKE access to Cloud SQL
```hcl
# Cloud SQL in DB project, GKE in app project
resource "google_project_iam_member" "gke_cloudsql" {
  project = var.db_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}
```

### 22. Organization policy enforcement
```hcl
locals {
  org_policies = {
    "compute.requireOsLogin"               = { enforced = true }
    "compute.disableSerialPortAccess"      = { enforced = true }
    "iam.disableServiceAccountKeyCreation" = { enforced = true }
    "compute.vmExternalIpAccess"           = { deny_all = true }
  }
}

resource "google_organization_policy" "policies" {
  for_each   = local.org_policies
  org_id     = var.org_id
  constraint = each.key

  boolean_policy {
    enforced = each.value.enforced
  }
}
```

### 23. Project quota increase request
```bash
gcloud services quota update \
  --consumer=project:my-project \
  --service=compute.googleapis.com \
  --metric=compute.googleapis.com/cpus \
  --value=200 \
  --dimensions=region=us-central1
```

### 24. Org-level IAM for break-glass access
```hcl
resource "google_organization_iam_member" "emergency_access" {
  org_id = var.org_id
  role   = "roles/owner"
  member = "group:security-break-glass@example.com"
}
```

### 25. Terraform modules per project type
```
modules/
  project-factory/     # Standardized project creation
  networking-host/     # Shared VPC host setup
  workload-project/    # API enablement + IAM baseline
  security-project/    # SIEM, logging, alerting
  data-project/        # BigQuery, GCS, Dataflow
```

---

## Nested

### 26. Full project hierarchy from variable
```hcl
variable "org_hierarchy" {
  type = object({
    org_id          = string
    billing_account = string
    folders = map(object({
      display_name = string
      parent_type  = string   # "org" or "folder"
      parent_ref   = string
      projects = map(object({
        environment = string
        apis        = list(string)
        budget_usd  = number
      }))
    }))
  })
}

resource "google_folder" "top_level" {
  for_each     = { for k, v in var.org_hierarchy.folders : k => v if v.parent_type == "org" }
  display_name = each.value.display_name
  parent       = "organizations/${var.org_hierarchy.org_id}"
}

resource "google_project" "all_projects" {
  for_each = merge([
    for folder_key, folder in var.org_hierarchy.folders : {
      for proj_key, proj in folder.projects :
      "${folder_key}-${proj_key}" => merge(proj, { folder_key = folder_key })
    }
  ]...)

  name            = each.key
  project_id      = "${each.key}-${random_id.suffix[each.key].hex}"
  folder_id       = google_folder.top_level[each.value.folder_key].name
  billing_account = var.org_hierarchy.billing_account
}
```

### 27. Shared services project pattern
```hcl
# Shared services project: Container Registry, Artifact Registry, Secret Manager
resource "google_project" "shared_services" {
  name            = "Shared Services"
  project_id      = "shared-services-${var.suffix}"
  folder_id       = google_folder.platform.name
  billing_account = var.billing_account
}

resource "google_project_service" "shared_apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "containerscanning.googleapis.com",
  ])
  project = google_project.shared_services.project_id
  service = each.value
}

# Grant all workload projects access to shared services
resource "google_artifact_registry_repository_iam_member" "workload_access" {
  for_each   = var.workload_project_numbers
  project    = google_project.shared_services.project_id
  location   = "us-central1"
  repository = google_artifact_registry_repository.docker.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:service-${each.value}@serverless-robot-prod.iam.gserviceaccount.com"
}
```

### 28. Network hub project
```hcl
resource "google_project" "network_hub" {
  name            = "Network Hub"
  project_id      = "network-hub-${var.suffix}"
  folder_id       = google_folder.platform.name
  billing_account = var.billing_account
}

# VPN gateway in hub project
# All workload VPCs peer to hub VPC
resource "google_compute_network" "hub" {
  project                 = google_project.network_hub.project_id
  name                    = "hub-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}
```

### 29. Multi-project Terraform Cloud workspaces
```hcl
# Each project gets its own TFC workspace:
# - networking/prod workspace
# - gke/prod workspace
# - databases/prod workspace
# - apps/prod workspace
```

### 30. Organization-level Cloud Monitoring
```hcl
resource "google_monitoring_monitored_project" "workload" {
  for_each = var.workload_project_ids
  metrics_scope = "locations/global/metricsScopes/${var.monitoring_project_number}"
  name          = "locations/global/metricsScopes/${var.monitoring_project_number}/projects/${each.value}"
}
```

### 31. Cross-project Pub/Sub for event-driven architecture
```hcl
# Publisher project
resource "google_pubsub_topic" "events" {
  project = var.publisher_project_id
  name    = "domain-events"
}

# Grant subscriber project access
resource "google_pubsub_topic_iam_member" "subscriber" {
  project = var.publisher_project_id
  topic   = google_pubsub_topic.events.name
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:worker-sa@${var.subscriber_project_id}.iam.gserviceaccount.com"
}

# Subscriber project creates subscription
resource "google_pubsub_subscription" "worker" {
  provider = google.subscriber
  project  = var.subscriber_project_id
  name     = "domain-events-worker"
  topic    = "projects/${var.publisher_project_id}/topics/domain-events"
}
```

### 32. Data governance with CMEK per project
```hcl
locals {
  project_keys = {
    for proj_id in var.data_project_ids :
    proj_id => {
      key_ring = "${proj_id}-keyring"
      key_name = "${proj_id}-encryption-key"
    }
  }
}

resource "google_kms_key_ring" "per_project" {
  for_each = local.project_keys
  name     = each.value.key_ring
  location = var.region
  project  = var.kms_project_id
}
```

### 33. Project tagging strategy
```hcl
resource "google_tags_tag_key" "environment" {
  parent       = "organizations/${var.org_id}"
  short_name   = "environment"
  description  = "Deployment environment"
}

resource "google_tags_tag_value" "environments" {
  for_each  = toset(["dev", "staging", "prod"])
  parent    = "tagKeys/${google_tags_tag_key.environment.name}"
  short_name = each.value
}

resource "google_tags_tag_binding" "project_env" {
  name      = "tagBindings/project-env-binding"
  tag_value = "tagValues/${google_tags_tag_value.environments[var.environment].name}"
  parent    = "//cloudresourcemanager.googleapis.com/projects/${google_project.workload.number}"
}
```

### 34. Terraform state per project
```hcl
# Each project has its own state prefix:
# gs://org-tfstate/projects/workload-dev/
# gs://org-tfstate/projects/workload-prod/
# gs://org-tfstate/shared-services/

terraform {
  backend "gcs" {
    bucket = "org-tfstate"
    prefix = "projects/${var.project_id}"
  }
}
```

---

## Advanced

### 35. Organization bootstrap (chicken-and-egg)
```hcl
# Step 1: Manually create seed project + bootstrap SA
# Step 2: Run bootstrap terraform to create org-level resources:
resource "google_organization_iam_member" "bootstrap_sa_roles" {
  for_each = toset([
    "roles/resourcemanager.organizationAdmin",
    "roles/billing.admin",
    "roles/iam.organizationRoleAdmin",
    "roles/orgpolicy.policyAdmin",
  ])
  org_id = var.org_id
  role   = each.value
  member = "serviceAccount:bootstrap@${var.seed_project}.iam.gserviceaccount.com"
}
```

### 36. Landing Zone architecture
```
Organization
├── folders/Bootstrap          # Terraform state, CI/CD
├── folders/Common
│   ├── projects/logging       # Centralized logs
│   ├── projects/monitoring    # Centralized metrics
│   └── projects/network-hub   # Shared VPC
├── folders/Production
│   ├── projects/prod-app      # Application workloads
│   └── projects/prod-data     # Data & analytics
└── folders/Non-Production
    ├── projects/dev-app
    └── projects/staging-app
```

### 37. Terraform-managed project lifecycle
```hcl
# Create → Enable APIs → Set up networking → Deploy workload → Monitor
module "project" {
  source = "./modules/project-factory"

  name            = var.project_name
  org_id          = var.org_id
  billing_account = var.billing_account
  folder_id       = var.folder_id
  apis            = var.apis
  labels          = var.labels
}

module "networking" {
  source     = "./modules/workload-networking"
  project_id = module.project.project_id
  depends_on = [module.project]
}

module "workload" {
  source     = "./modules/app-workload"
  project_id = module.project.project_id
  network_id = module.networking.network_id
  depends_on = [module.networking]
}
```

### 38. Cross-project secret sharing
```hcl
# Secrets owned by shared-services project
resource "google_secret_manager_secret_iam_member" "cross_project" {
  for_each  = var.accessor_service_accounts
  project   = var.shared_project_id
  secret_id = google_secret_manager_secret.shared_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value}"
}
```

### 39. Project-level access control policy
```hcl
resource "google_access_context_manager_gcp_user_access_binding" "binding" {
  organization_id = var.org_id
  group_key       = data.google_cloud_identity_group.prod_team.id
  access_levels   = [google_access_context_manager_access_level.internal.name]
}
```

### 40. Automated project cleanup
```bash
#!/bin/bash
# Delete old feature branch projects (> 30 days old):
gcloud projects list \
  --filter="labels.purpose=feature-branch AND labels.created_date<$(date -d '30 days ago' +%Y%m%d)" \
  --format="value(projectId)" | \
while read proj; do
  echo "Deleting $proj..."
  gcloud projects delete $proj --quiet
done
```

### 41. Terraform modules for project types
```hcl
# Application project (GKE + Cloud SQL + Cloud Run)
module "app_project" {
  source = "./modules/app-project"
  name   = "my-app"
  env    = var.environment
}

# Data project (BigQuery + GCS + Dataflow)
module "data_project" {
  source  = "./modules/data-project"
  name    = "my-data"
  env     = var.environment
  bq_datasets = var.datasets
}

# Security project (SCC + SIEM + logging)
module "security_project" {
  source    = "./modules/security-project"
  name      = "security"
  org_id    = var.org_id
}
```

### 42. Project number vs project ID usage
```hcl
# Project ID: human-readable, globally unique, immutable after creation
# Project number: numeric, auto-assigned, used in API URLs and IAM

data "google_project" "current" {}

locals {
  project_id     = data.google_project.current.project_id
  project_number = data.google_project.current.number

  # Service agent emails use project numbers:
  gke_robot_sa    = "service-${local.project_number}@container-engine-robot.iam.gserviceaccount.com"
  compute_sa      = "${local.project_number}-compute@developer.gserviceaccount.com"
}
```

### 43. Billing alert across all projects
```hcl
resource "google_billing_budget" "org_wide" {
  billing_account = var.billing_account
  display_name    = "Organization Total Monthly Budget"

  # No project filter = entire billing account
  amount {
    specified_amount {
      currency_code = "USD"
      units         = "10000"
    }
  }

  threshold_rules { threshold_percent = 0.5 }
  threshold_rules { threshold_percent = 0.75 }
  threshold_rules { threshold_percent = 0.9 }
  threshold_rules { threshold_percent = 1.0 }
  threshold_rules { threshold_percent = 1.2 }   # Alert even over budget

  all_updates_rule {
    pubsub_topic = google_pubsub_topic.billing_alerts.id
    monitoring_notification_channels = var.alert_channels
  }
}
```

### 44. Cross-project Cloud Armor policy
```hcl
# Cloud Armor policies are project-scoped but can reference resources from other projects
provider "google" {
  alias   = "security"
  project = var.security_project_id
}

resource "google_compute_security_policy" "waf" {
  provider = google.security
  name     = "organization-waf"
  # Referenced by workload projects' backend services
}
```

### 45. Network tagging across projects
```hcl
# Share firewall tags across shared VPC:
resource "google_tags_tag_key" "network_tier" {
  parent     = "organizations/${var.org_id}"
  short_name = "network-tier"
}

resource "google_tags_tag_value" "tiers" {
  for_each   = toset(["web", "app", "db", "tools"])
  parent     = "tagKeys/${google_tags_tag_key.network_tier.name}"
  short_name = each.value
}
```

### 46. Project migration between folders
```bash
gcloud resource-manager projects move my-project \
  --folder=new-folder-id

# Terraform: update folder_id in project resource
# NOTE: Moving projects doesn't destroy/recreate — just updates folder
```

### 47. Centralized binary authorization
```hcl
resource "google_binary_authorization_policy" "org_policy" {
  project = var.security_project_id

  global_policy_evaluation_mode = "ENABLE"

  default_admission_rule {
    evaluation_mode  = "REQUIRE_ATTESTATION"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    require_attestations_by = [
      google_binary_authorization_attestor.prod_attestor.name
    ]
  }

  cluster_admission_rules {
    cluster                 = "${var.region}.${google_container_cluster.prod.name}"
    evaluation_mode         = "REQUIRE_ATTESTATION"
    enforcement_mode        = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    require_attestations_by = [google_binary_authorization_attestor.prod_attestor.name]
  }
}
```

### 48. Organization-level Security Health Analytics
```hcl
resource "google_project_service" "scc" {
  project = var.security_project_id
  service = "securitycenter.googleapis.com"
}

resource "google_scc_source" "custom_source" {
  display_name = "Custom Security Source"
  organization = var.org_id
  description  = "Custom security findings from internal tools"
}
```

### 49. Resource hierarchy best practices
```
# 1. Bootstrap folder (never delete these)
#    - TF state project
#    - Seed project
#    - CI/CD project

# 2. Common folder
#    - Network hub
#    - Logging
#    - Monitoring
#    - Security

# 3. Environment folders
#    - Production
#      - App projects
#      - Data projects
#    - Non-production
#      - Dev
#      - Staging

# 4. Org policies at folder level, not project level
# 5. Billing budgets per team/environment
# 6. Separate billing accounts for prod vs non-prod if needed
```

### 50. Full organization management stack
```hcl
# Organization-level policies
resource "google_organization_policy" "policies" {
  for_each = {
    "compute.requireOsLogin"               = { boolean = { enforced = true } }
    "compute.disableSerialPortAccess"      = { boolean = { enforced = true } }
    "iam.disableServiceAccountKeyCreation" = { boolean = { enforced = true } }
    "compute.vmExternalIpAccess"           = { list = { deny_all = "DENY" } }
    "storage.uniformBucketLevelAccess"     = { boolean = { enforced = true } }
  }
  org_id     = var.org_id
  constraint = each.key
  # Note: Terraform's org policy resource can't easily handle both types dynamically
  # In practice, use separate resources for boolean vs list policies
}

# Folder structure
resource "google_folder" "platform"   { display_name = "Platform";    parent = "organizations/${var.org_id}" }
resource "google_folder" "production" { display_name = "Production";  parent = "organizations/${var.org_id}" }
resource "google_folder" "nonprod"    { display_name = "Non-Production"; parent = "organizations/${var.org_id}" }

# Platform projects
module "network_project"  { source = "./modules/project"; name = "network-hub";     folder = google_folder.platform.name }
module "logging_project"  { source = "./modules/project"; name = "centralized-log"; folder = google_folder.platform.name }
module "security_project" { source = "./modules/project"; name = "security-siem";   folder = google_folder.platform.name }

# Centralized logging
resource "google_logging_organization_sink" "centralized" {
  name             = "org-log-sink"
  org_id           = var.org_id
  destination      = "bigquery.googleapis.com/projects/${module.logging_project.project_id}/datasets/${google_bigquery_dataset.org_logs.dataset_id}"
  filter           = "severity>=WARNING"
  include_children = true
}

# Org-level budgets
resource "google_billing_budget" "total" {
  billing_account = var.billing_account
  display_name    = "Total Org Budget"
  amount { specified_amount { currency_code = "USD"; units = "50000" } }
  threshold_rules { threshold_percent = 0.8 }
  threshold_rules { threshold_percent = 1.0 }
}
```
