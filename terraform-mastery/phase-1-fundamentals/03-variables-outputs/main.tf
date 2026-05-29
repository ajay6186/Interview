# Phase 1 - Exercise 03: Variables & Outputs
# Learn: input variables, output values, variable types, defaults, validation

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# --- Variables ---
variable "region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"

  # Validation: restrict allowed values
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "bucket_prefix" {
  description = "Prefix for the S3 bucket name"
  type        = string
  default     = "tf-learn"
}

variable "enable_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project   = "terraform-mastery"
    ManagedBy = "terraform"
  }
}

provider "aws" {
  region = var.region
}

locals {
  bucket_name = "${var.bucket_prefix}-${var.environment}-${data.aws_caller_identity.current.account_id}"
}

# Data source: fetch current AWS account ID
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "main" {
  bucket = local.bucket_name
  tags   = merge(var.tags, { Environment = var.environment })
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# --- Outputs ---
output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Sensitive output — value hidden in terminal but stored in state
output "account_alias" {
  description = "AWS account alias"
  value       = "my-aws-account"
  sensitive   = false
}
