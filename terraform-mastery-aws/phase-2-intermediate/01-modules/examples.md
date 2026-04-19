# Examples 2.1 — Modules (50 examples)

---

## Basic

### 1. Call a local module
```hcl
module "vpc" {
  source = "./modules/vpc"

  cidr_block  = "10.0.0.0/16"
  environment = "production"
}
```

### 2. Module with required and optional variables
```hcl
# modules/ec2/variables.tf
variable "instance_type" {
  type        = string
  description = "EC2 instance type"
}

variable "ami_id" {
  type        = string
  description = "AMI ID"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Resource tags"
}
```

### 3. Module outputs
```hcl
# modules/vpc/outputs.tf
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}
```

### 4. Use module output in a resource
```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  subnet_id     = module.vpc.public_subnet_ids[0]
}
```

### 5. Call a registry module
```hcl
module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.0"

  bucket = "my-app-bucket"
  acl    = "private"

  versioning = {
    enabled = true
  }
}
```

### 6. Module source — local path
```hcl
module "security_groups" {
  source = "./modules/security-groups"
}
```

### 7. Module source — Git repository
```hcl
module "vpc" {
  source = "git::https://github.com/myorg/terraform-modules.git//vpc?ref=v1.2.0"
}
```

### 8. Module source — registry with version
```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "my-cluster"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
}
```

### 9. terraform get — download modules
```bash
terraform get          # download/update modules declared in config
terraform get -update  # force update even if already downloaded
```

### 10. Module with minimal interface
```hcl
# modules/s3-website/main.tf
resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  index_document { suffix = "index.html" }
  error_document { key = "error.html" }
}
```

### 11. Viewing module outputs after apply
```bash
terraform output                          # all outputs from root
terraform output -json                    # JSON format
terraform output -raw vpc_id             # raw string value
```

### 12. Module versioning from public registry
```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.0"  # pin exact version for reproducibility

  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

---

## Intermediate

### 13. Module with optional variables using defaults
```hcl
variable "enable_nat_gateway" {
  type    = bool
  default = false
}

variable "nat_gateway_count" {
  type    = number
  default = 1
  validation {
    condition     = var.nat_gateway_count >= 1 && var.nat_gateway_count <= 3
    error_message = "NAT gateway count must be between 1 and 3."
  }
}
```

### 14. Pass provider alias to module
```hcl
provider "aws" {
  region = "us-east-1"
}
provider "aws" {
  alias  = "replica"
  region = "us-west-2"
}

module "replica_bucket" {
  source = "./modules/s3-replica"
  providers = {
    aws         = aws
    aws.replica = aws.replica
  }
}
```

### 15. Module declaring required provider aliases
```hcl
# modules/s3-replica/main.tf
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.replica]
    }
  }
}

resource "aws_s3_bucket" "primary" {
  bucket = var.primary_bucket_name
}

resource "aws_s3_bucket" "replica" {
  provider = aws.replica
  bucket   = var.replica_bucket_name
}
```

### 16. Module output used in another module
```hcl
module "network" {
  source     = "./modules/network"
  cidr_block = "10.0.0.0/16"
}

module "compute" {
  source             = "./modules/compute"
  vpc_id             = module.network.vpc_id         # chained output
  private_subnet_ids = module.network.private_subnet_ids
}

module "database" {
  source     = "./modules/database"
  subnet_ids = module.network.private_subnet_ids
  sg_ids     = [module.compute.db_security_group_id] # chained output
}
```

### 17. Module with complex object variable
```hcl
variable "vpc_config" {
  type = object({
    cidr_block           = string
    enable_dns_hostnames = optional(bool, true)
    enable_dns_support   = optional(bool, true)
    tags                 = optional(map(string), {})
  })
}
```

### 18. Module count — create multiple instances
```hcl
module "web_server" {
  count  = 3
  source = "./modules/ec2"

  instance_type = "t3.micro"
  name          = "web-${count.index + 1}"
  subnet_id     = var.subnet_ids[count.index]
}

output "web_server_ids" {
  value = module.web_server[*].instance_id
}
```

### 19. Module for_each — one module per environment
```hcl
variable "environments" {
  type = map(object({
    instance_type = string
    min_size      = number
    max_size      = number
  }))
  default = {
    dev  = { instance_type = "t3.micro",  min_size = 1, max_size = 2 }
    prod = { instance_type = "t3.medium", min_size = 2, max_size = 10 }
  }
}

module "app" {
  for_each      = var.environments
  source        = "./modules/app"
  environment   = each.key
  instance_type = each.value.instance_type
  min_size      = each.value.min_size
  max_size      = each.value.max_size
}
```

### 20. Module depends_on
```hcl
module "app" {
  source     = "./modules/app"
  depends_on = [module.network, module.iam]  # ensure these complete first
}
```

### 21. Module with lifecycle prevent_destroy
```hcl
module "database" {
  source = "./modules/rds"

  lifecycle {
    prevent_destroy = true
  }
}
```

### 22. Conditional module invocation
```hcl
module "cdn" {
  count  = var.enable_cdn ? 1 : 0
  source = "./modules/cloudfront"

  origin_domain = aws_lb.app.dns_name
}

output "cdn_domain" {
  value = var.enable_cdn ? module.cdn[0].domain_name : null
}
```

### 23. Module from private registry
```hcl
module "vpc" {
  source  = "app.terraform.io/my-org/vpc/aws"
  version = "~> 2.0"

  cidr_block = "10.0.0.0/16"
}
```

### 24. terraform-aws-modules/vpc complete example
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = "${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod"
  enable_dns_hostnames = true

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

### 25. Module with sensitive output
```hcl
# modules/rds/outputs.tf
output "db_password" {
  value       = random_password.db.result
  sensitive   = true
  description = "Database master password"
}

# Root module
output "db_password" {
  value     = module.database.db_password
  sensitive = true
}
```

---

## Nested

### 26. Three-level module hierarchy
```hcl
# Root calls "platform" module
module "platform" {
  source      = "./modules/platform"
  environment = "production"
}

# modules/platform/main.tf calls "network" and "compute"
module "network" {
  source     = "../network"
  cidr_block = var.cidr_block
}

module "compute" {
  source    = "../compute"
  vpc_id    = module.network.vpc_id
  subnet_ids = module.network.private_subnet_ids
}
```

### 27. Module composition for full stack
```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

module "ec2" {
  source            = "./modules/ec2"
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

module "rds" {
  source             = "./modules/rds"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  app_security_group = module.ec2.security_group_id
}

module "alb" {
  source             = "./modules/alb"
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  target_instance_ids = module.ec2.instance_ids
}
```

### 28. Nested module with for_each for multi-region
```hcl
variable "regions" {
  type    = list(string)
  default = ["us-east-1", "us-west-2", "eu-west-1"]
}

module "regional_deploy" {
  for_each = toset(var.regions)
  source   = "./modules/regional-stack"

  region      = each.value
  environment = var.environment
}
```

### 29. Passing module outputs as a list
```hcl
module "web_asg" {
  source = "./modules/asg"

  # Collect outputs from multiple module instances
  subnet_ids = concat(
    module.vpc_east.private_subnet_ids,
    module.vpc_west.private_subnet_ids
  )
}
```

### 30. Module wrapping a registry module
```hcl
# modules/app-vpc/main.tf — wraps terraform-aws-modules/vpc
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = "${var.app_name}-${var.environment}"
  cidr = var.cidr_block
  azs  = data.aws_availability_zones.available.names

  private_subnets = [for i, az in data.aws_availability_zones.available.names : cidrsubnet(var.cidr_block, 8, i)]
  public_subnets  = [for i, az in data.aws_availability_zones.available.names : cidrsubnet(var.cidr_block, 8, i + 100)]

  enable_nat_gateway = var.enable_nat_gateway
  tags               = var.tags
}

output "vpc_id"            { value = module.vpc.vpc_id }
output "private_subnets"   { value = module.vpc.private_subnets }
output "public_subnets"    { value = module.vpc.public_subnets }
```

### 31. Module with moved block for refactoring
```hcl
# When renaming a module call without destroying resources
moved {
  from = module.legacy_app
  to   = module.app
}

moved {
  from = module.app.aws_instance.server
  to   = module.app.aws_instance.web
}
```

### 32. Cross-module data sharing via locals
```hcl
module "network" {
  source = "./modules/network"
}

module "security" {
  source = "./modules/security"
  vpc_id = module.network.vpc_id
}

locals {
  # Aggregate outputs for downstream modules
  common_config = {
    vpc_id             = module.network.vpc_id
    private_subnet_ids = module.network.private_subnet_ids
    sg_ids             = module.security.sg_ids
  }
}

module "app" {
  source  = "./modules/app"
  network = local.common_config
}
```

### 33. Workspace-aware module configuration
```hcl
locals {
  env_config = {
    dev  = { instance_type = "t3.micro", min_size = 1 }
    prod = { instance_type = "t3.large", min_size = 3 }
  }
  config = local.env_config[terraform.workspace]
}

module "app" {
  source        = "./modules/app"
  instance_type = local.config.instance_type
  min_size      = local.config.min_size
}
```

### 34. Module outputs aggregated with for expression
```hcl
module "subnets" {
  for_each = var.subnet_config
  source   = "./modules/subnet"
  name     = each.key
  cidr     = each.value.cidr
}

output "subnet_ids" {
  value = { for k, v in module.subnets : k => v.subnet_id }
}
```

---

## Advanced

### 35. Reusable VPC module implementation
```hcl
# modules/vpc/main.tf
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(var.tags, { Name = var.name })
}

resource "aws_subnet" "public" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = local.azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(var.tags, { Name = "${var.name}-public-${count.index + 1}", Tier = "public" })
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index + 10)
  availability_zone = local.azs[count.index]
  tags = merge(var.tags, { Name = "${var.name}-private-${count.index + 1}", Tier = "private" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "${var.name}-igw" })
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
}
```

### 36. Module with precondition and postcondition
```hcl
variable "instance_type" {
  type = string
  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium", "t3.large"], var.instance_type)
    error_message = "Instance type must be a t3 family type."
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.app.id
  instance_type = var.instance_type

  lifecycle {
    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance did not receive a public IP."
    }
  }
}
```

### 37. Module with complex output contracts
```hcl
# modules/alb/outputs.tf
output "alb" {
  value = {
    id          = aws_lb.main.id
    arn         = aws_lb.main.arn
    dns_name    = aws_lb.main.dns_name
    zone_id     = aws_lb.main.zone_id
    listener = {
      http_arn  = aws_lb_listener.http.arn
      https_arn = aws_lb_listener.https.arn
    }
    target_group_arn = aws_lb_target_group.app.arn
  }
  description = "Complete ALB configuration"
}
```

### 38. Publishing a module to Terraform Registry
```bash
# Requirements:
# 1. GitHub repo named: terraform-<PROVIDER>-<MODULE_NAME>
# 2. Tag releases as: v<SEMVER> (e.g., v1.0.0)
# 3. Standard module structure:
#    main.tf, variables.tf, outputs.tf
#    modules/ (submodules)
#    examples/

# Module structure
terraform-aws-vpc/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── README.md
├── modules/
│   ├── subnets/
│   └── nat/
└── examples/
    ├── simple/
    └── complete/
```

### 39. Module testing with terraform test (Terraform 1.6+)
```hcl
# tests/vpc.tftest.hcl
run "create_vpc" {
  command = plan

  assert {
    condition     = module.vpc.vpc_id != ""
    error_message = "VPC ID should not be empty"
  }

  assert {
    condition     = length(module.vpc.public_subnet_ids) == 3
    error_message = "Should have 3 public subnets"
  }
}

run "full_deploy" {
  command = apply

  assert {
    condition     = module.vpc.vpc_cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR should be 10.0.0.0/16"
  }
}
```

### 40. Module with dynamic resource creation
```hcl
# modules/security-groups/main.tf
variable "rules" {
  type = list(object({
    port        = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
}

resource "aws_security_group" "main" {
  name   = var.name
  vpc_id = var.vpc_id

  dynamic "ingress" {
    for_each = var.rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 41. Module version constraints with ~> operator
```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"  # >= 20.0, < 21.0
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = ">= 5.0, < 6.0"  # range constraint
}
```

### 42. Module with optional submodules
```hcl
module "app" {
  source = "./modules/app"

  # Core config
  name          = "my-app"
  instance_type = "t3.medium"

  # Optional features
  enable_monitoring = true
  enable_cdn        = var.environment == "prod"
  enable_waf        = var.environment == "prod"
}
```

### 43. Aggregating multi-module security group IDs
```hcl
module "web_sg"  { source = "./modules/sg"; name = "web"; rules = var.web_rules }
module "app_sg"  { source = "./modules/sg"; name = "app"; rules = var.app_rules }
module "db_sg"   { source = "./modules/sg"; name = "db";  rules = var.db_rules }

locals {
  all_sg_ids = {
    web = module.web_sg.id
    app = module.app_sg.id
    db  = module.db_sg.id
  }
}
```

### 44. Module that creates IAM roles and policies
```hcl
# modules/app-iam/main.tf
resource "aws_iam_role" "app" {
  name               = "${var.app_name}-${var.environment}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "app" {
  dynamic "statement" {
    for_each = var.policy_statements
    content {
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "${var.app_name}-policy"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app.json
}
```

### 45. Module source integrity with git tag and SHA
```hcl
module "vpc" {
  # Pin to exact git commit hash for reproducibility
  source = "git::https://github.com/myorg/terraform-modules.git//vpc?ref=abc1234def567890"
}

# Or pin to tag
module "eks" {
  source = "git::https://github.com/myorg/terraform-modules.git//eks?ref=v2.3.1"
}
```

### 46. Module wrapping for internal standards enforcement
```hcl
# internal/modules/ec2/main.tf — always enforces tagging, encryption, etc.
resource "aws_instance" "this" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.security_group_ids
  iam_instance_profile        = var.instance_profile
  monitoring                  = true                    # always enabled
  ebs_optimized               = true                    # always enabled
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"            # IMDSv2 always required
    http_put_response_hop_limit = 1
  }
  root_block_device {
    encrypted   = true                                  # always encrypted
    volume_type = "gp3"
    volume_size = var.root_volume_size
  }
  tags = merge(var.tags, {
    ManagedBy   = "terraform"
    Module      = "internal/ec2"
  })
}
```

### 47. Module with for_each and complex outputs
```hcl
module "microservices" {
  for_each = var.services

  source        = "./modules/ecs-service"
  name          = each.key
  image         = each.value.image
  cpu           = each.value.cpu
  memory        = each.value.memory
  port          = each.value.port
  desired_count = each.value.desired_count

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  cluster_id = aws_ecs_cluster.main.id
}

output "service_arns" {
  value = { for k, v in module.microservices : k => v.service_arn }
}

output "task_role_arns" {
  value = { for k, v in module.microservices : k => v.task_role_arn }
}
```

### 48. Module generating multiple related resources
```hcl
# modules/s3-with-replication/main.tf
resource "aws_s3_bucket" "primary" {
  bucket = var.bucket_name
  provider = aws
}

resource "aws_s3_bucket" "replica" {
  bucket   = "${var.bucket_name}-replica"
  provider = aws.replica
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  bucket = aws_s3_bucket.primary.id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "full-replication"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### 49. Module documentation with README
```markdown
## Usage
module "vpc" {
  source      = "terraform-aws-modules/vpc/aws"
  version     = "~> 5.5"
  name        = "my-vpc"
  cidr        = "10.0.0.0/16"
  azs         = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}

## Requirements
| Name | Version |
|------|---------|
| terraform | >= 1.5 |
| aws | ~> 5.0 |

## Inputs
| Name | Description | Type | Required |
|------|-------------|------|----------|
| name | VPC name | string | yes |
```

### 50. Complete multi-tier infrastructure with modules
```hcl
# main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"
  name    = "${var.app_name}-${var.environment}"
  cidr    = var.vpc_cidr
  azs     = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets  = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i)]
  public_subnets   = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 100)]
  database_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 200)]
  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "prod"
  create_database_subnet_group = true
  tags = local.common_tags
}

module "alb" {
  source             = "terraform-aws-modules/alb/aws"
  version            = "~> 9.0"
  name               = "${var.app_name}-alb"
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
}

module "ecs" {
  source       = "terraform-aws-modules/ecs/aws"
  version      = "~> 5.0"
  cluster_name = "${var.app_name}-${var.environment}"
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"
  identifier     = "${var.app_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class
  db_name        = var.db_name
  username       = "dbadmin"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security.db_sg_id]
}
```
