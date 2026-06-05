# 3.5 — Workspaces

**Goal:** Use Terraform workspaces to manage dev/staging/prod environments from a single codebase.

## Workspace Commands

```bash
terraform workspace list           # list all workspaces (* = current)
terraform workspace new dev        # create + switch to "dev"
terraform workspace new staging
terraform workspace new prod
terraform workspace select dev     # switch to existing workspace
terraform workspace show           # print current workspace name
terraform workspace delete dev     # delete (workspace must have no resources)
```

## How It Works

Each workspace has its **own state file** in the backend:

```
Local:
  terraform.tfstate               ← default workspace
  terraform.tfstate.d/dev/        ← dev workspace
  terraform.tfstate.d/staging/    ← staging workspace
  terraform.tfstate.d/prod/       ← prod workspace

S3 backend:
  env:/dev/myapp/terraform.tfstate
  env:/staging/myapp/terraform.tfstate
  env:/prod/myapp/terraform.tfstate
```

## Practical Demo

```bash
# Dev environment
terraform workspace new dev
terraform apply -auto-approve
# Creates: tf-workspace-dev-bucket

# Prod environment (completely separate state)
terraform workspace new prod
terraform apply -auto-approve
# Creates: tf-workspace-prod-bucket (larger config, versioning on)

# Switch back, verify isolation
terraform workspace select dev
terraform state list
# Only shows dev resources — prod is invisible from here

# Destroy dev without touching prod
terraform destroy -auto-approve

# Destroy prod separately
terraform workspace select prod
terraform destroy -auto-approve
```

## Workspaces vs Directory-per-Environment

| | Workspaces | Directory per Env |
|--|-----------|-------------------|
| Code duplication | None | Each env has own copy |
| Config difference | `terraform.workspace` lookups | Separate `terraform.tfvars` |
| State isolation | Separate per workspace | Completely separate |
| Risk | One bug affects all envs | Changes are explicit per env |
| Industry preference | Small teams | Most larger orgs |

## Interview Questions

**Q: What is a Terraform workspace?**
> A named, isolated state file within the same backend configuration. Workspaces let you manage multiple environments (dev/prod) from one configuration. Resources in one workspace are completely invisible to another.

**Q: Can you use `terraform.workspace` in the backend configuration?**
> No. The backend block is evaluated before workspace selection, so `terraform.workspace` is not available there. Use it only in resource, local, and output blocks.
