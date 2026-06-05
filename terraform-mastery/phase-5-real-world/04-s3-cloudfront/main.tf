# Phase 5 - Real World 04: S3 Static Website + CloudFront CDN
# Hosts a static website on S3, distributed globally via CloudFront

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = "ap-south-1" }

# CloudFront requires ACM certificate in us-east-1 only
# provider "aws" { alias = "us_east_1"; region = "us-east-1" }

locals {
  domain_name = "myapp.example.com"
  s3_origin_id = "S3-myapp-website"
}

# S3 bucket for static website files
resource "aws_s3_bucket" "website" {
  bucket        = "tf-mastery-static-website-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags          = { Name = "static-website" }
}

data "aws_caller_identity" "current" {}

# Disable public access block so CloudFront OAC can access objects
resource "aws_s3_bucket_public_access_block" "website" {
  bucket                  = aws_s3_bucket.website.id
  block_public_acls       = true
  block_public_policy     = false   # allow bucket policy (needed for OAC)
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# CloudFront Origin Access Control (OAC) — modern way to secure S3 origin
resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "tf-mastery-website-oac"
  description                       = "OAC for static website"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "tf-mastery static website"

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 3600    # 1 hour
    max_ttl     = 86400   # 24 hours
  }

  # Custom error pages (for SPA routing)
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"  # SPA: return index.html for all 404s
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true  # use *.cloudfront.net cert (no custom domain)
    # For custom domain, use ACM cert:
    # acm_certificate_arn      = aws_acm_certificate.website.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = { Name = "tf-mastery-website-cdn" }
}

# Bucket policy: allow only CloudFront (via OAC) to read objects
data "aws_iam_policy_document" "website" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.website.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.website.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = data.aws_iam_policy_document.website.json

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# Upload sample index.html
resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  content_type = "text/html"
  content      = <<-HTML
    <!DOCTYPE html>
    <html>
    <head><title>Terraform Static Website</title></head>
    <body>
      <h1>Hello from Terraform + CloudFront!</h1>
      <p>Deployed with S3 + CloudFront CDN</p>
    </body>
    </html>
  HTML
}

output "s3_bucket_name"       { value = aws_s3_bucket.website.bucket }
output "cloudfront_domain"    { value = "https://${aws_cloudfront_distribution.website.domain_name}" }
output "cloudfront_id"        { value = aws_cloudfront_distribution.website.id }
output "s3_direct_access"     { value = "BLOCKED (only CloudFront can access S3)" }
