# Examples 1.5 — Terraform State (50 examples)

---

## Basic

### 1. Local backend (default)
```hcl
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

### 2. Minimal S3 backend
```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 3. S3 backend with DynamoDB state locking
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### 4. Create the S3 bucket and DynamoDB table for state
```hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "my-terraform-state"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "tflock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### 5. terraform state list
```bash
terraform state list                    # list all resources in state
terraform state list aws_instance.*    # filter by resource type
terraform state list module.vpc.*      # filter by module
```

### 6. terraform state show
```bash
terraform state show aws_instance.web          # show a single resource
terraform state show 'module.vpc.aws_vpc.main' # show a module resource
```

### 7. terraform state mv (rename/move resource)
```bash
# Rename a resource
terraform state mv aws_instance.old_name aws_instance.new_name

# Move resource into a module
terraform state mv aws_vpc.main module.vpc.aws_vpc.main
```

### 8. terraform state rm (remove from state without destroying)
```bash
# Remove a resource from state (does NOT delete from AWS)
terraform state rm aws_instance.web
terraform state rm 'module.legacy.aws_s3_bucket.data'
```

### 9. terraform import (bring existing resource under management)
```bash
# Import an existing EC2 instance
terraform import aws_instance.web i-1234567890abcdef0

# Import an S3 bucket
terraform import aws_s3_bucket.main my-existing-bucket
```

### 10. terraform refresh (sync state with real infrastructure)
```bash
terraform refresh              # deprecated in 0.15+
terraform apply -refresh-only  # modern equivalent — review drift without changing infra
```

### 11. View raw state file (for debugging)
```bash
cat terraform.tfstate | jq '.resources[] | {type: .type, name: .name}'
```

### 12. terraform state pull / push
```bash
terraform state pull > backup.tfstate    # pull remote state locally
# (edit if needed)
terraform state push backup.tfstate      # push back (dangerous — use carefully)
```

---

## Intermediate

### 13. Partial backend configuration (init-time injection)
```hcl
# main.tf — no credentials in source code
terraform {
  backend "s3" {}
}
```
```bash
# backend.hcl — kept outside VCS or injected in CI
bucket         = "my-terraform-state"
key            = "app/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
encrypt        = true

terraform init -backend-config=backend.hcl
```

### 14. Backend config via CLI flags
```bash
terraform init \
  -backend-config="bucket=my-terraform-state" \
  -backend-config="key=app/prod/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=terraform-state-lock"
```

### 15. Multi-environment state isolation (same bucket, different keys)
```bash
# Development
terraform init -backend-config="key=app/dev/terraform.tfstate"

# Staging
terraform init -backend-config="key=app/staging/terraform.tfstate"

# Production
terraform init -backend-config="key=app/prod/terraform.tfstate"
```

### 16. terraform_remote_state data source
```hcl
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "network/vpc/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  ami       = data.aws_ami.app.id
  subnet_id = data.terraform_remote_state.vpc.outputs.private_subnet_ids[0]
}
```

### 17. Sensitive output — stored encrypted in state
```hcl
output "db_password" {
  value     = aws_db_instance.main.password
  sensitive = true
}
# State still stores the raw value — protect S3 bucket access accordingly
```

### 18. Backend reconfiguration
```bash
# Force re-initialization with different backend config
terraform init -reconfigure

# Migrate state to new backend
terraform init -migrate-state
```

### 19. Workspace-based state key path
```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app/terraform.tfstate"  # workspaces prefix: env:/<workspace>/app/terraform.tfstate
    region = "us-east-1"
  }
}
```
```bash
terraform workspace new staging
terraform workspace select staging
terraform apply  # state stored at env:/staging/app/terraform.tfstate
```

### 20. S3 backend with KMS encryption
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/mrk-abc123"
    dynamodb_table = "terraform-state-lock"
  }
}
```

### 21. State file structure (conceptual)
```json
{
  "version": 4,
  "terraform_version": "1.6.6",
  "serial": 42,
  "lineage": "abc123...",
  "outputs": {
    "vpc_id": { "value": "vpc-0abc123", "type": "string" }
  },
  "resources": [
    {
      "module": "module.vpc",
      "mode": "managed",
      "type": "aws_vpc",
      "name": "main",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [{ "attributes": { "id": "vpc-0abc123", "cidr_block": "10.0.0.0/16" } }]
    }
  ]
}
```

### 22. Force-unlock stuck state
```bash
# When apply is interrupted and lock remains
terraform force-unlock <LOCK_ID>

# Get lock ID from error message or:
aws dynamodb get-item \
  --table-name terraform-state-lock \
  --key '{"LockID": {"S": "my-terraform-state/app/terraform.tfstate"}}'
```

### 23. Import multiple resources via for loop (script)
```bash
#!/bin/bash
# Import all existing EC2 instances by tag
aws ec2 describe-instances \
  --filters "Name=tag:ManagedBy,Values=terraform" \
  --query 'Reservations[].Instances[].InstanceId' \
  --output text | tr '\t' '\n' | while read -r id; do
    terraform import "aws_instance.web[\"$id\"]" "$id"
done
```

### 24. S3 backend with server-side encryption (AES256)
```hcl
terraform {
  backend "s3" {
    bucket                      = "my-terraform-state"
    key                         = "app/terraform.tfstate"
    region                      = "us-east-1"
    encrypt                     = true
    server_side_encryption_configuration = "AES256"
    dynamodb_table              = "terraform-state-lock"
  }
}
```

### 25. S3 bucket policy: restrict state bucket access
```hcl
data "aws_iam_policy_document" "state_bucket" {
  statement {
    sid    = "DenyNonTLS"
    effect = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.tfstate.arn,
      "${aws_s3_bucket.tfstate.arn}/*",
    ]
    principals { type = "*"; identifiers = ["*"] }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid     = "AllowTerraformRoles"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.tfstate.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.terraform.arn]
    }
  }
}
```

---

## Nested

### 26. Cross-stack remote state reference
```hcl
# Stack 1 (network) outputs
output "vpc_id" {
  value = aws_vpc.main.id
}
output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

# Stack 2 (application) consumes network state
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "network/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "security" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "security/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_ecs_service" "app" {
  # ...
  network_configuration {
    subnets         = data.terraform_remote_state.network.outputs.private_subnet_ids
    security_groups = [data.terraform_remote_state.security.outputs.app_sg_id]
  }
}
```

### 27. State in CI/CD pipeline with OIDC auth
```hcl
# GitHub Actions job — no stored credentials
terraform {
  backend "s3" {
    bucket         = "ci-terraform-state"
    key            = "app/${var.environment}/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    role_arn       = "arn:aws:iam::123456789012:role/GithubActionsRole"
  }
}
```

### 28. Multi-account state isolation
```bash
# Per account, per environment state paths
s3://my-terraform-state/
├── accounts/
│   ├── dev/
│   │   ├── network/terraform.tfstate
│   │   ├── app/terraform.tfstate
│   │   └── data/terraform.tfstate
│   ├── staging/
│   │   └── ...
│   └── prod/
│       └── ...
```

### 29. State manipulation: split a large state file
```bash
# Extract module resources to new state file
terraform state pull > full.tfstate

# Remove module from old state (no destroy)
terraform state rm 'module.database'

# In new database stack:
# terraform import each database resource
```

### 30. State with sensitive nested attributes (handling)
```hcl
# Terraform stores all resource attributes in state, including secrets.
# Protect state access with:
# 1. S3 bucket policy (deny public access)
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. Enable versioning for recovery
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

# 3. Enable logging
resource "aws_s3_bucket_logging" "tfstate" {
  bucket        = aws_s3_bucket.tfstate.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "tfstate-access/"
}
```

### 31. State drift detection workflow
```bash
# Check for drift without making changes
terraform plan -refresh-only -out=drift.plan

# Review drift
terraform show drift.plan

# Accept drift (update state to match reality)
terraform apply drift.plan

# Reject drift (will fix next apply)
rm drift.plan
terraform apply  # will make AWS match config
```

### 32. Import block (Terraform 1.5+ declarative import)
```hcl
import {
  to = aws_instance.web
  id = "i-1234567890abcdef0"
}

import {
  to = aws_s3_bucket.main
  id = "my-existing-bucket"
}

resource "aws_instance" "web" {
  # Terraform generates this block with terraform plan -generate-config-out=generated.tf
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}
```

### 33. State backend with access logging and encryption
```hcl
# Complete state backend setup
resource "aws_kms_key" "tfstate" {
  description             = "Terraform state encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "my-terraform-state-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tfstate.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}
```

### 34. Moved block (Terraform 1.1+ refactoring)
```hcl
# Rename a resource without destroying/recreating
moved {
  from = aws_instance.server
  to   = aws_instance.web
}

# Move resource into a module
moved {
  from = aws_vpc.main
  to   = module.network.aws_vpc.main
}
```

---

## Advanced

### 35. S3 backend with assume_role for cross-account state
```hcl
terraform {
  backend "s3" {
    bucket         = "central-terraform-state"
    key            = "app/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
    role_arn       = "arn:aws:iam::CENTRAL_ACCOUNT:role/TerraformStateRole"
    external_id    = "my-terraform-state-access"
  }
}
```

### 36. State migration between backends
```bash
# Step 1: Remove current backend config from main.tf
# Step 2: Init with local backend
terraform init -migrate-state

# Step 3: Add new backend config
# Step 4: Init again with new backend
terraform init -migrate-state

# Terraform will prompt to copy state
```

### 37. Terraform state schema version inspection
```bash
# Check state format version
terraform state pull | jq '{version: .version, tf_version: .terraform_version, serial: .serial, resources: (.resources | length)}'
```

### 38. State backend with replication (DR)
```hcl
resource "aws_s3_bucket_replication_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "replicate-tfstate"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.tfstate_replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### 39. Prevent accidental state destruction
```hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "my-terraform-state"

  lifecycle {
    prevent_destroy = true  # Terraform will error if you try to destroy this
  }
}

resource "aws_dynamodb_table" "tflock" {
  name = "terraform-state-lock"

  lifecycle {
    prevent_destroy = true
  }
}
```

### 40. State workspace automation in CI
```bash
#!/bin/bash
ENVIRONMENT=${1:-dev}

# Select or create workspace
terraform workspace select "$ENVIRONMENT" 2>/dev/null || terraform workspace new "$ENVIRONMENT"

# Plan and apply
terraform plan -out="${ENVIRONMENT}.plan"
terraform apply "${ENVIRONMENT}.plan"
```

### 41. State lineage and serial tracking
```bash
# Each apply increments the serial number
# Lineage is a UUID set at backend init — mismatched lineage will be rejected

# Check lineage of two state files
LOCAL_LINEAGE=$(cat terraform.tfstate | jq -r '.lineage')
REMOTE_LINEAGE=$(terraform state pull | jq -r '.lineage')

if [ "$LOCAL_LINEAGE" != "$REMOTE_LINEAGE" ]; then
  echo "State lineage mismatch — do NOT push"
fi
```

### 42. Sensitive values: separate state per tier
```bash
# Keep secrets in isolated state files:
# secrets/terraform.tfstate    — only credentials, KMS keys
# network/terraform.tfstate    — VPC, subnets
# app/terraform.tfstate        — EC2, ECS (references secrets + network via remote_state)
# database/terraform.tfstate   — RDS (references network)
```

### 43. Replace resource in state (force recreation)
```bash
# Terraform 0.15+: replace specific resource
terraform apply -replace="aws_instance.web"

# Old way (deprecated):
terraform taint aws_instance.web
terraform apply
```

### 44. State inspection with jq for auditing
```bash
# List all resource types in state
terraform state pull | jq '[.resources[].type] | unique | sort[]'

# Find all resources with a specific tag
terraform state pull | jq '.resources[].instances[].attributes | select(.tags.Environment == "prod") | .id'
```

### 45. DynamoDB table with TTL for state lock expiry
```hcl
resource "aws_dynamodb_table" "tflock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  ttl {
    attribute_name = "Expiry"
    enabled        = true
  }

  server_side_encryption {
    enabled = true
  }
}
```

### 46. State bucket: block public access + deny HTTP
```hcl
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "deny_http" {
  bucket = aws_s3_bucket.tfstate.id
  policy = data.aws_iam_policy_document.deny_http.json
}

data "aws_iam_policy_document" "deny_http" {
  statement {
    sid     = "DenyHTTP"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.tfstate.arn,
      "${aws_s3_bucket.tfstate.arn}/*",
    ]
    principals { type = "*"; identifiers = ["*"] }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}
```

### 47. Recover state from S3 versioning
```bash
# List previous versions of state file
aws s3api list-object-versions \
  --bucket my-terraform-state \
  --prefix app/terraform.tfstate \
  --query 'Versions[*].{VersionId:VersionId,LastModified:LastModified}'

# Restore specific version
aws s3api get-object \
  --bucket my-terraform-state \
  --key app/terraform.tfstate \
  --version-id "abc123" \
  restored.tfstate

terraform state push restored.tfstate
```

### 48. State locking with custom timeout
```bash
terraform apply -lock-timeout=5m   # wait up to 5 min for lock
terraform apply -lock=false         # skip locking (dangerous in teams)
```

### 49. Terraform Cloud as state backend
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "production-app"
    }
  }
}
```

### 50. Complete state infrastructure module
```hcl
# modules/terraform-state/main.tf
resource "aws_s3_bucket" "state" {
  bucket = "tf-state-${var.account_id}-${var.region}"
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.state.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "lock" {
  name         = "tf-state-lock-${var.account_id}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute { name = "LockID"; type = "S" }
  lifecycle { prevent_destroy = true }
}

resource "aws_kms_key" "state" {
  description             = "Terraform state encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}
```
