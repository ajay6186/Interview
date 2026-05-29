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

# S3 Bucket
resource "aws_s3_bucket" "demo" {
  bucket        = "my-localstack-demo-bucket"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "demo" {
  bucket = aws_s3_bucket.demo.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "demo" {
  bucket                  = aws_s3_bucket.demo.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Upload a file
resource "aws_s3_object" "hello" {
  bucket       = aws_s3_bucket.demo.id
  key          = "hello.txt"
  content      = "Hello from LocalStack Terraform!"
  content_type = "text/plain"
}

resource "aws_s3_object" "config" {
  bucket       = aws_s3_bucket.demo.id
  key          = "config/app.json"
  content      = jsonencode({ env = "local", debug = true })
  content_type = "application/json"
}

output "bucket_name" { value = aws_s3_bucket.demo.bucket }
output "bucket_arn"  { value = aws_s3_bucket.demo.arn }
output "object_key"  { value = aws_s3_object.hello.key }
