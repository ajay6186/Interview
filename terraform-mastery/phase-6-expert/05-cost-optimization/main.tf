# Phase 6 - Expert 05: Cost Optimization
# Learn: cost tagging strategy, AWS Budgets, resource scheduling,
#        spot instances, S3 intelligent tiering

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

data "aws_caller_identity" "current" {}

# ── Cost Allocation Tags ───────────────────────────────────────────────────────
# ALL resources must have these tags for cost attribution
locals {
  mandatory_tags = {
    Owner       = "platform-team"
    Project     = "tf-mastery"
    Environment = "learning"
    CostCenter  = "engineering"
    ManagedBy   = "terraform"
  }
}

# ── AWS Budget: monthly spend alert ───────────────────────────────────────────
resource "aws_budgets_budget" "monthly" {
  name         = "tf-mastery-monthly-budget"
  budget_type  = "COST"
  limit_amount = "50"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80   # alert at 80% of budget
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["ajayyadav6186@gmail.com"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100  # alert when over budget
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["ajayyadav6186@gmail.com"]
  }
}

# ── S3 Intelligent Tiering (automatic cost reduction) ─────────────────────────
resource "aws_s3_bucket" "intelligent" {
  bucket        = "tf-cost-intelligent-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = merge(local.mandatory_tags, { Name = "cost-optimized-storage" })
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "intelligent" {
  bucket = aws_s3_bucket.intelligent.id
  name   = "EntireBucket"

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180   # move to deep archive after 180 days without access
  }

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90    # move to archive after 90 days
  }
}

# ── S3 Lifecycle: transition old objects ──────────────────────────────────────
resource "aws_s3_bucket" "lifecycle_optimized" {
  bucket        = "tf-cost-lifecycle-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = merge(local.mandatory_tags, { Name = "lifecycle-storage" })
}

resource "aws_s3_bucket_lifecycle_configuration" "lifecycle_optimized" {
  bucket = aws_s3_bucket.lifecycle_optimized.id

  rule {
    id     = "logs-lifecycle"
    status = "Enabled"

    filter { prefix = "logs/" }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"   # 45% cheaper than STANDARD
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"    # 68% cheaper, instant retrieval
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"  # 95% cheaper, 12hr retrieval
    }

    expiration {
      days = 365  # delete after 1 year
    }

    noncurrent_version_expiration {
      noncurrent_days = 30  # clean up old versions after 30 days
    }
  }
}

# ── IAM for cost management ────────────────────────────────────────────────────
resource "aws_iam_policy" "cost_explorer" {
  name        = "tf-cost-explorer-readonly"
  description = "Read-only access to AWS Cost Explorer for cost analysis"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "ce:GetReservationUtilization",
        "ce:GetSavingsPlansCoverage",
        "budgets:ViewBudget"
      ]
      Resource = "*"
    }]
  })
}

output "budget_name"           { value = aws_budgets_budget.monthly.name }
output "intelligent_bucket"    { value = aws_s3_bucket.intelligent.bucket }
output "lifecycle_bucket"      { value = aws_s3_bucket.lifecycle_optimized.bucket }
