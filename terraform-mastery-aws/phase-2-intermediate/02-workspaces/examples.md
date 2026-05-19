# Examples 2.2 — Workspaces (50 examples)

> **Topic Overview:** Terraform workspaces allow a single configuration to manage multiple independent state files — each workspace gets its own isolated state. The primary use case is environment separation (dev/staging/production) within the same codebase. Workspaces are accessed via `terraform.workspace` in configuration and are stored with a `env:/` prefix in S3. Key limitation: all workspaces share the same provider configuration and backend — you can't use different AWS accounts per workspace. For strict account-level isolation, use separate directories (or stacks) instead.

---

## Basic

### 1. Create a new workspace

> `terraform workspace new` creates a workspace and automatically switches to it. Workspaces have no effect until you reference `terraform.workspace` in your configuration or use a remote backend that supports workspace-prefixed state paths. The `default` workspace is always present and can't be deleted.

```bash
terraform workspace new development
terraform workspace new staging
terraform workspace new production
```

### 2. List workspaces

> `terraform workspace list` shows all workspaces with `*` marking the current one. This is your first command when debugging "why is this applying to the wrong environment?" — always check which workspace is active before running `plan` or `apply`.

```bash
terraform workspace list
# Output:
#   default
# * development   (current)
#   staging
#   production
```

### 3. Select a workspace

> `terraform workspace select` switches to a different workspace, loading its associated state file. Any subsequent `plan` or `apply` operates against that workspace's state. In CI/CD, always explicitly `select` the target workspace — never rely on the current state of the runner's workspace.

```bash
terraform workspace select production
terraform workspace select default
```

### 4. Show current workspace

> `terraform workspace show` outputs just the workspace name — useful in scripts. Capture it: `CURRENT=$(terraform workspace show)`. This is how you verify which environment a CI pipeline is targeting before applying, or how you include the workspace in deployment notifications.

```bash
terraform workspace show
# Output: production
```

### 5. Delete a workspace

> You must switch away from a workspace before deleting it. Deleting a workspace removes its state file from the backend — any resources it managed are orphaned (they still exist in AWS but Terraform no longer tracks them). Always `terraform destroy` the workspace first, then delete it.

```bash
terraform workspace select default
terraform workspace delete staging
# (cannot delete current workspace)
```

### 6. Reference current workspace in config

> `terraform.workspace` is a built-in string value available anywhere in your HCL configuration. Using it in resource names ensures each workspace creates uniquely named resources. Without this, workspaces would conflict — two workspaces trying to create an S3 bucket with the same name would fail.

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs-${terraform.workspace}"
}
```

### 7. Workspace in resource naming

> Embedding `terraform.workspace` in resource names and tags is the minimum workspace integration. The `Environment` tag makes cost allocation and filtering easy in the AWS console. Always tag resources with the workspace/environment — it's essential for understanding what's running where.

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  tags = {
    Name        = "web-${terraform.workspace}"
    Environment = terraform.workspace
  }
}
```

### 8. S3 backend workspace key path

> When using the S3 backend with workspaces, Terraform automatically stores each workspace's state at `env:/<workspace>/<key>`. The `default` workspace uses the key directly without the `env:/` prefix. This means all environments share one S3 bucket but have completely isolated state files — a destroy in one workspace can't touch another.

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
    # workspace state stored at: env:/<workspace>/app/terraform.tfstate
  }
}
```

### 9. Workspace naming conventions

> Workspace names should be consistent and meaningful. Common patterns: environment names (`dev`, `staging`, `prod`), feature-branch names (`dev-feature-auth`) for development isolation, and PR numbers (`pr-123`) for ephemeral environments. Keep names short and lowercase — they're used in resource names and S3 key paths.

```bash
# Common patterns:
terraform workspace new dev
terraform workspace new dev-feature-auth
terraform workspace new staging
terraform workspace new prod
terraform workspace new pr-123   # per-PR ephemeral environments
```

### 10. Default workspace usage

> The `default` workspace is always present, cannot be deleted, and is where most single-environment configurations run. It's equivalent to having no workspace at all. When you run `terraform init` in a new directory and apply without creating workspaces, you're using `default`. The S3 key path for `default` has no `env:/` prefix.

```bash
# default workspace is always present and cannot be deleted
terraform workspace select default
terraform workspace show  # default
```

### 11. Init then workspace select

> The standard workspace workflow: `init` downloads providers and configures the backend, `workspace new/select` sets the target environment, then `plan`/`apply` operates on that environment's state. Always run `init` before workspace operations when changing to a new directory or after provider version changes.

```bash
terraform init
terraform workspace new production
terraform workspace select production
terraform plan
terraform apply
```

### 12. workspace in output

> Exposing `terraform.workspace` as an output is useful for deployment dashboards, CI/CD pipelines that capture Terraform outputs, and debugging. It makes the active environment explicit in apply output. Combine with `timestamp()` and `data.aws_caller_identity.current.account_id` for a complete deployment fingerprint.

```hcl
output "environment" {
  value = terraform.workspace
}
```

---

## Intermediate

### 13. Workspace-based variable selection with locals

> The `locals` lookup map is the cleanest workspace parameterization pattern. Define all environment configurations in one place, then select based on `terraform.workspace`. The `lookup(map, key, default)` call provides a fallback for unknown workspace names — any unrecognized workspace gets the `"default"` config, preventing hard errors from typos.

```hcl
locals {
  env_settings = {
    default    = { instance_type = "t3.micro",  min_size = 1, max_size = 2 }
    staging    = { instance_type = "t3.small",  min_size = 1, max_size = 3 }
    production = { instance_type = "t3.medium", min_size = 3, max_size = 10 }
  }
  settings = lookup(local.env_settings, terraform.workspace, local.env_settings["default"])
}

resource "aws_instance" "web" {
  instance_type = local.settings.instance_type
}
```

### 14. Workspace-based instance count

> Controlling resource count per workspace is cost-effective: dev runs one instance, staging two, production five. The `lookup` with a default of `1` ensures any unknown workspace gets a single instance rather than erroring. This scales naturally — add more workspace entries to the map without changing the resource definition.

```hcl
locals {
  instance_count = {
    default    = 1
    staging    = 2
    production = 5
  }
}

resource "aws_instance" "web" {
  count         = lookup(local.instance_count, terraform.workspace, 1)
  ami           = data.aws_ami.app.id
  instance_type = "t3.micro"
}
```

### 15. Workspace in S3 key for environment isolation

> Documenting the auto-generated S3 key paths is important for operations. When someone needs to find the staging state file for manual inspection or recovery, they need to know it's at `env:/staging/app/terraform.tfstate`, not at the literal key. Include this comment in backend configs as team documentation.

```hcl
# Each workspace gets its own state file path:
# default    → env:/default/app/terraform.tfstate
# staging    → env:/staging/app/terraform.tfstate
# production → env:/production/app/terraform.tfstate
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 16. Workspace-conditional resource size

> Direct `terraform.workspace ==` comparisons in resource arguments are the most explicit workspace parameterization. This RDS example shows four workspace-driven decisions: instance class, storage size, Multi-AZ, and `skip_final_snapshot`. Production gets larger, highly available, and fully backed up; dev/staging get minimal resources with easy teardown.

```hcl
resource "aws_db_instance" "main" {
  identifier     = "app-${terraform.workspace}"
  engine         = "postgres"
  engine_version = "15"
  instance_class = terraform.workspace == "production" ? "db.t3.medium" : "db.t3.micro"
  allocated_storage = terraform.workspace == "production" ? 100 : 20
  multi_az          = terraform.workspace == "production"
  skip_final_snapshot = terraform.workspace != "production"
}
```

### 17. Workspace-based VPC CIDR

> Assigning different CIDR blocks per workspace prevents IP overlap, which is critical if you ever need to peer the VPCs or set up VPN connectivity between environments. Dev at `10.0.0.0/16`, staging at `10.1.0.0/16`, production at `10.2.0.0/16` is a common and clean allocation. Without this, you can't peer dev and prod for data migration.

```hcl
locals {
  vpc_cidr = {
    default    = "10.0.0.0/16"
    staging    = "10.1.0.0/16"
    production = "10.2.0.0/16"
  }
}

resource "aws_vpc" "main" {
  cidr_block = lookup(local.vpc_cidr, terraform.workspace, "10.0.0.0/16")
}
```

### 18. Workspace-conditional tagging

> Computing `is_prod = terraform.workspace == "production"` once and reusing it throughout tags is cleaner than repeated ternary expressions. The `CostCenter` tag separates production costs from development costs in billing reports. The `Backup` tag drives automated backup policies via AWS Backup tag-based selection.

```hcl
locals {
  is_prod = terraform.workspace == "production"

  tags = {
    Environment = terraform.workspace
    CostCenter  = local.is_prod ? "production-engineering" : "development"
    Backup      = local.is_prod ? "true" : "false"
    ManagedBy   = "terraform"
  }
}
```

### 19. Terraform workspace in CI/CD pipeline

> This CI script handles both first-time workspace creation and selection of existing workspaces. The `2>/dev/null || terraform workspace new` pattern is idiomatic for CI — `workspace select` exits non-zero if the workspace doesn't exist, so we catch that and create it. The plan is saved to a file to ensure apply runs exactly what was planned.

```bash
#!/bin/bash
# Deploy to specific environment workspace
ENVIRONMENT=${DEPLOY_ENV:-staging}

terraform init
terraform workspace select "$ENVIRONMENT" || terraform workspace new "$ENVIRONMENT"
terraform plan -out="${ENVIRONMENT}.plan"
terraform apply "${ENVIRONMENT}.plan"
```

### 20. Workspace-based module selection

> Selecting different module sources based on workspace allows truly different infrastructure shapes — a single RDS instance for dev, an Aurora cluster for production. This is more powerful than just parameterization: the module itself is different. Be careful: different modules may have different output names, requiring conditional output handling.

```hcl
module "database" {
  source = terraform.workspace == "production" ? "./modules/rds-cluster" : "./modules/rds-single"
  environment = terraform.workspace
}
```

### 21. List workspaces in automation

> Capturing workspace state in scripts enables safe automation. `terraform workspace show` returns just the name (no trailing newline issues). The `grep -q` pattern checks workspace existence before creating — cleaner than catching errors from `workspace select`. Use this in setup scripts for new team members or CI environment initialization.

```bash
# Get current workspace in scripts
CURRENT_WS=$(terraform workspace show)
echo "Deploying to workspace: $CURRENT_WS"

# Check if workspace exists
terraform workspace list | grep -q "staging" && echo "exists" || terraform workspace new staging
```

### 22. Workspace with map variable for per-env domains

> Domain names are environment-specific configuration that shouldn't be hardcoded in HCL. Storing them in a variable map with `lookup` and a safe default makes the code flexible. Production gets the apex domain (`example.com`), lower environments get subdomains. This feeds into Route53 records, ACM certificates, and ALB listener rules.

```hcl
variable "domain_names" {
  type = map(string)
  default = {
    default    = "dev.example.com"
    staging    = "staging.example.com"
    production = "example.com"
  }
}

locals {
  domain = lookup(var.domain_names, terraform.workspace, "dev.example.com")
}
```

### 23. Workspace-based deletion protection

> `deletion_protection = true` on an RDS instance prevents both Terraform and the AWS console from deleting it. Enable this only in production. Without workspace gating, you'd either have it always on (making dev teardown painful) or always off (leaving production vulnerable). The ternary makes the intent explicit.

```hcl
resource "aws_db_instance" "main" {
  deletion_protection = terraform.workspace == "production" ? true : false
  # ...
}
```

### 24. Workspace-conditional NAT gateway

> NAT gateways cost ~$45/month each in AWS. Production needs one per AZ for high availability (`length(var.private_subnets)` NAT gateways). Non-production can use a single NAT gateway for all private subnets — traffic routes through one AZ, which is fine for dev/staging. This single workspace condition saves ~$90-135/month for non-production environments.

```hcl
resource "aws_nat_gateway" "main" {
  # Only create NAT in production (costly)
  count         = terraform.workspace == "production" ? length(var.private_subnets) : 1
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
}
```

### 25. Workspace-based alarm thresholds

> Production CloudWatch alarms should fire at lower thresholds than dev/staging — earlier warning gives more time to respond before user impact. CPU at 70% in prod (vs. 90% in dev) means you get alerted and can scale before you're at capacity. Per-workspace thresholds also prevent dev load tests from generating spurious production alerts.

```hcl
locals {
  alarm_thresholds = {
    default    = { cpu = 90, memory = 90 }
    staging    = { cpu = 85, memory = 85 }
    production = { cpu = 70, memory = 75 }
  }
  thresholds = local.alarm_thresholds[terraform.workspace]
}

resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "high-cpu-${terraform.workspace}"
  comparison_operator = "GreaterThanThreshold"
  threshold           = local.thresholds.cpu
}
```

---

## Nested

### 26. Workspace + locals for complete environment config

> The complete configuration matrix pattern: all environment-specific settings in a single `locals` block, one key per environment. The `contains(keys(...), terraform.workspace) ? terraform.workspace : "dev"` guard prevents a hard error if someone runs in an undefined workspace — they get dev config instead of a crash. Use this as the foundation for all workspace-aware configurations.

```hcl
locals {
  workspaces = {
    dev = {
      region            = "us-east-1"
      instance_type     = "t3.micro"
      min_capacity      = 1
      max_capacity      = 3
      db_instance_class = "db.t3.micro"
      enable_cdn        = false
      enable_waf        = false
    }
    prod = {
      region            = "us-east-1"
      instance_type     = "t3.large"
      min_capacity      = 3
      max_capacity      = 20
      db_instance_class = "db.t3.medium"
      enable_cdn        = true
      enable_waf        = true
    }
  }

  env = contains(keys(local.workspaces), terraform.workspace) ? terraform.workspace : "dev"
  config = local.workspaces[local.env]
}
```

### 27. Workspace-aware nested module calls

> Building on the config matrix (example 26), `local.config.enable_cdn` and `local.config.enable_waf` drive module conditional creation. Production gets CDN and WAF; dev gets neither. This is the recommended pattern — extract the workspace logic to locals, then use the computed booleans for module counts. Keeps resource definitions clean.

```hcl
module "cdn" {
  count  = local.config.enable_cdn ? 1 : 0
  source = "./modules/cloudfront"

  origin_domain = aws_lb.app.dns_name
  environment   = terraform.workspace
}

module "waf" {
  count  = local.config.enable_waf ? 1 : 0
  source = "./modules/waf"

  alb_arn     = aws_lb.app.arn
  environment = terraform.workspace
}
```

### 28. Workspace with map for multi-service config

> Combining `for_each` on modules with workspace-conditional sizing is a powerful pattern for microservices. Each service gets workspace-appropriate CPU/memory/count. The `for_each = local.services` iterates the services map; within each service definition, `terraform.workspace == "production"` ternaries set the right sizing. Adding a new service only requires adding an entry to `local.services`.

```hcl
locals {
  services = {
    api = {
      cpu    = terraform.workspace == "production" ? 1024 : 256
      memory = terraform.workspace == "production" ? 2048 : 512
      count  = terraform.workspace == "production" ? 5 : 1
    }
    worker = {
      cpu    = terraform.workspace == "production" ? 512 : 256
      memory = terraform.workspace == "production" ? 1024 : 512
      count  = terraform.workspace == "production" ? 3 : 1
    }
  }
}

module "ecs_services" {
  for_each = local.services
  source   = "./modules/ecs-service"

  name   = "${each.key}-${terraform.workspace}"
  cpu    = each.value.cpu
  memory = each.value.memory
  count  = each.value.count
}
```

### 29. Workspace limitations (documentation comment pattern)

> Understanding workspace limitations is as important as understanding their capabilities. The four listed limitations are real production pain points. The directory-per-environment alternative is widely used at scale. In practice, most teams use workspaces for dev/feature-branch isolation and separate directories (or entirely separate repos) for production.

```hcl
# IMPORTANT: Workspaces share the same backend, provider config, and variable files.
# Limitations:
# 1. Cannot have per-workspace provider configurations (e.g., different AWS accounts)
# 2. All workspaces use the same main.tf — complex conditional logic gets messy
# 3. Sensitive variable management per workspace is harder than separate directories
# 4. No workspace-specific tfvars files without CI complexity

# Alternative: directory-per-environment pattern
# envs/
#   dev/
#     main.tf -> ../../modules/app
#     variables.tf
#     terraform.tfvars
#   prod/
#     main.tf -> ../../modules/app
#     variables.tf
#     terraform.tfvars
```

### 30. Workspace with remote state cross-reference

> Reading state from a specific workspace requires the `workspace` argument in `terraform_remote_state`. This enables a production workspace to read shared services (DNS zones, VPC peering, centralized logging) from the `default` workspace without recreating them. The backend `config.key` is the base key — the `workspace` argument adds the `env:/` prefix automatically.

```hcl
# Production workspace references shared-services state
data "terraform_remote_state" "shared" {
  backend   = "s3"
  workspace = "default"  # workspaces use env:/<ws>/ prefix in key
  config = {
    bucket = "my-terraform-state"
    key    = "shared/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 31. Per-workspace tfvars in CI

> Combining workspace selection with environment-specific `tfvars` files is the most flexible workspace pattern. The workspace provides state isolation; the tfvars file provides detailed configuration. `environments/prod.tfvars` can contain different module versions, feature flags, and scaling parameters. This is cleaner than embedding all config in the workspace-keyed locals map.

```bash
#!/bin/bash
WORKSPACE=${1:-dev}
TFVARS_FILE="environments/${WORKSPACE}.tfvars"

terraform workspace select "$WORKSPACE"
terraform apply -var-file="$TFVARS_FILE" -auto-approve

# environments/
#   dev.tfvars
#   staging.tfvars
#   prod.tfvars
```

### 32. Workspace-based secret paths in SSM

> Using `terraform.workspace` as part of SSM Parameter Store paths creates a clean namespace. Each environment's secrets live under `/<workspace>/app/` — operators and automation scripts can easily find the right parameter. IAM policies can restrict access by path prefix, so dev IAM roles can only read `/dev/*` parameters, never `/production/*`.

```hcl
data "aws_ssm_parameter" "db_password" {
  name            = "/${terraform.workspace}/app/db_password"
  with_decryption = true
}
# /dev/app/db_password
# /staging/app/db_password
# /production/app/db_password
```

### 33. Workspace state isolation verification

> This verification script audits workspace isolation by iterating through known workspaces and listing resources in each. Useful for confirming that a `terraform destroy` in dev didn't accidentally touch staging resources. Run this after any workspace manipulation or before a production deployment to confirm state is clean.

```bash
# Verify each workspace has isolated state
for ws in dev staging production; do
  echo "=== $ws ==="
  terraform workspace select "$ws"
  terraform state list
  echo ""
done
```

### 34. Cleanup ephemeral workspace

> Ephemeral workspaces for pull requests need cleanup when the PR is closed. This script: selects the PR workspace → destroys all resources → switches to default → deletes the workspace. Running in CI on PR close events automates this. Without cleanup, AWS costs accumulate from forgotten PR environments.

```bash
#!/bin/bash
PR_WORKSPACE="pr-${PR_NUMBER}"

terraform workspace select "$PR_WORKSPACE"
terraform destroy -auto-approve

terraform workspace select default
terraform workspace delete "$PR_WORKSPACE"
echo "Cleaned up workspace: $PR_WORKSPACE"
```

---

## Advanced

### 35. Workspace vs directory-per-env trade-offs

> This is one of the most important architecture decisions in Terraform. Workspaces win for simplicity; directory-per-environment wins for isolation and flexibility. The hybrid approach (workspaces within directories) is common at scale: use directories to enforce account-level isolation for production, workspaces within the non-prod directory for developer environments. Understand both and choose deliberately.

```bash
# WORKSPACES: Good when
# - Same infrastructure shape across environments
# - Small team, simple config
# - Cost differences handled via locals

# DIRECTORY PER ENV: Good when
# - Different providers per environment (accounts)
# - Different module versions per environment
# - Teams need clear separation
# - Blast radius isolation is critical

# Common production approach: use BOTH
# workspaces within dev/staging directories
# separate prod/ directory
```

### 36. Workspace automation with Terraform Cloud API

> Terraform Cloud workspaces are first-class API objects. Creating workspaces via the TFC API in CI pipelines (e.g., on PR open) enables fully automated ephemeral environment provisioning. The `auto-apply: true` setting means the workspace automatically applies on VCS push. Use the TFC provider (`tfe_workspace` resource) for managing TFC workspaces from Terraform itself.

```bash
# Create workspace via TFC API
curl -X POST \
  -H "Authorization: Bearer $TFC_TOKEN" \
  -H "Content-Type: application/vnd.api+json" \
  -d '{"data":{"type":"workspaces","attributes":{"name":"pr-456","auto-apply":true}}}' \
  "https://app.terraform.io/api/v2/organizations/my-org/workspaces"
```

### 37. Workspace in GitOps: map branch to workspace

> This GitHub Actions workflow maps Git branches to Terraform workspaces — `main` → `production`, `staging` → `staging`, everything else → `develop`. The `TF_WORKSPACE` env variable is read by Terraform CLI automatically. This GitOps pattern ensures the infrastructure environment always matches the code branch, making audit trails clear.

```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Set workspace
        run: |
          case "$GITHUB_REF_NAME" in
            main)    echo "TF_WORKSPACE=production" >> $GITHUB_ENV ;;
            staging) echo "TF_WORKSPACE=staging"    >> $GITHUB_ENV ;;
            *)       echo "TF_WORKSPACE=develop"    >> $GITHUB_ENV ;;
          esac
      - run: terraform workspace select $TF_WORKSPACE
      - run: terraform apply -auto-approve
```

### 38. Workspace-scoped deletion policy

> Attempting to use `lifecycle` meta-arguments driven by workspace value is a conceptual pattern — in practice `lifecycle` blocks can't contain dynamic expressions. The actual implementation would use these workspace values to conditionally set `prevent_destroy` via module variables or use separate resource blocks per environment. The pattern documents intent even if the HCL isn't directly valid.

```hcl
# In production workspace: all protections enabled
# In dev workspace: allow easy teardown

locals {
  lifecycle_config = terraform.workspace == "production" ? {
    prevent_destroy            = true
    delete_protection_enabled  = true
  } : {
    prevent_destroy            = false
    delete_protection_enabled  = false
  }
}
```

### 39. Multi-workspace apply in parallel (script)

> Parallelizing non-production deploys reduces pipeline time. Each environment runs in a subshell (`( ... ) &`) that selects its workspace and applies independently. `wait` blocks until all subshells complete. Only use this for environments that don't have inter-dependencies. Never parallelize production with other environments — production should always be a separate, gated pipeline step.

```bash
#!/bin/bash
# Apply to all non-prod workspaces in parallel
for ws in dev staging; do
  (
    terraform workspace select "$ws"
    terraform apply -auto-approve -var-file="environments/${ws}.tfvars"
    echo "Done: $ws"
  ) &
done
wait
echo "All non-prod environments updated"
```

### 40. Workspace with Terraform Cloud: workspace variables

> The `tfe_variable` resource lets you manage Terraform Cloud workspace variables from Terraform itself (meta-Terraform). This is useful for bootstrapping new workspaces with environment-specific secrets and configuration. `sensitive = true` marks the variable as sensitive in TFC — it's stored encrypted and never shown in the UI or API responses.

```hcl
# Use TFE provider to manage workspace variables
resource "tfe_variable" "db_password" {
  key          = "db_password"
  value        = var.db_password
  category     = "terraform"
  sensitive    = true
  workspace_id = tfe_workspace.app.id
}

# Per-workspace sensitive variable
resource "tfe_variable" "env_name" {
  key          = "environment"
  value        = tfe_workspace.app.name
  category     = "terraform"
  workspace_id = tfe_workspace.app.id
}
```

### 41. Workspace discovery in Terraform config

> A `null_resource` (or `terraform_data`) with a `precondition` enforcing workspace names prevents typos from creating misconfigured environments. If someone runs `terraform workspace new procduction` (typo) and then `apply`, the precondition fires immediately with a clear error message before creating any resources. This is a guardrail against workspace name drift.

```hcl
# Valid workspaces list (enforce allowed workspace names)
variable "allowed_workspaces" {
  type    = list(string)
  default = ["dev", "staging", "production"]
}

resource "null_resource" "workspace_check" {
  lifecycle {
    precondition {
      condition     = contains(var.allowed_workspaces, terraform.workspace)
      error_message = "Workspace '${terraform.workspace}' is not in the allowed list: ${join(", ", var.allowed_workspaces)}"
    }
  }
}
```

### 42. Workspace with environment-specific backend

> Using completely separate S3 buckets per environment tier (not just different keys in the same bucket) provides the strongest isolation — different IAM policies, potentially different AWS accounts. This hybrid approach: workspaces handle dev/staging ephemeral environments within the dev bucket; a completely separate prod bucket with tighter IAM provides production isolation. `terraform init -backend-config=prod.backend.hcl` selects the bucket.

```bash
# Use separate backend configs per environment tier
# (avoids workspace prefix — full key control)

# dev.backend.hcl
bucket = "myapp-terraform-state-dev"
key    = "app/terraform.tfstate"
region = "us-east-1"

# prod.backend.hcl
bucket = "myapp-terraform-state-prod"
key    = "app/terraform.tfstate"
region = "us-east-1"
# Different bucket = different AWS account = stronger isolation
```

### 43. Workspace resource quotas (using count)

> Enforcing maximum resource counts per workspace prevents dev environments from accidentally scaling up to production-level capacity (and cost). The `lookup` with a default of `2` means any unexpected workspace gets a conservative limit. Set `max_size` on ASGs to these values — they're enforced by AWS even if Terraform is bypassed.

```hcl
locals {
  max_instances = {
    dev        = 2
    staging    = 4
    production = 20
  }
}

resource "aws_autoscaling_group" "app" {
  name             = "app-${terraform.workspace}"
  max_size         = lookup(local.max_instances, terraform.workspace, 2)
  min_size         = 1
  desired_capacity = 1
}
```

### 44. Workspace-aware backup policies

> AWS Backup schedules use cron expressions. Production needs daily backups (regulatory/compliance requirement), while non-production can use weekly — reducing storage cost. The `delete_after` lifecycle configuration sets retention: 35 days for production (monthly + some buffer), 7 days for non-production. Tag-based backup selection reads the `Backup = "true"` tag set in example 18.

```hcl
resource "aws_backup_plan" "main" {
  name = "backup-${terraform.workspace}"

  rule {
    rule_name         = "daily"
    target_vault_name = aws_backup_vault.main.name
    schedule          = terraform.workspace == "production" ? "cron(0 2 * * ? *)" : "cron(0 3 ? * 1 *)"
    # prod: daily at 2am; non-prod: weekly on Monday
    lifecycle {
      delete_after = terraform.workspace == "production" ? 35 : 7
    }
  }
}
```

### 45. Workspace count automation report

> This script generates a resource inventory across all workspaces. Useful for periodic audits: how many resources are in each environment? Are dev workspaces growing unexpectedly? The `tr -d ' *'` strips the leading spaces and asterisks that `workspace list` adds. Schedule this weekly and alert if dev workspace resource count exceeds a threshold.

```bash
#!/bin/bash
echo "Workspace Resource Inventory:"
echo "============================="
for ws in $(terraform workspace list | tr -d ' *'); do
  terraform workspace select "$ws" 2>/dev/null
  count=$(terraform state list 2>/dev/null | wc -l)
  echo "$ws: $count resources"
done
```

### 46. Workspace with feature flags

> Feature flags driven by workspace allow gradual feature rollout. Start with the feature enabled only in `production` (test in real workload), then add it to `staging`, then `default`. Or the reverse: gate new expensive features behind `production` flag so dev/staging don't accidentally incur costs. The `lookup` with a default ensures new workspaces get the conservative `default` config.

```hcl
locals {
  feature_flags = {
    default = {
      enable_advanced_monitoring = false
      enable_vpc_flow_logs       = false
      enable_config_rules        = false
    }
    production = {
      enable_advanced_monitoring = true
      enable_vpc_flow_logs       = true
      enable_config_rules        = true
    }
  }
  flags = lookup(local.feature_flags, terraform.workspace, local.feature_flags["default"])
}

resource "aws_flow_log" "vpc" {
  count           = local.flags.enable_vpc_flow_logs ? 1 : 0
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
}
```

### 47. Workspace in output for visibility

> A structured `deployment_info` output captures the complete deployment context: workspace, region, timestamp, and account ID. This output is invaluable for audit trails — capture it in CI pipelines and store it alongside deployment records. The `timestamp()` function returns the current time in RFC 3339 format; note it changes on every plan, so it's only stable after apply.

```hcl
output "deployment_info" {
  value = {
    workspace   = terraform.workspace
    region      = var.aws_region
    deployed_at = timestamp()
    account_id  = data.aws_caller_identity.current.account_id
  }
}
```

### 48. Per-workspace Terraform variable files

> The variable file pattern combines workspace state isolation with rich per-environment configuration. The workspace provides the state key; the tfvars file provides all the configuration values. This is more maintainable than a giant locals map — environment configs are in separate files, easy to diff and review. The CI pipeline selects both based on the target environment.

```hcl
# variables.tf
variable "environment_config" {
  type = map(any)
}
```
```bash
# environments/production.tfvars
environment_config = {
  instance_type = "t3.large"
  min_size      = 3
  max_size      = 20
  multi_az      = true
}
```
```bash
terraform workspace select production
terraform apply -var-file="environments/production.tfvars"
```

### 49. Workspace + Sentinel policy (Terraform Cloud)

> Sentinel policies in Terraform Cloud enforce governance rules before applies. This Sentinel policy enforces workspace naming conventions — workspaces must start with `dev-`, `staging-`, or `prod-`. Engineers can't create workspaces with arbitrary names that bypass cost allocation tags or monitoring. Sentinel runs after plan but before apply, making it a hard guardrail.

```python
# sentinel/workspace-naming.sentinel
import "tfrun"

# Enforce workspace naming convention
valid_prefixes = ["dev-", "staging-", "prod-"]

workspace_name = tfrun.workspace.name
is_valid = any valid_prefixes as prefix {
  strings.has_prefix(workspace_name, prefix)
}

main = rule { is_valid }
```

### 50. Complete workspace-driven multi-env setup

> The complete workspace-driven configuration: data sources for AWS context, a full environment configuration matrix with all parameters (network, compute, database, features), a safe fallback to `dev` for unknown workspaces, a convenience `is_prod` boolean, and common tags. This `locals` block becomes the single source of truth for all environment differences. Build the rest of the configuration by referencing `local.cfg.*`.

```hcl
# Complete pattern with all workspace-driven configurations

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" { state = "available" }

locals {
  workspace = terraform.workspace
  
  # Environment configuration matrix
  config = {
    dev = {
      cidr            = "10.0.0.0/16"
      instance_type   = "t3.micro"
      db_class        = "db.t3.micro"
      min_size        = 1
      max_size        = 2
      multi_az        = false
      deletion_prot   = false
      enable_nat      = false
      single_nat      = true
      enable_cdn      = false
    }
    staging = {
      cidr            = "10.1.0.0/16"
      instance_type   = "t3.small"
      db_class        = "db.t3.small"
      min_size        = 1
      max_size        = 4
      multi_az        = false
      deletion_prot   = false
      enable_nat      = true
      single_nat      = true
      enable_cdn      = false
    }
    production = {
      cidr            = "10.2.0.0/16"
      instance_type   = "t3.large"
      db_class        = "db.t3.medium"
      min_size        = 3
      max_size        = 20
      multi_az        = true
      deletion_prot   = true
      enable_nat      = true
      single_nat      = false
      enable_cdn      = true
    }
  }
  
  env    = contains(keys(local.config), local.workspace) ? local.workspace : "dev"
  cfg    = local.config[local.env]
  is_prod = local.env == "production"
  
  common_tags = {
    Environment = local.env
    ManagedBy   = "terraform"
    Workspace   = local.workspace
    AccountId   = data.aws_caller_identity.current.account_id
  }
}
```

---

## Key Takeaways

- **Workspaces = isolated state files** — each workspace has its own state; `env:/<workspace>/` prefix in S3; resources can be uniquely named using `terraform.workspace`
- **`terraform.workspace`** is a built-in string available in all HCL expressions — use it for resource names, tags, and configuration lookups
- **`lookup(map, terraform.workspace, default)`** is the safe pattern — provides a fallback for unknown workspace names instead of a plan-time error
- **Shared backend, shared provider** — all workspaces use the same S3 bucket, same AWS credentials; for per-account isolation, use separate directories not workspaces
- **`workspace select || workspace new`** is the idiomatic CI pattern for creating-or-selecting workspaces
- **Ephemeral workspaces** (PR environments) must be explicitly destroyed and deleted — no auto-cleanup without CI pipeline logic
- **Directory-per-environment** is preferred over workspaces when environments need different providers, different module versions, or strict blast radius isolation
- **SSM path namespacing** (`/${terraform.workspace}/app/secret`) is cleaner than separate secret names per environment
- **Sentinel policies** (Terraform Cloud) can enforce workspace naming conventions as a governance guardrail
- **Always document workspace state key paths** — operators need to know where to find state files for manual recovery

---

## Common Interview Questions & Answers

**Q: What are Terraform workspaces and what problem do they solve?**
A: Workspaces allow a single Terraform configuration to manage multiple independent instances of the same infrastructure — each workspace has its own isolated state file. They solve the problem of managing dev/staging/production environments with the same code. Without workspaces, you'd need separate directories or separate state files managed manually. With workspaces, `terraform workspace select production && terraform apply` deploys to production; `terraform workspace select dev && terraform apply` deploys to dev, both using the same code.

**Q: What are the limitations of Terraform workspaces? When would you choose directory-per-environment instead?**
A: Key workspace limitations: (1) All workspaces share the same backend config and provider configuration — you cannot use different AWS accounts per workspace. (2) All workspaces run the same `main.tf` — complex environment differences accumulate as conditional logic that becomes hard to maintain. (3) No native per-workspace variable files without CI tooling. (4) No per-workspace module version pinning. Use directory-per-environment when: environments use different AWS accounts (strong isolation requirement), module versions need to diverge, or teams need clear ownership boundaries between environments.

**Q: How does Terraform store state for different workspaces in S3?**
A: For the S3 backend, the `default` workspace stores state at the literal `key` path specified in the backend config (e.g., `app/terraform.tfstate`). All other workspaces store state at `env:/<workspace>/<key>` (e.g., `env:/staging/app/terraform.tfstate`). This auto-prefixing means a single backend config handles all workspaces automatically — you don't need to change the `key` when switching workspaces. The lock table entry in DynamoDB is the full prefixed path as the `LockID`.

**Q: How do you handle sensitive variables that differ between workspaces?**
A: Several patterns: (1) SSM Parameter Store with workspace-namespaced paths (`/${terraform.workspace}/app/secret`) — each workspace reads its own secrets, IAM policies restrict cross-workspace access. (2) Separate `-var-file` flags in CI (`-var-file="environments/${WORKSPACE}.tfvars"`) where each tfvars file contains environment-specific secrets. (3) For Terraform Cloud, use workspace-scoped variables managed via the TFC console or `tfe_variable` resources. Avoid hardcoding secrets in the workspace-keyed locals map — that would put all environment secrets in the same file.

**Q: Can you use `terraform.workspace` in provider configurations?**
A: Yes, with an important caveat: provider configurations are evaluated before most of the configuration, and `terraform.workspace` is available there. A common pattern is `project = local.projects[terraform.workspace]` in the provider block to select a different GCP project per workspace. However, you cannot use `terraform.workspace` for the `alias` attribute or `required_providers` — those must be static. Also, provider configurations can't reference resource outputs, only locals and variables. For AWS, `assume_role` ARNs can be workspace-driven if the role names follow a convention like `arn:aws:iam::${local.account_ids[terraform.workspace]}:role/TerraformRole`.
