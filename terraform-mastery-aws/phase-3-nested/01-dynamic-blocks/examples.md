# Examples 3.1 — Dynamic Blocks (50 examples)

---

## Basic

### 1. Dynamic ingress rules in aws_security_group
```hcl
variable "ingress_ports" {
  type    = list(number)
  default = [80, 443, 8080]
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

### 2. Dynamic egress rules
```hcl
resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id

  dynamic "egress" {
    for_each = [{ port = 443, cidr = "0.0.0.0/0" }, { port = 5432, cidr = "10.0.0.0/8" }]
    content {
      from_port   = egress.value.port
      to_port     = egress.value.port
      protocol    = "tcp"
      cidr_blocks = [egress.value.cidr]
    }
  }
}
```

### 3. Dynamic ingress with map variable
```hcl
variable "sg_rules" {
  type = map(object({
    port     = number
    protocol = string
    cidr     = string
  }))
}

resource "aws_security_group" "custom" {
  name   = "custom-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.sg_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = [ingress.value.cidr]
      description = ingress.key
    }
  }
}
```

### 4. Dynamic tag blocks (aws_autoscaling_group)
```hcl
locals {
  asg_tags = {
    Environment = "prod"
    Team        = "platform"
    ManagedBy   = "terraform"
  }
}

resource "aws_autoscaling_group" "app" {
  name             = "app-asg"
  min_size         = 2
  max_size         = 10
  desired_capacity = 3

  dynamic "tag" {
    for_each = local.asg_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
```

### 5. Dynamic setting blocks in aws_elasticache_replication_group
```hcl
variable "cache_params" {
  type = list(object({
    name  = string
    value = string
  }))
}

resource "aws_elasticache_parameter_group" "cache" {
  name   = "app-cache-params"
  family = "redis7"

  dynamic "parameter" {
    for_each = var.cache_params
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }
}
```

### 6. Dynamic cors_rule in aws_s3_bucket_cors_configuration
```hcl
variable "cors_origins" {
  type    = list(string)
  default = ["https://app.example.com", "https://admin.example.com"]
}

resource "aws_s3_bucket_cors_configuration" "api" {
  bucket = aws_s3_bucket.api.id

  dynamic "cors_rule" {
    for_each = var.cors_origins
    content {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "PUT", "POST"]
      allowed_origins = [cors_rule.value]
      max_age_seconds = 3000
    }
  }
}
```

### 7. Dynamic lifecycle_rule in aws_s3_bucket
```hcl
variable "lifecycle_rules" {
  type = list(object({
    id                 = string
    prefix             = string
    transition_days    = number
    expiration_days    = number
  }))
}

resource "aws_s3_bucket_lifecycle_configuration" "bucket" {
  bucket = aws_s3_bucket.data.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = "Enabled"
      filter { prefix = rule.value.prefix }
      transition {
        days          = rule.value.transition_days
        storage_class = "STANDARD_IA"
      }
      expiration {
        days = rule.value.expiration_days
      }
    }
  }
}
```

### 8. Dynamic statement blocks in aws_iam_policy_document
```hcl
variable "s3_actions" {
  type = list(object({
    sid     = string
    actions = list(string)
    bucket  = string
  }))
}

data "aws_iam_policy_document" "s3_access" {
  dynamic "statement" {
    for_each = var.s3_actions
    content {
      sid     = statement.value.sid
      effect  = "Allow"
      actions = statement.value.actions
      resources = [
        "arn:aws:s3:::${statement.value.bucket}",
        "arn:aws:s3:::${statement.value.bucket}/*",
      ]
    }
  }
}
```

### 9. Dynamic environment blocks in aws_lambda_function
```hcl
variable "lambda_env_vars" {
  type    = map(string)
  default = {}
}

resource "aws_lambda_function" "fn" {
  function_name = "my-function"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = "function.zip"

  dynamic "environment" {
    for_each = length(var.lambda_env_vars) > 0 ? [var.lambda_env_vars] : []
    content {
      variables = environment.value
    }
  }
}
```

### 10. Dynamic subnet blocks in aws_db_subnet_group
```hcl
resource "aws_db_subnet_group" "rds" {
  name = "rds-subnet-group"

  dynamic "subnet_ids" {
    for_each = []  # subnet_ids is an argument, not a block — use list directly
    content {}
  }
  # Correct approach:
  subnet_ids = aws_subnet.private[*].id
}
```

### 11. Dynamic ordered_cache_behavior in CloudFront
```hcl
variable "cache_behaviors" {
  type = list(object({
    path_pattern = string
    cache_policy = string
    compress     = bool
  }))
}

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id   = "s3"
  }
  enabled = true

  dynamic "ordered_cache_behavior" {
    for_each = var.cache_behaviors
    content {
      path_pattern             = ordered_cache_behavior.value.path_pattern
      target_origin_id         = "s3"
      viewer_protocol_policy   = "redirect-to-https"
      compress                 = ordered_cache_behavior.value.compress
      cache_policy_id          = ordered_cache_behavior.value.cache_policy
      allowed_methods          = ["GET", "HEAD"]
      cached_methods           = ["GET", "HEAD"]
    }
  }
  default_cache_behavior {
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 12. Dynamic custom_error_response in CloudFront
```hcl
variable "error_responses" {
  type = map(string)
  default = {
    "403" = "/403.html"
    "404" = "/404.html"
    "500" = "/500.html"
  }
}

resource "aws_cloudfront_distribution" "cdn" {
  # ... origin and other config omitted for brevity

  dynamic "custom_error_response" {
    for_each = var.error_responses
    content {
      error_code            = tonumber(custom_error_response.key)
      response_code         = tonumber(custom_error_response.key)
      response_page_path    = custom_error_response.value
      error_caching_min_ttl = 30
    }
  }
  enabled = true
  default_cache_behavior {
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

---

## Intermediate

### 13. Dynamic ingress with iterator label
```hcl
resource "aws_security_group" "db" {
  name   = "db-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = toset([5432, 5433])
    iterator = port
    content {
      from_port   = port.value
      to_port     = port.value
      protocol    = "tcp"
      cidr_blocks = ["10.0.0.0/8"]
      description = "PostgreSQL port ${port.value}"
    }
  }
}
```

### 14. Dynamic routing_config in aws_lambda_alias
```hcl
variable "canary_weight" {
  type    = number
  default = 0
}

resource "aws_lambda_alias" "live" {
  name             = "live"
  function_name    = aws_lambda_function.app.function_name
  function_version = aws_lambda_function.app.version

  dynamic "routing_config" {
    for_each = var.canary_weight > 0 ? [var.canary_weight] : []
    content {
      additional_version_weights = {
        (aws_lambda_function.app.version) = routing_config.value
      }
    }
  }
}
```

### 15. Dynamic condition blocks in aws_lb_listener_rule
```hcl
variable "routing_rules" {
  type = list(object({
    priority    = number
    path_prefix = string
    target_arn  = string
    host_header = string
  }))
}

resource "aws_lb_listener_rule" "routes" {
  for_each     = { for r in var.routing_rules : tostring(r.priority) => r }
  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = each.value.target_arn
  }

  dynamic "condition" {
    for_each = each.value.path_prefix != "" ? [each.value.path_prefix] : []
    content {
      path_pattern { values = [condition.value] }
    }
  }

  dynamic "condition" {
    for_each = each.value.host_header != "" ? [each.value.host_header] : []
    content {
      host_header { values = [condition.value] }
    }
  }
}
```

### 16. Dynamic filter blocks in aws_security_group data source
```hcl
variable "sg_filters" {
  type = map(list(string))
  default = {
    "tag:Environment" = ["production"]
    "tag:Team"        = ["platform"]
  }
}

data "aws_security_groups" "filtered" {
  dynamic "filter" {
    for_each = var.sg_filters
    content {
      name   = filter.key
      values = filter.value
    }
  }
}
```

### 17. Dynamic vpc_config for aws_lambda_function
```hcl
variable "deploy_in_vpc" {
  type    = bool
  default = false
}

resource "aws_lambda_function" "fn" {
  function_name = "my-function"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  filename      = "function.zip"

  dynamic "vpc_config" {
    for_each = var.deploy_in_vpc ? [1] : []
    content {
      subnet_ids         = aws_subnet.private[*].id
      security_group_ids = [aws_security_group.lambda.id]
    }
  }
}
```

### 18. Dynamic ingress with multiple CIDR sources
```hcl
variable "trusted_cidrs" {
  type = map(list(string))
  default = {
    office_vpn = ["203.0.113.0/24"]
    jenkins    = ["10.1.0.0/16"]
    monitoring = ["10.2.0.0/16"]
  }
}

resource "aws_security_group" "admin" {
  name   = "admin-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.trusted_cidrs
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ingress.value
      description = "SSH from ${ingress.key}"
    }
  }
}
```

### 19. Dynamic replica regions in aws_dynamodb_table
```hcl
variable "replica_regions" {
  type    = list(string)
  default = ["us-west-2", "eu-west-1"]
}

resource "aws_dynamodb_table" "global" {
  name             = "global-sessions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "session_id"
    type = "S"
  }

  dynamic "replica" {
    for_each = var.replica_regions
    content {
      region_name = replica.value
    }
  }
}
```

### 20. Dynamic authorization in aws_api_gateway_method
```hcl
variable "api_auth_types" {
  type = map(string)
  default = {
    "GET /public"   = "NONE"
    "POST /private" = "AWS_IAM"
    "GET /cognito"  = "COGNITO_USER_POOLS"
  }
}
```

### 21. Dynamic network_interfaces in aws_launch_template
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"

  dynamic "network_interfaces" {
    for_each = [1]
    content {
      associate_public_ip_address = false
      delete_on_termination       = true
      security_groups             = [aws_security_group.app.id]
    }
  }
}
```

### 22. Dynamic block_device_mappings in aws_launch_template
```hcl
variable "ebs_volumes" {
  type = list(object({
    device     = string
    size_gb    = number
    type       = string
    encrypted  = bool
  }))
  default = [
    { device = "/dev/sdb", size_gb = 100, type = "gp3", encrypted = true },
    { device = "/dev/sdc", size_gb = 500, type = "st1", encrypted = true },
  ]
}

resource "aws_launch_template" "data" {
  name_prefix   = "data-node-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "r5.xlarge"

  dynamic "block_device_mappings" {
    for_each = var.ebs_volumes
    content {
      device_name = block_device_mappings.value.device
      ebs {
        volume_size           = block_device_mappings.value.size_gb
        volume_type           = block_device_mappings.value.type
        encrypted             = block_device_mappings.value.encrypted
        kms_key_id            = aws_kms_key.ebs.arn
        delete_on_termination = true
      }
    }
  }
}
```

### 23. Dynamic filter in aws_instances data source
```hcl
variable "instance_filters" {
  type = map(list(string))
  default = {
    "instance-state-name" = ["running"]
    "tag:Role"            = ["web"]
    "tag:Environment"     = ["prod"]
  }
}

data "aws_instances" "web" {
  dynamic "filter" {
    for_each = var.instance_filters
    content {
      name   = filter.key
      values = filter.value
    }
  }
}
```

### 24. Dynamic mount_points in ECS container definition
```hcl
locals {
  container_def = jsonencode([{
    name  = "app"
    image = "${aws_ecr_repository.app.repository_url}:latest"
    portMappings = [{ containerPort = 8080 }]
    mountPoints = [for vol in var.volumes : {
      containerPath = vol.container_path
      sourceVolume  = vol.name
      readOnly      = vol.read_only
    }]
  }])
}
```

### 25. Dynamic statement with conditional principals
```hcl
variable "trusted_accounts" {
  type    = list(string)
  default = ["111111111111", "222222222222"]
}

data "aws_iam_policy_document" "trust" {
  dynamic "statement" {
    for_each = var.trusted_accounts
    content {
      sid     = "Trust${statement.key}"
      effect  = "Allow"
      actions = ["sts:AssumeRole"]
      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${statement.value}:root"]
      }
    }
  }
}
```

---

## Nested

### 26. Nested dynamic blocks — ingress with multiple CIDR groups
```hcl
variable "firewall_matrix" {
  type = map(object({
    ports = list(number)
    cidrs = list(string)
  }))
}

resource "aws_security_group" "complex" {
  name   = "complex-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.firewall_matrix
    content {
      from_port   = ingress.value.ports[0]
      to_port     = ingress.value.ports[length(ingress.value.ports) - 1]
      protocol    = "tcp"
      cidr_blocks = ingress.value.cidrs
      description = "Rule: ${ingress.key}"
    }
  }
}
```

### 27. Nested dynamic — WAFv2 managed rule groups
```hcl
variable "waf_managed_rules" {
  type = list(object({
    name              = string
    vendor            = string
    priority          = number
    excluded_rules    = list(string)
  }))
}

resource "aws_wafv2_web_acl" "main" {
  name  = "app-waf"
  scope = "REGIONAL"

  default_action { allow {} }

  dynamic "rule" {
    for_each = var.waf_managed_rules
    content {
      name     = rule.value.name
      priority = rule.value.priority

      statement {
        managed_rule_group_statement {
          name        = rule.value.name
          vendor_name = rule.value.vendor

          dynamic "excluded_rule" {
            for_each = rule.value.excluded_rules
            content {
              name = excluded_rule.value
            }
          }
        }
      }

      override_action { none {} }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.value.name
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "app-waf"
    sampled_requests_enabled   = true
  }
}
```

### 28. Dynamic alarm_configuration in aws_codedeploy_deployment_group
```hcl
variable "deployment_alarms" {
  type    = list(string)
  default = ["app-error-rate", "app-5xx-rate"]
}

resource "aws_codedeploy_deployment_group" "app" {
  app_name              = aws_codedeploy_app.app.name
  deployment_group_name = "app-dg"
  service_role_arn      = aws_iam_role.codedeploy.arn

  dynamic "alarm_configuration" {
    for_each = length(var.deployment_alarms) > 0 ? [1] : []
    content {
      alarms  = var.deployment_alarms
      enabled = true
    }
  }
}
```

### 29. Nested dynamic — ECS capacity provider strategies
```hcl
variable "capacity_providers" {
  type = list(object({
    name   = string
    base   = number
    weight = number
  }))
}

resource "aws_ecs_service" "app" {
  name            = "app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3

  dynamic "capacity_provider_strategy" {
    for_each = var.capacity_providers
    content {
      capacity_provider = capacity_provider_strategy.value.name
      base              = capacity_provider_strategy.value.base
      weight            = capacity_provider_strategy.value.weight
    }
  }
}
```

### 30. Dynamic policy with nested condition blocks
```hcl
variable "ip_condition_statements" {
  type = list(object({
    effect  = string
    actions = list(string)
    resource = string
    condition_key   = string
    condition_values = list(string)
  }))
}

data "aws_iam_policy_document" "conditional" {
  dynamic "statement" {
    for_each = var.ip_condition_statements
    content {
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = [statement.value.resource]

      condition {
        test     = "IpAddress"
        variable = statement.value.condition_key
        values   = statement.value.condition_values
      }
    }
  }
}
```

### 31. Dynamic VPC endpoint services
```hcl
variable "vpc_endpoints" {
  type = map(object({
    service_type    = string
    route_table_ids = optional(list(string), [])
    subnet_ids      = optional(list(string), [])
  }))
  default = {
    s3       = { service_type = "Gateway" }
    dynamodb = { service_type = "Gateway" }
    ssm      = { service_type = "Interface" }
  }
}

resource "aws_vpc_endpoint" "services" {
  for_each          = var.vpc_endpoints
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.${each.key}"
  vpc_endpoint_type = each.value.service_type

  dynamic "subnet_ids" {
    for_each = each.value.service_type == "Interface" ? [each.value.subnet_ids] : []
    content {}
  }
  subnet_ids         = each.value.service_type == "Interface" ? each.value.subnet_ids : null
  route_table_ids    = each.value.service_type == "Gateway" ? each.value.route_table_ids : null
  private_dns_enabled = each.value.service_type == "Interface"
}
```

### 32. Dynamic transition rules in S3 lifecycle
```hcl
variable "storage_tiers" {
  type = list(object({
    days          = number
    storage_class = string
  }))
  default = [
    { days = 30,  storage_class = "STANDARD_IA" },
    { days = 90,  storage_class = "GLACIER" },
    { days = 365, storage_class = "DEEP_ARCHIVE" },
  ]
}

resource "aws_s3_bucket_lifecycle_configuration" "tiered" {
  bucket = aws_s3_bucket.archive.id

  rule {
    id     = "intelligent-tiering"
    status = "Enabled"
    filter { prefix = "data/" }

    dynamic "transition" {
      for_each = var.storage_tiers
      content {
        days          = transition.value.days
        storage_class = transition.value.storage_class
      }
    }

    expiration { days = 2555 }  # 7 years
  }
}
```

### 33. Dynamic node_groups in EKS
```hcl
variable "node_groups" {
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
    capacity_type  = string
  }))
}

resource "aws_eks_node_group" "groups" {
  for_each        = var.node_groups
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = each.key
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = each.value.instance_types
  capacity_type   = each.value.capacity_type

  scaling_config {
    min_size     = each.value.min_size
    max_size     = each.value.max_size
    desired_size = each.value.desired_size
  }

  lifecycle { ignore_changes = [scaling_config[0].desired_size] }
}
```

### 34. Dynamic principals in resource-based policy
```hcl
variable "allowed_roles" {
  type    = list(string)
  default = []
}

variable "allowed_services" {
  type    = list(string)
  default = ["lambda.amazonaws.com"]
}

data "aws_iam_policy_document" "resource_policy" {
  dynamic "statement" {
    for_each = length(var.allowed_roles) > 0 ? [1] : []
    content {
      sid     = "AllowRoles"
      effect  = "Allow"
      actions = ["execute-api:Invoke"]
      principals {
        type        = "AWS"
        identifiers = var.allowed_roles
      }
      resources = ["*"]
    }
  }

  dynamic "statement" {
    for_each = var.allowed_services
    content {
      sid     = "AllowService${replace(statement.value, ".", "")}"
      effect  = "Allow"
      actions = ["execute-api:Invoke"]
      principals {
        type        = "Service"
        identifiers = [statement.value]
      }
      resources = ["*"]
    }
  }
}
```

### 35. Dynamic alarm actions
```hcl
variable "notification_targets" {
  type = list(object({
    name     = string
    email    = string
    severity = string
  }))
}

resource "aws_cloudwatch_metric_alarm" "app_errors" {
  alarm_name          = "app-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10

  alarm_actions = [
    for t in var.notification_targets :
    aws_sns_topic.alerts[t.name].arn
    if t.severity == "critical"
  ]
}
```

### 36. Dynamic geographic restriction in CloudFront
```hcl
variable "allowed_countries" {
  type    = list(string)
  default = ["US", "CA", "GB"]
}

variable "geo_restriction_type" {
  type    = string
  default = "whitelist"
}

resource "aws_cloudfront_distribution" "cdn" {
  # ... other config
  enabled = true
  restrictions {
    dynamic "geo_restriction" {
      for_each = [1]
      content {
        restriction_type = var.geo_restriction_type
        locations        = var.allowed_countries
      }
    }
  }
  default_cache_behavior {
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values { query_string = false; cookies { forward = "none" } }
  }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

### 37. Dynamic alarm dimensions
```hcl
variable "dimension_filters" {
  type = map(string)
  default = {
    AutoScalingGroupName = "app-asg"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dynamic "dimensions" {
    for_each = []  # dimensions is a map argument, not a block
    content {}
  }
  dimensions = var.dimension_filters
}
```

---

## Advanced

### 38. Fully dynamic WAFv2 web ACL with rate-limiting and managed rules
```hcl
variable "waf_config" {
  type = object({
    rate_limit     = number
    managed_rules  = list(string)
    ip_whitelist   = list(string)
  })
}

resource "aws_wafv2_web_acl" "advanced" {
  name  = "advanced-waf"
  scope = "CLOUDFRONT"
  provider = aws.us_east_1

  default_action { block {} }

  # IP whitelist rule
  dynamic "rule" {
    for_each = length(var.waf_config.ip_whitelist) > 0 ? [1] : []
    content {
      name     = "ip-whitelist"
      priority = 1
      action   { allow {} }
      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.whitelist.arn
        }
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "ip-whitelist"
        sampled_requests_enabled   = true
      }
    }
  }

  # Rate limiting rule
  rule {
    name     = "rate-limit"
    priority = 2
    action   { block {} }
    statement {
      rate_based_statement {
        limit              = var.waf_config.rate_limit
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # Managed rule groups
  dynamic "rule" {
    for_each = { for idx, name in var.waf_config.managed_rules : name => idx + 10 }
    content {
      name     = rule.key
      priority = rule.value
      override_action { none {} }
      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
        }
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.key
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "advanced-waf"
    sampled_requests_enabled   = true
  }
}
```

### 39. Dynamic composite alarm with metric queries
```hcl
variable "metric_queries" {
  type = list(object({
    id          = string
    metric_name = string
    namespace   = string
    period      = number
    stat        = string
    dimensions  = map(string)
  }))
}

resource "aws_cloudwatch_metric_alarm" "composite" {
  alarm_name          = "composite-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 95

  dynamic "metric_query" {
    for_each = var.metric_queries
    content {
      id    = metric_query.value.id
      label = "${metric_query.value.namespace}/${metric_query.value.metric_name}"
      metric {
        metric_name = metric_query.value.metric_name
        namespace   = metric_query.value.namespace
        period      = metric_query.value.period
        stat        = metric_query.value.stat
        dimensions  = metric_query.value.dimensions
      }
    }
  }
}
```

### 40. Dynamic ECS task definition with sidecars
```hcl
variable "sidecars" {
  type = list(object({
    name    = string
    image   = string
    cpu     = number
    memory  = number
    env     = map(string)
  }))
  default = []
}

locals {
  main_container = {
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
    cpu       = 256
    memory    = 512
    essential = true
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    environment = [for k, v in var.app_env : { name = k, value = v }]
  }

  sidecar_containers = [
    for s in var.sidecars : {
      name      = s.name
      image     = s.image
      cpu       = s.cpu
      memory    = s.memory
      essential = false
      environment = [for k, v in s.env : { name = k, value = v }]
    }
  ]
}

resource "aws_ecs_task_definition" "app" {
  family                   = "app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions    = jsonencode(concat([local.main_container], local.sidecar_containers))
}
```

### 41. Nested dynamic for IAM policy with condition operators
```hcl
variable "s3_conditional_policies" {
  type = list(object({
    actions      = list(string)
    buckets      = list(string)
    require_mfa  = bool
    require_ssl  = bool
    allowed_ips  = list(string)
  }))
}

data "aws_iam_policy_document" "advanced_s3" {
  dynamic "statement" {
    for_each = var.s3_conditional_policies
    content {
      effect  = "Allow"
      actions = statement.value.actions
      resources = flatten([
        for b in statement.value.buckets : [
          "arn:aws:s3:::${b}",
          "arn:aws:s3:::${b}/*"
        ]
      ])

      dynamic "condition" {
        for_each = statement.value.require_mfa ? [1] : []
        content {
          test     = "Bool"
          variable = "aws:MultiFactorAuthPresent"
          values   = ["true"]
        }
      }

      dynamic "condition" {
        for_each = statement.value.require_ssl ? [1] : []
        content {
          test     = "Bool"
          variable = "aws:SecureTransport"
          values   = ["true"]
        }
      }

      dynamic "condition" {
        for_each = length(statement.value.allowed_ips) > 0 ? [statement.value.allowed_ips] : []
        content {
          test     = "IpAddress"
          variable = "aws:SourceIp"
          values   = condition.value
        }
      }
    }
  }
}
```

### 42. Dynamic EventBridge rules from config
```hcl
variable "event_rules" {
  type = list(object({
    name        = string
    pattern     = string
    target_arn  = string
    input       = optional(string, null)
  }))
}

resource "aws_cloudwatch_event_rule" "rules" {
  for_each      = { for r in var.event_rules : r.name => r }
  name          = each.value.name
  event_pattern = each.value.pattern
}

resource "aws_cloudwatch_event_target" "targets" {
  for_each = { for r in var.event_rules : r.name => r }
  rule     = aws_cloudwatch_event_rule.rules[each.key].name
  arn      = each.value.target_arn

  dynamic "input_transformer" {
    for_each = each.value.input != null ? [each.value.input] : []
    content {
      input_template = input_transformer.value
    }
  }
}
```

### 43. Dynamic alb_target_group_attachment from instance list
```hcl
variable "target_instances" {
  type = list(object({
    id   = string
    port = number
    az   = string
  }))
}

resource "aws_lb_target_group_attachment" "instances" {
  for_each         = { for t in var.target_instances : t.id => t }
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = each.value.id
  port             = each.value.port
}
```

### 44. Dynamic step scaling policies
```hcl
variable "scaling_steps" {
  type = list(object({
    metric_interval_lower_bound = number
    metric_interval_upper_bound = optional(number)
    scaling_adjustment          = number
  }))
  default = [
    { metric_interval_lower_bound = 0,  metric_interval_upper_bound = 10, scaling_adjustment = 1 },
    { metric_interval_lower_bound = 10, metric_interval_upper_bound = 30, scaling_adjustment = 2 },
    { metric_interval_lower_bound = 30, metric_interval_upper_bound = null, scaling_adjustment = 4 },
  ]
}

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "scale-out"
  scaling_adjustment     = null
  policy_type            = "StepScaling"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"

  dynamic "step_adjustment" {
    for_each = var.scaling_steps
    content {
      metric_interval_lower_bound = step_adjustment.value.metric_interval_lower_bound
      metric_interval_upper_bound = step_adjustment.value.metric_interval_upper_bound
      scaling_adjustment          = step_adjustment.value.scaling_adjustment
    }
  }
}
```

### 45. Fully dynamic aws_iam_policy_document with multiple principal types
```hcl
locals {
  cross_account_trust = {
    account_ids = var.trusted_account_ids
    services    = var.trusted_services
    federated   = var.federated_principals
  }
}

data "aws_iam_policy_document" "complex_trust" {
  dynamic "statement" {
    for_each = length(local.cross_account_trust.account_ids) > 0 ? [1] : []
    content {
      effect  = "Allow"
      actions = ["sts:AssumeRole"]
      principals {
        type        = "AWS"
        identifiers = [for id in local.cross_account_trust.account_ids : "arn:aws:iam::${id}:root"]
      }
      condition {
        test     = "StringEquals"
        variable = "sts:ExternalId"
        values   = [var.external_id]
      }
    }
  }

  dynamic "statement" {
    for_each = local.cross_account_trust.services
    content {
      effect  = "Allow"
      actions = ["sts:AssumeRole"]
      principals {
        type        = "Service"
        identifiers = [statement.value]
      }
    }
  }

  dynamic "statement" {
    for_each = local.cross_account_trust.federated
    content {
      effect  = "Allow"
      actions = ["sts:AssumeRoleWithWebIdentity"]
      principals {
        type        = "Federated"
        identifiers = [statement.value.arn]
      }
      condition {
        test     = "StringEquals"
        variable = "${statement.value.issuer}:sub"
        values   = statement.value.subjects
      }
    }
  }
}
```

### 46. Dynamic SQS queue policies with multiple consumers
```hcl
variable "sqs_consumers" {
  type = list(object({
    service_name = string
    account_id   = string
    actions      = list(string)
  }))
}

data "aws_iam_policy_document" "sqs_policy" {
  dynamic "statement" {
    for_each = var.sqs_consumers
    content {
      sid     = "Allow${replace(statement.value.service_name, "-", "")}"
      effect  = "Allow"
      actions = statement.value.actions
      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${statement.value.account_id}:root"]
      }
      resources = [aws_sqs_queue.main.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "main" {
  queue_url = aws_sqs_queue.main.url
  policy    = data.aws_iam_policy_document.sqs_policy.json
}
```

### 47. Dynamic Route53 records from a list
```hcl
variable "dns_records" {
  type = list(object({
    name    = string
    type    = string
    ttl     = number
    records = list(string)
  }))
}

resource "aws_route53_record" "records" {
  for_each = { for r in var.dns_records : "${r.name}-${r.type}" => r }
  zone_id  = aws_route53_zone.main.zone_id
  name     = each.value.name
  type     = each.value.type
  ttl      = each.value.ttl
  records  = each.value.records
}
```

### 48. Dynamic EKS add-ons
```hcl
variable "eks_addons" {
  type = map(object({
    version               = string
    resolve_conflicts     = string
    service_account_role  = optional(string)
  }))
  default = {
    vpc-cni    = { version = "v1.16.0-eksbuild.1", resolve_conflicts = "OVERWRITE" }
    coredns    = { version = "v1.11.1-eksbuild.4", resolve_conflicts = "OVERWRITE" }
    kube-proxy = { version = "v1.29.0-eksbuild.1", resolve_conflicts = "OVERWRITE" }
  }
}

resource "aws_eks_addon" "addons" {
  for_each                    = var.eks_addons
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = each.key
  addon_version               = each.value.version
  resolve_conflicts_on_update = each.value.resolve_conflicts
  service_account_role_arn    = each.value.service_account_role
}
```

### 49. Dynamic scheduled actions in Auto Scaling Group
```hcl
variable "scaling_schedules" {
  type = list(object({
    name             = string
    recurrence       = string
    min_size         = number
    max_size         = number
    desired_capacity = number
    time_zone        = string
  }))
  default = [
    { name = "business-hours-up",   recurrence = "0 8 * * MON-FRI", min_size = 4,  max_size = 20, desired_capacity = 8,  time_zone = "America/New_York" },
    { name = "business-hours-down", recurrence = "0 20 * * MON-FRI", min_size = 1, max_size = 4,  desired_capacity = 2,  time_zone = "America/New_York" },
    { name = "weekend-minimal",     recurrence = "0 0 * * SAT",       min_size = 1, max_size = 2,  desired_capacity = 1,  time_zone = "America/New_York" },
  ]
}

resource "aws_autoscaling_schedule" "schedules" {
  for_each               = { for s in var.scaling_schedules : s.name => s }
  scheduled_action_name  = each.value.name
  autoscaling_group_name = aws_autoscaling_group.app.name
  recurrence             = each.value.recurrence
  min_size               = each.value.min_size
  max_size               = each.value.max_size
  desired_capacity       = each.value.desired_capacity
  time_zone              = each.value.time_zone
}
```

### 50. Full production security group with dynamic rules from all sources
```hcl
variable "sg_config" {
  type = object({
    name        = string
    description = string
    ingress_rules = list(object({
      description     = string
      from_port       = number
      to_port         = number
      protocol        = string
      cidr_blocks     = optional(list(string), [])
      security_groups = optional(list(string), [])
      self            = optional(bool, false)
    }))
    egress_rules = list(object({
      description = string
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = optional(list(string), [])
    }))
  })
}

resource "aws_security_group" "dynamic_full" {
  name        = var.sg_config.name
  description = var.sg_config.description
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = { for idx, r in var.sg_config.ingress_rules : "${r.description}-${idx}" => r }
    content {
      description     = ingress.value.description
      from_port       = ingress.value.from_port
      to_port         = ingress.value.to_port
      protocol        = ingress.value.protocol
      cidr_blocks     = ingress.value.cidr_blocks
      security_groups = ingress.value.security_groups
      self            = ingress.value.self
    }
  }

  dynamic "egress" {
    for_each = { for idx, r in var.sg_config.egress_rules : "${r.description}-${idx}" => r }
    content {
      description = egress.value.description
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
    }
  }

  tags = merge(local.common_tags, { Name = var.sg_config.name })

  lifecycle { create_before_destroy = true }
}
```
