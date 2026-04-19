# Examples 2.4 — Remote Backends (50 examples)

---

## Basic

### 1. S3 backend minimal configuration
```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 2. S3 backend with DynamoDB lock table
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

### 3. Backend block structure explained
```hcl
terraform {
  backend "<TYPE>" {
    # Type-specific configuration arguments
    # These are evaluated during init, not apply
    # Cannot use variables or locals here
  }
}
```

### 4. Initialize with remote backend
```bash
terraform init                          # reads backend config from main.tf
terraform init -reconfigure             # force re-init if backend changed
terraform init -migrate-state          # migrate state from current to new backend
terraform init -upgrade                 # upgrade providers AND init backend
```

### 5. Verify backend configuration
```bash
terraform init
# Output:
# Initializing the backend...
# Successfully configured the backend "s3"!
# Terraform will automatically use this backend unless the backend config changes.
```

### 6. Local backend (explicit)
```hcl
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

### 7. Create S3 bucket + DynamoDB table for state
```hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "my-terraform-state-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
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

### 8. S3 backend with profile-based authentication
```hcl
terraform {
  backend "s3" {
    bucket  = "my-terraform-state"
    key     = "app/terraform.tfstate"
    region  = "us-east-1"
    profile = "terraform-state-admin"
  }
}
```

### 9. Check current backend
```bash
terraform providers      # shows current backend and providers
cat .terraform/terraform.tfstate | jq '.backend'
```

### 10. Remove backend config (go back to local)
```bash
# 1. Remove backend block from main.tf
# 2. Run terraform init -migrate-state
# Terraform will ask to copy remote state to local
```

### 11. S3 backend with workspace key prefix
```hcl
terraform {
  backend "s3" {
    bucket               = "my-terraform-state"
    key                  = "app/terraform.tfstate"
    region               = "us-east-1"
    workspace_key_prefix = "environments"
    # workspace state: environments/<workspace>/app/terraform.tfstate
  }
}
```

### 12. View backend configuration
```bash
cat .terraform/terraform.tfstate | python3 -m json.tool
# Shows: backend type, config, hash
```

---

## Intermediate

### 13. Partial backend configuration file
```hcl
# main.tf
terraform {
  backend "s3" {}
}
```
```hcl
# backend.hcl (not committed to VCS)
bucket         = "my-terraform-state"
key            = "app/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
encrypt        = true
```
```bash
terraform init -backend-config=backend.hcl
```

### 14. Per-environment partial backend config
```hcl
# environments/dev.backend.hcl
bucket         = "my-terraform-state"
key            = "environments/dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
```
```hcl
# environments/prod.backend.hcl
bucket         = "my-terraform-state-prod"
key            = "environments/prod/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock-prod"
```
```bash
terraform init -backend-config="environments/${ENV}.backend.hcl"
```

### 15. S3 backend with KMS encryption
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/mrk-abc123def456"
    dynamodb_table = "terraform-state-lock"
  }
}
```

### 16. S3 backend with assume_role (cross-account state)
```hcl
terraform {
  backend "s3" {
    bucket         = "central-terraform-state"
    key            = "app/prod/terraform.tfstate"
    region         = "us-east-1"
    role_arn       = "arn:aws:iam::CENTRAL_ACCOUNT_ID:role/TerraformStateRole"
    external_id    = "terraform-state-access"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### 17. Terraform Cloud backend
```hcl
terraform {
  cloud {
    organization = "my-organization"
    workspaces {
      name = "production-app"
    }
  }
}
```

### 18. Terraform Cloud with multiple workspaces via tags
```hcl
terraform {
  cloud {
    organization = "my-organization"
    workspaces {
      tags = ["app:platform", "env:production"]
    }
  }
}
```

### 19. S3 backend with server-side encryption
```hcl
terraform {
  backend "s3" {
    bucket                   = "my-terraform-state"
    key                      = "app/terraform.tfstate"
    region                   = "us-east-1"
    encrypt                  = true
    # Use bucket default encryption (AES256)
    # kms_key_id not set = uses S3-managed keys
    dynamodb_table           = "terraform-state-lock"
    skip_metadata_api_check  = false
  }
}
```

### 20. Backend init in CI with env vars
```bash
# Inject backend config via environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"

terraform init \
  -backend-config="bucket=my-terraform-state" \
  -backend-config="key=app/${ENVIRONMENT}/terraform.tfstate" \
  -backend-config="dynamodb_table=terraform-state-lock" \
  -backend-config="encrypt=true"
```

### 21. S3 backend bucket policy
```hcl
resource "aws_s3_bucket_policy" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowTerraformRoles"
        Effect    = "Allow"
        Principal = { AWS = var.terraform_role_arns }
        Action    = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
        Resource  = [
          aws_s3_bucket.tfstate.arn,
          "${aws_s3_bucket.tfstate.arn}/*"
        ]
      }
    ]
  })
}
```

### 22. S3 backend with access logging
```hcl
resource "aws_s3_bucket_logging" "tfstate" {
  bucket        = aws_s3_bucket.tfstate.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "tfstate-access/"
}
```

### 23. Backend with IAM permissions for DynamoDB lock
```hcl
data "aws_iam_policy_document" "terraform_state" {
  statement {
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      aws_s3_bucket.tfstate.arn,
      "${aws_s3_bucket.tfstate.arn}/*",
    ]
  }
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [aws_dynamodb_table.tflock.arn]
  }
}
```

### 24. Terraform Cloud: environment variables for sensitive values
```bash
# In TFC workspace > Variables:
# TF_VAR_db_password = "secretpassword" (sensitive)
# AWS_ACCESS_KEY_ID  = "AKIA..."  (env variable)
# AWS_SECRET_ACCESS_KEY = "..."   (env variable, sensitive)
```

### 25. S3 backend with custom endpoint (for VPC scenarios)
```hcl
terraform {
  backend "s3" {
    bucket          = "my-terraform-state"
    key             = "app/terraform.tfstate"
    region          = "us-east-1"
    endpoint        = "https://vpce-xxx.s3.us-east-1.vpce.amazonaws.com"
    force_path_style = true
  }
}
```

---

## Nested

### 26. Multi-stack state architecture
```bash
# State organization for large projects:
my-terraform-state/
├── global/
│   ├── iam/terraform.tfstate
│   └── route53/terraform.tfstate
├── shared-services/
│   ├── networking/terraform.tfstate
│   └── security/terraform.tfstate
├── environments/
│   ├── dev/
│   │   ├── app/terraform.tfstate
│   │   └── data/terraform.tfstate
│   └── prod/
│       ├── app/terraform.tfstate
│       └── data/terraform.tfstate
```

### 27. Cross-stack remote state reference
```hcl
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "shared-services/networking/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "iam" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "global/iam/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_ecs_task_definition" "app" {
  # ...
  task_role_arn      = data.terraform_remote_state.iam.outputs.app_task_role_arn
  execution_role_arn = data.terraform_remote_state.iam.outputs.ecs_execution_role_arn
  network_mode       = "awsvpc"
}
```

### 28. S3 backend with replication for DR
```hcl
resource "aws_s3_bucket_replication_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  role   = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-state"
    status = "Enabled"
    filter { prefix = "" }
    destination {
      bucket        = "arn:aws:s3:::my-terraform-state-dr-us-west-2"
      storage_class = "STANDARD_IA"
    }
    delete_marker_replication { status = "Enabled" }
  }
}
```

### 29. Backend config in CI using Vault
```bash
# Use HashiCorp Vault to fetch backend credentials
VAULT_ROLE="terraform-state"
CREDS=$(vault write -f aws/sts/${VAULT_ROLE})
export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.data.access_key')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.data.secret_key')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.data.security_token')

terraform init -backend-config=backend.hcl
terraform apply
```

### 30. Terraform Cloud run triggers between workspaces
```hcl
resource "tfe_workspace" "network" {
  name         = "production-network"
  organization = "my-org"
}

resource "tfe_workspace" "app" {
  name         = "production-app"
  organization = "my-org"
}

resource "tfe_run_trigger" "app_depends_network" {
  workspace_id  = tfe_workspace.app.id
  sourceable_id = tfe_workspace.network.id
  # app workspace runs after network workspace
}
```

### 31. Backend state for multiple modules sharing outputs
```hcl
# Module A outputs
output "vpc_id"         { value = aws_vpc.main.id }
output "subnet_ids"     { value = aws_subnet.private[*].id }
output "security_group" { value = aws_security_group.app.id }

# Module B references
data "terraform_remote_state" "a" {
  backend = "s3"
  config = { bucket = var.state_bucket; key = "module-a/terraform.tfstate"; region = var.region }
}

locals {
  vpc_id    = data.terraform_remote_state.a.outputs.vpc_id
  subnet_ids = data.terraform_remote_state.a.outputs.subnet_ids
}
```

### 32. Backend migration procedure
```bash
# Migrate from local to S3 backend
# Step 1: Copy current state
cp terraform.tfstate terraform.tfstate.backup

# Step 2: Add S3 backend block to main.tf

# Step 3: Init with migration
terraform init -migrate-state
# Terraform will ask: "Do you want to copy existing state to the new backend? (yes/no)"
# Answer: yes

# Step 4: Verify
terraform state list  # should show all existing resources

# Step 5: Delete local state (optional)
rm terraform.tfstate terraform.tfstate.backup
```

### 33. Backend with MFA delete enabled on S3
```hcl
# MFA delete requires root account or MFA-authenticated API call
# Enable via CLI (not Terraform):
aws s3api put-bucket-versioning \
  --bucket my-terraform-state \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/root-device TOKENCODE"
```

### 34. Backend state for ephemeral environments
```hcl
# PR environments use workspace with cleanup
variable "pr_number" {
  type = string
}

terraform {
  backend "s3" {
    bucket               = "my-terraform-state"
    key                  = "pr-envs/terraform.tfstate"
    region               = "us-east-1"
    workspace_key_prefix = "pr"
  }
}
# State path: pr/pr-456/pr-envs/terraform.tfstate
```

---

## Advanced

### 35. Force-unlock stuck state
```bash
# Identify lock ID from error message or DynamoDB
aws dynamodb get-item \
  --table-name terraform-state-lock \
  --key '{"LockID": {"S": "my-terraform-state/app/terraform.tfstate"}}' \
  --query 'Item.Info.S' \
  --output text | python3 -c "import sys, json; d = json.load(sys.stdin); print(d['ID'])"

# Force unlock
terraform force-unlock <LOCK_ID>
```

### 36. State locking behavior deep-dive
```bash
# Lock is acquired at start of plan/apply/destroy
# Stored in DynamoDB with:
#   LockID (hash key)
#   Info (JSON with: ID, Operation, Who, Version, Created, Path)

# Lock is automatically released when operation completes
# Stays locked if process is killed → use force-unlock after investigation

# Check lock status
aws dynamodb scan --table-name terraform-state-lock
```

### 37. Backend state encryption at rest (full setup)
```hcl
resource "aws_kms_key" "tfstate" {
  description             = "Terraform state KMS key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnableRootAccess"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "AllowTerraformRole"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.terraform.arn }
        Action    = ["kms:GenerateDataKey", "kms:Decrypt"]
        Resource  = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "tfstate" {
  name          = "alias/terraform-state"
  target_key_id = aws_kms_key.tfstate.key_id
}
```

### 38. Terraform Cloud: API token management
```bash
# Create team token in TFC
curl -X POST \
  -H "Authorization: Bearer $TFC_USER_TOKEN" \
  -H "Content-Type: application/vnd.api+json" \
  -d '{"data":{"type":"authentication-tokens","attributes":{"description":"CI/CD token"}}}' \
  "https://app.terraform.io/api/v2/teams/$TEAM_ID/authentication-tokens"

# Store as TF_TOKEN_app_terraform_io in CI env vars
```

### 39. State isolation between accounts
```hcl
# Each AWS account gets its own state bucket
# Account: 111111111111 (dev)
terraform {
  backend "s3" {
    bucket  = "tf-state-111111111111"
    key     = "app/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    dynamodb_table = "tf-state-lock"
  }
}

# Account: 222222222222 (prod)
terraform {
  backend "s3" {
    bucket  = "tf-state-222222222222"
    key     = "app/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    dynamodb_table = "tf-state-lock"
  }
}
```

### 40. Backend with OIDC (GitHub Actions → AWS)
```yaml
# .github/workflows/terraform.yml
jobs:
  apply:
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: us-east-1
      - run: |
          terraform init \
            -backend-config="bucket=my-terraform-state" \
            -backend-config="key=app/${{ github.ref_name }}/terraform.tfstate" \
            -backend-config="region=us-east-1"
          terraform apply -auto-approve
```

### 41. Backend state for Terraform Enterprise (private install)
```hcl
terraform {
  backend "remote" {
    hostname     = "terraform.example.com"
    organization = "my-organization"
    workspaces {
      name = "production"
    }
  }
}
```

### 42. Inspect and repair corrupted state
```bash
# Backup state
terraform state pull > corrupted.tfstate

# Check validity
python3 -c "import json,sys; json.load(open('corrupted.tfstate')); print('Valid JSON')"

# View resource count
jq '.resources | length' corrupted.tfstate

# Remove problematic resource from state (if needed)
terraform state rm 'aws_instance.broken'

# Re-import if resource still exists in AWS
terraform import aws_instance.web i-1234567890abcdef0
```

### 43. S3 backend with VPC endpoint
```hcl
# Create S3 VPC endpoint so Terraform running in VPC can reach state bucket
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  route_table_ids = [aws_route_table.private.id]
}

# S3 bucket policy: require VPC endpoint
resource "aws_s3_bucket_policy" "tfstate_vpce" {
  bucket = aws_s3_bucket.tfstate.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "RequireVPCEndpoint"
      Effect = "Deny"
      Principal = { AWS = "*" }
      Action = ["s3:GetObject", "s3:PutObject"]
      Resource = ["${aws_s3_bucket.tfstate.arn}/*"]
      Condition = {
        StringNotEquals = {
          "aws:sourceVpce" = aws_vpc_endpoint.s3.id
        }
      }
    }]
  })
}
```

### 44. Terraform Cloud: dynamic provider credentials (OIDC)
```hcl
# In Terraform Cloud workspace, set:
# TFC_AWS_PROVIDER_AUTH = "true"
# TFC_AWS_RUN_ROLE_ARN = "arn:aws:iam::123456789012:role/TFCRole"

# No static credentials needed in provider block
provider "aws" {
  region = "us-east-1"
  # TFC injects credentials automatically via OIDC
}
```

### 45. Automated state bucket bootstrapping
```bash
#!/bin/bash
# Bootstrap script: create state infrastructure before running Terraform
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
BUCKET="tf-state-${ACCOUNT_ID}-${REGION}"
TABLE="tf-state-lock-${ACCOUNT_ID}"

# Create bucket
aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'

# Create DynamoDB table
aws dynamodb create-table --table-name "$TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION"

echo "Backend infrastructure ready. Use:"
echo "bucket = \"$BUCKET\""
echo "dynamodb_table = \"$TABLE\""
```

### 46. Recover from deleted state lock table
```bash
# If DynamoDB table is deleted while state exists:
# 1. Create new table with same name
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 2. Re-initialize Terraform
terraform init -reconfigure

# 3. Verify state is intact
terraform state list
```

### 47. Monitor state lock duration
```bash
# Alarm if a lock is held for more than 30 minutes (stuck apply)
aws cloudwatch put-metric-alarm \
  --alarm-name "TerraformStateLockStuck" \
  --metric-name "SuccessfulRequestLatency" \
  --namespace "AWS/DynamoDB" \
  --dimensions Name=TableName,Value=terraform-state-lock \
  --period 1800 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --statistic Maximum \
  --alarm-actions "arn:aws:sns:us-east-1:123456789012:ops-alerts"
```

### 48. Cross-region backend redundancy
```bash
# Primary backend: us-east-1
# Replica (read-only DR):  us-west-2

# Use S3 Cross-Region Replication (CRR) for state bucket
# Use DynamoDB Global Tables for lock table

resource "aws_dynamodb_table" "tflock" {
  name           = "terraform-state-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute { name = "LockID"; type = "S" }

  replica {
    region_name = "us-west-2"
  }
}
```

### 49. State validation in CI pipeline
```bash
# Validate state is not empty before allowing apply
check_state() {
  COUNT=$(terraform state list 2>/dev/null | wc -l)
  if [ "$COUNT" -eq 0 ] && [ "$ALLOW_EMPTY_STATE" != "true" ]; then
    echo "ERROR: State is empty. This might indicate a misconfigured backend."
    exit 1
  fi
  echo "State has $COUNT resources."
}

terraform init
check_state
terraform plan -out=plan.out
terraform apply plan.out
```

### 50. Complete production backend setup
```hcl
# Complete state backend with all security best practices

# 1. KMS key
resource "aws_kms_key" "tfstate" {
  description             = "Terraform state encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  multi_region            = true
}

# 2. S3 bucket with all protections
resource "aws_s3_bucket" "tfstate" {
  bucket = "tf-state-${data.aws_caller_identity.current.account_id}"
  lifecycle { prevent_destroy = true }
}
resource "aws_s3_bucket_versioning" "tfstate"      { bucket = aws_s3_bucket.tfstate.id; versioning_configuration { status = "Enabled" } }
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  block_public_acls = true; block_public_policy = true
  ignore_public_acls = true; restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule { apply_server_side_encryption_by_default { kms_master_key_id = aws_kms_key.tfstate.arn; sse_algorithm = "aws:kms" } }
}
resource "aws_s3_bucket_replication_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id; role = aws_iam_role.replication.arn
  rule { id = "dr"; status = "Enabled"; filter { prefix = "" }
    destination { bucket = aws_s3_bucket.tfstate_replica.arn; storage_class = "STANDARD_IA" } }
}

# 3. DynamoDB lock table
resource "aws_dynamodb_table" "tflock" {
  name = "tf-state-lock"; billing_mode = "PAY_PER_REQUEST"; hash_key = "LockID"
  attribute { name = "LockID"; type = "S" }
  server_side_encryption { enabled = true; kms_key_arn = aws_kms_key.tfstate.arn }
  lifecycle { prevent_destroy = true }
}
```
