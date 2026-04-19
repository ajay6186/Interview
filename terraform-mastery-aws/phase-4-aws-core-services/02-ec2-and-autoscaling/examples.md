# Examples 4.2 — EC2 & Auto Scaling (50 examples)

---

## Basic

### 1. Simple EC2 instance
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  tags          = { Name = "web-server" }
}
```

### 2. EC2 with key pair
```hcl
resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name
}
```

### 3. Data source for latest Amazon Linux 2 AMI
```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}
```

### 4. EC2 in a VPC subnet with security group
```hcl
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.private.id
  vpc_security_group_ids = [aws_security_group.app.id]
  tags                   = { Name = "app-server" }
}
```

### 5. EC2 with user data
```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Terraform</h1>" > /var/www/html/index.html
  EOF
}
```

### 6. EBS root volume customization
```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }
}
```

### 7. Attach additional EBS volume
```hcl
resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"
  encrypted         = true
  tags              = { Name = "data-volume" }
}

resource "aws_volume_attachment" "data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.web.id
}
```

### 8. EC2 with IAM instance profile
```hcl
resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2.name
}

resource "aws_instance" "managed" {
  ami                  = data.aws_ami.amazon_linux.id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2.name
}
```

### 9. Elastic IP for EC2
```hcl
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"
}
```

### 10. EC2 with placement group
```hcl
resource "aws_placement_group" "cluster" {
  name     = "cluster-pg"
  strategy = "cluster"
}

resource "aws_instance" "hpc" {
  ami             = data.aws_ami.amazon_linux.id
  instance_type   = "c5n.9xlarge"
  placement_group = aws_placement_group.cluster.id
}
```

### 11. Stop vs terminate protection
```hcl
resource "aws_instance" "protected" {
  ami                     = data.aws_ami.amazon_linux.id
  instance_type           = "t3.micro"
  disable_api_termination = true
  disable_api_stop        = true
}
```

### 12. EC2 instance metadata options (IMDSv2)
```hcl
resource "aws_instance" "secure" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    http_endpoint               = "enabled"
  }
}
```

---

## Intermediate

### 13. Launch template
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"

  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile { arn = aws_iam_instance_profile.ec2.arn }

  metadata_options {
    http_tokens = "required"
  }

  user_data = base64encode(file("${path.module}/user_data.sh"))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "app", ManagedBy = "terraform" }
  }
}
```

### 14. Auto Scaling Group with launch template
```hcl
resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3
  vpc_zone_identifier = aws_subnet.private[*].id
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "app-asg-instance"
    propagate_at_launch = true
  }
}
```

### 15. Target tracking scaling policy (CPU)
```hcl
resource "aws_autoscaling_policy" "cpu" {
  name                   = "cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}
```

### 16. Step scaling policy
```hcl
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "scale-out"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  policy_type            = "StepScaling"

  step_adjustment {
    metric_interval_lower_bound = 0
    metric_interval_upper_bound = 20
    scaling_adjustment          = 1
  }

  step_adjustment {
    metric_interval_lower_bound = 20
    scaling_adjustment          = 3
  }
}
```

### 17. Scheduled scaling action
```hcl
resource "aws_autoscaling_schedule" "morning" {
  scheduled_action_name  = "scale-up-morning"
  autoscaling_group_name = aws_autoscaling_group.app.name
  min_size               = 5
  max_size               = 20
  desired_capacity       = 10
  recurrence             = "0 8 * * MON-FRI"
  time_zone              = "America/New_York"
}
```

### 18. Mixed instances policy (spot + on-demand)
```hcl
resource "aws_autoscaling_group" "mixed" {
  name                = "mixed-asg"
  min_size            = 2
  max_size            = 20
  vpc_zone_identifier = aws_subnet.private[*].id

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 2
      on_demand_percentage_above_base_capacity = 20
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }

      override { instance_type = "t3.small" }
      override { instance_type = "t3.medium" }
      override { instance_type = "t3a.small" }
    }
  }
}
```

### 19. ASG with lifecycle hooks
```hcl
resource "aws_autoscaling_lifecycle_hook" "launch" {
  name                   = "launch-hook"
  autoscaling_group_name = aws_autoscaling_group.app.name
  lifecycle_transition   = "autoscaling:EC2_INSTANCE_LAUNCHING"
  heartbeat_timeout      = 300
  default_result         = "CONTINUE"
  notification_target_arn = aws_sqs_queue.lifecycle.arn
  role_arn               = aws_iam_role.lifecycle.arn
}
```

### 20. Spot instance request
```hcl
resource "aws_spot_instance_request" "worker" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "c5.xlarge"
  spot_price             = "0.05"
  wait_for_fulfillment   = true
  vpc_security_group_ids = [aws_security_group.worker.id]
  subnet_id              = aws_subnet.private.id
  tags                   = { Name = "spot-worker" }
}
```

### 21. EC2 with SSM Session Manager (no SSH)
```hcl
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_instance" "ssm" {
  ami                  = data.aws_ami.amazon_linux.id
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2.name
  subnet_id            = aws_subnet.private.id
  # No key pair needed — connect via SSM
}
```

### 22. AMI from existing instance (snapshot)
```hcl
resource "aws_ami_from_instance" "golden" {
  name               = "golden-ami-${formatdate("YYYYMMDD", timestamp())}"
  source_instance_id = aws_instance.base.id
  snapshot_without_reboot = true

  lifecycle {
    create_before_destroy = true
  }
}
```

### 23. EC2 with multiple network interfaces
```hcl
resource "aws_network_interface" "eth1" {
  subnet_id       = aws_subnet.private.id
  security_groups = [aws_security_group.data.id]
}

resource "aws_instance" "multi_nic" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"

  network_interface {
    network_interface_id = aws_network_interface.eth1.id
    device_index         = 0
  }
}
```

### 24. EC2 Auto Recovery alarm
```hcl
resource "aws_cloudwatch_metric_alarm" "auto_recover" {
  alarm_name          = "ec2-auto-recover"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed_System"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_actions       = ["arn:aws:automate:us-east-1:ec2:recover"]
  dimensions          = { InstanceId = aws_instance.web.id }
}
```

### 25. Capacity Reservation
```hcl
resource "aws_ec2_capacity_reservation" "reserved" {
  instance_type           = "c5.2xlarge"
  instance_platform       = "Linux/UNIX"
  availability_zone       = "us-east-1a"
  instance_count          = 5
  instance_match_criteria = "targeted"
  end_date_type           = "unlimited"
  tags                    = { Name = "prod-reservation" }
}
```

---

## Nested

### 26. Launch template with dynamic block for block devices
```hcl
variable "extra_volumes" {
  type = list(object({
    device_name = string
    size        = number
    type        = string
  }))
  default = []
}

resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"

  dynamic "block_device_mappings" {
    for_each = var.extra_volumes
    content {
      device_name = block_device_mappings.value.device_name
      ebs {
        volume_size = block_device_mappings.value.size
        volume_type = block_device_mappings.value.type
        encrypted   = true
      }
    }
  }
}
```

### 27. ASG with multiple target group attachments
```hcl
resource "aws_autoscaling_attachment" "attachments" {
  for_each               = toset(var.target_group_arns)
  autoscaling_group_name = aws_autoscaling_group.app.id
  lb_target_group_arn    = each.value
}
```

### 28. EC2 fleet with multiple instance types
```hcl
resource "aws_ec2_fleet" "batch" {
  type = "maintain"

  target_capacity_specification {
    default_target_capacity_type = "spot"
    total_target_capacity        = 10
    on_demand_target_capacity    = 2
    spot_target_capacity         = 8
  }

  launch_template_config {
    launch_template_specification {
      launch_template_id = aws_launch_template.app.id
      version            = "$Latest"
    }

    dynamic "override" {
      for_each = toset(["c5.large", "c5a.large", "c5n.large", "m5.large"])
      content {
        instance_type = override.value
      }
    }
  }
}
```

### 29. Autoscaling notification
```hcl
resource "aws_autoscaling_notification" "asg_notify" {
  group_names = [aws_autoscaling_group.app.name]
  notifications = [
    "autoscaling:EC2_INSTANCE_LAUNCH",
    "autoscaling:EC2_INSTANCE_TERMINATE",
    "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
  ]
  topic_arn = aws_sns_topic.asg_events.arn
}
```

### 30. Launch template with instance requirements (flexible)
```hcl
resource "aws_launch_template" "flexible" {
  name_prefix = "flexible-"

  instance_requirements {
    memory_mib { min = 4096 max = 16384 }
    vcpu_count  { min = 2    max = 8 }

    instance_generations           = ["current"]
    burstable_performance          = "excluded"
    bare_metal                     = "excluded"
    spot_max_price_as_percentage_of_optimal_price = 100
  }
}
```

### 31. Warm pool for ASG
```hcl
resource "aws_autoscaling_group" "warm" {
  name                = "warm-asg"
  min_size            = 2
  max_size            = 20
  vpc_zone_identifier = aws_subnet.private[*].id

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  warm_pool {
    pool_state                  = "Stopped"
    min_size                    = 2
    max_group_prepared_capacity = 5

    instance_reuse_policy {
      reuse_on_scale_in = true
    }
  }
}
```

### 32. EC2 with user_data from templatefile
```hcl
resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh.tpl", {
    db_endpoint = aws_db_instance.main.endpoint
    app_version = var.app_version
    region      = data.aws_region.current.name
  }))
}
```

### 33. ASG with instance refresh
```hcl
resource "aws_autoscaling_group" "refresh" {
  name                = "refresh-asg"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 4
  vpc_zone_identifier = aws_subnet.private[*].id

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
      instance_warmup        = 300
      skip_matching          = true
    }
    triggers = ["launch_template"]
  }
}
```

### 34. Predictive scaling policy
```hcl
resource "aws_autoscaling_policy" "predictive" {
  name                   = "predictive-scaling"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "PredictiveScaling"

  predictive_scaling_configuration {
    mode                          = "ForecastAndScale"
    scheduling_buffer_time        = 300
    max_capacity_breach_behavior  = "IncreaseMaxCapacity"
    max_capacity_buffer           = 10

    metric_specification {
      target_value = 70
      predefined_scaling_metric_specification {
        predefined_metric_type = "ASGAverageCPUUtilization"
      }
      predefined_load_metric_specification {
        predefined_metric_type = "ASGTotalCPUUtilization"
      }
    }
  }
}
```

### 35. Multiple ASGs sharing same launch template with different overrides
```hcl
locals {
  tiers = {
    frontend = { instance = "t3.small",  min = 2, max = 10 }
    backend  = { instance = "t3.medium", min = 2, max = 20 }
    worker   = { instance = "c5.large",  min = 1, max = 50 }
  }
}

resource "aws_autoscaling_group" "tiers" {
  for_each            = local.tiers
  name                = "${each.key}-asg"
  min_size            = each.value.min
  max_size            = each.value.max
  vpc_zone_identifier = aws_subnet.private[*].id

  launch_template {
    id      = aws_launch_template.base.id
    version = "$Latest"
  }

  dynamic "tag" {
    for_each = { Name = "${each.key}-instance", Tier = each.key }
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}
```

### 36. EC2 Image Builder pipeline
```hcl
resource "aws_imagebuilder_image_recipe" "app" {
  name         = "app-recipe"
  version      = "1.0.0"
  parent_image = "arn:aws:imagebuilder:us-east-1:aws:image/amazon-linux-2-x86/x.x.x"

  block_device_mapping {
    device_name = "/dev/xvda"
    ebs { volume_size = 20 volume_type = "gp3" }
  }

  component { component_arn = aws_imagebuilder_component.app.arn }
}

resource "aws_imagebuilder_infrastructure_configuration" "build" {
  name                  = "app-infra"
  instance_types        = ["t3.medium"]
  security_group_ids    = [aws_security_group.build.id]
  subnet_id             = aws_subnet.private.id
  instance_profile_name = aws_iam_instance_profile.imagebuilder.name
}
```

### 37. Spot Fleet request
```hcl
resource "aws_spot_fleet_request" "batch" {
  iam_fleet_role     = aws_iam_role.spot_fleet.arn
  target_capacity    = 20
  allocation_strategy = "capacityOptimized"

  dynamic "launch_specification" {
    for_each = toset(["c5.large", "c5a.large", "m5.large"])
    content {
      ami           = data.aws_ami.amazon_linux.id
      instance_type = launch_specification.value
      subnet_id     = aws_subnet.private[0].id
    }
  }
}
```

---

## Advanced

### 38. Golden AMI pipeline with Image Builder and EventBridge
```hcl
resource "aws_imagebuilder_image_pipeline" "pipeline" {
  name                             = "golden-ami-pipeline"
  image_recipe_arn                 = aws_imagebuilder_image_recipe.app.arn
  infrastructure_configuration_arn = aws_imagebuilder_infrastructure_configuration.build.arn
  distribution_configuration_arn   = aws_imagebuilder_distribution_configuration.dist.arn

  schedule {
    schedule_expression = "cron(0 2 ? * SUN *)"
    pipeline_execution_start_condition = "EXPRESSION_MATCH_AND_DEPENDENCY_UPDATES_AVAILABLE"
  }
}

resource "aws_cloudwatch_event_rule" "ami_complete" {
  name        = "ami-pipeline-complete"
  event_pattern = jsonencode({
    source      = ["aws.imagebuilder"]
    detail-type = ["EC2 Image Builder Image State Change"]
    detail      = { state = { status = ["AVAILABLE"] } }
  })
}
```

### 39. ASG with CodeDeploy in-place deployment
```hcl
resource "aws_codedeploy_deployment_group" "asg" {
  app_name              = aws_codedeploy_app.app.name
  deployment_group_name = "asg-deployment-group"
  service_role_arn      = aws_iam_role.codedeploy.arn

  autoscaling_groups = [aws_autoscaling_group.app.name]

  deployment_config_name = "CodeDeployDefault.AllAtOnce"

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route { listener_arns = [aws_lb_listener.app.arn] }
      target_group { name = aws_lb_target_group.blue.name }
      target_group { name = aws_lb_target_group.green.name }
    }
  }
}
```

### 40. Dedicated Host allocation
```hcl
resource "aws_ec2_host" "dedicated" {
  instance_type     = "c5.xlarge"
  availability_zone = "us-east-1a"
  host_recovery     = "on"
  auto_placement    = "on"
  tags              = { Name = "dedicated-host" }
}

resource "aws_instance" "on_host" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "c5.xlarge"
  host_id       = aws_ec2_host.dedicated.id
  tenancy       = "host"
}
```

### 41. EC2 with Nitro Enclaves
```hcl
resource "aws_instance" "enclave" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "c5.xlarge"

  enclave_options {
    enabled = true
  }

  metadata_options {
    http_tokens = "required"
  }
}
```

### 42. Auto Scaling with custom CloudWatch metric
```hcl
resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  alarm_name          = "queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = 100
  alarm_actions       = [aws_autoscaling_policy.scale_out.arn]
  dimensions          = { QueueName = aws_sqs_queue.work.name }
}
```

### 43. Launch template versioning strategy
```hcl
resource "aws_launch_template" "versioned" {
  name        = "app-lt"
  description = "v${var.app_version}"
  image_id    = data.aws_ami.app.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "pinned" {
  launch_template {
    id      = aws_launch_template.versioned.id
    version = aws_launch_template.versioned.latest_version
  }
}
```

### 44. EC2 placement across partition placement groups
```hcl
resource "aws_placement_group" "partition" {
  name            = "partition-pg"
  strategy        = "partition"
  partition_count = 3
}

resource "aws_instance" "partitioned" {
  count           = 6
  ami             = data.aws_ami.amazon_linux.id
  instance_type   = "r5.xlarge"
  placement_group = aws_placement_group.partition.id
  tags            = { Name = "node-${count.index}" }
}
```

### 45. Blue/Green ASG swap via Route53
```hcl
resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "app"
  type    = "A"

  weighted_routing_policy {
    weight = var.blue_weight
  }

  set_identifier = "blue"

  alias {
    name                   = aws_lb.blue.dns_name
    zone_id                = aws_lb.blue.zone_id
    evaluate_target_health = true
  }
}
```

### 46. Graceful termination via ASG lifecycle + Lambda
```hcl
resource "aws_lambda_function" "drain" {
  filename      = "drain.zip"
  function_name = "asg-drain-handler"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300
}

resource "aws_autoscaling_lifecycle_hook" "termination" {
  name                    = "drain-hook"
  autoscaling_group_name  = aws_autoscaling_group.app.name
  lifecycle_transition    = "autoscaling:EC2_INSTANCE_TERMINATING"
  heartbeat_timeout       = 300
  default_result          = "CONTINUE"
  notification_target_arn = aws_sns_topic.lifecycle.arn
  role_arn                = aws_iam_role.lifecycle_sns.arn
}
```

### 47. Cross-region AMI copy
```hcl
resource "aws_ami_copy" "dr_region" {
  provider          = aws.dr
  name              = "${data.aws_ami.app.name}-dr"
  source_ami_id     = data.aws_ami.app.id
  source_ami_region = "us-east-1"
  encrypted         = true
  kms_key_id        = aws_kms_key.dr.arn
  tags              = { Name = "dr-ami" }
}
```

### 48. Capacity Reservations Group
```hcl
resource "aws_ec2_capacity_reservation_group" "group" {
  arn  = "arn:aws:resource-groups:us-east-1:${data.aws_caller_identity.current.account_id}:group/cr-group"
}

resource "aws_autoscaling_group" "reserved" {
  min_size            = 2
  max_size            = 10
  vpc_zone_identifier = aws_subnet.private[*].id

  capacity_reservation_specification {
    capacity_reservation_preference = "open"
    capacity_reservation_target {
      capacity_reservation_resource_group_arn = aws_ec2_capacity_reservation_group.group.arn
    }
  }
}
```

### 49. Hibernation-enabled instance
```hcl
resource "aws_instance" "hibernatable" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"

  hibernation = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }
}
```

### 50. Full production autoscaling stack
```hcl
module "asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~> 7.0"

  name            = "prod-app"
  min_size        = 3
  max_size        = 30
  desired_capacity = 6

  vpc_zone_identifier        = module.vpc.private_subnets
  target_group_arns          = module.alb.target_group_arns
  health_check_type          = "ELB"
  health_check_grace_period  = 300

  image_id      = data.aws_ami.app.id
  instance_type = "t3.medium"

  block_device_mappings = [{
    device_name = "/dev/xvda"
    ebs = {
      volume_size = 20
      volume_type = "gp3"
      encrypted   = true
    }
  }]

  iam_instance_profile_arn = aws_iam_instance_profile.ec2.arn
  security_groups          = [aws_security_group.app.id]

  metadata_options = {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  scaling_policies = {
    cpu = {
      policy_type               = "TargetTrackingScaling"
      target_tracking_configuration = {
        predefined_metric_specification = {
          predefined_metric_type = "ASGAverageCPUUtilization"
        }
        target_value = 60
      }
    }
  }

  instance_refresh = {
    strategy = "Rolling"
    preferences = {
      min_healthy_percentage = 90
      instance_warmup        = 300
    }
  }

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```
