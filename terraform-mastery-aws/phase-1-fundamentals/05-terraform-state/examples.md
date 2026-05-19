# Examples 1.5 — Terraform State (50 examples)

> **Topic Overview:** Terraform state is the source of truth that maps your configuration to real infrastructure. It stores resource IDs, metadata, and attribute values so Terraform knows what exists and what needs to change. In production, state must be stored remotely (S3 + DynamoDB), encrypted at rest, and access-controlled — because state files contain secrets in plaintext. Understanding state commands, locking, drift detection, and safe manipulation is essential for operating Terraform in teams.

---

## Basic

### 1. Local backend (default)

> The default backend stores state in `terraform.tfstate` in the working directory. Fine for learning or solo projects, but never use this in teams — there's no locking, no versioning, and no encryption. If you delete the file, you lose track of all managed infrastructure.

```hcl
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

### 2. Minimal S3 backend

> The minimal S3 backend stores state remotely so teams can share it. Without `dynamodb_table`, there's no locking — two engineers running `apply` simultaneously can corrupt the state file. Always add locking in real environments.

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

> This is the production-standard AWS backend. `dynamodb_table` provides distributed locking — Terraform writes a lock record before any state-modifying operation and deletes it when done. `encrypt = true` enables S3 server-side encryption (AES256 by default). Use this pattern for all team/production workloads.

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

> A chicken-and-egg problem: the resources that hold your state can't themselves be managed by state. Create the S3 bucket and DynamoDB table manually (or with a bootstrap workspace that uses local state), then reference them in your backend config. Enable versioning on the bucket — it's your only recovery mechanism if state gets corrupted.

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

> `terraform state list` shows all resources currently tracked in state. Use glob patterns to narrow results. This is your first debugging command when something looks wrong — it shows exactly what Terraform knows about.

```bash
terraform state list                    # list all resources in state
terraform state list aws_instance.*    # filter by resource type
terraform state list module.vpc.*      # filter by module
```

### 6. terraform state show

> `terraform state show` displays all stored attributes of a single resource — the same data Terraform uses to compute diffs. Useful for debugging "why does Terraform want to change this?" — compare the state attributes against your config.

```bash
terraform state show aws_instance.web          # show a single resource
terraform state show 'module.vpc.aws_vpc.main' # show a module resource
```

### 7. terraform state mv (rename/move resource)

> `terraform state mv` renames or moves a resource address in state without touching the real infrastructure. Use this when you refactor HCL — rename a resource, reorganize modules — to prevent destroy/recreate cycles. Always run `terraform plan` after to confirm no unintended changes.

```bash
# Rename a resource
terraform state mv aws_instance.old_name aws_instance.new_name

# Move resource into a module
terraform state mv aws_vpc.main module.vpc.aws_vpc.main
```

### 8. terraform state rm (remove from state without destroying)

> `terraform state rm` removes a resource from state tracking WITHOUT deleting the real resource in AWS. Use this when you want to "adopt" a resource into a different stack, stop managing it with Terraform, or remove orphaned entries. The resource still exists in AWS — Terraform just forgets about it.

```bash
# Remove a resource from state (does NOT delete from AWS)
terraform state rm aws_instance.web
terraform state rm 'module.legacy.aws_s3_bucket.data'
```

### 9. terraform import (bring existing resource under management)

> `terraform import` is the reverse of `state rm` — it pulls an existing AWS resource into Terraform state. You still need to write the matching HCL resource block manually (or use `terraform plan -generate-config-out` in Terraform 1.5+). Common use: adopting manually-created resources into IaC.

```bash
# Import an existing EC2 instance
terraform import aws_instance.web i-1234567890abcdef0

# Import an S3 bucket
terraform import aws_s3_bucket.main my-existing-bucket
```

### 10. terraform refresh (sync state with real infrastructure)

> `terraform refresh` (deprecated) updated state to reflect real infrastructure without making config changes. The modern equivalent is `terraform apply -refresh-only` — it shows you a plan of state updates and lets you approve before applying. Use this to detect drift.

```bash
terraform refresh              # deprecated in 0.15+
terraform apply -refresh-only  # modern equivalent — review drift without changing infra
```

### 11. View raw state file (for debugging)

> The state file is plain JSON. Inspecting it with `jq` is useful for auditing, debugging, or scripting. In production use `terraform state pull | jq ...` instead of reading the file directly, as it works with both local and remote backends.

```bash
cat terraform.tfstate | jq '.resources[] | {type: .type, name: .name}'
```

### 12. terraform state pull / push

> `state pull` downloads the remote state to stdout — useful for inspection or backup. `state push` uploads a local state file to the remote backend. Push is dangerous: it bypasses locking and can overwrite newer state. Only use it for recovery scenarios, never in normal workflows.

```bash
terraform state pull > backup.tfstate    # pull remote state locally
# (edit if needed)
terraform state push backup.tfstate      # push back (dangerous — use carefully)
```

---

## Intermediate

### 13. Partial backend configuration (init-time injection)

> Partial backend config is the recommended pattern for CI/CD. The `main.tf` has an empty `backend "s3" {}` block — no credentials, no bucket names, nothing sensitive. The actual config is injected at `terraform init` time via `-backend-config=backend.hcl`. This keeps secrets out of source control and allows reusing the same code across environments.

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

> Individual `-backend-config` flags on the CLI are equivalent to a backend config file. Useful in CI pipelines where configuration is assembled from environment variables. Each flag is `"key=value"` — all passed to `terraform init`.

```bash
terraform init \
  -backend-config="bucket=my-terraform-state" \
  -backend-config="key=app/prod/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=terraform-state-lock"
```

### 15. Multi-environment state isolation (same bucket, different keys)

> Isolating environments by S3 key path is the simplest multi-environment pattern. All environments share one bucket but have completely separate state files. A `terraform destroy` in `dev` cannot touch `prod` state. Use distinct IAM policies per key prefix for additional isolation.

```bash
# Development
terraform init -backend-config="key=app/dev/terraform.tfstate"

# Staging
terraform init -backend-config="key=app/staging/terraform.tfstate"

# Production
terraform init -backend-config="key=app/prod/terraform.tfstate"
```

### 16. terraform_remote_state data source

> `terraform_remote_state` reads outputs from another stack's state file. This is the standard way to share values between independent Terraform stacks — the VPC stack exposes `private_subnet_ids`, and the app stack reads them. The consuming stack has read-only access to the producing stack's state.

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

> Marking an output `sensitive = true` hides it in plan/apply terminal output but does NOT prevent Terraform from storing it in state. The raw value is always in the state file. This is why state bucket access control and encryption are critical — anyone who can read the state file can read all sensitive values.

```hcl
output "db_password" {
  value     = aws_db_instance.main.password
  sensitive = true
}
# State still stores the raw value — protect S3 bucket access accordingly
```

### 18. Backend reconfiguration

> `-reconfigure` re-initializes without migrating state — use it when you change backend type and want to start fresh. `-migrate-state` copies state from the old backend to the new one. Terraform prompts before migrating. Always take a manual backup before any backend reconfiguration.

```bash
# Force re-initialization with different backend config
terraform init -reconfigure

# Migrate state to new backend
terraform init -migrate-state
```

### 19. Workspace-based state key path

> When using S3 backend with workspaces, Terraform automatically stores workspace state at `env:/<workspace>/<key>`. The default workspace uses the key as-is. This is convenient but be aware: all workspaces share the same bucket and DynamoDB table, so IAM isolation between workspaces requires careful key prefix policies.

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

> Specifying `kms_key_id` uses your own KMS key (CMK) instead of the S3-managed key. This gives you key rotation control, audit logs via CloudTrail, and the ability to revoke access by disabling the key. Use a Multi-Region Key (MRK, prefixed `mrk-`) if you need cross-region DR for the state bucket.

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

> The state file is JSON with version 4 format. Key fields: `serial` increments on every apply (Terraform uses it to detect conflicts), `lineage` is a UUID set at init (mismatched lineage causes push to be rejected), and `resources` maps each resource to its real-world attributes. Understanding this structure helps when debugging or writing automation scripts.

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

> When a Terraform process is killed mid-apply, the DynamoDB lock record remains. `terraform force-unlock <LOCK_ID>` removes it. Get the lock ID from the error message Terraform shows, or query DynamoDB directly. Only force-unlock when you're certain no other process is running — unlocking a live operation will corrupt state.

```bash
# When apply is interrupted and lock remains
terraform force-unlock <LOCK_ID>

# Get lock ID from error message or:
aws dynamodb get-item \
  --table-name terraform-state-lock \
  --key '{"LockID": {"S": "my-terraform-state/app/terraform.tfstate"}}'
```

### 23. Import multiple resources via for loop (script)

> Batch importing is common when adopting existing infrastructure. This script finds EC2 instances tagged `ManagedBy=terraform` and imports each one. Note: you must also have the corresponding `aws_instance` resource block in HCL before importing. Use `for_each` on the resource with imported IDs as keys for a clean result.

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

> `encrypt = true` with no `kms_key_id` uses AES256 (S3-managed keys). This satisfies basic compliance requirements. For stricter security requirements (HIPAA, FedRAMP, SOC2) use KMS with CMK as in example 20 to get key control and CloudTrail audit logs.

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

> This bucket policy enforces two controls: deny all non-HTTPS requests (`DenyNonTLS` — prevents credential sniffing in transit), and allow only the designated Terraform IAM role to read/write state objects. Combine with public access block, versioning, and access logging for a complete hardened state bucket.

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

> The cross-stack pattern separates infrastructure concerns into independently deployable stacks. Here the app stack reads `private_subnet_ids` from the network stack and `app_sg_id` from the security stack — both via `terraform_remote_state`. This creates a loose coupling: network team can update subnets without touching app code, and vice versa.

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

> In CI/CD, using `role_arn` in the backend config means GitHub Actions assumes an IAM role via OIDC — no stored AWS credentials in GitHub secrets. The role is granted S3 read/write and DynamoDB read/write permissions scoped to the specific state key. This is the most secure CI/CD state pattern available on AWS.

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

> In a multi-account AWS organization, each account gets its own folder in the state bucket. Alternatively, each account can have its own state bucket (stronger isolation). The key structure shown here keeps prod state completely separate from dev — a compromised dev role cannot read prod state. IAM bucket policies enforce these boundaries.

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

> As monorepos grow, state files become large and apply times increase. Splitting state means extracting a module's resources into its own stack. The process: pull state → `state rm` the module from the old stack → `terraform import` each resource into the new stack. The `moved` block (example 34) handles simpler in-state renames without this multi-step process.

```bash
# Extract module resources to new state file
terraform state pull > full.tfstate

# Remove module from old state (no destroy)
terraform state rm 'module.database'

# In new database stack:
# terraform import each database resource
```

### 30. State with sensitive nested attributes (handling)

> Terraform state contains every resource attribute in plaintext — including RDS passwords, secret values, and private keys. Three controls are essential: block public S3 access (prevents accidental public exposure), enable versioning (enables recovery), and enable access logging (audit trail for compliance). Never allow developer laptops to have direct S3 PutObject permission to the state bucket.

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

> Drift happens when infrastructure is changed outside of Terraform (manual console changes, other tools). `terraform plan -refresh-only` detects drift without modifying infrastructure. You then choose: accept the drift (apply the refresh-only plan, updating state to match reality) or reject it (run a regular `apply` to bring AWS back into alignment with your config).

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

> The `import` block (Terraform 1.5+) is the declarative alternative to the `terraform import` CLI command. Declare what to import in HCL, then run `terraform plan -generate-config-out=generated.tf` to auto-generate the matching resource configuration. After importing, remove the `import` block. This is far cleaner than scripting multiple CLI import commands.

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

> This is the production-grade state bucket setup: a dedicated KMS CMK with rotation enabled, bucket name includes account ID for global uniqueness, and server-side encryption configured to use KMS with `bucket_key_enabled = true` (reduces KMS API call costs by ~99% for large state files with many objects).

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

> The `moved` block is the safest way to rename or reorganize resources in HCL. Terraform sees the `moved` declaration and updates state addresses without destroying and recreating anything. Without it, renaming `aws_instance.server` to `aws_instance.web` would cause a destroy + create cycle. Keep `moved` blocks in your code until all team members have applied the change.

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

> Cross-account state access uses `role_arn` in the backend — Terraform's AWS credentials assume this role to access the central state bucket in a separate account. The `external_id` adds an extra security check (prevents confused deputy attacks). The pattern: a central tooling account holds state, application accounts assume a role into it.

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

> Migrating state between backends is a four-step process: remove backend config → init to local → add new backend config → init with `-migrate-state`. Terraform interactively asks to copy state. Always take a manual backup before migration. Common scenario: migrating from S3 to Terraform Cloud, or from one S3 bucket to another.

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

> Inspecting the state metadata is useful for debugging and auditing. `serial` is the apply count — if two engineers both applied at serial 41, one will be rejected when pushing. `lineage` uniquely identifies the state file from birth — Terraform rejects pushes with wrong lineage to prevent overwriting state from a different environment.

```bash
# Check state format version
terraform state pull | jq '{version: .version, tf_version: .terraform_version, serial: .serial, resources: (.resources | length)}'
```

### 38. State backend with replication (DR)

> S3 Cross-Region Replication on the state bucket provides disaster recovery — if the primary region becomes unavailable, state is available in the replica region. Set the replica storage class to `STANDARD_IA` (Infrequent Access) to reduce cost. Combine with Route53 health-checks and automation to fail over CI/CD pipelines to the replica bucket.

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

> The `prevent_destroy` lifecycle block on the state bucket and lock table ensures Terraform itself cannot delete these critical resources. Any `terraform destroy` that would remove them returns an error. This is a safety net — though note it can be removed from the code and then a destroy would succeed, so IAM policies are the stronger control.

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

> This CI script selects the appropriate Terraform workspace based on the target environment, creating it if it doesn't exist (the `2>/dev/null || ...` handles the error from `select` when the workspace doesn't exist). After workspace selection, plan and apply are environment-specific. This pattern scales to N environments without code duplication.

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

> Lineage is the UUID fingerprint of a state file from initialization. Terraform rejects `state push` if lineage doesn't match — this prevents the devastating scenario of accidentally pushing dev state over prod state. Always check lineage before any manual state push. This script compares local and remote lineage as a pre-push safety check.

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

> Tiered state isolation limits the blast radius of a security breach. If an attacker reads the `secrets` state, they get credentials but not the network topology or app configuration — the layers are separated. This is defense-in-depth: each state file has minimum required contents, and each Terraform role has access only to its own state path.

```bash
# Keep secrets in isolated state files:
# secrets/terraform.tfstate    — only credentials, KMS keys
# network/terraform.tfstate    — VPC, subnets
# app/terraform.tfstate        — EC2, ECS (references secrets + network via remote_state)
# database/terraform.tfstate   — RDS (references network)
```

### 43. Replace resource in state (force recreation)

> `terraform apply -replace=` forces Terraform to destroy and recreate a specific resource even if the config hasn't changed. Use it when a resource is in a broken state (e.g., an EC2 instance with filesystem corruption). Replaces the deprecated `terraform taint` command (pre-0.15). The resource address is the same syntax as `state list` output.

```bash
# Terraform 0.15+: replace specific resource
terraform apply -replace="aws_instance.web"

# Old way (deprecated):
terraform taint aws_instance.web
terraform apply
```

### 44. State inspection with jq for auditing

> Combining `terraform state pull` with `jq` enables powerful state auditing without Terraform CLI knowledge. Use this in compliance scripts to verify all resources are tagged, find resources of specific types, or build an inventory of managed infrastructure. The first query lists all unique resource types; the second finds prod-tagged resource IDs.

```bash
# List all resource types in state
terraform state pull | jq '[.resources[].type] | unique | sort[]'

# Find all resources with a specific tag
terraform state pull | jq '.resources[].instances[].attributes | select(.tags.Environment == "prod") | .id'
```

### 45. DynamoDB table with TTL for state lock expiry

> Adding TTL to the DynamoDB lock table auto-expires stale lock entries after a configurable duration — a safety net for CI pipelines that get stuck without calling force-unlock. The Terraform provider writes a lock entry; if your lock entry includes an `Expiry` attribute, DynamoDB TTL will clean it up automatically. SSE is enabled for lock record encryption.

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

> Two separate controls: `aws_s3_bucket_public_access_block` prevents any public ACL or policy from taking effect at the account level, and the `DenyHTTP` bucket policy rejects any non-HTTPS request (regardless of who's making it). Together they ensure state files are only accessible over encrypted channels by authenticated principals.

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

> When state gets corrupted — perhaps by a bad manual edit or a race condition — S3 versioning lets you restore any previous version. This is the recovery playbook: list versions with timestamps, download the last known good version, then push it back. This is why enabling versioning on the state bucket is non-negotiable.

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

> `-lock-timeout=5m` makes Terraform wait up to 5 minutes for a lock to be released before failing — useful when you know another apply is in progress and will finish soon. `-lock=false` skips locking entirely — only use this for read-only operations like `plan` in non-concurrent environments, never for `apply` in a shared environment.

```bash
terraform apply -lock-timeout=5m   # wait up to 5 min for lock
terraform apply -lock=false         # skip locking (dangerous in teams)
```

### 49. Terraform Cloud as state backend

> The `cloud` block replaces the traditional `backend "remote"` configuration. Terraform Cloud provides state storage, locking, audit history, team access controls, and policy enforcement (Sentinel/OPA) in one service. The workspace maps to a Terraform Cloud workspace where all runs, state versions, and variables are managed through the UI or API.

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

> A reusable module that provisions a complete, production-hardened state backend: unique bucket name (account ID + region suffix), versioning, KMS encryption with rotation, public access block, and a DynamoDB lock table with `prevent_destroy`. This module is the first thing deployed in a new AWS account before any other Terraform code runs.

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

---

## Key Takeaways

- **State is the source of truth** — Terraform compares state to config to compute diffs; it doesn't query AWS on every plan (it uses cached state, refreshed at plan time)
- **S3 + DynamoDB is the production standard** — versioning for recovery, DynamoDB for locking, KMS for encryption, bucket policy for access control
- **State contains secrets** — every resource attribute (including passwords, keys) is stored plaintext in state; protect the bucket like a secrets store
- **Partial backend config** keeps credentials and environment-specific values out of source control — inject at `terraform init` time in CI
- **`moved` block** prevents destroy/recreate during refactoring — use it whenever you rename or restructure resources
- **`state rm`** removes from tracking without deleting in AWS — essential for migrating resources between stacks
- **`-refresh-only`** is the modern drift detection tool — run it regularly in production environments
- **Lineage + serial** prevent state corruption in multi-operator scenarios — Terraform rejects state pushes that don't match lineage
- **State isolation** by account/environment/tier limits blast radius — a compromised role in dev shouldn't be able to read prod state
- **`prevent_destroy`** on the state bucket/lock table prevents accidental deletion of your IaC foundation

---

## Common Interview Questions & Answers

**Q: Why does Terraform use state? Can't it just query AWS directly?**
A: Terraform uses state to cache resource attributes (avoiding thousands of API calls on each plan), track metadata not available in the API (like dependency ordering), and map logical HCL resource addresses to real AWS resource IDs. It does refresh from AWS during `plan`, but state is the baseline for diff computation. Without state, Terraform couldn't know if a resource was created by this configuration or by another process.

**Q: What happens if two engineers run `terraform apply` simultaneously without DynamoDB locking?**
A: Both processes read the same state, compute the same diff, and begin applying changes. One may succeed; the second then writes its state version on top, potentially reverting the first engineer's changes or creating a state file that doesn't reflect the actual infrastructure. The result is state corruption and infrastructure drift. DynamoDB locking prevents this: the second apply fails immediately with a lock error and waits or exits.

**Q: How do you handle sensitive values in Terraform state?**
A: Terraform always stores all resource attributes in state — `sensitive = true` only hides values in terminal output. Mitigations: (1) S3 server-side encryption (KMS CMK preferred), (2) strict IAM bucket policy — only the Terraform execution role can read/write state, (3) S3 block public access, (4) access logging for audit trails, (5) architectural separation — put secrets in a dedicated state file accessible only to the secrets management team.

**Q: What is the difference between `terraform state rm` and `terraform destroy`?**
A: `terraform state rm` removes a resource from Terraform's state tracking but leaves the real AWS resource intact — Terraform simply stops managing it. `terraform destroy` (for a specific resource: `terraform apply -destroy -target=<resource>`) deletes the real AWS resource AND removes it from state. Use `state rm` when you want to stop managing a resource with Terraform, use destroy when you want to actually delete it.

**Q: How do you migrate state from one S3 bucket to another?**
A: (1) Take a manual backup with `terraform state pull > backup.tfstate`. (2) Remove the current backend config from `main.tf`. (3) Run `terraform init -migrate-state` to download state locally. (4) Add the new backend config pointing to the new bucket. (5) Run `terraform init -migrate-state` again — Terraform will prompt to copy state to the new bucket. (6) Verify with `terraform state list`. The old bucket retains a copy; delete it after confirming success.
