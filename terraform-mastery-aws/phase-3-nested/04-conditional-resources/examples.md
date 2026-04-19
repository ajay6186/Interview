# Examples 3.4 — Conditional Resources (50 examples)

---

## Basic

### 1. count = 0 or 1 to enable/disable resource
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

### 2. Conditional S3 bucket creation
```hcl
resource "aws_s3_bucket" "logs" {
  count  = var.enable_logging ? 1 : 0
  bucket = "${var.project}-logs-${var.account_id}"
}
```

### 3. Conditional security group rule
```hcl
resource "aws_security_group_rule" "ssh" {
  count             = var.allow_ssh ? 1 : 0
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.ssh_cidrs
  security_group_id = aws_security_group.app.id
}
```

### 4. Conditional IAM policy attachment
```hcl
resource "aws_iam_role_policy_attachment" "admin" {
  count      = var.environment == "dev" ? 1 : 0
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
```

### 5. Conditional EIP allocation
```hcl
resource "aws_eip" "nat" {
  count  = var.create_nat_gateway ? 1 : 0
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = var.create_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
}
```

### 6. Conditional RDS multi-AZ
```hcl
resource "aws_db_instance" "main" {
  identifier     = "app-db"
  engine         = "postgres"
  instance_class = var.environment == "prod" ? "db.r5.large" : "db.t3.medium"
  multi_az       = var.environment == "prod"
  storage_encrypted = true
}
```

### 7. Conditional DNS record creation
```hcl
resource "aws_route53_record" "app" {
  count   = var.create_dns_record ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.subdomain
  type    = "A"
  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}
```

### 8. Access conditional resource output safely
```hcl
output "bastion_ip" {
  value = var.create_bastion ? aws_instance.bastion[0].public_ip : null
}
```

### 9. Conditional CloudWatch alarm
```hcl
resource "aws_cloudwatch_metric_alarm" "cpu" {
  count               = var.enable_monitoring ? 1 : 0
  alarm_name          = "high-cpu-${var.service_name}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts[0].arn]
}
```

### 10. Conditional VPN gateway
```hcl
resource "aws_vpn_gateway" "main" {
  count  = var.enable_vpn ? 1 : 0
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-vpn-gw" }
}
```

### 11. Conditional bucket versioning
```hcl
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}
```

### 12. Conditional lifecycle prevent_destroy
```hcl
resource "aws_db_cluster" "main" {
  cluster_identifier = "app-cluster"
  engine             = "aurora-postgresql"

  lifecycle {
    prevent_destroy = var.environment == "prod"
  }
}
```

---

## Intermediate

### 13. for_each conditional map — only enabled resources
```hcl
variable "feature_flags" {
  type = map(bool)
  default = {
    enable_elasticsearch = true
    enable_redis         = false
    enable_sqs           = true
  }
}

locals {
  enabled_features = { for name, enabled in var.feature_flags : name => enabled if enabled }
}

resource "aws_sqs_queue" "feature_queues" {
  for_each = contains(keys(local.enabled_features), "enable_sqs") ? { main = {} } : {}
  name     = "${var.project}-${each.key}"
}
```

### 14. Conditional module invocation with count
```hcl
module "waf" {
  count   = var.enable_waf ? 1 : 0
  source  = "./modules/waf"
  alb_arn = aws_lb.app.arn
  rules   = var.waf_rules
}

module "cloudfront" {
  source      = "./modules/cloudfront"
  waf_acl_arn = var.enable_waf ? module.waf[0].acl_arn : null
}
```

### 15. Conditional replication configuration
```hcl
resource "aws_s3_bucket_replication_configuration" "dr" {
  count  = var.enable_replication ? 1 : 0
  bucket = aws_s3_bucket.source.id
  role   = aws_iam_role.replication[0].arn

  rule {
    id     = "replicate-all"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.replica[0].arn
      storage_class = "STANDARD_IA"
    }
  }
}

resource "aws_s3_bucket" "replica" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.dr_region
  bucket   = "${var.project}-replica-${var.dr_region}"
}
```

### 16. Conditional NAT gateway — single vs one-per-AZ
```hcl
locals {
  nat_count = (
    !var.create_nat_gateway          ? 0 :
    var.environment == "prod"        ? length(var.azs) :
    1
  )
}

resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = local.nat_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
}
```

### 17. Conditional SSM parameters
```hcl
variable "parameters" {
  type = map(object({
    value   = string
    enabled = bool
    secure  = bool
  }))
}

locals {
  active_params = { for k, v in var.parameters : k => v if v.enabled }
}

resource "aws_ssm_parameter" "config" {
  for_each = local.active_params
  name     = "/${var.project}/${var.environment}/${each.key}"
  value    = each.value.value
  type     = each.value.secure ? "SecureString" : "String"
  key_id   = each.value.secure ? aws_kms_key.ssm.id : null
}
```

### 18. Conditional deletion protection pattern
```hcl
variable "protect_resources" {
  type    = bool
  default = false
}

resource "aws_rds_cluster" "main" {
  cluster_identifier  = "${var.project}-${var.environment}"
  engine              = "aurora-postgresql"
  deletion_protection = var.protect_resources

  lifecycle {
    prevent_destroy = var.protect_resources
    ignore_changes  = var.protect_resources ? [] : [master_password]
  }
}
```

### 19. Conditional output with try()
```hcl
output "nat_gateway_ips" {
  value = var.create_nat_gateway ? aws_eip.nat[*].public_ip : []
}

output "replica_bucket_arn" {
  value = try(aws_s3_bucket.replica[0].arn, null)
}
```

### 20. Conditional CloudFront OAC
```hcl
resource "aws_cloudfront_origin_access_control" "s3" {
  count = var.enable_cloudfront ? 1 : 0
  name  = "${var.project}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

resource "aws_s3_bucket_policy" "cdn_access" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.web.id
  policy = data.aws_iam_policy_document.cloudfront[0].json
}
```

### 21. Conditional Route53 health check
```hcl
resource "aws_route53_health_check" "app" {
  count             = var.enable_health_check ? 1 : 0
  fqdn              = var.app_domain
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
}

resource "aws_route53_record" "failover_primary" {
  count   = var.enable_health_check ? 1 : 0
  zone_id = aws_route53_zone.main.zone_id
  name    = var.app_domain
  type    = "A"

  failover_routing_policy { type = "PRIMARY" }
  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.app[0].id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}
```

### 22. Conditional encryption on EBS
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = var.root_volume_size
      volume_type = "gp3"
      encrypted   = var.encrypt_volumes
      kms_key_id  = var.encrypt_volumes ? aws_kms_key.ebs[0].arn : null
    }
  }
}

resource "aws_kms_key" "ebs" {
  count               = var.encrypt_volumes ? 1 : 0
  description         = "EBS encryption key"
  enable_key_rotation = true
}
```

### 23. Conditional auto-scaling policies
```hcl
resource "aws_autoscaling_policy" "target_tracking" {
  count                  = var.enable_autoscaling ? 1 : 0
  name                   = "target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.cpu_target
  }
}
```

### 24. Conditional Secrets Manager vs SSM
```hcl
# Store secrets in Secrets Manager (prod) or SSM (non-prod)
resource "aws_secretsmanager_secret" "db_password" {
  count = var.environment == "prod" ? 1 : 0
  name  = "/${var.project}/${var.environment}/db-password"
}

resource "aws_ssm_parameter" "db_password" {
  count = var.environment != "prod" ? 1 : 0
  name  = "/${var.project}/${var.environment}/db-password"
  type  = "SecureString"
  value = var.db_password
}
```

### 25. Conditional SQS FIFO queue
```hcl
resource "aws_sqs_queue" "main" {
  name                        = var.fifo_queue ? "${var.project}.fifo" : var.project
  fifo_queue                  = var.fifo_queue
  content_based_deduplication = var.fifo_queue ? var.enable_dedup : null
}
```

---

## Nested

### 26. Nested conditional — VPC with optional components
```hcl
locals {
  create_igw      = var.create_public_subnets
  create_nat      = var.create_private_subnets && var.create_public_subnets
  create_flow_log = var.environment != "dev"
}

resource "aws_internet_gateway" "main" {
  count  = local.create_igw ? 1 : 0
  vpc_id = aws_vpc.main.id
}

resource "aws_nat_gateway" "main" {
  count         = local.create_nat ? (var.environment == "prod" ? length(var.azs) : 1) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
}

resource "aws_flow_log" "main" {
  count           = local.create_flow_log ? 1 : 0
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.flow_log[0].arn
}
```

### 27. Conditional stacks based on features object
```hcl
variable "stack_features" {
  type = object({
    enable_cdn        = optional(bool, false)
    enable_waf        = optional(bool, false)
    enable_shield     = optional(bool, false)
    enable_macie      = optional(bool, false)
    enable_guardduty  = optional(bool, true)
    enable_securityhub = optional(bool, false)
  })
  default = {}
}

resource "aws_cloudfront_distribution" "cdn" {
  count = var.stack_features.enable_cdn ? 1 : 0
  # ...
}

resource "aws_wafv2_web_acl" "main" {
  count = var.stack_features.enable_waf ? 1 : 0
  # ...
}

resource "aws_shield_protection" "alb" {
  count        = var.stack_features.enable_shield ? 1 : 0
  name         = "alb-protection"
  resource_arn = aws_lb.app.arn
}

resource "aws_guardduty_detector" "main" {
  count  = var.stack_features.enable_guardduty ? 1 : 0
  enable = true
}
```

### 28. Conditional cross-region read replica
```hcl
variable "enable_cross_region_replica" {
  type    = bool
  default = false
}

variable "replica_region" {
  type    = string
  default = "us-west-2"
}

provider "aws" {
  alias  = "replica"
  region = var.replica_region
}

resource "aws_db_instance" "replica" {
  count               = var.enable_cross_region_replica ? 1 : 0
  provider            = aws.replica
  identifier          = "${var.project}-replica"
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = var.replica_instance_class
  skip_final_snapshot = true
}
```

### 29. Feature-flag pattern with for_each
```hcl
variable "services" {
  type = map(object({
    enabled   = bool
    port      = number
    cpu       = number
    memory    = number
    min_count = number
    max_count = number
  }))
}

locals {
  active_services = { for name, cfg in var.services : name => cfg if cfg.enabled }
}

resource "aws_ecs_service" "services" {
  for_each        = local.active_services
  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.min_count

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.services[each.key].id]
    assign_public_ip = false
  }
}
```

### 30. Conditional backup with environment-based retention
```hcl
resource "aws_backup_plan" "app" {
  count = var.enable_backups ? 1 : 0
  name  = "${var.project}-backup-plan"

  rule {
    rule_name         = "daily"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 5 ? * * *)"

    lifecycle {
      cold_storage_after = var.environment == "prod" ? 30 : null
      delete_after       = var.environment == "prod" ? 365 : 30
    }
  }
}

resource "aws_backup_selection" "app" {
  count        = var.enable_backups ? 1 : 0
  name         = "${var.project}-selection"
  iam_role_arn = aws_iam_role.backup[0].arn
  plan_id      = aws_backup_plan.app[0].id

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "backup"
    value = "true"
  }
}
```

### 31. Conditional VPC endpoint per service
```hcl
variable "vpc_endpoint_services" {
  type = map(bool)
  default = {
    s3       = true
    dynamodb = true
    ssm      = false
    ecr_api  = false
  }
}

locals {
  gateway_endpoints   = { for svc, enabled in var.vpc_endpoint_services : svc => enabled if enabled && contains(["s3", "dynamodb"], svc) }
  interface_endpoints = { for svc, enabled in var.vpc_endpoint_services : svc => enabled if enabled && !contains(["s3", "dynamodb"], svc) }
}

resource "aws_vpc_endpoint" "gateway" {
  for_each          = local.gateway_endpoints
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.${replace(each.key, "_", ".")}"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}

resource "aws_vpc_endpoint" "interface" {
  for_each            = local.interface_endpoints
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.${replace(each.key, "_", ".")}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
}
```

### 32. Conditional tagging with resource groups
```hcl
resource "aws_resourcegroups_group" "prod" {
  count = var.environment == "prod" ? 1 : 0
  name  = "production-resources"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [
        { Key = "Environment", Values = ["prod"] }
      ]
    })
  }
}
```

### 33. Conditional EventBridge rules for environment
```hcl
variable "scheduled_jobs" {
  type = map(object({
    schedule      = string
    enabled       = bool
    environments  = list(string)
  }))
}

locals {
  active_jobs = {
    for name, job in var.scheduled_jobs :
    name => job
    if job.enabled && contains(job.environments, var.environment)
  }
}

resource "aws_cloudwatch_event_rule" "jobs" {
  for_each            = local.active_jobs
  name                = "${var.project}-${each.key}"
  schedule_expression = each.value.schedule
  state               = "ENABLED"
}
```

### 34. Conditional CORS on API Gateway
```hcl
resource "aws_api_gateway_rest_api" "main" {
  name = "${var.project}-api"
}

resource "aws_api_gateway_method" "options" {
  count         = var.enable_cors ? 1 : 0
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_rest_api.main.root_resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  count       = var.enable_cors ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_rest_api.main.root_resource_id
  http_method = aws_api_gateway_method.options[0].http_method
  type        = "MOCK"
  request_templates = { "application/json" = jsonencode({ statusCode = 200 }) }
}
```

### 35. Conditional Elasticache cluster vs replication group
```hcl
resource "aws_elasticache_cluster" "dev" {
  count              = var.environment != "prod" ? 1 : 0
  cluster_id         = "${var.project}-cache"
  engine             = "redis"
  node_type          = "cache.t3.micro"
  num_cache_nodes    = 1
  parameter_group_name = "default.redis7"
}

resource "aws_elasticache_replication_group" "prod" {
  count                      = var.environment == "prod" ? 1 : 0
  replication_group_id       = "${var.project}-cache"
  description                = "Production cache cluster"
  node_type                  = var.cache_node_type
  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}
```

### 36. Conditional resources based on terraform workspace
```hcl
locals {
  is_prod     = terraform.workspace == "prod"
  is_dev      = terraform.workspace == "dev"
  is_ephemeral = !local.is_prod && !local.is_dev
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/app/${terraform.workspace}"
  retention_in_days = local.is_prod ? 90 : (local.is_dev ? 7 : 3)
}

resource "aws_db_instance" "main" {
  count             = local.is_ephemeral ? 0 : 1  # Skip DB for ephemeral workspaces
  identifier        = "app-${terraform.workspace}"
  engine            = "postgres"
  instance_class    = local.is_prod ? "db.r5.large" : "db.t3.micro"
  deletion_protection = local.is_prod
  skip_final_snapshot = !local.is_prod
}
```

### 37. Conditional S3 bucket access points
```hcl
variable "access_points" {
  type = map(object({
    enabled = bool
    vpc_id  = optional(string)
    policy  = optional(string)
  }))
  default = {}
}

locals {
  active_access_points = { for name, ap in var.access_points : name => ap if ap.enabled }
}

resource "aws_s3_access_point" "points" {
  for_each = local.active_access_points
  name     = "${var.project}-${each.key}"
  bucket   = aws_s3_bucket.data.id

  dynamic "vpc_configuration" {
    for_each = each.value.vpc_id != null ? [each.value.vpc_id] : []
    content { vpc_id = vpc_configuration.value }
  }
}
```

---

## Advanced

### 38. Complete conditional infrastructure stack
```hcl
variable "stack_config" {
  type = object({
    enable_alb          = optional(bool, true)
    enable_ecs          = optional(bool, true)
    enable_rds          = optional(bool, true)
    enable_elasticache  = optional(bool, false)
    enable_elasticsearch = optional(bool, false)
    enable_cdn          = optional(bool, false)
    enable_waf          = optional(bool, false)
    enable_backups      = optional(bool, false)
  })
  default = {}
}

module "alb"           { count = var.stack_config.enable_alb           ? 1 : 0; source = "./modules/alb" }
module "ecs"           { count = var.stack_config.enable_ecs           ? 1 : 0; source = "./modules/ecs"; alb_arn = try(module.alb[0].arn, null) }
module "rds"           { count = var.stack_config.enable_rds           ? 1 : 0; source = "./modules/rds" }
module "elasticache"   { count = var.stack_config.enable_elasticache   ? 1 : 0; source = "./modules/elasticache" }
module "elasticsearch" { count = var.stack_config.enable_elasticsearch ? 1 : 0; source = "./modules/elasticsearch" }
module "cdn"           { count = var.stack_config.enable_cdn           ? 1 : 0; source = "./modules/cloudfront"; alb_dns = try(module.alb[0].dns_name, null) }
module "waf"           { count = var.stack_config.enable_waf           ? 1 : 0; source = "./modules/waf" }
module "backups"       { count = var.stack_config.enable_backups       ? 1 : 0; source = "./modules/backup" }
```

### 39. Conditional with complex output aggregation
```hcl
output "connection_strings" {
  sensitive = true
  value = {
    database = try(
      "postgresql://${aws_db_instance.main[0].username}@${aws_db_instance.main[0].endpoint}/${aws_db_instance.main[0].db_name}",
      null
    )
    redis = try(
      "redis://${aws_elasticache_replication_group.cache[0].primary_endpoint_address}:6379",
      null
    )
    elasticsearch = try(
      "https://${aws_elasticsearch_domain.main[0].endpoint}",
      null
    )
  }
}
```

### 40. Conditional security hardening resources
```hcl
locals {
  hardening_enabled = var.environment == "prod" || var.force_hardening
}

resource "aws_config_config_rule" "mfa_enabled" {
  count = local.hardening_enabled ? 1 : 0
  name  = "mfa-enabled-for-iam-console-access"
  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }
}

resource "aws_securityhub_account" "main" {
  count = local.hardening_enabled ? 1 : 0
}

resource "aws_guardduty_detector" "main" {
  count  = local.hardening_enabled ? 1 : 0
  enable = true
  datasources {
    s3_logs { enable = true }
    kubernetes { audit_logs { enable = true } }
  }
}

resource "aws_macie2_account" "main" {
  count  = local.hardening_enabled && var.enable_macie ? 1 : 0
  status = "ENABLED"
}
```

### 41. Conditional EKS vs ECS decision
```hcl
variable "container_platform" {
  type    = string
  default = "ecs"  # "ecs" | "eks"
  validation {
    condition     = contains(["ecs", "eks"], var.container_platform)
    error_message = "container_platform must be 'ecs' or 'eks'."
  }
}

resource "aws_ecs_cluster" "main" {
  count = var.container_platform == "ecs" ? 1 : 0
  name  = "${var.project}-cluster"
}

resource "aws_eks_cluster" "main" {
  count    = var.container_platform == "eks" ? 1 : 0
  name     = "${var.project}-cluster"
  role_arn = aws_iam_role.eks[0].arn
  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}
```

### 42. Environment-conditional IAM permissions boundary
```hcl
locals {
  use_permissions_boundary = var.environment == "prod"
}

resource "aws_iam_policy" "boundary" {
  count       = local.use_permissions_boundary ? 1 : 0
  name        = "${var.project}-permissions-boundary"
  description = "Maximum permissions allowed for app roles"
  policy      = data.aws_iam_policy_document.boundary[0].json
}

resource "aws_iam_role" "app" {
  name                 = "${var.project}-app-role"
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  permissions_boundary = local.use_permissions_boundary ? aws_iam_policy.boundary[0].arn : null
}
```

### 43. Conditional service mesh (App Mesh)
```hcl
variable "enable_service_mesh" {
  type    = bool
  default = false
}

resource "aws_appmesh_mesh" "main" {
  count = var.enable_service_mesh ? 1 : 0
  name  = "${var.project}-mesh"
  spec {
    egress_filter { type = "ALLOW_ALL" }
  }
}

resource "aws_appmesh_virtual_node" "services" {
  for_each  = var.enable_service_mesh ? local.active_services : {}
  mesh_name = aws_appmesh_mesh.main[0].id
  name      = each.key
  spec {
    listener {
      port_mapping {
        port     = each.value.port
        protocol = "http"
      }
    }
    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.app.name
        service_name   = each.key
      }
    }
  }
}
```

### 44. Conditional Cognito auth vs API key auth
```hcl
variable "api_auth_type" {
  type    = string
  default = "api_key"  # "api_key" | "cognito" | "iam"
}

resource "aws_cognito_user_pool" "main" {
  count = var.api_auth_type == "cognito" ? 1 : 0
  name  = "${var.project}-users"
}

resource "aws_api_gateway_authorizer" "cognito" {
  count           = var.api_auth_type == "cognito" ? 1 : 0
  name            = "cognito"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.main[0].arn]
}

resource "aws_api_gateway_api_key" "app" {
  count = var.api_auth_type == "api_key" ? 1 : 0
  name  = "${var.project}-api-key"
}
```

### 45. All-or-nothing conditional stack with validation
```hcl
variable "dr_config" {
  type = object({
    enabled        = bool
    region         = optional(string, "us-west-2")
    rpo_hours      = optional(number, 4)
    rto_hours      = optional(number, 8)
    replica_count  = optional(number, 1)
  })
  default = { enabled = false }

  validation {
    condition     = !var.dr_config.enabled || var.dr_config.rpo_hours >= 1
    error_message = "DR RPO must be at least 1 hour."
  }
}

module "dr" {
  count         = var.dr_config.enabled ? 1 : 0
  source        = "./modules/disaster-recovery"
  primary_region = var.region
  dr_region      = var.dr_config.region
  rpo_hours      = var.dr_config.rpo_hours
  rto_hours      = var.dr_config.rto_hours
  replica_count  = var.dr_config.replica_count
}
```

### 46. Conditional compliance resources (HIPAA/PCI)
```hcl
variable "compliance_requirements" {
  type    = list(string)
  default = []
  validation {
    condition     = alltrue([for r in var.compliance_requirements : contains(["hipaa", "pci", "sox", "fedramp"], r)])
    error_message = "Valid compliance values: hipaa, pci, sox, fedramp."
  }
}

locals {
  hipaa_required = contains(var.compliance_requirements, "hipaa")
  pci_required   = contains(var.compliance_requirements, "pci")
}

resource "aws_kms_key" "audit" {
  count                   = local.hipaa_required || local.pci_required ? 1 : 0
  description             = "Audit log encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
}

resource "aws_cloudtrail" "compliance" {
  count                         = local.hipaa_required || local.pci_required ? 1 : 0
  name                          = "${var.project}-compliance-trail"
  s3_bucket_name                = aws_s3_bucket.audit[0].bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.audit[0].arn
}
```

### 47. Conditional network mode — public vs private
```hcl
variable "network_exposure" {
  type    = string
  default = "private"  # "public" | "private" | "internal"
}

resource "aws_lb" "app" {
  name               = "${var.project}-lb"
  load_balancer_type = "application"
  internal           = var.network_exposure != "public"
  subnets            = var.network_exposure == "public" ? aws_subnet.public[*].id : aws_subnet.private[*].id
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_listener" "https" {
  count             = var.network_exposure == "public" ? 1 : 0
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 48. Conditional Lambda destinations
```hcl
variable "enable_dlq" { type = bool; default = true }
variable "enable_success_destination" { type = bool; default = false }

resource "aws_sqs_queue" "dlq" {
  count = var.enable_dlq ? 1 : 0
  name  = "${var.project}-dlq"
}

resource "aws_sns_topic" "success" {
  count = var.enable_success_destination ? 1 : 0
  name  = "${var.project}-success"
}

resource "aws_lambda_function_event_invoke_config" "fn" {
  function_name = aws_lambda_function.app.function_name

  dynamic "destination_config" {
    for_each = (var.enable_dlq || var.enable_success_destination) ? [1] : []
    content {
      dynamic "on_failure" {
        for_each = var.enable_dlq ? [1] : []
        content { destination = aws_sqs_queue.dlq[0].arn }
      }
      dynamic "on_success" {
        for_each = var.enable_success_destination ? [1] : []
        content { destination = aws_sns_topic.success[0].arn }
      }
    }
  }
}
```

### 49. Conditional blue/green deployment setup
```hcl
variable "deployment_strategy" {
  type    = string
  default = "rolling"  # "rolling" | "blue_green" | "canary"
}

resource "aws_codedeploy_deployment_group" "app" {
  app_name              = aws_codedeploy_app.app.name
  deployment_group_name = "${var.project}-dg"
  service_role_arn      = aws_iam_role.codedeploy.arn

  deployment_style {
    deployment_option = var.deployment_strategy == "rolling" ? "WITHOUT_TRAFFIC_CONTROL" : "WITH_TRAFFIC_CONTROL"
    deployment_type   = var.deployment_strategy == "blue_green" ? "BLUE_GREEN" : "IN_PLACE"
  }

  dynamic "blue_green_deployment_config" {
    for_each = var.deployment_strategy == "blue_green" ? [1] : []
    content {
      terminate_blue_instances_on_deployment_success {
        action                           = "TERMINATE"
        termination_wait_time_in_minutes = 5
      }
      deployment_ready_option {
        action_on_timeout = "CONTINUE_DEPLOYMENT"
      }
    }
  }
}
```

### 50. Full conditional environment infrastructure with all patterns
```hcl
variable "environment" { type = string }
variable "config" {
  type = object({
    enable_bastion        = optional(bool, false)
    enable_cdn            = optional(bool, false)
    enable_waf            = optional(bool, false)
    enable_dr             = optional(bool, false)
    enable_backups        = optional(bool, false)
    enable_monitoring     = optional(bool, true)
    enable_compliance     = optional(bool, false)
    nat_gateway_per_az    = optional(bool, false)
    deletion_protection   = optional(bool, false)
    multi_az_db           = optional(bool, false)
    redis_cluster_mode    = optional(bool, false)
  })
  default = {}
}

locals {
  is_prod = var.environment == "prod"
  # Enforce prod best practices regardless of config
  effective = {
    enable_bastion      = var.config.enable_bastion
    enable_cdn          = var.config.enable_cdn
    enable_waf          = var.config.enable_waf || local.is_prod
    enable_dr           = var.config.enable_dr || local.is_prod
    enable_backups      = var.config.enable_backups || local.is_prod
    enable_monitoring   = var.config.enable_monitoring || local.is_prod
    enable_compliance   = var.config.enable_compliance || local.is_prod
    nat_per_az          = var.config.nat_gateway_per_az || local.is_prod
    deletion_protect    = var.config.deletion_protection || local.is_prod
    multi_az_db         = var.config.multi_az_db || local.is_prod
    redis_cluster       = var.config.redis_cluster_mode || local.is_prod
  }
}

resource "aws_instance" "bastion"       { count = local.effective.enable_bastion     ? 1 : 0 }
module "cdn"                            { count = local.effective.enable_cdn         ? 1 : 0; source = "./modules/cloudfront" }
module "waf"                            { count = local.effective.enable_waf         ? 1 : 0; source = "./modules/waf" }
module "dr"                             { count = local.effective.enable_dr          ? 1 : 0; source = "./modules/dr" }
module "backups"                        { count = local.effective.enable_backups     ? 1 : 0; source = "./modules/backup" }
module "monitoring"                     { count = local.effective.enable_monitoring  ? 1 : 0; source = "./modules/monitoring" }
module "compliance"                     { count = local.effective.enable_compliance  ? 1 : 0; source = "./modules/compliance" }
```
