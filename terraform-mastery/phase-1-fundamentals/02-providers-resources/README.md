# 02 - Providers & Resources

## What you learn
- How providers work (AWS plugin downloaded by `terraform init`)
- Resource syntax: `resource "type" "name" {}`
- Referencing resource attributes: `aws_s3_bucket.my_bucket.id`
- Resource dependencies (implicit vs explicit)

## Resource Reference Pattern
```
<resource_type>.<local_name>.<attribute>
     |               |           |
aws_s3_bucket   my_bucket      .id / .arn / .bucket
```

## Implicit vs Explicit Dependencies
```hcl
# Implicit: Terraform detects the dependency automatically
resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.my_bucket.id  # <-- this creates a dependency
}

# Explicit: use depends_on when no attribute reference exists
resource "aws_s3_bucket_public_access_block" "example" {
  bucket = "my-bucket-name"
  depends_on = [aws_s3_bucket.my_bucket]
}
```

## Provider requires an extra provider
This exercise uses `random` provider for unique bucket names.
Add to `terraform` block:
```hcl
random = {
  source  = "hashicorp/random"
  version = "~> 3.0"
}
```

## Commands
```bash
terraform init
terraform plan          # see what will be created
terraform apply         # type "yes" to confirm
terraform show          # see current state
terraform destroy       # IMPORTANT: delete resources after learning
```

## Free Tier
S3 is free tier: 5GB storage, 20,000 GET requests, 2,000 PUT requests/month.


  The Key Difference: LocalStack vs Real AWS

  LocalStack provider block:              Real AWS provider block:
  ──────────────────────────              ────────────────────────
  provider "aws" {                        provider "aws" {
    access_key = "test"    ← fake          region = "ap-south-1"
    secret_key = "test"    ← fake        }
    endpoints {                           ↑ reads credentials from:
      s3 = "http://localhost:4566"        - env vars (AWS_ACCESS_KEY_ID)
    }                                     - ~/.aws/credentials file
    skip_credentials_validation = true    - IAM role (on EC2/Lambda)
  }
