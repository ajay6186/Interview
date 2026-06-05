# 4.3 — Import & Moved Blocks

**Goal:** Bring existing AWS resources under Terraform management and safely refactor resource addresses without destroying infrastructure.

## Import: Bringing Unmanaged Resources into State

### Method 1: CLI Import
```bash
# 1. Write the resource block (must match existing resource config)
resource "aws_s3_bucket" "app_data" {
  bucket = "tf-import-app-data"
}

# 2. Import into state
terraform import aws_s3_bucket.app_data tf-import-app-data

# 3. Plan should show 0 changes if config matches reality
terraform plan
```

### Method 2: Import Block (Terraform 1.5+ — recommended)
```hcl
# Declarative — in source control, reviewable in PRs
import {
  id = "tf-import-app-data"
  to = aws_s3_bucket.app_data
}

resource "aws_s3_bucket" "app_data" {
  bucket = "tf-import-app-data"
}
```
```bash
terraform plan    # shows: will import 1 resource
terraform apply   # performs the import
```

## Import IDs by Resource Type

| Resource | Import ID |
|----------|-----------|
| `aws_s3_bucket` | bucket name |
| `aws_instance` | `i-1234567890abcdef0` |
| `aws_vpc` | `vpc-12345678` |
| `aws_security_group` | `sg-12345678` |
| `aws_iam_role` | role name |
| `aws_iam_policy` | full policy ARN |
| `aws_subnet` | `subnet-12345678` |
| `aws_route_table` | `rtb-12345678` |

## Moved Block: Safe Refactoring

### Renaming a Resource
```hcl
# Without moved: Terraform destroys "legacy" and creates "primary" 💥
# With moved: Terraform only updates the state file — zero AWS changes

moved {
  from = aws_s3_bucket.legacy
  to   = aws_s3_bucket.primary
}
```

### Moving into a Module
```hcl
moved {
  from = aws_s3_bucket.app
  to   = module.storage.aws_s3_bucket.app
}
```

### Migrating count → for_each (most common use case)
```hcl
# Old (index-based — fragile)
resource "aws_s3_bucket" "app" { count = 2 }
# app[0], app[1]

# New (key-based — stable)
resource "aws_s3_bucket" "app" {
  for_each = toset(["data", "logs"])
}
# app["data"], app["logs"]

# moved blocks prevent destroy/recreate
moved {
  from = aws_s3_bucket.app[0]
  to   = aws_s3_bucket.app["data"]
}
moved {
  from = aws_s3_bucket.app[1]
  to   = aws_s3_bucket.app["logs"]
}
```

## Practice Workflow

```bash
# Apply to create resources (simulates pre-existing infra)
terraform apply -auto-approve

# Remove one from state (simulate it was manually created, not in state)
terraform state rm aws_s3_bucket.app_logs

# Now plan shows it needs to be created — but it already exists in AWS
terraform plan
# + aws_s3_bucket.app_logs will be created  ← wrong, it exists!

# Import it back
terraform import aws_s3_bucket.app_logs tf-import-app-logs

# Plan should now show 0 changes
terraform plan

terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between `terraform import` CLI and import blocks?**
> CLI import is imperative — you run it once manually and it's not recorded in code. Import blocks (1.5+) are declarative — they live in `.tf` files, appear in `terraform plan` output, and can be code-reviewed in PRs.

**Q: After importing a resource, what should `terraform plan` show?**
> Zero changes. If plan shows changes, your `.tf` resource block doesn't match the actual state of the AWS resource. Update the config to match until plan is clean before managing the resource.
