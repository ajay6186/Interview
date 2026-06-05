# Phase 4 - Exercise 02: Custom Modules (Advanced)
# Learn: module composition, module outputs as inputs, module versioning,
#        optional variables, module for_each

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region     = "ap-south-1"
  access_key = "test"
  secret_key = "test"

  endpoints {
    s3  = "http://localhost:4566"
    sts = "http://localhost:4566"
    iam = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# ── Call the same module multiple times (for_each on module) ─────────────────
variable "environments" {
  default = {
    dev  = { versioning = false, lifecycle_days = 30 }
    prod = { versioning = true,  lifecycle_days = 365 }
  }
}

module "app_storage" {
  for_each = var.environments

  source         = "./modules/app-storage"
  environment    = each.key
  versioning     = each.value.versioning
  lifecycle_days = each.value.lifecycle_days
}

# ── Chain module outputs: use output from one module as input to another ─────
module "iam_access" {
  source      = "./modules/iam-access"
  bucket_arns = [for env, mod in module.app_storage : mod.bucket_arn]
}

output "dev_bucket"   { value = module.app_storage["dev"].bucket_name }
output "prod_bucket"  { value = module.app_storage["prod"].bucket_name }
output "role_arn"     { value = module.iam_access.role_arn }
output "all_buckets"  { value = { for env, mod in module.app_storage : env => mod.bucket_name } }
