# Examples 1.1 — Providers & Configuration (50 examples)

> **Topic Overview:** The `provider` block tells Terraform which cloud platform to manage and how to authenticate with it. The `terraform {}` block pins versions and configures the backend. Mastering providers is critical because every resource, data source, and module depends on a properly configured provider. Authentication order, alias patterns, and version constraints are the most common interview topics.

---

## Basic

### 1. Minimal AWS provider block
> The simplest valid provider configuration. Terraform reads credentials from environment variables or the default AWS credential chain (EC2 instance role, `~/.aws/credentials`).
```hcl
provider "aws" {
  region = "us-east-1"
}
```

### 2. required_providers block
> Always declare providers in `required_providers` inside `terraform {}`. This ensures Terraform downloads the right plugin and locks versions. Without this, `terraform init` picks the latest version which can introduce breaking changes.
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
> Exact pinning (`= 5.31.0`) ensures byte-for-byte reproducible runs. Use this in production when you need stability; use pessimistic (`~>`) in development to get patches automatically.
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
> Prevents team members or CI from running an older Terraform binary that might not support features you're using (e.g., `optional()`, `check` blocks, `import` blocks).
```hcl
terraform {
  required_version = ">= 1.6.0"
}
```

### 5. Authentication via environment variables
> The recommended way to pass credentials in CI/CD — no secrets in code. AWS reads `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION` automatically.
```bash
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtn/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="us-east-1"
terraform plan
```

### 6. Authentication via AWS profile
> Uses named profiles from `~/.aws/config` and `~/.aws/credentials`. Ideal for local development where developers have multiple accounts configured via `aws configure`.
```hcl
provider "aws" {
  region  = "us-east-1"
  profile = "my-dev-profile"
}
```

### 7. terraform init
> **Always run `terraform init` before anything else.** It downloads providers, sets up the backend, and installs modules. `-upgrade` forces re-download of newer allowed versions; `-reconfigure` resets backend without migrating state.
```bash
terraform init                    # initialize working directory
terraform init -upgrade           # upgrade provider versions
terraform init -reconfigure       # reconfigure backend
```

### 8. Version constraint operators
> `~>` is the "pessimistic constraint" — it allows patch and minor updates within the major version. Use it to get bug fixes while guarding against breaking major-version changes.
```hcl
version = "~> 5.0"    # >= 5.0, < 6.0  (pessimistic constraint)
version = ">= 5.0"    # 5.0 or later
version = "= 5.31.0"  # exactly 5.31.0
version = ">= 5.0, < 6.0"  # range
```

### 9. Provider with access key (not recommended for production)
> Hardcoding credentials in the provider block is acceptable only for local testing with non-sensitive test accounts. In production, always use IAM roles or environment variables.
```hcl
provider "aws" {
  region     = "us-east-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}
```

### 10. AWS_PROFILE env var
> An alternative to hardcoding `profile` in the provider block — keeps the config clean and lets the same code work with different profiles in different contexts.
```bash
export AWS_PROFILE=production
terraform apply
```

### 11. Listing installed providers
> `terraform providers` shows the provider dependency tree including modules. `terraform version` shows the exact provider versions locked in `.terraform.lock.hcl`.
```bash
terraform providers        # show providers used by configuration
terraform version          # show Terraform and provider versions
```

### 12. Lock file for reproducibility
> `.terraform.lock.hcl` records the exact provider version and checksums. **Always commit it to version control.** Without it, different team members may use different provider versions.
```bash
# .terraform.lock.hcl is auto-generated — commit it to version control
terraform init             # creates/updates .terraform.lock.hcl
terraform providers lock   # explicitly update lock file
```

---

## Intermediate

### 13. Provider alias for multiple regions
> Provider aliases let you manage resources in multiple regions from one configuration. Each resource references its provider via `provider = aws.<alias>`. Without an alias, all resources use the default provider.
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
> Used for cross-account deployments. The Terraform process assumes the target account's IAM role via STS. `external_id` adds a security layer preventing confused-deputy attacks.
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
> `default_tags` is the most efficient way to enforce tagging policies — every resource managed by this provider automatically inherits these tags without repeating them in each resource block.
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
> Some tags are managed by AWS services (Auto Scaling, Kubernetes) and will cause perpetual diffs if Terraform tries to manage them. Use `ignore_tags` to suppress those diffs.
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
> The standard pattern for multi-account deployments. Each alias uses `assume_role` to target a different account. This allows a single `terraform apply` to provision resources across accounts.
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
> A real-world config often uses `aws` plus utility providers like `random` (suffix generation) and `null` (triggers/provisioners). All must be declared here.
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
> Used with LocalStack or when running Terraform against mock AWS endpoints. The `skip_*` flags prevent the provider from calling real AWS validation APIs during init.
```hcl
provider "aws" {
  region                      = "us-east-1"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
}
```

### 20. Using AWS SSO/IAM Identity Center profile
> Modern organizations use SSO instead of long-lived access keys. `aws sso login` refreshes short-lived credentials; the provider reads them via the profile.
```bash
aws sso login --profile my-sso-profile
# Then in provider:
provider "aws" {
  region  = "us-east-1"
  profile = "my-sso-profile"
}
```

### 21. Provider version with multiple constraints
> Range constraints (`>= 5.0, < 6.0`) are equivalent to `~> 5.0` but more explicit. Useful when you want to exclude a specific buggy minor version.
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
> `duration` limits the STS session lifetime (max 12h). `tags` on `assume_role` appear in CloudTrail logs, enabling fine-grained audit trails per Terraform run.
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
> Required when Terraform runs behind a corporate proxy or talks to AWS PrivateLink endpoints using a private CA certificate. Without this, TLS validation fails.
```hcl
provider "aws" {
  region   = "us-east-1"
  ca_bundle = "/etc/ssl/certs/custom-ca.pem"
}
```

### 24. Proxy configuration via environment
> Terraform inherits standard HTTPS proxy settings from the shell environment. `NO_PROXY` must exclude the EC2 IMDS address (`169.254.169.254`) to prevent proxy-routing metadata calls.
```bash
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=169.254.169.254
terraform apply
```

### 25. AWS_SDK_LOAD_CONFIG for shared config file
> Forces the AWS SDK to read the `~/.aws/config` file (not just `~/.aws/credentials`). Required when using profiles that reference SSO, role chaining, or MFA serial numbers.
```bash
export AWS_SDK_LOAD_CONFIG=1
export AWS_CONFIG_FILE=~/.aws/config
```

---

## Nested

### 26. Provider alias passed into module
> When a module needs to manage resources in a non-default region, pass the alias via the `providers` map. The module receives it as its `aws` provider, hiding the complexity from the module's internal code.
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
> Modules that need a specific alias must declare `configuration_aliases` in their `required_providers`. This creates a contract: the calling module MUST pass this alias.
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
> Two provider instances pointing to different regions. Resources reference their target region via the `provider` meta-argument. Commonly used for S3 cross-region replication and RDS read replicas.
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
> Terraform does not support dynamic provider creation with `for_each`. You must declare one static provider block per account. This is a known limitation — workarounds use separate Terraform roots per account.
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
> The keyless auth pattern for CI/CD. The pipeline's OIDC token is exchanged for temporary AWS credentials via STS. No long-lived secrets stored anywhere — the gold standard for CI/CD security.
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
> Combines variables and locals to select the correct IAM role ARN based on the target environment. This pattern eliminates the need for multiple provider blocks while handling multi-environment deployments.
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
> Modules that consume remote state (to look up resources created in other stacks) must still declare their own provider. The remote state data source is provider-independent.
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
> Route53 global resources always live in `us-east-1` regardless of where your main infra is. Use `provider = aws.us_east_1` on the DNS record to target the correct region while keeping your default provider elsewhere.
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
> Uses `terraform.workspace` to look up the correct role ARN from a locals map. This gives environment-driven auth without multiple provider blocks, though it requires workspace discipline.
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
> `-upgrade` updates all providers to the latest allowed version, then re-locks them. Use `-platform` flags to pre-compute checksums for all target platforms (Linux CI + Mac dev machines).
```bash
terraform init -upgrade                          # upgrade to latest allowed version
terraform providers lock -platform linux_amd64   # re-lock for specific platform
terraform providers lock \
  -platform linux_amd64 \
  -platform darwin_arm64 \
  -platform windows_amd64                       # multi-platform lock
```

### 36. Provider schema inspection
> Dumps the full JSON schema of all provider resources and data sources. Useful for exploring undocumented attributes or writing custom tooling that parses provider capabilities.
```bash
terraform providers schema -json | jq '.provider_schemas["registry.terraform.io/hashicorp/aws"]'
```

### 37. Using aws_partition data source for ARN portability
> ARN format differs across AWS partitions (commercial `aws`, GovCloud `aws-us-gov`, China `aws-cn`). Using `data.aws_partition.current.partition` makes your ARN strings portable across all environments.
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
> AWS GovCloud is a separate partition with its own endpoints. The provider automatically routes to the correct endpoints when a `us-gov-*` region is specified — no other changes needed.
```hcl
provider "aws" {
  region = "us-gov-east-1"
  # Partition changes to aws-us-gov automatically
}
```

### 39. China region provider
> China regions (`cn-north-1`, `cn-northwest-1`) require separate AWS accounts and credentials. The partition is `aws-cn` and many services are unavailable or have different ARN formats.
```hcl
provider "aws" {
  alias  = "china"
  region = "cn-north-1"
  # Requires separate credentials for China partition
}
```

### 40. Provider with HTTP proxy and custom endpoints (LocalStack)
> LocalStack emulates AWS APIs locally for testing. Point each service endpoint to `localhost:4566`, disable credential validation, and use dummy credentials. This enables real Terraform runs without touching real AWS.
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
> When Terraform runs on an EC2 instance, it uses the instance metadata service (IMDS) for credentials. These env vars force IMDSv2 (token-based) requests, which is required when IMDSv2 is enforced on the instance.
```bash
# Force provider to use IMDSv2 (token-based) metadata
export AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE=IPv4
export AWS_EC2_METADATA_DISABLED=false
```

### 42. Retry configuration for provider
> AWS APIs are eventually consistent and occasionally return throttling errors. `retry_mode = "adaptive"` uses exponential backoff with jitter. `max_retries = 10` is appropriate for large infra changes with many API calls.
```hcl
provider "aws" {
  region = "us-east-1"
  retry_mode  = "adaptive"  # "legacy" | "standard" | "adaptive"
  max_retries = 10
}
```

### 43. Provider with assume_role and MFA (non-automated)
> MFA-protected role assumption cannot be automated (requires human input). The solution is to configure MFA in the AWS CLI profile (`~/.aws/config`) and reference the profile in the provider. The CLI handles the MFA prompt.
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
> Terraform Cloud's native OIDC integration — set two workspace env vars and Terraform Cloud automatically exchanges its OIDC token for temporary AWS credentials. No stored AWS secrets anywhere in TFC.
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
> `TF_LOG=DEBUG` enables verbose output from both Terraform core and the AWS provider. `AWS_SDK_GO_V2_LOGLEVEL=Debug` adds the raw HTTP request/response logs — extremely useful for debugging API-level issues.
```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
export AWS_SDK_GO_V2_LOGLEVEL=Debug
terraform plan 2>&1 | grep -i "request\|response"
```

### 46. S3-compatible provider (non-AWS, e.g., MinIO)
> The AWS provider works with any S3-compatible storage system. Override the S3 endpoint and use `force_path_style` (deprecated in new versions — use `s3.use_path_style` instead) for path-based bucket addressing.
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
> `check` blocks (Terraform 1.5+) run assertions after `apply` without failing the run — they emit warnings. Use them to enforce deployment region policies without blocking apply.
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
> When a new provider version introduces breaking changes, pin to the last known good version while investigating. `terraform init -upgrade=false` prevents upgrading past the pinned version.
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
> Child modules inherit the calling module's default provider automatically. Only override when a different region/account is needed, via the `providers` map. This keeps child modules provider-agnostic.
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
> The gold standard provider configuration: version-pinned, adaptive retry, cross-account role assumption with external_id, default tags for every resource, and noise-suppression for auto-managed tag keys.
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

---

## Key Takeaways

- **Always** declare `required_providers` with version constraints — never rely on implicit latest.
- **Commit** `.terraform.lock.hcl` to prevent version drift across team members.
- **Never** hardcode credentials; use IAM roles, OIDC, or environment variables.
- **Provider aliases** are the mechanism for multi-region and multi-account deployments.
- `default_tags` on the provider is the cleanest way to enforce tagging compliance.
- `assume_role` + `external_id` is the standard cross-account auth pattern.
- `assume_role_with_web_identity` (OIDC) is the modern keyless auth for CI/CD.

## Common Interview Questions & Answers

**Q: How do you manage Terraform across multiple AWS accounts?**  
A: Use separate `provider "aws"` blocks with `alias` and `assume_role`, each targeting a different account's IAM role via STS. Pass aliases to modules using the `providers` map.

**Q: What is `.terraform.lock.hcl` and should you commit it?**  
A: It records the exact provider version hashes downloaded. You must commit it — it ensures reproducibility and prevents supply-chain attacks from a compromised new provider version.

**Q: How do you authenticate Terraform in GitHub Actions without storing AWS secrets?**  
A: Configure OIDC trust between GitHub Actions and AWS IAM. Use `assume_role_with_web_identity` in the provider, or set `TFC_AWS_PROVIDER_AUTH=true` in Terraform Cloud. No long-lived secrets needed.

**Q: What does `~> 5.0` mean in a version constraint?**  
A: It means `>= 5.0, < 6.0` — the pessimistic constraint operator. It allows minor and patch updates within major version 5, but blocks major version 6 which may have breaking changes.

**Q: How do you apply `default_tags` to every resource without repeating them?**  
A: Use the `default_tags` block inside the `provider "aws"` block. All resources managed by that provider instance automatically receive those tags. Use `ignore_tags` to suppress diffs from AWS-managed tags.
