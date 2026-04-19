# Examples 1.1 — Providers & Configuration (50 examples)

---

## Basic

### 1. Minimal AWS provider block
```hcl
provider "aws" {
  region = "us-east-1"
}
```

### 2. required_providers block
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

### 3. Pinning exact provider version
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.31.0"
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

### 5. Authentication via environment variables
```bash
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtn/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="us-east-1"
terraform plan
```

### 6. Authentication via AWS profile
```hcl
provider "aws" {
  region  = "us-east-1"
  profile = "my-dev-profile"
}
```

### 7. terraform init
```bash
terraform init                    # initialize working directory
terraform init -upgrade           # upgrade provider versions
terraform init -reconfigure       # reconfigure backend
```

### 8. Version constraint operators
```hcl
version = "~> 5.0"    # >= 5.0, < 6.0  (pessimistic constraint)
version = ">= 5.0"    # 5.0 or later
version = "= 5.31.0"  # exactly 5.31.0
version = ">= 5.0, < 6.0"  # range
```

### 9. Provider with access key (not recommended for production)
```hcl
provider "aws" {
  region     = "us-east-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}
```

### 10. GOOGLE_PROJECT equivalent: AWS_PROFILE env var
```bash
export AWS_PROFILE=production
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
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

resource "aws_s3_bucket" "west_bucket" {
  provider = aws.west
  bucket   = "my-west-bucket"
}
```

### 14. Assume role in provider
```hcl
provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn     = "arn:aws:iam::123456789012:role/TerraformRole"
    session_name = "TerraformSession"
    external_id  = "unique-external-id"
  }
}
```

### 15. Default tags applied to all resources
```hcl
provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      Environment = "production"
      Team        = "platform"
      ManagedBy   = "terraform"
      CostCenter  = "engineering"
    }
  }
}
```

### 16. Provider with ignore_tags
```hcl
provider "aws" {
  region = "us-east-1"
  ignore_tags {
    keys         = ["AutoScalingGroupName"]
    key_prefixes = ["aws:"]
  }
}
```

### 17. Multiple AWS accounts with aliases
```hcl
provider "aws" {
  alias  = "dev"
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::111111111111:role/TerraformRole"
  }
}

provider "aws" {
  alias  = "prod"
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::222222222222:role/TerraformRole"
  }
}
```

### 18. required_providers with multiple providers
```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
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

### 19. Provider with skip options (useful for testing)
```hcl
provider "aws" {
  region                      = "us-east-1"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
}
```

### 20. Using AWS SSO/IAM Identity Center profile
```bash
aws sso login --profile my-sso-profile
# Then in provider:
provider "aws" {
  region  = "us-east-1"
  profile = "my-sso-profile"
}
```

### 21. Provider version with multiple constraints
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 6.0"
    }
  }
}
```

### 22. Assume role with duration and tags
```hcl
provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn         = "arn:aws:iam::123456789012:role/TerraformRole"
    session_name     = "TerraformSession"
    duration         = "1h"
    tags = {
      Purpose = "terraform-deployment"
    }
  }
}
```

### 23. Custom CA bundle (on-prem or private CA)
```hcl
provider "aws" {
  region   = "us-east-1"
  ca_bundle = "/etc/ssl/certs/custom-ca.pem"
}
```

### 24. Proxy configuration via environment
```bash
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=169.254.169.254
terraform apply
```

### 25. AWS_SDK_LOAD_CONFIG for shared config file
```bash
export AWS_SDK_LOAD_CONFIG=1
export AWS_CONFIG_FILE=~/.aws/config
```

---

## Nested

### 26. Provider alias passed into module
```hcl
# root module
provider "aws" {
  alias  = "replica"
  region = "eu-west-1"
}

module "replica" {
  source = "./modules/replica"
  providers = {
    aws = aws.replica
  }
}
```

### 27. Module requiring specific provider alias
```hcl
# modules/replica/main.tf
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.replica]
    }
  }
}

resource "aws_s3_bucket" "replica" {
  provider = aws.replica
  bucket   = "my-replica-bucket"
}
```

### 28. Cross-region replication provider setup
```hcl
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "dr"
  region = "us-west-2"
  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/DRRole"
  }
}

resource "aws_s3_bucket" "primary" {
  bucket = "primary-data-bucket"
}

resource "aws_s3_bucket" "dr" {
  provider = aws.dr
  bucket   = "dr-data-bucket"
}
```

### 29. Multiple accounts with for_each and provider aliases
```hcl
# Define providers for multiple accounts
locals {
  accounts = {
    dev  = { role = "arn:aws:iam::111111111111:role/TF" }
    prod = { role = "arn:aws:iam::222222222222:role/TF" }
  }
}
# Note: provider for_each is not native — use separate provider blocks per account
```

### 30. Provider with assume_role_with_web_identity (OIDC)
```hcl
provider "aws" {
  region = "us-east-1"
  assume_role_with_web_identity {
    role_arn                = "arn:aws:iam::123456789012:role/GitHubActionsRole"
    web_identity_token_file = "/var/run/secrets/token"
    session_name            = "github-actions"
  }
}
```

### 31. Nested provider configuration with environment-driven auth
```hcl
variable "environment" {
  type = string
}

locals {
  role_arn = {
    dev     = "arn:aws:iam::111111111111:role/TF"
    staging = "arn:aws:iam::222222222222:role/TF"
    prod    = "arn:aws:iam::333333333333:role/TF"
  }
}

provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn = local.role_arn[var.environment]
  }
}
```

### 32. terraform_remote_state with provider in module
```hcl
# modules/networking/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "my-tfstate-bucket"
    key    = "vpc/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 33. Provider meta-argument in resource
```hcl
resource "aws_route53_record" "cert_validation" {
  # Route53 is always in us-east-1, but resources may be elsewhere
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = "_acme-challenge.example.com"
  type     = "CNAME"
  ttl      = 60
  records  = ["acme.example.com"]
}
```

### 34. Dynamic provider selection (workaround pattern)
```hcl
# Use workspace to drive environment-specific assume_role
locals {
  env_roles = {
    dev  = "arn:aws:iam::111111111111:role/TF"
    prod = "arn:aws:iam::222222222222:role/TF"
  }
}

provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn = local.env_roles[terraform.workspace]
  }
}
```

### 35. Forcing provider upgrade in CI
```bash
terraform init -upgrade                          # upgrade to latest allowed version
terraform providers lock -platform linux_amd64   # re-lock for specific platform
terraform providers lock \
  -platform linux_amd64 \
  -platform darwin_arm64 \
  -platform windows_amd64                       # multi-platform lock
```

### 36. Provider schema inspection
```bash
terraform providers schema -json | jq '.provider_schemas["registry.terraform.io/hashicorp/aws"]'
```

### 37. Using aws_partition data source for ARN portability
```hcl
data "aws_partition" "current" {}
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  partition  = data.aws_partition.current.partition  # "aws" or "aws-cn" or "aws-us-gov"
}
```

---

## Advanced

### 38. GovCloud provider configuration
```hcl
provider "aws" {
  region = "us-gov-east-1"
  # Partition changes to aws-us-gov automatically
}
```

### 39. China region provider
```hcl
provider "aws" {
  alias  = "china"
  region = "cn-north-1"
  # Requires separate credentials for China partition
}
```

### 40. Provider with HTTP proxy and custom endpoints (LocalStack)
```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3       = "http://localhost:4566"
    ec2      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    iam      = "http://localhost:4566"
  }
}
```

### 41. IMDSv2 enforcement for provider on EC2
```bash
# Force provider to use IMDSv2 (token-based) metadata
export AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE=IPv4
export AWS_EC2_METADATA_DISABLED=false
```

### 42. Retry configuration for provider
```hcl
provider "aws" {
  region = "us-east-1"
  retry_mode  = "adaptive"  # "legacy" | "standard" | "adaptive"
  max_retries = 10
}
```

### 43. Provider with assume_role and MFA (non-automated)
```hcl
# Typically handled via aws CLI profile with mfa_serial
# ~/.aws/config:
# [profile mfa-role]
# source_profile = default
# role_arn = arn:aws:iam::123456789012:role/MFARole
# mfa_serial = arn:aws:iam::111111111111:mfa/myuser
provider "aws" {
  region  = "us-east-1"
  profile = "mfa-role"
}
```

### 44. Terraform Cloud dynamic credentials for AWS (OIDC)
```hcl
# In Terraform Cloud workspace environment variables:
# TFC_AWS_PROVIDER_AUTH = true
# TFC_AWS_RUN_ROLE_ARN  = arn:aws:iam::123456789012:role/TerraformCloudRole
# No credentials needed in provider block:
provider "aws" {
  region = "us-east-1"
}
```

### 45. Provider-level logging for debugging
```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
export AWS_SDK_GO_V2_LOGLEVEL=Debug
terraform plan 2>&1 | grep -i "request\|response"
```

### 46. S3-compatible provider (non-AWS, e.g., MinIO)
```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "minioadmin"
  secret_key                  = "minioadmin"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  force_path_style            = true  # deprecated: use s3.use_path_style

  endpoints {
    s3 = "http://minio.example.com:9000"
  }
}
```

### 47. Validating provider configuration with check block
```hcl
check "valid_region" {
  assert {
    condition     = contains(["us-east-1", "us-west-2", "eu-west-1"], data.aws_region.current.name)
    error_message = "Deployment restricted to approved regions."
  }
}

data "aws_region" "current" {}
```

### 48. Provider version downgrade (pinning to avoid breaking changes)
```hcl
# If a new provider version introduces breaking changes, pin to last known good:
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 5.20.0"  # exact pin while investigating
    }
  }
}
# Run: terraform init -upgrade=false  (don't upgrade past pinned version)
```

### 49. Provider configuration inheritance in child modules
```hcl
# Providers are inherited by child modules automatically.
# Only override when a different config is needed:

module "us_east" {
  source = "./app"
  # Inherits default aws provider (us-east-1)
}

module "us_west" {
  source = "./app"
  providers = {
    aws = aws.west   # Override with west alias
  }
}
```

### 50. Full production provider block with all best practices
```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"
    }
  }
}

provider "aws" {
  region      = var.aws_region
  retry_mode  = "adaptive"
  max_retries = 5

  assume_role {
    role_arn     = "arn:aws:iam::${var.account_id}:role/TerraformDeployRole"
    session_name = "terraform-${var.environment}"
    external_id  = var.external_id
  }

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/myorg/infra"
    }
  }

  ignore_tags {
    key_prefixes = ["aws:", "kubernetes.io/"]
  }
}
```
