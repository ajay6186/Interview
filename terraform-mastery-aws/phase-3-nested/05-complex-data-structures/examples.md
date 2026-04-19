# Examples 3.5 — Complex Data Structures (50 examples)

---

## Basic

### 1. Simple map variable
```hcl
variable "tags" {
  type = map(string)
  default = {
    Environment = "dev"
    Team        = "platform"
  }
}
```

### 2. List of strings
```hcl
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

### 3. Simple object type
```hcl
variable "db_config" {
  type = object({
    engine         = string
    engine_version = string
    instance_class = string
    storage_gb     = number
  })
  default = {
    engine         = "postgres"
    engine_version = "15.4"
    instance_class = "db.t3.medium"
    storage_gb     = 100
  }
}
```

### 4. Map of numbers
```hcl
variable "service_ports" {
  type = map(number)
  default = {
    web    = 80
    api    = 8080
    worker = 9000
    admin  = 9090
  }
}
```

### 5. List of objects
```hcl
variable "subnets" {
  type = list(object({
    name = string
    cidr = string
    az   = string
    public = bool
  }))
}
```

### 6. Set of strings (deduplicated)
```hcl
variable "allowed_roles" {
  type = set(string)
  default = ["admin", "developer", "read-only"]
}
```

### 7. Nested map (map of maps)
```hcl
variable "environment_config" {
  type = map(map(string))
  default = {
    dev = {
      instance_type = "t3.micro"
      min_size      = "1"
    }
    prod = {
      instance_type = "m5.large"
      min_size      = "3"
    }
  }
}
```

### 8. tuple type
```hcl
variable "az_cidr_pair" {
  type    = tuple([string, string])
  default = ["us-east-1a", "10.0.1.0/24"]
}
```

### 9. any type (flexible but avoid in modules)
```hcl
variable "extra_config" {
  type    = any
  default = {}
}
```

### 10. Accessing nested object attributes
```hcl
resource "aws_db_instance" "main" {
  engine         = var.db_config.engine
  engine_version = var.db_config.engine_version
  instance_class = var.db_config.instance_class
  allocated_storage = var.db_config.storage_gb
}
```

### 11. Iterating over a map
```hcl
resource "aws_security_group_rule" "ports" {
  for_each          = var.service_ports
  security_group_id = aws_security_group.app.id
  type              = "ingress"
  from_port         = each.value
  to_port           = each.value
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]
  description       = each.key
}
```

### 12. Iterating over list of objects
```hcl
resource "aws_subnet" "app" {
  for_each          = { for s in var.subnets : s.name => s }
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  map_public_ip_on_launch = each.value.public
  tags = { Name = each.key }
}
```

---

## Intermediate

### 13. Map of objects — VPC subnet configuration
```hcl
variable "subnet_config" {
  type = map(object({
    cidr    = string
    az      = string
    public  = bool
    tier    = string
  }))
  default = {
    public-a  = { cidr = "10.0.1.0/24", az = "us-east-1a", public = true,  tier = "public" }
    public-b  = { cidr = "10.0.2.0/24", az = "us-east-1b", public = true,  tier = "public" }
    private-a = { cidr = "10.0.11.0/24", az = "us-east-1a", public = false, tier = "private" }
    private-b = { cidr = "10.0.12.0/24", az = "us-east-1b", public = false, tier = "private" }
    data-a    = { cidr = "10.0.21.0/24", az = "us-east-1a", public = false, tier = "data" }
    data-b    = { cidr = "10.0.22.0/24", az = "us-east-1b", public = false, tier = "data" }
  }
}

resource "aws_subnet" "tiers" {
  for_each          = var.subnet_config
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  map_public_ip_on_launch = each.value.public
  tags = { Name = each.key, Tier = each.value.tier }
}
```

### 14. Grouping resources from complex variable by attribute
```hcl
locals {
  public_subnets  = { for name, subnet in var.subnet_config : name => subnet if subnet.tier == "public" }
  private_subnets = { for name, subnet in var.subnet_config : name => subnet if subnet.tier == "private" }
  data_subnets    = { for name, subnet in var.subnet_config : name => subnet if subnet.tier == "data" }
}
```

### 15. Map of objects — microservices config
```hcl
variable "services" {
  type = map(object({
    port          = number
    cpu           = number
    memory        = number
    desired_count = number
    health_path   = string
    environment   = map(string)
    secrets       = map(string)
  }))
}

resource "aws_ecs_service" "services" {
  for_each        = var.services
  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  desired_count   = each.value.desired_count
  task_definition = aws_ecs_task_definition.services[each.key].arn
}
```

### 16. optional() in object type (Terraform 1.3+)
```hcl
variable "lambda_config" {
  type = object({
    runtime       = string
    handler       = string
    memory_mb     = optional(number, 128)
    timeout_sec   = optional(number, 30)
    reserved_concurrency = optional(number, -1)
    environment   = optional(map(string), {})
    layers        = optional(list(string), [])
    vpc_enabled   = optional(bool, false)
  })
}
```

### 17. Map of lists
```hcl
variable "az_subnets" {
  type = map(list(string))
  default = {
    "us-east-1a" = ["10.0.1.0/24", "10.0.11.0/24"]
    "us-east-1b" = ["10.0.2.0/24", "10.0.12.0/24"]
    "us-east-1c" = ["10.0.3.0/24", "10.0.13.0/24"]
  }
}

locals {
  all_cidrs = flatten(values(var.az_subnets))
}
```

### 18. Nested object with list of objects
```hcl
variable "alb_config" {
  type = object({
    name            = string
    internal        = bool
    idle_timeout    = number
    target_groups   = list(object({
      name     = string
      port     = number
      protocol = string
      health_check = object({
        path     = string
        matcher  = string
      })
    }))
  })
}
```

### 19. Converting list to map with for expression
```hcl
variable "instances" {
  type = list(object({
    id   = string
    name = string
    role = string
  }))
}

locals {
  # Convert list to map keyed by name
  instance_map = { for i in var.instances : i.name => i }

  # Group by role
  by_role = {
    for i in var.instances :
    i.role => i...  # Grouped (creates map of lists)
  }
}
```

### 20. List of strings to IAM resource list
```hcl
variable "s3_buckets" {
  type    = list(string)
  default = ["app-data", "app-logs", "app-backups"]
}

locals {
  s3_arns = flatten([
    for bucket in var.s3_buckets : [
      "arn:aws:s3:::${bucket}",
      "arn:aws:s3:::${bucket}/*"
    ]
  ])
}

data "aws_iam_policy_document" "s3_access" {
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = local.s3_arns
  }
}
```

### 21. Map with complex outputs
```hcl
# modules/networking/outputs.tf
output "subnet_info" {
  value = {
    for name, subnet in aws_subnet.tiers :
    name => {
      id   = subnet.id
      cidr = subnet.cidr_block
      az   = subnet.availability_zone
      tier = var.subnet_config[name].tier
    }
  }
}
```

### 22. Consuming complex output in parent module
```hcl
module "networking" {
  source = "./modules/networking"
}

locals {
  private_subnet_ids = [
    for name, info in module.networking.subnet_info :
    info.id
    if info.tier == "private"
  ]
}
```

### 23. List index access and length safety
```hcl
locals {
  azs             = data.aws_availability_zones.available.names
  first_az        = local.azs[0]
  last_az         = local.azs[length(local.azs) - 1]
  first_three_azs = slice(local.azs, 0, min(3, length(local.azs)))
}
```

### 24. tomap() and tolist() conversions
```hcl
variable "config_pairs" {
  type = list(tuple([string, string]))
  default = [
    ["DB_HOST", "db.internal"],
    ["DB_PORT", "5432"],
    ["LOG_LEVEL", "info"],
  ]
}

locals {
  config_map = tomap({ for pair in var.config_pairs : pair[0] => pair[1] })
}
```

### 25. Multi-region config as map of objects
```hcl
variable "regional_config" {
  type = map(object({
    vpc_cidr      = string
    instance_type = string
    min_nodes     = number
    max_nodes     = number
    primary       = bool
  }))
  default = {
    "us-east-1" = { vpc_cidr = "10.0.0.0/16", instance_type = "m5.large", min_nodes = 3, max_nodes = 10, primary = true }
    "us-west-2" = { vpc_cidr = "10.1.0.0/16", instance_type = "m5.large", min_nodes = 2, max_nodes = 6,  primary = false }
  }
}
```

---

## Nested

### 26. Deeply nested object — full app config
```hcl
variable "app_config" {
  type = object({
    name        = string
    environment = string
    network = object({
      vpc_cidr  = string
      azs       = list(string)
      nat_mode  = string
    })
    compute = object({
      instance_type = string
      min_size      = number
      max_size      = number
    })
    database = object({
      engine    = string
      version   = string
      class     = string
      multi_az  = bool
      storage = object({
        allocated  = number
        max        = number
        type       = string
        encrypted  = bool
      })
    })
    features = map(bool)
  })
}
```

### 27. Map of objects with nested lists
```hcl
variable "iam_roles" {
  type = map(object({
    description      = string
    trusted_services = list(string)
    managed_policies = list(string)
    inline_policies  = map(string)
    tags             = map(string)
  }))
}

resource "aws_iam_role" "roles" {
  for_each    = var.iam_roles
  name        = each.key
  description = each.value.description

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [for svc in each.value.trusted_services : {
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = svc }
    }]
  })

  tags = each.value.tags
}

resource "aws_iam_role_policy_attachment" "roles" {
  for_each = {
    for pair in flatten([
      for role_name, role in var.iam_roles : [
        for policy_arn in role.managed_policies : {
          key    = "${role_name}::${policy_arn}"
          role   = role_name
          policy = policy_arn
        }
      ]
    ]) : pair.key => pair
  }
  role       = each.value.role
  policy_arn = each.value.policy
}
```

### 28. Complex ECS task definition variable
```hcl
variable "task_config" {
  type = object({
    family      = string
    cpu         = number
    memory      = number
    network_mode = string
    containers  = list(object({
      name      = string
      image     = string
      essential = bool
      cpu       = optional(number, 0)
      memory    = optional(number, 0)
      portMappings = optional(list(object({
        containerPort = number
        protocol      = optional(string, "tcp")
      })), [])
      environment = optional(map(string), {})
      secrets     = optional(map(string), {})
      mountPoints = optional(list(object({
        containerPath = string
        sourceVolume  = string
        readOnly      = optional(bool, false)
      })), [])
      healthCheck = optional(object({
        command  = list(string)
        interval = optional(number, 30)
        timeout  = optional(number, 5)
        retries  = optional(number, 3)
      }))
    }))
    volumes = optional(list(object({
      name = string
      efs  = optional(object({
        file_system_id  = string
        root_directory  = optional(string, "/")
      }))
    })), [])
  })
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.task_config.family
  cpu                      = var.task_config.cpu
  memory                   = var.task_config.memory
  network_mode             = var.task_config.network_mode
  requires_compatibilities = ["FARGATE"]

  container_definitions = jsonencode([
    for container in var.task_config.containers : merge(container, {
      environment = [for k, v in container.environment : { name = k, value = v }]
      secrets     = [for k, v in container.secrets : { name = k, valueFrom = v }]
    })
  ])

  dynamic "volume" {
    for_each = var.task_config.volumes
    content {
      name = volume.value.name
      dynamic "efs_volume_configuration" {
        for_each = volume.value.efs != null ? [volume.value.efs] : []
        content {
          file_system_id = efs_volume_configuration.value.file_system_id
          root_directory = efs_volume_configuration.value.root_directory
        }
      }
    }
  }
}
```

### 29. Map of firewall rule objects
```hcl
variable "firewall_rules" {
  type = map(object({
    direction   = string
    action      = string
    priority    = number
    protocol    = string
    source      = optional(string)
    destination = optional(string)
    ports       = optional(list(number), [])
    enabled     = bool
  }))
}

locals {
  enabled_rules = { for name, rule in var.firewall_rules : name => rule if rule.enabled }
  ingress_rules = { for name, rule in local.enabled_rules : name => rule if rule.direction == "ingress" }
  egress_rules  = { for name, rule in local.enabled_rules : name => rule if rule.direction == "egress" }
}
```

### 30. Aggregating list of maps from for_each modules
```hcl
module "service" {
  source   = "./modules/service"
  for_each = var.services
  name     = each.key
  config   = each.value
}

locals {
  # Aggregate all service endpoints into a single map
  all_endpoints = merge([for k, v in module.service : { (k) = v.endpoint }]...)

  # Build target group ARN map for ALB routing
  tg_arns = { for k, v in module.service : k => v.target_group_arn }
}
```

### 31. Complex Terraform data structure for Route53 records
```hcl
variable "dns_config" {
  type = object({
    zone_name = string
    records = list(object({
      name    = string
      type    = string
      ttl     = optional(number, 300)
      records = optional(list(string), [])
      alias   = optional(object({
        name    = string
        zone_id = string
        evaluate_target_health = bool
      }))
      routing_policy = optional(object({
        type           = string
        weight         = optional(number)
        set_identifier = optional(string)
        region         = optional(string)
        failover       = optional(string)
      }))
    }))
  })
}

resource "aws_route53_record" "records" {
  for_each = { for r in var.dns_config.records : "${r.name}-${r.type}" => r }
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = each.value.name
  type     = each.value.type
  ttl      = each.value.alias == null ? each.value.ttl : null
  records  = each.value.alias == null ? each.value.records : null

  dynamic "alias" {
    for_each = each.value.alias != null ? [each.value.alias] : []
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = alias.value.evaluate_target_health
    }
  }
}
```

### 32. Map of security group configs
```hcl
variable "security_groups" {
  type = map(object({
    description = string
    ingress = list(object({
      description     = string
      from_port       = number
      to_port         = number
      protocol        = string
      cidr_blocks     = optional(list(string), [])
      security_groups = optional(list(string), [])
    }))
    egress = list(object({
      from_port   = number
      to_port     = number
      protocol    = string
      cidr_blocks = list(string)
    }))
  }))
}

resource "aws_security_group" "groups" {
  for_each    = var.security_groups
  name        = each.key
  description = each.value.description
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = each.value.ingress
    content {
      description     = ingress.value.description
      from_port       = ingress.value.from_port
      to_port         = ingress.value.to_port
      protocol        = ingress.value.protocol
      cidr_blocks     = ingress.value.cidr_blocks
      security_groups = [for sg_name in ingress.value.security_groups : aws_security_group.groups[sg_name].id]
    }
  }

  dynamic "egress" {
    for_each = each.value.egress
    content {
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      protocol    = egress.value.protocol
      cidr_blocks = egress.value.cidr_blocks
    }
  }
}
```

### 33. List of backend target configs
```hcl
variable "backends" {
  type = list(object({
    name     = string
    port     = number
    protocol = string
    weight   = number
    health_check = object({
      path     = string
      interval = number
      threshold = number
    })
    stickiness = optional(object({
      enabled  = bool
      duration = number
    }))
  }))
}

resource "aws_lb_target_group" "backends" {
  for_each = { for b in var.backends : b.name => b }
  name     = each.value.name
  port     = each.value.port
  protocol = each.value.protocol
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = each.value.health_check.path
    interval            = each.value.health_check.interval
    healthy_threshold   = each.value.health_check.threshold
    unhealthy_threshold = each.value.health_check.threshold
  }

  dynamic "stickiness" {
    for_each = each.value.stickiness != null ? [each.value.stickiness] : []
    content {
      type            = "lb_cookie"
      enabled         = stickiness.value.enabled
      cookie_duration = stickiness.value.duration
    }
  }
}
```

### 34. Nested environment-region config matrix
```hcl
variable "deployment_matrix" {
  type = map(map(object({
    instance_type = string
    node_count    = number
    enable_ha     = bool
  })))
  default = {
    dev = {
      "us-east-1" = { instance_type = "t3.small",  node_count = 1, enable_ha = false }
    }
    prod = {
      "us-east-1" = { instance_type = "m5.xlarge", node_count = 3, enable_ha = true }
      "us-west-2" = { instance_type = "m5.xlarge", node_count = 3, enable_ha = true }
    }
  }
}

locals {
  # Flatten to env-region pairs
  deployments = flatten([
    for env, regions in var.deployment_matrix : [
      for region, config in regions : {
        key    = "${env}-${region}"
        env    = env
        region = region
        config = config
      }
    ]
  ])
}
```

### 35. EKS node group map with GPU support
```hcl
variable "node_groups" {
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    min_size       = number
    max_size       = number
    desired_size   = number
    labels         = optional(map(string), {})
    taints = optional(list(object({
      key    = string
      value  = string
      effect = string
    })), [])
    gpu = optional(bool, false)
    spot_override = optional(list(object({
      instance_type     = string
      weighted_capacity = number
    })), [])
  }))
}

resource "aws_eks_node_group" "groups" {
  for_each       = var.node_groups
  cluster_name   = aws_eks_cluster.main.name
  node_group_name = each.key
  node_role_arn  = aws_iam_role.node.arn
  subnet_ids     = aws_subnet.private[*].id
  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type
  labels         = each.value.labels

  dynamic "taint" {
    for_each = each.value.taints
    content {
      key    = taint.value.key
      value  = taint.value.value
      effect = taint.value.effect
    }
  }

  scaling_config {
    min_size     = each.value.min_size
    max_size     = each.value.max_size
    desired_size = each.value.desired_size
  }

  lifecycle { ignore_changes = [scaling_config[0].desired_size] }
}
```

### 36. Complex SSM parameter map
```hcl
variable "app_parameters" {
  type = map(object({
    value       = string
    type        = string
    description = string
    tier        = optional(string, "Standard")
    tags        = optional(map(string), {})
  }))
}

resource "aws_ssm_parameter" "params" {
  for_each    = var.app_parameters
  name        = "/${var.project}/${var.environment}/${each.key}"
  value       = each.value.value
  type        = each.value.type
  description = each.value.description
  tier        = each.value.tier
  key_id      = each.value.type == "SecureString" ? aws_kms_key.ssm.id : null
  tags        = merge(local.common_tags, each.value.tags)
}
```

### 37. Flattening multi-level config into for_each map
```hcl
variable "account_resources" {
  type = map(object({
    account_id = string
    buckets    = list(string)
    roles      = list(string)
  }))
}

locals {
  # Flatten: all bucket names across all accounts
  all_buckets = flatten([
    for env, config in var.account_resources : [
      for bucket in config.buckets : {
        key        = "${env}-${bucket}"
        env        = env
        bucket     = bucket
        account_id = config.account_id
      }
    ]
  ])

  bucket_map = { for b in local.all_buckets : b.key => b }
}
```

---

## Advanced

### 38. Full VPC config as single complex variable
```hcl
variable "vpc_definition" {
  type = object({
    name       = string
    cidr       = string
    enable_dns = optional(bool, true)

    subnets = object({
      public = list(object({
        cidr = string
        az   = string
        tags = optional(map(string), {})
      }))
      private = list(object({
        cidr = string
        az   = string
        tags = optional(map(string), {})
      }))
      data = optional(list(object({
        cidr = string
        az   = string
      })), [])
    })

    nat_gateway = object({
      enabled  = bool
      per_az   = optional(bool, false)
    })

    endpoints = optional(map(object({
      type    = string  # "Gateway" | "Interface"
      enabled = bool
    })), {})

    flow_logs = optional(object({
      enabled           = bool
      retention_days    = number
      traffic_type      = string
    }))
  })
}
```

### 39. Using complex variable in downstream resources
```hcl
locals {
  vpc = var.vpc_definition

  public_subnet_map  = { for s in local.vpc.subnets.public  : "${local.vpc.name}-public-${s.az}"  => s }
  private_subnet_map = { for s in local.vpc.subnets.private : "${local.vpc.name}-private-${s.az}" => s }
  data_subnet_map    = { for s in local.vpc.subnets.data    : "${local.vpc.name}-data-${s.az}"    => s }
}

resource "aws_vpc" "main" {
  cidr_block           = local.vpc.cidr
  enable_dns_hostnames = local.vpc.enable_dns
  enable_dns_support   = local.vpc.enable_dns
  tags = { Name = local.vpc.name }
}

resource "aws_subnet" "public" {
  for_each          = local.public_subnet_map
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az
  map_public_ip_on_launch = true
  tags = merge({ Name = each.key }, each.value.tags)
}
```

### 40. Typed list with constraints for ECS services
```hcl
variable "ecs_services" {
  type = list(object({
    name         = string
    image        = string
    port         = number
    cpu          = number
    memory       = number
    desired      = number
    min_capacity = number
    max_capacity = number
    environment  = optional(map(string), {})
    secrets      = optional(map(string), {})
    health_check = optional(object({
      path    = string
      matcher = string
    }), { path = "/health", matcher = "200-299" })
  }))

  validation {
    condition     = alltrue([for s in var.ecs_services : s.cpu <= s.memory])
    error_message = "CPU must not exceed memory for any ECS service."
  }

  validation {
    condition     = alltrue([for s in var.ecs_services : s.min_capacity <= s.desired && s.desired <= s.max_capacity])
    error_message = "desired must be between min_capacity and max_capacity."
  }
}
```

### 41. Cross-referencing complex maps
```hcl
variable "service_dependencies" {
  type = map(list(string))
  default = {
    api     = ["db", "cache"]
    worker  = ["db", "queue"]
    cron    = ["db"]
    gateway = ["api"]
  }
}

locals {
  # Build security group ingress rules from service deps
  sg_ingress_rules = flatten([
    for service, deps in var.service_dependencies : [
      for dep in deps : {
        key      = "${dep}-to-${service}"
        from_sg  = dep
        to_sg    = service
        port     = lookup(var.service_ports, service, 8080)
      }
    ]
  ])
}
```

### 42. Multi-account IAM config as nested map
```hcl
variable "account_iam_config" {
  type = map(object({
    account_id = string
    roles = map(object({
      trusted_entities = list(string)
      policies         = list(string)
      permission_boundary = optional(string)
    }))
    service_control_policies = optional(list(string), [])
  }))
}

locals {
  # Flatten to all role definitions
  all_roles = flatten([
    for account_name, account in var.account_iam_config : [
      for role_name, role in account.roles : {
        key        = "${account_name}::${role_name}"
        account    = account_name
        role       = role_name
        account_id = account.account_id
        config     = role
      }
    ]
  ])
}
```

### 43. Typed module input aggregating all configs
```hcl
variable "platform_config" {
  type = object({
    project     = string
    environment = string
    region      = string
    account_id  = string

    network = object({
      cidr            = string
      enable_nat      = bool
      enable_vpc_flow = bool
    })

    compute = object({
      platform       = string
      instance_type  = string
      min_nodes      = number
      max_nodes      = number
      spot_enabled   = bool
    })

    data = object({
      rds_engine        = string
      rds_class         = string
      multi_az          = bool
      enable_redis      = bool
      redis_node_type   = string
    })

    observability = object({
      log_retention_days = number
      enable_xray        = bool
      enable_cloudwatch  = bool
    })

    security = object({
      enable_guardduty   = bool
      enable_securityhub = bool
      enable_waf         = bool
      kms_deletion_days  = number
    })
  })
}
```

### 44. Instance fleet config with mixed types
```hcl
variable "fleet_config" {
  type = object({
    on_demand_base     = number
    on_demand_percent  = number
    spot_allocation    = string
    instance_pools     = number
    override = list(object({
      instance_type     = string
      weighted_capacity = optional(number, 1)
    }))
  })
  default = {
    on_demand_base    = 2
    on_demand_percent = 30
    spot_allocation   = "diversified"
    instance_pools    = 4
    override = [
      { instance_type = "m5.large",   weighted_capacity = 1 }
      { instance_type = "m5a.large",  weighted_capacity = 1 }
      { instance_type = "m5n.large",  weighted_capacity = 1 }
      { instance_type = "m4.large",   weighted_capacity = 1 }
    ]
  }
}

resource "aws_autoscaling_group" "fleet" {
  name             = "${var.project}-fleet"
  min_size         = 2
  max_size         = 20
  desired_capacity = 4
  vpc_zone_identifier = aws_subnet.private[*].id

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = var.fleet_config.on_demand_base
      on_demand_percentage_above_base_capacity = var.fleet_config.on_demand_percent
      spot_allocation_strategy                 = var.fleet_config.spot_allocation
      spot_instance_pools                      = var.fleet_config.instance_pools
    }
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }
      dynamic "override" {
        for_each = var.fleet_config.override
        content {
          instance_type     = override.value.instance_type
          weighted_capacity = tostring(override.value.weighted_capacity)
        }
      }
    }
  }
}
```

### 45. RDS parameter groups as typed list
```hcl
variable "db_parameters" {
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string, "immediate")
  }))
  default = [
    { name = "shared_preload_libraries",  value = "pg_stat_statements,auto_explain" }
    { name = "log_min_duration_statement", value = "1000" }
    { name = "max_connections",            value = "200" }
    { name = "work_mem",                   value = "65536" }
    { name = "random_page_cost",           value = "1.1", apply_method = "pending-reboot" }
  ]
}

resource "aws_db_parameter_group" "custom" {
  name   = "${var.project}-${var.engine}-params"
  family = "${var.engine}${var.major_version}"

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

### 46. Complete SQS/SNS fan-out topology
```hcl
variable "event_topology" {
  type = object({
    topics = map(object({
      display_name    = string
      subscribers     = list(string)
      kms_encrypted   = bool
    }))
    queues = map(object({
      visibility_timeout = number
      message_retention  = number
      enable_dlq         = bool
      dlq_max_receives   = optional(number, 3)
      fifo               = optional(bool, false)
    }))
    subscriptions = list(object({
      topic_key       = string
      queue_key       = string
      filter_policy   = optional(string)
      raw_delivery    = optional(bool, false)
    }))
  })
}

resource "aws_sns_topic" "topics" {
  for_each     = var.event_topology.topics
  name         = each.key
  display_name = each.value.display_name
  kms_master_key_id = each.value.kms_encrypted ? aws_kms_key.sns.id : null
}

resource "aws_sqs_queue" "queues" {
  for_each                  = var.event_topology.queues
  name                      = each.value.fifo ? "${each.key}.fifo" : each.key
  fifo_queue                = each.value.fifo
  visibility_timeout_seconds = each.value.visibility_timeout
  message_retention_seconds = each.value.message_retention
  redrive_policy = each.value.enable_dlq ? jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlqs[each.key].arn
    maxReceiveCount     = each.value.dlq_max_receives
  }) : null
}
```

### 47. Global CDN config as object
```hcl
variable "cdn_config" {
  type = object({
    origins = map(object({
      domain    = string
      path      = optional(string, "")
      custom_headers = optional(map(string), {})
      connection_attempts = optional(number, 3)
    }))
    behaviors = list(object({
      path_pattern      = string
      origin_key        = string
      cache_policy      = string
      viewer_protocol   = string
      compress          = optional(bool, true)
      allowed_methods   = optional(list(string), ["GET", "HEAD"])
      cached_methods    = optional(list(string), ["GET", "HEAD"])
    }))
    geo_restriction = optional(object({
      type      = string
      locations = list(string)
    }), { type = "none", locations = [] })
    waf_acl_arn = optional(string)
    logging     = optional(object({
      bucket_name   = string
      prefix        = optional(string, "cdn/")
    }))
  })
}
```

### 48. Outputs aggregating complex structures
```hcl
output "infrastructure_summary" {
  value = {
    vpc = {
      id     = aws_vpc.main.id
      cidr   = aws_vpc.main.cidr_block
      subnets = {
        public  = values(aws_subnet.public)[*].id
        private = values(aws_subnet.private)[*].id
      }
    }
    compute = {
      cluster_name   = try(aws_ecs_cluster.main[0].name, null)
      asg_name       = try(aws_autoscaling_group.app[0].name, null)
    }
    data = {
      db_endpoint    = try(aws_db_instance.main[0].endpoint, null)
      cache_endpoint = try(aws_elasticache_replication_group.cache[0].primary_endpoint_address, null)
    }
    endpoints = {
      alb_dns        = try(aws_lb.app[0].dns_name, null)
      cloudfront     = try(aws_cloudfront_distribution.cdn[0].domain_name, null)
      api_gateway    = try(aws_api_gateway_stage.main[0].invoke_url, null)
    }
  }
  sensitive = false
}
```

### 49. Schema-validated service registry
```hcl
variable "service_registry" {
  type = map(object({
    version  = string
    image    = string
    replicas = number
    resources = object({
      cpu_units    = number
      memory_mb    = number
      cpu_reserved = optional(number)
    })
    scaling = object({
      min     = number
      max     = number
      target_cpu    = optional(number, 60)
      target_memory = optional(number, 80)
    })
    networking = object({
      port          = number
      protocol      = optional(string, "HTTP")
      health_path   = optional(string, "/health")
      grpc_enabled  = optional(bool, false)
    })
    dependencies = optional(list(string), [])
    feature_flags = optional(map(bool), {})
  }))

  validation {
    condition     = alltrue([for k, v in var.service_registry : v.scaling.min <= v.replicas])
    error_message = "Initial replicas must be >= scaling.min for all services."
  }
}
```

### 50. Full monorepo infrastructure variable driving all resources
```hcl
variable "infra" {
  type = object({
    project     = string
    environment = string
    owner       = string
    cost_center = string

    networking = object({
      vpc_cidr   = string
      azs        = list(string)
      subnets = object({
        public    = list(string)
        private   = list(string)
        data      = list(string)
      })
      nat_mode   = string  # "none" | "single" | "per_az"
    })

    services = map(object({
      enabled      = bool
      image        = optional(string)
      cpu          = optional(number, 256)
      memory       = optional(number, 512)
      min_count    = optional(number, 1)
      max_count    = optional(number, 5)
      port         = optional(number, 8080)
      env          = optional(map(string), {})
      secrets      = optional(map(string), {})
      depends_on   = optional(list(string), [])
    }))

    data_stores = object({
      rds = optional(object({
        enabled        = bool
        engine         = string
        version        = string
        class          = string
        storage_gb     = number
        multi_az       = bool
        read_replicas  = number
      }))
      elasticache = optional(object({
        enabled    = bool
        engine     = string
        node_type  = string
        num_nodes  = number
      }))
    })

    observability = object({
      log_retention_days    = number
      enable_xray           = bool
      enable_cloudwatch     = bool
      alarm_sns_topic_arn   = optional(string)
    })
  })
}
```
