# Examples 3.3 — Locals & Expressions (50 examples)

---

## Basic

### 1. Simple local value
```hcl
locals {
  environment = "production"
  region      = "us-east-1"
}
```

### 2. Local referencing a variable
```hcl
variable "project" { type = string }
variable "env"     { type = string }

locals {
  name_prefix = "${var.project}-${var.env}"
}
```

### 3. Local with computed string
```hcl
locals {
  bucket_name = "myapp-${var.environment}-${data.aws_caller_identity.current.account_id}"
}
```

### 4. Local referencing another local
```hcl
locals {
  env         = var.environment
  name_prefix = "myapp-${local.env}"
  bucket_name = "${local.name_prefix}-data"
}
```

### 5. Conditional expression
```hcl
locals {
  instance_type = var.environment == "prod" ? "m5.xlarge" : "t3.medium"
}
```

### 6. Local map of tags
```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Repository  = "github.com/myorg/infra"
    CostCenter  = var.cost_center
  }
}
```

### 7. Merging maps with merge()
```hcl
locals {
  base_tags = { ManagedBy = "terraform", Environment = var.environment }
  extra_tags = { Team = "platform", CostCenter = "eng-001" }
  all_tags   = merge(local.base_tags, local.extra_tags)
}
```

### 8. String interpolation with format()
```hcl
locals {
  iam_role_name = format("app-%s-role-%s", var.service_name, var.environment)
  bucket_name   = format("data-%s-%s", var.project, var.account_id)
}
```

### 9. Length of a list
```hcl
locals {
  az_count      = length(var.availability_zones)
  subnet_count  = length(aws_subnet.private)
}
```

### 10. toset() to deduplicate
```hcl
variable "allowed_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/8", "10.0.0.0/8", "192.168.0.0/16"]
}

locals {
  unique_cidrs = toset(var.allowed_cidrs)
}
```

### 11. coalesce() for fallback values
```hcl
locals {
  instance_type = coalesce(var.override_instance_type, var.default_instance_type, "t3.micro")
}
```

### 12. lower() and upper() string functions
```hcl
locals {
  bucket_name = lower("MyApp-${var.Environment}")
  env_upper   = upper(var.environment)
}
```

---

## Intermediate

### 13. for expression — list from list
```hcl
variable "subnet_ids" {
  type = list(string)
}

locals {
  # Produce a list of resource ARNs
  subnet_arns = [for id in var.subnet_ids : "arn:aws:ec2:${var.region}:${var.account_id}:subnet/${id}"]
}
```

### 14. for expression — map from list
```hcl
variable "services" {
  type    = list(string)
  default = ["web", "api", "worker"]
}

locals {
  service_ports = { for svc in var.services : svc => lookup(var.port_map, svc, 8080) }
}
```

### 15. for expression — filtering with if
```hcl
variable "instances" {
  type = list(object({
    id   = string
    type = string
    env  = string
  }))
}

locals {
  prod_instance_ids = [for i in var.instances : i.id if i.env == "prod"]
}
```

### 16. for expression — map to list
```hcl
variable "sg_rules" {
  type = map(number)
  default = { http = 80, https = 443, ssh = 22 }
}

locals {
  port_list = [for name, port in var.sg_rules : port]
  rule_descriptions = [for name, port in var.sg_rules : "${name}:${port}"]
}
```

### 17. Splat expression [*]
```hcl
locals {
  # Get all private IP addresses from a list of instances
  private_ips = aws_instance.worker[*].private_ip

  # All subnet IDs in created order
  subnet_ids = aws_subnet.private[*].id
}
```

### 18. lookup() with default
```hcl
variable "ami_map" {
  type = map(string)
  default = {
    "us-east-1" = "ami-0c02fb55956c7d316"
    "us-west-2" = "ami-08d70e59c07c61a3a"
  }
}

locals {
  ami_id = lookup(var.ami_map, var.region, "ami-default")
}
```

### 19. try() for safe attribute access
```hcl
locals {
  # Safe: returns null if attribute missing instead of erroring
  vpc_cidr = try(data.aws_vpc.selected.cidr_block, "10.0.0.0/16")
  db_endpoint = try(aws_db_instance.main[0].endpoint, null)
}
```

### 20. can() for validation
```hcl
variable "cidr_block" { type = string }

locals {
  # Check if CIDR is valid by attempting to parse it
  valid_cidr = can(cidrhost(var.cidr_block, 0))
}
```

### 21. flatten() for nested lists
```hcl
variable "az_subnets" {
  type = map(list(string))
  default = {
    "us-east-1a" = ["10.0.1.0/24", "10.0.2.0/24"]
    "us-east-1b" = ["10.0.3.0/24", "10.0.4.0/24"]
  }
}

locals {
  all_cidrs = flatten(values(var.az_subnets))
}
```

### 22. zipmap() to combine two lists
```hcl
locals {
  az_names   = data.aws_availability_zones.available.names
  cidr_blocks = [for i in range(length(local.az_names)) : cidrsubnet("10.0.0.0/16", 8, i)]
  az_cidr_map = zipmap(local.az_names, local.cidr_blocks)
}
```

### 23. keys() and values() from map
```hcl
variable "services" {
  type = map(string)
  default = {
    web    = "8080"
    api    = "8081"
    worker = "8082"
  }
}

locals {
  service_names = keys(var.services)
  service_ports = values(var.services)
}
```

### 24. contains() for membership check
```hcl
locals {
  approved_regions = ["us-east-1", "us-west-2", "eu-west-1"]
  region_approved  = contains(local.approved_regions, var.region)
}

resource "null_resource" "check" {
  lifecycle {
    precondition {
      condition     = local.region_approved
      error_message = "Region ${var.region} is not in the approved list."
    }
  }
}
```

### 25. cidrsubnet() for IP planning
```hcl
locals {
  vpc_cidr     = "10.0.0.0/16"
  public_cidrs = [for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i)]        # 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
  private_cidrs = [for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i + 10)]  # 10.0.10.0/24 ... 10.0.12.0/24
  data_cidrs    = [for i in range(3) : cidrsubnet(local.vpc_cidr, 8, i + 20)]  # 10.0.20.0/24 ... 10.0.22.0/24
}
```

---

## Nested

### 26. Nested for expression — cartesian product
```hcl
variable "envs"    { type = list(string); default = ["dev", "prod"] }
variable "regions" { type = list(string); default = ["us-east-1", "us-west-2"] }

locals {
  env_region_pairs = {
    for pair in setproduct(var.envs, var.regions) :
    "${pair[0]}-${pair[1]}" => { env = pair[0], region = pair[1] }
  }
}
```

### 27. Nested for — flatten complex structure
```hcl
variable "services" {
  type = list(object({
    name  = string
    ports = list(number)
  }))
}

locals {
  all_service_ports = flatten([
    for svc in var.services : [
      for port in svc.ports : {
        service = svc.name
        port    = port
        key     = "${svc.name}:${port}"
      }
    ]
  ])

  service_port_map = { for sp in local.all_service_ports : sp.key => sp }
}
```

### 28. Local computing subnet layout from AZ count
```hcl
data "aws_availability_zones" "available" { state = "available" }

locals {
  az_count = min(length(data.aws_availability_zones.available.names), 3)
  azs      = slice(data.aws_availability_zones.available.names, 0, local.az_count)

  public_subnets  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnets = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i + 10)]
  data_subnets    = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i + 20)]

  subnet_config = {
    for i, az in local.azs : az => {
      public_cidr  = local.public_subnets[i]
      private_cidr = local.private_subnets[i]
      data_cidr    = local.data_subnets[i]
    }
  }
}
```

### 29. Regex for parsing AMI names
```hcl
data "aws_ami" "linux" {
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name"; values = ["amzn2-ami-hvm-*-x86_64-gp2"] }
}

locals {
  ami_version = regex("amzn2-ami-hvm-([0-9.]+)-x86_64", data.aws_ami.linux.name)[0]
}
```

### 30. Locals deriving IAM policy ARNs
```hcl
variable "service_name" { type = string }

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  partition  = data.aws_partition.current.partition

  lambda_arn_prefix = "arn:${local.partition}:lambda:${local.region}:${local.account_id}:function"
  s3_bucket_arn     = "arn:${local.partition}:s3:::${var.service_name}-${var.environment}"
  kms_key_arn_prefix = "arn:${local.partition}:kms:${local.region}:${local.account_id}:key"
}
```

### 31. Multi-level merge for layered configs
```hcl
variable "base_config" {
  type = map(any)
  default = {
    deletion_protection = false
    backup_retention    = 7
    instance_class      = "db.t3.medium"
  }
}

variable "env_overrides" {
  type = map(any)
  default = {
    deletion_protection = true
    backup_retention    = 14
    instance_class      = "db.r5.large"
  }
}

variable "instance_overrides" {
  type    = map(any)
  default = {}
}

locals {
  final_config = merge(var.base_config, var.env_overrides, var.instance_overrides)
}
```

### 32. Building policy statements dynamically
```hcl
variable "s3_buckets" {
  type    = list(string)
  default = ["app-data", "app-logs"]
}

locals {
  s3_read_resources = flatten([
    for bucket in var.s3_buckets : [
      "arn:aws:s3:::${bucket}",
      "arn:aws:s3:::${bucket}/*"
    ]
  ])

  s3_policy = {
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = local.s3_read_resources
    }]
  }
}
```

### 33. one() for optional singleton
```hcl
resource "aws_instance" "bastion" {
  count = var.create_bastion ? 1 : 0
  # ...
}

locals {
  bastion_ip = one(aws_instance.bastion[*].public_ip)  # null if count=0, IP if count=1
}
```

### 34. Conditional lists and coalescelist()
```hcl
variable "extra_security_groups" { type = list(string); default = [] }

locals {
  base_sg_ids  = [aws_security_group.app.id, aws_security_group.alb.id]
  all_sg_ids   = concat(local.base_sg_ids, var.extra_security_groups)

  # If no custom security groups provided, fall back to baseline
  effective_sgs = coalescelist(var.extra_security_groups, local.base_sg_ids)
}
```

### 35. Building complex ECS environment variable list
```hcl
variable "service_config" {
  type = object({
    db_host    = string
    db_name    = string
    redis_host = string
    log_level  = string
    feature_flags = map(bool)
  })
}

locals {
  env_vars = concat(
    [
      { name = "DB_HOST",    value = var.service_config.db_host },
      { name = "DB_NAME",    value = var.service_config.db_name },
      { name = "REDIS_HOST", value = var.service_config.redis_host },
      { name = "LOG_LEVEL",  value = var.service_config.log_level },
    ],
    [for flag, enabled in var.service_config.feature_flags :
      { name = "FEATURE_${upper(flag)}", value = tostring(enabled) }
    ]
  )
}
```

### 36. Locals for route table associations
```hcl
locals {
  # Build map of subnet-id => route-table-id for for_each
  private_rt_associations = {
    for idx, subnet_id in aws_subnet.private[*].id :
    "private-${idx}" => {
      subnet_id      = subnet_id
      route_table_id = aws_route_table.private[idx % length(aws_route_table.private)].id
    }
  }
}

resource "aws_route_table_association" "private" {
  for_each       = local.private_rt_associations
  subnet_id      = each.value.subnet_id
  route_table_id = each.value.route_table_id
}
```

### 37. templatefile() for user_data
```hcl
locals {
  user_data = templatefile("${path.module}/templates/user_data.sh.tpl", {
    environment  = var.environment
    s3_bucket    = aws_s3_bucket.config.bucket
    ssm_prefix   = "/app/${var.environment}"
    cluster_name = aws_ecs_cluster.main.name
    log_group    = aws_cloudwatch_log_group.app.name
  })
}

resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  user_data     = base64encode(local.user_data)
}
```

---

## Advanced

### 38. Locals building assume-role chains
```hcl
variable "account_map" {
  type = map(object({
    id          = string
    environment = string
    regions     = list(string)
  }))
}

locals {
  # Flatten accounts × regions into deployment targets
  deployment_targets = {
    for pair in flatten([
      for name, acct in var.account_map : [
        for region in acct.regions : {
          key         = "${name}-${region}"
          account     = name
          account_id  = acct.id
          environment = acct.environment
          region      = region
          role_arn    = "arn:aws:iam::${acct.id}:role/TerraformRole"
        }
      ]
    ]) : pair.key => pair
  }
}
```

### 39. Locals computing NACL rule numbers
```hcl
variable "nacl_rules" {
  type = list(object({
    action   = string  # "allow" | "deny"
    protocol = string
    port     = number
    cidr     = string
  }))
}

locals {
  numbered_nacl_rules = {
    for idx, rule in var.nacl_rules :
    tostring((idx + 1) * 10) => merge(rule, { rule_number = (idx + 1) * 10 })
  }
}

resource "aws_network_acl_rule" "custom" {
  for_each       = local.numbered_nacl_rules
  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  egress         = false
  protocol       = each.value.protocol
  rule_action    = each.value.action
  cidr_block     = each.value.cidr
  from_port      = each.value.port
  to_port        = each.value.port
}
```

### 40. Advanced conditional with multiple cases
```hcl
locals {
  nat_gateway_count = (
    var.environment == "prod"    ? length(var.azs) :      # one per AZ in prod
    var.environment == "staging" ? 1 :                    # single NAT in staging
    0                                                     # no NAT in dev
  )

  db_instance_class = (
    var.environment == "prod"    ? "db.r5.2xlarge" :
    var.environment == "staging" ? "db.t3.large" :
    "db.t3.micro"
  )
}
```

### 41. Locals for ECS container definitions with conditional sidecars
```hcl
locals {
  datadog_sidecar = var.enable_monitoring ? [{
    name      = "datadog-agent"
    image     = "datadog/agent:latest"
    cpu       = 128
    memory    = 256
    essential = false
    environment = [
      { name = "DD_API_KEY_SECRET_ARN", value = aws_secretsmanager_secret.dd_api_key.arn }
    ]
  }] : []

  xray_sidecar = var.enable_tracing ? [{
    name      = "aws-otel-collector"
    image     = "public.ecr.aws/aws-observability/aws-otel-collector:latest"
    cpu       = 128
    memory    = 128
    essential = false
  }] : []

  all_containers = concat([local.app_container], local.datadog_sidecar, local.xray_sidecar)
}
```

### 42. Locals for generating security group rules from services
```hcl
variable "microservices" {
  type = map(object({
    port           = number
    allowed_services = list(string)
  }))
}

locals {
  # Generate allow rules: each service that needs to call another
  service_rules = flatten([
    for target_name, target in var.microservices : [
      for caller in target.allowed_services : {
        key         = "${caller}-to-${target_name}"
        target_sg   = target_name
        caller_sg   = caller
        port        = target.port
      }
    ]
  ])

  service_rule_map = { for r in local.service_rules : r.key => r }
}
```

### 43. Locals with jsonencode for policy documents
```hcl
locals {
  bucket_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyNonTLS"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = ["${aws_s3_bucket.data.arn}", "${aws_s3_bucket.data.arn}/*"]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      },
      {
        Sid    = "AllowAppRole"
        Effect = "Allow"
        Principal = { AWS = aws_iam_role.app.arn }
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.data.arn}/*"
      }
    ]
  })
}
```

### 44. Locals for managed prefix list construction
```hcl
variable "ip_ranges" {
  type = map(object({
    cidrs       = list(string)
    description = string
  }))
}

locals {
  all_entries = flatten([
    for name, config in var.ip_ranges : [
      for cidr in config.cidrs : {
        key         = "${name}-${cidr}"
        cidr        = cidr
        description = "${config.description}: ${cidr}"
      }
    ]
  ])

  entry_map = { for e in local.all_entries : e.key => e }
}

resource "aws_ec2_managed_prefix_list_entry" "entries" {
  for_each       = local.entry_map
  prefix_list_id = aws_ec2_managed_prefix_list.trusted.id
  cidr           = each.value.cidr
  description    = each.value.description
}
```

### 45. Locals computing WAF rule priorities
```hcl
variable "waf_rules" {
  type = list(object({
    name     = string
    type     = string  # "rate_limit" | "geo_block" | "managed"
    priority = optional(number)
  }))
}

locals {
  # Auto-assign priorities if not provided, with spacing
  rules_with_priority = [
    for idx, rule in var.waf_rules : merge(rule, {
      priority = coalesce(rule.priority, (idx + 1) * 10)
    })
  ]

  rule_map = { for r in local.rules_with_priority : r.name => r }
}
```

### 46. Locals for Route53 weighted routing
```hcl
variable "origins" {
  type = list(object({
    region = string
    alb_dns = string
    weight  = number
  }))
}

locals {
  weighted_records = {
    for idx, origin in var.origins :
    "${origin.region}-${idx}" => {
      set_identifier = "${origin.region}-${idx}"
      records        = [origin.alb_dns]
      weight         = origin.weight
    }
  }
}
```

### 47. Locals generating SQS dead-letter-queue map
```hcl
variable "queues" {
  type = list(object({
    name          = string
    enable_dlq    = bool
    max_receives  = optional(number, 3)
  }))
}

locals {
  queues_with_dlq = { for q in var.queues : q.name => q if q.enable_dlq }

  queue_config = {
    for q in var.queues : q.name => {
      name = q.name
      redrive_policy = q.enable_dlq ? jsonencode({
        deadLetterTargetArn = aws_sqs_queue.dlq[q.name].arn
        maxReceiveCount     = q.max_receives
      }) : null
    }
  }
}
```

### 48. Locals for complete VPC configuration object
```hcl
locals {
  vpc_config = {
    cidr            = var.vpc_cidr
    azs             = slice(data.aws_availability_zones.available.names, 0, min(var.az_count, 3))
    public_subnets  = [for i in range(min(var.az_count, 3)) : cidrsubnet(var.vpc_cidr, 8, i)]
    private_subnets = [for i in range(min(var.az_count, 3)) : cidrsubnet(var.vpc_cidr, 8, i + 10)]
    data_subnets    = [for i in range(min(var.az_count, 3)) : cidrsubnet(var.vpc_cidr, 8, i + 20)]
    nat_count       = var.environment == "prod" ? min(var.az_count, 3) : 1
    enable_flow_logs = var.environment != "dev"
    flow_log_retention = var.environment == "prod" ? 90 : 30
  }
}
```

### 49. Locals for cross-account access patterns
```hcl
variable "consumer_accounts" {
  type = list(string)
}

locals {
  account_id  = data.aws_caller_identity.current.account_id
  partition   = data.aws_partition.current.partition

  consumer_role_arns = [
    for account_id in var.consumer_accounts :
    "arn:${local.partition}:iam::${account_id}:root"
  ]

  consumer_principals = distinct(concat(
    local.consumer_role_arns,
    ["arn:${local.partition}:iam::${local.account_id}:root"]  # self
  ))
}
```

### 50. Full production locals block with all patterns
```hcl
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_availability_zones" "available" { state = "available" }

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  partition  = data.aws_partition.current.partition

  # Environment-based sizing
  az_count = var.environment == "prod" ? 3 : 2
  azs      = slice(data.aws_availability_zones.available.names, 0, local.az_count)

  # Network layout
  vpc_cidr        = var.vpc_cidr
  public_subnets  = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i)]
  private_subnets = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 10)]
  data_subnets    = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 20)]

  # Resource naming
  name_prefix = "${var.project}-${var.environment}-${local.region}"

  # ARN helpers
  lambda_arn  = "arn:${local.partition}:lambda:${local.region}:${local.account_id}:function"
  s3_arn      = "arn:${local.partition}:s3"

  # Tags
  common_tags = {
    Project     = var.project
    Environment = var.environment
    Region      = local.region
    AccountId   = local.account_id
    ManagedBy   = "terraform"
    Repository  = var.repo_url
  }

  # Feature flags
  features = merge({
    enable_waf       = false
    enable_cdn       = true
    enable_backups   = var.environment == "prod"
    multi_az         = var.environment == "prod"
    deletion_protect = var.environment == "prod"
  }, var.feature_overrides)

  # DB sizing
  db_config = {
    instance_class     = local.features.multi_az ? "db.r5.large" : "db.t3.medium"
    multi_az           = local.features.multi_az
    backup_retention   = local.features.enable_backups ? 14 : 1
    deletion_protection = local.features.deletion_protect
  }
}
```
