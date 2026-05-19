# Examples 1.1 — Providers & Configuration (GCP) (50 examples)

> **Topic Overview:** The GCP Terraform provider (`hashicorp/google`) is your bridge between HCL configuration and the Google Cloud APIs. Unlike AWS which uses account-level credentials, GCP uses project-scoped resources and service account impersonation for secure access. Key concepts: `project`, `region`, and `zone` are set at the provider level; `google-beta` is a separate provider for beta-API features; Workload Identity Federation (WIF) enables keyless authentication from CI/CD systems; and `impersonate_service_account` is the GCP equivalent of AWS `assume_role`.

---

## Basic

### 1. Minimal GCP provider block

> The simplest valid GCP provider configuration. Sets the default project and region for all resources in this configuration. Without these, every resource must specify them individually. GCP uses project IDs (lowercase, hyphen-separated) not project numbers.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

### 2. required_providers block for GCP

> Always declare `required_providers` in production configurations. The `source` must be `hashicorp/google` — Terraform will error if you omit it and a provider named `google` exists in multiple registries. `~> 5.0` allows patch updates but prevents major version bumps that could introduce breaking changes.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}
```

### 3. Pinning exact provider version

> Exact version pinning (`5.14.0`) ensures every team member and CI run uses identical provider behavior. Useful when you've verified a specific version works and want to prevent any drift until you explicitly upgrade. When upgrading, bump the pin and test — don't use `~>` constraints in security-sensitive configurations.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.14.0"
    }
  }
}
```

### 4. Minimum Terraform version constraint

> `required_version` prevents running with an older Terraform binary that might not support syntax features you're using. This is especially important in teams where engineers may have different Terraform versions installed. CI/CD pipelines should pin to the same version via `.terraform-version` (used by `tfenv`) or the CI config.

```hcl
terraform {
  required_version = ">= 1.6.0"
}
```

### 5. Authentication via environment variable

> `GOOGLE_APPLICATION_CREDENTIALS` points to a service account JSON key file — the traditional authentication method. The provider also respects `GOOGLE_PROJECT` and `GOOGLE_REGION`, so you can run `terraform plan` without any credentials in the HCL. For production, prefer Workload Identity Federation over key files to eliminate long-lived credentials.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export GOOGLE_PROJECT="my-gcp-project"
export GOOGLE_REGION="us-central1"
terraform plan
```

### 6. Authentication via gcloud ADC

> Application Default Credentials (ADC) are the preferred authentication method for local development. `gcloud auth application-default login` opens a browser OAuth flow and stores credentials locally. The GCP provider automatically discovers ADC — no credentials file reference needed in `provider` block. Never use this in CI/CD.

```bash
gcloud auth application-default login
# Provider automatically picks up ADC credentials
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

### 7. terraform init for GCP

> `terraform init` downloads the GCP provider plugin and initializes the backend. `-upgrade` fetches newer versions within your constraints. `-reconfigure` re-initializes without migrating state — use it when switching backends. Always run `init` after adding a new provider or changing version constraints.

```bash
terraform init                    # initialize working directory
terraform init -upgrade           # upgrade provider versions
terraform init -reconfigure       # reconfigure backend
```

### 8. Version constraint operators

> GCP provider version constraint operators: `~>` (pessimistic, most common), `>=` (minimum version), `=` (exact pin). The `~> 5.0` constraint is read "greater than or equal to 5.0, less than 6.0" — it allows all 5.x releases. Use `~> 5.14` to allow only 5.14.x patch releases.

```hcl
version = "~> 5.0"      # >= 5.0, < 6.0
version = ">= 5.0"      # 5.0 or later
version = "= 5.14.0"    # exactly 5.14.0
version = ">= 5.0, < 6.0"  # range
```

### 9. Provider with credentials file path

> The `credentials` argument accepts a file path string or the JSON content directly. Using `file()` loads the service account key at plan/apply time. This approach is discouraged for production — the key file must be present on disk and could be accidentally committed. Prefer `GOOGLE_APPLICATION_CREDENTIALS` env var or WIF.

```hcl
provider "google" {
  project     = "my-gcp-project"
  region      = "us-central1"
  credentials = file("service-account.json")
}
```

### 10. GOOGLE_PROJECT environment variable

> Setting `GOOGLE_PROJECT` and `GOOGLE_REGION` as environment variables allows a minimal provider block with no configuration values — everything is injected at runtime. This is useful in CI/CD where project IDs differ per environment and are injected as pipeline variables. The provider reads these automatically.

```bash
export GOOGLE_PROJECT=my-gcp-project
export GOOGLE_REGION=us-central1
terraform apply
```

### 11. Listing installed providers

> `terraform providers` shows the provider requirements and sources for the current configuration. `terraform version` shows both the Terraform binary version and all installed provider versions — essential for bug reports and auditing. Run this before and after `terraform init -upgrade` to verify what changed.

```bash
terraform providers        # show providers used by configuration
terraform version          # show Terraform and provider versions
```

### 12. Lock file for reproducibility

> `.terraform.lock.hcl` records the exact provider version and hash that was downloaded. Committing this file to version control ensures every `terraform init` installs the identical binary. Never add it to `.gitignore`. `terraform providers lock` explicitly regenerates the lock file, useful when adding new platform hashes.

```bash
# .terraform.lock.hcl is auto-generated — commit it to version control
terraform init             # creates/updates .terraform.lock.hcl
terraform providers lock   # explicitly update lock file
```

---

## Intermediate

### 13. Provider alias for multiple regions

> GCP provider aliases allow resources in different regions within a single configuration. The default provider (`google`) handles `us-central1` resources; the `google.europe` alias handles `europe-west1`. Any resource can reference a non-default provider with `provider = google.europe`. Region-specific resources like storage buckets, VMs, and subnets use this pattern.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

provider "google" {
  alias   = "europe"
  project = "my-gcp-project"
  region  = "europe-west1"
}

resource "google_storage_bucket" "eu_bucket" {
  provider = google.europe
  name     = "my-europe-bucket"
  location = "EU"
}
```

### 14. Provider with impersonated service account

> `impersonate_service_account` is the GCP equivalent of AWS `assume_role`. Your personal credentials (or CI runner credentials) impersonate a dedicated Terraform service account. This limits blast radius — the Terraform SA has only the permissions needed for deployment, and audit logs show the Terraform SA's actions. Requires `roles/iam.serviceAccountTokenCreator` on the target SA.

```hcl
provider "google" {
  project                     = "my-gcp-project"
  region                      = "us-central1"
  impersonate_service_account = "terraform@my-gcp-project.iam.gserviceaccount.com"
}
```

### 15. google-beta provider alongside stable

> `google-beta` is a separate provider that exposes GCP beta APIs and features not yet in the stable `google` provider. Declare both providers when you need beta features for some resources but stable for others. Resources that use beta APIs must explicitly set `provider = google-beta` — they can't use the stable provider.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

provider "google-beta" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

### 16. required_providers with google and google-beta

> When using both stable and beta GCP providers, declare both in `required_providers` with matching version constraints. Using the same version for both (`~> 5.0`) ensures compatibility — the beta provider should always be the same major version as the stable provider. Pin both to the same version in production.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}
```

### 17. Multiple GCP projects with aliases

> In GCP, resources belong to projects (unlike AWS where they belong to accounts). Multiple project aliases let you manage resources across projects in a single Terraform configuration — useful for cross-project networking (Shared VPC), org-level IAM, or managing a project hierarchy. Each alias is a completely independent provider instance.

```hcl
provider "google" {
  alias   = "dev"
  project = "my-dev-project"
  region  = "us-central1"
}

provider "google" {
  alias   = "prod"
  project = "my-prod-project"
  region  = "us-central1"
}
```

### 18. required_providers with multiple providers

> Most real GCP configurations need at least `google` plus utility providers: `random` for generating unique names (GCS bucket names must be globally unique), `null` for provisional logic, and sometimes `helm` or `kubernetes` for GKE cluster management. All must be declared in `required_providers` with appropriate version constraints.

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}
```

### 19. Provider with zone specification

> In GCP, `zone` is a subdivision of a `region` (e.g., `us-central1-a`). Setting `zone` at the provider level sets the default for zonal resources (Compute Engine instances, persistent disks). Resources that support multi-zone or regional deployment (like MIGs, Cloud SQL with HA) ignore the provider zone. Override per-resource with the `zone` attribute.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  zone    = "us-central1-a"
}
```

### 20. Using Workload Identity Federation (OIDC)

> Workload Identity Federation (WIF) eliminates service account key files from CI/CD. GitHub Actions (or other OIDC-capable CI systems) exchanges its OIDC token for a short-lived GCP access token via the WIF pool. The provider automatically handles this if `GOOGLE_APPLICATION_CREDENTIALS` points to a WIF configuration file. No long-lived keys anywhere.

```hcl
# For GitHub Actions using WIF — no service account key needed
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  # GOOGLE_APPLICATION_CREDENTIALS points to WIF config file set by GitHub Actions
}
```

### 21. Provider version with multiple constraints

> A range constraint like `>= 5.0, < 6.0` is equivalent to `~> 5.0` but more explicit. Use range constraints when you need to exclude specific versions (e.g., `>= 5.0, != 5.3.0, < 6.0` to skip a known-buggy release). The `,` is AND — all constraints must be satisfied simultaneously.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 6.0"
    }
  }
}
```

### 22. Access token authentication

> Passing a short-lived OAuth2 access token directly to the provider works for automation scenarios where you've already obtained a token via the GCP metadata server or `gcloud auth print-access-token`. Tokens expire after 1 hour — this pattern only works for quick operations. Never hardcode a token; always use `var.google_access_token` populated at runtime.

```hcl
provider "google" {
  project      = "my-gcp-project"
  region       = "us-central1"
  access_token = var.google_access_token
}
```

### 23. Scopes for ADC credentials

> When using `gcloud auth application-default login` for local development, the `--scopes` flag ensures your ADC token has the right OAuth scopes. `https://www.googleapis.com/auth/cloud-platform` is the broad scope that covers all GCP APIs. Use this if you hit "insufficient permissions" errors during local Terraform runs with ADC.

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/cloud-platform
```

### 24. User project override for quota

> `user_project_override = true` with `billing_project` routes API quota usage to a specific project. This is required when using service account impersonation across projects — without it, API quota is charged to the project owning the service account, not the project being managed. Essential in multi-project organization setups.

```hcl
provider "google" {
  project               = "my-gcp-project"
  region                = "us-central1"
  user_project_override = true
  billing_project       = "my-billing-project"
}
```

### 25. Provider with request timeout

> `request_timeout` sets the maximum duration for individual API calls before Terraform fails the operation. Default is 120s. `request_reason` adds an audit annotation to every API call — visible in Cloud Audit Logs as the "requestReason" field. Use `request_reason` with `terraform-${var.environment}` for traceability in compliance environments.

```hcl
provider "google" {
  project                 = "my-gcp-project"
  region                  = "us-central1"
  request_timeout         = "60s"
  request_reason          = "terraform-deployment"
}
```

---

## Nested

### 26. Provider alias passed into module

> Modules inherit the default provider automatically. To use a non-default provider (alias), pass it explicitly via the `providers` map. The map key (`google`) corresponds to how the module refers to the provider internally. This lets you reuse the same module code with different regional providers.

```hcl
# root module
provider "google" {
  alias   = "replica"
  project = "my-gcp-project"
  region  = "asia-east1"
}

module "replica" {
  source = "./modules/replica"
  providers = {
    google = google.replica
  }
}
```

### 27. Module requiring specific provider alias

> When a module needs a non-default provider (named alias like `google.replica`), it must declare `configuration_aliases` in its `required_providers`. This tells Terraform the module expects an alias named `google.replica` to be passed by the caller. Without this declaration, Terraform will error during planning saying the alias isn't available.

```hcl
# modules/replica/main.tf
terraform {
  required_providers {
    google = {
      source                = "hashicorp/google"
      version               = "~> 5.0"
      configuration_aliases = [google.replica]
    }
  }
}

resource "google_storage_bucket" "replica" {
  provider = google.replica
  name     = "replica-data-bucket"
  location = "ASIA"
}
```

### 28. Cross-region provider setup

> Two provider instances: default in `us-central1` and DR alias in `europe-west1` across a different GCP project. This pattern is used for disaster recovery architectures where data must be replicated to a geographically separate project. The `google.dr` alias isolates all DR resources from primary resources.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

provider "google" {
  alias   = "dr"
  project = "my-dr-project"
  region  = "europe-west1"
}

resource "google_storage_bucket" "primary" {
  name     = "primary-data-bucket"
  location = "US"
}

resource "google_storage_bucket" "dr" {
  provider = google.dr
  name     = "dr-data-bucket"
  location = "EU"
}
```

### 29. Environment-driven project selection

> Looking up the project ID from a `locals` map using `var.environment` keeps all project IDs in one place and eliminates hardcoded project IDs in the provider block. When the project ID changes, update the map once. The provider `project` attribute must be known at init time — it can't reference resource outputs.

```hcl
locals {
  project_ids = {
    dev     = "my-dev-project"
    staging = "my-staging-project"
    prod    = "my-prod-project"
  }
}

provider "google" {
  project = local.project_ids[var.environment]
  region  = "us-central1"
}
```

### 30. WIF with OIDC token file

> Workload Identity Federation with OIDC works by having the GCP provider read a WIF configuration JSON file specified in `GOOGLE_APPLICATION_CREDENTIALS`. The CI system (GitHub Actions, CircleCI) injects the OIDC token, the WIF config tells the provider how to exchange it for a GCP access token, and the provider impersonates the target service account. Zero long-lived credentials.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  # GOOGLE_APPLICATION_CREDENTIALS set to WIF config
  # WIF config references OIDC token for impersonation
}
```

### 31. Nested provider configuration with workspace-driven project

> Selecting the GCP project based on `terraform.workspace` makes workspace names the authoritative source of environment configuration. Run `terraform workspace select prod` and the provider automatically targets the prod project. This reduces the risk of accidentally applying dev changes to prod — the workspace selection is explicit.

```hcl
variable "environment" {
  type = string
}

locals {
  projects = {
    dev  = "dev-project-id"
    prod = "prod-project-id"
  }
}

provider "google" {
  project = local.projects[terraform.workspace]
  region  = "us-central1"
}
```

### 32. terraform_remote_state with GCS provider in module

> Modules that need values from another stack can use `terraform_remote_state` with `backend = "gcs"`. The GCS backend uses `bucket` + `prefix` to locate the state file. The reading module needs GCS read access to the state bucket. This is the GCP equivalent of reading AWS S3 remote state.

```hcl
# modules/networking/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

data "terraform_remote_state" "vpc" {
  backend = "gcs"
  config = {
    bucket = "my-tfstate-bucket"
    prefix = "vpc"
  }
}
```

### 33. Beta provider for beta-only resources

> Some GCP resources and features are only available in the `google-beta` provider. `google_compute_region_network_endpoint_group` with `SERVERLESS` type is a beta resource — using it with the stable `google` provider would fail. Assign `provider = google-beta` to any resource that requires beta APIs. Monitor the GCP provider changelog to know when features graduate to stable.

```hcl
resource "google_compute_region_network_endpoint_group" "serverless" {
  provider              = google-beta
  name                  = "serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
}
```

### 34. Dynamic project selection via workspace

> Nearly identical to example 31 — this version emphasizes the pattern of storing numeric project IDs (the format GCP uses internally for service accounts, API quotas, etc.) and using workspace-driven selection. The key insight: the provider `project` attribute accepts both the project ID string and the project number; prefer the string ID for readability.

```hcl
locals {
  env_projects = {
    dev  = "dev-123456"
    prod = "prod-789012"
  }
}

provider "google" {
  project = local.env_projects[terraform.workspace]
  region  = "us-central1"
}
```

### 35. Forcing provider upgrade in CI

> In CI/CD pipelines, `-upgrade` gets the latest allowed provider version. `-platform` flags generate lock file entries for specific OS/arch combinations — important when developers run on Mac (darwin_arm64) but CI runs on Linux (linux_amd64). Multi-platform lock files prevent "hash mismatch" errors when switching between machines.

```bash
terraform init -upgrade                             # upgrade to latest allowed version
terraform providers lock -platform linux_amd64      # re-lock for specific platform
terraform providers lock \
  -platform linux_amd64 \
  -platform darwin_arm64 \
  -platform windows_amd64                          # multi-platform lock
```

### 36. Provider schema inspection

> `terraform providers schema -json` outputs the complete JSON schema of all providers — every resource type, every attribute, their types and descriptions. Piping through `jq` lets you explore the schema programmatically. Use this for: building automation on top of Terraform, understanding what arguments a resource supports without reading docs, or debugging provider behavior.

```bash
terraform providers schema -json | jq '.provider_schemas["registry.terraform.io/hashicorp/google"]'
```

### 37. Using data sources for current project/region

> `google_project` and `google_client_config` data sources expose runtime information about the current GCP context. `google_project.current.number` gives the numeric project number (needed for some IAM bindings and API references). `google_client_config.default.access_token` exposes the current credential token, useful when configuring the Kubernetes provider for GKE clusters.

```hcl
data "google_project" "current" {}
data "google_client_config" "default" {}

locals {
  project_number = data.google_project.current.number
  access_token   = data.google_client_config.default.access_token
  region         = data.google_client_config.default.region
}
```

---

## Advanced

### 38. Shared VPC host project provider

> GCP Shared VPC separates the VPC network into a "host project" while application workloads run in "service projects." Managing both requires two provider aliases pointing to different projects. Host project resources (subnets, firewall rules) use `provider = google.host`; service project resources use `provider = google.service`. The host project's network is shared to service projects via `google_compute_shared_vpc_service_project`.

```hcl
provider "google" {
  alias   = "host"
  project = "shared-vpc-host-project"
  region  = "us-central1"
}

provider "google" {
  alias   = "service"
  project = "service-project-id"
  region  = "us-central1"
}
```

### 39. Federated identity with external credentials

> WIF external account credentials describe how to exchange an external OIDC/SAML token for GCP credentials. The JSON configuration file specifies the WIF pool and provider, and where to find the external token (e.g., a file path injected by GitHub Actions, the GKE metadata server, or an AWS role ARN for AWS-to-GCP federated access). This eliminates all long-lived service account keys.

```hcl
# external_account.json (WIF config):
# {
#   "type": "external_account",
#   "audience": "//iam.googleapis.com/projects/PROJECT_NUM/locations/global/workloadIdentityPools/POOL/providers/PROVIDER",
#   "credential_source": { "file": "/var/run/secrets/oidc-token" }
# }
provider "google" {
  project     = "my-gcp-project"
  region      = "us-central1"
  credentials = file("external_account.json")
}
```

### 40. LocalStack/fake GCP endpoint (for testing)

> For local development and unit testing, you can override GCP API endpoints to point to emulators (like the GCP emulator suite or Firestore emulator). The provider accepts minimal credentials for local testing. This is useful for CI pipelines that don't have GCP access but need to test Terraform plan logic.

```hcl
provider "google" {
  project                     = "test-project"
  region                      = "us-central1"
  credentials                 = "{\"type\":\"service_account\"}"
  # Override endpoints for local emulation
}
```

### 41. Retry configuration

> GCP APIs occasionally return transient errors (429 rate limits, 503 unavailable). Setting `request_timeout` to 120s gives long-running operations (like GKE cluster creation) enough time to complete before timing out. The GCP provider has built-in retry logic for transient errors — `request_timeout` controls how long each individual API call can take.

```hcl
provider "google" {
  project         = "my-gcp-project"
  region          = "us-central1"
  request_timeout = "120s"
}
```

### 42. Provider with batching configuration

> GCP API batching coalesces multiple API calls into a single batch request, reducing quota consumption and improving performance when creating many resources simultaneously. `send_after = "10s"` waits 10 seconds before sending a batch. Useful when creating large numbers of IAM bindings, GCS bucket ACLs, or DNS records in a single `terraform apply`.

```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  batching {
    send_after      = "10s"
    enable_batching = true
  }
}
```

### 43. Terraform Cloud dynamic credentials for GCP (OIDC)

> Terraform Cloud/Enterprise supports dynamic credentials via OIDC — it exchanges a short-lived JWT for a GCP access token using WIF, with no stored credentials. Set three workspace variables: `TFC_GCP_PROVIDER_AUTH`, `TFC_GCP_SERVICE_ACCOUNT_EMAIL`, and `TFC_GCP_WORKLOAD_PROVIDER_NAME`. The provider block itself needs no credential configuration — it's all handled by TFC.

```hcl
# In Terraform Cloud workspace:
# TFC_GCP_PROVIDER_AUTH = true
# TFC_GCP_SERVICE_ACCOUNT_EMAIL = tf@project.iam.gserviceaccount.com
# TFC_GCP_WORKLOAD_PROVIDER_NAME = projects/NUM/locations/global/workloadIdentityPools/POOL/providers/PROVIDER
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

### 44. Provider-level logging for debugging

> `TF_LOG=DEBUG` enables verbose logging including all GCP API requests and responses. `TF_LOG_PATH` saves logs to a file instead of stdout. `GOOGLE_BACKEND_IMPERSONATE_SERVICE_ACCOUNT` enables impersonation for the GCS backend (separate from the resource provider's impersonation). Use debug logging to diagnose authentication failures, unexpected API behavior, or resource creation issues.

```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
export GOOGLE_BACKEND_IMPERSONATE_SERVICE_ACCOUNT=debug@project.iam.gserviceaccount.com
terraform plan
```

### 45. Impersonation chain (service account → service account)

> `impersonate_service_account` creates an impersonation chain: your current identity (ADC or SA) impersonates the deployer SA, which has the actual GCP permissions. This follows the principle of least privilege — your personal account has only `iam.serviceAccountTokenCreator` on the Terraform SA, not direct GCP resource permissions. All resource operations are audited under the Terraform SA's identity.

```hcl
provider "google" {
  project                     = "my-gcp-project"
  region                      = "us-central1"
  impersonate_service_account = "deployer@my-gcp-project.iam.gserviceaccount.com"
}
```

### 46. Multi-project provider for Organization-level management

> Organization-level GCP resources (folders, org policies, billing accounts) require the org admin project provider. An org-admin impersonation SA with organization-level IAM roles manages these resources. This separates org-level governance from individual project management — the org-admin role is highly privileged and should be tightly controlled.

```hcl
provider "google" {
  alias   = "org"
  project = "org-admin-project"
  region  = "us-central1"
  impersonate_service_account = "org-tf@org-admin-project.iam.gserviceaccount.com"
}

resource "google_folder" "dept" {
  provider     = google.org
  display_name = "Engineering"
  parent       = "organizations/123456789"
}
```

### 47. Validating provider configuration with check block

> `check` blocks (Terraform 1.5+) run assertions after plan/apply without blocking execution. This example verifies the deployment region is in an approved list — useful for compliance policies that restrict deployments to specific regions (e.g., EU data residency requirements). Failed checks produce warnings, not errors, by default.

```hcl
check "valid_region" {
  assert {
    condition     = contains(["us-central1", "europe-west1", "asia-east1"], data.google_client_config.default.region)
    error_message = "Deployment restricted to approved regions."
  }
}

data "google_client_config" "default" {}
```

### 48. Provider version pinning to avoid breaking changes

> Exact pinning (`= 5.10.0`) is a temporary measure when a newer provider version has a breaking change you haven't migrated to yet. Pin to the last known good version, document why in a comment, and track the issue upstream. Plan to unpin within one sprint — staying on an old provider version means missing security fixes.

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "= 5.10.0"  # exact pin while investigating breaking change
    }
  }
}
```

### 49. Provider configuration inheritance in child modules

> Modules inherit the default provider automatically — `module "us_central"` doesn't need a `providers` argument and will use the root's default `google` provider. To override with a different region/project, pass an aliased provider via the `providers` map. This pattern is common for multi-region deployments where the same app module is deployed to multiple regions.

```hcl
module "us_central" {
  source = "./app"
  # Inherits default google provider (us-central1)
}

module "europe" {
  source = "./app"
  providers = {
    google = google.europe   # Override with europe alias
  }
}
```

### 50. Full production provider block with all best practices

> The production-grade GCP provider configuration: both `google` and `google-beta` at matching versions, service account impersonation for least-privilege access, `user_project_override` + `billing_project` for correct quota attribution, `request_timeout` for long operations, `request_reason` for audit trail, and API batching for performance at scale. This is the template you should start from for any production GCP deployment.

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.14"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.14"
    }
  }
}

provider "google" {
  project                     = var.project_id
  region                      = var.region
  impersonate_service_account = "terraform@${var.project_id}.iam.gserviceaccount.com"
  request_timeout             = "60s"
  request_reason              = "terraform-${var.environment}"
  user_project_override       = true
  billing_project             = var.project_id

  batching {
    send_after      = "10s"
    enable_batching = true
  }
}

provider "google-beta" {
  project                     = var.project_id
  region                      = var.region
  impersonate_service_account = "terraform@${var.project_id}.iam.gserviceaccount.com"
}
```

---

## Key Takeaways

- **GCP auth hierarchy**: WIF (best for CI/CD) > service account impersonation > ADC (local dev) > key file (avoid) > access token (short-lived only)
- **`impersonate_service_account`** is GCP's `assume_role` — your identity impersonates a dedicated Terraform SA; audit logs show the SA's actions
- **`google` vs `google-beta`**: declare both providers when you need beta features; resources using beta APIs must set `provider = google-beta`
- **`user_project_override = true`** + `billing_project` is required in multi-project setups to correctly attribute API quota
- **WIF eliminates key files** — exchange OIDC tokens (GitHub Actions, GKE workloads, Terraform Cloud) for short-lived GCP credentials
- **Provider aliases** handle multi-region and multi-project deployments; modules receive aliases via the `providers` map and must declare `configuration_aliases`
- **`request_reason`** adds audit annotations to every GCP API call — use `terraform-${environment}` for compliance traceability
- **Batching** (`batching { enable_batching = true }`) improves performance and reduces quota usage when creating many resources in parallel
- **Lock file** (`.terraform.lock.hcl`) must be committed and should include hashes for all target platforms
- **`data.google_client_config.default.access_token`** is the standard way to get the current GCP token for configuring the Kubernetes provider after GKE cluster creation

---

## Common Interview Questions & Answers

**Q: What is the difference between the `google` and `google-beta` providers? When do you use `google-beta`?**
A: The `google` provider exposes only generally-available (GA) GCP APIs. The `google-beta` provider exposes GA features plus beta and preview APIs. Use `google-beta` when you need a resource or attribute that hasn't graduated to GA — for example, certain GKE features, Cloud Run v2 advanced settings, or new Compute Engine features. Set `provider = google-beta` on the specific resource, not on all resources. Always declare both providers at matching version constraints. Monitor the GCP provider changelog to replace `google-beta` with `google` once features graduate to GA.

**Q: How does authentication work for Terraform in a GCP CI/CD pipeline? What's the most secure method?**
A: The most secure method is Workload Identity Federation (WIF). The CI system (GitHub Actions, CircleCI, etc.) has an OIDC identity. You configure a WIF pool and provider in GCP to trust that CI system's OIDC tokens. The Terraform GCP provider exchanges the CI OIDC token for a short-lived GCP access token, then impersonates the Terraform service account. No long-lived service account keys exist anywhere — they can't be leaked. The alternative (and still acceptable) method is `impersonate_service_account` with a service account key for the impersonating identity, but this still has a key to manage.

**Q: What is `impersonate_service_account` and why should you use it?**
A: `impersonate_service_account` makes all Terraform provider API calls under the identity of the specified service account, not your personal credentials or the CI runner's credentials. Benefits: (1) Least privilege — the SA has only the GCP permissions needed for Terraform, your personal account has only `iam.serviceAccountTokenCreator` on the SA. (2) Audit trail — Cloud Audit Logs show the SA's actions, not the human's, making automated vs. manual changes distinguishable. (3) Consistent permissions across all users — everyone impersonates the same SA, so "works on my machine" auth issues disappear.

**Q: How do you manage multiple GCP projects in a single Terraform configuration?**
A: Use provider aliases — one per project. Declare each project's provider with a unique `alias`, then assign resources to providers with `provider = google.<alias>`. For modules that manage resources in a specific project, pass the alias via the `providers` map. A common pattern in GCP organizations: `google.host` for the Shared VPC host project, `google.service` for workload projects, and `google.org` for organization-level resources. Alternatively, for fully independent project management, use separate Terraform stacks with separate state files.

**Q: What is `user_project_override` and when is it needed?**
A: `user_project_override = true` (combined with `billing_project`) tells the GCP provider to use the specified project for quota and billing attribution on API calls. This is needed in multi-project configurations where the Terraform service account lives in a different project than the resources being managed. Without it, API quota is charged to the SA's home project, which may exhaust that project's API quota instead of the managed project's quota. It's also required for some GCP APIs that need a billing project specified in the request.
