# Phase 2 - Exercise 01: S3 Basics
# Learn: S3 bucket, versioning, encryption, lifecycle rules, static website

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

locals {
  bucket_name = "tf-mastery-s3-demo-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

# Main bucket
resource "aws_s3_bucket" "main" {
  bucket        = local.bucket_name
  force_destroy = true  # allows destroy even if bucket has objects

  tags = { Name = "tf-mastery-s3" }
}

# Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration { status = "Enabled" }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule: transition old objects to cheaper storage
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "archive-old-objects"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"  # Infrequent Access (cheaper)
    }

    transition {
      days          = 90
      storage_class = "GLACIER"  # Even cheaper, slow retrieval
    }

    expiration {
      days = 365  # Delete after 1 year
    }
  }
}

# Upload a test object
resource "aws_s3_object" "test_file" {
  bucket  = aws_s3_bucket.main.id
  key     = "hello/world.txt"
  content = "Hello from Terraform!"
  content_type = "text/plain"
}

output "bucket_name" { value = aws_s3_bucket.main.bucket }
output "bucket_arn"  { value = aws_s3_bucket.main.arn }
output "object_url"  { value = "s3://${aws_s3_bucket.main.bucket}/${aws_s3_object.test_file.key}" }
