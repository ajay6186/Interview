# Examples 1.1 — Providers & Configuration (GCP) (50 examples)

---

## Basic

### 1. Minimal GCP provider block
```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

### 2. required_providers block for GCP
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
```hcl
terraform {
  required_version = ">= 1.6.0"
}
```

### 5. Authentication via environment variable
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export GOOGLE_PROJECT="my-gcp-project"
export GOOGLE_REGION="us-central1"
terraform plan
```

### 6. Authentication via gcloud ADC
```bash
gcloud auth application-default login
# Provider automatically picks up ADC credentials
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}
```

### 7. terraform init for GCP
```bash
terraform init                    # initialize working directory
terraform init -upgrade           # upgrade provider versions
terraform init -reconfigure       # reconfigure backend
```

### 8. Version constraint operators
```hcl
version = "~> 5.0"      # >= 5.0, < 6.0
version = ">= 5.0"      # 5.0 or later
version = "= 5.14.0"    # exactly 5.14.0
version = ">= 5.0, < 6.0"  # range
```

### 9. Provider with credentials file path
```hcl
provider "google" {
  project     = "my-gcp-project"
  region      = "us-central1"
  credentials = file("service-account.json")
}
```

### 10. GOOGLE_PROJECT environment variable
```bash
export GOOGLE_PROJECT=my-gcp-project
export GOOGLE_REGION=us-central1
terraform apply
```

### 11. Listing installed providers
```bash
terraform providers        # show providers used by configuration
terraform version          # show Terraform and provider versions
```

### 12. Lock file for reproducibility
```bash
# .terraform.lock.hcl is auto-generated — commit it to version control
terraform init             # creates/updates .terraform.lock.hcl
terraform providers lock   # explicitly update lock file
```

---

## Intermediate

### 13. Provider alias for multiple regions
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
```hcl
provider "google" {
  project                     = "my-gcp-project"
  region                      = "us-central1"
  impersonate_service_account = "terraform@my-gcp-project.iam.gserviceaccount.com"
}
```

### 15. google-beta provider alongside stable
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
```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  zone    = "us-central1-a"
}
```

### 20. Using Workload Identity Federation (OIDC)
```hcl
# For GitHub Actions using WIF — no service account key needed
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  # GOOGLE_APPLICATION_CREDENTIALS points to WIF config file set by GitHub Actions
}
```

### 21. Provider version with multiple constraints
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
```hcl
provider "google" {
  project      = "my-gcp-project"
  region       = "us-central1"
  access_token = var.google_access_token
}
```

### 23. Scopes for ADC credentials
```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/cloud-platform
```

### 24. User project override for quota
```hcl
provider "google" {
  project               = "my-gcp-project"
  region                = "us-central1"
  user_project_override = true
  billing_project       = "my-billing-project"
}
```

### 25. Provider with request timeout
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
```hcl
provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
  # GOOGLE_APPLICATION_CREDENTIALS set to WIF config
  # WIF config references OIDC token for impersonation
}
```

### 31. Nested provider configuration with workspace-driven project
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
```hcl
resource "google_compute_region_network_endpoint_group" "serverless" {
  provider              = google-beta
  name                  = "serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
}
```

### 34. Dynamic project selection via workspace
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
```bash
terraform init -upgrade                             # upgrade to latest allowed version
terraform providers lock -platform linux_amd64      # re-lock for specific platform
terraform providers lock \
  -platform linux_amd64 \
  -platform darwin_arm64 \
  -platform windows_amd64                          # multi-platform lock
```

### 36. Provider schema inspection
```bash
terraform providers schema -json | jq '.provider_schemas["registry.terraform.io/hashicorp/google"]'
```

### 37. Using data sources for current project/region
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
```hcl
provider "google" {
  project                     = "test-project"
  region                      = "us-central1"
  credentials                 = "{\"type\":\"service_account\"}"
  # Override endpoints for local emulation
}
```

### 41. Retry configuration
```hcl
provider "google" {
  project         = "my-gcp-project"
  region          = "us-central1"
  request_timeout = "120s"
}
```

### 42. Provider with batching configuration
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
```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
export GOOGLE_BACKEND_IMPERSONATE_SERVICE_ACCOUNT=debug@project.iam.gserviceaccount.com
terraform plan
```

### 45. Impersonation chain (service account → service account)
```hcl
provider "google" {
  project                     = "my-gcp-project"
  region                      = "us-central1"
  impersonate_service_account = "deployer@my-gcp-project.iam.gserviceaccount.com"
}
```

### 46. Multi-project provider for Organization-level management
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
