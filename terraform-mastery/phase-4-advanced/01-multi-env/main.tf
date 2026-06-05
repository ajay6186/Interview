# Phase 4 - Exercise 01: Multi-Environment Pattern (Directory-based)
# Learn: directory-per-environment, shared modules, tfvars per env
# This is the INDUSTRY STANDARD for managing multiple environments.

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region     = var.region
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

variable "region"      { default = "ap-south-1" }
variable "environment" { default = "dev" }
variable "project"     { default = "tf-mastery" }

variable "s3_versioning" {
  description = "Enable S3 versioning (true in prod, false in dev)"
  type        = bool
  default     = false
}

variable "replica_count" {
  description = "Number of app buckets to create"
  type        = number
  default     = 1
}

locals {
  name_prefix = "${var.project}-${var.environment}"
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket" "app" {
  count         = var.replica_count
  bucket        = "${local.name_prefix}-app-${count.index}"
  force_destroy = true
  tags          = merge(local.common_tags, { Index = count.index })
}

resource "aws_s3_bucket_versioning" "app" {
  count  = var.replica_count
  bucket = aws_s3_bucket.app[count.index].id
  versioning_configuration {
    status = var.s3_versioning ? "Enabled" : "Suspended"
  }
}

output "environment"   { value = var.environment }
output "bucket_names"  { value = aws_s3_bucket.app[*].bucket }
output "replica_count" { value = var.replica_count }
