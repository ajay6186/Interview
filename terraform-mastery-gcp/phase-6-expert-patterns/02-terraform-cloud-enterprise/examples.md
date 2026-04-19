# Examples 6.2 — Terraform Cloud & Enterprise (GCP) (50 examples)

---

## Basic

### 1. Terraform Cloud backend
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "gcp-production"
    }
  }
}
```

### 2. TFC workspace with tags
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      tags = ["gcp", "production", "us-central1"]
    }
  }
}
```

### 3. TFC CLI login
```bash
terraform login
# Opens browser for authentication
# Stores token in ~/.terraform.d/credentials.tfrc.json
```

### 4. TFC remote run
```bash
# All plans/applies run remotely in TFC:
terraform plan   # Queued in TFC
terraform apply  # Requires manual confirmation in TFC UI
```

### 5. TFC environment variables for GCP auth
```bash
# Set in TFC workspace → Variables:
# GOOGLE_CREDENTIALS = <contents of service account JSON>
# TF_VAR_project_id = my-gcp-project
# TF_VAR_region = us-central1
```

### 6. TFC dynamic credentials for GCP (OIDC)
```bash
# In TFC workspace variables (sensitive):
# TFC_GCP_PROVIDER_AUTH = true
# TFC_GCP_SERVICE_ACCOUNT_EMAIL = terraform@project.iam.gserviceaccount.com
# TFC_GCP_WORKLOAD_PROVIDER_NAME = projects/NUM/locations/global/workloadIdentityPools/POOL/providers/PROVIDER
```

### 7. GCP Workload Identity for TFC
```hcl
resource "google_iam_workload_identity_pool" "tfc" {
  workload_identity_pool_id = "tfc-pool"
  display_name              = "Terraform Cloud Pool"
}

resource "google_iam_workload_identity_pool_provider" "tfc" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.tfc.workload_identity_pool_id
  workload_identity_pool_provider_id = "tfc-provider"
  display_name                       = "TFC OIDC Provider"

  oidc {
    issuer_uri = "https://app.terraform.io"
    allowed_audiences = ["https://app.terraform.io"]
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.aud"        = "assertion.aud"
    "attribute.terraform_organization_id"   = "assertion.terraform_organization_id"
    "attribute.terraform_workspace_id"      = "assertion.terraform_workspace_id"
  }

  attribute_condition = "attribute.terraform_organization_id == '${var.tfc_org_id}'"
}
```

### 8. SA bound to TFC workspace
```hcl
resource "google_service_account_iam_member" "tfc_sa" {
  service_account_id = google_service_account.terraform_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.tfc.name}/attribute.terraform_workspace_id/${var.tfc_workspace_id}"
}
```

### 9. TFC run trigger between workspaces
```bash
# In TFC: Settings → Run Triggers
# networking workspace → triggers → gke workspace
```

### 10. TFC team-based access
```bash
# TFC Teams → Assign permissions:
# - Readers: can see runs but not apply
# - Plan: can run plans
# - Apply: can apply plans
# - Admin: full workspace access
```

### 11. TFC variable sets
```bash
# TFC → Variable Sets:
# - "GCP Production Credentials" — applies to all prod workspaces
# - "GCP Dev Credentials" — applies to all dev workspaces
```

### 12. TFC Sentinel policy check
```python
# sentinel/restrict-regions.sentinel
import "tfplan/v2" as tfplan

allowed_regions = ["us-central1", "europe-west1"]

main = rule {
  all tfplan.resource_changes as _, changes {
    all changes.change.after as attr_name, attr_value {
      attr_name != "region" or
      attr_value in allowed_regions
    }
  }
}
```

---

## Intermediate

### 13. TFC workspace with remote state sharing
```bash
# In TFC workspace: Settings → Remote state sharing
# Enable for specific workspaces that need to read outputs
```

### 14. Read TFC workspace remote state
```hcl
data "terraform_remote_state" "networking" {
  backend = "remote"
  config = {
    organization = "my-org"
    workspaces = {
      name = "gcp-networking-prod"
    }
  }
}

locals {
  vpc_id    = data.terraform_remote_state.networking.outputs.vpc_id
  subnet_id = data.terraform_remote_state.networking.outputs.subnet_id
}
```

### 15. TFC Agents for private GCP resources
```hcl
# TFC Agent runs inside GCP (GKE or Compute Engine)
# Connects outbound to TFC — no inbound firewall rules needed

# Deploy agent on GKE:
resource "kubernetes_deployment" "tfc_agent" {
  metadata { name = "tfc-agent"; namespace = "terraform" }

  spec {
    replicas = 2
    template {
      spec {
        containers {
          name  = "tfc-agent"
          image = "hashicorp/tfc-agent:latest"
          env {
            name  = "TFC_AGENT_TOKEN"
            value = var.tfc_agent_token
          }
          env {
            name  = "TFC_AGENT_NAME"
            value = "gcp-agent"
          }
        }
      }
    }
  }
}
```

### 16. TFC workspace via TFE Terraform provider
```hcl
terraform {
  required_providers {
    tfe = {
      source  = "hashicorp/tfe"
      version = "~> 0.51"
    }
  }
}

provider "tfe" {
  token = var.tfc_token
}

resource "tfe_workspace" "gcp_prod" {
  name         = "gcp-production"
  organization = var.tfc_org

  auto_apply           = false
  terraform_version    = "~> 1.6.0"
  working_directory    = "stacks/production"
  vcs_repo {
    identifier     = "my-org/terraform-gcp"
    oauth_token_id = var.tfc_github_oauth_token
  }
}
```

### 17. TFC workspace variables via TFE provider
```hcl
resource "tfe_variable" "project_id" {
  workspace_id = tfe_workspace.gcp_prod.id
  key          = "project_id"
  value        = var.project_id
  category     = "terraform"
  description  = "GCP Project ID"
}

resource "tfe_variable" "google_credentials" {
  workspace_id = tfe_workspace.gcp_prod.id
  key          = "GOOGLE_CREDENTIALS"
  value        = var.gcp_credentials_json
  category     = "env"
  sensitive    = true
  description  = "GCP Service Account JSON"
}
```

### 18. Policy sets
```hcl
resource "tfe_policy_set" "gcp_policies" {
  organization = var.tfc_org
  name         = "gcp-governance"
  description  = "GCP governance policies"

  policies_path = "sentinel/"
  vcs_repo {
    identifier     = "my-org/sentinel-policies"
    oauth_token_id = var.tfc_github_oauth_token
  }

  workspace_ids = [
    tfe_workspace.gcp_prod.id,
    tfe_workspace.gcp_staging.id,
  ]
}
```

### 19. Run triggers between workspaces
```hcl
resource "tfe_workspace_run_task" "snyk" {
  workspace_id          = tfe_workspace.gcp_prod.id
  task_id               = tfe_task.snyk_scan.id
  enforcement_level     = "advisory"
  stage                 = "pre_plan"
}
```

### 20. TFC notifications
```hcl
resource "tfe_notification_configuration" "slack" {
  workspace_id     = tfe_workspace.gcp_prod.id
  name             = "slack-alerts"
  destination_type = "slack"
  url              = var.slack_webhook_url
  enabled          = true

  triggers = [
    "run:errored",
    "run:needs_attention",
    "assessment:drifted",
  ]
}
```

### 21. TFC Drift Detection
```bash
# TFC Health Assessment (Drift Detection):
# Settings → Health → Enable health assessments
# Runs terraform plan on a schedule
# Alerts when infrastructure drifts from state
```

### 22. TFC Teams and permissions
```hcl
resource "tfe_team" "gcp_admins" {
  organization = var.tfc_org
  name         = "gcp-admins"
}

resource "tfe_team_access" "gcp_admin_access" {
  team_id      = tfe_team.gcp_admins.id
  workspace_id = tfe_workspace.gcp_prod.id
  access       = "admin"
}

resource "tfe_team_member" "members" {
  for_each  = var.admin_usernames
  team_id   = tfe_team.gcp_admins.id
  username  = each.value
}
```

### 23. TFC workspace outputs
```bash
# In consuming workspace:
data "tfe_outputs" "networking" {
  organization = "my-org"
  workspace    = "gcp-networking-prod"
}

locals {
  vpc_id = data.tfe_outputs.networking.values.vpc_id
}
```

### 24. Terraform Enterprise installation on GCP
```hcl
# TFE on GCP — deploy on GKE with external PostgreSQL:
resource "google_container_cluster" "tfe" {
  name     = "terraform-enterprise"
  location = var.region
  removal_default_node_pool = true
  initial_node_count = 1
}

resource "google_sql_database_instance" "tfe" {
  name             = "tfe-postgres"
  database_version = "POSTGRES_15"
  region           = var.region
  settings { tier = "db-custom-4-15360" }
}
```

### 25. Cost estimation in TFC
```bash
# TFC automatically estimates costs for supported resources:
# - google_compute_instance
# - google_sql_database_instance
# - google_storage_bucket
# Shown in plan output before apply
```

---

## Nested

### 26. Full TFC workspace factory
```hcl
variable "workspaces" {
  type = map(object({
    description        = string
    auto_apply         = bool
    working_directory  = string
    terraform_version  = string
    trigger_patterns   = list(string)
    variables          = map(string)
    sensitive_vars     = map(string)
  }))
}

resource "tfe_workspace" "workspaces" {
  for_each      = var.workspaces
  name          = each.key
  organization  = var.tfc_org
  description   = each.value.description
  auto_apply    = each.value.auto_apply
  working_directory = each.value.working_directory

  vcs_repo {
    identifier     = "${var.github_org}/${var.github_repo}"
    oauth_token_id = var.tfc_oauth_token
    branch         = "main"
  }
}
```

### 27. Sentinel policy for GCP resource compliance
```python
# sentinel/require-labels.sentinel
import "tfplan/v2" as tfplan

required_labels = ["environment", "team", "managed_by"]

violating_resources = filter tfplan.resource_changes as addr, change {
  change.change.actions contains "create" and
  change.provider_name contains "google" and
  not all required_labels as label {
    label in (change.change.after.labels else {})
  }
}

main = rule { length(violating_resources) == 0 }
```

### 28. Sentinel for cost control
```python
# sentinel/restrict-machine-types.sentinel
import "tfplan/v2" as tfplan

approved_machine_types = [
  "e2-micro", "e2-small", "e2-medium",
  "e2-standard-2", "e2-standard-4"
]

# Block expensive machine types in non-prod
main = rule when tfplan.workspace.name contains "dev" {
  all tfplan.resource_changes as _, change {
    change.type != "google_compute_instance" or
    (change.change.after.machine_type else "") in approved_machine_types
  }
}
```

### 29. TFC stack with run triggers chain
```hcl
# networking workspace → gke workspace → apps workspace
resource "tfe_workspace_run_task" "validate" {
  workspace_id      = tfe_workspace.networking.id
  task_id           = tfe_task.validate.id
  enforcement_level = "mandatory"
  stage             = "post_plan"
}

# After networking apply → trigger gke workspace:
# (Configured via TFC UI or tfe_run_trigger resource)
```

### 30. Team-based workspace access matrix
```hcl
locals {
  team_workspace_access = {
    networking-team = {
      workspaces = ["gcp-networking-dev", "gcp-networking-prod"]
      access     = "write"
    }
    app-team = {
      workspaces = ["gcp-app-dev", "gcp-app-staging", "gcp-app-prod"]
      access     = "plan"
    }
    platform-admins = {
      workspaces = ["*"]   # All workspaces
      access     = "admin"
    }
  }
}
```

### 31. Private module registry
```hcl
resource "tfe_registry_module" "gcp_network" {
  organization = var.tfc_org
  module_provider = "google"

  vcs_repo {
    display_identifier = "my-org/terraform-gcp-network"
    identifier         = "my-org/terraform-gcp-network"
    oauth_token_id     = var.tfc_oauth_token
  }
}

# Consumers use:
module "networking" {
  source  = "app.terraform.io/my-org/network/google"
  version = "~> 2.0"
}
```

### 32. Audit logging TFC runs
```hcl
resource "tfe_audit_trail_token" "audit" {
  organization = var.tfc_org
}

# Export audit logs to GCS or BigQuery
# Use webhook or Pub/Sub integration
```

### 33. TFC + GitHub Actions integration
```yaml
# .github/workflows/terraform.yml
name: Terraform Plan
on: pull_request
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          cli_config_credentials_token: ${{ secrets.TFC_TOKEN }}
      - run: terraform init
      - run: terraform plan -no-color
```

### 34. TFC workspace for each environment
```hcl
locals {
  environments = ["dev", "staging", "prod"]
}

resource "tfe_workspace" "envs" {
  for_each      = toset(local.environments)
  name          = "gcp-platform-${each.value}"
  organization  = var.tfc_org
  auto_apply    = each.value != "prod"

  vcs_repo {
    identifier     = "my-org/terraform-gcp-platform"
    oauth_token_id = var.tfc_oauth_token
    branch         = each.value == "prod" ? "main" : each.value
  }
}
```

---

## Advanced

### 35. TFC Stacks (Terraform Stacks feature)
```hcl
# stack.tfstack.hcl (new Stacks HCL format)
component "networking" {
  source = "./networking"
  inputs = {
    project_id = var.project_id
    region     = var.region
  }
}

component "gke" {
  source = "./gke"
  inputs = {
    project_id = var.project_id
    network_id = component.networking.outputs.network_id
  }
  depends_on = [component.networking]
}
```

### 36. Policy as Code with OPA/Conftest
```rego
# policies/gcp-no-public-buckets.rego
package main

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "google_storage_bucket"
  resource.change.after.public_access_prevention != "enforced"
  msg = sprintf("GCS bucket '%s' must have public_access_prevention = enforced", [resource.address])
}
```
```bash
conftest test plan.json --policy policies/
```

### 37. Terraform Enterprise high availability on GCP
```hcl
# TFE Active/Active with Redis:
resource "google_redis_instance" "tfe" {
  name           = "tfe-redis"
  memory_size_gb = 4
  region         = var.region
  tier           = "STANDARD_HA"
}

# TFE Active/Active with external Vault:
# google_container_cluster.tfe with Vault sidecar injector
```

### 38. GitOps with TFC + GitHub
```bash
# PR → Plan in TFC → Review plan output in PR comment
# Merge → Auto-apply in TFC (if auto_apply = true)
# Tag v1.0.0 → Trigger prod workspace with specific version

# TFC VCS integration automatically:
# 1. Plans on PR
# 2. Applies on merge (if auto_apply)
# 3. Shows plan output in PR
```

### 39. Compliance automation with TFC Sentinel
```python
# sentinel/gcp-no-external-ips.sentinel
import "tfplan/v2" as tfplan
import "strings"

main = rule {
  all tfplan.resource_changes as _, change {
    change.type != "google_compute_instance" or
    all (change.change.after.network_interface else []) as ni {
      length(ni.access_config else []) == 0
    }
  }
}
```

### 40. TFC Cost Estimation guards
```python
# sentinel/max-monthly-cost.sentinel
import "tfrun"

max_monthly_cost = 5000.0

main = rule {
  tfrun.cost_estimate.delta_monthly_cost < max_monthly_cost
}
```

### 41. TFC API automation
```bash
# Create workspace via TFC API:
curl -s \
  -H "Authorization: Bearer $TFC_TOKEN" \
  -H "Content-Type: application/vnd.api+json" \
  -X POST \
  -d '{"data":{"type":"workspaces","attributes":{"name":"gcp-new-workspace","terraform-version":"1.6.0"}}}' \
  https://app.terraform.io/api/v2/organizations/my-org/workspaces
```

### 42. Multi-cloud with TFC variable sets
```hcl
# AWS variable set for cross-cloud resources:
resource "tfe_variable_set" "aws_creds" {
  organization = var.tfc_org
  name         = "AWS Production Credentials"
  description  = "AWS credentials for cross-cloud resources"
}

resource "tfe_variable_set" "gcp_creds" {
  organization = var.tfc_org
  name         = "GCP Production Credentials"
  description  = "GCP credentials for workload project"
}
```

### 43. Ephemeral workspaces for feature branches
```hcl
# CI creates workspace on PR open, destroys on PR close
resource "tfe_workspace" "feature" {
  name          = "gcp-feature-${var.pr_number}"
  organization  = var.tfc_org
  auto_apply    = true
  auto_destroy_at = timeadd(timestamp(), "168h")  # 7 days TTL
}
```

### 44. TFC + Cloud Build integration
```hcl
resource "google_cloudbuild_trigger" "terraform" {
  name = "terraform-plan-pr"
  github {
    owner = var.github_org
    name  = var.github_repo
    pull_request { branch = ".*" }
  }

  build {
    step {
      name = "hashicorp/terraform"
      args = ["plan", "-no-color"]
      env  = ["TFC_TOKEN=${var.tfc_token}"]
    }
  }
}
```

### 45. TFE with SAML SSO
```bash
# TFE Admin Console → SSO → Configure SAML:
# - Metadata URL from IdP (Okta, Azure AD, etc.)
# - Sign-in URL
# - Certificate

# Map IdP groups to TFE teams for RBAC
```

### 46. Terraform provider version management in TFC
```hcl
# Pin provider in required_providers to prevent drift:
terraform {
  required_version = "~> 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.14"
    }
  }

  cloud {
    organization = "my-org"
    workspaces { name = "gcp-production" }
  }
}
```

### 47. TFC Workspace destruction policy
```hcl
resource "tfe_workspace" "ephemeral" {
  name            = "gcp-test-${var.suffix}"
  organization    = var.tfc_org
  auto_apply      = true

  lifecycle {
    # Don't recreate workspace if settings change externally
    ignore_changes = [auto_apply, terraform_version]
  }
}

# Self-destruct: after testing, trigger destroy run via TFC API
```

### 48. Compliance reporting from TFC audit logs
```bash
# Audit log events in TFC:
# - workspace_created, workspace_deleted
# - run_applied, run_errored, run_cancelled
# - variable_updated (sensitive vars masked)
# Stream to BigQuery via Pub/Sub for compliance reporting
```

### 49. TFC HCP Waypoint for self-service
```hcl
# HCP Waypoint templates allow developers to provision
# pre-approved infrastructure templates:
# - "Create a Cloud Run service" → provisions full stack
# - "Create a PostgreSQL database" → provisions Cloud SQL
# All backed by Terraform with enforced governance
```

### 50. Full enterprise GCP deployment with TFC
```hcl
# TFE/TFC workspace configuration (managed by platform team):
resource "tfe_workspace" "prod" {
  name          = "gcp-production"
  organization  = var.tfc_org
  auto_apply    = false   # Always require manual approval for prod
  terraform_version = "~> 1.6.0"

  vcs_repo {
    identifier     = "my-org/terraform-gcp"
    oauth_token_id = var.tfc_oauth_token
    branch         = "main"
  }

  working_directory = "stacks/production"
  agent_pool_id    = var.gcp_agent_pool_id   # TFC Agent in GCP
}

# TFC dynamic credentials (no static SA keys):
resource "tfe_variable" "tfc_gcp_auth" {
  for_each     = {
    TFC_GCP_PROVIDER_AUTH       = "true"
    TFC_GCP_SERVICE_ACCOUNT_EMAIL = "terraform@${var.project_id}.iam.gserviceaccount.com"
    TFC_GCP_WORKLOAD_PROVIDER_NAME = google_iam_workload_identity_pool_provider.tfc.name
  }
  workspace_id = tfe_workspace.prod.id
  key          = each.key
  value        = each.value
  category     = "env"
  sensitive    = false
}

# Sentinel policies:
resource "tfe_policy_set" "governance" {
  organization  = var.tfc_org
  name          = "gcp-governance"
  workspace_ids = [tfe_workspace.prod.id]
}

# Notifications:
resource "tfe_notification_configuration" "prod_alerts" {
  workspace_id     = tfe_workspace.prod.id
  name             = "prod-run-alerts"
  destination_type = "slack"
  url              = var.slack_webhook
  enabled          = true
  triggers         = ["run:errored", "run:needs_attention", "assessment:drifted"]
}
```
