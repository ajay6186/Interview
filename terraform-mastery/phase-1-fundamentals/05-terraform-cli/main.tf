# Phase 1 - Exercise 05: Terraform CLI
# Learn: plan/apply/destroy workflow, workspaces, state commands, console
# This file exists purely so you can practice CLI commands against real resources.

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

variable "environment" {
  type    = string
  default = "dev"
}

resource "aws_s3_bucket" "cli_demo" {
  bucket        = "tf-cli-demo-${var.environment}"
  force_destroy = true
  tags = {
    Name        = "cli-demo"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "bucket_name" { value = aws_s3_bucket.cli_demo.bucket }
output "bucket_arn"  { value = aws_s3_bucket.cli_demo.arn }
