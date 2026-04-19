# Examples 2.2 — Workspaces (50 examples)

---

## Basic

### 1. Create a new workspace
```bash
terraform workspace new development
terraform workspace new staging
terraform workspace new production
```

### 2. List workspaces
```bash
terraform workspace list
# Output:
#   default
# * development   (current)
#   staging
#   production
```

### 3. Select a workspace
```bash
terraform workspace select production
terraform workspace select default
```

### 4. Show current workspace
```bash
terraform workspace show
# Output: production
```

### 5. Delete a workspace
```bash
terraform workspace select default
terraform workspace delete staging
# (cannot delete current workspace)
```

### 6. Reference current workspace in config
```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs-${terraform.workspace}"
}
```

### 7. Workspace in resource naming
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
```bash
# Common patterns:
terraform workspace new dev
terraform workspace new dev-feature-auth
terraform workspace new staging
terraform workspace new prod
terraform workspace new pr-123   # per-PR ephemeral environments
```

### 10. Default workspace usage
```bash
# default workspace is always present and cannot be deleted
terraform workspace select default
terraform workspace show  # default
```

### 11. Init then workspace select
```bash
terraform init
terraform workspace new production
terraform workspace select production
terraform plan
terraform apply
```

### 12. workspace in output
```hcl
output "environment" {
  value = terraform.workspace
}
```

---

## Intermediate

### 13. Workspace-based variable selection with locals
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
```hcl
module "database" {
  source = terraform.workspace == "production" ? "./modules/rds-cluster" : "./modules/rds-single"
  environment = terraform.workspace
}
```

### 21. List workspaces in automation
```bash
# Get current workspace in scripts
CURRENT_WS=$(terraform workspace show)
echo "Deploying to workspace: $CURRENT_WS"

# Check if workspace exists
terraform workspace list | grep -q "staging" && echo "exists" || terraform workspace new staging
```

### 22. Workspace with map variable for per-env domains
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
```hcl
resource "aws_db_instance" "main" {
  deletion_protection = terraform.workspace == "production" ? true : false
  # ...
}
```

### 24. Workspace-conditional NAT gateway
```hcl
resource "aws_nat_gateway" "main" {
  # Only create NAT in production (costly)
  count         = terraform.workspace == "production" ? length(var.private_subnets) : 1
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
}
```

### 25. Workspace-based alarm thresholds
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
```bash
# Create workspace via TFC API
curl -X POST \
  -H "Authorization: Bearer $TFC_TOKEN" \
  -H "Content-Type: application/vnd.api+json" \
  -d '{"data":{"type":"workspaces","attributes":{"name":"pr-456","auto-apply":true}}}' \
  "https://app.terraform.io/api/v2/organizations/my-org/workspaces"
```

### 37. Workspace in GitOps: map branch to workspace
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
