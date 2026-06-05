# 6.1 — Terragrunt

**Goal:** Use Terragrunt to eliminate copy-paste across environments and enforce DRY Terraform at scale.

## What is Terragrunt?

Terragrunt is a thin wrapper around Terraform that adds:
- DRY backend configuration (one place, not per module)
- Dependency management between modules
- Automatic `terraform init` with proper backend
- Environment-level variable injection

Install: `brew install terragrunt` or download from [github.com/gruntwork-io/terragrunt](https://github.com/gruntwork-io/terragrunt)

## Problem Terragrunt Solves

**Without Terragrunt (repetition in every env):**
```
environments/
├── dev/vpc/
│   ├── main.tf           ← copy of module call
│   ├── backend.tf        ← dev-specific backend
│   └── terraform.tfvars
├── staging/vpc/
│   ├── main.tf           ← SAME copy
│   ├── backend.tf        ← staging-specific backend
│   └── terraform.tfvars
└── prod/vpc/
    ├── main.tf           ← SAME copy again
    ├── backend.tf
    └── terraform.tfvars
```

**With Terragrunt (DRY):**
```
live/
├── terragrunt.hcl        ← root config (backend, provider, tags)
├── dev/
│   ├── terragrunt.hcl    ← env-level vars
│   └── vpc/
│       └── terragrunt.hcl ← just: source + inputs
├── staging/
│   └── vpc/
│       └── terragrunt.hcl
└── prod/
    └── vpc/
        └── terragrunt.hcl
```

## Root terragrunt.hcl

```hcl
# live/terragrunt.hcl — shared config inherited by all children

locals {
  account_id  = get_aws_account_id()
  region      = "ap-south-1"
  environment = basename(dirname(get_terragrunt_dir()))
}

# DRY backend — generated automatically per module
remote_state {
  backend = "s3"
  config = {
    bucket         = "tf-state-${local.account_id}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.region
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

# Inject common inputs into every module
inputs = {
  region      = local.region
  environment = local.environment
}
```

## Module terragrunt.hcl

```hcl
# live/prod/vpc/terragrunt.hcl

include "root" {
  path = find_in_parent_folders()  # inherits root config
}

terraform {
  source = "github.com/org/terraform-modules//vpc?ref=v2.0.0"
}

inputs = {
  vpc_cidr      = "10.0.0.0/16"
  azs           = ["ap-south-1a", "ap-south-1b"]
  instance_type = "t3.large"
}
```

## Dependency Management

```hcl
# live/prod/app/terragrunt.hcl
dependency "vpc" {
  config_path = "../vpc"

  # Mock outputs for plan without applying vpc first
  mock_outputs = {
    vpc_id            = "vpc-00000000"
    public_subnet_ids = ["subnet-00000000"]
  }
}

inputs = {
  vpc_id    = dependency.vpc.outputs.vpc_id
  subnet_id = dependency.vpc.outputs.public_subnet_ids[0]
}
```

## Common Terragrunt Commands

```bash
terragrunt plan                    # same as terraform plan
terragrunt apply                   # same as terraform apply
terragrunt destroy                 # same as terraform destroy

# Run across ALL modules in directory tree
terragrunt run-all plan
terragrunt run-all apply
terragrunt run-all destroy

# Only modules with changes
terragrunt run-all apply --terragrunt-source-update
```

## When to Use Terragrunt

| Situation | Use Terragrunt? |
|-----------|----------------|
| 1 environment, 1 team | No — overkill |
| 3+ environments with shared modules | Yes |
| 5+ teams managing different modules | Yes |
| Need cross-module dependencies | Yes |
| Using Terraform Cloud | Maybe — TFC has workspaces |

## Interview Questions

**Q: What is Terragrunt and how does it differ from Terraform?**
> Terragrunt is a wrapper around Terraform that adds DRY configuration management, automatic backend generation per module, cross-module dependency management, and `run-all` commands for managing entire environment stacks. Terraform is the core tool; Terragrunt orchestrates it at scale.

**Q: How does Terragrunt handle the backend configuration repetition problem?**
> The root `terragrunt.hcl` defines the backend once with dynamic values like `path_relative_to_include()`. Each child module inherits this via `find_in_parent_folders()`. Terragrunt generates the correct `backend.tf` automatically per module — zero copy-paste.
