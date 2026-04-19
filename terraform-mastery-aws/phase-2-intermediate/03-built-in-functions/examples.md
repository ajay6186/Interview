# Examples 2.3 — Built-in Functions (50 examples)

---

## Basic

### 1. format — string formatting
```hcl
locals {
  bucket_name = format("myapp-%s-%s", var.environment, var.region)
  # "myapp-production-us-east-1"

  resource_name = format("%s-%s-%03d", var.app, var.env, count.index + 1)
  # "api-prod-001"
}
```

### 2. join — concatenate list elements
```hcl
locals {
  sg_description = join(", ", ["Allow HTTP", "Allow HTTPS", "Allow SSH"])
  # "Allow HTTP, Allow HTTPS, Allow SSH"

  arn_list = join("\n", aws_subnet.public[*].arn)
}
```

### 3. split — split string into list
```hcl
variable "subnet_cidrs" {
  type    = string
  default = "10.0.1.0/24,10.0.2.0/24,10.0.3.0/24"
}

locals {
  subnet_list = split(",", var.subnet_cidrs)
  # ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}
```

### 4. length — count elements
```hcl
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
}
```

### 5. merge — combine maps
```hcl
locals {
  common_tags = {
    ManagedBy   = "terraform"
    Environment = var.environment
  }
  resource_tags = {
    Name = "web-server"
    Tier = "public"
  }
  tags = merge(local.common_tags, local.resource_tags)
  # { ManagedBy = "terraform", Environment = "prod", Name = "web-server", Tier = "public" }
}
```

### 6. lookup — safe map access with default
```hcl
variable "instance_types" {
  type = map(string)
  default = {
    dev  = "t3.micro"
    prod = "t3.large"
  }
}

locals {
  instance_type = lookup(var.instance_types, var.environment, "t3.micro")
}
```

### 7. element — access list by index (wraps around)
```hcl
variable "azs" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

resource "aws_subnet" "public" {
  count             = 5
  availability_zone = element(var.azs, count.index)
  # Cycles: 1a, 1b, 1c, 1a, 1b
}
```

### 8. lower / upper / title
```hcl
locals {
  env_lower = lower(var.environment)      # "PROD" → "prod"
  env_upper = upper(var.environment)      # "prod" → "PROD"
  name_title = title("web server")        # "Web Server"
}
```

### 9. trimspace — strip whitespace
```hcl
variable "bucket_name" {
  type = string
}

locals {
  clean_name = trimspace(var.bucket_name)  # remove leading/trailing spaces
}
```

### 10. toset — convert list to set (deduplicates)
```hcl
locals {
  unique_azs = toset(["us-east-1a", "us-east-1b", "us-east-1a", "us-east-1c"])
  # toset(["us-east-1a", "us-east-1b", "us-east-1c"])
}

resource "aws_subnet" "main" {
  for_each = toset(var.azs)
  availability_zone = each.key
}
```

### 11. tolist / tomap — type conversion
```hcl
locals {
  az_set  = toset(["us-east-1a", "us-east-1b"])
  az_list = tolist(local.az_set)           # convert back to list

  str_map = tomap({ a = "1", b = "2" })   # convert object to map
}
```

### 12. file — read file content
```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  user_data     = file("${path.module}/scripts/user_data.sh")
}
```

---

## Intermediate

### 13. flatten — flatten nested lists
```hcl
variable "vpc_subnets" {
  type = map(list(string))
  default = {
    us-east-1 = ["10.0.1.0/24", "10.0.2.0/24"]
    us-west-2 = ["10.1.1.0/24", "10.1.2.0/24"]
  }
}

locals {
  all_cidrs = flatten(values(var.vpc_subnets))
  # ["10.0.1.0/24", "10.0.2.0/24", "10.1.1.0/24", "10.1.2.0/24"]
}
```

### 14. distinct — remove duplicates from list
```hcl
locals {
  all_sg_ids     = ["sg-001", "sg-002", "sg-001", "sg-003"]
  unique_sg_ids  = distinct(local.all_sg_ids)
  # ["sg-001", "sg-002", "sg-003"]
}
```

### 15. concat — merge multiple lists
```hcl
locals {
  all_subnet_ids = concat(
    aws_subnet.public[*].id,
    aws_subnet.private[*].id,
    aws_subnet.database[*].id
  )
}
```

### 16. keys / values — map operations
```hcl
variable "service_ports" {
  type = map(number)
  default = { http = 80, https = 443, ssh = 22 }
}

locals {
  service_names = keys(var.service_ports)    # ["http", "https", "ssh"]
  port_numbers  = values(var.service_ports)  # [80, 443, 22]
}
```

### 17. zipmap — create map from keys and values
```hcl
locals {
  names     = ["web", "api", "db"]
  ports     = [80, 8080, 5432]
  port_map  = zipmap(local.names, local.ports)
  # { web = 80, api = 8080, db = 5432 }
}
```

### 18. cidrsubnet — calculate subnets
```hcl
locals {
  vpc_cidr = "10.0.0.0/16"

  # Create 8 subnets with /24 prefix
  subnets = [for i in range(8) : cidrsubnet(local.vpc_cidr, 8, i)]
  # ["10.0.0.0/24", "10.0.1.0/24", ..., "10.0.7.0/24"]
}
```

### 19. jsonencode / jsondecode
```hcl
locals {
  container_definitions = jsonencode([{
    name      = "app"
    image     = "${var.ecr_repo}:${var.image_tag}"
    cpu       = 256
    memory    = 512
    essential = true
    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "ENV",      value = var.environment },
      { name = "LOG_LEVEL", value = "info" },
    ]
  }])
}
```

### 20. base64encode / filebase64
```hcl
# Encode user_data for EC2
locals {
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    EOF
  )
}

resource "aws_instance" "web" {
  user_data_base64 = local.user_data
}

# Or use filebase64 directly
resource "aws_instance" "web" {
  user_data_base64 = filebase64("${path.module}/scripts/bootstrap.sh")
}
```

### 21. formatdate / timestamp
```hcl
locals {
  deploy_timestamp = formatdate("YYYY-MM-DD'T'hh:mm:ssZ", timestamp())
  deploy_date      = formatdate("YYYY-MM-DD", timestamp())
  deploy_epoch     = timestamp()  # RFC 3339 format
}

resource "aws_ssm_parameter" "deploy_time" {
  name  = "/app/last_deploy"
  type  = "String"
  value = local.deploy_timestamp
}
```

### 22. replace — string substitution
```hcl
locals {
  # Replace underscores with hyphens (AWS doesn't allow underscores in some names)
  bucket_name = replace(lower(var.app_name), "_", "-")

  # Remove special characters
  safe_name = replace(var.resource_name, "/[^a-zA-Z0-9-]/", "")
}
```

### 23. substr — extract substring
```hcl
locals {
  # Use first 8 chars of commit SHA for versioning
  short_sha = substr(var.git_sha, 0, 8)

  # Truncate long names for resource naming limits
  short_name = substr(var.app_name, 0, 20)
}
```

### 24. max / min — numeric functions
```hcl
variable "desired_capacity" {
  type    = number
  default = 5
}

locals {
  # Ensure desired is within min/max bounds
  safe_desired = max(var.min_size, min(var.max_size, var.desired_capacity))
}
```

### 25. can / try — safe expression evaluation
```hcl
variable "config" {
  type    = any
  default = {}
}

locals {
  # Safely access nested attribute that might not exist
  db_host = try(var.config.database.host, "localhost")
  port    = can(var.config.port) ? var.config.port : 5432

  # Try multiple fallbacks
  image_tag = try(
    var.config.image.tag,
    var.image_tag,
    "latest"
  )
}
```

---

## Nested

### 26. Nested flatten + merge for multi-region subnets
```hcl
variable "regions" {
  type = map(object({
    vpc_cidr = string
    az_count = number
  }))
}

locals {
  # Generate all subnet CIDRs across regions
  all_subnets = flatten([
    for region, config in var.regions : [
      for i in range(config.az_count) : {
        region = region
        cidr   = cidrsubnet(config.vpc_cidr, 8, i)
        index  = i
      }
    ]
  ])
}
```

### 27. cidrsubnet in for expression for dynamic subnets
```hcl
locals {
  vpc_cidr       = "10.0.0.0/16"
  az_count       = length(data.aws_availability_zones.available.names)

  public_subnets  = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i)]
  private_subnets = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 10)]
  db_subnets      = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 20)]
  intra_subnets   = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 30)]
}
```

### 28. Complex jsonencode for IAM policy
```hcl
locals {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      for bucket in var.s3_buckets : {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          "arn:aws:s3:::${bucket}",
          "arn:aws:s3:::${bucket}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "s3_access" {
  name   = "s3-multi-bucket-access"
  policy = local.policy
}
```

### 29. Dynamic label generation with merge + format
```hcl
locals {
  base_tags = {
    ManagedBy   = "terraform"
    Environment = var.environment
    Project     = var.project
    Owner       = var.team
  }

  # Per-resource tags merged with base
  tags = {
    for resource_name, resource_tags in var.resource_tag_overrides :
    resource_name => merge(local.base_tags, resource_tags, {
      Name = format("%s-%s-%s", var.project, resource_name, var.environment)
    })
  }
}
```

### 30. Functions for ECS container definitions
```hcl
locals {
  containers = [
    for svc in var.services : {
      name      = svc.name
      image     = format("%s.dkr.ecr.%s.amazonaws.com/%s:%s",
                    data.aws_caller_identity.current.account_id,
                    var.region, svc.name, svc.tag)
      cpu       = svc.cpu
      memory    = svc.memory
      essential = svc.name == var.primary_service
      portMappings = svc.port != null ? [{ containerPort = svc.port }] : []
      environment = [
        for k, v in merge(var.common_env, svc.env) :
        { name = k, value = v }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app}-${svc.name}"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ]
}
```

### 31. Nested setproduct for matrix configuration
```hcl
locals {
  regions     = ["us-east-1", "us-west-2", "eu-west-1"]
  environments = ["staging", "production"]

  # Create all region × environment combinations
  deployments = {
    for pair in setproduct(local.regions, local.environments) :
    "${pair[0]}-${pair[1]}" => {
      region      = pair[0]
      environment = pair[1]
    }
  }
}
```

### 32. Safe nested attribute access with try()
```hcl
variable "cluster_config" {
  type = any
  default = {}
}

locals {
  # Deeply nested optional config
  node_config = {
    instance_type   = try(var.cluster_config.nodes.instance_type, "t3.medium")
    min_size        = try(var.cluster_config.nodes.autoscaling.min, 2)
    max_size        = try(var.cluster_config.nodes.autoscaling.max, 10)
    disk_size       = try(var.cluster_config.nodes.disk.size_gb, 50)
    labels          = try(var.cluster_config.nodes.labels, {})
  }
}
```

### 33. cidrhost for static IP assignments
```hcl
locals {
  vpc_cidr = "10.0.0.0/16"
  subnet   = cidrsubnet(local.vpc_cidr, 8, 1)  # 10.0.1.0/24

  # Assign static IPs within subnet
  gateway_ip  = cidrhost(local.subnet, 1)   # 10.0.1.1
  dns_ip      = cidrhost(local.subnet, 2)   # 10.0.1.2
  reserved_ip = cidrhost(local.subnet, -1)  # 10.0.1.255 (last)
}
```

---

## Advanced

### 34. regex and regexall
```hcl
variable "arn" {
  type    = string
  default = "arn:aws:iam::123456789012:role/MyRole"
}

locals {
  # Extract account ID from ARN
  account_id = regex("arn:aws[^:]*:iam::([0-9]+):.*", var.arn)[0]
  # "123456789012"

  # Find all IP addresses in a string
  ips = regexall("\\d+\\.\\d+\\.\\d+\\.\\d+", var.ip_string)
}
```

### 35. alltrue / anytrue for list boolean checks
```hcl
variable "subnet_configs" {
  type = list(object({
    public  = bool
    encrypt = bool
  }))
}

locals {
  all_encrypted  = alltrue([for s in var.subnet_configs : s.encrypt])
  any_public     = anytrue([for s in var.subnet_configs : s.public])
}

resource "null_resource" "validation" {
  lifecycle {
    precondition {
      condition     = local.all_encrypted
      error_message = "All subnets must have encryption enabled."
    }
  }
}
```

### 36. chunklist — split list into batches
```hcl
variable "instance_ids" {
  type = list(string)
}

locals {
  # Process instances in batches of 10
  batches = chunklist(var.instance_ids, 10)
  # [[id1..id10], [id11..id20], ...]
}

resource "aws_ssm_association" "patch" {
  count = length(local.batches)
  name  = "AWS-RunPatchBaseline"
  targets {
    key    = "InstanceIds"
    values = local.batches[count.index]
  }
}
```

### 37. transpose — invert a map of lists
```hcl
locals {
  # Map of role → list of accounts
  role_accounts = {
    admin  = ["111111111111", "222222222222"]
    viewer = ["111111111111", "333333333333"]
  }

  # Transpose: map of account → list of roles
  account_roles = transpose(local.role_accounts)
  # {
  #   "111111111111" = ["admin", "viewer"]
  #   "222222222222" = ["admin"]
  #   "333333333333" = ["viewer"]
  # }
}
```

### 38. Complex IP range calculations
```hcl
variable "base_cidr" {
  type    = string
  default = "10.0.0.0/8"
}

locals {
  # /8 → /16 VPCs for each environment
  vpc_cidrs = {
    dev     = cidrsubnet(var.base_cidr, 8, 0)   # 10.0.0.0/16
    staging = cidrsubnet(var.base_cidr, 8, 1)   # 10.1.0.0/16
    prod    = cidrsubnet(var.base_cidr, 8, 2)   # 10.2.0.0/16
  }

  # Within each /16, carve out /24 subnets
  all_subnets = {
    for env, vpc in local.vpc_cidrs : env => {
      public   = [for i in range(3) : cidrsubnet(vpc, 8, i)]
      private  = [for i in range(3) : cidrsubnet(vpc, 8, i + 10)]
      database = [for i in range(3) : cidrsubnet(vpc, 8, i + 20)]
    }
  }
}
```

### 39. yamlencode for configuration generation
```hcl
locals {
  kubeconfig = yamlencode({
    apiVersion = "v1"
    kind       = "Config"
    clusters = [{
      name = var.cluster_name
      cluster = {
        server                   = aws_eks_cluster.main.endpoint
        certificate-authority-data = aws_eks_cluster.main.certificate_authority[0].data
      }
    }]
    users = [{
      name = "terraform"
      user = { token = data.aws_eks_cluster_auth.main.token }
    }]
    contexts = [{
      name = var.cluster_name
      context = {
        cluster = var.cluster_name
        user    = "terraform"
      }
    }]
    current-context = var.cluster_name
  })
}
```

### 40. Dynamic IAM policy generation with functions
```hcl
variable "s3_access" {
  type = list(object({
    bucket     = string
    actions    = list(string)
    prefix     = optional(string, "")
  }))
}

locals {
  statements = [
    for access in var.s3_access : {
      Effect   = "Allow"
      Action   = access.actions
      Resource = access.prefix != "" ? [
        "arn:aws:s3:::${access.bucket}/${access.prefix}*"
      ] : [
        "arn:aws:s3:::${access.bucket}",
        "arn:aws:s3:::${access.bucket}/*"
      ]
    }
  ]

  policy_json = jsonencode({
    Version   = "2012-10-17"
    Statement = local.statements
  })
}
```

### 41. String templates and multi-line heredoc
```hcl
locals {
  user_data = <<-EOT
    #!/bin/bash
    set -e
    
    # Configure application
    cat > /etc/app/config.json <<'EOF'
    ${jsonencode({
      environment = var.environment
      region      = var.region
      log_level   = var.environment == "production" ? "warn" : "debug"
      endpoints   = {
        api = "https://api.${var.domain}"
        db  = var.db_host
      }
    })}
    EOF
    
    # Start application
    systemctl start app
    systemctl enable app
  EOT
}
```

### 42. Functions for generating security group rules
```hcl
variable "allowed_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

locals {
  # Generate egress rules for each CIDR
  egress_rules = [
    for cidr in var.allowed_cidrs : {
      from_port   = 0
      to_port     = 65535
      protocol    = "tcp"
      cidr_blocks = [cidr]
      description = "Allow egress to ${cidr}"
    }
  ]
}
```

### 43. formatdate for resource lifecycle management
```hcl
locals {
  # Generate monthly rotation identifier
  month_key = formatdate("YYYY-MM", timestamp())

  # AMI name with date
  ami_name = "app-ami-${formatdate("YYYY-MM-DD", timestamp())}"

  # Expiry date 90 days from now
  cert_expiry = timeadd(timestamp(), "2160h")  # 90 days in hours
}
```

### 44. Complex merge for layered configuration
```hcl
locals {
  defaults = {
    instance_type   = "t3.micro"
    disk_size       = 20
    enable_backups  = false
    tags            = { ManagedBy = "terraform" }
  }

  env_overrides = lookup({
    production = {
      instance_type  = "t3.large"
      disk_size      = 100
      enable_backups = true
    }
  }, var.environment, {})

  # Merge with deep-merge for tags
  config = merge(local.defaults, local.env_overrides, {
    tags = merge(
      local.defaults.tags,
      lookup(local.env_overrides, "tags", {}),
      var.extra_tags
    )
  })
}
```

### 45. Function-driven security group CIDR validation
```hcl
variable "allowed_ips" {
  type = list(string)
  validation {
    condition = alltrue([
      for ip in var.allowed_ips :
      can(cidrnetmask(ip))  # validates CIDR notation
    ])
    error_message = "All values must be valid CIDR notation (e.g., 10.0.0.0/24)."
  }
}
```

### 46. Generating resource names with functions
```hcl
locals {
  # Consistent naming: {org}-{project}-{environment}-{region_short}-{resource}
  region_short = {
    "us-east-1"      = "use1"
    "us-west-2"      = "usw2"
    "eu-west-1"      = "euw1"
    "ap-southeast-1" = "apse1"
  }

  name_prefix = join("-", compact([
    var.org,
    var.project,
    var.environment,
    lookup(local.region_short, var.region, replace(var.region, "-", ""))
  ]))

  # Example: "acme-platform-prod-use1"
  names = {
    vpc    = "${local.name_prefix}-vpc"
    alb    = "${local.name_prefix}-alb"
    bucket = "${local.name_prefix}-${random_id.suffix.hex}"
  }
}
```

### 47. tostring / tonumber / tobool
```hcl
locals {
  port_string  = tostring(8080)          # "8080"
  port_number  = tonumber("8080")        # 8080
  is_enabled   = tobool("true")          # true
  
  # Useful when API returns strings that should be numbers
  desired_cap  = tonumber(var.capacity_string)
}
```

### 48. sum and index functions
```hcl
variable "node_counts" {
  type    = list(number)
  default = [3, 2, 5]
}

locals {
  total_nodes  = sum(var.node_counts)  # 10
  first_match  = index(var.azs, "us-east-1a")  # 0
}
```

### 49. Functions for user_data bootstrap script
```hcl
locals {
  packages = ["httpd", "mod_ssl", "awscli", "amazon-cloudwatch-agent"]

  user_data = base64encode(templatefile("${path.module}/templates/userdata.sh.tftpl", {
    packages     = join(" ", local.packages)
    app_name     = var.app_name
    environment  = var.environment
    ssm_prefix   = "/${var.environment}/${var.app_name}"
    region       = var.region
    log_group    = "/aws/ec2/${var.app_name}"
  }))
}
```

### 50. Complete function showcase for VPC module
```hcl
data "aws_availability_zones" "available" { state = "available" }

locals {
  vpc_cidr   = "10.0.0.0/16"
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
  az_count   = length(local.azs)

  # Subnet CIDR generation
  public_cidrs   = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i)]
  private_cidrs  = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 10)]
  database_cidrs = [for i in range(local.az_count) : cidrsubnet(local.vpc_cidr, 8, i + 20)]

  # All subnets as flat list
  all_cidrs = concat(local.public_cidrs, local.private_cidrs, local.database_cidrs)

  # Name generation
  env        = lower(var.environment)
  region_short = lookup(local.region_map, var.region, replace(var.region, "-", ""))

  name_prefix = format("%s-%s-%s", var.project, local.env, local.region_short)

  # Tag generation
  base_tags = {
    Project     = var.project
    Environment = local.env
    ManagedBy   = "terraform"
    Region      = var.region
    DeployedAt  = formatdate("YYYY-MM-DD", timestamp())
  }

  subnet_tags = {
    for i, az in local.azs :
    az => merge(local.base_tags, {
      AvailabilityZone = az
      AzIndex          = tostring(i)
    })
  }
}
```
