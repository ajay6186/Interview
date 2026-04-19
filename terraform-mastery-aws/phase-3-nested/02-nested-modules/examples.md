# Examples 3.2 — Nested Modules (50 examples)

---

## Basic

### 1. Calling a local module
```hcl
module "vpc" {
  source = "./modules/vpc"
  name   = "main"
  cidr   = "10.0.0.0/16"
}
```

### 2. Module with required inputs
```hcl
# modules/s3/main.tf
variable "bucket_name" { type = string }
variable "environment" { type = string }

resource "aws_s3_bucket" "this" {
  bucket = "${var.bucket_name}-${var.environment}"
}
output "bucket_arn" { value = aws_s3_bucket.this.arn }
```

### 3. Calling the module from root
```hcl
module "app_bucket" {
  source      = "./modules/s3"
  bucket_name = "myapp"
  environment = var.environment
}
```

### 4. Using module output in another resource
```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr   = "10.0.0.0/16"
}

resource "aws_subnet" "app" {
  vpc_id     = module.vpc.vpc_id
  cidr_block = "10.0.1.0/24"
}
```

### 5. Calling a module from Terraform Registry
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
}
```

### 6. Module with optional variable and default
```hcl
# modules/ec2/variables.tf
variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

### 7. Module version pinning from git tag
```hcl
module "networking" {
  source = "git::https://github.com/myorg/tf-modules.git//networking?ref=v1.2.3"
  vpc_cidr = "10.0.0.0/16"
}
```

### 8. Module with count
```hcl
module "worker_instance" {
  source        = "./modules/ec2"
  count         = var.worker_count
  name          = "worker-${count.index}"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.private[count.index % length(aws_subnet.private)].id
}
```

### 9. Module with for_each
```hcl
module "environment" {
  source      = "./modules/app-stack"
  for_each    = toset(["dev", "staging", "prod"])
  environment = each.key
  vpc_id      = module.vpc[each.key].vpc_id
}
```

### 10. Accessing output from a for_each module
```hcl
output "env_bucket_arns" {
  value = { for k, v in module.environment : k => v.bucket_arn }
}
```

### 11. Module with sensitive output
```hcl
# modules/rds/outputs.tf
output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
```

### 12. Passing module output as another module input
```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr   = "10.0.0.0/16"
}

module "eks" {
  source         = "./modules/eks"
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  cluster_name   = "prod-eks"
}
```

---

## Intermediate

### 13. Nested module — module calling another module
```hcl
# modules/app-stack/main.tf
module "sg" {
  source      = "../security-group"
  vpc_id      = var.vpc_id
  environment = var.environment
}

module "ec2" {
  source            = "../ec2"
  subnet_id         = var.subnet_id
  security_group_id = module.sg.sg_id
}
```

### 14. Module composition pattern — networking + compute + database
```hcl
# root main.tf
module "networking" {
  source      = "./modules/networking"
  environment = var.environment
  cidr        = var.vpc_cidr
}

module "compute" {
  source      = "./modules/compute"
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
  sg_ids      = [module.networking.app_sg_id]
}

module "database" {
  source      = "./modules/database"
  subnet_ids  = module.networking.data_subnet_ids
  sg_ids      = [module.networking.db_sg_id]
  depends_on  = [module.compute]
}
```

### 15. Provider override in child module call
```hcl
provider "aws" {
  alias  = "replica"
  region = "eu-west-1"
}

module "dr_setup" {
  source = "./modules/dr"
  providers = {
    aws = aws.replica
  }
  primary_bucket_arn = module.primary.bucket_arn
}
```

### 16. Module required_providers configuration_aliases
```hcl
# modules/dr/main.tf
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.replica]
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  provider = aws.primary
  bucket   = var.source_bucket_id
  role     = aws_iam_role.replication.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"
    destination {
      bucket        = var.destination_bucket_arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### 17. Module with variable validation
```hcl
# modules/rds/variables.tf
variable "engine" {
  type = string
  validation {
    condition     = contains(["mysql", "postgres", "aurora-mysql", "aurora-postgresql"], var.engine)
    error_message = "engine must be mysql, postgres, aurora-mysql, or aurora-postgresql."
  }
}
```

### 18. Module output with complex type
```hcl
# modules/networking/outputs.tf
output "subnets" {
  value = {
    public  = aws_subnet.public[*].id
    private = aws_subnet.private[*].id
    data    = aws_subnet.data[*].id
  }
  description = "Map of subnet IDs by tier"
}
```

### 19. Consuming complex module output
```hcl
module "networking" {
  source = "./modules/networking"
  cidr   = "10.0.0.0/16"
  azs    = ["us-east-1a", "us-east-1b"]
}

resource "aws_db_subnet_group" "rds" {
  name       = "rds-sg"
  subnet_ids = module.networking.subnets.data
}
```

### 20. Module depends_on for IAM propagation delay
```hcl
module "lambda_role" {
  source = "./modules/iam-role"
  name   = "lambda-execution"
}

module "lambda" {
  source     = "./modules/lambda"
  role_arn   = module.lambda_role.role_arn
  depends_on = [module.lambda_role]  # Wait for IAM propagation
}
```

### 21. Module for_each with environment-specific configs
```hcl
variable "environments" {
  type = map(object({
    instance_count = number
    instance_type  = string
    min_size       = number
    max_size       = number
  }))
}

module "app_env" {
  source         = "./modules/app"
  for_each       = var.environments
  environment    = each.key
  instance_count = each.value.instance_count
  instance_type  = each.value.instance_type
  min_size       = each.value.min_size
  max_size       = each.value.max_size
  vpc_id         = module.vpc[each.key].vpc_id
}
```

### 22. Module from a private git repo with SSH
```hcl
module "internal_networking" {
  source = "git::ssh://git@github.com/myorg/private-tf-modules.git//networking?ref=v2.1.0"
  cidr   = "10.0.0.0/16"
}
```

### 23. Module from S3 bucket
```hcl
module "shared_config" {
  source = "s3::https://s3.amazonaws.com/my-tf-modules/networking/v1.0.0.zip"
  cidr   = "10.0.0.0/16"
}
```

### 24. Passing locals into module
```hcl
locals {
  common_tags = {
    ManagedBy   = "terraform"
    Environment = var.environment
    Repository  = "infra"
  }
}

module "ec2" {
  source        = "./modules/ec2"
  instance_type = "t3.micro"
  tags          = local.common_tags
}
```

### 25. Module with terraform_remote_state as data source
```hcl
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "my-tfstate"
    key    = "networking/terraform.tfstate"
    region = "us-east-1"
  }
}

module "app" {
  source     = "./modules/app"
  vpc_id     = data.terraform_remote_state.networking.outputs.vpc_id
  subnet_ids = data.terraform_remote_state.networking.outputs.private_subnet_ids
}
```

---

## Nested

### 26. Three-level module nesting
```hcl
# root
module "platform" {
  source = "./modules/platform"
  env    = var.environment
}

# modules/platform/main.tf — level 1
module "networking" {
  source = "../networking"
  cidr   = var.cidr_block
}

module "compute_layer" {
  source     = "../compute-layer"
  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.private_subnet_ids
}

# modules/compute-layer/main.tf — level 2
module "asg" {
  source         = "../asg"
  launch_template_id = module.launch_template.id
  subnet_ids         = var.subnet_ids
}

module "launch_template" {
  source        = "../launch-template"
  ami_id        = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
}
```

### 27. Module registry with submodule
```hcl
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name    = "app-alb"
  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets

  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  target_groups = {
    app = {
      protocol         = "HTTP"
      port             = 8080
      target_type      = "ip"
    }
  }
}
```

### 28. Passing provider aliases down two module levels
```hcl
# root
provider "aws" { region = "us-east-1" }
provider "aws" { alias = "west"; region = "us-west-2" }

module "multi_region_app" {
  source = "./modules/multi-region-app"
  providers = {
    aws      = aws
    aws.west = aws.west
  }
}

# modules/multi-region-app/main.tf
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws, aws.west]
    }
  }
}

module "east_resources" {
  source = "../regional-resources"
  # inherits default aws provider
}

module "west_resources" {
  source = "../regional-resources"
  providers = { aws = aws.west }
}
```

### 29. Module for_each with nested outputs aggregation
```hcl
module "regional_vpc" {
  source   = "./modules/vpc"
  for_each = var.regions
  region   = each.key
  cidr     = each.value.cidr
}

locals {
  all_vpc_ids = { for k, v in module.regional_vpc : k => v.vpc_id }
  all_subnets = merge([
    for k, v in module.regional_vpc : {
      for subnet_id in v.private_subnet_ids :
      "${k}-${subnet_id}" => { region = k, id = subnet_id }
    }
  ]...)
}
```

### 30. Conditional module invocation
```hcl
variable "enable_waf" {
  type    = bool
  default = false
}

module "waf" {
  count  = var.enable_waf ? 1 : 0
  source = "./modules/waf"
  alb_arn = aws_lb.app.arn
}

module "cloudfront" {
  source  = "./modules/cloudfront"
  waf_acl_arn = var.enable_waf ? module.waf[0].acl_arn : null
}
```

### 31. Chaining module outputs across environments
```hcl
module "shared_infra" {
  source = "./modules/shared"
  name   = "shared"
}

module "dev" {
  source              = "./modules/app-env"
  environment         = "dev"
  shared_kms_key_arn  = module.shared_infra.kms_key_arn
  shared_log_bucket   = module.shared_infra.log_bucket_id
}

module "prod" {
  source              = "./modules/app-env"
  environment         = "prod"
  shared_kms_key_arn  = module.shared_infra.kms_key_arn
  shared_log_bucket   = module.shared_infra.log_bucket_id
}
```

### 32. Module with mixed count and standard resources
```hcl
# modules/ha-rds/main.tf
resource "aws_db_instance" "primary" {
  identifier     = "${var.name}-primary"
  engine         = "postgres"
  instance_class = var.instance_class
  multi_az       = var.environment == "prod"
}

resource "aws_db_instance" "read_replica" {
  count               = var.read_replica_count
  identifier          = "${var.name}-replica-${count.index}"
  instance_class      = var.replica_instance_class
  replicate_source_db = aws_db_instance.primary.identifier
}

output "primary_endpoint"  { value = aws_db_instance.primary.endpoint }
output "replica_endpoints" { value = aws_db_instance.read_replica[*].endpoint }
```

### 33. Module for service mesh pattern
```hcl
module "service_a" {
  source        = "./modules/microservice"
  name          = "service-a"
  port          = 8080
  cluster_id    = aws_ecs_cluster.main.id
  sd_namespace  = aws_service_discovery_private_dns_namespace.app.id
}

module "service_b" {
  source        = "./modules/microservice"
  name          = "service-b"
  port          = 8081
  cluster_id    = aws_ecs_cluster.main.id
  sd_namespace  = aws_service_discovery_private_dns_namespace.app.id
  upstream_host = "service-a.app.local"
}
```

### 34. Module wrapping terraform-aws-modules with opinions
```hcl
# modules/opinionated-eks/main.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"
  vpc_id          = var.vpc_id
  subnet_ids      = var.subnet_ids

  # Opinionated defaults
  cluster_endpoint_public_access  = false
  cluster_endpoint_private_access = true
  enable_irsa                     = true

  eks_managed_node_groups = var.node_groups
}

# Additional resources the base module doesn't create
resource "aws_eks_addon" "ebs_csi" {
  cluster_name = module.eks.cluster_name
  addon_name   = "aws-ebs-csi-driver"
}
```

### 35. Module with lifecycle hooks passed through
```hcl
# modules/ec2/main.tf
variable "prevent_destroy" {
  type    = bool
  default = false
}

resource "aws_instance" "this" {
  ami           = var.ami_id
  instance_type = var.instance_type

  lifecycle {
    prevent_destroy = var.prevent_destroy
    ignore_changes  = [ami, user_data]
  }
}
```

### 36. Hierarchical module structure — monorepo pattern
```hcl
# environments/prod/main.tf
module "us_east" {
  source = "../../regions/us-east-1"
  env    = "prod"
  config = var.us_east_config
}

module "us_west" {
  source = "../../regions/us-west-2"
  env    = "prod"
  config = var.us_west_config
}

# regions/us-east-1/main.tf
module "networking" { source = "../../modules/networking" }
module "eks"        { source = "../../modules/eks" }
module "rds"        { source = "../../modules/rds" }
```

### 37. Module version strategy with lockfile
```hcl
# Pin critical infrastructure modules tightly
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "= 5.1.2"  # exact pin — breaking changes locked out
}

# Allow patch updates for utility modules
module "iam_role" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version = "~> 5.30"
}
```

---

## Advanced

### 38. Module publishing to private Terraform registry
```hcl
# Module must follow naming: terraform-<PROVIDER>-<NAME>
# terraform-aws-vpc, terraform-aws-eks, etc.
# Versioned with git tags: v1.0.0, v1.1.0

# Consuming from private registry:
module "vpc" {
  source  = "app.terraform.io/myorg/vpc/aws"
  version = "~> 2.0"
  name    = "prod"
  cidr    = "10.0.0.0/16"
}
```

### 39. Module testing with Terratest pattern (reference)
```hcl
# modules/s3-secure/main.tf — module under test
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
  }
}

output "bucket_id"  { value = aws_s3_bucket.this.id }
output "bucket_arn" { value = aws_s3_bucket.this.arn }
```

### 40. Module with moved blocks for refactoring
```hcl
# modules/app/main.tf
# After refactoring: moved S3 bucket into its own sub-module
moved {
  from = aws_s3_bucket.app
  to   = module.storage.aws_s3_bucket.this
}

module "storage" {
  source      = "./storage"
  bucket_name = var.bucket_name
}
```

### 41. Root module orchestrating blue/green module swap
```hcl
variable "active_color" {
  type    = string
  default = "blue"
}

module "blue" {
  source         = "./modules/app"
  color          = "blue"
  is_active      = var.active_color == "blue"
  target_group   = aws_lb_target_group.blue.arn
  instance_count = var.active_color == "blue" ? var.desired_count : 1
}

module "green" {
  source         = "./modules/app"
  color          = "green"
  is_active      = var.active_color == "green"
  target_group   = aws_lb_target_group.green.arn
  instance_count = var.active_color == "green" ? var.desired_count : 1
}
```

### 42. Module abstracting multi-account IAM trust
```hcl
# modules/cross-account-role/main.tf
variable "trusted_account_ids" { type = list(string) }
variable "role_name"           { type = string }
variable "managed_policies"    { type = list(string) }
variable "permission_boundary" { type = string; default = null }

data "aws_iam_policy_document" "trust" {
  dynamic "statement" {
    for_each = var.trusted_account_ids
    content {
      effect  = "Allow"
      actions = ["sts:AssumeRole"]
      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${statement.value}:root"]
      }
    }
  }
}

resource "aws_iam_role" "this" {
  name                 = var.role_name
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  permissions_boundary = var.permission_boundary
}

resource "aws_iam_role_policy_attachment" "managed" {
  for_each   = toset(var.managed_policies)
  role       = aws_iam_role.this.name
  policy_arn = each.value
}

output "role_arn"  { value = aws_iam_role.this.arn }
output "role_name" { value = aws_iam_role.this.name }
```

### 43. Module federation — multiple teams, shared state
```hcl
# Team A: networking module
# state: s3://tfstate/networking/${workspace}/terraform.tfstate
module "networking" {
  source = "./modules/networking"
}

output "vpc_id"             { value = module.networking.vpc_id }
output "private_subnet_ids" { value = module.networking.private_subnet_ids }

# Team B: application module — reads Team A's state
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket    = "tfstate"
    key       = "networking/${terraform.workspace}/terraform.tfstate"
    region    = "us-east-1"
    role_arn  = "arn:aws:iam::${var.infra_account}:role/TerraformStateReader"
  }
}
```

### 44. Module for ECS service with all integrations
```hcl
module "ecs_service" {
  source = "./modules/ecs-service"

  name              = "payments-api"
  cluster_id        = module.ecs_cluster.cluster_id
  task_cpu          = 512
  task_memory       = 1024
  desired_count     = 3
  image             = "${aws_ecr_repository.payments.repository_url}:${var.image_tag}"

  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_ids = [module.sg.payments_sg_id]

  target_group_arn  = module.alb.target_groups["payments"].arn
  load_balancer_container_port = 8080

  secrets = {
    DB_PASSWORD    = aws_secretsmanager_secret.db_password.arn
    STRIPE_API_KEY = aws_secretsmanager_secret.stripe.arn
  }

  environment = {
    ENV         = var.environment
    DB_HOST     = module.rds.primary_endpoint
    REDIS_HOST  = module.elasticache.primary_endpoint
  }

  auto_scaling = {
    min_capacity = 2
    max_capacity = 20
    cpu_target   = 60
    memory_target = 70
  }

  enable_execute_command = var.environment != "prod"
}
```

### 45. Module with precondition checks for environment safety
```hcl
# modules/rds-cluster/main.tf
resource "aws_rds_cluster" "this" {
  cluster_identifier     = var.cluster_name
  engine                 = "aurora-postgresql"
  engine_version         = "15.4"
  database_name          = var.db_name
  master_username        = var.master_username
  manage_master_user_password = true
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = var.security_group_ids
  deletion_protection    = var.environment == "prod"

  lifecycle {
    precondition {
      condition     = var.backup_retention_period >= 7 || var.environment != "prod"
      error_message = "Production clusters must retain backups for at least 7 days."
    }
    prevent_destroy = var.environment == "prod"
  }

  backup_retention_period = var.backup_retention_period
}
```

### 46. Recursive-style module (one layer per tier)
```hcl
# Application layer composed entirely of domain modules
module "identity" { source = "./modules/domain/identity";   env = var.env }
module "storage"  { source = "./modules/domain/storage";    env = var.env; kms_key_arn = module.identity.kms_key_arn }
module "compute"  { source = "./modules/domain/compute";    env = var.env; role_arn = module.identity.app_role_arn }
module "api"      { source = "./modules/domain/api-gateway"; env = var.env; backend_url = module.compute.api_endpoint }
module "cdn"      { source = "./modules/domain/cloudfront";  env = var.env; origin_domain = module.api.api_domain }
module "dns"      { source = "./modules/domain/dns";         env = var.env; cloudfront_domain = module.cdn.domain_name }
```

### 47. Module with optional feature flags
```hcl
# modules/vpc/variables.tf
variable "features" {
  type = object({
    enable_nat_gateway  = optional(bool, true)
    enable_vpn_gateway  = optional(bool, false)
    enable_flow_logs    = optional(bool, true)
    enable_vpc_endpoints = optional(bool, false)
    nat_gateway_mode    = optional(string, "single") # "single", "per_az"
  })
  default = {}
}

# modules/vpc/main.tf
resource "aws_nat_gateway" "this" {
  count         = var.features.enable_nat_gateway ? (var.features.nat_gateway_mode == "per_az" ? length(var.azs) : 1) : 0
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
}
```

### 48. Module aggregating outputs from for_each modules
```hcl
module "microservices" {
  source   = "./modules/microservice"
  for_each = var.services

  name           = each.key
  port           = each.value.port
  image          = each.value.image
  cpu            = each.value.cpu
  memory         = each.value.memory
  cluster_id     = aws_ecs_cluster.main.id
  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
}

locals {
  service_endpoints = { for k, v in module.microservices : k => v.service_url }
  service_sg_ids    = [for k, v in module.microservices : v.security_group_id]
  service_tg_arns   = { for k, v in module.microservices : k => v.target_group_arn }
}
```

### 49. Module lifecycle — deprecating and migrating
```hcl
# Old: monolithic module
# module "app" { source = "./modules/monolithic-app" }

# New: decomposed modules with state migration
moved {
  from = module.app.aws_instance.web
  to   = module.web_tier.aws_instance.this
}

moved {
  from = module.app.aws_db_instance.main
  to   = module.data_tier.aws_db_instance.this
}

module "web_tier" {
  source = "./modules/web-tier"
}

module "data_tier" {
  source = "./modules/data-tier"
}
```

### 50. Full production module calling pattern with all best practices
```hcl
# environments/prod/us-east-1/main.tf

locals {
  region      = "us-east-1"
  environment = "prod"
  common_tags = {
    Environment = local.environment
    Region      = local.region
    ManagedBy   = "terraform"
    Repository  = "github.com/myorg/infra"
    CostCenter  = "engineering"
  }
}

module "networking" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "= 5.1.2"

  name = "${local.environment}-${local.region}"
  cidr = "10.10.0.0/16"
  azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]

  private_subnets  = ["10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24"]
  public_subnets   = ["10.10.101.0/24", "10.10.102.0/24", "10.10.103.0/24"]
  database_subnets = ["10.10.201.0/24", "10.10.202.0/24", "10.10.203.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true
  enable_dns_hostnames   = true
  enable_dns_support     = true

  tags = local.common_tags
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${local.environment}-cluster"
  cluster_version = "1.29"
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnets

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = false
  enable_irsa                     = true

  eks_managed_node_groups = {
    general = {
      instance_types = ["m5.xlarge"]
      min_size       = 3
      max_size       = 10
      desired_size   = 3
    }
  }

  tags = local.common_tags
}

module "rds" {
  source     = "../../modules/rds-cluster"
  depends_on = [module.networking]

  cluster_name              = "${local.environment}-db"
  environment               = local.environment
  vpc_id                    = module.networking.vpc_id
  subnet_ids                = module.networking.database_subnets
  backup_retention_period   = 14
  security_group_ids        = [module.eks.node_security_group_id]
  tags                      = local.common_tags
}
```
