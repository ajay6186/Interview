# Examples 1.2 — Resources & Blocks (50 examples)

> **Topic Overview:** The `resource` block is the core building block of Terraform — it declares a piece of infrastructure you want to manage. Understanding block syntax, argument types, lifecycle rules, dependencies, and nested blocks is essential for writing correct and maintainable configurations. The `lifecycle` meta-argument is one of the most interview-critical topics in this section.

---

## Basic

### 1. Minimal resource block syntax
> The resource type (`aws_s3_bucket`) maps to the AWS provider's S3 bucket resource. The local name (`my_bucket`) is used only within the Terraform config to reference this resource. Bucket names must be globally unique in S3.
```hcl
resource "aws_s3_bucket" "my_bucket" {
  bucket = "my-unique-bucket-name-2024"
}
```

### 2. Resource with multiple arguments
> Arguments inside the block are the resource's configuration. Required arguments (like `ami` and `instance_type`) must be provided; optional ones have provider defaults. Order of arguments doesn't matter to Terraform.
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = "subnet-0abc123"
  key_name      = "my-key-pair"

  tags = {
    Name = "web-server"
  }
}
```

### 3. Resource type and name convention
> The format is `resource "<PROVIDER_TYPE>" "<LOCAL_NAME>"`. The local name is arbitrary but must be unique per type. Convention is snake_case. The full resource address becomes `<type>.<name>` (e.g., `aws_vpc.main`).
```hcl
# Format: resource "<PROVIDER_TYPE>" "<LOCAL_NAME>"
resource "aws_vpc" "main" {}        # provider=aws, type=vpc, name=main
resource "aws_subnet" "public_1" {} # name can contain underscores
resource "aws_s3_bucket" "logs" {}
```

### 4. Referencing resource attributes
> Use `<type>.<name>.<attribute>` syntax to reference output attributes of another resource. This creates an **implicit dependency** — Terraform automatically orders the VPC creation before the subnet.
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id          # reference attribute
  cidr_block = "10.0.1.0/24"
}
```

### 5. Resource with tags map
> Tags are a `map(string)` argument available on most AWS resources. They're key for cost allocation, access control via IAM tag conditions, and operational visibility. Use `default_tags` in the provider to avoid repetition.
```hcl
resource "aws_instance" "app" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.small"

  tags = {
    Name        = "app-server"
    Environment = "dev"
    Owner       = "platform-team"
  }
}
```

### 6. aws_security_group basic
> The security group itself is just a container — rules are now managed as separate `aws_vpc_security_group_ingress_rule` / `egress_rule` resources (preferred) or inline `ingress`/`egress` blocks (older style). The VPC association is required.
```hcl
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Allow HTTP and HTTPS"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "web-sg"
  }
}
```

### 7. Security group ingress rule (separate resource)
> The modern approach (AWS provider v5+) separates each rule into its own resource. This avoids the cyclic dependency problem that occurred with inline rules when two security groups reference each other.
```hcl
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}
```

### 8. Security group egress rule
> `ip_protocol = "-1"` means all traffic. Egress is often left fully open (0.0.0.0/0) for outbound traffic, while ingress is restricted. Always explicitly define egress even if it's open — don't rely on provider defaults.
```hcl
resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"  # all traffic
}
```

### 9. Implicit dependency (Terraform infers order)
> When resource A's argument references resource B's attribute, Terraform infers that B must be created before A. This implicit ordering handles ~95% of dependency cases; explicit `depends_on` is rarely needed.
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id  # implicit dep — IGW created after VPC
}
```

### 10. Explicit depends_on
> Use `depends_on` when there's a dependency that Terraform can't detect from attribute references — for example, when a resource depends on an IAM policy being attached before it starts (which isn't an attribute reference).
```hcl
resource "aws_iam_role_policy_attachment" "app" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.app.arn
}

resource "aws_instance" "app" {
  ami                  = "ami-0c55b159cbfafe1f0"
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.app.name

  depends_on = [aws_iam_role_policy_attachment.app]
}
```

### 11. Resource destroy / terraform destroy
> `terraform destroy` removes all state-tracked resources from AWS. `-target` limits destruction to a specific resource. `terraform plan -destroy` shows what would be destroyed without doing it — always preview first.
```bash
terraform destroy                    # destroy all resources
terraform destroy -target=aws_instance.web  # destroy single resource
terraform plan -destroy              # preview destruction
```

### 12. terraform apply with target
> `-target` applies changes only to the specified resource and its dependencies. Useful in emergencies but **avoid in normal workflows** — targeted applies leave your state partially applied and can cause drift.
```bash
terraform apply -target=aws_vpc.main
terraform apply -target=module.networking
```

---

## Intermediate

### 13. lifecycle — create_before_destroy
> By default Terraform destroys the old resource before creating the new one. `create_before_destroy = true` reverses this — critical for resources where downtime is unacceptable (e.g., ALB target groups, DNS records).
```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true
  }
}
```

### 14. lifecycle — prevent_destroy
> Guards critical resources against accidental deletion. When set, `terraform destroy` on this resource fails with an error. **Must be removed from code before you can delete the resource.** Use on RDS clusters, S3 buckets with data, KMS keys.
```hcl
resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-aurora-cluster"
  engine             = "aurora-postgresql"

  lifecycle {
    prevent_destroy = true  # blocks terraform destroy on this resource
  }
}
```

### 15. lifecycle — ignore_changes
> Tells Terraform to ignore changes to specific attributes after initial creation. Common use: ignore `ami` so the resource isn't replaced every time a new AMI is published; ignore `user_data` to prevent replacement on script updates.
```hcl
resource "aws_instance" "app" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    ignore_changes = [
      ami,          # don't update if AMI changes externally
      user_data,    # ignore user_data changes after initial creation
    ]
  }
}
```

### 16. lifecycle — ignore all changes
> `ignore_changes = all` tells Terraform to never update this resource after creation. Use for resources managed by external systems (e.g., auto-scaling, external config management) to prevent Terraform from fighting the external system.
```hcl
resource "aws_instance" "bastion" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.nano"

  lifecycle {
    ignore_changes = all  # never plan changes after creation
  }
}
```

### 17. lifecycle — replace_triggered_by
> Forces recreation of this resource when another resource changes — even if the change is to an attribute not referenced here. Useful for ASGs that need new instances when a launch template changes.
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = var.ami_id
  instance_type = "t3.micro"
}

resource "aws_autoscaling_group" "app" {
  desired_capacity = 2
  min_size         = 1
  max_size         = 4

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  lifecycle {
    replace_triggered_by = [aws_launch_template.app]
  }
}
```

### 18. timeouts block
> Overrides the provider's default timeouts for create/update/delete operations. Critical for slow resources like RDS (can take 30+ min to create). Without this, Terraform may fail a valid operation that just takes long.
```hcl
resource "aws_db_instance" "main" {
  identifier        = "prod-postgres"
  engine            = "postgres"
  instance_class    = "db.t3.medium"
  allocated_storage = 20

  timeouts {
    create = "60m"
    update = "30m"
    delete = "40m"
  }
}
```

### 19. Resource with nested block (inline rule — older style)
> The inline `ingress`/`egress` blocks inside `aws_security_group` are the legacy approach. They work but create dependency cycles when two SGs reference each other. Prefer separate `aws_vpc_security_group_ingress_rule` resources.
```hcl
resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 20. null_resource with local-exec
> `null_resource` has no corresponding infrastructure — it exists only to run provisioners. `triggers` map forces re-execution when the referenced resource changes. Being replaced by `terraform_data` in modern configs.
```hcl
resource "null_resource" "setup" {
  triggers = {
    instance_id = aws_instance.app.id
  }

  provisioner "local-exec" {
    command = "aws ec2 wait instance-running --instance-ids ${aws_instance.app.id}"
  }
}
```

### 21. terraform_data (replacement for null_resource)
> `terraform_data` is the built-in replacement for `null_resource` (Terraform 1.4+). No external provider required. `triggers_replace` re-runs provisioners when any value in the list changes.
```hcl
resource "terraform_data" "bootstrap" {
  triggers_replace = [aws_instance.app.id]

  provisioner "local-exec" {
    command = "echo 'Instance ${self.triggers_replace[0]} is ready'"
  }
}
```

### 22. Resource metadata (for provider reference)
> The `provider` meta-argument selects a non-default provider instance. Any resource can override its provider — essential for deploying to multiple regions or accounts from one root module.
```hcl
resource "aws_s3_bucket" "replica" {
  provider = aws.eu_west_1
  bucket   = "my-eu-replica-bucket"
}
```

### 23. Resource self-reference in provisioner
> `self` inside a provisioner block refers to the resource being created. This lets you reference the resource's own attributes (like `public_ip`) without hard-coding them, even before the resource exists in state.
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  provisioner "remote-exec" {
    inline = ["sudo apt-get install -y nginx"]
    connection {
      type        = "ssh"
      user        = "ubuntu"
      host        = self.public_ip   # self = this resource
      private_key = file("~/.ssh/id_rsa")
    }
  }
}
```

### 24. lifecycle — precondition (Terraform 1.2+)
> Preconditions are validated before the resource is created or updated. If the condition is false, the plan/apply fails with the custom error message. Use to enforce constraints the type system can't express.
```hcl
resource "aws_instance" "app" {
  ami           = var.ami_id
  instance_type = var.instance_type

  lifecycle {
    precondition {
      condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
      error_message = "Instance type must be t3.micro, t3.small, or t3.medium."
    }
  }
}
```

### 25. lifecycle — postcondition
> Postconditions are checked after the resource is created. If the resource was created but doesn't meet the condition, the apply fails. Useful for catching unexpected provider behavior or race conditions.
```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-access-logs"

  lifecycle {
    postcondition {
      condition     = self.bucket_regional_domain_name != ""
      error_message = "Bucket domain name must be set after creation."
    }
  }
}
```

---

## Nested

### 26. Resource with complex nested block — aws_instance
> Modern EC2 instances benefit from separate nested blocks for EBS, metadata options (IMDSv2), and network interfaces. `http_tokens = "required"` enforces IMDSv2 — a security best practice to prevent SSRF attacks.
```hcl
resource "aws_instance" "app" {
  ami                  = "ami-0c55b159cbfafe1f0"
  instance_type        = "t3.medium"
  subnet_id            = aws_subnet.private.id
  iam_instance_profile = aws_iam_instance_profile.app.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true
    kms_key_id            = aws_kms_key.ebs.arn
  }

  ebs_block_device {
    device_name = "/dev/xvdf"
    volume_type = "gp3"
    volume_size = 100
    encrypted   = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"   # IMDSv2
    http_put_response_hop_limit = 1
  }

  network_interface {
    network_interface_id = aws_network_interface.app.id
    device_index         = 0
  }
}
```

### 27. aws_s3_bucket nested lifecycle configuration
> S3 lifecycle rules automatically transition objects to cheaper storage classes and expire old versions. This reduces storage costs without manual intervention. `noncurrent_version_expiration` cleans up old versions when versioning is enabled.
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
```

### 28. aws_ecs_task_definition with nested container_definitions
> ECS task definitions use `jsonencode()` for the container definitions array because the schema is dynamic (no fixed HCL schema). The `logConfiguration` block routes container output to CloudWatch Logs.
```hcl
resource "aws_ecs_task_definition" "app" {
  family                   = "app-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([
    {
      name  = "app"
      image = "nginx:latest"
      portMappings = [
        { containerPort = 80, protocol = "tcp" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/app"
          awslogs-region        = "us-east-1"
          awslogs-stream-prefix = "app"
        }
      }
    }
  ])
}
```

### 29. aws_cloudfront_distribution nested blocks
> CloudFront uses deeply nested blocks. `origin_access_control_id` (not legacy OAI) is the modern way to restrict S3 access to CloudFront only. `viewer_protocol_policy = "redirect-to-https"` forces HTTPS.
```hcl
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "S3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-static"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  enabled = true
}
```

### 30. aws_lb nested health check and stickiness
> Target group health checks determine which targets receive traffic. `matcher = "200"` means only HTTP 200 responses count as healthy. `stickiness` with `lb_cookie` routes a user's requests to the same target for session affinity.
```hcl
resource "aws_lb_target_group" "app" {
  name        = "app-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}
```

### 31. aws_autoscaling_group with mixed instances policy
> Mixed instances policy reduces costs by blending On-Demand (base capacity) and Spot (overflow). `price-capacity-optimized` is the recommended Spot strategy — it picks the pool least likely to be interrupted.
```hcl
resource "aws_autoscaling_group" "app" {
  name             = "app-asg"
  max_size         = 10
  min_size         = 2
  desired_capacity = 3

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }
      override {
        instance_type     = "t3.medium"
        weighted_capacity = "2"
      }
      override {
        instance_type     = "t3.large"
        weighted_capacity = "4"
      }
    }

    instances_distribution {
      on_demand_base_capacity                  = 1
      on_demand_percentage_above_base_capacity = 25
      spot_allocation_strategy                 = "price-capacity-optimized"
    }
  }
}
```

### 32. aws_wafv2_web_acl deeply nested rules
> WAFv2 uses deeply nested blocks for rules, statements, overrides, and visibility config. `AWSManagedRulesCommonRuleSet` is AWS's managed ruleset covering OWASP Top 10. `override_action { none {} }` means "apply the managed rule's own actions."
```hcl
resource "aws_wafv2_web_acl" "main" {
  name  = "main-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "main-waf"
    sampled_requests_enabled   = true
  }
}
```

### 33. Moved block (Terraform 1.1+)
> `moved` blocks let you rename or reorganize resources in code **without destroying and recreating them**. Terraform updates the state to point to the new address. Remove the `moved` block after the rename is applied to everyone.
```hcl
# Rename a resource without destroying/recreating it
moved {
  from = aws_s3_bucket.website
  to   = aws_s3_bucket.static_site
}
```

### 34. Import block (Terraform 1.5+)
> Declarative import brings existing AWS resources under Terraform management. Unlike `terraform import` CLI, the `import` block is version-controlled and reviewable. Run `terraform plan -generate-config-out=generated.tf` to auto-generate the resource block.
```hcl
import {
  to = aws_s3_bucket.existing
  id = "my-existing-bucket-name"
}

resource "aws_s3_bucket" "existing" {
  bucket = "my-existing-bucket-name"
}
```

### 35. Import multiple resources with for_each (Terraform 1.7+)
> Batch import with `for_each` eliminates writing one import block per resource. The `id` maps each key to the AWS resource's import ID. This is the modern way to onboard large existing infrastructures.
```hcl
locals {
  buckets = {
    logs    = "my-logs-bucket"
    assets  = "my-assets-bucket"
    backups = "my-backups-bucket"
  }
}

import {
  for_each = local.buckets
  to       = aws_s3_bucket.buckets[each.key]
  id       = each.value
}

resource "aws_s3_bucket" "buckets" {
  for_each = local.buckets
  bucket   = each.value
}
```

### 36. Resource with connection block
> The `connection` block configures how Terraform connects to the instance for `remote-exec` provisioners. The `host = self.public_ip` uses the resource's own IP — only available after the instance is created.
```hcl
resource "aws_instance" "bastion" {
  ami             = "ami-0c55b159cbfafe1f0"
  instance_type   = "t3.nano"
  key_name        = aws_key_pair.bastion.key_name
  security_groups = [aws_security_group.bastion.name]

  connection {
    type        = "ssh"
    user        = "ec2-user"
    host        = self.public_ip
    private_key = file("~/.ssh/bastion_key")
    timeout     = "2m"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo yum update -y",
      "sudo yum install -y htop",
    ]
  }
}
```

### 37. aws_vpc_endpoint with policy
> VPC Gateway endpoints (for S3 and DynamoDB) route traffic through the AWS backbone, not the internet. The `policy` restricts which S3 buckets can be accessed through this endpoint — a security control for data exfiltration prevention.
```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [aws_route_table.private.id]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject", "s3:PutObject"]
      Resource  = ["${aws_s3_bucket.data.arn}/*"]
    }]
  })
}
```

---

## Advanced

### 38. Resource with check block assertion
> `check` blocks (Terraform 1.5+) are non-blocking assertions — they emit warnings but don't stop `apply`. Use them for compliance checks (e.g., "is this bucket really private?") that should alert but not block deployments.
```hcl
resource "aws_s3_bucket" "public" {
  bucket = "my-public-bucket"
}

check "bucket_not_public" {
  assert {
    condition     = aws_s3_bucket_public_access_block.public.block_public_acls == true
    error_message = "Bucket must have public access blocked."
  }
}
```

### 39. Resource replacement with -replace flag
> `-replace` forces a specific resource to be destroyed and recreated, even if no config changes would trigger it. This is the modern replacement for `terraform taint`. Use when an instance is in a bad state and needs refreshing.
```bash
terraform plan -replace=aws_instance.web
terraform apply -replace=aws_instance.web
```

### 40. Tainting resources (deprecated, use -replace)
> `terraform taint` is deprecated in Terraform 0.15+. It marked a resource for recreation on the next apply. Use `terraform apply -replace=<address>` instead — it's atomic and shows the replacement in the plan output.
```bash
# Old way (deprecated):
terraform taint aws_instance.web
terraform untaint aws_instance.web
# New way:
terraform apply -replace=aws_instance.web
```

### 41. aws_iam_policy with complex JSON
> `jsonencode()` generates valid JSON from HCL maps — safer than heredoc strings because it handles escaping and whitespace correctly. The `Condition` block with `StringLike` restricts S3 operations to a specific key prefix.
```hcl
resource "aws_iam_policy" "app" {
  name        = "app-policy"
  description = "Application policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "S3Access"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.app.arn}/*"
      },
      {
        Sid      = "S3List"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.app.arn
        Condition = {
          StringLike = {
            "s3:prefix" = ["app/*"]
          }
        }
      },
      {
        Sid      = "DenyDelete"
        Effect   = "Deny"
        Action   = ["s3:DeleteBucket"]
        Resource = "*"
      }
    ]
  })
}
```

### 42. aws_launch_template full config
> Launch templates are the modern replacement for launch configurations. `http_tokens = "required"` enforces IMDSv2. `templatefile()` renders a startup script with dynamic values. `tag_specifications` applies tags to instances AND their EBS volumes.
```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  key_name      = aws_key_pair.app.key_name

  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.app.arn
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ebs.arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    environment = var.environment
    bucket_name = aws_s3_bucket.app.bucket
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "app-server", Environment = var.environment }
  }

  tag_specifications {
    resource_type = "volume"
    tags          = { Name = "app-root", Environment = var.environment }
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### 43. aws_kinesis_firehose_delivery_stream nested config
> Kinesis Firehose with dynamic partitioning uses metadata extraction (JQ queries on the JSON payload) to route records into date-partitioned S3 prefixes — enabling efficient Athena/Glue queries.
```hcl
resource "aws_kinesis_firehose_delivery_stream" "logs" {
  name        = "app-logs"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn           = aws_iam_role.firehose.arn
    bucket_arn         = aws_s3_bucket.logs.arn
    prefix             = "logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/"
    buffering_size     = 128
    buffering_interval = 300
    compression_format = "GZIP"

    dynamic_partitioning_configuration {
      enabled        = true
      retry_duration = 300
    }

    processing_configuration {
      enabled = true
      processors {
        type = "MetadataExtraction"
        parameters {
          parameter_name  = "MetadataExtractionQuery"
          parameter_value = "{serviceName:.service}"
        }
        parameters {
          parameter_name  = "JsonParsingEngine"
          parameter_value = "JQ-1.6"
        }
      }
    }
  }
}
```

### 44. aws_codepipeline with nested stages
> CodePipeline uses nested `stage` blocks, each containing `action` blocks. `CodeStarSourceConnection` connects to GitHub/GitLab via an AWS-managed OAuth app — no stored PATs. The ECS deploy action performs a rolling update.
```hcl
resource "aws_codepipeline" "app" {
  name     = "app-pipeline"
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
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]
      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.github.arn
        FullRepositoryId = "myorg/myapp"
        BranchName       = "main"
      }
    }
  }

  stage {
    name = "Deploy"
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS"
      version         = "1"
      input_artifacts = ["source_output"]
      configuration = {
        ClusterName = aws_ecs_cluster.app.name
        ServiceName = aws_ecs_service.app.name
      }
    }
  }
}
```

### 45. aws_glue_job with connections and args
> Glue jobs run PySpark or Python Shell scripts on managed Spark infrastructure. `G.1X` worker type allocates 4 vCPU / 16 GB RAM per worker. `enable-continuous-cloudwatch-log` streams driver and executor logs in near-real-time.
```hcl
resource "aws_glue_job" "etl" {
  name     = "data-etl-job"
  role_arn = aws_iam_role.glue.arn

  command {
    name            = "glueetl"
    script_location = "s3://${aws_s3_bucket.scripts.bucket}/etl/main.py"
    python_version  = "3"
  }

  default_arguments = {
    "--job-language"            = "python"
    "--enable-metrics"          = ""
    "--enable-continuous-cloudwatch-log" = "true"
    "--TempDir"                 = "s3://${aws_s3_bucket.temp.bucket}/tmp/"
    "--source_database"         = var.source_database
  }

  connections   = [aws_glue_connection.rds.name]
  worker_type   = "G.1X"
  number_of_workers = 5
  glue_version  = "4.0"
  max_retries   = 1
}
```

### 46. aws_stepfunctions_state_machine
> Step Functions orchestrate Lambda functions and other AWS services into workflows. `jsonencode()` generates the Amazon States Language definition. `Retry` with exponential backoff handles transient Lambda failures gracefully.
```hcl
resource "aws_sfn_state_machine" "order_processor" {
  name     = "order-processor"
  role_arn = aws_iam_role.sfn.arn

  definition = jsonencode({
    Comment = "Order processing workflow"
    StartAt = "ValidateOrder"
    States = {
      ValidateOrder = {
        Type     = "Task"
        Resource = aws_lambda_function.validate.arn
        Next     = "ProcessPayment"
        Retry = [{
          ErrorEquals     = ["Lambda.ServiceException"]
          IntervalSeconds = 2
          MaxAttempts     = 3
          BackoffRate     = 2
        }]
      }
      ProcessPayment = {
        Type     = "Task"
        Resource = aws_lambda_function.payment.arn
        End      = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.sfn.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
}
```

### 47. aws_ecs_service with service connect
> Service Connect (ECS's service mesh) enables service discovery via DNS names within a namespace. `deployment_circuit_breaker` auto-rolls back failed deployments — a critical production safety net.
```hcl
resource "aws_ecs_service" "api" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.main.arn
    service {
      port_name      = "api"
      discovery_name = "api"
      client_alias {
        port     = 8080
        dns_name = "api"
      }
    }
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }
}
```

### 48. aws_api_gateway_rest_api full setup
> API Gateway with `body` (OpenAPI spec) lets you define the entire API in one block using standard OpenAPI 3.0 format. The `x-amazon-apigateway-integration` extension wires each path to a Lambda function via proxy integration.
```hcl
resource "aws_api_gateway_rest_api" "app" {
  name        = "app-api"
  description = "Application REST API"

  endpoint_configuration {
    types            = ["REGIONAL"]
  }

  body = jsonencode({
    openapi = "3.0.1"
    info = { title = "App API", version = "1.0" }
    paths = {
      "/items" = {
        get = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            uri                  = aws_lambda_function.api.invoke_arn
            type                 = "aws_proxy"
            passthroughBehavior  = "when_no_match"
          }
        }
      }
    }
  })
}
```

### 49. aws_cloudwatch_metric_alarm with complex conditions
> `evaluation_periods = 3` means the alarm triggers only after 3 consecutive breaches — reducing false positives from spikes. `treat_missing_data = "notBreaching"` prevents alarms when metrics are temporarily absent (e.g., instance stopped).
```hcl
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "app-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU exceeded 80% for 3 consecutive minutes"
  alarm_actions       = [aws_autoscaling_policy.scale_out.arn, aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
}
```

### 50. Full resource pattern — EC2 with all best practices
> The production-ready EC2 pattern: data-source AMI lookup (not hardcoded), gp3 root volume with encryption and KMS, IMDSv2 enforced, user_data via templatefile, lifecycle guards against AMI-driven churn and nano in prod.
```hcl
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux2.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnet_id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  key_name               = aws_key_pair.app.key_name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    kms_key_id            = data.aws_kms_key.ebs.arn
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  }))

  tags = {
    Name        = "${var.environment}-app"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [ami]
    precondition {
      condition     = var.environment == "prod" ? var.instance_type != "t3.nano" : true
      error_message = "Production must not use t3.nano instances."
    }
  }

  depends_on = [aws_iam_role_policy_attachment.app]
}
```

---

## Key Takeaways

- **Implicit dependencies** (attribute references) handle ordering in ~95% of cases; use `depends_on` only for side-effect dependencies.
- **`lifecycle` block** is one of the most interview-critical topics: know `create_before_destroy`, `prevent_destroy`, `ignore_changes`, `precondition`, `postcondition`, and `replace_triggered_by`.
- **`moved` blocks** let you refactor resource addresses without destroying infrastructure — use before renaming any resource in production.
- **Declarative `import` blocks** (Terraform 1.5+) are the modern way to onboard existing resources — version-controlled and reviewable.
- `terraform_data` replaces `null_resource` — no external provider required.
- `jsonencode()` is the safe way to build JSON arguments (IAM policies, ECS task definitions) — handles escaping automatically.

## Common Interview Questions & Answers

**Q: What is the difference between `create_before_destroy` and the default destroy-then-create behavior?**  
A: By default, Terraform destroys the old resource first, then creates the new one — causing a brief outage. `create_before_destroy = true` reverses this: the new resource is created first, traffic is shifted, then the old one is deleted. Critical for zero-downtime deployments.

**Q: How does `depends_on` differ from an attribute reference dependency?**  
A: Attribute references (e.g., `vpc_id = aws_vpc.main.id`) create implicit ordering automatically. `depends_on` adds an explicit ordering for relationships Terraform can't infer from attributes — like "this EC2 instance needs an IAM policy attached before it runs."

**Q: How do you rename a Terraform resource without destroying it?**  
A: Use a `moved` block: `moved { from = aws_instance.old; to = aws_instance.new }`. Apply it once, then remove the block. Without `moved`, renaming in code causes destroy-then-create.

**Q: What is `prevent_destroy` and what's its limitation?**  
A: `prevent_destroy = true` in the lifecycle block causes `terraform destroy` (or any plan that would destroy the resource) to fail with an error. The limitation: you must remove this flag from the code before you can delete the resource — it's not permanent protection.

**Q: When would you use `ignore_changes = all`?**  
A: When a resource is managed by an external system after Terraform creates it (e.g., an EC2 instance managed by Ansible post-creation, or an ASG whose tags are updated by the auto-scaler). Tells Terraform: "create it, then hands off."
