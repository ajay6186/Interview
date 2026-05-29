# Phase 3 - Exercise 04: Loops & Conditionals
# Learn: count, for_each, for expressions, conditional expressions

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

data "aws_caller_identity" "current" {}

# ── count: create N identical resources ──────────────────────────────────────
resource "aws_s3_bucket" "count_example" {
  count         = 3  # creates 3 buckets
  bucket        = "tf-count-${count.index}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = { Name = "bucket-${count.index}" }
}

# ── for_each: create resources from a map/set ─────────────────────────────────
variable "buckets" {
  default = {
    logs    = { versioning = false, region = "ap-south-1" }
    backups = { versioning = true,  region = "ap-south-1" }
    assets  = { versioning = false, region = "ap-south-1" }
  }
}

resource "aws_s3_bucket" "foreach_example" {
  for_each      = var.buckets  # each.key = "logs", each.value = { versioning = false, ... }
  bucket        = "tf-foreach-${each.key}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = { Name = each.key }
}

resource "aws_s3_bucket_versioning" "foreach_example" {
  for_each = var.buckets
  bucket   = aws_s3_bucket.foreach_example[each.key].id
  versioning_configuration {
    status = each.value.versioning ? "Enabled" : "Suspended"  # conditional
  }
}

# ── for expression: transform a list/map ─────────────────────────────────────
locals {
  # Transform list to uppercase
  bucket_names_upper = [for name in keys(var.buckets) : upper(name)]

  # Filter + transform map
  versioned_buckets = {
    for name, config in var.buckets : name => config
    if config.versioning == true
  }
}

output "count_bucket_ids"   { value = aws_s3_bucket.count_example[*].id }
output "foreach_bucket_ids" { value = { for k, v in aws_s3_bucket.foreach_example : k => v.id } }
output "bucket_names_upper" { value = local.bucket_names_upper }
output "versioned_buckets"  { value = local.versioned_buckets }
