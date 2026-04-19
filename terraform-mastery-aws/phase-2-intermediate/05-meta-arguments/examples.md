# Examples 2.5 — Meta-Arguments (50 examples)

---

## Basic

### 1. count to create multiple S3 buckets
```hcl
resource "aws_s3_bucket" "logs" {
  count  = 3
  bucket = "my-log-bucket-${count.index}"
}
```

### 2. Referencing count.index in names
```hcl
resource "aws_iam_user" "dev" {
  count = 4
  name  = "developer-${count.index + 1}"
}
```

### 3. for_each over a set of strings
```hcl
resource "aws_s3_bucket" "env" {
  for_each = toset(["dev", "staging", "prod"])
  bucket   = "myapp-${each.key}"
}
```

### 4. for_each over a map
```hcl
variable "buckets" {
  default = {
    logs    = "us-east-1"
    backups = "us-west-2"
  }
}

resource "aws_s3_bucket" "store" {
  for_each = var.buckets
  bucket   = "company-${each.key}"
}
```

### 5. depends_on for explicit ordering
```hcl
resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.custom.arn
  depends_on = [aws_iam_role.lambda]
}
```

### 6. lifecycle create_before_destroy
```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true
  }
}
```

### 7. lifecycle prevent_destroy for production
```hcl
resource "aws_db_instance" "prod" {
  identifier     = "prod-postgres"
  engine         = "postgres"
  instance_class = "db.t3.medium"

  lifecycle {
    prevent_destroy = true
  }
}
```

### 8. lifecycle ignore_changes
```hcl
resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  lifecycle {
    ignore_changes = [ami, tags]
  }
}
```

### 9. provider meta-argument to select alias
```hcl
resource "aws_s3_bucket" "west" {
  provider = aws.west
  bucket   = "my-west-coast-bucket"
}
```

### 10. count = 0 to disable a resource
```hcl
variable "create_bastion" {
  type    = bool
  default = false
}

resource "aws_instance" "bastion" {
  count         = var.create_bastion ? 1 : 0
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
}
```

### 11. Accessing count resource by index
```hcl
output "bucket_arns" {
  value = aws_s3_bucket.logs[*].arn
}
```

### 12. Accessing for_each resource by key
```hcl
output "bucket_ids" {
  value = { for k, v in aws_s3_bucket.env : k => v.id }
}
```

---

## Intermediate

### 13. for_each over list of objects
```hcl
variable "subnets" {
  type = list(object({
    name = string
    cidr = string
    az   = string
  }))
  default = [
    { name = "public-a", cidr = "10.0.1.0/24", az = "us-east-1a" },
    { name = "public-b", cidr = "10.0.2.0/24", az = "us-east-1b" },
  ]
}

resource "aws_subnet" "pub" {
  for_each          = { for s in var.subnets : s.name => s }
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
}
```

### 14. depends_on on a module
```hcl
module "app" {
  source     = "./modules/app"
  depends_on = [module.networking]
}
```

### 15. ignore_changes for auto-scaling managed tags
```hcl
resource "aws_instance" "worker" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"

  lifecycle {
    ignore_changes = [
      tags["aws:autoscaling:groupName"],
      user_data,
    ]
  }
}
```

### 16. replace_triggered_by to force replacement
```hcl
resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  lifecycle {
    replace_triggered_by = [
      aws_launch_template.app.latest_version,
    ]
  }
}
```

### 17. create_before_destroy for zero-downtime ALB target group swap
```hcl
resource "aws_lb_target_group" "blue" {
  name     = "app-blue"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  lifecycle {
    create_before_destroy = true
  }
}
```

### 18. for_each to create IAM users from a set
```hcl
locals {
  engineers = toset(["alice", "bob", "carol", "dave"])
}

resource "aws_iam_user" "eng" {
  for_each = local.engineers
  name     = each.key
  path     = "/engineers/"
}

resource "aws_iam_user_group_membership" "eng" {
  for_each = local.engineers
  user     = aws_iam_user.eng[each.key].name
  groups   = [aws_iam_group.engineering.name]
}
```

### 19. count vs for_each trade-offs comment
```hcl
# count: use when resource list is static and ordered (e.g., N identical workers)
resource "aws_instance" "worker" {
  count         = var.worker_count
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"
  tags = { Name = "worker-${count.index}" }
}

# for_each: use when resources have distinct identities (e.g., named environments)
resource "aws_s3_bucket" "env" {
  for_each = toset(var.environments)
  bucket   = "myapp-${each.key}"
}
```

### 20. Nested depends_on with data sources
```hcl
data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_lambda_function" "fn" {
  function_name = "my-function"
  role          = aws_iam_role.lambda.arn
  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
  ]
}
```

### 21. lifecycle postcondition (Terraform 1.2+)
```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  lifecycle {
    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance must have a public IP."
    }
  }
}
```

### 22. lifecycle precondition
```hcl
resource "aws_db_instance" "main" {
  identifier     = "app-db"
  engine         = "postgres"
  engine_version = var.db_version
  instance_class = var.db_instance_class

  lifecycle {
    precondition {
      condition     = var.db_instance_class != "db.t2.micro"
      error_message = "db.t2.micro is not allowed in production."
    }
  }
}
```

### 23. for_each over security group rules map
```hcl
variable "sg_rules" {
  type = map(object({
    from_port = number
    to_port   = number
    protocol  = string
    cidr      = string
  }))
  default = {
    http  = { from_port = 80,  to_port = 80,  protocol = "tcp", cidr = "0.0.0.0/0" }
    https = { from_port = 443, to_port = 443, protocol = "tcp", cidr = "0.0.0.0/0" }
    ssh   = { from_port = 22,  to_port = 22,  protocol = "tcp", cidr = "10.0.0.0/8" }
  }
}

resource "aws_security_group_rule" "ingress" {
  for_each          = var.sg_rules
  security_group_id = aws_security_group.app.id
  type              = "ingress"
  from_port         = each.value.from_port
  to_port           = each.value.to_port
  protocol          = each.value.protocol
  cidr_blocks       = [each.value.cidr]
}
```

### 24. ignore_changes with a list of attributes
```hcl
resource "aws_ecs_service" "app" {
  name            = "app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2

  lifecycle {
    ignore_changes = [
      desired_count,        # managed by App Auto Scaling
      task_definition,      # managed by CI/CD
    ]
  }
}
```

### 25. provider meta-arg in module for cross-region resource
```hcl
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

module "acm_cert" {
  source = "./modules/acm"
  providers = {
    aws = aws.us_east_1   # ACM for CloudFront must be in us-east-1
  }
  domain_name = "example.com"
}
```

---

## Nested

### 26. for_each creating resources with nested for_each outputs
```hcl
locals {
  environments = ["dev", "staging", "prod"]
  regions      = ["us-east-1", "us-west-2"]

  # Cartesian product: env × region
  deployments = {
    for pair in setproduct(local.environments, local.regions) :
    "${pair[0]}-${pair[1]}" => {
      env    = pair[0]
      region = pair[1]
    }
  }
}

resource "aws_s3_bucket" "deploy" {
  for_each = local.deployments
  bucket   = "myapp-${each.key}"
  tags     = { Environment = each.value.env, Region = each.value.region }
}
```

### 27. count with conditional and data source
```hcl
data "aws_vpc" "selected" {
  count = var.use_existing_vpc ? 1 : 0
  id    = var.existing_vpc_id
}

resource "aws_vpc" "new" {
  count      = var.use_existing_vpc ? 0 : 1
  cidr_block = "10.0.0.0/16"
}

locals {
  vpc_id = var.use_existing_vpc ? data.aws_vpc.selected[0].id : aws_vpc.new[0].id
}
```

### 28. replace_triggered_by referencing another resource attribute
```hcl
resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = var.db_password
}

resource "aws_db_instance" "main" {
  identifier = "app-db"
  password   = var.db_password

  lifecycle {
    replace_triggered_by = [
      aws_secretsmanager_secret_version.db_password,
    ]
  }
}
```

### 29. depends_on to handle hidden dependencies
```hcl
# S3 bucket policy must exist before Lambda can read objects
resource "aws_s3_bucket_policy" "allow_lambda" {
  bucket = aws_s3_bucket.data.id
  policy = data.aws_iam_policy_document.allow_lambda.json
}

resource "aws_lambda_function" "processor" {
  function_name = "data-processor"
  role          = aws_iam_role.lambda.arn
  s3_bucket     = aws_s3_bucket.data.bucket
  s3_key        = "lambda.zip"

  depends_on = [aws_s3_bucket_policy.allow_lambda]
}
```

### 30. for_each over module outputs
```hcl
module "vpc" {
  source   = "./modules/vpc"
  for_each = var.environments
  name     = each.key
  cidr     = each.value.cidr
}

resource "aws_ec2_transit_gateway_vpc_attachment" "attach" {
  for_each           = module.vpc
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = each.value.vpc_id
  subnet_ids         = each.value.private_subnet_ids
}
```

### 31. Multiple lifecycle rules combined
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [image_id]
    replace_triggered_by  = [var.user_data_hash]
  }
}
```

### 32. for_each with conditional filtering
```hcl
locals {
  all_buckets = {
    logs    = { enabled = true,  region = "us-east-1" }
    archive = { enabled = false, region = "us-west-2" }
    audit   = { enabled = true,  region = "us-east-1" }
  }

  enabled_buckets = {
    for k, v in local.all_buckets : k => v if v.enabled
  }
}

resource "aws_s3_bucket" "active" {
  for_each = local.enabled_buckets
  bucket   = "company-${each.key}"
}
```

### 33. Using count.index to distribute across AZs
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "private-${count.index + 1}" }
}
```

### 34. ignore_changes for autoscaling group desired_capacity
```hcl
resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3
  vpc_zone_identifier = aws_subnet.private[*].id
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  lifecycle {
    ignore_changes = [desired_capacity, target_group_arns]
  }
}
```

### 35. provider meta-arg for cross-account resource
```hcl
provider "aws" {
  alias  = "prod"
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::999999999999:role/TerraformRole"
  }
}

resource "aws_s3_bucket" "prod_logs" {
  provider = aws.prod
  bucket   = "prod-centralised-logs"
  tags     = { Environment = "production" }
}
```

### 36. for_each with tomap and zipmap
```hcl
locals {
  names  = ["web", "api", "worker"]
  ports  = [80, 8080, 9000]
  services = zipmap(local.names, local.ports)
}

resource "aws_security_group_rule" "service_ingress" {
  for_each          = local.services
  security_group_id = aws_security_group.app.id
  type              = "ingress"
  from_port         = each.value
  to_port           = each.value
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]
}
```

### 37. Combining count and lifecycle to manage rotating secrets
```hcl
resource "aws_secretsmanager_secret_rotation" "db" {
  count               = var.enable_rotation ? 1 : 0
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_lambda_function.rotate.arn

  rotation_rules {
    automatically_after_days = var.rotation_days
  }

  lifecycle {
    ignore_changes = [rotation_rules]
  }
}
```

---

## Advanced

### 38. for_each creating multi-level IAM bindings
```hcl
variable "account_roles" {
  type = map(list(string))
  default = {
    "arn:aws:iam::111111111111:role/Dev"  = ["arn:aws:iam::aws:policy/ReadOnlyAccess"]
    "arn:aws:iam::222222222222:role/Prod" = ["arn:aws:iam::aws:policy/AdministratorAccess"]
  }
}

locals {
  role_policy_pairs = flatten([
    for role, policies in var.account_roles : [
      for policy in policies : {
        role   = role
        policy = policy
        key    = "${role}::${policy}"
      }
    ]
  ])
}

resource "aws_iam_role_policy_attachment" "bindings" {
  for_each   = { for rp in local.role_policy_pairs : rp.key => rp }
  role       = each.value.role
  policy_arn = each.value.policy
}
```

### 39. replace_triggered_by with a variable hash for config drift
```hcl
locals {
  config_hash = sha256(jsonencode({
    instance_type = var.instance_type
    ami_id        = data.aws_ami.amazon_linux.id
    user_data     = var.user_data
  }))
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  user_data     = var.user_data

  lifecycle {
    replace_triggered_by = [terraform_data.config_trigger]
  }
}

resource "terraform_data" "config_trigger" {
  input = local.config_hash
}
```

### 40. count-based blue/green slot selection
```hcl
variable "active_slot" {
  type    = string
  default = "blue"
}

resource "aws_lb_target_group" "blue" {
  count    = var.active_slot == "blue" ? 1 : 0
  name     = "app-blue"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  lifecycle { create_before_destroy = true }
}

resource "aws_lb_target_group" "green" {
  count    = var.active_slot == "green" ? 1 : 0
  name     = "app-green"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  lifecycle { create_before_destroy = true }
}
```

### 41. for_each over complex nested object variable
```hcl
variable "rds_instances" {
  type = map(object({
    engine         = string
    engine_version = string
    instance_class = string
    storage_gb     = number
    multi_az       = bool
  }))
}

resource "aws_db_instance" "dbs" {
  for_each               = var.rds_instances
  identifier             = each.key
  engine                 = each.value.engine
  engine_version         = each.value.engine_version
  instance_class         = each.value.instance_class
  allocated_storage      = each.value.storage_gb
  multi_az               = each.value.multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = false

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [password]
  }
}
```

### 42. Cascading depends_on across multiple modules
```hcl
module "networking" {
  source = "./modules/networking"
}

module "security" {
  source     = "./modules/security"
  vpc_id     = module.networking.vpc_id
  depends_on = [module.networking]
}

module "compute" {
  source             = "./modules/compute"
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.security.app_sg_id]
  depends_on         = [module.networking, module.security]
}

module "database" {
  source     = "./modules/database"
  subnet_ids = module.networking.data_subnet_ids
  depends_on = [module.compute]
}
```

### 43. postcondition validating output after apply
```hcl
resource "aws_iam_role" "cross_account" {
  name               = "cross-account-role"
  assume_role_policy = data.aws_iam_policy_document.trust.json

  lifecycle {
    postcondition {
      condition     = length(self.arn) > 0
      error_message = "IAM role ARN must not be empty after creation."
    }
  }
}

resource "aws_iam_role_policy_attachment" "admin" {
  role       = aws_iam_role.cross_account.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"

  lifecycle {
    precondition {
      condition     = var.environment != "prod"
      error_message = "AdministratorAccess must not be attached in production."
    }
  }
}
```

### 44. for_each producing heterogeneous resources from one map
```hcl
variable "static_sites" {
  type = map(object({
    domain        = string
    index_doc     = string
    error_doc     = string
    acm_cert_arn  = string
  }))
}

resource "aws_s3_bucket" "sites" {
  for_each = var.static_sites
  bucket   = replace(each.value.domain, ".", "-")
}

resource "aws_s3_bucket_website_configuration" "sites" {
  for_each = var.static_sites
  bucket   = aws_s3_bucket.sites[each.key].id
  index_document { suffix = each.value.index_doc }
  error_document { key    = each.value.error_doc }
}

resource "aws_cloudfront_distribution" "sites" {
  for_each = var.static_sites
  origin {
    domain_name = aws_s3_bucket.sites[each.key].bucket_regional_domain_name
    origin_id   = each.key
  }
  viewer_certificate {
    acm_certificate_arn = each.value.acm_cert_arn
    ssl_support_method  = "sni-only"
  }
  enabled = true
  default_cache_behavior {
    target_origin_id       = each.key
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
}
```

### 45. Using meta-arguments to safely rotate KMS keys
```hcl
resource "aws_kms_key" "app" {
  description             = "App encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  lifecycle {
    prevent_destroy = true
    # Never replace unless key_usage changes — rotation is handled by AWS
    ignore_changes  = [key_id]
  }
}

resource "aws_kms_alias" "app" {
  name          = "alias/app-key"
  target_key_id = aws_kms_key.app.key_id

  lifecycle {
    create_before_destroy = true
  }
}
```

### 46. for_each over flattened nested structure
```hcl
variable "team_permissions" {
  type = map(list(string))
  default = {
    platform   = ["s3:GetObject", "ec2:DescribeInstances"]
    security   = ["iam:ListUsers", "cloudtrail:LookupEvents"]
    developers = ["s3:PutObject", "lambda:InvokeFunction"]
  }
}

locals {
  permission_pairs = flatten([
    for team, actions in var.team_permissions : [
      for action in actions : {
        key    = "${team}::${action}"
        team   = team
        action = action
      }
    ]
  ])
}

# Use the flattened list as a for_each base for fine-grained policy statements
locals {
  permission_map = { for p in local.permission_pairs : p.key => p }
}
```

### 47. replace_triggered_by with null_resource for imperative triggers
```hcl
resource "terraform_data" "script_hash" {
  input = filesha256("${path.module}/scripts/bootstrap.sh")
}

resource "aws_instance" "bootstrapped" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  user_data     = file("${path.module}/scripts/bootstrap.sh")

  lifecycle {
    replace_triggered_by = [terraform_data.script_hash]
  }
}
```

### 48. count-based multi-region state store bootstrap
```hcl
variable "state_regions" {
  type    = list(string)
  default = ["us-east-1", "us-west-2", "eu-west-1"]
}

# Use separate provider aliases per region — count can't drive provider aliases
# Pattern: create one bucket per region using a map of aliased providers
resource "aws_s3_bucket" "tfstate" {
  count  = length(var.state_regions)
  bucket = "tfstate-${var.state_regions[count.index]}-${data.aws_caller_identity.current.account_id}"
  tags   = { Region = var.state_regions[count.index] }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  count  = length(var.state_regions)
  bucket = aws_s3_bucket.tfstate[count.index].id
  versioning_configuration { status = "Enabled" }
}
```

### 49. Combining for_each and provider aliases for multi-account resources
```hcl
# Define accounts via provider aliases (static)
provider "aws" { alias = "dev";     region = "us-east-1"; assume_role { role_arn = "arn:aws:iam::111111111111:role/TF" } }
provider "aws" { alias = "staging"; region = "us-east-1"; assume_role { role_arn = "arn:aws:iam::222222222222:role/TF" } }
provider "aws" { alias = "prod";    region = "us-east-1"; assume_role { role_arn = "arn:aws:iam::333333333333:role/TF" } }

# Shared KMS key in each account
resource "aws_kms_key" "dev"     { provider = aws.dev;     description = "Dev KMS Key" }
resource "aws_kms_key" "staging" { provider = aws.staging; description = "Staging KMS Key" }
resource "aws_kms_key" "prod"    { provider = aws.prod;    description = "Prod KMS Key"; lifecycle { prevent_destroy = true } }
```

### 50. Full production-grade resource with all lifecycle meta-arguments
```hcl
resource "aws_elasticache_replication_group" "cache" {
  replication_group_id       = "app-cache-${var.environment}"
  description                = "Application cache cluster for ${var.environment}"
  node_type                  = var.cache_node_type
  num_cache_clusters         = var.cache_cluster_count
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.cache.name
  subnet_group_name          = aws_elasticache_subnet_group.cache.name
  security_group_ids         = [aws_security_group.cache.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.cache_auth_token
  multi_az_enabled           = var.environment == "prod"
  automatic_failover_enabled = var.environment == "prod"

  tags = merge(local.common_tags, { Service = "cache" })

  lifecycle {
    create_before_destroy = true
    prevent_destroy       = var.environment == "prod"
    ignore_changes = [
      num_cache_clusters,   # managed by auto-scaling policy
      auth_token,           # rotated externally
    ]
    precondition {
      condition     = var.cache_cluster_count >= 2 || var.environment != "prod"
      error_message = "Production cache must have at least 2 nodes for HA."
    }
    postcondition {
      condition     = self.cluster_enabled == false
      error_message = "Replication group must not be in cluster mode."
    }
  }
}
```
