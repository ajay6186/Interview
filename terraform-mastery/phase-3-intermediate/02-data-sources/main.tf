# Phase 3 - Exercise 02: Data Sources
# Learn: reading existing infrastructure, aws_caller_identity, aws_ami,
#        aws_vpc, aws_subnets, aws_ssm_parameter, remote state data source

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
    s3        = "http://localhost:4566"
    sts       = "http://localhost:4566"
    ssm       = "http://localhost:4566"
    ec2       = "http://localhost:4566"
    iam       = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# ── Data Source 1: Current AWS Account ────────────────────────────────────────
# Fetches the account ID, user ARN, and user ID of the caller
data "aws_caller_identity" "current" {}

# ── Data Source 2: AWS Region ──────────────────────────────────────────────────
data "aws_region" "current" {}

# ── Data Source 3: SSM Parameter Store ────────────────────────────────────────
# First create a parameter, then read it back via data source
resource "aws_ssm_parameter" "app_version" {
  name  = "/myapp/version"
  type  = "String"
  value = "1.4.2"
}

data "aws_ssm_parameter" "app_version" {
  name       = "/myapp/version"
  depends_on = [aws_ssm_parameter.app_version]
}

# ── Data Source 4: S3 Bucket (read existing) ──────────────────────────────────
# Creates a bucket, then reads it back via data source to demonstrate the pattern
resource "aws_s3_bucket" "existing" {
  bucket        = "tf-data-source-demo"
  force_destroy = true
}

data "aws_s3_bucket" "existing" {
  bucket     = aws_s3_bucket.existing.bucket
  depends_on = [aws_s3_bucket.existing]
}

# ── Locals: combine data source values ────────────────────────────────────────
locals {
  # Build resource names using account/region from data sources
  resource_prefix = "app-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "account_id"      { value = data.aws_caller_identity.current.account_id }
output "current_region"  { value = data.aws_region.current.name }
output "caller_arn"      { value = data.aws_caller_identity.current.arn }
output "app_version"     { value = data.aws_ssm_parameter.app_version.value }
output "bucket_arn"      { value = data.aws_s3_bucket.existing.arn }
output "resource_prefix" { value = local.resource_prefix }
