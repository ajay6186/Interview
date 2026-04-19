# Examples 6.5 — Cost Optimization (50 examples)

## Basic

### 1. S3 Intelligent Tiering
```hcl
resource "aws_s3_bucket_intelligent_tiering_configuration" "main" {
  bucket = aws_s3_bucket.data.id
  name   = "EntireBucket"

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "data_lifecycle" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
```

### 2. EC2 Spot Instances for Batch Workloads
```hcl
resource "aws_spot_fleet_request" "batch_workers" {
  iam_fleet_role                      = aws_iam_role.spot_fleet.arn
  spot_price                          = "0.50"
  target_capacity                     = 10
  allocation_strategy                 = "diversified"
  fleet_type                          = "maintain"
  terminate_instances_with_expiration = true
  valid_until                         = "2026-12-31T00:00:00Z"

  launch_specification {
    instance_type            = "m5.large"
    ami                      = data.aws_ami.amazon_linux.id
    subnet_id                = var.private_subnet_id
    vpc_security_group_ids   = [aws_security_group.batch.id]
    iam_instance_profile_name = aws_iam_instance_profile.batch.name

    tags = { Name = "batch-spot-worker" }
  }

  launch_specification {
    instance_type            = "m5a.large"
    ami                      = data.aws_ami.amazon_linux.id
    subnet_id                = var.private_subnet_id
    vpc_security_group_ids   = [aws_security_group.batch.id]
    iam_instance_profile_name = aws_iam_instance_profile.batch.name
  }

  launch_specification {
    instance_type            = "m4.large"
    ami                      = data.aws_ami.amazon_linux.id
    subnet_id                = var.private_subnet_id
    vpc_security_group_ids   = [aws_security_group.batch.id]
    iam_instance_profile_name = aws_iam_instance_profile.batch.name
  }
}
```

### 3. Auto Scaling Scheduled Actions
```hcl
resource "aws_autoscaling_schedule" "scale_up_business_hours" {
  scheduled_action_name  = "scale-up-business-hours"
  autoscaling_group_name = aws_autoscaling_group.app.name
  min_size               = 3
  max_size               = 20
  desired_capacity       = 5
  recurrence             = "0 8 * * MON-FRI"
  time_zone              = "America/New_York"
}

resource "aws_autoscaling_schedule" "scale_down_night" {
  scheduled_action_name  = "scale-down-night"
  autoscaling_group_name = aws_autoscaling_group.app.name
  min_size               = 1
  max_size               = 5
  desired_capacity       = 1
  recurrence             = "0 20 * * MON-FRI"
  time_zone              = "America/New_York"
}

resource "aws_autoscaling_schedule" "scale_down_weekend" {
  scheduled_action_name  = "scale-down-weekend"
  autoscaling_group_name = aws_autoscaling_group.app.name
  min_size               = 1
  max_size               = 3
  desired_capacity       = 1
  recurrence             = "0 20 * * FRI"
  time_zone              = "America/New_York"
}
```

### 4. RDS Stop/Start for Non-Production
```hcl
resource "aws_cloudwatch_event_rule" "stop_dev_db" {
  name                = "stop-dev-db-nights"
  description         = "Stop dev RDS instances at night"
  schedule_expression = "cron(0 22 * * ? *)"
}

resource "aws_lambda_function" "rds_scheduler" {
  function_name = "rds-scheduler"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.rds_scheduler.arn
  filename      = data.archive_file.rds_scheduler.output_path

  environment {
    variables = {
      TAG_KEY   = "AutoStop"
      TAG_VALUE = "true"
    }
  }
}

# Lambda iterates RDS instances with tag AutoStop=true
# and calls stop-db-instance / start-db-instance accordingly
resource "aws_cloudwatch_event_target" "stop_dev_db" {
  rule = aws_cloudwatch_event_rule.stop_dev_db.name
  arn  = aws_lambda_function.rds_scheduler.arn

  input = jsonencode({ action = "stop" })
}

resource "aws_cloudwatch_event_rule" "start_dev_db" {
  name                = "start-dev-db-morning"
  schedule_expression = "cron(0 7 * * MON-FRI *)"
}

resource "aws_cloudwatch_event_target" "start_dev_db" {
  rule = aws_cloudwatch_event_rule.start_dev_db.name
  arn  = aws_lambda_function.rds_scheduler.arn

  input = jsonencode({ action = "start" })
}
```

### 5. EBS Volume Optimization
```hcl
resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"  # 20% cheaper than gp2, same performance
  iops              = 3000
  throughput        = 125

  tags = { Name = "optimized-data-volume" }
}

resource "aws_dlm_lifecycle_policy" "delete_old_snapshots" {
  description        = "Delete old snapshots to save costs"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]

    schedule {
      name = "weekly-snapshots"

      create_rule {
        interval      = 7
        interval_unit = "DAYS"
        times         = ["00:00"]
      }

      retain_rule {
        count = 4  # Keep only 4 weekly snapshots
      }
    }

    target_tags = { Snapshot = "true" }
  }
}
```

### 6. Lambda Power Tuning Results
```hcl
# Lambda with right-sized memory after power tuning
resource "aws_lambda_function" "optimized" {
  function_name = "cost-optimized-function"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  filename      = data.archive_file.function.output_path

  # Result of AWS Lambda Power Tuning: 512MB is optimal
  # for this workload (cost vs. performance sweet spot)
  memory_size = 512
  timeout     = 30

  # ARM64 is 20% cheaper and 20% faster than x86_64
  architectures = ["arm64"]
}
```

### 7. CloudWatch Log Retention Policy
```hcl
locals {
  log_groups_retention = {
    "/aws/lambda/production-api"    = 30
    "/aws/lambda/production-worker" = 30
    "/aws/ecs/production"           = 14
    "/aws/rds/instance/production"  = 7
    "/aws/apigateway/production"    = 7
    "/aws/lambda/dev-api"           = 3
    "/aws/lambda/staging-api"       = 7
  }
}

resource "aws_cloudwatch_log_group" "app_logs" {
  for_each = local.log_groups_retention

  name              = each.key
  retention_in_days = each.value
}
```

### 8. Reserved Instance Recommendations via Config
```hcl
resource "aws_config_config_rule" "underutilized_instances" {
  name = "ec2-instance-no-public-ip-check"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_DETAILED_MONITORING_ENABLED"
  }
}

resource "aws_ce_cost_allocation_tag" "environment" {
  tag_key = "Environment"
  status  = "Active"
}

resource "aws_ce_cost_allocation_tag" "team" {
  tag_key = "Team"
  status  = "Active"
}

resource "aws_ce_cost_allocation_tag" "application" {
  tag_key = "Application"
  status  = "Active"
}
```

### 9. S3 Lifecycle for Log Files
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555  # 7 years
    }
  }
}
```

### 10. NAT Gateway Optimization
```hcl
# Single NAT Gateway for non-production (vs 3 for production)
locals {
  nat_gateway_count = var.environment == "production" ? length(var.availability_zones) : 1
}

resource "aws_eip" "nat" {
  count  = local.nat_gateway_count
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = local.nat_gateway_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index % length(aws_subnet.public)].id
}
```

### 11. Data Transfer Cost Optimization
```hcl
# VPC Endpoint to avoid NAT Gateway charges for S3/DynamoDB
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(
    aws_route_table.private[*].id,
    aws_route_table.public[*].id
  )
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
}
```

### 12. AWS Budgets Alert
```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "monthly-budget"
  budget_type  = "COST"
  limit_amount = "5000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Environment$production"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["cloud-costs@example.com"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }
}
```

## Intermediate

### 13. Mixed Instance Types ASG with Spot
```hcl
resource "aws_autoscaling_group" "mixed" {
  name                = "mixed-instances-asg"
  vpc_zone_identifier = var.private_subnet_ids
  desired_capacity    = 10
  min_size            = 3
  max_size            = 50

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 2   # 2 on-demand always
      on_demand_percentage_above_base_capacity = 20  # 20% on-demand, 80% spot
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }

      override {
        instance_type     = "m5.large"
        weighted_capacity = "1"
      }

      override {
        instance_type     = "m5a.large"
        weighted_capacity = "1"
      }

      override {
        instance_type     = "m6i.large"
        weighted_capacity = "1"
      }

      override {
        instance_type     = "m6a.large"
        weighted_capacity = "1"
      }

      override {
        instance_type     = "m5.xlarge"
        weighted_capacity = "2"
      }

      override {
        instance_type     = "m6i.xlarge"
        weighted_capacity = "2"
      }
    }
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
}
```

### 14. ECS Fargate Spot
```hcl
resource "aws_ecs_capacity_provider" "fargate_spot" {
  name = "FARGATE_SPOT"
}

resource "aws_ecs_cluster_capacity_providers" "mixed" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 2         # 2 tasks always on Fargate
    weight            = 0
    capacity_provider = "FARGATE"
  }

  default_capacity_provider_strategy {
    base              = 0
    weight            = 100       # Remaining on Fargate Spot (70% cheaper)
    capacity_provider = "FARGATE_SPOT"
  }
}

resource "aws_ecs_service" "cost_optimized" {
  name            = "cost-optimized-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 10

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    base              = 2
    weight            = 0
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    base              = 0
    weight            = 100
  }
}
```

### 15. Graviton (ARM64) Across Services
```hcl
# EC2 Graviton
resource "aws_launch_template" "graviton" {
  name_prefix   = "graviton-"
  instance_type = "m7g.large"  # Graviton3 - 40% better price/performance
  image_id      = data.aws_ami.amazon_linux_arm64.id
}

# Lambda ARM64
resource "aws_lambda_function" "graviton_lambda" {
  function_name = "graviton-function"
  runtime       = "python3.11"
  handler       = "index.handler"
  architectures = ["arm64"]  # 20% cheaper, 20% faster
  memory_size   = 512
  role          = aws_iam_role.lambda.arn
  filename      = data.archive_file.func.output_path
}

# RDS Graviton
resource "aws_db_instance" "graviton_db" {
  identifier     = "graviton-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r8g.large"  # Graviton3 - up to 35% cheaper
  storage_type   = "gp3"

  allocated_storage = 100
  username          = "admin"
  password          = var.db_password
}

# ElastiCache Graviton
resource "aws_elasticache_replication_group" "graviton_cache" {
  replication_group_id = "graviton-cache"
  description          = "Graviton-based cache"
  node_type            = "cache.r8g.large"  # Graviton3
  num_cache_clusters   = 2
}
```

### 16. S3 Storage Class Analysis
```hcl
resource "aws_s3_bucket_analytics_configuration" "cost_analysis" {
  bucket = aws_s3_bucket.data.id
  name   = "EntireBucket"

  storage_class_analysis {
    data_export {
      destination {
        s3_bucket_destination {
          bucket_arn        = aws_s3_bucket.analytics.arn
          prefix            = "storage-class-analysis/"
          format            = "CSV"
        }
      }
      output_schema_version = "V_1"
    }
  }
}

# After 30+ days of analysis data, transition to:
resource "aws_s3_bucket_lifecycle_configuration" "data_driven" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "analysis-driven-tiering"
    status = "Enabled"

    filter {
      prefix = "infrequent-access-prefix/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}
```

### 17. Compute Savings Plans via Terraform
```hcl
resource "aws_ce_cost_category" "team_costs" {
  name         = "TeamCosts"
  rule_version = "CostCategoryExpression.v1"

  rule {
    value = "Platform"
    rule {
      tags {
        key    = "Team"
        values = ["platform", "infra", "devops"]
        match_options = ["EQUALS"]
      }
    }
  }

  rule {
    value = "Engineering"
    rule {
      tags {
        key    = "Team"
        values = ["backend", "frontend", "fullstack"]
        match_options = ["EQUALS"]
      }
    }
  }

  rule {
    value = "Data"
    rule {
      tags {
        key    = "Team"
        values = ["data", "ml", "analytics"]
        match_options = ["EQUALS"]
      }
    }
  }
}

resource "aws_budgets_budget" "team_budget" {
  for_each = {
    Platform    = "2000"
    Engineering = "5000"
    Data        = "3000"
  }

  name         = "${each.key}-monthly-budget"
  budget_type  = "COST"
  limit_amount = each.value
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Team$${lower(each.key)}"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["${lower(each.key)}-lead@example.com"]
  }
}
```

### 18. Aurora Serverless v2 for Variable Workloads
```hcl
resource "aws_rds_cluster" "serverless_v2" {
  cluster_identifier      = "serverless-v2-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "myapp"
  master_username         = "admin"
  master_password         = var.db_password
  storage_encrypted       = true
  backup_retention_period = 7
  skip_final_snapshot     = false
}

resource "aws_rds_cluster_instance" "serverless_v2" {
  identifier         = "serverless-v2-instance"
  cluster_identifier = aws_rds_cluster.serverless_v2.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.serverless_v2.engine
  engine_version     = aws_rds_cluster.serverless_v2.engine_version
}

resource "aws_rds_cluster" "serverless_v2_with_scaling" {
  cluster_identifier  = "serverless-v2-scaling"
  engine              = "aurora-postgresql"
  engine_version      = "15.4"
  master_username     = "admin"
  master_password     = var.db_password

  serverlessv2_scaling_configuration {
    min_capacity = 0.5  # 0.5 ACUs minimum (nearly free when idle)
    max_capacity = 64   # Scale up to 64 ACUs under load
  }
}
```

### 19. DynamoDB On-Demand vs Provisioned Auto-Scaling
```hcl
# Auto-scaling provisioned capacity
resource "aws_dynamodb_table" "autoscaled" {
  name         = "autoscaled-table"
  billing_mode = "PROVISIONED"
  hash_key     = "id"

  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "id"
    type = "S"
  }

  lifecycle {
    ignore_changes = [read_capacity, write_capacity]
  }
}

resource "aws_appautoscaling_target" "dynamodb_read" {
  max_capacity       = 1000
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.autoscaled.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_read" {
  name               = "dynamodb-read-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_read.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_read.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0
  }
}
```

### 20. CloudFront Cost Optimization
```hcl
resource "aws_cloudfront_distribution" "cost_optimized" {
  enabled         = true
  price_class     = "PriceClass_100"  # Only NA and Europe (cheapest)

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "S3Assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    target_origin_id       = "S3Assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Maximize cache hit ratio
    cache_policy_id = aws_cloudfront_cache_policy.aggressive.id

    # Minimize forwarded headers (reduces cache misses)
    origin_request_policy_id = aws_cloudfront_origin_request_policy.minimal.id
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}

resource "aws_cloudfront_cache_policy" "aggressive" {
  name        = "AggressiveCaching"
  min_ttl     = 3600
  default_ttl = 86400
  max_ttl     = 604800

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config    { cookie_behavior = "none" }
    headers_config    { header_behavior = "none" }
    query_strings_config { query_string_behavior = "none" }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}
```

### 21. Cost-Based Instance Rightsizing
```hcl
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  for_each = var.rightsizing_candidates

  alarm_name          = "low-cpu-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 14
  datapoints_to_alarm = 14
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 86400  # Daily
  statistic           = "Average"
  threshold           = 10

  dimensions = {
    InstanceId = each.value.instance_id
  }

  alarm_actions = [aws_sns_topic.rightsizing.arn]

  alarm_description = "Instance ${each.key} has <10% avg CPU for 14 days. Consider downsizing."
}
```

### 22. Spot Instance Interruption Handler
```hcl
resource "aws_cloudwatch_event_rule" "spot_interruption" {
  name        = "spot-interruption-warning"
  description = "EC2 Spot Instance interruption warning"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
  })
}

resource "aws_lambda_function" "spot_handler" {
  function_name = "spot-interruption-handler"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.spot_handler.arn
  filename      = data.archive_file.spot_handler.output_path
  timeout       = 120

  environment {
    variables = {
      ASG_NAME       = aws_autoscaling_group.mixed.name
      TARGET_GROUP_ARN = aws_lb_target_group.app.arn
      SNS_TOPIC_ARN  = aws_sns_topic.spot_alerts.arn
    }
  }
}

resource "aws_cloudwatch_event_target" "spot_lambda" {
  rule = aws_cloudwatch_event_rule.spot_interruption.name
  arn  = aws_lambda_function.spot_handler.arn
}
```

### 23. ElastiCache Reserved Node Purchase
```hcl
# Document recommended reserved node purchases
resource "aws_elasticache_reserved_cache_node" "reserved_1yr" {
  reserved_cache_nodes_offering_id = data.aws_elasticache_reserved_cache_node_offering.one_year.offering_id
  cache_node_count                  = 2
  id                                = "production-redis-1yr"
  tags = {
    Purpose = "cost-optimization"
    Savings = "40-percent"
  }
}

data "aws_elasticache_reserved_cache_node_offering" "one_year" {
  cache_node_type  = "cache.r6g.large"
  duration         = "31536000"  # 1 year
  offering_type    = "No Upfront"
  product_description = "redis"
}
```

### 24. Lambda Cost Optimization with SQS Batching
```hcl
resource "aws_sqs_queue" "batch_processor" {
  name                       = "batch-processor"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
}

resource "aws_lambda_event_source_mapping" "batch_trigger" {
  function_name    = aws_lambda_function.processor.arn
  event_source_arn = aws_sqs_queue.batch_processor.arn

  batch_size                         = 100    # Process 100 messages per invocation
  maximum_batching_window_in_seconds = 30     # Wait 30s to accumulate batch

  scaling_config {
    maximum_concurrency = 5  # Limit concurrency to control costs
  }
}

resource "aws_lambda_function" "processor" {
  function_name = "batch-message-processor"
  runtime       = "python3.11"
  handler       = "index.handler"
  architectures = ["arm64"]
  memory_size   = 256  # Right-sized for this workload
  timeout       = 300
  role          = aws_iam_role.lambda.arn
  filename      = data.archive_file.processor.output_path

  reserved_concurrent_executions = 10  # Hard cap for cost control
}
```

### 25. Unused Resource Cleanup Automation
```hcl
resource "aws_lambda_function" "cleanup_unused" {
  function_name = "cleanup-unused-resources"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.cleanup.arn
  filename      = data.archive_file.cleanup.output_path
  timeout       = 300

  environment {
    variables = {
      DRY_RUN               = "false"
      SNS_TOPIC_ARN         = aws_sns_topic.cleanup_reports.arn
      DAYS_UNUSED_THRESHOLD = "30"
      REGIONS               = "us-east-1,us-west-2"
      
      # What to clean
      CLEAN_UNATTACHED_EBS    = "true"
      CLEAN_OLD_SNAPSHOTS     = "true"
      CLEAN_UNUSED_EIPS       = "true"
      CLEAN_STOPPED_INSTANCES = "false"  # Don't auto-delete stopped instances
      CLEAN_OLD_AMIS          = "true"
      CLEAN_EMPTY_LOAD_BALANCERS = "true"
    }
  }
}

resource "aws_cloudwatch_event_rule" "weekly_cleanup" {
  name                = "weekly-unused-resource-cleanup"
  schedule_expression = "cron(0 3 ? * SUN *)"
}

resource "aws_cloudwatch_event_target" "cleanup" {
  rule = aws_cloudwatch_event_rule.weekly_cleanup.name
  arn  = aws_lambda_function.cleanup_unused.arn
}
```

## Nested

### 26. Environment-Based Cost Controls
```hcl
variable "environment_profiles" {
  type = map(object({
    instance_type        = string
    use_spot             = bool
    spot_percentage      = number
    min_capacity         = number
    max_capacity         = number
    rds_instance_class   = string
    rds_multi_az         = bool
    cache_node_type      = string
    cache_node_count     = number
    nat_gateways         = number
    cloudwatch_retention = number
    backup_retention     = number
  }))

  default = {
    development = {
      instance_type        = "t3.medium"
      use_spot             = true
      spot_percentage      = 100
      min_capacity         = 0
      max_capacity         = 5
      rds_instance_class   = "db.t3.medium"
      rds_multi_az         = false
      cache_node_type      = "cache.t3.micro"
      cache_node_count     = 1
      nat_gateways         = 1
      cloudwatch_retention = 3
      backup_retention     = 1
    }
    staging = {
      instance_type        = "m5.large"
      use_spot             = true
      spot_percentage      = 80
      min_capacity         = 1
      max_capacity         = 10
      rds_instance_class   = "db.r6g.large"
      rds_multi_az         = false
      cache_node_type      = "cache.r6g.large"
      cache_node_count     = 1
      nat_gateways         = 1
      cloudwatch_retention = 7
      backup_retention     = 3
    }
    production = {
      instance_type        = "m6i.xlarge"
      use_spot             = true
      spot_percentage      = 60
      min_capacity         = 3
      max_capacity         = 50
      rds_instance_class   = "db.r6g.2xlarge"
      rds_multi_az         = true
      cache_node_type      = "cache.r6g.large"
      cache_node_count     = 3
      nat_gateways         = 3
      cloudwatch_retention = 30
      backup_retention     = 7
    }
  }
}

locals {
  profile = var.environment_profiles[var.environment]
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.environment}-app-asg"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = local.profile.min_capacity
  max_size            = local.profile.max_capacity
  desired_capacity    = local.profile.min_capacity

  mixed_instances_policy {
    instances_distribution {
      on_demand_percentage_above_base_capacity = local.profile.use_spot ? (100 - local.profile.spot_percentage) : 100
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }

      override {
        instance_type = local.profile.instance_type
      }
    }
  }
}
```

### 27. Cost Anomaly Detection
```hcl
resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "aws-service-anomaly-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_monitor" "custom_monitor" {
  name         = "cost-category-monitor"
  monitor_type = "CUSTOM"

  monitor_specification = jsonencode({
    And = null
    CostCategories = {
      Key    = "Team"
      Values = ["Platform", "Engineering", "Data"]
      MatchOptions = ["EQUALS"]
    }
    Dimensions = null
    Not        = null
    Or         = null
    Tags       = null
  })
}

resource "aws_ce_anomaly_subscription" "alerts" {
  name      = "cost-anomaly-subscription"
  frequency = "DAILY"

  monitor_arn_list = [
    aws_ce_anomaly_monitor.service_monitor.arn,
    aws_ce_anomaly_monitor.custom_monitor.arn,
  ]

  subscriber {
    type    = "SNS"
    address = aws_sns_topic.cost_alerts.arn
  }

  threshold_expression {
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = ["100"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_PERCENTAGE"
        values        = ["20"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }
}
```

### 28. Data Transfer Optimization with PrivateLink
```hcl
# Interface VPC endpoints to eliminate data transfer costs
locals {
  interface_endpoints = {
    "ecr.api"          = "com.amazonaws.${var.region}.ecr.api"
    "ecr.dkr"          = "com.amazonaws.${var.region}.ecr.dkr"
    "ecs"              = "com.amazonaws.${var.region}.ecs"
    "ecs-agent"        = "com.amazonaws.${var.region}.ecs-agent"
    "ecs-telemetry"    = "com.amazonaws.${var.region}.ecs-telemetry"
    "ssm"              = "com.amazonaws.${var.region}.ssm"
    "ssmmessages"      = "com.amazonaws.${var.region}.ssmmessages"
    "logs"             = "com.amazonaws.${var.region}.logs"
    "monitoring"       = "com.amazonaws.${var.region}.monitoring"
    "secretsmanager"   = "com.amazonaws.${var.region}.secretsmanager"
    "kms"              = "com.amazonaws.${var.region}.kms"
    "sqs"              = "com.amazonaws.${var.region}.sqs"
  }
}

resource "aws_vpc_endpoint" "interface_endpoints" {
  for_each = local.interface_endpoints

  vpc_id              = aws_vpc.main.id
  service_name        = each.value
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [aws_security_group.vpc_endpoints.id]

  tags = {
    Name    = each.key
    Purpose = "cost-optimization-private-link"
  }
}
```

### 29. Multi-Account Cost Allocation
```hcl
locals {
  cost_allocation_rules = {
    shared_services_split = {
      source_account = "111111111111"
      split_by       = "PROPORTIONAL"
      targets = {
        "222222222222" = 40  # 40% to dev
        "333333333333" = 30  # 30% to staging
        "444444444444" = 30  # 30% to production
      }
    }
  }
}

resource "aws_ce_cost_allocation_tag" "cost_center" {
  tag_key = "CostCenter"
  status  = "Active"
}

resource "aws_budgets_budget" "per_account" {
  for_each = {
    "dev"        = { account = "222222222222", limit = "1000" }
    "staging"    = { account = "333333333333", limit = "2000" }
    "production" = { account = "444444444444", limit = "10000" }
  }

  name         = "${each.key}-account-budget"
  budget_type  = "COST"
  limit_amount = each.value.limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "LinkedAccount"
    values = [each.value.account]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }
}
```

### 30. Intelligent Cost Reporting Lambda
```hcl
resource "aws_lambda_function" "cost_reporter" {
  function_name = "weekly-cost-reporter"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.cost_reporter.arn
  filename      = data.archive_file.cost_reporter.output_path
  timeout       = 300

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.cost_slack_webhook
      SES_SENDER        = "costs@example.com"
      SES_RECIPIENTS    = jsonencode(["cto@example.com", "devops@example.com"])

      # Cost Explorer filters
      FILTER_LINKED_ACCOUNTS = jsonencode(var.account_ids)
      COMPARE_PERIODS        = "true"

      # Thresholds for alerting
      INCREASE_THRESHOLD_PCT = "15"
      INCREASE_THRESHOLD_USD = "500"

      # Services to highlight
      TOP_SERVICES_COUNT = "10"

      # Charts
      GENERATE_CHARTS = "true"
      CHART_BUCKET    = aws_s3_bucket.cost_reports.bucket
    }
  }
}

resource "aws_cloudwatch_event_rule" "weekly_cost_report" {
  name                = "weekly-cost-report"
  schedule_expression = "cron(0 9 ? * MON *)"
}

resource "aws_cloudwatch_event_target" "cost_report_lambda" {
  rule = aws_cloudwatch_event_rule.weekly_cost_report.name
  arn  = aws_lambda_function.cost_reporter.arn
}
```

### 31. EC2 Instance Scheduler
```hcl
resource "aws_lambda_function" "instance_scheduler" {
  function_name = "ec2-instance-scheduler"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.scheduler.arn
  filename      = data.archive_file.scheduler.output_path
  timeout       = 300

  environment {
    variables = {
      SCHEDULE_TAG_KEY   = "ScheduleType"
      TIMEZONE           = "America/New_York"
      STATE_TABLE        = aws_dynamodb_table.scheduler_state.name
    }
  }
}

resource "aws_dynamodb_table" "scheduler_state" {
  name         = "instance-scheduler-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "instance_id"

  attribute {
    name = "instance_id"
    type = "S"
  }
}

# Schedule types via EC2 tags:
# ScheduleType=BusinessHours  → runs 8am-6pm Mon-Fri
# ScheduleType=ExtendedHours  → runs 7am-10pm Mon-Sat
# ScheduleType=Always         → never stopped
# ScheduleType=Weekend        → only runs Sat-Sun

resource "aws_cloudwatch_event_rule" "every_hour" {
  name                = "instance-scheduler-hourly"
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "scheduler" {
  rule = aws_cloudwatch_event_rule.every_hour.name
  arn  = aws_lambda_function.instance_scheduler.arn
}
```

### 32. S3 Cost Attribution Tags
```hcl
resource "aws_s3_bucket" "cost_attributed" {
  bucket = "enterprise-data-lake"

  tags = {
    CostCenter  = "CC001"
    Team        = "data-platform"
    Application = "data-lake"
    Environment = "production"
  }
}

resource "aws_s3_storage_lens" "org_view" {
  config_id = "org-cost-lens"

  storage_lens_configuration {
    enabled = true

    account_level {
      bucket_level {
        activity_metrics {
          enabled = true
        }
        cost_optimization_metrics {
          enabled = true
        }
        detailed_status_codes_metrics {
          enabled = true
        }
      }
    }

    data_export {
      s3_bucket_destination {
        account_id   = data.aws_caller_identity.current.account_id
        arn          = aws_s3_bucket.lens_reports.arn
        format       = "Parquet"
        output_schema_version = "V_1"
        prefix       = "storage-lens/"
      }
    }
  }
}
```

## Advanced

### 33. FinOps Platform with Full Cost Governance
```hcl
module "finops_platform" {
  source = "./modules/finops"

  organization = "enterprise"

  # Cost allocation
  cost_categories = {
    Team = {
      values = {
        Platform    = ["platform", "infra", "sre"]
        Engineering = ["backend", "frontend", "mobile"]
        Data        = ["data", "ml", "analytics"]
      }
    }
    Product = {
      values = {
        CorePlatform = ["vpc", "eks", "databases"]
        ECommerce    = ["shop", "cart", "checkout"]
        Analytics    = ["datalake", "bi", "reporting"]
      }
    }
  }

  # Budgets
  budgets = {
    total_monthly = {
      limit      = 100000
      alert_80pct = true
      alert_100pct = true
      alert_forecasted = true
    }
    per_team = {
      Platform    = 20000
      Engineering = 50000
      Data        = 30000
    }
  }

  # Anomaly detection
  anomaly_detection = {
    enabled             = true
    daily_frequency     = true
    threshold_amount    = 500
    threshold_percent   = 20
    notify_sns_arn      = aws_sns_topic.cost_alerts.arn
  }

  # Savings recommendations
  savings_plans = {
    auto_purchase    = false  # Require human approval
    term_years       = 1
    payment_option   = "NoUpfront"
    recommendation_lookback_period = 60
  }

  # Cost visibility
  reporting = {
    weekly_report_enabled   = true
    monthly_report_enabled  = true
    slack_webhook           = var.cost_slack_webhook
    email_recipients        = ["cto@enterprise.com", "finops@enterprise.com"]
    s3_report_bucket        = aws_s3_bucket.cost_reports.bucket
  }

  # Governance
  enforcement = {
    require_cost_tags     = true
    required_tags         = ["CostCenter", "Team", "Application", "Environment"]
    block_on_missing_tags = false  # Alert, don't block
    alert_on_missing_tags = true
  }
}
```

### 34. Automated Rightsizing with Systems Manager
```hcl
resource "aws_ssm_document" "rightsize_ec2" {
  name            = "EC2-Rightsizing-Automation"
  document_type   = "Automation"
  document_format = "YAML"

  content = yamlencode({
    schemaVersion = "0.3"
    description   = "Automate EC2 rightsizing based on CloudWatch metrics"
    parameters = {
      InstanceId = {
        type    = "String"
        description = "EC2 Instance ID to rightsize"
      }
      TargetInstanceType = {
        type    = "String"
        description = "Target instance type"
      }
    }
    mainSteps = [
      {
        name   = "CreateSnapshot"
        action = "aws:executeAwsApi"
        inputs = {
          Service = "ec2"
          Api     = "CreateImage"
          InstanceId = "{{ InstanceId }}"
          Name    = "rightsizing-backup-{{ InstanceId }}"
          NoReboot = false
        }
        outputs = [{
          Name     = "ImageId"
          Selector = "$.ImageId"
          Type     = "String"
        }]
      },
      {
        name   = "StopInstance"
        action = "aws:executeAwsApi"
        inputs = {
          Service    = "ec2"
          Api        = "StopInstances"
          InstanceIds = ["{{ InstanceId }}"]
        }
      },
      {
        name   = "WaitForStop"
        action = "aws:waitForAwsResourceProperty"
        inputs = {
          Service      = "ec2"
          Api          = "DescribeInstances"
          InstanceIds  = ["{{ InstanceId }}"]
          PropertySelector = "$.Reservations[0].Instances[0].State.Name"
          DesiredValues    = ["stopped"]
        }
      },
      {
        name   = "ChangeInstanceType"
        action = "aws:executeAwsApi"
        inputs = {
          Service      = "ec2"
          Api          = "ModifyInstanceAttribute"
          InstanceId   = "{{ InstanceId }}"
          InstanceType = { Value = "{{ TargetInstanceType }}" }
        }
      },
      {
        name   = "StartInstance"
        action = "aws:executeAwsApi"
        inputs = {
          Service     = "ec2"
          Api         = "StartInstances"
          InstanceIds = ["{{ InstanceId }}"]
        }
      }
    ]
  })
}

resource "aws_lambda_function" "rightsizing_recommender" {
  function_name = "ec2-rightsizing-recommender"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.recommender.arn
  filename      = data.archive_file.recommender.output_path
  timeout       = 300

  environment {
    variables = {
      SSM_DOCUMENT       = aws_ssm_document.rightsize_ec2.name
      LOW_CPU_THRESHOLD  = "10"
      HIGH_CPU_THRESHOLD = "80"
      LOOKBACK_DAYS      = "14"
      AUTO_APPLY_SAFE    = "true"   # Auto-apply downsizes
      AUTO_APPLY_RISKY   = "false"  # Require approval for upsizes
      SNS_TOPIC_ARN      = aws_sns_topic.rightsizing.arn
    }
  }
}
```

### 35. Spot Fleet with Intelligent Diversification
```hcl
locals {
  spot_instance_families = {
    # Price-performance optimized selection
    "us-east-1" = [
      { type = "m5.large",    weight = 1 },
      { type = "m5a.large",   weight = 1 },
      { type = "m5n.large",   weight = 1 },
      { type = "m6i.large",   weight = 1 },
      { type = "m6a.large",   weight = 1 },
      { type = "m7i.large",   weight = 1 },
      { type = "c5.xlarge",   weight = 2 },
      { type = "c5a.xlarge",  weight = 2 },
      { type = "c6i.xlarge",  weight = 2 },
      { type = "r5.large",    weight = 1 },
      { type = "r6i.large",   weight = 1 },
    ]
  }
}

resource "aws_spot_fleet_request" "diversified" {
  iam_fleet_role      = aws_iam_role.spot_fleet.arn
  target_capacity     = 100
  allocation_strategy = "capacityOptimized"
  fleet_type          = "maintain"

  dynamic "launch_specification" {
    for_each = local.spot_instance_families["us-east-1"]
    content {
      instance_type            = launch_specification.value.type
      ami                      = data.aws_ami.amazon_linux.id
      vpc_security_group_ids   = [aws_security_group.workers.id]
      iam_instance_profile_name = aws_iam_instance_profile.workers.name
      weighted_capacity        = launch_specification.value.weight

      dynamic "subnet_id" {
        for_each = var.private_subnet_ids
        content {
          subnet_id = subnet_id.value
        }
      }
    }
  }
}
```

### 36. Cost-Optimized EKS Node Groups
```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "cost-optimized"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    # System node group - on-demand Graviton
    system = {
      instance_types  = ["m7g.large", "m6g.large"]
      capacity_type   = "ON_DEMAND"
      min_size        = 2
      max_size        = 5
      desired_size    = 2
      ami_type        = "AL2_ARM_64"

      labels = {
        dedicated = "system"
      }

      taints = [{
        key    = "dedicated"
        value  = "system"
        effect = "NO_SCHEDULE"
      }]
    }

    # Application node group - mixed with Spot
    application = {
      instance_types  = [
        "m7g.xlarge", "m7g.2xlarge",
        "m6g.xlarge", "m6g.2xlarge",
        "m6i.xlarge", "m6i.2xlarge",
        "m5.xlarge",  "m5.2xlarge",
      ]
      capacity_type   = "SPOT"
      min_size        = 2
      max_size        = 50
      desired_size    = 5

      labels = {
        workload-type = "application"
      }
    }

    # GPU node group - on-demand
    gpu = {
      instance_types = ["g4dn.xlarge", "g5.xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size       = 0
      max_size       = 10
      desired_size   = 0
      ami_type       = "AL2_x86_64_GPU"

      labels = {
        dedicated = "gpu"
      }

      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}
```

### 37. Serverless Cost Optimization
```hcl
# Lambda with provisioned concurrency only during peak hours
resource "aws_lambda_provisioned_concurrency_config" "peak_hours" {
  count = var.provisioned_concurrency_enabled ? 1 : 0

  function_name                  = aws_lambda_function.api.function_name
  qualifier                      = aws_lambda_alias.live.name
  provisioned_concurrent_executions = 10
}

resource "aws_lambda_function_event_invoke_config" "api" {
  function_name = aws_lambda_function.api.function_name
  qualifier     = aws_lambda_alias.live.name

  maximum_event_age_in_seconds = 300
  maximum_retry_attempts       = 1
}

# Application Auto Scaling for Lambda provisioned concurrency
resource "aws_appautoscaling_target" "lambda" {
  max_capacity       = 100
  min_capacity       = 1
  resource_id        = "function:${aws_lambda_function.api.function_name}:${aws_lambda_alias.live.name}"
  scalable_dimension = "lambda:function:ProvisionedConcurrency"
  service_namespace  = "lambda"
}

resource "aws_appautoscaling_policy" "lambda_pc" {
  name               = "lambda-provisioned-concurrency"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.lambda.resource_id
  scalable_dimension = aws_appautoscaling_target.lambda.scalable_dimension
  service_namespace  = aws_appautoscaling_target.lambda.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 0.7  # Scale when 70% of PC is used

    predefined_metric_specification {
      predefined_metric_type = "LambdaProvisionedConcurrencyUtilization"
    }
  }
}

# Scale down provisioned concurrency overnight
resource "aws_appautoscaling_scheduled_action" "pc_scale_down" {
  name               = "pc-scale-down-night"
  service_namespace  = aws_appautoscaling_target.lambda.service_namespace
  resource_id        = aws_appautoscaling_target.lambda.resource_id
  scalable_dimension = aws_appautoscaling_target.lambda.scalable_dimension
  schedule           = "cron(0 22 * * ? *)"

  scalable_target_action {
    min_capacity = 0
    max_capacity = 0
  }
}

resource "aws_appautoscaling_scheduled_action" "pc_scale_up" {
  name               = "pc-scale-up-morning"
  service_namespace  = aws_appautoscaling_target.lambda.service_namespace
  resource_id        = aws_appautoscaling_target.lambda.resource_id
  scalable_dimension = aws_appautoscaling_target.lambda.scalable_dimension
  schedule           = "cron(0 7 * * MON-FRI *)"

  scalable_target_action {
    min_capacity = 5
    max_capacity = 100
  }
}
```

### 38. Cost Governance with AWS Config Rules
```hcl
locals {
  cost_config_rules = {
    "require-tags" = {
      source_identifier = "REQUIRED_TAGS"
      input_parameters = jsonencode({
        tag1Key   = "Environment"
        tag2Key   = "CostCenter"
        tag3Key   = "Team"
        tag4Key   = "Application"
      })
    }
    "no-unrestricted-ssh" = {
      source_identifier = "RESTRICTED_INCOMING_TRAFFIC"
      input_parameters = jsonencode({
        blockedPort1 = "22"
      })
    }
    "ebs-gp3" = {
      source_identifier = "EC2_EBS_VOLUME_TYPE_GP3_CHECK"
      input_parameters  = null
    }
    "s3-lifecycle-policy" = {
      source_identifier = "S3_LIFECYCLE_POLICY_CHECK"
      input_parameters  = null
    }
  }
}

resource "aws_config_config_rule" "cost_rules" {
  for_each = local.cost_config_rules

  name = each.key

  source {
    owner             = "AWS"
    source_identifier = each.value.source_identifier
  }

  dynamic "input_parameters" {
    for_each = each.value.input_parameters != null ? [1] : []
    content {
      input_parameters = each.value.input_parameters
    }
  }
}

resource "aws_config_remediation_configuration" "add_tags" {
  config_rule_name = aws_config_config_rule.cost_rules["require-tags"].name
  target_type      = "SSM_DOCUMENT"
  target_id        = "AWS-AddTagsToResources"
  automatic        = false

  parameter {
    name         = "tags"
    static_value = jsonencode({ Environment = "untagged", CostCenter = "unknown" })
  }
}
```

### 39. CloudWatch Contributor Insights for Cost
```hcl
resource "aws_cloudwatch_contributor_insights_rule" "api_top_callers" {
  rule_name    = "api-top-callers-by-cost"
  rule_state   = "ENABLED"
  rule_definition = jsonencode({
    Schema = {
      Name    = "CloudWatchLogRule"
      Version = 1
    }
    AggregateOn = "Count"
    Contribution = {
      Filters = [
        {
          Match    = "$.status"
          StartsWith = ["5"]
        }
      ]
      Keys = ["$.userId", "$.endpoint"]
    }
    LogFormat = "JSON"
    LogGroupNames = [
      "/aws/apigateway/production-api",
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "expensive_endpoint" {
  alarm_name          = "high-cost-endpoint-traffic"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UniqueContributors"
  namespace           = "CloudWatchLogs"
  period              = 300
  statistic           = "Average"
  threshold           = 1000

  dimensions = {
    RuleName = aws_cloudwatch_contributor_insights_rule.api_top_callers.rule_name
  }

  alarm_actions = [aws_sns_topic.cost_alerts.arn]
}
```

### 40. Complete FinOps Automation Platform
```hcl
module "finops_automation" {
  source = "./modules/finops-automation"

  organization     = "enterprise"
  management_account = var.management_account_id
  linked_accounts    = var.linked_account_ids

  # Tagging enforcement
  tagging = {
    required_tags      = ["CostCenter", "Team", "Application", "Environment"]
    auto_tag_new_resources = true
    tag_policies_enabled   = true
    compliance_report_schedule = "cron(0 8 * * MON *)"
  }

  # Budgets and alerts
  budgets = {
    organizational_total = {
      monthly_limit = 200000
      alert_thresholds = [70, 85, 100]
    }
    per_account = {
      production = 100000
      staging    = 20000
      dev        = 10000
    }
    per_service = {
      EC2       = 40000
      RDS       = 30000
      EKS       = 20000
      DataTrans = 10000
    }
  }

  # Anomaly detection
  anomaly_detection = {
    enabled           = true
    threshold_usd     = 500
    threshold_pct     = 15
    notification_arn  = aws_sns_topic.finops_alerts.arn
  }

  # Automation
  automation = {
    stop_dev_instances_nights  = true
    stop_dev_rds_nights        = true
    delete_unattached_volumes  = true
    delete_old_snapshots_days  = 30
    convert_gp2_to_gp3         = true
    enable_intelligent_tiering = true
  }

  # Reporting
  reporting = {
    weekly_cost_report      = true
    monthly_savings_report  = true
    quarterly_review        = true
    slack_webhook           = var.finops_slack_webhook
    email_recipients        = ["cto@enterprise.com", "finops@enterprise.com"]
    athena_workgroup        = "finops"
    quicksight_dashboard    = true
  }

  # Savings
  savings = {
    compute_savings_plan_term   = "ONE_YEAR"
    compute_savings_plan_type   = "NO_UPFRONT"
    recommend_reserved_instances = true
    recommend_savings_plans      = true
    auto_purchase_threshold_usd  = 0  # Never auto-purchase, require approval
  }
}
```

### 41. Real-Time Cost Dashboard with Kinesis
```hcl
resource "aws_kinesis_firehose_delivery_stream" "cost_events" {
  name        = "aws-cost-events"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = aws_s3_bucket.cost_data.arn
    prefix     = "cost-events/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffering_size     = 128
    buffering_interval = 300

    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }
      output_format_configuration {
        serializer {
          parquet_ser_de {
            compression = "SNAPPY"
          }
        }
      }
      schema_configuration {
        database_name = aws_glue_catalog_database.cost.name
        table_name    = aws_glue_catalog_table.cost_events.name
        role_arn      = aws_iam_role.firehose.arn
      }
    }
  }
}

resource "aws_glue_catalog_database" "cost" {
  name = "aws_cost_intelligence"
}

resource "aws_glue_catalog_table" "cost_events" {
  name          = "cost_events"
  database_name = aws_glue_catalog_database.cost.name

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.cost_data.bucket}/cost-events/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "timestamp"
      type = "timestamp"
    }
    columns {
      name = "service"
      type = "string"
    }
    columns {
      name = "amount_usd"
      type = "double"
    }
    columns {
      name = "tags"
      type = "map<string,string>"
    }
  }

  partition_keys {
    name = "year"
    type = "string"
  }
  partition_keys {
    name = "month"
    type = "string"
  }
}

resource "aws_athena_workgroup" "finops" {
  name = "finops"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.cost_data.bucket}/athena-results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.cost.arn
      }
    }

    bytes_scanned_cutoff_per_query = 1073741824  # 1 GB max scan per query
  }
}
```

### 42. Multi-Region Cost Optimization
```hcl
locals {
  regional_cost_config = {
    "us-east-1" = {
      preferred  = true
      percentage = 60
      reason     = "Lowest EC2 pricing, most services available"
    }
    "us-west-2" = {
      preferred  = false
      percentage = 30
      reason     = "DR and west coast users"
    }
    "eu-west-1" = {
      preferred  = false
      percentage = 10
      reason     = "EU compliance, GDPR"
    }
  }
}

# Enforce regional budget allocation
resource "aws_budgets_budget" "regional" {
  for_each = local.regional_cost_config

  name         = "regional-budget-${each.key}"
  budget_type  = "COST"
  limit_amount = tostring(var.total_monthly_budget * each.value.percentage / 100)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Region"
    values = [each.key]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }
}
```

### 43. GPU Cost Optimization with SageMaker
```hcl
resource "aws_sagemaker_endpoint_configuration" "cost_optimized" {
  name = "cost-optimized-inference"

  production_variants {
    variant_name           = "primary"
    model_name             = aws_sagemaker_model.inference.name
    initial_instance_count = 1
    instance_type          = "ml.g4dn.xlarge"  # Cheapest GPU instance
    initial_variant_weight = 1
  }

  async_inference_config {
    client_config {
      max_concurrent_invocations_per_instance = 4
    }

    output_config {
      s3_output_path = "s3://${aws_s3_bucket.inference_output.bucket}/outputs/"
    }
  }
}

resource "aws_appautoscaling_target" "sagemaker" {
  max_capacity       = 5
  min_capacity       = 0  # Scale to zero when not in use
  resource_id        = "endpoint/${aws_sagemaker_endpoint.inference.name}/variant/primary"
  scalable_dimension = "sagemaker:variant:DesiredInstanceCount"
  service_namespace  = "sagemaker"
}

resource "aws_appautoscaling_policy" "sagemaker" {
  name               = "sagemaker-target-tracking"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.sagemaker.resource_id
  scalable_dimension = aws_appautoscaling_target.sagemaker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.sagemaker.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0

    predefined_metric_specification {
      predefined_metric_type = "SageMakerVariantInvocationsPerInstance"
    }

    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

### 44. Storage Optimization Across Services
```hcl
module "storage_optimizer" {
  source = "./modules/storage-optimizer"

  # S3
  s3_buckets = {
    data_lake = {
      bucket = aws_s3_bucket.data_lake.id
      optimize = {
        enable_intelligent_tiering = true
        lifecycle_30d_ia           = true
        lifecycle_90d_glacier      = true
        lifecycle_365d_deep_archive = false
        delete_incomplete_multiparts = true
        incomplete_multipart_days  = 7
      }
    }
    logs = {
      bucket = aws_s3_bucket.logs.id
      optimize = {
        lifecycle_30d_ia            = true
        lifecycle_90d_glacier       = true
        lifecycle_2555d_expire      = true  # 7 year compliance retention
      }
    }
    artifacts = {
      bucket = aws_s3_bucket.artifacts.id
      optimize = {
        expire_noncurrent_days = 30
        expire_old_versions    = 5
      }
    }
  }

  # EBS
  ebs_optimization = {
    convert_gp2_to_gp3    = true
    delete_unattached      = true
    snapshot_retention     = 7
    cross_region_snapshots = false
  }

  # EFS
  efs_optimization = {
    enable_ia_transition  = true
    ia_transition_days    = 30
    enable_archive        = true
    archive_transition_days = 90
  }

  # Database storage
  rds_optimization = {
    enable_storage_autoscaling = true
    max_storage_gb             = 500
    enable_performance_insights = true
    performance_insights_retention = 7  # Free tier (7 days)
  }
}
```

### 45. Cost-Optimized Data Pipeline
```hcl
module "cost_optimized_pipeline" {
  source = "./modules/data-pipeline"

  pipeline_name = "etl-pipeline"

  # Use Glue instead of EMR for small/medium workloads (cheaper)
  compute_engine = "glue"

  glue_config = {
    glue_version          = "4.0"
    worker_type           = "G.1X"  # 4 DPU - cheapest
    number_of_workers     = 5
    max_concurrent_runs   = 3
    timeout_minutes       = 60

    # Use Spot-backed workers
    execution_class       = "FLEX"  # Up to 34% cheaper
  }

  # S3 for intermediate storage (vs EFS/HDFS)
  intermediate_storage = {
    type   = "s3"
    bucket = aws_s3_bucket.pipeline_temp.id
    lifecycle_expire_days = 1  # Auto-delete temp data after 1 day
  }

  # Schedule during off-peak hours for spot availability
  schedule = "cron(0 2 * * ? *)"  # 2 AM UTC

  # Output to intelligent-tiered S3
  output = {
    bucket        = aws_s3_bucket.data_lake.id
    storage_class = "INTELLIGENT_TIERING"
  }
}
```

### 46. Kubernetes Cost Optimization with Karpenter
```hcl
resource "kubectl_manifest" "karpenter_node_pool" {
  yaml_body = yamlencode({
    apiVersion = "karpenter.sh/v1beta1"
    kind       = "NodePool"
    metadata = {
      name = "cost-optimized"
    }
    spec = {
      template = {
        spec = {
          requirements = [
            {
              key      = "karpenter.sh/capacity-type"
              operator = "In"
              values   = ["spot", "on-demand"]
            },
            {
              key      = "kubernetes.io/arch"
              operator = "In"
              values   = ["arm64", "amd64"]
            },
            {
              key      = "karpenter.k8s.aws/instance-family"
              operator = "In"
              values   = ["m5", "m5a", "m6i", "m6a", "m7i", "m7g"]
            },
          ]
          nodeClassRef = {
            apiVersion = "karpenter.k8s.aws/v1beta1"
            kind       = "EC2NodeClass"
            name       = "default"
          }
        }
      }
      limits = {
        cpu    = "1000"
        memory = "2000Gi"
      }
      disruption = {
        consolidationPolicy = "WhenUnderutilized"
        consolidateAfter    = "30s"
        expireAfter         = "720h"  # 30 days
      }
    }
  })
}
```

### 47. Data Egress Cost Reduction
```hcl
# S3 Transfer Acceleration (cheaper for frequent cross-region)
resource "aws_s3_bucket_accelerate_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  status = "Enabled"
}

# CloudFront for static assets (eliminates origin egress)
resource "aws_cloudfront_distribution" "assets" {
  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "S3Assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    target_origin_id       = "S3Assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  price_class = "PriceClass_100"
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
  enabled = true
}

# VPC Endpoints to eliminate NAT + data transfer costs
resource "aws_vpc_endpoint" "all_interface_endpoints" {
  for_each = toset([
    "com.amazonaws.${var.region}.s3",
    "com.amazonaws.${var.region}.dynamodb",
    "com.amazonaws.${var.region}.ecr.api",
    "com.amazonaws.${var.region}.ecr.dkr",
    "com.amazonaws.${var.region}.logs",
    "com.amazonaws.${var.region}.monitoring",
    "com.amazonaws.${var.region}.sqs",
    "com.amazonaws.${var.region}.sns",
    "com.amazonaws.${var.region}.kms",
    "com.amazonaws.${var.region}.secretsmanager",
  ])

  vpc_id              = aws_vpc.main.id
  service_name        = each.value
  vpc_endpoint_type   = strcontains(each.value, ".s3") || strcontains(each.value, ".dynamodb") ? "Gateway" : "Interface"
  private_dns_enabled = strcontains(each.value, ".s3") || strcontains(each.value, ".dynamodb") ? false : true
  subnet_ids          = strcontains(each.value, ".s3") || strcontains(each.value, ".dynamodb") ? null : var.private_subnet_ids
  route_table_ids     = strcontains(each.value, ".s3") || strcontains(each.value, ".dynamodb") ? aws_route_table.private[*].id : null
  security_group_ids  = strcontains(each.value, ".s3") || strcontains(each.value, ".dynamodb") ? null : [aws_security_group.vpc_endpoints.id]
}
```

### 48. Predictive Scaling for Cost Efficiency
```hcl
resource "aws_autoscaling_policy" "predictive" {
  name                   = "predictive-scaling-policy"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "PredictiveScaling"

  predictive_scaling_configuration {
    metric_specification {
      target_value = 50

      predefined_metric_pair_specification {
        predefined_metric_type = "ASGCPUUtilization"
      }
    }

    mode                          = "ForecastAndScale"
    scheduling_buffer_time        = 300  # 5 minutes ahead
    max_capacity_breach_behavior  = "HonorMaxCapacity"
    max_capacity_buffer           = 10
  }
}

# Combined with target tracking for reactive scaling
resource "aws_autoscaling_policy" "target_tracking" {
  name                   = "target-tracking-policy"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    target_value = 60

    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
  }
}
```

### 49. FinOps Tagging Compliance Enforcement
```hcl
resource "aws_organizations_policy" "require_tags" {
  name        = "require-cost-tags"
  description = "Require cost allocation tags on all resources"
  type        = "TAG_POLICY"

  content = jsonencode({
    tags = {
      CostCenter = {
        tag_key = {
          "@@assign" = "CostCenter"
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "rds:db",
            "rds:cluster",
            "lambda:function",
            "s3:bucket",
            "ecs:service",
            "ecs:task-definition",
            "eks:cluster",
            "elasticache:cluster",
          ]
        }
      }
      Environment = {
        tag_key = {
          "@@assign" = "Environment"
        }
        tag_value = {
          "@@assign" = ["production", "staging", "development", "testing"]
        }
        enforced_for = {
          "@@assign" = ["ec2:instance", "rds:db", "rds:cluster"]
        }
      }
    }
  })
}

resource "aws_organizations_policy_attachment" "require_tags" {
  policy_id = aws_organizations_policy.require_tags.id
  target_id = var.organization_root_id
}
```

### 50. Complete Enterprise Cost Optimization Platform
```hcl
module "enterprise_cost_platform" {
  source = "./modules/enterprise-finops"

  organization = "enterprise"

  # Resource optimization
  compute = {
    ec2 = {
      use_graviton      = true
      spot_percentage   = 60
      rightsize_enabled = true
      schedule_non_prod = true
    }
    ecs = {
      fargate_spot_percentage = 80
      use_graviton            = true
    }
    eks = {
      use_karpenter     = true
      spot_enabled      = true
      graviton_enabled  = true
    }
    lambda = {
      use_arm64         = true
      power_tune_enabled = true
      reserved_concurrency_limit = 500
    }
  }

  storage = {
    s3 = {
      intelligent_tiering_all    = true
      lifecycle_ia_days          = 30
      lifecycle_glacier_days     = 90
      lifecycle_expire_days      = 2555
      storage_lens_enabled       = true
    }
    ebs = {
      convert_gp2_to_gp3        = true
      cleanup_unattached         = true
    }
    rds = {
      aurora_serverless_v2       = true  # For variable workloads
      graviton_instances         = true
      reserved_instances_1yr     = true
    }
  }

  networking = {
    vpc_endpoints_all            = true
    cloudfront_for_assets        = true
    nat_gateway_optimization     = true  # 1 per region for non-prod
  }

  governance = {
    budgets = {
      monthly_total = 500000
      alert_thresholds = [70, 85, 100]
    }
    anomaly_detection   = true
    tagging_enforcement = true
    cost_categories     = true
    weekly_reports      = true
    savings_recommendations = true
  }

  automation = {
    cleanup_orphaned_resources = true
    stop_non_prod_nights       = true
    intelligent_scaling        = true
    cost_anomaly_response      = true
  }

  reporting = {
    slack_webhook         = var.finops_slack_webhook
    email_list            = ["cto@enterprise.com", "finops@enterprise.com"]
    quicksight_enabled    = true
    athena_cid_enabled    = true  # Cloud Intelligence Dashboards
    savings_target_pct    = 30    # Target 30% savings vs unoptimized
  }
}
```
