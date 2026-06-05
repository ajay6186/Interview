# Phase 6 - Terragrunt Root Config
# This file demonstrates the root terragrunt.hcl pattern.
# Run: terragrunt plan / terragrunt apply (NOT terraform directly)

locals {
  region      = "ap-south-1"
  environment = basename(get_terragrunt_dir())
}

# DRY remote state — auto-generated per module based on directory path
remote_state {
  backend = "s3"

  config = {
    bucket         = "tf-terragrunt-state-${get_aws_account_id()}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.region
    dynamodb_table = "terragrunt-locks"
    encrypt        = true
  }

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }
}

# Common inputs injected into every child module automatically
inputs = {
  region      = local.region
  environment = local.environment
}

# Common provider config generated automatically in every module
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = <<-EOF
    provider "aws" {
      region = "${local.region}"
    }
  EOF
}
