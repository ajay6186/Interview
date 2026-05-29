# Phase 1 - Exercise 02: Providers & Resources
# Learn: how to create your first real AWS resource (S3 bucket — free tier safe)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# --- Resource Block Syntax ---
# resource "<PROVIDER>_<TYPE>" "<LOCAL_NAME>" { ... }
# The local name is used to reference this resource elsewhere: aws_s3_bucket.my_bucket

resource "aws_s3_bucket" "my_bucket" {
  # bucket name must be globally unique across ALL AWS accounts
  bucket = "terraform-mastery-learn-${random_id.suffix.hex}"

  tags = {
    Name        = "terraform-mastery-bucket"
    Environment = "learning"
  }
}

# random_id generates a unique suffix so bucket name doesn't conflict
resource "random_id" "suffix" {
  byte_length = 4
}

# Block public access (best practice — always do this)
resource "aws_s3_bucket_public_access_block" "my_bucket" {
  bucket = aws_s3_bucket.my_bucket.id  # reference another resource's attribute

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Outputs: reference resource attributes ---
output "bucket_name" {
  value = aws_s3_bucket.my_bucket.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.my_bucket.arn
}

output "bucket_region" {
  value = aws_s3_bucket.my_bucket.region
}
