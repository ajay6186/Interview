# Phase 4 - Exercise 03: Import & Refactor
# Learn: terraform import, moved blocks, refactoring state safely
# Use when you have existing AWS resources not yet managed by Terraform.

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

# ── Step 1: Create a resource manually (simulates existing infra) ──────────────
# In real life, this bucket already exists before Terraform manages it.
resource "aws_s3_bucket" "existing_app" {
  bucket        = "tf-import-demo-app"
  force_destroy = true
  tags          = { Name = "import-demo", ManagedBy = "terraform" }
}

# ── Step 2: Demonstrate moved block (safe rename/refactor) ────────────────────
# If you rename a resource in .tf, Terraform would destroy old + create new.
# The `moved` block tells Terraform the resource was renamed — no destroy.

# Example: renamed aws_s3_bucket.old_name → aws_s3_bucket.existing_app
# moved {
#   from = aws_s3_bucket.old_name
#   to   = aws_s3_bucket.existing_app
# }

# ── Step 3: Import block (Terraform 1.5+ — declarative import) ────────────────
# Instead of CLI `terraform import`, define imports in config:
#
# import {
#   id = "tf-import-demo-app"         # AWS resource ID (bucket name for S3)
#   to = aws_s3_bucket.existing_app   # Terraform resource address
# }
#
# Then run: terraform plan  (Terraform shows what it will import)
#           terraform apply (imports the resource into state)

output "bucket_name" { value = aws_s3_bucket.existing_app.bucket }
output "bucket_arn"  { value = aws_s3_bucket.existing_app.arn }
