# provider.tf — Shared LocalStack provider config
# Copy this into any exercise folder to run against LocalStack instead of real AWS

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"

  # Fake credentials — LocalStack doesn't validate these
  access_key = "test"
  secret_key = "test"

  # Point ALL AWS API calls to LocalStack instead of real AWS
  endpoints {
    s3             = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    rds            = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    logs           = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    vpc            = "http://localhost:4566"
  }

  # Skip AWS-specific checks not needed for LocalStack
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  s3_use_path_style = true  # required for LocalStack S3
}
