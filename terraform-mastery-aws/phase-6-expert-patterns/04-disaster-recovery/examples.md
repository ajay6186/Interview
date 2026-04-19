# Examples 6.4 — Disaster Recovery (50 examples)

## Basic

### 1. S3 Cross-Region Replication
```hcl
resource "aws_s3_bucket" "primary" {
  bucket   = "my-app-data-primary"
  provider = aws.primary
}

resource "aws_s3_bucket_versioning" "primary" {
  bucket   = aws_s3_bucket.primary.id
  provider = aws.primary
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket" "replica" {
  bucket   = "my-app-data-replica"
  provider = aws.dr
}

resource "aws_s3_bucket_versioning" "replica" {
  bucket   = aws_s3_bucket.replica.id
  provider = aws.dr
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  bucket   = aws_s3_bucket.primary.id
  role     = aws_iam_role.replication.arn
  provider = aws.primary

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### 2. RDS Automated Backups
```hcl
resource "aws_db_instance" "primary" {
  identifier     = "myapp-production"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"

  backup_retention_period   = 7
  backup_window             = "02:00-04:00"
  maintenance_window        = "sun:05:00-sun:07:00"
  delete_automated_backups  = false
  skip_final_snapshot       = false
  final_snapshot_identifier = "myapp-production-final-${formatdate("YYYYMMDD", timestamp())}"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
}
```

### 3. RDS Read Replica in DR Region
```hcl
resource "aws_db_instance" "dr_replica" {
  provider = aws.dr

  identifier          = "myapp-dr"
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = "db.r6g.large"
  publicly_accessible = false

  backup_retention_period = 3
  skip_final_snapshot     = true

  tags = {
    Role = "disaster-recovery"
  }
}
```

### 4. ElastiCache Global Datastore
```hcl
resource "aws_elasticache_replication_group" "primary" {
  provider                   = aws.primary
  replication_group_id       = "myapp-cache-primary"
  description                = "Primary cache cluster"
  node_type                  = "cache.r6g.large"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true
  engine_version             = "7.0"
}

resource "aws_elasticache_global_replication_group" "global" {
  global_replication_group_id_suffix = "myapp-global-cache"
  primary_replication_group_id       = aws_elasticache_replication_group.primary.id
}

resource "aws_elasticache_replication_group" "secondary" {
  provider                      = aws.dr
  replication_group_id          = "myapp-cache-dr"
  description                   = "DR cache secondary"
  global_replication_group_id   = aws_elasticache_global_replication_group.global.id
  node_type                     = "cache.r6g.large"
  num_cache_clusters            = 1
  automatic_failover_enabled    = true
}
```

### 5. Route53 Health Check
```hcl
resource "aws_route53_health_check" "primary" {
  fqdn              = "api.primary.myapp.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = { Name = "primary-health-check" }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.public.zone_id
  name    = "api.myapp.com"
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.public.zone_id
  name    = "api.myapp.com"
  type    = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "secondary"

  alias {
    name                   = aws_lb.dr.dns_name
    zone_id                = aws_lb.dr.zone_id
    evaluate_target_health = true
  }
}
```

### 6. CloudWatch Alarm for Failover
```hcl
resource "aws_cloudwatch_metric_alarm" "primary_down" {
  alarm_name          = "primary-region-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  alarm_actions = [aws_sns_topic.dr_alerts.arn]
  ok_actions    = [aws_sns_topic.dr_alerts.arn]
}
```

### 7. AWS Backup Plan
```hcl
resource "aws_backup_vault" "main" {
  name        = "myapp-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn
}

resource "aws_backup_plan" "daily" {
  name = "myapp-daily-backup"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 1 * * ? *)"

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn

      lifecycle {
        delete_after = 365
      }
    }
  }
}

resource "aws_backup_selection" "app_resources" {
  name         = "myapp-resources"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "true"
  }
}
```

### 8. EBS Snapshot Lifecycle
```hcl
resource "aws_dlm_lifecycle_policy" "ebs_snapshots" {
  description        = "EBS snapshot lifecycle for DR"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]

    schedule {
      name = "daily-snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["01:00"]
      }

      retain_rule {
        count = 7
      }

      copy_tags = true

      cross_region_copy_rule {
        target    = "us-west-2"
        encrypted = true
        retain_rule {
          interval      = 30
          interval_unit = "DAYS"
        }
      }
    }

    target_tags = {
      Backup = "true"
    }
  }
}
```

### 9. Multi-Region KMS Key
```hcl
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "Multi-region primary key"
  multi_region            = true
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_replica_key" "dr" {
  provider                = aws.dr
  description             = "Multi-region replica key"
  primary_key_arn         = aws_kms_key.primary.arn
  deletion_window_in_days = 30
}
```

### 10. DynamoDB Global Tables
```hcl
resource "aws_dynamodb_table" "global" {
  provider         = aws.primary
  name             = "myapp-sessions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "session_id"
    type = "S"
  }

  replica {
    region_name = "us-west-2"
  }

  replica {
    region_name = "eu-west-1"
  }
}
```

### 11. Lambda Cross-Region Replication
```hcl
resource "aws_lambda_function" "primary" {
  provider      = aws.primary
  function_name = "myapp-api"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  s3_bucket     = aws_s3_bucket.lambda_code.bucket
  s3_key        = aws_s3_object.lambda_code.key
}

resource "aws_lambda_function" "dr" {
  provider      = aws.dr
  function_name = "myapp-api"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_dr.arn
  s3_bucket     = aws_s3_bucket.lambda_code_dr.bucket
  s3_key        = aws_s3_object.lambda_code_dr.key
}
```

### 12. CloudFront Origin Group for DR
```hcl
resource "aws_cloudfront_distribution" "with_failover" {
  enabled         = true
  is_ipv6_enabled = true

  origin {
    domain_name              = aws_s3_bucket.primary.bucket_regional_domain_name
    origin_id                = "S3Primary"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  origin {
    domain_name              = aws_s3_bucket.replica.bucket_regional_domain_name
    origin_id                = "S3Replica"
    origin_access_control_id = aws_cloudfront_origin_access_control.dr.id
  }

  origin_group {
    origin_id = "S3FailoverGroup"

    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }

    member {
      origin_id = "S3Primary"
    }

    member {
      origin_id = "S3Replica"
    }
  }

  default_cache_behavior {
    target_origin_id       = "S3FailoverGroup"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
```

## Intermediate

### 13. Aurora Global Database
```hcl
resource "aws_rds_global_cluster" "global" {
  global_cluster_identifier = "myapp-global"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = "myapp"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  provider                  = aws.primary
  cluster_identifier        = "myapp-primary"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  global_cluster_identifier = aws_rds_global_cluster.global.id
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.rds_primary.id]
  master_username           = "admin"
  master_password           = var.db_password
  backup_retention_period   = 7
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.primary.arn

  lifecycle {
    ignore_changes = [replication_source_identifier]
  }
}

resource "aws_rds_cluster_instance" "primary" {
  count              = 2
  provider           = aws.primary
  identifier         = "myapp-primary-${count.index}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version
}

resource "aws_rds_cluster" "dr" {
  provider                  = aws.dr
  cluster_identifier        = "myapp-dr"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  global_cluster_identifier = aws_rds_global_cluster.global.id
  db_subnet_group_name      = aws_db_subnet_group.dr.name
  vpc_security_group_ids    = [aws_security_group.rds_dr.id]
  backup_retention_period   = 3
  storage_encrypted         = true
  kms_key_id                = aws_kms_replica_key.dr.arn

  lifecycle {
    ignore_changes = [replication_source_identifier, master_username, master_password]
  }
}

resource "aws_rds_cluster_instance" "dr" {
  count              = 1
  provider           = aws.dr
  identifier         = "myapp-dr-${count.index}"
  cluster_identifier = aws_rds_cluster.dr.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.dr.engine
  engine_version     = aws_rds_cluster.dr.engine_version
}
```

### 14. Route53 ARC Readiness Check
```hcl
resource "aws_route53recoveryreadiness_cell" "primary" {
  cell_name = "myapp-us-east-1"
}

resource "aws_route53recoveryreadiness_cell" "dr" {
  cell_name = "myapp-us-west-2"
}

resource "aws_route53recoveryreadiness_recovery_group" "myapp" {
  recovery_group_name = "myapp-recovery-group"
  cells               = [
    aws_route53recoveryreadiness_cell.primary.arn,
    aws_route53recoveryreadiness_cell.dr.arn,
  ]
}

resource "aws_route53recoveryreadiness_resource_set" "nlb" {
  resource_set_name = "myapp-nlbs"
  resource_set_type = "AWS::ElasticLoadBalancingV2::LoadBalancer"

  resources {
    resource_arn = aws_lb.primary.arn
    readiness_scopes = [aws_route53recoveryreadiness_cell.primary.arn]
  }

  resources {
    resource_arn = aws_lb.dr.arn
    readiness_scopes = [aws_route53recoveryreadiness_cell.dr.arn]
  }
}

resource "aws_route53recoveryreadiness_readiness_check" "nlb_check" {
  readiness_check_name = "myapp-nlb-readiness"
  resource_set_name    = aws_route53recoveryreadiness_resource_set.nlb.resource_set_name
}
```

### 15. ECS Service DR with Warm Standby
```hcl
resource "aws_ecs_service" "dr_standby" {
  provider        = aws.dr
  name            = "myapp-standby"
  cluster         = aws_ecs_cluster.dr.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1  # warm standby
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc_dr.private_subnets
    security_groups  = [aws_security_group.ecs_dr.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.dr.arn
    container_name   = "app"
    container_port   = 8080
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

resource "aws_appautoscaling_target" "dr" {
  provider           = aws.dr
  max_capacity       = 20
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.dr.name}/${aws_ecs_service.dr_standby.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
```

### 16. RDS Automated Failover with Lambda
```hcl
resource "aws_lambda_function" "rds_failover" {
  function_name = "rds-failover-handler"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.rds_failover.arn
  filename      = data.archive_file.rds_failover.output_path
  timeout       = 300

  environment {
    variables = {
      GLOBAL_CLUSTER_ID = aws_rds_global_cluster.global.id
      PRIMARY_REGION    = "us-east-1"
      DR_REGION         = "us-west-2"
      DR_CLUSTER_ARN    = aws_rds_cluster.dr.arn
      SNS_TOPIC_ARN     = aws_sns_topic.dr_events.arn
    }
  }
}

resource "aws_cloudwatch_event_rule" "rds_failover_trigger" {
  name        = "rds-cluster-failover"
  description = "Trigger DR failover on RDS failure"
  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Cluster Event"]
    detail = {
      EventID = [
        "RDS-EVENT-0049",  # Multi-AZ failover
        "RDS-EVENT-0013",  # Failover
      ]
      SourceIdentifier = [aws_rds_cluster.primary.cluster_identifier]
    }
  })
}

resource "aws_cloudwatch_event_target" "rds_failover_lambda" {
  rule = aws_cloudwatch_event_rule.rds_failover_trigger.name
  arn  = aws_lambda_function.rds_failover.arn
}
```

### 17. Cross-Region VPC Peering for DR
```hcl
resource "aws_vpc_peering_connection" "primary_to_dr" {
  provider      = aws.primary
  vpc_id        = module.vpc_primary.vpc_id
  peer_vpc_id   = module.vpc_dr.vpc_id
  peer_region   = "us-west-2"
  auto_accept   = false
}

resource "aws_vpc_peering_connection_accepter" "dr" {
  provider                  = aws.dr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true
}

resource "aws_route" "primary_to_dr" {
  provider                  = aws.primary
  for_each                  = toset(module.vpc_primary.private_route_table_ids)
  route_table_id            = each.key
  destination_cidr_block    = module.vpc_dr.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}

resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr
  for_each                  = toset(module.vpc_dr.private_route_table_ids)
  route_table_id            = each.key
  destination_cidr_block    = module.vpc_primary.vpc_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}
```

### 18. Backup Vault with Cross-Region Copy
```hcl
resource "aws_backup_vault" "primary" {
  provider    = aws.primary
  name        = "myapp-primary-vault"
  kms_key_arn = aws_kms_key.backup_primary.arn
}

resource "aws_backup_vault" "dr" {
  provider    = aws.dr
  name        = "myapp-dr-vault"
  kms_key_arn = aws_kms_replica_key.backup_dr.arn
}

resource "aws_backup_plan" "comprehensive" {
  name = "myapp-comprehensive-backup"

  rule {
    rule_name         = "hourly-hot-tier"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 * * * ? *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 1
    }
  }

  rule {
    rule_name         = "daily-with-cross-region"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 2 * * ? *)"

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle {
        cold_storage_after = 60
        delete_after       = 365
      }
    }
  }

  rule {
    rule_name         = "monthly-compliance"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 3 1 * ? *)"

    lifecycle {
      cold_storage_after = 30
      delete_after       = 2555  # 7 years
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle {
        cold_storage_after = 30
        delete_after       = 2555
      }
    }
  }
}
```

### 19. DNS Failover with Health Checks
```hcl
locals {
  endpoints = {
    primary = {
      region  = "us-east-1"
      lb_arn  = aws_lb.primary.arn
      lb_dns  = aws_lb.primary.dns_name
      lb_zone = aws_lb.primary.zone_id
    }
    secondary = {
      region  = "us-west-2"
      lb_arn  = aws_lb.secondary.arn
      lb_dns  = aws_lb.secondary.dns_name
      lb_zone = aws_lb.secondary.zone_id
    }
  }
}

resource "aws_route53_health_check" "endpoints" {
  for_each = local.endpoints

  fqdn              = each.value.lb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true
  regions           = ["us-east-1", "eu-west-1", "ap-southeast-1"]

  tags = { Name = "${each.key}-health-check" }
}

resource "aws_cloudwatch_metric_alarm" "health_alarms" {
  for_each = local.endpoints

  alarm_name          = "${each.key}-unhealthy"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  dimensions = {
    HealthCheckId = aws_route53_health_check.endpoints[each.key].id
  }
  alarm_actions = [aws_sns_topic.dr_alerts.arn]
}
```

### 20. ECR Cross-Region Replication
```hcl
resource "aws_ecr_registry_policy" "replication_source" {
  provider = aws.primary
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCrossRegionReplication"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:CreateRepository",
          "ecr:ReplicateImage",
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_ecr_replication_configuration" "cross_region" {
  provider = aws.primary

  replication_configuration {
    rule {
      destination {
        region      = "us-west-2"
        registry_id = data.aws_caller_identity.current.account_id
      }

      repository_filter {
        filter      = "myapp/"
        filter_type = "PREFIX_MATCH"
      }
    }
  }
}
```

### 21. Pilot Light DR Pattern
```hcl
module "dr_pilot_light" {
  source = "./modules/dr-pilot-light"

  # Minimal resources always running in DR
  vpc_cidr       = "10.1.0.0/16"
  dr_region      = "us-west-2"

  # Database (read replica - promotes on failover)
  db_read_replica_arn = aws_rds_cluster.dr.arn

  # Cache (minimal node)
  cache_node_count = 1

  # Load balancer (ready to receive traffic)
  alb_enabled = true

  # ECS (0 desired, scales on failover)
  ecs_min_count  = 0
  ecs_max_count  = 20

  # DNS (health check points here)
  route53_zone_id = aws_route53_zone.public.zone_id
  domain          = "api.myapp.com"
}
```

### 22. Warm Standby Pattern
```hcl
module "dr_warm_standby" {
  source = "./modules/dr-warm-standby"

  dr_region = "us-west-2"

  # Run at reduced capacity (20% of production)
  scale_factor = 0.2

  # Database
  db_instance_class = "db.r6g.large"  # same as prod but single instance
  db_replica_of     = aws_rds_cluster.primary.arn

  # ECS services
  services = {
    api    = { min = 1, max = 10, image = "myorg/api:latest" }
    worker = { min = 1, max = 5,  image = "myorg/worker:latest" }
  }

  # Cache
  cache_node_count = 1
  cache_node_type  = "cache.r6g.large"

  # Health checks
  health_check_path = "/health"

  # Route53 failover
  primary_health_check_id = aws_route53_health_check.primary.id
  route53_zone_id         = aws_route53_zone.public.zone_id
}
```

### 23. RTO/RPO Monitoring
```hcl
resource "aws_cloudwatch_dashboard" "dr_metrics" {
  dashboard_name = "disaster-recovery-metrics"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title = "RDS Replication Lag (RPO Indicator)"
          metrics = [
            ["AWS/RDS", "AuroraGlobalDBReplicationLag", "DBClusterIdentifier", aws_rds_cluster.dr.cluster_identifier]
          ]
          annotations = {
            horizontal = [{ value = 1000, label = "RPO Alert Threshold (1s)", color = "#ff0000" }]
          }
        }
      },
      {
        type = "metric"
        properties = {
          title = "S3 Replication Pending Operations"
          metrics = [
            ["AWS/S3", "ReplicationPendingOperations", "SourceBucket", aws_s3_bucket.primary.bucket, "RuleId", "replicate-all"]
          ]
        }
      },
      {
        type = "alarm"
        properties = {
          title = "DR Health Checks"
          alarms = [
            aws_cloudwatch_metric_alarm.primary_down.arn,
            aws_cloudwatch_metric_alarm.rds_replication_lag.arn,
          ]
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_replication_lag" {
  alarm_name          = "aurora-global-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1000  # 1 second

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.dr.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.dr_alerts.arn]
}
```

### 24. DynamoDB Point-in-Time Recovery
```hcl
resource "aws_dynamodb_table" "orders" {
  name         = "orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  point_in_time_recovery {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  replica {
    region_name            = "us-west-2"
    kms_key_arn            = aws_kms_replica_key.dr.arn
    point_in_time_recovery = true
  }
}
```

### 25. Disaster Recovery Runbook via Systems Manager
```hcl
resource "aws_ssm_document" "dr_failover" {
  name            = "DR-Failover-Runbook"
  document_type   = "Automation"
  document_format = "YAML"

  content = yamlencode({
    schemaVersion = "0.3"
    description   = "Automated disaster recovery failover runbook"
    parameters = {
      TargetRegion = {
        type    = "String"
        default = "us-west-2"
      }
    }
    mainSteps = [
      {
        name   = "NotifyTeam"
        action = "aws:executeAwsApi"
        inputs = {
          Service  = "sns"
          Api      = "Publish"
          TopicArn = aws_sns_topic.dr_alerts.arn
          Message  = "DR Failover initiated to {{ TargetRegion }}"
        }
      },
      {
        name   = "ScaleUpDRCluster"
        action = "aws:executeAwsApi"
        inputs = {
          Service  = "ecs"
          Api      = "UpdateService"
          Cluster  = aws_ecs_cluster.dr.name
          Service  = "myapp"
          DesiredCount = 10
        }
      },
      {
        name   = "PromoteAuroraReplica"
        action = "aws:executeAwsApi"
        inputs = {
          Service                  = "rds"
          Api                      = "FailoverGlobalCluster"
          GlobalClusterIdentifier  = aws_rds_global_cluster.global.id
          TargetDbClusterIdentifier = aws_rds_cluster.dr.arn
        }
      },
      {
        name   = "UpdateDNS"
        action = "aws:executeScript"
        inputs = {
          Runtime  = "python3.11"
          Handler  = "script_handler"
          Script   = "def script_handler(events, context): return {'status': 'DNS updated'}"
        }
      }
    ]
  })
}
```

## Nested

### 26. Multi-Region Active-Active Architecture
```hcl
variable "regions" {
  type    = list(string)
  default = ["us-east-1", "us-west-2", "eu-west-1"]
}

locals {
  region_configs = {
    for region in var.regions : region => {
      is_primary = region == "us-east-1"
      short_name = replace(region, "-", "")
    }
  }
}

module "regional_infrastructure" {
  for_each = local.region_configs
  source   = "./modules/regional-app"

  region     = each.key
  is_primary = each.value.is_primary

  providers = {
    aws = aws.by_region[each.key]
  }

  # Shared configuration
  app_name       = "myapp"
  instance_count = each.value.is_primary ? 10 : 5
  db_cluster_id  = aws_rds_global_cluster.global.id
  kms_key_arn    = each.value.is_primary ? aws_kms_key.primary.arn : aws_kms_replica_key.replicas[each.key].arn

  # DynamoDB global table
  dynamodb_table_name = aws_dynamodb_table.global.name
}

resource "aws_route53_record" "latency_routing" {
  for_each = local.region_configs

  zone_id = aws_route53_zone.public.zone_id
  name    = "api.myapp.com"
  type    = "A"

  latency_routing_policy {
    region = each.key
  }

  set_identifier  = each.key
  health_check_id = module.regional_infrastructure[each.key].health_check_id

  alias {
    name                   = module.regional_infrastructure[each.key].alb_dns_name
    zone_id                = module.regional_infrastructure[each.key].alb_zone_id
    evaluate_target_health = true
  }
}
```

### 27. Automated DR Testing with Chaos Engineering
```hcl
resource "aws_fis_experiment_template" "az_failure" {
  description = "Simulate AZ failure for DR testing"
  role_arn    = aws_iam_role.fis.arn

  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = aws_cloudwatch_metric_alarm.error_rate_too_high.arn
  }

  target {
    name           = "primary-instances"
    resource_type  = "aws:ec2:instance"
    selection_mode = "ALL"

    resource_tag {
      key   = "Environment"
      value = "production"
    }

    resource_tag {
      key   = "AZ"
      value = "us-east-1a"
    }
  }

  action {
    name      = "stop-instances"
    action_id = "aws:ec2:stop-instances"
    target    = { instances = "primary-instances" }
  }

  log_configuration {
    log_schema_version = 2
    cloudwatch_logs_configuration {
      log_group_arn = "${aws_cloudwatch_log_group.fis.arn}:*"
    }
  }

  tags = { Name = "az-failure-test" }
}

resource "aws_scheduler_schedule" "dr_test_monthly" {
  name                         = "monthly-dr-test"
  schedule_expression          = "cron(0 10 1 * ? *)"
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 60
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:fis:startExperiment"
    role_arn = aws_iam_role.scheduler.arn

    input = jsonencode({
      ExperimentTemplateId = aws_fis_experiment_template.az_failure.id
      Tags = {
        RunType = "ScheduledDRTest"
        Date    = "{{ schedule.scheduled-time }}"
      }
    })
  }
}
```

### 28. RTO Automation with Step Functions
```hcl
resource "aws_sfn_state_machine" "dr_failover" {
  name     = "dr-failover-orchestrator"
  role_arn = aws_iam_role.sfn.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment = "Orchestrate DR failover with RTO < 15 minutes"
    StartAt = "NotifyTeam"
    States = {
      NotifyTeam = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.dr_alerts.arn
          Message  = "DR Failover initiated"
        }
        Next = "ParallelPreparation"
      }
      ParallelPreparation = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "ScaleUpECS"
            States = {
              ScaleUpECS = {
                Type     = "Task"
                Resource = "arn:aws:states:::ecs:updateService.sync"
                Parameters = {
                  Cluster      = aws_ecs_cluster.dr.name
                  Service      = "myapp"
                  DesiredCount = 20
                }
                End = true
              }
            }
          },
          {
            StartAt = "PromoteDatabase"
            States = {
              PromoteDatabase = {
                Type     = "Task"
                Resource = "arn:aws:states:::aws-sdk:rds:failoverGlobalCluster"
                Parameters = {
                  GlobalClusterIdentifier  = aws_rds_global_cluster.global.id
                  TargetDbClusterIdentifier = aws_rds_cluster.dr.arn
                }
                End = true
              }
            }
          }
        ]
        Next = "ValidateDR"
      }
      ValidateDR = {
        Type     = "Task"
        Resource = aws_lambda_function.dr_validator.arn
        Retry = [
          {
            ErrorEquals     = ["ValidationError"]
            IntervalSeconds = 30
            MaxAttempts     = 5
            BackoffRate     = 1.5
          }
        ]
        Next = "UpdateDNS"
      }
      UpdateDNS = {
        Type     = "Task"
        Resource = aws_lambda_function.dns_updater.arn
        Next     = "NotifySuccess"
      }
      NotifySuccess = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.dr_alerts.arn
          Message  = "DR Failover completed successfully"
        }
        End = true
      }
    }
  })
}
```

### 29. Multi-Account DR with Transit Gateway
```hcl
# Hub-spoke DR architecture across accounts
resource "aws_ec2_transit_gateway" "dr_hub" {
  provider = aws.dr_network

  description                     = "DR Transit Gateway Hub"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  auto_accept_shared_attachments   = "enable"
  dns_support                      = "enable"

  tags = { Name = "dr-transit-gateway" }
}

resource "aws_ram_resource_share" "tgw_share" {
  provider          = aws.dr_network
  name              = "dr-tgw-share"
  allow_external_principals = false
}

resource "aws_ram_resource_association" "tgw" {
  provider           = aws.dr_network
  resource_arn       = aws_ec2_transit_gateway.dr_hub.arn
  resource_share_arn = aws_ram_resource_share.tgw_share.arn
}

resource "aws_ram_principal_association" "org" {
  provider           = aws.dr_network
  principal          = var.aws_organization_arn
  resource_share_arn = aws_ram_resource_share.tgw_share.arn
}

# Each workload account attaches to DR TGW
resource "aws_ec2_transit_gateway_vpc_attachment" "dr_attachments" {
  for_each = var.dr_workload_vpcs

  provider           = aws.dr
  transit_gateway_id = aws_ec2_transit_gateway.dr_hub.id
  vpc_id             = each.value.vpc_id
  subnet_ids         = each.value.private_subnet_ids

  tags = { Name = "${each.key}-dr-attachment" }
}
```

### 30. Compliance-Required DR with RPO/RTO SLAs
```hcl
locals {
  dr_tiers = {
    tier1_critical = {
      rto_minutes    = 15
      rpo_minutes    = 5
      strategy       = "active-active"
      regions        = ["us-east-1", "us-west-2"]
      resources      = ["payments", "auth", "orders"]
    }
    tier2_important = {
      rto_minutes    = 60
      rpo_minutes    = 15
      strategy       = "warm-standby"
      regions        = ["us-east-1", "us-west-2"]
      resources      = ["catalog", "inventory", "users"]
    }
    tier3_standard = {
      rto_minutes    = 240
      rpo_minutes    = 60
      strategy       = "pilot-light"
      regions        = ["us-east-1"]
      resources      = ["analytics", "reporting", "admin"]
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "rpo_violations" {
  for_each = local.dr_tiers

  alarm_name          = "${each.key}-rpo-violation"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = each.value.rpo_minutes * 60 * 1000  # Convert to ms

  alarm_actions = [aws_sns_topic.compliance_violations.arn]

  tags = {
    DRTier    = each.key
    RPOTarget = "${each.value.rpo_minutes}m"
    RTOTarget = "${each.value.rto_minutes}m"
  }
}
```

### 31. DR Orchestration with EventBridge
```hcl
resource "aws_cloudwatch_event_rule" "dr_trigger_conditions" {
  for_each = {
    health_check_failure = {
      pattern = jsonencode({
        source      = ["aws.route53"]
        detail-type = ["Route 53 Health Check Status Changed"]
        detail = {
          status         = ["UNHEALTHY"]
          healthCheckId  = [aws_route53_health_check.primary.id]
        }
      })
    }
    rds_failure = {
      pattern = jsonencode({
        source      = ["aws.rds"]
        detail-type = ["RDS DB Cluster Event"]
        detail = {
          EventID = ["RDS-EVENT-0049"]
        }
      })
    }
    region_impaired = {
      pattern = jsonencode({
        source      = ["aws.health"]
        detail-type = ["AWS Health Event"]
        detail = {
          service            = ["EC2", "RDS", "ECS"]
          eventTypeCategory  = ["issue"]
          statusCode         = ["open", "upcoming"]
        }
      })
    }
  }

  name          = "dr-trigger-${each.key}"
  description   = "DR failover trigger: ${each.key}"
  event_pattern = each.value.pattern
}

resource "aws_cloudwatch_event_target" "dr_orchestrator" {
  for_each = aws_cloudwatch_event_rule.dr_trigger_conditions

  rule     = each.value.name
  arn      = aws_sfn_state_machine.dr_failover.arn
  role_arn = aws_iam_role.events_sfn.arn

  input_transformer {
    input_paths = {
      source     = "$.source"
      detail_type = "$.detail-type"
    }
    input_template = <<-EOF
    {
      "trigger_source": "<source>",
      "trigger_type": "<detail_type>",
      "initiated_by": "automated",
      "target_region": "us-west-2"
    }
    EOF
  }
}
```

### 32. DR Testing Pipeline
```hcl
resource "aws_codepipeline" "dr_test" {
  name     = "dr-test-pipeline"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Pre-Test-Snapshot"
    action {
      name     = "CreateSnapshot"
      category = "Build"
      owner    = "AWS"
      provider = "CodeBuild"
      version  = "1"
      configuration = {
        ProjectName = aws_codebuild_project.pre_test_snapshot.name
      }
    }
  }

  stage {
    name = "Simulate-Failure"
    action {
      name     = "RunFISExperiment"
      category = "Build"
      owner    = "AWS"
      provider = "CodeBuild"
      version  = "1"
      configuration = {
        ProjectName = aws_codebuild_project.fis_runner.name
      }
    }
  }

  stage {
    name = "Validate-Failover"
    action {
      name     = "ValidateRTO"
      category = "Build"
      owner    = "AWS"
      provider = "CodeBuild"
      version  = "1"
      configuration = {
        ProjectName = aws_codebuild_project.rto_validator.name
      }
    }
  }

  stage {
    name = "Restore"
    action {
      name     = "ManualApproval"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"
    }

    action {
      name      = "RestorePrimary"
      category  = "Build"
      owner     = "AWS"
      provider  = "CodeBuild"
      version   = "1"
      run_order = 2
      configuration = {
        ProjectName = aws_codebuild_project.restore_primary.name
      }
    }
  }

  stage {
    name = "Generate-Report"
    action {
      name     = "DRTestReport"
      category = "Build"
      owner    = "AWS"
      provider = "CodeBuild"
      version  = "1"
      configuration = {
        ProjectName = aws_codebuild_project.dr_report.name
      }
    }
  }
}
```

## Advanced

### 33. Complete Multi-Region Active-Active Platform
```hcl
module "active_active_platform" {
  source = "./modules/active-active"

  application_name = "myapp"

  regions = {
    primary = {
      region  = "us-east-1"
      weight  = 60
      az_count = 3
    }
    secondary = {
      region  = "us-west-2"
      weight  = 30
      az_count = 3
    }
    tertiary = {
      region  = "eu-west-1"
      weight  = 10
      az_count = 3
    }
  }

  # Networking
  vpc_cidrs = {
    "us-east-1" = "10.0.0.0/16"
    "us-west-2" = "10.1.0.0/16"
    "eu-west-1" = "10.2.0.0/16"
  }

  # Data layer
  database = {
    engine         = "aurora-postgresql"
    engine_version = "15.4"
    instance_class = "db.r6g.2xlarge"
    multi_writer   = true
    global_cluster = true
  }

  cache = {
    engine       = "redis"
    node_type    = "cache.r6g.large"
    global       = true
    cluster_mode = true
  }

  dynamodb = {
    global_tables    = true
    billing_mode     = "PAY_PER_REQUEST"
    pitr_enabled     = true
  }

  # Application tier
  ecs = {
    min_capacity = 3
    max_capacity = 100
    cpu          = 2048
    memory       = 4096
  }

  # Traffic management
  route53 = {
    latency_based    = true
    health_checks    = true
    failover_enabled = true
    arc_enabled      = true
  }

  # DR SLAs
  rto_minutes = 5
  rpo_minutes = 1

  # Monitoring
  cloudwatch_alarm_actions = [aws_sns_topic.dr_critical.arn]
}
```

### 34. Automated Failback with Replication Sync
```hcl
resource "aws_sfn_state_machine" "failback_orchestrator" {
  name     = "dr-failback-orchestrator"
  role_arn = aws_iam_role.sfn.arn

  definition = jsonencode({
    Comment = "Orchestrate failback after DR event resolves"
    StartAt = "ValidatePrimaryReady"
    States = {
      ValidatePrimaryReady = {
        Type     = "Task"
        Resource = aws_lambda_function.primary_validator.arn
        Retry = [{
          ErrorEquals     = ["PrimaryNotReady"]
          IntervalSeconds = 60
          MaxAttempts     = 30
          BackoffRate     = 1.0
        }]
        Next = "WaitForReplicationSync"
      }
      WaitForReplicationSync = {
        Type     = "Task"
        Resource = aws_lambda_function.replication_checker.arn
        Retry = [{
          ErrorEquals     = ["ReplicationLagTooHigh"]
          IntervalSeconds = 30
          MaxAttempts     = 20
          BackoffRate     = 1.0
        }]
        Next = "NotifyFailbackStart"
      }
      NotifyFailbackStart = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.dr_alerts.arn
          Message  = "Failback to primary region initiated. Please approve."
        }
        Next = "WaitForApproval"
      }
      WaitForApproval = {
        Type          = "Task"
        Resource      = "arn:aws:states:::sqs:sendMessage.waitForTaskToken"
        Parameters = {
          QueueUrl      = aws_sqs_queue.failback_approval.url
          MessageBody   = { TaskToken = "$$.Task.Token" }
        }
        HeartbeatSeconds = 3600
        Next = "ExecuteFailback"
      }
      ExecuteFailback = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "SwitchDatabasePrimary"
            States = {
              SwitchDatabasePrimary = {
                Type     = "Task"
                Resource = aws_lambda_function.db_switcher.arn
                Parameters = { Direction = "failback" }
                End = true
              }
            }
          },
          {
            StartAt = "ScaleDownDR"
            States = {
              ScaleDownDR = {
                Type     = "Task"
                Resource = aws_lambda_function.dr_scaler.arn
                Parameters = { DesiredCount = 1, Region = "us-west-2" }
                End = true
              }
            }
          }
        ]
        Next = "UpdateDNSToFavourPrimary"
      }
      UpdateDNSToFavourPrimary = {
        Type     = "Task"
        Resource = aws_lambda_function.dns_updater.arn
        Parameters = { Direction = "failback", PrimaryWeight = 100 }
        End = true
      }
    }
  })
}
```

### 35. DR Compliance Report Automation
```hcl
resource "aws_lambda_function" "dr_compliance_reporter" {
  function_name = "dr-compliance-reporter"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.compliance_reporter.arn
  filename      = data.archive_file.reporter.output_path
  timeout       = 300

  environment {
    variables = {
      REPORT_BUCKET      = aws_s3_bucket.compliance_reports.bucket
      SNS_TOPIC_ARN      = aws_sns_topic.compliance_reports.arn
      DYNAMODB_TABLE     = aws_dynamodb_table.dr_test_results.name

      # Thresholds
      MAX_REPLICATION_LAG_MS = "5000"
      MIN_BACKUP_FREQUENCY_H = "1"
      REQUIRED_REGIONS       = jsonencode(["us-east-1", "us-west-2"])
      MAX_RTO_MINUTES        = "15"
      MAX_RPO_MINUTES        = "5"

      # Resources to check
      GLOBAL_CLUSTERS        = aws_rds_global_cluster.global.id
      GLOBAL_DYNAMODB_TABLES = aws_dynamodb_table.global.name
      HEALTH_CHECKS          = jsonencode([aws_route53_health_check.primary.id])
    }
  }
}

resource "aws_cloudwatch_event_rule" "dr_compliance_schedule" {
  name                = "dr-compliance-report"
  schedule_expression = "cron(0 8 * * 1 *)"  # Every Monday at 8am
}

resource "aws_cloudwatch_event_target" "dr_compliance" {
  rule = aws_cloudwatch_event_rule.dr_compliance_schedule.name
  arn  = aws_lambda_function.dr_compliance_reporter.arn
}

resource "aws_dynamodb_table" "dr_test_results" {
  name         = "dr-test-results"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "test_date"
  range_key    = "test_type"

  attribute {
    name = "test_date"
    type = "S"
  }
  attribute {
    name = "test_type"
    type = "S"
  }

  point_in_time_recovery { enabled = true }
}
```

### 36. Business Continuity Plan (BCP) Automation
```hcl
module "business_continuity" {
  source = "./modules/bcp"

  organization = "enterprise"

  # Business processes and their DR requirements
  business_processes = {
    payment_processing = {
      criticality  = "CRITICAL"
      rto_minutes  = 5
      rpo_minutes  = 0  # Zero data loss
      dependencies = ["database", "cache", "api_gateway"]
      owner        = "payments-team"
      contact      = "payments-oncall@enterprise.com"
    }
    order_management = {
      criticality  = "HIGH"
      rto_minutes  = 15
      rpo_minutes  = 5
      dependencies = ["database", "message_queue", "cache"]
      owner        = "orders-team"
      contact      = "orders-oncall@enterprise.com"
    }
    reporting = {
      criticality  = "MEDIUM"
      rto_minutes  = 240
      rpo_minutes  = 60
      dependencies = ["database", "s3"]
      owner        = "data-team"
      contact      = "data-team@enterprise.com"
    }
  }

  # Infrastructure components
  infrastructure = {
    database      = { type = "aurora-global", primary = "us-east-1", dr = ["us-west-2"] }
    cache         = { type = "elasticache-global", primary = "us-east-1", dr = ["us-west-2"] }
    message_queue = { type = "sqs-cross-region", regions = ["us-east-1", "us-west-2"] }
    s3            = { type = "s3-crr", primary = "us-east-1", dr = ["us-west-2"] }
    api_gateway   = { type = "multi-region", regions = ["us-east-1", "us-west-2"] }
  }

  # Automated DR testing
  dr_test_schedule  = "cron(0 9 1 * ? *)"  # Monthly
  dr_test_duration  = 60  # minutes
  notify_on_test    = ["dr-team@enterprise.com"]

  # Monitoring and alerting
  monitoring = {
    replication_lag_threshold_ms = 1000
    backup_failure_alert         = true
    health_check_alert           = true
    pagerduty_key                = var.pagerduty_key
  }
}
```

### 37. Global Traffic Management with ARC
```hcl
resource "aws_route53recoverycontrolconfig_cluster" "global" {
  name = "myapp-global-cluster"
}

resource "aws_route53recoverycontrolconfig_control_panel" "main" {
  name        = "myapp-control-panel"
  cluster_arn = aws_route53recoverycontrolconfig_cluster.global.arn
}

resource "aws_route53recoverycontrolconfig_routing_control" "regions" {
  for_each = {
    us_east_1 = "us-east-1"
    us_west_2 = "us-west-2"
    eu_west_1 = "eu-west-1"
  }

  name              = "${each.key}-routing-control"
  cluster_arn       = aws_route53recoverycontrolconfig_cluster.global.arn
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
}

resource "aws_route53recoverycontrolconfig_safety_rule" "min_regions" {
  assertion_rule {
    asserted_controls = [for k, v in aws_route53recoverycontrolconfig_routing_control.regions : v.arn]
    wait_period_ms    = 5000
  }

  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
  name              = "at-least-one-region-active"
  rule_config {
    inverted  = false
    threshold = 1
    type      = "ATLEAST"
  }
}

resource "aws_route53_health_check" "arc" {
  for_each = aws_route53recoverycontrolconfig_routing_control.regions

  type               = "RECOVERY_CONTROL"
  routing_control_arn = each.value.arn
}
```

### 38. Zero-RPO Synchronous Replication
```hcl
# PostgreSQL with synchronous replication via Aurora Global DB
# configured for zero RPO using write forwarding
resource "aws_rds_cluster" "zero_rpo_primary" {
  provider                  = aws.primary
  cluster_identifier        = "zero-rpo-primary"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  global_cluster_identifier = aws_rds_global_cluster.zero_rpo.id

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.sync.name
  backup_retention_period          = 7
  storage_encrypted                = true

  # Enable performance insights for RPO monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 31
}

resource "aws_rds_cluster_parameter_group" "sync" {
  name   = "aurora-pg-sync-params"
  family = "aurora-postgresql15"

  parameter {
    name  = "synchronous_commit"
    value = "remote_write"
  }

  parameter {
    name  = "rds.global_db_rpo"
    value = "0"  # Maximum RPO: 0 seconds
  }
}

resource "aws_rds_global_cluster" "zero_rpo" {
  global_cluster_identifier = "zero-rpo-global"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  storage_encrypted         = true

  lifecycle {
    prevent_destroy = true
  }
}
```

### 39. DR with AWS Resilience Hub
```hcl
resource "aws_resiliencehub_app" "myapp" {
  name        = "myapp-production"
  description = "My application for resilience assessment"

  policy_arn = aws_resiliencehub_resiliency_policy.strict.arn

  app_template_body = jsonencode({
    resources = [
      {
        logicalResourceId = {
          identifier = aws_ecs_service.app.name
          awsAccountId = data.aws_caller_identity.current.account_id
          awsRegion    = "us-east-1"
          resourceType = "AWS::ECS::Service"
        }
      },
      {
        logicalResourceId = {
          identifier = aws_rds_cluster.primary.cluster_identifier
          awsAccountId = data.aws_caller_identity.current.account_id
          awsRegion    = "us-east-1"
          resourceType = "AWS::RDS::DBCluster"
        }
      }
    ]
  })
}

resource "aws_resiliencehub_resiliency_policy" "strict" {
  name        = "strict-rto-rpo"
  description = "Strict RTO/RPO policy for critical services"

  tier = "MissionCritical"

  policy {
    az {
      rpo_in_secs = 300   # 5 minutes
      rto_in_secs = 900   # 15 minutes
    }
    hardware {
      rpo_in_secs = 300
      rto_in_secs = 900
    }
    software {
      rpo_in_secs = 300
      rto_in_secs = 900
    }
    region {
      rpo_in_secs = 300
      rto_in_secs = 900
    }
  }
}
```

### 40. Complete Enterprise DR Platform
```hcl
module "enterprise_dr_platform" {
  source = "./modules/enterprise-dr"

  application_name = "enterprise-platform"
  aws_org_id       = var.aws_organization_id

  # Primary region
  primary_region = "us-east-1"
  primary_vpc    = module.vpc_primary.vpc_id

  # DR regions by tier
  dr_regions = {
    hot_standby = {
      region       = "us-west-2"
      strategy     = "active-active"
      traffic_pct  = 30
    }
    warm_standby = {
      region       = "eu-west-1"
      strategy     = "warm-standby"
      traffic_pct  = 0  # Failover only
    }
  }

  # SLAs
  slas = {
    critical  = { rto = 5,   rpo = 0   }
    high      = { rto = 15,  rpo = 5   }
    medium    = { rto = 60,  rpo = 15  }
    low       = { rto = 240, rpo = 60  }
  }

  # Data replication
  databases = {
    orders    = { type = "aurora-global",    sla = "critical",  engine = "postgresql" }
    products  = { type = "aurora-global",    sla = "high",      engine = "postgresql" }
    analytics = { type = "rds-read-replica", sla = "low",       engine = "postgresql" }
  }

  caches = {
    sessions  = { type = "elasticache-global", sla = "critical" }
    product   = { type = "elasticache-global", sla = "high"     }
  }

  storage = {
    assets    = { type = "s3-crr", sla = "medium", regions = ["us-west-2", "eu-west-1"] }
    backups   = { type = "s3-crr", sla = "high",   regions = ["us-west-2"] }
  }

  # Automated DR testing
  dr_testing = {
    enabled           = true
    schedule          = "cron(0 10 1 * ? *)"
    test_duration_min = 30
    auto_failback     = true
    notify_on_test    = [aws_sns_topic.dr_alerts.arn]
    generate_report   = true
    report_bucket     = aws_s3_bucket.dr_reports.bucket
  }

  # Observability
  monitoring = {
    replication_lag_alert_ms  = 1000
    rpo_breach_alert          = true
    rto_breach_alert          = true
    cloudwatch_namespace      = "Enterprise/DR"
    dashboard_enabled         = true
    pagerduty_key             = var.pagerduty_key
    slack_webhook             = var.dr_slack_webhook
  }

  # Compliance
  compliance_framework        = "ISO22301"
  compliance_report_schedule  = "cron(0 9 1 * ? *)"
  audit_log_bucket            = aws_s3_bucket.audit.bucket
}
```

### 41. Chaos Engineering Framework for DR Validation
```hcl
locals {
  chaos_scenarios = {
    az_failure = {
      description   = "Simulate AZ failure"
      experiment_id = aws_fis_experiment_template.az_failure.id
      auto_rollback = true
      max_duration  = 30
    }
    network_latency = {
      description   = "Inject network latency"
      experiment_id = aws_fis_experiment_template.network_latency.id
      auto_rollback = true
      max_duration  = 15
    }
    rds_failover = {
      description   = "Trigger RDS failover"
      experiment_id = aws_fis_experiment_template.rds_failover.id
      auto_rollback = false
      max_duration  = 10
    }
    ecs_task_failure = {
      description   = "Kill ECS tasks"
      experiment_id = aws_fis_experiment_template.ecs_tasks.id
      auto_rollback = true
      max_duration  = 5
    }
  }
}

resource "aws_fis_experiment_template" "network_latency" {
  description = "Inject network latency to simulate cross-region replication slowdown"
  role_arn    = aws_iam_role.fis.arn

  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = aws_cloudwatch_metric_alarm.error_rate_critical.arn
  }

  target {
    name           = "ecs-tasks"
    resource_type  = "aws:ecs:task"
    selection_mode = "PERCENT(10)"

    resource_tag {
      key   = "Environment"
      value = "production"
    }
  }

  action {
    name      = "inject-latency"
    action_id = "aws:ssm:send-command"

    target { tasks = "ecs-tasks" }

    parameter {
      key   = "documentArn"
      value = "arn:aws:ssm:::document/AWSFIS-Run-Network-Latency"
    }
    parameter {
      key   = "documentParameters"
      value = jsonencode({ DelayMilliseconds = "500", DurationSeconds = "120" })
    }
  }
}

resource "aws_scheduler_schedule" "chaos_monthly" {
  for_each = local.chaos_scenarios

  name                         = "chaos-${each.key}"
  schedule_expression          = "cron(0 11 15 * ? *)"  # 15th of each month
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 120
  }

  target {
    arn      = aws_sfn_state_machine.chaos_runner.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode(each.value)
  }
}
```

### 42. Cross-Account DR State Management
```hcl
# DR account S3 bucket for state replication
resource "aws_s3_bucket" "dr_terraform_state" {
  provider = aws.dr_account
  bucket   = "enterprise-terraform-state-dr"
}

resource "aws_s3_bucket_replication_configuration" "state_replication" {
  provider = aws.primary_account
  bucket   = aws_s3_bucket.terraform_state.id
  role     = aws_iam_role.state_replication.arn

  rule {
    id     = "replicate-state"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.dr_terraform_state.arn
      storage_class = "STANDARD"
      account       = var.dr_account_id

      access_control_translation {
        owner = "Destination"
      }

      encryption_configuration {
        replica_kms_key_id = aws_kms_replica_key.dr_state.arn
      }
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }
  }
}

# Allow DR account to read state
resource "aws_s3_bucket_policy" "dr_state_access" {
  provider = aws.dr_account
  bucket   = aws_s3_bucket.dr_terraform_state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${var.dr_account_id}:root" }
        Action    = ["s3:GetObject", "s3:ListBucket"]
        Resource  = [
          aws_s3_bucket.dr_terraform_state.arn,
          "${aws_s3_bucket.dr_terraform_state.arn}/*",
        ]
      }
    ]
  })
}
```

### 43. Automated Recovery Verification
```hcl
resource "aws_lambda_function" "recovery_verifier" {
  function_name = "dr-recovery-verifier"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.verifier.arn
  filename      = data.archive_file.verifier.output_path
  timeout       = 300

  environment {
    variables = {
      # Checks to run after DR failover
      CHECKS = jsonencode([
        {
          name     = "api_health"
          type     = "http"
          url      = "https://api.myapp.com/health"
          expected = 200
          timeout  = 5
        },
        {
          name     = "database_write"
          type     = "sql"
          host     = aws_rds_cluster.dr.endpoint
          query    = "SELECT 1"
        },
        {
          name     = "cache_read"
          type     = "redis"
          host     = aws_elasticache_replication_group.secondary.primary_endpoint_address
          command  = "PING"
          expected = "PONG"
        },
        {
          name     = "queue_depth"
          type     = "sqs"
          queue    = aws_sqs_queue.orders.url
          max_depth = 1000
        },
        {
          name          = "s3_access"
          type          = "s3"
          bucket        = aws_s3_bucket.replica.bucket
          key           = "healthcheck/test.txt"
        }
      ])

      RESULTS_TABLE    = aws_dynamodb_table.dr_test_results.name
      SUCCESS_TOPIC    = aws_sns_topic.dr_success.arn
      FAILURE_TOPIC    = aws_sns_topic.dr_failure.arn
      PAGERDUTY_KEY    = var.pagerduty_key
    }
  }
}
```

### 44. DR Metrics and SLA Tracking
```hcl
resource "aws_cloudwatch_dashboard" "dr_sla_dashboard" {
  dashboard_name = "dr-sla-tracking"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          title  = "Aurora Replication Lag vs RPO Target"
          metrics = [
            ["AWS/RDS", "AuroraGlobalDBReplicationLag", "DBClusterIdentifier", aws_rds_cluster.dr.cluster_identifier, { label = "Current Lag" }],
            [{ expression = "300000", label = "RPO Target (5min)", color = "#ff0000" }],
          ]
          period = 60
          stat   = "Maximum"
          yAxis  = { left = { label = "Milliseconds", min = 0 } }
        }
      },
      {
        type = "metric"
        properties = {
          title = "Monthly DR Test Results"
          metrics = [
            ["Custom/DR", "TestPassed"],
            ["Custom/DR", "TestFailed"],
            ["Custom/DR", "RTOAchieved"],
            ["Custom/DR", "RPOAchieved"],
          ]
          period = 2592000  # 30 days
          stat   = "Sum"
        }
      },
      {
        type = "metric"
        properties = {
          title = "Backup Compliance"
          metrics = [
            ["AWS/Backup", "RecoveryPointCreation", "BackupVaultName", aws_backup_vault.main.name],
          ]
        }
      }
    ]
  })
}
```

### 45. Multi-Cloud DR Strategy
```hcl
# AWS primary + GCP secondary DR
provider "google" {
  project = var.gcp_project
  region  = "us-central1"
}

# CloudSQL for GCP DR of RDS
resource "google_sql_database_instance" "dr_replica" {
  provider         = google
  name             = "myapp-dr-replica"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-4-16384"

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    ip_configuration {
      private_network = google_compute_network.dr.id
    }
  }
}

# VPN between AWS and GCP for data replication
resource "aws_vpn_gateway" "gcp_dr" {
  provider = aws.primary
  vpc_id   = module.vpc_primary.vpc_id

  tags = { Name = "gcp-dr-vpn-gateway" }
}

resource "aws_customer_gateway" "gcp" {
  bgp_asn    = 65000
  ip_address = google_compute_ha_vpn_gateway.dr.vpn_interfaces[0].ip_address
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "to_gcp" {
  vpn_gateway_id      = aws_vpn_gateway.gcp_dr.id
  customer_gateway_id = aws_customer_gateway.gcp.id
  type                = "ipsec.1"
  static_routes_only  = false
}
```

### 46. Regulatory Compliance DR Documentation
```hcl
resource "aws_s3_bucket" "dr_compliance_docs" {
  bucket = "enterprise-dr-compliance-docs"
}

resource "aws_lambda_function" "dr_doc_generator" {
  function_name = "dr-compliance-doc-generator"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.doc_generator.arn
  filename      = data.archive_file.doc_generator.output_path
  timeout       = 300

  environment {
    variables = {
      OUTPUT_BUCKET         = aws_s3_bucket.dr_compliance_docs.bucket
      DYNAMODB_RESULTS      = aws_dynamodb_table.dr_test_results.name
      COMPLIANCE_FRAMEWORKS = jsonencode(["SOC2", "ISO27001", "ISO22301", "PCI-DSS"])

      INFRASTRUCTURE = jsonencode({
        primary_region = "us-east-1"
        dr_region      = "us-west-2"
        rto_target     = "15 minutes"
        rpo_target     = "5 minutes"
        strategy       = "Warm Standby"
      })

      # Recipients for compliance reports
      RECIPIENTS = jsonencode([
        "cto@enterprise.com",
        "compliance@enterprise.com",
        "auditors@enterprise.com"
      ])
    }
  }
}

resource "aws_cloudwatch_event_rule" "quarterly_report" {
  name                = "quarterly-dr-compliance-report"
  schedule_expression = "cron(0 9 1 1,4,7,10 ? *)"  # Quarterly
}
```

### 47. Automated RDS Global Cluster Failover
```hcl
resource "aws_lambda_function" "global_cluster_failover" {
  function_name = "rds-global-cluster-failover"
  runtime       = "python3.11"
  handler       = "index.handler"
  role          = aws_iam_role.failover_lambda.arn
  filename      = data.archive_file.failover.output_path
  timeout       = 600

  environment {
    variables = {
      GLOBAL_CLUSTER_ID   = aws_rds_global_cluster.global.id
      DR_CLUSTER_ARN      = aws_rds_cluster.dr.arn
      PRIMARY_CLUSTER_ARN = aws_rds_cluster.primary.arn
      ROUTE53_ZONE_ID     = aws_route53_zone.private.zone_id
      DB_CNAME            = "db.internal.myapp.com"
      DR_ENDPOINT         = aws_rds_cluster.dr.endpoint
      SNS_TOPIC_ARN       = aws_sns_topic.dr_alerts.arn
      SECRETS_PREFIX      = "myapp/production/db"
    }
  }
}

# Step 1: Promote secondary to standalone
# Step 2: Update application connection string via SSM Parameter Store
# Step 3: Update Route53 CNAME to point to new primary
# Step 4: Scale up application tier in DR region
# Step 5: Notify operations team
# Step 6: Start monitoring for successful failover

resource "aws_iam_role_policy" "failover_policy" {
  name = "rds-failover-policy"
  role = aws_iam_role.failover_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:FailoverGlobalCluster",
          "rds:ModifyGlobalCluster",
          "rds:DescribeGlobalClusters",
          "rds:RemoveFromGlobalCluster",
          "route53:ChangeResourceRecordSets",
          "ssm:PutParameter",
          "secretsmanager:RotateSecret",
          "ecs:UpdateService",
          "sns:Publish",
        ]
        Resource = "*"
      }
    ]
  })
}
```

### 48. Network-Level DR with Global Accelerator
```hcl
resource "aws_globalaccelerator_accelerator" "main" {
  name            = "myapp-global-accelerator"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.ga_logs.bucket
    flow_logs_s3_prefix = "flow-logs/"
  }
}

resource "aws_globalaccelerator_listener" "https" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  client_affinity = "SOURCE_IP"
  protocol        = "TCP"

  port_range {
    from_port = 443
    to_port   = 443
  }
}

resource "aws_globalaccelerator_endpoint_group" "primary" {
  listener_arn          = aws_globalaccelerator_listener.https.id
  endpoint_group_region = "us-east-1"
  traffic_dial_percentage = 100

  health_check_path             = "/health"
  health_check_port             = 443
  health_check_protocol         = "HTTPS"
  health_check_interval_seconds = 10
  threshold_count               = 3

  endpoint_configuration {
    endpoint_id                    = aws_lb.primary.arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}

resource "aws_globalaccelerator_endpoint_group" "dr" {
  listener_arn          = aws_globalaccelerator_listener.https.id
  endpoint_group_region = "us-west-2"
  traffic_dial_percentage = 0  # Will be set to 100 during failover

  health_check_path             = "/health"
  health_check_port             = 443
  health_check_protocol         = "HTTPS"
  health_check_interval_seconds = 10
  threshold_count               = 3

  endpoint_configuration {
    endpoint_id                    = aws_lb.dr.arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }
}
```

### 49. Geo-Redundant Data Archival
```hcl
resource "aws_s3_bucket" "archive_primary" {
  provider = aws.primary
  bucket   = "enterprise-archive-primary"
}

resource "aws_s3_bucket_object_lock_configuration" "archive" {
  provider = aws.primary
  bucket   = aws_s3_bucket.archive_primary.id

  object_lock_enabled = "Enabled"
  rule {
    default_retention {
      mode  = "COMPLIANCE"
      years = 7
    }
  }
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "archive" {
  provider = aws.primary
  bucket   = aws_s3_bucket.archive_primary.id
  name     = "EntireArchive"

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

resource "aws_s3_bucket_replication_configuration" "archive_replication" {
  provider = aws.primary
  bucket   = aws_s3_bucket.archive_primary.id
  role     = aws_iam_role.archive_replication.arn

  rule {
    id     = "replicate-to-dr"
    status = "Enabled"

    filter {}  # Replicate all objects

    destination {
      bucket        = aws_s3_bucket.archive_dr.arn
      storage_class = "DEEP_ARCHIVE"

      replication_time {
        status = "Enabled"
        time { minutes = 15 }
      }
      metrics {
        status = "Enabled"
        event_threshold { minutes = 15 }
      }
    }

    delete_marker_replication {
      status = "Disabled"  # Don't replicate deletes for compliance
    }
  }
}
```

### 50. Complete Enterprise DR Solution
```hcl
module "complete_enterprise_dr" {
  source = "./modules/complete-enterprise-dr"

  application_name = "enterprise-platform"
  organization     = "enterprise"

  # Topology
  primary_region   = "us-east-1"
  dr_regions       = ["us-west-2", "eu-west-1"]

  # DR strategy per component
  strategies = {
    web_tier       = "active-active"
    api_tier       = "active-active"
    worker_tier    = "warm-standby"
    database       = "aurora-global"
    cache          = "elasticache-global"
    search         = "opensearch-cross-cluster"
    storage        = "s3-cross-region-replication"
    message_queue  = "sqs-cross-region"
    secrets        = "secrets-manager-replication"
    dns            = "route53-arc"
    cdn            = "cloudfront-origin-failover"
    network        = "global-accelerator"
  }

  # SLA targets
  sla = {
    rto_minutes = 5
    rpo_minutes = 1
    availability = 99.999
  }

  # Automated operations
  automation = {
    auto_failover         = true
    auto_failback         = false  # Manual approval required
    dr_testing_schedule   = "cron(0 9 1 * ? *)"
    chaos_testing_enabled = true
    drift_detection       = true
  }

  # Compliance
  compliance = {
    frameworks         = ["SOC2", "ISO27001", "ISO22301", "PCI-DSS", "HIPAA"]
    audit_retention    = 2555  # 7 years
    report_schedule    = "cron(0 9 1 1 ? *)"  # Annual
    notify_auditors    = ["auditors@enterprise.com"]
  }

  # Observability
  observability = {
    dashboard_enabled    = true
    sla_alerting         = true
    pagerduty_key        = var.pagerduty_key
    slack_webhook        = var.dr_slack_webhook
    runbook_url          = "https://wiki.enterprise.com/dr-runbook"
  }

  # Cost controls
  dr_cost_optimization = {
    use_spot_in_dr       = false  # Never spot for DR
    rightsize_dr_cluster = true
    budget_alert_usd     = 10000
  }
}
```
