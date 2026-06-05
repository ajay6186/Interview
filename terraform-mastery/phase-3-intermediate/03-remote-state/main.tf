# Phase 3 - Exercise 03: Remote State
# Learn: S3 backend, DynamoDB state locking, terraform_remote_state data source,
#        state isolation between teams/environments

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }

  # --- S3 Backend (remote state) ---
  # Stores terraform.tfstate in S3 instead of locally.
  # Enables team collaboration — everyone reads/writes the same state.
  # Uncomment and fill in real values when using a real AWS account.
  #
  # backend "s3" {
  #   bucket         = "my-tf-state-bucket-<account-id>"
  #   key            = "phase3/remote-state/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "terraform-state-lock"   # prevents concurrent applies
  #   encrypt        = true                      # encrypt state at rest
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

# ── Step 1: Create the state backend infrastructure ───────────────────────────
# In real setups, this is created MANUALLY or with a separate bootstrap config.
# Never store state backend infra in the same state it manages (chicken-and-egg).

resource "aws_s3_bucket" "state" {
  bucket        = "tf-remote-state-demo"
  force_destroy = true
  tags          = { Purpose = "terraform-state" }
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

# ── Step 2: DynamoDB table for state locking ──────────────────────────────────
# Prevents two engineers from running terraform apply at the same time.
# The table MUST have a partition key named "LockID" of type String.
resource "aws_dynamodb_table" "state_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = { Purpose = "terraform-state-lock" }
}

# ── Step 3: Simulate reading outputs from another state ───────────────────────
# In practice this reads a DIFFERENT team's state file.
# Example: networking team's VPC outputs consumed by app team.
#
# data "terraform_remote_state" "networking" {
#   backend = "s3"
#   config = {
#     bucket = "my-tf-state-bucket"
#     key    = "networking/terraform.tfstate"
#     region = "ap-south-1"
#   }
# }
#
# Then use outputs from that state:
# subnet_id = data.terraform_remote_state.networking.outputs.public_subnet_ids[0]

# ── Outputs ───────────────────────────────────────────────────────────────────
output "state_bucket_name"    { value = aws_s3_bucket.state.bucket }
output "state_bucket_arn"     { value = aws_s3_bucket.state.arn }
output "lock_table_name"      { value = aws_dynamodb_table.state_lock.name }
output "backend_config" {
  value = <<-EOT
    backend "s3" {
      bucket         = "${aws_s3_bucket.state.bucket}"
      key            = "env/terraform.tfstate"
      region         = "ap-south-1"
      dynamodb_table = "${aws_dynamodb_table.state_lock.name}"
      encrypt        = true
    }
  EOT
}
