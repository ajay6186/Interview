# Phase 4 - Exercise 05: Lifecycle Meta-Arguments
# Learn: create_before_destroy, prevent_destroy, ignore_changes,
#        replace_triggered_by, precondition, postcondition

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

# ── create_before_destroy: zero-downtime replacement ─────────────────────────
# Default Terraform behaviour: destroy old → create new (gap in service)
# create_before_destroy: create new → switch traffic → destroy old
resource "aws_s3_bucket" "zero_downtime" {
  bucket        = "tf-lifecycle-zero-downtime"
  force_destroy = true

  lifecycle {
    create_before_destroy = true  # new bucket exists before old is removed
  }
}

# ── prevent_destroy: protect critical resources from accidental deletion ───────
resource "aws_s3_bucket" "critical_data" {
  bucket        = "tf-lifecycle-critical"
  force_destroy = true

  lifecycle {
    prevent_destroy = true  # terraform destroy will ERROR on this resource
    # Remove this flag before destroy: terraform apply -var="remove_protection=true"
  }
}

# ── ignore_changes: don't overwrite manual changes ───────────────────────────
# Scenario: AMI ID is updated manually after deploy — don't let Terraform revert it
resource "aws_s3_bucket" "ignore_demo" {
  bucket        = "tf-lifecycle-ignore"
  force_destroy = true

  tags = {
    Name        = "ignore-demo"
    LastUpdated = "2026-05-31"  # Terraform won't reset this if changed manually
  }

  lifecycle {
    ignore_changes = [
      tags["LastUpdated"],  # ignore only this specific tag
      # tags,              # ignore ALL tags (broader)
    ]
  }
}

# ── replace_triggered_by: force replacement when a dependency changes ─────────
resource "aws_s3_bucket" "config_bucket" {
  bucket        = "tf-lifecycle-config"
  force_destroy = true
}

resource "aws_s3_object" "app_config" {
  bucket  = aws_s3_bucket.config_bucket.id
  key     = "config.json"
  content = jsonencode({ version = "1.0", feature = "enabled" })
}

# This bucket gets REPLACED (not updated) whenever the config object changes
resource "aws_s3_bucket" "app" {
  bucket        = "tf-lifecycle-app"
  force_destroy = true

  lifecycle {
    replace_triggered_by = [
      aws_s3_object.app_config  # replace when config changes
    ]
  }
}

# ── precondition: validate before apply ───────────────────────────────────────
variable "bucket_prefix" {
  type    = string
  default = "tf-lifecycle"
}

resource "aws_s3_bucket" "validated" {
  bucket        = "${var.bucket_prefix}-validated"
  force_destroy = true

  lifecycle {
    precondition {
      condition     = length(var.bucket_prefix) >= 3
      error_message = "bucket_prefix must be at least 3 characters."
    }

    postcondition {
      condition     = self.bucket != ""
      error_message = "Bucket was created but has no name — unexpected."
    }
  }
}

output "zero_downtime_bucket" { value = aws_s3_bucket.zero_downtime.bucket }
output "app_bucket"           { value = aws_s3_bucket.app.bucket }
output "validated_bucket"     { value = aws_s3_bucket.validated.bucket }
