# Phase 1 - Exercise 04: State Management
# Learn: what terraform state is, local vs remote state, state commands

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # --- Remote State (S3 backend) ---
  # Uncomment AFTER creating the S3 bucket and DynamoDB table manually
  # (or after completing phase-2 exercises)
  #
  # backend "s3" {
  #   bucket         = "my-terraform-state-bucket-123"
  #   key            = "phase1/state-management/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = "ap-south-1"
}

# Simple resource to observe state
resource "aws_s3_bucket" "state_demo" {
  bucket = "tf-state-demo-${formatdate("YYMMDDhhmmss", timestamp())}"

  tags = {
    Name    = "state-demo"
    Purpose = "learning terraform state"
  }
}

output "bucket_id" {
  value = aws_s3_bucket.state_demo.id
}
