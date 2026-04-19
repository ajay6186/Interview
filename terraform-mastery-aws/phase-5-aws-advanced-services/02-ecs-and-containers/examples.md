# Examples 5.2 — ECS & Containers (50 examples)

---

## Basic

### 1. ECS cluster
```hcl
resource "aws_ecs_cluster" "main" {
  name = "my-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

### 2. Simple Fargate task definition
```hcl
resource "aws_ecs_task_definition" "app" {
  family                   = "my-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "app"
    image     = "nginx:latest"
    essential = true
    portMappings = [{ containerPort = 80, protocol = "tcp" }]
  }])
}
```

### 3. ECS IAM execution role
```hcl
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
```

### 4. Fargate ECS service
```hcl
resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }
}
```

### 5. ECR repository
```hcl
resource "aws_ecr_repository" "app" {
  name                 = "my-app"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
```

### 6. ECS service with ALB
```hcl
resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}
```

### 7. CloudWatch log group for ECS
```hcl
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/my-app"
  retention_in_days = 30
}

# In container definitions:
# "logConfiguration": {
#   "logDriver": "awslogs",
#   "options": {
#     "awslogs-group": "/ecs/my-app",
#     "awslogs-region": "us-east-1",
#     "awslogs-stream-prefix": "ecs"
#   }
# }
```

### 8. ECR lifecycle policy
```hcl
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Delete untagged after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      }
    ]
  })
}
```

### 9. ECS task definition with environment variables
```hcl
resource "aws_ecs_task_definition" "app" {
  family                   = "my-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 8080 }]
    environment = [
      { name = "APP_ENV",    value = var.environment },
      { name = "LOG_LEVEL",  value = "INFO" }
    ]
  }])
}
```

### 10. ECS service auto-scaling
```hcl
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 20
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "ecs-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

### 11. ECS with secrets from Secrets Manager
```hcl
resource "aws_secretsmanager_secret" "db" {
  name = "prod/app/db"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "my-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:latest"
    essential = true
    secrets = [
      { name = "DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.db.arn}:password::" },
      { name = "DB_USERNAME", valueFrom = "${aws_secretsmanager_secret.db.arn}:username::" }
    ]
  }])
}
```

### 12. ECS exec enabled
```hcl
resource "aws_ecs_service" "app" {
  name                   = "my-app"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.app.arn
  desired_count          = 1
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.app.id]
  }
}
```

---

## Intermediate

### 13. ECS capacity providers (Fargate + Fargate Spot)
```hcl
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 4

  capacity_provider_strategy {
    base              = 1
    weight            = 20
    capacity_provider = "FARGATE"
  }

  capacity_provider_strategy {
    weight            = 80
    capacity_provider = "FARGATE_SPOT"
  }
}
```

### 14. ECS service discovery via Cloud Map
```hcl
resource "aws_service_discovery_private_dns_namespace" "internal" {
  name = "internal.local"
  vpc  = module.vpc.vpc_id
}

resource "aws_service_discovery_service" "app" {
  name = "my-app"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.internal.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.app.id]
  }

  service_registries {
    registry_arn = aws_service_discovery_service.app.arn
  }
}
```

### 15. Multi-container task definition (sidecar)
```hcl
resource "aws_ecs_task_definition" "with_sidecar" {
  family                   = "app-with-sidecar"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [{ containerPort = 8080 }]
      dependsOn = [{ containerName = "datadog-agent", condition = "START" }]
    },
    {
      name      = "datadog-agent"
      image     = "datadog/agent:latest"
      essential = false
      environment = [
        { name = "DD_API_KEY",            value = var.datadog_api_key },
        { name = "ECS_FARGATE",           value = "true" },
        { name = "DD_APM_ENABLED",        value = "true" }
      ]
    }
  ])
}
```

### 16. ECS with EFS volume
```hcl
resource "aws_efs_file_system" "app" {
  encrypted        = true
  kms_key_id       = aws_kms_key.efs.arn
  throughput_mode  = "elastic"
}

resource "aws_ecs_task_definition" "with_efs" {
  family                   = "app-with-efs"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  volume {
    name = "shared-data"
    efs_volume_configuration {
      file_system_id          = aws_efs_file_system.app.id
      transit_encryption      = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.app.id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:latest"
    essential = true
    mountPoints = [{ sourceVolume = "shared-data", containerPath = "/data" }]
  }])
}
```

### 17. ECS scheduled task
```hcl
resource "aws_cloudwatch_event_rule" "batch_job" {
  name                = "ecs-batch-job"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "ecs" {
  rule     = aws_cloudwatch_event_rule.batch_job.name
  arn      = aws_ecs_cluster.main.arn
  role_arn = aws_iam_role.events.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.batch.arn
    launch_type         = "FARGATE"

    network_configuration {
      subnets         = var.private_subnet_ids
      security_groups = [aws_security_group.batch.id]
    }
  }
}
```

### 18. Container Insights with CloudWatch dashboard
```hcl
resource "aws_ecs_cluster" "main" {
  name = "production"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
}
```

### 19. Blue-green with CodeDeploy
```hcl
resource "aws_codedeploy_app" "ecs" {
  compute_platform = "ECS"
  name             = "my-app"
}

resource "aws_codedeploy_deployment_group" "ecs" {
  app_name               = aws_codedeploy_app.ecs.name
  deployment_group_name  = "production"
  deployment_config_name = "CodeDeployDefault.ECSLinear10PercentEvery1Minutes"
  service_role_arn       = aws_iam_role.codedeploy.arn

  ecs_service {
    cluster_name = aws_ecs_cluster.main.name
    service_name = aws_ecs_service.app.name
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [aws_lb_listener.https.arn]
      }
      target_group {
        name = aws_lb_target_group.blue.name
      }
      target_group {
        name = aws_lb_target_group.green.name
      }
    }
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
}
```

### 20. ECS Service Connect
```hcl
resource "aws_ecs_cluster" "main" {
  name = "service-connect-cluster"

  service_connect_defaults {
    namespace = aws_service_discovery_http_namespace.main.arn
  }
}

resource "aws_ecs_service" "backend" {
  name            = "backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.backend.id]
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.main.arn

    service {
      port_name      = "http"
      discovery_name = "backend"

      client_alias {
        port     = 8080
        dns_name = "backend"
      }
    }
  }
}
```

### 21. Cross-account ECR access
```hcl
resource "aws_ecr_repository_policy" "cross_account" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCrossAccount"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${var.consumer_account_id}:root"
      }
      Action = [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability"
      ]
    }]
  })
}
```

### 22. ECS task placement strategies
```hcl
resource "aws_ecs_service" "spread" {
  name            = "spread-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 6

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "instanceId"
  }
}
```

### 23. ECS with Parameter Store
```hcl
resource "aws_ssm_parameter" "config" {
  name  = "/app/production/config"
  type  = "SecureString"
  value = jsonencode({ feature_flag = true, timeout = 30 })
}

resource "aws_iam_role_policy" "ssm_access" {
  name = "ssm-read"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameters", "kms:Decrypt"]
      Resource = [aws_ssm_parameter.config.arn, aws_kms_key.ssm.arn]
    }]
  })
}
```

### 24. ECS on EC2 with Auto Scaling Group
```hcl
resource "aws_launch_template" "ecs" {
  name_prefix   = "ecs-node-"
  image_id      = data.aws_ami.ecs_optimized.id
  instance_type = "c5.xlarge"

  user_data = base64encode(<<-EOT
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
    echo ECS_ENABLE_SPOT_INSTANCE_DRAINING=true >> /etc/ecs/ecs.config
  EOT
  )

  iam_instance_profile {
    arn = aws_iam_instance_profile.ecs_node.arn
  }
}

resource "aws_autoscaling_group" "ecs" {
  name                = "ecs-nodes"
  min_size            = 2
  max_size            = 20
  vpc_zone_identifier = var.private_subnet_ids

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.ecs.id
        version            = "$Latest"
      }
    }
    instances_distribution {
      on_demand_base_capacity                  = 2
      on_demand_percentage_above_base_capacity = 20
      spot_allocation_strategy                 = "capacity-optimized"
    }
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = ""
    propagate_at_launch = true
  }
}
```

### 25. ECS Anywhere (on-premises)
```hcl
resource "aws_ecs_cluster" "hybrid" {
  name = "hybrid-cluster"
}

# Register external instance
resource "null_resource" "register_external" {
  provisioner "local-exec" {
    command = <<-EOT
      aws ecs create-capacity-provider \
        --name on-prem-servers \
        --auto-scaling-group-provider autoScalingGroupArn=${var.asg_arn},managedScaling='{status=DISABLED}' \
        --region ${var.region}
    EOT
  }
}
```

---

## Nested

### 26. Complete ECS microservice module
```hcl
module "api_service" {
  source = "./modules/ecs-service"

  name        = "api"
  environment = "production"
  cluster_id  = aws_ecs_cluster.main.id

  container = {
    image  = "${aws_ecr_repository.api.repository_url}:${var.image_tag}"
    cpu    = 512
    memory = 1024
    port   = 8080
  }

  scaling = {
    min_capacity     = 3
    max_capacity     = 50
    cpu_target       = 70
    memory_target    = 80
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }

  load_balancer = {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  vpc = {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [module.sg.api_id]
  }

  secrets = {
    DB_PASSWORD = aws_secretsmanager_secret.db.arn
    API_KEY     = aws_secretsmanager_secret.api_key.arn
  }

  environment_variables = {
    APP_ENV  = "production"
    LOG_LEVEL = "INFO"
  }

  enable_execute_command    = false
  enable_service_discovery  = true
  discovery_namespace_id    = aws_service_discovery_private_dns_namespace.internal.id

  tags = local.common_tags
}
```

### 27. Multi-service ECS platform with for_each
```hcl
locals {
  services = {
    api = {
      cpu = 512, memory = 1024, port = 8080, desired = 3
      image = "${aws_ecr_repository.api.repository_url}:${var.api_tag}"
    }
    worker = {
      cpu = 1024, memory = 2048, port = null, desired = 2
      image = "${aws_ecr_repository.worker.repository_url}:${var.worker_tag}"
    }
    scheduler = {
      cpu = 256, memory = 512, port = null, desired = 1
      image = "${aws_ecr_repository.scheduler.repository_url}:${var.scheduler_tag}"
    }
  }
}

resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = each.key
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task[each.key].arn

  container_definitions = jsonencode([{
    name      = each.key
    image     = each.value.image
    essential = true
    portMappings = each.value.port != null ? [{ containerPort = each.value.port }] : []
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${each.key}"
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "services" {
  for_each = local.services

  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = each.value.desired
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.services[each.key].id]
  }
}
```

### 28. ECS with blue-green and traffic shifting
```hcl
resource "aws_lb_target_group" "blue" {
  name     = "app-blue"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 10
  }
}

resource "aws_lb_target_group" "green" {
  name     = "app-green"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 10
  }
}

resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 4

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "app"
    container_port   = 8080
  }

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.app.id]
  }

  lifecycle {
    ignore_changes = [task_definition, load_balancer]
  }
}
```

### 29. ECS with auto-scaling on custom metric
```hcl
resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  alarm_name          = "sqs-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 100

  dimensions = {
    QueueName = aws_sqs_queue.jobs.name
  }

  alarm_actions = [aws_appautoscaling_policy.scale_out.arn]
}

resource "aws_appautoscaling_policy" "scale_out" {
  name               = "scale-out-on-queue"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = "ecs"

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      scaling_adjustment          = 2
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 500
    }

    step_adjustment {
      scaling_adjustment          = 5
      metric_interval_lower_bound = 500
    }
  }
}
```

### 30. ECS with AWS App Mesh sidecar
```hcl
resource "aws_appmesh_mesh" "main" {
  name = "production"

  spec {
    egress_filter {
      type = "ALLOW_ALL"
    }
  }
}

resource "aws_appmesh_virtual_node" "api" {
  mesh_name = aws_appmesh_mesh.main.name
  name      = "api"

  spec {
    listener {
      port_mapping {
        port     = 8080
        protocol = "http"
      }
      health_check {
        path                = "/health"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        interval_millis     = 5000
        timeout_millis      = 2000
        protocol            = "http"
      }
    }

    service_discovery {
      aws_cloud_map {
        namespace_name = aws_service_discovery_private_dns_namespace.internal.name
        service_name   = aws_service_discovery_service.api.name
      }
    }
  }
}
```

### 31. ECS cluster with mixed capacity providers
```hcl
resource "aws_ecs_capacity_provider" "spot" {
  name = "fargate-spot"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.spot.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      status          = "ENABLED"
      target_capacity = 80
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "mixed" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT", aws_ecs_capacity_provider.spot.name]

  default_capacity_provider_strategy {
    base              = 2
    weight            = 40
    capacity_provider = "FARGATE"
  }

  default_capacity_provider_strategy {
    weight            = 60
    capacity_provider = "FARGATE_SPOT"
  }
}
```

### 32. ECS task with GPU support
```hcl
resource "aws_ecs_task_definition" "ml_inference" {
  family                   = "ml-inference"
  requires_compatibilities = ["EC2"]
  network_mode             = "awsvpc"
  cpu                      = 4096
  memory                   = 16384
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "inference"
    image     = "${aws_ecr_repository.ml.repository_url}:latest"
    essential = true
    resourceRequirements = [
      { type = "GPU", value = "1" }
    ]
    portMappings = [{ containerPort = 8080 }]
  }])
}
```

### 33. ECS service with deployment circuit breaker
```hcl
resource "aws_ecs_service" "app" {
  name            = "my-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  health_check_grace_period_seconds  = 60

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.app.id]
  }
}
```

---

## Advanced

### 34. Complete ECS platform with all patterns
```hcl
module "ecs_platform" {
  source = "./modules/ecs-platform"

  name        = "production"
  environment = "prod"
  region      = "us-east-1"

  cluster = {
    container_insights = "enabled"
    capacity_providers = {
      fargate      = { base = 2, weight = 30 }
      fargate_spot = { base = 0, weight = 70 }
    }
  }

  services = {
    api = {
      image           = "${aws_ecr_repository.api.repository_url}:${var.api_tag}"
      cpu             = 1024
      memory          = 2048
      desired_count   = 5
      port            = 8080
      health_path     = "/health"
      alb_target_group = aws_lb_target_group.api.arn
      scaling = { min = 3, max = 100, cpu_target = 70 }
      secrets = { DB_URL = aws_secretsmanager_secret.db.arn }
    }
  }

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  kms_key_arn        = aws_kms_key.ecs.arn

  enable_blue_green         = true
  enable_service_connect    = true
  enable_execute_command    = false
  enable_container_insights = true

  tags = local.common_tags
}
```

### 35. GitOps ECS deployment pipeline
```hcl
resource "aws_codepipeline" "ecs" {
  name     = "ecs-deploy"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
    encryption_key {
      id   = aws_kms_key.pipeline.arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"
    action {
      name             = "ECR"
      category         = "Source"
      owner            = "AWS"
      provider         = "ECR"
      version          = "1"
      output_artifacts = ["source"]
      configuration = {
        RepositoryName = aws_ecr_repository.app.name
        ImageTag       = "latest"
      }
    }
  }

  stage {
    name = "Deploy"
    action {
      name            = "DeployToECS"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "CodeDeployToECS"
      version         = "1"
      input_artifacts = ["source"]
      configuration = {
        ApplicationName                = aws_codedeploy_app.ecs.name
        DeploymentGroupName            = aws_codedeploy_deployment_group.ecs.deployment_group_name
        TaskDefinitionTemplateArtifact = "source"
        AppSpecTemplateArtifact        = "source"
      }
    }
  }
}
```

### 36. ECS with Datadog full observability
```hcl
locals {
  datadog_firelens_config = {
    type = "fluentbit"
    options = {
      enable-ecs-log-metadata = "true"
      config-file-type        = "file"
      config-file-value       = "/fluent-bit/configs/parse-json.conf"
    }
  }
}

resource "aws_ecs_task_definition" "observed" {
  family                   = "observed-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [{ containerPort = 8080 }]
      logConfiguration = {
        logDriver = "awsfirelens"
        options = {
          Name       = "datadog"
          Host       = "http-intake.logs.datadoghq.com"
          TLS        = "on"
          dd_service = "my-app"
          dd_source  = "ecs"
          provider   = "ecs"
        }
        secretOptions = [{
          name      = "apikey"
          valueFrom = aws_secretsmanager_secret.datadog_api_key.arn
        }]
      }
      environment = [
        { name = "DD_SERVICE", value = "my-app" },
        { name = "DD_ENV",     value = "production" }
      ]
    },
    {
      name              = "datadog-agent"
      image             = "public.ecr.aws/datadog/agent:latest"
      essential         = false
      portMappings      = [{ containerPort = 8126, protocol = "tcp" }]
      environment = [
        { name = "ECS_FARGATE",    value = "true" },
        { name = "DD_APM_ENABLED", value = "true" }
      ]
      secrets = [{ name = "DD_API_KEY", valueFrom = aws_secretsmanager_secret.datadog_api_key.arn }]
    },
    {
      name             = "log-router"
      image            = "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable"
      essential        = false
      firelensConfiguration = local.datadog_firelens_config
    }
  ])
}
```

### 37. ECS with multi-region active-active
```hcl
module "ecs_us_east" {
  source    = "./modules/ecs-service"
  providers = { aws = aws }

  name          = "api"
  cluster_id    = aws_ecs_cluster.us_east.id
  image         = "${aws_ecr_repository.api.repository_url}:${var.image_tag}"
  desired_count = 5
  region        = "us-east-1"
}

module "ecs_eu_west" {
  source    = "./modules/ecs-service"
  providers = { aws = aws.eu }

  name          = "api"
  cluster_id    = aws_ecs_cluster.eu_west.id
  image         = "${aws_ecr_repository.api_eu.repository_url}:${var.image_tag}"
  desired_count = 3
  region        = "eu-west-1"
}

resource "aws_route53_record" "api" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "us-east-1"

  alias {
    name                   = module.ecs_us_east.alb_dns_name
    zone_id                = module.ecs_us_east.alb_zone_id
    evaluate_target_health = true
  }

  latency_routing_policy {
    region = "us-east-1"
  }
}
```

### 38. ECS security hardening
```hcl
resource "aws_ecs_task_definition" "hardened" {
  family                   = "hardened-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_least_privilege.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:${var.image_sha}"
    essential = true
    portMappings = [{ containerPort = 8080 }]
    readonlyRootFilesystem = true
    privileged             = false
    user                   = "1000:1000"
    linuxParameters = {
      capabilities = {
        drop = ["ALL"]
        add  = []
      }
      initProcessEnabled = true
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/hardened-app"
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}
```

### 39. ECS with Spot interruption handling
```hcl
resource "aws_ecs_task_definition" "spot_aware" {
  family                   = "spot-aware-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:latest"
    essential = true
    stopTimeout = 120  # 2 minutes to drain before SIGKILL
    portMappings = [{ containerPort = 8080 }]
  }])
}

resource "aws_ecs_service" "spot_tolerant" {
  name            = "spot-tolerant"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.spot_aware.arn
  desired_count   = 10

  capacity_provider_strategy {
    base              = 3  # Always keep 3 on Fargate
    weight            = 20
    capacity_provider = "FARGATE"
  }

  capacity_provider_strategy {
    weight            = 80
    capacity_provider = "FARGATE_SPOT"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}
```

### 40. ECS with AWS Graviton (ARM64)
```hcl
resource "aws_ecs_task_definition" "arm64" {
  family                   = "arm64-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"  # ~20% cost savings vs X86_64
  }

  container_definitions = jsonencode([{
    name      = "app"
    image     = "${aws_ecr_repository.app.repository_url}:latest-arm64"
    essential = true
    portMappings = [{ containerPort = 8080 }]
  }])
}
```

### 41. Complete production ECS with all best practices
```hcl
module "production_ecs" {
  source = "./modules/ecs-production"

  name       = "ecommerce"
  account_id = var.account_id
  region     = "us-east-1"

  cluster = {
    name               = "production"
    container_insights = true
  }

  services = {
    api = {
      image            = "${aws_ecr_repository.api.repository_url}:${var.api_tag}"
      cpu              = 1024
      memory           = 2048
      port             = 8080
      health_path      = "/api/health"
      desired          = 6
      min              = 3
      max              = 100
      cpu_target       = 70
      use_spot         = true
      spot_base        = 2
      spot_weight      = 70
      arm64            = true

      secrets = {
        DATABASE_URL = aws_secretsmanager_secret.db.arn
        REDIS_URL    = aws_secretsmanager_secret.redis.arn
      }

      alb_target_group = aws_lb_target_group.api.arn

      deployment = {
        type             = "CODE_DEPLOY"
        blue_tg          = aws_lb_target_group.blue.arn
        green_tg         = aws_lb_target_group.green.arn
        rollback_enabled = true
      }
    }
  }

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  kms_key_arn        = aws_kms_key.ecs.arn
  log_retention_days = 90

  enable_service_connect = true
  enable_xray           = true
  enable_execute_command = false

  alert_topic_arn = aws_sns_topic.alerts.arn

  tags = local.common_tags
}
```

### 42. ECS with custom domain via private CA
```hcl
resource "aws_acmpca_certificate_authority" "internal" {
  type = "SUBORDINATE"

  certificate_authority_configuration {
    key_algorithm     = "RSA_2048"
    signing_algorithm = "SHA256WITHRSA"

    subject {
      organization = "MyCompany"
      common_name  = "internal.mycompany.com"
    }
  }
}

resource "aws_lb_listener" "internal_https" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.internal.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

### 43. ECS monitoring with composite alarms
```hcl
resource "aws_cloudwatch_composite_alarm" "service_degraded" {
  alarm_name = "ecs-service-degraded"

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.cpu_high.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.memory_high.alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.task_failures.alarm_name})"

  alarm_actions = [aws_sns_topic.pagerduty.arn]
  ok_actions    = [aws_sns_topic.pagerduty.arn]
}

resource "aws_cloudwatch_metric_alarm" "task_failures" {
  alarm_name          = "ecs-task-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = var.desired_count * 0.5  # Alert if < 50% tasks running

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }
}
```

### 44. ECS image scanning and compliance
```hcl
resource "aws_inspector2_enabler" "ecr" {
  account_ids    = [var.account_id]
  resource_types = ["ECR"]
}

resource "aws_ecr_repository" "secure" {
  name                 = "secure-app"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }
}

resource "aws_cloudwatch_event_rule" "ecr_scan_critical" {
  name = "ecr-critical-findings"

  event_pattern = jsonencode({
    source      = ["aws.inspector2"]
    detail-type = ["Inspector2 Finding"]
    detail = {
      severity = ["CRITICAL"]
      resources = { type = ["AWS_ECR_CONTAINER_IMAGE"] }
    }
  })
}
```

### 45. ECS with ADOT (AWS Distro for OpenTelemetry)
```hcl
resource "aws_ecs_task_definition" "otel" {
  family                   = "otel-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.otel_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      portMappings = [{ containerPort = 8080 }]
      environment = [
        { name = "OTEL_EXPORTER_OTLP_ENDPOINT", value = "http://localhost:4317" },
        { name = "OTEL_SERVICE_NAME",            value = "my-app" }
      ]
    },
    {
      name      = "aws-otel-collector"
      image     = "public.ecr.aws/aws-observability/aws-otel-collector:latest"
      essential = false
      command   = ["--config=/etc/ecs/container-insights/otel-task-metrics-config.yaml"]
    }
  ])
}
```

### 46. ECS with Step Functions orchestration
```hcl
resource "aws_sfn_state_machine" "batch_processor" {
  name     = "ecs-batch-processor"
  role_arn = aws_iam_role.sfn.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment = "Run ECS task and wait for completion"
    StartAt = "RunECSTask"
    States = {
      RunECSTask = {
        Type     = "Task"
        Resource = "arn:aws:states:::ecs:runTask.sync"
        Parameters = {
          Cluster        = aws_ecs_cluster.main.arn
          TaskDefinition = aws_ecs_task_definition.batch.arn
          LaunchType     = "FARGATE"
          NetworkConfiguration = {
            AwsvpcConfiguration = {
              Subnets        = var.private_subnet_ids
              SecurityGroups = [aws_security_group.batch.id]
            }
          }
          Overrides = {
            ContainerOverrides = [{
              Name = "batch"
              Environment = [{
                Name  = "JOB_ID"
                "Value.$" = "$.job_id"
              }]
            }]
          }
        }
        End = true
      }
    }
  })
}
```

### 47. ECS cost optimization with KEDA-style scaling
```hcl
resource "aws_appautoscaling_policy" "sqs_based" {
  name               = "scale-on-sqs"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = "ecs"

  target_tracking_scaling_policy_configuration {
    target_value       = 10  # 10 messages per task
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    customized_metric_specification {
      metrics {
        label = "Get the queue size (the number of messages waiting to be processed)"
        id    = "m1"
        metric_stat {
          metric {
            metric_name = "ApproximateNumberOfMessagesVisible"
            namespace   = "AWS/SQS"
            dimensions {
              name  = "QueueName"
              value = aws_sqs_queue.jobs.name
            }
          }
          stat = "Sum"
        }
        return_data = false
      }
      metrics {
        label       = "Get the ECS running task count (the number of currently running tasks)"
        id          = "m2"
        return_data = false
        metric_stat {
          metric {
            metric_name = "RunningTaskCount"
            namespace   = "ECS/ContainerInsights"
            dimensions {
              name  = "ClusterName"
              value = aws_ecs_cluster.main.name
            }
            dimensions {
              name  = "ServiceName"
              value = aws_ecs_service.worker.name
            }
          }
          stat = "Average"
        }
      }
      metrics {
        label       = "Calculate the backlog per instance"
        id          = "e1"
        expression  = "m1 / m2"
        return_data = true
      }
    }
  }
}
```

### 48. ECS with Secrets Manager automatic rotation
```hcl
resource "aws_secretsmanager_secret" "db" {
  name                    = "prod/ecs/db"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_rotation" "db" {
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_lambda_function.rotate_db.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# ECS containers use Secrets Manager — no restart needed for rotation
# Use AWS SDK in app to call GetSecretValue dynamically
```

### 49. ECS with Network Firewall
```hcl
resource "aws_networkfirewall_firewall_policy" "ecs_egress" {
  name = "ecs-egress-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.egress.arn
    }
  }
}

resource "aws_networkfirewall_rule_group" "egress" {
  name     = "ecs-allowed-egress"
  type     = "STATEFUL"
  capacity = 100

  rule_group {
    rules_source {
      rules_source_list {
        generated_rules_type = "ALLOWLIST"
        target_types         = ["HTTP_HOST", "TLS_SNI"]
        targets              = [".amazonaws.com", ".ecr.aws", ".cloudwatch.amazonaws.com"]
      }
    }
  }
}
```

### 50. Full production ECS platform
```hcl
module "ecs_full_platform" {
  source = "./modules/ecs-full-platform"

  organization = "myorg"
  environment  = "production"
  region       = "us-east-1"

  ecr = {
    scan_on_push     = true
    immutable_tags   = true
    encryption_type  = "KMS"
    lifecycle_policy = { keep_tagged = 20, delete_untagged_after_days = 1 }
    cross_account_pull = [var.staging_account_id]
  }

  cluster = {
    container_insights = true
    execute_command    = false
    fargate_spot_ratio = 70
    arm64              = true
  }

  services = local.ecs_services

  networking = {
    vpc_id             = module.vpc.vpc_id
    private_subnet_ids = module.vpc.private_subnet_ids
    enable_firewall    = true
    allowed_egress     = [".amazonaws.com", ".datadog.com"]
  }

  security = {
    kms_key_arn         = aws_kms_key.ecs.arn
    secrets_kms_key_arn = aws_kms_key.secrets.arn
    enable_inspector    = true
    readonly_root_fs    = true
    drop_capabilities   = ["ALL"]
  }

  observability = {
    log_retention_days = 90
    enable_xray        = true
    enable_adot        = true
    datadog_enabled    = true
    alert_topic_arn    = aws_sns_topic.alerts.arn
  }

  deployments = {
    strategy         = "blue_green"
    rollback_enabled = true
    circuit_breaker  = true
  }

  tags = local.common_tags
}
```
