# Phase 3 - Exercise 05: Workspaces
# Learn: terraform workspaces, environment isolation with one codebase

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
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# terraform.workspace = current workspace name ("default", "dev", "staging", "prod")
locals {
  workspace = terraform.workspace

  # Per-workspace configuration map
  env_config = {
    default = { retention_days = 7,  versioning = false, size = "small" }
    dev     = { retention_days = 7,  versioning = false, size = "small" }
    staging = { retention_days = 30, versioning = true,  size = "medium" }
    prod    = { retention_days = 90, versioning = true,  size = "large" }
  }

  # Get config for current workspace (fallback to "default")
  config = lookup(local.env_config, local.workspace, local.env_config["default"])
}

# Each workspace gets its own bucket — total isolation
resource "aws_s3_bucket" "app" {
  bucket        = "tf-workspace-${local.workspace}-bucket"
  force_destroy = true

  tags = {
    Environment = local.workspace
    Size        = local.config.size
  }
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration {
    status = local.config.versioning ? "Enabled" : "Suspended"
  }
}

output "workspace"      { value = terraform.workspace }
output "bucket_name"    { value = aws_s3_bucket.app.bucket }
output "config"         { value = local.config }
