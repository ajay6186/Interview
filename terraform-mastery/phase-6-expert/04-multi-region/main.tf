# Phase 6 - Expert 04: Multi-Region Deployment
# Learn: multiple provider aliases, cross-region resources, replication

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# ── Provider aliases for each region ─────────────────────────────────────────
provider "aws" {
  alias  = "primary"
  region = "ap-south-1"   # Mumbai — primary region
}

provider "aws" {
  alias  = "dr"
  region = "ap-southeast-1"  # Singapore — disaster recovery
}

# ── Primary region resources ──────────────────────────────────────────────────
resource "aws_s3_bucket" "primary" {
  provider      = aws.primary
  bucket        = "tf-multiregion-primary-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = { Name = "primary", Region = "ap-south-1" }
}

data "aws_caller_identity" "current" {
  provider = aws.primary
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration { status = "Enabled" }  # required for replication
}

# ── DR region resources ───────────────────────────────────────────────────────
resource "aws_s3_bucket" "dr" {
  provider      = aws.dr
  bucket        = "tf-multiregion-dr-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = { Name = "dr-replica", Region = "ap-southeast-1" }
}

resource "aws_s3_bucket_versioning" "dr" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr.id
  versioning_configuration { status = "Enabled" }  # required for replication destination
}

# ── IAM role for S3 replication ───────────────────────────────────────────────
resource "aws_iam_role" "replication" {
  provider = aws.primary
  name     = "tf-multiregion-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "s3.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "replication" {
  provider = aws.primary
  name     = "replication-policy"
  role     = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetReplicationConfiguration", "s3:ListBucket"]
        Resource = [aws_s3_bucket.primary.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl"]
        Resource = ["${aws_s3_bucket.primary.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ReplicateObject", "s3:ReplicateDelete"]
        Resource = ["${aws_s3_bucket.dr.arn}/*"]
      }
    ]
  })
}

# ── Cross-Region Replication: primary → DR ────────────────────────────────────
resource "aws_s3_bucket_replication_configuration" "primary_to_dr" {
  provider = aws.primary
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.dr.arn
      storage_class = "STANDARD_IA"  # cheaper storage for DR
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary]
}

output "primary_bucket" { value = aws_s3_bucket.primary.bucket }
output "dr_bucket"      { value = aws_s3_bucket.dr.bucket }
output "primary_region" { value = "ap-south-1" }
output "dr_region"      { value = "ap-southeast-1" }
