# 3.3 — Advanced Data Sources

**Goal:** Combine multiple data sources to build dynamic, environment-aware infrastructure.

## Data Sources Covered

| Data Source | What it provides |
|-------------|-----------------|
| `aws_caller_identity` | Account ID, user ARN |
| `aws_availability_zones` | List of AZs in current region |
| `aws_iam_policy_document` | IAM JSON policy (generated, not fetched) |
| `aws_ssm_parameter` | Configuration value from Parameter Store |

## aws_availability_zones — Dynamic AZ Discovery

```hcl
data "aws_availability_zones" "available" {
  state = "available"   # only AZs that are operational
}

# Use with count to create subnets in all AZs automatically
resource "aws_subnet" "public" {
  count             = length(data.aws_availability_zones.available.names)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
}
# Works in any region — no hardcoded AZ names!
```

## aws_iam_policy_document — Policy as Code

```hcl
data "aws_iam_policy_document" "s3_access" {
  statement {
    sid    = "ReadBucket"
    effect = "Allow"
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]

    # Optional: restrict by condition
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = ["ap-south-1"]
    }
  }
}

# Output: fully valid IAM policy JSON
resource "aws_iam_policy" "s3_access" {
  policy = data.aws_iam_policy_document.s3_access.json
}
```

**Why use this over `jsonencode()`?**
- Validates IAM policy structure at plan time
- Supports `source_policy_documents` to merge multiple policies
- More readable than raw JSON strings

## Chaining Data Sources

```hcl
# Read one data source to feed another
data "aws_caller_identity" "current" {}

data "aws_s3_bucket" "logs" {
  bucket = "company-logs-${data.aws_caller_identity.current.account_id}"
}

# Use both in a resource
resource "aws_s3_bucket_policy" "logs" {
  bucket = data.aws_s3_bucket.logs.id
  policy = jsonencode({
    Statement = [{
      Principal = { AWS = data.aws_caller_identity.current.arn }
      Action    = ["s3:PutObject"]
      Resource  = "${data.aws_s3_bucket.logs.arn}/*"
    }]
  })
}
```

## SSM Parameter Store as Config Source

```hcl
# Store app config in SSM
resource "aws_ssm_parameter" "db_host" {
  name  = "/prod/database/host"
  type  = "SecureString"  # encrypted
  value = "rds.example.com"
}

# Other configs read it (no hardcoding)
data "aws_ssm_parameter" "db_host" {
  name            = "/prod/database/host"
  with_decryption = true
}

resource "aws_instance" "app" {
  user_data = "DB_HOST=${data.aws_ssm_parameter.db_host.value}"
}
```

## How to Run

```bash
terraform init
terraform apply -auto-approve

# See all data source outputs
terraform output available_azs
terraform output policy_json
terraform output ssm_config

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between `aws_iam_policy_document` and `jsonencode()` for IAM policies?**
> `aws_iam_policy_document` is a structured data source that validates IAM policy syntax at plan time and supports merging multiple policy documents. `jsonencode()` produces raw JSON with no validation. Both work, but `aws_iam_policy_document` catches mistakes earlier.

**Q: How do you make subnet creation region-agnostic?**
> Use `data.aws_availability_zones.available.names` to dynamically get AZs, combined with `count = length(...)`. This way the code works in any region without hardcoding AZ names.
