# Phase 4 - Exercise 01: Workspaces
# Learn: terraform workspaces, environment isolation, workspace-aware config
# Workspaces let you manage multiple environments (dev/staging/prod)
# from ONE set of .tf files with ONE backend.

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

# terraform.workspace returns the current workspace name: "default", "dev", "prod"
locals {
  env = terraform.workspace

  # Different config per workspace
  instance_config = {
    default = { size = "small", replicas = 1 }
    dev     = { size = "small", replicas = 1 }
    staging = { size = "medium", replicas = 2 }
    prod    = { size = "large",  replicas = 3 }
  }

  # Look up config for current workspace, fall back to default
  config = lookup(local.instance_config, local.env, local.instance_config["default"])
}

# Each workspace gets its OWN bucket — namespaced by workspace
resource "aws_s3_bucket" "app" {
  bucket        = "tf-workspace-demo-${local.env}"
  force_destroy = true
  tags = {
    Environment = local.env
    Size        = local.config.size
    Replicas    = local.config.replicas
  }
}

output "workspace"    { value = terraform.workspace }
output "bucket_name"  { value = aws_s3_bucket.app.bucket }
output "config"       { value = local.config }
