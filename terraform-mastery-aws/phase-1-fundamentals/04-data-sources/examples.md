# Examples 1.4 — Data Sources (50 examples)

---

## Basic

### 1. Look up the latest Amazon Linux 2 AMI
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
```hcl
data "aws_region" "current" {}

output "region_name" {
  value = data.aws_region.current.name
}
```

### 3. Look up caller identity (account ID, user ARN)
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
```hcl
data "aws_partition" "current" {}

# Useful for building ARNs that work in GovCloud or China
locals {
  arn_prefix = "arn:${data.aws_partition.current.partition}"
}
```

### 5. Look up availability zones
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

output "az_names" {
  value = data.aws_availability_zones.available.names
}
```

### 6. Look up a VPC by tag
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
```hcl
data "aws_subnet" "public" {
  tags = {
    Name = "public-subnet-1"
  }
}
```

### 8. Look up an SSM Parameter
```hcl
data "aws_ssm_parameter" "db_password" {
  name            = "/app/prod/db_password"
  with_decryption = true
}

# Use: data.aws_ssm_parameter.db_password.value
```

### 9. Look up a Secrets Manager secret
```hcl
data "aws_secretsmanager_secret_version" "db_creds" {
  secret_id = "prod/app/db_credentials"
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_creds.secret_string)
}
```

### 10. Look up an IAM policy document
```hcl
data "aws_iam_policy_document" "s3_read" {
  statement {
    actions   = ["s3:GetObject", "s3:ListBucket"]
    resources = ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
  }
}
```

### 11. Look up a Route53 hosted zone
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
```hcl
data "aws_iam_role" "ecs_task" {
  name = "ecsTaskExecutionRole"
}

output "role_arn" {
  value = data.aws_iam_role.ecs_task.arn
}
```

### 20. Look up ACM certificate
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
```hcl
data "aws_ecr_repository" "app" {
  name = "my-app"
}

output "repo_url" {
  value = data.aws_ecr_repository.app.repository_url
}
```

### 23. Look up KMS key by alias
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
```hcl
data "aws_cloudfront_distribution" "cdn" {
  id = "E1EXAMPLE123456"
}

output "cdn_domain" {
  value = data.aws_cloudfront_distribution.cdn.domain_name
}
```

### 45. Data source with complex IAM condition (VPC endpoint)
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
