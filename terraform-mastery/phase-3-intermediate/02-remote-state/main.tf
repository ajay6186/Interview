# Phase 3 - Exercise 02: Remote State & State Commands
# Learn: S3 backend, DynamoDB locking, state CLI commands, state manipulation

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }

  # Uncomment after creating the bucket below, then run terraform init to migrate
  # backend "s3" {
  #   bucket         = "tf-state-backend-demo"
  #   key            = "phase3/remote-state/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region     = "ap-south-1"
  access_key = "test"
  secret_key = "test"

  endpoints {
    s3       = "http://localhost:4566"
    sts      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# State backend infrastructure
resource "aws_s3_bucket" "state" {
  bucket        = "tf-state-backend-demo"
  force_destroy = true
  tags          = { Purpose = "terraform-state-backend" }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB for state locking
resource "aws_dynamodb_table" "locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = { Purpose = "terraform-state-lock" }
}

# Practice resources for state command exercises
resource "aws_s3_bucket" "app_a" {
  bucket        = "tf-state-demo-app-a"
  force_destroy = true
  tags          = { Name = "app-a" }
}

resource "aws_s3_bucket" "app_b" {
  bucket        = "tf-state-demo-app-b"
  force_destroy = true
  tags          = { Name = "app-b" }
}

resource "aws_s3_bucket" "app_c" {
  bucket        = "tf-state-demo-app-c"
  force_destroy = true
  tags          = { Name = "app-c" }
}

output "state_bucket"  { value = aws_s3_bucket.state.bucket }
output "lock_table"    { value = aws_dynamodb_table.locks.name }
output "app_a_id"      { value = aws_s3_bucket.app_a.id }
output "app_b_id"      { value = aws_s3_bucket.app_b.id }
