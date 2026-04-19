# Examples 6.1 — Multi-Account Strategy (50 examples)

---

## Basic

### 1. AWS Organizations creation
```hcl
resource "aws_organizations_organization" "main" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "guardduty.amazonaws.com",
    "securityhub.amazonaws.com",
    "sso.amazonaws.com"
  ]

  feature_set = "ALL"  # Enables SCPs
}
```

### 2. Organizational Unit (OU)
```hcl
resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_organizational_unit" "security" {
  name      = "Security"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_organizational_unit" "sandbox" {
  name      = "Sandbox"
  parent_id = aws_organizations_organization.main.roots[0].id
}
```

### 3. Member account creation
```hcl
resource "aws_organizations_account" "development" {
  name      = "development"
  email     = "aws-dev@example.com"
  parent_id = aws_organizations_organizational_unit.workloads.id

  tags = {
    Environment = "development"
    CostCenter  = "engineering"
  }
}
```

### 4. SCP — deny non-approved regions
```hcl
resource "aws_organizations_policy" "deny_regions" {
  name = "DenyNonApprovedRegions"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyUnapprovedRegions"
      Effect = "Deny"
      NotAction = ["iam:*", "sts:*", "route53:*", "cloudfront:*", "waf:*", "support:*", "trustedadvisor:*"]
      Resource = "*"
      Condition = {
        StringNotEquals = {
          "aws:RequestedRegion" = ["us-east-1", "us-west-2", "eu-west-1"]
        }
        ArnNotLike = {
          "aws:PrincipalARN" = ["arn:aws:iam::*:role/OrganizationAccountAccessRole"]
        }
      }
    }]
  })
}
```

### 5. SCP policy attachment to OU
```hcl
resource "aws_organizations_policy_attachment" "deny_regions" {
  policy_id = aws_organizations_policy.deny_regions.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
```

### 6. Provider alias for member account
```hcl
provider "aws" {
  alias  = "dev"
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::${aws_organizations_account.development.id}:role/OrganizationAccountAccessRole"
  }
}

resource "aws_s3_bucket" "dev_state" {
  provider = aws.dev
  bucket   = "tfstate-dev-${aws_organizations_account.development.id}"
}
```

### 7. Cross-account IAM role
```hcl
resource "aws_iam_role" "cross_account" {
  name     = "CrossAccountReadOnly"
  provider = aws.member_account

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${var.management_account_id}:root" }
      Action    = "sts:AssumeRole"
      Condition = {
        Bool = { "aws:MultiFactorAuthPresent" = "true" }
      }
    }]
  })
}
```

### 8. Consolidated billing tags
```hcl
resource "aws_organizations_account" "prod" {
  name      = "production"
  email     = "aws-prod@example.com"
  parent_id = aws_organizations_organizational_unit.workloads.id

  tags = {
    Environment  = "production"
    CostCenter   = "product"
    BusinessUnit = "core-platform"
    Owner        = "platform-team"
  }
}
```

### 9. AWS SSO/Identity Center setup
```hcl
data "aws_ssoadmin_instances" "main" {}

resource "aws_ssoadmin_permission_set" "admin" {
  name             = "AdministratorAccess"
  description      = "Full admin for platform team"
  instance_arn     = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  session_duration = "PT4H"
}

resource "aws_ssoadmin_managed_policy_attachment" "admin" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  managed_policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
  permission_set_arn = aws_ssoadmin_permission_set.admin.arn
}
```

### 10. Organization-level CloudTrail
```hcl
resource "aws_cloudtrail" "org" {
  name                          = "org-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  is_organization_trail         = true
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn
}
```

### 11. Delegated admin account
```hcl
resource "aws_organizations_delegated_administrator" "guardduty" {
  account_id        = aws_organizations_account.security.id
  service_principal = "guardduty.amazonaws.com"
}

resource "aws_organizations_delegated_administrator" "securityhub" {
  account_id        = aws_organizations_account.security.id
  service_principal = "securityhub.amazonaws.com"
}
```

### 12. Budget alert for account
```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "monthly-budget"
  budget_type  = "COST"
  limit_amount = "1000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["billing@example.com"]
  }
}
```

---

## Intermediate

### 13. Nested OU hierarchy
```hcl
locals {
  ou_structure = {
    "Root" = {
      parent = "root"
      children = ["Security", "Infrastructure", "Workloads", "Sandbox"]
    }
    "Workloads" = {
      parent = "Root"
      children = ["Production", "Development", "Staging"]
    }
  }
}

resource "aws_organizations_organizational_unit" "ous" {
  for_each = {
    Security       = aws_organizations_organization.main.roots[0].id
    Infrastructure = aws_organizations_organization.main.roots[0].id
    Workloads      = aws_organizations_organization.main.roots[0].id
    Sandbox        = aws_organizations_organization.main.roots[0].id
    Production     = aws_organizations_organizational_unit.workloads.id
    Development    = aws_organizations_organizational_unit.workloads.id
  }

  name      = each.key
  parent_id = each.value
}
```

### 14. Account vending machine pattern
```hcl
module "account_factory" {
  source = "./modules/account-factory"

  for_each = var.accounts

  name          = each.key
  email         = each.value.email
  ou_id         = aws_organizations_organizational_unit.ous[each.value.ou].id
  budget_limit  = each.value.budget_limit

  baseline_config = {
    cloudtrail       = true
    config           = true
    guardduty        = true
    securityhub      = true
    vpc_flow_logs    = true
    default_vpc_delete = true
  }

  tags = merge(local.common_tags, each.value.tags)
}
```

### 15. Shared VPC (hub-spoke)
```hcl
# Hub VPC in shared-services account
resource "aws_vpc" "hub" {
  provider   = aws.shared_services
  cidr_block = "10.0.0.0/16"
  tags       = { Name = "hub-vpc" }
}

# Share VPC subnets with workload accounts via RAM
resource "aws_ram_resource_share" "vpc_subnets" {
  provider                  = aws.shared_services
  name                      = "shared-vpc-subnets"
  allow_external_principals = false
}

resource "aws_ram_resource_association" "subnets" {
  for_each = toset(aws_subnet.shared[*].arn)

  provider           = aws.shared_services
  resource_arn       = each.value
  resource_share_arn = aws_ram_resource_share.vpc_subnets.arn
}

resource "aws_ram_principal_association" "workloads" {
  for_each = toset(var.workload_account_ids)

  provider           = aws.shared_services
  principal          = each.value
  resource_share_arn = aws_ram_resource_share.vpc_subnets.arn
}
```

### 16. Transit Gateway for multi-account
```hcl
resource "aws_ec2_transit_gateway" "main" {
  provider    = aws.network_account
  description = "Central Transit Gateway"

  auto_accept_shared_attachments  = "enable"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"

  tags = { Name = "central-tgw" }
}

resource "aws_ram_resource_share" "tgw" {
  provider = aws.network_account
  name     = "transit-gateway-share"
}

resource "aws_ram_resource_association" "tgw" {
  provider           = aws.network_account
  resource_arn       = aws_ec2_transit_gateway.main.arn
  resource_share_arn = aws_ram_resource_share.tgw.arn
}
```

### 17. AWS Config organizational rules
```hcl
resource "aws_config_organization_conformance_pack" "security" {
  name = "security-baseline"

  template_body = <<-EOF
    Parameters:
      AccessKeysRotatedParamMaxAccessKeyAge:
        Type: String
        Default: "90"
    Resources:
      AWSConfigRuleAccessKeysRotated:
        Type: AWS::Config::ConfigRule
        Properties:
          ConfigRuleName: access-keys-rotated
          Source:
            Owner: AWS
            SourceIdentifier: ACCESS_KEYS_ROTATED
      AWSConfigRuleMFAEnabled:
        Type: AWS::Config::ConfigRule
        Properties:
          ConfigRuleName: mfa-enabled
          Source:
            Owner: AWS
            SourceIdentifier: MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS
  EOF

  depends_on = [aws_organizations_delegated_administrator.config]
}
```

### 18. GuardDuty organization
```hcl
resource "aws_guardduty_organization_admin_account" "main" {
  admin_account_id = var.security_account_id
}

resource "aws_guardduty_organization_configuration" "main" {
  provider    = aws.security_account
  auto_enable_organization_members = "ALL"
  detector_id = aws_guardduty_detector.security.id

  datasources {
    s3_logs { auto_enable = true }
    kubernetes { audit_logs { enable = true } }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes { auto_enable = true }
      }
    }
  }
}
```

### 19. AWS Firewall Manager
```hcl
resource "aws_fms_admin_account" "main" {
  account_id = var.security_account_id
}

resource "aws_fms_policy" "waf" {
  provider   = aws.security_account
  name       = "org-waf-policy"
  exclude_resource_tags = false
  remediation_enabled   = true

  security_service_policy_data {
    type = "WAFV2"
    managed_service_data = jsonencode({
      type              = "WAFV2"
      preProcessRuleGroups = [{
        managedRuleGroupIdentifier = {
          vendorName         = "AWS"
          managedRuleGroupName = "AWSManagedRulesCommonRuleSet"
        }
        overrideAction = { type = "NONE" }
        ruleGroupArn   = null
        excludeRules   = []
        ruleGroupType  = "ManagedRuleGroup"
      }]
      postProcessRuleGroups = []
      defaultAction         = { type = "ALLOW" }
      overrideCustomerWebACLAssociation = false
    })
  }

  include_map {
    account = var.workload_account_ids
  }
}
```

### 20. Cross-account S3 access
```hcl
resource "aws_s3_bucket_policy" "cross_account" {
  provider = aws.shared_services
  bucket   = aws_s3_bucket.shared_artifacts.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = [for id in var.workload_account_ids : "arn:aws:iam::${id}:root"] }
      Action    = ["s3:GetObject", "s3:ListBucket"]
      Resource  = [aws_s3_bucket.shared_artifacts.arn, "${aws_s3_bucket.shared_artifacts.arn}/*"]
      Condition = {
        StringEquals = { "aws:PrincipalOrgID" = aws_organizations_organization.main.id }
      }
    }]
  })
}
```

### 21. Organization-level Security Hub
```hcl
resource "aws_securityhub_organization_admin_account" "main" {
  admin_account_id = var.security_account_id
}

resource "aws_securityhub_organization_configuration" "main" {
  provider    = aws.security_account
  auto_enable = true

  auto_enable_standards = "NONE"
}
```

### 22. Cross-account KMS
```hcl
resource "aws_kms_key" "shared" {
  provider    = aws.shared_services
  description = "Shared encryption key for all accounts"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable root"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.shared_services_account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow org accounts"
        Effect = "Allow"
        Principal = { AWS = "*" }
        Action   = ["kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"]
        Resource = "*"
        Condition = {
          StringEquals = { "aws:PrincipalOrgID" = aws_organizations_organization.main.id }
        }
      }
    ]
  })
}
```

### 23. AWS Config aggregator
```hcl
resource "aws_config_configuration_aggregator" "org" {
  name = "org-aggregator"

  organization_aggregation_source {
    all_regions = true
    role_arn    = aws_iam_role.config_aggregator.arn
  }
}
```

### 24. Cross-account ECR access
```hcl
resource "aws_ecr_repository_policy" "cross_account" {
  provider   = aws.shared_services
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowOrgAccounts"
      Effect = "Allow"
      Principal = { AWS = "*" }
      Action = [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
      Condition = {
        StringEquals = { "aws:PrincipalOrgID" = var.org_id }
      }
    }]
  })
}
```

### 25. Cost allocation tags enforcement via SCP
```hcl
resource "aws_organizations_policy" "require_tags" {
  name = "RequireCostAllocationTags"
  type = "TAG_POLICY"

  content = jsonencode({
    tags = {
      Environment = {
        tag_key = {
          "@@assign" = "Environment"
        }
        tag_value = {
          "@@assign" = ["production", "staging", "development", "sandbox"]
        }
        enforced_for = {
          "@@assign" = ["ec2:instance", "s3:bucket", "rds:db"]
        }
      }
    }
  })
}
```

---

## Nested

### 26. Complete account factory module
```hcl
module "accounts" {
  source = "./modules/account-factory"

  for_each = var.account_configs

  # Account details
  name          = each.key
  email         = each.value.email
  parent_ou_id  = aws_organizations_organizational_unit.ous[each.value.ou].id

  # Baseline services
  baseline = {
    cloudtrail_bucket  = aws_s3_bucket.cloudtrail.id
    config_bucket      = aws_s3_bucket.config.id
    guardduty_enabled  = true
    securityhub_enabled = true
    default_vpc_delete = true
    vpc_flow_logs      = true
  }

  # IAM roles
  roles = {
    sso_admin     = aws_ssoadmin_permission_set.admin.arn
    sso_developer = aws_ssoadmin_permission_set.developer.arn
    break_glass   = true
  }

  # Networking
  network = {
    tgw_share_arn  = aws_ram_resource_share.tgw.arn
    vpc_cidr       = each.value.vpc_cidr
    subnet_cidrs   = each.value.subnet_cidrs
  }

  # Budget
  budget = {
    monthly_limit    = each.value.monthly_budget
    alert_threshold  = 80
    alert_email      = each.value.billing_email
  }

  tags = merge(local.common_tags, each.value.tags)
}
```

### 27. Multi-account Terraform state management
```hcl
locals {
  accounts = {
    management      = { id = var.management_account_id,      region = "us-east-1" }
    network         = { id = var.network_account_id,         region = "us-east-1" }
    shared_services = { id = var.shared_services_account_id, region = "us-east-1" }
    security        = { id = var.security_account_id,        region = "us-east-1" }
    production      = { id = var.production_account_id,      region = "us-east-1" }
    staging         = { id = var.staging_account_id,         region = "us-east-1" }
    development     = { id = var.development_account_id,     region = "us-east-1" }
  }
}

resource "aws_s3_bucket" "tfstate" {
  for_each = local.accounts
  provider = aws.management

  bucket = "tfstate-${each.key}-${each.value.id}"
}

resource "aws_dynamodb_table" "tflock" {
  for_each = local.accounts
  provider = aws.management

  name         = "tflock-${each.key}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### 28. Cross-account pipeline
```hcl
resource "aws_codepipeline" "cross_account" {
  provider = aws.tools_account
  name     = "cross-account-deploy"
  role_arn = aws_iam_role.pipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
    encryption_key {
      id   = aws_kms_key.pipeline.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source"]
      configuration    = { RepositoryName = "app", BranchName = "main" }
    }
  }

  stage {
    name = "Deploy-Staging"
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "CloudFormation"
      version         = "1"
      input_artifacts = ["source"]
      role_arn        = "arn:aws:iam::${var.staging_account_id}:role/PipelineDeployRole"
      configuration = {
        ActionMode    = "CREATE_UPDATE"
        StackName     = "app-stack"
        TemplatePath  = "source::template.yaml"
        RoleArn       = "arn:aws:iam::${var.staging_account_id}:role/CloudFormationRole"
      }
    }
  }
}
```

### 29. Landing zone with guardrails
```hcl
module "landing_zone" {
  source = "./modules/landing-zone"

  org_id             = aws_organizations_organization.main.id
  management_account = var.management_account_id

  accounts = {
    security        = { ou = "Security",        baseline = "security" }
    network         = { ou = "Infrastructure",  baseline = "network" }
    shared_services = { ou = "Infrastructure",  baseline = "shared" }
  }

  guardrails = {
    preventive = [
      "deny-non-approved-regions",
      "deny-root-account",
      "require-mfa-for-console",
      "deny-public-s3"
    ]
    detective = [
      "cloudtrail-enabled",
      "config-enabled",
      "mfa-enabled",
      "no-public-rds"
    ]
  }

  log_archive_account_id     = var.log_archive_account_id
  cloudtrail_bucket          = aws_s3_bucket.cloudtrail.id
  config_bucket              = aws_s3_bucket.config.id

  identity_center_instance   = tolist(data.aws_ssoadmin_instances.main.arns)[0]

  tags = local.common_tags
}
```

### 30. AWS Firewall Manager with hierarchical policies
```hcl
module "org_security" {
  source = "./modules/org-security"

  providers = {
    aws.security = aws.security_account
    aws.root     = aws.management_account
  }

  fms_admin_account = var.security_account_id
  org_id            = var.org_id

  waf_policies = {
    global = {
      include_accounts = "all"
      rules = ["AWSManagedRulesCommonRuleSet", "AWSManagedRulesAmazonIpReputationList"]
    }
    external_facing = {
      include_accounts = var.production_account_ids
      rules = ["AWSManagedRulesBotControlRuleSet"]
    }
  }

  shield_advanced = {
    enabled         = true
    resource_types  = ["CloudFront", "Route53HostedZone", "ElasticLoadBalancingV2"]
  }
}
```

### 31. Cross-account monitoring aggregation
```hcl
resource "aws_cloudwatch_metric_stream" "to_security" {
  for_each = {
    production  = { account = aws_organizations_account.production,  provider = aws.production }
    staging     = { account = aws_organizations_account.staging,     provider = aws.staging }
    development = { account = aws_organizations_account.development, provider = aws.development }
  }

  provider       = each.value.provider
  name           = "metrics-to-security"
  role_arn       = aws_iam_role.metric_stream[each.key].arn
  firehose_arn   = aws_kinesis_firehose_delivery_stream.security_metrics.arn
  output_format  = "opentelemetry0.7"
}
```

### 32. Org-level cost management
```hcl
resource "aws_ce_anomaly_monitor" "org" {
  name              = "org-anomaly-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "org" {
  name      = "org-anomaly-alerts"
  frequency = "DAILY"

  monitor_arn_list = [aws_ce_anomaly_monitor.org.arn]

  subscriber {
    address = "billing@example.com"
    type    = "EMAIL"
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["100"]  # Alert if anomaly > $100
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}
```

### 33. Service catalog for self-service account vending
```hcl
resource "aws_servicecatalog_portfolio" "account_factory" {
  name          = "Account Factory"
  description   = "Self-service account creation"
  provider_name = "Platform Team"
}

resource "aws_servicecatalog_product" "new_account" {
  name        = "AWS Account"
  description = "Provision a new AWS account with baseline configuration"
  owner       = "Platform Team"
  type        = "CLOUD_FORMATION_TEMPLATE"

  provisioning_artifact_parameters {
    template_url = "https://s3.amazonaws.com/${aws_s3_bucket.catalog.id}/account-template.yaml"
    type         = "CLOUD_FORMATION_TEMPLATE"
    name         = "v1.0"
  }
}
```

---

## Advanced

### 34. Complete multi-account landing zone
```hcl
module "org_landing_zone" {
  source = "./modules/org-landing-zone"

  org_name    = "mycompany"
  root_email  = "aws-root@mycompany.com"
  log_region  = "us-east-1"

  ou_structure = {
    Security = {
      accounts = {
        "log-archive" = { email = "aws-logs@mycompany.com" }
        "security-tooling" = { email = "aws-security@mycompany.com" }
      }
    }
    Infrastructure = {
      accounts = {
        "network"         = { email = "aws-network@mycompany.com" }
        "shared-services" = { email = "aws-shared@mycompany.com" }
      }
    }
    Workloads = {
      children = {
        Production  = { accounts = { "prod" = { email = "aws-prod@mycompany.com", budget = 10000 } } }
        NonProd     = {
          accounts = {
            "staging" = { email = "aws-staging@mycompany.com", budget = 2000 }
            "dev"     = { email = "aws-dev@mycompany.com", budget = 1000 }
          }
        }
      }
    }
    Sandbox = {
      accounts = {
        "sandbox" = { email = "aws-sandbox@mycompany.com", budget = 500 }
      }
    }
  }

  guardrails = {
    approved_regions   = ["us-east-1", "us-west-2", "eu-west-1"]
    require_mfa        = true
    deny_root          = true
    require_encryption = true
    deny_public_s3     = true
  }

  baseline_services = {
    cloudtrail    = true
    config        = true
    guardduty     = true
    securityhub   = true
    macie         = true
    access_analyzer = true
    inspector     = true
  }

  identity_provider = {
    type         = "OKTA"
    metadata_url = var.okta_metadata_url
    permission_sets = {
      Admin     = { accounts = ["management"], duration = "PT1H" }
      Developer = { accounts = ["dev", "staging"], duration = "PT8H" }
      ReadOnly  = { accounts = ["prod", "staging", "dev"], duration = "PT8H" }
    }
  }

  networking = {
    tgw_asn   = 65000
    vpcs = {
      inspection = { cidr = "10.0.0.0/16", account = "network" }
      shared     = { cidr = "10.1.0.0/16", account = "shared-services" }
    }
  }

  compliance = {
    frameworks = ["CIS", "PCI-DSS", "HIPAA"]
    report_bucket = "compliance-reports"
  }

  tags = local.org_tags
}
```

### 35. Account closure and cleanup automation
```hcl
resource "aws_lambda_function" "account_cleaner" {
  function_name = "account-lifecycle-manager"
  runtime       = "python3.12"
  handler       = "lifecycle.handler"
  role          = aws_iam_role.account_manager.arn
  filename      = "account-lifecycle.zip"
  timeout       = 300

  environment {
    variables = {
      ORG_ID               = aws_organizations_organization.main.id
      MANAGEMENT_ACCOUNT   = var.management_account_id
      NOTIFICATION_TOPIC   = aws_sns_topic.account_lifecycle.arn
    }
  }
}

resource "aws_cloudwatch_event_rule" "account_events" {
  name = "org-account-events"

  event_pattern = jsonencode({
    source      = ["aws.organizations"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["organizations.amazonaws.com"]
      eventName   = ["CreateAccount", "CloseAccount", "MoveAccount"]
    }
  })
}
```

### 36. Organization SCPs with exception patterns
```hcl
locals {
  scp_exceptions = [
    "arn:aws:iam::*:role/OrganizationAccountAccessRole",
    "arn:aws:iam::*:role/BreakGlassAdmin",
    "arn:aws:iam::*:role/TerraformDeployRole"
  ]
}

resource "aws_organizations_policy" "require_imdsv2" {
  name = "RequireIMDSv2"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyOldMetadataService"
      Effect = "Deny"
      Action = ["ec2:RunInstances"]
      Resource = "arn:aws:ec2:*:*:instance/*"
      Condition = {
        StringNotEquals = {
          "ec2:MetadataHttpTokens" = "required"
        }
        ArnNotLike = {
          "aws:PrincipalARN" = local.scp_exceptions
        }
      }
    }]
  })
}
```

### 37. Multi-account security posture dashboard
```hcl
module "security_posture" {
  source = "./modules/security-posture"

  security_account_id = var.security_account_id
  member_accounts     = var.all_account_ids
  org_id              = var.org_id

  services = {
    securityhub   = { enabled = true, standards = ["CIS", "PCI", "NIST"] }
    guardduty     = { enabled = true, auto_enable = true }
    inspector     = { enabled = true, resource_types = ["ECR", "EC2", "LAMBDA"] }
    macie         = { enabled = true }
    config        = { enabled = true, retention_days = 365 }
    access_analyzer = { enabled = true }
  }

  dashboard = {
    create     = true
    name       = "org-security-posture"
    auto_refresh = true
  }

  alerting = {
    critical_findings_topic = aws_sns_topic.security_critical.arn
    high_findings_topic     = aws_sns_topic.security_high.arn
    siem_integration        = { type = "splunk", endpoint = var.splunk_endpoint }
  }

  compliance = {
    report_schedule = "cron(0 8 1 * ? *)"  # Monthly
    report_bucket   = aws_s3_bucket.compliance_reports.id
    frameworks      = ["CIS-1.4", "PCI-DSS-3.2.1", "NIST-800-53"]
  }
}
```

### 38. Cross-account CodeArtifact
```hcl
resource "aws_codeartifact_domain" "main" {
  provider   = aws.shared_services
  domain     = "mycompany"
  encryption_key = aws_kms_key.codeartifact.arn
}

resource "aws_codeartifact_domain_permissions_policy" "cross_account" {
  provider = aws.shared_services
  domain   = aws_codeartifact_domain.main.domain

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "*" }
      Action    = ["codeartifact:GetAuthorizationToken", "codeartifact:GetRepositoryEndpoint", "codeartifact:ReadFromRepository"]
      Resource  = "*"
      Condition = {
        StringEquals = { "aws:PrincipalOrgID" = var.org_id }
      }
    }]
  })
}
```

### 39. Multi-account Terraform workspace strategy
```bash
# Directory structure for multi-account Terraform
# accounts/
#   management/
#     main.tf  -> root org config
#   security/
#     main.tf  -> security tooling
#   network/
#     main.tf  -> TGW, shared VPCs
#   production/
#     main.tf  -> workload resources
#   staging/
#     main.tf  -> workload resources

# Each account directory has its own backend config:
# backend "s3" {
#   bucket         = "tfstate-management-123456789"
#   key            = "accounts/production/terraform.tfstate"
#   region         = "us-east-1"
#   dynamodb_table = "tflock-management"
#   role_arn       = "arn:aws:iam::MGMT_ACCOUNT:role/TerraformStateRole"
# }

terraform workspace new production
terraform workspace select production
terraform apply -var-file=production.tfvars
```

### 40. AWS Control Tower guardrails via Terraform
```hcl
# Control Tower manages baseline via AWS-native APIs
# Use aws_controltower_control to enable specific guardrails:

resource "aws_controltower_control" "disallow_root_access_key" {
  control_identifier = "arn:aws:controltower:us-east-1::control/AWS-GR_RESTRICT_ROOT_USER_ACCESS_KEYS"
  target_identifier  = aws_organizations_organizational_unit.workloads.arn
}

resource "aws_controltower_control" "require_cloudtrail" {
  control_identifier = "arn:aws:controltower:us-east-1::control/AWS-GR_AUDIT_BUCKET_PUBLIC_READ_PROHIBITED"
  target_identifier  = aws_organizations_organizational_unit.workloads.arn
}
```

### 41. Organization-level cost optimization
```hcl
module "org_cost_management" {
  source = "./modules/org-cost"

  management_account_id = var.management_account_id
  member_accounts       = var.all_account_ids

  budgets = {
    org_total    = { limit = 50000, threshold = [80, 100] }
    per_account  = { limit = 5000,  threshold = [80, 100] }
  }

  savings_plans = {
    compute  = { amount = 10000, term = "ONE_YEAR",  payment = "PARTIAL_UPFRONT" }
    ec2      = { amount = 5000,  term = "THREE_YEAR", payment = "ALL_UPFRONT" }
  }

  reserved_instances = {
    rds    = { instance_type = "db.r6g.large", count = 10, region = "us-east-1" }
    cache  = { instance_type = "cache.r6g.large", count = 6, region = "us-east-1" }
  }

  anomaly_detection = {
    enabled   = true
    threshold = 500  # Alert if daily cost anomaly > $500
    email     = "billing@example.com"
  }

  cost_allocation_tags = ["Environment", "Team", "Project", "CostCenter"]
  enforce_tags         = true

  reports = {
    bucket   = aws_s3_bucket.cost_reports.id
    schedule = "DAILY"
    granularity = "HOURLY"
  }
}
```

### 42. Automated compliance reporting
```hcl
resource "aws_lambda_function" "compliance_reporter" {
  function_name = "org-compliance-reporter"
  runtime       = "python3.12"
  handler       = "reporter.handler"
  role          = aws_iam_role.compliance_reporter.arn
  filename      = "compliance-reporter.zip"
  timeout       = 300

  environment {
    variables = {
      ORG_ID              = aws_organizations_organization.main.id
      REPORT_BUCKET       = aws_s3_bucket.compliance_reports.id
      SECURITYHUB_ACCOUNT = var.security_account_id
      NOTIFICATION_TOPIC  = aws_sns_topic.compliance.arn
    }
  }
}

resource "aws_cloudwatch_event_rule" "monthly_compliance" {
  name                = "monthly-compliance-report"
  schedule_expression = "cron(0 8 1 * ? *)"
}
```

### 43. VPC Lattice for multi-account service mesh
```hcl
resource "aws_vpclattice_service_network" "main" {
  provider    = aws.network_account
  name        = "org-service-network"
  auth_type   = "AWS_IAM"
}

resource "aws_ram_resource_share" "lattice" {
  provider = aws.network_account
  name     = "lattice-service-network"
}

resource "aws_ram_resource_association" "lattice" {
  provider           = aws.network_account
  resource_arn       = aws_vpclattice_service_network.main.arn
  resource_share_arn = aws_ram_resource_share.lattice.arn
}

resource "aws_ram_principal_association" "lattice_accounts" {
  for_each           = toset(var.workload_account_ids)
  provider           = aws.network_account
  principal          = each.value
  resource_share_arn = aws_ram_resource_share.lattice.arn
}
```

### 44. Org-level patch management
```hcl
resource "aws_ssm_patch_baseline" "org" {
  name             = "org-approved-patches"
  operating_system = "AMAZON_LINUX_2"
  description      = "Org-wide patch baseline"

  approval_rule {
    approve_after_days = 7
    compliance_level   = "CRITICAL"
    enable_non_security = false

    patch_filter {
      key    = "PRODUCT"
      values = ["AmazonLinux2"]
    }

    patch_filter {
      key    = "CLASSIFICATION"
      values = ["Security", "Bugfix"]
    }

    patch_filter {
      key    = "SEVERITY"
      values = ["Critical", "Important"]
    }
  }
}

resource "aws_ssm_patch_group" "all" {
  baseline_id = aws_ssm_patch_baseline.org.id
  patch_group = "all"
}
```

### 45. Event bus for cross-account events
```hcl
resource "aws_cloudwatch_event_bus" "central" {
  provider = aws.security_account
  name     = "central-events"
}

resource "aws_cloudwatch_event_bus_policy" "allow_org" {
  provider   = aws.security_account
  event_bus_name = aws_cloudwatch_event_bus.central.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowOrg"
      Effect = "Allow"
      Principal = { AWS = "*" }
      Action   = "events:PutEvents"
      Resource = aws_cloudwatch_event_bus.central.arn
      Condition = {
        StringEquals = { "aws:PrincipalOrgID" = var.org_id }
      }
    }]
  })
}

resource "aws_cloudwatch_event_rule" "forward_to_central" {
  name           = "forward-to-security"
  event_bus_name = "default"

  event_pattern = jsonencode({
    source = ["aws.guardduty", "aws.securityhub", "aws.config"]
  })
}

resource "aws_cloudwatch_event_target" "central" {
  rule           = aws_cloudwatch_event_rule.forward_to_central.name
  arn            = aws_cloudwatch_event_bus.central.arn
  role_arn       = aws_iam_role.event_bridge_cross_account.arn
}
```

### 46. Terraform module registry for org
```hcl
resource "aws_s3_bucket" "module_registry" {
  provider = aws.shared_services
  bucket   = "terraform-modules-${var.org_id}"
}

resource "aws_s3_bucket_policy" "module_access" {
  provider = aws.shared_services
  bucket   = aws_s3_bucket.module_registry.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "*" }
      Action    = ["s3:GetObject", "s3:ListBucket"]
      Resource  = [aws_s3_bucket.module_registry.arn, "${aws_s3_bucket.module_registry.arn}/*"]
      Condition = {
        StringEquals = { "aws:PrincipalOrgID" = var.org_id }
      }
    }]
  })
}
```

### 47. Organization SCP hierarchy
```hcl
locals {
  scps = {
    root = [
      "deny-root-actions",
      "deny-non-approved-regions",
      "require-mfa-for-console"
    ]
    workloads = [
      "deny-public-s3",
      "require-imdsv2",
      "deny-unencrypted-storage"
    ]
    production = [
      "deny-delete-without-approval",
      "deny-resize-without-approval"
    ]
    sandbox = [
      "restrict-expensive-instances",
      "deny-expensive-services"
    ]
  }
}

resource "aws_organizations_policy_attachment" "scps" {
  for_each = { for item in flatten([
    for scope, policies in local.scps : [
      for policy in policies : { scope = scope, policy = policy }
    ]
  ]) : "${item.scope}-${item.policy}" => item }

  policy_id = aws_organizations_policy.scps[each.value.policy].id
  target_id = (each.value.scope == "root"
    ? aws_organizations_organization.main.roots[0].id
    : aws_organizations_organizational_unit.ous[each.value.scope].id
  )
}
```

### 48. Centralized logging architecture
```hcl
module "centralized_logging" {
  source = "./modules/centralized-logging"

  providers = {
    aws.log_account = aws.log_archive
    aws.management  = aws.management_account
  }

  log_account_id    = var.log_archive_account_id
  member_accounts   = var.all_account_ids
  org_id            = var.org_id
  retention_years   = 7

  log_types = {
    cloudtrail = { enabled = true, is_organization_trail = true }
    config     = { enabled = true }
    vpc_flow   = { enabled = true, traffic_type = "REJECT" }
    alb_access = { enabled = true }
    guardduty  = { enabled = true }
    waf        = { enabled = true }
  }

  encryption = {
    kms_key_arn = aws_kms_key.logs.arn
  }

  siem_integration = {
    type        = "opensearch"
    endpoint    = var.opensearch_endpoint
    role_arn    = aws_iam_role.log_forwarder.arn
  }

  tags = local.common_tags
}
```

### 49. Organization data residency compliance
```hcl
resource "aws_organizations_policy" "data_residency_eu" {
  name = "EU-DataResidency"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyNonEURegions"
        Effect = "Deny"
        Action = ["s3:CreateBucket", "rds:CreateDBInstance", "dynamodb:CreateTable"]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = ["eu-west-1", "eu-central-1", "eu-north-1"]
          }
        }
      }
    ]
  })
}

resource "aws_organizations_policy_attachment" "eu_accounts" {
  for_each  = toset(var.eu_account_ids)
  policy_id = aws_organizations_policy.data_residency_eu.id
  target_id = each.value
}
```

### 50. Complete multi-account governance
```hcl
module "org_governance" {
  source = "./modules/org-governance"

  org_name           = "mycompany"
  management_account = var.management_account_id
  org_id             = var.org_id

  structure = {
    ous = local.ou_hierarchy
    accounts = local.account_configs
  }

  identity = {
    provider         = "OKTA"
    sso_instance_arn = tolist(data.aws_ssoadmin_instances.main.arns)[0]
    permission_sets  = local.permission_sets
    group_assignments = local.group_assignments
  }

  guardrails = {
    approved_regions   = ["us-east-1", "us-west-2", "eu-west-1"]
    require_mfa        = true
    deny_root          = true
    require_imdsv2     = true
    deny_public_s3     = true
    deny_public_rds    = true
    require_encryption = true
    cost_limits        = { per_account = 10000, total = 100000 }
  }

  baseline_services = {
    cloudtrail           = { enabled = true }
    config               = { enabled = true, retention_years = 7 }
    guardduty            = { enabled = true, auto_enable = true }
    securityhub          = { enabled = true, standards = ["CIS-1.4", "PCI-DSS"] }
    macie               = { enabled = true }
    access_analyzer      = { enabled = true }
    inspector           = { enabled = true }
  }

  networking = {
    tgw_enabled        = true
    vpc_sharing        = true
    dns_centralized    = true
    firewall_enabled   = true
  }

  monitoring = {
    centralized_logs    = true
    cross_account_metrics = true
    siem_endpoint       = var.siem_endpoint
    alert_email         = "platform@mycompany.com"
  }

  compliance = {
    frameworks    = ["CIS", "PCI-DSS", "HIPAA", "SOC2"]
    report_bucket = aws_s3_bucket.compliance.id
    schedule      = "MONTHLY"
  }

  cost_management = {
    budgets            = local.account_budgets
    savings_plans      = true
    anomaly_detection  = true
    cost_allocation_tags = ["Environment", "Team", "Project"]
  }

  tags = local.org_tags
}
```
