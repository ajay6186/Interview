# Examples 1.3 — Variables & Outputs (50 examples)

> **Topic Overview:** Variables make Terraform configurations reusable and environment-agnostic. Outputs expose resource attributes to operators and other Terraform stacks. Locals compute intermediate values to reduce repetition. Understanding variable types, validation, sensitivity, precedence, and the `outputs → remote_state` pattern is essential for writing modular, maintainable infrastructure code.

---

## Basic

### 1. Simple string variable
> The `description` field documents the variable's purpose — shown in `terraform plan` when the variable is unset. The `default` makes the variable optional; without a default it becomes required.
```hcl
variable "region" {
  type        = string
  description = "AWS region to deploy resources"
  default     = "us-east-1"
}
```

### 2. Number variable
> Numbers in HCL are untyped floats. `type = number` validates that the input is numeric. Use for counts, sizes, thresholds, and port numbers.
```hcl
variable "instance_count" {
  type        = number
  description = "Number of EC2 instances"
  default     = 2
}
```

### 3. Boolean variable
> Boolean variables are used for feature flags, toggle behaviors (enable/disable monitoring), or conditional resource creation. They evaluate in `count = var.flag ? 1 : 0` patterns.
```hcl
variable "enable_deletion_protection" {
  type        = bool
  description = "Enable deletion protection on the RDS instance"
  default     = true
}
```

### 4. Referencing a variable
> Variables are accessed with the `var.` prefix. Terraform substitutes the variable's value at plan/apply time. This is the core mechanism for making configurations environment-agnostic.
```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
}
```

### 5. Simple output
> Outputs expose resource attributes to the terminal after `apply` and to other stacks via `terraform_remote_state`. Always include a `description` — it appears in `terraform output` and the registry documentation.
```hcl
output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.web.id
}
```

### 6. Output with sensitive flag
> `sensitive = true` suppresses the value in plan/apply output and marks it redacted in the terminal. **The raw value is still stored in state** — protect your state file appropriately.
```hcl
output "db_password" {
  description = "Database master password"
  value       = aws_db_instance.main.password
  sensitive   = true
}
```

### 7. locals block
> `locals` compute intermediate values once and reuse them throughout the module. They reduce repetition and make complex expressions readable. Unlike variables, locals cannot be overridden from outside the module.
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
> `list(string)` constrains all elements to strings. Lists are ordered and allow duplicates. Use for AZ lists, CIDR blocks, and any ordered collection of values.
```hcl
variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones"
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

### 9. Map variable
> Maps associate string keys to string values. The `var.instance_types[var.environment]` pattern selects a per-environment value — a clean alternative to long conditional chains.
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
> Required variables (no `default`) force the caller to provide a value. This is the right choice for values like `ami_id` that vary by region and should never have a fallback.
```hcl
variable "ami_id" {
  type        = string
  description = "AMI ID for the EC2 instance (required)"
  # No default — must be provided
}
```

### 11. Passing variable via CLI
> `-var` flags override defaults and `.tfvars` files. They have the highest precedence (after environment variables). Useful in CI/CD for injecting environment-specific values.
```bash
terraform apply -var="environment=prod" -var="instance_count=3"
```

### 12. Passing variables via .tfvars file
> `terraform.tfvars` and `*.auto.tfvars` files are loaded automatically. For other files, use `-var-file`. This is the standard way to manage environment-specific configurations in version control.
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
> `object({...})` creates a structured variable with named, typed fields. More explicit than `map(any)` — Terraform validates each field's type at parse time. Great for grouping related configuration.
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
> `list(object({...}))` is a typed collection of structured items. Used when you need to create multiple resources with different configurations — pair with `for_each = { for idx, s in var.subnet_configs : idx => s }`.
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
> Validation blocks run at plan/apply time and give user-friendly error messages instead of cryptic provider errors. Always add validations for variables with restricted value sets (environment names, regions).
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
> `can(regex(...))` returns `true` if the regex matches, `false` otherwise (doesn't throw). Use `can()` for format validation — bucket names, ARN formats, CIDR blocks, email addresses.
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
> `sensitive = true` prevents the value from appearing in plan/apply output and marks it as `(sensitive value)` in logs. Use for passwords, API keys, certificates. The value IS stored in state — protect your state file.
```hcl
variable "db_password" {
  type        = string
  description = "Database master password"
  sensitive   = true
}
```

### 18. Environment variable for sensitive inputs
> `TF_VAR_<name>` injects variable values via shell environment variables — the cleanest way to pass secrets in CI/CD pipelines. Values are never written to disk or visible in shell history if set via CI secrets.
```bash
export TF_VAR_db_password="super-secret-password"
export TF_VAR_api_key="my-api-key"
terraform apply
```

### 19. Output depending on another output
> Multiple related outputs from the same module. Callers can reference individual outputs (`module.vpc.vpc_id`) or combine them. The splat expression `[*].id` collects all IDs from a `count`-based resource.
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
> Outputs can include string interpolation and function calls. `split(":", endpoint)[0]` extracts the hostname from an RDS endpoint (which is `hostname:port`). These transformations keep callers simple.
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
> `nonsensitive()` removes the sensitive marking from a value. **Use with extreme care** — only when the computed value is safe to show (e.g., a formatted URL with a hashed credential, never a raw password).
```hcl
output "db_connection_string" {
  value     = nonsensitive("postgres://${var.db_user}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}")
  sensitive = false
  # Use with extreme care — only when value is truly safe to expose
}
```

### 22. Output with depends_on
> `depends_on` in an output block forces Terraform to wait for specified resources before making the output available. Useful when the output's correctness depends on side-effect operations (like a listener being ready).
```hcl
output "app_url" {
  value       = "https://${aws_lb.app.dns_name}/api"
  depends_on  = [aws_lb_listener.https]
}
```

### 23. .tfvars.json format
> JSON format for `.tfvars` files is useful when your CI/CD system generates variable files programmatically (e.g., from a config management API). The map type maps directly to a JSON object.
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
> `slice()` takes the first 3 AZs (handles regions with 2+ AZs). `cidrsubnet()` computes non-overlapping subnet CIDRs from the VPC CIDR. This replaces hardcoded CIDR lists with mathematical calculations.
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
> From Terraform 1.9+, a single variable can have multiple `validation` blocks. Each block is checked independently, providing specific error messages for each constraint — much cleaner than combining conditions with `&&`.
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
> `optional(type, default)` marks object fields as not required. If the caller omits the field, it gets the specified default value. This enables backwards-compatible changes to module interfaces without breaking existing callers.
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
> `map(object({...}))` combines a map's key-based lookup with an object's field typing. The map keys become `each.key` in `for_each`, enabling readable resource names. `optional(string, "")` makes `description` omittable.
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
> Locals can reference other locals in the same block — Terraform resolves the dependency order. `merge()` combines base tags with caller-provided extra tags; caller-provided tags take precedence (rightmost wins in merge).
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
> Outputting the entire resource object (not just an ID) gives callers access to all attributes without the module explicitly declaring each one. This is flexible but creates a tight coupling — the caller depends on internal resource structure.
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
> The standard pattern for passing networking outputs to a compute module. The consuming module never manages the VPC — it just references the IDs. This separation of concerns enables independent lifecycle management.
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
> `toset()` converts the list to a set (removes duplicates, loses ordering) which `for_each` requires. Each policy ARN gets its own `aws_iam_role_policy_attachment` resource — safer than a single attachment that manages all policies.
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
> Organizing CIDRs in a nested `locals` map makes the network layout readable and self-documenting. `cidrsubnet(base, 8, n)` divides the VPC CIDR into /24 subnets — the `8` is the number of additional bits.
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
> The `for` expression over `aws_s3_bucket.buckets` creates a new map where each key maps to a bucket attribute. This lets callers look up specific buckets by logical name rather than by index.
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
> Cross-variable validation isn't natively supported in variable blocks. The workaround: compute a boolean in locals and check it in a `null_resource` precondition. This validates relationships between two variables.
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
> Sensitive outputs show as `(sensitive value)` in the terminal. To read the actual value: `terraform output -raw connection_string`. Only expose sensitive outputs to processes/systems that actually need them.
```hcl
output "connection_string" {
  value = "postgresql://${var.db_user}:${var.db_password}@${aws_db_instance.main.address}:5432/app"
  sensitive = true
}

# To show: terraform output -raw connection_string
# To show all: terraform output -json | jq
```

### 36. Variable with tuple type
> `tuple([number, number])` is a fixed-length list where each position has a declared type. Less flexible than a list but self-documenting: callers know exactly what to provide. Use for port ranges, coordinate pairs, etc.
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
> Maintaining separate `.tfvars` per environment ensures each environment gets validated, version-controlled configuration. Use `$TF_ENVIRONMENT` in CI to select the right file automatically.
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
> `type = any` disables type checking for that variable. Use sparingly — only when the variable genuinely needs to accept different structures (e.g., a `tags` map that might have any keys). Prefer explicit types when possible.
```hcl
variable "tags" {
  type        = any
  description = "Additional tags to apply to all resources"
  default     = {}
}
```

### 39. Variable set validation with can() and try()
> `can(regex(...))` returns `true/false` safely, never throws. This validates that `kms_key_arn` is either null OR a properly formatted KMS ARN. The `||` short-circuits if the variable is null — no regex run needed.
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
> `try()` evaluates expressions left-to-right and returns the first one that doesn't error. If `aws_eip.nat[*].public_ip` fails (because `aws_eip.nat` doesn't exist), `try()` falls back to `[]`.
```hcl
output "nat_gateway_ips" {
  description = "NAT Gateway public IPs (empty if not created)"
  value       = try(aws_eip.nat[*].public_ip, [])
}
```

### 41. Output for use in CI/CD
> Designing outputs specifically for CI consumption. After `terraform apply`, scripts use `terraform output -raw ecr_repository_url` to get the ECR URL for Docker push commands. The outputs act as the interface between Terraform and deployment scripts.
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
> Outputs from one Terraform stack are consumed by another via `terraform_remote_state`. Stack A (networking) outputs its VPC/subnet IDs; Stack B (application) reads them to launch EC2/EKS into the correct subnets.
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
> A deeply nested object variable captures the entire application's configuration in one place. Each tier's config is independently typed. `optional(bool, true)` on `database.multi_az` defaults to HA in prod.
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
> A precondition on an output block prevents the output from being usable until the condition is satisfied. This prevents downstream consumers (other stacks) from reading an ACM cert ARN before it's been validated.
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
> `*.auto.tfvars` files are loaded automatically without `-var-file`. Gitignoring them (except the example) keeps secrets out of version control while the pattern is documented via the example file.
```bash
# terraform.workspace = "prod"
# Auto-load: terraform.tfvars then *.auto.tfvars
# Pattern: create prod.auto.tfvars that is ignored in .gitignore for secrets

# .gitignore
*.auto.tfvars
!example.auto.tfvars
```

### 46. locals for complex IAM policy construction
> `concat()` merges base statements with conditionally added delete permission. This is cleaner than duplicating the entire policy for enable/disable scenarios — the policy document builds itself from the module's inputs.
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
> The "all" output pattern wraps all significant module outputs in a single object. Callers can use `module.app.all.vpc_id` — self-documenting and easy to extend without breaking existing consumers.
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
> Transforms the flat `vpc_config` object into indexed maps suitable for `for_each`. The index (`"public-${i}"`) becomes the resource's stable key in state — critical for preventing resource replacement when subnet order changes.
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
> After `terraform apply`, shell scripts consume outputs to drive deployment automation. `terraform output -json` returns all outputs as JSON; pipe to `jq` for extraction. `-raw` strips quotes for direct use as arguments.
```bash
# After terraform apply:
terraform output -json > outputs.json
VPC_ID=$(terraform output -raw vpc_id)
SUBNETS=$(terraform output -json private_subnet_ids | jq -r 'join(",")')
aws eks update-kubeconfig --name $(terraform output -raw cluster_name) --region us-east-1
```

### 50. Full variable/output pattern for reusable module
> The canonical module interface: required variables with clear types, a tags variable for caller-provided metadata, locals merging standard + caller tags, and outputs covering all resources the caller will need.
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

---

## Key Takeaways

- **Variable precedence** (low → high): defaults → `terraform.tfvars` → `*.auto.tfvars` → `-var-file` → `-var` flags → `TF_VAR_*` env vars.
- **`sensitive = true`** suppresses terminal output but NOT state storage — always protect your state file.
- **`optional(type, default)`** in object types enables additive, backwards-compatible module interface changes.
- **Locals** compute once and can reference other locals. Use them to eliminate repetition and make complex logic readable.
- **Outputs** are the interface to the outside world: to operators, to other stacks via `remote_state`, and to CI/CD scripts.
- **Validation blocks** give clear error messages before the provider even makes an API call — always validate constrained variables.

## Common Interview Questions & Answers

**Q: What is the variable precedence order in Terraform?**  
A: Default values < `terraform.tfvars` < `*.auto.tfvars` (alphabetical) < `-var-file` flags < `-var` flags. `TF_VAR_*` environment variables sit below `terraform.tfvars` in precedence but above defaults.

**Q: What is the difference between a `variable` and a `local`?**  
A: Variables are inputs that can be overridden by callers (via CLI, `.tfvars`, env vars). Locals are internal computed values — never overrideable from outside. Locals reduce repetition and improve readability; variables define the module's public interface.

**Q: How do you pass secrets to Terraform without storing them in files?**  
A: Use `TF_VAR_<name>` environment variables (set by your CI/CD secrets manager), or mark variables as `sensitive = true` and pass via `-var` or a secrets manager integration (Vault, SSM Parameter Store data source).

**Q: How do you share outputs between two Terraform stacks?**  
A: The source stack defines outputs; the consuming stack reads them via `data "terraform_remote_state"`. The source stack's state must be accessible (e.g., an S3 bucket with appropriate IAM permissions).

**Q: What is `optional()` in object type constraints?**  
A: Added in Terraform 1.3+, `optional(type, default)` marks an object field as not required. If the caller omits it, the default value is used. This enables backwards-compatible additions to module variable schemas.
