# 4.1 — Multi-Environment Pattern

**Goal:** Manage dev / staging / prod environments using the directory-per-environment pattern — the industry standard approach.

## Two Patterns: Directory vs Workspace

### Directory-per-Environment (recommended for production)
```
environments/
├── dev/
│   ├── main.tf          ← calls shared module
│   └── terraform.tfvars ← dev-specific values
├── staging/
│   ├── main.tf
│   └── terraform.tfvars
└── prod/
    ├── main.tf
    └── terraform.tfvars
modules/
└── app/                 ← shared module used by all envs
    └── main.tf
```

### Workspace Pattern (simpler, less isolation)
```
main.tf                  ← one file, branch by terraform.workspace
```

## Directory Pattern Setup

**`environments/dev/terraform.tfvars`**
```hcl
environment   = "dev"
s3_versioning = false
replica_count = 1
```

**`environments/prod/terraform.tfvars`**
```hcl
environment   = "prod"
s3_versioning = true
replica_count = 3
```

```bash
# Deploy dev
cd environments/dev
terraform init
terraform apply -auto-approve

# Deploy prod (completely separate state)
cd environments/prod
terraform init
terraform apply -auto-approve
```

## Using terraform.tfvars in This Exercise

```bash
# Override defaults with a tfvars file
cat > dev.tfvars <<EOF
environment   = "dev"
s3_versioning = false
replica_count = 1
EOF

cat > prod.tfvars <<EOF
environment   = "prod"
s3_versioning = true
replica_count = 3
EOF

# Apply with specific env config
terraform apply -var-file=dev.tfvars -auto-approve
terraform apply -var-file=prod.tfvars -auto-approve
```

## Variable Precedence (highest → lowest)

```
1. -var="key=value"          (CLI flag)
2. -var-file=file.tfvars     (CLI file)
3. terraform.tfvars.json
4. terraform.tfvars           (auto-loaded)
5. *.auto.tfvars              (auto-loaded)
6. TF_VAR_name env vars
7. variable default value
```

## How to Run

```bash
terraform init
terraform apply -auto-approve                       # dev defaults
terraform apply -var="environment=prod" -var="s3_versioning=true" -var="replica_count=3" -auto-approve

terraform output
terraform destroy -auto-approve
```

## Interview Questions

**Q: What is the difference between the directory-per-environment and workspace patterns?**
> Directory-per-environment uses separate folders with separate state files and explicit tfvars — each environment is fully isolated and independently deployable. Workspaces use one config with branching logic via `terraform.workspace` — simpler but a bug in config affects all environments.

**Q: Why do most companies prefer directory-per-environment over workspaces?**
> Explicit is safer at scale. With directories: PRs clearly show which environment changes, state files are completely separate, and you can use different backends per environment. With workspaces, one bad `terraform destroy` in the wrong workspace can be catastrophic.
