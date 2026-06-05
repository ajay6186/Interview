# 3.2 — Remote State & State Commands

**Goal:** Set up S3 remote state with DynamoDB locking, and master all `terraform state` CLI commands.

## Remote State Backend (S3 + DynamoDB)

```hcl
terraform {
  backend "s3" {
    bucket         = "tf-state-backend-demo"
    key            = "phase3/remote-state/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

## State CLI Commands

```bash
# List all resources in state
terraform state list
# aws_s3_bucket.app_a
# aws_s3_bucket.app_b
# aws_dynamodb_table.locks

# Show details of one resource
terraform state show aws_s3_bucket.app_a

# Remove resource from state (doesn't destroy it in AWS)
terraform state rm aws_s3_bucket.app_c

# Move/rename a resource in state
terraform state mv aws_s3_bucket.app_a aws_s3_bucket.primary

# Pull current state as JSON (inspect raw state)
terraform state pull

# Push state back (use with extreme caution)
terraform state pull > backup.tfstate
terraform state push backup.tfstate

# Import existing resource into state
terraform import aws_s3_bucket.existing my-existing-bucket-name
```

## State Locking in Action

```bash
# Terminal 1: Start a slow apply
terraform apply -auto-approve

# Terminal 2: Try to apply simultaneously
terraform apply
# Error: Error acquiring the state lock
# Lock Info:
#   ID:        abc-123-def
#   Path:      bucket/key
#   Operation: OperationTypeApply
#   Who:       user@hostname
#   Created:   2026-05-31

# If a lock is stuck (crashed apply), force unlock
terraform force-unlock abc-123-def
```

## State Drift and Recovery

```bash
# Detect drift: what changed outside Terraform
terraform plan
# If AWS resource was manually changed: plan shows it needs updating

# Refresh state from real AWS (update state to match reality)
terraform apply -refresh-only

# Taint a resource (force replacement on next apply)
terraform taint aws_s3_bucket.app_b
terraform plan    # shows: -/+ replace aws_s3_bucket.app_b
terraform untaint aws_s3_bucket.app_b  # undo
```

## Backend Migration

```bash
# Step 1: Apply to create the S3 bucket (local state)
terraform apply -auto-approve

# Step 2: Add backend block to main.tf

# Step 3: Re-initialize — Terraform migrates local state to S3
terraform init
# "Do you want to copy existing state to the new backend?" → yes

# Step 4: Verify state is in S3
aws --endpoint-url=http://localhost:4566 s3 ls s3://tf-state-backend-demo/
```

## Interview Questions

**Q: What is state locking and why is it needed?**
> State locking prevents two concurrent `terraform apply` operations from simultaneously modifying the same state file. Without locking, concurrent applies can corrupt state. DynamoDB provides distributed locking by storing a lock record that Terraform checks before writing.

**Q: What does `terraform state rm` do vs `terraform destroy`?**
> `terraform state rm` removes a resource from state without touching the actual AWS resource — Terraform simply forgets it exists. `terraform destroy` actually deletes the AWS resource. Use `state rm` when you want Terraform to stop managing something without deleting it.

**Q: What happens if a terraform apply crashes mid-way?**
> The state lock remains in DynamoDB. The next `terraform plan` or `apply` will fail with a lock error showing the lock ID. After verifying no other apply is running, use `terraform force-unlock <lock-id>` to release it.
