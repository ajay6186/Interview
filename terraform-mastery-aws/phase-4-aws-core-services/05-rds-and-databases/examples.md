# Examples 4.5 — RDS & Databases (50 examples)

---

## Basic

### 1. Simple RDS MySQL instance
```hcl
resource "aws_db_instance" "mysql" {
  identifier        = "my-mysql-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  username          = "admin"
  password          = var.db_password
  skip_final_snapshot = true
}
```

### 2. RDS subnet group
```hcl
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "Main DB subnet group" }
}
```

### 3. RDS security group
```hcl
resource "aws_security_group" "rds" {
  name   = "rds-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}
```

### 4. PostgreSQL with deletion protection
```hcl
resource "aws_db_instance" "postgres" {
  identifier          = "prod-postgres"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_type        = "gp3"
  username            = "dbadmin"
  password            = var.db_password
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  deletion_protection  = true
  skip_final_snapshot  = false
  final_snapshot_identifier = "prod-postgres-final"
}
```

### 5. Automated backups
```hcl
resource "aws_db_instance" "main" {
  identifier              = "app-db"
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = "db.t3.small"
  allocated_storage       = 50
  username                = "admin"
  password                = var.db_password
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  skip_final_snapshot     = true
}
```

### 6. Enable Multi-AZ
```hcl
resource "aws_db_instance" "ha" {
  identifier          = "ha-postgres"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.r6g.large"
  allocated_storage   = 100
  username            = "admin"
  password            = var.db_password
  multi_az            = true
  skip_final_snapshot = true
}
```

### 7. Storage encrypted with KMS
```hcl
resource "aws_kms_key" "rds" {
  description             = "RDS encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_db_instance" "encrypted" {
  identifier          = "encrypted-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  username            = "admin"
  password            = var.db_password
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.rds.arn
  skip_final_snapshot = true
}
```

### 8. Parameter group
```hcl
resource "aws_db_parameter_group" "postgres" {
  name   = "postgres15-custom"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries > 1s
  }
}
```

### 9. Publicly accessible (NOT recommended for production)
```hcl
resource "aws_db_instance" "dev" {
  identifier          = "dev-db"
  engine              = "mysql"
  engine_version      = "8.0"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "admin"
  password            = var.db_password
  publicly_accessible = false  # Always false in production
  skip_final_snapshot = true
}
```

### 10. Read replica
```hcl
resource "aws_db_instance" "replica" {
  identifier          = "app-db-replica"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.t3.medium"
  skip_final_snapshot = true

  # Read replicas inherit most settings from source
}
```

### 11. RDS event subscription
```hcl
resource "aws_db_event_subscription" "main" {
  name      = "rds-events"
  sns_topic = aws_sns_topic.alerts.arn

  source_type = "db-instance"
  source_ids  = [aws_db_instance.main.id]

  event_categories = [
    "availability", "deletion", "failover",
    "failure", "low storage", "maintenance", "recovery"
  ]
}
```

### 12. Performance Insights
```hcl
resource "aws_db_instance" "insights" {
  identifier                        = "app-db"
  engine                            = "postgres"
  engine_version                    = "15.4"
  instance_class                    = "db.t3.medium"
  allocated_storage                 = 100
  username                          = "admin"
  password                          = var.db_password
  performance_insights_enabled      = true
  performance_insights_retention_period = 7
  monitoring_interval               = 60
  monitoring_role_arn               = aws_iam_role.rds_monitoring.arn
  skip_final_snapshot               = true
}
```

---

## Intermediate

### 13. Aurora cluster
```hcl
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "aurora-production"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  master_username         = "dbadmin"
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.rds.arn
  backup_retention_period = 14
  deletion_protection     = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "aurora-final"
}

resource "aws_rds_cluster_instance" "aurora" {
  count               = 2
  identifier          = "aurora-instance-${count.index}"
  cluster_identifier  = aws_rds_cluster.aurora.id
  instance_class      = "db.r6g.large"
  engine              = aws_rds_cluster.aurora.engine
  engine_version      = aws_rds_cluster.aurora.engine_version
}
```

### 14. RDS Proxy
```hcl
resource "aws_db_proxy" "main" {
  name                   = "app-db-proxy"
  debug_logging          = false
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]
  vpc_subnet_ids         = var.private_subnet_ids

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "REQUIRED"
    secret_arn  = aws_secretsmanager_secret.db.arn
  }
}

resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 90
    max_idle_connections_percent = 50
  }
}

resource "aws_db_proxy_target" "main" {
  db_instance_identifier = aws_db_instance.main.id
  db_proxy_name          = aws_db_proxy.main.name
  target_group_name      = aws_db_proxy_default_target_group.main.name
}
```

### 15. Secrets Manager integration
```hcl
resource "aws_secretsmanager_secret" "db" {
  name       = "prod/app/db-credentials"
  kms_key_id = aws_kms_key.secrets.arn
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id

  secret_string = jsonencode({
    username = "dbadmin"
    password = var.db_password
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = "appdb"
  })
}
```

### 16. CloudWatch alarms for RDS
```hcl
resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "storage" {
  alarm_name          = "rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10 GB
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}
```

### 17. Cross-region read replica
```hcl
provider "aws" {
  alias  = "replica"
  region = "us-west-2"
}

resource "aws_db_instance" "cross_region_replica" {
  provider            = aws.replica
  identifier          = "app-db-cross-region-replica"
  replicate_source_db = aws_db_instance.main.arn
  instance_class      = "db.t3.medium"
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.rds_west.arn
  skip_final_snapshot = true
}
```

### 18. Aurora Global Database
```hcl
resource "aws_rds_global_cluster" "global" {
  global_cluster_identifier = "aurora-global"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = "appdb"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  cluster_identifier        = "aurora-primary"
  global_cluster_identifier = aws_rds_global_cluster.global.id
  engine                    = aws_rds_global_cluster.global.engine
  engine_version            = aws_rds_global_cluster.global.engine_version
  db_subnet_group_name      = aws_db_subnet_group.main.name
  vpc_security_group_ids    = [aws_security_group.rds.id]
  master_username           = "dbadmin"
  master_password           = var.db_password
  skip_final_snapshot       = true
}
```

### 19. Aurora Serverless v2
```hcl
resource "aws_rds_cluster" "serverless" {
  cluster_identifier      = "aurora-serverless"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  master_username         = "admin"
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  storage_encrypted       = true
  skip_final_snapshot     = true
  enable_http_endpoint    = true  # Enable Data API
}

resource "aws_rds_cluster_instance" "serverless" {
  cluster_identifier = aws_rds_cluster.serverless.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.serverless.engine
  engine_version     = aws_rds_cluster.serverless.engine_version

  serverlessv2_scaling_configuration {
    max_capacity = 64.0
    min_capacity = 0.5
  }
}
```

### 20. Restore from snapshot
```hcl
resource "aws_db_instance" "restored" {
  identifier          = "app-db-restored"
  snapshot_identifier = var.snapshot_id
  instance_class      = "db.t3.medium"
  skip_final_snapshot = true

  # Override settings from snapshot as needed
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}
```

### 21. Enhanced monitoring
```hcl
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_db_instance" "monitored" {
  identifier          = "monitored-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  username            = "admin"
  password            = var.db_password
  monitoring_interval = 15  # Enhanced monitoring every 15 seconds
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  skip_final_snapshot = true
}
```

### 22. IAM authentication
```hcl
resource "aws_db_instance" "iam_auth" {
  identifier               = "iam-auth-db"
  engine                   = "postgres"
  engine_version           = "15.4"
  instance_class           = "db.t3.medium"
  allocated_storage        = 50
  username                 = "dbadmin"
  password                 = var.db_password
  iam_database_authentication_enabled = true
  skip_final_snapshot      = true
}

resource "aws_iam_policy" "rds_iam_auth" {
  name = "rds-iam-auth"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "rds-db:connect"
      Resource = "arn:aws:rds-db:us-east-1:${var.account_id}:dbuser:${aws_db_instance.iam_auth.resource_id}/app_user"
    }]
  })
}
```

### 23. AWS Backup for RDS
```hcl
resource "aws_backup_plan" "rds" {
  name = "rds-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.rds.name
    schedule          = "cron(0 5 * * ? *)"
    start_window      = 60
    completion_window = 300

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
    }
  }
}

resource "aws_backup_selection" "rds" {
  name         = "rds-resources"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.rds.id

  resources = [aws_db_instance.main.arn]
}
```

### 24. Point-in-time recovery
```hcl
resource "aws_db_instance" "pitr" {
  identifier              = "pitr-db"
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = "db.t3.medium"
  allocated_storage       = 100
  username                = "admin"
  password                = var.db_password
  backup_retention_period = 35  # 35 days for PITR
  skip_final_snapshot     = true
}

# Restore to specific point in time
resource "aws_db_instance" "restored_pitr" {
  identifier                  = "app-db-restored-pitr"
  restore_to_point_in_time {
    source_db_instance_identifier = aws_db_instance.pitr.id
    restore_time                  = "2024-01-15T03:00:00Z"
    use_latest_restorable_time    = false
  }
  instance_class      = "db.t3.medium"
  skip_final_snapshot = true
}
```

### 25. Option group (for MySQL features)
```hcl
resource "aws_db_option_group" "mysql" {
  name                     = "mysql80-options"
  option_group_description = "MySQL 8.0 options"
  engine_name              = "mysql"
  major_engine_version     = "8.0"

  option {
    option_name = "MARIADB_AUDIT_PLUGIN"

    option_settings {
      name  = "SERVER_AUDIT_EVENTS"
      value = "CONNECT"
    }
  }
}
```

---

## Nested

### 26. Aurora module with cluster and instances
```hcl
module "aurora" {
  source = "./modules/aurora"

  name        = "app-db"
  environment = "production"

  engine         = "aurora-postgresql"
  engine_version = "15.4"
  instance_class = "db.r6g.large"
  instance_count = 3  # 1 writer + 2 readers

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnet_ids

  master_username = "dbadmin"
  master_password = var.db_password

  encryption = {
    enabled     = true
    kms_key_arn = aws_kms_key.rds.arn
  }

  backup = {
    retention_days = 14
    window         = "03:00-04:00"
    copy_to_region = "us-west-2"
  }

  monitoring = {
    enhanced_interval    = 15
    performance_insights = true
    insights_retention   = 7
  }

  proxy = {
    enabled          = true
    max_connections  = 90
    idle_timeout     = 1800
    require_tls      = true
    secret_arn       = aws_secretsmanager_secret.db.arn
  }

  deletion_protection = true
  apply_immediately   = false

  tags = local.common_tags
}
```

### 27. Multiple databases with for_each
```hcl
locals {
  databases = {
    users = {
      engine        = "postgres"
      version       = "15.4"
      instance      = "db.t3.medium"
      storage       = 100
      multi_az      = false
    }
    orders = {
      engine        = "postgres"
      version       = "15.4"
      instance      = "db.r6g.large"
      storage       = 500
      multi_az      = true
    }
    analytics = {
      engine        = "mysql"
      version       = "8.0"
      instance      = "db.t3.large"
      storage       = 200
      multi_az      = false
    }
  }
}

resource "aws_db_instance" "databases" {
  for_each = local.databases

  identifier          = "app-${each.key}-db"
  engine              = each.value.engine
  engine_version      = each.value.version
  instance_class      = each.value.instance
  allocated_storage   = each.value.storage
  multi_az            = each.value.multi_az
  username            = "admin"
  password            = var.db_passwords[each.key]
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.rds.arn
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
}
```

### 28. Dynamic parameter group with custom params
```hcl
variable "db_parameters" {
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string, "immediate")
  }))
  default = []
}

resource "aws_db_parameter_group" "custom" {
  name   = "custom-postgres15"
  family = "postgres15"

  dynamic "parameter" {
    for_each = var.db_parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = parameter.value.apply_method
    }
  }
}
```

### 29. RDS with blue-green deployment
```hcl
resource "aws_db_instance" "main" {
  identifier          = "production-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.r6g.large"
  allocated_storage   = 500
  username            = "admin"
  password            = var.db_password
  storage_encrypted   = true
  multi_az            = true
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "production-db-final"
}

# Blue-green deployment (managed by AWS)
resource "null_resource" "blue_green_upgrade" {
  triggers = {
    target_version = var.target_engine_version
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws rds create-blue-green-deployment \
        --blue-green-deployment-name production-db-upgrade \
        --source ${aws_db_instance.main.arn} \
        --target-engine-version ${var.target_engine_version}
    EOT
  }
}
```

### 30. Aurora with read replica auto-scaling
```hcl
resource "aws_appautoscaling_target" "aurora" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "cluster:${aws_rds_cluster.aurora.cluster_identifier}"
  scalable_dimension = "rds:cluster:ReadReplicaCount"
  service_namespace  = "rds"
}

resource "aws_appautoscaling_policy" "aurora_cpu" {
  name               = "aurora-replica-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.aurora.resource_id
  scalable_dimension = aws_appautoscaling_target.aurora.scalable_dimension
  service_namespace  = aws_appautoscaling_target.aurora.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

### 31. RDS with Database Activity Streams
```hcl
resource "aws_rds_cluster" "audited" {
  cluster_identifier     = "audited-cluster"
  engine                 = "aurora-postgresql"
  engine_version         = "15.4"
  master_username        = "admin"
  master_password        = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  skip_final_snapshot    = false
  final_snapshot_identifier = "audited-cluster-final"
}

resource "null_resource" "enable_activity_streams" {
  depends_on = [aws_rds_cluster_instance.audited]

  provisioner "local-exec" {
    command = <<-EOT
      aws rds start-activity-stream \
        --resource-arn ${aws_rds_cluster.audited.arn} \
        --mode async \
        --kms-key-id ${aws_kms_key.rds.arn} \
        --apply-immediately
    EOT
  }
}
```

### 32. RDS Proxy with IAM authentication
```hcl
resource "aws_db_proxy" "iam_auth" {
  name                   = "app-proxy-iam"
  debug_logging          = false
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_security_group_ids = [aws_security_group.proxy.id]
  vpc_subnet_ids         = var.private_subnet_ids

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "REQUIRED"  # Force IAM authentication
    secret_arn  = aws_secretsmanager_secret.db.arn
    client_password_auth_type = "POSTGRES_SCRAM_SHA_256"
  }
}

# IAM policy for proxy access
resource "aws_iam_policy" "proxy_access" {
  name = "rds-proxy-access"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "rds-db:connect"
      Resource = "arn:aws:rds-db:us-east-1:${var.account_id}:dbuser:${aws_db_proxy.iam_auth.id}/app_user"
    }]
  })
}
```

### 33. DynamoDB table with GSI and LSI
```hcl
resource "aws_dynamodb_table" "orders" {
  name             = "orders"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "pk"
  range_key        = "sk"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute { name = "pk";          type = "S" }
  attribute { name = "sk";          type = "S" }
  attribute { name = "customerId";  type = "S" }
  attribute { name = "createdAt";   type = "S" }
  attribute { name = "status";      type = "S" }

  global_secondary_index {
    name            = "CustomerOrders"
    hash_key        = "customerId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "OrdersByStatus"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "INCLUDE"
    non_key_attributes = ["pk", "sk", "customerId", "total"]
  }

  local_secondary_index {
    name            = "OrdersByDate"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamo.arn
  }
}
```

---

## Advanced

### 34. Complete Aurora production cluster
```hcl
module "aurora_production" {
  source = "./modules/aurora-production"

  name        = "core-database"
  environment = "production"
  region      = "us-east-1"

  engine = {
    type    = "aurora-postgresql"
    version = "15.4"
  }

  instances = {
    writer  = { class = "db.r6g.2xlarge", count = 1 }
    readers = { class = "db.r6g.xlarge",  count = 2 }
  }

  networking = {
    vpc_id     = module.vpc.vpc_id
    subnet_ids = module.vpc.database_subnet_ids
    allowed_security_group_ids = [module.app_sg.id, module.proxy_sg.id]
  }

  security = {
    kms_key_arn       = aws_kms_key.rds.arn
    iam_auth_enabled  = true
    tls_required      = true
    deletion_protection = true
  }

  backup = {
    retention_days    = 35
    backup_window     = "03:00-04:00"
    maintenance_window = "Mon:05:00-Mon:06:00"
    cross_region_copy = {
      enabled     = true
      target_region = "us-west-2"
      kms_key_arn   = aws_kms_key.rds_west.arn
    }
  }

  proxy = {
    enabled             = true
    idle_timeout        = 1800
    max_connections_pct = 90
    secret_arn          = aws_secretsmanager_secret.db.arn
  }

  monitoring = {
    enhanced_interval      = 15
    performance_insights   = true
    insights_retention     = 731  # 2 years (paid)
    alarms = {
      cpu_threshold     = 80
      storage_threshold = 10737418240
      read_latency_ms   = 20
      write_latency_ms  = 20
    }
    alert_topic_arn = aws_sns_topic.alerts.arn
  }

  auto_scaling = {
    enabled     = true
    min_readers = 1
    max_readers = 10
    cpu_target  = 70
  }

  global_cluster = {
    enabled           = true
    secondary_regions = ["us-west-2"]
  }

  tags = local.common_tags
}
```

### 35. DynamoDB global tables (multi-region)
```hcl
resource "aws_dynamodb_table" "global" {
  name             = "global-sessions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "sessionId"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  table_class      = "STANDARD"

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  replica {
    region_name = "us-west-2"
  }

  replica {
    region_name = "eu-west-1"
  }
}
```

### 36. ElastiCache Redis cluster
```hcl
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "app-redis"
  description          = "Application Redis cache"
  node_type            = "cache.r6g.large"
  num_cache_clusters   = 3
  port                 = 6379
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token             = var.redis_auth_token
  auto_minor_version_upgrade = true
  automatic_failover_enabled = true
  multi_az_enabled           = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
}
```

### 37. RDS with Database Migration Service (DMS)
```hcl
resource "aws_dms_replication_instance" "main" {
  allocated_storage            = 50
  apply_immediately            = true
  auto_minor_version_upgrade   = true
  engine_version               = "3.5.1"
  multi_az                     = false
  preferred_maintenance_window = "sun:10:30-sun:14:30"
  publicly_accessible          = false
  replication_instance_class   = "dms.t3.medium"
  replication_instance_id      = "app-migration"
  replication_subnet_group_id  = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids       = [aws_security_group.dms.id]
}

resource "aws_dms_endpoint" "source" {
  endpoint_id   = "source-mysql"
  endpoint_type = "source"
  engine_name   = "mysql"
  server_name   = var.source_db_host
  port          = 3306
  username      = var.source_db_user
  password      = var.source_db_password
  database_name = var.source_db_name
}

resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-aurora"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"
  server_name   = aws_rds_cluster.aurora.endpoint
  port          = 5432
  username      = "dbadmin"
  password      = var.db_password
  database_name = "appdb"
}
```

### 38. RDS with Lake Formation integration
```hcl
resource "aws_glue_connection" "rds" {
  name = "rds-connection"

  connection_properties = {
    JDBC_CONNECTION_URL = "jdbc:postgresql://${aws_db_instance.main.address}:5432/appdb"
    USERNAME            = "glue_user"
    PASSWORD            = var.glue_db_password
  }

  physical_connection_requirements {
    availability_zone      = var.availability_zone
    security_group_id_list = [aws_security_group.glue.id]
    subnet_id              = var.private_subnet_id
  }
}
```

### 39. Cost-optimized RDS for non-production
```hcl
module "dev_database" {
  source = "./modules/rds"

  name        = "app-dev"
  environment = "development"

  instance_class      = "db.t4g.micro"   # Graviton, smallest
  allocated_storage   = 20
  storage_type        = "gp2"            # Cheapest storage
  engine              = "postgres"
  engine_version      = "15.4"
  multi_az            = false            # No HA in dev
  deletion_protection = false
  skip_final_snapshot = true
  apply_immediately   = true

  # Auto-stop on weekends
  auto_stop_schedule  = "cron(0 22 ? * FRI *)"
  auto_start_schedule = "cron(0 7 ? * MON *)"

  backup_retention_period = 1            # Minimal backup
  monitoring_interval     = 0            # No enhanced monitoring

  tags = merge(local.common_tags, { CostCenter = "dev" })
}
```

### 40. RDS with custom DNS endpoint
```hcl
resource "aws_route53_zone" "internal" {
  name = "internal.example.com"

  vpc {
    vpc_id = module.vpc.vpc_id
  }
}

resource "aws_route53_record" "db" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "db.internal.example.com"
  type    = "CNAME"
  ttl     = 60
  records = [aws_db_instance.main.address]
}

resource "aws_route53_record" "db_read" {
  zone_id = aws_route53_zone.internal.zone_id
  name    = "db-read.internal.example.com"
  type    = "CNAME"
  ttl     = 60
  records = [aws_rds_cluster.aurora.reader_endpoint]
}
```

### 41. Complete database tier module
```hcl
module "database_tier" {
  source = "./modules/database-tier"

  name        = "ecommerce"
  environment = "production"

  primary_db = {
    type    = "aurora"
    engine  = "aurora-postgresql"
    version = "15.4"
    writer  = { class = "db.r6g.2xlarge" }
    readers = { class = "db.r6g.xlarge", count = 3 }
  }

  cache = {
    enabled    = true
    type       = "redis"
    node_type  = "cache.r6g.large"
    replicas   = 2
    multi_az   = true
  }

  proxy = {
    enabled          = true
    idle_timeout     = 1800
    max_connections  = 90
  }

  security = {
    vpc_id             = module.vpc.vpc_id
    subnet_ids         = module.vpc.database_subnet_ids
    app_security_group = module.app_sg.id
    kms_key_arn        = aws_kms_key.rds.arn
    iam_auth           = true
  }

  backup = {
    automated_retention = 35
    cross_region        = true
    dr_region           = "us-west-2"
    point_in_time       = true
  }

  monitoring = {
    enhanced           = true
    performance_insights = true
    slow_query_ms      = 1000
    alert_topic_arn    = aws_sns_topic.alerts.arn
  }

  secrets_manager = {
    rotate_days = 30
    kms_key_arn = aws_kms_key.secrets.arn
  }

  tags = local.common_tags
}
```

### 42. Aurora with query logging to S3
```hcl
resource "aws_db_cluster_parameter_group" "audit" {
  family = "aurora-postgresql15"
  name   = "aurora-audit-params"

  parameter {
    name  = "pgaudit.log"
    value = "ddl, write"
  }

  parameter {
    name  = "pgaudit.log_catalog"
    value = "0"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pgaudit"
    apply_method = "pending-reboot"
  }
}

resource "aws_rds_cluster" "audited" {
  cluster_identifier              = "audited-aurora"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  master_username                 = "admin"
  master_password                 = var.db_password
  db_cluster_parameter_group_name = aws_db_cluster_parameter_group.audit.name
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  storage_encrypted               = true
  skip_final_snapshot             = false
  final_snapshot_identifier       = "audited-aurora-final"

  enabled_cloudwatch_logs_exports = ["postgresql"]
}
```

### 43. RDS Multi-AZ with automatic failover testing
```hcl
resource "aws_cloudwatch_event_rule" "rds_failover" {
  name = "rds-failover-test"

  event_pattern = jsonencode({
    source      = ["aws.rds"]
    detail-type = ["RDS DB Instance Event"]
    detail = {
      EventID = ["RDS-EVENT-0049", "RDS-EVENT-0050"]  # Failover events
    }
  })
}

resource "aws_cloudwatch_event_target" "notify_failover" {
  rule  = aws_cloudwatch_event_rule.rds_failover.name
  arn   = aws_sns_topic.alerts.arn
  input_transformer {
    input_paths = {
      instance = "$.detail.SourceIdentifier"
      message  = "$.detail.Message"
    }
    input_template = "\"RDS Failover occurred for <instance>: <message>\""
  }
}
```

### 44. DynamoDB with on-demand and auto-scaling
```hcl
resource "aws_dynamodb_table" "adaptive" {
  name         = "adaptive-table"
  billing_mode = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key     = "pk"
  range_key    = "sk"

  attribute { name = "pk"; type = "S" }
  attribute { name = "sk"; type = "S" }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}

resource "aws_appautoscaling_target" "dynamo_read" {
  max_capacity       = 1000
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.adaptive.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamo_read" {
  name               = "dynamo-read-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamo_read.resource_id
  scalable_dimension = aws_appautoscaling_target.dynamo_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamo_read.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
  }
}
```

### 45. Neptune graph database
```hcl
resource "aws_neptune_cluster" "graph" {
  cluster_identifier                  = "app-graph"
  engine                              = "neptune"
  engine_version                      = "1.2.1.0"
  backup_retention_period             = 14
  preferred_backup_window             = "02:00-03:00"
  skip_final_snapshot                 = false
  final_snapshot_identifier           = "app-graph-final"
  iam_database_authentication_enabled = true
  apply_immediately                   = false
  storage_encrypted                   = true
  kms_key_arn                         = aws_kms_key.rds.arn
  vpc_security_group_ids              = [aws_security_group.neptune.id]
  db_subnet_group_name                = aws_neptune_subnet_group.main.name
  deletion_protection                 = true
}

resource "aws_neptune_cluster_instance" "graph" {
  count              = 2
  cluster_identifier = aws_neptune_cluster.graph.id
  engine             = "neptune"
  instance_class     = "db.r6g.large"
}
```

### 46. DocumentDB (MongoDB compatible)
```hcl
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "app-docdb"
  engine                  = "docdb"
  master_username         = "docdbadmin"
  master_password         = var.docdb_password
  backup_retention_period = 14
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = false
  final_snapshot_identifier = "app-docdb-final"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.rds.arn
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]
  deletion_protection     = true
}

resource "aws_docdb_cluster_instance" "main" {
  count              = 3
  identifier         = "docdb-instance-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = "db.r6g.large"
}
```

### 47. Timestream for time-series data
```hcl
resource "aws_timestreamwrite_database" "metrics" {
  database_name = "app-metrics"
  kms_key_id    = aws_kms_key.timestream.arn
}

resource "aws_timestreamwrite_table" "sensor_data" {
  database_name = aws_timestreamwrite_database.metrics.database_name
  table_name    = "sensor-readings"

  retention_properties {
    magnetic_store_retention_period_in_days = 365
    memory_store_retention_period_in_hours  = 24
  }

  magnetic_store_write_properties {
    enable_magnetic_store_writes = true
    magnetic_store_rejected_data_location {
      s3_configuration {
        bucket_name       = aws_s3_bucket.timestream_errors.id
        encryption_option = "SSE_KMS"
        kms_key_id        = aws_kms_key.timestream.arn
      }
    }
  }
}
```

### 48. RDS with Terraform output for app configuration
```hcl
output "database_config" {
  description = "Database connection configuration"
  sensitive   = true

  value = {
    writer_endpoint = aws_rds_cluster.aurora.endpoint
    reader_endpoint = aws_rds_cluster.aurora.reader_endpoint
    proxy_endpoint  = aws_db_proxy.main.endpoint
    port            = aws_rds_cluster.aurora.port
    database        = aws_rds_cluster.aurora.database_name
    secret_arn      = aws_secretsmanager_secret.db.arn
  }
}

output "connection_string" {
  description = "Proxy connection string"
  sensitive   = true
  value       = "postgresql://dbadmin@${aws_db_proxy.main.endpoint}:${aws_rds_cluster.aurora.port}/${aws_rds_cluster.aurora.database_name}"
}
```

### 49. Complete data persistence stack
```hcl
module "data_stack" {
  source = "./modules/data-persistence"

  name        = "ecommerce"
  environment = "production"

  relational = {
    aurora_postgresql = {
      version        = "15.4"
      writer_class   = "db.r6g.2xlarge"
      reader_class   = "db.r6g.xlarge"
      reader_count   = 3
      auto_scale     = true
      max_readers    = 10
    }
  }

  cache = {
    redis = {
      node_type  = "cache.r6g.large"
      cluster_size = 3
      multi_az   = true
    }
  }

  search = {
    opensearch = {
      instance_type   = "r6g.large.search"
      instance_count  = 3
      master_nodes    = 3
      master_type     = "r6g.medium.search"
      ebs_volume_size = 100
    }
  }

  analytics = {
    dynamodb_global_tables = {
      regions     = ["us-east-1", "us-west-2"]
      billing     = "PAY_PER_REQUEST"
    }
  }

  security = {
    kms_key_arn        = aws_kms_key.data.arn
    vpc_id             = module.vpc.vpc_id
    subnet_ids         = module.vpc.database_subnet_ids
    app_sg_id          = module.app_sg.id
  }

  tags = local.common_tags
}
```

### 50. Production database observability
```hcl
module "db_observability" {
  source = "./modules/db-observability"

  cluster_id         = aws_rds_cluster.aurora.cluster_identifier
  cluster_arn        = aws_rds_cluster.aurora.arn
  instance_ids       = [for i in aws_rds_cluster_instance.aurora : i.id]
  proxy_id           = aws_db_proxy.main.id
  dynamo_table_names = [aws_dynamodb_table.orders.name, aws_dynamodb_table.users.name]
  redis_cluster_id   = aws_elasticache_replication_group.redis.id

  alarms = {
    aurora_cpu_threshold         = 80
    aurora_replica_lag_ms        = 1000
    aurora_deadlocks_threshold   = 5
    aurora_connections_threshold = 1000
    redis_cpu_threshold          = 80
    redis_memory_threshold       = 80
    dynamo_throttle_threshold    = 10
  }

  dashboards = {
    create = true
    include_slow_queries = true
    include_connections  = true
    include_replication  = true
  }

  log_group_retention_days = 90
  alert_topic_arn          = aws_sns_topic.alerts.arn
  pagerduty_topic_arn      = aws_sns_topic.pagerduty.arn

  tags = local.common_tags
}
```
