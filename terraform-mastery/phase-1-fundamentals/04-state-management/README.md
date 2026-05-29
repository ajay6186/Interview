# 04 - State Management

## What is Terraform State?

Terraform keeps a `terraform.tfstate` file that maps your HCL code to real AWS resources.
Without it, Terraform doesn't know what it already created.

## Local State (default)
- Stored in `terraform.tfstate` in the same folder
- Fine for learning, dangerous for teams (no locking, no sharing)

## Remote State (production pattern)
Store state in S3 with DynamoDB locking:

```hcl
backend "s3" {
  bucket         = "my-tf-state-bucket"
  key            = "project/env/terraform.tfstate"
  region         = "ap-south-1"
  dynamodb_table = "terraform-state-lock"  # prevents concurrent applies
  encrypt        = true
}
```

## State Commands
```bash
terraform state list                    # list all resources in state
terraform state show aws_s3_bucket.main # show details of one resource
terraform state rm aws_s3_bucket.main   # remove from state (doesn't delete real resource)
terraform state mv old_name new_name    # rename resource in state
terraform import aws_s3_bucket.main my-existing-bucket  # import existing resource

terraform refresh   # sync state with real AWS (deprecated, use apply -refresh-only)
terraform apply -refresh-only  # update state without making changes
```

## What NOT to do
- Never edit `terraform.tfstate` manually
- Never commit state files with secrets to git
- Add `*.tfstate` and `*.tfstate.backup` to `.gitignore`

## .gitignore for Terraform
```
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars       # may contain secrets
.terraform.lock.hcl  # optional — some teams commit this
```
