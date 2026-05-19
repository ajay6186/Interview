# Examples 1.4 — Data Sources (50 examples)

> **Topic Overview:** Data sources let Terraform **read** existing infrastructure without managing it. Use them to look up AMIs, VPCs, subnets, certificates, secrets, and cross-stack outputs. They're read-only (no changes to AWS), resolved at plan time, and the result is available throughout your configuration. The `aws_iam_policy_document` data source is arguably the most important for IAM management.

---

## Basic

### 1. Look up the latest Amazon Linux 2 AMI
> `most_recent = true` picks the newest matching AMI. The `owners = ["amazon"]` restricts to official AWS images, preventing your config from accidentally picking a community AMI. Always pin owners for security.
```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

output "ami_id" {
  value = data.aws_ami.amazon_linux.id
}
```

### 2. Look up current AWS region
> `aws_region` returns the region configured in the provider. Use instead of hardcoding the region string — makes your config portable if you change regions or deploy to multiple regions.
```hcl
data "aws_region" "current" {}

output "region_name" {
  value = data.aws_region.current.name
}
```

### 3. Look up caller identity (account ID, user ARN)
> Returns the account ID and IAM identity making the API call. Essential for building ARNs dynamically and for policies that must reference the current account ID without hardcoding it.
```hcl
data "aws_caller_identity" "current" {}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}
output "caller_arn" {
  value = data.aws_caller_identity.current.arn
}
```

### 4. Look up AWS partition
> The partition differs across commercial (`aws`), GovCloud (`aws-us-gov`), and China (`aws-cn`). Use `data.aws_partition.current.partition` to build portable ARNs that work in all AWS environments.
```hcl
data "aws_partition" "current" {}

# Useful for building ARNs that work in GovCloud or China
locals {
  arn_prefix = "arn:${data.aws_partition.current.partition}"
}
```

### 5. Look up availability zones
> Returns all AZs in the current region that are in the specified state. Use `slice(data.aws_availability_zones.available.names, 0, 3)` to limit to the first 3 AZs for subnet creation.
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

output "az_names" {
  value = data.aws_availability_zones.available.names
}
```

### 6. Look up a VPC by tag
> Finding a VPC by tag is the standard pattern when you want to attach resources to an existing VPC (e.g., a shared services VPC). The `tags` filter requires an exact match on all specified tags.
```hcl
data "aws_vpc" "main" {
  tags = {
    Name = "main-vpc"
  }
}

output "vpc_id" {
  value = data.aws_vpc.main.id
}
```

### 7. Look up a subnet by tag
> Used when another team manages the VPC and you need to deploy into specific subnets. Tags are the recommended way to identify subnets since IDs differ across environments.
```hcl
data "aws_subnet" "public" {
  tags = {
    Name = "public-subnet-1"
  }
}
```

### 8. Look up an SSM Parameter
> `with_decryption = true` decrypts SecureString parameters using KMS. This is the safe way to inject secrets (database passwords, API keys) into Terraform without storing them in `.tfvars` files.
```hcl
data "aws_ssm_parameter" "db_password" {
  name            = "/app/prod/db_password"
  with_decryption = true
}

# Use: data.aws_ssm_parameter.db_password.value
```

### 9. Look up a Secrets Manager secret
> `jsondecode()` parses the JSON blob stored in Secrets Manager into a Terraform map. Access individual fields with `local.db_creds["username"]`. Secrets Manager supports automatic rotation — Terraform always reads the latest version.
```hcl
data "aws_secretsmanager_secret_version" "db_creds" {
  secret_id = "prod/app/db_credentials"
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_creds.secret_string)
}
```

### 10. Look up an IAM policy document
> `aws_iam_policy_document` generates valid IAM JSON from HCL. It's safer than `jsonencode()` for IAM policies because it validates IAM-specific constraints (like action and resource formats) and handles escaping automatically.
```hcl
data "aws_iam_policy_document" "s3_read" {
  statement {
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
  }
}
```

### 11. Look up a Route53 hosted zone
> Returns the zone ID needed to create DNS records. The trailing dot in `"example.com."` is part of the DNS format. `private_zone = false` filters to public hosted zones.
```hcl
data "aws_route53_zone" "main" {
  name         = "example.com."
  private_zone = false
}

output "zone_id" {
  value = data.aws_route53_zone.main.zone_id
}
```

### 12. Look up an S3 bucket
> Reads metadata about an existing bucket (ARN, region, domain name) without managing it. Use when another team/stack owns the bucket but you need to reference it (e.g., to set up replication or configure a policy).
```hcl
data "aws_s3_bucket" "existing" {
  bucket = "my-existing-bucket"
}

output "bucket_arn" {
  value = data.aws_s3_bucket.existing.arn
}
```

---

## Intermediate

### 13. AMI filter with multiple conditions
> Multiple `filter` blocks are ANDed together — the AMI must match ALL filters. Ubuntu's canonical account ID is `099720109477`. The wildcard `*` in the name pattern matches any AMI version date.
```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}
```

### 14. Look up multiple subnets by tag prefix
> `aws_subnets` (plural) returns multiple subnet IDs matching the filter. Combine `filter` on `vpc-id` with `tags` to get all private subnets in a specific VPC.
```hcl
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  tags = {
    Tier = "private"
  }
}

output "private_subnet_ids" {
  value = data.aws_subnets.private.ids
}
```

### 15. Data source with depends_on
> Normally data sources are read at plan time. When a data source depends on a resource that might not exist yet, use `depends_on` to delay the read until after the resource is created.
```hcl
resource "aws_ssm_parameter" "app_url" {
  name  = "/app/url"
  type  = "String"
  value = "https://example.com"
}

data "aws_ssm_parameter" "app_url" {
  name       = "/app/url"
  depends_on = [aws_ssm_parameter.app_url]
}
```

### 16. Look up default VPC
> Most AWS accounts have a default VPC. This is useful for quick setups or when launching resources that don't need a custom VPC. `default = true` filters to the account's default VPC.
```hcl
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
```

### 17. Look up ELB/ALB by tags
> Tags are the reliable way to look up load balancers across environments. IDs vary between accounts/regions; tags are consistent. Both `Name` and `Environment` tags narrow it to a specific ALB.
```hcl
data "aws_lb" "app" {
  tags = {
    Name        = "app-alb"
    Environment = "production"
  }
}

output "alb_dns" {
  value = data.aws_lb.app.dns_name
}
```

### 18. Look up a security group by name
> Used when the security group is managed by a different Terraform stack or manually. `vpc_id` is required when multiple VPCs might have SGs with the same name.
```hcl
data "aws_security_group" "db" {
  name   = "rds-sg"
  vpc_id = data.aws_vpc.main.id
}

resource "aws_db_instance" "example" {
  # ...
  vpc_security_group_ids = [data.aws_security_group.db.id]
}
```

### 19. Look up IAM role
> Returns the ARN of an existing IAM role — useful when a role is created by a separate process (e.g., a provisioning pipeline) that Terraform shouldn't manage but needs to reference.
```hcl
data "aws_iam_role" "ecs_task" {
  name = "ecsTaskExecutionRole"
}

output "role_arn" {
  value = data.aws_iam_role.ecs_task.arn
}
```

### 20. Look up ACM certificate
> `statuses = ["ISSUED"]` ensures you only get a validated, usable certificate. `most_recent = true` picks the newest one if multiple certs exist for the same domain (e.g., after a renewal).
```hcl
data "aws_acm_certificate" "example" {
  domain      = "example.com"
  statuses    = ["ISSUED"]
  most_recent = true
}

output "cert_arn" {
  value = data.aws_acm_certificate.example.arn
}
```

### 21. Look up EKS cluster
> `aws_eks_cluster` returns the API endpoint and CA certificate needed to configure the Kubernetes provider. `aws_eks_cluster_auth` provides a short-lived bearer token for authentication.
```hcl
data "aws_eks_cluster" "main" {
  name = "production-cluster"
}

data "aws_eks_cluster_auth" "main" {
  name = "production-cluster"
}

output "cluster_endpoint" {
  value = data.aws_eks_cluster.main.endpoint
}
```

### 22. Look up ECR repository
> Returns the repository URL needed to tag and push Docker images. Used in CI/CD pipelines that read Terraform outputs to get the push destination.
```hcl
data "aws_ecr_repository" "app" {
  name = "my-app"
}

output "repo_url" {
  value = data.aws_ecr_repository.app.repository_url
}
```

### 23. Look up KMS key by alias
> Aliases make KMS key references human-readable. The ARN returned here is used to encrypt S3, EBS, RDS, etc. without hardcoding the key ID (which is opaque).
```hcl
data "aws_kms_key" "s3" {
  key_id = "alias/s3-encryption-key"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "example" {
  bucket = aws_s3_bucket.example.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = data.aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
```

### 24. Use data source output in resource
> The canonical pattern: look up an existing VPC, then create new resources inside it. The VPC's `id` flows directly as the `vpc_id` argument — this creates an implicit dependency ordering.
```hcl
data "aws_vpc" "main" {
  tags = { Name = "production" }
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = data.aws_vpc.main.id   # use data output directly

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 25. Look up DynamoDB table
> Used when you need the DynamoDB table's ARN or stream ARN for IAM policies or event source mappings, without managing the table itself (e.g., it was created by another stack).
```hcl
data "aws_dynamodb_table" "state_lock" {
  name = "terraform-state-lock"
}

output "table_arn" {
  value = data.aws_dynamodb_table.state_lock.arn
}
```

---

## Nested

### 26. Combine multiple data sources with locals
> All three "current state" data sources together give you the complete AWS environment context. Build ARNs like `arn:${partition}:s3:::${bucket_name}` using these three values for partition-portable configs.
```hcl
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  partition  = data.aws_partition.current.partition

  base_arn = "arn:${local.partition}:iam::${local.account_id}"
}
```

### 27. IAM policy document with multiple statements
> `aws_iam_policy_document` builds a single JSON policy from multiple `statement` blocks. Each statement has its own Sid, effect, actions, and resources. This is much more readable than raw JSON and avoids formatting errors.
```hcl
data "aws_iam_policy_document" "lambda" {
  statement {
    sid     = "AllowS3Read"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.data.arn,
      "${aws_s3_bucket.data.arn}/*",
    ]
  }

  statement {
    sid    = "AllowSSMParams"
    effect = "Allow"
    actions = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/app/*"
    ]
  }

  statement {
    sid     = "DenyDelete"
    effect  = "Deny"
    actions = ["s3:DeleteObject"]
    resources = ["${aws_s3_bucket.data.arn}/*"]
  }
}
```

### 28. For expression over data source results
> Transforms the AZ list into a map of `az_name → subnet_cidr`. This structured result is easy to use in `for_each` — each AZ gets its own correctly-sized subnet without manual CIDR calculation.
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Create subnet CIDRs for each AZ
  az_subnet_map = {
    for i, az in data.aws_availability_zones.available.names :
    az => cidrsubnet("10.0.0.0/16", 8, i)
  }
}
```

### 29. Conditional data source use with try()
> Uses `count` to conditionally look up a VPC. `var.existing_vpc_id != ""` controls whether the data source runs. The ternary in `locals.vpc_id` selects between the looked-up VPC or a newly created one.
```hcl
variable "existing_vpc_id" {
  type    = string
  default = ""
}

data "aws_vpc" "existing" {
  count = var.existing_vpc_id != "" ? 1 : 0
  id    = var.existing_vpc_id
}

locals {
  vpc_id = var.existing_vpc_id != "" ? data.aws_vpc.existing[0].id : aws_vpc.new[0].id
}
```

### 30. Fetch secret and parse JSON
> The pattern for using Secrets Manager with structured secrets. `jsondecode()` converts the JSON string into a Terraform map, then individual fields are accessed with map notation. The password never appears in the Terraform config.
```hcl
data "aws_secretsmanager_secret_version" "rds" {
  secret_id = "/prod/rds/master"
}

locals {
  rds = jsondecode(data.aws_secretsmanager_secret_version.rds.secret_string)
}

resource "aws_db_instance" "main" {
  # ...
  username = local.rds["username"]
  password = local.rds["password"]
}
```

### 31. Data source used in for_each
> `for_each = toset(var.subnet_names)` runs the data source once per subnet name. Each instance is accessible as `data.aws_subnet.all["public-1"]`. The output map transforms the for_each results into a clean key→ID map.
```hcl
variable "subnet_names" {
  type    = list(string)
  default = ["public-1", "public-2", "private-1", "private-2"]
}

data "aws_subnet" "all" {
  for_each = toset(var.subnet_names)

  tags = {
    Name = each.value
  }
}

output "subnet_ids" {
  value = { for k, v in data.aws_subnet.all : k => v.id }
}
```

### 32. Nested IAM policy document (assume role)
> The trust policy (assume role policy) uses the `aws_iam_policy_document` data source with a `principals` block. The `condition` restricts role assumption to the specific account — preventing confused-deputy attacks.
```hcl
data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}
```

### 33. Look up VPC then subnets dynamically
> Chain data sources: first look up the VPC by environment tag, then use its ID to filter public and private subnets. This makes your config work across environments without any hardcoded IDs.
```hcl
data "aws_vpc" "selected" {
  tags = { Environment = var.environment }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }
  tags = { Tier = "public" }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }
  tags = { Tier = "private" }
}
```

### 34. Route53 zone → ACM cert → ALB listener (chained data)
> Classic TLS setup pattern: look up the zone, find the wildcard cert, attach it to the HTTPS listener. All three data sources are read at plan time and their outputs flow into the resource.
```hcl
data "aws_route53_zone" "main" {
  name = "example.com."
}

data "aws_acm_certificate" "main" {
  domain      = "*.example.com"
  statuses    = ["ISSUED"]
  most_recent = true
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = data.aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 35. External data source (calling a script)
> The `external` data source runs any program and reads its JSON stdout. Use sparingly — it creates a shell dependency and runs on every plan. Useful for values Terraform can't compute natively (e.g., git SHA).
```hcl
data "external" "git_commit" {
  program = ["bash", "-c", "echo {\\\"sha\\\": \\\"$(git rev-parse --short HEAD)\\\"}"]
}

resource "aws_ssm_parameter" "deploy_version" {
  name  = "/app/deploy/version"
  type  = "String"
  value = data.external.git_commit.result["sha"]
}
```

### 36. HTTP data source for external config
> The `http` data source fetches a URL and returns the body. `chomp()` removes the trailing newline from the IP response. This lets you allowlist your current IP in security groups for temporary access.
```hcl
data "http" "my_ip" {
  url = "https://checkip.amazonaws.com"
}

resource "aws_security_group_rule" "allow_my_ip" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["${chomp(data.http.my_ip.response_body)}/32"]
  security_group_id = aws_security_group.bastion.id
}
```

### 37. Look up AMI across multiple architectures
> Two AMI lookups — one for ARM64 (Graviton) and one for x86_64. A conditional in `locals` selects between them based on `var.use_arm`. This enables a single config to support both architectures.
```hcl
data "aws_ami" "arm64" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-arm64-gp2"]
  }
}

data "aws_ami" "x86_64" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

locals {
  ami_id = var.use_arm ? data.aws_ami.arm64.id : data.aws_ami.x86_64.id
}
```

---

## Advanced

### 38. IAM policy document with condition keys
> `not_actions` means "all actions EXCEPT these listed." Combined with the `BoolIfExists` condition, this creates a powerful MFA-enforcement policy: deny everything except the actions needed to enable MFA.
```hcl
data "aws_iam_policy_document" "enforce_mfa" {
  statement {
    sid    = "DenyWithoutMFA"
    effect = "Deny"
    not_actions = [
      "iam:CreateVirtualMFADevice",
      "iam:EnableMFADevice",
      "sts:GetSessionToken",
    ]
    resources = ["*"]
    condition {
      test     = "BoolIfExists"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
}
```

### 39. terraform_remote_state data source
> Reads outputs from another Terraform stack's state file. The consuming stack uses those outputs to reference resources created elsewhere. The two stacks have completely independent lifecycles.
```hcl
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "network/vpc/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.app.id
  instance_type = "t3.medium"
  subnet_id     = data.terraform_remote_state.vpc.outputs.private_subnet_ids[0]
}
```

### 40. Data source with complex filter and splat
> `aws_instances` (plural) finds multiple running EC2 instances matching filters. The `.private_ips` splat attribute returns all their IPs as a list. Used to discover instances in auto-scaling groups.
```hcl
data "aws_instances" "web" {
  filter {
    name   = "tag:Role"
    values = ["web"]
  }
  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

output "web_private_ips" {
  value = data.aws_instances.web.private_ips
}
```

### 41. Dynamic data source lookup with for_each
> Runs `aws_ssm_parameter` once per parameter path. The `locals.config` map transforms the results so callers use `local.config.db_host` instead of the full data source path.
```hcl
variable "ssm_params" {
  type = map(string)
  default = {
    db_host     = "/app/prod/db_host"
    db_port     = "/app/prod/db_port"
    api_key     = "/app/prod/api_key"
  }
}

data "aws_ssm_parameter" "config" {
  for_each        = var.ssm_params
  name            = each.value
  with_decryption = true
}

locals {
  config = { for k, v in data.aws_ssm_parameter.config : k => v.value }
}
```

### 42. IAM policy document with complex conditions (S3 bucket policy)
> Two statements: deny all non-TLS S3 access (security baseline), and allow access to any principal in the same AWS Organization (useful for cross-account data lakes). The `aws:PrincipalOrgID` condition is key for org-wide policies.
```hcl
data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid     = "DenyNonTLS"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.main.arn,
      "${aws_s3_bucket.main.arn}/*",
    ]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid     = "AllowOrgAccess"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.main.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalOrgID"
      values   = [var.org_id]
    }
  }
}
```

### 43. Look up SQS queue by URL
> SQS queue data source returns the ARN needed for Lambda event source mappings and IAM policies. The queue ARN is not guessable from the URL — must be looked up.
```hcl
data "aws_sqs_queue" "processing" {
  name = "order-processing-queue"
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = data.aws_sqs_queue.processing.arn
  function_name    = aws_lambda_function.processor.arn
  batch_size       = 10
}
```

### 44. Look up CloudFront distribution
> Returns the domain name and other attributes of an existing CloudFront distribution. Used when you need to create Route53 records or WAF associations without managing the distribution itself.
```hcl
data "aws_cloudfront_distribution" "cdn" {
  id = "E1EXAMPLE123456"
}

output "cdn_domain" {
  value = data.aws_cloudfront_distribution.cdn.domain_name
}
```

### 45. Data source with complex IAM condition (VPC endpoint)
> Restricts S3 access to traffic originating through a specific VPC endpoint. The `aws:sourceVpce` condition means only requests routed through your VPC endpoint are allowed — data cannot leave your network.
```hcl
data "aws_iam_policy_document" "vpce_policy" {
  statement {
    sid       = "AllowVPCEAccess"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.data.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:sourceVpce"
      values   = [aws_vpc_endpoint.s3.id]
    }
  }
}
```

### 46. Lookup ECS task definition
> Used when you want to run a service using the latest task definition revision without Terraform replacing it on every change. Reference the family:revision format to pin to the live version.
```hcl
data "aws_ecs_task_definition" "app" {
  task_definition = "my-app-task"
}

resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = "${data.aws_ecs_task_definition.app.family}:${data.aws_ecs_task_definition.app.revision}"
  desired_count   = 2
}
```

### 47. Lookup organizations for SCP/cross-account
> `aws_organizations_organization` returns the org ID and management account ID. Used in S3 bucket policies and SCPs that apply to all accounts in the organization.
```hcl
data "aws_organizations_organization" "current" {}

data "aws_iam_policy_document" "org_policy" {
  statement {
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.shared.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalOrgID"
      values   = [data.aws_organizations_organization.current.id]
    }
  }
}
```

### 48. Lookup VPC endpoint service (PrivateLink)
> Gets the service name for a VPC endpoint without hardcoding the region. The service name format includes the region (`com.amazonaws.us-east-1.s3`) which varies — looking it up ensures correctness.
```hcl
data "aws_vpc_endpoint_service" "s3" {
  service      = "s3"
  service_type = "Gateway"
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = data.aws_vpc_endpoint_service.s3.service_name
  route_table_ids = [aws_route_table.private.id]
}
```

### 49. Look up Elastic IP by allocation ID or tag
> Returns the public IP of a pre-allocated EIP. Used when the EIP was created separately (e.g., to maintain a static IP across NAT gateway replacements) and you need its public IP for DNS records.
```hcl
data "aws_eip" "bastion" {
  tags = {
    Name = "bastion-eip"
  }
}

output "bastion_public_ip" {
  value = data.aws_eip.bastion.public_ip
}
```

### 50. Full pattern: data sources for dynamic multi-region config
> The complete environment discovery pattern: AZs, account context, and computed CIDRs all built from data sources. This eliminates all hardcoded values — the same code works in any region or account.
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}

locals {
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  public_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + 10)]

  common_tags = {
    AccountId   = local.account_id
    Region      = local.region
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}
```

---

## Key Takeaways

- Data sources are **read-only** — they never create, update, or destroy infrastructure.
- `aws_iam_policy_document` is the preferred way to write IAM policies — safer than raw JSON, validates syntax, handles escaping.
- Chain data sources naturally: look up VPC → use its ID to look up subnets → use subnet IDs in resources.
- `depends_on` on data sources forces delayed read — use when the data source depends on a resource being created first.
- `for_each` on data sources runs the lookup once per item — efficient for batch lookups (SSM params, subnets by name).
- `terraform_remote_state` is the standard cross-stack data sharing mechanism — requires state to be in a shared backend.

## Common Interview Questions & Answers

**Q: What is the difference between a data source and a resource?**  
A: Resources create/update/destroy infrastructure. Data sources only read existing infrastructure — they are declared with `data "type" "name" {}` and never make write API calls. Changes to a data source's result never trigger changes to the data source itself.

**Q: When does a data source get evaluated?**  
A: Data sources are evaluated during `terraform plan` (or `apply`). If a data source depends on a resource that doesn't exist yet, Terraform defers its evaluation until after the resource is applied — this is why `depends_on` is sometimes needed.

**Q: How do you safely inject secrets into Terraform without storing them in `.tfvars` files?**  
A: Use data sources to read from SSM Parameter Store (`aws_ssm_parameter`) or Secrets Manager (`aws_secretsmanager_secret_version`). The values never appear in your code and are fetched at runtime.

**Q: What is `aws_iam_policy_document` and why use it over `jsonencode()`?**  
A: `aws_iam_policy_document` is an HCL-native way to write IAM policies. It validates IAM-specific structure, handles escaping, supports merging and overriding statements, and produces the correct JSON. `jsonencode()` works but provides no IAM-specific validation.

**Q: How does `terraform_remote_state` work?**  
A: It reads the state file of another Terraform root module from a shared backend (S3, GCS, etc.) and exposes its `outputs` as a data attribute. The consuming stack reads outputs like `data.terraform_remote_state.networking.outputs.vpc_id`.
