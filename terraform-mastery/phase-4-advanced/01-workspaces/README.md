# 4.1 — Workspaces

**Goal:** Use Terraform workspaces to manage dev / staging / prod environments from one codebase.

## What Are Workspaces?

Workspaces are separate state files within the same backend. Each workspace is an independent environment — resources in `dev` are completely separate from `prod`.

```
S3 backend:
  terraform.tfstate               ← default workspace
  env:/dev/terraform.tfstate      ← dev workspace
  env:/staging/terraform.tfstate  ← staging workspace
  env:/prod/terraform.tfstate     ← prod workspace
```

## Workspace Commands

```bash
terraform workspace list          # show all workspaces (* = current)
terraform workspace new dev       # create and switch to "dev"
terraform workspace new prod      # create "prod"
terraform workspace select dev    # switch to existing workspace
terraform workspace show          # print current workspace name
terraform workspace delete dev    # delete workspace (must be empty)
```

## Using Workspace in Config

```hcl
locals {
  env = terraform.workspace   # "dev", "staging", "prod"
}

resource "aws_s3_bucket" "app" {
  bucket = "myapp-${local.env}"   # myapp-dev, myapp-prod
}
```

## Practical Demo

```bash
# Create dev environment
terraform workspace new dev
terraform apply -auto-approve
# Creates: tf-workspace-demo-dev bucket

# Create prod environment
terraform workspace new prod
terraform apply -auto-approve
# Creates: tf-workspace-demo-prod bucket (separate state, separate resource)

# Switch back to dev
terraform workspace select dev
terraform state list
# Only shows dev resources

# Clean up
terraform destroy -auto-approve
terraform workspace select prod
terraform destroy -auto-approve
```

## Workspaces vs Separate Directories

| | Workspaces | Separate Directories |
|--|-----------|---------------------|
| Code duplication | None (same files) | Each env has its own copy |
| Config differences | `terraform.workspace` conditionals | Different `terraform.tfvars` |
| State isolation | Separate state per workspace | Completely separate |
| Industry adoption | Medium | High (more explicit) |
| Risk of blast radius | Higher (same code) | Lower (explicit per-env) |

Most larger teams prefer **separate directories** per environment for better isolation and explicit config. Workspaces are best for simple, nearly-identical environments.

## Interview Questions

**Q: What is a Terraform workspace?**
> A named state file within the same backend. Workspaces let you manage multiple environments from one configuration. Each workspace has its own isolated state, so resources created in `dev` don't interfere with `prod`.

**Q: What is the default workspace?**
> Every Terraform configuration starts with a `default` workspace. You can't delete the default workspace.
