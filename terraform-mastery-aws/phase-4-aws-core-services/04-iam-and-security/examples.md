# Examples 4.4 — IAM & Security (50 examples)

---

## Basic

### 1. IAM user
```hcl
resource "aws_iam_user" "developer" {
  name = "jane.doe"
  path = "/developers/"
  tags = { Team = "backend" }
}
```

### 2. IAM group and membership
```hcl
resource "aws_iam_group" "developers" {
  name = "developers"
}

resource "aws_iam_user_group_membership" "jane" {
  user   = aws_iam_user.developer.name
  groups = [aws_iam_group.developers.name]
}
```

### 3. IAM role with trust policy
```hcl
resource "aws_iam_role" "app" {
  name = "app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}
```

### 4. Attach managed policy to role
```hcl
resource "aws_iam_role_policy_attachment" "s3_read" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}
```

### 5. Inline policy on role
```hcl
resource "aws_iam_role_policy" "custom" {
  name = "custom-access"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject"]
      Resource = "${aws_s3_bucket.data.arn}/*"
    }]
  })
}
```

### 6. IAM policy document data source
```hcl
data "aws_iam_policy_document" "app" {
  statement {
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.data.arn,
      "${aws_s3_bucket.data.arn}/*"
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app.arn]
  }
}

resource "aws_iam_policy" "app" {
  name   = "app-policy"
  policy = data.aws_iam_policy_document.app.json
}
```

### 7. EC2 instance profile
```hcl
resource "aws_iam_instance_profile" "app" {
  name = "app-instance-profile"
  role = aws_iam_role.ec2.name
}
```

### 8. Account password policy
```hcl
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 16
  require_lowercase_characters   = true
  require_uppercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 12
}
```

### 9. Account alias
```hcl
resource "aws_iam_account_alias" "main" {
  account_alias = "mycompany-production"
}
```

### 10. IAM role for Lambda
```hcl
resource "aws_iam_role" "lambda" {
  name = "lambda-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

### 11. Read-only managed policy
```hcl
resource "aws_iam_group_policy_attachment" "readonly" {
  group      = aws_iam_group.readonly_users.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}
```

### 12. IAM access key (programmatic access)
```hcl
resource "aws_iam_access_key" "ci" {
  user = aws_iam_user.ci_bot.name
}

output "ci_access_key_id" {
  value     = aws_iam_access_key.ci.id
  sensitive = true
}

output "ci_secret_access_key" {
  value     = aws_iam_access_key.ci.secret
  sensitive = true
}
```

---

## Intermediate

### 13. Cross-account assume role
```hcl
resource "aws_iam_role" "cross_account" {
  name = "CrossAccountRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${var.trusted_account_id}:root" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = { "sts:ExternalId" = var.external_id }
        Bool         = { "aws:MultiFactorAuthPresent" = "true" }
      }
    }]
  })
}
```

### 14. OIDC provider for GitHub Actions
```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
        }
      }
    }]
  })
}
```

### 15. Permission boundary
```hcl
resource "aws_iam_policy" "boundary" {
  name = "developer-boundary"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:*", "lambda:*", "dynamodb:*", "logs:*"]
        Resource = "*"
      },
      {
        Effect   = "Deny"
        Action   = ["iam:*", "organizations:*", "account:*"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "developer" {
  name                 = "developer-role"
  permissions_boundary = aws_iam_policy.boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${var.account_id}:root" }
      Action    = "sts:AssumeRole"
    }]
  })
}
```

### 16. Custom IAM role with multiple trust principals
```hcl
resource "aws_iam_role" "multi_trust" {
  name = "shared-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = ["ec2.amazonaws.com", "lambda.amazonaws.com"] }
        Action    = "sts:AssumeRole"
      },
      {
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.account_id}:role/CI-Role" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}
```

### 17. Service-linked role
```hcl
resource "aws_iam_service_linked_role" "ecs" {
  aws_service_name = "ecs.amazonaws.com"
  description      = "ECS service-linked role"
}

resource "aws_iam_service_linked_role" "rds" {
  aws_service_name = "rds.amazonaws.com"
}
```

### 18. IAM policy with resource conditions
```hcl
data "aws_iam_policy_document" "s3_tag_based" {
  statement {
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::my-bucket/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:ExistingObjectTag/owner"
      values   = ["&{aws:username}"]
    }
  }

  statement {
    effect    = "Deny"
    actions   = ["s3:DeleteObject"]
    resources = ["arn:aws:s3:::my-bucket/*"]

    condition {
      test     = "StringNotEquals"
      variable = "aws:ResourceTag/Environment"
      values   = [var.environment]
    }
  }
}
```

### 19. IAM Access Analyzer
```hcl
resource "aws_accessanalyzer_analyzer" "org" {
  analyzer_name = "organization-analyzer"
  type          = "ORGANIZATION"

  tags = { ManagedBy = "terraform" }
}

resource "aws_accessanalyzer_archive_rule" "known_cross_account" {
  analyzer_name = aws_accessanalyzer_analyzer.org.analyzer_name
  rule_name     = "known-cross-account-access"

  filter {
    criteria = "principal.AWS"
    contains = ["arn:aws:iam::${var.partner_account_id}:root"]
  }
}
```

### 20. KMS key policy with IAM
```hcl
resource "aws_kms_key" "app" {
  description             = "Application encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable root account"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid    = "Allow app role to use key"
        Effect = "Allow"
        Principal = { AWS = aws_iam_role.app.arn }
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch to use key"
        Effect = "Allow"
        Principal = { Service = "logs.amazonaws.com" }
        Action   = ["kms:Encrypt*", "kms:Decrypt*", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:Describe*"]
        Resource = "*"
      }
    ]
  })
}
```

### 21. Secrets Manager with automatic rotation
```hcl
resource "aws_secretsmanager_secret" "db" {
  name                    = "prod/app/database"
  recovery_window_in_days = 7
  kms_key_id              = aws_kms_key.secrets.arn
}

resource "aws_secretsmanager_secret_rotation" "db" {
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_lambda_function.rotate_db.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

### 22. AWS SSO permission set (IAM Identity Center)
```hcl
resource "aws_ssoadmin_permission_set" "developer" {
  name             = "Developer"
  instance_arn     = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  session_duration = "PT8H"
  description      = "Developer access"
}

resource "aws_ssoadmin_managed_policy_attachment" "developer" {
  instance_arn       = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  managed_policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
  permission_set_arn = aws_ssoadmin_permission_set.developer.arn
}
```

### 23. IAM role for EKS
```hcl
resource "aws_iam_role" "eks_node" {
  name = "eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.eks_node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
```

### 24. VPC endpoint policy for S3
```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
      Resource = [
        "arn:aws:s3:::${var.allowed_bucket}",
        "arn:aws:s3:::${var.allowed_bucket}/*"
      ]
    }]
  })
}
```

### 25. IAM role for CodePipeline
```hcl
resource "aws_iam_role" "codepipeline" {
  name = "codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codepipeline.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "codepipeline-policy"
  role = aws_iam_role.codepipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:GetBucketVersioning"]
        Resource = [aws_s3_bucket.artifacts.arn, "${aws_s3_bucket.artifacts.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["codebuild:BatchGetBuilds", "codebuild:StartBuild"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.pipeline.arn
      }
    ]
  })
}
```

---

## Nested

### 26. IAM module for microservice
```hcl
module "app_iam" {
  source = "./modules/iam-microservice"

  service_name = "payment-service"
  environment  = var.environment

  # What the service can read
  s3_read_arns = [
    aws_s3_bucket.config.arn,
    "${aws_s3_bucket.config.arn}/*"
  ]

  # What the service can write
  s3_write_arns = [
    "${aws_s3_bucket.transactions.arn}/*"
  ]

  # Secrets it can access
  secret_arns = [
    aws_secretsmanager_secret.stripe_key.arn,
    aws_secretsmanager_secret.db.arn
  ]

  # KMS keys it can use
  kms_key_arns = [aws_kms_key.app.arn]

  # DynamoDB tables
  dynamodb_table_arns = [aws_dynamodb_table.payments.arn]

  # Permission boundary
  permissions_boundary_arn = aws_iam_policy.service_boundary.arn

  tags = local.common_tags
}
```

### 27. For_each IAM users with group membership
```hcl
variable "team_members" {
  type = map(object({
    groups = list(string)
    tags   = map(string)
  }))
}

resource "aws_iam_user" "members" {
  for_each = var.team_members
  name     = each.key
  tags     = each.value.tags
}

resource "aws_iam_user_group_membership" "members" {
  for_each = var.team_members
  user     = aws_iam_user.members[each.key].name
  groups   = each.value.groups
}

resource "aws_iam_access_key" "members" {
  for_each = { for k, v in var.team_members : k => v if lookup(v.tags, "needs_key", "false") == "true" }
  user     = aws_iam_user.members[each.key].name
}
```

### 28. Dynamic policy statements
```hcl
variable "permissions" {
  type = list(object({
    effect    = string
    actions   = list(string)
    resources = list(string)
    condition = optional(object({
      test     = string
      variable = string
      values   = list(string)
    }))
  }))
}

data "aws_iam_policy_document" "dynamic" {
  dynamic "statement" {
    for_each = var.permissions
    content {
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources

      dynamic "condition" {
        for_each = statement.value.condition != null ? [statement.value.condition] : []
        content {
          test     = condition.value.test
          variable = condition.value.variable
          values   = condition.value.values
        }
      }
    }
  }
}
```

### 29. ABAC (Attribute-Based Access Control)
```hcl
data "aws_iam_policy_document" "abac" {
  statement {
    sid    = "ReadProjectResources"
    effect = "Allow"
    actions = ["s3:GetObject", "s3:PutObject", "dynamodb:*", "lambda:*"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["&{aws:PrincipalTag/Project}"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = ["&{aws:PrincipalTag/Environment}"]
    }
  }

  statement {
    sid    = "DenyTagModification"
    effect = "Deny"
    actions = [
      "s3:DeleteObjectTagging",
      "s3:PutObjectTagging",
      "dynamodb:TagResource",
      "dynamodb:UntagResource"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "abac" {
  name   = "abac-project-access"
  policy = data.aws_iam_policy_document.abac.json
}
```

### 30. SCPs (Service Control Policies) via Organizations
```hcl
resource "aws_organizations_policy" "deny_regions" {
  name = "DenyNonApprovedRegions"
  type = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyNonApprovedRegions"
      Effect = "Deny"
      NotAction = [
        "iam:*", "organizations:*", "route53:*",
        "budgets:*", "waf:*", "cloudfront:*",
        "sts:*", "support:*", "trustedadvisor:*"
      ]
      Resource = "*"
      Condition = {
        StringNotEquals = {
          "aws:RequestedRegion" = ["us-east-1", "us-west-2", "eu-west-1"]
        }
        ArnNotLike = {
          "aws:PrincipalARN" = [
            "arn:aws:iam::*:role/BreakGlassRole",
            "arn:aws:iam::*:role/OrganizationAccountAccessRole"
          ]
        }
      }
    }]
  })
}

resource "aws_organizations_policy_attachment" "deny_regions" {
  policy_id = aws_organizations_policy.deny_regions.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
```

### 31. IAM Roles Anywhere
```hcl
resource "aws_rolesanywhere_trust_anchor" "on_prem" {
  name    = "on-premises-servers"
  enabled = true

  source {
    source_type = "AWS_ACM_PCA"
    source_data {
      acm_pca_arn = aws_acmpca_certificate_authority.internal.arn
    }
  }
}

resource "aws_rolesanywhere_profile" "on_prem" {
  name      = "on-premises-profile"
  enabled   = true
  role_arns = [aws_iam_role.on_prem.arn]

  duration_seconds         = 3600
  managed_policy_arns      = [aws_iam_policy.on_prem.arn]
  require_instance_properties = false
}
```

### 32. IAM with resource-based policies (Secrets Manager)
```hcl
resource "aws_secretsmanager_secret_policy" "cross_account" {
  secret_arn = aws_secretsmanager_secret.shared.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.consumer_account_id}:root" }
        Action    = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource  = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalOrgID" = var.org_id
          }
        }
      }
    ]
  })
}
```

### 33. IAM role with session tags for ABAC
```hcl
resource "aws_iam_role" "federated" {
  name = "federated-user-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.okta.arn }
      Action    = ["sts:AssumeRoleWithWebIdentity", "sts:TagSession"]
      Condition = {
        StringEquals = {
          "${aws_iam_openid_connect_provider.okta.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  max_session_duration = 28800
}

data "aws_iam_policy_document" "tag_based_access" {
  statement {
    effect  = "Allow"
    actions = ["s3:*"]
    resources = ["arn:aws:s3:::${var.bucket_prefix}-*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/CostCenter"
      values   = ["&{aws:PrincipalTag/CostCenter}"]
    }
  }
}
```

---

## Advanced

### 34. Zero-trust IAM architecture
```hcl
module "zero_trust_iam" {
  source = "./modules/zero-trust-iam"

  org_id      = var.org_id
  account_id  = var.account_id
  environment = "production"

  # No standing access — all access via just-in-time roles
  jit_roles = {
    developer = {
      max_duration        = 3600
      require_mfa         = true
      require_justification = true
      allowed_services    = ["s3", "lambda", "logs"]
      boundary_arn        = aws_iam_policy.developer_boundary.arn
    }
    operator = {
      max_duration        = 1800
      require_mfa         = true
      require_justification = true
      allowed_services    = ["ec2", "ecs", "rds", "elasticache"]
      boundary_arn        = aws_iam_policy.operator_boundary.arn
    }
  }

  # Deny-by-default SCPs
  scp_policies = [
    "deny-non-approved-regions",
    "deny-root-actions",
    "require-mfa-for-console",
    "require-imdsv2"
  ]

  # Break-glass role (audited and alarmed)
  break_glass_role_arn = aws_iam_role.break_glass.arn
  break_glass_alarm_arn = aws_sns_topic.security_alerts.arn
}
```

### 35. IAM Identity Center with account assignments
```hcl
data "aws_ssoadmin_instances" "main" {}

locals {
  sso_instance_arn = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  sso_identity_store_id = tolist(data.aws_ssoadmin_instances.main.identity_store_ids)[0]
}

resource "aws_ssoadmin_permission_set" "sets" {
  for_each = {
    ReadOnly    = { duration = "PT4H",  policy = "arn:aws:iam::aws:policy/ReadOnlyAccess" }
    Developer   = { duration = "PT8H",  policy = "arn:aws:iam::aws:policy/PowerUserAccess" }
    Admin       = { duration = "PT1H",  policy = "arn:aws:iam::aws:policy/AdministratorAccess" }
  }

  name             = each.key
  instance_arn     = local.sso_instance_arn
  session_duration = each.value.duration
}

resource "aws_ssoadmin_managed_policy_attachment" "sets" {
  for_each = aws_ssoadmin_permission_set.sets

  instance_arn       = local.sso_instance_arn
  managed_policy_arn = { ReadOnly = "arn:aws:iam::aws:policy/ReadOnlyAccess", Developer = "arn:aws:iam::aws:policy/PowerUserAccess", Admin = "arn:aws:iam::aws:policy/AdministratorAccess" }[each.key]
  permission_set_arn = each.value.arn
}
```

### 36. Automated IAM audit with Config rules
```hcl
resource "aws_config_config_rule" "iam_no_inline_policy" {
  name = "iam-no-inline-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_NO_INLINE_POLICY_CHECK"
  }
}

resource "aws_config_config_rule" "access_keys_rotated" {
  name = "access-keys-rotated"

  source {
    owner             = "AWS"
    source_identifier = "ACCESS_KEYS_ROTATED"
  }

  input_parameters = jsonencode({ maxAccessKeyAge = "90" })
}

resource "aws_config_config_rule" "mfa_enabled" {
  name = "mfa-enabled-for-iam-console-access"

  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }
}

resource "aws_config_remediation_configuration" "rotate_keys" {
  config_rule_name = aws_config_config_rule.access_keys_rotated.name
  target_type      = "SSM_DOCUMENT"
  target_id        = "AWS-DisablePublicAccessForSecurityGroup"
  automatic        = false
}
```

### 37. Complete production IAM for multi-account
```hcl
module "security_account_iam" {
  source = "./modules/security-account-iam"

  security_account_id = var.security_account_id
  org_id              = var.org_id

  # Roles that can be assumed from security account to member accounts
  cross_account_roles = {
    security_auditor = {
      policy_arn       = "arn:aws:iam::aws:policy/SecurityAudit"
      member_accounts  = var.all_account_ids
      require_mfa      = false  # Automated security scanning
    }
    incident_responder = {
      policy_arn       = "arn:aws:iam::aws:policy/AdministratorAccess"
      member_accounts  = var.all_account_ids
      require_mfa      = true
      max_session_hrs  = 1
      external_id      = var.ir_external_id
    }
  }

  # Detective controls
  enable_access_analyzer    = true
  enable_guardduty          = true
  enable_security_hub       = true
  enable_config             = true
  enable_cloudtrail         = true

  # Alerting
  siem_log_group_arn   = var.siem_log_group_arn
  alert_topic_arn      = aws_sns_topic.security_alerts.arn

  tags = local.common_tags
}
```

### 38. IAM with Macie and automated remediation
```hcl
resource "aws_cloudwatch_event_rule" "iam_policy_change" {
  name = "iam-policy-change"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName   = ["PutUserPolicy", "PutRolePolicy", "AttachRolePolicy", "CreatePolicyVersion"]
    }
  })
}

resource "aws_cloudwatch_event_target" "iam_review" {
  rule = aws_cloudwatch_event_rule.iam_policy_change.name
  arn  = aws_lambda_function.iam_reviewer.arn
}
```

### 39. IAM with OPA policy enforcement
```hcl
resource "aws_config_config_rule" "no_admin_policy" {
  name        = "no-admin-policy-attached"
  description = "Ensure no IAM role has AdministratorAccess attached"

  source {
    owner = "CUSTOM_LAMBDA"
    source_identifier = aws_lambda_function.config_rule.arn

    source_detail {
      event_source                = "aws.config"
      message_type                = "ConfigurationItemChangeNotification"
      maximum_execution_frequency = null
    }
  }

  depends_on = [aws_lambda_permission.config]
}
```

### 40. Automated key rotation alert
```hcl
resource "aws_cloudwatch_metric_alarm" "old_access_keys" {
  alarm_name          = "iam-old-access-keys"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NonCompliantResources"
  namespace           = "AWS/Config"
  period              = 86400
  statistic           = "Average"
  threshold           = 0

  dimensions = {
    ConfigRuleName = aws_config_config_rule.access_keys_rotated.name
  }

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}
```

### 41. IAM policy for Terraform (least privilege)
```hcl
data "aws_iam_policy_document" "terraform_deploy" {
  statement {
    sid    = "TerraformStateAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket",
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"
    ]
    resources = [
      aws_s3_bucket.tfstate.arn,
      "${aws_s3_bucket.tfstate.arn}/*",
      aws_dynamodb_table.tflock.arn
    ]
  }

  statement {
    sid    = "CoreInfraAccess"
    effect = "Allow"
    actions = [
      "ec2:*", "iam:*", "s3:*", "lambda:*",
      "rds:*", "elasticache:*", "ecs:*",
      "secretsmanager:*", "kms:*", "acm:*",
      "route53:*", "cloudfront:*", "wafv2:*",
      "logs:*", "cloudwatch:*", "sns:*", "sqs:*"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = var.allowed_regions
    }
  }
}

resource "aws_iam_role" "terraform" {
  name                 = "terraform-deploy-role"
  permissions_boundary = aws_iam_policy.deploy_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/infra:ref:refs/heads/main"
        }
      }
    }]
  })
}
```

### 42. Automated IAM drift detection
```hcl
resource "aws_config_configuration_recorder" "main" {
  name     = "main"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = false
    include_global_resource_types = true
    resource_types                = ["AWS::IAM::User", "AWS::IAM::Role", "AWS::IAM::Policy", "AWS::IAM::Group"]
  }
}

resource "aws_cloudwatch_event_rule" "config_noncompliant" {
  name = "config-noncompliant-iam"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType   = ["ComplianceChangeNotification"]
      newEvaluationResult = { complianceType = ["NON_COMPLIANT"] }
      configRuleName = [
        aws_config_config_rule.mfa_enabled.name,
        aws_config_config_rule.iam_no_inline_policy.name
      ]
    }
  })
}
```

### 43. IAM for data mesh (cross-account Lake Formation)
```hcl
resource "aws_lakeformation_permissions" "consumer_access" {
  for_each = toset(var.consumer_account_ids)

  principal   = "arn:aws:iam::${each.value}:root"
  permissions = ["SELECT"]

  table {
    database_name = aws_glue_catalog_database.main.name
    name          = aws_glue_catalog_table.sales.name
  }
}

resource "aws_iam_role" "lake_consumer" {
  name = "lake-formation-consumer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${var.consumer_account_id}:root" }
      Action    = "sts:AssumeRole"
    }]
  })
}
```

### 44. Security Hub standards and findings
```hcl
resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "cis" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.4.0"
}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0"
}

resource "aws_cloudwatch_event_rule" "securityhub_high" {
  name = "securityhub-high-findings"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = { Label = ["HIGH", "CRITICAL"] }
        RecordState = ["ACTIVE"]
        WorkflowState = ["NEW"]
      }
    }
  })
}
```

### 45. GuardDuty with automated remediation
```hcl
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs { enable = true }
    kubernetes { audit_logs { enable = true } }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes { enable = true }
      }
    }
  }
}

resource "aws_cloudwatch_event_rule" "guardduty_high" {
  name = "guardduty-high-findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [{ numeric = [">=", 7.0] }]
    }
  })
}

resource "aws_cloudwatch_event_target" "remediate" {
  rule = aws_cloudwatch_event_rule.guardduty_high.name
  arn  = aws_lambda_function.auto_remediate.arn
}
```

### 46. IAM with CloudTrail audit
```hcl
resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }
}
```

### 47. IAM for multi-region deployments
```hcl
resource "aws_iam_role" "global_deploy" {
  name = "global-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:myorg/infra:environment:production"
        }
      }
    }]
  })
}

data "aws_iam_policy_document" "global_deploy" {
  statement {
    effect  = "Allow"
    actions = ["*"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = ["us-east-1", "us-west-2", "eu-west-1"]
    }
  }
}
```

### 48. IAM for SaaS OIDC (Okta/Google)
```hcl
resource "aws_iam_openid_connect_provider" "okta" {
  url             = "https://${var.okta_domain}/oauth2/default"
  client_id_list  = [var.okta_client_id]
  thumbprint_list = [var.okta_thumbprint]
}

resource "aws_iam_role" "okta_federated" {
  name = "okta-federated-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.okta.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.okta_domain}/oauth2/default:aud" = var.okta_client_id
        }
        StringLike = {
          "${var.okta_domain}/oauth2/default:sub" = "*@mycompany.com"
        }
      }
    }]
  })
}
```

### 49. IAM with Terraform Cloud dynamic credentials
```hcl
resource "aws_iam_openid_connect_provider" "tfc" {
  url             = "https://app.terraform.io"
  client_id_list  = ["aws.workload.identity"]
  thumbprint_list = ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]
}

resource "aws_iam_role" "tfc_deploy" {
  name = "terraform-cloud-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.tfc.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "app.terraform.io:aud" = "aws.workload.identity"
          "app.terraform.io:sub" = "organization:${var.tfc_org}:project:${var.tfc_project}:workspace:${var.tfc_workspace}:run_phase:*"
        }
      }
    }]
  })
}
```

### 50. Full production IAM governance
```hcl
module "iam_governance" {
  source = "./modules/iam-governance"

  account_id  = var.account_id
  org_id      = var.org_id
  environment = "production"

  password_policy = {
    min_length          = 16
    require_uppercase   = true
    require_lowercase   = true
    require_numbers     = true
    require_symbols     = true
    max_age_days        = 90
    reuse_prevention    = 12
    allow_user_change   = true
  }

  guardrails = {
    deny_non_approved_regions    = true
    allowed_regions              = ["us-east-1", "us-west-2", "eu-west-1"]
    require_mfa_for_console      = true
    deny_root_account_actions    = true
    require_imdsv2               = true
    deny_public_s3_buckets       = true
  }

  detective_controls = {
    cloudtrail           = true
    config               = true
    guardduty            = true
    security_hub         = true
    access_analyzer      = true
    macie               = true
  }

  break_glass_role = {
    name              = "BreakGlassAdmin"
    require_mfa       = true
    max_session_hours = 1
    alert_on_use      = true
    alert_topic_arn   = aws_sns_topic.security_pagerduty.arn
  }

  sso_instance_arn      = tolist(data.aws_ssoadmin_instances.main.arns)[0]
  alert_topic_arn       = aws_sns_topic.security_alerts.arn
  cloudtrail_bucket_id  = module.cloudtrail_bucket.id
  kms_key_arn           = aws_kms_key.security.arn

  tags = local.security_tags
}
```
