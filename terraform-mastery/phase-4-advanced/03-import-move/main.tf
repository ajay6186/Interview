# Phase 4 - Exercise 03: Import & Moved Blocks
# Learn: terraform import CLI, import{} block (Terraform 1.5+), moved{} block
# Use case: bring unmanaged resources under Terraform control

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

# ── Step 1: Simulate existing infrastructure ──────────────────────────────────
# These represent resources that exist in AWS but are NOT in Terraform state.
# In real life, they were created manually via Console/CLI before Terraform.

resource "aws_s3_bucket" "app_data" {
  bucket        = "tf-import-app-data"
  force_destroy = true
  tags          = { Name = "app-data", ManagedBy = "terraform" }
}

resource "aws_s3_bucket" "app_logs" {
  bucket        = "tf-import-app-logs"
  force_destroy = true
  tags          = { Name = "app-logs", ManagedBy = "terraform" }
}

# ── Step 2: Import block (Terraform 1.5+) ─────────────────────────────────────
# Declarative — lives in source control, visible in plan output.
# Syntax: import { id = <aws-id>; to = <resource-address> }
#
# Uncomment after removing these resources from state to practice import:
# import {
#   id = "tf-import-app-data"
#   to = aws_s3_bucket.app_data
# }

# ── Step 3: moved block — safe rename without destroy ─────────────────────────
# If you renamed aws_s3_bucket.legacy → aws_s3_bucket.app_data in .tf,
# without moved{} Terraform would destroy legacy and create app_data.
# With moved{} it only updates state — no AWS changes.
#
# moved {
#   from = aws_s3_bucket.legacy
#   to   = aws_s3_bucket.app_data
# }

# ── Step 4: moved block for count → for_each migration ────────────────────────
# Before (count-based):
#   resource "aws_s3_bucket" "buckets" { count = 2; bucket = "bucket-${count.index}" }
#
# After (for_each-based — safer):
#   resource "aws_s3_bucket" "buckets" { for_each = toset(["data", "logs"]); ... }
#
# Without moved: destroy [0],[1] → create ["data"],["logs"]
# With moved:
# moved { from = aws_s3_bucket.buckets[0]; to = aws_s3_bucket.buckets["data"] }
# moved { from = aws_s3_bucket.buckets[1]; to = aws_s3_bucket.buckets["logs"] }

output "app_data_bucket" { value = aws_s3_bucket.app_data.bucket }
output "app_logs_bucket" { value = aws_s3_bucket.app_logs.bucket }
