# 4.3 — Import & Refactor

**Goal:** Bring existing AWS resources under Terraform management, and safely rename/move resources without destroying them.

## The Problem

You have AWS resources created manually (console/CLI) before Terraform existed. You want Terraform to manage them without destroying and recreating them.

```
Existing AWS resource (not in state)
        ↓
terraform import → adds resource to state
        ↓
Terraform now manages it — plan/apply/destroy work normally
```

## Method 1: CLI Import (classic)

```bash
# 1. Write the resource block in main.tf (matching existing resource config)
resource "aws_s3_bucket" "existing" {
  bucket = "my-existing-bucket"
}

# 2. Import it into state
terraform import aws_s3_bucket.existing my-existing-bucket
#               ^resource address        ^AWS resource ID

# 3. Run plan — should show no changes if config matches reality
terraform plan
```

### Common Import IDs

| Resource | Import ID |
|----------|-----------|
| `aws_s3_bucket` | bucket name |
| `aws_instance` | instance ID (`i-1234567890abcdef0`) |
| `aws_security_group` | SG ID (`sg-12345678`) |
| `aws_vpc` | VPC ID (`vpc-12345678`) |
| `aws_iam_role` | role name |
| `aws_iam_policy` | policy ARN |

## Method 2: Import Block (Terraform 1.5+ — recommended)

```hcl
# In main.tf — declarative, version-controlled
import {
  id = "my-existing-bucket"
  to = aws_s3_bucket.existing
}

resource "aws_s3_bucket" "existing" {
  bucket = "my-existing-bucket"
}
```

```bash
terraform plan    # shows: will import aws_s3_bucket.existing
terraform apply   # performs the import
```

**Advantage:** Import intent is in source control — reviewable in PRs.

## Moved Block (Safe Refactor)

When you rename a resource in `.tf`, Terraform treats it as destroy-old + create-new:
```
aws_s3_bucket.old_name  →  (destroy)
aws_s3_bucket.new_name  →  (create new)  ← data loss!
```

The `moved` block prevents this:
```hcl
moved {
  from = aws_s3_bucket.old_name
  to   = aws_s3_bucket.new_name
}
```

Terraform updates state only — no infrastructure changes.

**Also works for:**
- Moving resources into/out of modules: `from = aws_s3_bucket.app` → `to = module.storage.aws_s3_bucket.app`
- Refactoring `count` to `for_each`: `from = aws_s3_bucket.app[0]` → `to = aws_s3_bucket.app["prod"]`

## Workflow for Importing Existing Infrastructure

```bash
# 1. Write matching resource block in .tf
# 2. Import
terraform import aws_s3_bucket.existing bucket-name

# 3. Check for drift
terraform plan
# If plan shows changes, update your .tf to match reality

# 4. Verify zero changes
terraform plan
# Plan: 0 to add, 0 to change, 0 to destroy.
```

## Interview Questions

**Q: What does `terraform import` do?**
> It adds an existing AWS resource to the Terraform state file without creating or modifying it. After import, Terraform tracks and manages the resource.

**Q: What is the `moved` block used for?**
> It tells Terraform that a resource was renamed or moved to a different address in the config. Without it, renaming a resource causes destroy + recreate. The `moved` block updates only the state — no infrastructure changes.

**Q: What is the difference between import via CLI and import block?**
> CLI import (`terraform import`) is imperative — you run it manually. Import blocks (Terraform 1.5+) are declarative — the import intent lives in `.tf` files, is version-controlled, and visible in `terraform plan`.
