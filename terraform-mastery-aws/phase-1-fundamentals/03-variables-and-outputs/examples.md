# Examples 1.3 — Variables & Outputs (50 examples)

---

## Basic

### 1. Simple string variable
```hcl
variable "region" {
  type        = string
  description = "AWS region to deploy resources"
  default     = "us-east-1"
}
```

### 2. Number variable
```hcl
variable "instance_count" {
  type        = number
  description = "Number of EC2 instances"
  default     = 2
}
```

### 3. Boolean variable
```hcl
variable "enable_deletion_protection" {
  type        = bool
  description = "Enable deletion protection on the RDS instance"
  default     = true
}
```

### 4. Referencing a variable
```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
}
```

### 5. Simple output
```hcl
output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.web.id
}
```

### 6. Output with sensitive flag
```hcl
output "db_password" {
  description = "Database master password"
  value       = aws_db_instance.main.password
  sensitive   = true
}
```

### 7. locals block
```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Team        = "platform"
  }
  name_prefix = "${var.project}-${var.environment}"
}

resource "aws_s3_bucket" "app" {
  bucket = "${local.name_prefix}-app-data"
  tags   = local.common_tags
}
```

### 8. List variable
```hcl
variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

### 9. Map variable
```hcl
variable "instance_types" {
  type = map(string)
  default = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.medium"
  }
}

resource "aws_instance" "app" {
  ami           = var.ami_id
  instance_type = var.instance_types[var.environment]
}
```

### 10. Variable with no default (required)
```hcl
variable "ami_id" {
  type        = string
  description = "AMI ID for the EC2 instance (required)"
  # No default — must be provided
}
```

### 11. Passing variable via CLI
```bash
terraform apply -var="environment=prod" -var="instance_count=3"
```

### 12. Passing variables via .tfvars file
```bash
# terraform.tfvars (auto-loaded)
environment   = "prod"
instance_count = 3
aws_region    = "us-west-2"

# Manual load:
terraform apply -var-file="prod.tfvars"
```

---

## Intermediate

### 13. Object type variable
```hcl
variable "database_config" {
  type = object({
    engine            = string
    engine_version    = string
    instance_class    = string
    allocated_storage = number
    multi_az          = bool
  })
  default = {
    engine            = "postgres"
    engine_version    = "15.4"
    instance_class    = "db.t3.medium"
    allocated_storage = 20
    multi_az          = false
  }
}
```

### 14. List of objects variable
```hcl
variable "subnet_configs" {
  type = list(object({
    cidr_block        = string
    availability_zone = string
    public            = bool
  }))
  default = [
    { cidr_block = "10.0.1.0/24", availability_zone = "us-east-1a", public = true },
    { cidr_block = "10.0.2.0/24", availability_zone = "us-east-1b", public = true },
    { cidr_block = "10.0.10.0/24", availability_zone = "us-east-1a", public = false },
  ]
}
```

### 15. Variable validation
```hcl
variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be 'dev', 'staging', or 'prod'."
  }
}
```

### 16. Variable validation with regex
```hcl
variable "bucket_name" {
  type        = string
  description = "S3 bucket name"
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9\\-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "Bucket name must be 3–63 characters, lowercase letters, numbers, and hyphens."
  }
}
```

### 17. Sensitive variable
```hcl
variable "db_password" {
  type        = string
  description = "Database master password"
  sensitive   = true
}
```

### 18. Environment variable for sensitive inputs
```bash
export TF_VAR_db_password="super-secret-password"
export TF_VAR_api_key="my-api-key"
terraform apply
```

### 19. Output depending on another output
```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}
```

### 20. Output with complex expression
```hcl
output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = "https://${aws_lb.app.dns_name}"
}

output "rds_endpoint" {
  description = "RDS endpoint without port"
  value       = split(":", aws_db_instance.main.endpoint)[0]
}
```

### 21. nonsensitive() to expose sensitive output
```hcl
output "db_connection_string" {
  value     = nonsensitive("postgres://${var.db_user}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}")
  sensitive = false
  # Use with extreme care — only when value is truly safe to expose
}
```

### 22. Output with depends_on
```hcl
output "app_url" {
  value       = "https://${aws_lb.app.dns_name}/api"
  depends_on  = [aws_lb_listener.https]
}
```

### 23. .tfvars.json format
```json
{
  "environment": "prod",
  "instance_count": 3,
  "tags": {
    "Team": "platform",
    "CostCenter": "123"
  }
}
```

### 24. Locals with computed values
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs              = slice(data.aws_availability_zones.available.names, 0, 3)
  public_cidrs     = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  private_cidrs    = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + 10)]
  name_prefix      = lower("${var.project}-${var.environment}")
  account_id       = data.aws_caller_identity.current.account_id
}
```

### 25. Multiple validation blocks (Terraform 1.9+)
```hcl
variable "instance_type" {
  type = string
  validation {
    condition     = startswith(var.instance_type, "t3.") || startswith(var.instance_type, "t4g.")
    error_message = "Only t3 and t4g instance families are allowed."
  }
  validation {
    condition     = !contains(["t3.nano", "t4g.nano"], var.instance_type)
    error_message = "Nano instances are too small for this workload."
  }
}
```

---

## Nested

### 26. Complex object with optional attributes (Terraform 1.3+)
```hcl
variable "rds_config" {
  type = object({
    instance_class         = string
    allocated_storage      = number
    multi_az               = optional(bool, false)
    deletion_protection    = optional(bool, true)
    backup_retention_days  = optional(number, 7)
    performance_insights   = optional(bool, false)
    parameter_group_family = optional(string, "postgres15")
  })
}
```

### 27. Nested map of objects
```hcl
variable "security_group_rules" {
  type = map(object({
    type        = string
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = optional(string, "")
  }))
  default = {
    http = {
      type        = "ingress"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
    https = {
      type        = "ingress"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

### 28. Locals referencing other locals
```hcl
locals {
  base_name     = "${var.project}-${var.environment}"
  bucket_prefix = lower(replace(local.base_name, "_", "-"))
  kms_key_alias = "alias/${local.base_name}/s3"
  log_bucket    = "${local.bucket_prefix}-access-logs"
  tags = merge(var.extra_tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    CreatedAt   = formatdate("YYYY-MM-DD", timestamp())
  })
}
```

### 29. Output entire resource object (for module consumers)
```hcl
output "vpc" {
  description = "Full VPC resource object"
  value       = aws_vpc.main
}

output "public_subnets" {
  description = "Public subnet objects"
  value       = aws_subnet.public
}
```

### 30. Module output chain
```hcl
# modules/networking/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

# root main.tf — consume module outputs
module "networking" {
  source = "./modules/networking"
  cidr   = "10.0.0.0/16"
}

resource "aws_eks_cluster" "main" {
  vpc_config {
    subnet_ids = module.networking.private_subnet_ids
  }
}
```

### 31. Variable for list of IAM policy ARNs
```hcl
variable "iam_policy_arns" {
  type        = list(string)
  description = "List of IAM policy ARNs to attach to the role"
  default = [
    "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
    "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
  ]
}

resource "aws_iam_role_policy_attachment" "app" {
  for_each   = toset(var.iam_policy_arns)
  role       = aws_iam_role.app.name
  policy_arn = each.value
}
```

### 32. Deeply nested locals for CIDR planning
```hcl
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

locals {
  network = {
    vpc_cidr = var.vpc_cidr
    public = {
      cidr_a = cidrsubnet(var.vpc_cidr, 8, 0)
      cidr_b = cidrsubnet(var.vpc_cidr, 8, 1)
      cidr_c = cidrsubnet(var.vpc_cidr, 8, 2)
    }
    private = {
      cidr_a = cidrsubnet(var.vpc_cidr, 8, 10)
      cidr_b = cidrsubnet(var.vpc_cidr, 8, 11)
      cidr_c = cidrsubnet(var.vpc_cidr, 8, 12)
    }
    database = {
      cidr_a = cidrsubnet(var.vpc_cidr, 8, 20)
      cidr_b = cidrsubnet(var.vpc_cidr, 8, 21)
      cidr_c = cidrsubnet(var.vpc_cidr, 8, 22)
    }
  }
}
```

### 33. Output map from for_each resources
```hcl
resource "aws_s3_bucket" "buckets" {
  for_each = toset(["data", "logs", "artifacts"])
  bucket   = "${var.project}-${each.key}-${var.environment}"
}

output "bucket_arns" {
  description = "Map of bucket name to ARN"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.arn }
}

output "bucket_names" {
  description = "Map of bucket name to actual bucket name"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket }
}
```

### 34. Variable with cross-validation using locals
```hcl
variable "min_instances" {
  type    = number
  default = 1
}

variable "max_instances" {
  type    = number
  default = 10
}

locals {
  valid_instance_range = var.min_instances <= var.max_instances
}

resource "null_resource" "validate" {
  lifecycle {
    precondition {
      condition     = local.valid_instance_range
      error_message = "min_instances must be <= max_instances."
    }
  }
}
```

### 35. Sensitive output suppressed in plan output
```hcl
output "connection_string" {
  value = "postgresql://${var.db_user}:${var.db_password}@${aws_db_instance.main.address}:5432/app"
  sensitive = true
}

# To show: terraform output -raw connection_string
# To show all: terraform output -json | jq
```

### 36. Variable with tuple type
```hcl
variable "port_range" {
  type        = tuple([number, number])
  description = "Port range as [from_port, to_port]"
  default     = [8080, 8090]
}

resource "aws_vpc_security_group_ingress_rule" "app" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "10.0.0.0/8"
  from_port         = var.port_range[0]
  to_port           = var.port_range[1]
  ip_protocol       = "tcp"
}
```

### 37. Environment-specific .tfvars pattern
```bash
# environments/dev.tfvars
environment       = "dev"
instance_type     = "t3.micro"
min_instances     = 1
max_instances     = 3
enable_monitoring = false

# environments/prod.tfvars
environment       = "prod"
instance_type     = "t3.large"
min_instances     = 3
max_instances     = 20
enable_monitoring = true

# Usage:
terraform apply -var-file="environments/${TF_ENVIRONMENT}.tfvars"
```

---

## Advanced

### 38. Type any for flexible module inputs
```hcl
variable "tags" {
  type        = any
  description = "Additional tags to apply to all resources"
  default     = {}
}
```

### 39. Variable set validation with can() and try()
```hcl
variable "kms_key_arn" {
  type    = string
  default = null
  validation {
    condition = var.kms_key_arn == null || can(
      regex("^arn:aws:kms:[a-z0-9-]+:[0-9]{12}:key/[0-9a-f-]{36}$", var.kms_key_arn)
    )
    error_message = "kms_key_arn must be null or a valid KMS key ARN."
  }
}
```

### 40. Using try() for optional output
```hcl
output "nat_gateway_ips" {
  description = "NAT Gateway public IPs (empty if not created)"
  value       = try(aws_eip.nat[*].public_ip, [])
}
```

### 41. Output for use in CI/CD
```hcl
output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}
# Usage in CI:
# ECR_URL=$(terraform output -raw ecr_repository_url)
# docker build -t $ECR_URL:$GIT_SHA .
```

### 42. Using output in terraform_remote_state
```hcl
# State A: networking stack outputs
output "vpc_id" { value = aws_vpc.main.id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }

# State B: application stack consumes networking outputs
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "my-tfstate"
    key    = "networking/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_eks_cluster" "main" {
  vpc_config {
    subnet_ids = data.terraform_remote_state.networking.outputs.private_subnet_ids
  }
}
```

### 43. Variable schema for multi-tier app
```hcl
variable "app_config" {
  type = object({
    name        = string
    environment = string
    web = object({
      instance_type    = string
      min_size         = number
      max_size         = number
    })
    api = object({
      instance_type    = string
      min_size         = number
      max_size         = number
      port             = number
    })
    database = object({
      engine         = string
      instance_class = string
      storage_gb     = number
      multi_az       = optional(bool, true)
    })
  })
}
```

### 44. Output with precondition (Terraform 1.2+)
```hcl
output "certificate_arn" {
  value       = aws_acm_certificate.main.arn
  description = "ACM certificate ARN — only valid after validation"
  precondition {
    condition     = aws_acm_certificate.main.status == "ISSUED"
    error_message = "Certificate must be in ISSUED state before outputting ARN."
  }
}
```

### 45. Auto-loaded variable file per workspace
```bash
# terraform.workspace = "prod"
# Auto-load: terraform.tfvars then *.auto.tfvars
# Pattern: create prod.auto.tfvars that is ignored in .gitignore for secrets

# .gitignore
*.auto.tfvars
!example.auto.tfvars
```

### 46. locals for complex IAM policy construction
```hcl
locals {
  s3_resources = [
    "${aws_s3_bucket.data.arn}",
    "${aws_s3_bucket.data.arn}/*",
  ]

  iam_policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [{
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = local.s3_resources
      }],
      var.enable_delete ? [{
        Effect   = "Allow"
        Action   = ["s3:DeleteObject"]
        Resource = local.s3_resources
      }] : []
    )
  })
}
```

### 47. Surfacing all important module outputs
```hcl
# modules/app/outputs.tf
output "all" {
  description = "All module outputs as a single object"
  value = {
    vpc_id              = aws_vpc.main.id
    public_subnet_ids   = aws_subnet.public[*].id
    private_subnet_ids  = aws_subnet.private[*].id
    alb_dns_name        = aws_lb.app.dns_name
    ecs_cluster_arn     = aws_ecs_cluster.app.arn
    ecr_repository_url  = aws_ecr_repository.app.repository_url
  }
}
```

### 48. locals for dynamic subnet creation
```hcl
variable "vpc_config" {
  type = object({
    cidr            = string
    public_subnets  = list(string)
    private_subnets = list(string)
    azs             = list(string)
  })
}

locals {
  public_subnet_map = {
    for i, cidr in var.vpc_config.public_subnets :
    "public-${i}" => {
      cidr = cidr
      az   = var.vpc_config.azs[i]
    }
  }
  private_subnet_map = {
    for i, cidr in var.vpc_config.private_subnets :
    "private-${i}" => {
      cidr = cidr
      az   = var.vpc_config.azs[i]
    }
  }
}
```

### 49. Using output to pass data to shell scripts
```bash
# After terraform apply:
terraform output -json > outputs.json
VPC_ID=$(terraform output -raw vpc_id)
SUBNETS=$(terraform output -json private_subnet_ids | jq -r 'join(",")')
aws eks update-kubeconfig --name $(terraform output -raw cluster_name) --region us-east-1
```

### 50. Full variable/output pattern for reusable module
```hcl
# variables.tf
variable "project"     { type = string }
variable "environment" { type = string }
variable "region"      { type = string; default = "us-east-1" }
variable "vpc_cidr"    { type = string; default = "10.0.0.0/16" }

variable "tags" {
  type    = map(string)
  default = {}
}

# locals.tf
locals {
  name   = "${var.project}-${var.environment}"
  region = var.region
  tags   = merge({ Project = var.project, Environment = var.environment, ManagedBy = "terraform" }, var.tags)
}

# outputs.tf
output "name"           { value = local.name }
output "vpc_id"         { value = aws_vpc.main.id }
output "vpc_cidr"       { value = aws_vpc.main.cidr_block }
output "public_subnets" { value = aws_subnet.public[*].id }
output "private_subnets"{ value = aws_subnet.private[*].id }
output "tags"           { value = local.tags }
```
