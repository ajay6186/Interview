# Examples 6.2 — Terraform Cloud & Enterprise (50 examples)

## Basic

### 1. Remote Backend Configuration
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "production-aws"
    }
  }
}
```

### 2. TFC Workspace Variables
```hcl
resource "tfe_variable" "aws_region" {
  key          = "AWS_DEFAULT_REGION"
  value        = "us-east-1"
  category     = "env"
  workspace_id = tfe_workspace.main.id
  description  = "AWS default region"
}

resource "tfe_variable" "instance_type" {
  key          = "instance_type"
  value        = "t3.medium"
  category     = "terraform"
  workspace_id = tfe_workspace.main.id
}
```

### 3. Basic Workspace Creation
```hcl
resource "tfe_workspace" "main" {
  name         = "my-app-production"
  organization = "my-org"
  description  = "Production workspace for my-app"

  auto_apply            = false
  file_triggers_enabled = true
  trigger_prefixes      = ["terraform/"]
  working_directory     = "terraform/"
}
```

### 4. Team Creation and Membership
```hcl
resource "tfe_team" "devops" {
  name         = "devops"
  organization = "my-org"

  organization_access {
    manage_workspaces = true
    manage_policies   = false
    manage_vcs_settings = false
  }
}

resource "tfe_team_member" "alice" {
  team_id  = tfe_team.devops.id
  username = "alice"
}
```

### 5. Workspace Team Access
```hcl
resource "tfe_team_access" "devops_production" {
  access       = "write"
  team_id      = tfe_team.devops.id
  workspace_id = tfe_workspace.production.id
}

resource "tfe_team_access" "developers_production" {
  access       = "read"
  team_id      = tfe_team.developers.id
  workspace_id = tfe_workspace.production.id
}
```

### 6. VCS Connection
```hcl
resource "tfe_oauth_client" "github" {
  organization     = "my-org"
  api_url          = "https://api.github.com"
  http_url         = "https://github.com"
  oauth_token      = var.github_token
  service_provider = "github"
}

resource "tfe_workspace" "vcs_connected" {
  name         = "app-production"
  organization = "my-org"

  vcs_repo {
    identifier     = "my-org/infra-repo"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "main"
  }
}
```

### 7. Notification Configuration
```hcl
resource "tfe_notification_configuration" "slack" {
  name             = "slack-notifications"
  enabled          = true
  destination_type = "slack"
  url              = var.slack_webhook_url
  workspace_id     = tfe_workspace.main.id

  triggers = [
    "run:created",
    "run:planning",
    "run:needs_attention",
    "run:applying",
    "run:completed",
    "run:errored",
  ]
}
```

### 8. SSH Key for Modules
```hcl
resource "tfe_ssh_key" "module_access" {
  name         = "github-module-access"
  organization = "my-org"
  key          = var.ssh_private_key
}

resource "tfe_workspace" "with_ssh" {
  name              = "app-staging"
  organization      = "my-org"
  ssh_key_id        = tfe_ssh_key.module_access.id
  working_directory = "terraform/"
}
```

### 9. Variable Set
```hcl
resource "tfe_variable_set" "aws_credentials" {
  name         = "AWS Production Credentials"
  description  = "Shared AWS credentials for production workspaces"
  organization = "my-org"
  global       = false
}

resource "tfe_variable" "aws_access_key" {
  key             = "AWS_ACCESS_KEY_ID"
  value           = var.aws_access_key
  category        = "env"
  sensitive       = true
  variable_set_id = tfe_variable_set.aws_credentials.id
}

resource "tfe_variable" "aws_secret_key" {
  key             = "AWS_SECRET_ACCESS_KEY"
  value           = var.aws_secret_key
  category        = "env"
  sensitive       = true
  variable_set_id = tfe_variable_set.aws_credentials.id
}
```

### 10. Workspace Variable Set Assignment
```hcl
resource "tfe_workspace_variable_set" "production" {
  variable_set_id = tfe_variable_set.aws_credentials.id
  workspace_id    = tfe_workspace.production.id
}

resource "tfe_workspace_variable_set" "staging" {
  variable_set_id = tfe_variable_set.aws_credentials.id
  workspace_id    = tfe_workspace.staging.id
}
```

### 11. Remote State Access
```hcl
data "terraform_remote_state" "vpc" {
  backend = "remote"

  config = {
    organization = "my-org"
    workspaces = {
      name = "vpc-production"
    }
  }
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.app.id
  instance_type = "t3.medium"
  subnet_id     = data.terraform_remote_state.vpc.outputs.private_subnet_ids[0]
}
```

### 12. Run Trigger
```hcl
resource "tfe_workspace" "upstream" {
  name         = "vpc-production"
  organization = "my-org"
}

resource "tfe_workspace" "downstream" {
  name         = "app-production"
  organization = "my-org"
}

resource "tfe_run_trigger" "app_on_vpc" {
  workspace_id  = tfe_workspace.downstream.id
  sourceable_id = tfe_workspace.upstream.id
}
```

## Intermediate

### 13. Dynamic Credentials for AWS (OIDC)
```hcl
resource "tfe_workspace" "dynamic_creds" {
  name         = "aws-dynamic-creds"
  organization = "my-org"
}

resource "tfe_variable" "enable_aws_provider_auth" {
  key          = "TFC_AWS_PROVIDER_AUTH"
  value        = "true"
  category     = "env"
  workspace_id = tfe_workspace.dynamic_creds.id
}

resource "tfe_variable" "aws_role_arn" {
  key          = "TFC_AWS_RUN_ROLE_ARN"
  value        = aws_iam_role.tfc_role.arn
  category     = "env"
  workspace_id = tfe_workspace.dynamic_creds.id
}

# IAM OIDC Provider for TFC
resource "aws_iam_openid_connect_provider" "tfc" {
  url = "https://app.terraform.io"

  client_id_list = [
    "aws.workload.identity",
  ]

  thumbprint_list = [
    "9e99a48a9960b14926bb7f3b02e22da2b0ab7280",
  ]
}

resource "aws_iam_role" "tfc_role" {
  name = "terraform-cloud-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.tfc.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "app.terraform.io:aud" = "aws.workload.identity"
          }
          StringLike = {
            "app.terraform.io:sub" = "organization:my-org:project:*:workspace:*:run_phase:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "tfc_admin" {
  role       = aws_iam_role.tfc_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
```

### 14. Sentinel Policy Set
```hcl
resource "tfe_policy_set" "security" {
  name          = "security-policies"
  description   = "Security guardrails for all workspaces"
  organization  = "my-org"
  kind          = "sentinel"
  agent_enabled = false

  vcs_repo {
    identifier     = "my-org/sentinel-policies"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "main"
  }

  workspace_ids = [
    tfe_workspace.production.id,
    tfe_workspace.staging.id,
  ]
}
```

### 15. OPA Policy Set
```hcl
resource "tfe_policy_set" "opa_compliance" {
  name         = "opa-compliance"
  description  = "OPA compliance policies"
  organization = "my-org"
  kind         = "opa"

  vcs_repo {
    identifier     = "my-org/opa-policies"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "main"
    ingress_submodules = false
  }
}

resource "tfe_policy_set_parameter" "allowed_regions" {
  key           = "allowed_regions"
  value         = jsonencode(["us-east-1", "us-west-2"])
  policy_set_id = tfe_policy_set.opa_compliance.id
}
```

### 16. TFC Agent Pool
```hcl
resource "tfe_agent_pool" "private_network" {
  name         = "private-network-agents"
  organization = "my-org"
}

resource "tfe_agent_token" "agent_1" {
  agent_pool_id = tfe_agent_pool.private_network.id
  description   = "Agent 1 token"
}

resource "tfe_workspace" "private" {
  name            = "private-network-workspace"
  organization    = "my-org"
  agent_pool_id   = tfe_agent_pool.private_network.id
  execution_mode  = "agent"
}

# ECS Task for TFC Agent
resource "aws_ecs_task_definition" "tfc_agent" {
  family                   = "tfc-agent"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024

  container_definitions = jsonencode([
    {
      name  = "tfc-agent"
      image = "hashicorp/tfc-agent:latest"
      environment = [
        {
          name  = "TFC_AGENT_TOKEN"
          value = tfe_agent_token.agent_1.token
        },
        {
          name  = "TFC_AGENT_NAME"
          value = "ecs-agent"
        }
      ]
    }
  ])
}
```

### 17. Private Module Registry
```hcl
resource "tfe_registry_module" "vpc" {
  organization = "my-org"

  vcs_repo {
    display_identifier = "my-org/terraform-aws-vpc"
    identifier         = "my-org/terraform-aws-vpc"
    oauth_token_id     = tfe_oauth_client.github.oauth_token_id
  }
}

# Usage in workspace
# module "vpc" {
#   source  = "app.terraform.io/my-org/vpc/aws"
#   version = "1.2.0"
# }
```

### 18. Workspace with Auto-Apply on Tag
```hcl
locals {
  environments = {
    production = {
      auto_apply        = false
      trigger_prefixes  = ["terraform/prod/"]
      working_directory = "terraform/prod/"
    }
    staging = {
      auto_apply        = true
      trigger_prefixes  = ["terraform/staging/"]
      working_directory = "terraform/staging/"
    }
    development = {
      auto_apply        = true
      trigger_prefixes  = ["terraform/dev/"]
      working_directory = "terraform/dev/"
    }
  }
}

resource "tfe_workspace" "environments" {
  for_each = local.environments

  name              = "app-${each.key}"
  organization      = "my-org"
  auto_apply        = each.value.auto_apply
  trigger_prefixes  = each.value.trigger_prefixes
  working_directory = each.value.working_directory

  vcs_repo {
    identifier     = "my-org/infra"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = each.key == "production" ? "main" : each.key
  }
}
```

### 19. Cost Estimation Configuration
```hcl
resource "tfe_organization" "main" {
  name  = "my-org"
  email = "admin@example.com"

  cost_estimation_enabled = true
  send_passing_statuses_for_untriggered_speculative_plans = true
}

# Sentinel policy to enforce cost limits
# policy "limit-monthly-cost" {
#   rule = rule {
#     cost_estimate.proposed_monthly_cost < 1000
#   }
# }
```

### 20. Workspace Health Assessment
```hcl
resource "tfe_workspace" "health_assessed" {
  name         = "health-monitored"
  organization = "my-org"

  assessments_enabled = true
  auto_apply          = false
}

resource "tfe_notification_configuration" "health_alerts" {
  name             = "health-drift-alerts"
  enabled          = true
  destination_type = "slack"
  url              = var.slack_webhook_url
  workspace_id     = tfe_workspace.health_assessed.id

  triggers = [
    "assessment:check_failed",
    "assessment:drifted",
    "assessment:failed",
  ]
}
```

### 21. Stack Configuration (Stacks Preview)
```hcl
# TFC Stack for multi-layer deployments
resource "tfe_stack" "platform" {
  name         = "platform-stack"
  project_id   = tfe_project.platform.id
  description  = "Multi-component platform stack"

  vcs_repo {
    identifier     = "my-org/platform-stack"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "main"
  }
}
```

### 22. Project Organization
```hcl
resource "tfe_project" "platform" {
  name         = "Platform"
  organization = "my-org"
}

resource "tfe_project" "applications" {
  name         = "Applications"
  organization = "my-org"
}

resource "tfe_workspace" "vpc" {
  name         = "platform-vpc"
  organization = "my-org"
  project_id   = tfe_project.platform.id
}

resource "tfe_workspace" "app" {
  name         = "myapp-production"
  organization = "my-org"
  project_id   = tfe_project.applications.id
}
```

### 23. Team Project Access
```hcl
resource "tfe_team_project_access" "platform_devops" {
  access     = "admin"
  team_id    = tfe_team.devops.id
  project_id = tfe_project.platform.id
}

resource "tfe_team_project_access" "apps_developers" {
  access     = "write"
  team_id    = tfe_team.developers.id
  project_id = tfe_project.applications.id
}

resource "tfe_team_project_access" "security_readonly" {
  access     = "read"
  team_id    = tfe_team.security.id
  project_id = tfe_project.platform.id
}
```

### 24. Workspace Tags
```hcl
resource "tfe_workspace" "tagged" {
  name         = "app-production"
  organization = "my-org"
  tag_names    = ["production", "app", "aws", "us-east-1"]
}

data "tfe_workspace_ids" "production" {
  organization = "my-org"
  tag_names    = ["production"]
}

resource "tfe_variable_set" "prod_vars" {
  name         = "Production Variables"
  organization = "my-org"
  workspace_ids = values(data.tfe_workspace_ids.production.ids)
}
```

### 25. TFC API Automation with null_resource
```hcl
resource "null_resource" "trigger_run" {
  triggers = {
    workspace_id = tfe_workspace.main.id
    timestamp    = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      curl -s \
        --header "Authorization: Bearer ${var.tfc_token}" \
        --header "Content-Type: application/vnd.api+json" \
        --request POST \
        --data '{"data":{"attributes":{"is-destroy":false,"message":"Triggered by automation"},"type":"runs","relationships":{"workspace":{"data":{"type":"workspaces","id":"${tfe_workspace.main.id}"}}}}}' \
        https://app.terraform.io/api/v2/runs
    EOT
  }
}
```

## Nested

### 26. Multi-Environment Workspace Factory
```hcl
variable "applications" {
  type = map(object({
    repo              = string
    working_directory = string
    environments      = list(string)
    auto_apply_envs   = list(string)
  }))
}

locals {
  workspace_matrix = flatten([
    for app_name, app in var.applications : [
      for env in app.environments : {
        key               = "${app_name}-${env}"
        name              = "${app_name}-${env}"
        repo              = app.repo
        working_directory = "${app.working_directory}/${env}"
        auto_apply        = contains(app.auto_apply_envs, env)
        tags              = [app_name, env, "managed-by-tfc-factory"]
      }
    ]
  ])

  workspaces = { for ws in local.workspace_matrix : ws.key => ws }
}

resource "tfe_workspace" "app_environments" {
  for_each = local.workspaces

  name              = each.value.name
  organization      = var.tfc_organization
  project_id        = tfe_project.apps.id
  auto_apply        = each.value.auto_apply
  working_directory = each.value.working_directory
  tag_names         = each.value.tags

  vcs_repo {
    identifier     = each.value.repo
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "main"
  }
}

resource "tfe_workspace_variable_set" "shared_creds" {
  for_each = local.workspaces

  variable_set_id = tfe_variable_set.aws_credentials.id
  workspace_id    = tfe_workspace.app_environments[each.key].id
}
```

### 27. Nested Run Trigger Chain
```hcl
locals {
  pipeline = {
    foundation = {
      name = "foundation"
      upstream = []
    }
    networking = {
      name = "networking"
      upstream = ["foundation"]
    }
    security = {
      name = "security"
      upstream = ["foundation"]
    }
    platform = {
      name = "platform"
      upstream = ["networking", "security"]
    }
    applications = {
      name = "applications"
      upstream = ["platform"]
    }
  }
}

resource "tfe_workspace" "pipeline" {
  for_each = local.pipeline

  name         = "prod-${each.key}"
  organization = "my-org"
  project_id   = tfe_project.infrastructure.id
}

resource "tfe_run_trigger" "pipeline_triggers" {
  for_each = {
    for pair in flatten([
      for ws_name, ws in local.pipeline : [
        for upstream in ws.upstream : {
          key       = "${upstream}-to-${ws_name}"
          workspace = ws_name
          source    = upstream
        }
      ]
    ]) : pair.key => pair
  }

  workspace_id  = tfe_workspace.pipeline[each.value.workspace].id
  sourceable_id = tfe_workspace.pipeline[each.value.source].id
}
```

### 28. Dynamic Variable Sets per Environment
```hcl
variable "environment_configs" {
  type = map(object({
    aws_account_id = string
    aws_role_arn   = string
    region         = string
    log_level      = string
  }))
}

resource "tfe_variable_set" "env_config" {
  for_each = var.environment_configs

  name         = "${upper(each.key)} Environment Config"
  description  = "Configuration variables for ${each.key}"
  organization = "my-org"
}

resource "tfe_variable" "aws_account" {
  for_each = var.environment_configs

  key             = "TF_VAR_aws_account_id"
  value           = each.value.aws_account_id
  category        = "env"
  variable_set_id = tfe_variable_set.env_config[each.key].id
}

resource "tfe_variable" "role_arn" {
  for_each = var.environment_configs

  key             = "TFC_AWS_RUN_ROLE_ARN"
  value           = each.value.aws_role_arn
  category        = "env"
  sensitive       = true
  variable_set_id = tfe_variable_set.env_config[each.key].id
}

resource "tfe_variable" "region" {
  for_each = var.environment_configs

  key             = "TF_VAR_aws_region"
  value           = each.value.region
  category        = "env"
  variable_set_id = tfe_variable_set.env_config[each.key].id
}
```

### 29. Sentinel Policy with Workspace Exclusions
```hcl
data "tfe_workspace_ids" "excluded" {
  organization = "my-org"
  tag_names    = ["sentinel-exempt"]
}

resource "tfe_policy_set" "global_security" {
  name         = "global-security"
  organization = "my-org"
  global       = true

  vcs_repo {
    identifier     = "my-org/sentinel-policies"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "main"
    ingress_submodules = false
  }
}

resource "tfe_policy_set_parameter" "excluded_workspaces" {
  key           = "exempt_workspace_ids"
  value         = jsonencode(values(data.tfe_workspace_ids.excluded.ids))
  policy_set_id = tfe_policy_set.global_security.id
}
```

### 30. Complex Team Permission Model
```hcl
variable "teams" {
  type = map(object({
    members = list(string)
    manage_workspaces = bool
    manage_policies   = bool
  }))
  default = {
    platform-admins = {
      members           = ["alice", "bob"]
      manage_workspaces = true
      manage_policies   = true
    }
    developers = {
      members           = ["charlie", "dave", "eve"]
      manage_workspaces = false
      manage_policies   = false
    }
    security = {
      members           = ["frank"]
      manage_workspaces = false
      manage_policies   = true
    }
  }
}

resource "tfe_team" "teams" {
  for_each = var.teams

  name         = each.key
  organization = "my-org"

  organization_access {
    manage_workspaces   = each.value.manage_workspaces
    manage_policies     = each.value.manage_policies
    manage_vcs_settings = false
    read_workspaces     = true
  }
}

resource "tfe_team_members" "memberships" {
  for_each = var.teams

  team_id   = tfe_team.teams[each.key].id
  usernames = each.value.members
}

locals {
  project_team_access = {
    "platform-platform-admins" = { team = "platform-admins", project = "platform", access = "admin" }
    "platform-developers"      = { team = "developers",       project = "platform", access = "read" }
    "apps-developers"          = { team = "developers",       project = "applications", access = "write" }
    "apps-platform-admins"     = { team = "platform-admins", project = "applications", access = "admin" }
  }
}

resource "tfe_team_project_access" "access" {
  for_each = local.project_team_access

  access     = each.value.access
  team_id    = tfe_team.teams[each.value.team].id
  project_id = tfe_project.projects[each.value.project].id
}
```

### 31. Audit Log Streaming
```hcl
resource "tfe_audit_trail_token" "splunk" {
  organization = "my-org"
}

resource "aws_kinesis_firehose_delivery_stream" "tfc_audit" {
  name        = "tfc-audit-logs"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.audit_logs.arn
    prefix     = "tfc-audit/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
  }
}

resource "aws_lambda_function" "tfc_audit_forwarder" {
  function_name = "tfc-audit-forwarder"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_audit.arn
  filename      = data.archive_file.audit_forwarder.output_path

  environment {
    variables = {
      TFC_AUDIT_TOKEN   = tfe_audit_trail_token.splunk.token
      FIREHOSE_NAME     = aws_kinesis_firehose_delivery_stream.tfc_audit.name
      TFC_ORGANIZATION  = "my-org"
    }
  }
}

resource "aws_cloudwatch_event_rule" "audit_poll" {
  name                = "tfc-audit-poll"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "audit_lambda" {
  rule = aws_cloudwatch_event_rule.audit_poll.name
  arn  = aws_lambda_function.tfc_audit_forwarder.arn
}
```

### 32. Private Module Registry with Versioning
```hcl
locals {
  modules = {
    vpc = {
      repo    = "my-org/terraform-aws-vpc"
      display = "my-org/terraform-aws-vpc"
    }
    eks = {
      repo    = "my-org/terraform-aws-eks"
      display = "my-org/terraform-aws-eks"
    }
    rds = {
      repo    = "my-org/terraform-aws-rds"
      display = "my-org/terraform-aws-rds"
    }
    ecs = {
      repo    = "my-org/terraform-aws-ecs"
      display = "my-org/terraform-aws-ecs"
    }
  }
}

resource "tfe_registry_module" "modules" {
  for_each = local.modules

  organization = "my-org"

  vcs_repo {
    display_identifier = each.value.display
    identifier         = each.value.repo
    oauth_token_id     = tfe_oauth_client.github.oauth_token_id
  }
}
```

### 33. Cost Estimation with Sentinel Enforcement
```hcl
# sentinel/enforce-cost-limit.sentinel
# import "tfrun"
#
# main = rule {
#   tfrun.cost_estimate.proposed_monthly_cost_change < 500.00
# }

resource "tfe_policy" "cost_limit" {
  name         = "cost-change-limit"
  description  = "Limit monthly cost increase to $500"
  organization = "my-org"
  kind         = "sentinel"
  policy       = file("${path.module}/sentinel/enforce-cost-limit.sentinel")
  enforce_mode = "soft-mandatory"
}

resource "tfe_policy_set" "cost_governance" {
  name         = "cost-governance"
  organization = "my-org"

  policy_ids = [tfe_policy.cost_limit.id]

  workspace_ids = [
    tfe_workspace.production.id,
  ]
}
```

## Advanced

### 34. Full TFC Organization Bootstrap
```hcl
module "tfc_organization" {
  source = "./modules/tfc-org"

  organization_name = "my-org"
  admin_email       = "admin@example.com"

  github_token = var.github_token
  tfc_token    = var.tfc_token

  projects = {
    platform     = { description = "Platform infrastructure" }
    applications = { description = "Application workspaces" }
    security     = { description = "Security tooling" }
  }

  teams = {
    platform-admins = {
      members          = ["alice", "bob"]
      org_access_level = "admin"
    }
    developers = {
      members          = ["charlie", "dave", "eve"]
      org_access_level = "read"
    }
  }

  variable_sets = {
    aws-production = {
      global = false
      variables = {
        TFC_AWS_PROVIDER_AUTH    = { value = "true",     sensitive = false, category = "env" }
        TFC_AWS_RUN_ROLE_ARN     = { value = var.prod_role_arn, sensitive = true, category = "env" }
        TF_VAR_environment       = { value = "production", sensitive = false, category = "env" }
      }
    }
  }

  sentinel_policies = {
    require-tags = {
      repo   = "my-org/sentinel-policies"
      branch = "main"
      enforce_mode = "hard-mandatory"
    }
  }
}
```

### 35. Workspace State Migration Automation
```hcl
resource "null_resource" "migrate_state" {
  for_each = var.workspaces_to_migrate

  triggers = {
    workspace_id = each.value.new_workspace_id
  }

  provisioner "local-exec" {
    command = <<-EOT
      #!/bin/bash
      set -euo pipefail

      # Pull state from old workspace
      OLD_STATE=$(curl -s \
        -H "Authorization: Bearer ${var.tfc_token}" \
        "https://app.terraform.io/api/v2/workspaces/${each.value.old_workspace_id}/current-state-version" \
        | jq -r '.data.links["hosted-state-download-url"]')

      # Download state
      curl -s -o /tmp/state-${each.key}.json "$OLD_STATE"

      # Create new state version in new workspace
      STATE_CONTENT=$(cat /tmp/state-${each.key}.json | base64 -w 0)
      STATE_MD5=$(md5sum /tmp/state-${each.key}.json | awk '{print $1}')

      curl -s \
        -H "Authorization: Bearer ${var.tfc_token}" \
        -H "Content-Type: application/vnd.api+json" \
        -X POST \
        -d "{\"data\":{\"type\":\"state-versions\",\"attributes\":{\"serial\":1,\"md5\":\"$STATE_MD5\",\"state\":\"$STATE_CONTENT\"}}}" \
        "https://app.terraform.io/api/v2/workspaces/${each.value.new_workspace_id}/state-versions"

      echo "Migration complete for ${each.key}"
    EOT
  }
}
```

### 36. Enterprise Compliance Framework
```hcl
module "tfc_compliance" {
  source = "./modules/tfc-compliance"

  organization = "my-org"

  required_tags = {
    Environment  = ["production", "staging", "development"]
    Owner        = null  # any value
    CostCenter   = null
    ManagedBy    = ["terraform"]
  }

  encryption_requirements = {
    require_kms_encryption    = true
    allowed_kms_key_patterns  = ["arn:aws:kms:*:${var.aws_account_id}:key/*"]
    require_s3_encryption     = true
  }

  network_requirements = {
    deny_public_s3_buckets    = true
    require_vpc_endpoints     = true
    allowed_regions           = ["us-east-1", "us-west-2"]
  }

  cost_limits = {
    max_monthly_cost_change = 1000
    max_total_monthly_cost  = 50000
    require_cost_estimation = true
  }

  audit_config = {
    enable_audit_streaming = true
    splunk_hec_endpoint    = var.splunk_endpoint
    splunk_token           = var.splunk_token
  }
}
```

### 37. TFC Workspace GitOps with Atlantis-Style Workflow
```hcl
resource "tfe_workspace" "gitops" {
  for_each = var.workspace_configs

  name              = each.key
  organization      = "my-org"
  auto_apply        = false
  working_directory = each.value.working_directory

  vcs_repo {
    identifier                 = var.infra_repo
    oauth_token_id             = tfe_oauth_client.github.oauth_token_id
    branch                     = "main"
    ingress_submodules         = false
    tags_regex                 = null
  }

  trigger_prefixes = [each.value.working_directory]

  queue_all_runs   = false
  speculative_enabled = true
}

resource "tfe_notification_configuration" "pr_notifications" {
  for_each = var.workspace_configs

  name             = "pr-status-${each.key}"
  enabled          = true
  destination_type = "generic"
  url              = "${var.notification_endpoint}/tfc/${each.key}"
  workspace_id     = tfe_workspace.gitops[each.key].id
  token            = var.notification_token

  triggers = [
    "run:created",
    "run:planning",
    "run:planned",
    "run:needs_attention",
    "run:applying",
    "run:completed",
    "run:errored",
    "run:canceled",
  ]
}
```

### 38. Multi-Organization TFC Management
```hcl
variable "tfc_organizations" {
  type = map(object({
    email             = string
    github_org        = string
    aws_master_account = string
  }))
}

provider "tfe" {
  alias = "org_a"
  token = var.tfc_token_org_a
}

provider "tfe" {
  alias = "org_b"
  token = var.tfc_token_org_b
}

module "org_a_setup" {
  source = "./modules/tfc-org-setup"
  providers = {
    tfe = tfe.org_a
  }

  organization      = "org-a"
  admin_email       = "admin@org-a.com"
  github_token      = var.github_token_org_a
  aws_account_id    = var.aws_account_id_org_a
}

module "org_b_setup" {
  source = "./modules/tfc-org-setup"
  providers = {
    tfe = tfe.org_b
  }

  organization      = "org-b"
  admin_email       = "admin@org-b.com"
  github_token      = var.github_token_org_b
  aws_account_id    = var.aws_account_id_org_b
}
```

### 39. TFC + AWS Service Catalog Integration
```hcl
resource "aws_servicecatalog_portfolio" "terraform_products" {
  name          = "Terraform Self-Service"
  description   = "Self-service infrastructure via Terraform Cloud"
  provider_name = "Platform Team"
}

resource "aws_servicecatalog_product" "vpc" {
  name             = "VPC"
  owner            = "platform-team"
  type             = "CLOUD_FORMATION_TEMPLATE"
  description      = "Provision a VPC via TFC workspace"

  provisioning_artifact_parameters {
    template_url = "https://s3.amazonaws.com/${aws_s3_bucket.templates.bucket}/vpc-product.yaml"
    type         = "CLOUD_FORMATION_TEMPLATE"
    name         = "v1.0"
  }
}

# CloudFormation template triggers TFC API
# vpc-product.yaml creates a Lambda that calls TFC API
# to create a workspace and trigger a run
resource "aws_lambda_function" "tfc_provisioner" {
  function_name = "service-catalog-tfc-provisioner"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.tfc_provisioner.arn
  filename      = data.archive_file.tfc_provisioner.output_path
  timeout       = 300

  environment {
    variables = {
      TFC_TOKEN        = var.tfc_token
      TFC_ORGANIZATION = "my-org"
      TFC_PROJECT_ID   = tfe_project.self_service.id
      VCS_OAUTH_TOKEN  = tfe_oauth_client.github.oauth_token_id
    }
  }
}
```

### 40. Disaster Recovery Workspace Failover
```hcl
locals {
  dr_workspace_pairs = {
    "app-production" = {
      primary   = "us-east-1"
      secondary = "us-west-2"
    }
    "data-production" = {
      primary   = "us-east-1"
      secondary = "eu-west-1"
    }
  }
}

resource "tfe_workspace" "primary" {
  for_each = local.dr_workspace_pairs

  name         = "${each.key}-primary"
  organization = "my-org"
  tag_names    = ["primary", each.value.primary]
}

resource "tfe_workspace" "secondary" {
  for_each = local.dr_workspace_pairs

  name         = "${each.key}-secondary"
  organization = "my-org"
  tag_names    = ["secondary", "dr", each.value.secondary]
  auto_apply   = false
}

resource "tfe_variable" "primary_region" {
  for_each = local.dr_workspace_pairs

  key          = "aws_region"
  value        = each.value.primary
  category     = "terraform"
  workspace_id = tfe_workspace.primary[each.key].id
}

resource "tfe_variable" "secondary_region" {
  for_each = local.dr_workspace_pairs

  key          = "aws_region"
  value        = each.value.secondary
  category     = "terraform"
  workspace_id = tfe_workspace.secondary[each.key].id
}
```

### 41. TFC Ephemeral Workspace Pattern
```hcl
resource "tfe_workspace" "ephemeral" {
  name         = "pr-${var.pr_number}-${var.feature_name}"
  organization = "my-org"
  auto_apply   = true
  auto_destroy_at = timeadd(timestamp(), "72h")

  tag_names = ["ephemeral", "pr-${var.pr_number}", "feature"]

  vcs_repo {
    identifier     = "my-org/app-infra"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
    branch         = "pr/${var.pr_number}"
  }
}

resource "tfe_variable" "pr_environment" {
  key          = "environment"
  value        = "pr-${var.pr_number}"
  category     = "terraform"
  workspace_id = tfe_workspace.ephemeral.id
}

resource "tfe_workspace_variable_set" "pr_creds" {
  variable_set_id = tfe_variable_set.dev_credentials.id
  workspace_id    = tfe_workspace.ephemeral.id
}
```

### 42. TFC Agent on ECS with Auto-Scaling
```hcl
resource "tfe_agent_pool" "ecs_agents" {
  name         = "ecs-agent-pool"
  organization = "my-org"
}

resource "tfe_agent_token" "ecs" {
  count         = var.agent_count
  agent_pool_id = tfe_agent_pool.ecs_agents.id
  description   = "ECS agent ${count.index + 1}"
}

resource "aws_ecs_service" "tfc_agents" {
  name            = "tfc-agents"
  cluster         = aws_ecs_cluster.agents.id
  task_definition = aws_ecs_task_definition.tfc_agent.arn
  launch_type     = "FARGATE"
  desired_count   = 2

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.tfc_agents.id]
    assign_public_ip = false
  }
}

resource "aws_appautoscaling_target" "tfc_agents" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.agents.name}/${aws_ecs_service.tfc_agents.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_cloudwatch_metric_alarm" "tfc_queue_depth" {
  alarm_name          = "tfc-agent-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TFCAgentQueueDepth"
  namespace           = "Custom/TFC"
  period              = 60
  statistic           = "Maximum"
  threshold           = 5

  alarm_actions = [aws_appautoscaling_policy.scale_up.arn]
}
```

### 43. Cross-Org Module Sharing via Registry
```hcl
# In source org: publish module
resource "tfe_registry_module" "shared_vpc" {
  organization = "platform-org"

  vcs_repo {
    identifier     = "platform-org/terraform-aws-vpc"
    display_identifier = "platform-org/terraform-aws-vpc"
    oauth_token_id = tfe_oauth_client.github.oauth_token_id
  }
}

# In consumer org: access via no-code module
resource "tfe_no_code_module" "vpc_no_code" {
  organization    = "consumer-org"
  registry_module = tfe_registry_module.shared_vpc.id

  variable_options {
    name    = "environment"
    type    = "string"
    options = ["production", "staging", "development"]
  }

  variable_options {
    name    = "instance_tenancy"
    type    = "string"
    options = ["default", "dedicated"]
  }
}
```

### 44. TFC Policy-as-Code CI Pipeline
```hcl
resource "aws_codepipeline" "sentinel_ci" {
  name     = "sentinel-policy-ci"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "SourceAction"
      category         = "Source"
      owner            = "ThirdParty"
      provider         = "GitHub"
      version          = "2"
      output_artifacts = ["source_output"]

      configuration = {
        Owner      = "my-org"
        Repo       = "sentinel-policies"
        Branch     = "main"
        OAuthToken = var.github_token
      }
    }
  }

  stage {
    name = "Test"
    action {
      name             = "SentinelTest"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["test_output"]

      configuration = {
        ProjectName = aws_codebuild_project.sentinel_test.name
      }
    }
  }

  stage {
    name = "Deploy"
    action {
      name            = "UpdatePolicies"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source_output"]

      configuration = {
        ProjectName = aws_codebuild_project.tfc_policy_deploy.name
      }
    }
  }
}
```

### 45. Workspace Drift Detection and Auto-Remediation
```hcl
resource "aws_lambda_function" "drift_remediator" {
  function_name = "tfc-drift-remediator"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_tfc.arn
  filename      = data.archive_file.drift_remediator.output_path
  timeout       = 300

  environment {
    variables = {
      TFC_TOKEN         = var.tfc_token
      TFC_ORGANIZATION  = "my-org"
      SNS_TOPIC_ARN     = aws_sns_topic.drift_alerts.arn
      PAGERDUTY_KEY     = var.pagerduty_key
    }
  }
}

resource "aws_cloudwatch_event_rule" "tfc_health_check" {
  name                = "tfc-workspace-health"
  description         = "Check TFC workspace drift"
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "drift_check" {
  rule = aws_cloudwatch_event_rule.tfc_health_check.name
  arn  = aws_lambda_function.drift_remediator.arn
}

# Lambda checks /api/v2/workspaces?organization_name=my-org
# for workspaces with assessments_enabled=true and drift detected
# Then triggers a new run to remediate
```

### 46. Complete TFC Enterprise Landing Zone
```hcl
module "tfc_enterprise_lz" {
  source = "./modules/tfc-enterprise-lz"

  # Organization setup
  org_name    = "enterprise-org"
  admin_email = "terraform-admin@company.com"

  # SSO integration
  sso_provider = "okta"
  okta_domain  = "company.okta.com"

  # VCS
  github_org   = "company"
  github_token = var.github_token

  # Projects and teams
  business_units = {
    platform = {
      teams = {
        admins = { members = ["alice", "bob"],  access = "admin" }
        ops    = { members = ["charlie"],        access = "write" }
      }
    }
    ecommerce = {
      teams = {
        backend   = { members = ["dave", "eve"],  access = "write" }
        frontend  = { members = ["frank"],         access = "write" }
        readonly  = { members = ["grace"],         access = "read" }
      }
    }
  }

  # Compliance
  sentinel_policies_repo = "company/sentinel-policies"
  opa_policies_repo      = "company/opa-policies"
  enforce_cost_limits    = true
  max_monthly_cost       = 10000

  # Dynamic credentials
  aws_accounts = {
    production = {
      account_id = "111111111111"
      role_arn   = "arn:aws:iam::111111111111:role/TerraformCloud"
    }
    staging = {
      account_id = "222222222222"
      role_arn   = "arn:aws:iam::222222222222:role/TerraformCloud"
    }
  }

  # Audit
  audit_log_bucket   = aws_s3_bucket.audit.bucket
  audit_log_role_arn = aws_iam_role.audit.arn

  # Agents
  agent_pools = {
    production-vpc = {
      subnet_ids  = var.prod_private_subnets
      agent_count = 3
    }
  }
}
```

### 47. TFC Workspace Tagging Strategy for Cost Attribution
```hcl
locals {
  cost_centers = {
    "CC001" = "platform"
    "CC002" = "ecommerce"
    "CC003" = "data"
    "CC004" = "security"
  }

  workspace_taxonomy = {
    for ws_name, ws in var.workspace_configs : ws_name => {
      tags = concat(
        [ws.environment, ws.team, ws.application],
        [for cc, dept in local.cost_centers : "cost-center-${cc}" if dept == ws.department],
        ws.environment == "production" ? ["pci-in-scope"] : [],
        ws.data_classification == "confidential" ? ["data-confidential"] : [],
      )
    }
  }
}

resource "tfe_workspace" "attributed" {
  for_each = var.workspace_configs

  name         = each.key
  organization = "my-org"
  tag_names    = local.workspace_taxonomy[each.key].tags
}

resource "tfe_variable" "cost_tags" {
  for_each = var.workspace_configs

  key      = "TF_VAR_cost_tags"
  value    = jsonencode({
    CostCenter    = each.value.cost_center
    Department    = each.value.department
    Application   = each.value.application
    Environment   = each.value.environment
    ManagedBy     = "terraform-cloud"
  })
  category     = "env"
  workspace_id = tfe_workspace.attributed[each.key].id
}
```

### 48. TFC + Terraform Enterprise High Availability
```hcl
# Terraform Enterprise on AWS with HA active-active
module "tfe_ha" {
  source  = "hashicorp/terraform-enterprise/aws"
  version = "~> 5.0"

  friendly_name_prefix  = "company-tfe"
  domain_name           = "tfe.company.com"
  tfe_license_file_path = var.tfe_license_path

  # Active-Active HA
  node_count = 3
  
  # External services
  operational_mode    = "external"
  
  # RDS PostgreSQL
  db_cluster_instance_class = "db.r6g.xlarge"
  db_username               = "tfe"
  db_password               = var.db_password
  
  # Redis for coordination
  redis_node_type = "cache.r6g.large"
  
  # S3 for object storage
  object_storage_s3_use_instance_profile = true
  
  # Networking
  vpc_id                = module.vpc.vpc_id
  lb_subnet_ids         = module.vpc.public_subnet_ids
  ec2_subnet_ids        = module.vpc.private_subnet_ids
  db_subnet_ids         = module.vpc.database_subnet_ids
  
  # DNS
  create_route53_alias_record = true
  route53_zone_name           = "company.com"
  
  # ACM Certificate
  acm_certificate_arn = module.acm.acm_certificate_arn
}
```

### 49. TFC Workspace Policy Gate with Human Approval
```hcl
resource "tfe_workspace" "gated" {
  name         = "production-critical"
  organization = "my-org"
  auto_apply   = false
}

# Sentinel policy requiring manual override for large changes
# policies/require-approval.sentinel:
# import "tfrun"
# import "http"
#
# approval_required = tfrun.cost_estimate.proposed_monthly_cost_change > 500 or
#   length(tfrun.variables) > 20
#
# main = rule {
#   not approval_required or (tfrun.is_destroy == false)
# }

resource "tfe_policy" "change_gate" {
  name         = "change-size-gate"
  organization = "my-org"
  kind         = "sentinel"
  policy       = file("${path.module}/policies/require-approval.sentinel")
  enforce_mode = "soft-mandatory"
}

resource "tfe_notification_configuration" "approval_required" {
  name             = "approval-required-notification"
  enabled          = true
  destination_type = "slack"
  url              = var.slack_ops_webhook
  workspace_id     = tfe_workspace.gated.id

  triggers = ["run:needs_attention"]
}
```

### 50. Complete TFC Enterprise Workspace Platform
```hcl
module "tfc_platform" {
  source = "./modules/tfc-platform"

  organization = "enterprise"

  workspaces = {
    "network-production" = {
      project      = "platform"
      vcs_repo     = "enterprise/network-infra"
      vcs_branch   = "main"
      working_dir  = "terraform/production"
      auto_apply   = false
      tags         = ["network", "production", "critical"]
      variable_sets = ["aws-production", "global-tags"]
      teams = {
        network-admins = "admin"
        developers     = "read"
      }
      notifications = {
        slack = { webhook = var.network_slack_webhook, triggers = ["run:errored", "run:needs_attention"] }
      }
      assessments  = true
      policies     = ["security-baseline", "cost-governance", "tagging-compliance"]
    }

    "app-production" = {
      project      = "applications"
      vcs_repo     = "enterprise/app-infra"
      vcs_branch   = "main"
      working_dir  = "terraform/production"
      auto_apply   = false
      tags         = ["app", "production", "pci"]
      variable_sets = ["aws-production", "global-tags", "app-config"]
      teams = {
        app-team    = "write"
        security    = "read"
        developers  = "read"
      }
      run_triggers = ["network-production"]
      notifications = {
        slack     = { webhook = var.app_slack_webhook,  triggers = ["run:completed", "run:errored"] }
        pagerduty = { webhook = var.pd_webhook,          triggers = ["run:errored"] }
      }
      assessments  = true
      policies     = ["security-baseline", "cost-governance", "tagging-compliance", "pci-compliance"]
    }
  }

  sentinel_repos = {
    "security-baseline"    = { repo = "enterprise/sentinel-security",    branch = "main" }
    "cost-governance"      = { repo = "enterprise/sentinel-cost",        branch = "main" }
    "tagging-compliance"   = { repo = "enterprise/sentinel-tagging",     branch = "main" }
    "pci-compliance"       = { repo = "enterprise/sentinel-pci",         branch = "main" }
  }

  agents = {
    "production-agents" = {
      count       = 5
      subnet_ids  = var.prod_subnets
      cluster_arn = aws_ecs_cluster.agents.arn
    }
  }
}
```
