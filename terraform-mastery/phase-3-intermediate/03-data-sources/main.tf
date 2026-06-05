# Phase 3 - Exercise 03: Advanced Data Sources
# Learn: combining multiple data sources, aws_availability_zones,
#        aws_ami with complex filters, aws_iam_policy_document, templatefile

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
    s3   = "http://localhost:4566"
    sts  = "http://localhost:4566"
    ec2  = "http://localhost:4566"
    iam  = "http://localhost:4566"
    ssm  = "http://localhost:4566"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
}

# ── Data Source 1: Account identity ───────────────────────────────────────────
data "aws_caller_identity" "current" {}

# ── Data Source 2: Available AZs in this region ───────────────────────────────
data "aws_availability_zones" "available" {
  state = "available"
}

# ── Data Source 3: IAM policy document (generates valid JSON) ─────────────────
data "aws_iam_policy_document" "bucket_access" {
  statement {
    sid    = "AllowGetPut"
    effect = "Allow"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::tf-datasource-demo-*/*"]
  }

  statement {
    sid    = "AllowList"
    effect = "Allow"
    actions = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::tf-datasource-demo-*"]
  }
}

# ── Data Source 4: SSM Parameter Store ────────────────────────────────────────
resource "aws_ssm_parameter" "config" {
  name  = "/app/datasource-demo/config"
  type  = "String"
  value = jsonencode({ version = "2.0", feature_flags = { dark_mode = true } })
}

data "aws_ssm_parameter" "config" {
  name       = aws_ssm_parameter.config.name
  depends_on = [aws_ssm_parameter.config]
}

# ── Use data sources to drive resource creation ───────────────────────────────
locals {
  account_id = data.aws_caller_identity.current.account_id
  azs        = data.aws_availability_zones.available.names

  # Parse SSM config
  app_config = jsondecode(data.aws_ssm_parameter.config.value)
}

# Create S3 bucket named with account ID from data source
resource "aws_s3_bucket" "datasource_demo" {
  bucket        = "tf-datasource-demo-${local.account_id}"
  force_destroy = true
  tags = {
    AccountId = local.account_id
    AZCount   = length(local.azs)
  }
}

# Create IAM policy using policy document data source
resource "aws_iam_policy" "bucket_access" {
  name   = "tf-datasource-bucket-access"
  policy = data.aws_iam_policy_document.bucket_access.json
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "account_id"        { value = data.aws_caller_identity.current.account_id }
output "available_azs"     { value = data.aws_availability_zones.available.names }
output "az_count"          { value = length(data.aws_availability_zones.available.names) }
output "policy_json"       { value = data.aws_iam_policy_document.bucket_access.json }
output "ssm_config"        { value = local.app_config }
output "bucket_name"       { value = aws_s3_bucket.datasource_demo.bucket }
